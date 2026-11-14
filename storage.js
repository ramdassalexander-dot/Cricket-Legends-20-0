'use strict';
/** A single storage interface for ranked results and invitations.
 * Set DATABASE_URL to enable permanent PostgreSQL-backed records.
 * Without it, Render's local JSON filesystem is explicitly NOT persistent.
 */
const fs=require('node:fs');
const path=require('node:path');
function createStore(options={}){
 const connectionString=options.databaseUrl??process.env.DATABASE_URL??'';
 const file=options.file||path.join(process.env.DATA_DIR||path.join(__dirname,'data'),'records-v21.json');
 let pool=null,items={};
 const durable=Boolean(connectionString);
 async function init(){
  if(durable){
   const {Pool}=require('pg');
   pool=new Pool({connectionString,max:4,connectionTimeoutMillis:8000,idleTimeoutMillis:30000});
   await pool.query(`CREATE TABLE IF NOT EXISTS cricket_records_v21 (
    kind TEXT NOT NULL, record_key TEXT NOT NULL, body JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (kind,record_key))`);
   await pool.query('CREATE INDEX IF NOT EXISTS cricket_records_v21_kind_idx ON cricket_records_v21(kind)');
  }else{
   fs.mkdirSync(path.dirname(file),{recursive:true});
   try{const loaded=JSON.parse(fs.readFileSync(file,'utf8'));if(loaded&&typeof loaded==='object'&&!Array.isArray(loaded))items=loaded;}catch{}
  }
 }
 function snapshot(){const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(items));fs.renameSync(tmp,file);}
 function check(kind,key){if(!/^[a-z-]{2,24}$/.test(kind)||typeof key!=='string'||key.length>160)throw Error('Invalid record key');}
 async function put(kind,key,body){check(kind,key);
  if(pool){await pool.query('INSERT INTO cricket_records_v21(kind,record_key,body) VALUES($1,$2,$3::jsonb) ON CONFLICT(kind,record_key) DO UPDATE SET body=EXCLUDED.body',[kind,key,JSON.stringify(body)]);return;}
  if(!items[kind])items[kind]={};items[kind][key]=body;snapshot();
 }
 async function get(kind,key){check(kind,key);
  if(pool){const r=await pool.query('SELECT body FROM cricket_records_v21 WHERE kind=$1 AND record_key=$2',[kind,key]);return r.rows[0]?.body||null;}
  return items[kind]?.[key]||null;
 }
 async function list(kind){if(!/^[a-z-]{2,24}$/.test(kind))throw Error('Invalid record kind');
  if(pool){const r=await pool.query('SELECT body FROM cricket_records_v21 WHERE kind=$1 ORDER BY created_at DESC LIMIT 5000',[kind]);return r.rows.map(x=>x.body);}
  return Object.values(items[kind]||{});
 }
 async function close(){if(pool)await pool.end();}
 return {durable,init,put,get,list,close};
}
module.exports={createStore};
