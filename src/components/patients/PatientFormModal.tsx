import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import type { CreatePatientInput, Patient } from "@/features/patients";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type PatientFormModalProps = {
  isOpen: boolean;
  patient: Patient | null;
  error: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: CreatePatientInput) => Promise<void>;
};

function PatientForm({ patient, error, isSaving, onClose, onSave }: Omit<PatientFormModalProps, "isOpen">) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CreatePatientInput>({
    fullName: patient?.fullName ?? "",
    phone: patient?.phone ?? "",
    dateOfBirth: patient?.dateOfBirth ?? "",
    sex: patient?.sex ?? undefined,
    address: patient?.address ?? "",
    notes: patient?.notes ?? "",
  });

  const setValue = <Key extends keyof CreatePatientInput>(key: Key, value: CreatePatientInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8">
      <h2 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{t(patient ? "clinic.patients.editTitle" : "clinic.patients.addTitle")}</h2>
      <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.patients.formDescription")}</p>
      {error && <p className="mt-4 rounded-lg bg-error-50 p-3 text-theme-sm text-error-600 dark:bg-error-500/15 dark:text-error-400">{error}</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="patient-name">{t("clinic.patients.fields.fullName")}</Label>
          <Input id="patient-name" value={form.fullName} onChange={(event) => setValue("fullName", event.target.value)} required />
        </div>
        <div>
          <Label htmlFor="patient-phone">{t("clinic.patients.fields.phone")}</Label>
          <Input id="patient-phone" inputMode="tel" value={form.phone} onChange={(event) => setValue("phone", event.target.value)} />
        </div>
        <div>
          <Label htmlFor="patient-birth-date">{t("clinic.patients.fields.dateOfBirth")}</Label>
          <Input id="patient-birth-date" type="date" value={form.dateOfBirth} onChange={(event) => setValue("dateOfBirth", event.target.value)} />
        </div>
        <div>
          <Label htmlFor="patient-sex">{t("clinic.patients.fields.sex")}</Label>
          <select id="patient-sex" value={form.sex ?? ""} onChange={(event) => setValue("sex", event.target.value ? event.target.value as CreatePatientInput["sex"] : undefined)} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800">
            <option value="">{t("clinic.patients.sexOptions.unspecified")}</option>
            <option value="female">{t("clinic.patients.sexOptions.female")}</option>
            <option value="male">{t("clinic.patients.sexOptions.male")}</option>
          </select>
        </div>
        <div>
          <Label htmlFor="patient-address">{t("clinic.patients.fields.address")}</Label>
          <Input id="patient-address" value={form.address} onChange={(event) => setValue("address", event.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="patient-notes">{t("clinic.patients.fields.notes")}</Label>
          <textarea id="patient-notes" value={form.notes} onChange={(event) => setValue("notes", event.target.value)} rows={3} className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800" />
        </div>
      </div>
      <div className="mt-7 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-3 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">{t("clinic.actions.cancel")}</button>
        <button type="submit" disabled={isSaving} className="rounded-lg bg-brand-500 px-4 py-3 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">{t(isSaving ? "clinic.actions.saving" : "clinic.actions.save")}</button>
      </div>
    </form>
  );
}

export default function PatientFormModal({ isOpen, patient, error, isSaving, onClose, onSave }: PatientFormModalProps) {
  const { t } = useTranslation();
  return <Modal isOpen={isOpen} onClose={onClose} closeLabel={t("common.close")} className="max-w-2xl"><PatientForm key={patient?.id ?? "new"} patient={patient} error={error} isSaving={isSaving} onClose={onClose} onSave={onSave} /></Modal>;
}
