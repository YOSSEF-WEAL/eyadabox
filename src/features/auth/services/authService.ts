import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "@/lib/runtime/isTauriRuntime";
import type { AuthStatus, AuthUser } from "../domain/types";

function nativeOnly() { if (!isTauriRuntime()) throw new Error("AUTH_NATIVE_RUNTIME_REQUIRED"); }
export const authService = {
  async status(): Promise<AuthStatus> { nativeOnly(); return invoke<AuthStatus>("auth_status"); },
  async setup(displayName: string, username: string, password: string): Promise<AuthUser> { nativeOnly(); return invoke<AuthUser>("bootstrap_first_admin", { displayName, username, password }); },
  async signIn(username: string, password: string): Promise<AuthUser> { nativeOnly(); return invoke<AuthUser>("sign_in", { username, password }); },
  async signOut(): Promise<void> { nativeOnly(); return invoke("sign_out"); },
  async updateProfile(displayName: string, profilePhone: string, profileBio: string, avatarDataUrl: string | null): Promise<AuthUser> { nativeOnly(); return invoke<AuthUser>("update_profile", { displayName, profilePhone, profileBio, avatarDataUrl }); },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> { nativeOnly(); return invoke("change_password", { currentPassword, newPassword }); },
};
