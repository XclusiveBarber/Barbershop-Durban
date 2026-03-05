"use client";

/**
 * Login Page
 *
 * Customer flow  → phone number → Supabase OTP → (new user: enter name) → redirect
 * Staff access   → shown via "Staff Portal" link (uses profiles table role)
 */

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  User,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, type AuthUser, type UserRole } from "@/context/auth-context";
import { supabase } from "@/lib/supabase/client";

// ─── Main component (wraps content in Suspense for useSearchParams) ──────────

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

// ─── Inner content ────────────────────────────────────────────────────────────

type LoginMode = "customer" | "staff";
type Step      = "entry" | "otp" | "name";

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const returnTo     = searchParams.get("returnTo") ?? "/dashboard";
  const { login }    = useAuth();

  const [mode, setMode] = useState<LoginMode>("customer");

  // Customer OTP flow
  const [step, setStep]       = useState<Step>("entry");
  const [email, setEmail]     = useState("");
  const [otp, setOtp]         = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  // Staff form (dev / internal)
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState<UserRole>("barber");

  // ── Customer flow ────────────────────────────────────────────────────────

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes('@')) { toast.error("Enter a valid email"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ 
        email: email.trim(),
        options: { shouldCreateUser: true }
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Code sent! Check your email.");
        setStep("otp");
      }
    } catch {
      toast.error("Failed to send code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { toast.error("Enter the 6-digit code"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: "email",
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      // Check if profile exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", data.user!.id)
        .single();

      if (profile?.full_name) {
        // Returning user — go straight to dashboard
        const authUser: AuthUser = {
          id: data.user!.id,
          name: profile.full_name,
          email: email.trim(),
          role: (profile.role as UserRole) ?? "customer",
          accessToken: data.session?.access_token,
        };
        login(authUser);
        toast.success(`Welcome back, ${profile.full_name}!`);
        router.push(returnTo);
      } else {
        // New user — ask for name
        setStep("name");
      }
    } catch {
      toast.error("Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) { toast.error("Please enter your name"); return; }
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { toast.error("Session expired. Please sign in again."); return; }

      // Upsert profile
      await supabase.from("profiles").upsert({
        id: authUser.id,
        full_name: newName.trim(),
        role: "customer",
      });

      const { data: { session } } = await supabase.auth.getSession();
      const userData: AuthUser = {
        id: authUser.id,
        name: newName.trim(),
        email: email.trim(),
        role: "customer",
        accessToken: session?.access_token,
      };
      login(userData);
      toast.success(`Welcome, ${newName.trim()}!`);
      router.push(returnTo);
    } catch {
      toast.error("Failed to save profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Staff flow (uses profiles table, barbers don't have separate login) ──

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) { toast.error("Enter your email"); return; }
    setLoading(true);
    try {
      // Staff authenticate via email OTP like customers — role is in profiles table
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Code sent to your phone.");
        setStep("otp");
        setMode("customer"); // reuse customer OTP step
      }
    } catch {
      toast.error("Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Toaster position="top-center" expand richColors />

      {/* Nav */}
      <nav className="bg-black py-4 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.png" alt="Xclusive Barber Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-white font-montserrat">
              XCLUSIVE BARBER
            </span>
          </Link>
          <Link
            href={returnTo.startsWith("/") && returnTo !== "/dashboard" ? returnTo : "/"}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors font-semibold font-montserrat"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">

          {mode === "customer" && (
            <AnimatePresence mode="wait">

              {/* Step: phone entry */}
              {step === "entry" && (
                <motion.div
                  key="entry"
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
                    <p className="text-black/50 text-sm leading-relaxed">
                      Enter your email address and we'll send a verification code.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs uppercase tracking-widest text-black/40 font-medium">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-12 pr-4 py-4 border-2 border-black/10 text-black placeholder:text-black/20 focus:border-black focus:outline-none transition-all bg-white"
                          onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSendOtp}
                      disabled={!email.trim() || !email.includes('@') || loading}
                      className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? "Sending…" : (
                        <>Send Code <ChevronRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-xs text-black/30">
                      No account needed — we'll create one automatically.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step: OTP verification */}
              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center mb-12">
                    <span className="text-black/30 uppercase tracking-widest text-xs mb-4 block">
                      Verification
                    </span>
                    <h1 className="text-4xl font-light tracking-tight text-black mb-4">
                      Enter Code
                    </h1>
                    <p className="text-black/50 text-sm leading-relaxed">
                      Code sent to <strong>{email}</strong>.{" "}
                      <button
                        onClick={() => { setStep("entry"); setOtp(""); }}
                        className="underline text-black/50 hover:text-black transition-colors"
                      >
                        Change
                      </button>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs uppercase tracking-widest text-black/40 font-medium">
                        6-digit code
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        className="w-full text-center text-2xl tracking-[0.5em] py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                        onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                      />
                    </div>

                    <button
                      onClick={handleVerifyOtp}
                      disabled={otp.length < 6 || loading}
                      className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Verifying…" : "Verify & Sign In"}
                    </button>

                    <button
                      onClick={handleSendOtp}
                      className="w-full text-xs text-black/40 hover:text-black transition-colors py-2"
                    >
                      Resend code
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step: new user name */}
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
                    <p className="text-black/50 text-sm leading-relaxed">
                      Just so we know who to expect at the chair.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs uppercase tracking-widest text-black/40 font-medium">
                        Your Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="e.g. Thabo"
                          className="w-full pl-12 pr-4 py-4 border-2 border-black/10 text-black placeholder:text-black/20 focus:border-black focus:outline-none transition-all bg-white"
                          onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSaveName}
                      disabled={!newName.trim() || loading}
                      className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? "Saving…" : (
                        <>Create Account <ChevronRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          )}

          {/* Staff portal — staff use same phone OTP, role comes from profiles table */}
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
                  Sign in with your registered email address.
                </p>
              </div>

              <form onSubmit={handleStaffLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-black/40 font-medium">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@xclusivebarbers.com"
                      className="w-full pl-12 pr-4 py-4 border-2 border-black/10 text-black placeholder:text-black/20 focus:border-black focus:outline-none transition-all bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !email.includes('@')}
                  className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending code…" : "Send Code"}
                </button>
              </form>
            </motion.div>
          )}

          {/* Footer row */}
          <div className="mt-12 pt-8 border-t border-black/5 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.2em] text-black/30">
              Need help?{" "}
              <a href="tel:+27678864334" className="text-black/50 hover:text-black transition-colors">
                +27 67 886 4334
              </a>
            </p>
            <button
              onClick={() => { setMode(mode === "customer" ? "staff" : "customer"); setStep("entry"); }}
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
