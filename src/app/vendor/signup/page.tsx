'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function VendorSignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trk = 'TRK-' + Math.random().toString(36).slice(2, 7).toUpperCase();

    const { error: authErr, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, tracking_code: trk },
      },
    });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    const userId = data?.user?.id;
    const session = data?.session;

    if (!userId) {
      setError('Sign up completed but no user ID returned. Check your email for a confirmation link.');
      setLoading(false);
      return;
    }

    if (!session) {
      setError('Account created. Please check your email to confirm, then sign in to complete registration.');
      setLoading(false);
      return;
    }

    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    const { data: rpcData, error: rpcErr } = await supabase.rpc('create_vendor', {
      p_display_name: displayName,
      p_tracking_code: trk,
    });

    if (rpcErr) {
      setError(rpcErr.message);
    } else if (rpcData?.error) {
      setError(rpcData.error);
    } else {
      setTrackingCode(trk);
    }

    setLoading(false);
  };

  if (trackingCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6 text-center">
          <div className="text-[var(--color-verified)] text-4xl mb-3">✓</div>
          <h2 className="text-lg font-bold mb-2">Registration Complete</h2>
          <p className="text-sm text-[var(--color-muted)] mb-4">Your tracking code is:</p>
          <div className="inline-block px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg font-mono text-lg font-bold tracking-wider">{trackingCode}</div>
          <p className="text-xs text-[var(--color-muted)] mt-4">Use this code in your Reddit posts to be discovered.</p>
          <Link href="/vendor/dashboard/" className="inline-block mt-4 text-sm text-[var(--color-accent)] hover:underline">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Vendor Sign Up</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Register as a fashion vendor</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6 space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-xs font-medium text-[var(--color-muted)] mb-1">Display Name</label>
            <input id="displayName" type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full h-10 px-3 bg-transparent border border-[var(--color-border)] rounded-md text-sm focus:outline-none focus:border-[var(--foreground)]" />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-[var(--color-muted)] mb-1">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-10 px-3 bg-transparent border border-[var(--color-border)] rounded-md text-sm focus:outline-none focus:border-[var(--foreground)]" />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-[var(--color-muted)] mb-1">Password</label>
            <input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-10 px-3 bg-transparent border border-[var(--color-border)] rounded-md text-sm focus:outline-none focus:border-[var(--foreground)]" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading} className="w-full h-10 bg-[var(--foreground)] text-[var(--background)] rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? 'Registering...' : 'Register'}
          </button>
          <p className="text-xs text-[var(--color-muted)] text-center">
            <Link href="/" className="hover:underline">Back to directory</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
