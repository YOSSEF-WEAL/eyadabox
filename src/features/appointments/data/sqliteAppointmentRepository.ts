import { getDatabase } from "@/lib/database/client";
import { toDatabaseError } from "@/lib/database/errors";
import type { Appointment, SaveAppointmentInput } from "../domain/types";
import type { AppointmentRepository } from "./appointmentRepository";

type AppointmentRow = {
  id: string;
  patient_id: string;
  practitioner_id: string;
  starts_at: string;
  ends_at: string;
  status: Appointment["status"];
  reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const appointmentColumns = "id, patient_id, practitioner_id, starts_at, ends_at, status, reason, notes, created_at, updated_at";

function mapAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    practitionerId: row.practitioner_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    reason: row.reason,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function nullable(value: string | undefined): string | null {
  return value?.trim() || null;
}

export class SqliteAppointmentRepository implements AppointmentRepository {
  async list(): Promise<Appointment[]> {
    try {
      const database = await getDatabase();
      const rows = await database.select<AppointmentRow[]>(`SELECT ${appointmentColumns} FROM appointments ORDER BY starts_at ASC`);
      return rows.map(mapAppointment);
    } catch (error) {
      throw toDatabaseError(error, "Unable to load appointments.");
    }
  }

  async listByPatient(patientId: string): Promise<Appointment[]> {
    try {
      const database = await getDatabase();
      const rows = await database.select<AppointmentRow[]>(
        `SELECT ${appointmentColumns} FROM appointments WHERE patient_id = $1 ORDER BY starts_at DESC`,
        [patientId],
      );
      return rows.map(mapAppointment);
    } catch (error) {
      throw toDatabaseError(error, "Unable to load the patient appointment history.");
    }
  }

  async create(input: SaveAppointmentInput): Promise<Appointment> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      await this.assertTimeSlotIsAvailable(input);
      const database = await getDatabase();
      await database.execute(
        `INSERT INTO appointments (${appointmentColumns}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, input.patientId, input.practitionerId, input.startsAt, input.endsAt, input.status, nullable(input.reason), nullable(input.notes), now, now],
      );
      return this.requireById(id);
    } catch (error) {
      throw toDatabaseError(error, "Unable to create the appointment.");
    }
  }

  async update(id: string, input: SaveAppointmentInput): Promise<Appointment> {
    const now = new Date().toISOString();
    try {
      await this.assertTimeSlotIsAvailable(input, id);
      const database = await getDatabase();
      const result = await database.execute(
        "UPDATE appointments SET patient_id = $1, practitioner_id = $2, starts_at = $3, ends_at = $4, status = $5, reason = $6, notes = $7, updated_at = $8 WHERE id = $9",
        [input.patientId, input.practitionerId, input.startsAt, input.endsAt, input.status, nullable(input.reason), nullable(input.notes), now, id],
      );
      if (result.rowsAffected !== 1) throw new Error("Appointment was not found.");
      return this.requireById(id);
    } catch (error) {
      throw toDatabaseError(error, "Unable to update the appointment.");
    }
  }

  private async assertTimeSlotIsAvailable(input: SaveAppointmentInput, excludedId?: string): Promise<void> {
    if (input.status === "cancelled") return;
    const database = await getDatabase();
    const rows = await database.select<{ count: number }[]>(
      "SELECT COUNT(*) AS count FROM appointments WHERE practitioner_id = $1 AND status != 'cancelled' AND starts_at < $2 AND $3 < ends_at AND ($4 IS NULL OR id != $4)",
      [input.practitionerId, input.endsAt, input.startsAt, excludedId ?? null],
    );
    if ((rows[0]?.count ?? 0) > 0) throw new Error("This practitioner already has an appointment in that time slot.");
  }

  private async requireById(id: string): Promise<Appointment> {
    const database = await getDatabase();
    const rows = await database.select<AppointmentRow[]>(`SELECT ${appointmentColumns} FROM appointments WHERE id = $1`, [id]);
    if (!rows[0]) throw new Error("Appointment was not found.");
    return mapAppointment(rows[0]);
  }
}
