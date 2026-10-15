import type { CreatePatientInput, Patient, UpdatePatientInput } from "../domain/types";
import type { PatientRepository, PatientSearchMode } from "./patientRepository";

const STORAGE_KEY = "clinic-desk.demo-patients";

const demoPatients: Patient[] = [
  { id: "PT-1001", fullName: "Ahmed Hassan", phone: "01001234567", dateOfBirth: "1988-04-15", sex: "male", address: "Cairo", notes: null, archivedAt: null, createdAt: "2026-10-01T09:00:00.000Z", updatedAt: "2026-10-01T09:00:00.000Z" },
  { id: "PT-1002", fullName: "Mariam Ali", phone: "01007654321", dateOfBirth: "1994-11-02", sex: "female", address: "Giza", notes: "Prefers afternoon appointments.", archivedAt: null, createdAt: "2026-10-03T11:30:00.000Z", updatedAt: "2026-10-03T11:30:00.000Z" },
  { id: "PT-1003", fullName: "Omar Khaled", phone: "01112345678", dateOfBirth: null, sex: "unspecified", address: null, notes: null, archivedAt: null, createdAt: "2026-10-06T08:15:00.000Z", updatedAt: "2026-10-06T08:15:00.000Z" },
];

function readPatients(): Patient[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoPatients));
    return [...demoPatients];
  }
  return JSON.parse(saved) as Patient[];
}

function writePatients(patients: Patient[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

function toNullable(value: string | undefined): string | null {
  return value?.trim() || null;
}

export class BrowserPatientRepository implements PatientRepository {
  async create(input: CreatePatientInput): Promise<Patient> {
    const patients = readPatients();
    const now = new Date().toISOString();
    const patient: Patient = {
      id: `PT-${String(1000 + patients.length + 1).padStart(4, "0")}`,
      fullName: input.fullName,
      phone: toNullable(input.phone),
      dateOfBirth: input.dateOfBirth ?? null,
      sex: input.sex ?? null,
      address: toNullable(input.address),
      notes: toNullable(input.notes),
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    writePatients([patient, ...patients]);
    return patient;
  }

  async findById(id: string): Promise<Patient | null> {
    return readPatients().find((patient) => patient.id === id) ?? null;
  }

  async search(query: string, mode: PatientSearchMode = "name"): Promise<Patient[]> {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return readPatients().filter((patient) =>
      !patient.archivedAt && (!normalizedQuery || (mode === "phone" ? patient.phone ?? "" : patient.fullName).toLocaleLowerCase().includes(normalizedQuery)),
    );
  }

  async recent(limit: number): Promise<Patient[]> {
    return readPatients().filter((patient) => !patient.archivedAt).sort((first, second) => second.createdAt.localeCompare(first.createdAt)).slice(0, limit);
  }

  async update(id: string, input: UpdatePatientInput): Promise<Patient> {
    const patients = readPatients();
    const index = patients.findIndex((patient) => patient.id === id && !patient.archivedAt);
    if (index === -1) throw new Error("Patient record was not found.");
    const updatedPatient: Patient = {
      ...patients[index],
      fullName: input.fullName,
      phone: toNullable(input.phone),
      dateOfBirth: input.dateOfBirth ?? null,
      sex: input.sex ?? null,
      address: toNullable(input.address),
      notes: toNullable(input.notes),
      updatedAt: new Date().toISOString(),
    };
    patients[index] = updatedPatient;
    writePatients(patients);
    return updatedPatient;
  }

  async archive(id: string): Promise<void> {
    const patients = readPatients();
    const patient = patients.find((item) => item.id === id && !item.archivedAt);
    if (!patient) return;
    patient.archivedAt = new Date().toISOString();
    patient.updatedAt = patient.archivedAt;
    writePatients(patients);
  }
}
