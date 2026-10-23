import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Preferences {
  frequency: "daily" | "weekly";
  countries: string[];
  breakingEnabled: boolean;
  personalizedEnabled: boolean;
}
export default function EmailNotificationSettings() {
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery<{preferences: Preferences; countries: string[]}>({
    queryKey: ["/api/email/preferences"],
  });
  const [prefs, setPrefs] = useState<Preferences>({
    frequency: "daily", countries: [], breakingEnabled: false, personalizedEnabled: false,
  });
  useEffect(() => { if (data) setPrefs(data.preferences); }, [data]);
  const save = useMutation({
    mutationFn: async () => (await apiRequest("PUT", "/api/email/preferences", prefs)).json(),
    onSuccess: () => toast({ title: "Email delivery preferences saved" }),
    onError: () => toast({ title: "Could not save email preferences", variant: "destructive" }),
  });
  return <Card>
    <CardHeader>
      <CardTitle>News email delivery</CardTitle>
      <CardDescription>Uses your selected topics and regions below. Turn off News Digests above to stop all non-essential news emails. Login and password-reset emails are separate.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-5">
      {error ? <p role="alert">Sign in again to manage news email delivery.</p> : <>
        <div className="space-y-2">
          <Label htmlFor="digest-frequency">Digest frequency</Label>
          <select id="digest-frequency" className="block w-full rounded-md border bg-background p-2" value={prefs.frequency}
            disabled={isLoading || save.isPending}
            onChange={event => setPrefs({...prefs, frequency: event.target.value as Preferences["frequency"]})}>
            <option value="daily">Daily</option><option value="weekly">Weekly (Monday)</option>
          </select>
          <p className="text-xs text-muted-foreground">Scheduled at 09:00 UTC. Empty digests are not sent.</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="breaking-emails">Breaking news alerts for your topics</Label>
          <Switch id="breaking-emails" checked={prefs.breakingEnabled} disabled={isLoading || save.isPending}
            onCheckedChange={value => setPrefs({...prefs, breakingEnabled: value})}/>
        </div>
        <p className="text-xs text-muted-foreground">Only headlines explicitly marked “breaking” qualify; checked every 10 minutes.</p>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="personalized-emails">Weekly recommendations from my reading history</Label>
          <Switch id="personalized-emails" checked={prefs.personalizedEnabled} disabled={isLoading || save.isPending}
            onCheckedChange={value => setPrefs({...prefs, personalizedEnabled: value})}/>
        </div>
        <div className="space-y-2">
          <Label>Publisher countries</Label>
          <p className="text-xs text-muted-foreground">Optional. No selection includes all publisher countries. These describe the publisher, not necessarily where the story happened.</p>
          <div className="grid max-h-52 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
            {(data?.countries || []).map(country => <label key={country} className="flex items-center gap-2 text-sm">
              <Checkbox checked={prefs.countries.includes(country)} disabled={save.isPending}
                onCheckedChange={checked => setPrefs({...prefs, countries: checked
                  ? [...prefs.countries, country] : prefs.countries.filter(c => c !== country)})}/>{country}
            </label>)}
          </div>
        </div>
        <Button disabled={isLoading || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? "Saving…" : "Save email delivery preferences"}
        </Button>
        <p className="text-xs text-muted-foreground">Every news email includes an unsubscribe link. Security emails are not affected by news unsubscribes.</p>
      </>}
    </CardContent>
  </Card>;
}
