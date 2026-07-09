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

// 注：游戏化 Toast 与加载动画样式已迁移到 layout.css 和 loading.css

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
        currentPage: 'welcome',
        selectedCharId: null,
        allCharacters: [],
        myCharacters: [],
        online_users: [],
        extractedNames: [],
        aiConfigured: null,
        books: [],
        currentBook: null,
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
        this.bindBookEvents();
        Auth.init();
        Items.init();
        this._initGameSystems();

        // 检查登录状态
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            this.state.token = token;
            this.state.user = JSON.parse(user);
            this.onAuthSuccess(this.state.user);
        } else {
            // 未登录 → 显示介绍页
            this.showWelcomePage();
        }
    },

    // 初始化游戏化视觉/音效/粒子系统
    _initGameSystems() {
        // 1. 填充 SVG 图标
        document.querySelectorAll('[data-icon]').forEach(el => {
            const name = el.dataset.icon;
            if (window.Icons && Icons.has(name)) {
                el.innerHTML = Icons.render(name, { size: 20, className: 'icon' });
            }
        });

        // 2. 初始化音效引擎（默认静音，首次交互后激活 AudioContext）
        if (window.AudioEngine) AudioEngine.init();

        // 3. 初始化粒子系统
        if (window.Particles) Particles.init();

        // 4. 初始化藏经阁动态背景效果（灰尘粒子 + 烛光）
        if (window.Particles) Particles.initBackgroundEffects();

        // 5. 绑定音效开关按钮
        const audioToggle = document.getElementById('audio-toggle');
        if (audioToggle) {
            audioToggle.addEventListener('click', () => {
                if (!window.AudioEngine) return;
                const enabled = AudioEngine.setEnabled(!AudioEngine.enabled);
                audioToggle.classList.toggle('muted', !enabled);
                if (enabled) AudioEngine.play('click');
            });
            // 同步初始状态
            if (window.AudioEngine) {
                audioToggle.classList.toggle('muted', !AudioEngine.enabled);
            }
        }

        // 5. 全局按钮点击音效（事件委托）
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn, .nav-item, .book-card, .char-card')) {
                if (window.AudioEngine && AudioEngine.enabled) AudioEngine.play('click');
            }
        });
    },

    // 绑定书籍管理事件
    bindBookEvents() {
        const btnUpload = document.getElementById('btn-upload-book');
        if (btnUpload) btnUpload.addEventListener('click', () => this.showUploadModal());
        const btnRefresh = document.getElementById('btn-refresh-books');
        if (btnRefresh) btnRefresh.addEventListener('click', () => this.loadBooks());
        const btnCancelUpload = document.getElementById('btn-cancel-upload');
        if (btnCancelUpload) btnCancelUpload.addEventListener('click', () => this.hideUploadModal());
        const btnConfirmUpload = document.getElementById('btn-confirm-upload');
        if (btnConfirmUpload) btnConfirmUpload.addEventListener('click', () => this.submitUpload());

        // 角色卡选择模态框关闭按钮
        const btnCloseCharPicker = document.getElementById('btn-close-character-picker');
        if (btnCloseCharPicker) btnCloseCharPicker.addEventListener('click', () => this.closeCharacterPicker());

        // 文件选择自动填充
        const uploadFileZone = document.getElementById('upload-file-zone');
        const uploadFileInput = document.getElementById('upload-file-input');
        if (uploadFileZone && uploadFileInput) {
            uploadFileZone.addEventListener('click', () => uploadFileInput.click());
            uploadFileZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadFileZone.style.borderColor = 'var(--old-gold)';
            });
            uploadFileZone.addEventListener('dragleave', () => {
                uploadFileZone.style.borderColor = 'var(--border-paper)';
            });
            uploadFileZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadFileZone.style.borderColor = 'var(--border-paper)';
                const file = e.dataTransfer.files[0];
                if (file && file.name.match(/\.(txt|md)$/i)) {
                    this._readBookFile(file);
                } else {
                    this.showToast('请上传 .txt 或 .md 文件', 'error');
                }
            });
            uploadFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) this._readBookFile(file);
            });
        }
    },

    // 读取书籍文件
    _readBookFile(file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const contentEl = document.getElementById('upload-book-content');
            if (contentEl) contentEl.value = ev.target.result;
            const titleEl = document.getElementById('upload-book-title');
            if (titleEl && !titleEl.value) {
                titleEl.value = file.name.replace(/\.(txt|md)$/i, '');
            }
        };
        reader.readAsText(file, 'UTF-8');
    },

    // ====== 书籍管理方法 ======
    // 加载书籍列表
    async loadBooks() {
        const token = localStorage.getItem('token');
        if (!token) return;
        const grid = document.getElementById('library-grid');
        if (grid) {
            grid.innerHTML = Array(6).fill('<div class="skeleton-card"><div class="skeleton-line" style="height:24px;width:60%;"></div><div class="skeleton-line" style="height:14px;width:80%;"></div><div class="skeleton-line" style="height:14px;width:40%;"></div></div>').join('');
        }
        try {
            const res = await fetch('/api/books', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            this.state.books = data.books || [];
            this.renderBooks();
        } catch (err) {
            console.error('加载书籍失败:', err);
            this.showToast('典籍加载失败', 'error');
        }
    },

    // 渲染书籍卡片
    renderBooks() {
        const grid = document.getElementById('library-grid');
        if (!grid) return;
        if (!this.state.books || this.state.books.length === 0) {
            grid.innerHTML = '<div class="library-empty">暂无典籍，点击上方按钮导入本地书籍</div>';
            return;
        }
        grid.innerHTML = this.state.books.map(book => {
            const progress = book.progress || {};
            const progressPct = progress.total
                ? Math.round((progress.chapter / progress.total) * 100)
                : 0;
            const statusTag = progress.status === 'completed'
                ? '<span class="book-tag tag-completed">已通关</span>'
                : progress.status === 'active'
                    ? `<span class="book-tag tag-active">进度 ${progressPct}%</span>`
                    : '<span class="book-tag tag-new">未开始</span>';
            const sourceTag = book.source_type === 'upload'
                ? '<span class="book-tag tag-upload">自传</span>'
                : '<span class="book-tag tag-classic">名著</span>';
            const deleteBtn = book.source_type === 'upload'
                ? `<button class="book-delete-btn" data-book-id="${book.id}" title="删除">✕</button>`
                : '';
            const gradient = book.cover_gradient || '#667eea, #764ba2';
            const gradientCss = gradient.includes('→')
                ? gradient.replace(/\s*→\s*/g, ', ')
                : gradient;
            return `
                <div class="book-card" data-book-id="${book.id}"
                     style="background:linear-gradient(135deg, ${gradientCss});">
                    <div class="book-cover">
                        <div class="book-title-cn">${escapeHtml(book.title)}</div>
                        <div class="book-author-cn">${escapeHtml(book.author || '佚名')}</div>
                    </div>
                    <div class="book-info">
                        <p class="book-desc">${escapeHtml(book.description || '神秘的志怪典籍')}</p>
                        <div class="book-meta">
                            ${statusTag}
                            ${sourceTag}
                        </div>
                    </div>
                    ${deleteBtn}
                </div>
            `;
        }).join('');

        // 绑定点击事件
        grid.querySelectorAll('.book-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('book-delete-btn')) return;
                const bookId = parseInt(card.dataset.bookId);
                this.openBook(bookId);
            });
        });
        grid.querySelectorAll('.book-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteBook(parseInt(btn.dataset.bookId));
            });
        });
    },

    // 打开书籍 → 显示角色卡选择
    openBook(bookId) {
        const book = this.state.books.find(b => b.id === bookId);
        if (!book) return;
        this.state.currentBook = book;
        this.showCharacterPicker(bookId);
    },

    // 显示角色卡选择模态框（并行获取预置角色 + AI 提取角色）
    async showCharacterPicker(bookId) {
        const book = this.state.books.find(b => b.id === bookId);
        if (!book) return;

        const modal = document.getElementById('character-picker-modal');
        const grid = document.getElementById('character-picker-grid');
        const titleEl = document.getElementById('character-picker-title');
        const descEl = document.getElementById('character-picker-desc');

        if (titleEl) titleEl.textContent = `《${book.title}》— 选择你的角色`;
        if (descEl) descEl.textContent = '正在翻阅典籍，提炼角色...';

        // 注入"剧情方向"输入框（仅 AI 模式生效，未配置 AI 时隐藏）
        let dirWrap = document.getElementById('char-picker-direction-wrap');
        if (this.state.aiConfigured) {
            if (!dirWrap) {
                dirWrap = document.createElement('div');
                dirWrap.id = 'char-picker-direction-wrap';
                dirWrap.style.cssText = 'grid-column:1/-1;margin-bottom:8px;padding:10px 12px;background:linear-gradient(135deg,rgba(201,169,98,0.08),rgba(245,240,230,0.5));border:1px solid rgba(201,169,98,0.3);border-radius:8px;';
                dirWrap.innerHTML = `
                    <label for="char-picker-direction" style="display:block;font-family:var(--font-family-brush);font-size:13px;color:var(--old-gold-dark,#8b6f3a);letter-spacing:2px;margin-bottom:6px;">剧情方向（可选·仅 AI 模式生效）</label>
                    <textarea id="char-picker-direction" rows="2" placeholder="如：走复仇路线 / 让主角背叛师门 / 修炼邪道功法" style="width:100%;resize:vertical;font-size:13px;padding:6px 8px;border:1px solid var(--border,#d4c5a0);border-radius:6px;background:rgba(255,255,255,0.6);color:var(--text-primary,#3a2e1f);box-sizing:border-box;"></textarea>
                `;
                grid.parentNode.insertBefore(dirWrap, grid);
            } else {
                dirWrap.style.display = '';
            }
            // 清空旧值，避免上次残留
            const dirInput = document.getElementById('char-picker-direction');
            if (dirInput) dirInput.value = '';
        } else if (dirWrap) {
            dirWrap.style.display = 'none';
        }

        // 先展示加载占位
        grid.innerHTML = `
            <div class="char-picker-loading" style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--text-muted);">
                <div class="inline-loading"></div>
                <div style="margin-top:12px;font-size:14px;">正在提炼角色卡...</div>
            </div>`;
        if (modal) modal.style.display = 'flex';

        // 并行获取预置角色 + AI 提取角色
        const token = localStorage.getItem('token');
        const fetchPreset = async () => {
            try {
                const res = await fetch('/api/characters');
                const data = await res.json();
                return (data.characters || []).filter(c => c.source === book.title);
            } catch (e) {
                console.error('获取预置角色失败:', e);
                return [];
            }
        };
        const fetchAi = async () => {
            if (!this.state.aiConfigured) return []; // 未配置 AI 则跳过
            try {
                const res = await fetch('/api/story/ai/extract-characters', {
                    method: 'POST',
                    headers: {
                        'Authorization': token ? ('Bearer ' + token) : '',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ book_id: bookId })
                });
                const data = await res.json();
                if (data.fallback) return []; // AI 不可用静默降级
                return data.characters || [];
            } catch (e) {
                console.error('AI 提取角色失败:', e);
                return [];
            }
        };

        const [presetChars, aiChars] = await Promise.all([fetchPreset(), fetchAi()]);

        // 渲染角色卡：分两栏
        const total = presetChars.length + aiChars.length;
        if (descEl) descEl.textContent = total > 0
            ? `${book.author || '佚名'} · 共 ${total} 位角色可选${aiChars.length > 0 ? `（含 AI 提炼 ${aiChars.length} 位）` : ''}`
            : `${book.author || '佚名'} · 该典籍暂无可用角色`;

        const renderCharCard = (c, isAi = false) => {
            const aiBadge = isAi ? '<span class="char-picker-ai-badge" style="position:absolute;top:6px;right:6px;background:linear-gradient(135deg,#c23b22,#8b1a0e);color:#fff;font-size:10px;padding:2px 6px;border-radius:8px;font-weight:600;letter-spacing:1px;">AI</span>' : '';
            return `
                <div class="char-picker-card" data-char-id="${c.id || ''}" data-ai-char='${isAi ? escapeHtml(JSON.stringify(c)) : ""}' style="position:relative;">
                    <div class="char-picker-avatar" style="background:${c.gradient || 'linear-gradient(135deg,#667eea,#764ba2)'};">
                        ${c.image ? `<img src="${c.image}" alt="${escapeHtml(c.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><span style="display:none;font-size:28px;color:#fff;font-weight:600;align-items:center;justify-content:center;width:100%;height:100%;">${escapeHtml(c.name[0] || '?')}</span>` : `<span style="font-size:28px;color:#fff;font-weight:600;">${escapeHtml(c.name[0] || '?')}</span>`}
                    </div>
                    ${aiBadge}
                    <div class="char-picker-name">${escapeHtml(c.name)}</div>
                    <div class="char-picker-grade">${escapeHtml(c.grade || 'B')} 级</div>
                    <div class="char-picker-skills">${(c.skills || []).slice(0, 3).map(s => escapeHtml(s.name || '')).join(' · ') || '未解析技能'}</div>
                </div>`;
        };

        if (total === 0) {
            // 无任何角色时，提供"默认主角"选项
            grid.innerHTML = `
                <div class="char-picker-card char-picker-default" data-char-id="">
                    <div class="char-picker-avatar" style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);">
                        <span style="font-size:28px;color:#fff;font-weight:600;">书</span>
                    </div>
                    <div class="char-picker-name">默认主角</div>
                    <div class="char-picker-grade">自由视角</div>
                    <div class="char-picker-skills">以书中人物视角自由探索</div>
                </div>`;
        } else {
            // 分栏渲染：经典角色 + AI 提炼角色
            let html = '';
            if (presetChars.length > 0) {
                html += `<div class="char-picker-section" style="grid-column:1/-1;margin-bottom:4px;">
                    <div style="font-family:var(--font-family-brush);font-size:14px;color:var(--old-gold-dark,#8b6f3a);letter-spacing:2px;border-left:3px solid var(--old-gold,#c9a962);padding-left:8px;">经典角色 · ${presetChars.length}</div>
                </div>`;
                html += presetChars.map(c => renderCharCard(c, false)).join('');
            }
            if (aiChars.length > 0) {
                html += `<div class="char-picker-section" style="grid-column:1/-1;margin:8px 0 4px;">
                    <div style="font-family:var(--font-family-brush);font-size:14px;color:#991b1b;letter-spacing:2px;border-left:3px solid #c23b22;padding-left:8px;">AI 提炼角色 · ${aiChars.length}</div>
                </div>`;
                html += aiChars.map(c => renderCharCard(c, true)).join('');
            }
            grid.innerHTML = html;
        }

        // 绑定角色卡点击
        grid.querySelectorAll('.char-picker-card').forEach(card => {
            card.addEventListener('click', async () => {
                const charId = card.dataset.charId;
                const aiCharJson = card.dataset.aiChar;
                if (aiCharJson) {
                    // AI 提取角色卡：先入库再走 selectCharacter
                    try {
                        showLoading('正在收录角色...');
                        const aiChar = JSON.parse(aiCharJson);
                        const res = await fetch('/api/characters/custom', {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Bearer ' + token,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                name: aiChar.name,
                                grade: aiChar.grade,
                                source: book.title, // 标记为所属典籍，便于后续筛选
                                gradient: aiChar.gradient,
                                stats: aiChar.stats,
                                skills: aiChar.skills,
                                forms: aiChar.forms,
                                source_basis: aiChar.source_basis || `出自《${book.title}》`
                            })
                        });
                        const data = await res.json();
                        hideLoading();
                        if (!res.ok || !data.character_id) {
                            this.showToast(data.error || '角色收录失败', 'error');
                            return;
                        }
                        this.selectCharacter(bookId, data.character_id);
                    } catch (e) {
                        hideLoading();
                        console.error('AI 角色入库失败:', e);
                        this.showToast('角色收录失败: ' + e.message, 'error');
                    }
                } else {
                    this.selectCharacter(bookId, charId ? parseInt(charId) : null);
                }
            });
        });
    },

    // 选择角色后进入剧情（根据 AI 配置状态设置 StoryEngine 模式）
    selectCharacter(bookId, characterId) {
        const modal = document.getElementById('character-picker-modal');
        if (modal) modal.style.display = 'none';
        // 读取剧情方向输入（仅 ai 模式生效）
        let userDirection = '';
        const dirInput = document.getElementById('char-picker-direction');
        if (dirInput) userDirection = (dirInput.value || '').trim();
        // 清空输入，避免下次残留
        if (dirInput) dirInput.value = '';
        this.navigate('game');
        // 延迟调用以确保页面切换动画完成
        setTimeout(() => {
            if (typeof StoryEngine !== 'undefined') {
                // 根据用户 AI 配置状态选择模式
                StoryEngine.state.mode = this.state.aiConfigured ? 'ai' : 'dag';
                StoryEngine.start(bookId, characterId, { userDirection });
            }
        }, 600);
    },

    // 关闭角色卡选择
    closeCharacterPicker() {
        const modal = document.getElementById('character-picker-modal');
        if (modal) modal.style.display = 'none';
    },

    // 显示上传弹窗
    showUploadModal() {
        const modal = document.getElementById('upload-book-modal');
        if (modal) modal.style.display = 'flex';
    },

    // 隐藏上传弹窗
    hideUploadModal() {
        const modal = document.getElementById('upload-book-modal');
        if (modal) modal.style.display = 'none';
        const titleEl = document.getElementById('upload-book-title');
        const authorEl = document.getElementById('upload-book-author');
        const descEl = document.getElementById('upload-book-desc');
        const contentEl = document.getElementById('upload-book-content');
        if (titleEl) titleEl.value = '';
        if (authorEl) authorEl.value = '';
        if (descEl) descEl.value = '';
        if (contentEl) contentEl.value = '';
    },

    // 提交上传
    async submitUpload() {
        const title = (document.getElementById('upload-book-title').value || '').trim();
        const content = (document.getElementById('upload-book-content').value || '').trim();
        const author = (document.getElementById('upload-book-author').value || '').trim();
        const description = (document.getElementById('upload-book-desc').value || '').trim();

        if (!title) { this.showToast('请输入书名', 'error'); return; }
        if (!content || content.length < 100) { this.showToast('正文至少 100 字', 'error'); return; }

        try {
            showLoading('正在收录典籍...');
            const token = localStorage.getItem('token');
            const res = await fetch('/api/books/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ title, content, author, description })
            });
            const data = await res.json();
            if (data.success) {
                this.showToast('典籍已收录', 'success');
                this.hideUploadModal();
                this.loadBooks();
            } else {
                this.showToast(data.error || '收录失败', 'error');
            }
        } catch (err) {
            this.showToast('网络错误', 'error');
        } finally {
            hideLoading();
        }
    },

    // 删除书籍
    async deleteBook(bookId) {
        if (!confirm('确认删除这本书？相关剧情进度也将清除。')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/books/${bookId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (data.success) {
                this.showToast('已删除', 'success');
                this.loadBooks();
            } else {
                this.showToast(data.error || '删除失败', 'error');
            }
        } catch (err) {
            this.showToast('网络错误', 'error');
        }
    },

    // 显示介绍页
    showWelcomePage() {
        const welcomePage = document.getElementById('page-welcome');
        const authPage = document.getElementById('page-auth');
        const mainLayout = document.getElementById('main-layout');
        if (welcomePage) { welcomePage.style.display = 'block'; welcomePage.classList.add('active'); }
        if (authPage) { authPage.style.display = 'none'; authPage.classList.remove('active'); }
        if (mainLayout) mainLayout.style.display = 'none';
    },

    // 显示登录页
    showAuthPage() {
        const welcomePage = document.getElementById('page-welcome');
        const authPage = document.getElementById('page-auth');
        if (welcomePage) { welcomePage.style.display = 'none'; welcomePage.classList.remove('active'); }
        if (authPage) { authPage.style.display = 'block'; authPage.classList.add('active'); }
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

        // 侧边栏折叠按钮
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                const icon = sidebarToggle.querySelector('span');
                if (icon) {
                    icon.textContent = sidebar.classList.contains('collapsed') ? '‹' : '›';
                }
                if (mainContent) {
                    mainContent.classList.toggle('sidebar-collapsed');
                }
                if (window.AudioEngine) AudioEngine.play('click');
            });
        }

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
                e.stopPropagation();
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
        const welcomePage = document.getElementById('page-welcome');
        const authPage = document.getElementById('page-auth');
        const mainLayout = document.getElementById('main-layout');
        if (welcomePage) welcomePage.style.display = 'none';
        if (authPage) authPage.style.display = 'none';
        if (mainLayout) mainLayout.style.display = 'flex';

        this.updateUserInfo(user);
        this.connectWebSocket();
        this.loadMyCharacters();   // 预加载角色列表供对战门控使用
        this.navigate('library');
        // 异步检查API配置
        this.checkAiConfig();
    },

    // 加载当前用户的角色列表（用于对战门控判断）
    async loadMyCharacters() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/me/characters', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!res.ok) return;
            const data = await res.json();
            this.state.myCharacters = data.characters || [];
        } catch (err) {
            console.error('加载我的角色失败:', err);
            this.state.myCharacters = [];
        }
    },

    // 检查AI配置
    async checkAiConfig() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/ai/config', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            const userConfig = data.user_config;
            this.state.aiConfigured = !!(userConfig && userConfig.has_api_key);
            if (!this.state.aiConfigured) {
                this.showToast('请先配置AI服务才能开始游戏', 'warning');
                setTimeout(() => this.navigate('ai-settings'), 500);
            }
        } catch (err) {
            console.error('检查AI配置失败:', err);
        }
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
        this.showWelcomePage();
    },

    // 页面导航
    navigate(page) {
        const targetPage = document.getElementById('page-' + page);
        if (!targetPage) return;

        // API门控：需要AI配置的页面
        const aiRequiredPages = ['library', 'game', 'lobby'];
        if (aiRequiredPages.includes(page) && this.state.aiConfigured === false) {
            this.showToast('请先配置AI服务', 'warning');
            this.navigate('ai-settings');
            return;
        }

        // 角色门控：对战类页面需要至少拥有一个角色
        const charRequiredPages = ['lobby', 'battles'];
        if (charRequiredPages.includes(page) && (!this.state.myCharacters || this.state.myCharacters.length === 0)) {
            this.showToast('需先在剧情中获得至少一名角色才能对战', 'warning');
            setTimeout(() => this.navigate('library'), 800);
            return;
        }

        this.state.currentPage = page;

        // 触发翻页音效与金粒子
        if (window.AudioEngine && AudioEngine.enabled) AudioEngine.play('scroll');
        if (window.Particles) {
            Particles.emit('gold', { x: window.innerWidth / 2, y: window.innerHeight / 2, count: 12 });
        }

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

        // 旧页面翻页淡出（0.4s）
        currentPage.classList.add('page-flip-exit');

        // 400ms 后切换页面显示
        setTimeout(() => {
            this._doPageSwitch(page, targetPage);

            // 新页面翻页进入（0.5s）
            targetPage.classList.add('page-flip-enter');

            // 500ms 后解锁导航并切换场景主题
            setTimeout(() => {
                targetPage.classList.remove('page-flip-enter');
                currentPage.classList.remove('page-flip-exit');
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
        } else if (page === 'characters' || page === 'char-library' || page === 'create' || page === 'items') {
            body.classList.add('scene-char');
        } else if (page === 'lobby') {
            body.classList.add('scene-lobby');
        }
    },
    
    // 页面进入时的初始化
    async onPageEnter(page) {
        switch (page) {
            case 'library': {
                await this.loadBooks();
                break;
            }
            case 'game': {
                // 若非从 openBook 触发（如直接侧边栏点击），尝试恢复进行中的会话
                if (typeof StoryEngine !== 'undefined' && !StoryEngine.state.isProcessing && !StoryEngine.state.sessionId) {
                    StoryEngine.loadSession();
                }
                break;
            }
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
            case 'items': {
                showLoading('正在开启宝阁...');
                try {
                    if (typeof Items !== 'undefined') {
                        await Items.loadAll();
                        Items.render();
                    }
                } finally {
                    hideLoading();
                }
                break;
            }
            case 'lobby': {
                // 双重保险：navigate() 已拦截，此处再校验防止状态过期
                if (!this.state.myCharacters || this.state.myCharacters.length === 0) {
                    if (typeof Lobby !== 'undefined' && typeof Lobby.showEmptyGuide === 'function') {
                        Lobby.showEmptyGuide();
                    }
                    break;
                }
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
            case 'saves': {
                await this.loadSaves();
                break;
            }
            case 'ai-settings': {
                if (typeof AIConfig !== 'undefined') {
                    await AIConfig.init();
                    this.renderProvidersList();
                }
                break;
            }
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

    // ====== 存档管理 ======
    async loadSaves() {
        const token = localStorage.getItem('token');
        if (!token) return;
        const grid = document.getElementById('saves-grid');
        if (!grid) return;

        // 骨架屏
        grid.innerHTML = Array(4).fill('<div class="skeleton-card"><div class="skeleton-line" style="height:20px;width:70%;"></div><div class="skeleton-line" style="height:14px;width:50%;"></div></div>').join('');

        try {
            const res = await fetch('/api/story/history', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            const sessions = data.sessions || [];
            if (sessions.length === 0) {
                grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);font-family:var(--font-family-serif);">📜 尚无存档记录<br><span style="font-size:13px;">前往「典籍」开启你的志怪旅程</span></div>';
                return;
            }
            grid.innerHTML = sessions.map(s => this._renderSaveCard(s)).join('');
            // 绑定删除按钮事件
            grid.querySelectorAll('.save-btn.delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const card = e.currentTarget.closest('.save-card');
                    const sid = card && card.dataset.sessionId;
                    if (sid) this.deleteSave(sid, card);
                });
            });
            // 绑定读取按钮事件
            grid.querySelectorAll('.save-btn.load').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const card = e.currentTarget.closest('.save-card');
                    const sid = card && card.dataset.sessionId;
                    if (sid) this.loadSave(sid);
                });
            });
        } catch (err) {
            console.error('加载存档失败:', err);
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">加载存档失败</div>';
        }
    },

    // 渲染单张存档卡片
    _renderSaveCard(s) {
        const statusMap = {
            active: { text: '进行中', cls: 'badge-manual' },
            completed: { text: '已完成', cls: 'badge-auto' },
            abandoned: { text: '已放弃', cls: 'badge-auto' }
        };
        const st = statusMap[s.status] || { text: s.status || '未知', cls: 'badge-auto' };
        const modeText = s.dag_mode === 'ai' ? 'AI 剧情' : '原著剧情';
        const updatedAt = s.updated_at ? new Date(s.updated_at).toLocaleString('zh-CN') : '';
        const createdAt = s.created_at ? new Date(s.created_at).toLocaleString('zh-CN') : '';
        const isActive = s.status === 'active';
        const novelTitle = s.dag_novel_id || s.book_title || '未知典籍';
        const preview = isActive
            ? `第 ${s.chapter_index || 1} 章 · ${modeText}`
            : (s.status === 'completed' ? `已完成《${escapeHtml(novelTitle)}》` : `已放弃《${escapeHtml(novelTitle)}》`);

        return `
            <div class="save-card ${isActive ? 'active' : ''}" data-session-id="${s.id}">
                <div class="save-header">
                    <h3 class="save-name">${escapeHtml(novelTitle)}</h3>
                    <span class="save-badge ${st.cls}">${st.text}</span>
                </div>
                <div class="save-meta">
                    <span>🕐 ${escapeHtml(updatedAt)}</span>
                    <span>📖 ${modeText}</span>
                </div>
                <div class="save-preview">${preview}</div>
                <div class="save-actions">
                    <button class="save-btn load" ${isActive ? '' : 'disabled'}>读取</button>
                    <button class="save-btn delete">删除</button>
                </div>
            </div>
        `;
    },

    // 删除存档
    async deleteSave(sessionId, cardEl) {
        if (!confirm('确认删除此存档？删除后无法恢复。')) return;
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`/api/story/saves/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (cardEl) {
                    cardEl.style.transition = 'opacity 0.3s, transform 0.3s';
                    cardEl.style.opacity = '0';
                    cardEl.style.transform = 'translateX(20px)';
                    setTimeout(() => cardEl.remove(), 300);
                }
                this.showToast('存档已删除', 'success');
            } else {
                this.showToast(data.error || '删除失败', 'error');
            }
        } catch (err) {
            console.error('删除存档失败:', err);
            this.showToast('网络错误，删除失败', 'error');
        }
    },

    // 读取存档（恢复进行中的会话）
    async loadSave(sessionId) {
        if (typeof StoryEngine === 'undefined') {
            this.showToast('剧情引擎未加载', 'error');
            return;
        }
        // 直接走 StoryEngine 的会话恢复流程
        if (typeof StoryEngine.loadSession === 'function') {
            await StoryEngine.loadSession(sessionId);
        } else {
            this.showToast('暂不支持恢复此存档', 'info');
        }
    },

    // 显示Toast提示（委托给游戏化 Toast，同时兼容旧 #toast 元素）
    showToast(message, type = 'info') {
        // 触发音效
        if (window.AudioEngine && AudioEngine.enabled) {
            AudioEngine.play(type === 'error' ? 'damage' : 'stamp');
        }
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

    // 渲染服务商列表
    renderProvidersList() {
        const listEl = document.getElementById('ai-providers-list');
        if (!listEl || !AIConfig.providers?.length) return;

        listEl.innerHTML = AIConfig.providers.map(p => `
            <div class="ai-provider-item">
                <div class="ai-provider-name">${escapeHtml(p.name)}</div>
                <div class="ai-provider-meta">
                    <span class="ai-provider-badge">${p.model_count}个模型</span>
                    <span>${p.features?.join(' · ') || ''}</span>
                </div>
            </div>
        `).join('');
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

        if (window.AIProgress) AIProgress.show(); else showLoading('正在解析典籍...');
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
            if (window.AIProgress) AIProgress.complete(); else hideLoading();
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

    // AI智能生成角色
    async aiGenerateCharacter() {
        const token = localStorage.getItem('token');
        if (!token) {
            this.showToast('请先登录', 'error');
            return;
        }

        const nameInput = document.getElementById('extract-char-name');
        const textInput = document.getElementById('text-input');
        const characterName = nameInput ? nameInput.value.trim() : '';
        const text = textInput ? textInput.value.trim() : '';

        if (!characterName) {
            this.showToast('请先输入角色名', 'error');
            return;
        }
        if (!text || text.length < 100) {
            this.showToast('文本内容太少，请先输入至少100字的小说文本', 'error');
            return;
        }

        const btn = document.getElementById('ai-gen-char-btn');
        const originalHtml = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span>生成中...</span>';
        }

        if (window.AIProgress) AIProgress.show(); else showLoading('AI正在分析角色...');
        try {
            if (typeof AIConfig === 'undefined' || !AIConfig.userConfig?.has_api_key) {
                this.showToast('请先在「AI设置」中配置API Key', 'error');
                this.navigate('ai-settings');
                return;
            }

            const character = await AIConfig.extractCharacterWithAI(text, characterName);
            this.fillCharacterEditor(character);
            this.showToast('角色数据生成成功！', 'success');
        } catch (err) {
            console.error('AI生成角色失败:', err);
            this.showToast(err.message || '生成失败，请重试', 'error');
        } finally {
            if (window.AIProgress) AIProgress.complete(); else hideLoading();
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        }
    },

    // 填充角色编辑器
    fillCharacterEditor(character) {
        const nameInput = document.getElementById('extract-char-name');
        const sourceInput = document.getElementById('extract-char-source');
        const gradeSelect = document.getElementById('extract-char-grade');
        const basisInput = document.getElementById('extract-char-basis');

        if (nameInput && character.name) nameInput.value = character.name;
        if (sourceInput && character.source) sourceInput.value = character.source;
        if (gradeSelect && character.grade) gradeSelect.value = character.grade;
        if (basisInput && character.source_basis) basisInput.value = character.source_basis;

        if (character.grade) {
            this.onGradeChange();
        }

        if (character.stats) {
            const dims = ['power', 'speed', 'intelligence', 'defense', 'special_ability', 'hp', 'mp'];
            dims.forEach(dim => {
                const slider = document.getElementById('slider-' + dim);
                const valEl = document.getElementById('slider-' + dim + '-val');
                if (slider && character.stats[dim] !== undefined) {
                    const val = Math.round(character.stats[dim] / 100);
                    slider.value = Math.max(20, Math.min(100, val));
                    if (valEl) valEl.textContent = slider.value;
                }
            });
        }

        if (character.skills && character.skills.length > 0) {
            const skillsList = document.getElementById('skills-editor-list');
            if (skillsList) {
                const skillTypeMap = {
                    'attack': 'physical_attack',
                    'magic_attack': 'magic_attack',
                    'buff': 'physical_attack',
                    'debuff': 'magic_attack',
                    'heal': 'heal',
                    'special': 'summon'
                };
                skillsList.innerHTML = character.skills.slice(0, 5).map((skill, idx) => `
                    <div class="skill-editor-group">
                        <div class="skill-editor-group-title">技能 ${idx + 1}</div>
                        <div class="skill-editor-row">
                            <input type="text" class="skill-name-input" placeholder="技能名称" value="${escapeHtml(skill.name || '')}">
                            <select class="skill-type-input">
                                <option value="physical_attack" ${skill.type === 'attack' ? 'selected' : ''}>物理攻击</option>
                                <option value="magic_attack" ${skill.type === 'magic_attack' || skill.type === 'debuff' ? 'selected' : ''}>法术攻击</option>
                                <option value="speed_attack">速度攻击</option>
                                <option value="transform">变化</option>
                                <option value="heal" ${skill.type === 'heal' || skill.type === 'buff' ? 'selected' : ''}>回血</option>
                                <option value="passive">被动</option>
                                <option value="summon" ${skill.type === 'special' ? 'selected' : ''}>召唤</option>
                            </select>
                            <input type="number" class="skill-multiplier-input" placeholder="倍数" min="0.1" step="0.1" value="${skill.multiplier || 1.2}">
                            <input type="number" class="skill-mpcost-input" placeholder="MP消耗" min="0" step="1" value="${skill.mp_cost || 10}">
                        </div>
                        <input type="text" class="skill-desc-input" placeholder="技能描述" value="${escapeHtml(skill.desc || '')}">
                    </div>
                `).join('');
            }
        }

        if (character.forms && character.forms.length > 0) {
            const formsList = document.getElementById('forms-editor-list');
            if (formsList) {
                formsList.innerHTML = character.forms.slice(0, 3).map((form, idx) => `
                    <div class="form-editor-group">
                        <div class="form-editor-group-title">形态 ${idx + 1}</div>
                        <div class="form-editor-row">
                            <input type="text" class="form-name-input" placeholder="形态名称" value="${escapeHtml(form.name || '')}">
                            <input type="text" class="form-desc-input" placeholder="形态描述" value="${escapeHtml(form.desc || '')}">
                        </div>
                        <div class="form-bonuses-row">
                            <div class="form-bonus-field">
                                <label>力量加成</label>
                                <input type="number" class="form-bonus-power" min="-50" max="50" step="1" value="${Math.round((form.bonuses?.power || 0) * 100)}">
                            </div>
                            <div class="form-bonus-field">
                                <label>速度加成</label>
                                <input type="number" class="form-bonus-speed" min="-50" max="50" step="1" value="${Math.round((form.bonuses?.speed || 0) * 100)}">
                            </div>
                            <div class="form-bonus-field">
                                <label>智力加成</label>
                                <input type="number" class="form-bonus-intelligence" min="-50" max="50" step="1" value="${Math.round((form.bonuses?.intelligence || 0) * 100)}">
                            </div>
                            <div class="form-bonus-field">
                                <label>防御加成</label>
                                <input type="number" class="form-bonus-defense" min="-50" max="50" step="1" value="${Math.round((form.bonuses?.defense || 0) * 100)}">
                            </div>
                            <div class="form-bonus-field">
                                <label>特殊加成</label>
                                <input type="number" class="form-bonus-special_ability" min="-50" max="50" step="1" value="${Math.round((form.bonuses?.special_ability || 0) * 100)}">
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
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
