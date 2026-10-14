import { BrowserPractitionerRepository } from "./data/browserPractitionerRepository";
import { SqlitePractitionerRepository } from "./data/sqlitePractitionerRepository";
import { PractitionerService } from "./services/practitionerService";
import { isTauriRuntime } from "@/lib/runtime/isTauriRuntime";

export const practitionerService = new PractitionerService(isTauriRuntime() ? new SqlitePractitionerRepository() : new BrowserPractitionerRepository());
export type { Practitioner, SavePractitionerInput, WorkingDay } from "./domain/types";
