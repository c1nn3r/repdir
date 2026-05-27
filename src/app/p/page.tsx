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
        if (p.vendor_trk) {
          supabase.from('vendors').select('*').eq('trk_code', p.vendor_trk).single().then(({ data: vData }) => {
            if (vData) setVendor(vData as Vendor);
          });
          supabase.from('posts').select('*').eq('vendor_trk', p.vendor_trk).neq('id', postId).order('created_at', { ascending: false }).limit(4).then(({ data: related }) => {
            if (related) setRelatedPosts(related as Post[]);
          });
        }
      }
      setLoading(false);
    });
  }, [postId]);

  if (!postId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-muted)]">No post ID specified.</p>
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

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-muted)]">Post not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/" className="text-xs text-[var(--color-muted)] hover:underline mb-4 inline-block">← Back</Link>

      <article className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        {post.image_urls && post.image_urls.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {post.image_urls.map((url, i) => (
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
            <span className="text-xs text-[var(--color-muted)]">{timeAgo(post.created_at)}</span>
          </div>
          <h1 className="text-xl font-bold mb-3">{post.title}</h1>
          {post.price && <p className="text-lg font-bold text-[var(--color-accent)] mb-3">{post.price}</p>}
          {post.body && <p className="text-sm text-[var(--color-muted)] whitespace-pre-wrap mb-4">{post.body}</p>}
          {post.permalink && (
            <a href={`https://reddit.com${post.permalink}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--color-accent)] hover:underline">View on Reddit →</a>
          )}
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
              <Link key={rp.id} href={`/p?id=${rp.id}`} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden hover:border-[var(--color-muted)] transition-colors">
                {rp.thumbnail && rp.thumbnail.startsWith('http') && <img src={rp.thumbnail} alt="" className="w-full h-32 object-cover bg-[var(--color-border)]" loading="lazy" />}
                <div className="p-3">
                  <h3 className="text-sm font-medium line-clamp-2">{rp.title}</h3>
                  <p className="text-[10px] text-[var(--color-muted)] mt-1">{timeAgo(rp.created_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
