import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Button from "@/components/ui/button/Button";
import { isTauriRuntime } from "@/lib/runtime/isTauriRuntime";
import { getDatabase, resetDatabaseConnection } from "./client";

type State = "checking" | "ready" | "recovery";

export default function DatabaseRecoveryGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [state, setState] = useState<State>(isTauriRuntime() ? "checking" : "ready");
  const [resetting, setResetting] = useState(false);

  const checkDatabase = useCallback(async () => {
    try {
      await getDatabase();
      setState("ready");
    } catch {
      setState("recovery");
    }
  }, []);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    const timer = window.setTimeout(() => { void checkDatabase(); }, 0);
    return () => window.clearTimeout(timer);
  }, [checkDatabase]);

  const createNewWorkspace = async () => {
    setResetting(true);
    try {
      await invoke("reset_local_database");
      resetDatabaseConnection();
      setState("checking");
      await checkDatabase();
    } catch {
      setState("recovery");
    } finally {
      setResetting(false);
    }
  };

  if (state === "ready") return <>{children}</>;
  if (state === "checking") return <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-950"><p className="text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.databaseRecovery.checking")}</p></main>;

  return <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-950"><section className="w-full max-w-lg rounded-2xl border border-warning-200 bg-white p-6 shadow-theme-sm dark:border-warning-900 dark:bg-gray-900"><h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.databaseRecovery.title")}</h1><p className="mt-3 text-theme-sm text-gray-600 dark:text-gray-300">{t("clinic.databaseRecovery.description")}</p><p className="mt-3 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.databaseRecovery.backupNotice")}</p><div className="mt-6 flex flex-wrap gap-3"><Button size="sm" onClick={() => void createNewWorkspace()} disabled={resetting}>{t(resetting ? "clinic.databaseRecovery.creating" : "clinic.databaseRecovery.createNew")}</Button><Button size="sm" variant="outline" onClick={() => void getCurrentWindow().close()} disabled={resetting}>{t("clinic.databaseRecovery.close")}</Button></div></section></main>;
}
