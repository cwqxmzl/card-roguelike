/* card-roguelike — render-battle module
   Split from card_roguelike.html inline <script> for maintainability.
   Classic script loaded via <script src>; shares global scope with siblings. */

// ===================== BATTLE RENDER =====================
function renderBattle() {
  if (!G.enemy) return;
  
  // Enemy info
  document.getElementById('enemy-portrait').textContent = G.enemy.portrait;
  const enemyNameEl = document.getElementById('enemy-name');
  enemyNameEl.textContent = G.enemy.name;
  enemyNameEl.style.cursor = 'pointer';
  enemyNameEl.onclick = () => showEnemyDetail();
  document.getElementById('enemy-hp-text').textContent = `${G.enemy.hp}/${G.enemy.maxHp}`;
  const enemyHpFill = document.getElementById('enemy-hp-fill');
  enemyHpFill.style.width = (G.enemy.hp / G.enemy.maxHp * 100) + '%';
  enemyHpFill.classList.toggle('low-hp', G.enemy.hp / G.enemy.maxHp < 0.3);
  document.getElementById('enemy-armor').textContent = G.enemy.armor > 0 ? `🛡️ ${G.enemy.armor}` : '';
  const intentEl = document.getElementById('enemy-intent');
  if (intentEl) intentEl.textContent = getEnemyIntentText();

  // Enemy hand count, mana, and skill
  const enemyHandEl = document.getElementById('enemy-hand-count');
  if (enemyHandEl) enemyHandEl.textContent = `🃏 ${G.enemy.hand.length}`;
  const enemyManaEl = document.getElementById('enemy-mana-display');
  if (enemyManaEl) enemyManaEl.textContent = `💎 ${G.enemy.mana}/${G.enemy.maxMana}`;
  const enemySkillEl = document.getElementById('enemy-skill-display');
  if (enemySkillEl) {
    const aiTypes = { aggressive: '⚔️ 激进', control: '🛡️ 控制', spell: '🔮 法术', boss: '💀 首领' };
    const skillText = aiTypes[G.enemy.ai] || '⚔️';
    enemySkillEl.textContent = skillText;
    enemySkillEl.title = `AI策略：${skillText} | 牌库${G.enemy.drawPile.length}张`;
  }
  
  // Player info
  const playerPortraitEl = document.getElementById('player-portrait');
  if (G.player.portraitImg) {
    playerPortraitEl.style.backgroundImage = `url('${G.player.portraitImg}')`;
    playerPortraitEl.style.backgroundSize = 'cover';
    playerPortraitEl.style.backgroundPosition = 'center';
    playerPortraitEl.textContent = '';
  } else {
    playerPortraitEl.style.backgroundImage = '';
    playerPortraitEl.textContent = G.player.portrait || '🧙';
  }
  document.getElementById('player-hp-text').textContent = `${G.player.hp}/${G.player.maxHp}`;
  const playerHpFill = document.getElementById('player-hp-fill');
  playerHpFill.style.width = (G.player.hp / G.player.maxHp * 100) + '%';
  playerHpFill.classList.toggle('low-hp', G.player.hp / G.player.maxHp < 0.3);
  document.getElementById('player-armor').textContent = G.player.armor > 0 ? `🛡️ ${G.player.armor}` : '';
  document.getElementById('player-weapon').textContent = G.player.weapon ? `🗡️${G.player.weapon.attack} | ${G.player.weapon.currentDurability}` : '';
  
  // Hero power
  const hpEl = document.getElementById('hero-power');
  hpEl.className = 'hero-power';
  if (G.player.heroPower.used) hpEl.classList.add('used');
  if (!G.battle.isPlayerTurn || G.player.mana < G.player.heroPower.cost) hpEl.classList.add('disabled');

  // Player portrait - weapon attack or spell target
  const playerPortrait = document.getElementById('player-portrait');
  playerPortrait.classList.remove('can-attack', 'minion-target');
  playerPortrait.onclick = null;
  if (G.battle.targetingMode === 'spell' && isSpellTargetValid(G.player)) {
    playerPortrait.classList.add('minion-target');
    playerPortrait.onclick = () => castSpellOnTarget(G.player);
  } else if (G.battle.targetingMode === 'battlecry' && isBattlecryTargetValid(G.player)) {
    playerPortrait.classList.add('minion-target');
    playerPortrait.onclick = () => executeBattlecryOnTarget(G.player);
  } else if (G.battle.targetingMode === 'hero_power' && isHeroPowerTargetValid(G.player)) {
    playerPortrait.classList.add('minion-target');
    playerPortrait.onclick = () => executeHeroPowerOnTarget(G.player);
  } else if (G.battle.isPlayerTurn && G.player.weapon && G.battle.heroCanAttack && !G.battle.ended && !G.battle.targetingMode) {
    playerPortrait.classList.add('can-attack');
    playerPortrait.onclick = () => selectHeroAttacker();
  }

  // Enemy portrait - click to view details when not targeting
  const enemyPortrait = document.getElementById('enemy-portrait');
  enemyPortrait.classList.remove('minion-target');
  // 默认：非战斗操作时点击查看怪物详情
  if (!G.battle.targetingMode && !G.battle.selectedMinion && G.battle.isPlayerTurn && !G.battle.ended) {
    enemyPortrait.onclick = () => showEnemyDetail();
    enemyPortrait.title = '点击查看怪物详情';
  } else {
    enemyPortrait.onclick = null;
  }
  if (G.battle.targetingMode === 'target' && G.battle.selectedMinion) {
    const taunts = G.enemy.minions.filter(m => m.taunt && !m.dead);
    if (taunts.length === 0) {
      enemyPortrait.classList.add('minion-target');
      enemyPortrait.onclick = () => attackTarget(G.enemy);
    }
  } else if (G.battle.targetingMode === 'spell' && isSpellTargetValid(G.enemy)) {
    enemyPortrait.classList.add('minion-target');
    enemyPortrait.onclick = () => castSpellOnTarget(G.enemy);
  } else if (G.battle.targetingMode === 'battlecry' && isBattlecryTargetValid(G.enemy)) {
    enemyPortrait.classList.add('minion-target');
    enemyPortrait.onclick = () => executeBattlecryOnTarget(G.enemy);
  } else if (G.battle.targetingMode === 'hero_power' && isHeroPowerTargetValid(G.enemy)) {
    enemyPortrait.classList.add('minion-target');
    enemyPortrait.onclick = () => executeHeroPowerOnTarget(G.enemy);
  }
  
  // Mana bar
  renderMana();
  
  // Deck/discard counts
  document.getElementById('deck-count').textContent = G.player.drawPile.length;
  document.getElementById('discard-count').textContent = G.player.discardPile.length;
  
  // Enemy minions
  const enemyMinionArea = document.getElementById('enemy-minions');
  const enemyFrag = document.createDocumentFragment();
  G.enemy.minions.forEach(m => { enemyFrag.appendChild(renderMinion(m, false)); });
  enemyMinionArea.replaceChildren(enemyFrag);

  // Player minions
  const playerMinionArea = document.getElementById('player-minions');
  const playerFrag = document.createDocumentFragment();
  G.player.minions.forEach(m => { playerFrag.appendChild(renderMinion(m, true)); });
  playerMinionArea.replaceChildren(playerFrag);

  // Hand
  const handArea = document.getElementById('hand-area');
  const handFrag = document.createDocumentFragment();
  G.player.hand.forEach((card, i) => { handFrag.appendChild(renderCard(card, i)); });
  handArea.replaceChildren(handFrag);
  
  // Battle log
  renderBattleLog();
  
  // Turn info
  if (G.battle.targetingMode === 'spell' && G.battle.spellTargeting) {
    document.getElementById('battle-turn-info').textContent = `选择目标 - ${G.battle.spellTargeting.card.name}（点击空白处取消）`;
  } else if (G.battle.targetingMode === 'battlecry' && G.battle.battlecryTargeting) {
    document.getElementById('battle-turn-info').textContent = `选择目标 - ${G.battle.battlecryTargeting.card.name}（点击空白处取消）`;
  } else if (G.battle.targetingMode === 'hero_power' && G.battle.heroPowerTargeting) {
    document.getElementById('battle-turn-info').textContent = `选择目标 - ${G.player.heroPower.name}（点击空白处取消）`;
  } else {
    document.getElementById('battle-turn-info').textContent = `第 ${Math.ceil(G.battle.turn / 2)} 回合 - ${G.battle.isPlayerTurn ? '你的回合' : '敌方回合'}`;
  }
  setEndTurnButtonState(G.battle.isPlayerTurn && !G.battle.ended ? 'player' : 'enemy');
  applyBattleAnimations();
}


// Apply attack/death animations after render
function applyBattleAnimations() {
  if (!G.battle || !G.battle.animQueue) return;
  if (typeof SETTINGS !== 'undefined' && SETTINGS.animations === false) { G.battle.animQueue = []; return; }
  G.battle.animQueue.forEach(anim => {
    if (anim.type === 'attack' && anim.attackerUid) {
      const el = document.querySelector(`.minion[data-uid="${anim.attackerUid}"]`);
      if (el) {
        el.classList.add(anim.direction === 'right' ? 'attack-right' : 'attack-left');
        setTimeout(() => el.classList.remove('attack-right', 'attack-left'), 400);
      }
    }
    if (anim.type === 'death' && anim.uid) {
      const el = document.querySelector(`.minion[data-uid="${anim.uid}"]`);
      if (el) {
        el.classList.add('dying');
      }
    }
    if (anim.type === 'summon' && anim.uid) {
      const el = document.querySelector(`.minion[data-uid="${anim.uid}"]`);
      if (el) {
        el.classList.add('minion-just-summoned');
        setTimeout(() => el.classList.remove('minion-just-summoned'), 400);
      }
    }
  });
  G.battle.animQueue = [];
}

function queueAnim(anim) {
  if (!G.battle) return;
  if (!G.battle.animQueue) G.battle.animQueue = [];
  G.battle.animQueue.push(anim);
}

function renderMana() {
  const bar = document.getElementById('mana-bar');
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 10; i++) {
    const crystal = document.createElement('div');
    crystal.className = 'mana-crystal';
    if (i < G.player.mana) crystal.classList.add('full');
    else crystal.classList.add('empty');
    frag.appendChild(crystal);
  }
  bar.replaceChildren(frag);
}

function renderMinion(m, isPlayer) {
  const div = document.createElement('div');
  div.className = 'minion';
  if (m.uid) div.setAttribute('data-uid', m.uid);
  if (m.taunt) div.classList.add('taunt');
  if (m.divineShield) div.classList.add('divine-shield');
  if (m.frozen) div.classList.add('frozen');
  if (isPlayer && G.battle.isPlayerTurn && m.canAttack && m.attacksLeft > 0) {
    div.classList.add('can-attack');
  } else if (!m.canAttack && !m.frozen) {
    div.classList.add('exhausted');
  }
  
  const art = document.createElement('div');
  art.className = 'minion-art';
  art.textContent = m.art;
  div.appendChild(art);
  
  const stats = document.createElement('div');
  stats.className = 'minion-stats';
  const atkSpan = document.createElement('span');
  atkSpan.className = 'card-attack';
  atkSpan.textContent = m.currentAttack;
  atkSpan.style.color = m.currentAttack > (m.attack || 0) ? '#20a040' : '#e67e22';
  const hpSpan = document.createElement('span');
  hpSpan.className = 'card-hp';
  hpSpan.textContent = m.currentHp;
  hpSpan.style.color = m.currentHp < m.maxHp ? '#e04040' : (m.currentHp > m.maxHp ? '#20a040' : '#fff');
  stats.appendChild(atkSpan);
  stats.appendChild(hpSpan);
  div.appendChild(stats);
  
  // Buff icons with tooltips
  const buffs = document.createElement('div');
  buffs.className = 'minion-buffs';
  const buffInfo = {
    taunt: { icon: '🛡', name: '嘲讽', desc: '敌方必须先攻击此随从' },
    divineShield: { icon: '✨', name: '圣盾', desc: '免疫下一次伤害' },
    frozen: { icon: '❄', name: '冻结', desc: '无法攻击，下回合解冻' },
    windfury: { icon: '🌀', name: '风怒', desc: '每回合可攻击两次' },
  };
  ['taunt', 'divineShield', 'frozen', 'windfury'].forEach(key => {
    if (m[key]) {
      const b = document.createElement('div');
      b.className = 'buff-icon buff-' + key.replace('divineShield', 'divine');
      b.textContent = buffInfo[key].icon;
      b.title = buffInfo[key].name + ': ' + buffInfo[key].desc;
      buffs.appendChild(b);
    }
  });
  if (buffs.children.length > 0) div.appendChild(buffs);
  
  // Click handler for attacking
  if (isPlayer && m.canAttack && m.attacksLeft > 0 && G.battle.isPlayerTurn && !G.battle.targetingMode) {
    div.onclick = () => selectAttacker(m);
  }

  // Target indicator (for minion attacks)
  if (G.battle.targetingMode === 'target' && G.battle.selectedMinion) {
    if (!isPlayer) {
      const taunts = G.enemy.minions.filter(mm => mm.taunt && !mm.dead);
      if (taunts.length === 0 || m.taunt) {
        div.classList.add('minion-target');
        div.onclick = () => attackTarget(m);
      }
    }
  }

  // Spell target indicator
  if (G.battle.targetingMode === 'spell' && isSpellTargetValid(m)) {
    div.classList.add('minion-target');
    div.onclick = () => castSpellOnTarget(m);
  }

  // Battlecry target indicator
  if (G.battle.targetingMode === 'battlecry' && isBattlecryTargetValid(m)) {
    div.classList.add('minion-target');
    div.onclick = () => executeBattlecryOnTarget(m);
  }

  // Hero power target indicator
  if (G.battle.targetingMode === 'hero_power' && isHeroPowerTargetValid(m)) {
    div.classList.add('minion-target');
    div.onclick = () => executeHeroPowerOnTarget(m);
  }

  // Detail view: right-click (desktop) or long-press (mobile, only when not targeting)
  div.oncontextmenu = (e) => { e.preventDefault(); showCardDetail(m); return false; };
  if (!G.battle.targetingMode) {
    let mPressTimer = null;
    let mLongPressed = false;
    div.addEventListener('touchstart', () => {
      mLongPressed = false;
      mPressTimer = setTimeout(() => {
        mLongPressed = true;
        showCardDetail(m);
        if (navigator.vibrate) navigator.vibrate(30);
      }, 500);
    });
    div.addEventListener('touchend', (e) => {
      if (mPressTimer) { clearTimeout(mPressTimer); mPressTimer = null; }
      if (mLongPressed) { e.preventDefault(); e.stopPropagation(); }
    });
    div.addEventListener('touchmove', () => { if (mPressTimer) { clearTimeout(mPressTimer); mPressTimer = null; } });
  }

  return div;
}

function renderCard(card, index) {
  const div = document.createElement('div');
  div.className = `card in-hand card-${card.type} rarity-${card.rarity || 'common'}`;
  const playable = G.battle.isPlayerTurn && getCardCost(card) <= G.player.mana;
  if (playable) div.classList.add('playable');
  else div.classList.add('unplayable');
  
  // Cost
  const cost = document.createElement('div');
  cost.className = 'card-cost';
  const effCost = getCardCost(card);
  if (effCost < (card.cost || 0)) cost.classList.add('reduced');
  cost.textContent = effCost;
  div.appendChild(cost);
  
  // Rarity
  if (card.rarity) {
    const rarity = document.createElement('div');
    rarity.className = `card-rarity rarity-${card.rarity}`;
    div.appendChild(rarity);
  }
  
  // Name
  const name = document.createElement('div');
  name.className = 'card-name';
  name.textContent = card.name + (card.upgraded ? ' ✨' : '');
  div.appendChild(name);
  
  // Art
  const art = document.createElement('div');
  art.className = 'card-art';
  if (card.artImg) {
    art.style.backgroundImage = `url('${card.artImg}')`;
    art.style.backgroundSize = 'cover';
    art.style.backgroundPosition = 'center';
    art.textContent = '';
  } else {
    art.textContent = card.art;
  }
  div.appendChild(art);
  
  // Text
  const text = document.createElement('div');
  text.className = 'card-text';
  text.textContent = card.text || '';
  div.appendChild(text);
  
  // Stats
  if (card.type === 'minion') {
    const stats = document.createElement('div');
    stats.className = 'card-stats';
    stats.innerHTML = `<span class="card-attack">${card.attack}</span><span class="card-hp">${card.hp}</span>`;
    div.appendChild(stats);
  } else if (card.type === 'weapon') {
    const stats = document.createElement('div');
    stats.className = 'card-stats';
    stats.innerHTML = `<span class="card-attack">${card.attack}</span><span class="card-hp">${card.durability}</span>`;
    div.appendChild(stats);
  }
  
  // Card detail: long-press (mobile) or right-click (desktop)
  let pressTimer = null;
  let longPressed = false;
  div.addEventListener('touchstart', (e) => {
    longPressed = false;
    pressTimer = setTimeout(() => {
      longPressed = true;
      showCardDetail(card);
      if (navigator.vibrate) navigator.vibrate(30);
    }, 400);
  });
  div.addEventListener('touchend', (e) => {
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    if (longPressed) { e.preventDefault(); e.stopPropagation(); }
  });
  div.addEventListener('touchmove', () => {
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
  });
  div.oncontextmenu = (e) => { e.preventDefault(); showCardDetail(card); return false; };

  // Desktop hover tooltip (uses the existing #card-tooltip element)
  // Disabled on touch devices: synthetic mouseenter on mobile would leave the tooltip stuck, blocking the hand.
  const isTouchDevice = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
  const tooltipEl = document.getElementById('card-tooltip');
  if (tooltipEl && !isTouchDevice) {
    div.addEventListener('mouseenter', () => {
      if (G.battle.targetingMode) return;
      tooltipEl.innerHTML = buildCardTooltipHtml(card);
      const r = div.getBoundingClientRect();
      tooltipEl.style.left = Math.max(4, Math.min(window.innerWidth - 240, r.left)) + 'px';
      tooltipEl.style.top = (r.top - 12) + 'px';
      tooltipEl.style.display = 'block';
    });
    div.addEventListener('mouseleave', () => { tooltipEl.style.display = 'none'; });
  }

  if (playable && !G.battle.targetingMode) {
    div.onclick = () => { if (!longPressed) playCard(card, index); };
  } else if (G.battle.targetingMode) {
    div.onclick = () => {
      G.battle.spellTargeting = null;
      G.battle.battlecryTargeting = null;
      G.battle.heroPowerTargeting = null;
      G.battle.targetingMode = null;
      G.battle.selectedMinion = null;
      G.battle.isHeroAttacker = false;
      renderBattle();
    };
  } else {
    div.onclick = () => { if (!longPressed) showCardDetail(card); };
  }
  
  return div;
}

function needsTarget(card) {
  if (card.type !== 'spell') return false;
  const targetedEffects = ['deal_3_face', 'deal_6_face', 'deal_10_face', 'heal_5', 'assassinate', 'polymorph', 'mind_control', 'deal_5_draw_1', 'heal_8', 'smite', 'pw_shield', 'holy_fire'];
  return targetedEffects.includes(card.effect);
}

function getSpellTargetType(card) {
  switch (card.effect) {
    case 'deal_3_face':
    case 'deal_6_face':
    case 'deal_5_draw_1':
      return 'enemy';
    case 'deal_10_face':
      return 'any';
    case 'smite':
    case 'holy_fire':
      return 'any';
    case 'heal_5':
    case 'heal_8':
      return 'friendly';
    case 'pw_shield':
      return 'friendly_minion';
    case 'assassinate':
    case 'polymorph':
    case 'mind_control':
      return 'enemy_minion';
    default:
      return 'none';
  }
}

function selectAttacker(minion) {
  G.battle.selectedMinion = minion;
  G.battle.isHeroAttacker = false;
  G.battle.targetingMode = 'target';
  renderBattle();
}

function cancelTargeting(e) {
  if (!G || !G.battle || !G.battle.targetingMode) return;
  if (e.target.closest('.minion') || e.target.closest('.enemy-portrait') ||
      e.target.closest('.card') || e.target.closest('.end-turn-btn') ||
      e.target.closest('.hero-power') || e.target.closest('.player-portrait')) return;
  G.battle.selectedMinion = null;
  G.battle.targetingMode = null;
  G.battle.isHeroAttacker = false;
  G.battle.spellTargeting = null;
  G.battle.battlecryTargeting = null;
  G.battle.heroPowerTargeting = null;
  renderBattle();
}

function selectHeroAttacker() {
  G.battle.selectedMinion = G.player;
  G.battle.isHeroAttacker = true;
  G.battle.targetingMode = 'target';
  renderBattle();
}

function isSpellTargetValid(target) {
  if (!G.battle.spellTargeting) return false;
  const tt = G.battle.spellTargeting.targetType;
  if (target === G.player || target === G.enemy) {
    if (tt === 'enemy') return target === G.enemy;
    if (tt === 'friendly') return target === G.player;
    if (tt === 'any') return true;
    if (tt === 'enemy_minion') return false;
    if (tt === 'friendly_minion') return false;
  } else {
    // It's a minion
    if (target.dead) return false;
    const isPlayerMinion = G.player.minions.includes(target);
    const isEnemyMinion = G.enemy.minions.includes(target);
    if (tt === 'enemy' || tt === 'enemy_minion') return isEnemyMinion;
    if (tt === 'friendly' || tt === 'friendly_minion') return isPlayerMinion;
    if (tt === 'any') return isPlayerMinion || isEnemyMinion;
  }
  return false;
}

function castSpellOnTarget(target) {
  const st = G.battle.spellTargeting;
  if (!st) return;
  if (!isSpellTargetValid(target)) { renderBattle(); return; }

  const card = st.card;
  G.player.mana -= getCardCost(card);
  G.battle.firstCardPlayed = true;
  G.player.hand.splice(st.index, 1);
  if (G.battleStats) { G.battleStats.cardsPlayed++; G.battleStats.spellsCast++; }
  addBattleLog(`你施放 ${card.name}`, 'player');

  executeSpell(card.effect, G.player, G.enemy, card, target);
  cleanupDeadMinions();
  G.player.discardPile.push(card);

  G.battle.spellTargeting = null;
  G.battle.targetingMode = null;
  renderBattle();
  if (G.enemy.hp <= 0) { onBattleWon(); return; }
  if (G.player.hp <= 0) { onBattleLost(); return; }
}

