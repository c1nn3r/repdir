'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';
import { VoteButtons } from '@/components/VoteButtons';
import { ReviewForm } from '@/components/ReviewForm';
import { ReviewList } from '@/components/ReviewList';
import { timeAgo } from '@/lib/utils';
import type { Vendor, Post, Review } from '@/lib/types';

export default function VendorProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]" /></div>}>
      <VendorProfile />
    </Suspense>
  );
}

function VendorProfile() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '';
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'products' | 'reviews'>('products');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const fetchData = async () => {
    if (!code) { setLoading(false); return; }
    setLoading(true);

    try {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('tracking_code', code)
        .single();

      if (vendorData) {
        // Fetch rankings view data for live up-to-date metrics
        const { data: rankingData } = await supabase
          .from('vendor_rankings')
          .select('avg_rating, review_count, vote_score, rank_score, latest_thumbnail')
          .eq('tracking_code', code)
          .maybeSingle();

        const mergedVendor = {
          ...vendorData,
          star_rating: rankingData ? rankingData.avg_rating : 0,
          review_count: rankingData ? rankingData.review_count : 0,
          vote_score: rankingData ? rankingData.vote_score : 0,
          latest_thumbnail: rankingData ? rankingData.latest_thumbnail : (vendorData.latest_thumbnail || ''),
          rank_score: rankingData ? rankingData.rank_score : 0,
        };

        setVendor(mergedVendor as Vendor);

        const [{ data: postsData }, { data: reviewsData }] = await Promise.all([
          supabase.from('posts').select('*').or(`vendor_trk.eq.${code},vendor_id.eq.${(vendorData as Vendor).id}`).order('created_utc', { ascending: false }).limit(50),
          supabase.from('reviews').select('*').eq('vendor_id', (vendorData as Vendor).id).order('created_at', { ascending: false }).limit(50),
        ]);

        setPosts((postsData as Post[]) || []);
        setReviews((reviewsData as Review[]) || []);
      }
    } catch (error) {
      console.error('Fetch vendor details error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [code]);

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-muted)]">No vendor code specified.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-muted)]">Vendor not found.</p>
      </div>
    );
  }

  const contacts = vendor.other_contacts
    ? Object.entries(vendor.other_contacts).map(([k, v]) => `${k}: ${v}`).join(', ')
    : '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="text-xs text-[var(--color-muted)] hover:underline mb-4 inline-block">
        ← Back to directory
      </Link>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl font-bold">{vendor.display_name}</h1>
              {vendor.is_featured && <span className="text-[var(--color-featured)]" title="Featured">★</span>}
              {vendor.is_verified && <span className="text-[var(--color-verified)] font-bold text-sm" title="Verified">✓ Verified</span>}
            </div>
            <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--color-muted)] mb-3">
              <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">TRK:{vendor.tracking_code}</span>
              {vendor.subcategory && <span className="px-2 py-0.5 bg-[var(--color-border)] rounded">{vendor.subcategory}</span>}
              <span className="text-[var(--color-featured)]">{'★'.repeat(Math.round(vendor.star_rating || 0))} {(vendor.star_rating || 0).toFixed(1)}</span>
              <span>▲{vendor.vote_score || 0}</span>
              <span>{vendor.review_count || 0} reviews</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs mb-3">
              {vendor.website && <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">Website</a>}
              {vendor.telegram && <span className="text-[var(--color-muted)]">Telegram: {vendor.telegram}</span>}
              {contacts && <span className="text-[var(--color-muted)]">Contact: {contacts}</span>}
            </div>
            {vendor.bio && <p className="text-sm text-[var(--color-muted)]">{vendor.bio}</p>}
          </div>
          <VoteButtons vendorId={vendor.id} currentScore={vendor.vote_score || 0} user={user} onVoteChange={() => fetchData()} />
        </div>
      </div>

      <div className="flex gap-1 mb-6">
        <button onClick={() => setTab('products')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'products' ? 'bg-[var(--foreground)] text-[var(--background)]' : 'text-[var(--color-muted)] hover:text-[var(--foreground)]'}`}>Products ({posts.length})</button>
        <button onClick={() => setTab('reviews')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'reviews' ? 'bg-[var(--foreground)] text-[var(--background)]' : 'text-[var(--color-muted)] hover:text-[var(--foreground)]'}`}>Reviews ({reviews.length})</button>
      </div>

      {tab === 'products' && (
        <>
          {posts.length === 0 ? (
            <p className="text-center text-[var(--color-muted)] py-10">No products yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <Link key={post.id} href={`/p/?id=${post.id}`} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden hover:border-[var(--color-muted)] transition-colors group">
                  {(post.images?.[0] || post.thumbnail) && (post.images?.[0] || post.thumbnail || '').startsWith('http') && (
                    <img src={post.images?.[0] || post.thumbnail} alt="" className="w-full h-40 object-cover bg-[var(--color-border)]" loading="lazy" />
                  )}
                  <div className="p-3">
                    <h3 className="text-sm font-medium group-hover:underline line-clamp-2">{post.title}</h3>
                    {post.extracted_price && <p className="text-sm font-bold mt-1">{post.extracted_price}</p>}
                    <p className="text-[10px] text-[var(--color-muted)] mt-1">r/{post.subreddit} · {timeAgo(post.created_utc)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'reviews' && (
        <>
          {reviews.length > 0 && <ReviewList reviews={reviews} />}
          {user ? (
            showReviewForm ? (
              <ReviewForm vendorId={vendor.id} userId={user.id} onSuccess={() => { setShowReviewForm(false); fetchData(); }} onCancel={() => setShowReviewForm(false)} />
            ) : (
              <button onClick={() => setShowReviewForm(true)} className="mt-4 px-4 py-2 text-sm bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-90">Write a Review</button>
            )
          ) : (
            <p className="text-xs text-[var(--color-muted)] mt-4">
              <a href={`/login?redirect=/v?code=${code}`} className="text-[var(--color-accent)] hover:underline">Sign in</a>{' '}to write a review.
            </p>
          )}
        </>
      )}
    </div>
  );
}
