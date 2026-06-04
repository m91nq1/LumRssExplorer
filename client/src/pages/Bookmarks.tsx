import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Bookmark, BookmarkX, Newspaper, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Article } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ArticleWithMeta extends Article {
  isBookmarked?: boolean;
  isRead?: boolean;
  region?: string;
  topic?: string;
}

interface ArticlesResponse {
  articles: ArticleWithMeta[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function Bookmarks() {
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<ArticlesResponse>({
    queryKey: ["/api/articles", { bookmarkedOnly: true }],
    queryFn: async () => {
      const response = await fetch("/api/articles?bookmarkedOnly=true&pageSize=100", {
        headers: {
          "X-Username": localStorage.getItem("lum-username") || "",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch bookmarks");
      return response.json();
    },
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const response = await fetch("/api/bookmarks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Username": localStorage.getItem("lum-username") || "",
        },
        body: JSON.stringify({ articleId }),
      });
      if (!response.ok) throw new Error("Failed to remove bookmark");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "Bookmark removed",
        description: "Article removed from your bookmarks.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove bookmark.",
        variant: "destructive",
      });
    },
  });

  const bookmarks = data?.articles || [];

  const getTopicColor = (topic: string | null) => {
    const colors: Record<string, string> = {
      "War/Conflict": "bg-red-500/20 text-red-300 border-red-500/30",
      "US Politics": "bg-blue-500/20 text-blue-300 border-blue-500/30",
      "Europe Politics": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      "AI & Technology": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      "Finance & Markets": "bg-green-500/20 text-green-300 border-green-500/30",
      "Crime & Justice": "bg-orange-500/20 text-orange-300 border-orange-500/30",
      "Science & Health": "bg-purple-500/20 text-purple-300 border-purple-500/30",
      "Sports": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      "Celebrity & Entertainment": "bg-pink-500/20 text-pink-300 border-pink-500/30",
      "Environment/Climate": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    };
    return colors[topic || ""] || "bg-gray-500/20 text-gray-300 border-gray-500/30";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading bookmarks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center gap-4">
          <Link href="/home">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold">Saved Stories</h1>
          </div>
          <div className="flex-1" />
          <Badge variant="secondary" className="gap-1" data-testid="badge-bookmark-count">
            <Bookmark className="h-3 w-3" />
            {bookmarks.length}
          </Badge>
        </div>
      </header>

      <main className="container py-6 max-w-4xl">
        <p className="text-muted-foreground mb-6">
          Articles you've bookmarked to come back to later.
        </p>

        {bookmarks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bookmark className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2" data-testid="text-empty-state">
                You haven't saved any stories yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                When you find articles you want to read later, click the bookmark icon to save them here.
              </p>
              <Link href="/home">
                <Button data-testid="button-browse-stories">
                  <Search className="h-4 w-4 mr-2" />
                  Browse Top Stories
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((article) => (
              <Card 
                key={article.id} 
                className="overflow-hidden hover-elevate transition-all"
                data-testid={`card-bookmark-${article.id}`}
              >
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    {article.imageUrl && (
                      <div className="hidden sm:block flex-shrink-0">
                        <img
                          src={article.imageUrl}
                          alt=""
                          className="w-32 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Link href={`/article/${article.id}`}>
                          <h3 
                            className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 cursor-pointer"
                            data-testid={`link-article-${article.id}`}
                          >
                            {article.title}
                          </h3>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 text-amber-500 hover:text-destructive"
                          onClick={() => removeBookmarkMutation.mutate(article.id)}
                          disabled={removeBookmarkMutation.isPending}
                          data-testid={`button-remove-bookmark-${article.id}`}
                        >
                          <BookmarkX className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {article.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {article.summary}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-muted-foreground">
                          {article.sourceId}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">
                          {article.publishedAt 
                            ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
                            : "Unknown date"}
                        </span>
                        {article.topic && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getTopicColor(article.topic)}`}
                          >
                            {article.topic}
                          </Badge>
                        )}
                        {article.region && (
                          <Badge variant="outline" className="text-xs">
                            {article.region}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
