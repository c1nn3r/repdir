'use client';

interface FilterBarProps {
  subcategories: string[];
  selectedSubcategories: string[];
  onSubcategoriesChange: (selected: string[]) => void;
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
  minRating: number;
  onRatingChange: (rating: number) => void;
  verifiedOnly: boolean;
  onVerifiedChange: (v: boolean) => void;
  sort: string;
  onSortChange: (v: string) => void;
}

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'rating', label: 'Rating' },
  { value: 'reviews', label: 'Most Reviews' },
  { value: 'name', label: 'Name' },
];

export function FilterBar({
  subcategories,
  selectedSubcategories,
  onSubcategoriesChange,
  minRating,
  onRatingChange,
  verifiedOnly,
  onVerifiedChange,
  sort,
  onSortChange,
}: FilterBarProps) {
  const toggleSubcategory = (sub: string) => {
    if (selectedSubcategories.includes(sub)) {
      onSubcategoriesChange(selectedSubcategories.filter((s) => s !== sub));
    } else {
      onSubcategoriesChange([...selectedSubcategories, sub]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {subcategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {subcategories.map((sub) => (
              <button
                key={sub}
                onClick={() => toggleSubcategory(sub)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors ${
                  selectedSubcategories.includes(sub)
                    ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
                    : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--foreground)]'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => onRatingChange(minRating === r ? 0 : r)}
              className={`text-sm transition-colors ${
                minRating >= r
                  ? 'text-[var(--color-featured)]'
                  : 'text-[var(--color-border)] hover:text-[var(--color-featured)]'
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => onVerifiedChange(e.target.checked)}
            className="rounded border-[var(--color-border)]"
          />
          Verified only
        </label>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="text-xs border border-[var(--color-border)] rounded px-2 py-1 bg-[var(--color-card)] text-[var(--foreground)]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
