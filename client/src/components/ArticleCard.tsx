import { ArticleWithStatus } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Bookmark, BookmarkCheck, ExternalLink, ImageIcon } from "lucide-react";
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
      className={`p-5 cursor-pointer hover-elevate active-elevate-2 transition-all duration-150 dark:bg-[#1a1a1f] dark:border-[#3a3a3f] ${article.isRead ? 'opacity-60' : ''}`}
      onClick={handleClick}
      data-testid={`card-article-${article.id}`}
    >
      <div className="space-y-4">
        {article.imageUrl ? (
          <div className="aspect-[16/9] rounded-md overflow-hidden bg-muted/30">
            <img 
              src={article.imageUrl} 
              alt="" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] rounded-md bg-muted/20 dark:bg-[#1a1a1a] flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs font-bold uppercase tracking-wider shrink-0 dark:border-white/40 dark:text-white"
              data-testid={`badge-source-${article.id}`}
            >
              {article.sourceName}
            </Badge>
            {topicBadge && (
              <Badge
                variant="outline"
                className="text-xs font-medium shrink-0 dark:border-white/30 dark:text-white/90"
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
              className="h-7 w-7 shrink-0"
              onClick={handleBookmarkClick}
              disabled={isBookmarking}
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

        <h3
          className={`text-base font-semibold leading-snug line-clamp-2 dark:text-white ${article.isRead ? 'dark:text-white/60' : ''}`}
          data-testid={`text-title-${article.id}`}
        >
          {article.title}
        </h3>

        {article.summary && (
          <p
            className="text-sm text-muted-foreground leading-relaxed line-clamp-2 dark:text-white/60"
            data-testid={`text-summary-${article.id}`}
          >
            {article.summary}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground dark:text-white/50">
            <Clock className="w-3 h-3" />
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
