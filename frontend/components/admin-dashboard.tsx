'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, Banknote, LogOut, ChevronLeft, ChevronRight, Home, User, Scissors, Plus, Pencil, Trash2 } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth, type AuthUser } from '@/context/auth-context';

interface Appointment {
  id: number;
  service_name: string;
  service_price: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  barber_name: string;
  customer_name: string;
  customer_phone: string;
}

export function AdminDashboard({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { logout, accessToken } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'day' | 'week'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState<'schedule' | 'analytics' | 'services'>('schedule');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
      const response = await fetch('/api/appointments/all', { headers });
      const data = await response.json();
      if (response.ok) {
        setAppointments(Array.isArray(data) ? data : (data.appointments ?? []));
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // Fetch on mount, tab switch, and periodically to keep data fresh
  useEffect(() => {
    if (selectedTab === 'schedule') {
      fetchAppointments();
    }
  }, [selectedTab, fetchAppointments]);

  // Auto-refresh every 30 seconds when on schedule tab
  useEffect(() => {
    if (selectedTab !== 'schedule') return;
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, [selectedTab, fetchAppointments]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        toast.success('Appointment updated');
        fetchAppointments();
      } else {
        toast.error('Failed to update appointment');
      }
    } catch {
      toast.error('Failed to update appointment');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const hour = i + 9;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const getDayAppointments = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(apt => apt.appointment_date === dateStr);
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const todayAppointments = getDayAppointments(new Date());
  const todayRevenue = todayAppointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + parseInt(a.service_price.replace('R', '') || '0'), 0);

  const tabs = [
    { id: 'schedule' as const, label: 'Master Schedule' },
    { id: 'analytics' as const, label: 'Analytics' },
    { id: 'services' as const, label: 'Services' },
  ];

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
              Admin
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
        <div className="max-w-7xl mx-auto px-6 flex gap-0 md:gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex-1 md:flex-none py-4 text-xs uppercase tracking-widest transition-colors border-b-2 ${
                selectedTab === tab.id
                  ? 'border-accent text-black'
                  : 'border-transparent text-black/30 hover:text-black/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {selectedTab === 'schedule' && (
          <>
            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="border-2 border-black/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs uppercase tracking-widest text-black/40">{"Today's Appointments"}</h3>
                  <CalendarIcon className="w-4 h-4 text-black/20" />
                </div>
                <p className="text-3xl font-light">{todayAppointments.length}</p>
              </div>
              <div className="border-2 border-black/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs uppercase tracking-widest text-black/40">{"Today's Revenue"}</h3>
                  <Banknote className="w-4 h-4 text-black/20" />
                </div>
                <p className="text-3xl font-light">R{todayRevenue}</p>
              </div>
              <div className="border-2 border-black/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs uppercase tracking-widest text-black/40">Pending</h3>
                  <Clock className="w-4 h-4 text-black/20" />
                </div>
                <p className="text-3xl font-light">
                  {todayAppointments.filter(a => a.status === 'pending').length}
                </p>
              </div>
            </div>

            {/* Schedule */}
            <div className="border-2 border-black/10 p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 md:px-4 py-2 border-2 border-black/10 text-xs uppercase tracking-widest hover:bg-black/5 transition-colors whitespace-nowrap"
                  >
                    Today
                  </button>
                  <button onClick={() => setCurrentDate(prev => addDays(prev, -1))} className="p-2 border-2 border-black/10 hover:bg-black/5 transition-colors flex-shrink-0">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-base md:text-lg font-light flex-1 md:flex-initial text-center md:min-w-[200px] truncate">
                    {format(currentDate, 'EEEE, MMMM d')}
                  </h2>
                  <button onClick={() => setCurrentDate(prev => addDays(prev, 1))} className="p-2 border-2 border-black/10 hover:bg-black/5 transition-colors flex-shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  {(['day', 'week'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`px-4 py-2 text-xs uppercase tracking-widest transition-colors ${
                        view === v ? 'bg-accent text-accent-foreground' : 'border-2 border-black/10 hover:bg-black/5'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                </div>
              ) : view === 'day' ? (
                <div className="space-y-1">
                  {timeSlots.map((time) => {
                    const slotAppointments = getDayAppointments(currentDate).filter(
                      apt => (apt.appointment_time ?? '').startsWith(time.split(':')[0])
                    );
                    return (
                      <div key={time} className="flex gap-4 border-b border-black/5 py-3">
                        <div className="w-20 text-sm text-black/30 font-medium pt-1">{time}</div>
                        <div className="flex-1 space-y-2">
                          {slotAppointments.length === 0 ? (
                            <div className="text-xs text-black/15 italic py-1">Open</div>
                          ) : (
                            slotAppointments.map((apt) => (
                              <div key={apt.id} className="bg-black/[0.03] border-2 border-black/10 p-4">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium text-sm">{apt.service_name}</h4>
                                    <p className="text-xs text-black/40 mt-1">
                                      {apt.customer_name} &middot; {apt.customer_phone}
                                    </p>
                                    <p className="text-xs text-black/40">with {apt.barber_name}</p>
                                    <p className="text-xs font-medium text-black/60 mt-1">{apt.service_price}</p>
                                  </div>
                                  <select
                                    value={apt.status}
                                    onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                                    className="text-xs bg-white border-2 border-black/10 text-black px-2 py-1 focus:border-accent focus:outline-none"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-black/10">
                        <th className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-black/30">Time</th>
                        {getWeekDays().map((day) => (
                          <th key={day.toISOString()} className="text-center py-3 px-4 text-[10px] uppercase tracking-widest text-black/30">
                            <div>{format(day, 'EEE')}</div>
                            <div className="text-black/20">{format(day, 'MMM d')}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((time) => (
                        <tr key={time} className="border-b border-black/5">
                          <td className="py-2 px-4 text-xs text-black/30">{time}</td>
                          {getWeekDays().map((day) => {
                            const dayApts = getDayAppointments(day).filter(
                              apt => (apt.appointment_time ?? '').startsWith(time.split(':')[0])
                            );
                            return (
                              <td key={day.toISOString()} className="py-2 px-4">
                                {dayApts.map((apt) => (
                                  <div key={apt.id} className="bg-accent/10 text-black text-[10px] p-2 mb-1 border border-accent/20">
                                    <div className="font-medium truncate">{apt.customer_name}</div>
                                    <div className="truncate text-black/40">{apt.service_name}</div>
                                  </div>
                                ))}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {selectedTab === 'analytics' && <AnalyticsTab />}
        {selectedTab === 'services' && <ServicesTab />}
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const { accessToken } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
      const response = await fetch(`/api/analytics?period=${period}`, { headers });
      const data = await response.json();
      if (response.ok) setAnalytics(data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [period, accessToken]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return <div className="border-2 border-black/10 p-6"><p className="text-black/40">No analytics data yet</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Period */}
      <div className="flex gap-2">
        {['day', 'week', 'month', 'year'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 text-xs uppercase tracking-widest transition-colors capitalize ${
              period === p ? 'bg-accent text-accent-foreground' : 'border-2 border-black/10 hover:bg-black/5'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="border-2 border-black/10 p-6">
          <h3 className="text-xs uppercase tracking-widest text-black/40 mb-2">Revenue</h3>
          <p className="text-3xl font-light">R{analytics.revenue.total}</p>
        </div>
        <div className="border-2 border-black/10 p-6">
          <h3 className="text-xs uppercase tracking-widest text-black/40 mb-2">Completed</h3>
          <p className="text-3xl font-light">{analytics.revenue.completed_appointments}</p>
        </div>
        <div className="border-2 border-black/10 p-6">
          <h3 className="text-xs uppercase tracking-widest text-black/40 mb-2">Unique Customers</h3>
          <p className="text-3xl font-light">{analytics.customer_metrics.unique_customers}</p>
        </div>
        <div className="border-2 border-black/10 p-6">
          <h3 className="text-xs uppercase tracking-widest text-black/40 mb-2">Cancel Rate</h3>
          <p className="text-3xl font-light">{analytics.cancellation_rate}%</p>
        </div>
      </div>

      {/* Popular Services */}
      <div className="border-2 border-black/10 p-6">
        <h3 className="text-xs uppercase tracking-widest text-black/40 mb-6">Most Popular Services</h3>
        <div className="space-y-4">
          {analytics.popular_services.map((service: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between border-b border-black/5 pb-4">
              <div>
                <p className="text-sm font-medium">{service.service_name}</p>
                <p className="text-xs text-black/40">{service.bookings} bookings</p>
              </div>
              <div className="w-32 bg-black/5 h-1.5">
                <div
                  className="bg-accent h-1.5"
                  style={{ width: `${(service.bookings / (analytics.popular_services[0]?.bookings || 1)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Barber Performance */}
      <div className="border-2 border-black/10 p-6">
        <h3 className="text-xs uppercase tracking-widest text-black/40 mb-6">Barber Performance</h3>
        <table className="w-full">
          <thead className="border-b border-black/10">
            <tr>
              <th className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-black/30">Barber</th>
              <th className="text-right py-3 px-4 text-[10px] uppercase tracking-widest text-black/30">Appointments</th>
              <th className="text-right py-3 px-4 text-[10px] uppercase tracking-widest text-black/30">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {analytics.barber_stats.map((barber: any, idx: number) => (
              <tr key={idx} className="border-b border-black/5">
                <td className="py-3 px-4 text-sm">{barber.barber_name}</td>
                <td className="py-3 px-4 text-right text-sm text-black/60">{barber.total_appointments}</td>
                <td className="py-3 px-4 text-right text-sm font-medium">R{barber.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Services Tab ──────────────────────────────────────────────────────────────

interface Haircut {
  id: string;
  name: string;
  price: number;
  description: string | null;
}

function ServicesTab() {
  const { accessToken } = useAuth();
  const [haircuts, setHaircuts] = useState<Haircut[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchHaircuts();
  }, []);

  const fetchHaircuts = async () => {
    try {
      const res = await fetch('/api/haircuts');
      const data = await res.json();
      if (res.ok) setHaircuts(Array.isArray(data) ? data : (data.haircuts ?? []));
    } catch {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrice.trim()) {
      toast.error('Name and price are required');
      return;
    }
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Price must be a valid number');
      return;
    }
    setSaving(true);
    try {
      const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) authHeaders['Authorization'] = `Bearer ${accessToken}`;
      const res = await fetch('/api/haircuts', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ name: newName.trim(), price, description: newDesc.trim() || null }),
      });
      if (res.ok) {
        toast.success('Service added');
        setNewName('');
        setNewPrice('');
        setNewDesc('');
        setShowForm(false);
        fetchHaircuts();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add service');
      }
    } catch {
      toast.error('Failed to add service');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (haircut: Haircut) => {
    setEditingId(String(haircut.id));
    setEditName(haircut.name);
    setEditPrice(String(haircut.price));
    setEditDesc(haircut.description || '');
    setShowForm(false); // close add form if open
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPrice('');
    setEditDesc('');
  };

  const handleEditService = async (id: string) => {
    if (!editName.trim() || !editPrice.trim()) {
      toast.error('Name and price are required');
      return;
    }
    const price = parseFloat(editPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Price must be a valid number');
      return;
    }
    setUpdating(true);
    try {
      const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) authHeaders['Authorization'] = `Bearer ${accessToken}`;
      const res = await fetch(`/api/haircuts/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ name: editName.trim(), price, description: editDesc.trim() || null }),
      });
      if (res.ok) {
        toast.success('Service updated');
        cancelEdit();
        fetchHaircuts();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to update service');
      }
    } catch {
      toast.error('Failed to update service');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    setUpdating(true);
    try {
      const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) authHeaders['Authorization'] = `Bearer ${accessToken}`;
      const res = await fetch(`/api/haircuts/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (res.ok) {
        toast.success('Service deleted');
        fetchHaircuts();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to delete service');
      }
    } catch {
      toast.error('Failed to delete service');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-2 border-black/10 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-light">Services</h2>
          <p className="text-xs text-black/40 mt-1">{haircuts.length} services available</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); cancelEdit(); }}
          className="flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 text-xs uppercase tracking-widest hover:opacity-90 transition-all font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Service
        </button>
      </div>

      {/* Add service form */}
      {showForm && (
        <div className="border-2 border-accent/30 p-6 bg-accent/5">
          <h3 className="text-sm font-medium mb-4 uppercase tracking-widest text-black/60">New Service</h3>
          <form onSubmit={handleAddService} className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-black/40">Service Name *</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Skin Fade"
                className="w-full px-3 py-2.5 border-2 border-black/10 text-sm focus:border-black focus:outline-none bg-white text-black"
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-black/40">Price (R) *</label>
              <input
                type="number"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                placeholder="e.g. 150"
                min="0"
                step="0.01"
                className="w-full px-3 py-2.5 border-2 border-black/10 text-sm focus:border-black focus:outline-none bg-white text-black"
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-black/40">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Optional description"
                className="w-full px-3 py-2.5 border-2 border-black/10 text-sm focus:border-black focus:outline-none bg-white text-black"
                disabled={saving}
              />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-accent text-accent-foreground px-6 py-2 text-xs uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? 'Adding…' : 'Add Service'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border-2 border-black/10 px-6 py-2 text-xs uppercase tracking-widest hover:bg-black/5 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services list */}
      <div className="border-2 border-black/10 overflow-x-auto">
        {haircuts.length === 0 ? (
          <div className="p-16 text-center">
            <Scissors className="w-12 h-12 text-black/15 mx-auto mb-6" />
            <p className="text-black/40 text-sm">No services yet. Add your first service above.</p>
          </div>
        ) : (
          <table className="w-full min-w-max">
            <thead className="border-b border-black/10">
              <tr>
                <th className="text-left py-4 px-6 text-[10px] font-medium text-black/30 uppercase tracking-widest">Service</th>
                <th className="text-left py-4 px-6 text-[10px] font-medium text-black/30 uppercase tracking-widest">Description</th>
                <th className="text-right py-4 px-6 text-[10px] font-medium text-black/30 uppercase tracking-widest">Price</th>
              </tr>
            </thead>
            <tbody>
              {haircuts.map(haircut => (
                <tr key={haircut.id} className="border-b border-black/5">
                  {editingId === String(haircut.id) ? (
                    <td colSpan={3} className="py-4 px-6">
                      <div className="flex flex-wrap gap-3 items-end">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-black/40">Name *</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="px-3 py-2 border-2 border-black/10 text-sm focus:border-black focus:outline-none bg-white text-black w-48"
                            disabled={updating}
                            autoFocus
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-widest text-black/40">Price (R) *</label>
                          <input
                            type="number"
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value)}
                            min="0"
                            step="0.01"
                            className="px-3 py-2 border-2 border-black/10 text-sm focus:border-black focus:outline-none bg-white text-black w-28"
                            disabled={updating}
                          />
                        </div>
                        <div className="space-y-1 flex-1 min-w-[8rem]">
                          <label className="text-[10px] uppercase tracking-widest text-black/40">Description</label>
                          <input
                            type="text"
                            value={editDesc}
                            onChange={e => setEditDesc(e.target.value)}
                            className="w-full px-3 py-2 border-2 border-black/10 text-sm focus:border-black focus:outline-none bg-white text-black"
                            disabled={updating}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditService(String(haircut.id))}
                            disabled={updating}
                            className="bg-accent text-accent-foreground px-4 py-2 text-xs uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
                          >
                            {updating ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="border-2 border-black/10 px-4 py-2 text-xs uppercase tracking-widest hover:bg-black/5 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Scissors className="w-4 h-4 text-black/20" />
                          <span className="text-sm font-medium">{haircut.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-black/40">
                        {haircut.description || <span className="italic text-black/20">No description</span>}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-medium">R{haircut.price}</span>
                          <button
                            onClick={() => startEdit(haircut)}
                            className="p-1.5 text-black/30 hover:text-black hover:bg-black/5 transition-colors rounded"
                            title="Edit service"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(String(haircut.id), haircut.name)}
                            disabled={updating}
                            className="p-1.5 text-black/30 hover:text-red-600 hover:bg-red-50 transition-colors rounded disabled:opacity-50"
                            title="Delete service"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
