import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import StaffFormModal from "@/components/staff/StaffFormModal";
import { staffService, type SaveStaffMemberInput, type StaffMember } from "@/features/staff";
import { PencilIcon, PlusIcon } from "@/icons";
import { useModal } from "@/hooks/useModal";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function staffErrorMessage(error: unknown, t: (key: string) => string): string {
  const code = error instanceof Error ? error.message : "";
  const messages: Record<string, string> = {
    STAFF_NAME_REQUIRED: "clinic.staff.errors.nameRequired",
    STAFF_USERNAME_INVALID: "clinic.staff.errors.usernameInvalid",
    STAFF_ROLE_INVALID: "clinic.staff.errors.roleInvalid",
    STAFF_USERNAME_TAKEN: "clinic.staff.errors.usernameTaken",
    STAFF_NOT_FOUND: "clinic.staff.errors.notFound",
    STAFF_LAST_ACTIVE_ADMIN_REQUIRED: "clinic.staff.errors.lastActiveAdmin",
  };
  return t(messages[code] ?? "clinic.staff.saveError");
}

export default function Staff() {
  const { t } = useTranslation();
  const formModal = useModal();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try { setStaff(await staffService.list()); }
    catch { setError(t("clinic.staff.loadError")); }
    finally { setIsLoading(false); }
  }, [t]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [load]);

  const closeForm = () => {
    setEditingMember(null);
    setError(null);
    formModal.closeModal();
  };

  const openCreate = () => {
    setEditingMember(null);
    setError(null);
    formModal.openModal();
  };

  const openEdit = (member: StaffMember) => {
    setEditingMember(member);
    setError(null);
    formModal.openModal();
  };

  const save = async (input: SaveStaffMemberInput) => {
    setIsSaving(true);
    setError(null);
    try {
      if (editingMember) await staffService.update(editingMember.id, input);
      else await staffService.create(input);
      closeForm();
      await load();
    } catch (saveError) {
      setError(staffErrorMessage(saveError, t));
    } finally {
      setIsSaving(false);
    }
  };

  return <>
    <PageMeta title={`${t("clinic.modules.staff.title")} | Clinic Desk`} description={t("clinic.modules.staff.description")} />
    <PageBreadCrumb pageTitle={t("clinic.modules.staff.title")} />
    <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        <div>
          <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.staff.title")}</h1>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.staff.description")}</p>
          <p className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">{t("clinic.staff.credentialsNotice")}</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-theme-sm font-medium text-white hover:bg-brand-600"><PlusIcon className="size-4" />{t("clinic.staff.addStaff")}</button>
      </div>
      {error && !formModal.isOpen && <p className="m-5 rounded-lg bg-error-50 p-3 text-theme-sm text-error-600 dark:bg-error-500/15 dark:text-error-400">{error}</p>}
      {isLoading ? <p className="py-14 text-center text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.actions.loading")}</p> : <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-y border-gray-100 dark:border-gray-800"><tr>{["displayName", "username", "role", "status", "actions"].map((column) => <th key={column} className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t(`clinic.staff.columns.${column}`)}</th>)}</tr></thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {staff.map((member) => <tr key={member.id}>
              <td className="px-5 py-4 text-theme-sm font-medium text-gray-800 dark:text-white/90">{member.displayName}</td>
              <td className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">{member.username}</td>
              <td className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">{t(`clinic.staff.roles.${member.role}`)}</td>
              <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-theme-xs font-medium ${member.isActive ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400" : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"}`}>{t(member.isActive ? "clinic.staff.status.active" : "clinic.staff.status.inactive")}</span></td>
              <td className="px-5 py-4"><button type="button" onClick={() => openEdit(member)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-theme-sm font-medium text-brand-500 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/15"><PencilIcon className="size-4" />{t("clinic.actions.edit")}</button></td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </section>
    <StaffFormModal isOpen={formModal.isOpen} staffMember={editingMember} error={error} isSaving={isSaving} onClose={closeForm} onSave={save} />
  </>;
}
