# Cricket Legends 20–0 — Version 12: Skill-first
Live: https://cricket-legends-20-0.onrender.com

## Fairer 20–0 challenge
In **Skill-first mode (default)**, each fixture is judged by a majority of **21 fixed, shared ball-by-ball simulations**. Every XI faces the same match conditions; the same XI, batting order, fixture and frozen player rating snapshot give the same results on replay. A representative scenario supplies the complete batting/bowling scorecard. A **41-scenario tactical outlook** is displayed for the next fixture. This is the percentage of modelled scenarios favourable to the XI, not a calibrated real-world win probability.

The simulation considers sourced, format-labelled international player career figures when embedded in the game and neutral role-based priors where unavailable, plus batting order, wicket preservation, run scoring and five-bowler coverage. Any pace/spin composition is legal. Live supplemental career data can load on draft cards but does not silently change competition outcomes: leaderboard and browser skill-first mode use the same fixed records.

**Classic mode** is optional, preserves one-off match variance, and is unranked and ineligible for coin rewards. Old saved results are not overwritten.

## Test
Run `npm install` and `npm test` (Node 20+). Start with `npm start`. Test cases confirm deterministic records, scorecard totals and strong-vs-weak XI separation.

## Notes
The online leaderboard and matchmaking use the same skill-first model. Free Render-host filesystem data is not durable and should be moved to a database for production. Real paid ads, player-data licensing and account security require further work.
