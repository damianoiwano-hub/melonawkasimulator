(()=>{'use strict';
const AUTO='melon_auto_v5';
const WALLET='melon_wallet_v74';
const RESET_FLAG='melon_hard_career_reset';
const nativeSet=Storage.prototype.setItem;
const nativeRemove=Storage.prototype.removeItem;

function resetInProgress(){
  try{return sessionStorage.getItem(RESET_FLAG)==='1'}catch{return false}
}

// Gdy strona właśnie wróciła po twardym resecie, wyczyść stan zanim app-v73.js go odczyta.
if(resetInProgress()){
  try{nativeRemove.call(localStorage,AUTO)}catch{}
  try{nativeRemove.call(localStorage,WALLET)}catch{}
  try{
    for(let i=sessionStorage.length-1;i>=0;i--){
      const k=sessionStorage.key(i);
      if(k&&k.startsWith('melon_users_week52_refresh_'))sessionStorage.removeItem(k);
    }
  }catch{}
  try{sessionStorage.removeItem(RESET_FLAG)}catch{}
}

// Blokada chroni przed window.beforeunload -> save(), które wcześniej potrafiło
// ponownie zapisać zakończoną karierę dokładnie podczas resetu.
Storage.prototype.setItem=function(k,v){
  if(this===localStorage&&k===AUTO&&resetInProgress())return;
  return nativeSet.call(this,k,v);
};

function clearCurrentCareer(){
  try{sessionStorage.setItem(RESET_FLAG,'1')}catch{}
  try{localStorage.removeItem(AUTO)}catch{}
  try{localStorage.removeItem(WALLET)}catch{}
  try{
    for(let i=sessionStorage.length-1;i>=0;i--){
      const k=sessionStorage.key(i);
      if(k&&k.startsWith('melon_users_week52_refresh_'))sessionStorage.removeItem(k);
    }
  }catch{}
}

function hardReset(){
  clearCurrentCareer();
  const u=new URL(location.href);
  u.searchParams.set('careerReset',Date.now().toString());
  location.replace(u.toString());
}

function intercept(e){
  const btn=e.target.closest?.('#endingNewCareerBtn,#newCareerBtn');
  if(!btn)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if(btn.id==='newCareerBtn'&&!confirm('Rozpocząć nową karierę?'))return;
  hardReset();
}

document.addEventListener('click',intercept,true);
})();