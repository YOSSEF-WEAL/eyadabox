import type { SaveAppointmentInput } from "./types";

export function validateAppointmentInput(input: SaveAppointmentInput): SaveAppointmentInput {
  if (!input.patientId) throw new Error("A patient is required.");
  if (!input.practitionerId) throw new Error("A practitioner is required.");
  if (!input.startsAt || !input.endsAt) throw new Error("Appointment start and end times are required.");
  if (new Date(input.endsAt) <= new Date(input.startsAt)) throw new Error("The appointment end time must be after its start time.");
  return { ...input, reason: input.reason?.trim() || undefined, notes: input.notes?.trim() || undefined };
}
