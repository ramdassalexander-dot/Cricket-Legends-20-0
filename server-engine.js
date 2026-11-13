'use strict';
// Server-authoritative fantasy simulator: inspired by Perera (2015), chapter 3.
// Not a reproduction of its fitted empirical-Bayes parameters. Historical figures
// are those in player-data.json; neutral role priors are game mechanics, not facts.
const players=require('./player-data.json');const rosters=require('./era-rosters.json');
const byId=new Map(players.map(p=>[p.id,p]));
const fixtureCountries=['India','Australia','England','Pakistan','West Indies','South Africa','New Zealand','Sri Lanka','Afghanistan','Bangladesh'];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function metrics(p){const batPrior={O:71,B:69,W:64,A:60,P:38,S:38}[p.role]||54;const bowlPrior={O:22,B:22,W:22,A:61,P:74,S:75}[p.role]||30;
return {bat:p.avg!=null?clamp(25+p.avg*1.1,30,99):p.sr!=null?clamp(42+p.sr*.24,30,95):batPrior,
bowl:p.ba!=null?clamp(120-p.ba*1.34,25,99):bowlPrior};}
function bowlingXI(xs){return xs.slice().sort((a,b)=>(metrics(b).bowl+(b.role==='P'||b.role==='S'?27:b.role==='A'?14:0))-(metrics(a).bowl+(a.role==='P'||a.role==='S'?27:a.role==='A'?14:0))).slice(0,5);}
function choose(weights){const total=weights.reduce((a,b)=>a+b,0);let x=Math.random()*total;for(let i=0;i<weights.length;i++){x-=weights[i];if(x<=0)return i;}return weights.length-1;}
function simInnings(batting,bowling,target=null){
 const bat=batting.map(p=>({id:p.id,name:p.name,team:p.nation,r:0,b:0,fours:0,sixes:0,out:'did not bat'}));
 const bs=bowlingXI(bowling);const bowl=bs.map(p=>({id:p.id,name:p.name,balls:0,r:0,w:0,m:0}));
 let on=0,off=1,following=2,score=0,wickets=0,balls=0,extras=0,last=-1,finished=false;
 const fall=[];bat[0].out=bat[1].out='not out';
 for(let over=0;over<20&&!finished;over++){
  let b=over%5;if(b===last)b=(b+1)%5;last=b;
  const bp=bs[b],bow=bowl[b],overR=bow.r;
  for(let k=0;k<6;k++){
   if(wickets>=10||(target!=null&&score>=target)){finished=true;break;}
   const batter=bat[on],m=metrics(batting[on]),n=metrics(bp), batPower=clamp((m.bat-55)/75,-.18,.43),bowlPower=clamp((n.bowl-55)/150,-.15,.32);
   const need=target!=null?Math.max(0,(target-score)*6/Math.max(1,120-balls)):0;
   const ag=clamp((over<6?.04:over>=16?.17:.015)+(need?(need-8)*.055:0)-(wickets>=6?.12:0),-.22,.42);
   const out=clamp(.047-batPower*.032+bowlPower*.065+ag*.038+(wickets>=8?.018:0),.012,.15);
   bow.balls++;batter.b++;balls++;
   if(Math.random()<out){wickets++;bow.w++;batter.out=['b ','c fielder b ','lbw b '][Math.floor(Math.random()*3)]+bp.name;fall.push(`${score}/${wickets} (${batter.name}, ${Math.floor(balls/6)}.${balls%6})`);if(following<11)bat[on=following++].out='not out';else finished=true;continue;}
   if(Math.random()<.023){extras++;score++;[on,off]=[off,on];continue;}
   const boost=batPower-bowlPower;const outcomes=[0,1,2,3,4,6];
   const weights=[.35-boost*.17-ag*.24,.345-boost*.11-ag*.16,.13,.012,.125+boost*.19+ag*.27,.038+boost*.12+ag*.18].map(w=>Math.max(.006,w));
   const run=outcomes[choose(weights)];score+=run;batter.r+=run;bow.r+=run;if(run===4)batter.fours++;if(run===6)batter.sixes++;
   if(run%2)[on,off]=[off,on];if(target!=null&&score>=target){finished=true;break;}
  }
  if(bow.r===overR&&bow.balls>=6)bow.m++;
  if(!finished)[on,off]=[off,on];
 }
 return {bat,bowl,total:score,wickets,balls,extras,fall,target};
}
function simMatch(a,b){const firstSide=Math.random()<.5?'a':'b';const first=simInnings(firstSide==='a'?a:b,firstSide==='a'?b:a);const second=simInnings(firstSide==='a'?b:a,firstSide==='a'?a:b,first.total+1);const aRuns=firstSide==='a'?first.total:second.total,bRuns=firstSide==='a'?second.total:first.total;return {first,second,firstSide,aRuns,bRuns,winner:aRuns===bRuns?'TIE':aRuns>bRuns?'a':'b'};}
function forecast(a,b,n=90){let wins=0,ties=0;for(let i=0;i<n;i++){const m=simMatch(a,b);if(m.winner==='a')wins++;else if(m.winner==='TIE')ties++;}return Math.round((wins+.5*ties+1)/(n+2)*100);}
function randomOpp(country){const eras=rosters[country]||{};const base=eras['2020']||eras['2010']||Object.values(eras).at(-1)||[];return base.slice(0,11).map(id=>byId.get(id)).filter(Boolean);}
function validXI(ids){if(!Array.isArray(ids)||ids.length!==11||new Set(ids).size!==11)return null;const xs=ids.map(x=>byId.get(x));return xs.every(Boolean)?xs:null;}
function season(ids){const us=validXI(ids);if(!us)throw Error('Invalid XI');let wins=0,losses=0,diff=0,runTotal=0;for(let i=0;i<20;i++){
  const country=fixtureCountries[i%10],op=randomOpp(country),m=simMatch(us,op);if(m.winner==='a')wins++;else losses++;diff+=m.aRuns-m.bRuns;runTotal+=m.aRuns;
 }return {wins,losses,diff,runTotal};}
module.exports={byId,rosters,simMatch,simInnings,forecast,season,validXI,randomOpp};
