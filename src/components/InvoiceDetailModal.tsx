import React, { useState } from "react";
import { X, Calendar, DollarSign, Tag, FileText, ShoppingBag, Edit3, Check, Trash2, Plus, Printer } from "lucide-react";
import { Language, ExtractedInvoice, ExpenseCategory, CATEGORY_LABELS, TRANSLATIONS, InvoiceItem } from "../types";

interface InvoiceDetailModalProps {
  language: Language;
  invoice: ExtractedInvoice;
  onClose: () => void;
  onSave: (updated: ExtractedInvoice) => void;
}

export default function InvoiceDetailModal({
  language,
  invoice,
  onClose,
  onSave,
}: InvoiceDetailModalProps) {
  const t = TRANSLATIONS[language];
  const [isEditing, setIsEditing] = useState(false);

  // Edit states
  const [vendor, setVendor] = useState(invoice.vendor);
  const [date, setDate] = useState(invoice.date);
  const [amount, setAmount] = useState(invoice.amount);
  const [currency, setCurrency] = useState(invoice.currency);
  const [category, setCategory] = useState<ExpenseCategory>(invoice.category);
  const [vatMode, setVatMode] = useState<"included" | "none" | "unknown">(invoice.vatMode || "unknown");
  const [items, setItems] = useState<InvoiceItem[]>([...invoice.items]);

  const net = Math.round((Number(amount) / 1.18) * 100) / 100;
  const vat = Math.round((Number(amount) - net) * 100) / 100;

  const handleSave = () => {
    onSave({
      ...invoice,
      vendor,
      date,
      amount: Number(amount),
      currency: currency.toUpperCase(),
      category,
      vatMode,
      items: items.filter(i => i.name.trim() !== ""),
    });
    setIsEditing(false);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { name: "", quantity: 1, price: 0 }]);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200/50 max-h-[90vh] flex flex-col animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50/80 text-indigo-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg leading-snug">
                {t.invoiceDetails}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px]">
                {invoice.fileName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white/80 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200/40"
                title={language === "ka" ? "რედაქტირება" : "Edit"}
              >
                <Edit3 className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-emerald-200/40"
                title={t.save}
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200/40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content (Side-by-side Grid) */}
        <div className="overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/40">
          
          {/* LEFT: Metadata & Items Editor (cols 7) */}
          <div className="p-6 lg:col-span-7 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vendor */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t.vendor}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200/80 bg-white/50 backdrop-blur-sm rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-800 bg-white/40 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-200/30">
                    {vendor}
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t.date}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200/80 bg-white/50 backdrop-blur-sm rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                ) : (
                  <p className="text-sm text-slate-700 bg-white/40 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-200/30 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {date}
                  </p>
                )}
              </div>

              {/* Total Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t.total}
                </label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200/80 bg-white/50 backdrop-blur-sm rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-24 px-3 py-2 border border-slate-200/80 bg-white/50 backdrop-blur-sm rounded-xl text-sm font-bold uppercase focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="GEL">GEL (₾)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-800 bg-white/40 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-200/30 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    {amount.toFixed(2)} {currency}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  {t.category}
                </label>
                {isEditing ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 border border-slate-200/80 bg-white/50 backdrop-blur-sm rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, lbl]) => (
                      <option key={key} value={key}>
                        {language === "ka" ? lbl.ka : lbl.en}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="inline-flex px-3 py-2 rounded-xl text-sm font-semibold border bg-indigo-50/50 text-indigo-700 border-indigo-100">
                    {language === "ka" ? CATEGORY_LABELS[category].ka : CATEGORY_LABELS[category].en}
                  </span>
                )}
              </div>

              {/* VAT Mode */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  {language === "ka" ? "დღგ-ის სტატუსი" : "VAT Status"}
                </label>
                {isEditing ? (
                  <select
                    value={vatMode}
                    onChange={(e) => setVatMode(e.target.value as "included" | "none" | "unknown")}
                    className="w-full px-3 py-2 border border-slate-200/80 bg-white/50 backdrop-blur-sm rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="included">
                      {language === "ka" ? "დღგ შედის თანხაში (18%)" : "VAT included in total (18%)"}
                    </option>
                    <option value="none">
                      {language === "ka" ? "დღგ არ ვრცელდება" : "VAT not applicable"}
                    </option>
                    <option value="unknown">
                      {language === "ka" ? "უცნობია" : "Unknown"}
                    </option>
                  </select>
                ) : (
                  <p className="text-sm font-semibold text-slate-800 bg-white/40 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-200/30">
                    {vatMode === "included"
                      ? (language === "ka" ? "დღგ შედის თანხაში (18%)" : "VAT included in total (18%)")
                      : vatMode === "none"
                      ? (language === "ka" ? "დღგ არ ვრცელდება" : "VAT not applicable")
                      : (language === "ka" ? "უცნობია" : "Unknown")}
                  </p>
                )}
              </div>
            </div>

            {/* Product Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t.items}
                </label>
                {isEditing && (
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center gap-1 text-xs text-indigo-600 font-bold hover:text-indigo-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {language === "ka" ? "პროდუქტის დამატება" : "Add Item"}
                  </button>
                )}
              </div>

              <div className="border border-slate-200/60 rounded-2xl overflow-hidden bg-white/30 backdrop-blur-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/60 text-slate-500 text-xs font-semibold border-b border-slate-200/40">
                    <tr>
                      <th className="px-4 py-3 w-3/5">{language === "ka" ? "დასახელება" : "Item Name / Description"}</th>
                      <th className="px-4 py-3 text-center w-16">{t.quantity}</th>
                      <th className="px-4 py-3 text-right w-24">{t.price}</th>
                      {isEditing && <th className="px-4 py-3 text-center w-12"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-white/40 transition-colors">
                        <td className="px-4 py-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(index, "name", e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 bg-white/60 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                              placeholder="e.g. Printer Paper"
                            />
                          ) : (
                            <span className="text-slate-700 font-semibold text-xs">{item.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              value={item.quantity || 1}
                              onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                              className="w-12 px-1 py-1 border border-slate-200 bg-white/60 rounded-lg text-center text-sm focus:outline-none focus:border-indigo-500"
                            />
                          ) : (
                            <span className="text-slate-500 font-medium text-xs">{item.quantity || 1}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={item.price || 0}
                              onChange={(e) => handleItemChange(index, "price", Number(e.target.value))}
                              className="w-20 px-1.5 py-1 border border-slate-200 bg-white/60 rounded-lg text-right text-sm focus:outline-none focus:border-indigo-500"
                            />
                          ) : (
                            <span className="text-slate-600 font-medium text-xs">
                              {item.price ? `${item.price.toFixed(2)} ${currency}` : "-"}
                            </span>
                          )}
                        </td>
                        {isEditing && (
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemRow(index)}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={isEditing ? 4 : 3} className="px-4 py-6 text-center text-slate-400 italic font-medium">
                          {language === "ka" ? "პროდუქტები არ არის" : "No items listed"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT: High-Fidelity Receipt Preview (cols 5) */}
          <div className="p-6 lg:col-span-5 bg-slate-50/40 overflow-y-auto max-h-[calc(90vh-140px)] flex flex-col items-center justify-start border-t lg:border-t-0 border-slate-200/40">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest self-start mb-4 flex items-center gap-1.5">
              <span>🖨️</span> {t.receiptPreview}
            </p>

            {/* Thermal Receipt Paper Mock */}
            <div id="thermal-receipt-print-area" className="relative w-full max-w-sm bg-[#FAF9F6] border border-slate-200 rounded-lg shadow-md p-6 text-slate-800 font-mono text-sm leading-relaxed overflow-hidden">

              {/* Receipt Header */}
              <div className="text-center space-y-1 mb-4">
                <h3 className="font-extrabold text-base tracking-wider text-slate-900 truncate uppercase">
                  {vendor || "COMPANY UNNAMED"}
                </h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                  --- {language === "ka" ? "ამონაწერი — არ არის ფისკალური ქვითარი" : "EXTRACT — NOT A FISCAL RECEIPT"} ---
                </p>
                <div className="text-[10px] text-slate-500 space-y-0.5 mt-2">
                  <p className="flex justify-between">
                    <span>{language === "ka" ? "თარიღი:" : "DATE:"}</span>
                    <span className="font-bold">{date || "YYYY-MM-DD"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>{language === "ka" ? "კატეგორია:" : "CATEGORY:"}</span>
                    <span className="font-bold uppercase text-indigo-600">
                      {category}
                    </span>
                  </p>
                </div>
              </div>

              {/* Dotted Divider */}
              <div className="border-b border-dashed border-slate-300 my-4" />

              {/* Receipt Items */}
              <div className="space-y-3 min-h-[120px]">
                {items.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 italic py-6">
                    {language === "ka" ? "პროდუქტები ცარიელია" : "No items listed"}
                  </p>
                ) : (
                  items.map((it, idx) => {
                    const itemQty = it.quantity || 1;
                    const itemPrice = it.price || 0;
                    const itemSum = itemQty * itemPrice;
                    return (
                      <div key={idx} className="flex justify-between items-start text-xs font-mono leading-tight">
                        <div className="flex-1 pr-3">
                          <p className="text-slate-800 font-bold uppercase truncate max-w-[170px]" title={it.name}>
                            {it.name || "UNNAMED ITEM"}
                          </p>
                          {itemQty > 1 && (
                            <p className="text-[10px] text-slate-400 font-medium">
                              {itemQty} x {itemPrice.toFixed(2)}
                            </p>
                          )}
                        </div>
                        <div className="text-slate-900 font-extrabold shrink-0 text-right">
                          {itemSum.toFixed(2)} <span className="text-[10px]">{currency}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Dotted Divider */}
              <div className="border-b border-dashed border-slate-300 my-4" />

              {/* Receipt Totals */}
              <div className="space-y-1.5 text-xs text-slate-800">
                {vatMode === "included" && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-500">{language === "ka" ? "შუალედური ჯამი:" : "SUBTOTAL:"}</span>
                      <span className="font-bold">{net.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-500">{language === "ka" ? "დღგ (18%):" : "VAT / TAX (18%):"}</span>
                      <span className="font-bold">{vat.toFixed(2)} {currency}</span>
                    </div>
                  </>
                )}
                
                {/* Thick separator */}
                <div className="border-b-2 border-double border-slate-400 my-2" />

                <div className="flex justify-between items-baseline py-1">
                  <span className="font-extrabold text-sm text-slate-900">{language === "ka" ? "სულ ჯამი:" : "TOTAL AMOUNT:"}</span>
                  <span className="font-black text-lg text-indigo-600">
                    {amount.toFixed(2)} {currency}
                  </span>
                </div>
              </div>

              {/* Receipt Footer Message */}
              <div className="text-center text-[9px] text-slate-400 mt-6 pt-4 border-t border-dashed border-slate-300 font-bold tracking-wider">
                *** {language === "ka" ? "გმადლობთ თანამშრომლობისთვის" : "THANK YOU FOR YOUR BUSINESS"} ***
              </div>

            </div>
          </div>

        </div>

        {/* Print Styles Sheet injected only while modal is open */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #thermal-receipt-print-area, #thermal-receipt-print-area * {
              visibility: visible !important;
            }
            #thermal-receipt-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            html, body {
              overflow: visible !important;
              height: auto !important;
            }
          }
        `}</style>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/50 backdrop-blur-md rounded-b-3xl border-t border-slate-200/40 flex justify-between items-center">
          <div>
            {!isEditing && (
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>{language === "ka" ? "ბეჭდვა" : "Print Receipt"}</span>
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setVendor(invoice.vendor);
                    setDate(invoice.date);
                    setAmount(invoice.amount);
                    setCurrency(invoice.currency);
                    setCategory(invoice.category);
                    setVatMode(invoice.vatMode || "unknown");
                    setItems([...invoice.items]);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-white/80 transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  {t.save}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {t.close}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
