import type { PractitionerRepository } from "../data/practitionerRepository";
import type { Practitioner, SavePractitionerInput } from "../domain/types";

function validate(input: SavePractitionerInput): SavePractitionerInput {
  if (!input.displayName.trim()) throw new Error("Practitioner name is required.");
  if (!input.specialty.trim()) throw new Error("Specialty is required.");
  if (!input.workingHours.some((day) => day.isWorking)) throw new Error("Select at least one working day.");
  if (input.workingHours.some((day) => day.isWorking && day.startsAt >= day.endsAt)) throw new Error("Working-hour end time must be after the start time.");
  return input;
}

export class PractitionerService {
  constructor(private readonly repository: PractitionerRepository) {}
  list(): Promise<Practitioner[]> { return this.repository.list(); }
  findById(id: string): Promise<Practitioner | null> { return this.repository.findById(id); }
  create(input: SavePractitionerInput): Promise<Practitioner> { return this.repository.create(validate(input)); }
  update(id: string, input: SavePractitionerInput): Promise<Practitioner> { return this.repository.update(id, validate(input)); }
}
