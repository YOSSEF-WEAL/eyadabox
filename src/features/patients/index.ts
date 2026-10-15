import { BrowserPatientRepository } from "./data/browserPatientRepository";
import { SqlitePatientRepository } from "./data/sqlitePatientRepository";
import { PatientService } from "./services/patientService";
import { isTauriRuntime } from "@/lib/runtime/isTauriRuntime";

export const patientService = new PatientService(isTauriRuntime() ? new SqlitePatientRepository() : new BrowserPatientRepository());
export type { CreatePatientInput, Patient, PatientSex, UpdatePatientInput } from "./domain/types";
export type { PatientSearchMode } from "./data/patientRepository";
