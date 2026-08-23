const CACHE="motivational-quotes-v3";
const CORE=["./","./index.html","./style.css","./script.js","./quotes.json","./manifest.webmanifest","../dawn-bg.png","../water-bg.png","../moonlight-bg.png"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k.startsWith("motivational-quotes-")).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  const isFreshAsset=event.request.mode==="navigate" || /\.(?:html|css|js|json)$/.test(url.pathname);

  if(isFreshAsset){
    event.respondWith(
      fetch(event.request)
        .then(response=>{
          if(response&&response.ok){
            const copy=response.clone();
            event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));
          }
          return response;
        })
        .catch(()=>caches.match(event.request).then(hit=>hit||caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
      if(response&&response.ok){
        const copy=response.clone();
        event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));
      }
      return response;
    }))
  );
});