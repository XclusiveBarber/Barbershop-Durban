'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, LogOut, Home, User, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth, type AuthUser } from '@/context/auth-context';
import { calcBarberBreakdown, parsePrice, formatRand } from '@/lib/barber-calculations';

interface Appointment {
  id: string;
  service_name: string;
  service_price: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  customer_name: string;
  customer_email: string | null;
  barber_name: string;
}

type Tab = 'today' | 'upcoming' | 'history';

export function BarberDashboard({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { logout, accessToken } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('today');

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
      const response = await fetch('/api/appointments/all', { headers });
      const data = await response.json();
      if (response.ok) setAppointments(Array.isArray(data) ? data : (data.appointments ?? []));
      else toast.error('Failed to load appointments');
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'late' | 'completed') => {
    setUpdating(id + status);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        toast.success(
          status === 'completed'
            ? 'Appointment completed. Receipt email sent.'
            : 'Customer marked as late. Notification sent.'
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

  // ─ Tab filtering ────────────────────────────────────────────────────────

  const todayAppts = appointments.filter(
    a => a.appointment_date === todayStr && a.status !== 'cancelled'
  );
  const upcomingAppts = appointments.filter(
    a => a.appointment_date > todayStr && !['cancelled', 'completed'].includes(a.status)
  );
  const historyAppts = appointments.filter(
    a => a.status === 'completed' || (a.appointment_date < todayStr && a.status !== 'cancelled')
  );

  const todayCompleted = todayAppts.filter(a => a.status === 'completed');
  const todayActive = todayAppts.filter(a => !['completed', 'cancelled'].includes(a.status));

  const totalRevenue = todayCompleted.reduce((sum, a) => sum + parsePrice(a.service_price), 0);
  const { barberEarnings, shopRevenue } = calcBarberBreakdown(totalRevenue);

  const tabList: { id: Tab; label: string; count: number }[] = [
    { id: 'today', label: "Today", count: todayAppts.length },
    { id: 'upcoming', label: 'Upcoming', count: upcomingAppts.length },
    { id: 'history', label: 'History', count: historyAppts.length },
  ];

  const activeList = tab === 'today' ? todayActive : tab === 'upcoming' ? upcomingAppts : [];
  const completedList = tab === 'today' ? todayCompleted : tab === 'history' ? historyAppts : [];

  // ─ Appointment card ─────────────────────────────────────────────────────

  const AppointmentCard = ({ appt }: { appt: Appointment }) => (
    <div
      className={`border-2 p-6 transition-colors ${
        appt.status === 'late'
          ? 'border-orange-300 bg-orange-50'
          : 'border-black/10 hover:border-accent/30'
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-light">{appt.service_name}</h3>
          <p className="text-xs text-black/40 mt-1">{appt.customer_name}</p>
          {!appt.customer_email && (
            <p className="text-[10px] text-black/30 italic mt-0.5">No email — notification skipped</p>
          )}
        </div>
        <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-medium ${
          appt.status === 'confirmed'
            ? 'bg-accent text-accent-foreground'
            : appt.status === 'late'
            ? 'bg-orange-100 text-orange-600'
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
          {appt.appointment_time}
        </div>
        <div className="text-sm font-medium">{appt.service_price}</div>
      </div>

      <div className="flex gap-3 pt-6 border-t border-black/5">
        <button
          onClick={() => updateStatus(appt.id, 'late')}
          disabled={!!updating || appt.status === 'late'}
          className="flex-1 border-2 border-orange-200 text-orange-500 px-4 py-2 text-xs uppercase tracking-widest hover:bg-orange-50 hover:border-orange-300 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <AlertCircle className="w-3 h-3" />
          {updating === appt.id + 'late' ? 'Marking…' : 'Mark Late'}
        </button>
        <button
          onClick={() => updateStatus(appt.id, 'completed')}
          disabled={!!updating}
          className="flex-1 bg-accent text-accent-foreground px-4 py-2 text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCircle className="w-3 h-3" />
          {updating === appt.id + 'completed' ? 'Completing…' : 'Complete'}
        </button>
      </div>
    </div>
  );

  // ─ Render ────────────────────────────────────────────────────────────────

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

      {/* Tabs */}
      <div className="border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 flex gap-8">
          {tabList.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-4 text-xs uppercase tracking-widest transition-colors border-b-2 flex items-center gap-2 ${
                tab === t.id
                  ? 'border-accent text-black'
                  : 'border-transparent text-black/30 hover:text-black/60'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? 'bg-accent text-accent-foreground' : 'bg-black/10 text-black/40'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Today's earnings summary */}
        {tab === 'today' && totalRevenue > 0 && (
          <div className="mb-8 border-2 border-black/10 p-6 grid grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-black/30 mb-1 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Total Revenue
              </p>
              <p className="text-2xl font-light">{formatRand(totalRevenue)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-black/30 mb-1">Your Earnings (65%)</p>
              <p className="text-2xl font-light text-black">{formatRand(barberEarnings)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-black/30 mb-1">Shop Revenue (35%)</p>
              <p className="text-2xl font-light text-black/50">{formatRand(shopRevenue)}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-24">
            <div className="inline-block w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin" />
            <p className="mt-6 text-black/40 text-sm">Loading appointments...</p>
          </div>
        ) : (
          <div className="space-y-12">

            {/* Active cards (today + upcoming) */}
            {(tab === 'today' || tab === 'upcoming') && (
              <section>
                {tab === 'today' && (
                  <span className="text-black/40 uppercase tracking-widest text-xs mb-6 block">
                    Active — {format(new Date(), 'EEEE, MMMM d')}
                  </span>
                )}
                {activeList.length === 0 ? (
                  <div className="border-2 border-black/10 p-16 text-center">
                    <Calendar className="w-12 h-12 text-black/15 mx-auto mb-6" />
                    <p className="text-black/40 text-sm">
                      {tab === 'today' ? 'No active appointments today' : 'No upcoming appointments'}
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {activeList.map(appt => <AppointmentCard key={appt.id} appt={appt} />)}
                  </div>
                )}
              </section>
            )}

            {/* Completed table (today only) */}
            {tab === 'today' && completedList.length > 0 && (
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
                        <th className="px-6 py-4 text-left text-[10px] font-medium text-black/30 uppercase tracking-widest">Your Earnings (65%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedList.map(appt => {
                        const price = parsePrice(appt.service_price);
                        const { barberEarnings: earnings } = calcBarberBreakdown(price);
                        return (
                          <tr key={appt.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                            <td className="px-6 py-4 text-sm">{appt.customer_name}</td>
                            <td className="px-6 py-4 text-sm text-black/60">{appt.service_name}</td>
                            <td className="px-6 py-4 text-sm text-black/40">{appt.appointment_time}</td>
                            <td className="px-6 py-4 text-sm font-medium">{appt.service_price}</td>
                            <td className="px-6 py-4 text-sm font-semibold">{formatRand(earnings)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* History table */}
            {tab === 'history' && (
              <section>
                <span className="text-black/40 uppercase tracking-widest text-xs mb-6 block">Appointment History</span>
                {historyAppts.length === 0 ? (
                  <div className="border-2 border-black/10 p-16 text-center">
                    <p className="text-black/40 text-sm">No history yet</p>
                  </div>
                ) : (
                  <div className="border-2 border-black/10 overflow-hidden">
                    <table className="w-full">
                      <thead className="border-b border-black/10">
                        <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-medium text-black/30 uppercase tracking-widest">Customer</th>
                          <th className="px-6 py-4 text-left text-[10px] font-medium text-black/30 uppercase tracking-widest">Service</th>
                          <th className="px-6 py-4 text-left text-[10px] font-medium text-black/30 uppercase tracking-widest">Date</th>
                          <th className="px-6 py-4 text-left text-[10px] font-medium text-black/30 uppercase tracking-widest">Price</th>
                          <th className="px-6 py-4 text-left text-[10px] font-medium text-black/30 uppercase tracking-widest">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyAppts.map(appt => (
                          <tr key={appt.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                            <td className="px-6 py-4 text-sm">{appt.customer_name}</td>
                            <td className="px-6 py-4 text-sm text-black/60">{appt.service_name}</td>
                            <td className="px-6 py-4 text-sm text-black/40">
                              {format(new Date(appt.appointment_date), 'MMM d, yyyy')}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">{appt.service_price}</td>
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
                )}
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
