import { describe, expect, test } from "bun:test";

import { parseSkillMd } from "../github";
import { isValidSkill } from "../validation";

// URLs of known valid SKILL.md files from real repositories
const knownValidSkills = [
  // pondorasti/pondorasti - skills without "compatibility" keyword
  {
    url: "https://raw.githubusercontent.com/pondorasti/pondorasti/main/packages/cli/dotfiles/agents/skills/ncu/SKILL.md",
    name: "ncu",
  },
  {
    url: "https://raw.githubusercontent.com/pondorasti/pondorasti/main/packages/cli/dotfiles/agents/skills/create-cli/SKILL.md",
    name: "create-cli",
  },
  {
    url: "https://raw.githubusercontent.com/pondorasti/pondorasti/main/packages/cli/dotfiles/agents/skills/rams/SKILL.md",
    name: "rams",
  },
  // anthropics/skills - official Anthropic skills
  {
    url: "https://raw.githubusercontent.com/anthropics/skills/main/skills/algorithmic-art/SKILL.md",
    name: "algorithmic-art",
  },
  {
    url: "https://raw.githubusercontent.com/anthropics/skills/main/skills/brand-guidelines/SKILL.md",
    name: "brand-guidelines",
  },
];

// Known repos that SHOULD be discovered (we verify the repo exists and has skills)
const knownSkillRepos = ["pondorasti/pondorasti", "anthropics/skills", "anthropics/claude-code"];

describe("discovery", () => {
  describe("parses and validates known valid skills", () => {
    for (const skill of knownValidSkills) {
      test(`${skill.name} from ${skill.url}`, async () => {
        const response = await fetch(skill.url);
        expect(response.ok).toBe(true);

        const content = await response.text();
        const { frontmatter, body } = parseSkillMd(content);

        // Should parse successfully
        expect(frontmatter).toBeDefined();
        expect(body).toBeDefined();

        // Should have required fields
        expect(frontmatter.name).toBe(skill.name);
        expect(frontmatter.description).toBeDefined();
        expect(typeof frontmatter.description).toBe("string");
        expect(frontmatter.description.length).toBeGreaterThan(0);

        // Should pass validation
        expect(isValidSkill(frontmatter)).toBe(true);
      });
    }
  });

  describe("known skill repos exist and have SKILL.md files", () => {
    for (const repoFullName of knownSkillRepos) {
      test(`${repoFullName} has skills`, async () => {
        const [owner, repo] = repoFullName.split("/");
        const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`;

        const response = await fetch(url, {
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "skills-discovery-test",
          },
        });

        // Repo should exist
        expect(response.ok).toBe(true);

        const data = (await response.json()) as { tree: Array<{ path: string }> };

        // Should have at least one SKILL.md file
        const skillFiles = data.tree.filter((item) => item.path.endsWith("SKILL.md"));
        expect(skillFiles.length).toBeGreaterThan(0);
      });
    }
  });

  describe("parseSkillMd handles various formats", () => {
    test("parses simple frontmatter", () => {
      const content = `---
name: test-skill
description: A test skill
---

# Test Skill

This is the body.
`;
      const { frontmatter, body } = parseSkillMd(content);
      expect(frontmatter.name).toBe("test-skill");
      expect(frontmatter.description).toBe("A test skill");
      expect(body).toContain("# Test Skill");
    });

    test("parses multi-line description with >", () => {
      const content = `---
name: test-skill
description: >
  This is a multi-line
  description that spans
  multiple lines.
---

Body content
`;
      const { frontmatter } = parseSkillMd(content);
      expect(frontmatter.name).toBe("test-skill");
      expect(frontmatter.description).toContain("multi-line");
      expect(frontmatter.description).toContain("description");
    });

    test("parses metadata object", () => {
      const content = `---
name: test-skill
description: A test skill
metadata:
  author: test-author
  version: "1.0"
---

Body
`;
      const { frontmatter } = parseSkillMd(content);
      expect(frontmatter.name).toBe("test-skill");
      expect(frontmatter.metadata).toBeDefined();
      expect(frontmatter.metadata?.author).toBe("test-author");
      expect(frontmatter.metadata?.version).toBe("1.0");
    });

    test("parses all optional fields", () => {
      const content = `---
name: test-skill
description: A test skill
license: MIT
compatibility: Claude Code
metadata:
  author: test
---

Body
`;
      const { frontmatter } = parseSkillMd(content);
      expect(frontmatter.name).toBe("test-skill");
      expect(frontmatter.description).toBe("A test skill");
      expect(frontmatter.license).toBe("MIT");
      expect(frontmatter.compatibility).toBe("Claude Code");
      expect(frontmatter.metadata?.author).toBe("test");
    });
  });
});
