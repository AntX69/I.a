import React, { useState, useEffect } from "react";
import { 
  PieChart as ChartIcon, 
  Settings, 
  AlertTriangle, 
  HelpCircle, 
  CheckCircle,
  TrendingUp,
  Sliders,
  DollarSign,
  Calendar,
  Coins,
  ArrowRightLeft,
  Lock
} from "lucide-react";
import { Language, ExtractedInvoice, ExpenseCategory, CATEGORY_LABELS, CATEGORY_COLORS, TRANSLATIONS } from "../types";

interface InvoiceAnalyticsProps {
  language: Language;
  invoices: ExtractedInvoice[];
  onBudgetsChanged?: (budgets: Record<string, Record<ExpenseCategory, number>>) => void;
  onBudgetEditedByUser?: () => void;
  canManageBudgets?: boolean;
}

const DEFAULT_BUDGETS: Record<string, Record<ExpenseCategory, number>> = {
  GEL: { office: 500, marketing: 1000, it: 1500, transport: 400, food: 300, other: 800 },
  USD: { office: 200, marketing: 500, it: 800, transport: 150, food: 100, other: 300 },
  EUR: { office: 150, marketing: 400, it: 700, transport: 120, food: 90, other: 250 },
};

export default function InvoiceAnalytics({
  language,
  invoices,
  onBudgetsChanged,
  onBudgetEditedByUser,
  canManageBudgets = true,
}: InvoiceAnalyticsProps) {
  const t = TRANSLATIONS[language];
  const [selectedCurrency, setSelectedCurrency] = useState<string>("GEL");
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [hoveredCategory, setHoveredCategory] = useState<ExpenseCategory | null>(null);
  const [activeTab, setActiveTab] = useState<"categories" | "months">("categories");

  // Load budgets from localStorage
  const [budgets, setBudgets] = useState<Record<string, Record<ExpenseCategory, number>>>(() => {
    try {
      const saved = localStorage.getItem("antx_invoice_budgets_v1");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error loading budgets", e);
    }
    return DEFAULT_BUDGETS;
  });

  // Save budgets to localStorage and notify parent
  useEffect(() => {
    try {
      localStorage.setItem("antx_invoice_budgets_v1", JSON.stringify(budgets));
      if (onBudgetsChanged) {
        onBudgetsChanged(budgets);
      }
    } catch (e) {
      console.error("Error saving budgets", e);
    }
  }, [budgets, onBudgetsChanged]);

  const handleBudgetChange = (category: ExpenseCategory, val: number) => {
    if (onBudgetEditedByUser) {
      onBudgetEditedByUser();
    }
    setBudgets(prev => ({
      ...prev,
      [selectedCurrency]: {
        ...prev[selectedCurrency] || DEFAULT_BUDGETS[selectedCurrency] || DEFAULT_BUDGETS.GEL,
        [category]: Math.max(0, val),
      }
    }));
  };

  // Static exchange rates (GEL base)
  const getGELValue = (amount: number, currency: string): number => {
    const cur = currency.toUpperCase().trim();
    if (cur === "GEL") return amount;
    if (cur === "USD") return amount * 2.72;
    if (cur === "EUR") return amount * 2.95;
    return amount;
  };

  const getConvertedValue = (amount: number, fromCurrency: string, toCurrency: string): number => {
    const gelVal = getGELValue(amount, fromCurrency);
    const to = toCurrency.toUpperCase().trim();
    if (to === "GEL") return gelVal;
    if (to === "USD") return gelVal / 2.72;
    if (to === "EUR") return gelVal / 2.95;
    return gelVal;
  };

  // 1. Calculate overall consolidated total (სრული ხარჯი) across all currencies, converted to selectedCurrency
  const totalCombinedSpend = invoices.reduce((sum, inv) => {
    const amt = Number(inv.amount) || 0;
    const cur = inv.currency || "GEL";
    return sum + getConvertedValue(amt, cur, selectedCurrency);
  }, 0);

  // Filter invoices for selected currency
  const currencyInvoices = invoices.filter(
    inv => (inv.currency || "GEL").toUpperCase().trim() === selectedCurrency
  );

  // Calculate actual spend per category for this currency
  const categorySpends: Record<ExpenseCategory, number> = {
    office: 0,
    marketing: 0,
    it: 0,
    transport: 0,
    food: 0,
    other: 0,
  };

  currencyInvoices.forEach(inv => {
    const cat = inv.category as ExpenseCategory;
    if (categorySpends[cat] !== undefined) {
      categorySpends[cat] += Number(inv.amount) || 0;
    } else {
      categorySpends.other += Number(inv.amount) || 0;
    }
  });

  const totalCurrencySpend = Object.values(categorySpends).reduce((a, b) => a + b, 0);

  // 2. Group spend by months for the selected currency
  const monthlySpends: Record<string, number> = {};
  currencyInvoices.forEach(inv => {
    if (!inv.date) return;
    const dateObj = new Date(inv.date);
    if (isNaN(dateObj.getTime())) return;
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    monthlySpends[key] = (monthlySpends[key] || 0) + (Number(inv.amount) || 0);
  });

  const sortedMonthKeys = Object.keys(monthlySpends).sort((a, b) => b.localeCompare(a)); // Newest first
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

  // Active budgets for the selected currency
  const activeCurrencyBudgets = budgets[selectedCurrency] || DEFAULT_BUDGETS[selectedCurrency] || DEFAULT_BUDGETS.GEL;

  // Custom high-performance SVG Donut calculations
  const categoriesList = Object.keys(categorySpends) as ExpenseCategory[];
  const nonemptyCategories = categoriesList.filter(cat => categorySpends[cat] > 0);

  let accumulatedAngle = 0;
  const donutRadius = 50;
  const donutStrokeWidth = 12;
  const donutCenter = 60;
  const circumference = 2 * Math.PI * donutRadius;

  const donutSegments = nonemptyCategories.map(cat => {
    const spend = categorySpends[cat];
    const percentage = totalCurrencySpend > 0 ? spend / totalCurrencySpend : 0;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = `${-accumulatedAngle * circumference}`;
    accumulatedAngle += percentage;

    // Theme color mapping
    let colorClass = "#64748b"; // slate
    if (cat === "office") colorClass = "#3b82f6"; // blue
    if (cat === "marketing") colorClass = "#a855f7"; // purple
    if (cat === "it") colorClass = "#10b981"; // emerald
    if (cat === "transport") colorClass = "#f59e0b"; // amber
    if (cat === "food") colorClass = "#f43f5e"; // rose
    
    return {
      category: cat,
      spend,
      percentage,
      strokeDasharray,
      strokeDashoffset,
      color: colorClass,
    };
  });

  return (
    <div className="bg-white/60 backdrop-blur-xl border border-slate-200/50 rounded-2xl p-6 shadow-xl shadow-slate-100/40 mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base leading-snug">
              {t.chartsTitle}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === "ka" ? "აკონტროლეთ ხარჯვის ლიმიტები და გრაფიკები" : "Track spending thresholds and category distributions"}
            </p>
          </div>
        </div>

        {/* Currency Selector & Settings Toggle */}
        <div className="flex items-center gap-2">
          {/* Currency Dropdown */}
          <div className="relative">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs rounded-xl border border-transparent focus:outline-none focus:border-slate-300 transition-all cursor-pointer uppercase"
            >
              <option value="GEL">GEL (₾)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <DollarSign className="w-3 h-3" />
            </div>
          </div>

          {/* Settings button */}
          <button
            onClick={() => canManageBudgets !== false && setShowConfig(!showConfig)}
            disabled={canManageBudgets === false}
            className={`p-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
              canManageBudgets === false
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                : showConfig 
                  ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-bold cursor-pointer" 
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
            }`}
            title={canManageBudgets === false 
              ? (language === "ka" ? "ბიუჯეტების მართვა შეზღუდულია მფლობელის მიერ" : "Budget configuration locked by Owner") 
              : (language === "ka" ? "ლიმიტების მართვა" : "Configure Budgets")}
          >
            {canManageBudgets === false ? <Lock className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
            <span className="text-xs font-bold hidden sm:inline">{t.budgets}</span>
          </button>
        </div>
      </div>

      {/* Expandable Budget Config */}
      {showConfig && (
        <div className="bg-slate-50/50 rounded-2xl p-4 mt-4 border border-slate-200/40 animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {language === "ka" ? `${selectedCurrency} ბიუჯეტების პარამეტრები` : `Configure limits in ${selectedCurrency}`}
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categoriesList.map(cat => {
              const label = CATEGORY_LABELS[cat];
              const limit = activeCurrencyBudgets[cat] || 0;
              const currentSpend = categorySpends[cat];
              const isOver = currentSpend > limit;

              return (
                <div key={cat} className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-slate-700">
                        {language === "ka" ? label.ka : label.en}
                      </span>
                      {isOver && (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> Over
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>{language === "ka" ? "ხარჯი:" : "Spend:"} {currentSpend.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      value={limit}
                      onChange={(e) => handleBudgetChange(cat, Number(e.target.value))}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-400 focus:bg-white text-right"
                      placeholder="Limit"
                      min="0"
                    />
                    <span className="text-xs font-bold text-slate-400">{selectedCurrency}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Prominent Multi-Currency Total Expenses Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 p-4 bg-slate-50/60 rounded-2xl border border-slate-200/40">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-md shadow-indigo-100">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {language === "ka" ? "სრული კონსოლიდირებული ხარჯი" : "Consolidated Grand Total"}
            </p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-slate-900">
                {totalCombinedSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase">{selectedCurrency}</span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {language === "ka" 
                ? "* ყველა ვალუტა კონვერტირებულია მიმდინარე კურსით (1 USD = 2.72₾, 1 EUR = 2.95₾)" 
                : "* Converted all active currencies (1 USD = 2.72 GEL, 1 EUR = 2.95 GEL)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-slate-200/60 pt-3 md:pt-0 md:pl-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {language === "ka" ? `პირდაპირი ხარჯი ${selectedCurrency}-ში` : `Direct spend in ${selectedCurrency}`}
            </p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-slate-900">
                {totalCurrencySpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase">{selectedCurrency}</span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {language === "ka" ? `მხოლოდ ${selectedCurrency}-ში დაფიქსირებული ჩანაწერები` : `Considers only native ${selectedCurrency} bills`}
            </p>
          </div>
        </div>
      </div>

      {/* Charts & Budgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        
        {/* SVG Interactive Donut or Month list (cols 5) */}
        <div className="lg:col-span-5 flex flex-col items-center bg-slate-50/20 border border-slate-200/20 rounded-2xl p-5 min-h-[300px]">
          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl w-full mb-4">
            <button
              onClick={() => setActiveTab("categories")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "categories"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {language === "ka" ? "კატეგორიებით" : "By Categories"}
            </button>
            <button
              onClick={() => setActiveTab("months")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "months"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {language === "ka" ? "თვეების მიხედვით" : "By Months"}
            </button>
          </div>

          {activeTab === "categories" ? (
            <div className="w-full flex-1 flex flex-col items-center">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest self-start mb-4">
                {t.chartsCategory} ({selectedCurrency})
              </h4>

              {totalCurrencySpend === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 font-medium my-auto">
                  <ChartIcon className="w-12 h-12 text-slate-300 mb-2 stroke-[1.5]" />
                  <p className="text-xs">{language === "ka" ? "ამ ვალუტაში ხარჯი არ ფიქსირდება" : "No spend entries for this currency"}</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-around flex-1">
                  {/* Donut SVG */}
                  <div className="relative w-36 h-36 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      {/* Background Track */}
                      <circle
                        cx={donutCenter}
                        cy={donutCenter}
                        r={donutRadius}
                        fill="transparent"
                        stroke="#f1f5f9"
                        strokeWidth={donutStrokeWidth}
                      />

                      {/* Colored Segments */}
                      {donutSegments.map(seg => (
                        <circle
                          key={seg.category}
                          cx={donutCenter}
                          cy={donutCenter}
                          r={donutRadius}
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth={donutStrokeWidth}
                          strokeDasharray={seg.strokeDasharray}
                          strokeDashoffset={seg.strokeDashoffset}
                          strokeLinecap="round"
                          className="transition-all duration-300 cursor-pointer hover:stroke-[14px]"
                          onMouseEnter={() => setHoveredCategory(seg.category)}
                          onMouseLeave={() => setHoveredCategory(null)}
                        />
                      ))}
                    </svg>

                    {/* Inside Center Info */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      {hoveredCategory ? (
                        <>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {language === "ka" ? CATEGORY_LABELS[hoveredCategory].ka : CATEGORY_LABELS[hoveredCategory].en}
                          </span>
                          <span className="text-xs font-black text-slate-800 truncate max-w-[100px]">
                            {categorySpends[hoveredCategory].toLocaleString(undefined, { maximumFractionDigits: 1 })} {selectedCurrency}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {language === "ka" ? "სულ ჯამი" : "TOTAL"}
                          </span>
                          <span className="text-sm font-black text-indigo-600">
                            {totalCurrencySpend.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                          </span>
                          <span className="text-xs font-extrabold text-slate-400">{selectedCurrency}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Legend list */}
                  <div className="flex flex-col gap-2">
                    {donutSegments.map(seg => {
                      const label = CATEGORY_LABELS[seg.category];
                      const isHovered = hoveredCategory === seg.category;
                      return (
                        <div 
                          key={seg.category} 
                          className={`flex items-center gap-2 transition-all ${isHovered ? "scale-105" : ""}`}
                          onMouseEnter={() => setHoveredCategory(seg.category)}
                          onMouseLeave={() => setHoveredCategory(null)}
                        >
                          <div className="w-2 rounded-full h-2 shrink-0" style={{ backgroundColor: seg.color }} />
                          <div className="text-xs font-semibold text-slate-600 flex flex-col">
                            <span className="font-extrabold text-slate-700 leading-tight">
                              {language === "ka" ? label.ka : label.en}
                            </span>
                            <span className="text-xs text-slate-400">
                              {(seg.percentage * 100).toFixed(1)}% ({seg.spend.toFixed(0)} {selectedCurrency})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full flex-1 flex flex-col">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">
                {language === "ka" ? `ხარჯები თვეების მიხედვით (${selectedCurrency})` : `Spend by Months (${selectedCurrency})`}
              </h4>

              {sortedMonthKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 font-medium my-auto">
                  <Calendar className="w-12 h-12 text-slate-300 mb-2 stroke-[1.5]" />
                  <p className="text-xs">{language === "ka" ? "ამ ვალუტაში ხარჯი არ ფიქსირდება" : "No spend entries for this currency"}</p>
                </div>
              ) : (
                <div className="space-y-4 w-full flex-1">
                  {sortedMonthKeys.map(key => {
                    const spend = monthlySpends[key];
                    const pct = maxMonthlySpend > 0 ? (spend / maxMonthlySpend) * 100 : 0;
                    const label = getMonthLabel(key);
                    const overallPct = totalCurrencySpend > 0 ? (spend / totalCurrencySpend) * 100 : 0;
                    
                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="font-extrabold text-slate-700">{label}</span>
                          <span className="text-slate-500 font-bold">
                            <span className="font-extrabold text-slate-800">
                              {spend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>{" "}
                            {selectedCurrency}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/10">
                            <div 
                              className="h-full rounded-full bg-indigo-500 shadow-sm shadow-indigo-100 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/50 w-10 text-center shrink-0">
                            {overallPct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Budgets & Spends Progress Bars (cols 7) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">
              {language === "ka" ? "ბიუჯეტის ათვისების სტატუსი" : "Budget Consumption Status"}
            </h4>

            <div className="space-y-4">
              {categoriesList.map(cat => {
                const label = CATEGORY_LABELS[cat];
                const limit = activeCurrencyBudgets[cat] || 0;
                const spend = categorySpends[cat];
                const pct = limit > 0 ? (spend / limit) * 100 : 0;
                const isOver = spend > limit;

                // Color of progress bar
                let barColor = "bg-emerald-500 shadow-emerald-100";
                if (pct > 80 && pct <= 100) barColor = "bg-amber-500 shadow-amber-100";
                if (isOver) barColor = "bg-rose-500 shadow-rose-100 animate-pulse";

                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="font-extrabold text-slate-700">
                        {language === "ka" ? label.ka : label.en}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">
                          <span className="font-extrabold text-slate-800">{spend.toFixed(2)}</span> / {limit.toFixed(0)} <span className="text-xs text-slate-400">{selectedCurrency}</span>
                        </span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                          isOver 
                            ? "bg-red-50 border-red-200 text-red-600 animate-pulse" 
                            : pct > 80 
                            ? "bg-amber-50 border-amber-200 text-amber-700" 
                            : "bg-slate-50 border-slate-200 text-slate-500"
                        }`}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/20">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    {/* Overbudget Notification Alert */}
                    {isOver && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50/50 border border-red-100 rounded-full px-3 py-1 animate-fadeIn w-fit">
                        <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                        <span>
                          {language === "ka" 
                            ? `ლიმიტი გადაჭარბებულია ${(spend - limit).toFixed(2)} ${selectedCurrency}-ით!` 
                            : `Exceeded budget limits by ${(spend - limit).toFixed(2)} ${selectedCurrency}!`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick healthy status summary */}
          <div className="mt-5 p-3.5 bg-indigo-50/30 rounded-2xl border border-indigo-100/40 flex items-center gap-3">
            {Object.keys(categorySpends).every(cat => categorySpends[cat as ExpenseCategory] <= activeCurrencyBudgets[cat as ExpenseCategory]) ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-xs font-semibold text-slate-500">
                  {language === "ka" 
                    ? "ყველა კატეგორია უსაფრთხო დიაპაზონშია. ხარჯები არ აჭარბებს ბიუჯეტებს!" 
                    : "Excellent financial health! All spending categories remain safely within budgets."}
                </p>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-xs font-semibold text-slate-500">
                  {language === "ka" 
                    ? "ზოგიერთ კატეგორიაში ლიმიტი ამოიწურა. გთხოვთ გადახედოთ ხარჯებს." 
                    : "Attention: Budget limits exceeded in some departments. Review spending logs."}
                </p>
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
