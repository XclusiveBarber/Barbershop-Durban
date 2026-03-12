"use client";

import React, { useState } from "react";
import { Mail, Lock, User, ChevronRight, AlertCircle, ChevronLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, type AuthUser } from "@/context/auth-context";
import {
  sendOtp,
  verifyOtp,
  getProfile,
  createProfile,
  updateProfile,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/supabase-auth";

export interface OtpLoginFormProps {
  onComplete: () => void;
  /** Optional callback to go back (used in booking system wizard) */
  onBackAction?: () => void;
}

type Step = "method" | "otp-email" | "otp-code" | "name";
type PasswordMode = "signin" | "signup";

// ─── Google Icon ───────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function OtpLoginForm({ onComplete, onBackAction }: OtpLoginFormProps) {
  const { login } = useAuth();

  const [step, setStep] = useState<Step>("method");

  // OTP flow state
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");

  // Password flow state
  const [pwEmail, setPwEmail] = useState("");
  const [pwPassword, setPwPassword] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwMode, setPwMode] = useState<PasswordMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Shared / name step state
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [profileNeedsUpdate, setProfileNeedsUpdate] = useState(false);
  const [existingProfileRole, setExistingProfileRole] = useState<AuthUser["role"] | null>(null);

  const clearError = () => setError(null);

  // ── After auth: check profile and route to name step or complete ─────────
  const handlePostAuth = async (
    userId: string,
    email: string,
    token: string | null,
  ) => {
    const profile = await getProfile(userId);

    if (profile?.full_name) {
      const userData: AuthUser = {
        id: userId,
        email,
        name: profile.full_name,
        role: (profile.role as AuthUser["role"]) ?? "customer",
      };
      login(userData, token ?? undefined);
      toast.success(`Welcome back, ${userData.name}!`);
      onComplete();
    } else {
      setProfileNeedsUpdate(!!profile);
      if (profile?.role) setExistingProfileRole(profile.role as AuthUser["role"]);
      setSupabaseUserId(userId);
      setPendingEmail(email);
      if (token) setAccessToken(token);
      setStep("name");
    }
  };

  // ── Google OAuth ───────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const callbackUrl = `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(
        new URLSearchParams(window.location.search).get("returnTo") ?? "/dashboard"
      )}`;
      await signInWithGoogle(callbackUrl);
      // Browser will redirect — no further action needed here
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in with Google";
      setError(message);
      toast.error(message);
      setGoogleLoading(false);
    }
  };

  // ── Email + Password ───────────────────────────────────────────────────────
  const handlePasswordAuth = async () => {
    if (!pwEmail.trim() || !pwEmail.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    if (!pwPassword || pwPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (pwMode === "signup" && pwPassword !== pwConfirm) {
      setError("Passwords don't match");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (pwMode === "signin") {
        const data = await signInWithPassword({ email: pwEmail.trim(), password: pwPassword });
        const authUser = data.user;
        const token = data.session?.access_token ?? null;
        if (!authUser) throw new Error("Sign in failed — please try again");
        await handlePostAuth(authUser.id, authUser.email ?? pwEmail.trim(), token);
      } else {
        const data = await signUpWithPassword({ email: pwEmail.trim(), password: pwPassword });
        const authUser = data.user;
        const token = data.session?.access_token ?? null;
        if (!authUser) throw new Error("Account creation failed — please try again");
        await handlePostAuth(authUser.id, authUser.email ?? pwEmail.trim(), token);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ── OTP: Send code ─────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!otpEmail.trim() || !otpEmail.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendOtp({ email: otpEmail.trim() });
      setStep("otp-code");
      setOtp("");
      toast.success("Code sent! Check your email.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send code";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ── OTP: Verify code ───────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 6) {
      setError("Please enter a valid verification code");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await verifyOtp({ email: otpEmail.trim(), token: otp.trim() });
      const authUser = data.user;
      const token = data.session?.access_token ?? null;
      if (!authUser) throw new Error("Verification failed — please try again");
      if (token) setAccessToken(token);
      await handlePostAuth(authUser.id, authUser.email ?? otpEmail.trim(), token);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid or expired code";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Save name ──────────────────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!name.trim()) { setError("Please enter your name"); return; }
    if (!supabaseUserId) { setError("Session error — please try again"); return; }
    setError(null);
    setLoading(true);
    try {
      if (profileNeedsUpdate) {
        await updateProfile(supabaseUserId, { name: name.trim() });
      } else {
        await createProfile({
          id: supabaseUserId,
          email: pendingEmail,
          name: name.trim(),
          role: "customer",
        });
      }
      const userData: AuthUser = {
        id: supabaseUserId,
        email: pendingEmail,
        name: name.trim(),
        role: profileNeedsUpdate ? (existingProfileRole ?? "customer") : "customer",
      };
      login(userData, accessToken ?? undefined);
      toast.success(`Welcome, ${userData.name}!`);
      onComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create account";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Shared UI helpers ──────────────────────────────────────────────────────

  const ErrorBox = () =>
    error ? (
      <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded">
        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    ) : null;

  const FormHeader = ({
    title,
    subtitle,
    showBack,
  }: {
    title: string;
    subtitle: string | React.ReactNode;
    showBack?: boolean;
  }) => (
    <div className="text-center mb-10 relative">
      {showBack && onBackAction && (
        <button
          onClick={onBackAction}
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center text-sm text-black/50 hover:text-black transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </button>
      )}
      <h3 className="text-3xl font-light text-black mb-3">{title}</h3>
      <p className="text-sm text-black/50 max-w-sm mx-auto leading-relaxed">{subtitle}</p>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">

        {/* ── Method selection: Google + Password ────────────────────────── */}
        {step === "method" && (
          <motion.div
            key="method"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <FormHeader
              title="Sign In"
              subtitle="Welcome to Xclusive Barber."
              showBack={true}
            />

            <div className="space-y-4">
              <ErrorBox />

              {/* Google */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 py-4 border-2 border-black/10 hover:border-black/30 hover:bg-black/[0.02] transition-all text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <GoogleIcon />
                {googleLoading ? "Redirecting..." : "Continue with Google"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-black/10" />
                <span className="text-xs text-black/30 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-black/10" />
              </div>

              {/* Sign in / Sign up tabs */}
              <div className="flex border-2 border-black/10">
                <button
                  onClick={() => { setPwMode("signin"); clearError(); }}
                  className={`flex-1 py-2 text-xs uppercase tracking-widest font-medium transition-all ${
                    pwMode === "signin" ? "bg-black text-white" : "text-black/40 hover:text-black"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setPwMode("signup"); clearError(); }}
                  className={`flex-1 py-2 text-xs uppercase tracking-widest font-medium transition-all ${
                    pwMode === "signup" ? "bg-black text-white" : "text-black/40 hover:text-black"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-black/40 font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                  <input
                    type="email"
                    value={pwEmail}
                    onChange={(e) => { setPwEmail(e.target.value); clearError(); }}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-black/40 font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={pwPassword}
                    onChange={(e) => { setPwPassword(e.target.value); clearError(); }}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !loading && pwMode === "signin") handlePasswordAuth();
                    }}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password (signup only) */}
              {pwMode === "signup" && (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-black/40 font-medium">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={pwConfirm}
                      onChange={(e) => { setPwConfirm(e.target.value); clearError(); }}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !loading) handlePasswordAuth();
                      }}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handlePasswordAuth}
                disabled={!pwEmail.trim() || !pwPassword || loading}
                className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {loading
                  ? pwMode === "signin" ? "Signing in..." : "Creating account..."
                  : pwMode === "signin" ? "Sign In" : "Create Account"
                }
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Forgot password link (signin only) */}
              {pwMode === "signin" && (
                <div className="text-center">
                  <Link
                    href="/auth/request-reset"
                    className="text-xs text-black/40 hover:text-black transition-colors underline underline-offset-2"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              {/* OTP fallback */}
              <div className="text-center pt-2">
                <button
                  onClick={() => { setStep("otp-email"); clearError(); }}
                  className="text-xs text-black/40 hover:text-black transition-colors underline underline-offset-2"
                >
                  Use email code instead
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── OTP: Enter email ────────────────────────────────────────────── */}
        {step === "otp-email" && (
          <motion.div
            key="otp-email"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <FormHeader
              title="Enter Your Email"
              subtitle="We'll send a one-time code to verify it's you."
            />

            <div className="space-y-4">
              <ErrorBox />

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-black/40 font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                  <input
                    type="email"
                    value={otpEmail}
                    onChange={(e) => { setOtpEmail(e.target.value); clearError(); }}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleSendOtp()}
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={!otpEmail.trim() || loading}
                className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Sending..." : "Send Code"} <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => { setStep("method"); clearError(); }}
                className="w-full text-xs text-black/40 hover:text-black transition-colors py-2"
              >
                ← Back to sign in options
              </button>
            </div>
          </motion.div>
        )}

        {/* ── OTP: Enter code ─────────────────────────────────────────────── */}
        {step === "otp-code" && (
          <motion.div
            key="otp-code"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <FormHeader
              title="Enter the Code"
              subtitle={<>Code sent to <strong>{otpEmail}</strong></>}
            />

            <div className="space-y-4">
              <ErrorBox />

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-black/40 font-medium">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 8)); clearError(); }}
                  placeholder="000000"
                  className="w-full text-center text-3xl tracking-[0.3em] py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleVerifyOtp()}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otp.length < 6 || loading}
                className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Verifying..." : "Verify Code"} <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => { setStep("otp-email"); clearError(); setOtp(""); }}
                className="w-full text-xs text-black/40 hover:text-black transition-colors py-2"
              >
                Wrong email? Go back
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Name step (all flows) ────────────────────────────────────────── */}
        {step === "name" && (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <FormHeader
              title="What's Your Name?"
              subtitle="One last thing — so we know who to expect."
            />

            <div className="space-y-4">
              <ErrorBox />

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-black/40 font-medium">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); clearError(); }}
                    placeholder="e.g. Thabo"
                    className="w-full pl-12 pr-4 py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleSaveName()}
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              <button
                onClick={handleSaveName}
                disabled={!name.trim() || loading}
                className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Creating..." : "Continue"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
