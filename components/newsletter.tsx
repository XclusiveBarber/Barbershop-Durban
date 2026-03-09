'use client';

import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast.success('Successfully subscribed to our newsletter!');
      setEmail('');
      setLoading(false);
    }, 1000);
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
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-1 px-4 py-3 border border-black/20 focus:outline-none focus:ring-2 focus:ring-accent text-sm font-poppins"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-accent text-accent-foreground text-sm font-semibold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 font-montserrat"
          >
            {loading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>
      </div>
    </section>
  );
}
