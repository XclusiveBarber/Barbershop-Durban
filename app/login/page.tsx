"use client";

/**
 * Login Page
 *
 * Customer flow  → phone number → OTP → (new: enter name) → redirect
 * Staff access   → shown via "Staff Portal" link (dev only)
 *
 * TODO: Supabase
 * - handleSendOtp   → supabase.auth.signInWithOtp({ phone })
 * - handleVerifyOtp → supabase.auth.verifyOtp({ phone, token, type: 'sms' })
 *   then fetch/create row in `profiles` table
 */

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  User,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, type AuthUser, type UserRole } from "@/context/auth-context";

// ─── OTP code helper ──────────────────────────────────────────────────────────

function sendMockOtp(phone: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  toast.info(`OTP for ${phone}: ${code}`, {
    description: "Test code — replace with real SMS (Supabase Auth) in production.",
    duration: 30000,
  });
  return code;
}

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

  // Which portal
  const [mode, setMode] = useState<LoginMode>("customer");

  // Customer OTP flow
  const [step, setStep]       = useState<Step>("entry");
  const [phone, setPhone]     = useState("");
  const [otp, setOtp]         = useState("");
  const [_mockOtp, setMockOtp] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  // Staff form (dev only)
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState<UserRole>("barber");

  // ── Customer flow ────────────────────────────────────────────────────────

  const handleSendOtp = () => {
    if (!phone.trim()) { toast.error("Enter a phone number"); return; }
    setLoading(true);
    // TODO: Supabase → supabase.auth.signInWithOtp({ phone })
    const code = sendMockOtp(phone);
    setMockOtp(code);
    setTimeout(() => { setLoading(false); setStep("otp"); }, 600);
  };

  const handleVerifyOtp = () => {
    if (otp.length < 6) { toast.error("Enter the 6-digit code"); return; }
    setLoading(true);
    // TODO: Supabase → supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' })
    //   then check `profiles` table; if no row → ask for name (step = "name")
    setTimeout(() => {
      setLoading(false);
      const existingProfile = typeof window !== "undefined"
        ? localStorage.getItem(`xclusiveProfile:${phone}`)
        : null;

      if (existingProfile) {
        const profile = JSON.parse(existingProfile) as { name: string };
        finaliseLogin({ id: `mock-${Date.now()}`, name: profile.name, phone, role: "customer" });
      } else {
        setStep("name");
      }
    }, 700);
  };

  const handleSaveName = () => {
    if (!newName.trim()) { toast.error("Please enter your name"); return; }
    // TODO: Supabase → upsert into `profiles` (id, name, phone, role: 'customer')
    localStorage.setItem(`xclusiveProfile:${phone}`, JSON.stringify({ name: newName.trim() }));
    finaliseLogin({ id: `mock-${Date.now()}`, name: newName.trim(), phone, role: "customer" });
  };

  const finaliseLogin = (userData: AuthUser) => {
    login(userData);
    toast.success(`Welcome, ${userData.name}!`);
    router.push(returnTo);
  };

  // ── Staff flow (dev / internal) ──────────────────────────────────────────

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) { toast.error("Enter your name"); return; }
    setLoading(true);
    // TODO: Supabase → staff log in via email/password, check `profiles`.role
    setTimeout(() => {
      login({ id: `staff-${Date.now()}`, name: staffName.trim(), phone: "", role: staffRole });
      toast.success(`Welcome, ${staffName.trim()}!`);
      router.push("/dashboard");
      setLoading(false);
    }, 500);
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

          {/* Mode switcher (only shown when in customer mode — staff link at bottom) */}
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
                      Enter your phone number and we'll send a verification code.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs uppercase tracking-widest text-black/40 font-medium">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+27 67 886 4334"
                          className="w-full pl-12 pr-4 py-4 border-2 border-black/10 text-black placeholder:text-black/20 focus:border-black focus:outline-none transition-all bg-white"
                          onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSendOtp}
                      disabled={!phone.trim() || loading}
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
                      Code sent to <strong>{phone}</strong>.{" "}
                      <button
                        onClick={() => { setStep("entry"); setOtp(""); }}
                        className="underline text-black/50 hover:text-black transition-colors"
                      >
                        Change
                      </button>
                    </p>
                    <p className="text-black/30 text-xs mt-2">(Check the notification at the top for the test code.)</p>
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
                      disabled={!newName.trim()}
                      className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Create Account <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          )}

          {/* Staff portal */}
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
                  For barbers and admin only.
                </p>
              </div>

              <form onSubmit={handleStaffLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-black/40 font-medium">Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="Your name"
                      className="w-full pl-12 pr-4 py-4 border-2 border-black/10 text-black placeholder:text-black/20 focus:border-black focus:outline-none transition-all bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-black/40 font-medium">Role</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value as UserRole)}
                      className="w-full pl-12 pr-4 py-4 border-2 border-black/10 text-black focus:border-black focus:outline-none transition-all bg-white appearance-none"
                    >
                      <option value="barber">Barber</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Signing in…" : "Sign In"}
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
