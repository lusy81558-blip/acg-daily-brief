// 早报数据源配置（已通过实际探测验证可用）
//
// section : game | anime | manga | movie | music | misc
//           misc 表示跨领域源，按标题关键词自动分流到各板块
// kind    : news    = 新闻资讯（默认）
//           release = 作品更新/新刊类信息，权重天然更低
// lang    : ja | en | zh
// weight  : 站点权重，参与"事件重要性"打分，1.0 为最高
// timeout : 毫秒，个别站点较慢需放宽
// cloudOnly : 仅云端（GitHub Actions）使用——这些站点在国内网络下被墙或被反爬拦截

export const CLOUD_ONLY = [
  { id: 'natalie-comic', name: 'コミックナタリー', section: 'manga', lang: 'ja', weight: 1.0, cloudOnly: true, url: 'https://natalie.mu/comic/feed/news' },
  { id: 'natalie-eiga',  name: '映画ナタリー',     section: 'movie', lang: 'ja', weight: 1.0, cloudOnly: true, url: 'https://natalie.mu/eiga/feed/news' },
  { id: 'natalie-music', name: '音楽ナタリー',     section: 'music', lang: 'ja', weight: 1.0, cloudOnly: true, url: 'https://natalie.mu/music/feed/news' },
  { id: 'ann',           name: 'Anime News Network', section: 'anime', lang: 'en', weight: 1.0, cloudOnly: true, url: 'https://www.animenewsnetwork.com/all/rss.xml' },
  { id: 'ann-manga',     name: 'ANN Manga',        section: 'manga', lang: 'en', weight: 0.8, cloudOnly: true, url: 'https://www.animenewsnetwork.com/manga/rss.xml' },
  { id: 'oricon',        name: 'ORICON NEWS',      section: 'music', lang: 'ja', weight: 0.9, cloudOnly: true, url: 'https://www.oricon.co.jp/rss/news.xml' },
  { id: 'eiga',          name: '映画.com',         section: 'movie', lang: 'ja', weight: 0.8, cloudOnly: true, url: 'https://eiga.com/rss/' },

  // 漫画硬新闻最缺，云上用 Google News 聚合日文漫画报道（含コミックナタリー等被墙的源）
  { id: 'gnews-manga', name: 'Google News 漫画', section: 'manga', lang: 'ja', weight: 0.7, cloudOnly: true, stripSourceSuffix: true,
    url: 'https://news.google.com/rss/search?q=%E6%BC%AB%E7%94%BB+when%3A1d&hl=ja&gl=JP&ceid=JP%3Aja' },
  { id: 'gnews-natalie-comic', name: 'Google News コミックナタリー', section: 'manga', lang: 'ja', weight: 0.9, cloudOnly: true, stripSourceSuffix: true,
    url: 'https://news.google.com/rss/search?q=site%3Anatalie.mu+%E9%80%A3%E8%BC%89+when%3A1d&hl=ja&gl=JP&ceid=JP%3Aja' },
];

export const LOCAL_SOURCES = [
  // ---------- 游戏 ----------
  { id: '4gamer',    name: '4Gamer.net',       section: 'game', lang: 'ja', weight: 1.0, url: 'https://www.4gamer.net/rss/index.xml' },
  { id: 'denfami',   name: '電ファミニコゲーマー', section: 'game', lang: 'ja', weight: 0.9, url: 'https://news.denfaminicogamer.jp/feed' },
  { id: 'automaton', name: 'AUTOMATON',        section: 'game', lang: 'ja', weight: 0.9, url: 'https://automaton-media.com/feed/', timeout: 30000 },
  { id: 'inside',    name: 'INSIDE',           section: 'game', lang: 'ja', weight: 0.8, url: 'https://www.inside-games.jp/rss/index.rdf' },
  { id: 'gematsu',   name: 'Gematsu',          section: 'game', lang: 'en', weight: 0.9, url: 'https://www.gematsu.com/feed' },
  { id: 'nintendolife', name: 'Nintendo Life', section: 'game', lang: 'en', weight: 0.7, url: 'https://www.nintendolife.com/feeds/latest' },
  { id: 'vgc',       name: 'VGC',              section: 'game', lang: 'en', weight: 0.7, url: 'https://www.videogameschronicle.com/feed/' },
  { id: 'yystv',     name: '游研社',            section: 'game', lang: 'zh', weight: 0.8, url: 'https://www.yystv.cn/rss/feed' },
  { id: 'gcores',    name: '机核 GCORES',       section: 'game', lang: 'zh', weight: 0.7, url: 'https://www.gcores.com/rss' },

  // ---------- 动画 ----------
  { id: 'animeanime', name: 'アニメ！アニメ！',  section: 'anime', lang: 'ja', weight: 1.0, url: 'https://animeanime.jp/rss/index.rdf' },
  { id: 'mal',        name: 'MyAnimeList News', section: 'anime', lang: 'en', weight: 0.7, url: 'https://myanimelist.net/rss/news.xml' },

  // ---------- 漫画 ----------
  { id: 'magmix',      name: 'マグミクス',        section: 'misc', lang: 'ja', weight: 1.0, url: 'https://magmix.jp/feed' },
  { id: 'comic-days',  name: 'コミックDAYS',      section: 'manga', lang: 'ja', weight: 0.6, kind: 'release', url: 'https://comic-days.com/rss' },
  { id: 'jumpplus',    name: '少年ジャンプ+',      section: 'manga', lang: 'ja', weight: 0.6, kind: 'release', url: 'https://shonenjumpplus.com/rss' },
  { id: 'kuragebunch', name: 'くらげバンチ',       section: 'manga', lang: 'ja', weight: 0.5, kind: 'release', url: 'https://kuragebunch.com/rss' },
  { id: 'tonarinoyj',  name: 'となりのヤングジャンプ', section: 'manga', lang: 'ja', weight: 0.5, kind: 'release', url: 'https://tonarinoyj.jp/rss' },

  // ---------- 电影 ----------
  { id: 'realsound-movie', name: 'Real Sound 映画部',  section: 'movie', lang: 'ja', weight: 1.0, url: 'https://realsound.jp/movie/feed' },
  { id: 'cinemacafe',      name: 'シネマカフェ',        section: 'movie', lang: 'ja', weight: 0.9, url: 'https://www.cinemacafe.net/rss/index.xml' },
  { id: 'moviecollection', name: 'MOVIE Collection',   section: 'movie', lang: 'ja', weight: 0.8, url: 'https://www.moviecollection.jp/rss/' },
  { id: 'variety',         name: 'Variety',            section: 'movie', lang: 'en', weight: 0.8, url: 'https://variety.com/feed/' },
  { id: 'thr',             name: 'Hollywood Reporter', section: 'movie', lang: 'en', weight: 0.7, url: 'https://www.hollywoodreporter.com/feed/' },
  { id: 'slashfilm',       name: 'SlashFilm',          section: 'movie', lang: 'en', weight: 0.6, url: 'https://www.slashfilm.com/feed/' },

  // ---------- 音乐 ----------
  { id: 'lisani',          name: 'リスアニ！',      section: 'music', lang: 'ja', weight: 1.0, url: 'https://www.lisani.jp/feed/' },
  { id: 'realsound-music', name: 'Real Sound 音楽', section: 'music', lang: 'ja', weight: 0.9, url: 'https://realsound.jp/music/feed' },
  { id: 'billboard-us',    name: 'Billboard',      section: 'music', lang: 'en', weight: 0.8, url: 'https://www.billboard.com/feed/' },
  { id: 'pitchfork',       name: 'Pitchfork',      section: 'music', lang: 'en', weight: 0.7, url: 'https://pitchfork.com/feed/feed-news/rss' },
  { id: 'nme',             name: 'NME',            section: 'music', lang: 'en', weight: 0.6, url: 'https://www.nme.com/news/music/feed' },

  // ---------- 跨领域源（按关键词自动分流） ----------
  { id: 'gigazine', name: 'GIGAZINE', section: 'misc', lang: 'ja', weight: 0.9, timeout: 25000, url: 'https://gigazine.net/news/rss_2.0/' },
];

// 云端环境（GitHub Actions 会设置 CI=true）额外启用被墙的源，覆盖面更广
export const SOURCES = process.env.CI ? [...LOCAL_SOURCES, ...CLOUD_ONLY] : LOCAL_SOURCES;

export const SECTIONS = [
  { key: 'game',  label: '游戏', en: 'GAMES' },
  { key: 'anime', label: '动画', en: 'ANIME' },
  { key: 'manga', label: '漫画', en: 'MANGA' },
  { key: 'movie', label: '电影', en: 'MOVIES' },
  { key: 'music', label: '音乐', en: 'MUSIC' },
];
