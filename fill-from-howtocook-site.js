/**
 * 用 howtocook.aiursoft.com 的菜图（按中文菜名搜索）补全无图菜品
 * node fill-from-howtocook-site.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = __dirname;
const IMG_DIR = path.join(ROOT, 'images');
const dishes = JSON.parse(fs.readFileSync(path.join(ROOT, 'dishes.json'), 'utf8'));
const BASE = 'https://howtocook.aiursoft.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { 'User-Agent': UA, Accept: 'text/html,application/json,*/*' }, timeout: 30000 },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : BASE + res.headers.location;
          return get(next).then(resolve, reject);
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

function download(url, dest) {
  return get(url).then((r) => {
    if (r.status !== 200) throw new Error('HTTP ' + r.status);
    if (r.body.length < 3000) throw new Error('small ' + r.body.length);
    const b = r.body;
    const ok =
      (b[0] === 0xff && b[1] === 0xd8) ||
      (b[0] === 0x89 && b[1] === 0x50) ||
      b.slice(0, 4).toString() === 'RIFF';
    if (!ok) throw new Error('not image');
    fs.writeFileSync(dest, b);
    return b.length;
  });
}

function parseSearchResults(html) {
  const results = [];
  // card blocks with image + title
  const re =
    /recipe-images\/([a-f0-9]+\.(?:jpg|jpeg|png|webp))[^"]*"[^>]*alt="([^"]*)"[\s\S]{0,400}?<span class="fs-5 fw-semibold">([^<]+)<\/span>/gi;
  let m;
  while ((m = re.exec(html))) {
    results.push({
      file: m[1],
      alt: m[2].trim(),
      title: m[3].trim(),
      url: BASE + '/download/recipe-images/' + m[1] + '?w=800',
    });
  }
  // fallback simpler
  if (!results.length) {
    const re2 = /recipe-images\/([a-f0-9]+\.(?:jpg|jpeg|png|webp))/gi;
    const files = new Set();
    while ((m = re2.exec(html))) files.add(m[1]);
    for (const f of files) {
      results.push({
        file: f,
        alt: '',
        title: '',
        url: BASE + '/download/recipe-images/' + f + '?w=800',
      });
    }
  }
  return results;
}

function score(result, chineseName) {
  // prefer results that aren't completely random - first result from Chinese search is usually best
  return 1;
}

async function main() {
  if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });

  const missing = dishes.filter((d) => {
    if (!d.img) return true;
    const p = path.join(IMG_DIR, d.img);
    return !fs.existsSync(p) || fs.statSync(p).size < 3000;
  });

  console.log('Missing:', missing.length);
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < missing.length; i++) {
    const d = missing[i];
    const dest = path.join(IMG_DIR, d.id + '.jpg');
    if (fs.existsSync(dest) && fs.statSync(dest).size > 3000) {
      d.img = d.id + '.jpg';
      ok++;
      console.log(`[${i + 1}/${missing.length}] SKIP ${d.name}`);
      continue;
    }

    process.stdout.write(`[${i + 1}/${missing.length}] ${d.name} ... `);
    try {
      const searchUrl =
        BASE + '/Dashboard?q=' + encodeURIComponent(d.name);
      const page = await get(searchUrl);
      if (page.status !== 200) throw new Error('search ' + page.status);
      const html = page.body.toString('utf8');
      const results = parseSearchResults(html);
      if (!results.length) {
        fail++;
        console.log('NONE');
        await sleep(200);
        continue;
      }
      let got = false;
      for (const r of results.slice(0, 5)) {
        try {
          const len = await download(r.url, dest);
          d.img = d.id + '.jpg';
          ok++;
          console.log('OK', len, (r.title || r.file).slice(0, 40));
          got = true;
          break;
        } catch (e) {
          // try next
        }
      }
      if (!got) {
        fail++;
        console.log('DLFAIL');
      }
    } catch (e) {
      fail++;
      console.log('ERR', e.message);
    }
    await sleep(250);
  }

  fs.writeFileSync(path.join(ROOT, 'dishes.json'), JSON.stringify(dishes, null, 2));
  let shared = fs.readFileSync(path.join(ROOT, 'shared.js'), 'utf8');
  shared = shared.replace(
    /const DISHES = \[[\s\S]*?\];\n/,
    'const DISHES = ' + JSON.stringify(dishes, null, 2) + ';\n\n'
  );
  shared = shared.replace(/const IMG_VER = '[^']+'/, "const IMG_VER = 'htc3'");
  fs.writeFileSync(path.join(ROOT, 'shared.js'), shared);

  const withImg = dishes.filter(
    (d) => d.img && fs.existsSync(path.join(IMG_DIR, d.img)) && fs.statSync(path.join(IMG_DIR, d.img)).size > 3000
  ).length;
  console.log({ ok, fail, withImg, total: dishes.length });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
