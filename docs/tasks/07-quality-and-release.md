# 07 — Quality Assurance and Windows Release

## Goal

Prepare a reliable installer only after the MVP has passed functional verification.

## Verification checklist

- Fresh database creation and migration upgrade path
- Patient and appointment CRUD persistence after restart
- Appointment conflict and input validation handling
- English and Arabic RTL usability
- Backup and restore recovery path
- Offline behavior with network disabled
- Installer/uninstaller behavior and retained app data
- Package size, startup time, and idle memory measurement on Windows 10 and 11

## Release deliverables

- Tauri Windows executable and NSIS installer
- Product icon, name, version, and identifier
- Installation, backup, and restore documentation
- Known limitations and local-data responsibility notice

## Important

Build and packaging commands are intentionally not run by the agent. Ask the user to run or explicitly authorize the exact required command when this phase is reached.
