'use strict';
/* Automated source-aware cricket identities and, when configured, Statsguru
 * career data via API.SH. Cricsheet people registry licensed ODC-BY 1.0:
 * https://cricsheet.org/register/ . No guessed player IDs or statistics.
 */
const fs=require('node:fs'),path=require('node:path');
const ROOT=__dirname;
const read=(f)=>JSON.parse(fs.readFileSync(path.join(ROOT,f),'utf8'));
const today=()=>new Date().toISOString().slice(0,10);
function csv(text){
 const rows=[];let fields=[],cur='',quotes=false;
 for(let i=0;i<text.length;i++){const c=text[i];
  if(c==='"'){if(quotes&&text[i+1]==='"'){cur+='"';i++;}else quotes=!quotes;}
  else if(c===','&&!quotes){fields.push(cur);cur='';}
  else if((c==='\n'||c==='\r')&&!quotes){if(c==='\r'&&text[i+1]==='\n')i++;fields.push(cur);cur='';if(fields.some(v=>v.trim()))rows.push(fields);fields=[];}
  else cur+=c;
 }
 if(fields.length||cur){fields.push(cur);rows.push(fields);}
 const [head,...rest]=rows;
 if(!head||!head.includes('identifier'))throw Error('Unknown registry format');
 return rest.map(row=>Object.fromEntries(head.map((k,i)=>[k.trim(),(row[i]||'').trim()])));
}
const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
function link(roster,people,names){
 const bySheet=new Map(people.map(p=>[p.identifier,p]));
 const candidates=new Map();
 function add(name,id){
  const k=norm(name);if(!k||!/^\d{2,9}$/.test(String(id||'')))return;
  if(!candidates.has(k))candidates.set(k,new Set());candidates.get(k).add(String(id));
 }
 for(const p of people){add(p.name,p.key_cricinfo);add(p.unique_name,p.key_cricinfo);}
 for(const n of names){const p=bySheet.get(n.identifier);if(p)add(n.name,p.key_cricinfo);}
 const linked=new Map(),skipped=[];
 for(const p of roster){
  const known=String(p.cricinfo?.id||'');
  if(/^\d{2,9}$/.test(known)){linked.set(p.id,known);continue;}
  const name=norm(p.name),parts=name.split(' ');
  let found=candidates.get(name)||new Set();
  if(found.size!==1&&parts.length===2&&parts[0].length>1)found=candidates.get(parts[0][0]+' '+parts[1])||new Set();
  if(found.size===1)linked.set(p.id,[...found][0]);
  else skipped.push(p.id);
 }
 // Prevent the same ESPN ID being assigned to two different game players.
 const used=new Map();
 for(const [id,espn] of linked){if(used.has(espn)){linked.delete(id);linked.delete(used.get(espn));skipped.push(id);}else used.set(espn,id);}
 return {linked,skipped};
}
function n(x,min,max){
 if(x==null||x===''||x==='—'||x==='-'||x==='*')return null;
 const v=Number(String(x).replace(/,/g,''));return Number.isFinite(v)&&v>=min&&v<=max?v:null;
}
function summary(json,kind){
 const list=[];const seen=new WeakSet();
 function visit(o,depth=0,key=''){
  if(!o||typeof o!=='object'||depth>7||seen.has(o))return;
  seen.add(o);if(Array.isArray(o)){for(const v of o.slice(0,30))visit(v,depth+1,key);return;}
  const low=Object.fromEntries(Object.entries(o).map(([k,v])=>[k.toLowerCase().replace(/[\s_-]/g,''),v]));
  const bat=['battingaverage','batavg','average','avg','strikerate','runs'];
  const bowl=['bowlingaverage','bowlavg','economy','economyrate','wickets'];
  const keys=kind==='batting'?bat:bowl;
  const count=keys.filter(x=>low[x]!=null).length;
  if(count>=2)list.push({o:low,rank:count+(/^(overall|career|total|summary)$/i.test(key)?10:0)});
  for(const [k,v] of Object.entries(o))if(k!=='raw'&&k!=='html'&&k!=='headers')visit(v,depth+1,k);
 }
 visit(json);list.sort((a,b)=>b.rank-a.rank);
 function val(o,keys,lo,hi){for(const k of keys){const v=n(o[k],lo,hi);if(v!=null)return v;}return null;}
 for(const {o} of list){
  const m=val(o,['matches','mat','m'],1,6000);
  if(kind==='batting'){
   const avg=val(o,['battingaverage','batavg','average','avg'],0,200),
     sr=val(o,['strikerate','battingstrikerate','sr'],0,500),
     runs=val(o,['runs','totalruns'],0,100000);
   if(avg!=null||sr!=null)return {m,runs,avg,sr};
  }else{
   const ba=val(o,['bowlingaverage','bowlavg','average','avg'],0,200),
     eco=val(o,['economy','economyrate','eco','econ'],0,25),
     wk=val(o,['wickets','wkts','wk'],0,10000);
   if(ba!=null||eco!=null)return {m,wk,ba,eco};
  }
 }
 return null;
}
async function load(url,opts={}){
 const c=new AbortController(),timer=setTimeout(()=>c.abort(),120000);
 try{const r=await fetch(url,{...opts,signal:c.signal});if(!r.ok)throw Error('HTTP '+r.status+' for '+new URL(url).host);return r;}finally{clearTimeout(timer);}
}
async function pullStats(id,format,kind,key){
 const url=new URL('https://api.api.sh/espncricinfo/v1/player/stats');
 for(const [k,v] of Object.entries({id,format:format.toLowerCase(),type:kind,view:'summary'}))url.searchParams.set(k,v);
 const json=await (await load(url,{headers:{'x-api-key':key}})).json();
 if(json.success===false)throw Error('Provider returned unsuccessful response');
 const data=summary(json,kind);if(!data)throw Error('Unknown summary shape; not using unverified numbers');
 return data;
}
function formatOf(p){return p.start>=2005?'T20I':p.start>=1971?'ODI':'Test';}
function write(players,map){
 const htmlPath=path.join(ROOT,'index.html'),html=fs.readFileSync(htmlPath,'utf8');
 const pattern=/^const PL=\[[^\n]*\];$/m;
 if(!pattern.test(html))throw Error('Embedded game roster not found');
 const newHTML=html.replace(pattern,'const PL='+JSON.stringify(players)+';');
 fs.writeFileSync(path.join(ROOT,'player-data.json'),JSON.stringify(players,null,2)+'\n');
 fs.writeFileSync(path.join(ROOT,'cricinfo-id-map.json'),JSON.stringify(Object.fromEntries([...map].sort(([a],[b])=>a.localeCompare(b))),null,2)+'\n');
 fs.writeFileSync(htmlPath,newHTML);
}
async function main(){
 const players=read('player-data.json'),ids=new Map(Object.entries(read('cricinfo-id-map.json')));
 const [pRaw,nRaw]=await Promise.all([
  load('https://cricsheet.org/register/people.csv').then(r=>r.text()),
  load('https://cricsheet.org/register/names.csv').then(r=>r.text())]);
 const {linked,skipped}=link(players,csv(pRaw),csv(nRaw));let added=0;
 for(const p of players){const id=linked.get(p.id);if(!id)continue;
  if(!p.cricinfo){p.cricinfo={id,formats:{}};added++;}
  else if(!p.cricinfo.id){p.cricinfo.id=id;added++;}
  if(!p.cricinfo.formats)p.cricinfo.formats={};
  ids.set(p.id,String(p.cricinfo.id));
 }
 const key=(process.env.APISH_KEY||'').trim();
 let calls=0,updated=0,failed=0;
 if(key&&!process.argv.includes('--identities')){
  const limit=Math.min(100,Math.max(0,Number(process.env.CRICINFO_MAX_CALLS||20)));
  const queue=players.filter(p=>p.cricinfo?.id).filter(p=>!p.cricinfo.formats?.[formatOf(p)]?.asOf)
   .sort((a,b)=>(Boolean(b.avg!=null||b.ba!=null)-Boolean(a.avg!=null||a.ba!=null)));
  for(const p of queue){
   if(calls+2>limit)break;
   const format=formatOf(p),row={m:null,runs:null,avg:null,sr:null,wk:null,ba:null,eco:null};let worked=0;
   for(const kind of ['batting','bowling']){
    calls++;try{Object.assign(row,await pullStats(p.cricinfo.id,format,kind,key));worked++;}
    catch(e){failed++;console.error(p.id+' '+kind+': '+e.message);}
   }
   if(worked&&[row.avg,row.sr,row.ba,row.eco].some(x=>x!=null)){p.cricinfo.formats[format]={...row,asOf:today()};updated++;}
  }
 }
 write(players,ids);
 console.log(JSON.stringify({roster:players.length,mapped:linked.size,added,unmatched:skipped.length,apiConfigured:!!key,apiCalls:calls,statsUpdated:updated,errors:failed}));
}
if(require.main===module)main().catch(e=>{console.error('SYNC FAILED: '+e.message);process.exitCode=1;});
module.exports={csv,norm,link,summary,formatOf};
