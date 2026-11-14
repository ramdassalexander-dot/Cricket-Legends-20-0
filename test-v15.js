'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),engine=require('./server-engine'),ability=require('./player-ability');
const get=id=>engine.byId.get(id);
assert.equal(engine.OPPONENT_VERSION,ability.VERSION);
for(const id of ['viv-richards','virat-kohli','rashid-khan','lasith-malinga','sunil-narine','don-bradman','ms-dhoni','jasprit-bumrah','virender-sehwag']){
 const a=ability.profile(get(id));assert.ok(a);for(const value of Object.values(a.bat))assert.ok(value>=25&&value<=99);
}
assert.ok(ability.profile(get('virender-sehwag')).bat.aggression>ability.profile(get('rahul-dravid')).bat.aggression);
assert.ok(ability.profile(get('lasith-malinga')).bowl.death>ability.profile(get('lasith-malinga')).bowl.middle);
assert.notEqual(ability.context(1).surface,ability.context(2).surface);
const ids=['don-bradman','kumar-sangakkara','ms-dhoni','matthew-hayden','brian-lara','ab-de-villiers','rashid-khan','malcolm-marshall','curtly-ambrose','shakib-al-hasan','lasith-malinga'];
assert.deepEqual(engine.season(ids),engine.season(ids));
const m=engine.simMatch(engine.validXI(ids),engine.randomOpp('India'),0);
assert.equal(m.scenarioTotal,21);assert.equal(m.first.surface,ability.context(0).surface);
for(const inn of [m.first,m.second]){assert.equal(inn.total,inn.bat.reduce((s,p)=>s+p.r,0)+inn.extras);assert.ok(inn.bowl.every(x=>x.balls<=24));}
assert.ok(fs.readFileSync('./index.html','utf8').includes(fs.readFileSync('./player-ability.js','utf8')),'Browser/server must share one ability module');
console.log('PASS V15: individual abilities, deterministic seasons, scorecards and one shared engine');
