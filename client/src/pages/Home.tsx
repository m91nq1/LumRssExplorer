import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArticlesResponse, SourcesResponse, UserPreferences } from "@shared/schema";
import { StatsHeader } from "@/components/StatsHeader";
import { Sidebar } from "@/components/Sidebar";
import { ArticleGrid } from "@/components/ArticleGrid";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import feedBgImage from "@assets/Vector-black-abstract-background-free-vector-download-01-scale_1766257999979.jpg";

type TimeFilterValue = "24h" | "7d" | "all";

interface PreferencesResponse {
  preferences: UserPreferences | null;
}

export default function Home() {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilterValue>("all");
  const [mostPolarised, setMostPolarised] = useState(false);
  const [page, setPage] = useState(1);
  const preferencesAppliedRef = useRef(false);

  const { data: preferencesData } = useQuery<PreferencesResponse>({
    queryKey: ["/api/preferences"],
  });

  useEffect(() => {
    if (preferencesData?.preferences && !preferencesAppliedRef.current) {
      const prefs = preferencesData.preferences;
      if (prefs.favoriteSources && prefs.favoriteSources.length > 0) {
        setSelectedSources(prefs.favoriteSources);
      }
      if (prefs.defaultSearchQuery) {
        setSearchQuery(prefs.defaultSearchQuery);
      }
      if (prefs.defaultTimeFilter) {
        setTimeFilter(prefs.defaultTimeFilter as TimeFilterValue);
      }
      preferencesAppliedRef.current = true;
    }
  }, [preferencesData]);

  const savePreferencesMutation = useMutation({
    mutationFn: (prefs: { favoriteSources?: string[]; defaultSearchQuery?: string; defaultTimeFilter?: string }) => {
      return apiRequest("POST", "/api/preferences", prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      toast({
        title: "Preferences saved",
        description: "Your filter preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preferences.",
        variant: "destructive",
      });
    },
  });

  const handleSavePreferences = useCallback(() => {
    savePreferencesMutation.mutate({
      favoriteSources: selectedSources.length > 0 ? selectedSources : [],
      defaultSearchQuery: searchQuery || undefined,
      defaultTimeFilter: timeFilter,
    });
  }, [selectedSources, searchQuery, timeFilter, savePreferencesMutation]);

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
  if (selectedTopics.length > 0) {
    queryParams.set("topics", selectedTopics.join(","));
  }
  if (selectedRegions.length > 0) {
    queryParams.set("regions", selectedRegions.join(","));
  }
  if (searchQuery) {
    queryParams.set("search", searchQuery);
    queryParams.set("caseSensitive", "false");
    queryParams.set("exactPhrase", "true");
  }
  const sinceDate = getSinceDate(timeFilter);
  if (sinceDate) {
    queryParams.set("since", sinceDate);
  }
  if (mostPolarised) {
    queryParams.set("mostPolarised", "true");
  }
  queryParams.set("page", page.toString());
  queryParams.set("pageSize", "20");

  const queryString = queryParams.toString();
  const articlesUrl = `/api/articles${queryString ? `?${queryString}` : ""}`;

  const { data: articlesData, isLoading: isLoadingArticles, isFetching } = useQuery<ArticlesResponse>({
    queryKey: ["/api/articles", { sourceId: selectedSources.join(","), topics: selectedTopics.join(","), regions: selectedRegions.join(","), search: searchQuery, timeFilter, mostPolarised, page }],
    queryFn: async () => {
      const response = await fetch(articlesUrl);
      if (!response.ok) throw new Error("Failed to fetch articles");
      return response.json();
    },
    staleTime: 0,
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

  const handleTopicToggle = useCallback((topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
    setPage(1);
  }, []);

  const handleRegionToggle = useCallback((region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
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

  const handleMostPolarisedChange = useCallback((value: boolean) => {
    setMostPolarised(value);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedSources([]);
    setSelectedTopics([]);
    setSelectedRegions([]);
    setSearchQuery("");
    setTimeFilter("all");
    setMostPolarised(false);
    setPage(1);
  }, []);

  const hasActiveFilters =
    selectedSources.length > 0 ||
    selectedTopics.length > 0 ||
    selectedRegions.length > 0 ||
    searchQuery !== "" ||
    timeFilter !== "all" ||
    mostPolarised;

  const articles = articlesData?.articles || [];
  const totalArticles = articlesData?.total || 0;
  const totalPages = articlesData?.totalPages || 1;
  const sources = sourcesData?.sources || [];
  const lastRefreshTime = sourcesData?.lastRefreshTime || null;

  return (
    <div 
      className="flex h-screen w-full overflow-hidden"
      style={{
        backgroundColor: theme === 'light' ? '#ffffff' : 'transparent',
        backgroundImage: theme === 'dark' ? `url(${feedBgImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <Sidebar
        sources={sources}
        selectedSources={selectedSources}
        selectedTopics={selectedTopics}
        selectedRegions={selectedRegions}
        searchQuery={searchQuery}
        timeFilter={timeFilter}
        mostPolarised={mostPolarised}
        onSourceToggle={handleSourceToggle}
        onTopicToggle={handleTopicToggle}
        onRegionToggle={handleRegionToggle}
        onSearchChange={handleSearchChange}
        onTimeFilterChange={handleTimeFilterChange}
        onMostPolarisedChange={handleMostPolarisedChange}
        onClearFilters={handleClearFilters}
        onSavePreferences={handleSavePreferences}
        isLoadingSources={isLoadingSources}
        hasActiveFilters={hasActiveFilters}
        isSavingPreferences={savePreferencesMutation.isPending}
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
              isLoading={isLoadingArticles || isFetching}
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
