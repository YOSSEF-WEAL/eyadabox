import type { SaveStaffMemberInput, StaffMember } from "../domain/types";

export interface StaffRepository {
  list(): Promise<StaffMember[]>;
  findById(id: string): Promise<StaffMember | null>;
  create(input: SaveStaffMemberInput): Promise<StaffMember>;
  update(id: string, input: SaveStaffMemberInput): Promise<StaffMember>;
}
