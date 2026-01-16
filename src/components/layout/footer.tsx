function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-text-tertiary sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="font-mono">skills.surf</span>
            <span className="text-border">|</span>
            <span>Browse and install Agent Skills</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://agentskills.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-secondary"
            >
              Agent Skills Spec
            </a>
            <span className="text-border">|</span>
            <a
              href="https://github.com/851-labs/skills"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-secondary"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
