self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// This app uses stable asset filenames. Leave every request on the network so a
// previous service worker cannot conceal a newly deployed release.
