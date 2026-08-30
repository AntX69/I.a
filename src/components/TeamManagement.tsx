import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Mail, 
  User, 
  Briefcase, 
  Check, 
  X, 
  Copy, 
  Trash2, 
  Shield, 
  ShieldCheck,
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Sparkles,
  ChevronRight,
  History,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Activity
} from "lucide-react";
import { Language, UserPermissions, TeamMember, PendingInvite, AuditLogEntry } from "../types";
import { apiFetch } from "../lib/api";

interface TeamManagementProps {
  language: Language;
  currentUserEmail: string;
  userPermissions: UserPermissions;
  onGoBack: () => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}

const PERMISSION_LABELS: Record<keyof UserPermissions, { ka: string; en: string; descKa: string; descEn: string }> = {
  uploadInvoices: {
    ka: "ინვოისის ატვირთვა",
    en: "Upload Invoices",
    descKa: "ინვოისების და ქვითრების ატვირთვისა და გაანალიზების უფლება",
    descEn: "Permission to upload and analyze invoices and receipts"
  },
  deleteInvoices: {
    ka: "ინვოისის წაშლა",
    en: "Delete Invoices",
    descKa: "სისტემიდან ინვოისების წაშლისა და გასუფთავების უფლება",
    descEn: "Permission to delete or clear invoices from the system"
  },
  editBudgets: {
    ka: "ბიუჯეტის ლიმიტების ცვლილება",
    en: "Edit Budget Limits",
    descKa: "კატეგორიული ბიუჯეტის ლიმიტების დაწესება და ცვლილება",
    descEn: "Set and modify categorical budget threshold limits"
  },
  viewAnalytics: {
    ka: "ანალიტიკის ნახვა",
    en: "View Analytics",
    descKa: "ხარჯების გრაფიკების, რეპორტებისა და ანალიტიკის ნახვა",
    descEn: "Access spend graphs, vendor breakdown, and analytics"
  },
  manageTeam: {
    ka: "გუნდის მართვა (მხოლოდ მფლობელი)",
    en: "Manage Team (Owner Only)",
    descKa: "ექსკლუზიური უფლება მხოლოდ კომპანიის მფლობელისთვის",
    descEn: "Exclusive permission reserved for company owner"
  },
  manageBilling: {
    ka: "ბილინგის მართვა",
    en: "Manage Billing",
    descKa: "საბილინგო ტარიფების და კომპანიის პარამეტრების ცვლილება",
    descEn: "Modify pricing plans and corporate billing configuration"
  }
};

export default function TeamManagement({
  language,
  currentUserEmail,
  userPermissions,
  onGoBack,
  showToast
}: TeamManagementProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePosition, setInvitePosition] = useState("");
  const [invitePermissions, setInvitePermissions] = useState<UserPermissions>({
    uploadInvoices: true,
    deleteInvoices: false,
    editBudgets: false,
    viewAnalytics: true,
    manageTeam: false,
    manageBilling: false,
  });
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Edit / Details Modal State
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editPosition, setEditPosition] = useState("");
  const [editPermissions, setEditPermissions] = useState<UserPermissions>({
    uploadInvoices: true,
    deleteInvoices: false,
    editBudgets: false,
    viewAnalytics: true,
    manageTeam: false,
    manageBilling: false,
  });
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Confirm Revoke Modal State
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string; isInvite?: boolean } | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Tabs: Members vs Audit Log
  const [activeTab, setActiveTab] = useState<"members" | "audit">("members");
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFilter, setAuditFilter] = useState<string>("all");

  const fetchAuditLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const data = await apiFetch<{ success: boolean; logs: AuditLogEntry[] }>("/api/audit-log");
      if (data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (err: any) {
      showToast(err.message || (language === "ka" ? "ჟურნალის ჩატვირთვა ვერ მოხერხდა" : "Failed to load audit logs"), "error");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchTeam = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ success: boolean; members: TeamMember[]; pendingInvites: PendingInvite[] }>("/api/team");
      if (data.success) {
        setMembers(data.members || []);
        setPendingInvites(data.pendingInvites || []);
      }
    } catch (err: any) {
      showToast(err.message || (language === "ka" ? "გუნდის ჩატვირთვა ვერ მოხერხდა" : "Failed to load team"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    fetchAuditLogs();
  }, []);

  const handleOpenInviteModal = () => {
    setInviteEmail("");
    setInviteName("");
    setInvitePosition("");
    setInvitePermissions({
      uploadInvoices: true,
      deleteInvoices: false,
      editBudgets: false,
      viewAnalytics: true,
      manageTeam: false,
      manageBilling: false,
    });
    setCreatedInviteLink(null);
    setShowInviteModal(true);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) {
      showToast(language === "ka" ? "შეავსეთ ელფოსტა და სახელი" : "Email and Name are required", "error");
      return;
    }

    setIsSubmittingInvite(true);
    try {
      const res = await apiFetch<{ success: boolean; invite: PendingInvite & { inviteLink: string } }>("/api/invites", {
        method: "POST",
        body: {
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          position: invitePosition.trim() || "თანამშრომელი",
          permissions: invitePermissions
        }
      });

      if (res.success) {
        const fullLink = `${window.location.origin}${res.invite.inviteLink}`;
        setCreatedInviteLink(fullLink);
        showToast(language === "ka" ? "მოწვევა წარმატებით შეიქმნა!" : "Invitation created successfully!", "success");
        fetchTeam();
      }
    } catch (err: any) {
      showToast(err.message || (language === "ka" ? "მოწვევის შექმნის შეცდომა" : "Failed to create invite"), "error");
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    showToast(language === "ka" ? "ლინკი დაკოპირებულია!" : "Link copied to clipboard!", "success");
  };

  const handleSelectMember = (member: TeamMember) => {
    setSelectedMember(member);
    setEditPosition(member.position || "");
    setEditPermissions({ ...member.permissions });
  };

  const handleSavePermissions = async () => {
    if (!selectedMember) return;
    setIsSavingPermissions(true);
    try {
      await apiFetch(`/api/team/${encodeURIComponent(selectedMember.email)}/permissions`, {
        method: "PATCH",
        body: {
          position: editPosition,
          permissions: editPermissions
        }
      });
      showToast(language === "ka" ? "უფლებები წარმატებით განახლდა!" : "Permissions updated successfully!", "success");
      setSelectedMember(null);
      fetchTeam();
    } catch (err: any) {
      showToast(err.message || (language === "ka" ? "უფლებების განახლების შეცდომა" : "Failed to update permissions"), "error");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    setIsRevoking(true);
    try {
      await apiFetch(`/api/team/${encodeURIComponent(revokeTarget.id)}/revoke`, {
        method: "POST"
      });
      showToast(language === "ka" ? "წვდომა წარმატებით გაუქმდა!" : "Access revoked successfully!", "success");
      setRevokeTarget(null);
      if (selectedMember && selectedMember.email === revokeTarget.id) {
        setSelectedMember(null);
      }
      fetchTeam();
    } catch (err: any) {
      showToast(err.message || (language === "ka" ? "წვდომის გაუქმება ვერ მოხერხდა" : "Failed to revoke access"), "error");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-bold text-indigo-300">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === "ka" ? "გუნდის მართვა" : "Team & Permissions"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {language === "ka" ? "თანამშრომლები და ინდივიდუალური წვდომები" : "Employees & Individual Permissions"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {language === "ka" 
                ? "მოიწვიეთ გუნდის წევრები, განუსაზღვრეთ პოზიციები და დაარეგულირეთ ინდივიდუალური უფლებები." 
                : "Invite team members, assign positions, and manage exact granular permissions."}
            </p>
          </div>

          <button
            onClick={handleOpenInviteModal}
            disabled={!userPermissions.manageTeam}
            className={`px-5 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-lg flex items-center gap-2 transition-all cursor-pointer ${
              userPermissions.manageTeam
                ? "bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-indigo-600/30"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{language === "ka" ? "თანამშრომლის მოწვევა" : "Invite Employee"}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl w-full sm:w-fit gap-1 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "members"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{language === "ka" ? `გუნდის წევრები (${members.length})` : `Team Members (${members.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("audit");
              fetchAuditLogs();
            }}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "audit"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{language === "ka" ? "აქტივობის ჟურნალი" : "Activity & Audit Log"}</span>
            {auditLogs.length > 0 && (
              <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px]">
                {auditLogs.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "members" ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {language === "ka" ? "გუნდის წევრები" : "Team Members"}
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold">
                    {language === "ka" ? `სულ: ${members.length} აქტიური | ${pendingInvites.length} მოწვეული` : `Total: ${members.length} active | ${pendingInvites.length} pending`}
                  </p>
                </div>
              </div>

              <button
                onClick={fetchTeam}
                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer rounded-xl hover:bg-slate-50"
                title={language === "ka" ? "განახლება" : "Refresh"}
              >
                <Clock className="w-4 h-4" />
              </button>
            </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 animate-pulse space-y-3">
            <Users className="w-8 h-8 mx-auto text-indigo-400 animate-bounce" />
            <p className="text-xs font-bold">{language === "ka" ? "იტვირთება..." : "Loading team members..."}</p>
          </div>
        ) : members.length === 0 && pendingInvites.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">
                {language === "ka" ? "გუნდის წევრები ჯერ არ არიან" : "No team members yet"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === "ka" ? "დააჭირეთ 'თანამშრომლის მოწვევა' ღილაკს პირველი წევრის დასამატებლად." : "Click 'Invite Employee' button to add your first member."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 sm:px-5 py-3.5">{language === "ka" ? "თანამშრომელი / ელფოსტა" : "Employee / Email"}</th>
                  <th className="px-4 sm:px-5 py-3.5">{language === "ka" ? "პოზიცია" : "Position"}</th>
                  <th className="px-4 sm:px-5 py-3.5">{language === "ka" ? "სტატუსი" : "Status"}</th>
                  <th className="px-4 sm:px-5 py-3.5 text-right">{language === "ka" ? "მოქმედება" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                {/* Active Members */}
                {members.map((member) => {
                  const isSelf = member.email === currentUserEmail;
                  const activePermsCount = Object.values(member.permissions || {}).filter(Boolean).length;
                  const isRevoked = member.status === "revoked";

                  return (
                    <tr
                      key={member.email}
                      onClick={() => !isRevoked && handleSelectMember(member)}
                      className={`transition-all duration-200 cursor-pointer ${
                        isRevoked
                          ? "bg-rose-50/20 opacity-60 hover:bg-rose-50/30"
                          : "hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20"
                      }`}
                    >
                      <td className="px-4 sm:px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-extrabold text-xs shadow-xs shrink-0 ${
                            isRevoked
                              ? "bg-rose-100 text-rose-700"
                              : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                          }`}>
                            {(member.email[0] || "U").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">{member.email}</span>
                              {isSelf && (
                                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-bold shrink-0">
                                  {language === "ka" ? "თქვენ" : "You"}
                                </span>
                              )}
                              {member.is_platform_owner && (
                                <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50 rounded-md text-[10px] font-bold shrink-0">
                                  {language === "ka" ? "მფლობელი" : "Owner"}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 flex items-center gap-1.5">
                              <ShieldCheck className="w-3 h-3 text-indigo-500 shrink-0" />
                              <span>
                                {activePermsCount} / 6 {language === "ka" ? "უფლება" : "permissions"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 sm:px-5 py-3.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl text-xs whitespace-nowrap">
                          {member.position || (language === "ka" ? "თანამშრომელი" : "Employee")}
                        </span>
                      </td>

                      <td className="px-4 sm:px-5 py-3.5">
                        {isRevoked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 rounded-full text-[11px] font-bold whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {language === "ka" ? "გაუქმებული" : "Revoked"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 rounded-full text-[11px] font-bold whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {language === "ka" ? "აქტიური" : "Active"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 sm:px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {!isRevoked && (
                            <button
                              onClick={() => handleSelectMember(member)}
                              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                            >
                              {language === "ka" ? "მართვა" : "Manage"}
                            </button>
                          )}
                          {!isSelf && !isRevoked && userPermissions.manageTeam && (
                            <button
                              onClick={() => setRevokeTarget({ id: member.email, name: member.email })}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                              title={language === "ka" ? "წვდომის გაუქმება" : "Revoke Access"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Pending Invites */}
                {pendingInvites.map((invite) => {
                  const fullLink = `${window.location.origin}/invite/${invite.token}`;

                  return (
                    <tr
                      key={invite.token}
                      className="bg-amber-50/10 dark:bg-amber-950/10 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all duration-200"
                    >
                      <td className="px-4 sm:px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center font-extrabold text-xs shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 dark:text-white truncate">{invite.name}</div>
                            <div className="text-[11px] text-slate-400 font-medium truncate">{invite.email}</div>
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>
                                {language === "ka" ? "ვადა: " : "Expires: "}
                                {new Date(invite.expires_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 sm:px-5 py-3.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl text-xs whitespace-nowrap">
                          {invite.position || "თანამშრომელი"}
                        </span>
                      </td>

                      <td className="px-4 sm:px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 rounded-full text-[11px] font-bold whitespace-nowrap">
                          <Clock className="w-3 h-3 text-amber-500 animate-spin" style={{ animationDuration: "4s" }} />
                          {language === "ka" ? "მოლოდინში" : "Pending"}
                        </span>
                      </td>

                      <td className="px-4 sm:px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleCopyLink(fullLink)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            title={language === "ka" ? "ლინკის კოპირება" : "Copy Link"}
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{language === "ka" ? "ლინკი" : "Link"}</span>
                          </button>

                          {userPermissions.manageTeam && (
                            <button
                              onClick={() => setRevokeTarget({ id: invite.token, name: invite.name, isInvite: true })}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                              title={language === "ka" ? "მოწვევის გაუქმება" : "Cancel Invite"}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
          </div>
        ) : (
          /* AUDIT LOG TAB VIEW */
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    {language === "ka" ? "უსაფრთხოებისა და აქტივობის ჟურნალი" : "Security & Activity Audit Log"}
                  </h2>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    {language === "ka"
                      ? "ორგანიზაციაში განხორციელებული ყველა ქმედების უცვლელი ისტორია"
                      : "Chronological log of user actions, team alterations, and modifications"}
                  </p>
                </div>
              </div>

              <button
                onClick={fetchAuditLogs}
                disabled={isLoadingLogs}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isLoadingLogs ? "animate-spin" : ""}`} />
                <span>{language === "ka" ? "განახლება" : "Refresh"}</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === "ka" ? "ძებნა მოქმედებით, მომხმარებლით ან დეტალებით..." : "Search action, user, description..."}
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: "all", ka: "ყველა", en: "All" },
                  { id: "team", ka: "გუნდი", en: "Team" },
                  { id: "invoice", ka: "ინვოისები", en: "Invoices" },
                  { id: "budget", ka: "ბიუჯეტი", en: "Budget" },
                  { id: "system", ka: "სისტემა", en: "System" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setAuditFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      auditFilter === f.id
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {language === "ka" ? f.ka : f.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Audit Logs List */}
            {isLoadingLogs ? (
              <div className="py-12 text-center text-slate-400 animate-pulse space-y-3">
                <RefreshCw className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
                <p className="text-xs font-bold">{language === "ka" ? "ჟურნალი იტვირთება..." : "Loading activity log..."}</p>
              </div>
            ) : (() => {
              const filteredLogs = auditLogs.filter((log) => {
                const matchesType = auditFilter === "all" || log.type === auditFilter;
                const query = auditSearch.toLowerCase().trim();
                const matchesQuery = !query ||
                  log.action.toLowerCase().includes(query) ||
                  log.user_email.toLowerCase().includes(query) ||
                  (log.target_description && log.target_description.toLowerCase().includes(query));
                return matchesType && matchesQuery;
              });

              if (filteredLogs.length === 0) {
                return (
                  <div className="py-12 text-center text-slate-400 space-y-3">
                    <History className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">
                      {language === "ka" ? "ჩანაწერები ვერ მოიძებნა" : "No audit entries recorded yet"}
                    </p>
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <th className="px-4 sm:px-5 py-3.5">{language === "ka" ? "მოქმედება" : "Action"}</th>
                        <th className="px-4 sm:px-5 py-3.5">{language === "ka" ? "დეტალები" : "Description"}</th>
                        <th className="px-4 sm:px-5 py-3.5">{language === "ka" ? "მომხმარებელი" : "User"}</th>
                        <th className="px-4 sm:px-5 py-3.5 text-right">{language === "ka" ? "დრო" : "Timestamp"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                      {filteredLogs.map((log) => {
                        const dateObj = new Date(log.timestamp);
                        const formattedTime = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                        if (log.type === "team") badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                        if (log.type === "invoice") badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
                        if (log.type === "budget") badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                        if (log.type === "system") badgeColor = "bg-purple-50 text-purple-700 border-purple-200";

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 sm:px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-lg font-extrabold text-[10px] uppercase border ${badgeColor}`}>
                                  {log.action}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5">
                              <span className="text-slate-800 font-semibold">
                                {log.target_description || "-"}
                              </span>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5">
                              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate max-w-[160px]">{log.user_email}</span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-5 py-3.5 text-right whitespace-nowrap text-slate-400 font-semibold text-[11px]">
                              {formattedTime}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* --- INVITE MODAL --- */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
                <UserPlus className="w-3.5 h-3.5" />
                <span>{language === "ka" ? "ახალი წევრი" : "New Member"}</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {language === "ka" ? "თანამშრომლის მოწვევა" : "Invite Employee"}
              </h3>
            </div>

            {createdInviteLink ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-4 animate-fadeIn">
                <div className="flex items-center gap-3 text-emerald-800">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-extrabold text-sm">
                      {language === "ka" ? "მოწვევა წარმატებით შეიქმნა!" : "Invitation Created Successfully!"}
                    </p>
                    <p className="text-xs text-emerald-600">
                      {language === "ka" 
                        ? "გადაუგზავნეთ ეს უნიკალური ლინკი თანამშრომელს რეგისტრაციისა და პაროლის მითითებისთვის." 
                        : "Share this unique registration link with the employee."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-xl p-2.5">
                  <input
                    type="text"
                    readOnly
                    value={createdInviteLink}
                    className="flex-1 text-xs font-mono text-slate-700 outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(createdInviteLink)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{language === "ka" ? "კოპირება" : "Copy"}</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-full py-2.5 bg-slate-900 text-white font-extrabold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {language === "ka" ? "დახურვა" : "Close"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      {language === "ka" ? "სახელი და გვარი" : "Full Name"} *
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder={language === "ka" ? "მაგ. გიორგი ბერიძე" : "e.g. John Doe"}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      {language === "ka" ? "ელფოსტა" : "Email Address"} *
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@company.ge"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 block">
                    {language === "ka" ? "პოზიცია კომპანიაში" : "Position"}
                  </label>
                  <input
                    type="text"
                    value={invitePosition}
                    onChange={(e) => setInvitePosition(e.target.value)}
                    placeholder={language === "ka" ? "მაგ. ბუღალტერი, შემსყიდველი, მენეჯერი" : "e.g. Accountant, Purchaser"}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                {/* 6 Permission Checkboxes */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-extrabold text-slate-900 block border-b border-slate-100 pb-2">
                    {language === "ka" ? "ინდივიდუალური უფლებები (6 Checkbox)" : "Granular Permissions (6 Checkboxes)"}
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Object.keys(PERMISSION_LABELS) as Array<keyof UserPermissions>).map((key) => {
                      const isChecked = invitePermissions[key];
                      const info = PERMISSION_LABELS[key];

                      return (
                        <label
                          key={key}
                          className={`flex items-start gap-3 p-3 rounded-2xl border transition-all select-none cursor-pointer ${
                            isChecked
                              ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-xs"
                              : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              setInvitePermissions((prev) => ({
                                ...prev,
                                [key]: e.target.checked,
                              }))
                            }
                            className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          />
                          <div className="space-y-0.5">
                            <span className="text-xs font-extrabold block">
                              {language === "ka" ? info.ka : info.en}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block leading-tight">
                              {language === "ka" ? info.descKa : info.descEn}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {language === "ka" ? "გაუქმება" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingInvite}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isSubmittingInvite && <Clock className="w-3.5 h-3.5 animate-spin" />}
                    <span>{language === "ka" ? "მოწვევის გაგზავნა" : "Send Invitation"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- EDIT MEMBER PERMISSIONS DRAWER/MODAL --- */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-base">
                {(selectedMember.email[0] || "U").toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedMember.email}</h3>
                <p className="text-xs text-slate-400 font-semibold">
                  {language === "ka" ? "უფლებებისა და პოზიციის რედაქტირება" : "Edit Position & Permissions"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  {language === "ka" ? "პოზიცია" : "Position"}
                </label>
                <input
                  type="text"
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  placeholder={language === "ka" ? "მაგ. ბუღალტერი" : "e.g. Accountant"}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* 6 Permissions Checkboxes */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-extrabold text-slate-900 block border-b border-slate-100 pb-2">
                  {language === "ka" ? "უფლებების დაყენება (6 Checkbox)" : "Granular Permissions (6 Checkboxes)"}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(PERMISSION_LABELS) as Array<keyof UserPermissions>).map((key) => {
                    const isChecked = editPermissions[key];
                    const info = PERMISSION_LABELS[key];

                    return (
                      <label
                        key={key}
                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-all select-none cursor-pointer ${
                          isChecked
                            ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-xs"
                            : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setEditPermissions((prev) => ({
                              ...prev,
                              [key]: e.target.checked,
                            }))
                          }
                          className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-extrabold block">
                            {language === "ka" ? info.ka : info.en}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block leading-tight">
                            {language === "ka" ? info.descKa : info.descEn}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {userPermissions.manageTeam && selectedMember.email !== currentUserEmail ? (
                <button
                  type="button"
                  onClick={() => setRevokeTarget({ id: selectedMember.email, name: selectedMember.email })}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{language === "ka" ? "წვდომის გაუქმება" : "Revoke Access"}</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  {language === "ka" ? "გაუქმება" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={isSavingPermissions}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSavingPermissions && <Clock className="w-3.5 h-3.5 animate-spin" />}
                  <span>{language === "ka" ? "შენახვა" : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM REVOKE ACCESS MODAL --- */}
      {revokeTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900">
                {language === "ka" ? "დარწმუნებული ხართ?" : "Are you sure?"}
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                {language === "ka" 
                  ? `ნამდვილად გსურთ წვდომის გაუქმება მომხმარებლისთვის: ${revokeTarget.name}?` 
                  : `Are you sure you want to revoke access for ${revokeTarget.name}?`}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {language === "ka" ? "არა, დაბრუნება" : "No, cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={isRevoking}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isRevoking && <Clock className="w-3.5 h-3.5 animate-spin" />}
                <span>{language === "ka" ? "დიახ, გაუქმება" : "Yes, Revoke"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
