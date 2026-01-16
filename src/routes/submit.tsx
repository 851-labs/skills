import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, GitPullRequest } from "lucide-react";

import { CopyButton } from "@/components/copy-button";

const EXAMPLE_SKILL_MD = `---
name: my-skill-name
description: Brief description of what this skill does and when to use it
license: MIT
---

# My Skill Name

Detailed instructions for the AI agent on how to use this skill.

## When to Use

Describe the scenarios when this skill should be activated.

## Instructions

Step-by-step guidance for the agent.
`;

function SubmitPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all skills
        </Link>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="mb-4 font-mono text-2xl font-bold text-text-primary">Submit Your Skills</h1>
        <p className="text-text-secondary">
          Share your agent skills with the community by adding your repository to our registry.
        </p>
      </header>

      {/* Requirements */}
      <section className="mb-8">
        <h2 className="mb-4 font-mono text-lg font-bold text-text-primary">Requirements</h2>
        <div className="border border-border bg-bg-secondary p-6">
          <ul className="space-y-3 text-text-secondary">
            <li className="flex gap-3">
              <span className="font-mono text-accent">1.</span>
              <span>
                Your repository must be <strong>public</strong> on GitHub
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-accent">2.</span>
              <span>
                Each skill must have a{" "}
                <code className="bg-bg-tertiary px-1.5 py-0.5 font-mono text-sm text-accent">
                  SKILL.md
                </code>{" "}
                file with YAML frontmatter
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-accent">3.</span>
              <span>
                Required frontmatter fields:{" "}
                <code className="bg-bg-tertiary px-1.5 py-0.5 font-mono text-sm text-accent">
                  name
                </code>{" "}
                and{" "}
                <code className="bg-bg-tertiary px-1.5 py-0.5 font-mono text-sm text-accent">
                  description
                </code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-accent">4.</span>
              <span>
                Optional fields:{" "}
                <code className="bg-bg-tertiary px-1.5 py-0.5 font-mono text-sm text-accent">
                  license
                </code>
                ,{" "}
                <code className="bg-bg-tertiary px-1.5 py-0.5 font-mono text-sm text-accent">
                  compatibility
                </code>
                ,{" "}
                <code className="bg-bg-tertiary px-1.5 py-0.5 font-mono text-sm text-accent">
                  metadata
                </code>
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Example SKILL.md */}
      <section className="mb-8">
        <h2 className="mb-4 font-mono text-lg font-bold text-text-primary">Example SKILL.md</h2>
        <div className="relative border border-border bg-bg-secondary">
          <div className="absolute right-4 top-4">
            <CopyButton text={EXAMPLE_SKILL_MD} />
          </div>
          <pre className="overflow-x-auto p-6 font-mono text-sm text-text-primary">
            {EXAMPLE_SKILL_MD}
          </pre>
        </div>
      </section>

      {/* How to Submit */}
      <section className="mb-8">
        <h2 className="mb-4 font-mono text-lg font-bold text-text-primary">How to Submit</h2>
        <div className="border border-border bg-bg-secondary p-6">
          <ol className="space-y-4 text-text-secondary">
            <li className="flex gap-3">
              <span className="font-mono text-accent">1.</span>
              <div>
                <strong>Fork our registry repository</strong>
                <p className="mt-1 text-sm text-text-tertiary">
                  Clone the{" "}
                  <a
                    href="https://github.com/851-labs/skills"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent-hover"
                  >
                    851-labs/skills
                  </a>{" "}
                  repository
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-accent">2.</span>
              <div>
                <strong>Add your repository to registry-sources.json</strong>
                <p className="mt-1 text-sm text-text-tertiary">
                  Add an entry with your GitHub owner, repo name, branch, and the path to your
                  skills folder
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-accent">3.</span>
              <div>
                <strong>Create a pull request</strong>
                <p className="mt-1 text-sm text-text-tertiary">
                  We&apos;ll review your submission and merge it if it meets our guidelines
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Registry Source Format */}
      <section className="mb-8">
        <h2 className="mb-4 font-mono text-lg font-bold text-text-primary">
          Registry Source Format
        </h2>
        <div className="relative border border-border bg-bg-secondary">
          <pre className="overflow-x-auto p-6 font-mono text-sm text-text-primary">
            {`{
  "owner": "your-github-username",
  "repo": "your-repo-name",
  "branch": "main",
  "skillsPath": "skills"
}`}
          </pre>
        </div>
        <p className="mt-3 text-sm text-text-tertiary">
          The <code className="bg-bg-tertiary px-1.5 py-0.5 font-mono text-accent">skillsPath</code>{" "}
          is the directory containing your skill folders. Each subfolder should contain a SKILL.md
          file.
        </p>
      </section>

      {/* CTA */}
      <section className="border border-accent bg-bg-secondary p-6 text-center">
        <GitPullRequest className="mx-auto mb-4 h-8 w-8 text-accent" />
        <h3 className="mb-2 font-mono text-lg font-bold text-text-primary">Ready to submit?</h3>
        <p className="mb-4 text-sm text-text-tertiary">
          Open a pull request to add your repository to the registry
        </p>
        <a
          href="https://github.com/851-labs/skills/edit/main/registry-sources.json"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-accent px-6 py-2 font-mono text-sm font-bold text-bg-primary transition-colors hover:bg-accent-hover"
        >
          <ExternalLink className="h-4 w-4" />
          Edit registry-sources.json
        </a>
      </section>
    </div>
  );
}

const Route = createFileRoute("/submit")({
  component: SubmitPage,
});

export { Route };
