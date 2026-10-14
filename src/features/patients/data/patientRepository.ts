import type { CreatePatientInput, Patient, UpdatePatientInput } from "../domain/types";

export interface PatientRepository {
  create(input: CreatePatientInput): Promise<Patient>;
  findById(id: string): Promise<Patient | null>;
  search(query: string): Promise<Patient[]>;
  update(id: string, input: UpdatePatientInput): Promise<Patient>;
  archive(id: string): Promise<void>;
}
