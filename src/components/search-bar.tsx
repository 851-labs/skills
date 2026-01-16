import { Search } from "lucide-react";
import { useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function SearchBar({ value, onChange, placeholder = "Search skills..." }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd+K or Ctrl+K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full border border-border bg-bg-secondary pl-10 pr-12 font-mono text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
      />
      <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 border border-border bg-bg-tertiary px-1.5 py-0.5 font-mono text-xs text-text-tertiary sm:inline-block">
        ⌘K
      </kbd>
    </div>
  );
}

export { SearchBar };
