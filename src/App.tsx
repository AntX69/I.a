import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "./hooks/useAuth";
import { apiFetch } from "./lib/api";
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Globe, 
  AlertCircle, 
  Plus, 
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Folder,
  PlusCircle,
  X,
  Briefcase,
  Lock,
  Edit,
  Check,
  LogOut,
  ArrowRight,
  Users,
  LockKeyhole,
  Activity,
  CheckCircle2,
  Building2,
  Settings,
  HelpCircle,
  Menu
} from "lucide-react";
import { 
  Language, 
  ExtractedInvoice, 
  ExpenseCategory, 
  CATEGORY_LABELS, 
  CATEGORY_COLORS, 
  TRANSLATIONS,
  UserRole,
  RolePermissions,
  UserPermissions
} from "./types";
import InvoiceUploadZone from "./components/InvoiceUploadZone";
import InvoiceSummaryCards from "./components/InvoiceSummaryCards";
import InvoiceDetailModal from "./components/InvoiceDetailModal";
import InvoiceAnalytics from "./components/InvoiceAnalytics";
import ManualInvoiceModal from "./components/ManualInvoiceModal";
import SmartInsights from "./components/SmartInsights";
import LiveExchangeRates from "./components/LiveExchangeRates";
import VendorAnalytics from "./components/VendorAnalytics";
import PDFReportGenerator from "./components/PDFReportGenerator";
import RoleSimulator from "./components/RoleSimulator";
import ToastContainer, { Toast } from "./components/ToastContainer";
import NotFoundView from "./components/NotFoundView";
import SettingsMockup from "./components/SettingsMockup";
import TeamManagement from "./components/TeamManagement";
import AcceptInviteView from "./components/AcceptInviteView";

export default function App() {
  // Invite token detection from URL
  const [inviteToken, setInviteToken] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith("/invite/")) {
      return path.substring("/invite/".length);
    }
    const params = new URLSearchParams(window.location.search);
    return params.get("invite");
  });

  // States
  const [language, setLanguage] = useState<Language>("ka");
  const [invoices, setInvoices] = useState<ExtractedInvoice[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<ExtractedInvoice | null>(null);

  // Authentication & Visual Navigation States
  const { 
    user, 
    isAuthenticated, 
    isLoading: isAuthLoading, 
    signInWithPassword, 
    signUp, 
    signOut, 
    refreshUser 
  } = useAuth();

  // Compatibility states mapped to our real useAuth hook
  const currentUser = user ? { email: user.email } : null;
  const userCompany = user?.company_name || "";

  const [activePlan, setActivePlan] = useState<"single" | "multi" | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.company_id) {
      apiFetch<{ tier: "single" | "multi"; status: string }>("/api/subscription")
        .then((data) => {
          setActivePlan(data.tier);
        })
        .catch((err) => {
          console.error("Failed to load subscription:", err);
          setActivePlan("single");
        });
    } else {
      setActivePlan(null);
    }
  }, [isAuthenticated, user?.company_id]);

  const [currentView, setCurrentView] = useState<"landing" | "login" | "signup" | "create-company" | "settings" | "team" | "not-found" | "dashboard">("landing");
  const [placeholderModal, setPlaceholderModal] = useState<"terms" | "privacy" | null>(null);

  const rawPermissions: UserPermissions = user?.permissions || {
    uploadInvoices: true,
    deleteInvoices: user?.role === "admin" || !!user?.is_platform_owner,
    editBudgets: user?.role === "admin" || !!user?.is_platform_owner,
    viewAnalytics: true,
    manageTeam: !!user?.is_platform_owner,
    manageBilling: user?.role === "admin" || !!user?.is_platform_owner,
  };

  const userPermissions: UserPermissions = {
    ...rawPermissions,
    manageTeam: !!user?.is_platform_owner && !!rawPermissions.manageTeam,
  };

  // Keep currentView synchronized with authentication state
  useEffect(() => {
    if (isAuthLoading) return;
    
    if (!isAuthenticated) {
      if (currentView !== "login" && currentView !== "signup" && currentView !== "landing") {
        setCurrentView("landing");
      }
    } else {
      // User is logged in
      if (!user?.company_id) {
        setCurrentView("create-company");
      } else {
        // Logged in with company
        if (currentView === "landing" || currentView === "login" || currentView === "signup" || currentView === "create-company") {
          setCurrentView("dashboard");
        }
      }
    }
  }, [isAuthenticated, user?.company_id, isAuthLoading]);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [pricingPlanToggle, setPricingPlanToggle] = useState<"single" | "multi">("single");

  // Authentication Actions bound to useAuth
  const handleMockLogin = async (email: string, password?: string) => {
    try {
      await signInWithPassword(email, password);
      showToast(language === "ka" ? "ავტორიზაცია წარმატებით გაიარა!" : "Signed in successfully!", "success");
    } catch (err: any) {
      showToast(err.message || (language === "ka" ? "ავტორიზაციის შეცდომა" : "Sign in failed"), "error");
    }
  };

  const handleMockSignup = async (email: string, password?: string) => {
    try {
      await signUp(email, password);
      showToast(language === "ka" ? "რეგისტრაცია წარმატებით დასრულდა!" : "Signed up successfully!", "success");
    } catch (err: any) {
      showToast(err.message || (language === "ka" ? "რეგისტრაციის შეცდომა" : "Sign up failed"), "error");
    }
  };

  const handleMockCreateCompany = async (companyName: string, plan: "single" | "multi") => {
    try {
      await apiFetch("/api/bootstrap-company", {
        method: "POST",
        body: { name: companyName, plan },
      });
      await refreshUser();
      
      // Auto-add the created company name as a workspace
      if (!workspaces.includes(companyName)) {
        const updatedWorkspaces = [companyName, ...workspaces];
        setWorkspaces(updatedWorkspaces);
        setActiveWorkspace(companyName);
      } else {
        setActiveWorkspace(companyName);
      }

      showToast(language === "ka" ? "ორგანიზაცია შეიქმნა!" : "Organization created successfully!", "success");
      setCurrentView("dashboard");
      setIsLoadingInvoices(true);
      setTimeout(() => setIsLoadingInvoices(false), 800);
    } catch (err: any) {
      showToast(err.message || (language === "ka" ? "კომპანიის შექმნის შეცდომა" : "Failed to create company"), "error");
    }
  };

  const handleUpdateSettings = async (name: string, plan: "single" | "multi") => {
    try {
      await apiFetch("/api/update-company", {
        method: "POST",
        body: { name, plan },
      });
      await refreshUser();
      setActivePlan(plan);
      showToast(language === "ka" ? "პარამეტრები წარმატებით შეინახა!" : "Settings saved successfully!", "success");
    } catch (err: any) {
      showToast(err.message || (language === "ka" ? "შეცდომა შენახვისას" : "Failed to save settings"), "error");
      throw err;
    }
  };

  const handleMockLogout = async () => {
    try {
      await signOut();
      showToast(language === "ka" ? "თქვენ გამოხვედით სისტემიდან" : "Signed out successfully", "success");
      setCurrentView("landing");
    } catch (_) {}
  };

  const handleWorkspaceSelect = (ws: string) => {
    setIsLoadingInvoices(true);
    setActiveWorkspace(ws);
    setTimeout(() => {
      setIsLoadingInvoices(false);
    }, 400);
  };

  // Trigger loading skeleton on initial load of the dashboard
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingInvoices(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [currentUser, userCompany]);
  
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Custom confirmation dialog states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [workspaceToConfirmDelete, setWorkspaceToConfirmDelete] = useState<string | null>(null);
  const [isRoleLockedFromUrl, setIsRoleLockedFromUrl] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get("role");
      if (roleParam === "accountant" || roleParam === "purchaser") {
        setActiveRole(roleParam as UserRole);
        setIsRoleLockedFromUrl(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sorting and Date Filter states
  const [sortColumn, setSortColumn] = useState<"vendor" | "date" | "amount" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [dateRangeFilter, setDateRangeFilter] = useState<"all" | "this_month" | "last_30">("all");

  // Premium Workspace management
  const [workspaces, setWorkspaces] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("antx_invoice_workspaces_v1");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return ["პირადი ხარჯები", "შპს ჯი-ემ-თი", "Startup პროექტი"];
  });

  const [activeWorkspace, setActiveWorkspace] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("antx_invoice_active_workspace_v1");
      if (saved && saved !== "undefined") return JSON.parse(saved);
    } catch (_) {}
    return "პირადი ხარჯები";
  });

  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [editingWorkspaceIndex, setEditingWorkspaceIndex] = useState<number | null>(null);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState<string>("");
  const [showManualInvoiceModal, setShowManualInvoiceModal] = useState(false);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>("admin");

  useEffect(() => {
    if (user && user.role) {
      setActiveRole(user.role as UserRole);
    } else if (activePlan === "single") {
      setActiveRole("admin");
    }
    if (currentView === "team" && (activePlan !== "multi" || !user?.is_platform_owner || !userPermissions.manageTeam)) {
      setCurrentView("dashboard");
    }
  }, [user, activePlan, currentView]);

  const defaultRolePermissions: Record<UserRole, RolePermissions> = {
    admin: { canUpload: true, viewAnalytics: true, manageBudgets: true, canDelete: true },
    accountant: { canUpload: true, viewAnalytics: true, manageBudgets: true, canDelete: false },
    purchaser: { canUpload: true, viewAnalytics: false, manageBudgets: false, canDelete: false },
    member: { canUpload: true, viewAnalytics: true, manageBudgets: false, canDelete: false },
  };

  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RolePermissions>>(() => {
    try {
      const saved = localStorage.getItem("invoice_analyzer_role_permissions_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultRolePermissions, ...parsed };
      }
    } catch (_) {}
    return defaultRolePermissions;
  });

  const currentRolePermissions: RolePermissions = useMemo(() => {
    if (user && user.permissions) {
      return {
        canUpload: user.permissions.uploadInvoices,
        viewAnalytics: user.permissions.viewAnalytics,
        manageBudgets: user.permissions.editBudgets,
        canDelete: user.permissions.deleteInvoices,
      };
    }
    return rolePermissions[activeRole] || defaultRolePermissions[activeRole] || defaultRolePermissions.admin;
  }, [rolePermissions, activeRole, user]);

  useEffect(() => {
    try {
      localStorage.setItem("invoice_analyzer_role_permissions_v1", JSON.stringify(rolePermissions));
    } catch (_) {}
  }, [rolePermissions]);

  const [showPdfReport, setShowPdfReport] = useState(false);
  const [exchangeRates, setExchangeRates] = useState({ USD: 2.715, EUR: 2.945, GEL: 1.0 });

  // Load budgets for over-budget indicators
  const [budgets, setBudgets] = useState<Record<string, Record<ExpenseCategory, number>>>(() => {
    try {
      const saved = localStorage.getItem("antx_invoice_budgets_v1");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      GEL: { office: 500, marketing: 1000, it: 1500, transport: 400, food: 300, other: 800 },
      USD: { office: 200, marketing: 500, it: 800, transport: 150, food: 100, other: 300 },
      EUR: { office: 150, marketing: 400, it: 700, transport: 120, food: 90, other: 250 },
    };
  });

  // Persist workspaces
  useEffect(() => {
    try {
      localStorage.setItem("antx_invoice_workspaces_v1", JSON.stringify(workspaces));
    } catch (e) {
      console.error(e);
    }
  }, [workspaces]);

  useEffect(() => {
    try {
      localStorage.setItem("antx_invoice_active_workspace_v1", JSON.stringify(activeWorkspace));
    } catch (e) {
      console.error(e);
    }
  }, [activeWorkspace]);

  const handleSort = (column: "vendor" | "date" | "amount") => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const isInvoiceOverBudget = (category: ExpenseCategory, currency: string) => {
    const activeBudgets = budgets[currency.toUpperCase()] || budgets.GEL;
    const limit = activeBudgets[category] || 0;
    
    const actualSpend = invoices
      .filter(inv => {
        const matchesWorkspace = (inv as any).workspace === activeWorkspace || (!(inv as any).workspace && activeWorkspace === workspaces[0]);
        return matchesWorkspace && (inv.currency || "GEL").toUpperCase().trim() === currency.toUpperCase().trim() && inv.category === category;
      })
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
      
    return actualSpend > limit;
  };

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("extracted_invoices");
    if (saved) {
      try {
        setInvoices(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing saved invoices", e);
      }
    }
  }, []);

  // Save to local storage
  const saveInvoices = (newInvoices: ExtractedInvoice[]) => {
    setInvoices(newInvoices);
    localStorage.setItem("extracted_invoices", JSON.stringify(newInvoices));
  };

  // Toggle language
  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ka" : "en"));
  };

  const t = TRANSLATIONS[language];

  // Handle uploaded file analysis
  const handleUpload = async (base64: string, mimeType: string, fileName: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileBase64: base64,
          mimeType,
          fileName,
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(text.slice(0, 200) || "Server returned an unexpected non-JSON response.");
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to analyze document.");
      }

      const analyzedInvoice = {
        ...result.data,
        workspace: activeWorkspace,
      };

      const newInvoices = [analyzedInvoice, ...invoices];
      saveInvoices(newInvoices);
      showToast(
        language === "ka"
          ? "დოკუმენტი წარმატებით გაანალიზდა და დაემატა!"
          : "Document analyzed and added successfully!",
        "success"
      );
    } catch (err: any) {
      console.error(err);
      setError(
        language === "ka"
          ? `ანალიზის შეცდომა: ${err.message || "გთხოვთ დარწმუნდეთ, რომ GEMINI_API_KEY სწორადაა კონფიგურირებული."}`
          : `Analysis Error: ${err.message || "Please make sure your GEMINI_API_KEY is configured in Secrets."}`
      );
      showToast(
        language === "ka"
          ? "დოკუმენტის ანალიზი ვერ მოხერხდა."
          : "Document analysis failed.",
        "error"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle Invoice Deletion
  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const executeDelete = (id: string) => {
    const updated = invoices.filter((inv) => inv.id !== id);
    saveInvoices(updated);
    if (selectedInvoice?.id === id) {
      setSelectedInvoice(null);
    }
    setConfirmDeleteId(null);
    showToast(
      language === "ka"
        ? "ინვოისი წარმატებით წაიშალა."
        : "Invoice deleted successfully.",
      "success"
    );
  };

  // Handle Clear All
  const handleClearAll = () => {
    setConfirmClearAll(true);
  };

  const executeClearAll = () => {
    saveInvoices([]);
    setSelectedInvoice(null);
    setConfirmClearAll(false);
    showToast(
      language === "ka"
        ? "ყველა ინვოისი წარმატებით წაიშალა."
        : "All invoices cleared successfully.",
      "success"
    );
  };

  // Handle save from detail modal edit
  const handleSaveInvoice = (updated: ExtractedInvoice) => {
    const updatedList = invoices.map((inv) => (inv.id === updated.id ? updated : inv));
    saveInvoices(updatedList);
    setSelectedInvoice(updated);
    showToast(
      language === "ka"
        ? "ინვოისის ცვლილებები წარმატებით შეინახა."
        : "Invoice changes saved successfully.",
      "success"
    );
  };

  // Export to CSV with UTF-8 BOM
  const handleExportCsv = () => {
    const headers = [
      language === "ka" ? "გამყიდველი" : "Vendor",
      language === "ka" ? "თარიღი" : "Date",
      language === "ka" ? "ჯამური თანხა" : "Total Amount",
      language === "ka" ? "ვალუტა" : "Currency",
      language === "ka" ? "კატეგორია" : "Category",
      language === "ka" ? "პროდუქტები" : "Products/Services",
      language === "ka" ? "ფაილის სახელი" : "File Name",
      language === "ka" ? "ატვირთვის დრო" : "Uploaded At",
    ];

    const rows = filteredInvoices.map((inv) => {
      const itemsStr = inv.items
        .map((i) => `${i.name}${i.quantity ? ` (x${i.quantity})` : ""}`)
        .join("; ");
      const categoryLabel =
        language === "ka"
          ? CATEGORY_LABELS[inv.category].ka
          : CATEGORY_LABELS[inv.category].en;
      
      return [
        `"${inv.vendor.replace(/"/g, '""')}"`,
        `"${inv.date}"`,
        inv.amount,
        `"${inv.currency}"`,
        `"${categoryLabel}"`,
        `"${itemsStr.replace(/"/g, '""')}"`,
        `"${inv.fileName.replace(/"/g, '""')}"`,
        `"${new Date(inv.uploadedAt).toLocaleString()}"`,
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    
    // Set UTF-8 BOM for Georgian character compatibility in Excel
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `invoice_analysis_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(
      language === "ka" ? "CSV ექსპორტი წარმატებით დასრულდა." : "CSV Export completed successfully.",
      "success"
    );
  };

  // Export to Excel with UTF-8 BOM (HTML table layout for best compatibility)
  const handleExportExcel = () => {
    const headers = [
      language === "ka" ? "გამყიდველი" : "Vendor",
      language === "ka" ? "თარიღი" : "Date",
      language === "ka" ? "ჯამური თანხა" : "Total Amount",
      language === "ka" ? "ვალუტა" : "Currency",
      language === "ka" ? "კატეგორია" : "Category",
      language === "ka" ? "პროდუქტები" : "Products/Services",
      language === "ka" ? "ფაილის სახელი" : "File Name",
      language === "ka" ? "ატვირთვის დრო" : "Uploaded At",
    ];

    const rows = filteredInvoices.map((inv) => {
      const itemsStr = inv.items
        .map((i) => `${i.name}${i.quantity ? ` (x${i.quantity})` : ""}`)
        .join("; ");
      const categoryLabel =
        language === "ka"
          ? CATEGORY_LABELS[inv.category].ka
          : CATEGORY_LABELS[inv.category].en;
      
      return [
        inv.vendor,
        inv.date,
        inv.amount.toFixed(2),
        inv.currency,
        categoryLabel,
        itemsStr,
        inv.fileName,
        new Date(inv.uploadedAt).toLocaleString()
      ];
    });

    // Build standard HTML table for Excel with UTF-8 BOM to ensure Georgian letters display correctly
    let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    tableHtml += `<head><meta charset="utf-8" /><style>table { border-collapse: collapse; } th, td { border: 1px solid #cbd5e1; padding: 8px; font-family: sans-serif; } th { background-color: #f1f5f9; font-weight: bold; }</style></head>`;
    tableHtml += `<body><table>`;
    
    // Headers
    tableHtml += `<tr>`;
    headers.forEach(h => {
      tableHtml += `<th>${h}</th>`;
    });
    tableHtml += `</tr>`;

    // Rows
    rows.forEach(row => {
      tableHtml += `<tr>`;
      row.forEach(val => {
        tableHtml += `<td>${val}</td>`;
      });
      tableHtml += `</tr>`;
    });

    tableHtml += `</table></body></html>`;

    const blob = new Blob(["\uFEFF" + tableHtml], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `invoice_analysis_${new Date().toISOString().split("T")[0]}.xls`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(
      language === "ka" ? "Excel ექსპორტი წარმატებით დასრულდა." : "Excel Export completed successfully.",
      "success"
    );
  };

  // Add Manual Mock Invoice Row (Fallback / Convenience feature)
  const handleAddManual = () => {
    setShowManualInvoiceModal(true);
  };

  const handleSaveManualInvoice = (newInvoice: ExtractedInvoice) => {
    const manualInvoiceWithWorkspace = {
      ...newInvoice,
      workspace: activeWorkspace,
    };
    saveInvoices([manualInvoiceWithWorkspace, ...invoices]);
    showToast(
      language === "ka"
        ? "ინვოისი წარმატებით დაემატა ხელით!"
        : "Invoice manually added successfully!",
      "success"
    );
  };

  // Workspace Invoices
  const workspaceInvoices = invoices.filter((inv) => {
    return (inv as any).workspace === activeWorkspace || (!(inv as any).workspace && activeWorkspace === workspaces[0]);
  });

  // Filtering
  const filteredInvoices = workspaceInvoices.filter((inv) => {
    const matchesSearch =
      inv.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory =
      selectedCategory === "all" || inv.category === selectedCategory;

    // Date range filter matching
    let matchesDate = true;
    if (dateRangeFilter === "this_month") {
      const today = new Date();
      const invDate = new Date(inv.date);
      matchesDate = invDate.getFullYear() === today.getFullYear() && invDate.getMonth() === today.getMonth();
    } else if (dateRangeFilter === "last_30") {
      const today = new Date();
      const invDate = new Date(inv.date);
      const diffTime = Math.abs(today.getTime() - invDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      matchesDate = diffDays <= 30;
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  // Column-based sorting
  if (sortColumn && sortDirection) {
    filteredInvoices.sort((a, b) => {
      let valA: any = a[sortColumn];
      let valB: any = b[sortColumn];

      if (sortColumn === "amount") {
        valA = Number(a.amount) || 0;
        valB = Number(b.amount) || 0;
      } else {
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  // --- RENDERING CONDITIONAL BLOCKS ---

  // 1. PUBLIC LANDING PAGE
  if (!currentUser && currentView === "landing") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-600 font-sans antialiased transition-all duration-300 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-indigo-100/40 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView("landing")}>
              <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="font-extrabold text-slate-900 text-sm sm:text-lg tracking-tight">
                {language === "ka" ? "ინვოისების ანალიზატორი" : "Invoice Analyzer"}
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setLanguage(language === "ka" ? "en" : "ka")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                <span>{language === "ka" ? "EN" : "KA"}</span>
              </button>
              <button
                onClick={() => setCurrentView("login")}
                className="px-4 py-1.5 text-slate-600 hover:text-indigo-600 text-xs font-bold transition-colors cursor-pointer"
              >
                {language === "ka" ? "შესვლა" : "Log In"}
              </button>
              <button
                onClick={() => setCurrentView("signup")}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 cursor-pointer"
              >
                {language === "ka" ? "დაწყება" : "Sign Up"}
              </button>
            </div>

            {/* Mobile Navigation Trigger */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-100/80 rounded-xl border border-slate-200/60 shadow-sm transition-all cursor-pointer flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Collapsible Mobile Menu for Landing Page */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-lg px-4 py-4 space-y-4 animate-fadeIn shadow-lg">
              {/* Language Switcher for Mobile */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === "ka" ? "ენა / Language" : "Language"}
                </span>
                <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 shadow-sm w-full">
                  <button
                    onClick={() => {
                      setLanguage("ka");
                      setShowMobileMenu(false);
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${language === "ka" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    ქართული
                  </button>
                  <button
                    onClick={() => {
                      setLanguage("en");
                      setShowMobileMenu(false);
                    }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${language === "en" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Login & Signup for Mobile */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setCurrentView("login");
                    setShowMobileMenu(false);
                  }}
                  className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/50 rounded-xl transition-all cursor-pointer shadow-sm text-xs font-bold flex items-center justify-center gap-2"
                >
                  <span>{language === "ka" ? "შესვლა" : "Log In"}</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentView("signup");
                    setShowMobileMenu(false);
                  }}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 rounded-xl transition-all cursor-pointer shadow-sm text-xs font-bold flex items-center justify-center gap-2"
                >
                  <span>{language === "ka" ? "დაწყება" : "Sign Up"}</span>
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <section className="relative py-20 sm:py-28 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-[11px] font-bold uppercase tracking-wider shadow-sm animate-bounce">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === "ka" ? "ინოვაციური AI გადაწყვეტილება" : "Innovative AI Solution"}</span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-extrabold text-slate-950 tracking-tight leading-tight">
              {language === "ka" ? (
                <>
                  ხარჯების მართვა — <span className="text-indigo-600">ჭკვიანურად</span> და ავტომატურად
                </>
              ) : (
                <>
                  Manage Expenses — <span className="text-indigo-600">Smartly</span> & Automatically
                </>
              )}
            </h2>
            <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              {language === "ka" 
                ? "ატვირთეთ ქვითრები და ინვოისები, ხოლო ხელოვნური ინტელექტი (Gemini) წამებში დაამუშავებს, ამოიკითხავს და გაანაწილებს მათ კატეგორიებში."
                : "Upload receipts and invoices, and let Gemini AI parse, read, and categorize them automatically in a split second."}
            </p>
            <div className="pt-4 flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => setCurrentView("signup")}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100 hover:shadow-indigo-200 flex items-center gap-2 cursor-pointer group"
              >
                <span>{language === "ka" ? "უფასო რეგისტრაცია" : "Get Started Free"}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("problem-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer"
              >
                {language === "ka" ? "გაიგე მეტი" : "Learn More"}
              </button>
            </div>
          </div>
        </section>

        {/* Bento Grid Features Visualization (Simulation / Screenshot Block) */}
        <section className="py-8 px-4 max-w-5xl mx-auto">
          <div className="bg-white border border-indigo-100 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full blur-2xl -z-10" />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                  {language === "ka" ? "ინტერფეისის დემო" : "Interface Demo"}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                  {language === "ka" ? "ინტუიციური და მინიმალისტური დიზაინი" : "Intuitive & Minimalist Design"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {language === "ka" ? "სამუშაო სივრცე: დეფოლტი" : "Workspace: Default"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bento Card 1: Summary Stats */}
              <div className="bg-[#EEF2FF] border border-indigo-100/50 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-700 uppercase">{language === "ka" ? "ჯამური ხარჯი" : "Total Spend"}</span>
                  <Activity className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-3xl font-black text-slate-950">1,245.80 ₾</div>
                <div className="text-[11px] font-medium text-slate-400">
                  {language === "ka" ? "სამივე სივრცის გათვალისწინებით" : "Aggregated across all spaces"}
                </div>
              </div>

              {/* Bento Card 2: AI Parser */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3 shadow-sm md:col-span-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
                  <span>{language === "ka" ? "GEMINI AI-ის ანალიზი" : "GEMINI AI ANALYSIS"}</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400 font-medium">
                    <span>{language === "ka" ? "ვენდორი:" : "Vendor:"}</span>
                    <span className="font-extrabold text-slate-800">Wolt Georgia</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-medium">
                    <span>{language === "ka" ? "თარიღი:" : "Date:"}</span>
                    <span className="font-extrabold text-slate-800">2026-07-19</span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-medium">
                    <span>{language === "ka" ? "კატეგორია:" : "Category:"}</span>
                    <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded-md font-bold uppercase text-[9px] border border-orange-100">
                      {language === "ka" ? "საოფისე ხარჯი" : "Office Expense"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 font-medium">
                    <span>{language === "ka" ? "თანხა:" : "Amount:"}</span>
                    <span className="font-extrabold text-emerald-600">42.50 GEL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem-section" className="py-16 sm:py-24 px-4 bg-white border-t border-b border-indigo-50/50">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest">
                {language === "ka" ? "პრობლემა & გადაჭრა" : "The Challenge & Solution"}
              </span>
              <h3 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                {language === "ka" ? "რატომ ინვოისების ანალიზატორი?" : "Why Invoice Analyzer?"}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                {language === "ka" 
                  ? "ხელით მუშაობა დამღლელია და ხშირად შეცდომებით სავსე. ჩვენ გთავაზობთ ჭკვიან ალტერნატივას."
                  : "Manual data entry is prone to human error and burns valuable hours. We build a smarter way."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
                  <X className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base">
                  {language === "ka" ? "დაკარგული ქვითრები" : "Lost Paper Receipts"}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {language === "ka" 
                    ? "აღარ დაკარგოთ საგადასახადო დოკუმენტები. შეინახეთ ყველაფერი დაჯგუფებულად და უსაფრთხოდ."
                    : "Say goodbye to stuffed shoeboxes. Digitalize, archive, and aggregate all invoices in one secure workspace."}
                </p>
              </div>
              {/* Card 2 */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl w-fit">
                  <RefreshCw className="w-5 h-5 animate-spin" style={{ animationDuration: "6s" }} />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base">
                  {language === "ka" ? "ხელით შეყვანის რუტინა" : "Hours of Manual Entry"}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {language === "ka" 
                    ? "მონაცემების ხელით შეყვანას საათები მიაქვს. Gemini AI მომენტალურად ამოიკითხავს ყველა საჭირო ველს."
                    : "No more copy-pasting numbers. Gemini AI reads and structures vendors, dates, and amounts instantly."}
                </p>
              </div>
              {/* Card 3 */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
                <div className="p-3 bg-rose-50 text-rose-500 rounded-xl w-fit">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base">
                  {language === "ka" ? "კონტროლის არქონა" : "Uncontrolled Expenses"}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {language === "ka" 
                    ? "ბიუჯეტის ლიმიტების გადაჭარბება შეუმჩნეველი რჩება. ჩვენი სისტემა გაფრთხილებთ მომენტალურად."
                    : "Set custom budget rules. When an invoice crosses category bounds, we raise high-contrast alerts."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 sm:py-24 px-4 max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest">
              {language === "ka" ? "მარტივი პროცესი" : "The Workflow"}
            </span>
            <h3 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              {language === "ka" ? "როგორ მუშაობს პლატფორმა?" : "How It Works"}
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm font-medium">
              {language === "ka" 
                ? "3 მარტივი ნაბიჯი თქვენი ბიზნესის ფინანსური აღრიცხვიანობის ავტომატიზაციისთვის."
                : "Just 3 simple phases to turn messy documents into beautiful structured insights."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] border-t border-dashed border-indigo-100 -z-10" />

            {/* Step 1 */}
            <div className="flex flex-col items-center space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow-md shadow-indigo-100">
                1
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">{language === "ka" ? "ატვირთე" : "Upload Document"}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {language === "ka" 
                  ? "ატვირთეთ ნებისმიერი ფაილი (PDF, JPG, PNG). ჩვენი ატვირთვის ზონა მუშაობს წამებში."
                  : "Drop any invoice file or screenshot. We fully support PDF, JPG, and PNG documents."}
              </p>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow-md shadow-indigo-100">
                2
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">{language === "ka" ? "AI ანალიზი" : "AI Extraction"}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {language === "ka" 
                  ? "Gemini AI მომენტალურად ამოიკითხავს ვენდორს, თარიღს, თანხას, ვალუტას და პროდუქტებს."
                  : "Gemini AI model parses and translates Georgian / English content with extreme metadata fidelity."}
              </p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow-md shadow-indigo-100">
                3
              </div>
              <h4 className="font-extrabold text-slate-900 text-base">{language === "ka" ? "მართე ჭკვიანურად" : "Take Control"}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {language === "ka" 
                  ? "იხილეთ ფინანსური რეპორტები, აკონტროლეთ ბიუჯეტები და მოახდინეთ ექსპორტი."
                  : "Filter, search, download CSV/Excel files, or generate gorgeous branded corporate PDFs."}
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section (Mandate 3) */}
        <section className="py-16 sm:py-24 px-4 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest">
                {language === "ka" ? "ფასები" : "Pricing Plans"}
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {language === "ka" ? "მარტივი და გამჭვირვალე ფასები" : "Simple & Transparent Pricing"}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm font-medium">
                {language === "ka" 
                  ? "აირჩიეთ თქვენს ბიზნესზე მორგებული გეგმა. ფარული გადასახადების გარეშე."
                  : "Choose the package tailored to your size. Scale up or down as needed. No hidden fees."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Plan 1: Single */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {language === "ka" ? "მცირე ბიზნესისთვის" : "For Freelancers & Startups"}
                  </span>
                  <h4 className="text-2xl font-black text-white">Single Plan</h4>
                  <div className="text-4xl font-black text-white">
                    {language === "ka" ? "50 ₾" : "$20"}
                    <span className="text-sm font-medium text-slate-400"> / {language === "ka" ? "თვე" : "mo"}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">
                    {language === "ka" ? "იდეალურია ინდივიდუალური მეწარმეებისთვის." : "Best for solo users managing private invoice ledger."}
                  </p>
                  <div className="border-t border-white/10 pt-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{language === "ka" ? "1 მომხმარებელი" : "1 User Session"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{language === "ka" ? "ულიმიტო დოკუმენტები" : "Unlimited Document Parses"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{language === "ka" ? "ანალიტიკა და გრაფიკები" : "Dashboard Analytics & Charts"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{language === "ka" ? "ბიუჯეტის კონტროლი" : "Budget Category Alerts"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 line-through">
                      <X className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>{language === "ka" ? "გუნდის მართვა (როლები)" : "Team Collaboration & Roles"}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentView("signup")}
                  className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/5"
                >
                  {language === "ka" ? "გეგმის არჩევა" : "Select Single Plan"}
                </button>
              </div>

              {/* Plan 2: Multi */}
              <div className="bg-indigo-950 border-2 border-indigo-500 rounded-3xl p-8 space-y-6 flex flex-col justify-between relative shadow-2xl">
                <div className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 bg-indigo-500 rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-md">
                  {language === "ka" ? "ყველაზე პოპულარული" : "MOST POPULAR"}
                </div>
                
                <div className="space-y-4">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    {language === "ka" ? "მზარდი კომპანიებისთვის" : "For Growing Corporate Teams"}
                  </span>
                  <h4 className="text-2xl font-black text-white">Multi Plan</h4>
                  <div className="text-4xl font-black text-white">
                    {language === "ka" ? "100 ₾" : "$40"}
                    <span className="text-sm font-medium text-indigo-300"> / {language === "ka" ? "თვე" : "mo"}</span>
                  </div>
                  <p className="text-xs text-indigo-200 font-medium">
                    {language === "ka" ? "შესანიშნავია ფინანსური გუნდებისთვის." : "Unlocks multiple employee views, audits, and workflows."}
                  </p>
                  <div className="border-t border-indigo-800/80 pt-4 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-100">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{language === "ka" ? "ულიმიტო მომხმარებლები" : "Unlimited Corporate Users"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-100">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{language === "ka" ? "ულიმიტო დოკუმენტები" : "Unlimited Document Parses"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-100">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{language === "ka" ? "ანალიტიკა და გრაფიკები" : "Dashboard Analytics & Charts"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-100">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{language === "ka" ? "ბიუჯეტის კონტროლი" : "Budget Category Alerts"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-100">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>{language === "ka" ? "გუნდის მართვა (როლები)" : "Team Collaboration & Roles"}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentView("signup")}
                  className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {language === "ka" ? "დაიწყე ახლავე" : "Select Multi Plan"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-50 border-t border-slate-100 py-12 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span className="text-slate-700 font-extrabold">{language === "ka" ? "ინვოისების ანალიზატორი" : "Invoice Analyzer"}</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <button 
                onClick={() => setPlaceholderModal("terms")}
                className="hover:text-indigo-600 transition-colors duration-200 cursor-pointer hover:underline"
              >
                {language === "ka" ? "წესები და პირობები" : "Terms & Conditions"}
              </button>
              <span className="text-slate-200 select-none">|</span>
              <button 
                onClick={() => setPlaceholderModal("privacy")}
                className="hover:text-indigo-600 transition-colors duration-200 cursor-pointer hover:underline"
              >
                {language === "ka" ? "კონფიდენციალურობის პოლიტიკა" : "Privacy Policy"}
              </button>
            </div>
            <div>
              &copy; {new Date().getFullYear()} {language === "ka" ? "ინვოისების ანალიზატორი. ყველა უფლება დაცულია." : "Invoice Analyzer. All rights reserved."}
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // 2. AUTHENTICATION GATEWAY (Login / Signup Split Screen - Mandate 2)
  if (!currentUser && (currentView === "login" || currentView === "signup")) {
    const isLogin = currentView === "login";

    return (
      <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans relative selection:bg-indigo-500 selection:text-white">
        {/* Left Side: Dark Indigo Brand Presentation (Width: 50% on desktop, hidden on mobile) */}
        <div className="hidden md:flex md:w-1/2 bg-[#1E1B4B] text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center space-x-2.5 z-10">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-white text-lg tracking-tight">
              {language === "ka" ? "ინვოისების ანალიზატორი" : "Invoice Analyzer"}
            </span>
          </div>

          <div className="space-y-6 z-10 my-auto">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              {language === "ka" ? "ჭკვიანი ფინანსური გადაწყვეტილება თქვენი გუნდისთვის" : "Enterprise expense intelligence, powered by AI."}
            </h2>
            <p className="text-indigo-200/80 text-sm leading-relaxed max-w-md font-medium">
              {language === "ka" 
                ? "ატვირთეთ ნებისმიერი დოკუმენტი, ხოლო Gemini 1.5 Flash უმოკლეს დროში მოახდენს მის სრულ ანალიზს."
                : "Join hundreds of financial offices streamlining bookkeeping via secure, automatic context extraction."}
            </p>

            <div className="space-y-4 pt-6">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">{language === "ka" ? "ავტომატური ანალიზი Gemini AI-ით" : "Instant layout parsing by Gemini AI"}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">{language === "ka" ? "ბიუჯეტებისა და ლიმიტების კონტროლი" : "Live Category budgeting & thresholds"}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-200">{language === "ka" ? "Excel და PDF ექსპორტი" : "Seamless spreadsheet audits & summaries"}</span>
              </div>
            </div>
          </div>

          <div className="text-slate-400 text-[11px] font-semibold z-10">
            &copy; {new Date().getFullYear()} {language === "ka" ? "ინვოისების ანალიზატორი" : "Invoice Analyzer"}
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 bg-white">
          {/* Header language toggles */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentView("landing")}
              className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              &larr; {language === "ka" ? "მთავარზე დაბრუნება" : "Back to Main"}
            </button>
            <button
              onClick={() => setLanguage(language === "ka" ? "en" : "ka")}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === "ka" ? "ENGLISH" : "ქართული"}</span>
            </button>
          </div>

          {/* Form Proper */}
          <div className="max-w-md w-full mx-auto my-auto py-8 space-y-6">
            <div className="space-y-1.5">
              <h3 className="text-2xl font-black text-slate-950 tracking-tight">
                {isLogin 
                  ? (language === "ka" ? "მოგესალმებით!" : "Welcome back!") 
                  : (language === "ka" ? "შექმენი ანგარიში უფასოდ" : "Get started with Analyzer")}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                {isLogin 
                  ? (language === "ka" ? "შეიყვანეთ თქვენი მონაცემები სისტემაში შესასვლელად." : "Provide credentials to enter your account.") 
                  : (language === "ka" ? "დარეგისტრირდით, რათა მომენტალურად შეძლოთ ინვოისების დამუშავება." : "Register today to start parsing documents.")}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const email = formData.get("email") as string;
                const password = formData.get("password") as string;

                if (isLogin) {
                  handleMockLogin(email, password);
                } else {
                  handleMockSignup(email, password);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  {language === "ka" ? "ელ. ფოსტა" : "Email address"}
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  {language === "ka" ? "პაროლი" : "Password"}
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 cursor-pointer"
              >
                {isLogin 
                  ? (language === "ka" ? "სისტემაში შესვლა" : "Log In") 
                  : (language === "ka" ? "რეგისტრაცია" : "Sign Up")}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setCurrentView(isLogin ? "signup" : "login")}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                {isLogin 
                  ? (language === "ka" ? "ჯერ არ გაქვს ანგარიში? დარეგისტრირდი" : "Don't have an account? Sign up") 
                  : (language === "ka" ? "უკვე გაქვს ანგარიში? გაიარე ავტორიზაცია" : "Already have an account? Log in")}
              </button>
            </div>
          </div>

          <div className="text-center text-[10px] font-semibold text-slate-400">
            {language === "ka" 
              ? "ავტორიზაციით თქვენ ეთანხმებით მომსახურების წესებსა და პირობებს." 
              : "By continuing, you agree to our Terms of Service and Privacy Policy."}
          </div>
        </div>
      </div>
    );
  }

  // 3. CREATE YOUR COMPANY STAGE (Auth flow Step 4 - Split Screen with Pricing Selection)
  if (currentUser && !user?.company_id) {
    return (
      <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans relative selection:bg-indigo-500 selection:text-white">
        {/* Left Side: Dark Indigo Brand Presentation */}
        <div className="hidden md:flex md:w-1/2 bg-[#1E1B4B] text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center space-x-2.5 z-10">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-white text-lg tracking-tight">
              {language === "ka" ? "ინვოისების ანალიზატორი" : "Invoice Analyzer"}
            </span>
          </div>

          <div className="space-y-6 z-10 my-auto">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              {language === "ka" ? "ბოლო ნაბიჯი მუშაობის დასაწყებად" : "Just one step closer to expense autonomy."}
            </h2>
            <p className="text-indigo-200/80 text-sm leading-relaxed max-w-md font-medium">
              {language === "ka" 
                ? "დაასახელეთ თქვენი კომპანია და აირჩიეთ სასურველი გეგმა. ამის შემდეგ თქვენ მომენტალურად შეხვალთ სამუშაო გარემოში."
                : "Define your company entity and pick an active visual plan. You'll gain workspace access instantly."}
            </p>
          </div>

          <div className="text-slate-400 text-[11px] font-semibold z-10">
            &copy; {new Date().getFullYear()} {language === "ka" ? "ინვოისების ანალიზატორი" : "Invoice Analyzer"}
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 bg-white">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/50">
              {language === "ka" ? "ავტორიზებული:" : "Authorized:"} {currentUser.email}
            </span>
            <button
              onClick={handleMockLogout}
              className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
            >
              {language === "ka" ? "გამოსვლა" : "Sign Out"}
            </button>
          </div>

          <div className="max-w-md w-full mx-auto my-auto py-8 space-y-6">
            <div className="space-y-1.5">
              <h3 className="text-2xl font-black text-slate-950 tracking-tight">
                {language === "ka" ? "კომპანიის შექმნა" : "Register Company Entity"}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                {language === "ka" ? "შეიყვანეთ თქვენი ბიზნესის დასახელება და მიუთითეთ საწყისი ტარიფი." : "Define your core organization name and choose a billing tier."}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const companyName = formData.get("companyName") as string;
                if (companyName.trim()) {
                  handleMockCreateCompany(companyName.trim(), pricingPlanToggle);
                }
              }}
              className="space-y-5"
            >
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  {language === "ka" ? "კომპანიის დასახელება" : "Company Name"}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    name="companyName"
                    type="text"
                    required
                    placeholder={language === "ka" ? "მაგ. ჯეო დეველოპმენტი" : "e.g. Geo Development LLC"}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Visual Plan Picker (Mandate 3) */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  {language === "ka" ? "აირჩიეთ ტარიფი" : "Select Your Active Plan"}
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Single Plan Select Option */}
                  <div
                    onClick={() => setPricingPlanToggle("single")}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-28 ${
                      pricingPlanToggle === "single"
                        ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/10"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-900">Single</span>
                      {pricingPlanToggle === "single" && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-black text-slate-950">
                        {language === "ka" ? "50 ₾" : "$20"}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        {language === "ka" ? "1 მომხმარებელი" : "1 seat included"}
                      </span>
                    </div>
                  </div>

                  {/* Multi Plan Select Option */}
                  <div
                    onClick={() => setPricingPlanToggle("multi")}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-28 relative ${
                      pricingPlanToggle === "multi"
                        ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/10"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="absolute -top-2 right-3 px-2 py-0.5 bg-orange-500 text-white rounded-full text-[7px] font-black uppercase tracking-widest">
                      {language === "ka" ? "პოპულარული" : "Best"}
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-900">Multi</span>
                      {pricingPlanToggle === "multi" && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-black text-slate-950">
                        {language === "ka" ? "100 ₾" : "$40"}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        {language === "ka" ? "გუნდური როლები" : "Multi-role system"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{language === "ka" ? "კომპანიის შექმნა და დაწყება" : "Create Company & Build Workspace"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <div className="text-center text-[10px] font-semibold text-slate-400">
            {language === "ka" 
              ? "შეგიძლიათ ტარიფი შეცვალოთ ნებისმიერ დროს კომპანიის პარამეტრებიდან." 
              : "Pricing plan selection is a simulation. No real credit card required at this step."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#fdfdfd] text-slate-800 font-sans antialiased pb-12 transition-colors duration-300 relative overflow-x-hidden"
      style={{ backgroundImage: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(244, 63, 94, 0.05) 0px, transparent 50%)' }}
    >
      {isRoleLockedFromUrl && (
        <div className="bg-slate-950 text-slate-100 text-[11px] py-2 px-4 flex items-center justify-between gap-3 font-bold border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>
              {language === "ka"
                ? `თანამშრომლის რეჟიმი: ჩაკეტილი ხედი (${activeRole === "accountant" ? "ბუღალტერი / ფინანსისტი" : "შესყიდვების მენეჯერი"})`
                : `Employee Mode: Locked view (${activeRole === "accountant" ? "Accountant / Auditor" : "Purchasing Officer"})`}
            </span>
          </div>
          <button
            onClick={() => {
              setIsRoleLockedFromUrl(false);
              setActiveRole("admin");
              try {
                const url = new URL(window.location.href);
                url.searchParams.delete("role");
                window.history.pushState({}, "", url.toString());
              } catch (_) {}
            }}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[9px] font-black transition-all cursor-pointer shadow-sm shadow-amber-500/10"
          >
            {language === "ka" ? "მფლობელის რეჟიმზე დაბრუნება" : "Return to Owner Mode"}
          </button>
        </div>
      )}

      {/* Top Banner / Header */}
      <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-lg border-b border-slate-200/60 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 id="app-title" className="font-bold text-slate-900 text-base sm:text-xl leading-none">
                {t.title}
              </h1>
              <p className="text-xs text-slate-400 mt-1 hidden sm:block">
                {language === "ka" ? "ინვოისებისა და ხარჯების ჭკვიანი ანალიზი" : "Intelligent invoice & expense management"}
              </p>
            </div>
          </div>

          {/* Desktop Controls (hidden on mobile) */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Workspace Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span className="max-w-[100px] truncate">{activeWorkspace}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showWorkspaceDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-fadeIn">
                  <div className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>{language === "ka" ? "სამუშაო სივრცეები" : "Workspaces / Entities"}</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {workspaces.map((ws, index) => {
                      const isEditing = editingWorkspaceIndex === index;
                      const isSelected = activeWorkspace === ws;

                      return (
                        <div
                          key={ws}
                          className={`group w-full px-3 py-2 text-xs transition-all flex items-center justify-between gap-1.5 ${
                            isSelected ? "bg-indigo-50/70" : "hover:bg-slate-50/80"
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editingWorkspaceName}
                                onChange={(e) => setEditingWorkspaceName(e.target.value)}
                                className="flex-1 px-1.5 py-0.5 text-xs font-bold border border-indigo-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const trimmed = editingWorkspaceName.trim();
                                    if (trimmed && trimmed !== ws) {
                                      const updated = [...workspaces];
                                      updated[index] = trimmed;
                                      setWorkspaces(updated);
                                      if (activeWorkspace === ws) {
                                        setActiveWorkspace(trimmed);
                                      }
                                      const updatedInvoices = invoices.map(inv => {
                                        if ((inv as any).workspace === ws) {
                                          return { ...inv, workspace: trimmed };
                                        }
                                        return inv;
                                      });
                                      saveInvoices(updatedInvoices);
                                    }
                                    setEditingWorkspaceIndex(null);
                                    setEditingWorkspaceName("");
                                  } else if (e.key === "Escape") {
                                    setEditingWorkspaceIndex(null);
                                    setEditingWorkspaceName("");
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  const trimmed = editingWorkspaceName.trim();
                                  if (trimmed && trimmed !== ws) {
                                    const updated = [...workspaces];
                                    updated[index] = trimmed;
                                    setWorkspaces(updated);
                                    if (activeWorkspace === ws) {
                                      setActiveWorkspace(trimmed);
                                    }
                                    const updatedInvoices = invoices.map(inv => {
                                      if ((inv as any).workspace === ws) {
                                        return { ...inv, workspace: trimmed };
                                      }
                                      return inv;
                                    });
                                    saveInvoices(updatedInvoices);
                                  }
                                  setEditingWorkspaceIndex(null);
                                  setEditingWorkspaceName("");
                                }}
                                className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingWorkspaceIndex(null);
                                  setEditingWorkspaceName("");
                                }}
                                className="p-0.5 text-slate-400 hover:bg-slate-100 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  handleWorkspaceSelect(ws);
                                  setShowWorkspaceDropdown(false);
                                }}
                                className={`flex-1 text-left font-bold truncate pr-1 cursor-pointer ${
                                  isSelected ? "text-indigo-700" : "text-slate-600"
                                }`}
                              >
                                {ws}
                              </button>
                              <div className="flex items-center gap-1 shrink-0">
                                {/* Edit Button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingWorkspaceIndex(index);
                                    setEditingWorkspaceName(ws);
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                                  title={language === "ka" ? "სახელის შეცვლა" : "Rename"}
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                {/* Delete Button */}
                                {workspaces.length > 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setWorkspaceToConfirmDelete(ws);
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                                    title={language === "ka" ? "წაშლა" : "Delete"}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0 ml-1" />
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Quick add in dropdown */}
                  <div className="p-2 bg-slate-50">
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder={language === "ka" ? "+ ახალი სივრცე..." : "+ New Workspace..."}
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newWorkspaceName.trim()) {
                            const ws = newWorkspaceName.trim();
                            if (!workspaces.includes(ws)) {
                              setWorkspaces([...workspaces, ws]);
                            }
                            setActiveWorkspace(ws);
                            setNewWorkspaceName("");
                            setShowWorkspaceDropdown(false);
                          }
                        }}
                        className="flex-1 px-2 py-1 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                      />
                      {newWorkspaceName.trim() && (
                        <button
                          onClick={() => {
                            const ws = newWorkspaceName.trim();
                            if (!workspaces.includes(ws)) {
                              setWorkspaces([...workspaces, ws]);
                            }
                            setActiveWorkspace(ws);
                            setNewWorkspaceName("");
                            setShowWorkspaceDropdown(false);
                          }}
                          className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 cursor-pointer"
                        >
                          {language === "ka" ? "დამატება" : "Add"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Active Pricing Plan Badge & Switcher */}
            {activePlan && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/60 border border-indigo-100/40 rounded-xl text-xs font-bold shadow-sm shrink-0">
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                  activePlan === "multi" 
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100" 
                    : "bg-slate-200 text-slate-700 border border-slate-300/40"
                }`}>
                  {activePlan === "multi" 
                    ? (language === "ka" ? "MULTI ტარიფი" : "MULTI PLAN") 
                    : (language === "ka" ? "SINGLE ტარიფი" : "SINGLE PLAN")}
                </span>
                <button
                  onClick={() => {
                    const nextPlan = activePlan === "multi" ? "single" : "multi";
                    setActivePlan(nextPlan);
                    localStorage.setItem("invoice_analyzer_plan_v1", nextPlan);
                  }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 transition-colors font-extrabold cursor-pointer hover:underline"
                  title={language === "ka" ? "ტარიფის შეცვლა (სიმულაცია)" : "Change Pricing Plan (Simulation)"}
                >
                  [{language === "ka" ? "შეცვლა" : "Change"}]
                </button>
              </div>
            )}

            {/* Language Switcher */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 rounded-full p-1 border border-slate-200 shadow-sm">
                <button
                  onClick={() => setLanguage("ka")}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${language === "ka" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  ქართული
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${language === "en" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  English
                </button>
              </div>

              {/* Team Management Button (Only on Multi Plan) */}
              {currentUser && userPermissions.manageTeam && activePlan === "multi" && (
                <button
                  onClick={() => setCurrentView(currentView === "team" ? "dashboard" : "team")}
                  className={`px-3 py-1.5 border rounded-full transition-all cursor-pointer shadow-sm shrink-0 flex items-center justify-center gap-1.5 text-xs font-bold ${
                    currentView === "team"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/50"
                  }`}
                  title={language === "ka" ? "გუნდის მართვა" : "Team Management"}
                >
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">{language === "ka" ? "გუნდი" : "Team"}</span>
                </button>
              )}

              {/* Settings Page Mockup Button */}
              {currentUser && (
                <button
                  onClick={() => setCurrentView(currentView === "settings" ? "dashboard" : "settings")}
                  className={`p-1.5 border rounded-full transition-all cursor-pointer shadow-sm shrink-0 flex items-center justify-center ${
                    currentView === "settings"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200/50"
                  }`}
                  title={language === "ka" ? "პარამეტრები" : "Settings"}
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}

              {/* Logout Button */}
              {currentUser && (
                <button
                  onClick={handleMockLogout}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 rounded-full transition-all cursor-pointer shadow-sm shrink-0 flex items-center justify-center"
                  title={language === "ka" ? "გამოსვლა" : "Log Out"}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Navigation Trigger (hidden on desktop) */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => {
                setShowMobileMenu(!showMobileMenu);
                setShowWorkspaceDropdown(false); // reset workspace dropdown when toggling menu
              }}
              className="p-2 text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-100/80 rounded-xl border border-slate-200/60 shadow-sm transition-all cursor-pointer flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-lg px-4 py-4 space-y-4 animate-fadeIn shadow-lg">
            {/* Workspace Selector for Mobile */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === "ka" ? "სამუშაო სივრცე" : "Workspace / Entity"}
              </span>
              <div className="relative">
                <button
                  onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                  className="w-full inline-flex items-center justify-between gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Briefcase className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">{activeWorkspace}</span>
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {showWorkspaceDropdown && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-fadeIn">
                    <div className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      {language === "ka" ? "სამუშაო სივრცეები" : "Workspaces"}
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                      {workspaces.map((ws, index) => {
                        const isEditing = editingWorkspaceIndex === index;
                        const isSelected = activeWorkspace === ws;

                        return (
                          <div
                            key={ws}
                            className={`px-3 py-2 text-xs transition-all flex items-center justify-between gap-1.5 ${
                              isSelected ? "bg-indigo-50/70" : "hover:bg-slate-50"
                            }`}
                          >
                            {isEditing ? (
                              <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingWorkspaceName}
                                  onChange={(e) => setEditingWorkspaceName(e.target.value)}
                                  className="flex-1 px-1.5 py-0.5 text-xs font-bold border border-indigo-200 rounded-lg focus:outline-none"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      const trimmed = editingWorkspaceName.trim();
                                      if (trimmed && trimmed !== ws) {
                                        const updated = [...workspaces];
                                        updated[index] = trimmed;
                                        setWorkspaces(updated);
                                        if (activeWorkspace === ws) {
                                          setActiveWorkspace(trimmed);
                                        }
                                        const updatedInvoices = invoices.map(inv => {
                                          if ((inv as any).workspace === ws) {
                                            return { ...inv, workspace: trimmed };
                                          }
                                          return inv;
                                        });
                                        saveInvoices(updatedInvoices);
                                      }
                                      setEditingWorkspaceIndex(null);
                                      setEditingWorkspaceName("");
                                    } else if (e.key === "Escape") {
                                      setEditingWorkspaceIndex(null);
                                      setEditingWorkspaceName("");
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    const trimmed = editingWorkspaceName.trim();
                                    if (trimmed && trimmed !== ws) {
                                      const updated = [...workspaces];
                                      updated[index] = trimmed;
                                      setWorkspaces(updated);
                                      if (activeWorkspace === ws) {
                                        setActiveWorkspace(trimmed);
                                      }
                                      const updatedInvoices = invoices.map(inv => {
                                        if ((inv as any).workspace === ws) {
                                          return { ...inv, workspace: trimmed };
                                        }
                                        return inv;
                                      });
                                      saveInvoices(updatedInvoices);
                                    }
                                    setEditingWorkspaceIndex(null);
                                    setEditingWorkspaceName("");
                                  }}
                                  className="p-0.5 text-emerald-600"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    handleWorkspaceSelect(ws);
                                    setShowWorkspaceDropdown(false);
                                  }}
                                  className={`flex-1 text-left font-bold truncate cursor-pointer ${
                                    isSelected ? "text-indigo-700" : "text-slate-600"
                                  }`}
                                >
                                  {ws}
                                </button>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingWorkspaceIndex(index);
                                      setEditingWorkspaceName(ws);
                                    }}
                                    className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  {workspaces.length > 1 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setWorkspaceToConfirmDelete(ws);
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-2 bg-slate-50">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder={language === "ka" ? "+ ახალი სივრცე..." : "+ New Workspace..."}
                          value={newWorkspaceName}
                          onChange={(e) => setNewWorkspaceName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newWorkspaceName.trim()) {
                              const ws = newWorkspaceName.trim();
                              if (!workspaces.includes(ws)) {
                                setWorkspaces([...workspaces, ws]);
                              }
                              setActiveWorkspace(ws);
                              setNewWorkspaceName("");
                              setShowWorkspaceDropdown(false);
                            }
                          }}
                          className="flex-1 px-2 py-1 text-xs font-bold border border-slate-200 rounded-lg focus:outline-none bg-white"
                        />
                        {newWorkspaceName.trim() && (
                          <button
                            onClick={() => {
                              const ws = newWorkspaceName.trim();
                              if (!workspaces.includes(ws)) {
                                setWorkspaces([...workspaces, ws]);
                              }
                              setActiveWorkspace(ws);
                              setNewWorkspaceName("");
                              setShowWorkspaceDropdown(false);
                            }}
                            className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            {language === "ka" ? "დამატება" : "Add"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Pricing Plan Badge & Switcher for Mobile */}
            {activePlan && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === "ka" ? "აქტიური ტარიფი" : "Active Plan"}
                </span>
                <div className="flex items-center justify-between p-3 bg-indigo-50/60 border border-indigo-100/40 rounded-xl">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    activePlan === "multi" 
                      ? "bg-indigo-600 text-white shadow-sm" 
                      : "bg-slate-200 text-slate-700 border border-slate-300/40"
                  }`}>
                    {activePlan === "multi" 
                      ? (language === "ka" ? "MULTI ტარიფი" : "MULTI PLAN") 
                      : (language === "ka" ? "SINGLE ტარიფი" : "SINGLE PLAN")}
                  </span>
                  <button
                    onClick={() => {
                      const nextPlan = activePlan === "multi" ? "single" : "multi";
                      setActivePlan(nextPlan);
                      localStorage.setItem("invoice_analyzer_plan_v1", nextPlan);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors font-extrabold cursor-pointer hover:underline"
                  >
                    [{language === "ka" ? "შეცვლა" : "Change"}]
                  </button>
                </div>
              </div>
            )}

            {/* Language Switcher for Mobile */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === "ka" ? "ენა / Language" : "Language"}
              </span>
              <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 shadow-sm w-full">
                <button
                  onClick={() => setLanguage("ka")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${language === "ka" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  ქართული
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${language === "en" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Settings & Team & Logout for Mobile */}
            {currentUser && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                {userPermissions.manageTeam && activePlan === "multi" && (
                  <button
                    onClick={() => {
                      setCurrentView(currentView === "team" ? "dashboard" : "team");
                      setShowMobileMenu(false);
                    }}
                    className={`w-full py-2 px-3 border rounded-xl transition-all cursor-pointer shadow-sm text-xs font-bold flex items-center justify-center gap-2 ${
                      currentView === "team"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/50"
                    }`}
                  >
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>{language === "ka" ? "გუნდის მართვა" : "Team Management"}</span>
                  </button>
                )}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      setCurrentView(currentView === "settings" ? "dashboard" : "settings");
                      setShowMobileMenu(false);
                    }}
                    className={`flex-1 py-2 px-3 border rounded-xl transition-all cursor-pointer shadow-sm text-xs font-bold flex items-center justify-center gap-2 ${
                      currentView === "settings"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200/50"
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>{language === "ka" ? "პარამეტრები" : "Settings"}</span>
                  </button>

                  <button
                    onClick={() => {
                      handleMockLogout();
                      setShowMobileMenu(false);
                    }}
                    className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 rounded-xl transition-all cursor-pointer shadow-sm text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{language === "ka" ? "გამოსვლა" : "Log Out"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {inviteToken ? (
          <AcceptInviteView
            token={inviteToken}
            language={language}
            onAccepted={(resUser, sessionToken) => {
              setInviteToken(null);
              window.history.replaceState({}, "", "/");
              refreshUser();
              setCurrentView("dashboard");
              showToast(language === "ka" ? "მოწვევა მიღებულია! კეთილი იყოს თქვენი მობრძანება" : "Invite accepted! Welcome", "success");
            }}
            onGoHome={() => {
              setInviteToken(null);
              window.history.replaceState({}, "", "/");
              setCurrentView("landing");
            }}
          />
        ) : currentView === "team" && activePlan === "multi" ? (
          <TeamManagement
            language={language}
            currentUserEmail={currentUser?.email || ""}
            userPermissions={userPermissions}
            onGoBack={() => setCurrentView("dashboard")}
            showToast={showToast}
          />
        ) : currentView === "settings" ? (
          <SettingsMockup
            language={language}
            userEmail={currentUser?.email || "slinchenko021@gmail.com"}
            companyName={userCompany}
            activePlan={activePlan}
            onGoBack={() => setCurrentView("dashboard")}
            onUpdateSettings={handleUpdateSettings}
          />
        ) : currentView === "not-found" ? (
          <NotFoundView
            language={language}
            onGoHome={() => setCurrentView("dashboard")}
          />
        ) : (
          <>
        
        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t.title}
          </h2>
          {t.subtitle && (
            <p className="text-slate-500 mt-2 text-sm sm:text-base leading-relaxed">
              {t.subtitle}
            </p>
          )}
        </div>

        {/* Premium Tools Section */}
        <div className="grid grid-cols-1 gap-4">
          <LiveExchangeRates
            language={language}
            onRatesChanged={(rates) => setExchangeRates(rates)}
          />
        </div>

        {/* Upload Zone */}
        <div id="upload-zone-container" className="max-w-3xl mx-auto">
          {currentRolePermissions.canUpload ? (
            <InvoiceUploadZone 
              language={language}
              onUpload={handleUpload}
              isAnalyzing={isAnalyzing}
            />
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-8 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center space-y-3.5 animate-fadeIn">
              <div className="p-3.5 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-700">
                  {language === "ka" ? "დოკუმენტების ატვირთვა შეზღუდულია" : "Document Uploading Restricted"}
                </p>
                <p className="text-[11px] text-slate-400 font-semibold max-w-sm mt-1 mx-auto leading-normal">
                  {language === "ka" 
                    ? "მფლობელმა ამ როლისთვის გამორთო ინვოისების/ჩეკების ატვირთვის ფუნქცია. მის გასააქტიურებლად შეცვალეთ ნებართვები როლების სიმულატორიდან." 
                    : "The owner has locked document upload privileges for this role. Customize this setting using the Admin/Owner simulator above."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Server status/error alerts */}
        {error && (
          <div className="max-w-3xl mx-auto p-4 bg-amber-50/70 backdrop-blur-sm text-amber-900 rounded-2xl border border-amber-200/50 text-sm flex gap-3 shadow-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            <div className="space-y-1">
              <p className="font-semibold">{t.errorMsg}</p>
              <p className="text-amber-800">{error}</p>
              <p className="text-xs text-amber-500 mt-1 font-medium">
                {language === "ka" 
                  ? "მინიშნება: დარწმუნდით, რომ ჩართეთ Gemini API-ის საიდუმლო გასაღები AI Studio პარამეტრებიდან."
                  : "Tip: Make sure you have added your GEMINI_API_KEY in the Secrets tab of the AI Studio settings."}
              </p>
            </div>
          </div>
        )}

        {/* Premium AI Financial Insights */}
        {currentRolePermissions.viewAnalytics && (
          <SmartInsights
            language={language}
            invoices={workspaceInvoices}
            currency="GEL"
            budgets={budgets.GEL}
          />
        )}

        {/* Invoice Summary and Stats Cards */}
        {currentRolePermissions.viewAnalytics && (
          <InvoiceSummaryCards language={language} invoices={workspaceInvoices} />
        )}

        {/* Interactive Spend Analytics & Category Budgets */}
        {currentRolePermissions.viewAnalytics && (
          <InvoiceAnalytics 
            language={language} 
            invoices={workspaceInvoices} 
            onBudgetsChanged={(b) => setBudgets(b)} 
            canManageBudgets={currentRolePermissions.manageBudgets}
          />
        )}

        {/* Vendor & Supplier Spend Analysis */}
        {currentRolePermissions.viewAnalytics && (
          <VendorAnalytics
            language={language}
            invoices={workspaceInvoices}
          />
        )}

        {/* Main Table Area */}
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col">
          {/* Controls Bar */}
          <div className="p-5 border-b border-slate-200/40 bg-slate-50/30 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            {/* Left: Search & Filter */}
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="search-input"
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200/60 rounded-xl bg-white/60 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <select
                  id="category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-48 pl-3 pr-8 py-2 border border-slate-200/60 rounded-xl bg-white/60 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">📁 {t.allCategories}</option>
                  {Object.entries(CATEGORY_LABELS).map(([key, lbl]) => (
                    <option key={key} value={key}>
                      {language === "ka" ? lbl.ka : lbl.en}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Date Filter Dropdown */}
              <div className="relative">
                <select
                  id="date-filter"
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value as any)}
                  className="w-full sm:w-40 pl-3 pr-8 py-2 border border-slate-200/60 rounded-xl bg-white/60 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">📅 {t.allTime}</option>
                  <option value="this_month">📅 {t.thisMonth}</option>
                  <option value="last_30">📅 {t.last30Days}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex gap-2.5 shrink-0">
              {/* Create Custom Invoice Button */}
              <button
                type="button"
                onClick={() => currentRolePermissions.canUpload && handleAddManual()}
                disabled={!currentRolePermissions.canUpload}
                className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm font-bold shadow-sm transition-all duration-200 ${
                  currentRolePermissions.canUpload
                    ? "border-indigo-200 bg-indigo-50 hover:bg-indigo-100/70 text-indigo-700 cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:shadow-md"
                    : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
                title={currentRolePermissions.canUpload 
                  ? (language === "ka" ? "ინვოისის ხელით შექმნა" : "Create Manual Invoice")
                  : (language === "ka" ? "შექმნა შეზღუდულია მფლობელის მიერ" : "Creation locked by Owner")
                }
              >
                {currentRolePermissions.canUpload ? (
                  <Plus className="w-4 h-4 text-indigo-600 animate-pulse" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-400" />
                )}
                <span className="hidden sm:inline">{language === "ka" ? "ინვოისის შექმნა" : "Create Invoice"}</span>
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  id="export-dropdown-btn"
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  disabled={filteredInvoices.length === 0}
                  className={`inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200 cursor-pointer ${
                    filteredInvoices.length === 0 ? "opacity-50 cursor-not-allowed hover:bg-slate-900" : "hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>{t.exportMenu}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showExportDropdown ? "rotate-180" : ""}`} />
                </button>

                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-52 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-fadeIn">
                    <button
                      onClick={() => {
                        handleExportCsv();
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-indigo-50/50 hover:text-indigo-600 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-extrabold uppercase">CSV</span>
                      {t.exportCsv}
                    </button>
                    <button
                      onClick={() => {
                        handleExportExcel();
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-emerald-50/80 hover:text-emerald-700 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <span className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-extrabold uppercase">XLS</span>
                      {t.exportExcel}
                    </button>
                    <button
                      onClick={() => {
                        setShowPdfReport(true);
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-rose-50/80 hover:text-rose-700 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <span className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-extrabold uppercase">PDF</span>
                      {language === "ka" ? "ბრენდირებული PDF რეპორტი" : "Branded PDF Report"}
                    </button>
                  </div>
                )}
              </div>

              {/* Clear all */}
              {invoices.length > 0 && currentRolePermissions.canDelete && (
                <button
                  onClick={handleClearAll}
                  className="p-2 text-red-500 hover:bg-red-50/80 rounded-xl transition-all border border-transparent hover:border-red-100 cursor-pointer"
                  title={t.clearAll}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Table proper */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/60 select-none">
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/60 hover:text-indigo-600 transition-all rounded-tl-2xl group"
                    onClick={() => handleSort("vendor")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{t.vendor}</span>
                      <div className="flex flex-col shrink-0">
                        <ChevronUp className={`w-3 h-3 -mb-1 transition-colors ${sortColumn === "vendor" && sortDirection === "asc" ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-400"}`} />
                        <ChevronDown className={`w-3 h-3 transition-colors ${sortColumn === "vendor" && sortDirection === "desc" ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-400"}`} />
                      </div>
                    </div>
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100/60 hover:text-indigo-600 transition-all group"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{t.date}</span>
                      <div className="flex flex-col shrink-0">
                        <ChevronUp className={`w-3 h-3 -mb-1 transition-colors ${sortColumn === "date" && sortDirection === "asc" ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-400"}`} />
                        <ChevronDown className={`w-3 h-3 transition-colors ${sortColumn === "date" && sortDirection === "desc" ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-400"}`} />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-4">{t.category}</th>
                  <th className="px-6 py-4">{t.items}</th>
                  <th 
                    className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100/60 hover:text-indigo-600 transition-all group"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>{t.total}</span>
                      <div className="flex flex-col shrink-0">
                        <ChevronUp className={`w-3 h-3 -mb-1 transition-colors ${sortColumn === "amount" && sortDirection === "asc" ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-400"}`} />
                        <ChevronDown className={`w-3 h-3 transition-colors ${sortColumn === "amount" && sortDirection === "desc" ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-400"}`} />
                      </div>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center w-32">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoadingInvoices ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <tr key={index} className="animate-pulse border-b border-slate-100">
                      <td className="px-6 py-5">
                        <div className="h-4 bg-slate-200/80 rounded w-2/3 mb-2"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 bg-slate-200/80 rounded w-1/3"></div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-6 bg-slate-200/80 rounded-lg w-20"></div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 bg-slate-200/80 rounded w-1/2"></div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="h-4 bg-slate-200/80 rounded w-1/3 ml-auto"></div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-8 bg-slate-200/80 rounded-lg w-16 mx-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredInvoices.map((inv) => {
                    const categoryLabel = CATEGORY_LABELS[inv.category] || CATEGORY_LABELS.other;
                    const categoryColor = CATEGORY_COLORS[inv.category] || CATEGORY_COLORS.other;

                    return (
                      <tr key={inv.id} className="hover:bg-indigo-50/20 hover:shadow-sm border-l-2 border-l-transparent hover:border-l-indigo-500 transition-all duration-200">
                        {/* Vendor & doc name */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{inv.vendor}</div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px] font-medium" title={inv.fileName}>
                            📄 {inv.fileName}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-medium">
                          {inv.date}
                        </td>

                        {/* Category Badge */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${categoryColor}`}>
                              {language === "ka" ? categoryLabel.ka : categoryLabel.en}
                            </span>
                            {isInvoiceOverBudget(inv.category, inv.currency) && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-red-600 bg-red-50 border border-red-200/50 rounded-md px-1.5 py-0.5 uppercase tracking-wider animate-pulse">
                                <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                                <span>{language === "ka" ? "ლიმიტს გარეთ" : "Over Budget"}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Purchased products summary */}
                        <td className="px-6 py-4 max-w-[240px]">
                          <div className="text-slate-600 truncate font-medium" title={inv.items.map((i) => i.name).join(", ")}>
                            {inv.items.length > 0 
                              ? inv.items.map((i) => i.name).join(", ") 
                              : "-"}
                          </div>
                          {inv.items.length > 1 && (
                            <span className="inline-flex mt-1 text-[10px] font-bold bg-white/60 text-slate-500 px-1.5 py-0.5 rounded-lg border border-slate-200/40">
                              +{inv.items.length - 1} {language === "ka" ? "სხვა" : "more"}
                            </span>
                          )}
                        </td>

                        {/* Total Amount */}
                        <td className="px-6 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                          {inv.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          <span className="text-xs font-semibold text-slate-400">{inv.currency}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => setSelectedInvoice(inv)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200/50 transition-all cursor-pointer"
                              title={t.viewDocument}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {currentRolePermissions.canDelete && (
                              <button
                                onClick={() => handleDelete(inv.id)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-red-100 transition-all cursor-pointer"
                                title={t.delete}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Empty State */}
                {!isLoadingInvoices && filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl mb-4 shadow-sm border border-indigo-100/40">
                          <FileText className="w-10 h-10" />
                        </div>
                        <h3 className="font-extrabold text-slate-950 text-lg tracking-tight">
                          {invoices.length === 0 
                            ? t.noData 
                            : (language === "ka" ? "ფილტრის შესაბამისი ინვოისები არ მოიძებნა." : "No invoices matched your filters.")}
                        </h3>
                        <p className="text-slate-500 mt-2 text-xs font-medium leading-relaxed">
                          {invoices.length === 0 
                            ? (language === "ka" 
                                ? "ატვირთეთ ინვოისის PDF, JPG, ან PNG დოკუმენტი Gemini-ით ავტომატური ანალიზისთვის, ან დაამატეთ ხელით."
                                : "Upload PDF, JPG, or PNG invoice documents to automatically parse details using Gemini AI, or add one manually.")
                            : (language === "ka" 
                                ? "შეცვალეთ საძიებო სიტყვა, თარიღის დიაპაზონი ან კატეგორიის ფილტრი სხვა მონაცემების სანახავად."
                                : "Adjust your search phrase, date range, or category filter to view other entries.")}
                        </p>
                        {invoices.length === 0 && (
                          <div className="mt-6 flex flex-wrap gap-3 justify-center">
                            <button
                              onClick={() => {
                                const el = document.getElementById("upload-zone-container");
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                                }
                              }}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 cursor-pointer"
                            >
                              {language === "ka" ? "ატვირთე პირველი დოკუმენტი" : "Upload First Document"}
                            </button>
                            {currentRolePermissions.canUpload && (
                              <button
                                onClick={handleAddManual}
                                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                              >
                                {language === "ka" ? "მექანიკური შეყვანა" : "Manual Entry"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (block md:hidden) */}
          <div className="block md:hidden p-4 space-y-4">
            {isLoadingInvoices ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white/80 border border-slate-200/50 rounded-2xl p-4 space-y-3 animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  </div>
                  <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-6 bg-slate-200 rounded-lg w-16"></div>
                    <div className="h-8 bg-slate-200 rounded-lg w-12"></div>
                  </div>
                </div>
              ))
            ) : filteredInvoices.length === 0 ? (
              <div className="py-12 text-center">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl mx-auto w-fit mb-4 shadow-sm border border-indigo-100/40">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-slate-950 text-base tracking-tight">
                  {invoices.length === 0 
                    ? t.noData 
                    : (language === "ka" ? "ფილტრის შესაბამისი ინვოისები არ მოიძებნა." : "No invoices matched filters.")}
                </h3>
                <p className="text-slate-500 mt-1.5 text-[11px] font-medium leading-relaxed max-w-xs mx-auto">
                  {invoices.length === 0 
                    ? (language === "ka" 
                        ? "ატვირთეთ ინვოისის PDF, JPG, ან PNG დოკუმენტი Gemini-ით ანალიზისთვის, ან დაამატეთ ხელით."
                        : "Upload document to analyze, or add one manually.")
                    : (language === "ka" 
                        ? "შეცვალეთ საძიებო სიტყვა ან კატეგორიის ფილტრი სხვა მონაცემების სანახავად."
                        : "Adjust search phrase or category filter.")}
                </p>
              </div>
            ) : (
              filteredInvoices.map((inv) => {
                const categoryLabel = CATEGORY_LABELS[inv.category] || CATEGORY_LABELS.other;
                const categoryColor = CATEGORY_COLORS[inv.category] || CATEGORY_COLORS.other;

                return (
                  <div
                    key={inv.id}
                    className="bg-white/80 border border-slate-200/50 rounded-2xl p-4 shadow-sm space-y-3 hover:border-indigo-200 transition-all cursor-pointer active:scale-[0.99]"
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm leading-tight truncate max-w-[160px]">{inv.vendor || "Unknown"}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[160px]">
                          📄 {inv.fileName}
                        </p>
                      </div>
                      <div className="text-right whitespace-nowrap shrink-0">
                        <span className="font-extrabold text-slate-950 text-sm">
                          {inv.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{inv.currency}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100/60">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${categoryColor}`}>
                          {language === "ka" ? categoryLabel.ka : categoryLabel.en}
                        </span>
                        {isInvoiceOverBudget(inv.category, inv.currency) && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold text-red-600 bg-red-50 border border-red-200/50 rounded-md px-1.5 py-0.5 uppercase tracking-wider animate-pulse">
                            <AlertCircle className="w-2 h-2 shrink-0" />
                            <span>{language === "ka" ? "ლიმიტს გარეთ" : "Over Budget"}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">{inv.date}</span>
                    </div>

                    {inv.items && inv.items.length > 0 && (
                      <div className="text-[10px] font-medium text-slate-500 bg-slate-50/50 rounded-xl p-2 max-w-full">
                        <span className="font-bold text-slate-400 block mb-0.5 text-[8px] uppercase tracking-widest">
                          {language === "ka" ? "პროდუქტები" : "Purchased items"}
                        </span>
                        <div className="truncate text-slate-600">
                          {inv.items.map((i) => i.name).join(", ")}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(inv);
                        }}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{language === "ka" ? "დეტალები" : "Details"}</span>
                      </button>
                      {currentRolePermissions.canDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(inv.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        </>
        )}
      </main>

      {/* Invoice Detail / Edit Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          language={language}
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSave={handleSaveInvoice}
        />
      )}

      {/* Custom Confirmation Modals */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform scale-100 transition-all duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {language === "ka" ? "ჩანაწერის წაშლა" : "Delete Record"}
                </h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  {language === "ka"
                    ? "ნამდვილად გსურთ ამ ჩანაწერის სამუდამოდ წაშლა? ამ მოქმედების გაუქმება შეუძლებელია."
                    : "Are you sure you want to permanently delete this record? This action cannot be undone."}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer"
              >
                {language === "ka" ? "გაუქმება" : "Cancel"}
              </button>
              <button
                onClick={() => executeDelete(confirmDeleteId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-red-200 transition-all cursor-pointer"
              >
                {language === "ka" ? "წაშლა" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform scale-100 transition-all duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {language === "ka" ? "ყველა ჩანაწერის წაშლა" : "Clear All Records"}
                </h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  {language === "ka"
                    ? "ნამდვილად გსურთ ყველა ჩანაწერის სამუდამოდ წაშლა? ამ მოქმედების გაუქმება შეუძლებელია."
                    : "Are you sure you want to permanently delete all records? This action cannot be undone."}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmClearAll(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer"
              >
                {language === "ka" ? "გაუქმება" : "Cancel"}
              </button>
              <button
                onClick={executeClearAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-red-200 transition-all cursor-pointer"
              >
                {language === "ka" ? "ყველაფრის წაშლა" : "Clear All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {workspaceToConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform scale-100 transition-all duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">
                  {language === "ka" ? "სამუშაო სივრცის წაშლა" : "Delete Workspace"}
                </h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed font-semibold">
                  {language === "ka"
                    ? `ნამდვილად გსურთ წაშალოთ სივრცე "${workspaceToConfirmDelete}" და მისი ყველა ინვოისი? ამ მოქმედების გაუქმება შეუძლებელია.`
                    : `Are you sure you want to permanently delete the workspace "${workspaceToConfirmDelete}" and all associated invoices? This action cannot be undone.`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setWorkspaceToConfirmDelete(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer"
              >
                {language === "ka" ? "გაუქმება" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  const ws = workspaceToConfirmDelete;
                  const updated = workspaces.filter(w => w !== ws);
                  setWorkspaces(updated);
                  const updatedInvoices = invoices.filter(inv => (inv as any).workspace !== ws);
                  saveInvoices(updatedInvoices);
                  if (activeWorkspace === ws) {
                    setActiveWorkspace(updated[0] || "პირადი ხარჯები");
                  }
                  setWorkspaceToConfirmDelete(null);
                  setShowWorkspaceModal(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-red-200 transition-all cursor-pointer"
              >
                {language === "ka" ? "წაშლა" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showManualInvoiceModal && (
        <ManualInvoiceModal
          language={language}
          onClose={() => setShowManualInvoiceModal(false)}
          onSave={handleSaveManualInvoice}
        />
      )}

      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800">
                {language === "ka" ? "სამუშაო სივრცეების მართვა" : "Manage Workspaces"}
              </h3>
              <button
                onClick={() => {
                  setShowWorkspaceModal(false);
                  setEditingWorkspaceName("");
                  setEditingWorkspaceIndex(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List and manage existing workspaces */}
            <div className="mt-4 space-y-2.5 max-h-52 overflow-y-auto pr-1">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                {language === "ka" ? "აქტიური სივრცეები" : "Active Workspaces"}
              </div>
              {workspaces.map((ws, index) => (
                <div key={ws} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl gap-2">
                  {editingWorkspaceIndex === index ? (
                    <input
                      type="text"
                      value={editingWorkspaceName}
                      onChange={(e) => setEditingWorkspaceName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs font-black border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                      autoFocus
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-700 truncate">{ws}</span>
                  )}

                  <div className="flex items-center gap-1.5 shrink-0">
                    {editingWorkspaceIndex === index ? (
                      <>
                        <button
                          onClick={() => {
                            const trimmed = editingWorkspaceName.trim();
                            if (trimmed && trimmed !== ws) {
                              // Rename workspace
                              // 1. Update in workspaces list
                              const updated = [...workspaces];
                              updated[index] = trimmed;
                              setWorkspaces(updated);
                              
                              // 2. Update activeWorkspace if it was this one
                              if (activeWorkspace === ws) {
                                setActiveWorkspace(trimmed);
                              }

                              // 3. Update all invoices associated with old workspace name
                              const updatedInvoices = invoices.map(inv => {
                                if ((inv as any).workspace === ws) {
                                  return { ...inv, workspace: trimmed };
                                }
                                return inv;
                              });
                              saveInvoices(updatedInvoices);
                            }
                            setEditingWorkspaceIndex(null);
                            setEditingWorkspaceName("");
                          }}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                          title="Save"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingWorkspaceIndex(null);
                            setEditingWorkspaceName("");
                          }}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingWorkspaceIndex(index);
                            setEditingWorkspaceName(ws);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                          title="Rename"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {workspaces.length > 1 && (
                          <button
                            onClick={() => {
                              setWorkspaceToConfirmDelete(ws);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Create new workspace section */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {language === "ka" ? "ახალი სივრცის დამატება" : "Add New Workspace"}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={language === "ka" ? "მაგ. მარკეტინგის დეპარტამენტი" : "e.g. Marketing Dept"}
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                />
                <button
                  onClick={() => {
                    if (newWorkspaceName.trim()) {
                      const ws = newWorkspaceName.trim();
                      if (!workspaces.includes(ws)) {
                        setWorkspaces([...workspaces, ws]);
                      }
                      handleWorkspaceSelect(ws);
                      setNewWorkspaceName("");
                      setShowWorkspaceModal(false);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer shrink-0"
                >
                  {language === "ka" ? "დამატება" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Feed */}
      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {placeholderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center space-y-6">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500" />
            
            <div className="mx-auto w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: "3s" }} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                {placeholderModal === "terms" 
                  ? (language === "ka" ? "წესები და პირობები" : "Terms & Conditions")
                  : (language === "ka" ? "კონფიდენციალურობის პოლიტიკა" : "Privacy Policy")}
              </h3>
              <p className="text-sm text-slate-500 font-bold">
                {language === "ka" ? "მალე დაემატება" : "Coming Soon..."}
              </p>
            </div>

            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              {language === "ka" 
                ? "ეს გვერდი ამჟამად მზადდება და უახლოეს პერიოდში იქნება ხელმისაწვდომი. გმადლობთ მოთმინებისთვის!"
                : "This document is currently being drafted and will be made available shortly. Thank you for your patience!"}
            </p>

            <button
              onClick={() => setPlaceholderModal(null)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-100 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {language === "ka" ? "დახურვა" : "Close"}
            </button>
          </div>
        </div>
      )}

      {showPdfReport && (
        <PDFReportGenerator
          language={language}
          invoices={workspaceInvoices}
          workspace={activeWorkspace}
          onClose={() => setShowPdfReport(false)}
        />
      )}
    </div>
  );
}
