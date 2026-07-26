import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Simple file-backed persistence store for multi-turn runs
const DB_FILE = path.join(process.cwd(), "db.json");

interface UserPermissions {
  uploadInvoices: boolean;
  deleteInvoices: boolean;
  editBudgets: boolean;
  viewAnalytics: boolean;
  manageTeam: boolean;
  manageBilling: boolean;
}

interface DbUser {
  email: string;
  password?: string;
  company_id: string | null;
  role: "admin" | "accountant" | "purchaser" | "member" | null;
  position?: string | null;
  permissions?: UserPermissions;
  is_platform_owner: boolean;
  status?: "active" | "revoked";
}

interface DbInvite {
  token: string;
  email: string;
  name: string;
  position: string;
  company_id: string;
  permissions: UserPermissions;
  expires_at: string;
  status: "pending" | "accepted" | "revoked";
}

interface DbSchema {
  users: Record<string, DbUser>;
  companies: Record<string, {
    id: string;
    name: string;
  }>;
  subscriptions: Record<string, {
    company_id: string;
    tier: "single" | "multi";
    status: string;
  }>;
  invites?: Record<string, DbInvite>;
}

function loadDb(): DbSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      if (!data.invites) data.invites = {};
      return data;
    } catch (_) {}
  }
  return { users: {}, companies: {}, subscriptions: {}, invites: {} };
}

function saveDb(db: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write database file:", err);
  }
}

function formatUserResponse(user: DbUser, db: DbSchema) {
  const company = user.company_id ? db.companies[user.company_id] : null;
  const isOwner = !!user.is_platform_owner;
  const isOwnerOrAdmin = isOwner || user.role === "admin";
  
  const defaultPermissions: UserPermissions = {
    uploadInvoices: true,
    deleteInvoices: isOwnerOrAdmin,
    editBudgets: isOwnerOrAdmin,
    viewAnalytics: true,
    manageTeam: isOwner,
    manageBilling: isOwnerOrAdmin,
  };

  const permissions = user.permissions ? { ...defaultPermissions, ...user.permissions } : defaultPermissions;
  
  // Non-owner / invited users NEVER get team management permissions
  if (!isOwner) {
    permissions.manageTeam = false;
  }

  return {
    email: user.email,
    company_id: user.company_id || null,
    company_name: company ? company.name : null,
    role: user.role || null,
    position: user.position || (isOwnerOrAdmin ? "ადმინისტრატორი" : "თანამშრომელი"),
    permissions,
    is_platform_owner: isOwner,
    status: user.status || "active"
  };
}

// Ensure database file has some initial structure
if (!fs.existsSync(DB_FILE)) {
  saveDb({ users: {}, companies: {}, subscriptions: {}, invites: {} });
}

const app = express();
const PORT = 3000;

// Increase limit to handle base64 document payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Authentication middleware to extract user from Authorization header
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing token" });
    return;
  }

  const token = authHeader.substring(7);
  if (!token.startsWith("session-token-")) {
    res.status(401).json({ error: "Unauthorized: Invalid token format" });
    return;
  }

  const email = token.substring("session-token-".length);
  const db = loadDb();
  const user = db.users[email];
  if (!user) {
    res.status(401).json({ error: "Unauthorized: User not found" });
    return;
  }

  if (user.status === "revoked") {
    res.status(403).json({ error: "თქვენი წვდომა გაუქმებულია ამ სისტემაზე" });
    return;
  }

  (req as any).user = user;
  next();
}

let aiInstance: GoogleGenAI | null = null;


function getGeminiClient(): GoogleGenAI {
  if (aiInstance) return aiInstance;
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it in Settings > Secrets.");
  }
  
  aiInstance = new GoogleGenAI({
    apiKey: apiKey,
  });
  return aiInstance;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Authentication - Signup
app.post("/api/signup", (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const db = loadDb();
  if (db.users[email]) {
    res.status(400).json({ error: "User already exists" });
    return;
  }
  const user: DbUser = {
    email,
    password,
    company_id: null,
    role: null,
    position: "თანამშრომელი",
    permissions: {
      uploadInvoices: true,
      deleteInvoices: false,
      editBudgets: false,
      viewAnalytics: true,
      manageTeam: false,
      manageBilling: false
    },
    is_platform_owner: false,
    status: "active"
  };
  db.users[email] = user;
  saveDb(db);
  res.json({ 
    token: `session-token-${email}`, 
    user: formatUserResponse(user, db)
  });
});

// Authentication - Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  const db = loadDb();
  let user = db.users[email];
  if (!user) {
    // Smooth auto-registration if user doesn't exist
    user = {
      email,
      password,
      company_id: null,
      role: null,
      position: "თანამშრომელი",
      permissions: {
        uploadInvoices: true,
        deleteInvoices: false,
        editBudgets: false,
        viewAnalytics: true,
        manageTeam: false,
        manageBilling: false
      },
      is_platform_owner: false,
      status: "active"
    };
    db.users[email] = user;
    saveDb(db);
  }

  if (user.status === "revoked") {
    res.status(403).json({ error: "თქვენი წვდომა გაუქმებულია ამ სისტემაზე" });
    return;
  }

  res.json({ 
    token: `session-token-${email}`, 
    user: formatUserResponse(user, db)
  });
});

// Authentication - Logout
app.post("/api/logout", (req, res) => {
  res.json({ success: true });
});

// Authentication - Get Current User Info
app.get("/api/me", requireAuth, (req, res) => {
  const user = (req as any).user;
  const db = loadDb();
  res.json(formatUserResponse(user, db));
});

// Create Company & Subscription bootstrap
app.post("/api/bootstrap-company", requireAuth, (req, res) => {
  const { name, plan } = req.body;
  if (!name) {
    res.status(400).json({ error: "Company name is required" });
    return;
  }
  const user = (req as any).user as DbUser;
  const db = loadDb();

  const companyId = `company-${Math.random().toString(36).substring(2, 9)}`;
  db.companies[companyId] = { id: companyId, name };
  
  // Link user to company as admin with full permissions & platform owner flag
  db.users[user.email].company_id = companyId;
  db.users[user.email].role = "admin";
  db.users[user.email].position = "ადმინისტრატორი";
  db.users[user.email].is_platform_owner = true;
  db.users[user.email].permissions = {
    uploadInvoices: true,
    deleteInvoices: true,
    editBudgets: true,
    viewAnalytics: true,
    manageTeam: true,
    manageBilling: true
  };
  db.users[user.email].status = "active";

  // Create subscription row with chosen plan/tier
  db.subscriptions[companyId] = {
    company_id: companyId,
    tier: plan === "single" || plan === "multi" ? plan : "single",
    status: "active"
  };

  saveDb(db);
  res.json({ success: true, company: { id: companyId, name }, user: formatUserResponse(db.users[user.email], db) });
});

// --- INVITES & TEAM MANAGEMENT ENDPOINTS ---

// Create Invite
app.post("/api/invites", requireAuth, (req, res) => {
  const authUser = (req as any).user as DbUser;
  const db = loadDb();
  const formattedAuthUser = formatUserResponse(authUser, db);

  if (!formattedAuthUser.permissions.manageTeam) {
    res.status(403).json({ error: "არ გაქვთ გუნდის მართვის უფლება" });
    return;
  }

  if (!authUser.company_id) {
    res.status(400).json({ error: "კომპანია არ არის მითითებული" });
    return;
  }

  const { email, name, position, permissions } = req.body;
  if (!email || !name) {
    res.status(400).json({ error: "ელფოსტა და სახელი სავალდებულოა" });
    return;
  }

  const token = `inv-${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const invite: DbInvite = {
    token,
    email,
    name,
    position: position || "თანამშრომელი",
    company_id: authUser.company_id,
    permissions: permissions || {
      uploadInvoices: true,
      deleteInvoices: false,
      editBudgets: false,
      viewAnalytics: true,
      manageTeam: false,
      manageBilling: false
    },
    expires_at: expiresAt,
    status: "pending"
  };

  if (!db.invites) db.invites = {};
  db.invites[token] = invite;
  saveDb(db);

  res.json({
    success: true,
    invite: {
      ...invite,
      inviteLink: `/invite/${token}`
    }
  });
});

// Verify Invite Token
app.get("/api/invites/:token", (req, res) => {
  const { token } = req.params;
  const db = loadDb();
  const invite = db.invites ? db.invites[token] : null;

  if (!invite) {
    res.status(404).json({ error: "მოწვევა ვერ მოიძებნა" });
    return;
  }

  if (invite.status !== "pending") {
    res.status(400).json({ error: "ეს მოწვევა უკვე გამოყენებულია ან გაუქმებულია" });
    return;
  }

  if (new Date(invite.expires_at) < new Date()) {
    res.status(400).json({ error: "მოწვევის ვადა გასულია" });
    return;
  }

  const company = db.companies[invite.company_id];

  res.json({
    success: true,
    email: invite.email,
    name: invite.name,
    position: invite.position,
    companyName: company ? company.name : "კომპანია",
    company_id: invite.company_id
  });
});

// Accept Invite
app.post("/api/invites/:token/accept", (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const db = loadDb();
  const invite = db.invites ? db.invites[token] : null;

  if (!invite || invite.status !== "pending") {
    res.status(400).json({ error: "მოწვევა არასწორია ან უკვე გამოყენებულია" });
    return;
  }

  if (new Date(invite.expires_at) < new Date()) {
    res.status(400).json({ error: "მოწვევის ვადა გასულია" });
    return;
  }

  // Create or update user
  const newUser: DbUser = {
    email: invite.email,
    password: password || undefined,
    company_id: invite.company_id,
    role: "member",
    position: invite.position,
    permissions: invite.permissions,
    is_platform_owner: false,
    status: "active"
  };

  db.users[invite.email] = newUser;
  invite.status = "accepted";
  saveDb(db);

  const formattedUser = formatUserResponse(newUser, db);

  res.json({
    token: `session-token-${invite.email}`,
    user: formattedUser
  });
});

// Get Team Members & Pending Invites
app.get("/api/team", requireAuth, (req, res) => {
  const authUser = (req as any).user as DbUser;
  const db = loadDb();
  const formattedAuthUser = formatUserResponse(authUser, db);

  if (!formattedAuthUser.permissions.manageTeam) {
    res.status(403).json({ error: "არ გაქვთ გუნდის ნახვის უფლება" });
    return;
  }

  if (!authUser.company_id) {
    res.json({ success: true, members: [], pendingInvites: [] });
    return;
  }

  const members = Object.values(db.users)
    .filter((u) => u.company_id === authUser.company_id)
    .map((u) => formatUserResponse(u, db));

  const pendingInvites = Object.values(db.invites || {})
    .filter((i) => i.company_id === authUser.company_id && i.status === "pending" && new Date(i.expires_at) > new Date());

  res.json({
    success: true,
    members,
    pendingInvites
  });
});

// Update Team Member Position/Permissions
app.patch("/api/team/:userId/permissions", requireAuth, (req, res) => {
  const authUser = (req as any).user as DbUser;
  const db = loadDb();
  const formattedAuthUser = formatUserResponse(authUser, db);

  if (!formattedAuthUser.permissions.manageTeam) {
    res.status(403).json({ error: "არ გაქვთ გუნდის მართვის უფლება" });
    return;
  }

  const { userId } = req.params; // userId is the email address
  const { position, permissions } = req.body;

  const targetUser = db.users[userId];
  if (!targetUser || targetUser.company_id !== authUser.company_id) {
    res.status(404).json({ error: "თანამშრომელი ვერ მოიძებნა" });
    return;
  }

  if (position !== undefined) {
    targetUser.position = position;
  }

  if (permissions) {
    targetUser.permissions = {
      ...targetUser.permissions,
      ...permissions
    };
  }

  saveDb(db);
  res.json({ success: true, user: formatUserResponse(targetUser, db) });
});

// Revoke Team Member or Invite Access
app.post("/api/team/:userId/revoke", requireAuth, (req, res) => {
  const authUser = (req as any).user as DbUser;
  const db = loadDb();
  const formattedAuthUser = formatUserResponse(authUser, db);

  if (!formattedAuthUser.permissions.manageTeam) {
    res.status(403).json({ error: "არ გაქვთ წვდომის გაუქმების უფლება" });
    return;
  }

  const { userId } = req.params; // can be user email or invite token

  // Check if it's an existing user
  if (db.users[userId]) {
    if (db.users[userId].company_id === authUser.company_id) {
      db.users[userId].status = "revoked";
      saveDb(db);
      res.json({ success: true, message: "წვდომა გაუქმებულია" });
      return;
    }
  }

  // Check if it's an invite token or email in invites
  let foundInvite = false;
  if (db.invites) {
    for (const invite of Object.values(db.invites)) {
      if ((invite.token === userId || invite.email === userId) && invite.company_id === authUser.company_id) {
        invite.status = "revoked";
        foundInvite = true;
      }
    }
  }

  if (foundInvite) {
    saveDb(db);
    res.json({ success: true, message: "მოწვევა გაუქმებულია" });
    return;
  }

  res.status(404).json({ error: "ჩანაწერი ვერ მოიძებნა" });
});

// Update Company Name and Subscription Tier
app.post("/api/update-company", requireAuth, (req, res) => {
  const { name, plan } = req.body;
  const user = (req as any).user;
  if (!user.company_id) {
    res.status(400).json({ error: "User is not associated with any company" });
    return;
  }

  const db = loadDb();
  if (name) {
    if (db.companies[user.company_id]) {
      db.companies[user.company_id].name = name;
    } else {
      db.companies[user.company_id] = { id: user.company_id, name };
    }
  }
  if (plan && (plan === "single" || plan === "multi")) {
    if (!db.subscriptions[user.company_id]) {
      db.subscriptions[user.company_id] = {
        company_id: user.company_id,
        tier: plan,
        status: "active"
      };
    } else {
      db.subscriptions[user.company_id].tier = plan;
    }
  }

  saveDb(db);
  res.json({ success: true });
});

// Get Subscription Info (beyond / optionally within auth)
app.get("/api/subscription", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.json({ tier: "single", status: "trialing" });
    return;
  }
  const token = authHeader.substring(7);
  if (!token.startsWith("session-token-")) {
    res.json({ tier: "single", status: "trialing" });
    return;
  }
  const email = token.substring("session-token-".length);
  const db = loadDb();
  const user = db.users[email];
  if (!user || !user.company_id) {
    res.json({ tier: "single", status: "trialing" });
    return;
  }

  const sub = db.subscriptions[user.company_id];
  if (!sub) {
    res.json({ tier: "single", status: "trialing" });
    return;
  }

  res.json({ tier: sub.tier, status: sub.status });
});

// Analyze Invoice / Receipt Endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName } = req.body;

    if (!fileBase64 || !mimeType) {
      res.status(400).json({ error: "Missing file data (fileBase64 or mimeType)" });
      return;
    }

    // Lazy initialize Gemini Client
    const ai = getGeminiClient();

    // Prepare document part for Gemini
    const documentPart = {
      inlineData: {
        data: fileBase64,
        mimeType: mimeType,
      },
    };

    // Prompt Gemini with strict JSON schema
    const prompt = `Analyze this invoice or receipt and extract key information. 
Classify the expense category to one of the standard category codes: 'office', 'marketing', 'it', 'transport', 'food', or 'other'.
Provide accurate data extraction in the requested JSON structure.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        documentPart,
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            vendor: { 
              type: Type.STRING, 
              description: "The name of the vendor, company, or store. Return 'Unknown' if not found." 
            },
            date: { 
              type: Type.STRING, 
              description: "The invoice or purchase date in YYYY-MM-DD format if possible, otherwise as printed." 
            },
            amount: { 
              type: Type.NUMBER, 
              description: "The total amount of the invoice/receipt. Must be a clean number." 
            },
            currency: { 
              type: Type.STRING, 
              description: "The currency symbol or code (e.g. GEL, USD, EUR, etc.) as found on the receipt." 
            },
            items: {
              type: Type.ARRAY,
              description: "A list of brief products or services purchased.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name/description of the item or service." },
                  quantity: { type: Type.NUMBER, description: "Quantity of the item (optional)." },
                  price: { type: Type.NUMBER, description: "Unit price or subtotal of the item (optional)." }
                },
                required: ["name"]
              }
            },
            category: {
              type: Type.STRING,
              description: "Categorization of the invoice. Must be one of: 'office', 'marketing', 'it', 'transport', 'food', or 'other'."
            }
          },
          required: ["vendor", "date", "amount", "currency", "items", "category"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response received from Gemini.");
    }

    // Parse extracted JSON
    const extractedData = JSON.parse(responseText.trim());
    res.json({
      success: true,
      data: {
        ...extractedData,
        id: Math.random().toString(36).substring(2, 9),
        fileName: fileName || "document.pdf",
        uploadedAt: new Date().toISOString(),
      }
    });

  } catch (error: any) {
    console.error("Analysis Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred during document analysis."
    });
  }
});

// Setup Vite development middleware OR serve built client-side files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
