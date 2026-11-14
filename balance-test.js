'use strict';
/** V21 offline calibration: repeatable, CPU-only; not used to modify match outcomes. */
const engine=require('./server-engine');
const xs=[...engine.byId.values()];const ab=engine.ability;
const score=p=>{const a=ab.profile(p);return a.bat.overall*.51+a.bowl.overall*.43+(a.bowl.overall>=70?4:0)};
function sample(rng,elite=false){
 const picked=[],taken=new Set();
 const pools=elite?[[...xs.filter(p=>p.role==='W')].sort((a,b)=>score(b)-score(a)),[...xs.filter(p=>ab.profile(p).bat.overall>=75)].sort((a,b)=>score(b)-score(a)),[...xs.filter(p=>ab.profile(p).bowl.overall>=78)].sort((a,b)=>score(b)-score(a))]:[xs.filter(p=>p.role==='W'),xs,xs];
 for(const [need,num] of [[pools[0],1],[pools[1],5],[pools[2],5]]){let x=0;while(x<num){const cap=elite?Math.min(26,need.length):need.length;const p=need[Math.floor(rng()*cap)];if(p&&!taken.has(p.id)){picked.push(p);taken.add(p.id);x++;}}}
 return picked;
}
const rng=engine.fixedRng('V21-balancing-audit-2026-11-14');let all=[],elite=[],x20=0,t0=Date.now();
for(let i=0;i<500;i++){const ids=sample(rng,i>=400).map(p=>p.id),plan={batting:['anchor','balanced','attack'][Math.floor(rng()*3)],bowling:['attack','balanced','contain'][Math.floor(rng()*3)],focus:['pace','balanced','spin'][Math.floor(rng()*3)]};const out=engine.season(ids,plan);(i>=400?elite:all).push(out.wins);if(out.wins===20)x20++;}
const stats=a=>({teams:a.length,min:Math.min(...a),max:Math.max(...a),mean:+(a.reduce((s,v)=>s+v,0)/a.length).toFixed(2),count20:a.filter(v=>v===20).length});
const result={random:stats(all),elite:stats(elite),perfectTotal:x20,elapsedSeconds:+((Date.now()-t0)/1000).toFixed(1)};
console.log('CALIBRATION',JSON.stringify(result));
