class_name GameContent
extends RefCounted

const BOOKS: Array[Dictionary] = [
  {
    "id": "xiyouji",
    "title": "西游记",
    "author": "吴承恩",
    "description": "东胜神洲傲来国花果山石卵化猴，踏破九幽闹天宫。西行十万八千里，九九八十一难，每一次因果抉择，皆在重构三界神佛秩序。",
    "quote": "鸿蒙初辟原无姓，打破顽空须悟空。金箍当头，棒指灵霄。",
    "realm_tag": "灵山三界 · 神魔试炼",
    "cover_path": "res://assets/art/books/xiyouji-sun-wukong.png",
    "accent": "#d6a75d",
    "playable": true,
    "story_graph_id": "xiyouji_main"
  },
  {
    "id": "sanguo",
    "title": "三国演义",
    "author": "罗贯中",
    "description": "东汉末年群雄并起，桃园三结义奠蜀汉基业，赤壁烽火裂三分鼎足。羽扇纶巾间定乾坤，锦囊妙计里定兴亡。",
    "quote": "滚滚长江东逝水，浪花淘尽英雄。是非成败转头空，青山依旧在。",
    "realm_tag": "烽烟赤壁 · 九州鼎峙",
    "cover_path": "res://assets/art/books/sanguo-guanyu.png",
    "accent": "#a9473f",
    "playable": false,
    "story_graph_id": ""
  },
  {
    "id": "fengshen",
    "title": "封神演义",
    "author": "许仲琳",
    "description": "商周易代，阐截两教仙家各显神通。太公执榜定三百六十五位正神，莲花化身踏风火乾坤，诛仙万仙大阵激荡洪荒。",
    "quote": "万仙大阵鬼神愁，封神台上姓名收。劫数难逃天地意，何须阐截论恩仇。",
    "realm_tag": "岐山封神 · 万仙大阵",
    "cover_path": "res://assets/art/books/fengshen-nezha.png",
    "accent": "#d77a35",
    "playable": false,
    "story_graph_id": ""
  },
  {
    "id": "honglou",
    "title": "红楼梦",
    "author": "曹雪芹",
    "description": "姑苏绛珠仙草偿泪前缘，贾府钟鸣鼎食与衰亡兴歇。太虚幻境警幻仙曲，十二金钗册页尽写浮生幻梦。",
    "quote": "满纸荒唐言，一把辛酸泪。都云作者痴，谁解其中味？",
    "realm_tag": "太虚幻境 · 大观浮沉",
    "cover_path": "res://assets/art/books/hongloumeng-lindaiyu.png",
    "accent": "#b8697a",
    "playable": false,
    "story_graph_id": ""
  },
  {
    "id": "shuihu",
    "title": "水浒传",
    "author": "施耐庵",
    "description": "三十六天罡、七十二地煞啸聚梁山泊。景阳冈打虎豪情，风雪山神庙怒火，忠义堂前大纛高扬，尽显江湖快意恩仇。",
    "quote": "聚散水泊英雄泪，替天行道义字当。横刀仗义笑生死，浩气长存贯日光。",
    "realm_tag": "水泊梁山 · 替天行道",
    "cover_path": "res://assets/art/books/shuihuzhuan-wusong.png",
    "accent": "#61847a",
    "playable": false,
    "story_graph_id": ""
  },
  {
    "id": "baishe",
    "title": "白蛇传",
    "author": "民间经典",
    "description": "千年白蛇感念恩德化形凡世，断桥借伞定良缘。盗仙草、斗法海、水漫金山寺，一曲至死不渝的仙凡绝恋。",
    "quote": "十年修得同船渡，百年修得共枕眠。水漫金山寻夫骨，雷峰塔下断前尘。",
    "realm_tag": "断桥烟雨 · 金山怒涛",
    "cover_path": "res://assets/art/books/baisuzhen-baishezhuan.png",
    "accent": "#75a58d",
    "playable": false,
    "story_graph_id": ""
  },
  {
    "id": "shiji",
    "title": "史记",
    "author": "司马迁",
    "description": "究天人之际，通古今之变，成一家之言。项羽本纪叱咤风云、破釜沉舟，刺客列传风萧水寒，展现中国古典气节风骨之极。",
    "quote": "力拔山兮气盖世，时不利兮骓不逝。史家之绝唱，无韵之离骚。",
    "realm_tag": "垓下悲歌 · 纪传千秋",
    "cover_path": "res://assets/art/books/shiji-xiangyu.png",
    "accent": "#b49766",
    "playable": false,
    "story_graph_id": ""
  },
  {
    "id": "liaozhai",
    "title": "聊斋志异",
    "author": "蒲松龄",
    "description": "草木成精、狐魅化仙、画皮摄魄、兰若幽魂。以奇异鬼怪之事刺讽世态炎凉，笔底生花处尽显至情至性。",
    "quote": "写鬼写妖高人一等，刺贪刺虐入木三分。姑妄言之姑听之，豆棚瓜架雨如丝。",
    "realm_tag": "兰若夜话 · 幽冥狐仙",
    "cover_path": "res://assets/art/books/liaozhai-niexiaoqian.png",
    "accent": "#75659b",
    "playable": false,
    "story_graph_id": ""
  }
]

const CHARACTERS: Array[Dictionary] = [
  {
    "id": "sun_wukong",
    "book_id": "xiyouji",
    "display_name": "孙悟空",
    "description": "金箍棒一万三千五百斤、筋斗云十万八千里、七十二变、火眼金睛、毫毛分身",
    "portrait_path": "res://assets/art/characters/xiyouji-sun-wukong.png",
    "stats": {
      "attack": 98,
      "speed": 99,
      "intelligence": 85,
      "defense": 95,
      "specialAbility": 96,
      "health": 9500,
      "maxHealth": 9500,
      "mana": 800,
      "maxMana": 800,
      "critRate": 35,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "sun_wukong_skill_1",
        "name": "如意金箍棒·砸",
        "type": "physical_attack",
        "description": "金箍棒挟万钧之力砸下，地动山摇",
        "multiplier": 1.5,
        "manaCost": 0,
        "narration": "金箍棒挟万钧之力砸下，地动山摇"
      },
      {
        "id": "sun_wukong_skill_2",
        "name": "筋斗云突袭",
        "type": "speed_attack",
        "description": "筋斗云一闪而至，瞬间突袭对手",
        "multiplier": 1.3,
        "manaCost": 20,
        "narration": "驾筋斗云一闪而至，瞬息突袭对手"
      },
      {
        "id": "sun_wukong_skill_3",
        "name": "七十二变",
        "type": "transform",
        "description": "变化莫测，躲避敌方攻击",
        "multiplier": 0,
        "manaCost": 50,
        "narration": "施展七十二变，身形变幻莫测"
      },
      {
        "id": "sun_wukong_skill_4",
        "name": "火眼金睛",
        "type": "passive",
        "description": "被动：免疫幻术",
        "multiplier": 0,
        "manaCost": 0,
        "narration": "火眼金睛洞察一切"
      },
      {
        "id": "sun_wukong_skill_5",
        "name": "毫毛分身",
        "type": "summon",
        "description": "拔毫毛变分身，协同攻击",
        "multiplier": 0.6,
        "manaCost": 80,
        "narration": "拔毫毛变出分身，协同出击"
      }
    ],
    "forms": [
      {
        "id": "sun_wukong_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "sun_wukong_form_1",
        "name": "齐天大圣",
        "stats": {
          "attack": 103,
          "speed": 102
        },
        "skills": [],
        "description": "齐天大圣"
      },
      {
        "id": "sun_wukong_form_2",
        "name": "斗战胜佛",
        "stats": {
          "attack": 108,
          "intelligence": 95,
          "defense": 105
        },
        "skills": [],
        "description": "斗战胜佛"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": true
  },
  {
    "id": "tang_sanzang",
    "book_id": "xiyouji",
    "display_name": "唐僧",
    "description": "紧箍咒、锦襕袈裟、九环锡杖、白龙马、西天取经",
    "portrait_path": "res://assets/art/characters/xiyouji-tang-sanzang.png",
    "stats": {
      "attack": 20,
      "speed": 35,
      "intelligence": 88,
      "defense": 30,
      "specialAbility": 90,
      "health": 3000,
      "maxHealth": 3000,
      "mana": 1200,
      "maxMana": 1200,
      "critRate": 31,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "tang_sanzang_skill_1",
        "name": "紧箍咒",
        "type": "magic_attack",
        "description": "念动紧箍咒，压制敌人",
        "multiplier": 1.6,
        "manaCost": 80,
        "narration": "紧箍咒响起，头痛欲裂"
      },
      {
        "id": "tang_sanzang_skill_2",
        "name": "袈裟护体",
        "type": "transform",
        "description": "锦襕袈裟护体，提升防御",
        "multiplier": 0,
        "manaCost": 60,
        "narration": "锦襕袈裟展开，佛光护体"
      },
      {
        "id": "tang_sanzang_skill_3",
        "name": "禅杖点化",
        "type": "heal",
        "description": "禅杖点化，恢复生命",
        "multiplier": 0,
        "manaCost": 100,
        "narration": "禅杖轻点，生机涌现"
      }
    ],
    "forms": [
      {
        "id": "tang_sanzang_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "tang_sanzang_form_1",
        "name": "旃檀功德佛",
        "stats": {
          "specialAbility": 100,
          "intelligence": 98
        },
        "skills": [],
        "description": "旃檀功德佛"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "zhu_bajie",
    "book_id": "xiyouji",
    "display_name": "猪八戒",
    "description": "九齿钉耙、天罡三十六变、天蓬元帅、高老庄、净坛使者",
    "portrait_path": "res://assets/art/characters/xiyouji-zhu-bajie.png",
    "stats": {
      "attack": 82,
      "speed": 60,
      "intelligence": 55,
      "defense": 80,
      "specialAbility": 70,
      "health": 8500,
      "maxHealth": 8500,
      "mana": 500,
      "maxMana": 500,
      "critRate": 29,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "zhu_bajie_skill_1",
        "name": "九齿钉耙",
        "type": "physical_attack",
        "description": "九齿钉耙猛击",
        "multiplier": 1.5,
        "manaCost": 40,
        "narration": "九齿钉耙寒光闪闪"
      },
      {
        "id": "zhu_bajie_skill_2",
        "name": "天罡三十六变",
        "type": "transform",
        "description": "天罡变化，躲避攻击",
        "multiplier": 0,
        "manaCost": 60,
        "narration": "施展天罡三十六变"
      },
      {
        "id": "zhu_bajie_skill_3",
        "name": "贪吃恢复",
        "type": "heal",
        "description": "大吃一顿恢复体力",
        "multiplier": 0,
        "manaCost": 80,
        "narration": "风卷残云，体力恢复"
      }
    ],
    "forms": [
      {
        "id": "zhu_bajie_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "zhu_bajie_form_1",
        "name": "净坛使者",
        "stats": {
          "defense": 90,
          "health": 9000
        },
        "skills": [],
        "description": "净坛使者"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "zhuge_liang",
    "book_id": "sanguo",
    "display_name": "诸葛亮",
    "description": "空城计、八阵图、火攻、借东风、木牛流马",
    "portrait_path": "res://assets/art/characters/sanguo-zhuge-liang.png",
    "stats": {
      "attack": 40,
      "speed": 50,
      "intelligence": 98,
      "defense": 45,
      "specialAbility": 85,
      "health": 4000,
      "maxHealth": 4000,
      "mana": 1200,
      "maxMana": 1200,
      "critRate": 35,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "zhuge_liang_skill_1",
        "name": "空城计",
        "type": "transform",
        "description": "心理战，降低对手攻击",
        "multiplier": 0,
        "manaCost": 80,
        "narration": "空城计奏响，心理压制对手"
      },
      {
        "id": "zhuge_liang_skill_2",
        "name": "八阵图",
        "type": "transform",
        "description": "困敌阵法",
        "multiplier": 0,
        "manaCost": 100,
        "narration": "布下八阵图，困住对手"
      },
      {
        "id": "zhuge_liang_skill_3",
        "name": "火攻",
        "type": "magic_attack",
        "description": "烈火焚敌",
        "multiplier": 1.5,
        "manaCost": 120,
        "narration": "火攻骤起，烈焰焚天"
      }
    ],
    "forms": [
      {
        "id": "zhuge_liang_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "zhuge_liang_form_1",
        "name": "卧龙",
        "stats": {
          "intelligence": 108,
          "specialAbility": 90
        },
        "skills": [],
        "description": "卧龙出山"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "guan_yu",
    "book_id": "sanguo",
    "display_name": "关羽",
    "description": "青龙偃月刀八十二斤、赤兔马、温酒斩华雄、过五关斩六将、单刀赴会、水淹七军",
    "portrait_path": "res://assets/art/characters/sanguo-guanyu.png",
    "stats": {
      "attack": 88,
      "speed": 75,
      "intelligence": 72,
      "defense": 82,
      "specialAbility": 70,
      "health": 8200,
      "maxHealth": 8200,
      "mana": 500,
      "maxMana": 500,
      "critRate": 35,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "guan_yu_skill_1",
        "name": "青龙偃月斩",
        "type": "physical_attack",
        "description": "青龙刀横劈而下",
        "multiplier": 1.6,
        "manaCost": 50,
        "narration": "青龙偃月刀寒光横劈"
      },
      {
        "id": "guan_yu_skill_2",
        "name": "水淹七军",
        "type": "magic_attack",
        "description": "引大水淹没敌军",
        "multiplier": 1.5,
        "manaCost": 100,
        "narration": "水淹七军，洪流滔天"
      },
      {
        "id": "guan_yu_skill_3",
        "name": "温酒斩华雄",
        "type": "physical_attack",
        "description": "暴击技，瞬息制敌",
        "multiplier": 1.8,
        "manaCost": 80,
        "narration": "温酒斩华雄之勇，一刀制敌"
      }
    ],
    "forms": [
      {
        "id": "guan_yu_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "guan_yu_form_1",
        "name": "武圣",
        "stats": {
          "attack": 96,
          "defense": 87
        },
        "skills": [],
        "description": "武圣"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "cao_cao",
    "book_id": "sanguo",
    "display_name": "曹操",
    "description": "挟天子以令诸侯、孟德新书、赤壁之战、望梅止渴、魏武帝",
    "portrait_path": "res://assets/art/characters/sanguo-caocao.png",
    "stats": {
      "attack": 80,
      "speed": 75,
      "intelligence": 95,
      "defense": 78,
      "specialAbility": 90,
      "health": 8000,
      "maxHealth": 8000,
      "mana": 1000,
      "maxMana": 1000,
      "critRate": 35,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "cao_cao_skill_1",
        "name": "挟天子令诸侯",
        "type": "transform",
        "description": "号令天下，全属性提升",
        "multiplier": 0,
        "manaCost": 80,
        "narration": "挟天子以令诸侯，威势滔天"
      },
      {
        "id": "cao_cao_skill_2",
        "name": "赤壁纵火",
        "type": "magic_attack",
        "description": "火攻之计，烈焰焚天",
        "multiplier": 1.8,
        "manaCost": 150,
        "narration": "赤壁之火，燎原之势"
      }
    ],
    "forms": [
      {
        "id": "cao_cao_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "cao_cao_form_1",
        "name": "魏武帝",
        "stats": {
          "intelligence": 105,
          "specialAbility": 100
        },
        "skills": [],
        "description": "魏武帝"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "liu_bei",
    "book_id": "sanguo",
    "display_name": "刘备",
    "description": "双股剑、桃园三结义、三顾茅庐、白帝城托孤、蜀汉昭烈帝",
    "portrait_path": "res://assets/art/characters/sanguo-liubei.png",
    "stats": {
      "attack": 70,
      "speed": 65,
      "intelligence": 80,
      "defense": 72,
      "specialAbility": 85,
      "health": 7500,
      "maxHealth": 7500,
      "mana": 700,
      "maxMana": 700,
      "critRate": 35,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "liu_bei_skill_1",
        "name": "双股剑",
        "type": "physical_attack",
        "description": "双剑齐出",
        "multiplier": 1.4,
        "manaCost": 30,
        "narration": "双股剑寒光闪闪"
      },
      {
        "id": "liu_bei_skill_2",
        "name": "桃园结义",
        "type": "summon",
        "description": "召唤关羽张飞助阵",
        "multiplier": 1,
        "manaCost": 120,
        "narration": "桃园三兄弟齐至"
      }
    ],
    "forms": [
      {
        "id": "liu_bei_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "liu_bei_form_1",
        "name": "昭烈帝",
        "stats": {
          "defense": 82,
          "specialAbility": 93
        },
        "skills": [],
        "description": "昭烈帝"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "diao_chan",
    "book_id": "sanguo",
    "display_name": "貂蝉",
    "description": "连环计、美人计、舞剑、闭月之姿、离间术",
    "portrait_path": "res://assets/art/characters/diao-chan.png",
    "stats": {
      "attack": 35,
      "speed": 65,
      "intelligence": 88,
      "defense": 40,
      "specialAbility": 82,
      "health": 3500,
      "maxHealth": 3500,
      "mana": 900,
      "maxMana": 900,
      "critRate": 35,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "diao_chan_skill_1",
        "name": "连环计",
        "type": "magic_attack",
        "description": "连环计离间敌人",
        "multiplier": 1.5,
        "manaCost": 80,
        "narration": "连环计施展，离间敌心"
      },
      {
        "id": "diao_chan_skill_2",
        "name": "闭月之姿",
        "type": "transform",
        "description": "闭月之姿闪避",
        "multiplier": 0,
        "manaCost": 50,
        "narration": "闭月之姿，身形隐匿"
      }
    ],
    "forms": [
      {
        "id": "diao_chan_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "diao_chan_form_1",
        "name": "闭月",
        "stats": {
          "intelligence": 96,
          "specialAbility": 87
        },
        "skills": [],
        "description": "闭月"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "lu_zhishen",
    "book_id": "shuihu",
    "display_name": "鲁智深",
    "description": "倒拔垂杨柳、疯魔杖法、禅杖、拳打镇关西",
    "portrait_path": "res://assets/art/characters/lu-zhishen.png",
    "stats": {
      "attack": 92,
      "speed": 70,
      "intelligence": 55,
      "defense": 88,
      "specialAbility": 40,
      "health": 8800,
      "maxHealth": 8800,
      "mana": 300,
      "maxMana": 300,
      "critRate": 31,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "lu_zhishen_skill_1",
        "name": "倒拔垂杨柳",
        "type": "physical_attack",
        "description": "神力拔树砸敌",
        "multiplier": 1.7,
        "manaCost": 80,
        "narration": "倒拔垂杨柳，神力惊人"
      },
      {
        "id": "lu_zhishen_skill_2",
        "name": "疯魔杖法",
        "type": "physical_attack",
        "description": "禅杖狂舞",
        "multiplier": 1.3,
        "manaCost": 30,
        "narration": "疯魔杖法狂舞而出"
      }
    ],
    "forms": [
      {
        "id": "lu_zhishen_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "lu_zhishen_form_1",
        "name": "花和尚",
        "stats": {
          "attack": 97,
          "defense": 96
        },
        "skills": [],
        "description": "花和尚"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "wu_song",
    "book_id": "shuihu",
    "display_name": "武松",
    "description": "醉拳、鸳鸯脚、景阳冈打虎、行者戒刀",
    "portrait_path": "res://assets/art/characters/shuihuzhuan-wusong.png",
    "stats": {
      "attack": 85,
      "speed": 72,
      "intelligence": 60,
      "defense": 75,
      "specialAbility": 50,
      "health": 8000,
      "maxHealth": 8000,
      "mana": 350,
      "maxMana": 350,
      "critRate": 33,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "wu_song_skill_1",
        "name": "打虎拳",
        "type": "physical_attack",
        "description": "景阳冈打虎拳法",
        "multiplier": 1.7,
        "manaCost": 80,
        "narration": "打虎拳重击，势如打虎"
      },
      {
        "id": "wu_song_skill_2",
        "name": "鸳鸯脚",
        "type": "speed_attack",
        "description": "鸳鸯脚连环踢",
        "multiplier": 1.5,
        "manaCost": 50,
        "narration": "鸳鸯脚连环踢出"
      }
    ],
    "forms": [
      {
        "id": "wu_song_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "wu_song_form_1",
        "name": "行者",
        "stats": {
          "attack": 90,
          "speed": 75
        },
        "skills": [],
        "description": "行者"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "lin_chong",
    "book_id": "shuihu",
    "display_name": "林冲",
    "description": "林家枪法、风雪山神庙、豹子头、八十万禁军教头、雪夜上梁山",
    "portrait_path": "res://assets/art/characters/shuihuzhuan-linchong.png",
    "stats": {
      "attack": 86,
      "speed": 80,
      "intelligence": 70,
      "defense": 82,
      "specialAbility": 65,
      "health": 8300,
      "maxHealth": 8300,
      "mana": 450,
      "maxMana": 450,
      "critRate": 35,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "lin_chong_skill_1",
        "name": "林家枪法",
        "type": "physical_attack",
        "description": "林家枪法出神入化",
        "multiplier": 1.6,
        "manaCost": 50,
        "narration": "林家枪法凌厉出击"
      },
      {
        "id": "lin_chong_skill_2",
        "name": "风雪山神庙",
        "type": "physical_attack",
        "description": "风雪之夜，怒杀仇敌",
        "multiplier": 1.8,
        "manaCost": 100,
        "narration": "风雪山神庙，怒火中烧"
      }
    ],
    "forms": [
      {
        "id": "lin_chong_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "lin_chong_form_1",
        "name": "豹子头",
        "stats": {
          "attack": 94,
          "speed": 85
        },
        "skills": [],
        "description": "豹子头"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "song_jiang",
    "book_id": "shuihu",
    "display_name": "宋江",
    "description": "及时雨、呼保义、忠义堂、招安、浔阳楼题反诗",
    "portrait_path": "res://assets/art/characters/shuihuzhuan-songjiang.png",
    "stats": {
      "attack": 55,
      "speed": 50,
      "intelligence": 85,
      "defense": 60,
      "specialAbility": 90,
      "health": 6000,
      "maxHealth": 6000,
      "mana": 800,
      "maxMana": 800,
      "critRate": 34,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "song_jiang_skill_1",
        "name": "及时雨",
        "type": "heal",
        "description": "及时雨，恢复友军",
        "multiplier": 0,
        "manaCost": 80,
        "narration": "及时雨宋江，救人于危难"
      },
      {
        "id": "song_jiang_skill_2",
        "name": "忠义堂",
        "type": "summon",
        "description": "召唤梁山好汉助阵",
        "multiplier": 0.8,
        "manaCost": 120,
        "narration": "忠义堂好汉齐至"
      }
    ],
    "forms": [
      {
        "id": "song_jiang_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "song_jiang_form_1",
        "name": "呼保义",
        "stats": {
          "specialAbility": 100,
          "intelligence": 93
        },
        "skills": [],
        "description": "呼保义"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "lin_daiyu",
    "book_id": "honglou",
    "display_name": "林黛玉",
    "description": "葬花吟、咏絮才、潇湘馆、绛珠仙草、金陵十二钗",
    "portrait_path": "res://assets/art/characters/hongloumeng-lindaiyu.png",
    "stats": {
      "attack": 25,
      "speed": 40,
      "intelligence": 90,
      "defense": 20,
      "specialAbility": 75,
      "health": 2500,
      "maxHealth": 2500,
      "mana": 1000,
      "maxMana": 1000,
      "critRate": 33,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "lin_daiyu_skill_1",
        "name": "葬花吟",
        "type": "transform",
        "description": "心理战，降低对手士气",
        "multiplier": 0,
        "manaCost": 60,
        "narration": "葬花吟声声入耳，士气低落"
      },
      {
        "id": "lin_daiyu_skill_2",
        "name": "泪尽血枯",
        "type": "magic_attack",
        "description": "牺牲自身造成大量伤害",
        "multiplier": 2,
        "manaCost": 150,
        "narration": "泪尽血枯，以命换伤"
      }
    ],
    "forms": [
      {
        "id": "lin_daiyu_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "lin_daiyu_form_1",
        "name": "绛珠仙草",
        "stats": {
          "specialAbility": 90,
          "intelligence": 100
        },
        "skills": [],
        "description": "绛珠仙草"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "jia_baoyu",
    "book_id": "honglou",
    "display_name": "贾宝玉",
    "description": "通灵宝玉、大观园、木石前盟、太虚幻境、神瑛侍者",
    "portrait_path": "res://assets/art/characters/hongloumeng-jiabaoyu.png",
    "stats": {
      "attack": 30,
      "speed": 45,
      "intelligence": 85,
      "defense": 35,
      "specialAbility": 80,
      "health": 3000,
      "maxHealth": 3000,
      "mana": 900,
      "maxMana": 900,
      "critRate": 33,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "jia_baoyu_skill_1",
        "name": "通灵宝玉",
        "type": "transform",
        "description": "通灵护体，提升防御",
        "multiplier": 0,
        "manaCost": 80,
        "narration": "通灵宝玉闪耀，护体神光"
      },
      {
        "id": "jia_baoyu_skill_2",
        "name": "大观园诗社",
        "type": "magic_attack",
        "description": "诗词为刃，才情攻击",
        "multiplier": 1.5,
        "manaCost": 100,
        "narration": "大观园诗社，才情横溢"
      }
    ],
    "forms": [
      {
        "id": "jia_baoyu_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "jia_baoyu_form_1",
        "name": "神瑛侍者",
        "stats": {
          "specialAbility": 90,
          "intelligence": 93
        },
        "skills": [],
        "description": "神瑛侍者"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "xue_baochai",
    "book_id": "honglou",
    "display_name": "薛宝钗",
    "description": "冷香丸、蘅芜苑、金玉良缘、螃蟹咏、停机德",
    "portrait_path": "res://assets/art/characters/hongloumeng-xuebaochai.png",
    "stats": {
      "attack": 40,
      "speed": 55,
      "intelligence": 92,
      "defense": 50,
      "specialAbility": 85,
      "health": 3800,
      "maxHealth": 3800,
      "mana": 1100,
      "maxMana": 1100,
      "critRate": 35,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "xue_baochai_skill_1",
        "name": "冷香丸",
        "type": "heal",
        "description": "冷香丸调理，恢复生命",
        "multiplier": 0,
        "manaCost": 70,
        "narration": "冷香丸清香四溢，调和阴阳"
      },
      {
        "id": "xue_baochai_skill_2",
        "name": "金玉良缘",
        "type": "magic_attack",
        "description": "金锁玉佩，灵力攻击",
        "multiplier": 1.6,
        "manaCost": 110,
        "narration": "金玉良缘，天作之合"
      }
    ],
    "forms": [
      {
        "id": "xue_baochai_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "xue_baochai_form_1",
        "name": "蘅芜君",
        "stats": {
          "intelligence": 102,
          "defense": 58
        },
        "skills": [],
        "description": "蘅芜君"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "nezha",
    "book_id": "fengshen",
    "display_name": "哪吒",
    "description": "风火轮、乾坤圈、混天绫、三头六臂、莲花真身",
    "portrait_path": "res://assets/art/characters/fengshen-nezha.png",
    "stats": {
      "attack": 85,
      "speed": 92,
      "intelligence": 70,
      "defense": 78,
      "specialAbility": 88,
      "health": 7800,
      "maxHealth": 7800,
      "mana": 600,
      "maxMana": 600,
      "critRate": 35,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "nezha_skill_1",
        "name": "风火轮突袭",
        "type": "speed_attack",
        "description": "脚踏风火轮，烈焰突袭",
        "multiplier": 1.4,
        "manaCost": 30,
        "narration": "脚踏风火轮，烈焰裹挟而至"
      },
      {
        "id": "nezha_skill_2",
        "name": "乾坤圈砸",
        "type": "physical_attack",
        "description": "乾坤圈挟神力砸下",
        "multiplier": 1.5,
        "manaCost": 40,
        "narration": "乾坤圈挟神力砸下"
      }
    ],
    "forms": [
      {
        "id": "nezha_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "nezha_form_1",
        "name": "三头六臂",
        "stats": {
          "attack": 93,
          "defense": 83
        },
        "skills": [],
        "description": "三头六臂"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "jiang_ziya",
    "book_id": "fengshen",
    "display_name": "姜子牙",
    "description": "打神鞭、封神榜、奇门遁甲、借东风、杏黄旗",
    "portrait_path": "res://assets/art/characters/fengshen-jiangziya.png",
    "stats": {
      "attack": 60,
      "speed": 55,
      "intelligence": 95,
      "defense": 70,
      "specialAbility": 98,
      "health": 6000,
      "maxHealth": 6000,
      "mana": 1500,
      "maxMana": 1500,
      "critRate": 35,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "jiang_ziya_skill_1",
        "name": "打神鞭",
        "type": "magic_attack",
        "description": "打神鞭降下，专打封神榜上人",
        "multiplier": 1.7,
        "manaCost": 100,
        "narration": "打神鞭凌空降下，神威赫赫"
      },
      {
        "id": "jiang_ziya_skill_2",
        "name": "封神术",
        "type": "magic_attack",
        "description": "封神术封印敌人",
        "multiplier": 1.8,
        "manaCost": 150,
        "narration": "封神术施展，封印之力降临"
      }
    ],
    "forms": [
      {
        "id": "jiang_ziya_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "jiang_ziya_form_1",
        "name": "封神",
        "stats": {
          "specialAbility": 108,
          "intelligence": 100
        },
        "skills": [],
        "description": "封神之主"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "daji",
    "book_id": "fengshen",
    "display_name": "妲己",
    "description": "九尾狐、魅惑之术、炮烙、酒池肉林、轩辕坟三妖",
    "portrait_path": "res://assets/art/characters/fengshen-daji.png",
    "stats": {
      "attack": 45,
      "speed": 75,
      "intelligence": 90,
      "defense": 45,
      "specialAbility": 95,
      "health": 4000,
      "maxHealth": 4000,
      "mana": 1000,
      "maxMana": 1000,
      "critRate": 35,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "daji_skill_1",
        "name": "九尾妖狐",
        "type": "transform",
        "description": "九尾真身，全属性提升",
        "multiplier": 0,
        "manaCost": 80,
        "narration": "九尾妖狐真身显现"
      },
      {
        "id": "daji_skill_2",
        "name": "魅惑之术",
        "type": "magic_attack",
        "description": "魅惑敌人，降低防御",
        "multiplier": 1.6,
        "manaCost": 90,
        "narration": "魅惑之术，心神荡漾"
      }
    ],
    "forms": [
      {
        "id": "daji_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "daji_form_1",
        "name": "九尾妖狐",
        "stats": {
          "specialAbility": 107,
          "speed": 83
        },
        "skills": [],
        "description": "九尾妖狐"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "er_lang_shen",
    "book_id": "fengshen",
    "display_name": "二郎神",
    "description": "三尖两刃刀、天眼、哮天犬、八九玄功",
    "portrait_path": "res://assets/art/characters/er-lang-shen.png",
    "stats": {
      "attack": 92,
      "speed": 88,
      "intelligence": 82,
      "defense": 90,
      "specialAbility": 90,
      "health": 8800,
      "maxHealth": 8800,
      "mana": 700,
      "maxMana": 700,
      "critRate": 35,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "er_lang_shen_skill_1",
        "name": "三尖两刃刀",
        "type": "physical_attack",
        "description": "三尖两刃刀重劈",
        "multiplier": 1.6,
        "manaCost": 50,
        "narration": "三尖两刃刀挟神力劈下"
      },
      {
        "id": "er_lang_shen_skill_2",
        "name": "天眼射线",
        "type": "magic_attack",
        "description": "天眼射出神光",
        "multiplier": 1.7,
        "manaCost": 100,
        "narration": "天眼睁开，神光射出"
      }
    ],
    "forms": [
      {
        "id": "er_lang_shen_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "er_lang_shen_form_1",
        "name": "显圣真君",
        "stats": {
          "attack": 100,
          "specialAbility": 98
        },
        "skills": [],
        "description": "显圣真君"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "bai_suzhen",
    "book_id": "baishe",
    "display_name": "白素贞",
    "description": "水漫金山、白蛇剑法、千年修为、化形术、雷峰塔",
    "portrait_path": "res://assets/art/characters/bai-suzhen.png",
    "stats": {
      "attack": 70,
      "speed": 88,
      "intelligence": 85,
      "defense": 72,
      "specialAbility": 92,
      "health": 7200,
      "maxHealth": 7200,
      "mana": 1100,
      "maxMana": 1100,
      "critRate": 35,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "bai_suzhen_skill_1",
        "name": "水漫金山",
        "type": "magic_attack",
        "description": "召唤洪水淹没敌人",
        "multiplier": 1.8,
        "manaCost": 120,
        "narration": "水漫金山，洪水滔天而至"
      },
      {
        "id": "bai_suzhen_skill_2",
        "name": "千年修为",
        "type": "heal",
        "description": "千年修为回血",
        "multiplier": 0,
        "manaCost": 80,
        "narration": "千年修为运转，恢复生机"
      }
    ],
    "forms": [
      {
        "id": "bai_suzhen_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "bai_suzhen_form_1",
        "name": "千年蛇仙",
        "stats": {
          "specialAbility": 102,
          "intelligence": 90
        },
        "skills": [],
        "description": "千年蛇仙"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "xiang_yu",
    "book_id": "shiji",
    "display_name": "项羽",
    "description": "霸王举鼎、破釜沉舟、乌骓马、虞姬",
    "portrait_path": "res://assets/art/characters/xiang-yu.png",
    "stats": {
      "attack": 96,
      "speed": 80,
      "intelligence": 65,
      "defense": 88,
      "specialAbility": 60,
      "health": 9200,
      "maxHealth": 9200,
      "mana": 400,
      "maxMana": 400,
      "critRate": 35,
      "critDamage": 150
    },
    "skills": [
      {
        "id": "xiang_yu_skill_1",
        "name": "霸王举鼎",
        "type": "physical_attack",
        "description": "霸王举鼎之力重击",
        "multiplier": 1.8,
        "manaCost": 80,
        "narration": "霸王举鼎之力爆发"
      },
      {
        "id": "xiang_yu_skill_2",
        "name": "破釜沉舟",
        "type": "physical_attack",
        "description": "破釜沉舟背水一战",
        "multiplier": 1.6,
        "manaCost": 100,
        "narration": "破釜沉舟，决死一击"
      }
    ],
    "forms": [
      {
        "id": "xiang_yu_form_0",
        "name": "基础",
        "stats": {},
        "skills": [],
        "description": ""
      },
      {
        "id": "xiang_yu_form_1",
        "name": "西楚霸王",
        "stats": {
          "attack": 106,
          "defense": 93
        },
        "skills": [],
        "description": "西楚霸王"
      }
    ],
    "complete_data": true,
    "unlocked_by_default": false
  },
  {
    "id": "nie_xiaoqian",
    "book_id": "liaozhai",
    "display_name": "聂小倩",
    "description": "兰若幽魂，身陷妖魅而仍守真情。完整战斗数据将在《聊斋志异》书卷开放时补入。",
    "portrait_path": "res://assets/art/books/liaozhai-niexiaoqian.png",
    "stats": {},
    "skills": [],
    "forms": [],
    "complete_data": false,
    "unlocked_by_default": false
  }
]

const ITEMS: Array[Dictionary] = [
  {
    "id": "xiyouji_golden_cudgel",
    "book_id": "xiyouji",
    "display_name": "如意金箍棒",
    "description": "大禹治水时留下的定海神针，重一万三千五百斤，可大可小，随心如意。",
    "artwork_path": "res://assets/art/items/xiyouji-golden-cudgel.png",
    "rarity": "legendary",
    "item_type": "weapon",
    "stats_bonus": {
      "power": 15,
      "speed": 5
    },
    "skill_bonus": "physical_attack",
    "source_basis": "西游记·第三回 四海千山皆拱伏 九幽十类尽除名",
    "complete_data": true
  },
  {
    "id": "xiyouji_monk_staff",
    "book_id": "xiyouji",
    "display_name": "九环锡杖",
    "description": "如来佛祖所赐，持之可免堕轮回，护持取经人一路平安。",
    "artwork_path": "res://assets/art/items/xiyouji-monk-staff.png",
    "rarity": "epic",
    "item_type": "weapon",
    "stats_bonus": {
      "specialAbility": 12,
      "defense": 5
    },
    "skill_bonus": "heal",
    "source_basis": "西游记·第十二回 玄奘秉诚建大会 观音显象化金蝉",
    "complete_data": true
  },
  {
    "id": "xiyouji_nine_tooth_rake",
    "book_id": "xiyouji",
    "display_name": "九齿钉耙",
    "description": "太上老君亲手打造，重五千零四十八斤，乃天蓬元帅神兵。",
    "artwork_path": "res://assets/art/items/xiyouji-nine-tooth-rake.png",
    "rarity": "epic",
    "item_type": "weapon",
    "stats_bonus": {
      "power": 12,
      "defense": 8
    },
    "skill_bonus": "physical_attack",
    "source_basis": "西游记·第十九回 云栈洞悟空收八戒 浮屠山玄奘受心经",
    "complete_data": true
  },
  {
    "id": "xiyouji_tightening_headband",
    "book_id": "xiyouji",
    "display_name": "紧箍咒",
    "description": "观音菩萨所授，戴在头上，一念咒便头痛欲裂，专治不服。",
    "artwork_path": "res://assets/art/items/xiyouji-tightening-headband.png",
    "rarity": "legendary",
    "item_type": "accessory",
    "stats_bonus": {
      "specialAbility": 15,
      "intelligence": 10
    },
    "skill_bonus": "magic_attack",
    "source_basis": "西游记·第十四回 心猿归正 六贼无踪",
    "complete_data": true
  },
  {
    "id": "xiyouji_scripture_pass",
    "book_id": "xiyouji",
    "display_name": "通关文牒",
    "description": "唐太宗所赐，途经各国皆需倒换关文，乃西行之凭信。",
    "artwork_path": "res://assets/art/items/xiyouji-scripture-scroll.png",
    "rarity": "rare",
    "item_type": "consumable",
    "stats_bonus": {
      "intelligence": 8,
      "specialAbility": 5
    },
    "skill_bonus": "transform",
    "source_basis": "西游记·第十二回 玄奘秉诚建大会 观音显象化金蝉",
    "complete_data": true
  },
  {
    "id": "sanguo_green_dragon_blade",
    "book_id": "sanguo",
    "display_name": "青龙偃月刀",
    "description": "武圣关羽之神兵，重八十二斤，又名冷艳锯，斩将搴旗如探囊取物。",
    "artwork_path": "res://assets/art/items/sanguo-green-dragon-blade.png",
    "rarity": "legendary",
    "item_type": "weapon",
    "stats_bonus": {
      "power": 18,
      "defense": 5
    },
    "skill_bonus": "physical_attack",
    "source_basis": "三国演义·第一回 宴桃园豪杰三结义 斩黄巾英雄首立功",
    "complete_data": true
  },
  {
    "id": "sanguo_feather_fan",
    "book_id": "sanguo",
    "display_name": "羽扇",
    "description": "卧龙先生的标志性羽扇，轻摇之间，计上心头，决胜千里之外。",
    "artwork_path": "res://assets/art/items/sanguo-feather-fan.png",
    "rarity": "epic",
    "item_type": "accessory",
    "stats_bonus": {
      "intelligence": 15,
      "specialAbility": 8
    },
    "skill_bonus": "magic_attack",
    "source_basis": "三国演义·第三十八回 定三分隆中决策 战长江孙氏报仇",
    "complete_data": true
  },
  {
    "id": "sanguo_twin_swords",
    "book_id": "sanguo",
    "display_name": "双股剑",
    "description": "刘备之兵器，一对宝剑，左手雌剑，右手雄剑，双剑合璧威力无穷。",
    "artwork_path": "res://assets/art/items/sanguo-twin-swords.png",
    "rarity": "epic",
    "item_type": "weapon",
    "stats_bonus": {
      "power": 10,
      "speed": 10
    },
    "skill_bonus": "physical_attack",
    "source_basis": "三国演义·第一回 宴桃园豪杰三结义 斩黄巾英雄首立功",
    "complete_data": true
  },
  {
    "id": "sanguo_serpent_spear",
    "book_id": "sanguo",
    "display_name": "丈八蛇矛",
    "description": "张飞之兵器，矛头呈蛇形，长一丈八尺，当阳桥上一喝退万军。",
    "artwork_path": "res://assets/art/items/sanguo-serpent-spear.png",
    "rarity": "epic",
    "item_type": "weapon",
    "stats_bonus": {
      "power": 16,
      "speed": 6
    },
    "skill_bonus": "physical_attack",
    "source_basis": "三国演义·第一回 宴桃园豪杰三结义 斩黄巾英雄首立功",
    "complete_data": true
  },
  {
    "id": "sanguo_silk_pouch",
    "book_id": "sanguo",
    "display_name": "锦囊妙计",
    "description": "诸葛亮所留锦囊，内藏妙策，遇危难拆开即见生机。",
    "artwork_path": "res://assets/art/items/sanguo-silk-pouch.png",
    "rarity": "rare",
    "item_type": "consumable",
    "stats_bonus": {
      "intelligence": 12,
      "defense": 8
    },
    "skill_bonus": "transform",
    "source_basis": "三国演义·第五十四回 范增巧布鸿门宴 诸葛智赚甘露寺",
    "complete_data": true
  },
  {
    "id": "honglou_spiritual_jade",
    "book_id": "honglou",
    "display_name": "通灵宝玉",
    "description": "大荒山无稽崖青埂峰下顽石所化，落胎含玉，莫失莫忘，仙寿恒昌。",
    "artwork_path": "res://assets/art/items/hongloumeng-spiritual-jade.png",
    "rarity": "legendary",
    "item_type": "treasure",
    "stats_bonus": {
      "specialAbility": 18,
      "intelligence": 12
    },
    "skill_bonus": "heal",
    "source_basis": "红楼梦·第一回 甄士隐梦幻识通灵 贾雨村风尘怀闺秀",
    "complete_data": true
  },
  {
    "id": "honglou_golden_locket",
    "book_id": "honglou",
    "display_name": "金锁",
    "description": "薛宝钗所佩金锁，上刻和尚所赐吉语：不离不弃，芳龄永继。与通灵宝玉成金玉良缘。",
    "artwork_path": "res://assets/art/items/hongloumeng-golden-locket.png",
    "rarity": "epic",
    "item_type": "treasure",
    "stats_bonus": {
      "defense": 14,
      "specialAbility": 10
    },
    "skill_bonus": "passive",
    "source_basis": "红楼梦·第八回 比通灵金莺微露意 探宝钗黛玉半含酸",
    "complete_data": true
  },
  {
    "id": "honglou_wind_moon_mirror",
    "book_id": "honglou",
    "display_name": "风月宝鉴",
    "description": "警幻仙子所制神镜，照正面见红粉佳人，照反面见骷髅白骨，专治邪思妄动。",
    "artwork_path": "res://assets/art/items/hongloumeng-wind-moon-mirror.png",
    "rarity": "epic",
    "item_type": "treasure",
    "stats_bonus": {
      "intelligence": 14,
      "specialAbility": 10
    },
    "skill_bonus": "magic_attack",
    "source_basis": "红楼梦·第十二回 王熙凤毒设相思局 贾天祥正照风月鉴",
    "complete_data": true
  },
  {
    "id": "honglou_cold_fragrance_pill",
    "book_id": "honglou",
    "display_name": "冷香丸",
    "description": "秃头和尚所传秘方，采四季花蕊并雨露霜雪研制，专治胎里带来的一股热毒。",
    "artwork_path": "res://assets/art/items/hongloumeng-cold-fragrance-pill.png",
    "rarity": "rare",
    "item_type": "consumable",
    "stats_bonus": {
      "health": 1200,
      "specialAbility": 8
    },
    "skill_bonus": "heal",
    "source_basis": "红楼梦·第七回 送宫花贾琏戏熙凤 宴宁府宝玉会秦钟",
    "complete_data": true
  },
  {
    "id": "fengshen_universe_ring",
    "book_id": "fengshen",
    "display_name": "乾坤圈",
    "description": "哪吒随身法宝，金光闪闪，坚不可摧，投掷而出能碎金断石。",
    "artwork_path": "res://assets/art/items/fengshen-universe-ring.png",
    "rarity": "legendary",
    "item_type": "weapon",
    "stats_bonus": {
      "power": 16,
      "speed": 8
    },
    "skill_bonus": "physical_attack",
    "source_basis": "封神演义·第十二回 陈塘关哪吒出世",
    "complete_data": true
  },
  {
    "id": "fengshen_sky_ribbon",
    "book_id": "fengshen",
    "display_name": "混天绫",
    "description": "七尺混天绫，红光满天，翻江倒海，能缚万物。",
    "artwork_path": "res://assets/art/items/fengshen-sky-ribbon.png",
    "rarity": "legendary",
    "item_type": "accessory",
    "stats_bonus": {
      "speed": 12,
      "defense": 10
    },
    "skill_bonus": "transform",
    "source_basis": "封神演义·第十二回 陈塘关哪吒出世",
    "complete_data": true
  },
  {
    "id": "fengshen_god_roster",
    "book_id": "fengshen",
    "display_name": "封神榜",
    "description": "元始天尊所赐天书，姜子牙执掌，上列三百六十五位正神名讳，定三界秩序。",
    "artwork_path": "res://assets/art/items/fengshen-god-roster.png",
    "rarity": "legendary",
    "item_type": "treasure",
    "stats_bonus": {
      "specialAbility": 20,
      "intelligence": 15
    },
    "skill_bonus": "magic_attack",
    "source_basis": "封神演义·第十五回 昆仑山子牙下山",
    "complete_data": true
  },
  {
    "id": "fengshen_god_beating_whip",
    "book_id": "fengshen",
    "display_name": "打神鞭",
    "description": "元始天尊赐予姜子牙之至宝，长三尺六寸五分，专打封神榜上有名字的神魔。",
    "artwork_path": "res://assets/art/items/fengshen-god-beating-whip.png",
    "rarity": "legendary",
    "item_type": "weapon",
    "stats_bonus": {
      "power": 17,
      "specialAbility": 10
    },
    "skill_bonus": "physical_attack",
    "source_basis": "封神演义·第三十七回 姜子牙一上昆仑",
    "complete_data": true
  },
  {
    "id": "baishe_leifeng_pagoda",
    "book_id": "baishe",
    "display_name": "雷峰塔",
    "description": "西湖岸边的镇妖佛塔，法海以此塔镇压白娘子，象征着不可动摇的戒律。",
    "artwork_path": "res://icon.svg",
    "rarity": "legendary",
    "item_type": "treasure",
    "stats_bonus": {
      "defense": 20,
      "specialAbility": 10
    },
    "skill_bonus": "transform",
    "source_basis": "白蛇传·水漫金山后 镇压雷峰塔",
    "complete_data": false
  },
  {
    "id": "baishe_realgar_wine",
    "book_id": "baishe",
    "display_name": "雄黄酒",
    "description": "端午佳节驱邪之酒，蛇妖饮之必现原形，乃破除伪装之物。",
    "artwork_path": "res://icon.svg",
    "rarity": "rare",
    "item_type": "consumable",
    "stats_bonus": {
      "intelligence": 10,
      "speed": 5
    },
    "skill_bonus": "passive",
    "source_basis": "白蛇传·端午惊变 雄黄现形",
    "complete_data": false
  },
  {
    "id": "shuihu_loyalty_banner",
    "book_id": "shuihu",
    "display_name": "水泊聚义旗",
    "description": "梁山泊聚义厅前高扬的「替天行道」杏黄大旗，凝聚一百单八将之浩然正气。",
    "artwork_path": "res://assets/art/items/shuihu-loyalty-banner.png",
    "rarity": "legendary",
    "item_type": "treasure",
    "stats_bonus": {
      "power": 12,
      "defense": 12,
      "specialAbility": 10
    },
    "skill_bonus": "passive",
    "source_basis": "水浒传·第七十一回 忠义堂石碣受天文 梁山泊英雄排座次",
    "complete_data": true
  },
  {
    "id": "liaozhai_lanruo_lantern",
    "book_id": "liaozhai",
    "display_name": "兰若古灯",
    "description": "兰若寺深处幽幽燃烧的古灯，能照见幽冥虚妄，引渡尘世迷途之魂。",
    "artwork_path": "res://icon.svg",
    "rarity": "rare",
    "item_type": "treasure",
    "stats_bonus": {
      "intelligence": 12,
      "specialAbility": 10
    },
    "skill_bonus": "magic_attack",
    "source_basis": "聊斋志异·聂小倩篇",
    "complete_data": false
  },
  {
    "id": "shiji_overlord_saddle",
    "book_id": "shiji",
    "display_name": "霸王乌骓鞍",
    "description": "西楚霸王项羽座下神驹乌骓之鞍，一日千里，随霸王征战天下。",
    "artwork_path": "res://icon.svg",
    "rarity": "legendary",
    "item_type": "accessory",
    "stats_bonus": {
      "speed": 18,
      "power": 10
    },
    "skill_bonus": "speed_attack",
    "source_basis": "史记·项羽本纪 骓不逝兮可奈何",
    "complete_data": false
  }
]
