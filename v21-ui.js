/* Cricket Legends V21 · Evidence-first dual-skill scouting and real online challenges.
 * Offline HTML remains fully playable; ranked daily/friend features require online Node server.
 */
const V21_MODE=CricketAbilityV15.VERSION;
const V21_DAILY_SELECTION='cricket_v21_daily_selection';
const V21_BADGES='cricket_v21_badges';
let v21DailyData=null,v21DailyXI=[],v21DailyPlan={...captainV20},v21InviteCode=new URL(location.href).searchParams.get('invite')||'';
let v21Badges=[];try{v21Badges=JSON.parse(localStorage.getItem(V21_BADGES)||'[]');if(!Array.isArray(v21Badges))v21Badges=[];}catch{}
function v21ClientId(){const key='cricket_v21_anonymous_id';let id='';try{id=localStorage.getItem(key)||'';}catch{}
 if(!/^[A-Za-z0-9_-]{12,64}$/.test(id)){id=typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);try{localStorage.setItem(key,id);}catch{}}
 return id;
}
function v21Badge(label,id){if(v21Badges.some(x=>x.id===id))return;v21Badges.push({id,label,at:new Date().toISOString()});v21Badges=v21Badges.slice(-100);try{localStorage.setItem(V21_BADGES,JSON.stringify(v21Badges));}catch{}}
function v21Award(id,count,text){if(wallet.claimed.includes('v21:'+id))return;wallet.claimed.push('v21:'+id);wallet.coins+=count;wallet.earned+=count;wallet.claimed=wallet.claimed.slice(-300);saveWallet();if(text)showToast('🪙',text+' · +'+count+' coins');}
function v21Profiles(){return state.slots.filter(Boolean).map(p=>({p,a:CricketAbilityV15.profile(v15Player(p))}));}
const v21PreviousPower=buildPower;
buildPower=function(){if(state.oppositionVersion!==V21_MODE)return v21PreviousPower();const xi=v21Profiles();if(!xi.length)return {bat:0,bowl:0,balance:0,power:0};
 const mean=x=>x.length?x.reduce((a,b)=>a+b,0)/x.length:0;
 const bat=mean(xi.map(({a},i)=>i<3?a.bat.powerplay:i<6?a.bat.middle:i<9?a.bat.death:a.bat.overall));
 const pool=CricketAbilityV15.selectBowlers(state.slots.filter(Boolean));
 const bowl=mean(pool.slice(0,5).map(x=>x.a.bowl.overall)),options=xi.filter(x=>x.a.bowl.overall>=63).length;
 const balance=clamp(35+Math.min(6,options)*9+(xi.some(x=>x.p.role==='W')?12:0),35,100);
 return {bat:Math.round(bat),bowl:Math.round(bowl),balance:Math.round(balance),power:Math.round(clamp(bat*.50+bowl*.43+balance*.07,25,100))};
};
const v21PreviousFit=playerFit;
playerFit=function(p){if(state.oppositionVersion!==V21_MODE)return v21PreviousFit(p);
 const a=CricketAbilityV15.profile(v15Player(p)),xs=v21Profiles(),n=xs.length;
 const bowlingOptions=xs.filter(x=>x.a.bowl.overall>=63).length,
       existingTop=xs.filter(x=>x.a.bat.powerplay>=76).length,
       finishers=xs.filter(x=>x.a.bat.death>=78).length;
 const keeper=xs.some(x=>x.p.role==='W');
 let points=34+(a.bat.overall-45)*.35+(a.bowl.overall-45)*.29;
 let reason='Provides strong combined batting and bowling value';
 if(a.bat.powerplay>=76&&existingTop<3){points+=10;reason='Credible top-order batter based on batting ability, regardless of AR label';}
 if(a.bat.death>=78&&finishers<3){points+=8;reason='Adds high-quality finishing and lower-order hitting';}
 if(a.bowl.overall>=63&&bowlingOptions<5){points+=16;reason='Adds a genuine bowling option; an all-rounder can bowl full four-over spells';}
 if(a.bowl.overall>=80&&bowlingOptions>=5){points+=7;reason='Elite additional bowler for turning, seam or death conditions';}
 if(a.bat.overall>=75&&a.bowl.overall>=72){points+=13;reason='Genuine dual-skilled match winner: top-six batting and frontline bowling';}
 if(p.role==='W'&&!keeper){points+=14;reason='Fills the wicketkeeper position';}
 if(a.bat.overall<42&&n>=6&&xs.filter(x=>x.a.bat.overall>=65).length<5)points-=8;
 return {score:Math.round(clamp(points,22,99)),reason};
};
const v21PrevPlayerScout=showPlayerAbilityV15;
showPlayerAbilityV15=function(id){v21PrevPlayerScout(id);const p=BY_ID[id];if(!p)return;const record=CricketAbilityV15.profile(v15Player(p)).record;
 const node=overlay.querySelector('.abv15-scroll');if(!node||!record)return;
 const avg=record.average==null?'—':record.average.toFixed(2),sr=record.strikeRate==null?'—':record.strikeRate.toFixed(1),bAvg=record.bowlingAverage==null?'—':record.bowlingAverage.toFixed(2),eco=record.economy==null?'—':record.economy.toFixed(2);
 const url=record.source&&/^https:\/\//.test(record.source)?record.source:null;
 node.insertAdjacentHTML('beforeend',`<section class="v21-proof"><strong>${record.verified?'✓ CHECKED HISTORICAL T20I RECORD':'ℹ HISTORICAL SOURCE / DATA QUALITY'}</strong><p>${html(record.format)} · Bat avg <b>${avg}</b> · Strike rate <b>${sr}</b> · Bowl avg <b>${bAvg}</b> · Economy <b>${eco}</b></p>${url?`<a target="_blank" rel="noopener noreferrer" href="${html(url)}">VIEW SOURCE ↗</a>`:'<small>Only estimated attributes are available.</small>'}<small> Phase-specific ratings and fantasy translations remain estimates. Overall batting and bowling receive independent evidence-based weight; neither is discounted for being an all-rounder.</small></section>`);
};
const v21PrevReady=ready;
ready=function(){let h=v21PrevReady();if(state.oppositionVersion!==V21_MODE)return h;
 const cta=v21InviteCode?'<button class="btn main" data-action="v21Join">⚔ FACE YOUR FRIEND</button>':'<button class="btn alt" data-action="v21Invite">⚔ CHALLENGE A FRIEND</button>';
 h=h.replace('<div class="ready-actions">',`<div class="ready-actions">${cta}`);
 // Keep PLAY visible on phones; put advanced captaincy behind an intentional expander.
 h=h.replace('<section class="v20-panel">','<details class="v21-captain-accordion"><summary>🎩 EDIT CAPTAINCY · BATTING / BOWLING / PITCH</summary><section class="v20-panel">');
 h=h.replace('</section><div class="ready-actions">','</section></details><div class="ready-actions">');
 const actions=h.match(/<div class="ready-actions">[\s\S]*?<\/div>/);
 if(actions){h=h.replace(actions[0],'');h=h.replace('<button class="coach-open"',actions[0]+'<button class="coach-open"');}
 return h;
};
const v21PrevHome=home;
home=function(){let h=v21PrevHome();h=h.replace('<button class="btn alt" data-action="v20Daily">📅 DAILY LEGENDS SQUAD</button>','');return h.replace('<div class="hero-facts">',`<button class="btn alt" data-action="v21Daily">🏆 PLAY TODAY'S RANKED DAILY</button><button class="btn alt" data-action="v21Rewards">🎖️ TROPHY ROOM · REWARDS</button><div class="hero-facts">`);};
const v21PrevOnlineButtons=onlineButtons;
onlineButtons=function(){return v21PrevOnlineButtons()+`<div class="online-row"><button class="btn alt" data-action="v21Invite">⚔ INVITE A FRIEND</button><button class="btn alt" data-action="v21Daily">📅 DAILY CUP</button></div>`;};
const v21PrevDone=done;
done=function(){let h=v21PrevDone();if(state.oppositionVersion!==V21_MODE)return h;
 const wins=state.results.filter(x=>x.win).length;
 if(wins===20)v21Badge('🏆 Unbeaten Legends',state.coinSeasonId+':unbeaten');
 if(wins>=17)v21Badge('🥇 Elite Captain',state.coinSeasonId+':elite');
 if(state.slots.filter(Boolean).filter(p=>CricketAbilityV15.profile(v15Player(p)).bowl.overall>=70).length>=7)v21Badge('🎯 Seven genuine bowling options',state.coinSeasonId+':versatile');
 return h.replace('<div class="result-main',`<div class="v20-report"><b>⚔ CHALLENGE A FRIEND WITH THIS XI</b><p>Both XIs and both captaincy plans will be simulated independently on the server.</p><button class="btn alt" data-action="v21Invite">CREATE INVITE LINK</button></div><div class="result-main`);
};
function v21Name(){return onlinePrefs.name?.trim()||'CricketFan';}
function v21XI(){return state.slots.filter(Boolean).map(p=>p.id);}
function v21Plan(){return state.captainPlan||captainV20;}
async function v21ShareMessage(message,url){if(navigator.share){try{await navigator.share({title:'Cricket Legends Friend Challenge',text:message,url});return;}catch{}}
 if(navigator.clipboard){try{await navigator.clipboard.writeText(message);showMessage('Challenge link copied to clipboard.');return;}catch{}}showMessage(message);
}
async function v21CreateInvite(){if(v21XI().length!==11){showMessage('Finish drafting your XI before creating an invitation.');return;}
 openModal('<p class="notes">Creating your personal server-verified challenge…</p>');
 try{const d=await apiCall('/api/challenges',{method:'POST',body:JSON.stringify({name:v21Name(),xi:v21XI(),plan:v21Plan(),clientId:v21ClientId()})});
  const link=new URL(location.href);link.search='';link.searchParams.set('invite',d.invite.code);
  const text=`🏏 ${v21Name()} invites you to a Cricket Legends showdown! Draft your all-time XI and see who wins: ${link}`;
  openModal(`<div class="modal-head"><h2>⚔ Your friend challenge</h2><button class="icon-btn" data-action="close">✕</button></div><p>Share this link. Your friend drafts an XI and the server will simulate both teams under the same conditions.</p><input class="online-name" readonly value="${html(link.toString())}" aria-label="Invitation link"><p class="small">Expires ${new Date(d.invite.expiresAt).toLocaleDateString()}. ${d.persistent?'Stored in the connected database.':'Invites can be lost if the host restarts (database not connected).'}</p><button class="btn main full" data-action="v21CopyInvite" data-link="${html(link.toString())}">↗ SHARE / COPY CHALLENGE LINK</button><button class="btn alt full" data-action="close">DONE</button>`);
  window.v21LastShare={text,url:link.toString()};
 }catch(e){showMessage('Could not create challenge: '+e.message);}
}
async function v21ReadInvite(code){try{const d=await apiCall('/api/challenges/'+encodeURIComponent(code));v21InviteCode=code;
 openModal(`<div class="modal-head"><h2>⚔ ${html(d.invite.name)} challenges you!</h2><button class="icon-btn" data-action="close">✕</button></div><p>Build a team of eleven legends to face their XI. Both sides have separate captaincy tactics.</p><div class="v21-invite-list">${d.invite.xi.map(p=>`<span>${html(p.name)}</span>`).join('')}</div><p class="small">Invitation expires ${new Date(d.invite.expiresAt).toLocaleDateString()}</p><button class="btn main full" data-action="${v21XI().length===11?'v21Join':'v21StartDraft'}">${v21XI().length===11?'PLAY AGAINST THIS XI':'DRAFT YOUR XI TO ACCEPT'}</button>`);
 }catch(e){showMessage('This invitation cannot be loaded: '+e.message);}}
async function v21Join(){if(v21XI().length!==11){showMessage('Draft eleven cricketers before joining the challenge.');return;}
 if(!v21InviteCode){showMessage('Open your friend\'s invitation link first.');return;}
 openModal('<p class="notes">Simulating both Legends teams on the server…</p>');
 try{const d=await apiCall('/api/challenges/'+encodeURIComponent(v21InviteCode)+'/join',{method:'POST',body:JSON.stringify({name:v21Name(),xi:v21XI(),plan:v21Plan(),clientId:v21ClientId()})});
  const m=d.match,won=m.winner==='b',tied=m.winner==='TIE';
  if(!d.alreadyPlayed){v21Award('duel:'+v21InviteCode,won?30:10,won?'Friend challenge victory':'Played a friend challenge');v21Badge(won?'⚔ Friend-slayer':'🤝 Friendly match',v21InviteCode);}
  const first=m.firstSide==='a'?d.name:d.challenger,second=m.firstSide==='a'?d.challenger:d.name;
  openModal(`<div class="modal-head"><div class="sup">LIVE SERVER-VERIFIED DUEL</div><h2>${html(d.name)} VS ${html(d.challenger)}</h2><button class="icon-btn" data-action="close">✕</button></div><div class="scrollbox score-scroll"><div class="record">${won?'🏆 YOU WIN':tied?'🤝 TIE':'YOUR FRIEND WINS'}</div><p class="small">${m.scenarioWins} of ${m.scenarioTotal} fixed scenarios favoured the inviter's XI. Pitch: ${html(m.playingSurface||m.first.surface||'balanced')}. Both captaincy plans affect the result.</p>${scoreOne(m.first,first)}${scoreOne(m.second,second,true)}</div><button class="btn alt full" data-action="v21Invite">CHALLENGE THEM BACK</button>`);
 }catch(e){showMessage('Match could not be completed: '+e.message);}}
function v21DailyPlanBtns(){return `<div class="v21-tactic"><small>YOUR CAPTAINCY PLAN</small>${[['batting','Batting',['anchor','balanced','attack']],['bowling','Bowling',['contain','balanced','attack']],['focus','Attack',['pace','balanced','spin']]].map(([key,title,vals])=>`<label>${title}: <select data-action="v21DailyPlan" data-field="${key}">${vals.map(v=>`<option value="${v}" ${v21DailyPlan[key]===v?'selected':''}>${v.toUpperCase()}</option>`).join('')}</select></label>`).join('')}</div>`;}
function v21DailyCard(p){const selected=v21DailyXI.includes(p.id);return `<button class="v21-player ${selected?'chosen':''}" data-action="v21DailyPick" data-id="${html(p.id)}"><b>${html(p.name)}</b><small>${html(p.nation)} · ${html(p.role)}</small><strong>BAT ${p.bat} · BOWL ${p.bowl}</strong><small>${selected?'✓ IN YOUR XI':'TAP TO SELECT'}</small></button>`;}
function v21DailyRender(preserve=false){if(!v21DailyData)return;const top=preserve?overlay.querySelector('.v21-daily-scroll')?.scrollTop||0:0;
 const count=v21DailyXI.length;
 openModal(`<div class="modal-head"><div><div class="sup">SERVER-VERIFIED DAILY CUP · ${html(v21DailyData.date)}</div><h2>📅 Pick your Legends XI · ${count}/11</h2></div><button class="icon-btn" data-action="close">✕</button></div><div class="scrollbox v21-daily-scroll"><p class="small">Everybody gets the same 24 players today. Choose 11, set the batting order and captaincy tactics, then compete in a 20-match ranked season.</p><div class="v21-choose"><strong>YOUR BATTING ORDER</strong>${v21DailyXI.length?v21DailyXI.map((id,i)=>{const p=v21DailyData.pool.find(x=>x.id===id);return `<div class="v21-xi-row"><span>${i+1}. ${html(p?.name||id)}</span><button data-action="v21DailyMove" data-index="${i}" data-delta="-1" ${i===0?'disabled':''}>↑</button><button data-action="v21DailyMove" data-index="${i}" data-delta="1" ${i===count-1?'disabled':''}>↓</button></div>`;}).join(''):'<p>Tap players below to build your XI.</p>'}</div>${v21DailyPlanBtns()}<div class="v21-daily-grid">${v21DailyData.pool.map(v21DailyCard).join('')}</div><p class="small">Only your best server-verified result for today is ranked per anonymous browser ID. There is no sign-in or tamper-proof player identity yet.</p></div><div class="v21-footer"><button class="btn alt" data-action="v21DailyBoard">🏆 RANKINGS</button><button class="btn main" data-action="v21DailySubmit" ${count!==11?'disabled':''}>🏏 SUBMIT XI</button></div>`);
 const scroll=overlay.querySelector('.v21-daily-scroll');if(scroll)scroll.scrollTop=top;
}
function v21SaveDay(){try{localStorage.setItem(V21_DAILY_SELECTION,JSON.stringify({date:v21DailyData?.date,ids:v21DailyXI,plan:v21DailyPlan}));}catch{}}
async function v21Daily(){openModal('<p class="notes">Loading today\'s ranked Legends pool…</p>');
 try{v21DailyData=await apiCall('/api/daily');let saved={};try{saved=JSON.parse(localStorage.getItem(V21_DAILY_SELECTION)||'{}');}catch{}
 const allowed=new Set(v21DailyData.pool.map(x=>x.id));v21DailyXI=saved.date===v21DailyData.date&&Array.isArray(saved.ids)?saved.ids.filter(id=>allowed.has(id)).slice(0,11):[];
 v21DailyPlan=saved.date===v21DailyData.date&&saved.plan?{...captainV20,...saved.plan}:{...captainV20};v21DailyRender();
 }catch(e){showMessage('Could not load the daily tournament: '+e.message);}}
function v21Table(rows){return rows.length?`<table class="leaders-table"><thead><tr><th>#</th><th>CAPTAIN</th><th>RECORD</th><th>RUN DIFF</th></tr></thead><tbody>${rows.map((x,i)=>`<tr><td>${i+1}</td><td>${html(x.name)}</td><td><b>${x.wins}–${x.losses}</b></td><td>${x.diff>0?'+':''}${x.diff}</td></tr>`).join('')}</tbody></table>`:'<p>Be the first to complete today\'s challenge.</p>';}
async function v21DailyBoard(){try{const d=await apiCall('/api/daily/leaderboard');openModal(`<div class="modal-head"><h2>🏆 ${html(d.date)} Daily Cup</h2><button class="icon-btn" data-action="close">✕</button></div><div class="scrollbox">${v21Table(d.entries)}<p class="small">${d.persistent?'Backed by PostgreSQL.':'⚠ Temporary hosting storage: results may reset until DATABASE_URL is configured.'}</p></div><button class="btn main full" data-action="v21Daily">BUILD DAILY XI</button>`);}catch(e){showMessage('Daily rankings unavailable: '+e.message);}}
async function v21DailySubmit(){if(v21DailyXI.length!==11){showMessage('Pick eleven different cricketers.');return;}
 v21SaveDay();openModal('<p class="notes">Server is evaluating your XI across all 20 fixtures…</p>');
 try{const d=await apiCall('/api/daily/submit',{method:'POST',body:JSON.stringify({name:v21Name(),xi:v21DailyXI,plan:v21DailyPlan,clientId:v21ClientId()})});
  if(d.firstAttempt){v21Award('daily:'+d.attempt.date,25,'First Daily Cup entry');v21Badge('📅 Daily Cup debut','daily:'+d.attempt.date);}
  if(d.attempt.wins===20)v21Badge('💎 Perfect Daily Cup',d.attempt.date+':perfect');
  openModal(`<div class="modal-head"><h2>🏆 Daily Cup · Ranked #${d.rank}</h2><button class="icon-btn" data-action="close">✕</button></div><div class="record">${d.attempt.wins}–${d.attempt.losses}</div><p>${d.improved?'Your personal best has been recorded.':'Your earlier entry remains your best result.'} Run differential: ${d.attempt.diff>0?'+':''}${d.attempt.diff}</p><p class="small">${d.persistent?'Stored in the connected PostgreSQL database.':'Temporary local server storage. Scores may disappear on redeployment until database access is connected.'}</p><div class="online-row"><button class="btn main" data-action="v21DailyBoard">DAILY RANKINGS</button><button class="btn alt" data-action="v21Daily">TRY ANOTHER XI</button></div>`);
 }catch(e){showMessage('The daily submission could not be scored: '+e.message);}}
const v21PrevSubmit=submitVerifiedSeason;
submitVerifiedSeason=async function(){if(v21XI().length!==11){showMessage('Finish your XI first.');return;}
 openModal('<p class="notes">Server-verifying the 20-fixture campaign…</p>');
 try{const d=await apiCall('/api/leaderboard',{method:'POST',body:JSON.stringify({name:v21Name(),xi:v21XI(),plan:v21Plan(),clientId:v21ClientId()})});
 openModal(`<div class="modal-head"><h2>🏆 World Rank #${d.rank}</h2><button class="icon-btn" data-action="close">✕</button></div><div class="record">${d.attempt.wins}–${d.attempt.losses}</div><p>Run differential ${d.attempt.diff>0?'+':''}${d.attempt.diff}. ${d.improved?'New personal best!':'Your previous best stays ranked.'}</p><p class="small">${d.persistent?'Results saved to PostgreSQL.':'Results are NOT durable yet: the database URL is not connected to the server.'}</p><button class="btn main full" data-action="onlineRank">VIEW WORLD LEADERBOARD</button>`);
 }catch(e){showMessage('Ranked submission failed: '+e.message);}}
const v21PrevGlobal=showGlobalBoard;
showGlobalBoard=async function(){openModal('<p class="notes">Fetching world rankings…</p>');try{const d=await apiCall('/api/leaderboard');openModal(`<div class="modal-head"><h2>🏆 Global Legends Leaderboard</h2><button class="icon-btn" data-action="close">✕</button></div><div class="scrollbox leaderboard-wrap">${tableGlobal(d.entries)}<p class="small">Server recalculates every season. Only the best entry per anonymous browser ID is retained. ${d.persistent?'PostgreSQL storage is connected.':'⚠ Temporary storage: connect DATABASE_URL for durable results.'}</p></div><button class="btn alt full" data-action="online">ONLINE HUB</button>`);}catch(e){showMessage('Global leaderboard unavailable: '+e.message);}};
const v21PrevGoals=showGoals;
showGoals=function(){v21PrevGoals();const target=overlay.querySelector('.scrollbox')||overlay.querySelector('.modal');if(!target)return;target.insertAdjacentHTML('beforeend',`<section class="v21-proof"><strong>🎖️ YOUR NEW TROPHIES (${v21Badges.length})</strong>${v21Badges.length?v21Badges.slice(-12).reverse().map(x=>`<div class="v21-xi-row">${html(x.label)} <small>${new Date(x.at).toLocaleDateString()}</small></div>`).join(''):'<p>Compete in a daily cup, challenge a friend or finish an unbeaten season to earn trophies.</p>'}<p class="small">Coins are free local gameplay points; 200 coins buy a draft respin. First Daily Cup completion earns 25; friend victory earns 30.</p></section>`);};
function v21Rewards(){showGoals();}
const v21PrevShare=v20Share;
v20Share=function(){return v21CreateInvite();};
v20Daily=function(){return v21Daily();};
document.addEventListener('click',e=>{const b=e.target.closest('[data-action^="v21"]');if(!b||b.disabled)return;
 const action=b.dataset.action;if(action==='v21DailyPlan')return;
 e.preventDefault();e.stopImmediatePropagation();
 if(action==='v21Daily')v21Daily();
 else if(action==='v21Invite')v21CreateInvite();
 else if(action==='v21Join')v21Join();
 else if(action==='v21StartDraft'){closeModal();start();}
 else if(action==='v21CopyInvite'){const item=window.v21LastShare;if(item)v21ShareMessage(item.text,item.url);}
 else if(action==='v21Rewards')v21Rewards();
 else if(action==='v21DailyBoard')v21DailyBoard();
 else if(action==='v21DailySubmit')v21DailySubmit();
 else if(action==='v21DailyPick'){
  const id=b.dataset.id,at=v21DailyXI.indexOf(id);if(at>=0)v21DailyXI.splice(at,1);else if(v21DailyXI.length<11)v21DailyXI.push(id);v21SaveDay();v21DailyRender(true);
 }
 else if(action==='v21DailyMove'){const i=Number(b.dataset.index),j=i+Number(b.dataset.delta);if(i>=0&&j>=0&&j<v21DailyXI.length){[v21DailyXI[i],v21DailyXI[j]]=[v21DailyXI[j],v21DailyXI[i]];v21SaveDay();v21DailyRender(true);}}
},{capture:true});
document.addEventListener('change',e=>{const select=e.target.closest('[data-action="v21DailyPlan"]');if(!select)return;const field=select.dataset.field,allowed={batting:['anchor','balanced','attack'],bowling:['contain','balanced','attack'],focus:['pace','balanced','spin']};if(allowed[field]?.includes(select.value)){v21DailyPlan[field]=select.value;v21SaveDay();}},{capture:true});
if(v21InviteCode&&/^[A-Za-z0-9_-]{14,24}$/.test(v21InviteCode))setTimeout(()=>v21ReadInvite(v21InviteCode),350);
render();
