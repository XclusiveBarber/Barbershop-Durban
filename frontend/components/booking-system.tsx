"use client";

/**
 * BookingSystem — 4-step booking wizard
 *
 * Step 1  Service selection (from Supabase)
 * Step 2  Date & barber selection
 * Step 2b Barber & time selection (available slots from Supabase)
 * Step 3  Identity gate  ← smart: skipped/pre-filled if already logged in
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
  Mail,
  LogIn,
  UserCheck,
  Scissors,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth, type AuthUser } from "@/context/auth-context";
import { OtpLoginForm } from "@/components/otp-login-form";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
  duration_minutes?: number;
}

interface Barber {
  id: string;
  name: string;
  specialty?: string;
  image_url?: string;
}

function getInitialBookingDate(): Date {
  return new Date();
}

// ─── More Types ──────────────────────────────────────────────────────────────

// ─── Step-level sub-components ────────────────────────────────────────────────

function StepHeader({
  onBack,
  title,
}: {
  onBack?: () => void;
  title: string;
}) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 mb-6 md:mb-8">
      {onBack ? (
        <button
          onClick={onBack}
          className="flex items-center text-xs md:text-sm hover:text-black transition-colors text-black/50 whitespace-nowrap"
        >
          <ChevronLeft className="w-3.5 md:w-4 h-3.5 md:h-4 mr-1" /> Back
        </button>
      ) : (
        <div className="w-12 md:w-16" />
      )}
      <h3 className="text-lg md:text-2xl font-light text-black text-center flex-1 md:flex-none">{title}</h3>
      <div className="w-12 md:w-16" />
    </div>
  );
}

function BookingSummaryCard({
  service,
  date,
  time,
}: {
  service: Service | null;
  date: Date | undefined;
  time: string | null;
}) {
  const totalPrice = service ? Number(service.price) : 0;

  return (
    <div className="bg-black/[0.03] border-2 border-black/5 p-4 md:p-5 space-y-2 md:space-y-3 mb-4 md:mb-6">
      <p className="text-[10px] uppercase tracking-widest text-black/30 font-medium mb-2 md:mb-3">
        Booking Summary
      </p>
      {service && (
        <div className="flex justify-between text-xs md:text-sm gap-2">
          <span className="text-black/50 flex items-center gap-2 flex-shrink-0">
            <Scissors className="w-3 md:w-3.5 h-3 md:h-3.5" /> Service
          </span>
          <span className="font-medium text-black text-right">{service.name}</span>
        </div>
      )}
      <div className="flex justify-between text-xs md:text-sm gap-2">
        <span className="text-black/50 flex items-center gap-2 flex-shrink-0">
          <CalendarIcon className="w-3 md:w-3.5 h-3 md:h-3.5" /> Date
        </span>
        <span className="font-medium text-black">
          {date ? format(date, "EEE, MMM d") : "—"}
        </span>
      </div>
      <div className="flex justify-between text-xs md:text-sm gap-2">
        <span className="text-black/50 flex items-center gap-2 flex-shrink-0">
          <Clock className="w-3 md:w-3.5 h-3 md:h-3.5" /> Time
        </span>
        <span className="font-medium text-black">
          {time ?? "—"}
        </span>
      </div>
      <div className="pt-2 md:pt-3 border-t border-black/10 flex justify-between text-xs md:text-sm">
        <span className="font-semibold text-black">Total</span>
        <span className="font-semibold text-black">R{totalPrice}</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BookingSystem({ hideTitle = false }: { hideTitle?: boolean }) {
  const { user, isLoggedIn, login, accessToken } = useAuth();

  // Data state
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlotsData, setLoadingSlotsData] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Wizard state
  const [step, setStep]               = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber]   = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate]       = useState<Date | undefined>(getInitialBookingDate());
  const [selectedTime, setSelectedTime]       = useState<string | null>(null);
  const [phoneState, setPhoneState]           = useState<string>("");

  const goNext = () => setStep((s) => s + 1);
  const goPrev = () => setStep((s) => s - 1);

  // Load services and barbers on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesRes, barbersRes] = await Promise.all([
          fetch("/api/haircuts"),
          fetch("/api/barbers"),
        ]);

        if (servicesRes.ok) {
          const data = await servicesRes.json();
          setServices(Array.isArray(data) ? data : (data.haircuts || []));
        }

        if (barbersRes.ok) {
          const data = await barbersRes.json();
          setBarbers(Array.isArray(data) ? data : (data.barbers || []));
        }
      } catch (error) {
        console.error("Failed to load booking data:", error);
        toast.error("Failed to load available services");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Fetch available time slots when date changes
  useEffect(() => {
    if (!selectedDate) {
      setAvailableSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setLoadingSlotsData(true);
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        const res = await fetch(`/api/appointments/available-slots?date=${dateStr}`);
        const data = await res.json();
        // C# returns a plain string array e.g. ["09:00", "10:00"]
        // It handles day-of-week hours, barber capacity, and past-slot filtering
        let slots: string[] = Array.isArray(data) ? data : [];

        // ── TEMPORARY EASTER WEEKEND OVERRIDE (remove after 2026-04-06) ──────
        // Fri 2026-04-03 & Sat 2026-04-04: close at 13:00 (last slot 12:00)
        // Sun 2026-04-05: closed
        if (dateStr === "2026-04-05") {
          slots = [];
        } else if (dateStr === "2026-04-03" || dateStr === "2026-04-04") {
          slots = slots.filter((t) => t < "13:00");
        }
        // ─────────────────────────────────────────────────────────────────────

        setAvailableSlots(slots);
      } catch (error) {
        console.error("Failed to fetch availability:", error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlotsData(false);
      }
    };

    fetchSlots();
  }, [selectedDate]);

  // ── Step 3 helpers ────────────────────────────────────────────────────────

  // Restores booking state if they were redirected back from Google Auth
  useEffect(() => {
    const savedBooking = sessionStorage.getItem("pendingBooking");
    if (savedBooking && isLoggedIn) {
      try {
        const data = JSON.parse(savedBooking);
        setSelectedService(data.service);
        setSelectedDate(new Date(data.date));
        setSelectedTime(data.time);
        setStep(3); // Jump straight to the confirm/payment step!
        sessionStorage.removeItem("pendingBooking"); // Clean up
      } catch (e) {
        console.error("Failed to restore booking state", e);
      }
    }
  }, [isLoggedIn]);

  /** Called when user wants to enter step 3 */
  const enterStep3 = () => {
    if (!isLoggedIn) {
      // Temporarily cache the booking in case OAuth forces a full page redirect
      sessionStorage.setItem("pendingBooking", JSON.stringify({
        service: selectedService,
        date: selectedDate,
        time: selectedTime,
      }));
    }
    setStep(3);
  };

  // ── Submission ────────────────────────────────────────────────────────────

  const [isRedirectingToPayment, setIsRedirectingToPayment] = useState(false);
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);

  /** Validate phone number - accepts 9 digits (local without 0), 10 digits (with leading 0), or +27 format */
  const isValidPhoneNumber = (phone: string): boolean => {
    const clean = phone.replace(/[\s\-]/g, "");
    return /^(\d{9}|\d{10}|\+27\d{9})$/.test(clean);
  };

  /** Normalise to +27 international format before sending to the API */
  const normalizePhone = (p: string): string => {
    const c = p.replace(/[\s\-]/g, "");
    if (c.startsWith("+27")) return c;
    if (c.startsWith("0") && c.length === 10) return "+27" + c.slice(1);
    if (c.length === 9) return "+27" + c;
    return c;
  };

  /** Show the external-redirect warning modal before initiating payment */
  const handleConfirm = () => {
    if (!isLoggedIn || !user) {
      toast.error("You must be logged in to confirm your booking.");
      return;
    }
    if (!phoneState.trim()) {
      toast.error("Please enter your phone number before confirming.");
      return;
    }
    if (!isValidPhoneNumber(phoneState)) {
      toast.error("Please enter a valid phone number (10 digits or +27 format).");
      return;
    }
    setShowPaymentWarning(true);
  };

  /** Called after the user accepts the redirect warning */
  const handleProceedToPayment = async () => {
    setShowPaymentWarning(false);
    setIsRedirectingToPayment(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      // Step 1: Create the appointment
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers,
        body: JSON.stringify({
          haircutId: selectedService?.id,
          appointmentDate: selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
          timeSlot: selectedTime,
          customerPhone: normalizePhone(phoneState),
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create appointment";
        try {
          const text = await response.text();
          if (text) {
            try {
              const error = JSON.parse(text);
              errorMessage = error.error || error.message || error.title || (typeof error === "string" ? error : null) || errorMessage;
            } catch {
              errorMessage = text;
            }
          }
        } catch { /* ignore */ }
        throw new Error(errorMessage);
      }

      const appointment = await response.json();
      const appointmentId = appointment.id;

      // Step 2: Create Yoco checkout session
      // ADDED: process.env.NEXT_PUBLIC_API_URL to ensure it hits Azure
      const checkoutRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/payments/create-checkout`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount: selectedService ? Number(selectedService.price) : 0,
          appointmentId,
        }),
      });
      if (!checkoutRes.ok) {
        const errText = await checkoutRes.text();
        throw new Error(`Payment setup failed: ${errText}`);
      }
      const data = await checkoutRes.json();
      // Step 3: Extract URL safely (catches capitalization differences from C#)
      const finalRedirectUrl = data.redirectUrl || data.RedirectUrl || data.redirecturl || data.redirect_url || data.url;
      if (!finalRedirectUrl) {
         throw new Error("Azure returned success, but the Yoco URL was missing. Check the console log!");
      }
      // Step 4: Redirect to Yoco hosted payment page
      toast.success("Redirecting to payment...");
      window.location.href = finalRedirectUrl;
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.message || "Failed to create appointment");
      setIsRedirectingToPayment(false);
    }
  };

  // ── Policy items ──────────────────────────────────────────────────────────

  const BOOKING_POLICIES = [
    { icon: <Clock className="w-4 h-4" />, title: "Advance booking", detail: "Appointments must be booked at least 1 hour in advance." },
    { icon: <CalendarIcon className="w-4 h-4" />, title: "One reschedule only", detail: "Each appointment may be rescheduled once, with at least 2 hours' notice." },
    { icon: <AlertTriangle className="w-4 h-4" />, title: "Late arrival fee", detail: "Arriving 15–29 minutes late incurs a R10 fee. Arrivals 30+ minutes late must reschedule." },
    { icon: <ShieldAlert className="w-4 h-4" />, title: "Cancellations", detail: "Cancellations are permitted before your appointment time. No-shows are not refunded." },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section id="book" className="py-24 bg-white">

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
          {/* Progress bar — 4 steps */}
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
                  <h3 className="text-xl md:text-2xl font-semibold mb-6 md:mb-8 text-black font-montserrat">
                    Choose a Service
                  </h3>
                  {loadingData ? (
                    <div className="text-center py-12 text-black/50">Loading services...</div>
                  ) : services.length === 0 ? (
                    <div className="text-center py-12 text-black/50">No services available</div>
                  ) : (
                    <>
                      <div className="grid gap-2 md:gap-3">
                        {services.map((service) => {
                          const isSelected = selectedService?.id === service.id;
                          return (
                            <button
                              key={service.id}
                              onClick={() => setSelectedService(service)}
                              className={`flex items-center justify-between p-3 md:p-5 border-2 text-left transition-all hover:border-black group gap-3 min-w-0 ${
                                isSelected
                                  ? "border-black bg-black/[0.02]"
                                  : "border-black/10"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm md:text-base text-black truncate">{service.name}</p>
                                <p className="text-xs text-black/40 mt-0.5 line-clamp-2">{service.description || "Haircut service"}</p>
                              </div>
                              <div className="text-right flex items-center gap-2 md:gap-3 flex-shrink-0">
                                <div className="flex flex-col items-end whitespace-nowrap">
                                  <p className="font-semibold text-sm md:text-base text-black">R{service.price}</p>
                                  {service.duration_minutes && (
                                    <p className="text-[10px] text-black/40">{service.duration_minutes}min</p>
                                  )}
                                </div>
                                <div className={`w-4 md:w-5 h-4 md:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'border-black' : 'border-black/20 group-hover:border-black/50'}`}>
                                  {isSelected && <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-black" />}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <button
                        disabled={!selectedService}
                        onClick={goNext}
                        className="w-full bg-accent text-accent-foreground py-3 md:py-4 mt-6 md:mt-8 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90 font-medium text-xs md:text-sm uppercase tracking-wide"
                      >
                        Continue
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {/* ─── Step 2: Date & Time ──────────────────────────── */}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    <div className="flex justify-center border border-black/10 p-2 bg-black/[0.01] overflow-x-auto">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => { setSelectedDate(date); setSelectedTime(null); }}
                        disabled={{ before: new Date() }}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-4">
                      <p className="text-xs font-medium uppercase tracking-widest text-black/40 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Available Times
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                        {loadingSlotsData ? (
                          <p className="col-span-2 text-xs text-black/40 py-4">Loading available times...</p>
                        ) : availableSlots.length === 0 ? (
                          <p className="col-span-2 text-xs text-black/40 py-4">No slots available for this date — select another date.</p>
                        ) : (
                          availableSlots.map((time) => {
                            const isSelected = selectedTime === time;
                            return (
                              <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`p-2.5 md:p-3 text-xs md:text-sm border-2 transition-all ${
                                  isSelected
                                    ? "bg-black text-white border-black"
                                    : "border-black/10 hover:border-black text-black"
                                }`}
                              >
                                {time}
                              </button>
                            );
                          })
                        )}
                      </div>
                      <button
                        disabled={!selectedTime || !selectedDate}
                        onClick={enterStep3}
                        className="w-full bg-accent text-accent-foreground py-3 md:py-4 mt-2 md:mt-4 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:opacity-90 font-medium text-xs md:text-sm uppercase tracking-wide"
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
                  {/* ── Already logged in ─────────────────────────────── */}
                  {isLoggedIn && user ? (
                    <>
                      <StepHeader onBack={goPrev} title="Confirm Booking" />
                      <BookingSummaryCard service={selectedService} date={selectedDate} time={selectedTime} />
                      <div className="flex items-center gap-3 p-4 border-2 border-black/10 bg-black/[0.02]">
                        <UserCheck className="w-5 h-5 text-black/40 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-black">{user.name}</p>
                          <p className="text-xs text-black/40">{user.email}</p>
                        </div>
                      </div>

                      {/* ── Booking Policies ──────────────────────────── */}
                      <div className="border-2 border-black/10 p-5 bg-black/[0.01]">
                        <p className="text-[10px] uppercase tracking-widest text-black/40 font-medium mb-5 flex items-center gap-2">
                          <ShieldAlert className="w-3.5 h-3.5" /> Booking Policies
                        </p>
                        <ul className="space-y-4">
                          {BOOKING_POLICIES.map((policy) => (
                            <li key={policy.title} className="flex gap-4 items-start text-sm">
                              <div className="mt-0.5 text-black/40 flex-shrink-0">{policy.icon}</div>
                              <div className="flex-1">
                                <p className="font-semibold text-black mb-0.5 leading-snug">{policy.title}</p>
                                <p className="text-black/50 leading-relaxed text-xs">{policy.detail}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* ── Phone Number ──────────────────────────────── */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-black/40 font-medium block">
                          Phone Number <span className="normal-case tracking-normal text-black/30">(for appointment updates)</span>
                        </label>
                        <div className={`flex border-2 transition-colors focus-within:ring-0 ${
                          phoneState && !isValidPhoneNumber(phoneState)
                            ? "border-red-400"
                            : phoneState && isValidPhoneNumber(phoneState)
                            ? "border-green-400"
                            : "border-black/10 focus-within:border-black"
                        }`}>
                          <div className="flex items-center px-3 bg-black/[0.04] border-r border-black/10 text-sm text-black/50 select-none whitespace-nowrap gap-1.5 flex-shrink-0">
                            <span>🇿🇦</span>
                            <span className="font-medium">+27</span>
                          </div>
                          <input
                            type="tel"
                            inputMode="numeric"
                            value={phoneState}
                            onChange={(e) => setPhoneState(e.target.value)}
                            placeholder="82 123 4567"
                            className="flex-1 px-4 py-3 text-sm focus:outline-none bg-transparent text-black placeholder:text-black/25"
                          />
                        </div>
                        {phoneState && !isValidPhoneNumber(phoneState) && (
                          <p className="text-xs text-red-600">
                            Enter your number without the leading 0 — e.g. 82 123 4567
                          </p>
                        )}
                        {phoneState && isValidPhoneNumber(phoneState) && (
                          <p className="text-xs text-green-600">✓ Valid</p>
                        )}
                      </div>

                      {/* ── External Payment Notice ────────────────────── */}
                      <div className="flex items-start gap-3 p-4 border-2 border-amber-200 bg-amber-50">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                          By clicking <strong>Confirm &amp; Pay</strong> you will be redirected to{" "}
                          <strong>Yoco</strong>, our secure external payment provider, to complete
                          your transaction. You will be returned to this site after payment.
                        </p>
                      </div>

                      <button
                        onClick={handleConfirm}
                        disabled={isRedirectingToPayment}
                        className="w-full bg-accent text-accent-foreground py-4 font-medium text-sm uppercase tracking-wide hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isRedirectingToPayment ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Securing your slot…
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            Confirm &amp; Pay via Yoco
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    /* ── Not logged in — auth gate ─────────────────────── */
                    <div className="pt-2">
                      <OtpLoginForm 
                        onComplete={() => {}} 
                        onBackAction={goPrev} 
                      />
                    </div>
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
                    Booking Confirmed!
                  </h3>

                  <p className="text-black/55 max-w-sm mx-auto text-sm leading-relaxed">
                    {`Thanks, ${user?.name ?? ""}. Your ${selectedService?.name ?? "service"} on ${
                      selectedDate ? format(selectedDate, "EEE, MMM d") : ""
                    } at ${selectedTime} is confirmed. A barber will be assigned to you.`}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Link
                      href="/dashboard"
                      className="bg-accent text-accent-foreground px-8 py-3 text-sm uppercase tracking-wider font-semibold hover:opacity-90 transition-all font-montserrat"
                    >
                      View My Bookings
                    </Link>
                    <button
                      onClick={() => {
                        setStep(1);
                        setSelectedService(null);
                        setSelectedTime(null);
                        setPhoneState("");
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

      {/* ── Payment Redirect Warning Modal ────────────────────────────────── */}
      {showPaymentWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
            className="bg-white max-w-md w-full p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-amber-100 flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="text-lg font-semibold text-black">
                You&apos;re leaving this site
              </h4>
            </div>
            <p className="text-sm text-black/60 leading-relaxed mb-6">
              You will be redirected to <strong className="text-black">Yoco</strong>, a secure
              third-party payment provider, to complete your payment of{" "}
              <strong className="text-black">
                R{selectedService ? Number(selectedService.price) : 0}
              </strong>. After a
              successful payment you will be brought back here automatically.
            </p>
            <p className="text-xs text-black/40 mb-8">
              Your appointment slot will be held while you complete payment. If you close the Yoco
              page without paying, the booking will remain pending.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleProceedToPayment}
                className="flex-1 bg-accent text-accent-foreground py-3 px-4 text-xs md:text-sm uppercase tracking-widest font-semibold font-montserrat hover:opacity-90 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Continue to Payment</span>
              </button>
              <button
                onClick={() => setShowPaymentWarning(false)}
                className="flex-1 border-2 border-black/10 text-black/50 py-3 px-4 text-xs md:text-sm uppercase tracking-widest font-semibold font-montserrat hover:border-black/30 hover:text-black transition-all whitespace-nowrap"
              >
                Go Back
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
}
