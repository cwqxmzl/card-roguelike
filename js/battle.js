/* card-roguelike — battle module
   Split from card_roguelike.html inline <script> for maintainability.
   Classic script loaded via <script src>; shares global scope with siblings. */

// ===================== BATTLE =====================
function startBattle(type) {
  let enemyData;
  const isTut1 = type === 'tutorial_1';
  const isTut2 = type === 'tutorial_2';
  if (isTut1 || isTut2) {
    enemyData = { ...TUTORIAL_ENEMIES[isTut1 ? 0 : 1] };
  } else {
    // 无限模式：第3幕后循环使用第三幕敌人并逐步增强
    const bossIdx = Math.min(G.act, ENEMIES.boss.length - 1);
    if (type === 'boss') {
      enemyData = { ...ENEMIES.boss[bossIdx] };
    } else if (type === 'elite') {
      // 第11轮：按当前幕筛选精英池（第N幕 = act N），增强后兜底全池
      const elitePool = ENEMIES.elite.filter(e => !e.act || e.act === Math.min(G.act + 1, 3));
      const ep = elitePool.length ? elitePool : ENEMIES.elite;
      enemyData = { ...ep[Math.floor(Math.random() * ep.length)] };
    } else {
      // 第11轮：按当前幕筛选普通怪池
      const normalPool = ENEMIES.normal.filter(e => !e.act || e.act === Math.min(G.act + 1, 3));
      const np = normalPool.length ? normalPool : ENEMIES.normal;
      enemyData = { ...np[Math.floor(Math.random() * np.length)] };
    }
  }
  // 无限模式缩放：每多1幕 +18% 生命、+12% 攻击
  const endlessBoost = (G.mode === 'endless' && G.act > 2) ? Math.pow(1.18, G.act - 2) : 1;
  const endlessAtkBoost = (G.mode === 'endless' && G.act > 2) ? Math.pow(1.12, G.act - 2) : 1;
  if (endlessBoost !== 1) {
    enemyData.hp = Math.floor(enemyData.hp * endlessBoost);
    enemyData.attack = Math.max(1, Math.floor((enemyData.attack || 0) * endlessAtkBoost));
  }
  
  G.enemy = {
    ...enemyData,
    hp: enemyData.hp, maxHp: enemyData.hp,
    armor: 0,
    hand: [], drawPile: [], discardPile: [], minions: [],
    maxMana: 0, mana: 0, overload: 0,
    weapon: null,
    spellPower: 0,
    intent: null,
    evolvePoints: enemyData.isBoss ? 2 : 1,
  };
  
  // Apply difficulty to enemy stats
  if (G.difficulty) {
    const d = DIFFICULTY_SETTINGS[G.difficulty];
    if (d) {
      G.enemy.maxHp = Math.floor(G.enemy.maxHp * d.enemyHpMult);
      G.enemy.hp = G.enemy.maxHp;
    }
  }
  
  // Build enemy deck
  const dEnemyAtk = (G.difficulty && DIFFICULTY_SETTINGS[G.difficulty]) ? (DIFFICULTY_SETTINGS[G.difficulty].enemyAtkMult || 1) : 1;
  enemyData.deck.forEach(id => {
    const data = getCardData(id);
    if (data) {
      // Apply difficulty attack multiplier to enemy minions/weapons (getCardData returns a fresh copy)
      if (dEnemyAtk !== 1 && (data.type === 'minion' || data.type === 'weapon')) {
        data.attack = Math.max(1, Math.round((data.attack || 0) * dEnemyAtk));
      }
      G.enemy.drawPile.push({ ...data, uid: uid() });
    }
  });
  shuffle(G.enemy.drawPile);
  
  // Reset player for battle
  let battleDeck = G.player.deck;
  if (isTut1 || isTut2) {
    battleDeck = TUTORIAL_DECK.map(id => { const data = getCardData(id); return data ? { ...data, uid: uid() } : null; }).filter(Boolean);
  }
  G.player.drawPile = [...battleDeck];
  shuffle(G.player.drawPile);
  G.player.hand = [];
  G.player.discardPile = [];
  G.player.minions = [];
  G.player.weapon = null;
  G.player.armor = 0;
  G.player.mana = 0;
  G.player.maxMana = 0;
  const MANA_CAP = 10 + (hasRelic('max_mana_plus') ? 1 : 0);
  G.player.spellPower = (hasRelic('spell_power') ? 1 : 0) + (hasRelic('spell_power_1') ? 1 : 0) + (hasRelic('spell_power_2') ? 2 : 0) + (hasRelic('spell_power_3') ? 3 : 0);
  G.player.heroPower.used = false;
  G.player.overload = 0;
  G.player.divineShield = false;
  // 第9轮：进化次数 = 基础2 + 局外强化 start_evolve 等级 + 进化之心遗物
  G.player.evolvePoints = 2 + (typeof metaLevel === 'function' ? metaLevel('start_evolve') : 0) + (hasRelic('evolve_boost') ? 1 : 0);

  // Relic: armor start（meta_armor 按等级提供护甲）
  if (hasRelic('armor_start')) {
    const metaArmor = G.relics.find(r => r.effect === 'armor_start' && r.level);
    G.player.armor += 3 + (metaArmor ? 2 * metaArmor.level : 0);
  }
  
  // Relic: extra mana start（按等级提升首回合法力）
  if (hasRelic('extra_mana_start')) {
    const mm = G.relics.find(r => r.effect === 'extra_mana_start' && r.level);
    G.player.maxMana = 1 + (mm ? mm.level : 0);
    G.player.mana = G.player.maxMana;
  }
  // 第9轮：战神之怒遗物（英雄技能免费）
  if (hasRelic('hero_power_free')) G.player.heroPower.cost = 0;
  // 第9轮：圣盾徽章遗物（战斗开始英雄获得圣盾）
  if (hasRelic('start_shield')) { G.player.divineShield = true; }
  
  // Draw starting hand (3 cards + relic bonus)
  let drawCount = 3 + (hasRelic('extra_draw') ? 1 : 0) + (hasRelic('extra_draw_2') ? 2 : 0) + (hasRelic('extra_draw_3') ? 3 : 0);
  for (let i = 0; i < drawCount; i++) {
    drawCard(G.player, false);
  }
  // Enemy starting hand (difficulty affects it)
  const enemyDrawCount = G.difficulty === 'easy' ? 3 : G.difficulty === 'hard' ? 5 : 4;
  for (let i = 0; i < enemyDrawCount; i++) {
    drawCard(G.enemy, false);
  }
  // Coin start
  if (hasRelic('coin_start')) {
    G.player.hand.push({ ...getCardData('the_coin'), uid: uid() });
  }

  // 第15轮：敌人专属被动——战斗开始召唤小怪
  if (G.enemy.passive === 'summon_on_start') {
    for (let i = 0; i < 2; i++) {
      if (G.enemy.minions.length < 7) {
        const m = createMinion({ id: 'passive_summon_' + uid(), name: '鱼人幼崽', art: '🐠', attack: 1, hp: 2, cost: 1, type: 'minion' }, false);
        G.enemy.minions.push(m);
      }
    }
    addBattleLog('鱼人领袖召唤了2只鱼人幼崽', 'enemy');
  }
  
  G.battle = { turn: 1, isPlayerTurn: true, turnPhase: 'player', log: [], targetingMode: null, selectedMinion: null, isHeroAttacker: false, heroCanAttack: false, ended: false, enemyType: type, safetyTimer: null, attackSafetyTimer: null, spellTargeting: null, battlecryTargeting: null, heroPowerTargeting: null, firstCardPlayed: false, tutorialMsg: (isTut1 || isTut2) ? enemyData.tutorialMsg : null };
  G.battleStats = { dmgDealt: 0, dmgTaken: 0, cardsPlayed: 0, spellsCast: 0, minionsKilled: 0 };
  
  // Start player turn
  startPlayerTurn();
  
  showScreen('battle');
  renderBattle();
  playMusic(type === 'boss' ? 'boss' : 'battle');
  addBattleLog(`战斗开始！对手：${enemyData.name}`, 'system');
}

function startPlayerTurn() {
  if (G.battle.safetyTimer) { clearTimeout(G.battle.safetyTimer); G.battle.safetyTimer = null; }
  if (G.battle.attackSafetyTimer) { clearTimeout(G.battle.attackSafetyTimer); G.battle.attackSafetyTimer = null; }
  G.battle.isPlayerTurn = true;
  G.battle.turnPhase = 'player';
  G.battle.turn++;
  if (G.battle.turn > 1) {
    G.player.maxMana = Math.min(GAME_CONFIG.battle.maxMana + (hasRelic('max_mana_plus') ? 1 : 0), G.player.maxMana + 1);
  }
  G.player.mana = G.player.maxMana - G.player.overload;
  // Relic: armor_turn
  if (hasRelic('armor_turn')) {
    G.player.armor += 1;
    floatText('player-portrait', '+1', 'heal');
  }
  // 第12轮：生命泉——每回合开始恢复2点生命
  if (hasRelic('regen_2')) {
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + 2);
    floatText('player-portrait', '+2', 'heal');
  }
  // 第12轮：智慧卷轴——每回合开始额外抽1张
  if (hasRelic('extra_draw')) {
    drawCard(G.player, true);
    addBattleLog('智慧卷轴：额外抽1张牌', 'player');
  }
  if (G.player.overload > 0) { addBattleLog(`你的法力被过载削减${G.player.overload}点`, 'system'); }
  addBattleLog(`—— 第 ${Math.ceil(G.battle.turn / 2)} 回合 · 你的回合 ——`, 'system');
  G.player.overload = 0;
  G.player.heroPower.used = false;
  G.battle.heroCanAttack = !!G.player.weapon;
  G.battle.firstCardPlayed = false;
  resetChain();

  // 第15轮：玩家回合开始结算状态（中毒扣血等）+ 敏捷护甲
  if (typeof tickStatuses === 'function') tickStatuses(G.player);
  if (typeof hasStatus === 'function' && hasStatus(G.player, 'agility')) {
    G.player.armor += G.player.states.agility.stacks;
    floatText('player-portrait', '+' + G.player.states.agility.stacks + '甲', 'armor');
  }

  // P1-1: start_of_turn effects on player minions
  G.player.minions.forEach(m => {
    if (m.startOfTurn && !m.dead) {
      switch (m.startOfTurn) {
    case 'draw_1':
          drawCard(G.player, true);
          addBattleLog(`${m.name}的回合开始效果：抽1张牌`, 'player');
          break;
        case 'heal_2':
          G.player.hp = Math.min(G.player.maxHp, G.player.hp + 2);
          floatText('player-portrait', '+2', 'heal');
          addBattleLog(`${m.name}的回合开始效果：恢复2点生命`, 'player');
          break;
        case 'buff_self':
          m.attack = (m.attack || 0) + 1;
          m.currentHp = (m.currentHp || 0) + 1;
          addBattleLog(`${m.name}的回合开始效果：+1/+1`, 'player');
          break;
        case 'armor_1':
          G.player.armor += 1;
          floatText('player-portrait', '+1', 'heal');
          addBattleLog(`${m.name}的回合开始效果：+1护甲`, 'player');
          break;
        case 'deal_enemy_1':
          if (G.enemy) { dealDamage(G.enemy, 1, m); }
          break;
      }
    }
  });

  // Draw card (extra draw relic)
  drawCard(G.player, true);
  if (hasRelic('extra_draw')) {
    const ed = G.relics.find(r => r.effect === 'extra_draw' && r.level);
    const extra = ed ? ed.level : 1;
    for (let i = 0; i < extra; i++) drawCard(G.player, true);
  }
  if (G.player.hp <= 0) { onBattleLost(); return; }

  // Unfreeze player minions and reset attacks
  G.player.minions.forEach(m => {
    if (m.frozen) {
      m.frozen = false;
      m.canAttack = false;
    } else {
      m.canAttack = true;
    }
    if (m.windfury) m.attacksLeft = 2;
    else m.attacksLeft = 1;
    if (!m.charge && m.turnPlayed === G.battle.turn) {
      m.canAttack = false;
      m.attacksLeft = 0;
    }
  });

  setEndTurnButtonState('player');
  const turnInfoEl = document.getElementById('battle-turn-info');
  if (turnInfoEl) turnInfoEl.textContent = `第 ${Math.ceil(G.battle.turn / 2)} 回合 - 你的回合`;

  computeEnemyIntent();
  renderBattle();
}

function endTurn() {
  if (G.battle.ended || !G.battle.isPlayerTurn) return;
  // 第10轮：时空穿梭额外回合（连续玩家回合，敌方不动）
  if (G.battle.extraTurn) {
    G.battle.extraTurn = false;
    G.battle.turnPhase = 'extra';
    addBattleLog('—— 时空穿梭 · 额外回合 ——', 'system');
    startPlayerTurn();
    return;
  }
  G.battle.isPlayerTurn = false;
  G.battle.turnPhase = 'enemy_start';
  setEndTurnButtonState('enemy');

  // End of turn effects (player)
  G.player.minions.forEach(m => {
    if (m.endTurn === 'rag_damage') {
      const targets = [...G.enemy.minions, G.enemy].filter(t => !t.dead);
      if (targets.length > 0) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        dealDamage(target, 8, G.player);
        addBattleLog(`${m.name}的火焰打击造成8点伤害！`, 'player');
      }
    }
  });

  // Relic: fire aura
  if (hasRelic('fire_aura')) {
    dealDamage(G.enemy, 1, G.player);
    addBattleLog('灼热光环对敌方造成1点伤害', 'player');
  }

  // Relic: regen (end of turn)
  if (hasRelic('regen')) {
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + 1);
    playSfx('heal');
  }
  // Relic: regen_2 (end of turn)
  if (hasRelic('regen_2')) {
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + 2);
    playSfx('heal');
  }
  // Relic: fire_aura_2
  if (hasRelic('fire_aura_2')) {
    dealDamage(G.enemy, 3, G.player);
    addBattleLog('烈焰王冠对敌方造成3点伤害', 'player');
  }
  // Relic: fire_aura_3 (第9轮新增末日之焰)
  if (hasRelic('fire_aura_3')) {
    dealDamage(G.enemy, 4, G.player);
    addBattleLog('末日之焰对敌方造成4点伤害', 'player');
  }
  // Relic: regen_3 (第9轮新增生命之环)
  if (hasRelic('regen_3')) {
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + 3);
    playSfx('heal');
  }

  // Relic: light_well (priest signature, end of turn)
  if (hasRelic('light_well')) {
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + 2);
    floatText('player-portrait', '+2', 'heal');
    playSfx('heal');
  }

  renderBattle();
  if (G.enemy.hp <= 0) { onBattleWon(); return; }

  // Safety timer: force enemy turn to end after 10 seconds
  G.battle.safetyTimer = setTimeout(() => {
    if (G.battle && !G.battle.ended && !G.battle.isPlayerTurn) {
      /* error handled */
      try { finishEnemyTurn(); } catch(e) { /* error handled */ }
    }
  }, 10000);

  setTimeout(() => {
    try { startEnemyTurn(); }
    catch(e) { console.error('[battle]', e); /* error handled */ forceStartPlayerTurn(); }
  }, animDelay(300));
}


// ===================== ENEMY PERSONALITY =====================
// Personality passive abilities that trigger during battle.
// 'vampiric'  - enemy heals for damage it deals
// 'frenzy'    - gains +1 attack each time it takes damage
// 'guardian'  - gains armor at start of its turn
// 'commander' - minions get +1 attack while alive
// 'swarm'     - summons a 1/1 at start of its turn if board empty
// 'reflect'   - reflects damage back when taking damage

const ENEMY_PERSONALITY_INFO = {
  vampiric:  '🩸 吸血：造成伤害时恢复等量生命',
  frenzy:    '🔥 狂怒：受到伤害时攻击+1',
  guardian:  '🛡️ 守护：每回合获得3点护甲',
  commander: '⚔️ 指挥官：己方随从攻击+1',
  swarm:     '🐝 群聚：回合开始召唤1/1',
  reflect:   '🪞 反伤：受到伤害时反弹1点',
};

function getPersonalityText() {
  if (!G.enemy || !G.enemy.personality) return '';
  return ENEMY_PERSONALITY_INFO[G.enemy.personality] || '';
}

// Called at the start of the enemy turn
function applyEnemyPersonalityTurnStart() {
  if (!G.enemy || !G.enemy.personality || G.battle.ended) return;
  const p = G.enemy.personality;
  const e = G.enemy;

  if (p === 'guardian') {
    e.armor += 3;
    floatText('enemy-portrait', '+3甲', 'armor');
    addBattleLog(`${e.name}的守护特性生效，获得3点护甲`, 'enemy');
  }
  if (p === 'swarm') {
    const alive = e.minions.filter(m => !m.dead).length;
    if (alive < 2) {
      e.minions.push(createMinion({ id: 'person_swarm_' + uid(), name: '小生物', cost: 0, type: 'minion', attack: 1, hp: 1, art: '🐝', text: '' }, false));
      addBattleLog(`${e.name}的群聚特性生效，召唤一个1/1小生物`, 'enemy');
    }
  }
  if (p === 'commander') {
    e.minions.forEach(m => {
      if (!m.dead) { m.currentAttack = (m.currentAttack || m.attack || 0) + 1; }
    });
    addBattleLog(`${e.name}的指挥官特性生效，己方随从攻击+1`, 'enemy');
  }
}

// Called when the enemy deals damage (for vampiric)
function applyEnemyPersonalityOnDealDamage(dmg) {
  if (!G.enemy || G.enemy.personality !== 'vampiric' || !(dmg > 0)) return;
  const e = G.enemy;
  const before = e.hp;
  e.hp = Math.min(e.maxHp, e.hp + dmg);
  const healed = e.hp - before;
  if (healed > 0) {
    floatText('enemy-portrait', '+' + healed, 'heal');
    addBattleLog(`${e.name}的吸血特性生效，恢复${healed}点生命`, 'enemy');
  }
}

// Called when the enemy takes damage (for frenzy / reflect)
function applyEnemyPersonalityOnTakeDamage(dmg, source) {
  if (!G.enemy || !G.enemy.personality || !(dmg > 0) || G.enemy.dead) return;
  const p = G.enemy.personality;
  const e = G.enemy;

  if (p === 'frenzy') {
    e.frenzyBonus = (e.frenzyBonus || 0) + 1;
    // Apply to all enemy minions and hero attacks
    e.minions.forEach(m => {
      if (!m.dead) { m.currentAttack = (m.currentAttack || m.attack || 0) + 1; }
    });
    addBattleLog(`${e.name}的狂怒特性生效，攻击+1！`, 'enemy');
  }
  if (p === 'reflect' && source) {
    dealDamage(source, 1, e);
    floatText(source === G.player ? 'player-portrait' : 'enemy-portrait', '-1', 'damage');
    addBattleLog(`${e.name}的反伤特性生效，反弹1点伤害`, 'enemy');
  }
}


function startEnemyTurn() {
  if (G.battle.ended) return;
  G.battle.isPlayerTurn = false;
  G.battle.turnPhase = 'enemy_play';
  G.battle.turn++;
  addBattleLog(`—— 敌方回合 ${Math.floor(G.battle.turn / 2)} 开始 ——`, 'enemy');
  G.enemy.maxMana = Math.min(GAME_CONFIG.battle.maxMana, G.enemy.maxMana + 1);
  G.enemy.mana = G.enemy.maxMana - (G.enemy.overload || 0);
  G.enemy.overload = 0;
  // 第15轮：敌人专属被动——回合开始效果
  if (G.enemy.passive === 'heal_turn') {
    const heal = Math.max(1, Math.floor(G.enemy.maxHp * 0.05));
    G.enemy.hp = Math.min(G.enemy.maxHp, G.enemy.hp + heal);
    floatText('enemy-portrait', '+' + heal, 'heal');
    addBattleLog('亡灵术士汲取生命恢复' + heal + '点', 'enemy');
  }
  if (G.enemy.passive === 'strength_gain') {
    if (typeof applyStatus === 'function') applyStatus(G.enemy, 'strength', 1);
    addBattleLog('兽人战狂怒火上涌，力量+1', 'enemy');
  }
  if (G.enemy.passive === 'spell_buff') {
    G.enemy.spellPower = (G.enemy.spellPower || 0) + 1;
    addBattleLog('暗影法师凝聚魔力，法术强度+1', 'enemy');
  }

  // Enemy personality: turn start effects
  applyEnemyPersonalityTurnStart();

  drawCard(G.enemy, false);
  addBattleLog(`敌方抽牌（手牌${G.enemy.hand.length}张）`, 'enemy');
  if (G.enemy.hp <= 0) { onBattleWon(); return; }

  // Unfreeze enemy minions
  G.enemy.minions.forEach(m => {
    if (m.frozen) { m.frozen = false; m.canAttack = false; }
    else { m.canAttack = true; m.attacksLeft = m.windfury ? 2 : 1; }
  });

  resetChain();
  G.enemy.intent = '敌方回合';
  // 第15轮：敌方回合开始结算状态 + 敏捷护甲
  if (typeof tickStatuses === 'function') tickStatuses(G.enemy);
  if (typeof hasStatus === 'function' && hasStatus(G.enemy, 'agility')) {
    G.enemy.armor += G.enemy.states.agility.stacks;
    floatText('enemy-portrait', '+' + G.enemy.states.agility.stacks + '甲', 'armor');
  }
  document.getElementById('battle-turn-info').textContent = `第 ${Math.floor(G.battle.turn / 2)} 回合 - 敌方回合`;
  setEndTurnButtonState('enemy');
  renderBattle();

  setTimeout(() => {
    try { enemyAITurn(); }
    catch(e) { console.error('[battle]', e); /* error handled */ forceFinishEnemyTurn(); }
  }, animDelay(700));
}

function enemyAITurn() {
  if (G.battle.ended) return;
  tryPlayEnemyCard();

  function tryPlayEnemyCard() {
    if (G.battle.ended) return;
    if (G.enemy.hp <= 0) { onBattleWon(); return; }
    if (G.enemy.mana <= 0 || G.enemy.hand.length === 0) { proceedToAttacks(); return; }

    const aiType = G.enemy.ai;
    const sortedHand = [...G.enemy.hand].sort((a, b) => enemyCardScore(b, aiType) - enemyCardScore(a, aiType));
    let played = false;
    for (let i = 0; i < sortedHand.length; i++) {
      const card = sortedHand[i];
      if ((card.cost || 0) <= G.enemy.mana) {
        if (card.type === 'minion' && G.enemy.minions.length < 7) {
          playEnemyMinion(card);
          played = true;
          break;
        } else if (card.type === 'spell') {
          if (canEnemyUseSpell(card)) {
            playEnemySpell(card);
            if (G.player.hp <= 0) { onBattleLost(); return; }
            played = true;
            break;
          }
        } else if (card.type === 'weapon' && !G.enemy.weapon) {
          playEnemyWeapon(card);
          played = true;
          break;
        }
      }
    }

    if (played) {
      renderBattle();
      setTimeout(() => {
        try { tryPlayEnemyCard(); }
        catch(e) { /* error handled */ proceedToAttacks(); }
      }, animDelay(600));
    } else {
      proceedToAttacks();
    }
  }

  function proceedToAttacks() {
    if (G.battle.ended) return;
    if (G.enemy.hp <= 0) { onBattleWon(); return; }
    // 敌方AI进化：自动进化场上可进化且值得进化的随从
    try {
      const evolvable = G.enemy.minions.filter(m => !m.dead && canEvolve(G.enemy, m));
      const priority = evolvable.filter(m => (m.evolveEffect === 'deal_2' || m.evolveEffect === 'deal_2_all' || m.evolveEffect === 'buff_beasts_1_1' || m.evolveEffect === 'summon_2_2'));
      const candidates = priority.length > 0 ? priority : evolvable;
      if (candidates.length > 0 && G.enemy.evolvePoints > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        evolveMinion(G.enemy, target);
        renderBattle();
      }
    } catch(e) { console.error('[ai-evolve]', e); }
    G.enemy.intent = '攻击中...';
    renderBattle();
    setTimeout(() => {
      try { enemyAttacks(); }
      catch(e) { console.error('[battle]', e); /* error handled */ forceFinishEnemyTurn(); }
    }, animDelay(500));
  }
}

// Enemy AI behavior profile: aggressive goes face, control clears minions,
// spell is balanced, boss is aggressive-but-clear. Falls back to balanced.
function enemyAIProfile() {
  const t = G && G.enemy && G.enemy.ai;
  switch (t) {
    case 'aggressive': return { minionChance: 0.12, preferHighAtk: false };
    case 'control':    return { minionChance: 0.65, preferHighAtk: true };
    case 'spell':      return { minionChance: 0.35, preferHighAtk: true };
    case 'boss':       return { minionChance: 0.5,  preferHighAtk: true };
    default:           return { minionChance: 0.3,  preferHighAtk: false };
  }
}

// Score how much this enemy AI wants to play a given card (higher = earlier)
function enemyCardScore(card, ai) {
  let score = (card.cost || 0) * 10;
  const removal = ['assassinate','polymorph','mind_control','flamestrike','consecration','equality','blizzard','lightning_storm'];
  const faceDmg = ['deal_3_face','deal_6_face','deal_10_face','arcane_missiles'];
  if (ai === 'aggressive') {
    if (card.type === 'minion') score += 6;
    if (card.charge) score += 4;
    if (card.type === 'weapon') score += 5;
    if (card.type === 'spell' && card.effect && faceDmg.includes(card.effect)) score += 15;
    if (card.taunt) score -= 2;
  } else if (ai === 'control') {
    if (card.type === 'spell' && removal.includes(card.effect)) score += 20;
    if (card.taunt) score += 8;
    if (card.type === 'spell' && card.effect === 'heal_5') score += 6;
    if (card.type === 'minion' && card.attack <= 2) score -= 5;
  } else if (ai === 'spell') {
    if (card.type === 'spell') score += 9;
    if (card.spellDamage) score += 6;
    if (card.type === 'spell' && removal.includes(card.effect)) score += 8;
  }
  return score;
}

function enemyAttacks() {
  if (G.battle.ended) return;
  G.battle.turnPhase = 'enemy_attack';
  const minions = G.enemy.minions.filter(m => m.canAttack && m.attacksLeft > 0 && !m.dead);
  let idx = 0;

  // Safety: if attack phase takes too long, force finish
  G.battle.attackSafetyTimer = setTimeout(() => {
    if (G.battle && !G.battle.ended && !G.battle.isPlayerTurn && G.battle.turnPhase === 'enemy_attack') {
      /* error handled */
      forceFinishEnemyTurn();
    }
  }, 8000);

  function attackNext() {
    if (G.battle.ended) return;
    if (idx >= minions.length) {
      // Enemy hero weapon attack
      if (G.enemy.weapon && G.enemy.weapon.currentDurability > 0 && !G.battle.ended) {
        const taunts2 = G.player.minions.filter(pm => pm.taunt && !pm.dead && !pm.stealth);
        let wTarget;
        if (taunts2.length > 0) {
          wTarget = taunts2[Math.floor(Math.random() * taunts2.length)];
        } else if (G.player.minions.length > 0 && Math.random() < enemyAIProfile().minionChance) {
          wTarget = G.player.minions[Math.floor(Math.random() * G.player.minions.length)];
        } else {
          wTarget = G.player;
        }
        enemyWeaponAttack(wTarget);
        renderBattle();
        if (G.player.hp <= 0) { onBattleLost(); return; }
        if (G.enemy.hp <= 0) { onBattleWon(); return; }
      }
      finishEnemyTurn();
      return;
    }
    const m = minions[idx];
    idx++;
    if (!m || m.dead || !m.canAttack || m.attacksLeft <= 0) { setTimeout(() => { try { attackNext(); } catch(e) { console.error('[battle]', e); /* error handled */ forceFinishEnemyTurn(); } }, animDelay(50)); return; }

    // Choose target (AI-dependent: aggressive goes face, control clears minions)
    const taunts = G.player.minions.filter(pm => pm.taunt && !pm.dead && !pm.stealth);
    const aiProfile = enemyAIProfile();
    let target;
    if (taunts.length > 0) {
      target = taunts[Math.floor(Math.random() * taunts.length)];
    } else if (G.player.minions.length > 0 && Math.random() < aiProfile.minionChance) {
      const candidates = [...G.player.minions].filter(pm => !pm.stealth);
      if (aiProfile.preferHighAtk) candidates.sort((a, b) => (b.currentAttack || 0) - (a.currentAttack || 0));
      target = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))];
    } else {
      target = G.player;
    }

    attack(m, target, true);
    m.attacksLeft--;
    if (m.attacksLeft <= 0) m.canAttack = false;
    renderBattle();

    if (G.player.hp <= 0) { onBattleLost(); return; }
    if (G.enemy.hp <= 0) { onBattleWon(); return; }

    setTimeout(() => {
      try { attackNext(); }
      catch(e) { console.error('[battle]', e); /* error handled */ forceFinishEnemyTurn(); }
    }, animDelay(600));
  }
  attackNext();
}

function enemyWeaponAttack(target) {
  if (!G.enemy.weapon) return;
  const atkDmg = G.enemy.weapon.attack;
  const targetName = target === G.player ? '你的英雄' : (target.name || '随从');
  addBattleLog(`敌方英雄装备 ${G.enemy.weapon.name} 攻击 ${targetName}，造成${atkDmg}点伤害`, 'enemy');
  if (target === G.player) {
    dealDamage(G.player, atkDmg, G.enemy);
    floatText('player-portrait', '-' + atkDmg, 'damage');
  } else {
    const targetDmg = target.currentAttack || 0;
    dealDamage(target, atkDmg, G.enemy);
    if (!target.dead && targetDmg > 0) {
      dealDamage(G.enemy, targetDmg, G.player);
    }
  }
  G.enemy.weapon.currentDurability--;
  if (G.enemy.weapon.currentDurability <= 0) G.enemy.weapon = null;
  cleanupDeadMinions();
}

function finishEnemyTurn() {
  if (G.battle.ended) return;
  if (G.battle.isPlayerTurn) return; // Already transitioned to player turn
  // Clear safety timers
  if (G.battle.safetyTimer) { clearTimeout(G.battle.safetyTimer); G.battle.safetyTimer = null; }
  if (G.battle.attackSafetyTimer) { clearTimeout(G.battle.attackSafetyTimer); G.battle.attackSafetyTimer = null; }
  addBattleLog(`—— 敌方回合结束 ——`, 'enemy');

  // End of enemy turn effects
  G.enemy.minions.forEach(m => {
    if (m.endTurn === 'rag_damage') {
      const targets = [...G.player.minions, G.player].filter(t => !t.dead);
      if (targets.length > 0) {
        const target = targets[Math.floor(Math.random() * targets.length)];
        dealDamage(target, 8, G.enemy);
      }
    }
  });

  renderBattle();
  if (G.player.hp <= 0) { onBattleLost(); return; }
  if (G.enemy.hp <= 0) { onBattleWon(); return; }

  // Start player turn
  setTimeout(() => {
    try { startPlayerTurn(); }
    catch(e) { console.error('[battle]', e); /* error handled */ forceStartPlayerTurn(); }
  }, animDelay(300));
}

// Safety fallbacks
function forceFinishEnemyTurn() {
  /* error handled */
  try { finishEnemyTurn(); } catch(e) { console.error('[battle]', e); /* error handled */ forceStartPlayerTurn(); }
}

function forceStartPlayerTurn() {
  /* error handled */
  if (G.battle.safetyTimer) { clearTimeout(G.battle.safetyTimer); G.battle.safetyTimer = null; }
  if (G.battle.attackSafetyTimer) { clearTimeout(G.battle.attackSafetyTimer); G.battle.attackSafetyTimer = null; }
  G.battle.isPlayerTurn = true;
  G.battle.turnPhase = 'player';
  G.battle.ended = false;
  G.enemy.intent = null;
  G.player.heroPower.used = false;
  G.player.minions.forEach(m => {
    if (m.frozen) { m.frozen = false; m.canAttack = false; }
    else { m.canAttack = true; m.attacksLeft = m.windfury ? 2 : 1; }
  });
  try { drawCard(G.player, true); if (hasRelic('extra_draw')) drawCard(G.player, true); } catch(e) { /* error handled */ }
  setEndTurnButtonState('player');
  renderBattle();
}

function setEndTurnButtonState(state) {
  const btn = document.getElementById('end-turn-btn');
  if (!btn) return;
  btn.classList.remove('enemy-turn');
  if (state === 'enemy') {
    btn.classList.add('enemy-turn');
    btn.disabled = true;
    btn.textContent = '敌方回合';
  } else {
    btn.disabled = false;
    btn.textContent = '结束回合';
  }
}

// ===================== CARD PLAYING =====================
function playCard(card, index) {
  if (!G.battle.isPlayerTurn || G.battle.ended) return;
  if (getCardCost(card) > G.player.mana) return;
  // 连锁计数在打出时递增（结算在卡牌效果之后）

  // For targeted cards, enter targeting mode WITHOUT spending mana yet
  if (card.type === 'minion' && card.battlecry && needsBattlecryTarget(card) && hasBattlecryTargets(card) && G.player.minions.length < 7) {
    G.battle.battlecryTargeting = { card: card, index: index, targetType: getBattlecryTargetType(card) };
    G.battle.targetingMode = 'battlecry';
    renderBattle();
    return;
  }
  if (card.type === 'spell' && needsTarget(card)) {
    G.battle.spellTargeting = { card: card, index: index, targetType: getSpellTargetType(card) };
    G.battle.targetingMode = 'spell';
    renderBattle();
    return;
  }

  // Board full: refuse to summon before spending mana (keeps hand order intact)
  if (card.type === 'minion' && G.player.minions.length >= GAME_CONFIG.battle.maxMinions) {
    addBattleLog('战场已满，无法召唤更多随从', 'system');
    return;
  }

  // Spend mana and remove from hand
  const effCost = getCardCost(card);
  G.player.mana -= effCost;
  G.battle.firstCardPlayed = true;
  // Relic: echo_relic (first card each turn returns to hand)
  if (hasRelic('echo_relic') && card.type === 'spell' && !card.echoCopy) {
    const echoCopy = { ...card, uid: uid(), echoCopy: true, echo: true };
    if (G.player.hand.length < GAME_CONFIG.battle.maxHandSize) G.player.hand.push(echoCopy);
    else G.player.discardPile.push(echoCopy);
    addBattleLog(`回响之笛：${card.name}回到了你的手牌`, 'player');
  }
  if (G.battleStats) G.battleStats.cardsPlayed++;
  if (card.type === 'spell' && G.battleStats) G.battleStats.spellsCast++;
  // Overload: this card taxes your next turn's mana
  if (card.overload) {
    G.player.overload += card.overload;
    addBattleLog(`${card.name} 造成过载${card.overload}`, 'system');
  }
  G.player.hand.splice(index, 1);
  playSfx('play');

  // === Advanced mechanics ===
  // 连锁：打出后递增计数并检查触发
  incrementChain();
  checkChainTrigger(card, G.player, G.enemy);
  // 发现：从候选池发现卡牌
  if (card.discoverFrom && card.type === 'spell') {
    triggerDiscover(card, G.player);
  }
  // 魔力增幅：法术计数（在 executeSpell 内部会调用 applySpellboost）
  if (card.type === 'minion') {
    const minion = createMinion(card, true);
    G.player.minions.push(minion);
    addBattleLog(`你打出 ${card.name}`, 'player');

    // Battlecry
    if (card.battlecry) {
      executeBattlecry(card, minion, G.player, G.enemy);
    }
    renderBattle();
    if (G.enemy.hp <= 0) { onBattleWon(); return; }
    if (G.player.hp <= 0) { onBattleLost(); return; }
  } else if (card.type === 'spell') {
    addBattleLog(`你施放 ${card.name}`, 'player');
    executeSpell(card.effect, G.player, G.enemy, card);
    // 魔力增幅：使用法术触发（影之诗 Spellboost）
    applySpellboost();
    cleanupDeadMinions();
    G.player.discardPile.push(card);
    // 回响：返回副本到手牌
    maybeCreateEchoCopy(card);
    renderBattle();
    if (G.enemy.hp <= 0) { onBattleWon(); return; }
    if (G.player.hp <= 0) { onBattleLost(); return; }
  } else if (card.type === 'weapon') {
    G.player.weapon = { ...card, durability: card.durability, currentDurability: card.durability };
    G.battle.heroCanAttack = true;
    if (card.battlecry === 'deal_1_face') {
      dealDamage(G.enemy, 1, G.player);
    }
    addBattleLog(`你装备了 ${card.name}`, 'player');
    renderBattle();
    if (G.enemy.hp <= 0) { onBattleWon(); return; }
  }
}

function createMinion(card, isPlayer) {
  let attack = card.attack || 0;
  let hp = card.hp || 0;
  // Relic: 强化水晶 (+1/+1)
  if (isPlayer && hasRelic('plus_1_1')) { attack += 1; hp += 1; }
  // Relic: 力量符文 (+1 攻击力)
  if (isPlayer && hasRelic('strength')) { attack += 1; }
  // Relic: beast master (+1/+1 for beasts)
  if (isPlayer && hasRelic('beast_master') && card.race === 'beast') { attack += 1; hp += 1; }
  // Relic: battlecry boost (+1/+1 for battlecry minions)
  if (isPlayer && hasRelic('battlecry_boost') && (card.battlecry || (card.text && card.text.includes('战吼')))) { attack += 1; hp += 1; }
  // Relic: taunt bulk (+0/+2 for taunt minions)
  if (isPlayer && hasRelic('taunt_bulk') && card.taunt) { hp += 2; }
  // Relic: divine shield attack (+1 attack for divine shield minions)
  if (isPlayer && hasRelic('divine_shield_attack') && card.divineShield) { attack += 1; }
  // Relic: charge_boost (+1/+1 for charge minions)
  if (isPlayer && hasRelic('charge_boost') && card.charge) { attack += 1; hp += 1; }
  // 第12轮：力量图腾——你的随从攻击力+1
  if (isPlayer && hasRelic('minion_attack_1')) { attack += 1; }
  // Relic: divine protection (divine shield on summon)
  const hasDivine = (isPlayer && hasRelic('divine_protection')) || card.divineShield || false;

  return {
    ...card,
    uid: uid(),
    currentAttack: attack,
    currentHp: hp,
    maxHp: hp,
    taunt: card.taunt || false,
    divineShield: hasDivine,
    frozen: false,
    canAttack: card.charge || false,
    attacksLeft: card.charge ? (card.windfury ? 2 : 1) : 0,
    turnPlayed: G.battle.turn,
    windfury: card.windfury || false,
    charge: card.charge || false,
    stealth: card.stealth || false,
    // 第12轮：法术迸发标记（卡牌自带或法术迸发护符光环）
    spellburst: card.spellburst || (isPlayer && hasRelic('spellburst_aura')) || false,
    spellDamage: card.spellDamage || 0,
    isPlayer: isPlayer,
    dead: false,
    // === Advanced mechanics fields ===
    evolve: card.evolve || false,
    evolved: false,
    evolveEffect: card.evolveEffect || null,
    rebirth: card.rebirth || false,
    rebirthHp: card.rebirthHp || 1,
    rebirthUsed: false,
  };
}

// Battlecry core: applies a single battlecry trigger
function applyBattlecryOnce(card, minion, owner, opponent, target) {
  switch (card.battlecry) {
    case 'deal_1':
      dealDamage(target || opponent, 1, owner);
      break;
    case 'deal_1_face':
      dealDamage(opponent, 1, owner);
      break;
    case 'heal_3':
      if (target) {
        if (target === G.player || target === G.enemy) {
          target.hp = Math.min(target.maxHp, target.hp + 3);
          floatText(target === G.player ? 'player-portrait' : 'enemy-portrait', '+3', 'heal');
        } else {
          target.currentHp = Math.min(target.maxHp, target.currentHp + 3);
        }
      } else {
        owner.hp = Math.min(owner.maxHp, owner.hp + 3);
        floatText(owner === G.player ? 'player-portrait' : 'enemy-portrait', '+3', 'heal');
      }
      break;
    case 'draw_1':
      drawCard(owner, true);
      break;
    case 'freeze_enemy':
      if (target && !target.dead) {
        target.frozen = true;
        target.canAttack = false;
      } else if (opponent.minions.length > 0) {
        const m = opponent.minions[0];
        m.frozen = true;
        m.canAttack = false;
      }
      break;
    case 'dragon_buff':
      const hasDragon = owner.hand.some(c => c.id === 'dragon' || c.art === '🐉');
      if (hasDragon) { minion.currentAttack += 1; minion.currentHp += 1; minion.maxHp += 1; }
      break;
    case 'deathwing':
      // Destroy all other minions, discard hand
      G.player.minions = G.player.minions.filter(m => m.uid === minion.uid);
      G.enemy.minions = [];
      G.player.hand = [];
      break;
    case 'faceless_copy':
      if (target && target.uid !== minion.uid) {
        minion.currentAttack = target.currentAttack;
        minion.currentHp = target.currentHp;
        minion.maxHp = target.maxHp;
        minion.taunt = target.taunt;
        minion.divineShield = target.divineShield;
        minion.art = target.art;
        minion.name = target.name + ' (复制)';
      } else {
        const targets = owner.minions.filter(m => m.uid !== minion.uid);
        if (targets.length > 0) {
          const copy = targets[0];
          minion.currentAttack = copy.currentAttack;
          minion.currentHp = copy.currentHp;
          minion.maxHp = copy.maxHp;
          minion.taunt = copy.taunt;
          minion.divineShield = copy.divineShield;
          minion.art = copy.art;
          minion.name = copy.name + ' (复制)';
        }
      }
      break;
    case 'deal_2_all':
      opponent.minions.filter(m => !m.dead).forEach(m => dealDamage(m, 2, owner));
      break;
    case 'gain_armor_3':
      owner.armor += 3;
      addBattleLog(`${owner === G.player ? '你' : '敌方'}获得3点护甲`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'heal_4':
      owner.hp = Math.min(owner.maxHp, owner.hp + 4);
      floatText(owner === G.player ? 'player-portrait' : 'enemy-portrait', '+4', 'heal');
      addBattleLog(`${owner === G.player ? '你' : '敌方'}恢复4点生命`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'deal_3_all':
      opponent.minions.filter(m => !m.dead).forEach(m => dealDamage(m, 3, owner));
      break;
    case 'gain_armor_5':
      owner.armor += 5;
      addBattleLog(`${owner === G.player ? '你' : '敌方'}获得5点护甲`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'buff_all_2_2':
      owner.minions.forEach(m => { if (!m.dead) { m.currentAttack += 2; m.currentHp += 2; m.maxHp += 2; } });
      addBattleLog(`${owner === G.player ? '你的' : '敌方的'}随从获得+2/+2`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'heal_6':
      owner.hp = Math.min(owner.maxHp, owner.hp + 6);
      floatText(owner === G.player ? 'player-portrait' : 'enemy-portrait', '+6', 'heal');
      addBattleLog(`${owner === G.player ? '你' : '敌方'}恢复6点生命`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'reduce_hand_spells':
      owner.hand.forEach(c => { if (c.type === 'spell' && c.cost > 0) c.cost = Math.max(0, c.cost - 1); });
      addBattleLog(`${owner === G.player ? '你的' : '敌方的'}手牌中所有法术费用-1`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'draw_for_beasts':
      const beastCount = owner.minions.filter(m => !m.dead && m.race === 'beast').length;
      for (let i = 0; i < beastCount; i++) drawCard(owner, true);
      addBattleLog(`${owner === G.player ? '你' : '敌方'}有${beastCount}个野兽随从，抽取${beastCount}张牌`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'buff_murlocs_1_1':
      owner.minions.filter(m => !m.dead && m.race === 'murloc').forEach(m => { m.currentAttack += 1; m.currentHp += 1; m.maxHp += 1; });
      addBattleLog(`${owner === G.player ? '你' : '敌方'}的鱼人获得+1/+1`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'buff_beasts_1_1':
      owner.minions.filter(m => !m.dead && m.race === 'beast').forEach(m => { m.currentAttack += 1; m.currentHp += 1; m.maxHp += 1; });
      addBattleLog(`${owner === G.player ? '你的' : '敌方的'}野兽随从获得+1/+1`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'deal_3_all_incl_hero':
      opponent.minions.filter(m => !m.dead).forEach(m => dealDamage(m, 3, owner));
      dealDamage(opponent, 3, owner);
      addBattleLog(`${owner === G.player ? '你' : '敌方'}对所有敌人造成3点伤害`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'gain_armor_9':
      owner.armor += 9;
      addBattleLog(`${owner === G.player ? '你' : '敌方'}获得9点护甲`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'gain_armor_2':
      owner.armor += 2;
      addBattleLog(`${owner === G.player ? '你' : '敌方'}获得2点护甲`, owner === G.player ? 'player' : 'enemy');
      break;

    case 'summon_3_3':
      if (owner.minions.length < 7) {
        owner.minions.push(createMinion({ id: 'summon_3_3_' + uid(), name: '召唤物', cost: 0, type: 'minion', attack: 3, hp: 3, art: '🗿', text: '' }, owner === G.player));
      }
      addBattleLog(`${owner === G.player ? '你' : '敌方'}召唤了一个3/3召唤物`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'gain_armor_4':
      owner.armor += 4;
      addBattleLog(`${owner === G.player ? '你' : '敌方'}获得4点护甲`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'deal_2':
      if (target) dealDamage(target, 2, owner);
      else dealDamage(opponent, 2, owner);
      break;
    case 'summon_1_1_charge':
      if (owner.minions.length < 7) {
        const m = createMinion({ id: 'summon_1_1_' + uid(), name: '小兵', cost: 0, type: 'minion', attack: 1, hp: 1, art: '⚔️', text: '', charge: true }, owner === G.player);
        m.canAttack = true; m.attacksLeft = 1;
        owner.minions.push(m);
      }
      addBattleLog(`${owner === G.player ? '你' : '敌方'}召唤了一个1/1冲锋小兵`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'buff_all_1_1':
      owner.minions.forEach(m => { if (!m.dead) { m.currentAttack += 1; m.currentHp += 1; m.maxHp += 1; } });
      addBattleLog(`${owner === G.player ? '你的' : '敌方的'}随从获得+1/+1`, owner === G.player ? 'player' : 'enemy');
      break;
    // === 第9轮修复：补齐此前缺失的战吼效果（野兽/鱼人体系） ===
    case 'summon_2_2':
      if (owner.minions.length < 7) {
        owner.minions.push(createMinion({ id: 'bc_2_2_' + uid(), name: '召唤物', cost: 0, type: 'minion', attack: 2, hp: 2, art: '✨', text: '' }, owner === G.player));
        addBattleLog(`${owner === G.player ? '你' : '敌方'}召唤了一个2/2随从`, owner === G.player ? 'player' : 'enemy');
      }
      break;
    case 'buff_beasts_2_2':
      owner.minions.filter(m => !m.dead && m.race === 'beast').forEach(m => { m.currentAttack += 2; m.currentHp += 2; m.maxHp += 2; });
      addBattleLog(`${owner === G.player ? '你的' : '敌方的'}野兽随从获得+2/+2`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'draw_2':
      drawCard(owner, true); drawCard(owner, true);
      addBattleLog(`${owner === G.player ? '你' : '敌方'}抽了两张牌`, owner === G.player ? 'player' : 'enemy');
      break;
  }
}

function executeBattlecry(card, minion, owner, opponent, target) {
  applyBattlecryOnce(card, minion, owner, opponent, target);
  // Relic: double battlecry (player only, not for deathwing/faceless)
  if (owner === G.player && hasRelic('double_battlecry') && card.battlecry !== 'deathwing' && card.battlecry !== 'faceless_copy') {
    applyBattlecryOnce(card, minion, owner, opponent, target);
  }
}

function getSpellPower(player) {
  let sp = player.spellPower || 0;
  if (player === G.player && hasRelic('spell_power_3')) sp += 3;
  player.minions.forEach(m => {
    if (!m.dead && m.spellDamage) sp += m.spellDamage;
  });
  return sp;
}

function applyRelicToMinion(m) {
  if (hasRelic('plus_1_1')) { m.currentAttack += 1; m.maxHp += 1; m.currentHp += 1; }
  if (hasRelic('strength')) { m.currentAttack += 1; }
  if (hasRelic('beast_master') && m.race === 'beast') { m.currentAttack += 1; m.maxHp += 1; m.currentHp += 1; }
  if (hasRelic('battlecry_boost') && (m.battlecry || (m.text && m.text.includes('战吼')))) { m.currentAttack += 1; m.maxHp += 1; m.currentHp += 1; }
  if (hasRelic('taunt_bulk') && m.taunt) { m.maxHp += 2; m.currentHp += 2; }
  if (hasRelic('divine_shield_attack') && m.divineShield) { m.currentAttack += 1; }
}

function executeSpell(effect, player, enemy, card, target) {
  const sp = getSpellPower(player);
  const isPlayer = player === G.player;
  const caster = isPlayer ? '你' : '敌方';
  const logType = isPlayer ? 'player' : 'enemy';
  switch (effect) {
    case 'arcane_missiles':
      let missileCount = 0;
      for (let i = 0; i < 3 + sp; i++) {
        const targets = [...enemy.minions.filter(m => !m.dead), enemy];
        if (targets.length > 0) {
          const t = targets[Math.floor(Math.random() * targets.length)];
          dealDamage(t, 1, player);
          missileCount++;
        }
      }
      break;
    case 'heal_5':
      if (!target) target = player;
      if (target === G.player || target === G.enemy) {
        target.hp = Math.min(target.maxHp, target.hp + 5);
        floatText(target === G.player ? 'player-portrait' : 'enemy-portrait', '+' + 5, 'heal');
      } else {
        target.currentHp = Math.min(target.maxHp, target.currentHp + 5);
      }
      addBattleLog(`${caster}恢复5点生命（${target === G.player ? '你的英雄' : target === G.enemy ? '敌方英雄' : target.name}）`, logType);
      break;
    case 'deal_1':
      dealDamage(target || enemy, 1 + sp, player);
      break;
    case 'deal_3_face':
      dealDamage(target || enemy, 3 + sp, player);
      break;
    case 'poison_face_5':
      if (typeof applyStatus === 'function') applyStatus(enemy, 'poison', 5);
      else dealDamage(enemy, 5 + sp, player);
      addBattleLog(`${caster}施加了5层中毒`, logType);
      break;
    case 'poison_face_3_draw':
      if (typeof applyStatus === 'function') applyStatus(enemy, 'poison', 3);
      else dealDamage(enemy, 3 + sp, player);
      drawCard(player, true);
      addBattleLog(`${caster}施加了3层中毒并抽1张牌`, logType);
      break;
    case 'vuln_face_2_dmg2':
      if (typeof applyStatus === 'function') applyStatus(enemy, 'vulnerable', 2, 3);
      dealDamage(enemy, 2 + sp, player);
      addBattleLog(`${caster}施加了2层易伤并造成${2 + sp}点伤害`, logType);
      break;
    case 'weak_face_3_draw':
      if (typeof applyStatus === 'function') applyStatus(enemy, 'weak', 3, 3);
      drawCard(player, true);
      addBattleLog(`${caster}施加了3层虚弱并抽1张牌`, logType);
      break;
    case 'deal_6_face':
      dealDamage(target || enemy, 6 + sp, player);
      break;
    case 'deal_10_face':
      dealDamage(target || enemy, 10 + sp, player);
      break;
    case 'draw_2':
      drawCard(player, true);
      drawCard(player, true);
      addBattleLog(`${caster}抽了两张牌`, logType);
      break;
    case 'tutor_minion':
      tutorCard(player, c => c.type === 'minion', '随从');
      break;
    case 'tutor_spell':
      tutorCard(player, c => c.type === 'spell', '法术');
      break;
    case 'tutor_spell_2':
      tutorCard(player, c => c.type === 'spell', '法术');
      tutorCard(player, c => c.type === 'spell', '法术');
      break;
    case 'tutor_weapon':
      tutorCard(player, c => c.type === 'weapon', '武器');
      break;
    case 'tutor_cost_le2':
      tutorCard(player, c => (c.cost || 0) <= 2, '低费');
      break;
    case 'tutor_race_beast':
      tutorCard(player, c => c.race === 'beast', '野兽');
      break;
    case 'tutor_rare_plus':
      tutorCard(player, c => c.rarity === 'rare' || c.rarity === 'epic' || c.rarity === 'legendary', '稀有');
      break;
    case 'tutor_race_elemental':
      tutorCard(player, c => c.race === 'elemental', '元素');
      break;
    case 'tutor_race_mech':
      tutorCard(player, c => c.race === 'mech', '机械');
      break;
    case 'tutor_race_dragon':
      tutorCard(player, c => c.race === 'dragon', '龙');
      break;
    case 'tutor_race_murloc':
      tutorCard(player, c => c.race === 'murloc', '鱼人');
      break;
    case 'fan_of_knives':
      enemy.minions.forEach(m => dealDamage(m, 1 + sp, player));
      drawCard(player, true);
      addBattleLog(`${caster}使用刀扇${sp > 0 ? '(法术强度+' + sp + ')' : ''}，抽一张牌`, logType);
      break;
    case 'consecration':
      enemy.minions.forEach(m => dealDamage(m, 2 + sp, player));
      break;
    case 'flamestrike':
      enemy.minions.forEach(m => dealDamage(m, 5 + sp, player));
      break;
    case 'lightning_storm':
      enemy.minions.forEach(m => dealDamage(m, 2 + sp, player));
      break;
    case 'blizzard':
      enemy.minions.forEach(m => { dealDamage(m, 3 + sp, player); m.frozen = true; m.canAttack = false; });
      addBattleLog(`${caster}暴风雪${sp > 0 ? '(法术强度+' + sp + ')' : ''}冻结所有敌方随从`, logType);
      break;
    case 'polymorph':
      if (target && !target.dead) {
        const m = target;
        m.currentAttack = 1; m.currentHp = 1; m.maxHp = 1;
        m.taunt = false; m.divineShield = false;
        m.art = '🐑'; m.name = '绵羊';
      } else if (enemy.minions.length > 0) {
        const m = enemy.minions[0];
        m.currentAttack = 1; m.currentHp = 1; m.maxHp = 1;
        m.taunt = false; m.divineShield = false;
        m.art = '🐑'; m.name = '绵羊';
      }
      addBattleLog(`${caster}将随从变形为1/1绵羊`, logType);
      break;
    case 'assassinate':
      if (target && !target.dead) {
        addBattleLog(`${caster}刺杀了 ${target.name}`, logType);
        target.dead = true;
        checkDeathrattle(target, enemy, player);
        enemy.minions = enemy.minions.filter(x => !x.dead);
      } else if (enemy.minions.length > 0) {
        const m = enemy.minions[0];
        addBattleLog(`${caster}刺杀了 ${m.name}`, logType);
        m.dead = true;
        checkDeathrattle(m, enemy, player);
        enemy.minions = enemy.minions.filter(x => !x.dead);
      }
      break;
    case 'mind_control':
      if (target && enemy.minions.includes(target)) {
        addBattleLog(`${caster}控制了 ${target.name}`, logType);
        target.isPlayer = !target.isPlayer;
        if (player === G.player) {
          G.enemy.minions = G.enemy.minions.filter(x => x.uid !== target.uid);
          applyRelicToMinion(target);
          G.player.minions.push(target);
        } else {
          G.player.minions = G.player.minions.filter(x => x.uid !== target.uid);
          G.enemy.minions.push(target);
        }
      } else if (enemy.minions.length > 0) {
        const m = enemy.minions[0];
        addBattleLog(`${caster}控制了 ${m.name}`, logType);
        m.isPlayer = !m.isPlayer;
        if (player === G.player) {
          G.enemy.minions = G.enemy.minions.filter(x => x.uid !== m.uid);
          applyRelicToMinion(m);
          G.player.minions.push(m);
    if (m.uid) queueAnim({ type: 'summon', uid: m.uid });
        } else {
          G.player.minions = G.player.minions.filter(x => x.uid !== m.uid);
          G.enemy.minions.push(m);
        }
      }
      break;
    case 'equality':
      [...G.player.minions, ...G.enemy.minions].forEach(m => { m.currentHp = 1; m.maxHp = 1; });
      addBattleLog(`${caster}将所有随从生命值变为1`, logType);
      break;
    case 'mass_heal':
      player.minions.forEach(m => { m.currentHp = Math.min(m.maxHp, m.currentHp + 2); });
      player.hp = Math.min(player.maxHp, player.hp + 4);
      addBattleLog(`${caster}恢复友方随从2点生命，英雄恢复4点`, logType);
      break;
    case 'gain_mana_1':
      player.mana = Math.min(10, player.mana + 1);
      addBattleLog(`${caster}获得1个法力水晶`, logType);
      break;
    case 'deal_5_draw_1':
      dealDamage(target || enemy, 5 + sp, player);
      drawCard(player, true);
      addBattleLog(`${caster}抽了一张牌`, logType);
      break;
    case 'summon_two_2_2':
      for (let i = 0; i < 2; i++) {
        if (player.minions.length < 7) {
          player.minions.push(createMinion({ id: 'treant_token', name: '树人', cost: 2, attack: 2, hp: 2, rarity: 'common', art: '🌲', text: '' }, player === G.player));
        }
      }
      addBattleLog(`${caster}召唤了两个2/2树人`, logType);
      break;
    case 'summon_two_0_2':
      for (let i = 0; i < 2; i++) {
        if (player.minions.length < 7) {
          player.minions.push(createMinion({ id: 'totem_token', name: '图腾', cost: 1, attack: 2, hp: 2, rarity: 'common', art: '🪔', text: '', taunt: true }, player === G.player));
        }
      }
      addBattleLog(`${caster}召唤了两个2/2嘲讽图腾`, logType);
      break;
    case 'deal_3_draw_1':
      dealDamage(target || enemy, 3 + sp, player);
      drawCard(player, true);
      addBattleLog(`${caster}抽了一张牌`, logType);
      break;
    case 'summon_two_3_3':
      for (let i = 0; i < 2; i++) {
        if (player.minions.length < 7) {
          player.minions.push(createMinion({ id: 'treasure_token', name: '宝藏守护者', cost: 3, attack: 3, hp: 3, rarity: 'common', art: '🗿', text: '' }, player === G.player));
        }
      }
      addBattleLog(`${caster}召唤了两个3/3宝藏守护者`, logType);
      break;
    case 'heal_8':
      if (!target) target = player;
      if (target === G.player || target === G.enemy) {
        target.hp = Math.min(target.maxHp, target.hp + 8);
        floatText(target === G.player ? 'player-portrait' : 'enemy-portrait', '+' + 8, 'heal');
      } else {
        target.currentHp = Math.min(target.maxHp, target.currentHp + 8);
      }
      addBattleLog(`${caster}恢复8点生命`, logType);
      break;
    case 'smite':
      dealDamage(target, 3 + sp, player);
      break;
    case 'pw_shield':
      if (target && target !== G.player && target !== G.enemy && !target.dead) {
        target.currentAttack += 2; target.currentHp += 2; target.maxHp += 2;
        drawCard(player, true);
        addBattleLog(`${caster}为${target.name}施加真言术·盾，+2/+2并抽一张牌`, logType);
      }
      break;
    case 'holy_nova':
      enemy.minions.forEach(m => dealDamage(m, 2 + sp, player));
      player.minions.forEach(m => { m.currentHp = Math.min(m.maxHp, m.currentHp + 2); });
      player.hp = Math.min(player.maxHp, player.hp + 2);
      addBattleLog(`${caster}神圣新星：对敌方随从造成${2 + sp}点伤害，治疗友方角色`, logType);
      break;
    case 'deal_3_all':
      enemy.minions.forEach(m => dealDamage(m, 3 + sp, player));
      addBattleLog(`${caster}对所有敌方随从造成${3 + sp}点伤害`, logType);
      break;
    case 'draw_3':
      drawCard(player, true); drawCard(player, true); drawCard(player, true);
      addBattleLog(`${caster}抽了三张牌`, logType);
      break;
    case 'gain_armor_8':
      player.armor += 8;
      addBattleLog(`${caster}获得8点护甲`, logType);
      break;
    case 'buff_all_2_2':
      player.minions.forEach(m => { if (!m.dead) { m.currentAttack += 2; m.currentHp += 2; m.maxHp += 2; } });
      addBattleLog(`${caster}的所有随从获得+2/+2`, logType);
      break;
    case 'freeze_all':
      enemy.minions.forEach(m => { if (!m.dead) { m.frozen = true; m.canAttack = false; } });
      addBattleLog(`${caster}冻结了所有敌方随从`, logType);
      break;
    case 'deal_5':
      dealDamage(target || enemy, 5 + sp, player);
      break;
    case 'holy_fire':
      dealDamage(target || enemy, 6 + sp, player);
      player.hp = Math.min(player.maxHp, player.hp + 6);
      addBattleLog(`${caster}神圣之火：造成${6 + sp}点伤害并恢复6点生命`, logType);
      break;

    case 'deal_2':
      dealDamage(target || enemy, 2 + sp, player);
      break;
    case 'deal_4_all':
      enemy.minions.forEach(m => dealDamage(m, 4 + sp, player));
      dealDamage(enemy, 4 + sp, player);
      addBattleLog(`${caster}对所有敌人造成${4 + sp}点伤害`, logType);
      break;
    case 'gain_armor_4':
      player.armor += 4;
      addBattleLog(`${caster}获得4点护甲`, logType);
      break;
    case 'buff_all_3_3':
      player.minions.forEach(m => { if (!m.dead) { m.currentAttack += 3; m.currentHp += 3; m.maxHp += 3; } });
      addBattleLog(`${caster}的所有随从获得+3/+3`, logType);
      break;
    case 'buff_beasts_2_2':
      player.minions.filter(m => !m.dead && m.race === 'beast').forEach(m => { m.currentAttack += 2; m.currentHp += 2; m.maxHp += 2; });
      addBattleLog(`${caster}的野兽随从获得+2/+2`, logType);
      break;
    // === 第9轮修复：补齐此前缺失的法术效果（德鲁伊/萨满/盗贼体系） ===
    case 'gain_armor_2':
      player.armor += 2;
      addBattleLog(`${caster}获得2点护甲`, logType);
      break;
    case 'gain_armor_3':
      player.armor += 3;
      addBattleLog(`${caster}获得3点护甲`, logType);
      break;
    case 'buff_friendly_2_2':
      {
        const friends = player.minions.filter(m => !m.dead);
        if (friends.length > 0) {
          const f = friends[Math.floor(Math.random() * friends.length)];
          f.currentAttack += 2; f.currentHp += 2; f.maxHp += 2;
          addBattleLog(`${caster}为${f.name}施加印记，+2/+2`, logType);
        }
      }
      break;
    case 'freeze_enemy':
      if (target && !target.dead) {
        target.frozen = true; target.canAttack = false;
        addBattleLog(`${caster}冻结了 ${target.name}`, logType);
      } else if (enemy.minions.length > 0) {
        const m = enemy.minions[0];
        m.frozen = true; m.canAttack = false;
        addBattleLog(`${caster}冻结了 ${m.name}`, logType);
      }
      break;
    case 'buff_all_1_1':
      player.minions.forEach(m => { if (!m.dead) { m.currentAttack += 1; m.currentHp += 1; m.maxHp += 1; } });
      addBattleLog(`${caster}的所有随从获得+1/+1`, logType);
      break;
    case 'summon_1_1_charge':
      if (player.minions.length < 7) {
        const w = createMinion({ id: 'wolf_token_' + uid(), name: '幽灵狼', cost: 2, attack: 1, hp: 1, rarity: 'common', art: '🐺', text: '冲锋', charge: true }, player === G.player);
        w.canAttack = true; w.attacksLeft = 1;
        player.minions.push(w);
        addBattleLog(`${caster}召唤了一只1/1冲锋幽灵狼`, logType);
      }
      break;
    case 'time_warp':
      drawCard(player, true); drawCard(player, true); drawCard(player, true);
      G.battle.extraTurn = true;
      addBattleLog(`${caster}发动时空穿梭！抽3张牌并获得1个额外回合`, logType);
      break;
    case 'summon_two_3_2':
      for (let i = 0; i < 2; i++) {
        if (player.minions.length < 7) {
          player.minions.push(createMinion({ id: 'treant_token2', name: '树人', cost: 3, attack: 3, hp: 2, rarity: 'common', art: '🌲', text: '' }, player === G.player));
        }
      }
      addBattleLog(`${caster}召唤了两个3/2树人`, logType);
      break;
    case 'gain_mana_2':
      player.mana = Math.min(10, player.mana + 2);
      addBattleLog(`${caster}获得2个法力水晶`, logType);
      break;
    case 'gain_mana_draw':
      player.mana = Math.min(10, player.mana + 1);
      drawCard(player, true);
      addBattleLog(`${caster}获得1个法力水晶并抽一张牌`, logType);
      break;
    case 'tutor_rare_plus_2':
      tutorCard(player, c => c.rarity === 'rare' || c.rarity === 'epic' || c.rarity === 'legendary', '稀有');
      tutorCard(player, c => c.rarity === 'rare' || c.rarity === 'epic' || c.rarity === 'legendary', '稀有');
      break;
    case 'draw_1':
      drawCard(player, true);
      addBattleLog(`${caster}抽了一张牌`, logType);
      break;
    // === 第9轮新增效果补齐（新职业卡用到的通用数值） ===
    case 'deal_3':
      dealDamage(target || enemy, 3 + sp, player);
      break;
    case 'deal_4':
      dealDamage(target || enemy, 4 + sp, player);
      break;
    case 'heal_4':
      if (!target) target = player;
      if (target === G.player || target === G.enemy) {
        target.hp = Math.min(target.maxHp, target.hp + 4);
        floatText(target === G.player ? 'player-portrait' : 'enemy-portrait', '+4', 'heal');
      } else {
        target.currentHp = Math.min(target.maxHp, target.currentHp + 4);
      }
      addBattleLog(`${caster}恢复4点生命`, logType);
      break;
  }
  // 第12轮：法术迸发机制——玩家施放法术后，有法术迸发的随从+1/+1
  if (isPlayer) {
    G.player.minions.forEach(m => {
      if (!m.dead && m.spellburst) {
        m.currentAttack += 1;
        m.currentHp += 1;
        m.maxHp += 1;
        addBattleLog(`${m.name}的法术迸发：+1/+1`, 'player');
      }
    });
  }
}

// ===================== COMBAT =====================
function attack(attacker, target, isEnemyAttacking) {
  const owner = isEnemyAttacking ? G.enemy : G.player;
  const opponent = isEnemyAttacking ? G.player : G.enemy;

  // 潜行：随从攻击后解除潜行
  if (attacker.stealth) attacker.stealth = false;

  // Deal damage
  let atkDmg = attacker.currentAttack || attacker.attack || 0;
  // 第15轮：力量状态——本方随从攻击力+层数
  if (typeof hasStatus === 'function' && !isEnemyAttacking && hasStatus(G.player, 'strength')) atkDmg += G.player.states.strength.stacks;
  if (typeof hasStatus === 'function' && isEnemyAttacking && hasStatus(G.enemy, 'strength')) atkDmg += G.enemy.states.strength.stacks;
  // Relic: crit_strike (30% double damage)
  if (!isEnemyAttacking && hasRelic('crit_strike') && Math.random() < 0.3) {
    atkDmg *= 2;
    addBattleLog('暴击！造成双倍伤害', 'player');
    floatText(target === G.player ? 'player-portrait' : (target === G.enemy ? 'enemy-portrait' : 'minion-' + (target.uid||'')), '暴击!', 'crit');
  }
  // Relic: lifesteal (minions heal for damage dealt)
  if (!isEnemyAttacking && hasRelic('lifesteal') && attacker !== G.player) {
    const healAmt = Math.max(1, atkDmg);
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + Math.floor(healAmt / 2));
    floatText('player-portrait', '+' + Math.floor(healAmt / 2), 'heal');
  }

  // Log attack context (damage details logged by dealDamage)
  if (isEnemyAttacking) {
    const attackerName = attacker.name || '敌方随从';
    const targetName = target === G.player ? '你的英雄' : (target.name || '随从');
    addBattleLog(`敌方 ${attackerName} 攻击 ${targetName}`, 'enemy');
  } else {
    const attackerName = attacker.name || '随从';
    const targetName = target === G.enemy ? '敌方英雄' : (target.name || '随从');
    addBattleLog(`你的 ${attackerName} 攻击 ${targetName}`, 'player');
  }

  if (target === G.player || target === G.enemy) {
    dealDamage(target, atkDmg, owner);
    floatText(target === G.player ? 'player-portrait' : 'enemy-portrait', '-' + atkDmg, 'damage');
    // Enemy personality: vampiric heals the enemy for damage dealt
    if (isEnemyAttacking) applyEnemyPersonalityOnDealDamage(atkDmg);
    // Thorns relic: when the enemy hits your hero, reflect 1 damage to the attacker
    if (isEnemyAttacking && hasRelic('thorns') && !attacker.dead) {
      dealDamage(attacker, 1, G.player);
    }
    if (isEnemyAttacking && hasRelic('thorns_2') && !attacker.dead) {
      dealDamage(attacker, 2, G.player);
    }
    // Thorns_3 relic (第9轮新增荆棘圣域): reflect 3
    if (isEnemyAttacking && hasRelic('thorns_3') && !attacker.dead) {
      dealDamage(attacker, 3, G.player);
    }
  } else {
    // Minion vs minion
    const targetDmg = target.currentAttack || 0;

    // dealDamage handles divine shield and 0 damage correctly
    dealDamage(target, atkDmg, owner);
    // Enemy personality: vampiric heals the enemy for damage dealt
    if (isEnemyAttacking) applyEnemyPersonalityOnDealDamage(atkDmg);

    // Counterattack - only if target can fight back
    if (!attacker.dead && targetDmg > 0) {
      dealDamage(attacker, targetDmg, opponent);
    }
    
    // Freeze on hit (water elemental)
    if (attacker.freezeOnHit && !target.dead) {
      if (target === G.player || target === G.enemy) {
        // can't freeze hero in this simplified version
      } else {
        target.frozen = true;
        target.canAttack = false;
      }
    }
    
    // Thorns relic: when the enemy hits your minion, reflect 1 damage to the attacker
    if (isEnemyAttacking && hasRelic('thorns') && !attacker.dead) {
      dealDamage(attacker, 1, G.player);
    }
    // Thorns_2 relic: reflect 2
    if (isEnemyAttacking && hasRelic('thorns_2') && !attacker.dead) {
      dealDamage(attacker, 2, G.player);
    }
    // Thorns_3 relic (第9轮新增荆棘圣域): reflect 3
    if (isEnemyAttacking && hasRelic('thorns_3') && !attacker.dead) {
      dealDamage(attacker, 3, G.player);
    }
  }
  
  // Queue attack animation
  if (attacker.uid) {
    queueAnim({ type: 'attack', attackerUid: attacker.uid, direction: isEnemyAttacking ? 'left' : 'right' });
  }
  // Remove dead minions
  cleanupDeadMinions();
  renderBattle();
  
  if (G.player.hp <= 0) onBattleLost();
  if (G.enemy.hp <= 0) onBattleWon();
}

// Lifesteal: a minion with lifesteal heals its owner by the damage it deals
function applyLifesteal(source, dmg) {
  if (!source || !source.lifesteal || !(dmg > 0)) return;
  const healer = source.isPlayer ? G.player : G.enemy;
  const before = healer.hp;
  healer.hp = Math.min(healer.maxHp, healer.hp + dmg);
  const healed = healer.hp - before;
  if (healed > 0) {
    floatText(healer === G.player ? 'player-portrait' : 'enemy-portrait', '+' + healed, 'heal');
    addBattleLog(`${source.name || '随从'} 吸血，恢复${healed}点生命`, source.isPlayer ? 'player' : 'enemy');
  }
}

// Boss enrage: special effect once when a boss drops to half HP
function triggerBossEnrage() {
  const b = G.enemy;
  if (!b || !b.isBoss || b.enraged || !b.enrage || b.dead) return;
  b.enraged = true;
  addBattleLog(`⚡ ${b.name} 被激怒了！`, 'enemy');
  if (b.enrage.summons) {
    b.enrage.summons.forEach(s => {
      if (b.minions.length < 7) {
        b.minions.push(createMinion({ id: 'enrage_' + uid(), name: s.name, cost: 0, type: 'minion', attack: s.attack, hp: s.hp, art: s.art, taunt: !!s.taunt }, false));
      }
    });
    addBattleLog(`${b.name} 召唤了援军！`, 'enemy');
  }
  if (b.enrage.buff) {
    b.minions.forEach(m => { if (!m.dead) { m.currentAttack += b.enrage.buff; m.currentHp += b.enrage.buff; m.maxHp += b.enrage.buff; } });
    addBattleLog(`${b.name} 使随从获得+${b.enrage.buff}/+${b.enrage.buff}`, 'enemy');
  }
  renderBattle();
}

function dealDamage(target, amount, source) {
  if (target.dead || amount <= 0) return;
  // 第15轮：状态修正——易伤（受伤+50%）/ 虚弱（造成伤害-50%）
  if (typeof hasStatus === 'function' && hasStatus(target, 'vulnerable')) amount = Math.ceil(amount * 1.5);
  if (typeof hasStatus === 'function' && source && hasStatus(source, 'weak')) amount = Math.max(1, Math.ceil(amount * 0.5));
  const targetName = target === G.player ? '你的英雄' : target === G.enemy ? '敌方英雄' : (target.name || '随从');
  const sourceName = source ? (source === G.player ? '你' : source === G.enemy ? '敌方' : (source.name || source)) : '疲劳';
  if (target === G.player || target === G.enemy) {
    let remaining = amount;
    let armorAbsorbed = 0;
    if (target.armor > 0) {
      armorAbsorbed = Math.min(target.armor, remaining);
      target.armor -= armorAbsorbed;
      remaining -= armorAbsorbed;
    }
    target.hp -= remaining;
    target.hp = Math.max(0, target.hp);
    // P2-1: Track big damage achievements
    if (remaining >= 15 && target === G.enemy) { if (!isAchievementUnlocked('big_damage')) unlockAchievement('big_damage'); }
    if (remaining >= 30 && target === G.enemy) { if (!isAchievementUnlocked('huge_damage')) unlockAchievement('huge_damage'); }
    if (G.battleStats) {
      const ps = (source === G.player || (source && source.isPlayer === true));
      const es = (source === G.enemy || (source && source.isPlayer === false));
      if (target === G.enemy && ps) G.battleStats.dmgDealt += remaining;
      if (target === G.player && es) G.battleStats.dmgTaken += remaining;
    }
    if (target === G.player) {
      const el = document.getElementById('player-portrait');
      el.classList.add('flash-damage');
      setTimeout(() => el.classList.remove('flash-damage'), 300);
    } else {
      const el = document.getElementById('enemy-portrait');
      el.classList.add('flash-damage');
      setTimeout(() => el.classList.remove('flash-damage'), 300);
    }
    let logMsg = `${sourceName} → ${targetName}：${amount}点伤害`;
    if (armorAbsorbed > 0) logMsg += `（护盾抵消${armorAbsorbed}）`;
    logMsg += `（剩余${target.hp}）`;
    addBattleLog(logMsg, source === G.player ? 'player' : source === G.enemy ? 'enemy' : 'system');
    // Boss enrage: triggers once when the boss drops to half HP
    if (target === G.enemy && G.enemy.isBoss && !G.enemy.enraged && !G.enemy.dead && G.enemy.hp <= G.enemy.maxHp * GAME_CONFIG.boss.enrageHpThreshold) {
      triggerBossEnrage();
    }
    // Lifesteal: source minion with lifesteal heals its owner by damage dealt
    applyLifesteal(source, remaining);
    // Enemy personality: frenzy / reflect on taking damage
    if (target === G.enemy && !G.enemy.dead) {
      applyEnemyPersonalityOnTakeDamage(remaining, source);
    }
    // 第15轮：敌人专属被动——受伤叠甲
    if (target === G.enemy && !G.enemy.dead && G.enemy.passive === 'armor_on_hit' && remaining > 0) {
      G.enemy.armor += 2;
      floatText('enemy-portrait', '+2甲', 'armor');
      addBattleLog('黑骑士的铁壁：受击获得2点护甲', 'enemy');
    }
    // 第15轮：死亡中断——英雄死亡立即结算胜负，终止后续效果链
    if (target.hp <= 0 && !G.battle.ended) {
      if (target === G.player) { onBattleLost(); } else { onBattleWon(); }
      return;
    }
  } else {
    if (target.divineShield) {
      target.divineShield = false;
      addBattleLog(`${sourceName} → ${targetName}：圣盾抵消伤害`, source === G.player ? 'player' : 'system');
      return;
    }
    target.currentHp -= amount;
    if (G.battleStats) {
      const ps = (source === G.player || (source && source.isPlayer === true));
      const es = (source === G.enemy || (source && source.isPlayer === false));
      if (target.isPlayer && es) G.battleStats.dmgTaken += amount;
      if (!target.isPlayer && ps) G.battleStats.dmgDealt += amount;
    }
    // Poisonous: a poisonous source destroys any minion it damages (divine shield blocks it)
    if (source && source.poisonous && !target.dead) {
      target.currentHp = 0;
      addBattleLog(`${sourceName} 的剧毒效果触发！`, source.isPlayer ? 'player' : 'enemy');
    }
    addBattleLog(`${sourceName} → ${targetName}：${amount}点伤害（剩余${target.currentHp}）`, source === G.player ? 'player' : source === G.enemy ? 'enemy' : 'system');
    if (target.currentHp <= 0) {
      target.dead = true;
      if (target.uid) queueAnim({ type: 'death', uid: target.uid });
      playSfx('death');
      if (G.battleStats && !target.isPlayer && (source === G.player || (source && source.isPlayer === true))) G.battleStats.minionsKilled++;
      addBattleLog(`${targetName}被消灭`, 'system');
      // P2-1: Track kill achievements
      if (!target.isPlayer) {
        trackStat('totalKills');
        if (!isAchievementUnlocked('first_blood')) unlockAchievement('first_blood');
        if (source && source.poisonous && G.enemy && G.enemy.isBoss) { if (!isAchievementUnlocked('poison_kill')) unlockAchievement('poison_kill'); }
        if (target.overkill && target.overkill > 0 && !isAchievementUnlocked('overkill')) unlockAchievement('overkill');
      }
      checkDeathrattle(target, target.isPlayer ? G.player : G.enemy, target.isPlayer ? G.enemy : G.player);
    }
    // Lifesteal: source minion with lifesteal heals its owner by damage dealt
    applyLifesteal(source, amount);
  }
}

function checkDeathrattle(minion, owner, opponent) {
  if (!minion.deathrattle) return;
  switch (minion.deathrattle) {
    case 'deal_face_1':
      dealDamage(opponent, 1, owner);
      break;
    case 'summon_2_2':
      if (owner.minions.length < 7) {
        const m = createMinion({ name: '幽灵', art: '👻', attack: 2, hp: 2, cost: 2, type: 'minion' }, owner === G.player);
        owner.minions.push(m);
      }
      break;
    case 'summon_4_4':
      if (owner.minions.length < 7) {
        const m = createMinion({ name: '亡灵', art: '💀', attack: 4, hp: 4, cost: 4, type: 'minion' }, owner === G.player);
        owner.minions.push(m);
      }
      break;
    case 'summon_0_2_taunt':
      if (owner.minions.length < 7) {
        const m = createMinion({ name: '镜像', art: '🪞', attack: 0, hp: 2, cost: 1, type: 'minion', taunt: true }, owner === G.player);
        owner.minions.push(m);
      }
      break;
    case 'buff_friendly_2_2':
      const friends = owner.minions.filter(m => !m.dead);
      if (friends.length > 0) {
        const f = friends[Math.floor(Math.random() * friends.length)];
        f.currentAttack += 2; f.currentHp += 2; f.maxHp += 2;
      }
      break;
    case 'draw_1_owner':
      drawCard(owner, true);
      break;
    case 'mind_control_random':
      if (opponent.minions.length > 0) {
        const m = opponent.minions[Math.floor(Math.random() * opponent.minions.length)];
        m.isPlayer = !m.isPlayer;
        opponent.minions = opponent.minions.filter(x => x.uid !== m.uid);
        if (owner === G.player) applyRelicToMinion(m);
        owner.minions.push(m);
      }
      break;

    case 'summon_3_3':
      if (owner.minions.length < 7) {
        owner.minions.push(createMinion({ id: 'dr_3_3_' + uid(), name: '召唤物', art: '🗿', attack: 3, hp: 3, cost: 3, type: 'minion' }, owner === G.player));
      }
      break;
    case 'draw_2_owner':
      drawCard(owner, true); drawCard(owner, true);
      break;
    case 'summon_1_1_charge':
      if (owner.minions.length < 7) {
        const m = createMinion({ id: 'dr_1_1_' + uid(), name: '小兵', art: '⚔️', attack: 1, hp: 1, cost: 1, type: 'minion', charge: true }, owner === G.player);
        m.canAttack = true; m.attacksLeft = 1;
        owner.minions.push(m);
      }
      break;
  }
}

function cleanupDeadMinions() {
  let deadPlayerCount = 0;
  let deadEnemyCount = 0;
  // 复生处理：死亡但可复生的随从复活
  G.player.minions.forEach(m => {
    if (m.dead) {
      if (maybeRebirth(m, G.player)) { deadPlayerCount = deadPlayerCount; }
      else { deadPlayerCount++; }
    }
  });
  G.enemy.minions.forEach(m => {
    if (m.dead) {
      if (maybeRebirth(m, G.enemy)) { deadEnemyCount = deadEnemyCount; }
      else { deadEnemyCount++; }
    }
  });
  G.player.minions = G.player.minions.filter(m => !m.dead);
  G.enemy.minions = G.enemy.minions.filter(m => !m.dead);
  // Relic: heal_on_kill (player heals when enemy minions die)
  if (deadEnemyCount > 0 && hasRelic('heal_on_kill') && G.battle && !G.battle.ended) {
    const healKill = deadEnemyCount * 2;
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + healKill);
    floatText('player-portrait', '+' + healKill, 'heal');
    addBattleLog(`杀戮治疗：恢复${healKill}点生命`, 'player');
  }
  if (deadPlayerCount > 0 && hasRelic('deathrattle_draw') && G.battle && !G.battle.ended) {
    for (let i = 0; i < deadPlayerCount; i++) drawCard(G.player, true);
  }
}

