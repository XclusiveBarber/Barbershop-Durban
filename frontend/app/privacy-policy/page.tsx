import React from "react";
import { Footer } from "@/components/gallery-and-footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        
        <div className="space-y-8 text-base leading-relaxed">
          <section>
            <p className="mb-4">
              <strong>Last Updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>
            </p>
            <p>
              Xclusive Barber ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) or use our booking services, and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-montserrat text-black mb-4">1. The Data We Collect About You</h2>
            <p className="mb-4">
              Personal data, or personal information, means any information about an individual from which that person can be identified. We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes billing address, email address, and telephone numbers.</li>
              <li><strong>Transaction Data</strong> includes details about payments to and from you and other details of services you have purchased from us.</li>
              <li><strong>Profile Data</strong> includes your username and password, appointments made by you, your preferences, and feedback.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-montserrat text-black mb-4">2. How We Use Your Personal Data</h2>
            <p className="mb-4">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Where we need to perform the contract we are about to enter into or have entered into with you (e.g., to process your booking).</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>Where we need to comply with a legal obligation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-montserrat text-black mb-4">3. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-montserrat text-black mb-4">4. Data Retention</h2>
            <p>
              We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting, or reporting requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-montserrat text-black mb-4">5. Your Legal Rights</h2>
            <p className="mb-4">
              Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Request access to your personal data.</li>
              <li>Request correction of your personal data.</li>
              <li>Request erasure of your personal data.</li>
              <li>Object to processing of your personal data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-montserrat text-black mb-4">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
              <br />
              <br />
              <strong>Email:</strong> info@xclusivebarber.co.za
              <br />
              <strong>Address:</strong> 121 Helen Joseph Rd, Bulwer, Durban, Davenport
              <br />
              <strong>Phone:</strong> 068 425 0060
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
