(()=>{'use strict';
const AUTO_KEY='melon_auto_v5',SLOT='melon_slot_v5_';
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),uid=()=>`evt_${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
const defs=[['reputation','Reputacja','greenbar'],['activity','Aktywność','bluebar'],['popularity','Rozpoznawalność',''],['controversy','Kontrowersyjność',''],['trust','Zaufanie','greenbar']];
const DATABASE_MANIFEST='./data/database.json';
const START_YEAR=2026,WEEKS_PER_YEAR=52;
const archetypes={lurker:{activity:-8,trust:3,controversy:-5,popularity:-2,reputation:2},regular:{activity:4,trust:3,reputation:3},memer:{activity:5,popularity:6,controversy:2},debater:{activity:6,controversy:6,reputation:1},helper:{trust:8,reputation:6,activity:2}};
const starts={fresh:{melons:100,popularity:8},known:{melons:140,popularity:18,reputation:8},veteran:{melons:180,popularity:28,reputation:12,trust:10}};
const diff={easy:{p:1.2,n:.8},normal:{p:1,n:1},hard:{p:.9,n:1.25}};
let events=[],automaticEvents=[],databaseMeta={databaseVersion:'-',packs:[],automaticPacks:[],automaticEventChance:.28},databaseReady=false,state=load(AUTO_KEY),current=null;
function rng(){try{if(globalThis.crypto?.getRandomValues){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}}catch{}return Math.random()}
function randomBetween(a,b){return a+rng()*(b-a)}
function randomItem(a){return a[Math.floor(rng()*a.length)]}
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function choiceUtility(effects={}){const w={reputation:1.2,trust:1.3,popularity:.6,activity:.18,controversy:-1.25,score:.045,melons:.03,streak:1.5};return Object.entries(effects||{}).reduce((s,[k,v])=>s+(w[k]||0)*(Number(v)||0),0)}
function normalizeEvent(e,def=null){
  e={...e};e.id=e.id||`evt_${Math.random().toString(36).slice(2)}`;e.title=e.title||'Event';e.category=e.category||'EVENT';e.description=e.description||'';e.weight=Math.max(1,Number(e.weight)||1);e.minTurn=Math.max(1,Number(e.minTurn)||1);e.enabled=e.enabled!==false;
  const src=(Array.isArray(e.choices)&&e.choices.length?e.choices:(def?.choices||[])).map(c=>({label:c.label||'Wybór',result:c.result||'Decyzja została podjęta.',effects:(c.effects&&typeof c.effects==='object'&&!Array.isArray(c.effects))?c.effects:{},outcome:c.outcome}));
  const byType={positive:src.find(c=>c.outcome==='positive'),negative:src.find(c=>c.outcome==='negative'),neutral:src.find(c=>c.outcome==='neutral')};
  const sorted=[...src].sort((a,b)=>choiceUtility(a.effects)-choiceUtility(b.effects));
  let positive=byType.positive||sorted[sorted.length-1]||{label:'Podejdź do tego rozsądnie',result:'Wychodzisz z sytuacji na plus.',effects:{reputation:6,trust:5,score:25}};
  let negative=byType.negative||sorted[0]||{label:'Odwal coś głupiego',result:'Sytuacja obraca się przeciwko tobie.',effects:{reputation:-7,trust:-6,controversy:10,score:-8}};
  let neutral=byType.neutral||{label:'Nie angażuj się i przeczekaj',result:'Sytuacja przechodzi bokiem. Nic istotnego nie zyskujesz ani nie tracisz.',effects:{}};
  positive={...positive,outcome:'positive'};negative={...negative,outcome:'negative'};neutral={...neutral,effects:{},outcome:'neutral'};
  e.choices=[positive,negative,neutral];return e;
}
function normalizeAutomaticEvent(e){
  e={...e};e.id=e.id||`auto_${Math.random().toString(36).slice(2)}`;e.title=e.title||'Losowe zdarzenie';e.category=e.category||'ZDARZENIE LOSOWE';e.description=e.description||'';e.result=e.result||'Zdarzenie minęło bez możliwości podjęcia decyzji.';e.effects=(e.effects&&typeof e.effects==='object'&&!Array.isArray(e.effects))?e.effects:{};e.weight=Math.max(1,Number(e.weight)||1);e.minTurn=Math.max(1,Number(e.minTurn)||1);e.enabled=e.enabled!==false;return e;
}

async function loadDatabase(){
  databaseReady=false;
  try{
    const manifestResponse=await fetch(`${DATABASE_MANIFEST}?t=${Date.now()}`,{cache:'no-store'});
    if(!manifestResponse.ok)throw new Error(`manifest HTTP ${manifestResponse.status}`);
    databaseMeta=await manifestResponse.json();
    if(!Array.isArray(databaseMeta.packs)||!databaseMeta.packs.length)throw new Error('Brak paczek eventów w data/database.json');
    const loaded=[];
    for(const pack of databaseMeta.packs){
      const response=await fetch(`./data/${pack}?db=${encodeURIComponent(databaseMeta.databaseVersion||'0')}&t=${Date.now()}`,{cache:'no-store'});
      if(!response.ok)throw new Error(`${pack}: HTTP ${response.status}`);
      const data=await response.json();
      if(!Array.isArray(data))throw new Error(`${pack}: plik nie zawiera tablicy`);
      loaded.push(...data);
    }
    const ids=new Set();
    events=loaded.map(raw=>normalizeEvent(structuredClone(raw))).filter(e=>{if(ids.has(e.id))throw new Error(`Zduplikowane ID eventu: ${e.id}`);ids.add(e.id);return true});

    const automaticLoaded=[];
    for(const pack of (databaseMeta.automaticPacks||[])){
      const response=await fetch(`./data/${pack}?db=${encodeURIComponent(databaseMeta.databaseVersion||'0')}&t=${Date.now()}`,{cache:'no-store'});
      if(!response.ok)throw new Error(`${pack}: HTTP ${response.status}`);
      const data=await response.json();
      if(!Array.isArray(data))throw new Error(`${pack}: plik automatycznych zdarzeń nie zawiera tablicy`);
      automaticLoaded.push(...data);
    }
    const autoIds=new Set();
    automaticEvents=automaticLoaded.map(raw=>normalizeAutomaticEvent(structuredClone(raw))).filter(e=>{if(autoIds.has(e.id))throw new Error(`Zduplikowane ID automatycznego eventu: ${e.id}`);autoIds.add(e.id);return true});
    databaseReady=events.length>0;
    updateDatabaseStatus();
    return events;
  }catch(err){
    console.error('Błąd bazy eventów:',err);
    events=[];automaticEvents=[];databaseReady=false;updateDatabaseStatus(err.message);
    return [];
  }
}
function updateDatabaseStatus(error=''){
  const text=databaseReady?`Baza ${databaseMeta.databaseVersion||'-'} • ${events.length} eventów decyzyjnych • ${automaticEvents.length} losowych bez decyzji`:`Baza eventów niedostępna${error?' • '+error:''}`;
  for(const id of ['dbStatusStart','dbStatusGame']){const el=$(id);if(el){el.textContent=text;el.classList.toggle('db-error',!databaseReady)}}
  const start=$('startBtn');if(start)start.disabled=!databaseReady;
}


function load(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}}
function autosave(){if(state)localStorage.setItem(AUTO_KEY,JSON.stringify(state))}
function fresh(n,a,s,d){let x={nickname:n,archetype:a,startPoint:s,difficulty:d,turn:1,level:1,score:0,melons:100,streak:0,reputation:50,activity:50,popularity:10,controversy:15,trust:45,status:'Aktywny',role:'NOWICJUSZ',eventCount:0,autoEventCount:0,goodChoices:0,neutralChoices:0,badChoices:0,bestLevel:1,history:[],ended:false,ending:null,startYear:START_YEAR,galaUsers:[],galas:{}};Object.assign(x,starts[s]||{});for(const[k,v]of Object.entries(archetypes[a]||{}))x[k]=(x[k]||0)+v;x.score=0;x.level=1;x.bestLevel=1;norm(x);return x}
function norm(s){for(const k of['reputation','activity','popularity','controversy','trust'])s[k]=clamp(Number(s[k]??50),0,100);s.score=Math.max(0,Math.round(s.score||0));s.melons=Math.max(0,Math.round(s.melons||0));s.level=Math.max(1,Math.floor(1+s.score/250));s.bestLevel=Math.max(s.bestLevel||1,s.level);s.startYear=START_YEAR;if(!Array.isArray(s.galaUsers))s.galaUsers=[];if(!s.galas||typeof s.galas!=='object'||Array.isArray(s.galas))s.galas={};s.autoEventCount=Math.max(0,Number(s.autoEventCount||0));s.role=role(s);s.status=s.ended?(s.ending==='moderator'?'MODERATOR':'ZBANOWANY'):(s.reputation<=12||s.trust<=10?'Na krawędzi bana':s.controversy>=85?'Centrum dramy':'Aktywny')}
function careerYear(){return START_YEAR+Math.floor((Math.max(1,state?.turn||1)-1)/WEEKS_PER_YEAR)}
function weekOfYear(){return ((Math.max(1,state?.turn||1)-1)%WEEKS_PER_YEAR)+1}
function role(s){if(s.level>=10&&s.reputation>=65)return'LEGENDA';if(s.trust>=75&&s.level>=6)return'AUTORYTET';if(s.popularity>=70)return'CELEBRYTA';if(s.controversy>=72)return'KONTROWERSYJNY';if(s.level>=5)return'WETERAN';if(s.level>=3)return'STAŁY BYWALEC';return'NOWICJUSZ'}
function toast(t){$('toast').textContent=t;$('toast').classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').classList.add('hidden'),2200)}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function summary(e={}){const n={reputation:'REP',activity:'AKT',popularity:'POP',controversy:'KON',trust:'ZAU',melons:'🍉',score:'PKT',streak:'SERIA'};const parts=Object.entries(e).filter(([,v])=>v).map(([k,v])=>`${n[k]||k} ${v>0?'+':''}${v}`);return parts.length?parts.join(' • '):'bez zmian statystyk'}
function levelProgress(){const per=250,inside=state.score%per;return{inside,per,pct:Math.round(inside/per*100),next:state.level+1}}
function render(){const has=!!state;$('startScreen').classList.toggle('hidden',has);$('gameScreen').classList.toggle('hidden',!has);if(!has)return;norm(state);$('profileNick').textContent=state.nickname;$('profileRole').textContent=state.role;$('levelValue').textContent=state.level;$('tenureValue').textContent=`${state.turn-1} tyg.`;$('scoreValue').textContent=state.score;$('statusValue').textContent=state.status;$('moneyValue').textContent=state.melons;$('streakValue').textContent=state.streak||0;$('turnTitle').textContent=`TYDZIEŃ ${state.turn}`;$('calendarYearValue').textContent=careerYear();$('turnSubtitle').textContent=`Rok ${careerYear()} • tydzień ${weekOfYear()}/52 • `+(state.turn<5?'pierwsze tygodnie na Melonawce':state.turn<13?'budujesz swoją pozycję':state.turn<27?'społeczność zaczyna cię kojarzyć':'twój nick ma już dłuższą historię');$('eventsCount').textContent=state.eventCount||0;$('goodChoices').textContent=state.goodChoices||0;$('neutralChoices').textContent=state.neutralChoices||0;$('badChoices').textContent=state.badChoices||0;$('autoEventsCount').textContent=state.autoEventCount||0;$('bestLevel').textContent=state.bestLevel;const lp=levelProgress();$('levelProgressFill').style.width=`${lp.pct}%`;$('levelProgressText').textContent=`${lp.inside} / ${lp.per} XP do poziomu ${lp.next}`;renderBars();renderHistory();renderMile();renderGalaCard();$('nextEventBtn').disabled=!!state.ended;if(state.ended)showEnding(state.ending,false)}
function renderBars(){$('statsBars').innerHTML=defs.map(([k,l,c])=>`<div class="${c}"><div class="barhead"><span>${l}</span><b>${Math.round(state[k])}</b></div><div class="bar"><div style="width:${state[k]}%"></div></div></div>`).join('')}
function renderHistory(){$('historyList').innerHTML=state.history.length?state.history.slice(0,100).map(h=>`<div class="entry ${h.outcome|| (h.good?'good':'bad')}"><div class="when">TYDZ. ${h.turn}</div><div><strong>${esc(h.title)}</strong><div class="detail">${esc(h.detail)}</div></div><div class="delta ${h.outcome|| (h.good?'good':'bad')}">${esc(h.delta||'Bez zmian')}</div></div>`).join(''):'<div class="hint">Jeszcze nic się nie wydarzyło.</div>'}
const miles=[['Pierwszy event',s=>s.eventCount>=1],['Stały bywalec',s=>s.level>=3],['Rozpoznawalność 60+',s=>s.popularity>=60],['Zaufanie 75+',s=>s.trust>=75],['Pół roku na Melonawce',s=>s.turn>=27],['Rok na Melonawce',s=>s.turn>=53],['Kandydat na moderatora',s=>s.level>=8&&s.trust>=70&&s.reputation>=65]];
function renderMile(){$('milestonesList').innerHTML=miles.map(([l,f])=>`<div class="mile ${f(state)?'done':''}"><span class="dot"></span>${l}</div>`).join('')}

function galaNominees(){const all=[state.nickname,...(state.galaUsers||[])].map(x=>String(x||'').trim()).filter(Boolean),seen=new Set();return all.filter(n=>{const k=n.toLocaleLowerCase('pl');if(seen.has(k))return false;seen.add(k);return true})}
function renderGalaCard(){if(!state)return;const year=careerYear(),g=state.galas?.[year];$('goldenMelonsYear').textContent=year;$('goldenMelonsStatus').textContent=g?`Gala ${year} zakończona. Użytkownik Roku: ${g.winner}.`:`Gala ${year} jest dostępna. Możesz ją przeprowadzić tylko raz w tym roku.`;$('goldenMelonsBtn').textContent=g?`ZOBACZ WYNIKI ${year}`:`OTWÓRZ GALĘ ${year} / UŻYTKOWNICY`}
function renderGalaModal(){if(!state)return;const year=careerYear(),g=state.galas?.[year],names=galaNominees();$('galaModalYear').textContent=year;$('galaUsersList').innerHTML=names.map(n=>`<div class="gala-user ${n.toLocaleLowerCase('pl')===state.nickname.toLocaleLowerCase('pl')?'player':''}"><span>${esc(n)} ${n.toLocaleLowerCase('pl')===state.nickname.toLocaleLowerCase('pl')?'<small>• twoja kariera</small>':''}</span>${n.toLocaleLowerCase('pl')===state.nickname.toLocaleLowerCase('pl')?'':`<button class="btn danger" data-remove-gala-user="${esc(n)}">USUŃ</button>`}</div>`).join('');document.querySelectorAll('[data-remove-gala-user]').forEach(b=>b.onclick=()=>removeGalaUser(b.dataset.removeGalaUser));if(g){$('galaResults').innerHTML=g.results.map((r,i)=>`<div class="gala-result-row ${i===0?'winner':''}"><div class="gala-place">${i+1}.</div><strong>${esc(r.name)}</strong><b>${Number(r.percent).toFixed(1)}%</b></div>`).join('');$('runGoldenMelonsBtn').disabled=true;$('runGoldenMelonsBtn').textContent=`GALA ${year} JUŻ SIĘ ODBYŁA`}else{$('galaResults').innerHTML='<div class="hint">Wyniki kategorii „Użytkownik Roku” zostaną wygenerowane losowo po rozpoczęciu gali.</div>';$('runGoldenMelonsBtn').disabled=names.length<2;$('runGoldenMelonsBtn').textContent=names.length<2?'DODAJ MINIMUM 1 UŻYTKOWNIKA':`🎲 ZORGANIZUJ GALĘ ${year} I WYLOSUJ WYNIKI`}}
function openGoldenMelons(){renderGalaModal();modal('goldenMelonsModal',true)}
function addGalaUser(){if(!state)return;const input=$('galaUserInput'),name=input.value.trim();if(!name)return toast('Wpisz nick użytkownika.');if(galaNominees().some(n=>n.toLocaleLowerCase('pl')===name.toLocaleLowerCase('pl')))return toast('Ten użytkownik jest już na liście.');state.galaUsers.push(name);input.value='';autosave();renderGalaModal();toast('Użytkownik dodany do listy Złotych Melonów.')}
function removeGalaUser(name){if(!state)return;state.galaUsers=(state.galaUsers||[]).filter(n=>n.toLocaleLowerCase('pl')!==String(name).toLocaleLowerCase('pl'));autosave();renderGalaModal()}
function generateGalaResults(names){const rows=names.map(name=>({name,raw:randomBetween(.15,1.35)*randomBetween(.4,1.6)})).sort((a,b)=>b.raw-a.raw),total=rows.reduce((s,r)=>s+r.raw,0),out=rows.map(r=>({name:r.name,percent:Math.round(r.raw/total*1000)/10}));const sum=Math.round(out.reduce((a,r)=>a+r.percent,0)*10)/10,diff=Math.round((100-sum)*10)/10;if(out.length)out[0].percent=Math.round((out[0].percent+diff)*10)/10;return out}
function runGoldenMelons(){if(!state||state.ended)return toast('Nie można organizować gali po zakończeniu kariery.');const year=careerYear();if(state.galas?.[year])return toast(`Gala ${year} już została zorganizowana.`);const names=galaNominees();if(names.length<2)return toast('Dodaj co najmniej jednego dodatkowego użytkownika.');const results=generateGalaResults(shuffle(names));state.galas[year]={year,week:state.turn,winner:results[0].name,results};state.history.unshift({turn:state.turn,eventId:`golden_melons_${year}`,category:'ZŁOTE MELONY',title:`Złote Melony ${year} — Użytkownik Roku`,detail:`Zwycięża ${results[0].name}. Gala została przeprowadzona w ${weekOfYear()}. tygodniu roku.`,delta:'GALA',outcome:'automatic'});autosave();render();renderGalaModal();toast(`Złote Melony ${year}: wygrywa ${results[0].name}!`)}
function automaticPool(){const eligible=automaticEvents.filter(e=>e.enabled!==false&&state.turn>=Number(e.minTurn||1));if(!eligible.length)return[];const recent=new Set((state.history||[]).slice(0,12).map(h=>h.eventId));const fresh=eligible.filter(e=>!recent.has(e.id));return fresh.length?fresh:eligible}
function runAutomaticEvent(event){event=normalizeAutomaticEvent(event);$('eventCard')?.classList.add('auto-event');$('eventCategory').innerHTML=`${esc(event.category)} <span class="auto-event-badge">BEZ DECYZJI</span>`;$('eventTitle').textContent=event.title;$('eventDescription').textContent=event.description;$('choiceGrid').innerHTML='';const utility=choiceUtility(event.effects),outcome=utility>1?'positive':utility<-1?'negative':'automatic',r=apply(event.effects,'automatic'),delta=summary(r.out);$('eventResult').textContent=`ZDARZENIE AUTOMATYCZNE — bez możliwości podjęcia decyzji.

${event.result}

ZMIANY: ${delta}`;$('eventResult').classList.remove('hidden');state.eventCount=(state.eventCount||0)+1;state.autoEventCount=(state.autoEventCount||0)+1;state.history.unshift({turn:state.turn,eventId:event.id,category:event.category,title:event.title,detail:event.result,delta,outcome:'automatic',good:outcome==='positive'});state.turn++;current=null;const ending=checkEnding();$('nextEventBtn').disabled=!!ending;$('nextEventBtn').textContent=ending?'KARIERA ZAKOŃCZONA':'NASTĘPNY TYDZIEŃ';autosave();render();if(ending)showEnding(ending)}
function pool(){
  const eligible=events.filter(e=>e.enabled!==false&&state.turn>=Number(e.minTurn||1));if(!eligible.length)return[];
  const antiRepeat=Math.min(15,Math.max(5,Math.floor(eligible.length/10)));const recent=new Set((state.history||[]).slice(0,antiRepeat).map(h=>h.eventId));
  let candidates=eligible.filter(e=>!recent.has(e.id));if(candidates.length<Math.min(10,eligible.length))candidates=eligible.filter(e=>e.id!==state.history?.[0]?.eventId);if(!candidates.length)candidates=eligible;
  return shuffle(candidates);
}
function weightedJitterPick(a){let total=0;const w=a.map(e=>{const base=Math.max(1,Number(e.weight)||1),jitter=randomBetween(.4,1.65),v=base*jitter;total+=v;return v});let r=rng()*total;for(let i=0;i<a.length;i++){r-=w[i];if(r<=0)return a[i]}return a[a.length-1]}
function pick(a){
  const groups=new Map();for(const e of a){const c=e.category||'EVENT';if(!groups.has(c))groups.set(c,[]);groups.get(c).push(e)}
  let cats=[...groups.keys()];const prev=state.history?.[0]?.category;if(prev&&cats.length>1&&rng()<.72)cats=cats.filter(c=>c!==prev);
  const category=randomItem(shuffle(cats));return weightedJitterPick(groups.get(category));
}
function draw(){if(!databaseReady)return toast('Baza eventów nie jest gotowa. Odśwież stronę.');if(state?.ended)return toast('Ta kariera jest już zakończona.');if(current)return toast('Najpierw rozstrzygnij aktualny event.');$('eventCard')?.classList.remove('auto-event');const autoPool=automaticPool(),autoChance=clamp(Number(databaseMeta.automaticEventChance??.28),0,1);if(autoPool.length&&rng()<autoChance){runAutomaticEvent(weightedJitterPick(autoPool));return}const a=pool();if(!a.length)return toast('Brak aktywnych eventów.');current=normalizeEvent(pick(a));current.displayChoices=shuffle(current.choices);$('eventCategory').textContent=current.category||'EVENT';$('eventTitle').textContent=current.title;$('eventDescription').textContent=current.description;$('eventResult').classList.add('hidden');$('eventResult').textContent='';$('choiceGrid').innerHTML=current.displayChoices.map((c,i)=>`<button class="choice" data-choice="${i}"><strong>${esc(c.label)}</strong><span>Skutek tej decyzji poznasz dopiero po wyborze.</span></button>`).join('');document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>resolve(+b.dataset.choice));$('nextEventBtn').disabled=true}
function apply(e={},outcome='neutral'){if(outcome==='neutral')return{out:{},outcome:'neutral'};const m=diff[state.difficulty]||diff.normal,out={};for(const[k,r]of Object.entries(e)){let v=Number(r)||0;if(!v)continue;const variance=randomBetween(.78,1.28);v=Math.round(v*(v>=0?m.p:m.n)*variance);if(v===0)v=Number(r)>0?1:-1;out[k]=v;state[k]=(state[k]||0)+v}norm(state);return{out,outcome}}
function checkEnding(){if(state.ended)return state.ending;if(state.reputation<=3||state.trust<=3||state.controversy>=98){state.ended=true;state.ending='ban';state.status='ZBANOWANY';return'ban'}if(state.level>=10&&state.trust>=80&&state.reputation>=75&&state.controversy<=35&&state.turn>=26){state.ended=true;state.ending='moderator';state.status='MODERATOR';return'moderator'}return null}
function showEnding(type,save=true){const m=$('endingModal');if(!m||!type)return;$('endingIcon').textContent=type==='moderator'?'🛡️':'🔨';$('endingTitle').textContent=type==='moderator'?'ZOSTAJESZ MODERATOREM!':'DOSTAJESZ BANA!';$('endingText').textContent=type==='moderator'?'Po wielu tygodniach budowania reputacji, zaufania i pozycji ekipa proponuje ci rolę moderatora. Twoja kariera użytkownika kończy się awansem.':'Przeciągnąłeś strunę. Reputacja, zaufanie albo poziom kontrowersji doprowadziły do bana. Ta kariera dobiegła końca.';m.classList.remove('hidden');if(save)autosave()}
function resolve(i){const c=current?.displayChoices?.[i]||current?.choices?.[i];if(!c)return;const event=current,outcome=c.outcome||'neutral',r=apply(c.effects,outcome);state.eventCount++;if(outcome==='positive'){state.goodChoices=(state.goodChoices||0)+1;state.streak=(state.streak||0)+1}else if(outcome==='negative'){state.badChoices=(state.badChoices||0)+1;state.streak=0}else{state.neutralChoices=(state.neutralChoices||0)+1}const delta=summary(r.out)||'Bez zmian';state.history.unshift({turn:state.turn,eventId:event.id,category:event.category,title:event.title,detail:c.result||c.label,delta,outcome,good:outcome==='positive'});$('choiceGrid').innerHTML='';$('eventResult').textContent=`${c.result||'Decyzja zapisana.'}\n\nSKUTEK: ${outcome==='positive'?'POZYTYWNY':outcome==='negative'?'NEGATYWNY':'NEUTRALNY'}\nZMIANY: ${delta}`;$('eventResult').classList.remove('hidden');state.turn++;current=null;const ending=checkEnding();$('nextEventBtn').disabled=!!ending;$('nextEventBtn').textContent=ending?'KARIERA ZAKOŃCZONA':'NASTĘPNY EVENT';autosave();render();if(ending)showEnding(ending)}
function start(){if(!databaseReady)return toast('Najpierw musi zostać załadowana baza eventów.');state=fresh($('nicknameInput').value.trim()||'Użytkownik',$('archetypeInput').value,$('startPointInput').value,$('difficultyInput').value);current=null;autosave();$('endingModal')?.classList.add('hidden');render();toast('Kariera rozpoczęta od poziomu 1.')}
function modal(id,on=true){$(id).classList.toggle('hidden',!on)}
function download(data,name){const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function readFile(f){return JSON.parse(await f.text())}
function bind(){
$('startBtn').onclick=start;$('nextEventBtn').onclick=draw;$('optionsBtn').onclick=()=>modal('optionsModal');$('goldenMelonsBtn').onclick=openGoldenMelons;$('addGalaUserBtn').onclick=addGalaUser;$('runGoldenMelonsBtn').onclick=runGoldenMelons;$('galaUserInput').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addGalaUser()}});$('saveBtn').onclick=()=>{autosave();toast('Zapisano.')};$('newCareerBtn').onclick=()=>{if(confirm('Rozpocząć nową karierę od poziomu 1?')){state=null;current=null;localStorage.removeItem(AUTO_KEY);$('endingModal')?.classList.add('hidden');render()}};$('clearHistoryBtn').onclick=()=>{if(state&&confirm('Wyczyścić historię?')){state.history=[];autosave();render()}};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>modal(b.dataset.close,false));document.querySelectorAll('.modal').forEach(m=>m.onclick=e=>{if(e.target===m&&m.id!=='endingModal')modal(m.id,false)});
$('endingNewCareerBtn').onclick=()=>{state=null;current=null;localStorage.removeItem(AUTO_KEY);modal('endingModal',false);render()};
$('exportSaveBtn').onclick=()=>state&&download(state,`melonawka-${state.nickname}.json`);$('importSaveInput').onchange=async e=>{try{state=await readFile(e.target.files[0]);state.neutralChoices=state.neutralChoices||0;norm(state);autosave();render();toast('Wczytano zapis.')}catch(x){alert(x.message)}e.target.value=''};document.querySelectorAll('[data-save-slot]').forEach(b=>b.onclick=()=>{if(state){localStorage.setItem(SLOT+b.dataset.saveSlot,JSON.stringify(state));toast('Slot zapisany.')}});document.querySelectorAll('[data-load-slot]').forEach(b=>b.onclick=()=>{const x=load(SLOT+b.dataset.loadSlot);if(x){state=x;current=null;state.neutralChoices=state.neutralChoices||0;norm(state);autosave();render();toast('Slot wczytany.')}else toast('Slot pusty.')});window.addEventListener('beforeunload',autosave)}
async function init(){bind();updateDatabaseStatus();await loadDatabase();if(state)norm(state);render();if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js?v=7.0.0').catch(()=>{});}
init();
})();