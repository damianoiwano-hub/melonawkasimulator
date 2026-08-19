const CACHE='melonawka-sim-v5-career-only-500';
const ASSETS=['./','./index.html','./styles-v5.css?v=5.0.0','./app-v5.js?v=5.0.0','./manifest.json','./icon.svg'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);const app=/\/$|index\.html$|app-v5\.js$|styles-v5\.css$/.test(u.pathname);if(app)e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)));else e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})
