import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Clock, Trash2, Newspaper, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Article } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";

interface ArticleWithMeta extends Article {
  isBookmarked?: boolean;
  isRead?: boolean;
  readAt?: string;
  region?: string;
  topic?: string;
}

interface ReadHistoryResponse {
  articles: ArticleWithMeta[];
  total: number;
}

export default function History() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<ReadHistoryResponse>({
    queryKey: ["/api/read-history"],
    queryFn: async () => {
      const response = await fetch("/api/read-history?limit=100", {
        headers: {
          "X-Username": localStorage.getItem("lum-username") || "",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/read-history", {
        method: "DELETE",
        headers: {
          "X-Username": localStorage.getItem("lum-username") || "",
        },
      });
      if (!response.ok) throw new Error("Failed to clear history");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/read-history"] });
      toast({
        title: "History cleared",
        description: "Your reading history has been cleared.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear history.",
        variant: "destructive",
      });
    },
  });

  const history = data?.articles || [];

  const getTopicColor = (topic: string | null) => {
    const colors: Record<string, string> = {
      "War/Conflict": "bg-red-500/20 text-red-300 border-red-500/30",
      "US Politics": "bg-blue-500/20 text-blue-300 border-blue-500/30",
      "Europe Politics": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      "AI & Technology": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      "Finance & Markets": "bg-green-500/20 text-green-300 border-green-500/30",
      "Crime & Justice": "bg-orange-500/20 text-orange-300 border-orange-500/30",
      "Science & Health": "bg-purple-500/20 text-purple-300 border-purple-500/30",
      "Celebrity & Entertainment": "bg-pink-500/20 text-pink-300 border-pink-500/30",
      "Environment/Climate": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    };
    return colors[topic || ""] || "bg-gray-500/20 text-gray-300 border-gray-500/30";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading history...</div>
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
            <h1 className="text-lg font-semibold">Reading History</h1>
          </div>
          <div className="flex-1" />
          {history.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-clear-history">
                  <Trash2 className="h-4 w-4" />
                  Clear History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear reading history?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove all articles from your reading history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-clear">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => clearHistoryMutation.mutate()}
                    data-testid="button-confirm-clear"
                  >
                    Clear History
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      <main className="container py-6 max-w-4xl">
        <p className="text-muted-foreground mb-6">
          A timeline of the stories you've opened on LUM News.
        </p>

        {history.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2" data-testid="text-empty-state">
                You haven't read any stories yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                When you open articles, they'll appear here so you can easily find them again.
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
          <div className="space-y-3">
            {history.map((article, index) => (
              <Card 
                key={`${article.id}-${index}`}
                className="overflow-hidden hover-elevate transition-all"
                data-testid={`card-history-${article.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/article/${article.id}`}>
                        <h3 
                          className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2 cursor-pointer mb-1"
                          data-testid={`link-article-${article.id}`}
                        >
                          {article.title}
                        </h3>
                      </Link>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{article.sourceId}</span>
                        {article.topic && (
                          <>
                            <span>·</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getTopicColor(article.topic)}`}
                            >
                              {article.topic}
                            </Badge>
                          </>
                        )}
                        {article.region && (
                          <>
                            <span>·</span>
                            <Badge variant="outline" className="text-xs">
                              {article.region}
                            </Badge>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {article.readAt 
                            ? `Read ${formatDistanceToNow(new Date(article.readAt), { addSuffix: true })}`
                            : article.publishedAt 
                              ? `Published ${formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}`
                              : "Recently read"}
                        </span>
                      </div>
                    </div>
                    
                    <a 
                      href={article.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      <Button variant="ghost" size="icon" data-testid={`button-external-${article.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
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
