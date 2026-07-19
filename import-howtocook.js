/**
 * 从 HowToCook 仓库导入菜谱 → shared.js + images/
 * 用法: node import-howtocook.js [HowToCook根目录]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HTC_ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'HowToCook'));
const DISHES_ROOT = path.join(HTC_ROOT, 'dishes');
const OUT_DIR = __dirname;
const IMG_DIR = path.join(OUT_DIR, 'images');
const ORDER_BOARD_ID = '019f7956-dbdc-767d-9801-ae89afad20d8';

const CAT_MAP = {
  aquatic: { cat: 'aquatic', label: '水产' },
  breakfast: { cat: 'breakfast', label: '早餐' },
  meat_dish: { cat: 'meat', label: '荤菜' },
  vegetable_dish: { cat: 'veggie', label: '素菜' },
  soup: { cat: 'soup', label: '汤羹' },
  staple: { cat: 'staple', label: '主食' },
  dessert: { cat: 'dessert', label: '甜品' },
  drink: { cat: 'drink', label: '饮品' },
  'semi-finished': { cat: 'semi', label: '半成品' },
  // condiment 调料不适合点餐，默认跳过
};

const SKIP_CATS = new Set(['template', 'condiment']);

function walkMd(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walkMd(p, list);
    else if (/\.md$/i.test(ent.name) && !/readme/i.test(ent.name)) list.push(p);
  }
  return list;
}

function extractSection(text, title) {
  const re = new RegExp(
    `##\\s*${title}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`,
    'i'
  );
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

function parseListItems(block) {
  if (!block) return [];
  return block
    .split('\n')
    .map((l) => l.replace(/^[\s]*[-*+]\s+/, '').replace(/^\d+\.\s+/, '').trim())
    .map((l) => l.replace(/\*+/g, '').replace(/!\[.*?\]\(.*?\)/g, '').trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('[') && l.length < 200);
}

function parseSteps(block) {
  if (!block) return [];
  const lines = block.split('\n');
  const steps = [];
  let cur = '';
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^!\[/.test(line)) continue; // skip image markdown
    const m = line.match(/^\d+[\.、]\s*(.+)$/);
    if (m) {
      if (cur) steps.push(cur);
      cur = m[1].replace(/!\[.*?\]\(.*?\)/g, '').trim();
    } else if (cur && !line.startsWith('#')) {
      cur += line.replace(/!\[.*?\]\(.*?\)/g, '').trim();
    }
  }
  if (cur) steps.push(cur);
  return steps.filter(Boolean);
}

function parseTimeMinutes(text, intro) {
  const candidates = [text, intro];
  for (const t of candidates) {
    if (!t) continue;
    let m = t.match(/预估烹饪时长[：:]\s*(\d+)\s*分钟/);
    if (m) return parseInt(m[1], 10);
    m = t.match(/约\s*(\d+)\s*分钟/);
    if (m) return parseInt(m[1], 10);
    m = t.match(/(\d+)\s*分钟/);
    if (m) return parseInt(m[1], 10);
  }
  // estimate from step count
  return 30;
}

function parseDifficulty(text) {
  const m = text.match(/预估烹饪难度[：:]\s*(★+)/);
  if (m) return m[1].length;
  return 0;
}

function findLocalImage(mdPath, mdText) {
  const dir = path.dirname(mdPath);
  // from markdown ![x](./1.jpeg)
  const refs = [...mdText.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1].trim());
  for (const ref of refs) {
    if (/^https?:/i.test(ref)) continue;
    const clean = ref.replace(/^\.\//, '').split('?')[0];
    const full = path.join(dir, clean);
    if (fs.existsSync(full)) return full;
  }
  // any image in same folder
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const preferred = files
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => {
      // prefer 1.jpeg, preview, etc
      const score = (n) => {
        if (/^1\./i.test(n)) return 0;
        if (/预览|cover|摆盘|成品/i.test(n)) return 1;
        return 2;
      };
      return score(a) - score(b) || a.localeCompare(b);
    });
  if (preferred.length) return path.join(dir, preferred[0]);
  return null;
}

function compressImage(src, dest) {
  // Use PowerShell System.Drawing via external call is heavy; try sharp if available, else copy + optional later compress
  try {
    // pure node: just copy first, compress batch later with a small script
    fs.copyFileSync(src, dest);
    return true;
  } catch (e) {
    console.warn('copy fail', src, e.message);
    return false;
  }
}

function parseRecipe(mdPath, catKey, index) {
  const text = fs.readFileSync(mdPath, 'utf8');
  const catInfo = CAT_MAP[catKey];
  if (!catInfo) return null;

  const titleM = text.match(/^#\s+(.+?)的做法\s*$/m) || text.match(/^#\s+(.+?)\s*$/m);
  if (!titleM) return null;
  let name = titleM[1].trim().replace(/的做法$/, '');
  if (!name || name.length > 40) return null;

  // intro: first paragraph after title
  const afterTitle = text.replace(/^#.*$/m, '').trim();
  const intro = afterTitle
    .split(/\n\n+/)
    .map((p) => p.replace(/\n/g, '').trim())
    .find((p) => p && !p.startsWith('#') && !p.startsWith('预估') && p.length > 10) || '';

  const calcBlock = extractSection(text, '计算') || extractSection(text, '必备原料和工具');
  const rawBlock = extractSection(text, '必备原料和工具');
  const opsBlock = extractSection(text, '操作');
  const extraBlock = extractSection(text, '附加内容');

  let ingredients = parseListItems(calcBlock);
  if (ingredients.length < 2) ingredients = parseListItems(rawBlock);
  // strip portion notes
  ingredients = ingredients
    .map((s) => s.replace(/\*.*$/, '').replace(/（.*?）/g, '').replace(/\(.*?\)/g, '').trim())
    .filter((s) => s && !/^每[份人]/.test(s) && s.length < 60)
    .slice(0, 20);

  const steps = parseSteps(opsBlock).slice(0, 25);
  if (steps.length < 1 && !intro) return null;

  const difficulty = parseDifficulty(text);
  const time = parseTimeMinutes(text, intro);
  const tips = parseListItems(extraBlock)
    .filter((s) => !/issue|pull request|github/i.test(s))
    .slice(0, 3);
  const tip = tips.join('；') || (difficulty ? `难度 ${'★'.repeat(difficulty)}` : '按步骤操作即可');

  const id = 'htc_' + String(index).padStart(3, '0');
  const imgSrc = findLocalImage(mdPath, text);
  let imgName = null;
  if (imgSrc) {
    imgName = id + '.jpg';
    const dest = path.join(IMG_DIR, imgName);
    compressImage(imgSrc, dest);
  }

  const tagline =
    (intro.length > 28 ? intro.slice(0, 28) + '…' : intro) ||
    (steps[0] ? steps[0].slice(0, 28) + (steps[0].length > 28 ? '…' : '') : 'HowToCook 菜谱');

  return {
    id,
    name,
    cat: catInfo.cat,
    catLabel: catInfo.label,
    time: Math.min(Math.max(time, 5), 180),
    spice: 0,
    difficulty,
    tagline,
    desc: intro.slice(0, 400) || `${name}，详见制作步骤。`,
    ingredients: ingredients.length ? ingredients : ['详见步骤'],
    steps: steps.length ? steps : [intro || '参见 HowToCook 原文'],
    tip,
    img: imgName,
    source: 'HowToCook',
  };
}

function main() {
  if (!fs.existsSync(DISHES_ROOT)) {
    console.error('HowToCook dishes not found:', DISHES_ROOT);
    process.exit(1);
  }
  if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

  // clean old htc images
  for (const f of fs.readdirSync(IMG_DIR)) {
    if (/^htc_\d+\.jpg$/i.test(f) || /^d\d+/.test(f) || /^d\d+b\.jpg$/i.test(f)) {
      try { fs.unlinkSync(path.join(IMG_DIR, f)); } catch {}
    }
  }

  const recipes = [];
  let idx = 1;
  const catDirs = fs.readdirSync(DISHES_ROOT, { withFileTypes: true }).filter((d) => d.isDirectory());

  for (const d of catDirs) {
    if (SKIP_CATS.has(d.name)) continue;
    if (!CAT_MAP[d.name]) continue;
    const files = walkMd(path.join(DISHES_ROOT, d.name));
    for (const md of files) {
      try {
        const r = parseRecipe(md, d.name, idx);
        if (r) {
          recipes.push(r);
          idx++;
        }
      } catch (e) {
        console.warn('skip', md, e.message);
      }
    }
  }

  // stable sort: by category then name
  recipes.sort((a, b) => a.cat.localeCompare(b.cat) || a.name.localeCompare(b.name, 'zh'));
  // re-id after sort for stable display order
  recipes.forEach((r, i) => {
    const newId = 'htc_' + String(i + 1).padStart(3, '0');
    if (r.img && r.img !== newId + '.jpg') {
      const oldPath = path.join(IMG_DIR, r.img);
      const newPath = path.join(IMG_DIR, newId + '.jpg');
      if (fs.existsSync(oldPath)) {
        try {
          if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
          fs.renameSync(oldPath, newPath);
        } catch {}
      }
      r.img = fs.existsSync(newPath) ? newId + '.jpg' : r.img;
    } else if (r.img) {
      // already htc_N from before re-sort - fix
      const oldPath = path.join(IMG_DIR, r.img);
      const newPath = path.join(IMG_DIR, newId + '.jpg');
      if (oldPath !== newPath && fs.existsSync(oldPath)) {
        try {
          if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
          fs.renameSync(oldPath, newPath);
          r.img = newId + '.jpg';
        } catch {}
      }
    }
    r.id = newId;
  });

  const withImg = recipes.filter((r) => r.img && fs.existsSync(path.join(IMG_DIR, r.img))).length;
  console.log(`Imported ${recipes.length} recipes, ${withImg} with images`);

  // write dishes snapshot
  fs.writeFileSync(path.join(OUT_DIR, 'dishes.json'), JSON.stringify(recipes, null, 2), 'utf8');

  const shared = `// 老刘小炒 · 菜谱来自 HowToCook (Anduin2017/HowToCook, MIT)
// 自动生成，请勿手改；重新导入: node import-howtocook.js
const DISHES = ${JSON.stringify(recipes, null, 2)};

const ORDER_BOARD_ID = '${ORDER_BOARD_ID}';
const ORDER_BOARD_URL = 'https://jsonblob.com/api/jsonBlob/' + ORDER_BOARD_ID;

const IMG_VER = 'htc1';
// 部署后会改成 commit 固定版本；本地与 pages 相对路径优先
const IMG_REF = 'main';
const IMG_HOSTS = [
  'images/',
  'https://cdn.jsdmirror.com/gh/LoopBearConsole/family-menu@' + IMG_REF + '/images/',
  'https://cdn.jsdelivr.net/gh/LoopBearConsole/family-menu@' + IMG_REF + '/images/',
  'https://fastly.jsdelivr.net/gh/LoopBearConsole/family-menu@' + IMG_REF + '/images/',
  'https://loopbearconsole.github.io/family-menu/images/',
  'https://raw.githubusercontent.com/LoopBearConsole/family-menu/' + IMG_REF + '/images/'
];

function findDish(id) { return DISHES.find(d => d.id === id); }

function imgOf(id) {
  const d = findDish(id);
  const file = (d && d.img) ? d.img : (id + '.jpg');
  return IMG_HOSTS[0] + file + '?' + IMG_VER;
}

function onImgError(el, id) {
  const d = findDish(id);
  const file = (d && d.img) ? d.img : (id + '.jpg');
  const step = Number(el.dataset.fb || 0) + 1;
  el.dataset.fb = String(step);
  if (step < IMG_HOSTS.length) {
    el.src = IMG_HOSTS[step] + file + '?' + IMG_VER + '&r=' + step;
    return;
  }
  el.style.display = 'none';
  const wrap = el.parentElement;
  if (wrap && !wrap.querySelector('.img-fallback')) {
    const div = document.createElement('div');
    div.className = 'img-fallback absolute inset-0 flex items-center justify-center text-white/90 font-display text-3xl font-bold';
    div.textContent = (el.alt || (d && d.name) || '菜').slice(0, 1);
    wrap.appendChild(div);
  }
}

function dishSteps(dish) {
  if (!dish) return [];
  if (dish.steps && dish.steps.length) return dish.steps;
  return String(dish.desc || '')
    .split(/[。！？；\\n]/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => /[。！？]$/.test(s) ? s : s + '。');
}

async function fetchOrderBoard() {
  const res = await fetch(ORDER_BOARD_URL, {
    headers: { 'Accept': 'application/json' },
    cache: 'no-store'
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
    updatedAt: new Date().toISOString()
  });
  const res = await fetch(ORDER_BOARD_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
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
  board.orders = (board.orders || []).map(o => o.id === orderId ? Object.assign({}, o, { status: status }) : o);
  await saveOrderBoard(board);
  return board;
}

async function clearDoneKitchenOrders() {
  const board = await fetchOrderBoard();
  board.orders = (board.orders || []).filter(o => o.status !== 'done');
  await saveOrderBoard(board);
  return board;
}
`;

  fs.writeFileSync(path.join(OUT_DIR, 'shared.js'), shared, 'utf8');
  console.log('Wrote shared.js');

  // category summary
  const counts = {};
  for (const r of recipes) counts[r.catLabel] = (counts[r.catLabel] || 0) + 1;
  console.log('By category:', counts);
}

main();
