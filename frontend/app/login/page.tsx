"use client";

/**
 * Login Page — Email Magic Link with Supabase
 *
 * Customer flow:  email → link (check email) → dashboard
 * Staff flow:     email → password → check role → dashboard
 */

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, type AuthUser, type UserRole } from "@/context/auth-context";
import { sendOtp, getProfile, createProfile } from "@/lib/supabase-auth";

// ─── Main wrapper ─────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────

type LoginMode = "customer" | "staff";
type Step = "email" | "check-email" | "name";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";
  const { login } = useAuth();

  // Mode
  const [mode, setMode] = useState<LoginMode>("customer");

  // Customer email link flow
  const initialStep = (searchParams.get("step") as Step) || "email";
  const [step, setStep] = useState<Step>(initialStep);
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(
    searchParams.get("userId") || null
  );

  // Staff flow
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // ─ Customer flow ──────────────────────────────────────────────────────────

  const handleSendLink = async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await sendOtp({ email });
      setStep("check-email");
      toast.success("Link sent! Check your email.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send link";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!supabaseUserId) {
      setError("Session error — please try again");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Create profile in Supabase
      await createProfile({
        id: supabaseUserId,
        email,
        name: name.trim(),
        role: "customer",
      });

      const userData: AuthUser = {
        id: supabaseUserId,
        email,
        name: name.trim(),
        role: "customer",
      };

      login(userData);
      toast.success(`Welcome, ${userData.name}!`);
      router.push(returnTo);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create account";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ─ Staff flow ─────────────────────────────────────────────────────────────
  // Note: For production, implement proper staff email/password auth via Supabase

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail.trim() || !staffPassword.trim()) {
      setStaffError("Email and password required");
      return;
    }

    setStaffError(null);
    setStaffLoading(true);

    try {
      // TODO: Implement real staff authentication
      // For now, show placeholder
      toast.error("Staff login requires Supabase configuration");
    } finally {
      setStaffLoading(false);
    }
  };

  // ─ Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Toaster position="top-center" expand richColors />

      {/* Header */}
      <nav className="bg-black py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.png" alt="Xclusive Barber" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-white font-montserrat">
              XCLUSIVE BARBER
            </span>
          </Link>
          <Link
            href={returnTo.startsWith("/") && returnTo !== "/dashboard" ? returnTo : "/"}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* CUSTOMER MODE */}
          {mode === "customer" && (
            <AnimatePresence mode="wait">

              {/* Email Step */}
              {step === "email" && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center mb-12">
                    <span className="text-black/30 uppercase tracking-widest text-xs mb-4 block">
                      My Account
                    </span>
                    <h1 className="text-4xl md:text-5xl font-light tracking-tight text-black mb-4">
                      Sign In
                    </h1>
                    <p className="text-black/50 text-sm leading-relaxed max-w-xs mx-auto">
                      Enter your email and we'll send a verification code.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded"
                      >
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-xs uppercase tracking-widest text-black/40 font-medium">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError(null);
                          }}
                          placeholder="you@example.com"
                          className="w-full pl-12 pr-4 py-4 border-2 border-black/10 text-black placeholder:text-black/20 focus:border-black focus:outline-none transition-all bg-white"
                          onKeyDown={(e) => e.key === "Enter" && !loading && handleSendOtp()}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSendLink}
                      disabled={!email.trim() || loading}
                      className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? "Sending…" : (
                        <>Send Link <ChevronRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-xs text-black/30">
                      New here? We'll create an account automatically.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Check Email Step */}
              {step === "check-email" && (
                <motion.div
                  key="check-email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center mb-12">
                    <span className="text-black/30 uppercase tracking-widest text-xs mb-4 block">
                      Check Your Email
                    </span>
                    <h1 className="text-4xl font-light tracking-tight text-black mb-4">
                      Link Sent!
                    </h1>
                    <p className="text-black/50 text-sm leading-relaxed">
                      We sent a magic link to <strong>{email}</strong>
                      <br />
                      Click the link to sign in.
                      <br />
                      <button
                        onClick={() => {
                          setStep("email");
                          setError(null);
                        }}
                        className="mt-2 underline text-black/50 hover:text-black transition-colors text-xs"
                      >
                        Wrong email?
                      </button>
                    </p>
                  </div>

                  <div className="space-y-4">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded"
                      >
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                      </motion.div>
                    )}

                    <div className="p-4 bg-black/5 rounded text-xs text-black/50 text-center">
                      Didn't receive the email? Check your spam folder or click below to resend.
                    </div>

                    <button
                      onClick={handleSendLink}
                      disabled={loading}
                      className="w-full text-xs text-black/40 hover:text-black transition-colors py-2 disabled:opacity-50"
                    >
                      Resend link
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Name Step (New User) */}
              {step === "name" && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center mb-12">
                    <span className="text-black/30 uppercase tracking-widest text-xs mb-4 block">
                      Almost Done
                    </span>
                    <h1 className="text-4xl font-light tracking-tight text-black mb-4">
                      What's Your Name?
                    </h1>
                    <p className="text-black/50 text-sm leading-relaxed max-w-xs mx-auto">
                      We'll use this to recognize you in our system.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded"
                      >
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-xs uppercase tracking-widest text-black/40 font-medium">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setError(null);
                          }}
                          placeholder="e.g. Thabo Dlamini"
                          className="w-full pl-12 pr-4 py-4 border-2 border-black/10 text-black placeholder:text-black/20 focus:border-black focus:outline-none transition-all bg-white"
                          onKeyDown={(e) => e.key === "Enter" && !loading && handleSaveName()}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveName}
                      disabled={!name.trim() || loading}
                      className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? "Creating…" : (
                        <>Create Account <ChevronRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          )}

          {/* STAFF MODE */}
          {mode === "staff" && (
            <motion.div
              key="staff"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-12">
                <span className="text-black/30 uppercase tracking-widest text-xs mb-4 block">
                  Staff Portal
                </span>
                <h1 className="text-4xl font-light tracking-tight text-black mb-4">
                  Staff Sign In
                </h1>
                <p className="text-black/50 text-sm leading-relaxed">
                  Barbers and admins only.
                </p>
              </div>

              <form onSubmit={handleStaffLogin} className="space-y-4">
                {staffError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{staffError}</p>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-black/40 font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                    <input
                      type="email"
                      value={staffEmail}
                      onChange={(e) => {
                        setStaffEmail(e.target.value);
                        setStaffError(null);
                      }}
                      placeholder="you@xclusive.co.za"
                      className="w-full pl-12 pr-4 py-4 border-2 border-black/10 text-black placeholder:text-black/20 focus:border-black focus:outline-none transition-all bg-white"
                      disabled={staffLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-black/40 font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                    <input
                      type="password"
                      value={staffPassword}
                      onChange={(e) => {
                        setStaffPassword(e.target.value);
                        setStaffError(null);
                      }}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-4 border-2 border-black/10 text-black placeholder:text-black/20 focus:border-black focus:outline-none transition-all bg-white"
                      disabled={staffLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={staffLoading}
                  className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {staffLoading ? "Signing in…" : "Sign In"}
                </button>
              </form>

              <div className="mt-6 p-4 bg-black/5 rounded text-xs text-black/50 text-center">
                Contact your admin for staff account setup.
              </div>
            </motion.div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-black/5 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.2em] text-black/30">
              Need help?{" "}
              <a href="tel:+27678864334" className="text-black/50 hover:text-black transition-colors">
                +27 678 86 433
              </a>
            </p>
            <button
              onClick={() => setMode(mode === "customer" ? "staff" : "customer")}
              className="text-[11px] uppercase tracking-[0.2em] text-black/20 hover:text-black/40 transition-colors"
            >
              {mode === "customer" ? "Staff Portal →" : "← Customer"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
