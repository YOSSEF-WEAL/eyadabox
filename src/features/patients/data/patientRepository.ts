import type { CreatePatientInput, Patient, UpdatePatientInput } from "../domain/types";

export type PatientSearchMode = "name" | "phone";

export interface PatientRepository {
  create(input: CreatePatientInput): Promise<Patient>;
  findById(id: string): Promise<Patient | null>;
  search(query: string, mode?: PatientSearchMode): Promise<Patient[]>;
  recent(limit: number): Promise<Patient[]>;
  update(id: string, input: UpdatePatientInput): Promise<Patient>;
  archive(id: string): Promise<void>;
}
