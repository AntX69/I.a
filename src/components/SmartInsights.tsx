import React from "react";
import { Sparkles, TrendingDown, AlertTriangle, Lightbulb, CheckCircle2, TrendingUp, Info } from "lucide-react";
import { Language, ExtractedInvoice, ExpenseCategory, CATEGORY_LABELS } from "../types";

interface SmartInsightsProps {
  language: Language;
  invoices: ExtractedInvoice[];
  currency: string;
  budgets: Record<ExpenseCategory, number>;
}

export default function SmartInsights({
  language,
  invoices,
  currency,
  budgets,
}: SmartInsightsProps) {
  // Converted values (using internal static currency converter to keep consistency)
  const getGELValue = (amount: number, fromCurrency: string): number => {
    const cur = fromCurrency.toUpperCase().trim();
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

  // Convert all invoices to active currency
  const convertedInvoices = invoices.map(inv => ({
    ...inv,
    convertedAmount: getConvertedValue(Number(inv.amount) || 0, inv.currency || "GEL", currency)
  }));

  const totalSpend = convertedInvoices.reduce((sum, inv) => sum + inv.convertedAmount, 0);

  // Group by category
  const categoryTotals: Record<ExpenseCategory, number> = {
    office: 0,
    marketing: 0,
    it: 0,
    transport: 0,
    food: 0,
    other: 0,
  };

  convertedInvoices.forEach(inv => {
    const cat = inv.category as ExpenseCategory;
    if (categoryTotals[cat] !== undefined) {
      categoryTotals[cat] += inv.convertedAmount;
    } else {
      categoryTotals.other += inv.convertedAmount;
    }
  });

  // Calculate highest category
  let maxCategory: ExpenseCategory = "other";
  let maxCategorySpend = 0;
  Object.entries(categoryTotals).forEach(([cat, val]) => {
    if (val > maxCategorySpend) {
      maxCategorySpend = val;
      maxCategory = cat as ExpenseCategory;
    }
  });

  // Vendor recurrence
  const vendorCounts: Record<string, number> = {};
  invoices.forEach(inv => {
    const v = inv.vendor.trim();
    vendorCounts[v] = (vendorCounts[v] || 0) + 1;
  });

  const recurringVendors = Object.entries(vendorCounts)
    .filter(([_, count]) => count >= 2)
    .map(([vendor]) => vendor);

  // Budget consumption analysis
  const limitsExceeded: string[] = [];
  const limitsWarning: string[] = []; // Above 80%

  Object.entries(categoryTotals).forEach(([cat, spend]) => {
    const limit = budgets[cat as ExpenseCategory] || 0;
    if (limit > 0) {
      const pct = (spend / limit) * 100;
      const catLabel = CATEGORY_LABELS[cat as ExpenseCategory];
      const name = language === "ka" ? catLabel.ka : catLabel.en;

      if (spend > limit) {
        limitsExceeded.push(name);
      } else if (pct >= 80) {
        limitsWarning.push(name);
      }
    }
  });

  // Build high-value insights
  const insightsList: {
    type: "success" | "warning" | "danger" | "info";
    title: string;
    description: string;
  }[] = [];

  if (totalSpend === 0) {
    insightsList.push({
      type: "info",
      title: language === "ka" ? "არასაკმარისი მონაცემები" : "No Data Yet",
      description: language === "ka" 
        ? "ატვირთეთ ან ხელით დაამატეთ ინვოისები ჭკვიანი ფინანსური რჩევებისა და ანალიტიკისთვის." 
        : "Upload or create invoices to view interactive financial optimization advice."
    });
  } else {
    // 1. Expense concentration insight
    const maxCatPct = totalSpend > 0 ? (maxCategorySpend / totalSpend) * 100 : 0;
    if (maxCatPct > 35) {
      const catName = language === "ka" ? CATEGORY_LABELS[maxCategory].ka : CATEGORY_LABELS[maxCategory].en;
      insightsList.push({
        type: "warning",
        title: language === "ka" ? "მაღალი ხარჯების კონცენტრაცია" : "High Expense Concentration",
        description: language === "ka"
          ? `თქვენი ხარჯების ${maxCatPct.toFixed(1)}% მოდის კატეგორიაზე: "${catName}". სასურველია გადახედოთ ამ სექტორს და მოახდინოთ რესურსების გადანაწილება.`
          : `${maxCatPct.toFixed(1)}% of your expenses belong to "${catName}". We suggest reviewing this category to optimize resources.`
      });
    }

    // 2. Budget status insight
    if (limitsExceeded.length > 0) {
      insightsList.push({
        type: "danger",
        title: language === "ka" ? "ბიუჯეტის გადახარჯვა!" : "Over Budget Alerts!",
        description: language === "ka"
          ? `თქვენ გადააჭარბეთ დაწესებულ ლიმიტებს შემდეგ კატეგორიებში: ${limitsExceeded.join(", ")}. რეკომენდებულია ხარჯების დაუყოვნებლივ ოპტიმიზაცია.`
          : `You have exceeded established limits in: ${limitsExceeded.join(", ")}. Prompt cost optimization is advised.`
      });
    }

    if (limitsWarning.length > 0) {
      insightsList.push({
        type: "warning",
        title: language === "ka" ? "ლიმიტთან მიახლოება" : "Approaching Budgets",
        description: language === "ka"
          ? `ფინანსური ხარჯები უახლოვდება მაქსიმუმს შემდეგ სექტორებში: ${limitsWarning.join(", ")} (უკვე ათვისებულია ბიუჯეტის 80%-ზე მეტი).`
          : `Spending is approaching maximum thresholds in: ${limitsWarning.join(", ")} (over 80% budget consumed).`
      });
    }

    // 3. Recurring vendors insight
    if (recurringVendors.length > 0) {
      insightsList.push({
        type: "info",
        title: language === "ka" ? "რეკურენტული (განმეორებადი) ხარჯები" : "Recurring Expenses Detected",
        description: language === "ka"
          ? `კომპანიებთან [${recurringVendors.slice(0, 3).join(", ")}] ფიქსირდება განმეორებადი გადახდები. გირჩევთ მოითხოვოთ კორპორატიული ფასდაკლება ან გრძელვადიანი აბონემენტი.`
          : `We found recurring payments with [${recurringVendors.slice(0, 3).join(", ")}]. Consider inquiring about long-term or corporate discounts.`
      });
    }

    // 4. Healthy status indicator if everything is optimal
    if (limitsExceeded.length === 0 && limitsWarning.length === 0 && maxCatPct <= 35) {
      insightsList.push({
        type: "success",
        title: language === "ka" ? "შესანიშნავი ფინანსური დისციპლინა" : "Optimal Spending Discipline",
        description: language === "ka"
          ? "ყველა ხარჯი იდეალურ ფარგლებშია. არცერთი კატეგორია არ აჭარბებს ბიუჯეტებს და ხარჯების გადანაწილება არის სრულიად თანაბარი!"
          : "All expenses are within healthy levels. Categories are safely below limits, and allocations are balanced."
      });
    }
  }

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-2xl border border-slate-800/80 mb-8 relative overflow-hidden">
      {/* Decorative gradient glowing orb */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">
              {language === "ka" ? "სმარტ-ანალიტიკა & ფინანსური რჩევები" : "AI Financial Intelligence & Insights"}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {language === "ka" ? "ავტომატური რეკომენდაციები დანახარჯების ოპტიმიზაციისთვის" : "Automated optimization strategies based on spending logs"}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
          {language === "ka" ? "პრემიუმ ვერსია" : "Premium Engine"}
        </span>
      </div>

      {/* Insights Carousel/List */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {insightsList.map((ins, idx) => {
          // Color coding
          let iconBg = "bg-indigo-500/10 text-indigo-400 border-indigo-500/10";
          let iconElement = <Lightbulb className="w-4 h-4" />;

          if (ins.type === "success") {
            iconBg = "bg-emerald-500/15 text-emerald-400 border-emerald-500/10";
            iconElement = <CheckCircle2 className="w-4 h-4" />;
          } else if (ins.type === "warning") {
            iconBg = "bg-amber-500/15 text-amber-400 border-amber-500/10";
            iconElement = <TrendingDown className="w-4 h-4" />;
          } else if (ins.type === "danger") {
            iconBg = "bg-rose-500/15 text-rose-400 border-rose-500/10";
            iconElement = <AlertTriangle className="w-4 h-4" />;
          }

          return (
            <div 
              key={idx} 
              className="bg-slate-950/40 border border-slate-800/40 p-4 rounded-2xl flex gap-3 hover:border-slate-700/60 transition-all duration-200 group"
            >
              <div className={`p-2 rounded-xl h-9 shrink-0 border flex items-center justify-center ${iconBg}`}>
                {iconElement}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-200 group-hover:text-white transition-colors">
                  {ins.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {ins.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
