const CACHE_NAME = 'galerie-v1';

const STATIC_ASSETS = [
  '/',
  '/gallery',
  '/map',
];

// 安装时预缓存核心页面
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 请求拦截：根据资源类型选择缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过 CORS 跨域请求（如 COS 图片）
  if (url.origin !== self.location.origin) {
    // 对于 COS 图片，使用 Cache-first 策略
    if (url.hostname.includes('cos.') || url.hostname.includes('myqcloud.com')) {
      event.respondWith(cacheFirst(request));
      return;
    }
    // 其他跨域请求走网络
    return;
  }

  // 判断请求类型
  const isHtml = request.destination === 'document' || url.pathname.endsWith('/');
  const isImage = request.destination === 'image' || /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname);
  const isStaticAsset = STATIC_ASSETS.includes(url.pathname) || /\.(js|css)$/i.test(url.pathname);

  if (isHtml || isStaticAsset) {
    // HTML 和静态资源：Stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request));
  } else if (isImage) {
    // 图片：Cache-first
    event.respondWith(cacheFirst(request));
  } else {
    // API 和其他请求：Network-first
    event.respondWith(networkFirst(request));
  }
});

// 策略：Cache-first（先查缓存，没有再走网络）
async function cacheFirst(request: Request): Promise<Response> {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  return fetch(request);
}

// 策略：Stale-while-revalidate（先返回缓存，同时后台更新）
async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // 网络失败，返回缓存
    return cachedResponse || new Response('Offline', { status: 503 });
  });

  return cachedResponse || fetchPromise;
}

// 策略：Network-first（先走网络，失败再返回缓存）
async function networkFirst(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}
