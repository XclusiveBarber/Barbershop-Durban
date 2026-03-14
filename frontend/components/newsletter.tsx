'use client';

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

export function Newsletter() {
  const [loading, setLoading] = useState(false);
  const { user, isLoggedIn, accessToken } = useAuth();

  const handleSubscribe = async () => {
    if (!isLoggedIn || !user) {
      toast.error('Please log in to subscribe to our newsletter');
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
        <div className="max-w-md mx-auto">
          {isLoggedIn ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-black/60 font-poppins">
                Subscribe using your account email: <strong>{user?.email}</strong>
              </p>
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="px-6 py-3 bg-accent text-accent-foreground text-sm font-semibold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-montserrat"
              >
                {loading ? 'Subscribing...' : 'Subscribe Now'}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-black text-white text-sm font-semibold uppercase tracking-wider hover:bg-black/80 transition-all font-montserrat"
              >
                Login to Subscribe
              </Link>
              <p className="text-xs text-black/40 mt-3 font-poppins">
                You must have an account to stay updated with exclusive offers.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
