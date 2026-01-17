import { describe, expect, test } from "bun:test";

import { isValidSkill, validateSkillFrontmatter } from "../validation";

describe("validateSkillFrontmatter", () => {
  describe("valid skills", () => {
    test("minimal valid skill", () => {
      const result = validateSkillFrontmatter({
        name: "ncu",
        description: "Update dependencies",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("skill with all optional fields", () => {
      const result = validateSkillFrontmatter({
        name: "create-cli",
        description: "Design CLI parameters and UX",
        license: "MIT",
        compatibility: "Claude Code",
        metadata: { author: "test", version: "1.0" },
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("skill with hyphenated name", () => {
      const result = validateSkillFrontmatter({
        name: "swift-concurrency-expert",
        description: "Help with Swift concurrency",
      });
      expect(result.valid).toBe(true);
    });

    test("skill with numbers in name", () => {
      const result = validateSkillFrontmatter({
        name: "react18-migration",
        description: "Migrate to React 18",
      });
      expect(result.valid).toBe(true);
    });

    test("skill with max length name (64 chars)", () => {
      const result = validateSkillFrontmatter({
        name: "a".repeat(64),
        description: "Test skill",
      });
      expect(result.valid).toBe(true);
    });

    test("skill with max length description (1024 chars)", () => {
      const result = validateSkillFrontmatter({
        name: "test",
        description: "a".repeat(1024),
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid skills - name field", () => {
    test("missing name", () => {
      const result = validateSkillFrontmatter({
        description: "Some description",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required field: name");
    });

    test("empty name", () => {
      const result = validateSkillFrontmatter({
        name: "",
        description: "test",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("name cannot be empty");
    });

    test("uppercase name", () => {
      const result = validateSkillFrontmatter({
        name: "NCU",
        description: "test",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "name must only contain lowercase letters, numbers, and hyphens",
      );
    });

    test("name with spaces", () => {
      const result = validateSkillFrontmatter({
        name: "create cli",
        description: "test",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "name must only contain lowercase letters, numbers, and hyphens",
      );
    });

    test("name with underscores", () => {
      const result = validateSkillFrontmatter({
        name: "create_cli",
        description: "test",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "name must only contain lowercase letters, numbers, and hyphens",
      );
    });

    test("leading hyphen in name", () => {
      const result = validateSkillFrontmatter({
        name: "-ncu",
        description: "test",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("name must not start with a hyphen");
    });

    test("trailing hyphen in name", () => {
      const result = validateSkillFrontmatter({
        name: "ncu-",
        description: "test",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("name must not end with a hyphen");
    });

    test("consecutive hyphens in name", () => {
      const result = validateSkillFrontmatter({
        name: "ncu--test",
        description: "test",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("name must not contain consecutive hyphens");
    });

    test("name exceeds 64 characters", () => {
      const result = validateSkillFrontmatter({
        name: "a".repeat(65),
        description: "test",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("name exceeds 64 characters");
    });

    test("name is not a string", () => {
      const result = validateSkillFrontmatter({
        name: 123 as unknown as string,
        description: "test",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("name must be a string");
    });
  });

  describe("invalid skills - description field", () => {
    test("missing description", () => {
      const result = validateSkillFrontmatter({
        name: "ncu",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing required field: description");
    });

    test("empty description", () => {
      const result = validateSkillFrontmatter({
        name: "ncu",
        description: "",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("description cannot be empty");
    });

    test("description exceeds 1024 characters", () => {
      const result = validateSkillFrontmatter({
        name: "ncu",
        description: "a".repeat(1025),
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("description exceeds 1024 characters");
    });

    test("description is not a string", () => {
      const result = validateSkillFrontmatter({
        name: "ncu",
        description: 123 as unknown as string,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("description must be a string");
    });
  });

  describe("invalid skills - optional fields", () => {
    test("compatibility exceeds 500 characters", () => {
      const result = validateSkillFrontmatter({
        name: "ncu",
        description: "test",
        compatibility: "a".repeat(501),
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("compatibility exceeds 500 characters");
    });

    test("metadata is not an object", () => {
      const result = validateSkillFrontmatter({
        name: "ncu",
        description: "test",
        metadata: "not an object" as unknown as Record<string, string>,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("metadata must be an object");
    });

    test("metadata is an array", () => {
      const result = validateSkillFrontmatter({
        name: "ncu",
        description: "test",
        metadata: ["a", "b"] as unknown as Record<string, string>,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("metadata must be an object");
    });
  });
});

describe("isValidSkill", () => {
  test("returns true for valid skill", () => {
    expect(
      isValidSkill({
        name: "ncu",
        description: "Update dependencies",
      }),
    ).toBe(true);
  });

  test("returns false for invalid skill", () => {
    expect(
      isValidSkill({
        name: "NCU", // uppercase
        description: "Update dependencies",
      }),
    ).toBe(false);
  });

  test("returns false for missing required fields", () => {
    expect(isValidSkill({})).toBe(false);
  });
});
