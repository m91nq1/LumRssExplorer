import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArticleWithStatus, SourcesResponse } from "@shared/schema";
import { ArticleGrid } from "@/components/ArticleGrid";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Sparkles, Zap, Layers, Clock, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "@/components/ThemeProvider";
import feedBgImage from "@assets/Vector-black-abstract-background-free-vector-download-01-scale_1766257999979.jpg";

interface ForYouResponse {
  articles: ArticleWithStatus[];
  inferredTopics: string[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ClusterResponse {
  clusters: Array<{
    topic: string;
    articles: ArticleWithStatus[];
  }>;
}

interface BreakingNewsResponse {
  articles: ArticleWithStatus[];
  personalized: boolean;
}

function estimateReadTime(summary?: string | null): number {
  if (!summary) return 2;
  const words = summary.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function ForYou() {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [page, setPage] = useState(1);

  const { data: forYouData, isLoading: isLoadingForYou } = useQuery<ForYouResponse>({
    queryKey: ["/api/for-you", page],
    queryFn: async () => {
      const res = await fetch(`/api/for-you?page=${page}&pageSize=20`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch personalized feed");
      return res.json();
    },
  });

  const { data: clustersData, isLoading: isLoadingClusters } = useQuery<ClusterResponse>({
    queryKey: ["/api/clusters"],
  });

  const { data: breakingData, isLoading: isLoadingBreaking } = useQuery<BreakingNewsResponse>({
    queryKey: ["/api/breaking-news"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/for-you"] });
      queryClient.invalidateQueries({ queryKey: ["/api/breaking-news"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bookmark.",
        variant: "destructive",
      });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (articleId: string) => apiRequest("POST", "/api/read-status", { articleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/for-you"] });
      queryClient.invalidateQueries({ queryKey: ["/api/breaking-news"] });
    },
  });

  const handleBookmark = (articleId: string, isBookmarked: boolean) => {
    bookmarkMutation.mutate({ articleId, isBookmarked });
  };

  const handleMarkRead = (articleId: string) => {
    markReadMutation.mutate(articleId);
  };

  const articles = forYouData?.articles || [];
  const inferredTopics = forYouData?.inferredTopics || [];
  const totalPages = forYouData?.totalPages || 1;
  const breakingNews = breakingData?.articles || [];
  const clusters = clustersData?.clusters || [];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/">
            <h1 className="text-xl font-bold text-primary cursor-pointer" data-testid="logo">LUM</h1>
          </Link>
          <span className="text-muted-foreground">/</span>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-medium">For You</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <BookOpen className="w-4 h-4 mr-2" />
              All Articles
            </Button>
          </Link>
        </div>
      </header>
      
      <div
        className="flex-1 flex"
        style={{
          backgroundImage: theme === "dark" ? `url(${feedBgImage})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <aside className="w-[280px] border-r border-border bg-sidebar dark:bg-black/90 flex-shrink-0" data-testid="sidebar-for-you">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">For You</h2>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Personalized articles based on your reading history and bookmarks.
              </p>

              {inferredTopics.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Your Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {inferredTopics.map((topic) => (
                      <Badge key={topic} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {inferredTopics.length === 0 && !isLoadingForYou && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">
                      Start reading and bookmarking articles to get personalized recommendations.
                    </p>
                    <Link href="/">
                      <Button variant="ghost" className="px-0 mt-2" data-testid="link-browse-articles">
                        Browse Articles
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              <div className="pt-4 space-y-2">
                <Link href="/">
                  <Button variant="ghost" className="w-full justify-start gap-2" data-testid="link-all-articles">
                    <BookOpen className="w-4 h-4" />
                    All Articles
                  </Button>
                </Link>
                <Link href="/bookmarks">
                  <Button variant="ghost" className="w-full justify-start gap-2" data-testid="link-bookmarks">
                    <Layers className="w-4 h-4" />
                    Bookmarks
                  </Button>
                </Link>
                <Link href="/history">
                  <Button variant="ghost" className="w-full justify-start gap-2" data-testid="link-history">
                    <Clock className="w-4 h-4" />
                    Reading History
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollArea>
        </aside>

        <main className="flex-1 overflow-auto p-6" data-testid="main-content">
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Breaking News</h2>
              <Badge variant="destructive" className="animate-pulse">Live</Badge>
            </div>
            
            {isLoadingBreaking ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </div>
            ) : breakingNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {breakingNews.slice(0, 3).map((article) => (
                  <Card key={article.id} className="hover-elevate transition-all" data-testid={`card-breaking-${article.id}`}>
                    <Link href={`/article/${article.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <span>{article.sourceName}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {estimateReadTime(article.summary)} min
                          </span>
                        </div>
                        <CardTitle className="text-sm line-clamp-2">{article.title}</CardTitle>
                      </CardHeader>
                      {article.summary && (
                        <CardContent className="pt-0">
                          <p className="text-xs text-muted-foreground line-clamp-2">{article.summary}</p>
                        </CardContent>
                      )}
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No breaking news at the moment.</p>
            )}
          </section>

          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Story Clusters</h2>
              <span className="text-sm text-muted-foreground">Multiple perspectives on trending stories</span>
            </div>
            
            {isLoadingClusters ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-lg" />
                ))}
              </div>
            ) : clusters.length > 0 ? (
              <div className="space-y-4">
                {clusters.slice(0, 3).map((cluster) => (
                  <Card key={cluster.topic} className="overflow-hidden" data-testid={`cluster-${cluster.topic.toLowerCase().replace(/\s+/g, '-')}`}>
                    <CardHeader className="pb-2 bg-muted/30">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm font-medium">{cluster.topic}</CardTitle>
                        <Badge variant="outline">{cluster.articles.length} sources</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {cluster.articles.slice(0, 4).map((article) => (
                          <Link key={article.id} href={`/article/${article.id}`}>
                            <div className="p-2 rounded-md hover-elevate border border-transparent hover:border-border transition-all" data-testid={`cluster-article-${article.id}`}>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <span className="font-medium">{article.sourceName}</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {estimateReadTime(article.summary)} min
                                </span>
                              </div>
                              <p className="text-sm line-clamp-2">{article.title}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No story clusters available.</p>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Recommended For You</h2>
            </div>

            {isLoadingForYou ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-lg" />
                ))}
              </div>
            ) : articles.length > 0 ? (
              <>
                <ArticleGrid
                  articles={articles}
                  isLoading={false}
                  onBookmark={handleBookmark}
                  onRead={handleMarkRead}
                />
                
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="p-8 text-center">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Personalized Articles Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start reading and bookmarking articles to get recommendations tailored to your interests.
                  </p>
                  <Link href="/">
                    <Button data-testid="button-browse-all">Browse All Articles</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
