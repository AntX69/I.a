import React, { useState } from "react";
import { 
  TrendingUp, 
  ShoppingBag, 
  Sparkles, 
  ArrowRightLeft, 
  Sliders, 
  DollarSign, 
  Calendar,
  Layers,
  ChevronDown
} from "lucide-react";
import { 
  Language, 
  ExtractedInvoice, 
  ExpenseCategory, 
  CATEGORY_LABELS, 
  TRANSLATIONS 
} from "../types";
import LiveExchangeRates from "../components/LiveExchangeRates";
import SmartInsights from "../components/SmartInsights";
import InvoiceAnalytics from "../components/InvoiceAnalytics";
import VendorAnalytics from "../components/VendorAnalytics";
import InvoiceSummaryCards from "../components/InvoiceSummaryCards";
import PageHeader from "../components/PageHeader";

export interface AnalyticsPageProps {
  language: Language;
  invoices: ExtractedInvoice[]; // workspace invoices
  budgets: Record<string, Record<ExpenseCategory, number>>;
  canManageBudgets: boolean;
  onBudgetsChanged: (newBudgets: Record<string, Record<ExpenseCategory, number>>) => void;
  onBudgetEditedByUser?: () => void;
  onRatesChanged?: (rates: Record<string, number>) => void;
}

export default function AnalyticsPage({
  language,
  invoices,
  budgets,
  canManageBudgets,
  onBudgetsChanged,
  onBudgetEditedByUser,
  onRatesChanged,
}: AnalyticsPageProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("GEL");
  const [periodFilter, setPeriodFilter] = useState<"all" | "this_month" | "last_30">("all");

  // Helper to parse dates
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

  // Filter invoices by period if needed
  const periodFilteredInvoices = invoices.filter((inv) => {
    if (periodFilter === "all") return true;
    const invDate = parseLocalDate(inv.date);
    if (!invDate) return false;

    const now = new Date();
    if (periodFilter === "this_month") {
      return invDate.getFullYear() === now.getFullYear() && invDate.getMonth() === now.getMonth();
    }
    if (periodFilter === "last_30") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      return invDate >= thirtyDaysAgo && invDate <= today;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header Component */}
      <PageHeader
        title={language === "ka" ? "ფინანსური ანალიტიკა" : "Financial Analytics"}
        subtitle={language === "ka"
          ? "დეტალური სტატისტიკა, ბიუჯეტების მართვა, მომწოდებლები და ვალუტის კურსები"
          : "Comprehensive spending breakdown, budget caps, vendor insights, and exchange rates"}
        actions={
          <div className="relative">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="appearance-none pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer shadow-xs"
            >
              <option value="all">📅 {language === "ka" ? "სრული პერიოდი" : "All Time"}</option>
              <option value="this_month">📅 {language === "ka" ? "მიმდინარე თვე" : "This Month"}</option>
              <option value="last_30">📅 {language === "ka" ? "ბოლო 30 დღე" : "Last 30 Days"}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        }
      />

      {/* 1. Summary Cards */}
      <InvoiceSummaryCards 
        language={language} 
        invoices={periodFilteredInvoices} 
      />

      {/* 2. Interactive Spend Analytics & Category Budgets */}
      <div id="budget-analytics-section">
        <InvoiceAnalytics 
          language={language} 
          invoices={periodFilteredInvoices} 
          onBudgetsChanged={onBudgetsChanged} 
          onBudgetEditedByUser={onBudgetEditedByUser}
          canManageBudgets={canManageBudgets}
        />
      </div>

      {/* 3. Vendor & Supplier Spend Analysis */}
      <VendorAnalytics
        language={language}
        invoices={periodFilteredInvoices}
      />

      {/* 4. Smart Insights (Complete Card) */}
      <SmartInsights
        language={language}
        invoices={periodFilteredInvoices}
        currency={selectedCurrency}
        budgets={budgets.GEL || {
          office: 500,
          marketing: 1000,
          it: 1500,
          transport: 400,
          food: 300,
          other: 800,
        }}
      />

      {/* 5. Reference Exchange Rates Card */}
      <div className="grid grid-cols-1 gap-4">
        <LiveExchangeRates
          language={language}
          onRatesChanged={onRatesChanged}
        />
      </div>
    </div>
  );
}
