# 05 — Appointment Scheduling

## Goal

Make daily scheduling easy for reception staff and doctors.

## Screens and actions

- Daily schedule as the primary screen.
- Optional weekly calendar view once the daily flow is stable.
- Create appointment from patient profile or schedule.
- Reschedule, cancel, mark arrived, no-show, or completed.
- Filter by practitioner and status.

## Business rules

- An appointment must have a patient, practitioner, start time, end time, and valid status.
- The same practitioner cannot have overlapping active appointments.
- Appointments outside configured working hours require an explicit confirmation.
- Cancelled appointments retain their history and do not block time slots.
- Time calculations use the clinic computer’s local timezone in the MVP.

## Acceptance criteria

- Creating a valid appointment persists it and shows it in the schedule after restart.
- Conflicting appointments are rejected with a clear message.
- Arabic RTL and English LTR schedule views remain usable.

## Implementation record

- Added web-phase appointment API, browser repository, and seeded practitioners/appointments.
- Added add and edit appointment handlers, status updates, and same-practitioner overlap validation.
- The appointment form reads patients through `PatientService`; it has no direct storage access.
- Added the clinic appointments calendar alongside the list view. Selecting a slot starts a prefilled appointment, and selecting an existing event opens its edit form.
- Added practitioner and appointment-status filters that update both the calendar and the list together.
