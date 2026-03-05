"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Instagram,
  Facebook,
  Twitter,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export function Footer() {
  return (
    <footer className="bg-accent text-white pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold tracking-tight font-montserrat">
              XCLUSIVE BARBER
            </h3>
            <p className="text-sm text-white/90 leading-6 max-w-xs font-poppins">
              Gentlemen Groomers - The Barber Cartel. Durban's premier
              barbershop delivering exceptional grooming experiences through
              precision, style, and unmatched expertise.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-black flex items-center justify-center hover:bg-white hover:text-black transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-black flex items-center justify-center hover:bg-white hover:text-black transition-all"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-black flex items-center justify-center hover:bg-white hover:text-black transition-all"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xl font-semibold text-white font-montserrat">
              Service
            </h4>
            <ul className="space-y-2 text-sm text-white/90 font-poppins leading-6">
              <li>
                <a href="/" className="hover:text-black transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-black transition-colors"
                >
                  Services
                </a>
              </li>
              <li>
                <a
                  href="#location"
                  className="hover:text-black transition-colors"
                >
                  Location
                </a>
              </li>
              <li>
                <a
                  href="/services"
                  className="hover:text-black transition-colors"
                >
                  Book Online
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-black transition-colors">
                  Login
                </a>
              </li>
              <li>
                <a
                  href="/dashboard"
                  className="hover:text-black transition-colors"
                >
                  My Bookings
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xl font-semibold text-white font-montserrat">
              Contact
            </h4>
            <ul className="space-y-2 text-sm text-white/90 font-poppins leading-6">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  121 Helen Joseph Rd, Bulwer
                  <br />
                  Durban, Davenport
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <span>068 425 0060</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>ebarbershop998@gmail.com</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xl font-semibold text-white font-montserrat">
              Hours
            </h4>
            <ul className="space-y-2 text-sm text-white/90 font-poppins leading-6">
              <li className="flex justify-between">
                <span>Mon - Sat</span>
                <span>09:00 - 19:00</span>
              </li>
              <li className="flex justify-between">
                <span>Sunday</span>
                <span>09:00 - 15:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/70 font-poppins">
          <p>
            © 2025 Xclusive Barber - Durban, South Africa. All Rights Reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Gallery() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const images = [
    "/haircuts/brushfade.webp",
    "/haircuts/kid.webp",
    "/haircuts/taper.webp",
    "/haircuts/braids.webp",
    "/haircuts/blackhoodie.webp",
    "/haircuts/kid2.webp",
    "/haircuts/beard.webp",
    "/haircuts/afro.webp",
    "/haircuts/fade.webp",
    "/haircuts/rashford.webp",
  ];

  // Subtle auto-scroll that respects touches
  const plugin = useRef(Autoplay({ delay: 3500, stopOnInteraction: true }));

  useEffect(() => {
    if (!api) return;

    // Set initial dot state
    setCurrent(api.selectedScrollSnap());

    // Update dot state on scroll
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section className="py-24 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4 font-montserrat">
            Our Work
          </h2>
          <p className="text-white/70 font-open-sans">
            See the XCLUSIVE transformations
          </p>
        </div>

        <div className="relative mx-auto">
          <Carousel
            setApi={setApi}
            opts={{
              align: "center", // Strictly centers the active item
              loop: true,
            }}
            plugins={[plugin.current]}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {images.map((src, idx) => (
                <CarouselItem
                  key={idx}
                  // Back to basis-full: Perfectly 100% wide and centered on mobile
                  className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                >
                  <div className="relative aspect-[4/5] sm:aspect-square md:aspect-[4/5] overflow-hidden rounded-xl bg-neutral-900">
                    <Image
                      src={src}
                      alt={`Gallery ${idx + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover hover:scale-105 transition-transform duration-700 ease-in-out"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Desktop Navigation Buttons */}
            <div className="hidden md:block">
              <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 bg-white/10 text-white border-white/20 hover:bg-white hover:text-black transition-all" />
              <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 bg-white/10 text-white border-white/20 hover:bg-white hover:text-black transition-all" />
            </div>
          </Carousel>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => api?.scrollTo(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === current
                    ? "bg-white w-8" // Active dot expands
                    : "bg-white/30 w-2 hover:bg-white/50" // Inactive dots remain small
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
