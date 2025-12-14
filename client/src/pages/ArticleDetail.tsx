import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArticleWithStatus } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { Link, useParams } from "wouter";
import { formatDistanceToNow, format } from "date-fns";

interface RelatedArticlesResponse {
  articles: ArticleWithStatus[];
}

interface ArticleNeighbors {
  prev: string | null;
  next: string | null;
}

export default function ArticleDetail() {
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const articleId = params.id;

  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);

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
          : "Summary generated using Grok AI.",
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
        <header className="h-16 border-b border-border bg-background sticky top-0 z-10">
          <div className="h-full max-w-4xl mx-auto px-6 flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8">
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
        <header className="h-16 border-b border-border bg-background sticky top-0 z-10">
          <div className="h-full max-w-4xl mx-auto px-6 flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Article Not Found</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-8 text-center">
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

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b border-border bg-background sticky top-0 z-10">
        <div className="h-full max-w-4xl mx-auto px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Badge variant="secondary" className="text-xs font-medium uppercase">
              {article.sourceName}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {neighbors?.prev && (
              <Link href={`/article/${neighbors.prev}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Previous article (newer)"
                  data-testid="button-prev-article"
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
            <Button onClick={handleOpenArticle} data-testid="button-read-original">
              <ExternalLink className="w-4 h-4 mr-2" />
              Read Original
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <article>
          <h1
            className="text-3xl font-bold leading-tight mb-4"
            data-testid="text-article-title"
          >
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <time dateTime={article.publishedAt} title={fullDate}>
                {formattedTime}
              </time>
            </div>
            <span>•</span>
            <span>{article.sourceName}</span>
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
                        Get an intelligent analysis using Grok AI
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
                        Grok AI Summary
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

          <div className="bg-muted/50 rounded-md p-6 mb-8">
            <p className="text-sm text-muted-foreground mb-4">
              This is a summary from the RSS feed. To read the full article:
            </p>
            <Button onClick={handleOpenArticle} className="w-full sm:w-auto">
              <ExternalLink className="w-4 h-4 mr-2" />
              Read Full Article on {article.sourceName}
            </Button>
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
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4" data-testid="related-articles">
                  {relatedArticles.map((related) => (
                    <Link
                      key={related.id}
                      href={`/article/${related.id}`}
                    >
                      <Card
                        className="p-4 hover-elevate cursor-pointer"
                        data-testid={`related-article-${related.id}`}
                      >
                        <h3 className="font-medium line-clamp-2 mb-2">
                          {related.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <time dateTime={related.publishedAt}>
                            {formatDistanceToNow(new Date(related.publishedAt), {
                              addSuffix: true,
                            })}
                          </time>
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
