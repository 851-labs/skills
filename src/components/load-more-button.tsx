import { Loader2 } from "lucide-react";

interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
  hasMore: boolean;
  loadedCount: number;
  totalCount: number;
}

function LoadMoreButton({
  onClick,
  isLoading,
  hasMore,
  loadedCount,
  totalCount,
}: LoadMoreButtonProps) {
  if (!hasMore) {
    return (
      <div className="py-8 text-center">
        <p className="font-mono text-sm text-text-tertiary">Showing all {loadedCount} skills</p>
      </div>
    );
  }

  return (
    <div className="py-8 text-center">
      <button
        onClick={onClick}
        disabled={isLoading}
        className="w-full max-w-md border border-border bg-bg-secondary px-6 py-3 font-mono text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </span>
        ) : (
          <span>
            Load More Skills ({loadedCount} of {totalCount})
          </span>
        )}
      </button>
    </div>
  );
}

export { LoadMoreButton };
