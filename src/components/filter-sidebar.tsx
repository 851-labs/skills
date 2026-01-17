import { SKILL_CATEGORIES } from "@/lib/types";

interface FilterSidebarProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
  categoryCounts: Map<string, number>;
}

function FilterSidebar({
  selectedCategories,
  onCategoryChange,
  categoryCounts,
}: FilterSidebarProps) {
  function toggleCategory(categoryId: string) {
    if (selectedCategories.includes(categoryId)) {
      onCategoryChange(selectedCategories.filter((c) => c !== categoryId));
    } else {
      onCategoryChange([...selectedCategories, categoryId]);
    }
  }

  return (
    <aside className="w-full shrink-0 lg:w-48">
      <div className="border border-border bg-bg-secondary p-4">
        <h3 className="mb-3 border-b border-border pb-2 font-mono text-xs font-bold uppercase tracking-wider text-text-tertiary">
          Filter by Category
        </h3>
        <div className="space-y-2">
          {SKILL_CATEGORIES.map((category) => {
            const count = categoryCounts.get(category.id) || 0;
            const isSelected = selectedCategories.includes(category.id);

            return (
              <label key={category.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCategory(category.id)}
                  className="h-4 w-4 appearance-none border border-border bg-bg-primary checked:border-accent checked:bg-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <span className={isSelected ? "text-text-primary" : "text-text-secondary"}>
                  {category.label}
                </span>
                <span className="ml-auto font-mono text-xs text-text-tertiary">{count}</span>
              </label>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

export { FilterSidebar };
