'use client';

import { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import { fetchRates, type RatesResponse } from '@/lib/api';

const FLAG: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  PLN: '🇵🇱',
  CHF: '🇨🇭',
};

export function RatesCard() {
  const [data, setData] = useState<RatesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const result = await fetchRates();
      setData(result);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-ugb-green-50 flex items-center justify-center">
            <Landmark className="w-3.5 h-3.5 text-ugb-green" />
          </div>
          <h3 className="text-sm font-semibold text-txt-primary">Курси НБУ</h3>
        </div>
        {data && (
          <span className="text-[10px] text-txt-muted font-mono">
            {new Date(data.fetchedAt).toLocaleDateString('uk-UA')}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-1.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-surface-bg animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <div className="space-y-1">
          {data.rates.map((rate) => (
            <div
              key={rate.cc}
              className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-surface-bg transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{FLAG[rate.cc] || ''}</span>
                <span className="font-mono text-xs font-semibold text-txt-primary">{rate.cc}</span>
              </div>
              <span className="font-mono text-sm font-bold text-ugb-navy tabular-nums">
                {rate.rate.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 border border-dashed border-surface-border rounded-lg">
          <p className="text-xs text-txt-muted">Очікування Node-RED...</p>
        </div>
      )}
    </div>
  );
}
