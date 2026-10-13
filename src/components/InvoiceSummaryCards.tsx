import React from "react";
import { FileText, DollarSign, PieChart, Layers } from "lucide-react";
import { Language, ExtractedInvoice, CATEGORY_LABELS, CATEGORY_COLORS, TRANSLATIONS, ExpenseCategory } from "../types";

interface InvoiceSummaryCardsProps {
  language: Language;
  invoices: ExtractedInvoice[];
}

export default function InvoiceSummaryCards({
  language,
  invoices,
}: InvoiceSummaryCardsProps) {
  const t = TRANSLATIONS[language];

  // Calculations
  const totalInvoices = invoices.length;

  // Group spends by currency
  const spendsByCurrency: Record<string, number> = {};
  invoices.forEach((inv) => {
    const cur = (inv.currency || "GEL").toUpperCase().trim();
    const amt = Number(inv.amount) || 0;
    spendsByCurrency[cur] = (spendsByCurrency[cur] || 0) + amt;
  });

  // Category statistics (count of invoices per category)
  const categoryCounts: Record<ExpenseCategory, number> = {
    office: 0,
    marketing: 0,
    it: 0,
    transport: 0,
    food: 0,
    other: 0,
  };
  
  invoices.forEach((inv) => {
    if (categoryCounts[inv.category] !== undefined) {
      categoryCounts[inv.category]++;
    } else {
      categoryCounts.other++;
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Count Card */}
      <div className="bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-2xl p-6 shadow-lg shadow-slate-200/20 flex items-center space-x-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-100/20 hover:border-indigo-100/80 cursor-default">
        <div className="p-3.5 bg-indigo-50/80 text-indigo-600 rounded-2xl">
          <FileText className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t.totalInvoices}
          </p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">
            {totalInvoices}
          </p>
        </div>
      </div>

      {/* Spend By Currency Card */}
      <div className="bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-2xl p-6 shadow-lg shadow-slate-200/20 flex items-center space-x-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-100/20 hover:border-indigo-100/80 cursor-default">
        <div className="p-3.5 bg-emerald-50/80 text-emerald-600 rounded-2xl">
          <DollarSign className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t.totalSpend}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {Object.keys(spendsByCurrency).length === 0 ? (
              <p className="text-3xl font-extrabold text-slate-900">0.00</p>
            ) : (
              Object.entries(spendsByCurrency).map(([cur, total]) => (
                <div key={cur} className="flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    {cur}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown Card */}
      <div className="bg-white/50 backdrop-blur-md border border-slate-200/50 rounded-2xl p-6 shadow-lg shadow-slate-200/20 flex items-center space-x-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-100/20 hover:border-indigo-100/80 cursor-default">
        <div className="p-3.5 bg-purple-50/80 text-purple-600 rounded-2xl">
          <Layers className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            {t.byCategory}
          </p>
          {totalInvoices === 0 ? (
            <p className="text-sm text-slate-400 italic">
              {language === "ka" ? "კატეგორიების მონაცემები ჯერ არ არის" : "No category data"}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {Object.entries(categoryCounts)
                .filter(([_, count]) => count > 0)
                .map(([cat, count]) => {
                  const label = CATEGORY_LABELS[cat as ExpenseCategory];
                  const color = CATEGORY_COLORS[cat as ExpenseCategory];
                  return (
                    <div
                      key={cat}
                      className={`flex items-center justify-between px-2.5 py-1 rounded-xl border ${color} font-semibold`}
                    >
                      <span className="truncate max-w-[80px]">
                        {language === "ka" ? label.ka : label.en}
                      </span>
                      <span>{count}</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
