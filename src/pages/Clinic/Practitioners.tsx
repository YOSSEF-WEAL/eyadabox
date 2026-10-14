import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { practitionerService, type Practitioner } from "@/features/practitioners";
import { EyeIcon, PencilIcon, PlusIcon } from "@/icons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export default function Practitioners() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const load = useCallback(async () => {
    setIsLoading(true);
    try { setPractitioners(await practitionerService.list()); }
    catch { setError(t("clinic.practitioners.loadError")); }
    finally { setIsLoading(false); }
  }, [t]);
  useEffect(() => { void load(); }, [load]);

  return <>
    <PageMeta title={`${t("clinic.modules.practitioners.title")} | Clinic Desk`} description={t("clinic.modules.practitioners.description")} />
    <PageBreadCrumb pageTitle={t("clinic.modules.practitioners.title")} />
    <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        <div><h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.modules.practitioners.title")}</h1><p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.modules.practitioners.description")}</p></div>
        <button type="button" onClick={() => navigate("/practitioners/new")} className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-theme-sm font-medium text-white hover:bg-brand-600"><PlusIcon className="size-4" />{t("clinic.practitioners.addPractitioner")}</button>
      </div>
      {error && <p className="m-5 rounded-lg bg-error-50 p-3 text-theme-sm text-error-600 dark:bg-error-500/15 dark:text-error-400">{error}</p>}
      {isLoading ? <p className="py-14 text-center text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.actions.loading")}</p> : <div className="overflow-x-auto"><table className="min-w-full"><thead className="border-y border-gray-100 dark:border-gray-800"><tr>{["name", "specialty", "phone", "workingHours", "actions"].map((column) => <th key={column} className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t(`clinic.practitioners.columns.${column}`)}</th>)}</tr></thead><tbody className="divide-y divide-gray-100 dark:divide-gray-800">{practitioners.map((practitioner) => <tr key={practitioner.id}><td className="px-5 py-4 text-theme-sm font-medium text-gray-800 dark:text-white/90">{practitioner.displayName}</td><td className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">{practitioner.specialty}</td><td className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">{practitioner.phone ?? "—"}</td><td className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">{t("clinic.practitioners.workingHours.daysCount", { count: practitioner.workingHours.filter((day) => day.isWorking).length })}</td><td className="px-5 py-4"><div className="flex items-center gap-1"><button type="button" onClick={() => navigate(`/practitioners/${practitioner.id}`)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-theme-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"><EyeIcon className="size-4" />{t("clinic.actions.view")}</button><button type="button" onClick={() => navigate(`/practitioners/${practitioner.id}/edit`)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-theme-sm font-medium text-brand-500 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/15"><PencilIcon className="size-4" />{t("clinic.actions.edit")}</button></div></td></tr>)}</tbody></table></div>}
    </section>
  </>;
}
