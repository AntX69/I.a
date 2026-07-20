import React, { useState, useRef } from "react";
import { Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import { Language, TRANSLATIONS } from "../types";

interface InvoiceUploadZoneProps {
  language: Language;
  onUpload: (base64: string, mimeType: string, fileName: string) => void;
  isAnalyzing: boolean;
}

export default function InvoiceUploadZone({
  language,
  onUpload,
  isAnalyzing,
}: InvoiceUploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[language];

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
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 ${
          isAnalyzing
            ? "bg-slate-50/40 backdrop-blur-sm border-slate-200 cursor-not-allowed"
            : isDragActive
            ? "border-indigo-500 bg-indigo-50/50 scale-[1.01] cursor-pointer"
            : "border-slate-200 bg-white/40 backdrop-blur-sm hover:border-indigo-400 hover:bg-white/60 cursor-pointer"
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
          <div className="flex flex-col items-center space-y-4 animate-pulse">
            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
              <Loader2 className="w-10 h-10 animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-slate-950 text-lg">
                {t.analyzing}
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm cursor-pointer"
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
