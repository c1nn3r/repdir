'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface VoteButtonsProps {
  vendorId: string;
  currentScore: number;
  user: User | null;
  onVoteChange: () => void;
}

export function VoteButtons({ vendorId, currentScore, user, onVoteChange }: VoteButtonsProps) {
  const [userVote, setUserVote] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    supabase
      .from('votes')
      .select('value')
      .eq('vendor_id', vendorId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setUserVote(data.value);
      });
  }, [user, vendorId]);

  const handleVote = async (value: number) => {
    if (!user || loading) return;
    setLoading(true);

    if (userVote === value) {
      await supabase.from('votes').delete().match({ vendor_id: vendorId, user_id: user.id });
      setUserVote(null);
    } else {
      await supabase.from('votes').upsert({
        vendor_id: vendorId,
        user_id: user.id,
        value,
      }, { onConflict: 'vendor_id,user_id' });
      setUserVote(value);
    }

    setLoading(false);
    onVoteChange();
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={!user || loading}
        className={`text-lg leading-none transition-colors ${
          userVote === 1 ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] hover:text-[var(--color-accent)]'
        } disabled:opacity-30`}
        title={user ? 'Upvote' : 'Sign in to vote'}
      >
        ▲
      </button>
      <span className="text-sm font-bold">{currentScore}</span>
      <button
        onClick={() => handleVote(-1)}
        disabled={!user || loading}
        className={`text-lg leading-none transition-colors ${
          userVote === -1 ? 'text-red-500' : 'text-[var(--color-muted)] hover:text-red-500'
        } disabled:opacity-30`}
        title={user ? 'Downvote' : 'Sign in to vote'}
      >
        ▼
      </button>
    </div>
  );
}
