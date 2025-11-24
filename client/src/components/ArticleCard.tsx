import { Article } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const handleClick = () => {
    window.open(article.link, "_blank", "noopener,noreferrer");
  };

  const formattedTime = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
  });

  return (
    <Card
      className="p-6 cursor-pointer hover-elevate active-elevate-2 transition-all duration-150 border-card-border"
      onClick={handleClick}
      data-testid={`card-article-${article.id}`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <Badge
            variant="secondary"
            className="text-xs font-medium uppercase tracking-wide shrink-0"
            data-testid={`badge-source-${article.id}`}
          >
            {article.sourceName}
          </Badge>
        </div>

        <h3
          className="text-lg font-medium leading-snug line-clamp-2"
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

        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <time dateTime={article.publishedAt} data-testid={`text-time-${article.id}`}>
            {formattedTime}
          </time>
        </div>
      </div>
    </Card>
  );
}
