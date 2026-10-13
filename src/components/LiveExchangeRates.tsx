import React, { useState, useEffect } from "react";
import { ArrowRightLeft, Check, Edit2 } from "lucide-react";
import { Language } from "../types";

interface LiveExchangeRatesProps {
  language: Language;
  onRatesChanged?: (rates: { USD: number; EUR: number; GEL: number }) => void;
}

const DEFAULT_RATES = { USD: 2.715, EUR: 2.945, GEL: 1.0 };

export default function LiveExchangeRates({
  language,
  onRatesChanged,
}: LiveExchangeRatesProps) {
  const [rates, setRates] = useState(() => {
    try {
      const saved = localStorage.getItem("antx_reference_exchange_rates");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_RATES;
  });

  const [lastManuallySet, setLastManuallySet] = useState<string>(() => {
    try {
      return localStorage.getItem("antx_reference_exchange_rates_date") || "";
    } catch {
      return "";
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempRates, setTempRates] = useState({
    USD: rates.USD.toString(),
    EUR: rates.EUR.toString(),
  });

  const handleSaveOverrides = () => {
    const usdVal = parseFloat(tempRates.USD) || DEFAULT_RATES.USD;
    const eurVal = parseFloat(tempRates.EUR) || DEFAULT_RATES.EUR;
    const newRates = { USD: usdVal, EUR: eurVal, GEL: 1.0 };
    setRates(newRates);
    const dateStr = new Date().toLocaleDateString();
    setLastManuallySet(dateStr);
    try {
      localStorage.setItem("antx_reference_exchange_rates", JSON.stringify(newRates));
      localStorage.setItem("antx_reference_exchange_rates_date", dateStr);
    } catch (e) {
      console.error(e);
    }
    setIsEditing(false);
    if (onRatesChanged) {
      onRatesChanged(newRates);
    }
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">
              {language === "ka" ? "საორიენტაციო კურსები" : "Reference rates"}
            </h4>
            {lastManuallySet && (
              <p className="text-xs text-slate-400 font-semibold">
                {language === "ka"
                  ? `ხელით მითითებულია: ${lastManuallySet}`
                  : `Manually set: ${lastManuallySet}`}
              </p>
            )}
          </div>
        </div>

        {/* Currency values list */}
        <div className="flex flex-wrap items-center gap-3">
          {/* USD Rate Card */}
          <div className="bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-xs font-black text-slate-400">USD/GEL</span>
            {isEditing ? (
              <input
                type="number"
                step="0.001"
                value={tempRates.USD}
                onChange={(e) => setTempRates({ ...tempRates, USD: e.target.value })}
                className="w-16 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <span className="text-xs font-black text-slate-800">
                ₾ {rates.USD.toFixed(3)}
              </span>
            )}
          </div>

          {/* EUR Rate Card */}
          <div className="bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-xs font-black text-slate-400">EUR/GEL</span>
            {isEditing ? (
              <input
                type="number"
                step="0.001"
                value={tempRates.EUR}
                onChange={(e) => setTempRates({ ...tempRates, EUR: e.target.value })}
                className="w-16 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <span className="text-xs font-black text-slate-800">
                ₾ {rates.EUR.toFixed(3)}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 pl-2">
            {isEditing ? (
              <button
                onClick={handleSaveOverrides}
                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span className="text-xs uppercase font-bold">
                  {language === "ka" ? "შენახვა" : "Save"}
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setTempRates({
                    USD: rates.USD.toString(),
                    EUR: rates.EUR.toString(),
                  });
                  setIsEditing(true);
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                {language === "ka" ? "კორექტირება" : "Override"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
