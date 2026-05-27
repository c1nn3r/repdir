'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface VoteButtonsProps {
  entityType: 'vendor' | 'post';
  entityId: string;
  currentScore: number;
  user: User | null;
  onVoteChange: () => void;
}

export function VoteButtons({ entityType, entityId, currentScore, user, onVoteChange }: VoteButtonsProps) {
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    supabase
      .from('votes')
      .select('direction')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setUserVote(data.direction);
      });
  }, [user, entityType, entityId]);

  const handleVote = async (direction: 'up' | 'down') => {
    if (!user || loading) return;
    setLoading(true);

    if (userVote === direction) {
      await supabase.from('votes').delete().eq('entity_type', entityType).eq('entity_id', entityId).eq('user_id', user.id);
      setUserVote(null);
    } else {
      await supabase.from('votes').upsert({
        entity_type: entityType,
        entity_id: entityId,
        user_id: user.id,
        direction,
      }, { onConflict: 'entity_type,entity_id,user_id' });
      setUserVote(direction);
    }

    setLoading(false);
    onVoteChange();
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => handleVote('up')}
        disabled={!user || loading}
        className={`text-lg leading-none transition-colors ${
          userVote === 'up' ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted)] hover:text-[var(--color-accent)]'
        } disabled:opacity-30`}
        title={user ? 'Upvote' : 'Sign in to vote'}
      >
        ▲
      </button>
      <span className="text-sm font-bold">{currentScore}</span>
      <button
        onClick={() => handleVote('down')}
        disabled={!user || loading}
        className={`text-lg leading-none transition-colors ${
          userVote === 'down' ? 'text-red-500' : 'text-[var(--color-muted)] hover:text-red-500'
        } disabled:opacity-30`}
        title={user ? 'Downvote' : 'Sign in to vote'}
      >
        ▼
      </button>
    </div>
  );
}
