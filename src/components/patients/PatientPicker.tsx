import PatientSearchControls from "@/components/patients/PatientSearchControls";
import { patientService, type Patient, type PatientSearchMode } from "@/features/patients";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Props = { selectedPatient: Patient | null; onSelect: (patient: Patient) => void };

export default function PatientPicker({ selectedPatient, onSelect }: Props) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false); const [query, setQuery] = useState(""); const [mode, setMode] = useState<PatientSearchMode>("name"); const [patients, setPatients] = useState<Patient[]>([]); const [isLoading, setIsLoading] = useState(false);
  const load = useCallback(async () => { setIsLoading(true); try { setPatients(query.trim() ? await patientService.search(query, mode) : await patientService.recent(10)); } finally { setIsLoading(false); } }, [mode, query]);
  useEffect(() => { if (isOpen) void load(); }, [isOpen, load]);
  const changeMode = (next: PatientSearchMode) => { setMode(next); setQuery(""); };
  return <div className="relative"><button type="button" onClick={() => setIsOpen((current) => !current)} className="flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-transparent px-4 text-start text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><span>{selectedPatient ? `${selectedPatient.fullName}${selectedPatient.phone ? ` · ${selectedPatient.phone}` : ""}` : t("clinic.appointments.selectPatient")}</span><span className="text-gray-400">⌄</span></button>{selectedPatient && <p className="mt-2 text-theme-xs text-success-600 dark:text-success-400">{t("clinic.appointments.selectedPatient", { name: selectedPatient.fullName })}</p>}{isOpen && <div className="absolute z-999 mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"><PatientSearchControls query={query} mode={mode} onQueryChange={setQuery} onModeChange={changeMode} /><p className="mb-2 mt-3 text-theme-xs text-gray-500 dark:text-gray-400">{query.trim() ? t("clinic.patients.searchResults") : t("clinic.patients.recentPatients")}</p><div className="custom-scrollbar max-h-60 overflow-y-auto">{isLoading ? <p className="p-3 text-theme-sm text-gray-500">{t("clinic.actions.loading")}</p> : patients.length === 0 ? <p className="p-3 text-theme-sm text-gray-500">{t("clinic.patients.noResults")}</p> : patients.map((patient) => <button type="button" key={patient.id} onClick={() => { onSelect(patient); setIsOpen(false); }} className="block w-full rounded-lg px-3 py-3 text-start hover:bg-gray-100 dark:hover:bg-white/5"><span className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">{patient.fullName}</span><span className="block text-theme-xs text-gray-500 dark:text-gray-400">{patient.phone || patient.id}</span></button>)}</div></div>}</div>;
}
