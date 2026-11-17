# Cricket Legends 20–0 · V22 Evidence-Aware Player Fit

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

## V21.1 — Fixing frustrating repeat country rolls
Previously all 45 available country–era combinations were selected uniformly independently for every spin: Bangladesh occupied 3 combinations (6.7%) and Afghanistan 2 (4.4%), with no memory of prior results. Consecutive repeats could occur by chance. The anti-streak spinner now excludes the last four drawn countries whenever another eligible country is available, and applies a 0.30 repeat multiplier to nations already seen during the draft. This is not a guaranteed one-of-each-country selection: smaller era pools remain less common and the game stays randomized. Free country rerolls keep the existing decade; era rerolls keep the existing country; 200-coin full respins use the same fair rolling policy. State is saved with the current draft; historical completed seasons and match odds are unchanged.


## V22 — Data integrity and Best Fit fix

**Corrected:** The previous fallback assigned almost any all-rounder without
recorded statistics an approximately 70 batting / 72 bowling combination,
which ranked unknown players above well-established internationals. V22
replaces these inflated defaults with conservative, role-aware but never
role-rewarding priors. Eleven additional sourced T20I career snapshots are
included. `Best Fit` calculates the *marginal change* in the top-five bowling
attack; a sixth unexceptional bowler cannot get another full bowling premium.
A proven all-rounder remains selectable on merit, including as a specialist
batter or bowler. No fixed all-rounder cap is used.

**Outstanding:** The complete 793-person record audit and format-matched
Statsguru / other licensed career statistics import is not yet complete.
Older players need evidenced Test/ODI translations, not fake T20I figures.

## V23 — ESPNcricinfo Statsguru links and reviewed-stat imports (17 November 2026)

Every player card now offers ESPNcricinfo lookup. Three identities are directly matched with Statsguru IDs: Virat Kohli (253802), Jasprit Bumrah (625383) and Shakib Al Hasan (56143). Others show a **search link, not a verified identity match**. The original career-figure source link remains visible separately, to avoid falsely claiming existing data is from ESPNcricinfo.

The batting/bowling game engine can consume independently reviewed ESPNcricinfo career records for T20I, T20, ODI and Test cricket. When imported, T20I is preferred for this T20 simulation; other formats are cross-format fantasy estimates. Records carry a source URL and an as-of date, and role is never an automatic all-rounder bonus. Use `npm run import:cricinfo -- path/to/reviewed-stats.json` with the normalized JSON documented in `cricinfo-import.js`; run `npm test` then commit the resulting `index.html` and `player-data.json` files. The importer checks IDs and statistic ranges and refuses duplicates. A full Statsguru audit of 793 players remains undone; there is **no live ESPNcricinfo subscription or bulk licence configured**.

**V23.1 adjustment:** An unverified wicketkeeper no longer receives a large guaranteed first-pick recommendation bonus. The wicketkeeper-need premium arises only late in drafting when the XI lacks one; batting and bowling remain ability-led. 

## ESPNcricinfo connector and daily update

The game now includes a runnable source-verified identity connector, not just a search link. GitHub Actions automatically downloads the open-data [Cricsheet People Register](https://cricsheet.org/register/) and matches game players only where an ESPNcricinfo ID is unambiguous. IDs are kept on the player record, and they propagate to the server and embedded game with the existing tests. Ambiguous matches are skipped, never invented.

**Career statistics:** Direct Statsguru pages were returning a maintenance notice on 17 November 2026. The working alternative is the documented [API.SH ESPNcricinfo Statsguru route](https://api.sh/docs/espncricinfo-player-stats). To enable automatic data import, add an **APISH_KEY** repository secret in GitHub → Settings → Secrets and variables → Actions → New repository secret. Never commit the key. The scheduled GitHub Action runs every day, uses the key only on GitHub's server, and caps imported API calls at 20 per run; the host's browser never sees the key. An API.SH account with credits is required. Parsed records are published only when they contain valid career performance values; otherwise the earlier sourced/estimated ratings remain.

Career summaries are split into batting and bowling. The model keeps Test, ODI and T20I records as separately labelled formats, and does not assume a Test score is a T20I figure. This is not a real-time, official ESPN licensing agreement, and source-specific data re-use remains subject to the provider's applicable terms. **Current actual import coverage must be checked rather than assumed to be 793 players.**
