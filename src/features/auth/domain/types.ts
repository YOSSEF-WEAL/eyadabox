export type AuthRole = "admin" | "doctor" | "receptionist";
export interface AuthUser { id: string; displayName: string; username: string; role: AuthRole; avatarDataUrl: string | null; profilePhone: string | null; profileBio: string | null; }
export interface AuthStatus { requiresSetup: boolean; authenticated: boolean; user: AuthUser | null; }
