(()=>{'use strict';
globalThis.MELON_GALA_RENDERER_VERSION=712;
globalThis.MELON_UI_VERSION='V7.12';
const AUTO='melon_auto_v5',STORE='melon_gala_categories_v712',MANIFEST='./data/database.json';
const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=s=>String(s||'').trim().toLocaleLowerCase('pl');
let users=[],categories=[],renderQueued=false,rendering=false;
function json(k,f={}){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function state(){return json(AUTO,null)}
function rand(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}catch{return Math.random()}}
function hash32(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h>>>0}
function unit(seed){return(hash32(seed)%10001)/10000}
function careerId(s){return String(s?.startProfileV79?.rolledAt||`${s?.nickname||'user'}|${s?.difficulty||'normal'}|${s?.startYear||2026}`)}
function yearOf(s){return 2026+Math.floor((Math.max(1,Number(s?.turn||1))-1)/52)}
function activityPower(s){if(!s)return 1;const a=clamp(Number(s.activity||0),0,100),l=Math.max(1,Number(s.level||1)),st=Math.max(0,Number(s.streak||0));return clamp(1+(a/100)*.8+Math.max(0,l-1)*.06+Math.min(st,10)*.02,1,2.8)}
function parseUsers(t){const seen=new Set(),out=[];for(const raw of String(t).split(/\r?\n/)){const n=raw.trim(),k=key(n);if(!n||n.startsWith('#')||n.startsWith('//')||seen.has(k))continue;seen.add(k);out.push(n)}return out}
function candidatePool(s){const seen=new Set(),out=[];for(const n of users){const k=key(n);if(!k||seen.has(k))continue;seen.add(k);out.push(n)}const nick=String(s?.nickname||'').trim(),nk=key(nick);if(nick&&nk&&!seen.has(nk)){seen.add(nk);out.push(nick)}return out}
function weightedPick(items,weightFn){if(!items.length)return null;const weights=items.map(x=>Math.max(1,Number(weightFn(x))||1)),sum=weights.reduce((a,b)=>a+b,0);let r=rand()*sum;for(let i=0;i<items.length;i++){r-=weights[i];if(r<=0)return items[i]}return items.at(-1)}
function weightedSample(items,n,weightFn){const pool=[...items],out=[];while(pool.length&&out.length<n){const x=weightedPick(pool,weightFn);if(x==null)break;out.push(x);pool.splice(pool.indexOf(x),1)}return out}
function pseudo(name,year){const r=k=>20+unit(`${year}|${name}|${k}`)*80;return{reputation:r('rep'),trust:r('trust'),activity:r('act'),popularity:r('pop'),controversy:r('con'),humor:r('humor'),voice:r('voice'),growth:r('growth'),regression:r('reg'),party:r('party'),cringe:r('cringe'),anon:r('anon'),dry:r('dry')}}
function activeProfile(s,year){const total=Number(s.goodChoices||0)+Number(s.badChoices||0),goodRate=total?Number(s.goodChoices||0)/total*100:50,noise=k=>unit(`${year}|${s.nickname}|${k}`)*28;return{
 reputation:Number(s.reputation||0),trust:Number(s.trust||0),activity:Number(s.activity||0),popularity:Number(s.popularity||0),controversy:Number(s.controversy||0),
 humor:clamp(Number(s.popularity||0)*.55+Number(s.activity||0)*.25+(s.archetype==='memer'?25:0)+noise('humor'),0,100),
 voice:clamp(Number(s.activity||0)*.65+Number(s.popularity||0)*.25+noise('voice'),0,100),
 growth:clamp(Number(s.level||1)*6+Number(s.score||0)/45+goodRate*.25+noise('growth'),0,100),
 regression:clamp(Number(s.controversy||0)*.55+(100-Number(s.reputation||0))*.25+(100-goodRate)*.3+noise('reg'),0,100),
 party:clamp(Number(s.controversy||0)*.45+Number(s.popularity||0)*.35+noise('party'),0,100),
 cringe:clamp(Number(s.controversy||0)*.5+(100-Number(s.trust||0))*.25+noise('cringe'),0,100),
 anon:clamp((100-Number(s.popularity||0))*.55+(100-Number(s.activity||0))*.35+noise('anon'),0,100),
 dry:clamp((100-Number(s.popularity||0))*.3+noise('dry')*2.4,0,100)
}}
function profile(name,s,year){return key(name)===key(s.nickname)?activeProfile(s,year):pseudo(name,year)}
function scoreFor(name,cat,s,year){const p=profile(name,s,year),id=cat.id;let v=50;
 if(id==='uzytkownik_roku')v=p.reputation*1.25+p.trust*1.2+p.activity*.9+p.popularity*.7-p.controversy*.55;
 else if(id==='alkoholik_serwera')v=p.party*1.35+p.controversy*.45+p.popularity*.25;
 else if(id==='rak_roku')v=p.cringe*1.25+p.controversy*.7+(100-p.trust)*.2;
 else if(id==='family_friendly')v=p.trust*1.35+p.reputation*1.15+(100-p.controversy)*.75;
 else if(id==='progres_roku')v=p.growth*1.5+p.activity*.5+p.reputation*.25;
 else if(id==='bezbek_serwera')v=p.dry*1.35+p.cringe*.45+(100-p.humor)*.2;
 else if(id==='toxic_serwera')v=p.controversy*1.45+(100-p.trust)*.65+(100-p.reputation)*.3;
 else if(id==='voice_user_roku')v=p.voice*1.45+p.activity*.6+p.popularity*.25;
 else if(id==='regres_roku')v=p.regression*1.45+p.controversy*.4+(100-p.reputation)*.2;
 else if(id==='smieszek_serwera')v=p.humor*1.5+p.popularity*.55+p.activity*.2;
 else if(id==='anon_serwera')v=p.anon*1.45+(100-p.popularity)*.45+(100-p.activity)*.2;
 const stableNoise=.9+unit(`${year}|${cat.id}|${name}|base`)*.2;
 if(key(name)===key(s.nickname))v*=activityPower(s);
 return Math.max(8,v*stableNoise)
}
function normalizedResults(nominees,cat,s,year){let rows=nominees.map(name=>({name,score:scoreFor(name,cat,s,year)*(.72+rand()*.56)}));const sum=rows.reduce((a,b)=>a+b.score,0);rows=rows.map(r=>({name:r.name,percent:Math.round(r.score/sum*1000)/10})).sort((a,b)=>b.percent-a.percent||a.name.localeCompare(b.name,'pl'));const diff=Math.round((100-rows.reduce((a,b)=>a+b.percent,0))*10)/10;rows[0].percent=Math.round((rows[0].percent+diff)*10)/10;return rows.sort((a,b)=>b.percent-a.percent||a.name.localeCompare(b.name,'pl'))}
function buildAwards(s,year){const root=json(STORE,{}),cid=careerId(s);root[cid]=root[cid]||{};if(root[cid][year]?.schema===712)return root[cid][year];const pool=candidatePool(s),awards=[];if(pool.length<3)return{schema:712,year,awards:[],error:'Za mało kandydatów'};for(const cat of categories){const nominees=weightedSample(pool,3,n=>scoreFor(n,cat,s,year)),results=normalizedResults(nominees,cat,s,year),winner=results[0]?.name||'';awards.push({...cat,nominees:results.map(r=>r.name),winner,results})}root[cid][year]={schema:712,year,generatedAt:new Date().toISOString(),player:s.nickname,playerIncluded:true,activityPower:activityPower(s),awards};localStorage.setItem(STORE,JSON.stringify(root));return root[cid][year]}
function playerNotice(s){return`<div class="gala-player-notice-v712"><span>🎮 AKTYWNY GRACZ</span><strong>${esc(s.nickname||'Użytkownik')}</strong><small>Bierzesz udział w Złotych Melonach automatycznie — nie musisz znajdować się w users.txt. Aktywność, poziom i seria zwiększają Twoją wagę.</small></div>`}
function preview(s){return`<div class="gala-preview-v710"><div class="gala-preview-head-v710"><span>🏆 ${categories.length} kategorii</span><b>Losowanie w 52. tygodniu</b></div>${playerNotice(s)}<div class="gala-category-preview-grid-v710">${categories.map(c=>`<div class="gala-category-pill-v710 tone-${esc(c.tone)} ${c.overall?'overall-v711':''}"><span>${c.icon}</span><strong>${esc(c.name)}</strong><small>${esc(c.description)}</small></div>`).join('')}</div></div>`}
function nameWithPlayer(name,s){return key(name)===key(s.nickname)?`${esc(name)} <em class="gala-player-v712">TY</em>`:esc(name)}
function card(a,s){return`<article class="gala-award-v710 tone-${esc(a.tone)} ${a.overall?'overall-v711':''}"><header><span>${a.icon}</span><div><small>ZŁOTY MELON${a.overall?' • KATEGORIA GŁÓWNA':''}</small><h3>${esc(a.name)}</h3></div></header><div class="gala-winner-v710">🏆 <strong>${nameWithPlayer(a.winner,s)}</strong></div><div class="gala-nominees-v710">${a.results.map((r,i)=>`<div class="${i===0?'winner':''}"><span><i class="gala-place-v711">${i+1}.</i>${nameWithPlayer(r.name,s)}</span><b>${Number(r.percent).toFixed(1)}%</b></div>`).join('')}</div></article>`}
function render(){if(rendering)return;const target=$('#galaResults'),s=state();if(!target||!s||!categories.length)return;rendering=true;try{const y=Number($('#galaModalYear')?.textContent)||yearOf(s),done=!!s.galas?.[y];let html;if(!done)html=`<div class="gala-v712-root">${preview(s)}<div class="hint">Każdy kandydat ma niezerową szansę na nominację. Po gali lista jest sortowana malejąco, a 1. miejsce wygrywa.</div></div>`;else{const g=buildAwards(s,y);html=`<div class="gala-v712-root">${playerNotice(s)}<div class="gala-v710-summary"><div><span>EDYCJA</span><b>${y}</b></div><div><span>KATEGORIE</span><b>${g.awards.length}</b></div><div><span>TWOJA WAGA</span><b>×${activityPower(s).toFixed(2)}</b></div></div><div class="gala-awards-grid-v710">${g.awards.map(a=>card(a,s)).join('')}</div></div>`}if(target.innerHTML!==html)target.innerHTML=html;const h=target.closest('section')?.querySelector('h3');if(h)h.textContent='KATEGORIE ZŁOTYCH MELONÓW';const st=$('#goldenMelonsStatus');if(st)st.textContent=done?`Gala ${y} zakończona • ${categories.length} kategorii • ${s.nickname} brał udział w losowaniu.`:`Gala w 52. tygodniu • ${categories.length} kategorii • ${s.nickname} jest automatycznie w puli.`}finally{rendering=false}}
function queue(delay=20){if(renderQueued)return;renderQueued=true;setTimeout(()=>{renderQueued=false;render()},delay)}
async function load(){try{const mr=await fetch(`${MANIFEST}?v712=${Date.now()}`,{cache:'no-store'}),meta=mr.ok?await mr.json():{},uf=meta.usersFile||'users.txt',gf=meta.goldenMelonsCategoriesFile||'golden-melons-v710.json';const[ur,gr]=await Promise.all([fetch(`./data/${uf}?t=${Date.now()}`,{cache:'no-store'}),fetch(`./data/${gf}?t=${Date.now()}`,{cache:'no-store'})]);if(ur.ok)users=parseUsers(await ur.text());if(gr.ok){const x=await gr.json();categories=Array.isArray(x)?x:[]}}catch(e){console.warn('Gala V7.12:',e)}finally{queue()}}
function init(){load();const target=$('#galaResults'),modal=$('#goldenMelonsModal'),year=$('#galaModalYear');if(target)new MutationObserver(()=>{if(!target.querySelector('.gala-v712-root'))queue()}).observe(target,{childList:true,subtree:false});if(modal)new MutationObserver(()=>{if(!modal.classList.contains('hidden'))queue(40)}).observe(modal,{attributes:true,attributeFilter:['class']});if(year)new MutationObserver(()=>{if(!modal?.classList.contains('hidden'))queue()}).observe(year,{childList:true,characterData:true,subtree:true});document.addEventListener('click',e=>{if(e.target.closest('#goldenMelonsBtn'))queue(80)});const v=$('.mini-user span');if(v)v.textContent='● online • V7.12'}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
