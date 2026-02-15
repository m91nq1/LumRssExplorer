import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArticleWithStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Clock,
  Share2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ChevronDown,
  Loader2,
  FileText,
  BookOpen,
  Timer,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { formatDistanceToNow, format } from "date-fns";
import { PolarisationPanel } from "@/components/PolarisationBadge";

function estimateReadTime(content?: string | null, summary?: string | null): number {
  const text = content || summary || "";
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
}

interface RelatedArticlesResponse {
  articles: ArticleWithStatus[];
}

interface ArticleNeighbors {
  prev: string | null;
  next: string | null;
}

interface ExtractedContent {
  title?: string;
  content?: string;
  author?: string;
  publishedTime?: string;
  source?: string;
  image?: string;
  wordCount: number;
  cached: boolean;
}

export default function ArticleDetail() {
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const articleId = params.id;

  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const mainRef = useRef<HTMLElement>(null);
  const progressSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { data: article, isLoading: isLoadingArticle } = useQuery<ArticleWithStatus>({
    queryKey: [`/api/articles/${articleId}`],
    enabled: !!articleId,
  });

  const { data: relatedData, isLoading: isLoadingRelated } = useQuery<RelatedArticlesResponse>({
    queryKey: [`/api/articles/${articleId}/related`],
    enabled: !!articleId,
  });

  const { data: neighbors } = useQuery<ArticleNeighbors>({
    queryKey: [`/api/articles/${articleId}/neighbors`],
    enabled: !!articleId,
  });

  const { data: extractedContent, isLoading: isExtractingContent, refetch: extractContent } = useQuery<ExtractedContent>({
    queryKey: [`/api/articles/${articleId}/content`],
    enabled: false,
  });

  const bookmarkMutation = useMutation({
    mutationFn: (isBookmarked: boolean) => {
      if (isBookmarked) {
        return apiRequest("DELETE", "/api/bookmarks", { articleId });
      } else {
        return apiRequest("POST", "/api/bookmarks", { articleId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/articles/${articleId}`],
        refetchType: "active",
      });
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
    mutationFn: () => apiRequest("POST", "/api/read", { articleId }),
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

  const aiSummaryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/articles/${articleId}/ai-summary`, {});
      return response.json();
    },
    onSuccess: (data: { summary: string; cached: boolean }) => {
      setGeneratedSummary(data.summary);
      queryClient.invalidateQueries({
        queryKey: [`/api/articles/${articleId}`],
      });
      toast({
        title: data.cached ? "AI Summary Retrieved" : "AI Summary Generated",
        description: data.cached 
          ? "Loaded previously generated summary."
          : "Summary generated using AI.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "AI Summary Failed",
        description: error.message || "Failed to generate AI summary.",
        variant: "destructive",
      });
    },
  });

  const saveProgressMutation = useMutation({
    mutationFn: (data: { scrollPosition: number; percentRead: number }) => 
      apiRequest("POST", "/api/reading-progress", { articleId, ...data }),
  });

  const { data: savedProgress } = useQuery<{ progress: { scrollPosition: number; percentRead: number } | null }>({
    queryKey: [`/api/reading-progress/${articleId}`],
    enabled: !!articleId,
  });

  const saveProgress = useCallback((scrollPos: number, percent: number) => {
    if (progressSaveTimeoutRef.current) {
      clearTimeout(progressSaveTimeoutRef.current);
    }
    progressSaveTimeoutRef.current = setTimeout(() => {
      saveProgressMutation.mutate({ scrollPosition: scrollPos, percentRead: percent });
    }, 2000);
  }, [saveProgressMutation]);

  useEffect(() => {
    if (savedProgress?.progress && savedProgress.progress.percentRead > 0) {
      setReadProgress(savedProgress.progress.percentRead);
      if (savedProgress.progress.scrollPosition > 0) {
        window.scrollTo({ top: savedProgress.progress.scrollPosition, behavior: "smooth" });
      }
    }
  }, [savedProgress]);

  useEffect(() => {
    let rafId: number | null = null;
    let lastScrollTime = 0;
    const THROTTLE_MS = 100;
    
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime < THROTTLE_MS) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => updateProgress());
        return;
      }
      lastScrollTime = now;
      updateProgress();
    };
    
    const updateProgress = () => {
      if (!mainRef.current) return;
      
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;
      
      setReadProgress(percent);
      saveProgress(scrollTop, percent);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
      if (progressSaveTimeoutRef.current) {
        clearTimeout(progressSaveTimeoutRef.current);
      }
    };
  }, [saveProgress]);

  const handleOpenArticle = () => {
    if (article) {
      readMutation.mutate();
      window.open(article.link, "_blank", "noopener,noreferrer");
    }
  };

  const handleShare = async () => {
    if (article) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: article.title,
            url: article.link,
          });
        } else {
          await navigator.clipboard.writeText(article.link);
          toast({
            title: "Link copied",
            description: "Article link has been copied to clipboard.",
          });
        }
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
  };

  if (isLoadingArticle) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 sm:h-16 border-b border-border bg-background sticky top-0 z-10">
          <div className="h-full max-w-4xl mx-auto px-3 sm:px-6 flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-48 mb-8" />
          <Skeleton className="h-40 w-full" />
        </main>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-14 sm:h-16 border-b border-border bg-background sticky top-0 z-10">
          <div className="h-full max-w-4xl mx-auto px-3 sm:px-6 flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-lg sm:text-xl font-semibold">Article Not Found</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8 text-center">
          <p className="text-muted-foreground">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/">
            <Button className="mt-4">Go Back Home</Button>
          </Link>
        </main>
      </div>
    );
  }

  const formattedTime = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
  });
  const fullDate = format(new Date(article.publishedAt), "MMMM d, yyyy 'at' h:mm a");
  const relatedArticles = relatedData?.articles || [];
  const readTime = estimateReadTime(article.content, article.summary);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={readProgress} className="h-1 rounded-none" />
      </div>
      <header className="h-14 sm:h-16 border-b border-border bg-background sticky top-0 z-10 mt-1">
        <div className="h-full max-w-4xl mx-auto px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Badge variant="secondary" className="text-xs font-medium uppercase truncate max-w-[120px] sm:max-w-none">
              {article.sourceName}
            </Badge>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {neighbors?.prev && (
              <Link href={`/article/${neighbors.prev}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Previous article (newer)"
                  data-testid="button-prev-article"
                  className="hidden sm:inline-flex"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
            )}
            {neighbors?.next && (
              <Link href={`/article/${neighbors.next}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Next article (older)"
                  data-testid="button-next-article"
                  className="hidden sm:inline-flex"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => bookmarkMutation.mutate(!!article.isBookmarked)}
              disabled={bookmarkMutation.isPending}
              data-testid="button-bookmark"
            >
              {article.isBookmarked ? (
                <BookmarkCheck className="w-5 h-5 text-primary" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              data-testid="button-share"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button onClick={handleOpenArticle} size="sm" data-testid="button-read-original">
              <ExternalLink className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Read Original</span>
            </Button>
          </div>
        </div>
      </header>

      <main ref={mainRef} className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <article>
          <h1
            className="text-xl sm:text-3xl font-bold leading-tight mb-4"
            data-testid="text-article-title"
          >
            {article.title}
          </h1>

          <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <time dateTime={article.publishedAt} title={fullDate}>
                {formattedTime}
              </time>
            </div>
            <span>•</span>
            <span>{article.sourceName}</span>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              <span data-testid="text-read-time">{readTime} min read</span>
            </div>
            {readProgress > 0 && (
              <>
                <span>•</span>
                <span className="text-primary" data-testid="text-read-progress">{readProgress}% read</span>
              </>
            )}
          </div>

          {article.imageUrl && (
            <div className="mb-8 rounded-md overflow-hidden">
              <img
                src={article.imageUrl}
                alt=""
                className="w-full h-auto object-cover"
                data-testid="img-article"
              />
            </div>
          )}

          {article.summary && (
            <div
              className="prose prose-lg dark:prose-invert max-w-none mb-8"
              data-testid="text-article-summary"
            >
              <p className="text-lg leading-relaxed">{article.summary}</p>
            </div>
          )}

          {article.polarisationScore && article.polarisationScore >= 25 && (
            <div className="mb-8">
              <PolarisationPanel 
                score={article.polarisationScore} 
                reasons={article.polarisationReasons}
              />
            </div>
          )}

          <Collapsible
            open={aiSummaryOpen}
            onOpenChange={setAiSummaryOpen}
            className="mb-8"
          >
            <Card className="border-primary/20">
              <CollapsibleTrigger asChild>
                <button
                  className="w-full p-4 flex items-center justify-between hover-elevate rounded-xl"
                  data-testid="button-ai-summary-toggle"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">AI-Powered Summary</h3>
                      <p className="text-sm text-muted-foreground">
                        Get an intelligent analysis using AI
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                      aiSummaryOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="px-4 pb-4">
                <Separator className="mb-4" />

                {(article.aiSummary || generatedSummary) && (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none mb-4 p-4 bg-primary/5 rounded-lg border border-primary/10"
                    data-testid="text-ai-summary"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-primary uppercase tracking-wider">
                        AI Summary
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {generatedSummary || article.aiSummary}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => aiSummaryMutation.mutate()}
                    disabled={aiSummaryMutation.isPending}
                    data-testid="button-generate-summary"
                  >
                    {aiSummaryMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : article.aiSummary || generatedSummary ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Regenerate Summary
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Summary
                      </>
                    )}
                  </Button>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible
            open={showFullContent}
            onOpenChange={setShowFullContent}
            className="mb-8"
          >
            <Card className="border-blue-500/20">
              <CollapsibleTrigger asChild>
                <button
                  className="w-full p-4 flex items-center justify-between hover-elevate rounded-xl"
                  data-testid="button-full-content-toggle"
                  onClick={() => {
                    if (!showFullContent && !extractedContent) {
                      extractContent();
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <BookOpen className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Full Article Content</h3>
                      <p className="text-sm text-muted-foreground">
                        {extractedContent
                          ? `${extractedContent.wordCount} words${extractedContent.cached ? " (cached)" : ""}`
                          : "Extract and read the full article here"}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                      showFullContent ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="px-4 pb-4">
                <Separator className="mb-4" />

                {isExtractingContent ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-3" />
                    <span className="text-muted-foreground">Extracting article content...</span>
                  </div>
                ) : extractedContent?.content ? (
                  <div className="space-y-4">
                    {extractedContent.author && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>By {extractedContent.author}</span>
                      </div>
                    )}
                    <div
                      className="prose prose-base dark:prose-invert max-w-none leading-relaxed"
                      data-testid="text-full-content"
                    >
                      {extractedContent.content.split("\n\n").map((paragraph, idx) => (
                        <p key={idx} className="mb-4">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">
                      Unable to extract full content. The article may be behind a paywall or blocked.
                    </p>
                    <Button onClick={handleOpenArticle} variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Read on {article.sourceName}
                    </Button>
                  </div>
                )}
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <div className="bg-muted/50 rounded-md p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Want to read the original article with all formatting?
              </p>
              <Button onClick={handleOpenArticle} className="w-full sm:w-auto">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open on {article.sourceName}
              </Button>
            </div>
          </div>
        </article>

        {relatedArticles.length > 0 && (
          <>
            <Separator className="my-8" />

            <section>
              <h2 className="text-xl font-semibold mb-6">
                More from {article.sourceName}
              </h2>

              {isLoadingRelated ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-48" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="related-articles">
                  {relatedArticles.map((related) => (
                    <Link
                      key={related.id}
                      href={`/article/${related.id}`}
                    >
                      <Card
                        className="overflow-hidden hover-elevate cursor-pointer h-full flex flex-col"
                        data-testid={`related-article-${related.id}`}
                      >
                        {related.imageUrl ? (
                          <div className="aspect-video w-full overflow-hidden bg-muted">
                            <img
                              src={related.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video w-full bg-muted flex items-center justify-center">
                            <FileText className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-medium line-clamp-2 mb-2 flex-1">
                            {related.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
                            <Clock className="w-3 h-3" />
                            <time dateTime={related.publishedAt}>
                              {formatDistanceToNow(new Date(related.publishedAt), {
                                addSuffix: true,
                              })}
                            </time>
                            {related.isRead && (
                              <>
                                <span>•</span>
                                <Badge variant="secondary" className="text-xs py-0">Read</Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
