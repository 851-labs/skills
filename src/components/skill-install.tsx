import type { Skill } from "@/lib/types";

import { CopyButton } from "@/components/copy-button";
import { getInstallCommand } from "@/lib/skills";

interface SkillInstallProps {
  skill: Skill;
}

function SkillInstall({ skill }: SkillInstallProps) {
  const command = getInstallCommand(skill);

  return (
    <div className="relative border border-border bg-bg-secondary p-4">
      <pre className="overflow-x-auto pr-16 font-mono text-sm text-text-primary">
        <span className="text-accent">$</span> {command}
      </pre>
      <div className="absolute right-4 top-4">
        <CopyButton text={command} />
      </div>
    </div>
  );
}

export { SkillInstall };
