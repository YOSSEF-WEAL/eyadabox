# Local authentication and first-run onboarding

## Completed

- The installed Tauri application owns authentication commands and the in-memory session. React receives only a safe user shape: id, display name, username, and role.
- First launch opens `/setup`; it creates the first active administrator atomically. A database with old metadata-only staff records still opens setup until it has a credentialed account.
- Passwords are hashed natively with Argon2id and a random salt. Password hashes never cross the Tauri invoke boundary and are never selected by React.
- `/signin` supports local username/password login. Failed attempts are recorded in SQLite; the fifth failure locks the account for 15 minutes. Login, logout, and onboarding write audit records.
- Sessions are memory-only, so closing the desktop application signs the user out. There is intentionally no public sign-up or password reset screen.
- Dashboard routes require a native authenticated session. `/staff` and `/settings` additionally require the administrator role.
- The browser/Vite runtime displays a localized message that secure sign-in requires the installed desktop app; it does not imitate authentication.

## Security boundary and limitation

The application is offline-first. Its SQLite file lives in the operating-system app-data directory, rather than beside the installed executable. A person with local operating-system access can still inspect or copy that database. Argon2id protects password disclosure, but device-level access control, disk encryption, and Windows user accounts remain part of deployment security. The existing Tauri SQL plugin is used by clinic repositories; UI code must never query `password_hash` or implement password verification.

## Deferred

Staff management currently owns staff metadata and roles only. It does not create, reset, or expose credentials. A future administrator-only credential-provisioning flow must be a new native command with its own audit events and last-active-admin checks.
