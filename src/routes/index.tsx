import { useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { useMemo } from "react";
import { z } from "zod";

import { FilterSidebar } from "@/components/filter-sidebar";
import { LoadMoreButton } from "@/components/load-more-button";
import { SearchBar } from "@/components/search-bar";
import { SkillCard } from "@/components/skill-card";
import { api } from "@/lib/api";

// Search params schema with validation and defaults
const searchParamsSchema = z.object({
  q: fallback(z.string().optional(), ""),
  categories: fallback(z.array(z.string()).optional(), []),
});

function HomePage() {
  const search = Route.useSearch();
  const q = search.q ?? "";
  const categories = search.categories ?? [];
  const navigate = useNavigate({ from: Route.fullPath });

  // Stats (lightweight aggregate query, always fast)
  const { data: stats } = useSuspenseQuery(api.skills.stats.queryOptions());

  // Infinite paginated skills
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(
    api.skills.paginated.infiniteQueryOptions({
      search: q || undefined,
      categories: categories.length > 0 ? categories : undefined,
    }),
  );

  // Flatten pages into single array
  const skills = useMemo(() => data.pages.flatMap((page) => page.skills), [data.pages]);

  // URL state handlers
  const setSearch = (value: string) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        q: value || undefined,
      }),
      replace: true,
    });
  };

  const setCategories = (value: string[]) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        categories: value.length > 0 ? value : undefined,
      }),
      replace: true,
    });
  };

  const hasFilters = q || categories.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 font-mono text-3xl font-bold text-text-primary sm:text-4xl">
          Discover Agent Skills
        </h1>
        <p className="mb-8 text-text-secondary">Browse and install skills for AI coding agents</p>

        <div className="mx-auto max-w-xl">
          <SearchBar value={q} onChange={setSearch} />
        </div>

        <p className="mt-4 font-mono text-sm text-text-tertiary">
          {stats.totalRepos} repositories &middot; {stats.totalSkills} skills
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar */}
        <FilterSidebar
          selectedCategories={categories}
          onCategoryChange={setCategories}
          categoryCounts={stats.categoryCounts}
        />

        {/* Skills Grid */}
        <div className="flex-1">
          {skills.length === 0 ? (
            <div className="border border-border bg-bg-secondary p-12 text-center">
              <p className="font-mono text-text-secondary">
                {hasFilters ? `No skills found matching "${q}"` : "No skills found"}
              </p>
              {hasFilters && (
                <button
                  onClick={() => {
                    setSearch("");
                    setCategories([]);
                  }}
                  className="mt-4 text-sm text-accent hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {skills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>

              <LoadMoreButton
                onClick={() => fetchNextPage()}
                isLoading={isFetchingNextPage}
                hasMore={hasNextPage}
                loadedCount={skills.length}
                totalCount={stats.totalSkills}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const Route = createFileRoute("/")({
  component: HomePage,
  validateSearch: zodValidator(searchParamsSchema),
  loaderDeps: ({ search }) => ({ q: search.q ?? "", categories: search.categories ?? [] }),
  loader: async ({ context: { queryClient }, deps }) => {
    // Prefetch stats and first page in parallel
    await Promise.all([
      queryClient.ensureQueryData(api.skills.stats.queryOptions()),
      queryClient.ensureInfiniteQueryData(
        api.skills.paginated.infiniteQueryOptions({
          search: deps.q || undefined,
          categories: deps.categories.length > 0 ? deps.categories : undefined,
        }),
      ),
    ]);
  },
});

export { Route };
