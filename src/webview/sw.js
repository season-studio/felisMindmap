const appName = "FelisMindmap";
const cacheName = `${appName}-1.00.0`;

self.addEventListener('install', (e) => {
    console.log("#[Worker] installing...");
    e.waitUntil((async () => {
        const cache = await caches.open(cacheName);
        //cache.addAll([]);
        self.skipWaiting();
        console.log("#[Worker] installed");
    })());
});

self.addEventListener('activate', (event) => {
    console.log("#[Worker] activate");
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(itemName => itemName.startsWith(appName) && (itemName !== cacheName))
                    .map(itemName => caches.delete(itemName))
            ).then(() => self.clients.claim());
        })
    );
});

self.addEventListener("fetch", event => {
    event.respondWith((async () => {
        try {
            let resp = await caches.match(event.request);
            if (!resp) {
                resp = await fetch(event.request);
            }
            if (!(resp instanceof Response)) {
                throw new Error(`${typeof resp}, ${resp}`);
            } else if (resp.ok && (resp.type === "basic")) {
                const cache = await caches.open(cacheName);
                cache && cache.add(event.request);
            }
            return resp;
        } catch(error) {
            console.error("#[Worker] Fail in fetch: ", event.request.url, error);
            return new Response(new Blob([""]), { "status" : 404 });
        }
    })());
});

/*
self.addEventListener("message", event => {
    self.dispatchEvent(new WorkerEvent(self, event));
});
*/

/*
self.addEventListener("map-virtual-response", async (event) => {
    const cache = await caches.open(cacheName);
    if (cache) {
        const mapTree = event.detail;
        let origin = location.origin;
        origin.endsWith("/") || (origin += "/");
        if (mapTree) {
            for (let path in mapTree) {
                let item = mapTree[path];
                path = path.startsWith(":") ? `${origin}.pwa.vir.keep/${path.substr(1)}` : `${origin}.pwa.vir/${path}`;
                (item instanceof Blob) || (item = new Blob([item]));
                await cache.put(
                    path, 
                    new Response(item, Object.assign({ 
                        status: 200, 
                        headers: Object.assign({"Content-Length": item.size}, item.respHeaders)
                    }, item.respStatus))
                );
            }
        }
        event.ack(0);
    } else {
        event.ack(-1);
    }
});

self.addEventListener("clear-virtual-response", async (event) => {
    const cache = await caches.open(cacheName);
    if (cache) {
        const isKeepAlive = event.detail.keepAlive;
        await Promise.all((await cache.keys()).map(item => 
            (String(item.url).indexOf(isKeepAlive ? ".pwa.vir.keep/" : ".pwa.vir/") >= 0) ? cache.delete(item) : undefined
        ));
        event.ack(0);
    } else {
        event.ack(-1);
    }
});

self.addEventListener("reload-application", async (event) => {
    const cache = await caches.open(cacheName);
    if (cache) {
        await Promise.all((await cache.keys()).map(item => cache.delete(item)));
        event.ack(0);
    } else {
        event.ack(-1);
    }
}); */