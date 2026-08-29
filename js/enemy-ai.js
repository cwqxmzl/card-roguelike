/* card-roguelike — enemy-ai module
   Split from card_roguelike.html inline <script> for maintainability.
   Classic script loaded via <script src>; shares global scope with siblings. */

// ===================== ENEMY AI HELPERS =====================
function canEnemyUseSpell(card) {
  switch (card.effect) {
    case 'arcane_missiles': case 'deal_3_face': case 'deal_6_face': case 'deal_10_face':
    case 'fan_of_knives': case 'consecration': case 'flamestrike': case 'lightning_storm': case 'blizzard':
      return true;
    case 'heal_5': case 'mass_heal':
      return G.enemy.hp < G.enemy.maxHp * 0.5 || G.enemy.minions.some(m => m.currentHp < m.maxHp);
    case 'draw_2':
      return G.enemy.hand.length < 3;
    case 'polymorph': case 'assassinate': case 'mind_control':
      return G.player.minions.length > 0;
    case 'equality':
      return G.player.minions.length > G.enemy.minions.length;
    case 'gain_mana_1':
      return false; // coin handled separately
    default: return true;
  }
}

function playEnemyMinion(card) {
  G.enemy.mana -= card.cost;
  if (card.overload) G.enemy.overload = (G.enemy.overload || 0) + card.overload;
  G.enemy.hand = G.enemy.hand.filter(c => c.uid !== card.uid);
  const minion = createMinion(card, false);
  G.enemy.minions.push(minion);
  if (card.battlecry) {
    let target = null;
    if (needsBattlecryTarget(card)) target = selectEnemyBattlecryTarget(card, minion);
    executeBattlecry(card, minion, G.enemy, G.player, target);
  }
  addBattleLog(`敌方打出 ${card.name}`, 'enemy');
  renderBattle();
}

function playEnemySpell(card) {
  G.enemy.mana -= card.cost;
  if (card.overload) G.enemy.overload = (G.enemy.overload || 0) + card.overload;
  G.enemy.hand = G.enemy.hand.filter(c => c.uid !== card.uid);
  addBattleLog(`敌方施放 ${card.name}`, 'enemy');
  executeSpell(card.effect, G.enemy, G.player, card);
  cleanupDeadMinions();
  G.enemy.discardPile.push(card);
  renderBattle();
  if (G.player.hp <= 0) onBattleLost();
  if (G.enemy.hp <= 0) onBattleWon();
}

function playEnemyWeapon(card) {
  G.enemy.mana -= card.cost;
  if (card.overload) G.enemy.overload = (G.enemy.overload || 0) + card.overload;
  G.enemy.hand = G.enemy.hand.filter(c => c.uid !== card.uid);
  G.enemy.weapon = { ...card, currentDurability: card.durability };
  if (card.battlecry === 'deal_1_face') dealDamage(G.player, 1, G.enemy);
  addBattleLog(`敌方装备了 ${card.name}`, 'enemy');
  renderBattle();
}

function toggleBattleStats() {
  const panel = document.getElementById('battle-stats-panel');
  if (!panel) return;
  if (panel.style.display === 'none') renderBattleStats();
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}
function renderBattleStats() {
  const s = G.battleStats || {};
  const map = { 'stat-dmg-dealt': s.dmgDealt || 0, 'stat-dmg-taken': s.dmgTaken || 0, 'stat-cards': s.cardsPlayed || 0, 'stat-spells': s.spellsCast || 0, 'stat-kills': s.minionsKilled || 0 };
  Object.entries(map).forEach(([id, v]) => { const el = document.getElementById(id); if (el) el.textContent = v; });
}

function getEnemyIntentText() {
  if (!G || !G.enemy) return '';
  const enraged = G.enemy.enraged ? ' ⚡激怒' : '';
  return G.enemy.intent ? `敌方意图：${G.enemy.intent}${enraged}` : (enraged ? `${G.enemy.name || '敌方'}已激怒` : '');
}

function computeEnemyIntent() {
  if (!G.enemy) return;
  const playableCards = G.enemy.hand.filter(c => (c.cost || 0) <= G.enemy.maxMana + 1);
  if (playableCards.length === 0) {
    G.enemy.intent = '准备攻击';
  } else {
    const types = playableCards.map(c => c.type);
    if (types.includes('spell')) G.enemy.intent = '施法意图';
    else if (types.includes('minion')) G.enemy.intent = '召唤随从';
    else G.enemy.intent = '装备武器';
  }
  const intentEl = document.getElementById('enemy-intent');
  if (intentEl) intentEl.textContent = getEnemyIntentText();
}

// ===================== HERO POWER =====================
function useHeroPower() {
  if (!G.battle.isPlayerTurn || G.battle.ended) return;
  if (G.player.heroPower.used) return;
  if (G.player.mana < G.player.heroPower.cost) return;

  const type = G.player.heroPower.type;

  // Mage (deal 1 to any) and Priest (heal 2 to any) need target selection
  if (type === 'mage' || type === 'priest') {
    G.battle.heroPowerTargeting = { type: type, targetType: 'any' };
    G.battle.targetingMode = 'hero_power';
    renderBattle();
    return;
  }

  G.player.mana -= G.player.heroPower.cost;
  G.player.heroPower.used = true;

  switch (type) {
    case 'warrior':
      G.player.armor += 2;
      floatText('player-portrait', '+2', 'heal');
      addBattleLog(`你使用了英雄技能：${G.player.heroPower.name}，获得2点护甲`, 'player');
      break;
    case 'hunter':
      dealDamage(G.enemy, 2, G.player);
      floatText('enemy-portrait', '-2', 'damage');
      addBattleLog(`你使用了英雄技能：${G.player.heroPower.name}，对敌方造成2点伤害`, 'player');
      break;
    case 'paladin':
      if (G.player.minions.length < 7) {
        G.player.minions.push(createMinion({ id: 'silver_hand', name: '白银之手新兵', cost: 1, attack: 1, hp: 1, rarity: 'common', art: '⚔️', text: '' }, true));
        addBattleLog(`你使用了英雄技能：${G.player.heroPower.name}，召唤一个1/1白银之手新兵`, 'player');
      } else {
        addBattleLog('战场已满，英雄技能无效', 'system');
        G.player.mana += G.player.heroPower.cost;
        G.player.heroPower.used = false;
        return;
      }
      break;
    case 'warlock':
      G.player.hp -= 2;
      floatText('player-portrait', '-2', 'damage');
      drawCard();
      addBattleLog(`你使用了英雄技能：${G.player.heroPower.name}，受到2点伤害并抽一张牌`, 'player');
      break;
    case 'rogue':
      G.player.weapon = { id: 'rogue_dagger', name: '匕首', attack: 1, durability: 2, currentDurability: 2, cost: 1, type: 'weapon', art: '🗡️' };
      G.battle.heroCanAttack = true;
      addBattleLog(`你使用了英雄技能：${G.player.heroPower.name}，装备了一把1/2匕首`, 'player');
      break;
  }
  renderBattle();
  if (G.enemy.hp <= 0) onBattleWon();
}

function isHeroPowerTargetValid(target) {
  if (!G.battle.heroPowerTargeting) return false;
  if (target === G.player || target === G.enemy) return true;
  if (target.dead) return false;
  return G.player.minions.includes(target) || G.enemy.minions.includes(target);
}

function executeHeroPowerOnTarget(target) {
  const hpt = G.battle.heroPowerTargeting;
  if (!hpt) return;
  if (!isHeroPowerTargetValid(target)) { renderBattle(); return; }

  G.player.mana -= G.player.heroPower.cost;
  G.player.heroPower.used = true;

  if (hpt.type === 'mage') {
    dealDamage(target, 1, G.player);
    addBattleLog(`你使用了英雄技能：${G.player.heroPower.name}`, 'player');
  } else if (hpt.type === 'priest') {
    if (target === G.player || target === G.enemy) {
      target.hp = Math.min(target.maxHp, target.hp + 2);
      floatText(target === G.player ? 'player-portrait' : 'enemy-portrait', '+2', 'heal');
    } else {
      target.currentHp = Math.min(target.maxHp, target.currentHp + 2);
    }
    addBattleLog(`你使用了英雄技能：${G.player.heroPower.name}，恢复2点生命`, 'player');
  }

  G.battle.heroPowerTargeting = null;
  G.battle.targetingMode = null;
  cleanupDeadMinions();
  renderBattle();
  if (G.enemy.hp <= 0) onBattleWon();
  if (G.player.hp <= 0) onBattleLost();
}

// ===================== DRAW CARDS =====================
function drawCard(entity, showLog) {
  if (entity.drawPile.length === 0) {
    // Fatigue
    entity.fatigue = (entity.fatigue || 0) + 1;
    dealDamage(entity, entity.fatigue, null);
    if (entity === G.player && G.player.hp <= 0) onBattleLost();
    if (entity === G.enemy && G.enemy.hp <= 0) onBattleWon();
    return;
  }
  const card = entity.drawPile.pop();
  if (entity.hand.length >= GAME_CONFIG.battle.maxHandSize) {
    entity.discardPile.push(card);
    if (showLog) {
      if (entity === G.player) addBattleLog(`手牌已满，${card.name}被弃置`, 'system');
      else addBattleLog(`敌方手牌已满，牌被弃置`, 'system');
    }
  } else {
    entity.hand.push(card);
    if (showLog) {
      if (entity === G.player) addBattleLog(`抽到了 ${card.name}`, 'player');
      else addBattleLog(`敌方抽牌（手牌${entity.hand.length}张）`, 'enemy');
    }
  }
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

