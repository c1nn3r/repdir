'use client';

import { useEffect, useState, useMemo } from 'react';
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

const CATEGORIES = [
  'Footwear', 'Streetwear', 'Outerwear', 'Accessories', 'Denim',
  'Vintage', 'Sportswear', 'Formal', 'Bags', 'Headwear', 'Other'
];

function VendorDashboard() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Profile Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState('Other');
  const [subcategory, setSubcategory] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [telegram, setTelegram] = useState('');
  const [wechat, setWechat] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [discord, setDiscord] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Stable client instance
  const supabase = useMemo(() => createClient(), []);

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
            supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('vendor_id', v.id),
          ]).then(([postsRes, reviewsRes]) => {
            setPostCount(postsRes.count || 0);
            setReviewCount(reviewsRes.count || 0);
          }).catch((err) => {
            console.error('Stats load error:', err);
          });
        }
        setLoading(false);
      });
  }, [user, supabase]);

  useEffect(() => {
    if (vendor) {
      setDisplayName(vendor.display_name || '');
      setCategory(vendor.category || 'Other');
      setSubcategory(vendor.subcategory || '');
      setBio(vendor.bio || '');
      setWebsite(vendor.website || '');
      setTelegram(vendor.telegram || '');
      setWechat(vendor.other_contacts?.WeChat || '');
      setWhatsapp(vendor.other_contacts?.WhatsApp || '');
      setDiscord(vendor.other_contacts?.Discord || '');
    }
  }, [vendor]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !vendor) return;

    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    const other_contacts: Record<string, string> = {};
    if (wechat.trim()) other_contacts.WeChat = wechat.trim();
    if (whatsapp.trim()) other_contacts.WhatsApp = whatsapp.trim();
    if (discord.trim()) other_contacts.Discord = discord.trim();

    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          display_name: displayName.trim(),
          category,
          subcategory: subcategory.trim(),
          bio: bio.trim(),
          website: website.trim(),
          telegram: telegram.trim(),
          other_contacts: Object.keys(other_contacts).length > 0 ? other_contacts : null,
        })
        .eq('id', vendor.id);

      if (error) throw error;

      setSuccessMsg('Profile updated successfully!');
      setVendor({
        ...vendor,
        display_name: displayName.trim(),
        category,
        subcategory: subcategory.trim(),
        bio: bio.trim(),
        website: website.trim(),
        telegram: telegram.trim(),
        other_contacts: Object.keys(other_contacts).length > 0 ? other_contacts : null,
      });
    } catch (err) {
      console.error('Update profile error:', err);
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

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

  const contacts = vendor.other_contacts
    ? Object.entries(vendor.other_contacts).map(([k, v]) => `${k}: ${v}`).join(', ')
    : '';

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

      {successMsg && (
        <div className="p-3 mb-4 text-sm text-green-700 bg-green-50 rounded-lg dark:bg-neutral-800 dark:text-green-400 border border-green-200 dark:border-neutral-700">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-lg dark:bg-neutral-800 dark:text-red-400 border border-red-200 dark:border-neutral-700">
          {errorMsg}
        </div>
      )}

      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <h2 className="text-sm font-semibold">Profile Details</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 text-xs bg-[var(--foreground)] text-[var(--background)] rounded hover:opacity-90 transition-opacity"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--color-muted)] mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-transparent border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--foreground)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-muted)] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--foreground)]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--color-muted)] mb-1">Subcategory</label>
                <input
                  type="text"
                  placeholder="e.g. Shoes, Hoodies"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full bg-transparent border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--foreground)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-muted)] mb-1">Website URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-transparent border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--foreground)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--color-muted)] mb-1">Telegram Link</label>
                <input
                  type="text"
                  placeholder="https://t.me/username"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="w-full bg-transparent border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--foreground)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-muted)] mb-1">WeChat ID</label>
                <input
                  type="text"
                  placeholder="WeChat ID"
                  value={wechat}
                  onChange={(e) => setWechat(e.target.value)}
                  className="w-full bg-transparent border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--foreground)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--color-muted)] mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  placeholder="+86..."
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-transparent border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--foreground)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--color-muted)] mb-1">Discord Invite</label>
                <input
                  type="text"
                  placeholder="discord.gg/..."
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  className="w-full bg-transparent border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--foreground)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--color-muted)] mb-1">Biography / About</label>
              <textarea
                rows={3}
                placeholder="Tell users about your products..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-transparent border border-[var(--color-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--foreground)] resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-[var(--color-border)] rounded-md hover:bg-[var(--color-border)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-[var(--color-border)]/40 pb-2">
              <dt className="text-[var(--color-muted)]">Category</dt>
              <dd className="font-medium">{vendor.category || '—'}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--color-border)]/40 pb-2">
              <dt className="text-[var(--color-muted)]">Subcategory</dt>
              <dd className="font-medium">{vendor.subcategory || '—'}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--color-border)]/40 pb-2">
              <dt className="text-[var(--color-muted)]">Website</dt>
              <dd className="font-medium">
                {vendor.website ? (
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">
                    {vendor.website}
                  </a>
                ) : '—'}
              </dd>
            </div>
            <div className="flex justify-between border-b border-[var(--color-border)]/40 pb-2">
              <dt className="text-[var(--color-muted)]">Telegram</dt>
              <dd className="font-medium">{vendor.telegram || '—'}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--color-border)]/40 pb-2">
              <dt className="text-[var(--color-muted)]">Contacts</dt>
              <dd className="font-medium truncate max-w-[250px]" title={contacts}>{contacts || '—'}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--color-border)]/40 pb-2">
              <dt className="text-[var(--color-muted)]">Rating</dt>
              <dd className="text-[var(--color-featured)] font-medium">{'★'.repeat(Math.round(vendor.star_rating || 0))} {(vendor.star_rating || 0).toFixed(1)}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--color-border)]/40 pb-2">
              <dt className="text-[var(--color-muted)]">Verified</dt>
              <dd>{vendor.is_verified ? <span className="text-[var(--color-verified)] font-bold">✓ Yes</span> : 'No'}</dd>
            </div>
            <div className="flex justify-between border-b border-[var(--color-border)]/40 pb-2">
              <dt className="text-[var(--color-muted)]">Featured</dt>
              <dd>{vendor.is_featured ? <span className="text-[var(--color-featured)] font-bold">★ Yes</span> : 'No'}</dd>
            </div>
            {vendor.bio && (
              <div className="pt-2">
                <dt className="text-[var(--color-muted)] mb-1">Biography</dt>
                <dd className="text-xs bg-neutral-50 dark:bg-neutral-900 border border-[var(--color-border)]/60 rounded p-3 text-[var(--color-muted)] leading-relaxed whitespace-pre-wrap">{vendor.bio}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}
