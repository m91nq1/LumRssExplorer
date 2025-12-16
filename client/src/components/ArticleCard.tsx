import { ArticleWithStatus } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Bookmark, BookmarkCheck, ExternalLink, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

interface ArticleCardProps {
  article: ArticleWithStatus;
  onBookmark?: (articleId: string, isBookmarked: boolean) => void;
  onRead?: (articleId: string) => void;
  isBookmarking?: boolean;
}

export function ArticleCard({ article, onBookmark, onRead, isBookmarking }: ArticleCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      onRead?.(article.id);
      window.open(article.link, "_blank", "noopener,noreferrer");
    } else {
      setLocation(`/article/${article.id}`);
    }
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookmark?.(article.id, !!article.isBookmarked);
  };

  const formattedTime = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
  });

  return (
    <Card
      className={`p-6 cursor-pointer hover-elevate active-elevate-2 transition-all duration-150 border-card-border ${article.isRead ? 'opacity-70' : ''}`}
      onClick={handleClick}
      data-testid={`card-article-${article.id}`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className="text-xs font-medium uppercase tracking-wide shrink-0"
              data-testid={`badge-source-${article.id}`}
            >
              {article.sourceName}
            </Badge>
            {article.topics?.includes("Celebrity & Entertainment") && (
              <Badge
                variant="outline"
                className="text-xs font-medium shrink-0 bg-primary/10 text-primary border-primary/30"
                data-testid={`badge-entertainment-${article.id}`}
              >
                <Star className="w-3 h-3 mr-1" />
                Entertainment
              </Badge>
            )}
          </div>
          
          {onBookmark && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleBookmarkClick}
              disabled={isBookmarking}
              data-testid={`button-bookmark-${article.id}`}
            >
              {article.isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-primary" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        <h3
          className={`text-lg font-medium leading-snug line-clamp-2 ${article.isRead ? 'text-muted-foreground' : ''}`}
          data-testid={`text-title-${article.id}`}
        >
          {article.title}
        </h3>

        {article.summary && (
          <p
            className="text-[15px] text-muted-foreground leading-relaxed line-clamp-3"
            data-testid={`text-summary-${article.id}`}
          >
            {article.summary}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <time dateTime={article.publishedAt} data-testid={`text-time-${article.id}`}>
              {formattedTime}
            </time>
          </div>
          
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
    </Card>
  );
}
