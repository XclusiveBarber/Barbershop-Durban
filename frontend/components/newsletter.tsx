'use client';

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

export function Newsletter() {
  const [loading, setLoading] = useState(false);
  const { user, isLoggedIn, accessToken } = useAuth();
  const router = useRouter();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is logged in
    if (!isLoggedIn || !user) {
      toast.error('Please log in to subscribe to our newsletter');
      router.push('/login');
      return;
    }

    if (!accessToken) {
      toast.error('Authentication token missing. Please log in again.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/profiles/newsletter', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ wantsNewsletter: true }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to subscribe');
      }

      toast.success('Successfully subscribed to our newsletter!');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 bg-white border-t border-black/10">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <Mail className="w-8 h-8 mx-auto mb-4 text-accent" />
        <h3 className="text-2xl md:text-3xl font-semibold mb-3 text-black font-montserrat">
          Stay Updated
        </h3>
        <p className="text-sm md:text-base text-black/60 mb-6 max-w-xl mx-auto font-poppins">
          Subscribe to our newsletter for exclusive offers, grooming tips, and updates.
        </p>
        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            required
            disabled={loading || !isLoggedIn}
            suppressHydrationWarning
            className="flex-1 px-4 py-3 border border-black/20 focus:outline-none focus:ring-2 focus:ring-accent text-sm font-poppins disabled:bg-black/5 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={loading || !isLoggedIn}
            suppressHydrationWarning
            className="px-6 py-3 bg-accent text-accent-foreground text-sm font-semibold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-montserrat"
          >
            {!isLoggedIn ? 'Login to Subscribe' : loading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
        {!isLoggedIn && (
          <p className="text-xs text-black/40 mt-3 font-poppins">
            You must be logged in to subscribe to our newsletter.
          </p>
        )}
      </div>
    </section>
  );
}
