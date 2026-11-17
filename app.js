(function () {
  'use strict';

  var D = window.BGM_DATA;
  if (!D) return;

  var DIMS = D.dimensions;
  var QUESTIONS = D.questions;
  var RESULTS = D.results;
  var BY_ID = {};
  RESULTS.forEach(function (r) { BY_ID[r.id] = r; });

  var TOTAL = QUESTIONS.length;
  var DEFAULT_TITLE = document.title;
  var state = {
    idx: 0,
    answers: new Array(TOTAL).fill(null),
    locked: false,
    result: null,
    profile: null,
    match: null,
  };

  var screens = {
    cover: document.getElementById('cover'),
    quiz: document.getElementById('quiz'),
    result: document.getElementById('result'),
    egg: document.getElementById('egg')
  };

  var EGG = [
    'Hi，你好啊！没想到真的有人能发现这个彩蛋！我是作者：开心的凡士林。首先很感谢你可以耐心完成这次测评，讲实话，我一开始自己测试的时候都有点没耐心做下去，所以你真的很棒。',
    '其实原本计划做一个关于记录自己听歌历程和纪念一些自己日常生活中值得纪念日子的小网站。因为我还是觉得人生中某些时刻真的可以通过一首歌来做一个小小的总结。但是做着做着感觉自己一个人闷闷的去弄一些东西太无聊了，反而越来越想让有相同感觉的人可以通过这种方式静下心来，好好的去回忆一些自己过去或是现在一些值得纪念的瞬间吧。也有可能是我太中二了，有一点点中二病吧哈哈哈哈哈哈哈哈。',
    '怎么说呢，我也不知道我现在写这些干啥，会不会有人看到，真的有种莫名其妙啊，自己在这碎碎念。脑子里幻想着看到这些话的那个人是什么摸样（也想不出来）。但唯一现在可以确定的是，你真的是一个很细节很温柔的人，可能看到这段话的时候你是因为无聊，也可能是因为心情不是很好。因为这么多废话，真能有时间看完也只有这两种选项了吧。',
    '我希望看到这些话的人不管说是以后或者现在遇到了一些什么困难也好，不如意也好，都可以给自己一点时间，给自己一个缓冲的时间，慢慢来，慢慢的去做，不要被一些外界的一些不好的话或者仅仅是因为一个眼神就想放弃，觉得会不会被别人笑话啊，会不会不够漂亮啊之类的。不要这样想，我们每一位在这个世界上都是独一无二的存在，不是吗？我们都是活在属于自己时间段上的一个个鲜活的小太阳，总会发光的，总会照亮他人的，总会带来温暖的，大家都是很棒很棒的人，一定要珍惜，珍惜身边的朋友，珍惜身边的事，珍惜身边的一切，时间过去了就是真的过去了，不要被时间推的太远。',
    '不要过段时间之后回想以前：我那个时候怎么什么都没做，怎么我的人生这么平淡。什么都没做，也是做了。因为什么都没做，也会成为现在的自己。你过去的每一个选择，每一步走的路，都让你成为了现在独一无二的你，是吧哈哈哈哈哈哈哈。所以大胆去做，去选吧！大家的人生都才刚刚开始！去完成自己想做的事，去见自己想见的人，在这有限的生命里，去做自己！',
    '很感谢你能够看到这里，虽然我不知道你是谁，也有可能是几年后的我自己（开玩笑）。谢谢你愿意将你人生中的几分钟分享给我（真的，作者想到这一点的时候都有点小感动了）。我们一起加油，一切都才刚刚开始。',
    '对了，我在写这段话的时候耳机里播放的是《太聪明》。还有还有，这些测评后歌曲旁边的小文案什么的都是我自己想出来的，所以有些口语化或者不够有文化之类的一定要在心里偷偷骂我就好，千万不要疯狂的攻击我啊哈哈哈哈哈哈哈哈哈哈哈。'
  ];

  var el = {
    prevBtn: document.getElementById('prevBtn'),
    progText: document.getElementById('progText'),
    barFill: document.getElementById('barFill'),
    qLabel: document.getElementById('qLabel'),
    qTitle: document.getElementById('qTitle'),
    opts: document.getElementById('opts'),
    resName: document.getElementById('resName'),
    resTitle: document.getElementById('resTitle'),
    resQuote: document.getElementById('resQuote'),
    resDesc: document.getElementById('resDesc'),
    chart: document.getElementById('chart'),
    resTags: document.getElementById('resTags'),
    matchLine: document.getElementById('matchLine'),
    cueLine: document.getElementById('cueLine'),
    listenLink: document.getElementById('listenLink'),
    resCount: document.getElementById('resCount'),
    eggLetter: document.getElementById('eggLetter'),
    toast: document.getElementById('toast')
  };

  var toastTimer = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function show(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle('active', key === name);
    });
  }

  function setHash(value) {
    var base = location.pathname + location.search;
    try {
      history.replaceState(null, '', value ? base + '#' + value : base);
    } catch (error) {
      /* file:// 等环境可能不允许改写 history，不影响结果展示 */
    }
  }

  function toast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.classList.add('show');
    toastTimer = setTimeout(function () { el.toast.classList.remove('show'); }, 2400);
  }

  function computeProfile(answers) {
    var raw = new Array(6).fill(0);
    answers.forEach(function (choice, qi) {
      if (choice == null) return;
      var weights = QUESTIONS[qi].options[choice].w;
      for (var i = 0; i < 6; i++) raw[i] += weights[i];
    });
    return raw.map(function (value, i) {
      var norm = D.norm[i];
      return Math.round(clamp(50 + ((value - norm.mean) / norm.sd) * 18, 3, 97));
    });
  }

  function computeResult(answers) {
    var profile = computeProfile(answers);
    var ranked = RESULTS.map(function (result) {
      var dist = 0;
      for (var i = 0; i < 6; i++) {
        var delta = profile[i] - result.centroid[i];
        dist += delta * delta;
      }
      return { result: result, dist: dist };
    }).sort(function (a, b) { return a.dist - b.dist; });

    return {
      result: ranked[0].result,
      profile: profile,
      match: clamp(Math.round(99 - ranked[0].dist / 220), 86, 98)
    };
  }

  function encodeHash(result, profile, match) {
    var scores = profile.map(function (v) {
      return clamp(v, 0, 97).toString(36).padStart(2, '0');
    }).join('');
    return 'r=' + result.id + '.' + scores + '.' + clamp(match, 0, 99).toString(36);
  }

  function parseHash() {
    var hash = location.hash.replace(/^#/, '');
    if (!hash) return null;
    var match = hash.match(/^r=([a-z0-9_-]+)(?:\.([0-9a-z]{12})\.([0-9a-z]{1,2}))?$/i);
    if (!match) return null;
    var result = BY_ID[match[1]];
    if (!result) return null;

    var profile = result.centroid.slice();
    var score = 95;
    if (match[2]) {
      profile = [];
      for (var i = 0; i < 6; i++) {
        profile.push(clamp(parseInt(match[2].slice(i * 2, i * 2 + 2), 36) || 3, 3, 97));
      }
    }
    if (match[3]) score = clamp(parseInt(match[3], 36) || 95, 80, 98);
    return { result: result, profile: profile, match: score };
  }

  /* ---------- quiz ---------- */

  function start() {
    state.answers = new Array(TOTAL).fill(null);
    state.idx = 0;
    state.locked = false;
    state.result = null;
    state.profile = null;
    state.match = null;
    document.title = DEFAULT_TITLE;
    setHash('');
    renderQuestion();
    show('quiz');
  }

  function renderQuestion() {
    var q = QUESTIONS[state.idx];
    var answer = state.answers[state.idx];
    el.progText.textContent = (state.idx + 1) + ' / ' + TOTAL;
    el.barFill.style.width = ((state.idx + 1) / TOTAL * 100) + '%';
    el.prevBtn.classList.toggle('visible', state.idx > 0);
    el.qLabel.textContent = pad(state.idx + 1) + ' · ' + q.scene;
    el.qTitle.textContent = q.q;

    el.opts.innerHTML = '';
    q.options.forEach(function (option, i) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'opt' + (answer === i ? ' pick' : '');
      var dot = document.createElement('span');
      dot.className = 'dot';
      var text = document.createElement('span');
      text.textContent = option.t;
      button.appendChild(dot);
      button.appendChild(text);
      button.addEventListener('click', function () { pick(i); });
      el.opts.appendChild(button);
    });

    window.scrollTo(0, 0);
  }

  function pick(index) {
    if (state.locked) return;
    var q = QUESTIONS[state.idx];
    if (!q.options[index]) return;
    state.locked = true;
    state.answers[state.idx] = index;
    Array.prototype.forEach.call(el.opts.children, function (node, i) {
      node.classList.toggle('pick', i === index);
    });

    setTimeout(function () {
      if (state.idx >= TOTAL - 1) {
        finish();
      } else {
        state.idx += 1;
        state.locked = false;
        renderQuestion();
      }
    }, 290);
  }

  function prev() {
    if (state.locked || state.idx === 0) return;
    delete state.answers[state.idx];
    state.idx -= 1;
    delete state.answers[state.idx];
    renderQuestion();
  }

  function finish() {
    state.locked = true;
    var computed = computeResult(state.answers);
    state.result = computed.result;
    state.profile = computed.profile;
    state.match = computed.match;
    setHash(encodeHash(computed.result, computed.profile, computed.match));
    renderResult();
    show('result');
    document.title = '我的天选BGM是《' + computed.result.title + '》';
  }

  /* ---------- result ---------- */

  function renderResult() {
    var result = state.result;
    el.resName.textContent = result.title;
    el.resName.classList.toggle('is-long', result.title.length > 5);
    el.resTitle.textContent = '—— ' + result.persona;

    el.resQuote.innerHTML = '';
    result.copy.forEach(function (line, index) {
      var span = document.createElement('span');
      span.textContent = line;
      if (result.id === 'beiji' && index > 0) span.classList.add('is-dialogue');
      el.resQuote.appendChild(span);
    });

    el.resDesc.textContent = result.analysis;
    el.resTags.innerHTML = '';
    result.tags.forEach(function (tag) {
      var span = document.createElement('span');
      span.className = 'tag';
      span.textContent = tag;
      el.resTags.appendChild(span);
    });

    el.matchLine.innerHTML = 'BGM 契合度：<b>' + state.match + '%</b> · 与你的关系声场同频';
    el.cueLine.innerHTML = '这首歌替你唱的是：<b>' + result.cue + '</b>';
    el.resCount.textContent = '《' + result.title + '》已加入你的今日歌单';
    el.listenLink.href = 'https://y.qq.com/n/ryqq/search?w=' +
      encodeURIComponent(result.title + ' ' + result.artist);

    var labels = ['表达', '靠近', '浪漫', '主动', '向前', '柔软'];
    var glyphs = ['♪', '♫', '♩', '♪', '♫', '♩'];
    var notes = state.profile.map(function (value, i) {
      var bottom = 8 + clamp(value, 3, 97) * 0.84;
      return '<div class="note-slot"><span class="staff-note" style="bottom:' +
        bottom.toFixed(1) + '%">' + glyphs[i] + '</span></div>';
    }).join('');
    var noteLabels = state.profile.map(function (value, i) {
      return '<div class="note-label">' + labels[i] + '<span class="note-val">' + value + '</span></div>';
    }).join('');

    el.chart.innerHTML = '<div class="staff" role="img" aria-label="关系光谱：' +
      labels.map(function (label, i) { return label + state.profile[i]; }).join('，') +
      '"><div class="staff-notes">' + notes + '</div></div>' +
      '<div class="note-labels">' + noteLabels + '</div>';
  }

  /* ---------- share ---------- */

  function currentShareUrl() {
    var base = location.href.split('#')[0];
    if (!state.result) return base;
    return base + '#' + encodeHash(state.result, state.profile, state.match);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
      } catch (error) {
        reject(error);
      }
      area.remove();
    });
  }

  function share() {
    if (!state.result) return;
    var url = currentShareUrl();
    var payload = {
      title: '我的天选BGM是《' + state.result.title + '》',
      text: '测测你的天选BGM｜24 个瞬间，20 首华语情歌',
      url: url
    };
    if (navigator.share) {
      navigator.share(payload).catch(function () { /* 用户取消 */ });
      return;
    }
    copyText(url).then(function () {
      toast('链接已复制，去发给朋友吧');
      var btn = document.getElementById('shareBtn');
      btn.textContent = '已复制';
      setTimeout(function () { btn.textContent = '分享给朋友'; }, 1800);
    }).catch(function () {
      toast('复制失败，请从地址栏复制链接');
    });
  }

  /* ---------- easter egg ---------- */

  function openEgg() {
    el.eggLetter.innerHTML = EGG.map(function (paragraph, index) {
      return '<p' + (index === 0 ? ' class="lead"' : '') + '>' + paragraph + '</p>';
    }).join('') + '<div class="egg-sign">开心的凡士林</div>';
    screens.egg.scrollTop = 0;
    show('egg');
  }

  /* ---------- init ---------- */

  function init() {
    document.getElementById('startBtn').addEventListener('click', start);
    document.getElementById('againBtn').addEventListener('click', start);
    document.getElementById('shareBtn').addEventListener('click', share);
    document.getElementById('eggBtn').addEventListener('click', openEgg);
    document.getElementById('eggBack').addEventListener('click', function () {
      show('result');
    });
    el.prevBtn.addEventListener('click', prev);

    document.addEventListener('keydown', function (event) {
      if (!screens.quiz.classList.contains('active')) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prev();
        return;
      }
      if (state.locked) return;
      var map = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
      var index = map[event.key.toLowerCase()];
      if (index != null) {
        event.preventDefault();
        pick(index);
      }
    });

    window.addEventListener('hashchange', function () {
      var payload = parseHash();
      if (payload) {
        state.result = payload.result;
        state.profile = payload.profile;
        state.match = payload.match;
        renderResult();
        show('result');
      }
    });

    var initial = parseHash();
    if (initial) {
      state.result = initial.result;
      state.profile = initial.profile;
      state.match = initial.match;
      renderResult();
      show('result');
      document.title = '我的天选BGM是《' + initial.result.title + '》';
    } else {
      show('cover');
    }
  }

  window.__BGM_CATI__ = {
    computeProfile: computeProfile,
    computeResult: computeResult,
    parseHash: parseHash,
    encodeHash: encodeHash
  };

  init();
})();
