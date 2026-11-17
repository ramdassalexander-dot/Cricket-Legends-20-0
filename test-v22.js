'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const players=require('./player-data.json'),ability=require('./player-ability'),fit=require('./draft-fit');
const byId=new Map(players.map(x=>[x.id,x]));
const p=id=>{const x=byId.get(id);assert.ok(x,id);return x;};
assert.equal(ability.VERSION,'all-time-legends-v22-marginal-fit');
assert.ok(fs.readFileSync('index.html','utf8').includes(fs.readFileSync('player-ability.js','utf8').trim()));
assert.ok(fs.readFileSync('index.html','utf8').includes(fs.readFileSync('draft-fit.js','utf8').trim()));
assert.ok(fs.readFileSync('index.html','utf8').includes('CricketDraftFitV22.rate(v15Player(p)'));
for(const id of ['babar-azam','jasprit-bumrah','kane-williamson','mohammad-rizwan','suryakumar-yadav','glenn-maxwell','hardik-pandya','steve-smith']){
  assert.equal(ability.profile(p(id)).record.verified,true,id);
  assert.match(ability.profile(p(id)).record.source,/^https:\/\//);
}
const five=['rashid-khan','malcolm-marshall','curtly-ambrose','jasprit-bumrah','wasim-akram'].map(p);
assert.ok(fit.rate(p('shakib-al-hasan'),[],ability).score>fit.rate(p('bangladesh-afif-hossain'),[],ability).score+10);
assert.ok(ability.profile(p('babar-azam')).bat.overall>ability.profile(p('pakistan-asif-mujtaba')).bat.overall+13);
assert.ok(ability.profile(p('jasprit-bumrah')).bowl.overall>ability.profile(p('india-roger-binny')).bowl.overall+20);
assert.equal(fit.rate(p('gulbadin-naib'),five,ability).bowlingGain,0);
assert.ok(fit.rate(p('babar-azam'),five,ability).score>fit.rate(p('gulbadin-naib'),five,ability).score+8);
assert.ok(fit.rate(p('shakib-al-hasan'),five,ability).score>fit.rate(p('bangladesh-afif-hossain'),five,ability).score+3);
assert.ok(fit.rate(p('shakib-al-hasan'),five.slice(0,4),ability).score>fit.rate(p('bangladesh-afif-hossain'),five.slice(0,4),ability).score+15);
assert.ok(fit.rate(p('babar-azam'),['andre-russell','glenn-maxwell','shane-watson','shakib-al-hasan'].map(p),ability).score>fit.rate(p('pakistan-asif-mujtaba'),[],ability).score+8);
assert.ok(fit.rate(p('jasprit-bumrah'),['virat-kohli','sachin-tendulkar','babar-azam','viv-richards'].map(p),ability).bowlingGain>15);
const sample={id:'fictional-test-player',avg:35,sr:135,ba:22,eco:7.3,fmt:'T20I',m:80};
assert.ok(Math.abs(fit.rate({...sample,role:'A'},[],ability).score-fit.rate({...sample,role:'B'},[],ability).score)<=3);
const failures=[];
for(const nation of new Set(players.map(x=>x.nation))){const xs=players.filter(x=>x.nation===nation);
const unknown=xs.filter(x=>x.role==='A'&&x.avg==null&&x.ba==null&&!ability.profile(x).record.verified);
const verified=xs.filter(x=>ability.profile(x).record.verified&&ability.profile(x).bat.overall>=68);
for(const x of unknown)for(const y of verified)if(fit.rate(x,[],ability).score>=fit.rate(y,[],ability).score+4)failures.push(nation+':'+x.id+':'+y.id);
}
assert.deepEqual(failures,[]);
console.log('PASS V22: role-neutral recommendations, five-bowler marginal value, verified stars > generic defaults, country regressions');
