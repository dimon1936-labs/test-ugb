'use client';

import { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import { fetchRates, type RatesResponse } from '@/lib/api';

const CURRENCY_INFO: Record<string, { symbol: string; color: string; bg: string }> = {
  USD: { symbol: '$', color: 'text-green-700', bg: 'bg-green-100' },
  EUR: { symbol: '\u20AC', color: 'text-blue-700', bg: 'bg-blue-100' },
  GBP: { symbol: '\u00A3', color: 'text-purple-700', bg: 'bg-purple-100' },
  PLN: { symbol: 'z\u0142', color: 'text-red-700', bg: 'bg-red-100' },
  CHF: { symbol: 'Fr', color: 'text-orange-700', bg: 'bg-orange-100' },
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
          {data.rates.map((rate) => {
            const info = CURRENCY_INFO[rate.cc] || { symbol: rate.cc, color: 'text-gray-700', bg: 'bg-gray-100' };
            return (
              <div
                key={rate.cc}
                className="flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-surface-bg transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full ${info.bg} flex items-center justify-center`}>
                    <span className={`text-xs font-bold ${info.color}`}>{info.symbol}</span>
                  </div>
                  <div>
                    <span className="font-mono text-xs font-semibold text-txt-primary">{rate.cc}</span>
                    <div className="text-[10px] text-txt-muted leading-tight">{rate.txt}</div>
                  </div>
                </div>
                <span className="font-mono text-sm font-bold text-ugb-navy tabular-nums">
                  {rate.rate.toFixed(4)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4 border border-dashed border-surface-border rounded-lg">
          <p className="text-xs text-txt-muted">Очікування Node-RED...</p>
        </div>
      )}
    </div>
  );
}
