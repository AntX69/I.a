import React, { useState, useEffect } from "react";
import { 
  User, 
  Building, 
  Globe, 
  Shield, 
  CreditCard, 
  ArrowLeft, 
  Check, 
  Lock, 
  Save, 
  Loader2, 
  Key, 
  Smartphone, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  FileText 
} from "lucide-react";
import { Language } from "../types";

interface SettingsMockupProps {
  language: Language;
  userEmail: string;
  companyName: string;
  activePlan: "single" | "multi" | null;
  onGoBack: () => void;
  onUpdateSettings: (name: string, plan: "single" | "multi") => Promise<void>;
}

type TabType = "profile" | "billing" | "security";

export default function SettingsMockup({
  language,
  userEmail,
  companyName,
  activePlan,
  onGoBack,
  onUpdateSettings,
}: SettingsMockupProps) {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  
  // Tab 1: Company Profile States
  const [localCompanyName, setLocalCompanyName] = useState(companyName);
  
  // Tab 2: Billing & Plans States
  const [localPlan, setLocalPlan] = useState<"single" | "multi">(activePlan || "single");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  // Tab 3: Security States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("sk_inv_live_7x8y9z0a1b2c3d4e5f6g7h8i9j");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep local state in sync when props change
  useEffect(() => {
    setLocalCompanyName(companyName);
  }, [companyName]);

  useEffect(() => {
    if (activePlan) {
      setLocalPlan(activePlan);
    }
  }, [activePlan]);

  const handleSave = async () => {
    if (activeTab === "profile" && !localCompanyName.trim()) {
      setError(language === "ka" ? "კომპანიის სახელი არ უნდა იყოს ცარიელი" : "Company name cannot be empty");
      return;
    }

    if (activeTab === "security" && newPassword) {
      if (newPassword !== confirmPassword) {
        setError(language === "ka" ? "ახალი პაროლები არ ემთხვევა ერთმანეთს" : "New passwords do not match");
        return;
      }
      if (newPassword.length < 6) {
        setError(language === "ka" ? "ახალი პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო" : "New password must be at least 6 characters");
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Save changes to backend
      await onUpdateSettings(localCompanyName.trim(), localPlan);
      
      setSaveSuccess(true);
      
      // Clear password fields on successful save
      if (activeTab === "security") {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err?.message || (language === "ka" ? "შენახვა ვერ მოხერხდა" : "Failed to save settings"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleGenerateNewKey = () => {
    const randomChars = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setApiKey(`sk_inv_live_${randomChars}`);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const applyPromo = () => {
    if (promoCode.trim().toLowerCase() === "free") {
      setPromoApplied(true);
      setError(null);
    } else {
      setError(language === "ka" ? "არასწორი პრომო კოდი" : "Invalid promo code");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-8 animate-scaleUp">
      
      {/* Header Back Button */}
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-5">
        <div className="flex items-center space-x-3">
          <button
            onClick={onGoBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200/40 text-slate-500 hover:text-indigo-600"
            title={language === "ka" ? "უკან დაბრუნება" : "Go Back"}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {language === "ka" ? "პარამეტრები" : "Account Settings"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === "ka" ? "თქვენი კომპანიისა და ანგარიშის დეტალები" : "Manage your organization details and user profile"}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
          <Check className="w-3 h-3" />
          {language === "ka" ? "ადმინისტრატორი" : "Administrator Mode"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Navigation Sidebar Layout (UNLOCKED!) */}
        <div className="md:col-span-1 space-y-2">
          <button
            onClick={() => {
              setActiveTab("profile");
              setError(null);
            }}
            className={`w-full text-left p-3 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-indigo-50 border-indigo-100 text-indigo-700"
                : "border-transparent text-slate-500 hover:bg-slate-50"
            }`}
          >
            <User className="w-4 h-4" />
            <span>{language === "ka" ? "კომპანიის პროფილი" : "Company Profile"}</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab("billing");
              setError(null);
            }}
            className={`w-full text-left p-3 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
              activeTab === "billing"
                ? "bg-indigo-50 border-indigo-100 text-indigo-700"
                : "border-transparent text-slate-500 hover:bg-slate-50"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{language === "ka" ? "ტარიფები და ბილინგი" : "Plans & Billing"}</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab("security");
              setError(null);
            }}
            className={`w-full text-left p-3 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all cursor-pointer ${
              activeTab === "security"
                ? "bg-indigo-50 border-indigo-100 text-indigo-700"
                : "border-transparent text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{language === "ka" ? "უსაფრთხოება და გასაღებები" : "Security & Keys"}</span>
          </button>
        </div>

        {/* Setting Fields (Form Content) */}
        <div className="md:col-span-2 bg-white/60 backdrop-blur-md border border-slate-200/50 rounded-3xl p-6 shadow-xl shadow-slate-200/20 space-y-6">
          
          {/* TAB 1: COMPANY PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {language === "ka" ? "ანგარიშის ინფორმაცია" : "Account Information"}
              </h3>
              
              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  {language === "ka" ? "მომხმარებლის ელფოსტა" : "User Email Address"}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={userEmail || "slinchenko021@gmail.com"}
                    disabled
                    className="w-full px-3.5 py-2.5 bg-slate-50/60 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2.5 px-2 py-0.5 bg-slate-200/60 border border-slate-300/30 text-slate-600 rounded-md text-[9px] font-bold">
                    {language === "ka" ? "პირადი" : "Primary"}
                  </span>
                </div>
              </div>

              {/* Company Name field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-500" />
                  {language === "ka" ? "კომპანიის დასახელება" : "Company / Organization Name"}
                </label>
                <input
                  type="text"
                  value={localCompanyName}
                  onChange={(e) => setLocalCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Language Selection display */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  {language === "ka" ? "ძირითადი ინტერფეისის ენა" : "Primary System Language"}
                </label>
                <div className="flex gap-2">
                  <div className={`flex-1 p-3 border rounded-xl flex items-center justify-between text-xs font-bold ${language === "ka" ? "border-indigo-200 bg-indigo-50/20 text-indigo-700" : "border-slate-200 bg-slate-50/40 text-slate-400"}`}>
                    <span>ქართული (KA)</span>
                    {language === "ka" && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <div className={`flex-1 p-3 border rounded-xl flex items-center justify-between text-xs font-bold ${language === "en" ? "border-indigo-200 bg-indigo-50/20 text-indigo-700" : "border-slate-200 bg-slate-50/40 text-slate-400"}`}>
                    <span>English (EN)</span>
                    {language === "en" && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLANS & BILLING */}
          {activeTab === "billing" && (
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {language === "ka" ? "სატარიფო გეგმები და ბილინგი" : "Subscription Plans & Billing"}
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                {/* Single Plan Card */}
                <button
                  type="button"
                  onClick={() => setLocalPlan("single")}
                  className={`p-4 border rounded-2xl text-left transition-all cursor-pointer relative ${
                    localPlan === "single"
                      ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-slate-800">Single Plan</span>
                      <span className="ml-2 text-[10px] text-slate-400 font-bold">$19 / {language === "ka" ? "თვეში" : "mo"}</span>
                    </div>
                    {localPlan === "single" && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-slate-500 text-[11px] font-semibold mt-1 leading-relaxed">
                    {language === "ka" 
                      ? "ერთი სამუშაო სივრცე, ულიმიტო ინვოისები, PDF რეპორტების გენერირება და ძირითადი ანალიტიკა." 
                      : "Single workspace, unlimited invoice uploads, basic PDF reports, and essential vendor insights."}
                  </p>
                </button>

                {/* Multi Plan Card */}
                <button
                  type="button"
                  onClick={() => setLocalPlan("multi")}
                  className={`p-4 border rounded-2xl text-left transition-all cursor-pointer relative ${
                    localPlan === "multi"
                      ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-slate-800">Multi-Entity / Corporate Plan</span>
                      <span className="ml-2 text-[10px] text-indigo-600 font-black">
                        {promoApplied ? "$0" : "$49"} / {language === "ka" ? "თვეში" : "mo"}
                      </span>
                    </div>
                    {localPlan === "multi" && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-slate-500 text-[11px] font-semibold mt-1 leading-relaxed">
                    {language === "ka" 
                      ? "მრავალჯერადი სამუშაო სივრცეები, თანამშრომლების როლების სიმულატორი, ვალუტის კურსების ავტომატური კონვერტაცია და ექსპორტი." 
                      : "Multiple isolated entities/workspaces, team role simulator, real-time exchange rates, and premium reports."}
                  </p>
                  {promoApplied && (
                    <span className="absolute top-4 right-10 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {language === "ka" ? "უფასო" : "Promo Active"}
                    </span>
                  )}
                </button>
              </div>

              {/* Promo Code Fields */}
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-500 block mb-1">
                  {language === "ka" ? "პრომო კოდი" : "Have a Promo Code?"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={language === "ka" ? "მაგ. FREE" : "e.g. FREE"}
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={promoApplied}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={applyPromo}
                    disabled={promoApplied || !promoCode}
                    className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 disabled:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {promoApplied ? (language === "ka" ? "აქტიურია" : "Applied") : (language === "ka" ? "გამოყენება" : "Apply")}
                  </button>
                </div>
              </div>

              {/* Mock Invoice billing logs */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {language === "ka" ? "ბილინგის ისტორია" : "Recent Billing Invoices"}
                </h4>
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                  <div className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-bold text-slate-700">INV-2026-003</p>
                        <p className="text-[10px] text-slate-400">July 01, 2026</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-700">$19.00</span>
                  </div>
                  <div className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-bold text-slate-700">INV-2026-002</p>
                        <p className="text-[10px] text-slate-400">June 01, 2026</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-700">$19.00</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & KEYS */}
          {activeTab === "security" && (
            <div className="space-y-5 animate-fadeIn">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {language === "ka" ? "უსაფრთხოების პარამეტრები" : "Security & API Credentials"}
              </h3>

              {/* Password update layout */}
              <div className="space-y-3 bg-slate-50/40 p-4 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-indigo-500" />
                  {language === "ka" ? "პაროლის შეცვლა" : "Change Account Password"}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      {language === "ka" ? "მიმდინარე პაროლი" : "Current Password"}
                    </label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      {language === "ka" ? "ახალი პაროლი" : "New Password"}
                    </label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">
                      {language === "ka" ? "გაიმეორეთ ახალი პაროლი" : "Confirm New Password"}
                    </label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-[10px] text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>
                      {showPasswords 
                        ? (language === "ka" ? "დამალვა" : "Hide Passwords") 
                        : (language === "ka" ? "ჩვენება" : "Reveal Passwords")}
                    </span>
                  </button>
                </div>
              </div>

              {/* Developer API Keys */}
              <div className="space-y-3 bg-slate-50/40 p-4 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-indigo-500" />
                  {language === "ka" ? "დეველოპერის API გასაღები" : "Developer API Token"}
                </h4>
                <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                  {language === "ka" 
                    ? "გამოიყენეთ ეს ტოკენი ინვოისების ავტომატური ატვირთვისა და ინტეგრაციებისთვის." 
                    : "Use this secure key to automatically upload invoice documents via CLI scripts or external applications."}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 relative">
                    <input
                      type={apiKeyVisible ? "text" : "password"}
                      value={apiKey}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setApiKeyVisible(!apiKeyVisible)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-indigo-600"
                    >
                      {apiKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyApiKey}
                    className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-all shadow-sm cursor-pointer"
                    title={language === "ka" ? "კოპირება" : "Copy key"}
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateNewKey}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                  >
                    {language === "ka" ? "ახალი ტოკენის გენერირება" : "Generate New Token"}
                  </button>
                </div>
              </div>

              {/* Two factor authentication */}
              <div className="p-4 bg-slate-50/40 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-start gap-2.5">
                  <Smartphone className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">
                      {language === "ka" ? "ორფაქტორიანი ავტორიზაცია (2FA)" : "Two-Factor Authentication (2FA)"}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                      {language === "ka" 
                        ? "დამატებითი უსაფრთხოების ფენა თქვენი ანგარიშის დასაცავად." 
                        : "Enhance account safety with dynamic mobile-app verification codes."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className={`w-11 h-6 rounded-full p-1 transition-all duration-200 ease-in-out cursor-pointer ${
                    twoFactorEnabled ? "bg-indigo-600" : "bg-slate-200"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${
                    twoFactorEnabled ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

            </div>
          )}

          {/* Error and Success Messages */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl animate-fadeIn">
              {error}
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4" />
              <span>{language === "ka" ? "ცვლილებები წარმატებით შეინახა!" : "Changes saved successfully!"}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-100 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === "ka" ? "ინახება..." : "Saving..."}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{language === "ka" ? "ცვლილებების შენახვა" : "Save Changes"}</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-[10px] font-bold text-slate-500">
            {language === "ka"
              ? "თქვენ ხართ ამ ორგანიზაციის ადმინისტრატორი. შეგიძლიათ შეცვალოთ კომპანიის სახელი და სატარიფო გეგმა."
              : "You are the Administrator of this organization. You can modify the company name and subscription tier."}
          </div>

        </div>

      </div>

    </div>
  );
}
