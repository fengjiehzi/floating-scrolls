// items-data.js - 道具/宝物数据
// 按典籍分类，共30件道具

module.exports = [
    // ===== 西游记 =====
    {
        id: 1,
        name: '如意金箍棒',
        source: '西游记',
        rarity: 'legendary',
        type: 'weapon',
        image: '/images/classics/items/xiyouji-golden-cudgel.png',
        description: '大禹治水时留下的定海神针，重一万三千五百斤，可大可小，随心如意。',
        stats_bonus: { power: 15, speed: 5 },
        skill_bonus: 'physical_attack',
        source_basis: '西游记·第三回 四海千山皆拱伏 九幽十类尽除名'
    },
    {
        id: 2,
        name: '九环锡杖',
        source: '西游记',
        rarity: 'epic',
        type: 'weapon',
        image: '/images/classics/items/xiyouji-monk-staff.png',
        description: '如来佛祖所赐，持之可免堕轮回，护持取经人一路平安。',
        stats_bonus: { special_ability: 12, defense: 5 },
        skill_bonus: 'heal',
        source_basis: '西游记·第十二回 玄奘秉诚建大会 观音显象化金蝉'
    },
    {
        id: 3,
        name: '九齿钉耙',
        source: '西游记',
        rarity: 'epic',
        type: 'weapon',
        image: '/images/classics/items/xiyouji-nine-tooth-rake.png',
        description: '太上老君亲手打造，重五千零四十八斤，乃天蓬元帅神兵。',
        stats_bonus: { power: 12, defense: 8 },
        skill_bonus: 'physical_attack',
        source_basis: '西游记·第十九回 云栈洞悟空收八戒 浮屠山玄奘受心经'
    },
    {
        id: 4,
        name: '紧箍咒',
        source: '西游记',
        rarity: 'legendary',
        type: 'accessory',
        image: '/images/classics/items/xiyouji-tightening-headband.png',
        description: '观音菩萨所授，戴在头上，一念咒便头痛欲裂，专治不服。',
        stats_bonus: { special_ability: 15, intelligence: 10 },
        skill_bonus: 'magic_attack',
        source_basis: '西游记·第十四回 心猿归正 六贼无踪'
    },
    {
        id: 5,
        name: '通关文牒',
        source: '西游记',
        rarity: 'rare',
        type: 'consumable',
        image: '/images/classics/items/xiyouji-scripture-scroll.png',
        description: '唐太宗所赐，途经各国皆需倒换关文，乃西行之凭信。',
        stats_bonus: { intelligence: 8, special_ability: 5 },
        skill_bonus: 'transform',
        source_basis: '西游记·第十二回 玄奘秉诚建大会 观音显象化金蝉'
    },

    // ===== 三国演义 =====
    {
        id: 6,
        name: '青龙偃月刀',
        source: '三国演义',
        rarity: 'legendary',
        type: 'weapon',
        image: '/images/classics/items/sanguo-green-dragon-blade.png',
        description: '武圣关羽之神兵，重八十二斤，又名冷艳锯，斩将搴旗如探囊取物。',
        stats_bonus: { power: 18, defense: 5 },
        skill_bonus: 'physical_attack',
        source_basis: '三国演义·第一回 宴桃园豪杰三结义 斩黄巾英雄首立功'
    },
    {
        id: 7,
        name: '羽扇',
        source: '三国演义',
        rarity: 'epic',
        type: 'accessory',
        image: '/images/classics/items/sanguo-feather-fan.png',
        description: '卧龙先生的标志性羽扇，轻摇之间，计上心头，决胜千里之外。',
        stats_bonus: { intelligence: 15, special_ability: 8 },
        skill_bonus: 'magic_attack',
        source_basis: '三国演义·第三十八回 定三分隆中决策 战长江孙氏报仇'
    },
    {
        id: 8,
        name: '双股剑',
        source: '三国演义',
        rarity: 'epic',
        type: 'weapon',
        image: '/images/classics/items/sanguo-twin-swords.png',
        description: '刘备之兵器，一对宝剑，左手雌剑，右手雄剑，双剑合璧威力无穷。',
        stats_bonus: { power: 10, speed: 10 },
        skill_bonus: 'speed_attack',
        source_basis: '三国演义·第一回 宴桃园豪杰三结义 斩黄巾英雄首立功'
    },
    {
        id: 9,
        name: '虎符兵符',
        source: '三国演义',
        rarity: 'epic',
        type: 'accessory',
        image: '/images/classics/items/sanguo-military-seal.png',
        description: '调兵遣将的信物，持之可号令三军，战场之上瞬息万变。',
        stats_bonus: { special_ability: 12, defense: 8 },
        skill_bonus: 'summon',
        source_basis: '三国演义·第五十一回 曹仁大战东吴兵 孔明一气周公瑾'
    },
    {
        id: 10,
        name: '赤壁火船',
        source: '三国演义',
        rarity: 'legendary',
        type: 'consumable',
        image: '/images/classics/items/sanguo-red-cliff-fire-ships.png',
        description: '黄盖诈降所用的火攻战船，火烧赤壁八十三万曹军，奠定三足鼎立。',
        stats_bonus: { special_ability: 20, intelligence: 10 },
        skill_bonus: 'magic_attack',
        source_basis: '三国演义·第四十九回 七星坛诸葛祭风 三江口周瑜纵火'
    },
    {
        id: 11,
        name: '战阵图',
        source: '三国演义',
        rarity: 'rare',
        type: 'consumable',
        image: '/images/classics/items/sanguo-war-map.png',
        description: '描绘天下大势的军阵图，运筹帷幄之中，决胜千里之外。',
        stats_bonus: { intelligence: 10, special_ability: 5 },
        skill_bonus: 'transform',
        source_basis: '三国演义·第三十八回 定三分隆中决策 战长江孙氏报仇'
    },

    // ===== 水浒传 =====
    {
        id: 12,
        name: '月牙铲',
        source: '水浒传',
        rarity: 'epic',
        type: 'weapon',
        image: '/images/classics/items/shuihuzhuan-monk-spade.png',
        description: '花和尚鲁智深的兵器，重六十二斤，禅杖一挥，千军难挡。',
        stats_bonus: { power: 15, defense: 8 },
        skill_bonus: 'physical_attack',
        source_basis: '水浒传·第三回 史大郎夜走华阴县 鲁提辖拳打镇关西'
    },
    {
        id: 13,
        name: '花枪',
        source: '水浒传',
        rarity: 'epic',
        type: 'weapon',
        image: '/images/classics/items/shuihuzhuan-spear.png',
        description: '豹子头林冲的林家枪法所用之长枪，枪出如龙，天下无双。',
        stats_bonus: { power: 12, speed: 10 },
        skill_bonus: 'speed_attack',
        source_basis: '水浒传·第七回 花和尚倒拔垂杨柳 豹子头误入白虎堂'
    },
    {
        id: 14,
        name: '双戒刀',
        source: '水浒传',
        rarity: 'rare',
        type: 'weapon',
        image: '/images/classics/items/shuihuzhuan-twin-sabers.png',
        description: '行者武松的一对戒刀，雪花镔铁打造，杀人不沾血迹。',
        stats_bonus: { power: 10, speed: 12 },
        skill_bonus: 'physical_attack',
        source_basis: '水浒传·第三十一回 张都监血溅鸳鸯楼 武行者夜走蜈蚣岭'
    },
    {
        id: 15,
        name: '酒碗',
        source: '水浒传',
        rarity: 'rare',
        type: 'consumable',
        image: '/images/classics/items/shuihuzhuan-wine-bowl.png',
        description: '三碗不过岗的烈酒，饮之豪气干云，武力大增。',
        stats_bonus: { power: 8, speed: 5 },
        skill_bonus: 'transform',
        source_basis: '水浒传·第二十三回 横海郡柴进留宾 景阳冈武松打虎'
    },
    {
        id: 16,
        name: '白虎节堂',
        source: '水浒传',
        rarity: 'epic',
        type: 'accessory',
        image: '/images/classics/items/shuihuzhuan-tiger-token.png',
        description: '林冲误入白虎堂的信物，虽为冤案，却也成就了豹子头的威名。',
        stats_bonus: { defense: 12, special_ability: 8 },
        skill_bonus: 'transform',
        source_basis: '水浒传·第七回 花和尚倒拔垂杨柳 豹子头误入白虎堂'
    },
    {
        id: 17,
        name: '梁山大旗',
        source: '水浒传',
        rarity: 'legendary',
        type: 'accessory',
        image: '/images/classics/items/shuihuzhuan-liangshan-banner.png',
        description: '替天行道的杏黄大旗，梁山一百单八将的精神图腾。',
        stats_bonus: { special_ability: 18, power: 8, defense: 8 },
        skill_bonus: 'summon',
        source_basis: '水浒传·第七十一回 忠义堂石碣受天文 梁山泊英雄排座次'
    },
    {
        id: 18,
        name: '哨棒',
        source: '水浒传',
        rarity: 'common',
        type: 'weapon',
        image: '/images/classics/items/shuihuzhuan-staff.png',
        description: '武松打虎所用的哨棒，虽只是普通木棒，却打死了吊睛白额大虫。',
        stats_bonus: { power: 5, speed: 5 },
        skill_bonus: 'physical_attack',
        source_basis: '水浒传·第二十三回 横海郡柴进留宾 景阳冈武松打虎'
    },

    // ===== 红楼梦 =====
    {
        id: 19,
        name: '通灵宝玉',
        source: '红楼梦',
        rarity: 'legendary',
        type: 'accessory',
        image: '/images/classics/items/hongloumeng-psychic-jade.png',
        description: '贾宝玉出生时口中所衔之玉，大如雀卵，灿若明霞，乃女娲补天所遗。',
        stats_bonus: { special_ability: 20, intelligence: 10, defense: 5 },
        skill_bonus: 'heal',
        source_basis: '红楼梦·第一回 甄士隐梦幻识通灵 贾雨村风尘怀闺秀'
    },
    {
        id: 20,
        name: '金锁',
        source: '红楼梦',
        rarity: 'epic',
        type: 'accessory',
        image: '/images/classics/items/hongloumeng-golden-lock.png',
        description: '薛宝钗的金锁，上刻"不离不弃，芳龄永继"，与通灵宝玉成对。',
        stats_bonus: { special_ability: 12, defense: 10 },
        skill_bonus: 'transform',
        source_basis: '红楼梦·第八回 比通灵金莺微露意 探宝钗黛玉半含酸'
    },
    {
        id: 21,
        name: '葬花锄头',
        source: '红楼梦',
        rarity: 'epic',
        type: 'accessory',
        image: '/images/classics/items/hongloumeng-hairpin.png',
        description: '黛玉葬花所用之物，花谢花飞花满天，红消香断有谁怜。',
        stats_bonus: { intelligence: 12, special_ability: 10 },
        skill_bonus: 'magic_attack',
        source_basis: '红楼梦·第二十七回 滴翠亭杨妃戏彩蝶 埋香冢飞燕泣残红'
    },
    {
        id: 22,
        name: '团扇',
        source: '红楼梦',
        rarity: 'rare',
        type: 'accessory',
        image: '/images/classics/items/hongloumeng-hand-fan.png',
        description: '薛宝钗扑蝶所用的团扇，轻罗小扇扑流萤，闺阁之中的雅致。',
        stats_bonus: { speed: 8, intelligence: 8 },
        skill_bonus: 'speed_attack',
        source_basis: '红楼梦·第二十七回 滴翠亭杨妃戏彩蝶 埋香冢飞燕泣残红'
    },
    {
        id: 23,
        name: '诗稿',
        source: '红楼梦',
        rarity: 'rare',
        type: 'consumable',
        image: '/images/classics/items/hongloumeng-poetry-manuscript.png',
        description: '大观园诗社的诗词稿，字字珠玑，才情横溢，读之令人心旷神怡。',
        stats_bonus: { intelligence: 10, mp: 100 },
        skill_bonus: 'magic_attack',
        source_basis: '红楼梦·第三十七回 秋爽斋偶结海棠社 蘅芜苑夜拟菊花题'
    },
    {
        id: 24,
        name: '赏花令',
        source: '红楼梦',
        rarity: 'rare',
        type: 'consumable',
        image: '/images/classics/items/hongloumeng-garden-flower-token.png',
        description: '大观园赏花会的令牌，史湘云醉卧芍药裀的雅趣。',
        stats_bonus: { special_ability: 8, hp: 200 },
        skill_bonus: 'heal',
        source_basis: '红楼梦·第六十二回 憨湘云醉眠芍药裀 呆香菱情解石榴裙'
    },

    // ===== 封神演义 =====
    {
        id: 25,
        name: '打神鞭',
        source: '封神演义',
        rarity: 'legendary',
        type: 'weapon',
        image: '/images/classics/items/fengshen-god-beating-whip.png',
        description: '姜子牙的神兵，专打封神榜上有名之人，鞭长三尺六寸五分，有二十一节。',
        stats_bonus: { power: 15, special_ability: 15 },
        skill_bonus: 'magic_attack',
        source_basis: '封神演义·第三十八回 四圣西岐会子牙'
    },
    {
        id: 26,
        name: '风火轮',
        source: '封神演义',
        rarity: 'epic',
        type: 'accessory',
        image: '/images/classics/items/fengshen-wind-fire-wheels.png',
        description: '哪吒的代步神兵，脚踏双轮，风行电掣，日行万里。',
        stats_bonus: { speed: 18, power: 5 },
        skill_bonus: 'speed_attack',
        source_basis: '封神演义·第十四回 哪吒现莲花化身'
    },
    {
        id: 27,
        name: '乾坤圈',
        source: '封神演义',
        rarity: 'epic',
        type: 'weapon',
        image: '/images/classics/items/fengshen-qiankun-ring.png',
        description: '哪吒的法宝，金光万道，瑞气千条，掷出可取上将首级。',
        stats_bonus: { power: 14, special_ability: 8 },
        skill_bonus: 'physical_attack',
        source_basis: '封神演义·第十二回 陈塘关哪吒出世'
    },
    {
        id: 28,
        name: '混天绫',
        source: '封神演义',
        rarity: 'epic',
        type: 'accessory',
        image: '/images/classics/items/fengshen-huntian-silk.png',
        description: '哪吒的护身红绫，长七尺，能长能短，可攻可守，缚敌于无形。',
        stats_bonus: { defense: 12, special_ability: 10 },
        skill_bonus: 'transform',
        source_basis: '封神演义·第十二回 陈塘关哪吒出世'
    },
    {
        id: 29,
        name: '杏黄旗',
        source: '封神演义',
        rarity: 'legendary',
        type: 'accessory',
        image: '/images/classics/items/fengshen-command-banner.png',
        description: '戊己杏黄旗，鸿钧老祖所赐，展开有万道金光，诸邪避退。',
        stats_bonus: { defense: 20, special_ability: 12 },
        skill_bonus: 'transform',
        source_basis: '封神演义·第三十八回 四圣西岐会子牙'
    },
    {
        id: 30,
        name: '照妖镜',
        source: '封神演义',
        rarity: 'epic',
        type: 'accessory',
        image: '/images/classics/items/fengshen-fox-mirror.png',
        description: '能照出妖物原形的宝镜，九尾狐亦难逃其鉴。',
        stats_bonus: { intelligence: 12, special_ability: 12 },
        skill_bonus: 'magic_attack',
        source_basis: '封神演义·第十六回 子牙火烧琵琶精'
    },
    {
        id: 31,
        name: '莲花化身',
        source: '封神演义',
        rarity: 'legendary',
        type: 'consumable',
        image: '/images/classics/items/fengshen-lotus-body-token.png',
        description: '太乙真人以莲花荷叶为哪吒重塑的肉身，不堕轮回，不生不灭。',
        stats_bonus: { hp: 500, mp: 200, special_ability: 15 },
        skill_bonus: 'heal',
        source_basis: '封神演义·第十四回 哪吒现莲花化身'
    }
];
