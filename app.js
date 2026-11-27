'use strict';

/* ============================================================
   UPGRADER v2 — логика
   ============================================================ */

/* ---------------- утилиты ---------------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rand = (a, b) => a + Math.random() * (b - a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const nextFrame = () => new Promise((r) => {
  let done = false;
  const finish = () => { if (!done) { done = true; r(); } };
  requestAnimationFrame(() => requestAnimationFrame(finish));
  // rAF может быть приостановлен в фоновой вкладке — не даём процессу зависнуть
  setTimeout(finish, 250);
});
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString('ru-RU');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'i' + Math.random().toString(36).slice(2) + Date.now().toString(36));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function randomHex(bytes = 16) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

/* ---------------- данные ---------------- */
const RARITY = {
  industrial: { label: 'Промышленное', color: '#5e98d9' },
  mil:        { label: 'Армейское',    color: '#4b69ff' },
  restricted: { label: 'Запрещённое',  color: '#8847ff' },
  classified: { label: 'Засекреченное', color: '#d32ce6' },
  covert:     { label: 'Тайное',       color: '#eb4b4b' },
  knife:      { label: '★ Нож',        color: '#ffcf6b' },
};

const CATALOG = [
  { id: 'famas-roll',      name: 'FAMAS | Roll Cage',        price: 40,   rarity: 'industrial', emoji: '🔫', c1: '#5e98d9', c2: '#0f1f38' },
  { id: 'mp9-starlight',   name: 'MP9 | Starlight',          price: 60,   rarity: 'mil',        emoji: '🔫', c1: '#4b69ff', c2: '#111a44' },
  { id: 'ak-redline',      name: 'AK-47 | Redline',          price: 120,  rarity: 'classified', emoji: '🔫', c1: '#d32ce6', c2: '#360a3d' },
  { id: 'sg553-integrale', name: 'SG 553 | Integrale',       price: 150,  rarity: 'restricted', emoji: '⚡', c1: '#8847ff', c2: '#1d0f3d' },
  { id: 'glock-fade',      name: 'Glock-18 | Fade',          price: 180,  rarity: 'restricted', emoji: '🔰', c1: '#8847ff', c2: '#1c2f22' },
  { id: 'usp-kill',        name: 'USP-S | Kill Confirmed',   price: 210,  rarity: 'covert',     emoji: '💀', c1: '#eb4b4b', c2: '#3d0f14' },
  { id: 'awp-asiimov',     name: 'AWP | Asiimov',            price: 260,  rarity: 'covert',     emoji: '🎯', c1: '#eb4b4b', c2: '#4a2a05' },
  { id: 'deagle-blaze',    name: 'Desert Eagle | Blaze',     price: 340,  rarity: 'classified', emoji: '🔥', c1: '#d32ce6', c2: '#4a1a05' },
  { id: 'm4-neon',         name: 'M4A4 | Neon Rider',        price: 420,  rarity: 'covert',     emoji: '💠', c1: '#eb4b4b', c2: '#083a4a' },
  { id: 'm4a1-printstream',name: 'M4A1-S | Printstream',     price: 700,  rarity: 'covert',     emoji: '🖨️', c1: '#eb4b4b', c2: '#2b2b3a' },
  { id: 'knife-doppler',   name: '★ Karambit | Doppler',     price: 900,  rarity: 'knife',      emoji: '🗡️', c1: '#ffcf6b', c2: '#3b0764' },
  { id: 'talon-marble',    name: '★ Talon | Marble Fade',    price: 1100, rarity: 'knife',      emoji: '🔪', c1: '#ffcf6b', c2: '#3a0f0f' },
  { id: 'butterfly',       name: '★ Butterfly | Gamma',      price: 1200, rarity: 'knife',      emoji: '🦋', c1: '#ffcf6b', c2: '#0f3d3a' },
  { id: 'awp-dragon',      name: 'AWP | Dragon Lore',        price: 1500, rarity: 'covert',     emoji: '🐉', c1: '#eb4b4b', c2: '#4a2a05' },
  { id: 'glock-water',     name: 'Glock-18 | Water Elemental', price: 90, rarity: 'restricted', emoji: '🌊', c1: '#8847ff', c2: '#0b2c4a' },
  { id: 'usp-neonoir',     name: 'USP-S | Neo-Noir',         price: 130,  rarity: 'classified', emoji: '🕶️', c1: '#d32ce6', c2: '#1b1030' },
  { id: 'ak-fire',         name: 'AK-47 | Fire Serpent',     price: 480,  rarity: 'covert',     emoji: '🐍', c1: '#eb4b4b', c2: '#3d2405' },
  { id: 'm4-howl',         name: 'M4A4 | Howl',              price: 800,  rarity: 'covert',     emoji: '🐺', c1: '#eb4b4b', c2: '#3a1a08' },
  { id: 'awp-medusa',      name: 'AWP | Medusa',             price: 950,  rarity: 'covert',     emoji: '🐙', c1: '#eb4b4b', c2: '#0b3a2e' },
  { id: 'karambit-fade',   name: '★ Karambit | Fade',        price: 1400, rarity: 'knife',      emoji: '🌗', c1: '#ffcf6b', c2: '#4a1a3d' },
  { id: 'butterfly-doppler', name: '★ Butterfly | Doppler',  price: 1600, rarity: 'knife',      emoji: '🦋', c1: '#ffcf6b', c2: '#24104a' },
];

const CASES = [
  {
    id: 'starter', name: 'Стартовый', price: 150, emoji: '📦', c1: '#22d3ee', c2: '#0e4b5c',
    pool: [
      { id: 'famas-roll', w: 30 }, { id: 'mp9-starlight', w: 24 }, { id: 'glock-fade', w: 15 },
      { id: 'ak-redline', w: 12 }, { id: 'sg553-integrale', w: 8 }, { id: 'usp-kill', w: 5 },
      { id: 'awp-asiimov', w: 3 }, { id: 'deagle-blaze', w: 1.5 }, { id: 'm4-neon', w: 0.4 },
      { id: 'knife-doppler', w: 0.1 },
    ],
  },
  {
    id: 'premium', name: 'Премиум', price: 600, emoji: '🎁', c1: '#8b5cf6', c2: '#2a1155',
    pool: [
      { id: 'ak-redline', w: 20 }, { id: 'sg553-integrale', w: 15 }, { id: 'glock-fade', w: 15 },
      { id: 'usp-kill', w: 15 }, { id: 'awp-asiimov', w: 12 }, { id: 'deagle-blaze', w: 10 },
      { id: 'm4-neon', w: 7 }, { id: 'm4a1-printstream', w: 3 }, { id: 'knife-doppler', w: 2.4 },
      { id: 'talon-marble', w: 0.6 },
    ],
  },
  {
    id: 'knife', name: 'Ножевой', price: 2000, emoji: '🗡️', c1: '#ffcf6b', c2: '#4a2a05',
    pool: [
      { id: 'm4-neon', w: 20 }, { id: 'm4a1-printstream', w: 18 }, { id: 'deagle-blaze', w: 15 },
      { id: 'awp-asiimov', w: 15 }, { id: 'awp-dragon', w: 10 }, { id: 'knife-doppler', w: 10 },
      { id: 'talon-marble', w: 6 }, { id: 'butterfly', w: 6 },
    ],
  },
  {
    id: 'budget', name: 'Бюджетный', price: 75, emoji: '🧰', c1: '#34e59a', c2: '#0b3a2a',
    pool: [
      { id: 'famas-roll', w: 34 }, { id: 'mp9-starlight', w: 28 }, { id: 'glock-water', w: 16 },
      { id: 'ak-redline', w: 10 }, { id: 'sg553-integrale', w: 6 }, { id: 'glock-fade', w: 4 },
      { id: 'usp-neonoir', w: 1.6 }, { id: 'usp-kill', w: 0.4 },
    ],
  },
  {
    id: 'elite', name: 'Элитный', price: 5000, emoji: '💎', c1: '#d32ce6', c2: '#2a0a3d',
    pool: [
      { id: 'm4-neon', w: 20 }, { id: 'ak-fire', w: 16 }, { id: 'awp-asiimov', w: 14 },
      { id: 'm4a1-printstream', w: 12 }, { id: 'm4-howl', w: 10 }, { id: 'awp-medusa', w: 8 },
      { id: 'awp-dragon', w: 6 }, { id: 'knife-doppler', w: 6 }, { id: 'talon-marble', w: 3.6 },
      { id: 'butterfly-doppler', w: 2.4 }, { id: 'karambit-fade', w: 1.6 }, { id: 'butterfly', w: 0.4 },
    ],
  },
];

const ACHIEVEMENTS = [
  { id: 'first',     icon: '🎯', name: 'Первый шаг',   desc: 'Сделай первый апгрейд',          reward: 150, check: (s) => s.upgrades >= 1 },
  { id: 'ten',       icon: '🔥', name: 'Разогрев',     desc: '10 апгрейдов',                   reward: 250, check: (s) => s.upgrades >= 10 },
  { id: 'fifty',     icon: '⚙️', name: 'Гриндер',      desc: '50 апгрейдов',                   reward: 500, check: (s) => s.upgrades >= 50 },
  { id: 'lvl5',      icon: '⭐', name: 'Опытный',      desc: 'Достигни 5 уровня',              reward: 400, check: (s) => s.level >= 5 },
  { id: 'big',       icon: '🐋', name: 'Крупная рыба', desc: 'Выиграй 5000 ◈ за раз',          reward: 600, check: (s) => s.best >= 5000 },
  { id: 'x10',       icon: '💎', name: 'Ва-банк',      desc: 'Выиграй с множителем ×10',       reward: 500, check: (s) => s.maxMultWin >= 10 },
  { id: 'collector', icon: '🎒', name: 'Коллекционер', desc: '10 предметов в инвентаре',       reward: 300, check: (s) => s.inventory.length >= 10 },
  { id: 'rich',      icon: '👑', name: 'Богач',        desc: 'Баланс 10 000 ◈',                reward: 700, check: (s) => s.balance >= 10000 },
  { id: 'hundred',   icon: '🏆', name: 'Ветеран',      desc: '100 апгрейдов',                  reward: 1200, check: (s) => s.upgrades >= 100 },
  { id: 'lvl10',     icon: '🌟', name: 'Профи',        desc: 'Достигни 10 уровня',             reward: 1000, check: (s) => s.level >= 10 },
  { id: 'sniper',    icon: '🎯', name: 'Снайпер',      desc: 'Выиграй предмет-цель',           reward: 600, check: (s) => s.targetWins >= 1 },
  { id: 'coin',      icon: '🪙', name: 'Орёл и решка', desc: 'Выиграй в монетке',              reward: 150, check: (s) => s.coinWins >= 1 },
  { id: 'knifehunt', icon: '🗡️', name: 'Охотник за ножами', desc: 'Выбей нож из кейса',        reward: 800, check: (s) => s.knifeDrops >= 1 },
  { id: 'twenty',    icon: '📦', name: 'Склад',        desc: '20 предметов в инвентаре',       reward: 500, check: (s) => s.inventory.length >= 20 },
];

const MULTIPLIERS = [1.2, 1.5, 2, 3, 5, 10];
const EDGE = 0.95;
const COIN_CHANCE = 47.5;
const DAY = 24 * 3600 * 1000;
const LS = 'upgrader_v2';

const PROMOS = { UPGRADER: 1000, DEMO500: 500, LUCKY777: 777 };

const DAILY_QUESTS = [
  { id: 'q-up',   name: 'Сделай 3 апгрейда',  goal: 3, key: 'upgrades', reward: 200 },
  { id: 'q-case', name: 'Открой 1 кейс',      goal: 1, key: 'cases',    reward: 150 },
  { id: 'q-win',  name: 'Выиграй 2 раунда',   goal: 2, key: 'wins',     reward: 300 },
];

const BOTS = [
  { name: 'm0nesy_fan', w: 184500, b: 24800 },
  { name: 'skinlord',   w: 142300, b: 18600 },
  { name: 'drop_hunter',w: 118700, b: 15900 },
  { name: 'NIGHTFALL',  w: 96400,  b: 12400 },
  { name: 'Kaban4ik',   w: 81300,  b: 9800 },
  { name: 'lucky_panda',w: 67200,  b: 8300 },
  { name: 'v1ncent',    w: 54800,  b: 6100 },
  { name: 'Тимофей',    w: 43100,  b: 4700 },
  { name: 'GG_WP',      w: 32900,  b: 3600 },
  { name: 'pixel_dust', w: 21500,  b: 2400 },
];
const USERS = [
  'xX_Sniper_Xx', 'Kaban4ik', 'drop_hunter', 'NoScope', 'Мария', 'v1ncent',
  'GG_WP', 'skinlord', 'Тимофей', 'zeus_king', 'm0nesy_fan', 'Толян',
  'lucky_panda', 'Alex_777', 'cheburek', 'NIGHTFALL', 'pixel_dust', 'Максим',
];

const catalogById = (id) => CATALOG.find((c) => c.id === id);
const rarityOf = (c) => RARITY[c.rarity] || RARITY.industrial;
const chanceOf = (mult) => Math.round((1 / mult) * EDGE * 1000) / 10;

function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function targetChance(stake, price) {
  if (!(stake > 0) || !(price > 0)) return 0;
  return Math.round(clamp((stake / price) * EDGE * 100, 1, 95) * 10) / 10;
}

/* ---------------- состояние ---------------- */
function defaultState() {
  return {
    v: 2,
    balance: 2500,
    inventory: [
      { uid: uid(), id: 'famas-roll' },
      { uid: uid(), id: 'glock-fade' },
      { uid: uid(), id: 'ak-redline' },
    ],
    xp: 0,
    level: 1,
    wagered: 0,
    won: 0,
    best: 0,
    upgrades: 0,
    wins: 0,
    losses: 0,
    maxMultWin: 1,
    history: [],
    balanceHistory: [{ t: Date.now(), v: 2500 }],
    sound: true,
    lastBonus: 0,
    mult: 2,
    targetMode: false,
    targetId: null,
    coinSide: 0,
    coinWins: 0,
    targetWins: 0,
    knifeDrops: 0,
    promos: [],
    daily: { date: '', upgrades: 0, cases: 0, wins: 0, claimed: [] },
    serverSeed: randomHex(16),
    clientSeed: 'player-' + randomHex(3),
    nonce: 0,
    lastRoll: null,
    unlocked: [],
    pending: null,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);
    const s = Object.assign(defaultState(), saved);
    s.inventory = Array.isArray(s.inventory) ? s.inventory.filter((it) => it && catalogById(it.id)) : [];
    s.balance = Math.max(0, Math.floor(Number(s.balance) || 0));
    s.xp = Math.max(0, Math.floor(Number(s.xp) || 0));
    s.level = Math.max(1, Math.floor(Number(s.level) || 1));
    s.wagered = Math.max(0, Number(s.wagered) || 0);
    s.won = Math.max(0, Number(s.won) || 0);
    s.best = Math.max(0, Number(s.best) || 0);
    s.upgrades = Math.max(0, Math.floor(Number(s.upgrades) || 0));
    s.wins = Math.max(0, Math.floor(Number(s.wins) || 0));
    s.losses = Math.max(0, Math.floor(Number(s.losses) || 0));
    s.maxMultWin = Math.max(1, Number(s.maxMultWin) || 1);
    s.lastBonus = Number(s.lastBonus) || 0;
    s.sound = s.sound !== false;
    s.clientSeed = String(s.clientSeed || '').slice(0, 24);
    s.history = Array.isArray(s.history) ? s.history.filter((h) => h && Number.isFinite(h.ts)).slice(0, 200) : [];
    s.balanceHistory = Array.isArray(s.balanceHistory) ? s.balanceHistory.filter((p) => p && Number.isFinite(p.t) && Number.isFinite(p.v)).slice(-200) : [];
    s.unlocked = Array.isArray(s.unlocked) ? s.unlocked : [];
    if (!MULTIPLIERS.includes(s.mult)) s.mult = 2;
    s.targetMode = !!s.targetMode;
    s.targetId = s.targetId && catalogById(s.targetId) ? s.targetId : null;
    if (s.targetMode && !s.targetId) s.targetMode = false;
    s.coinSide = s.coinSide === 1 ? 1 : 0;
    s.coinWins = Math.max(0, Math.floor(Number(s.coinWins) || 0));
    s.targetWins = Math.max(0, Math.floor(Number(s.targetWins) || 0));
    s.knifeDrops = Math.max(0, Math.floor(Number(s.knifeDrops) || 0));
    s.promos = Array.isArray(s.promos) ? s.promos.filter((c) => typeof c === 'string') : [];
    if (!s.daily || typeof s.daily !== 'object' || s.daily.date !== todayKey()) {
      s.daily = { date: todayKey(), upgrades: 0, cases: 0, wins: 0, claimed: [] };
    } else {
      s.daily.upgrades = Math.max(0, Math.floor(Number(s.daily.upgrades) || 0));
      s.daily.cases = Math.max(0, Math.floor(Number(s.daily.cases) || 0));
      s.daily.wins = Math.max(0, Math.floor(Number(s.daily.wins) || 0));
      s.daily.claimed = Array.isArray(s.daily.claimed) ? s.daily.claimed.filter((q) => typeof q === 'string') : [];
    }
    if (typeof s.serverSeed !== 'string' || !s.serverSeed) s.serverSeed = randomHex(16);
    if (typeof s.clientSeed !== 'string' || !s.clientSeed) s.clientSeed = 'player-' + randomHex(3);
    if (!Number.isFinite(s.nonce) || s.nonce < 0) s.nonce = 0;
    if (s.pending && !['upgrade', 'case', 'coinflip'].includes(s.pending.mode)) s.pending = null;
    if (s.pending) {
      s.pending.owner = typeof s.pending.owner === 'string' ? s.pending.owner : '';
      if (!Number.isFinite(s.pending.ts)) s.pending.ts = 0;
    }
    if (s.pending && s.pending.mode === 'case' && !catalogById(s.pending.itemId)) s.pending = null;
    if (s.pending && s.pending.mode === 'upgrade' && s.pending.targetId && !catalogById(s.pending.targetId)) s.pending.targetId = null;
    if (s.pending && s.pending.mode === 'coinflip') {
      s.pending.side = s.pending.side === 1 ? 1 : 0;
      if (!(Number(s.pending.stake) > 0)) s.pending = null;
    }
    return s;
  } catch (e) {
    return defaultState();
  }
}

/* Идентификатор вкладки: sessionStorage переживает перезагрузку, но уникален
   для каждой вкладки. Нужен, чтобы вкладка не «присваивала» чужой раунд. */
const TAB_ID = (() => {
  try {
    let id = sessionStorage.getItem('upgrader_tab');
    if (!id) {
      id = randomHex(6);
      sessionStorage.setItem('upgrader_tab', id);
    }
    return id;
  } catch (e) {
    return randomHex(6);
  }
})();

let state = loadState();
let selected = new Set();
let spinning = false;
let caseOpening = false;
let coinBusy = false;
let remoteBusy = false;
let remoteTimer = 0;
let currentCaseId = null;
let shopFilter = 'all';
let seedRevealed = false;
let serverHashHex = '';
let shownBalance = state.balance;

function save() {
  try { localStorage.setItem(LS, JSON.stringify(state)); } catch (e) { /* ignore */ }
}

function recordBalance() {
  state.balanceHistory.push({ t: Date.now(), v: state.balance });
  if (state.balanceHistory.length > 200) state.balanceHistory = state.balanceHistory.slice(-200);
}

/* ---------------- звук ---------------- */
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

/* ---------------- DOM ---------------- */
const el = {
  balance: $('#balance'),
  levelPill: $('#levelPill'),
  soundBtn: $('#soundBtn'),
  bonusBtn: $('#bonusBtn'),

  invCount: $('#invCount'),
  inventory: $('#inventory'),
  coinBet: $('#coinBet'),
  betMinus: $('#betMinus'),
  betPlus: $('#betPlus'),
  quickBets: $('#quickBets'),
  sellBtn: $('#sellBtn'),
  clearStake: $('#clearStake'),

  chanceVal: $('#chanceVal'),
  multVal: $('#multVal'),
  arena: $('.arena'),
  wheelRing: $('#wheelRing'),
  wheelPointer: $('#wheelPointer'),
  wheelLabel: $('#wheelLabel'),
  wheelSub: $('#wheelSub'),
  multRow: $('#multRow'),
  modeRow: $('#modeRow'),
  targetPick: $('#targetPick'),
  targetEmoji: $('#targetEmoji'),
  targetName: $('#targetName'),
  targetChance: $('#targetChance'),
  stakeTotal: $('#stakeTotal'),
  potential: $('#potential'),
  upgradeBtn: $('#upgradeBtn'),
  arenaHint: $('#arenaHint'),

  feed: $('#feed'),
  online: $('#online'),
  clientSeed: $('#clientSeed'),
  fairNonce: $('#fairNonce'),
  serverHash: $('#serverHash'),
  serverSeed: $('#serverSeed'),
  seedRow: $('#seedRow'),
  revealSeed: $('#revealSeed'),
  newSeed: $('#newSeed'),

  caseGrid: $('#caseGrid'),
  caseModal: $('#caseModal'),
  caseClose: $('#caseClose'),
  caseTitle: $('#caseTitle'),
  reelWrap: $('#reelWrap'),
  caseReel: $('#caseReel'),
  caseResult: $('#caseResult'),
  caseTake: $('#caseTake'),
  caseAgain: $('#caseAgain'),

  targetModal: $('#targetModal'),
  targetClose: $('#targetClose'),
  targetGrid: $('#targetGrid'),

  coin: $('#coin'),
  coinSides: $('#coinSides'),
  coinAmount: $('#coinAmount'),
  coinMinus: $('#coinMinus'),
  coinPlus: $('#coinPlus'),
  coinQuick: $('#coinQuick'),
  flipBtn: $('#flipBtn'),
  coinHint: $('#coinHint'),
  coinStats: $('#coinStats'),

  shopFilters: $('#shopFilters'),
  shopGrid: $('#shopGrid'),

  avatar: $('#avatar'),
  pLevel: $('#pLevel'),
  pXp: $('#pXp'),
  pXpFill: $('#pXpFill'),
  resetBtn: $('#resetBtn'),
  pBalance: $('#pBalance'),
  pUpgrades: $('#pUpgrades'),
  pWinrate: $('#pWinrate'),
  pWagered: $('#pWagered'),
  pWon: $('#pWon'),
  pBest: $('#pBest'),
  chart: $('#chart'),
  achCount: $('#achCount'),
  achievements: $('#achievements'),
  history: $('#history'),

  questCount: $('#questCount'),
  dailyQuests: $('#dailyQuests'),
  promoInput: $('#promoInput'),
  promoBtn: $('#promoBtn'),
  leaderboard: $('#leaderboard'),

  toast: $('#toast'),
};

/* ---------------- вычисления ---------------- */
function selectedItems() {
  return state.inventory.filter((it) => selected.has(it.uid));
}
function itemsValue(items) {
  return items.reduce((sum, it) => sum + (catalogById(it.id)?.price || 0), 0);
}
function betValue() {
  const n = Math.floor(Number(el.coinBet.value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function clampBetInput() {
  const v = clamp(betValue(), 0, Math.max(0, state.balance));
  if (String(v) !== el.coinBet.value) el.coinBet.value = v;
  return v;
}
function pruneSelected() {
  selected = new Set([...selected].filter((u) => state.inventory.some((it) => it.uid === u)));
}

/* блокировка любых действий во время раунда/кейса/модалки */
function locked() {
  return spinning || caseOpening || coinBusy || remoteBusy || !!state.pending ||
    el.caseModal.classList.contains('open') ||
    (el.targetModal && el.targetModal.classList.contains('open'));
}

/* Чужой незавершённый раунд (другая вкладка) не даёт начать новый.
   Если вкладка-владелец закрылась, по истечении «аренды» засчитываем раунд. */
const PENDING_LEASE = 15000;
function scheduleRemotePending() {
  clearTimeout(remoteTimer);
  const p = state.pending;
  if (!p) { remoteBusy = false; return; }
  const age = Date.now() - (Number(p.ts) || 0);
  const delay = Math.max(600, PENDING_LEASE - age + 400);
  remoteTimer = setTimeout(() => {
    const next = loadState();
    const np = next.pending;
    if (!np) {
      state = next;
      remoteBusy = false;
      renderAll();
      return;
    }
    if (Date.now() - (Number(np.ts) || 0) > PENDING_LEASE) {
      state = next;
      remoteBusy = false;
      const done = settlePending();
      renderAll({ animateBalance: true });
      if (done) toast('Незавершённый раунд засчитан', done.win ? 'win' : 'lose');
    } else {
      state = next;
      scheduleRemotePending();
    }
  }, delay);
}

/* ---------------- fair ---------------- */
async function sha256(str) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // fallback для небезопасного контекста
  let h1 = 0x811c9dc5 >>> 0;
  let h2 = 0x01000193 >>> 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ (c + i), 2246822519) >>> 0;
  }
  let out = '';
  for (let i = 0; i < 8; i++) {
    h1 = Math.imul(h1 ^ (h1 >>> 13), 1274126177) >>> 0;
    h2 = Math.imul(h2 ^ (h2 >>> 15), 2654435761) >>> 0;
    out += h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
  }
  return out.slice(0, 64);
}

const TWO52 = 4503599627370496;
async function roll() {
  const nonce = state.nonce;
  const hash = await sha256(state.serverSeed + '|' + state.clientSeed + '|' + nonce);
  const r = parseInt(hash.slice(0, 13), 16) / TWO52;
  state.nonce = nonce + 1;
  state.lastRoll = { nonce, hash, roll: r, ts: Date.now() };
  return r;
}

let hashToken = 0;
async function refreshServerHash() {
  const token = ++hashToken;
  try {
    const h = await sha256(state.serverSeed);
    if (token === hashToken) serverHashHex = h;
  } catch (e) {
    if (token === hashToken) serverHashHex = '';
  }
  renderFair();
}

function pickWeighted(pool, r) {
  const total = pool.reduce((s, p) => s + p.w, 0);
  let x = r * total;
  for (const p of pool) {
    if (x < p.w) return p.id;
    x -= p.w;
  }
  return pool[pool.length - 1].id;
}

/* ---------------- сеттлмент ---------------- */
function settlePending() {
  const p = state.pending;
  if (!p || typeof p !== 'object') return null;
  if (p.mode === 'upgrade' && !(Number(p.stake) > 0)) { state.pending = null; save(); return null; }
  state.pending = null;
  const now = Date.now();
  ensureDaily();

  if (p.mode === 'upgrade') {
    const coinBet = clamp(Math.floor(Number(p.coinBet) || 0), 0, Math.max(0, state.balance));
    const uids = new Set(Array.isArray(p.itemUids) ? p.itemUids : []);
    const stake = Math.max(0, Number(p.stake) || 0);
    const prize = Math.max(0, Number(p.prize) || 0);
    const target = p.targetId ? catalogById(p.targetId) : null;

    state.balance = Math.max(0, state.balance - coinBet);
    state.inventory = state.inventory.filter((it) => !uids.has(it.uid));

    if (p.win) {
      if (target) state.inventory.push({ uid: uid(), id: target.id });
      else state.balance += prize;
    }

    state.wagered += stake;
    state.upgrades += 1;
    state.daily.upgrades += 1;
    if (p.win) {
      state.wins += 1;
      state.daily.wins += 1;
      state.won += prize;
      state.best = Math.max(state.best, prize);
      state.maxMultWin = Math.max(state.maxMultWin, Number(p.mult) || 1);
      if (target) state.targetWins += 1;
    } else {
      state.losses += 1;
    }

    addXp(p.win ? Math.round(10 * (Number(p.mult) || 1)) : 3);

    state.history.unshift({
      mode: 'upgrade', ts: now, win: !!p.win, stake,
      mult: p.mult, chance: p.chance, prize: p.win ? prize : 0,
      items: target ? [target.emoji + ' ' + target.name] : (Array.isArray(p.itemNames) ? p.itemNames : []),
      roll: p.roll, nonce: p.nonce, target: !!target,
    });
  } else if (p.mode === 'case') {
    const c = catalogById(p.itemId);
    const price = clamp(Math.floor(Number(p.price) || 0), 0, Math.max(0, state.balance));

    state.balance = Math.max(0, state.balance - price);
    if (c) state.inventory.push({ uid: uid(), id: c.id });
    state.daily.cases += 1;
    if (c && c.rarity === 'knife') state.knifeDrops += 1;

    state.history.unshift({
      mode: 'case', ts: now, win: true, stake: price, mult: 1, chance: 100,
      prize: c ? c.price : 0, items: [c ? c.emoji + ' ' + c.name : '?'],
      roll: p.roll, nonce: p.nonce, caseName: p.caseName,
    });
    addXp(8);
  } else if (p.mode === 'coinflip') {
    const stake = clamp(Math.floor(Number(p.stake) || 0), 0, Math.max(0, state.balance));
    const prize = Math.max(0, Number(p.prize) || 0);
    const side = p.side === 1 ? 1 : 0;

    state.balance = Math.max(0, state.balance - stake);
    if (p.win) state.balance += prize;

    state.wagered += stake;
    if (p.win) {
      state.wins += 1;
      state.daily.wins += 1;
      state.coinWins += 1;
      state.won += prize;
      state.best = Math.max(state.best, prize);
    } else {
      state.losses += 1;
    }

    addXp(p.win ? 6 : 2);

    state.history.unshift({
      mode: 'coin', ts: now, win: !!p.win, stake, mult: 2, chance: COIN_CHANCE,
      prize: p.win ? prize : 0,
      items: [side ? '🪙 Решка' : '🪙 Орёл'],
      roll: p.roll, nonce: p.nonce,
    });
  } else {
    return null;
  }

  state.history = state.history.slice(0, 200);
  checkAchievements();
  checkDaily();
  recordBalance();
  save();
  return p;
}

function ensureDaily() {
  if (!state.daily || state.daily.date !== todayKey()) {
    state.daily = { date: todayKey(), upgrades: 0, cases: 0, wins: 0, claimed: [] };
  }
}

function checkDaily() {
  ensureDaily();
  for (const q of DAILY_QUESTS) {
    if (state.daily.claimed.includes(q.id)) continue;
    if ((state.daily[q.key] || 0) >= q.goal) {
      state.daily.claimed.push(q.id);
      state.balance += q.reward;
      toast('Задание «' + q.name + '» выполнено: +' + q.reward + ' ◈', 'win');
      beep(640, 0.08, 'sine', 0.04, 0);
      beep(920, 0.12, 'sine', 0.04, 0.09);
    }
  }
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
    toast('Новый уровень ' + state.level + '! +' + bonus + ' ◈', 'win');
    beep(520, 0.12, 'sine', 0.05, 0);
    beep(780, 0.14, 'sine', 0.05, 0.12);
    beep(1040, 0.18, 'sine', 0.05, 0.26);
  }
}

function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (state.unlocked.includes(a.id)) continue;
    let ok = false;
    try { ok = !!a.check(state); } catch (e) { ok = false; }
    if (ok) {
      state.unlocked.push(a.id);
      state.balance += a.reward;
      toast('Достижение «' + a.name + '» +' + a.reward + ' ◈', 'win');
      beep(600, 0.08, 'sine', 0.04, 0);
      beep(900, 0.12, 'sine', 0.04, 0.09);
    }
  }
}

/* ---------------- тост ---------------- */
let toastTimer = 0;
function toast(msg, kind) {
  el.toast.textContent = msg;
  el.toast.className = 'toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.className = 'toast'; }, 2800);
}

/* ---------------- рендер ---------------- */
let balanceToken = 0;
function animateBalance(from, to) {
  const token = ++balanceToken;
  const start = performance.now();
  const dur = 650;
  const step = (t) => {
    if (token !== balanceToken) return;
    const p = Math.min(1, (t - start) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    const v = Math.round(from + (to - from) * e);
    shownBalance = v;
    el.balance.textContent = fmt(v);
    if (p < 1) requestAnimationFrame(step);
    else { shownBalance = to; el.balance.textContent = fmt(to); }
  };
  requestAnimationFrame(step);
  // страховка на случай приостановленного rAF в фоновой вкладке
  setTimeout(() => {
    if (token !== balanceToken) return;
    balanceToken++;
    shownBalance = to;
    el.balance.textContent = fmt(to);
  }, dur + 300);
}

function renderHeader(animate) {
  el.levelPill.textContent = 'LVL ' + state.level;
  el.soundBtn.textContent = state.sound ? '🔊' : '🔇';
  const ready = Date.now() - state.lastBonus >= DAY;
  el.bonusBtn.classList.toggle('available', ready);

  if (animate && state.balance !== shownBalance) animateBalance(shownBalance, state.balance);
  else { balanceToken++; shownBalance = state.balance; el.balance.textContent = fmt(state.balance); }
}

function itemCardHTML(item, isSel) {
  const c = catalogById(item.id);
  if (!c) return '';
  const r = rarityOf(c);
  return '<button class="item-card' + (isSel ? ' selected' : '') + '" data-uid="' + item.uid + '"' +
    ' style="--c1:' + c.c1 + ';--c2:' + c.c2 + ';--rar:' + r.color + '" title="' + esc(c.name) + '">' +
    '<span class="item-glow" aria-hidden="true"></span>' +
    '<span class="item-art" aria-hidden="true">' + c.emoji + '</span>' +
    '<span class="item-emoji">' + c.emoji + '</span>' +
    '<span class="item-name">' + esc(c.name) + '</span>' +
    '<span class="item-price">◈ ' + fmt(c.price) + '</span>' +
    '<span class="item-rar" aria-hidden="true"></span>' +
    '<span class="item-check" aria-hidden="true">✓</span>' +
    '</button>';
}

function renderInventory() {
  pruneSelected();
  const sc = el.inventory.scrollTop;
  if (!state.inventory.length) {
    el.inventory.innerHTML = '<div class="empty">Инвентарь пуст.<br>Купи предметы в магазине или открой кейс.</div>';
  } else {
    el.inventory.innerHTML = state.inventory.map((it) => itemCardHTML(it, selected.has(it.uid))).join('');
  }
  el.inventory.scrollTop = sc;
  el.invCount.textContent = state.inventory.length;
  updateArena();
}

function renderShop() {
  const list = CATALOG.filter((c) => {
    if (shopFilter === 'knives') return c.rarity === 'knife';
    if (shopFilter === 'guns') return c.rarity !== 'knife';
    return true;
  });
  el.shopGrid.innerHTML = list.map((c) => {
    const r = rarityOf(c);
    const cant = state.balance < c.price ? ' cant' : '';
    return '<button class="shop-card' + cant + '" data-buy="' + c.id + '"' +
      ' style="--c1:' + c.c1 + ';--c2:' + c.c2 + ';--rar:' + r.color + '" title="' + esc(c.name) + '">' +
      '<span class="item-glow" aria-hidden="true"></span>' +
      '<span class="item-art" aria-hidden="true">' + c.emoji + '</span>' +
      '<span class="item-emoji">' + c.emoji + '</span>' +
      '<span class="item-name">' + esc(c.name) + '</span>' +
      '<span class="item-price">◈ ' + fmt(c.price) + '</span>' +
      '<span class="buy-tag">' + (state.balance >= c.price ? 'Купить' : 'Не хватает') + '</span>' +
      '<span class="item-rar" aria-hidden="true"></span>' +
      '</button>';
  }).join('');
}

function knifeChance(box) {
  const total = box.pool.reduce((s, p) => s + p.w, 0);
  const k = box.pool.filter((p) => catalogById(p.id)?.rarity === 'knife').reduce((s, p) => s + p.w, 0);
  return (k / total * 100).toFixed(1).replace('.0', '');
}

function renderCases() {
  el.caseGrid.innerHTML = CASES.map((box) => {
    const preview = box.pool.slice(0, 4).map((p) => {
      const c = catalogById(p.id);
      if (!c) return '';
      return '<span class="case-mini" style="--mc1:' + c.c1 + ';--mc2:' + c.c2 + '" title="' + esc(c.name) + '">' + c.emoji + '</span>';
    }).join('');
    return '<article class="case-card" style="--c1:' + box.c1 + ';--c2:' + box.c2 + '">' +
      '<span class="case-art">' + box.emoji + '</span>' +
      '<h3>' + esc(box.name) + '</h3>' +
      '<div class="case-price">◈ ' + fmt(box.price) + '</div>' +
      '<div class="case-preview">' + preview + '</div>' +
      '<div class="case-odds"><i></i> Шанс ножа ' + knifeChance(box) + '%</div>' +
      '<button class="case-open" data-case="' + box.id + '">Открыть кейс</button>' +
      '</article>';
  }).join('');
}

function renderProfile() {
  el.pLevel.textContent = 'LVL ' + state.level;
  const need = 100 * state.level;
  el.pXp.textContent = state.xp + ' / ' + need + ' XP';
  el.pXpFill.style.width = Math.min(100, (state.xp / need) * 100) + '%';

  el.pBalance.textContent = fmt(state.balance) + ' ◈';
  el.pUpgrades.textContent = state.upgrades;
  const total = state.wins + state.losses;
  el.pWinrate.textContent = (total ? Math.round((state.wins / total) * 100) : 0) + '%';
  el.pWagered.textContent = fmt(state.wagered) + ' ◈';
  el.pWon.textContent = fmt(state.won) + ' ◈';
  el.pBest.textContent = fmt(state.best) + ' ◈';

  el.achCount.textContent = state.unlocked.length + '/' + ACHIEVEMENTS.length;
  el.achievements.innerHTML = ACHIEVEMENTS.map((a) =>
    '<div class="ach' + (state.unlocked.includes(a.id) ? ' on' : '') + '">' +
    '<div class="ach-icon">' + a.icon + '</div>' +
    '<div class="ach-txt"><b>' + esc(a.name) + '</b><span>' + esc(a.desc) + ' · +' + a.reward + ' ◈</span></div>' +
    '</div>'
  ).join('');

  renderHistory();
  renderDaily();
  renderLeaderboard();
}

function renderDaily() {
  ensureDaily();
  el.dailyQuests.innerHTML = DAILY_QUESTS.map((q) => {
    const cur = Math.min(q.goal, state.daily[q.key] || 0);
    const done = state.daily.claimed.includes(q.id) || cur >= q.goal;
    return '<div class="quest' + (done ? ' done' : '') + '">' +
      '<div class="quest-top"><b>' + esc(q.name) + '</b><span>+' + q.reward + ' ◈</span></div>' +
      '<div class="quest-bar"><i style="width:' + Math.round((cur / q.goal) * 100) + '%"></i></div>' +
      '<div class="quest-sub">' + cur + ' / ' + q.goal + '</div>' +
      '</div>';
  }).join('');
  el.questCount.textContent = state.daily.claimed.length + '/' + DAILY_QUESTS.length;
}

function renderLeaderboard() {
  const rows = BOTS.map((b) => ({ name: b.name, w: b.w, b: b.b, me: false }));
  rows.push({ name: 'Ты', w: Math.round(state.wagered), b: Math.round(state.best), me: true });
  rows.sort((a, b) => b.w - a.w);

  let list = rows.slice(0, 8);
  const me = rows.find((r) => r.me);
  if (me && !list.includes(me)) {
    list = rows.slice(0, 7).concat([me]);
  }

  el.leaderboard.innerHTML = list.map((r) => {
    const rank = rows.indexOf(r) + 1;
    return '<div class="board-row' + (r.me ? ' me' : '') + '">' +
      '<span class="board-rank">' + (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank) + '</span>' +
      '<span class="board-name">' + esc(r.name) + '</span>' +
      '<span class="board-val">оборот <b>' + fmt(r.w) + '</b></span>' +
      '<span class="board-val board-best">лучший <b>' + fmt(r.b) + '</b></span>' +
      '</div>';
  }).join('');
}

function renderHistory() {
  const sc = el.history.scrollTop;
  if (!state.history.length) {
    el.history.innerHTML = '<div class="hist-empty">Пока нет апгрейдов. Самое время начать!</div>';
    return;
  }
  el.history.innerHTML = state.history.slice(0, 80).map((h) => {
    const time = new Date(h.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const items = (h.items || []).join(', ') || '—';
    const mult = h.mode === 'case' ? 'КЕЙС' : h.mode === 'coin' ? 'МОНЕТА' : '×' + h.mult;
    const res = h.win ? '+' + fmt(h.prize) : '−' + fmt(h.stake);
    return '<div class="hist-row">' +
      '<span class="hist-time">' + time + '</span>' +
      '<span class="hist-items" title="' + esc(items) + '">' + esc(items) + '</span>' +
      '<span class="hist-mult">' + mult + '</span>' +
      '<span class="hist-stake">' + fmt(h.stake) + ' ◈</span>' +
      '<span class="hist-res ' + (h.win ? 'win' : 'lose') + '">' + res + '</span>' +
      '</div>';
  }).join('');
  el.history.scrollTop = sc;
}

function renderFair() {
  el.fairNonce.textContent = state.nonce;
  el.serverHash.textContent = serverHashHex ? serverHashHex.slice(0, 18) + '…' : '…';
  if (document.activeElement !== el.clientSeed) el.clientSeed.value = state.clientSeed;
  el.seedRow.hidden = !seedRevealed;
  el.serverSeed.textContent = state.serverSeed;
  el.revealSeed.textContent = seedRevealed ? 'Скрыть seed' : 'Показать seed';
}

function renderAll(opts = {}) {
  renderHeader(!!opts.animateBalance);
  renderInventory();
  renderShop();
  renderCases();
  renderProfile();
  renderFair();
  updateCoinUI();
  if ($('#view-profile').classList.contains('active')) requestAnimationFrame(drawChart);
}

function updateArena() {
  const bet = Math.min(betValue(), Math.max(0, state.balance));
  const stake = itemsValue(selectedItems()) + bet;
  const target = state.targetMode && state.targetId ? catalogById(state.targetId) : null;
  const mult = MULTIPLIERS.includes(state.mult) ? state.mult : 2;

  let chance;
  let potential;
  let shownMult;
  if (target) {
    chance = targetChance(stake, target.price);
    potential = target.price;
    shownMult = stake > 0 ? Math.round((target.price / stake) * 100) / 100 : 0;
  } else {
    chance = chanceOf(mult);
    potential = stake * mult;
    shownMult = mult;
  }

  const deg = chance * 3.6;

  el.chanceVal.textContent = (chance > 0 ? chance.toFixed(1).replace('.0', '') : '0') + '%';
  el.multVal.textContent = String(shownMult);
  el.stakeTotal.textContent = fmt(stake);
  el.potential.textContent = fmt(potential);

  el.wheelRing.style.background =
    'conic-gradient(from -90deg,#34e59a 0deg,#1fa86f ' + deg + 'deg,#3a1520 ' + deg + 'deg,#5a1b2c 360deg)';

  $$('.mult-btn', el.multRow).forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.mult) === mult);
  });
  $$('.mode-btn', el.modeRow).forEach((b) => {
    b.classList.toggle('active', (b.dataset.mode === 'item') === !!target);
  });
  el.arena.classList.toggle('item-mode', !!target);
  el.targetPick.hidden = !target;
  if (target) {
    el.targetEmoji.textContent = target.emoji;
    el.targetName.textContent = target.name;
    el.targetChance.textContent = chance > 0 ? chance + '%' : '—';
  }

  const can = stake > 0 && !spinning && (!target || chance >= 1);
  el.upgradeBtn.disabled = !can;
  el.upgradeBtn.classList.toggle('ready', can);

  if (spinning) el.arenaHint.textContent = 'Крутим...';
  else if (state.targetMode && !target) el.arenaHint.textContent = 'Выбери предмет-цель';
  else if (target && stake > 0 && chance < 1) el.arenaHint.textContent = 'Ставка слишком мала для этой цели';
  else if (stake > 0) el.arenaHint.textContent = target
    ? 'Ставка ' + fmt(stake) + ' ◈ → ' + target.emoji + ' ' + target.name
    : 'Ставка ' + fmt(stake) + ' ◈ → выигрыш ' + fmt(stake * mult) + ' ◈';
  else el.arenaHint.textContent = 'Выбери предметы или добавь монеты';
}

function setBusy(busy) {
  document.body.classList.toggle('busy', busy);
  el.coinBet.disabled = busy;
  if (busy) el.upgradeBtn.disabled = true;
  else updateArena();
}

function resetWheel() {
  el.wheelPointer.style.transform = 'rotate(0deg)';
  el.wheelLabel.textContent = 'ГОТОВ?';
  el.wheelLabel.className = 'wheel-label';
  el.wheelSub.textContent = 'Выбери множитель';
}

function animatePointer(totalDeg, duration) {
  return new Promise((resolve) => {
    const start = performance.now();
    let lastTick = -1;
    let raf = 0;
    let safety = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(safety);
      el.wheelPointer.style.transform = 'rotate(' + totalDeg + 'deg)';
      resolve();
    };

    // Страховка: если requestAnimationFrame приостановлен (фоновая вкладка),
    // раунд всё равно завершится и исход будет засчитан.
    safety = setTimeout(finish, duration + 800);

    el.wheelPointer.style.transform = 'rotate(0deg)';

    const step = (now) => {
      if (done) return;
      const p = clamp((now - start) / duration, 0, 1);
      const e = 1 - Math.pow(1 - p, 4);
      const angle = totalDeg * e;
      el.wheelPointer.style.transform = 'rotate(' + angle + 'deg)';

      const tick = Math.floor(angle / 18);
      if (tick !== lastTick) {
        lastTick = tick;
        if (p < 0.985) beep(1000 - p * 380, 0.018, 'square', 0.011);
      }

      if (p < 1) raf = requestAnimationFrame(step);
      else finish();
    };
    raf = requestAnimationFrame(step);
  });
}

/* ---------------- апгрейд ---------------- */
async function doUpgrade() {
  if (locked()) return;

  const items = selectedItems();
  const coinBet = clampBetInput();
  const stake = itemsValue(items) + coinBet;
  if (stake <= 0) {
    toast('Выбери предметы или добавь монеты');
    return;
  }

  const target = state.targetMode && state.targetId ? catalogById(state.targetId) : null;
  if (state.targetMode && !target) {
    toast('Выбери предмет-цель');
    return;
  }

  const mult = target
    ? Math.round((target.price / Math.max(1, stake)) * 100) / 100
    : (MULTIPLIERS.includes(state.mult) ? state.mult : 2);
  const chance = target ? targetChance(stake, target.price) : chanceOf(mult);
  if (chance < 1) {
    toast('Ставка слишком мала для этого предмета');
    return;
  }

  const itemUids = items.map((i) => i.uid);
  const itemNames = items.map((i) => {
    const c = catalogById(i.id);
    return c ? c.emoji + ' ' + c.name : '?';
  });

  spinning = true;
  setBusy(true);
  el.wheelLabel.textContent = '...';
  el.wheelLabel.className = 'wheel-label';
  el.wheelSub.textContent = target ? '🎯 ' + target.name : '×' + mult;

  let finished = false;
  try {
    const r = await roll();
    const win = r * 100 < chance;
    const prize = target ? target.price : Math.round(stake * mult);

    // Фиксируем исход ДО анимации: перезагрузка не переиграет раунд.
    state.pending = {
      mode: 'upgrade', ts: Date.now(), owner: TAB_ID, stake, mult, chance, win, prize,
      coinBet, itemUids, itemNames,
      targetId: target ? target.id : null,
      roll: r, nonce: state.nonce - 1,
    };
    save();

    const chanceDeg = chance * 3.6;
    const angle = win
      ? rand(2, Math.max(3, chanceDeg - 2))
      : rand(Math.min(357, chanceDeg + 2), 358);
    const spins = 4 + Math.floor(Math.random() * 2);

    await animatePointer(spins * 360 + angle, reduceMotion ? 700 : 3600);

    const p = settlePending();
    selected.clear();

    if (p) {
      if (p.win) {
        const wonTarget = p.targetId ? catalogById(p.targetId) : null;
        el.wheelLabel.textContent = 'WIN';
        el.wheelLabel.className = 'wheel-label win';
        el.wheelSub.textContent = wonTarget ? wonTarget.emoji + ' ' + wonTarget.name : '+' + fmt(p.prize) + ' ◈';
        beep(660, 0.10, 'sine', 0.05, 0);
        beep(880, 0.12, 'sine', 0.05, 0.10);
        beep(1320, 0.20, 'sine', 0.05, 0.22);
        if (wonTarget) {
          toast('Предмет получен: ' + wonTarget.name, 'win');
          pushFeed('Ты', wonTarget.id, p.mult, true, p.stake);
          confetti(wonTarget.price >= 1000 ? 160 : 100);
        } else {
          toast('Победа! +' + fmt(p.prize) + ' ◈', 'win');
          pushFeed('Ты', items[0]?.id, p.mult, true, p.stake);
          confetti(p.prize >= 1000 ? 150 : 90);
        }
      } else {
        el.wheelLabel.textContent = 'LOSE';
        el.wheelLabel.className = 'wheel-label lose';
        el.wheelSub.textContent = '−' + fmt(p.stake) + ' ◈';
        beep(240, 0.18, 'sawtooth', 0.035, 0);
        beep(160, 0.28, 'sawtooth', 0.03, 0.12);
        toast('Не повезло. −' + fmt(p.stake) + ' ◈', 'lose');
        pushFeed('Ты', items[0]?.id, p.mult, false, p.stake);
      }
      renderAll({ animateBalance: true });
    }

    await wait(reduceMotion ? 200 : 900);
    finished = true;
  } catch (err) {
    console.error(err);
    if (state.pending) settlePending();
    toast('Ошибка раунда. Попробуй ещё раз');
    renderAll();
  } finally {
    if (!finished) resetWheel();
    spinning = false;
    setBusy(false);
    updateArena();
  }
}

/* ---------------- кейсы ---------------- */
const WIN_INDEX = 38;
const REEL_LEN = 44;
let reelTickTimer = 0;

function buildReel(box, winnerId) {
  const ids = [];
  for (let i = 0; i < REEL_LEN; i++) {
    ids.push(i === WIN_INDEX ? winnerId : pickWeighted(box.pool, Math.random()));
  }
  el.caseReel.innerHTML = ids.map((id) => {
    const c = catalogById(id);
    if (!c) return '';
    const r = rarityOf(c);
    return '<div class="case-item" style="--c1:' + c.c1 + ';--c2:' + c.c2 + ';--rar:' + r.color + '">' +
      '<span class="item-glow" aria-hidden="true"></span>' +
      '<span class="item-art" aria-hidden="true">' + c.emoji + '</span>' +
      '<span class="item-emoji">' + c.emoji + '</span>' +
      '<span class="item-name">' + esc(c.name) + '</span>' +
      '<span class="item-price">◈ ' + fmt(c.price) + '</span>' +
      '<span class="item-rar" aria-hidden="true"></span>' +
      '</div>';
  }).join('');
}

function startTicks(duration) {
  clearTimeout(reelTickTimer);
  let t = 0;
  let delay = 40;
  const step = () => {
    if (t >= duration) return;
    beep(1250 - t * 0.13, 0.012, 'square', 0.007);
    t += delay;
    delay *= 1.05;
    reelTickTimer = setTimeout(step, delay);
  };
  step();
}

function spinReel() {
  const winEl = el.caseReel.children[WIN_INDEX];
  if (!winEl) return;

  // Считаем по layout-метрикам (offsetLeft/offsetWidth), а не по
  // getBoundingClientRect: они не зависят от scale-анимации модалки.
  const wrapW = el.reelWrap.clientWidth;
  const offset = Math.max(0, winEl.offsetLeft + winEl.offsetWidth / 2 - wrapW / 2);
  const dur = reduceMotion ? 0.7 : 4.6;

  el.caseReel.style.transition = 'none';
  el.caseReel.style.transform = 'translate3d(0,0,0)';
  void el.caseReel.offsetWidth;

  el.caseReel.style.transition = 'transform ' + dur + 's cubic-bezier(.12,.72,.1,1)';
  el.caseReel.style.transform = 'translate3d(' + (-offset) + 'px,0,0)';
  startTicks(dur * 1000);
}

function resetReel() {
  clearTimeout(reelTickTimer);
  el.caseReel.style.transition = 'none';
  el.caseReel.style.transform = 'translate3d(0,0,0)';
  $$('.case-item.won', el.caseReel).forEach((n) => n.classList.remove('won'));
  el.caseResult.classList.remove('reveal');
}

function openModal(box) {
  currentCaseId = box.id;
  el.caseTitle.textContent = box.name;
  el.caseResult.textContent = '';
  el.caseResult.classList.remove('reveal');
  el.caseAgain.disabled = true;
  el.caseModal.classList.add('open');
  el.caseModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  const card = el.caseModal.querySelector('.modal-card');
  if (card) card.focus();
}

function closeCase() {
  if (caseOpening) return;
  el.caseModal.classList.remove('open');
  el.caseModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  el.caseAgain.disabled = true;
  resetReel();
}

function showCaseResult(p, winner) {
  el.caseResult.classList.remove('reveal');
  void el.caseResult.offsetWidth;

  const winEl = el.caseReel.children[WIN_INDEX];
  if (winEl) winEl.classList.add('won');

  if (!p || !winner) {
    el.caseResult.textContent = 'Готово';
    return;
  }
  const r = rarityOf(winner);
  el.caseResult.innerHTML =
    '<span class="win-name" style="color:' + r.color + '">' + winner.emoji + ' ' + esc(winner.name) + '</span>' +
    '<span class="win-price">≈ ' + fmt(winner.price) + ' ◈ · в инвентарь</span>';
  el.caseResult.classList.add('reveal');
}

async function openCase(caseId) {
  if (locked()) return;
  const box = CASES.find((c) => c.id === caseId);
  if (!box) return;

  if (state.balance < box.price) {
    toast('Недостаточно монет');
    beep(180, 0.16, 'sawtooth', 0.03);
    return;
  }

  caseOpening = true;
  document.body.classList.add('case-busy');
  el.caseTake.disabled = true;
  el.caseClose.disabled = true;
  el.caseAgain.disabled = true;

  try {
    const r = await roll();
    const winnerId = pickWeighted(box.pool, r);
    const winner = catalogById(winnerId);

    // Фиксируем исход до анимации.
    state.pending = {
      mode: 'case', ts: Date.now(), owner: TAB_ID, caseId: box.id, caseName: box.name,
      itemId: winnerId, price: box.price, roll: r, nonce: state.nonce - 1,
    };
    save();

    buildReel(box, winnerId);
    openModal(box);
    await nextFrame();
    spinReel();
    await wait(reduceMotion ? 900 : 4900);

    const p = settlePending();
    showCaseResult(p, winner);
    renderAll({ animateBalance: true });
    el.caseAgain.disabled = false;

    if (winner && winner.rarity === 'knife') {
      confetti(160);
      beep(660, 0.12, 'sine', 0.05, 0);
      beep(990, 0.14, 'sine', 0.05, 0.12);
      beep(1320, 0.22, 'sine', 0.05, 0.26);
      toast('Джекпот! ' + winner.name, 'win');
    } else {
      beep(520, 0.08, 'sine', 0.04, 0);
      beep(780, 0.12, 'sine', 0.04, 0.09);
      toast('Из кейса: ' + (winner ? winner.name : 'предмет'));
    }
  } catch (err) {
    console.error(err);
    if (state.pending) settlePending();
    toast('Ошибка открытия кейса');
    renderAll();
  } finally {
    caseOpening = false;
    document.body.classList.remove('case-busy');
    el.caseTake.disabled = false;
    el.caseClose.disabled = false;
  }
}

/* ---------------- монетка ---------------- */
function coinAmountValue() {
  const n = Math.floor(Number(el.coinAmount.value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function clampCoinInput() {
  const v = clamp(coinAmountValue(), 0, Math.max(0, state.balance));
  if (String(v) !== el.coinAmount.value) el.coinAmount.value = v;
  return v;
}
function updateCoinUI() {
  const amount = Math.min(coinAmountValue(), Math.max(0, state.balance));
  const can = amount > 0 && !locked();
  el.flipBtn.disabled = !can;
  el.flipBtn.classList.toggle('ready', can);
  $$('.side-btn', el.coinSides).forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.side) === state.coinSide);
  });
  if (!coinBusy) {
    el.coinHint.textContent = amount > 0
      ? 'Ставка ' + fmt(amount) + ' ◈ → выигрыш ' + fmt(amount * 2) + ' ◈'
      : 'Шанс 47.5% · выплата ×2';
  }
  el.coinStats.textContent = state.coinWins;
}

async function flipCoin() {
  if (locked()) return;
  const amount = clampCoinInput();
  if (amount <= 0) { toast('Поставь монеты'); return; }
  if (amount > state.balance) { toast('Недостаточно монет'); return; }

  const side = state.coinSide;
  coinBusy = true;
  updateCoinUI();
  el.coin.style.transition = 'none';
  el.coin.style.transform = 'rotateY(0deg)';
  void el.coin.offsetWidth;

  try {
    const r = await roll();
    const win = r * 100 < COIN_CHANCE;
    const prize = amount * 2;

    // Исход фиксируется до анимации.
    state.pending = {
      mode: 'coinflip', ts: Date.now(), owner: TAB_ID, stake: amount, side, win, prize,
      roll: r, nonce: state.nonce - 1,
    };
    save();

    const land = win ? side : 1 - side;
    const deg = 5 * 360 + (land ? 180 : 0);
    el.coin.style.transition = 'transform ' + (reduceMotion ? 0.4 : 1.9) + 's cubic-bezier(.2,.8,.2,1)';
    el.coin.style.transform = 'rotateY(' + deg + 'deg)';
    await wait(reduceMotion ? 600 : 2100);

    const p = settlePending();
    if (p) {
      if (p.win) {
        el.coinHint.textContent = 'Победа! +' + fmt(p.prize) + ' ◈';
        toast('Монетка: победа +' + fmt(p.prize) + ' ◈', 'win');
        confetti(p.prize >= 2000 ? 140 : 80);
        beep(660, 0.10, 'sine', 0.05, 0);
        beep(880, 0.12, 'sine', 0.05, 0.10);
        beep(1320, 0.20, 'sine', 0.05, 0.22);
      } else {
        el.coinHint.textContent = 'Не угадал. −' + fmt(p.stake) + ' ◈';
        toast('Монетка: −' + fmt(p.stake) + ' ◈', 'lose');
        beep(240, 0.18, 'sawtooth', 0.035, 0);
        beep(160, 0.28, 'sawtooth', 0.03, 0.12);
      }
      renderAll({ animateBalance: true });
    }
  } catch (err) {
    console.error(err);
    if (state.pending) settlePending();
    toast('Ошибка раунда. Попробуй ещё раз');
    renderAll();
  } finally {
    coinBusy = false;
    updateCoinUI();
  }
}

/* ---------------- цель апгрейда ---------------- */
function renderTargetGrid() {
  const bet = Math.min(betValue(), Math.max(0, state.balance));
  const stake = itemsValue(selectedItems()) + bet;
  el.targetGrid.innerHTML = CATALOG.slice().sort((a, b) => a.price - b.price).map((c) => {
    const r = rarityOf(c);
    const ch = targetChance(stake, c.price);
    const low = ch < 1;
    const label = stake > 0 ? (low ? 'нужна ставка больше' : 'шанс ' + ch + '%') : 'шанс —';
    return '<button class="target-item' + (state.targetId === c.id ? ' sel' : '') + '" data-target-id="' + c.id + '"' +
      ' style="--c1:' + c.c1 + ';--c2:' + c.c2 + ';--rar:' + r.color + '" title="' + esc(c.name) + '">' +
      '<span class="item-glow" aria-hidden="true"></span>' +
      '<span class="item-art" aria-hidden="true">' + c.emoji + '</span>' +
      '<span class="t-emoji">' + c.emoji + '</span>' +
      '<span class="t-name">' + esc(c.name) + '</span>' +
      '<span class="t-price">◈ ' + fmt(c.price) + '</span>' +
      '<span class="t-chance' + (low ? ' low' : '') + '">' + label + '</span>' +
      '</button>';
  }).join('');
}

function openTargetPicker() {
  if (locked()) return;
  renderTargetGrid();
  el.targetModal.classList.add('open');
  el.targetModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  const card = el.targetModal.querySelector('.modal-card');
  if (card) card.focus();
}

function closeTargetPicker() {
  el.targetModal.classList.remove('open');
  el.targetModal.setAttribute('aria-hidden', 'true');
  if (!el.caseModal.classList.contains('open')) document.body.classList.remove('modal-open');
}

function chooseTarget(id) {
  const c = catalogById(id);
  if (!c) return;
  state.targetId = c.id;
  state.targetMode = true;
  save();
  closeTargetPicker();
  updateArena();
  beep(720, 0.05, 'sine', 0.03);
  toast('Цель: ' + c.name);
}

/* ---------------- промокод ---------------- */
function redeemPromo() {
  if (locked()) return;
  const code = String(el.promoInput.value || '').trim().toUpperCase();
  if (!code) { toast('Введи промокод'); return; }
  const amount = PROMOS[code];
  if (!amount) {
    toast('Такого промокода нет');
    beep(180, 0.16, 'sawtooth', 0.03);
    return;
  }
  if (state.promos.includes(code)) { toast('Этот промокод уже использован'); return; }

  state.promos.push(code);
  state.balance += amount;
  checkAchievements();
  recordBalance();
  save();
  el.promoInput.value = '';
  renderAll({ animateBalance: true });
  toast('Промокод активирован: +' + fmt(amount) + ' ◈', 'win');
  beep(520, 0.10, 'sine', 0.05, 0);
  beep(780, 0.14, 'sine', 0.05, 0.11);
  beep(1040, 0.18, 'sine', 0.05, 0.24);
}

/* ---------------- онлайн ---------------- */
let onlineCount = 1100 + Math.floor(Math.random() * 500);
function renderOnline() {
  if (!el.online) return;
  const b = el.online.querySelector('b');
  if (b) b.textContent = fmt(onlineCount);
}
function onlineLoop() {
  onlineCount = clamp(onlineCount + Math.floor(rand(-25, 30)), 780, 2400);
  renderOnline();
  setTimeout(onlineLoop, rand(4000, 9000));
}

/* ---------------- магазин / продажа ---------------- */
function buyItem(id) {
  if (locked()) return;
  const c = catalogById(id);
  if (!c) return;
  if (state.balance < c.price) {
    toast('Недостаточно монет');
    beep(180, 0.16, 'sawtooth', 0.03);
    return;
  }
  state.balance -= c.price;
  state.inventory.push({ uid: uid(), id: c.id });
  checkAchievements();
  recordBalance();
  save();
  renderAll({ animateBalance: true });
  toast('Куплено: ' + c.name);
  beep(560, 0.06, 'sine', 0.03, 0);
  beep(740, 0.08, 'sine', 0.03, 0.06);
}

function sellSelected() {
  if (locked()) return;
  const items = selectedItems();
  if (!items.length) { toast('Ничего не выбрано'); return; }
  const gain = Math.round(itemsValue(items) * 0.85);
  const uids = new Set(items.map((i) => i.uid));
  state.balance += gain;
  state.inventory = state.inventory.filter((it) => !uids.has(it.uid));
  selected.clear();
  checkAchievements();
  recordBalance();
  save();
  renderAll({ animateBalance: true });
  toast('Продано на ' + fmt(gain) + ' ◈ (85%)');
  beep(680, 0.08, 'sine', 0.03);
}

/* ---------------- бонус ---------------- */
function claimBonus() {
  if (locked()) return;
  const now = Date.now();
  const left = DAY - (now - state.lastBonus);
  if (left > 0) {
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    toast('Бонус уже получен. Следующий через ' + h + ' ч ' + m + ' мин');
    return;
  }
  state.lastBonus = now;
  state.balance += 500;
  checkAchievements();
  recordBalance();
  save();
  renderAll({ animateBalance: true });
  toast('Ежедневный бонус +500 ◈', 'win');
  beep(520, 0.10, 'sine', 0.05, 0);
  beep(780, 0.14, 'sine', 0.05, 0.11);
  beep(1040, 0.18, 'sine', 0.05, 0.24);
}

/* ---------------- live feed ---------------- */
function pushFeed(user, itemId, mult, win, stake) {
  const c = itemId ? catalogById(itemId) : null;
  const emoji = c ? c.emoji : '◈';
  const c1 = c ? c.c1 : '#ffcf6b';
  const c2 = c ? c.c2 : '#4a2a05';
  const result = win ? '+' + fmt(stake * mult) : '−' + fmt(stake);
  const big = win && stake * mult >= 1500;

  const row = document.createElement('div');
  row.className = 'feed-row ' + (win ? 'win' : 'lose') + (big ? ' big' : '');
  row.innerHTML =
    '<span class="feed-user">' + esc(user) + '</span>' +
    '<span class="feed-item" style="--c1:' + c1 + ';--c2:' + c2 + '">' + emoji + '</span>' +
    '<span class="feed-mult">×' + mult + '</span>' +
    '<span class="feed-res">' + result + '</span>';
  el.feed.prepend(row);
  while (el.feed.children.length > 16) el.feed.lastElementChild.remove();
}

function fakeFeedEvent() {
  const c = CATALOG[Math.floor(Math.random() * CATALOG.length)];
  const mult = MULTIPLIERS[Math.floor(Math.random() * MULTIPLIERS.length)];
  const win = Math.random() * 100 < chanceOf(mult);
  const user = USERS[Math.floor(Math.random() * USERS.length)];
  pushFeed(user, c.id, mult, win, c.price);
}

function feedLoop() {
  fakeFeedEvent();
  setTimeout(feedLoop, rand(1600, 4200));
}

/* ---------------- конфетти ---------------- */
const fxCanvas = $('#confetti');
const fxCtx = fxCanvas.getContext('2d');
let fxParts = [];
let fxRaf = 0;
let dpr = 1;

function sizeFx() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  fxCanvas.width = Math.floor(window.innerWidth * dpr);
  fxCanvas.height = Math.floor(window.innerHeight * dpr);
}
sizeFx();

const FX_COLORS = ['#8b5cf6', '#22d3ee', '#ffcf6b', '#34e59a', '#ff5c7a', '#ffffff'];

function confetti(count = 100) {
  if (reduceMotion || !fxCtx) return;
  const w = window.innerWidth;
  for (let i = 0; i < count; i++) {
    fxParts.push({
      x: w / 2 + rand(-w * 0.36, w * 0.36),
      y: -20 - rand(0, 140),
      vx: rand(-2.2, 2.2),
      vy: rand(1.6, 5.6),
      g: rand(0.03, 0.08),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.12, 0.12),
      size: rand(4, 10),
      color: FX_COLORS[Math.floor(Math.random() * FX_COLORS.length)],
      life: 1,
    });
  }
  if (!fxRaf) fxLoop();
}

function fxLoop() {
  if (!fxCtx) return;
  fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  fxParts = fxParts.filter((p) => p.life > 0 && p.y < window.innerHeight + 50);

  for (const p of fxParts) {
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= 0.0022;

    fxCtx.save();
    fxCtx.globalAlpha = Math.max(0, Math.min(1, p.life));
    fxCtx.translate(p.x, p.y);
    fxCtx.rotate(p.rot);
    fxCtx.fillStyle = p.color;
    fxCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    fxCtx.restore();
  }

  if (fxParts.length) fxRaf = requestAnimationFrame(fxLoop);
  else {
    fxRaf = 0;
    fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

/* ---------------- график ---------------- */
function drawChart() {
  const c = el.chart;
  if (!c) return;
  const w = c.clientWidth;
  if (w < 20) return;
  const h = 180;
  const scale = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.floor(w * scale);
  c.height = Math.floor(h * scale);

  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(148,163,184,.10)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const data = state.balanceHistory.slice(-60);
  if (data.length < 2) {
    ctx.fillStyle = 'rgba(139,150,173,.85)';
    ctx.font = '12px Manrope, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Пока недостаточно данных', w / 2, h / 2);
    return;
  }

  const vals = data.map((d) => Number(d.v) || 0);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (min === max) { min -= 100; max += 100; }

  const padX = 10;
  const padY = 18;
  const X = (i) => padX + (i / (vals.length - 1)) * (w - padX * 2);
  const Y = (v) => h - padY - ((v - min) / (max - min)) * (h - padY * 2);

  const fill = ctx.createLinearGradient(0, 0, 0, h);
  fill.addColorStop(0, 'rgba(34,211,238,.34)');
  fill.addColorStop(1, 'rgba(34,211,238,0)');
  ctx.beginPath();
  ctx.moveTo(X(0), Y(vals[0]));
  for (let i = 1; i < vals.length; i++) ctx.lineTo(X(i), Y(vals[i]));
  ctx.lineTo(X(vals.length - 1), h - padY);
  ctx.lineTo(X(0), h - padY);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();

  const stroke = ctx.createLinearGradient(0, 0, w, 0);
  stroke.addColorStop(0, '#8b5cf6');
  stroke.addColorStop(1, '#22d3ee');
  ctx.beginPath();
  ctx.moveTo(X(0), Y(vals[0]));
  for (let i = 1; i < vals.length; i++) ctx.lineTo(X(i), Y(vals[i]));
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(34,211,238,.7)';
  ctx.shadowBlur = 14;
  ctx.stroke();
  ctx.shadowBlur = 0;

  const lx = X(vals.length - 1);
  const ly = Y(vals[vals.length - 1]);
  ctx.beginPath();
  ctx.arc(lx, ly, 8, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(34,211,238,.2)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(lx, ly, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#22d3ee';
  ctx.fill();
}

/* ---------------- навигация ---------------- */
function navigate(view) {
  const target = $('#view-' + view);
  if (!target) return;
  $$('.view').forEach((v) => v.classList.toggle('active', v === target));
  $$('[data-nav] [data-view]').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  if (view === 'profile') requestAnimationFrame(drawChart);
  if (view === 'cases') renderCases();
}

/* ---------------- события ---------------- */
function bindEvents() {
  // навигация
  document.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-view]');
    if (!nav) return;
    e.preventDefault();
    navigate(nav.dataset.view);
    if (nav.classList.contains('tab') || nav.classList.contains('bottom-nav')) beep(520, 0.04, 'sine', 0.02);
  });

  // инвентарь
  el.inventory.addEventListener('click', (e) => {
    if (locked()) return;
    const card = e.target.closest('.item-card');
    if (!card) return;
    const u = card.dataset.uid;
    if (selected.has(u)) selected.delete(u);
    else selected.add(u);
    renderInventory();
    beep(selected.has(u) ? 760 : 480, 0.04, 'sine', 0.02);
  });

  // ставка
  el.coinBet.addEventListener('input', updateArena);
  el.coinBet.addEventListener('blur', () => { clampBetInput(); updateArena(); });
  el.betMinus.addEventListener('click', () => {
    if (locked()) return;
    el.coinBet.value = Math.max(0, betValue() - 100);
    updateArena();
  });
  el.betPlus.addEventListener('click', () => {
    if (locked()) return;
    el.coinBet.value = Math.min(state.balance, betValue() + 100);
    updateArena();
  });
  el.quickBets.addEventListener('click', (e) => {
    const b = e.target.closest('[data-bet]');
    if (!b || locked()) return;
    const v = b.dataset.bet === 'max' ? state.balance : Number(b.dataset.bet);
    el.coinBet.value = clamp(Math.floor(v), 0, Math.max(0, state.balance));
    updateArena();
    beep(600, 0.04, 'sine', 0.02);
  });

  // множители
  el.multRow.addEventListener('click', (e) => {
    const b = e.target.closest('.mult-btn');
    if (!b || locked()) return;
    state.mult = Number(b.dataset.mult);
    save();
    updateArena();
    beep(620, 0.04, 'sine', 0.02);
  });

  // апгрейд
  el.upgradeBtn.addEventListener('click', doUpgrade);

  // режим апгрейда: монеты / предмет
  el.modeRow.addEventListener('click', (e) => {
    const b = e.target.closest('.mode-btn');
    if (!b || locked()) return;
    state.targetMode = b.dataset.mode === 'item';
    save();
    if (state.targetMode && !state.targetId) openTargetPicker();
    else updateArena();
    beep(620, 0.04, 'sine', 0.02);
  });
  el.targetPick.addEventListener('click', () => {
    if (locked()) return;
    openTargetPicker();
  });
  el.targetGrid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-target-id]');
    if (!b) return;
    chooseTarget(b.dataset.targetId);
  });
  el.targetClose.addEventListener('click', closeTargetPicker);
  el.targetModal.addEventListener('click', (e) => {
    if (e.target === el.targetModal) closeTargetPicker();
  });

  // монетка
  el.coinSides.addEventListener('click', (e) => {
    const b = e.target.closest('.side-btn');
    if (!b || locked()) return;
    state.coinSide = Number(b.dataset.side) === 1 ? 1 : 0;
    save();
    updateCoinUI();
    beep(620, 0.04, 'sine', 0.02);
  });
  el.coinAmount.addEventListener('input', updateCoinUI);
  el.coinAmount.addEventListener('blur', () => { clampCoinInput(); updateCoinUI(); });
  el.coinMinus.addEventListener('click', () => {
    if (locked()) return;
    el.coinAmount.value = Math.max(0, coinAmountValue() - 100);
    updateCoinUI();
  });
  el.coinPlus.addEventListener('click', () => {
    if (locked()) return;
    el.coinAmount.value = Math.min(state.balance, coinAmountValue() + 100);
    updateCoinUI();
  });
  el.coinQuick.addEventListener('click', (e) => {
    const b = e.target.closest('[data-bet]');
    if (!b || locked()) return;
    const v = b.dataset.bet === 'max' ? state.balance : Number(b.dataset.bet);
    el.coinAmount.value = clamp(Math.floor(v), 0, Math.max(0, state.balance));
    updateCoinUI();
    beep(600, 0.04, 'sine', 0.02);
  });
  el.flipBtn.addEventListener('click', flipCoin);

  // промокод
  el.promoBtn.addEventListener('click', redeemPromo);
  el.promoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') redeemPromo();
  });

  // продажа / сброс
  el.sellBtn.addEventListener('click', sellSelected);
  el.clearStake.addEventListener('click', () => {
    if (locked()) return;
    selected.clear();
    renderInventory();
  });

  // магазин
  el.shopFilters.addEventListener('click', (e) => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    shopFilter = b.dataset.filter;
    $$('.chip', el.shopFilters).forEach((c) => c.classList.toggle('active', c === b));
    renderShop();
  });
  el.shopGrid.addEventListener('click', (e) => {
    const card = e.target.closest('[data-buy]');
    if (!card || locked()) return;
    buyItem(card.dataset.buy);
  });

  // кейсы
  el.caseGrid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-case]');
    if (!b) return;
    openCase(b.dataset.case);
  });
  el.caseClose.addEventListener('click', closeCase);
  el.caseTake.addEventListener('click', closeCase);
  el.caseAgain.addEventListener('click', () => {
    if (caseOpening || !currentCaseId) return;
    const id = currentCaseId;
    closeCase();
    openCase(id);
  });
  el.caseModal.addEventListener('click', (e) => {
    if (e.target === el.caseModal) closeCase();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (el.caseModal.classList.contains('open')) closeCase();
    else if (el.targetModal.classList.contains('open')) closeTargetPicker();
  });

  // бонус / звук
  el.bonusBtn.addEventListener('click', claimBonus);
  el.soundBtn.addEventListener('click', () => {
    state.sound = !state.sound;
    save();
    renderHeader(false);
    if (state.sound) beep(700, 0.06, 'sine', 0.03);
  });

  // fair
  el.revealSeed.addEventListener('click', () => {
    seedRevealed = !seedRevealed;
    renderFair();
  });
  el.newSeed.addEventListener('click', () => {
    if (locked()) return;
    state.serverSeed = randomHex(16);
    state.nonce = 0;
    seedRevealed = false;
    save();
    refreshServerHash();
    renderFair();
    toast('Создан новый server seed');
  });
  el.clientSeed.addEventListener('change', () => {
    if (locked()) return;
    let v = el.clientSeed.value.replace(/[^\w\-\. ]/g, '').slice(0, 24).trim();
    if (!v) v = 'player-' + randomHex(3);
    state.clientSeed = v;
    state.nonce = 0;
    el.clientSeed.value = v;
    save();
    renderFair();
    toast('Client seed обновлён');
  });

  // профиль
  el.resetBtn.addEventListener('click', () => {
    if (locked()) return;
    if (!confirm('Сбросить весь прогресс? Баланс, инвентарь, история и достижения будут удалены.')) return;
    state = defaultState();
    selected.clear();
    serverHashHex = '';
    seedRevealed = false;
    shownBalance = state.balance;
    save();
    renderAll();
    refreshServerHash();
    requestAnimationFrame(drawChart);
    toast('Прогресс сброшен');
  });

  // пробел — крутить
  document.addEventListener('keydown', (e) => {
    if (e.code !== 'Space' || e.repeat) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'button') return;
    if (locked()) return;
    if ($('#view-coin').classList.contains('active')) {
      e.preventDefault();
      flipCoin();
      return;
    }
    if (!$('#view-play').classList.contains('active')) return;
    e.preventDefault();
    doUpgrade();
  });

  // ресайз
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      sizeFx();
      if ($('#view-profile').classList.contains('active')) drawChart();
    }, 150);
  });

  // синхронизация между вкладками
  window.addEventListener('storage', (e) => {
    if (e.key !== LS) return;
    if (spinning || caseOpening || coinBusy) return;
    const next = loadState();
    if (next.pending) {
      // В другой вкладке идёт раунд: блокируем действия и ждём его завершения.
      state = next;
      remoteBusy = true;
      renderAll();
      scheduleRemotePending();
      return;
    }
    remoteBusy = false;
    clearTimeout(remoteTimer);
    state = next;
    selected.clear();
    shownBalance = state.balance;
    renderAll();
    if ($('#view-profile').classList.contains('active')) drawChart();
  });
}

function buildMultipliers() {
  el.multRow.innerHTML = MULTIPLIERS.map((m) => {
    const ch = chanceOf(m);
    return '<button class="mult-btn" data-mult="' + m + '" title="Шанс ' + ch.toFixed(1).replace('.0', '') + '%">×' + m + '</button>';
  }).join('');
}

/* ---------------- старт ---------------- */
function init() {
  bindEvents();
  buildMultipliers();

  let settled = null;
  if (state.pending) {
    const mine = !state.pending.owner || state.pending.owner === TAB_ID;
    const age = Date.now() - (Number(state.pending.ts) || 0);
    if (mine || age > PENDING_LEASE) {
      settled = settlePending();
    } else {
      // Раунд идёт в другой вкладке — не трогаем его.
      remoteBusy = true;
      scheduleRemotePending();
    }
  }

  renderAll();
  refreshServerHash();
  renderOnline();
  setTimeout(onlineLoop, 4000);
  fakeFeedEvent();
  fakeFeedEvent();
  fakeFeedEvent();
  setTimeout(feedLoop, 1500);

  if (settled) {
    setTimeout(() => {
      if (settled.mode === 'upgrade') {
        const wonTarget = settled.targetId ? catalogById(settled.targetId) : null;
        toast(
          settled.win
            ? (wonTarget
                ? 'Предмет-цель получен: ' + wonTarget.name
                : 'Предыдущий апгрейд завершён: +' + fmt(settled.prize) + ' ◈')
            : 'Предыдущий апгрейд завершён: −' + fmt(settled.stake) + ' ◈',
          settled.win ? 'win' : 'lose'
        );
      } else if (settled.mode === 'coinflip') {
        toast(
          settled.win
            ? 'Монетка завершена: +' + fmt(settled.prize) + ' ◈'
            : 'Монетка завершена: −' + fmt(settled.stake) + ' ◈',
          settled.win ? 'win' : 'lose'
        );
      } else {
        toast('Кейс был открыт — предмет уже в инвентаре', 'win');
      }
    }, 700);
  }

  if ($('#view-profile').classList.contains('active')) requestAnimationFrame(drawChart);
}

init();
