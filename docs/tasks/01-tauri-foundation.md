# 01 — Tauri Desktop Foundation

## Implementation record

- Windows desktop prerequisites were prepared: Rust is available under the user Cargo directory, MSVC Build Tools with C++ tools are installed, and Windows SDK 10.0.26100 was repaired to include system libraries.
- Verified the Rust layer with `cargo check` and launched `clinic_desk.exe` in Tauri development mode. No installer or release package was created.
- Verified the running desktop UI against the Vite development server. It now selects the SQLite feature repositories and initializes a fresh application-data database with linked demo records on first use.

- Tauri was initialized in `src-tauri/` on 2026-10-14.
- The frontend API and CLI packages are installed.
- Tauri uses the existing Vite application and is configured for an NSIS Windows installer when a release is explicitly requested.
- A restrictive production CSP and a Vite-compatible development CSP are configured.
- Rust and Cargo are installed and verified. Native development is active; distributable packaging remains deferred.

## Phase change

Desktop development is active. Tauri development commands may be used to verify the local runtime, but do not create an installer, distributable executable, or release package without explicit user instruction.

## Goal

Convert the existing Vite + React dashboard into a Tauri 2 Windows application without changing its user-facing clinic functionality yet.

## Implementation

1. Add the official Tauri 2 CLI and runtime packages with npm.
2. Initialize `src-tauri/` for the existing frontend rather than generating a second React project.
3. Configure Tauri to use the existing Vite development command and production `dist` directory.
4. Set application metadata, product name, identifier, and Windows-target settings.
5. Define least-privilege capabilities. Do not enable unrestricted filesystem access.
6. Add a small frontend-native bridge module so feature code never calls Tauri APIs directly.
7. Add application startup error handling and a desktop-safe page title strategy.

## Expected files

- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `src-tauri/capabilities/default.json`
- `src-tauri/src/lib.rs`
- `src/lib/desktop/`

## Acceptance criteria

- Tauri configuration targets Windows 10/11.
- The frontend remains independently runnable in Vite development mode.
- No application data is configured to live in the installation directory.
- No build or installer command is run without explicit user authorization.
