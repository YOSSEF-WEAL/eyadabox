export class DatabaseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "DatabaseError";
    this.cause = options?.cause;
  }
}

export function toDatabaseError(error: unknown, fallbackMessage: string): DatabaseError {
  if (error instanceof DatabaseError) return error;
  return new DatabaseError(fallbackMessage, { cause: error });
}
