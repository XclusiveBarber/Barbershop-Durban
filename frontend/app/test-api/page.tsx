'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ApiResult = {
  endpoint: string;
  method: string;
  status: 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
};

export default function ApiTesterPage() {
  const [results, setResults] = useState<ApiResult[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (endpoint: string, method: string, status: 'loading' | 'success' | 'error', data?: any, error?: string) => {
    setResults((prev) => [...prev, { endpoint, method, status, data, error }]);
  };

  const testBarbers = async () => {
    addResult('/api/barbers', 'GET', 'loading');
    try {
      const res = await fetch('/api/barbers');
      const data = await res.json();
      if (res.ok) {
        addResult('/api/barbers', 'GET', 'success', data);
      } else {
        addResult('/api/barbers', 'GET', 'error', undefined, data.error);
      }
    } catch (error: any) {
      addResult('/api/barbers', 'GET', 'error', undefined, error.message);
    }
  };

  const testHaircuts = async () => {
    addResult('/api/haircuts', 'GET', 'loading');
    try {
      const res = await fetch('/api/haircuts');
      const data = await res.json();
      if (res.ok) {
        addResult('/api/haircuts', 'GET', 'success', data);
      } else {
        addResult('/api/haircuts', 'GET', 'error', undefined, data.error);
      }
    } catch (error: any) {
      addResult('/api/haircuts', 'GET', 'error', undefined, error.message);
    }
  };

  const testAvailability = async () => {
    const barberId = 'test-barber-id'; // Replace with actual barber ID
    const date = new Date().toISOString().split('T')[0];
    const url = `/api/availability?barber_id=${barberId}&date=${date}`;

    addResult('/api/availability', 'GET', 'loading');
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        addResult('/api/availability', 'GET', 'success', data);
      } else {
        addResult('/api/availability', 'GET', 'error', undefined, data.error);
      }
    } catch (error: any) {
      addResult('/api/availability', 'GET', 'error', undefined, error.message);
    }
  };

  const testCreateAppointment = async () => {
    const payload = {
      user_id: 'test-user-id',
      barber_id: 'test-barber-id',
      haircut_id: 'test-haircut-id',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '10:00',
      total_price: 100,
    };

    addResult('/api/appointments', 'POST', 'loading');
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        addResult('/api/appointments', 'POST', 'success', data);
      } else {
        addResult('/api/appointments', 'POST', 'error', undefined, data.error);
      }
    } catch (error: any) {
      addResult('/api/appointments', 'POST', 'error', undefined, error.message);
    }
  };

  const testGetAppointments = async () => {
    addResult('/api/appointments', 'GET', 'loading');
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (res.ok) {
        addResult('/api/appointments', 'GET', 'success', data);
      } else {
        addResult('/api/appointments', 'GET', 'error', undefined, data.error);
      }
    } catch (error: any) {
      addResult('/api/appointments', 'GET', 'error', undefined, error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800 rounded-lg p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2">API Tester</h1>
          <p className="text-slate-400 mb-6">Test Barbershop API endpoints</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={testBarbers}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Test: GET /api/barbers
            </button>
            <button
              onClick={testHaircuts}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Test: GET /api/haircuts
            </button>
            <button
              onClick={testAvailability}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Test: GET /api/availability
            </button>
            <button
              onClick={testGetAppointments}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Test: GET /api/appointments
            </button>
            <button
              onClick={testCreateAppointment}
              className="col-span-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Test: POST /api/appointments (Create)
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Results:</h2>
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`bg-slate-900 rounded-lg p-4 border-l-4 ${
                    result.status === 'loading'
                      ? 'border-yellow-500'
                      : result.status === 'success'
                      ? 'border-green-500'
                      : 'border-red-500'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm text-slate-400">{result.method}</span>
                    <span className="font-mono text-sm text-blue-400">{result.endpoint}</span>
                    <span
                      className={`text-xs font-semibold ${
                        result.status === 'loading'
                          ? 'text-yellow-400'
                          : result.status === 'success'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                  {result.data && (
                    <pre className="text-xs text-slate-300 overflow-auto bg-slate-800 p-3 rounded">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                  {result.error && (
                    <pre className="text-xs text-red-400 overflow-auto bg-slate-800 p-3 rounded">
                      Error: {result.error}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
