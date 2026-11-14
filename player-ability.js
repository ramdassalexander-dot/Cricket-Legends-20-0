'use strict';
/* Cricket Legends V15 — transparent FANTASY T20 ability model.
 * Sources: player-data.json historical career snapshots (not complete T20 data).
 * All ratings without phase-by-phase records are estimated game design, not official statistics.
 * This exact module is embedded into standalone HTML and required by the server.
 */
const CricketAbilityV15=(()=>{
 const VERSION='all-time-legends-v21-dual-quality';
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const round=n=>Math.round(clamp(n,25,99));
 const terrain=['balanced','seam','turn','flat','seam','balanced','flat','turn','balanced','turn'];
 const context=ix=>{const n=((Number(ix)||0)%20+20)%20;return {fixture:n,surface:terrain[(n+(n>=10?3:0))%terrain.length]};};
 const patterns={
  O:{bat:70,bowl:27,aggression:69,survival:63,powerplay:8,middle:0,death:-4},
  B:{bat:70,bowl:28,aggression:60,survival:72,powerplay:0,middle:5,death:0},
  W:{bat:68,bowl:23,aggression:65,survival:67,powerplay:2,middle:2,death:4},
  A:{bat:70,bowl:72,aggression:65,survival:67,powerplay:0,middle:3,death:6},
  P:{bat:37,bowl:72,aggression:48,survival:40,powerplay:-8,middle:-4,death:-4},
  S:{bat:39,bowl:72,aggression:48,survival:42,powerplay:-7,middle:-4,death:-3}
 };
 // Small, human-curated fantasy playing-style labels. Not asserted to be verified phase statistics.
 // An unlisted player receives a consistent, role-and-record-based neutral profile.
 const curated={
  'don-bradman':{survival:13,middle:7,aggression:-6},
  'viv-richards':{aggression:15,powerplay:8,death:7,pace:7},
  'virender-sehwag':{aggression:16,powerplay:14,survival:-6,pace:7},
  'chris-gayle':{aggression:18,powerplay:12,death:7,pace:5},
  'brendon-mccullum':{aggression:16,powerplay:12,death:5},
  'adam-gilchrist':{aggression:14,powerplay:11,pace:6},
  'jos-buttler':{aggression:13,powerplay:11,death:12,pace:5},
  'rohit-sharma':{aggression:10,powerplay:9,death:7},
  'travis-head':{aggression:16,powerplay:13},
  'quinton-de-kock':{aggression:12,powerplay:10},
  'virat-kohli':{survival:12,middle:13,death:6,aggression:1},
  'rahul-dravid':{survival:13,aggression:-12,death:-9},
  'kane-williamson':{survival:10,middle:11,aggression:-5},
  'steve-smith':{survival:11,middle:10,aggression:-6},
  'babar-azam':{survival:10,middle:10,aggression:-5},
  'suryakumar-yadav':{aggression:17,middle:11,death:11,spin:8},
  'ab-de-villiers':{aggression:17,death:16,middle:8,pace:6,spin:6},
  'andre-russell':{aggression:19,death:17,survival:-7,deathBowl:7,paceBowler:true},
  'ms-dhoni':{death:17,survival:9,aggression:5},
  'michael-bevan':{death:12,survival:11,aggression:-3},
  'shakib-al-hasan':{middle:7,spin:7,control:7,middleBowl:8,spinBowler:true},
  'jacques-kallis':{powerplay:8,middle:7,survival:10,paceBowler:true},
  'shane-watson':{powerplay:13,aggression:11,paceBowler:true,powerplayBowl:6},
  'shahid-afridi':{aggression:15,death:9,spinBowler:true,control:7,middleBowl:9},
  'ravindra-jadeja':{spinBowler:true,control:9,middleBowl:8},
  'glenn-maxwell':{spinBowler:true,aggression:17,middle:10,death:11},
  'mitchell-santner':{spinBowler:true,control:8,middleBowl:8},
  'imran-khan':{paceBowler:true,strike:9,powerplayBowl:6},
  'chris-cairns':{paceBowler:true,death:7,powerplayBowl:5},
  'hardik-pandya':{paceBowler:true,death:11,aggression:10,deathBowl:5},
  'mohammad-hafeez':{powerplay:11,middle:7,spinBowler:true},
  'kieron-pollard':{death:14,aggression:12},
  'dwayne-bravo':{deathBowl:14,control:7,paceBowler:true},
  'mohammad-nabi':{spinBowler:true,control:8,middleBowl:8},
  'ben-stokes':{paceBowler:true,death:9,survival:8,deathBowl:4},
  'kapil-dev':{aggression:10,death:8,powerplayBowl:7,paceBowler:true},
  'sunil-narine':{control:16,middleBowl:15,powerplayBowl:9,strike:4,spinBowler:true},
  'rashid-khan':{strike:16,middleBowl:15,deathBowl:8,control:9,spinBowler:true},
  'muttiah-muralitharan':{strike:14,middleBowl:14,control:9,spinBowler:true},
  'shane-warne':{strike:14,middleBowl:12,control:7,spinBowler:true},
  'anil-kumble':{strike:10,middleBowl:11,control:7,spinBowler:true},
  'saqlain-mushtaq':{middleBowl:12,control:8,spinBowler:true},
  'ravichandran-ashwin':{middleBowl:11,powerplayBowl:6,control:10,spinBowler:true},
  'jasprit-bumrah':{control:17,deathBowl:16,powerplayBowl:12,strike:11,paceBowler:true},
  'lasith-malinga':{deathBowl:17,strike:13,powerplayBowl:7,paceBowler:true},
  'wasim-akram':{powerplayBowl:15,deathBowl:13,strike:12,paceBowler:true},
  'waqar-younis':{strike:17,deathBowl:13,powerplayBowl:9,paceBowler:true},
  'glenn-mcgrath':{control:16,powerplayBowl:13,strike:9,paceBowler:true},
  'malcolm-marshall':{powerplayBowl:14,strike:16,control:10,paceBowler:true},
  'curtly-ambrose':{control:14,powerplayBowl:12,strike:11,paceBowler:true},
  'joel-garner':{control:16,deathBowl:12,strike:9,paceBowler:true},
  'mitchell-starc':{powerplayBowl:14,deathBowl:12,strike:12,paceBowler:true},
  'shaheen-shah-afridi':{powerplayBowl:15,strike:11,paceBowler:true},
  'trent-boult':{powerplayBowl:15,control:9,paceBowler:true},
  'kagiso-rabada':{strike:13,deathBowl:10,paceBowler:true},
  'dale-steyn':{strike:15,powerplayBowl:12,deathBowl:9,paceBowler:true}
 };
 // Verified historic T20I snapshots, not contemporary projections or invented phase splits.
 // Source pages contain the actual recorded innings and bowling figures.
 const auditedT20I={
  'shane-watson':{fmt:'T20I',m:58,avg:29.24,sr:145.33,ba:24.72,eco:7.65,kind:'pace',source:'https://www.windiescricket.com/players/shane-watson-4722/',span:'2006–2016',position:'top'},
  'jacques-kallis':{fmt:'T20I',m:25,avg:35.05,sr:119.35,ba:27.75,eco:7.23,kind:'pace',source:'https://www.windiescricket.com/players/jacques-kallis-3607/',span:'2005–2012',position:'top'},
  'shahid-afridi':{fmt:'T20I',m:99,avg:17.92,sr:150.16,ba:24.44,eco:6.63,kind:'spin',source:'https://www.windiescricket.com/players/shahid-afridi-4446/',span:'2006–2018',position:'lower'},
  'shakib-al-hasan':{fmt:'T20I',m:129,avg:23.19,sr:121.30,ba:20.91,eco:6.81,kind:'spin',source:'https://www.windiescricket.com/players/shakib-al-hasan-4483/',span:'2006–2024',position:'middle'},
  'andre-russell':{fmt:'T20I',m:86,avg:22.00,sr:163.80,ba:31.45,eco:9.42,kind:'pace',source:'https://www.windiescricket.com/players/andre-russell-4400/',span:'2011–2025',position:'lower'},
  'mohammad-nabi':{fmt:'T20I',m:155,avg:22.20,sr:136.00,ba:28.18,eco:7.43,kind:'spin',source:'https://www.windiescricket.com/players/mohammad-nabi-3936/',span:'2010–2026',position:'middle'},
  'dwayne-bravo':{fmt:'T20I',m:91,avg:22.01,sr:115.03,ba:26.10,eco:8.11,kind:'pace',source:'https://www.windiescricket.com/players/dwayne-bravo-2172/',span:'2006–2021',position:'lower'},
  'kieron-pollard':{fmt:'T20I',m:101,avg:25.30,sr:135.14,ba:28.28,eco:8.32,kind:'medium',source:'https://www.windiescricket.com/players/kieron-pollard-4194/',span:'2008–2022',position:'lower'}
 };
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const fmtNorm=(fmt)=>['Test','ODI','T20I'].includes(fmt)?fmt:'Career';
 function profile(p){
  const role=patterns[p?.role]?p.role:'B',base=patterns[role],style=curated[p?.id]||{};
  const verified=auditedT20I[p?.id]||null;
  const record=verified?{...p,...verified}:p;
  const fmt=fmtNorm(record?.fmt),hasBat=finite(record?.avg),hasSR=finite(record?.sr),hasBowl=finite(record?.ba),hasEco=finite(record?.eco);
  const confidence=verified?'verified historical T20I figures · phase ratings estimated':(hasBat||hasSR||hasBowl)?'record-based fantasy estimate':'incomplete stats · fantasy baseline';
  // Convert DIFFERENT format averages into distinct 0–100 prior scales; Test 50 != T20 50.
  const avgScore=hasBat?clamp(fmt==='Test'?25+record.avg*1.08:fmt==='T20I'?34+record.avg*1.20:fmt==='ODI'?29+record.avg*1.16:25+record.avg*1.07,38,98):null;
  const srScore=hasSR?clamp(fmt==='T20I'?37+(record.sr-100)*.75:fmt==='ODI'?42+(record.sr-70)*.60:43+(record.sr-95)*.60,35,98):null;
  // When only an average is recorded, give base role/era tempo more influence.
  const baseBat=hasBat||hasSR?70:base.bat;
  const averageWeighted=avgScore!=null?baseBat*.12+avgScore*.88:baseBat;
  // Evidence trumps a position label: same stats -> same score, AR/O/B/P regardless of label.
  let batOverall=srScore!=null?averageWeighted*.62+srScore*.38:averageWeighted;
  // Cross-format prior for small T20I samples: 25 T20Is cannot erase 166 Test matches.
  if(verified&&verified.m<30&&finite(p.avg)&&p.fmt==='Test'){const testScore=clamp(25+p.avg*1.08,38,98);batOverall=batOverall*.65+testScore*.35;}
  const temperament=clamp((hasBat?66:base.survival)+(avgScore==null?0:(avgScore-67)*.34)+(style.survival||0),30,98);
  const aggression=clamp((hasSR?65:base.aggression)+(srScore==null?0:(srScore-62)*.70)+(style.aggression||0),25,98);
  const bat={
   overall:round(batOverall+(style.middle||0)*.11+(style.powerplay||0)*.10+(style.death||0)*.10),
   powerplay:round(batOverall+((hasBat&&record.avg>=33)?6:base.powerplay)+(style.powerplay||0)+((aggression-65)*.22)),
   middle:round(batOverall+((hasBat&&record.avg>=30)?5:base.middle)+(style.middle||0)+(temperament-65)*.17),
   death:round(batOverall+base.death+(style.death||0)+(aggression-65)*.36),
   aggression:round(aggression),survival:round(temperament),
   vsPace:round(batOverall+(style.pace||0)),
   vsSpin:round(batOverall+(style.spin||0))
  };
  const bowlAvgScore=hasBowl?clamp(fmt==='T20I'?123-record.ba*2.05:fmt==='Test'?127-record.ba*1.95:fmt==='ODI'?126-record.ba*2.02:123-record.ba*1.85,38,98):null;
  // Format-aware bowling economy contributes independently where verified.
  const economyScore=hasEco?clamp(112-(record.eco-5)*13.5,38,98):null;
  let bowlOverall=bowlAvgScore!=null?72*.12+bowlAvgScore*.88:base.bowl;
  if(economyScore!=null)bowlOverall=bowlOverall*.72+economyScore*.28;
  if(['O','B','W'].includes(role)&&!hasBowl&&!hasEco)bowlOverall=25;
  const kind=verified?.kind||(role==='S'||style.spinBowler?'spin':role==='P'||style.paceBowler?'pace':role==='A'?'medium':'part-time');
  const bowl={
   overall:round(bowlOverall),
   powerplay:round(bowlOverall+(kind==='pace'?7:kind==='spin'?-3:-2)+(style.powerplayBowl||0)),
   middle:round(bowlOverall+(kind==='spin'?9:0)+(style.middleBowl||0)),
   death:round(bowlOverall+(kind==='pace'?3:kind==='spin'?-3:-4)+(style.deathBowl||0)),
   control:round(bowlOverall-1+(style.control||0)+(economyScore==null?0:(economyScore-bowlOverall)*.24)),
   strike:round(bowlOverall+(style.strike||0)),kind
  };
  const specialities=[];
  if(bat.powerplay>=79)specialities.push('POWERPLAY BATTER');
  if(bat.middle>=81)specialities.push('MIDDLE-OVERS BATTER');
  if(bat.death>=80)specialities.push('FINISHER');
  if(bat.survival>=81)specialities.push('WICKET PRESERVATION');
  if(bowl.powerplay>=82)specialities.push('NEW BALL');
  if(bowl.middle>=83)specialities.push('MIDDLE OVERS');
  if(bowl.death>=83)specialities.push('DEATH OVERS');
  if(bowl.control>=83)specialities.push('ECONOMY');
  return {id:p.id,role,fmt,confidence,bat,bowl,specialities,kind,
   record:{format:fmt,average:hasBat?record.avg:null,strikeRate:hasSR?record.sr:null,bowlingAverage:hasBowl?record.ba:null,economy:hasEco?record.eco:null,source:verified?.source||p.source||null,verified:!!verified,span:verified?.span||null}};
 }
 function selectBowlers(xs){
  // Best six willing bowling options; five are sufficient, but a genuine sixth adds flexibility.
  const selected=xs.map((p,i)=>({p,i,a:profile(p)})).filter(x=>x.a.bowl.overall>42).sort((a,b)=>b.a.bowl.overall-a.a.bowl.overall||a.i-b.i).slice(0,6);
  if(selected.length<5){const used=new Set(selected.map(x=>x.i));for(const x of xs.map((p,i)=>({p,i,a:profile(p)})).sort((a,b)=>b.a.bowl.overall-a.a.bowl.overall||a.i-b.i))if(!used.has(x.i)){selected.push(x);used.add(x.i);if(selected.length===5)break;}}
  return selected;
 }
 function phaseFor(over){return over<6?'powerplay':over>=16?'death':'middle';}
 function pickBowler(bowlers,bowlingFigures,over,previous,surface,plan={}){
  const phase=phaseFor(over),remaining=20-over;
  const available=bowlers.map((x,i)=>({x,i,used:bowlingFigures[i].balls/6})).filter(x=>x.used<4&&x.i!==previous);
  const eligible=available.length?available:bowlers.map((x,i)=>({x,i,used:bowlingFigures[i].balls/6})).filter(x=>x.used<4);
  if(!eligible.length)throw Error('No eligible bowler for over '+over);
  eligible.sort((a,b)=>{
   function score(q){const m=q.x.a.bowl,climate=surface==='turn'&&q.x.a.kind==='spin'?6:surface==='seam'&&q.x.a.kind==='pace'?6:0;
    // Reserve specialists for key phases, but ensure all overs can be completed.
    const reserved=phase!=='death'&&m.death>85?Math.max(0,m.death-85)*.60:0;
    const directive=plan.bowling==='attack'?m.strike*.17-m.control*.08:plan.bowling==='contain'?m.control*.20-m.strike*.09:0;
    const focus=plan.focus==='spin'&&q.x.a.kind==='spin'?9:plan.focus==='pace'&&q.x.a.kind==='pace'?9:0;
    return m[phase]*.74+m.control*.16+m.strike*.10+climate-reserved-q.used*3.2+directive+focus;
   }
   return score(b)-score(a)||a.x.i-b.x.i;
  });
  return eligible[0].i;
 }
 function simulateInnings(batting,bowling,target=null,rng=Math.random,settings={}){
  const ctx=typeof settings==='number'?context(settings):settings||{};const surface=ctx.surface||context(ctx.fixture||0).surface;
  const bats=batting.map(p=>({id:p.id,name:p.name,team:p.nation,r:0,b:0,fours:0,sixes:0,out:'did not bat',notOut:false}));
  const batProfiles=batting.map(profile),selected=selectBowlers(bowling);
  const figures=selected.map(x=>({id:x.p.id,name:x.p.name,balls:0,r:0,w:0,m:0}));
  let striker=0,nonStriker=1,next=2,score=0,wickets=0,balls=0,extras=0,last=-1,done=false;
  const fall=[];bats[0].out='not out';bats[1].out='not out';
  for(let over=0;over<20&&!done;over++){
   const bi=pickBowler(selected,figures,over,last,surface,ctx.plan||{});last=bi;
   const bow=selected[bi],bowlProfile=bow.a.bowl,phase=phaseFor(over),fig=figures[bi],runsBefore=fig.r,ballsBefore=fig.balls;
   for(let j=0;j<6;j++){
    if(wickets>=10||(target!=null&&score>=target)){done=true;break;}
    const b=bats[striker],apt=batProfiles[striker].bat;
    const battingAbility=apt[phase]*.55+apt[bow.a.kind==='spin'?'vsSpin':'vsPace']*.27+apt.survival*.18;
    const bowlingAbility=bowlProfile[phase]*.51+bowlProfile.control*.24+bowlProfile.strike*.25;
    const pitch=(surface==='turn'&&bow.a.kind==='spin'?5:surface==='seam'&&bow.a.kind==='pace'?5:surface==='flat'?-4:0);
    const chaseRequired=target==null?0:(target-score)*6/Math.max(1,120-balls);
    const captainRisk=ctx.plan?.batting==='attack'?.105:ctx.plan?.batting==='anchor'?-.075:0;
    const intended=clamp(captainRisk+(phase==='powerplay'?.06:phase==='death'?.17:.025)+Math.max(-.06,(chaseRequired-8)*.024)+((apt.aggression-60)*.0021)-(wickets>=6?.10:0),-.14,.32);
    const wicket=clamp(.050+(bowlingAbility+pitch-battingAbility)*.00065+(bowlProfile.strike-62)*.00024+(60-apt.survival)*.00025+intended*.043+(wickets>=8?.010:0),.011,.147);
    fig.balls++;balls++;b.b++;
    const die=rng();
    if(die<wicket){wickets++;fig.w++;
     const dismissal=Math.floor(rng()*3);
     b.out=dismissal===0?`b ${bow.p.name}`:dismissal===1?`c ${bowling[Math.floor(rng()*bowling.length)].name} b ${bow.p.name}`:`lbw b ${bow.p.name}`;
     fall.push(`${score}/${wickets} (${b.name}, ${Math.floor(balls/6)}.${balls%6})`);
     if(next<11){striker=next++;bats[striker].out='not out';}else done=true;
     continue;
    }
    if(die<wicket+.019){extras++;score++;[striker,nonStriker]=[nonStriker,striker];continue;}
    const edge=clamp((battingAbility-bowlingAbility-pitch)/37,-1.8,1.8);
    const attack=clamp((apt.aggression-60)/36,-1.15,1.15);
    const control=clamp((bowlProfile.control-60)/40,-1.2,1.2);
    let weights=[.345-edge*.052-attack*.045+control*.035-intended*.22,
                 .333-edge*.021-attack*.025,
                 .136,.010,
                 .136+edge*.053+attack*.036-control*.031+intended*.15,
                 .040+edge*.032+attack*.034-control*.023+intended*.11];
    weights=weights.map(x=>Math.max(.006,x));let tick=rng()*weights.reduce((a,b)=>a+b,0),runs=0;
    for(let i=0;i<6;i++){tick-=weights[i];if(tick<=0){runs=[0,1,2,3,4,6][i];break;}}
    b.r+=runs;score+=runs;fig.r+=runs;if(runs===4)b.fours++;if(runs===6)b.sixes++;
    if(runs%2)[striker,nonStriker]=[nonStriker,striker];
    if(target!=null&&score>=target){done=true;break;}
   }
   if(fig.r===runsBefore&&fig.balls-ballsBefore===6)fig.m++;
   if(!done)[striker,nonStriker]=[nonStriker,striker];
  }
  return {bat:bats,bowl:figures,total:score,wickets,balls,extras,fall,target,nb:0,surface,plan:ctx.plan||{}};
 }
 return Object.freeze({VERSION,context,profile,selectBowlers,simulateInnings,phaseFor});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CricketAbilityV15;
