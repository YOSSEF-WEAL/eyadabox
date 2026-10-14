export type WorkingDay = {
  day: number;
  isWorking: boolean;
  startsAt: string;
  endsAt: string;
};

export interface Practitioner {
  id: string;
  displayName: string;
  specialty: string;
  phone: string | null;
  workingHours: WorkingDay[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavePractitionerInput {
  displayName: string;
  specialty: string;
  phone?: string;
  workingHours: WorkingDay[];
}
