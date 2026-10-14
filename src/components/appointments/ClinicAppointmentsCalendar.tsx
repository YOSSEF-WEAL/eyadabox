import CalendarEventItem from "@/components/calendar/CalendarEventItem";
import CalendarViewSelect from "@/components/calendar/CalendarViewSelect";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/calendar/icons";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import type { Appointment } from "@/features/appointments";
import type { CalendarRef, DateSelectInfo, EventClickInfo, EventDisplayInfo, EventInput, ToolbarSectionInfo } from "@fullcalendar/react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import multiMonthPlugin from "@fullcalendar/react/multimonth";
import "@fullcalendar/react/skeleton.css";
import themePlugin from "@fullcalendar/react/themes/classic";
import "@fullcalendar/react/themes/classic/palette.css";
import "@fullcalendar/react/themes/classic/theme.css";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  appointments: Appointment[];
  patientNames: Map<string, string>;
  defaultAppointmentMinutes: number;
  onCreateAt: (start: Date, end: Date, allDay: boolean) => void;
  onEdit: (appointment: Appointment) => void;
};

const eventLevels: Record<Appointment["status"], string> = {
  scheduled: "Primary",
  confirmed: "Success",
  arrived: "Warning",
  completed: "Success",
  no_show: "Danger",
  cancelled: "Danger",
};

export default function ClinicAppointmentsCalendar({ appointments, patientNames, defaultAppointmentMinutes, onCreateAt, onEdit }: Props) {
  const { t } = useTranslation();
  const { dir } = useLanguage();
  const { theme } = useTheme();
  const calendarRef = useRef<CalendarRef>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [portalNode, setPortalNode] = useState<Element | null>(null);

  const events = useMemo<EventInput[]>(() => appointments.map((appointment) => ({
    id: appointment.id,
    title: patientNames.get(appointment.patientId) ?? t("clinic.appointments.unknownPatient"),
    start: appointment.startsAt,
    end: appointment.endsAt,
    extendedProps: { calendar: eventLevels[appointment.status] },
  })), [appointments, patientNames, t]);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      const node = calendarContainerRef.current?.querySelector(".clinic-calendar-toolbar-end");
      if (node) setPortalNode(node);
    });
    return () => cancelAnimationFrame(frameId);
  }, [dir]);

  const handleViewChange = (viewKey: string) => {
    setCurrentView(viewKey);
    calendarRef.current?.getApi()?.changeView(viewKey);
  };

  const handleSelect = (selection: DateSelectInfo) => {
    onCreateAt(selection.start, selection.end, selection.allDay);
  };

  const handleEventClick = (eventInfo: EventClickInfo) => {
    const appointment = appointments.find((item) => item.id === eventInfo.event.id);
    if (appointment) onEdit(appointment);
  };

  return <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3" data-color-scheme={theme}>
    <div ref={calendarContainerRef} className={`custom-calendar relative ${currentView === "multiMonthYear" ? "fc-multimonth" : ""}`} data-color-scheme={theme}>
      <FullCalendar
        key={dir}
        ref={calendarRef}
        className="gap-0!"
        plugins={[themePlugin, dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin]}
        initialView="dayGridMonth"
        direction={dir}
        headerToolbar={{ start: "prev,next addAppointmentButton", center: "title", end: "" }}
        headerToolbarClass="sticky top-0! z-20! flex-row! flex-wrap! items-center justify-between gap-3 bg-white pt-4 pb-3 sm:gap-4 sm:pt-6 sm:pb-4 dark:bg-gray-900 [padding-inline:16px]! sm:[padding-inline:24px]!"
        toolbarTitleClass="text-base! font-semibold! text-gray-800 sm:text-lg! dark:text-white/90"
        toolbarSectionClass={(info: ToolbarSectionInfo) => {
          if (info.name === "start") return "ta-toolbar-section order-2 flex w-full items-center justify-between gap-2 sm:order-1 sm:w-auto sm:justify-start";
          if (info.name === "center") return "ta-toolbar-section order-1 flex items-center justify-start sm:order-2 sm:justify-center";
          return "clinic-calendar-toolbar-end ta-toolbar-section order-1 flex items-center justify-end sm:order-3";
        }}
        buttonGroupClass="gap-2"
        buttons={{
          prev: { iconContent: () => <ChevronLeftIcon className="size-5 text-gray-700 sm:size-6 rtl:rotate-180 dark:text-gray-400" />, className: "flex size-9! items-center justify-center! rounded-lg! border! border-gray-200! bg-transparent! p-0! text-gray-700 hover:bg-gray-50! focus:shadow-none sm:size-10! dark:border-gray-800! dark:text-gray-400 dark:hover:bg-gray-900!" },
          next: { iconContent: () => <ChevronRightIcon className="size-5 text-gray-700 sm:size-6 rtl:rotate-180 dark:text-gray-400" />, className: "flex size-9! items-center justify-center! rounded-lg! border! border-gray-200! bg-transparent! p-0! text-gray-700 hover:bg-gray-50! focus:shadow-none sm:size-10! dark:border-gray-800! dark:text-gray-400 dark:hover:bg-gray-900!" },
          addAppointmentButton: { text: `${t("clinic.appointments.addAppointment")} +`, click: () => onCreateAt(new Date(), new Date(Date.now() + defaultAppointmentMinutes * 60_000), false), className: "w-auto! rounded-lg! border-0! bg-brand-500! px-3! py-2! text-xs! font-medium! text-white hover:bg-brand-600! focus:shadow-none sm:px-4! sm:py-2.5! sm:text-sm!" },
        }}
        views={{
          dayGridMonth: {
            dayMaxEvents: 2,
            dayHeaderClass: "border-x-0! border-t! border-gray-200! bg-gray-50! dark:border-gray-800! dark:bg-gray-900!",
            dayHeaderInnerClass: "px-1! py-2! text-xs! font-medium! uppercase text-gray-400 sm:px-3! sm:py-3! sm:text-sm!",
            dayCellClass: "bg-transparent! p-1! sm:p-2!",
            dayCellTopInnerClass: "text-xs! text-gray-700 sm:text-sm! dark:text-gray-300",
          },
          timeGridWeek: {
            slotDuration: "00:30:00",
            slotMinHeight: 48,
            allDaySlot: false,
          },
          timeGridDay: {
            slotDuration: "00:30:00",
            slotMinHeight: 48,
            allDaySlot: false,
          },
          multiMonthYear: {
            multiMonthMaxColumns: 3,
            singleMonthClass: "fc-multimonth",
            singleMonthMinWidth: 280,
            dayMaxEvents: 2,
          },
        }}
        height="auto"
        borderless
        viewClass="border-t! border-b-0! border-x-0! border-gray-200! bg-transparent! dark:border-gray-800!"
        tableHeaderClass="border-0! bg-gray-50! dark:bg-gray-900!"
        dayHeaderDividerClass="border-b! border-t-0! border-x-0! border-gray-200! p-0! dark:border-gray-800!"
        slotHeaderDividerClass="border-e! border-s-0! border-y-0! border-gray-200! dark:border-gray-800!"
        slotHeaderClass="px-2! py-2! text-start! text-xs! font-medium! text-gray-400 sm:px-3!"
        slotLaneClass="border-gray-100! dark:border-gray-800/60!"
        dayLaneClass="border-gray-200! dark:border-gray-800!"
        eventClass="focus:shadow-none"
        columnEventClass="bg-transparent! border-0! p-1! shadow-none! hover:shadow-none! focus:outline-none"
        columnEventInnerClass="h-full border-0! bg-transparent! p-0!"
        rowEventClass="bg-transparent! border-0! px-1! py-0.5! shadow-none! hover:shadow-none! focus:outline-none"
        rowEventInnerClass="border-0! bg-transparent! p-0!"
        selectable
        select={handleSelect}
        events={events}
        eventClick={handleEventClick}
        eventContent={(eventInfo: EventDisplayInfo) => <CalendarEventItem eventInfo={eventInfo} />}
        datesSet={(arg) => {
          setCurrentView(arg.view.type);
          requestAnimationFrame(() => {
            const node = calendarContainerRef.current?.querySelector(".clinic-calendar-toolbar-end");
            if (node) setPortalNode(node);
          });
        }}
      />
      <CalendarViewSelect currentView={currentView} onViewChange={handleViewChange} portalNode={portalNode} />
    </div>
  </section>;
}
