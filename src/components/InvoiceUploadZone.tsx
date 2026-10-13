import React, { useState, useRef, useEffect } from "react";
import { Upload, FileText, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Language, TRANSLATIONS } from "../types";

interface InvoiceUploadZoneProps {
  language: Language;
  onUpload: (base64: string, mimeType: string, fileName: string) => void;
  isAnalyzing: boolean;
}

const LOADING_STEPS_KA = [
  "ვკითხულობთ დოკუმენტს...",
  "ვამოწმებთ მონაცემებს...",
  "ვამუშავებთ ცხრილებს...",
  "ვაჯგუფებთ კატეგორიებად...",
  "ვუკავშირდებით Gemini AI-ს..."
];

const LOADING_STEPS_EN = [
  "Reading document...",
  "Verifying data...",
  "Processing tables...",
  "Grouping into categories...",
  "Connecting to Gemini AI..."
];

export default function InvoiceUploadZone({
  language,
  onUpload,
  isAnalyzing,
}: InvoiceUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (!isAnalyzing) {
      setStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % 5);
    }, 1500);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const processFile = (file: File) => {
    setError(null);
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!validTypes.includes(file.type)) {
      setError(
        language === "ka"
          ? "არასწორი ფაილი. გთხოვთ ატვირთოთ PDF, JPG ან PNG ფორმატი."
          : "Invalid file type. Please upload a PDF, JPG, or PNG document."
      );
      return;
    }

    // Limit to 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError(
        language === "ka"
          ? "ფაილის ზომა აღემატება 10MB-ს."
          : "File size exceeds the 10MB limit."
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      onUpload(base64, file.type, file.name);
    };
    reader.onerror = () => {
      setError(
        language === "ka"
          ? "ფაილის წაკითხვის შეცდომა."
          : "Error reading file."
      );
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        id="upload-dropzone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={isAnalyzing ? undefined : triggerFileInput}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
          isAnalyzing
            ? "bg-indigo-50/10 border-indigo-200/50 cursor-not-allowed"
            : isDragActive
            ? "border-indigo-500 bg-indigo-50/50 scale-[1.01] shadow-lg cursor-pointer"
            : "border-slate-200 bg-white/40 backdrop-blur-sm hover:border-indigo-400 hover:bg-white/60 hover:scale-[1.01] hover:shadow-xl cursor-pointer"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf, .png, .jpg, .jpeg"
          onChange={handleFileChange}
          disabled={isAnalyzing}
        />

        {isAnalyzing ? (
          <div className="flex flex-col items-center space-y-5 py-4">
            {/* Custom glowing core spinning Indigo loader */}
            <div className="relative flex items-center justify-center w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
              <div className="absolute inset-1 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
              <div className="absolute inset-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-300">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            
            <div className="space-y-1.5 max-w-sm mx-auto">
              <p className="font-extrabold text-slate-900 text-lg tracking-tight">
                {t.analyzing}
              </p>
              {/* Cycling micro-text */}
              <p className="text-sm font-bold text-indigo-600 min-h-[20px] animate-pulse">
                {language === "ka" ? LOADING_STEPS_KA[stepIndex] : LOADING_STEPS_EN[stepIndex]}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === "ka"
                  ? "სისტემა აანალიზებს დოკუმენტს და ახდენს მონაცემების ავტომატურ კლასიფიკაციას..."
                  : "The system is analyzing the document and auto-classifying the contents..."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 transition-colors">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-base">
                {t.uploadZoneTitle}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t.uploadZoneSub}
              </p>
            </div>
            <button
              id="browse-btn"
              type="button"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                triggerFileInput();
              }}
            >
              {t.selectFiles}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-red-50/70 backdrop-blur-sm text-red-700 text-sm rounded-xl border border-red-200/60 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
