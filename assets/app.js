/* 早报前端渲染：读取 data/brief.js 注入的 window.BRIEF_DATA */
(function () {
  'use strict';

  var DATA = null;
  var board = document.getElementById('board');
  var dateBar = document.getElementById('dateBar');
  var dateLabel = document.getElementById('dateLabel');
  var timeLabel = document.getElementById('timeLabel');
  var footerStats = document.getElementById('footerStats');
  var current = null;

  var WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function parseDate(str) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  function formatDay(str) {
    var d = parseDate(str);
    if (!d) return str;
    return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · ' + WEEK[d.getDay()];
  }

  function shortDay(str) {
    var d = parseDate(str);
    return d ? (d.getMonth() + 1) + '/' + d.getDate() : str;
  }

  function relativeTime(iso) {
    var t = new Date(iso).getTime();
    if (!isFinite(t)) return '';
    var diff = Date.now() - t;
    if (diff < 60000) return '刚刚';
    var min = Math.floor(diff / 60000);
    if (min < 60) return min + ' 分钟前';
    var h = Math.floor(min / 60);
    if (h < 24) return h + ' 小时前';
    var d = Math.floor(h / 24);
    if (d === 1) return '昨天';
    if (d < 30) return d + ' 天前';
    return '';
  }

  function clockTime(iso) {
    var d = new Date(iso);
    return isNaN(d.getTime()) ? '' : pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function metaRow(item) {
    var meta = el('div', 'item-meta');
    if (item.kind === 'release') meta.appendChild(el('span', 'tag', '更新'));
    meta.appendChild(el('span', 'src', item.source));
    var clock = clockTime(item.date);
    if (clock) {
      meta.appendChild(el('span', 'sep', '·'));
      meta.appendChild(el('span', null, clock));
    }
    var rel = relativeTime(item.date);
    if (rel) {
      meta.appendChild(el('span', 'sep', '·'));
      meta.appendChild(el('span', null, rel));
    }
    return meta;
  }

  function renderHero(item, index, image, en) {
    var a = el('a', 'hero');
    a.href = item.link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.dataset.en = en || '';

    if (image) {
      var media = el('div', 'hero-media');
      var img = document.createElement('img');
      img.alt = '';
      img.loading = 'eager';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('load', function () { img.classList.add('is-loaded'); });
      img.addEventListener('error', function () { media.remove(); });
      img.src = image;
      media.appendChild(img);
      media.appendChild(el('div', 'hero-veil'));
      a.appendChild(media);
    } else {
      a.classList.add('no-media');
    }

    var body = el('div', 'hero-body');
    body.appendChild(el('span', 'rank', pad(index + 1)));
    body.appendChild(el('h3', 'hero-title', item.title));
    body.appendChild(metaRow(item));
    a.appendChild(body);
    return a;
  }

  function renderItem(item, index) {
    var li = el('li', 'item');
    var a = el('a');
    a.href = item.link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.appendChild(el('span', 'rank', pad(index + 1)));

    var body = el('div', 'item-body');
    body.appendChild(el('div', 'item-title', item.title));
    body.appendChild(metaRow(item));
    a.appendChild(body);
    li.appendChild(a);
    return li;
  }

  function renderQuote(sec) {
    var q = el('div', 'quote');
    q.appendChild(el('div', 'quote-mark', '\u201C'));
    q.appendChild(el('p', 'quote-text', sec.quote.text));
    var from = el('div', 'quote-from');
    var who = sec.quote.author && sec.quote.author !== '\u2014' ? sec.quote.author : '';
    var work = sec.quote.work ? '\u300C' + sec.quote.work + '\u300D' : '';
    if (who) from.appendChild(el('span', null, who));
    if (work) {
      if (who) from.appendChild(el('span', null, ' / '));
      from.appendChild(el('span', 'work', work));
    }
    q.appendChild(from);
    q.appendChild(el('div', 'quiet-note', '今天这个板块无事发生，送你一句。'));
    return q;
  }

  /** 角色生日彩蛋 */
  function renderBirthday(list) {
    if (!list || !list.length) return null;
    var main = list[0];
    var box = el('div', 'birthday');

    box.appendChild(el('span', 'bd-cake', '\uD83C\uDF82'));

    var body = el('div', 'bd-body');
    var line = el('div', 'bd-line');
    line.appendChild(document.createTextNode('今天是 '));
    line.appendChild(el('strong', 'bd-name', main.name));
    if (main.work) line.appendChild(el('span', 'bd-work', '（' + main.work + '）'));
    line.appendChild(document.createTextNode(' 的生日'));
    body.appendChild(line);

    if (list.length > 1) {
      var others = list.slice(1).map(function (b) {
        return b.name + (b.work ? '（' + b.work + '）' : '');
      }).join('、');
      body.appendChild(el('div', 'bd-others', '还有 ' + others));
    }

    body.appendChild(el('div', 'bd-wish', '生日快乐！'));
    box.appendChild(body);
    return box;
  }

  function renderSection(sec, index) {
    var section = el('section', 'section');
    section.dataset.key = sec.key;
    section.style.animationDelay = index * 55 + 'ms';

    var head = el('header', 'section-head');
    head.appendChild(el('span', 'dot'));
    head.appendChild(el('h2', null, sec.label));
    head.appendChild(el('span', 'en', sec.en || ''));
    head.appendChild(el('span', 'count', sec.items && sec.items.length ? sec.items.length + ' 条' : '名句'));
    section.appendChild(head);

    var items = sec.items || [];
    if (items.length) {
      var heroImage = items[0].image || sec.image || '';
      section.appendChild(renderHero(items[0], 0, heroImage, sec.en));

      if (items.length > 1) {
        var ul = el('ul', 'items');
        items.slice(1).forEach(function (item, i) { ul.appendChild(renderItem(item, i + 1)); });
        section.appendChild(ul);
      }
    } else if (sec.quote) {
      section.appendChild(renderQuote(sec));
    } else {
      section.appendChild(el('p', 'loading', '暂无内容'));
    }
    return section;
  }

  /* ============ 每日一句（按日期决定，同一天刷新不变） ============ */

  function hashInt(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }

  function normQuote(s) {
    return String(s || '').replace(/[\s「」『』“”"'’‘·。，、！？!?.,]/g, '');
  }

  /** 今天的每日一句：随机挑一句，且不与"板块无新闻时的占位名句"重复 */
  function pickDailyQuote(dateKey, day) {
    var pool = DATA.dailyQuotes || [];
    if (!pool.length) return null;

    var blocked = {};
    (day.sections || []).forEach(function (sec) {
      if (sec.quote && sec.quote.text) blocked[normQuote(sec.quote.text)] = 1;
    });

    // 近 7 天用过的句子也避开，连着几天看到同一句会很无聊
    var at = DATA.dates ? DATA.dates.indexOf(dateKey) : -1;
    for (var k = 1; k <= 7 && at - k >= 0; k++) {
      var prevKey = DATA.dates[at - k];
      var pick = pool[hashInt('daily:' + prevKey) % pool.length];
      if (pick) blocked[normQuote(pick.text)] = 1;
    }

    var start = hashInt('daily:' + dateKey) % pool.length;
    for (var i = 0; i < pool.length; i++) {
      var cand = pool[(start + i) % pool.length];
      if (!blocked[normQuote(cand.text)]) return cand;
    }
    return pool[start];
  }

  function renderDailyQuote(day, dateKey, index) {
    var q = pickDailyQuote(dateKey, day);
    if (!q) return null;

    var card = el('aside', 'quote-card');
    card.style.animationDelay = (index * 55 + 60) + 'ms';
    card.appendChild(el('span', 'quote-card-mark', '\u201C'));
    card.appendChild(el('p', 'quote-card-text', q.text));

    var who = q.author && q.author !== '\u2014' ? q.author : '';
    var work = q.work && q.work !== '\u2014' ? '\u300C' + q.work + '\u300D' : '';
    if (who || work) {
      var from = el('div', 'quote-card-from');
      if (who) from.appendChild(el('span', null, who));
      if (work) {
        if (who) from.appendChild(el('span', null, ' / '));
        from.appendChild(el('span', 'work', work));
      }
      card.appendChild(from);
    }
    return card;
  }

  /* ============ 历史上的今天（ACG 限定） ============ */

  var KIND_LABEL = { game: '游戏', anime: '动画', movie: '剧场版', manga: '漫画' };
  var KIND_ACTION = { game: '发售', anime: '开播', movie: '上映', manga: '开始连载' };

  function renderHistory(items, index) {
    var section = el('section', 'section');
    section.dataset.key = 'history';
    section.style.animationDelay = (index * 55 + 60) + 'ms';

    var head = el('header', 'section-head');
    head.appendChild(el('span', 'dot'));
    head.appendChild(el('h2', null, '历史上的今天'));
    head.appendChild(el('span', 'en', 'ON THIS DAY · ACG'));
    head.appendChild(el('span', 'count', items.length + ' 件'));
    section.appendChild(head);

    var ul = el('ul', 'hist-items');
    items.forEach(function (it) {
      var li = el('li', 'hist-item');
      li.appendChild(el('span', 'hist-year', String(it.year)));
      li.appendChild(el('span', 'hist-kind', KIND_LABEL[it.kind] || 'ACG'));
      li.appendChild(el('span', 'hist-text', '\u300A' + it.title + '\u300B' + (KIND_ACTION[it.kind] || '')));
      ul.appendChild(li);
    });
    section.appendChild(ul);
    return section;
  }

  function renderDate(dateKey) {
    var day = DATA.days[dateKey];
    if (!day) return;
    current = dateKey;

    dateLabel.textContent = formatDay(day.date);
    timeLabel.textContent = day.generatedAt
      ? '生成于 ' + clockTime(day.generatedAt) +
        (day.stats ? ' · ' + day.stats.sourcesOk + '/' + day.stats.sources + ' 个源可用' : '')
      : '';

    board.innerHTML = '';
    var bd = renderBirthday(day.birthdays);
    if (bd) board.appendChild(bd);
    day.sections.forEach(function (sec, i) { board.appendChild(renderSection(sec, i)); });

    var history = (DATA.historyIndex || {})[dateKey];
    if (history && history.length) board.appendChild(renderHistory(history, day.sections.length));

    var quoteCard = renderDailyQuote(day, dateKey, day.sections.length + 1);
    if (quoteCard) board.appendChild(quoteCard);

    if (day.stats) {
      footerStats.textContent =
        '共抓取 ' + day.stats.fetched + ' 条，命中 ' + day.stats.accepted + ' 条，过滤 ' + day.stats.filtered + ' 条';
    }

    Array.prototype.forEach.call(dateBar.children, function (chip) {
      chip.setAttribute('aria-current', chip.dataset.date === dateKey ? 'true' : 'false');
    });

    try { history.replaceState(null, '', '#' + dateKey); } catch (e) { /* ignore */ }
  }

  function renderDateBar() {
    dateBar.innerHTML = '';
    DATA.dates.slice().reverse().forEach(function (d) {
      var chip = el('button', 'chip');
      chip.type = 'button';
      chip.dataset.date = d;
      chip.appendChild(document.createTextNode(shortDay(d)));
      var dd = parseDate(d) || new Date();
      chip.appendChild(el('span', 'chip-sub', d === DATA.today ? '今天' : WEEK[dd.getDay()]));
      chip.addEventListener('click', function () { renderDate(d); });
      dateBar.appendChild(chip);
    });
  }

  function boot(data) {
    DATA = data;
    if (!DATA || !DATA.days || !DATA.dates || !DATA.dates.length) {
      board.innerHTML = '';
      var err = el('p', 'error');
      err.innerHTML = '还没有早报数据。双击项目根目录的 <code>更新早报.cmd</code> 生成今天的早报，然后刷新本页。';
      board.appendChild(err);
      dateLabel.textContent = '暂无数据';
      return;
    }
    renderDateBar();
    var hash = (location.hash || '').replace('#', '');
    renderDate(DATA.days[hash] ? hash : DATA.today);
  }

  /** 本地打开和云端访问，提示语不一样 */
  function setFooterHint() {
    var hint = document.getElementById('footerHint');
    if (!hint) return;
    var m = /^([^.]+)\.github\.io$/.exec(location.hostname);
    if (!m) return;
    var repo = location.pathname.split('/').filter(Boolean)[0] || '';
    hint.innerHTML = '';
    hint.appendChild(document.createTextNode('← → 切换日期 · 每天 07:00 自动更新'));
    if (repo) {
      hint.appendChild(document.createTextNode(' · '));
      var a = el('a', null, '手动触发更新');
      a.href = 'https://github.com/' + m[1] + '/' + repo + '/actions';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      hint.appendChild(a);
    }
  }

  document.addEventListener('keydown', function (e) {
    if (!DATA || !DATA.dates || !current) return;
    var idx = DATA.dates.indexOf(current);
    if (idx < 0) return;
    if (e.key === 'ArrowLeft' && idx < DATA.dates.length - 1) renderDate(DATA.dates[idx + 1]);
    if (e.key === 'ArrowRight' && idx > 0) renderDate(DATA.dates[idx - 1]);
  });

  async function init() {
    var data = window.BRIEF_DATA;
    // 走 http(s) 时用 fetch 取 JSON 并禁用缓存，避免看到上一版数据；
    // file:// 下 fetch 不可用，直接用 <script> 注入的兜底数据。
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      try {
        var res = await fetch('data/brief.json?t=' + Date.now(), { cache: 'no-store' });
        if (res.ok) data = await res.json();
      } catch (e) {
        /* 保留 brief.js 的数据 */
      }
    }
    boot(data);
    setFooterHint();
  }

  init();
})();
