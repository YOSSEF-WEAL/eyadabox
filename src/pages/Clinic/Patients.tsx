import PatientFormModal from "@/components/patients/PatientFormModal";
import PatientTable from "@/components/patients/PatientTable";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { patientService, type CreatePatientInput, type Patient } from "@/features/patients";
import { useModal } from "@/hooks/useModal";
import { PlusIcon, SearchIcon } from "@/icons";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function Patients() {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPatients = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    try {
      setPatients(await patientService.search(searchQuery));
    } catch {
      setError(t("clinic.patients.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => { void loadPatients(query); }, [loadPatients, query]);

  const handleAdd = () => { setSelectedPatient(null); setError(null); openModal(); };
  const handleEdit = (patient: Patient) => { setSelectedPatient(patient); setError(null); openModal(); };
  const handleClose = () => { setError(null); closeModal(); };

  const handleSave = async (input: CreatePatientInput) => {
    setIsSaving(true);
    setError(null);
    try {
      if (selectedPatient) await patientService.update(selectedPatient.id, input);
      else await patientService.create(input);
      await loadPatients(query);
      closeModal();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("clinic.patients.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageMeta title={`${t("clinic.modules.patients.title")} | Clinic Desk`} description={t("clinic.modules.patients.description")} />
      <PageBreadCrumb pageTitle={t("clinic.modules.patients.title")} />
      <section className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div><h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{t("clinic.modules.patients.title")}</h1><p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.modules.patients.description")}</p></div>
          <button type="button" onClick={handleAdd} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-theme-sm font-medium text-white hover:bg-brand-600"><PlusIcon className="size-4" />{t("clinic.patients.addPatient")}</button>
        </div>
        <div className="p-5">
          <div className="relative max-w-md"><SearchIcon className="pointer-events-none absolute inset-s-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("clinic.patients.searchPlaceholder")} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 ps-12 pe-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/20 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800" /></div>
        </div>
        {isLoading ? <div className="py-14 text-center text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.actions.loading")}</div> : <PatientTable patients={patients} onEdit={handleEdit} />}
      </section>
      <PatientFormModal isOpen={isOpen} patient={selectedPatient} error={error} isSaving={isSaving} onClose={handleClose} onSave={handleSave} />
    </>
  );
}
