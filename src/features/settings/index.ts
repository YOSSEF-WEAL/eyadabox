import { BrowserClinicSettingsRepository } from "./data/browserClinicSettingsRepository";
import { SqliteClinicSettingsRepository } from "./data/sqliteClinicSettingsRepository";
import { ClinicSettingsService } from "./services/clinicSettingsService";
import { isTauriRuntime } from "@/lib/runtime/isTauriRuntime";

export const clinicSettingsService = new ClinicSettingsService(isTauriRuntime() ? new SqliteClinicSettingsRepository() : new BrowserClinicSettingsRepository());
export type { ClinicSettings, SaveClinicSettingsInput } from "./domain/types";
