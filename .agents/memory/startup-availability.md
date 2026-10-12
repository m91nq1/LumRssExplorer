---
name: Startup availability
description: Availability-versus-freshness tradeoff when starting LUM News.
---

Prefer serving existing database articles immediately, even if the initial external-feed refresh has not completed.

**Why:** Refreshing hundreds of external sources before serving the app makes provider timeouts delay the entire site. The dashboard needs to remain accessible independently of provider availability.

**How to apply:** Keep slow external feed work independent of web-server readiness. Treat freshness as background work, not a prerequisite for viewing saved news.
