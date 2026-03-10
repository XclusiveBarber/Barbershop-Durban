"use client";

/**
 * Auth Context — Email-based OTP with Supabase
 *
 * Handles:
 * - User login via email OTP
 * - Session management
 * - Profile data from Supabase
 * - Logout and session cleanup
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "customer" | "barber" | "admin";

export interface AuthUser {
  id: string; // Supabase auth.users.id
  email: string; // Primary identifier (email OTP)
  name: string; // Full name
  role: UserRole; // Role type
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (user: AuthUser, accessToken?: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<Pick<AuthUser, "name">>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "xclusiveUser";
const TOKEN_KEY = "xclusiveToken";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize via onAuthStateChange — INITIAL_SESSION fires on mount with current session,
  // SIGNED_IN fires after OTP/login, TOKEN_REFRESHED keeps the token fresh.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Profile load is deferred via setTimeout so it runs OUTSIDE the onAuthStateChange
    // callback. Supabase holds an internal mutex while firing auth events — calling
    // supabase.from() synchronously inside the callback deadlocks the client.
    const loadProfile = (session: { access_token: string; user: { id: string; email?: string } }) => {
      setTimeout(async () => {
        localStorage.setItem(TOKEN_KEY, session.access_token);
        setAccessToken(session.access_token);

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", session.user.id)
          .single();

        if (profile?.full_name) {
          const u: AuthUser = {
            id: session.user.id,
            email: session.user.email!,
            name: profile.full_name,
            role: (profile.role as UserRole) || "customer",
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
          setUser(u);
          setIsLoading(false);
          return;
        }

        // Profile not ready yet — fall back to localStorage
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.id && parsed.email && parsed.name) {
              setUser(parsed);
            }
          }
        } catch { /* ignore */ }
        setIsLoading(false);
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setAccessToken(null);
        setIsLoading(false);
        return;
      }

      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") && session) {
        loadProfile(session);
        return;
      }

      // INITIAL_SESSION with no active session — fall back to localStorage
      if (event === "INITIAL_SESSION" && !session) {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          const storedToken = localStorage.getItem(TOKEN_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.id && parsed.email && parsed.name) {
              setUser(parsed);
              setAccessToken(storedToken);
            }
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(TOKEN_KEY);
        }
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (userData: AuthUser, token?: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    if (token) localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
    if (token) setAccessToken(token);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setAccessToken(null);
    createSupabaseBrowserClient().auth.signOut();
  };

  const updateUser = (partial: Partial<Pick<AuthUser, "name">>) => {
    if (!user) return;
    const updated = { ...user, ...partial };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
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
