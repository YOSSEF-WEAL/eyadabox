export interface ClinicSettings {
  clinicName: string;
  phone: string;
  address: string;
  defaultAppointmentMinutes: number;
}

export type SaveClinicSettingsInput = ClinicSettings;
