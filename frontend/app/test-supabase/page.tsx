'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SupabaseTestPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string, success: boolean = true) => {
    const icon = success ? '✅' : '❌';
    setResults((prev) => [...prev, `${icon} ${message}`]);
  };

  const testConnection = async () => {
    setResults([]);
    setLoading(true);

    try {
      addResult('Starting Supabase tests...');

      // Test 1: Connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        addResult(`Connection failed: ${error.message}`, false);
      } else {
        addResult('✅ Connected to Supabase successfully');
      }

      // Test 2: Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        addResult('No authenticated user (expected if not logged in)');
      } else if (userData.user) {
        addResult(`Authenticated as: ${userData.user.email}`);
      } else {
        addResult('No user authenticated');
      }

      // Test 3: Health check
      addResult('All tests completed!');
    } catch (error: any) {
      addResult(`Unexpected error: ${error.message}`, false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800 rounded-lg p-8 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2">Supabase Connection Tester</h1>
          <p className="text-slate-400 mb-6">Test your Supabase integration</p>

          <button
            onClick={testConnection}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition mb-6"
          >
            {loading ? 'Testing...' : 'Run Tests'}
          </button>

          {results.length > 0 && (
            <div className="bg-slate-900 rounded-lg p-6 font-mono text-sm space-y-2">
              <h2 className="text-green-400 font-bold mb-4">Results:</h2>
              {results.map((result, idx) => (
                <div key={idx} className={result.includes('❌') ? 'text-red-400' : 'text-green-400'}>
                  {result}
                </div>
              ))}
            </div>
          )}

          {!results.length && !loading && (
            <div className="text-slate-500 text-center py-8">
              Click "Run Tests" to check your Supabase connection
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
