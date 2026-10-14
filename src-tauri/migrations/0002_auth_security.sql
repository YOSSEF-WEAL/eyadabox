-- Adds fields without deleting or rewriting existing staff data.
ALTER TABLE staff_users ADD COLUMN failed_login_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE staff_users ADD COLUMN locked_until TEXT;
ALTER TABLE staff_users ADD COLUMN password_updated_at TEXT;
CREATE INDEX IF NOT EXISTS idx_staff_users_auth_lookup ON staff_users(username COLLATE NOCASE, is_active);
