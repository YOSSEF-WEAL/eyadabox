import type { PatientSearchMode } from "@/features/patients";
import { SearchIcon } from "@/icons";
import { useTranslation } from "react-i18next";

type Props = { query: string; mode: PatientSearchMode; onQueryChange: (value: string) => void; onModeChange: (mode: PatientSearchMode) => void };

export default function PatientSearchControls({ query, mode, onQueryChange, onModeChange }: Props) {
  const { t } = useTranslation();
  return <div className="space-y-3"><div className="flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800"><button type="button" onClick={() => onModeChange("name")} className={`flex-1 rounded-md px-3 py-2 text-theme-sm font-medium ${mode === "name" ? "bg-white text-brand-600 shadow-theme-xs dark:bg-gray-700 dark:text-brand-400" : "text-gray-500 dark:text-gray-400"}`}>{t("clinic.patients.searchByName")}</button><button type="button" onClick={() => onModeChange("phone")} className={`flex-1 rounded-md px-3 py-2 text-theme-sm font-medium ${mode === "phone" ? "bg-white text-brand-600 shadow-theme-xs dark:bg-gray-700 dark:text-brand-400" : "text-gray-500 dark:text-gray-400"}`}>{t("clinic.patients.searchByPhone")}</button></div><div className="relative"><SearchIcon className="pointer-events-none absolute inset-s-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={t(mode === "name" ? "clinic.patients.searchNamePlaceholder" : "clinic.patients.searchPhonePlaceholder")} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 ps-12 pe-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800" /></div></div>;
}
