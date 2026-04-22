'use client';

import { useEffect, useState } from 'react';
import { Database, Wifi, WifiOff } from 'lucide-react';
import { checkHealth } from '@/lib/api';

export function StatusIndicator() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const ok = await checkHealth();
      setConnected(ok);
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
        connected === null
          ? 'bg-gray-100 text-txt-muted'
          : connected
          ? 'bg-green-50 text-status-success'
          : 'bg-red-50 text-status-error'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full status-dot ${
          connected === null ? 'bg-txt-muted' : connected ? 'bg-status-success text-status-success' : 'bg-status-error text-status-error'
        }`} />
        <span className="hidden sm:inline">
          {connected === null ? 'Перевірка...' : connected ? 'API' : 'Offline'}
        </span>
      </div>
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium ${
        connected ? 'bg-ugb-green-50 text-ugb-green-dark' : 'bg-gray-100 text-txt-muted'
      }`}>
        <Database className="w-3 h-3" />
        <span className="hidden sm:inline">PostgreSQL</span>
      </div>
    </div>
  );
}
