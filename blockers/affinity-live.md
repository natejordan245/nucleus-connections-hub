# Blocker — Affinity live API access

## What's blocked
Real outbound calls to `https://api.affinity.co/persons`, `/list-entries`,
`/notes` from `AffinityClient`. We don't have an API key from Nucleus yet, so
`AFFINITY_LIVE=false` is the default in `.env.example`.

## What works without it
The admin slide (slide 7 — `/admin/affinity-push`) reads from
`MockAffinityClient.recentPushes()` and renders the JSON payloads that *would*
have been sent. This is the demo-relevant surface.

## Unblock
1. Receive Affinity API key from Nucleus.
2. Set `AFFINITY_LIVE=true` and `AFFINITY_API_KEY=…` in `.env.local`.
3. Confirm Nucleus has a list named `Nucleus Connections — Mutual Match` (or
   set `AFFINITY_LIST_NAME`).
4. The interest API route already calls both `recordPush` (always, for the
   admin slide) and the live endpoints (when flag is on).
