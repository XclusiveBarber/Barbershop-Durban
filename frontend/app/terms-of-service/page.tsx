import React from "react";
import { Footer } from "@/components/gallery-and-footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black text-white py-6 px-6 sm:px-12 sticky top-0 z-50 flex items-center">
        <Link href="/" className="flex items-center gap-2 text-white hover:text-white/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-poppins text-sm">Back to Home</span>
        </Link>
        <div className="flex-1 text-center pr-24">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-montserrat">
            XCLUSIVE BARBER
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 sm:py-24 font-poppins text-neutral-800">
        <h1 className="text-4xl md:text-5xl font-bold font-montserrat mb-8 text-black">
          Terms of Service
        </h1>
        
        <div className="space-y-8 text-base leading-relaxed">
          <section>
            <p className="mb-4">
              <strong>Last Updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>
            </p>
            <p>
              Welcome to Xclusive Barber. These Terms of Service ("Terms") govern your access to and use of our website, booking system, and barbering services. By accessing or using our services, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-montserrat text-black mb-4">1. Booking Appointments</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Appointments can be made online through our booking system, by phone, or in person.</li>
              <li>We recommend booking in advance to secure your preferred time and barber.</li>
              <li>You must provide accurate and complete information when booking an appointment.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-montserrat text-black mb-4">2. Cancellations and No-Shows</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We value our barbers' time as well as yours. Please provide at least 2 hours' notice if you need to cancel or reschedule your appointment.</li>
              <li>Failure to show up for an appointment without prior notice ("no-show") may result in a requirement to pre-pay for future bookings or a restriction on future online bookings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-montserrat text-black mb-4">3. Arrival Time</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Please aim to arrive 5-10 minutes before your scheduled appointment time.</li>
              <li>If you arrive late, we will do our best to accommodate you, but your service time may be shortened to avoid delaying the next client. If you are significantly late, we may need to reschedule your appointment.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-montserrat text-black mb-4">4. Services and Pricing</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Our service menu and pricing are subject to change without prior notice.</li>
              <li>We reserve the right to refuse service to anyone for any reason at our discretion, including but not limited to inappropriate behavior or health and safety concerns.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-montserrat text-black mb-4">5. Payment</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment is due in full at the time of service.</li>
              <li>We accept cash and major credit/debit cards.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-montserrat text-black mb-4">6. Liability</h2>
            <p>
              To the maximum extent permitted by law, Xclusive Barber shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-montserrat text-black mb-4">7. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
              <br />
              <br />
              <strong>Email:</strong> info@xclusivebarber.co.za
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
