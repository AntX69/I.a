export type Language = "ka" | "en";

export interface InvoiceItem {
  name: string;
  quantity?: number;
  price?: number;
}

export type ExpenseCategory = "office" | "marketing" | "it" | "transport" | "food" | "other";

export interface ExtractedInvoice {
  id: string;
  vendor: string;
  date: string;
  amount: number;
  currency: string;
  items: InvoiceItem[];
  category: ExpenseCategory;
  fileName: string;
  uploadedAt: string;
  workspace?: string;
  vatMode?: "included" | "none" | "unknown";
}

export type UserRole = "admin" | "accountant" | "purchaser" | "member";

export interface UserPermissions {
  uploadInvoices: boolean;
  deleteInvoices: boolean;
  editBudgets: boolean;
  viewAnalytics: boolean;
  manageTeam: boolean;
  manageBilling: boolean;
}

export interface TeamMember {
  email: string;
  name?: string;
  company_id: string | null;
  company_name: string | null;
  role: UserRole | null;
  position: string;
  permissions: UserPermissions;
  is_platform_owner: boolean;
  status: "active" | "revoked";
}

export interface PendingInvite {
  token: string;
  email: string;
  name: string;
  position: string;
  company_id: string;
  permissions: UserPermissions;
  expires_at: string;
  status: "pending" | "accepted" | "revoked";
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

export interface RolePermissions {
  canUpload: boolean;
  viewAnalytics: boolean;
  manageBudgets: boolean;
  canDelete: boolean;
}

export const CATEGORY_LABELS: Record<ExpenseCategory, { en: string; ka: string }> = {
  office: { en: "Office Expenses", ka: "ოფისის ხარჯები" },
  marketing: { en: "Marketing", ka: "მარკეტინგი" },
  it: { en: "IT Services", ka: "IT მომსახურება" },
  transport: { en: "Transport", ka: "ტრანსპორტი" },
  food: { en: "Food & Dining", ka: "საკვები" },
  other: { en: "Other", ka: "სხვა" },
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  office: "bg-blue-50 text-blue-700 border-blue-200",
  marketing: "bg-purple-50 text-purple-700 border-purple-200",
  it: "bg-emerald-50 text-emerald-700 border-emerald-200",
  transport: "bg-amber-50 text-amber-700 border-amber-200",
  food: "bg-rose-50 text-rose-700 border-rose-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

export const TRANSLATIONS = {
  en: {
    title: "Invoice Analyzer",
    subtitle: "",
    uploadZoneTitle: "Drag & drop invoice or receipt here",
    uploadZoneSub: "Supports PDF, JPG, PNG up to 10MB",
    selectFiles: "Browse Files",
    analyzing: "Analyzing with Gemini...",
    successMsg: "Successfully extracted!",
    errorMsg: "Error occurred",
    noData: "No invoices analyzed yet. Upload your first document above.",
    vendor: "Vendor",
    date: "Date",
    total: "Total",
    category: "Category",
    items: "Items & Services",
    actions: "Actions",
    exportCsv: "CSV File",
    exportExcel: "Excel File (.xls)",
    exportMenu: "Export Data",
    searchPlaceholder: "Search by vendor or amount...",
    allCategories: "All Categories",
    fileName: "File Name",
    uploadedTime: "Uploaded",
    delete: "Delete",
    clearAll: "Clear All",
    viewDocument: "View Details",
    invoiceDetails: "Invoice Details",
    close: "Close",
    currency: "Currency",
    summary: "Summary",
    totalInvoices: "Total Invoices",
    totalSpend: "Total Spend",
    byCategory: "By Category",
    quantity: "Qty",
    price: "Price",
    addManual: "Add Manual Entry",
    save: "Save",
    cancel: "Cancel",
    budgets: "Budget Limits",
    budgetWarning: "Exceeded Limit!",
    budgetUsed: "Used",
    setLimit: "Set Limit",
    chartsTitle: "Spend Visualizer & Analytics",
    chartsCategory: "By Category Breakdown",
    chartsCurrency: "By Currency Breakdown",
    sortBy: "Sort By",
    receiptPreview: "Digital Receipt Preview",
    filterDate: "Date Range",
    allTime: "All Time",
    thisMonth: "This Month",
    last30Days: "Last 30 Days",
  },
  ka: {
    title: "ინვოისების ანალიზატორი",
    subtitle: "",
    uploadZoneTitle: "ჩააგდეთ ინვოისი ან ქვითარი აქ",
    uploadZoneSub: "მხარდაჭერილია PDF, JPG, PNG (მაქს. 10MB)",
    selectFiles: "ფაილის არჩევა",
    analyzing: "მიმდინარეობს ანალიზი Gemini-ით...",
    successMsg: "მონაცემები წარმატებით ამოიღო!",
    errorMsg: "დაფიქსირდა შეცდომა",
    noData: "ინვოისები ჯერ არ არის ატვირთული. ასატვირთად გამოიყენეთ ზედა ველი.",
    vendor: "გამყიდველი / კომპანია",
    date: "თარიღი",
    total: "ჯამური თანხა",
    category: "კატეგორია",
    items: "პროდუქტები / სერვისები",
    actions: "მოქმედებები",
    exportCsv: "CSV ფაილი",
    exportExcel: "Excel ფაილი (.xls)",
    exportMenu: "მონაცემების ექსპორტი",
    searchPlaceholder: "ძებნა ვენდორის სახელით ან თანხით...",
    allCategories: "ყველა კატეგორია",
    fileName: "ფაილის სახელი",
    uploadedTime: "ატვირთულია",
    delete: "წაშლა",
    clearAll: "ყველას გასუფთავება",
    viewDocument: "დეტალები",
    invoiceDetails: "ინვოისის დეტალები",
    close: "დახურვა",
    currency: "ვალუტა",
    summary: "რეზიუმე",
    totalInvoices: "ინვოისების რაოდენობა",
    totalSpend: "ჯამური ხარჯი",
    byCategory: "კატეგორიების მიხედვით",
    quantity: "რაოდ.",
    price: "ფასი",
    addManual: "მექანიკური დამატება",
    save: "შენახვა",
    cancel: "გაუქმება",
    budgets: "ბიუჯეტის ლიმიტები",
    budgetWarning: "ლიმიტი გადაჭარბებულია!",
    budgetUsed: "ათვისებული",
    setLimit: "ლიმიტის დაწესება",
    chartsTitle: "ხარჯების ანალიტიკა და გრაფიკები",
    chartsCategory: "კატეგორიების მიხედვით",
    chartsCurrency: "ვალუტების მიხედვით",
    sortBy: "სორტირება",
    receiptPreview: "ციფრული ქვითრის პრევიუ",
    filterDate: "პერიოდი",
    allTime: "ყველა",
    thisMonth: "ამ თვის",
    last30Days: "ბოლო 30 დღის",
  },
};
