'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PostEntry } from './PostEntry';
import { CategoryPills } from './CategoryPills';
import type { Post } from '@/lib/types';

const POLL_INTERVAL = 30000;

export function LiveFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchPosts = useCallback(async () => {
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_utc', { ascending: false })
      .limit(100);

    if (activeCategory) {
      query = query.eq('subreddit', activeCategory);
    }

    const { data, error } = await query;
    if (error) console.error('LiveFeed posts error:', error);
    if (data) setPosts(data as Post[]);
    setLoading(false);
  }, [activeCategory]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    supabase
      .from('subreddits_config')
      .select('subreddit')
      .eq('active', true)
      .then(({ data }) => {
        if (data) setCategories(data.map((s: { subreddit: string }) => s.subreddit));
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchPosts, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <CategoryPills
        categories={categories}
        active={activeCategory}
        onChange={setActiveCategory}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-muted)]">
          No posts yet. Waiting for data...
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostEntry key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
