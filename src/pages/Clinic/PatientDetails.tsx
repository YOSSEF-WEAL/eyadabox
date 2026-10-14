import AppointmentFormModal from "@/components/appointments/AppointmentFormModal";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import PatientFormModal from "@/components/patients/PatientFormModal";
import { Modal } from "@/components/ui/modal";
import { appointmentService, type Appointment, type SaveAppointmentInput } from "@/features/appointments";
import { patientService, type CreatePatientInput, type Patient } from "@/features/patients";
import { practitionerService, type Practitioner } from "@/features/practitioners";
import { useModal } from "@/hooks/useModal";
import { CalenderIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

export default function PatientDetails() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { patientId } = useParams();
  const editModal = useModal();
  const appointmentModal = useModal();
  const archiveModal = useModal();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const practitionerNames = useMemo(
    () => new Map(practitioners.map((practitioner) => [practitioner.id, practitioner.displayName])),
    [practitioners],
  );

  const load = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [patientRecord, history, practitionerData] = await Promise.all([
        patientService.findById(patientId),
        appointmentService.listByPatient(patientId),
        practitionerService.list(),
      ]);
      setPatient(patientRecord);
      setAppointments(history);
      setPractitioners(practitionerData);
    } catch {
      setError(t("clinic.patients.detailsLoadError"));
    } finally {
      setIsLoading(false);
    }
  }, [patientId, t]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(loadTimer);
  }, [load]);

  const savePatient = async (input: CreatePatientInput) => {
    if (!patient) return;
    setIsSavingPatient(true);
    setError(null);
    try {
      setPatient(await patientService.update(patient.id, input));
      editModal.closeModal();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("clinic.patients.saveError"));
    } finally {
      setIsSavingPatient(false);
    }
  };

  const saveAppointment = async (input: SaveAppointmentInput) => {
    setIsSavingAppointment(true);
    setError(null);
    try {
      await appointmentService.create(input);
      appointmentModal.closeModal();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error && saveError.message === "PATIENT_ARCHIVED" ? t("clinic.appointments.archivedPatientError") : saveError instanceof Error ? saveError.message : t("clinic.appointments.saveError"));
    } finally {
      setIsSavingAppointment(false);
    }
  };

  const archive = async () => {
    if (!patient) return;
    setIsArchiving(true);
    setError(null);
    try {
      await patientService.archive(patient.id);
      archiveModal.closeModal();
      await load();
    } catch {
      setError(t("clinic.patients.archiveError"));
    } finally {
      setIsArchiving(false);
    }
  };

  const dateFormatter = new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium" });
  const dateTimeFormatter = new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" });

  return <>
    <PageMeta title={`${patient?.fullName ?? t("clinic.patients.profileTitle")} | Clinic Desk`} description={t("clinic.modules.patients.description")} />
    <PageBreadCrumb pageTitle={t("clinic.patients.profileTitle")} />

    <section className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      {isLoading ? <p className="p-6 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.actions.loading")}</p> : error && !patient ? <div className="p-6"><p className="text-theme-sm text-error-600 dark:text-error-400">{error}</p><button type="button" onClick={() => navigate("/patients")} className="mt-5 rounded-lg bg-brand-500 px-4 py-3 text-theme-sm font-medium text-white hover:bg-brand-600">{t("clinic.patients.backToList")}</button></div> : !patient ? <div className="p-6"><p className="text-theme-sm text-error-600 dark:text-error-400">{t("clinic.patients.notFound")}</p><button type="button" onClick={() => navigate("/patients")} className="mt-5 rounded-lg bg-brand-500 px-4 py-3 text-theme-sm font-medium text-white hover:bg-brand-600">{t("clinic.patients.backToList")}</button></div> : <>
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{patient.fullName}</h1>{patient.archivedAt && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-theme-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">{t("clinic.patients.archived")}</span>}</div><p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{patient.id}</p></div>
          {!patient.archivedAt && <div className="flex flex-wrap gap-3"><button type="button" onClick={editModal.openModal} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"><PencilIcon className="size-4" />{t("clinic.actions.edit")}</button><button type="button" onClick={appointmentModal.openModal} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-theme-sm font-medium text-white hover:bg-brand-600"><PlusIcon className="size-4" />{t("clinic.patients.newAppointment")}</button></div>}
        </div>

        <div className="p-5 sm:p-6">
          {error && <p className="mb-5 rounded-lg bg-error-50 p-3 text-theme-sm text-error-600 dark:bg-error-500/15 dark:text-error-400">{error}</p>}
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label={t("clinic.patients.fields.phone")} value={patient.phone} />
            <Detail label={t("clinic.patients.fields.dateOfBirth")} value={patient.dateOfBirth ? dateFormatter.format(new Date(`${patient.dateOfBirth}T00:00:00`)) : null} />
            <Detail label={t("clinic.patients.fields.sex")} value={patient.sex ? t(`clinic.patients.sexOptions.${patient.sex}`) : null} />
            <Detail label={t("clinic.patients.fields.address")} value={patient.address} />
            <Detail label={t("clinic.patients.createdAt")} value={dateFormatter.format(new Date(patient.createdAt))} />
            {patient.archivedAt && <Detail label={t("clinic.patients.archivedAt")} value={dateFormatter.format(new Date(patient.archivedAt))} />}
          </dl>
          <div className="mt-7 rounded-xl border border-gray-200 p-4 dark:border-gray-800"><h2 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.patients.fields.notes")}</h2><p className="mt-2 whitespace-pre-line text-theme-sm text-gray-600 dark:text-gray-300">{patient.notes || t("clinic.patients.noNotes")}</p></div>

          <div className="mt-8"><div className="flex items-center gap-2"><CalenderIcon className="size-5 text-brand-500" /><h2 className="text-theme-lg font-semibold text-gray-800 dark:text-white/90">{t("clinic.patients.appointmentHistory")}</h2></div>{appointments.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-gray-300 p-5 text-theme-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">{t("clinic.patients.noAppointments")}</p> : <div className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">{appointments.map((appointment) => <div key={appointment.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-gray-800 dark:text-white/90">{dateTimeFormatter.format(new Date(appointment.startsAt))}</p><p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{practitionerNames.get(appointment.practitionerId) ?? "—"}{appointment.reason ? ` · ${appointment.reason}` : ""}</p></div><span className="w-fit rounded-full bg-brand-50 px-2.5 py-1 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">{t(`clinic.appointments.statuses.${appointment.status}`)}</span></div>)}</div>}</div>

          {!patient.archivedAt && <div className="mt-8 border-t border-gray-100 pt-6 dark:border-gray-800"><button type="button" onClick={archiveModal.openModal} disabled={isArchiving} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-theme-sm font-medium text-error-600 hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-error-400 dark:hover:bg-error-500/15"><TrashBinIcon className="size-4" />{t(isArchiving ? "clinic.patients.archiving" : "clinic.patients.archive")}</button></div>}
        </div>
      </>}
    </section>

    {patient && <><PatientFormModal isOpen={editModal.isOpen} patient={patient} error={error} isSaving={isSavingPatient} onClose={editModal.closeModal} onSave={savePatient} /><AppointmentFormModal isOpen={appointmentModal.isOpen} appointment={null} initialPatientId={patient.id} patients={[patient]} practitioners={practitioners} error={error} isSaving={isSavingAppointment} onClose={appointmentModal.closeModal} onSave={saveAppointment} /><Modal isOpen={archiveModal.isOpen} onClose={archiveModal.closeModal} closeLabel={t("common.close")} className="max-w-md"><div className="p-6"><h2 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.patients.archive")}</h2><p className="mt-3 text-theme-sm text-gray-600 dark:text-gray-300">{t("clinic.patients.archiveConfirm", { name: patient.fullName })}</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={archiveModal.closeModal} disabled={isArchiving} className="rounded-lg px-4 py-3 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/5">{t("clinic.actions.cancel")}</button><button type="button" onClick={() => void archive()} disabled={isArchiving} className="rounded-lg bg-error-500 px-4 py-3 text-theme-sm font-medium text-white hover:bg-error-600 disabled:opacity-50">{t(isArchiving ? "clinic.patients.archiving" : "clinic.patients.archive")}</button></div></div></Modal></>}
  </>;
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt><dd className="mt-1 text-theme-sm font-medium text-gray-800 dark:text-white/90">{value ?? "—"}</dd></div>;
}
