'use client';

import { useEffect, useRef } from 'react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, Radio, BarChart3, DollarSign } from 'lucide-react';
import type { NodeRedEvent } from '@/lib/api';

const EVENT_META: Record<string, { title: string; color: string; bg: string; Icon: typeof Radio }> = {
  'transfer-completed': { title: 'Переказ виконано', color: 'text-status-success', bg: 'bg-green-50', Icon: CheckCircle2 },
  'large-transfer-alert': { title: 'Великий переказ', color: 'text-status-warning', bg: 'bg-amber-50', Icon: AlertTriangle },
  'fraud-critical': { title: 'FRAUD — Критичне', color: 'text-status-error', bg: 'bg-red-50', Icon: ShieldAlert },
  'fraud-detected': { title: 'Fraud детекція', color: 'text-status-error', bg: 'bg-red-50', Icon: ShieldAlert },
  'scheduled-report': { title: 'Запланований звіт', color: 'text-ugb-navy', bg: 'bg-blue-50', Icon: BarChart3 },
  'nbu-rates-updated': { title: 'Курси НБУ оновлено', color: 'text-ugb-green-dark', bg: 'bg-ugb-green-50', Icon: DollarSign },
};

function renderValue(value: unknown, depth = 0): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-txt-muted">-</span>;
  if (typeof value === 'boolean') return <span className={value ? 'text-status-success' : 'text-status-error'}>{value ? 'Так' : 'Ні'}</span>;
  if (typeof value === 'number') return <span className="font-mono font-semibold">{value.toLocaleString('uk-UA')}</span>;
  if (typeof value === 'string') {
    // Check if ISO date
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return <span>{new Date(value).toLocaleString('uk-UA')}</span>;
    }
    return <span>{value}</span>;
  }
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-0.5 mt-0.5">
        {value.map((item, i) => (
          <li key={i} className="text-txt-secondary flex gap-1.5">
            <span className="text-txt-muted">-</span>
            {renderValue(item, depth + 1)}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === 'object' && depth < 3) {
    return (
      <div className={`space-y-1 ${depth > 0 ? 'ml-3 mt-0.5 pl-2 border-l border-surface-border' : ''}`}>
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
          <div key={k}>
            <span className="text-txt-muted text-[10px] uppercase tracking-wide">{k}</span>
            <div className="text-txt-primary">{renderValue(v, depth + 1)}</div>
          </div>
        ))}
      </div>
    );
  }
  return <span className="text-txt-muted">{JSON.stringify(value)}</span>;
}

export function EventModal({ event, onClose }: { event: NodeRedEvent; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const meta = EVENT_META[event.event] || { title: event.event, color: 'text-txt-primary', bg: 'bg-surface-bg', Icon: Radio };
  const Icon = meta.Icon;
  const isFraud = event.event.includes('fraud');

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div className={`relative w-full max-w-md bg-white rounded-2xl shadow-xl border ${isFraud ? 'border-status-error/30' : 'border-surface-border'} overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 sm:p-5 ${meta.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${meta.color}`} />
            </div>
            <div>
              <h3 className={`font-semibold ${meta.color}`}>{meta.title}</h3>
              <span className="text-xs text-txt-muted">
                {new Date(event.timestamp).toLocaleString('uk-UA')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-txt-secondary" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 max-h-[60vh] overflow-y-auto">
          {/* Event ID */}
          <div className="mb-3 pb-3 border-b border-surface-border">
            <span className="text-[10px] text-txt-muted uppercase tracking-wide">Event ID</span>
            <div className="font-mono text-xs text-txt-secondary mt-0.5">{event.id}</div>
          </div>

          {/* Event type */}
          <div className="mb-3 pb-3 border-b border-surface-border">
            <span className="text-[10px] text-txt-muted uppercase tracking-wide">Тип події</span>
            <div className="font-mono text-xs text-txt-primary mt-0.5">{event.event}</div>
          </div>

          {/* Data */}
          {event.data && Object.keys(event.data).length > 0 && (
            <div>
              <span className="text-[10px] text-txt-muted uppercase tracking-wide">Деталі</span>
              <div className="mt-1.5 text-sm space-y-2">
                {Object.entries(event.data)
                  .filter(([k]) => k !== 'event')
                  .map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-surface-bg p-3">
                      <div className="text-[10px] text-txt-muted uppercase tracking-wide mb-1">{key}</div>
                      <div className="text-sm text-txt-primary">{renderValue(value)}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-surface-border bg-surface-bg/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-txt-secondary bg-white border border-surface-border hover:bg-surface-bg transition-colors"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
