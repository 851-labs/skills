/**
 * Queue message for processing a GitHub repository
 * Sent by the cron producer, consumed by the worker
 */
interface DiscoveryJobMessage {
  /** Repository full name (e.g., "anthropics/skills") */
  repoFullName: string;
  /** Owner login (e.g., "anthropics") */
  owner: string;
  /** Repository name (e.g., "skills") */
  repo: string;
  /** Default branch */
  defaultBranch: string;
  /** Star count at discovery time */
  stars: number;
  /** Whether the repo is a fork */
  isFork: boolean;
  /** Owner type ("User" or "Organization") */
  ownerType: string;
  /** Owner avatar URL */
  ownerAvatarUrl: string;
  /** Repository description */
  description: string | null;
  /** License SPDX ID */
  license: string | null;
}

export type { DiscoveryJobMessage };
