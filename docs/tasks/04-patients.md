# 04 — Patient Management

## Goal

Provide fast, safe registration and retrieval of patient records.

## Screens

- Patient directory with search by name, phone, or internal ID.
- New patient form.
- Patient profile with demographics, contact information, appointment history, and notes.
- Edit patient form with confirmation for destructive actions.

## Validation

- Patient name is required.
- Phone is normalized and validated according to the selected clinic country policy.
- Date of birth cannot be in the future.
- Notes are optional and preserve line breaks.
- A duplicate phone is warned about, not silently merged.

## Acceptance criteria

- A staff member can create, find, edit, and archive a patient.
- The directory works with Arabic and English names.
- No patient is permanently deleted from the standard UI while appointments reference it.

## Implementation record

- Added a browser-storage patient repository with seeded demo patients for the web phase.
- Added patient search, add, edit, validation, and feedback handlers through `PatientService`.
- The page does not access storage directly; the desktop phase can swap the repository implementation to SQLite.
- Added `/patients/:patientId` as a patient profile with demographics, preserved notes, and an appointment history ordered newest-first.
- Added loading, empty, missing-record, and safe error states to the profile; the directory now links to it through a View action.
- Profile edits use the existing patient service. Archiving requires a translated confirmation and preserves the profile plus its appointment history.
- Archived patients remain readable at their direct profile URL but are filtered from the normal patient search and cannot receive a new appointment through the clinic UI.
- Added `AppointmentRepository.listByPatient(patientId)` to both browser and SQLite repositories, exposed only through `AppointmentService`; no page imports database or Tauri code.
- `AppointmentService.create` also checks the patient profile before persistence so an archived record cannot receive a newly created appointment from another UI entry point.
