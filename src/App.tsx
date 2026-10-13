import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Menu,
  Sun,
  Moon
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
import { PasswordResetView } from "./components/PasswordResetView";
import OnboardingChecklist from "./components/OnboardingChecklist";
import { PRICING } from "./config/pricing";
import OverviewPage from "./pages/OverviewPage";
import InvoicesPage from "./pages/InvoicesPage";
import AnalyticsPage from "./pages/AnalyticsPage";

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

  // Password reset token detection from URL
  const [resetToken, setResetToken] = useState<string | null>(() => {
    const path = window.location.pathname;
    if (path.startsWith("/reset-password/")) {
      return path.substring("/reset-password/".length);
    }
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || params.get("reset_token");
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

  // View state including overview (dashboard), invoices, analytics
  const [currentView, setCurrentView] = useState<
    | "landing"
    | "login"
    | "signup"
    | "create-company"
    | "settings"
    | "team"
    | "not-found"
    | "dashboard"
    | "invoices"
    | "analytics"
    | "forgot_password"
    | "reset_password"
  >(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    if (path.startsWith("/reset-password/") || params.get("token") || params.get("reset_token")) {
      return "reset_password";
    }
    const hash = window.location.hash.toLowerCase();
    if (hash === "#invoices") return "invoices";
    if (hash === "#analytics") return "analytics";
    if (hash === "#overview" || hash === "#dashboard") return "dashboard";
    return "landing";
  });
  const [placeholderModal, setPlaceholderModal] = useState<"terms" | "privacy" | null>(null);

  const rawPermissions: UserPermissions = user?.permissions || {
    uploadInvoices: true,
    deleteInvoices: user?.role === "admin",
    editBudgets: user?.role === "admin",
    viewAnalytics: true,
    manageTeam: user?.role === "admin",
    manageBilling: user?.role === "admin",
  };

  const userPermissions: UserPermissions = {
    ...rawPermissions,
  };

  const isInitialHashHandled = useRef(false);

  // Sync URL hash with currentView for navigation and back/forward browser buttons
  useEffect(() => {
    if (!isAuthenticated || !user?.company_id) return;
    
    let targetHash = "";
    if (currentView === "dashboard") {
      targetHash = "#overview";
    } else if (currentView === "invoices") {
      targetHash = "#invoices";
    } else if (currentView === "analytics") {
      targetHash = "#analytics";
    } else if (currentView === "team") {
      targetHash = "#team";
    } else if (currentView === "settings") {
      targetHash = "#settings";
    }

    if (!targetHash) return;

    if (window.location.hash.toLowerCase() !== targetHash) {
      if (!isInitialHashHandled.current) {
        // Initial setup upon page entry uses replaceState so history is clean
        window.history.replaceState(null, "", targetHash);
        isInitialHashHandled.current = true;
      } else {
        // Navigating between pages uses pushState so Back button works within the app
        window.history.pushState(null, "", targetHash);
      }
    } else {
      isInitialHashHandled.current = true;
    }
  }, [currentView, isAuthenticated, user?.company_id]);

  // Listen to browser hashchange (for Back/Forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const path = window.location.pathname;
      if (path.startsWith("/reset-password/")) return;
      if (!isAuthenticated || !user?.company_id) return;

      const hash = window.location.hash.toLowerCase();
      if (hash === "#overview" || hash === "#dashboard") {
        setCurrentView("dashboard");
      } else if (hash === "#invoices") {
        setCurrentView("invoices");
      } else if (hash === "#analytics") {
        setCurrentView("analytics");
      } else if (hash === "#team") {
        setCurrentView("team");
      } else if (hash === "#settings") {
        setCurrentView("settings");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [isAuthenticated, user?.company_id]);

  // Keep currentView synchronized with authentication state
  useEffect(() => {
    if (isAuthLoading) return;
    
    if (!isAuthenticated) {
      if (
        currentView !== "login" &&
        currentView !== "signup" &&
        currentView !== "landing" &&
        currentView !== "forgot_password" &&
        currentView !== "reset_password"
      ) {
        setCurrentView("landing");
      }
    } else {
      // User is logged in
      if (!user?.company_id) {
        setCurrentView("create-company");
      } else {
        // Logged in with company
        if (
          currentView === "landing" ||
          currentView === "login" ||
          currentView === "signup" ||
          currentView === "create-company" ||
          currentView === "forgot_password" ||
          currentView === "reset_password"
        ) {
          const hash = window.location.hash.toLowerCase();
          if (hash === "#invoices") {
            setCurrentView("invoices");
          } else if (hash === "#analytics") {
            setCurrentView("analytics");
          } else {
            setCurrentView("dashboard");
          }
        }
      }
    }
  }, [isAuthenticated, user?.company_id, isAuthLoading, currentView]);

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

  // Dark / Light Mode (Night Mode) State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme_mode") === "dark";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme_mode", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme_mode", "light");
    }
  }, [isDarkMode]);

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
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>("admin");

  useEffect(() => {
    if (user && user.role) {
      setActiveRole(user.role as UserRole);
    } else if (activePlan === "single") {
      setActiveRole("admin");
    }
    if (currentView === "team" && (activePlan !== "multi" || !userPermissions.manageTeam)) {
      setCurrentView("dashboard");
    }
  }, [user, activePlan, currentView]);

  // Close header dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown-container]")) {
        setShowWorkspaceDropdown(false);
        setShowSettingsDropdown(false);
      }
    };
    if (showWorkspaceDropdown || showSettingsDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showWorkspaceDropdown, showSettingsDropdown]);

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

  // Onboarding Tracking States
  const [hasExported, setHasExported] = useState<boolean>(() => {
    try {
      const key = `antx_onboarding_exported_${user?.company_id || "default"}`;
      return localStorage.getItem(key) === "true";
    } catch (_) {
      return false;
    }
  });

  const markExportCompleted = () => {
    setHasExported(true);
    try {
      const id = user?.company_id || user?.id || "default";
      localStorage.setItem(`antx_onboarding_exported_${id}`, "true");
    } catch (_) {}
  };

  const [hasCustomBudget, setHasCustomBudget] = useState<boolean>(() => {
    try {
      const key = `antx_onboarding_budget_customized_${user?.company_id || "default"}`;
      return localStorage.getItem(key) === "true";
    } catch (_) {}
    return false;
  });

  const handleBudgetsUpdated = (
    newBudgets: Record<string, Record<ExpenseCategory, number>>
  ) => {
    setBudgets(newBudgets);
  };

  // Re-read onboarding states when user/company resolves on refresh
  useEffect(() => {
    const id = user?.company_id || user?.id;
    if (!id) return;
    try {
      const expKey = `antx_onboarding_exported_${id}`;
      const defaultExpKey = "antx_onboarding_exported_default";
      const isExp =
        localStorage.getItem(expKey) === "true" ||
        localStorage.getItem(defaultExpKey) === "true";
      setHasExported(isExp);

      const budgetKey = `antx_onboarding_budget_customized_${id}`;
      const defaultBudgetKey = "antx_onboarding_budget_customized_default";
      const isBudget =
        localStorage.getItem(budgetKey) === "true" ||
        localStorage.getItem(defaultBudgetKey) === "true";
      setHasCustomBudget(isBudget);
    } catch (_) {}
  }, [user?.company_id, user?.id]);

  const handleBudgetEditedByUser = () => {
    setHasCustomBudget(true);
    try {
      const id = user?.company_id || user?.id || "default";
      localStorage.setItem(`antx_onboarding_budget_customized_${id}`, "true");
    } catch (_) {}
  };

  const [teamMembersCount, setTeamMembersCount] = useState<number>(1);

  useEffect(() => {
    if (
      isAuthenticated &&
      activePlan === "multi" &&
      user?.company_id &&
      userPermissions.manageTeam
    ) {
      apiFetch<{ members?: any[]; pendingInvites?: any[] }>("/api/team")
        .then((data) => {
          const count =
            (data.members?.length || 0) + (data.pendingInvites?.length || 0);
          setTeamMembersCount(Math.max(1, count));
        })
        .catch((err) => {
          console.error("Failed to load team count for onboarding checklist:", err);
        });
    }
  }, [isAuthenticated, activePlan, user?.company_id, userPermissions.manageTeam]);

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
    const isCurrentWorkspace = (inv: ExtractedInvoice) =>
      (inv as any).workspace === activeWorkspace || (!(inv as any).workspace && activeWorkspace === workspaces[0]);
    const toDeleteCount = invoices.filter(isCurrentWorkspace).length;
    const remaining = invoices.filter((inv) => !isCurrentWorkspace(inv));
    saveInvoices(remaining);
    if (selectedInvoice && isCurrentWorkspace(selectedInvoice)) {
      setSelectedInvoice(null);
    }
    setConfirmClearAll(false);
    showToast(
      language === "ka"
        ? `სივრციდან „${activeWorkspace}" ${toDeleteCount} ინვოისი წარმატებით წაიშალა.`
        : `Successfully deleted ${toDeleteCount} invoices from workspace "${activeWorkspace}".`,
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
    markExportCompleted();
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
    markExportCompleted();
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

  // Parse YYYY-MM-DD as local calendar date without timezone skew
  const parseLocalDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.slice(0, 10).split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m - 1, d);
      }
    }
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? null : new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  };

  // Filtering
  const filteredInvoices = workspaceInvoices.filter((inv) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inv.vendor.toLowerCase().includes(q) ||
      inv.amount.toString().includes(q) ||
      `${inv.amount} ${inv.currency}`.toLowerCase().includes(q) ||
      (inv.items && inv.items.some((item) => item.name.toLowerCase().includes(q)));
    
    const matchesCategory =
      selectedCategory === "all" || inv.category === selectedCategory;

    // Date range filter matching
    let matchesDate = true;
    if (dateRangeFilter === "this_month") {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const invDate = parseLocalDate(inv.date);
      matchesDate = !!invDate && invDate.getFullYear() === currentYear && invDate.getMonth() === currentMonth;
    } else if (dateRangeFilter === "last_30") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      const invDate = parseLocalDate(inv.date);
      // Strictly between thirtyDaysAgo and today inclusive (no future dates!)
      matchesDate = !!invDate && invDate >= thirtyDaysAgo && invDate <= today;
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
      <div className={`min-h-screen font-sans antialiased transition-all duration-300 relative overflow-x-hidden selection:bg-indigo-500 selection:text-white ${
        isDarkMode ? "dark bg-[#0b0f19] text-slate-100" : "bg-[#F8FAFC] text-slate-600"
      }`}>
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${
          isDarkMode ? "bg-[#111827]/90 border-slate-800 text-slate-100 shadow-md" : "bg-white/80 border-indigo-100/40 text-slate-900 shadow-sm"
        }`}>
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
            <div className="hidden md:flex items-center space-x-3">
              {/* Theme Selector */}
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-full p-1 border border-slate-200 dark:border-slate-700 shadow-xs">
                <button
                  onClick={() => setIsDarkMode(false)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                    !isDarkMode
                      ? "bg-white shadow-xs text-indigo-600"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title={language === "ka" ? "დღის რეჟიმი" : "Light Mode"}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden lg:inline text-[11px]">{language === "ka" ? "დღის" : "Light"}</span>
                </button>
                <button
                  onClick={() => setIsDarkMode(true)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                    isDarkMode
                      ? "bg-slate-900 shadow-xs text-amber-400 border border-slate-700/80"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                  title={language === "ka" ? "ღამის რეჟიმი (მუქი ფონი)" : "Dark Mode"}
                >
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline text-[11px]">{language === "ka" ? "ღამის" : "Dark"}</span>
                </button>
              </div>

              <button
                onClick={() => setLanguage(language === "ka" ? "en" : "ka")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
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
                    {language === "ka" ? `${PRICING.single.GEL} ₾` : `$${PRICING.single.USD}`}
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
                  onClick={() => {
                    setPricingPlanToggle("single");
                    setCurrentView("signup");
                  }}
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
                    {language === "ka" ? `${PRICING.multi.GEL} ₾` : `$${PRICING.multi.USD}`}
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
                  onClick={() => {
                    setPricingPlanToggle("multi");
                    setCurrentView("signup");
                  }}
                  className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {language === "ka" ? "გეგმის არჩევა" : "Select Multi Plan"}
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

  // 1.5 PASSWORD RESET VIEW
  if (!currentUser && (currentView === "forgot_password" || currentView === "reset_password")) {
    return (
      <PasswordResetView
        language={language}
        initialToken={resetToken}
        onSuccess={() => {
          setResetToken(null);
          window.history.replaceState({}, "", "/");
          setCurrentView("login");
        }}
        onCancel={() => {
          setResetToken(null);
          window.history.replaceState({}, "", "/");
          setCurrentView("login");
        }}
        showToast={showToast}
      />
    );
  }

  // 2. AUTHENTICATION GATEWAY (Login / Signup Split Screen - Mandate 2)
  if (!currentUser && (currentView === "login" || currentView === "signup")) {
    const isLogin = currentView === "login";

    return (
      <div className={`min-h-screen flex flex-col md:flex-row font-sans relative selection:bg-indigo-500 selection:text-white ${
        isDarkMode ? "dark bg-[#0b0f19] text-slate-100" : "bg-white text-slate-800"
      }`}>
        {/* Left Side: Dark Indigo Brand Presentation (Width: 50% on desktop, hidden on mobile) */}
        <div className={`hidden md:flex md:w-1/2 text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden ${
          isDarkMode ? "bg-[#0d1424] border-r border-slate-800" : "bg-[#1E1B4B]"
        }`}>
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
                ? "ატვირთეთ ნებისმიერი დოკუმენტი, ხოლო Gemini AI უმოკლეს დროში მოახდენს მის სრულ ანალიზს."
                : "Upload any document and Gemini AI analyzes it in seconds."}
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    {language === "ka" ? "პაროლი" : "Password"}
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setCurrentView("forgot_password")}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                    >
                      {language === "ka" ? "დაგავიწყდა პაროლი?" : "Forgot password?"}
                    </button>
                  )}
                </div>
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
                        {language === "ka" ? `${PRICING.single.GEL} ₾` : `$${PRICING.single.USD}`}
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
                        {language === "ka" ? `${PRICING.multi.GEL} ₾` : `$${PRICING.multi.USD}`}
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
      className={`min-h-screen font-sans antialiased pb-12 transition-colors duration-300 relative overflow-x-hidden ${
        isDarkMode 
          ? "dark bg-slate-950 text-slate-100" 
          : "bg-[#fdfdfd] text-slate-800"
      }`}
      style={
        isDarkMode
          ? { backgroundImage: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(244, 63, 94, 0.1) 0px, transparent 50%)' }
          : { backgroundImage: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.05) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(244, 63, 94, 0.05) 0px, transparent 50%)' }
      }
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
      <header className={`sticky top-0 z-40 backdrop-blur-lg border-b shadow-sm transition-colors ${
        isDarkMode 
          ? "bg-slate-900/80 border-slate-800 text-slate-100" 
          : "bg-white/60 border-slate-200/60 text-slate-900"
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Logo & Name (Name hidden on <1280px per requirements) */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
            <div className="p-2 sm:p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100 dark:shadow-indigo-900/20 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 h-5" />
            </div>
            <div className="hidden xl:block min-w-0">
              <h1 id="app-title" className={`font-bold text-sm sm:text-base lg:text-lg leading-none truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                {t.title}
              </h1>
              <p className={`text-[11px] mt-1 truncate ${isDarkMode ? "text-slate-400" : "text-slate-400"}`}>
                {language === "ka" ? "ინვოისებისა და ხარჯების ჭკვიანი ანალიზი" : "Intelligent invoice & expense management"}
              </p>
            </div>
          </div>

          {/* Center: Navigation Tabs (მიმოხილვა · ინვოისები · ანალიტიკა · გუნდი) */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs shrink-0">
              <button
                type="button"
                onClick={() => setCurrentView("dashboard")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === "dashboard"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {language === "ka" ? "მიმოხილვა" : "Overview"}
              </button>
              <button
                type="button"
                onClick={() => setCurrentView("invoices")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === "invoices"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {language === "ka" ? "ინვოისები" : "Invoices"}
              </button>
              <button
                type="button"
                onClick={() => setCurrentView("analytics")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentView === "analytics"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {language === "ka" ? "ანალიტიკა" : "Analytics"}
              </button>
              {userPermissions.manageTeam && activePlan === "multi" && (
                <button
                  type="button"
                  onClick={() => setCurrentView("team")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentView === "team"
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{language === "ka" ? "გუნდი" : "Team"}</span>
                </button>
              )}
            </nav>
          )}

          {/* Right: სამუშაო სივრცე · ტარიფის ბეჯი · ⚙ · გამოსვლა */}
          <div className="hidden md:flex items-center space-x-2 sm:space-x-2.5 shrink-0">
            {/* 1. Workspace Switcher */}
            <div className="relative" data-dropdown-container>
              <button
                onClick={() => {
                  setShowWorkspaceDropdown(!showWorkspaceDropdown);
                  setShowSettingsDropdown(false);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="max-w-[80px] sm:max-w-[110px] truncate">{activeWorkspace}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {showWorkspaceDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-fadeIn">
                  <div className="px-3.5 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                    <span>{language === "ka" ? "სამუშაო სივრცეები" : "Workspaces"}</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
                    {workspaces.map((ws, index) => {
                      const isEditing = editingWorkspaceIndex === index;
                      const isSelected = activeWorkspace === ws;

                      return (
                        <div
                          key={ws}
                          className={`group w-full px-3.5 py-2 text-xs transition-all flex items-center justify-between gap-1.5 ${
                            isSelected ? "bg-indigo-50/70 dark:bg-indigo-950/40" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editingWorkspaceName}
                                onChange={(e) => setEditingWorkspaceName(e.target.value)}
                                className="flex-1 px-1.5 py-0.5 text-xs font-bold border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                                className="p-0.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingWorkspaceIndex(null);
                                  setEditingWorkspaceName("");
                                }}
                                className="p-0.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
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
                                  isSelected ? "text-indigo-700 dark:text-indigo-400" : "text-slate-700 dark:text-slate-200"
                                }`}
                              >
                                {ws}
                              </button>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingWorkspaceIndex(index);
                                    setEditingWorkspaceName(ws);
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                                  title={language === "ka" ? "სახელის შეცვლა" : "Rename"}
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                {workspaces.length > 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setWorkspaceToConfirmDelete(ws);
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                                    title={language === "ka" ? "წაშლა" : "Delete"}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 ml-1" />
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Quick add in dropdown */}
                  <div className="p-2.5 bg-slate-50/70 dark:bg-slate-800/40">
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
                        className="flex-1 px-2.5 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
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
                          className="px-2.5 py-1 bg-indigo-600 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-700 cursor-pointer"
                        >
                          {language === "ka" ? "დამატება" : "Add"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Active Pricing Plan Badge */}
            {activePlan && (
              <div className="flex items-center px-2.5 py-1 bg-indigo-50/60 dark:bg-slate-800 border border-indigo-100/40 dark:border-slate-700 rounded-xl text-xs font-bold shadow-xs shrink-0">
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                  activePlan === "multi" 
                    ? "bg-indigo-600 text-white shadow-xs" 
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300/40 dark:border-slate-600"
                }`}>
                  {activePlan === "multi" 
                    ? (language === "ka" ? "MULTI ტარიფი" : "MULTI PLAN") 
                    : (language === "ka" ? "SINGLE ტარიფი" : "SINGLE PLAN")}
                </span>
              </div>
            )}

            {/* 3. ⚙ Settings Dropdown Menu (Contains Settings link, Theme toggle, Language toggle) */}
            <div className="relative" data-dropdown-container>
              <button
                onClick={() => {
                  setShowSettingsDropdown(!showSettingsDropdown);
                  setShowWorkspaceDropdown(false);
                }}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer shadow-xs flex items-center justify-center ${
                  showSettingsDropdown || currentView === "settings"
                    ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                    : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                }`}
                title={language === "ka" ? "პარამეტრები" : "Settings"}
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettingsDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 space-y-2 animate-fadeIn text-xs">
                  {/* Settings Page Button */}
                  {currentUser && (
                    <button
                      onClick={() => {
                        setCurrentView("settings");
                        setShowSettingsDropdown(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-left font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                        currentView === "settings"
                          ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>{language === "ka" ? "პარამეტრები" : "Settings"}</span>
                    </button>
                  )}

                  <div className="border-t border-slate-100 dark:border-slate-800" />

                  {/* Theme Switcher */}
                  <div className="px-1 py-0.5 space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      {language === "ka" ? "თემა / რეჟიმი" : "Theme Mode"}
                    </span>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setIsDarkMode(false)}
                        className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          !isDarkMode
                            ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>{language === "ka" ? "დღის" : "Light"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDarkMode(true)}
                        className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isDarkMode
                            ? "bg-slate-900 text-amber-400 shadow-xs border border-slate-700"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5 text-amber-400" />
                        <span>{language === "ka" ? "ღამის" : "Dark"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800" />

                  {/* Language Switcher */}
                  <div className="px-1 py-0.5 space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      {language === "ka" ? "ენა" : "Language"}
                    </span>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setLanguage("ka")}
                        className={`py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                          language === "ka"
                            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        ქართული
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage("en")}
                        className={`py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                          language === "en"
                            ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Logout Button */}
            {currentUser && (
              <button
                onClick={handleMockLogout}
                className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 border border-rose-200/50 dark:border-rose-900 rounded-xl transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center"
                title={language === "ka" ? "გამოსვლა" : "Log Out"}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile Navigation Trigger (phone screens < 768px) */}
          <div className="flex md:hidden items-center space-x-1.5 shrink-0">
            {/* Quick Dark Mode Icon on Mobile */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 shadow-xs cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Quick Language Toggle on Mobile */}
            <button
              onClick={() => setLanguage(language === "ka" ? "en" : "ka")}
              className="px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer shadow-xs"
            >
              {language === "ka" ? "EN" : "KA"}
            </button>

            {/* Hamburger Button */}
            <button
              onClick={() => {
                setShowMobileMenu(!showMobileMenu);
                setShowWorkspaceDropdown(false);
              }}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-100/80 rounded-xl border border-slate-200/60 dark:border-slate-700 shadow-xs transition-all cursor-pointer flex items-center justify-center"
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
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-fadeIn">
                    <div className="px-3 py-1.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                      {language === "ka" ? "სამუშაო სივრცეები" : "Workspaces"}
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
                      {workspaces.map((ws, index) => {
                        const isEditing = editingWorkspaceIndex === index;
                        const isSelected = activeWorkspace === ws;

                        return (
                          <div
                            key={ws}
                            className={`px-3 py-2 text-xs transition-all flex items-center justify-between gap-1.5 ${
                              isSelected ? "bg-indigo-50/70 dark:bg-indigo-950/40" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            }`}
                          >
                            {isEditing ? (
                              <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingWorkspaceName}
                                  onChange={(e) => setEditingWorkspaceName(e.target.value)}
                                  className="flex-1 px-1.5 py-0.5 text-xs font-bold border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none"
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
                                  className="p-0.5 text-emerald-600 dark:text-emerald-400"
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
                                    isSelected ? "text-indigo-700 dark:text-indigo-400" : "text-slate-700 dark:text-slate-200"
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
                                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  {workspaces.length > 1 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setWorkspaceToConfirmDelete(ws);
                                      }}
                                      className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
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
                    <div className="p-2 bg-slate-50/70 dark:bg-slate-800/40">
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
                          className="flex-1 px-2 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
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

                    {/* Dark & Light Theme Switcher inside Mobile Workspace Dropdown */}
                    <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                        {language === "ka" ? "თემა / რეჟიმი" : "Theme Mode"}
                      </div>
                      <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-lg border border-slate-200/70 dark:border-slate-700/70">
                        <button
                          type="button"
                          onClick={() => setIsDarkMode(false)}
                          className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                            !isDarkMode
                              ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-xs border border-slate-200/60 dark:border-slate-700"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          <Sun className="w-3 h-3 text-amber-500" />
                          <span>{language === "ka" ? "დღის" : "Light"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsDarkMode(true)}
                          className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                            isDarkMode
                              ? "bg-slate-900 text-amber-400 shadow-xs border border-slate-700"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                          }`}
                        >
                          <Moon className="w-3 h-3 text-amber-400" />
                          <span>{language === "ka" ? "ღამის" : "Dark"}</span>
                        </button>
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
                <div className="flex items-center justify-between p-3 bg-indigo-50/60 dark:bg-slate-800 border border-indigo-100/40 dark:border-slate-700 rounded-xl">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    activePlan === "multi" 
                      ? "bg-indigo-600 text-white shadow-xs" 
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300/40 dark:border-slate-600"
                  }`}>
                    {activePlan === "multi" 
                      ? (language === "ka" ? "MULTI ტარიფი" : "MULTI PLAN") 
                      : (language === "ka" ? "SINGLE ტარიფი" : "SINGLE PLAN")}
                  </span>
                </div>
              </div>
            )}

            {/* Theme Mode Switcher for Mobile */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {language === "ka" ? "რეჟიმი / Theme" : "Theme Mode"}
              </span>
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm w-full">
                <button
                  onClick={() => setIsDarkMode(false)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${!isDarkMode ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-800"}`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>{language === "ka" ? "დღის" : "Light"}</span>
                </button>
                <button
                  onClick={() => setIsDarkMode(true)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${isDarkMode ? "bg-slate-900 shadow-sm text-amber-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-800"}`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>{language === "ka" ? "ღამის" : "Dark"}</span>
                </button>
              </div>
            </div>

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

            {/* Mobile Navigation Links */}
            {currentUser && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {language === "ka" ? "ნავიგაცია" : "Navigation"}
                </span>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView("dashboard");
                      setShowMobileMenu(false);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      currentView === "dashboard"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {language === "ka" ? "მიმოხილვა" : "Overview"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView("invoices");
                      setShowMobileMenu(false);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      currentView === "invoices"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {language === "ka" ? "ინვოისები" : "Invoices"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView("analytics");
                      setShowMobileMenu(false);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      currentView === "analytics"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {language === "ka" ? "ანალიტიკა" : "Analytics"}
                  </button>
                </div>
              </div>
            )}

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
            invoices={invoices}
            workspaces={workspaces}
            budgets={budgets}
          />
        ) : currentView === "not-found" ? (
          <NotFoundView
            language={language}
            onGoHome={() => setCurrentView("dashboard")}
          />
        ) : currentView === "invoices" ? (
          <InvoicesPage
            language={language}
            invoices={invoices}
            workspaceInvoices={workspaceInvoices}
            filteredInvoices={filteredInvoices}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            dateRangeFilter={dateRangeFilter}
            onDateRangeChange={setDateRangeFilter}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            isLoadingInvoices={isLoadingInvoices}
            isAnalyzing={isAnalyzing}
            uploadError={error}
            canUpload={currentRolePermissions.canUpload}
            canDelete={currentRolePermissions.canDelete}
            isInvoiceOverBudget={isInvoiceOverBudget}
            showExportDropdown={showExportDropdown}
            onToggleExportDropdown={() => setShowExportDropdown(!showExportDropdown)}
            onCloseExportDropdown={() => setShowExportDropdown(false)}
            onUpload={handleUpload}
            onAddManual={handleAddManual}
            onSelectInvoice={(inv) => setSelectedInvoice(inv)}
            onDeleteInvoice={handleDelete}
            onClearAll={handleClearAll}
            onExportCsv={handleExportCsv}
            onExportExcel={handleExportExcel}
            onOpenPdfReport={() => setShowPdfReport(true)}
          />
        ) : currentView === "analytics" ? (
          <AnalyticsPage
            language={language}
            invoices={workspaceInvoices}
            budgets={budgets}
            canManageBudgets={currentRolePermissions.manageBudgets}
            onBudgetsChanged={handleBudgetsUpdated}
            onBudgetEditedByUser={handleBudgetEditedByUser}
            onRatesChanged={(rates) => setExchangeRates(rates as any)}
          />
        ) : (
          /* OverviewPage (currentView === "dashboard") */
          <OverviewPage
            language={language}
            invoices={workspaceInvoices}
            allInvoices={invoices}
            budgets={budgets}
            activePlan={activePlan}
            userEmail={currentUser?.email || ""}
            userCompany={userCompany}
            userIdOrCompany={user?.company_id || user?.id || userCompany || currentUser?.email || "default"}
            hasCustomBudget={hasCustomBudget}
            teamMembersCount={teamMembersCount}
            hasExported={hasExported}
            canUpload={currentRolePermissions.canUpload}
            canManageTeam={userPermissions.manageTeam}
            onNavigateToView={(view) => {
              if (view === "overview") setCurrentView("dashboard");
              else setCurrentView(view);
            }}
            onOpenUpload={() => {
              setCurrentView("invoices");
              setTimeout(() => {
                const el = document.getElementById("upload-zone-container");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 100);
            }}
            onOpenManual={handleAddManual}
            onOpenExport={() => {
              setCurrentView("invoices");
              setTimeout(() => {
                setShowExportDropdown(true);
                const el = document.getElementById("export-dropdown-btn");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 100);
            }}
            onSelectInvoice={(inv) => setSelectedInvoice(inv)}
          />
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
                <p className="text-sm text-slate-500 mt-2 leading-relaxed font-semibold">
                  {language === "ka"
                    ? `წაიშლება ${workspaceInvoices.length} ინვოისი სივრციდან „${activeWorkspace}". სხვა სივრცეები არ შეიცვლება.`
                    : `${workspaceInvoices.length} invoices will be deleted from workspace "${activeWorkspace}". Other workspaces will not be changed.`}
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
