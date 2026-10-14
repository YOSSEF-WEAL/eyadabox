import type { AppointmentRepository } from "../data/appointmentRepository";
import type { Appointment, SaveAppointmentInput } from "../domain/types";
import { validateAppointmentInput } from "../domain/validation";

export class AppointmentService {
  constructor(private readonly repository: AppointmentRepository) {}
  list(): Promise<Appointment[]> { return this.repository.list(); }
  create(input: SaveAppointmentInput): Promise<Appointment> { return this.repository.create(validateAppointmentInput(input)); }
  update(id: string, input: SaveAppointmentInput): Promise<Appointment> { return this.repository.update(id, validateAppointmentInput(input)); }
}
