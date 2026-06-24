// auth.js - 注册/登录/JWT中间件
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

// JWT密钥（环境变量或默认值）
const JWT_SECRET = process.env.JWT_SECRET || 'wanjuan_fusheng_secret_key_2024';
const JWT_EXPIRES_IN = '7d'; // 7天有效期

// 注册新用户
function register(username, password, nickname, avatar) {
    // 参数校验
    if (!username || !password) {
        return { success: false, message: '用户名和密码不能为空' };
    }
    if (username.length < 3 || username.length > 20) {
        return { success: false, message: '用户名长度需3-20位' };
    }
    if (password.length < 6) {
        return { success: false, message: '密码长度至少6位' };
    }

    // 检查用户名是否已存在
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
        return { success: false, message: '用户名已存在' };
    }

    // 加密密码
    const hashedPassword = bcrypt.hashSync(password, 10);
    const finalNickname = nickname || username;
    const finalAvatar = avatar || '🎮';

    // 插入用户
    const result = db.prepare(`
        INSERT INTO users (username, password, nickname, avatar)
        VALUES (?, ?, ?, ?)
    `).run(username, hashedPassword, finalNickname, finalAvatar);

    const userId = result.lastInsertRowid;
    // 查询完整用户信息
    const user = db.prepare('SELECT id, username, nickname, avatar, wins, losses FROM users WHERE id = ?').get(userId);

    // 生成JWT
    const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return { success: true, token, user };
}

// 登录
function login(username, password) {
    if (!username || !password) {
        return { success: false, message: '用户名和密码不能为空' };
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
        return { success: false, message: '用户名或密码错误' };
    }

    // 验证密码
    if (!bcrypt.compareSync(password, user.password)) {
        return { success: false, message: '用户名或密码错误' };
    }

    // 生成JWT
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const userInfo = {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        wins: user.wins,
        losses: user.losses
    };

    return { success: true, token, user: userInfo };
}

// 根据userId获取用户信息（不含密码）
function getUserById(userId) {
    const user = db.prepare('SELECT id, username, nickname, avatar, wins, losses FROM users WHERE id = ?').get(userId);
    return user;
}

// JWT鉴权中间件（用于Express路由）
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未提供认证token' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = getUserById(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: '用户不存在' });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'token无效或已过期' });
    }
}

// 验证JWT token（用于WebSocket）
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = getUserById(decoded.userId);
        return user ? user : null;
    } catch (err) {
        return null;
    }
}

module.exports = {
    register,
    login,
    getUserById,
    authMiddleware,
    verifyToken,
    JWT_SECRET
};
