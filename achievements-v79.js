(()=>{'use strict';
const AUTO='melon_auto_v5',WALLET='melon_wallet_v74',UNLOCKS='melon_achievement_unlocks_v79',MANIFEST='./data/database.json';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let achievements=[],filter='all',category='all',boot=true,lastSignature='';
function json(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}}
function state(){return json(AUTO)}
function unlocks(){const x=json(UNLOCKS);return new Set(Array.isArray(x)?x:[])}
function saveUnlocks(s){localStorage.setItem(UNLOCKS,JSON.stringify([...s]))}
function galas(s){return Object.values(s?.galas||{}).filter(Boolean)}
function key(s=''){return String(s).trim().toLocaleLowerCase('pl')}
function metric(s,n){
 if(!s)return 0;
 if(n==='completedWeeks')return Math.max(0,Number(s.turn||1)-1);
 if(n==='totalDecisions')return Math.max(0,Number(s.goodChoices||0)+Number(s.badChoices||0));
 if(n==='goodRate'){const t=Math.max(0,Number(s.goodChoices||0)+Number(s.badChoices||0));return t?Number(s.goodChoices||0)/t*100:0}
 if(n==='galaCount')return galas(s).length;
 if(n==='galaNominationCount'){const nick=key(s.nickname);return galas(s).filter(g=>Array.isArray(g.nominees)&&g.nominees.some(x=>key(x)===nick)).length}
 if(n==='galaWinCount'){const nick=key(s.nickname);return galas(s).filter(g=>key(g.winner)===nick).length}
 if(n==='ending')return s.ended?String(s.ending||''):'';
 if(n==='difficulty')return String(s.difficulty||'normal');
 if(n==='melons'){const w=Number(localStorage.getItem(WALLET));return Number.isFinite(w)?Math.max(0,w):Math.max(0,Number(s.melons||0))}
 const v=s[n];return typeof v==='string'?v:Number(v||0);
}
function doneCond(s,c){const cur=metric(s,c.metric),v=c.value,op=c.operator||'gte';if(op==='eq')return String(cur)===String(v);if(op==='lte')return Number(cur)<=Number(v);if(op==='lt')return Number(cur)<Number(v);if(op==='gt')return Number(cur)>Number(v);return Number(cur)>=Number(v)}
function progressCond(s,c){if(doneCond(s,c))return 100;const cur=Number(metric(s,c.metric)),v=Number(c.value),op=c.operator||'gte';if(!Number.isFinite(cur)||!Number.isFinite(v)||op==='eq')return 0;if(op==='lte')return cur<=0?100:Math.max(0,Math.min(99,v/Math.max(cur,.01)*100));if(v<=0)return 0;return Math.max(0,Math.min(99,cur/v*100))}
function evaluate(a,s,set){const cs=Array.isArray(a.conditions)?a.conditions:[],now=cs.length>0&&cs.every(c=>doneCond(s,c)),was=set.has(a.id),done=now||was,p=done?100:(cs.length?Math.round(cs.reduce((x,c)=>x+progressCond(s,c),0)/cs.length):0);return{...a,done,now,progress:p}}
function rarity(r){return({common:'POSPOLITE',uncommon:'NIEPOSPOLITE',rare:'RZADKIE',epic:'EPICKIE',legendary:'LEGENDARNE'})[r]||String(r||'').toUpperCase()}
function rarityScore(r){return({common:1,uncommon:2,rare:3,epic:4,legendary:5})[r]||0}
function toast(a){let el=$('#achievementToastV78');if(!el){el=document.createElement('div');el.id='achievementToastV78';el.className='achievement-toast-v78';document.body.appendChild(el)}el.innerHTML=`<div class="ach-toast-icon">${esc(a.icon||'🏆')}</div><div><span>ODBLOCKOWANO OSIĄGNIĘCIE</span><strong>${esc(a.title)}</strong><small>${esc(a.description)}</small></div>`;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),3600)}
function ensureUi(){
 const panel=$('.panel.milestones');
 if(panel&&!$('#achievementsOpenV78')){const f=document.createElement('div');f.className='ach-v78-panel-footer';f.innerHTML='<div id="achievementSummaryV78" class="ach-v78-summary"></div><button type="button" class="btn small" id="achievementsOpenV78">WSZYSTKIE OSIĄGNIĘCIA</button>';panel.appendChild(f);$('#achievementsOpenV78').onclick=openModal}
 if(!$('#achievementsModalV78')){const m=document.createElement('div');m.id='achievementsModalV78';m.className='modal hidden';m.innerHTML=`<div class="modal-window achievements-window-v78"><div class="modal-head"><div><div class="eyebrow">KARIERA • KOLEKCJA V7.9</div><h2>🏆 Osiągnięcia</h2></div><button class="close" id="achievementsCloseV78">×</button></div><div class="ach-v78-toolbar"><div class="ach-v78-filters"><button class="btn small active" data-ach-filter="all">WSZYSTKIE</button><button class="btn small" data-ach-filter="unlocked">ODBLOKOWANE</button><button class="btn small" data-ach-filter="locked">DO ZDOBYCIA</button></div><select id="achievementCategoryV78"><option value="all">Wszystkie kategorie</option></select></div><div id="achievementsModalSummaryV78" class="ach-v78-modal-summary"></div><div id="achievementsGridV78" class="ach-v78-grid"></div></div>`;document.body.appendChild(m);$('#achievementsCloseV78').onclick=()=>m.classList.add('hidden');m.onclick=e=>{if(e.target===m)m.classList.add('hidden')};m.querySelectorAll('[data-ach-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.achFilter;m.querySelectorAll('[data-ach-filter]').forEach(x=>x.classList.toggle('active',x===b));render()});$('#achievementCategoryV78').onchange=e=>{category=e.target.value;render()}}
 const sel=$('#achievementCategoryV78');if(sel&&sel.options.length<=1)[...new Set(achievements.map(a=>a.category).filter(Boolean))].forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=c;sel.appendChild(o)})
}
function mini(a){return`<div class="ach-v78-mini ${a.done?'done':'locked'}"><div class="ach-v78-mini-icon">${esc(a.icon||'🏆')}</div><div class="ach-v78-mini-copy"><div><strong>${esc(a.title)}</strong><span class="ach-rarity ${esc(a.rarity||'common')}">${esc(rarity(a.rarity))}</span></div><small>${esc(a.description)}</small>${a.done?'<div class="ach-v78-unlocked">✓ ODBLOKOWANE</div>':`<div class="ach-v78-progress"><i style="width:${a.progress}%"></i></div><em>${a.progress}% • ${esc(a.requirement||'')}</em>`}</div></div>`}
function card(a){return`<article class="ach-v78-card ${a.done?'done':'locked'} rarity-${esc(a.rarity||'common')}"><div class="ach-v78-card-top"><div class="ach-v78-big-icon">${esc(a.icon||'🏆')}</div><div><span class="ach-v78-category">${esc(a.category||'INNE')}</span><h3>${esc(a.title)}</h3></div><span class="ach-rarity ${esc(a.rarity||'common')}">${esc(rarity(a.rarity))}</span></div><p>${esc(a.description)}</p><div class="ach-v78-requirement"><b>WARUNEK</b><span>${esc(a.requirement||'')}</span></div>${a.done?'<div class="ach-v78-card-done">✓ ODBLOKOWANE</div>':`<div class="ach-v78-card-progress"><div><span>Postęp</span><b>${a.progress}%</b></div><div class="ach-v78-progress"><i style="width:${a.progress}%"></i></div></div>`}</article>`}
function render(){
 if(!achievements.length)return;ensureUi();const s=state(),set=unlocks(),items=achievements.map(a=>evaluate(a,s,set));
 const fresh=items.filter(x=>x.now&&!set.has(x.id));fresh.forEach(x=>set.add(x.id));if(fresh.length)saveUnlocks(set);if(!boot)fresh.slice(0,3).forEach((a,i)=>setTimeout(()=>toast(a),i*3900));boot=false;
 const done=items.filter(x=>x.done).sort((a,b)=>rarityScore(b.rarity)-rarityScore(a.rarity)).slice(0,2),locked=items.filter(x=>!x.done).sort((a,b)=>b.progress-a.progress).slice(0,Math.max(0,5-done.length)),list=$('#milestonesList');if(list)list.innerHTML=`<div class="ach-v78-compact">${[...done,...locked].map(mini).join('')||'<div class="hint">Rozpocznij karierę, aby zdobywać osiągnięcia.</div>'}</div>`;
 const n=items.filter(x=>x.done).length,total=items.length,p=total?Math.round(n/total*100):0,summary=$('#achievementSummaryV78');if(summary)summary.innerHTML=`<strong>${n}/${total}</strong><span>odblokowanych • ${p}%</span>`;
 const grid=$('#achievementsGridV78');if(grid){let view=items;if(filter==='unlocked')view=view.filter(x=>x.done);if(filter==='locked')view=view.filter(x=>!x.done);if(category!=='all')view=view.filter(x=>x.category===category);view=[...view].sort((a,b)=>Number(b.done)-Number(a.done)||rarityScore(b.rarity)-rarityScore(a.rarity)||a.title.localeCompare(b.title,'pl'));grid.innerHTML=view.map(card).join('')||'<div class="hint">Brak osiągnięć dla wybranych filtrów.</div>'}
 const ms=$('#achievementsModalSummaryV78');if(ms)ms.innerHTML=`<div><span>ODBLOKOWANO</span><strong>${n} / ${total}</strong></div><div><span>UKOŃCZENIE KOLEKCJI</span><strong>${p}%</strong></div><div><span>POZOSTAŁO</span><strong>${total-n}</strong></div>`;
}
function openModal(){ensureUi();render();$('#achievementsModalV78')?.classList.remove('hidden')}
async function load(){try{const mr=await fetch(`${MANIFEST}?ach79=${Date.now()}`,{cache:'no-store'});if(!mr.ok)throw Error(`manifest HTTP ${mr.status}`);const meta=await mr.json(),file=meta.achievementsFile||'achievements-v79.json',r=await fetch(`./data/${file}?v=${encodeURIComponent(meta.databaseVersion||'0')}&t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw Error(`${file}: HTTP ${r.status}`);const d=await r.json();if(!Array.isArray(d))throw Error('Nieprawidłowa baza osiągnięć');achievements=d.filter(a=>a?.id&&a?.title);render()}catch(e){console.error('Achievements V7.9:',e);const l=$('#milestonesList');if(l)l.innerHTML=`<div class="hint">Nie udało się załadować osiągnięć: ${esc(e.message)}</div>`}}
function signature(){const s=localStorage.getItem(AUTO)||'',w=localStorage.getItem(WALLET)||'';return s+'|'+w}
function init(){ensureUi();load();setInterval(()=>{const x=signature();if(x!==lastSignature){lastSignature=x;render()}},650);const v=document.querySelector('.mini-user span');if(v)v.textContent='● online • V7.9'}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
