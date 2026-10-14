# 03 — Clinic Application Shell

## Goal

Replace the generic dashboard navigation with a focused clinic workspace while retaining reusable primitives from the template.

## Navigation

- Dashboard
- Appointments
- Patients
- Practitioners
- Settings

Role-based visibility is applied to administrative screens. The sidebar must not show template commerce, charts, social login, or promotional content in the clinic product.

## Dashboard

- Today’s appointments by status
- Next appointments
- Patient count summary
- Clear empty states for new clinics

## Shared UI work

- Convert all active UI strings to `en` and `ar` translation dictionaries.
- Preserve logical Tailwind direction utilities and verify RTL menu, dropdown, table, and calendar behavior.
- Create common table, page-header, empty-state, loading-state, and confirmation-dialog patterns.
- Add a clinic-specific application identity and remove TailAdmin branding only when replacement assets are available.

## Acceptance criteria

- Navigation contains only active clinic modules.
- English/Arabic switching updates labels and layout direction.
- Empty, loading, success, validation, and error states have a consistent presentation.

## Implementation record

- The clinic dashboard now reads appointments and patients from the service layer to show live daily counts and upcoming appointments.
