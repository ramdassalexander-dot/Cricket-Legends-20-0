'use strict';
// Cricket Legends V12 — competitive seasons with fixed matched scenarios.
// Same XI and fixture yields the same 20 outcomes, eliminating retry-to-get-lucky rankings.
const players=require('./player-data.json'),rosters=require('./era-rosters.json'),legends=require('./legends-xi.json');
const byId=new Map(players.map(p=>[p.id,p]));
const fixtureCountries=['India','Australia','England','Pakistan','West Indies','South Africa','New Zealand','Sri Lanka','Afghanistan','Bangladesh'];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function recordMetrics(p){
 const baseBat={O:72,B:70,W:63,A:61,P:42,S:40}[p.role]||55;
 const baseBowl={O:23,B:23,W:23,A:62,P:73,S:73}[p.role]||40;
 let bat=p.avg!=null?clamp(22+p.avg*1.24,38,100):p.sr!=null?clamp(54+(p.sr-100)*.44,40,98):baseBat;
 let bowl=p.ba!=null?clamp(122-p.ba*1.35,38,98):baseBowl;
 return {bat:Math.round(clamp(bat,35,100)),bowl:Math.round(clamp(bowl,18,100))};
}
function battingSkill(p){const q=recordMetrics(p);return clamp((q.bat-55)/75,-.18,.43);}
function bowlingSkill(p){const q=recordMetrics(p);return clamp((q.bowl-55)/150,-.15,.32);}
function selectBowlers(xs){let ranked=xs.map((p,i)=>({p,i,s:recordMetrics(p).bowl+(p.role==='P'||p.role==='S'?35:p.role==='A'?22:0)}));ranked.sort((a,b)=>b.s-a.s);return ranked.slice(0,5).map(x=>x.p);}
function fixedRng(text){let h=2166136261;for(let i=0;i<text.length;i++){h=Math.imul(h^text.charCodeAt(i),16777619)>>>0;}return function(){h=(h+0x6D2B79F5)>>>0;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
const OPPONENT_VERSION='all-time-legends-v13';
const FIXTURE_TRIALS=21, OUTLOOK_TRIALS=41;
function simInnings(batting,bowling,target=null,rng=Math.random){
 const bat=batting.map(p=>({id:p.id,name:p.name,team:p.nation,r:0,b:0,fours:0,sixes:0,out:'did not bat',notOut:false}));
 const b5=selectBowlers(bowling);const bowl=b5.map(p=>({id:p.id,name:p.name,balls:0,runs:0,w:0,m:0,overRuns:0}));
 let on=0,off=1,following=2,score=0,wickets=0,balls=0,extras=0,fall=[],finished=false,lastBowler=-1;
 bat[0].out='not out';bat[1].out='not out';
 const probs=[.327,.342,.125,.011,.151,.044]; // [0,1,2,3,4,6] outcomes, adjusted for batter/bowler skill below.
 for(let over=0;over<20&&!finished;over++){
  let bowler=over%5;
  if(bowler===lastBowler)bowler=(bowler+1)%5;
  lastBowler=bowler;let br=bowl[bowler],overStart=br.runs;
  for(let ball=0;ball<6;ball++){
   if(wickets>=10||target!==null&&score>=target){finished=true;break;}
   const ba=bat[on],bowp=b5[bowler];const bskill=battingSkill(batting[on]),oskill=bowlingSkill(bowp);
   br.balls++;balls++;ba.b++;
   const req=target===null?0:Math.max(0,(target-score)/(Math.max(1,120-balls))*6);
    const aggression=clamp((over<6?.04:over>=16?.17:.015)+(req? (req-8)*.055:0)-(wickets>=6?.12:0),-.22,.42);
    const dismissalChance=clamp(.047-bskill*.032+oskill*.065+aggression*.038+(wickets>=8?.018:0),.012,.15);
   const die=rng();
   if(die<dismissalChance){
    wickets++;br.w++;ba.out=[`b ${bowp.name}`,`c ${bowling[Math.floor(rng()*bowling.length)].name} b ${bowp.name}`,`lbw b ${bowp.name}`][Math.floor(rng()*3)];
    fall.push(`${score}/${wickets} (${ba.name}, ${Math.floor(balls/6)}.${balls%6})`);
    if(following<11){on=following++;bat[on].out='not out';}else{finished=true;}continue;
   }
   if(die<dismissalChance+.023){extras++;score++; // leg bye on a legal ball; not charged to the bowler
    [on,off]=[off,on];continue;
   }
   let r,amount=rng(),boost=bskill-oskill;
   // Favor singles for weaker batters; boundaries for technically strong batters.
   let weights=[.35-boost*.17-aggression*.24,.345-boost*.11-aggression*.16,.13,.012,.125+boost*.19+aggression*.27,.038+boost*.12+aggression*.18];weights=weights.map(v=>Math.max(.006,v));
   const sum=weights.reduce((a,b)=>a+b,0);amount*=sum;
   r=0;for(let i=0;i<weights.length;i++){amount-=weights[i];if(amount<=0){r=[0,1,2,3,4,6][i];break;}}
   ba.r+=r;score+=r;br.runs+=r;if(r===4)ba.fours++;if(r===6)ba.sixes++;
   if(r%2){[on,off]=[off,on];}
   if(target!==null&&score>=target){finished=true;break;}
  }
  if(br.runs===overStart&&br.balls>=6)br.m++;
  if(!finished)[on,off]=[off,on];
 }
 return {bat,bowl:bowl.map(x=>({id:x.id,name:x.name,balls:x.balls,r:x.runs,w:x.w,m:x.m})),total:score,wickets,balls,extras,fall,target,nb:0};
}
function randomOpp(country){
 const ids=legends[country];if(!Array.isArray(ids)||ids.length!==11)throw Error(`Missing Legends XI for ${country}`);
 const xi=ids.map(id=>byId.get(id));if(xi.some(p=>!p||p.nation!==country))throw Error(`Invalid Legends XI for ${country}`);
 return xi;
}

function trial(a,b,ix,k){
 const rng=fixedRng('CL2026|strategy|'+ix+'|'+k),firstSide=ix%2===0?'a':'b';
 const first=simInnings(firstSide==='a'?a:b,firstSide==='a'?b:a,null,rng);
 const second=simInnings(firstSide==='a'?b:a,firstSide==='a'?a:b,first.total+1,rng);
 const aRuns=firstSide==='a'?first.total:second.total,bRuns=firstSide==='a'?second.total:first.total;
 const winner=aRuns===bRuns?'TIE':aRuns>bRuns?'a':'b';
 return {first,second,firstSide,aRuns,bRuns,winner,margin:aRuns-bRuns};
}
function verdict(a,b,ix,n=FIXTURE_TRIALS){
 let wins=0,ties=0;const trials=[];
 for(let k=0;k<n;k++){const x=trial(a,b,ix,k);trials.push(x);if(x.winner==='a')wins++;else if(x.winner==='TIE')ties++;}
 const win=wins>Math.floor(n/2),matching=trials.filter(x=>(x.winner==='a')===win);
 const candidates=matching.length?matching:trials;
 const margins=candidates.map(x=>x.margin).sort((x,y)=>x-y),median=margins[Math.floor(margins.length/2)];
 const best=candidates.reduce((p,x)=>Math.abs(x.margin-median)<Math.abs(p.margin-median)?x:p,candidates[0]);
 return {...best,scenarioWins:wins,scenarioTotal:n,modelEdge:Math.round((wins+ties*.5)/n*100)};
}
function simMatch(a,b,ix=0){return verdict(a,b,ix,FIXTURE_TRIALS);}
function forecast(a,b,n=OUTLOOK_TRIALS){return verdict(a,b,0,Math.max(1,Math.min(n,OUTLOOK_TRIALS))).modelEdge;}
function validXI(ids){if(!Array.isArray(ids)||ids.length!==11||new Set(ids).size!==11)return null;const xs=ids.map(x=>byId.get(x));return xs.every(Boolean)?xs:null;}
function season(ids){const us=validXI(ids);if(!us)throw Error('Invalid XI');let wins=0,losses=0,diff=0,runTotal=0;
 for(let i=0;i<20;i++){const op=randomOpp(fixtureCountries[i%10]);const m=simMatch(us,op,i);if(m.winner==='a')wins++;else losses++;diff+=m.aRuns-m.bRuns;runTotal+=m.aRuns;}
 return {wins,losses,diff,runTotal,mode:'skill-first',oppositionVersion:OPPONENT_VERSION};
}
module.exports={byId,rosters,simMatch,simInnings,forecast,season,validXI,randomOpp,recordMetrics,legends,OPPONENT_VERSION};
