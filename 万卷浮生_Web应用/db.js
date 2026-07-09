// db.js - 数据库初始化与Schema
// 使用 better-sqlite3 同步API

const Database = require('better-sqlite3');
const path = require('path');
const charactersData = require('./characters-data');
const itemsData = require('./items-data');

// 数据库文件路径（默认 data.db）
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data.db');

// 创建数据库连接
const db = new Database(dbPath);

// 启用WAL模式提升性能
db.pragma('journal_mode = WAL');
// 启用外键约束（better-sqlite3 默认不启用，需显式开启）
db.pragma('foreign_keys = ON');

// 初始化所有表
function initDB() {
    // 玩家账号表
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            nickname TEXT,
            avatar TEXT DEFAULT '🎮',
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 系统预置角色表（公版小说角色）
    db.exec(`
        CREATE TABLE IF NOT EXISTS characters (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            grade TEXT NOT NULL,
            source TEXT NOT NULL,
            gradient TEXT,
            image TEXT,
            stats_json TEXT NOT NULL,
            skills_json TEXT NOT NULL,
            forms_json TEXT NOT NULL,
            source_basis TEXT
        );
    `);

    // 兼容旧数据库：若image列不存在则添加
    try {
        db.exec("ALTER TABLE characters ADD COLUMN image TEXT");
    } catch (e) {
        // 列已存在，忽略
    }

    // 玩家拥有的角色
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            character_id INTEGER NOT NULL,
            level INTEGER DEFAULT 1,
            exp INTEGER DEFAULT 0,
            unlocked_forms TEXT DEFAULT '[]',
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (character_id) REFERENCES characters(id),
            UNIQUE(user_id, character_id)
        );
    `);

    // 对战记录表
    db.exec(`
        CREATE TABLE IF NOT EXISTS battles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player1_id INTEGER NOT NULL,
            player2_id INTEGER NOT NULL,
            player1_char_id INTEGER NOT NULL,
            player2_char_id INTEGER NOT NULL,
            winner_id INTEGER,
            total_rounds INTEGER,
            battle_log_json TEXT,
            narration TEXT,
            battle_type TEXT DEFAULT 'pvp',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (player1_id) REFERENCES users(id),
            FOREIGN KEY (player2_id) REFERENCES users(id)
        );
    `);

    // 系统预置道具表
    db.exec(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            source TEXT NOT NULL,
            rarity TEXT NOT NULL,
            type TEXT NOT NULL,
            image TEXT,
            description TEXT,
            stats_bonus_json TEXT,
            skill_bonus TEXT,
            source_basis TEXT
        );
    `);

    // 玩家拥有的道具
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 1,
            equipped INTEGER DEFAULT 0,
            slot TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (item_id) REFERENCES items(id),
            UNIQUE(user_id, item_id)
        );
    `);

    // 用户AI配置表
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_ai_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            provider TEXT DEFAULT 'deepseek',
            model TEXT,
            custom_base_url TEXT,
            api_key_encrypted TEXT,
            protocol TEXT DEFAULT 'openai',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);

    // 兼容旧数据库：若 protocol 列不存在则添加
    try {
        db.exec("ALTER TABLE user_ai_config ADD COLUMN protocol TEXT DEFAULT 'openai'");
    } catch (e) {
        // 列已存在，忽略
    }

    // 书籍表：存储名著和用户上传的书籍
    db.exec(`
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            author TEXT,
            description TEXT,
            content TEXT NOT NULL,
            source_type TEXT DEFAULT 'classic',
            cover_gradient TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);

    // 剧情会话表：记录AI互动剧情的对话历史和进度
    db.exec(`
        CREATE TABLE IF NOT EXISTS story_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            book_id INTEGER NOT NULL,
            chapter_index INTEGER DEFAULT 1,
            total_chapters INTEGER DEFAULT 10,
            status TEXT DEFAULT 'active',
            messages_json TEXT DEFAULT '[]',
            summary TEXT,
            current_choices_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (book_id) REFERENCES books(id)
        );
    `);

    // 兼容旧数据库：若 story_sessions 表缺少 character_id 列则添加
    try {
        db.exec("ALTER TABLE story_sessions ADD COLUMN character_id INTEGER");
    } catch (e) {
        // 列已存在，忽略
    }

    // 剧情养成 DAG 进度表：记录玩家在 DAG 节点图中的推进状态
    // 按策划案 v3 8.2节设计：选择影响成长、解锁技能/形态
    db.exec(`
        CREATE TABLE IF NOT EXISTS story_dag_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            book_id INTEGER NOT NULL,
            character_id INTEGER,
            novel_id TEXT NOT NULL,
            current_node TEXT NOT NULL,
            visited_nodes_json TEXT DEFAULT '[]',
            stat_growth_json TEXT DEFAULT '{}',
            unlocked_skills_json TEXT DEFAULT '[]',
            unlocked_forms_json TEXT DEFAULT '[]',
            battle_results_json TEXT DEFAULT '[]',
            status TEXT DEFAULT 'active',
            ending_node TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES story_sessions(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (book_id) REFERENCES books(id)
        );
    `);

    // 兼容旧数据库：若 story_dag_progress 表缺少 mode 列则添加
    // mode='dag' 预置模式（current_node 存节点ID）；mode='ai' AI动态模式（current_node 存完整 JSON）
    try {
        db.exec("ALTER TABLE story_dag_progress ADD COLUMN mode TEXT DEFAULT 'dag'");
    } catch (e) {
        // 列已存在，忽略
    }

    // 兼容旧数据库：为 story_dag_progress 增加用户剧情输入相关列
    // user_direction：开局方向文本（一次性，启动时写入，仅 ai 模式生效）
    try {
        db.exec("ALTER TABLE story_dag_progress ADD COLUMN user_direction TEXT");
    } catch (e) {}
    // turning_inputs_json：关键转折输入数组 [{nodeIndex, choiceId, input}, ...]
    try {
        db.exec("ALTER TABLE story_dag_progress ADD COLUMN turning_inputs_json TEXT DEFAULT '[]'");
    } catch (e) {}

    // 章节奖励记录表
    db.exec(`
        CREATE TABLE IF NOT EXISTS chapter_rewards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            chapter_index INTEGER NOT NULL,
            reward_type TEXT,
            reward_id INTEGER,
            reward_name TEXT,
            reward_data_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES story_sessions(id)
        );
    `);

    // 角色装备关联表（角色 ↔ 道具 多对多，支持一个角色装备多个道具）
    db.exec(`
        CREATE TABLE IF NOT EXISTS character_equipment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            character_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            equipped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(character_id, item_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (character_id) REFERENCES characters(id),
            FOREIGN KEY (item_id) REFERENCES items(id)
        );
    `);

    // AI 角色卡缓存表：按 book_id 全局共享，所有用户共用同一本书的缓存
    // 二次打开典籍秒出，TTL 7 天（由查询时 created_at 判断）
    db.exec(`
        CREATE TABLE IF NOT EXISTS ai_character_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL UNIQUE,
            book_title TEXT NOT NULL,
            cards_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES books(id)
        );
    `);

    // 书籍摘要缓存表：按 book_id 全局共享，替代 prompt 中的原文节选以精简输入
    // 摘要 300-500 字，一次性生成永久缓存（除非书籍删除）
    db.exec(`
        CREATE TABLE IF NOT EXISTS book_summary_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id INTEGER NOT NULL UNIQUE,
            book_title TEXT NOT NULL,
            summary TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES books(id)
        );
    `);

    // 初始化预置角色数据（若characters表为空）
    const count = db.prepare('SELECT COUNT(*) as cnt FROM characters').get();
    if (count.cnt === 0) {
        const insertStmt = db.prepare(`
            INSERT INTO characters (id, name, grade, source, gradient, image, stats_json, skills_json, forms_json, source_basis)
            VALUES (@id, @name, @grade, @source, @gradient, @image, @stats_json, @skills_json, @forms_json, @source_basis)
        `);
        const insertMany = db.transaction((chars) => {
            for (const c of chars) {
                insertStmt.run({
                    id: c.id,
                    name: c.name,
                    grade: c.grade,
                    source: c.source,
                    gradient: c.gradient,
                    image: c.image || null,
                    stats_json: JSON.stringify(c.stats),
                    skills_json: JSON.stringify(c.skills),
                    forms_json: JSON.stringify(c.forms),
                    source_basis: c.source_basis
                });
            }
        });
        insertMany(charactersData);
        console.log(`[DB] 已初始化 ${charactersData.length} 个预置角色`);
    } else {
        // 补录缺失角色 + 更新已存在角色数据（按 name 判断，避免 id 冲突覆盖自定义角色）
        const existingRows = db.prepare('SELECT id, name FROM characters').all();
        const existingByName = new Map(existingRows.map(r => [r.name, r.id]));
        const usedIds = new Set(existingRows.map(r => r.id));
        let maxId = existingRows.reduce((mx, r) => Math.max(mx, r.id), 0);

        const insertStmt = db.prepare(`
            INSERT INTO characters (id, name, grade, source, gradient, image, stats_json, skills_json, forms_json, source_basis)
            VALUES (@id, @name, @grade, @source, @gradient, @image, @stats_json, @skills_json, @forms_json, @source_basis)
        `);
        const updateStmt = db.prepare(`
            UPDATE characters SET image = COALESCE(@image, image), stats_json = @stats_json, skills_json = @skills_json, forms_json = @forms_json, source_basis = @source_basis, gradient = @gradient
            WHERE id = @id
        `);

        let insertedCount = 0;
        let updatedCount = 0;
        for (const c of charactersData) {
            if (existingByName.has(c.name)) {
                const existId = existingByName.get(c.name);
                const result = updateStmt.run({
                    id: existId,
                    image: c.image || null,
                    stats_json: JSON.stringify(c.stats),
                    skills_json: JSON.stringify(c.skills),
                    forms_json: JSON.stringify(c.forms),
                    source_basis: c.source_basis,
                    gradient: c.gradient
                });
                updatedCount += result.changes;
            } else {
                let newId = c.id;
                if (usedIds.has(newId)) {
                    maxId++;
                    newId = maxId;
                } else {
                    maxId = Math.max(maxId, newId);
                }
                usedIds.add(newId);
                insertStmt.run({
                    id: newId,
                    name: c.name,
                    grade: c.grade,
                    source: c.source,
                    gradient: c.gradient,
                    image: c.image || null,
                    stats_json: JSON.stringify(c.stats),
                    skills_json: JSON.stringify(c.skills),
                    forms_json: JSON.stringify(c.forms),
                    source_basis: c.source_basis
                });
                insertedCount++;
            }
        }
        if (insertedCount > 0) {
            console.log(`[DB] 已补录 ${insertedCount} 个缺失角色`);
        }
        if (updatedCount > 0) {
            console.log(`[DB] 已更新 ${updatedCount} 个角色的数据`);
        }
    }

    // 初始化预置道具数据
    const itemCount = db.prepare('SELECT COUNT(*) as cnt FROM items').get();
    if (itemCount.cnt === 0) {
        const insertItemStmt = db.prepare(`
            INSERT INTO items (id, name, source, rarity, type, image, description, stats_bonus_json, skill_bonus, source_basis)
            VALUES (@id, @name, @source, @rarity, @type, @image, @description, @stats_bonus_json, @skill_bonus, @source_basis)
        `);
        const insertItems = db.transaction((items) => {
            for (const item of items) {
                insertItemStmt.run({
                    id: item.id,
                    name: item.name,
                    source: item.source,
                    rarity: item.rarity,
                    type: item.type,
                    image: item.image || null,
                    description: item.description || null,
                    stats_bonus_json: JSON.stringify(item.stats_bonus || {}),
                    skill_bonus: item.skill_bonus || null,
                    source_basis: item.source_basis || null
                });
            }
        });
        insertItems(itemsData);
        console.log(`[DB] 已初始化 ${itemsData.length} 件预置道具`);
    }

    // 初始化机器人玩家（若不存在）
    const botCount = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE username LIKE 'bot_%'").get();
    if (botCount.cnt === 0) {
        const bcrypt = require('bcryptjs');
        const botPassword = bcrypt.hashSync('bot_password_2024', 10);
        const bots = [
            { username: 'bot_孙悟空', nickname: '齐天大圣', avatar: '🐒' },
            { username: 'bot_诸葛亮', nickname: '卧龙先生', avatar: '🪶' },
            { username: 'bot_关羽', nickname: '武圣关公', avatar: '⚔️' },
            { username: 'bot_林黛玉', nickname: '潇湘妃子', avatar: '🌸' },
            { username: 'bot_项羽', nickname: '西楚霸王', avatar: '👑' },
            { username: 'bot_哪吒', nickname: '三太子', avatar: '🔥' },
            { username: 'bot_白素贞', nickname: '白蛇仙子', avatar: '🐍' },
            { username: 'bot_后羿', nickname: '射日英雄', avatar: '🏹' }
        ];
        const insertBot = db.prepare(`
            INSERT INTO users (username, password, nickname, avatar, wins, losses)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const insertBotTx = db.transaction((bots) => {
            for (const b of bots) {
                // 随机战绩
                const wins = Math.floor(Math.random() * 50) + 10;
                const losses = Math.floor(Math.random() * 30) + 5;
                insertBot.run(b.username, botPassword, b.nickname, b.avatar, wins, losses);
            }
        });
        insertBotTx(bots);
        console.log(`[DB] 已初始化 ${bots.length} 个机器人玩家`);
    }

    // 初始化预置名著数据（补录缺失书籍）
    const classicBooks = [
            {
                title: '聊斋志异',
                author: '蒲松龄',
                description: '清代文言短篇小说集，以狐仙鬼怪映射人间百态，其中聂小倩、婴宁、画皮等故事广为流传。',
                content: '聂小倩者，十八而殁。葬于寺侧，为妖所胁，以色惑人，摄其精血。宁采臣宿于寺中，夜有女子来，容华绝世。宁正色拒之。女曰：「妾非人间人，乃鬼也。妖魔迫妾害人，若不从，必遭酷刑。君若见容，妾愿追随。」宁大惊。后有剑客燕赤霞至，以剑斩妖，小倩得脱。宁携其骨归葬，后与小倩结为夫妻。\n\n婴宁者，狐女也。生而善笑，笑声如银铃。王子服见而悦之，娶为妻。初至，见人辄笑，客至亦笑。一日，邻子见其美，欲犯之。婴宁以幻术惩之。母责其笑，乃不复笑。后生一子，亦善笑。\n\n画皮者，太原王生，晨起遇一女郎独行，悦而收之。一道士见生曰：「君有妖气。」生不信。夜归，窥窗外，见一面目狰狞之鬼，正画人皮。生骇而走。鬼追至，裂其腹，掬其心而去。',
                source_type: 'classic',
                cover_gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            },
            {
                title: '山海经',
                author: '佚名',
                description: '先秦古籍，记载上古地理、物产、神怪。夸父逐日、精卫填海、刑天舞干戚等神话皆出于此。',
                content: '夸父与日逐走，入日。渴欲得饮，饮于河渭。河渭不足，北饮大泽。未至，道渴而死。弃其杖，化为邓林。\n\n精卫，炎帝之少女，名曰女娃。女娃游于东海，溺而不返，化为精卫鸟。常衔西山之木石，以堙于东海。\n\n刑天与帝争神，帝断其首，葬之常羊之山。乃以乳为目，以脐为口，操干戚以舞。\n\n又东三百里，曰青丘之山。有兽焉，其状如狐而九尾，其音如婴儿，能食人。食者不蛊。',
                source_type: 'classic',
                cover_gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            },
            {
                title: '搜神记',
                author: '干宝',
                description: '东晋志怪小说集，记载神仙鬼怪、民间传说。干将莫邪、董永卖身葬父等故事源于此书。',
                content: '干将莫邪为楚王铸剑，三年乃成。剑有雌雄。干将藏雄剑，献雌剑于楚王。楚王怒，杀干将。莫邪有遗腹子，名赤比。及长，问母父所在。母告之。赤比得雄剑，欲复仇。楚王梦一少年，眉间广尺，欲报仇。悬赏捕之。赤比逃入山中，遇客。客曰：「吾为汝报仇。」赤比自刎，头授客。客携头见楚王。王喜。客曰：「煮之。」头三日不烂。客邀王视之。客斩王头，复自刎。三头俱烂，不可分。乃合葬，名三王墓。\n\n董永家贫，父死，卖身葬父。道遇一女子，曰：「愿为子妻。」遂与之俱。主家令织缣三百匹，乃得归。女子一月织毕。曰：「我天之织女，感君至孝，天帝令我助君。」言毕凌空而去。',
                source_type: 'classic',
                cover_gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
            },
            {
                title: '太平广记',
                author: '李昉等',
                description: '北宋四大部书之一，收录汉至宋初小说野史五百卷。神仙、鬼怪、报应、狐妖各类故事包罗万象。',
                content: '唐天宝中，有崔炜者，性好施。逢一乞妪，足踬于地，伤其足。炜视之，见其足忽缩，如蛇蜕然。炜异之。妪曰：「君有善心，吾有艾炷一枚，能灸赘疣。若有人患此，君当灸之。」后炜以艾炷灸一胡僧之赘，胡僧谢曰：「吾居越王台下三十年矣。」遂携炜至一古殿，见数美女。一女曰：「吾齐田氏，隋末死于此。」炜后归人间，已是数百年后矣。\n\n又有狐妖化为女子，名曰阿紫。夜半来奔，与男子同居。后为人识破，狐化原形而去。',
                source_type: 'classic',
                cover_gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
            },
            {
                title: '子不语',
                author: '袁枚',
                description: '清代笔记小说集，取「子不语怪力乱神」之意。收录鬼神怪异之事，文笔简洁，寓意深远。',
                content: '杭州张大令署中，夜半闻鬼哭。一夕，有女鬼披发而至，自言为前任某妾，被正妻所害，埋于西廊下。张令掘之，果得白骨。厚葬之，鬼乃安。\n\n金陵蒋生，读书于废寺。一夕，有老翁至，自称是狐仙。与蒋生谈论经史，多有妙解。一日，翁曰：「吾劫数已到，君能救我乎？」蒋问何法。翁曰：「明日有雷击此寺，君但抱我怀中。」次日果雷雨大作，蒋抱一白狐于怀中。雷止，狐化为翁，谢曰：「吾受君恩，当报。」遂授蒋以奇术，后蒋生以医术闻名。\n\n苏州陈某，夜行遇一女子，容色甚美。与之同宿。次日，陈觉身倦。如是数月，陈形体消瘦。一道士见之，曰：「君为鬼所惑。」以符水治之。是夜，女鬼来，泣曰：「妾与君有夙缘，今缘尽矣。」遂别去。',
                source_type: 'classic',
                cover_gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
            },
            {
                title: '阅微草堂笔记',
                author: '纪昀',
                description: '清代纪晓岚所著笔记小说，以「阅微」为名，记录狐鬼神怪、因果报应之事，寓劝惩之意。',
                content: '献县周氏仆，夜行遇一鬼。鬼曰：「吾新死，无依。愿随君。」仆惧，不许。鬼曰：「吾不害人，但求一栖处。」仆不得已，许之。自此，仆每行事，鬼必预知。一日，鬼曰：「明日主人将遣汝远行，途中有盗，当戒。」仆如言，果免。后鬼辞去，曰：「吾将投生矣。」\n\n沧州刘玉，夜宿古庙。闻有人语，窥之，见数鬼聚饮。一鬼曰：「明日某村某妇当死，吾等往摄之。」刘玉记之。次日，往某村，果闻有妇病。刘玉告以鬼语，令其家人急求名医。妇遂得救。夜半，鬼来怒曰：「汝坏吾事！」刘玉曰：「人命至重，何得不论？」鬼无言而退。\n\n又有一狐，居人家数十年。一日谓主人曰：「吾将去矣。君家有难，吾不能久留。但记：水来之前，必有鼠迁。」后数年，大水至，主人先见鼠群迁走，乃避于高地，得免。',
                source_type: 'classic',
                cover_gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
            },
            {
                title: '西游记',
                author: '吴承恩',
                description: '明代神魔小说，四大名著之一。讲述孙悟空、猪八戒、沙僧护送唐僧西天取经，历经九九八十一难的故事。',
                content: '诗曰：混沌未分天地乱，茫茫渺渺无人见。自从盘古破鸿蒙，开辟从兹清浊辨。\n\n那猴在山中，却会行走跳跃，食草木，饮涧泉，采山花，觅树果；与狼虫为伴，虎豹为群，獐鹿为友，猕猿为亲；夜宿石崖之下，朝游峰洞之中。\n\n玉帝大恼。即差四大天王，协同李天王并哪吒太子，点二十八宿、九曜星官、十二元辰、五方揭谛、四值功曹、东西星斗、南北二神、五岳四渎、普天星相，共十万天兵，布一十八架天罗地网下界，去花果山围困，定捉获那厮处治。\n\n大圣即摇身一变，变作三头六臂；把如意金箍幌一幌，变作三条；六只手使开三条棒，好便似纺车儿一般，滴流流，在那垓心里飞舞。众天神果也莫能相近。\n\n行者道：「老孙五百年前大闹天宫时，被打入太上老君炉里炼了四十九日，开炉时一脚蹬倒了八卦炉，走了老孙。老孙在炉里不觉炼得个金子心肝，银子肺腑，铜筋铁骨。」\n\n那八戒乃天蓬元帅下凡，错投猪胎。生得长嘴大耳，脑后一溜鬃毛。手持九齿钉耙，力大无穷。唐僧收他为徒，赐名猪悟能，号八戒。',
                source_type: 'classic',
                cover_gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
            },
            {
                title: '三国演义',
                author: '罗贯中',
                description: '元代历史小说，四大名著之一。以东汉末年至西晋初年为背景，描绘魏蜀吴三国鼎立、群雄逐鹿的史诗画卷。',
                content: '词曰：滚滚长江东逝水，浪花淘尽英雄。是非成败转头空。青山依旧在，几度夕阳红。白发渔樵江渚上，惯看秋月春风。一壶浊酒喜相逢。古今多少事，都付笑谈中。\n\n飞曰：「吾庄后有一桃园，花开正盛；明日当于园中祭告天地，我三人结为兄弟，协力同心，然后可图大事。」玄德、云长齐声应曰：「如此甚好。」\n\n次日，于桃园中，备下乌牛白马祭礼等项，三人焚香再拜而说誓曰：「念刘备、关羽、张飞，虽然异姓，既结为兄弟，则同心协力，救困扶危；上报国家，下安黎庶。不求同年同月同日生，只愿同年同月同日死。皇天后土，实鉴此心，背义忘恩，天人共戮！」誓毕，拜玄德为兄，关羽次之，张飞为弟。\n\n操教酾热酒一杯，与关公饮了上马。关公曰：「酒且斟下，某去便来。」出帐提刀，飞身上马。众诸侯听得关外鼓声大振，喊声大举，如天摧地塌，岳撼山崩，众皆失惊。正欲探听，鸾铃响处，马到中军，云长提华雄之头，掷于地上。其酒尚温。\n\n孔明曰：「曹操百万之众，不可轻敌。吾料曹操必从此路来。先以伏兵胜之。」乃令赵云、张飞、关羽各引军埋伏。孔明乃于山上坐定，摇扇指挥。',
                source_type: 'classic',
                cover_gradient: 'linear-gradient(135deg, #5f72bd 0%, #9b23ea 100%)'
            },
            {
                title: '水浒传',
                author: '施耐庵',
                description: '元末明初英雄小说，四大名著之一。讲述北宋末年一百零八位好汉聚义梁山泊、替天行道的故事。',
                content: '诗曰：纷纷五代乱离间，一旦云开复见天。草木百年新雨露，车书万里旧江山。\n\n鲁达道：「老儿，你来！洒家和你说话。」那老儿慌忙应诺。鲁达道：「你这老儿，为何教女儿唱曲儿？」老儿道：「老汉姓金，双名老儿。女儿名唤翠莲。因来渭州投亲不遇，却被此间一个财主镇关西强骗了去。」鲁达听了大怒道：「呸！俺只道那个郑大官人，却原来是杀猪的郑屠！这个腌臜泼才，投托着俺小种经略相公门下做个肉铺户，却原来这等欺负人！」\n\n鲁达来到郑屠门前，叫道：「郑屠！」郑屠连忙出来。鲁达道：「经略相公钧旨，要十斤精肉，切作臊子，不要见半点肥的在上面。」郑屠切了。鲁达又道：「再要十斤都是肥的，不要见些精的在上面，也要切作臊子。」郑屠又切了。鲁达又道：「再要十斤寸金软骨，也要细细地剁作臊子，不要见些肉在上面。」郑屠笑道：「却不是特地来消遣我？」鲁达听了，跳起身来，拿着那两包臊子在手，睁着眼，看着郑屠道：「洒家特地要消遣你！」把两包臊子劈面打去，却似下了一阵肉雨。\n\n武松走了一程，酒力发作，焦热起来。一只手提哨棒，一只手把胸膛前袒开，踉踉跄跄，直奔过乱树林来。见一块光挞挞大青石，把那哨棒倚在一边，放翻身体，却待要睡。只见发起一阵狂风。那一阵风过处，只听得乱树背后扑地一声响，跳出一只吊睛白额大虫来。武松见了，叫声「阿呀」，从半空里直撺下来，被那一惊，酒都做冷汗出了。\n\n林冲踏着碎琼乱玉，迤逦背着北风而行。那雪正下得紧。行不上半里多路，看见一所古庙。林冲顶礼道：「神明庇佑，改日来烧纸钱。」',
                source_type: 'classic',
                cover_gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)'
            },
            {
                title: '红楼梦',
                author: '曹雪芹',
                description: '清代世情小说，四大名著之首。以贾宝玉、林黛玉、薛宝钗的爱情婚姻悲剧为主线，描绘贾府由盛转衰的命运。',
                content: '满纸荒唐言，一把辛酸泪。都云作者痴，谁解其中味？\n\n此开卷第一回也。作者自云：因曾历过一番梦幻之后，故将真事隐去，而借通灵之说，撰此《石头记》一书也。\n\n黛玉心中正疑惑着：「这个宝玉，不知是怎生个惫懒人物，懵懂顽童？倒不见那蠢物也罢了。」心中想着，忽见丫鬟话未报完，已进来了一位年轻的公子。黛玉一见，便吃一大惊，心下想道：「好生奇怪，倒象在那里见过一般，何等眼熟到如此！」\n\n宝玉看罢，因笑道：「这个妹妹我曾见过的。」贾母笑道：「可又是胡说，你又何曾见过他？」宝玉笑道：「虽然未曾见过他，然我看着面善，心里就算是旧相识，今日只作远别重逢，亦未为不可。」贾母笑道：「更好，更好，若如此，更相和睦了。」\n\n宝钗生得肌骨莹润，举止娴雅。唇不点而红，眉不画而翠，脸若银盆，眼如水杏。罕言寡语，人谓藏愚；安分随时，自云守拙。\n\n花谢花飞花满天，红消香断有谁怜？游丝软系飘春榭，落絮轻沾扑绣帘。一年三百六十日，风刀霜剑严相逼。明媚鲜妍能几时，一朝飘泊难寻觅。试看春残花渐落，便是红颜老死时。一朝春尽红颜老，花落人亡两不知。',
                source_type: 'classic',
                cover_gradient: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)'
            },
            {
                title: '封神演义',
                author: '许仲琳',
                description: '明代神魔小说，以武王伐纣为背景，融合阐教、截教仙斗法，哪吒、杨戬、姜子牙等形象深入人心。',
                content: '诗曰：混沌初分盘古先，太极两仪四象悬。子天丑地人寅出，避除兽患有巢轩。\n\n哪吒年方七岁，身长六尺。时逢五月天气炎热，哪吒同家将到东海口上洗澡。哪吒将脱下衣服放在石上，见水势滔滔，因将混天绑在身上，蘸水洗澡。不知这河是九湾河，乃东海口上。哪吒将此宝在水中搅动，那水晶宫殿摇动如响。\n\n龙王三太子敖丙出来看时，哪吒道：「你这泼物，好大胆子！」将乾坤圈打来。敖丙一枪刺来，被哪吒躲过，将乾坤圈打敖丙头顶，打出一条龙来。哪吒将龙筋抽了，做一条龙筋绦。\n\n那杨戬生得面如敷粉，唇似涂朱，眉清目秀。手持三尖两刃刀，有七十二变化。又有一犬，名曰哮天犬。\n\n子牙曰：「吾乃昆仑山玉虚宫门下，姓姜名尚，字子牙。道号飞熊。奉师命下山，辅佐明君。」文王大喜，亲自拉车，请子牙同载而归。\n\n妲己乃千年狐狸精所变。纣王宠信妲己，造酒池肉林，设炮烙之刑。比干进谏曰：「皇后有道，则天下治；皇后无道，则天下乱。今妲己迷惑圣聪，臣恐社稷危矣。」妲己闻之大怒，欲害比干。乃佯病，谓纣王曰：「妾闻圣人有七窍之心，若得比干之心煎汤服之，妾病可愈。」纣王乃命比干剖心。比干怒曰：「昏君！汝信妖妇之言，剖我心，我死不惜，只可惜成汤六百年基业毁于一旦！」乃剖腹取心而死。',
                source_type: 'classic',
                cover_gradient: 'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)'
            },
            {
                title: '白蛇传',
                author: '冯梦龙（辑）',
                description: '中国四大民间爱情传说之一。讲述白蛇精白素贞与许仙的爱情故事，历经金山寺斗法、雷峰塔镇妖等磨难。',
                content: '话说道宗年间，杭州西湖之上，有白蛇修炼千年成精，化名白素贞，偕青蛇小青游湖。清明时节，许仙游湖遇雨，借伞于白素贞。二人一见钟情，遂结为夫妻，在杭州开一药铺，名曰保和堂。\n\n白素贞医术高明，为人治病不取分文，杭州百姓无不称颂。金山寺法海和尚识破白素贞乃蛇妖所化，告知许仙。许仙初不信，法海令其于端午节以雄黄酒试之。白素贞饮下雄黄酒，现出白蛇原形，许仙惊吓而死。\n\n白素贞醒后见许仙已死，悲痛欲绝。乃赴昆仑山盗取仙草。与守山仙童大战，终于取得灵芝仙草，救活许仙。\n\n法海将许仙藏于金山寺。白素贞与小青至金山寺讨要丈夫，法海不允。白素贞大怒，施展法术，水漫金山。一时波涛汹涌，金山寺岌岌可危。法海以袈裟护寺，白蛇终不能破。\n\n后白素贞产下一子，名许仕林。法海以金钵收伏白素贞，镇于雷峰塔下。留偈曰：「西湖水干，江潮不起，雷峰塔倒，白蛇出世。」二十年后，许仕林高中状元，至塔前祭母，孝心感动天地，雷峰塔倒，白素贞终得出塔，全家团圆。',
                source_type: 'classic',
                cover_gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)'
            }
        ];
    {
        const existingTitles = new Set(db.prepare('SELECT title FROM books').all().map(r => r.title));
        const insertBook = db.prepare(`
            INSERT INTO books (title, author, description, content, source_type, cover_gradient)
            VALUES (@title, @author, @description, @content, @source_type, @cover_gradient)
        `);
        let insertedBookCount = 0;
        for (const b of classicBooks) {
            if (!existingTitles.has(b.title)) {
                insertBook.run(b);
                insertedBookCount++;
            }
        }
        if (insertedBookCount > 0) {
            console.log(`[DB] 已补录 ${insertedBookCount} 部名著（共 ${classicBooks.length} 部）`);
        }
    }
}

// 执行初始化
initDB();

module.exports = db;
