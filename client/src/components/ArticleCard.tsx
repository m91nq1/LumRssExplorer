import { ArticleWithStatus } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Bookmark, BookmarkCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { PolarisationBadge } from "./PolarisationBadge";

interface ArticleCardProps {
  article: ArticleWithStatus;
  onBookmark?: (articleId: string, isBookmarked: boolean) => void;
  onRead?: (articleId: string) => void;
  isBookmarking?: boolean;
}

export function ArticleCard({ article, onBookmark, onRead, isBookmarking }: ArticleCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a')) {
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

  const getTopicBadge = () => {
    if (article.topics?.includes("Celebrity & Entertainment")) {
      return "Entertainment";
    }
    if (article.topics?.includes("Sports")) {
      return "Sports";
    }
    if (article.topics?.includes("Science & Health")) {
      return "Health";
    }
    if (article.topics?.includes("War/Conflict")) {
      return "World";
    }
    if (article.topics?.includes("US Politics")) {
      return "Politics";
    }
    if (article.topics?.includes("AI & Technology")) {
      return "Tech";
    }
    if (article.topics?.includes("Finance & Markets")) {
      return "Finance";
    }
    return null;
  };

  const topicBadge = getTopicBadge();

  return (
    <Card
      className={`group p-4 sm:p-[18px] cursor-pointer rounded-xl border border-border/80 bg-card shadow-none transition-all duration-150 hover:border-foreground/25 hover:bg-muted/35 active:scale-[0.995] dark:bg-[#1a1a1f] dark:border-[#37373e] dark:hover:bg-[#202025] ${article.isRead ? 'opacity-[0.65]' : ''}`}
      onClick={handleClick}
      data-testid={`card-article-${article.id}`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="h-[21px] rounded-md px-2 text-[10px] font-semibold uppercase tracking-[0.07em] shrink-0 border-border/80 text-foreground/80 dark:border-white/30 dark:text-white/90"
              data-testid={`badge-source-${article.id}`}
            >
              {article.sourceName}
            </Badge>
            {topicBadge && (
              <Badge
                variant="outline"
                className="h-[21px] rounded-md px-2 text-[10px] font-medium shrink-0 border-border/80 text-muted-foreground dark:border-white/25 dark:text-white/75"
                data-testid={`badge-topic-${article.id}`}
              >
                {topicBadge}
              </Badge>
            )}
          </div>
          
          {onBookmark && (
            <Button
              variant="ghost"
              size="icon"
              className="-mr-1 h-7 w-7 shrink-0 rounded-md text-muted-foreground hover:text-foreground"
              onClick={handleBookmarkClick}
              disabled={isBookmarking}
              aria-label={article.isBookmarked ? "Remove bookmark" : "Bookmark article"}
              aria-pressed={!!article.isBookmarked}
              data-testid={`button-bookmark-${article.id}`}
            >
              {article.isBookmarked ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        <h3 className={`text-[15px] font-semibold leading-[1.3] tracking-[-0.015em] line-clamp-2 text-foreground dark:text-white ${article.isRead ? 'dark:text-white/65' : ''}`}>
          <a
            href={`/article/${article.id}`}
            className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            onClick={(e) => {
              e.stopPropagation();
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                onRead?.(article.id);
                window.open(article.link, "_blank", "noopener,noreferrer");
              } else {
                e.preventDefault();
                setLocation(`/article/${article.id}`);
              }
            }}
            data-testid={`text-title-${article.id}`}
          >
            {article.title}
          </a>
        </h3>

        {article.summary && (
          <p
            className="text-[13px] text-muted-foreground leading-[1.45] line-clamp-2 dark:text-white/60"
            data-testid={`text-summary-${article.id}`}
          >
            {article.summary}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground dark:text-white/50">
            <Clock className="w-3 h-3" aria-hidden="true" />
            <time dateTime={article.publishedAt} data-testid={`text-time-${article.id}`}>
              {formattedTime}
            </time>
          </div>
          <PolarisationBadge 
            score={article.polarisationScore} 
            reasons={article.polarisationReasons}
            compact
          />
        </div>
      </div>
    </Card>
  );
}
