import type { ClinicSettingsRepository } from "../data/clinicSettingsRepository";
import type { ClinicSettings, SaveClinicSettingsInput } from "../domain/types";

function validate(input: SaveClinicSettingsInput): SaveClinicSettingsInput {
  if (!input.clinicName.trim()) throw new Error("Clinic name is required.");
  if (!Number.isInteger(input.defaultAppointmentMinutes) || input.defaultAppointmentMinutes < 5 || input.defaultAppointmentMinutes > 480) throw new Error("Default appointment duration must be between 5 and 480 minutes.");
  return input;
}

export class ClinicSettingsService {
  constructor(private readonly repository: ClinicSettingsRepository) {}
  get(): Promise<ClinicSettings> { return this.repository.get(); }
  save(input: SaveClinicSettingsInput): Promise<ClinicSettings> { return this.repository.save(validate(input)); }
}
