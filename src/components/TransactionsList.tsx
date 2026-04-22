'use client';

import { useEffect, useState } from 'react';
import { Activity, ArrowRight } from 'lucide-react';
import { fetchTransactions, type TransferSuccess } from '@/lib/api';

export function TransactionsList({ refreshKey }: { refreshKey: number }) {
  const [transactions, setTransactions] = useState<TransferSuccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchTransactions();
      setTransactions(data);
      setLoading(false);
    };
    load();
  }, [refreshKey]);

  return (
    <div className="card p-5 sm:p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-ugb-navy-light flex items-center justify-center">
            <Activity className="w-4 h-4 text-ugb-navy" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-txt-primary">Операції</h3>
            <span className="text-[11px] text-txt-muted">{transactions.length} записів</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[52px] rounded-lg bg-surface-bg animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] border border-dashed border-surface-border rounded-xl">
            <Activity className="w-8 h-8 text-txt-muted/30 mb-2" />
            <p className="text-sm text-txt-muted">Немає операцій</p>
            <p className="text-xs text-txt-muted mt-0.5">Виконайте переказ</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
            {transactions.map((tx) => (
              <div
                key={tx.transactionId}
                className="group rounded-xl border border-surface-border bg-white hover:border-ugb-green/30 hover:shadow-sm transition-all p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-xs min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-surface-bg text-txt-secondary text-[11px]">{tx.from}</span>
                    <ArrowRight className="w-3 h-3 text-ugb-green flex-shrink-0" />
                    <span className="px-1.5 py-0.5 rounded bg-surface-bg text-txt-secondary text-[11px]">{tx.to}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-mono text-sm font-bold text-ugb-green-dark">
                      {tx.amount.toLocaleString('uk-UA')}
                    </span>
                    <span className="text-[10px] text-txt-muted ml-1">{tx.currency}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="font-mono text-[10px] text-txt-muted truncate max-w-[160px]">{tx.transactionId}</span>
                  <span className="text-[10px] text-txt-muted">{new Date(tx.processedAt).toLocaleTimeString('uk-UA')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
