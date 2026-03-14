'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, LogOut, Home, User, CheckCircle, AlertCircle, X, Save, Settings } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth, type AuthUser } from '@/context/auth-context';
import { updateProfile, updateUserEmail } from '@/lib/supabase-auth';

interface Appointment {
  id: string;
  service_name: string;
  service_price: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  is_late: boolean;
  customer_name: string;
  customer_email: string | null;
  barber_name: string;
}

type Tab = 'today' | 'upcoming' | 'history' | 'settings';

export function BarberDashboard({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { logout, accessToken, updateUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('today');

  // Profile edit state
  const [editName, setEditName] = useState(user.name || '');
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    fetchAppointments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

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

  const handleMarkLate = async (appointmentId: string) => {
    setUpdating(appointmentId + 'late');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/appointments/${appointmentId}/late-arrival`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to mark late");
      }
      if (data.message.includes("penalty")) {
        toast.warning(data.message);
      } else {
        toast.success(data.message);
      }
      fetchAppointments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark late");
    } finally {
      setUpdating(null);
    }
  };

  const updateStatus = async (id: string, status: 'completed' | 'cancelled') => {
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
            : 'Appointment cancelled.'
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

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();

    if (!trimmedName) { toast.error('Name cannot be empty'); return; }
    if (!trimmedEmail) { toast.error('Email cannot be empty'); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) { toast.error('Please enter a valid email address'); return; }

    setSavingProfile(true);
    try {
      const updates: any = { name: trimmedName };

      if (trimmedEmail !== user.email) {
        try {
          await updateUserEmail(trimmedEmail);
          updates.email = trimmedEmail;
          setEmailVerificationSent(true);
          toast.success('Email updated! A verification link has been sent to your new email address.');
        } catch (emailError: any) {
          toast.error(emailError.message || 'Failed to update email');
          setSavingProfile(false);
          return;
        }
      }

      await updateProfile(user.id, updates);
      updateUser({ name: trimmedName });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // ─ Updated Tab filtering ──────────────────────────────────────────────────
  // Today should only count appointments that are still "active" (pending/confirmed/late)
  const todayAppts = appointments.filter(
    a => a.appointment_date === todayStr &&
      !['cancelled', 'completed', 'no-show'].includes(a.status) // Exclude finished ones
  );

  const upcomingAppts = appointments.filter(
    a => a.appointment_date > todayStr &&
      !['cancelled', 'completed', 'no-show'].includes(a.status)
  );

  // History should contain everything that is finished
  const historyAppts = appointments.filter(
    a => ['completed', 'cancelled', 'no-show'].includes(a.status) ||
      a.appointment_date < todayStr
  );

  const todayCompleted = todayAppts.filter(a => a.status === 'completed');
  const todayActive = todayAppts.filter(a => !['completed', 'cancelled', 'no-show'].includes(a.status));

  const tabList: { id: Tab; label: string; count: number; icon?: ReactNode }[] = [
    { id: 'today', label: "Today", count: todayAppts.length },
    { id: 'upcoming', label: 'Upcoming', count: upcomingAppts.length },
    { id: 'history', label: 'History', count: historyAppts.length },
    { id: 'settings', label: 'Settings', count: 0, icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  const activeList = tab === 'today' ? todayActive : tab === 'upcoming' ? upcomingAppts : [];
  const completedList = tab === 'today' ? todayCompleted : tab === 'history' ? historyAppts : [];

  // ─ Appointment card ─────────────────────────────────────────────────────

  const AppointmentCard = ({ appt }: { appt: Appointment }) => (
    <div
      className={`border-2 p-6 transition-colors ${
        appt.is_late
          ? 'border-orange-300 bg-orange-50'
          : 'border-black/10 hover:border-accent/30'
      }`}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-light">{appt.service_name}</h3>
          <p className="text-xs text-black/40 mt-1 flex items-center gap-2">
            {appt.customer_name}
            {appt.is_late && (
              <span className="px-1.5 py-0.5 text-[9px] uppercase tracking-widest font-semibold bg-red-100 text-red-600">
                LATE
              </span>
            )}
          </p>
          {!appt.customer_email && (
            <p className="text-[10px] text-black/30 italic mt-0.5">No email — notification skipped</p>
          )}
        </div>
        <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-medium ${
          appt.status === 'confirmed'
            ? 'bg-accent text-accent-foreground'
            : appt.is_late
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
          onClick={() => handleMarkLate(appt.id)}
          disabled={!!updating || appt.is_late}
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
        <button
          onClick={() => updateStatus(appt.id, 'cancelled')}
          disabled={!!updating || appt.status === 'cancelled'}
          className="flex-1 border-2 border-red-200 text-red-500 px-4 py-2 text-xs uppercase tracking-widest hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <X className="w-3 h-3" />
          {updating === appt.id + 'cancelled' ? 'Cancelling…' : 'Cancel'}
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
            <button
              onClick={() => setTab('settings')}
              className="hidden md:flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors font-semibold font-montserrat"
            >
              <User className="w-4 h-4" />
              {user.name}
            </button>
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
              {t.icon}
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
                      </tr>
                    </thead>
                    <tbody>
                      {completedList.map(appt => (
                        <tr key={appt.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                          <td className="px-6 py-4 text-sm">{appt.customer_name}</td>
                          <td className="px-6 py-4 text-sm text-black/60">{appt.service_name}</td>
                          <td className="px-6 py-4 text-sm text-black/40">{appt.appointment_time}</td>
                          <td className="px-6 py-4 text-sm font-medium">{appt.service_price}</td>
                        </tr>
                      ))}
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

        {/* Settings tab */}
        {tab === 'settings' && (
          <div className="max-w-lg space-y-10">
            <section>
              <span className="text-black/40 uppercase tracking-widest text-xs mb-6 block">Account Information</span>
              <div className="border-2 border-black/10 divide-y divide-black/5">
                {/* Name */}
                <div className="p-6">
                  <label className="text-[10px] uppercase tracking-widest text-black/40 font-medium block mb-3">
                    Display Name
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your full name"
                      className="flex-1 border-2 border-black/10 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors bg-white"
                    />
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile || editName.trim() === user.name}
                      className="px-5 py-2.5 bg-accent text-accent-foreground text-xs uppercase tracking-widest font-semibold font-montserrat hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingProfile ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div className="p-6">
                  <label className="text-[10px] uppercase tracking-widest text-black/40 font-medium block mb-3">
                    Email Address
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 border-2 border-black/10 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors bg-white"
                    />
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile || (editEmail.trim() === user.email && editName.trim() === user.name)}
                      className="px-5 py-2.5 bg-accent text-accent-foreground text-xs uppercase tracking-widest font-semibold font-montserrat hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingProfile ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                  {emailVerificationSent && (
                    <p className="text-[11px] text-accent mt-2">
                      ✓ Verification email sent. Check your inbox to confirm the change.
                    </p>
                  )}
                  <p className="text-[11px] text-black/30 mt-2">
                    Changing your email will require verification via a link sent to your new email address.
                  </p>
                </div>

                {/* Role */}
                <div className="p-6">
                  <label className="text-[10px] uppercase tracking-widest text-black/40 font-medium block mb-3">
                    Account Type
                  </label>
                  <span className="inline-block px-3 py-1 bg-black/5 text-black/50 text-[10px] uppercase tracking-widest font-medium">
                    {user.role}
                  </span>
                </div>
              </div>
            </section>

            <section>
              <span className="text-black/40 uppercase tracking-widest text-xs mb-6 block">Session</span>
              <div className="border-2 border-black/10 p-6">
                <p className="text-sm text-black/60 mb-4">Sign out of your account on this device.</p>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 border-2 border-black/10 text-black/50 px-6 py-2.5 text-xs uppercase tracking-widest font-semibold font-montserrat hover:border-black/30 hover:text-black transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </section>
          </div>
        )}

      </div>
    </div>
  );
}
