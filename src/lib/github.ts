import type { SkillFrontmatter } from "./types";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";

interface GitHubTreeItem {
  path: string;
  type: "blob" | "tree";
  sha: string;
}

interface GitHubTreeResponse {
  tree: GitHubTreeItem[];
  truncated: boolean;
}

interface GitHubRepoResponse {
  stargazers_count: number;
  description: string | null;
  pushed_at: string;
}

interface FetchWithETagResult {
  content: string | null;
  etag: string | null;
  notModified: boolean;
}

// Fetch content with ETag support for conditional requests
async function fetchWithETag(
  url: string,
  previousEtag?: string,
  token?: string,
): Promise<FetchWithETagResult> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "skills.surf",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (previousEtag) {
    headers["If-None-Match"] = previousEtag;
  }

  const response = await fetch(url, { headers });

  if (response.status === 304) {
    return {
      content: null,
      etag: previousEtag || null,
      notModified: true,
    };
  }

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const content = await response.text();
  const etag = response.headers.get("etag");

  return {
    content,
    etag,
    notModified: false,
  };
}

// Get repository metadata (stars, description, etc.)
async function getRepoMetadata(
  owner: string,
  repo: string,
  token?: string,
): Promise<{ stars: number; description: string; updatedAt: string }> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "skills.surf",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch repo metadata: ${response.status}`);
  }

  const data = (await response.json()) as GitHubRepoResponse;

  return {
    stars: data.stargazers_count,
    description: data.description || "",
    updatedAt: data.pushed_at,
  };
}

// List all directories in a path (to discover skills)
async function listSkillDirectories(
  owner: string,
  repo: string,
  branch: string,
  skillsPath: string,
  token?: string,
): Promise<string[]> {
  // Use the Trees API to get the full tree
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "skills.surf",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Failed to list repo tree: ${response.status}`);
  }

  const data = (await response.json()) as GitHubTreeResponse;

  // Find all SKILL.md files
  const skillMdFiles = data.tree.filter(
    (item) => item.type === "blob" && item.path.endsWith("SKILL.md"),
  );

  // Extract skill directory paths
  const skillDirs: string[] = [];

  for (const file of skillMdFiles) {
    const dirPath = file.path.replace(/\/SKILL\.md$/, "");

    // If skillsPath is set, only include skills under that path
    if (skillsPath) {
      if (dirPath.startsWith(skillsPath + "/") || dirPath === skillsPath) {
        skillDirs.push(dirPath);
      }
    } else {
      // If no skillsPath, include all SKILL.md files except root
      if (dirPath !== "SKILL.md" && file.path !== "SKILL.md") {
        skillDirs.push(dirPath);
      }
    }
  }

  return skillDirs;
}

// Fetch raw SKILL.md content
async function fetchSkillMd(
  owner: string,
  repo: string,
  branch: string,
  skillPath: string,
  previousEtag?: string,
  token?: string,
): Promise<FetchWithETagResult> {
  const url = `${GITHUB_RAW_BASE}/${owner}/${repo}/${branch}/${skillPath}/SKILL.md`;
  return fetchWithETag(url, previousEtag, token);
}

// Parse SKILL.md frontmatter using gray-matter
function parseSkillMd(content: string): { frontmatter: SkillFrontmatter; body: string } {
  // Dynamic import would be better but for simplicity we'll handle it inline
  // The actual parsing happens in the indexer script with gray-matter

  // Simple YAML frontmatter parser for runtime use
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    throw new Error("Invalid SKILL.md format: missing frontmatter");
  }

  const yamlContent = frontmatterMatch[1];
  const body = frontmatterMatch[2];

  // Simple YAML parsing for basic key-value pairs
  const frontmatter: Record<string, unknown> = {};
  const lines = yamlContent.split("\n");

  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      // Remove quotes if present
      frontmatter[key] = value.replace(/^["']|["']$/g, "");
    }
  }

  return {
    frontmatter: frontmatter as unknown as SkillFrontmatter,
    body,
  };
}

// Build GitHub URL for a skill
function buildGitHubUrl(owner: string, repo: string, branch: string, path: string): string {
  return `https://github.com/${owner}/${repo}/tree/${branch}/${path}`;
}

// Build raw URL for SKILL.md
function buildRawSkillMdUrl(owner: string, repo: string, branch: string, path: string): string {
  return `${GITHUB_RAW_BASE}/${owner}/${repo}/${branch}/${path}/SKILL.md`;
}

export {
  buildGitHubUrl,
  buildRawSkillMdUrl,
  fetchSkillMd,
  fetchWithETag,
  getRepoMetadata,
  listSkillDirectories,
  parseSkillMd,
};
