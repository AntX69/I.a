import React from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-slideUp ${
            toast.type === "success"
              ? "bg-emerald-50/90 border-emerald-200/60 text-emerald-800"
              : "bg-rose-50/90 border-rose-200/60 text-rose-800"
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
          </div>
          
          <div className="flex-1 text-xs font-semibold leading-relaxed">
            {toast.message}
          </div>

          <button
            onClick={() => onRemove(toast.id)}
            className="shrink-0 p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
