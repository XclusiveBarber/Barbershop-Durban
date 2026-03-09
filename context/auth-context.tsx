"use client";

/**
 * Auth Context
 *
 * Current implementation: localStorage-based (development/prototype).
 *
 * TODO: Supabase integration
 * ---------------------------------
 * 1. Install: npm install @supabase/supabase-js @supabase/ssr
 * 2. Create lib/supabase/client.ts with createBrowserClient()
 * 3. Replace the useEffect below with supabase.auth.getSession()
 * 4. Replace login() with supabase.auth.signInWithOtp({ phone })
 * 5. Replace logout() with supabase.auth.signOut()
 * 6. Listen to auth changes via supabase.auth.onAuthStateChange()
 * 7. The user profile (name, role) lives in a `profiles` table linked to auth.users
 * ---------------------------------
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "customer" | "barber" | "admin";

export interface AuthUser {
  /** TODO: Supabase — map to auth.users.id */
  id: string;
  name: string;
  /** Phone used for OTP / contact */
  phone: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  /** True while we're reading the stored session on first load */
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  /** Update name/phone after initial sign-up without a full re-login */
  updateUser: (partial: Partial<Pick<AuthUser, "name" | "phone">>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "xclusiveUser";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from storage on mount
  useEffect(() => {
    // TODO: Supabase — replace this block with:
    //   const { data: { session } } = await supabase.auth.getSession()
    //   if (session) { /* fetch profile from `profiles` table */ setUser(profile) }
    //   supabase.auth.onAuthStateChange((_event, session) => { ... })
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Corrupt storage — ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: AuthUser) => {
    // TODO: Supabase — session is managed by Supabase SDK; just sync local state here
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    // TODO: Supabase — await supabase.auth.signOut()
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const updateUser = (partial: Partial<Pick<AuthUser, "name" | "phone">>) => {
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
