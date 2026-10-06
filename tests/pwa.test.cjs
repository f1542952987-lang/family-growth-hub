const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function worker() {
  const events = {}, stores = new Map();
  let failInstall = false, network = true, claimed = false, skipped = false;
  const origin = 'https://example.test/family-growth-hub/';
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async key => stores.delete(key),
    open: async key => {
      if (!stores.has(key)) stores.set(key, new Map());
      const map = stores.get(key);
      return {
        addAll: async requests => {
          if (failInstall) throw Error('404');
          for (const r of requests) map.set(r.url, new Response('cached:'+r.url));
        },
        match: async url => map.get(String(url))?.clone()
      };
    }
  };
  const self = {location:{href:origin+'sw.js'}, addEventListener:(name, fn) => events[name]=fn,
    clients:{claim:async()=>{claimed=true;}}, skipWaiting:()=>{skipped=true;}};
  const ctx = vm.createContext({self,caches,URL,Request,Response,fetch:async request=>{
    if (!network) throw Error('offline'); return new Response('network:'+request.url);
  },importScripts:()=>vm.runInContext(fs.readFileSync('pwa-assets.js','utf8'),ctx)});
  vm.runInContext(fs.readFileSync('sw.js','utf8'),ctx);
  return {events,stores,self,origin,setOffline:()=>network=false,setFail:()=>failInstall=true,
    claimed:()=>claimed,skipped:()=>skipped,
    run:async name=>{let p;events[name]({waitUntil:v=>p=v});await p;},
    fetch:async(path,mode='navigate',method='GET')=>{
      let p;events.fetch({request:{url:new URL(path,origin).href,mode,method},respondWith:v=>p=v});
      return p ? await (await p).text() : undefined;
    }};
}
test('all generated paths exist; no legacy resources; distinct install starts',()=>{
 const w=worker();for(const p of w.self.PWA_ASSETS) assert.ok(fs.existsSync(p));
 assert.ok(!w.self.PWA_ASSETS.some(p=>p.includes('v10')));
 assert.equal(JSON.parse(fs.readFileSync('guest.webmanifest')).start_url,'./guest.html');
 for(const p of ['index.html','v16.html','v17.html','guest.html']) assert.match(fs.readFileSync(p,'utf8'),/defer src="assets\/js\/pwa.js"/);
});
test('install waits; offline root and guest query have exact separate fallbacks',async()=>{
 const w=worker();await w.run('install');assert.equal(w.skipped(),false);
 await w.run('activate');assert.equal(w.claimed(),true);w.setOffline();
 assert.equal(await w.fetch('./'),'cached:'+w.origin+'index.html');
 assert.equal(await w.fetch('guest.html?v=17'),'cached:'+w.origin+'guest.html');
 assert.equal(await w.fetch('v17.html'),'cached:'+w.origin+'v17.html');
 assert.equal(await w.fetch('unknown.html'),undefined);
 assert.equal(await w.fetch('api/family'),undefined);
 assert.equal(await w.fetch('index.html','navigate','POST'),undefined);
 assert.equal(await w.fetch('https://other.test/index.html'),undefined);
});
test('static shell stays coherent; HTML network first; explicit update activation',async()=>{
 const w=worker();await w.run('install');
 assert.equal(await w.fetch('assets/js/player.js?v=17','cors'),'cached:'+w.origin+'assets/js/player.js');
 assert.equal(await w.fetch('guest.html'),'network:'+w.origin+'guest.html');
 w.events.message({data:{type:'SKIP_WAITING'}});assert.equal(w.skipped(),true);
});
test('activation preserves unrelated caches; failed new install preserves old shell',async()=>{
 const w=worker();w.stores.set('unrelated',new Map());
 w.stores.set('family-hub-v10-209094',new Map());
 w.stores.set('family-hub-pwa-%2Ffamily-growth-hub%2F-old',new Map());
 await w.run('install');await w.run('activate');
 assert.ok(w.stores.has('unrelated'));assert.equal(w.stores.size,2);
 const broken=worker();broken.stores.set('old-shell',new Map());broken.setFail();
 await assert.rejects(broken.run('install'));
 assert.deepEqual([...broken.stores.keys()],['old-shell']);
});
