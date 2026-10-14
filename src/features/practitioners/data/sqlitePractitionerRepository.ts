import { getDatabase } from "@/lib/database/client";
import { toDatabaseError } from "@/lib/database/errors";
import type { Practitioner, SavePractitionerInput, WorkingDay } from "../domain/types";
import type { PractitionerRepository } from "./practitionerRepository";

type PractitionerRow = {
  id: string;
  display_name: string;
  specialty: string | null;
  phone: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

type WorkingHourRow = {
  practitioner_id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
  is_enabled: number;
};

const practitionerColumns = "id, display_name, specialty, phone, is_active, created_at, updated_at";

function mapPractitioner(row: PractitionerRow, workingHours: WorkingDay[]): Practitioner {
  return {
    id: row.id,
    displayName: row.display_name,
    specialty: row.specialty ?? "",
    phone: row.phone,
    isActive: row.is_active === 1,
    workingHours,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkingDay(row: WorkingHourRow): WorkingDay {
  return { day: row.weekday, startsAt: row.starts_at, endsAt: row.ends_at, isWorking: row.is_enabled === 1 };
}

export class SqlitePractitionerRepository implements PractitionerRepository {
  async list(): Promise<Practitioner[]> {
    try {
      const database = await getDatabase();
      const rows = await database.select<PractitionerRow[]>(`SELECT ${practitionerColumns} FROM practitioners WHERE is_active = 1 ORDER BY display_name COLLATE NOCASE ASC`);
      return Promise.all(rows.map((row) => this.mapWithWorkingHours(row)));
    } catch (error) {
      throw toDatabaseError(error, "Unable to load practitioners.");
    }
  }

  async findById(id: string): Promise<Practitioner | null> {
    try {
      const database = await getDatabase();
      const rows = await database.select<PractitionerRow[]>(`SELECT ${practitionerColumns} FROM practitioners WHERE id = $1 AND is_active = 1`, [id]);
      return rows[0] ? this.mapWithWorkingHours(rows[0]) : null;
    } catch (error) {
      throw toDatabaseError(error, "Unable to load the practitioner record.");
    }
  }

  async create(input: SavePractitionerInput): Promise<Practitioner> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      const database = await getDatabase();
      await database.execute("BEGIN");
      await database.execute(
        "INSERT INTO practitioners (id, display_name, specialty, phone, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, 1, $5, $6)",
        [id, input.displayName.trim(), input.specialty.trim(), input.phone?.trim() || null, now, now],
      );
      await this.saveWorkingHours(id, input.workingHours, now);
      await database.execute("COMMIT");
      return this.requireById(id);
    } catch (error) {
      await this.rollback();
      throw toDatabaseError(error, "Unable to create the practitioner record.");
    }
  }

  async update(id: string, input: SavePractitionerInput): Promise<Practitioner> {
    const now = new Date().toISOString();
    try {
      const database = await getDatabase();
      await database.execute("BEGIN");
      const result = await database.execute(
        "UPDATE practitioners SET display_name = $1, specialty = $2, phone = $3, updated_at = $4 WHERE id = $5 AND is_active = 1",
        [input.displayName.trim(), input.specialty.trim(), input.phone?.trim() || null, now, id],
      );
      if (result.rowsAffected !== 1) throw new Error("Practitioner was not found.");
      await this.saveWorkingHours(id, input.workingHours, now);
      await database.execute("COMMIT");
      return this.requireById(id);
    } catch (error) {
      await this.rollback();
      throw toDatabaseError(error, "Unable to update the practitioner record.");
    }
  }

  private async mapWithWorkingHours(row: PractitionerRow): Promise<Practitioner> {
    const database = await getDatabase();
    const rows = await database.select<WorkingHourRow[]>(
      "SELECT practitioner_id, weekday, starts_at, ends_at, is_enabled FROM working_hours WHERE practitioner_id = $1 ORDER BY weekday ASC",
      [row.id],
    );
    return mapPractitioner(row, rows.map(mapWorkingDay));
  }

  private async saveWorkingHours(practitionerId: string, workingHours: WorkingDay[], now: string): Promise<void> {
    const database = await getDatabase();
    await database.execute("DELETE FROM working_hours WHERE practitioner_id = $1", [practitionerId]);
    for (const workingDay of workingHours) {
      await database.execute(
        "INSERT INTO working_hours (id, practitioner_id, weekday, starts_at, ends_at, is_enabled, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [crypto.randomUUID(), practitionerId, workingDay.day, workingDay.startsAt, workingDay.endsAt, workingDay.isWorking ? 1 : 0, now, now],
      );
    }
  }

  private async requireById(id: string): Promise<Practitioner> {
    const practitioner = await this.findById(id);
    if (!practitioner) throw new Error("Practitioner was not found.");
    return practitioner;
  }

  private async rollback(): Promise<void> {
    try {
      const database = await getDatabase();
      await database.execute("ROLLBACK");
    } catch {
      // The statement that failed may already have rolled the transaction back.
    }
  }
}
