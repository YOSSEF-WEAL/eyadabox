export type PatientSex = "female" | "male" | "unspecified";

export interface Patient {
  id: string;
  fullName: string;
  phone: string | null;
  dateOfBirth: string | null;
  sex: PatientSex | null;
  address: string | null;
  notes: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientInput {
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  sex?: PatientSex;
  address?: string;
  notes?: string;
}

export interface UpdatePatientInput extends CreatePatientInput {}
