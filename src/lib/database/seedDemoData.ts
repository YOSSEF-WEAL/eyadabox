import type Database from "@tauri-apps/plugin-sql";

const seededAt = "2026-10-01T09:00:00.000Z";

export async function seedDemoData(database: Database): Promise<void> {
  const rows = await database.select<{ count: number }[]>("SELECT COUNT(*) AS count FROM clinic_settings WHERE id = $1", ["default"]);
  if (rows[0]?.count) return;

  try {
    await database.execute("BEGIN");
    await database.execute(
      "INSERT INTO clinic_settings (id, clinic_name, phone, address, default_locale, default_appointment_minutes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      ["default", "Al Noor Clinic", "01000000000", "Cairo", "en", 30, seededAt, seededAt],
    );

    const practitioners = [
      ["DR-1001", "Dr. Salma Adel", "General Practice", "01010000001"],
      ["DR-1002", "Dr. Youssef Fathy", "Internal Medicine", "01010000002"],
    ];
    for (const [id, displayName, specialty, phone] of practitioners) {
      await database.execute(
        "INSERT INTO practitioners (id, display_name, specialty, phone, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, displayName, specialty, phone, 1, seededAt, seededAt],
      );
      for (let day = 0; day < 7; day += 1) {
        await database.execute(
          "INSERT INTO working_hours (id, practitioner_id, weekday, starts_at, ends_at, is_enabled, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [`${id}-WH-${day}`, id, day, "09:00", "17:00", day === 5 ? 0 : 1, seededAt, seededAt],
        );
      }
    }

    const patients = [
      ["PT-1001", "Ahmed Hassan", "01001234567", "1988-04-15", "male", "Cairo", null],
      ["PT-1002", "Mariam Ali", "01007654321", "1994-11-02", "female", "Giza", "Prefers afternoon appointments."],
      ["PT-1003", "Omar Khaled", "01112345678", null, "unspecified", null, null],
    ];
    for (const [id, fullName, phone, dateOfBirth, sex, address, notes] of patients) {
      await database.execute(
        "INSERT INTO patients (id, full_name, phone, date_of_birth, sex, address, notes, archived_at, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9)",
        [id, fullName, phone, dateOfBirth, sex, address, notes, seededAt, seededAt],
      );
    }

    await database.execute(
      "INSERT INTO appointments (id, patient_id, practitioner_id, starts_at, ends_at, status, reason, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9)",
      ["AP-1001", "PT-1001", "DR-1001", "2026-10-14T09:00:00.000Z", "2026-10-14T09:30:00.000Z", "confirmed", "Follow-up visit", "2026-10-13T10:00:00.000Z", "2026-10-13T10:00:00.000Z"],
    );
    await database.execute(
      "INSERT INTO appointments (id, patient_id, practitioner_id, starts_at, ends_at, status, reason, notes, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9)",
      ["AP-1002", "PT-1002", "DR-1002", "2026-10-14T10:00:00.000Z", "2026-10-14T10:30:00.000Z", "scheduled", "Initial consultation", "2026-10-13T11:00:00.000Z", "2026-10-13T11:00:00.000Z"],
    );
    await database.execute("COMMIT");
  } catch (error) {
    await database.execute("ROLLBACK");
    throw error;
  }
}
