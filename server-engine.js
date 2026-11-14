'use strict';
// Cricket Legends V15: same game model as embedded offline HTML.
const players=require('./player-data.json');
const rosters=require('./era-rosters.json');
const legends=require('./legends-xi.json');
const ability=require('./player-ability');
const byId=new Map(players.map(p=>[p.id,p]));
const fixtureCountries=['India','Australia','England','Pakistan','West Indies','South Africa','New Zealand','Sri Lanka','Afghanistan','Bangladesh'];
const OPPONENT_VERSION=ability.VERSION;
const FIXTURE_TRIALS=21;
function recordMetrics(p){const q=ability.profile(p);return {bat:q.bat.overall,bowl:q.bowl.overall};}
function fixedRng(text){let h=2166136261;for(let i=0;i<text.length;i++){h=Math.imul(h^text.charCodeAt(i),16777619)>>>0;}return function(){h=(h+0x6D2B79F5)>>>0;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function randomOpp(country){const ids=legends[country];if(!Array.isArray(ids)||ids.length!==11)throw Error(`Missing Legends XI for ${country}`);const xi=ids.map(id=>byId.get(id));if(xi.some(p=>!p||p.nation!==country))throw Error(`Invalid Legends XI for ${country}`);return xi;}
function cleanPlan(plan={}){const pick=(k,options,def)=>options.includes(plan?.[k])?plan[k]:def;return {batting:pick('batting',['anchor','balanced','attack'],'balanced'),bowling:pick('bowling',['attack','balanced','contain'],'balanced'),focus:pick('focus',['pace','balanced','spin'],'balanced')};}
function buildInnings(batting,bowling,target=null,rng=Math.random,ix=0,plan={}){return ability.simulateInnings(batting,bowling,target,rng,{...ability.context(ix),plan:cleanPlan(plan)});}
function trial(a,b,ix,k,plan={},rivalPlan={}){
 const rng=fixedRng(`CL2026|strategy|${ix}|${k}`),firstSide=ix%2===0?'a':'b';
 const first=buildInnings(firstSide==='a'?a:b,firstSide==='a'?b:a,null,rng,ix,firstSide==='a'?plan:rivalPlan);
 const second=buildInnings(firstSide==='a'?b:a,firstSide==='a'?a:b,first.total+1,rng,ix,firstSide==='a'?rivalPlan:plan);
 const aRuns=firstSide==='a'?first.total:second.total,bRuns=firstSide==='a'?second.total:first.total;
 const winner=aRuns===bRuns?'TIE':aRuns>bRuns?'a':'b';
 return {first,second,firstSide,aRuns,bRuns,winner,margin:aRuns-bRuns,playingSurface:ability.context(ix).surface};
}
function verdict(a,b,ix,n=FIXTURE_TRIALS,plan={},rivalPlan={}){
 let wins=0,ties=0;const trials=[];
 for(let k=0;k<n;k++){const x=trial(a,b,ix,k,plan,rivalPlan);trials.push(x);if(x.winner==='a')wins++;else if(x.winner==='TIE')ties++;}
 const win=wins>Math.floor(n/2),matching=trials.filter(x=>(x.winner==='a')===win);
 const candidates=matching.length?matching:trials;
 const margins=candidates.map(x=>x.margin).sort((x,y)=>x-y),median=margins[Math.floor(margins.length/2)];
 const best=candidates.reduce((p,x)=>Math.abs(x.margin-median)<Math.abs(p.margin-median)?x:p,candidates[0]);
 return {...best,scenarioWins:wins,scenarioTotal:n,modelEdge:Math.round((wins+ties*.5)/n*100)};
}
function simMatch(a,b,ix=0,plan={},rivalPlan={}){return verdict(a,b,ix,FIXTURE_TRIALS,plan,rivalPlan);}
function forecast(a,b,n=FIXTURE_TRIALS){return verdict(a,b,0,Math.max(1,Math.min(n,FIXTURE_TRIALS))).modelEdge;}
function validXI(ids){if(!Array.isArray(ids)||ids.length!==11||new Set(ids).size!==11)return null;const xs=ids.map(x=>byId.get(x));return xs.every(Boolean)?xs:null;}
function season(ids,plan={}){const us=validXI(ids);if(!us)throw Error('Invalid XI');let wins=0,losses=0,diff=0,runTotal=0;
 for(let i=0;i<20;i++){const op=randomOpp(fixtureCountries[i%10]),m=simMatch(us,op,i,plan);if(m.winner==='a')wins++;else losses++;diff+=m.aRuns-m.bRuns;runTotal+=m.aRuns;}
 return {wins,losses,diff,runTotal,mode:'skill-first',oppositionVersion:OPPONENT_VERSION};
}
module.exports={byId,rosters,simMatch,simInnings:buildInnings,forecast,season,validXI,randomOpp,recordMetrics,legends,OPPONENT_VERSION,ability,fixedRng,trial,fixtureCountries,cleanPlan};
