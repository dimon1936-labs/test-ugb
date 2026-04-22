'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, XCircle, Loader2, Send } from 'lucide-react';
import { submitTransfer, type TransferResponse } from '@/lib/api';

export function TransferForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    fromAccount: 'UA001',
    toAccount: 'UA002',
    amount: '500',
    currency: 'UAH',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransferResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const response = await submitTransfer({
      fromAccount: form.fromAccount,
      toAccount: form.toAccount,
      amount: parseFloat(form.amount) || 0,
      currency: form.currency,
    });

    setResult(response);
    setLoading(false);

    if (response.status === 'success') {
      onSuccess();
    }
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-display font-semibold text-txt-primary">Новий переказ</h2>
          <p className="text-xs text-txt-muted mt-0.5">Між рахунками</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-ugb-green-50 flex items-center justify-center">
          <Send className="w-4 h-4 text-ugb-green" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Accounts */}
        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:gap-3 sm:items-end">
          <div>
            <label className="label-tag block mb-1.5">Відправник</label>
            <input
              type="text"
              value={form.fromAccount}
              onChange={(e) => setForm({ ...form, fromAccount: e.target.value })}
              className="input-field w-full px-3.5 py-2.5 font-mono text-sm"
              placeholder="UA001"
            />
          </div>

          <div className="hidden sm:flex items-center justify-center pb-1">
            <div className="w-8 h-8 rounded-full bg-ugb-green-50 border border-ugb-green/20 flex items-center justify-center">
              <ArrowRight className="w-3.5 h-3.5 text-ugb-green" />
            </div>
          </div>

          <div>
            <label className="label-tag block mb-1.5">Отримувач</label>
            <input
              type="text"
              value={form.toAccount}
              onChange={(e) => setForm({ ...form, toAccount: e.target.value })}
              className="input-field w-full px-3.5 py-2.5 font-mono text-sm"
              placeholder="UA002"
            />
          </div>
        </div>

        {/* Amount + Currency */}
        <div className="grid grid-cols-[1fr_100px] gap-3">
          <div>
            <label className="label-tag block mb-1.5">Сума</label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="input-field w-full px-3.5 py-2.5 font-mono text-xl sm:text-2xl"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="label-tag block mb-1.5">Валюта</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="input-field w-full px-3 py-2.5 font-mono text-xl sm:text-2xl appearance-none text-center"
            >
              <option value="UAH">UAH</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3.5 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Обробка...</span>
            </>
          ) : (
            <>
              <span>Виконати переказ</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="mt-4 animate-slide-up">
          {result.status === 'success' ? (
            <div className="rounded-xl border border-status-success/20 bg-green-50/50 p-4">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-status-success mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-status-success">Переказ виконано</span>
                  <div className="mt-2 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-txt-muted">ID</span>
                      <code className="text-ugb-navy truncate ml-2 max-w-[180px]">{result.transactionId}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-txt-muted">Сума</span>
                      <span className="font-semibold text-txt-primary">{result.amount} {result.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-txt-muted">Час</span>
                      <span className="text-txt-secondary">{new Date(result.processedAt).toLocaleString('uk-UA')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-status-error/20 bg-red-50/50 p-4">
              <div className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-status-error mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-status-error">{result.message}</span>
                  <ul className="mt-1.5 space-y-0.5">
                    {result.errors?.map((err, i) => (
                      <li key={i} className="text-xs text-txt-secondary">- {err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
