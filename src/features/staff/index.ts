import { isTauriRuntime } from "@/lib/runtime/isTauriRuntime";
import { BrowserStaffRepository } from "./data/browserStaffRepository";
import { SqliteStaffRepository } from "./data/sqliteStaffRepository";
import { StaffService } from "./services/staffService";

export const staffService = new StaffService(isTauriRuntime() ? new SqliteStaffRepository() : new BrowserStaffRepository());
export type { SaveStaffMemberInput, StaffMember, StaffRole } from "./domain/types";
