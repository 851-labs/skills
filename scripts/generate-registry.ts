/**
 * Registry Generation Script
 *
 * This script scans the repositories listed in registry-sources.json,
 * discovers all skills (folders with SKILL.md), parses their frontmatter,
 * and generates a registry.json file with all skill metadata.
 *
 * Run with: bun run scripts/generate-registry.ts
 */

import fs from "fs/promises";
import matter from "gray-matter";
import path from "path";

interface RegistrySource {
  owner: string;
  repo: string;
  branch: string;
  skillsPath: string;
}

interface SkillFrontmatter {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
}

interface Skill {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  source: {
    owner: string;
    repo: string;
    path: string;
    branch: string;
    githubUrl: string;
    rawSkillMdUrl: string;
  };
  id: string;
  category?: string;
  tags: string[];
  repoStars: number;
  repoDescription?: string;
  updatedAt: string;
}

interface Registry {
  generatedAt: string;
  skills: Skill[];
}

interface GitHubTreeItem {
  path: string;
  type: "blob" | "tree";
}

interface GitHubTreeResponse {
  tree: GitHubTreeItem[];
}

interface GitHubRepoResponse {
  stargazers_count: number;
  description: string | null;
  pushed_at: string;
}

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Category inference based on keywords
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "ios-swift": ["swift", "ios", "swiftui", "xcode", "apple", "macos"],
  "react-web": ["react", "next", "nextjs", "web", "javascript", "typescript", "vercel"],
  documents: ["pdf", "docx", "xlsx", "pptx", "document", "excel", "word", "powerpoint"],
  design: ["design", "ui", "ux", "figma", "css", "tailwind", "style"],
  devops: ["deploy", "ci", "cd", "docker", "kubernetes", "aws", "cloud"],
  creative: ["art", "music", "creative", "generate", "image"],
  enterprise: ["enterprise", "business", "workflow", "communication"],
};

function inferCategory(skill: {
  name: string;
  description: string;
  path: string;
}): string | undefined {
  const text = `${skill.name} ${skill.description} ${skill.path}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return category;
    }
  }

  return undefined;
}

function extractTags(description: string): string[] {
  // Extract potential tags from description
  const words = description.toLowerCase().split(/\s+/);
  const commonTags = [
    "react",
    "swift",
    "ios",
    "web",
    "pdf",
    "api",
    "test",
    "deploy",
    "design",
    "ai",
    "llm",
    "code",
    "review",
  ];

  return commonTags.filter((tag) => words.some((w) => w.includes(tag)));
}

async function fetchWithAuth(url: string): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "skills.surf-registry-generator",
  };

  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
  }

  return fetch(url, { headers });
}

async function getRepoMetadata(
  owner: string,
  repo: string,
): Promise<{ stars: number; description: string; updatedAt: string }> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;
  const response = await fetchWithAuth(url);

  if (!response.ok) {
    console.error(`Failed to fetch repo metadata for ${owner}/${repo}: ${response.status}`);
    return { stars: 0, description: "", updatedAt: new Date().toISOString() };
  }

  const data = (await response.json()) as GitHubRepoResponse;

  return {
    stars: data.stargazers_count,
    description: data.description || "",
    updatedAt: data.pushed_at,
  };
}

async function listSkillDirectories(source: RegistrySource): Promise<string[]> {
  const { owner, repo, branch, skillsPath } = source;
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  const response = await fetchWithAuth(url);

  if (!response.ok) {
    console.error(`Failed to list tree for ${owner}/${repo}: ${response.status}`);
    return [];
  }

  const data = (await response.json()) as GitHubTreeResponse;

  // Find all SKILL.md files
  const skillMdFiles = data.tree.filter(
    (item) => item.type === "blob" && item.path.endsWith("SKILL.md"),
  );

  const skillDirs: string[] = [];

  for (const file of skillMdFiles) {
    // Get the directory containing SKILL.md
    const dirPath = file.path.replace(/\/SKILL\.md$/, "");

    // Handle root SKILL.md (file.path === "SKILL.md")
    if (file.path === "SKILL.md") {
      continue; // Skip root SKILL.md files
    }

    // If skillsPath is set, only include skills under that path
    if (skillsPath) {
      if (dirPath.startsWith(skillsPath + "/")) {
        skillDirs.push(dirPath);
      } else if (dirPath === skillsPath) {
        // The skillsPath itself is a skill
        skillDirs.push(dirPath);
      }
    } else {
      // No skillsPath filter, include all (except root)
      skillDirs.push(dirPath);
    }
  }

  return skillDirs;
}

async function fetchSkillMd(
  owner: string,
  repo: string,
  branch: string,
  skillPath: string,
): Promise<string | null> {
  const url = `${GITHUB_RAW_BASE}/${owner}/${repo}/${branch}/${skillPath}/SKILL.md`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch SKILL.md from ${url}: ${response.status}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

function parseSkillMd(content: string): SkillFrontmatter | null {
  try {
    const { data } = matter(content);

    if (!data.name || !data.description) {
      console.warn("SKILL.md missing required fields (name, description)");
      return null;
    }

    return {
      name: data.name,
      description: data.description,
      license: data.license,
      compatibility: data.compatibility,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error("Error parsing SKILL.md frontmatter:", error);
    return null;
  }
}

async function processSource(source: RegistrySource): Promise<Skill[]> {
  const { owner, repo, branch } = source;
  console.log(`Processing ${owner}/${repo}...`);

  // Get repo metadata
  const repoMeta = await getRepoMetadata(owner, repo);
  console.log(`  Stars: ${repoMeta.stars}`);

  // List skill directories
  const skillDirs = await listSkillDirectories(source);
  console.log(`  Found ${skillDirs.length} skills`);

  const skills: Skill[] = [];

  for (const skillPath of skillDirs) {
    const content = await fetchSkillMd(owner, repo, branch, skillPath);

    if (!content) {
      continue;
    }

    const frontmatter = parseSkillMd(content);

    if (!frontmatter) {
      console.warn(`  Skipping ${skillPath}: invalid frontmatter`);
      continue;
    }

    const skill: Skill = {
      name: frontmatter.name,
      description: frontmatter.description,
      license: frontmatter.license,
      compatibility: frontmatter.compatibility,
      metadata: frontmatter.metadata,
      source: {
        owner,
        repo,
        path: skillPath,
        branch,
        githubUrl: `https://github.com/${owner}/${repo}/tree/${branch}/${skillPath}`,
        rawSkillMdUrl: `${GITHUB_RAW_BASE}/${owner}/${repo}/${branch}/${skillPath}/SKILL.md`,
      },
      id: `${owner}/${repo}/${frontmatter.name}`,
      category: inferCategory({
        name: frontmatter.name,
        description: frontmatter.description,
        path: skillPath,
      }),
      tags: extractTags(frontmatter.description),
      repoStars: repoMeta.stars,
      repoDescription: repoMeta.description,
      updatedAt: repoMeta.updatedAt,
    };

    skills.push(skill);
    console.log(`  + ${frontmatter.name}`);
  }

  return skills;
}

async function main() {
  console.log("=== Skills Registry Generator ===\n");

  // Load registry sources
  const sourcesPath = path.join(process.cwd(), "registry-sources.json");
  const sourcesContent = await fs.readFile(sourcesPath, "utf-8");
  const sources = JSON.parse(sourcesContent) as { repositories: RegistrySource[] };

  console.log(`Loaded ${sources.repositories.length} repository sources\n`);

  // Process each source
  const allSkills: Skill[] = [];

  for (const source of sources.repositories) {
    const skills = await processSource(source);
    allSkills.push(...skills);
    console.log("");
  }

  // Sort skills by stars (descending), then by name
  allSkills.sort((a, b) => {
    if (b.repoStars !== a.repoStars) {
      return b.repoStars - a.repoStars;
    }
    return a.name.localeCompare(b.name);
  });

  // Create registry
  const registry: Registry = {
    generatedAt: new Date().toISOString(),
    skills: allSkills,
  };

  // Write registry.json
  const registryPath = path.join(process.cwd(), "registry.json");
  await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));

  console.log("=== Summary ===");
  console.log(`Total skills indexed: ${allSkills.length}`);
  console.log(`Registry written to: ${registryPath}`);

  // Print category breakdown
  const categoryCounts = new Map<string, number>();
  for (const skill of allSkills) {
    const cat = skill.category || "uncategorized";
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  }

  console.log("\nBy category:");
  for (const [cat, count] of Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }
}

main().catch(console.error);
