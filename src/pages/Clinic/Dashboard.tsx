import PageMeta from "@/components/common/PageMeta";
import { appointmentService, type Appointment } from "@/features/appointments";
import { patientService, type Patient } from "@/features/patients";
import { CalenderIcon, CheckCircleIcon, GroupIcon, TimeIcon } from "@/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

function isSameDay(value: string, target: Date) {
  const date = new Date(value);
  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth() && date.getDate() === target.getDate();
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [appointmentData, patientData] = await Promise.all([appointmentService.list(), patientService.search("")]);
      setAppointments(appointmentData);
      setPatients(patientData);
    } catch {
      setError(t("clinic.dashboard.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  const patientNames = useMemo(() => new Map(patients.map((patient) => [patient.id, patient.fullName])), [patients]);
  const metrics = useMemo(() => {
    const today = new Date();
    const todayAppointments = appointments.filter((appointment) => isSameDay(appointment.startsAt, today) && appointment.status !== "cancelled");
    return {
      todayAppointments: todayAppointments.length,
      waitingPatients: todayAppointments.filter((appointment) => appointment.status === "arrived").length,
      completedVisits: todayAppointments.filter((appointment) => appointment.status === "completed").length,
      newPatients: patients.filter((patient) => isSameDay(patient.createdAt, today)).length,
    };
  }, [appointments, patients]);

  const nextAppointments = useMemo(() => {
    const today = new Date();
    return appointments.filter((appointment) => appointment.status !== "cancelled" && appointment.status !== "completed" && new Date(appointment.startsAt) >= new Date(today.getFullYear(), today.getMonth(), today.getDate())).slice(0, 5);
  }, [appointments]);

  const formatter = new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-EG" : "en-GB", { weekday: "short", hour: "numeric", minute: "2-digit" });
  const metricCards = [
    { key: "todayAppointments", Icon: CalenderIcon },
    { key: "waitingPatients", Icon: TimeIcon },
    { key: "completedVisits", Icon: CheckCircleIcon },
    { key: "newPatients", Icon: GroupIcon },
  ] as const;

  return <>
    <PageMeta title={`${t("clinic.dashboard.title")} | Clinic Desk`} description={t("clinic.dashboard.description")} />
    <div className="mb-6">
      <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">{t("clinic.dashboard.title")}</h1>
      <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.dashboard.description")}</p>
    </div>

    {error && <p className="mb-6 rounded-lg bg-error-50 p-3 text-theme-sm text-error-600 dark:bg-error-500/15 dark:text-error-400">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metricCards.map(({ key, Icon }) => <article key={key} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"><Icon className="size-5" /></div>
        <p className="mt-5 text-theme-sm text-gray-500 dark:text-gray-400">{t(`clinic.dashboard.${key}`)}</p>
        <p className="mt-1 text-title-sm font-semibold text-gray-800 dark:text-white/90">{isLoading ? "—" : metrics[key]}</p>
      </article>)}
    </div>

    <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
      <h2 className="text-theme-xl font-semibold text-gray-800 dark:text-white/90">{t("clinic.dashboard.nextAppointments")}</h2>
      {isLoading ? <p className="py-14 text-center text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.actions.loading")}</p> : nextAppointments.length === 0 ? <div className="py-14 text-center"><h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.dashboard.emptyScheduleTitle")}</h3><p className="mx-auto mt-2 max-w-md text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.dashboard.emptyScheduleDescription")}</p></div> : <div className="mt-5 divide-y divide-gray-100 dark:divide-gray-800">
        {nextAppointments.map((appointment) => <div key={appointment.id} className="flex items-center justify-between gap-4 py-4">
          <div><p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{patientNames.get(appointment.patientId) ?? t("clinic.appointments.unknownPatient")}</p><p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{appointment.reason ?? t("clinic.dashboard.noReason")}</p></div>
          <time className="shrink-0 text-end text-theme-sm font-medium text-brand-600 dark:text-brand-400">{formatter.format(new Date(appointment.startsAt))}</time>
        </div>)}
      </div>}
    </section>
  </>;
}
