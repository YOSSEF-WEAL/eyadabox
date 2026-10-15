import { getDatabase } from "@/lib/database/client";
import { toDatabaseError } from "@/lib/database/errors";
import type { ClinicSettings, SaveClinicSettingsInput } from "../domain/types";
import type { ClinicSettingsRepository } from "./clinicSettingsRepository";

type ClinicSettingsRow = {
  clinic_name: string;
  phone: string | null;
  address: string | null;
  default_appointment_minutes: number;
  session_expiry_days: number;
};

function mapSettings(row: ClinicSettingsRow): ClinicSettings {
  return {
    clinicName: row.clinic_name,
    phone: row.phone ?? "",
    address: row.address ?? "",
    defaultAppointmentMinutes: row.default_appointment_minutes,
    sessionExpiryDays: row.session_expiry_days,
  };
}

export class SqliteClinicSettingsRepository implements ClinicSettingsRepository {
  async get(): Promise<ClinicSettings> {
    try {
      const database = await getDatabase();
      const rows = await database.select<ClinicSettingsRow[]>("SELECT clinic_name, phone, address, default_appointment_minutes, session_expiry_days FROM clinic_settings WHERE id = $1", ["default"]);
      if (!rows[0]) throw new Error("Clinic settings were not initialized.");
      return mapSettings(rows[0]);
    } catch (error) {
      throw toDatabaseError(error, "Unable to load clinic settings.");
    }
  }

  async save(input: SaveClinicSettingsInput): Promise<ClinicSettings> {
    const value = { ...input, clinicName: input.clinicName.trim(), phone: input.phone.trim(), address: input.address.trim() };
    try {
      const database = await getDatabase();
      await database.execute(
        "UPDATE clinic_settings SET clinic_name = $1, phone = $2, address = $3, default_appointment_minutes = $4, session_expiry_days = $5, updated_at = $6 WHERE id = $7",
        [value.clinicName, value.phone || null, value.address || null, value.defaultAppointmentMinutes, value.sessionExpiryDays, new Date().toISOString(), "default"],
      );
      return value;
    } catch (error) {
      throw toDatabaseError(error, "Unable to save clinic settings.");
    }
  }
}
