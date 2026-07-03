const CACHE='backend-atlas-v5';
const ASSETS=['./','./index.html','./styles.css','./learning-os.css','./questions.js','./question-expander.js','./ax-question-extension.js','./learning-os-data.js','./atlas-content.js','./curriculum-data.js','./developer-guide-data.js','./learning-visuals.js','./app.js','./learning-os.js','./manifest.webmanifest','./assets/backend-atlas-icon.png'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)))});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))])));
self.addEventListener('fetch',event=>{if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match('./index.html')));return}event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request)))});
