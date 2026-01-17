import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

import { generateId } from "@/utils/uuid";

// ============================================================================
// Owners - GitHub users/organizations that own skill repositories
// ============================================================================

const owners = sqliteTable("owners", {
  id: text("id").primaryKey(), // GitHub login (e.g., "anthropics")
  login: text("login").notNull(),
  type: text("type").notNull(), // "User" | "Organization"
  avatarUrl: text("avatar_url"),
  htmlUrl: text("html_url").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

// ============================================================================
// Repos - GitHub repositories containing skills
// ============================================================================

const repos = sqliteTable("repos", {
  id: text("id").primaryKey(), // "owner/repo" format (e.g., "anthropics/skills")
  ownerId: text("owner_id")
    .notNull()
    .references(() => owners.id),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  description: text("description"),
  htmlUrl: text("html_url").notNull(),
  stars: integer("stars").notNull().default(0),
  defaultBranch: text("default_branch").notNull().default("main"),
  isFork: integer("is_fork", { mode: "boolean" }).notNull().default(false),
  license: text("license"),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

// ============================================================================
// Skills - Individual skills (SKILL.md files)
// ============================================================================

const skills = sqliteTable("skills", {
  id: text("id").primaryKey(), // "owner/repo/skill-name" (e.g., "anthropics/skills/frontend-design")
  repoId: text("repo_id")
    .notNull()
    .references(() => repos.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  path: text("path").notNull(), // Path within repo (e.g., "skills/frontend-design")
  githubUrl: text("github_url").notNull(),
  rawUrl: text("raw_url").notNull(),
  license: text("license"), // Skill-specific license (optional, falls back to repo)
  category: text("category"),
  compatibility: text("compatibility"),
  metadata: text("metadata"), // JSON object for arbitrary frontmatter fields
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

// ============================================================================
// Tags - Unique tag names
// ============================================================================

const tags = sqliteTable("tags", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  name: text("name").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ============================================================================
// SkillTags - Junction table for skills <-> tags many-to-many
// ============================================================================

const skillTags = sqliteTable(
  "skill_tags",
  {
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.skillId, table.tagId] })],
);

// ============================================================================
// Type exports
// ============================================================================

type OwnerRow = typeof owners.$inferSelect;
type NewOwnerRow = typeof owners.$inferInsert;
type RepoRow = typeof repos.$inferSelect;
type NewRepoRow = typeof repos.$inferInsert;
type SkillRow = typeof skills.$inferSelect;
type NewSkillRow = typeof skills.$inferInsert;
type TagRow = typeof tags.$inferSelect;
type NewTagRow = typeof tags.$inferInsert;
type SkillTagRow = typeof skillTags.$inferSelect;
type NewSkillTagRow = typeof skillTags.$inferInsert;

export { owners, repos, skills, tags, skillTags };

export type {
  OwnerRow,
  NewOwnerRow,
  RepoRow,
  NewRepoRow,
  SkillRow,
  NewSkillRow,
  TagRow,
  NewTagRow,
  SkillTagRow,
  NewSkillTagRow,
};
