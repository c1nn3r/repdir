'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ReviewFormProps {
  vendorId: string;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReviewForm({ vendorId, userId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setLoading(true);
    setError('');

    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      setError('You have already reviewed this vendor.');
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.from('reviews').insert({
      vendor_id: vendorId,
      user_id: userId,
      rating,
      body,
    });

    if (err) {
      setError(err.message);
    } else {
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-semibold">Write a Review</h3>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRating(r)}
            className={`text-xl transition-colors ${
              r <= rating ? 'text-[var(--color-featured)]' : 'text-[var(--color-border)] hover:text-[var(--color-featured)]'
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your experience..."
        rows={3}
        className="w-full px-3 py-2 bg-transparent border border-[var(--color-border)] rounded-md text-sm focus:outline-none focus:border-[var(--foreground)] resize-none"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || rating === 0}
          className="px-4 py-2 text-xs bg-[var(--foreground)] text-[var(--background)] rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs border border-[var(--color-border)] rounded-md hover:bg-[var(--color-border)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
