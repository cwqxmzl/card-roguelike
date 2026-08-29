/* card-roguelike — state module
   Split from card_roguelike.html inline <script> for maintainability.
   Classic script loaded via <script src>; shares global scope with siblings. */

// ===================== GAME STATE =====================
let G = null;

function initGame(classId) {
  const cls = CLASSES[classId] || CLASSES.mage;
  G = {
    act: 0,
    selectedClass: classId || 'mage',
    map: null,
    currentNode: null,
    player: {
      hp: cls.hp, maxHp: cls.hp, armor: 0,
      deck: [], hand: [], drawPile: [], discardPile: [],
      minions: [], weapon: null,
      maxMana: 0, mana: 0, overload: 0,
      heroPower: { used: false, cost: cls.heroPower.cost, type: cls.heroPower.type, name: cls.heroPower.name },
      spellPower: 0,
      portrait: cls.portrait,
    },
    enemy: null,
    battle: { turn: 1, isPlayerTurn: true, log: [], targetingMode: null, selectedMinion: null, isHeroAttacker: false, heroCanAttack: false, ended: false, enemyType: null, safetyTimer: null, attackSafetyTimer: null, spellTargeting: null, battlecryTargeting: null, heroPowerTargeting: null, firstCardPlayed: false },
    gold: 0,
    relics: [],
    pendingUpgrade: false,
    shopInventory: null,
    eventLog: null,
  };

  // Class starting deck
  cls.starterDeck.forEach(id => {
    const data = getCardData(id);
    if (data) G.player.deck.push({ ...data, uid: uid() });
  });

  // Signature treasure (passive relic)
  const sig = PASSIVE_TREASURES.find(t => t.id === cls.signature);
  if (sig) G.relics.push({ ...sig });

  // Apply meta upgrades
  const meta = getMetaProgress();
  const upgrades = meta.upgrades || {};
  if (upgrades.max_hp) { G.player.maxHp += 5 * upgrades.max_hp; G.player.hp = G.player.maxHp; }
  if (upgrades.start_gold) G.gold += 15 * upgrades.start_gold;
  if (upgrades.start_armor) G.relics.push({ id: 'meta_armor', name: '护甲精通', icon: '🛡️', effect: 'armor_start', description: `每场战斗开始+${2 * upgrades.start_armor}护甲` });
  if (upgrades.first_draw) G.relics.push({ id: 'meta_first_draw', name: '先手优势', icon: '🃏', effect: 'extra_draw', description: '第一回合多抽1张' });
  if (upgrades.first_mana) G.relics.push({ id: 'meta_first_mana', name: '法力涌动', icon: '🔷', effect: 'extra_mana_start', description: '第一回合+1法力' });
  if (upgrades.hero_power_discount) G.player.heroPower.cost = Math.max(0, G.player.heroPower.cost - 1);
  if (upgrades.start_relic) grantRelic(G);

  // Apply difficulty
  applyDifficulty();
}

function startNewRun() {
  clearSave();
  showClassSelect();
}

function showClassSelect() {
  showScreen('class-select');
  renderClassSelect();
}

function renderClassSelect() {
  const container = document.getElementById('class-cards-container');
  if (!container) return;
  const frag = document.createDocumentFragment();
  Object.entries(CLASSES).forEach(([key, cls]) => {
    const card = document.createElement('div');
    card.className = 'class-card';
    card.style.borderColor = cls.color + '44';
    card.innerHTML = `
      <div class="class-card-portrait" style="color:${cls.color}">${cls.portrait}</div>
      <div class="class-card-name" style="color:${cls.color}">${cls.name}</div>
      <div class="class-card-power">技能: ${cls.heroPower.name} (${cls.heroPower.cost}费)</div>
      <div class="class-card-desc">${cls.heroPower.description}</div>
      <div class="class-card-deck">初始卡组: ${cls.starterDeck.length}张<br>专属卡池: ${cls.cardPool.length}张</div>
      <div class="select-hint">▶ 选择此职业</div>
    `;
    card.onclick = () => selectClass(key);
    frag.appendChild(card);
  });
  container.replaceChildren(frag);
}

function selectClass(classId) {
  const cls = CLASSES[classId];
  if (!cls) return;
  initGame(classId);
  G.selectedClass = classId;
  generateMap(0);
  saveGame();
  showInitialReward();
}

function showInitialReward() {
  const pool = [...STARTING_BONUSES];
  const choices = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    choices.push(pool.splice(idx, 1)[0]);
  }
  const container = document.getElementById('initial-reward-choices');
  const frag = document.createDocumentFragment();
  choices.forEach(bonus => {
    const card = document.createElement('div');
    card.className = 'reward-type-card';
    card.style.cssText = 'width:200px;min-height:120px;display:flex;flex-direction:column;align-items:center;gap:6px;';
    card.innerHTML = `
      <div class="reward-type-icon" style="font-size:36px;">${bonus.icon}</div>
      <div class="reward-type-title" style="font-size:16px;color:var(--gold);">${bonus.name}</div>
      <div class="reward-type-desc" style="font-size:12px;color:#aaa;line-height:1.4;">${bonus.desc}</div>
    `;
    card.onclick = () => applyStartingBonus(bonus.id);
    frag.appendChild(card);
  });
  container.replaceChildren(frag);
  showOverlay('overlay-initial-reward');
}

function applyStartingBonus(bonusId) {
  const bonus = STARTING_BONUSES.find(b => b.id === bonusId);
  if (!bonus) return;
  switch(bonusId) {
    case 'gold': G.gold += 30; log('开局祝福：+30金币'); break;
    case 'hp': G.player.maxHp += 8; G.player.hp += 8; log('开局祝福：最大生命值+8'); break;
    case 'relic': grantRelic(G); log('开局祝福：获得随机遗物'); break;
    case 'rare_card': {
      const pool = CARD_POOL.filter(c => c.rarity === 'rare' || c.rarity === 'epic');
      const card = pool[Math.floor(Math.random() * pool.length)];
      G.player.deck.push({ ...card, uid: uid() });
      log(`开局祝福：获得 ${card.name}`);
      break;
    }
    case 'upgrade': {
      const upgradable = G.player.deck.filter(c => !c.upgraded);
      if (upgradable.length > 0) {
        const card = upgradable[Math.floor(Math.random() * upgradable.length)];
        upgradeCard(card);
        log(`开局祝福：${card.name} 被强化`);
      }
      break;
    }
    case 'armor': G.relics.push({ id: 'bonus_armor', name: '护甲卷轴', icon: '📜', effect: 'armor_start', description: '每场战斗开始+3护甲' }); log('开局祝福：护甲卷轴'); break;
    case 'draw': G.relics.push({ id: 'bonus_draw', name: '洞察之眼', icon: '👁️', effect: 'extra_draw', description: '每场战斗开始多抽1张牌' }); log('开局祝福：洞察之眼'); break;
    case 'mana': G.relics.push({ id: 'bonus_mana', name: '法力核心', icon: '🔷', effect: 'extra_mana_start', description: '第一回合+1法力' }); log('开局祝福：法力核心'); break;
  }
  hideOverlay('overlay-initial-reward');
  showScreen('map');
  renderMap();
  saveGame();
  if (!localStorage.getItem('tutorialSeen')) {
    setTimeout(() => showTutorial(), 400);
  }
}

function generateMap(act) {
  G.act = act;
  const map = { act, rows: [], currentRow: 0 };
  const numRows = act === 2 ? 8 : 7;
  const nodePool = act === 0
    ? ['battle','battle','battle','event','shop','rest','treasure']
    : ['battle','battle','elite','event','shop','rest','treasure','battle'];
  
  let paths = [0, 1, 2];
  for (let r = 0; r < numRows; r++) {
    const row = [];
    const numNodes = r === numRows - 1 ? 1 : (3 - Math.floor(Math.random() * 2));
    for (let i = 0; i < numNodes; i++) {
      let type;
      if (r === 0) type = 'battle';
      else if (r === numRows - 1) type = 'boss';
      else if (r === Math.floor(numRows / 2) && Math.random() < 0.5) type = 'shop';
      else if (r === Math.floor(numRows / 3) && Math.random() < 0.4) type = 'rest';
      else type = nodePool[Math.floor(Math.random() * nodePool.length)];
      if (act > 0 && r > 0 && r < numRows - 1 && Math.random() < 0.25) type = 'elite';
      row.push({ type, completed: false, row: r, col: i, id: `n${r}_${i}` });
    }
    map.rows.push(row);
  }
  // Ensure last row is boss
  map.rows[numRows - 1] = [{ type: 'boss', completed: false, row: numRows - 1, col: 0, id: 'boss' }];
  // Mark first available nodes
  map.rows[0].forEach(n => n.available = true);
  G.map = map;
  G.currentNode = null;
}

