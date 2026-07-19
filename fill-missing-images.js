/**
 * 为无图菜品从 Openverse 搜索实拍图并写入 images/
 * node fill-missing-images.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = __dirname;
const IMG_DIR = path.join(ROOT, 'images');
const DISHES_PATH = path.join(ROOT, 'dishes.json');
const UA = 'LaoLiuMenuBot/1.0 (home cooking menu; educational use)';

const dishes = JSON.parse(fs.readFileSync(DISHES_PATH, 'utf8'));

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, timeout: 25000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve, reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: { 'User-Agent': UA, Accept: 'image/*,*/*' },
      timeout: 40000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (buf.length < 4000) {
          reject(new Error('too small ' + buf.length));
          return;
        }
        // jpeg/png magic
        const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
        const isPng = buf[0] === 0x89 && buf[1] === 0x50;
        const isWebp = buf.slice(0, 4).toString() === 'RIFF';
        if (!isJpeg && !isPng && !isWebp) {
          reject(new Error('not image'));
          return;
        }
        fs.writeFileSync(dest, buf);
        resolve(buf.length);
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function searchOpenverse(query) {
  const url =
    'https://api.openverse.org/v1/images/?q=' +
    encodeURIComponent(query) +
    '&page_size=8&license=pdm,cc0,by,by-sa,by-nc,by-nd,by-nc-sa,by-nc-nd';
  const data = await fetchJson(url);
  return (data.results || []).filter((r) => r.url && r.url.match(/\.(jpe?g|png|webp)(\?|$)/i) || /staticflickr|upload\.wikimedia|pexels|unsplash/i.test(r.url || ''));
}

function scoreResult(r, name) {
  const t = ((r.title || '') + ' ' + (r.tags || []).map((x) => x.name || x).join(' ')).toLowerCase();
  let s = 0;
  if (/food|dish|cuisine|meal|cook|菜|肉|鱼|汤|饭|面|豆腐|虾|鸡|鸭|牛|猪|soup|rice|tofu|fish|chicken|pork|beef|stir|chinese|sichuan|cantonese/i.test(t)) s += 3;
  if (/logo|person|portrait|building|street|menu board|sign|interior|room/i.test(t)) s -= 4;
  // prefer larger
  if ((r.width || 0) >= 400) s += 1;
  return s;
}

async function findImageForDish(dish) {
  const queries = [
    dish.name + ' 中餐',
    dish.name + ' chinese food',
    dish.name + ' 菜',
    dish.name,
  ];
  // common english hints by keywords in name
  const hints = [];
  if (/豆腐/.test(dish.name)) hints.push(dish.name.replace(/豆腐.*/, 'tofu chinese'));
  if (/鸡/.test(dish.name)) hints.push(dish.name + ' chicken chinese');
  if (/鱼/.test(dish.name)) hints.push(dish.name + ' fish chinese dish');
  if (/虾/.test(dish.name)) hints.push(dish.name + ' shrimp chinese');
  if (/汤/.test(dish.name)) hints.push(dish.name + ' soup chinese');
  if (/面|粉|饭/.test(dish.name)) hints.push(dish.name + ' chinese noodles rice');

  for (const q of [...queries, ...hints]) {
    try {
      const results = await searchOpenverse(q);
      if (!results.length) {
        await sleep(400);
        continue;
      }
      results.sort((a, b) => scoreResult(b, dish.name) - scoreResult(a, dish.name));
      for (const r of results.slice(0, 4)) {
        if (scoreResult(r, dish.name) < 0) continue;
        const dest = path.join(IMG_DIR, dish.id + '.jpg');
        try {
          const len = await downloadFile(r.url, dest);
          return { url: r.url, len, title: r.title };
        } catch (e) {
          // try next
        }
      }
    } catch (e) {
      // next query
    }
    await sleep(500);
  }
  return null;
}

async function main() {
  if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

  const missing = dishes.filter((d) => {
    if (!d.img) return true;
    return !fs.existsSync(path.join(IMG_DIR, d.img));
  });

  console.log('Missing images:', missing.length);
  let ok = 0;
  let fail = 0;

  // resume support: skip if file already exists for id
  for (let i = 0; i < missing.length; i++) {
    const d = missing[i];
    const dest = path.join(IMG_DIR, d.id + '.jpg');
    if (fs.existsSync(dest) && fs.statSync(dest).size > 4000) {
      d.img = d.id + '.jpg';
      ok++;
      console.log(`[${i + 1}/${missing.length}] SKIP exists ${d.name}`);
      continue;
    }

    process.stdout.write(`[${i + 1}/${missing.length}] ${d.name} ... `);
    try {
      const hit = await findImageForDish(d);
      if (hit) {
        d.img = d.id + '.jpg';
        ok++;
        console.log('OK', hit.len, (hit.title || '').slice(0, 40));
      } else {
        fail++;
        console.log('NONE');
      }
    } catch (e) {
      fail++;
      console.log('ERR', e.message);
    }
    await sleep(350);
  }

  fs.writeFileSync(DISHES_PATH, JSON.stringify(dishes, null, 2), 'utf8');

  // patch DISHES in shared.js
  let shared = fs.readFileSync(path.join(ROOT, 'shared.js'), 'utf8');
  if (!/const DISHES = \[/.test(shared)) {
    console.error('shared.js DISHES not found');
    process.exit(1);
  }
  shared = shared.replace(
    /const DISHES = \[[\s\S]*?\];\n/,
    'const DISHES = ' + JSON.stringify(dishes, null, 2) + ';\n\n'
  );
  // bump img ver
  shared = shared.replace(/const IMG_VER = '[^']+'/, "const IMG_VER = 'htc2'");
  fs.writeFileSync(path.join(ROOT, 'shared.js'), shared, 'utf8');

  const withImg = dishes.filter((d) => d.img && fs.existsSync(path.join(IMG_DIR, d.img))).length;
  console.log('Done. ok=', ok, 'fail=', fail, 'withImg=', withImg, '/', dishes.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
