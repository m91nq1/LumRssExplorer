import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, Check, KeyRound, Loader2, ShieldCheck, Trash2, Wifi } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { queryClient } from "@/lib/queryClient";

type AiSettings = {
  model: string;
  enabled: boolean;
  keyConfigured: boolean;
  keySource: "encrypted" | "environment" | "none";
  verifiedAt: string | null;
  lastError: string | null;
  usage: { inputTokens: number; outputTokens: number; requests: number };
  models: string[];
};

type AiSecretsSettingsProps = {
  onAdminAccessChange: (allowed: boolean) => void;
  active: boolean;
};

const endpoint = "/api/admin/ai-settings";
const modelLabels: Record<string, string> = {
  "gpt-5-nano": "GPT-5 nano (default)",
  "gpt-5-mini": "GPT-5 mini",
  "gpt-5": "GPT-5",
};

export default function AiSecretsSettings({ onAdminAccessChange, active }: AiSecretsSettingsProps) {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [appliedSettings, setAppliedSettings] = useState<AiSettings | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);

  const authorizedFetch = useCallback(async (method: string, body?: Record<string, unknown>) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Your session could not be verified. Sign in again and retry.");
    return fetch(method === "POST" ? `${endpoint}/test` : endpoint, {
      method,
      credentials: "same-origin",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }, []);

  const readResponse = async (response: Response): Promise<AiSettings> => {
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        onAdminAccessChange(false);
        throw new Error("Admin access is required.");
      }
      let safeError = "The AI settings request could not be completed.";
      try {
        const payload = await response.json() as { error?: unknown };
        if (typeof payload.error === "string" && payload.error.trim()) safeError = payload.error.slice(0, 240);
      } catch {
        // Do not expose raw response text or diagnostics.
      }
      throw new Error(safeError);
    }
    return await response.json() as AiSettings;
  };

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await authorizedFetch("GET");
      const data = await readResponse(response);
      setSettings(data);
      setAppliedSettings(data);
      onAdminAccessChange(true);
    } catch (requestError) {
      if (!(requestError instanceof Error && requestError.message === "Admin access is required.")) {
        onAdminAccessChange(false);
        setError(requestError instanceof Error ? requestError.message : "Unable to load AI settings.");
      }
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, onAdminAccessChange]);

  const applySavedSettings = (data: AiSettings) => {
    setSettings(data);
    setAppliedSettings(data);
    // The server checks model provenance before returning a cached summary.
    // Refresh local article/status caches too, so old-model summaries aren't reused by this browser.
    void queryClient.invalidateQueries({ queryKey: ["/api/ai-summary/status"] });
    void queryClient.invalidateQueries({
      predicate: query => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("/api/articles/"),
    });
  };

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settings) return;
    const submittedKey = apiKey;
    setApiKey("");
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const isLocalDevelopment = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
      if (submittedKey && window.location.protocol !== "https:" && !isLocalDevelopment) {
        throw new Error("API keys can only be submitted over a secure HTTPS connection.");
      }
      const response = await authorizedFetch("PUT", {
        ...(submittedKey ? { apiKey: submittedKey } : {}),
        model: settings.model,
        enabled: settings.enabled,
      });
      const updated = await readResponse(response);
      applySavedSettings(updated);
      setMessage(updated.enabled
        ? `Saved and verified. Article summaries now use ${updated.model}.`
        : `Model saved as ${updated.model}. AI summaries are switched off.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save AI settings.");
    } finally {
      setApiKey("");
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setError("");
    setMessage("");
    try {
      const response = await authorizedFetch("POST");
      const data = await readResponse(response) as AiSettings & { message?: string };
      applySavedSettings(data);
      setMessage(data.message || "Connection test completed.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Connection test failed.");
    } finally {
      setTesting(false);
    }
  };

  const removeKey = async () => {
    if (!window.confirm("Remove the saved AI key and disable AI summaries?")) return;
    setRemoving(true);
    setError("");
    setMessage("");
    try {
      const response = await authorizedFetch("DELETE");
      applySavedSettings(await readResponse(response));
      setApiKey("");
      setMessage("Saved key removed. AI summaries are disabled.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to remove the saved key.");
    } finally {
      setRemoving(false);
    }
  };

  if (!active) return null;

  if (loading) {
    return (
      <Card aria-busy="true">
        <CardHeader><div className="h-6 w-48 animate-pulse rounded bg-muted" /><div className="h-4 w-72 animate-pulse rounded bg-muted" /></CardHeader>
        <CardContent className="space-y-3"><div className="h-10 animate-pulse rounded bg-muted" /><div className="h-10 animate-pulse rounded bg-muted" /></CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardHeader><CardTitle>AI summaries</CardTitle><CardDescription>Manage the model and credential used for article summaries.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-destructive" role="alert">{error || "AI settings are unavailable."}</p>
          <Button variant="outline" onClick={() => void loadSettings()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  const sourceLabel = settings.keySource === "encrypted"
    ? "Saved securely for this workspace"
    : settings.keySource === "environment"
      ? "Managed by the deployment environment"
      : "No key configured";
  const applied = appliedSettings || settings;
  const busy = saving || testing || removing;
  const hasUnsavedChanges = settings.model !== applied.model ||
    settings.enabled !== applied.enabled || Boolean(apiKey.trim());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> OpenAI model for summaries</CardTitle>
          <CardDescription>Administrator settings for AI-powered article summaries. The saved model applies across LUM News.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-6">
            <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Active summary model</p>
                <p className="text-sm" data-testid="text-active-summary-model">{modelLabels[applied.model] || applied.model}</p>
                <p className="mt-2 text-xs font-medium">Secrets: OpenAI API key</p>
                <p className="text-sm text-muted-foreground">{sourceLabel}</p>
                {settings.keySource === "environment" && (
                  <p className="mt-1 max-w-xl text-xs text-muted-foreground">Removing the environment-managed key here disables AI summaries at the application level; it does not delete workspace or deployment secrets.</p>
                )}
              </div>
              <span className={`mt-2 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:mt-0 ${applied.enabled ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                {applied.enabled ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                {applied.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ai-model">OpenAI model for article summaries</Label>
                <select
                  id="ai-model"
                  data-testid="select-ai-summary-model"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={settings.model}
                  disabled={busy}
                  onChange={(event) => setSettings({ ...settings, model: event.target.value })}
                >
                  {Array.from(new Set([settings.model, ...settings.models])).map((model) => <option key={model} value={model}>{modelLabels[model] || model}</option>)}
                </select>
                <p className="text-xs text-muted-foreground">Choose a model, then save to verify access and apply it. Models have different API costs; they never switch automatically.</p>
                {settings.model !== applied.model && (
                  <p className="text-xs text-amber-700 dark:text-amber-300" role="status">Unsaved model change. Summaries still use {applied.model} until you save.</p>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                <div>
                  <Label htmlFor="ai-enabled">AI summaries</Label>
                  <p className="text-xs text-muted-foreground">Turning on verifies the live connection.</p>
                </div>
                <Switch id="ai-enabled" disabled={busy} checked={settings.enabled} onCheckedChange={(enabled) => setSettings({ ...settings, enabled })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-api-key">{settings.keyConfigured ? "Replace API key" : "API key"}</Label>
              <Input
                id="ai-api-key"
                type="password"
                autoComplete="new-password"
                placeholder={settings.keyConfigured ? "Leave blank to keep the current key" : "Paste a new API key"}
                value={apiKey}
                disabled={busy}
                onChange={(event) => setApiKey(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">The key is held only in this form while you type and is cleared when submitted.</p>
            </div>

            <p className="text-xs text-muted-foreground">New summaries use the saved model. If a cached summary was made with a different model, it is regenerated when requested. Summary length remains two paragraphs, 120–180 words total.</p>
            {applied.verifiedAt && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-600" />{applied.model} last verified {new Date(applied.verifiedAt).toLocaleString()}</p>
            )}
            {settings.lastError && <p className="text-sm text-destructive" role="status">{settings.lastError}</p>}
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            {message && <p className="text-sm text-emerald-700 dark:text-emerald-300" role="status">{message}</p>}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" data-testid="button-save-ai-model" disabled={busy}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Saving…" : "Save model and settings"}
              </Button>
              <Button type="button" variant="outline" onClick={() => void testConnection()} disabled={busy || !settings.keyConfigured || hasUnsavedChanges}>
                {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wifi className="mr-2 h-4 w-4" />}
                Test connection
              </Button>
              {hasUnsavedChanges && <p className="w-full text-xs text-muted-foreground">Save your changes before testing the saved configuration.</p>}
              {settings.keyConfigured && (
                <Button type="button" variant="outline" className="text-destructive hover:text-destructive" onClick={() => void removeKey()} disabled={removing || saving || testing}>
                  {removing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Remove key
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Usage</CardTitle><CardDescription>Cumulative OpenAI token totals for this app, including connection tests and corrective retries. These are not your account-wide billing totals.</CardDescription></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Requests</p><p className="mt-1 text-2xl font-semibold tabular-nums">{settings.usage.requests.toLocaleString()}</p></div>
          <div className="rounded-lg bg-muted/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Input tokens</p><p className="mt-1 text-2xl font-semibold tabular-nums">{settings.usage.inputTokens.toLocaleString()}</p></div>
          <div className="rounded-lg bg-muted/40 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Output tokens</p><p className="mt-1 text-2xl font-semibold tabular-nums">{settings.usage.outputTokens.toLocaleString()}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
