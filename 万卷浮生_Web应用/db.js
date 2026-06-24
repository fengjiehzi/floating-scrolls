// db.js - 数据库初始化与Schema
// 使用 better-sqlite3 同步API

const Database = require('better-sqlite3');
const path = require('path');
const charactersData = require('./characters-data');

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
        // 更新已存在角色的image字段（兼容旧数据）
        const updateStmt = db.prepare("UPDATE characters SET image = ? WHERE id = ? AND image != ?");
        let updatedCount = 0;
        for (const c of charactersData) {
            if (c.image) {
                const result = updateStmt.run(c.image, c.id, c.image);
                updatedCount += result.changes;
            }
        }
        if (updatedCount > 0) {
            console.log(`[DB] 已更新 ${updatedCount} 个角色的图片路径`);
        }
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
}

// 执行初始化
initDB();

module.exports = db;
