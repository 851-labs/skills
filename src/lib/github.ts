import type { SkillFrontmatter } from "./types";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";

// ============================================================================
// Types
// ============================================================================

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
  default_branch: string;
  fork: boolean;
  license: { spdx_id: string } | null;
  owner: {
    login: string;
    type: string;
    avatar_url: string;
    html_url: string;
  };
  full_name: string;
  html_url: string;
}

interface GitHubSearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{
    repository: {
      full_name: string;
      owner: {
        login: string;
        type: string;
        avatar_url: string;
        html_url: string;
      };
      name: string;
      description: string | null;
      html_url: string;
      // Note: Code Search API returns limited repo info - no stars, default_branch, license
      fork: boolean;
    };
  }>;
}

/** Repository info returned from search */
interface DiscoveredRepo {
  fullName: string;
  owner: string;
  ownerType: string;
  ownerAvatarUrl: string;
  ownerHtmlUrl: string;
  name: string;
  description: string | null;
  htmlUrl: string;
  stars: number;
  defaultBranch: string;
  isFork: boolean;
  license: string | null;
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

// ============================================================================
// GitHub Search API - for discovering SKILL.md files across all of GitHub
// ============================================================================

/**
 * Search GitHub for all repositories containing SKILL.md files
 * Uses the GitHub Code Search API with pagination
 *
 * Note: GitHub Code Search API has rate limits:
 * - 10 requests per minute for unauthenticated
 * - 30 requests per minute for authenticated
 * - Max 1000 results per query
 */
async function searchSkillMdRepos(token: string): Promise<DiscoveredRepo[]> {
  const repos = new Map<string, DiscoveredRepo>();
  const perPage = 100;

  console.log(`[GitHub Search] Starting search for SKILL.md files`);

  // Search with multiple queries to find Agent Skills specifically
  // The basic filename search returns too much noise (57k+ results)
  // We use content-based searches to find files with frontmatter patterns
  const searchQueries = [
    "filename:SKILL.md name description compatibility", // Agent Skills format
    "filename:SKILL.md org:anthropics", // Official Anthropic skills
    "filename:SKILL.md org:851-labs", // Our skills
    "filename:SKILL.md claude skill agent", // Related keywords
  ];

  for (const query of searchQueries) {
    console.log(`[GitHub Search] Query: ${query}`);
    let page = 1;

    while (true) {
      const url = new URL(`${GITHUB_API_BASE}/search/code`);
      url.searchParams.set("q", query);
      url.searchParams.set("per_page", perPage.toString());
      url.searchParams.set("page", page.toString());

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "skills.surf",
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          // Rate limited - log and continue to next query
          console.warn(
            `[GitHub Search] Rate limited at page ${page}, moving to next query (${repos.size} repos so far)`,
          );
          break;
        }
        throw new Error(`GitHub search failed: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as GitHubSearchResult;
      console.log(
        `[GitHub Search] Page ${page}: ${data.items.length} results (total: ${data.total_count})`,
      );

      // Extract unique repos from search results
      for (const item of data.items) {
        const repo = item.repository;
        if (!repos.has(repo.full_name)) {
          repos.set(repo.full_name, {
            fullName: repo.full_name,
            owner: repo.owner.login,
            ownerType: repo.owner.type,
            ownerAvatarUrl: repo.owner.avatar_url,
            ownerHtmlUrl: repo.owner.html_url,
            name: repo.name,
            description: repo.description,
            htmlUrl: repo.html_url,
            stars: 0, // Will be fetched by consumer
            defaultBranch: "main", // Will be fetched by consumer
            isFork: repo.fork,
            license: null, // Will be fetched by consumer
          });
        }
      }

      // Check if we've reached the end of this query's results
      if (data.items.length < perPage || page * perPage >= 1000) {
        break;
      }

      page++;

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Delay between queries to be nice to GitHub API
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`[GitHub Search] Found ${repos.size} unique repositories with SKILL.md`);
  return Array.from(repos.values());
}

/**
 * Get full repository info including owner details
 * Used when we need more details than the search API provides
 * Returns null if repo doesn't exist (404)
 */
async function getFullRepoInfo(
  owner: string,
  repo: string,
  token: string,
): Promise<DiscoveredRepo | null> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "skills.surf",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      console.log(`[getFullRepoInfo] Repo ${owner}/${repo} not found (404)`);
      return null;
    }
    throw new Error(`Failed to fetch repo info: ${response.status}`);
  }

  const data = (await response.json()) as GitHubRepoResponse;

  return {
    fullName: data.full_name,
    owner: data.owner.login,
    ownerType: data.owner.type,
    ownerAvatarUrl: data.owner.avatar_url,
    ownerHtmlUrl: data.owner.html_url,
    name: repo,
    description: data.description,
    htmlUrl: data.html_url,
    stars: data.stargazers_count,
    defaultBranch: data.default_branch,
    isFork: data.fork,
    license: data.license?.spdx_id ?? null,
  };
}

/**
 * Find all SKILL.md files in a repository
 * Returns the directory paths containing SKILL.md files
 */
async function findSkillMdPaths(
  owner: string,
  repo: string,
  branch: string,
  token: string,
): Promise<string[]> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "skills.surf",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      // Repo doesn't exist, was deleted, or is private - return empty array
      console.log(`[findSkillMdPaths] Repo ${owner}/${repo} not found (404)`);
      return [];
    }
    throw new Error(`Failed to fetch repo tree: ${response.status}`);
  }

  const data = (await response.json()) as GitHubTreeResponse;

  // Find all SKILL.md files and return their parent directories
  const paths: string[] = [];
  for (const item of data.tree) {
    if (item.type !== "blob") continue;

    if (item.path === "SKILL.md") {
      // Root-level SKILL.md - use empty string as path
      paths.push("");
    } else if (item.path.endsWith("/SKILL.md")) {
      // Nested SKILL.md - extract parent directory
      paths.push(item.path.replace(/\/SKILL\.md$/, ""));
    }
  }
  return paths;
}

/**
 * Fetch raw content from GitHub
 */
async function fetchRawContent(
  owner: string,
  repo: string,
  branch: string,
  path: string,
  token: string,
): Promise<string> {
  const url = `${GITHUB_RAW_BASE}/${owner}/${repo}/${branch}/${path}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "skills.surf",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  return response.text();
}

export {
  buildGitHubUrl,
  buildRawSkillMdUrl,
  fetchRawContent,
  fetchSkillMd,
  fetchWithETag,
  findSkillMdPaths,
  getFullRepoInfo,
  getRepoMetadata,
  listSkillDirectories,
  parseSkillMd,
  searchSkillMdRepos,
};

export type { DiscoveredRepo };
