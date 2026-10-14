import AppointmentFormModal from "@/components/appointments/AppointmentFormModal";
import ClinicAppointmentsCalendar from "@/components/appointments/ClinicAppointmentsCalendar";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { appointmentService, type Appointment, type AppointmentStatus, type SaveAppointmentInput } from "@/features/appointments";
import { patientService, type Patient } from "@/features/patients";
import { practitionerService, type Practitioner } from "@/features/practitioners";
import { clinicSettingsService } from "@/features/settings";
import { useModal } from "@/hooks/useModal";
import { PencilIcon, PlusIcon } from "@/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type DraftTimes = { startsAt: string; endsAt: string } | null;

const appointmentStatuses: AppointmentStatus[] = ["scheduled", "confirmed", "arrived", "completed", "no_show", "cancelled"];

function makeDraftTimes(defaultAppointmentMinutes: number, start?: Date, end?: Date, allDay = false): DraftTimes {
  const startsAt = start ? new Date(start) : new Date();
  if (!start || allDay) startsAt.setHours(9, 0, 0, 0);
  const endsAt = end && !allDay ? new Date(end) : new Date(startsAt);
  if (!end || allDay) endsAt.setMinutes(endsAt.getMinutes() + defaultAppointmentMinutes);
  return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

export default function Appointments() {
  const { t, i18n } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [draftTimes, setDraftTimes] = useState<DraftTimes>(null);
  const [practitionerFilter, setPractitionerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [defaultAppointmentMinutes, setDefaultAppointmentMinutes] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const patientNames = useMemo(() => new Map(patients.map((patient) => [patient.id, patient.fullName])), [patients]);
  const practitionerNames = useMemo(() => new Map(practitioners.map((practitioner) => [practitioner.id, practitioner.displayName])), [practitioners]);
  const filteredAppointments = useMemo(() => appointments.filter((appointment) => (practitionerFilter === "all" || appointment.practitionerId === practitionerFilter) && (statusFilter === "all" || appointment.status === statusFilter)), [appointments, practitionerFilter, statusFilter]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [appointmentData, patientData, practitionerData, settings] = await Promise.all([appointmentService.list(), patientService.search(""), practitionerService.list(), clinicSettingsService.get()]);
      setAppointments(appointmentData);
      setPatients(patientData);
      setPractitioners(practitionerData);
      setDefaultAppointmentMinutes(settings.defaultAppointmentMinutes);
    } catch {
      setError(t("clinic.appointments.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  const openAdd = (start?: Date, end?: Date, allDay?: boolean) => {
    setSelected(null);
    setDraftTimes(makeDraftTimes(defaultAppointmentMinutes, start, end, allDay));
    setError(null);
    openModal();
  };

  const openEdit = (appointment: Appointment) => {
    setSelected(appointment);
    setDraftTimes(null);
    setError(null);
    openModal();
  };

  const save = async (input: SaveAppointmentInput) => {
    setIsSaving(true);
    setError(null);
    try {
      if (selected) await appointmentService.update(selected.id, input);
      else await appointmentService.create(input);
      await load();
      closeModal();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("clinic.appointments.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const formatter = new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" });

  return <>
    <PageMeta title={`${t("clinic.modules.appointments.title")} | Clinic Desk`} description={t("clinic.modules.appointments.description")} />
    <PageBreadCrumb pageTitle={t("clinic.modules.appointments.title")} />

    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.modules.appointments.title")}</h1>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.modules.appointments.description")}</p>
      </div>
      <button type="button" onClick={() => openAdd()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-theme-sm font-medium text-white hover:bg-brand-600">
        <PlusIcon className="size-4" />
        {t("clinic.appointments.addAppointment")}
      </button>
    </div>

    {isLoading ? <section className="rounded-2xl border border-gray-200 bg-white py-14 text-center text-theme-sm text-gray-500 dark:border-gray-800 dark:bg-white/3 dark:text-gray-400">{t("clinic.actions.loading")}</section> : <>
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            <span className="mb-2 block">{t("clinic.appointments.filters.practitioner")}</span>
            <select value={practitionerFilter} onChange={(event) => setPractitionerFilter(event.target.value)} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
              <option value="all">{t("clinic.appointments.filters.allPractitioners")}</option>
              {practitioners.map((practitioner) => <option key={practitioner.id} value={practitioner.id}>{practitioner.displayName}</option>)}
            </select>
          </label>
          <label className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">
            <span className="mb-2 block">{t("clinic.appointments.filters.status")}</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AppointmentStatus | "all")} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
              <option value="all">{t("clinic.appointments.filters.allStatuses")}</option>
              {appointmentStatuses.map((status) => <option key={status} value={status}>{t(`clinic.appointments.statuses.${status}`)}</option>)}
            </select>
          </label>
        </div>
      </section>

      <ClinicAppointmentsCalendar appointments={filteredAppointments} patientNames={patientNames} defaultAppointmentMinutes={defaultAppointmentMinutes} onCreateAt={(start, end, allDay) => openAdd(start, end, allDay)} onEdit={openEdit} />

      <section className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-theme-lg font-semibold text-gray-800 dark:text-white/90">{t("clinic.appointments.listTitle")}</h2>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.appointments.listDescription")}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-gray-100 dark:border-gray-800">
              <tr>{["patient", "practitioner", "time", "status", "actions"].map((column) => <th key={column} className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t(`clinic.appointments.columns.${column}`)}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredAppointments.map((appointment) => <tr key={appointment.id}>
                <td className="px-5 py-4 text-theme-sm font-medium text-gray-800 dark:text-white/90">{patientNames.get(appointment.patientId) ?? "—"}</td>
                <td className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">{practitionerNames.get(appointment.practitionerId) ?? "—"}</td>
                <td className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">{formatter.format(new Date(appointment.startsAt))}</td>
                <td className="px-5 py-4"><span className="rounded-full bg-brand-50 px-2.5 py-1 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">{t(`clinic.appointments.statuses.${appointment.status}`)}</span></td>
                <td className="px-5 py-4"><button type="button" onClick={() => openEdit(appointment)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-theme-sm font-medium text-brand-500 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/15"><PencilIcon className="size-4" />{t("clinic.actions.edit")}</button></td>
              </tr>)}
              {filteredAppointments.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.appointments.noResults")}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>}

    <AppointmentFormModal isOpen={isOpen} appointment={selected} initialStartsAt={draftTimes?.startsAt} initialEndsAt={draftTimes?.endsAt} patients={patients} practitioners={practitioners} error={error} isSaving={isSaving} onClose={closeModal} onSave={save} />
  </>;
}
