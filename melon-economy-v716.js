(()=>{'use strict';
const AUTO='melon_auto_v5';
const SLOT='melon_slot_v5_';
const WALLET='melon_wallet_v74';
const LEDGER='melon_wallet_ledger_v716';
const MANIFEST='./data/database.json';
const DEFAULT_CFG={
  goodDecisionRewardChance:.45,
  goodDecisionRewardMin:0,
  goodDecisionRewardMax:20,
  maxPositiveChance:95,
  boosts:[
    {label:'Bez wsparcia',cost:0,bonus:0},
    {label:'+10 p.p.',cost:15,bonus:10},
    {label:'+20 p.p.',cost:30,bonus:20},
    {label:'+30 p.p.',cost:50,bonus:30}
  ],
  highStatRisk:{enabled:true,threshold:70,maxPenalty:20,perPoint:.6,levelStart:6,levelPenalty:.8,difficulty:{easy:.7,normal:1,hard:1.25}}
};
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const previousSet=Storage.prototype.setItem;
const previousRemove=Storage.prototype.removeItem;
const originalCryptoGet=globalThis.Crypto?.prototype?.getRandomValues;
let cfg=structuredClone(DEFAULT_CFG);
let wallet=0;
let walletReady=false;
let coreMelons=0;
let coreTurn=0;
let coreEvents=0;
let coreNick='';
let acceptNextCoreSync=false;
let selected={cost:0,bonus:0,label:'Bez wsparcia',paid:false,balanceAfter:null};
let clickCtx=null;
let rngPatch=null;
const effectCounts=new Map();
const melonRewards=new Map();

function key(s=''){return String(s).trim().toLocaleLowerCase('pl')}
function choiceKey(title,label){return `${key(title)}|||${key(label)}`}
function loadState(k=AUTO){try{return JSON.parse(localStorage.getItem(k))}catch{return null}}
function secureRandom(){try{const a=new Uint32Array(1);if(originalCryptoGet)originalCryptoGet.call(crypto,a);else crypto.getRandomValues(a);return a[0]/4294967296}catch{return Math.random()}}
function randint(a,b){return Math.floor(secureRandom()*(b-a+1))+a}
function toast(t){let el=$('melonEconomyToast');if(!el){el=document.createElement('div');el.id='melonEconomyToast';el.className='melon-economy-toast';document.body.appendChild(el)}el.textContent=t;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),2800)}
function stateFromCore(){return globalThis.MelonCoreV714?.getState?.()||loadState()}
function setCoreShadow(s,incoming){coreMelons=Math.max(0,Number(incoming??s?.melons??0));coreTurn=Number(s?.turn||0);coreEvents=Number(s?.eventCount||0);coreNick=String(s?.nickname||'')}
function ledger(reason,before,after,extra={}){try{const list=loadState(LEDGER);const s=Array.isArray(list)?list:[];s.unshift({at:new Date().toISOString(),reason,before:Math.round(before),after:Math.round(after),delta:Math.round(after-before),turn:Number(stateFromCore()?.turn||0),...extra});previousSet.call(localStorage,LEDGER,JSON.stringify(s.slice(0,120)))}catch{}}
function writeWalletOnly(reason='sync',before=wallet,extra={}){wallet=Math.max(0,Math.round(wallet));previousSet.call(localStorage,WALLET,String(wallet));syncWalletUi();if(reason)ledger(reason,before,wallet,extra)}
function writeWalletState(s,reason='',before=wallet,extra={}){if(!s)return null;s.melons=Math.max(0,Math.round(wallet));previousSet.call(localStorage,WALLET,String(s.melons));previousSet.call(localStorage,AUTO,JSON.stringify(s));syncWalletUi();if(reason)ledger(reason,before,wallet,extra);return s}
function syncCoreWhenSafe(){if(document.querySelector('#choiceGrid .choice'))return false;const api=globalThis.MelonCoreV714,s=api?.getState?.();if(!api?.replaceState||!s)return false;if(Math.round(Number(s.melons||0))===Math.round(wallet))return true;s.melons=Math.max(0,Math.round(wallet));acceptNextCoreSync=true;api.replaceState(s);return true}
function initWallet(){const s=stateFromCore(),raw=localStorage.getItem(WALLET),stored=Number(raw),incoming=Math.max(0,Number(s?.melons||0));wallet=raw!==null&&Number.isFinite(stored)?Math.max(0,stored):incoming;walletReady=true;if(s){setCoreShadow(s,incoming);s.melons=wallet;previousSet.call(localStorage,AUTO,JSON.stringify(s))}previousSet.call(localStorage,WALLET,String(Math.round(wallet)));syncWalletUi();setTimeout(syncCoreWhenSafe,0)}
function persistWallet(reason='',before=wallet,extra={}){const s=loadState();if(s)writeWalletState(s,reason,before,extra);else writeWalletOnly(reason,before,extra)}
function adjustBalance(delta,reason,extra={}){delta=Math.round(Number(delta)||0);const before=wallet,next=Math.max(0,before+delta);if(delta<0&&before+delta<0)return{ok:false,reason:'funds',balance:Math.round(wallet)};wallet=next;persistWallet(reason,before,extra);return{ok:true,balance:Math.round(wallet),before:Math.round(before),delta:Math.round(wallet-before)}}
function shopPurchase(cost,mutator){cost=Math.max(0,Math.round(Number(cost)||0));const s=loadState();if(!s)return{ok:false,reason:'no-state',balance:Math.round(wallet)};if(cost>wallet)return{ok:false,reason:'funds',balance:Math.round(wallet)};const before=wallet;wallet-=cost;if(typeof mutator==='function')mutator(s);s.melons=wallet;acceptNextCoreSync=true;writeWalletState(s,'shop',before,{cost});return{ok:true,balance:Math.round(wallet),state:s,cost}}
function syncExternalState(s){if(!s||typeof s!=='object')return null;s.melons=wallet;acceptNextCoreSync=true;return writeWalletState(s)}
function audit(){const s=stateFromCore(),stored=Number(localStorage.getItem(WALLET)),ui=Number($('moneyValue')?.textContent);return{balance:Math.round(wallet),stateBalance:Math.round(Number(s?.melons||0)),storedBalance:Number.isFinite(stored)?Math.round(stored):null,uiBalance:Number.isFinite(ui)?Math.round(ui):null,consistent:(!s||Math.round(Number(s.melons||0))===Math.round(wallet))&&(!Number.isFinite(stored)||Math.round(stored)===Math.round(wallet))}}
globalThis.MelonWalletV716={getBalance:()=>Math.max(0,Math.round(wallet)),shopPurchase,syncState:syncExternalState,refresh:syncWalletUi,audit,credit:(amount,reason='credit')=>adjustBalance(Math.max(0,Number(amount)||0),reason),debit:(amount,reason='debit')=>adjustBalance(-Math.max(0,Number(amount)||0),reason),syncCore:syncCoreWhenSafe};
globalThis.MelonWalletV713=globalThis.MelonWalletV716;

function interceptStorage(){
  Storage.prototype.setItem=function(k,v){
    if(this===localStorage&&typeof k==='string'&&k.startsWith(SLOT)){
      try{const slot=JSON.parse(v);if(slot&&typeof slot==='object'){slot.melons=Math.round(wallet);return previousSet.call(this,k,JSON.stringify(slot))}}catch{}
      return previousSet.call(this,k,v);
    }
    if(this!==localStorage||k!==AUTO)return previousSet.call(this,k,v);
    let s;try{s=JSON.parse(v)}catch{return previousSet.call(this,k,v)}
    if(!s||typeof s!=='object')return previousSet.call(this,k,v);
    const incoming=Math.max(0,Number(s.melons||0)),turn=Number(s.turn||0),ev=Number(s.eventCount||0),nick=String(s.nickname||'');
    const reset=!walletReady||nick!==coreNick||turn<coreTurn||ev<coreEvents||turn>coreTurn+1||ev>coreEvents+1;
    if(reset){wallet=incoming;walletReady=true;setCoreShadow(s,incoming);acceptNextCoreSync=false}
    else if(acceptNextCoreSync){setCoreShadow(s,incoming);acceptNextCoreSync=false}
    else{wallet=Math.max(0,wallet+(incoming-coreMelons));setCoreShadow(s,incoming)}
    s.melons=Math.round(wallet);
    previousSet.call(localStorage,WALLET,String(Math.round(wallet)));
    const r=previousSet.call(this,k,JSON.stringify(s));
    queueMicrotask(syncWalletUi);
    return r;
  };
  Storage.prototype.removeItem=function(k){
    if(this===localStorage&&k===AUTO){wallet=0;walletReady=false;coreMelons=0;coreTurn=0;coreEvents=0;coreNick='';acceptNextCoreSync=false;selected={cost:0,bonus:0,label:'Bez wsparcia',paid:false,balanceAfter:null};previousRemove.call(localStorage,WALLET)}
    return previousRemove.call(this,k);
  };
}

async function loadConfigAndChoices(){
  try{
    const r=await fetch(`${MANIFEST}?economy716=${Date.now()}`,{cache:'no-store'});if(!r.ok)return;
    const m=await r.json();
    if(m.melonEconomy&&typeof m.melonEconomy==='object'){
      cfg={...DEFAULT_CFG,...m.melonEconomy,highStatRisk:{...DEFAULT_CFG.highStatRisk,...(m.melonEconomy.highStatRisk||{}),difficulty:{...DEFAULT_CFG.highStatRisk.difficulty,...(m.melonEconomy.highStatRisk?.difficulty||{})}}};
      if(!Array.isArray(cfg.boosts)||!cfg.boosts.length)cfg.boosts=DEFAULT_CFG.boosts;
    }
    for(const p of m.packs||[]){
      try{
        const e=await fetch(`./data/${p}?economy716=${Date.now()}`,{cache:'no-store'});if(!e.ok)continue;
        const list=await e.json();if(!Array.isArray(list))continue;
        for(const ev of list)for(const c of ev.choices||[]){
          const ck=choiceKey(ev.title,c.label);
          effectCounts.set(ck,Object.entries(c.effects||{}).filter(([k,v])=>k!=='score'&&Number(v)!==0).length);
          if(c.melonReward&&typeof c.melonReward==='object'){
            const chance=clamp(Number(c.melonReward.chance||0),0,100),min=Math.max(0,Math.trunc(Number(c.melonReward.min||0))),max=Math.max(min,Math.trunc(Number(c.melonReward.max??min)));
            melonRewards.set(ck,{chance,min,max});
          }
        }
      }catch(err){console.warn('Economy pack:',p,err)}
    }
  }catch(e){console.warn('Melon economy V7.16 config:',e)}
}
function ensurePanel(){let p=$('melonBoostPanel');if(p)return p;const grid=$('choiceGrid');if(!grid)return null;p=document.createElement('section');p.id='melonBoostPanel';p.className='melon-boost-panel hidden';p.innerHTML=`<div class="melon-boost-copy"><div><span class="melon-boost-kicker">🍉 MELON BOOST</span><strong>Kup większą szansę na dodatni wynik punktowy</strong></div><div class="melon-wallet">Saldo: <b id="melonBoostBalance">0</b> 🍉</div></div><div class="melon-boost-options" id="melonBoostOptions"></div><div class="melon-boost-note">Saldo odświeża się od razu po wyborze boosta. Zmiana na tańszy wariant zwraca różnicę przed podjęciem decyzji.</div>`;grid.parentNode.insertBefore(p,grid);return p}
function syncWalletUi(){if($('moneyValue'))$('moneyValue').textContent=Math.round(wallet);if($('melonBoostBalance'))$('melonBoostBalance').textContent=Math.round(wallet);renderBoostButtons(false)}
function chooseBoost(i){const b=cfg.boosts[i];if(!b)return;const nextCost=Math.max(0,Math.round(Number(b.cost)||0)),oldCost=Math.max(0,Math.round(Number(selected.cost)||0)),delta=nextCost-oldCost;if(delta>0&&delta>wallet)return toast('Za mało Melonów na ten boost.');const before=wallet;if(delta>0)wallet-=delta;else if(delta<0)wallet+=-delta;selected={cost:nextCost,bonus:Number(b.bonus||0),label:b.label||`+${b.bonus} p.p.`,paid:nextCost>0,balanceAfter:Math.round(wallet)};if(delta!==0)persistWallet(delta>0?'boost-reserve':'boost-refund',before,{cost:nextCost,previousCost:oldCost});else syncWalletUi();renderBoostButtons(false);refreshPreviews();if(delta>0)toast(`🍉 Boost wybrany: -${delta} Melonów. Saldo: ${Math.round(wallet)}.`);if(delta<0)toast(`🍉 Zmieniono boost: zwrot ${-delta} Melonów. Saldo: ${Math.round(wallet)}.`)}
function renderBoostButtons(rebuild=true){const p=ensurePanel();if(!p)return;const holder=$('melonBoostOptions');if(!holder)return;if(rebuild||!holder.children.length){holder.innerHTML=cfg.boosts.map((b,i)=>`<button type="button" class="melon-boost-btn" data-melon-boost="${i}"><strong>${b.label||`+${b.bonus} p.p.`}</strong><span>${Number(b.cost||0)} 🍉</span></button>`).join('');holder.querySelectorAll('[data-melon-boost]').forEach(btn=>btn.onclick=e=>{e.preventDefault();e.stopPropagation();chooseBoost(Number(btn.dataset.melonBoost))})}holder.querySelectorAll('[data-melon-boost]').forEach((btn,i)=>{const b=cfg.boosts[i],extra=Math.max(0,Number(b.cost||0)-Number(selected.cost||0));btn.disabled=extra>wallet;btn.classList.toggle('active',selected.cost===Number(b.cost||0)&&selected.bonus===Number(b.bonus||0))})}
function parseOdds(btn){const text=btn?.innerText||'',matches=[...text.matchAll(/(\d+(?:[.,]\d+)?)%\s*→\s*([+-]?\d+)\s*PKT/gi)];if(matches.length<2)return null;let plus=matches.find(m=>Number(m[2])>0),minus=matches.find(m=>Number(m[2])<0);if(!plus)plus=matches[0];if(!minus)minus=matches.find(m=>m!==plus)||matches[1];return{basePlus:Number(plus[1].replace(',','.')),plusPoints:Number(plus[2]),minusPoints:Number(minus[2]),decisionGood:/DECYZJA\s+ROZSĄDNA/i.test(text),label:btn.querySelector('strong')?.textContent||''}}
function rewardConfig(title,o){const custom=melonRewards.get(choiceKey(title,o.label));if(custom)return custom;if(!o.decisionGood)return{chance:0,min:0,max:0};return{chance:clamp(Number(cfg.goodDecisionRewardChance??.45)*100,0,100),min:Math.max(0,Math.trunc(Number(cfg.goodDecisionRewardMin??0))),max:Math.max(0,Math.trunc(Number(cfg.goodDecisionRewardMax??20)))}}
function highStatPenalty(s){const r=cfg.highStatRisk||{};if(r.enabled===false||!s)return 0;const avg=(Number(s.reputation||0)+Number(s.activity||0)+Number(s.popularity||0)+Number(s.trust||0))/4,threshold=Number(r.threshold??70);if(avg<=threshold)return 0;let p=(avg-threshold)*Number(r.perPoint??.6)+Math.max(0,Number(s.level||1)-Number(r.levelStart??6))*Number(r.levelPenalty??.8);p*=Number(r.difficulty?.[s.difficulty]??1);return Math.round(clamp(p,0,Number(r.maxPenalty??20)))}
function effectiveOdds(basePlus,bonus,s){const pressure=highStatPenalty(s),effective=clamp(basePlus+Number(bonus||0)-pressure,5,Number(cfg.maxPositiveChance||95));return{effective,pressure}}
function refreshPreviews(){const title=$('eventTitle')?.textContent||'',s=loadState();document.querySelectorAll('#choiceGrid .choice').forEach(btn=>{const o=parseOdds(btn);if(!o)return;btn.querySelector('.melon-odds-preview')?.remove();const{effective,pressure}=effectiveOdds(o.basePlus,selected.bonus,s),mr=rewardConfig(title,o),reward=mr.chance>0?`<small>🎁 ${mr.chance}% szans na ${mr.min===mr.max?mr.min:`${mr.min}–${mr.max}`} 🍉</small>`:'<small>🎁 Brak bonusu Melonów</small>',pressureText=pressure>0?`<small>⚠ Presja wysokich statystyk: -${pressure} p.p. do szansy na +PKT</small>`:'<small>🟢 Brak presji wysokich statystyk</small>';const d=document.createElement('div');d.className='melon-odds-preview';d.innerHTML=`🍉 Końcowa szansa: <b>${Math.round(effective)}%</b> na ${o.plusPoints>0?'+':''}${o.plusPoints} PKT${selected.bonus>0?` <small>(boost +${selected.bonus} p.p. • opłacony)</small>`:''}<br>${pressureText}<br>${reward}`;btn.appendChild(d)})}
function showForChoices(){const p=ensurePanel();if(!p)return;const buttons=[...document.querySelectorAll('#choiceGrid .choice')];if(!buttons.length){p.classList.add('hidden');return}selected={cost:0,bonus:0,label:'Bez wsparcia',paid:false,balanceAfter:null};p.classList.remove('hidden');renderBoostButtons();syncWalletUi();refreshPreviews()}
function installRngTarget(effectCount,basePlus,effective){if(!originalCryptoGet||!Number.isInteger(effectCount)||Math.abs(effective-basePlus)<.01)return;let calls=0;const target=effectCount+1,proto=globalThis.Crypto.prototype;rngPatch={proto};proto.getRandomValues=function(arr){calls++;if(calls===target&&arr instanceof Uint32Array&&arr.length){const r=new Uint32Array(Math.max(2,arr.length));originalCryptoGet.call(this,r);const win=(r[0]/4294967296)<effective/100,p=clamp(basePlus/100,.0001,.9999),u=r[1]/4294967296,x=win?u*p:p+u*(1-p);arr[0]=Math.min(4294967295,Math.floor(x*4294967296));for(let i=1;i<arr.length;i++)arr[i]=r[i%r.length];return arr}return originalCryptoGet.call(this,arr)}}
function restoreRng(){if(rngPatch&&originalCryptoGet){rngPatch.proto.getRandomValues=originalCryptoGet;rngPatch=null}}
function captureChoice(e){const btn=e.target.closest?.('#choiceGrid .choice');if(!btn)return;const o=parseOdds(btn);if(!o)return;const title=$('eventTitle')?.textContent||'',ck=choiceKey(title,o.label),count=effectCounts.get(ck),reward=rewardConfig(title,o),s=loadState();let{effective,pressure}=effectiveOdds(o.basePlus,selected.bonus,s);if(Math.abs(effective-o.basePlus)>.01&&!Number.isInteger(count)){if(selected.bonus>0){e.preventDefault();e.stopImmediatePropagation();return toast('Nie udało się odczytać tej decyzji z bazy. Zmień boost na „Bez wsparcia”, aby odzyskać zarezerwowane Melony.')}effective=o.basePlus;pressure=0}else installRngTarget(count,o.basePlus,effective);clickCtx={...o,effective,pressure,boost:{...selected},reward};setTimeout(restoreRng,60)}
function finalizeChoice(){if(!clickCtx)return;const ctx=clickCtx;clickCtx=null;const lines=[];if(ctx.boost.cost>0)lines.push(`🍉 Melon Boost: koszt ${ctx.boost.cost} Melonów został pobrany przy wyborze boosta. Saldo po zakupie: ${ctx.boost.balanceAfter}.`);if(ctx.pressure>0)lines.push(`⚠ Presja wysokich statystyk: -${ctx.pressure} p.p. Końcowa szansa na dodatnie punkty: ${Math.round(ctx.effective)}%.`);const mr=ctx.reward||{chance:0,min:0,max:0};if(mr.chance>0){if(secureRandom()<clamp(Number(mr.chance),0,100)/100){const min=Math.max(0,Math.trunc(Number(mr.min||0))),max=Math.max(min,Math.trunc(Number(mr.max??min))),reward=randint(min,max);if(reward>0){const before=wallet;wallet+=reward;persistWallet('event-reward',before,{reward});lines.push(`🍉 Bonus za decyzję: +${reward} Melonów (szansa ${mr.chance}%). Saldo: ${Math.round(wallet)}.`)}else lines.push('🍉 Losowanie bonusu walutowego: 0 Melonów.')}else lines.push(`🍉 Bonus Melonów nie wypadł (${mr.chance}% szans).`)}else syncWalletUi();const res=$('eventResult');if(res&&lines.length){res.textContent+=`\n\n${lines.join('\n')}`;res.classList.remove('hidden')}selected={cost:0,bonus:0,label:'Bez wsparcia',paid:false,balanceAfter:null};renderBoostButtons(false);setTimeout(syncCoreWhenSafe,0)}
function exportAuthoritative(){const s=loadState();if(!s)return;s.melons=Math.round(wallet);const b=new Blob([JSON.stringify(s,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`melonawka-${s.nickname||'zapis'}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function bind(){document.addEventListener('click',captureChoice,true);document.addEventListener('click',()=>{restoreRng();if(clickCtx)setTimeout(finalizeChoice,0)},false);const grid=$('choiceGrid');if(grid)new MutationObserver(()=>setTimeout(showForChoices,0)).observe(grid,{childList:true});const money=$('moneyValue');if(money)new MutationObserver(()=>{if(money.textContent!==String(Math.round(wallet)))money.textContent=Math.round(wallet)}).observe(money,{childList:true,characterData:true,subtree:true});if($('exportSaveBtn'))$('exportSaveBtn').onclick=exportAuthoritative;window.addEventListener('pageshow',()=>{const stored=Number(localStorage.getItem(WALLET));if(Number.isFinite(stored)){wallet=Math.max(0,stored);syncWalletUi();setTimeout(syncCoreWhenSafe,0)}})}
async function init(){interceptStorage();initWallet();await loadConfigAndChoices();ensurePanel();bind();showForChoices();syncWalletUi();if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js?v=7.16.0').catch(()=>{})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
