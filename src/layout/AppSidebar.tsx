import { useSidebar } from "@/context/SidebarContext";
import ClinicLogo from "@/components/common/ClinicLogo";
import { CalenderIcon, DashboardAltIcon, MultiUserIcon, SettingsAltIcon, UserCircleIcon } from "@/icons";
import { cn } from "@/utils";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";

type NavigationItem = {
  key: "clinicDashboard" | "appointments" | "patients" | "practitioners" | "staff" | "clinicSettings";
  path: string;
  icon: React.ReactNode;
};

const navigationItems: NavigationItem[] = [
  { key: "clinicDashboard", path: "/", icon: <DashboardAltIcon fontSize={24} /> },
  { key: "appointments", path: "/appointments", icon: <CalenderIcon fontSize={24} /> },
  { key: "patients", path: "/patients", icon: <UserCircleIcon fontSize={24} /> },
  { key: "practitioners", path: "/practitioners", icon: <UserCircleIcon fontSize={24} /> },
  { key: "staff", path: "/staff", icon: <MultiUserIcon fontSize={24} /> },
  { key: "clinicSettings", path: "/settings", icon: <SettingsAltIcon fontSize={24} /> },
];

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, setIsMobileOpen } = useSidebar();
  const { t } = useTranslation();
  const location = useLocation();
  const showLabels = isExpanded || isHovered || isMobileOpen;

  useEffect(() => {
    if (isMobileOpen) setIsMobileOpen(false);
  }, [location.pathname, isMobileOpen, setIsMobileOpen]);

  return (
    <aside
      className={cn(
        "fixed inset-s-0 top-0 z-50 flex h-screen flex-col border-e border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out xl:translate-x-0 xl:rtl:translate-x-0 dark:border-gray-800 dark:bg-gray-900",
        isExpanded || isMobileOpen || isHovered ? "w-72.5" : "w-22.5",
        isMobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn("flex py-8", showLabels ? "justify-start" : "xl:justify-center")}>
        <Link to="/" className="flex items-center gap-3" aria-label={t("clinic.appName")}>
          <ClinicLogo className={cn("object-contain", showLabels ? "h-14 w-36" : "size-10")} />
        </Link>
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto" aria-label={t("sidebar.groups.menu")}>
        <h2 className={cn("mb-4 text-xs leading-5 text-gray-400 uppercase", showLabels ? "text-start" : "xl:text-center")}>
          {showLabels ? t("sidebar.groups.menu") : "•••"}
        </h2>
        <ul className="flex flex-col gap-1">
          {navigationItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <li key={item.key}>
                <Link to={item.path} className={`group menu-item ${active ? "menu-item-active" : "menu-item-inactive"}`}>
                  <span className={`menu-item-icon-size ${active ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>{item.icon}</span>
                  {showLabels && <span className="menu-item-text">{t(`sidebar.items.${item.key}`)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
