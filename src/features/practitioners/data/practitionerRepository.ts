import type { Practitioner, SavePractitionerInput } from "../domain/types";

export interface PractitionerRepository {
  list(): Promise<Practitioner[]>;
  findById(id: string): Promise<Practitioner | null>;
  create(input: SavePractitionerInput): Promise<Practitioner>;
  update(id: string, input: SavePractitionerInput): Promise<Practitioner>;
}
