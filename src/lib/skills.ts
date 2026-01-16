import type { Registry, Skill } from "./types";

// Import registry data - this will be generated at build time
// For now, we'll use a dynamic import pattern
let cachedRegistry: Registry | null = null;

async function loadRegistry(): Promise<Registry> {
  if (cachedRegistry) {
    return cachedRegistry;
  }

  try {
    // Import the generated registry
    const registryModule = await import("../../registry.json");
    cachedRegistry = registryModule.default as Registry;
    return cachedRegistry;
  } catch {
    // Return empty registry if file doesn't exist yet
    return {
      generatedAt: new Date().toISOString(),
      skills: [],
    };
  }
}

// Get all skills
async function getAllSkills(): Promise<Skill[]> {
  const registry = await loadRegistry();
  return registry.skills;
}

// Get a skill by ID (owner/repo/skill-name)
async function getSkillById(id: string): Promise<Skill | null> {
  const skills = await getAllSkills();
  return skills.find((s) => s.id === id) || null;
}

// Get skills by owner
async function getSkillsByOwner(owner: string): Promise<Skill[]> {
  const skills = await getAllSkills();
  return skills.filter((s) => s.source.owner.toLowerCase() === owner.toLowerCase());
}

// Get skills by owner and repo
async function getSkillsByRepo(owner: string, repo: string): Promise<Skill[]> {
  const skills = await getAllSkills();
  return skills.filter(
    (s) =>
      s.source.owner.toLowerCase() === owner.toLowerCase() &&
      s.source.repo.toLowerCase() === repo.toLowerCase(),
  );
}

// Get unique owners
async function getOwners(): Promise<{ owner: string; count: number; stars: number }[]> {
  const skills = await getAllSkills();
  const ownerMap = new Map<string, { count: number; stars: number }>();

  for (const skill of skills) {
    const existing = ownerMap.get(skill.source.owner) || { count: 0, stars: 0 };
    ownerMap.set(skill.source.owner, {
      count: existing.count + 1,
      stars: Math.max(existing.stars, skill.repoStars),
    });
  }

  return Array.from(ownerMap.entries())
    .map(([owner, data]) => ({ owner, ...data }))
    .sort((a, b) => b.stars - a.stars);
}

// Get unique repos
async function getRepos(): Promise<
  { owner: string; repo: string; count: number; stars: number; description?: string }[]
> {
  const skills = await getAllSkills();
  const repoMap = new Map<
    string,
    { owner: string; repo: string; count: number; stars: number; description?: string }
  >();

  for (const skill of skills) {
    const key = `${skill.source.owner}/${skill.source.repo}`;
    const existing = repoMap.get(key);

    if (!existing) {
      repoMap.set(key, {
        owner: skill.source.owner,
        repo: skill.source.repo,
        count: 1,
        stars: skill.repoStars,
        description: skill.repoDescription,
      });
    } else {
      existing.count += 1;
    }
  }

  return Array.from(repoMap.values()).sort((a, b) => b.stars - a.stars);
}

// Get skills by category
async function getSkillsByCategory(category: string): Promise<Skill[]> {
  const skills = await getAllSkills();
  return skills.filter((s) => s.category === category);
}

// Get all unique categories with counts
async function getCategories(): Promise<{ category: string; count: number }[]> {
  const skills = await getAllSkills();
  const categoryMap = new Map<string, number>();

  for (const skill of skills) {
    if (skill.category) {
      categoryMap.set(skill.category, (categoryMap.get(skill.category) || 0) + 1);
    }
  }

  return Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

// Generate install command for a skill
function getInstallCommand(skill: Skill): string {
  const { owner, repo, path } = skill.source;
  return `git clone --depth 1 --filter=blob:none --sparse https://github.com/${owner}/${repo}.git && cd ${repo} && git sparse-checkout set ${path}`;
}

// Generate curl command to download SKILL.md
function getCurlCommand(skill: Skill): string {
  return `curl -sL ${skill.source.rawSkillMdUrl}`;
}

export {
  getAllSkills,
  getCategories,
  getCurlCommand,
  getInstallCommand,
  getOwners,
  getRepos,
  getSkillById,
  getSkillsByCategory,
  getSkillsByOwner,
  getSkillsByRepo,
  loadRegistry,
};
