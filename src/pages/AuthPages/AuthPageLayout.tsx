import GridShape from "@/components/common/GridShape";
import ClinicLogo from "@/components/common/ClinicLogo";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { useLanguage, type LanguageCode } from "@/context/LanguageContext";
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const languages: Array<{ code: LanguageCode; label: string }> = [
    { code: "en", label: t("clinic.auth.language.english") },
    { code: "ar", label: t("clinic.auth.language.arabic") },
  ];

  return (
    <div className="relative z-1 bg-white p-6 sm:p-0 dark:bg-gray-900">
      <div className="relative flex h-screen w-full flex-col justify-center sm:p-0 lg:flex-row dark:bg-gray-900">
        {children}
        <div className="hidden h-full w-full items-center bg-brand-950 lg:grid lg:w-1/2 dark:bg-white/5">
          <div className="relative z-1 flex items-center justify-center">
            <GridShape />

            <div className="flex max-w-xs flex-col items-center">
              <Link to="/" className="mb-4 block">
                <ClinicLogo className="h-44 w-56 rounded-2xl object-contain" />
              </Link>

              <p className="text-center text-gray-400 dark:text-white/60">
                {t("clinic.brand.tagline")}
              </p>
            </div>
          </div>
        </div>

        <div className="fixed inset-e-6 bottom-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
        <div className="fixed start-6 top-6 z-50 flex rounded-lg border border-gray-200 bg-white p-1 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900" role="group" aria-label={t("clinic.auth.language.label")}>
          {languages.map((item) => (
            <button key={item.code} type="button" onClick={() => setLanguage(item.code)} className={`rounded-md px-3 py-1.5 text-theme-sm font-medium transition-colors ${language === item.code ? "bg-brand-500 text-white" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"}`} aria-pressed={language === item.code}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
