import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
  text: string;
  className?: string;
}

function CopyButton({ text, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 border border-border bg-bg-tertiary px-2 py-1 text-xs text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary ${className}`}
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-accent" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

export { CopyButton };
