/**
 * 强制用本地 HowToCook 成品图 + 精选美食图库 URL 修正错误菜图
 * （不再用模糊搜索，避免串图）
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT = __dirname;
const HTC = path.join(ROOT, '..', 'HowToCook');
const IMG_DIR = path.join(ROOT, 'images');
const dishes = JSON.parse(fs.readFileSync(path.join(ROOT, 'dishes.json'), 'utf8'));
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// 每道菜：先 local，再 urls（只下美食类实拍/成品图）
const FIXES = {
  清蒸鲈鱼: {
    local: ['dishes/aquatic/清蒸鲈鱼/清蒸鲈鱼.jpg', 'dishes/aquatic/清蒸鲈鱼/摆盘.jpg'],
  },
  香煎翘嘴鱼: {
    local: ['dishes/aquatic/香煎翘嘴鱼/香煎翘嘴鱼.jpeg'],
  },
  阳朔啤酒鱼: {
    local: [
      'dishes/aquatic/阳朔啤酒鱼/阳朔啤酒鱼参考.jpg',
      'dishes/aquatic/阳朔啤酒鱼/阳朔啤酒鱼.png',
    ],
  },
  小龙虾: {
    local: ['dishes/aquatic/小龙虾/成品.jpg'],
  },
  // 以下无本地成品：美食图库（蟹/鱼/蛋/早餐类）
  酱炖蟹: {
    urls: [
      'https://images.pexels.com/photos/566345/pexels-photo-566345.jpeg?auto=compress&cs=tinysrgb&w=900', // crab
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&h=600&fit=crop&q=80',
      'https://images.pexels.com/photos/725992/pexels-photo-725992.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=900&h=600&fit=crop&q=80',
    ],
  },
  咖喱炒蟹: {
    urls: [
      'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=900', // curry
      'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=900&h=600&fit=crop&q=80',
      'https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=900&h=600&fit=crop&q=80',
    ],
  },
  肉蟹煲: {
    urls: [
      'https://images.pexels.com/photos/566345/pexels-photo-566345.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1559847844-5315695dadae?w=900&h=600&fit=crop&q=80',
      'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&h=600&fit=crop&q=80',
    ],
  },
  微波葱姜黑鳕鱼: {
    urls: [
      'https://images.pexels.com/photos/3296273/pexels-photo-3296273.jpeg?auto=compress&cs=tinysrgb&w=900', // fish plate
      'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=900&h=600&fit=crop&q=80',
      'https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=900&h=600&fit=crop&q=80',
    ],
  },
  茶叶蛋: {
    urls: [
      // brown marinated eggs / soy eggs look
      'https://images.pexels.com/photos/4110008/pexels-photo-4110008.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1608039829574-efc6e2e0b0b0?w=900&h=600&fit=crop&q=80',
      'https://images.pexels.com/photos/824635/pexels-photo-824635.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=900&h=600&fit=crop&q=80',
      'https://images.pexels.com/photos/793765/pexels-photo-793765.jpeg?auto=compress&cs=tinysrgb&w=900',
    ],
  },
  蛋煎糍粑: {
    urls: [
      'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=900&h=600&fit=crop&q=80',
      'https://images.pexels.com/photos/4198024/pexels-photo-4198024.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=900&h=600&fit=crop&q=80',
    ],
  },
  鸡蛋三明治: {
    urls: [
      'https://images.pexels.com/photos/1600711/pexels-photo-1600711.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&h=600&fit=crop&q=80',
      'https://images.pexels.com/photos/139746/pexels-photo-139746.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=900&h=600&fit=crop&q=80',
    ],
  },
  煎饺: {
    urls: [
      'https://images.pexels.com/photos/5409010/pexels-photo-5409010.jpeg?auto=compress&cs=tinysrgb&w=900', // dumplings
      'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=900&h=600&fit=crop&q=80',
      'https://images.pexels.com/photos/955137/pexels-photo-955137.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=900&h=600&fit=crop&q=80',
    ],
  },
  手抓饼: {
    urls: [
      'https://images.pexels.com/photos/2233729/pexels-photo-2233729.jpeg?auto=compress&cs=tinysrgb&w=900', // flatbread
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&h=600&fit=crop&q=80',
      'https://images.pexels.com/photos/4198024/pexels-photo-4198024.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=900&h=600&fit=crop&q=80',
    ],
  },
  太阳蛋: {
    urls: [
      'https://images.pexels.com/photos/824635/pexels-photo-824635.jpeg?auto=compress&cs=tinysrgb&w=900', // fried egg
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=900&h=600&fit=crop&q=80',
      'https://images.pexels.com/photos/4110008/pexels-photo-4110008.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=900&h=600&fit=crop&q=80',
    ],
  },
  微波炉蒸蛋: {
    urls: [
      'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=900', // egg bowl
      'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=900&h=600&fit=crop&q=80',
      'https://images.pexels.com/photos/793765/pexels-photo-793765.jpeg?auto=compress&cs=tinysrgb&w=900',
    ],
  },
  微波炉荷包蛋: {
    urls: [
      'https://images.pexels.com/photos/824635/pexels-photo-824635.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=900&h=600&fit=crop&q=80',
      'https://images.pexels.com/photos/4110008/pexels-photo-4110008.jpeg?auto=compress&cs=tinysrgb&w=900',
    ],
  },
  微波炉蛋糕: {
    urls: [
      'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=900', // cake
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=900&h=600&fit=crop&q=80',
      'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=900',
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=900&h=600&fit=crop&q=80',
    ],
  },
};

function get(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(
      url,
      { headers: { 'User-Agent': UA, Accept: 'image/*,*/*' }, timeout: 40000 },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, url).href;
          return get(next).then(resolve, reject);
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () =>
          resolve({ status: res.statusCode, body: Buffer.concat(chunks) })
        );
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

function isImage(buf) {
  if (!buf || buf.length < 2500) return false;
  return (
    (buf[0] === 0xff && buf[1] === 0xd8) ||
    (buf[0] === 0x89 && buf[1] === 0x50) ||
    buf.slice(0, 4).toString() === 'RIFF'
  );
}

async function download(url, dest) {
  const r = await get(url);
  if (r.status !== 200 || !isImage(r.body)) throw new Error('bad ' + r.status);
  fs.writeFileSync(dest, r.body);
  return r.body.length;
}

async function main() {
  for (const [name, conf] of Object.entries(FIXES)) {
    const dish = dishes.find((d) => d.name === name);
    if (!dish) {
      console.log('SKIP not found', name);
      continue;
    }
    const dest = path.join(IMG_DIR, dish.id + '.jpg');
    let done = false;

    for (const rel of conf.local || []) {
      const p = path.join(HTC, rel);
      if (fs.existsSync(p) && fs.statSync(p).size > 3000) {
        fs.copyFileSync(p, dest);
        dish.img = dish.id + '.jpg';
        console.log('OK local', name, rel, fs.statSync(dest).size);
        done = true;
        break;
      }
    }
    if (done) continue;

    for (const url of conf.urls || []) {
      try {
        const len = await download(url, dest);
        dish.img = dish.id + '.jpg';
        console.log('OK stock', name, len);
        done = true;
        break;
      } catch (e) {
        console.log('  try fail', name, e.message);
      }
    }
    if (!done) console.log('FAIL', name);
  }

  fs.writeFileSync(path.join(ROOT, 'dishes.json'), JSON.stringify(dishes, null, 2));
  let shared = fs.readFileSync(path.join(ROOT, 'shared.js'), 'utf8');
  shared = shared.replace(
    /const DISHES = \[[\s\S]*?\];\n/,
    'const DISHES = ' + JSON.stringify(dishes, null, 2) + ';\n\n'
  );
  shared = shared.replace(/const IMG_VER = '[^']+'/, "const IMG_VER = 'fix17b'");
  fs.writeFileSync(path.join(ROOT, 'shared.js'), shared);
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
