import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Folder, Star, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { Skill } from "@/lib/types";

import { SkillCard } from "@/components/skill-card";
import { SkillContent } from "@/components/skill-content";
import { SkillInstall } from "@/components/skill-install";
import { fetchSkillMd, parseSkillMd } from "@/lib/github";
import { getSkillById, getSkillsByRepo } from "@/lib/skills";

function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}k`;
  }
  return stars.toString();
}

function SkillDetailPage() {
  const { owner, repo, skill: skillSlug } = Route.useParams();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [skillContent, setSkillContent] = useState<string | null>(null);
  const [relatedSkills, setRelatedSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const skillId = `${owner}/${repo}/${skillSlug}`;

  // Load skill data
  useMemo(() => {
    void getSkillById(skillId).then((data) => {
      setSkill(data);
      setLoading(false);
      if (!data) {
        setError("Skill not found");
      }
    });
  }, [skillId]);

  // Load related skills from the same repo
  useMemo(() => {
    void getSkillsByRepo(owner, repo).then((skills) => {
      // Filter out the current skill
      setRelatedSkills(skills.filter((s) => s.id !== skillId).slice(0, 4));
    });
  }, [owner, repo, skillId]);

  // Fetch SKILL.md content
  useEffect(() => {
    if (!skill) return;

    setContentLoading(true);
    void fetchSkillMd(skill.source.owner, skill.source.repo, skill.source.branch, skill.source.path)
      .then((result) => {
        if (result.content) {
          const { body } = parseSkillMd(result.content);
          setSkillContent(body);
        }
        setContentLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch SKILL.md:", err);
        setContentLoading(false);
      });
  }, [skill]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="text-center font-mono text-text-tertiary">Loading...</p>
      </div>
    );
  }

  if (error || !skill) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all skills
        </Link>
        <div className="border border-border bg-bg-secondary p-12 text-center">
          <p className="font-mono text-text-secondary">{error || "Skill not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm">
        <Link to="/" className="text-text-tertiary hover:text-text-secondary">
          Home
        </Link>
        <span className="text-text-tertiary">/</span>
        <Link
          to="/$owner"
          params={{ owner }}
          className="text-text-tertiary hover:text-text-secondary"
        >
          {owner}
        </Link>
        <span className="text-text-tertiary">/</span>
        <Link
          to="/$owner/$repo"
          params={{ owner, repo }}
          className="text-text-tertiary hover:text-text-secondary"
        >
          {repo}
        </Link>
        <span className="text-text-tertiary">/</span>
        <span className="text-text-primary">{skill.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-8 border border-border bg-bg-secondary p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="mb-2 font-mono text-2xl font-bold text-text-primary">{skill.name}</h1>
            <p className="mb-4 text-text-secondary">{skill.description}</p>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-text-tertiary">
              {/* Repo link */}
              <span className="flex items-center gap-1">
                <Folder className="h-3 w-3" />
                {owner}/{repo}
              </span>

              {/* Stars */}
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {formatStars(skill.repoStars)}
              </span>

              {/* Category */}
              {skill.category && (
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {skill.category}
                </span>
              )}

              {/* License */}
              {skill.license && <span className="text-text-tertiary">{skill.license}</span>}
            </div>
          </div>

          <a
            href={skill.source.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-sm text-text-tertiary hover:text-accent"
          >
            <ExternalLink className="h-4 w-4" />
            View on GitHub
          </a>
        </div>

        {/* Tags */}
        {skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skill.tags.map((tag) => (
              <span
                key={tag}
                className="border border-border bg-bg-tertiary px-2 py-0.5 font-mono text-xs text-text-tertiary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Install Commands */}
      <section className="mb-8">
        <h2 className="mb-4 border-b border-border pb-2 font-mono text-sm font-bold uppercase tracking-wider text-text-tertiary">
          Install
        </h2>
        <SkillInstall skill={skill} />
      </section>

      {/* SKILL.md Content */}
      <section className="mb-8">
        <h2 className="mb-4 border-b border-border pb-2 font-mono text-sm font-bold uppercase tracking-wider text-text-tertiary">
          Documentation
        </h2>
        <div className="border border-border bg-bg-secondary p-6">
          {contentLoading ? (
            <p className="font-mono text-sm text-text-tertiary">Loading documentation...</p>
          ) : skillContent ? (
            <SkillContent content={skillContent} />
          ) : (
            <p className="font-mono text-sm text-text-tertiary">No documentation available.</p>
          )}
        </div>
      </section>

      {/* Related Skills */}
      {relatedSkills.length > 0 && (
        <section>
          <h2 className="mb-4 border-b border-border pb-2 font-mono text-sm font-bold uppercase tracking-wider text-text-tertiary">
            More from {owner}/{repo}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {relatedSkills.map((relatedSkill) => (
              <SkillCard key={relatedSkill.id} skill={relatedSkill} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const Route = createFileRoute("/$owner/$repo/$skill")({
  component: SkillDetailPage,
});

export { Route };
