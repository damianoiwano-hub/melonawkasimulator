(()=>{'use strict';

const AUTO='melon_auto_v5';
const SLOT='melon_slot_v5_';
const START_YEAR=2026;
const WEEKS=52;
const XP=250;
const MANIFEST='./data/database.json';

const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const defs=[
  ['reputation','Reputacja','greenbar'],
  ['activity','Aktywność','bluebar'],
  ['popularity','Rozpoznawalność',''],
  ['controversy','Kontrowersyjność',''],
  ['trust','Zaufanie','greenbar']
];
const archetypes={
  lurker:{activity:-8,trust:3,controversy:-5,popularity:-2,reputation:2},
  regular:{activity:4,trust:3,reputation:3},
  memer:{activity:5,popularity:6,controversy:2},
  debater:{activity:6,controversy:6,reputation:1},
  helper:{trust:8,reputation:6,activity:2}
};
const starts={
  fresh:{melons:100,popularity:8},
  known:{melons:140,popularity:18,reputation:8},
  veteran:{melons:180,popularity:28,reputation:12,trust:10}
};
const diffs={
  easy:{p:1.2,n:.8},
  normal:{p:1,n:1},
  hard:{p:.9,n:1.25}
};

let state=load(AUTO);
let events=[];
let autoEvents=[];
let serverUsers=[];
let meta={
  databaseVersion:'-',
  packs:[],
  automaticPacks:[],
  automaticEventChance:.28,
  usersFile:'users.txt',
  decisionPointDefaults:{
    positive:{plusChanceMin:65,plusChanceMax:85,minusMultiplierMin:.45,minusMultiplierMax:.75,plusMultiplierMin:.9,plusMultiplierMax:1.2},
    negative:{plusChanceMin:20,plusChanceMax:45,minusMultiplierMin:.9,minusMultiplierMax:1.25,plusMultiplierMin:.4,plusMultiplierMax:.7}
  }
};
let ready=false;
let current=null;
let galaOpening=false;

function rng(){
  try{
    if(globalThis.crypto?.getRandomValues){
      const a=new Uint32Array(1);
      crypto.getRandomValues(a);
      return a[0]/4294967296;
    }
  }catch{}
  return Math.random();
}
function rnd(a,b){return a+rng()*(b-a)}
function shuffle(a){
  const b=[...a];
  for(let i=b.length-1;i>0;i--){
    const j=Math.floor(rng()*(i+1));
    [b[i],b[j]]=[b[j],b[i]];
  }
  return b;
}
function pickOne(a){return a[Math.floor(rng()*a.length)]}
function esc(s=''){
  return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function key(s){return String(s||'').trim().toLocaleLowerCase('pl')}
function load(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}}
function save(){if(state)localStorage.setItem(AUTO,JSON.stringify(state))}
function toast(t){
  const e=$('toast');
  if(!e)return;
  e.textContent=t;
  e.classList.remove('hidden');
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>e.classList.add('hidden'),2400);
}
function hash32(str){
  let h=2166136261>>>0;
  for(let i=0;i<str.length;i++){
    h^=str.charCodeAt(i);
    h=Math.imul(h,16777619)>>>0;
  }
  return h>>>0;
}
function hashRange(seed,min,max,shift=0){
  min=Number(min);max=Number(max);
  if(!Number.isFinite(min))min=0;
  if(!Number.isFinite(max))max=min;
  if(max<min)[min,max]=[max,min];
  const span=max-min;
  if(span<=0)return min;
  const part=((seed>>>shift)&0xffff)/0xffff;
  return min+part*span;
}
function role(s){
  if(s.level>=10&&s.reputation>=65)return'LEGENDA';
  if(s.trust>=75&&s.level>=6)return'AUTORYTET';
  if(s.popularity>=70)return'CELEBRYTA';
  if(s.controversy>=72)return'KONTROWERSYJNY';
  if(s.level>=5)return'WETERAN';
  if(s.level>=3)return'STAŁY BYWALEC';
  return'NOWICJUSZ';
}
function normalizeState(s){
  for(const k of ['reputation','activity','popularity','controversy','trust']){
    s[k]=clamp(Number(s[k]??50),0,100);
  }
  s.score=Math.max(0,Math.round(Number(s.score||0)));
  s.melons=Math.max(0,Math.round(Number(s.melons||0)));
  s.level=Math.max(1,Math.floor(s.score/XP)+1);
  s.bestLevel=Math.max(Number(s.bestLevel||1),s.level);
  s.startYear=START_YEAR;
  s.eventCount=Math.max(0,Number(s.eventCount||0));
  s.autoEventCount=Math.max(0,Number(s.autoEventCount||0));
  s.goodChoices=Math.max(0,Number(s.goodChoices||0));
  s.badChoices=Math.max(0,Number(s.badChoices||0));
  if(!Array.isArray(s.history))s.history=[];
  if(!s.galas||typeof s.galas!=='object'||Array.isArray(s.galas))s.galas={};
  if(!Array.isArray(s.galaNominationCycleUsed)){
    s.galaNominationCycleUsed=[];
    for(const g of Object.values(s.galas)){
      const n=Array.isArray(g?.nominees)?g.nominees:[];
      s.galaNominationCycleUsed.push(...n);
    }
  }
  if(!Array.isArray(s.galaWinnerCycleUsed)){
    s.galaWinnerCycleUsed=Object.values(s.galas).map(g=>g?.winner).filter(Boolean);
  }
  s.role=role(s);
  s.status=s.ended
    ?(s.ending==='moderator'?'MODERATOR':'ZBANOWANY')
    :(s.reputation<=12||s.trust<=10?'Na krawędzi bana':s.controversy>=85?'Centrum dramy':'Aktywny');
  return s;
}
function fresh(){
  const s={
    nickname:$('nicknameInput').value.trim()||'Użytkownik',
    archetype:$('archetypeInput').value,
    startPoint:$('startPointInput').value,
    difficulty:$('difficultyInput').value,
    turn:1,score:0,level:1,bestLevel:1,melons:100,streak:0,
    reputation:50,activity:50,popularity:10,controversy:15,trust:45,
    eventCount:0,autoEventCount:0,goodChoices:0,badChoices:0,
    history:[],ended:false,ending:null,galas:{},
    galaNominationCycleUsed:[],galaWinnerCycleUsed:[]
  };
  Object.assign(s,starts[s.startPoint]||{});
  for(const[k,v]of Object.entries(archetypes[s.archetype]||{}))s[k]=(s[k]||0)+v;
  s.score=0;s.level=1;s.bestLevel=1;
  return normalizeState(s);
}
function year(){return START_YEAR+Math.floor((Math.max(1,state?.turn||1)-1)/WEEKS)}
function week(){return((Math.max(1,state?.turn||1)-1)%WEEKS)+1}
function utility(e={}){
  const w={reputation:1.2,trust:1.3,popularity:.6,activity:.18,controversy:-1.25,score:.045,melons:.03,streak:1.5};
  return Object.entries(e).reduce((s,[k,v])=>s+(w[k]||0)*(Number(v)||0),0);
}

function pointDefaultsFor(outcome){
  const hardcoded=outcome==='negative'
    ?{plusChanceMin:20,plusChanceMax:45,minusMultiplierMin:.9,minusMultiplierMax:1.25,plusMultiplierMin:.4,plusMultiplierMax:.7}
    :{plusChanceMin:65,plusChanceMax:85,minusMultiplierMin:.45,minusMultiplierMax:.75,plusMultiplierMin:.9,plusMultiplierMax:1.2};
  return {...hardcoded,...(meta?.decisionPointDefaults?.[outcome]||{})};
}
function normalizeCustomPointChances(raw){
  if(!Array.isArray(raw)||raw.length<2)return null;
  const clean=raw.map(x=>({chance:Number(x?.chance),points:Math.trunc(Number(x?.points))})).filter(x=>Number.isFinite(x.chance)&&x.chance>0&&Number.isFinite(x.points));
  if(clean.length<2)return null;
  const total=clean.reduce((s,x)=>s+x.chance,0);
  if(total<=0)return null;
  let normalized=clean.map(x=>({chance:Math.round((x.chance/total)*1000)/10,points:x.points}));
  const diff=Math.round((100-normalized.reduce((s,x)=>s+x.chance,0))*10)/10;
  normalized[0].chance=Math.round((normalized[0].chance+diff)*10)/10;
  return normalized;
}
function derivedPointChances(eventId,choice){
  const custom=normalizeCustomPointChances(choice.pointChances);
  if(custom)return custom;
  const outcome=choice.outcome==='negative'?'negative':'positive';
  const cfg=pointDefaultsFor(outcome);
  const seed=hash32(`${eventId}|${choice.label||''}|${outcome}`);
  const base=Math.max(10,Math.abs(Math.trunc(Number(choice.effects?.score)||20)));
  const plusChance=Math.round(hashRange(seed,cfg.plusChanceMin,cfg.plusChanceMax,0));
  const plusMult=hashRange(seed,cfg.plusMultiplierMin,cfg.plusMultiplierMax,8);
  const minusMult=hashRange(seed,cfg.minusMultiplierMin,cfg.minusMultiplierMax,16);
  const plusPoints=Math.max(5,Math.round(base*plusMult/5)*5);
  const minusPoints=-Math.max(5,Math.round(base*minusMult/5)*5);
  return [
    {chance:plusChance,points:plusPoints},
    {chance:100-plusChance,points:minusPoints}
  ];
}
function chanceLabel(chances){
  return chances.map(x=>`${x.chance}% → ${x.points>0?'+':''}${x.points} PKT`).join('  •  ');
}
function rollPointOutcome(chances){
  const total=chances.reduce((s,x)=>s+Number(x.chance||0),0);
  let r=rng()*total;
  for(const x of chances){
    r-=Number(x.chance||0);
    if(r<=0)return x;
  }
  return chances[chances.length-1];
}
function applyExactScore(points){
  const p=Math.trunc(Number(points)||0);
  state.score=Math.max(0,state.score+p);
  normalizeState(state);
  return p;
}

function normEvent(e){
  e={...e};
  e.id=e.id||`evt_${Math.random().toString(36).slice(2)}`;
  e.title=e.title||'Event';
  e.category=e.category||'EVENT';
  e.description=e.description||'';
  e.weight=Math.max(1,Number(e.weight)||1);
  e.minTurn=Math.max(1,Number(e.minTurn)||1);
  e.enabled=e.enabled!==false;
  const src=(Array.isArray(e.choices)?e.choices:[]).map(c=>({...c,effects:c?.effects&&typeof c.effects==='object'?c.effects:{}}));
  const sorted=[...src].sort((a,b)=>utility(a.effects)-utility(b.effects));
  let pos=src.find(c=>c.outcome==='positive')||sorted.at(-1)||{label:'Podejdź rozsądnie',result:'Wychodzisz na plus.',effects:{reputation:5,score:20}};
  let neg=src.find(c=>c.outcome==='negative')||sorted[0]||{label:'Podejmij złą decyzję',result:'Sytuacja obraca się przeciwko tobie.',effects:{reputation:-5,controversy:7,score:-20}};
  pos={...pos,outcome:'positive'};
  neg={...neg,outcome:'negative'};
  pos.pointChances=derivedPointChances(e.id,pos);
  neg.pointChances=derivedPointChances(e.id,neg);
  e.choices=[pos,neg];
  return e;
}
function normAuto(e){
  e={...e};
  e.id=e.id||`auto_${Math.random().toString(36).slice(2)}`;
  e.title=e.title||'Losowe zdarzenie';
  e.category=e.category||'ZDARZENIE LOSOWE';
  e.description=e.description||'';
  e.result=e.result||'Zdarzenie kończy się bez twojej decyzji.';
  e.effects=e.effects&&typeof e.effects==='object'?e.effects:{};
  e.weight=Math.max(1,Number(e.weight)||1);
  e.minTurn=Math.max(1,Number(e.minTurn)||1);
  e.enabled=e.enabled!==false;
  return e;
}
function parseUsers(t){
  const seen=new Set(),out=[];
  for(const raw of String(t).split(/\r?\n/)){
    const n=raw.trim();
    if(!n||n.startsWith('#')||n.startsWith('//'))continue;
    const k=key(n);
    if(seen.has(k))continue;
    seen.add(k);out.push(n);
  }
  return out;
}
async function loadDatabase(){
  ready=false;
  try{
    const mr=await fetch(`${MANIFEST}?t=${Date.now()}`,{cache:'no-store'});
    if(!mr.ok)throw Error(`manifest HTTP ${mr.status}`);
    meta={...meta,...await mr.json()};
    const loaded=[];
    for(const p of meta.packs||[]){
      const r=await fetch(`./data/${p}?v=${encodeURIComponent(meta.databaseVersion||'0')}&t=${Date.now()}`,{cache:'no-store'});
      if(!r.ok)throw Error(`${p}: HTTP ${r.status}`);
      const d=await r.json();
      if(!Array.isArray(d))throw Error(`${p}: nieprawidłowa baza`);
      loaded.push(...d);
    }
    events=loaded.map(normEvent);
    const al=[];
    for(const p of meta.automaticPacks||[]){
      const r=await fetch(`./data/${p}?v=${encodeURIComponent(meta.databaseVersion||'0')}&t=${Date.now()}`,{cache:'no-store'});
      if(!r.ok)throw Error(`${p}: HTTP ${r.status}`);
      const d=await r.json();
      if(Array.isArray(d))al.push(...d);
    }
    autoEvents=al.map(normAuto);
    try{
      const f=meta.usersFile||'users.txt';
      const r=await fetch(`./data/${f}?v=${encodeURIComponent(meta.databaseVersion||'0')}&t=${Date.now()}`,{cache:'no-store'});
      serverUsers=r.ok?parseUsers(await r.text()):[];
    }catch{serverUsers=[]}
    ready=events.length>0;
    dbStatus();
  }catch(e){
    console.error(e);
    events=[];autoEvents=[];serverUsers=[];ready=false;
    dbStatus(e.message);
  }
}
function dbStatus(err=''){
  const t=ready
    ?`Baza ${meta.databaseVersion||'-'} • ${events.length} eventów • ${autoEvents.length} losowych • ${serverUsers.length} użytkowników`
    :`Baza eventów niedostępna${err?' • '+err:''}`;
  for(const id of['dbStatusStart','dbStatusGame']){
    const e=$(id);
    if(e){e.textContent=t;e.classList.toggle('db-error',!ready)}
  }
  if($('startBtn'))$('startBtn').disabled=!ready;
}
function summary(e={}){
  const n={reputation:'REP',activity:'AKT',popularity:'POP',controversy:'KON',trust:'ZAU',melons:'🍉',score:'PKT',streak:'SERIA'};
  const a=Object.entries(e).filter(([,v])=>v).map(([k,v])=>`${n[k]||k} ${v>0?'+':''}${v}`);
  return a.join(' • ')||'bez zmian';
}
function apply(e={}){
  const d=diffs[state.difficulty]||diffs.normal,out={};
  for(const[k,raw]of Object.entries(e)){
    if(k==='score')continue;
    let v=Number(raw)||0;
    if(!v)continue;
    v=Math.round(v*(v>0?d.p:d.n)*rnd(.78,1.28));
    if(!v)v=raw>0?1:-1;
    out[k]=v;
    state[k]=(state[k]||0)+v;
  }
  normalizeState(state);
  return out;
}

function render(){
  const has=!!state;
  $('startScreen').classList.toggle('hidden',has);
  $('gameScreen').classList.toggle('hidden',!has);
  if(!has)return;
  normalizeState(state);
  $('profileNick').textContent=state.nickname;
  $('profileRole').textContent=state.role;
  $('levelValue').textContent=state.level;
  $('tenureValue').textContent=`${state.turn-1} tyg.`;
  $('scoreValue').textContent=state.score;
  $('statusValue').textContent=state.status;
  $('moneyValue').textContent=state.melons;
  $('streakValue').textContent=state.streak||0;
  $('turnTitle').textContent=`TYDZIEŃ ${state.turn}`;
  $('calendarYearValue').textContent=year();
  $('turnSubtitle').textContent=`Rok ${year()} • tydzień ${week()}/52`;
  $('eventsCount').textContent=state.eventCount;
  $('goodChoices').textContent=state.goodChoices;
  $('badChoices').textContent=state.badChoices;
  $('autoEventsCount').textContent=state.autoEventCount;
  $('bestLevel').textContent=state.bestLevel;
  const inside=state.score%XP;
  $('levelProgressFill').style.width=`${Math.round(inside/XP*100)}%`;
  $('levelProgressText').textContent=`${inside} / ${XP} XP do poziomu ${state.level+1}`;
  renderBars();renderHistory();renderMilestones();renderGalaCard();
  $('nextEventBtn').disabled=!!state.ended;
  if(state.ended)showEnding(state.ending,false);else scheduleGala();
}
function renderBars(){
  $('statsBars').innerHTML=defs.map(([k,l,c])=>`<div class="${c}"><div class="barhead"><span>${l}</span><b>${Math.round(state[k])}</b></div><div class="bar"><div style="width:${state[k]}%"></div></div></div>`).join('');
}
function renderHistory(){
  $('historyList').innerHTML=state.history.length
    ?state.history.slice(0,100).map(h=>`<div class="entry ${h.outcome||''}"><div class="when">TYDZ. ${h.turn}</div><div><strong>${esc(h.title)}</strong><div class="detail">${esc(h.detail||'')}</div></div><div class="delta ${h.outcome||''}">${esc(h.delta||'')}</div></div>`).join('')
    :'<div class="hint">Jeszcze nic się nie wydarzyło.</div>';
}
function renderMilestones(){
  const m=[
    ['Pierwszy event',s=>s.eventCount>=1],
    ['Stały bywalec',s=>s.level>=3],
    ['Rozpoznawalność 60+',s=>s.popularity>=60],
    ['Zaufanie 75+',s=>s.trust>=75],
    ['Pół roku',s=>s.turn>=27],
    ['Rok',s=>s.turn>=53],
    ['Kandydat na moderatora',s=>s.level>=8&&s.trust>=70&&s.reputation>=65]
  ];
  $('milestonesList').innerHTML=m.map(([l,f])=>`<div class="mile ${f(state)?'done':''}"><span class="dot"></span>${l}</div>`).join('');
}
function weighted(a){
  let total=0;
  const w=a.map(e=>{const x=Math.max(1,Number(e.weight)||1)*rnd(.4,1.65);total+=x;return x});
  let r=rng()*total;
  for(let i=0;i<a.length;i++){r-=w[i];if(r<=0)return a[i]}
  return a.at(-1);
}
function eventPool(){
  const a=events.filter(e=>e.enabled&&state.turn>=e.minTurn);
  const recent=new Set(state.history.slice(0,15).map(h=>h.eventId));
  const b=a.filter(e=>!recent.has(e.id));
  return b.length?b:a;
}
function autoPool(){
  const a=autoEvents.filter(e=>e.enabled&&state.turn>=e.minTurn);
  const recent=new Set(state.history.slice(0,12).map(h=>h.eventId));
  const b=a.filter(e=>!recent.has(e.id));
  return b.length?b:a;
}
function draw(){
  if(!ready)return toast('Baza nie jest gotowa.');
  if(state.ended)return toast('Kariera jest zakończona.');
  if(current)return toast('Najpierw zakończ aktualny event.');
  $('eventCard')?.classList.remove('auto-event');
  const ap=autoPool();
  if(ap.length&&rng()<clamp(Number(meta.automaticEventChance??.28),0,1))return runAuto(weighted(ap));
  const p=eventPool();
  if(!p.length)return toast('Brak eventów.');
  current=normEvent(weighted(p));
  current.displayChoices=shuffle(current.choices);
  $('eventCategory').textContent=current.category;
  $('eventTitle').textContent=current.title;
  $('eventDescription').textContent=current.description;
  $('eventResult').classList.add('hidden');
  $('choiceGrid').style.gridTemplateColumns='repeat(2,minmax(0,1fr))';
  $('choiceGrid').innerHTML=current.displayChoices.map((c,i)=>{
    const type=c.outcome==='negative'?'DECYZJA RYZYKOWNA':'DECYZJA ROZSĄDNA';
    return `<button class="choice" data-choice="${i}"><strong>${esc(c.label)}</strong><span>${type}<br>${esc(chanceLabel(c.pointChances))}</span></button>`;
  }).join('');
  document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>resolveChoice(+b.dataset.choice));
  $('nextEventBtn').disabled=true;
}
function resolveChoice(i){
  const c=current?.displayChoices?.[i];
  if(!c)return;
  const ev=current;
  const decisionType=c.outcome==='negative'?'negative':'positive';
  const statEffects=apply(c.effects);
  const pointRoll=rollPointOutcome(c.pointChances);
  const scoreDelta=applyExactScore(pointRoll.points);
  const allEffects={...statEffects,score:scoreDelta};
  state.eventCount++;
  if(decisionType==='positive'){
    state.goodChoices++;
    state.streak=(state.streak||0)+1;
  }else{
    state.badChoices++;
    state.streak=0;
  }
  const rollSign=scoreDelta>=0?'PLUS':'MINUS';
  const chanceText=`Wylosowano wariant ${pointRoll.chance}%: ${scoreDelta>0?'+':''}${scoreDelta} PKT`;
  state.history.unshift({
    turn:state.turn,eventId:ev.id,category:ev.category,title:ev.title,
    detail:`${c.result||c.label} ${chanceText}.`,
    delta:summary(allEffects),
    outcome:scoreDelta>=0?'positive':'negative'
  });
  $('choiceGrid').innerHTML='';
  $('eventResult').textContent=`${c.result||'Decyzja zapisana.'}\n\nSZANSE PUNKTOWE: ${chanceLabel(c.pointChances)}\nWYNIK LOSOWANIA: ${pointRoll.chance}% → ${scoreDelta>0?'+':''}${scoreDelta} PKT (${rollSign})\nZMIANY: ${summary(allEffects)}`;
  $('eventResult').classList.remove('hidden');
  state.turn++;
  current=null;
  finishWeek();
}
function runAuto(ev){
  ev=normAuto(ev);
  $('eventCard')?.classList.add('auto-event');
  $('eventCategory').innerHTML=`${esc(ev.category)} <span class="auto-event-badge">BEZ DECYZJI</span>`;
  $('eventTitle').textContent=ev.title;
  $('eventDescription').textContent=ev.description;
  $('choiceGrid').innerHTML='';
  const out=apply(ev.effects);
  if(Number(ev.effects?.score))out.score=applyExactScore(ev.effects.score);
  $('eventResult').textContent=`ZDARZENIE AUTOMATYCZNE — bez możliwości podjęcia decyzji.\n\n${ev.result}\n\nZMIANY: ${summary(out)}`;
  $('eventResult').classList.remove('hidden');
  state.eventCount++;state.autoEventCount++;
  state.history.unshift({turn:state.turn,eventId:ev.id,category:ev.category,title:ev.title,detail:ev.result,delta:summary(out),outcome:'automatic'});
  state.turn++;current=null;finishWeek();
}
function finishWeek(){
  const ending=checkEnding();
  save();render();
  $('nextEventBtn').textContent=ending?'KARIERA ZAKOŃCZONA':'NASTĘPNY EVENT';
  if(ending)showEnding(ending);
}
function checkEnding(){
  if(state.ended)return state.ending;
  if(state.reputation<=3||state.trust<=3||state.controversy>=98){state.ended=true;state.ending='ban';return'ban'}
  if(state.level>=10&&state.trust>=80&&state.reputation>=75&&state.controversy<=35&&state.turn>=26){state.ended=true;state.ending='moderator';return'moderator'}
  return null;
}
function showEnding(type,doSave=true){
  if(!type)return;
  $('endingIcon').textContent=type==='moderator'?'🛡️':'🔨';
  $('endingTitle').textContent=type==='moderator'?'ZOSTAJESZ MODERATOREM!':'DOSTAJESZ BANA!';
  $('endingText').textContent=type==='moderator'
    ?'Po wielu tygodniach budowania reputacji i zaufania otrzymujesz rolę moderatora.'
    :'Przekraczasz granicę — kariera kończy się banem.';
  $('endingModal').classList.remove('hidden');
  if(doSave)save();
}

function previousGala(){
  const ys=Object.keys(state.galas||{}).map(Number).sort((a,b)=>b-a);
  return ys.length?state.galas[ys[0]]:null;
}
function selectNominees(){
  if(serverUsers.length<3)throw Error('data/users.txt musi zawierać minimum 3 użytkowników.');
  const prev=new Set((previousGala()?.nominees||[]).map(key));
  const used=new Set((state.galaNominationCycleUsed||[]).map(key));
  const unused=shuffle(serverUsers.filter(n=>!used.has(key(n))));
  let noms=unused.slice(0,3);
  if(noms.length<3){
    const old=[...noms];
    state.galaNominationCycleUsed=[];
    const selected=new Set(old.map(key));
    let refill=serverUsers.filter(n=>!selected.has(key(n))&&!prev.has(key(n)));
    if(refill.length<3-old.length)refill=serverUsers.filter(n=>!selected.has(key(n)));
    const fresh=shuffle(refill).slice(0,3-old.length);
    noms=[...old,...fresh];
    state.galaNominationCycleUsed.push(...fresh);
  }else state.galaNominationCycleUsed.push(...noms);
  return noms;
}
function selectWinner(noms){
  let used=new Set((state.galaWinnerCycleUsed||[]).map(key));
  let c=noms.filter(n=>!used.has(key(n)));
  if(!c.length){
    state.galaWinnerCycleUsed=[];
    const prev=key(previousGala()?.winner);
    c=noms.filter(n=>key(n)!==prev);
    if(!c.length)c=[...noms];
  }
  const w=pickOne(shuffle(c));
  state.galaWinnerCycleUsed.push(w);
  return w;
}
function galaResults(noms,winner){
  const ordered=[winner,...shuffle(noms.filter(n=>key(n)!==key(winner)))];
  const raw=ordered.map((n,i)=>({name:n,x:i?rnd(.35,1.15):rnd(1.2,1.8)}));
  const sum=raw.reduce((s,r)=>s+r.x,0);
  const out=raw.map(r=>({name:r.name,percent:Math.round(r.x/sum*1000)/10}));
  const d=Math.round((100-out.reduce((s,r)=>s+r.percent,0))*10)/10;
  out[0].percent=Math.round((out[0].percent+d)*10)/10;
  return out;
}
function runGala(){
  if(!state||state.ended||week()!==52||state.galas?.[year()])return false;
  if(serverUsers.length<3){toast('Złote Melony: uzupełnij data/users.txt (minimum 3 nicki).');return false}
  const y=year(),n=selectNominees(),w=selectWinner(n),results=galaResults(n,w);
  state.galas[y]={year:y,week:state.turn,nominees:n,winner:w,results};
  state.history.unshift({turn:state.turn,eventId:`golden_melons_${y}`,category:'ZŁOTE MELONY',title:`Złote Melony ${y} — Użytkownik Roku`,detail:`Nominowani: ${n.join(', ')}. Zwycięża ${w}.`,delta:'GALA',outcome:'automatic'});
  save();renderGalaCard();renderGalaModal(y);modal('goldenMelonsModal',true);
  toast(`Złote Melony ${y}: wygrywa ${w}!`);
  return true;
}
function scheduleGala(){
  if(galaOpening||!state||state.ended||week()!==52||state.galas?.[year()])return;
  galaOpening=true;
  setTimeout(()=>{try{runGala()}finally{galaOpening=false}},0);
}
function renderGalaCard(){
  if(!state)return;
  const y=year(),g=state.galas?.[y];
  $('goldenMelonsYear').textContent=y;
  $('goldenMelonsStatus').textContent=g
    ?`Gala ${y} zakończona. Użytkownik Roku: ${g.winner}.`
    :`Gala uruchomi się automatycznie w 52. tygodniu. Baza: ${serverUsers.length} użytkowników.`;
  $('goldenMelonsBtn').textContent=g?`ZOBACZ WYNIKI ${y}`:`PODGLĄD GALI ${y}`;
}
function renderGalaModal(y=year()){
  const g=state?.galas?.[y];
  $('galaModalYear').textContent=y;
  $('galaUsersList').innerHTML=serverUsers.length
    ?serverUsers.map(n=>`<div class="gala-user"><span>${esc(n)}</span></div>`).join('')
    :'<div class="hint">Brak użytkowników. Uzupełnij data/users.txt.</div>';
  if(!g){
    $('galaResults').innerHTML='<div class="hint">W 52. tygodniu system automatycznie wybierze 3 nominowanych i jednego zwycięzcę. Pula jest rotowana, aby ograniczać powtórki między latami.</div>';
    return;
  }
  $('galaResults').innerHTML=g.results.map((r,i)=>`<div class="gala-result-row ${key(r.name)===key(g.winner)?'winner':''}"><div class="gala-place">${i+1}.</div><strong>${esc(r.name)}</strong><b>${r.percent.toFixed(1)}%</b></div>`).join('')+`<div class="hint">🏆 Użytkownik Roku: <strong>${esc(g.winner)}</strong></div>`;
}
function openGala(){renderGalaModal(year());modal('goldenMelonsModal',true)}
function modal(id,on=true){$(id)?.classList.toggle('hidden',!on)}
function download(data,name){
  const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(b);a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
async function readJson(f){return JSON.parse(await f.text())}
function bind(){
  $('startBtn').onclick=()=>{
    if(!ready)return toast('Najpierw musi załadować się baza.');
    state=fresh();current=null;save();render();toast('Kariera rozpoczęta od poziomu 1.');
  };
  $('nextEventBtn').onclick=draw;
  $('optionsBtn').onclick=()=>modal('optionsModal');
  $('goldenMelonsBtn').onclick=openGala;
  $('saveBtn').onclick=()=>{save();toast('Zapisano.')};
  $('newCareerBtn').onclick=()=>{
    if(confirm('Rozpocząć nową karierę?')){
      state=null;current=null;localStorage.removeItem(AUTO);modal('endingModal',false);render();
    }
  };
  $('clearHistoryBtn').onclick=()=>{
    if(state&&confirm('Wyczyścić historię?')){state.history=[];save();render()}
  };
  document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>modal(b.dataset.close,false));
  document.querySelectorAll('.modal').forEach(m=>m.onclick=e=>{if(e.target===m&&m.id!=='endingModal')modal(m.id,false)});
  $('endingNewCareerBtn').onclick=()=>{state=null;current=null;localStorage.removeItem(AUTO);modal('endingModal',false);render()};
  $('exportSaveBtn').onclick=()=>state&&download(state,`melonawka-${state.nickname}.json`);
  $('importSaveInput').onchange=async e=>{
    try{state=normalizeState(await readJson(e.target.files[0]));save();render();toast('Wczytano zapis.')}catch(x){alert(x.message)}
    e.target.value='';
  };
  document.querySelectorAll('[data-save-slot]').forEach(b=>b.onclick=()=>{
    if(state){localStorage.setItem(SLOT+b.dataset.saveSlot,JSON.stringify(state));toast('Slot zapisany.')}
  });
  document.querySelectorAll('[data-load-slot]').forEach(b=>b.onclick=()=>{
    const x=load(SLOT+b.dataset.loadSlot);
    if(x){state=normalizeState(x);current=null;save();render();toast('Slot wczytany.')}else toast('Slot pusty.');
  });
  window.addEventListener('beforeunload',save);
}
async function init(){
  bind();dbStatus();await loadDatabase();
  if(state)normalizeState(state);
  render();
  if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js?v=7.3.0').catch(()=>{});
}
init();
})();
