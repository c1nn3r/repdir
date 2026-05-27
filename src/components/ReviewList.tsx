'use client';

import { timeAgo } from '@/lib/utils';
import type { Review } from '@/lib/types';

interface ReviewListProps {
  reviews: Review[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--color-muted)]">{review.user_id.slice(0, 8)}...</span>
            <span className="text-[var(--color-featured)] text-xs">
              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
            </span>
          </div>
          {review.body && (
            <p className="text-sm">{review.body}</p>
          )}
          <p className="text-[10px] text-[var(--color-muted)] mt-1">{timeAgo(review.created_at)}</p>
        </div>
      ))}
    </div>
  );
}
