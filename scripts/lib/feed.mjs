// 极简 RSS 2.0 / RSS 1.0(RDF) / Atom 解析器，零依赖

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', hellip: '…', mdash: '—', ndash: '–',
};

export function decodeEntities(s = '') {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m);
}

function safeCodePoint(n) {
  try {
    return Number.isFinite(n) ? String.fromCodePoint(n) : '';
  } catch {
    return '';
  }
}

export function stripTags(s = '') {
  return decodeEntities(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function unwrap(s = '') {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

/** 取出第一个匹配标签的原始内容（支持 CDATA） */
function tag(block, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i');
  const m = block.match(re);
  return m ? unwrap(m[1]).trim() : '';
}

/** 取 Atom 风格的自闭合 link：<link rel="alternate" href="..."/> */
function atomLink(block) {
  const links = block.match(/<link\b[^>]*\/?>/gi) || [];
  let fallback = '';
  for (const l of links) {
    const href = (l.match(/href\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (!href) continue;
    const rel = (l.match(/rel\s*=\s*["']([^"']+)["']/i) || [])[1] || 'alternate';
    if (rel === 'alternate') return decodeEntities(href);
    if (!fallback) fallback = decodeEntities(href);
  }
  return fallback;
}

function parseDate(raw) {
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? new Date(t) : null;
}

function isLikelyImage(url) {
  if (!/^https?:\/\//i.test(url)) return false;
  if (/\.(jpe?g|png|webp|gif|avif)(\?|#|$)/i.test(url)) return true;
  return /image|photo|thumb|img/i.test(url);
}

/** 从条目里挖配图：media:content / media:thumbnail / enclosure / 正文里的 <img> */
function extractImage(block) {
  const decoded = decodeEntities(block);
  const patterns = [
    /<media:content[^>]*\burl\s*=\s*["']([^"']+)["']/i,
    /<media:thumbnail[^>]*\burl\s*=\s*["']([^"']+)["']/i,
    /<itunes:image[^>]*\bhref\s*=\s*["']([^"']+)["']/i,
    /<enclosure[^>]*\burl\s*=\s*["']([^"']+)["']/i,
    /<img[^>]*\bsrc\s*=\s*["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = decoded.match(re);
    if (m && isLikelyImage(m[1])) return m[1];
  }
  return '';
}

/** 抓取文章页的 og:image，作为配图兜底（只对每板块头条调用） */
export async function fetchArticleImage(pageUrl, { timeout = 9000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'ja,zh-CN;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    if (!res.ok) return '';
    const html = (await res.text()).slice(0, 300000);

    const linkRel = html.match(/<link[^>]+rel=["']image_src["'][^>]*>/i);
    const metas = html.match(/<meta\b[^>]*>/gi) || [];
    const candidates = [];
    for (const tag of metas) {
      if (!/(og:image|twitter:image)/i.test(tag)) continue;
      const content = (tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i) || [])[1];
      if (content) candidates.push(decodeEntities(content));
    }
    if (linkRel) {
      const href = (linkRel[0].match(/\bhref\s*=\s*["']([^"']+)["']/i) || [])[1];
      if (href) candidates.push(decodeEntities(href));
    }
    for (const c of candidates) {
      if (!c || /\.svg(\?|$)/i.test(c)) continue;
      try {
        return new URL(c, pageUrl).href;
      } catch {
        /* ignore */
      }
    }
    return '';
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

function splitBlocks(xml, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

/**
 * 解析任意常见订阅格式
 * @returns {{title: string, link: string, date: Date|null, summary: string}[]}
 */
export function parseFeed(xml) {
  const isAtom = /<feed[\s>]/i.test(xml.slice(0, 2000));
  const blocks = isAtom ? splitBlocks(xml, 'entry') : splitBlocks(xml, 'item');
  return blocks
    .map((b) => {
      const title = stripTags(tag(b, 'title'));
      const link = isAtom
        ? atomLink(b)
        : decodeEntities(tag(b, 'link')) || decodeEntities((b.match(/<link\b[^>]*href\s*=\s*["']([^"']+)["']/i) || [])[1] || '');
      const rawDate =
        tag(b, 'pubDate') || tag(b, 'dc:date') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'date');
      const summary = stripTags(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content'));
      const image = extractImage(b);
      return { title, link, date: parseDate(rawDate), summary, image };
    })
    .filter((it) => it.title && it.link);
}

/** 带超时与重试的抓取 */
export async function fetchFeed(url, { timeout = 20000, retries = 1, headers = {} } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, {
        headers: {
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
          'accept-language': 'ja,zh-CN;q=0.9,en;q=0.8',
          ...headers,
        },
        redirect: 'follow',
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      return parseFeed(text);
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}
