// 抓取各源，打印最新条目的真实标题与时间，用于人工核对源质量
import { fetchFeed } from './lib/feed.mjs';
import { SOURCES } from './sources.mjs';

const only = process.argv[2];
const list = only ? SOURCES.filter((s) => s.section === only || s.id === only) : SOURCES;

for (const src of list) {
  try {
    const items = await fetchFeed(src.url, { timeout: 25000, retries: 1 });
    console.log(`\n===== ${src.id} | ${src.name} | ${src.section} | ${items.length} 条 =====`);
    for (const it of items.slice(0, 5)) {
      const d = it.date ? it.date.toISOString().slice(0, 16).replace('T', ' ') : 'no-date';
      console.log(`  [${d}] ${it.title.slice(0, 90)}`);
      console.log(`      ${it.link.slice(0, 110)}`);
    }
  } catch (err) {
    console.log(`\n===== ${src.id} | ${src.name} | 失败: ${err.message} =====`);
  }
}
