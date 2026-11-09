// เก็บไฟล์เกมไว้ในเครื่อง เพื่อให้เล่นได้แม้ไม่มีเน็ต
// เวลาแก้เกม ให้เปลี่ยนเลขเวอร์ชันข้างล่าง เครื่องลูกจะโหลดของใหม่เอง
const CACHE = 'kids-game-v24';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // ฟอนต์จาก Google: ใช้ของในเครื่องก่อน ถ้าไม่มีค่อยโหลดแล้วเก็บไว้
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com')) {
    e.respondWith(caches.open(CACHE).then(c => c.match(e.request).then(hit => hit ||
      fetch(e.request).then(res => { c.put(e.request, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  // ไฟล์เกม: ลองโหลดของใหม่ก่อน ถ้าไม่มีเน็ตให้ใช้ของที่เก็บไว้
  e.respondWith(fetch(e.request)
    .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
