import { CANDIDATES } from './probe3-sources.mjs';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const CONCURRENCY = 8;

function countItems(xml) {
  return Math.max((xml.match(/<item[\s>]/g) || []).length, (xml.match(/<entry[\s>]/g) || []).length);
}

function firstTitle(xml) {
  const blocks = xml.match(/<title[^>]*>[\s\S]*?<\/title>/g) || [];
  for (const b of blocks) {
    const t = b.replace(/<\/?title[^>]*>/g, '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/\s+/g, ' ').trim();
    if (t && t.length > 3) return t.slice(0, 70);
  }
  return '';
}

async function probe(src) {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), src.timeout ?? 15000);
  const headers = src.rawAccept
    ? { 'user-agent': UA }
    : { 'user-agent': UA, accept: 'application/rss+xml, application/xml, text/xml, */*' };
  try {
    const res = await fetch(src.url, { headers, redirect: 'follow', signal: ctrl.signal });
    const body = await res.text();
    const n = countItems(body);
    return { ...src, ok: res.ok && n > 0, status: res.status, items: n, ms: Date.now() - started, sample: firstTitle(body) || body.slice(0, 60).replace(/\s+/g, ' '), bytes: body.length };
  } catch (err) {
    return { ...src, ok: false, status: 'ERR', items: 0, ms: Date.now() - started, sample: String(err.cause?.code || err.name || err.message).slice(0, 60), bytes: 0 };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
let cursor = 0;
async function worker() {
  while (cursor < CANDIDATES.length) {
    const i = cursor++;
    results[i] = await probe(CANDIDATES[i]);
    process.stderr.write('.');
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
process.stderr.write('\n');

for (const r of results) {
  console.log(
    `${r.ok ? '[OK ]' : '[-- ]'} ${String(r.section).padEnd(6)} ${r.id.padEnd(24)} ` +
    `${String(r.status).padEnd(5)} items=${String(r.items).padEnd(4)} ${String(r.ms + 'ms').padEnd(8)} ${r.name}`
  );
  if (r.sample) console.log(`        └ ${r.sample}`);
}

const ok = results.filter((r) => r.ok);
console.log(`\n可用 ${ok.length} / ${CANDIDATES.length}`);
console.log('新增可用: ' + ok.map((r) => `${r.id}(${r.section})`).join(', '));
