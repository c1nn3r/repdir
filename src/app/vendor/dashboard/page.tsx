'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';
import type { Vendor } from '@/lib/types';

export default function VendorDashboardPage() {
  return (
    <AuthGuard>
      <VendorDashboard />
    </AuthGuard>
  );
}

function VendorDashboard() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    supabase
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const v = data as Vendor;
          setVendor(v);

          Promise.all([
            supabase.from('posts').select('*', { count: 'exact', head: true }).or(`vendor_trk.eq.${v.tracking_code},vendor_id.eq.${v.id}`),
            supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('vendor_trk', v.tracking_code),
          ]).then(([postsRes, reviewsRes]) => {
            setPostCount(postsRes.count || 0);
            setReviewCount(reviewsRes.count || 0);
          });
        }
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-[var(--color-muted)] mb-4">No vendor profile found for this account.</p>
          <Link href="/vendor/signup/" className="text-[var(--color-accent)] hover:underline text-sm">Create a vendor profile</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold">{vendor.display_name}</h1>
          <span className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{vendor.tracking_code}</span>
        </div>
        <Link href="/" className="text-xs text-[var(--color-muted)] hover:underline">Back to directory</Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{postCount}</div>
          <div className="text-xs text-[var(--color-muted)] mt-1">Posts Found</div>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{vendor.vote_score || 0}</div>
          <div className="text-xs text-[var(--color-muted)] mt-1">Vote Score</div>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 text-center">
          <div className="text-2xl font-bold">{reviewCount}</div>
          <div className="text-xs text-[var(--color-muted)] mt-1">Reviews</div>
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold">Profile Details</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--color-muted)]">Subcategory</dt>
            <dd>{vendor.subcategory || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-muted)]">Rating</dt>
            <dd className="text-[var(--color-featured)]">{'★'.repeat(Math.round(vendor.star_rating || 0))} {(vendor.star_rating || 0).toFixed(1)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-muted)]">Verified</dt>
            <dd>{vendor.is_verified ? <span className="text-[var(--color-verified)] font-bold">✓ Yes</span> : 'No'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--color-muted)]">Featured</dt>
            <dd>{vendor.is_featured ? <span className="text-[var(--color-featured)] font-bold">★ Yes</span> : 'No'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
