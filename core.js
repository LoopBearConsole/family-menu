// 老刘小炒 · 加速核心
// 订单板：jsonblob + 本机缓存 + 乐观更新（按钮先变，后台再同步）

// 换图后务必改版本号，并优先走 github.io（CDN 会缓存旧图很久）
const IMG_VER = 'imgfix25';
const PAGES_ORIGIN = 'https://loopbearconsole.github.io/family-menu/';
const REPO_CDN = 'https://cdn.jsdmirror.com/gh/LoopBearConsole/family-menu@main/';
const REPO_CDN2 = 'https://cdn.jsdelivr.net/gh/LoopBearConsole/family-menu@main/';
const ORDER_BOARD_ID = '019f7956-dbdc-767d-9801-ae89afad20d8';
const ORDER_BOARD_URL = 'https://jsonblob.com/api/jsonBlob/' + ORDER_BOARD_ID;
const BOARD_LOCAL_KEY = 'laoliu_order_board_v4';

function localBase(kind) {
  try {
    if (typeof location === 'undefined' || location.protocol === 'file:') {
      return PAGES_ORIGIN + kind + '/';
    }
    if ((location.hostname || '').endsWith('github.io')) {
      const segs = location.pathname.split('/').filter(Boolean);
      return '/' + (segs[0] || 'family-menu') + '/' + kind + '/';
    }
    const p = location.pathname || '/';
    const dir = p.endsWith('/') ? p : p.replace(/[^/]+$/, '');
    return dir + kind + '/';
  } catch (e) {
    return PAGES_ORIGIN + kind + '/';
  }
}

// 优先本站 github.io（随仓库更新），CDN 仅作备用
function imgBases(kind) {
  return [localBase(kind), PAGES_ORIGIN + kind + '/', REPO_CDN + kind + '/', REPO_CDN2 + kind + '/'];
}

function imgOf(id, thumb) {
  const d =
    (typeof DISHES_LITE !== 'undefined' ? DISHES_LITE : []).find((x) => x.id === id) ||
    (window.__detailCache && window.__detailCache[id]);
  const file = d && d.img ? d.img : id + '.jpg';
  const folder = thumb ? 'thumbs' : 'images';
  return imgBases(folder)[0] + file + '?' + IMG_VER;
}

function onImgError(el, id, thumb) {
  const d = (typeof DISHES_LITE !== 'undefined' ? DISHES_LITE : []).find((x) => x.id === id);
  const file = d && d.img ? d.img : id + '.jpg';
  const folder = thumb ? 'thumbs' : 'images';
  const step = Number(el.dataset.fb || 0) + 1;
  el.dataset.fb = String(step);
  const bases = imgBases(folder).concat(imgBases('images'));
  // 去重
  const uniq = [];
  bases.forEach(function (b) {
    if (uniq.indexOf(b) < 0) uniq.push(b);
  });
  if (step < uniq.length) {
    el.src = uniq[step] + file + '?' + IMG_VER + '&r=' + step;
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
    localBase('details') + id + '.json?' + IMG_VER,
    PAGES_ORIGIN + 'details/' + id + '.json?' + IMG_VER,
    REPO_CDN + 'details/' + id + '.json?' + IMG_VER,
    REPO_CDN2 + 'details/' + id + '.json',
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

// ---------------- 订单板 ----------------

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

function orderTime(o, boardFallback) {
  if (!o) return boardFallback || 0;
  if (o.updatedAt) {
    const t = Date.parse(o.updatedAt);
    if (!isNaN(t)) return t;
  }
  if (o.ts) return Number(o.ts) || 0;
  return boardFallback || 0;
}

// 按单笔订单时间合并，避免整板 updatedAt 把刚改的状态盖掉
function mergeBoards(a, b) {
  const map = {};
  const put = (o, boardFallback) => {
    if (!o || !o.id) return;
    const t = orderTime(o, boardFallback);
    const prev = map[o.id];
    if (!prev || t >= (prev._t || 0)) {
      map[o.id] = Object.assign({}, prev || {}, o, { _t: t });
    }
  };
  const ta = boardTime(a);
  const tb = boardTime(b);
  (a.orders || []).forEach((o) => put(o, ta));
  (b.orders || []).forEach((o) => put(o, tb));
  const orders = Object.values(map)
    .map((o) => {
      const x = Object.assign({}, o);
      delete x._t;
      return x;
    })
    .sort((x, y) => (y.ts || 0) - (x.ts || 0))
    .slice(0, 30);
  const updatedAt =
    ta >= tb ? a.updatedAt || b.updatedAt : b.updatedAt || a.updatedAt;
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
  const url = ORDER_BOARD_URL + '?_=' + Date.now();
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
  if (!res.ok) throw new Error('read fail ' + res.status);
  return normalizeBoard(await res.json());
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
  if (!res.ok) throw new Error('write fail ' + res.status);
  return true;
}

async function fetchOrderBoard() {
  const local = readLocalBoard();
  let remote = null;
  let remoteErr = null;
  for (let i = 0; i < 3; i++) {
    try {
      remote = await fetchRemoteBoardOnce();
      remoteErr = null;
      break;
    } catch (e) {
      remoteErr = e;
      await new Promise(function (r) {
        setTimeout(r, 250 * (i + 1));
      });
    }
  }
  if (remote) {
    const merged = mergeBoards(local, remote);
    writeLocalBoard(merged);
    return merged;
  }
  // 远程失败也返回本机
  if (local) {
    local._remoteOk = false;
    local._cloudError = String((remoteErr && remoteErr.message) || '');
    return normalizeBoard(local);
  }
  throw remoteErr || new Error('fetch board fail');
}

async function saveOrderBoard(board) {
  const payload = {
    orders: board.orders || [],
    updatedAt: board.updatedAt || new Date().toISOString(),
  };
  // 永远先写本机
  writeLocalBoard(payload);
  let lastErr = null;
  for (let i = 0; i < 3; i++) {
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
  console.warn('remote sync fail (local saved)', lastErr);
  return false;
}

// 本机先改，再尽量跟远程合并并写回；不因远程失败而抛错
async function mutateBoard(mutator) {
  const now = new Date().toISOString();
  const local = normalizeBoard(readLocalBoard());
  const cloned = {
    orders: (local.orders || []).map(function (o) {
      return Object.assign({}, o);
    }),
    updatedAt: local.updatedAt,
  };
  const next = mutator(cloned);
  next.updatedAt = now;
  writeLocalBoard(next);

  let toSave = next;
  try {
    const remote = await fetchRemoteBoardOnce();
    toSave = mergeBoards(next, remote);
    toSave.updatedAt = new Date().toISOString();
    writeLocalBoard(toSave);
  } catch (e) {
    // keep local
  }

  const ok = await saveOrderBoard(toSave);
  toSave._remoteOk = ok;
  return toSave;
}

async function pushKitchenOrder(order) {
  if (order && !order.updatedAt) order.updatedAt = new Date().toISOString();
  return mutateBoard(function (board) {
    board.orders = Array.isArray(board.orders) ? board.orders : [];
    board.orders.unshift(order);
    board.orders = board.orders.slice(0, 30);
    return board;
  });
}

async function updateKitchenOrderStatus(orderId, status) {
  const stamp = new Date().toISOString();
  return mutateBoard(function (board) {
    board.orders = (board.orders || []).map(function (o) {
      if (o.id !== orderId) return o;
      return Object.assign({}, o, { status: status, updatedAt: stamp });
    });
    return board;
  });
}

async function clearDoneKitchenOrders() {
  let base = normalizeBoard(readLocalBoard());
  try {
    const remote = await fetchRemoteBoardOnce();
    base = mergeBoards(base, remote);
  } catch (e) {}
  base.orders = (base.orders || []).filter(function (o) {
    return o.status !== 'done';
  });
  base.updatedAt = new Date().toISOString();
  const ok = await saveOrderBoard(base);
  base._remoteOk = ok;
  return base;
}

function isCloudConfigured() {
  return true;
}
function getBoardConfig() {
  return { provider: 'jsonblob' };
}
function saveBoardConfig() {}
function clearBoardConfig() {}
async function testCloudConnection() {
  await fetchRemoteBoardOnce();
  return true;
}
