// app.js - 东方志怪典籍风格主应用逻辑
// 游戏化 Toast 与加载动画已集成

// HTML 转义工具：防止用户可控字段（nickname/username/avatar 等）引发 XSS
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ====== 游戏化 Toast 与加载动画样式注入 ======
// 注：由于 style.css 无法直接追加，此处通过 JS 注入样式
(function injectGameToastStyles() {
    if (document.getElementById('game-toast-style')) return;
    const style = document.createElement('style');
    style.id = 'game-toast-style';
    style.textContent = `
/* ====== 游戏化 Toast ====== */
.game-toast-container {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    pointer-events: none;
}
.game-toast {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 16px 32px;
    background: linear-gradient(135deg, rgba(245, 240, 230, 0.98) 0%, rgba(232, 224, 208, 0.98) 100%);
    border: 2px solid var(--old-gold, #c9a962);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(13, 13, 13, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.5);
    font-family: var(--font-family-serif);
    font-size: var(--fs-body, 16px);
    color: var(--ink-black, #1a1a1a);
    animation: toast-slide-in 0.4s var(--ease-bounce, ease) forwards;
    position: relative;
    overflow: hidden;
}
.game-toast.toast-success { border-color: var(--old-gold, #c9a962); }
.game-toast.toast-error { border-color: var(--vermillion, #c23b22); }
.game-toast.toast-info { border-color: var(--border-paper, #d4c8b0); }
.game-toast.toast-exit { animation: toast-slide-out 0.3s var(--ease-smooth, ease) forwards; }
.game-toast-icon { font-size: 24px; line-height: 1; }
.game-toast-message { font-family: var(--font-family-brush); font-size: var(--fs-h4, 18px); }
.game-toast::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 12px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--vermillion, #c23b22);
    transform: translateY(-50%) scale(0);
    opacity: 0;
    animation: stamp-drop 0.6s var(--ease-bounce, ease) 0.2s forwards;
}
.game-toast.toast-success::after {
    content: '妙';
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-family: var(--font-family-brush);
    font-size: 16px;
}
.game-toast.toast-error::after {
    content: '不';
    background: var(--vermillion-dark, #a02f1a);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-family: var(--font-family-brush);
    font-size: 16px;
}
/* ====== 水墨加载动画 ====== */
.loading-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(13, 13, 13, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    gap: 16px;
}
.loading-taichi-wrapper { position: relative; width: 64px; height: 64px; }
.loading-taichi-text {
    font-family: var(--font-family-brush);
    font-size: var(--fs-h5, 14px);
    color: var(--text-on-dark, #f5f0e6);
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    animation: taichi-text-pulse 1.5s ease-in-out infinite;
}
@keyframes taichi-text-pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
}
.inline-loading {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: linear-gradient(90deg, currentColor 50%, transparent 50%);
    animation: taichi-spin 0.8s linear infinite;
    vertical-align: middle;
}
`;
    document.head.appendChild(style);
})();

// ====== 游戏化 Toast ======
function showGameToast(message, type = 'success') {
    // 移除现有 toast
    const existing = document.querySelector('.game-toast-container');
    if (existing) existing.remove();

    // 创建容器
    const container = document.createElement('div');
    container.className = 'game-toast-container';

    // 创建 toast
    const toast = document.createElement('div');
    toast.className = `game-toast toast-${type}`;

    const iconMap = {
        success: '✓',
        error: '✗',
        info: 'ℹ'
    };

    toast.innerHTML = `
        <span class="game-toast-icon">${iconMap[type] || '✓'}</span>
        <span class="game-toast-message">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    document.body.appendChild(container);

    // 2 秒后移除
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => container.remove(), 300);
    }, 2000);
}

// 游戏化文案映射
const gameToastMessages = {
    // 成功
    characterCreated: '妙！角色已入册',
    characterDeleted: '角色已离去',
    uploadSuccess: '典籍已收录',
    uploadFailed: '典籍收录失败',
    battleStart: '对决开始！',
    battleVictory: '凯旋而归！',
    battleDefeat: '此战不利',
    saveSuccess: '存档已封印',
    loadSuccess: '存档已解封',
    // 错误
    networkError: '网络不通，请稍候',
    authFailed: '令牌失效，请重新登录',
    permissionDenied: '权限不足',
    // 信息
    loading: '正在加载...',
    matching: '正在寻找对手...',
};

// 加载动画
function showLoading(text = '正在加载...') {
    hideLoading(); // 先移除现有的

    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-taichi-wrapper">
            <div class="loading-taichi"></div>
        </div>
        <div class="loading-taichi-text">${escapeHtml(text)}</div>
    `;
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.remove();
}

const App = {
    state: {
        user: null,
        token: null,
        currentPage: 'auth',
        selectedCharId: null,
        allCharacters: [],
        online_users: [],
        extractedNames: [],
        gradeRanges: {
            S: [80, 100],
            A: [60, 85],
            B: [40, 65],
            C: [20, 50]
        }
    },
    ws: null,

    // 初始化
    init() {
        this.bindNavigationEvents();
        this.bindFormEvents();
        this.bindUploadEvents();
        Auth.init();
        
        // 检查登录状态
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            this.state.token = token;
            this.state.user = JSON.parse(user);
            this.onAuthSuccess(this.state.user);
        }
    },

    // 绑定导航事件
    bindNavigationEvents() {
        // 侧边栏导航
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                if (page) {
                    this.navigate(page);
                }
            });
        });

        // 移动端底部导航
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                if (page) {
                    this.navigate(page);
                }
            });
        });

        // 绑定移动端 Tab Bar 导航
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page && !item.classList.contains('nav-locked')) {
                    this.navigate(page);
                }
            });
        });

        // 标签页切换
        document.querySelectorAll('.tabs .tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const parentTabs = e.currentTarget.closest('.tabs');
                parentTabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // 登录注册切换
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.currentTarget.dataset.tab;
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                const loginForm = document.getElementById('login-form');
                const registerForm = document.getElementById('register-form');
                if (loginForm) loginForm.style.display = targetTab === 'login' ? 'flex' : 'none';
                if (registerForm) registerForm.style.display = targetTab === 'register' ? 'flex' : 'none';
            });
        });
    },

    // 绑定表单事件
    bindFormEvents() {
        // 登录表单
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // 注册表单
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // 头像选择
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    },

    // 绑定上传事件
    bindUploadEvents() {
        const uploadZone = document.getElementById('upload-zone');
        if (uploadZone) {
            uploadZone.addEventListener('click', () => {
                document.getElementById('file-input').click();
            });

            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('drag-over');
            });

            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('drag-over');
            });

            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file && file.name.match(/\.(txt|md)$/i)) {
                    this.handleFileUpload(file);
                } else {
                    this.showToast('请上传 .txt 或 .md 文件', 'error');
                }
            });

            const fileInput = document.getElementById('file-input');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        this.handleFileUpload(file);
                    }
                });
            }
        }
    },

    // 处理文件上传
    handleFileUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const textInput = document.getElementById('text-input');
            if (textInput) textInput.value = e.target.result;
        };
        reader.readAsText(file, 'UTF-8');
    },

    // 登录处理
    async handleLogin() {
        const usernameEl = document.getElementById('login-username');
        const passwordEl = document.getElementById('login-password');
        const username = usernameEl ? usernameEl.value.trim() : '';
        const password = passwordEl ? passwordEl.value.trim() : '';

        if (!username || !password) {
            this.showToast('请输入用户名和密码', 'error');
            return;
        }

        showLoading('正在验证身份...');
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            
            if (response.ok && data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.state.user = data.user;
                this.state.token = data.token;
                this.onAuthSuccess(data.user);
            } else {
                this.showToast(data.error || '登录失败', 'error');
            }
        } catch (error) {
            console.error('登录错误:', error);
            this.showToast(gameToastMessages.networkError, 'error');
        } finally {
            hideLoading();
        }
    },

    // 注册处理
    async handleRegister() {
        const usernameEl = document.getElementById('reg-username');
        const passwordEl = document.getElementById('reg-password');
        const nicknameEl = document.getElementById('reg-nickname');
        const username = usernameEl ? usernameEl.value.trim() : '';
        const password = passwordEl ? passwordEl.value.trim() : '';
        const nickname = nicknameEl ? nicknameEl.value.trim() : '';
        const avatarEl = document.querySelector('.avatar-option.active');
        const avatar = avatarEl ? avatarEl.dataset.avatar : '🎭';

        if (!username || !password) {
            this.showToast('请输入用户名和密码', 'error');
            return;
        }

        if (username.length < 3) {
            this.showToast('用户名至少3个字符', 'error');
            return;
        }

        if (password.length < 6) {
            this.showToast('密码至少6个字符', 'error');
            return;
        }

        showLoading('正在建立档案...');
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, nickname, avatar })
            });

            const data = await response.json();
            
            if (response.ok && data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.state.user = data.user;
                this.state.token = data.token;
                this.onAuthSuccess(data.user);
            } else {
                this.showToast(data.error || '注册失败', 'error');
            }
        } catch (error) {
            console.error('注册错误:', error);
            this.showToast(gameToastMessages.networkError, 'error');
        } finally {
            hideLoading();
        }
    },

    // 登录成功
    onAuthSuccess(user) {
        const authPage = document.getElementById('page-auth');
        const mainLayout = document.getElementById('main-layout');
        if (authPage) authPage.style.display = 'none';
        if (mainLayout) mainLayout.style.display = 'flex';
        
        this.updateUserInfo(user);
        this.connectWebSocket();
        this.navigate('library');
    },

    // 更新用户信息显示
    updateUserInfo(user) {
        const avatarEl = document.getElementById('user-avatar');
        const nameEl = document.getElementById('user-name');
        if (avatarEl) avatarEl.textContent = user.avatar || '🎭';
        if (nameEl) nameEl.textContent = user.nickname || user.username;
    },

    // 连接WebSocket
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        try {
            // token 通过 URL query 传递（与后端 ws-server.js 鉴权方式一致）
            const token = this.state.token;
            this.ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);
            
            this.ws.onopen = () => {
                console.log('[WS] 已连接');
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWsMessage(data);
                } catch (err) {
                    console.error('[WS] 消息解析错误:', err);
                }
            };
            
            this.ws.onclose = () => {
                console.log('[WS] 连接关闭，3秒后重连');
                setTimeout(() => {
                    if (this.state.user) {
                        this.connectWebSocket();
                    }
                }, 3000);
            };
            
            this.ws.onerror = (err) => {
                console.error('[WS] 连接错误:', err);
            };
        } catch (err) {
            console.error('[WS] 连接失败:', err);
        }
    },
    
    // 处理WebSocket消息
    handleWsMessage(data) {
        switch (data.type) {
            case 'connected':
                console.log('[WS] 认证成功');
                break;
            case 'lobby_update':
                Lobby.updateLobby(data);
                break;
            case 'match_found':
                Battle.onMatchFound(data);
                break;
            case 'battle_start':
                Battle.onBattleStart(data);
                break;
            case 'battle_round':
                Battle.onBattleRound(data);
                break;
            case 'battle_end':
                Battle.onBattleEnd(data);
                this.notifyBattleExp(data);
                break;
            case 'battle_invite':
                this.handleBattleInvite(data);
                break;
            case 'invite_rejected':
                this.showToast(data.message || '对方拒绝了你的对战邀请', 'info');
                break;
            case 'error':
                this.showToast(data.message || '发生错误', 'error');
                break;
        }
    },
    
    // 处理对战邀请
    handleBattleInvite(data) {
        const fromUser = data.from_user || {};
        const fromName = fromUser.nickname || fromUser.username || '未知玩家';
        if (confirm(`${fromName} 邀请你对战，是否接受？`)) {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'accept_invite',
                    invite_id: data.invite_id,
                    character_id: this.state.selectedCharId,
                    target_form_index: (typeof Lobby !== 'undefined' && Lobby.selectedFormIndex) || 0
                }));
            }
        } else {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'reject_invite',
                    invite_id: data.invite_id
                }));
            }
        }
    },

    // 退出登录
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.state.user = null;
        this.state.token = null;
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        const authPage = document.getElementById('page-auth');
        const mainLayout = document.getElementById('main-layout');
        if (authPage) authPage.style.display = 'block';
        if (mainLayout) mainLayout.style.display = 'none';
        this.navigate('auth');
    },

    // 页面导航
    navigate(page) {
        const targetPage = document.getElementById('page-' + page);
        if (!targetPage) return;

        this.state.currentPage = page;

        // 找到当前活跃页面
        const currentPage = document.querySelector('.page.active');

        // 判断是否需要过渡动画（当前页可见、非目标页、且未在过渡中）
        const needsTransition = currentPage
            && currentPage !== targetPage
            && currentPage.offsetParent !== null
            && !this._transitioning;

        if (!needsTransition) {
            // 过渡中重复点击则忽略；否则直接切换（首次加载、登录/登出场景）
            if (!this._transitioning) {
                this._doPageSwitch(page, targetPage);
                this.applySceneTheme(page);
            }
            return;
        }

        // 开始过渡
        this._transitioning = true;

        // 锁定导航，防止过渡期间重复点击
        document.querySelectorAll('.nav-item, .mobile-nav-item, [data-page]').forEach(el => {
            el.classList.add('nav-locked');
        });

        // 旧页面水墨晕染淡出（0.3s）
        currentPage.classList.add('page-leave');

        // 300ms 后切换页面显示
        setTimeout(() => {
            this._doPageSwitch(page, targetPage);

            // 新页面卷轴展开（0.5s）
            targetPage.classList.add('page-enter');

            // 500ms 后解锁导航并切换场景主题
            setTimeout(() => {
                targetPage.classList.remove('page-enter');
                document.querySelectorAll('.nav-locked').forEach(el => {
                    el.classList.remove('nav-locked');
                });

                // 触发场景主题切换
                this.applySceneTheme(page);

                this._transitioning = false;
            }, 500);
        }, 300);
    },

    // 实际执行页面切换（隐藏旧页、显示新页、更新高亮、初始化）
    _doPageSwitch(page, targetPage) {
        // 隐藏所有页面（同时清理过渡类，避免残留）
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active', 'page-leave', 'page-enter');
            p.style.display = 'none';
        });

        // 显示目标页面
        targetPage.style.display = 'block';
        targetPage.classList.add('active');

        // 更新侧边栏导航高亮
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // 更新移动端导航高亮
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // 页面特定初始化
        this.onPageEnter(page);

        // 平滑滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 移动端战斗日志点击展开/收起
        if (page === 'battle') {
            const battleLog = document.querySelector('.battle-center-log');
            if (battleLog && !battleLog._expandBound) {
                battleLog._expandBound = true;
                battleLog.addEventListener('click', () => {
                    battleLog.classList.toggle('expanded');
                });
            }
        }
    },

    // 场景主题切换：根据当前页面为 body 添加场景类
    applySceneTheme(page) {
        const body = document.body;
        body.classList.remove('scene-battle', 'scene-char', 'scene-lobby');

        if (page === 'battle' || page === 'battle-result') {
            body.classList.add('scene-battle');
        } else if (page === 'characters' || page === 'char-library' || page === 'create') {
            body.classList.add('scene-char');
        } else if (page === 'lobby') {
            body.classList.add('scene-lobby');
        }
    },
    
    // 页面进入时的初始化
    async onPageEnter(page) {
        switch (page) {
            case 'char-library': {
                showLoading('正在翻开名册...');
                try {
                    if (typeof Characters !== 'undefined') {
                        await Characters.loadAll();
                        this.state.allCharacters = Characters.allCharacters;
                        Characters.render();
                    }
                } finally {
                    hideLoading();
                }
                break;
            }
            case 'lobby': {
                showLoading(gameToastMessages.matching);
                try {
                    if (typeof Lobby !== 'undefined') {
                        await Lobby.enterLobby();
                    }
                } finally {
                    hideLoading();
                }
                break;
            }
            case 'battles':
                await this.loadBattleHistory();
                break;
        }
    },
    
    // 加载战绩
    async loadBattleHistory() {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const content = document.getElementById('battles-content');
        if (!content) return;
        
        showLoading('正在查阅战史...');
        try {
            const res = await fetch('/api/me/battles', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            const battles = data.battles || [];
            
            if (battles.length === 0) {
                content.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">暂无对战记录</div>';
                return;
            }
            
            content.innerHTML = `
                <div class="battle-history-list">
                    ${battles.map(b => {
                        const isWin = b.winner_id === this.state.user.id;
                        const myChar = b.player1_id === this.state.user.id ? 
                            { name: b.p1_char_name, gradient: b.p1_char_gradient, grade: b.p1_char_grade } :
                            { name: b.p2_char_name, gradient: b.p2_char_gradient, grade: b.p2_char_grade };
                        const oppChar = b.player1_id === this.state.user.id ?
                            { name: b.p2_char_name, gradient: b.p2_char_gradient, grade: b.p2_char_grade } :
                            { name: b.p1_char_name, gradient: b.p1_char_gradient, grade: b.p1_char_grade };
                        const oppName = b.player1_id === this.state.user.id ? 
                            (b.p2_nickname || b.p2_username) : (b.p1_nickname || b.p1_username);
                        
                        return `
                            <div class="battle-history-item">
                                <div class="result-badge ${isWin ? 'win' : 'lose'}">${isWin ? '胜' : '败'}</div>
                                <div class="char-portrait-mini" style="background:${myChar.gradient}">${myChar.name ? myChar.name[0] : '?'}</div>
                                <div class="info">
                                    <div class="title">${myChar.name} VS ${oppChar.name}</div>
                                    <div class="meta">对手：${escapeHtml(oppName || '未知')} · ${new Date(b.created_at).toLocaleString('zh-CN')}</div>
                                </div>
                                <div class="rounds">${b.total_rounds || 0}回合</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } catch (err) {
            console.error('加载战绩失败:', err);
            content.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">加载失败</div>';
        } finally {
            hideLoading();
        }
    },

    // 显示Toast提示（委托给游戏化 Toast，同时兼容旧 #toast 元素）
    showToast(message, type = 'info') {
        // 优先使用游戏化 Toast
        if (typeof showGameToast === 'function') {
            showGameToast(message, type);
        }
        // 兼容旧 #toast 元素（如有）
        const toast = document.getElementById('toast');
        if (toast) {
            toast.textContent = message;
            toast.className = `toast show ${type}`;
            setTimeout(() => {
                toast.className = 'toast';
            }, 3000);
        }
    },

    // ====== AI角色提取相关 ======
    // 提取候选角色名
    async extractCharacters() {
        const textInput = document.getElementById('text-input');
        const text = textInput ? textInput.value.trim() : '';
        if (!text) {
            this.showToast('请先输入或上传典籍文本', 'error');
            return;
        }
        if (text.length < 50) {
            this.showToast('文本过短，至少需要50字以提取角色', 'error');
            return;
        }

        const btn = document.getElementById('btn-extract-chars');
        const originalHtml = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span>提取中...</span>';
        }

        const resultsEl = document.getElementById('extract-results');
        if (resultsEl) {
            resultsEl.innerHTML = '<div class="extract-empty">🔍 正在分析文本，提取候选角色...</div>';
        }

        showLoading('正在解析典籍...');
        try {
            const res = await fetch('/api/characters/extract-names', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await res.json();
            if (res.ok) {
                const names = data.names || [];
                this.state.extractedNames = names;
                this.renderExtractResults(names);
            } else {
                if (resultsEl) {
                    resultsEl.innerHTML = `<div class="extract-empty">提取失败：${escapeHtml(data.error || '未知错误')}</div>`;
                }
                this.showToast(data.error || '提取失败', 'error');
            }
        } catch (err) {
            console.error('提取角色失败:', err);
            if (resultsEl) {
                resultsEl.innerHTML = '<div class="extract-empty">网络错误，请稍后重试</div>';
            }
            this.showToast(gameToastMessages.networkError, 'error');
        } finally {
            hideLoading();
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        }
    },

    // 渲染提取结果
    renderExtractResults(names) {
        const resultsEl = document.getElementById('extract-results');
        if (!resultsEl) return;
        if (names.length === 0) {
            resultsEl.innerHTML = '<div class="extract-empty">未识别到候选角色，请尝试更长的文本或手动编辑角色</div>';
            return;
        }
        resultsEl.innerHTML = `
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">识别到 ${names.length} 个候选角色，点击选择：</div>
            <div class="extract-candidate-list">
                ${names.map(n => `<span class="extract-candidate" onclick="App.selectExtractedChar('${escapeHtml(n)}')">${escapeHtml(n)}</span>`).join('')}
            </div>
            <div style="margin-top:12px;font-size:12px;color:var(--text-muted);">未找到心仪角色？可直接 <a href="#" onclick="App.selectExtractedChar('');return false;" style="color:var(--old-gold-dark);">手动创建</a></div>
        `;
    },

    // 选择提取的角色名，显示编辑表单
    selectExtractedChar(name) {
        const editor = document.getElementById('character-editor');
        if (!editor) return;
        editor.classList.add('active');

        const nameInput = document.getElementById('extract-char-name');
        if (nameInput) nameInput.value = name || '';

        // 高亮选中
        document.querySelectorAll('.extract-candidate').forEach(el => {
            el.classList.toggle('selected', el.textContent.trim() === name);
        });

        // 重置分级为A并应用推荐区间
        const gradeSelect = document.getElementById('extract-char-grade');
        if (gradeSelect) gradeSelect.value = 'A';
        this.onGradeChange();

        // 滚动到表单
        setTimeout(() => {
            editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    },

    // 分级改变时调整滑块推荐区间
    onGradeChange() {
        const gradeSelect = document.getElementById('extract-char-grade');
        if (!gradeSelect) return;
        const grade = gradeSelect.value;
        const range = this.state.gradeRanges[grade] || [50, 80];
        const [min, max] = range;
        const mid = Math.round((min + max) / 2);

        const dims = ['power', 'speed', 'intelligence', 'defense', 'special_ability', 'hp', 'mp'];
        dims.forEach(dim => {
            const slider = document.getElementById('slider-' + dim);
            const hint = document.getElementById('slider-' + dim + '-hint');
            const valEl = document.getElementById('slider-' + dim + '-val');
            if (slider) {
                slider.min = min;
                slider.max = max;
                // 若当前值不在区间内，则调整为中值
                const cur = parseInt(slider.value, 10);
                if (cur < min || cur > max) {
                    slider.value = mid;
                    if (valEl) valEl.textContent = mid;
                }
            }
            if (hint) hint.textContent = `推荐区间：${min}-${max}`;
        });
    },

    // 滑块输入实时更新数值显示
    onSliderInput(dim) {
        const slider = document.getElementById('slider-' + dim);
        const valEl = document.getElementById('slider-' + dim + '-val');
        if (slider && valEl) {
            valEl.textContent = slider.value;
        }
    },

    // 清空提取结果
    clearExtract() {
        const resultsEl = document.getElementById('extract-results');
        if (resultsEl) {
            resultsEl.innerHTML = '<div class="extract-empty">点击「提取角色」按钮，从典籍文本中识别候选角色</div>';
        }
        const editor = document.getElementById('character-editor');
        if (editor) editor.classList.remove('active');
        this.state.extractedNames = [];
    },

    // 取消编辑
    cancelCustomChar() {
        const editor = document.getElementById('character-editor');
        if (editor) editor.classList.remove('active');
        document.querySelectorAll('.extract-candidate').forEach(el => el.classList.remove('selected'));
    },

    // 保存自定义角色
    async saveCustomCharacter() {
        // 收集表单数据
        const nameEl = document.getElementById('extract-char-name');
        const sourceEl = document.getElementById('extract-char-source');
        const gradeEl = document.getElementById('extract-char-grade');
        const basisEl = document.getElementById('extract-char-basis');

        const name = nameEl ? nameEl.value.trim() : '';
        const source = sourceEl ? sourceEl.value.trim() : '自定义';
        const grade = gradeEl ? gradeEl.value : 'A';
        const sourceBasis = basisEl ? basisEl.value.trim() : '';

        // 表单验证
        if (!name) {
            this.showToast('请输入角色名', 'error');
            return;
        }
        if (!sourceBasis) {
            this.showToast('请填写原作依据', 'error');
            return;
        }

        // 收集7维属性
        const dims = ['power', 'speed', 'intelligence', 'defense', 'special_ability', 'hp', 'mp'];
        const stats = {};
        for (const dim of dims) {
            const slider = document.getElementById('slider-' + dim);
            const val = slider ? parseInt(slider.value, 10) : 50;
            if (isNaN(val) || val < 0 || val > 10000) {
                this.showToast(`属性 ${dim} 数值异常`, 'error');
                return;
            }
            stats[dim] = val;
        }

        // 收集技能与形态（验证可能抛错）
        let skills, forms;
        try {
            skills = this._collectSkills();
            forms = this._collectForms();
        } catch (err) {
            this.showToast(err.message || '表单填写有误', 'error');
            return;
        }
        if (skills.length < 3) {
            this.showToast('至少需要3个技能', 'error');
            return;
        }
        if (forms.length < 1) {
            this.showToast('至少需要1个形态', 'error');
            return;
        }

        // 提交保存
        const token = localStorage.getItem('token');
        if (!token) {
            this.showToast('请先登录', 'error');
            return;
        }

        const saveBtn = document.getElementById('save-custom-char');
        const originalHtml = saveBtn ? saveBtn.innerHTML : '';
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span>保存中...</span>';
        }

        showLoading('正在封存角色...');
        try {
            const res = await fetch('/api/characters/custom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    name,
                    grade,
                    source,
                    stats,
                    skills,
                    forms,
                    source_basis: sourceBasis
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                this.showToast(gameToastMessages.characterCreated, 'success');
                // 清空表单
                this.clearExtract();
                // 跳转到角色卡库页面
                setTimeout(() => {
                    this.navigate('char-library');
                }, 600);
            } else {
                this.showToast(data.error || '保存失败', 'error');
            }
        } catch (err) {
            console.error('保存角色失败:', err);
            this.showToast(gameToastMessages.networkError, 'error');
        } finally {
            hideLoading();
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalHtml;
            }
        }
    },

    // 收集技能数据（内部方法）
    _collectSkills() {
        const skillGroups = document.querySelectorAll('#skills-editor-list .skill-editor-group');
        const skills = [];
        skillGroups.forEach((g, idx) => {
            const sName = g.querySelector('.skill-name-input').value.trim();
            const sType = g.querySelector('.skill-type-input').value;
            const sDesc = g.querySelector('.skill-desc-input').value.trim();
            const sMul = parseFloat(g.querySelector('.skill-multiplier-input').value);
            const sMp = parseFloat(g.querySelector('.skill-mpcost-input').value);
            if (!sName || !sDesc) {
                throw new Error(`技能 ${idx + 1} 名称或描述不能为空`);
            }
            if (isNaN(sMul) || sMul <= 0) {
                throw new Error(`技能 ${idx + 1} 倍数必须是正数`);
            }
            if (isNaN(sMp) || sMp < 0) {
                throw new Error(`技能 ${idx + 1} MP消耗必须是非负数`);
            }
            skills.push({
                name: sName,
                type: sType,
                desc: sDesc,
                multiplier: sMul,
                mp_cost: sMp
            });
        });
        return skills;
    },

    // 收集形态数据（内部方法）
    _collectForms() {
        const formGroups = document.querySelectorAll('#forms-editor-list .form-editor-group');
        const forms = [];
        formGroups.forEach((g, idx) => {
            const fName = g.querySelector('.form-name-input').value.trim();
            const fDesc = g.querySelector('.form-desc-input').value.trim();
            if (!fName || !fDesc) {
                throw new Error(`形态 ${idx + 1} 名称或描述不能为空`);
            }
            const bonuses = {};
            ['power', 'speed', 'intelligence', 'defense', 'special_ability'].forEach(k => {
                const v = parseFloat(g.querySelector('.form-bonus-' + k).value);
                bonuses[k] = isNaN(v) ? 0 : v;
            });
            forms.push({ name: fName, desc: fDesc, bonuses });
        });
        return forms;
    },

    // 战斗结束经验/升级/形态解锁提示
    notifyBattleExp(data) {
        if (!data) return;
        if (typeof data.exp_gained === 'number' && data.exp_gained > 0) {
            this.showToast(`获得 ${data.exp_gained} 经验`, 'success');
        }
        if (data.level_up === true) {
            const newLevel = data.new_level || '?';
            setTimeout(() => {
                this.showToast(`角色升级！当前等级 ${newLevel}`, 'success');
            }, 800);
        }
        if (data.form_unlocked === true) {
            setTimeout(() => {
                this.showToast('新形态已解锁！', 'success');
            }, data.level_up ? 1600 : 800);
        }
    }
};

// 全局函数
function clearUpload() {
    const textInput = document.getElementById('text-input');
    const fileInput = document.getElementById('file-input');
    const progressContainer = document.getElementById('progress-container');
    if (textInput) textInput.value = '';
    if (fileInput) fileInput.value = '';
    if (progressContainer) progressContainer.style.display = 'none';
}

function startUpload() {
    const text = document.getElementById('text-input').value.trim();
    if (!text) {
        App.showToast('请输入或上传典籍内容', 'error');
        return;
    }

    const progressContainer = document.getElementById('progress-container');
    if (progressContainer) progressContainer.style.display = 'block';
    
    let progress = 0;
    const progressFill = document.getElementById('progress-fill');
    const progressPercent = document.getElementById('progress-percent');
    
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                App.showToast(gameToastMessages.uploadSuccess, 'success');
                clearUpload();
            }, 500);
        }
        
        if (progressFill) progressFill.style.width = progress + '%';
        if (progressPercent) progressPercent.textContent = Math.round(progress) + '%';
    }, 300);
}

function startProofread() {
    App.showToast('开始校对，请稍候...', 'info');
    setTimeout(() => {
        App.showToast('校对完成，发现4处待处理项', 'success');
    }, 2000);
}

function addCharacter(type) {
    const types = {
        protagonist: '主角',
        antagonist: '妖怪',
        supporting: '配角'
    };
    App.showToast(`已添加${types[type]}角色设定`, 'success');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
