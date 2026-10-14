export type AuthRole = "admin" | "doctor" | "receptionist";
export interface AuthUser { id: string; displayName: string; username: string; role: AuthRole; }
export interface AuthStatus { requiresSetup: boolean; authenticated: boolean; user: AuthUser | null; }
