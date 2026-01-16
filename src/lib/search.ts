import Fuse, { type IFuseOptions } from "fuse.js";

import type { Skill } from "./types";

// Fuse.js options for skill search
const fuseOptions: IFuseOptions<Skill> = {
  keys: [
    { name: "name", weight: 2 },
    { name: "description", weight: 1.5 },
    { name: "source.owner", weight: 0.5 },
    { name: "source.repo", weight: 0.5 },
    { name: "tags", weight: 0.8 },
    { name: "category", weight: 0.6 },
  ],
  threshold: 0.4,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

// Create a search index from skills
function createSearchIndex(skills: Skill[]): Fuse<Skill> {
  return new Fuse(skills, fuseOptions);
}

// Search skills
function searchSkills(index: Fuse<Skill>, query: string): Skill[] {
  if (!query.trim()) {
    return [];
  }

  const results = index.search(query);
  return results.map((r) => r.item);
}

// Filter skills by category
function filterByCategory(skills: Skill[], category: string | null): Skill[] {
  if (!category) {
    return skills;
  }

  return skills.filter((s) => s.category === category);
}

// Filter skills by multiple categories
function filterByCategories(skills: Skill[], categories: string[]): Skill[] {
  if (categories.length === 0) {
    return skills;
  }

  return skills.filter((s) => s.category && categories.includes(s.category));
}

// Sort skills
type SortOption = "stars" | "name" | "recent";

function sortSkills(skills: Skill[], sortBy: SortOption): Skill[] {
  const sorted = [...skills];

  switch (sortBy) {
    case "stars":
      return sorted.sort((a, b) => b.repoStars - a.repoStars);
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "recent":
      return sorted.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    default:
      return sorted;
  }
}

export { createSearchIndex, filterByCategories, filterByCategory, searchSkills, sortSkills };
export type { SortOption };
