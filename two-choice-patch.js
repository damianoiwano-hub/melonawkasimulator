(()=>{'use strict';
const MANIFEST='./data/database.json';
const neutralByTitle=new Map();

function rememberNeutral(event){
  if(!event||!Array.isArray(event.choices))return;
  const neutral=event.choices.find(c=>c?.outcome==='neutral')||
    event.choices.find(c=>c?.effects&&typeof c.effects==='object'&&!Array.isArray(c.effects)&&Object.keys(c.effects).length===0);
  if(neutral?.label&&event.title)neutralByTitle.set(String(event.title).trim(),String(neutral.label).trim());
}

async function loadNeutralChoices(){
  try{
    const mr=await fetch(`${MANIFEST}?twoChoices=${Date.now()}`,{cache:'no-store'});
    if(!mr.ok)return;
    const manifest=await mr.json();
    for(const pack of (manifest.packs||[])){
      const r=await fetch(`./data/${pack}?twoChoices=${Date.now()}`,{cache:'no-store'});
      if(!r.ok)continue;
      const data=await r.json();
      if(Array.isArray(data))data.forEach(rememberNeutral);
    }
  }catch(e){console.warn('Nie udało się załadować mapy decyzji neutralnych:',e)}
  enforceTwoChoices();
}

function enforceTwoChoices(){
  const grid=document.getElementById('choiceGrid');
  if(!grid)return;
  grid.style.gridTemplateColumns='repeat(2,minmax(0,1fr))';
  const buttons=[...grid.querySelectorAll('.choice')];
  if(buttons.length<=2)return;

  const title=(document.getElementById('eventTitle')?.textContent||'').trim();
  const neutralLabel=neutralByTitle.get(title);
  if(!neutralLabel)return;

  const neutralButton=buttons.find(btn=>(btn.querySelector('strong')?.textContent||'').trim()===neutralLabel);
  if(neutralButton)neutralButton.remove();
}

function hideNeutralCounter(){
  const neutral=document.getElementById('neutralChoices');
  if(neutral?.parentElement)neutral.parentElement.style.display='none';
}

function init(){
  hideNeutralCounter();
  const grid=document.getElementById('choiceGrid');
  if(grid)new MutationObserver(enforceTwoChoices).observe(grid,{childList:true,subtree:true});
  enforceTwoChoices();
  loadNeutralChoices();
  if('serviceWorker'in navigator&&location.protocol.startsWith('http')){
    navigator.serviceWorker.register('./service-worker.js?v=7.1.0').catch(()=>{});
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();