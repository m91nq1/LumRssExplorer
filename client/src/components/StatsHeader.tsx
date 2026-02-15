import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RefreshCw, Settings, Search, LogOut, User, Info, Menu } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link, useLocation } from "wouter";
import { useSupabaseAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { ThemeToggle } from "@/components/ThemeToggle";
import lumLogo from "@assets/360_F_353288125_kzIlwWOzscGH8RiDCpw0ARd9U5heKZKu_1766077020756.jpg";

interface StatsHeaderProps {
  totalArticles: number;
  totalSources: number;
  lastRefreshTime: string | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onMobileMenuToggle?: () => void;
}

export function StatsHeader({
  totalArticles,
  totalSources,
  lastRefreshTime,
  onRefresh,
  isRefreshing,
  onMobileMenuToggle,
}: StatsHeaderProps) {
  const { user, isAuthenticated, signOut } = useSupabaseAuth();
  const { isAdmin } = useAdmin();
  const [, setLocation] = useLocation();
  const formattedRefreshTime = lastRefreshTime
    ? formatDistanceToNow(new Date(lastRefreshTime), { addSuffix: true })
    : "Never";

  const userInitials = user?.email?.[0]?.toUpperCase() || "U";
  const userName = user?.email || "User";

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-background sticky top-0 z-10">
      <div className="h-full max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {onMobileMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onMobileMenuToggle}
              data-testid="button-mobile-menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <Link href="/landing">
            <img 
              src={lumLogo} 
              alt="LUM News Logo" 
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
              data-testid="button-landing-page"
              title="Home"
            />
          </Link>
          <h1 className="text-lg sm:text-2xl font-semibold" data-testid="text-app-title">
            LUM News
          </h1>
          <Link href="/about" className="hidden sm:block">
            <Button
              variant="ghost"
              size="icon"
              data-testid="button-about-page"
              title="About"
            >
              <Info className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
          <div className="hidden lg:flex items-center gap-6" data-testid="stats-display">
            <span data-testid="text-total-articles">
              <span className="font-medium text-foreground">
                {totalArticles.toLocaleString()}
              </span>{" "}
              Articles
            </span>
            <span className="text-border">&bull;</span>
            <span data-testid="text-total-sources">
              <span className="font-medium text-foreground">{totalSources}</span>{" "}
              Sources
            </span>
            <span className="text-border">&bull;</span>
            <span data-testid="text-last-refresh">
              Updated {formattedRefreshTime}
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />

            <Link href="/search">
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-search-explore"
              >
                <Search className="w-4 h-4" />
              </Button>
            </Link>

            {isAdmin && (
              <Link href="/feeds">
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="button-feed-settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            )}

            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="icon"
              data-testid="button-refresh"
              className="sm:hidden"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              data-testid="button-refresh-desktop"
              className="gap-2 hidden sm:inline-flex"
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
                  <DropdownMenuItem 
                    onClick={async () => {
                      await signOut();
                      setLocation('/');
                    }}
                    className="cursor-pointer" 
                    data-testid="button-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
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
