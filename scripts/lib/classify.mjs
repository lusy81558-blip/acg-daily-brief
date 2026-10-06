// 条目分流、过滤与"事件重要性"打分

// ---------- 板块关键词（词 -> 权重，用于把跨领域源的内容分流） ----------
// 权重越高越"专属"，避免「イカゲーム」「ジャンプアクション」这类子串误判
const SECTION_KEYWORDS = {
  game: {
    'ゲーム': 1, 'ゲームソフト': 2, 'ゲーム機': 2, 'Switch': 2, 'PS5': 2, 'PlayStation': 2,
    'プレイステーション': 2, 'Xbox': 2, 'Steam': 2, 'Nintendo': 2, '任天堂': 2, 'インディー': 1,
    'eスポーツ': 1, 'ポケモン': 1, 'マリオ': 1, 'ゼルダ': 1, 'ドラクエ': 1, 'モンハン': 1,
    'カプコン': 1, 'セガ': 1, 'バンダイナムコ': 1, 'スクウェア・エニックス': 1, 'コンシューマ': 2,
    '游戏': 1, '手游': 1,
  },
  anime: {
    'アニメ': 1, 'TVアニメ': 3, 'アニメ化': 3, 'アニメーター': 3, 'アニメ映画': 3, '声優': 2,
    '劇場版': 2, 'アニソン': 2, '新番': 2, '放送開始': 2, 'アニプレックス': 2, '动画': 1,
  },
  manga: {
    '漫画': 2, 'マンガ': 2, 'コミック': 2, '連載': 3, '連載開始': 3, '新刊': 2, '単行本': 2,
    'ジャンプ': 1, 'マガジン': 1, 'サンデー': 1, 'ヤングジャンプ': 2, '漫画家': 2, '作画': 1,
    '電子書籍': 1, '読切': 2, '掲載': 1,
  },
  movie: {
    '映画': 2, '映画化': 3, '実写': 2, '実写化': 3, '劇場公開': 3, '興行収入': 3, '監督': 1,
    '予告編': 2, '特報': 2, 'ドラマ': 1, '出演': 1, 'Netflix': 1, 'アマゾンプライム': 1,
    'box office': 3, '电影': 1,
  },
  music: {
    '音楽': 1, 'ライブ': 2, 'ツアー': 2, 'アルバム': 2, 'シングル': 2, '楽曲': 2, 'アーティスト': 1,
    '歌手': 1, 'バンド': 1, '主題歌': 2, 'チャート': 1, 'オリコン': 2, 'Billboard': 2, 'MV': 2,
    '配信リリース': 2, 'ボーカル': 1, '音乐': 1,
  },
};

// ---------- 氪金手游：直接排除 ----------
const MOBILE_GACHA = [
  /ガチャ/, /ソシャゲ/, /スマホゲーム/, /スマホ向け/, /スマートフォン向け/, /事前登録/, /事前予約/,
  /リセマラ/, /★5/, /星5/, /星５/, /課金/, /無料10連/, /10連ガチャ/, /期間限定ガチャ/, /召喚/,
  /イベント開催中/, /ログインボーナス/, /アップデート情報/, /新キャラクター登場/, /ストーリー追加/,
  /卡池/, /抽卡/, /氪金/, /首充/, /限时活动/, /登陆奖励/, /手游/i, /手机游戏/,
  /\bgacha\b/i, /\bmobile game\b/i, /pre-?registration/i, /\bbanner\b/i, /limited-?time event/i,
];

// ---------- 单机／主机向：加权 ----------
const CONSOLE_HINT = [
  /Switch/, /スイッチ/, /PS5/, /PlayStation/, /プレイステーション/, /Xbox/, /Steam/, /PC版/,
  /Nintendo/, /任天堂/, /家庭用ゲーム/, /コンシューマ/, /インディー/, /単体/, /パッケージ版/,
  /リマスター/, /リメイク/, /移植/, /体験版/, /アーリーアクセス/,
];

// ---------- 重要性关键词：正分 ----------
const IMPORTANCE = [
  { re: /訃報|死去|逝去|亡くな|急逝/, w: 6 },
  { re: /アニメ化|実写化|映画化|続編|新シリーズ|制作決定|開発決定|発売決定|発売日決定|配信決定|放送決定|解禁/, w: 4 },
  { re: /受賞|グランプリ|大賞|世界記録|ギネス|ミリオン|100万|1位|首位|初登場|記録的|歴代/, w: 4 },
  { re: /延期|中止|発売中止|サービス終了|打ち切り|炎上|批判|謝罪|問題/, w: 3 },
  { re: /発表|公開|判明|明らかに|新情報|キャスト|スタッフ|予告編|特報|主題歌|ビジュアル|キービジュアル|初公開/, w: 2 },
  { re: /独占|スクープ|速報|初報|単独/, w: 2 },
  { re: /決定|始動|登場|追加|発表会|生放送|イベント開催/, w: 1 },
  { re: /announced|announces|reveals|revealed|release date|delayed|cancelled|greenlit|sequel|remake|remaster|trailer|teaser/i, w: 4 },
  { re: /wins|award|record|box office|milestone|million|tops|debuts at/i, w: 4 },
  { re: /dies|dead at|passed away|obituary/i, w: 6 },
  { re: /連載開始|新連載|連載終了|完結|休載|連載再開|復活連載/, w: 3 },
];

// ---------- 噪音关键词：负分 ----------
const NOISE = [
  { re: /インタビュー|対談|寄稿|コラム|特集|考察|感想|レビュー|プレイ日記|レポート|座談会|鼎談/, w: -4 },
  { re: /ランキング|まとめ|一覧|5選|10選|おすすめ|比較|振り返り|名作|名シーン|なぜ|理由は/, w: -3 },
  { re: /セール|値引き|割引|半額|オフ|キャンペーン|プレゼント|無料配布|クーポン|ポイント還元|投げ売り|Kindle版/, w: -8 },
  { re: /グッズ|フィギュア|ぬいぐるみ|コラボカフェ|受注|予約受付|限定販売|菓子|食品|くじ|ガシャ|抽選|特典/, w: -5 },
  { re: /噂|うわさ|リーク|リークス|未確認|かもしれない|説に|予想|考察/, w: -1 },
  { re: /インスタ|ブログ更新|SNS投稿|ツイート|投稿が話題|ファンの反応|反響|複雑な反応|歓喜/, w: -3 },
  { re: /ネットの反応|共感|吹いた|ざわつ|話題沸騰|衝撃の事実|思わず|驚きの声/, w: -6 },
  { re: /review|opinion|feature|ranked|ranking|best|guide|how to|deals|sale|discount|explained/i, w: -4 },
  { re: /rumor|leak|reportedly|maybe|could be/i, w: -1 },
];

// ---------- 日系内容：加权 ----------
const JP_HINT = [
  /日本|日本語|国内|国産|アニメ|漫画|マンガ|アニソン|声優|任天堂|ニンテンドー|プレイステーション|ポケモン|ガンダム/,
];

export function isMobileGacha(title) {
  return MOBILE_GACHA.some((re) => re.test(title));
}

/**
 * 按标题关键词决定板块。
 * - misc 源：完全靠关键词，匹配不到则丢弃
 * - 其它源：默认归属本站板块，但被别的板块关键词明显压过时改判
 *   （例如"映画部"站点发的 TV 动画化消息归到动画）
 */
export function routeSection(title, defaultSection) {
  const hits = {};
  for (const [section, words] of Object.entries(SECTION_KEYWORDS)) {
    let s = 0;
    for (const [word, weight] of Object.entries(words)) if (title.includes(word)) s += weight;
    hits[section] = s;
  }

  let best = defaultSection;
  let bestHits = 0;
  for (const [section, n] of Object.entries(hits)) {
    if (n > bestHits) {
      bestHits = n;
      best = section;
    }
  }

  if (defaultSection === 'misc') return bestHits > 0 ? best : null;
  const defHits = hits[defaultSection] ?? 0;
  return best !== defaultSection && bestHits >= defHits + 2 && bestHits >= 2 ? best : defaultSection;
}

/** 计算"事件大小"分数 */
export function scoreItem(item) {
  const title = item.title;
  let score = (item.sourceWeight ?? 0.7) * 10;

  for (const { re, w } of IMPORTANCE) if (re.test(title)) score += w;
  for (const { re, w } of NOISE) if (re.test(title)) score += w;
  for (const re of CONSOLE_HINT) if (re.test(title)) score += 2.5;
  for (const re of JP_HINT) if (re.test(title)) score += 1.5;

  score += item.kind === 'release' ? -6 : 2;

  const ts = item.date ? new Date(item.date).getTime() : NaN;
  const ageH = Number.isFinite(ts) ? (Date.now() - ts) / 36e5 : 999;
  if (ageH <= 6) score += 3;
  else if (ageH <= 12) score += 2;
  else if (ageH <= 26) score += 1;
  else if (ageH > 48) score -= 4;

  if (/^\[|^【/.test(title)) score -= 1;

  const len = [...title].length;
  if (len < 8) score -= 1;
  if (len > 70) score -= 0.5;

  return Number(score.toFixed(2));
}

// ---------- 去重 ----------
function bigrams(s) {
  const norm = s.toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
  const out = new Set();
  for (let i = 0; i < norm.length - 1; i++) out.add(norm.slice(i, i + 2));
  return out;
}

function similarity(a, b) {
  const A = bigrams(a);
  const B = bigrams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  return inter / (A.size + B.size - inter);
}

function normalize(s) {
  return s.toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
}

/** 找出两段文字共有的"较长连续日文字串"，用来识别换了个说法的同一件事 */
function sharedCjkRun(a, b, minLen = 6) {
  const runs = normalize(a).match(/[\u3040-\u30ff\u4e00-\u9fff]{6,}/g) || [];
  const target = normalize(b);
  for (const run of runs) {
    for (let i = 0; i + minLen <= run.length; i++) {
      if (target.includes(run.slice(i, i + minLen))) return true;
    }
  }
  return false;
}

/** 同板块内去重，保留分数更高的那条 */
export function dedupe(items, threshold = 0.55) {
  const sorted = [...items].sort((a, b) => b.score - a.score);
  const kept = [];
  for (const it of sorted) {
    const dup = kept.find(
      (k) => similarity(k.title, it.title) >= threshold || sharedCjkRun(k.title, it.title)
    );
    if (!dup) kept.push(it);
  }
  return kept;
}
