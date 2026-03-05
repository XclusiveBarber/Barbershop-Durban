"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "customer" | "barber" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Supabase access token — used to authenticate API requests */
  accessToken?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (user: AuthUser) => void;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<Pick<AuthUser, "name" | "email">>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hydrate from existing Supabase session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await syncProfile(session.user.id, session.access_token);
      }
      setIsLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          await syncProfile(session.user.id, session.access_token);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /** Fetch the profile row for this auth user and update local state */
  async function syncProfile(userId: string, accessToken: string) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", userId)
      .single();

    // Get email from Supabase auth metadata
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const email = authUser?.email ?? "";

    setUser({
      id: userId,
      name: profile?.full_name ?? "",
      email,
      role: (profile?.role as UserRole) ?? "customer",
      accessToken,
    });
  }

  /** Called after verifyOtp succeeds — Supabase session is already set at this
   *  point; this just lets external code pass extra data (e.g. name) immediately
   *  before the onAuthStateChange fires. */
  const login = (userData: AuthUser) => {
    setUser(userData);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = (partial: Partial<Pick<AuthUser, "name" | "email">>) => {
    if (!user) return;
    setUser({ ...user, ...partial });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
