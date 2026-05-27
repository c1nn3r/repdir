'use client';

import Link from 'next/link';
import { timeAgo, truncate } from '@/lib/utils';
import type { Post } from '@/lib/types';

interface PostEntryProps {
  post: Post;
}

export function PostEntry({ post }: PostEntryProps) {
  const body = post.body_snippet || post.body_full || '';
  const imageUrl = post.images && post.images.length > 0 ? post.images[0] : post.thumbnail;

  return (
    <article className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 hover:border-[var(--color-muted)] transition-colors">
      <div className="flex gap-3">
        {imageUrl && imageUrl.startsWith('http') && (
          <Link href={`/p/?id=${post.id}`} className="shrink-0">
            <img
              src={imageUrl}
              alt=""
              className="w-16 h-16 rounded-md object-cover bg-[var(--color-border)]"
              loading="lazy"
            />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {(post.vendor_trk || post.vendor_id) && (
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-800 rounded">
                {post.vendor_trk ? `TRK:${post.vendor_trk}` : `V:${post.vendor_id?.slice(0, 8)}`}
              </span>
            )}
            <Link
              href={`/p/?id=${post.id}`}
              className="text-sm font-medium hover:underline truncate"
            >
              {truncate(post.title, 100)}
            </Link>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] mb-1">
            <Link
              href={`https://reddit.com/r/${post.subreddit}`}
              target="_blank"
              className="text-[var(--color-accent)] hover:underline"
            >
              r/{post.subreddit}
            </Link>
            <span>·</span>
            <span>{timeAgo(post.created_utc)}</span>
            {post.author && (
              <>
                <span>·</span>
                <span>u/{post.author}</span>
              </>
            )}
          </div>
          {body && (
            <p className="text-xs text-[var(--color-muted)] line-clamp-2 mb-1">
              {truncate(body, 200)}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs">
            <Link
              href={`/p/?id=${post.id}`}
              className="text-[var(--color-accent)] hover:underline"
            >
              Product page
            </Link>
            {post.permalink && (
              <a
                href={`https://reddit.com${post.permalink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-muted)] hover:underline"
              >
                Reddit
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
