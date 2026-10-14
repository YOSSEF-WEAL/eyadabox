# Clinic Desktop Application

This directory is the execution plan and durable project record for the clinic management desktop application.

## Product decision

The application is an offline-first Windows 10/11 clinic system. It is installed once per clinic computer, stores clinic data locally in SQLite, and does not require a web server, cloud database, Node.js, or Rust on the customer's machine.

The initial UI languages are English and Arabic. The selected interface language is a local preference only; patient and clinic records are stored once in the language entered by the user.

## MVP modules

1. Application foundation and local database
2. Clinic profile, practitioners, and local staff access
3. Patient directory and patient profile
4. Appointment calendar and daily schedule
5. Settings, local backup, and restore

## Task order

| ID | Task | Status |
| --- | --- | --- |
| [00](tasks/00-requirements-and-decisions.md) | Requirements and product decisions | Complete |
| [01](tasks/01-tauri-foundation.md) | Tauri desktop foundation | Deferred until the desktop-conversion phase |
| [02](tasks/02-database-and-migrations.md) | SQLite schema and migrations | Deferred native verification; API design retained |
| [03](tasks/03-application-shell.md) | Clinic application shell and navigation | In progress — navigation and clinic dashboard implemented |
| [04](tasks/04-patients.md) | Patient management | In progress — directory, demo data, add, and edit are implemented |
| [05](tasks/05-appointments.md) | Appointment scheduling | In progress — demo schedule, add, edit, and conflict validation are implemented |
| [06](tasks/06-settings-and-backups.md) | Settings, backup, and restore | In progress — clinic details and default appointment duration implemented |
| [07](tasks/07-quality-and-release.md) | Quality assurance and Windows release | Not started |
| [08](tasks/08-local-auth-and-onboarding.md) | Local authentication and first-run onboarding | Implemented; runtime verification pending user-authorized command |

Each task contains scope, implementation details, dependencies, and acceptance criteria. A task is not marked complete until its acceptance criteria have been verified without running a build unless the user explicitly asks for one.

Read [PROJECT_RULES.md](PROJECT_RULES.md) before changing the project.
