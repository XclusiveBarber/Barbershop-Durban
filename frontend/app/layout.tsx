import type { Metadata } from "next";
import { Montserrat, Poppins, Open_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/context/auth-context";
import "./globals.css";

const montserrat = Montserrat({ 
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://xclusive-barber.com"),
  title: {
    template: "%s | XCLUSIVE BARBER",
    default: "XCLUSIVE BARBER - Davenport, Durban | All Types of XCLUSIVE Haircuts",
  },
  alternates: {
    canonical: "/",
  },
  description:
    "XCLUSIVE BARBER in Davenport, Durban. All types of XCLUSIVE haircuts, hair colouring, bald cuts (chiskop), beard services, and hectic designs. Book now at 121 Helen Joseph Rd, Bulwer.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/logo2 (2).png",
      },
      {
        url: "/favicon.ico",
      },
    ],
    apple: "/logo2 (2).png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${poppins.variable} ${openSans.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BarberShop",
              name: "XCLUSIVE BARBER",
              image: "https://xclusive-barber.com/hero/hero.jpeg",
              "@id": "https://xclusive-barber.com",
              url: "https://xclusive-barber.com",
              telephone: "0684250060",
              address: {
                "@type": "PostalAddress",
                streetAddress: "121 Helen Joseph Rd, Bulwer",
                addressLocality: "Durban",
                addressRegion: "KZN",
                postalCode: "4001",
                addressCountry: "ZA",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: -29.8587,
                longitude: 31.0218,
              },
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ],
                  opens: "09:00",
                  closes: "19:00",
                },
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: "Sunday",
                  opens: "09:00",
                  closes: "15:00",
                },
              ],
              priceRange: "$$",
            }),
          }}
        />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
