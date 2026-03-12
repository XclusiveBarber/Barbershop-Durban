/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // Proxy all database/API routes to the C# ASP.NET Core backend.
    // Auth routes (/api/auth/*) are handled by Next.js itself.
    const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5280';
    const backendUrl = raw.startsWith('http') ? raw : `https://${raw}`;
    return [
      {
        source: '/api/appointments/:path*',
        destination: `${backendUrl}/api/appointments/:path*`,
      },
      {
        source: '/api/availability',
        destination: `${backendUrl}/api/availability`,
      },
      {
        source: '/api/availability/:path*',
        destination: `${backendUrl}/api/availability/:path*`,
      },
      {
        source: '/api/barbers/:path*',
        destination: `${backendUrl}/api/barbers/:path*`,
      },
      {
        source: '/api/haircuts/:path*',
        destination: `${backendUrl}/api/haircuts/:path*`,
      },
      {
        source: '/api/analytics/:path*',
        destination: `${backendUrl}/api/analytics/:path*`,
      },
      {
        // Map /api/customers to /api/profiles on the C# backend
        source: '/api/customers/:path*',
        destination: `${backendUrl}/api/profiles/:path*`,
      },
      {
        source: '/api/payments/:path*',
        destination: `${backendUrl}/api/payments/:path*`,
      },
    ];
  },
}

export default nextConfig
