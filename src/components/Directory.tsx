'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { VendorCard } from './VendorCard';
import { PostEntry } from './PostEntry';
import { SearchBar } from './SearchBar';
import { FilterBar } from './FilterBar';
import type { Vendor, Post } from '@/lib/types';

export function Directory() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState('featured');
  
  // Reuse single stable client instance
  const supabase = useMemo(() => createClient(), []);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isMounted = useRef(false);

  const doSearch = useCallback(async (q: string) => {
    setLoading(true);

    try {
      if (q.trim()) {
        const [{ data: vendorResults }, { data: postResults }] = await Promise.all([
          supabase
            .from('vendors')
            .select('*')
            .textSearch('search_vector', q, { type: 'websearch', config: 'english' })
            .limit(50),
          supabase
            .from('posts')
            .select('*')
            .not('body_snippet', 'in', '("[removed]","[deleted]")')
            .textSearch('search_vector', q, { type: 'websearch', config: 'english' })
            .limit(50),

        ]);

        const rawVendors = (vendorResults as Vendor[]) || [];
        if (rawVendors.length > 0) {
          const ids = rawVendors.map((v) => v.id);
          const { data: rankingResults } = await supabase
            .from('vendor_rankings')
            .select('id, avg_rating, review_count, vote_score, latest_thumbnail, rank_score')
            .in('id', ids);

          const rankingMap = new Map(rankingResults?.map((r) => [r.id, r]) || []);
          const merged = rawVendors.map((v) => {
            const r = rankingMap.get(v.id);
            return {
              ...v,
              star_rating: r ? r.avg_rating : 0,
              review_count: r ? r.review_count : 0,
              vote_score: r ? r.vote_score : 0,
              latest_thumbnail: r ? r.latest_thumbnail : v.latest_thumbnail,
              rank_score: r ? r.rank_score : 0,
            };
          });
          setVendors(merged as Vendor[]);
        } else {
          setVendors([]);
        }
        setPosts((postResults as Post[]) || []);
      } else {
        let vendorQuery = supabase
          .from('vendors')
          .select('*')
          .limit(100);

        if (selectedSubcategories.length > 0) {
          vendorQuery = vendorQuery.in('subcategory', selectedSubcategories);
        }
        if (verifiedOnly) {
          vendorQuery = vendorQuery.eq('is_verified', true);
        }

        const { data: vendorResults, error } = await vendorQuery;
        if (error) throw error;

        const rawVendors = (vendorResults as Vendor[]) || [];
        if (rawVendors.length > 0) {
          const ids = rawVendors.map((v) => v.id);
          const { data: rankingResults } = await supabase
            .from('vendor_rankings')
            .select('id, avg_rating, review_count, vote_score, latest_thumbnail, rank_score')
            .in('id', ids);

          const rankingMap = new Map(rankingResults?.map((r) => [r.id, r]) || []);
          const merged = rawVendors.map((v) => {
            const r = rankingMap.get(v.id);
            return {
              ...v,
              star_rating: r ? r.avg_rating : 0,
              review_count: r ? r.review_count : 0,
              vote_score: r ? r.vote_score : 0,
              latest_thumbnail: r ? r.latest_thumbnail : v.latest_thumbnail,
              rank_score: r ? r.rank_score : 0,
            };
          });
          setVendors(merged as Vendor[]);
        } else {
          setVendors([]);
        }
        setPosts([]);
      }
    } catch (error) {
      console.error('Directory search error:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSubcategories, verifiedOnly, supabase]);

  const filteredAndSortedVendors = useMemo(() => {
    let list = vendors;
    if (minRating > 0) {
      list = list.filter((v) => v.star_rating >= minRating);
    }

    const sorted = [...list];
    if (sort === 'rating') {
      return sorted.sort((a, b) => b.star_rating - a.star_rating);
    }
    if (sort === 'reviews') {
      return sorted.sort((a, b) => b.review_count - a.review_count);
    }
    if (sort === 'name') {
      return sorted.sort((a, b) => a.display_name.localeCompare(b.display_name));
    }
    // featured sort (featured first, then verified, then rank_score desc)
    return sorted.sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1;
      return b.rank_score - a.rank_score;
    });
  }, [vendors, minRating, sort]);

  useEffect(() => {
    if (query === '') {
      doSearch('');
    } else {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => doSearch(query), 300);
    }
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, doSearch]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    doSearch(query);
  }, [selectedSubcategories, verifiedOnly, doSearch]);

  useEffect(() => {
    supabase
      .from('vendors')
      .select('subcategory')
      .then(({ data, error }) => {
        if (error) { console.error('Subcategories error:', error); return; }
        if (data) {
          const uniq = [...new Set((data as { subcategory: string }[]).map((v) => v.subcategory).filter(Boolean))];
          setSubcategories(uniq.sort());
        }
      });
  }, [supabase]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="space-y-6">
        <SearchBar value={query} onChange={setQuery} />

        <FilterBar
          subcategories={subcategories}
          selectedSubcategories={selectedSubcategories}
          onSubcategoriesChange={setSelectedSubcategories}
          minPrice={0}
          maxPrice={0}
          onPriceChange={() => {}}
          minRating={minRating}
          onRatingChange={setMinRating}
          verifiedOnly={verifiedOnly}
          onVerifiedChange={setVerifiedOnly}
          sort={sort}
          onSortChange={setSort}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]" />
          </div>
        ) : (
          <>
            {filteredAndSortedVendors.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">
                  Vendors ({filteredAndSortedVendors.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndSortedVendors.map((vendor) => (
                    <VendorCard key={vendor.id} vendor={vendor} />
                  ))}
                </div>
              </section>
            )}

            {posts.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">
                  Posts ({posts.length})
                </h2>
                <div className="space-y-3">
                  {posts.map((post) => (
                    <PostEntry key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {filteredAndSortedVendors.length === 0 && posts.length === 0 && !loading && (
              <div className="text-center py-20 text-[var(--color-muted)]">
                No results found.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
