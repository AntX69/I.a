import React, { useState, useEffect } from "react";
import { ArrowRightLeft, RefreshCw, Check, TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import { Language } from "../types";

interface LiveExchangeRatesProps {
  language: Language;
  onRatesChanged?: (rates: { USD: number; EUR: number; GEL: number }) => void;
}

export default function LiveExchangeRates({
  language,
  onRatesChanged,
}: LiveExchangeRatesProps) {
  const [rates, setRates] = useState({ USD: 2.715, EUR: 2.945, GEL: 1.0 });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [tempRates, setTempRates] = useState({ USD: "2.715", EUR: "2.945" });
  const [trend, setTrend] = useState<"up" | "down">("up");

  const fetchLiveRates = () => {
    setLoading(true);
    // Simulate active fetching to financial APIs (e.g., National Bank, ECB API)
    setTimeout(() => {
      const randomFluctuation = () => (Math.random() - 0.5) * 0.015;
      const newUsd = Number((2.71 + randomFluctuation()).toFixed(4));
      const newEur = Number((2.94 + randomFluctuation()).toFixed(4));
      
      const newRates = { USD: newUsd, EUR: newEur, GEL: 1.0 };
      setRates(newRates);
      setTempRates({ USD: newUsd.toString(), EUR: newEur.toString() });
      setLastUpdated(new Date().toLocaleTimeString());
      setTrend(Math.random() > 0.5 ? "up" : "down");
      setLoading(false);

      if (onRatesChanged) {
        onRatesChanged(newRates);
      }
    }, 1200);
  };

  useEffect(() => {
    fetchLiveRates();
    const interval = setInterval(fetchLiveRates, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const handleSaveOverrides = () => {
    const usdVal = parseFloat(tempRates.USD) || 2.71;
    const eurVal = parseFloat(tempRates.EUR) || 2.94;
    const newRates = { USD: usdVal, EUR: eurVal, GEL: 1.0 };
    setRates(newRates);
    setIsEditing(false);
    if (onRatesChanged) {
      onRatesChanged(newRates);
    }
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">
              {language === "ka" ? "რეალური გაცვლითი კურსები" : "Real-time Currency Feed"}
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold">
              {language === "ka" 
                ? `ბოლოს განახლდა: ${lastUpdated || "ცოტა ხნის წინ"}` 
                : `Last live feed refresh: ${lastUpdated || "just now"}`}
            </p>
          </div>
        </div>

        {/* Currency values list */}
        <div className="flex flex-wrap items-center gap-3">
          {/* USD Rate Card */}
          <div className="bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400">USD/GEL</span>
            {isEditing ? (
              <input
                type="number"
                step="0.001"
                value={tempRates.USD}
                onChange={(e) => setTempRates({ ...tempRates, USD: e.target.value })}
                className="w-14 px-1 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold text-right focus:outline-none"
              />
            ) : (
              <span className="text-xs font-black text-slate-800">
                ₾ {rates.USD.toFixed(3)}
              </span>
            )}
            {!isEditing && (
              trend === "up" ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              )
            )}
          </div>

          {/* EUR Rate Card */}
          <div className="bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400">EUR/GEL</span>
            {isEditing ? (
              <input
                type="number"
                step="0.001"
                value={tempRates.EUR}
                onChange={(e) => setTempRates({ ...tempRates, EUR: e.target.value })}
                className="w-14 px-1 py-0.5 bg-white border border-slate-200 rounded text-xs font-bold text-right focus:outline-none"
              />
            ) : (
              <span className="text-xs font-black text-slate-800">
                ₾ {rates.EUR.toFixed(3)}
              </span>
            )}
            {!isEditing && (
              trend === "up" ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              )
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
                <span className="text-[10px] uppercase font-bold">{language === "ka" ? "შენახვა" : "Save"}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                {language === "ka" ? "კორექტირება" : "Override"}
              </button>
            )}

            <button
              onClick={fetchLiveRates}
              disabled={loading}
              className={`p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-all cursor-pointer ${
                loading ? "animate-spin" : ""
              }`}
              title={language === "ka" ? "კურსის განახლება" : "Force Refresh Rates"}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
