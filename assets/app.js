/* 早报前端渲染：读取 data/brief.js 注入的 window.BRIEF_DATA */
(function () {
  'use strict';

  var DATA = window.BRIEF_DATA;
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

  function renderHero(item, index, image) {
    var a = el('a', 'hero');
    a.href = item.link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    if (image) {
      var media = el('div', 'hero-media');
      var img = document.createElement('img');
      img.src = image;
      img.alt = '';
      img.loading = 'eager';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', function () { media.remove(); });
      media.appendChild(img);
      media.appendChild(el('div', 'hero-veil'));
      a.appendChild(media);
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
      section.appendChild(renderHero(items[0], 0, heroImage));

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
    day.sections.forEach(function (sec, i) { board.appendChild(renderSection(sec, i)); });

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

  function boot() {
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

  document.addEventListener('keydown', function (e) {
    if (!DATA || !DATA.dates || !current) return;
    var idx = DATA.dates.indexOf(current);
    if (idx < 0) return;
    if (e.key === 'ArrowLeft' && idx < DATA.dates.length - 1) renderDate(DATA.dates[idx + 1]);
    if (e.key === 'ArrowRight' && idx > 0) renderDate(DATA.dates[idx - 1]);
  });

  boot();
})();
