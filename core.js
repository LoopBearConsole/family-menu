// 老刘小炒 · 加速核心
// 订单板：Gitee 国内私有仓库（可注册）+ 本机缓存

const IMG_VER = 'fast4';
const REPO_CDN = 'https://cdn.jsdmirror.com/gh/LoopBearConsole/family-menu@main/';
const REPO_CDN2 = 'https://cdn.jsdelivr.net/gh/LoopBearConsole/family-menu@main/';
const BOARD_LOCAL_KEY = 'laoliu_order_board_v3';
const BOARD_CFG_KEY = 'laoliu_board_config_v2';

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

// ---------------- 配置（Gitee 国内） ----------------

function getBoardConfig() {
  try {
    const raw = localStorage.getItem(BOARD_CFG_KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (c && c.gitee && c.gitee.owner && c.gitee.token) return c;
    }
  } catch (e) {}
  if (typeof window !== 'undefined' && window.BOARD_CONFIG && window.BOARD_CONFIG.gitee) {
    const g = window.BOARD_CONFIG.gitee;
    if (g.owner && g.token) return window.BOARD_CONFIG;
  }
  return null;
}

function isCloudConfigured() {
  const c = getBoardConfig();
  return !!(c && c.gitee && c.gitee.owner && c.gitee.token && (c.gitee.repo || 'laoliu-board'));
}

function saveBoardConfig(cfg) {
  localStorage.setItem(BOARD_CFG_KEY, JSON.stringify(cfg));
  window.BOARD_CONFIG = cfg;
}

function clearBoardConfig() {
  localStorage.removeItem(BOARD_CFG_KEY);
}

function giteeCfg() {
  const c = getBoardConfig();
  if (!c || !c.gitee) throw new Error('未配置 Gitee');
  return {
    owner: String(c.gitee.owner || '').trim(),
    repo: String(c.gitee.repo || 'laoliu-board').trim() || 'laoliu-board',
    token: String(c.gitee.token || '').trim(),
    path: String(c.gitee.path || 'board.json').trim() || 'board.json',
  };
}

function fetchWithTimeout(url, options, ms) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(function () {
    if (ctrl) ctrl.abort();
  }, ms || 15000);
  const opts = Object.assign({}, options || {}, ctrl ? { signal: ctrl.signal } : {});
  return fetch(url, opts).finally(function () {
    clearTimeout(timer);
  });
}

// ---------------- 本地缓存 ----------------

function readLocalBoard() {
  try {
    const raw = localStorage.getItem(BOARD_LOCAL_KEY);
    if (!raw) return { orders: [], updatedAt: null, sha: null };
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return { orders: [], updatedAt: null, sha: null };
    if (!Array.isArray(data.orders)) data.orders = [];
    return data;
  } catch (e) {
    return { orders: [], updatedAt: null, sha: null };
  }
}

function writeLocalBoard(board) {
  try {
    localStorage.setItem(
      BOARD_LOCAL_KEY,
      JSON.stringify({
        orders: board.orders || [],
        updatedAt: board.updatedAt || new Date().toISOString(),
        sha: board.sha || null,
      })
    );
  } catch (e) {}
}

function normalizeBoard(data) {
  if (!data || typeof data !== 'object') return { orders: [], updatedAt: null, sha: null };
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
    sha: (boardTime(a) >= boardTime(b) ? a.sha : b.sha) || a.sha || b.sha || null,
  };
}

// ---------------- Gitee Contents API ----------------
// https://gitee.com/api/v5/swagger

function utf8ToBase64(str) {
  // 浏览器安全 base64
  return btoa(unescape(encodeURIComponent(str)));
}

function base64ToUtf8(b64) {
  return decodeURIComponent(escape(atob(b64)));
}

async function giteeGetFile() {
  const g = giteeCfg();
  const url =
    'https://gitee.com/api/v5/repos/' +
    encodeURIComponent(g.owner) +
    '/' +
    encodeURIComponent(g.repo) +
    '/contents/' +
    g.path.replace(/^\//, '') +
    '?access_token=' +
    encodeURIComponent(g.token) +
    '&t=' +
    Date.now();
  const res = await fetchWithTimeout(
    url,
    { method: 'GET', headers: { Accept: 'application/json' }, cache: 'no-store', mode: 'cors' },
    15000
  );
  if (res.status === 404) {
    return { orders: [], updatedAt: null, sha: null, _missing: true };
  }
  if (!res.ok) {
    const t = await res.text().catch(function () {
      return '';
    });
    throw new Error('Gitee 读取失败 HTTP ' + res.status + ' ' + t.slice(0, 160));
  }
  const meta = await res.json();
  // content 可能被按 60 字符换行
  const content = base64ToUtf8(String(meta.content || '').replace(/\n/g, ''));
  let data;
  try {
    data = JSON.parse(content || '{}');
  } catch (e) {
    data = { orders: [], updatedAt: null };
  }
  data = normalizeBoard(data);
  data.sha = meta.sha || null;
  return data;
}

async function giteePutFile(board, sha) {
  const g = giteeCfg();
  const payload = {
    orders: board.orders || [],
    updatedAt: board.updatedAt || new Date().toISOString(),
  };
  const body = {
    access_token: g.token,
    content: utf8ToBase64(JSON.stringify(payload)),
    message: 'update kitchen board ' + payload.updatedAt,
    sha: sha || undefined,
  };
  // 无 sha 时创建文件；有 sha 时更新
  if (!body.sha) delete body.sha;

  const url =
    'https://gitee.com/api/v5/repos/' +
    encodeURIComponent(g.owner) +
    '/' +
    encodeURIComponent(g.repo) +
    '/contents/' +
    g.path.replace(/^\//, '');

  const res = await fetchWithTimeout(
    url,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json;charset=UTF-8', Accept: 'application/json' },
      body: JSON.stringify(body),
      mode: 'cors',
      cache: 'no-store',
    },
    20000
  );
  if (!res.ok) {
    const t = await res.text().catch(function () {
      return '';
    });
    // 若冲突（sha 过期），抛出让上层重试
    throw new Error('Gitee 写入失败 HTTP ' + res.status + ' ' + t.slice(0, 200));
  }
  const meta = await res.json();
  const newSha = (meta.content && meta.content.sha) || (meta.commit && meta.commit.sha) || null;
  return newSha;
}

async function fetchRemoteBoardOnce() {
  if (!isCloudConfigured()) throw new Error('未配置 Gitee');
  return await giteeGetFile();
}

async function putRemoteBoardOnce(board) {
  if (!isCloudConfigured()) throw new Error('未配置 Gitee');
  let sha = board.sha || null;
  // 若没有 sha，先尝试 GET 一次
  if (!sha) {
    try {
      const cur = await giteeGetFile();
      sha = cur.sha || null;
      if (cur.orders && cur.orders.length && !(board.orders && board.orders.length)) {
        // 避免空写覆盖：合并
        board = mergeBoards(cur, board);
      }
    } catch (e) {}
  }
  try {
    const newSha = await giteePutFile(board, sha);
    board.sha = newSha;
    return true;
  } catch (e) {
    // sha 冲突则拉最新再写一次
    const msg = String((e && e.message) || e);
    if (/404|sha|409|400/i.test(msg)) {
      const cur = await giteeGetFile();
      const merged = mergeBoards(cur, board);
      const newSha = await giteePutFile(merged, cur.sha || null);
      board.orders = merged.orders;
      board.updatedAt = merged.updatedAt;
      board.sha = newSha;
      return true;
    }
    throw e;
  }
}

async function fetchOrderBoard() {
  const local = readLocalBoard();
  if (!isCloudConfigured()) {
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
      await new Promise(function (r) {
        setTimeout(r, 300 * (i + 1));
      });
    }
  }
  if (remote) {
    const merged = mergeBoards(local, remote);
    merged.sha = remote.sha || local.sha || null;
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
    sha: board.sha || null,
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
      await new Promise(function (r) {
        setTimeout(r, 450 * (i + 1));
      });
    }
  }
  console.warn('Gitee 同步失败，已写本机', lastErr);
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
  next.sha = board.sha || next.sha || null;
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

/** 测试：读/写 board.json */
async function testCloudConnection() {
  if (!isCloudConfigured()) throw new Error('请先填写 Gitee 用户名、仓库名、私人令牌');
  const cur = await giteeGetFile();
  const board = {
    orders: cur.orders || [],
    updatedAt: new Date().toISOString(),
    sha: cur.sha || null,
  };
  // 若文件不存在，创建；存在则 touch 更新时间
  await putRemoteBoardOnce(board);
  return true;
}
