import React from "react";
import { 
  FileText, 
  DollarSign, 
  Percent, 
  Layers, 
  ArrowRight, 
  Plus, 
  Upload, 
  Download, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  ChevronRight,
  Sparkles,
  Calendar
} from "lucide-react";
import { 
  Language, 
  ExtractedInvoice, 
  ExpenseCategory, 
  CATEGORY_LABELS, 
  CATEGORY_COLORS, 
  TRANSLATIONS 
} from "../types";
import OnboardingChecklist from "../components/OnboardingChecklist";

export interface OverviewPageProps {
  language: Language;
  invoices: ExtractedInvoice[]; // already filtered for active workspace
  allInvoices: ExtractedInvoice[]; // all invoices across app if needed
  budgets: Record<string, Record<ExpenseCategory, number>>;
  activePlan: "single" | "multi" | null;
  userEmail: string;
  userCompany: string;
  hasCustomBudget: boolean;
  teamMembersCount: number;
  hasExported: boolean;
  canUpload: boolean;
  canManageTeam: boolean;
  onNavigateToView: (view: "overview" | "invoices" | "analytics" | "team") => void;
  onOpenUpload: () => void;
  onOpenManual: () => void;
  onOpenExport: () => void;
  onSelectInvoice: (invoice: ExtractedInvoice) => void;
}

export default function OverviewPage({
  language,
  invoices,
  allInvoices,
  budgets,
  activePlan,
  userEmail,
  userCompany,
  hasCustomBudget,
  teamMembersCount,
  hasExported,
  canUpload,
  canManageTeam,
  onNavigateToView,
  onOpenUpload,
  onOpenManual,
  onOpenExport,
  onSelectInvoice,
}: OverviewPageProps) {
  const t = TRANSLATIONS[language];

  // Currency conversions (GEL base)
  const getGELValue = (amount: number, currency: string): number => {
    const cur = (currency || "GEL").toUpperCase().trim();
    if (cur === "GEL") return amount;
    if (cur === "USD") return amount * 2.72;
    if (cur === "EUR") return amount * 2.95;
    return amount;
  };

  // 1. KPI Calculations
  const invoiceCount = invoices.length;

  // Total spend in GEL (converted grand total) + currency breakdowns
  const spendsByCurrency: Record<string, number> = {};
  let totalSpendGEL = 0;

  invoices.forEach((inv) => {
    const cur = (inv.currency || "GEL").toUpperCase().trim();
    const amt = Number(inv.amount) || 0;
    spendsByCurrency[cur] = (spendsByCurrency[cur] || 0) + amt;
    totalSpendGEL += getGELValue(amt, cur);
  });

  // Category totals (in GEL)
  const categoryTotalsGEL: Record<ExpenseCategory, number> = {
    office: 0,
    marketing: 0,
    it: 0,
    transport: 0,
    food: 0,
    other: 0,
  };

  invoices.forEach((inv) => {
    const cat = (inv.category || "other") as ExpenseCategory;
    const gelAmt = getGELValue(Number(inv.amount) || 0, inv.currency || "GEL");
    if (categoryTotalsGEL[cat] !== undefined) {
      categoryTotalsGEL[cat] += gelAmt;
    } else {
      categoryTotalsGEL.other += gelAmt;
    }
  });

  // Largest category
  let largestCategory: ExpenseCategory = "other";
  let largestCategoryAmount = 0;
  Object.entries(categoryTotalsGEL).forEach(([cat, amt]) => {
    if (amt > largestCategoryAmount) {
      largestCategoryAmount = amt;
      largestCategory = cat as ExpenseCategory;
    }
  });

  // Overall budget utilization % in GEL
  const gelBudgets = budgets.GEL || {
    office: 500,
    marketing: 1000,
    it: 1500,
    transport: 400,
    food: 300,
    other: 800,
  };
  const totalBudgetGEL = Object.values(gelBudgets).reduce((a, b) => a + b, 0);
  const budgetUtilizationPct = totalBudgetGEL > 0 ? Math.round((totalSpendGEL / totalBudgetGEL) * 100) : 0;

  // 2. Main Monthly Chart (by GEL or dominant currency)
  const monthlySpends: Record<string, number> = {};
  invoices.forEach((inv) => {
    if (!inv.date) return;
    const dateObj = new Date(inv.date);
    if (isNaN(dateObj.getTime())) return;
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const gelAmt = getGELValue(Number(inv.amount) || 0, inv.currency || "GEL");
    monthlySpends[key] = (monthlySpends[key] || 0) + gelAmt;
  });

  const sortedMonthKeys = Object.keys(monthlySpends).sort((a, b) => b.localeCompare(a));
  const maxMonthlySpend = Math.max(...Object.values(monthlySpends), 1);

  const getMonthLabel = (key: string) => {
    const [year, monthStr] = key.split("-");
    const monthIndex = parseInt(monthStr, 10) - 1;
    const kaMonths = [
      "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
      "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
    ];
    const enMonths = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = language === "ka" ? kaMonths[monthIndex] : enMonths[monthIndex];
    return `${monthName}, ${year}`;
  };

  // 3. Last 5 invoices
  // Sort copies by date descending
  const recentInvoices = [...invoices]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 5);

  // 4. One most important tip from Smart Insights
  // Priority: 1. Budget exceeded -> 2. Approaching budget -> 3. High category concentration -> 4. Recurring vendors -> 5. Healthy
  let topInsight: {
    type: "danger" | "warning" | "info" | "success";
    title: string;
    description: string;
  } | null = null;

  if (invoiceCount > 0) {
    const limitsExceeded: string[] = [];
    const limitsWarning: string[] = [];
    Object.entries(categoryTotalsGEL).forEach(([cat, spend]) => {
      const limit = gelBudgets[cat as ExpenseCategory] || 0;
      if (limit > 0) {
        const catLabel = CATEGORY_LABELS[cat as ExpenseCategory];
        const name = language === "ka" ? catLabel.ka : catLabel.en;
        if (spend > limit) {
          limitsExceeded.push(name);
        } else if ((spend / limit) * 100 >= 80) {
          limitsWarning.push(name);
        }
      }
    });

    const maxCatPct = totalSpendGEL > 0 ? (largestCategoryAmount / totalSpendGEL) * 100 : 0;

    if (limitsExceeded.length > 0) {
      topInsight = {
        type: "danger",
        title: language === "ka" ? "ბიუჯეტის გადახარჯვა!" : "Over Budget Alerts!",
        description: language === "ka"
          ? `თქვენ გადააჭარბეთ დაწესებულ ლიმიტებს შემდეგ კატეგორიებში: ${limitsExceeded.join(", ")}. რეკომენდებულია ხარჯების დაუყოვნებლივ ოპტიმიზაცია.`
          : `You have exceeded established limits in: ${limitsExceeded.join(", ")}. Prompt cost optimization is advised.`,
      };
    } else if (limitsWarning.length > 0) {
      topInsight = {
        type: "warning",
        title: language === "ka" ? "ლიმიტთან მიახლოება" : "Approaching Budgets",
        description: language === "ka"
          ? `ფინანსური ხარჯები უახლოვდება მაქსიმუმს შემდეგ სექტორებში: ${limitsWarning.join(", ")} (უკვე ათვისებულია ბიუჯეტის 80%-ზე მეტი).`
          : `Spending is approaching maximum thresholds in: ${limitsWarning.join(", ")} (over 80% budget consumed).`,
      };
    } else if (maxCatPct > 35) {
      const catName = language === "ka" ? CATEGORY_LABELS[largestCategory].ka : CATEGORY_LABELS[largestCategory].en;
      topInsight = {
        type: "warning",
        title: language === "ka" ? "მაღალი ხარჯების კონცენტრაცია" : "High Expense Concentration",
        description: language === "ka"
          ? `თქვენი ხარჯების ${maxCatPct.toFixed(1)}% მოდის კატეგორიაზე: "${catName}". სასურველია გადახედოთ ამ სექტორს და მოახდინოთ რესურსების გადანაწილება.`
          : `${maxCatPct.toFixed(1)}% of your expenses belong to "${catName}". We suggest reviewing this category to optimize resources.`,
      };
    } else {
      topInsight = {
        type: "success",
        title: language === "ka" ? "შესანიშნავი ფინანსური დისციპლინა" : "Optimal Spending Discipline",
        description: language === "ka"
          ? "ყველა ხარჯი იდეალურ ფარგლებშია. არცერთი კატეგორია არ აჭარბებს ბიუჯეტებს და ხარჯების გადანაწილება არის სრულიად თანაბარი!"
          : "All expenses are within healthy levels. Categories are safely below limits, and allocations are balanced.",
      };
    }
  }

  // Currency breakdown text (e.g., "$120 · €80")
  const foreignCurrencies = Object.entries(spendsByCurrency).filter(([cur]) => cur !== "GEL");

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Onboarding Checklist Banner/Widget */}
      <OnboardingChecklist
        language={language}
        invoicesCount={allInvoices.length}
        hasCustomBudget={hasCustomBudget}
        teamMembersCount={teamMembersCount}
        hasExported={hasExported}
        isMultiPlan={activePlan === "multi"}
        userIdOrCompany={userCompany || userEmail || "default"}
        onNavigateToUpload={() => onNavigateToView("invoices")}
        onNavigateToBudget={() => onNavigateToView("analytics")}
        onNavigateToTeam={() => {
          if (activePlan === "multi" && canManageTeam) {
            onNavigateToView("team");
          }
        }}
        onNavigateToExport={() => {
          onNavigateToView("invoices");
          onOpenExport();
        }}
      />

      {/* 0-Invoices Welcome Banner */}
      {invoiceCount === 0 && (
        <div className="bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border border-indigo-150/70 dark:border-slate-800 rounded-3xl p-8 sm:p-10 text-center shadow-lg shadow-indigo-500/5 relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-300/40 dark:shadow-none animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === "ka" ? "კეთილი იყოს თქვენი მობრძანება!" : "Welcome to your financial hub!"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {language === "ka"
                ? "დაიწყეთ თქვენი პირველი ინვოისის ატვირთვით ან დაამატეთ ჩანაწერი ხელით, რომ სისტემამ ავტომატურად ააწყოს ანალიტიკა და ბიუჯეტები."
                : "Get started by uploading your first invoice or manually creating an entry to instantly generate smart spend analytics."}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onNavigateToView("invoices");
                  onOpenUpload();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 dark:shadow-none transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Upload className="w-4 h-4" />
                <span>{language === "ka" ? "ინვოისის ატვირთვა" : "Upload Invoice"}</span>
              </button>
              {canUpload && (
                <button
                  type="button"
                  onClick={onOpenManual}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{language === "ka" ? "ხელით დამატება" : "Add Manually"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. KPI Cards: 4 in a single equal-height row on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* Card 1: Total Invoices */}
        <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">
              {t.totalInvoices}
            </span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {invoiceCount}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
              {language === "ka" ? "აქტიურ სივრცეში" : "In active workspace"}
            </p>
          </div>
        </div>

        {/* Card 2: Total Spend in GEL with foreign breakdown */}
        <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">
              {language === "ka" ? "ჯამური ხარჯი" : "Total Spend"}
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalSpendGEL.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-sm font-extrabold text-slate-400">₾</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1 truncate">
              {foreignCurrencies.length > 0 ? (
                foreignCurrencies.map(([cur, amt]) => `${cur}: ${amt.toFixed(1)}`).join(" · ")
              ) : (
                language === "ka" ? "ყველა ხარჯი ლარშია" : "All spend in GEL"
              )}
            </p>
          </div>
        </div>

        {/* Card 3: Overall Budget Utilization % */}
        <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">
              {language === "ka" ? "ბიუჯეტის ათვისება" : "Budget Utilization"}
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black tracking-tight ${
                budgetUtilizationPct > 100 
                  ? "text-red-600 dark:text-red-400" 
                  : budgetUtilizationPct >= 80 
                    ? "text-amber-600 dark:text-amber-400" 
                    : "text-slate-900 dark:text-white"
              }`}>
                {budgetUtilizationPct}%
              </span>
              <span className="text-[11px] font-extrabold text-slate-400">
                / {totalBudgetGEL.toLocaleString()} ₾
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetUtilizationPct > 100 
                    ? "bg-red-500" 
                    : budgetUtilizationPct >= 80 
                      ? "bg-amber-500" 
                      : "bg-indigo-500"
                }`}
                style={{ width: `${Math.min(100, budgetUtilizationPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Largest Category */}
        <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">
              {language === "ka" ? "უდიდესი კატეგორია" : "Top Category"}
            </span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white truncate">
              {largestCategoryAmount > 0 ? (
                language === "ka"
                  ? CATEGORY_LABELS[largestCategory].ka
                  : CATEGORY_LABELS[largestCategory].en
              ) : (
                "-"
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1 truncate">
              {largestCategoryAmount > 0 ? (
                `${largestCategoryAmount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ₾ (${Math.round((largestCategoryAmount / (totalSpendGEL || 1)) * 100)}%)`
              ) : (
                language === "ka" ? "მონაცემი არ არის" : "No expense recorded"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Chart: Spend by Months */}
      <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              {language === "ka" ? "ხარჯები თვეების მიხედვით" : "Expenses by Month"}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {language === "ka" ? "თვიური დინამიკა ლარში (კონვერტირებული)" : "Monthly spend dynamic in GEL"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToView("analytics")}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            <span>{language === "ka" ? "ანალიტიკა" : "Full Analytics"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {sortedMonthKeys.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto stroke-[1.5]" />
            <p className="text-xs font-medium">
              {language === "ka" ? "ხარჯების თვიური ისტორია ჯერ არ არის" : "No monthly records available yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedMonthKeys.slice(0, 6).map((key) => {
              const spend = monthlySpends[key];
              const pct = maxMonthlySpend > 0 ? (spend / maxMonthlySpend) * 100 : 0;
              const label = getMonthLabel(key);
              const overallPct = totalSpendGEL > 0 ? (spend / totalSpendGEL) * 100 : 0;

              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="font-extrabold text-slate-700 dark:text-slate-200">{label}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-bold">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>{" "}
                      ₾
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-700/40">
                      <div
                        className="h-full rounded-full bg-indigo-500 shadow-xs transition-all duration-500"
                        style={{ width: `${Math.max(3, pct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-100/50 dark:border-indigo-800/50 w-12 text-center shrink-0">
                      {overallPct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: 4. Recent 5 Invoices & 5. Top Smart Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left (cols 7): Recent 5 Invoices */}
        <div className="lg:col-span-7 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {language === "ka" ? "ბოლო ინვოისები" : "Recent Invoices"}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {language === "ka" ? "ბოლო 5 დამატებული ჩანაწერი" : "Last 5 added records"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToView("invoices")}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <span>{language === "ka" ? "ყველას ნახვა" : "View All"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentInvoices.length === 0 ? (
              <div className="py-10 text-center text-slate-400 dark:text-slate-500 space-y-1">
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-medium">
                  {language === "ka" ? "ინვოისები ჯერ არ არის" : "No invoices recorded yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentInvoices.map((inv) => {
                  const catLabel = CATEGORY_LABELS[inv.category] || CATEGORY_LABELS.other;
                  const catColor = CATEGORY_COLORS[inv.category] || CATEGORY_COLORS.other;

                  return (
                    <div
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv)}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[140px] sm:max-w-[200px]">
                            {inv.vendor}
                          </span>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${catColor}`}>
                            {language === "ka" ? catLabel.ka : catLabel.en}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block mt-0.5">
                          {inv.date}
                        </span>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            {Number(inv.amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            <span className="text-[10px] font-bold text-slate-400">{inv.currency}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={() => onNavigateToView("invoices")}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              {language === "ka" ? "ყველა ინვოისის სია →" : "See all invoices →"}
            </button>
          </div>
        </div>

        {/* Right (cols 5): Single top insight card & Quick Actions */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Smart Insight Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800/80 relative overflow-hidden flex flex-col justify-between flex-1">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                    <Lightbulb className="w-4 h-4 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    {language === "ka" ? "მთავარი რჩევა" : "Top Smart Insight"}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateToView("analytics")}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>{language === "ka" ? "ყველა რჩევა →" : "All tips →"}</span>
                </button>
              </div>

              {topInsight ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {topInsight.type === "danger" && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                    {topInsight.type === "warning" && <TrendingDown className="w-4 h-4 text-amber-400 shrink-0" />}
                    {topInsight.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    <h5 className="text-sm font-black text-white">{topInsight.title}</h5>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    {topInsight.description}
                  </p>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs font-medium">
                  {language === "ka" 
                    ? "ატვირთეთ ინვოისები AI ანალიტიკური რჩევების მისაღებად." 
                    : "Upload invoices to generate smart financial advice."}
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => onNavigateToView("analytics")}
                className="w-full py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white rounded-xl text-xs font-bold transition-all text-center cursor-pointer border border-indigo-500/30"
              >
                {language === "ka" ? "სრული ანალიტიკის ნახვა →" : "Explore Full Analytics →"}
              </button>
            </div>
          </div>

          {/* 6. Quick Actions Card */}
          <div className="bg-white/70 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {language === "ka" ? "სწრაფი მოქმედებები" : "Quick Actions"}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onNavigateToView("invoices");
                  onOpenUpload();
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{language === "ka" ? "ატვირთვა" : "Upload"}</span>
              </button>

              <button
                type="button"
                onClick={onOpenManual}
                disabled={!canUpload}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  canUpload
                    ? "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 cursor-pointer"
                    : "bg-slate-100 dark:bg-slate-850 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{language === "ka" ? "ხელით" : "Manual"}</span>
              </button>

              <button
                type="button"
                onClick={onOpenExport}
                disabled={invoices.length === 0}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                  invoices.length > 0
                    ? "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 cursor-pointer"
                    : "bg-slate-100 dark:bg-slate-850 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                }`}
              >
                <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                <span>{language === "ka" ? "ექსპორტი" : "Export"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
