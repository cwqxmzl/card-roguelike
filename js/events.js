/* card-roguelike — events module
   Split from card_roguelike.html inline <script> for maintainability.
   Classic script loaded via <script src>; shares global scope with siblings. */

// ===================== EVENTS =====================
function openEvent() {
  // Prefer events tagged for the current act; fall back to all if none fit
  const actPool = EVENTS.filter(ev => ev.act === undefined || ev.act === (G.act || 0) + 1);
  const pool = actPool.length > 0 ? actPool : EVENTS;
  const event = pool[Math.floor(Math.random() * pool.length)];
  document.getElementById('event-title').textContent = event.title;
  document.getElementById('event-text').textContent = event.text;
  const choicesDiv = document.getElementById('event-choices');
  const eventFrag = document.createDocumentFragment();
  event.choices.forEach(choice => {
    if (!choice.cond(G)) return;
    const btn = document.createElement('button');
    btn.className = 'event-choice-btn';
    btn.textContent = choice.text;
    btn.onclick = () => {
      G.eventLog = [];
      choice.action(G);
      const resultMsgs = G.eventLog;
      G.eventLog = null;
      if (resultMsgs.length > 0) {
        const resultFrag = document.createDocumentFragment();
        resultMsgs.forEach(msg => {
          const div = document.createElement('div');
          div.style.cssText = 'color:#ccc;font-size:14px;margin:6px 0;padding:6px;background:rgba(255,255,255,0.05);border-radius:4px;';
          div.textContent = msg;
          resultFrag.appendChild(div);
        });
        const contBtn = document.createElement('button');
        contBtn.className = 'overlay-btn green';
        contBtn.textContent = '继续';
        contBtn.onclick = () => {
          hideOverlay('overlay-event');
          if (G.pendingUpgrade) {
            G.pendingUpgrade = false;
            showUpgradeScreen();
          } else if (G.pendingDiscover) {
            G.pendingDiscover = false;
            const pool = G.pendingDiscoverPool || [];
            const dTitle = G.pendingDiscoverTitle || '发现一张卡牌';
            G.pendingDiscoverPool = null; G.pendingDiscoverTitle = null;
            offerDiscover(pool, dTitle, (card) => {
              if (card) G.player.deck.push({ ...card, uid: uid() });
              completeNode();
            });
          } else {
            completeNode();
          }
        };
        resultFrag.appendChild(contBtn);
        choicesDiv.replaceChildren(resultFrag);
      } else {
        hideOverlay('overlay-event');
        if (G.pendingUpgrade) {
          G.pendingUpgrade = false;
          showUpgradeScreen();
        } else {
          completeNode();
        }
      }
    };
    eventFrag.appendChild(btn);
  });
  choicesDiv.replaceChildren(eventFrag);
  showOverlay('overlay-event');
}

// ===================== REST =====================
function restHeal() {
  const healAmount = Math.floor(G.player.maxHp * GAME_CONFIG.rest.healPercent) + 2 * ((getMetaProgress().upgrades && getMetaProgress().upgrades.rest_heal_boost) || 0);
  G.player.hp = Math.min(G.player.maxHp, G.player.hp + healAmount);
  hideOverlay('overlay-rest');
  completeNode();
}

function restUpgrade() {
  hideOverlay('overlay-rest');
  showUpgradeScreen();
}

function closeRest() {
  hideOverlay('overlay-rest');
  completeNode();
}

function restDeleteCard() {
  hideOverlay('overlay-rest');
  const container = document.getElementById('delete-cards');
  const frag = document.createDocumentFragment();
  G.player.deck.forEach((card, i) => {
    const wrapper = document.createElement('div');
    wrapper.style.cursor = 'pointer';
    const cardEl = renderCardStatic(card);
    cardEl.style.transform = 'scale(0.85)';
    wrapper.appendChild(cardEl);
    const label = document.createElement('div');
    label.style.cssText = 'text-align:center;margin-top:5px;color:#ff6666;font-size:12px;';
    label.textContent = '删除';
    wrapper.appendChild(label);
    wrapper.onmouseover = () => { wrapper.style.transform = 'translateY(-10px)'; };
    wrapper.onmouseout = () => { wrapper.style.transform = ''; };
    wrapper.onclick = () => {
      G.player.deck.splice(i, 1);
      log(`删除了 ${card.name}`);
      hideOverlay('overlay-delete');
      completeNode();
    };
    frag.appendChild(wrapper);
  });
  container.replaceChildren(frag);
  showOverlay('overlay-delete');
}

function cancelDelete() {
  hideOverlay('overlay-delete');
  showOverlay('overlay-rest');
}

const ALT_HERO_POWERS = [
  { name: '火焰冲击', cost: 2, type: 'mage', description: '对敌方英雄造成1点伤害', icon: '🔥' },
  { name: '全副武装', cost: 2, type: 'warrior', description: '获得2点护甲', icon: '🛡️' },
  { name: '稳固射击', cost: 2, type: 'hunter', description: '对敌方英雄造成2点伤害', icon: '🏹' },
  { name: '白银之手', cost: 2, type: 'paladin', description: '召唤一个1/1白银之手新兵', icon: '⚔️' },
  { name: '生命之火', cost: 1, type: 'priest', description: '恢复2点生命', icon: '✨' },
  { name: '匕首精通', cost: 2, type: 'rogue', description: '装备一把1/2匕首', icon: '🗡️' },
];

function restChangePower() {
  hideOverlay('overlay-rest');
  const container = document.getElementById('power-choices');
  const frag = document.createDocumentFragment();
  ALT_HERO_POWERS.forEach(power => {
    const card = document.createElement('div');
    card.className = 'tavern-option';
    card.style.minWidth = '140px';
    card.innerHTML = `
      <div style="font-size:40px;">${power.icon}</div>
      <div style="color:var(--gold);font-size:14px;margin-top:6px;font-weight:bold;">${power.name}</div>
      <div style="color:#888;font-size:11px;margin-top:4px;">${power.description}</div>
      <div style="color:var(--blue);font-size:12px;margin-top:4px;">💎 ${power.cost}</div>
    `;
    card.onclick = () => {
      G.player.heroPower = { used: false, cost: power.cost, type: power.type, name: power.name };
      log(`英雄技能更换为：${power.name}`);
      hideOverlay('overlay-power');
      completeNode();
    };
    frag.appendChild(card);
  });
  container.replaceChildren(frag);
  showOverlay('overlay-power');
}

function cancelChangePower() {
  hideOverlay('overlay-power');
  showOverlay('overlay-rest');
}

// ===================== TREASURE =====================
function openTreasure() {
  const cards = [];
  const pool = CARD_POOL.filter(c => c.rarity === 'rare' || c.rarity === 'epic' || (G.act > 0 && c.rarity === 'legendary'));
  for (let i = 0; i < 3; i++) {
    const card = pool[Math.floor(Math.random() * pool.length)];
    cards.push({ ...card, uid: uid() });
  }

  const container = document.getElementById('treasure-cards');
  const frag = document.createDocumentFragment();
  cards.forEach(card => {
    const wrapper = document.createElement('div');
    wrapper.className = 'reward-card-wrapper';
    wrapper.appendChild(renderCardStatic(card));
    wrapper.onclick = () => {
      G.player.deck.push(card);
      hideOverlay('overlay-treasure');
      completeNode();
    };
    frag.appendChild(wrapper);
  });
  container.replaceChildren(frag);
  showOverlay('overlay-treasure');
}

function closeTreasure() {
  hideOverlay('overlay-treasure');
  completeNode();
}

// ===================== UPGRADE =====================
function showUpgradeScreen() {
  const container = document.getElementById('upgrade-cards');
  const frag = document.createDocumentFragment();
  G.player.deck.forEach((card, i) => {
    if (card.upgraded) return;
    const wrapper = document.createElement('div');
    wrapper.style.cursor = 'pointer';
    const cardEl = renderCardStatic(card);
    cardEl.style.transform = 'scale(0.9)';
    wrapper.appendChild(cardEl);
    const label = document.createElement('div');
    label.style.cssText = 'text-align:center;margin-top:5px;color:var(--gold);font-size:12px;';
    label.textContent = '升级';
    wrapper.appendChild(label);
    wrapper.onmouseover = () => { wrapper.style.transform = 'translateY(-10px)'; };
    wrapper.onmouseout = () => { wrapper.style.transform = ''; };
    wrapper.onclick = () => {
      showUpgradeBranch(card);
    };
    frag.appendChild(wrapper);
  });
  container.replaceChildren(frag);
  showOverlay('overlay-upgrade');
}

// 第19轮：卡牌升级分支——根据卡牌类型生成可选择的升级方向
function getUpgradeChoices(card) {
  const choices = [];
  if (card.type === 'minion') {
    choices.push({ id: 'atk', label: '攻击 +' + NumericConfig.MINION_UPGRADE_ATK, desc: '攻击力提升', apply(){ card.attack = (card.attack || 0) + NumericConfig.MINION_UPGRADE_ATK; } });
    choices.push({ id: 'hp', label: '生命 +' + NumericConfig.MINION_UPGRADE_HP, desc: '生命值提升', apply(){ card.hp = (card.hp || 0) + NumericConfig.MINION_UPGRADE_HP; } });
    if (card.cost > 0) choices.push({ id: 'cost', label: '费用 -1', desc: '更早登场', apply(){ card.cost = Math.max(0, card.cost - 1); } });
  } else if (card.type === 'weapon') {
    choices.push({ id: 'atk', label: '攻击 +' + NumericConfig.WEAPON_UPGRADE_ATK, desc: '攻击力提升', apply(){ card.attack = (card.attack || 0) + NumericConfig.WEAPON_UPGRADE_ATK; } });
    choices.push({ id: 'dur', label: '耐久 +' + NumericConfig.WEAPON_UPGRADE_DUR, desc: '耐久提升', apply(){ card.durability = (card.durability || 0) + NumericConfig.WEAPON_UPGRADE_DUR; } });
    if (card.cost > 0) choices.push({ id: 'cost', label: '费用 -1', desc: '更早装备', apply(){ card.cost = Math.max(0, card.cost - 1); } });
  } else {
    // spell：3 分支（数值强化 / 功能化附带效果 / 降费）
    const spellChoices = [];
    if (card.damage && card.damage > 0) {
      spellChoices.push({ id: 'dmg', label: '伤害 +' + NumericConfig.UPGRADE_ATK_BONUS, desc: '造成更多伤害', apply(){ card.damage = (card.damage || 0) + NumericConfig.UPGRADE_ATK_BONUS; } });
      spellChoices.push({ id: 'func', label: '附带抽牌', desc: '打出时额外抽1张牌', apply(){ card.extraEffect = 'draw_1'; } });
    } else if (card.block && card.block > 0) {
      spellChoices.push({ id: 'blk', label: '护甲 +' + NumericConfig.UPGRADE_BLOCK_BONUS, desc: '获得更多护甲', apply(){ card.block = (card.block || 0) + NumericConfig.UPGRADE_BLOCK_BONUS; } });
      spellChoices.push({ id: 'func', label: '附带回血', desc: '打出时回复2点生命', apply(){ card.extraEffect = 'heal_2'; } });
    }
    if (card.cost > 0) spellChoices.push({ id: 'cost', label: '费用 -1', desc: '更容易打出', apply(){ card.cost = Math.max(0, card.cost - 1); } });
    if (spellChoices.length === 0) {
      spellChoices.push({ id: 'func', label: '过牌强化', desc: '打出时额外抽1张牌', apply(){ card.extraEffect = 'draw_1'; } });
      spellChoices.push({ id: 'dmg', label: '伤害 +' + NumericConfig.UPGRADE_ATK_BONUS, desc: '附加伤害能力', apply(){ card.damage = (card.damage || 0) + NumericConfig.UPGRADE_ATK_BONUS; } });
      if (card.cost > 0) spellChoices.push({ id: 'cost', label: '费用 -1', desc: '更容易打出', apply(){ card.cost = Math.max(0, card.cost - 1); } });
    }
    spellChoices.slice(0, 3).forEach(c => choices.push(c));
  }
  return choices;
}

// 升级分支选择界面（复用 overlay-upgrade 容器）
function showUpgradeBranch(card) {
  const container = document.getElementById('upgrade-cards');
  if (!container) { upgradeCard(card); hideOverlay('overlay-upgrade'); completeNode(); return; }
  const frag = document.createDocumentFragment();
  const title = document.createElement('div');
  title.style.cssText = 'text-align:center;color:var(--gold);font-size:14px;margin-bottom:10px;width:100%;';
  title.textContent = '选择「' + card.name + '」的升级方向';
  frag.appendChild(title);
  getUpgradeChoices(card).forEach(ch => {
    const wrapper = document.createElement('div');
    wrapper.className = 'reward-type-card';
    wrapper.style.width = '200px';
    wrapper.style.cursor = 'pointer';
    const icon = document.createElement('div');
    icon.className = 'reward-type-icon';
    icon.textContent = '⬆';
    const t = document.createElement('div');
    t.className = 'reward-type-title';
    t.textContent = ch.label;
    const d = document.createElement('div');
    d.className = 'reward-type-desc';
    d.textContent = ch.desc;
    wrapper.appendChild(icon);
    wrapper.appendChild(t);
    wrapper.appendChild(d);
    wrapper.onmouseover = () => { wrapper.style.transform = 'translateY(-6px)'; };
    wrapper.onmouseout = () => { wrapper.style.transform = ''; };
    wrapper.onclick = () => {
      ch.apply();
      card.upgraded = true;
      log(card.name + ' 升级完成：' + ch.label);
      hideOverlay('overlay-upgrade');
      completeNode();
    };
    frag.appendChild(wrapper);
  });
  container.replaceChildren(frag);
}

function upgradeCard(card) {
  card.upgraded = true;
  if (card.type === 'minion') {
    card.attack = (card.attack || 0) + NumericConfig.MINION_UPGRADE_ATK;
    card.hp = (card.hp || 0) + NumericConfig.MINION_UPGRADE_HP;
  } else if (card.type === 'weapon') {
    card.attack = (card.attack || 0) + NumericConfig.WEAPON_UPGRADE_ATK;
    card.durability = (card.durability || 0) + NumericConfig.WEAPON_UPGRADE_DUR;
  } else if (card.type === 'spell') {
    // 第17轮：攻击/防御牌按配置强化数值，其余减费
    if (card.damage && card.damage > 0) card.damage = (card.damage || 0) + NumericConfig.UPGRADE_ATK_BONUS;
    else if (card.block && card.block > 0) card.block = (card.block || 0) + NumericConfig.UPGRADE_BLOCK_BONUS;
    else if (card.cost > 0) card.cost = Math.max(0, card.cost - 1);
  }
  log(`${card.name}已升级！`);
}

// ===================== RELICS =====================
function pickRelicByTier(available, tier) {
  const w = {
    normal: { common: 65, rare: 25, epic: 10, boss: 0 },
    elite:  { common: 40, rare: 35, epic: 20, boss: 5 },
    boss:   { common: 0,  rare: 25, epic: 40, boss: 35 }
  }[tier] || { common: 65, rare: 25, epic: 10, boss: 0 };
  let pool = available.filter(r => (w[r.rarity] || 0) > 0);
  if (pool.length === 0) pool = available;
  let total = 0;
  const items = pool.map(r => { const wt = w[r.rarity] || w.common; total += wt; return { r, wt }; });
  let roll = Math.random() * total;
  for (const it of items) { roll -= it.wt; if (roll <= 0) return it.r; }
  return items[items.length - 1].r;
}
function grantRelic(g, tier) {
  const available = RELICS.filter(r => !g.relics.find(gr => gr.id === r.id));
  if (available.length === 0) return;
  const relic = pickRelicByTier(available, tier);
  g.relics.push({ ...relic });
  applyRelic(relic);
  // P2-1: Achievement tracking for relic acquisition
  if (!isAchievementUnlocked('first_relic')) unlockAchievement('first_relic');
  if (g.relics.length >= 10 && !isAchievementUnlocked('relic_10')) unlockAchievement('relic_10');
  if (g.relics.length >= 15 && !isAchievementUnlocked('relic_15')) unlockAchievement('relic_15');
  // P2-5: Analytics
  trackEvent('relic_get', relic.id);
}

function applyRelic(relic) {
  switch (relic.effect) {
    case 'max_hp':
      G.player.maxHp += 10;
      G.player.hp += 10;
      break;
    case 'giant_heart':
      G.player.maxHp += 20;
      G.player.hp += 20;
      break;
    case 'spell_power':
      // Applied at battle start
      break;
    // Others are checked dynamically
  }
}

function hasRelic(id) {
  return G.relics.some(r => r.effect === id || r.id === id);
}

function renderRelics(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const frag = document.createDocumentFragment();
  G.relics.forEach(r => {
    const _rr = r.rarity || 'common';
    const icon = document.createElement('div');
    icon.className = 'relic-icon relic-' + _rr;
    icon.textContent = r.icon;
    icon.style.touchAction = 'manipulation';
    const tooltip = document.createElement('div');
    tooltip.className = 'relic-tooltip';
    const _rn = { common: '普通', rare: '稀有', epic: '史诗', boss: 'Boss' }[_rr] || '普通';
    tooltip.innerHTML = `<b>${r.name}</b><br><span class="relic-rarity relic-rarity-${_rr}">【${_rn}】</span><br>${r.desc || r.description || ''}`;
    icon.appendChild(tooltip);
    icon.onclick = () => {
      document.querySelectorAll('.relic-tooltip').forEach(t => { if (t !== tooltip) t.style.display = ''; });
      tooltip.style.display = tooltip.style.display === 'block' ? '' : 'block';
    };
    frag.appendChild(icon);
  });
  container.replaceChildren(frag);
}

// ===================== DECK VIEW =====================
function viewDeck() {
  const container = document.getElementById('deck-view-content');
  const frag = document.createDocumentFragment();
  const sorted = [...G.player.deck].sort((a, b) => {
    if (a.cost !== b.cost) return a.cost - b.cost;
    return a.name.localeCompare(b.name);
  });
  sorted.forEach(card => {
    makeCardClickable(frag.appendChild(renderCardStatic(card)), card);
  });
  container.replaceChildren(frag);
  document.getElementById('deck-view-title').textContent = `你的牌组 (${G.player.deck.length}张)`;
  showOverlay('overlay-deck');
}

function closeDeckView() {
  hideOverlay('overlay-deck');
}

function viewDrawPile() {
  const container = document.getElementById('deck-view-content');
  container.replaceChildren();
  if (G.battle && G.player.drawPile) {
    const frag = document.createDocumentFragment();
    const sorted = [...G.player.drawPile].sort((a, b) => a.cost - b.cost);
    sorted.forEach(card => makeCardClickable(frag.appendChild(renderCardStatic(card)), card));
    container.replaceChildren(frag);
    document.getElementById('deck-view-title').textContent = `抽牌堆 (${G.player.drawPile.length}张)`;
  }
  showOverlay('overlay-deck');
}

function viewDiscardPile() {
  const container = document.getElementById('deck-view-content');
  container.replaceChildren();
  if (G.battle && G.player.discardPile) {
    const frag = document.createDocumentFragment();
    const sorted = [...G.player.discardPile].sort((a, b) => a.cost - b.cost);
    sorted.forEach(card => makeCardClickable(frag.appendChild(renderCardStatic(card)), card));
    container.replaceChildren(frag);
    document.getElementById('deck-view-title').textContent = `弃牌堆 (${G.player.discardPile.length}张)`;
  }
  showOverlay('overlay-deck');
}

// ===================== MISC =====================
function showRules() { showOverlay('overlay-rules'); }
function closeRules() { hideOverlay('overlay-rules'); }

// ===================== 独立教学关卡（第9轮） =====================
// 主菜单"教学关卡"入口：列出全部教学关，点击独立练习，不消耗正式冒险进度
function showTutorialDemo() {
  const list = document.getElementById('tutorial-demo-list');
  if (list) {
    const frag = document.createDocumentFragment();
    (typeof TUTORIAL_ENEMIES !== 'undefined' ? TUTORIAL_ENEMIES : []).forEach((enemy, i) => {
      const type = i === 0 ? 'tutorial_1' : 'tutorial_2';
      const card = document.createElement('div');
      card.className = 'reward-type-card';
      card.style.cssText = 'width:210px;cursor:pointer;';
      card.innerHTML = `
        <div class="reward-type-icon" style="font-size:30px;">${enemy.portrait}</div>
        <div class="reward-type-title">教学关 ${i + 1}</div>
        <div class="reward-type-desc" style="font-size:11px;line-height:1.5;">${enemy.tutorialMsg || '练习核心机制'}</div>
      `;
      card.onclick = () => startTutorialDemo(type);
      frag.appendChild(card);
    });
    list.replaceChildren(frag);
  }
  showOverlay('overlay-tutorial-demo');
}

function startTutorialDemo(type) {
  hideOverlay('overlay-tutorial-demo');
  // 保存当前进行中的冒险（若有），结束后恢复
  const hadRun = !!(typeof G !== 'undefined' && G && G.player && G.player.deck && !G.tutorialDemo);
  const savedRun = hadRun ? JSON.stringify(G) : '';
  try { sessionStorage.setItem('tutorialDemoSave', savedRun); } catch(e) {}
  // 用默认法师初始化演示局（不写入持久化存档）
  if (typeof initGame === 'function') initGame('mage');
  G.tutorialDemo = true;
  G.tutorial = false;
  startBattle(type);
}

// 教学演示结束后恢复原冒险或回到主菜单
function endTutorialDemo() {
  let saved = '';
  try { saved = sessionStorage.getItem('tutorialDemoSave') || ''; } catch(e) {}
  if (saved) {
    try {
      G = JSON.parse(saved);
      if (G.battle && G.battle.enemyType && !G.battle.ended && typeof renderBattle === 'function') {
        showScreen('battle');
        renderBattle();
      } else if (typeof renderMap === 'function') {
        showScreen('map');
        renderMap();
      } else {
        showScreen('menu');
      }
      return;
    } catch(e) {}
  }
  clearSave();
  showScreen('menu');
}

