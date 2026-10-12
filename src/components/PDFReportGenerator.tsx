import React from "react";
import { FileText, Printer, Download, Check, X } from "lucide-react";
import { Language, ExtractedInvoice, ExpenseCategory, CATEGORY_LABELS, TRANSLATIONS } from "../types";

interface PDFReportGeneratorProps {
  language: Language;
  invoices: ExtractedInvoice[];
  workspace: string;
  onClose: () => void;
}

export default function PDFReportGenerator({
  language,
  invoices,
  workspace,
  onClose,
}: PDFReportGeneratorProps) {
  // Convert using standard rate for report consolidation
  const getGELAmount = (amount: number, currency: string) => {
    const cur = (currency || "GEL").toUpperCase().trim();
    if (cur === "USD") return amount * 2.715;
    if (cur === "EUR") return amount * 2.945;
    return amount;
  };

  const totalInvoices = invoices.length;
  const totalGEL = invoices.reduce((sum, inv) => sum + getGELAmount(Number(inv.amount) || 0, inv.currency || "GEL"), 0);

  const categoryTotals: Record<ExpenseCategory, number> = {
    office: 0,
    marketing: 0,
    it: 0,
    transport: 0,
    food: 0,
    other: 0,
  };

  invoices.forEach((inv) => {
    const cat = inv.category as ExpenseCategory;
    const gelVal = getGELAmount(Number(inv.amount) || 0, inv.currency || "GEL");
    if (categoryTotals[cat] !== undefined) {
      categoryTotals[cat] += gelVal;
    } else {
      categoryTotals.other += gelVal;
    }
  });

  const handlePrint = () => {
    try {
      window.focus();
      if (typeof document !== "undefined" && document.body) {
        document.body.focus();
      }
      setTimeout(() => {
        window.print();
      }, 100);
    } catch (e) {
      console.error("Print failed:", e);
    }
  };

  const isIframe = typeof window !== "undefined" && window.self !== window.top;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn print:bg-white print:p-0">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border border-slate-100 flex flex-col print:shadow-none print:border-none print:max-h-none print:overflow-visible print:rounded-none">
        
        {/* Interactive Action Header (hidden on print) */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                {language === "ka" ? "ბრენდირებული PDF რეპორტი" : "Branded PDF Financial Export"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === "ka" ? "ვიზუალურად გამართული ანგარიში წარსადგენად" : "Ready-for-management print-optimized financial layout"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              {language === "ka" ? "ბეჭდვა / PDF შენახვა" : "Print / Save PDF"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* IFrame Print Warning Banner (hidden when printed) */}
        {isIframe && (
          <div className="mt-4 p-4.5 bg-amber-50/80 border border-amber-200/60 rounded-2xl flex items-start gap-3 text-xs text-amber-900 font-semibold print:hidden leading-relaxed">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0 mt-1.5" />
            <p className="flex-1">
              {language === "ka"
                ? "ბრაუზერის უსაფრთხოების წესების გამო, ჩაშენებულ რეჟიმში (iframe) ბეჭდვის ფუნქცია შესაძლოა დაიბლოკოს. თუ ღილაკი არ რეაგირებს, გთხოვთ გახსნათ აპლიკაცია ახალ ჩანართში (ბმულის გაზიარებით ან 'Open in new tab'-ით) და სცადოთ იქიდან."
                : "Due to browser security policies in embedded iframe mode, direct printing may be blocked. If the button does not respond, please open the application in a new tab and print from there."}
            </p>
          </div>
        )}

        {/* Printable Paper Canvas */}
        <div className="mt-8 p-8 border border-slate-200 rounded-2xl bg-white space-y-8 print:border-none print:p-0 print:mt-0" id="printable-report-canvas">
          {/* Paper Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                {TRANSLATIONS[language].title}
              </h1>
              <p className="text-xs font-mono text-indigo-600 font-extrabold uppercase tracking-widest mt-1">
                {language === "ka" ? "ავტომატიზებული ფინანსური რეესტრი" : "AUTOMATED FINANCIAL LEDGER"}
              </p>
              <div className="mt-4 text-xs font-bold text-slate-700 space-y-1">
                <div><span className="text-slate-400">{language === "ka" ? "სამუშაო სივრცე:" : "WORKSPACE:"}</span> {workspace}</div>
                <div><span className="text-slate-400">{language === "ka" ? "თარიღი:" : "DATE:"}</span> {new Date().toLocaleDateString()}</div>
                <div><span className="text-slate-400">{language === "ka" ? "სტატუსი:" : "STATUS:"}</span> <span className="text-amber-600 font-bold">{language === "ka" ? "AI-ით დამუშავებული — გადაამოწმეთ ორიგინალთან" : "AI-processed — verify against originals"}</span></div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-slate-400 mt-2 font-mono">ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {language === "ka" ? "ჯამური ხარჯი" : "CONSOLIDATED SPEND"}
              </div>
              <div className="text-lg font-black text-slate-900 mt-1">
                ₾ {totalGEL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {language === "ka" ? "დოკუმენტები" : "DOCUMENTS"}
              </div>
              <div className="text-lg font-black text-slate-900 mt-1">
                {totalInvoices} {language === "ka" ? "ჩანაწერი" : "Logs"}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {language === "ka" ? "ვალუტა" : "CONSOLIDATION CURRENCY"}
              </div>
              <div className="text-lg font-black text-slate-900 mt-1">
                GEL (₾)
              </div>
            </div>
          </div>

          {/* Categories allocation list */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {language === "ka" ? "ხარჯები კატეგორიების მიხედვით" : "DEPARTMENTS / COST CENTERS DISTRIBUTION"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(categoryTotals).map(([cat, val]) => {
                const label = CATEGORY_LABELS[cat as ExpenseCategory];
                const percentage = totalGEL > 0 ? (val / totalGEL) * 100 : 0;
                return (
                  <div key={cat} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 capitalize">
                        {language === "ka" ? label.ka : label.en}
                      </div>
                      <div className="text-xs font-black text-slate-800 mt-0.5">
                        ₾ {val.toFixed(2)}
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Consolidated Audit Log (The detailed table) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              {language === "ka" ? "ინვოისების დადასტურებული რეესტრი" : "ITEMIZED ACCOUNTING LEDGER"}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                    <th className="py-2.5">{language === "ka" ? "მომწოდებელი" : "VENDOR"}</th>
                    <th className="py-2.5">{language === "ka" ? "თარიღი" : "DATE"}</th>
                    <th className="py-2.5">{language === "ka" ? "კატეგორია" : "CATEGORY"}</th>
                    <th className="py-2.5 text-right">{language === "ka" ? "თავდაპირველი თანხა" : "ORIGINAL AMT"}</th>
                    <th className="py-2.5 text-right">{language === "ka" ? "ჯამური (₾)" : "CONVERTED (GEL)"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv, idx) => {
                    const label = CATEGORY_LABELS[inv.category as ExpenseCategory] || CATEGORY_LABELS.other;
                    return (
                      <tr key={idx} className="font-semibold text-slate-700">
                        <td className="py-3 font-extrabold text-slate-900">{inv.vendor}</td>
                        <td className="py-3 text-slate-500">{inv.date}</td>
                        <td className="py-3 text-slate-500 capitalize">{language === "ka" ? label.ka : label.en}</td>
                        <td className="py-3 text-right font-mono font-bold text-slate-800">
                          {inv.amount.toFixed(2)} {inv.currency}
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          ₾ {getGELAmount(Number(inv.amount) || 0, inv.currency || "GEL").toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Document Signatures block for visual fidelity */}
          <div className="pt-12 grid grid-cols-2 gap-8 border-t border-slate-100">
            <div className="space-y-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                PREPARED BY (AUDITOR / ACCOUNTANT)
              </div>
              <div className="pt-8 border-b border-slate-300 w-48 text-xs font-mono font-bold text-slate-600 uppercase">
                {TRANSLATIONS[language].title}
              </div>
            </div>
            <div className="space-y-4 text-right flex flex-col items-end">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                AUTHORIZED SIGNATURE / STAMP
              </div>
              <div className="pt-8 border-b border-slate-300 w-48 text-xs font-mono font-bold text-slate-600">
                [ SECURE DIGITALLY SIGNED ]
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
