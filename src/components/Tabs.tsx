'use client';

import { useState } from 'react';
import { LiveFeed } from './LiveFeed';
import { Directory } from './Directory';

export function Tabs() {
  const [active, setActive] = useState<'live' | 'directory'>('live');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <span className="font-bold text-lg tracking-tight">RepDIR</span>
            <span className="text-xs text-[var(--color-muted)] ml-1 hidden sm:inline">
              Fashion Vendor Directory
            </span>
          </div>
          <nav className="flex gap-1" role="tablist">
            <button
              role="tab"
              aria-selected={active === 'live'}
              onClick={() => setActive('live')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                active === 'live'
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Live Feed
            </button>
            <button
              role="tab"
              aria-selected={active === 'directory'}
              onClick={() => setActive('directory')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                active === 'directory'
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              Directory
            </button>
            <a
              href="/vendor/signup"
              className="px-4 py-2 text-sm font-medium rounded-md text-[var(--color-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Sign Up
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {active === 'live' ? <LiveFeed /> : <Directory />}
      </main>

      <footer className="border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-muted)]">
        RepDIR — Fashion Vendor Directory
      </footer>
    </div>
  );
}
