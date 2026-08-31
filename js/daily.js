/* card-roguelike — daily challenge & seed system
   Seeded RNG, daily challenge mode, seed share/import, achievement system.
   Classic script loaded via <script src>; shares global scope with siblings. */

// ===================== SEEDED RNG (mulberry32) =====================
let _seedState = null;

function seedRNG(seed) {
  _seedState = seed >>> 0;
}

function seededRandom() {
  if (_seedState === null) return Math.random();
  _seedState = (_seedState + 0x6D2B79F5) >>> 0;
  let t = _seedState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function seededInt(max) {
  return Math.floor(seededRandom() * max);
}

function seededShuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = seededInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function seededPick(arr) {
  return arr[seededInt(arr.length)];
}

// Hash a string to a 32-bit integer for seeding
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ===================== DAILY CHALLENGE =====================
const DAILY_KEY = 'shadow_rift_daily';

function getDailyDateStr() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

function getDailySeed() {
  return hashString('shadow_rift_' + getDailyDateStr());
}

function getDailyRules() {
  const seed = getDailySeed();
  seedRNG(seed);
  const classKeys = Object.keys(CLASSES);
  const forcedClass = seededPick(classKeys);
  const difficulty = seededPick(['easy', 'normal', 'normal', 'hard']);
  const mode = seededPick(['standard', 'standard', 'endless', 'sprint']);

  const modifiers = [];
  const modPool = [
    { id: 'double_hp', name: '双倍生命', desc: '英雄初始生命值翻倍', apply: g => { g.player.maxHp *= 2; g.player.hp = g.player.maxHp; } },
    { id: 'half_hp', name: '半血挑战', desc: '英雄初始生命值减半', apply: g => { g.player.maxHp = Math.floor(g.player.maxHp / 2); g.player.hp = g.player.maxHp; } },
    { id: 'extra_gold', name: '赏金猎人', desc: '所有金币获取翻倍', apply: g => { g.goldMult = 2; } },
    { id: 'no_relic', name: '禁遗物', desc: '本局无法获得任何遗物', apply: g => { g.noRelics = true; } },
    { id: 'start_relic', name: '遗物开局', desc: '开局额外获得2件随机遗物', apply: g => { for (let i = 0; i < 2; i++) grantRelic(g); } },
    { id: 'big_deck', name: '厚牌组', desc: '初始牌组额外加入5张随机卡', apply: g => {
      const pool = CARD_POOL.filter(c => c.rarity !== 'legendary');
      for (let i = 0; i < 5; i++) {
        const c = seededPick(pool);
        g.player.deck.push({ ...c, uid: uid() });
      }
    }},
    { id: 'glass_cannon', name: '玻璃大炮', desc: '英雄攻击力+3但生命值-10', apply: g => { g.player.maxHp = Math.max(1, g.player.maxHp - 10); g.player.hp = g.player.maxHp; g.attackBonus = (g.attackBonus || 0) + 3; } },
    { id: 'mana_boost', name: '法力充盈', desc: '每回合额外获得1点法力', apply: g => { g.manaBoost = 1; } },
  ];

  const numMods = 1 + seededInt(3);
  for (let i = 0; i < numMods; i++) {
    const mod = seededPick(modPool);
    if (!modifiers.find(m => m.id === mod.id)) modifiers.push(mod);
  }

  return { seed, date: getDailyDateStr(), forcedClass, difficulty, mode, modifiers };
}

function getDailyProgress() {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch(e) { return {}; }
}

function isDailyCompleted() {
  const p = getDailyProgress();
  return p.date === getDailyDateStr() && p.completed;
}

function saveDailyResult(result, score) {
  try {
    const p = getDailyProgress();
    p.date = getDailyDateStr();
    p.completed = true;
    p.lastResult = result;
    p.lastScore = score;
    p.history = p.history || [];
    p.history.push({ date: getDailyDateStr(), result, score });
    if (p.history.length > 30) p.history = p.history.slice(-30);
    localStorage.setItem(DAILY_KEY, JSON.stringify(p));
  } catch(e) {}
}

function getDailyScore() {
  if (!G) return 0;
  let score = 0;
  score += G.act * 100;
  score += (G.player.hp / G.player.maxHp) * 50;
  score += G.gold;
  score += G.relics.length * 15;
  if (G.mode === 'endless') score += 200;
  if (G.mode === 'sprint') score += 50;
  if (G.difficulty === 'hard') score = Math.floor(score * 1.5);
  if (G.difficulty === 'easy') score = Math.floor(score * 0.7);
  return Math.floor(score);
}

// ===================== SEED INPUT / SHARE =====================
function generateShareSeed() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function seedToHash(seedStr) {
  return hashString(seedStr.toUpperCase());
}

function startDailyChallenge() {
  const rules = getDailyRules();
  currentMode = rules.mode;
  currentDifficulty = rules.difficulty;
  G_dailyChallenge = rules;

  initGame(rules.forcedClass);
  G.dailyChallenge = true;
  G.dailyRules = rules;

  rules.modifiers.forEach(mod => {
    try { mod.apply(G); } catch(e) {}
    log(`每日挑战规则：${mod.name} — ${mod.desc}`);
  });

  G.tutorial = false;
  generateMap(0);
  saveGame();
  hideOverlay('overlay-daily');
  showScreen('map');
  renderMap();
}

let G_dailyChallenge = null;

function showDailyChallenge() {
  const rules = getDailyRules();
  const cls = CLASSES[rules.forcedClass];
  const diff = DIFFICULTY_SETTINGS[rules.difficulty];
  const completed = isDailyCompleted();
  const progress = getDailyProgress();

  const container = document.getElementById('daily-content');
  if (!container) return;

  let html = `
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:28px;">📅 每日挑战</div>
      <div style="color:#888;font-size:13px;margin-top:4px;">${getDailyDateStr().slice(0,4)}-${getDailyDateStr().slice(4,6)}-${getDailyDateStr().slice(6,8)}</div>
    </div>
    <div style="background:rgba(0,0,0,0.4);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:12px;">
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px;">
        <div style="font-size:32px;">${cls.portraitImg ? '' : cls.portrait}</div>
        <div>
          <div style="color:${cls.color};font-weight:bold;font-size:15px;">${cls.name}</div>
          <div style="font-size:11px;color:#888;">${diff.name} · ${{standard:'标准',endless:'无限',sprint:'极速'}[rules.mode]}</div>
        </div>
      </div>
      <div style="border-top:1px solid var(--border);padding-top:10px;">
        <div style="font-size:12px;color:var(--gold);margin-bottom:6px;">特殊规则</div>
        ${rules.modifiers.map(m => `<div style="font-size:12px;color:#ccc;margin-bottom:3px;">• <span style="color:${cls.color};">${m.name}</span>：${m.desc}</div>`).join('')}
      </div>
    </div>
  `;

  if (completed) {
    html += `
      <div style="text-align:center;padding:10px;background:rgba(39,174,96,0.15);border:1px solid #27ae60;border-radius:8px;margin-bottom:12px;">
        <div style="color:#27ae60;font-size:14px;">✅ 今日已完成</div>
        <div style="color:#888;font-size:12px;margin-top:4px;">${progress.lastResult === 'victory' ? '通关' : '失败'} · 得分 ${progress.lastScore || 0}</div>
      </div>
    `;
  }

  html += `
    <div style="border-top:1px solid var(--border);padding-top:12px;margin-bottom:12px;">
      <div style="font-size:13px;color:var(--gold);margin-bottom:8px;">种子分享</div>
      <div style="display:flex;gap:8px;align-items:center;">
        <input id="seed-input" placeholder="输入种子码..." style="flex:1;background:#1a1a2e;border:1px solid var(--border);border-radius:6px;padding:8px 10px;color:#fff;font-size:13px;font-family:monospace;" />
        <button class="overlay-btn" style="padding:8px 14px;font-size:12px;min-height:36px;" onclick="importSeed()">导入</button>
      </div>
      <div style="font-size:11px;color:#666;margin-top:6px;">输入朋友的种子码可体验相同的随机序列（不含每日规则）</div>
    </div>
    <div style="border-top:1px solid var(--border);padding-top:12px;margin-bottom:16px;">
      <div style="font-size:12px;color:#888;">历史最佳得分</div>
      <div style="font-size:20px;color:var(--gold);font-weight:bold;">${getBestDailyScore()}</div>
    </div>
  `;

  if (!completed) {
    html += `<button class="overlay-btn green" style="width:100%;font-size:15px;padding:12px;" onclick="startDailyChallenge()">开始每日挑战</button>`;
  } else {
    html += `<button class="overlay-btn" style="width:100%;font-size:14px;padding:10px;opacity:0.6;" disabled>今日已完成，明天再来</button>`;
  }

  container.innerHTML = html;
  showOverlay('overlay-daily');
}

function getBestDailyScore() {
  const p = getDailyProgress();
  if (!p.history || p.history.length === 0) return 0;
  return Math.max(...p.history.map(h => h.score || 0));
}

function startCustomSeed(seedStr) {
  const seed = seedToHash(seedStr);
  seedRNG(seed);
  currentMode = 'standard';
  currentDifficulty = 'normal';
  G_dailyChallenge = null;
  G = null;
  _seedState = seed;

  const classKeys = Object.keys(CLASSES);
  const forcedClass = seededPick(classKeys);

  initGame(forcedClass);
  G.customSeed = seedStr;
  G.tutorial = false;
  generateMap(0);
  saveGame();
  hideOverlay('overlay-daily');
  showScreen('map');
  renderMap();
  log(`自定义种子局开始：${seedStr}`);
}

function importSeed() {
  const input = document.getElementById('seed-input');
  if (!input || !input.value.trim()) {
    alert('请输入种子码');
    return;
  }
  const seedStr = input.value.trim().toUpperCase();
  if (seedStr.length < 4) {
    alert('种子码至少4个字符');
    return;
  }
  startCustomSeed(seedStr);
}

function copyDailySeed() {
  const seedStr = generateShareSeed();
  navigator.clipboard?.writeText(seedStr).then(() => {
    alert(`种子码已复制：${seedStr}`);
  }).catch(() => {
    prompt('复制种子码：', seedStr);
  });
}

// ===================== ACHIEVEMENT SYSTEM =====================
const ACHIEVEMENT_KEY = 'shadow_rift_achievements';
let _achievementQueue = [];
let _achievementShowing = false;

const ACHIEVEMENTS = [
  // 通关类
  { id: 'first_victory', name: '初次通关', icon: '🏆', desc: '首次通关标准模式', hidden: false },
  { id: 'first_victory_hard', name: '硬核通关', icon: '💪', desc: '在困难难度下通关', hidden: false },
  { id: 'first_victory_endless', name: '无尽征途', icon: '♾️', desc: '通关无限模式（3幕后继续）', hidden: false },
  { id: 'first_victory_sprint', name: '速度恶魔', icon: '⚡', desc: '通关极速模式', hidden: false },
  { id: 'all_classes', name: '全能大师', icon: '🎓', desc: '用全部9个职业各通关一次', hidden: false },
  { id: 'no_relic_run', name: '苦行僧', icon: '📿', desc: '不获得任何遗物通关', hidden: false },
  { id: 'low_hp_victory', name: '丝血通关', icon: '❤️‍🩹', desc: '以1点生命值通关', hidden: false },
  { id: 'act4_clear', name: '虚空征服者', icon: '🌟', desc: '击败第4幕Boss', hidden: false },

  // 战斗类
  { id: 'first_blood', name: '初次战斗', icon: '⚔️', desc: '完成第一场战斗', hidden: false },
  { id: 'kill_50', name: '刽子手', icon: '💀', desc: '累计击败50个敌人', hidden: false },
  { id: 'kill_200', name: '杀戮者', icon: '☠️', desc: '累计击败200个敌人', hidden: false },
  { id: 'kill_500', name: '战神', icon: '🗡️', desc: '累计击败500个敌人', hidden: false },
  { id: 'one_turn_kill', name: '一回合击杀', icon: '💥', desc: '一回合内击败一个满血敌人', hidden: false },
  { id: 'boss_one_turn', name: '秒杀首领', icon: '👑', desc: '一回合内击败Boss', hidden: true },
  { id: 'big_damage', name: '毁灭打击', icon: '🔥', desc: '单次造成15点以上伤害', hidden: false },
  { id: 'huge_damage', name: '末日之刃', icon: '🌋', desc: '单次造成30点以上伤害', hidden: true },
  { id: 'minion_army', name: '大军压境', icon: '🏰', desc: '场上同时拥有7个随从', hidden: false },
  { id: 'full_hand', name: '满手牌', icon: '🃏', desc: '手牌达到10张', hidden: false },

  // 收集类
  { id: 'first_relic', name: '初次收集', icon: '🎁', desc: '获得第一件遗物', hidden: false },
  { id: 'relic_10', name: '收藏家', icon: '💎', desc: '一局中获得10件遗物', hidden: false },
  { id: 'relic_15', name: '宝库', icon: '🏦', desc: '一局中获得15件遗物', hidden: false },
  { id: 'legendary_card', name: '传说之力', icon: '✨', desc: '获得一张传说卡牌', hidden: false },
  { id: 'all_relics', name: '遗物图鉴', icon: '📖', desc: '累计获得过20种不同遗物', hidden: true },

  // 经济类
  { id: 'rich', name: '富翁', icon: '💰', desc: '单局累计拥有100金币', hidden: false },
  { id: 'shop_50', name: '购物狂', icon: '🛒', desc: '累计在商店消费200金币', hidden: true },
  { id: 'free_upgrade', name: '白嫖王', icon: '🆓', desc: '通过事件获得5次免费升级', hidden: true },

  // 进度类
  { id: 'runs_10', name: '冒险者', icon: '🗺️', desc: '完成10次冒险', hidden: false },
  { id: 'runs_50', name: '老兵', icon: '🎖️', desc: '完成50次冒险', hidden: false },
  { id: 'runs_100', name: '百战不殆', icon: '🏅', desc: '完成100次冒险', hidden: false },
  { id: 'meta_maxed', name: '究极强化', icon: '⭐', desc: '将任意一项局外强化升至满级', hidden: false },
  { id: 'daily_7', name: '每周挑战', icon: '📅', desc: '连续7天完成每日挑战', hidden: false },
  { id: 'daily_30', name: '坚持不懈', icon: '📆', desc: '累计完成30次每日挑战', hidden: true },

  // 特殊类
  { id: 'evolve_master', name: '进化大师', icon: '🧬', desc: '一局中进化随从20次', hidden: false },
  { id: 'poison_kill', name: '以毒攻毒', icon: '🐍', desc: '用剧毒击杀一个Boss', hidden: true },
  { id: 'comeback', name: '绝地反击', icon: '🔄', desc: '在1血时赢得一场战斗', hidden: false },
  { id: 'overkill', name: '过度击杀', icon: '💢', desc: '对敌人造成超过其生命值的过量伤害', hidden: false },
  { id: 'first_event', name: '好奇心', icon: '❓', desc: '触发第一个事件', hidden: false },
];

function getAchievements() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENT_KEY);
    if (!raw) return { unlocked: {}, stats: {} };
    return JSON.parse(raw);
  } catch(e) { return { unlocked: {}, stats: {} }; }
}

function saveAchievements(data) {
  try { localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(data)); } catch(e) {}
}

function unlockAchievement(id) {
  const data = getAchievements();
  if (data.unlocked[id]) return;
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  if (!ach) return;
  data.unlocked[id] = Date.now();
  saveAchievements(data);
  _achievementQueue.push(ach);
  _showNextAchievement();
}

function isAchievementUnlocked(id) {
  const data = getAchievements();
  return !!data.unlocked[id];
}

function _showNextAchievement() {
  if (_achievementShowing) return;
  const ach = _achievementQueue.shift();
  if (!ach) return;
  _achievementShowing = true;

  const container = document.getElementById('achievement-notification');
  if (!container) { _achievementShowing = false; return; }

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="font-size:32px;">${ach.icon}</div>
      <div>
        <div style="font-size:11px;color:var(--gold);">🏆 成就解锁</div>
        <div style="font-size:14px;font-weight:bold;color:#fff;">${ach.name}</div>
        <div style="font-size:11px;color:#aaa;">${ach.desc}</div>
      </div>
    </div>
  `;
  container.classList.add('show');

  setTimeout(() => {
    container.classList.remove('show');
    setTimeout(() => {
      _achievementShowing = false;
      _showNextAchievement();
    }, 300);
  }, 3500);
}

// Achievement stat tracking helpers
function trackStat(key, value) {
  const data = getAchievements();
  data.stats = data.stats || {};
  if (value !== undefined) {
    data.stats[key] = (data.stats[key] || 0) + value;
  } else {
    data.stats[key] = (data.stats[key] || 0) + 1;
  }
  saveAchievements(data);
  checkAchievements();
}

function setStat(key, value) {
  const data = getAchievements();
  data.stats = data.stats || {};
  data.stats[key] = value;
  saveAchievements(data);
  checkAchievements();
}

function getStat(key) {
  const data = getAchievements();
  return (data.stats && data.stats[key]) || 0;
}

function checkAchievements() {
  const data = getAchievements();
  const stats = data.stats || {};
  const unlocked = data.unlocked || {};

  // Kill-based achievements
  if (stats.totalKills >= 50 && !unlocked.kill_50) unlockAchievement('kill_50');
  if (stats.totalKills >= 200 && !unlocked.kill_200) unlockAchievement('kill_200');
  if (stats.totalKills >= 500 && !unlocked.kill_500) unlockAchievement('kill_500');

  // Run-based achievements
  if (stats.totalRuns >= 10 && !unlocked.runs_10) unlockAchievement('runs_10');
  if (stats.totalRuns >= 50 && !unlocked.runs_50) unlockAchievement('runs_50');
  if (stats.totalRuns >= 100 && !unlocked.runs_100) unlockAchievement('runs_100');

  // Shop spending
  if (stats.shopSpent >= 200 && !unlocked.shop_50) unlockAchievement('shop_50');

  // Relic diversity
  if (stats.uniqueRelics && stats.uniqueRelics.length >= 20 && !unlocked.all_relics) unlockAchievement('all_relics');

  // Daily challenges
  if (stats.dailyCompleted >= 30 && !unlocked.daily_30) unlockAchievement('daily_30');

  // Meta maxed
  const meta = getMetaProgress();
  if (meta.upgrades) {
    for (const upg of META_UPGRADES) {
      if ((meta.upgrades[upg.id] || 0) >= upg.maxLevel) {
        if (!unlocked.meta_maxed) unlockAchievement('meta_maxed');
        break;
      }
    }
  }
}

function showAchievements() {
  const data = getAchievements();
  const unlocked = data.unlocked || {};
  const container = document.getElementById('achievement-list');
  if (!container) return;

  const unlockedCount = Object.keys(unlocked).length;
  const totalCount = ACHIEVEMENTS.length;

  document.getElementById('achievement-count').textContent = `${unlockedCount} / ${totalCount}`;

  const frag = document.createDocumentFragment();
  ACHIEVEMENTS.forEach(ach => {
    const isUnlocked = !!unlocked[ach.id];
    const row = document.createElement('div');
    row.style.cssText = `display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--border);border-radius:8px;background:rgba(0,0,0,0.3);${isUnlocked ? '' : 'opacity:0.5;'}`;
    row.innerHTML = `
      <div style="font-size:24px;${isUnlocked ? '' : 'filter:grayscale(1);'}">${isUnlocked ? ach.icon : (ach.hidden ? '❓' : ach.icon)}</div>
      <div style="flex:1;">
        <div style="font-size:13px;color:${isUnlocked ? 'var(--gold)' : '#666'};font-weight:bold;">${isUnlocked ? ach.name : (ach.hidden ? '隐藏成就' : ach.name)}</div>
        <div style="font-size:11px;color:#888;">${isUnlocked ? ach.desc : (ach.hidden ? '满足特定条件解锁' : ach.desc)}</div>
      </div>
      <div style="font-size:18px;">${isUnlocked ? '✅' : '🔒'}</div>
    `;
    frag.appendChild(row);
  });
  container.replaceChildren(frag);
  showOverlay('overlay-achievements');
}

function closeAchievements() { hideOverlay('overlay-achievements'); }

// ===================== ANALYTICS (P2-5) =====================
const ANALYTICS_KEY = 'shadow_rift_analytics';

function getAnalytics() {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    if (!raw) return _defaultAnalytics();
    return JSON.parse(raw);
  } catch(e) { return _defaultAnalytics(); }
}

function _defaultAnalytics() {
  return {
    classPicks: {},
    classWins: {},
    modePicks: { standard: 0, endless: 0, sprint: 0 },
    difficultyPicks: { easy: 0, normal: 0, hard: 0 },
    totalRuns: 0,
    victories: 0,
    defeats: 0,
    avgActsReached: 0,
    totalActsReached: 0,
    cardUsage: {},
    cardWinRate: {},
    relicUsage: {},
    eventChoices: {},
    sessionStart: Date.now(),
    playTimeMs: 0,
  };
}

function trackEvent(category, key, value) {
  const a = getAnalytics();
  switch(category) {
    case 'class_pick':
      a.classPicks[key] = (a.classPicks[key] || 0) + 1;
      break;
    case 'class_win':
      a.classWins[key] = (a.classWins[key] || 0) + 1;
      break;
    case 'mode_pick':
      a.modePicks[key] = (a.modePicks[key] || 0) + 1;
      break;
    case 'difficulty_pick':
      a.difficultyPicks[key] = (a.difficultyPicks[key] || 0) + 1;
      break;
    case 'card_played':
      a.cardUsage[key] = (a.cardUsage[key] || 0) + 1;
      break;
    case 'relic_get':
      a.relicUsage[key] = (a.relicUsage[key] || 0) + 1;
      break;
    case 'event_choice':
      a.eventChoices[key] = (a.eventChoices[key] || 0) + 1;
      break;
    case 'run_end':
      a.totalRuns++;
      if (value === 'victory') a.victories++; else a.defeats++;
      a.totalActsReached += G ? G.act : 0;
      a.avgActsReached = a.totalActsReached / a.totalRuns;
      break;
    case 'play_time':
      a.playTimeMs += value || 0;
      break;
  }
  try { localStorage.setItem(ANALYTICS_KEY, JSON.stringify(a)); } catch(e) {}
}

function exportAnalytics() {
  const a = getAnalytics();
  const summary = {
    totalRuns: a.totalRuns,
    winRate: a.totalRuns > 0 ? (a.victories / a.totalRuns * 100).toFixed(1) + '%' : 'N/A',
    avgActsReached: (a.avgActsReached || 0).toFixed(2),
    topClass: _getTopKey(a.classPicks),
    topCard: _getTopKey(a.cardUsage),
    topRelic: _getTopKey(a.relicUsage),
    playTimeMin: Math.floor((a.playTimeMs || 0) / 60000),
  };
  return JSON.stringify(summary, null, 2);
}

function _getTopKey(obj) {
  let max = 0, top = 'N/A';
  for (const [k, v] of Object.entries(obj)) {
    if (v > max) { max = v; top = k; }
  }
  return `${top} (${max})`;
}

// Initialize on load
checkAchievements();
