import type { Skill, SkillFrontmatter } from "./types";

// ============================================================================
// Category and Tag Inference (used by consumer and for display)
// ============================================================================

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

const COMMON_TAGS = [
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

/**
 * Infer category from skill frontmatter
 */
function inferCategory(frontmatter: SkillFrontmatter): string | undefined {
  const text = `${frontmatter.name} ${frontmatter.description}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return category;
    }
  }

  return undefined;
}

/**
 * Extract tags from skill frontmatter description
 */
function inferTags(frontmatter: SkillFrontmatter): string[] {
  const words = frontmatter.description.toLowerCase().split(/\s+/);
  return COMMON_TAGS.filter((tag) => words.some((w) => w.includes(tag)));
}

/**
 * Generate install command using add-skill CLI
 */
function getInstallCommand(skill: Skill): string {
  const { owner, repo } = skill.source;
  return `npx add-skill ${owner}/${repo} -s ${skill.name}`;
}

export { getInstallCommand, inferCategory, inferTags };
