# 02 — SQLite Database and Migrations

## Goal

Create the persistent local data foundation before implementing patient or appointment screens.

## Tables

- Migration history: managed transactionally by the official Tauri SQL plugin.
- `clinic_settings`: clinic identity, contact data, default locale, and scheduling defaults.
- `staff_users`: local username, password hash, display name, role, active state, timestamps.
- `practitioners`: practitioner profile, specialty label, active state, timestamps.
- `patients`: internal ID, name, phone, optional date of birth, sex, address, notes, timestamps.
- `appointments`: patient, practitioner, start/end, status, reason, notes, timestamps.
- `working_hours`: practitioner weekday, start/end time, enabled state.
- `audit_log`: local administrative actions that affect data integrity.

## Database rules

- Use UUIDs or generated stable text IDs for application entities.
- Enable `PRAGMA foreign_keys = ON` for every connection.
- Add indexes for patient name/phone, appointment practitioner/start time, appointment patient/start time, and active staff usernames.
- Enforce appointment status values with a check constraint.
- Use migrations that are idempotent, versioned, and recorded in `schema_migrations`.
- Run compound operations in transactions.
- Never store plaintext passwords. Use a modern password hash in Rust.

## Access layer

- Define TypeScript domain types separate from SQL row types.
- Keep queries in repository modules under `src/features/<feature>/data/`.
- Expose typed use-case services to React screens.
- Convert native/database errors to concise, actionable Arabic/English UI messages.

## Backup design

- Store the live database under Tauri app-data.
- Export a timestamped backup through a user-selected location.
- Validate a backup before restore and create a pre-restore safety copy.

## Acceptance criteria

- A fresh installation creates a database and records migrations.
- Foreign keys and constraints reject invalid relationships.
- Reopening the app retains records.
- Migration failure leaves the prior database usable or presents a recoverable error.

## Implementation record

- Added the official Tauri SQL plugin configured for SQLite.
- Added migration `0001_clinic_core_schema.sql` with clinic, staff, practitioner, patient, appointment, working-hours, and audit tables plus indexes and constraints.
- Added typed SQLite repository implementations for patients, practitioners (including working hours), appointments, and clinic settings. The UI calls their feature services only.
- At runtime, Tauri selects the SQLite repositories; browser-only execution keeps the existing local-storage demo repositories.
- A new desktop database is initialized once with linked demo clinic, practitioner, patient, and appointment data, so the calendar is usable on first launch without reseeding a used clinic.
- Native database schema and development runtime were verified after completing the local Rust/MSVC/Windows SDK prerequisites. No installer or release package was created.

## Phase change

The SQLite plugin and migration implementation are retained for later desktop conversion. Current web UI work must use typed service contracts and remain independent of the Tauri runtime.
