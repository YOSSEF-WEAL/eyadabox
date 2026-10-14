import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthProvider";
import { isTauriRuntime } from "@/lib/runtime/isTauriRuntime";
export function RequireAuth() { const auth=useAuth(); const location=useLocation(); if (!isTauriRuntime()) return <Navigate to="/signin" replace />; if (auth.loading) return null; if (auth.requiresSetup) return <Navigate to="/setup" replace />; return auth.authenticated ? <Outlet /> : <Navigate to="/signin" state={{ from: location }} replace />; }
export function RequireAdmin() { const auth=useAuth(); return auth.user?.role === "admin" ? <Outlet /> : <Navigate to="/" replace />; }
