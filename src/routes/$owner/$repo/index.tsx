import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Star } from "lucide-react";
import { useMemo, useState } from "react";

import type { Skill } from "@/lib/types";

import { SkillCard } from "@/components/skill-card";
import { getSkillsByRepo } from "@/lib/skills";

function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}k`;
  }
  return stars.toString();
}

function RepoPage() {
  const { owner, repo } = Route.useParams();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Load skills for this repo
  useMemo(() => {
    void getSkillsByRepo(owner, repo).then((data) => {
      setSkills(data);
      setLoading(false);
    });
  }, [owner, repo]);

  // Get repo metadata from first skill
  const repoMeta = useMemo(() => {
    if (skills.length === 0) return null;
    const first = skills[0];
    return {
      stars: first.repoStars,
      description: first.repoDescription,
    };
  }, [skills]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-center font-mono text-text-tertiary">Loading...</p>
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-text-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all skills
        </Link>
        <div className="border border-border bg-bg-secondary p-12 text-center">
          <p className="font-mono text-text-secondary">
            No skills found in {owner}/{repo}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-sm">
        <Link to="/" className="text-text-tertiary hover:text-text-secondary">
          Home
        </Link>
        <span className="text-text-tertiary">/</span>
        <a href={`/${owner}`} className="text-text-tertiary hover:text-text-secondary">
          {owner}
        </a>
        <span className="text-text-tertiary">/</span>
        <span className="text-text-primary">{repo}</span>
      </nav>

      {/* Header */}
      <div className="mb-8 border border-border bg-bg-secondary p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 font-mono text-2xl font-bold text-text-primary">
              {owner}/{repo}
            </h1>
            {repoMeta?.description && (
              <p className="mb-3 text-text-secondary">{repoMeta.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-text-tertiary">
              <span>{skills.length} skills</span>
              {repoMeta && (
                <>
                  <span>&middot;</span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {formatStars(repoMeta.stars)}
                  </span>
                </>
              )}
            </div>
          </div>
          <a
            href={`https://github.com/${owner}/${repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-accent"
          >
            <ExternalLink className="h-4 w-4" />
            View on GitHub
          </a>
        </div>
      </div>

      {/* Skills Grid */}
      <h2 className="mb-4 border-b border-border pb-2 font-mono text-sm font-bold uppercase tracking-wider text-text-tertiary">
        Available Skills
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {skills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
    </div>
  );
}

const Route = createFileRoute("/$owner/$repo/")({
  component: RepoPage,
});

export { Route };
