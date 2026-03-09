'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, LogOut, Home, User } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useAuth, type AuthUser } from '@/context/auth-context';

interface Appointment {
  id: number;
  service_name: string;
  service_price: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  customer_name: string;
  customer_phone: string;
}

export function BarberDashboard({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments');
      const data = await response.json();
      if (response.ok) setAppointments(data.appointments);
    } catch {
      // silently handle - testing mode
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const upcoming = appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed');

  return (
    <div className="min-h-screen bg-white text-black">

      {/* Header */}
      <header className="bg-black py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/logo.png" alt="Xclusive Barber Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-white font-montserrat">
              XCLUSIVE BARBER
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-sm text-white/60 font-semibold font-montserrat">
              <User className="w-4 h-4" />
              {user.name}
            </div>
            <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors font-semibold font-montserrat flex items-center gap-2">
              <Home className="w-4 h-4" /> Home
            </Link>
            <button onClick={handleLogout} className="text-sm text-white/60 hover:text-white transition-colors font-semibold font-montserrat flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <span className="text-black/40 uppercase tracking-widest text-xs mb-4 block">My Schedule</span>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight">
            Upcoming Appointments
          </h1>
        </div>

        {loading ? (
          <div className="text-center py-24">
            <div className="inline-block w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="border-2 border-black/10 p-16 text-center">
            <Calendar className="w-12 h-12 text-black/15 mx-auto mb-6" />
            <p className="text-black/40 text-sm">No upcoming appointments</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {upcoming.map((appointment) => (
              <div key={appointment.id} className="border-2 border-black/10 p-6 hover:border-accent/30 transition-colors">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-light">{appointment.service_name}</h3>
                    <p className="text-xs text-black/40 mt-1">{appointment.customer_name}</p>
                    <p className="text-xs text-black/30">{appointment.customer_phone}</p>
                  </div>
                  <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-medium ${
                    appointment.status === 'confirmed' ? 'bg-accent text-accent-foreground' : 'bg-black/5 text-black/40'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-black/60">
                    <Calendar className="w-4 h-4 text-black/30" />
                    {format(new Date(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-black/60">
                    <Clock className="w-4 h-4 text-black/30" />
                    {appointment.appointment_time}
                  </div>
                  <div className="text-sm font-medium">{appointment.service_price}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
