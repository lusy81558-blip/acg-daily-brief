// 第三批候选源：重点补漫画，其次补电影/音乐/动画，并复测疑似"慢"的站点
export const CANDIDATES = [
  // ---------- 动漫综合（可切分板块） ----------
  { id: 'gigazine', name: 'GIGAZINE', section: 'misc', url: 'https://gigazine.net/news/rss_2.0/' },
  { id: 'nlab', name: 'ねとらぼ', section: 'misc', url: 'https://nlab.itmedia.co.jp/nl/rss/index.xml' },
  { id: 'akiba-souken', name: 'アキバ総研', section: 'misc', url: 'https://akiba-souken.com/rss/' },
  { id: 'getnews', name: 'ガジェット通信', section: 'misc', url: 'https://getnews.jp/feed' },

  // ---------- 漫画重点 ----------
  { id: 'magmix', name: 'マグミクス', section: 'manga', url: 'https://magmix.jp/feed' },
  { id: 'manba', name: 'マンバ', section: 'manga', url: 'https://manba.co.jp/rss' },
  { id: 'konomanga', name: 'このマンガがすごい！', section: 'manga', url: 'https://konomanga.jp/feed' },
  { id: 'ddnavi2', name: 'ダ・ヴィンチWeb(/rss)', section: 'manga', url: 'https://ddnavi.com/rss' },
  { id: 'comicspace', name: 'コミックシーモア', section: 'manga', url: 'https://www.cmoa.jp/rss/' },
  { id: 'shonenmagazine', name: 'マガジンポケット', section: 'manga', url: 'https://pocket.shonenmagazine.com/rss' },
  { id: 'natalie-comic-rsshub', name: 'RSSHub コミックナタリー', section: 'manga', url: 'https://rsshub.app/natalie/comic' },

  // ---------- 电影补充 ----------
  { id: 'bangernote', name: 'BANGER!!!', section: 'movie', url: 'https://bangernote.com/feed' },
  { id: 'cinemacafe', name: 'シネマカフェ', section: 'movie', url: 'https://www.cinemacafe.net/rss/index.xml' },
  { id: 'moviecollection', name: 'MOVIE Collection', section: 'movie', url: 'https://www.moviecollection.jp/rss/' },
  { id: 'spice', name: 'SPICE', section: 'movie', url: 'https://spice.eplus.jp/feed' },
  { id: 'natalie-eiga-rsshub', name: 'RSSHub 映画ナタリー', section: 'movie', url: 'https://rsshub.app/natalie/eiga' },
  { id: 'screenrant2', name: 'ScreenRant(retry)', section: 'movie', url: 'https://screenrant.com/feed/', timeout: 40000 },

  // ---------- 音乐补充 ----------
  { id: 'm-on', name: 'M-ON! MUSIC', section: 'music', url: 'https://www.m-on-music.jp/feed' },
  { id: 'rockinon', name: 'rockinon.com', section: 'music', url: 'https://rockinon.com/news/rss' },
  { id: 'barks2', name: 'BARKS(news.xml)', section: 'music', url: 'https://www.barks.jp/rss/news.xml' },
  { id: 'natalie-music-rsshub', name: 'RSSHub 音楽ナタリー', section: 'music', url: 'https://rsshub.app/natalie/music' },
  { id: 'utamap', name: 'うたまっぷ', section: 'music', url: 'https://www.utamap.com/rss/' },

  // ---------- 动画补充 ----------
  { id: 'animageplus', name: 'アニメージュプラス', section: 'anime', url: 'https://animageplus.jp/feed' },
  { id: 'webnewtype2', name: 'WebNewtype(/rss/)', section: 'anime', url: 'https://webnewtype.com/rss/' },
  { id: 'mantan2', name: 'MANTANWEB(/feed)', section: 'anime', url: 'https://mantan-web.jp/feed' },
  { id: 'animatetimes3', name: 'アニメイトタイムズ(默认头)', section: 'anime', url: 'https://www.animatetimes.com/rss/index.xml', rawAccept: true, timeout: 25000 },
  { id: 'ann-rsshub', name: 'RSSHub ANN', section: 'anime', url: 'https://rsshub.app/announce' },

  // ---------- 复测"超时"型（区分慢 vs 被墙） ----------
  { id: 'oricon3', name: 'ORICON(60s)', section: 'music', url: 'https://www.oricon.co.jp/rss/news.xml', timeout: 60000 },
  { id: 'eiga3', name: '映画.com(60s)', section: 'movie', url: 'https://eiga.com/rss/', timeout: 60000 },
  { id: 'google-news-test', name: 'Google News 连通性', section: 'test', url: 'https://news.google.com/rss', timeout: 25000 },
  { id: 'hatena-test', name: 'Hatena 连通性', section: 'test', url: 'https://b.hatena.ne.jp/hotentry.rss', timeout: 25000 },
];
