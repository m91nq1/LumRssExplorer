import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Save, Mail, Bell, Globe, Tag, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TOPICS, REGIONS, type UserPreferences } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const [favouriteTopics, setFavouriteTopics] = useState<string[]>([]);
  const [preferredRegions, setPreferredRegions] = useState<string[]>([]);
  const [emailDigestEnabled, setEmailDigestEnabled] = useState(true);
  const [loginNotificationEnabled, setLoginNotificationEnabled] = useState(true);

  const { data: prefsData, isLoading } = useQuery<{ preferences: UserPreferences | null }>({
    queryKey: ["/api/preferences"],
  });

  useEffect(() => {
    if (prefsData?.preferences) {
      setFavouriteTopics(prefsData.preferences.favouriteTopics || []);
      setPreferredRegions(prefsData.preferences.preferredRegions || []);
      setEmailDigestEnabled(prefsData.preferences.emailDigestEnabled ?? true);
      setLoginNotificationEnabled(prefsData.preferences.loginNotificationEnabled ?? true);
    }
  }, [prefsData]);

  const saveMutation = useMutation({
    mutationFn: async (data: { favouriteTopics: string[]; preferredRegions: string[]; emailDigestEnabled: boolean; loginNotificationEnabled: boolean }) => {
      const response = await apiRequest("PUT", "/api/users/me/preferences", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      toast({
        title: "Preferences saved",
        description: "Your topic and digest preferences have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTopicToggle = (topic: string) => {
    setFavouriteTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleRegionToggle = (region: string) => {
    setPreferredRegions(prev =>
      prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  const handleSave = () => {
    saveMutation.mutate({
      favouriteTopics,
      preferredRegions,
      emailDigestEnabled,
      loginNotificationEnabled,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-3 sm:px-6 flex h-14 sm:h-16 items-center gap-2 sm:gap-4">
          <Link href="/home">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-base sm:text-lg font-semibold">Settings</h1>
          <div className="flex-1" />
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending}
            size="sm"
            data-testid="button-save-preferences"
          >
            <Save className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{saveMutation.isPending ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </header>

      <main className="container px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Manage your email notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="email-digest">News Digests</Label>
                <p className="text-sm text-muted-foreground">
                  Receive personalized news digests based on your reading history
                </p>
              </div>
              <Switch
                id="email-digest"
                checked={emailDigestEnabled}
                onCheckedChange={setEmailDigestEnabled}
                data-testid="switch-email-digest"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="login-notification">Login Notifications</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone signs into your account
                </p>
              </div>
              <Switch
                id="login-notification"
                checked={loginNotificationEnabled}
                onCheckedChange={setLoginNotificationEnabled}
                data-testid="switch-login-notification"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Favorite Topics
            </CardTitle>
            <CardDescription>
              Select topics you're interested in for personalized digests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {TOPICS.map((topic) => (
                <div key={topic} className="flex items-center space-x-2">
                  <Checkbox
                    id={`topic-${topic}`}
                    checked={favouriteTopics.includes(topic)}
                    onCheckedChange={() => handleTopicToggle(topic)}
                    data-testid={`checkbox-topic-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  />
                  <Label
                    htmlFor={`topic-${topic}`}
                    className="text-sm cursor-pointer"
                  >
                    {topic}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Preferred Regions
            </CardTitle>
            <CardDescription>
              Select regions to focus your news digest on
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {REGIONS.map((region) => (
                <div key={region} className="flex items-center space-x-2">
                  <Checkbox
                    id={`region-${region}`}
                    checked={preferredRegions.includes(region)}
                    onCheckedChange={() => handleRegionToggle(region)}
                    data-testid={`checkbox-region-${region.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  />
                  <Label
                    htmlFor={`region-${region}`}
                    className="text-sm cursor-pointer"
                  >
                    {region}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {emailDigestEnabled && favouriteTopics.length > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-primary">Digest Preview</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You'll receive updates about: {favouriteTopics.join(", ")}
                    {preferredRegions.length > 0 && (
                      <span> from {preferredRegions.join(", ")}</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
