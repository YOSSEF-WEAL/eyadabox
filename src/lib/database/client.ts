import Database from "@tauri-apps/plugin-sql";
import { seedDemoData } from "./seedDemoData";

const DATABASE_PATH = "sqlite:clinic-desk.db";
let databasePromise: Promise<Database> | undefined;

export function getDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = Database.load(DATABASE_PATH).then(async (database) => {
      await database.execute("PRAGMA foreign_keys = ON");
      await database.execute("PRAGMA journal_mode = WAL");
      await database.execute("PRAGMA busy_timeout = 5000");
      await seedDemoData(database);
      return database;
    });
  }

  return databasePromise;
}

export function resetDatabaseConnection(): void {
  databasePromise = undefined;
}
