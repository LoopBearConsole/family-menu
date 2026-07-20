// 老刘小炒 · 加速核心（轻量）
// 订单板：优先 LeanCloud 国内云；未配置时本机缓存 + 提示配置

const IMG_VER = 'fast3';
const REPO_CDN = 'https://cdn.jsdmirror.com/gh/LoopBearConsole/family-menu@main/';
const REPO_CDN2 = 'https://cdn.jsdelivr.net/gh/LoopBearConsole/family-menu@main/';
const BOARD_LOCAL_KEY = 'laoliu_order_board_v2';
const BOARD_CFG_KEY = 'laoliu_board_config_v1';
const BOARD_CLASS = 'KitchenBoard';
const BOARD_ROW_KEY = 'main';

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
  return [REPO_CDN + kind + '/', REPO_CDN2 + kind + '/', localBase(kind)];
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

// ---------------- 国内云：LeanCloud 配置 ----------------

function getBoardConfig() {
  // 优先本机配置（配置向导写入），其次 board-config.js
  try {
    const raw = localStorage.getItem(BOARD_CFG_KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (c && c.leancloud && c.leancloud.appId && c.leancloud.appKey && c.leancloud.serverURL) {
        return c;
      }
    }
  } catch (e) {}
  if (typeof window !== 'undefined' && window.BOARD_CONFIG && window.BOARD_CONFIG.leancloud) {
    const lc = window.BOARD_CONFIG.leancloud;
    if (lc.appId && lc.appKey && lc.serverURL) return window.BOARD_CONFIG;
  }
  return null;
}

function isCloudConfigured() {
  const c = getBoardConfig();
  return !!(c && c.leancloud && c.leancloud.appId && c.leancloud.appKey && c.leancloud.serverURL);
}

function saveBoardConfig(cfg) {
  localStorage.setItem(BOARD_CFG_KEY, JSON.stringify(cfg));
  window.BOARD_CONFIG = cfg;
}

function clearBoardConfig() {
  localStorage.removeItem(BOARD_CFG_KEY);
}

function leanBase() {
  const c = getBoardConfig();
  if (!c) throw new Error('未配置国内云');
  let base = String(c.leancloud.serverURL || '').replace(/\/+$/, '');
  if (!base) throw new Error('缺少 serverURL');
  // 兼容只填了 host 的情况
  if (!/^https?:\/\//i.test(base)) base = 'https://' + base;
  return base;
}

function leanHeaders() {
  const c = getBoardConfig();
  return {
    'X-LC-Id': c.leancloud.appId,
    'X-LC-Key': c.leancloud.appKey,
    'Content-Type': 'application/json;charset=UTF-8',
    Accept: 'application/json',
  };
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

// ---------------- 本地缓存 ----------------

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
  if (!data || typeof data !== 'object') return { orders: [], updatedAt: null, objectId: null };
  if (!Array.isArray(data.orders)) data.orders = [];
  return data;
}

function boardTime(b) {
  if (!b || !b.updatedAt) return 0;
  const t = Date.parse(b.updatedAt);
  return isNaN(t) ? 0 : t;
}

function mergeBoards(a, b) {
  const map = {};
  const put = (o, srcTime) => {
    if (!o || !o.id) return;
    const prev = map[o.id];
    if (!prev || srcTime >= (prev._t || 0)) {
      map[o.id] = Object.assign({}, prev || {}, o, { _t: srcTime });
    }
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
  return {
    orders: orders,
    updatedAt: updatedAt || new Date().toISOString(),
    objectId: (boardTime(a) >= boardTime(b) ? a.objectId : b.objectId) || a.objectId || b.objectId || null,
  };
}

// ---------------- LeanCloud CRUD ----------------

async function leanFindMainRow() {
  const where = encodeURIComponent(JSON.stringify({ key: BOARD_ROW_KEY }));
  const url = leanBase() + '/1.1/classes/' + BOARD_CLASS + '?where=' + where + '&limit=1';
  const res = await fetchWithTimeout(
    url,
    { method: 'GET', headers: leanHeaders(), mode: 'cors', credentials: 'omit', cache: 'no-store' },
    12000
  );
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error('查询失败 HTTP ' + res.status + ' ' + t.slice(0, 120));
  }
  const data = await res.json();
  const results = (data && data.results) || [];
  if (!results.length) return null;
  const row = results[0];
  return {
    objectId: row.objectId,
    orders: Array.isArray(row.orders) ? row.orders : [],
    updatedAt: row.updatedAtBoard || row.updatedAt || null,
  };
}

async function leanCreateMainRow(board) {
  const url = leanBase() + '/1.1/classes/' + BOARD_CLASS;
  const body = JSON.stringify({
    key: BOARD_ROW_KEY,
    orders: board.orders || [],
    updatedAtBoard: board.updatedAt || new Date().toISOString(),
  });
  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: leanHeaders(),
      body: body,
      mode: 'cors',
      credentials: 'omit',
    },
    15000
  );
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error('创建失败 HTTP ' + res.status + ' ' + t.slice(0, 120));
  }
  const data = await res.json();
  return data.objectId;
}

async function leanUpdateMainRow(objectId, board) {
  const url = leanBase() + '/1.1/classes/' + BOARD_CLASS + '/' + objectId;
  const body = JSON.stringify({
    orders: board.orders || [],
    updatedAtBoard: board.updatedAt || new Date().toISOString(),
  });
  const res = await fetchWithTimeout(
    url,
    {
      method: 'PUT',
      headers: leanHeaders(),
      body: body,
      mode: 'cors',
      credentials: 'omit',
    },
    15000
  );
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error('更新失败 HTTP ' + res.status + ' ' + t.slice(0, 120));
  }
  return true;
}

async function fetchRemoteBoardOnce() {
  if (!isCloudConfigured()) throw new Error('未配置国内云');
  const row = await leanFindMainRow();
  if (!row) return { orders: [], updatedAt: null, objectId: null };
  return normalizeBoard(row);
}

async function putRemoteBoardOnce(board) {
  if (!isCloudConfigured()) throw new Error('未配置国内云');
  let objectId = board.objectId;
  if (!objectId) {
    const existing = await leanFindMainRow();
    objectId = existing && existing.objectId;
  }
  if (!objectId) {
    objectId = await leanCreateMainRow(board);
    board.objectId = objectId;
    return true;
  }
  await leanUpdateMainRow(objectId, board);
  board.objectId = objectId;
  return true;
}

async function fetchOrderBoard() {
  const local = readLocalBoard();
  if (!isCloudConfigured()) {
    // 未配置云：只返回本机，并标记
    local._cloud = false;
    return normalizeBoard(local);
  }
  let remote = null;
  let remoteErr = null;
  for (let i = 0; i < 3; i++) {
    try {
      remote = await fetchRemoteBoardOnce();
      remoteErr = null;
      break;
    } catch (e) {
      remoteErr = e;
      await new Promise((r) => setTimeout(r, 280 * (i + 1)));
    }
  }
  if (remote) {
    const merged = mergeBoards(local, remote);
    merged.objectId = remote.objectId || local.objectId || null;
    merged._cloud = true;
    writeLocalBoard(merged);
    return merged;
  }
  if (local.orders && local.orders.length) {
    local._cloud = false;
    local._cloudError = String((remoteErr && remoteErr.message) || '云读取失败');
    return normalizeBoard(local);
  }
  throw remoteErr || new Error('读取订单板失败');
}

async function saveOrderBoard(board) {
  const payload = {
    orders: board.orders || [],
    updatedAt: board.updatedAt || new Date().toISOString(),
    objectId: board.objectId || null,
  };
  writeLocalBoard(payload);
  if (!isCloudConfigured()) {
    payload._remoteOk = false;
    payload._cloud = false;
    return false;
  }
  let lastErr = null;
  for (let i = 0; i < 4; i++) {
    try {
      await putRemoteBoardOnce(payload);
      writeLocalBoard(payload);
      payload._remoteOk = true;
      payload._cloud = true;
      return true;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  console.warn('国内云同步失败，已写本机', lastErr);
  payload._remoteOk = false;
  payload._cloudError = String((lastErr && lastErr.message) || '同步失败');
  return false;
}

async function mutateBoard(mutator) {
  let board;
  try {
    board = await fetchOrderBoard();
  } catch (e) {
    board = readLocalBoard();
  }
  const next = mutator(normalizeBoard(board));
  next.updatedAt = new Date().toISOString();
  next.objectId = board.objectId || next.objectId || null;
  const ok = await saveOrderBoard(next);
  next._remoteOk = ok;
  next._cloud = isCloudConfigured();
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

/** 测试云连接：读写一条空订单板 */
async function testCloudConnection() {
  if (!isCloudConfigured()) throw new Error('请先填写 AppId / AppKey / 服务器地址');
  const row = await leanFindMainRow();
  if (!row) {
    await leanCreateMainRow({ orders: [], updatedAt: new Date().toISOString() });
  } else {
    // 轻量 touch
    await leanUpdateMainRow(row.objectId, {
      orders: row.orders || [],
      updatedAt: row.updatedAt || new Date().toISOString(),
    });
  }
  return true;
}
