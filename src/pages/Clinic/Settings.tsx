import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import AppUpdateCard from "@/components/settings/AppUpdateCard";
import DatabaseBackupCard from "@/components/settings/DatabaseBackupCard";
import DangerZoneCard from "@/components/settings/DangerZoneCard";
import { clinicSettingsService, type ClinicSettings } from "@/features/settings";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type SettingsTab = "clinic" | "updates" | "backups" | "danger";

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>("clinic");
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const tabs: SettingsTab[] = ["clinic", "updates", "backups", "danger"];

  const load = useCallback(async () => {
    try { setSettings(await clinicSettingsService.get()); }
    catch { setError(t("clinic.settings.loadError")); }
  }, [t]);
  useEffect(() => { void load(); }, [load]);

  const setValue = <Key extends keyof ClinicSettings>(key: Key, value: ClinicSettings[Key]) => {
    setSettings((current) => current ? { ...current, [key]: value } : current);
  };
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;
    setSaving(true); setError(null); setSuccess(false);
    try { setSettings(await clinicSettingsService.save(settings)); setSuccess(true); }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : t("clinic.settings.saveError")); }
    finally { setSaving(false); }
  };
  const fields: Array<{ key: keyof ClinicSettings; id: string; label: string; type?: string; min?: number; max?: number }> = [
    { key: "clinicName", id: "clinic-name", label: t("clinic.settings.fields.name") },
    { key: "phone", id: "clinic-phone", label: t("clinic.settings.fields.phone") },
    { key: "address", id: "clinic-address", label: t("clinic.settings.fields.address") },
    { key: "defaultAppointmentMinutes", id: "clinic-duration", label: t("clinic.settings.fields.duration"), type: "number", min: 5, max: 480 },
    { key: "sessionExpiryDays", id: "session-expiry", label: t("clinic.settings.fields.sessionExpiryDays"), type: "number", min: 1, max: 365 },
  ];

  return <>
    <PageMeta title={`${t("clinic.modules.settings.title")} | Clinic Desk`} description={t("clinic.modules.settings.description")} />
    <PageBreadCrumb pageTitle={t("clinic.modules.settings.title")} />
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      <div className="border-b border-gray-100 px-5 py-5 dark:border-gray-800 sm:px-6">
        <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.modules.settings.title")}</h1>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.settings.description")}</p>
      </div>
      <div className="border-b border-gray-100 px-3 py-3 dark:border-gray-800 sm:px-6">
        <div role="tablist" aria-label={t("clinic.settings.tabs.label")} className="flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const selected = activeTab === tab;
            return <button key={tab} id={`settings-tab-${tab}`} type="button" role="tab" aria-selected={selected} aria-controls={`settings-panel-${tab}`} onClick={() => setActiveTab(tab)} className={`shrink-0 rounded-lg px-4 py-2.5 text-theme-sm font-medium transition ${selected ? "bg-brand-500 text-white shadow-theme-xs" : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"}`}>{t(`clinic.settings.tabs.${tab}`)}</button>;
          })}
        </div>
      </div>
      <div className="p-5 sm:p-6">
        {activeTab === "clinic" && <div id="settings-panel-clinic" role="tabpanel" aria-labelledby="settings-tab-clinic" className="max-w-3xl">
          <h2 className="text-theme-lg font-semibold text-gray-800 dark:text-white/90">{t("clinic.settings.title")}</h2>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.settings.tabs.clinicDescription")}</p>
          {!settings ? <p className="py-8 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.actions.loading")}</p> : <form onSubmit={save} className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2">{fields.map((field) => <div key={field.key} className={field.key === "clinicName" || field.key === "address" ? "sm:col-span-2" : ""}><Label htmlFor={field.id}>{field.label}</Label><Input id={field.id} type={field.type} min={field.min} max={field.max} inputMode={field.key === "phone" ? "tel" : undefined} value={settings[field.key]} onChange={(event) => setValue(field.key, field.type === "number" ? Number(event.target.value) : event.target.value)} required={field.key === "clinicName" || field.key === "defaultAppointmentMinutes" || field.key === "sessionExpiryDays"} /></div>)}</div>
            {error && <p className="mt-5 rounded-lg bg-error-50 p-3 text-theme-sm text-error-600 dark:bg-error-500/15 dark:text-error-400">{error}</p>}
            {success && <p className="mt-5 rounded-lg bg-success-50 p-3 text-theme-sm text-success-600 dark:bg-success-500/15 dark:text-success-400">{t("clinic.settings.saved")}</p>}
            <div className="mt-7 flex justify-end"><button type="submit" disabled={saving} className="rounded-lg bg-brand-500 px-4 py-3 text-theme-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">{t(saving ? "clinic.actions.saving" : "clinic.actions.save")}</button></div>
          </form>}
        </div>}
        {activeTab === "updates" && <div id="settings-panel-updates" role="tabpanel" aria-labelledby="settings-tab-updates"><AppUpdateCard /></div>}
        {activeTab === "backups" && <div id="settings-panel-backups" role="tabpanel" aria-labelledby="settings-tab-backups"><DatabaseBackupCard /></div>}
        {activeTab === "danger" && <div id="settings-panel-danger" role="tabpanel" aria-labelledby="settings-tab-danger"><DangerZoneCard /></div>}
      </div>
    </section>
  </>;
}
