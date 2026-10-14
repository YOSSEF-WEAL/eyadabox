import type { SaveStaffMemberInput } from "./types";

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,50}$/;

export function validateStaffMemberInput(input: SaveStaffMemberInput): SaveStaffMemberInput {
  const displayName = input.displayName.trim();
  const username = input.username.trim().toLocaleLowerCase();

  if (!displayName) throw new Error("STAFF_NAME_REQUIRED");
  if (!USERNAME_PATTERN.test(username)) throw new Error("Username must be 3–50 characters and may use letters, numbers, dots, dashes, or underscores.");
  if (!(["admin", "receptionist", "practitioner"] as const).includes(input.role)) throw new Error("STAFF_ROLE_INVALID");

  return { ...input, displayName, username };
}
