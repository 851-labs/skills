import { env } from "cloudflare:workers";

import { searchSkillMdRepos } from "@/lib/github";

import type { DiscoveryJobMessage } from "./types";

/**
 * Discover all repositories with SKILL.md files on GitHub and enqueue them for processing
 * Called by the scheduled handler on cron trigger (daily at 6 AM UTC)
 */
async function produceDiscoveryJobs(): Promise<void> {
  const startTime = Date.now();
  console.log(`[producer] Starting discovery at ${new Date().toISOString()}`);

  const token = env.GITHUB_TOKEN;
  if (!token) {
    console.error("[producer] GITHUB_TOKEN not configured, skipping discovery");
    return;
  }

  try {
    // Search GitHub for all repos with SKILL.md files
    const repos = await searchSkillMdRepos(token);
    console.log(`[producer] Found ${repos.length} repositories with SKILL.md files`);

    // Enqueue each repository for processing
    let enqueued = 0;
    for (const repo of repos) {
      const message: DiscoveryJobMessage = {
        repoFullName: repo.fullName,
        owner: repo.owner,
        repo: repo.name,
        defaultBranch: repo.defaultBranch,
        stars: repo.stars,
        isFork: repo.isFork,
        ownerType: repo.ownerType,
        ownerAvatarUrl: repo.ownerAvatarUrl,
        description: repo.description,
        license: repo.license,
      };

      await env.DISCOVERY_QUEUE.send(message);
      enqueued++;
    }

    const duration = Date.now() - startTime;
    console.log(`[producer] Enqueued ${enqueued} repositories in ${duration}ms`);
  } catch (error) {
    console.error("[producer] Discovery failed:", error);
    throw error;
  }
}

export { produceDiscoveryJobs };
