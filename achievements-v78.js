(()=>{'use strict';
const AUTO='melon_auto_v5';
const WALLET='melon_wallet_v74';
const UNLOCKS='melon_achievement_unlocks_v78';
const MANIFEST='./data/database.json';
const $=s=>document.querySelector(s);
let achievements=[];
let firstEvaluation=true;
let rendering=false;
let filter='all';
let category='all';
let toastQueue=[];
let toastBusy=false;
const nativeSet=Storage.prototype.setItem;

function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function key(s=''){return String(s).trim().toLocaleLowerCase('pl')}
function loadJson(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}}
function state(){return loadJson(AUTO)}
function unlockedSet(){const x=loadJson(UNLOCKS);return new Set(Array.isArray(x)?x:[])}
function saveUnlocked(set){nativeSet.call(localStorage,UNLOCKS,JSON.stringify([...set]))}
function galaValues(s){return Object.values(s?.galas||{}).filter(Boolean)}
function metric(s,name){
  if(!s)return 0;
  if(name==='completedWeeks')return Math.max(0,Number(s.turn||1)-1);
  if(name==='totalDecisions')return Math.max(0,Number(s.goodChoices||0)+Number(s.badChoices||0));
  if(name==='goodRate'){
    const total=Math.max(0,Number(s.goodChoices||0)+Number(s.badChoices||0));
    return total?Number(s.goodChoices||0)/total*100:0;
  }
  if(name==='galaCount')return galaValues(s).length;
  if(name==='galaNominationCount'){
    const n=key(s.nickname);
    return galaValues(s).filter(g=>Array.isArray(g.nominees)&&g.nominees.some(x=>key(x)===n)).length;
  }
  if(name==='galaWinCount'){
    const n=key(s.nickname);
    return galaValues(s).filter(g=>key(g.winner)===n).length;
  }
  if(name==='ending')return s.ended?String(s.ending||''):'';
  if(name==='melons'){
    const w=Number(localStorage.getItem(WALLET));
    return Number.isFinite(w)?Math.max(0,w):Math.max(0,Number(s.melons||0));
  }
  return Number(s[name]||0);
}
function conditionDone(s,c){
  const cur=metric(s,c.metric),v=c.value,op=c.operator||'gte';
  if(op==='eq')return String(cur)===String(v);
  if(op==='lte')return Number(cur)<=Number(v);
  if(op==='gt')return Number(cur)>Number(v);
  if(op==='lt')return Number(cur)<Number(v);
  return Number(cur)>=Number(v);
}
function conditionProgress(s,c){
  if(conditionDone(s,c))return 100;
  const cur=Number(metric(s,c.metric)),v=Number(c.value),op=c.operator||'gte';
  if(!Number.isFinite(cur)||!Number.isFinite(v)||op==='eq')return 0;
  if(op==='lte')return cur<=0?100:Math.max(0,Math.min(99,v/cur*100));
  if(v<=0)return 0;
  return Math.max(0,Math.min(99,cur/v*100));
}
function evaluate(s,a){
  const cs=Array.isArray(a.conditions)?a.conditions:[];
  const done=cs.length>0&&cs.every(c=>conditionDone(s,c));
  const progress=cs.length?cs.reduce((sum,c)=>sum+conditionProgress(s,c),0)/cs.length:0;
  return{...a,done,progress:Math.round(progress)};
}
function evaluated(){const s=state();return achievements.map(a=>evaluate(s,a))}
function rarityLabel(r){return({common:'POSPOLITE',uncommon:'NIEPOSPOLITE',rare:'RZADKIE',epic:'EPICKIE',legendary:'LEGENDARNE'})[r]||String(r||'').toUpperCase()}
function showUnlockToast(a){toastQueue.push(a);drainToast()}
function drainToast(){
  if(toastBusy||!toastQueue.length)return;
  toastBusy=true;
  const a=toastQueue.shift();
  let el=$('#achievementToastV78');
  if(!el){el=document.createElement('div');el.id='achievementToastV78';el.className='achievement-toast-v78';document.body.appendChild(el)}
  el.innerHTML=`<div class="ach-toast-icon">${esc(a.icon||'🏆')}</div><div><span>ODBLOCKOWANO OSIĄGNIĘCIE</span><strong>${esc(a.title)}</strong><small>${esc(a.description)}</small></div>`;
  el.classList.add('show');
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>{toastBusy=false;drainToast()},300)},3300);
}
function updateUnlocks(items){
  if(!state())return;
  const set=unlockedSet();
  const done=items.filter(x=>x.done);
  if(firstEvaluation){done.forEach(x=>set.add(x.id));saveUnlocked(set);firstEvaluation=false;return}
  const fresh=done.filter(x=>!set.has(x.id));
  if(!fresh.length)return;
  fresh.forEach(x=>set.add(x.id));
  saveUnlocked(set);
  fresh.forEach(showUnlockToast);
}
function ensureUi(){
  const panel=$('.panel.milestones');
  if(panel&&!$('#achievementsOpenV78')){
    const footer=document.createElement('div');
    footer.className='ach-v78-panel-footer';
    footer.innerHTML=`<div id="achievementSummaryV78" class="ach-v78-summary"></div><button type="button" class="btn small" id="achievementsOpenV78">WSZYSTKIE OSIĄGNIĘCIA</button>`;
    panel.appendChild(footer);
    $('#achievementsOpenV78').onclick=openModal;
  }
  if(!$('#achievementsModalV78')){
    const m=document.createElement('div');
    m.id='achievementsModalV78';m.className='modal hidden';
    m.innerHTML=`<div class="modal-window achievements-window-v78"><div class="modal-head"><div><div class="eyebrow">KARIERA • KOLEKCJA</div><h2>🏆 Osiągnięcia</h2></div><button class="close" id="achievementsCloseV78">×</button></div><div class="ach-v78-toolbar"><div class="ach-v78-filters"><button class="btn small active" data-ach-filter="all">WSZYSTKIE</button><button class="btn small" data-ach-filter="unlocked">ODBLOKOWANE</button><button class="btn small" data-ach-filter="locked">DO ZDOBYCIA</button></div><select id="achievementCategoryV78"><option value="all">Wszystkie kategorie</option></select></div><div id="achievementsModalSummaryV78" class="ach-v78-modal-summary"></div><div id="achievementsGridV78" class="ach-v78-grid"></div></div>`;
    document.body.appendChild(m);
    $('#achievementsCloseV78').onclick=()=>m.classList.add('hidden');
    m.onclick=e=>{if(e.target===m)m.classList.add('hidden')};
    m.querySelectorAll('[data-ach-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.achFilter;m.querySelectorAll('[data-ach-filter]').forEach(x=>x.classList.toggle('active',x===b));renderModal()});
    $('#achievementCategoryV78').onchange=e=>{category=e.target.value;renderModal()};
  }
  const sel=$('#achievementCategoryV78');
  if(sel&&sel.options.length<=1){
    [...new Set(achievements.map(a=>a.category).filter(Boolean))].forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;sel.appendChild(o)});
  }
}
function compactCard(a){
  return `<div class="ach-v78-mini ${a.done?'done':'locked'}"><div class="ach-v78-mini-icon">${esc(a.icon||'🏆')}</div><div class="ach-v78-mini-copy"><div><strong>${esc(a.title)}</strong><span class="ach-rarity ${esc(a.rarity||'common')}">${esc(rarityLabel(a.rarity))}</span></div><small>${esc(a.description)}</small>${a.done?'<div class="ach-v78-unlocked">✓ ODBLOKOWANE</div>':`<div class="ach-v78-progress"><i style="width:${a.progress}%"></i></div><em>${a.progress}% • ${esc(a.requirement||'')}</em>`}</div></div>`;
}
function renderCompact(items){
  const list=$('#milestonesList');if(!list)return;
  const done=items.filter(x=>x.done).sort((a,b)=>rarityScore(b.rarity)-rarityScore(a.rarity)).slice(0,2);
  const locked=items.filter(x=>!x.done).sort((a,b)=>b.progress-a.progress).slice(0,Math.max(0,5-done.length));
  const show=[...done,...locked];
  rendering=true;
  list.innerHTML=`<div class="ach-v78-compact">${show.map(compactCard).join('')||'<div class="hint">Rozpocznij karierę, aby zdobywać osiągnięcia.</div>'}</div>`;
  requestAnimationFrame(()=>{rendering=false});
  const summary=$('#achievementSummaryV78');
  if(summary){const n=items.filter(x=>x.done).length,p=items.length?Math.round(n/items.length*100):0;summary.innerHTML=`<strong>${n}/${items.length}</strong><span>odblokowanych • ${p}%</span>`}
}
function rarityScore(r){return({common:1,uncommon:2,rare:3,epic:4,legendary:5})[r]||0}
function modalCard(a){
  return `<article class="ach-v78-card ${a.done?'done':'locked'} rarity-${esc(a.rarity||'common')}"><div class="ach-v78-card-top"><div class="ach-v78-big-icon">${esc(a.icon||'🏆')}</div><div><span class="ach-v78-category">${esc(a.category||'INNE')}</span><h3>${esc(a.title)}</h3></div><span class="ach-rarity ${esc(a.rarity||'common')}">${esc(rarityLabel(a.rarity))}</span></div><p>${esc(a.description)}</p><div class="ach-v78-requirement"><b>WARUNEK</b><span>${esc(a.requirement||'')}</span></div>${a.done?'<div class="ach-v78-card-done">✓ ODBLOKOWANE</div>':`<div class="ach-v78-card-progress"><div><span>Postęp</span><b>${a.progress}%</b></div><div class="ach-v78-progress"><i style="width:${a.progress}%"></i></div></div>`}</article>`;
}
function renderModal(items=evaluated()){
  const grid=$('#achievementsGridV78');if(!grid)return;
  let view=items;
  if(filter==='unlocked')view=view.filter(x=>x.done);
  if(filter==='locked')view=view.filter(x=>!x.done);
  if(category!=='all')view=view.filter(x=>x.category===category);
  view=[...view].sort((a,b)=>Number(b.done)-Number(a.done)||rarityScore(b.rarity)-rarityScore(a.rarity)||a.title.localeCompare(b.title,'pl'));
  grid.innerHTML=view.map(modalCard).join('')||'<div class="hint">Brak osiągnięć spełniających wybrane filtry.</div>';
  const s=$('#achievementsModalSummaryV78');if(s){const n=items.filter(x=>x.done).length,p=items.length?Math.round(n/items.length*100):0;s.innerHTML=`<div><span>ODBLOKOWANO</span><strong>${n} / ${items.length}</strong></div><div><span>UKOŃCZENIE KOLEKCJI</span><strong>${p}%</strong></div><div><span>POZOSTAŁO</span><strong>${items.length-n}</strong></div>`}
}
function openModal(){ensureUi();renderModal();$('#achievementsModalV78')?.classList.remove('hidden')}
function renderAll(){
  if(!achievements.length)return;
  ensureUi();
  const items=evaluated();
  updateUnlocks(items);
  renderCompact(items);
  if(!$('#achievementsModalV78')?.classList.contains('hidden'))renderModal(items);
  const ver=$('.mini-user span');if(ver)ver.textContent='● online • V7.8';
}
async function loadAchievements(){
  try{
    const mr=await fetch(`${MANIFEST}?ach=${Date.now()}`,{cache:'no-store'});if(!mr.ok)throw Error(`manifest HTTP ${mr.status}`);
    const meta=await mr.json(),file=meta.achievementsFile||'achievements-v78.json';
    const r=await fetch(`./data/${file}?v=${encodeURIComponent(meta.databaseVersion||'0')}&t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw Error(`${file}: HTTP ${r.status}`);
    const data=await r.json();if(!Array.isArray(data))throw Error('Nieprawidłowa baza osiągnięć');
    achievements=data.filter(a=>a&&a.id&&a.title);
    ensureUi();renderAll();
  }catch(e){console.error('Achievements V7.8:',e);const list=$('#milestonesList');if(list)list.innerHTML=`<div class="hint">Nie udało się załadować bazy osiągnięć: ${esc(e.message)}</div>`}
}
function bindObservers(){
  const list=$('#milestonesList');
  if(list)new MutationObserver(()=>{if(!rendering)setTimeout(renderAll,0)}).observe(list,{childList:true,subtree:true});
  for(const id of['moneyValue','scoreValue','turnSubtitle','eventsCount','goodChoices','badChoices','statsBars']){
    const el=$('#'+id);if(el)new MutationObserver(()=>setTimeout(renderAll,0)).observe(el,{childList:true,characterData:true,subtree:true});
  }
  Storage.prototype.setItem=function(k,v){const r=nativeSet.call(this,k,v);if(this===localStorage&&k===AUTO)setTimeout(renderAll,0);return r};
}
function init(){bindObservers();loadAchievements();if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js?v=7.8.0').catch(()=>{})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
