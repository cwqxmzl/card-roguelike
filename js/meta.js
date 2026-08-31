/* card-roguelike — meta module
   Split from card_roguelike.html inline <script> for maintainability.
   Classic script loaded via <script src>; shares global scope with siblings. */

// ===================== TUTORIAL =====================
const TUTORIAL_STEPS = [
  { icon: '⚔️', title: '欢迎来到暗影裂境', text: '这是一款卡牌肉鸽冒险游戏。你将操控英雄穿越三幕关卡，击败敌人、收集卡牌和遗物、最终挑战首领！' },
  { icon: '💎', title: '法力水晶', text: '每回合开始获得法力水晶（第1回合1个，之后每回合+1，上限10）。打出卡牌需要消耗法力，合理分配法力是关键！' },
  { icon: '🃏', title: '打出卡牌', text: '点击手牌中的卡牌即可打出。随从需要等下回合才能攻击；法术立即生效；武器装备后让英雄可以攻击。' },
  { icon: '🗡️', title: '攻击敌人', text: '点击自己的随从选中后，再点击敌方随从或英雄进行攻击。装备武器后英雄也可直接攻击。注意：有嘲讽随从时必须先消灭嘲讽！' },
  { icon: '⏭️', title: '结束回合', text: '操作完毕后点击右下角"结束回合"按钮，轮到敌方行动。敌方意图会显示在上方，提前规划应对策略。' },
  { icon: '📖', title: '冒险者手册', text: '· 长按或右键卡牌/随从 → 查看详细信息\n· 点击遗物图标 → 查看遗物效果\n· 📚查看抽牌堆 · 🗑️查看弃牌堆\n· 右侧战斗日志记录每一步操作\n· 战斗胜利后别忘了选择奖励来强化牌组！' },
  { icon: '⚡', title: '进化（新机制）', text: '拥有"进化"标识的随从，出场时头上会出现金色⚡按钮。点击即可进化：该随从+2/+2并获得专属进化效果（伤害/召唤/增益等）。每场战斗限用2次，进化后本回合即可攻击！' },
  { icon: '💫', title: '复生（新机制）', text: '拥有"复生"标识的随从被击败后会以部分生命值复活一次。合理利用复生随从能为你争取巨大场面优势！' },
  { icon: '🔍', title: '发现（新机制）', text: '带有"发现"效果的法术会弹出3张候选卡牌，从中选择1张直接加入手牌。发现是获取关键卡牌的最佳途径！' },
  { icon: '🔁', title: '回响（新机制）', text: '带有"回响"标识的卡牌打出后会回到手牌，本回合可以再次打出（每张只回响一次）。配合低费效果能打出惊人连击！' },
  { icon: '⛓️', title: '连锁（新机制）', text: '带有"连锁"标识的卡牌会在你本回合打出第N张卡牌时触发额外效果。规划好出牌顺序，让连锁效果最大化！' },
  { icon: '📈', title: '魔力增幅（新机制）', text: '带有"魔力增幅"标识的法术，每当你使用一张法术牌，它的费用就-1（有上限）。前期多用法术，后期就能低费打出强力大法术！' },
];

let tutorialStep = 0;

function showTutorial() {
  tutorialStep = 0;
  renderTutorialStep();
  showOverlay('overlay-tutorial');
}

function renderTutorialStep() {
  const step = TUTORIAL_STEPS[tutorialStep];
  if (!step) { skipTutorial(); return; }
  document.getElementById('tutorial-step-indicator').textContent = `${tutorialStep + 1} / ${TUTORIAL_STEPS.length}`;
  document.getElementById('tutorial-icon').textContent = step.icon;
  document.getElementById('tutorial-title').textContent = step.title;
  document.getElementById('tutorial-text').textContent = step.text;
  const nextBtn = document.getElementById('tutorial-next-btn');
  nextBtn.textContent = tutorialStep === TUTORIAL_STEPS.length - 1 ? '开始冒险' : '下一步';
}

function nextTutorialStep() {
  tutorialStep++;
  if (tutorialStep >= TUTORIAL_STEPS.length) {
    skipTutorial();
  } else {
    renderTutorialStep();
  }
}

function skipTutorial() {
  hideOverlay('overlay-tutorial');
  localStorage.setItem('tutorialSeen', '1');
}

// ===================== DIFFICULTY SYSTEM =====================
let currentDifficulty = 'normal';
let currentMode = 'standard';

function selectMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.difficulty-btn[data-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
}

const DIFFICULTY_SETTINGS = {
  easy:   { name: '简单', enemyHpMult: 0.8, enemyAtkMult: 0.8, goldMult: 1.2, startGold: 30, hpMult: 1.1, shardMult: 0.7 },
  normal: { name: '普通', enemyHpMult: 1.0, enemyAtkMult: 1.0, goldMult: 1.0, startGold: 0,  hpMult: 1.0, shardMult: 1.0 },
  hard:   { name: '困难', enemyHpMult: 1.2, enemyAtkMult: 1.15, goldMult: 0.8, startGold: -15, hpMult: 0.9, shardMult: 1.5 },
};

function selectDifficulty(diff) {
  currentDifficulty = diff;
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.diff === diff);
  });
  playSfx('click');
}

function applyDifficulty() {
  const d = DIFFICULTY_SETTINGS[currentDifficulty];
  if (!d) return;
  G.difficulty = currentDifficulty;
  G.player.maxHp = Math.floor(G.player.maxHp * d.hpMult);
  G.player.hp = G.player.maxHp;
  G.gold = Math.max(0, G.gold + d.startGold);
  // 极速模式：单幕浓缩资源
  if (currentMode === 'sprint') {
    G.player.maxHp = Math.floor(G.player.maxHp * 1.2);
    G.player.hp = G.player.maxHp;
    G.gold += 25;
  }
}

// ===================== SETTINGS SYSTEM =====================
let SETTINGS = {
  music: false,
  sfx: true,
  animations: true,
  autolog: false,
};

const SETTINGS_KEY = 'shadow_rift_settings';

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) SETTINGS = { ...SETTINGS, ...JSON.parse(raw) };
  } catch(e) {}
}

function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS)); } catch(e) {}
}

// Animation pacing: when "战斗动画" is off, reduce battle pacing delays to 0.
// When fast-forward is active, halve the delay.
function animDelay(ms) {
  if (!SETTINGS.animations) return 0;
  if (G && G.fastForward) return Math.max(0, Math.floor(ms / 2));
  return ms;
}

function showSettings() {
  loadSettings();
  document.getElementById('setting-music').classList.toggle('on', SETTINGS.music);
  document.getElementById('setting-sfx').classList.toggle('on', SETTINGS.sfx);
  document.getElementById('setting-animations').classList.toggle('on', SETTINGS.animations);
  document.getElementById('setting-autolog').classList.toggle('on', SETTINGS.autolog);
  showOverlay('overlay-settings');
}

function closeSettings() { hideOverlay('overlay-settings'); }

function toggleSetting(key) {
  SETTINGS[key] = !SETTINGS[key];
  saveSettings();
  const el = document.getElementById('setting-' + key);
  if (el) el.classList.toggle('on', SETTINGS[key]);
  if (key === 'music') {
    if (SETTINGS.music) playMusic(); else stopMusic();
  }
  playSfx('click');
}

function resetMetaProgress() {
  if (!confirm('确定要重置所有局外进度吗？所有裂境碎晶和永久升级将被清除！')) return;
  try { localStorage.removeItem(META_KEY); } catch(e) {}
  updateMainMenu();
  closeSettings();
  alert('进度已重置');
}

// ===================== SOUND EFFECTS =====================
function playSfx(type) {
  if (!SETTINGS.sfx) return;
  initAudio();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  
  switch(type) {
    case 'click':
      osc.frequency.value = 600; osc.type = 'sine';
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
      break;
    case 'play':
      osc.frequency.value = 440; osc.type = 'triangle';
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
      break;
    case 'attack':
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
      break;
    case 'heal':
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
      break;
    case 'death':
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
      break;
    case 'victory':
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0, now + i * 0.1);
        g.gain.linearRampToValueAtTime(0.08, now + i * 0.1 + 0.02);
        g.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.15);
        o.start(now + i * 0.1); o.stop(now + i * 0.1 + 0.15);
      });
      break;
    case 'defeat':
      const dnotes = [400, 350, 300, 200];
      dnotes.forEach((f, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.type = 'sawtooth'; o.frequency.value = f;
        g.gain.setValueAtTime(0, now + i * 0.15);
        g.gain.linearRampToValueAtTime(0.06, now + i * 0.15 + 0.02);
        g.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.2);
        o.start(now + i * 0.15); o.stop(now + i * 0.15 + 0.2);
      });
      break;
    case 'evolve':
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
      break;
    case 'rebirth':
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
      break;
    case 'discover':
      [660, 880, 1320].forEach((f, i) => {
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, now + i * 0.08);
        g.gain.linearRampToValueAtTime(0.07, now + i * 0.08 + 0.02);
        g.gain.linearRampToValueAtTime(0, now + i * 0.08 + 0.12);
        o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.12);
      });
      break;
  }
}

function returnToMenu() {
  hideOverlay('overlay-gameover');
  hideOverlay('overlay-victory');
  updateMainMenu();
  showScreen('menu');
}
function log(msg) {
  if (G && G.battle) addBattleLog(msg, 'system');
  if (G && G.eventLog) G.eventLog.push(msg);
}

// ===================== SAVE SYSTEM =====================
const SAVE_KEY = 'shadow_rift_save';
const META_KEY = 'shadow_rift_meta';

function saveGame() {
  if (!G || !G.map) return;
  try {
    const state = {
      act: G.act,
      mode: G.mode,
      selectedClass: G.selectedClass,
      map: G.map,
      player: {
        hp: G.player.hp, maxHp: G.player.maxHp, armor: G.player.armor,
        deck: G.player.deck,
        heroPower: G.player.heroPower,
        portrait: G.player.portrait,
        portraitImg: G.player.portraitImg,
      },
      gold: G.gold,
      relics: G.relics,
      difficulty: G.difficulty,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch(e) { /* error handled */ }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) { return null; }
}

function hasSave() {
  return !!localStorage.getItem(SAVE_KEY);
}

function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

function continueRun() {
  const state = loadGame();
  if (!state) return;
  G = {
    act: state.act,
    mode: state.mode || 'endless',
    selectedClass: state.selectedClass,
    map: state.map,
    currentNode: null,
    player: {
      hp: state.player.hp, maxHp: state.player.maxHp, armor: state.player.armor,
      deck: state.player.deck, hand: [], drawPile: [], discardPile: [],
      minions: [], weapon: null,
      maxMana: 0, mana: 0, overload: 0,
      heroPower: state.player.heroPower,
      spellPower: 0,
      portrait: state.player.portrait,
      portraitImg: state.player.portraitImg,
    },
    enemy: null,
    battle: null,
    gold: state.gold,
    relics: state.relics || [],
    difficulty: state.difficulty,
    pendingUpgrade: false,
    shopInventory: null,
    eventLog: null,
  };
  G.player.spellPower = hasRelic('spell_power') ? 1 : 0;
  showScreen('map');
  renderMap();
}

function saveMetaProgress(result) {
  try {
    let meta = {};
    const raw = localStorage.getItem(META_KEY);
    if (raw) meta = JSON.parse(raw);
    meta.totalRuns = (meta.totalRuns || 0) + 1;
    let shards = 0;
    if (result === 'victory') {
      meta.victories = (meta.victories || 0) + 1;
      shards = 8 + G.act * 3;
      const cls = G ? G.selectedClass : null;
      if (cls) {
        meta.classWins = meta.classWins || {};
        meta.classWins[cls] = (meta.classWins[cls] || 0) + 1;
      }
    } else {
      shards = 2 + Math.floor(G.act * 1.5);
    }
    // Apply difficulty shard multiplier
    if (G && G.difficulty) {
      const d = DIFFICULTY_SETTINGS[G.difficulty];
      if (d) shards = Math.floor(shards * d.shardMult);
    }
    meta.shards = (meta.shards || 0) + shards;
    meta.lastShards = shards;
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch(e) { /* error handled */ }
}

function getMetaProgress() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return { totalRuns: 0, victories: 0, classWins: {}, shards: 0, upgrades: {} };
    return JSON.parse(raw);
  } catch(e) { return { totalRuns: 0, victories: 0, classWins: {}, shards: 0, upgrades: {} }; }
}

function showMetaShop() {
  const meta = getMetaProgress();
  document.getElementById('meta-shards').textContent = meta.shards || 0;
  const container = document.getElementById('meta-upgrades');
  const frag = document.createDocumentFragment();
  META_UPGRADES.forEach(upg => {
    const level = meta.upgrades?.[upg.id] || 0;
    const maxed = level >= upg.maxLevel;
    const cost = maxed ? 0 : upg.costs[level];
    const canBuy = !maxed && (meta.shards || 0) >= cost;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:12px;border:1px solid var(--border);border-radius:8px;background:rgba(0,0,0,0.3);' + (maxed ? 'opacity:0.6;' : '');
    row.innerHTML = `
      <div style="font-size:24px;">${upg.icon}</div>
      <div style="flex:1;">
        <div style="font-size:14px;color:var(--gold);font-weight:bold;">${upg.name} <span style="color:#666;font-weight:normal;font-size:12px;">Lv.${level}/${upg.maxLevel}</span></div>
        <div style="font-size:11px;color:#888;">${upg.desc}</div>
      </div>
      <div style="text-align:right;min-width:70px;">
        ${maxed ? '<span style="color:#27ae60;font-size:13px;">已满级</span>' : `<div style="color:${canBuy ? 'var(--gold)' : '#666'};font-size:14px;">💎 ${cost}</div><button class="overlay-btn" style="padding:4px 12px;font-size:12px;margin-top:4px;min-height:28px;${canBuy ? '' : 'opacity:0.4;cursor:not-allowed;'}" ${canBuy ? '' : 'disabled'}>升级</button>`}
      </div>
    `;
    if (canBuy) {
      row.querySelector('button').onclick = () => buyMetaUpgrade(upg.id);
    }
    frag.appendChild(row);
  });
  container.replaceChildren(frag);
  showOverlay('overlay-meta-shop');
}

function closeMetaShop() { hideOverlay('overlay-meta-shop'); }

function buyMetaUpgrade(upgradeId) {
  const meta = getMetaProgress();
  const upg = META_UPGRADES.find(u => u.id === upgradeId);
  if (!upg) return;
  const upgrades = meta.upgrades || {};
  const level = upgrades[upgradeId] || 0;
  if (level >= upg.maxLevel) return;
  const cost = upg.costs[level];
  if ((meta.shards || 0) < cost) return;
  meta.shards -= cost;
  upgrades[upgradeId] = level + 1;
  meta.upgrades = upgrades;
  localStorage.setItem(META_KEY, JSON.stringify(meta));
  showMetaShop();
}

// ===================== BACKGROUND MUSIC (Web Audio API) =====================
let audioCtx = null;
let musicNodes = [];
let musicPlaying = false;
let bgmSource = null;
let currentBgmTrack = null;
const bgmBufferCache = {};
const BGM_TRACKS = {
  menu: 'assets/audio/bgm-menu.wav',
  battle: 'assets/audio/bgm-battle.wav',
  boss: 'assets/audio/bgm-boss.wav',
};

function initAudio() {
  if (audioCtx) return;
  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { /* error handled */ }
}

// 播放背景音乐（支持曲目：menu/battle/boss；加载失败自动回退合成音）
function playMusic(track) {
  initAudio();
  if (!audioCtx) return;
  const want = track || 'menu';
  if (musicPlaying && currentBgmTrack === want) return;
  stopMusic();
  musicPlaying = true;
  currentBgmTrack = want;
  const toggleBtn = document.getElementById('music-toggle');
  if (toggleBtn) toggleBtn.textContent = '🎵';

  // 有缓存直接用
  if (bgmBufferCache[want]) { startBgmSource(bgmBufferCache[want]); return; }

  const file = BGM_TRACKS[want];
  if (!file) { legacyPlayMusic(); return; }

  // 本地文件（file://）fetch 可能受限，但 GitHub Pages 正常；失败回退合成
  fetch(file)
    .then(r => { if (!r.ok) throw new Error('http'); return r.arrayBuffer(); })
    .then(buf => audioCtx.decodeAudioData(buf))
    .then(audioBuf => {
      if (!musicPlaying || currentBgmTrack !== want) return;
      bgmBufferCache[want] = audioBuf;
      startBgmSource(audioBuf);
    })
    .catch(() => {
      if (musicPlaying && currentBgmTrack === want) legacyPlayMusic();
    });
}

function startBgmSource(buffer) {
  if (!audioCtx || !musicPlaying || !buffer) return;
  try {
    const src = audioCtx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.4;
    src.connect(gain);
    gain.connect(audioCtx.destination);
    src.start();
    bgmSource = src;
  } catch(e) { /* ignore */ }
}

// 振荡器合成兜底（与旧版相同，作为本地 file:// 打开时的回退）
function legacyPlayMusic() {
  if (!musicPlaying || !audioCtx) return;
  const baseNotes = [220, 246.94, 277.18, 329.63];
  const melody = [440, 493.88, 523.25, 587.33, 659.25, 523.25, 440, 392];
  let melodyIdx = 0;

  function playNote(freq, duration, time, type = 'sine', vol = 0.08) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.05);
    gain.gain.linearRampToValueAtTime(0, time + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(time);
    osc.stop(time + duration);
    musicNodes.push(osc);
    osc.onended = () => {
      const i = musicNodes.indexOf(osc);
      if (i >= 0) musicNodes.splice(i, 1);
    };
  }

  function playChord(freqs, time, duration) {
    freqs.forEach(f => playNote(f, duration, time, 'sine', 0.04));
  }

  function scheduleLoop() {
    if (!musicPlaying || !audioCtx) return;
    const now = audioCtx.currentTime;
    const beatLen = 0.5;
    for (let i = 0; i < 8; i++) {
      const time = now + i * beatLen;
      playNote(melody[melodyIdx % melody.length], beatLen * 0.9, time, 'triangle', 0.06);
      if (i % 2 === 0) playChord(baseNotes, time, beatLen * 1.8);
      melodyIdx++;
    }
    setTimeout(scheduleLoop, 3500);
  }
  scheduleLoop();
}

function stopMusic() {
  musicPlaying = false;
  currentBgmTrack = null;
  if (bgmSource) { try { bgmSource.stop(); } catch(e) {} bgmSource = null; }
  musicNodes.forEach(n => { try { n.stop(); } catch(e) {} });
  musicNodes = [];
  const toggleBtn = document.getElementById('music-toggle');
  if (toggleBtn) toggleBtn.textContent = '🔇';
}

function toggleMusic() {
  if (musicPlaying) stopMusic();
  else playMusic();
}

function updateMainMenu() {
  const continueBtn = document.getElementById('menu-continue-btn');
  if (continueBtn) {
    continueBtn.style.display = hasSave() ? '' : 'none';
  }
  const statsEl = document.getElementById('menu-stats');
  if (statsEl) {
    const meta = getMetaProgress();
    if (meta.totalRuns > 0) {
      statsEl.innerHTML = `总冒险 ${meta.totalRuns} 次 | 通关 ${meta.victories || 0} 次<br>💎 裂境碎晶: ${meta.shards || 0}`;
    } else {
      statsEl.innerHTML = '';
    }
  }
}

// Initialize
loadSettings();
updateMainMenu();
showScreen('menu');

// Keyboard shortcuts (desktop)
document.addEventListener('keydown', (e) => {
  if (!G || !G.battle || G.battle.ended) return;
  if (e.key === 'Escape') {
    if (G.battle.targetingMode) {
      G.battle.targetingMode = null;
      G.battle.selectedMinion = null;
      G.battle.spellTargeting = null;
      G.battle.battlecryTargeting = null;
      G.battle.heroPowerTargeting = null;
      G.battle.isHeroAttacker = false;
      renderBattle();
    }
    return;
  }
  if ((e.key === 'Enter' || e.key === ' ') && G.battle.isPlayerTurn && !G.battle.targetingMode) {
    e.preventDefault();
    endTurn();
  }
});

// Compact card tooltip content builder (desktop hover)
function buildCardTooltipHtml(card) {
  const typeNames = { minion: '随从', spell: '法术', weapon: '武器' };
  const rarityNames = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' };
  let h = `<div style="font-size:14px;font-weight:bold;color:var(--gold);">${card.name || '未知'}${card.upgraded ? ' ✨' : ''}</div>`;
  h += `<div style="font-size:11px;color:#888;margin-top:2px;">${typeNames[card.type] || ''}${card.rarity ? ' · ' + (rarityNames[card.rarity] || card.rarity) : ''} · 费用${card.cost || 0}</div>`;
  if (card.type === 'minion') h += `<div style="font-size:12px;color:#aaa;">攻击${card.attack} / 生命${card.hp}</div>`;
  else if (card.type === 'weapon') h += `<div style="font-size:12px;color:#aaa;">攻击${card.attack} / 耐久${card.durability}</div>`;
  if (card.text) h += `<div style="font-size:12px;color:#ccc;margin-top:4px;line-height:1.5;">${card.text}</div>`;
  if (card.lifesteal) h += '<div style="font-size:11px;color:#ff6464;">🩸 吸血</div>';
  if (card.poisonous) h += '<div style="font-size:11px;color:#66ff66;">☠ 剧毒</div>';
  if (card.taunt) h += '<div style="font-size:11px;color:#ffd700;">🛡 嘲讽</div>';
  if (card.divineShield) h += '<div style="font-size:11px;color:#ffd700;">✨ 圣盾</div>';
  if (card.charge) h += '<div style="font-size:11px;color:#ffd700;">⚡ 冲锋</div>';
  if (card.windfury) h += '<div style="font-size:11px;color:#ffd700;">🌀 风怒</div>';
  if (card.freezeOnHit) h += '<div style="font-size:11px;color:#7ec8e3;">❄ 冰冻攻击</div>';
  if (card.overload) h += '<div style="font-size:11px;color:#9b59b6;">⚡ 过载' + card.overload + '</div>';
  return h;
}

// Auto-play music if enabled
if (SETTINGS.music) {
  document.addEventListener('click', function autoPlay() {
    if (SETTINGS.music && !musicPlaying) playMusic();
    document.removeEventListener('click', autoPlay);
  }, { once: true });
}
