'use strict';
// Cricket Legends V12 — competitive seasons with fixed matched scenarios.
// Same XI and fixture yields the same 20 outcomes, eliminating retry-to-get-lucky rankings.
const players=require('./player-data.json'),rosters=require('./era-rosters.json'),legends=require('./legends-xi.json'),ability=require('./player-ability');
const byId=new Map(players.map(p=>[p.id,p]));
const fixtureCountries=['India','Australia','England','Pakistan','West Indies','South Africa','New Zealand','Sri Lanka','Afghanistan','Bangladesh'];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function recordMetrics(p){const x=ability.profile(p);return {bat:x.bat.overall,bowl:x.bowl.overall};}
function battingSkill(p){const q=recordMetrics(p);return clamp((q.bat-55)/75,-.18,.43);}
function bowlingSkill(p){const q=recordMetrics(p);return clamp((q.bowl-55)/150,-.15,.32);}
function selectBowlers(xs){let ranked=xs.map((p,i)=>({p,i,s:recordMetrics(p).bowl+(p.role==='P'||p.role==='S'?35:p.role==='A'?22:0)}));ranked.sort((a,b)=>b.s-a.s);return ranked.slice(0,5).map(x=>x.p);}
function fixedRng(text){let h=2166136261;for(let i=0;i<text.length;i++){h=Math.imul(h^text.charCodeAt(i),16777619)>>>0;}return function(){h=(h+0x6D2B79F5)>>>0;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
const OPPONENT_VERSION=ability.VERSION;
const FIXTURE_TRIALS=21, OUTLOOK_TRIALS=21;
function cleanPlan(plan={}){const pick=(k,options,def)=>options.includes(plan?.[k])?plan[k]:def;return {batting:pick('batting',['anchor','balanced','attack'],'balanced'),bowling:pick('bowling',['attack','balanced','contain'],'balanced'),focus:pick('focus',['pace','balanced','spin'],'balanced')};}
function simInnings(batting,bowling,target=null,rng=Math.random,ix=0,plan={}){return ability.simulateInnings(batting,bowling,target,rng,{...ability.context(ix),plan:cleanPlan(plan)});}
function randomOpp(country){
 const ids=legends[country];if(!Array.isArray(ids)||ids.length!==11)throw Error(`Missing Legends XI for ${country}`);
 const xi=ids.map(id=>byId.get(id));if(xi.some(p=>!p||p.nation!==country))throw Error(`Invalid Legends XI for ${country}`);
 return xi;
}

function trial(a,b,ix,k,plan={}){
 const rng=fixedRng('CL2026|strategy|'+ix+'|'+k),firstSide=ix%2===0?'a':'b';
 const first=simInnings(firstSide==='a'?a:b,firstSide==='a'?b:a,null,rng,ix,firstSide==='a'?plan:{});
 const second=simInnings(firstSide==='a'?b:a,firstSide==='a'?a:b,first.total+1,rng,ix,firstSide==='a'?{}:plan);
 const aRuns=firstSide==='a'?first.total:second.total,bRuns=firstSide==='a'?second.total:first.total;
 const winner=aRuns===bRuns?'TIE':aRuns>bRuns?'a':'b';
 return {first,second,firstSide,aRuns,bRuns,winner,margin:aRuns-bRuns};
}
function verdict(a,b,ix,n=FIXTURE_TRIALS,plan={}){
 let wins=0,ties=0;const trials=[];
 for(let k=0;k<n;k++){const x=trial(a,b,ix,k,plan);trials.push(x);if(x.winner==='a')wins++;else if(x.winner==='TIE')ties++;}
 const win=wins>Math.floor(n/2),matching=trials.filter(x=>(x.winner==='a')===win);
 const candidates=matching.length?matching:trials;
 const margins=candidates.map(x=>x.margin).sort((x,y)=>x-y),median=margins[Math.floor(margins.length/2)];
 const best=candidates.reduce((p,x)=>Math.abs(x.margin-median)<Math.abs(p.margin-median)?x:p,candidates[0]);
 return {...best,scenarioWins:wins,scenarioTotal:n,modelEdge:Math.round((wins+ties*.5)/n*100)};
}
function simMatch(a,b,ix=0,plan={}){return verdict(a,b,ix,FIXTURE_TRIALS,plan);}
function forecast(a,b,n=OUTLOOK_TRIALS){return verdict(a,b,0,Math.max(1,Math.min(n,OUTLOOK_TRIALS))).modelEdge;}
function validXI(ids){if(!Array.isArray(ids)||ids.length!==11||new Set(ids).size!==11)return null;const xs=ids.map(x=>byId.get(x));return xs.every(Boolean)?xs:null;}
function season(ids,plan={}){const us=validXI(ids);if(!us)throw Error('Invalid XI');let wins=0,losses=0,diff=0,runTotal=0;
 for(let i=0;i<20;i++){const op=randomOpp(fixtureCountries[i%10]);const m=simMatch(us,op,i,plan);if(m.winner==='a')wins++;else losses++;diff+=m.aRuns-m.bRuns;runTotal+=m.aRuns;}
 return {wins,losses,diff,runTotal,mode:'skill-first',oppositionVersion:OPPONENT_VERSION,cleanPlan};
}
module.exports={byId,rosters,simMatch,simInnings,forecast,season,validXI,randomOpp,recordMetrics,legends,OPPONENT_VERSION};
