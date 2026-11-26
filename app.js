'use strict';

/* ==================== УТИЛИТЫ ==================== */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const fmt = (n) => Math.round(n).toLocaleString('ru-RU');
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'i' + Math.random().toString(36).slice(2));

/* ==================== ДАННЫЕ ==================== */
const CATALOG = [
  { id: 'ak-redline',    name: 'AK-47 | Redline',        price: 120,  emoji: '🔫', c1: '#ff2d55', c2: '#5c0a1c' },
  { id: 'glock-fade',    name: 'Glock-18 | Fade',        price: 180,  emoji: '🔰', c1: '#34d399', c2: '#064e3b' },
  { id: 'usp-kill',      name: 'USP-S | Kill Confirmed', price: 210,  emoji: '💀', c1: '#94a3b8', c2: '#1e293b' },
  { id: 'awp-asiimov',   name: 'AWP | Asiimov',          price: 260,  emoji: '🎯', c1: '#ffb020', c2: '#5c3a00' },
  { id: 'deagle-blaze',  name: 'Desert Eagle | Blaze',   price: 340,  emoji: '🔥', c1: '#f97316', c2: '#5c1f05' },
  { id: 'm4-neon',       name: 'M4A4 | Neon Rider',      price: 420,  emoji: '💠', c1: '#22d3ee', c2: '#0e4b5c' },
  { id: 'knife-doppler', name: '★ Karambit | Doppler',   price: 900,  emoji: '🗡️', c1: '#a855f7', c2: '#3b0764' },
  { id: 'butterfly',     name: '★ Butterfly | Gamma',    price: 1200, emoji: '🦋', c1: '#2dd4bf', c2: '#0f3d3a' },
];

const MULTIPLIERS = [1.2, 1.5, 2, 3, 5, 10];
const EDGE = 0.95; // комиссия 5%
const USERS = [
  'xX_Sniper_Xx', 'Kaban4ik', 'drop_hunter', 'NoScope', 'Мария', 'v1ncent',
  'GG_WP', 'skinlord', 'Тимофей', 'zeus_king', 'm0nesy_fan', 'Толян',
  'lucky_panda', 'Alex_777', 'cheburek', 'NIGHTFALL',
];
const LS_KEY = 'upgrader_demo_v1';

/* ==================== СОСТОЯНИЕ ==================== */
const catalogById = (id) => CATALOG.find((c) => c.id === id);
const makeItem = (id) => ({ uid: uid(), id });

function defaultState() {
  return {
    balance: 1000,
    inventory: [makeItem('ak-redline'), makeItem('glock-fade'), makeItem('usp-kill')],
    xp: 0,
    level: 1,
    wagered: 0,
    won: 0,
    best: 0,
    history: [],
    sound: true,
    lastBonus: 0,
    mult: 2,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);
    const s = Object.assign(defaultState(), saved);
    if (!Array.isArray(s.inventory)) s.inventory = [];
    if (!Array.isArray(s.history)) s.history = [];
    if (!MULTIPLIERS.includes(s.mult)) s.mult = 2;
    return s;
  } catch (e) {
    return defaultState();
  }
}

let state = loadState();
let selected = new Set();
let spinning = false;

function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

/* ==================== ЗВУК ==================== */
let actx = null;
function beep(freq = 600, dur = 0.06, type = 'square', vol = 0.04, delay = 0) {
  if (!state.sound) return;
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime + delay;
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(actx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  } catch (e) { /* ignore */ }
}

/* ==================== DOM ==================== */
const el = {
  balance: $('#balance'),
  levelPill: $('#levelPill'),
  soundBtn: $('#soundBtn'),
  bonusBtn: $('#bonusBtn'),
  inventory: $('#inventory'),
  invCount: $('#invCount'),
  stakeTotal: $('#stakeTotal'),
  sellBtn: $('#sellBtn'),
  clearStake: $('#clearStake'),
  chanceVal: $('#chanceVal'),
  multVal: $('#multVal'),
  wheelRing: $('#wheelRing'),
  wheelPointer: $('#wheelPointer'),
  wheelLabel: $('#wheelLabel'),
  wheelSub: $('#wheelSub'),
  multRow: $('#multRow'),
  upgradeBtn: $('#upgradeBtn'),
  arenaHint: $('#arenaHint'),
  feed: $('#feed'),
  shopGrid: $('#shopGrid'),
  history: $('#history'),
  statLevel: $('#statLevel'),
  statXp: $('#statXp'),
  statWagered: $('#statWagered'),
  statWon: $('#statWon'),
  statBest: $('#statBest'),
  resetBtn: $('#resetBtn'),
  toast: $('#toast'),
};

/* ==================== РАСЧЁТЫ ==================== */
const chanceOf = (mult) => Math.round((1 / mult) * EDGE * 1000) / 10; // проценты, 1 знак

function selectedItems() {
  return state.inventory.filter((it) => selected.has(it.uid));
}
function stakeValue() {
  return selectedItems().reduce((sum, it) => {
    const c = catalogById(it.id);
    return sum + (c ? c.price : 0);
  }, 0);
}
function pruneSelected() {
  selected = new Set([...selected].filter((u) => state.inventory.some((it) => it.uid === u)));
}

/* ==================== РЕНДЕР ==================== */
function renderHeader() {
  el.balance.textContent = fmt(state.balance);
  el.levelPill.textContent = 'LVL ' + state.level;
  el.soundBtn.textContent = state.sound ? '🔊' : '🔇';
  const ready = Date.now() - state.lastBonus >= 24 * 3600 * 1000;
  el.bonusBtn.classList.toggle('available', ready);
  el.bonusBtn.style.opacity = ready ? '1' : '.55';
}

function itemCardHTML(item, isSel) {
  const c = catalogById(item.id);
  if (!c) return '';
  return `<button class="item-card${isSel ? ' selected' : ''}" data-uid="${item.uid}"
      style="--c1:${c.c1};--c2:${c.c2}" title="${c.name}">
      <span class="item-emoji">${c.emoji}</span>
      <span class="item-name">${c.name}</span>
      <span class="item-price">◈ ${fmt(c.price)}</span>
      <span class="item-check">✓</span>
    </button>`;
}

function renderInventory() {
  pruneSelected();
  if (!state.inventory.length) {
    el.inventory.innerHTML = `<div class="empty">Инвентарь пуст.<br>Купи предметы в магазине.</div>`;
  } else {
    el.inventory.innerHTML = state.inventory.map((it) => itemCardHTML(it, selected.has(it.uid))).join('');
  }
  el.invCount.textContent = state.inventory.length;
  updateArena();
}

function renderShop() {
  el.shopGrid.innerHTML = CATALOG.map((c) => {
    const cant = state.balance < c.price ? ' cant' : '';
    return `<button class="shop-card${cant}" data-buy="${c.id}"
        style="--c1:${c.c1};--c2:${c.c2}">
        <span class="item-emoji">${c.emoji}</span>
        <span class="item-name">${c.name}</span>
        <span class="item-price">◈ ${fmt(c.price)}</span>
        <span class="buy-tag">Купить</span>
      </button>`;
  }).join('');
}

function renderHistory() {
  el.statLevel.textContent = state.level;
  const need = 100 * state.level;
  el.statXp.textContent = `${state.xp} / ${need}`;
  el.statWagered.textContent = fmt(state.wagered) + ' ◈';
  el.statWon.textContent = fmt(state.won) + ' ◈';
  el.statBest.textContent = fmt(state.best) + ' ◈';

  if (!state.history.length) {
    el.history.innerHTML = `<div class="hist-empty">Пока нет апгрейдов. Самое время начать!</div>`;
    return;
  }
  el.history.innerHTML = state.history.slice(0, 60).map((h) => {
    const time = new Date(h.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const items = h.items.map((n) => n).join(', ');
    return `<div class="hist-row">
      <span class="hist-time">${time}</span>
      <span class="hist-items" title="${items}">${items || '—'}</span>
      <span class="hist-mult">×${h.mult}</span>
      <span class="hist-stake">${fmt(h.stake)} ◈</span>
      <span class="hist-res ${h.win ? 'win' : 'lose'}">${h.win ? '+' + fmt(h.prize) : '−' + fmt(h.stake)}</span>
    </div>`;
  }).join('');
}

function updateArena() {
  const stake = stakeValue();
  const mult = state.mult;
  const chance = chanceOf(mult);
  const deg = chance * 3.6;

  el.chanceVal.textContent = chance.toFixed(1).replace('.0', '') + '%';
  el.multVal.textContent = String(mult);
  el.stakeTotal.textContent = fmt(stake);

  el.wheelRing.style.background =
    `conic-gradient(from -90deg, #2bd67b 0deg ${deg}deg, #43121f ${deg}deg 360deg)`;

  $$('.mult-btn').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.mult) === mult);
  });

  el.upgradeBtn.disabled = spinning || stake <= 0;
  el.upgradeBtn.classList.toggle('ready', !spinning && stake > 0);

  if (spinning) {
    el.arenaHint.textContent = 'Крутим...';
  } else if (stake > 0) {
    el.arenaHint.textContent = `Ставка ${fmt(stake)} ◈ → выигрыш ${fmt(stake * mult)} ◈`;
  } else {
    el.arenaHint.textContent = 'Выбери предметы в инвентаре';
  }
}

function renderAll() {
  renderHeader();
  renderInventory();
  renderShop();
  renderHistory();
}

/* ==================== ТОСТ ==================== */
let toastTimer = null;
function toast(msg, kind) {
  el.toast.textContent = msg;
  el.toast.className = 'toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.className = 'toast'; }, 2600);
}

/* ==================== ИГРА ==================== */
function applyResult(win, stake, mult, chance, chosenItems) {
  const names = chosenItems.map((it) => {
    const c = catalogById(it.id);
    return c ? c.emoji + ' ' + c.name : '?';
  });

  state.inventory = state.inventory.filter((it) => !selected.has(it.uid));

  const prize = Math.round(stake * mult);
  state.wagered += stake;

  let xpGain = 3;

  if (win) {
    state.balance += prize;
    state.won += prize;
    state.best = Math.max(state.best, prize);
    xpGain = Math.round(10 * mult);

    el.wheelLabel.textContent = 'WIN';
    el.wheelLabel.className = 'wheel-label win';
    el.wheelSub.textContent = `+${fmt(prize)} ◈`;
    beep(660, 0.10, 'sine', 0.05, 0);
    beep(880, 0.12, 'sine', 0.05, 0.10);
    beep(1320, 0.20, 'sine', 0.05, 0.22);
    toast(`Победа! +${fmt(prize)} ◈`, 'win');
    pushFeed('Ты', chosenItems[0], mult, true, stake);
  } else {
    el.wheelLabel.textContent = 'LOSE';
    el.wheelLabel.className = 'wheel-label lose';
    el.wheelSub.textContent = `−${fmt(stake)} ◈`;
    beep(240, 0.18, 'sawtooth', 0.035, 0);
    beep(160, 0.28, 'sawtooth', 0.03, 0.12);
    toast(`Не повезло. Потеряно ${fmt(stake)} ◈`, 'lose');
    pushFeed('Ты', chosenItems[0], mult, false, stake);
  }

  state.history.unshift({
    ts: Date.now(), win, stake, mult, chance,
    prize: win ? prize : 0,
    items: names,
  });
  if (state.history.length > 200) state.history.length = 200;

  addXp(xpGain);
  selected.clear();
  save();
  renderAll();
}

function addXp(amount) {
  state.xp += amount;
  let need = 100 * state.level;
  while (state.xp >= need) {
    state.xp -= need;
    state.level += 1;
    const bonus = 50 * state.level;
    state.balance += bonus;
    need = 100 * state.level;
    toast(`Новый уровень ${state.level}! +${bonus} ◈`, 'win');
    beep(520, 0.12, 'sine', 0.05, 0);
    beep(780, 0.14, 'sine', 0.05, 0.12);
    beep(1040, 0.18, 'sine', 0.05, 0.26);
  }
}

function setBusy(busy) {
  spinning = busy;
  document.body.classList.toggle('busy', busy);
  el.upgradeBtn.disabled = busy || stakeValue() <= 0;
  if (!busy) updateArena();
}

function animatePointer(totalDeg, duration) {
  return new Promise((resolve) => {
    const start = performance.now();
    let lastTick = -1;
    el.wheelPointer.style.transform = 'rotate(0deg)';

    const step = (now) => {
      const p = clamp((now - start) / duration, 0, 1);
      const e = 1 - Math.pow(1 - p, 4);
      const angle = totalDeg * e;
      el.wheelPointer.style.transform = `rotate(${angle}deg)`;

      const tick = Math.floor(angle / 18);
      if (tick !== lastTick) {
        lastTick = tick;
        if (p < 0.985) beep(1000 - p * 380, 0.018, 'square', 0.012);
      }

      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

async function doUpgrade() {
  if (spinning) return;
  const chosen = selectedItems();
  const stake = stakeValue();
  if (!stake || !chosen.length) {
    toast('Сначала выбери предметы для ставки');
    return;
  }

  const mult = state.mult;
  const chance = chanceOf(mult);
  const win = Math.random() * 100 < chance;

  setBusy(true);
  el.wheelLabel.textContent = '...';
  el.wheelLabel.className = 'wheel-label';
  el.wheelSub.textContent = `×${mult}`;

  const chanceDeg = chance * 3.6;
  const target = win
    ? rand(2, Math.max(3, chanceDeg - 2))
    : rand(chanceDeg + 2, 358);

  const spins = 4 + Math.floor(Math.random() * 2);
  const totalDeg = spins * 360 + target;

  await animatePointer(totalDeg, 3600);
  applyResult(win, stake, mult, chance, chosen);

  await wait(1000);
  el.wheelPointer.style.transform = 'rotate(0deg)';
  el.wheelLabel.textContent = 'Готов?';
  el.wheelLabel.className = 'wheel-label';
  el.wheelSub.textContent = 'Выбери множитель';
  setBusy(false);
}

/* ==================== МАГАЗИН ==================== */
function buyItem(id) {
  const c = catalogById(id);
  if (!c) return;
  if (state.balance < c.price) {
    toast('Недостаточно монет');
    beep(180, 0.16, 'sawtooth', 0.03);
    return;
  }
  state.balance -= c.price;
  state.inventory.push(makeItem(id));
  save();
  renderAll();
  toast(`Куплено: ${c.name}`);
  beep(560, 0.06, 'sine', 0.03, 0);
  beep(740, 0.08, 'sine', 0.03, 0.06);
}

function sellSelected() {
  const items = selectedItems();
  if (!items.length) { toast('Ничего не выбрано'); return; }
  const gain = Math.round(items.reduce((s, it) => s + (catalogById(it.id)?.price || 0), 0) * 0.85);
  state.balance += gain;
  state.inventory = state.inventory.filter((it) => !selected.has(it.uid));
  selected.clear();
  save();
  renderAll();
  toast(`Продано на ${fmt(gain)} ◈ (85%)`);
  beep(680, 0.08, 'sine', 0.03);
}

/* ==================== БОНУС ==================== */
function claimBonus() {
  const now = Date.now();
  const left = 24 * 3600 * 1000 - (now - state.lastBonus);
  if (left > 0) {
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    toast(`Бонус уже получен. Следующий через ${h} ч ${m} мин`);
    return;
  }
  state.lastBonus = now;
  state.balance += 500;
  save();
  renderAll();
  toast('Ежедневный бонус: +500 ◈', 'win');
  beep(520, 0.10, 'sine', 0.05, 0);
  beep(780, 0.14, 'sine', 0.05, 0.11);
  beep(1040, 0.18, 'sine', 0.05, 0.24);
}

/* ==================== LIVE FEED ==================== */
function pushFeed(user, item, mult, win, stake) {
  const c = item ? catalogById(item.id) : CATALOG[Math.floor(Math.random() * CATALOG.length)];
  if (!c) return;
  const row = document.createElement('div');
  row.className = 'feed-row ' + (win ? 'win' : 'lose');
  const result = win ? '+' + fmt(stake * mult) : '−' + fmt(stake);
  row.innerHTML = `
    <span class="feed-user">${user}</span>
    <span class="feed-item" style="--c1:${c.c1};--c2:${c.c2}">${c.emoji}</span>
    <span class="feed-mult">×${mult}</span>
    <span class="feed-res">${result}</span>`;
  el.feed.prepend(row);
  while (el.feed.children.length > 18) el.feed.lastElementChild.remove();
}

function fakeFeedEvent() {
  const c = CATALOG[Math.floor(Math.random() * CATALOG.length)];
  const mult = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
  const stake = c.price;
  const win = Math.random() * 100 < chanceOf(mult);
  const user = USERS[Math.floor(Math.random() * USERS.length)];
  pushFeed(user, { id: c.id }, mult, win, stake);
}

function feedLoop() {
  fakeFeedEvent();
  setTimeout(feedLoop, rand(1600, 4200));
}

/* ==================== СОБЫТИЯ ==================== */
function bindEvents() {
  // табы
  $('#tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    $$('.tab').forEach((t) => t.classList.toggle('active', t === btn));
    $$('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + btn.dataset.view));
    if (btn.dataset.view === 'history') renderHistory();
    beep(520, 0.04, 'sine', 0.02);
  });

  // инвентарь — выбор
  el.inventory.addEventListener('click', (e) => {
    if (spinning) return;
    const card = e.target.closest('.item-card');
    if (!card) return;
    const u = card.dataset.uid;
    if (selected.has(u)) selected.delete(u);
    else selected.add(u);
    renderInventory();
    beep(selected.has(u) ? 760 : 480, 0.04, 'sine', 0.02);
  });

  // магазин
  el.shopGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.shop-card');
    if (!card || spinning) return;
    buyItem(card.dataset.buy);
  });

  // множители
  el.multRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.mult-btn');
    if (!btn || spinning) return;
    state.mult = Number(btn.dataset.mult);
    save();
    updateArena();
    beep(620, 0.04, 'sine', 0.02);
  });

  // апгрейд
  el.upgradeBtn.addEventListener('click', doUpgrade);

  // продажа / сброс выбора
  el.sellBtn.addEventListener('click', sellSelected);
  el.clearStake.addEventListener('click', () => {
    selected.clear();
    renderInventory();
  });

  // бонус и звук
  el.bonusBtn.addEventListener('click', claimBonus);
  el.soundBtn.addEventListener('click', () => {
    state.sound = !state.sound;
    save();
    renderHeader();
    if (state.sound) beep(700, 0.06, 'sine', 0.03);
  });

  // сброс прогресса
  el.resetBtn.addEventListener('click', () => {
    if (!confirm('Сбросить весь прогресс? Баланс, инвентарь и история будут удалены.')) return;
    state = defaultState();
    selected.clear();
    save();
    renderAll();
    toast('Прогресс сброшен');
  });

  // пробел — крутить
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.repeat) {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'button') return;
      if (!$('#view-play').classList.contains('active')) return;
      e.preventDefault();
      doUpgrade();
    }
  });
}

/* ==================== СТАРТ ==================== */
function buildMultipliers() {
  el.multRow.innerHTML = MULTIPLIERS.map((m) => {
    const ch = chanceOf(m);
    return `<button class="mult-btn" data-mult="${m}" title="Шанс ${ch.toFixed(1).replace('.0', '')}%">×${m}</button>`;
  }).join('');
}

function init() {
  buildMultipliers();
  bindEvents();
  renderAll();
  fakeFeedEvent();
  fakeFeedEvent();
  fakeFeedEvent();
  setTimeout(feedLoop, 1200);
}

init();
