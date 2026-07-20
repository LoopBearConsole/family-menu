// 老刘小炒 · 加速核心（轻量）
// HTML 入口必须用 github.io（能当网页打开）
// 图片/JS/详情 优先走国内 CDN 镜像
const ORDER_BOARD_ID = '019f7956-dbdc-767d-9801-ae89afad20d8';
const ORDER_BOARD_URL = 'https://jsonblob.com/api/jsonBlob/' + ORDER_BOARD_ID;
const IMG_VER = 'fast2';
const REPO_CDN = 'https://cdn.jsdmirror.com/gh/LoopBearConsole/family-menu@main/';
const REPO_CDN2 = 'https://cdn.jsdelivr.net/gh/LoopBearConsole/family-menu@main/';

function localBase(kind) {
  try {
    if (typeof location === 'undefined' || location.protocol === 'file:') return kind + '/';
    if ((location.hostname || '').endsWith('github.io')) {
      const segs = location.pathname.split('/').filter(Boolean);
      return '/' + (segs[0] || 'family-menu') + '/' + kind + '/';
    }
    const p = location.pathname || '/';
    const dir = p.endsWith('/') ? p : p.replace(/[^/]+$/, '');
    return dir + kind + '/';
  } catch (e) {
    return kind + '/';
  }
}

function cdnBases(kind) {
  // 国内镜像优先 → jsdelivr → 本站
  return [
    REPO_CDN + kind + '/',
    REPO_CDN2 + kind + '/',
    localBase(kind),
  ];
}

function imgOf(id, thumb) {
  const d =
    (typeof DISHES_LITE !== 'undefined' ? DISHES_LITE : []).find((x) => x.id === id) ||
    (window.__detailCache && window.__detailCache[id]);
  const file = d && d.img ? d.img : id + '.jpg';
  const folder = thumb ? 'thumbs' : 'images';
  return cdnBases(folder)[0] + file + '?' + IMG_VER;
}

function onImgError(el, id, thumb) {
  const d = (typeof DISHES_LITE !== 'undefined' ? DISHES_LITE : []).find((x) => x.id === id);
  const file = d && d.img ? d.img : id + '.jpg';
  const folder = thumb ? 'thumbs' : 'images';
  const step = Number(el.dataset.fb || 0) + 1;
  el.dataset.fb = String(step);
  const bases = cdnBases(folder).concat(cdnBases('images'));
  if (step < bases.length) {
    el.src = bases[step] + file + '?' + IMG_VER + '&r=' + step;
    return;
  }
  el.style.display = 'none';
  el.classList.add('loaded');
  const wrap = el.parentElement;
  if (wrap && !wrap.querySelector('.img-fallback')) {
    const div = document.createElement('div');
    div.className = 'img-fallback';
    div.textContent = (el.alt || (d && d.name) || '菜').slice(0, 1);
    wrap.appendChild(div);
  }
}

function findDishLite(id) {
  return (typeof DISHES_LITE !== 'undefined' ? DISHES_LITE : []).find((d) => d.id === id);
}

window.__detailCache = window.__detailCache || {};

async function loadDishDetail(id) {
  if (window.__detailCache[id]) return window.__detailCache[id];
  const urls = [
    REPO_CDN + 'details/' + id + '.json?' + IMG_VER,
    REPO_CDN2 + 'details/' + id + '.json',
    localBase('details') + id + '.json?' + IMG_VER,
  ];
  let lastErr;
  for (const u of urls) {
    try {
      const res = await fetch(u, { cache: 'force-cache' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      window.__detailCache[id] = data;
      return data;
    } catch (e) {
      lastErr = e;
    }
  }
  const lite = findDishLite(id);
  if (lite) return Object.assign({ ingredients: [], steps: [], desc: '', tip: '' }, lite);
  throw lastErr || new Error('load detail fail');
}

function dishSteps(dish) {
  if (!dish) return [];
  if (dish.steps && dish.steps.length) return dish.steps;
  return String(dish.desc || '')
    .split(/[。！？；\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (/[。！？]$/.test(s) ? s : s + '。'));
}

// ---------- 订单板：远程 + 本地缓存 + 重试（解决厨房不刷新/按钮失败）----------
const BOARD_LOCAL_KEY = 'laoliu_order_board_v1';
const BOARD_URLS = [
  // 主：jsonblob（带时间戳防缓存）
  ORDER_BOARD_URL,
];

function readLocalBoard() {
  try {
    const raw = localStorage.getItem(BOARD_LOCAL_KEY);
    if (!raw) return { orders: [], updatedAt: null };
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return { orders: [], updatedAt: null };
    if (!Array.isArray(data.orders)) data.orders = [];
    return data;
  } catch (e) {
    return { orders: [], updatedAt: null };
  }
}

function writeLocalBoard(board) {
  try {
    localStorage.setItem(
      BOARD_LOCAL_KEY,
      JSON.stringify({
        orders: board.orders || [],
        updatedAt: board.updatedAt || new Date().toISOString(),
      })
    );
  } catch (e) {}
}

function normalizeBoard(data) {
  if (!data || typeof data !== 'object') return { orders: [], updatedAt: null };
  if (!Array.isArray(data.orders)) data.orders = [];
  return data;
}

function boardTime(b) {
  if (!b || !b.updatedAt) return 0;
  const t = Date.parse(b.updatedAt);
  return isNaN(t) ? 0 : t;
}

/** 合并两份订单板：按订单 id 合并，status 取“更新时间更新”的一侧；新订单都保留 */
function mergeBoards(a, b) {
  const map = {};
  const put = (o, srcTime) => {
    if (!o || !o.id) return;
    const prev = map[o.id];
    if (!prev) {
      map[o.id] = Object.assign({}, o, { _t: srcTime });
      return;
    }
    // 同 id：优先 status 变更时间较新；否则用 srcTime
    const pt = prev._t || 0;
    if (srcTime >= pt) map[o.id] = Object.assign({}, prev, o, { _t: srcTime });
  };
  (a.orders || []).forEach((o) => put(o, boardTime(a)));
  (b.orders || []).forEach((o) => put(o, boardTime(b)));
  const orders = Object.values(map)
    .map((o) => {
      const x = Object.assign({}, o);
      delete x._t;
      return x;
    })
    .sort((x, y) => (y.ts || 0) - (x.ts || 0))
    .slice(0, 30);
  const updatedAt =
    boardTime(a) >= boardTime(b) ? a.updatedAt || b.updatedAt : b.updatedAt || a.updatedAt;
  return { orders: orders, updatedAt: updatedAt || new Date().toISOString() };
}

function fetchWithTimeout(url, options, ms) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(function () {
    if (ctrl) ctrl.abort();
  }, ms || 12000);
  const opts = Object.assign({}, options || {}, ctrl ? { signal: ctrl.signal } : {});
  return fetch(url, opts).finally(function () {
    clearTimeout(timer);
  });
}

async function fetchRemoteBoardOnce() {
  // 防缓存：加时间戳
  const url = ORDER_BOARD_URL + (ORDER_BOARD_URL.indexOf('?') >= 0 ? '&' : '?') + '_=' + Date.now();
  const res = await fetchWithTimeout(
    url,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      mode: 'cors',
      credentials: 'omit',
    },
    12000
  );
  if (!res.ok) throw new Error('读取失败 HTTP ' + res.status);
  const data = await res.json();
  return normalizeBoard(data);
}

async function putRemoteBoardOnce(board) {
  const body = JSON.stringify({
    orders: board.orders || [],
    updatedAt: board.updatedAt || new Date().toISOString(),
  });
  const res = await fetchWithTimeout(
    ORDER_BOARD_URL,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Accept: 'application/json',
      },
      body: body,
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
    },
    15000
  );
  if (!res.ok) throw new Error('写入失败 HTTP ' + res.status);
  return true;
}

async function fetchOrderBoard() {
  const local = readLocalBoard();
  let remote = null;
  let remoteErr = null;
  // 重试 3 次读远程
  for (let i = 0; i < 3; i++) {
    try {
      remote = await fetchRemoteBoardOnce();
      remoteErr = null;
      break;
    } catch (e) {
      remoteErr = e;
      await new Promise(function (r) {
        setTimeout(r, 300 * (i + 1));
      });
    }
  }
  if (remote) {
    const merged = mergeBoards(local, remote);
    writeLocalBoard(merged);
    return merged;
  }
  // 远程全失败：退回本地，保证厨房至少能操作本机状态
  if (local.orders && local.orders.length) return local;
  throw remoteErr || new Error('读取订单板失败');
}

async function saveOrderBoard(board) {
  const payload = {
    orders: board.orders || [],
    updatedAt: board.updatedAt || new Date().toISOString(),
  };
  // 先写本地，保证按钮立刻成功
  writeLocalBoard(payload);
  let lastErr = null;
  for (let i = 0; i < 4; i++) {
    try {
      await putRemoteBoardOnce(payload);
      return true;
    } catch (e) {
      lastErr = e;
      await new Promise(function (r) {
        setTimeout(r, 400 * (i + 1));
      });
    }
  }
  // 远程失败不抛死：本地已保存，后台可再刷
  console.warn('远程同步失败，已保存到本机', lastErr);
  return false;
}

async function mutateBoard(mutator) {
  // 读最新（本地+远程合并）→ 改 → 写
  let board;
  try {
    board = await fetchOrderBoard();
  } catch (e) {
    board = readLocalBoard();
  }
  const next = mutator(normalizeBoard(board));
  next.updatedAt = new Date().toISOString();
  const ok = await saveOrderBoard(next);
  next._remoteOk = ok;
  return next;
}

async function pushKitchenOrder(order) {
  return mutateBoard(function (board) {
    board.orders = Array.isArray(board.orders) ? board.orders : [];
    board.orders.unshift(order);
    board.orders = board.orders.slice(0, 30);
    return board;
  });
}

async function updateKitchenOrderStatus(orderId, status) {
  return mutateBoard(function (board) {
    board.orders = (board.orders || []).map(function (o) {
      return o.id === orderId ? Object.assign({}, o, { status: status }) : o;
    });
    return board;
  });
}

async function clearDoneKitchenOrders() {
  return mutateBoard(function (board) {
    board.orders = (board.orders || []).filter(function (o) {
      return o.status !== 'done';
    });
    return board;
  });
}
