import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FeedSource, NewsProvider } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { ArrowLeft, Plus, Pencil, Trash2, Rss, Globe, Key, CheckCircle, XCircle, Zap } from "lucide-react";
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

export default function FeedManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<FeedSource | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    url: "",
    country: "",
    category: "world",
  });

  const { data, isLoading } = useQuery<FeedsResponse>({
    queryKey: ["/api/feeds"],
  });

  const { data: providersData, isLoading: providersLoading } = useQuery<ProvidersResponse>({
    queryKey: ["/api/providers"],
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

  const feeds = data?.feeds || [];
  const providers = providersData?.providers || [];

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

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* News API Providers Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold" data-testid="text-providers-heading">
              News API Providers
            </h2>
          </div>

          {providersLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </Card>
              ))}
            </div>
          ) : providers.length === 0 ? (
            <Card className="p-6 text-center">
              <Key className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No external news providers configured.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-3" data-testid="providers-grid">
              {providers.map((provider) => (
                <Card
                  key={provider.id}
                  className="p-4"
                  data-testid={`provider-card-${provider.id}`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium" data-testid={`provider-name-${provider.id}`}>
                        {provider.name}
                      </h3>
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
                    </div>

                    <div className="flex items-center gap-2">
                      {provider.hasApiKey ? (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                          API Key Set
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          <XCircle className="w-3 h-3 mr-1 text-red-500" />
                          No API Key
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {provider.apiKeyEnvVar}
                    </p>

                    {provider.rateLimitPerDay && (
                      <p className="text-xs text-muted-foreground">
                        Rate limit: {provider.rateLimitPerDay.toLocaleString()}/day
                      </p>
                    )}

                    {provider.supportedCategories && provider.supportedCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {provider.supportedCategories.slice(0, 3).map((cat) => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                        {provider.supportedCategories.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{provider.supportedCategories.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* RSS Feeds Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Rss className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold" data-testid="text-feeds-heading">
              RSS Feeds
            </h2>
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
          <div className="space-y-4" data-testid="feeds-list">
            {feeds.map((feed) => (
              <Card
                key={feed.id}
                className="p-6"
                data-testid={`feed-card-${feed.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
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
                      <Trash2 className="w-4 h-4 text-destructive" />
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
