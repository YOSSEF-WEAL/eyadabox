# Project Rules

## Mandatory build rule

Do not run any web build, Tauri build, executable build, installer build, packaging command, or release command unless the user explicitly requests that exact build. This includes `npm run build`, `tauri build`, `cargo build`, `cargo tauri build`, and equivalent commands.

When a build becomes useful, report what command should be run and why, then wait for the user to run it or explicitly authorize it.

## Development rules

- Current phase: desktop development is reopened. Tauri development commands are allowed when needed to verify the local desktop runtime. Do not create a distributable executable, installer, package, or release unless the user explicitly requests that exact output.
- `src-tauri/target/debug/clinic_desk.exe` is a developer-only executable and must never be handed to clinic users. The user-facing artifact is the NSIS installer produced by `npm run tauri:build` under `src-tauri/target/release/bundle/nsis/` after an explicitly requested release build.
- Keep Tauri configuration and the SQLite API boundary in the repository for the later desktop phase, but do not make the current web UI depend on a native runtime.
- Keep the application offline-first. Do not add a local HTTP server, remote database, cloud account, or telemetry unless the user asks for it.
- Use Tauri 2, React, TypeScript, Tailwind CSS, Rust, and SQLite. Prefer Tauri SQL and secure Rust commands over new services.
- Persist writable data only in the operating system application-data directory, never beside the installed executable.
- Use migrations, parameterized queries, foreign keys, indexes, transactions, and user-safe error messages for all database work.
- Keep business logic and persistence behind typed feature APIs. React pages and UI components may call feature services or hooks only; they must not import Tauri, SQLite, or SQL query code directly.
- Place domain types, validation, repositories, and use-case services inside `src/features/<feature>/`. Keep reusable native/database clients under `src/lib/`.
- Keep the UI bilingual in English and Arabic. UI language is never duplicated into patient or clinic data.
- Do not remove existing template components until the replacement clinic screen is implemented and no longer depends on them.
- Do not add dependencies without a stated technical purpose.
- Record completed work and any unresolved decision in the relevant file under `docs/tasks/`.
