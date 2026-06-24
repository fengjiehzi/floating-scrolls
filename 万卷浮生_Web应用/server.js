// server.js - Express服务器入口
// 设置控制台为UTF-8编码
try {
    const { execSync } = require('child_process');
    execSync('chcp 65001', { stdio: 'ignore' });
} catch (e) {}
process.stdout.setEncoding('utf8');

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

// 加载环境变量（若存在.env文件则使用，否则使用默认值）
try {
    require('fs').accessSync(path.join(__dirname, '.env'));
    require('dotenv').config();
} catch (e) {
    // 没有.env文件，使用默认值
}

// 引入模块（db.js会自动初始化数据库）
const db = require('./db');
const { register, login, getUserById, authMiddleware } = require('./auth');
const { initWSServer, onlineUsers, getAllOnlineUsers } = require('./ws-server');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件（设置UTF-8编码）
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=UTF-8');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        }
    }
}));

// ==================== 鉴权API ====================
// 注册
app.post('/api/auth/register', (req, res) => {
    const { username, password, nickname, avatar } = req.body;
    const result = register(username, password, nickname, avatar);
    if (result.success) {
        res.json({ token: result.token, user: result.user });
    } else {
        res.status(400).json({ error: result.message });
    }
});

// 登录
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const result = login(username, password);
    if (result.success) {
        res.json({ token: result.token, user: result.user });
    } else {
        res.status(400).json({ error: result.message });
    }
});

// 获取当前用户
app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

// ==================== 角色API ====================
// 获取所有角色
app.get('/api/characters', (req, res) => {
    const rows = db.prepare('SELECT * FROM characters ORDER BY id').all();
    const characters = rows.map(r => ({
        id: r.id,
        name: r.name,
        grade: r.grade,
        source: r.source,
        gradient: r.gradient,
        image: r.image,
        stats: JSON.parse(r.stats_json),
        skills: JSON.parse(r.skills_json),
        forms: JSON.parse(r.forms_json),
        source_basis: r.source_basis
    }));
    res.json({ characters });
});

// 常见中文姓氏字符集（用于角色名提取）
const SURNAME_CHARS = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万支柯昝管卢莫经房裘缪干解应宗丁宣贲邓郁单杭洪包诸左石崔吉钮龚程嵇邢滑裴陆荣翁荀羊於惠甄曲家封芮羿储靳汲邴糜松井段富巫乌焦巴弓牧隗山谷车侯宓蓬全郗班仰秋仲伊宫宁仇栾暴甘钭厉戎祖武符刘景詹束龙叶幸司韶郜黎蓟薄印宿白怀蒲邰从鄂索咸籍赖卓蔺屠蒙池乔阴郁胥能苍双闻莘党翟谭贡劳逄姬申扶堵冉宰郦雍却璩桑桂濮牛寿通边扈燕冀郏浦尚农温别庄晏柴瞿阎充慕连茹习宦艾鱼容向古易慎戈廖庾终暨居衡步都耿满弘匡国文寇广禄阙东欧殳沃利蔚越夔隆师巩厍聂晁勾敖融冷訾辛阚那简饶空曾毋沙乜养鞠须丰巢关蒯相查后荆红游竺权逯盖益桓公';

// 停用词列表（常见非角色词，避免误识别为角色名）
const STOP_WORDS = new Set([
    '于是', '于此', '于今', '于时', '于是乎',
    '王子', '王者', '王道', '王朝',
    '张望', '张开', '张罗', '张口',
    '周围', '周边', '周遭', '周期',
    '孙子', '孙女',
    '何时', '何地', '何故', '何事', '何人', '何方', '何处', '何为',
    '许多', '许可', '少许', '或许', '允许', '应许',
    '高兴', '高速', '高大', '高级', '高峰', '高手', '高温', '高原',
    '方向', '方法', '方面', '方式', '地方', '前方', '后方', '上方', '下方', '东方', '西方', '南方', '北方',
    '石头', '石化', '宝石',
    '白色', '白天', '白云', '白雪', '明白', '说明', '明显', '聪明', '表白',
    '叶子', '叶片', '落叶',
    '黄色', '黄金', '黄昏',
    '水平', '水面', '水深', '水流', '水滴',
    '安全', '安排', '安静', '安装', '安稳', '安心', '安宁',
    '经常', '常常', '常客', '常识', '常态', '日常', '平常', '正常',
    '成为', '成功', '成绩', '成本', '成立', '完成', '构成', '形成',
    '时间', '时候', '时刻', '时期', '时代', '时光', '同时',
    '明天', '明显', '明亮', '明白', '说明', '聪明', '光明', '文明',
    '文字', '文化', '文明', '文章', '文件', '文本', '文笔',
    '武器', '武装', '武力', '武功', '武将',
    '山水', '山顶', '山谷', '山峰', '山林',
    '田野', '田地', '田园',
    '云彩', '云端', '风云',
    '风景', '风光', '风采',
    '马路', '马力', '马上',
    '他们', '她们', '我们', '你们', '人们', '咱们', '它们',
    '自己', '别人', '大家', '他人', '旁人',
    '什么', '怎么', '为什么', '怎样', '如何', '多少',
    '这个', '那个', '这些', '那些', '此处', '彼处',
    '可以', '应该', '可能', '已经', '正在', '将要',
    '因为', '所以', '但是', '不过', '然而', '虽然', '尽管',
    '如果', '除非', '只要', '只有', '无论', '不管',
    '然后', '接着', '后来', '最后', '首先',
    '一些', '许多', '很多', '所有', '全部', '少数', '多数',
    '非常', '十分', '极其', '格外', '特别', '尤其',
    '今天', '明天', '昨天', '现在', '过去', '未来', '以前', '以后',
    '上面', '下面', '左边', '右边', '前面', '后面', '里面', '外面', '中间', '旁边',
    '起来', '下来', '过来', '过去', '出来', '进去',
    '之时', '之后', '之前', '之间', '之内', '之外',
    '的人', '的事', '的话', '之物',
    '于是', '因此', '所以', '因而', '故而',
    '不但', '不仅', '而且', '并且', '况且',
    '或者', '还是', '要么', '与其', '不如',
    '就是', '还是', '也许', '或许', '大概',
    '确实', '的确', '一定', '必然', '务必',
    '不要', '不能', '不可', '不应', '不准',
    '没有', '不是', '不会', '不能', '不要',
    '的人', '的人', '之物', '之事',
    '到了', '到时', '到达',
    '起来', '下来', '过来', '过去', '出来', '进去',
    '于是', '于是乎', '于此', '于今', '于时',
    '东方', '南方', '西方', '北方', '上方', '下方',
]);

// AI提取角色名接口（从小说文本中提取候选角色名）
app.post('/api/characters/extract-names', (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: '缺少text字段或text不是字符串' });
    }

    // 获取已存在的角色名，用于过滤
    const existingChars = db.prepare('SELECT name FROM characters').all();
    const existingNames = new Set(existingChars.map(c => c.name));

    // 构建姓氏字符集（用于快速判断）
    const surnameSet = new Set(SURNAME_CHARS.split(''));

    // 统计候选名字出现次数
    // 策略：从每个姓氏字符位置开始，提取2字和3字组合，分别统计词频
    const nameCount = new Map();
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (!surnameSet.has(ch)) continue;

        // 提取2字名（姓氏+1字）
        if (i + 1 < text.length && /[\u4e00-\u9fa5]/.test(text[i + 1])) {
            const two = ch + text[i + 1];
            if (!STOP_WORDS.has(two) && !existingNames.has(two)) {
                nameCount.set(two, (nameCount.get(two) || 0) + 1);
            }
        }

        // 提取3字名（姓氏+2字）
        if (i + 2 < text.length && /[\u4e00-\u9fa5]/.test(text[i + 1]) && /[\u4e00-\u9fa5]/.test(text[i + 2])) {
            const three = ch + text[i + 1] + text[i + 2];
            if (!STOP_WORDS.has(three) && !existingNames.has(three)) {
                nameCount.set(three, (nameCount.get(three) || 0) + 1);
            }
        }
    }

    // 筛选出现≥3次的候选名字，按出现次数降序排列
    // 优先返回3字名（更可能是完整角色名），若3字名出现次数≥3则不返回其2字前缀
    const allNames = Array.from(nameCount.entries())
        .filter(([_, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1]);

    // 去重：如果3字名已入选，移除其2字前缀
    const threeCharNames = new Set(allNames.filter(([n]) => n.length === 3).map(([n]) => n));
    const names = allNames
        .filter(([name]) => {
            if (name.length === 2 && threeCharNames.size > 0) {
                // 检查是否有3字名以此2字名开头
                for (const three of threeCharNames) {
                    if (three.startsWith(name)) return false;
                }
            }
            return true;
        })
        .map(([name]) => name);

    res.json({ names });
});

// 创建自定义角色接口
app.post('/api/characters/custom', authMiddleware, (req, res) => {
    const { name, grade, source, gradient, stats, skills, forms, source_basis } = req.body;

    // 数据校验：name
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: '角色名不能为空' });
    }
    // 数据校验：grade
    if (!['S', 'A', 'B', 'C'].includes(grade)) {
        return res.status(400).json({ error: '等级grade必须是S/A/B/C之一' });
    }
    // 数据校验：source（默认"自定义"）
    const finalSource = (source && typeof source === 'string') ? source : '自定义';
    // 数据校验：source_basis
    if (!source_basis || typeof source_basis !== 'string' || source_basis.trim() === '') {
        return res.status(400).json({ error: 'source_basis不能为空' });
    }

    // 数据校验：stats
    const requiredStats = ['power', 'speed', 'intelligence', 'defense', 'special_ability', 'hp', 'mp'];
    if (!stats || typeof stats !== 'object') {
        return res.status(400).json({ error: 'stats必须是一个对象' });
    }
    for (const key of requiredStats) {
        if (typeof stats[key] !== 'number' || isNaN(stats[key])) {
            return res.status(400).json({ error: `stats.${key}必须是数字` });
        }
        if (stats[key] < 0 || stats[key] > 10000) {
            return res.status(400).json({ error: `stats.${key}数值超出合理区间(0-10000)` });
        }
    }

    // 数据校验：skills（至少3个）
    if (!Array.isArray(skills) || skills.length < 3) {
        return res.status(400).json({ error: 'skills必须是数组且至少包含3个技能' });
    }
    for (let i = 0; i < skills.length; i++) {
        const s = skills[i];
        if (!s.name || typeof s.name !== 'string') {
            return res.status(400).json({ error: `skills[${i}].name不能为空` });
        }
        if (!s.type || typeof s.type !== 'string') {
            return res.status(400).json({ error: `skills[${i}].type不能为空` });
        }
        if (!s.desc || typeof s.desc !== 'string') {
            return res.status(400).json({ error: `skills[${i}].desc不能为空` });
        }
        if (typeof s.multiplier !== 'number' || s.multiplier <= 0) {
            return res.status(400).json({ error: `skills[${i}].multiplier必须是正数` });
        }
        if (typeof s.mp_cost !== 'number' || s.mp_cost < 0) {
            return res.status(400).json({ error: `skills[${i}].mp_cost必须是非负数` });
        }
    }

    // 数据校验：forms（至少1个）
    if (!Array.isArray(forms) || forms.length < 1) {
        return res.status(400).json({ error: 'forms必须是数组且至少包含1个形态' });
    }
    for (let i = 0; i < forms.length; i++) {
        const f = forms[i];
        if (!f.name || typeof f.name !== 'string') {
            return res.status(400).json({ error: `forms[${i}].name不能为空` });
        }
        if (!f.desc || typeof f.desc !== 'string') {
            return res.status(400).json({ error: `forms[${i}].desc不能为空` });
        }
        if (!f.bonuses || typeof f.bonuses !== 'object') {
            return res.status(400).json({ error: `forms[${i}].bonuses必须是对象` });
        }
    }

    try {
        // 生成新ID（当前最大ID+1）
        const maxIdRow = db.prepare('SELECT MAX(id) as max_id FROM characters').get();
        const newId = (maxIdRow.max_id || 0) + 1;

        // 保存到characters表（source字段设为"自定义"）
        db.prepare(`
            INSERT INTO characters (id, name, grade, source, gradient, image, stats_json, skills_json, forms_json, source_basis)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            newId,
            name.trim(),
            grade,
            '自定义',
            gradient || null,
            null,
            JSON.stringify(stats),
            JSON.stringify(skills),
            JSON.stringify(forms),
            source_basis
        );

        // 插入user_characters表（当前用户拥有此角色）
        try {
            db.prepare('INSERT INTO user_characters (user_id, character_id) VALUES (?, ?)').run(req.user.id, newId);
        } catch (err) {
            // 已拥有该角色则忽略
        }

        res.json({ success: true, character_id: newId });
    } catch (err) {
        console.error('创建自定义角色失败:', err);
        res.status(500).json({ error: '创建角色失败: ' + err.message });
    }
});

// 获取角色详情
app.get('/api/characters/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: '角色不存在' });
    const character = {
        id: row.id,
        name: row.name,
        grade: row.grade,
        source: row.source,
        gradient: row.gradient,
        image: row.image,
        stats: JSON.parse(row.stats_json),
        skills: JSON.parse(row.skills_json),
        forms: JSON.parse(row.forms_json),
        source_basis: row.source_basis
    };
    res.json({ character });
});

// ==================== 玩家角色库API ====================
// 获取我的角色库
app.get('/api/me/characters', authMiddleware, (req, res) => {
    const rows = db.prepare(`
        SELECT c.*, uc.level, uc.exp, uc.unlocked_forms
        FROM user_characters uc
        JOIN characters c ON uc.character_id = c.id
        WHERE uc.user_id = ?
        ORDER BY c.id
    `).all(req.user.id);
    const characters = rows.map(r => ({
        id: r.id,
        name: r.name,
        grade: r.grade,
        source: r.source,
        gradient: r.gradient,
        stats: JSON.parse(r.stats_json),
        skills: JSON.parse(r.skills_json),
        forms: JSON.parse(r.forms_json),
        source_basis: r.source_basis,
        level: r.level,
        exp: r.exp,
        unlocked_forms: JSON.parse(r.unlocked_forms || '[]')
    }));
    res.json({ characters });
});

// 添加角色到我的库
app.post('/api/me/characters', authMiddleware, (req, res) => {
    const { character_id } = req.body;
    if (!character_id) return res.status(400).json({ error: '缺少character_id' });
    // 检查角色是否存在
    const char = db.prepare('SELECT id FROM characters WHERE id = ?').get(character_id);
    if (!char) return res.status(404).json({ error: '角色不存在' });
    // 插入（若已存在则忽略）
    try {
        db.prepare('INSERT INTO user_characters (user_id, character_id) VALUES (?, ?)').run(req.user.id, character_id);
        res.json({ success: true });
    } catch (err) {
        // 已拥有该角色
        res.json({ success: true, message: '已拥有该角色' });
    }
});

// 获取角色成长信息
app.get('/api/me/characters/:id/growth', authMiddleware, (req, res) => {
    const charId = req.params.id;
    // 查询user_characters表获取level, exp, unlocked_forms
    const uc = db.prepare('SELECT level, exp, unlocked_forms FROM user_characters WHERE user_id = ? AND character_id = ?').get(req.user.id, charId);
    if (!uc) {
        return res.status(404).json({ error: '您未拥有该角色' });
    }
    // 查询characters表获取forms数据
    const char = db.prepare('SELECT forms_json FROM characters WHERE id = ?').get(charId);
    if (!char) {
        return res.status(404).json({ error: '角色不存在' });
    }

    const level = uc.level || 1;
    const exp = uc.exp || 0;
    const unlockedForms = JSON.parse(uc.unlocked_forms || '[]');
    const forms = JSON.parse(char.forms_json || '[]');

    // 升级所需经验：level * 100
    const expToNext = level * 100;

    // 构建all_forms数组，标记每个形态是否已解锁及解锁等级
    // 形态解锁规则：索引0默认解锁，索引1需level>=3，索引2需level>=6
    const unlockLevelMap = [0, 3, 6];
    const allForms = forms.map((form, idx) => {
        const unlockLevel = unlockLevelMap[idx] !== undefined ? unlockLevelMap[idx] : (idx * 3);
        // 索引0默认解锁；其他索引需在 unlocked_forms 中或等级达标
        const unlocked = idx === 0 || unlockedForms.includes(idx) || level >= unlockLevel;
        if (unlocked) {
            return { name: form.name, desc: form.desc, unlocked: true };
        } else {
            return { name: form.name, desc: form.desc, unlocked: false, unlock_level: unlockLevel };
        }
    });

    // 属性加成：每级+2%（level 1时为0%，level 2时为2%...）
    const statBonus = (level - 1) * 0.02;

    res.json({
        level: level,
        exp: exp,
        exp_to_next: expToNext,
        unlocked_forms: unlockedForms,
        all_forms: allForms,
        stat_bonus: statBonus
    });
});

// 从我的库移除角色
app.delete('/api/me/characters/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM user_characters WHERE user_id = ? AND character_id = ?').run(req.user.id, req.params.id);
    res.json({ success: true });
});

// ==================== 战绩API ====================
// 我的战绩
app.get('/api/me/stats', authMiddleware, (req, res) => {
    const user = db.prepare('SELECT wins, losses FROM users WHERE id = ?').get(req.user.id);
    const total = user.wins + user.losses;
    const winRate = total > 0 ? Math.round(user.wins / total * 100) : 0;
    // 最近5场战斗
    const recentBattles = db.prepare(`
        SELECT b.*, u1.nickname as p1_nickname, u1.avatar as p1_avatar,
               u2.nickname as p2_nickname, u2.avatar as p2_avatar,
               c1.name as p1_char_name, c1.gradient as p1_char_gradient,
               c2.name as p2_char_name, c2.gradient as p2_char_gradient
        FROM battles b
        LEFT JOIN users u1 ON b.player1_id = u1.id
        LEFT JOIN users u2 ON b.player2_id = u2.id
        LEFT JOIN characters c1 ON b.player1_char_id = c1.id
        LEFT JOIN characters c2 ON b.player2_char_id = c2.id
        WHERE b.player1_id = ? OR b.player2_id = ?
        ORDER BY b.created_at DESC
        LIMIT 5
    `).all(req.user.id, req.user.id);
    res.json({
        wins: user.wins,
        losses: user.losses,
        win_rate: winRate,
        recent_battles: recentBattles
    });
});

// 我的对战记录
app.get('/api/me/battles', authMiddleware, (req, res) => {
    const battles = db.prepare(`
        SELECT b.*, u1.nickname as p1_nickname, u1.avatar as p1_avatar,
               u2.nickname as p2_nickname, u2.avatar as p2_avatar,
               c1.name as p1_char_name, c1.gradient as p1_char_gradient, c1.grade as p1_char_grade,
               c2.name as p2_char_name, c2.gradient as p2_char_gradient, c2.grade as p2_char_grade
        FROM battles b
        LEFT JOIN users u1 ON b.player1_id = u1.id
        LEFT JOIN users u2 ON b.player2_id = u2.id
        LEFT JOIN characters c1 ON b.player1_char_id = c1.id
        LEFT JOIN characters c2 ON b.player2_char_id = c2.id
        WHERE b.player1_id = ? OR b.player2_id = ?
        ORDER BY b.created_at DESC
        LIMIT 20
    `).all(req.user.id, req.user.id);
    res.json({ battles });
});

// ==================== 排行榜与在线玩家 ====================
// 排行榜（包含机器人玩家）
app.get('/api/leaderboard', (req, res) => {
    const users = db.prepare(`
        SELECT id, username, nickname, avatar, wins, losses,
               CASE WHEN wins + losses > 0 THEN ROUND(wins * 100.0 / (wins + losses), 1) ELSE 0 END as win_rate
        FROM users
        ORDER BY wins DESC, win_rate DESC
        LIMIT 20
    `).all();
    res.json({ users });
});

// 在线玩家列表（包含机器人）
app.get('/api/online', (req, res) => {
    const onlineList = getAllOnlineUsers ? getAllOnlineUsers() : [];
    res.json({ users: onlineList });
});

// 所有非API路由返回index.html（单页应用）
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// 创建HTTP服务器并启动
const server = http.createServer(app);

// 初始化WebSocket服务器（与HTTP共享同一端口）
initWSServer(server);

server.listen(PORT, () => {
    console.log('========================================');
    console.log('  万卷浮生 Web应用 已启动');
    console.log('========================================');
    console.log(`  HTTP服务: http://localhost:${PORT}`);
    console.log(`  WebSocket: ws://localhost:${PORT}`);
    console.log('========================================');
    console.log('  按 Ctrl+C 停止服务器');
    console.log('========================================');
});
