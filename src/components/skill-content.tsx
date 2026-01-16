import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SkillContentProps {
  content: string;
}

function SkillContent({ content }: SkillContentProps) {
  return (
    <div className="prose prose-invert max-w-none">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="mb-4 mt-8 font-mono text-2xl font-bold text-text-primary first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-6 font-mono text-xl font-bold text-text-primary">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 font-mono text-lg font-bold text-text-primary">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-4 font-mono text-base font-bold text-text-primary">
              {children}
            </h4>
          ),

          // Paragraphs
          p: ({ children }) => <p className="mb-4 text-text-secondary">{children}</p>,

          // Lists
          ul: ({ children }) => (
            <ul className="mb-4 list-disc space-y-1 pl-6 text-text-secondary">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-1 pl-6 text-text-secondary">{children}</ol>
          ),
          li: ({ children }) => <li className="text-text-secondary">{children}</li>,

          // Code
          code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-bg-tertiary px-1.5 py-0.5 font-mono text-sm text-accent">
                  {children}
                </code>
              );
            }
            return (
              <code className="block overflow-x-auto bg-bg-primary p-4 font-mono text-sm text-text-primary">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto border border-border bg-bg-primary p-4">
              {children}
            </pre>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-hover"
            >
              {children}
            </a>
          ),

          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-2 border-accent pl-4 text-text-tertiary italic">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => <hr className="my-8 border-border" />,

          // Table
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto">
              <table className="w-full border-collapse border border-border text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-bg-tertiary">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-border px-4 py-2 text-left font-mono font-bold text-text-primary">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-2 text-text-secondary">{children}</td>
          ),

          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="font-bold text-text-primary">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-text-secondary">{children}</em>,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}

export { SkillContent };
