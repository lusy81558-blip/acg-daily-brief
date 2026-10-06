// 第二批候选源：补漫画/电影空档 + 试探拦截站点的绕过可能
export const CANDIDATES = [
  // ---------- 游戏补充 ----------
  { id: 'gamespark', name: 'GameSpark', section: 'game', url: 'https://www.gamespark.jp/rss/index.rdf' },
  { id: 'inside', name: 'INSIDE', section: 'game', url: 'https://www.inside-games.jp/rss/index.rdf' },
  { id: 'automaton2', name: 'Automaton(retry)', section: 'game', url: 'https://automaton-media.com/feed/', timeout: 40000 },
  { id: 'famitsu2', name: 'Famitsu(/feed)', section: 'game', url: 'https://www.famitsu.com/feed' },
  { id: 'famitsu3', name: 'Famitsu(rss/news)', section: 'game', url: 'https://www.famitsu.com/rss/news.xml' },
  { id: 'dengeki2', name: '電撃(news.xml)', section: 'game', url: 'https://dengekionline.com/rss/news.xml' },

  // ---------- 动画补充 ----------
  { id: 'mantan', name: 'MANTANWEB', section: 'anime', url: 'https://mantan-web.jp/rss/index.rdf' },
  { id: 'animehack', name: 'アニメハック', section: 'anime', url: 'https://anime.eiga.com/news/feed/' },
  { id: 'webnewtype', name: 'WebNewtype', section: 'anime', url: 'https://webnewtype.com/feed/' },
  { id: 'animatetimes2', name: 'アニメイトタイムズ(/rss/)', section: 'anime', url: 'https://www.animatetimes.com/rss/' },

  // ---------- 漫画补充 ----------
  { id: 'ddnavi', name: 'ダ・ヴィンチWeb', section: 'manga', url: 'https://ddnavi.com/feed/' },
  { id: 'kaiyou', name: 'KAI-YOU', section: 'manga', url: 'https://kai-you.net/rss' },
  { id: 'natalie-comic2', name: 'コミックナタリー(headers)', section: 'manga', url: 'https://natalie.mu/comic/feed/news', headers: { accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8', 'accept-language': 'ja,en;q=0.9' } },
  { id: 'natalie-comic3', name: 'コミックナタリー(rss path)', section: 'manga', url: 'https://natalie.mu/comic/rss' },

  // ---------- 电影补充 ----------
  { id: 'moviewalker', name: 'MOVIE WALKER PRESS', section: 'movie', url: 'https://moviewalker.jp/news/feed/' },
  { id: 'realsound-movie', name: 'Real Sound 映画部', section: 'movie', url: 'https://realsound.jp/movie/feed' },
  { id: 'theriver', name: 'THE RIVER', section: 'movie', url: 'https://theriver.jp/feed/' },
  { id: 'cinematoday2', name: 'シネマトゥデイ(/rss/news)', section: 'movie', url: 'https://www.cinematoday.jp/rss/news' },
  { id: 'eiga2', name: '映画.com(/rss/news/)', section: 'movie', url: 'https://eiga.com/rss/news/', timeout: 30000 },

  // ---------- 音乐补充 ----------
  { id: 'realsound-music', name: 'Real Sound 音楽', section: 'music', url: 'https://realsound.jp/music/feed' },
  { id: 'rsj', name: 'Rolling Stone Japan', section: 'music', url: 'https://rollingstonejapan.com/feed' },
  { id: 'billboard2', name: 'Billboard JAPAN(news)', section: 'music', url: 'https://www.billboard-japan.com/rss/news.xml' },
  { id: 'oricon2', name: 'ORICON(retry)', section: 'music', url: 'https://www.oricon.co.jp/rss/news.xml', timeout: 40000 },

  // ---------- 通用聚合：Google News RSS ----------
  { id: 'gnews-manga', name: 'Google News 漫画', section: 'manga', url: 'https://news.google.com/rss/search?q=%E6%BC%AB%E7%94%BB&hl=ja&gl=JP&ceid=JP:ja' },
  { id: 'gnews-movie', name: 'Google News 映画', section: 'movie', url: 'https://news.google.com/rss/search?q=%E6%98%A0%E7%94%BB&hl=ja&gl=JP&ceid=JP:ja' },
  { id: 'gnews-anime', name: 'Google News アニメ', section: 'anime', url: 'https://news.google.com/rss/search?q=%E3%82%A2%E3%83%8B%E3%83%A1&hl=ja&gl=JP&ceid=JP:ja' },
  { id: 'gnews-game', name: 'Google News ゲーム', section: 'game', url: 'https://news.google.com/rss/search?q=%E3%82%B2%E3%83%BC%E3%83%A0&hl=ja&gl=JP&ceid=JP:ja' },
  { id: 'gnews-music', name: 'Google News 音楽', section: 'music', url: 'https://news.google.com/rss/search?q=%E9%9F%B3%E6%A5%BD&hl=ja&gl=JP&ceid=JP:ja' },

  // ---------- 热度信号：Hatena 书签 ----------
  { id: 'hatena-game', name: 'Hatena ゲーム', section: 'signal', url: 'https://b.hatena.ne.jp/search/tag?q=%E3%82%B2%E3%83%BC%E3%83%A0&sort=popular&mode=rss' },
  { id: 'hatena-anime', name: 'Hatena アニメ', section: 'signal', url: 'https://b.hatena.ne.jp/search/tag?q=%E3%82%A2%E3%83%8B%E3%83%A1&sort=popular&mode=rss' },
  { id: 'hatena-manga', name: 'Hatena 漫画', section: 'signal', url: 'https://b.hatena.ne.jp/search/tag?q=%E6%BC%AB%E7%94%BB&sort=popular&mode=rss' },
  { id: 'hatena-movie', name: 'Hatena 映画', section: 'signal', url: 'https://b.hatena.ne.jp/search/tag?q=%E6%98%A0%E7%94%BB&sort=popular&mode=rss' },

  // ---------- Yahoo 新闻 ----------
  { id: 'yahoo-ent', name: 'Yahoo エンタメ', section: 'signal', url: 'https://news.yahoo.co.jp/rss/topics/entertainment.xml' },
];
