'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { VendorCard } from '@/components/VendorCard';
import { timeAgo } from '@/lib/utils';
import type { Post, Vendor } from '@/lib/types';

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]" /></div>}>
      <ProductDetail />
    </Suspense>
  );
}

function ProductDetail() {
  const searchParams = useSearchParams();
  const postId = searchParams.get('id') || '';
  const [post, setPost] = useState<Post | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!postId) { setLoading(false); return; }
    setLoading(true);

    supabase.from('posts').select('*').eq('id', postId).single().then(({ data }) => {
      if (data) {
        const p = data as Post;
        setPost(p);

        const vendorLookup = p.vendor_id || p.vendor_trk;
        if (vendorLookup) {
          const col = p.vendor_id ? 'id' : 'tracking_code';
          supabase.from('vendors').select('*').eq(col, vendorLookup).single().then(({ data: vData }) => {
            if (vData) setVendor(vData as Vendor);
          });

          const filter = p.vendor_trk
            ? `vendor_trk.eq.${p.vendor_trk}`
            : `vendor_id.eq.${p.vendor_id}`;

          supabase.from('posts').select('*').or(filter).neq('id', postId).order('created_utc', { ascending: false }).limit(4).then(({ data: related }) => {
            if (related) setRelatedPosts(related as Post[]);
          });
        }
      }
      setLoading(false);
    });
  }, [postId]);

  if (!postId) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-[var(--color-muted)]">No post ID specified.</p></div>;
  }
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]" /></div>;
  }
  if (!post) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-[var(--color-muted)]">Post not found.</p></div>;
  }

  const images: string[] = (post.images as string[]) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="text-xs text-[var(--color-muted)] hover:underline mb-4 inline-block">← Back</Link>

      <article className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        {images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {images.map((url, i) => (
              <img key={i} src={url} alt="" className="w-full h-64 object-cover bg-[var(--color-border)]" loading="lazy" />
            ))}
          </div>
        ) : post.thumbnail && post.thumbnail.startsWith('http') ? (
          <img src={post.thumbnail} alt="" className="w-full h-80 object-cover bg-[var(--color-border)]" />
        ) : null}

        <div className="p-6">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <a href={`https://reddit.com/r/${post.subreddit}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-accent)] hover:underline">r/{post.subreddit}</a>
            <span className="text-xs text-[var(--color-muted)]">·</span>
            <span className="text-xs text-[var(--color-muted)]">{timeAgo(post.created_utc)}</span>
          </div>
          <h1 className="text-xl font-bold mb-3">{post.title}</h1>
          {post.extracted_price && <p className="text-lg font-bold text-[var(--color-accent)] mb-3">{post.extracted_price}</p>}
          {(post.body_full || post.body_snippet) && <p className="text-sm text-[var(--color-muted)] whitespace-pre-wrap mb-4">{post.body_full || post.body_snippet}</p>}
          {post.permalink && <a href={`https://reddit.com${post.permalink}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-accent)] hover:underline">View on Reddit →</a>}
          {post.post_url && !post.permalink && <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-accent)] hover:underline">View on Reddit →</a>}
        </div>
      </article>

      {vendor && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">Vendor</h2>
          <VendorCard vendor={vendor} />
        </section>
      )}

      {relatedPosts.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">More from this vendor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedPosts.map((rp) => (
              <Link key={rp.id} href={`/p/?id=${rp.id}`} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden hover:border-[var(--color-muted)] transition-colors">
                {(rp.images?.[0] || rp.thumbnail) && ((rp.images?.[0] || rp.thumbnail || '')).startsWith('http') && <img src={rp.images?.[0] || rp.thumbnail} alt="" className="w-full h-32 object-cover bg-[var(--color-border)]" loading="lazy" />}
                <div className="p-3">
                  <h3 className="text-sm font-medium line-clamp-2">{rp.title}</h3>
                  <p className="text-[10px] text-[var(--color-muted)] mt-1">{timeAgo(rp.created_utc)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
