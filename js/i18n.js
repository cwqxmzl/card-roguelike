/* card-roguelike — i18n (internationalization) framework
   Lightweight text key system with Chinese (default) and English support.
   Classic script loaded via <script src>; shares global scope with siblings. */

const I18N_KEY = 'shadow_rift_lang';

let currentLang = 'zh';

const I18N_TEXTS = {
  zh: {
    'menu.title': '暗影裂境',
    'menu.subtitle': '卡牌肉鸽冒险',
    'menu.new_run': '开始新冒险',
    'menu.continue': '继续冒险',
    'menu.daily': '📅 每日挑战',
    'menu.achievements': '🏆 成就',
    'menu.meta_shop': '💎 裂境圣所',
    'menu.settings': '⚙️ 设置',
    'menu.rules': '游戏规则',
    'menu.tutorial': '🎓 教学关卡',
    'class_select.title': '选择你的英雄',
    'class_select.subtitle': '每个职业拥有专属卡组、技能和卡牌池',
    'class_select.difficulty': '难度:',
    'class_select.mode': '模式:',
    'class_select.hint': '点击职业卡片开始冒险 →',
    'class_select.back': '返回',
    'mode.standard': '🗺️ 标准',
    'mode.endless': '♾️ 无限',
    'mode.sprint': '⚡ 极速',
    'difficulty.easy': '😊 简单',
    'difficulty.normal': '⚔️ 普通',
    'difficulty.hard': '💀 困难',
    'battle.end_turn': '结束回合',
    'battle.enemy_turn': '敌方回合',
    'battle.your_turn': '你的回合',
    'battle.turn': '第 {0} 回合',
    'battle.victory': '胜利！',
    'battle.defeat': '你失败了',
    'battle.surrender': '投降',
    'battle.view_deck': '查看牌组',
    'shop.title': '商店',
    'shop.leave': '离开',
    'event.title': '事件',
    'rest.title': '酒馆',
    'treasure.title': '宝箱',
    'upgrade.title': '选择要升级的卡牌',
    'reward.title': '胜利！选择一张卡牌',
    'reward.skip': '跳过',
    'meta.title': '裂境圣所',
    'meta.shards': '裂境碎晶',
    'meta.back': '返回',
    'daily.title': '📅 每日挑战',
    'daily.start': '开始每日挑战',
    'daily.completed': '今日已完成',
    'daily.seed_share': '种子分享',
    'daily.seed_input': '输入种子码...',
    'daily.import': '导入',
    'daily.back': '返回主菜单',
    'ach.title': '🏆 成就',
    'ach.back': '返回',
    'ach.unlocked': '✅',
    'ach.locked': '🔒',
    'common.confirm': '确认',
    'common.cancel': '取消',
    'common.close': '关闭',
    'common.back': '返回',
  },
  en: {
    'menu.title': 'Shadow Rift',
    'menu.subtitle': 'Card Roguelike Adventure',
    'menu.new_run': 'New Adventure',
    'menu.continue': 'Continue',
    'menu.daily': '📅 Daily Challenge',
    'menu.achievements': '🏆 Achievements',
    'menu.meta_shop': '💎 Rift Sanctuary',
    'menu.settings': '⚙️ Settings',
    'menu.rules': 'How to Play',
    'menu.tutorial': '🎓 Tutorial',
    'class_select.title': 'Choose Your Hero',
    'class_select.subtitle': 'Each class has its own deck, hero power, and card pool',
    'class_select.difficulty': 'Difficulty:',
    'class_select.mode': 'Mode:',
    'class_select.hint': 'Click a class card to start →',
    'class_select.back': 'Back',
    'mode.standard': '🗺️ Standard',
    'mode.endless': '♾️ Endless',
    'mode.sprint': '⚡ Sprint',
    'difficulty.easy': '😊 Easy',
    'difficulty.normal': '⚔️ Normal',
    'difficulty.hard': '💀 Hard',
    'battle.end_turn': 'End Turn',
    'battle.enemy_turn': 'Enemy Turn',
    'battle.your_turn': 'Your Turn',
    'battle.turn': 'Turn {0}',
    'battle.victory': 'Victory!',
    'battle.defeat': 'You have been defeated',
    'battle.surrender': 'Surrender',
    'battle.view_deck': 'View Deck',
    'shop.title': 'Shop',
    'shop.leave': 'Leave',
    'event.title': 'Event',
    'rest.title': 'Tavern',
    'treasure.title': 'Treasure',
    'upgrade.title': 'Choose a card to upgrade',
    'reward.title': 'Victory! Choose a card',
    'reward.skip': 'Skip',
    'meta.title': 'Rift Sanctuary',
    'meta.shards': 'Rift Shards',
    'meta.back': 'Back',
    'daily.title': '📅 Daily Challenge',
    'daily.start': 'Start Daily Challenge',
    'daily.completed': 'Completed Today',
    'daily.seed_share': 'Seed Share',
    'daily.seed_input': 'Enter seed code...',
    'daily.import': 'Import',
    'daily.back': 'Back to Menu',
    'ach.title': '🏆 Achievements',
    'ach.back': 'Back',
    'ach.unlocked': '✅',
    'ach.locked': '🔒',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.back': 'Back',
  },
};

function t(key, ...args) {
  const lang = I18N_TEXTS[currentLang] || I18N_TEXTS.zh;
  let text = lang[key] || I18N_TEXTS.zh[key] || key;
  args.forEach((arg, i) => {
    text = text.replace(`{${i}}`, arg);
  });
  return text;
}

function setLanguage(lang) {
  if (I18N_TEXTS[lang]) {
    currentLang = lang;
    try { localStorage.setItem(I18N_KEY, lang); } catch(e) {}
    applyI18n();
  }
}

function getLanguage() {
  return currentLang;
}

function loadLanguage() {
  try {
    const saved = localStorage.getItem(I18N_KEY);
    if (saved && I18N_TEXTS[saved]) currentLang = saved;
  } catch(e) {}
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.placeholder = t(key);
  });
}

function toggleLanguage() {
  setLanguage(currentLang === 'zh' ? 'en' : 'zh');
}

loadLanguage();
