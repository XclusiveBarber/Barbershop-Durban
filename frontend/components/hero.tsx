import React from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";

export function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero/hero.jpeg"
          alt="Xclusive Barber"
          fill
          priority
          className="object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold text-white mb-8 tracking-tight leading-[0.95] text-balance font-montserrat">
          XCLUSIVE BARBER
        </h1>
        <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed text-pretty font-open-sans">
          Davenport - All types of XCLUSIVE haircuts, hair colouring, bald cuts,
          beard services, and hectic designs. Experience professional grooming
          at its finest.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <a
            href="/services"
            className="px-10 py-4 bg-accent text-accent-foreground text-sm uppercase tracking-widest font-bold hover:opacity-90 transition-all shadow-lg font-poppins"
          >
            Book Appointment
          </a>
          <a
            href="#services"
            className="px-10 py-4 border-2 border-white/30 text-white text-sm uppercase tracking-widest font-semibold hover:bg-white hover:text-black transition-all font-poppins"
          >
            Our Services
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <ChevronDown className="w-6 h-6 text-white/40" />
      </div>
    </section>
  );
}
