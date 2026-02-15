import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArticlesResponse, SourcesResponse, ArticleWithStatus } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  Grid3X3, 
  List, 
  Clock, 
  TrendingUp,
  Newspaper,
  Building2,
  Tag,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
  X,
  CaseSensitive,
  Quote,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "stories" | "articles";
type TimeFilter = "1h" | "24h" | "7d" | "all";

interface Suggestion {
  type: "topic" | "entity" | "source";
  value: string;
  label: string;
  count?: number;
}

export default function SearchExplore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("articles");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [page, setPage] = useState(1);
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [exactPhrase, setExactPhrase] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: sourcesData, isLoading: isLoadingSources } = useQuery<SourcesResponse>({
    queryKey: ["/api/sources"],
  });

  const getSinceDate = (filter: TimeFilter): string | undefined => {
    if (filter === "all") return undefined;
    const now = new Date();
    if (filter === "1h") {
      now.setHours(now.getHours() - 1);
    } else if (filter === "24h") {
      now.setHours(now.getHours() - 24);
    } else if (filter === "7d") {
      now.setDate(now.getDate() - 7);
    }
    return now.toISOString();
  };

  const queryParams = new URLSearchParams();
  if (selectedSources.length > 0) {
    queryParams.set("sourceId", selectedSources.join(","));
  }
  if (debouncedQuery) {
    queryParams.set("search", debouncedQuery);
    queryParams.set("caseSensitive", caseSensitive.toString());
    queryParams.set("exactPhrase", exactPhrase.toString());
  }
  const sinceDate = getSinceDate(timeFilter);
  if (sinceDate) {
    queryParams.set("since", sinceDate);
  }
  queryParams.set("page", page.toString());
  queryParams.set("pageSize", "20");

  const articlesUrl = `/api/articles?${queryParams.toString()}`;
  const { data: articlesData, isLoading: isLoadingArticles, isFetching } = useQuery<ArticlesResponse>({
    queryKey: ["/api/articles", { search: debouncedQuery, caseSensitive, exactPhrase, sources: selectedSources.join(","), timeFilter, page }],
    queryFn: async () => {
      const response = await fetch(articlesUrl);
      if (!response.ok) throw new Error("Failed to fetch articles");
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    placeholderData: undefined,
  });

  const sources = sourcesData?.sources || [];
  const articles = articlesData?.articles || [];
  const totalArticles = articlesData?.total || 0;
  const totalPages = articlesData?.totalPages || 1;

  const trendingTopics = useMemo(() => {
    const topicCounts = new Map<string, number>();
    articles.forEach((article) => {
      const words = article.title.toLowerCase().split(/\s+/);
      words.forEach((word) => {
        if (word.length > 4 && !["about", "their", "which", "would", "could", "should", "there", "where", "after", "before"].includes(word)) {
          topicCounts.set(word, (topicCounts.get(word) || 0) + 1);
        }
      });
    });
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([topic, count]) => ({ topic, count }));
  }, [articles]);

  const extractedEntities = useMemo(() => {
    const entityCounts = new Map<string, number>();
    const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "as", "is", "was", "are", "were", "been", "be", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "can", "this", "that", "these", "those", "it", "its", "new", "says", "said", "after", "before", "over", "into", "about", "how", "why", "what", "when", "where", "who", "which"]);
    
    articles.forEach((article) => {
      const words = article.title.split(/\s+/);
      words.forEach((word) => {
        const cleaned = word.replace(/[^a-zA-Z]/g, "");
        if (cleaned.length > 2 && cleaned[0] === cleaned[0].toUpperCase() && cleaned[0] !== cleaned[0].toLowerCase() && !stopWords.has(cleaned.toLowerCase())) {
          entityCounts.set(cleaned, (entityCounts.get(cleaned) || 0) + 1);
        }
      });
      
      const capitalizedPhrases = article.title.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g);
      if (capitalizedPhrases) {
        capitalizedPhrases.forEach((phrase) => {
          if (phrase.length > 3) {
            entityCounts.set(phrase, (entityCounts.get(phrase) || 0) + 1);
          }
        });
      }
    });
    
    return Array.from(entityCounts.entries())
      .filter(([entity, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([entity, count]) => ({ entity, count }));
  }, [articles]);

  const suggestions = useMemo((): Suggestion[] => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const results: Suggestion[] = [];

    sources.forEach((source) => {
      if (source.name.toLowerCase().includes(query)) {
        results.push({
          type: "source",
          value: source.id,
          label: source.name,
          count: source.articleCount,
        });
      }
    });

    extractedEntities.forEach(({ entity, count }) => {
      if (entity.toLowerCase().includes(query)) {
        results.push({
          type: "entity",
          value: entity,
          label: entity,
          count,
        });
      }
    });

    trendingTopics.forEach(({ topic, count }) => {
      if (topic.includes(query)) {
        results.push({
          type: "topic",
          value: topic,
          label: topic.charAt(0).toUpperCase() + topic.slice(1),
          count,
        });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery, sources, trendingTopics, extractedEntities]);

  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    if (suggestion.type === "source") {
      setSelectedSources((prev) =>
        prev.includes(suggestion.value)
          ? prev
          : [...prev, suggestion.value]
      );
      setSearchQuery("");
    } else {
      setSearchQuery(suggestion.label);
    }
    setShowSuggestions(false);
    setPage(1);
  }, []);

  const handleSourceToggle = useCallback((sourceId: string) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedSources([]);
    setSearchQuery("");
    setDebouncedQuery("");
    setTimeFilter("all");
    setPage(1);
  }, []);

  const hasActiveFilters = selectedSources.length > 0 || debouncedQuery !== "" || timeFilter !== "all";

  const groupedArticles = useMemo(() => {
    if (viewMode === "articles") return null;
    
    const groups = new Map<string, ArticleWithStatus[]>();
    articles.forEach((article) => {
      const existing = groups.get(article.sourceName) || [];
      existing.push(article);
      groups.set(article.sourceName, existing);
    });
    return Array.from(groups.entries()).map(([source, items]) => ({
      source,
      articles: items,
      latestDate: items[0]?.publishedAt,
    }));
  }, [articles, viewMode]);

  const timeFilters: { value: TimeFilter; label: string }[] = [
    { value: "1h", label: "Last hour" },
    { value: "24h", label: "24 hours" },
    { value: "7d", label: "7 days" },
    { value: "all", label: "All time" },
  ];

  return (
    <div className="min-h-screen bg-background dark">
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />
      
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="link-back-home">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Feed</span>
              </Button>
            </Link>

            <div className="flex-1 max-w-2xl relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="pl-9 sm:pl-10 pr-10 h-9 sm:h-11 bg-secondary/50 border-border/50 focus:bg-secondary focus:border-primary/50 transition-all text-sm sm:text-base"
                  data-testid="input-search"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => {
                      setSearchQuery("");
                      setDebouncedQuery("");
                      searchInputRef.current?.focus();
                    }}
                    data-testid="button-clear-search"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50"
                    data-testid="search-suggestions"
                  >
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.type}-${suggestion.value}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover-elevate text-left transition-colors"
                        data-testid={`suggestion-${suggestion.type}-${index}`}
                      >
                        {suggestion.type === "source" && (
                          <Building2 className="w-4 h-4 text-primary" />
                        )}
                        {suggestion.type === "topic" && (
                          <Tag className="w-4 h-4 text-chart-2" />
                        )}
                        {suggestion.type === "entity" && (
                          <TrendingUp className="w-4 h-4 text-chart-3" />
                        )}
                        <span className="flex-1 font-medium">{suggestion.label}</span>
                        {suggestion.count !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.count}
                          </Badge>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList className="bg-secondary/50">
                  <TabsTrigger value="articles" className="gap-2" data-testid="tab-articles">
                    <List className="w-4 h-4" />
                    <span className="hidden sm:inline">Articles</span>
                  </TabsTrigger>
                  <TabsTrigger value="stories" className="gap-2" data-testid="tab-stories">
                    <Grid3X3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Stories</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <aside className="lg:w-64 flex-shrink-0 space-y-4 sm:space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time Period
              </h3>
              <div className="flex flex-wrap gap-2">
                {timeFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={timeFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setTimeFilter(filter.value);
                      setPage(1);
                    }}
                    className="text-xs"
                    data-testid={`filter-time-${filter.value}`}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Newspaper className="w-4 h-4" />
                  Sources
                </h3>
                {selectedSources.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSources([])}
                    className="text-xs h-auto py-1 px-2"
                    data-testid="button-clear-sources"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[200px]">
                <div className="space-y-1 pr-4">
                  {isLoadingSources ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))
                  ) : (
                    sources.map((source) => (
                      <button
                        key={source.id}
                        onClick={() => handleSourceToggle(source.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all ${
                          selectedSources.includes(source.id)
                            ? "bg-primary text-primary-foreground"
                            : "hover-elevate"
                        }`}
                        data-testid={`source-filter-${source.id}`}
                      >
                        <span className="truncate">{source.name}</span>
                        <Badge
                          variant={selectedSources.includes(source.id) ? "secondary" : "outline"}
                          className="text-xs ml-2"
                        >
                          {source.articleCount}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingTopics.slice(0, 6).map(({ topic, count }) => (
                  <Badge
                    key={topic}
                    variant="outline"
                    className="cursor-pointer hover-elevate transition-all"
                    onClick={() => {
                      setSearchQuery(topic);
                      setPage(1);
                    }}
                    data-testid={`trending-${topic}`}
                  >
                    {topic}
                    <span className="ml-1 text-muted-foreground">({count})</span>
                  </Badge>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="w-full"
                data-testid="button-clear-all-filters"
              >
                Clear All Filters
              </Button>
            )}
          </aside>

          <main className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-xl font-semibold" data-testid="text-results-title">
                  {debouncedQuery ? `Results for "${debouncedQuery}"` : "Latest News"}
                </h2>
                <p className="text-sm text-muted-foreground" data-testid="text-results-count">
                  {totalArticles.toLocaleString()} articles found
                </p>
              </div>
              
              {debouncedQuery && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="exact-phrase"
                        checked={exactPhrase}
                        onCheckedChange={setExactPhrase}
                        data-testid="switch-exact-phrase"
                      />
                      <Label htmlFor="exact-phrase" className="text-sm flex items-center gap-1 cursor-pointer">
                        <Quote className="w-3.5 h-3.5" />
                        Exact phrase
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="case-sensitive"
                        checked={caseSensitive}
                        onCheckedChange={setCaseSensitive}
                        data-testid="switch-case-sensitive"
                      />
                      <Label htmlFor="case-sensitive" className="text-sm flex items-center gap-1 cursor-pointer">
                        <CaseSensitive className="w-3.5 h-3.5" />
                        Case-sensitive
                      </Label>
                    </div>
                  </div>
                  {caseSensitive && exactPhrase && (
                    <p className="text-xs text-muted-foreground">
                      Case-sensitive exact match is ON — results must contain the exact text.
                    </p>
                  )}
                </div>
              )}
            </div>

            {(isLoadingArticles || isFetching) ? (
              <div className="grid gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex gap-4">
                      <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : debouncedQuery && articles.length === 0 ? (
              <Card className="p-8 text-center border-border/50">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No exact case-sensitive matches found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find articles containing "{debouncedQuery}" with {caseSensitive ? "exact casing" : "the specified options"}.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {caseSensitive && (
                    <Button
                      variant="outline"
                      onClick={() => setCaseSensitive(false)}
                      data-testid="button-try-case-insensitive"
                    >
                      Try case-insensitive
                    </Button>
                  )}
                  {exactPhrase && (
                    <Button
                      variant="outline"
                      onClick={() => setExactPhrase(false)}
                      data-testid="button-try-partial-match"
                    >
                      Try partial match
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchQuery("");
                      setDebouncedQuery("");
                    }}
                    data-testid="button-clear-search-empty"
                  >
                    Clear search
                  </Button>
                </div>
              </Card>
            ) : viewMode === "articles" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="grid gap-4"
              >
                {articles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <Card
                      className="group p-4 hover-elevate transition-all cursor-pointer border-border/50"
                      data-testid={`card-article-${article.id}`}
                    >
                      <Link href={`/article/${article.id}`}>
                        <div className="flex gap-4">
                          {article.imageUrl && (
                            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                              <img
                                src={article.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {article.sourceName}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                              </span>
                            </div>
                            <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                              {article.title}
                            </h3>
                            {article.summary && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {article.summary}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {groupedArticles?.map((group, groupIndex) => (
                  <motion.div
                    key={group.source}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: groupIndex * 0.05 }}
                  >
                    <Card className="p-4 border-border/50" data-testid={`story-group-${groupIndex}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{group.source}</h3>
                            <p className="text-xs text-muted-foreground">
                              {group.articles.length} article{group.articles.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {group.latestDate && formatDistanceToNow(new Date(group.latestDate), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {group.articles.slice(0, 3).map((article) => (
                          <Link key={article.id} href={`/article/${article.id}`}>
                            <div
                              className="flex items-start gap-3 p-2 -mx-2 rounded-md hover-elevate transition-colors cursor-pointer"
                              data-testid={`story-article-${article.id}`}
                            >
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                                  {article.title}
                                </h4>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                                </span>
                              </div>
                              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                            </div>
                          </Link>
                        ))}
                        {group.articles.length > 3 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs text-muted-foreground"
                            onClick={() => handleSourceToggle(sources.find(s => s.name === group.source)?.id || "")}
                            data-testid={`button-show-more-${groupIndex}`}
                          >
                            +{group.articles.length - 3} more articles
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {!isLoadingArticles && !isFetching && articles.length === 0 && (
              <Card className="p-12 text-center border-border/50">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters
                </p>
                <Button variant="outline" onClick={handleClearFilters} data-testid="button-clear-empty">
                  Clear Filters
                </Button>
              </Card>
            )}

            {!isLoadingArticles && !isFetching && articles.length > 0 && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground" data-testid="text-page-info">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
