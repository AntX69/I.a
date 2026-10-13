import React, { useState, useEffect } from "react";
import { Building2, Mail, Lock, ShieldCheck, ArrowRight, AlertTriangle, CheckCircle2, Sparkles, Clock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Language } from "../types";
import { AuthUser } from "../hooks/useAuth";
import { apiFetch, setSessionToken } from "../lib/api";

interface AcceptInviteViewProps {
  token: string;
  language: Language;
  onAccepted: (user: AuthUser, sessionToken: string) => void;
  onGoHome: () => void;
}

export default function AcceptInviteView({
  token,
  language,
  onAccepted,
  onGoHome
}: AcceptInviteViewProps) {
  const [inviteDetails, setInviteDetails] = useState<{
    email: string;
    name: string;
    position: string;
    companyName: string;
  } | null>(null);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiFetch<{ success: boolean; email: string; name: string; position: string; companyName: string }>(`/api/invites/${token}`)
      .then((res) => {
        if (isMounted) {
          if (res.success) {
            setInviteDetails({
              email: res.email,
              name: res.name,
              position: res.position,
              companyName: res.companyName
            });
          } else {
            setError(language === "ka" ? "არასწორი ან ვადაგასული მოწვევა" : "Invalid or expired invitation");
          }
          setIsLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || (language === "ka" ? "მოწვევის შემოწმება ვერ მოხერხდა" : "Failed to verify invitation"));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setError(language === "ka" ? "პაროლი უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს" : "Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch<{ token: string; user: AuthUser }>(`/api/invites/${token}/accept`, {
        method: "POST",
        body: { password }
      });

      setSessionToken(res.token);
      onAccepted(res.user, res.token);
    } catch (err: any) {
      setError(err.message || (language === "ka" ? "მოწვევის მიღების შეცდომა" : "Failed to accept invite"));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 max-w-lg w-full shadow-2xl relative space-y-6">
        {/* Brand Top Badge */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-indigo-600/30">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {language === "ka" ? "გუნდის მოწვევა" : "Team Invitation"}
          </h2>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 space-y-3 animate-pulse">
            <Clock className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
            <p className="text-xs font-bold">
              {language === "ka" ? "მოწვევის შემოწმება..." : "Verifying invitation link..."}
            </p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-rose-700">{error}</p>
            <button
              onClick={onGoHome}
              className="w-full py-3 bg-slate-900 text-white font-black text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {language === "ka" ? "მთავარზე გადასვლა" : "Go to Homepage"}
            </button>
          </div>
        ) : inviteDetails ? (
          <div className="space-y-6">
            {/* Banner card */}
            <div className="p-5 bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2 text-center">
              <p className="text-xs text-slate-500 font-medium">
                {language === "ka" ? "თქვენ გეპატიჟებიან კომპანიაში:" : "You have been invited to join:"}
              </p>
              <p className="text-lg font-black text-indigo-950">
                {inviteDetails.companyName}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-indigo-200/80 rounded-full text-xs font-bold text-indigo-700 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {language === "ka" ? `პოზიცია: ${inviteDetails.position}` : `Position: ${inviteDetails.position}`}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  {language === "ka" ? "სახელი" : "Name"}
                </label>
                <input
                  type="text"
                  readOnly
                  value={inviteDetails.name}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  {language === "ka" ? "ელფოსტა" : "Email"}
                </label>
                <input
                  type="email"
                  readOnly
                  value={inviteDetails.email}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                    {language === "ka" ? "დააყენეთ თქვენი პაროლი" : "Set Your Password"} *
                  </label>
                  <span className={`text-xs font-medium ${password.length >= 8 ? "text-emerald-500" : "text-slate-400"}`}>
                    {language === "ka" ? "მინიმუმ 8 სიმბოლო" : "Min 8 characters"}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-9 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {error && (
                  <p className="text-xs text-rose-500 font-medium mt-1 animate-fadeIn">
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === "ka" ? "მუშავდება..." : "Processing..."}</span>
                  </>
                ) : (
                  <>
                    <span>{language === "ka" ? "მოწვევის მიღება და შესვლა" : "Accept Invite & Continue"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
