# Cricket Legends 20–0 · V21 Dual-Skill Legends Cup

**Live game:** https://cricket-legends-20-0.onrender.com

## New in V21

- **Fair all-rounder ratings:** batting and bowling are independently calculated from each player's own available averages, strike rate and (where sourced) T20I economy. An all-rounder with the same records as a specialist receives identical overall batting and bowling ability. Team-fit scoring now counts true opening/top-order ability, six-hitting, genuine five-bowler depth and elite dual-skilled contributions instead of penalizing the `A` label. Watson and Kallis can open; Afridi, Shakib and Nabi can be frontline spinners; Bravo, Russell and Watson can bowl seam. Position/phase traits remain gameplay estimates.
- **Historical figures with a visible audit trail:** eight high-impact all-rounders have linked T20I career lines (`player-ability.js`, `DATA_SOURCES.md`), including career batting averages, strike rates, bowling averages and economy. Other game records originate from existing snapshots where available; the game clearly labels estimated data. **Most of the 793 players still need source-backed records** — do not confuse the fantasy phase ratings with verified real performance data.
- **Daily Cup:** everyone receives the same 24 selectable cricketers on the same UTC day; build an XI, choose batting order and captaincy, submit a deterministic 20-match result scored **on the server**, and compare your best daily entry. No pay-to-win bonuses.
- **Real direct friend challenges:** invite another player with a unique shareable 7-day link. Both players draft their own XI and captaincy; the server runs the 21 common fixed conditions, retains the result and shows detailed innings scorecards.
- **Global rankings:** server-computed season result, best per anonymous browser device; new version separates V21 from the previous easier leagues. Browser identity is *not* secure sign-in. Rankings are not cheat-proof for drafts.
- **Rewards and achievements:** first daily entry +25 free coins, friendly match +10 or win +30, trophy badges for undefeated season, elite record, deep bowling, perfect daily and a friendly challenge. The existing 200-coin draft reroll and legacy reward tiers are preserved; the coins are local game currency, never bought with real money.
- **Captaincy and conditions:** batting aggression, bowling attack vs containment, pace vs spin preference, pitch impact, fixed results; the same exact ability module powers browser and server.

## PostgreSQL: required to make public rankings **durable**

The game uses `storage.js`, which automatically creates the PostgreSQL `cricket_records_v21` table and indexes on startup if the secure environment variable `DATABASE_URL` is available. Without it, the server continues to run with **temporary local JSON files**; this fallback is not permanent on Render.

An existing Render PostgreSQL database is available in the workspace (name `cricket-legends-leaderboards`, ID `dpg-dbs4tk67bikc73ejveh0-a`). Connect without exposing your password in ChatGPT:

1. Open the [database dashboard](https://dashboard.render.com/d/dpg-dbs4tk67bikc73ejveh0-a) in Render and copy its **Internal Database URL**.
2. Open the [web service dashboard](https://dashboard.render.com/web/srv-dbri3q8u01pc73baq4mg) → **Environment** → add a `DATABASE_URL` environment variable with that private URL → **Save, rebuild and deploy**.
3. Verify https://cricket-legends-20-0.onrender.com/api/health returns `"persistent": true` and `"storage": "postgres"`.

**Important:** Render free PostgreSQL instances expire after 30 days; this particular instance reports an expiry date of **December 14, 2026**. To keep rankings reliably in the long term, upgrade the DB to a non-expiring plan before expiry or migrate/export the data. Existing V20 filesystem leaderboard history is not migrated automatically; V21 rankings start their own table.

## Development, tests, and balance

Node.js 20+; commands:

```sh
npm install
npm test
npm run balance
npm start
```

`npm test` covers old engine compatibility, dual-skill fairness, record provenance, deterministic match simulation, fixed daily pool, HTTP APIs, scorecard accounting, server-side verification, disk persistence and real friend duels. `npm run balance` runs 500 deterministic XI simulations (400 mixed-strength, 100 elite) to guard against a trivial or impossible unbeaten season. These simulations are a *gameplay* calibration, not claims about real cricket probabilities. At the November 14 V21 check, random teams averaged 1.08 wins out of 20, while 11 of 100 elite lineups achieved 20–0.

`browser-test.py` exercises the live UI using Playwright from a local test server, including selecting the daily 11, submitting a result, creating an invitation and accepting it in a separate browser context.

## Limitations / roadmap

- Eight of 793 players have manually source-checked T20I records in this release. All other player phase/matchup abilities remain estimates derived from sparse existing snapshots and curated playing styles. Historic era normalization and exhaustive validation remain future work.
- Guest identities are browser-scoped, not secure logins. One player can use multiple devices; this is not yet esports-grade tamper resistance.
- Friend duels are an **asynchronous server-scored challenge**, not real-time ball-by-ball multiplayer.
- You must connect `DATABASE_URL` to get durable public rankings and invites. Test status via `/api/health`.
- Advertising is a demo; there are no real paid transactions or ad network integrations.
