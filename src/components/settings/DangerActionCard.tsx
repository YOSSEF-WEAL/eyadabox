import { useTranslation } from "react-i18next";

export type DangerRisk = "medium" | "high" | "critical";

interface DangerActionCardProps {
  title: string;
  description: string;
  risk: DangerRisk;
  onTrigger: () => void;
  disabled?: boolean;
}

const riskBadge: Record<DangerRisk, string> = {
  medium: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400",
  high: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400",
  critical: "bg-error-500 text-white",
};

const riskBorder: Record<DangerRisk, string> = {
  medium: "hover:border-warning-300 dark:hover:border-warning-500/50",
  high: "hover:border-error-300 dark:hover:border-error-500/50",
  critical: "border-error-300 dark:border-error-500/50",
};

export default function DangerActionCard({ title, description, risk, onTrigger, disabled = false }: DangerActionCardProps) {
  const { t } = useTranslation();

  return (
    <div className={`flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4 transition dark:border-gray-800 dark:bg-white/[0.03] ${riskBorder[risk]}`}>
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{title}</h4>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-theme-xs font-medium ${riskBadge[risk]}`}>{t(`clinic.danger.risk.${risk}`)}</span>
      </div>
      <p className="mt-2 flex-1 text-theme-sm text-gray-500 dark:text-gray-400">{description}</p>
      <button type="button" onClick={onTrigger} disabled={disabled} className="mt-4 inline-flex items-center justify-center rounded-lg bg-error-500 px-4 py-2.5 text-theme-sm font-medium text-white transition hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
        {t("clinic.danger.runAction")}
      </button>
    </div>
  );
}
