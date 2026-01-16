import type { CachedRepoMeta, CachedSkillContent } from "./types";

// Cache TTL in milliseconds
const STALE_AFTER_MS = 5 * 60 * 1000; // 5 minutes - consider content stale
const EXPIRE_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours - hard expiration

// Key prefixes for different cache types
const SKILL_CONTENT_PREFIX = "skill:";
const REPO_META_PREFIX = "repo:";

// Build cache key for skill content
function skillContentKey(owner: string, repo: string, skillPath: string): string {
  return `${SKILL_CONTENT_PREFIX}${owner}/${repo}/${skillPath}`;
}

// Build cache key for repo metadata
function repoMetaKey(owner: string, repo: string): string {
  return `${REPO_META_PREFIX}${owner}/${repo}`;
}

// Check if cached content is stale (should revalidate in background)
function isStale(cachedAt: number): boolean {
  return Date.now() - cachedAt > STALE_AFTER_MS;
}

// Check if cached content has expired (must refetch)
function isExpired(cachedAt: number): boolean {
  return Date.now() - cachedAt > EXPIRE_AFTER_MS;
}

// Get skill content from KV cache
async function getSkillContent(
  kv: KVNamespace,
  owner: string,
  repo: string,
  skillPath: string,
): Promise<CachedSkillContent | null> {
  const key = skillContentKey(owner, repo, skillPath);
  const cached = await kv.get<CachedSkillContent>(key, "json");

  if (!cached) {
    return null;
  }

  // If hard expired, treat as cache miss
  if (isExpired(cached.cachedAt)) {
    return null;
  }

  return cached;
}

// Set skill content in KV cache
async function setSkillContent(
  kv: KVNamespace,
  owner: string,
  repo: string,
  skillPath: string,
  content: string,
  etag: string,
): Promise<void> {
  const key = skillContentKey(owner, repo, skillPath);
  const value: CachedSkillContent = {
    content,
    etag,
    cachedAt: Date.now(),
  };

  // Set with 24-hour expiration
  await kv.put(key, JSON.stringify(value), {
    expirationTtl: Math.floor(EXPIRE_AFTER_MS / 1000),
  });
}

// Get repo metadata from KV cache
async function getRepoMeta(
  kv: KVNamespace,
  owner: string,
  repo: string,
): Promise<CachedRepoMeta | null> {
  const key = repoMetaKey(owner, repo);
  const cached = await kv.get<CachedRepoMeta>(key, "json");

  if (!cached) {
    return null;
  }

  if (isExpired(cached.cachedAt)) {
    return null;
  }

  return cached;
}

// Set repo metadata in KV cache
async function setRepoMeta(
  kv: KVNamespace,
  owner: string,
  repo: string,
  stars: number,
  description: string,
  updatedAt: string,
): Promise<void> {
  const key = repoMetaKey(owner, repo);
  const value: CachedRepoMeta = {
    stars,
    description,
    updatedAt,
    cachedAt: Date.now(),
  };

  await kv.put(key, JSON.stringify(value), {
    expirationTtl: Math.floor(EXPIRE_AFTER_MS / 1000),
  });
}

export {
  getRepoMeta,
  getSkillContent,
  isExpired,
  isStale,
  repoMetaKey,
  setRepoMeta,
  setSkillContent,
  skillContentKey,
};
