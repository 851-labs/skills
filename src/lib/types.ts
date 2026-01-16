// Registry source configuration
interface RegistrySource {
  owner: string;
  repo: string;
  branch: string;
  skillsPath: string;
}

interface RegistrySources {
  repositories: RegistrySource[];
}

// Skill data from SKILL.md frontmatter
interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
}

// Full skill entry in the registry
interface Skill {
  // From frontmatter
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;

  // Source information
  source: {
    owner: string;
    repo: string;
    path: string;
    branch: string;
    githubUrl: string;
    rawSkillMdUrl: string;
  };

  // Computed
  id: string;
  category?: string;
  tags: string[];

  // Repo metadata
  repoStars: number;
  repoDescription?: string;
  updatedAt: string;
}

// Generated registry file
interface Registry {
  generatedAt: string;
  skills: Skill[];
}

// KV cache entry for skill content
interface CachedSkillContent {
  content: string;
  etag: string;
  cachedAt: number;
}

// KV cache entry for repo metadata
interface CachedRepoMeta {
  stars: number;
  description: string;
  updatedAt: string;
  cachedAt: number;
}

// Categories for filtering
const SKILL_CATEGORIES = [
  { id: "ios-swift", label: "iOS / Swift" },
  { id: "react-web", label: "React / Web" },
  { id: "documents", label: "Documents" },
  { id: "design", label: "Design" },
  { id: "devops", label: "DevOps" },
  { id: "creative", label: "Creative" },
  { id: "enterprise", label: "Enterprise" },
] as const;

type SkillCategory = (typeof SKILL_CATEGORIES)[number]["id"];

export type {
  CachedRepoMeta,
  CachedSkillContent,
  Registry,
  RegistrySource,
  RegistrySources,
  Skill,
  SkillCategory,
  SkillFrontmatter,
};

export { SKILL_CATEGORIES };
