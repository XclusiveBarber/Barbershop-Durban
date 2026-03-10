"use client";

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
  id: string;
  email: string;
  name: string;
  role: UserRole;
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
const TOKEN_KEY   = "xclusiveToken";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading]     = useState(true);

  // Track whether the user explicitly requested logout so we can ignore
  // spurious SIGNED_OUT events that Supabase fires during session recovery.
  const explicitLogoutRef = React.useRef(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // ── Step 1: restore from localStorage immediately (no flash on reload) ──
    let restoredFromStorage = false;
    try {
      const stored      = localStorage.getItem(STORAGE_KEY);
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id && parsed?.email && parsed?.name) {
          setUser(parsed);
          setAccessToken(storedToken);
          restoredFromStorage = true;
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }

    // Mark loading done immediately — localStorage is the source of truth for UI
    setIsLoading(false);

    // ── Step 2: verify / refresh Supabase session in background ────────────
    // This refreshes the access token and syncs the latest profile data.
    // We never clear the user here — if Supabase is unreachable we keep
    // whatever is in localStorage.
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Refresh token in storage
          localStorage.setItem(TOKEN_KEY, session.access_token);
          setAccessToken(session.access_token);

          // Sync latest profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", session.user.id)
            .single();

          if (profile?.full_name) {
            const u: AuthUser = {
              id:    session.user.id,
              email: session.user.email!,
              name:  profile.full_name,
              role:  (profile.role as UserRole) || "customer",
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
            setUser(u);
          }
        } else if (!restoredFromStorage) {
          // No Supabase session AND nothing in localStorage — user is not logged in
          setUser(null);
          setAccessToken(null);
        }
        // If Supabase returns no session but localStorage had a user, keep it.
        // The token may have just expired; the user will get a 401 on the next
        // API call which is the right time to prompt re-login.
      } catch {
        // Network error — keep whatever state we already have
      }
    })();

    // ── Step 3: react to auth events (sign-out, token refresh only) ────────
    // Do NOT make async Supabase calls inside this callback — it holds an
    // internal mutex that would deadlock any supabase.* call made within it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        // Only clear state if the user explicitly clicked "Sign Out".
        // Supabase can fire spurious SIGNED_OUT events during internal
        // session recovery / token refresh cycles, which would otherwise
        // log the user out unexpectedly (e.g. after booking).
        if (explicitLogoutRef.current) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setAccessToken(null);
          explicitLogoutRef.current = false;
        }
      } else if (event === "TOKEN_REFRESHED" && session) {
        localStorage.setItem(TOKEN_KEY, session.access_token);
        setAccessToken(session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── login() is the canonical setter during an OTP flow ───────────────────
  const login = (userData: AuthUser, token?: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    if (token) localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
    if (token) setAccessToken(token);
  };

  const logout = () => {
    explicitLogoutRef.current = true;
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
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
