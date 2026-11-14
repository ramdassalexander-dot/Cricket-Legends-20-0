# Cricket Legends 20–0 — V15 Individual Player Abilities / National Legends League

Public game: https://cricket-legends-20-0.onrender.com

## All-time country opponents
Every one of the ten national opponents fields a hand-curated **All-Time Legends XI** from across its cricket history, rather than a recent-era XI. The ten lineups in `legends-xi.json` each contain exactly 11 players, a wicketkeeper and at least five bowling options. Each country is played twice in the 20-match league. The match screen's **VIEW THEIR XI** button reveals the names and roles of your next opponents.

The teams are fantasy selections for gameplay—not official ICC or national selections. Career records are drawn from the game's existing published source snapshots when available; absent records use gameplay baselines, not invented official statistics. Your **draft remains country-and-era specific**, with 20 player options per spin.

## Fair 20–0 challenge
The default skill-first engine runs 21 fixed, shared scenarios for each fixture. Replaying the same XI with the same batting order yields the same results. Stronger all-time teams raise the difficulty through their player composition, not by artificially changing the result. The browser and server use the same opponent IDs. Existing in-progress old seasons remain tagged as legacy; start a new draft for the Legends League.

**Leaderboards are versioned**: old easier-opponent attempts are retained but excluded from new Legends League rankings. Local rankings remain in your browser; the global leaderboard remains temporarily stored on the hosting filesystem until permanent storage is configured.

## Running and testing
Node.js 20+. Run `npm install`, `npm test`, then `npm start` and open http://localhost:3000.

The app includes country rosters, sourced statistics where available, a broadcaster-style scoreboard, original music, full match scorecards, game achievements, a 200-coin reroll system, online matchmaking and server-verified 20-match season results. Advertising remains a demo until an actual ad network is approved and integrated.

## V14 Matchday Tactics and model fairness
The **SCOUT THE LEGENDS** panel lets players inspect all-time national squads and threat ratings. Before starting a ranked skill-first campaign, players can compare all 55 possible pairwise batting-position swaps against a chosen nation in BOTH fixtures (42 fixed trials) and apply one. Once a season starts, the XI is locked so server-verifiable ranked results remain fair. The pre-match **SCENARIO EDGE** uses the SAME 21 fixed conditions as the actual majority result; the earlier 41-trial forecast has been retired for ranked Legends seasons. These are game-mechanics scores, not real-world cricket probabilities.

## V15 player abilities
The game now uses **one shared `player-ability.js` module**, embedded verbatim in offline HTML and required by the Node server. Every player's powerplay/middle/death batting, aggression, survival, pace/spin matchups, bowling control and strike threat directly affect ball-by-ball outcomes. Pitches change pace/spin effectiveness. Ratings are transparent, unverified fantasy estimates from mixed-era career snapshots, role baselines and limited curated playing-style traits—not official T20 splits. Same 21 fixed match scenarios drive the forecast and winner. New V15 drafts have separate leaderboards; in-progress older seasons retain their model.
