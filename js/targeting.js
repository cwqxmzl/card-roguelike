/* card-roguelike — targeting module
   Split from card_roguelike.html inline <script> for maintainability.
   Classic script loaded via <script src>; shares global scope with siblings. */

// ===================== BATTLECRY TARGETING =====================
function needsBattlecryTarget(card) {
  if (!card.battlecry) return false;
  const targeted = ['freeze_enemy', 'faceless_copy', 'deal_1', 'heal_3'];
  return targeted.includes(card.battlecry);
}

function getBattlecryTargetType(card) {
  switch (card.battlecry) {
    case 'freeze_enemy': return 'enemy_minion';
    case 'faceless_copy': return 'friendly_minion';
    case 'deal_1': return 'enemy';
    case 'heal_3': return 'friendly';
    default: return 'none';
  }
}

function hasBattlecryTargets(card) {
  const tt = getBattlecryTargetType(card);
  if (tt === 'enemy_minion') return G.enemy.minions.filter(m => !m.dead).length > 0;
  if (tt === 'friendly_minion') return G.player.minions.filter(m => !m.dead).length > 0;
  if (tt === 'enemy') return true;
  if (tt === 'friendly') return true;
  return false;
}

function isBattlecryTargetValid(target) {
  if (!G.battle.battlecryTargeting) return false;
  const tt = G.battle.battlecryTargeting.targetType;
  if (target === G.player || target === G.enemy) {
    if (tt === 'enemy') return target === G.enemy;
    if (tt === 'friendly') return target === G.player;
    if (tt === 'enemy_minion') return false;
    if (tt === 'friendly_minion') return false;
  } else {
    if (target.dead) return false;
    const isPlayerMinion = G.player.minions.includes(target);
    const isEnemyMinion = G.enemy.minions.includes(target);
    if (tt === 'enemy' || tt === 'enemy_minion') return isEnemyMinion;
    if (tt === 'friendly' || tt === 'friendly_minion') return isPlayerMinion;
  }
  return false;
}

function executeBattlecryOnTarget(target) {
  const bt = G.battle.battlecryTargeting;
  if (!bt) return;
  if (!isBattlecryTargetValid(target)) { renderBattle(); return; }

  const card = bt.card;
  G.player.mana -= getCardCost(card);
  G.player.hand.splice(bt.index, 1);
  if (G.battleStats) G.battleStats.cardsPlayed++;

  if (G.player.minions.length >= 7) {
    G.player.hand.push(card);
    G.player.mana += getCardCost(card);
    G.battle.battlecryTargeting = null;
    G.battle.targetingMode = null;
    renderBattle();
    return;
  }

  const minion = createMinion(card, true);
  G.player.minions.push(minion);
  addBattleLog(`你打出 ${card.name}`, 'player');
  executeBattlecry(card, minion, G.player, G.enemy, target);
  cleanupDeadMinions();

  G.battle.battlecryTargeting = null;
  G.battle.targetingMode = null;
  renderBattle();
  if (G.enemy.hp <= 0) { onBattleWon(); return; }
  if (G.player.hp <= 0) { onBattleLost(); return; }
}

function selectEnemyBattlecryTarget(card, minion) {
  const tt = getBattlecryTargetType(card);
  if (tt === 'enemy_minion') {
    const candidates = G.player.minions.filter(m => !m.dead);
    if (candidates.length > 0) return candidates.sort((a, b) => b.currentAttack - a.currentAttack)[0];
    return null;
  }
  if (tt === 'friendly_minion') {
    const candidates = G.enemy.minions.filter(m => m.uid !== minion.uid && !m.dead);
    if (candidates.length > 0) return candidates.sort((a, b) => b.currentAttack - a.currentAttack)[0];
    return null;
  }
  if (tt === 'enemy') {
    const candidates = G.player.minions.filter(m => !m.dead);
    if (candidates.length > 0 && Math.random() < enemyAIProfile().minionChance) return candidates[0];
    return G.player;
  }
  if (tt === 'friendly') {
    const damaged = G.enemy.minions.filter(m => !m.dead && m.currentHp < m.maxHp);
    if (damaged.length > 0) return damaged.sort((a, b) => (b.maxHp - b.currentHp) - (a.maxHp - a.currentHp))[0];
    return G.enemy;
  }
  return null;
}

function attackTarget(target) {
  const attacker = G.battle.selectedMinion;
  if (!attacker) return;

  // Check taunt
  const taunts = G.enemy.minions.filter(m => m.taunt && !m.dead);
  if (taunts.length > 0 && !(target.taunt) && target !== G.enemy) {
    G.battle.selectedMinion = null;
    G.battle.targetingMode = null;
    G.battle.isHeroAttacker = false;
    renderBattle();
    return;
  }

  playSfx('attack');
  if (G.battle.isHeroAttacker) {
    heroAttack(target);
  } else {
    attack(attacker, target, false);
    attacker.attacksLeft--;
    if (attacker.attacksLeft <= 0) attacker.canAttack = false;
  }

  G.battle.selectedMinion = null;
  G.battle.targetingMode = null;
  G.battle.isHeroAttacker = false;
  renderBattle();
}

function heroAttack(target) {
  if (!G.player.weapon) return;
  G.battle.heroCanAttack = false;
  const atkDmg = G.player.weapon.attack;

  if (target === G.enemy) {
    dealDamage(G.enemy, atkDmg, G.player);
    floatText('enemy-portrait', '-' + atkDmg, 'damage');
  } else {
    // Attack enemy minion - hero does not take counterattack damage
    // dealDamage handles divine shield and 0 damage correctly
    dealDamage(target, atkDmg, G.player);
    // Thorns relic
    if (hasRelic('thorns') && !target.dead) {
      dealDamage(target, 1, G.player);
    }
  }

  // Weapon durability
  G.player.weapon.currentDurability--;
  if (G.player.weapon.currentDurability <= 0) {
    if (G.player.weapon.id === 'doom_blade') {
      dealDamage(G.enemy, 3, G.player);
      addBattleLog('末日之刃触发，对敌方造成3点伤害！', 'player');
    }
    G.player.weapon = null;
  }

  cleanupDeadMinions();
  if (G.player.hp <= 0) onBattleLost();
  if (G.enemy.hp <= 0) onBattleWon();
}

