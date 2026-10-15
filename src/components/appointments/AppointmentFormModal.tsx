import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import PatientPicker from "@/components/patients/PatientPicker";
import { Modal } from "@/components/ui/modal";
import type { Appointment, AppointmentStatus, SaveAppointmentInput } from "@/features/appointments";
import type { Patient } from "@/features/patients";
import type { Practitioner } from "@/features/practitioners";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

type Props = { isOpen: boolean; appointment: Appointment | null; initialPatientId?: string; initialStartsAt?: string; initialEndsAt?: string; patients: Patient[]; practitioners: Practitioner[]; error: string | null; isSaving: boolean; onClose: () => void; onSave: (input: SaveAppointmentInput) => Promise<void> };
const statuses: AppointmentStatus[] = ["scheduled", "confirmed", "arrived", "completed", "no_show", "cancelled"];

function toLocalDateTimeInput(value: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function Form({ appointment, initialPatientId, initialStartsAt, initialEndsAt, patients, practitioners, error, isSaving, onClose, onSave }: Omit<Props, "isOpen">) {
  const { t } = useTranslation();
  const [form, setForm] = useState<SaveAppointmentInput>({ patientId: appointment?.patientId ?? initialPatientId ?? "", practitionerId: appointment?.practitionerId ?? "", startsAt: toLocalDateTimeInput(appointment?.startsAt ?? initialStartsAt), endsAt: toLocalDateTimeInput(appointment?.endsAt ?? initialEndsAt), status: appointment?.status ?? "scheduled", reason: appointment?.reason ?? "", notes: appointment?.notes ?? "" });
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(() => patients.find((patient) => patient.id === (appointment?.patientId ?? initialPatientId)) ?? null);
  const setValue = <Key extends keyof SaveAppointmentInput>(key: Key, value: SaveAppointmentInput[Key]) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); await onSave({ ...form, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString() }); };

  return <form onSubmit={save} className="p-6 sm:p-8"><h2 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{t(appointment ? "clinic.appointments.editTitle" : "clinic.appointments.addTitle")}</h2>{error && <p className="mt-4 rounded-lg bg-error-50 p-3 text-theme-sm text-error-600 dark:bg-error-500/15 dark:text-error-400">{error}</p>}<div className="mt-6 grid gap-5 sm:grid-cols-2">
    <div><Label>{t("clinic.appointments.fields.patient")}</Label><PatientPicker selectedPatient={selectedPatient} onSelect={(patient) => { setSelectedPatient(patient); setValue("patientId", patient.id); }} /><input type="hidden" value={form.patientId} required /></div>
    <div><Label htmlFor="appointment-practitioner">{t("clinic.appointments.fields.practitioner")}</Label><select id="appointment-practitioner" value={form.practitionerId} onChange={(event) => setValue("practitionerId", event.target.value)} required className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option value="">{t("clinic.appointments.selectPractitioner")}</option>{practitioners.map((practitioner) => <option key={practitioner.id} value={practitioner.id}>{practitioner.displayName}</option>)}</select></div>
    <div><Label htmlFor="appointment-start">{t("clinic.appointments.fields.startsAt")}</Label><Input id="appointment-start" type="datetime-local" value={form.startsAt} onChange={(event) => setValue("startsAt", event.target.value)} required /></div>
    <div><Label htmlFor="appointment-end">{t("clinic.appointments.fields.endsAt")}</Label><Input id="appointment-end" type="datetime-local" value={form.endsAt} onChange={(event) => setValue("endsAt", event.target.value)} required /></div>
    <div><Label htmlFor="appointment-status">{t("clinic.appointments.fields.status")}</Label><select id="appointment-status" value={form.status} onChange={(event) => setValue("status", event.target.value as AppointmentStatus)} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">{statuses.map((status) => <option key={status} value={status}>{t(`clinic.appointments.statuses.${status}`)}</option>)}</select></div>
    <div><Label htmlFor="appointment-reason">{t("clinic.appointments.fields.reason")}</Label><Input id="appointment-reason" value={form.reason} onChange={(event) => setValue("reason", event.target.value)} /></div>
  </div><div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg px-4 py-3 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">{t("clinic.actions.cancel")}</button><button type="submit" disabled={isSaving} className="rounded-lg bg-brand-500 px-4 py-3 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">{t(isSaving ? "clinic.actions.saving" : "clinic.actions.save")}</button></div>
  </form>;
}

export default function AppointmentFormModal({ isOpen, appointment, initialPatientId, initialStartsAt, initialEndsAt, patients, practitioners, error, isSaving, onClose, onSave }: Props) { const { t } = useTranslation(); return <Modal isOpen={isOpen} onClose={onClose} closeLabel={t("common.close")} className="max-w-2xl"><Form key={appointment?.id ?? `${initialPatientId ?? "new"}-${initialStartsAt ?? ""}`} appointment={appointment} initialPatientId={initialPatientId} initialStartsAt={initialStartsAt} initialEndsAt={initialEndsAt} patients={patients} practitioners={practitioners} error={error} isSaving={isSaving} onClose={onClose} onSave={onSave} /></Modal>; }
