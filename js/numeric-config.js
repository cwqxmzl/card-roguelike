/* card-roguelike — numeric-config module
   数值底层规则：把散落在卡牌、敌人、遗物业务代码里的魔法数字统一收拢。
   后续迭代调参只改本文件，不翻业务逻辑。
   经典 script 加载，共享全局作用域；在 data.js 之后、battle.js/mechanics.js 之前引入。 */

// ===================== 全局数值常量 =====================
const NumericConfig = {
  // 玩家基础属性
  PLAYER_BASE_HP: 70,        // 基准血量（职业 hp 以此为基准浮动）
  BASE_ENERGY: 3,            // 每回合基础能量
  MAX_ENERGY: 10,            // 能量上限（与 GAME_CONFIG.battle.maxMana 对齐）
  START_DRAW: 3,             // 首回合抽牌基数（不含遗物加成）
  CARDS_PER_TURN: 5,         // 每回合抽牌参考值（用于提示/文档口径）

  // 敌人难度缩放（每幕/每层倍率）
  ENEMY_HP_SCALE: 1.15,      // 每层敌人血量倍率
  ENEMY_ATK_SCALE: 1.08,     // 每层敌人攻击倍率

  // 稀有度权重（战斗奖励选卡池出现概率，后续接入权重抽取）
  WEIGHT_NORMAL: 0.67,
  WEIGHT_RARE: 0.25,
  WEIGHT_EPIC: 0.08,

  // 状态效果倍率（与第15轮统一状态系统保持一致）
  VULNERABLE_MULTI: 1.5,     // 易伤：受到伤害 +50%
  WEAK_MULTI: 0.5,           // 虚弱：造成伤害 -50%
  POISON_DMG_PER_STACK: 1,   // 每层中毒每回合伤害

  // 数值防护（防崩坏）
  MAX_STATUS_STACK: 20,      // 状态层数上限，防止无限叠加
  MAX_DAMAGE: 999,           // 单次伤害兜底，防止 bug 打出上亿伤害

  // 卡牌升级增量（统一升级规则）
  UPGRADE_ATK_BONUS: 4,      // 攻击卡升级伤害 +4
  UPGRADE_BLOCK_BONUS: 3,    // 防御卡升级护甲 +3

  // 经济基准（与 GAME_CONFIG.shop 对齐，供参考与扩展）
  PRICE_CARD_NORMAL: 15,
  PRICE_CARD_RARE: 30,
  PRICE_REMOVE_CARD: 60,

  // 升级增量（统一升级规则：events.js upgradeCard）
  MINION_UPGRADE_ATK: 1,      // 随从升级攻击 +1
  MINION_UPGRADE_HP: 1,       // 随从升级生命 +1
  WEAPON_UPGRADE_ATK: 1,      // 武器升级攻击 +1
  WEAPON_UPGRADE_DUR: 1,      // 武器升级耐久 +1

  // 存档数值快照：本局锁定的数值版本，防止跨版本更新篡改进行中的对局
  SAVE_VERSION: 17,
  NUMERIC_VERSION: 17,
};

// ===================== 统一计算函数 =====================

// 敌人属性按幕/层缩放：hp = baseHp * ENEMY_HP_SCALE^act，atk = baseAtk * ENEMY_ATK_SCALE^act
// 新敌人只写基础面板，运行时调用本函数生成实例，避免业务里写死倍率。
function scaleEnemyStats(baseHp, baseAtk, act) {
  return {
    hp: Math.round(baseHp * Math.pow(NumericConfig.ENEMY_HP_SCALE, act)),
    atk: Math.round(baseAtk * Math.pow(NumericConfig.ENEMY_ATK_SCALE, act)),
  };
}

// 状态层数钳位：防无限叠加（力量/中毒/易伤等统一走此上限）
function clampStatusStack(stacks) {
  return Math.min(Math.max(0, stacks | 0), NumericConfig.MAX_STATUS_STACK);
}

// 伤害兜底：防溢出/负值
function clampDamage(dmg) {
  return Math.max(0, Math.min(Math.round(dmg), NumericConfig.MAX_DAMAGE));
}

// 提取当前数值快照（只含数值字段，不含函数）
function getNumericSnapshot() {
  const s = {};
  for (const k in NumericConfig) {
    if (typeof NumericConfig[k] === 'number') s[k] = NumericConfig[k];
  }
  return s;
}

// 从存档恢复本局数值快照（老对局保持老值；缺快照则保持当前配置）
function restoreNumericSnapshot(snap) {
  if (snap && typeof snap === 'object') {
    for (const k in snap) {
      if (typeof NumericConfig[k] === 'number' && typeof snap[k] === 'number') {
        NumericConfig[k] = snap[k];
      }
    }
  }
}

// 统一攻击伤害计算（与 dealDamage 配合的可选入口）
// 返回经力量/虚弱/易伤修正后的数值；实际扣血仍走 dealDamage（统一处理护甲与死亡中断）
function calcAttackDamage(attacker, target, baseDmg) {
  let dmg = baseDmg;
  if (typeof hasStatus === 'function') {
    if (hasStatus(attacker, 'strength')) dmg += attacker.states.strength.stacks;
    if (hasStatus(attacker, 'weak')) dmg = dmg * NumericConfig.WEAK_MULTI;
    if (hasStatus(target, 'vulnerable')) dmg = dmg * NumericConfig.VULNERABLE_MULTI;
  }
  return clampDamage(dmg);
}
