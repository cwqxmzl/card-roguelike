/* card-roguelike — shop module
   Split from card_roguelike.html inline <script> for maintainability.
   Classic script loaded via <script src>; shares global scope with siblings. */

// ===================== SHOP =====================
function openShop() {
  G.shopInventory = { cards: [], relics: [], healCost: 0, discoverCost: 40, discoverSold: false };
  
  // Generate shop cards (5)
  const pool = CARD_POOL.filter(c => {
    if (G.act === 0) return c.rarity === 'common' || c.rarity === 'rare';
    return c.rarity !== 'legendary' || Math.random() < 0.1;
  });
  for (let i = 0; i < 5; i++) {
    const card = pool[Math.floor(Math.random() * pool.length)];
    G.shopInventory.cards.push({
      ...card,
      uid: uid(),
      price: card.rarity === 'common' ? 15 : card.rarity === 'rare' ? 30 : card.rarity === 'epic' ? 50 : 80,
      sold: false,
    });
  }
  
  // Generate shop relics (3)
  const availableRelics = RELICS.filter(r => !G.relics.find(gr => gr.id === r.id));
  for (let i = 0; i < Math.min(3, availableRelics.length); i++) {
    const idx = Math.floor(Math.random() * availableRelics.length);
    const relic = availableRelics.splice(idx, 1)[0];
    G.shopInventory.relics.push({ ...relic, price: 40 + Math.floor(Math.random() * 30), sold: false });
  }
  
  // Heal option
  G.shopInventory.healCost = 20;
  
  renderShop();
  showOverlay('overlay-shop');
}

function renderShop() {
  const container = document.getElementById('shop-content');

  // Cards section
  const cardSection = document.createElement('div');
  cardSection.className = 'shop-section';
  const cardTitle = document.createElement('div');
  cardTitle.className = 'shop-section-title';
  cardTitle.textContent = '卡牌';
  cardSection.appendChild(cardTitle);
  
  const cardGrid = document.createElement('div');
  cardGrid.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center;max-width:500px;';
  const cardFrag = document.createDocumentFragment();
  G.shopInventory.cards.forEach((item, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'shop-item';
    makeCardClickable(wrapper.appendChild(renderCardStatic(item)), item);
    const price = document.createElement('div');
    price.className = 'shop-price';
    price.textContent = `💰 ${item.price}`;
    wrapper.appendChild(price);
    const btn = document.createElement('button');
    btn.className = 'shop-buy-btn';
    btn.textContent = '购买';
    btn.disabled = item.sold || G.gold < item.price;
    btn.onclick = () => {
      G.gold -= item.price;
      item.sold = true;
      G.player.deck.push({ ...item, uid: uid() });
      renderShop();
      renderMap();
    };
    if (item.sold) { btn.textContent = '已售'; btn.disabled = true; }
    wrapper.appendChild(btn);
    cardFrag.appendChild(wrapper);
  });
  cardGrid.appendChild(cardFrag);
  cardSection.appendChild(cardGrid);

  // Discover pack option
  const discoverDiv = document.createElement('div');
  discoverDiv.className = 'shop-item';
  discoverDiv.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:5px;margin-top:12px;';
  const dIcon = document.createElement('div');
  dIcon.style.fontSize = '36px';
  dIcon.textContent = '📖';
  discoverDiv.appendChild(dIcon);
  const dName = document.createElement('div');
  dName.style.cssText = 'font-size:13px;color:var(--gold);';
  dName.textContent = '发现卡包';
  discoverDiv.appendChild(dName);
  const dDesc = document.createElement('div');
  dDesc.style.cssText = 'font-size:11px;color:#888;text-align:center;max-width:140px;';
  dDesc.textContent = '从3张稀有/史诗卡中选1张加入牌组';
  discoverDiv.appendChild(dDesc);
  const dPrice = document.createElement('div');
  dPrice.className = 'shop-price';
  dPrice.textContent = `💰 ${G.shopInventory.discoverCost}`;
  discoverDiv.appendChild(dPrice);
  const dBtn = document.createElement('button');
  dBtn.className = 'shop-buy-btn';
  dBtn.textContent = '发现';
  dBtn.disabled = G.shopInventory.discoverSold || G.gold < G.shopInventory.discoverCost;
  dBtn.onclick = () => {
    if (G.shopInventory.discoverSold || G.gold < G.shopInventory.discoverCost) return;
    offerDiscover(CARD_POOL.filter(c => c.rarity === 'rare' || c.rarity === 'epic'), '发现一张卡牌', (card) => {
      if (card) {
        G.gold -= G.shopInventory.discoverCost;
        G.shopInventory.discoverSold = true;
        G.player.deck.push({ ...card, uid: uid() });
        renderShop();
        renderMap();
      }
    });
  };
  if (G.shopInventory.discoverSold) { dBtn.textContent = '已购'; dBtn.disabled = true; }
  discoverDiv.appendChild(dBtn);
  cardSection.appendChild(discoverDiv);
  
  // Relics section
  const relicSection = document.createElement('div');
  relicSection.className = 'shop-section';
  const relicTitle = document.createElement('div');
  relicTitle.className = 'shop-section-title';
  relicTitle.textContent = '遗物';
  relicSection.appendChild(relicTitle);
  
  G.shopInventory.relics.forEach((item, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'shop-item';
    wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:5px;';
    const icon = document.createElement('div');
    icon.style.fontSize = '36px';
    icon.textContent = item.icon;
    wrapper.appendChild(icon);
    const name = document.createElement('div');
    name.style.cssText = 'font-size:13px;color:var(--gold);';
    name.textContent = item.name;
    wrapper.appendChild(name);
    const desc = document.createElement('div');
    desc.style.cssText = 'font-size:11px;color:#888;text-align:center;max-width:120px;';
    desc.textContent = item.desc || item.description || '';
    wrapper.appendChild(desc);
    const price = document.createElement('div');
    price.className = 'shop-price';
    price.textContent = `💰 ${item.price}`;
    wrapper.appendChild(price);
    const btn = document.createElement('button');
    btn.className = 'shop-buy-btn';
    btn.textContent = '购买';
    btn.disabled = item.sold || G.gold < item.price;
    btn.onclick = () => {
      G.gold -= item.price;
      item.sold = true;
      G.relics.push({ ...item });
      applyRelic(item);
      renderShop();
      renderMap();
    };
    if (item.sold) { btn.textContent = '已售'; btn.disabled = true; }
    wrapper.appendChild(btn);
    relicSection.appendChild(wrapper);
  });
  
  // Heal option
  const healDiv = document.createElement('div');
  healDiv.className = 'shop-item';
  healDiv.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:5px;margin-top:10px;';
  const healIcon = document.createElement('div');
  healIcon.style.fontSize = '36px';
  healIcon.textContent = '❤️';
  healDiv.appendChild(healIcon);
  const healName = document.createElement('div');
  healName.style.cssText = 'font-size:13px;color:var(--green);';
  healName.textContent = '恢复生命';
  healDiv.appendChild(healName);
  const healDesc = document.createElement('div');
  healDesc.style.cssText = 'font-size:11px;color:#888;text-align:center;max-width:120px;';
  healDesc.textContent = '恢复15点生命';
  healDiv.appendChild(healDesc);
  const healPrice = document.createElement('div');
  healPrice.className = 'shop-price';
  healPrice.textContent = `💰 ${G.shopInventory.healCost}`;
  healDiv.appendChild(healPrice);
  const healBtn = document.createElement('button');
  healBtn.className = 'shop-buy-btn';
  healBtn.textContent = '购买';
  healBtn.disabled = G.gold < G.shopInventory.healCost || G.player.hp >= G.player.maxHp;
  healBtn.onclick = () => {
    G.gold -= G.shopInventory.healCost;
    G.player.hp = Math.min(G.player.maxHp, G.player.hp + 15);
    G.shopInventory.healCost = 999;
    renderShop();
    renderMap();
  };
  if (G.shopInventory.healCost >= 999) { healBtn.textContent = '已用'; healBtn.disabled = true; }
  healDiv.appendChild(healBtn);
  relicSection.appendChild(healDiv);

  container.replaceChildren(cardSection, relicSection);
}

function closeShop() {
  hideOverlay('overlay-shop');
  completeNode();
}

