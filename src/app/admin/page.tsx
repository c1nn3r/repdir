'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Vendor, Post } from '@/lib/types';

interface SubredditRow {
  id: string;
  subreddit: string;
  active: boolean;
}

function AdminPanelInner() {
  const searchParams = useSearchParams();
  const secret = searchParams.get('secret');
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<'subreddits' | 'vendors' | 'posts'>('subreddits');

  useEffect(() => {
    if (secret === process.env.NEXT_PUBLIC_ADMIN_SECRET) {
      setAuthorized(true);
    }
    setChecking(false);
  }, [secret]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-muted)]">Unauthorized</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-xl font-bold mb-6">Admin Panel</h1>

      <div className="flex gap-1 mb-6">
        {(['subreddits', 'vendors', 'posts'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-colors ${
              tab === t
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'text-[var(--color-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'subreddits' && <SubredditManager />}
      {tab === 'vendors' && <VendorManager />}
      {tab === 'posts' && <RecentPosts />}
    </div>
  );
}

function SubredditManager() {
  const [subs, setSubs] = useState<SubredditRow[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.from('subreddits_config').select('*').order('subreddit').then(({ data }) => {
      if (data) setSubs(data as SubredditRow[]);
      setLoading(false);
    });
  }, []);

  const addSub = async () => {
    if (!newName.trim()) return;
    const clean = newName.trim().replace(/^r\//, '');
    await supabase.from('subreddits_config').insert({ subreddit: clean, active: true });
    setNewName('');
    const { data } = await supabase.from('subreddits_config').select('*').order('subreddit');
    if (data) setSubs(data as SubredditRow[]);
  };

  const toggleSub = async (sub: SubredditRow) => {
    await supabase.from('subreddits_config').update({ active: !sub.active }).eq('id', sub.id);
    setSubs((prev) => prev.map((s) => (s.id === sub.id ? { ...s, active: !s.active } : s)));
  };

  const removeSub = async (id: string) => {
    await supabase.from('subreddits_config').delete().eq('id', id);
    setSubs((prev) => prev.filter((s) => s.id !== id));
  };

  if (loading) {
    return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--foreground)] mx-auto mt-10" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="r/SubredditName"
          className="flex-1 h-10 px-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-md text-sm focus:outline-none focus:border-[var(--foreground)]"
          onKeyDown={(e) => e.key === 'Enter' && addSub()}
        />
        <button onClick={addSub} className="px-4 py-2 text-sm bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-90">Add</button>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left p-3 font-medium">Subreddit</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subs.map((sub) => (
              <tr key={sub.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="p-3">r/{sub.subreddit}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${sub.active ? 'bg-green-100 dark:bg-green-900 text-[var(--color-verified)]' : 'bg-neutral-100 dark:bg-neutral-800 text-[var(--color-muted)]'}`}>
                    {sub.active ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => toggleSub(sub)} className="px-3 py-1 text-xs border border-[var(--color-border)] rounded hover:bg-[var(--color-border)]">
                      {sub.active ? 'Pause' : 'Activate'}
                    </button>
                    <button onClick={() => removeSub(sub.id)} className="px-3 py-1 text-xs border border-red-300 dark:border-red-800 text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950">Remove</button>
                  </div>
                </td>
              </tr>
            ))}
            {subs.length === 0 && (
              <tr><td colSpan={3} className="p-6 text-center text-[var(--color-muted)]">No subreddits configured.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VendorManager() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.from('vendors').select('*').order('created_at', { ascending: false }).limit(200).then(({ data }) => {
      if (data) setVendors(data as Vendor[]);
      setLoading(false);
    });
  }, []);

  const toggleVerified = async (v: Vendor) => {
    setTogglingId(v.id);
    const newVal = !v.is_verified;
    await supabase.from('vendors').update({
      is_verified: newVal,
      verified_at: newVal ? new Date().toISOString() : null,
    }).eq('id', v.id);
    setVendors((prev) => prev.map((x) => x.id === v.id ? { ...x, is_verified: newVal, verified_at: newVal ? new Date().toISOString() : null } : x));
    setTogglingId(null);
  };

  const toggleFeatured = async (v: Vendor) => {
    setTogglingId(v.id);
    const newVal = !v.is_featured;
    await supabase.from('vendors').update({
      is_featured: newVal,
      featured_at: newVal ? new Date().toISOString() : null,
    }).eq('id', v.id);
    setVendors((prev) => prev.map((x) => x.id === v.id ? { ...x, is_featured: newVal, featured_at: newVal ? new Date().toISOString() : null } : x));
    setTogglingId(null);
  };

  if (loading) {
    return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--foreground)] mx-auto mt-10" />;
  }

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left p-3 font-medium">Display Name</th>
              <th className="text-left p-3 font-medium">TRK Code</th>
              <th className="text-left p-3 font-medium">Category</th>
              <th className="text-left p-3 font-medium">Rating</th>
              <th className="text-left p-3 font-medium">Posts</th>
              <th className="text-center p-3 font-medium w-24">Verify</th>
              <th className="text-center p-3 font-medium w-24">Feature</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => (
              <tr key={v.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="p-3 font-medium">{v.display_name}</td>
                <td className="p-3 font-mono text-xs">{v.tracking_code}</td>
                <td className="p-3 text-xs">{v.subcategory || '—'}</td>
                <td className="p-3 text-xs text-[var(--color-featured)]">★ {(v.star_rating || 0).toFixed(1)}</td>
                <td className="p-3 text-xs">{v.review_count || 0}</td>
                <td className="p-3 text-center">
                  <button onClick={() => toggleVerified(v)} disabled={togglingId === v.id}
                    className={`px-3 py-1 text-xs rounded border transition-colors ${v.is_verified ? 'bg-[var(--color-verified)] text-white border-[var(--color-verified)]' : 'border-[var(--color-border)] hover:border-[var(--color-verified)] hover:text-[var(--color-verified)]'} disabled:opacity-50`}>
                    {v.is_verified ? '✓ Verified' : 'Verify'}
                  </button>
                </td>
                <td className="p-3 text-center">
                  <button onClick={() => toggleFeatured(v)} disabled={togglingId === v.id}
                    className={`px-3 py-1 text-xs rounded border transition-colors ${v.is_featured ? 'bg-[var(--color-featured)] text-white border-[var(--color-featured)]' : 'border-[var(--color-border)] hover:border-[var(--color-featured)] hover:text-[var(--color-featured)]'} disabled:opacity-50`}>
                    {v.is_featured ? '★ Featured' : 'Feature'}
                  </button>
                </td>
              </tr>
            ))}
            {vendors.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-[var(--color-muted)]">No vendors yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecentPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.from('posts').select('*').order('ingested_at', { ascending: false }).limit(50).then(({ data }) => {
      if (data) setPosts(data as Post[]);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--foreground)] mx-auto mt-10" />;
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <div key={post.id} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-3 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
              {post.reddit_post_id?.slice(0, 12)}
            </span>
            <span className="text-[var(--color-accent)]">r/{post.subreddit}</span>
            {post.vendor_trk && <span className="font-mono text-[10px]">TRK:{post.vendor_trk}</span>}
          </div>
          <p className="text-[var(--color-muted)] line-clamp-1">{post.title}</p>
          <p className="text-[10px] text-[var(--color-muted)] mt-1">Ingested: {new Date(post.ingested_at).toLocaleString()}</p>
        </div>
      ))}
      {posts.length === 0 && <p className="text-center py-10 text-[var(--color-muted)]">No posts ingested yet.</p>}
    </div>
  );
}

export default function AdminPanel() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]" /></div>}>
      <AdminPanelInner />
    </Suspense>
  );
}
