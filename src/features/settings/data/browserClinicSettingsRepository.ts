import type { ClinicSettings, SaveClinicSettingsInput } from "../domain/types";
import type { ClinicSettingsRepository } from "./clinicSettingsRepository";

const STORAGE_KEY = "clinic-desk.demo-settings";
const defaultSettings: ClinicSettings = { clinicName: "Al Noor Clinic", phone: "01000000000", address: "Cairo", defaultAppointmentMinutes: 30 };

export class BrowserClinicSettingsRepository implements ClinicSettingsRepository {
  async get(): Promise<ClinicSettings> {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) { localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings)); return { ...defaultSettings }; }
    return JSON.parse(saved) as ClinicSettings;
  }

  async save(input: SaveClinicSettingsInput): Promise<ClinicSettings> {
    const value = { ...input, clinicName: input.clinicName.trim(), phone: input.phone.trim(), address: input.address.trim() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return value;
  }
}
