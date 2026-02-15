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
      className={`p-3 cursor-pointer hover-elevate active-elevate-2 transition-all duration-150 bg-gray-50 dark:bg-[#1a1a1f] border-gray-200 dark:border-[#3a3a3f] ${article.isRead ? 'opacity-60' : ''}`}
      onClick={handleClick}
      data-testid={`card-article-${article.id}`}
    >
      <div className="flex gap-3">
        {article.imageUrl ? (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden bg-muted/30 shrink-0">
            <img 
              src={article.imageUrl} 
              alt="" 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-md bg-gray-100 dark:bg-[#1a1a1a] flex items-center justify-center shrink-0">
            <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-1 mb-1">
              <div className="flex flex-wrap items-center gap-1">
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold uppercase tracking-wider shrink-0 dark:border-white/40 dark:text-white"
                  data-testid={`badge-source-${article.id}`}
                >
                  {article.sourceName}
                </Badge>
                {topicBadge && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-medium shrink-0 dark:border-white/30 dark:text-white/90"
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
                  className="h-6 w-6 shrink-0"
                  onClick={handleBookmarkClick}
                  disabled={isBookmarking}
                  data-testid={`button-bookmark-${article.id}`}
                >
                  {article.isBookmarked ? (
                    <BookmarkCheck className="w-3.5 h-3.5" />
                  ) : (
                    <Bookmark className="w-3.5 h-3.5" />
                  )}
                </Button>
              )}
            </div>

            <h3
              className={`text-sm font-semibold leading-snug line-clamp-2 dark:text-white ${article.isRead ? 'dark:text-white/60' : ''}`}
              data-testid={`text-title-${article.id}`}
            >
              {article.title}
            </h3>
          </div>

          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground dark:text-white/50">
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
      </div>
    </Card>
  );
}
