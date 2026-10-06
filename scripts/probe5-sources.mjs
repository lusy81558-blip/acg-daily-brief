// 第五批：最后一轮补漏（漫画新闻、动画、电影、音乐的长尾路径）
export const CANDIDATES = [
  // 聚合/门户
  { id: 'livedoor-ent', name: 'livedoor エンタメ', section: 'misc', url: 'https://news.livedoor.com/topics/rss/entertain.xml' },
  { id: 'livedoor-anime', name: 'livedoor アニメ', section: 'anime', url: 'https://news.livedoor.com/topics/rss/anime.xml' },
  { id: 'livedoor-game', name: 'livedoor ゲーム', section: 'game', url: 'https://news.livedoor.com/topics/rss/game.xml' },
  { id: 'biglobe-ent', name: 'BIGLOBE エンタメ', section: 'misc', url: 'https://news.biglobe.ne.jp/rss/entertainment.xml' },

  // 漫画
  { id: 'alu-rss', name: 'Alu(/rss/)', section: 'manga', url: 'https://alu.jp/rss/' },
  { id: 'alu-feed', name: 'Alu(/feed)', section: 'manga', url: 'https://alu.jp/feed' },
  { id: 'hexieshe', name: '和邪社', section: 'manga', url: 'https://www.hexieshe.com/feed' },
  { id: 'ddnavi3', name: 'ダ・ヴィンチWeb(/feed/)', section: 'manga', url: 'https://ddnavi.com/feed' },
  { id: 'natalie-http', name: 'コミックナタリー(http)', section: 'manga', url: 'http://natalie.mu/comic/feed/news' },

  // 动画
  { id: 'animehack2', name: 'アニメハック(45s)', section: 'anime', url: 'https://anime.eiga.com/news/feed/', timeout: 45000 },
  { id: 'animatetimes5', name: 'アニメイトタイムズ(news.xml)', section: 'anime', url: 'https://www.animatetimes.com/rss/news.xml' },

  // 电影
  { id: 'cinematoday5', name: 'シネマトゥデイ(/rss/news.xml)', section: 'movie', url: 'https://www.cinematoday.jp/rss/news.xml' },
  { id: 'spice2', name: 'SPICE(/rss)', section: 'movie', url: 'https://spice.eplus.jp/rss' },

  // 音乐
  { id: 'billboard-jp2', name: 'Billboard JAPAN(/rss/)', section: 'music', url: 'https://www.billboard-japan.com/rss/' },
  { id: 'natalie-music-http', name: '音楽ナタリー(http)', section: 'music', url: 'http://natalie.mu/music/feed/news' },
  { id: 'okmusic', name: 'OKMusic', section: 'music', url: 'https://okmusic.jp/feed' },
];
