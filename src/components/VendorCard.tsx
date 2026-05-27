'use client';

import Link from 'next/link';
import type { Vendor } from '@/lib/types';

interface VendorCardProps {
  vendor: Vendor;
}

export function VendorCard({ vendor }: VendorCardProps) {
  return (
    <Link
      href={`/v?code=${vendor.trk_code}`}
      className={`bg-[var(--color-card)] border rounded-lg p-4 hover:shadow-sm transition-all group ${
        vendor.is_featured
          ? 'border-[var(--color-featured)] ring-1 ring-[var(--color-featured)]/20'
          : 'border-[var(--color-border)] hover:border-[var(--color-muted)]'
      }`}
    >
      <div className="flex items-start gap-3">
        {vendor.latest_thumbnail && vendor.latest_thumbnail.startsWith('http') && (
          <img
            src={vendor.latest_thumbnail}
            alt=""
            className="w-14 h-14 rounded-md object-cover bg-[var(--color-border)] shrink-0"
            loading="lazy"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className="font-semibold text-sm truncate group-hover:underline">
              {vendor.display_name}
            </span>
            {vendor.is_featured && (
              <span title="Featured" className="text-[var(--color-featured)] text-xs">
                ★
              </span>
            )}
            {vendor.is_verified && (
              <span title="Verified" className="text-[var(--color-verified)] text-xs font-bold">
                ✓
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 rounded">
              TRK:{vendor.trk_code}
            </span>
            {vendor.subcategory && (
              <span className="px-1.5 py-0.5 text-[10px] bg-[var(--color-border)] rounded">
                {vendor.subcategory}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--color-muted)]">
            <span className="text-[var(--color-featured)]">
              {'★'.repeat(Math.round(vendor.star_rating))}{' '}
              {vendor.star_rating.toFixed(1)}
            </span>
            <span>{vendor.review_count} reviews</span>
            {vendor.vote_score > 0 && (
              <span className="text-[var(--color-accent)]">▲{vendor.vote_score}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
