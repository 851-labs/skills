import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, isNull, like, or, sql } from "drizzle-orm";
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
// Cursor Encoding/Decoding
// ============================================================================

/**
 * Encode cursor for pagination
 * Format: base64(stars|skillId)
 */
function encodeCursor(stars: number, skillId: string): string {
  return btoa(`${stars}|${skillId}`);
}

/**
 * Decode cursor for pagination
 * Returns [stars, skillId] or null if invalid
 */
function decodeCursor(cursor: string): [number, string] | null {
  try {
    const decoded = atob(cursor);
    const [starsStr, skillId] = decoded.split("|");
    const stars = Number.parseInt(starsStr, 10);
    if (Number.isNaN(stars) || !skillId) {
      return null;
    }
    return [stars, skillId];
  } catch {
    return null;
  }
}

// ============================================================================
// Server Functions
// ============================================================================

/**
 * Get skills stats (total counts and category breakdown)
 * This is a lightweight query for the header stats
 */
const getSkillsStatsFn = createServerFn({ method: "GET" }).handler(async () => {
  // Get total counts
  const countResult = await db
    .select({
      totalSkills: sql<number>`COUNT(*)`,
      totalRepos: sql<number>`COUNT(DISTINCT ${schema.skills.repoId})`,
    })
    .from(schema.skills)
    .where(isNull(schema.skills.deletedAt))
    .get();

  // Get category counts
  const categoryRows = await db
    .select({
      category: schema.skills.category,
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.skills)
    .where(and(isNull(schema.skills.deletedAt), sql`${schema.skills.category} IS NOT NULL`))
    .groupBy(schema.skills.category);

  const categoryCounts: Record<string, number> = {};
  for (const row of categoryRows) {
    if (row.category) {
      categoryCounts[row.category] = row.count;
    }
  }

  return {
    totalSkills: countResult?.totalSkills ?? 0,
    totalRepos: countResult?.totalRepos ?? 0,
    categoryCounts,
  };
});

/**
 * Get paginated skills with optional search and category filters
 */
const getSkillsPaginatedFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(24),
      search: z.string().optional(),
      categories: z.array(z.string()).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { cursor, limit, search, categories } = data;

    // Build WHERE conditions
    const conditions = [isNull(schema.skills.deletedAt)];

    // Cursor-based pagination: WHERE (stars < cursorStars) OR (stars = cursorStars AND id > cursorId)
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        const [cursorStars, cursorId] = decoded;
        conditions.push(
          or(
            sql`${schema.repos.stars} < ${cursorStars}`,
            and(
              sql`${schema.repos.stars} = ${cursorStars}`,
              sql`${schema.skills.id} > ${cursorId}`,
            ),
          )!,
        );
      }
    }

    // Search filter (LIKE-based, searches name and description)
    if (search?.trim()) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(like(schema.skills.name, searchTerm), like(schema.skills.description, searchTerm))!,
      );
    }

    // Category filter
    if (categories && categories.length > 0) {
      conditions.push(inArray(schema.skills.category, categories));
    }

    // Fetch limit + 1 to determine if there are more results
    const rows = await db
      .select({
        skill: schema.skills,
        repo: schema.repos,
        owner: schema.owners,
      })
      .from(schema.skills)
      .innerJoin(schema.repos, eq(schema.skills.repoId, schema.repos.id))
      .innerJoin(schema.owners, eq(schema.repos.ownerId, schema.owners.id))
      .where(and(...conditions))
      .orderBy(sql`${schema.repos.stars} DESC, ${schema.skills.id} ASC`)
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);

    // Fetch tags only for this page (max 24 skills typically)
    const skillIds = items.map((r) => r.skill.id);
    const tagsBySkill = await fetchTagsForSkills(skillIds);

    const skills = items.map((row) =>
      toSkill({
        skill: row.skill,
        repo: row.repo,
        owner: row.owner,
        tags: tagsBySkill.get(row.skill.id) || [],
      }),
    );

    // Generate next cursor from last item
    const lastItem = items[items.length - 1];
    const nextCursor =
      hasMore && lastItem ? encodeCursor(lastItem.repo.stars, lastItem.skill.id) : undefined;

    return {
      skills,
      nextCursor,
    };
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
 * Get skills by owner (with pagination)
 */
const getSkillsByOwnerFn = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      owner: z.string(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(24),
    }),
  )
  .handler(async ({ data }) => {
    const { owner, cursor, limit } = data;

    // Build WHERE conditions
    const conditions = [
      isNull(schema.skills.deletedAt),
      sql`LOWER(${schema.owners.login}) = LOWER(${owner})`,
    ];

    // Cursor-based pagination
    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded) {
        const [cursorStars, cursorId] = decoded;
        conditions.push(
          or(
            sql`${schema.repos.stars} < ${cursorStars}`,
            and(
              sql`${schema.repos.stars} = ${cursorStars}`,
              sql`${schema.skills.id} > ${cursorId}`,
            ),
          )!,
        );
      }
    }

    const rows = await db
      .select({
        skill: schema.skills,
        repo: schema.repos,
        owner: schema.owners,
      })
      .from(schema.skills)
      .innerJoin(schema.repos, eq(schema.skills.repoId, schema.repos.id))
      .innerJoin(schema.owners, eq(schema.repos.ownerId, schema.owners.id))
      .where(and(...conditions))
      .orderBy(sql`${schema.repos.stars} DESC, ${schema.skills.id} ASC`)
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit);

    const skillIds = items.map((r) => r.skill.id);
    const tagsBySkill = await fetchTagsForSkills(skillIds);

    const skills = items.map((row) =>
      toSkill({
        skill: row.skill,
        repo: row.repo,
        owner: row.owner,
        tags: tagsBySkill.get(row.skill.id) || [],
      }),
    );

    const lastItem = items[items.length - 1];
    const nextCursor =
      hasMore && lastItem ? encodeCursor(lastItem.repo.stars, lastItem.skill.id) : undefined;

    return {
      skills,
      nextCursor,
    };
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

export {
  getSkillByIdFn,
  getSkillsByOwnerFn,
  getSkillsByRepoFn,
  getSkillsPaginatedFn,
  getSkillsStatsFn,
};
