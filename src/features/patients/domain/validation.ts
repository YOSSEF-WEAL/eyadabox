import type { CreatePatientInput } from "./types";

export function validatePatientInput(input: CreatePatientInput): CreatePatientInput {
  const fullName = input.fullName.trim();
  if (!fullName) throw new Error("Patient name is required.");
  if (input.dateOfBirth && new Date(input.dateOfBirth) > new Date()) {
    throw new Error("Date of birth cannot be in the future.");
  }

  return {
    ...input,
    fullName,
    phone: input.phone?.trim() || undefined,
    address: input.address?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
  };
}
