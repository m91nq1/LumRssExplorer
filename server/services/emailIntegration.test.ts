import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import express from "express";
import { Webhook } from "svix";
import { PgDialect } from "drizzle-orm/pg-core";
import { db, pool } from "../db";
import { storage } from "../storage";
import { sendWelcomeEmail, sendLoginNotificationEmail, sendTopicDigestEmail } from "./emailService";
import { sendEmail, emailIdentity, plainTextEmail, safeEmailError } from "./emailDelivery";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "./emailUnsubscribe";
import { registerEmailRoutes } from "./emailRoutes";
import { digestPeriod } from "./digestService";
import { sendAuthEmailForLogin } from "./authEmailLifecycle";

// Every provider request and database operation is intercepted. Never real mail.
test("Resend integration: templates, duplicate sends, retries, preferences, reset hook and unsubscribe", async () => {
  const env = { ...process.env };
  const oldFetch = globalThis.fetch;
  const oldExecute = db.execute;
  const oldTransaction = db.transaction;
  const oldUser = storage.getUserBySupabaseId;
  const oldSources = storage.getFeedSources;
  const oldPrefs = storage.getUserPreferences;
  const records = new Map<string, any>();
  const events = new Set<string>();
  const suppressed = new Set<string>();
  let notificationPrefs = {frequency: "daily", countries: ["South Africa"], breakingEnabled: true, personalizedEnabled: true};
  let unsubscribed = false;
  const deliveries: any[] = [];
  let rateLimitNext = false;
  let rejectNext = false;
  const dialect = new PgDialect();
  const execute = async (query: any) => {
    const compiled = dialect.sqlToQuery(query);
    const text = compiled.sql.replace(/\s+/g, " ").trim();
    const p = compiled.params;
    if (/SELECT status, updated_at/.test(text)) return {rows: records.has(p[0]) ? [records.get(p[0])] : []};
    if (text.startsWith("SELECT 1 FROM email_suppressions")) return {rows: suppressed.has(p[0]) ? [{}] : []};
    if (text.includes(" AS daily,")) return {rows:[{daily: records.size, monthly: records.size}]};
    if (text.startsWith("INSERT INTO email_deliveries")) {
      records.set(p[0], {id:p[0], recipient:p[1], kind:p[2], status:"pending",
        created_at:new Date().toISOString(), updated_at:new Date().toISOString()});
    } else if (text.startsWith("UPDATE email_deliveries SET provider_id")) {
      Object.assign(records.get(p[1]), {provider_id:p[0], status:"sent"});
    } else if (text.startsWith("UPDATE email_deliveries SET status = $")) {
      if (text.includes("WHERE provider_id")) {
        for (const record of Array.from(records.values())) if(record.provider_id === p[1]) record.status = p[0];
      } else Object.assign(records.get(p[2]), {status:p[0], error_code:p[1]});
    } else if (text.startsWith("SELECT frequency")) return {rows:[notificationPrefs]};
    else if (text.startsWith("INSERT INTO email_notification_preferences")) {
      // A one-country fixture makes the positional array mapping explicit.
      notificationPrefs = {frequency:p[1],countries:[p[2]],breakingEnabled:p[3],personalizedEnabled:p[4]};
    } else if (text.startsWith("INSERT INTO email_delivery_events")) {
      if (events.has(p[0])) return {rows:[]};
      events.add(p[0]); return {rows:[{id:p[0]}]};
    } else if (text.startsWith("INSERT INTO email_suppressions") && text.includes("VALUES")) suppressed.add(p[0]);
    else if (text.startsWith("DELETE FROM email_suppressions")) suppressed.delete(p[0]);
    else if (text.startsWith("UPDATE user_preferences")) unsubscribed = true;
    return {rows:[]};
  };
  (db as any).execute = execute;
  (db as any).transaction = async (fn: any) => fn({execute});
  storage.getUserBySupabaseId = async () => ({id:7,email:"member@example.test",username:"member"}) as any;
  storage.getFeedSources = async () => [{country:"South Africa"}] as any;
  storage.getUserPreferences = async () => ({emailDigestEnabled:true}) as any;
  Object.assign(process.env, {
    RESEND_API_KEY:"re_synthetic_not_a_real_key", RESEND_FROM_EMAIL:"LUM News <news@example.test>",
    APP_URL:"https://lum.example.test", SUPPORT_EMAIL:"support@example.test",
    SESSION_SECRET:"synthetic-unsubscribe-signing-secret-long-enough",
    SUPABASE_URL:"https://supabase.example.test", SUPABASE_ANON_KEY:"synthetic-anon-key",
    RESEND_WEBHOOK_SECRET:`whsec_${Buffer.from("test-webhook-secret-32-characters!").toString("base64")}`,
  });
  process.env.SUPABASE_SEND_EMAIL_HOOK_SECRET = `v1,${process.env.RESEND_WEBHOOK_SECRET}`;
  globalThis.fetch = (async (input: any, init: any) => {
    const url = String(input);
    if (url.startsWith("https://api.resend.com/")) {
      const body = JSON.parse(init.body);
      deliveries.push({body, headers:init.headers});
      if (rateLimitNext) { rateLimitNext = false; return new Response(JSON.stringify({name:"rate_limit_exceeded",message:"Slow down"}), {status:429}); }
      if (rejectNext) { rejectNext = false; return new Response(JSON.stringify({name:"validation_error",message:"Unverified sender"}), {status:403}); }
      return new Response(JSON.stringify({id:`provider-${deliveries.length}`}), {status:200});
    }
    if (url.startsWith("https://supabase.example.test/auth/v1/user")) {
      if (new Headers(init?.headers).get("authorization") !== "Bearer valid-test-token") {
        return new Response(JSON.stringify({msg:"Invalid token"}), {status:401});
      }
      return new Response(JSON.stringify({id:"supabase-member", email:"member@example.test",role:"authenticated"}), {status:200});
    }
    if (!/^http:\/\/127\.0\.0\.1:/.test(url)) throw new Error("Unexpected external request blocked by test.");
    return oldFetch(input, init);
  }) as typeof fetch;
  const app = express();
  app.use(express.json({verify(req, _res, buf) {req.rawBody = buf;}}));
  app.use(express.urlencoded({extended:false}));
  registerEmailRoutes(app);
  const server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${(server.address() as any).port}`;
  const api = (path: string, init?: RequestInit) => fetch(`${origin}${path}`, init);
  try {
    assert.equal(await sendWelcomeEmail("member@example.test", "<script>bad</script>"), "sent");
    assert.equal(await sendWelcomeEmail("member@example.test", "Member"), "duplicate");
    assert.equal(deliveries.length, 1);
    assert.ok(deliveries[0].body.html.includes("&lt;script&gt;"));
    assert.ok(deliveries[0].body.text.includes("Open LUM News"));
    assert.ok(deliveries[0].body.html.includes('width=device-width'));
    assert.ok(!deliveries[0].body.html.includes("Confirm your email"));
    assert.equal(await sendLoginNotificationEmail("member@example.test", "Member", "session-1"), "sent");
    assert.equal(await sendLoginNotificationEmail("member@example.test", "Member", "session-1"), "duplicate");
    assert.equal(await sendLoginNotificationEmail("member@example.test", "Member", "session-2"), "sent");
    const localUser = {id:7,email:"registered@example.test",username:"Registered"} as any;
    assert.equal(await sendAuthEmailForLogin(localUser, true, "registration"), "sent");
    assert.equal(deliveries[deliveries.length-1].body.subject.startsWith("Welcome"), true);
    const beforeOptOut = deliveries.length;
    storage.getUserPreferences = async () => ({loginNotificationEnabled:false}) as any;
    assert.equal(await sendAuthEmailForLogin(localUser, false, "disabled-session"), undefined);
    assert.equal(deliveries.length, beforeOptOut);
    storage.getUserPreferences = async () => null as any;
    assert.equal(await sendAuthEmailForLogin(localUser, false, "default-enabled-session"), "sent");
    const stories = [{title:"<Painting>",url:"javascript:alert(1)",source:"Museum",summary:"A new collection."}];
    assert.equal(await sendTopicDigestEmail("member@example.test", "Member", ["Art"], stories), "sent");
    assert.equal(await sendTopicDigestEmail("member@example.test", "Member", ["Art"], stories), "duplicate");
    const digest = deliveries[deliveries.length - 1].body;
    assert.ok(digest.headers["List-Unsubscribe"]);
    assert.ok(digest.text.includes("Unsubscribe"));
    assert.ok(!digest.html.includes("javascript:"));
    assert.ok(digest.html.includes("&lt;Painting&gt;"));

    const token = createUnsubscribeToken("member@example.test", 1000);
    assert.equal(verifyUnsubscribeToken(token, 1001), "member@example.test");
    assert.equal(verifyUnsubscribeToken(token + "tampered", 1001), null);
    assert.equal(verifyUnsubscribeToken(token, Number.MAX_SAFE_INTEGER), null);
    const activeToken = createUnsubscribeToken("member@example.test");
    assert.equal((await api(`/api/email/unsubscribe?token=${activeToken}`)).status, 200);
    assert.equal(unsubscribed, false, "GET scanners must not unsubscribe users");
    assert.equal((await api(`/api/email/unsubscribe?token=${activeToken}`, {method:"POST"})).status, 200);
    assert.equal(unsubscribed, true);
    assert.equal(await sendTopicDigestEmail("member@example.test", "Member", ["Art"], stories, {period:"tomorrow"}), "suppressed");
    assert.equal(await sendLoginNotificationEmail("member@example.test", "Member", "session-3"), "sent");

    assert.equal((await api("/api/email/preferences")).status, 401);
    assert.equal((await api("/api/email/preferences", {headers:{"x-supabase-id":"supabase-member"}})).status, 401);
    const auth = {Authorization:"Bearer valid-test-token", "Content-Type":"application/json"};
    assert.equal((await api("/api/email/preferences", {headers:auth})).status, 200);
    assert.equal((await api("/api/email/preferences", {method:"PUT",headers:auth,
      body:JSON.stringify({frequency:"weekly",countries:["South Africa"],breakingEnabled:false,personalizedEnabled:false})})).status, 200);
    assert.equal(notificationPrefs.frequency, "weekly");
    assert.equal(notificationPrefs.breakingEnabled, false);
    assert.equal((await api("/api/email/preferences", {method:"PUT",headers:auth,body:'{"frequency":"hourly"}'})).status, 400);

    const resetBody = JSON.stringify({user:{email:"member@example.test"},
      email_data:{email_action_type:"recovery", token_hash:"synthetic-provider-reset-hash"}});
    const id = "hook-event-1";
    const now = new Date();
    const signature = new Webhook(process.env.RESEND_WEBHOOK_SECRET!).sign(id, now, resetBody);
    const hookHeaders = {"Content-Type":"application/json","webhook-id":id,
      "webhook-timestamp":String(Math.floor(now.getTime()/1000)), "webhook-signature":signature};
    assert.equal((await api("/api/email/hooks/supabase", {method:"POST",headers:{"Content-Type":"application/json"},body:resetBody})).status, 401);
    assert.equal((await api("/api/email/hooks/supabase", {method:"POST",headers:hookHeaders,body:resetBody})).status, 200);
    const reset = deliveries[deliveries.length-1].body;
    assert.ok(reset.text.includes("supabase.example.test/auth/v1/verify"));
    assert.ok(reset.text.includes("type=recovery"));
    assert.ok(reset.text.includes("reset-password"));
    assert.ok(!JSON.stringify(Array.from(records.values())).includes("synthetic-provider-reset-hash"), "reset hashes must not enter delivery records");
    const afterReset = deliveries.length;
    assert.equal((await api("/api/email/hooks/supabase", {method:"POST",headers:hookHeaders,body:resetBody})).status, 200);
    assert.equal(deliveries.length, afterReset);
    assert.equal((await api("/api/email/hooks/supabase", {method:"POST",headers:hookHeaders,body:resetBody + " "})).status, 401);

    const eventBody = JSON.stringify({type:"email.delivered",data:{email_id:`provider-${afterReset}`}});
    const eventId = "resend-event-1";
    const eventHeaders = {"Content-Type":"application/json","svix-id":eventId,
      "svix-timestamp":String(Math.floor(now.getTime()/1000)),
      "svix-signature":new Webhook(process.env.RESEND_WEBHOOK_SECRET!).sign(eventId,now,eventBody)};
    assert.equal((await api("/api/email/webhooks/resend", {method:"POST",headers:eventHeaders,body:eventBody})).status, 200);
    assert.equal((await api("/api/email/webhooks/resend", {method:"POST",headers:eventHeaders,body:eventBody})).status, 200);
    assert.equal(events.size, 1);
    assert.equal((await api("/api/email/webhooks/resend", {method:"POST",headers:{"Content-Type":"application/json"},body:eventBody})).status, 400);
    assert.equal((await api("/api/admin/email-status")).status, 401);
    const bounceBody = JSON.stringify({type:"email.bounced",data:{email_id:"provider-1"}});
    const bounceId = "bounce-1";
    const bounceHeaders = {"Content-Type":"application/json","svix-id":bounceId,
      "svix-timestamp":String(Math.floor(now.getTime()/1000)),
      "svix-signature":new Webhook(process.env.RESEND_WEBHOOK_SECRET!).sign(bounceId,now,bounceBody)};
    assert.equal((await api("/api/email/webhooks/resend", {method:"POST",headers:bounceHeaders,body:bounceBody})).status, 200);
    assert.equal(records.get(emailIdentity("welcome","registration","member@example.test")).status, "bounced");

    const basic = {to:"retry@example.test",subject:"Test",html:"<p>Test</p>",text:"Test",kind:"test",identity:"retry"};
    rateLimitNext = true;
    assert.equal(await sendEmail(basic), "sent");
    const lastTwo = deliveries.slice(-2);
    assert.equal(new Headers(lastTwo[0].headers).get("idempotency-key"), new Headers(lastTwo[1].headers).get("idempotency-key"));
    rejectNext = true;
    await assert.rejects(sendEmail({...basic, identity:"unverified"}), /validation_error/);
    delete process.env.RESEND_API_KEY;
    assert.equal((await (await api("/api/email/auth-status")).json()).passwordResetAvailable, false);
    await assert.rejects(sendWelcomeEmail("missing@example.test"), /configuration incomplete/);
    assert.equal(safeEmailError("raw-secret-value"), "provider_error");
    assert.equal(emailIdentity("welcome","a","USER@example.test"), emailIdentity("welcome","a","user@example.test"));
    assert.ok(!plainTextEmail("<style>private</style><p>Hello</p>").includes("private"));
    assert.equal(digestPeriod("weekly", new Date("2026-10-21T09:00:00Z")), "weekly:2026-10-19");
  } finally {
    globalThis.fetch = oldFetch;
    (db as any).execute = oldExecute;
    (db as any).transaction = oldTransaction;
    storage.getUserBySupabaseId = oldUser;
    storage.getFeedSources = oldSources;
    storage.getUserPreferences = oldPrefs;
    for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
    await new Promise<void>(resolve => server.close(() => resolve()));
    await pool.end();
  }
});
