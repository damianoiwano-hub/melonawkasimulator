(()=>{'use strict';
const AUTO='melon_auto_v5',STORE='melon_gala_categories_v713';
const key=s=>String(s||'').trim().toLocaleLowerCase('pl');
let last='';
function json(k,f=null){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
function careerId(s){return String(s?.startProfileV79?.rolledAt||`${s?.nickname||'user'}|${s?.difficulty||'normal'}|${s?.startYear||2026}`)}
function sync(){const s=globalThis.MelonCoreV714?.getState?.()||json(AUTO);if(!s||!s.galas)return;const root=json(STORE,{}),cid=careerId(s),byYear=root?.[cid];if(!byYear)return;let changed=false;for(const[y,g]of Object.entries(s.galas)){if(!g)continue;const full=byYear?.[y];if(!full?.awards?.length)continue;const overall=full.awards.find(a=>a.id==='uzytkownik_roku')||full.awards.find(a=>a.overall);if(!overall?.winner)continue;const sig=`${y}|${overall.winner}|${(overall.nominees||[]).join(',')}`;if(g._v714Sync===sig)continue;s.galas[y]={...g,winner:overall.winner,nominees:[...(overall.nominees||[])],results:[...(overall.results||[])],pendingCategoryResults:false,categoryAwards:full.awards.map(a=>({id:a.id,name:a.name,winner:a.winner})),_v714Sync:sig};changed=true}if(changed){if(globalThis.MelonCoreV714?.replaceState)globalThis.MelonCoreV714.replaceState(s);else localStorage.setItem(AUTO,JSON.stringify(s))}}
function tick(){const sig=(localStorage.getItem(STORE)||'')+'|'+(localStorage.getItem(AUTO)||'');if(sig===last)return;last=sig;sync()}
function init(){sync();setInterval(tick,700)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
