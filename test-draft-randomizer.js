'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {pick,remember,COOLDOWN}=require('./draft-randomizer'),rosters=require('./era-rosters.json');
const all=Object.entries(rosters).flatMap(([country,eras])=>Object.keys(eras).map(era=>({country,era:Number(era)})));
assert.equal(all.length,45);assert.equal(COOLDOWN,4);
assert.equal(all.filter(x=>x.country==='Bangladesh').length,3);assert.equal(all.filter(x=>x.country==='Afghanistan').length,2);
function rng(seed){let h=seed>>>0;return ()=>{h=(Math.imul(h,1664525)+1013904223)>>>0;return h/4294967296;};}
let repeatedBangladesh=0,repeatedAfghanistan=0;
for(let trial=0;trial<5000;trial++){let history=[],random=rng(trial+1);
 for(let round=0;round<11;round++){const chosen=pick(all,history,random);assert.ok(chosen);assert.ok(!history.slice(-4).includes(chosen.country),'Country repeated during four-spin cooldown');history=remember(history,chosen.country);}
 assert.equal(history.length,11);
 if(history.filter(x=>x==='Bangladesh').length>1)repeatedBangladesh++;
 if(history.filter(x=>x==='Afghanistan').length>1)repeatedAfghanistan++;
}
assert.ok(repeatedBangladesh<500,'Bangladesh appears repeatedly too often');
assert.ok(repeatedAfghanistan<350,'Afghanistan appears repeatedly too often');
const fixedEra=all.filter(x=>x.era===2010&&x.country!=='Bangladesh');
assert.equal(pick(fixedEra,['Bangladesh'],rng(32)).era,2010);
assert.equal(pick([{country:'Bangladesh',era:2020}],['Bangladesh'],rng(1)).country,'Bangladesh','Cooldown must relax if no alternatives');
assert.equal(pick([],[],rng(1)),null);
assert.equal(remember(undefined,'India')[0],'India');
assert.ok(fs.readFileSync('index.html','utf8').includes(fs.readFileSync('draft-randomizer.js','utf8').trim()),'HTML and Node module must match');
assert.ok(fs.readFileSync('index.html','utf8').includes('CricketDraftRoller.pick('));
console.log('PASS V21.1: anti-streak country draws, country/era rerolls, offline parity and rarity safeguards');
