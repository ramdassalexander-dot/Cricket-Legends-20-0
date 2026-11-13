'use strict';
const assert=require('node:assert/strict');
const e=require('./server-engine');
const countries=['India','Australia','England','Pakistan','West Indies','South Africa','New Zealand','Sri Lanka','Afghanistan','Bangladesh'];
assert.deepEqual(Object.keys(e.legends).sort(),countries.slice().sort());
for(const country of countries){
 const ids=e.legends[country],xi=e.randomOpp(country);
 assert.equal(ids.length,11);assert.equal(new Set(ids).size,11);
 assert.deepEqual(xi.map(p=>p.id),ids);
 assert.ok(xi.every(p=>p.nation===country));
 assert.ok(xi.some(p=>p.role==='W'));
 assert.ok(xi.filter(p=>['P','S','A'].includes(p.role)).length>=5);
}
const elite=['adam-gilchrist','sachin-tendulkar','virat-kohli','viv-richards','brian-lara','jacques-kallis','wasim-akram','malcolm-marshall','shane-warne','glenn-mcgrath','rashid-khan'];
const weak=e.rosters.Afghanistan['2020'].slice(0,11);
const first=e.season(elite),replay=e.season(elite),other=e.season(weak);
assert.deepEqual(first,replay);assert.ok(first.wins>other.wins);
assert.equal(first.oppositionVersion,e.OPPONENT_VERSION);
for(let i=0;i<20;i++){
 const match=e.simMatch(e.validXI(elite),e.randomOpp(countries[i%10]),i);
 assert.equal(match.aRuns,match.firstSide==='a'?match.first.total:match.second.total);
 assert.equal(match.bRuns,match.firstSide==='b'?match.first.total:match.second.total);
 assert.equal(match.winner==='a',match.scenarioWins>10);
}
console.log('PASS: all-time national XIs, squad balance, repeatable 20-match results and coherent scorecards');
console.log('Elite '+first.wins+'–'+first.losses+'; weaker XI '+other.wins+'–'+other.losses);
