import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { useTranslation } from "react-i18next";

type ClinicModulePageProps = {
  module: "appointments" | "patients" | "practitioners" | "settings";
};

export default function ClinicModulePage({ module }: ClinicModulePageProps) {
  const { t } = useTranslation();
  const title = t(`clinic.modules.${module}.title`);

  return (
    <>
      <PageMeta title={`${title} | Clinic Desk`} description={t(`clinic.modules.${module}.description`)} />
      <PageBreadCrumb pageTitle={title} />
      <section className="rounded-2xl border border-gray-200 bg-white px-5 py-12 text-center dark:border-gray-800 dark:bg-white/3 md:px-10">
        <h1 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">{t(`clinic.modules.${module}.emptyTitle`)}</h1>
        <p className="mx-auto mt-3 max-w-xl text-theme-sm text-gray-500 dark:text-gray-400">{t(`clinic.modules.${module}.comingSoon`)}</p>
      </section>
    </>
  );
}
