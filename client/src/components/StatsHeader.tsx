import { Button } from "@/components/ui/button";
import { RefreshCw, Settings, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface StatsHeaderProps {
  totalArticles: number;
  totalSources: number;
  lastRefreshTime: string | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function StatsHeader({
  totalArticles,
  totalSources,
  lastRefreshTime,
  onRefresh,
  isRefreshing,
}: StatsHeaderProps) {
  const formattedRefreshTime = lastRefreshTime
    ? formatDistanceToNow(new Date(lastRefreshTime), { addSuffix: true })
    : "Never";

  return (
    <header className="h-16 border-b border-border bg-background sticky top-0 z-10">
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold" data-testid="text-app-title">
          LUM RSS Explorer
        </h1>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="hidden sm:flex items-center gap-6" data-testid="stats-display">
            <span data-testid="text-total-articles">
              <span className="font-medium text-foreground">
                {totalArticles.toLocaleString()}
              </span>{" "}
              Articles
            </span>
            <span className="text-border">•</span>
            <span data-testid="text-total-sources">
              <span className="font-medium text-foreground">{totalSources}</span>{" "}
              Sources
            </span>
            <span className="text-border">•</span>
            <span data-testid="text-last-refresh">
              Updated {formattedRefreshTime}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/search">
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-search-explore"
              >
                <Search className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/feeds">
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-feed-settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </Link>

            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              data-testid="button-refresh"
              className="gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
