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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 sm:p-6 border border-card-border rounded-md space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-32" />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6" data-testid="article-grid">
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
