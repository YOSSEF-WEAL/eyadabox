export type AppointmentStatus = "scheduled" | "confirmed" | "arrived" | "completed" | "no_show" | "cancelled";

export interface Appointment {
  id: string;
  patientId: string;
  practitionerId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PractitionerOption {
  id: string;
  name: string;
  specialty: string;
}

export interface SaveAppointmentInput {
  patientId: string;
  practitionerId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
}
