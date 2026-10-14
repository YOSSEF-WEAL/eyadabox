PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clinic_settings (
  id TEXT PRIMARY KEY NOT NULL CHECK (id = 'default'),
  clinic_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  default_locale TEXT NOT NULL DEFAULT 'en' CHECK (default_locale IN ('en', 'ar')),
  default_appointment_minutes INTEGER NOT NULL DEFAULT 30 CHECK (default_appointment_minutes BETWEEN 5 AND 480),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS practitioners (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS staff_users (
  id TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist')),
  practitioner_id TEXT REFERENCES practitioners(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS patients (
  id TEXT PRIMARY KEY NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  date_of_birth TEXT,
  sex TEXT CHECK (sex IN ('female', 'male', 'unspecified')),
  address TEXT,
  notes TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY NOT NULL,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  practitioner_id TEXT NOT NULL REFERENCES practitioners(id) ON DELETE RESTRICT,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL CHECK (ends_at > starts_at),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'arrived', 'completed', 'no_show', 'cancelled')),
  reason TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS working_hours (
  id TEXT PRIMARY KEY NOT NULL,
  practitioner_id TEXT NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL CHECK (ends_at > starts_at),
  is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (practitioner_id, weekday)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  actor_staff_user_id TEXT REFERENCES staff_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients(full_name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_practitioner_starts_at ON appointments(practitioner_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_starts_at ON appointments(patient_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status_starts_at ON appointments(status, starts_at);
CREATE INDEX IF NOT EXISTS idx_staff_users_active_username ON staff_users(is_active, username);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id, created_at);
