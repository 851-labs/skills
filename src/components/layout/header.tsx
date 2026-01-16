import { Link } from "@tanstack/react-router";
import { Github } from "lucide-react";

function Header() {
  return (
    <header className="border-b border-border bg-bg-secondary">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-mono text-lg font-bold text-text-primary hover:text-accent">
          skills.surf
        </Link>

        <nav className="flex items-center gap-6">
          <a href="/submit" className="text-sm text-text-secondary hover:text-text-primary">
            Submit
          </a>
          <a
            href="https://github.com/851-labs/skills"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-secondary hover:text-text-primary"
          >
            <Github className="h-5 w-5" />
          </a>
        </nav>
      </div>
    </header>
  );
}

export { Header };
