import React from "react";
import { Award, ShoppingBag, TrendingUp, BarChart3, HelpCircle } from "lucide-react";
import { Language, ExtractedInvoice } from "../types";

interface VendorAnalyticsProps {
  language: Language;
  invoices: ExtractedInvoice[];
}

export default function VendorAnalytics({
  language,
  invoices,
}: VendorAnalyticsProps) {
  // Convert using basic backup standard rate
  const getGELAmount = (amount: number, currency: string) => {
    const cur = (currency || "GEL").toUpperCase().trim();
    if (cur === "USD") return amount * 2.715;
    if (cur === "EUR") return amount * 2.945;
    return amount;
  };

  // Vendor calculations
  const vendorStats: Record<string, { count: number; totalGEL: number; categories: Set<string> }> = {};

  invoices.forEach((inv) => {
    const vendor = inv.vendor || (language === "ka" ? "უცნობი" : "Unknown");
    const amount = Number(inv.amount) || 0;
    const gelAmt = getGELAmount(amount, inv.currency || "GEL");
    const cat = inv.category || "other";

    if (!vendorStats[vendor]) {
      vendorStats[vendor] = {
        count: 0,
        totalGEL: 0,
        categories: new Set(),
      };
    }
    vendorStats[vendor].count += 1;
    vendorStats[vendor].totalGEL += gelAmt;
    vendorStats[vendor].categories.add(cat);
  });

  const sortedVendorsBySpend = Object.entries(vendorStats)
    .map(([name, stats]) => ({
      name,
      count: stats.count,
      totalGEL: stats.totalGEL,
      categories: Array.from(stats.categories),
    }))
    .sort((a, b) => b.totalGEL - a.totalGEL);

  const totalGELSpending = sortedVendorsBySpend.reduce((sum, v) => sum + v.totalGEL, 0);

  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm mb-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">
              {language === "ka" ? "მომწოდებლების დეტალური ანალიტიკა" : "Vendor & Supplier Spend Analysis"}
            </h4>
            <p className="text-xs text-slate-400 font-semibold">
              {language === "ka" 
                ? "დასახელებების მიხედვით ხარჯებისა და სიხშირის ანალიზი" 
                : "Granular audit of partner transaction density and capital concentration"}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono tracking-widest text-slate-400 font-bold uppercase">
          {invoices.length} {language === "ka" ? "ინვოისი" : "Invoices"}
        </span>
      </div>

      {/* Grid */}
      {sortedVendorsBySpend.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs font-bold">
          {language === "ka" ? "მონაცემები არ არის" : "No vendors registered yet"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Spenders List */}
          <div className="space-y-4">
            <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              {language === "ka" ? "უმსხვილესი მომწოდებლები (ხარჯი)" : "Top Partners by Capital Outflow"}
            </h5>

            <div className="space-y-3">
              {sortedVendorsBySpend.slice(0, 4).map((vendor, index) => {
                const percentage = totalGELSpending > 0 ? (vendor.totalGEL / totalGELSpending) * 100 : 0;
                
                return (
                  <div key={index} className="space-y-1.5 group">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 flex items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500 font-bold">
                          {index + 1}
                        </span>
                        <span className="text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {vendor.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900">
                          ₾ {vendor.totalGEL.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">
                          ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full group-hover:bg-indigo-500 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* High Frequency Suppliers */}
          <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-5 md:pt-0 md:pl-6">
            <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              {language === "ka" ? "ყველაზე ხშირი მომწოდებლები (რაოდენობა)" : "Transaction Frequency Audit"}
            </h5>

            <div className="space-y-3">
              {sortedVendorsBySpend
                .slice()
                .sort((a, b) => b.count - a.count)
                .slice(0, 4)
                .map((vendor, index) => {
                  return (
                    <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-100/40 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <div>
                          <div className="text-xs font-black text-slate-800">{vendor.name}</div>
                          <div className="text-xs text-slate-400 font-semibold capitalize">
                            {vendor.categories.join(", ")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-slate-900">
                          {vendor.count} {language === "ka" ? "ტრანზაქცია" : "Trans."}
                        </div>
                        <div className="text-xs text-slate-400 font-bold">
                          {language === "ka" ? "სულ:" : "Total:"} ₾ {vendor.totalGEL.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
