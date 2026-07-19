// 老刘小炒 · 加速核心（轻量）
const ORDER_BOARD_ID = '019f7956-dbdc-767d-9801-ae89afad20d8';
const ORDER_BOARD_URL = 'https://jsonblob.com/api/jsonBlob/' + ORDER_BOARD_ID;
const IMG_VER = 'fast1';

function assetBase(kind) {
  // kind: 'images' | 'thumbs' | 'details'
  try {
    if (typeof location === 'undefined' || location.protocol === 'file:') return kind + '/';
    const host = location.hostname || '';
    // 国内 jsDelivr 镜像打开 HTML 时，资源也走镜像
    if (/jsdmirror|jsdelivr|gcore\.jsdelivr|fastly\.jsdelivr/i.test(host)) {
      return 'https://cdn.jsdmirror.com/gh/LoopBearConsole/family-menu@main/' + kind + '/';
    }
    if (host.endsWith('github.io')) {
      const segs = location.pathname.split('/').filter(Boolean);
      const repo = segs[0] || 'family-menu';
      return '/' + repo + '/' + kind + '/';
    }
    // Cloudflare Pages / 其它静态托管：同源相对路径
    const p = location.pathname || '/';
    const dir = p.endsWith('/') ? p : p.replace(/[^/]+$/, '');
    return dir + kind + '/';
  } catch (e) {
    return kind + '/';
  }
}

function imgOf(id, thumb) {
  const d = (typeof DISHES_LITE !== 'undefined' ? DISHES_LITE : []).find(x => x.id === id)
    || (window.__detailCache && window.__detailCache[id]);
  const file = (d && d.img) ? d.img : (id + '.jpg');
  const folder = thumb ? 'thumbs' : 'images';
  // 多源：本站优先，国内镜像兜底
  const bases = [
    assetBase(folder),
    'https://cdn.jsdmirror.com/gh/LoopBearConsole/family-menu@main/' + folder + '/',
    'https://cdn.jsdelivr.net/gh/LoopBearConsole/family-menu@main/' + folder + '/',
  ];
  return bases[0] + file + '?' + IMG_VER;
}

function onImgError(el, id, thumb) {
  const d = (typeof DISHES_LITE !== 'undefined' ? DISHES_LITE : []).find(x => x.id === id);
  const file = (d && d.img) ? d.img : (id + '.jpg');
  const folder = thumb ? 'thumbs' : 'images';
  const step = Number(el.dataset.fb || 0) + 1;
  el.dataset.fb = String(step);
  const bases = [
    assetBase(folder),
    'https://cdn.jsdmirror.com/gh/LoopBearConsole/family-menu@main/' + folder + '/',
    'https://cdn.jsdelivr.net/gh/LoopBearConsole/family-menu@main/' + folder + '/',
    assetBase('images'), // thumb 失败回退大图
  ];
  if (step < bases.length) {
    el.src = bases[step] + file + '?' + IMG_VER + '&r=' + step;
    return;
  }
  el.style.display = 'none';
  const wrap = el.parentElement;
  if (wrap && !wrap.querySelector('.img-fallback')) {
    const div = document.createElement('div');
    div.className = 'img-fallback';
    div.textContent = (el.alt || (d && d.name) || '菜').slice(0, 1);
    wrap.appendChild(div);
  }
}

function findDishLite(id) {
  return (typeof DISHES_LITE !== 'undefined' ? DISHES_LITE : []).find(d => d.id === id);
}

window.__detailCache = window.__detailCache || {};

async function loadDishDetail(id) {
  if (window.__detailCache[id]) return window.__detailCache[id];
  const urls = [
    assetBase('details') + id + '.json?' + IMG_VER,
    'https://cdn.jsdmirror.com/gh/LoopBearConsole/family-menu@main/details/' + id + '.json',
    'https://cdn.jsdelivr.net/gh/LoopBearConsole/family-menu@main/details/' + id + '.json',
  ];
  let lastErr;
  for (const u of urls) {
    try {
      const res = await fetch(u, { cache: 'force-cache' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      window.__detailCache[id] = data;
      return data;
    } catch (e) { lastErr = e; }
  }
  // 兜底：轻量字段
  const lite = findDishLite(id);
  if (lite) return Object.assign({ ingredients: [], steps: [], desc: '', tip: '' }, lite);
  throw lastErr || new Error('load detail fail');
}

function dishSteps(dish) {
  if (!dish) return [];
  if (dish.steps && dish.steps.length) return dish.steps;
  return String(dish.desc || '').split(/[。！？；\n]/).map(s => s.trim()).filter(Boolean)
    .map(s => /[。！？]$/.test(s) ? s : s + '。');
}

async function fetchOrderBoard() {
  const res = await fetch(ORDER_BOARD_URL, { headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!res.ok) throw new Error('读取订单板失败 ' + res.status);
  const data = await res.json();
  if (!data || typeof data !== 'object') return { orders: [], updatedAt: null };
  if (!Array.isArray(data.orders)) data.orders = [];
  return data;
}

async function saveOrderBoard(board) {
  const body = JSON.stringify({ orders: board.orders || [], updatedAt: new Date().toISOString() });
  const res = await fetch(ORDER_BOARD_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body
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
  board.orders = (board.orders || []).map(o => o.id === orderId ? Object.assign({}, o, { status }) : o);
  await saveOrderBoard(board);
  return board;
}

async function clearDoneKitchenOrders() {
  const board = await fetchOrderBoard();
  board.orders = (board.orders || []).filter(o => o.status !== 'done');
  await saveOrderBoard(board);
  return board;
}
