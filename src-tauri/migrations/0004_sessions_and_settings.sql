ALTER TABLE clinic_settings ADD COLUMN session_expiry_days INTEGER NOT NULL DEFAULT 30 CHECK (session_expiry_days BETWEEN 1 AND 365);
CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  staff_user_id TEXT NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
