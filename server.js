'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const engine=require('./server-engine');
const {createStore}=require('./storage');
const daily=require('./daily-engine');
const PORT=Number(process.env.PORT||3000),HOST=process.env.HOST||'0.0.0.0';
const store=createStore();
const clients=new Map(),queue=[],traffic=new Map();
const safeName=s=>String(s||'CricketFan').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,24)||'CricketFan';
const shortId=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{12,64}$/.test(s)?s:null;
const nickname=s=>safeName(s);
const safeClient=body=>shortId(body?.clientId)||crypto.randomUUID();
const currentDay=()=>daily.isoDate();
const errors={invalid:'Draft eleven DIFFERENT registered players.',expired:'Invitation expired or unavailable.'};
function better(a,b){return !b||a.wins>b.wins||a.wins===b.wins&&(a.diff>b.diff||a.diff===b.diff&&a.runTotal>b.runTotal);}
function matchesClient(a,b){return a?.oppositionVersion===b?.oppositionVersion;}
function ranked(xs){return daily.table(xs.filter(x=>x.oppositionVersion===engine.OPPONENT_VERSION));}
function attempts(req){const addr=req.socket.remoteAddress||'unknown',now=Date.now();const next=(traffic.get(addr)||[]).filter(t=>now-t<60000);next.push(now);traffic.set(addr,next);return next.length<=35;}
function json(res,status,obj){const raw=JSON.stringify(obj);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(raw),'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(raw);}
function parse(req){return new Promise((resolve,reject)=>{let str='',finished=false;req.on('data',buf=>{str+=buf;if(str.length>16000&&!finished){finished=true;reject(Error('Request too large'));req.destroy();}});req.on('end',()=>{if(finished)return;try{resolve(JSON.parse(str||'{}'));}catch{reject(Error('Invalid JSON'));}});req.on('error',reject);});}
function key(code){return typeof code==='string'&&/^[A-Za-z0-9_-]{14,24}$/.test(code)?code:null;}
function publicInvite(entry){return {code:entry.code,name:entry.name,createdAt:entry.at,expiresAt:entry.expiresAt,xi:entry.xi.map(id=>{const p=engine.byId.get(id);return {id,name:p.name,nation:p.nation,role:p.role};}),edition:entry.edition};}
function purge(){const now=Date.now();for(const [id,item] of clients)if(now-item.when>15*60*1000)clients.delete(id);for(let i=queue.length-1;i>=0;i--)if(!clients.has(queue[i])||clients.get(queue[i])?.match)queue.splice(i,1);}
function pairIfPossible(){purge();while(queue.length>=2){const a=clients.get(queue.shift()),b=clients.get(queue.shift());if(!a||!b)continue;
 const xi=engine.validXI(a.ids),rival=engine.validXI(b.ids);if(!xi||!rival)continue;
 const m=engine.simMatch(xi,rival,0,a.plan,b.plan),pA=m.modelEdge,winner=m.winner==='a'?a.name:m.winner==='b'?b.name:'TIE';
 const body={...m,aName:a.name,bName:b.name,pA};
 a.match={status:'matched',winnerSide:m.winner,you:{name:a.name,side:'a'},opponent:b.name,winner,match:body};
 b.match={status:'matched',winnerSide:m.winner,you:{name:b.name,side:'b'},opponent:a.name,winner,match:body};
}}
async function handle(req,res){
 if(req.method==='OPTIONS')return json(res,200,{ok:true});
 const u=new URL(req.url,'http://local.cricket');const pathname=u.pathname;
 try{
  if(req.method==='GET'&&pathname==='/api/health')return json(res,200,{ok:true,edition:engine.OPPONENT_VERSION,players:engine.byId.size,persistent:store.durable,storage:store.durable?'postgres':'temporary-local',pendingRivals:queue.length});
  if(req.method==='GET'&&pathname==='/api/players'){const p=engine.byId.get(u.searchParams.get('id'));return p?json(res,200,{player:{id:p.id,name:p.name,nation:p.nation,role:p.role,...engine.ability.profile(p)}}):json(res,404,{error:'Unknown cricketer'});}
  if(req.method==='GET'&&pathname==='/api/leaderboard')return json(res,200,{edition:engine.OPPONENT_VERSION,persistent:store.durable,entries:ranked(await store.list('global')).slice(0,100).map(({name,wins,losses,diff,runTotal,at})=>({name,wins,losses,diff,runTotal,at}))});
  if(req.method==='GET'&&pathname==='/api/daily'){
   const date=currentDay(),pool=daily.dailyPool(date);return json(res,200,{date,edition:engine.OPPONENT_VERSION,persistent:store.durable,pool:pool.map(daily.info),rules:'Pick 11 of these 24 and arrange your batting order. Same players and conditions for everyone. Server scores 20 fixed fixtures.'});
  }
  if(req.method==='GET'&&pathname==='/api/daily/leaderboard'){
   const date=u.searchParams.get('date')||currentDay();if(!daily.validDay(date))return json(res,400,{error:'Bad date'});
   const entries=ranked((await store.list('daily')).filter(x=>x.date===date));return json(res,200,{date,edition:engine.OPPONENT_VERSION,persistent:store.durable,entries:entries.slice(0,100).map(({name,wins,losses,diff,runTotal,at})=>({name,wins,losses,diff,runTotal,at}))});
  }
  if(req.method==='GET'&&pathname==='/api/matchmaking/status'){
   const item=clients.get(u.searchParams.get('ticket'));return json(res,200,item?(item.match||{status:'waiting'}):{status:'expired'});
  }
  const invitePath=pathname.match(/^\/api\/challenges\/([A-Za-z0-9_-]{14,24})$/);
  if(req.method==='GET'&&invitePath){const item=await store.get('challenge',invitePath[1]);if(!item||Date.parse(item.expiresAt)<Date.now()||item.edition!==engine.OPPONENT_VERSION)return json(res,404,{error:errors.expired});return json(res,200,{invite:publicInvite(item),persistent:store.durable});}
  const inviteResults=pathname.match(/^\/api\/challenges\/([A-Za-z0-9_-]{14,24})\/results$/);
  if(req.method==='GET'&&inviteResults){const invite=await store.get('challenge',inviteResults[1]);if(!invite)return json(res,404,{error:errors.expired});const all=await store.list('duel');return json(res,200,{name:invite.name,results:all.filter(x=>x.code===inviteResults[1]).map(({challenger,winner,playedAt,margin})=>({challenger,winner,playedAt,margin})).slice(-50)});}
  if(req.method==='POST'&&pathname.startsWith('/api/')&&!attempts(req))return json(res,429,{error:'Too many requests, please retry later.'});
  if(req.method==='POST'&&pathname==='/api/leaderboard'){
   const x=await parse(req);if(!engine.validXI(x.xi))return json(res,400,{error:errors.invalid});const client=safeClient(x),plan=engine.cleanPlan(x.plan),result=engine.season(x.xi,plan);
   const entry={...result,name:nickname(x.name),at:new Date().toISOString(),client,plan,signature:crypto.createHash('sha256').update(JSON.stringify([x.xi,plan,engine.OPPONENT_VERSION])).digest('hex').slice(0,18)};
   const prev=await store.get('global',client);if(better(entry,prev)||!matchesClient(entry,prev))await store.put('global',client,entry);
   const all=ranked(await store.list('global'));
   return json(res,200,{attempt:entry,rank:all.findIndex(r=>r.client===client)+1,improved:!prev||better(entry,prev),persistent:store.durable});
  }
  if(req.method==='POST'&&pathname==='/api/daily/submit'){
   const x=await parse(req),date=currentDay(),legal=new Set(daily.dailyPool(date).map(p=>p.id));
   if(!engine.validXI(x.xi)||!x.xi.every(id=>legal.has(id)))return json(res,400,{error:'Your eleven must come from today\'s fixed 24-player pool.'});
   const client=safeClient(x),plan=engine.cleanPlan(x.plan),result=engine.season(x.xi,plan),item={...result,date,name:nickname(x.name),client,plan,at:new Date().toISOString()};
   const id=`${date}:${client}`,old=await store.get('daily',id);if(!old||better(item,old))await store.put('daily',id,item);
   const rank=ranked((await store.list('daily')).filter(r=>r.date===date)).findIndex(r=>r.client===client)+1;
   return json(res,200,{attempt:item,rank,firstAttempt:!old,improved:!old||better(item,old),persistent:store.durable});
  }
  if(req.method==='POST'&&pathname==='/api/challenges'){
   const x=await parse(req);if(!engine.validXI(x.xi))return json(res,400,{error:errors.invalid});
   const code=crypto.randomBytes(12).toString('base64url'),at=new Date(),entry={code,at:at.toISOString(),expiresAt:new Date(at.getTime()+7*86400000).toISOString(),name:nickname(x.name),xi:x.xi,plan:engine.cleanPlan(x.plan),edition:engine.OPPONENT_VERSION};
   await store.put('challenge',code,entry);return json(res,201,{invite:publicInvite(entry),persistent:store.durable});
  }
  const joinPath=pathname.match(/^\/api\/challenges\/([A-Za-z0-9_-]{14,24})\/join$/);
  if(req.method==='POST'&&joinPath){
   const code=joinPath[1],inv=await store.get('challenge',code);if(!inv||Date.parse(inv.expiresAt)<Date.now()||inv.edition!==engine.OPPONENT_VERSION)return json(res,404,{error:errors.expired});
   const x=await parse(req),us=engine.validXI(x.xi);if(!us)return json(res,400,{error:errors.invalid});
   const client=safeClient(x),rk=`${code}:${client}`,old=await store.get('duel',rk);
   if(old)return json(res,200,{match:old.match,challenger:old.challenger,name:inv.name,alreadyPlayed:true,persistent:store.durable});
   const seed=engine.fixedRng('CL-v21|duel|'+code),fixture=Math.floor(seed()*20),first=engine.validXI(inv.xi),plan=engine.cleanPlan(x.plan);
   const match=engine.simMatch(first,us,fixture,inv.plan,plan),challenger=nickname(x.name),winner=match.winner==='b'?challenger:match.winner==='a'?inv.name:'TIE';
   const row={code,client,challenger,winner,playedAt:new Date().toISOString(),margin:match.margin,match};await store.put('duel',rk,row);
   return json(res,200,{match,challenger,name:inv.name,alreadyPlayed:false,persistent:store.durable});
  }
  if(req.method==='POST'&&pathname==='/api/matchmaking/join'){
   const x=await parse(req);if(!engine.validXI(x.xi))return json(res,400,{error:errors.invalid});
   purge();const ticket=crypto.randomUUID(),item={ids:x.xi,name:nickname(x.name),plan:engine.cleanPlan(x.plan),when:Date.now(),match:null};clients.set(ticket,item);queue.push(ticket);pairIfPossible();return json(res,200,{ticket,status:item.match?'matched':'waiting'});
  }
  if(req.method==='POST'&&pathname==='/api/matchmaking/cancel'){
   const x=await parse(req);if(typeof x.ticket==='string')clients.delete(x.ticket);return json(res,200,{ok:true});
  }
  if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
  const allowed={'/':'index.html','/index.html':'index.html','/player-data.json':'player-data.json','/era-rosters.json':'era-rosters.json'};
  const file=allowed[pathname];if(!file)return json(res,404,{error:'Not found'});
  const body=fs.readFileSync(path.join(__dirname,file)),type=file.endsWith('.html')?'text/html':'application/json';
  res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Content-Length':body.length,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(body);
 }catch(err){console.error('request error',err.stack||err);return json(res,500,{error:'Server error. Please retry.'});}
}
async function main(){await store.init();http.createServer(handle).listen(PORT,HOST,()=>console.log(`Cricket Legends V21 at http://localhost:${PORT} · ${store.durable?'PostgreSQL durable storage':'TEMPORARY filesystem storage'}`));}
if(require.main===module)main().catch(e=>{console.error('Failed to start:',e);process.exit(1);});
module.exports={handle,main,store};
