export type StaffRole = "admin" | "receptionist" | "practitioner";

export interface StaffMember {
  id: string;
  displayName: string;
  username: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaveStaffMemberInput {
  displayName: string;
  username: string;
  role: StaffRole;
  isActive: boolean;
}
