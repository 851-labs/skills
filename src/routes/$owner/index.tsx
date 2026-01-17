import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Star } from "lucide-react";
import { useMemo } from "react";

import { LoadMoreButton } from "@/components/load-more-button";
import { SkillCard } from "@/components/skill-card";
import { api } from "@/lib/api";

function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}k`;
  }
  return stars.toString();
}

function OwnerPage() {
  const { owner } = Route.useParams();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(
    api.skills.byOwner.infiniteQueryOptions({ owner }),
  );

  // Flatten pages into single array
  const skills = useMemo(() => data.pages.flatMap((page) => page.skills), [data.pages]);

  // Get unique repos for this owner
  const repos = useMemo(() => {
    const repoMap = new Map<string, { count: number; stars: number; description?: string }>();
    for (const skill of skills) {
      const key = skill.source.repo;
      const existing = repoMap.get(key);
      if (!existing) {
        repoMap.set(key, {
          count: 1,
          stars: skill.repoStars,
          description: skill.repoDescription,
        });
      } else {
        existing.count += 1;
      }
    }
    return Array.from(repoMap.entries()).map(([repo, repoData]) => ({ repo, ...repoData }));
  }, [skills]);

  // Calculate total stars
  const totalStars = useMemo(() => {
    const maxStars = new Map<string, number>();
    for (const skill of skills) {
      const key = skill.source.repo;
      maxStars.set(key, Math.max(maxStars.get(key) || 0, skill.repoStars));
    }
    return Array.from(maxStars.values()).reduce((a, b) => a + b, 0);
  }, [skills]);

  if (skills.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <a
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all skills
        </a>
        <div className="border border-border bg-bg-secondary p-12 text-center">
          <p className="font-mono text-text-secondary">No skills found for {owner}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <a
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-secondary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all skills
      </a>

      {/* Header */}
      <div className="mb-8 border border-border bg-bg-secondary p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 font-mono text-2xl font-bold text-text-primary">{owner}</h1>
            <div className="flex items-center gap-4 text-sm text-text-tertiary">
              <span>{repos.length} repositories</span>
              <span>&middot;</span>
              <span>{skills.length} skills</span>
              <span>&middot;</span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {formatStars(totalStars)} total
              </span>
            </div>
          </div>
          <a
            href={`https://github.com/${owner}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-accent"
          >
            <ExternalLink className="h-4 w-4" />
            GitHub
          </a>
        </div>
      </div>

      {/* Skills Grid */}
      <h2 className="mb-4 border-b border-border pb-2 font-mono text-sm font-bold text-text-tertiary">
        All Skills
      </h2>
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
        totalCount={skills.length} // We don't have total for owner-specific, just show loaded
      />
    </div>
  );
}

const Route = createFileRoute("/$owner/")({
  component: OwnerPage,
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureInfiniteQueryData(
      api.skills.byOwner.infiniteQueryOptions({ owner: params.owner }),
    );
  },
});

export { Route };
