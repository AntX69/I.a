import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  AlertCircle, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Lock,
  Upload,
  ArrowRight
} from "lucide-react";
import { 
  Language, 
  ExtractedInvoice, 
  ExpenseCategory, 
  CATEGORY_LABELS, 
  CATEGORY_COLORS, 
  TRANSLATIONS 
} from "../types";
import InvoiceUploadZone from "../components/InvoiceUploadZone";
import PageHeader from "../components/PageHeader";

export interface InvoicesPageProps {
  language: Language;
  invoices: ExtractedInvoice[]; // all invoices across app
  workspaceInvoices: ExtractedInvoice[]; // invoices for active workspace
  filteredInvoices: ExtractedInvoice[]; // after search & filter
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  dateRangeFilter: "all" | "this_month" | "last_30";
  onDateRangeChange: (range: "all" | "this_month" | "last_30") => void;
  sortColumn: keyof ExtractedInvoice | null;
  sortDirection: "asc" | "desc" | null;
  onSort: (column: keyof ExtractedInvoice) => void;
  isLoadingInvoices: boolean;
  isAnalyzing: boolean;
  uploadError: string | null;
  canUpload: boolean;
  canDelete: boolean;
  isInvoiceOverBudget: (category: ExpenseCategory, currency: string) => boolean;
  showExportDropdown: boolean;
  onToggleExportDropdown: () => void;
  onCloseExportDropdown: () => void;
  onUpload: (base64: string, mimeType: string, fileName: string) => void;
  onAddManual: () => void;
  onSelectInvoice: (inv: ExtractedInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  onClearAll: () => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
  onOpenPdfReport: () => void;
  uploadSectionRef?: React.RefObject<HTMLDivElement>;
  isUploadCollapsedInitially?: boolean;
}

export default function InvoicesPage({
  language,
  invoices,
  workspaceInvoices,
  filteredInvoices,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  dateRangeFilter,
  onDateRangeChange,
  sortColumn,
  sortDirection,
  onSort,
  isLoadingInvoices,
  isAnalyzing,
  uploadError,
  canUpload,
  canDelete,
  isInvoiceOverBudget,
  showExportDropdown,
  onToggleExportDropdown,
  onCloseExportDropdown,
  onUpload,
  onAddManual,
  onSelectInvoice,
  onDeleteInvoice,
  onClearAll,
  onExportCsv,
  onExportExcel,
  onOpenPdfReport,
  uploadSectionRef,
  isUploadCollapsedInitially = false,
}: InvoicesPageProps) {
  const t = TRANSLATIONS[language];
  const [isUploadOpen, setIsUploadOpen] = useState(!isUploadCollapsedInitially);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header Component */}
      <PageHeader
        title={language === "ka" ? "ინვოისები და დოკუმენტები" : "Invoices & Documents"}
        subtitle={language === "ka" ? "მართეთ, გაფილტრეთ და ექსპორტი გაუკეთეთ თქვენს ფინანსურ დოკუმენტებს" : "Manage, filter and export your company financial records"}
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800">
            {workspaceInvoices.length} {language === "ka" ? "დოკუმენტი" : "documents"}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAddManual}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === "ka" ? "ხელით დამატება" : "Add Manually"}</span>
            </button>
          </div>
        }
      />

      {/* Upload Section (Collapsible / Accordion) */}
      <div 
        ref={uploadSectionRef}
        id="upload-zone-container" 
        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-sm transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {language === "ka" ? "ინვოისებისა და ჩეკების ატვირთვა" : "Upload Invoices & Receipts"}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {language === "ka"
                  ? "მხარდაჭერილია PDF, PNG, JPG ფაილები (ავტომატური AI ანალიზი)"
                  : "Supports PDF, PNG, JPG (Automatic AI OCR extraction)"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsUploadOpen(!isUploadOpen)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isUploadOpen ? (language === "ka" ? "ჩაკეცვა" : "Collapse") : (language === "ka" ? "გახსნა" : "Expand")}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isUploadOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {isUploadOpen && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fadeIn">
            {canUpload ? (
              <InvoiceUploadZone 
                language={language}
                onUpload={onUpload}
                isAnalyzing={isAnalyzing}
              />
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center space-y-3.5 animate-fadeIn">
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 text-rose-500 rounded-2xl border border-rose-100 dark:border-rose-900">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-700 dark:text-slate-200">
                    {language === "ka" ? "დოკუმენტების ატვირთვა შეზღუდულია" : "Document Uploading Restricted"}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold max-w-sm mt-1 mx-auto leading-normal">
                    {language === "ka" 
                      ? "მფლობელმა ამ როლისთვის გამორთო ინვოისების/ჩეკების ატვირთვის ფუნქცია." 
                      : "The owner has locked document upload privileges for this role."}
                  </p>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 backdrop-blur-sm text-amber-900 dark:text-amber-200 rounded-2xl border border-amber-200/50 dark:border-amber-800 text-sm flex gap-3 shadow-sm animate-fadeIn">
                <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="space-y-1">
                  <p className="font-semibold">{t.errorMsg}</p>
                  <p className="text-amber-800 dark:text-amber-300">{uploadError}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div id="invoices-table-section" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden flex flex-col">
        {/* Controls Bar */}
        <div className="p-5 border-b border-slate-200/40 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-850/40 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          {/* Left: Search & Filters */}
          <div className="flex flex-1 flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="search-input"
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200/60 dark:border-slate-700 rounded-xl bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-900 dark:text-white"
              />
            </div>

            {/* Category Dropdown */}
            <div className="relative">
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full sm:w-48 pl-3 pr-8 py-2 border border-slate-200/60 dark:border-slate-700 rounded-xl bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 dark:text-white"
              >
                <option value="all">📁 {t.allCategories}</option>
                {Object.entries(CATEGORY_LABELS).map(([key, lbl]) => (
                  <option key={key} value={key}>
                    {language === "ka" ? lbl.ka : lbl.en}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Date Filter Dropdown */}
            <div className="relative">
              <select
                id="date-filter"
                value={dateRangeFilter}
                onChange={(e) => onDateRangeChange(e.target.value as any)}
                className="w-full sm:w-40 pl-3 pr-8 py-2 border border-slate-200/60 dark:border-slate-700 rounded-xl bg-white/60 dark:bg-slate-800/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer text-slate-900 dark:text-white"
              >
                <option value="all">📅 {t.allTime}</option>
                <option value="this_month">📅 {t.thisMonth}</option>
                <option value="last_30">📅 {t.last30Days}</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex gap-2.5 shrink-0">
            {/* Create Custom Invoice Button */}
            <button
              type="button"
              onClick={() => canUpload && onAddManual()}
              disabled={!canUpload}
              className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm font-bold shadow-sm transition-all duration-200 ${
                canUpload
                  ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:shadow-md"
                  : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              }`}
              title={canUpload 
                ? (language === "ka" ? "ინვოისის ხელით შექმნა" : "Create Manual Invoice")
                : (language === "ka" ? "შექმნა შეზღუდულია" : "Creation locked")
              }
            >
              {canUpload ? (
                <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400" />
              )}
              <span className="hidden sm:inline">{language === "ka" ? "ინვოისის შექმნა" : "Create Invoice"}</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                id="export-dropdown-btn"
                onClick={onToggleExportDropdown}
                disabled={filteredInvoices.length === 0}
                className={`inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-200 cursor-pointer ${
                  filteredInvoices.length === 0 ? "opacity-50 cursor-not-allowed hover:bg-slate-900" : "hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
                }`}
              >
                <Download className="w-4 h-4" />
                <span>{t.exportMenu}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showExportDropdown ? "rotate-180" : ""}`} />
              </button>

              {showExportDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white/95 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 animate-fadeIn">
                  <button
                    onClick={() => {
                      onExportCsv();
                      onCloseExportDropdown();
                    }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-extrabold uppercase">CSV</span>
                    {t.exportCsv}
                  </button>
                  <button
                    onClick={() => {
                      onExportExcel();
                      onCloseExportDropdown();
                    }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50/80 dark:hover:bg-slate-800 hover:text-emerald-700 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <span className="text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-extrabold uppercase">XLS</span>
                    {t.exportExcel}
                  </button>
                  <button
                    onClick={() => {
                      onOpenPdfReport();
                      onCloseExportDropdown();
                    }}
                    className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-rose-50/80 dark:hover:bg-slate-800 hover:text-rose-700 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <span className="text-xs bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-extrabold uppercase">PDF</span>
                    {language === "ka" ? "ბრენდირებული PDF რეპორტი" : "Branded PDF Report"}
                  </button>
                </div>
              )}
            </div>

            {/* Clear all */}
            {workspaceInvoices.length > 0 && canDelete && (
              <button
                onClick={onClearAll}
                className="p-2 text-red-500 hover:bg-red-50/80 dark:hover:bg-red-950/40 rounded-xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900 cursor-pointer"
                title={t.clearAll}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800 select-none">
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-indigo-600 transition-all rounded-tl-2xl group"
                  onClick={() => onSort("vendor")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t.vendor}</span>
                    <div className="flex flex-col shrink-0">
                      <ChevronUp className={`w-3 h-3 -mb-1 transition-colors ${sortColumn === "vendor" && sortDirection === "asc" ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-400"}`} />
                      <ChevronDown className={`w-3 h-3 transition-colors ${sortColumn === "vendor" && sortDirection === "desc" ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-400"}`} />
                    </div>
                  </div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-indigo-600 transition-all group"
                  onClick={() => onSort("date")}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t.date}</span>
                    <div className="flex flex-col shrink-0">
                      <ChevronUp className={`w-3 h-3 -mb-1 transition-colors ${sortColumn === "date" && sortDirection === "asc" ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-400"}`} />
                      <ChevronDown className={`w-3 h-3 transition-colors ${sortColumn === "date" && sortDirection === "desc" ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-400"}`} />
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4">{t.category}</th>
                <th className="px-6 py-4">{t.items}</th>
                <th 
                  className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-indigo-600 transition-all group"
                  onClick={() => onSort("amount")}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>{t.total}</span>
                    <div className="flex flex-col shrink-0">
                      <ChevronUp className={`w-3 h-3 -mb-1 transition-colors ${sortColumn === "amount" && sortDirection === "asc" ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-400"}`} />
                      <ChevronDown className={`w-3 h-3 transition-colors ${sortColumn === "amount" && sortDirection === "desc" ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-400"}`} />
                    </div>
                  </div>
                </th>
                <th className="px-6 py-4 text-center w-32">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoadingInvoices ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="animate-pulse border-b border-slate-100 dark:border-slate-800">
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-200/80 dark:bg-slate-700 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-200/80 dark:bg-slate-700 rounded w-1/3"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 bg-slate-200/80 dark:bg-slate-700 rounded-lg w-20"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-200/80 dark:bg-slate-700 rounded w-1/2"></div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="h-4 bg-slate-200/80 dark:bg-slate-700 rounded w-1/3 ml-auto"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-8 bg-slate-200/80 dark:bg-slate-700 rounded-lg w-16 mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredInvoices.map((inv) => {
                  const categoryLabel = CATEGORY_LABELS[inv.category] || CATEGORY_LABELS.other;
                  const categoryColor = CATEGORY_COLORS[inv.category] || CATEGORY_COLORS.other;

                  return (
                    <tr key={inv.id} className="hover:bg-indigo-50/20 dark:hover:bg-slate-800/40 hover:shadow-xs border-l-2 border-l-transparent hover:border-l-indigo-500 transition-all duration-200">
                      {/* Vendor & file */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{inv.vendor}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[180px] font-medium" title={inv.fileName}>
                          📄 {inv.fileName}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">
                        {inv.date}
                      </td>

                      {/* Category Badge */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${categoryColor}`}>
                            {language === "ka" ? categoryLabel.ka : categoryLabel.en}
                          </span>
                          {isInvoiceOverBudget(inv.category, inv.currency) && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-extrabold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200/50 dark:border-red-900 rounded-md px-1.5 py-0.5 uppercase tracking-wider animate-pulse">
                              <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                              <span>{language === "ka" ? "ლიმიტს გარეთ" : "Over Budget"}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-6 py-4 max-w-[240px]">
                        <div className="text-slate-600 dark:text-slate-300 truncate font-medium" title={inv.items.map((i) => i.name).join(", ")}>
                          {inv.items.length > 0 
                            ? inv.items.map((i) => i.name).join(", ") 
                            : "-"}
                        </div>
                        {inv.items.length > 1 && (
                          <span className="inline-flex mt-1 text-xs font-bold bg-white/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-lg border border-slate-200/40 dark:border-slate-700">
                            +{inv.items.length - 1} {language === "ka" ? "სხვა" : "more"}
                          </span>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {inv.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-xs font-semibold text-slate-400">{inv.currency}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onSelectInvoice(inv)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700 transition-all cursor-pointer"
                            title={t.viewDocument}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => onDeleteInvoice(inv.id)}
                              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-red-100 dark:hover:border-red-900 transition-all cursor-pointer"
                              title={t.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Empty State */}
              {!isLoadingInvoices && filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto">
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4 shadow-sm border border-indigo-100/40 dark:border-indigo-900">
                        <FileText className="w-10 h-10" />
                      </div>
                      <h3 className="font-extrabold text-slate-950 dark:text-white text-lg tracking-tight">
                        {workspaceInvoices.length === 0 
                          ? t.noData 
                          : (language === "ka" ? "ფილტრის შესაბამისი ინვოისები არ მოიძებნა." : "No invoices matched your filters.")}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs font-medium leading-relaxed">
                        {workspaceInvoices.length === 0 
                          ? (language === "ka" 
                              ? "ატვირთეთ ინვოისის PDF, JPG, ან PNG დოკუმენტი AI ანალიზისთვის, ან დაამატეთ ხელით."
                              : "Upload PDF, JPG, or PNG invoice documents to automatically parse details, or add one manually.")
                          : (language === "ka" 
                              ? "შეცვალეთ საძიებო სიტყვა, თარიღის დიაპაზონი ან კატეგორიის ფილტრი სხვა მონაცემების სანახავად."
                              : "Adjust your search phrase, date range, or category filter to view other entries.")}
                      </p>
                      {workspaceInvoices.length === 0 && (
                        <div className="mt-6 flex flex-wrap gap-3 justify-center">
                          <button
                            onClick={() => setIsUploadOpen(true)}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-100 dark:shadow-none cursor-pointer"
                          >
                            {language === "ka" ? "ატვირთე პირველი დოკუმენტი" : "Upload First Document"}
                          </button>
                          {canUpload && (
                            <button
                              onClick={onAddManual}
                              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                            >
                              {language === "ka" ? "მექანიკური შეყვანა" : "Manual Entry"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="block md:hidden p-4 space-y-4">
          {isLoadingInvoices ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700 rounded-2xl p-4 space-y-3 animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-750 rounded w-2/3"></div>
              </div>
            ))
          ) : filteredInvoices.length === 0 ? (
            <div className="py-12 text-center">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-2xl mx-auto w-fit mb-4 shadow-sm border border-indigo-100/40 dark:border-indigo-900">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-slate-950 dark:text-white text-base tracking-tight">
                {workspaceInvoices.length === 0 
                  ? t.noData 
                  : (language === "ka" ? "ფილტრის შესაბამისი ინვოისები არ მოიძებნა." : "No invoices matched filters.")}
              </h3>
            </div>
          ) : (
            filteredInvoices.map((inv) => {
              const categoryLabel = CATEGORY_LABELS[inv.category] || CATEGORY_LABELS.other;
              const categoryColor = CATEGORY_COLORS[inv.category] || CATEGORY_COLORS.other;

              return (
                <div
                  key={inv.id}
                  className="bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer active:scale-[0.99]"
                  onClick={() => onSelectInvoice(inv)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight truncate max-w-[160px]">
                        {inv.vendor || "Unknown"}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[160px]">
                        📄 {inv.fileName}
                      </p>
                    </div>
                    <div className="text-right whitespace-nowrap shrink-0">
                      <span className="font-extrabold text-slate-950 dark:text-white text-sm">
                        {inv.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{inv.currency}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100/60 dark:border-slate-700/60">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider border ${categoryColor}`}>
                        {language === "ka" ? categoryLabel.ka : categoryLabel.en}
                      </span>
                      {isInvoiceOverBudget(inv.category, inv.currency) && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-extrabold text-red-600 bg-red-50 border border-red-200/50 rounded-md px-1.5 py-0.5 uppercase tracking-wider animate-pulse">
                          <AlertCircle className="w-2 h-2 shrink-0" />
                          <span>{language === "ka" ? "ლიმიტს გარეთ" : "Over Budget"}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-400">{inv.date}</span>
                  </div>

                  {inv.items && inv.items.length > 0 && (
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850 rounded-xl p-2 max-w-full">
                      <span className="font-bold text-slate-400 block mb-0.5 text-xs uppercase tracking-widest">
                        {language === "ka" ? "პროდუქტები" : "Purchased items"}
                      </span>
                      <div className="truncate text-slate-600 dark:text-slate-300">
                        {inv.items.map((i) => i.name).join(", ")}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectInvoice(inv);
                      }}
                      className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{language === "ka" ? "დეტალები" : "Details"}</span>
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteInvoice(inv.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
