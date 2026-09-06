---
name: Google Calendar rate limits
description: Production constraint for reliably loading the public Google Calendar ICS feed.
---

Concurrent cold-start requests must share one upstream Google Calendar ICS fetch, and temporary upstream failures should serve the last successful result.

**Why:** Production has returned Google `429 Too Many Requests` responses when multiple page loads reached a fresh server before its in-memory calendar cache was populated. Returning the empty cache made the public calendar appear blank.

**How to apply:** Keep request deduplication and stale-cache behavior when changing calendar fetching. Prefer a longer cache window and cacheable API responses rather than fetching the ICS feed for each page load.