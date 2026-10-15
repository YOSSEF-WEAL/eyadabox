import type { PatientRepository, PatientSearchMode } from "../data/patientRepository";
import type { CreatePatientInput, Patient, UpdatePatientInput } from "../domain/types";
import { validatePatientInput } from "../domain/validation";

export class PatientService {
  private readonly repository: PatientRepository;

  constructor(repository: PatientRepository) {
    this.repository = repository;
  }

  create(input: CreatePatientInput): Promise<Patient> { return this.repository.create(validatePatientInput(input)); }
  findById(id: string): Promise<Patient | null> { return this.repository.findById(id); }
  search(query: string, mode: PatientSearchMode = "name"): Promise<Patient[]> { return this.repository.search(query, mode); }
  recent(limit = 10): Promise<Patient[]> { return this.repository.recent(limit); }
  update(id: string, input: UpdatePatientInput): Promise<Patient> { return this.repository.update(id, validatePatientInput(input)); }
  archive(id: string): Promise<void> { return this.repository.archive(id); }
}
