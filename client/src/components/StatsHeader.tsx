import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, Settings, Search, LogOut, User, Home, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

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
  const { user, isAuthenticated } = useAuth();
  const formattedRefreshTime = lastRefreshTime
    ? formatDistanceToNow(new Date(lastRefreshTime), { addSuffix: true })
    : "Never";

  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.[0]?.toUpperCase() || "U";

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "User";

  return (
    <header className="h-16 border-b border-border bg-background sticky top-0 z-10">
      <div className="h-full max-w-7xl mx-auto px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-landing-page"
              title="Home"
            >
              <Home className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/about">
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-about-page"
              title="About"
            >
              <Info className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold" data-testid="text-app-title">
            LUM News
          </h1>
        </div>

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

            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    data-testid="button-user-menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user?.profileImageUrl || undefined}
                        alt={userName}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{userName}</p>
                    {user?.email && (
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="cursor-pointer" data-testid="button-logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
