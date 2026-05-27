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
  const [tab, setTab] = useState<'subreddits' | 'vendors' | 'posts' | 'settings'>('subreddits');

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
        {(['subreddits', 'vendors', 'posts', 'settings'] as const).map((t) => (
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
      {tab === 'settings' && <SettingsPanel />}
    </div>
  );
}

function SubredditManager() {
  const [subs, setSubs] = useState<SubredditRow[]>([]);
  const [newName, setNewName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
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

  const bulkAdd = async () => {
    if (!bulkText.trim()) return;
    setAdding(true);
    const existing = new Set(subs.map((s) => s.subreddit.toLowerCase()));
    const names = bulkText
      .split(/[\n,]+/)
      .map((s) => s.trim().replace(/^r\//, ''))
      .filter((s) => s.length > 0 && !existing.has(s.toLowerCase()));

    for (const name of names) {
      await supabase.from('subreddits_config').insert({ subreddit: name, active: true });
    }
    setBulkText('');
    const { data } = await supabase.from('subreddits_config').select('*').order('subreddit');
    if (data) setSubs(data as SubredditRow[]);
    setAdding(false);
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

      <div className="space-y-2">
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder="Paste multiple subreddits (comma or newline separated)&#10;e.g. fashionreps, designerreps, QualityReps"
          rows={3}
          className="w-full px-3 py-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-md text-sm focus:outline-none focus:border-[var(--foreground)] resize-none"
        />
        <button
          onClick={bulkAdd}
          disabled={adding || !bulkText.trim()}
          className="px-4 py-2 text-xs bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {adding ? 'Adding...' : 'Bulk Add'}
        </button>
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

function SettingsPanel() {
  const [requireCode, setRequireCode] = useState<boolean | null>(null);
  const [retentionDays, setRetentionDays] = useState<number>(7);
  const [saving, setSaving] = useState(false);
  const [retentionInput, setRetentionInput] = useState('7');
  const supabase = createClient();

  useEffect(() => {
    supabase.from('settings').select('key,value').then(({ data }) => {
      if (data) {
        for (const row of data as { key: string; value: unknown }[]) {
          if (row.key === 'require_tracking_code') {
            const val = row.value;
            setRequireCode(val === true || val === 'true');
          }
          if (row.key === 'post_retention_days') {
            const val = typeof row.value === 'number' ? row.value : parseInt(String(row.value), 10);
            setRetentionDays(val || 7);
            setRetentionInput(String(val || 7));
          }
        }
      }
      if (requireCode === null) setRequireCode(true);
    });
  }, []);

  const toggle = async () => {
    if (requireCode === null) return;
    const newVal = !requireCode;
    setSaving(true);
    await supabase.from('settings').upsert({ key: 'require_tracking_code', value: newVal }, { onConflict: 'key' });
    setRequireCode(newVal);
    setSaving(false);
  };

  const saveRetention = async () => {
    const val = parseInt(retentionInput, 10);
    if (isNaN(val) || val < 1) return;
    setSaving(true);
    await supabase.from('settings').upsert({ key: 'post_retention_days', value: val }, { onConflict: 'key' });
    setRetentionDays(val);
    setSaving(false);
  };

  if (requireCode === null) {
    return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--foreground)] mx-auto mt-10" />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold">Polling Settings</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Require Tracking Code</p>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              {requireCode
                ? 'Only ingest posts containing TRK- codes.'
                : 'Ingest ALL posts from monitored subreddits.'}
            </p>
          </div>
          <button
            onClick={toggle}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
              requireCode ? 'bg-[var(--color-verified)]' : 'bg-[var(--color-muted)]'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              requireCode ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6 space-y-3">
        <h2 className="text-sm font-semibold">Data Retention</h2>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Post retention (days)</label>
            <input
              type="number"
              min="1"
              max="365"
              value={retentionInput}
              onChange={(e) => setRetentionInput(e.target.value)}
              className="w-full h-10 px-3 bg-transparent border border-[var(--color-border)] rounded-md text-sm focus:outline-none focus:border-[var(--foreground)]"
            />
            <p className="text-xs text-[var(--color-muted)] mt-1">Posts older than this will be auto-deleted on each poll.</p>
          </div>
          <button
            onClick={saveRetention}
            disabled={saving}
            className="px-4 py-2 text-sm bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-90 disabled:opacity-50 shrink-0"
          >
            Save
          </button>
        </div>
      </div>
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
