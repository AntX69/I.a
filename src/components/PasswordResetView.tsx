import React, { useState, useEffect } from "react";
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertCircle, Lock, ShieldCheck, Sparkles, Loader2, Copy, Check } from "lucide-react";
import { apiFetch } from "../lib/api";

interface PasswordResetViewProps {
  language: "ka" | "en";
  initialToken?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  showToast?: (msg: string, type?: "success" | "error") => void;
}

export const PasswordResetView: React.FC<PasswordResetViewProps> = ({
  language,
  initialToken,
  onSuccess,
  onCancel,
  showToast
}) => {
  const [step, setStep] = useState<"request" | "reset">(initialToken ? "reset" : "request");
  const [token, setToken] = useState<string>(initialToken || "");
  
  // Request step states
  const [requestEmail, setRequestEmail] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSuccessInfo, setRequestSuccessInfo] = useState<{
    token: string;
    resetLink: string;
    expiresAt: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reset step states
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [tokenEmail, setTokenEmail] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);

  // Verify token on reset step
  useEffect(() => {
    if (step === "reset" && token) {
      setIsVerifyingToken(true);
      setTokenError(null);
      apiFetch<{ valid: boolean; email: string }>(`/api/password-reset/${token}`)
        .then((res) => {
          if (res.valid) {
            setTokenEmail(res.email);
          } else {
            setTokenError(language === "ka" ? "აღდგენის ბმული არასწორია" : "Invalid recovery token");
          }
        })
        .catch((err: any) => {
          setTokenError(err.message || (language === "ka" ? "აღდგენის ბმული არასწორია ან ვადაგასულია" : "Token is invalid or expired"));
        })
        .finally(() => {
          setIsVerifyingToken(false);
        });
    }
  }, [step, token, language]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestEmail.trim()) return;

    setIsRequesting(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        message: string;
        token: string;
        resetLink: string;
        expiresAt: string;
      }>("/api/password-reset/request", {
        method: "POST",
        body: JSON.stringify({ email: requestEmail.trim() }),
      });

      setRequestSuccessInfo(res);
      if (showToast) {
        showToast(
          language === "ka"
            ? "პაროლის აღდგენის ბმული წარმატებით მომზადდა!"
            : "Password reset link generated successfully!",
          "success"
        );
      }
    } catch (err: any) {
      if (showToast) {
        showToast(
          err.message ||
            (language === "ka" ? "მოთხოვნის გაგზავნა ვერ მოხერხდა" : "Failed to request password reset"),
          "error"
        );
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      if (showToast) {
        showToast(
          language === "ka" ? "პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო" : "Password must be at least 8 characters",
          "error"
        );
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      if (showToast) {
        showToast(
          language === "ka" ? "პაროლები ერთმანეთს არ ემთხვევა" : "Passwords do not match",
          "error"
        );
      }
      return;
    }

    setIsSubmittingReset(true);
    try {
      await apiFetch(`/api/password-reset/${token}`, {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      });

      setResetCompleted(true);
      if (showToast) {
        showToast(
          language === "ka" ? "პაროლი წარმატებით შეიცვალა!" : "Password reset successfully!",
          "success"
        );
      }
    } catch (err: any) {
      if (showToast) {
        showToast(
          err.message || (language === "ka" ? "პაროლის შეცვლა ვერ მოხერხდა" : "Failed to reset password"),
          "error"
        );
      }
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const handleCopyLink = () => {
    if (!requestSuccessInfo) return;
    const fullUrl = `${window.location.origin}${requestSuccessInfo.resetLink}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn relative">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === "ka" ? "შესვლაზე დაბრუნება" : "Back to Login"}</span>
          </button>
          
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <KeyRound className="w-4 h-4" />
          </div>
        </div>

        {/* --- STEP 1: REQUEST RESET --- */}
        {step === "request" && !requestSuccessInfo && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === "ka" ? "პაროლის აღდგენა" : "Reset Password"}
              </h2>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                {language === "ka"
                  ? "შეიყვანეთ თქვენი რეგისტრირებული ელ. ფოსტის მისამართი და ჩვენ მოგაწვდით პაროლის აღდგენის ბმულს."
                  : "Enter your registered email address and we'll generate a secure link to reset your password."}
              </p>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {language === "ka" ? "ელ. ფოსტა" : "Email Address"}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isRequesting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 dark:shadow-none hover:shadow-indigo-200 cursor-pointer flex items-center justify-center gap-2"
              >
                {isRequesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === "ka" ? "იგზავნება..." : "Sending request..."}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{language === "ka" ? "აღდგენის ბმულის მიღება" : "Send Recovery Link"}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* --- REQUEST SUCCESS RESULT --- */}
        {step === "request" && requestSuccessInfo && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {language === "ka" ? "ბმული მომზადებულია!" : "Reset Link Ready!"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === "ka"
                  ? "პაროლის აღდგენის ბმული გენერირებულია და მოქმედებს 1 საათის განმავლობაში."
                  : "Password recovery link has been generated and is valid for 1 hour."}
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>{language === "ka" ? "აღდგენის ტოკენი:" : "Token:"}</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{requestSuccessInfo.token}</span>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>{language === "ka" ? "ბმული დაკოპირდა!" : "Link Copied!"}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>{language === "ka" ? "ბმულის კოპირება" : "Copy Reset Link"}</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setToken(requestSuccessInfo.token);
                setStep("reset");
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{language === "ka" ? "პაროლის შეცვლაზე გადასვლა" : "Proceed to Reset Form"}</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}

        {/* --- STEP 2: RESET PASSWORD FORM --- */}
        {step === "reset" && (
          <div className="space-y-6">
            {resetCompleted ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {language === "ka" ? "პაროლი წარმატებით შეიცვალა!" : "Password Updated!"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {language === "ka"
                      ? "ახლა შეგიძლიათ გაიაროთ ავტორიზაცია თქვენი ახალი პაროლით."
                      : "You can now log in to your account with your new credentials."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onSuccess}
                  className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-100"
                >
                  {language === "ka" ? "სისტემაში შესვლა" : "Go to Login"}
                </button>
              </div>
            ) : isVerifyingToken ? (
              <div className="py-12 text-center text-slate-400 animate-pulse space-y-3">
                <Loader2 className="w-8 h-8 mx-auto text-indigo-500 animate-spin" />
                <p className="text-xs font-bold">{language === "ka" ? "მოწმდება ტოკენი..." : "Verifying recovery token..."}</p>
              </div>
            ) : tokenError ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {language === "ka" ? "შეცდომა" : "Invalid Token"}
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    {tokenError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRequestSuccessInfo(null);
                    setStep("request");
                  }}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  {language === "ka" ? "ახალი ბმულის მოთხოვნა" : "Request a New Link"}
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {language === "ka" ? "ახალი პაროლის დაყენება" : "Set New Password"}
                  </h2>
                  {tokenEmail && (
                    <p className="text-xs text-slate-400 font-medium">
                      {language === "ka" ? `ანგარიში: ${tokenEmail}` : `Account: ${tokenEmail}`}
                    </p>
                  )}
                </div>

                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === "ka" ? "ახალი პაროლი (მინიმუმ 8 სიმბოლო)" : "New Password (min 8 characters)"}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === "ka" ? "გაიმეორეთ ახალი პაროლი" : "Confirm New Password"}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReset}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 hover:shadow-indigo-200 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmittingReset ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{language === "ka" ? "ინახება..." : "Saving password..."}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{language === "ka" ? "პაროლის შეცვლა" : "Update Password"}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
