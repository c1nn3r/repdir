'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState('featured');
  const supabase = createClient();

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const doSearch = useCallback(async (q: string) => {
    setLoading(true);

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
          .textSearch('search_vector', q, { type: 'websearch', config: 'english' })
          .limit(50),
      ]);

      setVendors((vendorResults as Vendor[]) || []);
      setPosts((postResults as Post[]) || []);
    } else {
      let vendorQuery = supabase
        .from('vendors')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('is_verified', { ascending: false })
        .order('rank_score', { ascending: false })
        .limit(100);

      if (selectedSubcategories.length > 0) {
        vendorQuery = vendorQuery.in('subcategory', selectedSubcategories);
      }
      if (minRating > 0) {
        vendorQuery = vendorQuery.gte('star_rating', minRating);
      }
      if (verifiedOnly) {
        vendorQuery = vendorQuery.eq('is_verified', true);
      }

      const { data: vendorResults } = await vendorQuery;
      setVendors((vendorResults as Vendor[]) || []);
      setPosts([]);
    }

    setLoading(false);
  }, [selectedSubcategories, minRating, verifiedOnly]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, doSearch]);

  useEffect(() => {
    doSearch(query);
  }, [selectedSubcategories, minRating, verifiedOnly, sort]);

  useEffect(() => {
    supabase
      .from('vendors')
      .select('subcategory')
      .then(({ data }) => {
        if (data) {
          const uniq = [...new Set((data as { subcategory: string }[]).map((v) => v.subcategory).filter(Boolean))];
          setSubcategories(uniq.sort());
        }
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="space-y-6">
        <SearchBar value={query} onChange={setQuery} />

        <FilterBar
          subcategories={subcategories}
          selectedSubcategories={selectedSubcategories}
          onSubcategoriesChange={setSelectedSubcategories}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceChange={(min, max) => { setMinPrice(min); setMaxPrice(max); }}
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
            {vendors.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">
                  Vendors ({vendors.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendors.map((vendor) => (
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

            {vendors.length === 0 && posts.length === 0 && !loading && (
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
