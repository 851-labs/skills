import { createServerFn } from "@tanstack/react-start";
import { eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import type { Skill } from "../types";

import { db } from "../db";
import * as schema from "../db/schema";

// ============================================================================
// Database Row to Skill Transformer
// ============================================================================

interface SkillWithRelations {
  skill: typeof schema.skills.$inferSelect;
  repo: typeof schema.repos.$inferSelect;
  owner: typeof schema.owners.$inferSelect;
  tags: string[];
}

/**
 * Transform database row to the Skill interface for API compatibility
 */
function toSkill(data: SkillWithRelations): Skill {
  const { skill, repo, owner, tags } = data;

  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    license: skill.license ?? undefined,
    compatibility: skill.compatibility ?? undefined,
    metadata: skill.metadata ? JSON.parse(skill.metadata) : undefined,
    source: {
      owner: owner.login,
      repo: repo.name,
      path: skill.path,
      branch: repo.defaultBranch,
      githubUrl: skill.githubUrl,
      rawSkillMdUrl: skill.rawUrl,
    },
    category: skill.category ?? undefined,
    tags,
    repoStars: repo.stars,
    repoDescription: repo.description ?? undefined,
    updatedAt: skill.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

/**
 * Fetch tags for a list of skill IDs
 * Batches queries to avoid SQLite's placeholder limit (SQLITE_MAX_VARIABLE_NUMBER = 999)
 */
async function fetchTagsForSkills(skillIds: string[]): Promise<Map<string, string[]>> {
  if (skillIds.length === 0) {
    return new Map();
  }

  const tagsBySkill = new Map<string, string[]>();
  const batchSize = 100; // D1 may have stricter limits than SQLite's 999

  for (let i = 0; i < skillIds.length; i += batchSize) {
    const batch = skillIds.slice(i, i + batchSize);
    const tagRows = await db
      .select({
        skillId: schema.skillTags.skillId,
        tagName: schema.tags.name,
      })
      .from(schema.skillTags)
      .innerJoin(schema.tags, eq(schema.skillTags.tagId, schema.tags.id))
      .where(inArray(schema.skillTags.skillId, batch));

    for (const { skillId, tagName } of tagRows) {
      const existing = tagsBySkill.get(skillId) || [];
      existing.push(tagName);
      tagsBySkill.set(skillId, existing);
    }
  }

  return tagsBySkill;
}

// ============================================================================
// Server Functions
// ============================================================================

/**
 * Get all skills
 */
const getAllSkillsFn = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db
    .select({
      skill: schema.skills,
      repo: schema.repos,
      owner: schema.owners,
    })
    .from(schema.skills)
    .innerJoin(schema.repos, eq(schema.skills.repoId, schema.repos.id))
    .innerJoin(schema.owners, eq(schema.repos.ownerId, schema.owners.id))
    .where(isNull(schema.skills.deletedAt))
    .orderBy(sql`${schema.repos.stars} DESC, ${schema.skills.name} ASC`);

  const skillIds = rows.map((r) => r.skill.id);
  const tagsBySkill = await fetchTagsForSkills(skillIds);

  return rows.map((row) =>
    toSkill({
      skill: row.skill,
      repo: row.repo,
      owner: row.owner,
      tags: tagsBySkill.get(row.skill.id) || [],
    }),
  );
});

/**
 * Get a skill by ID
 */
const getSkillByIdFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const row = await db
      .select({
        skill: schema.skills,
        repo: schema.repos,
        owner: schema.owners,
      })
      .from(schema.skills)
      .innerJoin(schema.repos, eq(schema.skills.repoId, schema.repos.id))
      .innerJoin(schema.owners, eq(schema.repos.ownerId, schema.owners.id))
      .where(eq(schema.skills.id, data.id))
      .get();

    if (!row || row.skill.deletedAt) {
      return null;
    }

    const tagRows = await db
      .select({ tagName: schema.tags.name })
      .from(schema.skillTags)
      .innerJoin(schema.tags, eq(schema.skillTags.tagId, schema.tags.id))
      .where(eq(schema.skillTags.skillId, data.id));

    return toSkill({
      skill: row.skill,
      repo: row.repo,
      owner: row.owner,
      tags: tagRows.map((t) => t.tagName),
    });
  });

/**
 * Get skills by owner
 */
const getSkillsByOwnerFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ owner: z.string() }))
  .handler(async ({ data }) => {
    const rows = await db
      .select({
        skill: schema.skills,
        repo: schema.repos,
        owner: schema.owners,
      })
      .from(schema.skills)
      .innerJoin(schema.repos, eq(schema.skills.repoId, schema.repos.id))
      .innerJoin(schema.owners, eq(schema.repos.ownerId, schema.owners.id))
      .where(
        sql`LOWER(${schema.owners.login}) = LOWER(${data.owner}) AND ${schema.skills.deletedAt} IS NULL`,
      )
      .orderBy(sql`${schema.repos.stars} DESC, ${schema.skills.name} ASC`);

    const skillIds = rows.map((r) => r.skill.id);
    const tagsBySkill = await fetchTagsForSkills(skillIds);

    return rows.map((row) =>
      toSkill({
        skill: row.skill,
        repo: row.repo,
        owner: row.owner,
        tags: tagsBySkill.get(row.skill.id) || [],
      }),
    );
  });

/**
 * Get skills by owner and repo
 */
const getSkillsByRepoFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ owner: z.string(), repo: z.string() }))
  .handler(async ({ data }) => {
    const rows = await db
      .select({
        skill: schema.skills,
        repo: schema.repos,
        owner: schema.owners,
      })
      .from(schema.skills)
      .innerJoin(schema.repos, eq(schema.skills.repoId, schema.repos.id))
      .innerJoin(schema.owners, eq(schema.repos.ownerId, schema.owners.id))
      .where(
        sql`LOWER(${schema.owners.login}) = LOWER(${data.owner}) 
          AND LOWER(${schema.repos.name}) = LOWER(${data.repo}) 
          AND ${schema.skills.deletedAt} IS NULL`,
      )
      .orderBy(schema.skills.name);

    const skillIds = rows.map((r) => r.skill.id);
    const tagsBySkill = await fetchTagsForSkills(skillIds);

    return rows.map((row) =>
      toSkill({
        skill: row.skill,
        repo: row.repo,
        owner: row.owner,
        tags: tagsBySkill.get(row.skill.id) || [],
      }),
    );
  });

export { getAllSkillsFn, getSkillByIdFn, getSkillsByOwnerFn, getSkillsByRepoFn };
