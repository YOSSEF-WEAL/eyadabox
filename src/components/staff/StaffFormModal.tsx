import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import type { SaveStaffMemberInput, StaffMember, StaffRole } from "@/features/staff";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type StaffFormModalProps = {
  isOpen: boolean;
  staffMember: StaffMember | null;
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: SaveStaffMemberInput) => Promise<void>;
};

function StaffForm({ staffMember, error, isSaving, onClose, onSave }: Omit<StaffFormModalProps, "isOpen">) {
  const { t } = useTranslation();
  const [form, setForm] = useState<SaveStaffMemberInput>({
    displayName: staffMember?.displayName ?? "",
    username: staffMember?.username ?? "",
    role: staffMember?.role ?? "receptionist",
    isActive: staffMember?.isActive ?? true,
  });

  const setValue = <Key extends keyof SaveStaffMemberInput>(key: Key, value: SaveStaffMemberInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(form);
  };

  return <form onSubmit={submit} className="p-6 sm:p-8">
    <h2 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{t(staffMember ? "clinic.staff.editTitle" : "clinic.staff.addTitle")}</h2>
    <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.staff.formDescription")}</p>
    {error && <p className="mt-4 rounded-lg bg-error-50 p-3 text-theme-sm text-error-600 dark:bg-error-500/15 dark:text-error-400">{error}</p>}
    <div className="mt-6 grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="staff-display-name">{t("clinic.staff.fields.displayName")}</Label>
        <Input id="staff-display-name" value={form.displayName} onChange={(event) => setValue("displayName", event.target.value)} required />
      </div>
      <div>
        <Label htmlFor="staff-username">{t("clinic.staff.fields.username")}</Label>
        <Input id="staff-username" value={form.username} autoComplete="off" onChange={(event) => setValue("username", event.target.value)} required />
      </div>
      <div>
        <Label htmlFor="staff-role">{t("clinic.staff.fields.role")}</Label>
        <select id="staff-role" value={form.role} onChange={(event) => setValue("role", event.target.value as StaffRole)} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800">
          <option value="admin">{t("clinic.staff.roles.admin")}</option>
          <option value="receptionist">{t("clinic.staff.roles.receptionist")}</option>
          <option value="practitioner">{t("clinic.staff.roles.practitioner")}</option>
        </select>
      </div>
      <label className="sm:col-span-2 flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-theme-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-200">
        <input type="checkbox" checked={form.isActive} onChange={(event) => setValue("isActive", event.target.checked)} className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700" />
        {t("clinic.staff.fields.active")}
      </label>
    </div>
    <div className="mt-7 flex justify-end gap-3">
      <button type="button" onClick={onClose} className="rounded-lg px-4 py-3 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">{t("clinic.actions.cancel")}</button>
      <button type="submit" disabled={isSaving} className="rounded-lg bg-brand-500 px-4 py-3 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">{t(isSaving ? "clinic.actions.saving" : "clinic.actions.save")}</button>
    </div>
  </form>;
}

export default function StaffFormModal(props: StaffFormModalProps) {
  const { t } = useTranslation();
  return <Modal isOpen={props.isOpen} onClose={props.onClose} closeLabel={t("common.close")} className="max-w-xl"><StaffForm key={props.staffMember?.id ?? "new"} {...props} /></Modal>;
}
