(()=>{'use strict';
const AUTO='melon_auto_v5',STORE='melon_gala_categories_v711',MANIFEST='./data/database.json';
const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key=s=>String(s||'').trim().toLocaleLowerCase('pl');
let users=[],categories=[],renderQueued=false;
function json(k,f={}){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function state(){return json(AUTO,null)}
function hash32(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h>>>0}
function unit(seed){return(hash32(seed)%10001)/10000}
function careerId(s){return String(s?.startProfileV79?.rolledAt||`${s?.nickname||'user'}|${s?.difficulty||'normal'}|${s?.startYear||2026}`)}
function yearOf(s){return 2026+Math.floor((Math.max(1,Number(s?.turn||1))-1)/52)}
function activityPower(s){if(!s)return 1;const a=clamp(Number(s.activity||0),0,100),l=Math.max(1,Number(s.level||1)),st=Math.max(0,Number(s.streak||0));return clamp(1+(a/100)*.8+Math.max(0,l-1)*.06+Math.min(st,10)*.02,1,2.8)}
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
 const noise=.88+unit(`${year}|${cat.id}|${name}|noise`)*.24;
 if(key(name)===key(s.nickname))v*=activityPower(s);
 return Math.max(1,v*noise)
}
function normalizedResults(nominees,cat,s,year,fixedWinner=''){let rows=nominees.map(name=>({name,score:scoreFor(name,cat,s,year)}));
 if(fixedWinner){const w=rows.find(r=>key(r.name)===key(fixedWinner));if(w){const max=Math.max(...rows.map(r=>r.score));w.score=Math.max(w.score,max*1.18)}}
 const sum=rows.reduce((a,b)=>a+b.score,0);rows=rows.map(r=>({name:r.name,percent:Math.round(r.score/sum*1000)/10}));
 rows.sort((a,b)=>b.percent-a.percent||a.name.localeCompare(b.name,'pl'));
 const diff=Math.round((100-rows.reduce((a,b)=>a+b.percent,0))*10)/10;rows[0].percent=Math.round((rows[0].percent+diff)*10)/10;
 rows.sort((a,b)=>b.percent-a.percent||a.name.localeCompare(b.name,'pl'));return rows
}
function buildAwards(s,year){const root=json(STORE,{}),cid=careerId(s);root[cid]=root[cid]||{};if(root[cid][year]?.schema===711)return root[cid][year];
 const base=s.galas?.[year],awards=[];
 for(const cat of categories){let nominees,fixed='';if(cat.id==='uzytkownik_roku'&&Array.isArray(base?.nominees)&&base.nominees.length>=3){nominees=base.nominees.slice(0,3);fixed=base.winner||''}else{nominees=[...users].sort((a,b)=>scoreFor(b,cat,s,year)-scoreFor(a,cat,s,year)||a.localeCompare(b,'pl')).slice(0,3)}
  if(nominees.length<3)continue;const results=normalizedResults(nominees,cat,s,year,fixed),winner=results[0].name;awards.push({...cat,nominees:results.map(r=>r.name),winner,results})}
 root[cid][year]={schema:711,year,generatedAt:new Date().toISOString(),awards};localStorage.setItem(STORE,JSON.stringify(root));return root[cid][year]
}
function preview(){return`<div class="gala-preview-v710"><div class="gala-preview-head-v710"><span>🏆 ${categories.length} kategorii</span><b>Losowanie w 52. tygodniu</b></div><div class="gala-category-preview-grid-v710">${categories.map(c=>`<div class="gala-category-pill-v710 tone-${esc(c.tone)} ${c.overall?'overall-v711':''}"><span>${c.icon}</span><strong>${esc(c.name)}</strong><small>${esc(c.description)}</small></div>`).join('')}</div></div>`}
function card(a){return`<article class="gala-award-v710 tone-${esc(a.tone)} ${a.overall?'overall-v711':''}"><header><span>${a.icon}</span><div><small>ZŁOTY MELON${a.overall?' • KATEGORIA GŁÓWNA':''}</small><h3>${esc(a.name)}</h3></div></header><div class="gala-winner-v710">🏆 <strong>${esc(a.winner)}</strong></div><div class="gala-nominees-v710">${a.results.map((r,i)=>`<div class="${i===0?'winner':''}"><span><i class="gala-place-v711">${i+1}.</i>${esc(r.name)}</span><b>${Number(r.percent).toFixed(1)}%</b></div>`).join('')}</div></article>`}
function render(){const target=$('#galaResults'),s=state();if(!target||!s||!categories.length)return;const y=Number($('#galaModalYear')?.textContent)||yearOf(s),done=!!s.galas?.[y];let html;if(!done)html=`<div class="gala-v711-root">${preview()}<div class="hint">Po gali wyniki w każdej kategorii będą uporządkowane od najwyższego do najniższego procentu. Zwycięzcą zostanie 1. miejsce.</div></div>`;else{const g=buildAwards(s,y);html=`<div class="gala-v711-root"><div class="gala-v710-summary"><div><span>EDYCJA</span><b>${y}</b></div><div><span>KATEGORIE</span><b>${g.awards.length}</b></div><div><span>ZASADA</span><b>1. MIEJSCE = WYGRANA</b></div></div><div class="gala-awards-grid-v710">${g.awards.map(card).join('')}</div></div>`}
 if(target.innerHTML!==html)target.innerHTML=html;const h=target.closest('section')?.querySelector('h3');if(h)h.textContent='KATEGORIE ZŁOTYCH MELONÓW';const st=$('#goldenMelonsStatus');if(st)st.textContent=done?`Gala ${y} zakończona • ${categories.length} kategorii • wyniki posortowane.`:`Gala w 52. tygodniu • ${categories.length} kategorii.`}
function queue(){if(renderQueued)return;renderQueued=true;setTimeout(()=>{renderQueued=false;render()},20)}
async function load(){try{const mr=await fetch(`${MANIFEST}?v711=${Date.now()}`,{cache:'no-store'}),meta=mr.ok?await mr.json():{},uf=meta.usersFile||'users.txt',gf=meta.goldenMelonsCategoriesFile||'golden-melons-v710.json';const[ur,gr]=await Promise.all([fetch(`./data/${uf}?t=${Date.now()}`,{cache:'no-store'}),fetch(`./data/${gf}?t=${Date.now()}`,{cache:'no-store'})]);if(ur.ok){const seen=new Set();users=(await ur.text()).split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#')&&!x.startsWith('//')&&!seen.has(key(x))&&seen.add(key(x)))}if(gr.ok){const x=await gr.json();categories=Array.isArray(x)?x:[]}}catch(e){console.warn('Gala V7.11:',e)}finally{queue()}}
function init(){load();const target=$('#galaResults');if(target)new MutationObserver(()=>{if(!target.querySelector('.gala-v711-root'))queue()}).observe(target,{childList:true,subtree:false});document.addEventListener('click',e=>{if(e.target.closest('#goldenMelonsBtn'))setTimeout(queue,60)});setInterval(()=>{if(!$('#goldenMelonsModal')?.classList.contains('hidden'))queue();const v=$('.mini-user span');if(v)v.textContent='● online • V7.11'},350)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
