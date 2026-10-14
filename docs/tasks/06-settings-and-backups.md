# 06 — Settings and Backups

## Goal

Give an administrator the minimum control required to run and protect a local clinic installation.

## Features

- Clinic name, phone, address, and default appointment duration.
- Practitioner management and weekly working hours.
- Local staff account management and roles.
- Theme and language preference.
- Backup export, backup list metadata, restore confirmation, and restore validation.

## Security behavior

- Passwords are hashed in the native layer and never returned to React.
- Restore is restricted to administrators.
- The restore flow describes that it replaces current data after creating a safety copy.

## Acceptance criteria

- Settings survive application restart.
- A backup can be exported without exposing arbitrary filesystem access to the frontend.
- Restore prevents invalid files from replacing the live database.

## Implementation record

- Added web-phase clinic settings service and browser repository.
- Clinic name, contact details, address, and default appointment duration can now be saved locally.
- Practitioner weekly working hours are available in the web phase and persist in browser storage. Native backup/restore remains part of the later desktop/SQLite phase.
- The configured default appointment duration now also controls the time prefilled when a new booking starts from the appointments calendar.
- Practitioner creation, editing, and read-only details now use dedicated pages because weekly working hours are too detailed for a modal.
- Added local staff management at `/staff` with browser and SQLite repositories behind the staff service. The staff form manages display name, username, role (`admin`, `receptionist`, or `practitioner`), and active state without accepting or returning passwords.
- The SQLite table stores the established `doctor` value for the product-facing `practitioner` role, so the database schema remains unchanged. This metadata-only phase writes an empty existing password-hash field; login/password setup remains a native authentication task and is not exposed to React.
- The service prevents an administrator from disabling or changing the role of the final active administrator. Fresh demo databases include an administrator and a receptionist for this workflow.
