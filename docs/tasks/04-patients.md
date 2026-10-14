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
