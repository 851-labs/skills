import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import {
  buildGitHubUrl,
  buildRawSkillMdUrl,
  fetchRawContent,
  findSkillMdPaths,
  getFullRepoInfo,
  parseSkillMd,
} from "@/lib/github";
import { inferCategory, inferTags } from "@/lib/skills";

import type { DiscoveryJobMessage } from "./types";

/**
 * Process a single repository: fetch all SKILL.md files and upsert to database
 */
async function processRepo(message: DiscoveryJobMessage): Promise<void> {
  const { repoFullName, owner, repo, ownerType, ownerAvatarUrl } = message;
  const log = `[consumer:${repoFullName}]`;

  console.log(`${log} Processing repository`);

  const token = env.GITHUB_TOKEN;
  if (!token) {
    console.error(`${log} GITHUB_TOKEN not configured`);
    return;
  }

  try {
    // 0. Fetch full repo info (Code Search API doesn't return stars, default_branch, license)
    const repoInfo = await getFullRepoInfo(owner, repo, token);
    if (!repoInfo) {
      console.log(`${log} Repository not found, skipping`);
      return;
    }
    const { defaultBranch, stars, isFork, license, description } = repoInfo;

    // 1. Upsert owner
    const ownerHtmlUrl = `https://github.com/${owner}`;
    await db
      .insert(schema.owners)
      .values({
        id: owner,
        login: owner,
        type: ownerType,
        avatarUrl: ownerAvatarUrl,
        htmlUrl: ownerHtmlUrl,
      })
      .onConflictDoUpdate({
        target: schema.owners.id,
        set: {
          type: ownerType,
          avatarUrl: ownerAvatarUrl,
          htmlUrl: ownerHtmlUrl,
          updatedAt: new Date(),
        },
      });

    console.log(`${log} Upserted owner: ${owner}`);

    // 2. Upsert repo
    const repoHtmlUrl = `https://github.com/${repoFullName}`;
    await db
      .insert(schema.repos)
      .values({
        id: repoFullName,
        ownerId: owner,
        name: repo,
        fullName: repoFullName,
        description: description,
        htmlUrl: repoHtmlUrl,
        stars: stars,
        defaultBranch: defaultBranch,
        isFork: isFork,
        license: license,
        lastSyncedAt: new Date(),
        deletedAt: null, // Clear soft delete if repo reappears
      })
      .onConflictDoUpdate({
        target: schema.repos.id,
        set: {
          description: description,
          stars: stars,
          defaultBranch: defaultBranch,
          isFork: isFork,
          license: license,
          lastSyncedAt: new Date(),
          deletedAt: null,
          updatedAt: new Date(),
        },
      });

    console.log(`${log} Upserted repo: ${repoFullName}`);

    // 3. Find all SKILL.md paths in the repo
    const skillPaths = await findSkillMdPaths(owner, repo, defaultBranch, token);
    console.log(`${log} Found ${skillPaths.length} SKILL.md files`);

    if (skillPaths.length === 0) {
      console.log(`${log} No skills found, marking repo as deleted`);
      await db
        .update(schema.repos)
        .set({ deletedAt: new Date() })
        .where(eq(schema.repos.id, repoFullName));
      return;
    }

    // 4. Process each skill
    const processedSkillIds: string[] = [];

    for (const skillPath of skillPaths) {
      try {
        // Fetch SKILL.md content - handle root-level (empty path) case
        const skillMdPath = skillPath ? `${skillPath}/SKILL.md` : "SKILL.md";
        const content = await fetchRawContent(owner, repo, defaultBranch, skillMdPath, token);
        const { frontmatter } = parseSkillMd(content);

        // Extract skill name from path (last segment) or use frontmatter name
        const skillName =
          frontmatter.name || (skillPath ? skillPath.split("/").pop() : repo) || repo;
        const skillId = `${repoFullName}/${skillName}`;
        const githubUrl = buildGitHubUrl(owner, repo, defaultBranch, skillPath);
        const rawUrl = buildRawSkillMdUrl(owner, repo, defaultBranch, skillPath);

        // Infer category and tags from frontmatter
        const category = inferCategory(frontmatter);
        const tagNames = inferTags(frontmatter);

        // Upsert skill
        await db
          .insert(schema.skills)
          .values({
            id: skillId,
            repoId: repoFullName,
            name: skillName,
            description: frontmatter.description || "",
            path: skillPath,
            githubUrl: githubUrl,
            rawUrl: rawUrl,
            license: frontmatter.license || null,
            category: category,
            compatibility: frontmatter.compatibility || null,
            metadata: frontmatter.metadata ? JSON.stringify(frontmatter.metadata) : null,
            deletedAt: null,
          })
          .onConflictDoUpdate({
            target: schema.skills.id,
            set: {
              name: skillName,
              description: frontmatter.description || "",
              path: skillPath,
              githubUrl: githubUrl,
              rawUrl: rawUrl,
              license: frontmatter.license || null,
              category: category,
              compatibility: frontmatter.compatibility || null,
              metadata: frontmatter.metadata ? JSON.stringify(frontmatter.metadata) : null,
              deletedAt: null,
              updatedAt: new Date(),
            },
          });

        processedSkillIds.push(skillId);
        console.log(`${log} Upserted skill: ${skillId}`);

        // 5. Handle tags
        // First, delete existing skill_tags for this skill
        await db.delete(schema.skillTags).where(eq(schema.skillTags.skillId, skillId));

        // Then insert new tags
        for (const tagName of tagNames) {
          // Upsert tag
          let tag = await db.select().from(schema.tags).where(eq(schema.tags.name, tagName)).get();

          if (!tag) {
            const [inserted] = await db.insert(schema.tags).values({ name: tagName }).returning();
            tag = inserted;
          }

          // Create skill_tag association
          await db
            .insert(schema.skillTags)
            .values({ skillId, tagId: tag.id })
            .onConflictDoNothing();
        }
      } catch (error) {
        console.error(`${log} Failed to process skill at ${skillPath}:`, error);
        // Continue with other skills
      }
    }

    // 6. Soft delete skills that no longer exist in this repo
    const existingSkills = await db
      .select({ id: schema.skills.id })
      .from(schema.skills)
      .where(eq(schema.skills.repoId, repoFullName));

    for (const skill of existingSkills) {
      if (!processedSkillIds.includes(skill.id)) {
        await db
          .update(schema.skills)
          .set({ deletedAt: new Date() })
          .where(eq(schema.skills.id, skill.id));
        console.log(`${log} Soft deleted skill: ${skill.id}`);
      }
    }

    console.log(`${log} Completed processing with ${processedSkillIds.length} skills`);
  } catch (error) {
    console.error(`${log} Failed to process repository:`, error);
    throw error;
  }
}

/**
 * Handle discovery queue messages
 * Called by the queue handler for each batch of messages
 */
async function consumeDiscoveryJobs(batch: MessageBatch<DiscoveryJobMessage>): Promise<void> {
  console.log(`[consumer] Processing batch of ${batch.messages.length} repositories`);

  for (const message of batch.messages) {
    const { repoFullName } = message.body;

    try {
      await processRepo(message.body);
      console.log(`[consumer] Completed: ${repoFullName}`);
      message.ack();
    } catch (error) {
      console.error(`[consumer] Failed: ${repoFullName}`, error);
      message.retry();
    }
  }

  console.log(`[consumer] Batch complete`);
}

export { consumeDiscoveryJobs };
