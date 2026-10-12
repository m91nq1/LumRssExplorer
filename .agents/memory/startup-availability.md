---
name: Startup availability
description: Availability-versus-freshness tradeoff when starting LUM News.
---

Prefer serving existing database articles immediately, even if the initial external-feed refresh has not completed.

**Why:** Refreshing hundreds of external sources before serving the app makes provider timeouts delay the entire site. The dashboard needs to remain accessible independently of provider availability.

**How to apply:** Keep slow external feed work independent of web-server readiness. Treat freshness as background work, not a prerequisite for viewing saved news.

Public landing and sign-in pages must also remain available while authentication is being restored, including when browser storage is restricted.

**Why:** The user's reported white screen was the globe landing page, not the authenticated article dashboard. A slow session restore or denied storage must not prevent someone from reaching sign-in.

**How to apply:** Verify initial page loading independently of successful authentication; do not treat an already-restored session as adequate coverage for the public entry page.
