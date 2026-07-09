// story-dag.js - 剧情养成系统 DAG 节点图
// 按策划案 GDD 2.5节 + v3 8.2节设计
// 每本小说为独立 DAG，节点类型：story / skill_unlock / form_unlock / battle / ending
// 玩家通过推进节点、做选择影响角色成长方向，关键节点解锁技能/形态

// 节点结构规范：
// {
//   id: 'node_001',                  // 节点唯一ID
//   title: '石猴出世',                // 节点标题
//   chapter: '第一回',                // 所属章节
//   type: 'story',                    // story | skill_unlock | form_unlock | battle | ending
//   description: '...',               // 节点描述（可被AI润色）
//   choices: [                        // story/skill_unlock/form_unlock 节点的选择分支
//     {
//       id: 'choice_001_a',
//       text: '称王花果山',
//       next_node: 'node_002',
//       effects: { power: +3, charisma: +2 },   // 选择带来的属性成长
//       unlocks: null                              // 解锁内容（技能/形态ID）
//     }
//   ],
//   skill_unlocked: {...},            // skill_unlock 节点：自动解锁的技能
//   form_unlocked: {...},             // form_unlock 节点：自动解锁的形态
//   enemy: {...},                     // battle 节点：PVE 敌人
//   victory_next: 'node_005',         // battle 节点：胜利后跳转
//   defeat_next: 'node_006',          // battle 节点：失败后跳转
//   ending_type: 'good'               // ending 节点：结局类型 good/neutral/bad
// }

const STORY_DAGS = {
  // ============================================================
  // 西游记 - 孙悟空主线 DAG
  // ============================================================
  xiyouji: {
    novel_id: 'xiyouji_v1',
    title: '西游记',
    character_source: '西游记',
    start_node: 'node_001',
    nodes: {
      node_001: {
        id: 'node_001',
        title: '石猴出世',
        chapter: '第一回',
        type: 'story',
        description: '花果山巅，仙石迸裂，化作一只石猴。你目运两道金光，射冲斗府，惊动玉帝。群猴探水源至瀑布后，发现水帘洞，敢跳入者拜为王。',
        choices: [
          {
            id: 'choice_001_a',
            text: '勇敢跃入水帘洞，称王花果山',
            next_node: 'node_002',
            effects: { power: +3, defense: +2 },
            unlocks: null
          },
          {
            id: 'choice_001_b',
            text: '云游四海，寻仙访道求长生',
            next_node: 'node_003',
            effects: { intelligence: +3, speed: +2 },
            unlocks: null
          }
        ]
      },
      node_002: {
        id: 'node_002',
        title: '称王花果山',
        chapter: '第一回',
        type: 'story',
        description: '你跃入瀑布，安坐石座，群猴拜为美猴王。日日宴饮，不知岁月。然而一日忽念生死之事，忧从中来，决意出海寻访仙道。',
        choices: [
          {
            id: 'choice_002_a',
            text: '扎筏出海，直奔南赡部洲',
            next_node: 'node_003',
            effects: { speed: +3, intelligence: +2 },
            unlocks: null
          }
        ]
      },
      node_003: {
        id: 'node_003',
        title: '拜师菩提祖师',
        chapter: '第二回',
        type: 'skill_unlock',
        description: '你渡海至西牛贺洲灵台方寸山，拜入菩提祖师门下，赐名孙悟空。祖师问你欲学何道——',
        skill_unlocked: {
          name: '七十二变',
          type: 'transform',
          multiplier: 0,
          mp_cost: 50,
          desc: '变化莫测，躲避攻击，可化为万物形相'
        },
        choices: [
          {
            id: 'choice_003_a',
            text: '专修七十二变，专精一门',
            next_node: 'node_004',
            effects: { special_ability: +5, intelligence: +2 },
            unlocks: 'skill:qi_shi_er_bian'
          },
          {
            id: 'choice_003_b',
            text: '兼修筋斗云，习得腾云之术',
            next_node: 'node_004',
            effects: { speed: +8, special_ability: +2 },
            unlocks: 'skill:jin_dou_yun'
          }
        ]
      },
      node_004: {
        id: 'node_004',
        title: '龙宫取宝',
        chapter: '第三回',
        type: 'skill_unlock',
        description: '你下东海龙宫，借（强取）定海神针——如意金箍棒，一万三千五百斤。龙王不敢阻拦，你携宝而归。',
        skill_unlocked: {
          name: '如意金箍棒·砸',
          type: 'physical_attack',
          multiplier: 1.5,
          mp_cost: 0,
          desc: '金箍棒挟万钧之力砸下，地动山摇'
        },
        choices: [
          {
            id: 'choice_004_a',
            text: '再索一套披挂，威风凛凛',
            next_node: 'node_005',
            effects: { defense: +5, power: +2 },
            unlocks: 'skill:jin_gu_bang'
          },
          {
            id: 'choice_004_b',
            text: '得棒即走，速归花果山',
            next_node: 'node_005',
            effects: { speed: +3, power: +3 },
            unlocks: 'skill:jin_gu_bang'
          }
        ]
      },
      node_005: {
        id: 'node_005',
        title: '大闹天宫',
        chapter: '第七回',
        type: 'form_unlock',
        description: '你嫌弼马温官小，自封齐天大圣，搅乱蟠桃宴，偷吃太上老君金丹。十万天兵天将围剿花果山，你拔毫毛化分身，与天庭一战！',
        form_unlocked: {
          name: '齐天大圣',
          bonuses: { power: +5, speed: +3 },
          desc: '大闹天宫之姿，战意滔天'
        },
        choices: [
          {
            id: 'choice_005_a',
            text: '与天庭死战，扬名三界',
            next_node: 'node_006',
            effects: { power: +5, special_ability: +3 },
            unlocks: 'form:qi_tian_da_sheng'
          },
          {
            id: 'choice_005_b',
            text: '智取不智斗，戏耍天兵',
            next_node: 'node_006',
            effects: { intelligence: +5, speed: +3 },
            unlocks: 'form:qi_tian_da_sheng'
          }
        ]
      },
      node_006: {
        id: 'node_006',
        title: '大战二郎神',
        chapter: '第六回',
        type: 'battle',
        description: '玉帝调二郎神杨戬率梅山七兄弟围攻花果山。你与杨戬斗法七十二变，势均力敌。此战决定你能否脱身！',
        enemy: {
          name: '二郎神杨戬',
          grade: 'S',
          source: '封神演义',
          stats: { power: 92, speed: 88, intelligence: 82, defense: 90, special_ability: 90, hp: 8800, mp: 700 },
          skills: [
            { name: '三尖两刃刀', type: 'physical_attack', multiplier: 1.6, mp_cost: 50, desc: '重劈' },
            { name: '天眼射线', type: 'magic_attack', multiplier: 1.7, mp_cost: 100, desc: '天眼神光' }
          ]
        },
        victory_next: 'node_007',
        defeat_next: 'node_008'
      },
      node_007: {
        id: 'node_007',
        title: '五行山下',
        chapter: '第八回',
        type: 'story',
        description: '虽胜杨戬，却遭太上老君金刚琢偷袭，被佛祖压于五行山下。五百年后，观音点化，你愿护唐僧西天取经，修成正果。',
        choices: [
          {
            id: 'choice_007_a',
            text: '愿护唐僧取经，修成正果',
            next_node: 'node_009',
            effects: { intelligence: +5, defense: +3 },
            unlocks: null
          },
          {
            id: 'choice_007_b',
            text: '宁死不屈， retaining 野性',
            next_node: 'node_010',
            effects: { power: +5, special_ability: +3 },
            unlocks: null
          }
        ]
      },
      node_008: {
        id: 'node_008',
        title: '被擒受困',
        chapter: '第八回',
        type: 'story',
        description: '你败于杨戬之手，被金刚琢打中天灵，绳穿琵琶骨，押赴斩仙台。虽刀枪不入，却被压五行山下五百年。',
        choices: [
          {
            id: 'choice_008_a',
            text: '认命受困，等候机缘',
            next_node: 'node_009',
            effects: { intelligence: +3, defense: +2 },
            unlocks: null
          }
        ]
      },
      node_009: {
        id: 'node_009',
        title: '斗战胜佛',
        chapter: '终章',
        type: 'form_unlock',
        description: '一路降妖除魔，护唐僧抵达灵山。如来封你为斗战胜佛，金箍自落，心猿归正。你已证得大道。',
        form_unlocked: {
          name: '斗战胜佛',
          bonuses: { power: +10, intelligence: +10, defense: +10 },
          desc: '成佛之姿，圆满意志'
        },
        choices: [
          {
            id: 'choice_009_a',
            text: '接受佛号，归位灵山',
            next_node: 'node_011',
            effects: { intelligence: +5, special_ability: +5 },
            unlocks: 'form:dou_zhan_sheng_fo'
          }
        ]
      },
      node_010: {
        id: 'node_010',
        title: '妖圣逍遥',
        chapter: '终章',
        type: 'ending',
        ending_type: 'neutral',
        description: '你挣脱五行山，重返花果山，自立为妖圣。天庭不敢再犯，三界亦传你威名。然孤独常伴，无人与共。'
      },
      node_011: {
        id: 'node_011',
        title: '成佛归真',
        chapter: '终章',
        type: 'ending',
        ending_type: 'good',
        description: '你证得斗战胜佛之位，金身永驻，万古流芳。从石猴到佛果，一路跌宕，终成大道。此乃西游记之圆满结局。'
      }
    }
  },

  // ============================================================
  // 三国演义 - 关羽 / 诸葛亮 / 赵云 主线 DAG
  // ============================================================
  sanguo: {
    novel_id: 'sanguo_v1',
    title: '三国演义',
    character_source: '三国演义',
    start_node: 'node_001',
    nodes: {
      node_001: {
        id: 'node_001',
        title: '桃园结义',
        chapter: '第一回',
        type: 'story',
        description: '黄巾贼起，天下大乱。你与刘备、张飞于桃园结为异姓兄弟，誓同生死，匡扶汉室。',
        choices: [
          {
            id: 'choice_001_a',
            text: '习武强身，专注刀法',
            next_node: 'node_002',
            effects: { power: +5, defense: +2 },
            unlocks: null
          },
          {
            id: 'choice_001_b',
            text: '研读兵法，通晓谋略',
            next_node: 'node_002',
            effects: { intelligence: +5, speed: +2 },
            unlocks: null
          }
        ]
      },
      node_002: {
        id: 'node_002',
        title: '温酒斩华雄',
        chapter: '第五回',
        type: 'skill_unlock',
        description: '十八路诸侯讨董卓，华雄连斩数将。你主动请缨，曹操斟热酒壮行。你道"酒且斟下，某去便来"，出帐提刀。',
        skill_unlocked: {
          name: '温酒斩华雄',
          type: 'physical_attack',
          multiplier: 1.8,
          mp_cost: 30,
          desc: '一刀制敌，速斩敌将'
        },
        choices: [
          {
            id: 'choice_002_a',
            text: '速战速决，一合斩之',
            next_node: 'node_003',
            effects: { power: +5, speed: +3 },
            unlocks: 'skill:wen_jiu_zhan_hua_xiong'
          }
        ]
      },
      node_003: {
        id: 'node_003',
        title: '青龙偃月',
        chapter: '第四回',
        type: 'skill_unlock',
        description: '你铸青龙偃月刀，重八十二斤，又名冷艳锯。刀成之日，寒光照夜，自此刀不离手。',
        skill_unlocked: {
          name: '青龙偃月斩',
          type: 'physical_attack',
          multiplier: 1.6,
          mp_cost: 0,
          desc: '青龙偃月刀全力一斩'
        },
        choices: [
          {
            id: 'choice_003_a',
            text: '日夜操练，刀法大成',
            next_node: 'node_004',
            effects: { power: +4, defense: +2 },
            unlocks: 'skill:qing_long_yan_yue_zhan'
          }
        ]
      },
      node_004: {
        id: 'node_004',
        title: '千里走单骑',
        chapter: '第二十七回',
        type: 'form_unlock',
        description: '得知刘备下落，你挂印封金，护送嫂嫂千里寻兄。过五关斩六将，古城相会。此战彰显你的忠义！',
        form_unlocked: {
          name: '武圣',
          bonuses: { power: +8, defense: +5 },
          desc: '忠义武圣，威震华夏'
        },
        choices: [
          {
            id: 'choice_004_a',
            text: '过五关斩六将，单骑千里',
            next_node: 'node_005',
            effects: { power: +5, speed: +3 },
            unlocks: 'form:wu_sheng'
          }
        ]
      },
      node_005: {
        id: 'node_005',
        title: '大战夏侯惇',
        chapter: '第二十八回',
        type: 'battle',
        description: '过五关途中，夏侯惇追来厮杀。你回马迎战，刀光霍霍，此战将决定你能否顺利渡河！',
        enemy: {
          name: '夏侯惇',
          grade: 'A',
          source: '三国演义',
          stats: { power: 85, speed: 70, intelligence: 55, defense: 80, special_ability: 50, hp: 7500, mp: 300 },
          skills: [
            { name: '拔矢啖睛', type: 'physical_attack', multiplier: 1.4, mp_cost: 0, desc: '怒目挥枪' }
          ]
        },
        victory_next: 'node_006',
        defeat_next: 'node_007'
      },
      node_006: {
        id: 'node_006',
        title: '水淹七军',
        chapter: '第七十四回',
        type: 'skill_unlock',
        description: '镇守荆州，围曹仁于樊城。于禁督七军来救，你乘秋雨汉水暴涨，决堤淹之，生擒于禁，斩庞德，威震华夏。',
        skill_unlocked: {
          name: '水淹七军',
          type: 'magic_attack',
          multiplier: 1.5,
          mp_cost: 80,
          desc: '借水势淹灭敌军'
        },
        choices: [
          {
            id: 'choice_006_a',
            text: '乘胜追击，围攻樊城',
            next_node: 'node_008',
            effects: { intelligence: +5, special_ability: +3 },
            unlocks: 'skill:shui_yan_qi_jun'
          }
        ]
      },
      node_007: {
        id: 'node_007',
        title: '败走麦城',
        chapter: '第七十六回',
        type: 'story',
        description: '吕蒙白衣渡江袭取荆州，你腹背受敌，败走麦城。父子被擒，宁死不屈。虽败，忠义永存。',
        choices: [
          {
            id: 'choice_007_a',
            text: '宁死不屈，慷慨就义',
            next_node: 'node_009',
            effects: { defense: +5, intelligence: +3 },
            unlocks: null
          }
        ]
      },
      node_008: {
        id: 'node_008',
        title: '威震华夏',
        chapter: '终章',
        type: 'ending',
        ending_type: 'good',
        description: '你水淹七军，威震华夏，曹操几欲迁都。虽后有麦城之败，然忠义武圣之名，永传后世。此乃三国之英雄结局。'
      },
      node_009: {
        id: 'node_009',
        title: '忠义千秋',
        chapter: '终章',
        type: 'ending',
        ending_type: 'neutral',
        description: '麦城一败，英魂归天。然你忠义之名，千秋传颂，后封武圣帝君，与孔孟并祀。此乃忠义之结局。'
      }
    }
  },

  // ============================================================
  // 封神演义 - 姜子牙 / 哪吒 / 二郎神 主线 DAG
  // ============================================================
  fengshen: {
    novel_id: 'fengshen_v1',
    title: '封神演义',
    character_source: '封神演义',
    start_node: 'node_001',
    nodes: {
      node_001: {
        id: 'node_001',
        title: '昆仑学道',
        chapter: '第十五回',
        type: 'story',
        description: '你拜入昆仑山玉虚宫元始天尊门下，习道四十年。师尊赐你打神鞭、杏黄旗，命你下山辅佐明君，主持封神。',
        choices: [
          {
            id: 'choice_001_a',
            text: '专修封神大法',
            next_node: 'node_002',
            effects: { special_ability: +5, intelligence: +3 },
            unlocks: null
          },
          {
            id: 'choice_001_b',
            text: '兼修奇门遁甲',
            next_node: 'node_002',
            effects: { intelligence: +5, speed: +2 },
            unlocks: null
          }
        ]
      },
      node_002: {
        id: 'node_002',
        title: '渭水钓鱼',
        chapter: '第二十四回',
        type: 'skill_unlock',
        description: '你隐居磻溪，直钩钓鱼，愿者上钩。周文王夜梦飞熊，三访贤士，请你出山辅佐西周。',
        skill_unlocked: {
          name: '打神鞭',
          type: 'magic_attack',
          multiplier: 1.7,
          mp_cost: 100,
          desc: '专打封神榜上人'
        },
        choices: [
          {
            id: 'choice_002_a',
            text: '出山辅周，主持封神',
            next_node: 'node_003',
            effects: { intelligence: +5, special_ability: +3 },
            unlocks: 'skill:da_shen_bian'
          }
        ]
      },
      node_003: {
        id: 'node_003',
        title: '封神大法',
        chapter: '第五十回',
        type: 'skill_unlock',
        description: '破诛仙阵后，你修成封神大法。此术可封印封神榜上有名之人，使其归位星君。',
        skill_unlocked: {
          name: '封神术',
          type: 'magic_attack',
          multiplier: 1.8,
          mp_cost: 150,
          desc: '封印敌人，归位星君'
        },
        choices: [
          {
            id: 'choice_003_a',
            text: '专修封神术，大成',
            next_node: 'node_004',
            effects: { special_ability: +8, intelligence: +3 },
            unlocks: 'skill:feng_shen_shu'
          }
        ]
      },
      node_004: {
        id: 'node_004',
        title: '封神之体',
        chapter: '第九十九回',
        type: 'form_unlock',
        description: '你主持封神大业有功，元始天尊赐你封神之体，自此神通广大，万法不侵。',
        form_unlocked: {
          name: '封神',
          bonuses: { special_ability: +10, intelligence: +5 },
          desc: '主持封神之体，法力无边'
        },
        choices: [
          {
            id: 'choice_004_a',
            text: '接受封神之体',
            next_node: 'node_005',
            effects: { special_ability: +5, defense: +3 },
            unlocks: 'form:feng_shen'
          }
        ]
      },
      node_005: {
        id: 'node_005',
        title: '大战申公豹',
        chapter: '第八十回',
        type: 'battle',
        description: '申公豹屡屡与西周作对，挑唆众妖道阻挠封神。今日他亲自来犯，你需以封神大法将其降伏！',
        enemy: {
          name: '申公豹',
          grade: 'S',
          source: '封神演义',
          stats: { power: 70, speed: 75, intelligence: 92, defense: 70, special_ability: 90, hp: 7000, mp: 1200 },
          skills: [
            { name: '飞头之术', type: 'magic_attack', multiplier: 1.5, mp_cost: 80, desc: '妖术惑人' },
            { name: '挑拨离间', type: 'transform', multiplier: 0, mp_cost: 60, desc: '扰乱心智' }
          ]
        },
        victory_next: 'node_006',
        defeat_next: 'node_007'
      },
      node_006: {
        id: 'node_006',
        title: '封神归位',
        chapter: '第一百回',
        type: 'story',
        description: '武王伐纣功成，封神台前，你宣读元始天尊符命，册封三百六十五位正神。封神大业圆满。',
        choices: [
          {
            id: 'choice_006_a',
            text: '主持封神，功成身退',
            next_node: 'node_008',
            effects: { intelligence: +5, special_ability: +5 },
            unlocks: null
          }
        ]
      },
      node_007: {
        id: 'node_007',
        title: '封神失败',
        chapter: '终章',
        type: 'ending',
        ending_type: 'bad',
        description: '你败于申公豹之手，封神榜被夺，神位错乱。武王虽得天下，然三界失序，神道式微。此乃封神之遗憾结局。'
      },
      node_008: {
        id: 'node_008',
        title: '齐天封神',
        chapter: '终章',
        type: 'ending',
        ending_type: 'good',
        description: '你主持封神圆满，元始天尊嘉奖，封你为东岳泰山齐天仁圣大帝。自此永镇东方，香火不绝。此乃封神之圆满结局。'
      }
    }
  },

  // ============================================================
  // 水浒传 - 鲁智深 / 武松 主线 DAG
  // ============================================================
  shuihu: {
    novel_id: 'shuihu_v1',
    title: '水浒传',
    character_source: '水浒传',
    start_node: 'node_001',
    nodes: {
      node_001: {
        id: 'node_001',
        title: '提辖在身',
        chapter: '第三回',
        type: 'story',
        description: '你乃渭州经略府提辖，姓鲁名达，人称鲁智深。一日于酒楼听闻金氏父女受镇关西欺压，怒从心起。',
        choices: [
          {
            id: 'choice_001_a',
            text: '拳打镇关西，伸张正义',
            next_node: 'node_002',
            effects: { power: +5, defense: +2 },
            unlocks: null
          },
          {
            id: 'choice_001_b',
            text: '赠银了事，息事宁人',
            next_node: 'node_002',
            effects: { intelligence: +3, defense: +3 },
            unlocks: null
          }
        ]
      },
      node_002: {
        id: 'node_002',
        title: '五台山出家',
        chapter: '第四回',
        type: 'skill_unlock',
        description: '为避人命官司，你上五台山剃度为僧，赐名智深。然你酒后乱禅，打坏山门金刚，被荐往东京大相国寺。',
        skill_unlocked: {
          name: '疯魔杖法',
          type: 'physical_attack',
          multiplier: 1.6,
          mp_cost: 20,
          desc: '禅杖挥舞如疯魔'
        },
        choices: [
          {
            id: 'choice_002_a',
            text: '习得疯魔杖法',
            next_node: 'node_003',
            effects: { power: +5, special_ability: +2 },
            unlocks: 'skill:feng_mo_zhang_fa'
          }
        ]
      },
      node_003: {
        id: 'node_003',
        title: '倒拔垂杨柳',
        chapter: '第七回',
        type: 'skill_unlock',
        description: '于大相国寺管菜园，众泼皮欲戏弄你，你反手倒拔垂杨柳，惊呆众人。此举彰显你天生神力！',
        skill_unlocked: {
          name: '倒拔垂杨柳',
          type: 'physical_attack',
          multiplier: 1.5,
          mp_cost: 0,
          desc: '天生神力，拔树如草'
        },
        choices: [
          {
            id: 'choice_003_a',
            text: '力拔山河，威慑四方',
            next_node: 'node_004',
            effects: { power: +8, defense: +3 },
            unlocks: 'skill:dao_ba_chui_yang_liu'
          }
        ]
      },
      node_004: {
        id: 'node_004',
        title: '野猪林救友',
        chapter: '第九回',
        type: 'form_unlock',
        description: '林冲被高俅陷害发配沧州，你一路暗中护送，于野猪林救其性命。此战彰显你的义气！',
        form_unlocked: {
          name: '花和尚',
          bonuses: { power: +5, defense: +5 },
          desc: '出家而不守戒，仗义而勇无双'
        },
        choices: [
          {
            id: 'choice_004_a',
            text: '护送林冲至沧州',
            next_node: 'node_005',
            effects: { defense: +5, intelligence: +2 },
            unlocks: 'form:hua_he_shang'
          }
        ]
      },
      node_005: {
        id: 'node_005',
        title: '大战邓元觉',
        chapter: '第一一八回',
        type: 'battle',
        description: '征方腊途中，遇方腊麾下宝光国师邓元觉，亦是使禅杖的高僧。两僧斗五十合不分胜负，此战决生死！',
        enemy: {
          name: '邓元觉',
          grade: 'A',
          source: '水浒传',
          stats: { power: 88, speed: 70, intelligence: 55, defense: 85, special_ability: 40, hp: 8000, mp: 300 },
          skills: [
            { name: '禅杖重击', type: 'physical_attack', multiplier: 1.5, mp_cost: 0, desc: '禅杖猛砸' }
          ]
        },
        victory_next: 'node_006',
        defeat_next: 'node_007'
      },
      node_006: {
        id: 'node_006',
        title: '坐化浙江',
        chapter: '终章',
        type: 'story',
        description: '征方腊后，你于杭州六和塔听闻钱塘潮信，顿悟前生，坐化而终。偈曰：平生不修善果，只爱杀人放火。忽地顿开金枷，这里指见真性。',
        choices: [
          {
            id: 'choice_006_a',
            text: '坐化成佛，圆寂归真',
            next_node: 'node_008',
            effects: { intelligence: +8, special_ability: +5 },
            unlocks: null
          }
        ]
      },
      node_007: {
        id: 'node_007',
        title: '战死沙场',
        chapter: '终章',
        type: 'ending',
        ending_type: 'bad',
        description: '你败于邓元觉之手，征方腊途中战死。一生豪气，化作英魂。此乃水浒之悲壮结局。'
      },
      node_008: {
        id: 'node_008',
        title: '顿悟成佛',
        chapter: '终章',
        type: 'ending',
        ending_type: 'good',
        description: '你坐化六和塔，圆寂证果。鲁智深一生快意恩仇，终成正果。此乃水浒之圆满结局。'
      }
    }
  },

  // ============================================================
  // 红楼梦 - 林黛玉 主线 DAG
  // ============================================================
  honglou: {
    novel_id: 'honglou_v1',
    title: '红楼梦',
    character_source: '红楼梦',
    start_node: 'node_001',
    nodes: {
      node_001: {
        id: 'node_001',
        title: '黛玉进府',
        chapter: '第三回',
        type: 'story',
        description: '你乃扬州巡盐御史林如海之女，因母丧投奔外祖母贾母。入荣国府，步步留心，时时在意，唯恐被人耻笑。',
        choices: [
          {
            id: 'choice_001_a',
            text: '谨慎守礼，步步留心',
            next_node: 'node_002',
            effects: { intelligence: +5, defense: +2 },
            unlocks: null
          },
          {
            id: 'choice_001_b',
            text: '率真任性，随心而行',
            next_node: 'node_002',
            effects: { special_ability: +3, intelligence: +3 },
            unlocks: null
          }
        ]
      },
      node_002: {
        id: 'node_002',
        title: '共读西厢',
        chapter: '第二十三回',
        type: 'skill_unlock',
        description: '于沁芳闸桥边，你与宝玉共读《西厢记》。落花满地，词句惊心。你以"多愁多病身"自喻，宝玉以"倾国倾城貌"相答。',
        skill_unlocked: {
          name: '诗词才情',
          type: 'magic_attack',
          multiplier: 1.3,
          mp_cost: 30,
          desc: '出口成章，词锋如剑'
        },
        choices: [
          {
            id: 'choice_002_a',
            text: '沉浸诗书，才情日进',
            next_node: 'node_003',
            effects: { intelligence: +5, special_ability: +3 },
            unlocks: 'skill:shi_ci_cai_qing'
          }
        ]
      },
      node_003: {
        id: 'node_003',
        title: '葬花吟',
        chapter: '第二十七回',
        type: 'form_unlock',
        description: '见落花满地，无人怜惜，你荷锄葬花，吟《葬花吟》："花谢花飞花满天，红消香断有谁怜？"宝玉闻之恸倒。',
        form_unlocked: {
          name: '葬花人',
          bonuses: { intelligence: +8, special_ability: +5 },
          desc: '葬花吟诗，多愁善感'
        },
        choices: [
          {
            id: 'choice_003_a',
            text: '以诗寄情，感怀身世',
            next_node: 'node_004',
            effects: { intelligence: +5, special_ability: +5 },
            unlocks: 'form:zang_hua_ren'
          }
        ]
      },
      node_004: {
        id: 'node_004',
        title: '诗社夺魁',
        chapter: '第三十七回',
        type: 'skill_unlock',
        description: '海棠诗社成立，你以《咏菊》《问菊》《菊梦》三首夺魁。才情压倒群芳，众人叹服。',
        skill_unlocked: {
          name: '海棠诗魁',
          type: 'magic_attack',
          multiplier: 1.5,
          mp_cost: 50,
          desc: '诗社夺魁，词锋压众'
        },
        choices: [
          {
            id: 'choice_004_a',
            text: '诗社夺魁，名扬大观园',
            next_node: 'node_005',
            effects: { intelligence: +5, special_ability: +5 },
            unlocks: 'skill:hai_tang_shi_kui'
          }
        ]
      },
      node_005: {
        id: 'node_005',
        title: '焚稿断痴情',
        chapter: '第九十七回',
        type: 'battle',
        description: '宝玉将娶宝钗，你病入膏肓。你焚毁诗稿旧帕，断痴情，与宝玉之情，化为灰烬。此乃心境之战！',
        enemy: {
          name: '心病',
          grade: 'A',
          source: '红楼梦',
          stats: { power: 60, speed: 50, intelligence: 90, defense: 40, special_ability: 85, hp: 5000, mp: 1000 },
          skills: [
            { name: '相思之苦', type: 'magic_attack', multiplier: 1.4, mp_cost: 50, desc: '心如刀割' },
            { name: '绝望侵蚀', type: 'transform', multiplier: 0, mp_cost: 80, desc: '削减斗志' }
          ]
        },
        victory_next: 'node_006',
        defeat_next: 'node_007'
      },
      node_006: {
        id: 'node_006',
        title: '魂归离恨天',
        chapter: '终章',
        type: 'ending',
        ending_type: 'neutral',
        description: '你战胜心病，焚稿断情，魂归离恨天。一生诗才，化作太虚幻境之绛珠仙草，还泪已尽，归位仙班。此乃红楼之超脱结局。'
      },
      node_007: {
        id: 'node_007',
        title: '泪尽而亡',
        chapter: '终章',
        type: 'ending',
        ending_type: 'bad',
        description: '心病胜你，你泪尽而亡。宝玉婚后方知真相，出家为僧。一生情缘，终成空梦。此乃红楼之悲剧结局。'
      }
    }
  }
};

// ============================================================
// 工具函数
// ============================================================

/**
 * 根据书籍标题获取对应的 DAG
 * @param {string} bookTitle - 书籍标题（如"西游记"）
 * @returns {Object|null} DAG 对象
 */
function getDagByBookTitle(bookTitle) {
  if (!bookTitle) return null;
  // 标题匹配：支持 "西游记"、"西游记（缩写版）" 等变体
  const normalizedTitle = bookTitle.trim();
  for (const key of Object.keys(STORY_DAGS)) {
    const dag = STORY_DAGS[key];
    if (dag.title === normalizedTitle) return dag;
    if (normalizedTitle.startsWith(dag.title)) return dag;
  }
  return null;
}

/**
 * 根据 novel_id 获取 DAG
 */
function getDagByNovelId(novelId) {
  for (const key of Object.keys(STORY_DAGS)) {
    if (STORY_DAGS[key].novel_id === novelId) return STORY_DAGS[key];
  }
  return null;
}

/**
 * 获取 DAG 的起始节点
 */
function getStartNode(dag) {
  if (!dag || !dag.start_node) return null;
  return dag.nodes[dag.start_node] || null;
}

/**
 * 根据 node_id 获取节点
 */
function getNode(dag, nodeId) {
  if (!dag || !nodeId) return null;
  return dag.nodes[nodeId] || null;
}

/**
 * 根据 choice_id 获取选择对象
 */
function getChoice(node, choiceId) {
  if (!node || !node.choices) return null;
  return node.choices.find(c => c.id === choiceId) || null;
}

/**
 * 列出所有可用的 DAG（用于 /api/story/dags 端点）
 */
function listAvailableDags() {
  return Object.keys(STORY_DAGS).map(key => {
    const dag = STORY_DAGS[key];
    const nodeCount = Object.keys(dag.nodes).length;
    const nodeTypes = {};
    Object.values(dag.nodes).forEach(n => {
      nodeTypes[n.type] = (nodeTypes[n.type] || 0) + 1;
    });
    return {
      novel_id: dag.novel_id,
      title: dag.title,
      character_source: dag.character_source,
      node_count: nodeCount,
      node_types: nodeTypes,
      start_node: dag.start_node
    };
  });
}

module.exports = {
  STORY_DAGS,
  getDagByBookTitle,
  getDagByNovelId,
  getStartNode,
  getNode,
  getChoice,
  listAvailableDags
};
