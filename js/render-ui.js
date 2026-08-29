/* card-roguelike — render-ui module
   Split from card_roguelike.html inline <script> for maintainability.
   Classic script loaded via <script src>; shares global scope with siblings. */

// ===================== SCREEN MANAGEMENT =====================
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${name}`).classList.add('active');
}

function showOverlay(id) { document.getElementById(id).classList.add('active'); }
function hideOverlay(id) { document.getElementById(id).classList.remove('active'); }

// ===================== MAP RENDERING =====================
function renderMap() {
  const diffName = G.difficulty ? DIFFICULTY_SETTINGS[G.difficulty]?.name || '' : '';
  document.getElementById('map-act-title').textContent = ACT_NAMES[G.act] + (diffName ? ` · ${diffName}` : '');
  document.getElementById('map-hp').textContent = `${G.player.hp}/${G.player.maxHp}`;
  document.getElementById('map-gold').textContent = G.gold;
  document.getElementById('map-deck').textContent = G.player.deck.length;
  renderRelics('map-relics');
  
  const container = document.getElementById('map-nodes');
  const frag = document.createDocumentFragment();
  G.map.rows.forEach((row, ri) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'map-row';
    row.forEach(node => {
      const nodeDiv = document.createElement('div');
      const info = NODE_TYPES[node.type];
      nodeDiv.className = 'map-node';
      if (node.type === 'boss') nodeDiv.classList.add('boss');
      if (node.completed) nodeDiv.classList.add('completed');
      else if (node.available) nodeDiv.classList.add('available');
      else nodeDiv.classList.add('locked');
      nodeDiv.textContent = info.icon;
      nodeDiv.title = info.label;
      const label = document.createElement('div');
      label.className = 'map-node-label';
      label.textContent = node.completed ? '已完成' : info.label;
      nodeDiv.appendChild(label);

      // Detail view: long-press or right-click
      nodeDiv.oncontextmenu = (e) => { e.preventDefault(); showNodeDetail(node, info); return false; };
      let nodePressTimer = null;
      let nodeLongPressed = false;
      nodeDiv.addEventListener('touchstart', () => {
        nodeLongPressed = false;
        nodePressTimer = setTimeout(() => {
          nodeLongPressed = true;
          showNodeDetail(node, info);
          if (navigator.vibrate) navigator.vibrate(30);
        }, 500);
      });
      nodeDiv.addEventListener('touchend', (e) => {
        if (nodePressTimer) { clearTimeout(nodePressTimer); nodePressTimer = null; }
        if (nodeLongPressed) { e.preventDefault(); e.stopPropagation(); }
      });
      nodeDiv.addEventListener('touchmove', () => { if (nodePressTimer) { clearTimeout(nodePressTimer); nodePressTimer = null; } });

      if (node.available) {
        nodeDiv.onclick = () => { if (!nodeLongPressed) enterNode(node); };
      }
      rowDiv.appendChild(nodeDiv);
    });
    frag.appendChild(rowDiv);
  });
  container.replaceChildren(frag);
}

function showNodeDetail(node, info) {
  const nodeDesc = {
    battle: '普通战斗，击败敌人可获得金币和卡牌奖励',
    elite: '精英战斗，难度较高但奖励更丰厚',
    shop: '商店，可花费金币购买卡牌和遗物',
    event: '随机事件，可能带来机遇或风险',
    rest: '酒馆，可恢复生命值或强化卡牌',
    treasure: '宝箱，免费获取一件遗物',
    boss: '首领战，击败后进入下一幕',
  };
  const inner = document.getElementById('card-detail-inner');
  if (!inner) return;
  let html = '<div style="text-align:center;">';
  html += `<div style="font-size:36px;margin-bottom:6px;">${info.icon}</div>`;
  html += `<div style="font-size:16px;font-weight:bold;color:${info.color || 'var(--gold)'};">${info.label}</div>`;
  html += `<div style="font-size:13px;color:#ccc;margin-top:8px;padding:6px 10px;background:rgba(0,0,0,0.3);border-radius:6px;line-height:1.5;">${nodeDesc[node.type] || '未知节点'}</div>`;
  if (node.completed) html += '<div style="font-size:12px;color:#888;margin-top:6px;">✓ 已完成</div>';
  else if (node.available) html += '<div style="font-size:12px;color:#ffd700;margin-top:6px;">▶ 可进入</div>';
  else html += '<div style="font-size:12px;color:#666;margin-top:6px;">🔒 未解锁</div>';
  html += '</div>';
  inner.innerHTML = html;
  document.getElementById('card-detail-overlay').classList.add('active');
}

function enterNode(node) {
  G.currentNode = node;
  switch (node.type) {
    case 'battle': case 'elite': startBattle(node.type); break;
    case 'shop': openShop(); break;
    case 'event': openEvent(); break;
    case 'rest': showOverlay('overlay-rest'); break;
    case 'treasure': openTreasure(); break;
    case 'boss': startBattle('boss'); break;
  }
}

function completeNode() {
  const node = G.currentNode;
  if (!node) return;
  node.completed = true;
  node.available = false;
  // Unlock next row nodes
  const nextRow = node.row + 1;
  if (nextRow < G.map.rows.length) {
    G.map.rows[nextRow].forEach(n => n.available = true);
  }
  G.currentNode = null;
  
  // Check if act completed (boss defeated)
  if (node.type === 'boss') {
    G.act++;
    if (G.act >= 3) {
      clearSave();
      saveMetaProgress('victory');
      const meta = getMetaProgress();
      document.getElementById('victory-info').innerHTML = `你征服了暗影裂境！<br><span style="color:var(--gold);">获得 💎 ${meta.lastShards || 8} 裂境碎晶</span>`;
      playSfx('victory');
      showOverlay('overlay-victory');
    } else {
      generateMap(G.act);
      showScreen('map');
      renderMap();
      saveGame();
    }
  } else {
    showScreen('map');
    renderMap();
    saveGame();
  }
}

