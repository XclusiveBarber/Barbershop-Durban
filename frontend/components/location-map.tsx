"use client";

import React from "react";
import { MapPin, Phone, Clock, Mail, Navigation } from "lucide-react";

export function LocationMap() {
  const location = {
    address: "121 Helen Joseph Rd, Bulwer",
    city: "Durban",
    province: "Davenport",
    postalCode: "4001",
    country: "South Africa",
    phone: "068 425 0060",
    email: "ebarbershop998@gmail.com",
    lat: -29.8587,
    lng: 31.0218,
  };

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;

  return (
    <section id="location" className="py-24 bg-black text-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="mb-16">
          <span className="text-white/40 uppercase tracking-widest text-xs mb-4 block font-montserrat">
            Find Us
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight font-montserrat">
            Visit XCLUSIVE BARBER <br />
            in Davenport, Durban.
          </h2>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Map */}
          <div className="lg:col-span-3 relative h-[400px] lg:h-[520px] overflow-hidden border border-white/10">
            <iframe
              src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3459.7896494899817!2d${location.lng}!3d${location.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjnCsDUxJzMxLjMiUyAzMcKwMDEnMTguNSJF!5e0!3m2!1sen!2sza!4v1234567890123!5m2!1sen!2sza`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>

          {/* Info */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Address */}
            <div className="border border-white/10 p-6 flex items-start gap-4">
              <MapPin className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3 font-semibold font-montserrat">
                  Address
                </h3>
                <p className="text-sm text-white/80 leading-relaxed font-poppins">
                  {location.address}
                  <br />
                  {location.city}, {location.province}
                  <br />
                  {location.postalCode}
                </p>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-xs uppercase tracking-widest text-white hover:text-white/60 transition-colors"
                >
                  <Navigation className="w-3 h-3" />
                  Get Directions
                </a>
              </div>
            </div>

            {/* Contact */}
            <div className="border border-white/10 p-6 flex items-start gap-4">
              <Phone className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3 font-medium">
                  Contact
                </h3>
                <a
                  href={`tel:${location.phone}`}
                  className="block text-sm text-white/60 hover:text-white transition-colors"
                >
                  {location.phone}
                </a>
                <a
                  href={`mailto:${location.email}`}
                  className="block text-sm text-white/60 hover:text-white transition-colors mt-1"
                >
                  {location.email}
                </a>
              </div>
            </div>

            {/* Hours */}
            <div className="border border-white/10 p-6 flex items-start gap-4">
              <Clock className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3 font-medium">
                  Hours
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/40">Mon - Sat</span>
                    <span className="text-white/60">09:00 - 19:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Sunday</span>
                    <span className="text-white/60">09:00 - 15:00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <a
              href="/services"
              className="block text-center px-8 py-4 bg-accent text-accent-foreground text-[11px] uppercase tracking-[0.2em] font-medium hover:opacity-90 transition-all shadow-lg"
            >
              Book Your Appointment
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
