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
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (partial: Partial<Pick<AuthUser, "name">>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "xclusiveUser";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: sync with Supabase session, then fall back to localStorage
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const syncSession = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          // Active Supabase session — load profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", authUser.id)
            .single();

          if (profile?.full_name) {
            const u: AuthUser = {
              id: authUser.id,
              email: authUser.email!,
              name: profile.full_name,
              role: (profile.role as UserRole) || "customer",
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
            setUser(u);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // ignore — fall through to localStorage
      }

      // Fall back to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.id && parsed.email && parsed.name) {
            setUser(parsed);
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    syncSession();

    // Listen for auth state changes (e.g. session expiry, sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (userData: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
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
