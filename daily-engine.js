'use strict';
/** Daily pool is generated server-side from existing source-labelled player snapshots.
 * Same UTC date produces the same pool regardless of device or reload.
 */
const engine=require('./server-engine');
const categories=[['W',3],['A',5],['O',4],['B',4],['P',5],['S',3]];
function isoDate(d=new Date()){return d.toISOString().slice(0,10);}
function validDay(day){return typeof day==='string'&&/^\d{4}-\d\d-\d\d$/.test(day)&&new Date(day+'T00:00:00Z').toISOString().slice(0,10)===day;}
function shuffle(list,seed){const a=list.slice(),rng=engine.fixedRng(seed);for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function dailyPool(day=isoDate()){
 if(!validDay(day))throw Error('Invalid UTC challenge date');
 const pool=[];
 for(const [role,num] of categories){const candidates=[...engine.byId.values()].filter(p=>p.role===role&&(p.avg!=null||p.ba!=null||p.sr!=null));
  pool.push(...shuffle(candidates,`CL-v21|daily|${day}|${role}`).slice(0,num));
 }
 return shuffle(pool,`CL-v21|daily|${day}|final`);
}
function info(p){const a=engine.ability.profile(p);return {id:p.id,name:p.name,nation:p.nation,role:p.role,fmt:a.fmt,bat:a.bat.overall,bowl:a.bowl.overall,sourceConfidence:a.confidence};}
function table(rows){return rows.slice().sort((a,b)=>b.wins-a.wins||b.diff-a.diff||b.runTotal-a.runTotal||a.at.localeCompare(b.at));}
module.exports={isoDate,validDay,dailyPool,info,table};
