// Retire the worker registered by earlier versions of the technical briefing.
self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(self.registration.unregister());
});
