import { isTauriRuntime } from "@/lib/runtime/isTauriRuntime";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type BackupInfo = { name: string };

export default function DatabaseBackupCard() {
  const { t } = useTranslation();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [selected, setSelected] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "creating" | "restoring" | "error" | "success">("loading");

  const load = useCallback(async () => {
    if (!isTauriRuntime()) return;
    setState("loading");
    try {
      const items = await invoke<BackupInfo[]>("list_local_backups");
      setBackups(items);
      setSelected((current) => items.some((item) => item.name === current) ? current : (items[0]?.name ?? ""));
      setState("idle");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createBackup = async () => {
    setState("creating");
    try {
      const backup = await invoke<BackupInfo>("create_local_backup");
      setBackups((current) => [backup, ...current.filter((item) => item.name !== backup.name)]);
      setSelected(backup.name);
      setState("success");
    } catch {
      setState("error");
    }
  };

  const restore = async () => {
    if (!selected || !window.confirm(t("clinic.backups.restoreConfirm"))) return;
    setState("restoring");
    try {
      await invoke("schedule_local_restore", { backupName: selected });
    } catch {
      setState("error");
    }
  };

  if (!isTauriRuntime()) return null;

  const message = state === "loading" ? t("clinic.backups.loading")
    : state === "creating" ? t("clinic.backups.creating")
      : state === "restoring" ? t("clinic.backups.restoring")
        : state === "success" ? t("clinic.backups.created")
          : state === "error" ? t("clinic.backups.error") : t("clinic.backups.description");

  return <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
    <h2 className="text-theme-lg font-semibold text-gray-800 dark:text-white/90">{t("clinic.backups.title")}</h2>
    <p className={state === "error" ? "mt-1 text-theme-sm text-error-600" : state === "success" ? "mt-1 text-theme-sm text-success-600" : "mt-1 text-theme-sm text-gray-500 dark:text-gray-400"}>{message}</p>
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="min-w-0 flex-1 text-theme-sm font-medium text-gray-700 dark:text-gray-300">
        <span className="mb-2 block">{t("clinic.backups.available")}</span>
        <select value={selected} onChange={(event) => setSelected(event.target.value)} disabled={state === "loading" || state === "creating" || state === "restoring" || backups.length === 0} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-theme-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 disabled:opacity-50">
          {backups.length === 0 ? <option value="">{t("clinic.backups.empty")}</option> : backups.map((backup) => <option key={backup.name} value={backup.name}>{backup.name}</option>)}
        </select>
      </label>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => void createBackup()} disabled={state === "loading" || state === "creating" || state === "restoring"} className="rounded-lg border border-gray-300 px-4 py-2.5 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">{t("clinic.backups.create")}</button>
        <button type="button" onClick={() => void restore()} disabled={!selected || state === "loading" || state === "creating" || state === "restoring"} className="rounded-lg bg-error-500 px-4 py-2.5 text-theme-sm font-medium text-white hover:bg-error-600 disabled:opacity-50">{t("clinic.backups.restore")}</button>
      </div>
    </div>
  </section>;
}
