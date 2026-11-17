'use strict';
/* V22: marginal-value draft ranking, completely independent of the player's role label.
 * The fifth strong bowler is valuable; a redundant sixth merely competes
 * with the current weakest member of the best five. No automatic AR bonus.
 * Unverified players cannot acquire elite value simply from their role.
 */
const CricketDraftFitV22=(()=>{
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const quality=a=>a.bat.overall*.62+a.bat.powerplay*.16+a.bat.middle*.12+a.bat.death*.10;
 function rate(player,selected,ability){
  const a=ability.profile(player),existing=selected.map(p=>ability.profile(p));
  const bowls=existing.map(x=>x.bowl.overall).filter(x=>x>=62).sort((x,y)=>y-x);
  const genuineBowler=a.bowl.overall>=62;
  // The player is only compared with existing frontline bowling options.
  const fifthBowler=bowls.length<5?56:bowls[4];
  const replacesBowler=genuineBowler&&a.bowl.overall>fifthBowler;
  const bowlingGain=replacesBowler?clamp((a.bowl.overall-fifthBowler)*.66,0,25):0;
  const enoughBatters=existing.filter(x=>x.bat.overall>=69).length>=6;
  const availableOpeners=existing.filter(x=>x.bat.powerplay>=77).length;
  let points=24+quality(a)*.54+bowlingGain;
  let reason='Batting contribution to your XI';
  if(replacesBowler)reason=bowls.length<5?'Adds an effective frontline bowling option':'Improves the existing top-five bowling attack';
  if(!enoughBatters&&a.bat.overall>=77){points+=4;reason='Adds a proven top-six batting option';}
  if(availableOpeners<2&&a.bat.powerplay>=80){points+=3;reason='Improves powerplay batting';}
  if(!selected.some(p=>p.role==='W')&&player.role==='W'){points+=9;reason='Fills the wicketkeeper position';}
  if(!replacesBowler&&a.bowl.overall>=62&&bowls.length>=5&&a.bat.overall<69){reason='Additional bowler does not improve your current best five';}
  if(!Number.isFinite(player.avg)&&!Number.isFinite(player.ba)&&!a.record.verified){
   reason=reason==='Batting contribution to your XI'?'Limited published statistics; conservative ability estimate':reason;
  }
  return {score:Math.round(clamp(points,20,97)),reason,batting:Math.round(quality(a)),bowling:a.bowl.overall,bowlingGain:Math.round(bowlingGain),replacesBowler};
 }
 return Object.freeze({rate});
})();
if(typeof module!=='undefined'&&module.exports)module.exports=CricketDraftFitV22;
