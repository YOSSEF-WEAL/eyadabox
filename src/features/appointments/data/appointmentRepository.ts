import type { Appointment, SaveAppointmentInput } from "../domain/types";

export interface AppointmentRepository {
  list(): Promise<Appointment[]>;
  create(input: SaveAppointmentInput): Promise<Appointment>;
  update(id: string, input: SaveAppointmentInput): Promise<Appointment>;
}
