import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FeedSource, NewsProvider } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, Plus, Pencil, Trash2, Rss, Globe, Key, CheckCircle, XCircle, Zap, Newspaper, ChevronDown, Clock, Database, MapPin, Tag } from "lucide-react";
import { Link } from "wouter";

interface FeedsResponse {
  feeds: FeedSource[];
}

interface ProviderWithStatus extends NewsProvider {
  hasApiKey: boolean;
}

interface ProvidersResponse {
  providers: ProviderWithStatus[];
}

interface SourceWithCount {
  id: string;
  name: string;
  articleCount: number;
  isEnabled: boolean;
}

interface SourcesResponse {
  sources: SourceWithCount[];
  lastRefreshTime: string | null;
}

const providerDescriptions: Record<string, string> = {
  newsapi: "Premium news API with access to 80,000+ sources worldwide. Great for breaking news and top headlines.",
  newsdata: "Real-time news data from 70+ countries with sentiment analysis and AI categorization.",
  mediastack: "Scalable REST API delivering worldwide news data from 7,500+ sources in 50 languages.",
};

const providerLogos: Record<string, string> = {
  newsapi: "N",
  newsdata: "ND",
  mediastack: "M",
};

const providerColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  newsapi: { 
    bg: "from-blue-500/20 to-blue-600/10", 
    text: "text-blue-400", 
    border: "border-blue-500/30",
    glow: "shadow-blue-500/20"
  },
  newsdata: { 
    bg: "from-emerald-500/20 to-emerald-600/10", 
    text: "text-emerald-400", 
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/20"
  },
  mediastack: { 
    bg: "from-purple-500/20 to-purple-600/10", 
    text: "text-purple-400", 
    border: "border-purple-500/30",
    glow: "shadow-purple-500/20"
  },
};

export default function FeedManagement() {
  const { toast } = useToast();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<FeedSource | null>(null);
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    url: "",
    country: "",
    category: "world",
  });

  const { data, isLoading } = useQuery<FeedsResponse>({
    queryKey: ["/api/feeds"],
    enabled: isAdmin,
  });

  const { data: providersData, isLoading: providersLoading } = useQuery<ProvidersResponse>({
    queryKey: ["/api/providers"],
    enabled: isAdmin,
  });

  const { data: sourcesData } = useQuery<SourcesResponse>({
    queryKey: ["/api/sources"],
    enabled: isAdmin,
  });

  const toggleProviderMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      apiRequest("PATCH", `/api/providers/${id}`, { isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/providers"] });
      toast({
        title: "Provider updated",
        description: "The news provider status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update provider status.",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: (feed: typeof formData) =>
      apiRequest("POST", "/api/feeds", {
        ...feed,
        sourceType: "rss",
        isEnabled: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feeds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Feed added",
        description: "The RSS feed has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add feed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<FeedSource> & { id: string }) =>
      apiRequest("PATCH", `/api/feeds/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feeds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
      setEditingFeed(null);
      resetForm();
      toast({
        title: "Feed updated",
        description: "The RSS feed has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update feed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/feeds/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feeds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
      toast({
        title: "Feed deleted",
        description: "The RSS feed has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete feed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      apiRequest("PATCH", `/api/feeds/${id}`, { isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feeds"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to toggle feed status.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      id: "",
      name: "",
      url: "",
      country: "",
      category: "world",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFeed) {
      updateMutation.mutate({
        id: editingFeed.id,
        name: formData.name,
        url: formData.url,
        country: formData.country || undefined,
        category: formData.category,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (feed: FeedSource) => {
    setEditingFeed(feed);
    setFormData({
      id: feed.id,
      name: feed.name,
      url: feed.url,
      country: feed.country || "",
      category: feed.category,
    });
  };

  const getProviderArticleCount = (providerId: string) => {
    if (!sourcesData?.sources) return 0;
    const sourceId = `external-${providerId}`;
    const source = sourcesData.sources.find(s => s.id === sourceId);
    return source?.articleCount || 0;
  };

  const formatLastRefresh = (time: string | null) => {
    if (!time) return "Never";
    const date = new Date(time);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const toggleProviderExpanded = (id: string) => {
    setExpandedProviders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <header className="h-16 border-b border-border bg-background sticky top-0 z-10">
          <div className="h-full max-w-6xl mx-auto px-6 flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold">Access Denied</h1>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access feed management. This area is restricted to administrators only.
          </p>
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </main>
      </div>
    );
  }

  const feeds = data?.feeds || [];
  const providers = providersData?.providers || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="h-16 border-b border-border bg-background sticky top-0 z-10">
        <div className="h-full max-w-5xl mx-auto px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold" data-testid="text-page-title">
              Feed Management
            </h1>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setEditingFeed(null);
                }}
                data-testid="button-add-feed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Feed
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add New RSS Feed</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new RSS feed source.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="id">Feed ID</Label>
                    <Input
                      id="id"
                      placeholder="e.g., bbc-tech"
                      value={formData.id}
                      onChange={(e) =>
                        setFormData({ ...formData, id: e.target.value })
                      }
                      required
                      data-testid="input-feed-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Feed Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., BBC Technology"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      data-testid="input-feed-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">RSS URL</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com/rss.xml"
                      value={formData.url}
                      onChange={(e) =>
                        setFormData({ ...formData, url: e.target.value })
                      }
                      required
                      data-testid="input-feed-url"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country (optional)</Label>
                    <Input
                      id="country"
                      placeholder="e.g., UK"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      data-testid="input-feed-country"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      placeholder="e.g., world, tech"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      required
                      data-testid="input-feed-category"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit-feed"
                  >
                    Add Feed
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* News API Providers Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center border border-primary/20">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold" data-testid="text-providers-heading">
                External News APIs
              </h2>
              <p className="text-sm text-muted-foreground">
                Connect to premium news sources for comprehensive coverage
              </p>
            </div>
          </div>

          {providersLoading ? (
            <div className="grid gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-14 w-14 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <Card className="p-8 text-center">
              <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No providers configured</h3>
              <p className="text-sm text-muted-foreground">
                External news providers will appear here once configured.
              </p>
            </Card>
          ) : (
            <div className="space-y-4" data-testid="providers-grid">
              {providers.map((provider) => {
                const colors = providerColors[provider.id] || providerColors.newsapi;
                const articleCount = getProviderArticleCount(provider.id);
                const isExpanded = expandedProviders[provider.id];
                
                return (
                  <Collapsible key={provider.id} open={isExpanded} onOpenChange={() => toggleProviderExpanded(provider.id)}>
                    <Card
                      className={`overflow-hidden transition-all duration-300 ${
                        provider.isEnabled && provider.hasApiKey 
                          ? `border-2 ${colors.border} shadow-lg ${colors.glow}` 
                          : 'border-border'
                      }`}
                      data-testid={`provider-card-${provider.id}`}
                    >
                      <div className={`p-6 bg-gradient-to-r ${colors.bg}`}>
                        <div className="flex items-start gap-4">
                          {/* Provider Logo */}
                          <div className={`w-14 h-14 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center border ${colors.border}`}>
                            <span className={`text-xl font-bold ${colors.text}`}>
                              {providerLogos[provider.id] || provider.name[0]}
                            </span>
                          </div>
                          
                          {/* Provider Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-lg" data-testid={`provider-name-${provider.id}`}>
                                {provider.name}
                              </h3>
                              {provider.isEnabled && provider.hasApiKey && (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                                  Active
                                </Badge>
                              )}
                              {!provider.hasApiKey && (
                                <Badge variant="outline" className="text-amber-400 border-amber-500/30">
                                  <Key className="w-3 h-3 mr-1" />
                                  API Key Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {providerDescriptions[provider.id] || `News from ${provider.name}`}
                            </p>
                            
                            {/* Stats Row */}
                            <div className="flex items-center gap-4 mt-3 text-sm">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Newspaper className="w-4 h-4" />
                                <span className="font-medium">{articleCount.toLocaleString()}</span>
                                <span>articles</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground" title="Last system refresh">
                                <Clock className="w-4 h-4" />
                                <span>Synced {formatLastRefresh(sourcesData?.lastRefreshTime || null)}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Database className="w-4 h-4" />
                                <span>{provider.rateLimitPerDay?.toLocaleString()}/day</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Toggle Switch */}
                          <div className="flex flex-col items-end gap-2">
                            <Switch
                              checked={provider.isEnabled}
                              onCheckedChange={(checked) =>
                                toggleProviderMutation.mutate({
                                  id: provider.id,
                                  isEnabled: checked,
                                })
                              }
                              disabled={!provider.hasApiKey}
                              data-testid={`switch-provider-${provider.id}`}
                            />
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                                <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                Details
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      <CollapsibleContent>
                        <div className="px-6 pb-6 pt-4 border-t border-border/50 bg-muted/30">
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Categories */}
                            <div>
                              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                                <Tag className="w-4 h-4" />
                                Supported Categories
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {provider.supportedCategories?.map((cat) => (
                                  <Badge key={cat} variant="secondary" className="text-xs capitalize">
                                    {cat}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            {/* Countries */}
                            <div>
                              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                Supported Countries
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {provider.supportedCountries?.map((country) => (
                                  <Badge key={country} variant="outline" className="text-xs uppercase">
                                    {country}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* API Key Info */}
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Environment Variable:</span>
                                <code className="px-2 py-0.5 bg-muted rounded text-xs font-mono">
                                  {provider.apiKeyEnvVar}
                                </code>
                              </div>
                              {provider.hasApiKey ? (
                                <div className="flex items-center gap-1.5 text-sm text-green-400">
                                  <CheckCircle className="w-4 h-4" />
                                  Configured
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-sm text-amber-400">
                                  <XCircle className="w-4 h-4" />
                                  Not configured
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </section>

        {/* RSS Feeds Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-xl flex items-center justify-center border border-orange-500/20">
              <Rss className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold" data-testid="text-feeds-heading">
                RSS Feeds
              </h2>
              <p className="text-sm text-muted-foreground">
                {feeds.length} feed{feeds.length !== 1 ? 's' : ''} configured
              </p>
            </div>
          </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-6 border border-card-border rounded-md">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : feeds.length === 0 ? (
          <div className="text-center py-12">
            <Rss className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No feeds configured</h3>
            <p className="text-muted-foreground mb-4">
              Add your first RSS feed to start aggregating news.
            </p>
          </div>
        ) : (
          <div className="space-y-3" data-testid="feeds-list">
            {feeds.map((feed) => (
              <Card
                key={feed.id}
                className="p-5"
                data-testid={`feed-card-${feed.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-medium truncate">{feed.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {feed.category}
                      </Badge>
                      {feed.country && (
                        <Badge variant="outline" className="text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          {feed.country}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {feed.url}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={feed.isEnabled}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          id: feed.id,
                          isEnabled: checked,
                        })
                      }
                      data-testid={`switch-feed-${feed.id}`}
                    />

                    <Dialog
                      open={editingFeed?.id === feed.id}
                      onOpenChange={(open) => {
                        if (!open) {
                          setEditingFeed(null);
                          resetForm();
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(feed)}
                          data-testid={`button-edit-${feed.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form onSubmit={handleSubmit}>
                          <DialogHeader>
                            <DialogTitle>Edit RSS Feed</DialogTitle>
                            <DialogDescription>
                              Update the details for this RSS feed.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Feed Name</Label>
                              <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    name: e.target.value,
                                  })
                                }
                                required
                                data-testid="input-edit-name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-url">RSS URL</Label>
                              <Input
                                id="edit-url"
                                type="url"
                                value={formData.url}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    url: e.target.value,
                                  })
                                }
                                required
                                data-testid="input-edit-url"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-country">
                                Country (optional)
                              </Label>
                              <Input
                                id="edit-country"
                                value={formData.country}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    country: e.target.value,
                                  })
                                }
                                data-testid="input-edit-country"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-category">Category</Label>
                              <Input
                                id="edit-category"
                                value={formData.category}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    category: e.target.value,
                                  })
                                }
                                required
                                data-testid="input-edit-category"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditingFeed(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={updateMutation.isPending}
                              data-testid="button-update-feed"
                            >
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(feed.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${feed.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        </section>
      </main>
    </div>
  );
}
