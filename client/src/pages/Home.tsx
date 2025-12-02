import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArticlesResponse, SourcesResponse } from "@shared/schema";
import { StatsHeader } from "@/components/StatsHeader";
import { Sidebar } from "@/components/Sidebar";
import { ArticleGrid } from "@/components/ArticleGrid";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TimeFilterValue = "24h" | "7d" | "all";

export default function Home() {
  const { toast } = useToast();
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilterValue>("all");
  const [page, setPage] = useState(1);

  const getSinceDate = (filter: TimeFilterValue): string | undefined => {
    if (filter === "all") return undefined;
    const now = new Date();
    if (filter === "24h") {
      now.setHours(now.getHours() - 24);
    } else if (filter === "7d") {
      now.setDate(now.getDate() - 7);
    }
    return now.toISOString();
  };

  const { data: sourcesData, isLoading: isLoadingSources } = useQuery<SourcesResponse>({
    queryKey: ["/api/sources"],
  });

  const queryParams = new URLSearchParams();
  if (selectedSources.length > 0) {
    queryParams.set("sourceId", selectedSources.join(","));
  }
  if (searchQuery) {
    queryParams.set("search", searchQuery);
  }
  const sinceDate = getSinceDate(timeFilter);
  if (sinceDate) {
    queryParams.set("since", sinceDate);
  }
  queryParams.set("page", page.toString());
  queryParams.set("pageSize", "20");

  const queryString = queryParams.toString();
  const articlesUrl = `/api/articles${queryString ? `?${queryString}` : ""}`;

  const { data: articlesData, isLoading: isLoadingArticles } = useQuery<ArticlesResponse>({
    queryKey: [articlesUrl],
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/refresh"),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            typeof key === "string" && key.startsWith("/api/articles")
          );
        },
      });
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            typeof key === "string" && key.startsWith("/api/sources")
          );
        },
      });
      toast({
        title: "Feed refreshed",
        description: "Articles have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Refresh failed",
        description: "Unable to refresh the feed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: ({ articleId, isBookmarked }: { articleId: string; isBookmarked: boolean }) => {
      if (isBookmarked) {
        return apiRequest("DELETE", "/api/bookmarks", { articleId });
      } else {
        return apiRequest("POST", "/api/bookmarks", { articleId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/articles");
        },
        refetchType: "active",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bookmark.",
        variant: "destructive",
      });
    },
  });

  const readMutation = useMutation({
    mutationFn: (articleId: string) => {
      return apiRequest("POST", "/api/read", { articleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/articles");
        },
        refetchType: "active",
      });
    },
  });

  const handleBookmark = useCallback((articleId: string, isBookmarked: boolean) => {
    bookmarkMutation.mutate({ articleId, isBookmarked });
  }, [bookmarkMutation]);

  const handleRead = useCallback((articleId: string) => {
    readMutation.mutate(articleId);
  }, [readMutation]);

  const handleSourceToggle = useCallback((sourceId: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
  }, []);

  const handleTimeFilterChange = useCallback((value: TimeFilterValue) => {
    setTimeFilter(value);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedSources([]);
    setSearchQuery("");
    setTimeFilter("all");
    setPage(1);
  }, []);

  const hasActiveFilters =
    selectedSources.length > 0 || searchQuery !== "" || timeFilter !== "all";

  const articles = articlesData?.articles || [];
  const totalArticles = articlesData?.total || 0;
  const totalPages = articlesData?.totalPages || 1;
  const sources = sourcesData?.sources || [];
  const lastRefreshTime = sourcesData?.lastRefreshTime || null;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        sources={sources}
        selectedSources={selectedSources}
        searchQuery={searchQuery}
        timeFilter={timeFilter}
        onSourceToggle={handleSourceToggle}
        onSearchChange={handleSearchChange}
        onTimeFilterChange={handleTimeFilterChange}
        onClearFilters={handleClearFilters}
        isLoadingSources={isLoadingSources}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <StatsHeader
          totalArticles={totalArticles}
          totalSources={sources.length}
          lastRefreshTime={lastRefreshTime}
          onRefresh={() => refreshMutation.mutate()}
          isRefreshing={refreshMutation.isPending}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <ArticleGrid 
              articles={articles} 
              isLoading={isLoadingArticles}
              onBookmark={handleBookmark}
              onRead={handleRead}
              isBookmarking={bookmarkMutation.isPending}
            />

            {!isLoadingArticles && articles.length > 0 && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2" data-testid="pagination">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4" data-testid="text-page-info">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
