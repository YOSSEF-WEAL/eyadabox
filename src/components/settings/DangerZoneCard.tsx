import DangerActionCard, { type DangerRisk } from "@/components/settings/DangerActionCard";
import DangerConfirmDialog from "@/components/settings/DangerConfirmDialog";
import DangerExportCard from "@/components/settings/DangerExportCard";
import { isTauriRuntime } from "@/lib/runtime/isTauriRuntime";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Action = "appointments" | "patients" | "practitioners" | "operational" | "factory_reset";
type Backup = { name: string };
type Dialog = { kind: "action"; action: Action } | { kind: "backup" };

const DATA_ACTIONS: Array<{ action: Action; risk: DangerRisk }> = [
  { action: "appointments", risk: "medium" },
  { action: "patients", risk: "high" },
  { action: "practitioners", risk: "high" },
];
const CRITICAL_ACTIONS: Array<{ action: Action; risk: DangerRisk }> = [
  { action: "operational", risk: "high" },
  { action: "factory_reset", risk: "critical" },
];

export default function DangerZoneCard() {
  const { t } = useTranslation();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [backupsState, setBackupsState] = useState<"loading" | "ready" | "error">("loading");
  const [backupName, setBackupName] = useState("");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [exportKind, setExportKind] = useState<"patients" | "appointments" | null>(null);

  const loadBackups = useCallback(async () => {
    setBackupsState("loading");
    try {
      const items = await invoke<Backup[]>("list_local_backups");
      setBackups(items);
      setBackupName((current) => (items.some((item) => item.name === current) ? current : (items[0]?.name ?? "")));
      setBackupsState("ready");
    } catch {
      setBackupsState("error");
    }
  }, []);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    void loadBackups();
  }, [loadBackups]);

  if (!isTauriRuntime()) return null;

  const openDialog = (next: Dialog) => {
    setDialogError(null);
    setDialog(next);
  };
  const closeDialog = () => {
    if (busy) return;
    setDialog(null);
    setDialogError(null);
  };
  const confirm = async () => {
    if (!dialog || busy) return;
    setBusy(true);
    setDialogError(null);
    try {
      if (dialog.kind === "action") {
        const backup = await invoke<string>("danger_zone_action", { action: dialog.action, confirmation: "DELETE" });
        setNotice({ tone: "success", text: t("clinic.danger.success", { backup }) });
        setDialog(null);
        await loadBackups();
      } else {
        await invoke("delete_local_backup", { backupName, confirmation: "DELETE" });
        setNotice({ tone: "success", text: t("clinic.danger.backupDeleted") });
        setDialog(null);
        await loadBackups();
      }
    } catch {
      setDialogError(t("clinic.danger.error"));
    } finally {
      setBusy(false);
    }
  };
  const exportData = async (kind: "patients" | "appointments") => {
    setExportKind(kind);
    setNotice(null);
    try {
      const file = await invoke<string>("export_clinic_data", { kind });
      setNotice({ tone: "success", text: t("clinic.danger.exported", { file }) });
    } catch {
      setNotice({ tone: "error", text: t("clinic.danger.error") });
    } finally {
      setExportKind(null);
    }
  };

  const disabled = busy || exportKind !== null;
  const dialogTitle = dialog?.kind === "action" ? t(`clinic.danger.actions.${dialog.action}.title`) : t("clinic.danger.deleteBackup");
  const dialogDescription = dialog?.kind === "action" ? t(`clinic.danger.actions.${dialog.action}.description`) : t("clinic.danger.backupDescription");
  const dialogSentence = t("clinic.danger.confirmDescription", { action: dialog?.kind === "backup" ? backupName : dialogTitle });
  const dialogConfirm = dialog?.kind === "backup" ? t("clinic.danger.deleteBackup") : t("clinic.danger.confirmAction");

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-error-200 bg-white dark:border-error-500/30 dark:bg-white/[0.03]">
      <div className="border-b border-error-100 bg-error-50 px-5 py-5 dark:border-error-500/20 dark:bg-error-500/10">
        <p className="text-theme-xs font-semibold uppercase tracking-wide text-error-600 dark:text-error-400">{t("clinic.danger.eyebrow")}</p>
        <h2 className="mt-1 text-title-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.danger.title")}</h2>
        <p className="mt-1 max-w-2xl text-theme-sm text-gray-600 dark:text-gray-300">{t("clinic.danger.description")}</p>
      </div>

      <div className="space-y-7 p-5 sm:p-6">
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-500/30 dark:bg-warning-500/10">
          <p className="text-theme-sm font-semibold text-warning-700 dark:text-orange-400">{t("clinic.danger.notice.title")}</p>
          <p className="mt-1 text-theme-sm text-gray-600 dark:text-gray-300">{t("clinic.danger.notice.body")}</p>
        </div>

        {notice && (
          <p aria-live="polite" className={notice.tone === "error" ? "rounded-lg bg-error-50 p-3 text-theme-sm text-error-600 dark:bg-error-500/15 dark:text-error-400" : "rounded-lg bg-success-50 p-3 text-theme-sm text-success-600 dark:bg-success-500/15 dark:text-success-400"}>{notice.text}</p>
        )}

        <div>
          <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.danger.tiers.high.title")}</h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.danger.tiers.high.description")}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DATA_ACTIONS.map((item) => (
              <DangerActionCard key={item.action} title={t(`clinic.danger.actions.${item.action}.title`)} description={t(`clinic.danger.actions.${item.action}.description`)} risk={item.risk} disabled={disabled} onTrigger={() => openDialog({ kind: "action", action: item.action })} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.danger.tiers.critical.title")}</h3>
          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.danger.tiers.critical.description")}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {CRITICAL_ACTIONS.map((item) => (
              <DangerActionCard key={item.action} title={t(`clinic.danger.actions.${item.action}.title`)} description={t(`clinic.danger.actions.${item.action}.description`)} risk={item.risk} disabled={disabled} onTrigger={() => openDialog({ kind: "action", action: item.action })} />
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <DangerExportCard busy={disabled} activeKind={exportKind} onExport={exportData} />

          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.danger.backupTitle")}</h3>
            <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.danger.backupDescription")}</p>
            {backupsState === "error" ? (
              <p className="mt-4 rounded-lg bg-error-50 p-3 text-theme-sm text-error-600 dark:bg-error-500/15 dark:text-error-400">{t("clinic.danger.backupsError")}</p>
            ) : (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="min-w-0 flex-1 text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  <span className="mb-2 block">{t("clinic.danger.selectBackup")}</span>
                  <select value={backupName} onChange={(event) => setBackupName(event.target.value)} disabled={backupsState === "loading" || backups.length === 0 || disabled} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50">
                    {backups.length === 0 ? <option value="">{t("clinic.danger.noBackups")}</option> : backups.map((backup) => <option key={backup.name} value={backup.name}>{backup.name}</option>)}
                  </select>
                </label>
                <button type="button" onClick={() => openDialog({ kind: "backup" })} disabled={!backupName || backupsState !== "ready" || disabled} className="rounded-lg border border-error-300 px-4 py-3 text-theme-sm font-medium text-error-600 transition hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-error-500/50 dark:text-error-400 dark:hover:bg-error-500/10">{t("clinic.danger.deleteBackup")}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <DangerConfirmDialog isOpen={dialog !== null} title={dialogTitle} description={dialogDescription} sentence={dialogSentence} confirmAction={dialogConfirm} busy={busy} error={dialogError} onCancel={closeDialog} onConfirm={() => void confirm()} />
    </section>
  );
}
