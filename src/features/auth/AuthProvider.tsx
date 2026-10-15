import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authService } from "./services/authService";
import type { AuthStatus, AuthUser } from "./domain/types";

type AuthContextValue = AuthStatus & { loading: boolean; refresh: () => Promise<void>; setup: (name:string, username:string, password:string)=>Promise<void>; signIn:(username:string,password:string)=>Promise<void>; signOut:()=>Promise<void>; updateProfile:(displayName:string, profilePhone:string, profileBio:string, avatarDataUrl:string | null)=>Promise<void>; changePassword:(currentPassword:string,newPassword:string)=>Promise<void>; };
const AuthContext = createContext<AuthContextValue | null>(null);
const initial: AuthStatus = { requiresSetup: false, authenticated: false, user: null };
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(initial); const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { setLoading(true); try { setStatus(await authService.status()); } finally { setLoading(false); } }, []);
  useEffect(() => {
    const refreshTimer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(refreshTimer);
  }, [refresh]);
  const value = useMemo(() => ({ ...status, loading, refresh, setup: async (n:string,u:string,p:string) => { const user=await authService.setup(n,u,p); setStatus({requiresSetup:false,authenticated:true,user}); }, signIn: async(u:string,p:string)=> { const user=await authService.signIn(u,p); setStatus({requiresSetup:false,authenticated:true,user}); }, signOut: async()=>{ await authService.signOut(); setStatus(initial); }, updateProfile: async(displayName:string, profilePhone:string, profileBio:string, avatarDataUrl:string | null)=> { const user:AuthUser=await authService.updateProfile(displayName,profilePhone,profileBio,avatarDataUrl); setStatus({requiresSetup:false,authenticated:true,user}); }, changePassword: async(currentPassword:string,newPassword:string)=>authService.changePassword(currentPassword,newPassword) }), [status,loading,refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value=useContext(AuthContext); if (!value) throw new Error("AuthProvider is required"); return value; }
