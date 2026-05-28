'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [callbackLoading, setCallbackLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get('redirect') || '/';
  const supabase = createClient();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.slice(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(() => {
          router.push(redirect);
        });
        return;
      }

      const errorMsg = params.get('error_description') || params.get('error');
      if (errorMsg) {
        setError(errorMsg.replace(/\+/g, ' '));
      }
    }
    setCallbackLoading(false);
  }, [router, redirect, supabase]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push(redirect);
      }
    });
    return () => subscription.unsubscribe();
  }, [router, redirect, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login?redirect=${encodeURIComponent(redirect)}`,
      },
    });

    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  };

  if (callbackLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">RepDIR</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">Sign in to interact</p>
        </div>

        {sent ? (
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6 text-center">
            <div className="text-[var(--color-verified)] text-4xl mb-3">✓</div>
            <p className="text-sm font-medium">Magic link sent!</p>
            <p className="text-xs text-[var(--color-muted)] mt-1">Check {email} for the login link.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[var(--color-muted)] mb-1">Email address</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full h-10 px-3 bg-transparent border border-[var(--color-border)] rounded-md text-sm focus:outline-none focus:border-[var(--foreground)]" />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button type="submit" disabled={loading} className="w-full h-10 bg-[var(--foreground)] text-[var(--background)] rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
            <p className="text-xs text-[var(--color-muted)] text-center">
              <Link href="/" className="hover:underline">Back to directory</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
