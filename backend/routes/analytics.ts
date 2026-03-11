import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { subDays, subWeeks, subMonths, subYears, format } from 'date-fns';

const router = Router();

// GET /api/analytics - Dashboard analytics
router.get('/', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'week';

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':   startDate = subDays(now, 1);    break;
      case 'week':  startDate = subWeeks(now, 1);   break;
      case 'month': startDate = subMonths(now, 1);  break;
      case 'year':  startDate = subYears(now, 1);   break;
      default:      startDate = subWeeks(now, 1);
    }

    const startStr = format(startDate, 'yyyy-MM-dd');
    const endStr   = format(now, 'yyyy-MM-dd');

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        status,
        total_price,
        user_id,
        appointment_date,
        haircuts ( name, price ),
        barbers ( full_name )
      `)
      .gte('appointment_date', startStr)
      .lte('appointment_date', endStr);

    if (error) {
      console.error('[analytics] Supabase error:', error.message);
      return res.status(500).json({ error: error.message });
    }

    const appts = appointments ?? [];
    const completed  = appts.filter((a: any) => a.status === 'completed');
    const cancelled  = appts.filter((a: any) => a.status === 'cancelled');

    const totalRevenue = completed.reduce((sum: number, a: any) => {
      const price = a.total_price ?? (a.haircuts as any)?.price ?? 0;
      return sum + Number(price);
    }, 0);

    // Popular services
    const serviceMap: Record<string, number> = {};
    appts.forEach((a: any) => {
      const name = (a.haircuts as any)?.name ?? 'Unknown';
      serviceMap[name] = (serviceMap[name] || 0) + 1;
    });
    const popular_services = Object.entries(serviceMap)
      .map(([service_name, bookings]) => ({ service_name, bookings }))
      .sort((a, b) => b.bookings - a.bookings);

    // Barber stats
    const barberMap: Record<string, { appointments: number; revenue: number }> = {};
    appts.forEach((a: any) => {
      const name = (a.barbers as any)?.full_name ?? 'Unassigned';
      if (!barberMap[name]) barberMap[name] = { appointments: 0, revenue: 0 };
      barberMap[name].appointments++;
      if (a.status === 'completed') {
        barberMap[name].revenue += Number(a.total_price ?? (a.haircuts as any)?.price ?? 0);
      }
    });
    const barber_stats = Object.entries(barberMap).map(([barber_name, stats]) => ({
      barber_name,
      total_appointments: stats.appointments,
      revenue: stats.revenue,
    }));

    // Customer metrics
    const uniqueCustomers = new Set(appts.map((a: any) => a.user_id)).size;
    const cancellationRate = appts.length > 0
      ? ((cancelled.length / appts.length) * 100).toFixed(1)
      : '0';

    return res.json({
      period,
      dateRange: { start: startStr, end: endStr },
      revenue: {
        total: totalRevenue,
        completed_appointments: completed.length,
        by_service: popular_services,
      },
      popular_services,
      barber_stats,
      daily_breakdown: [],
      customer_metrics: {
        unique_customers: uniqueCustomers,
        total_bookings: appts.length,
        avg_bookings_per_customer: uniqueCustomers > 0
          ? (appts.length / uniqueCustomers).toFixed(1)
          : '0',
      },
      cancellation_rate: cancellationRate,
    });
  } catch (error) {
    console.error('[analytics] Unexpected error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
