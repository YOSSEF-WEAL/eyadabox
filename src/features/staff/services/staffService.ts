import type { StaffRepository } from "../data/staffRepository";
import type { SaveStaffMemberInput, StaffMember } from "../domain/types";
import { validateStaffMemberInput } from "../domain/validation";

export class StaffService {
  constructor(private readonly repository: StaffRepository) {}

  list(): Promise<StaffMember[]> { return this.repository.list(); }
  findById(id: string): Promise<StaffMember | null> { return this.repository.findById(id); }

  async create(input: SaveStaffMemberInput): Promise<StaffMember> {
    return this.repository.create(validateStaffMemberInput(input));
  }

  async update(id: string, input: SaveStaffMemberInput): Promise<StaffMember> {
    const next = validateStaffMemberInput(input);
    const current = await this.repository.findById(id);
    if (!current) throw new Error("STAFF_NOT_FOUND");

    const removesActiveAdmin = current.role === "admin" && current.isActive && (next.role !== "admin" || !next.isActive);
    if (removesActiveAdmin) {
      const activeAdminCount = (await this.repository.list()).filter((member) => member.role === "admin" && member.isActive).length;
      if (activeAdminCount <= 1) throw new Error("STAFF_LAST_ACTIVE_ADMIN_REQUIRED");
    }

    return this.repository.update(id, next);
  }
}
