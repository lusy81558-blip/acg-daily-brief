// 源可用性探测：并发请求所有候选源，报告状态、条目数、最新标题
import { SOURCES } from './sources.mjs';

const TIMEOUT_MS = 15000;
const CONCURRENCY = 8;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function countItems(xml) {
  const item = (xml.match(/<item[\s>]/g) || []).length;
  const entry = (xml.match(/<entry[\s>]/g) || []).length;
  return Math.max(item, entry);
}

function firstTitle(xml) {
  const m = xml.match(/<title[^>]*>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/title>/g);
  if (!m) return '';
  for (const block of m) {
    const t = block
      .replace(/<\/?title[^>]*>/g, '')
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .trim();
    if (t && !/^(.*(RSS|Feed|Site).*)$/i.test(t)) return t.slice(0, 80);
  }
  return '';
}

async function probe(src) {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(src.url, {
      headers: { 'user-agent': UA, accept: '*/*' },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    const body = await res.text();
    const ms = Date.now() - started;
    const n = countItems(body);
    return {
      ...src,
      ok: res.ok && n > 0,
      status: res.status,
      items: n,
      ms,
      sample: firstTitle(body),
      bytes: body.length,
    };
  } catch (err) {
    return {
      ...src,
      ok: false,
      status: 'ERR',
      items: 0,
      ms: Date.now() - started,
      sample: String(err.cause?.code || err.name || err.message).slice(0, 60),
      bytes: 0,
    };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
let cursor = 0;
async function worker() {
  while (cursor < SOURCES.length) {
    const i = cursor++;
    results[i] = await probe(SOURCES[i]);
    process.stderr.write('.');
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
process.stderr.write('\n');

const pad = (s, n) => String(s).padEnd(n, ' ').slice(0, n);
const padL = (s, n) => String(s).padStart(n, ' ');

console.log(
  pad('OK', 4) + pad('SEC', 6) + pad('ID', 16) + padL('CODE', 6) +
  padL('ITEMS', 7) + padL('MS', 7) + padL('KB', 7) + 'NAME'
);
console.log('-'.repeat(110));
for (const r of results) {
  console.log(
    pad(r.ok ? 'YES' : 'no', 4) +
    pad(r.section, 6) +
    pad(r.id, 16) +
    padL(r.status, 6) +
    padL(r.items, 7) +
    padL(r.ms, 7) +
    padL(Math.round(r.bytes / 1024), 7) +
    r.name
  );
}

console.log('\n===== 样本标题 =====');
for (const r of results) {
  console.log(`${r.ok ? '[OK ]' : '[-- ]'} ${pad(r.id, 16)} ${r.sample}`);
}

const ok = results.filter((r) => r.ok);
console.log(`\n可用 ${ok.length} / ${SOURCES.length}`);
for (const s of ['game', 'anime', 'manga', 'movie', 'music']) {
  const list = ok.filter((r) => r.section === s).map((r) => r.id);
  console.log(`  ${pad(s, 6)} ${list.length} 个: ${list.join(', ') || '(无)'}`);
}
