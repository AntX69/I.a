import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Circle, 
  X, 
  Upload, 
  Sliders, 
  UserPlus, 
  Download, 
  Sparkles, 
  ChevronRight, 
  PartyPopper,
  Check,
  Building,
  ArrowRight
} from "lucide-react";
import { Language } from "../types";

export interface OnboardingChecklistProps {
  language: Language;
  invoicesCount: number;
  hasCustomBudget: boolean;
  teamMembersCount: number;
  hasExported: boolean;
  isMultiPlan: boolean;
  userIdOrCompany: string;
  onNavigateToUpload: () => void;
  onNavigateToBudget: () => void;
  onNavigateToTeam: () => void;
  onNavigateToExport: () => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  language,
  invoicesCount,
  hasCustomBudget,
  teamMembersCount,
  hasExported,
  isMultiPlan,
  userIdOrCompany,
  onNavigateToUpload,
  onNavigateToBudget,
  onNavigateToTeam,
  onNavigateToExport,
}) => {
  const storageKeyDismissed = `antx_onboarding_dismissed_${userIdOrCompany || "default"}`;
  const storageKeyCompleted = `antx_onboarding_completed_${userIdOrCompany || "default"}`;

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem(storageKeyDismissed) === "true";
  });

  const [isPermanentlyCompleted, setIsPermanentlyCompleted] = useState<boolean>(() => {
    return localStorage.getItem(storageKeyCompleted) === "true";
  });

  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [isHidingAfterCelebration, setIsHidingAfterCelebration] = useState<boolean>(false);

  // Define steps
  // 1. Account created (always done)
  // 2. Upload first invoice (invoicesCount > 0)
  // 3. Set budget limit (hasCustomBudget)
  // 4. Invite team member (teamMembersCount >= 2) - ONLY on Multi plan
  // 5. Try export (hasExported)

  interface StepItem {
    id: string;
    titleKa: string;
    titleEn: string;
    descKa: string;
    descEn: string;
    isCompleted: boolean;
    icon: React.ReactNode;
    onClick: () => void;
  }

  const steps: StepItem[] = [
    {
      id: "account",
      titleKa: "ანგარიში შექმნილია",
      titleEn: "Account created",
      descKa: "თქვენი კომპანიის პროფილი აქტიურია",
      descEn: "Your company workspace is active and ready",
      isCompleted: true,
      icon: <Building className="w-4 h-4 text-emerald-500" />,
      onClick: () => {},
    },
    {
      id: "upload",
      titleKa: "ატვირთე პირველი ინვოისი",
      titleEn: "Upload first invoice",
      descKa: "ატვირთეთ PDF ან სურათი AI ანალიზისთვის",
      descEn: "Upload a PDF or receipt for automatic AI parsing",
      isCompleted: invoicesCount > 0,
      icon: <Upload className="w-4 h-4 text-indigo-500" />,
      onClick: onNavigateToUpload,
    },
    {
      id: "budget",
      titleKa: "დააყენე ბიუჯეტის ლიმიტი",
      titleEn: "Set budget limit",
      descKa: "დააწესეთ ხარჯვის ლიმიტები კატეგორიების მიხედვით",
      descEn: "Configure spending limits for expense categories",
      isCompleted: hasCustomBudget,
      icon: <Sliders className="w-4 h-4 text-amber-500" />,
      onClick: onNavigateToBudget,
    },
    ...(isMultiPlan
      ? [
          {
            id: "team",
            titleKa: "მოიწვიე თანამშრომელი",
            titleEn: "Invite team member",
            descKa: "დაამატეთ კოლეგები და გაანაწილეთ უფლებები",
            descEn: "Add colleagues and configure role access",
            isCompleted: teamMembersCount >= 2,
            icon: <UserPlus className="w-4 h-4 text-purple-500" />,
            onClick: onNavigateToTeam,
          },
        ]
      : []),
    {
      id: "export",
      titleKa: "სცადე ექსპორტი",
      titleEn: "Try export",
      descKa: "ჩამოტვირთეთ რეესტრი CSV, Excel ან PDF ფორმატში",
      descEn: "Export your ledger to CSV, Excel, or PDF report",
      isCompleted: hasExported,
      icon: <Download className="w-4 h-4 text-blue-500" />,
      onClick: onNavigateToExport,
    },
  ];

  const totalSteps = steps.length;
  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);
  const allCompleted = completedCount === totalSteps;

  // Handle celebration when all steps are completed
  useEffect(() => {
    if (allCompleted && !isPermanentlyCompleted && !isDismissed) {
      setShowCelebration(true);
      const timer = setTimeout(() => {
        setIsHidingAfterCelebration(true);
        localStorage.setItem(storageKeyCompleted, "true");
        setTimeout(() => {
          setIsPermanentlyCompleted(true);
          setShowCelebration(false);
        }, 500);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [allCompleted, isPermanentlyCompleted, isDismissed, storageKeyCompleted]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(storageKeyDismissed, "true");
  };

  // If dismissed or permanently completed (and not currently celebrating), don't render
  if ((isDismissed || isPermanentlyCompleted) && !showCelebration) {
    return null;
  }

  // Celebration View
  if (showCelebration) {
    return (
      <div 
        className={`w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-3xl p-6 shadow-xl shadow-emerald-500/20 border border-emerald-400/30 transition-all duration-500 transform ${
          isHidingAfterCelebration ? "opacity-0 scale-95 -translate-y-2" : "opacity-100 scale-100 translate-y-0"
        } animate-fadeIn`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <PartyPopper className="w-7 h-7 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                <span>{language === "ka" ? "🎉 მზად ხარ!" : "🎉 You're All Set!"}</span>
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-1">
                {language === "ka"
                  ? "ყველა საწყისი ნაბიჯი წარმატებით დასრულდა. თქვენი სისტემა სრულად გამართულია!"
                  : "All onboarding steps are completed. Your financial dashboard is fully ready to go!"}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black">
            <Check className="w-4 h-4 text-white" />
            <span>100% {language === "ka" ? "დასრულებული" : "Completed"}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900/90 border border-indigo-100/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl shadow-indigo-500/5 dark:shadow-none backdrop-blur-md relative overflow-hidden animate-fadeIn transition-all duration-300">
      {/* Background Accent Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Section */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              <Sparkles className="w-3 h-3" />
              <span>{language === "ka" ? "პირველი ნაბიჯები" : "Onboarding"}</span>
            </span>
            <span className="text-xs font-black text-slate-500 dark:text-slate-400">
              {completedCount}/{totalSteps} {language === "ka" ? "ნაბიჯი დასრულებულია" : "steps completed"}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {language === "ka" ? "დაიწყე მუშაობა" : "Get Started with Your Dashboard"}
          </h3>
        </div>

        {/* Close / Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          title={language === "ka" ? "დახურვა" : "Dismiss"}
          aria-label={language === "ka" ? "დახურვა" : "Dismiss"}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mb-5">
        <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <span>{language === "ka" ? "პროგრესი" : "Overall Progress"}</span>
          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500 rounded-full transition-all duration-500 ease-out shadow-xs"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Checklist Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {steps.map((step) => {
          const isDone = step.isCompleted;

          return (
            <div
              key={step.id}
              onClick={() => {
                if (!isDone) {
                  step.onClick();
                }
              }}
              className={`group text-left p-3.5 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between ${
                isDone
                  ? "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800/80 cursor-default"
                  : "bg-white dark:bg-slate-850 border-slate-200/90 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md hover:shadow-indigo-500/5 hover:-translate-y-0.5 cursor-pointer"
              }`}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                      <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white dark:fill-emerald-400 dark:text-slate-900" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-indigo-500 flex items-center justify-center transition-colors">
                      <Circle className="w-2.5 h-2.5 text-transparent group-hover:text-indigo-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="shrink-0">{step.icon}</span>
                    <h4
                      className={`text-xs font-black truncate ${
                        isDone
                          ? "text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600"
                          : "text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                      }`}
                    >
                      {language === "ka" ? step.titleKa : step.titleEn}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium line-clamp-2 mt-1 leading-snug">
                    {language === "ka" ? step.descKa : step.descEn}
                  </p>
                </div>
              </div>

              {/* Action / Status Link */}
              <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-bold">
                {isDone ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-extrabold">
                    <Check className="w-3 h-3" />
                    <span>{language === "ka" ? "შესრულებულია" : "Done"}</span>
                  </span>
                ) : (
                  <span className="text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 flex items-center gap-1">
                    <span>{language === "ka" ? "შესრულება" : "Complete step"}</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingChecklist;
