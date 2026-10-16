import { appointmentService, type Appointment } from "@/features/appointments";
import { patientService, type Patient } from "@/features/patients";
import { SearchIcon } from "@/icons";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

type SearchState = { patients: Patient[]; appointments: Appointment[] };

export default function GlobalClinicSearch() {
  const { t, i18n } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchState>({ patients: [], appointments: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); inputRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (!value) { setResult({ patients: [], appointments: [] }); setIsLoading(false); return; }
    let active = true;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      void Promise.all([patientService.search(value, "name"), patientService.search(value, "phone"), appointmentService.search(value)]).then(([byName, byPhone, appointments]) => {
        if (!active) return;
        const patients = [...byName, ...byPhone].filter((patient, index, items) => items.findIndex((item) => item.id === patient.id) === index).slice(0, 8);
        setResult({ patients, appointments: appointments.slice(0, 6) });
      }).catch(() => { if (active) setResult({ patients: [], appointments: [] }); }).finally(() => { if (active) setIsLoading(false); });
    }, 200);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query]);

  const formatter = new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  const hasResults = result.patients.length > 0 || result.appointments.length > 0;

  return <div className="relative xl:w-107.5">
    <SearchIcon className="pointer-events-none absolute inset-s-4 top-1/2 z-1 size-5 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
    <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder={t("header.searchPlaceholder")} className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 ps-12 pe-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-hidden dark:border-gray-800 dark:bg-white/3 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
    <kbd className="pointer-events-none absolute inset-e-2.5 top-1/2 inline-flex -translate-y-1/2 items-center rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-theme-xs text-gray-500 dark:border-gray-800 dark:bg-white/3 dark:text-gray-400">Ctrl K</kbd>
    {query.trim() && <div className="absolute z-999 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
      {isLoading ? <p className="p-3 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.actions.loading")}</p> : !hasResults ? <p className="p-3 text-theme-sm text-gray-500 dark:text-gray-400">{t("header.search.empty")}</p> : <>
        {result.patients.length > 0 && <div><p className="px-3 pb-1 pt-2 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("header.search.patients")}</p>{result.patients.map((patient) => <Link key={patient.id} to={`/patients/${patient.id}`} onClick={() => setQuery("")} className="block rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5"><span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">{patient.fullName}</span><span className="block text-theme-xs text-gray-500 dark:text-gray-400">{patient.phone || patient.id}</span></Link>)}</div>}
        {result.appointments.length > 0 && <div className="mt-2 border-t border-gray-100 pt-2 dark:border-gray-800"><p className="px-3 pb-1 text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t("header.search.appointments")}</p>{result.appointments.map((appointment) => <Link key={appointment.id} to={`/patients/${appointment.patientId}`} onClick={() => setQuery("")} className="block rounded-lg px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-white/5"><span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">{formatter.format(new Date(appointment.startsAt))}</span><span className="block truncate text-theme-xs text-gray-500 dark:text-gray-400">{appointment.reason || t("header.search.noReason")}</span></Link>)}</div>}
      </>}
    </div>}
  </div>;
}
