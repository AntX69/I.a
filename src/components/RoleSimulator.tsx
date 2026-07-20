import React, { useState } from "react";
import { Users, Shield, Check, Lock, Info, Sliders, ToggleLeft, ToggleRight, Link, Copy } from "lucide-react";
import { Language, UserRole, RolePermissions } from "../types";

interface RoleSimulatorProps {
  language: Language;
  activeRole: UserRole;
  onRoleChanged: (role: UserRole) => void;
  rolePermissions: Record<UserRole, RolePermissions>;
  onPermissionsChanged: (perms: Record<UserRole, RolePermissions>) => void;
}

interface PermissionDef {
  key: keyof RolePermissions;
  nameKa: string;
  nameEn: string;
}

const PERMISSION_DEFS: PermissionDef[] = [
  { key: "canUpload", nameKa: "ინვოისების ატვირთვა და შექმნა", nameEn: "Upload & Create Invoices" },
  { key: "viewAnalytics", nameKa: "ანალიტიკა და სმარტ რჩევები", nameEn: "Analytics & Smart Insights" },
  { key: "manageBudgets", nameKa: "ბიუჯეტების მართვა", nameEn: "Manage Category Budgets" },
  { key: "canDelete", nameKa: "მონაცემების წაშლა / ექსპორტი", nameEn: "Delete & Export Logs" },
];

export default function RoleSimulator({
  language,
  activeRole,
  onRoleChanged,
  rolePermissions,
  onPermissionsChanged,
}: RoleSimulatorProps) {
  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  const rolesMetadata: Record<UserRole, {
    titleKa: string;
    titleEn: string;
    descKa: string;
    descEn: string;
  }> = {
    admin: {
      titleKa: "ადმინისტრატორი / მფლობელი",
      titleEn: "Administrator / CEO (Owner)",
      descKa: "სრული უფლებამოსილება. შეუძლია როლებისა და ნებართვების რედაქტირება.",
      descEn: "Full authority. Has exclusive rights to toggle role permissions dynamically.",
    },
    accountant: {
      titleKa: "ბუღალტერი / ფინანსისტი",
      titleEn: "Accountant / Auditor",
      descKa: "მართავს ხარჯებსა და ანგარიშგებებს. ექვემდებარება მფლობელის ლიმიტებს.",
      descEn: "Manages ledger entries and exports. Subject to owner-defined restrictions.",
    },
    purchaser: {
      titleKa: "შესყიდვების მენეჯერი",
      titleEn: "Purchasing Officer",
      descKa: "მხოლოდ დოკუმენტების ატვირთვა. მფლობელის მიერ დაწესებული მკაცრი ლიმიტები.",
      descEn: "Can only upload new receipts. Highly restricted client views.",
    },
  };

  const handleTogglePermission = (role: UserRole, key: keyof RolePermissions) => {
    // Only allow changing permissions if the active simulated role is Admin/CEO
    if (activeRole !== "admin") return;

    const updated = {
      ...rolePermissions,
      [role]: {
        ...rolePermissions[role],
        [key]: !rolePermissions[role][key],
      },
    };
    onPermissionsChanged(updated);
  };

  const handleCopyLink = (role: string) => {
    try {
      const origin = window.location.origin;
      const path = window.location.pathname;
      const link = `${origin}${path}?role=${role}`;
      navigator.clipboard.writeText(link);
      setCopiedRole(role);
      setTimeout(() => setCopiedRole(null), 2500);
    } catch (e) {
      console.error("Failed to copy link", e);
    }
  };

  const isOwner = activeRole === "admin";

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm mb-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800">
              {language === "ka" ? "თანამშრომლების როლები & წვდომის მართვა" : "Enterprise Roles & Access Management"}
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold">
              {language === "ka" 
                ? "მფლობელის კონტროლი: დააყენეთ ლიმიტები და გაუზიარეთ ჩაკეტილი როლის ლინკი თანამშრომლებს" 
                : "Owner Cockpit: Setup restrictions and share pre-locked direct links with employees"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <span className="text-[10px] font-mono tracking-widest text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase font-bold flex items-center gap-1">
            <Sliders className="w-3 h-3 text-indigo-500" />
            {language === "ka" ? "ინტერაქტიული პანელი" : "Interactive Control"}
          </span>
        </div>
      </div>

      {/* Selector and Permissions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Selector Panel */}
        <div className="md:col-span-1 space-y-2.5">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            {language === "ka" ? "1. აირჩიეთ როლი გამოსაცდელად" : "1. Select role to simulate"}
          </div>
          {Object.entries(rolesMetadata).map(([roleKey, value]) => {
            const isSelected = activeRole === roleKey;
            return (
              <button
                key={roleKey}
                onClick={() => onRoleChanged(roleKey as UserRole)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer group ${
                  isSelected
                    ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "bg-slate-50 hover:bg-slate-100/50 border-slate-100 text-slate-700"
                }`}
              >
                <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                  <div className="text-xs font-black uppercase tracking-wider truncate">
                    {language === "ka" ? value.titleKa : value.titleEn}
                  </div>
                  <p className={`text-[10px] leading-snug line-clamp-2 ${isSelected ? "text-slate-300" : "text-slate-400 group-hover:text-slate-500"}`}>
                    {language === "ka" ? value.descKa : value.descEn}
                  </p>
                </div>
                {isSelected && (
                  <div className="p-1 bg-indigo-600 rounded-lg shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Permissions Display & Management */}
        <div className="md:col-span-2 bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-slate-200/50 gap-2">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-500" />
                {language === "ka" 
                  ? `წვდომის უფლებები: ${rolesMetadata[activeRole].titleKa}` 
                  : `Permissions: ${rolesMetadata[activeRole].titleEn}`}
              </h5>
              
              {isOwner ? (
                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-md uppercase shrink-0">
                  {language === "ka" ? "რედაქტირებადი (მფლობელი)" : "Editable (Owner Mode)"}
                </span>
              ) : (
                <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2 py-0.5 rounded-md uppercase shrink-0 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  {language === "ka" ? "მხოლოდ კითხვადი" : "Read-Only"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PERMISSION_DEFS.map((def) => {
                const isAllowed = rolePermissions[activeRole][def.key];
                
                return (
                  <div 
                    key={def.key} 
                    onClick={() => handleTogglePermission(activeRole, def.key)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 select-none transition-all ${
                      isOwner ? "cursor-pointer hover:border-indigo-400/50 active:scale-[0.98]" : "cursor-default"
                    } ${
                      isAllowed 
                        ? "bg-white border-slate-200/50 text-slate-700 shadow-sm" 
                        : "bg-slate-100/60 border-slate-200/20 text-slate-400"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-extrabold block">
                        {language === "ka" ? def.nameKa : def.nameEn}
                      </span>
                    </div>

                    {/* Interactive Switch or Static Indicator */}
                    {isOwner ? (
                      <button
                        type="button"
                        className="focus:outline-none cursor-pointer"
                        title={language === "ka" ? "შეცვლა" : "Toggle"}
                      >
                        {isAllowed ? (
                          <ToggleRight className="w-6.5 h-6.5 text-indigo-600 transition-colors" />
                        ) : (
                          <ToggleLeft className="w-6.5 h-6.5 text-slate-400 transition-colors" />
                        )}
                      </button>
                    ) : (
                      isAllowed ? (
                        <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="p-1 bg-rose-50 text-rose-500 rounded-lg" title="Locked by Administrator">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-200/60 flex items-center gap-2.5 text-[10px] text-slate-500 font-bold">
            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>
              {isOwner ? (
                language === "ka"
                  ? "მფლობელის რეჟიმი აქტიურია. დააჭირეთ ნებისმიერ ნებართვას, რათა მომენტალურად ჩაურთოთ ან გამოურთოთ წვდომა ამ როლს მთლიან სისტემაში."
                  : "Owner mode active. Click any card to instantly enable/disable that capability for the simulated role across the layout."
              ) : (
                language === "ka"
                  ? "სხვა როლზე უფლებების შესაცვლელად ჯერ დააწკაპუნეთ როლს მარცხნივ, ხოლო ნებართვების შესაცვლელად აირჩიეთ 'ადმინისტრატორი / მფლობელი'."
                  : "To modify this role's access, select the role first, but note you can only toggle settings while simulating the Administrator/Owner."
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Share / Invite Section */}
      <div className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
            <Link className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-black uppercase tracking-wider">
              {language === "ka" ? "თანამშრომლის მოსაწვევი ჩაკეტილი ბმულები" : "Employee Locked-Role Invite Links"}
            </h5>
            <p className="text-[10px] text-slate-400 font-semibold">
              {language === "ka" 
                ? "როგორ მივცეთ როლები თანამშრომლებს ისე, რომ მათ ვერ შეძლონ როლის შეცვლა თვითნებურად?" 
                : "How to assign roles so employees can't change them on their own?"}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          {language === "ka" 
            ? "გაუგზავნეთ თქვენს თანამშრომლებს შესაბამისი ბმული. როდესაც ისინი გახსნიან ამ ბმულს, აპლიკაცია ჩაიკეტება მათთვის მითითებულ როლზე, ხოლო როლების შესაცვლელი ეს პანელი საერთოდ დაიმალება მათი ეკრანიდან!"
            : "Simply copy and send these links to your employees. When they open the link, the app automatically locks to that role and hides this configuration panel entirely from their view!"}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Accountant Invite Link */}
          <div className="bg-slate-850 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block mb-1">
                {language === "ka" ? "ბუღალტრის ბმული" : "Accountant Link"}
              </span>
              <p className="text-[10px] text-slate-400 leading-snug">
                {language === "ka" 
                  ? "ხსნის ბუღალტრის ხედს, რომელიც ექვემდებარება თქვენს მიერ ზემოთ მითითებულ უფლებებს."
                  : "Opens the accountant ledger with real-time controls subject to your specified permissions."}
              </p>
            </div>
            <button
              onClick={() => handleCopyLink("accountant")}
              className={`w-full py-2 px-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                copiedRole === "accountant"
                  ? "bg-emerald-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {copiedRole === "accountant" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {language === "ka" ? "კოპირებულია!" : "Copied!"}
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  {language === "ka" ? "ბმულის კოპირება" : "Copy Locked Link"}
                </>
              )}
            </button>
          </div>

          {/* Purchaser Invite Link */}
          <div className="bg-slate-850 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block mb-1">
                {language === "ka" ? "შესყიდვების მენეჯერის ბმული" : "Purchaser Link"}
              </span>
              <p className="text-[10px] text-slate-400 leading-snug">
                {language === "ka" 
                  ? "მხოლოდ ინვოისების ასატვირთად. არ აჩვენებს ანალიტიკას და ბიუჯეტებს, თუ ზემოთ არ ჩაურთავთ."
                  : "Optimized for quick uploads only. Hides analytics and logs unless allowed by you."}
              </p>
            </div>
            <button
              onClick={() => handleCopyLink("purchaser")}
              className={`w-full py-2 px-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                copiedRole === "purchaser"
                  ? "bg-emerald-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {copiedRole === "purchaser" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {language === "ka" ? "კოპირებულია!" : "Copied!"}
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  {language === "ka" ? "ბმულის კოპირება" : "Copy Locked Link"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
