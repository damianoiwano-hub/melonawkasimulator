const CACHE='melonawka-sim-v7-11';
const STATIC=['./','./index.html','./styles-v7.css','./discord-v74.css','./discord-nav-v75.css','./game-options-v77.css','./achievements-v78.css','./start-balance-v79.css','./color-v710.css','./gala-fix-v711.css','./game-options-v77.js','./app-v73.js','./melon-economy-v74.js','./discord-nav-v75.js','./users-live-v751.js','./achievements-v79.js','./start-balance-v79.js','./v710-systems.js','./gala-fix-v711.js','./manifest.json','./icon.svg','./data/database.json','./data/achievements-v79.json','./data/career-start-v79.json','./data/golden-melons-v710.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.pathname.includes('/data/')){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res;}).catch(()=>caches.match(e.request)));
    return;
  }
  const isApp=u.pathname.endsWith('/')||/index\.html$|game-options-v77\.js$|achievements-v79\.js$|start-balance-v79\.js$|v710-systems\.js$|gala-fix-v711\.js$|app-v73\.js$|melon-economy-v74\.js$|discord-nav-v75\.js$|users-live-v751\.js$|styles-v7\.css$|discord-v74\.css$|discord-nav-v75\.css$|game-options-v77\.css$|achievements-v78\.css$|start-balance-v79\.css$|color-v710\.css$|gala-fix-v711\.css$/.test(u.pathname);
  if(isApp){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res;}).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
