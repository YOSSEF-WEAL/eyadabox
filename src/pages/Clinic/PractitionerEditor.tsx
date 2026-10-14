import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { practitionerService, type Practitioner, type SavePractitionerInput, type WorkingDay } from "@/features/practitioners";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

const defaultWorkingHours = (): WorkingDay[] => Array.from({ length: 7 }, (_, day) => ({ day, isWorking: day !== 5, startsAt: "09:00", endsAt: "17:00" }));

export default function PractitionerEditor() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { practitionerId } = useParams();
  const isEdit = Boolean(practitionerId);
  const [form, setForm] = useState<SavePractitionerInput>({ displayName: "", specialty: "", phone: "", workingHours: defaultWorkingHours() });
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!practitionerId) return;
    try {
      const practitioner = await practitionerService.findById(practitionerId);
      if (!practitioner) { setError(t("clinic.practitioners.notFound")); return; }
      setForm({ displayName: practitioner.displayName, specialty: practitioner.specialty, phone: practitioner.phone ?? "", workingHours: practitioner.workingHours });
    } catch { setError(t("clinic.practitioners.loadError")); }
    finally { setIsLoading(false); }
  }, [practitionerId, t]);
  useEffect(() => { void load(); }, [load]);

  const updateWorkingDay = (day: number, changes: Partial<WorkingDay>) => setForm((current) => ({ ...current, workingHours: current.workingHours.map((item) => item.day === day ? { ...item, ...changes } : item) }));
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true); setError(null);
    try {
      const practitioner = practitionerId ? await practitionerService.update(practitionerId, form) : await practitionerService.create(form);
      navigate(`/practitioners/${practitioner.id}`);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : t("clinic.practitioners.saveError")); }
    finally { setIsSaving(false); }
  };

  return <>
    <PageMeta title={`${t(isEdit ? "clinic.practitioners.editTitle" : "clinic.practitioners.addTitle")} | Clinic Desk`} description={t("clinic.modules.practitioners.description")} />
    <PageBreadCrumb pageTitle={t(isEdit ? "clinic.practitioners.editTitle" : "clinic.practitioners.addTitle")} />
    <form onSubmit={save} className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      <div className="border-b border-gray-100 p-5 dark:border-gray-800"><h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{t(isEdit ? "clinic.practitioners.editTitle" : "clinic.practitioners.addTitle")}</h1><p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.practitioners.workingHours.description")}</p></div>
      {isLoading ? <p className="p-6 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.actions.loading")}</p> : <div className="p-5 sm:p-6">
        {error && <p className="mb-5 rounded-lg bg-error-50 p-3 text-theme-sm text-error-600 dark:bg-error-500/15 dark:text-error-400">{error}</p>}
        <div className="grid gap-5 sm:grid-cols-2"><div><Label htmlFor="practitioner-name">{t("clinic.practitioners.fields.name")}</Label><Input id="practitioner-name" value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} required /></div><div><Label htmlFor="practitioner-specialty">{t("clinic.practitioners.fields.specialty")}</Label><Input id="practitioner-specialty" value={form.specialty} onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value }))} required /></div><div className="sm:col-span-2"><Label htmlFor="practitioner-phone">{t("clinic.practitioners.fields.phone")}</Label><Input id="practitioner-phone" inputMode="tel" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></div></div>
        <fieldset className="mt-8"><legend className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.practitioners.workingHours.title")}</legend><div className="mt-4 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">{form.workingHours.map((workingDay) => <div key={workingDay.day} className="grid items-center gap-3 p-3 sm:grid-cols-[minmax(130px,1fr)_auto_auto]"><label className="flex items-center gap-3 text-theme-sm font-medium text-gray-700 dark:text-gray-300"><input type="checkbox" checked={workingDay.isWorking} onChange={(event) => updateWorkingDay(workingDay.day, { isWorking: event.target.checked })} className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700" />{t(`clinic.practitioners.days.${workingDay.day}`)}</label><Input aria-label={t("clinic.practitioners.workingHours.start")} type="time" value={workingDay.startsAt} disabled={!workingDay.isWorking} onChange={(event) => updateWorkingDay(workingDay.day, { startsAt: event.target.value })} /><Input aria-label={t("clinic.practitioners.workingHours.end")} type="time" value={workingDay.endsAt} disabled={!workingDay.isWorking} onChange={(event) => updateWorkingDay(workingDay.day, { endsAt: event.target.value })} /></div>)}</div></fieldset>
        <div className="mt-8 flex justify-end gap-3"><button type="button" onClick={() => navigate("/practitioners")} className="rounded-lg px-4 py-3 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5">{t("clinic.actions.cancel")}</button><button type="submit" disabled={isSaving} className="rounded-lg bg-brand-500 px-4 py-3 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">{t(isSaving ? "clinic.actions.saving" : "clinic.actions.save")}</button></div>
      </div>}
    </form>
  </>;
}
