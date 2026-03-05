'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, DollarSign, LogOut, ChevronLeft, ChevronRight, Home, User } from 'lucide-react';
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
  const { logout } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'day' | 'week'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState<'schedule' | 'analytics' | 'crm'>('schedule');

  useEffect(() => {
    fetchAppointments();
  }, [currentDate, view]);

  const fetchAppointments = async () => {
    try {
      let url = '/api/appointments';
      if (view === 'day') {
        url += `?date=${format(currentDate, 'yyyy-MM-dd')}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setAppointments(data.appointments);
      }
    } catch {
      // silently handle - testing mode
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
    return Array.from({ length: 5 }, (_, i) => addDays(start, i));
  };

  const todayAppointments = getDayAppointments(new Date());
  const todayRevenue = todayAppointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + parseInt(a.service_price.replace('R', '')), 0);

  const tabs = [
    { id: 'schedule' as const, label: 'Master Schedule' },
    { id: 'analytics' as const, label: 'Analytics' },
    { id: 'crm' as const, label: 'Customer CRM' },
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
        <div className="max-w-7xl mx-auto px-6 flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`py-4 text-xs uppercase tracking-widest transition-colors border-b-2 ${
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
                  <DollarSign className="w-4 h-4 text-black/20" />
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
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 border-2 border-black/10 text-xs uppercase tracking-widest hover:bg-black/5 transition-colors"
                  >
                    Today
                  </button>
                  <button onClick={() => setCurrentDate(prev => addDays(prev, -1))} className="p-2 border-2 border-black/10 hover:bg-black/5 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-lg font-light min-w-[200px] text-center">
                    {format(currentDate, 'EEEE, MMMM d')}
                  </h2>
                  <button onClick={() => setCurrentDate(prev => addDays(prev, 1))} className="p-2 border-2 border-black/10 hover:bg-black/5 transition-colors">
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
                      apt => apt.appointment_time.startsWith(time.split(':')[0])
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
                              apt => apt.appointment_time.startsWith(time.split(':')[0])
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
        {selectedTab === 'crm' && <CRMTab />}
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?period=${period}`);
      const data = await response.json();
      if (response.ok) setAnalytics(data);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

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

function CRMTab() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      if (response.ok) setCustomers(data.customers);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async (userId: number, field: string, value: string) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, [field]: value })
      });
      if (response.ok) {
        toast.success('Customer updated');
        fetchCustomers();
      } else {
        toast.error('Failed to update customer');
      }
    } catch {
      toast.error('Failed to update customer');
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
    <div className="border-2 border-black/10">
      <div className="p-6 border-b border-black/10">
        <h2 className="text-xl font-light">Customer Database</h2>
        <p className="text-xs text-black/40 mt-1">{customers.length} total customers</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-black/10">
            <tr>
              <th className="text-left py-3 px-6 text-[10px] font-medium text-black/30 uppercase tracking-widest">Name</th>
              <th className="text-left py-3 px-6 text-[10px] font-medium text-black/30 uppercase tracking-widest">Phone</th>
              <th className="text-left py-3 px-6 text-[10px] font-medium text-black/30 uppercase tracking-widest">Visits</th>
              <th className="text-left py-3 px-6 text-[10px] font-medium text-black/30 uppercase tracking-widest">Last Visit</th>
              <th className="text-left py-3 px-6 text-[10px] font-medium text-black/30 uppercase tracking-widest">Preferences</th>
              <th className="text-left py-3 px-6 text-[10px] font-medium text-black/30 uppercase tracking-widest">Notes</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer: any) => (
              <tr key={customer.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                <td className="py-4 px-6 text-sm">{customer.name || 'N/A'}</td>
                <td className="py-4 px-6 text-sm text-black/40">{customer.phone}</td>
                <td className="py-4 px-6 text-sm text-black/60">{customer.total_appointments}</td>
                <td className="py-4 px-6 text-sm text-black/40">
                  {customer.last_visit ? format(new Date(customer.last_visit), 'MMM d, yyyy') : 'Never'}
                </td>
                <td className="py-4 px-6">
                  <input
                    type="text"
                    defaultValue={customer.preferences || ''}
                    onBlur={(e) => handleUpdateCustomer(customer.id, 'preferences', e.target.value)}
                    placeholder="e.g., #2 on sides"
                    className="text-sm bg-black/[0.03] border-2 border-black/10 text-black px-2 py-1 w-full placeholder:text-black/20 focus:border-accent focus:outline-none"
                  />
                </td>
                <td className="py-4 px-6">
                  <input
                    type="text"
                    defaultValue={customer.notes || ''}
                    onBlur={(e) => handleUpdateCustomer(customer.id, 'notes', e.target.value)}
                    placeholder="Add notes..."
                    className="text-sm bg-black/[0.03] border-2 border-black/10 text-black px-2 py-1 w-full placeholder:text-black/20 focus:border-accent focus:outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
