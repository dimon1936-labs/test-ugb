'use client';

import { useState } from 'react';
import Image from 'next/image';
import { TransferForm } from '@/components/TransferForm';
import { TransactionsList } from '@/components/TransactionsList';
import { ReportCard } from '@/components/ReportCard';
import { RatesCard } from '@/components/RatesCard';
import { NodeRedPanel } from '@/components/NodeRedPanel';
import { StatusIndicator } from '@/components/StatusIndicator';

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-surface-border/60">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="UGB"
            width={180}
            height={44}
            className="h-8 sm:h-9 w-auto"
            priority
          />
          <StatusIndicator />
        </div>
      </header>

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Hero */}
        <section className="mb-8 animate-fade-in">
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.15] mb-2 text-txt-primary">
              Обробка банківських{' '}
              <span className="text-ugb-green">переказів</span>
            </h1>
            <p className="text-txt-secondary text-sm sm:text-base leading-relaxed">
              Валідація, процесинг та звітність — все в одному інтерфейсі.
            </p>
          </div>
        </section>

        {/* Stats row — mobile horizontal scroll, desktop grid */}
        <section className="mb-6 animate-slide-up">
          <ReportCard />
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-slide-up">
          {/* Transfer form */}
          <div className="lg:col-span-5 xl:col-span-4">
            <TransferForm onSuccess={() => setRefreshKey((k) => k + 1)} />
          </div>

          {/* Transactions */}
          <div className="lg:col-span-4 xl:col-span-5">
            <TransactionsList refreshKey={refreshKey} />
          </div>

          {/* Sidebar: Rates + Node-RED */}
          <div className="lg:col-span-3 space-y-6">
            <RatesCard />
            <NodeRedPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-white/50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-txt-muted">
            <div className="flex items-center gap-3 font-mono">
              <span>Next.js</span>
              <span className="text-surface-border">|</span>
              <span>Express</span>
              <span className="text-surface-border">|</span>
              <span>PostgreSQL</span>
              <span className="text-surface-border">|</span>
              <span>Node-RED</span>
            </div>
            <span>UGB Demo Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
