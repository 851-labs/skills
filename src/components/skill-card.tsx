import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

import type { Skill } from "@/lib/types";

interface SkillCardProps {
  skill: Skill;
}

function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}k`;
  }
  return stars.toString();
}

function SkillCard({ skill }: SkillCardProps) {
  const href = `/${skill.source.owner}/${skill.source.repo}/${skill.name}`;

  return (
    <Link
      to={href}
      className="group block border border-border bg-bg-secondary p-4 transition-colors hover:border-border-hover"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-accent">
          {skill.name}
        </h3>
        <div className="flex shrink-0 items-center gap-1 text-text-tertiary">
          <Star className="h-3 w-3" />
          <span className="font-mono text-xs">{formatStars(skill.repoStars)}</span>
        </div>
      </div>

      <p className="mb-3 text-xs text-text-tertiary">
        {skill.source.owner}/{skill.source.repo}
      </p>

      <p className="mb-4 line-clamp-2 text-sm text-text-secondary">{skill.description}</p>

      {skill.category && (
        <div className="flex flex-wrap gap-1">
          <span className="border border-border bg-bg-tertiary px-2 py-0.5 font-mono text-xs text-text-tertiary">
            {skill.category}
          </span>
        </div>
      )}
    </Link>
  );
}

export { SkillCard };
