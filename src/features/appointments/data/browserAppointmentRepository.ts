import type { Appointment, SaveAppointmentInput } from "../domain/types";
import type { AppointmentRepository } from "./appointmentRepository";

const STORAGE_KEY = "clinic-desk.demo-appointments";

const demoAppointments: Appointment[] = [
  { id: "AP-1001", patientId: "PT-1001", practitionerId: "DR-1001", startsAt: "2026-10-14T09:00:00.000Z", endsAt: "2026-10-14T09:30:00.000Z", status: "confirmed", reason: "Follow-up visit", notes: null, createdAt: "2026-10-13T10:00:00.000Z", updatedAt: "2026-10-13T10:00:00.000Z" },
  { id: "AP-1002", patientId: "PT-1002", practitionerId: "DR-1002", startsAt: "2026-10-14T10:00:00.000Z", endsAt: "2026-10-14T10:30:00.000Z", status: "scheduled", reason: "Initial consultation", notes: null, createdAt: "2026-10-13T11:00:00.000Z", updatedAt: "2026-10-13T11:00:00.000Z" },
];

function readAppointments(): Appointment[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) { localStorage.setItem(STORAGE_KEY, JSON.stringify(demoAppointments)); return [...demoAppointments]; }
  return JSON.parse(saved) as Appointment[];
}

function writeAppointments(appointments: Appointment[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments)); }

function overlaps(appointment: Appointment, input: SaveAppointmentInput, excludedId?: string) {
  return appointment.id !== excludedId && appointment.practitionerId === input.practitionerId && appointment.status !== "cancelled" && input.status !== "cancelled" && new Date(appointment.startsAt) < new Date(input.endsAt) && new Date(input.startsAt) < new Date(appointment.endsAt);
}

export class BrowserAppointmentRepository implements AppointmentRepository {
  async list(): Promise<Appointment[]> { return readAppointments().sort((first, second) => first.startsAt.localeCompare(second.startsAt)); }

  async listByPatient(patientId: string): Promise<Appointment[]> {
    return readAppointments()
      .filter((appointment) => appointment.patientId === patientId)
      .sort((first, second) => second.startsAt.localeCompare(first.startsAt));
  }

  async create(input: SaveAppointmentInput): Promise<Appointment> {
    const appointments = readAppointments();
    if (appointments.some((appointment) => overlaps(appointment, input))) throw new Error("This practitioner already has an appointment in that time slot.");
    const now = new Date().toISOString();
    const appointment: Appointment = { id: `AP-${String(1000 + appointments.length + 1).padStart(4, "0")}`, patientId: input.patientId, practitionerId: input.practitionerId, startsAt: input.startsAt, endsAt: input.endsAt, status: input.status, reason: input.reason ?? null, notes: input.notes ?? null, createdAt: now, updatedAt: now };
    writeAppointments([...appointments, appointment]);
    return appointment;
  }

  async update(id: string, input: SaveAppointmentInput): Promise<Appointment> {
    const appointments = readAppointments();
    const index = appointments.findIndex((appointment) => appointment.id === id);
    if (index === -1) throw new Error("Appointment was not found.");
    if (appointments.some((appointment) => overlaps(appointment, input, id))) throw new Error("This practitioner already has an appointment in that time slot.");
    const updated = { ...appointments[index], ...input, reason: input.reason ?? null, notes: input.notes ?? null, updatedAt: new Date().toISOString() };
    appointments[index] = updated;
    writeAppointments(appointments);
    return updated;
  }
}
