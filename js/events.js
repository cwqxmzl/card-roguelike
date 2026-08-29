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
  const healAmount = Math.floor(G.player.maxHp * GAME_CONFIG.rest.healPercent);
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
      upgradeCard(card);
      hideOverlay('overlay-upgrade');
      completeNode();
    };
    frag.appendChild(wrapper);
  });
  container.replaceChildren(frag);
  showOverlay('overlay-upgrade');
}

function upgradeCard(card) {
  card.upgraded = true;
  if (card.type === 'minion') {
    card.attack = (card.attack || 0) + 1;
    card.hp = (card.hp || 0) + 1;
  } else if (card.type === 'weapon') {
    card.attack = (card.attack || 0) + 1;
    card.durability = (card.durability || 0) + 1;
  } else if (card.type === 'spell') {
    // Reduce cost or improve effect
    if (card.cost > 0) card.cost = Math.max(0, card.cost - 1);
  }
  log(`${card.name}已升级！`);
}

// ===================== RELICS =====================
function grantRelic(g) {
  const available = RELICS.filter(r => !g.relics.find(gr => gr.id === r.id));
  if (available.length === 0) return;
  const relic = available[Math.floor(Math.random() * available.length)];
  g.relics.push({ ...relic });
  applyRelic(relic);
}

function applyRelic(relic) {
  switch (relic.effect) {
    case 'max_hp':
      G.player.maxHp += 10;
      G.player.hp += 10;
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
    const icon = document.createElement('div');
    icon.className = 'relic-icon';
    icon.textContent = r.icon;
    icon.style.touchAction = 'manipulation';
    const tooltip = document.createElement('div');
    tooltip.className = 'relic-tooltip';
    tooltip.innerHTML = `<b>${r.name}</b><br>${r.desc || r.description || ''}`;
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

