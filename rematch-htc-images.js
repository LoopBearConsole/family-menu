/**
 * 从本地 HowToCook 仓库按菜名重新匹配图片（不依赖外网）
 * node rematch-htc-images.js [HowToCook根目录]
 */
const fs = require('fs');
const path = require('path');

const HTC = path.resolve(process.argv[2] || path.join(__dirname, '..', 'HowToCook'));
const ROOT = __dirname;
const IMG_DIR = path.join(ROOT, 'images');
const dishes = JSON.parse(fs.readFileSync(path.join(ROOT, 'dishes.json'), 'utf8'));

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/的做法/g, '')
    .replace(/[\s_\-·.、，,（）()【】\[\]！!？?：:；;]/g, '')
    .replace(/[的了与和及]/g, '');
}

// Build image index: key -> best image path
const allFiles = walk(path.join(HTC, 'dishes'));
const imageFiles = allFiles.filter((p) => /\.(jpe?g|png|webp)$/i.test(p));
const mdFiles = allFiles.filter((p) => /\.md$/i.test(p) && !/readme/i.test(path.basename(p)));

// map normalized dish folder/md stem -> images in that folder
const folderImages = new Map(); // normName -> [imgPaths]
for (const img of imageFiles) {
  const dir = path.dirname(img);
  const folderName = path.basename(dir);
  const keys = new Set([normalize(folderName)]);
  // also index by nearby md titles
  try {
    for (const f of fs.readdirSync(dir)) {
      if (/\.md$/i.test(f)) keys.add(normalize(f.replace(/\.md$/i, '')));
    }
  } catch {}
  for (const k of keys) {
    if (!k) continue;
    if (!folderImages.has(k)) folderImages.set(k, []);
    folderImages.get(k).push(img);
  }
}

// md path index: norm title -> dir
const mdIndex = new Map();
for (const md of mdFiles) {
  const base = path.basename(md, path.extname(md));
  mdIndex.set(normalize(base), path.dirname(md));
  try {
    const head = fs.readFileSync(md, 'utf8').slice(0, 200);
    const m = head.match(/^#\s+(.+?)的做法/m) || head.match(/^#\s+(.+)$/m);
    if (m) mdIndex.set(normalize(m[1]), path.dirname(md));
  } catch {}
}

function pickBestImage(paths) {
  if (!paths || !paths.length) return null;
  const scored = paths.map((p) => {
    const b = path.basename(p).toLowerCase();
    let s = 0;
    if (/^1\./.test(b)) s += 10;
    if (/成品|摆盘|预览|cover|完成/.test(b)) s += 8;
    if (/步骤|改刀|材料|原料/.test(b)) s -= 5;
    try { s += Math.min(fs.statSync(p).size / 50000, 5); } catch {}
    return { p, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored[0].p;
}

function findImageForName(name) {
  const n = normalize(name);
  // exact folder
  if (folderImages.has(n)) return pickBestImage(folderImages.get(n));
  // md dir
  if (mdIndex.has(n)) {
    const dir = mdIndex.get(n);
    const imgs = fs.readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .map((f) => path.join(dir, f));
    if (imgs.length) return pickBestImage(imgs);
  }
  // fuzzy contains
  let best = null;
  let bestScore = 0;
  for (const [k, imgs] of folderImages.entries()) {
    if (!k || k.length < 2) continue;
    if (k.includes(n) || n.includes(k)) {
      const score = Math.min(k.length, n.length);
      if (score > bestScore) {
        bestScore = score;
        best = pickBestImage(imgs);
      }
    }
  }
  return best;
}

function copyAsJpeg(src, dest) {
  fs.copyFileSync(src, dest);
}

if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

let filled = 0;
let already = 0;
let still = 0;

for (const d of dishes) {
  const dest = path.join(IMG_DIR, d.id + '.jpg');
  if (d.img && fs.existsSync(path.join(IMG_DIR, d.img)) && fs.statSync(path.join(IMG_DIR, d.img)).size > 3000) {
    already++;
    continue;
  }
  if (fs.existsSync(dest) && fs.statSync(dest).size > 3000) {
    d.img = d.id + '.jpg';
    already++;
    continue;
  }
  const src = findImageForName(d.name);
  if (src) {
    try {
      copyAsJpeg(src, dest);
      d.img = d.id + '.jpg';
      filled++;
      console.log('FILL', d.name, '<-', path.relative(HTC, src));
    } catch (e) {
      still++;
      console.log('COPYFAIL', d.name, e.message);
    }
  } else {
    still++;
  }
}

fs.writeFileSync(path.join(ROOT, 'dishes.json'), JSON.stringify(dishes, null, 2));
// patch shared.js DISHES
let shared = fs.readFileSync(path.join(ROOT, 'shared.js'), 'utf8');
shared = shared.replace(
  /const DISHES = \[[\s\S]*?\];\n/,
  'const DISHES = ' + JSON.stringify(dishes, null, 2) + ';\n\n'
);
shared = shared.replace(/const IMG_VER = '[^']+'/, "const IMG_VER = 'htc2'");
fs.writeFileSync(path.join(ROOT, 'shared.js'), shared);

const withImg = dishes.filter((d) => d.img && fs.existsSync(path.join(IMG_DIR, d.img))).length;
console.log({ filled, already, stillMissing: still, withImg, total: dishes.length });
