'use strict';
/* Country draw safeguards for Cricket Legends 20–0.
 * Preserve nation/decade roster odds, but prevent frustrating country streaks.
 * Each eligible nation/decade pair starts with weight 1. Nations drawn earlier
 * in the same draft are less likely to reappear and the last four nations
 * cannot recur on an ordinary spin when alternatives exist.
 */
const CricketDraftRoller=(()=>{
  const COOLDOWN=4;
  const REPEAT_WEIGHT=.30;
  function historyOf(history){return Array.isArray(history)?history.filter(x=>typeof x==='string'&&x.length>0).slice(-36):[];}
  function remember(history,country){return [...historyOf(history),country].slice(-36);}
  function pick(options,history=[],rng=Math.random){
    if(!Array.isArray(options)||!options.length)return null;
    const past=historyOf(history);
    // Rerolls with a limited era roster may need to release the oldest lock.
    let choices=[];
    for(let n=Math.min(COOLDOWN,past.length);n>=0;n--){
      const cooling=new Set(n?past.slice(-n):[]);
      choices=options.filter(x=>x&&x.country&&!cooling.has(x.country));
      if(choices.length)break;
    }
    if(!choices.length)return null;
    const counts=new Map();for(const country of past)counts.set(country,(counts.get(country)||0)+1);
    const weights=choices.map(x=>Math.pow(REPEAT_WEIGHT,Math.min(3,counts.get(x.country)||0)));
    const total=weights.reduce((a,b)=>a+b,0);
    // Use the supplied PRNG so the selection policy is independently testable.
    let draw=Math.max(0,Math.min(.999999999999,Number(rng())||0))*total;
    for(let i=0;i<choices.length;i++){draw-=weights[i];if(draw<0)return choices[i];}
    return choices[choices.length-1];
  }
  return Object.freeze({COOLDOWN,REPEAT_WEIGHT,remember,pick});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CricketDraftRoller;
function applyCountryDraw(pick,rememberCountry=true){
 const order=[...ERA_ROSTERS[pick.country][String(pick.era)]];
 for(let i=order.length-1;i>0;i--){const j=rnd(0,i);[order[i],order[j]]=[order[j],order[i]];}
 state.draw={...pick,order};state.page=0;
 if(rememberCountry)state.spinHistory=CricketDraftRoller.remember(state.spinHistory,pick.country);
}
