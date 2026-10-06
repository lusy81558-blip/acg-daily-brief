import { CANDIDATES } from './probe4-sources.mjs';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const CONCURRENCY = 6;

function countItems(text) {
  return Math.max((text.match(/<item[\s>]/g) || []).length, (text.match(/<entry[\s>]/g) || []).length);
}

function firstTitle(text) {
  const m = text.match(/<title[^>]*>[\s\S]*?<\/title>/g) || [];
  for (const b of m) {
    const t = b.replace(/<\/?title[^>]*>/g, '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/\s+/g, ' ').trim();
    if (t && t.length > 3) return t.slice(0, 70);
  }
  return '';
}

async function probe(src) {
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), src.timeout ?? 15000);
  const headers = {
    'user-agent': src.uaOverride || UA,
    accept: 'application/rss+xml, application/xml, text/xml, application/json, */*',
    ...(src.headers || {}),
  };
  if (src.method === 'POST') headers['content-type'] = 'application/json';
  try {
    const res = await fetch(src.url, {
      method: src.method || 'GET',
      headers,
      body: src.body ? JSON.stringify(src.body) : undefined,
      redirect: 'follow',
      signal: ctrl.signal,
    });
    const text = await res.text();
    const isJson = (res.headers.get('content-type') || '').includes('json') || text.trimStart().startsWith('{') || text.trimStart().startsWith('[');
    const n = isJson ? 1 : countItems(text);
    const sample = isJson
      ? text.replace(/\s+/g, ' ').slice(0, 90)
      : firstTitle(text) || text.slice(0, 60).replace(/\s+/g, ' ');
    return { ...src, ok: res.ok && (isJson || n > 0), status: res.status, items: isJson ? 'json' : n, ms: Date.now() - started, sample, bytes: text.length };
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
    `${r.ok ? '[OK ]' : '[-- ]'} ${String(r.section).padEnd(10)} ${r.id.padEnd(22)} ` +
    `${String(r.status).padEnd(5)} n=${String(r.items).padEnd(5)} ${String(r.ms + 'ms').padEnd(8)} ${r.name}`
  );
  if (r.sample) console.log(`        └ ${r.sample}`);
}

const ok = results.filter((r) => r.ok);
console.log(`\n可用 ${ok.length} / ${CANDIDATES.length}`);
console.log('新增可用: ' + ok.map((r) => `${r.id}(${r.section})`).join(', '));
