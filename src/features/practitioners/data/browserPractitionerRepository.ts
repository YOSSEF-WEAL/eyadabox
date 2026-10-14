import type { Practitioner, SavePractitionerInput, WorkingDay } from "../domain/types";
import type { PractitionerRepository } from "./practitionerRepository";

const STORAGE_KEY = "clinic-desk.demo-practitioners";
const defaultWorkingHours = (): WorkingDay[] => Array.from({ length: 7 }, (_, day) => ({ day, isWorking: day !== 5, startsAt: "09:00", endsAt: "17:00" }));
const demoPractitioners: Practitioner[] = [
  { id: "DR-1001", displayName: "Dr. Salma Adel", specialty: "General Practice", phone: "01010000001", workingHours: defaultWorkingHours(), isActive: true, createdAt: "2026-10-01T09:00:00.000Z", updatedAt: "2026-10-01T09:00:00.000Z" },
  { id: "DR-1002", displayName: "Dr. Youssef Fathy", specialty: "Internal Medicine", phone: "01010000002", workingHours: defaultWorkingHours(), isActive: true, createdAt: "2026-10-01T09:00:00.000Z", updatedAt: "2026-10-01T09:00:00.000Z" },
];

function readPractitioners(): Practitioner[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) { localStorage.setItem(STORAGE_KEY, JSON.stringify(demoPractitioners)); return [...demoPractitioners]; }
  return (JSON.parse(saved) as Practitioner[]).map((practitioner) => ({ ...practitioner, workingHours: practitioner.workingHours?.length ? practitioner.workingHours : defaultWorkingHours() }));
}

function writePractitioners(practitioners: Practitioner[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(practitioners)); }

export class BrowserPractitionerRepository implements PractitionerRepository {
  async list(): Promise<Practitioner[]> { return readPractitioners().filter((practitioner) => practitioner.isActive).sort((a, b) => a.displayName.localeCompare(b.displayName)); }
  async findById(id: string): Promise<Practitioner | null> { return readPractitioners().find((practitioner) => practitioner.id === id && practitioner.isActive) ?? null; }
  async create(input: SavePractitionerInput): Promise<Practitioner> { const practitioners = readPractitioners(); const now = new Date().toISOString(); const practitioner: Practitioner = { id: `DR-${String(1000 + practitioners.length + 1).padStart(4, "0")}`, displayName: input.displayName.trim(), specialty: input.specialty.trim(), phone: input.phone?.trim() || null, workingHours: input.workingHours, isActive: true, createdAt: now, updatedAt: now }; writePractitioners([...practitioners, practitioner]); return practitioner; }
  async update(id: string, input: SavePractitionerInput): Promise<Practitioner> { const practitioners = readPractitioners(); const index = practitioners.findIndex((practitioner) => practitioner.id === id); if (index === -1) throw new Error("Practitioner was not found."); const updated = { ...practitioners[index], displayName: input.displayName.trim(), specialty: input.specialty.trim(), phone: input.phone?.trim() || null, workingHours: input.workingHours, updatedAt: new Date().toISOString() }; practitioners[index] = updated; writePractitioners(practitioners); return updated; }
}
