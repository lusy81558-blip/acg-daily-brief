// 第四批：已知域名的正确 RSS 路径、更多漫画站、以及 API 型数据源
export const CANDIDATES = [
  // ---------- 已知域名的其它路径 ----------
  { id: 'nlab-rdf', name: 'ねとらぼ(index.rdf)', section: 'misc', url: 'https://nlab.itmedia.co.jp/nl/rss/index.rdf' },
  { id: 'natalie-referer', name: 'コミックナタリー(Referer)', section: 'manga', url: 'https://natalie.mu/comic/feed/news', headers: { referer: 'https://natalie.mu/comic' } },
  { id: 'natalie-ua-google', name: 'コミックナタリー(UA=feedreader)', section: 'manga', url: 'https://natalie.mu/comic/feed/news', uaOverride: 'FeedFetcher-Google; (+http://www.google.com/feedfetcher.html)' },
  { id: 'mantan-rss', name: 'MANTANWEB(/rss.xml)', section: 'anime', url: 'https://mantan-web.jp/rss.xml' },
  { id: 'mantan-rss2', name: 'MANTANWEB(/rss/index.xml)', section: 'anime', url: 'https://mantan-web.jp/rss/index.xml' },
  { id: 'cinematoday3', name: 'シネマトゥデイ(/rss/news.rdf)', section: 'movie', url: 'https://www.cinematoday.jp/rss/news.rdf' },
  { id: 'cinematoday4', name: 'シネマトゥデイ(/rss/)', section: 'movie', url: 'https://www.cinematoday.jp/rss/' },
  { id: 'animatetimes4', name: 'アニメイトタイムズ(/rss/feed.xml)', section: 'anime', url: 'https://www.animatetimes.com/rss/feed.xml' },
  { id: 'webnewtype3', name: 'WebNewtype(/news/feed/)', section: 'anime', url: 'https://webnewtype.com/news/feed/' },
  { id: 'kaiyou2', name: 'KAI-YOU(/rss/news)', section: 'manga', url: 'https://kai-you.net/rss/news' },

  // ---------- 漫画更多候选 ----------
  { id: 'comic-days', name: 'コミックDAYS', section: 'manga', url: 'https://comic-days.com/rss' },
  { id: 'cycomi', name: 'サイコミ', section: 'manga', url: 'https://cycomi.com/rss' },
  { id: 'shonenjumpplus', name: '少年ジャンプ+', section: 'manga', url: 'https://shonenjumpplus.com/rss' },
  { id: 'alu', name: 'Alu', section: 'manga', url: 'https://alu.jp/rss' },
  { id: 'mangapedia', name: 'マンガペディア', section: 'manga', url: 'https://mangapedia.com/rss' },
  { id: 'kuragebunch', name: 'くらげバンチ', section: 'manga', url: 'https://kuragebunch.com/rss' },
  { id: 'tonarinoyj', name: 'となりのヤングジャンプ', section: 'manga', url: 'https://tonarinoyj.jp/rss' },
  { id: 'dengeki-manga', name: '電撃オンライン(rdf)', section: 'manga', url: 'https://dengekionline.com/rss/index.rdf' },

  // ---------- 电影：欧美大媒体 ----------
  { id: 'variety', name: 'Variety', section: 'movie', url: 'https://variety.com/feed/' },
  { id: 'deadline', name: 'Deadline', section: 'movie', url: 'https://deadline.com/feed/' },
  { id: 'thr', name: 'The Hollywood Reporter', section: 'movie', url: 'https://www.hollywoodreporter.com/feed/' },
  { id: 'slashfilm', name: 'SlashFilm', section: 'movie', url: 'https://www.slashfilm.com/feed/' },

  // ---------- 音乐：欧美补充 ----------
  { id: 'billboard-us', name: 'Billboard', section: 'music', url: 'https://www.billboard.com/feed/' },
  { id: 'nme', name: 'NME', section: 'music', url: 'https://www.nme.com/news/music/feed' },
  { id: 'pitchfork', name: 'Pitchfork', section: 'music', url: 'https://pitchfork.com/feed/feed-news/rss' },

  // ---------- API 型数据源 ----------
  { id: 'anilist', name: 'AniList GraphQL', section: 'api-anime', url: 'https://graphql.anilist.co', method: 'POST', body: { query: '{ Page(perPage: 3) { media(type: ANIME, sort: TRENDING_DESC) { title { native romaji } } } }' } },
  { id: 'jikan', name: 'Jikan API', section: 'api-anime', url: 'https://api.jikan.moe/v4/seasons/now?limit=3' },
  { id: 'jikan-manga', name: 'Jikan 漫画榜', section: 'api-manga', url: 'https://api.jikan.moe/v4/top/manga?limit=3' },
  { id: 'bangumi', name: 'Bangumi 每日放送', section: 'api-anime', url: 'https://api.bgm.tv/calendar' },
  { id: 'shikimori', name: 'Shikimori API', section: 'api-anime', url: 'https://shikimori.one/api/animes?limit=3&order=popularity' },
];
