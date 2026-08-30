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

interface DbPasswordReset {
  token: string;
  email: string;
  expires_at: string;
  status: "pending" | "used";
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  company_id: string;
  user_email: string;
  user_name?: string;
  action: string;
  target_description: string;
  timestamp: string;
  type?: "invoice" | "team" | "budget" | "system";
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
  passwordResets?: Record<string, DbPasswordReset>;
  auditLog?: AuditLogEntry[];
}

function loadDb(): DbSchema {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      if (!data.invites) data.invites = {};
      if (!data.passwordResets) data.passwordResets = {};
      if (!data.auditLog) data.auditLog = [];
      return data;
    } catch (_) {}
  }
  return { users: {}, companies: {}, subscriptions: {}, invites: {}, passwordResets: {}, auditLog: [] };
}

function saveDb(db: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write database file:", err);
  }
}

function addAuditLog(
  db: DbSchema,
  companyId: string,
  userEmail: string,
  action: string,
  targetDescription: string,
  type: "invoice" | "team" | "budget" | "system" = "system",
  userName?: string
) {
  if (!db.auditLog) db.auditLog = [];
  const entry: AuditLogEntry = {
    id: `log-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
    company_id: companyId,
    user_email: userEmail,
    user_name: userName || (db.users[userEmail]?.position || userEmail.split("@")[0]),
    action,
    target_description: targetDescription,
    timestamp: new Date().toISOString(),
    type
  };
  db.auditLog.unshift(entry);
  if (db.auditLog.length > 500) {
    db.auditLog = db.auditLog.slice(0, 500);
  }
  return entry;
}

// In-memory Rate Limiter for /api/analyze: Max 20 requests per minute per IP / token
const analyzeRateLimits = new Map<string, number[]>();

function checkAnalyzeRateLimit(identifier: string, maxRequests = 20, windowMs = 60000): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const timestamps = (analyzeRateLimits.get(identifier) || []).filter((t) => now - t < windowMs);
  
  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0];
    const retryAfterSec = Math.ceil((oldest + windowMs - now) / 1000);
    analyzeRateLimits.set(identifier, timestamps);
    return { allowed: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }

  timestamps.push(now);
  analyzeRateLimits.set(identifier, timestamps);
  return { allowed: true };
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
    manageTeam: isOwnerOrAdmin,
    manageBilling: isOwnerOrAdmin,
  };

  const permissions = user.permissions ? { ...defaultPermissions, ...user.permissions } : defaultPermissions;

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
  
  // Link user to company as admin with full company permissions
  db.users[user.email].company_id = companyId;
  db.users[user.email].role = "admin";
  db.users[user.email].position = "ადმინისტრატორი";
  db.users[user.email].is_platform_owner = false;
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
  addAuditLog(
    db,
    authUser.company_id,
    authUser.email,
    "თანამშრომლის მოწვევა",
    `მოწვეულია ${name} (${email}) პოზიციაზე "${position || "თანამშრომელი"}"`,
    "team"
  );
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

  addAuditLog(
    db,
    authUser.company_id,
    authUser.email,
    "უფლებების ცვლილება",
    `განახლდა ${userId}-ის პოზიცია (${targetUser.position}) და უფლებები`,
    "team"
  );

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
      addAuditLog(
        db,
        authUser.company_id,
        authUser.email,
        "წვდომის გაუქმება",
        `გაუქმდა თანამშრომლის წვდომა: ${userId}`,
        "team"
      );
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
    addAuditLog(
      db,
      authUser.company_id,
      authUser.email,
      "მოწვევის გაუქმება",
      `გაუქმდა მოწვევა: ${userId}`,
      "team"
    );
    saveDb(db);
    res.json({ success: true, message: "მოწვევა გაუქმებულია" });
    return;
  }

  res.status(404).json({ error: "ჩანაწერი ვერ მოიძებნა" });
});

// --- AUDIT LOG ENDPOINTS ---

// Get Audit Logs (restricted to admin or manageTeam)
app.get("/api/audit-log", requireAuth, (req, res) => {
  const authUser = (req as any).user as DbUser;
  const db = loadDb();
  const formattedAuthUser = formatUserResponse(authUser, db);

  if (!formattedAuthUser.permissions.manageTeam && formattedAuthUser.role !== "admin") {
    res.status(403).json({ error: "არ გაქვთ ჟურნალის ნახვის უფლება" });
    return;
  }

  if (!authUser.company_id) {
    res.json({ success: true, logs: [] });
    return;
  }

  const companyLogs = (db.auditLog || [])
    .filter((log) => log.company_id === authUser.company_id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 100);

  res.json({ success: true, logs: companyLogs });
});

// Post Audit Log from client-side actions
app.post("/api/audit-log", requireAuth, (req, res) => {
  const authUser = (req as any).user as DbUser;
  const { action, targetDescription, type } = req.body;
  if (!authUser.company_id || !action) {
    res.status(400).json({ error: "Invalid log payload" });
    return;
  }

  const db = loadDb();
  const entry = addAuditLog(
    db,
    authUser.company_id,
    authUser.email,
    action,
    targetDescription || "",
    type || "system",
    authUser.position
  );
  saveDb(db);
  res.json({ success: true, entry });
});

// --- PASSWORD RESET ENDPOINTS ---

// Request Password Reset
app.post("/api/password-reset/request", (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "ელფოსტა სავალდებულოა" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = loadDb();
  const user = db.users[normalizedEmail];

  if (!user) {
    res.status(404).json({ error: "მომხმარებელი ამ ელფოსტით ვერ მოიძებნა" });
    return;
  }

  const token = `rst-${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour expiry

  if (!db.passwordResets) db.passwordResets = {};
  db.passwordResets[token] = {
    token,
    email: normalizedEmail,
    expires_at: expiresAt,
    status: "pending",
    created_at: new Date().toISOString()
  };

  if (user.company_id) {
    addAuditLog(
      db,
      user.company_id,
      normalizedEmail,
      "პაროლის აღდგენის მოთხოვნა",
      `გენერირებულია პაროლის აღდგენის ბმული`,
      "system"
    );
  }

  saveDb(db);

  console.log(`[PASSWORD RESET]: Generated token for ${normalizedEmail}: /reset-password/${token}`);

  res.json({
    success: true,
    message: "პაროლის აღდგენის ბმული მომზადებულია",
    token,
    resetLink: `/reset-password/${token}`,
    expiresAt
  });
});

// Verify Password Reset Token
app.get("/api/password-reset/:token", (req, res) => {
  const { token } = req.params;
  const db = loadDb();
  const reset = db.passwordResets ? db.passwordResets[token] : null;

  if (!reset) {
    res.status(404).json({ error: "აღდგენის ბმული არასწორია ან ვერ მოიძებნა" });
    return;
  }

  if (reset.status !== "pending") {
    res.status(400).json({ error: "ეს აღდგენის ბმული უკვე გამოყენებულია" });
    return;
  }

  if (new Date(reset.expires_at) < new Date()) {
    res.status(400).json({ error: "აღდგენის ბმულის ვადა (1 საათი) ამოიწურა. გთხოვთ მოითხოვოთ ახალი." });
    return;
  }

  res.json({
    valid: true,
    email: reset.email
  });
});

// Execute Password Reset
app.post("/api/password-reset/:token", (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
    res.status(400).json({ error: "ახალი პაროლი უნდა შედგებოდეს მინიმუმ 6 სიმბოლოსგან" });
    return;
  }

  const db = loadDb();
  const reset = db.passwordResets ? db.passwordResets[token] : null;

  if (!reset || reset.status !== "pending") {
    res.status(400).json({ error: "აღდგენის ბმული არასწორია ან უკვე გამოყენებულია" });
    return;
  }

  if (new Date(reset.expires_at) < new Date()) {
    res.status(400).json({ error: "აღდგენის ბმულის ვადა ამოიწურა" });
    return;
  }

  const user = db.users[reset.email];
  if (!user) {
    res.status(404).json({ error: "მომხმარებელი ვერ მოიძებნა" });
    return;
  }

  // Update password
  user.password = newPassword;
  reset.status = "used";

  if (user.company_id) {
    addAuditLog(
      db,
      user.company_id,
      reset.email,
      "პაროლის შეცვლა",
      `მომხმარებელმა წარმატებით შეცვალა ანგარიშის პაროლი`,
      "system"
    );
  }

  saveDb(db);

  res.json({
    success: true,
    message: "პაროლი წარმატებით განახლდა"
  });
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

  addAuditLog(
    db,
    user.company_id,
    user.email,
    "პარამეტრების ცვლილება",
    `განახლდა კომპანიის პარამეტრები: სახელი "${name || ""}", გეგმა "${plan || ""}"`,
    "system"
  );

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
    // 1. Rate Limiting Check (Max 20 requests per minute)
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "global";
    const authHeader = req.headers.authorization;
    const rateLimitKey = authHeader && authHeader.startsWith("Bearer session-token-")
      ? authHeader.substring("Bearer session-token-".length)
      : String(clientIp);

    const rateLimitResult = checkAnalyzeRateLimit(rateLimitKey, 20, 60000);
    if (!rateLimitResult.allowed) {
      res.status(429).json({
        success: false,
        error: `ძალიან ბევრი მოთხოვნა, გთხოვთ სცადოთ ცოტა ხანში (მაქსიმუმ 20 მოთხოვნა წუთში. სცადეთ ${rateLimitResult.retryAfterSec || 30} წამში).`
      });
      return;
    }

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
