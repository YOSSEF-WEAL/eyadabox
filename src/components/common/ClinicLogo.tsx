import { useLanguage } from "@/context/LanguageContext";
import { useTranslation } from "react-i18next";

type ClinicLogoProps = {
  className?: string;
};

export default function ClinicLogo({ className = "" }: ClinicLogoProps) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const source = language === "ar" ? "/eyadabox-logo-ar.png" : "/eyadabox-logo-en.png";

  return <img className={className} src={source} alt={t("clinic.appName")} />;
}
