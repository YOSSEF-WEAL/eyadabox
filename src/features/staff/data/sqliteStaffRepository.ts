import { getDatabase } from "@/lib/database/client";
import { toDatabaseError } from "@/lib/database/errors";
import type { SaveStaffMemberInput, StaffMember, StaffRole } from "../domain/types";
import type { StaffRepository } from "./staffRepository";

type StaffRow = {
  id: string;
  display_name: string;
  username: string;
  role: "admin" | "doctor" | "receptionist";
  is_active: number;
  created_at: string;
  updated_at: string;
};

const columns = "id, display_name, username, role, is_active, created_at, updated_at";

function toStaffRole(role: StaffRow["role"]): StaffRole {
  return role === "doctor" ? "practitioner" : role;
}

function toDatabaseRole(role: StaffRole): StaffRow["role"] {
  return role === "practitioner" ? "doctor" : role;
}

function mapStaff(row: StaffRow): StaffMember {
  return { id: row.id, displayName: row.display_name, username: row.username, role: toStaffRole(row.role), isActive: row.is_active === 1, createdAt: row.created_at, updatedAt: row.updated_at };
}

export class SqliteStaffRepository implements StaffRepository {
  async list(): Promise<StaffMember[]> {
    try {
      const database = await getDatabase();
      const rows = await database.select<StaffRow[]>(`SELECT ${columns} FROM staff_users ORDER BY display_name COLLATE NOCASE ASC`);
      return rows.map(mapStaff);
    } catch (error) {
      throw toDatabaseError(error, "Unable to load staff members.");
    }
  }

  async findById(id: string): Promise<StaffMember | null> {
    try {
      const database = await getDatabase();
      const rows = await database.select<StaffRow[]>(`SELECT ${columns} FROM staff_users WHERE id = $1`, [id]);
      return rows[0] ? mapStaff(rows[0]) : null;
    } catch (error) {
      throw toDatabaseError(error, "Unable to load the staff member.");
    }
  }

  async create(input: SaveStaffMemberInput): Promise<StaffMember> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      const database = await getDatabase();
      await database.execute(
        "INSERT INTO staff_users (id, username, display_name, role, practitioner_id, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, NULL, $5, $6, $7)",
        [id, input.username, input.displayName, toDatabaseRole(input.role), input.isActive ? 1 : 0, now, now],
      );
      const member = await this.findById(id);
      if (!member) throw new Error("Staff member was not found.");
      return member;
    } catch (error) {
      throw toDatabaseError(error, "Unable to create the staff member.");
    }
  }

  async update(id: string, input: SaveStaffMemberInput): Promise<StaffMember> {
    const now = new Date().toISOString();
    try {
      const database = await getDatabase();
      const result = await database.execute(
        "UPDATE staff_users SET username = $1, display_name = $2, role = $3, is_active = $4, updated_at = $5 WHERE id = $6",
        [input.username, input.displayName, toDatabaseRole(input.role), input.isActive ? 1 : 0, now, id],
      );
      if (result.rowsAffected !== 1) throw new Error("Staff member was not found.");
      const member = await this.findById(id);
      if (!member) throw new Error("Staff member was not found.");
      return member;
    } catch (error) {
      throw toDatabaseError(error, "Unable to update the staff member.");
    }
  }
}
