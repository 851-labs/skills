import { useState } from "react";

import type { Skill } from "@/lib/types";

import { CopyButton } from "@/components/copy-button";
import { getCurlCommand, getInstallCommand } from "@/lib/skills";

interface SkillInstallProps {
  skill: Skill;
}

type InstallMethod = "git" | "curl";

function SkillInstall({ skill }: SkillInstallProps) {
  const [method, setMethod] = useState<InstallMethod>("git");

  const commands: Record<InstallMethod, { label: string; command: string }> = {
    git: {
      label: "Git (sparse checkout)",
      command: getInstallCommand(skill),
    },
    curl: {
      label: "curl (SKILL.md only)",
      command: getCurlCommand(skill),
    },
  };

  const currentCommand = commands[method];

  return (
    <div className="border border-border bg-bg-secondary">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {(Object.keys(commands) as InstallMethod[]).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`px-4 py-2 font-mono text-xs transition-colors ${
              method === m
                ? "border-b border-accent bg-bg-tertiary text-accent"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {commands[m].label}
          </button>
        ))}
      </div>

      {/* Command Box */}
      <div className="relative p-4">
        <pre className="overflow-x-auto font-mono text-sm text-text-primary">
          <span className="text-accent">$</span> {currentCommand.command}
        </pre>
        <div className="absolute right-4 top-4">
          <CopyButton text={currentCommand.command} />
        </div>
      </div>
    </div>
  );
}

export { SkillInstall };
