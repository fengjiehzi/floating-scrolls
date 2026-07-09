// server.js - Express服务器入口
// 设置控制台为UTF-8编码
try {
    const { execSync } = require('child_process');
    execSync('chcp 65001', { stdio: 'ignore' });
} catch (e) {}
// 设置标准输出为UTF-8编码（部分Node版本不支持setEncoding，用try-catch兼容）
try {
    if (typeof process.stdout.setEncoding === 'function') {
        process.stdout.setEncoding('utf8');
    }
} catch (e) {}

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
const aiService = require('./ai-service');
const { getAllProviders, getModelsByProvider, getProvider } = require('./ai-model-presets');
const storyDag = require('./story-dag');
const battleEngine = require('./battle-engine');

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件（设置UTF-8编码）
app.use(express.static(path.join(__dirname, 'public'), {
    etag: true,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=UTF-8');
            res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.endsWith('.module.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
            res.setHeader('Cache-Control', 'no-cache, must-revalidate');
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

// AI 角色卡字段兼容性预处理（容错 AI 返回的字段类型偏差，如字符串数字、漏字段等）
// 保留后续严格校验的业务语义，仅做类型规范化
function normalizeAiCharacterCard(input) {
    if (!input || typeof input !== 'object') return input;
    const out = { ...input };
    // stats 字段类型转换：7 个固定字段强制 Number，缺失补 0
    if (out.stats && typeof out.stats === 'object') {
        const numKeys = ['power', 'speed', 'intelligence', 'defense', 'special_ability', 'hp', 'mp'];
        for (const k of numKeys) {
            if (out.stats[k] !== undefined && out.stats[k] !== null) {
                const n = Number(out.stats[k]);
                out.stats[k] = isNaN(n) ? 0 : Math.max(0, Math.min(10000, n));
            } else {
                out.stats[k] = 0;
            }
        }
    }
    // skills 字段类型转换：5 个固定字段强制规范
    if (Array.isArray(out.skills)) {
        out.skills = out.skills.map(s => (s && typeof s === 'object') ? {
            name: String(s.name || ''),
            type: String(s.type || 'attack'),
            desc: String(s.desc || ''),
            multiplier: Number(s.multiplier) > 0 ? Number(s.multiplier) : 1.5,
            mp_cost: Math.max(0, Number(s.mp_cost) || 0)
        } : s);
    }
    // forms 字段类型转换：3 个固定字段强制规范
    if (Array.isArray(out.forms)) {
        out.forms = out.forms.map(f => (f && typeof f === 'object') ? {
            name: String(f.name || ''),
            desc: String(f.desc || ''),
            bonuses: (f.bonuses && typeof f.bonuses === 'object') ? f.bonuses : {}
        } : f);
    }
    // source_basis 补默认值
    if (!out.source_basis || typeof out.source_basis !== 'string') {
        out.source_basis = `出自《${out.source || '未知典籍'}》`;
    }
    return out;
}

// 创建自定义角色接口
app.post('/api/characters/custom', authMiddleware, (req, res) => {
    // AI 角色卡字段兼容性预处理：容错 AI 返回的字符串数字、漏字段等小偏差
    const normalized = normalizeAiCharacterCard(req.body || {});
    const { name, grade, source, gradient, stats, skills, forms, source_basis } = normalized;

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

        // 保存到characters表（source 字段允许传入，便于 AI 提取角色卡标记为所属典籍）
        db.prepare(`
            INSERT INTO characters (id, name, grade, source, gradient, image, stats_json, skills_json, forms_json, source_basis)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            newId,
            name.trim(),
            grade,
            finalSource,
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

// ==================== 道具系统API ====================
// 获取所有道具
app.get('/api/items', (req, res) => {
    const { source, type, rarity } = req.query;
    let sql = 'SELECT * FROM items WHERE 1=1';
    const params = [];
    if (source) {
        sql += ' AND source = ?';
        params.push(source);
    }
    if (type) {
        sql += ' AND type = ?';
        params.push(type);
    }
    if (rarity) {
        sql += ' AND rarity = ?';
        params.push(rarity);
    }
    sql += ' ORDER BY id';
    const rows = db.prepare(sql).all(...params);
    const items = rows.map(r => ({
        id: r.id,
        name: r.name,
        source: r.source,
        rarity: r.rarity,
        type: r.type,
        image: r.image,
        description: r.description,
        stats_bonus: JSON.parse(r.stats_bonus_json || '{}'),
        skill_bonus: r.skill_bonus,
        source_basis: r.source_basis
    }));
    res.json({ items });
});

// 获取道具详情
app.get('/api/items/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: '道具不存在' });
    const item = {
        id: row.id,
        name: row.name,
        source: row.source,
        rarity: row.rarity,
        type: row.type,
        image: row.image,
        description: row.description,
        stats_bonus: JSON.parse(row.stats_bonus_json || '{}'),
        skill_bonus: row.skill_bonus,
        source_basis: row.source_basis
    };
    res.json({ item });
});

// 获取我的道具库
app.get('/api/me/items', authMiddleware, (req, res) => {
    const rows = db.prepare(`
        SELECT i.*, ui.quantity, ui.equipped, ui.slot
        FROM user_items ui
        JOIN items i ON ui.item_id = i.id
        WHERE ui.user_id = ?
        ORDER BY i.id
    `).all(req.user.id);
    const items = rows.map(r => ({
        id: r.id,
        name: r.name,
        source: r.source,
        rarity: r.rarity,
        type: r.type,
        image: r.image,
        description: r.description,
        stats_bonus: JSON.parse(r.stats_bonus_json || '{}'),
        skill_bonus: r.skill_bonus,
        source_basis: r.source_basis,
        quantity: r.quantity,
        equipped: r.equipped === 1,
        slot: r.slot
    }));
    res.json({ items });
});

// 添加道具到我的库
app.post('/api/me/items', authMiddleware, (req, res) => {
    const { item_id, quantity = 1 } = req.body;
    if (!item_id) return res.status(400).json({ error: '缺少item_id' });
    const item = db.prepare('SELECT id FROM items WHERE id = ?').get(item_id);
    if (!item) return res.status(404).json({ error: '道具不存在' });
    try {
        const existing = db.prepare('SELECT quantity FROM user_items WHERE user_id = ? AND item_id = ?').get(req.user.id, item_id);
        if (existing) {
            db.prepare('UPDATE user_items SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?').run(quantity, req.user.id, item_id);
        } else {
            db.prepare('INSERT INTO user_items (user_id, item_id, quantity) VALUES (?, ?, ?)').run(req.user.id, item_id, quantity);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: '添加道具失败: ' + err.message });
    }
});

// 装备/卸下道具
app.put('/api/me/items/:id/equip', authMiddleware, (req, res) => {
    const itemId = req.params.id;
    const { equipped, slot } = req.body;
    const ui = db.prepare('SELECT * FROM user_items WHERE user_id = ? AND item_id = ?').get(req.user.id, itemId);
    if (!ui) return res.status(404).json({ error: '您未拥有该道具' });
    try {
        db.prepare('UPDATE user_items SET equipped = ?, slot = ? WHERE user_id = ? AND item_id = ?').run(
            equipped ? 1 : 0, slot || null, req.user.id, itemId
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: '装备操作失败: ' + err.message });
    }
});

// 从我的库移除道具
app.delete('/api/me/items/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM user_items WHERE user_id = ? AND item_id = ?').run(req.user.id, req.params.id);
    res.json({ success: true });
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

// ==================== AI 服务 API ====================
// 获取所有支持的AI服务商
app.get('/api/ai/providers', (req, res) => {
    const providers = getAllProviders();
    res.json({ providers });
});

// 获取指定服务商的模型列表
app.get('/api/ai/providers/:providerId/models', (req, res) => {
    const provider = getProvider(req.params.providerId);
    if (!provider) {
        return res.status(404).json({ error: '服务商不存在' });
    }
    // 自定义供应商返回空列表（由用户手动输入模型名）
    res.json({ models: provider.models || [] });
});

// 从自定义接口地址自动获取模型列表（OpenAI 兼容 /models 端点）
app.post('/api/ai/custom/fetch-models', authMiddleware, async (req, res) => {
    const { base_url, api_key, protocol } = req.body;

    if (!base_url || !base_url.trim()) {
        return res.status(400).json({ error: '请填写接口地址' });
    }

    let usedApiKey = api_key;
    if (!usedApiKey) {
        const userConfig = db.prepare('SELECT * FROM user_ai_config WHERE user_id = ?').get(req.user.id);
        if (userConfig && userConfig.api_key_encrypted) {
            usedApiKey = Buffer.from(userConfig.api_key_encrypted, 'base64').toString();
        }
    }

    const usedProtocol = protocol === 'anthropic' ? 'anthropic' : 'openai';

    const url = `${base_url.replace(/\/+$/, '')}/models`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const headers = usedProtocol === 'anthropic'
            ? {
                'x-api-key': usedApiKey || '',
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            }
            : {
                'Authorization': `Bearer ${usedApiKey || ''}`,
                'Content-Type': 'application/json'
            };

        const response = await fetch(url, {
            method: 'GET',
            headers,
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const text = await response.text();

        if (!text || text.trim().startsWith('<')) {
            const hint = usedProtocol === 'anthropic'
                ? '请确认地址以 /anthropic 结尾且支持 Anthropic 兼容格式'
                : '请确认地址以 /v1 结尾且支持 OpenAI 兼容格式';
            return res.status(400).json({
                error: `接口地址不可用（HTTP ${response.status}），${hint}`
            });
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            return res.status(400).json({
                error: `接口返回非 JSON 响应（HTTP ${response.status}），可能地址或协议不正确`
            });
        }

        if (!response.ok) {
            const errMsg = data.error?.message || data.message || JSON.stringify(data);
            return res.status(400).json({ error: `获取模型列表失败: ${errMsg}` });
        }

        // 标准化模型列表格式（OpenAI: {data:[...]}; Anthropic: {data:[...]} 或 {models:[...]}）
        const rawModels = data.data || data.models || [];
        const models = rawModels
            .filter(m => m && (m.id || m.name))
            .map(m => ({
                id: m.id || m.name,
                name: m.id || m.name,
                type: 'chat',
                description: m.owned_by ? `所属: ${m.owned_by}` : (m.description || '自定义模型')
            }));

        res.json({ models, total: models.length, protocol: usedProtocol });
    } catch (err) {
        if (err.name === 'AbortError') {
            return res.status(400).json({ error: '请求超时，请检查接口地址和网络' });
        }
        res.status(400).json({ error: '获取模型列表失败: ' + err.message });
    }
});

// 获取当前AI配置
app.get('/api/ai/config', authMiddleware, (req, res) => {
    try {
        const config = aiService.getCurrentConfig();
        const userConfig = db.prepare('SELECT * FROM user_ai_config WHERE user_id = ?').get(req.user.id);
        res.json({
            ...config,
            user_config: userConfig ? {
                provider: userConfig.provider,
                model: userConfig.model,
                custom_base_url: userConfig.custom_base_url,
                protocol: userConfig.protocol || 'openai',
                has_api_key: !!userConfig.api_key_encrypted
            } : null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 保存用户AI配置
app.post('/api/ai/config', authMiddleware, (req, res) => {
    const { provider, model, custom_base_url, api_key, protocol } = req.body;

    if (!provider) {
        return res.status(400).json({ error: '请选择AI服务商' });
    }

    const providerInfo = getProvider(provider);
    if (!providerInfo) {
        return res.status(400).json({ error: '不支持的AI服务商' });
    }

    // 协议校验
    const usedProtocol = protocol === 'anthropic' ? 'anthropic' : 'openai';
    if (usedProtocol === 'anthropic' && !providerInfo.supports_anthropic) {
        return res.status(400).json({ error: `服务商 ${providerInfo.name} 不支持 Anthropic 协议` });
    }

    // 自定义供应商校验：必须填写模型名和接口地址
    if (providerInfo.is_custom) {
        if (!model || !model.trim()) {
            return res.status(400).json({ error: '自定义供应商必须填写模型名称' });
        }
        if (!custom_base_url || !custom_base_url.trim()) {
            return res.status(400).json({ error: '自定义供应商必须填写接口地址' });
        }
    }

    // 解析最终使用的模型与地址
    const finalModel = (model && model.trim()) ? model.trim() : (providerInfo.default_model || '');
    const finalBaseUrl = (custom_base_url && custom_base_url.trim()) ? custom_base_url.trim() : null;

    try {
        const existing = db.prepare('SELECT id FROM user_ai_config WHERE user_id = ?').get(req.user.id);

        if (existing) {
            const updateFields = ['provider = ?', 'model = ?', 'custom_base_url = ?', 'protocol = ?'];
            const params = [provider, finalModel, finalBaseUrl, usedProtocol];

            if (api_key !== undefined && api_key !== '') {
                updateFields.push('api_key_encrypted = ?');
                params.push(Buffer.from(api_key).toString('base64'));
            }

            params.push(req.user.id);
            db.prepare(`UPDATE user_ai_config SET ${updateFields.join(', ')} WHERE user_id = ?`).run(...params);
        } else {
            db.prepare(`
                INSERT INTO user_ai_config (user_id, provider, model, custom_base_url, api_key_encrypted, protocol)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                req.user.id,
                provider,
                finalModel,
                finalBaseUrl,
                api_key ? Buffer.from(api_key).toString('base64') : null,
                usedProtocol
            );
        }

        // 同步更新运行时 service 的协议
        aiService.setProvider(provider, finalModel, usedProtocol);

        res.json({ success: true, message: '配置已保存', protocol: usedProtocol });
    } catch (err) {
        console.error('保存AI配置失败:', err);
        res.status(500).json({ error: '保存配置失败: ' + err.message });
    }
});

// 测试AI连接
app.post('/api/ai/test', authMiddleware, async (req, res) => {
    const { provider, model, api_key, custom_base_url, protocol } = req.body;

    if (!provider) {
        return res.status(400).json({ error: '请选择AI服务商' });
    }

    const providerInfo = getProvider(provider);
    if (!providerInfo) {
        return res.status(400).json({ error: '不支持的AI服务商' });
    }

    const usedProtocol = protocol === 'anthropic' ? 'anthropic' : 'openai';
    if (usedProtocol === 'anthropic' && !providerInfo.supports_anthropic) {
        return res.status(400).json({ error: `服务商 ${providerInfo.name} 不支持 Anthropic 协议` });
    }

    // 自定义供应商校验
    if (providerInfo.is_custom) {
        if (!model || !model.trim()) {
            return res.status(400).json({ error: '自定义供应商必须填写模型名称' });
        }
        if (!custom_base_url || !custom_base_url.trim()) {
            return res.status(400).json({ error: '自定义供应商必须填写接口地址' });
        }
    }

    let usedApiKey = api_key;
    let usedBaseUrl = (custom_base_url && custom_base_url.trim()) ? custom_base_url.trim() : null;

    if (!usedApiKey) {
        const userConfig = db.prepare('SELECT * FROM user_ai_config WHERE user_id = ?').get(req.user.id);
        if (userConfig && userConfig.api_key_encrypted) {
            usedApiKey = Buffer.from(userConfig.api_key_encrypted, 'base64').toString();
        }
    }

    if (!usedApiKey) {
        return res.status(400).json({ error: '请提供API Key' });
    }

    try {
        const result = await aiService.testConnection(provider, usedApiKey, model, usedBaseUrl, usedProtocol);
        res.json(result);
    } catch (err) {
        res.json({
            success: false,
            error: err.message,
            status: err.status,
            errorType: err.errorType
        });
    }
});

// AI提取角色（从小说文本）
app.post('/api/ai/extract-character', authMiddleware, async (req, res) => {
    const { text, character_name } = req.body;

    if (!text || !character_name) {
        return res.status(400).json({ error: '缺少文本或角色名' });
    }

    if (text.length < 100) {
        return res.status(400).json({ error: '文本内容太短，至少需要100字' });
    }

    try {
        const opts = getUserAiOptions(req.user.id);

        if (!opts.apiKey) {
            return res.status(400).json({ error: '请先在AI设置中配置API Key' });
        }

        const result = await aiService.extractCharacterFromNovel(text, character_name, {
            customProvider: opts.provider,
            customModel: opts.model,
            customApiKey: opts.apiKey,
            customBaseUrl: opts.customBaseUrl,
            protocol: opts.protocol
        });

        res.json({
            success: true,
            character: result.character,
            provider: opts.provider
        });
    } catch (err) {
        console.error('AI角色提取失败:', err);
        res.status(500).json({
            error: err.message,
            errorType: err.errorType,
            status: err.status
        });
    }
});

// AI生成战斗解说
app.post('/api/ai/battle-narration', authMiddleware, async (req, res) => {
    const { battle_data } = req.body;

    if (!battle_data) {
        return res.status(400).json({ error: '缺少战斗数据' });
    }

    try {
        const opts = getUserAiOptions(req.user.id);

        if (!opts.apiKey) {
            return res.json({ success: false, narration: '' });
        }

        const narration = await aiService.generateBattleNarration(battle_data, {
            customProvider: opts.provider,
            customModel: opts.model,
            customApiKey: opts.apiKey,
            customBaseUrl: opts.customBaseUrl,
            protocol: opts.protocol
        });

        res.json({ success: true, narration });
    } catch (err) {
        res.json({ success: false, narration: '', error: err.message });
    }
});

// AI生成角色对话
app.post('/api/ai/character-dialogue', authMiddleware, async (req, res) => {
    const { character, situation } = req.body;

    if (!character || !situation) {
        return res.status(400).json({ error: '缺少角色或情境信息' });
    }

    try {
        const opts = getUserAiOptions(req.user.id);

        if (!opts.apiKey) {
            return res.json({ success: false, dialogue: '' });
        }

        const dialogue = await aiService.generateCharacterDialogue(character, situation, {
            customProvider: opts.provider,
            customModel: opts.model,
            customApiKey: opts.apiKey,
            customBaseUrl: opts.customBaseUrl,
            protocol: opts.protocol
        });

        res.json({ success: true, dialogue });
    } catch (err) {
        res.json({ success: false, dialogue: '', error: err.message });
    }
});

// ====== 获取用户AI配置的辅助函数 ======
function getUserAiOptions(userId) {
    const userConfig = db.prepare('SELECT * FROM user_ai_config WHERE user_id = ?').get(userId);
    let provider = process.env.AI_PROVIDER || 'deepseek';
    let model = null;
    let apiKey = null;
    let customBaseUrl = null;
    let protocol = 'openai';

    if (userConfig) {
        provider = userConfig.provider || provider;
        model = userConfig.model;
        customBaseUrl = userConfig.custom_base_url;
        protocol = userConfig.protocol || 'openai';
        if (userConfig.api_key_encrypted) {
            apiKey = Buffer.from(userConfig.api_key_encrypted, 'base64').toString();
        }
    }

    // 模型名纠错：若用户保存的模型名在当前 provider 的预设模型列表中不存在，回退到 provider 默认模型
    // 避免 'deepseek-v4-pro' 这类早期误填导致所有 AI 调用 400 失败
    const providerInfo = getProvider(provider);
    if (providerInfo && providerInfo.models && providerInfo.models.length > 0) {
        const knownIds = new Set(providerInfo.models.map(m => m.id));
        if (model && !knownIds.has(model)) {
            console.warn(`[AI] 用户配置模型纠错：${provider} 不识别 "${model}"，回退到 "${providerInfo.default_model}"`);
            model = providerInfo.default_model;
        }
    }

    if (!apiKey) {
        const envKey = providerInfo ? process.env[providerInfo.api_key_env] : null;
        apiKey = envKey || process.env.OPENAI_API_KEY;
    }

    return { 
        provider, model, apiKey, 
        customProvider: provider, 
        customModel: model, 
        customApiKey: apiKey, 
        customBaseUrl, 
        protocol, 
        hasApiKey: !!apiKey 
    };
}

// ====== 书籍API ======

// 获取书籍列表
app.get('/api/books', authMiddleware, (req, res) => {
    try {
        const classics = db.prepare('SELECT id, title, author, description, source_type, cover_gradient, created_at FROM books WHERE source_type = ? ORDER BY id').all('classic');
        const uploads = db.prepare('SELECT id, title, author, description, source_type, cover_gradient, created_at FROM books WHERE user_id = ? AND source_type = ? ORDER BY created_at DESC').all(req.user.id, 'upload');

        // 查询用户对每本书的进度
        const allBooks = [...classics, ...uploads];
        const booksWithProgress = allBooks.map(book => {
            const session = db.prepare('SELECT chapter_index, total_chapters, status FROM story_sessions WHERE user_id = ? AND book_id = ? ORDER BY updated_at DESC LIMIT 1').get(req.user.id, book.id);
            return {
                ...book,
                progress: session ? {
                    chapter: session.chapter_index,
                    total: session.total_chapters,
                    status: session.status
                } : null
            };
        });

        res.json({ books: booksWithProgress });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 获取书籍详情
app.get('/api/books/:id', authMiddleware, (req, res) => {
    try {
        const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
        if (!book) {
            return res.status(404).json({ error: '书籍不存在' });
        }
        res.json({ book });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 上传自定义书籍
app.post('/api/books/upload', authMiddleware, (req, res) => {
    const { title, content, description, author } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: '请填写书名和内容' });
    }
    if (content.length < 100) {
        return res.status(400).json({ error: '书籍内容太短，至少需要100字' });
    }

    try {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
        ];
        const cover_gradient = gradients[Math.floor(Math.random() * gradients.length)];

        const result = db.prepare(`
            INSERT INTO books (user_id, title, author, description, content, source_type, cover_gradient)
            VALUES (?, ?, ?, ?, ?, 'upload', ?)
        `).run(req.user.id, title, author || null, description || null, content, cover_gradient);

        res.json({ success: true, book_id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 删除用户上传的书籍
app.delete('/api/books/:id', authMiddleware, (req, res) => {
    try {
        const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
        if (!book) {
            return res.status(404).json({ error: '书籍不存在' });
        }
        if (book.source_type === 'classic') {
            return res.status(400).json({ error: '系统名著不可删除' });
        }
        if (book.user_id !== req.user.id) {
            return res.status(403).json({ error: '无权删除他人的书籍' });
        }

        db.prepare('DELETE FROM chapter_rewards WHERE session_id IN (SELECT id FROM story_sessions WHERE book_id = ?)').all(req.params.id);
        db.prepare('DELETE FROM story_sessions WHERE book_id = ?').run(req.params.id);
        // 清理该书的 AI 缓存（角色卡 + 摘要）
        db.prepare('DELETE FROM ai_character_cache WHERE book_id = ?').run(req.params.id);
        db.prepare('DELETE FROM book_summary_cache WHERE book_id = ?').run(req.params.id);
        db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ====== 剧情API ======

// ====== DAG 剧情养成系统 API（按策划案 v3 8.2节设计）======

// 获取所有可用 DAG（列表）
app.get('/api/story/dags', authMiddleware, (req, res) => {
    try {
        const dags = storyDag.listAvailableDags();
        res.json({ dags });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 开始 DAG 剧情养成（替代旧 /api/story/start 的新模式）
// 入参：{ book_id, character_id }
// 出参：{ session_id, dag_progress_id, novel_id, current_node, character, stat_growth, unlocked_skills, unlocked_forms }
app.post('/api/story/dag/start', authMiddleware, async (req, res) => {
    try {
        const { book_id, character_id } = req.body;
        if (!book_id) return res.status(400).json({ error: '缺少 book_id' });

        // DAG 节点为预置静态结构，无需强制 AI Key；AI 仅用于可选叙事增强
        // 查询书籍
        const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
        if (!book) return res.status(404).json({ error: '典籍不存在' });

        // 查询 DAG
        const dag = storyDag.getDagByBookTitle(book.title);
        if (!dag) {
            return res.status(404).json({
                error: `暂未为《${book.title}》预置剧情节点图，请选择支持的典籍`,
                supported_dags: storyDag.listAvailableDags().map(d => d.title)
            });
        }

        // 查询角色
        let character = null;
        if (character_id) {
            const charRow = db.prepare('SELECT * FROM characters WHERE id = ?').get(character_id);
            if (charRow) {
                character = {
                    id: charRow.id, name: charRow.name, grade: charRow.grade, source: charRow.source,
                    gradient: charRow.gradient, image: charRow.image,
                    skills: JSON.parse(charRow.skills_json || '[]'),
                    stats: JSON.parse(charRow.stats_json || '{}'),
                    forms: JSON.parse(charRow.forms_json || '[]'),
                    source_basis: charRow.source_basis
                };
            }
        }

        // 清理同书同角色的旧 active 会话（避免重复会话堆积）
        db.prepare(`DELETE FROM story_dag_progress
                    WHERE user_id = ? AND book_id = ? AND character_id IS ? AND status = 'active'`)
          .run(req.user.id, book_id, character_id || null);

        // 创建 story_sessions 主记录（兼容旧前端读取）
        const sessionResult = db.prepare(`
            INSERT INTO story_sessions (user_id, book_id, character_id, chapter_index, total_chapters, status, messages_json)
            VALUES (?, ?, ?, 1, 1, 'active', '[]')
        `).run(req.user.id, book_id, character_id || null);
        const sessionId = sessionResult.lastInsertRowid;

        // 创建 DAG 进度记录
        const startNode = storyDag.getStartNode(dag);
        const dagResult = db.prepare(`
            INSERT INTO story_dag_progress
                (session_id, user_id, book_id, character_id, novel_id, current_node,
                 visited_nodes_json, stat_growth_json, unlocked_skills_json, unlocked_forms_json,
                 battle_results_json, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
        `).run(
            sessionId, req.user.id, book_id, character_id || null,
            dag.novel_id, dag.start_node,
            JSON.stringify([dag.start_node]),
            JSON.stringify({}),
            JSON.stringify([]),
            JSON.stringify([]),
            JSON.stringify([])
        );
        const dagProgressId = dagResult.lastInsertRowid;

        // 返回起点节点信息
        res.json({
            session_id: sessionId,
            dag_progress_id: dagProgressId,
            novel_id: dag.novel_id,
            novel_title: dag.title,
            current_node: startNode,
            character,
            stat_growth: {},
            unlocked_skills: [],
            unlocked_forms: [],
            visited_nodes: [dag.start_node],
            mode: 'dag'
        });
    } catch (err) {
        console.error('DAG剧情启动失败:', err);
        res.status(500).json({ error: err.message });
    }
});

// 获取 DAG 会话当前状态（同时支持 dag 预置模式和 ai 动态模式）
app.get('/api/story/dag/session/:id', authMiddleware, (req, res) => {
    try {
        const dagProgressId = parseInt(req.params.id);
        const progress = db.prepare('SELECT * FROM story_dag_progress WHERE id = ? AND user_id = ?')
                          .get(dagProgressId, req.user.id);
        if (!progress) return res.status(404).json({ error: 'DAG 会话不存在' });

        const mode = progress.mode || 'dag';
        let currentNode = null;
        let novelTitle = progress.novel_id;

        if (mode === 'ai') {
            // AI 模式：current_node 存完整 JSON
            try {
                currentNode = JSON.parse(progress.current_node);
            } catch (e) {
                return res.status(500).json({ error: 'AI 节点 JSON 解析失败' });
            }
        } else {
            // dag 模式：current_node 存节点 ID
            const dag = storyDag.getDagByNovelId(progress.novel_id);
            if (!dag) return res.status(404).json({ error: 'DAG 不存在' });
            currentNode = storyDag.getNode(dag, progress.current_node);
            novelTitle = dag.title;
        }

        // 查角色
        let character = null;
        if (progress.character_id) {
            const charRow = db.prepare('SELECT * FROM characters WHERE id = ?').get(progress.character_id);
            if (charRow) {
                character = {
                    id: charRow.id, name: charRow.name, grade: charRow.grade, source: charRow.source,
                    gradient: charRow.gradient, image: charRow.image,
                    skills: JSON.parse(charRow.skills_json || '[]'),
                    stats: JSON.parse(charRow.stats_json || '{}'),
                    forms: JSON.parse(charRow.forms_json || '[]'),
                    source_basis: charRow.source_basis
                };
            }
        }

        res.json({
            session_id: progress.session_id,
            dag_progress_id: progress.id,
            novel_id: progress.novel_id,
            novel_title: novelTitle,
            current_node: currentNode,
            character,
            stat_growth: JSON.parse(progress.stat_growth_json || '{}'),
            unlocked_skills: JSON.parse(progress.unlocked_skills_json || '[]'),
            unlocked_forms: JSON.parse(progress.unlocked_forms_json || '[]'),
            battle_results: JSON.parse(progress.battle_results_json || '[]'),
            visited_nodes: JSON.parse(progress.visited_nodes_json || '[]'),
            status: progress.status,
            ending_node: progress.ending_node,
            mode
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 处理节点选择：应用 effects，前进到 next_node，处理解锁
// 入参：{ dag_progress_id, choice_id }
app.post('/api/story/dag/choose', authMiddleware, (req, res) => {
    try {
        const { dag_progress_id, choice_id } = req.body;
        if (!dag_progress_id || !choice_id) {
            return res.status(400).json({ error: '缺少 dag_progress_id 或 choice_id' });
        }

        const progress = db.prepare('SELECT * FROM story_dag_progress WHERE id = ? AND user_id = ?')
                          .get(dag_progress_id, req.user.id);
        if (!progress) return res.status(404).json({ error: 'DAG 会话不存在' });
        if (progress.status !== 'active') {
            return res.status(400).json({ error: '会话已结束，无法继续选择' });
        }

        const dag = storyDag.getDagByNovelId(progress.novel_id);
        if (!dag) return res.status(404).json({ error: 'DAG 不存在' });

        const currentNode = storyDag.getNode(dag, progress.current_node);
        if (!currentNode || !currentNode.choices) {
            return res.status(400).json({ error: '当前节点无选择分支' });
        }

        const choice = storyDag.getChoice(currentNode, choice_id);
        if (!choice) {
            return res.status(400).json({ error: `选择 ${choice_id} 不存在` });
        }

        // 应用 effects：累计属性成长
        const statGrowth = JSON.parse(progress.stat_growth_json || '{}');
        if (choice.effects) {
            for (const [key, value] of Object.entries(choice.effects)) {
                statGrowth[key] = (statGrowth[key] || 0) + value;
            }
        }

        // 处理 unlocks：技能或形态
        const unlockedSkills = JSON.parse(progress.unlocked_skills_json || '[]');
        const unlockedForms = JSON.parse(progress.unlocked_forms_json || '[]');
        let unlockEvent = null;

        if (choice.unlocks) {
            const [type, id] = choice.unlocks.split(':');
            if (type === 'skill' && !unlockedSkills.find(s => s.id === id)) {
                // 优先用节点上声明的 skill_unlocked 对象
                const skillObj = currentNode.skill_unlocked || { name: id, type: 'passive', multiplier: 0, mp_cost: 0, desc: '剧情解锁技能' };
                unlockedSkills.push({ id, ...skillObj });
                unlockEvent = { type: 'skill', name: skillObj.name, id };
            } else if (type === 'form' && !unlockedForms.find(f => f.id === id)) {
                const formObj = currentNode.form_unlocked || { name: id, bonuses: {}, desc: '剧情解锁形态' };
                unlockedForms.push({ id, ...formObj });
                unlockEvent = { type: 'form', name: formObj.name, id };
            }
        }

        // 前进到下一节点
        const nextNodeId = choice.next_node;
        const nextNode = storyDag.getNode(dag, nextNodeId);
        if (!nextNode) {
            return res.status(500).json({ error: `下一节点 ${nextNodeId} 不存在` });
        }

        // 更新已访问节点列表
        const visitedNodes = JSON.parse(progress.visited_nodes_json || '[]');
        if (!visitedNodes.includes(nextNodeId)) {
            visitedNodes.push(nextNodeId);
        }

        // 如果下一节点是 ending，标记会话完成
        let newStatus = 'active';
        let endingNode = null;
        if (nextNode.type === 'ending') {
            newStatus = 'completed';
            endingNode = nextNodeId;
        }

        // 持久化
        db.prepare(`
            UPDATE story_dag_progress
            SET current_node = ?, visited_nodes_json = ?, stat_growth_json = ?,
                unlocked_skills_json = ?, unlocked_forms_json = ?,
                status = ?, ending_node = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            nextNodeId,
            JSON.stringify(visitedNodes),
            JSON.stringify(statGrowth),
            JSON.stringify(unlockedSkills),
            JSON.stringify(unlockedForms),
            newStatus,
            endingNode,
            dag_progress_id
        );

        res.json({
            current_node: nextNode,
            stat_growth: statGrowth,
            unlocked_skills: unlockedSkills,
            unlocked_forms: unlockedForms,
            visited_nodes: visitedNodes,
            unlock_event: unlockEvent,
            status: newStatus,
            ending_node: endingNode,
            mode: 'dag'
        });
    } catch (err) {
        console.error('DAG节点选择失败:', err);
        res.status(500).json({ error: err.message });
    }
});

// battle 节点请求战斗
// 入参：{ dag_progress_id }
// 出参：{ battle, victory, next_node, ... }
app.post('/api/story/dag/battle', authMiddleware, (req, res) => {
    try {
        const { dag_progress_id } = req.body;
        const progress = db.prepare('SELECT * FROM story_dag_progress WHERE id = ? AND user_id = ?')
                          .get(dag_progress_id, req.user.id);
        if (!progress) return res.status(404).json({ error: 'DAG 会话不存在' });

        const dag = storyDag.getDagByNovelId(progress.novel_id);
        const currentNode = storyDag.getNode(dag, progress.current_node);
        if (!currentNode || currentNode.type !== 'battle') {
            return res.status(400).json({ error: '当前节点不是战斗节点' });
        }
        if (!progress.character_id) {
            return res.status(400).json({ error: '未选择角色，无法战斗' });
        }

        // 加载玩家角色（应用 stat_growth 和已解锁形态加成）
        const charRow = db.prepare('SELECT * FROM characters WHERE id = ?').get(progress.character_id);
        if (!charRow) return res.status(404).json({ error: '角色不存在' });

        const statGrowth = JSON.parse(progress.stat_growth_json || '{}');
        const unlockedForms = JSON.parse(progress.unlocked_forms_json || '[]');
        const baseStats = JSON.parse(charRow.stats_json || '{}');
        const playerStats = { ...baseStats };
        for (const [k, v] of Object.entries(statGrowth)) {
            playerStats[k] = (playerStats[k] || 0) + v;
        }
        // 应用最强形态加成
        if (unlockedForms.length > 0) {
            const lastForm = unlockedForms[unlockedForms.length - 1];
            if (lastForm.bonuses) {
                for (const [k, v] of Object.entries(lastForm.bonuses)) {
                    playerStats[k] = (playerStats[k] || 0) + v;
                }
            }
        }

        const playerChar = {
            id: charRow.id, name: charRow.name, grade: charRow.grade, source: charRow.source,
            stats: playerStats,
            skills: JSON.parse(charRow.skills_json || '[]'),
            forms: JSON.parse(charRow.forms_json || '[]')
        };

        // 敌人（补默认 forms/skills 以兼容 battle-engine）
        const enemy = currentNode.enemy;
        if (!enemy.forms || enemy.forms.length === 0) {
            enemy.forms = [{ name: '基础', bonuses: {} }];
        }
        if (!Array.isArray(enemy.skills) || enemy.skills.length === 0) {
            enemy.skills = [{ name: '普通攻击', type: 'physical_attack', multiplier: 1.0, mp_cost: 0, desc: '普通一击' }];
        }

        // 执行战斗
        const battle = battleEngine.executeBattle(playerChar, enemy, 0, 0);
        const victory = battle.winner === 1;
        const nextNodeId = victory ? currentNode.victory_next : currentNode.defeat_next;
        const nextNode = storyDag.getNode(dag, nextNodeId);

        // 记录战斗结果
        const battleResults = JSON.parse(progress.battle_results_json || '[]');
        battleResults.push({
            node: currentNode.id,
            enemy: enemy.name,
            winner: battle.winner,
            total_rounds: battle.total_rounds,
            timestamp: new Date().toISOString()
        });

        // 更新已访问节点
        const visitedNodes = JSON.parse(progress.visited_nodes_json || '[]');
        if (!visitedNodes.includes(nextNodeId)) visitedNodes.push(nextNodeId);

        // 是否到达 ending
        let newStatus = 'active';
        let endingNode = null;
        if (nextNode && nextNode.type === 'ending') {
            newStatus = 'completed';
            endingNode = nextNodeId;
        }

        db.prepare(`
            UPDATE story_dag_progress
            SET current_node = ?, visited_nodes_json = ?, battle_results_json = ?,
                status = ?, ending_node = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(nextNodeId, JSON.stringify(visitedNodes), JSON.stringify(battleResults),
              newStatus, endingNode, dag_progress_id);

        res.json({
            battle,
            victory,
            enemy,
            next_node: nextNode,
            battle_results: battleResults,
            visited_nodes: visitedNodes,
            status: newStatus,
            ending_node: endingNode,
            mode: 'dag'
        });
    } catch (err) {
        console.error('DAG战斗失败:', err);
        res.status(500).json({ error: err.message });
    }
});

// ====== AI 动态剧情生成系统端点（AI 模式 + 预置 DAG 兜底）======

// 辅助：获取或生成书籍摘要（按 book_id 全局共享，DB 持久化，永久缓存）
// 失败时返回空字符串（generateStoryNode 会回退到原文节选）
async function getOrGenerateBookSummary(book, aiOptions) {
    if (!book || !book.id) return '';
    // 先查缓存
    const cached = db.prepare('SELECT * FROM book_summary_cache WHERE book_id = ?').get(book.id);
    if (cached && cached.summary) {
        return cached.summary;
    }
    // 未命中 → 调 AI 生成
    try {
        const result = await aiService.generateBookSummary(book.title, book.content, aiOptions);
        const summary = result.summary || '';
        if (summary) {
            try {
                db.prepare(`
                    INSERT OR REPLACE INTO book_summary_cache (book_id, book_title, summary, created_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                `).run(book.id, book.title, summary);
            } catch (cacheErr) {
                console.error('[AI] 书籍摘要缓存写入失败:', cacheErr.message);
            }
        }
        return summary;
    } catch (e) {
        console.error('[AI] 书籍摘要获取失败:', e.message);
        return '';
    }
}

// ====== 服务端滚动预取缓存（深度=1，内存 Map，TTL 30 分钟）======
// key = `${sessionId}:${choiceId}:${userTurningHash||'none'}`
// value = { node, createdAt }
const preloadCache = new Map();
const PRELOAD_TTL_MS = 30 * 60 * 1000; // 30 分钟
const PRELOAD_MAX_NODES = 10;

// 定期清理过期项（每 5 分钟扫一次）
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [k, v] of preloadCache) {
        if (now - v.createdAt > PRELOAD_TTL_MS) {
            preloadCache.delete(k);
            cleaned++;
        }
    }
    if (cleaned > 0) console.log(`[Preload] 清理 ${cleaned} 个过期预取项`);
}, 5 * 60 * 1000).unref();

// 简单 hash 函数：用于区分有无/不同转折输入
function hashUserTurning(s) {
    if (!s) return 'none';
    s = String(s);
    return `${s.length}:${s.substring(0, 20)}`;
}

// 判定关键转折节点：nodeIndex >= maxNodes-2（结局前）或 type === 'battle'（战斗前）
function isKeyTurningNode(node, nodeIndex, maxNodes) {
    if (!node) return false;
    if (nodeIndex >= maxNodes - 2) return true;
    if (node.type === 'battle') return true;
    return false;
}

// 触发下一层预取：为 currentNode 的每个 choice 并行预生成子节点存入 preloadCache
// 跳过 battle / ending / 关键转折节点（结果未定或等待用户输入）
// 异步执行，不阻塞响应；失败不影响主流程
function triggerPreload(sessionId, currentNode, baseContext) {
    if (!currentNode || !currentNode.choices || !Array.isArray(currentNode.choices)) return;
    if (currentNode.type === 'battle' || currentNode.type === 'ending') return;

    const { book, character, userDirection, aiOptions, bookSummary,
            statGrowth, unlockedSkills, unlockedForms, visitedNodes } = baseContext;

    const nextNodeIndex = (visitedNodes || []).length;
    // 即将结局的子节点层不预取（等待用户转折输入）
    if (nextNodeIndex >= PRELOAD_MAX_NODES - 2) return;

    // 为每个 choice 并行预生成
    const tasks = currentNode.choices.map(async (choice) => {
        try {
            // 投影该 choice 之后的 statGrowth
            const projectedStatGrowth = { ...(statGrowth || {}) };
            if (choice.effects) {
                for (const k of Object.keys(choice.effects)) {
                    projectedStatGrowth[k] = (projectedStatGrowth[k] || 0) + Number(choice.effects[k]);
                }
            }
            // 投影该节点 unlock（unlock 在 choice 前已生效，对所有 choice 相同）
            const projectedSkills = [...(unlockedSkills || [])];
            const projectedForms = [...(unlockedForms || [])];
            if (currentNode.unlock) {
                if (currentNode.unlock.type === 'skill' && currentNode.unlock.name) {
                    if (!projectedSkills.some(s => (s.name || s) === currentNode.unlock.name)) {
                        projectedSkills.push({ name: currentNode.unlock.name, ...currentNode.unlock.data });
                    }
                } else if (currentNode.unlock.type === 'form' && currentNode.unlock.name) {
                    if (!projectedForms.some(f => (f.name || f) === currentNode.unlock.name)) {
                        projectedForms.push({ name: currentNode.unlock.name, ...currentNode.unlock.data });
                    }
                }
            }

            const result = await aiService.generateStoryNode({
                bookTitle: book.title,
                bookContent: book.content,
                bookSummary,
                userDirection,
                character,
                nodeIndex: nextNodeIndex,
                maxNodes: PRELOAD_MAX_NODES,
                lastChoiceText: choice.text || '',
                visitedNodes: visitedNodes || [],
                statGrowth: projectedStatGrowth,
                unlockedSkills: projectedSkills,
                unlockedForms: projectedForms
            }, aiOptions);

            const cacheKey = `${sessionId}:${choice.id}:none`;
            preloadCache.set(cacheKey, { node: result.node, createdAt: Date.now() });
        } catch (e) {
            // 预取失败，用户点击该选项时走按需生成
            console.error(`[Preload] 预取子节点失败 (choice=${choice.id}):`, e.message);
        }
    });

    Promise.allSettled(tasks).then(results => {
        const fulfilled = results.filter(r => r.status === 'fulfilled').length;
        console.log(`[Preload] session=${sessionId} 预取完成 ${fulfilled}/${results.length}`);
    });
}

// AI 提取书籍角色卡（不入库，由前端选择时再入库）
app.post('/api/story/ai/extract-characters', authMiddleware, async (req, res) => {
    try {
        const { book_id } = req.body;
        if (!book_id) return res.status(400).json({ error: '缺少 book_id' });

        const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
        if (!book) return res.status(404).json({ error: '典籍不存在' });

        // 校验用户 AI 配置
        const aiOptions = getUserAiOptions(req.user.id);
        if (!aiOptions.hasApiKey) {
            return res.json({ characters: [], fallback: true, error: '未配置 AI API Key' });
        }

        // 查询角色卡缓存（按 book_id 全局共享，TTL 7 天）
        const CHAR_CACHE_TTL_DAYS = 7;
        const cached = db.prepare('SELECT * FROM ai_character_cache WHERE book_id = ?').get(book_id);
        if (cached) {
            const ageMs = Date.now() - new Date(cached.created_at + 'Z').getTime();
            if (ageMs < CHAR_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) {
                try {
                    const cards = JSON.parse(cached.cards_json);
                    return res.json({ characters: cards, cached: true });
                } catch (e) {
                    // 缓存 JSON 损坏，删除后重新生成
                    db.prepare('DELETE FROM ai_character_cache WHERE book_id = ?').run(book_id);
                }
            } else {
                // 过期，删除后重新生成
                db.prepare('DELETE FROM ai_character_cache WHERE book_id = ?').run(book_id);
            }
        }

        try {
            const result = await aiService.extractCharacterCardsFromBook(
                book.title, book.content, aiOptions
            );
            const cards = result.characters || [];
            // 写入缓存（REPLACE 处理并发同 book_id 重复）
            try {
                db.prepare(`
                    INSERT OR REPLACE INTO ai_character_cache (book_id, book_title, cards_json, created_at)
                    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                `).run(book_id, book.title, JSON.stringify(cards));
            } catch (cacheErr) {
                console.error('[AI] 角色卡缓存写入失败:', cacheErr.message);
            }
            res.json({ characters: cards, cached: false });
        } catch (aiErr) {
            console.error('[AI] 提取角色卡失败:', aiErr.message);
            res.json({ characters: [], fallback: true, error: aiErr.message });
        }
    } catch (err) {
        console.error('AI 提取角色卡端点失败:', err);
        res.status(500).json({ error: err.message });
    }
});

// AI 模式启动剧情
app.post('/api/story/ai/start', authMiddleware, async (req, res) => {
    try {
        const { book_id, character_id, user_direction } = req.body;
        if (!book_id) return res.status(400).json({ error: '缺少 book_id' });

        const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
        if (!book) return res.status(404).json({ error: '典籍不存在' });

        // 校验用户 AI 配置
        const aiOptions = getUserAiOptions(req.user.id);
        if (!aiOptions.hasApiKey) {
            return res.json({ fallback_dag: true, reason: '未配置 AI API Key' });
        }

        // 获取或生成书籍摘要（按 book_id 全局共享缓存）
        const bookSummary = await getOrGenerateBookSummary(book, aiOptions);

        // 查询角色
        let character = null;
        if (character_id) {
            const charRow = db.prepare('SELECT * FROM characters WHERE id = ?').get(character_id);
            if (charRow) {
                character = {
                    id: charRow.id, name: charRow.name, grade: charRow.grade, source: charRow.source,
                    gradient: charRow.gradient, image: charRow.image,
                    skills: JSON.parse(charRow.skills_json || '[]'),
                    stats: JSON.parse(charRow.stats_json || '{}'),
                    forms: JSON.parse(charRow.forms_json || '[]'),
                    source_basis: charRow.source_basis
                };
            }
        }

        // 清理同书同角色的旧 active 会话
        db.prepare(`DELETE FROM story_dag_progress
                    WHERE user_id = ? AND book_id = ? AND character_id IS ? AND status = 'active'`)
          .run(req.user.id, book_id, character_id || null);

        // 创建 story_sessions 主记录
        const sessionResult = db.prepare(`
            INSERT INTO story_sessions (user_id, book_id, character_id, chapter_index, total_chapters, status, messages_json)
            VALUES (?, ?, ?, 1, 1, 'active', '[]')
        `).run(req.user.id, book_id, character_id || null);
        const sessionId = sessionResult.lastInsertRowid;

        // 创建 DAG 进度记录（mode='ai'，current_node 暂存空 JSON，user_direction 记录开局方向）
        const userDirectionText = (user_direction || '').toString().trim().substring(0, 200);
        const dagResult = db.prepare(`
            INSERT INTO story_dag_progress
                (session_id, user_id, book_id, character_id, novel_id, current_node,
                 visited_nodes_json, stat_growth_json, unlocked_skills_json, unlocked_forms_json,
                 battle_results_json, status, mode, user_direction, turning_inputs_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'ai', ?, '[]')
        `).run(
            sessionId, req.user.id, book_id, character_id || null,
            book.title, '{}', '[]', '{}', '[]', '[]', '[]',
            userDirectionText || null
        );
        const dagProgressId = dagResult.lastInsertRowid;

        // 调 AI 生成起点节点（nodeIndex=0，forceType='story' 保证开局非 ending）
        const MAX_NODES = 10;
        let node = null;
        let lastError = null;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const result = await aiService.generateStoryNode({
                    bookTitle: book.title,
                    bookContent: book.content,
                    bookSummary,
                    userDirection: userDirectionText,
                    character,
                    nodeIndex: 0,
                    maxNodes: MAX_NODES,
                    forceType: 'story',
                    visitedNodes: [],
                    statGrowth: {},
                    unlockedSkills: [],
                    unlockedForms: []
                }, aiOptions);
                node = result.node;
                break;
            } catch (e) {
                lastError = e;
                if (attempt === 0) {
                    await new Promise(r => setTimeout(r, 1000)); // 重试间隔 1 秒
                }
            }
        }

        if (!node) {
            // AI 失败 → 返回 fallback_dag，前端切回预置 DAG
            const errDetail = lastError
                ? `${lastError.message}${lastError.errorType ? `（${lastError.errorType}）` : ''}`
                : '未知错误';
            console.error('[AI] 启动节点生成失败:', errDetail,
                lastError && lastError.rawContent ? '\n[AI 原始返回]\n' + String(lastError.rawContent).substring(0, 500) : '');
            // 清理刚创建的空 AI 会话
            db.prepare('DELETE FROM story_dag_progress WHERE id = ?').run(dagProgressId);
            db.prepare('DELETE FROM story_sessions WHERE id = ?').run(sessionId);
            return res.json({ fallback_dag: true, reason: `AI 节点生成失败：${errDetail}` });
        }

        // 应用 node.effects 到 stat_growth（节点进入时生效）
        const statGrowth = {};
        if (node.effects) {
            for (const k of Object.keys(node.effects)) {
                statGrowth[k] = (statGrowth[k] || 0) + Number(node.effects[k]);
            }
        }

        // 更新 progress：current_node 存完整 JSON
        db.prepare(`
            UPDATE story_dag_progress
            SET current_node = ?, stat_growth_json = ?, visited_nodes_json = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            JSON.stringify(node),
            JSON.stringify(statGrowth),
            JSON.stringify([node.id]),
            dagProgressId
        );

        // 起点节点生成后，异步预取下一层子节点（不阻塞响应）
        triggerPreload(sessionId, node, {
            book, character, userDirection: userDirectionText, aiOptions, bookSummary,
            statGrowth, unlockedSkills: [], unlockedForms: [], visitedNodes: [node.id]
        });

        // 附加 nodeIndex/maxNodes 字段，供前端判定关键转折节点
        if (node && typeof node === 'object') {
            node.nodeIndex = 0;
            node.maxNodes = MAX_NODES;
        }

        res.json({
            mode: 'ai',
            session_id: sessionId,
            dag_progress_id: dagProgressId,
            novel_id: book.title,
            novel_title: book.title,
            current_node: node,
            character,
            stat_growth: statGrowth,
            unlocked_skills: [],
            unlocked_forms: [],
            visited_nodes: [node.id],
            status: 'active',
            preloaded: false
        });
    } catch (err) {
        console.error('AI 启动剧情失败:', err);
        res.status(500).json({ error: err.message });
    }
});

// AI 模式处理选择
app.post('/api/story/ai/choose', authMiddleware, async (req, res) => {
    try {
        const { dag_progress_id, choice_id, choice_text, user_turning } = req.body;
        if (!dag_progress_id) return res.status(400).json({ error: '缺少 dag_progress_id' });

        const progress = db.prepare('SELECT * FROM story_dag_progress WHERE id = ? AND user_id = ?').get(dag_progress_id, req.user.id);
        if (!progress) return res.status(404).json({ error: 'DAG 进度不存在' });
        if (progress.mode !== 'ai') return res.status(400).json({ error: '该端点仅支持 AI 模式' });

        const aiOptions = getUserAiOptions(req.user.id);
        if (!aiOptions.hasApiKey) {
            return res.json({ fallback_dag: true, reason: '未配置 AI API Key' });
        }

        // 解析当前节点
        let currentNode = null;
        try { currentNode = JSON.parse(progress.current_node); } catch (e) {
            return res.status(500).json({ error: '当前节点 JSON 解析失败' });
        }
        if (!currentNode || !currentNode.choices) {
            return res.status(400).json({ error: '当前节点无可选选项' });
        }

        // 找到对应 choice
        const choice = currentNode.choices.find(c => c.id === choice_id);
        if (!choice) return res.status(400).json({ error: '选项不存在: ' + choice_id });

        // 应用 choice.effects 到 stat_growth
        const statGrowth = JSON.parse(progress.stat_growth_json || '{}');
        if (choice.effects) {
            for (const k of Object.keys(choice.effects)) {
                statGrowth[k] = (statGrowth[k] || 0) + Number(choice.effects[k]);
            }
        }

        // 应用 node.unlock（如果是 skill_unlock/form_unlock 节点）
        const unlockedSkills = JSON.parse(progress.unlocked_skills_json || '[]');
        const unlockedForms = JSON.parse(progress.unlocked_forms_json || '[]');
        if (currentNode.unlock) {
            if (currentNode.unlock.type === 'skill' && currentNode.unlock.name) {
                if (!unlockedSkills.some(s => (s.name || s) === currentNode.unlock.name)) {
                    unlockedSkills.push({
                        name: currentNode.unlock.name,
                        ...currentNode.unlock.data
                    });
                }
            } else if (currentNode.unlock.type === 'form' && currentNode.unlock.name) {
                if (!unlockedForms.some(f => (f.name || f) === currentNode.unlock.name)) {
                    unlockedForms.push({
                        name: currentNode.unlock.name,
                        ...currentNode.unlock.data
                    });
                }
            }
        }

        // 调 AI 生成下个节点
        const visitedNodes = JSON.parse(progress.visited_nodes_json || '[]');
        const nextNodeIndex = visitedNodes.length; // 当前 visited 数量即为下个节点的 index
        const MAX_NODES = 10;

        // 查询角色 + book
        const book = db.prepare('SELECT * FROM books WHERE id = ?').get(progress.book_id);
        let character = null;
        if (progress.character_id) {
            const charRow = db.prepare('SELECT * FROM characters WHERE id = ?').get(progress.character_id);
            if (charRow) {
                character = {
                    id: charRow.id, name: charRow.name, grade: charRow.grade, source: charRow.source,
                    source_basis: charRow.source_basis,
                    skills: JSON.parse(charRow.skills_json || '[]'),
                    stats: JSON.parse(charRow.stats_json || '{}'),
                    forms: JSON.parse(charRow.forms_json || '[]')
                };
            }
        }

        // 用户转折输入（仅 ai 模式生效，空值表示无转折）
        const userTurningText = (user_turning || '').toString().trim().substring(0, 200);
        const turningHash = hashUserTurning(userTurningText);

        // 获取书籍摘要（缓存命中秒返）
        const bookSummary = await getOrGenerateBookSummary(book, aiOptions);
        const userDirectionText = progress.user_direction || '';

        // 查预取缓存：命中且未过期 → 直接用缓存的子节点，跳过 AI 调用
        let node = null;
        let preloaded = false;
        const cacheKey = `${progress.session_id}:${choice_id}:${turningHash}`;
        const cachedEntry = preloadCache.get(cacheKey);
        if (cachedEntry) {
            const ageMs = Date.now() - cachedEntry.createdAt;
            if (ageMs < PRELOAD_TTL_MS) {
                node = cachedEntry.node;
                preloaded = true;
                // 命中后从缓存移除（一次性使用，避免重复推进）
                preloadCache.delete(cacheKey);
                console.log(`[Preload] 命中 session=${progress.session_id} choice=${choice_id}`);
            } else {
                preloadCache.delete(cacheKey);
            }
        }

        // 未命中 → 按需生成（含用户转折输入）
        let lastError = null;
        if (!node) {
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    const result = await aiService.generateStoryNode({
                        bookTitle: progress.novel_id,
                        bookContent: book ? book.content : '',
                        bookSummary,
                        userDirection: userDirectionText,
                        userTurning: userTurningText,
                        character,
                        nodeIndex: nextNodeIndex,
                        maxNodes: MAX_NODES,
                        lastChoiceText: choice.text || choice_text || '',
                        visitedNodes,
                        statGrowth,
                        unlockedSkills,
                        unlockedForms
                    }, aiOptions);
                    node = result.node;
                    break;
                } catch (e) {
                    lastError = e;
                    if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
                }
            }
        }

        if (!node) {
            const errDetail = lastError
                ? `${lastError.message}${lastError.errorType ? `（${lastError.errorType}）` : ''}`
                : '未知错误';
            console.error('[AI] 选择节点生成失败:', errDetail,
                lastError && lastError.rawContent ? '\n[AI 原始返回]\n' + String(lastError.rawContent).substring(0, 500) : '');
            // 不前进，返回 fallback_dag 让前端切预置模式
            return res.json({
                fallback_dag: true,
                reason: `AI 节点生成失败：${errDetail}`,
                stat_growth: statGrowth,
                unlocked_skills: unlockedSkills,
                unlocked_forms: unlockedForms
            });
        }

        // 应用新 node.effects（进入节点生效）
        if (node.effects) {
            for (const k of Object.keys(node.effects)) {
                statGrowth[k] = (statGrowth[k] || 0) + Number(node.effects[k]);
            }
        }

        // 更新 visited_nodes
        if (!visitedNodes.includes(node.id)) visitedNodes.push(node.id);

        // 是否到达 ending
        let newStatus = 'active';
        let endingNode = null;
        if (node.type === 'ending') {
            newStatus = 'completed';
            endingNode = node.id;
        }

        // 追加转折输入到 turning_inputs_json（便于历史回看）
        let turningInputs = [];
        try { turningInputs = JSON.parse(progress.turning_inputs_json || '[]'); } catch (e) {}
        if (userTurningText) {
            turningInputs.push({ nodeIndex: nextNodeIndex, choiceId: choice_id, input: userTurningText });
        }

        db.prepare(`
            UPDATE story_dag_progress
            SET current_node = ?, visited_nodes_json = ?, stat_growth_json = ?,
                unlocked_skills_json = ?, unlocked_forms_json = ?,
                status = ?, ending_node = ?, turning_inputs_json = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            JSON.stringify(node),
            JSON.stringify(visitedNodes),
            JSON.stringify(statGrowth),
            JSON.stringify(unlockedSkills),
            JSON.stringify(unlockedForms),
            newStatus, endingNode, JSON.stringify(turningInputs), dag_progress_id
        );

        // 异步触发下一层预取（非关键转折节点 + 非 battle/ending）
        if (!isKeyTurningNode(node, nextNodeIndex, MAX_NODES)) {
            triggerPreload(progress.session_id, node, {
                book, character, userDirection: userDirectionText, aiOptions, bookSummary,
                statGrowth, unlockedSkills, unlockedForms, visitedNodes
            });
        }

        // 附加 nodeIndex/maxNodes 字段，供前端判定关键转折节点
        if (node && typeof node === 'object') {
            node.nodeIndex = nextNodeIndex;
            node.maxNodes = MAX_NODES;
        }

        res.json({
            mode: 'ai',
            next_node: node,
            stat_growth: statGrowth,
            unlocked_skills: unlockedSkills,
            unlocked_forms: unlockedForms,
            visited_nodes: visitedNodes,
            status: newStatus,
            ending_node: endingNode,
            preloaded
        });
    } catch (err) {
        console.error('AI 选择失败:', err);
        res.status(500).json({ error: err.message });
    }
});

// AI 模式战斗
app.post('/api/story/ai/battle', authMiddleware, async (req, res) => {
    try {
        const { dag_progress_id } = req.body;
        if (!dag_progress_id) return res.status(400).json({ error: '缺少 dag_progress_id' });

        const progress = db.prepare('SELECT * FROM story_dag_progress WHERE id = ? AND user_id = ?').get(dag_progress_id, req.user.id);
        if (!progress) return res.status(404).json({ error: 'DAG 进度不存在' });
        if (progress.mode !== 'ai') return res.status(400).json({ error: '该端点仅支持 AI 模式' });

        // 解析当前节点（含 enemy）
        let currentNode = null;
        try { currentNode = JSON.parse(progress.current_node); } catch (e) {
            return res.status(500).json({ error: '当前节点 JSON 解析失败' });
        }
        if (!currentNode || currentNode.type !== 'battle' || !currentNode.enemy) {
            return res.status(400).json({ error: '当前节点不是战斗节点' });
        }

        // 查询玩家角色
        if (!progress.character_id) return res.status(400).json({ error: '未绑定角色' });
        const charRow = db.prepare('SELECT * FROM characters WHERE id = ?').get(progress.character_id);
        if (!charRow) return res.status(404).json({ error: '角色不存在' });

        const statGrowth = JSON.parse(progress.stat_growth_json || '{}');
        const baseStats = JSON.parse(charRow.stats_json || '{}');
        // 应用 stat_growth 到玩家属性
        const playerStats = { ...baseStats };
        for (const k of Object.keys(statGrowth)) {
            playerStats[k] = (playerStats[k] || 0) + statGrowth[k];
        }
        const playerChar = {
            id: charRow.id, name: charRow.name, grade: charRow.grade, source: charRow.source,
            stats: playerStats,
            skills: JSON.parse(charRow.skills_json || '[]'),
            forms: JSON.parse(charRow.forms_json || '[]')
        };

        // 敌人（补默认 forms/skills 以兼容 battle-engine）
        const enemy = currentNode.enemy;
        if (!enemy.forms || enemy.forms.length === 0) {
            enemy.forms = [{ name: '基础', bonuses: {} }];
        }
        if (!Array.isArray(enemy.skills) || enemy.skills.length === 0) {
            enemy.skills = [{ name: '普通攻击', type: 'physical_attack', multiplier: 1.0, mp_cost: 0, desc: '普通一击' }];
        }

        // 执行战斗
        const battle = battleEngine.executeBattle(playerChar, enemy, 0, 0);
        const victory = battle.winner === 1;

        // 记录战斗结果
        const battleResults = JSON.parse(progress.battle_results_json || '[]');
        battleResults.push({
            node: currentNode.id,
            enemy: enemy.name,
            winner: battle.winner,
            total_rounds: battle.total_rounds,
            timestamp: new Date().toISOString()
        });

        const visitedNodes = JSON.parse(progress.visited_nodes_json || '[]');
        const unlockedSkills = JSON.parse(progress.unlocked_skills_json || '[]');
        const unlockedForms = JSON.parse(progress.unlocked_forms_json || '[]');

        // 查询 book 和 character（供 AI 上下文）
        const book = db.prepare('SELECT * FROM books WHERE id = ?').get(progress.book_id);
        const character = {
            id: charRow.id, name: charRow.name, grade: charRow.grade, source: charRow.source,
            source_basis: charRow.source_basis
        };

        let nextNode = null;
        let newStatus = 'active';
        let endingNode = null;
        let endingType = null;

        const aiOptions = getUserAiOptions(req.user.id);
        if (victory) {
            // 胜利 → 调 AI 生成下个节点
            const nextNodeIndex = visitedNodes.length;
            const MAX_NODES = 10;

            let lastError = null;
            if (aiOptions.hasApiKey) {
                for (let attempt = 0; attempt < 2; attempt++) {
                    try {
                        const result = await aiService.generateStoryNode({
                            bookTitle: progress.novel_id,
                            bookContent: book ? book.content : '',
                            character,
                            nodeIndex: nextNodeIndex,
                            maxNodes: MAX_NODES,
                            lastChoiceText: `战斗胜利：击败 ${enemy.name}`,
                            visitedNodes,
                            statGrowth,
                            unlockedSkills,
                            unlockedForms
                        }, aiOptions);
                        nextNode = result.node;
                        break;
                    } catch (e) {
                        lastError = e;
                        if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
                    }
                }
            }

            if (!nextNode) {
                // AI 失败 → 不前进，返回 fallback_dag（保留战斗结果）
                const errDetail = !aiOptions.hasApiKey
                    ? '未配置 AI API Key'
                    : (lastError
                        ? `${lastError.message}${lastError.errorType ? `（${lastError.errorType}）` : ''}`
                        : '未知错误');
                console.error('[AI] 战斗胜利后续节点生成失败:', errDetail,
                    lastError && lastError.rawContent ? '\n[AI 原始返回]\n' + String(lastError.rawContent).substring(0, 500) : '');
                db.prepare(`
                    UPDATE story_dag_progress
                    SET battle_results_json = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(JSON.stringify(battleResults), dag_progress_id);

                return res.json({
                    mode: 'ai',
                    battle,
                    victory,
                    enemy,
                    fallback_dag: true,
                    reason: `AI 胜利后续节点生成失败：${errDetail}`,
                    battle_results: battleResults
                });
            }

            // 应用 node.effects
            if (nextNode.effects) {
                for (const k of Object.keys(nextNode.effects)) {
                    statGrowth[k] = (statGrowth[k] || 0) + Number(nextNode.effects[k]);
                }
            }
            if (!visitedNodes.includes(nextNode.id)) visitedNodes.push(nextNode.id);
            if (nextNode.type === 'ending') {
                newStatus = 'completed';
                endingNode = nextNode.id;
                endingType = nextNode.ending_type;
            }
            // 附加 nodeIndex/maxNodes 字段，供前端判定关键转折节点
            if (nextNode && typeof nextNode === 'object') {
                nextNode.nodeIndex = nextNodeIndex;
                nextNode.maxNodes = MAX_NODES;
            }
        } else {
            // 失败 → 调 AI 生成 bad ending
            const failNodeIndex = visitedNodes.length;

            if (aiOptions.hasApiKey) {
                try {
                    const result = await aiService.generateBadEnding({
                        bookTitle: progress.novel_id,
                        character,
                        enemyName: enemy.name,
                        nodeIndex: failNodeIndex
                    }, aiOptions);
                    nextNode = result.node;
                } catch (e) {
                    // generateBadEnding 内部已有兜底，此处再兜底
                    nextNode = {
                        id: `ai_node_${failNodeIndex}`,
                        type: 'ending',
                        title: '败北之路',
                        chapter: '终章',
                        description: `你在与${enemy.name}的交锋中落败，命途至此戛然而止。`,
                        ending_type: 'bad'
                    };
                }
            } else {
                nextNode = {
                    id: `ai_node_${failNodeIndex}`,
                    type: 'ending',
                    title: '败北之路',
                    chapter: '终章',
                    description: `你在与${enemy.name}的交锋中落败，命途至此戛然而止。`,
                    ending_type: 'bad'
                };
            }

            newStatus = 'completed';
            endingNode = nextNode.id;
            endingType = 'bad';
            if (!visitedNodes.includes(nextNode.id)) visitedNodes.push(nextNode.id);
            // 附加 nodeIndex/maxNodes 字段（ending 节点前端不渲染转折输入，附加仅为字段一致）
            if (nextNode && typeof nextNode === 'object') {
                nextNode.nodeIndex = failNodeIndex;
                nextNode.maxNodes = 10;
            }
        }

        db.prepare(`
            UPDATE story_dag_progress
            SET current_node = ?, visited_nodes_json = ?, stat_growth_json = ?,
                battle_results_json = ?, status = ?, ending_node = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            JSON.stringify(nextNode),
            JSON.stringify(visitedNodes),
            JSON.stringify(statGrowth),
            JSON.stringify(battleResults),
            newStatus, endingNode, dag_progress_id
        );

        res.json({
            mode: 'ai',
            battle,
            victory,
            enemy,
            next_node: nextNode,
            stat_growth: statGrowth,
            visited_nodes: visitedNodes,
            battle_results: battleResults,
            status: newStatus,
            ending_type: endingType
        });
    } catch (err) {
        console.error('AI 战斗失败:', err);
        res.status(500).json({ error: err.message });
    }
});

// 开始剧情旅程（旧 API，保留兼容）
app.post('/api/story/start', authMiddleware, async (req, res) => {
    const { book_id, character_id } = req.body;
    if (!book_id) {
        return res.status(400).json({ error: '请选择书籍' });
    }

    try {
        const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
        if (!book) {
            return res.status(404).json({ error: '书籍不存在' });
        }

        // 提前检查AI配置（避免创建无效空会话）
        const aiOptions = getUserAiOptions(req.user.id);
        if (!aiOptions.hasApiKey) {
            return res.status(400).json({ error: '请先配置AI服务', code: 'AI_NOT_CONFIGURED' });
        }

        // 查询玩家选择的角色信息
        let character = null;
        if (character_id) {
            const charRow = db.prepare('SELECT * FROM characters WHERE id = ?').get(character_id);
            if (charRow) {
                character = {
                    id: charRow.id,
                    name: charRow.name,
                    grade: charRow.grade,
                    source: charRow.source,
                    gradient: charRow.gradient,
                    image: charRow.image,
                    skills: JSON.parse(charRow.skills_json || '[]'),
                    stats: JSON.parse(charRow.stats_json || '{}'),
                    source_basis: charRow.source_basis
                };
            }
        }

        // 检查是否已有进行中的会话
        const existing = db.prepare('SELECT * FROM story_sessions WHERE user_id = ? AND book_id = ? AND status = ?').get(req.user.id, book_id, 'active');
        if (existing) {
            // 若会话缺少选项数据（上次生成失败的空会话），删除后重新生成
            if (!existing.current_choices_json) {
                db.prepare('DELETE FROM chapter_rewards WHERE session_id = ?').run(existing.id);
                db.prepare('DELETE FROM story_sessions WHERE id = ?').run(existing.id);
            } else {
                // 恢复有效会话
                const choices = JSON.parse(existing.current_choices_json);
                // 恢复时也返回角色信息
                let resumeCharacter = character;
                if (!resumeCharacter && existing.character_id) {
                    const cRow = db.prepare('SELECT * FROM characters WHERE id = ?').get(existing.character_id);
                    if (cRow) {
                        resumeCharacter = {
                            id: cRow.id, name: cRow.name, grade: cRow.grade, source: cRow.source,
                            gradient: cRow.gradient, image: cRow.image,
                            skills: JSON.parse(cRow.skills_json || '[]'),
                            stats: JSON.parse(cRow.stats_json || '{}'),
                            source_basis: cRow.source_basis
                        };
                    }
                }
                return res.json({
                    session_id: existing.id,
                    chapter_index: existing.chapter_index,
                    total_chapters: existing.total_chapters,
                    status: existing.status,
                    summary: existing.summary,
                    current_choices: choices,
                    character: resumeCharacter,
                    resumed: true
                });
            }
        }

        // 创建新会话（保存 character_id）
        const result = db.prepare(`
            INSERT INTO story_sessions (user_id, book_id, character_id, chapter_index, total_chapters, status, messages_json)
            VALUES (?, ?, ?, 1, 10, 'active', '[]')
        `).run(req.user.id, book_id, character_id || null);

        const sessionId = result.lastInsertRowid;

        // 用AI生成第一章（传入角色信息，让AI以该角色视角生成）
        const chapter = await aiService.generateStoryChapter(book.content, {
            chapterIndex: 1,
            totalChapters: 10,
            summary: '',
            previousChoices: [],
            character
        }, {
            customProvider: aiOptions.provider,
            customModel: aiOptions.model,
            customApiKey: aiOptions.apiKey,
            customBaseUrl: aiOptions.customBaseUrl,
            protocol: aiOptions.protocol
        });

        // 保存当前选项
        db.prepare('UPDATE story_sessions SET current_choices_json = ?, summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(JSON.stringify(chapter.choices), chapter.chapterSummary, sessionId);

        res.json({
            session_id: sessionId,
            chapter_index: 1,
            total_chapters: 10,
            chapter_title: chapter.chapterTitle,
            story_text: chapter.storyText,
            choices: chapter.choices,
            status: 'active',
            character
        });
    } catch (err) {
        console.error('开始剧情失败:', err);
        res.status(500).json({ error: err.message, errorType: err.errorType });
    }
});

// 获取当前会话状态
app.get('/api/story/session', authMiddleware, (req, res) => {
    try {
        const session = db.prepare('SELECT * FROM story_sessions WHERE user_id = ? AND status = ? ORDER BY updated_at DESC LIMIT 1').get(req.user.id, 'active');
        if (!session) {
            return res.json({ session: null });
        }
        const choices = session.current_choices_json ? JSON.parse(session.current_choices_json) : null;
        // 恢复角色信息
        let character = null;
        if (session.character_id) {
            const cRow = db.prepare('SELECT * FROM characters WHERE id = ?').get(session.character_id);
            if (cRow) {
                character = {
                    id: cRow.id, name: cRow.name, grade: cRow.grade, source: cRow.source,
                    gradient: cRow.gradient, image: cRow.image,
                    skills: JSON.parse(cRow.skills_json || '[]'),
                    stats: JSON.parse(cRow.stats_json || '{}'),
                    source_basis: cRow.source_basis
                };
            }
        }
        res.json({
            session: {
                id: session.id,
                book_id: session.book_id,
                chapter_index: session.chapter_index,
                total_chapters: session.total_chapters,
                status: session.status,
                summary: session.summary,
                current_choices: choices,
                character
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 获取下一章
app.post('/api/story/next-chapter', authMiddleware, async (req, res) => {
    const { session_id } = req.body;
    if (!session_id) {
        return res.status(400).json({ error: '缺少会话ID' });
    }

    try {
        const session = db.prepare('SELECT * FROM story_sessions WHERE id = ? AND user_id = ?').get(session_id, req.user.id);
        if (!session) {
            return res.status(404).json({ error: '会话不存在' });
        }
        if (session.status !== 'active') {
            return res.status(400).json({ error: '会话已结束' });
        }

        const book = db.prepare('SELECT * FROM books WHERE id = ?').get(session.book_id);
        const nextChapter = session.chapter_index + 1;

        // 检查是否完结
        if (nextChapter > session.total_chapters) {
            // 生成完结剧情
            const aiOptions = getUserAiOptions(req.user.id);
            const messages = JSON.parse(session.messages_json || '[]');
            const previousChoices = messages.filter(m => m.role === 'choice').map(m => m.content);

            const ending = await aiService.generateStoryEnding(book.content, {
                summary: session.summary,
                previousChoices
            }, {
                customProvider: aiOptions.provider,
                customModel: aiOptions.model,
                customApiKey: aiOptions.apiKey,
                customBaseUrl: aiOptions.customBaseUrl,
                protocol: aiOptions.protocol
            });

            db.prepare('UPDATE story_sessions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                .run('completed', session_id);

            return res.json({
                completed: true,
                ending_text: ending.endingText,
                evaluation: ending.evaluation,
                final_exp: ending.finalExp
            });
        }

        // 生成下一章
        const aiOptions = getUserAiOptions(req.user.id);
        const messages = JSON.parse(session.messages_json || '[]');
        const previousChoices = messages.filter(m => m.role === 'choice').map(m => m.content);

        // 恢复会话角色，保持后续章节视角一致
        let chapterCharacter = null;
        if (session.character_id) {
            const cRow = db.prepare('SELECT * FROM characters WHERE id = ?').get(session.character_id);
            if (cRow) {
                chapterCharacter = {
                    id: cRow.id, name: cRow.name, grade: cRow.grade, source: cRow.source,
                    gradient: cRow.gradient, image: cRow.image,
                    skills: JSON.parse(cRow.skills_json || '[]'),
                    stats: JSON.parse(cRow.stats_json || '{}'),
                    source_basis: cRow.source_basis
                };
            }
        }

        const chapter = await aiService.generateStoryChapter(book.content, {
            chapterIndex: nextChapter,
            totalChapters: session.total_chapters,
            summary: session.summary,
            previousChoices,
            character: chapterCharacter
        }, {
            customProvider: aiOptions.provider,
            customModel: aiOptions.model,
            customApiKey: aiOptions.apiKey,
            customBaseUrl: aiOptions.customBaseUrl,
            protocol: aiOptions.protocol
        });

        db.prepare('UPDATE story_sessions SET chapter_index = ?, current_choices_json = ?, summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(nextChapter, JSON.stringify(chapter.choices), chapter.chapterSummary, session_id);

        res.json({
            chapter_index: nextChapter,
            total_chapters: session.total_chapters,
            chapter_title: chapter.chapterTitle,
            story_text: chapter.storyText,
            choices: chapter.choices
        });
    } catch (err) {
        console.error('获取下一章失败:', err);
        res.status(500).json({ error: err.message, errorType: err.errorType });
    }
});

// 提交选择
app.post('/api/story/make-choice', authMiddleware, async (req, res) => {
    const { session_id, choice_id, choice_text } = req.body;
    if (!session_id || !choice_id) {
        return res.status(400).json({ error: '缺少会话ID或选择ID' });
    }

    try {
        const session = db.prepare('SELECT * FROM story_sessions WHERE id = ? AND user_id = ?').get(session_id, req.user.id);
        if (!session) {
            return res.status(404).json({ error: '会话不存在' });
        }

        const book = db.prepare('SELECT * FROM books WHERE id = ?').get(session.book_id);
        const aiOptions = getUserAiOptions(req.user.id);

        // 记录选择到消息历史
        const messages = JSON.parse(session.messages_json || '[]');
        messages.push({ role: 'choice', content: choice_text || choice_id, chapter: session.chapter_index });

        // AI处理选择
        const result = await aiService.processStoryChoice(book.content, {
            chapterIndex: session.chapter_index,
            summary: session.summary
        }, choice_id, choice_text, {
            customProvider: aiOptions.provider,
            customModel: aiOptions.model,
            customApiKey: aiOptions.apiKey,
            customBaseUrl: aiOptions.customBaseUrl,
            protocol: aiOptions.protocol
        });

        // 更新消息历史
        messages.push({ role: 'result', content: result.resultText, chapter: session.chapter_index });
        db.prepare('UPDATE story_sessions SET messages_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .run(JSON.stringify(messages), session_id);

        // 处理奖励
        let characterCreated = null;
        let itemCreated = null;

        if (result.characterReward) {
            const char = result.characterReward;
            // 插入角色
            const charResult = db.prepare(`
                INSERT INTO characters (name, grade, source, gradient, stats_json, skills_json, forms_json, source_basis)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                char.name,
                char.grade || 'B',
                char.source || book.title,
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                JSON.stringify(char.stats),
                JSON.stringify(char.skills),
                JSON.stringify(char.forms || [{ name: '基础', bonuses: {} }]),
                char.source_basis || ''
            );
            const newCharId = charResult.lastInsertRowid;

            // 加入用户角色库
            try {
                db.prepare('INSERT INTO user_characters (user_id, character_id, level, exp) VALUES (?, ?, 1, ?)')
                    .run(req.user.id, newCharId, result.expGained || 0);
            } catch (e) {
                // 已拥有则加经验
            }

            // 记录奖励
            db.prepare('INSERT INTO chapter_rewards (session_id, chapter_index, reward_type, reward_id, reward_name, reward_data_json) VALUES (?, ?, "character", ?, ?, ?)')
                .run(session_id, session.chapter_index, newCharId, char.name, JSON.stringify(char));

            characterCreated = { id: newCharId, name: char.name, grade: char.grade };
        }

        if (result.itemReward) {
            const item = result.itemReward;
            // 插入道具
            const itemResult = db.prepare(`
                INSERT INTO items (name, source, rarity, type, description, stats_bonus_json, source_basis)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                item.name,
                book.title,
                item.rarity || 'common',
                item.type || 'accessory',
                item.description || '',
                JSON.stringify(item.stats_bonus || {}),
                item.source_basis || ''
            );
            const newItemId = itemResult.lastInsertRowid;

            // 加入用户道具库
            try {
                db.prepare('INSERT INTO user_items (user_id, item_id, quantity, equipped) VALUES (?, ?, 1, 0)')
                    .run(req.user.id, newItemId);
            } catch (e) {
                db.prepare('UPDATE user_items SET quantity = quantity + 1 WHERE user_id = ? AND item_id = ?')
                    .run(req.user.id, newItemId);
            }

            db.prepare('INSERT INTO chapter_rewards (session_id, chapter_index, reward_type, reward_id, reward_name, reward_data_json) VALUES (?, ?, "item", ?, ?, ?)')
                .run(session_id, session.chapter_index, newItemId, item.name, JSON.stringify(item));

            itemCreated = { id: newItemId, name: item.name, rarity: item.rarity };
        }

        // 给已有角色加经验（如果本章没获得新角色）
        if (!characterCreated && result.expGained > 0) {
            const userChars = db.prepare('SELECT character_id FROM user_characters WHERE user_id = ?').all(req.user.id);
            if (userChars.length > 0) {
                // 给最近获得的角色加经验
                const lastChar = userChars[userChars.length - 1];
                db.prepare('UPDATE user_characters SET exp = exp + ? WHERE user_id = ? AND character_id = ?')
                    .run(result.expGained, req.user.id, lastChar.character_id);
            }
        }

        res.json({
            result_text: result.resultText,
            exp_gained: result.expGained,
            character_reward: characterCreated,
            item_reward: itemCreated,
            chapter_index: session.chapter_index,
            is_last_chapter: session.chapter_index >= session.total_chapters
        });
    } catch (err) {
        console.error('处理选择失败:', err);
        res.status(500).json({ error: err.message, errorType: err.errorType });
    }
});

// 放弃剧情
app.post('/api/story/abandon', authMiddleware, (req, res) => {
    const { session_id } = req.body;
    try {
        db.prepare('UPDATE story_sessions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
            .run('abandoned', session_id, req.user.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 获取剧情历史
app.get('/api/story/history', authMiddleware, (req, res) => {
    try {
        const sessions = db.prepare(`
            SELECT s.*, b.title as book_title, b.cover_gradient,
                   d.id as dag_progress_id, d.mode as dag_mode, d.status as dag_status,
                   d.character_id as dag_character_id, d.novel_id as dag_novel_id
            FROM story_sessions s
            JOIN books b ON s.book_id = b.id
            LEFT JOIN story_dag_progress d ON d.session_id = s.id AND d.user_id = s.user_id
            WHERE s.user_id = ?
            ORDER BY s.updated_at DESC
        `).all(req.user.id);

        const history = sessions.map(s => ({
            id: s.id,
            book_id: s.book_id,
            book_title: s.book_title,
            cover_gradient: s.cover_gradient,
            chapter_index: s.chapter_index,
            total_chapters: s.total_chapters,
            status: s.status,
            created_at: s.created_at,
            updated_at: s.updated_at,
            dag_progress_id: s.dag_progress_id,
            dag_mode: s.dag_mode || 'dag',
            dag_status: s.dag_status,
            dag_character_id: s.dag_character_id,
            dag_novel_id: s.dag_novel_id
        }));

        res.json({ sessions: history });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 删除存档（同时清理 story_sessions 和关联的 story_dag_progress）
app.delete('/api/story/saves/:id', authMiddleware, (req, res) => {
    const sessionId = req.params.id;
    try {
        // 先校验存档归属当前用户
        const session = db.prepare('SELECT id FROM story_sessions WHERE id = ? AND user_id = ?').get(sessionId, req.user.id);
        if (!session) {
            return res.status(404).json({ error: '存档不存在或无权操作' });
        }
        // 删除关联的 DAG 进度
        db.prepare('DELETE FROM story_dag_progress WHERE session_id = ? AND user_id = ?').run(sessionId, req.user.id);
        // 删除 session 本身
        db.prepare('DELETE FROM story_sessions WHERE id = ? AND user_id = ?').run(sessionId, req.user.id);
        res.json({ success: true });
    } catch (err) {
        console.error('删除存档失败:', err);
        res.status(500).json({ error: err.message });
    }
});

// ==================== 角色装备API ====================
// 获取角色已装备的道具列表
app.get('/api/characters/:id/equipment', authMiddleware, (req, res) => {
    const charId = req.params.id;
    try {
        const rows = db.prepare(`
            SELECT ce.item_id, ce.equipped_at, i.name, i.type, i.rarity, i.image, i.source,
                   i.stats_bonus_json, i.skill_bonus_json, i.description
            FROM character_equipment ce
            JOIN items i ON ce.item_id = i.id
            WHERE ce.user_id = ? AND ce.character_id = ?
            ORDER BY ce.equipped_at DESC
        `).all(req.user.id, charId);
        const equipment = rows.map(r => ({
            item_id: r.item_id,
            equipped_at: r.equipped_at,
            name: r.name,
            type: r.type,
            rarity: r.rarity,
            image: r.image,
            source: r.source,
            stats_bonus: r.stats_bonus_json ? JSON.parse(r.stats_bonus_json) : null,
            skill_bonus: r.skill_bonus_json ? JSON.parse(r.skill_bonus_json) : null,
            description: r.description
        }));
        res.json({ equipment });
    } catch (err) {
        res.status(500).json({ error: '获取装备失败: ' + err.message });
    }
});

// 装备道具到角色
app.post('/api/characters/:id/equip', authMiddleware, (req, res) => {
    const charId = req.params.id;
    const { item_id } = req.body;
    if (!item_id) return res.status(400).json({ error: '缺少 item_id' });

    try {
        // 校验角色属于该用户
        const uc = db.prepare('SELECT 1 FROM user_characters WHERE user_id = ? AND character_id = ?').get(req.user.id, charId);
        if (!uc) return res.status(404).json({ error: '您未拥有该角色' });

        // 校验道具属于该用户
        const ui = db.prepare('SELECT 1 FROM user_items WHERE user_id = ? AND item_id = ?').get(req.user.id, item_id);
        if (!ui) return res.status(404).json({ error: '您未拥有该道具' });

        // 检查道具是否已被其他角色装备
        const existing = db.prepare('SELECT character_id FROM character_equipment WHERE user_id = ? AND item_id = ?').get(req.user.id, item_id);
        if (existing && existing.character_id !== parseInt(charId)) {
            return res.status(400).json({ error: '该道具已被其他角色装备' });
        }

        // 写入装备关联（UNIQUE 约束避免重复）
        db.prepare('INSERT OR IGNORE INTO character_equipment (user_id, character_id, item_id) VALUES (?, ?, ?)')
            .run(req.user.id, charId, item_id);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: '装备失败: ' + err.message });
    }
});

// 卸下角色的道具
app.post('/api/characters/:id/unequip', authMiddleware, (req, res) => {
    const charId = req.params.id;
    const { item_id } = req.body;
    if (!item_id) return res.status(400).json({ error: '缺少 item_id' });

    try {
        db.prepare('DELETE FROM character_equipment WHERE user_id = ? AND character_id = ? AND item_id = ?')
            .run(req.user.id, charId, item_id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: '卸下失败: ' + err.message });
    }
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
