import type { ClinicSettings, SaveClinicSettingsInput } from "../domain/types";

export interface ClinicSettingsRepository {
  get(): Promise<ClinicSettings>;
  save(input: SaveClinicSettingsInput): Promise<ClinicSettings>;
}
