import { BrowserAppointmentRepository } from "./data/browserAppointmentRepository";
import { SqliteAppointmentRepository } from "./data/sqliteAppointmentRepository";
import { AppointmentService } from "./services/appointmentService";
import { isTauriRuntime } from "@/lib/runtime/isTauriRuntime";

export const appointmentService = new AppointmentService(isTauriRuntime() ? new SqliteAppointmentRepository() : new BrowserAppointmentRepository());
export type { Appointment, AppointmentStatus, PractitionerOption, SaveAppointmentInput } from "./domain/types";
