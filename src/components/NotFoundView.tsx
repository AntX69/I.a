import React from "react";
import { AlertTriangle, Home, Sparkles } from "lucide-react";
import { Language } from "../types";

interface NotFoundViewProps {
  language: Language;
  onGoHome: () => void;
}

export default function NotFoundView({ language, onGoHome }: NotFoundViewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-lg mx-auto animate-scaleUp">
      {/* Visual illustration of 404 */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl scale-125 animate-pulse" />
        <div className="relative p-6 bg-indigo-50 rounded-full border border-indigo-100 text-indigo-600 shadow-xl shadow-indigo-100/30">
          <AlertTriangle className="w-16 h-16" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white rounded-full p-2 border-4 border-white shadow-lg">
          <span className="text-xs font-black px-1">404</span>
        </div>
      </div>

      <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
        {language === "ka" ? "გვერდი არ მოიძებნა" : "Page Not Found"}
      </h1>
      
      <p className="text-slate-500 text-sm leading-relaxed mb-8">
        {language === "ka"
          ? "მოთხოვნილი გვერდი ან რესურსი არ არსებობს ან დროებით მიუწვდომელია. გთხოვთ გადახვიდეთ მთავარ გვერდზე."
          : "The path or workspace resource you are trying to reach doesn't exist or has moved. Let's get you back on track."}
      </p>

      <button
        onClick={onGoHome}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 cursor-pointer flex items-center justify-center gap-2"
      >
        <Home className="w-4 h-4" />
        <span>{language === "ka" ? "მთავარ გვერდზე დაბრუნება" : "Return to Dashboard"}</span>
      </button>
    </div>
  );
}
