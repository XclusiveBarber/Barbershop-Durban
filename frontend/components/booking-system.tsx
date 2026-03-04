"use client";

/**
 * BookingSystem — 4-step booking wizard
 *
 * Step 1  Service selection (fetched from Supabase haircuts table)
 * Step 2  Date & time selection
 * Step 3  Identity gate
 *   3a  choose   → "Sign in" or "Continue as guest"
 *   3b  phone    → enter phone for OTP
 *   3c  otp      → enter 6-digit code
 *   3d  name     → new user: enter name
 *   3e  guest    → name + phone, no account
 * Step 4  Confirmation
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  Phone,
  LogIn,
  UserCheck,
  Scissors,
} from "lucide-react";
import { format } from "date-fns";
import { DayPicker } from "react-day-picker";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth, type AuthUser } from "@/context/auth-context";
import { supabase } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Haircut {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
}

type AuthMode   = "choose" | "phone" | "otp" | "name" | "guest";
type BookerInfo = { name: string; phone: string; isGuest: boolean };

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return `R ${price.toFixed(2)}`;
}

// ─── Step-level sub-components ────────────────────────────────────────────────

function StepHeader({ onBack, title }: { onBack?: () => void; title: string }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center text-sm hover:text-black transition-colors text-black/50"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </button>
      ) : (
        <div className="w-16" />
      )}
      <h3 className="text-2xl font-light text-black">{title}</h3>
      <div className="w-16" />
    </div>
  );
}

function BookingSummaryCard({
  service,
  date,
  time,
}: {
  service: Haircut;
  date: Date | undefined;
  time: string | null;
}) {
  return (
    <div className="bg-black/[0.03] border-2 border-black/5 p-5 space-y-3 mb-6">
      <p className="text-[10px] uppercase tracking-widest text-black/30 font-medium mb-3">
        Booking Summary
      </p>
      <div className="flex justify-between text-sm">
        <span className="text-black/50 flex items-center gap-2">
          <Scissors className="w-3.5 h-3.5" /> Service
        </span>
        <span className="font-medium text-black">{service.name}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-black/50 flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5" /> Date
        </span>
        <span className="font-medium text-black">
          {date ? format(date, "EEE, MMM d") : "—"}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-black/50 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> Time
        </span>
        <span className="font-medium text-black">{time ?? "—"}</span>
      </div>
      <div className="pt-3 border-t border-black/10 flex justify-between">
        <span className="font-semibold text-sm text-black">Total</span>
        <span className="font-semibold text-sm text-black">{formatPrice(service.price)}</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BookingSystem({ hideTitle = false }: { hideTitle?: boolean }) {
  const { user, isLoggedIn, login } = useAuth();

  // Services from Supabase
  const [services, setServices] = useState<Haircut[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // Wizard state
  const [step, setStep]               = useState(1);
  const [selectedService, setSelectedService] = useState<Haircut | null>(null);
  const [selectedDate, setSelectedDate]       = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime]       = useState<string | null>(null);

  // Auth-gate sub-state
  const [authMode, setAuthMode]   = useState<AuthMode>("choose");
  const [phone, setPhone]         = useState("");
  const [otp, setOtp]             = useState("");
  const [newName, setNewName]     = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [booker, setBooker] = useState<BookerInfo | null>(null);

  // Fetch haircuts from Supabase on mount
  useEffect(() => {
    supabase
      .from("haircuts")
      .select("id, name, price, description, image_url")
      .then(({ data, error }) => {
        if (!error && data) setServices(data);
        setServicesLoading(false);
      });
  }, []);

  const goNext = () => setStep((s) => s + 1);
  const goPrev = () => setStep((s) => s - 1);

  const enterStep3 = () => {
    setAuthMode("choose");
    setStep(3);
  };

  // ── OTP / Auth helpers ────────────────────────────────────────────────────

  const handleSendOtp = async () => {
    if (!phone.trim()) return;
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Code sent to ${phone}`);
        setAuthMode("otp");
      }
    } catch {
      toast.error("Failed to send code. Try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) return;
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: otp,
        type: "sms",
      });

      if (error) {
        toast.error(error.message);
        setAuthLoading(false);
        return;
      }

      // Check if profile already exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", data.user!.id)
        .single();

      if (profile?.full_name) {
        const loggedInUser: AuthUser = {
          id: data.user!.id,
          name: profile.full_name,
          phone: phone.trim(),
          role: profile.role ?? "customer",
          accessToken: data.session?.access_token,
        };
        login(loggedInUser);
        toast.success(`Welcome back, ${profile.full_name}!`);
        goNext();
      } else {
        setAuthMode("name");
      }
    } catch {
      toast.error("Verification failed. Try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setAuthLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { toast.error("Session expired."); setAuthLoading(false); return; }

      await supabase.from("profiles").upsert({
        id: authUser.id,
        full_name: newName.trim(),
        role: "customer",
      });

      const { data: { session } } = await supabase.auth.getSession();
      const loggedInUser: AuthUser = {
        id: authUser.id,
        name: newName.trim(),
        phone: phone.trim(),
        role: "customer",
        accessToken: session?.access_token,
      };
      login(loggedInUser);
      toast.success(`Welcome, ${newName.trim()}!`);
      goNext();
    } catch {
      toast.error("Failed to save profile. Try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestContinue = () => {
    if (!guestName.trim() || !guestPhone.trim()) return;
    setBooker({ name: guestName.trim(), phone: guestPhone.trim(), isGuest: true });
    goNext();
  };

  // ── Appointment submission ────────────────────────────────────────────────

  const handleConfirm = async () => {
    const bookerName  = isLoggedIn ? user!.name  : booker?.name  ?? "";

    try {
      const appointmentData: Record<string, unknown> = {
        appointment_date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
        time_slot: selectedTime,
        haircut_id: selectedService!.id,
        status: "pending",
        total_price: selectedService!.price,
        payment_status: "unpaid",
      };

      if (isLoggedIn && user) {
        appointmentData.user_id = user.id;
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (isLoggedIn && user?.accessToken) {
        headers["Authorization"] = `Bearer ${user.accessToken}`;
      }

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers,
        body: JSON.stringify(appointmentData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to create booking. Please try again.");
        return;
      }
    } catch {
      toast.error("Network error. Please try again.");
      return;
    }

    toast.success("Booking confirmed! We'll be in touch shortly.");
    goNext();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section id="book" className="py-24 bg-white">
      <style>{`
        .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #000000;
          --rdp-background-color: #f3f3f3;
          margin: 0;
        }
        .rdp-day_selected,
        .rdp-day_selected:focus-visible,
        .rdp-day_selected:hover {
          background-color: var(--rdp-accent-color) !important;
          color: white !important;
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-6">
        {!hideTitle && (
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4 tracking-tight text-black font-montserrat">
              Book Your Appointment
            </h2>
            <p className="text-black/60 max-w-lg mx-auto font-open-sans">
              Select your service and time — we'll handle the rest.
            </p>
          </div>
        )}

        <div className="bg-white border border-black/10 overflow-hidden shadow-sm">
          {/* Progress bar */}
          <div className="flex border-b border-black/5">
            {(["Service", "Date & Time", "Your Details", "Done"] as const).map((label, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 py-3 px-1">
                <div className={`h-1 w-full transition-colors duration-500 ${step > i ? "bg-accent" : step === i + 1 ? "bg-accent" : "bg-black/5"}`} />
                <span className={`text-[9px] uppercase tracking-widest hidden sm:block transition-colors ${step === i + 1 ? "text-black/70 font-semibold" : step > i + 1 ? "text-black/30" : "text-black/20"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">

              {/* ─── Step 1: Service ──────────────────────────────────── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <h3 className="text-2xl font-semibold mb-8 text-black font-montserrat">
                    Choose a Service
                  </h3>

                  {servicesLoading ? (
                    <div className="text-center py-12">
                      <div className="inline-block w-6 h-6 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                      <p className="mt-4 text-black/40 text-sm">Loading services…</p>
                    </div>
                  ) : services.length === 0 ? (
                    <p className="text-center text-black/40 py-8">No services available at the moment.</p>
                  ) : (
                    <div className="grid gap-3">
                      {services.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => { setSelectedService(service); goNext(); }}
                          className={`flex items-center justify-between p-5 border-2 text-left transition-all hover:border-black group ${
                            selectedService?.id === service.id
                              ? "border-black bg-black/[0.02]"
                              : "border-black/10"
                          }`}
                        >
                          <div>
                            <p className="font-medium text-base text-black">{service.name}</p>
                            {service.description && (
                              <p className="text-xs text-black/40 mt-0.5">{service.description}</p>
                            )}
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <p className="font-semibold text-base text-black">{formatPrice(service.price)}</p>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-black" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─── Step 2: Date & Time ──────────────────────────────── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <StepHeader onBack={goPrev} title="Select Date & Time" />

                  <div className="grid md:grid-cols-2 gap-10">
                    <div className="flex justify-center border border-black/10 p-4">
                      <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={{ before: new Date() }}
                        className="p-0 m-0"
                      />
                    </div>
                    <div className="space-y-4">
                      <p className="text-xs font-medium uppercase tracking-widest text-black/40 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Available Times
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`p-3 text-sm border-2 transition-all ${
                              selectedTime === time
                                ? "bg-black text-white border-black"
                                : "border-black/10 hover:border-black text-black"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                      <button
                        disabled={!selectedTime || !selectedDate}
                        onClick={enterStep3}
                        className="w-full bg-accent text-accent-foreground py-4 mt-4 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90 font-medium text-sm uppercase tracking-wide"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ─── Step 3: Identity gate ────────────────────────────── */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Already logged in */}
                  {isLoggedIn && user ? (
                    <>
                      <StepHeader onBack={goPrev} title="Confirm Booking" />
                      <BookingSummaryCard service={selectedService!} date={selectedDate} time={selectedTime} />
                      <div className="flex items-center gap-3 p-4 border-2 border-black/10 bg-black/[0.02]">
                        <UserCheck className="w-5 h-5 text-black/40 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-black">{user.name}</p>
                          <p className="text-xs text-black/40">{user.phone}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleConfirm}
                        className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-wide hover:opacity-90 transition-all"
                      >
                        Confirm Appointment
                      </button>
                    </>
                  ) : (
                    /* Not logged in — auth gate */
                    <AnimatePresence mode="wait">

                      {authMode === "choose" && (
                        <motion.div
                          key="gate-choose"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <StepHeader onBack={goPrev} title="Almost There" />
                          <BookingSummaryCard service={selectedService!} date={selectedDate} time={selectedTime} />
                          <p className="text-sm text-black/50 text-center mb-6">
                            How would you like to continue?
                          </p>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <button
                              onClick={() => setAuthMode("phone")}
                              className="border-2 border-black p-6 text-left hover:bg-black hover:text-white transition-all group"
                            >
                              <LogIn className="w-6 h-6 mb-3 text-black group-hover:text-white transition-colors" />
                              <p className="font-semibold text-sm mb-1">Sign in / Create account</p>
                              <p className="text-xs text-black/50 group-hover:text-white/60 transition-colors leading-relaxed">
                                Save this booking to your account. Reschedule or cancel anytime from My Bookings.
                              </p>
                            </button>
                            <button
                              onClick={() => setAuthMode("guest")}
                              className="border-2 border-black/20 p-6 text-left hover:border-black/60 transition-all group"
                            >
                              <User className="w-6 h-6 mb-3 text-black/40 group-hover:text-black transition-colors" />
                              <p className="font-semibold text-sm mb-1">Continue as guest</p>
                              <p className="text-xs text-black/40 group-hover:text-black/60 transition-colors leading-relaxed">
                                Book without an account. We'll confirm by WhatsApp or phone.
                              </p>
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {authMode === "phone" && (
                        <motion.div
                          key="gate-phone"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <StepHeader onBack={() => setAuthMode("choose")} title="Enter Your Number" />
                          <p className="text-sm text-black/50 mb-8 text-center">
                            We'll send a one-time code to verify it's you.
                          </p>
                          <div className="space-y-4 max-w-sm mx-auto">
                            <div className="space-y-2">
                              <label htmlFor="booking-phone" className="text-xs uppercase tracking-widest text-black/40 font-medium">
                                Phone Number
                              </label>
                              <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                                <input
                                  id="booking-phone"
                                  autoComplete="tel"
                                  type="tel"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  placeholder="+27 67 886 4334"
                                  className="w-full pl-12 pr-4 py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                                />
                              </div>
                            </div>
                            <button
                              onClick={handleSendOtp}
                              disabled={!phone.trim() || authLoading}
                              className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                            >
                              {authLoading ? "Sending…" : "Send Code"}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {authMode === "otp" && (
                        <motion.div
                          key="gate-otp"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <StepHeader onBack={() => setAuthMode("phone")} title="Enter the Code" />
                          <p className="text-sm text-black/50 mb-8 text-center">
                            Code sent to {phone}.
                          </p>
                          <div className="space-y-4 max-w-sm mx-auto">
                            <div className="space-y-2">
                              <label htmlFor="booking-otp" className="text-xs uppercase tracking-widest text-black/40 font-medium">
                                6-digit code
                              </label>
                              <input
                                id="booking-otp"
                                autoComplete="one-time-code"
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
                              disabled={otp.length < 6 || authLoading}
                              className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                            >
                              {authLoading ? "Verifying…" : "Verify Code"}
                            </button>
                            <button
                              onClick={() => { setOtp(""); setAuthMode("phone"); }}
                              className="w-full text-xs text-black/40 hover:text-black transition-colors py-2"
                            >
                              Wrong number? Go back
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {authMode === "name" && (
                        <motion.div
                          key="gate-name"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <StepHeader onBack={() => setAuthMode("otp")} title="What's Your Name?" />
                          <p className="text-sm text-black/50 mb-8 text-center">
                            One last thing — so we know who to expect.
                          </p>
                          <div className="space-y-4 max-w-sm mx-auto">
                            <div className="space-y-2">
                              <label htmlFor="booking-name" className="text-xs uppercase tracking-widest text-black/40 font-medium">
                                Your Name
                              </label>
                              <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                                <input
                                  id="booking-name"
                                  autoComplete="name"
                                  type="text"
                                  value={newName}
                                  onChange={(e) => setNewName(e.target.value)}
                                  placeholder="e.g. Thabo"
                                  className="w-full pl-12 pr-4 py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                                />
                              </div>
                            </div>
                            <button
                              onClick={handleSaveName}
                              disabled={!newName.trim() || authLoading}
                              className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                            >
                              {authLoading ? "Saving…" : "Continue"}
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {authMode === "guest" && (
                        <motion.div
                          key="gate-guest"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <StepHeader onBack={() => setAuthMode("choose")} title="Your Details" />
                          <BookingSummaryCard service={selectedService!} date={selectedDate} time={selectedTime} />
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label htmlFor="guest-name" className="text-xs uppercase tracking-widest text-black/40 font-medium">Full Name</label>
                              <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                                <input
                                  id="guest-name"
                                  autoComplete="name"
                                  type="text"
                                  value={guestName}
                                  onChange={(e) => setGuestName(e.target.value)}
                                  placeholder="Your name"
                                  className="w-full pl-12 pr-4 py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="guest-phone" className="text-xs uppercase tracking-widest text-black/40 font-medium">Phone Number</label>
                              <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                                <input
                                  id="guest-phone"
                                  autoComplete="tel"
                                  type="tel"
                                  value={guestPhone}
                                  onChange={(e) => setGuestPhone(e.target.value)}
                                  placeholder="+27 67 886 4334"
                                  className="w-full pl-12 pr-4 py-4 border-2 border-black/10 focus:border-black focus:outline-none transition-all bg-white text-black"
                                />
                              </div>
                            </div>
                            <button
                              onClick={handleGuestContinue}
                              disabled={!guestName.trim() || !guestPhone.trim()}
                              className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-wide disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all mt-2"
                            >
                              Confirm Appointment
                            </button>
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  )}
                </motion.div>
              )}

              {/* ─── Step 4: Confirmation ─────────────────────────────── */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="text-center py-10 space-y-6"
                >
                  <div className="w-20 h-20 bg-accent text-accent-foreground flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10" />
                  </div>

                  <h3 className="text-3xl font-light text-black">
                    {isLoggedIn ? "Booking Confirmed!" : "Request Received!"}
                  </h3>

                  <p className="text-black/55 max-w-sm mx-auto text-sm leading-relaxed">
                    {isLoggedIn
                      ? `Thanks, ${user!.name}. Your ${selectedService?.name} on ${
                          selectedDate ? format(selectedDate, "EEE, MMM d") : ""
                        } at ${selectedTime} is confirmed.`
                      : `Thanks, ${booker?.name ?? ""}. We've received your request for ${selectedService?.name} on ${
                          selectedDate ? format(selectedDate, "EEE, MMM d") : ""
                        }. We'll confirm via WhatsApp or call to ${booker?.phone ?? ""}.`}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    {isLoggedIn ? (
                      <Link
                        href="/dashboard"
                        className="bg-accent text-accent-foreground px-8 py-3 text-sm uppercase tracking-wider font-semibold hover:opacity-90 transition-all font-montserrat"
                      >
                        View My Bookings
                      </Link>
                    ) : (
                      <Link
                        href="/login?returnTo=/dashboard"
                        className="bg-accent text-accent-foreground px-8 py-3 text-sm uppercase tracking-wider font-semibold hover:opacity-90 transition-all font-montserrat"
                      >
                        Create account to track bookings
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setStep(1);
                        setSelectedService(null);
                        setSelectedTime(null);
                        setPhone("");
                        setOtp("");
                        setNewName("");
                        setGuestName("");
                        setGuestPhone("");
                        setBooker(null);
                        setAuthMode("choose");
                      }}
                      className="border-2 border-black/10 text-black/50 px-8 py-3 text-sm uppercase tracking-wider font-semibold hover:border-black/30 hover:text-black transition-all font-montserrat"
                    >
                      Book Again
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
