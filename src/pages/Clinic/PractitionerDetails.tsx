import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { practitionerService, type Practitioner } from "@/features/practitioners";
import { PencilIcon } from "@/icons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

export default function PractitionerDetails() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { practitionerId } = useParams();
  const [practitioner, setPractitioner] = useState<Practitioner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const load = useCallback(async () => {
    if (!practitionerId) return;
    setPractitioner(await practitionerService.findById(practitionerId));
    setIsLoading(false);
  }, [practitionerId]);
  useEffect(() => { void load(); }, [load]);

  return <>
    <PageMeta title={`${practitioner?.displayName ?? t("clinic.practitioners.viewTitle")} | Clinic Desk`} description={t("clinic.modules.practitioners.description")} />
    <PageBreadCrumb pageTitle={t("clinic.practitioners.viewTitle")} />
    <section className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      {isLoading ? <p className="p-6 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.actions.loading")}</p> : !practitioner ? <div className="p-6"><p className="text-theme-sm text-error-600 dark:text-error-400">{t("clinic.practitioners.notFound")}</p><button type="button" onClick={() => navigate("/practitioners")} className="mt-5 rounded-lg bg-brand-500 px-4 py-3 text-theme-sm font-medium text-white hover:bg-brand-600">{t("clinic.practitioners.backToList")}</button></div> : <>
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800"><div><h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{practitioner.displayName}</h1><p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{practitioner.specialty}</p></div><button type="button" onClick={() => navigate(`/practitioners/${practitioner.id}/edit`)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-theme-sm font-medium text-white hover:bg-brand-600"><PencilIcon className="size-4" />{t("clinic.actions.edit")}</button></div>
        <div className="p-5 sm:p-6"><dl className="grid gap-5 sm:grid-cols-2"><div><dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("clinic.practitioners.fields.phone")}</dt><dd className="mt-1 text-theme-sm font-medium text-gray-800 dark:text-white/90">{practitioner.phone ?? "—"}</dd></div><div><dt className="text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("clinic.practitioners.workingHours.title")}</dt><dd className="mt-1 text-theme-sm font-medium text-gray-800 dark:text-white/90">{t("clinic.practitioners.workingHours.daysCount", { count: practitioner.workingHours.filter((day) => day.isWorking).length })}</dd></div></dl><div className="mt-8"><h2 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.practitioners.workingHours.title")}</h2><div className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">{practitioner.workingHours.map((day) => <div key={day.day} className="flex items-center justify-between gap-4 p-4"><span className="text-theme-sm font-medium text-gray-700 dark:text-gray-300">{t(`clinic.practitioners.days.${day.day}`)}</span><span className="text-theme-sm text-gray-600 dark:text-gray-300">{day.isWorking ? `${day.startsAt} – ${day.endsAt}` : t("clinic.practitioners.workingHours.unavailable")}</span></div>)}</div></div></div>
      </>}
    </section>
  </>;
}
