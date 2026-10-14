import type { SaveStaffMemberInput, StaffMember } from "../domain/types";
import type { StaffRepository } from "./staffRepository";

const STORAGE_KEY = "clinic-desk.staff";

const demoStaff: StaffMember[] = [
  { id: "ST-1001", displayName: "Clinic Administrator", username: "admin", role: "admin", isActive: true, createdAt: "2026-10-01T09:00:00.000Z", updatedAt: "2026-10-01T09:00:00.000Z" },
  { id: "ST-1002", displayName: "Mona Reception", username: "mona", role: "receptionist", isActive: true, createdAt: "2026-10-02T09:00:00.000Z", updatedAt: "2026-10-02T09:00:00.000Z" },
];

function readStaff(): StaffMember[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoStaff));
    return [...demoStaff];
  }
  return JSON.parse(saved) as StaffMember[];
}

function writeStaff(staff: StaffMember[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
}

export class BrowserStaffRepository implements StaffRepository {
  async list(): Promise<StaffMember[]> {
    return readStaff().sort((a, b) => a.displayName.localeCompare(b.displayName));
  }

  async findById(id: string): Promise<StaffMember | null> {
    return readStaff().find((member) => member.id === id) ?? null;
  }

  async create(input: SaveStaffMemberInput): Promise<StaffMember> {
    const staff = readStaff();
    if (staff.some((member) => member.username === input.username)) throw new Error("STAFF_USERNAME_TAKEN");
    const now = new Date().toISOString();
    const member: StaffMember = { id: `ST-${String(1000 + staff.length + 1).padStart(4, "0")}`, ...input, createdAt: now, updatedAt: now };
    writeStaff([...staff, member]);
    return member;
  }

  async update(id: string, input: SaveStaffMemberInput): Promise<StaffMember> {
    const staff = readStaff();
    const index = staff.findIndex((member) => member.id === id);
    if (index === -1) throw new Error("STAFF_NOT_FOUND");
    if (staff.some((member) => member.id !== id && member.username === input.username)) throw new Error("STAFF_USERNAME_TAKEN");
    const member = { ...staff[index], ...input, updatedAt: new Date().toISOString() };
    staff[index] = member;
    writeStaff(staff);
    return member;
  }
}
