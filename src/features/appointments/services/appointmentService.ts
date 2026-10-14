import type { AppointmentRepository } from "../data/appointmentRepository";
import type { Appointment, SaveAppointmentInput } from "../domain/types";
import { validateAppointmentInput } from "../domain/validation";

interface PatientAppointmentEligibility {
  findById(id: string): Promise<{ archivedAt: string | null } | null>;
}

export class AppointmentService {
  constructor(
    private readonly repository: AppointmentRepository,
    private readonly patientLookup: PatientAppointmentEligibility,
  ) {}
  list(): Promise<Appointment[]> { return this.repository.list(); }
  listByPatient(patientId: string): Promise<Appointment[]> { return this.repository.listByPatient(patientId); }
  async create(input: SaveAppointmentInput): Promise<Appointment> {
    const validInput = validateAppointmentInput(input);
    const patient = await this.patientLookup.findById(validInput.patientId);
    if (!patient || patient.archivedAt) throw new Error("PATIENT_ARCHIVED");
    return this.repository.create(validInput);
  }
  update(id: string, input: SaveAppointmentInput): Promise<Appointment> { return this.repository.update(id, validateAppointmentInput(input)); }
}
