import { useTranslation } from "react-i18next";

interface DangerExportCardProps {
  busy: boolean;
  activeKind: "patients" | "appointments" | null;
  onExport: (kind: "patients" | "appointments") => void;
}

export default function DangerExportCard({ busy, activeKind, onExport }: DangerExportCardProps) {
  const { t } = useTranslation();

  const buttonClass = "inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-theme-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5";

  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.danger.exportTitle")}</h3>
      <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.danger.exportDescription")}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => onExport("patients")} disabled={busy} className={buttonClass}>{activeKind === "patients" ? t("clinic.danger.exporting") : t("clinic.danger.exportPatients")}</button>
        <button type="button" onClick={() => onExport("appointments")} disabled={busy} className={buttonClass}>{activeKind === "appointments" ? t("clinic.danger.exporting") : t("clinic.danger.exportAppointments")}</button>
      </div>
    </div>
  );
}
