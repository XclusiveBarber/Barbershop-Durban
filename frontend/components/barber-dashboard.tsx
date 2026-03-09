'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, LogOut, Home, User, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth, type AuthUser } from '@/context/auth-context';

interface Appointment {
  id: string;
  service_name: string;
  service_price: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  customer_name: string;
  customer_email: string | null;
}

export function BarberDashboard({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments');
      const data = await response.json();
      if (response.ok) setAppointments(data.appointments);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'late' | 'completed') => {
    setUpdating(id + status);
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        toast.success(
          status === 'completed'
            ? 'Appointment marked as completed. Receipt email sent.'
            : 'Customer marked as late. Notification email sent.'
        );
        fetchAppointments();
      } else {
        toast.error('Failed to update appointment');
      }
    } catch {
      toast.error('Failed to update appointment');
    } finally {
      setUpdating(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const active = appointments.filter(
    a => a.status !== 'cancelled' && a.status !== 'completed'
  );
  const completed = appointments.filter(a => a.status === 'completed');

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
          <h1 className="text-4xl md:text-5xl font-light tracking-tight">Upcoming Appointments</h1>
        </div>

        {loading ? (
          <div className="text-center py-24">
            <div className="inline-block w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin" />
          </div>
        ) : active.length === 0 ? (
          <div className="border-2 border-black/10 p-16 text-center">
            <Calendar className="w-12 h-12 text-black/15 mx-auto mb-6" />
            <p className="text-black/40 text-sm">No upcoming appointments</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {active.map((appointment) => (
              <div
                key={appointment.id}
                className={`border-2 p-6 transition-colors ${
                  appointment.status === 'late'
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-black/10 hover:border-accent/30'
                }`}
              >
                {/* Card header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-light">{appointment.service_name}</h3>
                    <p className="text-xs text-black/40 mt-1">{appointment.customer_name}</p>
                    {!appointment.customer_email && (
                      <p className="text-[10px] text-black/30 italic mt-0.5">No email — notification skipped</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-medium ${
                    appointment.status === 'confirmed'
                      ? 'bg-accent text-accent-foreground'
                      : appointment.status === 'late'
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-black/5 text-black/40'
                  }`}>
                    {appointment.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-6">
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

                {/* Action buttons */}
                <div className="flex gap-3 pt-6 border-t border-black/5">
                  <button
                    onClick={() => updateStatus(appointment.id, 'late')}
                    disabled={!!updating || appointment.status === 'late'}
                    className="flex-1 border-2 border-orange-200 text-orange-500 px-4 py-2 text-xs uppercase tracking-widest hover:bg-orange-50 hover:border-orange-300 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {updating === appointment.id + 'late' ? 'Marking…' : 'Mark Late'}
                  </button>
                  <button
                    onClick={() => updateStatus(appointment.id, 'completed')}
                    disabled={!!updating}
                    className="flex-1 bg-accent text-accent-foreground px-4 py-2 text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-3 h-3" />
                    {updating === appointment.id + 'completed' ? 'Completing…' : 'Complete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed today */}
        {completed.length > 0 && (
          <section>
            <span className="text-black/40 uppercase tracking-widest text-xs mb-6 block">Completed Today</span>
            <div className="border-2 border-black/10 overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-black/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-medium text-black/30 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-left text-[10px] font-medium text-black/30 uppercase tracking-widest">Service</th>
                    <th className="px-6 py-4 text-left text-[10px] font-medium text-black/30 uppercase tracking-widest">Time</th>
                    <th className="px-6 py-4 text-left text-[10px] font-medium text-black/30 uppercase tracking-widest">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map((appointment) => (
                    <tr key={appointment.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                      <td className="px-6 py-4 text-sm">{appointment.customer_name}</td>
                      <td className="px-6 py-4 text-sm text-black/60">{appointment.service_name}</td>
                      <td className="px-6 py-4 text-sm text-black/40">{appointment.appointment_time}</td>
                      <td className="px-6 py-4 text-sm font-medium">{appointment.service_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
