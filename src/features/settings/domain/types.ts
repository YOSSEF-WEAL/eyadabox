export interface ClinicSettings {
  clinicName: string;
  phone: string;
  address: string;
  defaultAppointmentMinutes: number;
  sessionExpiryDays: number;
}

export type SaveClinicSettingsInput = ClinicSettings;
