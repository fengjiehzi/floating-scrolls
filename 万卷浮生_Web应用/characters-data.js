// characters-data.js - 角色数据
// 数据来源：万卷浮生初赛demo + 新增典籍角色，共25个角色

module.exports = [
    // ===== 西游记 =====
    {
        id: 1,
        name: '孙悟空',
        grade: 'S',
        source: '西游记',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        image: '/images/classics/characters/xiyouji-sun-wukong.png',
        card_image: '/images/classics/characters/xiyouji-sun-wukong.png',
        stats: { power: 98, speed: 99, intelligence: 85, defense: 95, special_ability: 96, hp: 9500, mp: 800 },
        skills: [
            { name: '如意金箍棒·砸', type: 'physical_attack', multiplier: 1.5, mp_cost: 0, desc: '金箍棒挟万钧之力砸下，地动山摇', narration: '金箍棒挟万钧之力砸下，地动山摇' },
            { name: '筋斗云突袭', type: 'speed_attack', multiplier: 1.3, mp_cost: 20, desc: '筋斗云一闪而至，瞬间突袭对手', narration: '驾筋斗云一闪而至，瞬息突袭对手' },
            { name: '七十二变', type: 'transform', multiplier: 0, mp_cost: 50, desc: '变化莫测，躲避敌方攻击', narration: '施展七十二变，身形变幻莫测' },
            { name: '火眼金睛', type: 'passive', multiplier: 0, mp_cost: 0, desc: '被动：免疫幻术', narration: '火眼金睛洞察一切' },
            { name: '毫毛分身', type: 'summon', multiplier: 0.6, mp_cost: 80, desc: '拔毫毛变分身，协同攻击', narration: '拔毫毛变出分身，协同出击' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '齐天大圣', bonuses: { power: 5, speed: 3 } },
            { name: '斗战胜佛', bonuses: { power: 10, intelligence: 10, defense: 10 } }
        ],
        source_basis: '金箍棒一万三千五百斤、筋斗云十万八千里、七十二变、火眼金睛、毫毛分身'
    },
    {
        id: 15,
        name: '唐僧',
        grade: 'B',
        source: '西游记',
        gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        image: '/images/classics/characters/xiyouji-tang-sanzang.png',
        card_image: '/images/classics/characters/xiyouji-tang-sanzang.png',
        stats: { power: 20, speed: 35, intelligence: 88, defense: 30, special_ability: 90, hp: 3000, mp: 1200 },
        skills: [
            { name: '紧箍咒', type: 'magic_attack', multiplier: 1.6, mp_cost: 80, desc: '念动紧箍咒，压制敌人', narration: '紧箍咒响起，头痛欲裂' },
            { name: '袈裟护体', type: 'transform', multiplier: 0, mp_cost: 60, desc: '锦襕袈裟护体，提升防御', narration: '锦襕袈裟展开，佛光护体' },
            { name: '禅杖点化', type: 'heal', multiplier: 0, mp_cost: 100, desc: '禅杖点化，恢复生命', narration: '禅杖轻点，生机涌现' },
            { name: '佛法无边', type: 'magic_attack', multiplier: 1.8, mp_cost: 150, desc: '佛法降妖，净化邪恶', narration: '佛法普照，邪祟退散' },
            { name: '白龙马护主', type: 'summon', multiplier: 0.8, mp_cost: 70, desc: '召唤白龙马护主', narration: '白龙马长啸而至' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '旃檀功德佛', bonuses: { special_ability: 10, intelligence: 10 } }
        ],
        source_basis: '紧箍咒、锦襕袈裟、九环锡杖、白龙马、西天取经'
    },
    {
        id: 16,
        name: '猪八戒',
        grade: 'A',
        source: '西游记',
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        image: '/images/classics/characters/xiyouji-zhu-bajie.png',
        card_image: '/images/classics/characters/xiyouji-zhu-bajie.png',
        stats: { power: 82, speed: 60, intelligence: 55, defense: 80, special_ability: 70, hp: 8500, mp: 500 },
        skills: [
            { name: '九齿钉耙', type: 'physical_attack', multiplier: 1.5, mp_cost: 40, desc: '九齿钉耙猛击', narration: '九齿钉耙寒光闪闪' },
            { name: '天罡三十六变', type: 'transform', multiplier: 0, mp_cost: 60, desc: '天罡变化，躲避攻击', narration: '施展天罡三十六变' },
            { name: '贪吃恢复', type: 'heal', multiplier: 0, mp_cost: 80, desc: '大吃一顿恢复体力', narration: '风卷残云，体力恢复' },
            { name: '卷帘大将', type: 'physical_attack', multiplier: 1.7, mp_cost: 100, desc: '天蓬元帅之威', narration: '天蓬元帅神威发作' },
            { name: '高老庄女婿', type: 'passive', multiplier: 0, mp_cost: 0, desc: '被动：血量低时防御提升', narration: '保命要紧，缩起头来' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '净坛使者', bonuses: { defense: 10, hp: 500 } }
        ],
        source_basis: '九齿钉耙、天罡三十六变、天蓬元帅、高老庄、净坛使者'
    },

    // ===== 三国演义 =====
    {
        id: 3,
        name: '诸葛亮',
        grade: 'A',
        source: '三国演义',
        gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        image: '/images/classics/characters/sanguo-zhuge-liang.png',
        card_image: '/images/classics/characters/sanguo-zhuge-liang.png',
        stats: { power: 40, speed: 50, intelligence: 98, defense: 45, special_ability: 85, hp: 4000, mp: 1200 },
        skills: [
            { name: '空城计', type: 'transform', multiplier: 0, mp_cost: 80, desc: '心理战，降低对手攻击', narration: '空城计奏响，心理压制对手' },
            { name: '八阵图', type: 'transform', multiplier: 0, mp_cost: 100, desc: '困敌阵法', narration: '布下八阵图，困住对手' },
            { name: '火攻', type: 'magic_attack', multiplier: 1.5, mp_cost: 120, desc: '烈火焚敌', narration: '火攻骤起，烈焰焚天' },
            { name: '借东风', type: 'transform', multiplier: 0, mp_cost: 60, desc: '增强自身特殊能力', narration: '借东风，特殊能力大增' },
            { name: '木牛流马', type: 'summon', multiplier: 0.6, mp_cost: 90, desc: '召唤机关兽', narration: '木牛流马呼啸而出' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '卧龙', bonuses: { intelligence: 10, special_ability: 5 } }
        ],
        source_basis: '空城计、八阵图、火攻、借东风、木牛流马'
    },
    {
        id: 4,
        name: '关羽',
        grade: 'A',
        source: '三国演义',
        gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        image: '/images/classics/characters/sanguo-guanyu.png',
        card_image: '/images/classics/characters/sanguo-guanyu.png',
        stats: { power: 88, speed: 75, intelligence: 72, defense: 82, special_ability: 70, hp: 8200, mp: 500 },
        skills: [
            { name: '青龙偃月斩', type: 'physical_attack', multiplier: 1.6, mp_cost: 50, desc: '青龙刀横劈而下', narration: '青龙偃月刀寒光横劈' },
            { name: '拖刀计', type: 'physical_attack', multiplier: 1.4, mp_cost: 60, desc: '诈败拖刀反击+减速', narration: '拖刀计诈败反击' },
            { name: '水淹七军', type: 'magic_attack', multiplier: 1.5, mp_cost: 100, desc: '洪水淹敌', narration: '水淹七军，洪流滔天' },
            { name: '单骑千里', type: 'transform', multiplier: 0, mp_cost: 40, desc: '速度提升', narration: '单骑千里，速度骤增' },
            { name: '温酒斩华雄', type: 'physical_attack', multiplier: 1.8, mp_cost: 80, desc: '暴击技', narration: '温酒斩华雄之勇，一刀制敌' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '武圣', bonuses: { power: 8, defense: 5 } }
        ],
        source_basis: '青龙偃月刀、拖刀计、水淹七军、单骑千里、温酒斩华雄'
    },
    {
        id: 17,
        name: '曹操',
        grade: 'S',
        source: '三国演义',
        gradient: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
        image: '/images/classics/characters/sanguo-caocao.png',
        card_image: '/images/classics/characters/sanguo-caocao.png',
        stats: { power: 80, speed: 75, intelligence: 95, defense: 78, special_ability: 90, hp: 8000, mp: 1000 },
        skills: [
            { name: '挟天子令诸侯', type: 'transform', multiplier: 0, mp_cost: 80, desc: '号令天下，全属性提升', narration: '挟天子以令诸侯，威势滔天' },
            { name: '孟德新书', type: 'magic_attack', multiplier: 1.6, mp_cost: 100, desc: '兵法攻击，以智取胜', narration: '孟德新书兵法施展' },
            { name: '赤壁纵火', type: 'magic_attack', multiplier: 1.8, mp_cost: 150, desc: '火攻之计，烈焰焚天', narration: '赤壁之火，燎原之势' },
            { name: '割须弃袍', type: 'transform', multiplier: 0, mp_cost: 50, desc: '逃命绝技，闪避提升', narration: '割须弃袍，狼狈而逃' },
            { name: '望梅止渴', type: 'heal', multiplier: 0, mp_cost: 70, desc: '心理暗示，恢复士气', narration: '望梅止渴，士气大振' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '魏武帝', bonuses: { intelligence: 10, special_ability: 10 } }
        ],
        source_basis: '挟天子以令诸侯、孟德新书、赤壁之战、望梅止渴、魏武帝'
    },
    {
        id: 18,
        name: '刘备',
        grade: 'A',
        source: '三国演义',
        gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        image: '/images/classics/characters/sanguo-liubei.png',
        card_image: '/images/classics/characters/sanguo-liubei.png',
        stats: { power: 70, speed: 65, intelligence: 80, defense: 72, special_ability: 85, hp: 7500, mp: 700 },
        skills: [
            { name: '双股剑', type: 'physical_attack', multiplier: 1.4, mp_cost: 30, desc: '双剑齐出', narration: '双股剑寒光闪闪' },
            { name: '桃园结义', type: 'summon', multiplier: 1.0, mp_cost: 120, desc: '召唤关羽张飞助阵', narration: '桃园三兄弟齐至' },
            { name: '三顾茅庐', type: 'transform', multiplier: 0, mp_cost: 80, desc: '礼贤下士，智力提升', narration: '三顾茅庐，卧龙出山' },
            { name: '摔阿斗', type: 'transform', multiplier: 0, mp_cost: 60, desc: '收买人心，防御提升', narration: '为汝这孺子，几损我一员大将' },
            { name: '白帝城托孤', type: 'magic_attack', multiplier: 1.7, mp_cost: 150, desc: '临终托孤，全力一击', narration: '白帝城托孤，最后嘱托' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '昭烈帝', bonuses: { defense: 10, special_ability: 8 } }
        ],
        source_basis: '双股剑、桃园三结义、三顾茅庐、白帝城托孤、蜀汉昭烈帝'
    },
    {
        id: 12,
        name: '貂蝉',
        grade: 'B',
        source: '三国演义',
        gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
        image: '/images/arena/characters/diao-chan.png',
        card_image: '/images/arena/characters/diao-chan.png',
        stats: { power: 35, speed: 65, intelligence: 88, defense: 40, special_ability: 82, hp: 3500, mp: 900 },
        skills: [
            { name: '连环计', type: 'magic_attack', multiplier: 1.5, mp_cost: 80, desc: '连环计离间敌人', narration: '连环计施展，离间敌心' },
            { name: '美人计', type: 'transform', multiplier: 0, mp_cost: 60, desc: '美人计降低敌人攻击', narration: '美人计施展，敌人攻势减弱' },
            { name: '舞剑', type: 'speed_attack', multiplier: 1.3, mp_cost: 40, desc: '舞剑迷惑攻击', narration: '舞剑身姿迷惑，剑光忽至' },
            { name: '闭月之姿', type: 'transform', multiplier: 0, mp_cost: 50, desc: '闭月之姿闪避', narration: '闭月之姿，身形隐匿' },
            { name: '离间术', type: 'magic_attack', multiplier: 1.4, mp_cost: 70, desc: '离间术削弱敌人', narration: '离间术施展，敌人内耗' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '闭月', bonuses: { intelligence: 8, special_ability: 5 } }
        ],
        source_basis: '连环计、美人计、舞剑、闭月之姿、离间术'
    },

    // ===== 水浒传 =====
    {
        id: 5,
        name: '鲁智深',
        grade: 'A',
        source: '水浒传',
        gradient: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
        image: '/images/arena/characters/lu-zhishen.png',
        card_image: '/images/arena/characters/lu-zhishen.png',
        stats: { power: 92, speed: 70, intelligence: 55, defense: 88, special_ability: 40, hp: 8800, mp: 300 },
        skills: [
            { name: '倒拔垂杨柳', type: 'physical_attack', multiplier: 1.7, mp_cost: 80, desc: '神力拔树砸敌', narration: '倒拔垂杨柳，神力惊人' },
            { name: '疯魔杖法', type: 'physical_attack', multiplier: 1.3, mp_cost: 30, desc: '禅杖狂舞', narration: '疯魔杖法狂舞而出' },
            { name: '禅杖重击', type: 'physical_attack', multiplier: 1.4, mp_cost: 60, desc: '重击+眩晕', narration: '禅杖重击，势大力沉' },
            { name: '酒醉暴怒', type: 'transform', multiplier: 0, mp_cost: 50, desc: '暴击率提升', narration: '酒醉暴怒，战意滔天' },
            { name: '拳打镇关西', type: 'physical_attack', multiplier: 1.5, mp_cost: 70, desc: '三拳连击', narration: '拳打镇关西，三拳连发' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '花和尚', bonuses: { power: 5, defense: 8 } }
        ],
        source_basis: '倒拔垂杨柳、疯魔杖法、禅杖、拳打镇关西'
    },
    {
        id: 9,
        name: '武松',
        grade: 'B',
        source: '水浒传',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        image: '/images/classics/characters/shuihuzhuan-wusong.png',
        card_image: '/images/classics/characters/shuihuzhuan-wusong.png',
        stats: { power: 85, speed: 72, intelligence: 60, defense: 75, special_ability: 50, hp: 8000, mp: 350 },
        skills: [
            { name: '醉拳', type: 'physical_attack', multiplier: 1.4, mp_cost: 30, desc: '醉拳招式诡异', narration: '醉拳招式诡异难测' },
            { name: '鸳鸯脚', type: 'speed_attack', multiplier: 1.5, mp_cost: 50, desc: '鸳鸯脚连环踢', narration: '鸳鸯脚连环踢出' },
            { name: '打虎拳', type: 'physical_attack', multiplier: 1.7, mp_cost: 80, desc: '景阳冈打虎拳法', narration: '打虎拳重击，势如打虎' },
            { name: '酒意暴怒', type: 'transform', multiplier: 0, mp_cost: 60, desc: '酒意上涌，暴怒提升攻击', narration: '酒意上涌，暴怒状态' },
            { name: '戒刀斩', type: 'physical_attack', multiplier: 1.3, mp_cost: 20, desc: '行者戒刀斩击', narration: '戒刀寒光斩下' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '行者', bonuses: { power: 5, speed: 3 } }
        ],
        source_basis: '醉拳、鸳鸯脚、景阳冈打虎、行者戒刀'
    },
    {
        id: 19,
        name: '林冲',
        grade: 'A',
        source: '水浒传',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        image: '/images/classics/characters/shuihuzhuan-linchong.png',
        card_image: '/images/classics/characters/shuihuzhuan-linchong.png',
        stats: { power: 86, speed: 80, intelligence: 70, defense: 82, special_ability: 65, hp: 8300, mp: 450 },
        skills: [
            { name: '林家枪法', type: 'physical_attack', multiplier: 1.6, mp_cost: 50, desc: '林家枪法出神入化', narration: '林家枪法凌厉出击' },
            { name: '风雪山神庙', type: 'physical_attack', multiplier: 1.8, mp_cost: 100, desc: '风雪之夜，怒杀仇敌', narration: '风雪山神庙，怒火中烧' },
            { name: '豹子头冲锋', type: 'speed_attack', multiplier: 1.5, mp_cost: 40, desc: '豹子头冲锋陷阵', narration: '豹子头冲锋，势不可挡' },
            { name: '雪夜上梁山', type: 'transform', multiplier: 0, mp_cost: 60, desc: '雪夜奔袭，速度提升', narration: '雪夜上梁山，身法迅捷' },
            { name: '八十万禁军教头', type: 'passive', multiplier: 0, mp_cost: 0, desc: '被动：暴击伤害提升', narration: '禁军教头武艺精熟' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '豹子头', bonuses: { power: 8, speed: 5 } }
        ],
        source_basis: '林家枪法、风雪山神庙、豹子头、八十万禁军教头、雪夜上梁山'
    },
    {
        id: 20,
        name: '宋江',
        grade: 'B',
        source: '水浒传',
        gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        image: '/images/classics/characters/shuihuzhuan-songjiang.png',
        card_image: '/images/classics/characters/shuihuzhuan-songjiang.png',
        stats: { power: 55, speed: 50, intelligence: 85, defense: 60, special_ability: 90, hp: 6000, mp: 800 },
        skills: [
            { name: '及时雨', type: 'heal', multiplier: 0, mp_cost: 80, desc: '及时雨，恢复友军', narration: '及时雨宋江，救人于危难' },
            { name: '呼保义', type: 'transform', multiplier: 0, mp_cost: 60, desc: '号令群雄，全属性提升', narration: '呼保义号令，群雄响应' },
            { name: '忠义堂', type: 'summon', multiplier: 0.8, mp_cost: 120, desc: '召唤梁山好汉助阵', narration: '忠义堂好汉齐至' },
            { name: '招安之策', type: 'magic_attack', multiplier: 1.4, mp_cost: 90, desc: '招安之计，瓦解敌方', narration: '招安之策，动之以情' },
            { name: '题反诗', type: 'magic_attack', multiplier: 1.6, mp_cost: 100, desc: '浔阳楼题反诗，战意高昂', narration: '他年若得报冤仇，血染浔阳江口' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '呼保义', bonuses: { special_ability: 10, intelligence: 8 } }
        ],
        source_basis: '及时雨、呼保义、忠义堂、招安、浔阳楼题反诗'
    },

    // ===== 红楼梦 =====
    {
        id: 6,
        name: '林黛玉',
        grade: 'B',
        source: '红楼梦',
        gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        image: '/images/classics/characters/hongloumeng-lindaiyu.png',
        card_image: '/images/classics/characters/hongloumeng-lindaiyu.png',
        stats: { power: 25, speed: 40, intelligence: 90, defense: 20, special_ability: 75, hp: 2500, mp: 1000 },
        skills: [
            { name: '葬花吟', type: 'transform', multiplier: 0, mp_cost: 60, desc: '心理战，降低对手士气', narration: '葬花吟声声入耳，士气低落' },
            { name: '泪尽血枯', type: 'magic_attack', multiplier: 2.0, mp_cost: 150, desc: '牺牲自身造成大量伤害', narration: '泪尽血枯，以命换伤' },
            { name: '咏絮才', type: 'magic_attack', multiplier: 1.5, mp_cost: 80, desc: '智力攻击', narration: '咏絮之才，才情化刃' },
            { name: '潇湘馆梦境', type: 'transform', multiplier: 0, mp_cost: 100, desc: '幻术困敌', narration: '潇湘馆梦境幻术笼罩' },
            { name: '金陵十二钗', type: 'summon', multiplier: 0.6, mp_cost: 120, desc: '召唤十二钗', narration: '金陵十二钗齐齐现身' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '绛珠仙草', bonuses: { special_ability: 15, intelligence: 10 } }
        ],
        source_basis: '葬花吟、咏絮才、潇湘馆、绛珠仙草、金陵十二钗'
    },
    {
        id: 21,
        name: '贾宝玉',
        grade: 'B',
        source: '红楼梦',
        gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        image: '/images/classics/characters/hongloumeng-jiabaoyu.png',
        card_image: '/images/classics/characters/hongloumeng-jiabaoyu.png',
        stats: { power: 30, speed: 45, intelligence: 85, defense: 35, special_ability: 80, hp: 3000, mp: 900 },
        skills: [
            { name: '通灵宝玉', type: 'transform', multiplier: 0, mp_cost: 80, desc: '通灵护体，提升防御', narration: '通灵宝玉闪耀，护体神光' },
            { name: '大观园诗社', type: 'magic_attack', multiplier: 1.5, mp_cost: 100, desc: '诗词为刃，才情攻击', narration: '大观园诗社，才情横溢' },
            { name: '木石前盟', type: 'heal', multiplier: 0, mp_cost: 90, desc: '木石姻缘，恢复生机', narration: '木石前盟，前缘再续' },
            { name: '红楼梦魇', type: 'magic_attack', multiplier: 1.7, mp_cost: 130, desc: '太虚幻境，梦境困敌', narration: '太虚幻境，红楼梦魇' },
            { name: '富贵闲人', type: 'passive', multiplier: 0, mp_cost: 0, desc: '被动：MP恢复速度提升', narration: '富贵闲人，怡然自得' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '神瑛侍者', bonuses: { special_ability: 10, intelligence: 8 } }
        ],
        source_basis: '通灵宝玉、大观园、木石前盟、太虚幻境、神瑛侍者'
    },
    {
        id: 22,
        name: '薛宝钗',
        grade: 'A',
        source: '红楼梦',
        gradient: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
        image: '/images/classics/characters/hongloumeng-xuebaochai.png',
        card_image: '/images/classics/characters/hongloumeng-xuebaochai.png',
        stats: { power: 40, speed: 55, intelligence: 92, defense: 50, special_ability: 85, hp: 3800, mp: 1100 },
        skills: [
            { name: '冷香丸', type: 'heal', multiplier: 0, mp_cost: 70, desc: '冷香丸调理，恢复生命', narration: '冷香丸清香四溢，调和阴阳' },
            { name: '蘅芜君', type: 'transform', multiplier: 0, mp_cost: 60, desc: '蘅芜君风范，全属性提升', narration: '蘅芜君端方典雅' },
            { name: '金玉良缘', type: 'magic_attack', multiplier: 1.6, mp_cost: 110, desc: '金锁玉佩，灵力攻击', narration: '金玉良缘，天作之合' },
            { name: '螃蟹咏', type: 'magic_attack', multiplier: 1.4, mp_cost: 80, desc: '以诗为刃，讽刺攻击', narration: '螃蟹咏出，字字如刀' },
            { name: '停机德', type: 'passive', multiplier: 0, mp_cost: 0, desc: '被动：防御提升', narration: '可叹停机德，堪怜咏絮才' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '蘅芜君', bonuses: { intelligence: 10, defense: 8 } }
        ],
        source_basis: '冷香丸、蘅芜苑、金玉良缘、螃蟹咏、停机德'
    },

    // ===== 封神演义 =====
    {
        id: 7,
        name: '哪吒',
        grade: 'A',
        source: '封神演义',
        gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
        image: '/images/classics/characters/fengshen-nezha.png',
        card_image: '/images/classics/characters/fengshen-nezha.png',
        stats: { power: 85, speed: 92, intelligence: 70, defense: 78, special_ability: 88, hp: 7800, mp: 600 },
        skills: [
            { name: '风火轮突袭', type: 'speed_attack', multiplier: 1.4, mp_cost: 30, desc: '脚踏风火轮，烈焰突袭', narration: '脚踏风火轮，烈焰裹挟而至' },
            { name: '乾坤圈砸', type: 'physical_attack', multiplier: 1.5, mp_cost: 40, desc: '乾坤圈挟神力砸下', narration: '乾坤圈挟神力砸下' },
            { name: '混天绫缚', type: 'transform', multiplier: 0, mp_cost: 50, desc: '混天绫缠绕敌人', narration: '混天绫飞舞缠绕敌人' },
            { name: '三头六臂', type: 'transform', multiplier: 0, mp_cost: 80, desc: '化身三头六臂，攻防提升', narration: '化身三头六臂，神威大盛' },
            { name: '莲花真身', type: 'heal', multiplier: 0, mp_cost: 100, desc: '莲花真身回血', narration: '莲花真身绽放，恢复生机' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '三头六臂', bonuses: { power: 8, defense: 5 } }
        ],
        source_basis: '风火轮、乾坤圈、混天绫、三头六臂、莲花真身'
    },
    {
        id: 8,
        name: '姜子牙',
        grade: 'S',
        source: '封神演义',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        image: '/images/classics/characters/fengshen-jiangziya.png',
        card_image: '/images/classics/characters/fengshen-jiangziya.png',
        stats: { power: 60, speed: 55, intelligence: 95, defense: 70, special_ability: 98, hp: 6000, mp: 1500 },
        skills: [
            { name: '打神鞭', type: 'magic_attack', multiplier: 1.7, mp_cost: 100, desc: '打神鞭降下，专打封神榜上人', narration: '打神鞭凌空降下，神威赫赫' },
            { name: '封神术', type: 'magic_attack', multiplier: 1.8, mp_cost: 150, desc: '封神术封印敌人', narration: '封神术施展，封印之力降临' },
            { name: '奇门遁甲', type: 'transform', multiplier: 0, mp_cost: 80, desc: '奇门遁甲躲避攻击', narration: '奇门遁甲布下，身形隐匿' },
            { name: '借东风', type: 'magic_attack', multiplier: 1.3, mp_cost: 60, desc: '借东风增强法术', narration: '借东风之力，法术增强' },
            { name: '杏黄旗', type: 'transform', multiplier: 0, mp_cost: 50, desc: '杏黄旗护体', narration: '杏黄旗展开，护体金光' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '封神', bonuses: { special_ability: 10, intelligence: 5 } }
        ],
        source_basis: '打神鞭、封神榜、奇门遁甲、借东风、杏黄旗'
    },
    {
        id: 23,
        name: '妲己',
        grade: 'A',
        source: '封神演义',
        gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        image: '/images/classics/characters/fengshen-daji.png',
        card_image: '/images/classics/characters/fengshen-daji.png',
        stats: { power: 45, speed: 75, intelligence: 90, defense: 45, special_ability: 95, hp: 4000, mp: 1000 },
        skills: [
            { name: '九尾妖狐', type: 'transform', multiplier: 0, mp_cost: 80, desc: '九尾真身，全属性提升', narration: '九尾妖狐真身显现' },
            { name: '魅惑之术', type: 'magic_attack', multiplier: 1.6, mp_cost: 90, desc: '魅惑敌人，降低防御', narration: '魅惑之术，心神荡漾' },
            { name: '炮烙之刑', type: 'magic_attack', multiplier: 1.8, mp_cost: 130, desc: '炮烙酷刑，烈焰灼烧', narration: '炮烙之刑，烈焰焚身' },
            { name: '酒池肉林', type: 'heal', multiplier: 0, mp_cost: 100, desc: '享乐恢复，回复生命', narration: '酒池肉林，纵情享乐' },
            { name: '轩辕坟三妖', type: 'summon', multiplier: 0.7, mp_cost: 110, desc: '召唤三妖助阵', narration: '轩辕坟三妖齐至' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '九尾妖狐', bonuses: { special_ability: 12, speed: 8 } }
        ],
        source_basis: '九尾狐、魅惑之术、炮烙、酒池肉林、轩辕坟三妖'
    },
    {
        id: 13,
        name: '二郎神',
        grade: 'S',
        source: '封神演义',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        image: '/images/arena/characters/er-lang-shen.png',
        card_image: '/images/arena/characters/er-lang-shen.png',
        stats: { power: 92, speed: 88, intelligence: 82, defense: 90, special_ability: 90, hp: 8800, mp: 700 },
        skills: [
            { name: '三尖两刃刀', type: 'physical_attack', multiplier: 1.6, mp_cost: 50, desc: '三尖两刃刀重劈', narration: '三尖两刃刀挟神力劈下' },
            { name: '天眼射线', type: 'magic_attack', multiplier: 1.7, mp_cost: 100, desc: '天眼射出神光', narration: '天眼睁开，神光射出' },
            { name: '哮天犬咬', type: 'summon', multiplier: 1.2, mp_cost: 60, desc: '哮天犬扑咬', narration: '哮天犬扑出咬击' },
            { name: '八九玄功', type: 'transform', multiplier: 0, mp_cost: 80, desc: '八九玄功变化', narration: '八九玄功施展，变化莫测' },
            { name: '天眼洞察', type: 'passive', multiplier: 0, mp_cost: 0, desc: '被动：识破幻术', narration: '天眼洞察一切' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '显圣真君', bonuses: { power: 8, special_ability: 8 } }
        ],
        source_basis: '三尖两刃刀、天眼、哮天犬、八九玄功'
    },

    // ===== 其他角色 =====
    {
        id: 2,
        name: '迪迦',
        grade: 'S',
        source: '奥特曼',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        image: '/images/arena/characters/dijia.png',
        card_image: '/images/arena/characters/dijia.png',
        stats: { power: 92, speed: 90, intelligence: 88, defense: 90, special_ability: 94, hp: 9000, mp: 700 },
        skills: [
            { name: '哉佩利敖光线', type: 'magic_attack', multiplier: 1.8, mp_cost: 100, desc: '双手交叉发射的必杀光线', narration: '哉佩利敖光线破空而至，光柱贯天' },
            { name: '复合型拳踢', type: 'physical_attack', multiplier: 1.2, mp_cost: 0, desc: '均衡型格斗术', narration: '复合型拳踢连环攻来' },
            { name: '空中型闪避', type: 'transform', multiplier: 0, mp_cost: 30, desc: '切换空中型闪避攻击', narration: '切换空中型，身形如风闪避' },
            { name: '强力型防御', type: 'transform', multiplier: 0, mp_cost: 40, desc: '切换强力型提升防御', narration: '切换强力型，防御骤然提升' },
            { name: '计时器光线', type: 'magic_attack', multiplier: 1.6, mp_cost: 120, desc: '彩色计时器发射的大招', narration: '计时器光线轰然爆发' }
        ],
        forms: [
            { name: '复合型', bonuses: {} },
            { name: '空中型', bonuses: { speed: 10, power: -10 } },
            { name: '强力型', bonuses: { defense: 15, power: 5, speed: -10 } }
        ],
        source_basis: '光之巨人、哉佩利敖光线、形态切换'
    },
    {
        id: 10,
        name: '白素贞',
        grade: 'A',
        source: '白蛇传',
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        image: '/images/arena/characters/bai-suzhen.png',
        card_image: '/images/arena/characters/bai-suzhen.png',
        stats: { power: 70, speed: 88, intelligence: 85, defense: 72, special_ability: 92, hp: 7200, mp: 1100 },
        skills: [
            { name: '水漫金山', type: 'magic_attack', multiplier: 1.8, mp_cost: 120, desc: '召唤洪水淹没敌人', narration: '水漫金山，洪水滔天而至' },
            { name: '白蛇剑法', type: 'speed_attack', multiplier: 1.4, mp_cost: 40, desc: '白蛇剑法灵动', narration: '白蛇剑法灵动如蛇' },
            { name: '千年修为', type: 'heal', multiplier: 0, mp_cost: 80, desc: '千年修为回血', narration: '千年修为运转，恢复生机' },
            { name: '化形术', type: 'transform', multiplier: 0, mp_cost: 50, desc: '化形躲避攻击', narration: '化形术施展，身形变幻' },
            { name: '雷峰塔印', type: 'magic_attack', multiplier: 1.5, mp_cost: 90, desc: '雷峰塔印镇压', narration: '雷峰塔印凌空镇压' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '千年蛇仙', bonuses: { special_ability: 10, intelligence: 5 } }
        ],
        source_basis: '水漫金山、白蛇剑法、千年修为、化形术、雷峰塔'
    },
    {
        id: 11,
        name: '后羿',
        grade: 'S',
        source: '山海经',
        gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        image: '/images/arena/characters/hou-yi.png',
        card_image: '/images/arena/characters/hou-yi.png',
        stats: { power: 95, speed: 90, intelligence: 75, defense: 80, special_ability: 88, hp: 8500, mp: 600 },
        skills: [
            { name: '射日神箭', type: 'physical_attack', multiplier: 2.0, mp_cost: 150, desc: '射日神箭，曾射落九日', narration: '射日神箭离弦，挟射日之威' },
            { name: '连珠箭', type: 'speed_attack', multiplier: 1.5, mp_cost: 60, desc: '连珠箭连续射击', narration: '连珠箭连续射出' },
            { name: '穿云箭', type: 'physical_attack', multiplier: 1.6, mp_cost: 80, desc: '穿云箭破防', narration: '穿云箭破空而至' },
            { name: '神弓格挡', type: 'transform', multiplier: 0, mp_cost: 40, desc: '神弓格挡攻击', narration: '神弓格挡，化解攻击' },
            { name: '猎人本能', type: 'passive', multiplier: 0, mp_cost: 0, desc: '被动：暴击率提升', narration: '猎人本能洞察弱点' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '射日英雄', bonuses: { power: 8, speed: 5 } }
        ],
        source_basis: '射日神箭、连珠箭、穿云箭、神弓'
    },
    {
        id: 14,
        name: '项羽',
        grade: 'A',
        source: '史记',
        gradient: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
        image: '/images/arena/characters/xiang-yu.png',
        card_image: '/images/arena/characters/xiang-yu.png',
        stats: { power: 96, speed: 80, intelligence: 65, defense: 88, special_ability: 60, hp: 9200, mp: 400 },
        skills: [
            { name: '霸王举鼎', type: 'physical_attack', multiplier: 1.8, mp_cost: 80, desc: '霸王举鼎之力重击', narration: '霸王举鼎之力爆发' },
            { name: '破釜沉舟', type: 'physical_attack', multiplier: 1.6, mp_cost: 100, desc: '破釜沉舟背水一战', narration: '破釜沉舟，决死一击' },
            { name: '乌骓突袭', type: 'speed_attack', multiplier: 1.4, mp_cost: 50, desc: '乌骓马突袭', narration: '乌骓马疾驰突袭' },
            { name: '霸王怒', type: 'transform', multiplier: 0, mp_cost: 60, desc: '霸王怒提升攻击', narration: '霸王怒发，气势暴涨' },
            { name: '虞姬剑舞', type: 'transform', multiplier: 0, mp_cost: 40, desc: '虞姬剑舞鼓舞', narration: '虞姬剑舞，士气大振' }
        ],
        forms: [
            { name: '基础', bonuses: {} },
            { name: '西楚霸王', bonuses: { power: 10, defense: 5 } }
        ],
        source_basis: '霸王举鼎、破釜沉舟、乌骓马、虞姬'
    }
];
