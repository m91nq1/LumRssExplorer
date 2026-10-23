import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Status {
  configured: boolean; missing: string[]; authHookConfigured: boolean; webhookConfigured: boolean;
  counts: {kind: string; status: string; count: number}[];
  recent: {kind: string; status: string; error_code: string | null; attempts: number; updated_at: string}[];
}
export default function EmailDeliveryStatus() {
  const {data, error, isFetching, refetch} = useQuery<Status>({
    queryKey:["/api/admin/email-status"], staleTime:30_000,
  });
  return <Card><CardHeader>
    <CardTitle>Resend email delivery</CardTitle>
    <CardDescription>Administrator-only configuration and delivery records. Credentials and reset links are never shown.</CardDescription>
  </CardHeader><CardContent className="space-y-4">
    {error ? <p role="alert">Email status is unavailable.</p> : data ? <>
      <p>{data.configured ? "Sending environment configured. The sender domain must also be verified in Resend." : `Setup needed: ${data.missing.join(", ")}`}</p>
      <p className="text-sm text-muted-foreground">Password-reset hook secret: {data.authHookConfigured ? "present" : "not configured"} · Delivery webhook secret: {data.webhookConfigured ? "present" : "not configured"}. Hooks also need to be enabled in the provider dashboards.</p>
      <div className="space-y-1 text-sm">
        {data.counts.map(row => <p key={`${row.kind}-${row.status}`}>{row.kind} · {row.status}: {row.count} (last 30 days)</p>)}
        {!data.counts.length && <p>No delivery records yet.</p>}
      </div>
      <ul className="space-y-2 text-sm">
        {data.recent.map((row, i) => <li key={i}>{row.kind} — {row.status}{row.error_code ? ` (${row.error_code})` : ""} · {row.attempts} attempts · {new Date(row.updated_at).toLocaleString()}</li>)}
      </ul>
    </> : <p>Loading email status…</p>}
    <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>Refresh delivery status</Button>
  </CardContent></Card>;
}
