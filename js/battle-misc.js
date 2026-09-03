/* card-roguelike — battle-misc module
   Split from card_roguelike.html inline <script> for maintainability.
   Classic script loaded via <script src>; shares global scope with siblings. */

// ===================== BATTLE LOG =====================
let logOpen = true;

function addBattleLog(msg, type) {
  if (!G.battle || !G.battle.log) return;
  G.battle.log.push({ msg, type: type || 'system' });
  if (G.battle.log.length > GAME_CONFIG.battle.battleLogLimit) G.battle.log.shift();
  renderBattleLog();
}

function toggleBattleLog() {
  logOpen = !logOpen;
  const log = document.getElementById('battle-log');
  const text = document.getElementById('log-toggle-text');
  if (logOpen) {
    log.classList.remove('closed');
    text.textContent = '📜 收起日志';
    log.scrollTop = log.scrollHeight;
  } else {
    log.classList.add('closed');
    text.textContent = '📜 战斗日志';
  }
}

function renderBattleLog() {
  const el = document.getElementById('battle-log');
  if (!el || !G.battle || !G.battle.log) return;
  const frag = document.createDocumentFragment();
  G.battle.log.slice(-25).forEach(entry => {
    const div = document.createElement('div');
    div.className = 'battle-log-entry log-' + (entry.type || 'system');
    div.textContent = entry.msg;
    frag.appendChild(div);
  });
  el.replaceChildren(frag);
  if (logOpen) el.scrollTop = el.scrollHeight;
}

function floatText(elementId, text, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const float = document.createElement('div');
  float.className = `float-text float-${type}`;
  float.textContent = text;
  float.style.left = '50%';
  float.style.top = '0';
  float.style.transform = 'translateX(-50%)';
  el.style.position = 'relative';
  el.appendChild(float);
  setTimeout(() => float.remove(), 1000);
}

// ===================== CARD DETAIL VIEW =====================
function getSpellEffectInfo(effect, sp) {
  const spNote = sp > 0 ? ` <span style="color:#ffd700;">(+${sp} 法术强度)</span>` : '';
  const entries = {
    'deal_1': `造成 1 点伤害${spNote}`,
    'deal_1_face': `对敌方英雄造成 1 点伤害${spNote}`,
    'heal_3': `恢复 3 点生命`,
    'arcane_missiles': `随机发射 3 颗飞弹，每颗造成 1 点伤害${spNote}`,
    'heal_5': `恢复 5 点生命`,
    'deal_3_face': `对敌方英雄造成 3 点伤害${spNote}`,
    'deal_6_face': `对敌方英雄造成 6 点伤害${spNote}`,
    'deal_10_face': `对敌方英雄造成 10 点伤害${spNote}`,
    'fan_of_knives': `对所有敌方随从造成 1 点伤害${spNote}，抽一张牌`,
    'consecration': `对所有敌人造成 2 点伤害${spNote}`,
    'flamestrike': `对所有敌方随从造成 4 点伤害${spNote}`,
    'lightning_storm': `对所有敌方随从造成 2 点伤害${spNote}`,
    'blizzard': `对所有敌方随从造成 2 点伤害${spNote}并使其冻结`,
    'polymorph': `将一个随从变形为 1/1 的绵羊`,
    'assassinate': `消灭一个敌方随从`,
    'mind_control': `获得一个敌方随从的控制权`,
    'equality': `将所有随从的生命值变为 1`,
    'mass_heal': `恢复所有友方随从 2 点生命，英雄恢复 4 点`,
    'gain_mana_1': `获得 1 个法力水晶（本回合）`,
    'deal_5_draw_1': `造成 5 点伤害${spNote}，抽一张牌`,
    'summon_two_3_3': `召唤两个 3/3 的随从`,
    'heal_8': `恢复 8 点生命`,
    'draw_2': `抽两张牌`,
    'deal_face_1': `对敌方英雄造成 1 点伤害${spNote}`,
    'summon_2_2': `召唤一个 2/2 的随从`,
    'summon_4_4': `召唤一个 4/4 的随从`,
    'summon_0_2_taunt': `召唤一个 0/2 且有嘲讽的随从`,
    'mind_control_random': `随机获得一个敌方随从的控制权`,
    'draw_1': `抽一张牌`,
    'freeze_enemy': `冻结一个敌方随从`,
    'dragon_buff': `若手牌中有龙牌则获得 +1/+1`,
    'deathwing': `消灭所有其他随从，弃掉所有手牌`,
    'faceless_copy': `变为一个友方随从的复制`,
    'draw_1_owner': `为拥有者抽一张牌`,
    'buff_friendly_2_2': `使一个友方随从获得 +2/+2`,
  };
  return entries[effect] || '';
}

function showCardDetail(card) {
  const inner = document.getElementById('card-detail-inner');
  if (!inner) return;
  const typeNames = { minion: '随从', spell: '法术', weapon: '武器' };
  const rarityNames = { common: '普通', rare: '稀有', epic: '史诗', legendary: '传说' };
  let html = '<div style="text-align:center;">';
  html += `<div style="font-size:32px;margin-bottom:6px;">${card.art || '🃏'}</div>`;
  html += `<div style="font-size:16px;font-weight:bold;color:var(--gold);">${card.name || '未知卡牌'}${card.upgraded ? ' ✨' : ''}</div>`;
  html += `<div style="font-size:12px;color:#888;margin-top:4px;">${typeNames[card.type] || '未知'}${card.rarity ? ' · ' + (rarityNames[card.rarity] || card.rarity) : ''}</div>`;
  html += `<div style="font-size:14px;color:#aaa;margin-top:8px;">费用: ${card.cost || 0}</div>`;
  if (card.type === 'minion') {
    html += `<div style="font-size:14px;color:#aaa;">攻击: ${card.attack} | 生命: ${card.hp}</div>`;
  } else if (card.type === 'weapon') {
    html += `<div style="font-size:14px;color:#aaa;">攻击: ${card.attack} | 耐久: ${card.durability}</div>`;
  }
  if (card.text) {
    html += `<div style="font-size:13px;color:#ccc;margin-top:8px;padding:6px 10px;background:rgba(0,0,0,0.3);border-radius:6px;line-height:1.5;">${card.text}</div>`;
  }
  if (card.type === 'spell' && card.effect) {
    const sp = getSpellPower(G.player);
    const spellInfo = getSpellEffectInfo(card.effect, sp);
    if (spellInfo) {
      html += `<div style="font-size:12px;color:#7ec8e3;margin-top:6px;padding:4px 10px;background:rgba(0,0,0,0.2);border-radius:6px;line-height:1.6;">${spellInfo}</div>`;
    }
  }
  if (card.race) {
    html += `<div style="font-size:12px;color:#888;margin-top:6px;">种族: ${card.race}</div>`;
  }
  if (card.battlecry) {
    const bcInfo = getSpellEffectInfo(card.battlecry, 0);
    html += `<div style="font-size:12px;color:#7ec8e3;margin-top:4px;">⚡ 战吼${bcInfo ? ': ' + bcInfo : ''}</div>`;
  }
  if (card.deathrattle) {
    const drInfo = getSpellEffectInfo(card.deathrattle, 0);
    html += `<div style="font-size:12px;color:#7ec8e3;margin-top:4px;">💀 亡语${drInfo ? ': ' + drInfo : ''}</div>`;
  }
  if (card.taunt) html += '<div style="font-size:12px;color:#ffd700;margin-top:4px;">🛡 嘲讽 — 敌方必须先攻击此随从</div>';
  if (card.divineShield) html += '<div style="font-size:12px;color:#ffd700;margin-top:4px;">✨ 圣盾 — 免疫下一次伤害</div>';
  if (card.charge) html += '<div style="font-size:12px;color:#ffd700;margin-top:4px;">⚡ 冲锋 — 召唤回合即可攻击</div>';
  if (card.windfury) html += '<div style="font-size:12px;color:#ffd700;margin-top:4px;">🌀 风怒 — 每回合可攻击两次</div>';
  if (card.lifesteal) html += '<div style="font-size:12px;color:#ff6464;margin-top:4px;">🩸 吸血 — 造成伤害时恢复英雄生命</div>';
  if (card.poisonous) html += '<div style="font-size:12px;color:#66ff66;margin-top:4px;">☠ 剧毒 — 消灭任何受伤随从</div>';
  if (card.freezeOnHit) html += '<div style="font-size:12px;color:#7ec8e3;margin-top:4px;">❄ 冰冻攻击 — 命中后冻结目标</div>';
  if (card.overload) html += '<div style="font-size:12px;color:#9b59b6;margin-top:4px;">⚡ 过载' + card.overload + ' — 下回合开始时法力-' + card.overload + '</div>';
  if (card.evolve) html += `<div style="font-size:12px;color:#40e0d0;margin-top:4px;">⚡ 进化 — 进化时+2/+2${card.evolveEffect ? '并获得进化效果' : ''}（每场战斗${2}次）</div>`;
  if (card.rebirth) html += `<div style="font-size:12px;color:#e040c0;margin-top:4px;">💫 复生 — 死亡时以${card.rebirthHp || 1}点生命复活一次</div>`;
  if (card.discoverFrom) html += '<div style="font-size:12px;color:#ffd700;margin-top:4px;">🔍 发现 — 从3张候选中选择1张加入手牌</div>';
  if (card.echo) html += '<div style="font-size:12px;color:#7ec8e3;margin-top:4px;">🔁 回响 — 打出后返回手牌，本回合可再次打出</div>';
  if (card.chain) html += `<div style="font-size:12px;color:#ff8c42;margin-top:4px;">⛓️ 连锁 — 本回合第${card.chain}张打出时触发额外效果</div>`;
  if (card.spellboost) html += `<div style="font-size:12px;color:#a78bfa;margin-top:4px;">📈 魔力增幅 — 每使用一张法术，费用-1（最多减${card.spellboost}）</div>`;
  if (card.frozen) html += '<div style="font-size:12px;color:#7ec8e3;margin-top:4px;">❄ 已冻结 — 无法攻击，下回合解冻</div>';
  if (card.currentAttack !== undefined && card.currentHp !== undefined && (card.currentAttack !== card.attack || card.currentHp !== card.maxHp)) {
    html += `<div style="font-size:12px;color:#aaa;margin-top:6px;padding:4px 10px;background:rgba(0,0,0,0.2);border-radius:6px;">当前: ${card.currentAttack}/${card.currentHp}${card.currentAttack !== card.attack ? ' (攻+' + (card.currentAttack - card.attack) + ')' : ''}${card.currentHp < card.maxHp ? ' (损血' + (card.maxHp - card.currentHp) + ')' : card.currentHp > card.maxHp ? ' (增益+' + (card.currentHp - card.maxHp) + ')' : ''}</div>`;
  }
  html += '</div>';
  inner.innerHTML = html;
  document.getElementById('card-detail-overlay').classList.add('active');
}

function closeCardDetail(event) {
  if (event && event.target.id !== 'card-detail-overlay') return;
  document.getElementById('card-detail-overlay').classList.remove('active');
  // 清理发现回调（若发现弹窗未选择就关闭）
  if (window.__discoverChoices) { window.__discoverChoices = null; window.__discoverCallback = null; }
}

// ===================== BATTLE END =====================
function onBattleWon() {
  if (G.battle.ended) return;
  G.battle.ended = true;
  if (G.battle.safetyTimer) { clearTimeout(G.battle.safetyTimer); G.battle.safetyTimer = null; }
  if (G.battle.attackSafetyTimer) { clearTimeout(G.battle.attackSafetyTimer); G.battle.attackSafetyTimer = null; }
  setEndTurnButtonState('enemy');
  addBattleLog('战斗胜利！敌人已被击败', 'system');

  // 第9轮：独立教学演示——不结算奖励/金币/进度，直接返回
  if (G.tutorialDemo) {
    setTimeout(() => {
      addBattleLog('教学练习完成！正在返回主菜单...', 'system');
      endTutorialDemo();
    }, 900);
    return;
  }

  const type = G.battle.enemyType;
  let goldReward;
  if (type === 'boss') goldReward = 50;
  else if (type === 'elite') goldReward = 25;
  else goldReward = 15;
  // 第18轮：精英战斗额外 +1 卡牌选择（4选1），体现高风险高回报
  if (type === 'elite' && G.battle) G.battle.bossBonusChoices = (G.battle.bossBonusChoices || 0) + 1;

  if (hasRelic('double_gold')) goldReward *= 2;
  if (hasRelic('gold_each_battle')) goldReward += 3;
  // Apply difficulty gold multiplier
  if (G.difficulty) {
    const d = DIFFICULTY_SETTINGS[G.difficulty];
    if (d) goldReward = Math.floor(goldReward * d.goldMult);
  }
  G.gold += goldReward;
  addBattleLog(`获得${goldReward}金币`, 'system');
  playMusic('menu');

  // 第9轮：战意恢复（局外强化 heal_per_battle：每级战后恢复2点生命）
  if (typeof metaLevel === 'function' && metaLevel('heal_per_battle') > 0 && !G.tutorial) {
    const healAmt = 2 * metaLevel('heal_per_battle');
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + healAmt);
    addBattleLog(`战意恢复：恢复了${healAmt}点生命`, 'player');
  }

  // Tutorial progression: complete both tutorial battles -> mark done
  if (type === 'tutorial_1' || type === 'tutorial_2') {
    const step = type === 'tutorial_1' ? 1 : 2;
    try {
      const prog = JSON.parse(localStorage.getItem('tutorialProg') || '{}');
      prog['step' + step] = true;
      localStorage.setItem('tutorialProg', JSON.stringify(prog));
      if (step === 2) {
        localStorage.setItem('tutorialBattleDone', '1');
        if (G.tutorial) G.tutorial = false;
        setTimeout(() => { if (!G.battle || !G.battle.ended) return; addBattleLog('教学完成！接下来的战斗将使用你的完整卡组', 'system'); }, 300);
      }
    } catch (e) {}
  }

  // Boss: always get a passive treasure + reward choice

  if (type === 'boss') {
    G.battle.bossBonusChoices = (typeof metaLevel === 'function') ? metaLevel('boss_reward') : 0;
    if (hasRelic('boss_gold')) { G.gold += 30; addBattleLog('首领之印：额外获得30金币', 'player'); }
    // 第12轮：贪婪之心——每场战斗胜利额外获得20金币
    if (hasRelic('extra_gold')) { G.gold += 20; addBattleLog('贪婪之心：额外获得20金币', 'player'); }
    setTimeout(() => {
      grantRelic(G, 'boss');
      showRewardTypeSelection(`击败 ${G.enemy.name}！`);
    }, 800);
  } else {
    setTimeout(() => showRewardTypeSelection('战斗胜利！选择你的奖励'), 800);
  }
}

function showRewardTypeSelection(title) {
  const rewardTitle = document.getElementById('reward-title');
  if (rewardTitle) rewardTitle.textContent = title;
  const container = document.getElementById('reward-cards');
  if (!container) return;

  // Three reward type cards
  const types = [
    { type: 'card_pack', icon: '📦', title: '卡牌包', desc: '从3张卡牌中选1张加入牌组' },
    { type: 'active_treasure', icon: '💎', title: '主动宝藏', desc: '获得1张超模宝藏牌加入牌组' },
    { type: 'passive_treasure', icon: '🔮', title: '被动宝藏', desc: '获得1个全局常驻被动效果' },
  ];

  const typeFrag = document.createDocumentFragment();
  types.forEach(t => {
    const card = document.createElement('div');
    card.className = 'reward-type-card';
    card.innerHTML = `
      <div class="reward-type-icon">${t.icon}</div>
      <div class="reward-type-title">${t.title}</div>
      <div class="reward-type-desc">${t.desc}</div>
    `;
    card.onclick = () => {
      if (t.type === 'card_pack') showCardPackReward();
      else if (t.type === 'active_treasure') showActiveTreasureReward();
      else if (t.type === 'passive_treasure') showPassiveTreasureReward();
    };
    typeFrag.appendChild(card);
  });
  container.replaceChildren(typeFrag);

  // Skip button
  const skipBtn = document.querySelector('#overlay-reward .overlay-btn');
  if (skipBtn) {
    skipBtn.onclick = () => { skipReward(); };
  }
  showOverlay('overlay-reward');
}

function getClassCardPool() {
  const cls = CLASSES[G.selectedClass || 'mage'];
  if (!cls) return CARD_POOL;
  return cls.cardPool.map(id => CARD_MAP[id]).filter(c => c);
}

// Neutral cards that can appear in every class's card packs (new keyword cards stay obtainable)
const NEUTRAL_POOL = ['vampire_bat','vampire_lord','poison_snake','plague_toad','death_stalker','overload_lightning','overload_missiles','overload_wolf','neutral_kobold','neutral_guard','neutral_rogue_knife','neutral_spell_2','neutral_minion_3','neutral_minion_4','neutral_minion_5','neutral_spell_6','neutral_minion_7','neutral_spell_8','neutral_minion_9','neutral_minion_10','neutral_spell_11','neutral_minion_12','neutral_minion_13'];

// 第16轮：按稀有度权重抽取奖励卡（common 权重高，稀有度越高权重越低；rareBonus 提升稀有概率）
function pickRewardCard(filtered, rareBonus, act) {
  const weights = filtered.map(c => {
    let _rar = c.rarity || 'common';
    let w = _rar === 'common' ? NumericConfig.WEIGHT_NORMAL
          : _rar === 'rare' ? NumericConfig.WEIGHT_RARE
          : NumericConfig.WEIGHT_EPIC;
    // 稀有度越高，权重越低；epic/legendary 共用 epic 权重并再降一半
    if (c.rarity === 'epic' || c.rarity === 'legendary') w = NumericConfig.WEIGHT_EPIC;
    if (c.rarity === 'legendary') w = w * 0.5;
    // rareBonus（幸运之触+稀有开卡）：每级提升 30% 稀有卡权重（不提升 common）
    if (rareBonus > 0 && c.rarity !== 'common') w = w * (1 + rareBonus * 0.3);
    return w;
  });
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let r = Math.random() * total;
  for (let i = 0; i < filtered.length; i++) {
    r -= weights[i];
    if (r <= 0) return filtered[i];
  }
  return filtered[filtered.length - 1];
}

// 按稀有度权重返回数组内索引（供发现/三选一复用）
function pickRewardIndex(arr, rareBonus) {
  if (arr.length <= 1) return 0;
  const weights = arr.map(c => {
    let _rar = c.rarity || 'common';
    let w = (_rar === 'common') ? NumericConfig.WEIGHT_NORMAL
          : (_rar === 'rare') ? NumericConfig.WEIGHT_RARE
          : NumericConfig.WEIGHT_EPIC;
    if (c.rarity === 'legendary') w = w * 0.5;
    if (rareBonus > 0 && c.rarity && c.rarity !== 'common') w = w * (1 + rareBonus * 0.3);
    return w;
  });
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return arr.length - 1;
}

function showCardPackReward() {
  const cls = CLASSES[G.selectedClass || 'mage'];
  const classPool = cls ? cls.cardPool.map(id => CARD_MAP[id]).filter(c => c) : CARD_POOL;
  const pool = classPool.concat(NEUTRAL_POOL.map(id => CARD_MAP[id]).filter(c => c));
  const filtered = pool.filter(c => {
    if (G.act === 0) return c.rarity === 'common' || c.rarity === 'rare';
    if (G.act === 1) return c.rarity !== 'legendary';
    return true;
  });
  const cards = [];
  const bonus = (G.battle && G.battle.bossBonusChoices) || 0;
  // 第16轮：稀有度权重抽取（幸运之触 rare_luck + 稀有开卡 start_rare 加成）
  const metaUp = getMetaProgress().upgrades || {};
  let rareBonus = ((metaUp.start_rare || 0) + (metaUp.rare_luck || 0));
  // 第18轮：精英/Boss 战奖励稀有度进一步提升
  if (G.battle && (G.battle.enemyType === 'elite' || G.battle.enemyType === 'boss')) rareBonus += 4;
  for (let i = 0; i < 3 + bonus; i++) {
    const card = pickRewardCard(filtered, rareBonus, G.act);
    cards.push({ ...card, uid: uid() });
  }
  renderRewardCards(cards, '选择一张卡牌加入牌组');
}

function showActiveTreasureReward() {
  const treasures = [];
  const available = ACTIVE_TREASURES.filter(t => !G.player.deck.some(c => c.id === t.id));
  for (let i = 0; i < Math.min(2, available.length); i++) {
    const idx = Math.floor(Math.random() * available.length);
    treasures.push({ ...available[idx], uid: uid() });
    available.splice(idx, 1);
  }
  if (treasures.length === 0) { showCardPackReward(); return; }
  renderRewardCards(treasures, '选择一张宝藏牌加入牌组');
}

function showPassiveTreasureReward() {
  const available = PASSIVE_TREASURES.filter(t => !G.relics.some(r => r.id === t.id));
  const treasures = [];
  for (let i = 0; i < Math.min(2, available.length); i++) {
    const idx = Math.floor(Math.random() * available.length);
    treasures.push({ ...available[idx] });
    available.splice(idx, 1);
  }
  if (treasures.length === 0) { showCardPackReward(); return; }
  const container = document.getElementById('reward-cards');
  if (!container) return;
  const rewardTitle = document.getElementById('reward-title');
  if (rewardTitle) rewardTitle.textContent = '选择一个被动宝藏';
  const treasureFrag = document.createDocumentFragment();
  treasures.forEach(treasure => {
    const wrapper = document.createElement('div');
    wrapper.className = 'reward-type-card';
    wrapper.style.width = '220px';
    wrapper.innerHTML = `
      <div class="reward-type-icon">${treasure.icon}</div>
      <div class="reward-type-title">${treasure.name}</div>
      <div class="reward-type-desc">${treasure.description}</div>
    `;
    wrapper.onclick = () => {
      G.relics.push({ ...treasure });
      addBattleLog(`获得了被动宝藏：${treasure.name}`, 'system');
      hideOverlay('overlay-reward');
      completeNode();
    };
    treasureFrag.appendChild(wrapper);
  });
  container.replaceChildren(treasureFrag);
}

// Discover: offer 1 of 3 random cards from a pool; onPick(card) is called with the chosen card (or null if skipped)
function offerDiscover(pool, title, onPick) {
  const rewardTitle = document.getElementById('reward-title');
  if (rewardTitle) rewardTitle.textContent = title || '发现一张卡牌';
  const container = document.getElementById('reward-cards');
  if (!container) return;
  const offers = [];
  const temp = [...pool];
  // 第17轮：发现牌也按稀有度权重抽取（幸运之触+稀有开卡加成）
  const metaUp = (typeof getMetaProgress === 'function' && getMetaProgress().upgrades) || {};
  const rareBonus = ((metaUp.start_rare || 0) + (metaUp.rare_luck || 0));
  for (let i = 0; i < 3 && temp.length > 0; i++) {
    const idx = pickRewardIndex(temp, rareBonus);
    offers.push(temp.splice(idx, 1)[0]);
  }
  const frag = document.createDocumentFragment();
  offers.forEach(card => {
    const wrapper = document.createElement('div');
    wrapper.className = 'reward-card-wrapper';
    wrapper.appendChild(renderCardStatic(card));
    const btn = document.createElement('div');
    btn.style.textAlign = 'center';
    btn.style.marginTop = '8px';
    btn.style.color = 'var(--gold)';
    btn.style.fontSize = '13px';
    btn.textContent = '选择';
    wrapper.appendChild(btn);
    wrapper.onclick = () => {
      hideOverlay('overlay-reward');
      onPick(card);
    };
    frag.appendChild(wrapper);
  });
  container.replaceChildren(frag);
  const skipBtn = document.querySelector('#overlay-reward .overlay-btn');
  if (skipBtn) {
    skipBtn.onclick = () => { hideOverlay('overlay-reward'); onPick(null); };
  }
  showOverlay('overlay-reward');
}

function renderRewardCards(cards, title) {
  const rewardTitle = document.getElementById('reward-title');
  if (rewardTitle) rewardTitle.textContent = title;
  const container = document.getElementById('reward-cards');
  if (!container) return;
  const frag = document.createDocumentFragment();
  cards.forEach(card => {
    const wrapper = document.createElement('div');
    wrapper.className = 'reward-card-wrapper';
    wrapper.appendChild(renderCardStatic(card));
    const btn = document.createElement('div');
    btn.style.textAlign = 'center';
    btn.style.marginTop = '8px';
    btn.style.color = 'var(--gold)';
    btn.style.fontSize = '13px';
    btn.textContent = '选择';
    wrapper.appendChild(btn);
    wrapper.onclick = () => {
      G.player.deck.push(card);
      addBattleLog(`获得了 ${card.name}`, 'system');
      hideOverlay('overlay-reward');
      completeNode();
    };
    frag.appendChild(wrapper);
  });
  container.replaceChildren(frag);
  showOverlay('overlay-reward');
}


// ===================== ENEMY DETAIL =====================
function showEnemyDetail() {
  const e = G.enemy;
  if (!e) return;
  const aiNames = { aggressive: '⚔️ 激进', control: '🛡️ 控制', spell: '🔮 法术', boss: '💀 首领' };
  const personalityNames = {
    vampiric: '🩸 吸血', frenzy: '🔥 狂怒', guardian: '🛡️ 守护',
    commander: '⚔️ 指挥官', swarm: '🐝 群聚', reflect: '🪞 反伤'
  };
  // Build enemy deck summary
  const deckInfo = e.deck ? e.deck.length + ' 张牌' : '未知';
  const minionCount = e.minions ? e.minions.filter(m => !m.dead).length : 0;
  let html = '<div style="text-align:center;">';
  html += `<div style="font-size:48px;margin-bottom:8px;">${e.portrait || '👹'}</div>`;
  html += `<div style="font-size:18px;font-weight:bold;color:#ffd700;margin-bottom:4px;">${e.name}</div>`;
  html += `<div style="font-size:12px;color:#aaa;margin-bottom:12px;">${e.isBoss ? '💀 首领' : e.ai === 'elite' ? '🔥 精英' : '👾 普通敌人'}</div>`;
  html += '<div style="text-align:left;background:rgba(0,0,0,0.3);border-radius:8px;padding:10px 14px;font-size:13px;line-height:1.9;color:#ddd;">';
  html += `<div>❤️ 生命值：<b>${e.hp}/${e.maxHp}</b></div>`;
  html += `<div>🛡️ 护甲：<b>${e.armor || 0}</b></div>`;
  html += `<div>🧠 AI策略：<b>${aiNames[e.ai] || '未知'}</b></div>`;
  if (e.personality) html += `<div>✨ 特性：<b style="color:#ffd700;">${personalityNames[e.personality] || e.personality}</b></div>`;
  html += `<div>🃏 牌库：<b>${deckInfo}</b>（已抽${e.drawPile ? e.drawPile.length : 0}张/手牌${e.hand ? e.hand.length : 0}张）</div>`;
  html += `<div>🛡️ 场上随从：<b>${minionCount}个</b></div>`;
  if (e.weapon) html += `<div>🗡️ 武器：<b>${e.weapon.name}</b>（攻击${e.weapon.attack}/耐久${e.weapon.currentDurability}）</div>`;
  html += `</div>`;
  html += `<div style="font-size:11px;color:#666;margin-top:10px;">再次点击可关闭</div>`;
  html += '</div>';
  const inner = document.getElementById('card-detail-inner');
  if (!inner) return;
  inner.innerHTML = html;
  const overlay = document.getElementById('card-detail-overlay');
  overlay.classList.add('active');
}

// 关闭详情弹窗
function closeCardDetail() {
  const overlay = document.getElementById('card-detail-overlay');
  if (overlay) overlay.classList.remove('active');
}

// ===================== SURRENDER & FAST FORWARD =====================
function surrenderBattle() {
  showOverlay('overlay-surrender');
}

function confirmSurrender() {
  hideOverlay('overlay-surrender');
  if (G.battle) {
    G.battle.ended = true;
    G.battle.surrendered = true;
    if (G.battle.safetyTimer) { clearTimeout(G.battle.safetyTimer); G.battle.safetyTimer = null; }
    if (G.battle.attackSafetyTimer) { clearTimeout(G.battle.attackSafetyTimer); G.battle.attackSafetyTimer = null; }
  }
  addBattleLog('你选择了投降...', 'system');
  const shards = Math.max(2, Math.floor((G.act * 3 + (G.map.currentRow || 0)) / 2));
  clearSave();
  saveMetaProgress('defeat', shards);
  // P2-1: Achievement tracking on surrender
  trackStat('totalRuns');
  trackEvent('run_end', G.selectedClass, 'defeat');
  if (G.dailyChallenge) { saveDailyResult('defeat', getDailyScore()); }
  checkAchievements();
  const meta = getMetaProgress();
  document.getElementById('gameover-info').innerHTML = `你投降了，结束了本次冒险。<br><span style="color:var(--gold);">获得 💎 ${meta.lastShards || shards} 裂境碎晶</span>`;
  playSfx('defeat');
  showOverlay('overlay-gameover');
}

function toggleFastForward() {
  G.fastForward = !G.fastForward;
  const btn = document.getElementById('ff-toggle');
  if (btn) {
    btn.classList.toggle('active', G.fastForward);
    btn.textContent = G.fastForward ? '⏩ 快进中' : '⏩ 快进';
  }
  // Speed up CSS animations via a root class
  document.documentElement.classList.toggle('fast-forward', G.fastForward);
  // Add a brief feedback hint
  const turnInfo = document.getElementById('battle-turn-info');
  if (turnInfo && G.fastForward) {
    const orig = turnInfo.textContent;
    turnInfo.textContent = '⏩ 快进中';
    setTimeout(() => { if (turnInfo.textContent === '⏩ 快进中') turnInfo.textContent = orig; }, 600);
  }
}

function onBattleLost() {
  if (G.battle.ended) return;
  G.battle.ended = true;
  if (G.battle.safetyTimer) { clearTimeout(G.battle.safetyTimer); G.battle.safetyTimer = null; }
  if (G.battle.attackSafetyTimer) { clearTimeout(G.battle.attackSafetyTimer); G.battle.attackSafetyTimer = null; }
  setEndTurnButtonState('enemy');
  addBattleLog('你被击败了...', 'system');
  playMusic('menu');
  // 第9轮：独立教学演示——不结算碎晶/结束界面，直接返回
  if (G.tutorialDemo) {
    setTimeout(() => {
      addBattleLog('教学练习结束，正在返回主菜单...', 'system');
      endTutorialDemo();
    }, 900);
    return;
  }
  clearSave();
  saveMetaProgress('defeat');
  // P2-1: Achievement tracking on defeat
  trackStat('totalRuns');
  trackEvent('run_end', G.selectedClass, 'defeat');
  trackEvent('class_pick', G.selectedClass);
  trackEvent('mode_pick', G.mode);
  trackEvent('difficulty_pick', G.difficulty || 'normal');
  if (G.dailyChallenge) {
    const score = getDailyScore();
    saveDailyResult('defeat', score);
  }
  checkAchievements();

  setTimeout(() => {
    const meta = getMetaProgress();
    document.getElementById('gameover-info').innerHTML = `你在第${G.act + 1}幕的战斗中倒下，坚持了${Math.ceil(G.battle.turn / 2)}个回合。<br><span style="color:var(--gold);">获得 💎 ${meta.lastShards || 2} 裂境碎晶</span>`;
    playSfx('defeat');
    showOverlay('overlay-gameover');
  }, 800);
}


function renderCardStatic(card) {
  const div = document.createElement('div');
  div.className = `card card-${card.type}`;
  
  const cost = document.createElement('div');
  cost.className = 'card-cost';
  cost.textContent = card.cost || 0;
  div.appendChild(cost);
  
  if (card.rarity) {
    const rarity = document.createElement('div');
    rarity.className = `card-rarity rarity-${card.rarity}`;
    div.appendChild(rarity);
  }
  
  const name = document.createElement('div');
  name.className = 'card-name';
  name.textContent = card.name + (card.upgraded ? ' ✨' : '');
  div.appendChild(name);
  
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
  
  const text = document.createElement('div');
  text.className = 'card-text';
  text.textContent = card.text || '';
  div.appendChild(text);
  
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

  div.style.cursor = 'pointer';
  div.oncontextmenu = (e) => { e.preventDefault(); showCardDetail(card); return false; };
  let pressTimer = null;
  let longPressed = false;
  div.addEventListener('touchstart', () => {
    longPressed = false;
    pressTimer = setTimeout(() => { longPressed = true; showCardDetail(card); if (navigator.vibrate) navigator.vibrate(30); }, 400);
  });
  div.addEventListener('touchend', (e) => {
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    if (longPressed) { e.preventDefault(); e.stopPropagation(); }
  });
  div.addEventListener('touchmove', () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } });

  return div;
}

function makeCardClickable(el, card) {
  el.style.cursor = 'pointer';
  el.onclick = (e) => { e.stopPropagation(); showCardDetail(card); };
  return el;
}

function skipReward() {
  hideOverlay('overlay-reward');
  if (G.pendingUpgrade) {
    G.pendingUpgrade = false;
    showUpgradeScreen();
  } else {
    completeNode();
  }
}

