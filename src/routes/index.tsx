import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import type { Skill } from "@/lib/types";

import { FilterSidebar } from "@/components/filter-sidebar";
import { SearchBar } from "@/components/search-bar";
import { SkillCard } from "@/components/skill-card";
import { getAllSkillsFn } from "@/lib/api/skills.server";
import { createSearchIndex, filterByCategories, searchSkills, sortSkills } from "@/lib/search";

function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Load skills on mount
  useMemo(() => {
    void getAllSkillsFn().then((data) => {
      setSkills(data);
      setLoading(false);
    });
  }, []);

  // Create search index
  const searchIndex = useMemo(() => createSearchIndex(skills), [skills]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const skill of skills) {
      if (skill.category) {
        counts.set(skill.category, (counts.get(skill.category) || 0) + 1);
      }
    }
    return counts;
  }, [skills]);

  // Filter and sort skills
  const filteredSkills = useMemo(() => {
    let result: Skill[];

    // If searching, use search results
    if (searchQuery.trim()) {
      result = searchSkills(searchIndex, searchQuery);
    } else {
      result = skills;
    }

    // Apply category filter
    result = filterByCategories(result, selectedCategories);

    // Sort by stars
    result = sortSkills(result, "stars");

    return result;
  }, [skills, searchQuery, searchIndex, selectedCategories]);

  // Stats
  const repoCount = useMemo(() => {
    const repos = new Set(skills.map((s) => `${s.source.owner}/${s.source.repo}`));
    return repos.size;
  }, [skills]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 font-mono text-3xl font-bold text-text-primary sm:text-4xl">
          Discover Agent Skills
        </h1>
        <p className="mb-8 text-text-secondary">Browse and install skills for AI coding agents</p>

        <div className="mx-auto max-w-xl">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        <p className="mt-4 font-mono text-sm text-text-tertiary">
          {repoCount} repositories &middot; {skills.length} skills
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar */}
        <FilterSidebar
          selectedCategories={selectedCategories}
          onCategoryChange={setSelectedCategories}
          categoryCounts={categoryCounts}
        />

        {/* Skills Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="py-12 text-center">
              <p className="font-mono text-text-tertiary">Loading skills...</p>
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="border border-border bg-bg-secondary p-12 text-center">
              <p className="font-mono text-text-secondary">No skills found</p>
              <p className="mt-2 text-sm text-text-tertiary">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredSkills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Route = createFileRoute("/")({
  component: HomePage,
});

export { Route };
