import { EyeIcon, PencilIcon } from "@/icons";
import type { Patient } from "@/features/patients";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "react-i18next";

export default function PatientTable({ patients, onEdit, onView }: { patients: Patient[]; onEdit: (patient: Patient) => void; onView: (patient: Patient) => void }) {
  const { t } = useTranslation();
  if (!patients.length) return <div className="py-14 text-center text-theme-sm text-gray-500 dark:text-gray-400">{t("clinic.patients.noResults")}</div>;
  return <div className="overflow-x-auto"><Table>
    <TableHeader className="border-y border-gray-100 dark:border-gray-800"><TableRow>
      {["patient", "phone", "dateOfBirth", "address", "actions"].map((key) => <TableCell key={key} isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">{t(`clinic.patients.columns.${key}`)}</TableCell>)}
    </TableRow></TableHeader>
    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">{patients.map((patient) => <TableRow key={patient.id}>
      <TableCell className="px-5 py-4"><p className="font-medium text-gray-800 dark:text-white/90">{patient.fullName}</p><p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{patient.id}</p></TableCell>
      <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">{patient.phone ?? "—"}</TableCell>
      <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">{patient.dateOfBirth ?? "—"}</TableCell>
      <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">{patient.address ?? "—"}</TableCell>
      <TableCell className="px-5 py-4"><div className="flex items-center gap-1"><button type="button" onClick={() => onView(patient)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-theme-sm font-medium text-brand-500 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/15"><EyeIcon className="size-4" />{t("clinic.actions.view")}</button><button type="button" onClick={() => onEdit(patient)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-theme-sm font-medium text-brand-500 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/15"><PencilIcon className="size-4" />{t("clinic.actions.edit")}</button></div></TableCell>
    </TableRow>)}</TableBody>
  </Table></div>;
}
