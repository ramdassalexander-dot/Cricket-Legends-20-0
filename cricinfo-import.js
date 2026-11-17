'use strict';
/*
 * Import REVIEWED ESPNcricinfo Statsguru career-summary figures into the game.
 * Never scrape from the browser or silently treat a name search as verification.
 *
 * Input JSON: [{"gameId":"virat-kohli","espnId":253802,"format":"T20I",
 *   "m":125,"runs":4188,"avg":48.7,"sr":137.04,"wk":0,
 *   "ba":null,"eco":null,"asOf":"2026-11-17"}]
 *
 * Each row must be transcribed/normalized from the stated player's actual
 * Statsguru career summary or from a suitably licensed data export.
 * Input is NOT assumed verified solely because it came from this CLI.
 */
const fs=require('node:fs');
const path=require('node:path');
const rosterPath=path.join(__dirname,'player-data.json');
const htmlPath=path.join(__dirname,'index.html');
const knownIds=require('./cricinfo-id-map.json');
const formats=new Set(['T20I','T20','ODI','Test']);
const numeric=(n,min,max)=>n==null?null:(Number.isFinite(n)&&n>=min&&n<=max?n:(()=>{throw Error('Invalid numeric stat '+n)})());
function normalize(input,players){
 if(!Array.isArray(input)||!input.length)throw Error('Input must contain a nonempty JSON array of reviewed Statsguru records.');
 const lookup=new Map(players.map(p=>[p.id,p])),seen=new Set(),out=[];
 for(const line of input){
  if(!line||typeof line!=='object')throw Error('Expected record object');
  const player=lookup.get(line.gameId);
  if(!player)throw Error('Unknown game ID: '+line.gameId);
  const espnId=String(line.espnId||'');
  if(!/^\d{2,9}$/.test(espnId))throw Error('Invalid ESPNcricinfo numeric player ID for '+line.gameId);
  const allowed=String(knownIds[line.gameId]||player.cricinfo?.id||'');
  if(!allowed)throw Error('Unreviewed ESPN identity for '+line.gameId+' — add a manually checked ID to cricinfo-id-map.json first');
  if(espnId!==allowed)throw Error('ID mismatch for '+line.gameId+' — manual verification required');
  if(!formats.has(line.format))throw Error('Unknown format for '+line.gameId);
  const key=line.gameId+':'+line.format;if(seen.has(key))throw Error('Duplicate '+key);seen.add(key);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(line.asOf||''))throw Error('Missing YYYY-MM-DD asOf for '+key);
  const row={m:numeric(line.m,1,6000),runs:numeric(line.runs,0,100000),
   avg:numeric(line.avg,0,200),sr:numeric(line.sr,0,500),wk:numeric(line.wk,0,10000),
   ba:numeric(line.ba,0,200),eco:numeric(line.eco,0,25)};
  if(![row.avg,row.sr,row.ba,row.eco].some(n=>n!==null)&&!(row.runs>0)&&!(row.wk>0))throw Error('No performance statistics for '+key);
  out.push({player,espnId,format:line.format,row,asOf:line.asOf});
 }
 return out;
}
function imported(players,rows){
 const copy=structuredClone(players);
 const byId=new Map(copy.map(p=>[p.id,p]));
 for(const item of normalize(rows,copy)){
  const p=byId.get(item.player.id);
  if(!p.cricinfo)p.cricinfo={id:item.espnId,formats:{}};
  p.cricinfo.id=item.espnId;
  p.cricinfo.formats[item.format]={...item.row,asOf:item.asOf};
 }
 return copy;
}
function run(){
 const filename=process.argv[2];if(!filename){console.error('Usage: node cricinfo-import.js <reviewed-stats.json>');process.exitCode=2;return;}
 const records=JSON.parse(fs.readFileSync(path.resolve(filename),'utf8'));
 const players=JSON.parse(fs.readFileSync(rosterPath,'utf8'));
 const updated=imported(players,records);
 const html=fs.readFileSync(htmlPath,'utf8');
 const re=/^const PL=\[[^\n]*\];$/m;
 if(!re.test(html))throw Error('Embedded players not found; no files changed');
 const modified=html.replace(re,'const PL='+JSON.stringify(updated)+';');
 fs.writeFileSync(rosterPath,JSON.stringify(updated,null,2)+'\n');
 fs.writeFileSync(htmlPath,modified);
 console.log('Imported '+records.length+' ESPNcricinfo format summaries for '+new Set(records.map(r=>r.gameId)).size+' players. Re-run npm test before deploying.');
}
if(require.main===module)run();
module.exports={normalize,imported};
