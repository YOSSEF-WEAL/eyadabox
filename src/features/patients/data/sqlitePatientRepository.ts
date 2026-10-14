import { getDatabase } from "@/lib/database/client";
import { toDatabaseError } from "@/lib/database/errors";
import type { CreatePatientInput, Patient, UpdatePatientInput } from "../domain/types";
import type { PatientRepository } from "./patientRepository";

type PatientRow = {
  id: string;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  sex: Patient["sex"];
  address: string | null;
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

const patientColumns = "id, full_name, phone, date_of_birth, sex, address, notes, archived_at, created_at, updated_at";

function mapPatient(row: PatientRow): Patient {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    sex: row.sex,
    address: row.address,
    notes: row.notes,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function nullable(value: string | undefined): string | null {
  return value?.trim() || null;
}

export class SqlitePatientRepository implements PatientRepository {
  async create(input: CreatePatientInput): Promise<Patient> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      const database = await getDatabase();
      await database.execute(
        `INSERT INTO patients (${patientColumns}) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9)`,
        [id, input.fullName, nullable(input.phone), input.dateOfBirth ?? null, input.sex ?? null, nullable(input.address), nullable(input.notes), now, now],
      );
      return this.requireById(id);
    } catch (error) {
      throw toDatabaseError(error, "Unable to create the patient record.");
    }
  }

  async findById(id: string): Promise<Patient | null> {
    try {
      const database = await getDatabase();
      const rows = await database.select<PatientRow[]>(`SELECT ${patientColumns} FROM patients WHERE id = $1`, [id]);
      return rows[0] ? mapPatient(rows[0]) : null;
    } catch (error) {
      throw toDatabaseError(error, "Unable to load the patient record.");
    }
  }

  async search(query: string): Promise<Patient[]> {
    const value = `%${query.trim()}%`;
    try {
      const database = await getDatabase();
      const rows = await database.select<PatientRow[]>(
        `SELECT ${patientColumns} FROM patients WHERE archived_at IS NULL AND (full_name LIKE $1 COLLATE NOCASE OR phone LIKE $2 OR id LIKE $3) ORDER BY full_name COLLATE NOCASE ASC LIMIT 100`,
        [value, value, value],
      );
      return rows.map(mapPatient);
    } catch (error) {
      throw toDatabaseError(error, "Unable to search patients.");
    }
  }

  async update(id: string, input: UpdatePatientInput): Promise<Patient> {
    const now = new Date().toISOString();
    try {
      const database = await getDatabase();
      const result = await database.execute(
        "UPDATE patients SET full_name = $1, phone = $2, date_of_birth = $3, sex = $4, address = $5, notes = $6, updated_at = $7 WHERE id = $8 AND archived_at IS NULL",
        [input.fullName, nullable(input.phone), input.dateOfBirth ?? null, input.sex ?? null, nullable(input.address), nullable(input.notes), now, id],
      );
      if (result.rowsAffected !== 1) throw new Error("Patient record was not found.");
      return this.requireById(id);
    } catch (error) {
      throw toDatabaseError(error, "Unable to update the patient record.");
    }
  }

  async archive(id: string): Promise<void> {
    const now = new Date().toISOString();
    try {
      const database = await getDatabase();
      await database.execute("UPDATE patients SET archived_at = $1, updated_at = $2 WHERE id = $3 AND archived_at IS NULL", [now, now, id]);
    } catch (error) {
      throw toDatabaseError(error, "Unable to archive the patient record.");
    }
  }

  private async requireById(id: string): Promise<Patient> {
    const patient = await this.findById(id);
    if (!patient) throw new Error("Patient record was not found.");
    return patient;
  }
}
