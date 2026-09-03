/* card-roguelike — advanced mechanics module
   借鉴《影之诗》《游戏王》《炉石传说》的新机制引擎。
   Split from card_roguelike.html inline <script> for maintainability.
   Classic script loaded via <script src>; shares global scope with siblings. */

// ===================== 进化系统（借鉴影之诗） =====================
// 拥有 evolve 字段的随从可以进化：+2/+2 并获得 evolveEffect。
// 每场战斗可用进化次数有限（G.player.evolvePoints / G.enemy.evolvePoints）。
// 进化后随从立即获得攻击力加成，不重置攻击次数（影之诗规则：进化后本回合可攻击）。

function initEvolvePoints() {
  if (G.player) G.player.evolvePoints = 2; // 每场战斗2次进化
  if (G.enemy) G.enemy.evolvePoints = 1;
}

function canEvolve(entity, minion) {
  if (!minion || !minion.evolve) return false;
  if (minion.evolved) return false;
  if (minion.dead) return false;
  if (!entity || !entity.evolvePoints || entity.evolvePoints <= 0) return false;
  // 进化对象必须是本方的随从
  if (entity === G.player && !G.player.minions.includes(minion)) return false;
  if (entity === G.enemy && !G.enemy.minions.includes(minion)) return false;
  return true;
}

// 执行进化
function evolveMinion(entity, minion) {
  if (!canEvolve(entity, minion)) return false;
  entity.evolvePoints--;
  minion.evolved = true;
  minion.currentAttack = (minion.currentAttack || minion.attack || 0) + 2;
  minion.currentHp = (minion.currentHp || minion.maxHp || minion.hp || 0) + 2;
  minion.maxHp = (minion.maxHp || minion.hp || 0) + 2;
  // 进化后本回合可攻击（影之诗规则）
  if (entity === G.player && G.battle.isPlayerTurn) {
    minion.canAttack = true;
    minion.attacksLeft = minion.windfury ? 2 : 1;
  }
  // 触发进化效果
  if (minion.evolveEffect) {
    applyEvolveEffect(minion, entity, entity === G.player ? G.enemy : G.player);
  }
  const side = entity === G.player ? 'player' : 'enemy';
  addBattleLog(`${minion.name} 进化了！(+2/+2)`, side);
  playSfx('evolve');
  return true;
}

// 进化效果（类似战吼，但只有进化时触发）
function applyEvolveEffect(minion, owner, opponent) {
  switch (minion.evolveEffect) {
    case 'deal_2':
      dealDamage(opponent, 2, owner);
      addBattleLog(`${minion.name}进化：对敌方英雄造成2点伤害`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'buff_beasts_1_1':
      owner.minions.filter(m => !m.dead && m.race === 'beast').forEach(m => { m.currentAttack += 1; m.currentHp += 1; m.maxHp += 1; });
      addBattleLog(`${minion.name}进化：所有友方野兽+1/+1`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'draw_1':
      drawCard(owner, true);
      break;
    case 'heal_4':
      owner.hp = Math.min(owner.maxHp, owner.hp + 4);
      floatText(owner === G.player ? 'player-portrait' : 'enemy-portrait', '+4', 'heal');
      addBattleLog(`${minion.name}进化：恢复4点生命`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'deal_2_all':
      opponent.minions.forEach(m => dealDamage(m, 2, owner));
      dealDamage(opponent, 2, owner);
      addBattleLog(`${minion.name}进化：对所有敌人造成2点伤害`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'summon_2_2':
      if (owner.minions.length < 7) {
        owner.minions.push(createMinion({ id: 'evo_2_2_' + uid(), name: '进化之力', art: '✨', attack: 2, hp: 2, cost: 0, type: 'minion' }, owner === G.player));
        addBattleLog(`${minion.name}进化：召唤一个2/2随从`, owner === G.player ? 'player' : 'enemy');
      }
      break;
    case 'gain_armor_3':
      owner.armor += 3;
      addBattleLog(`${minion.name}进化：获得3点护甲`, owner === G.player ? 'player' : 'enemy');
      break;
    case 'freeze_random':
      const targets = opponent.minions.filter(m => !m.dead);
      if (targets.length > 0) {
        const t = targets[Math.floor(Math.random() * targets.length)];
        t.frozen = true; t.canAttack = false;
        addBattleLog(`${minion.name}进化：冻结了一个敌方随从`, owner === G.player ? 'player' : 'enemy');
      }
      break;
    case 'buff_self_1':
      minion.currentAttack += 1; minion.currentHp += 1; minion.maxHp += 1;
      addBattleLog(`${minion.name}进化：自身+1/+1`, owner === G.player ? 'player' : 'enemy');
      break;
    default:
      break;
  }
}

// 渲染时的进化按钮（在 renderMinion 中调用）
function maybeRenderEvolveButton(div, m, isPlayer) {
  if (!m || !m.evolve) return;
  const entity = isPlayer ? G.player : G.enemy;
  if (!canEvolve(entity, m)) return;
  const btn = document.createElement('div');
  btn.className = 'evolve-btn';
  btn.textContent = '⚡进化';
  btn.title = `进化：+2/+2（剩余${entity.evolvePoints}次）`;
  btn.onclick = (e) => {
    e.stopPropagation();
    if (evolveMinion(entity, m)) renderBattle();
  };
  div.appendChild(btn);
}

// ===================== 复生系统（借鉴游戏王墓地 / 炉石复生） =====================
// 拥有 rebirth 字段的随从死亡时以 rebirthHp 生命复活一次（移除复生标记）。
function maybeRebirth(minion, owner) {
  if (!minion || !minion.rebirth || minion.rebirthUsed) return false;
  if (minion.dead !== true) return false;
  minion.rebirthUsed = true;
  minion.currentHp = minion.rebirthHp || 1;
  minion.maxHp = Math.max(minion.maxHp, minion.currentHp);
  minion.currentAttack = minion.currentAttack || minion.attack || 0;
  minion.dead = false;
  minion.frozen = false;
  minion.canAttack = false;
  minion.attacksLeft = 0;
  if (owner) {
    if (owner.minions.length < 7) {
      // 确保它回到场上
      if (!owner.minions.includes(minion)) owner.minions.push(minion);
    }
  }
  const side = owner === G.player ? 'player' : 'enemy';
  addBattleLog(`${minion.name} 复生了！`, side);
  playSfx('rebirth');
  return true;
}

// ===================== 发现系统（借鉴炉石传说 Discover） =====================
// discoverFrom 卡牌打出时，从3张候选中发现1张加入手牌。
function triggerDiscover(card, player) {
  const discoverPoolId = card.discoverFrom || 'class';
  const pool = getDiscoverPool(discoverPoolId, player);
  if (pool.length === 0) return;
  const candidates = [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  for (let i = 0; i < 3 && i < shuffled.length; i++) {
    candidates.push({ ...shuffled[i], uid: uid() });
  }
  showDiscoverModal(candidates, (chosen) => {
    if (player.hand.length < GAME_CONFIG.battle.maxHandSize) {
      player.hand.push(chosen);
      addBattleLog(`${player === G.player ? '你' : '敌方'}通过发现获得了 ${chosen.name}`, player === G.player ? 'player' : 'enemy');
    }
    renderBattle();
  });
}

// 构建发现候选池
function getDiscoverPool(poolId, player) {
  const cls = CLASSES[player.selectedClass || G.selectedClass || 'mage'];
  if (poolId === 'class') {
    return cls ? cls.cardPool.map(id => CARD_MAP[id]).filter(c => c) : CARD_POOL;
  }
  if (poolId === 'neutral') {
    return NEUTRAL_POOL.map(id => CARD_MAP[id]).filter(c => c);
  }
  if (poolId === 'spells') {
    return CARD_POOL.filter(c => c.type === 'spell');
  }
  if (poolId === 'minions') {
    return CARD_POOL.filter(c => c.type === 'minion');
  }
  return CARD_POOL;
}

// 发现弹窗
function showDiscoverModal(candidates, onChoose) {
  const overlay = document.getElementById('card-detail-overlay');
  const inner = document.getElementById('card-detail-inner');
  if (!overlay || !inner) return;
  let html = '<div style="text-align:center;">';
  html += '<div style="font-size:18px;font-weight:bold;color:#ffd700;margin-bottom:12px;">🔍 发现一张卡牌</div>';
  html += '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;max-width:520px;margin:0 auto;">';
  candidates.forEach((c, i) => {
    html += `<div onclick="onDiscoverChoose(${i})" style="flex:1;min-width:120px;max-width:150px;cursor:pointer;background:rgba(0,0,0,0.4);border:2px solid #555;border-radius:10px;padding:10px;transition:all 0.2s;text-align:center;" onmouseover="this.style.borderColor='#ffd700';this.style.transform='translateY(-4px)'" onmouseout="this.style.borderColor='#555';this.style.transform='none'">`;
    html += `<div style="font-size:36px;margin-bottom:6px;">${c.art || '🃏'}</div>`;
    html += `<div style="font-size:13px;color:#fff;font-weight:bold;">${c.name}</div>`;
    html += `<div style="font-size:10px;color:#ffd700;margin:3px 0;">${c.cost}费 · ${c.rarity}</div>`;
    html += `<div style="font-size:10px;color:#aaa;line-height:1.4;">${c.text || ''}</div>`;
    if (c.type === 'minion') html += `<div style="font-size:12px;color:#e67e22;margin-top:4px;">${c.attack}/${c.hp}</div>`;
    if (c.type === 'weapon') html += `<div style="font-size:12px;color:#e67e22;margin-top:4px;">${c.attack}/${c.durability}</div>`;
    html += '</div>';
  });
  html += '</div></div>';
  inner.innerHTML = html;
  window.__discoverChoices = candidates;
  window.__discoverCallback = onChoose;
  window.onDiscoverChoose = function(idx) {
    const choices = window.__discoverChoices || [];
    const cb = window.__discoverCallback;
    if (!choices[idx] || !cb) return;
    const chosen = choices[idx];
    overlay.classList.remove('active');
    window.__discoverChoices = null;
    window.__discoverCallback = null;
    cb(chosen);
  };
  overlay.classList.add('active');
}

// ===================== 回响系统（借鉴炉石传说 Echo） =====================
// 拥有 echo 字段的卡牌打出后返回一张副本到手中（本回合可再次打出）。
// 在 playCard 结算后处理：若 card.echo 且未产生 echoCopy，则加入手牌。
function maybeCreateEchoCopy(card) {
  if (!card || !card.echo) return;
  if (card.__echoCopy) return; // 防止无限循环
  const copy = { ...card, uid: uid(), __echoCopy: true };
  if (G.player.hand.length < GAME_CONFIG.battle.maxHandSize) {
    G.player.hand.push(copy);
    addBattleLog(`【回响】${card.name} 回到你的手牌`, 'player');
  }
}

// ===================== 连锁系统（借鉴游戏王 Chain） =====================
// 拥有 chain 字段的卡牌：同回合内每打出1张卡牌，第N次打出时触发 chain（第2次：chain=2）。
// 简化实现：chain 记录"本回合已打出的卡牌数"，当累计达到指定值时触发。
function getChainCount() {
  return G.battle.chainCount || 0;
}

function incrementChain() {
  G.battle.chainCount = (G.battle.chainCount || 0) + 1;
}

function resetChain() {
  G.battle.chainCount = 0;
}

// 检查并触发连锁效果（在打出卡牌后调用）
function checkChainTrigger(card, player, opponent) {
  const need = card.chain;
  if (!need) return;
  if (getChainCount() < need) return;
  // 触发连锁
  addBattleLog(`${card.name} 连锁发动！(第${need}张)`, player === G.player ? 'player' : 'enemy');
  switch (card.chainEffect) {
    case 'draw_1':
      drawCard(player, true);
      break;
    case 'deal_3':
      dealDamage(opponent, 3, player);
      break;
    case 'buff_all_1_1':
      player.minions.forEach(m => { if (!m.dead) { m.currentAttack += 1; m.currentHp += 1; m.maxHp += 1; } });
      break;
    case 'gain_armor_2':
      player.armor += 2;
      break;
    case 'deal_2_all':
      opponent.minions.forEach(m => dealDamage(m, 2, player));
      dealDamage(opponent, 2, player);
      break;
    default:
      break;
  }
}

// ===================== 魔力增幅（借鉴影之诗 Spellboost） =====================
// 拥有 spellboost 字段的卡牌：每使用1张法术，本场战斗中该牌费用-1（有次数上限）。
// 简化：用 spellboostCount 记录已触发增幅次数，费用显示为 cost - min(spellboostCount, spellboost)。
function applySpellboost() {
  if (!G.battle) return;
  G.battle.spellboostCount = (G.battle.spellboostCount || 0) + 1;
  // 检查手牌中所有带 spellboost 的卡，实时降费
  G.player.hand.forEach(card => {
    if (card && card.spellboost) {
      const boostUsed = Math.min(G.battle.spellboostCount, card.spellboost);
      card.__boostDiscount = boostUsed;
    }
  });
}

// 计算魔力增幅后的实际费用
function getSpellboostedCost(card) {
  let cost = card.cost || 0;
  if (card.spellboost && card.__boostDiscount) {
    cost = Math.max(0, cost - card.__boostDiscount);
  }
  return cost;
}


// ===================== 状态系统（第15轮：统一 Buff/Debuff 组件） =====================
// 借鉴《杀戮尖塔》标准状态体系：中毒/易伤/虚弱/力量/敏捷。
// 状态挂在实体（玩家/敌人/随从）的 states 对象上：{ type: { stacks, turns } }。
const STATUS_INFO = {
  poison:    { icon: '☠️', name: '中毒', desc: '回合开始受到层数点伤害，随后层数-1' },
  vulnerable: { icon: '💔', name: '易伤', desc: '受到的所有伤害 +50%' },
  weak:      { icon: '🥀', name: '虚弱', desc: '造成的所有伤害 -50%' },
  strength:  { icon: '💪', name: '力量', desc: '本方随从攻击力 +层数' },
  agility:   { icon: '🛡️', name: '敏捷', desc: '每回合开始获得等量护甲' },
};

function applyStatus(target, type, value, turns) {
  if (!target || !STATUS_INFO[type] || value <= 0) return;
  // 第21轮：剧毒之心——对敌人施毒时层数+2
  if (type === 'poison' && target === (typeof G !== 'undefined' ? G.enemy : null) && typeof hasRelic === 'function' && hasRelic('poison_heart')) {
    value += 2;
  }
  target.states = target.states || {};
  const s = target.states[type] || { stacks: 0, turns: 0 };
  // 第16轮：层数上限钳位，防止无限叠加崩坏（MAX_STATUS_STACK=20）
  s.stacks = clampStatusStack((s.stacks || 0) + value);
  if (turns !== undefined) s.turns = Math.max(s.turns, turns);
  target.states[type] = s;
}

function hasStatus(target, type) {
  return !!(target && target.states && target.states[type] && target.states[type].stacks > 0);
}

function removeStatus(target, type) {
  if (target && target.states) delete target.states[type];
}

// 回合开始结算状态（中毒扣血、持续回合递减）
function tickStatuses(target) {
  if (!target || !target.states || (G.battle && G.battle.ended)) return;
  for (const type in target.states) {
    const s = target.states[type];
    if (!s || s.stacks <= 0) { delete target.states[type]; continue; }
    if (type === 'poison') {
      dealDamage(target, s.stacks, null);
      s.stacks--;
      if (s.stacks <= 0) { delete target.states[type]; continue; }
    }
    // 中毒靠层数自然衰减，不递减回合；力量/敏捷为永久状态
    if (type !== 'poison' && type !== 'strength' && type !== 'agility') {
      s.turns--;
      if (s.turns <= 0) { delete target.states[type]; continue; }
    }
  }
}

// 获取实体状态图标（UI 展示）
function getStatusIcons(target) {
  if (!target || !target.states) return '';
  return Object.entries(target.states)
    .filter(([t, s]) => s && s.stacks > 0 && STATUS_INFO[t])
    .map(([t, s]) => {
      const info = STATUS_INFO[t];
      return `<span class="status-icon" title="${info.name}（${s.stacks}）：${info.desc}">${info.icon}${s.stacks}</span>`;
    })
    .join('');
}

// ===================== 极简事件总线（第15轮：统一触发钩子） =====================
const eventBus = {
  events: {},
  on(name, cb) { if (!this.events[name]) this.events[name] = []; this.events[name].push(cb); },
  off(name, cb) { if (this.events[name]) this.events[name] = this.events[name].filter(x => x !== cb); },
  emit(name, data) { (this.events[name] || []).forEach(cb => { try { cb(data); } catch (e) { console.error('[eventBus]', name, e); } }); },
  clear(name) { if (name) delete this.events[name]; else this.events = {}; },
};

// 回合开始事件：玩家/敌方状态结算（挂载到事件总线，供遗物/卡牌扩展监听）
eventBus.on('turnStart', (unit) => { if (typeof tickStatuses === 'function') tickStatuses(unit); });
