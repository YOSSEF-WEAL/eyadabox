import type { PatientRepository } from "../data/patientRepository";
import type { CreatePatientInput, Patient, UpdatePatientInput } from "../domain/types";
import { validatePatientInput } from "../domain/validation";

export class PatientService {
  constructor(private readonly repository: PatientRepository) {}

  create(input: CreatePatientInput): Promise<Patient> { return this.repository.create(validatePatientInput(input)); }
  findById(id: string): Promise<Patient | null> { return this.repository.findById(id); }
  search(query: string): Promise<Patient[]> { return this.repository.search(query); }
  update(id: string, input: UpdatePatientInput): Promise<Patient> { return this.repository.update(id, validatePatientInput(input)); }
  archive(id: string): Promise<void> { return this.repository.archive(id); }
}
