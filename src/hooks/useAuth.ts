import { useState, useEffect, useCallback } from "react";
import { apiFetch, getSessionToken, setSessionToken } from "../lib/api";

import { UserPermissions } from "../types";

export interface AuthUser {
  email: string;
  company_id: string | null;
  company_name: string | null;
  role: "admin" | "accountant" | "purchaser" | "member" | null;
  position: string | null;
  permissions: UserPermissions;
  is_platform_owner: boolean;
  status: "active" | "revoked";
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = getSessionToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiFetch<AuthUser>("/api/me");
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch current user:", err);
      // If unauthorized or error, clear local token
      setSessionToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const signInWithPassword = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const response = await apiFetch<{ token: string; user: AuthUser }>("/api/login", {
        method: "POST",
        body: { email, password },
      });
      setSessionToken(response.token);
      setUser(response.user);
      return response.user;
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const response = await apiFetch<{ token: string; user: AuthUser }>("/api/signup", {
        method: "POST",
        body: { email, password },
      });
      setSessionToken(response.token);
      setUser(response.user);
      return response.user;
    } catch (err: any) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await apiFetch("/api/logout", { method: "POST" }).catch(() => {});
    } catch (_) {}
    setSessionToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const refreshUser = async () => {
    try {
      const data = await apiFetch<AuthUser>("/api/me");
      setUser(data);
      return data;
    } catch (err) {
      console.error("Failed to refresh user:", err);
      return null;
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    signInWithPassword,
    signUp,
    signOut,
    refreshUser,
  };
}
