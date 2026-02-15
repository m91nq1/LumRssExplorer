import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Save, User, Settings, Mail, Globe, Tag, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TOPICS, REGIONS, type UserPreferences, type User as UserType } from "@shared/schema";

export default function Profile() {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [favouriteTopics, setFavouriteTopics] = useState<string[]>([]);
  const [preferredRegions, setPreferredRegions] = useState<string[]>([]);
  const [emailDigestEnabled, setEmailDigestEnabled] = useState(false);

  const { data: userData, isLoading: userLoading } = useQuery<{ user: UserType }>({
    queryKey: ["/api/auth/user"],
  });

  const { data: prefsData, isLoading: prefsLoading } = useQuery<{ preferences: UserPreferences | null }>({
    queryKey: ["/api/preferences"],
  });

  useEffect(() => {
    if (userData?.user) {
      setDisplayName(userData.user.firstName || userData.user.username || "");
      setEmail(userData.user.email || "");
    }
  }, [userData]);

  useEffect(() => {
    if (prefsData?.preferences) {
      setFavouriteTopics(prefsData.preferences.favouriteTopics || []);
      setPreferredRegions(prefsData.preferences.preferredRegions || []);
      setEmailDigestEnabled(prefsData.preferences.emailDigestEnabled || false);
    }
  }, [prefsData]);

  const savePrefsMutation = useMutation({
    mutationFn: async (data: { favouriteTopics: string[]; preferredRegions: string[]; emailDigestEnabled: boolean }) => {
      const response = await apiRequest("PUT", "/api/users/me/preferences", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      toast({
        title: "Preferences saved",
        description: "Your profile and preferences have been updated.",
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
    savePrefsMutation.mutate({
      favouriteTopics,
      preferredRegions,
      emailDigestEnabled,
    });
  };

  const isLoading = userLoading || prefsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  const user = userData?.user;
  const initials = displayName ? displayName.slice(0, 2).toUpperCase() : "U";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-3 sm:px-6 flex h-14 sm:h-16 items-center gap-2 sm:gap-4">
          <Link href="/home">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base sm:text-lg font-semibold">Your Profile</h1>
          </div>
          <div className="flex-1" />
          <Button 
            onClick={handleSave} 
            disabled={savePrefsMutation.isPending}
            size="sm"
            data-testid="button-save-profile"
          >
            <Save className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{savePrefsMutation.isPending ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </header>

      <main className="container px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your basic account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={displayName} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg sm:text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    data-testid="input-display-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={email}
                    disabled
                    className="bg-muted"
                    data-testid="input-email"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Digests
            </CardTitle>
            <CardDescription>
              Receive personalized news digests based on your topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="email-digest">Enable Email Digests</Label>
                <p className="text-sm text-muted-foreground">
                  Get updates about stories matching your favorite topics
                </p>
              </div>
              <Switch
                id="email-digest"
                checked={emailDigestEnabled}
                onCheckedChange={setEmailDigestEnabled}
                data-testid="switch-email-digest"
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
              Select topics you're interested in for personalized content
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
              Select regions to focus your news on
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

        <div className="flex justify-center pt-4">
          <Link href="/settings">
            <Button variant="outline" className="gap-2" data-testid="link-settings">
              <Settings className="h-4 w-4" />
              Advanced Settings
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
