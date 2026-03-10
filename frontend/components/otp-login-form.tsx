"use client";

import React, { useState } from "react";
import { Mail, User, ChevronRight, AlertCircle, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, type AuthUser } from "@/context/auth-context";
import { sendOtp, verifyOtp, getProfile, createProfile, updateProfile } from "@/lib/supabase-auth";

export interface OtpLoginFormProps {
  onComplete: () => void;
  /** Optional callback to go back (used in booking system wizard) */
  onBackAction?: () => void;
}

type Step = "email" | "otp" | "name";

export function OtpLoginForm({ onComplete, onBackAction }: OtpLoginFormProps) {
  const { login } = useAuth();
  
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // True when the user already has a profile row but it has no full_name yet;
  // handleSaveName should update the existing row instead of inserting a new one.
  const [profileNeedsUpdate, setProfileNeedsUpdate] = useState(false);

  const handleSendOtp = async () => {
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
      await sendOtp({ email: email.trim() });
      setStep("otp");
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

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length < 6) {
      setError("Please enter a valid verification code");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await verifyOtp({ email: email.trim(), token: otp.trim() });
      const authUser = data.user;
      const token = data.session?.access_token ?? null;

      if (!authUser) {
        throw new Error("Verification failed — please try again");
      }

      // Store token so it can be used for authenticated API calls
      if (token) setAccessToken(token);

      const profile = await getProfile(authUser.id);

      if (profile?.full_name) {
        // Existing user with a complete profile — log in immediately
        const userData: AuthUser = {
          id: authUser.id,
          email: authUser.email ?? email,
          name: profile.full_name,
          role: profile.role ?? "customer",
        };
        login(userData, token ?? undefined);
        toast.success(`Welcome back, ${userData.name}!`);
        onComplete();
      } else {
        // No profile yet, or profile exists but has no name — collect name.
        // If the profile row already exists we only need to update it.
        setProfileNeedsUpdate(!!profile);
        setSupabaseUserId(authUser.id);
        setStep("name");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid or expired code";
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
      if (profileNeedsUpdate) {
        // Profile row exists but had no full_name — update it
        await updateProfile(supabaseUserId, { name: name.trim() });
      } else {
        // Brand-new user — create the profile row
        await createProfile({
          id: supabaseUserId,
          email: email.trim(),
          name: name.trim(),
          role: "customer",
        });
      }

      const userData: AuthUser = {
        id: supabaseUserId,
        email: email.trim(),
        name: name.trim(),
        role: "customer",
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

  const FormHeader = ({ title, subtitle, showBack }: { title: string; subtitle: string | React.ReactNode; showBack?: boolean }) => (
    <div className="text-center mb-10 relative">
      {(showBack && onBackAction) && (
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

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {step === "email" && (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <FormHeader 
              title="Enter Your Email"
              subtitle="We'll send a one-time code to verify it's you."
              showBack={true}
            />

            <div className="space-y-4">
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-black/40 font-medium">Email Address</label>
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
                    className="w-full pl-12 pr-4 py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleSendOtp()}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={!email.trim() || loading}
                className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Sending..." : "Send Code"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center pt-4">
              <p className="text-xs text-black/30">
                New here? We'll create an account automatically.
              </p>
            </div>
          </motion.div>
        )}

        {step === "otp" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <FormHeader 
              title="Enter the Code"
              subtitle={
                <>
                  Code sent to <strong>{email}</strong>
                </>
              }
            />

            <div className="space-y-4">
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-black/40 font-medium">Verification Code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 8));
                    setError(null);
                  }}
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
                onClick={() => {
                  setStep("email");
                  setError(null);
                  setOtp("");
                }}
                className="w-full text-xs text-black/40 hover:text-black transition-colors py-2"
              >
                Wrong email? Go back
              </button>
            </div>
          </motion.div>
        )}

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
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-black/40 font-medium">Your Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
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
