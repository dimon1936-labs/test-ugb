'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Hash, Banknote, RefreshCw } from 'lucide-react';
import { fetchLatestReport, type Report } from '@/lib/api';

export function ReportCard() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchLatestReport();
      setReport(data);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-4 sm:p-5 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      label: 'Транзакцій',
      value: report ? report.totalTransactions.toLocaleString('uk-UA') : '0',
      Icon: Hash,
      color: 'text-ugb-navy',
      bg: 'bg-ugb-navy-light',
    },
    {
      label: 'Обсяг',
      value: report
        ? report.totalVolume >= 1000
          ? (report.totalVolume / 1000).toFixed(1) + 'K'
          : report.totalVolume.toLocaleString('uk-UA')
        : '0',
      suffix: report?.currency || 'UAH',
      Icon: Banknote,
      color: 'text-ugb-green-dark',
      bg: 'bg-ugb-green-50',
    },
    {
      label: 'Статус',
      value: 'Live',
      Icon: RefreshCw,
      color: 'text-status-success',
      bg: 'bg-green-50',
      spin: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <stat.Icon className={`w-3.5 h-3.5 ${stat.color} ${stat.spin ? 'animate-spin' : ''}`}
                style={stat.spin ? { animationDuration: '3s' } : undefined}
              />
            </div>
            <span className="text-xs text-txt-muted">{stat.label}</span>
          </div>
          <div className={`font-display text-2xl sm:text-3xl font-bold ${stat.color}`}>
            {stat.value}
            {stat.suffix && <span className="text-xs sm:text-sm text-txt-muted ml-1 font-normal">{stat.suffix}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
