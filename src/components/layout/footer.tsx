function Footer() {
  return (
    <footer className="border-t border-border bg-bg-secondary">
      <div className="mx-auto max-w-6xl px-4">
        {/* Main footer grid */}
        <div className="grid grid-cols-2 border-x border-dashed border-border sm:grid-cols-4">
          {/* Browse */}
          <div className="border-b border-r border-dashed border-border p-6">
            <h3 className="mb-4 font-mono text-sm font-bold text-text-primary">Browse</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="text-text-secondary hover:text-text-primary">
                  All Skills
                </a>
              </li>
              <li>
                <a
                  href="/anthropics/skills"
                  className="text-text-secondary hover:text-text-primary"
                >
                  Anthropic Skills
                </a>
              </li>
              <li>
                <a href="/submit" className="text-text-secondary hover:text-text-primary">
                  Submit Skills
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="border-b border-r border-dashed border-border p-6 sm:border-r">
            <h3 className="mb-4 font-mono text-sm font-bold text-text-primary">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.anthropic.com/engineering/claude-code-best-practices"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-text-primary"
                >
                  Best Practices
                </a>
              </li>
              <li>
                <a
                  href="https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-text-primary"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/anthropics/skills"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-text-primary"
                >
                  Skill Spec
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="border-b border-r border-dashed border-border p-6">
            <h3 className="mb-4 font-mono text-sm font-bold text-text-primary">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/851-labs/skills"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-text-primary"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/851-labs/skills/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-text-primary"
                >
                  Issues
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/851-labs/skills/pulls"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-text-primary"
                >
                  Contribute
                </a>
              </li>
            </ul>
          </div>

          {/* Open Source */}
          <div className="border-b border-dashed border-border p-6">
            <h3 className="mb-4 font-mono text-sm font-bold text-text-primary">Open Source</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/anthropics/claude-code"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-text-primary"
                >
                  Claude Code
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/anomalyco/opencode"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-text-primary"
                >
                  OpenCode
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/anthropics/anthropic-cookbook"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-secondary hover:text-text-primary"
                >
                  Cookbook
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-tertiary">2026 851 Labs. Open source under MIT.</p>
          <div className="flex items-center gap-3 text-sm text-text-tertiary">
            <a
              href="https://github.com/851-labs/skills"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-secondary"
            >
              GitHub
            </a>
            <span className="text-border">|</span>
            <a
              href="https://x.com/anthropaborat"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-secondary"
            >
              X
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
