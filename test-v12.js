'use strict';
const assert=require('node:assert/strict'),engine=require('./server-engine');
const elite=['adam-gilchrist','sachin-tendulkar','virat-kohli','viv-richards','brian-lara','jacques-kallis','wasim-akram','malcolm-marshall','shane-warne','glenn-mcgrath','rashid-khan'];
const weak=engine.rosters.Afghanistan['2020'].slice(0,11);
assert.ok(engine.validXI(elite));assert.ok(engine.validXI(weak));
const a=engine.season(elite),b=engine.season(elite),c=engine.season(weak);
assert.deepEqual(a,b,'Identical team and order must give identical results');
assert.ok(a.wins>c.wins,'Strong XI should outperform weak XI');
const opponents=['India','Australia','England','Pakistan','West Indies','South Africa','New Zealand','Sri Lanka','Afghanistan','Bangladesh'];
for(let i=0;i<20;i++){
 const x=engine.simMatch(engine.validXI(elite),engine.randomOpp(opponents[i%10]),i);
 assert.equal(x.aRuns,x.firstSide==='a'?x.first.total:x.second.total);
 assert.equal(x.bRuns,x.firstSide==='b'?x.first.total:x.second.total);
 assert.equal(x.scenarioTotal,21);
 assert.equal(x.winner==='a',x.scenarioWins>10);
}
const odds=engine.forecast(engine.validXI(elite),engine.validXI(weak),41);
assert.ok(odds>=0&&odds<=100);
console.log('PASS: repeatable seasons; stronger XI wins more; coherent scorecards.');