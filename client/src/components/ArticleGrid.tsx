import { ArticleWithStatus } from "@shared/schema";
import { ArticleCard } from "./ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

interface ArticleGridProps {
  articles: ArticleWithStatus[];
  isLoading: boolean;
  onBookmark?: (articleId: string, isBookmarked: boolean) => void;
  onRead?: (articleId: string) => void;
  isBookmarking?: boolean;
}

export function ArticleGrid({ articles, isLoading, onBookmark, onRead, isBookmarking }: ArticleGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3 border border-gray-200 dark:border-card-border rounded-md bg-gray-50 dark:bg-transparent">
            <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-md shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4" data-testid="empty-state">
        <div className="rounded-full bg-muted p-6 mb-6">
          <FileText className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No articles found</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Try adjusting your filters or search query to find more articles.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="article-grid">
      {articles.map((article) => (
        <ArticleCard 
          key={article.id} 
          article={article} 
          onBookmark={onBookmark}
          onRead={onRead}
          isBookmarking={isBookmarking}
        />
      ))}
    </div>
  );
}
