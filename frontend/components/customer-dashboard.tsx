'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, X, Edit2, LogOut, Plus, Home, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth, type AuthUser } from '@/context/auth-context';

// Shape returned by GET /api/appointments
interface AppointmentRow {
  id: number;
  appointment_date: string;
  time_slot: string;
  status: string;
  total_price: number | null;
  payment_status: string;
  created_at: string;
  haircuts: { name: string; price: number } | null;
  barbers:  { full_name: string } | null;
}

export function CustomerDashboard({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { logout, accessToken } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const fetchAppointments = async () => {
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const response = await fetch('/api/appointments/my-appointments', { headers });
      const data = await response.json();
      if (response.ok) {
        setAppointments(Array.isArray(data) ? data : (data.appointments ?? []));
      } else {
        toast.error(data.error || 'Failed to load appointments');
      }
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const response = await fetch(`/api/appointments/${id}`, { method: 'DELETE', headers });
      if (response.ok) {
        toast.success('Appointment cancelled');
        fetchAppointments();
      } else {
        toast.error('Failed to cancel appointment');
      }
    } catch {
      toast.error('Failed to cancel appointment');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const upcoming = appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed');
  const past     = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

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
              {user.name || 'Guest'}
            </div>
            <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors font-semibold font-montserrat flex items-center gap-2">
              <Home className="w-4 h-4" /> Home
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-white/60 hover:text-white transition-colors font-semibold font-montserrat flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="mb-12">
          <span className="text-black/40 uppercase tracking-widest text-xs mb-4 block">My Bookings</span>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <h1 className="text-4xl md:text-5xl font-light tracking-tight">
              Your Appointments
            </h1>
            <button
              onClick={() => router.push('/services')}
              className="bg-accent text-accent-foreground px-8 py-4 font-semibold hover:opacity-90 transition-all flex items-center gap-3 w-fit font-montserrat"
            >
              <Plus className="w-4 h-4" />
              Book New Appointment
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24">
            <div className="inline-block w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin" />
            <p className="mt-6 text-black/40 text-sm">Loading appointments...</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Upcoming */}
            <section>
              <span className="text-black/40 uppercase tracking-widest text-xs mb-6 block">Upcoming</span>
              {upcoming.length === 0 ? (
                <div className="border-2 border-black/10 p-16 text-center">
                  <Calendar className="w-12 h-12 text-black/15 mx-auto mb-6" />
                  <h3 className="text-xl font-light mb-2">No upcoming appointments</h3>
                  <p className="text-black/40 text-sm mb-8">Book your next grooming session today</p>
                  <button
                    onClick={() => router.push('/services')}
                    className="bg-accent text-accent-foreground px-8 py-4 font-semibold hover:opacity-90 transition-all font-montserrat"
                  >
                    Book Now
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {upcoming.map((appt) => (
                    <div key={appt.id} className="border-2 border-black/10 p-6 hover:border-accent/30 transition-colors">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-lg font-light mb-1">{appt.haircuts?.name ?? '—'}</h3>
                          <p className="text-xs text-black/40">with {appt.barbers?.full_name ?? '—'}</p>
                        </div>
                        <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-medium ${
                          appt.status === 'confirmed'
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-black/5 text-black/40'
                        }`}>
                          {appt.status}
                        </span>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-sm text-black/60">
                          <Calendar className="w-4 h-4 text-black/30" />
                          {format(new Date(appt.appointment_date), 'EEEE, MMMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-black/60">
                          <Clock className="w-4 h-4 text-black/30" />
                          {appt.time_slot}
                        </div>
                        {appt.total_price != null && (
                          <div className="text-sm font-medium">R{appt.total_price}</div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-6 border-t border-black/5">
                        <button
                          onClick={() => router.push('/services')}
                          className="flex-1 border-2 border-black/10 text-black/60 px-4 py-2 text-xs uppercase tracking-widest hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2"
                        >
                          <Edit2 className="w-3 h-3" /> Reschedule
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(appt.id)}
                          className="flex-1 border-2 border-black/10 text-black/40 px-4 py-2 text-xs uppercase tracking-widest hover:border-black/30 hover:text-black transition-all flex items-center justify-center gap-2"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Past */}
            {past.length > 0 && (
              <section>
                <span className="text-black/40 uppercase tracking-widest text-xs mb-6 block">History</span>
                <div className="border-2 border-black/10 overflow-hidden">
                  <table className="w-full">
                    <thead className="border-b border-black/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-medium text-black/30 uppercase tracking-widest">Service</th>
                        <th className="px-6 py-4 text-left text-[10px] font-medium text-black/30 uppercase tracking-widest">Barber</th>
                        <th className="px-6 py-4 text-left text-[10px] font-medium text-black/30 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-left text-[10px] font-medium text-black/30 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {past.map((appt) => (
                        <tr key={appt.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                          <td className="px-6 py-4 text-sm">{appt.haircuts?.name ?? '—'}</td>
                          <td className="px-6 py-4 text-sm text-black/40">{appt.barbers?.full_name ?? '—'}</td>
                          <td className="px-6 py-4 text-sm text-black/40">
                            {format(new Date(appt.appointment_date), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] uppercase tracking-widest ${
                              appt.status === 'completed' ? 'text-black/40' : 'text-black/20'
                            }`}>
                              {appt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
