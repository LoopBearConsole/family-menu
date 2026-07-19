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

async function fetchOrderBoard() {
  const res = await fetch(ORDER_BOARD_URL, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('读取订单板失败 ' + res.status);
  const data = await res.json();
  if (!data || typeof data !== 'object') return { orders: [], updatedAt: null };
  if (!Array.isArray(data.orders)) data.orders = [];
  return data;
}

async function saveOrderBoard(board) {
  const body = JSON.stringify({
    orders: board.orders || [],
    updatedAt: new Date().toISOString(),
  });
  const res = await fetch(ORDER_BOARD_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body,
  });
  if (!res.ok) throw new Error('同步厨房失败 ' + res.status);
  return true;
}

async function pushKitchenOrder(order) {
  const board = await fetchOrderBoard();
  board.orders = Array.isArray(board.orders) ? board.orders : [];
  board.orders.unshift(order);
  board.orders = board.orders.slice(0, 30);
  await saveOrderBoard(board);
  return board;
}

async function updateKitchenOrderStatus(orderId, status) {
  const board = await fetchOrderBoard();
  board.orders = (board.orders || []).map((o) =>
    o.id === orderId ? Object.assign({}, o, { status: status }) : o
  );
  await saveOrderBoard(board);
  return board;
}

async function clearDoneKitchenOrders() {
  const board = await fetchOrderBoard();
  board.orders = (board.orders || []).filter((o) => o.status !== 'done');
  await saveOrderBoard(board);
  return board;
}
