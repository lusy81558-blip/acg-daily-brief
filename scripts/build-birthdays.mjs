// 生成 data/birthdays.json：从 AniList 拉取高人气角色的生日，按 MM-DD 归档
//
// 用法：
//   node scripts/build-birthdays.mjs --probe        只探一页，看数据结构
//   node scripts/build-birthdays.mjs --pages=100    拉 100 页（每页 50 个角色）
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENDPOINT = 'https://graphql.anilist.co';
const MIN_FAVOURITES = 40; // 太冷门的角色不收录，避免"今天是某某某生日"没人认识

const QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { hasNextPage total }
    characters(sort: FAVOURITES_DESC) {
      id
      name { native full }
      favourites
      dateOfBirth { month day }
      media(perPage: 1, sort: POPULARITY_DESC) {
        nodes { title { native romaji } type format }
      }
    }
  }
}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(page, perPage = 50, attempt = 0) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { page, perPage } }),
  });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= 4) throw new Error(`HTTP ${res.status} on page ${page}`);
    await sleep(5000 * (attempt + 1));
    return fetchPage(page, perPage, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} on page ${page}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors).slice(0, 200)}`);
  return json.data.Page;
}

async function probe() {
  const page = await fetchPage(1, 8);
  console.log(`total characters (by favourites order): ${page.pageInfo.total}`);
  for (const c of page.characters) {
    const dob = c.dateOfBirth?.month ? `${c.dateOfBirth.month}-${c.dateOfBirth.day}` : '(no birthday)';
    const work = c.media?.nodes?.[0]?.title?.native || c.media?.nodes?.[0]?.title?.romaji || '';
    console.log(`  ${String(c.favourites).padStart(7)}  ${dob.padEnd(7)}  ${c.name.native || c.name.full}  / ${work}`);
  }
}

async function build(pages) {
  const byDate = new Map();
  let scanned = 0;
  let kept = 0;
  let lastPage = 0;

  for (let p = 1; p <= pages; p++) {
    const page = await fetchPage(p);
    lastPage = p;
    for (const c of page.characters) {
      scanned++;
      const dob = c.dateOfBirth;
      if (!dob?.month || !dob?.day) continue;
      if ((c.favourites ?? 0) < MIN_FAVOURITES) continue;
      const name = c.name.native || c.name.full;
      if (!name) continue;
      const work = c.media?.nodes?.[0]?.title?.native || c.media?.nodes?.[0]?.title?.romaji || '';
      const key = `${String(dob.month).padStart(2, '0')}-${String(dob.day).padStart(2, '0')}`;
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key).push([name, work, c.favourites ?? 0]);
      kept++;
    }
    if (!page.pageInfo.hasNextPage) break;
    process.stderr.write(`page ${p} ... `);
    await sleep(1200);
  }
  process.stderr.write('\n');

  // 每天按人气排序，只留前 30 个
  const out = {};
  for (const [key, list] of [...byDate.entries()].sort()) {
    out[key] = list.sort((a, b) => b[2] - a[2]).slice(0, 30);
  }

  await mkdir(path.join(ROOT, 'data'), { recursive: true });
  const file = path.join(ROOT, 'data', 'birthdays.json');
  await writeFile(
    file,
    JSON.stringify(
      {
        _note: '角色生日表，来源 AniList（按收藏数排序的高人气角色）。格式：MM-DD -> [[角色名, 作品名, 人气值], ...]',
        _generatedAt: new Date().toISOString(),
        _source: 'https://anilist.co',
        birthdays: out,
      },
      null,
      0
    ),
    'utf8'
  );

  const days = Object.keys(out).length;
  console.log(`扫描 ${scanned} 个角色（${lastPage} 页），收录 ${kept} 个，覆盖 ${days} 天`);
  console.log(`输出: data/birthdays.json`);
}

const arg = process.argv[2] || '';
if (arg === '--probe') {
  await probe();
} else {
  const m = /--pages=(\d+)/.exec(arg);
  await build(m ? Number(m[1]) : 100);
}
