'use client';

import { useEffect, useState } from 'react';
import { Workflow, AlertTriangle, ShieldAlert, CheckCircle2, Radio, BarChart3, DollarSign } from 'lucide-react';
import { fetchEvents, fetchNodeRedStatus, type NodeRedEvent, type NodeRedStatus } from '@/lib/api';

const EVENT_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: typeof Radio }> = {
  'transfer-completed': { label: 'Переказ', color: 'text-status-success', bg: 'bg-green-50', Icon: CheckCircle2 },
  'large-transfer-alert': { label: 'Алерт >50K', color: 'text-status-warning', bg: 'bg-amber-50', Icon: AlertTriangle },
  'fraud-critical': { label: 'FRAUD', color: 'text-status-error', bg: 'bg-red-50', Icon: ShieldAlert },
  'fraud-detected': { label: 'Fraud', color: 'text-status-error', bg: 'bg-red-50', Icon: ShieldAlert },
  'scheduled-report': { label: 'Звіт', color: 'text-ugb-navy', bg: 'bg-blue-50', Icon: BarChart3 },
  'nbu-rates-updated': { label: 'Курси', color: 'text-ugb-green-dark', bg: 'bg-ugb-green-50', Icon: DollarSign },
};

export function NodeRedPanel() {
  const [status, setStatus] = useState<NodeRedStatus | null>(null);
  const [events, setEvents] = useState<NodeRedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, e] = await Promise.all([fetchNodeRedStatus(), fetchEvents()]);
      setStatus(s);
      setEvents(e);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = status?.status === 'connected';

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
            <Workflow className="w-3.5 h-3.5 text-red-500" />
          </div>
          <h3 className="text-sm font-semibold text-txt-primary">Node-RED</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-status-success' : 'bg-status-error'}`} />
          <span className="text-[11px] text-txt-muted">
            {loading ? '...' : isConnected ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Capabilities - compact chips */}
      <div className="flex flex-wrap gap-1 mb-3">
        {['Аудит', 'Fraud', 'Алерти', 'Курси НБУ', 'Звіти'].map((cap) => (
          <span key={cap} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
            isConnected ? 'bg-green-50 text-status-success' : 'bg-gray-50 text-txt-muted'
          }`}>
            <span className={`w-1 h-1 rounded-full ${isConnected ? 'bg-status-success' : 'bg-txt-muted'}`} />
            {cap}
          </span>
        ))}
      </div>

      {/* Events */}
      <div className="section-label mb-1.5">
        Події {events.length > 0 && `(${events.length})`}
      </div>
      {events.length === 0 ? (
        <div className="text-center py-3 border border-dashed border-surface-border rounded-lg">
          <p className="text-[11px] text-txt-muted">Виконайте переказ</p>
        </div>
      ) : (
        <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
          {events.slice(0, 25).map((evt) => {
            const config = EVENT_CONFIG[evt.event] || { label: evt.event, color: 'text-txt-muted', bg: 'bg-surface-bg', Icon: Radio };
            const Icon = config.Icon;
            const description = (evt.data as Record<string, string>)?.description || '';
            const isFraud = evt.event.includes('fraud');

            return (
              <div
                key={evt.id}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] transition-colors ${
                  isFraud ? config.bg + ' border border-status-error/15' : 'hover:bg-surface-bg'
                }`}
              >
                <Icon className={`w-3 h-3 flex-shrink-0 ${config.color}`} />
                <span className={`font-medium ${config.color}`}>{config.label}</span>
                {isFraud && <span className="px-1 py-px text-[8px] font-bold bg-status-error text-white rounded">!</span>}
                {description && <span className="text-txt-muted truncate flex-1 ml-0.5">{description}</span>}
                <span className="text-txt-muted flex-shrink-0 tabular-nums">
                  {new Date(evt.timestamp).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
