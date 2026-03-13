'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, X, Edit2, LogOut, Plus, Home, User, Save, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth, type AuthUser } from '@/context/auth-context';
import { updateProfile } from '@/lib/supabase-auth';

// Shape returned by GET /api/appointments
interface AppointmentRow {
  id: number;
  appointment_date: string;
  time_slot: string;
  status: string;
  total_price: number | null;
  payment_status: string;
  created_at: string;
  haircuts: { name: string; price: number; duration_minutes?: number } | null;
  barbers:  { full_name: string } | null;
}

type ActiveTab = 'appointments' | 'profile';

export function CustomerDashboard({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { logout, accessToken, updateUser } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('appointments');

  // Profile edit state
  const [editName, setEditName] = useState(user.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

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

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast.error('Name cannot be empty');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfile(user.id, { name: trimmedName });
      updateUser({ name: trimmedName });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
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
        <div className="mb-10">
          <span className="text-black/40 uppercase tracking-widest text-xs mb-4 block">My Account</span>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <h1 className="text-4xl md:text-5xl font-light tracking-tight">
              {activeTab === 'appointments' ? 'Your Appointments' : 'Account Settings'}
            </h1>
            {activeTab === 'appointments' && (
              <button
                onClick={() => router.push('/services')}
                className="bg-accent text-accent-foreground px-8 py-4 font-semibold hover:opacity-90 transition-all flex items-center gap-3 w-fit font-montserrat"
              >
                <Plus className="w-4 h-4" />
                Book New Appointment
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b-2 border-black/10 mb-10">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest font-semibold font-montserrat border-b-2 -mb-[2px] transition-colors ${
              activeTab === 'appointments'
                ? 'border-black text-black'
                : 'border-transparent text-black/40 hover:text-black/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Appointments
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-widest font-semibold font-montserrat border-b-2 -mb-[2px] transition-colors ${
              activeTab === 'profile'
                ? 'border-black text-black'
                : 'border-transparent text-black/40 hover:text-black/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Profile
          </button>
        </div>

        {/* ── Appointments Tab ─────────────────────────────────────── */}
        {activeTab === 'appointments' && (
          <>
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
                              {appt.haircuts?.duration_minutes && (
                                <span className="text-black/40 text-xs">
                                  — {appt.haircuts.duration_minutes} min
                                </span>
                              )}
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
          </>
        )}

        {/* ── Profile Tab ──────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="max-w-lg space-y-10">
            {/* Account Info */}
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

                {/* Email — read-only */}
                <div className="p-6">
                  <label className="text-[10px] uppercase tracking-widest text-black/40 font-medium block mb-3">
                    Email Address
                  </label>
                  <p className="text-sm text-black/70">{user.email}</p>
                  <p className="text-[11px] text-black/30 mt-1">
                    Email is managed through your sign-in provider and cannot be changed here.
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

            {/* Danger Zone */}
            <section>
              <span className="text-black/40 uppercase tracking-widest text-xs mb-6 block">Session</span>
              <div className="border-2 border-black/10 p-6">
                <p className="text-sm text-black/60 mb-4">
                  Sign out of your account on this device.
                </p>
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
