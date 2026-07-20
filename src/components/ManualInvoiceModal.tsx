import React, { useState } from "react";
import { X, Plus, Trash2, Calendar, FileText, CheckCircle, Hash, Building2 } from "lucide-react";
import { Language, ExtractedInvoice, ExpenseCategory, CATEGORY_LABELS } from "../types";

interface ManualInvoiceModalProps {
  language: Language;
  onClose: () => void;
  onSave: (invoice: ExtractedInvoice) => void;
}

export default function ManualInvoiceModal({
  language,
  onClose,
  onSave,
}: ManualInvoiceModalProps) {
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [currency, setCurrency] = useState("GEL");
  const [category, setCategory] = useState<ExpenseCategory>("office");
  
  // Invoice items state
  const [items, setItems] = useState<{ name: string; quantity: number; price: number }[]>([
    { name: "", quantity: 1, price: 0 }
  ]);

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddItem = () => {
    setItems([...items, { name: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: "name" | "quantity" | "price", value: any) => {
    const updated = [...items];
    if (field === "name") {
      updated[index].name = value;
    } else if (field === "quantity") {
      updated[index].quantity = Math.max(1, parseInt(value, 10) || 1);
    } else if (field === "price") {
      updated[index].price = Math.max(0, parseFloat(value) || 0);
    }
    setItems(updated);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor.trim()) {
      setValidationError(
        language === "ka"
          ? "გთხოვთ მიუთითოთ კომპანიის / გამყიდველის სახელი."
          : "Please specify the company / vendor name."
      );
      return;
    }

    const filledItems = items.filter(item => item.name.trim() !== "");
    if (filledItems.length === 0) {
      setValidationError(
        language === "ka"
          ? "გთხოვთ დაამატოთ მინიმუმ ერთი დასახელების პროდუქტი ან სერვისი."
          : "Please add at least one valid product or service item."
      );
      return;
    }

    const manualInvoice: ExtractedInvoice = {
      id: "man-" + Math.random().toString(36).substring(2, 9),
      vendor: vendor.trim(),
      date: date || new Date().toISOString().split("T")[0],
      amount: totalAmount,
      currency: currency.toUpperCase(),
      items: filledItems.map(item => ({
        name: item.name.trim(),
        quantity: item.quantity,
        price: item.price
      })),
      category: category,
      fileName: language === "ka" ? "მექანიკური_შექმნილი.pdf" : "manually_created.pdf",
      uploadedAt: new Date().toISOString()
    };

    onSave(manualInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                {language === "ka" ? "ინვოისის ხელით შექმნა" : "Create Manual Invoice"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === "ka" ? "შეავსეთ მონაცემები ოფიციალური დოკუმენტის შესაქმნელად" : "Enter details to record or draft a custom invoice"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6 flex-1">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold animate-shake">
              ⚠️ {validationError}
            </div>
          )}

          {/* Core Info Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Vendor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {language === "ka" ? "კომპანია / გამყიდველი" : "Company / Vendor"}
              </label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder={language === "ka" ? "მაგ. ვისოლი, მეტა, ზუმი" : "e.g. Wix, AWS, Meta Ads"}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold"
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {language === "ka" ? "თარიღი" : "Date"}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {language === "ka" ? "ხარჯის კატეგორია" : "Expense Category"}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold bg-white cursor-pointer"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {language === "ka" ? label.ka : label.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {language === "ka" ? "ვალუტა" : "Currency"}
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-semibold bg-white cursor-pointer"
              >
                <option value="GEL">GEL (₾)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {language === "ka" ? "პროდუქტები და მომსახურება" : "Products & Services"}
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {language === "ka" ? "პუნქტის დამატება" : "Add Item"}
              </button>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {/* Name */}
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, "name", e.target.value)}
                    placeholder={language === "ka" ? "პროდუქტის/მომსახურების სახელი" : "e.g. Hosting subscription"}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-400"
                    required
                  />

                  {/* Quantity */}
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    placeholder="Qty"
                    className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center focus:outline-none focus:border-indigo-400"
                    min="1"
                    required
                  />

                  {/* Price */}
                  <div className="relative w-24">
                    <input
                      type="number"
                      step="0.01"
                      value={item.price || ""}
                      onChange={(e) => handleItemChange(index, "price", e.target.value)}
                      placeholder="Price"
                      className="w-full pl-2 pr-6 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right focus:outline-none focus:border-indigo-400"
                      min="0"
                      required
                    />
                    <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold uppercase">{currency}</span>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length <= 1}
                    className={`p-1.5 rounded-lg border transition-all ${
                      items.length <= 1
                        ? "text-slate-300 border-transparent cursor-not-allowed"
                        : "text-red-500 border-transparent hover:border-red-100 hover:bg-white cursor-pointer"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Details */}
          <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-indigo-600" />
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                {language === "ka" ? "სულ დასაფიქსირებელი ჯამი" : "Total Draft Amount"}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-indigo-700">
                {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-indigo-500 uppercase">{currency}</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all cursor-pointer"
            >
              {language === "ka" ? "გაუქმება" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-100 transition-all cursor-pointer"
            >
              {language === "ka" ? "ჩანაწერის შენახვა" : "Record Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
