import { appointmentService, type Appointment } from "@/features/appointments";
import { patientService } from "@/features/patients";
import { BellAltIcon } from "@/icons";
import { cn } from "@/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";

type NotificationKind = "overdue" | "today" | "upcoming";

interface ClinicNotification {
  id: string;
  kind: NotificationKind;
  patientName: string;
  startsAt: Date;
}

const READ_NOTIFICATIONS_KEY = "clinic-desk-read-appointment-notifications";
const ACTIVE_STATUSES = new Set<Appointment["status"]>(["scheduled", "confirmed"]);

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getReadNotificationIds() {
  try {
    const saved = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    return new Set<string>(saved ? JSON.parse(saved) : []);
  } catch {
    return new Set<string>();
  }
}

export default function NotificationDropdown() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<ClinicNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState(getReadNotificationIds);

  const loadNotifications = useCallback(async () => {
      try {
        const [appointments, patients] = await Promise.all([appointmentService.list(), patientService.search("")]);
        const patientNames = new Map(patients.map((patient) => [patient.id, patient.fullName]));
        const now = new Date();
        const tomorrow = new Date(startOfDay(now));
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextTwentyFourHours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const actionable = appointments.flatMap((appointment): ClinicNotification[] => {
          if (!ACTIVE_STATUSES.has(appointment.status)) return [];
          const startsAt = new Date(appointment.startsAt);
          if (Number.isNaN(startsAt.getTime())) return [];
          const patientName = patientNames.get(appointment.patientId) || String(t("header.notifications.unknownPatient"));
          if (startsAt < now) return [{ id: `overdue:${appointment.id}`, kind: "overdue", patientName, startsAt }];
          if (startsAt < tomorrow) return [{ id: `today:${appointment.id}`, kind: "today", patientName, startsAt }];
          if (startsAt <= nextTwentyFourHours) return [{ id: `upcoming:${appointment.id}`, kind: "upcoming", patientName, startsAt }];
          return [];
        });

        actionable.sort((first, second) => first.startsAt.getTime() - second.startsAt.getTime());
        setNotifications(actionable);
      } catch {
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
  }, [t]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !readNotificationIds.has(notification.id)).length,
    [notifications, readNotificationIds],
  );

  const markAsRead = (notificationId: string) => {
    setReadNotificationIds((current) => {
      const next = new Set(current);
      next.add(notificationId);
      try { localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...next])); } catch { /* Storage is optional. */ }
      return next;
    });
  };

  const formatDate = (date: Date) => new Intl.DateTimeFormat(i18n.language, {
    hour: "numeric", minute: "2-digit", day: "numeric", month: "short",
  }).format(date);

  const notificationMessage = (notification: ClinicNotification) => t(
    `header.notifications.${notification.kind}`,
    { name: notification.patientName, time: formatDate(notification.startsAt) },
  );

  return (
    <div className="relative">
      <button type="button" aria-label={t("header.notifications.title")} className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white" onClick={() => { setIsOpen((current) => !current); void loadNotifications(); }}>
        {unreadCount > 0 && <span className="absolute inset-e-0 top-0.5 z-10 flex h-2 w-2 rounded-full bg-orange-400" />}
        <BellAltIcon className="h-5 w-5" />
      </button>

      <Dropdown isOpen={isOpen} onClose={() => setIsOpen(false)} className="mt-4.25 flex max-h-120 w-87.5 flex-col p-3 sm:w-90.25">
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t("header.notifications.title")}</h5>
          {unreadCount > 0 && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">{t("header.notifications.unread", { count: unreadCount })}</span>}
        </div>

        <ul className="custom-scrollbar flex h-auto flex-col overflow-y-auto">
          {isLoading && <li className="px-4 py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">{t("header.notifications.loading")}</li>}
          {!isLoading && notifications.length === 0 && <li className="px-4 py-6 text-center text-theme-sm text-gray-500 dark:text-gray-400">{t("header.notifications.empty")}</li>}
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Link to="/appointments" onClick={() => { markAsRead(notification.id); setIsOpen(false); }} className={cn("flex gap-3 border-b border-gray-100 p-3 px-4.5 py-3 text-start hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5", !readNotificationIds.has(notification.id) && "bg-brand-25 dark:bg-brand-500/5")}>
                <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", notification.kind === "overdue" ? "bg-error-500" : notification.kind === "today" ? "bg-warning-500" : "bg-brand-500")} />
                <span className="block"><span className="block text-theme-sm text-gray-700 dark:text-gray-200">{notificationMessage(notification)}</span><span className="mt-1 block text-theme-xs text-gray-500 dark:text-gray-400">{t("header.notifications.openAppointments")}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </Dropdown>
    </div>
  );
}
