'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const engine=require('./server-engine');
const PORT=Number(process.env.PORT||3000),HOST=process.env.HOST||'0.0.0.0';
const DATA_DIR=process.env.DATA_DIR||path.join(__dirname,'data'),FILE=path.join(DATA_DIR,'leaderboard.json');
fs.mkdirSync(DATA_DIR,{recursive:true});
let entries=[];try{entries=JSON.parse(fs.readFileSync(FILE,'utf8'));if(!Array.isArray(entries))entries=[];}catch{entries=[];}
const clients=new Map(),queue=[],traffic=new Map();
const safeName=s=>String(s||'CricketFan').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,24)||'CricketFan';
const attempts=(r)=>{const addr=(r.headers['x-forwarded-for']||'').split(',')[0].trim()||r.socket.remoteAddress;const now=Date.now(),past=traffic.get(addr)||[];const next=past.filter(t=>now-t<60000);next.push(now);traffic.set(addr,next);return next.length<=20;};
function persist(){const tmp=FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(entries,null,2));fs.renameSync(tmp,FILE);}
function json(res,status,obj){const raw=JSON.stringify(obj);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(raw),'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Cache-Control':'no-store'});res.end(raw);}
function parse(req){return new Promise((resolve,reject)=>{let str='';req.on('data',b=>{str+=b;if(str.length>16000){reject(Error('Request too large'));req.destroy();}});req.on('end',()=>{try{resolve(JSON.parse(str||'{}'));}catch{reject(Error('Invalid JSON'));}});});}
function rank(){entries.sort((a,b)=>b.wins-a.wins||b.diff-a.diff||b.runTotal-a.runTotal);entries=entries.slice(0,250);persist();}
function purge(){const now=Date.now();for(const [key,item] of clients)if(now-item.when>15*60*1000){clients.delete(key);}for(let i=queue.length-1;i>=0;i--)if(!clients.has(queue[i])||clients.get(queue[i])?.match)queue.splice(i,1);}
function pairIfPossible(){purge();while(queue.length>=2){const a=clients.get(queue.shift()),b=clients.get(queue.shift());if(!a||!b)continue;
 const aXI=engine.validXI(a.ids),bXI=engine.validXI(b.ids);if(!aXI||!bXI)continue;
 const match=engine.simMatch(aXI,bXI),pA=engine.forecast(aXI,bXI,80),winner=match.winner==='a'?a.name:match.winner==='b'?b.name:'TIE';
 const body={...match,aName:a.name,bName:b.name,pA};
 a.match={status:'matched',winnerSide:match.winner,you:{name:a.name,side:'a'},opponent:b.name,winner,match:body};
 b.match={status:'matched',winnerSide:match.winner,you:{name:b.name,side:'b'},opponent:a.name,winner,match:body};
 }}
const on=async(req,res)=>{
 if(req.method==='OPTIONS'){json(res,200,{ok:true});return;}
 const url=new URL(req.url,'http://127.0.0.1');
 try{
 if(req.method==='GET'&&url.pathname==='/api/health')return json(res,200,{ok:true,players:engine.byId.size,queue:queue.length,opposition:engine.OPPONENT_VERSION});
 if(req.method==='GET'&&url.pathname==='/api/leaderboard')return json(res,200,{opposition:engine.OPPONENT_VERSION,entries:entries.filter(x=>x.oppositionVersion===engine.OPPONENT_VERSION).slice(0,100).map(({name,wins,losses,diff,runTotal,at})=>({name,wins,losses,diff,runTotal,at}))});
 if(req.method==='POST'&&url.pathname.startsWith('/api/')&&!attempts(req))return json(res,429,{error:'Too many requests; try again later.'});
 if(req.method==='POST'&&url.pathname==='/api/leaderboard'){
  const data=await parse(req);if(!engine.validXI(data.xi))return json(res,400,{error:'Eleven different registered player IDs are required.'});
  const result=engine.season(data.xi),item={name:safeName(data.name),...result,at:new Date().toISOString(),id:crypto.randomUUID(),signature:crypto.createHash('sha256').update(JSON.stringify(data.xi)).digest('hex').slice(0,16)};
  entries.push(item);rank();return json(res,200,{attempt:item,rank:entries.filter(x=>x.oppositionVersion===engine.OPPONENT_VERSION).findIndex(x=>x.id===item.id)+1});
 }
 if(req.method==='POST'&&url.pathname==='/api/matchmaking/join'){
  const body=await parse(req);if(!engine.validXI(body.xi))return json(res,400,{error:'Draft eleven valid, different cricketers before matchmaking.'});
  purge();const ticket=crypto.randomUUID(),item={ids:body.xi,name:safeName(body.name),when:Date.now(),match:null};clients.set(ticket,item);queue.push(ticket);pairIfPossible();return json(res,200,{ticket,status:item.match?'matched':'waiting'});
 }
 if(req.method==='GET'&&url.pathname==='/api/matchmaking/status'){
  const key=url.searchParams.get('ticket'),item=clients.get(key);if(!item)return json(res,200,{status:'expired'});
  return json(res,200,item.match||{status:'waiting'});
 }
 if(req.method==='POST'&&url.pathname==='/api/matchmaking/cancel'){
  const body=await parse(req);if(typeof body.ticket==='string')clients.delete(body.ticket);return json(res,200,{ok:true});
 }
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 const allowed={'/':'index.html','/index.html':'index.html','/player-data.json':'player-data.json','/era-rosters.json':'era-rosters.json','/assets/stadium-night.svg':'assets/stadium-night.svg'};
 const file=allowed[url.pathname];if(!file)return json(res,404,{error:'Not found'});
 const content=fs.readFileSync(path.join(__dirname,file));const type=file.endsWith('.html')?'text/html':file.endsWith('.svg')?'image/svg+xml':'application/json';
 res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Content-Length':content.length,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(content);
 }catch(e){json(res,500,{error:e.message||'Internal error'});}
};
http.createServer(on).listen(PORT,HOST,()=>console.log(`Cricket Legends V15 at http://localhost:${PORT} · online game server ready`));
