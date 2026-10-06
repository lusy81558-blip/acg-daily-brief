// 早报生成主脚本
// 用法： node scripts/build.mjs
import { writeFile, mkdir, readFile, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SOURCES, SECTIONS } from './sources.mjs';
import { fetchFeed, fetchArticleImage } from './lib/feed.mjs';
import { isMobileGacha, routeSection, scoreItem, dedupe } from './lib/classify.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const PER_SECTION = 5;        // 每板块展示条数
const MAX_AGE_HOURS = 48;     // 只收最近 48 小时的内容
const HISTORY_DAYS = 30;      // 前端可回看的天数
const MIN_SCORE = 9;          // 新闻类条目的最低分，低于此分视为噪音
const CONCURRENCY = 6;

const TZ = 'Asia/Shanghai';
const now = new Date();
const today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now); // YYYY-MM-DD

const log = (...a) => console.log(...a);

function hashInt(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

async function loadQuotes() {
  return JSON.parse(await readFile(path.join(DATA_DIR, 'quotes.json'), 'utf8'));
}

async function collect() {
  const bucket = new Map(); // section -> items
  const report = [];
  let cursor = 0;

  async function worker() {
    while (cursor < SOURCES.length) {
      const src = SOURCES[cursor++];
      const started = Date.now();
      try {
        const raw = await fetchFeed(src.url, { timeout: src.timeout ?? 25000, retries: 1 });
        let accepted = 0;
        let dropped = 0;

        for (const item of raw) {
          try {
            if (item.title.length < 6) { dropped++; continue; }
            const dateObj = item.date && !Number.isNaN(item.date.getTime()) ? item.date : now;
            const ageH = (now - dateObj) / 36e5;
            if (ageH > MAX_AGE_HOURS || ageH < -12) { dropped++; continue; }
            if (isMobileGacha(item.title)) { dropped++; continue; }

            const section = routeSection(item.title, src.section);
            if (!section) { dropped++; continue; }

            let title = item.title.replace(/\s+/g, ' ').trim();
            if (src.stripSourceSuffix) title = title.replace(/\s+[-–—]\s+[^-–—]{2,24}$/, '').trim();

            const entry = {
              title,
              link: item.link,
              date: dateObj.toISOString(),
              section,
              sourceId: src.id,
              source: src.name,
              lang: src.lang,
              kind: src.kind ?? 'news',
              sourceWeight: src.weight,
              image: item.image || '',
            };
            entry.score = scoreItem(entry);

            if (!bucket.has(section)) bucket.set(section, []);
            bucket.get(section).push(entry);
            accepted++;
          } catch (itemErr) {
            dropped++;
          }
        }
        report.push({ id: src.id, name: src.name, section: src.section, ok: true, total: raw.length, accepted, dropped, ms: Date.now() - started });
      } catch (err) {
        report.push({ id: src.id, name: src.name, section: src.section, ok: false, total: 0, accepted: 0, dropped: 0, ms: Date.now() - started, err: String(err.message).slice(0, 60) });
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { bucket, report };
}

function buildSections(bucket, quotes) {
  const out = [];
  // 先全局去重：同一条新闻被多个源报道时只保留分数最高的一条，避免跨板块重复
  const unique = dedupe([...bucket.values()].flat(), 0.5);
  const bySection = new Map();
  for (const it of unique) {
    if (!bySection.has(it.section)) bySection.set(it.section, []);
    bySection.get(it.section).push(it);
  }

  for (const sec of SECTIONS) {
    const all = bySection.get(sec.key) ?? [];
    const news = all.filter((i) => i.kind === 'news' && i.score >= MIN_SCORE).sort((a, b) => b.score - a.score);
    const releases = all.filter((i) => i.kind === 'release').sort((a, b) => b.score - a.score);

    const picked = news.slice(0, PER_SECTION);
    for (const r of releases) {
      if (picked.length >= PER_SECTION) break;
      picked.push(r);
    }

    const entry = {
      key: sec.key,
      label: sec.label,
      en: sec.en,
      items: picked.map((i) => ({
        title: i.title,
        link: i.link,
        source: i.source,
        sourceId: i.sourceId,
        lang: i.lang,
        kind: i.kind,
        date: i.date,
        image: i.image || '',
      })),
    };

    if (picked.length === 0) {
      const pool = quotes[sec.key] ?? [];
      if (pool.length) entry.quote = pool[hashInt(today + sec.key) % pool.length];
      entry.empty = true;
    }
    out.push(entry);
  }
  return out;
}

/** 每板块头条如果没有配图，就去文章页抓 og:image */
async function hydrateHeroImages(sections) {
  const jobs = [];
  for (const sec of sections) {
    const candidates = sec.items.filter((i) => i.kind === 'news' && !i.image).slice(0, 2);
    if (!candidates.length) continue;
    jobs.push(
      (async () => {
        for (const item of candidates) {
          const img = await fetchArticleImage(item.link);
          if (img) {
            item.image = img;
            return;
          }
        }
      })()
    );
  }
  if (jobs.length) await Promise.all(jobs);
  return sections.filter((s) => s.items.some((i) => i.image)).length;
}

async function loadHistory() {
  const files = (await readdir(DATA_DIR)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
  const keep = files.slice(-HISTORY_DAYS);
  const drop = files.slice(0, -HISTORY_DAYS);
  for (const f of drop) await unlink(path.join(DATA_DIR, f));

  const days = {};
  for (const f of keep) {
    const raw = JSON.parse(await readFile(path.join(DATA_DIR, f), 'utf8'));
    days[raw.date] = raw;
  }
  return { days, dates: keep.map((f) => f.replace('.json', '')) };
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  const quotes = await loadQuotes();

  log('==========================================');
  log('   一觉起来发生了啥？ - 早报更新');
  log('==========================================\n');

  log(`[1/4] 抓取 ${SOURCES.length} 个源 ...`);
  const { bucket, report } = await collect();

  const okCount = report.filter((r) => r.ok).length;
  log(`      成功 ${okCount}/${report.length}`);
  for (const r of report.filter((r) => !r.ok)) log(`      ! ${r.id} 失败: ${r.err}`);

  log('[2/4] 分流、过滤、排序 ...');
  const sections = buildSections(bucket, quotes);

  log('[3/4] 抓取头条配图 ...');
  const heroImages = await hydrateHeroImages(sections);
  for (const s of sections) s.image = (s.items.find((i) => i.image) || {}).image || '';
  log(`      拿到配图 ${heroImages}/${sections.length} 个板块`);

  const brief = {
    date: today,
    generatedAt: new Date().toISOString(),
    timezone: TZ,
    sections,
    stats: {
      sources: SOURCES.length,
      sourcesOk: okCount,
      fetched: report.reduce((n, r) => n + r.total, 0),
      accepted: report.reduce((n, r) => n + r.accepted, 0),
      filtered: report.reduce((n, r) => n + r.dropped, 0),
      heroImages,
    },
  };

  await writeFile(path.join(DATA_DIR, `${today}.json`), JSON.stringify(brief, null, 2), 'utf8');

  log('[4/4] 生成前端数据 ...');
  const { days, dates } = await loadHistory();
  days[today] = brief;
  const allDates = [...new Set([...dates, today])].sort().slice(-HISTORY_DAYS);
  const payload = { generatedAt: new Date().toISOString(), today, dates: allDates, days };
  await writeFile(path.join(DATA_DIR, 'brief.js'), `window.BRIEF_DATA = ${JSON.stringify(payload)};\n`, 'utf8');
  await writeFile(path.join(DATA_DIR, 'index.json'), JSON.stringify({ today, dates: allDates }, null, 2), 'utf8');

  log('[OK] 完成');
  for (const s of sections) {
    const n = s.items.length;
    const news = s.items.filter((i) => i.kind === 'news').length;
    const mark = n === 0 ? '（无内容 → 名句）' : `${n} 条（新闻 ${news} / 更新 ${n - news}）`;
    log(`      ${s.label.padEnd(4, '　')} ${mark}`);
    for (const i of s.items.slice(0, PER_SECTION)) log(`        · ${i.title.slice(0, 72)}  [${i.source}]`);
  }
  log(`\n输出: data/${today}.json  +  data/brief.js`);
  log('\n[完成] 打开 index.html 即可查看今天的早报。');
}

main().catch((err) => {
  console.error('\n[失败] 生成出错，请检查网络连接后重试。');
  console.error(err);
  process.exit(1);
});
