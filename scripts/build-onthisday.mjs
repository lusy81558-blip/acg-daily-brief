// 历史上的今天（ACG 限定）：抓取「游戏发售 / 动画开播 / 剧场版上映 / 漫画连载开始」，
// 按人气（维基各语言版本数）排序后缓存到 data/onthisday.json
//
// 用法：
//   node scripts/build-onthisday.mjs                # 补齐未来 60 天缺的日子
//   node scripts/build-onthisday.mjs --all          # 补齐全年（首次建库用）
//   node scripts/build-onthisday.mjs --months=10    # 强制重抓 10 月
//   node scripts/build-onthisday.mjs --probe        # 只打印，不写文件
//   node scripts/build-onthisday.mjs --show=10-06   # 打印某天的排序明细
//
// 数据源：Wikidata（CC0）的 SPARQL 端点。只取"日"精确到天的条目，
// 用 sitelinks（条目被多少个语言版本收录）当作"作品够不够大"的尺子 ——
// 这正是页面上"只放最大的几件事"的依据。
//
// 缓存会被仓库提交：即使某次抓取失败（断网 / 被墙），
// 页面仍然沿用上一次缓存，不会开天窗。

import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const CACHE_FILE = path.join(DATA_DIR, 'onthisday.json');
const ENDPOINT = 'https://query.wikidata.org/sparql';
const KEEP_PER_DAY = 6;      // 缓存里每天保留几条（页面展示前 4 条）
const MAX_PER_KIND = 2;      // 每天每个类别最多占几条，保证不全是游戏
const MIN_SITELINKS = 12;    // 低于这个"人气"的作品不算大事
const MIN_YEAR = 1950;       // ACG 产业之前的不收
const TIMEOUT_MS = 90000;
const UA = 'ACG-Brief/1.0 (personal daily brief)';

// 标题语言优先级：尽量用中文，其次日文原名，最后英文
const LANG_ORDER = ['zh-hans', 'zh-cn', 'zh', 'zh-hant', 'ja', 'en'];

// 四类 ACG 大事：游戏发售、动画开播、剧场版上映、漫画连载开始
const KINDS = [
  { key: 'game',  action: '发售',     qid: 'Q7889',     prop: 'P577' }, // 电子游戏 · 出版日期
  { key: 'anime', action: '开播',     qid: 'Q63952888', prop: 'P580' }, // 动画电视连续剧 · 开始时间
  { key: 'movie', action: '上映',     qid: 'Q20650540', prop: 'P577' }, // 动画电影 · 出版日期
  { key: 'manga', action: '开始连载', qid: 'Q21198342', prop: 'P580' }, // 漫画系列 · 开始时间
];

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback = '') => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const PROBE = flag('probe');
const SHOW = value('show');
const FORCE_MONTHS = value('months')
  ? value('months')
      .split(',')
      .map((m) => Number(m.trim()))
      .filter((m) => m >= 1 && m <= 12)
  : [];
const ALL = flag('all') || FORCE_MONTHS.length > 0;
const DAYS_AHEAD = Number(value('days', '60')) || 60;

const log = (...a) => console.log(...a);
const pad2 = (n) => String(n).padStart(2, '0');

/** 今天（北京时间）往后第 n 天的 MM-DD */
function mmdd(offsetDays) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' });
  const [y, m, d] = fmt.format(new Date()).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + offsetDays));
  return `${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

function sparql(query) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'user-agent': UA,
      accept: 'application/sparql-results+json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ query }).toString(),
    signal: ctrl.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .finally(() => clearTimeout(timer));
}

async function fetchKind(month, kind) {
  const query = `
SELECT ?item ?date ?sitelinks ?label ?lang WHERE {
  {
    # 一个作品可能有多条发售日（移植 / 各区发售），只认最早的那条
    SELECT ?item (MIN(?d) AS ?date) ?sitelinks WHERE {
      ?item wdt:P31/wdt:P279* wd:${kind.qid} .
      ?item wdt:${kind.prop} ?d .
      ?item wikibase:sitelinks ?sitelinks .
      FILTER(?sitelinks >= ${MIN_SITELINKS})
      FILTER(YEAR(?d) >= ${MIN_YEAR})
    }
    GROUP BY ?item ?sitelinks
  }
  FILTER(MONTH(?date) = ${month})
  OPTIONAL {
    ?item rdfs:label ?label .
    FILTER(LANG(?label) IN ("zh-hans", "zh-cn", "ja", "zh", "zh-hant", "en"))
    BIND(LANG(?label) AS ?lang)
  }
}
LIMIT 6000`;
  const json = await sparql(query);
  const rows = (json.results && json.results.bindings) || [];

  // 同一个条目会按语言返回多行，挑优先级最高的那个标题
  const byItem = new Map();
  for (const r of rows) {
    const iso = r.date && r.date.value;             // 1996-02-27T00:00:00Z
    const item = (r.item && r.item.value) || '';
    if (!iso || !item) continue;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) continue;

    const label = ((r.label && r.label.value) || '').trim();
    const lang = (r.lang && r.lang.value) || '';
    const rank = LANG_ORDER.indexOf(lang);
    const prev = byItem.get(item);
    if (prev && (rank < 0 || rank >= prev.rank) && prev.title) continue;
    if (!prev) {
      byItem.set(item, {
        day: `${m[2]}-${m[3]}`,
        year: Number(m[1]),
        title: rank < 0 ? '' : label,
        rank: rank < 0 ? 99 : rank,
        kind: kind.key,
        sitelinks: Number(r.sitelinks && r.sitelinks.value) || 0,
        qid: item.split('/').pop() || '',
      });
    } else if (rank >= 0) {
      prev.title = label;
      prev.rank = rank;
    }
  }
  return [...byItem.values()].filter((r) => r.title && !/^Q\d+$/.test(r.title));
}

/** 把一批条目按天分组：去重 → 按人气排序 → 每天留前几条（每类最多两条） */
function groupByDay(rows) {
  const byDay = new Map();
  const seen = new Set();
  for (const row of rows) {
    const uniq = `${row.kind}:${row.qid}`;
    if (seen.has(uniq)) continue;
    seen.add(uniq);
    if (!byDay.has(row.day)) byDay.set(row.day, []);
    byDay.get(row.day).push(row);
  }
  const out = {};
  for (const [day, list] of byDay) {
    list.sort((a, b) => b.sitelinks - a.sitelinks || a.year - b.year);
    const used = {};
    const picked = [];
    for (const r of list) {
      const n = used[r.kind] || 0;
      if (n >= MAX_PER_KIND) continue;
      used[r.kind] = n + 1;
      picked.push(r);
      if (picked.length >= KEEP_PER_DAY) break;
    }
    out[day] = picked.map((r) => ({
      year: r.year,
      title: r.title,
      kind: r.kind,
      sitelinks: r.sitelinks,
      qid: r.qid,
    }));
  }
  return out;
}

async function loadCache() {
  try {
    const raw = JSON.parse(await readFile(CACHE_FILE, 'utf8'));
    return raw && raw.days && typeof raw.days === 'object' ? raw.days : {};
  } catch {
    return {};
  }
}

async function fetchMonth(month) {
  const rows = [];
  for (const kind of KINDS) rows.push(...(await fetchKind(month, kind)));
  return groupByDay(rows);
}

/** 需要补的日子 → 需要抓的月份 */
function monthsToFetch(cache) {
  if (ALL) {
    return FORCE_MONTHS.length ? FORCE_MONTHS : Array.from({ length: 12 }, (_, i) => i + 1);
  }
  const wanted = new Set();
  for (let i = 0; i < DAYS_AHEAD; i++) wanted.add(mmdd(i));
  const months = new Set();
  for (const day of wanted) {
    if (!cache[day] || !cache[day].length) months.add(Number(day.slice(0, 2)));
  }
  return [...months].sort((a, b) => a - b);
}

async function main() {
  const cache = await loadCache();
  const merged = { ...cache };

  if (SHOW) {
    const list = merged[SHOW] || [];
    log(`===== ${SHOW}（缓存 ${list.length} 条）=====`);
    for (const it of list) log(`  ${it.year}  [${it.kind}] ${it.title}  (sitelinks ${it.sitelinks})`);
    if (!list.length) log('  （没有数据，先跑一次抓取）');
    return;
  }

  const months = monthsToFetch(cache);
  if (!months.length) {
    log(`[历史上的今天] 未来 ${DAYS_AHEAD} 天都有缓存，无需抓取。`);
  } else {
    log(`[历史上的今天] 需要抓取 ${months.map(pad2).join(', ')} 月 ...`);
  }

  let ok = 0;
  let fail = 0;
  for (const month of months) {
    try {
      const days = await fetchMonth(month);
      Object.assign(merged, days);
      ok++;
      log(`  ${pad2(month)} 月  ✓ ${Object.keys(days).length} 天`);
    } catch (err) {
      fail++;
      log(`  ${pad2(month)} 月  ✗ ${String(err.message || err).slice(0, 70)}（沿用缓存）`);
    }
  }

  const days = Object.keys(merged).sort();
  const total = days.reduce((n, d) => n + merged[d].length, 0);

  if (PROBE) {
    for (const d of days) {
      log(`\n----- ${d} -----`);
      for (const it of merged[d].slice(0, 4)) {
        log(`  ${String(it.year).padStart(4, ' ')}  [${it.kind}] ${it.title}`);
      }
    }
    log(`\n[probe] 覆盖 ${days.length} 天 / ${total} 条（未写入文件）`);
    return;
  }

  const payload = {
    _note:
      'ACG 历史上的今天缓存（来源：Wikidata，CC0）。由 scripts/build-onthisday.mjs 生成；' +
      '每天收录「游戏发售 / 动画开播 / 剧场版上映 / 漫画连载开始」中人气最高的几条。',
    source: 'https://www.wikidata.org/',
    updatedAt: new Date().toISOString(),
    days: merged,
  };
  await writeFile(CACHE_FILE, JSON.stringify(payload), 'utf8');
  log(
    `\n[历史上的今天] 成功 ${ok} 月，失败 ${fail} 月；` +
      `缓存覆盖 ${days.length} 天 / ${total} 条 → data/onthisday.json`
  );
}

main().catch((err) => {
  console.error('[失败] 历史上的今天生成出错：');
  console.error(err);
  process.exit(1);
});
