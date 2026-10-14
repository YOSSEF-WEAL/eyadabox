# Architecture

## Runtime

Tauri 2 owns the Windows application window, native lifecycle, secure command boundary, and installer. React renders the user interface. SQLite is a single local database stored in the Tauri application-data directory.

```
React feature screen
  -> typed feature service
  -> Tauri SQL plugin / narrow Rust command
  -> SQLite database in app-data directory
```

There is no HTTP API, localhost server, cloud dependency, or background Node.js process.

## Standard assumptions for the first version

- One clinic installation can contain multiple practitioners.
- Local staff accounts have `admin`, `doctor`, or `receptionist` roles. This is access control within the application, not protection from a Windows administrator with direct disk access.
- A patient has one record, a stable internal ID, contact details, optional demographic data, and clinical/admin notes.
- An appointment belongs to one patient and one practitioner and has a start/end time and lifecycle status.
- Scheduling validates overlaps for the same practitioner and is based on configured working hours.
- The first release has no cloud synchronization, electronic prescription integration, insurance claims, online booking, or payment gateway. These can be added as separate modules later.

## Data protection

The database is backed up through an explicit local export flow. Restore first creates a safety copy of the current database and validates the selected backup before replacement. Updates preserve the application-data directory and never reset user data.
