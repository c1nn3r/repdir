'use client';

interface CategoryPillsProps {
  categories: string[];
  active: string;
  onChange: (cat: string) => void;
}

export function CategoryPills({ categories, active, onChange }: CategoryPillsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onChange('')}
        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
          active === ''
            ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
            : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]'
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(active === cat ? '' : cat)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
            active === cat
              ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
              : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--foreground)] hover:border-[var(--foreground)]'
          }`}
        >
          r/{cat}
        </button>
      ))}
    </div>
  );
}
