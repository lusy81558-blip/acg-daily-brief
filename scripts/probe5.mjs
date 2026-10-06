import { CANDIDATES } from './probe5-sources.mjs';
import { parseFeed } from './lib/feed.mjs';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function probe(src) {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), src.timeout ?? 15000);
  try {
    const res = await fetch(src.url, {
      headers: { 'user-agent': UA, accept: 'application/rss+xml, application/xml, text/xml, */*' },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    const text = await res.text();
    const items = parseFeed(text);
    return { ...src, ok: res.ok && items.length > 0, status: res.status, n: items.length, ms: Date.now() - started, sample: items[0]?.title?.slice(0, 80) || text.slice(0, 50).replace(/\s+/g, ' ') };
  } catch (err) {
    return { ...src, ok: false, status: 'ERR', n: 0, ms: Date.now() - started, sample: String(err.cause?.code || err.name || err.message).slice(0, 60) };
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
await Promise.all(Array.from({ length: 6 }, worker));
process.stderr.write('\n');

for (const r of results) {
  console.log(`${r.ok ? '[OK ]' : '[-- ]'} ${String(r.section).padEnd(6)} ${r.id.padEnd(22)} ${String(r.status).padEnd(5)} n=${String(r.n).padEnd(5)} ${r.name}`);
  if (r.sample) console.log(`        └ ${r.sample}`);
}
const ok = results.filter((r) => r.ok);
console.log(`\n可用 ${ok.length} / ${CANDIDATES.length}`);
console.log(ok.map((r) => `${r.id}(${r.section})`).join(', '));
