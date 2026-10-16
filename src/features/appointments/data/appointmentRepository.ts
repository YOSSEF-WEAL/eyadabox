import type { Appointment, SaveAppointmentInput } from "../domain/types";

export interface AppointmentRepository {
  list(): Promise<Appointment[]>;
  search(query: string): Promise<Appointment[]>;
  listByPatient(patientId: string): Promise<Appointment[]>;
  create(input: SaveAppointmentInput): Promise<Appointment>;
  update(id: string, input: SaveAppointmentInput): Promise<Appointment>;
}
