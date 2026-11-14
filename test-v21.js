'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const engine=require('./server-engine');
const ability=require('./player-ability');
const daily=require('./daily-engine');
const {createStore}=require('./storage');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cricket-v21-tests-'));
process.env.DATA_DIR=tmp;
function goodXI(){return ['don-bradman','kumar-sangakkara','ms-dhoni','matthew-hayden','brian-lara','ab-de-villiers','rashid-khan','malcolm-marshall','curtly-ambrose','shakib-al-hasan','lasith-malinga'];}
async function run(){
 // Critical fairness: an all-rounder with the same batting/bowling records must have
 // identical overall batting/bowling strength to a listed specialist.
 const stats={id:'fictional-test-player',avg:38.4,sr:141.8,ba:23.1,fmt:'T20I',m:65};
 const ar=ability.profile({...stats,role:'A'}),bat=ability.profile({...stats,role:'B'}),bowl=ability.profile({...stats,role:'P'});
 assert.equal(ar.bat.overall,bat.bat.overall,'Allrounder is NOT an inferior batter for equal stats');
 assert.equal(ar.bowl.overall,bowl.bowl.overall,'Allrounder is NOT an inferior bowler for equal stats');
 assert.equal(ar.bat.overall,bowl.bat.overall,'Batting score is independent of specialist category');
 assert.equal(ar.bowl.overall,bat.bowl.overall,'Bowling score is independent of specialist category');
 const athlete=id=>ability.profile(engine.byId.get(id));
 assert.equal(athlete('shane-watson').kind,'pace');
 assert.ok(athlete('shane-watson').bat.powerplay>athlete('shane-watson').bat.middle,'Watson can open');
 assert.equal(athlete('shahid-afridi').kind,'spin');
 assert.ok(athlete('shahid-afridi').bowl.middle>athlete('shahid-afridi').bat.overall,'Afridi is bowling-first');
 assert.ok(athlete('jacques-kallis').bat.overall>=70,'Small T20I sample balanced with excellent Test record');
 assert.equal(athlete('jacques-kallis').record.verified,true);
 const verifiedIds=['shane-watson','jacques-kallis','shahid-afridi','shakib-al-hasan','andre-russell','mohammad-nabi','dwayne-bravo','kieron-pollard'];
 for(const id of verifiedIds){const record=athlete(id).record;assert.equal(record.verified,true,id);assert.match(record.source,/^https:\/\/www\.windiescricket\.com\/players\//);assert.ok(record.economy>0);assert.ok(record.strikeRate>0);}
 assert.ok(athlete('jacques-kallis').bat.powerplay>=74,'Kallis is a genuine top-order batter');
 const q=ability.selectBowlers([engine.byId.get('shahid-afridi'),...engine.randomOpp('India')]);
 assert.ok(q.some(x=>x.p.id==='shahid-afridi'),'Genuine bowling allrounder competes for overs on merit');
 const day='2026-11-14',pool=daily.dailyPool(day);
 assert.equal(pool.length,24);assert.deepEqual(daily.dailyPool(day).map(x=>x.id),pool.map(x=>x.id));
 assert.notDeepEqual(daily.dailyPool('2026-11-15').map(x=>x.id),pool.map(x=>x.id));
 assert.equal(pool.filter(x=>x.role==='A').length,5);
 const a=engine.validXI(goodXI()),b=engine.randomOpp('Australia');
 const tactics={batting:'attack',bowling:'contain',focus:'spin'},opp={batting:'anchor',bowling:'attack',focus:'pace'};
 const one=engine.simMatch(a,b,3,tactics,opp);
 assert.deepEqual(one,engine.simMatch(a,b,3,tactics,opp));
 assert.notDeepEqual(one,engine.simMatch(a,b,3,tactics,{batting:'attack',bowling:'contain',focus:'spin'}),'Rival captaincy also matters');
 const disk=path.join(tmp,'test-records.json');let store=createStore({databaseUrl:'',file:disk});await store.init();
 await store.put('global','abc123456789',{wins:18});assert.equal((await store.get('global','abc123456789')).wins,18);
 store=createStore({databaseUrl:'',file:disk});await store.init();assert.equal((await store.list('global')).length,1);
 const service=require('./server');await service.store.init();
 const server=http.createServer(service.handle);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const get=async u=>{const r=await fetch(base+u);return {status:r.status,body:await r.json()};};
 const post=async(u,data)=>{const r=await fetch(base+u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:r.status,body:await r.json()};};
 try{
  const h=await get('/api/health');assert.equal(h.status,200);assert.equal(h.body.persistent,false);
  const dailyData=(await get('/api/daily')).body;assert.equal(dailyData.pool.length,24);
  const ids=dailyData.pool.slice(0,11).map(x=>x.id),device='demo_device_1234567890';
  assert.equal((await post('/api/daily/submit',{clientId:device,xi:goodXI()})).status,400,'Reject outsiders to fixed daily pool');
  const d1=await post('/api/daily/submit',{clientId:device,name:'Captain A',xi:ids,plan:tactics});assert.equal(d1.status,200);assert.equal(d1.body.firstAttempt,true);
  const d2=await post('/api/daily/submit',{clientId:device,name:'Captain A',xi:ids,plan:tactics});assert.equal(d2.status,200);assert.equal(d2.body.firstAttempt,false);
  const table=(await get('/api/daily/leaderboard')).body;assert.equal(table.entries.length,1,'Best score per device per day');
  const p1=await post('/api/leaderboard',{clientId:device,name:'Captain A',xi:goodXI(),plan:tactics});assert.equal(p1.status,200);
  const p2=await post('/api/leaderboard',{clientId:device,name:'Captain A',xi:goodXI(),plan:tactics});assert.equal(p2.status,200);
  assert.equal((await get('/api/leaderboard')).body.entries.length,1,'Global per-device best is deduplicated');
  const created=await post('/api/challenges',{name:'Captain A',xi:goodXI(),plan:tactics});assert.equal(created.status,201);
  const code=created.body.invite.code;assert.ok(code.length>=14);
  assert.equal((await get('/api/challenges/'+code)).status,200);
  const joined=await post('/api/challenges/'+code+'/join',{name:'Captain B',clientId:'another_device_12345678',xi:ids,plan:opp});assert.equal(joined.status,200);
  assert.equal(joined.body.match.scenarioTotal,21);
  assert.equal(joined.body.match.first.total,joined.body.match.first.bat.reduce((s,x)=>s+x.r,0)+joined.body.match.first.extras);
  const duplicate=await post('/api/challenges/'+code+'/join',{name:'Captain B',clientId:'another_device_12345678',xi:ids,plan:opp});assert.equal(duplicate.body.alreadyPlayed,true);
  assert.equal((await get('/api/challenges/'+code+'/results')).body.results.length,1);
  const wp=(await get('/api/players?id=shane-watson')).body.player;assert.equal(wp.record.verified,true);
  assert.equal((await get('/api/players?id=unknown')).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));await service.store.close();}
 const html=fs.readFileSync('./index.html','utf8');assert.ok(html.includes(fs.readFileSync('./player-ability.js','utf8')),'Browser and server share the EXACT same player ability engine');
 assert.ok(html.includes('FACE YOUR FRIEND'));assert.ok(html.includes('v21DailySubmit'));assert.ok(html.includes('v21DailyPick'));
 console.log('PASS V21: all-rounder role parity, audited T20I profiles, deterministic daily pool, ranked score deduplication, real server friend duels, tactics, disk persistence and API integration');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
