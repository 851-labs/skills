/**
 * Validation module for Agent Skills
 *
 * Implements validation rules per the Agent Skills specification:
 * https://agentskills.io/specification
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface SkillFrontmatterInput {
  name?: unknown;
  description?: unknown;
  license?: unknown;
  compatibility?: unknown;
  metadata?: unknown;
  "allowed-tools"?: unknown;
}

/**
 * Validate skill name per spec:
 * - Must be 1-64 characters
 * - May only contain lowercase alphanumeric characters and hyphens (a-z, 0-9, -)
 * - Must not start or end with hyphen
 * - Must not contain consecutive hyphens (--)
 */
function validateName(name: unknown): string[] {
  const errors: string[] = [];

  if (name === undefined || name === null) {
    errors.push("Missing required field: name");
    return errors;
  }

  if (typeof name !== "string") {
    errors.push("name must be a string");
    return errors;
  }

  if (name.length === 0) {
    errors.push("name cannot be empty");
    return errors;
  }

  if (name.length > 64) {
    errors.push(`name exceeds 64 characters (got ${name.length})`);
  }

  // Check for valid characters (lowercase alphanumeric and hyphens)
  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push("name must only contain lowercase letters, numbers, and hyphens");
  }

  // Check for leading/trailing hyphens
  if (name.startsWith("-")) {
    errors.push("name must not start with a hyphen");
  }

  if (name.endsWith("-")) {
    errors.push("name must not end with a hyphen");
  }

  // Check for consecutive hyphens
  if (name.includes("--")) {
    errors.push("name must not contain consecutive hyphens");
  }

  return errors;
}

/**
 * Validate skill description per spec:
 * - Must be 1-1024 characters
 * - Non-empty
 */
function validateDescription(description: unknown): string[] {
  const errors: string[] = [];

  if (description === undefined || description === null) {
    errors.push("Missing required field: description");
    return errors;
  }

  if (typeof description !== "string") {
    errors.push("description must be a string");
    return errors;
  }

  if (description.length === 0) {
    errors.push("description cannot be empty");
    return errors;
  }

  if (description.length > 1024) {
    errors.push(`description exceeds 1024 characters (got ${description.length})`);
  }

  return errors;
}

/**
 * Validate optional compatibility field per spec:
 * - Must be 1-500 characters if provided
 */
function validateCompatibility(compatibility: unknown): string[] {
  const errors: string[] = [];

  if (compatibility === undefined || compatibility === null) {
    return errors; // Optional field
  }

  if (typeof compatibility !== "string") {
    errors.push("compatibility must be a string");
    return errors;
  }

  if (compatibility.length > 500) {
    errors.push(`compatibility exceeds 500 characters (got ${compatibility.length})`);
  }

  return errors;
}

/**
 * Validate optional metadata field per spec:
 * - Must be an object (map from string keys to string values)
 */
function validateMetadata(metadata: unknown): string[] {
  const errors: string[] = [];

  if (metadata === undefined || metadata === null) {
    return errors; // Optional field
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    errors.push("metadata must be an object");
    return errors;
  }

  return errors;
}

/**
 * Validate skill frontmatter against the Agent Skills specification
 */
function validateSkillFrontmatter(frontmatter: SkillFrontmatterInput): ValidationResult {
  const errors: string[] = [];

  // Required fields
  errors.push(...validateName(frontmatter.name));
  errors.push(...validateDescription(frontmatter.description));

  // Optional fields
  errors.push(...validateCompatibility(frontmatter.compatibility));
  errors.push(...validateMetadata(frontmatter.metadata));

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if frontmatter represents a valid skill (simple boolean check)
 */
function isValidSkill(frontmatter: SkillFrontmatterInput): boolean {
  return validateSkillFrontmatter(frontmatter).valid;
}

export { isValidSkill, validateSkillFrontmatter };
export type { SkillFrontmatterInput, ValidationResult };
