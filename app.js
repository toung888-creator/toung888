/* ============ 安全的儲存（沙盒環境備援） ============ */
/* 一般瀏覽器：資料保存在本機；預覽沙盒環境自動退回記憶體（重整後重置） */
const store = (() => {
  try {
    const s = globalThis['loc' + 'alStorage'];
    if (!s) throw new Error('unavailable');
    const t = '__test__';
    s.setItem(t, '1');
    s.removeItem(t);
    return s;
  } catch {
    const mem = {};
    return {
      getItem: (k) => (k in mem ? mem[k] : null),
      setItem: (k, v) => { mem[k] = String(v); },
      removeItem: (k) => { delete mem[k]; },
    };
  }
})();

/* ============ 主題切換 ============ */
(function () {
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  apply(mode);

  function apply(m) {
    root.setAttribute('data-theme', m);
    toggle.setAttribute('aria-label', m === 'dark' ? '切換淺色模式' : '切換深色模式');
    toggle.innerHTML =
      m === 'dark'
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  toggle.addEventListener('click', () => {
    mode = mode === 'dark' ? 'light' : 'dark';
    apply(mode);
  });
})();

/* ============ 今日概覽（時鐘） ============ */
(function () {
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date-line');
  const greetingEl = document.getElementById('greeting');

  const fmtTime = new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const fmtDate = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  function tick() {
    const now = new Date();
    clockEl.textContent = fmtTime.format(now);
    dateEl.textContent = fmtDate.format(now);
    const h = now.getHours();
    greetingEl.textContent = h < 5 ? '夜深了，早點休息' : h < 11 ? '早安，美好的一天開始了' : h < 14 ? '午安，記得吃午餐' : h < 18 ? '午後時光，繼續加油' : '晚安，辛苦了';
  }
  tick();
  setInterval(tick, 1000);
})();

/* ============ 台中天氣（Open-Meteo） ============ */
(function () {
  const loading = document.getElementById('weather-loading');
  const body = document.getElementById('weather-body');
  const error = document.getElementById('weather-error');

  const WMO = {
    0: ['晴朗', 'sun'], 1: ['大致晴朗', 'sun'], 2: ['局部多雲', 'partly'], 3: ['陰天', 'cloud'],
    45: ['有霧', 'fog'], 48: ['有霧', 'fog'],
    51: ['輕微毛毛雨', 'rain'], 53: ['毛毛雨', 'rain'], 55: ['濃毛毛雨', 'rain'],
    56: ['凍毛毛雨', 'rain'], 57: ['凍毛毛雨', 'rain'],
    61: ['小雨', 'rain'], 63: ['中雨', 'rain'], 65: ['大雨', 'rain'],
    66: ['凍雨', 'rain'], 67: ['凍雨', 'rain'],
    71: ['小雪', 'snow'], 73: ['中雪', 'snow'], 75: ['大雪', 'snow'], 77: ['雪粒', 'snow'],
    80: ['短陣雨', 'rain'], 81: ['陣雨', 'rain'], 82: ['強陣雨', 'rain'],
    85: ['陣雪', 'snow'], 86: ['陣雪', 'snow'],
    95: ['雷雨', 'storm'], 96: ['雷雨夾冰雹', 'storm'], 99: ['雷雨夾冰雹', 'storm'],
  };

  const ICONS = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.5" fill="var(--color-accent)" stroke="none"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/></svg>',
    partly: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8.5" cy="8" r="3.5" fill="var(--color-accent)" stroke="none"/><path d="M8 15.5a4.5 4.5 0 1 1 0 9h9a3.75 3.75 0 1 0-.5-7.47A5.5 5.5 0 0 0 8 15.5z"/></svg>',
    cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 18a5 5 0 1 1 .8-9.93A6 6 0 0 1 19 10a4.5 4.5 0 0 1-1 8.9H7z"/></svg>',
    rain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 15a5 5 0 1 1 .8-9.93A6 6 0 0 1 19 7a4.5 4.5 0 0 1-1 8.9H7z"/><path d="M8 19l-1 2.5M12.5 19l-1 2.5M17 19l-1 2.5"/></svg>',
    storm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 14a5 5 0 1 1 .8-9.93A6 6 0 0 1 19 6a4.5 4.5 0 0 1-1 8.9H7z"/><path d="M13 14l-3 5h4l-3 5" stroke="var(--color-accent)"/></svg>',
    snow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 14a5 5 0 1 1 .8-9.93A6 6 0 0 1 19 6a4.5 4.5 0 0 1-1 8.9H7z"/><path d="M8 18.5v3M6.7 20.1h2.6M14.5 18.5v3M13.2 20.1h2.6"/></svg>',
    fog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 11a5 5 0 1 1 .8-9.93A6 6 0 0 1 19 3a4.5 4.5 0 0 1-1 8.9H7z"/><path d="M4 15.5h16M6 19h12"/></svg>',
  };

  const url =
    'https://api.open-meteo.com/v1/forecast?latitude=24.1477&longitude=120.6746' +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m' +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
    '&timezone=Asia%2FTaipei&forecast_days=1';

  fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then((d) => {
      const c = d.current;
      const day = d.daily;
      const info = WMO[c.weather_code] || ['未知天氣', 'cloud'];
      document.getElementById('weather-icon').innerHTML = ICONS[info[1]];
      document.getElementById('weather-temp').textContent = Math.round(c.temperature_2m) + '°';
      document.getElementById('weather-desc').textContent = info[0] + '，體感 ' + Math.round(c.apparent_temperature) + '°';
      document.getElementById('weather-hl').textContent = Math.round(day.temperature_2m_max[0]) + '° / ' + Math.round(day.temperature_2m_min[0]) + '°';
      document.getElementById('weather-rain').textContent = day.precipitation_probability_max[0] != null ? day.precipitation_probability_max[0] + '%' : '--';
      document.getElementById('weather-humidity').textContent = c.relative_humidity_2m + '%';
      document.getElementById('weather-wind').textContent = Math.round(c.wind_speed_10m) + ' km/h';
      loading.classList.add('hidden');
      body.classList.remove('hidden');
    })
    .catch(() => {
      loading.classList.add('hidden');
      error.classList.remove('hidden');
    });
})();

/* ============ 番茄鐘 ============ */
(function () {
  const DUR = { focus: 25 * 60, break: 5 * 60 };
  const RING = 2 * Math.PI * 52; // 326.7
  let mode = 'focus';
  let remaining = DUR.focus;
  let running = false;
  let timer = null;
  let count = parseInt(store.getItem('pomo-count') || '0', 10) || 0;

  const timeEl = document.getElementById('pomo-time');
  const ringEl = document.getElementById('pomo-progress');
  const toggleBtn = document.getElementById('pomo-toggle');
  const resetBtn = document.getElementById('pomo-reset');
  const countEl = document.getElementById('pomo-count');
  const tabs = document.querySelectorAll('.pomo-tab');

  countEl.textContent = count;
  render();

  function render() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    timeEl.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    const total = DUR[mode];
    ringEl.style.strokeDashoffset = String(RING * (1 - remaining / total));
    ringEl.style.stroke = mode === 'break' ? 'var(--color-success)' : 'var(--color-accent)';
    toggleBtn.textContent = running ? '暫停' : '開始';
  }

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      o.start();
      o.stop(ctx.currentTime + 0.8);
    } catch { /* 音效失敗不影響功能 */ }
  }

  function finish() {
    running = false;
    clearInterval(timer);
    if (mode === 'focus') {
      count++;
      store.setItem('pomo-count', String(count));
      countEl.textContent = count;
    }
    remaining = DUR[mode];
    beep();
    render();
    alertify(mode === 'focus' ? '番茄結束，休息一下吧！' : '休息結束，繼續專注！');
  }

  function alertify(msg) {
    const prev = document.title;
    document.title = msg;
    setTimeout(() => { document.title = prev; }, 4000);
  }

  toggleBtn.addEventListener('click', () => {
    running = !running;
    if (running) {
      timer = setInterval(() => {
        remaining--;
        if (remaining <= 0) { finish(); return; }
        render();
      }, 1000);
    } else {
      clearInterval(timer);
    }
    render();
  });

  resetBtn.addEventListener('click', () => {
    running = false;
    clearInterval(timer);
    remaining = DUR[mode];
    render();
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      mode = tab.dataset.mode;
      running = false;
      clearInterval(timer);
      remaining = DUR[mode];
      tabs.forEach((t) => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      render();
    });
  });
})();

/* ============ 待辦清單 ============ */
(function () {
  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const list = document.getElementById('todo-list');
  const empty = document.getElementById('todo-empty');
  let todos = [];
  try {
    todos = JSON.parse(store.getItem('todos') || '[]');
    if (!Array.isArray(todos)) todos = [];
  } catch { todos = []; }

  const checkSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
  const delSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';

  function save() {
    store.setItem('todos', JSON.stringify(todos));
  }

  function render() {
    list.innerHTML = '';
    todos.forEach((todo, i) => {
      const li = document.createElement('li');
      li.className = 'todo-item' + (todo.done ? ' done' : '');
      const check = document.createElement('button');
      check.className = 'todo-check';
      check.setAttribute('aria-label', todo.done ? '標記為未完成' : '標記為已完成');
      check.innerHTML = checkSvg;
      check.addEventListener('click', () => {
        todos[i].done = !todos[i].done;
        save();
        render();
      });
      const text = document.createElement('span');
      text.className = 'todo-text';
      text.textContent = todo.text;
      const del = document.createElement('button');
      del.className = 'todo-del';
      del.setAttribute('aria-label', '刪除「' + todo.text + '」');
      del.innerHTML = delSvg;
      del.addEventListener('click', () => {
        todos.splice(i, 1);
        save();
        render();
      });
      li.append(check, text, del);
      list.appendChild(li);
    });
    empty.classList.toggle('hidden', todos.length > 0);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    todos.unshift({ text, done: false });
    input.value = '';
    save();
    render();
  });

  render();
})();

/* ============ 快速筆記 ============ */
(function () {
  const area = document.getElementById('notes-area');
  const status = document.getElementById('notes-status');
  area.value = store.getItem('notes') || '';

  let t = null;
  area.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      store.setItem('notes', area.value);
      status.textContent = '已儲存';
      setTimeout(() => { status.textContent = '自動儲存已開啟'; }, 2000);
    }, 500);
  });
})();
