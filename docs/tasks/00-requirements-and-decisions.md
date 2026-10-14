# 00 — Requirements and Product Decisions

## Goal

Establish the MVP scope without over-specializing the system for one medical field.

## Confirmed requirements

- Installable Windows desktop application.
- Works offline after installation.
- Flexible clinic workflow suitable for different specialties.
- Simple workflow for doctors and clinic staff.
- English and Arabic user interface with RTL support.
- Data is stored once; translations apply only to the UI.

## Standard MVP workflow

1. An administrator configures clinic details, practitioners, working hours, and local staff accounts.
2. A receptionist finds an existing patient or registers a new patient.
3. The receptionist creates, reschedules, cancels, or marks an appointment complete.
4. A doctor opens the day schedule and the patient profile, then adds a private note when required.
5. An administrator creates local backups and restores them when necessary.

## Out of scope for MVP

- Cloud sync and multi-branch synchronization
- Online appointment booking
- Payment gateway or insurance integration
- Lab, imaging, pharmacy, and e-prescription integrations
- SMS/WhatsApp messages

## Decisions to preserve

- Multiple practitioners are modeled from day one, even if a clinic starts with one doctor.
- Local login is included with the roles `admin`, `doctor`, and `receptionist`.
- Medical fields remain generic and configurable; specialty-specific workflows are future modules.

## Completion criteria

- Scope, assumptions, and excluded functionality are recorded.
- New feature requests are classified as MVP or later release before implementation.
