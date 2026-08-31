/* card-roguelike — data module
   Split from card_roguelike.html inline <script> for maintainability.
   Classic script loaded via <script src>; shares global scope with siblings. */

// ===================== GAME BALANCE CONFIG =====================
// Centralized tunable values. Edit here, not scattered across modules.
const GAME_CONFIG = {
  shop: {
    cardPrices: { common: 15, rare: 30, epic: 50, legendary: 80 },
    relicPriceBase: 40,
    relicPriceRange: 30,
    healCost: 20,
    discoverCost: 40,
    rerollBaseCost: 10,
    rerollIncrement: 5,
    removeCardCost: 60,
  },
  rest: {
    healPercent: 0.3,
  },
  battle: {
    maxMinions: 7,
    maxMana: 10,
    maxHandSize: 10,
    battleLogLimit: 60,
  },
  boss: {
    enrageHpThreshold: 0.5,
  },
};

// ===================== GAME DATA =====================
const CARD_POOL = [
  // --- Commons ---
  { id: 'wisp', name: '小精灵', cost: 1, type: 'minion', attack: 1, hp: 1, rarity: 'common', art: '🧚', text: '' },
  { id: 'vampire_bat', name: '吸血蝙蝠', cost: 1, type: 'minion', attack: 1, hp: 2, rarity: 'common', art: '🦇', text: '吸血', lifesteal: true },
  { id: 'guardsman', name: '侍从卫兵', cost: 1, type: 'minion', attack: 1, hp: 2, rarity: 'common', art: '🛡️', text: '嘲讽', taunt: true },
  { id: 'stone_golem', name: '石像鬼', cost: 2, type: 'minion', attack: 1, hp: 4, rarity: 'common', art: '🗿', text: '嘲讽', taunt: true },
  { id: 'blood_imp', name: '血色小鬼', cost: 1, type: 'minion', attack: 2, hp: 1, rarity: 'common', art: '😈', text: '亡语：对敌方英雄造成1点伤害', deathrattle: 'deal_face_1' },
  { id: 'murloc', name: '鱼人战士', cost: 2, type: 'minion', attack: 2, hp: 2, rarity: 'common', art: '🐟', text: '', race: 'beast' },
  { id: 'poison_snake', name: '剧毒蛇', cost: 2, type: 'minion', attack: 2, hp: 1, rarity: 'common', art: '🐍', text: '剧毒', poisonous: true, race: 'beast' },
  { id: 'archer', name: '精灵弓手', cost: 2, type: 'minion', attack: 2, hp: 2, rarity: 'common', art: '🏹', text: '战吼：造成1点伤害', battlecry: 'deal_1' },
  { id: 'healer', name: '圣光侍僧', cost: 2, type: 'minion', attack: 1, hp: 3, rarity: 'common', art: '✝️', text: '战吼：恢复3点生命', battlecry: 'heal_3' },
  { id: 'wolf', name: '森林狼', cost: 2, type: 'minion', attack: 3, hp: 2, rarity: 'common', art: '🐺', text: '', race: 'beast' },
  { id: 'shield_bearer', name: '持盾者', cost: 3, type: 'minion', attack: 0, hp: 6, rarity: 'common', art: '🛡️', text: '嘲讽', taunt: true },
  { id: 'orc_grunt', name: '兽人步兵', cost: 3, type: 'minion', attack: 3, hp: 3, rarity: 'common', art: '👹', text: '' },
  { id: 'card_drawer', name: '秘法师', cost: 3, type: 'minion', attack: 2, hp: 2, rarity: 'common', art: '📜', text: '战吼：抽一张牌', battlecry: 'draw_1' },
  { id: 'berserker', name: '狂战士', cost: 3, type: 'minion', attack: 4, hp: 2, rarity: 'common', art: '🪓', text: '' },
  { id: 'freeze_elem', name: '冰霜元素', cost: 4, type: 'minion', attack: 3, hp: 5, rarity: 'common', art: '❄️', text: '战吼：冻结一个敌方随从', battlecry: 'freeze_enemy' },
  { id: 'ogre', name: '食人魔', cost: 4, type: 'minion', attack: 4, hp: 4, rarity: 'common', art: '👺', text: '' },
  { id: 'paladin_knight', name: '圣骑士', cost: 4, type: 'minion', attack: 3, hp: 4, rarity: 'common', art: '⚔️', text: '圣盾', divineShield: true },
  { id: 'summoner', name: '召唤师', cost: 4, type: 'minion', attack: 2, hp: 3, rarity: 'common', art: '🔮', text: '亡语：召唤一个2/2随从', deathrattle: 'summon_2_2' },
  { id: 'war_golem', name: '战争魔像', cost: 7, type: 'minion', attack: 7, hp: 7, rarity: 'common', art: '🗿', text: '' },
  // Spells - Common
  { id: 'arcane_missiles', name: '奥术飞弹', cost: 2, type: 'spell', rarity: 'common', art: '✨', text: '随机对敌人造成3点伤害', effect: 'arcane_missiles' },
  { id: 'holy_light', name: '圣光术', cost: 2, type: 'spell', rarity: 'common', art: '🌟', text: '恢复5点生命', effect: 'heal_5' },
  { id: 'lightning_bolt', name: '闪电箭', cost: 2, type: 'spell', rarity: 'common', art: '⚡', text: '造成3点伤害', effect: 'deal_3_face' },
  { id: 'arcane_intellect', name: '奥术智慧', cost: 3, type: 'spell', rarity: 'common', art: '📖', text: '抽两张牌', effect: 'draw_2' },
  { id: 'fan_of_knives', name: '刀扇', cost: 3, type: 'spell', rarity: 'common', art: '🔪', text: '对所有敌方随从造成1点伤害，抽一张牌', effect: 'fan_of_knives' },
  { id: 'fireball', name: '火球术', cost: 4, type: 'spell', rarity: 'common', art: '🔥', text: '造成6点伤害', effect: 'deal_6_face' },
  { id: 'consecration', name: '奉献', cost: 4, type: 'spell', rarity: 'common', art: '☀️', text: '对所有敌方随从造成2点伤害', effect: 'consecration' },
  { id: 'polymorph', name: '变形术', cost: 4, type: 'spell', rarity: 'common', art: '🐑', text: '将一个随从变为1/1', effect: 'polymorph' },
  { id: 'blizzard', name: '暴风雪', cost: 6, type: 'spell', rarity: 'common', art: '🌨️', text: '对所有敌方随从造成2点伤害并冻结', effect: 'blizzard' },
  // Weapons
  { id: 'rusty_knife', name: '锈刃', cost: 1, type: 'weapon', attack: 1, durability: 3, rarity: 'common', art: '🗡️', text: '' },
  { id: 'war_hammer', name: '战锤', cost: 3, type: 'weapon', attack: 3, durability: 2, rarity: 'common', art: '🔨', text: '' },
  { id: 'flame_sword', name: '烈焰之剑', cost: 4, type: 'weapon', attack: 3, durability: 2, rarity: 'common', art: '⚔️', text: '战吼：造成1点伤害', battlecry: 'deal_1_face' },
  // --- Rares ---
  { id: 'charge_knight', name: '冲锋骑士', cost: 3, type: 'minion', attack: 3, hp: 2, rarity: 'rare', art: '🐴', text: '冲锋', charge: true },
  { id: 'windfury_harpy', name: '风怒鹰身人', cost: 4, type: 'minion', attack: 3, hp: 4, rarity: 'rare', art: '🦅', text: '风怒（可攻击两次）', windfury: true },
  { id: 'cultist', name: '邪教徒', cost: 3, type: 'minion', attack: 2, hp: 2, rarity: 'rare', art: '🪬', text: '亡语：使一个友方随从+2/+2', deathrattle: 'buff_friendly_2_2' },
  { id: 'spellblade', name: '法术之刃', cost: 2, type: 'minion', attack: 1, hp: 3, rarity: 'rare', art: '🌀', text: '法术伤害+1', spellDamage: 1 },
  { id: 'overload_lightning', name: '超载闪电', cost: 2, type: 'spell', rarity: 'common', art: '⚡', text: '造成3点伤害，过载1', effect: 'deal_3_face', overload: 1 },
  { id: 'overload_missiles', name: '过载飞弹', cost: 1, type: 'spell', rarity: 'common', art: '✨', text: '随机对敌人造成3点伤害，过载1', effect: 'arcane_missiles', overload: 1 },
  { id: 'overload_wolf', name: '过载狼骑', cost: 3, type: 'minion', attack: 4, hp: 3, rarity: 'rare', art: '🐺', text: '过载1', overload: 1, race: 'beast' },
  { id: 'vampire_lord', name: '吸血鬼领主', cost: 3, type: 'minion', attack: 3, hp: 3, rarity: 'rare', art: '🧛', text: '吸血', lifesteal: true },
  { id: 'mirror_entity', name: '镜像实体', cost: 1, type: 'minion', attack: 0, hp: 2, rarity: 'rare', art: '🪞', text: '嘲讽·亡语：召唤一个0/2嘲讽', taunt: true, deathrattle: 'summon_0_2_taunt' },
  { id: 'plague_toad', name: '瘟疫蟾蜍', cost: 3, type: 'minion', attack: 2, hp: 3, rarity: 'rare', art: '🐸', text: '剧毒', poisonous: true, race: 'beast' },
  // Rare Spells
  { id: 'flamestrike', name: '烈焰风暴', cost: 5, type: 'spell', rarity: 'rare', art: '🌋', text: '对所有敌方随从造成4点伤害', effect: 'flamestrike' },
  { id: 'assassinate', name: '刺杀', cost: 5, type: 'spell', rarity: 'rare', art: '🗡️', text: '消灭一个敌方随从', effect: 'assassinate' },
  { id: 'circle_healing', name: '群体治疗', cost: 4, type: 'spell', rarity: 'rare', art: '💫', text: '恢复所有友方随从2点生命，英雄恢复4点', effect: 'mass_heal' },
  { id: 'lightning_storm', name: '闪电风暴', cost: 4, type: 'spell', rarity: 'rare', art: '⛈️', text: '对所有敌方随从造成3点伤害', effect: 'deal_3_all' },
  // Rare Weapons
  { id: 'doom_blade', name: '末日之刃', cost: 5, type: 'weapon', attack: 5, durability: 2, rarity: 'rare', art: '🌑', text: '亡语：对敌方英雄造成3点伤害' },
  // --- Epics ---
  { id: 'water_elemental', name: '水元素', cost: 4, type: 'minion', attack: 3, hp: 6, rarity: 'epic', art: '💧', text: '冻结被此随从伤害的角色', freezeOnHit: true },
  { id: 'death_stalker', name: '死亡猎手', cost: 4, type: 'minion', attack: 4, hp: 2, rarity: 'epic', art: '☠️', text: '剧毒', poisonous: true },
  { id: 'giant', name: '山地巨人', cost: 6, type: 'minion', attack: 7, hp: 7, rarity: 'epic', art: '🦣', text: '' },
  { id: 'dragon', name: '暮光龙', cost: 5, type: 'minion', attack: 5, hp: 5, rarity: 'epic', art: '🐉', text: '战吼：若手牌有龙牌则获得+1/+1', battlecry: 'dragon_buff' },
  { id: 'undead_knight', name: '亡灵骑士', cost: 5, type: 'minion', attack: 4, hp: 4, rarity: 'epic', art: '💀', text: '亡语：召唤一个4/4亡灵', deathrattle: 'summon_4_4' },
  // Epic Spells
  { id: 'pyroblast', name: '炎爆术', cost: 8, type: 'spell', rarity: 'epic', art: '☄️', text: '造成10点伤害', effect: 'deal_10_face' },
  { id: 'mind_control', name: '精神控制', cost: 6, type: 'spell', rarity: 'epic', art: '🧠', text: '获得一个敌方随从的控制权', effect: 'mind_control' },
  { id: 'equality', name: '生而平等', cost: 3, type: 'spell', rarity: 'epic', art: '⚖️', text: '将所有随从的生命值变为1', effect: 'equality' },
  // --- Legendaries ---
  { id: 'ragnaros', name: '炎魔之王', cost: 8, type: 'minion', attack: 8, hp: 8, rarity: 'legendary', art: '🔥', artImg: 'assets/card-ragnaros.jpg', text: '冲锋·回合结束时对随机敌人造成8点伤害', charge: true, endTurn: 'rag_damage' },
  { id: 'sylvanas', name: '黑暗女王', cost: 5, type: 'minion', attack: 5, hp: 4, rarity: 'legendary', art: '👸', artImg: 'assets/card-sylvanas.jpg', text: '亡语：获得一个敌方随从的控制权', deathrattle: 'mind_control_random' },
  { id: 'deathwing', name: '死亡之翼', cost: 10, type: 'minion', attack: 12, hp: 12, rarity: 'legendary', art: '🐲', artImg: 'assets/card-deathwing.jpg', text: '战吼：消灭所有其他随从，弃掉手牌', battlecry: 'deathwing' },
  { id: 'loot_hoarder', name: '藏宝地精', cost: 2, type: 'minion', attack: 2, hp: 1, rarity: 'rare', art: '💰', text: '亡语：抽一张牌', deathrattle: 'draw_1_owner' },
  { id: 'faceless', name: '无面操纵者', cost: 6, type: 'minion', attack: 5, hp: 5, rarity: 'epic', art: '🎭', text: '战吼：变成一个友方随从的复制', battlecry: 'faceless_copy' },
  // --- Class Legendaries ---
  { id: 'arcane_wyrm', name: '奥术巨龙', cost: 7, type: 'minion', attack: 7, hp: 7, rarity: 'legendary', art: '🐉', artImg: 'assets/card-arcane-wyrm.jpg', text: '战吼：对所有敌方随从造成3点伤害', battlecry: 'deal_3_all' },
  { id: 'iron_bastion', name: '钢铁堡垒', cost: 6, type: 'minion', attack: 6, hp: 8, rarity: 'legendary', art: '🏰', artImg: 'assets/card-iron-bastion.jpg', text: '嘲讽·战吼：获得5点护甲', taunt: true, battlecry: 'gain_armor_5' },
  { id: 'storm_falcon', name: '风暴猎鹰', cost: 5, type: 'minion', attack: 4, hp: 3, rarity: 'legendary', art: '🦅', artImg: 'assets/card-storm-falcon.jpg', text: '冲锋·风怒', charge: true, windfury: true },
  { id: 'lightbringer', name: '光明使者', cost: 7, type: 'minion', attack: 7, hp: 7, rarity: 'legendary', art: '🕊️', text: '战吼：使所有友方随从+2/+2', battlecry: 'buff_all_2_2' },
  // --- Priest ---
  { id: 'holy_smite', name: '圣光惩击', cost: 2, type: 'spell', rarity: 'common', art: '✨', text: '对任意目标造成3点伤害', effect: 'smite' },
  { id: 'power_word_shield', name: '真言术·盾', cost: 1, type: 'spell', rarity: 'common', art: '🛡️', text: '使一个友方随从+2/+2，抽一张牌', effect: 'pw_shield' },
  { id: 'northshire', name: '北郡牧师', cost: 1, type: 'minion', attack: 1, hp: 2, rarity: 'common', art: '⛪', text: '战吼：抽一张牌', battlecry: 'draw_1' },
  { id: 'soul_purify', name: '灵魂净化', cost: 3, type: 'spell', rarity: 'common', art: '🌑', text: '对所有敌方随从造成2点伤害', effect: 'consecration' },
  { id: 'holy_nova', name: '神圣新星', cost: 4, type: 'spell', rarity: 'rare', art: '🌟', text: '对所有敌人造成2点伤害，恢复所有友方角色2点生命', effect: 'holy_nova' },
  { id: 'holy_fire', name: '神圣之火', cost: 5, type: 'spell', rarity: 'rare', art: '🔥', text: '对任意目标造成5点伤害，恢复你5点生命', effect: 'holy_fire' },
  { id: 'light_pope', name: '光明大祭司', cost: 7, type: 'minion', attack: 7, hp: 8, rarity: 'legendary', art: '🕯️', text: '战吼：恢复6点生命', battlecry: 'heal_6' },
  // --- New Cards (Balance Expansion) ---
  { id: 'scout', name: '斥候', cost: 1, type: 'minion', attack: 1, hp: 1, rarity: 'common', art: '🔭', text: '战吼：抽一张牌', battlecry: 'draw_1' },
  { id: 'torch_bearer', name: '持炬者', cost: 2, type: 'minion', attack: 2, hp: 3, rarity: 'common', art: '🔥', text: '战吼：造成1点伤害', battlecry: 'deal_1' },
  { id: 'voodoo_doctor', name: '巫医', cost: 2, type: 'minion', attack: 2, hp: 2, rarity: 'common', art: '🪬', text: '战吼：恢复3点生命', battlecry: 'heal_3' },
  { id: 'mana_wraith', name: '法力怨灵', cost: 2, type: 'minion', attack: 2, hp: 2, rarity: 'common', art: '👻', text: '法术伤害+1', spellDamage: 1 },
  { id: 'armored_knight', name: '重甲骑士', cost: 3, type: 'minion', attack: 2, hp: 4, rarity: 'common', art: '🛡️', text: '嘲讽', taunt: true },
  { id: 'battle_axe', name: '战斧', cost: 2, type: 'weapon', attack: 2, durability: 2, rarity: 'common', art: '🪓', text: '' },
  { id: 'magic_missile', name: '魔法飞弹', cost: 1, type: 'spell', rarity: 'common', art: '✨', text: '造成1点伤害', effect: 'deal_1' },
  { id: 'boulderfist_ogre', name: '石拳食人魔', cost: 5, type: 'minion', attack: 6, hp: 7, rarity: 'rare', art: '👹', text: '' },
  { id: 'spellbreaker', name: '战斗法师', cost: 4, type: 'minion', attack: 4, hp: 3, rarity: 'rare', art: '🔮', text: '战吼：造成1点伤害', battlecry: 'deal_1' },
  { id: 'argent_commander', name: '银色指挥官', cost: 5, type: 'minion', attack: 4, hp: 3, rarity: 'rare', art: '⚔️', text: '冲锋·圣盾', charge: true, divineShield: true },
  { id: 'guardian_king', name: '守卫之王', cost: 6, type: 'minion', attack: 4, hp: 8, rarity: 'rare', art: '👑', text: '嘲讽', taunt: true },
  { id: 'ancient_warrior', name: '远古战士', cost: 7, type: 'minion', attack: 7, hp: 8, rarity: 'epic', art: '🗿', text: '' },
  { id: 'archmage', name: '大法师', cost: 6, type: 'minion', attack: 4, hp: 7, rarity: 'epic', art: '🧙', text: '法术伤害+2', spellDamage: 2 },
  // Class-specific
  { id: 'frostwolf_grunt', name: '霜狼步兵', cost: 3, type: 'minion', attack: 3, hp: 4, rarity: 'common', art: '🐺', text: '战吼：获得3点护甲', battlecry: 'gain_armor_3' },
  { id: 'guardian_of_kings', name: '王者守卫', cost: 5, type: 'minion', attack: 5, hp: 5, rarity: 'rare', art: '🛡️', text: '战吼：恢复4点生命', battlecry: 'heal_4' },
  { id: 'tundra_rhino', name: '苔原犀牛', cost: 4, type: 'minion', attack: 4, hp: 3, rarity: 'common', art: '🦏', text: '冲锋', charge: true, race: 'beast' },
];

// ===================== CLASS DEFINITIONS =====================
const CLASSES = {
  mage: {
    name: '法师', portrait: '🧙', portraitImg: 'assets/portrait-mage.jpg', color: '#4169E1', hp: 30,
    heroPower: { name: '火焰冲击', cost: 2, type: 'mage', description: '对任意目标造成1点伤害' },
    starterDeck: ['guardsman','stone_golem','archer','healer','card_drawer','arcane_missiles','holy_light','lightning_bolt','fireball','arcane_intellect'],
    cardPool: ['arcane_missiles','fireball','blizzard','flamestrike','pyroblast','polymorph','arcane_intellect','spellblade','water_elemental','mirror_entity','freeze_elem','card_drawer','healer','stone_golem','lightning_bolt','arcane_wyrm','scout','torch_bearer','voodoo_doctor','mana_wraith','armored_knight','battle_axe','magic_missile','boulderfist_ogre','spellbreaker','argent_commander','guardian_king','ancient_warrior','archmage'],
    signature: 'spell_power_1',
  },
  warrior: {
    name: '战士', portrait: '⚔️', portraitImg: 'assets/portrait-warrior.jpg', color: '#B22222', hp: 30,
    heroPower: { name: '全副武装', cost: 2, type: 'warrior', description: '获得2点护甲' },
    starterDeck: ['guardsman','stone_golem','orc_grunt','berserker','wolf','war_hammer','rusty_knife','healer','shield_bearer','ogre'],
    cardPool: ['war_hammer','flame_sword','doom_blade','shield_bearer','ogre','war_golem','berserker','orc_grunt','guardsman','stone_golem','undead_knight','cultist','iron_bastion','frostwolf_grunt','scout','torch_bearer','voodoo_doctor','mana_wraith','armored_knight','battle_axe','magic_missile','boulderfist_ogre','spellbreaker','argent_commander','guardian_king','ancient_warrior','archmage'],
    signature: 'armor_start',
  },
  hunter: {
    name: '猎人', portrait: '🏹', portraitImg: 'assets/portrait-hunter.jpg', color: '#228B22', hp: 30,
    heroPower: { name: '稳固射击', cost: 2, type: 'hunter', description: '对敌方英雄造成2点伤害' },
    starterDeck: ['wolf','murloc','archer','blood_imp','charge_knight','lightning_bolt','rusty_knife','berserker','ogre','fan_of_knives'],
    cardPool: ['wolf','murloc','archer','charge_knight','windfury_harpy','blood_imp','fan_of_knives','lightning_bolt','berserker','ogre','sylvanas','loot_hoarder','storm_falcon','tundra_rhino','scout','torch_bearer','voodoo_doctor','mana_wraith','armored_knight','battle_axe','magic_missile','boulderfist_ogre','spellbreaker','argent_commander','guardian_king','ancient_warrior','archmage'],
    signature: 'beast_master',
  },
  paladin: {
    name: '圣骑士', portrait: '🛡️', portraitImg: 'assets/portrait-paladin.jpg', color: '#FFD700', hp: 30,
    heroPower: { name: '援军', cost: 2, type: 'paladin', description: '召唤一个1/1白银之手新兵' },
    starterDeck: ['guardsman','stone_golem','healer','paladin_knight','shield_bearer','holy_light','consecration','archer','card_drawer','wolf'],
    cardPool: ['paladin_knight','healer','holy_light','consecration','shield_bearer','guardsman','equality','circle_healing','stone_golem','archer','card_drawer','sylvanas','lightbringer','guardian_of_kings','scout','torch_bearer','voodoo_doctor','mana_wraith','armored_knight','battle_axe','magic_missile','boulderfist_ogre','spellbreaker','argent_commander','guardian_king','ancient_warrior','archmage'],
    signature: 'divine_protection',
  },
  priest: {
    name: '牧师', portrait: '🙏', portraitImg: 'assets/portrait-priest.jpg', color: '#9370DB', hp: 32,
    heroPower: { name: '次级治疗', cost: 2, type: 'priest', description: '恢复任意目标2点生命' },
    starterDeck: ['guardsman','stone_golem','northshire','northshire','healer','holy_smite','soul_purify','power_word_shield','circle_healing','card_drawer'],
    cardPool: ['holy_smite','power_word_shield','northshire','soul_purify','holy_nova','holy_fire','circle_healing','healer','light_pope','holy_light','guardsman','stone_golem','card_drawer','sylvanas','lightbringer','scout','torch_bearer','voodoo_doctor','mana_wraith','armored_knight','battle_axe','magic_missile','boulderfist_ogre','spellbreaker','argent_commander','guardian_king','ancient_warrior','archmage'],
    signature: 'light_well',
  },
  warlock: {
    name: '术士', portrait: '😈', portraitImg: 'assets/portrait-warlock.jpg', color: '#8B008B', hp: 30,
    heroPower: { name: '生命分流', cost: 2, type: 'warlock', description: '受到2点伤害，抽一张牌' },
    starterDeck: ['blood_imp','guardsman','stone_golem','murloc','archer','lightning_bolt','holy_light','fan_of_knives','berserker','ogre'],
    cardPool: ['blood_imp','death_stalker','undead_knight','cultist','sylvanas','deathwing','mind_control','faceless','lightning_bolt','fan_of_knives','berserker','ogre','wolf','murloc','scout','torch_bearer','voodoo_doctor','mana_wraith','armored_knight','battle_axe','magic_missile','boulderfist_ogre','spellbreaker','argent_commander','guardian_king','ancient_warrior','archmage'],
    signature: 'regen',
  },
};

// ===================== PASSIVE TREASURES (RELICS) =====================
const PASSIVE_TREASURES = [
  { id: 'plus_1_1', name: '强化水晶', description: '你的所有随从获得+1/+1', icon: '💎', effect: 'plus_1_1' },
  { id: 'spell_cost_1', name: '法术聚焦', description: '你的法术牌费用-1（不低于1）', icon: '🔮', effect: 'spell_cost_1' },
  { id: 'extra_draw', name: '洞察之眼', description: '每场战斗开始多抽1张牌', icon: '👁️', effect: 'extra_draw' },
  { id: 'regen', name: '再生之力', description: '每回合结束时恢复1点生命', icon: '💚', effect: 'regen' },
  { id: 'thorns', name: '荆棘之甲', description: '受到伤害时对攻击者造成1点伤害', icon: '🌵', effect: 'thorns' },
  { id: 'fire_aura', name: '灼热光环', description: '回合结束时对敌方造成1点伤害', icon: '🔥', effect: 'fire_aura' },
  { id: 'double_gold', name: '贪婪之戒', description: '战斗胜利获得的金币翻倍', icon: '💍', effect: 'double_gold' },
  { id: 'armor_start', name: '坚甲护盾', description: '每场战斗开始获得3点护甲', icon: '🛡️', effect: 'armor_start' },
  { id: 'spell_power_1', name: '法术强化', description: '法术伤害+1', icon: '✨', effect: 'spell_power' },
  { id: 'extra_mana_start', name: '法力宝石', description: '第一回合获得1个额外法力', icon: '🔷', effect: 'extra_mana_start' },
  { id: 'beast_master', name: '驯兽师', description: '你的野兽随从获得+1/+1', icon: '🐾', effect: 'beast_master' },
  { id: 'divine_protection', name: '圣光护体', description: '你的随从出场时获得圣盾', icon: '😇', effect: 'divine_protection' },
  { id: 'double_battlecry', name: '战吼回响', description: '战吼效果触发两次', icon: '🔄', effect: 'double_battlecry' },
  { id: 'cost_reduction', name: '廉价令牌', description: '所有手牌费用-1（不低于1）', icon: '🏷️', effect: 'cost_reduction' },
  { id: 'light_well', name: '神圣之泉', description: '回合结束时，你恢复2点生命', icon: '☀️', effect: 'light_well' },
];

// ===================== ACTIVE TREASURE CARDS =====================
const ACTIVE_TREASURES = [
  { id: 'treasure_sword', name: '宝藏之剑', cost: 3, type: 'weapon', attack: 4, durability: 3, rarity: 'legendary', art: '⚔️', text: '超模武器' },
  { id: 'treasure_shield', name: '宝藏之盾', cost: 3, type: 'minion', attack: 0, hp: 8, rarity: 'legendary', art: '🛡️', text: '嘲讽·圣盾', taunt: true, divineShield: true },
  { id: 'treasure_blast', name: '宝藏冲击', cost: 3, type: 'spell', rarity: 'legendary', art: '💥', text: '造成5点伤害，抽一张牌', effect: 'deal_5_draw_1' },
  { id: 'treasure_summon', name: '召唤法典', cost: 4, type: 'spell', rarity: 'legendary', art: '📜', text: '召唤两个3/3随从', effect: 'summon_two_3_3' },
  { id: 'treasure_mind', name: '意志宝石', cost: 3, type: 'spell', rarity: 'legendary', art: '🧠', text: '获得一个敌方随从的控制权', effect: 'mind_control' },
  { id: 'treasure_heal', name: '生命之泉', cost: 1, type: 'spell', rarity: 'legendary', art: '💧', text: '恢复8点生命', effect: 'heal_8' },
  { id: 'treasure_inferno', name: '地狱火', cost: 3, type: 'spell', rarity: 'legendary', art: '🌋', text: '对所有敌方随从造成3点伤害', effect: 'deal_3_all' },
  { id: 'treasure_insight', name: '洞察卷轴', cost: 1, type: 'spell', rarity: 'legendary', art: '📜', text: '抽三张牌', effect: 'draw_3' },
  { id: 'treasure_ironbark', name: '铁树皮术', cost: 2, type: 'spell', rarity: 'legendary', art: '🌳', text: '获得8点护甲', effect: 'gain_armor_8' },
  { id: 'treasure_warcry', name: '战吼号角', cost: 3, type: 'spell', rarity: 'legendary', art: '📯', text: '使所有友方随从+2/+2', effect: 'buff_all_2_2' },
  { id: 'treasure_frost_nova', name: '冰霜新星', cost: 2, type: 'spell', rarity: 'legendary', art: '❄️', text: '冻结所有敌方随从', effect: 'freeze_all' },
  { id: 'treasure_bolt', name: '天界惊雷', cost: 2, type: 'spell', rarity: 'legendary', art: '⚡', text: '造成5点伤害', effect: 'deal_5' },
];

const ENEMIES = {
  normal: [
    { name: '森林哥布林', portrait: '👺', hp: 28, deck: ['murloc','wolf','orc_grunt','berserker','war_hammer','lightning_bolt','healer','stone_golem','blood_imp','ogre'], ai: 'aggressive' },
    { name: '亡灵术士', portrait: '💀', hp: 30, deck: ['blood_imp','summoner','cultist','mirror_entity','undead_knight','assassinate','card_drawer','berserker','shield_bearer','wolf'], ai: 'control' },
    { name: '兽人战狂', portrait: '👹', hp: 32, deck: ['orc_grunt','berserker','war_hammer','ogre','war_golem','wolf','guardsman','flame_sword','shield_bearer','fireball'], ai: 'aggressive' },
    { name: '暗影法师', portrait: '🧙', hp: 26, deck: ['arcane_missiles','lightning_bolt','arcane_intellect','fireball','consecration','flamestrike','spellblade','freeze_elem','polymorph','card_drawer'], ai: 'spell' },
    { name: '鱼人领袖', portrait: '🐟', hp: 28, deck: ['murloc','murloc','wolf','archer','fan_of_knives','berserker','healer','charge_knight','lightning_bolt','ogre'], ai: 'aggressive' },
    { name: '黑骑士', portrait: '🛡️', hp: 30, deck: ['guardsman','stone_golem','shield_bearer','paladin_knight','war_hammer','flame_sword','healer','doom_blade','ogre','cultist'], ai: 'control' },
    { name: '治疗德鲁伊', portrait: '🌿', hp: 30, deck: ['healer','holy_light','circle_healing','guardian_of_kings','stone_golem','guardsman','armored_knight','shield_bearer','holy_nova','soul_purify'], ai: 'control' },
    { name: '武器战狂', portrait: '⚔️', hp: 28, deck: ['war_hammer','flame_sword','battle_axe','rusty_knife','orc_grunt','berserker','wolf','frostwolf_grunt','guardsman','lightning_bolt'], ai: 'aggressive' },
    { name: '鱼人潮行者', portrait: '🐟', hp: 26, deck: ['murloc','murloc','scout','blood_imp','wolf','archer','charge_knight','tundra_rhino','fan_of_knives','lightning_bolt'], ai: 'aggressive' },
    { name: '冰霜法师', portrait: '❄️', hp: 28, deck: ['freeze_elem','water_elemental','blizzard','polymorph','arcane_missiles','fireball','arcane_intellect','spellblade','mana_wraith','card_drawer'], ai: 'spell' },
    { name: '亡语牧师', portrait: '💀', hp: 32, deck: ['blood_imp','summoner','cultist','undead_knight','loot_hoarder','sylvanas','mirror_entity','shield_bearer','assassinate','circle_healing'], ai: 'control' },
    { name: '快攻猎人', portrait: '🏹', hp: 26, deck: ['wolf','murloc','tundra_rhino','charge_knight','blood_imp','berserker','windfury_harpy','storm_falcon','lightning_bolt','rusty_knife'], ai: 'aggressive' },
  ],
  elite: [
    { name: '石拳巨魔', portrait: '🧌', hp: 40, deck: ['ogre','war_golem','berserker','war_hammer','doom_blade','shield_bearer','stone_golem','giant','undead_knight','fireball'], ai: 'aggressive' },
    { name: '龙裔术士', portrait: '🐲', hp: 38, deck: ['dragon','pyroblast','flamestrike','mind_control','spellblade','freeze_elem','arcane_intellect','equality','water_elemental','fireball'], ai: 'spell' },
    { name: '死亡领主', portrait: '⚰️', hp: 42, deck: ['undead_knight','sylvanas','cultist','summoner','mirror_entity','assassinate','mind_control','shield_bearer','deathwing','loot_hoarder'], ai: 'control' },
    { name: '风暴召唤者', portrait: '⛈️', hp: 36, deck: ['freeze_elem','lightning_storm','blizzard','water_elemental','arcane_missiles','lightning_bolt','spellblade','flamestrike','consecration','card_drawer'], ai: 'spell' },
    { name: '火焰领主', portrait: '🔥', hp: 44, deck: ['fireball','flamestrike','pyroblast','arcane_missiles','lightning_bolt','spellblade','mana_wraith','archmage','water_elemental','blizzard'], ai: 'spell' },
    { name: '钢铁守卫', portrait: '🛡️', hp: 48, deck: ['shield_bearer','stone_golem','guardsman','armored_knight','guardian_king','iron_bastion','war_golem','ancient_warrior','ogre','boulderfist_ogre'], ai: 'control' },
    { name: '虚空恐魔', portrait: '👹', hp: 42, deck: ['blood_imp','cultist','undead_knight','death_stalker','sylvanas','deathwing','mind_control','berserker','ogre','doom_blade'], ai: 'aggressive' },
  ],
  boss: [
    { name: '森林之王·古树', portrait: '🌳', hp: 50, deck: ['stone_golem','war_golem','shield_bearer','giant','undead_knight','healer','paladin_knight','summoner','ogre','flamestrike','consecration','cultist','ragnaros','guardsman'], ai: 'control', isBoss: true, act: 1, rewardRelic: true, enrage: { summons: [{ name: '古树守卫', attack: 3, hp: 3, art: '🌳', taunt: true }] } },
    { name: '暗影领主', portrait: '🦇', hp: 60, deck: ['sylvanas','mind_control','assassinate','undead_knight','cultist','summoner','mirror_entity','deathwing','loot_hoarder','flamestrike','blizzard','equality','doom_blade','ragnaros'], ai: 'control', isBoss: true, act: 2, rewardRelic: true, enrage: { buff: 2 } },
    { name: '裂境之主·虚空', portrait: '👁️', hp: 80, deck: ['ragnaros','deathwing','sylvanas','undead_knight','giant','dragon','pyroblast','mind_control','flamestrike','equality','assassinate','blizzard','doom_blade','water_elemental','faceless'], ai: 'boss', isBoss: true, act: 3, rewardRelic: true, enrage: { summons: [{ name: '虚空行者', attack: 4, hp: 4, art: '👁️' }], buff: 1 } },
  ]
};

const RELICS = [
  { id: 'extra_card', name: '占卜宝珠', icon: '🔮', desc: '每场战斗开始多抽1张牌', effect: 'extra_draw' },
  { id: 'thorns', name: '荆棘之甲', icon: '🌵', desc: '受到伤害时对攻击者造成1点伤害', effect: 'thorns' },
  { id: 'heal_turn', name: '再生之鳞', icon: '🟢', desc: '每回合恢复1点生命', effect: 'regen' },
  { id: 'extra_mana', name: '法力宝石', icon: '💎', desc: '每场战斗第1回合获得1个额外法力', effect: 'extra_mana_start' },
  { id: 'strength', name: '力量符文', icon: '💪', desc: '所有随从获得+1攻击力', effect: 'strength' },
  { id: 'vitality', name: '生命之心', icon: '❤️', desc: '最大生命值+10', effect: 'max_hp' },
  { id: 'coin_start', name: '幸运金币', icon: '🪙', desc: '每场战斗获得1枚幸运币(0费+1法力)', effect: 'coin_start' },
  { id: 'spell_power', name: '奥术之眼', icon: '👁️', desc: '法术伤害+1', effect: 'spell_power' },
  { id: 'double_gold', name: '贪婪之戒', icon: '💍', desc: '战斗胜利获得的金币翻倍', effect: 'double_gold' },
  { id: 'fire_aura', name: '灼热光环', icon: '🔥', desc: '回合结束时对敌方造成1点伤害', effect: 'fire_aura' },
  { id: 'battlecry_boost', name: '战吼勋章', icon: '📯', desc: '你的战吼随从获得+1/+1', effect: 'battlecry_boost' },
  { id: 'taunt_bulk', name: '嘲讽壁垒', icon: '🏰', desc: '你的嘲讽随从获得+0/+2', effect: 'taunt_bulk' },
  { id: 'divine_shield_attack', name: '圣盾之力', icon: '⚔️', desc: '你的圣盾随从+1攻击力', effect: 'divine_shield_attack' },
  { id: 'deathrattle_draw', name: '亡语之书', icon: '📖', desc: '你的随从死亡时，抽1张牌', effect: 'deathrattle_draw' },
  { id: 'first_play_discount', name: '先手优势', icon: '⚡', desc: '每回合第一张牌费用-1（不低于0）', effect: 'first_play_discount' },
  { id: 'minion_cost_1', name: '随从大师', icon: '🐉', desc: '你的随从牌费用-1（不低于1）', effect: 'minion_cost_1' },
];

// ===================== META PROGRESSION (局外肉鸽) =====================
const META_UPGRADES = [
  { id: 'max_hp', name: '生命强化', icon: '❤️', desc: '初始最大生命值+5', maxLevel: 5, costs: [3,6,9,12,15] },
  { id: 'start_gold', name: '初始金币', icon: '💰', desc: '初始金币+15', maxLevel: 3, costs: [4,8,12] },
  { id: 'start_armor', name: '初始护甲', icon: '🛡️', desc: '每场战斗开始+2护甲', maxLevel: 3, costs: [5,10,15] },
  { id: 'first_draw', name: '先手抽牌', icon: '🃏', desc: '第一回合多抽1张牌', maxLevel: 1, costs: [10] },
  { id: 'start_relic', name: '初始遗物', icon: '🎁', desc: '冒险开始获得1件随机遗物', maxLevel: 1, costs: [12] },
  { id: 'first_mana', name: '法力涌动', icon: '🔷', desc: '第一回合+1法力', maxLevel: 1, costs: [15] },
  { id: 'hero_power_discount', name: '英雄觉醒', icon: '⚡', desc: '英雄技能费用-1', maxLevel: 1, costs: [18] },
  { id: 'rare_luck', name: '幸运之触', icon: '🍀', desc: '稀有奖励概率+10%', maxLevel: 3, costs: [5,10,15] },
];

const STARTING_BONUSES = [
  { id: 'gold', name: '赏金令', icon: '💰', desc: '开始时获得30金币' },
  { id: 'hp', name: '生命精华', icon: '❤️', desc: '最大生命值+8' },
  { id: 'relic', name: '神秘遗物', icon: '🎁', desc: '获得1件随机遗物' },
  { id: 'rare_card', name: '稀有卡牌', icon: '🃏', desc: '牌组加入1张稀有卡' },
  { id: 'upgrade', name: '强化锤', icon: '⚒️', desc: '随机升级1张起始牌' },
  { id: 'armor', name: '护甲卷轴', icon: '🛡️', desc: '每场战斗开始+3护甲' },
  { id: 'draw', name: '洞察之眼', icon: '👁️', desc: '每场战斗第一回合多抽1张' },
  { id: 'mana', name: '法力核心', icon: '🔷', desc: '第一回合+1法力' },
];

const ACT_NAMES = ['第一幕 · 幽暗密林', '第二幕 · 暗影深渊', '第三幕 · 虚空裂境'];
const ACT_SUB = ['黑暗森林', '暗影深渊', '虚空裂境'];
const NODE_TYPES = {
  battle: { icon: '⚔️', label: '战斗', color: '#c0392b' },
  elite: { icon: '💀', label: '精英战', color: '#8e44ad' },
  shop: { icon: '💰', label: '商店', color: '#27ae60' },
  event: { icon: '❓', label: '事件', color: '#e67e22' },
  rest: { icon: '🍺', label: '酒馆', color: '#3498db' },
  treasure: { icon: '🎁', label: '宝箱', color: '#f1c40f' },
  boss: { icon: '👑', label: '首领', color: '#c0392b' },
};

const EVENTS = [
  {
    title: '神秘商人', act: 1,
    text: '一位披着斗篷的商人向你展示一瓶发光的药水。"50金币，这瓶药水能让你在冒险中恢复全部生命。" 他微笑道。',
    choices: [
      { text: '购买药水（花费50金币）', cond: g => g.gold >= 50, action: g => { g.gold -= 50; g.player.maxHp += 5; g.player.hp = g.player.maxHp; log('你喝下药水，全身焕然一新！最大生命值+5'); } },
      { text: '抢夺药水', cond: g => true, action: g => { const dmg = Math.floor(Math.random()*8)+5; g.player.hp -= dmg; log(`商人反击！你受到${dmg}点伤害`); g.gold += 30; log('但你抢到了30金币'); } },
      { text: '离开', cond: g => true, action: g => { log('你转身离去'); } },
    ]
  },
  {
    title: '受伤的旅人', act: 1,
    text: '路旁躺着一位受伤的旅人，他似乎快死了。你可以帮助他，或者搜刮他身上仅剩的财物。',
    choices: [
      { text: '为他疗伤（消耗5点生命）', cond: g => g.player.hp > 5, action: g => { g.player.hp -= 5; g.gold += 40; log('旅人紧紧握住你的手，塞给你40金币作为答谢'); } },
      { text: '搜刮他的财物', cond: g => true, action: g => { g.gold += 25; log('你从旅人身上翻出25金币，心中隐隐不安'); } },
      { text: '继续赶路', cond: g => true, action: g => { log('你不予理会，继续前行'); } },
    ]
  },
  {
    title: '远古祭坛', act: 3,
    text: '你发现了一座发光的远古祭坛。祭坛上刻着古老的符文，似乎可以通过献祭获得力量。',
    choices: [
      { text: '以血为祭（消耗8点生命，获得遗物）', cond: g => g.player.hp > 8, action: g => { g.player.hp -= 8; grantRelic(g); log('祭坛符文亮起刺目红光，一件遗物从虚空中浮现！'); } },
      { text: '献上金币（消耗40金币，升级一张牌）', cond: g => g.gold >= 40, action: g => { g.gold -= 40; g.pendingUpgrade = true; log('金币沉入祭坛，符文闪烁，选择一张卡牌接受祝福'); } },
      { text: '离开祭坛', cond: g => true, action: g => { log('你尊重古老的力量，转身离开'); } },
    ]
  },
  {
    title: '魔法泉眼', act: 1,
    text: '一股清澈的魔法泉水从地下涌出。饮用它可以恢复生命，但你也可以将其收集起来留待后用。',
    choices: [
      { text: '饮用泉水（恢复15点生命）', cond: g => true, action: g => { const heal = Math.min(15, g.player.maxHp - g.player.hp); g.player.hp += heal; log(`清凉的泉水流入体内，你恢复了${heal}点生命`); } },
      { text: '收集泉水（牌组加入2枚幸运币）', cond: g => true, action: g => { g.player.deck.push({ ...getCardData('the_coin'), uid: uid() }); g.player.deck.push({ ...getCardData('the_coin'), uid: uid() }); log('你将泉水灌入瓶中，获得2张幸运币'); } },
      { text: '两者都要（失去10金币）', cond: g => g.gold >= 10, action: g => { g.gold -= 10; const heal = Math.min(10, g.player.maxHp - g.player.hp); g.player.hp += heal; g.player.deck.push({ ...getCardData('the_coin'), uid: uid() }); log(`你恢复了${heal}点生命并获得1张幸运币`); } },
    ]
  },
  {
    title: '流浪的铁匠', act: 2,
    text: '一位流浪的铁匠提出可以强化你的武器（升级一张武器牌），或者你也可以花金币购买他的护甲。',
    choices: [
      { text: '强化武器（升级一张随机武器牌）', cond: g => g.player.deck.some(c => c.type === 'weapon'), action: g => { const weapons = g.player.deck.filter(c => c.type === 'weapon'); if (weapons.length) { const w = weapons[Math.floor(Math.random()*weapons.length)]; w.upgraded = true; w.attack = (w.attack||0)+1; w.durability = (w.durability||0)+1; log(`${w.name}被强化了！`); } } },
      { text: '购买护甲（消耗25金币，获得3点护甲）', cond: g => g.gold >= 25, action: g => { g.gold -= 25; g.player.armor += 3; log('铁匠为你披上一件坚固的护甲，获得3点护甲'); } },
      { text: '告别铁匠', cond: g => true, action: g => { log('你向铁匠道别'); } },
    ]
  },
  {
    title: '诅咒宝箱', act: 2,
    text: '你发现了一个散发着不祥气息的宝箱。直觉告诉你打开它会有代价，但里面可能有珍贵的东西...',
    choices: [
      { text: '强行开启（消耗6点生命，获得一张稀有卡牌）', cond: g => g.player.hp > 6, action: g => {
        g.player.hp -= 6;
        const pool = CARD_POOL.filter(c => c.rarity === 'rare' || c.rarity === 'epic');
        const card = pool[Math.floor(Math.random() * pool.length)];
        g.player.deck.push({ ...card, uid: uid() });
        log(`宝箱中被诅咒的 ${card.name} 加入了你的牌组`);
      } },
      { text: '解除诅咒（消耗30金币）', cond: g => g.gold >= 30, action: g => {
        g.gold -= 30;
        const pool = CARD_POOL.filter(c => c.rarity === 'rare' || c.rarity === 'epic');
        const card = pool[Math.floor(Math.random() * pool.length)];
        g.player.deck.push({ ...card, uid: uid() });
        log(`你安全地获取了 ${card.name}`);
      } },
      { text: '离开宝箱', cond: g => true, action: g => { log('你明智地离开了'); } },
    ]
  },
  {
    title: '许愿池', act: 2,
    text: '清澈的池水映出你的面容。传说向池中投入金币，愿望就会实现...',
    choices: [
      { text: '许愿力量（消耗25金币，随机升级一张牌）', cond: g => g.gold >= 25, action: g => {
        g.gold -= 25;
        const upgradable = g.player.deck.filter(c => !c.upgraded);
        if (upgradable.length > 0) {
          const card = upgradable[Math.floor(Math.random() * upgradable.length)];
          card.upgraded = true;
          if (card.type === 'minion') { card.attack = (card.attack||0)+1; card.hp = (card.hp||0)+1; }
          else if (card.type === 'spell' && card.cost > 0) card.cost = Math.max(0, card.cost - 1);
          else if (card.type === 'weapon') { card.attack = (card.attack||0)+1; card.durability = (card.durability||0)+1; }
          log(`${card.name} 被许愿池祝福！`);
        } else { log('没有可升级的卡牌，金币沉入池底...'); }
      } },
      { text: '许愿财富（消耗10金币，获得随机宝物）', cond: g => g.gold >= 10, action: g => {
        g.gold -= 10;
        g.gold += Math.floor(Math.random() * 40) + 15;
        log('池水泛起金光，你获得了金币！');
      } },
      { text: '许愿健康（消耗15金币，恢复20点生命）', cond: g => g.gold >= 15, action: g => {
        g.gold -= 15;
        const heal = Math.min(20, g.player.maxHp - g.player.hp);
        g.player.hp += heal;
        log(`你恢复了${heal}点生命`);
      } },
      { text: '离开', cond: g => true, action: g => { log('你离开了许愿池'); } },
    ]
  },
  {
    title: '黑暗交易', act: 2,
    text: '一个戴着兜衫的神秘人低声说："我可以给你力量，但你必须付出代价..."',
    choices: [
      { text: '交换生命（失去10生命，获得一个遗物）', cond: g => g.player.hp > 10, action: g => {
        g.player.hp -= 10;
        grantRelic(g);
        log('黑暗的力量涌入，你获得了一件遗物');
      } },
      { text: '交换卡牌（删除3张牌，获得2张稀有牌）', cond: g => g.player.deck.length > 3, action: g => {
        for (let i = 0; i < 3; i++) g.player.deck.pop();
        const pool = CARD_POOL.filter(c => c.rarity === 'rare' || c.rarity === 'epic');
        for (let i = 0; i < 2; i++) {
          const card = pool[Math.floor(Math.random() * pool.length)];
          g.player.deck.push({ ...card, uid: uid() });
        }
        log('你完成了黑暗交易');
      } },
      { text: '拒绝交易', cond: g => true, action: g => { log('你拒绝了黑暗的诱惑'); } },
    ]
  },
  {
    title: '迷路的冒险者', act: 1,
    text: '一位迷路的冒险者向你求助。作为回报，他可以分享地图信息或给你一些补给。',
    choices: [
      { text: '分享补给（获得15金币和1张牌）', cond: g => true, action: g => {
        g.gold += 15;
        const card = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
        g.player.deck.push({ ...card, uid: uid() });
        log(`冒险者给了你 ${card.name} 和15金币`);
      } },
      { text: '请求指路（恢复10点生命）', cond: g => true, action: g => {
        const heal = Math.min(10, g.player.maxHp - g.player.hp);
        g.player.hp += heal;
        log(`冒险者为你疗伤，恢复${heal}点生命`);
      } },
      { text: '抢夺他的装备', cond: g => true, action: g => {
        const dmg = Math.floor(Math.random() * 6) + 3;
        g.player.hp -= dmg;
        g.gold += 35;
        log(`冒险者反抗！你受到${dmg}点伤害，但抢到了35金币`);
      } },
    ]
  },
  {
    title: '时空裂隙', act: 3,
    text: '空间在你面前扭曲，一个闪光的裂隙悬浮在空中。你能感受到其中蕴含的强大能量，但靠近它也充满危险。',
    choices: [
      { text: '进入裂隙（随机正负面效果）', cond: g => g.player.hp > 5, action: g => {
        const roll = Math.random();
        if (roll < 0.35) {
          g.player.maxHp += 5; g.player.hp = g.player.maxHp;
          log('时空能量强化了你！最大生命值+5');
        } else if (roll < 0.65) {
          for (let i = 0; i < 2; i++) {
            const card = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
            g.player.deck.push({ ...card, uid: uid() });
          }
          log('裂隙中飘出2张卡牌！');
        } else {
          const dmg = Math.floor(Math.random() * 8) + 5;
          g.player.hp -= dmg;
          log(`时空能量失控！你受到${dmg}点伤害`);
        }
      } },
      { text: '在远处观察（获得10金币）', cond: g => true, action: g => {
        g.gold += 10;
        log('你安全地观察了裂隙，获得10金币');
      } },
      { text: '绕道而行', cond: g => true, action: g => { log('你避开了裂隙'); } },
    ]
  },
  {
    title: '遗忘的卷轴', act: 3,
    text: '一卷落满灰尘的卷轴半埋在泥土中。上面的文字已模糊，但能感受到残留的魔法能量。',
    choices: [
      { text: '阅读卷轴（随机获得1张史诗牌，但失去5生命）', cond: g => g.player.hp > 5, action: g => {
        g.player.hp -= 5;
        const epics = CARD_POOL.filter(c => c.rarity === 'epic' || c.rarity === 'legendary');
        const card = epics[Math.floor(Math.random() * epics.length)];
        g.player.deck.push({ ...card, uid: uid() });
        log(`卷轴化为 ${card.name}！`);
      } },
      { text: '抄录卷轴（花费20金币，获得1张稀有牌）', cond: g => g.gold >= 20, action: g => {
        g.gold -= 20;
        const rares = CARD_POOL.filter(c => c.rarity === 'rare' || c.rarity === 'epic');
        const card = rares[Math.floor(Math.random() * rares.length)];
        g.player.deck.push({ ...card, uid: uid() });
        log(`你抄录了 ${card.name}`);
      } },
      { text: '卖掉卷轴（获得25金币）', cond: g => true, action: g => {
        g.gold += 25;
        log('你把卷轴卖给了路过的商人');
      } },
    ]
  },
  {
    title: '角斗场', act: 2,
    text: '一座废弃的角斗场中回荡着远古的战吼。中央的火盆邀请你接受挑战。',
    choices: [
      { text: '接受挑战（战斗：1/1随从，胜则获2张牌+30金）', cond: g => g.player.hp > 8, action: g => {
        g.player.hp -= 4;
        for (let i = 0; i < 2; i++) {
          const card = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)];
          g.player.deck.push({ ...card, uid: uid() });
        }
        g.gold += 30;
        log('你在角斗场中获胜！获得2张牌和30金币');
      } },
      { text: '只是搜刮（获得15金币）', cond: g => true, action: g => {
        g.gold += 15;
        log('你在角落找到了15金币');
      } },
      { text: '离开', cond: g => true, action: g => { log('你离开了角斗场'); } },
    ]
  },
  {
    title: '炼金术士的帐篷', act: 2,
    text: '一位炼金术士正在帐篷里忙碌。桌上摆满了五颜六色的药剂。"想要力量？那就帮我试一瓶吧！"',
    choices: [
      { text: '喝蓝色药剂（可能恢复或受伤）', cond: g => true, action: g => {
        if (Math.random() < 0.6) {
          const heal = Math.min(20, g.player.maxHp - g.player.hp);
          g.player.hp += heal;
          log(`药剂生效！恢复${heal}点生命`);
        } else {
          const dmg = Math.floor(Math.random() * 6) + 4;
          g.player.hp -= dmg;
          log(`药剂变质！受到${dmg}点伤害`);
        }
      } },
      { text: '喝红色药剂（随机升级1张牌或失去8生命）', cond: g => g.player.hp > 8, action: g => {
        if (Math.random() < 0.5) {
          const upgradable = g.player.deck.filter(c => !c.upgraded);
          if (upgradable.length > 0) {
            const card = upgradable[Math.floor(Math.random() * upgradable.length)];
            upgradeCard(card);
            log(`${card.name} 被强化了！`);
          } else { log('没有可升级的牌'); }
        } else {
          g.player.hp -= 8;
          log('药剂灼烧了你的身体！失去8点生命');
        }
      } },
      { text: '买下所有药剂（花费40金币，获得2张牌+升级1张）', cond: g => g.gold >= 40, action: g => {
        g.gold -= 40;
        for (let i = 0; i < 2; i++) {
          const rarePool = CARD_POOL.filter(c => c.rarity === 'rare' || c.rarity === 'epic');
          const card = rarePool[Math.floor(Math.random() * rarePool.length)];
          if (card) g.player.deck.push({ ...card, uid: uid() });
        }
        const upgradable = g.player.deck.filter(c => !c.upgraded);
        if (upgradable.length > 0) {
          const c = upgradable[Math.floor(Math.random() * upgradable.length)];
          upgradeCard(c);
          log(`炼金术士帮你强化了 ${c.name}！`);
        }
        log('你买下了全部药剂');
      } },
    ]
  },
  {
    title: '命运十字', act: 3,
    text: '小径在此分岔为三条路。一块古老的石碑刻着："选择命运，承担后果。"',
    choices: [
      { text: '财富之路（+50金币但-6生命）', cond: g => g.player.hp > 6, action: g => {
        g.player.hp -= 6; g.gold += 50;
        log('你踩过陷阱拿到了50金币');
      } },
      { text: '力量之路（升级1张牌+获得1张稀有牌）', cond: g => true, action: g => {
        const upgradable = g.player.deck.filter(c => !c.upgraded);
        if (upgradable.length > 0) {
          const c = upgradable[Math.floor(Math.random() * upgradable.length)];
          upgradeCard(c);
          log(`${c.name} 被强化了`);
        }
        const pool = CARD_POOL.filter(c => c.rarity === 'rare' || c.rarity === 'epic');
        const card = pool[Math.floor(Math.random() * pool.length)];
        g.player.deck.push({ ...card, uid: uid() });
        log(`你获得了 ${card.name}`);
      } },
      { text: '命运之路（随机大奖励或大惩罚）', cond: g => g.player.hp > 10, action: g => {
        const roll = Math.random();
        if (roll < 0.3) { g.player.maxHp += 5; g.player.hp += 5; log('命运眷顾你！最大生命值+5'); }
        else if (roll < 0.55) { grantRelic(g); log('命运赐予你一件遗物！'); }
        else { g.player.hp -= 12; log('命运重击！失去12点生命'); }
      } },
    ]
  },
  {
    title: '精灵泉源', act: 1,
    text: '一座精灵泉水隐藏在密林深处。泉水散发着柔和的光芒，据说拥有净化与增幅的双重力量。',
    choices: [
      { text: '净化（删除1张牌，恢复15生命）', cond: g => g.player.deck.length > 1, action: g => {
        g.player.deck.splice(Math.floor(Math.random() * g.player.deck.length), 1);
        const heal = Math.min(15, g.player.maxHp - g.player.hp);
        g.player.hp += heal;
        log(`泉水净化了你的牌组，恢复${heal}点生命`);
      } },
      { text: '增幅（花费20金币，所有随从获得+1/+1永久）', cond: g => g.gold >= 20, action: g => {
        g.gold -= 20;
        G.player.deck.forEach(c => { if (c.type === 'minion') { c.attack = (c.attack||0)+1; c.hp = (c.hp||0)+1; } });
        log('泉水增幅了你的随从牌！');
      } },
      { text: '取水（获得2张幸运币）', cond: g => true, action: g => {
        for (let i = 0; i < 2; i++) g.player.deck.push({ ...getCardData('the_coin'), uid: uid() });
        log('你收集了精灵泉水，获得2张幸运币');
      } },
    ]
  },
  {
    title: '古树之约', act: 1,
    text: '一棵参天古树的树皮上浮现出一张苍老的面孔："旅人，留下你的贡品，我将以森林之力回馈于你。"',
    choices: [
      { text: '献上10生命换取生命精华（最大生命+6）', cond: g => g.player.hp > 10, action: g => { g.player.hp -= 10; g.player.maxHp += 6; g.player.hp += 6; log('古树赐予你生命精华，最大生命+6'); } },
      { text: '献上20金币换取随机卡牌', cond: g => g.gold >= 20, action: g => { g.gold -= 20; const card = CARD_POOL[Math.floor(Math.random() * CARD_POOL.length)]; g.player.deck.push({ ...card, uid: uid() }); log(`古树赠予你 ${card.name}`); } },
      { text: '恭敬离开', cond: g => true, action: g => { log('古树微微晃动枝叶，似在道别'); } },
    ]
  },
  {
    title: '梦魇回廊', act: 2,
    text: '一条扭曲的回廊在你眼前展开。两侧的镜子映出不同的自己——一个伤痕累累，一个满载珍宝。',
    choices: [
      { text: '直面梦魇（六成几率强化一张牌，否则受5伤）', cond: g => true, action: g => {
        if (Math.random() < 0.6) {
          const upgradable = g.player.deck.filter(c => !c.upgraded);
          if (upgradable.length > 0) {
            const c = upgradable[Math.floor(Math.random() * upgradable.length)];
            upgradeCard(c);
            log(`你在梦魇中战胜了自己，${c.name} 被强化！`);
          } else {
            const heal = Math.min(10, g.player.maxHp - g.player.hp);
            g.player.hp += heal;
            log('你直面恐惧，内心变得强大（恢复10点生命）');
          }
        } else {
          g.player.hp -= 5;
          log('梦魇撕裂了你的意志，受到5点伤害');
        }
      } },
      { text: '打破镜子（获得25金币，但失去4生命）', cond: g => g.player.hp > 4, action: g => { g.player.hp -= 4; g.gold += 25; log('镜子碎片化为25金币'); } },
      { text: '离开回廊', cond: g => true, action: g => { log('你转身离去'); } },
    ]
  },
  {
    title: '虚空低语', act: 3,
    text: '虚空深处的低语在耳边回荡："抉择吧，凡人——以凡俗之物换取虚空之力，或拥抱永夜的馈赠。"',
    choices: [
      { text: '献上30金币换取强大卡牌', cond: g => g.gold >= 30, action: g => {
        g.gold -= 30;
        const pool = CARD_POOL.filter(c => c.rarity === 'epic' || c.rarity === 'legendary');
        const card = pool[Math.floor(Math.random() * pool.length)];
        g.player.deck.push({ ...card, uid: uid() });
        log(`虚空赐予你 ${card.name}`);
      } },
      { text: '接受虚空之力（最大生命-3，获得一个遗物）', cond: g => g.player.hp > 3, action: g => { g.player.maxHp -= 3; if (g.player.hp > g.player.maxHp) g.player.hp = g.player.maxHp; grantRelic(g); log('虚空之力渗入你的身体，你获得了一件遗物'); } },
      { text: '拒绝低语', cond: g => true, action: g => { log('你捂住耳朵，快步离开'); } },
    ]
  },
  {
    title: '神秘书架', act: 2,
    text: '一间废弃书房里矗立着高大的书架，魔法卷轴与古老典籍在微光中低语。',
    choices: [
      { text: '研读典籍（发现一张稀有或史诗卡牌）', cond: g => true, action: g => {
        g.pendingDiscover = true;
        g.pendingDiscoverPool = CARD_POOL.filter(c => c.rarity === 'rare' || c.rarity === 'epic');
        g.pendingDiscoverTitle = '发现一张卡牌';
        log('书架上泛起魔法光芒，典籍在你面前展开...');
      } },
      { text: '搜索书架（获得15金币）', cond: g => true, action: g => { g.gold += 15; log('你在书页之间找到了15金币'); } },
      { text: '离开书房', cond: g => true, action: g => { log('你轻轻合上门离去'); } },
    ]
  },
  {
    title: '符文祭坛', act: 2,
    text: '一座被藤蔓缠绕的石制祭坛矗立在空地中央，祭坛表面刻满古老的符文，隐约散发着血红色的微光。',
    choices: [
      { text: '献祭生命（失去10点生命，获得一件随机遗物）', cond: g => g.player.hp > 10, action: g => { g.player.hp -= 10; grantRelic(g); log('祭坛吸收了你的鲜血，一件遗物从光芒中浮现！'); } },
      { text: '献祭金币（花费40金币，升级一张随机牌）', cond: g => g.gold >= 40 && g.player.deck.some(c => !c.upgraded), action: g => {
        g.gold -= 40;
        const upgradable = g.player.deck.filter(c => !c.upgraded);
        if (upgradable.length) { const card = upgradable[Math.floor(Math.random()*upgradable.length)]; upgradeCard(card); log(`祭坛的力量注入了 ${card.name}！`); }
      } },
      { text: '离开祭坛', cond: g => true, action: g => { log('你不敢触碰这古老的力量，悄然离去'); } },
    ]
  },
  {
    title: '暗影商人', act: 2,
    text: '一个披着黑色斗篷的商人从阴影中走出，他的眼睛闪烁着诡异的紫光。"我这里有你想要的东西……不过，代价可不一般。"',
    choices: [
      { text: '以血换卡（失去8点生命，发现一张史诗卡）', cond: g => g.player.hp > 8, action: g => {
        g.player.hp -= 8;
        g.pendingDiscover = true;
        g.pendingDiscoverPool = CARD_POOL.filter(c => c.rarity === 'epic' || c.rarity === 'legendary');
        g.pendingDiscoverTitle = '以血换卡';
        log('商人割开你的手掌，三张卡牌在血雾中浮现……');
      } },
      { text: '购买遗物（花费70金币，获得一件随机遗物）', cond: g => g.gold >= 70, action: g => { g.gold -= 70; grantRelic(g); log('商人递给你一件散发着微光的遗物'); } },
      { text: '离开', cond: g => true, action: g => { log('你摇摇头，商人消失在阴影中'); } },
    ]
  },
  {
    title: '神秘熔炉', act: 3,
    text: '一座巨大的熔炉散发着炽热的橙红色光芒，炉中燃烧着永不熄灭的魔法之火。旁边的铁砧上放着一把古老的锤子。',
    choices: [
      { text: '双重强化（花费50金币，升级两张随机牌）', cond: g => g.gold >= 50 && g.player.deck.filter(c => !c.upgraded).length >= 2, action: g => {
        g.gold -= 50;
        const upgradable = g.player.deck.filter(c => !c.upgraded);
        for (let i = 0; i < 2 && upgradable.length > 0; i++) {
          const idx = Math.floor(Math.random() * upgradable.length);
          const card = upgradable.splice(idx, 1)[0];
          upgradeCard(card);
        }
        log('熔炉的火焰淬炼了你的两张卡牌！');
      } },
      { text: '生命熔铸（花费30金币，最大生命值+5）', cond: g => g.gold >= 30, action: g => { g.gold -= 30; g.player.maxHp += 5; g.player.hp += 5; log('熔炉的火焰重塑了你的体魄，最大生命值+5！'); } },
      { text: '离开熔炉', cond: g => true, action: g => { log('你感受着熔炉的余温，继续前行'); } },
    ]
  },
];

// Helper: get card data by id
const CARD_MAP = {};
CARD_POOL.forEach(c => CARD_MAP[c.id] = c);
const COIN_CARD = { id: 'the_coin', name: '幸运币', cost: 0, type: 'spell', rarity: 'common', art: '🪙', text: '获得1个法力水晶', effect: 'gain_mana_1' };

function getCardData(id) {
  if (id === 'the_coin') return { ...COIN_CARD };
  return CARD_MAP[id] ? { ...CARD_MAP[id] } : null;
}

function getCardCost(card) {
  let cost = card.cost || 0;
  if (cost <= 0) return 0;
  if (card.type === 'spell' && hasRelic('spell_cost_1')) cost -= 1;
  if (hasRelic('cost_reduction')) cost -= 1;
  if (card.type === 'minion' && hasRelic('minion_cost_1')) cost -= 1;
  if (hasRelic('first_play_discount') && G.battle && !G.battle.firstCardPlayed) cost -= 1;
  return Math.max(0, cost);
}

function uid() { return Math.random().toString(36).substr(2, 9); }

