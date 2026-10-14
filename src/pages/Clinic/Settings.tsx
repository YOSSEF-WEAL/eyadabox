import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { clinicSettingsService, type ClinicSettings } from "@/features/settings";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function Settings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => { try { setSettings(await clinicSettingsService.get()); } catch { setError(t("clinic.settings.loadError")); } }, [t]);
  useEffect(() => { void load(); }, [load]);
  const setValue = <Key extends keyof ClinicSettings>(key: Key, value: ClinicSettings[Key]) => setSettings((current) => current ? { ...current, [key]: value } : current);
  const save = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!settings) return; setSaving(true); setError(null); setSuccess(false); try { setSettings(await clinicSettingsService.save(settings)); setSuccess(true); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : t("clinic.settings.saveError")); } finally { setSaving(false); } };

  return <><PageMeta title={`${t("clinic.modules.settings.title")} | Clinic Desk`} description={t("clinic.modules.settings.description")} /><PageBreadCrumb pageTitle={t("clinic.modules.settings.title")} />
    <section className="max-w-3xl rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3"><div className="border-b border-gray-100 p-5 dark:border-gray-800"><h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.settings.title")}</h1><p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.settings.description")}</p></div>{!settings ? <p className="p-6 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.actions.loading")}</p> : <form onSubmit={save} className="p-5 sm:p-6"><div className="grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><Label htmlFor="clinic-name">{t("clinic.settings.fields.name")}</Label><Input id="clinic-name" value={settings.clinicName} onChange={(event) => setValue("clinicName", event.target.value)} required /></div><div><Label htmlFor="clinic-phone">{t("clinic.settings.fields.phone")}</Label><Input id="clinic-phone" inputMode="tel" value={settings.phone} onChange={(event) => setValue("phone", event.target.value)} /></div><div><Label htmlFor="clinic-duration">{t("clinic.settings.fields.duration")}</Label><Input id="clinic-duration" type="number" min={5} max={480} value={settings.defaultAppointmentMinutes} onChange={(event) => setValue("defaultAppointmentMinutes", Number(event.target.value))} required /></div><div className="sm:col-span-2"><Label htmlFor="clinic-address">{t("clinic.settings.fields.address")}</Label><Input id="clinic-address" value={settings.address} onChange={(event) => setValue("address", event.target.value)} /></div></div>{error && <p className="mt-5 rounded-lg bg-error-50 p-3 text-theme-sm text-error-600 dark:bg-error-500/15 dark:text-error-400">{error}</p>}{success && <p className="mt-5 rounded-lg bg-success-50 p-3 text-theme-sm text-success-600 dark:bg-success-500/15 dark:text-success-400">{t("clinic.settings.saved")}</p>}<div className="mt-7 flex justify-end"><button type="submit" disabled={saving} className="rounded-lg bg-brand-500 px-4 py-3 text-theme-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50">{t(saving ? "clinic.actions.saving" : "clinic.actions.save")}</button></div></form>}</section>
  </>;
}
