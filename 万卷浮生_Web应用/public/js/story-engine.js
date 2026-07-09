// story-engine.js - DAG 剧情养成引擎
// 「万卷浮生」Web应用 - 按策划案 v3 8.2节实现的剧情有向节点图
// 节点类型：story / skill_unlock / form_unlock / battle / ending
// 依赖：App, showLoading, hideLoading, escapeHtml, showGameToast, localStorage.token

const StoryEngine = {
    // ====== 内部状态 ======
    state: {
        sessionId: null,
        bookId: null,
        dagProgressId: null,
        novelId: null,
        novelTitle: null,
        currentNode: null,
        currentCharacter: null,
        statGrowth: {},         // 累计属性成长 {power:+10, speed:+5...}
        unlockedSkills: [],     // 已解锁技能
        unlockedForms: [],      // 已解锁形态
        visitedNodes: [],       // 已访问节点ID
        battleResults: [],      // 战斗结果
        status: 'active',       // active / completed
        endingNode: null,
        isProcessing: false,
        mode: 'dag'             // 'dag' 预置模式 | 'ai' AI 动态生成模式
    },

    // ====== 工具方法 ======
    _authHeaders(extra = {}) {
        const token = localStorage.getItem('token');
        return Object.assign({
            'Authorization': token ? ('Bearer ' + token) : '',
            'Content-Type': 'application/json'
        }, extra);
    },

    _requireAuth() {
        if (!localStorage.getItem('token')) {
            App.showToast('请先登录', 'error');
            return false;
        }
        return true;
    },

    _getContainers() {
        return {
            main: document.querySelector('#page-game .game-main'),
            sidebar: document.querySelector('#page-game .game-sidebar')
        };
    },

    // 显示兜底降级 Toast 提示（带控制台日志，便于诊断）
    _showFallbackToast(reason) {
        console.warn('[StoryEngine] AI 兜底降级:', reason);
        // 根据 errorType 给出针对性提示
        let userMsg = reason;
        if (reason && typeof reason === 'string') {
            if (reason.includes('auth') || reason.includes('API密钥') || reason.includes('未授权')) {
                userMsg = `${reason}。请前往 AI 设置检查 API Key`;
            } else if (reason.includes('not_found') || reason.includes('模型不存在') || reason.includes('接口地址')) {
                userMsg = `${reason}。请前往 AI 设置检查模型名和接口地址`;
            } else if (reason.includes('timeout') || reason.includes('超时')) {
                userMsg = `${reason}。请检查网络连接`;
            } else if (reason.includes('parse_error') || reason.includes('解析失败')) {
                userMsg = `${reason}。AI 返回格式异常，可重试或更换模型`;
            }
        }
        const msg = userMsg && userMsg.includes('AI')
            ? `${userMsg}，已切换原著剧情模式`
            : `AI 不可用，已切换原著剧情模式`;
        if (typeof showGameToast === 'function') {
            showGameToast(msg, 'info');
        } else if (App && App.showToast) {
            App.showToast(msg, 'info');
        }
    },

    // AI 模式失败后切换到预置 DAG 模式，重新拉取当前节点
    async _switchToDagMode() {
        this.state.mode = 'dag';
        // 兜底前再次确保 isProcessing 已重置（防止外层 try-finally 未结束时递归被拦截）
        this.state.isProcessing = false;
        // 后端将原 AI progress 的 mode 字段保留为 'ai'，但前端切换到 dag 端点
        // 由于 dag 端点需要 dag_progress_id 对应的预置 DAG，而 AI 模式的 progress 可能不在预置 DAG 中
        // 这里采用最简方案：重新调用 dag/start 启动一个预置 DAG 会话
        if (this.state.bookId) {
            const characterId = this.state.currentCharacter ? this.state.currentCharacter.id : null;
            // 清掉旧的 dagProgressId 避免串台
            this.state.dagProgressId = null;
            this.state.currentNode = null;
            await this._startDagMode(this.state.bookId, characterId);
        }
    },

    // 显式启动 DAG 模式（不递归 start 主流程，避免 isProcessing 状态依赖）
    async _startDagMode(bookId, characterId) {
        this.state.mode = 'dag';
        this.state.isProcessing = true;
        showLoading('正在翻开典籍...');
        try {
            const res = await fetch('/api/story/dag/start', {
                method: 'POST',
                headers: this._authHeaders(),
                body: JSON.stringify({ book_id: bookId, character_id: characterId || null })
            });
            const data = await res.json();

            if (!res.ok) {
                // 无预置 DAG 的典籍：提示用户检查 AI 配置
                if (data.error && data.error.includes('暂未为')) {
                    App.showToast(`${data.error}。请检查 AI 配置后重试。`, 'error');
                } else {
                    App.showToast(data.error || '开启剧情失败', 'error');
                }
                if (data.supported_dags && data.supported_dags.length > 0) {
                    setTimeout(() => {
                        App.showToast(`支持的典籍：${data.supported_dags.join('、')}`, 'info');
                    }, 2200);
                }
                return;
            }

            // 同步状态（与 start 主流程一致）
            this.state.sessionId = data.session_id;
            this.state.bookId = bookId;
            this.state.dagProgressId = data.dag_progress_id;
            this.state.novelId = data.novel_id;
            this.state.novelTitle = data.novel_title;
            this.state.currentNode = data.current_node;
            this.state.currentCharacter = data.character || null;
            this.state.statGrowth = data.stat_growth || {};
            this.state.unlockedSkills = data.unlocked_skills || [];
            this.state.unlockedForms = data.unlocked_forms || [];
            this.state.visitedNodes = data.visited_nodes || [];
            this.state.status = 'active';
            this.state.endingNode = null;
            this.state.mode = 'dag';

            App.navigate('game');
            this.state.isProcessing = false;
            this._renderSidebar();
            this._renderNode(data.current_node);
            App.showToast(`进入《${data.novel_title}》剧情`, 'success');
        } catch (err) {
            console.error('[StoryEngine] DAG 模式启动失败:', err);
            App.showToast('网络不通，请稍候', 'error');
        } finally {
            this.state.isProcessing = false;
            hideLoading();
        }
    },

    // 节点类型 → 中文标签
    _nodeTypeLabel(type) {
        const map = {
            story: '剧情',
            skill_unlock: '技能解锁',
            form_unlock: '形态解锁',
            battle: '战斗',
            ending: '结局'
        };
        return map[type] || '剧情';
    },

    // 节点类型 → CSS 类名
    _nodeTypeClass(type) {
        return `se-node-type-${type || 'story'}`;
    },

    // 注：DAG 剧情引擎样式已迁移到 layout.css

    // ====== 核心：开始 DAG 剧情 ======
    // 根据 state.mode 调用不同端点：'ai' 调 /api/story/ai/start，'dag' 调 /api/story/dag/start
    // 响应含 fallback_dag:true 时自动切回 dag 模式重试
    async start(bookId, characterId, options = {}) {
        if (!this._requireAuth()) return;
        if (this.state.isProcessing) return;
        if (!bookId) { App.showToast('请选择典籍', 'error'); return; }

        this.state.isProcessing = true;
        if (this.state.mode === 'ai' && window.AIProgress) AIProgress.show(); else showLoading('正在翻开典籍...');
        try {
            const endpoint = this.state.mode === 'ai' ? '/api/story/ai/start' : '/api/story/dag/start';
            const body = { book_id: bookId, character_id: characterId || null };
            // 仅 ai 模式透传开局方向
            if (this.state.mode === 'ai' && options.userDirection) {
                body.user_direction = options.userDirection;
            }
            const res = await this._fetchWithTimeout(endpoint, {
                method: 'POST',
                headers: this._authHeaders(),
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (!res.ok) {
                App.showToast(data.error || '开启剧情失败', 'error');
                if (data.supported_dags && data.supported_dags.length > 0) {
                    setTimeout(() => {
                        App.showToast(`支持的典籍：${data.supported_dags.join('、')}`, 'info');
                    }, 2200);
                }
                return;
            }

            // AI 模式失败兜底：切回 dag 模式重试
            if (data.fallback_dag) {
                this._showFallbackToast(data.reason || 'AI 不可用');
                this.state.isProcessing = false;
                if (window.AIProgress) AIProgress.complete(); else hideLoading();
                return await this._startDagMode(bookId, characterId);
            }

            // 同步状态
            this.state.sessionId = data.session_id;
            this.state.bookId = bookId;
            this.state.dagProgressId = data.dag_progress_id;
            this.state.novelId = data.novel_id;
            this.state.novelTitle = data.novel_title;
            this.state.currentNode = data.current_node;
            this.state.currentCharacter = data.character || null;
            this.state.statGrowth = data.stat_growth || {};
            this.state.unlockedSkills = data.unlocked_skills || [];
            this.state.unlockedForms = data.unlocked_forms || [];
            this.state.visitedNodes = data.visited_nodes || [];
            this.state.status = 'active';
            this.state.endingNode = null;
            this.state.preloaded = false; // 起点节点不来自预取
            if (data.mode) this.state.mode = data.mode;

            App.navigate('game');
            this.state.isProcessing = false;
            this._renderSidebar();
            this._renderNode(data.current_node);
            App.showToast(`进入《${data.novel_title}》剧情`, 'success');
        } catch (err) {
            console.error('开启剧情失败:', err);
            App.showToast('网络不通，请稍候', 'error');
        } finally {
            this.state.isProcessing = false;
            if (this.state.mode === 'ai' && window.AIProgress) AIProgress.complete(); else hideLoading();
        }
    },

    // ====== 加载已有会话 ======
    async loadSession(sessionId = null) {
        if (!this._requireAuth()) return;

        try {
            // 查最新 active 的 DAG/AI 会话
            const res = await fetch('/api/story/history', {
                headers: this._authHeaders()
            });
            const data = await res.json();
            if (!res.ok) {
                App.showToast(data.error || '加载会话失败', 'error');
                return;
            }

            const sessions = data.sessions || [];
            let target = null;
            if (sessionId) {
                // 指定 session_id 恢复：精确匹配
                target = sessions.find(s => String(s.id) === String(sessionId) && s.dag_progress_id);
                if (!target) {
                    App.showToast('存档不存在或无 DAG 进度', 'error');
                    return;
                }
            } else {
                // 默认：优先取 dag_mode='ai' 的 active 会话，其次 dag_mode='dag'
                const aiSession = sessions.find(s => s.dag_mode === 'ai' && s.dag_status === 'active' && s.dag_progress_id);
                const dagSession = sessions.find(s => (s.dag_mode || 'dag') === 'dag' && s.status === 'active' && s.dag_progress_id);
                target = aiSession || dagSession;
                if (!target) {
                    return; // 没有进行中的会话
                }
            }

            // 拉取 DAG 详情（同一端点同时支持 dag/ai 模式）
            const detailRes = await fetch(`/api/story/dag/session/${target.dag_progress_id}`, {
                headers: this._authHeaders()
            });
            const detail = await detailRes.json();
            if (!detailRes.ok) {
                App.showToast(detail.error || '加载剧情失败', 'error');
                return;
            }

            this.state.sessionId = detail.session_id;
            this.state.bookId = detail.book_id || target.book_id;
            this.state.dagProgressId = detail.dag_progress_id;
            this.state.novelId = detail.novel_id;
            this.state.novelTitle = detail.novel_title;
            this.state.currentNode = detail.current_node;
            this.state.currentCharacter = detail.character || null;
            this.state.statGrowth = detail.stat_growth || {};
            this.state.unlockedSkills = detail.unlocked_skills || [];
            this.state.unlockedForms = detail.unlocked_forms || [];
            this.state.visitedNodes = detail.visited_nodes || [];
            this.state.battleResults = detail.battle_results || [];
            this.state.status = detail.status || 'active';
            this.state.endingNode = detail.ending_node;
            this.state.mode = detail.mode || 'dag';

            App.navigate('game');
            this.state.isProcessing = false;
            this._renderSidebar();
            this._renderNode(detail.current_node);
        } catch (err) {
            console.error('加载会话失败:', err);
        }
    },

    // ====== 节点选择 ======
    async choose(choiceId, choiceObj, options = {}) {
        if (!this.state.dagProgressId) { App.showToast('无进行中的剧情', 'error'); return; }
        if (this.state.isProcessing) return;
        if (this.state.status !== 'active') {
            App.showToast('剧情已结束', 'info');
            return;
        }

        this.state.isProcessing = true;
        if (this.state.mode === 'ai' && window.AIProgress) AIProgress.show(); else showLoading('抉择中...');
        try {
            const endpoint = this.state.mode === 'ai' ? '/api/story/ai/choose' : '/api/story/dag/choose';
            const body = this.state.mode === 'ai'
                ? { dag_progress_id: this.state.dagProgressId, choice_id: choiceId, choice_text: (choiceObj && choiceObj.text) || '' }
                : { dag_progress_id: this.state.dagProgressId, choice_id: choiceId };
            // 仅 ai 模式透传关键转折输入
            if (this.state.mode === 'ai' && options.userTurning) {
                body.user_turning = options.userTurning;
            }
            const res = await this._fetchWithTimeout(endpoint, {
                method: 'POST',
                headers: this._authHeaders(),
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) {
                App.showToast(data.error || '选择失败', 'error');
                return;
            }

            // AI 模式失败兜底：切回 dag 模式重新拉取当前节点
            if (data.fallback_dag) {
                this._showFallbackToast(data.reason || 'AI 不可用');
                this.state.isProcessing = false;
                if (window.AIProgress) AIProgress.complete(); else hideLoading();
                // fallback 到 DAG 模式重新开始（AI 进度已废弃）
                return await this._startDagMode(this.state.bookId, this.state.currentCharacter ? this.state.currentCharacter.id : null);
            }

            // 同步状态（AI 模式返回 next_node，dag 模式返回 current_node）
            const nextNode = data.next_node || data.current_node;
            this.state.currentNode = nextNode;
            this.state.statGrowth = data.stat_growth || this.state.statGrowth;
            this.state.unlockedSkills = data.unlocked_skills || this.state.unlockedSkills;
            this.state.unlockedForms = data.unlocked_forms || this.state.unlockedForms;
            this.state.visitedNodes = data.visited_nodes || this.state.visitedNodes;
            this.state.status = data.status || 'active';
            this.state.endingNode = data.ending_node;
            this.state.preloaded = !!data.preloaded; // 预取命中标记，供 _renderNode 显示徽章

            this.state.isProcessing = false;
            this._renderSidebar();
            this._renderNode(nextNode, {
                unlockEvent: data.unlock_event,
                preloaded: !!data.preloaded
            });
        } catch (err) {
            console.error('节点选择失败:', err);
            App.showToast('网络不通，请稍候', 'error');
        } finally {
            this.state.isProcessing = false;
            if (this.state.mode === 'ai' && window.AIProgress) AIProgress.complete(); else hideLoading();
        }
    },

    // ====== 战斗节点：发起战斗 ======
    async battle() {
        if (!this.state.dagProgressId) { App.showToast('无进行中的剧情', 'error'); return; }
        if (this.state.isProcessing) return;
        if (!this.state.currentNode || this.state.currentNode.type !== 'battle') {
            App.showToast('当前节点不是战斗节点', 'error');
            return;
        }

        this.state.isProcessing = true;
        if (this.state.mode === 'ai' && window.AIProgress) AIProgress.show(); else showLoading('战斗推演中...');
        try {
            const endpoint = this.state.mode === 'ai' ? '/api/story/ai/battle' : '/api/story/dag/battle';
            const res = await this._fetchWithTimeout(endpoint, {
                method: 'POST',
                headers: this._authHeaders(),
                body: JSON.stringify({ dag_progress_id: this.state.dagProgressId })
            });
            const data = await res.json();
            if (!res.ok) {
                App.showToast(data.error || '战斗失败', 'error');
                return;
            }

            // AI 模式失败兜底（仅胜利后续生成失败时）：切回 dag 模式
            if (data.fallback_dag) {
                this._showFallbackToast(data.reason || 'AI 不可用');
                this.state.battleResults = data.battle_results || this.state.battleResults;
                this.state.isProcessing = false;
                if (window.AIProgress) AIProgress.complete(); else hideLoading();
                return await this._startDagMode(this.state.bookId, this.state.currentCharacter ? this.state.currentCharacter.id : null);
            }

            this.state.battleResults = data.battle_results || [];
            this.state.currentNode = data.next_node;
            this.state.visitedNodes = data.visited_nodes || [];
            this.state.status = data.status || 'active';
            this.state.endingNode = data.ending_node;
            this.state.statGrowth = data.stat_growth || this.state.statGrowth;

            this.state.isProcessing = false;
            this._renderSidebar();
            // 战斗结果粒子与音效
            if (window.AudioEngine && AudioEngine.enabled) {
                AudioEngine.play(data.victory ? 'victory' : 'defeat');
            }
            if (window.Particles && data.victory) {
                const rect = (this._getContainers().main || document.body).getBoundingClientRect();
                Particles.emit('spark', {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    count: 24
                });
            }
            this._renderNode(data.next_node, {
                battleResult: data.battle,
                battleVictory: data.victory,
                battleEnemy: data.enemy
            });
        } catch (err) {
            console.error('战斗请求失败:', err);
            App.showToast('网络不通，请稍候', 'error');
        } finally {
            this.state.isProcessing = false;
            if (this.state.mode === 'ai' && window.AIProgress) AIProgress.complete(); else hideLoading();
        }
    },

    // ====== 渲染节点详情 ======
    _renderNode(node, options = {}) {
        if (!node) return;
        const { main } = this._getContainers();
        if (!main) return;

        const nodeTypeLabel = this._nodeTypeLabel(node.type);
        const nodeTypeClass = this._nodeTypeClass(node.type);

        // 解锁事件横幅（来自上一次选择）
        let unlockBanner = '';
        if (options.unlockEvent) {
            const ev = options.unlockEvent;
            const icon = ev.type === 'skill' ? '🌟' : '✨';
            const label = ev.type === 'skill' ? '解锁技能' : '解锁形态';
            unlockBanner = `
                <div class="se-unlock-banner">
                    <span class="se-unlock-banner-icon">${icon}</span>
                    <div class="se-unlock-banner-text">
                        <div class="se-unlock-banner-title">${label}：${escapeHtml(ev.name)}</div>
                        <div class="se-unlock-banner-desc">已加入你的角色能力</div>
                    </div>
                </div>
            `;
        }

        // 战斗结果横幅（来自刚才的战斗）
        let battleResultHtml = '';
        if (options.battleResult) {
            const b = options.battleResult;
            const victory = options.battleVictory;
            const cls = victory ? 'victory' : 'defeat';
            const title = victory ? '⚔ 战胜！' : '⚔ 战败...';
            const enemy = options.battleEnemy || {};
            const logsHtml = (b.rounds || []).map(r =>
                (r.logs || []).map(l => `<div>${escapeHtml(l)}</div>`).join('')
            ).join('');
            battleResultHtml = `
                <div class="se-battle-result ${cls}">
                    <div class="se-battle-result-title">${title}</div>
                    <div style="text-align:center;font-size:13px;color:var(--text-muted);margin-bottom:10px;">
                        对手：${escapeHtml(enemy.name || '?')}（${enemy.grade || '?'}级）· 共 ${b.total_rounds || 0} 回合
                    </div>
                    <div class="se-battle-logs">${logsHtml}</div>
                </div>
            `;
        }

        // 节点类型特殊渲染
        let typeSpecificHtml = '';
        if (node.type === 'skill_unlock' && node.skill_unlocked) {
            const s = node.skill_unlocked;
            typeSpecificHtml = `
                <div class="se-unlock-banner" style="background:linear-gradient(135deg, rgba(212,165,116,0.18) 0%, rgba(245,240,230,0.6) 100%);">
                    <span class="se-unlock-banner-icon">🌟</span>
                    <div class="se-unlock-banner-text">
                        <div class="se-unlock-banner-title">本节点将解锁技能：${escapeHtml(s.name)}</div>
                        <div class="se-unlock-banner-desc">${escapeHtml(s.desc || '')} · 类型：${escapeHtml(s.type || '')} · 倍率：${s.multiplier || 0} · MP消耗：${s.mp_cost || 0}</div>
                    </div>
                </div>
            `;
        } else if (node.type === 'form_unlock' && node.form_unlocked) {
            const f = node.form_unlocked;
            const bonusText = f.bonuses ? Object.entries(f.bonuses).map(([k,v]) => `${k}+${v}`).join('、') : '';
            typeSpecificHtml = `
                <div class="se-unlock-banner" style="background:linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(245,240,230,0.6) 100%);">
                    <span class="se-unlock-banner-icon">✨</span>
                    <div class="se-unlock-banner-text">
                        <div class="se-unlock-banner-title">本节点将解锁形态：${escapeHtml(f.name)}</div>
                        <div class="se-unlock-banner-desc">${escapeHtml(f.desc || '')} · 加成：${escapeHtml(bonusText)}</div>
                    </div>
                </div>
            `;
        } else if (node.type === 'battle' && node.enemy) {
            const e = node.enemy;
            typeSpecificHtml = `
                <div class="se-unlock-banner" style="background:linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(245,240,230,0.6) 100%);border-left-color:#c23b22;">
                    <span class="se-unlock-banner-icon">⚔</span>
                    <div class="se-unlock-banner-text">
                        <div class="se-unlock-banner-title">敌人：${escapeHtml(e.name)}（${e.grade || '?'}级）</div>
                        <div class="se-unlock-banner-desc">出处：${escapeHtml(e.source || '')} · HP ${e.stats?.hp || '?'} · 力 ${e.stats?.power || '?'} · 智 ${e.stats?.intelligence || '?'}</div>
                    </div>
                </div>
            `;
        }

        // 关键转折节点判定（仅 ai 模式）：nodeIndex >= maxNodes-2 或 type === 'battle'
        // 转折输入仅对 story/skill_unlock/form_unlock 类型的关键节点生效（battle 用应战按钮，ending 无后续）
        const isKeyTurning = this.state.mode === 'ai'
            && node
            && ((typeof node.nodeIndex === 'number' && typeof node.maxNodes === 'number'
                && node.nodeIndex >= node.maxNodes - 2)
                || node.type === 'battle');
        const showTurningInput = isKeyTurning && node.type !== 'battle' && node.type !== 'ending';
        let turningInputHtml = '';
        if (showTurningInput) {
            turningInputHtml = `
                <div class="se-turning-input" style="margin:10px 0;padding:10px 12px;background:linear-gradient(135deg,rgba(194,59,34,0.08),rgba(245,240,230,0.5));border:1px solid rgba(194,59,34,0.3);border-radius:8px;">
                    <label style="display:flex;align-items:center;gap:6px;font-family:var(--font-family-brush);font-size:13px;color:#8b1a0e;letter-spacing:2px;margin-bottom:6px;cursor:pointer;">
                        <input type="checkbox" id="se-turning-enable" checked style="cursor:pointer;">
                        关键转折（可输入自定义走向）
                    </label>
                    <textarea id="se-turning-text" rows="2" placeholder="如：故意放走敌人 / 暗中投靠反派 / 触发隐藏血脉" style="width:100%;resize:vertical;font-size:13px;padding:6px 8px;border:1px solid #d4c5a0;border-radius:6px;background:rgba(255,255,255,0.6);color:#3a2e1f;box-sizing:border-box;"></textarea>
                </div>
            `;
        }

        // 选择按钮 / 战斗按钮 / 结局
        let actionHtml = '';
        if (node.type === 'ending') {
            // 结局节点
            const endingTypeClass = `se-ending-type-${node.ending_type || 'neutral'}`;
            const endingTypeLabel = { good: '圆满', neutral: '中立', bad: '悲剧' }[node.ending_type] || '结局';
            actionHtml = `
                <div class="se-ending-card">
                    <div class="se-ending-title">${escapeHtml(node.title)}</div>
                    <div class="se-ending-type ${endingTypeClass}">${endingTypeLabel}</div>
                    <div class="se-ending-desc">${escapeHtml(node.description || '')}</div>
                    <div class="se-ending-summary">
                        <strong>养成总结：</strong><br>
                        ${this._buildEndingSummary()}
                    </div>
                    <button class="se-abandon-btn" type="button" onclick="StoryEngine.abandon()">结束此段奇缘</button>
                </div>
            `;
        } else if (node.type === 'battle') {
            // 战斗节点
            actionHtml = `
                <button class="se-battle-btn" type="button" onclick="StoryEngine.battle()" ${this.state.isProcessing ? 'disabled' : ''}>
                    ⚔ 应战！
                </button>
            `;
        } else if (node.choices && node.choices.length > 0) {
            // 选择节点（用 data-choice-id + 事件委托，避免 onclick 内联 JSON 的转义问题）
            const choicesHtml = node.choices.map(c => {
                const effectTags = [];
                if (c.effects) {
                    for (const [k, v] of Object.entries(c.effects)) {
                        if (v > 0) effectTags.push(`<span class="se-choice-effect-tag">${k}+${v}</span>`);
                    }
                }
                if (c.unlocks) {
                    const [type] = (c.unlocks || '').split(':');
                    if (type === 'skill') effectTags.push(`<span class="se-choice-effect-tag skill">解锁技能</span>`);
                    if (type === 'form') effectTags.push(`<span class="se-choice-effect-tag form">解锁形态</span>`);
                }
                return `
                    <button class="se-choice-btn" type="button" data-choice-id="${escapeHtml(c.id || '')}" ${this.state.isProcessing ? 'disabled' : ''}>
                        ${escapeHtml(c.text)}
                        <span class="se-choice-effects">${effectTags.join('')}</span>
                    </button>
                `;
            }).join('');
            actionHtml = `${turningInputHtml}<div class="se-choices">${choicesHtml}</div>`;
        }

        // 预取命中徽章（ai 模式 + 响应标记 preloaded:true）
        const preloadBadge = (options.preloaded || this.state.preloaded)
            ? `<span class="se-preload-badge" style="background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;font-size:10px;padding:2px 8px;border-radius:8px;font-weight:600;letter-spacing:1px;margin-left:6px;display:inline-block;vertical-align:middle;">⚡ 预取命中</span>`
            : '';

        main.innerHTML = `
            <div class="se-node-card">
                <div class="se-node-meta">
                    <span class="se-node-type-badge ${nodeTypeClass}">${nodeTypeLabel}</span>
                    <span>${escapeHtml(this.state.novelTitle || '')}</span>${preloadBadge}
                </div>
                <h2 class="se-node-title">${escapeHtml(node.title)}</h2>
                <div class="se-node-chapter">${escapeHtml(node.chapter || '')}</div>
                ${typeSpecificHtml}
                <div class="se-node-desc">${escapeHtml(node.description || '')}</div>
                ${unlockBanner}
                ${battleResultHtml}
                ${actionHtml}
            </div>
        `;

        // 节点渲染后音效与粒子触发
        if (window.AudioEngine && AudioEngine.enabled) {
            if (node.type === 'skill_unlock' || node.type === 'form_unlock') {
                AudioEngine.play('unlock');
            } else if (node.type === 'battle') {
                AudioEngine.play('damage');
            } else if (node.type === 'ending') {
                AudioEngine.play(node.ending_type === 'good' ? 'victory' : 'defeat');
            }
        }
        if (window.Particles && (node.type === 'skill_unlock' || node.type === 'form_unlock')) {
            const rect = main.getBoundingClientRect();
            Particles.emit('gold', {
                x: rect.left + rect.width / 2,
                y: rect.top + 80,
                count: 16
            });
        }

        // 滚动到顶部
        main.scrollTop = 0;

        // 绑定选择按钮点击事件（事件委托，避免 onclick 内联 JSON 转义问题）
        main.querySelectorAll('.se-choice-btn[data-choice-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cid = e.currentTarget.dataset.choiceId;
                if (!cid) return;
                // 从当前节点的 choices 中查找对应 choice 对象
                const choiceObj = (this.state.currentNode && this.state.currentNode.choices)
                    ? this.state.currentNode.choices.find(c => c.id === cid) : null;
                // 读取关键转折输入（仅 ai 模式 + 勾选启用 + 非空文本）
                let userTurning = '';
                if (this.state.mode === 'ai') {
                    const enableEl = document.getElementById('se-turning-enable');
                    const textEl = document.getElementById('se-turning-text');
                    if (enableEl && enableEl.checked && textEl) {
                        userTurning = (textEl.value || '').trim();
                    }
                }
                this.choose(cid, choiceObj || { id: cid }, userTurning ? { userTurning } : {});
            });
        });
    },

    // 结局总结
    _buildEndingSummary() {
        const char = this.state.currentCharacter;
        const growth = this.state.statGrowth || {};
        const skills = this.state.unlockedSkills || [];
        const forms = this.state.unlockedForms || [];
        const battles = this.state.battleResults || [];

        let html = '';
        if (char) html += `角色：${escapeHtml(char.name)}（${char.grade}级）<br>`;
        if (Object.keys(growth).length > 0) {
            const growthText = Object.entries(growth).map(([k,v]) => `${k}+${v}`).join('、');
            html += `属性成长：${escapeHtml(growthText)}<br>`;
        }
        if (skills.length > 0) {
            html += `已解锁技能：${skills.map(s => escapeHtml(s.name)).join('、')}<br>`;
        }
        if (forms.length > 0) {
            html += `已解锁形态：${forms.map(f => escapeHtml(f.name)).join('、')}<br>`;
        }
        if (battles.length > 0) {
            const wins = battles.filter(b => b.winner === 1).length;
            html += `剧情战斗：${battles.length} 场，胜 ${wins} 场<br>`;
        }
        html += `访问节点：${this.state.visitedNodes.length} 个<br>`;
        return html || '暂无养成数据';
    },

    // 带超时的 fetch 封装：避免 AI 请求永久卡住导致 UI 锁死
    async _fetchWithTimeout(url, options = {}, timeoutMs = 60000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timeoutId);
            return res;
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                throw new Error('AI 请求超时（' + (timeoutMs / 1000) + '秒），请检查 AI 服务或网络连接');
            }
            throw err;
        }
    },

    // 数字滚动动画：从 0 滚动到 targetValue
    _animateNumber(el, targetValue, duration = 600) {
        if (!el) return;
        const start = 0;
        const startTime = performance.now();
        const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutCubic 缓动
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (targetValue - start) * eased);
            el.textContent = current;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = targetValue;
            }
        };
        requestAnimationFrame(step);
    },

    // ====== 侧边栏渲染 ======
    _renderSidebar() {
        const { sidebar } = this._getContainers();
        if (!sidebar) return;

        const char = this.state.currentCharacter;
        const growth = this.state.statGrowth || {};
        const skills = this.state.unlockedSkills || [];
        const forms = this.state.unlockedForms || [];

        // 角色卡片
        const charCard = char ? `
            <div class="se-sidebar-panel">
                <h3 class="se-sidebar-title">你的角色</h3>
                <div style="display:flex;align-items:center;gap:12px;margin-top:8px;">
                    <div style="width:52px;height:52px;border-radius:8px;overflow:hidden;background:${char.gradient || 'linear-gradient(135deg,#667eea,#764ba2)'};flex-shrink:0;display:flex;align-items:center;justify-content:center;">
                        ${char.image ? `<img src="${char.image}" alt="${escapeHtml(char.name)}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="font-size:22px;color:#fff;font-weight:600;">${escapeHtml(char.name ? char.name[0] : '?')}</span>`}
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:600;color:var(--text-primary);font-size:15px;">${escapeHtml(char.name || '未知')}</div>
                        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${char.grade || '?'}级 · ${escapeHtml(char.source || '')}</div>
                    </div>
                </div>
            </div>` : '';

        // 当前节点
        const node = this.state.currentNode;
        const nodeCard = node ? `
            <div class="se-sidebar-panel">
                <h3 class="se-sidebar-title">当前节点</h3>
                <div style="font-size:14px;font-weight:600;color:var(--text-primary);">${escapeHtml(node.title)}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">${escapeHtml(node.chapter || '')} · ${this._nodeTypeLabel(node.type)}</div>
                <div class="se-node-path">
                    ${this.state.visitedNodes.map(nid => {
                        const isCurrent = nid === node.id;
                        return `<span class="se-node-path-item ${isCurrent ? 'current' : ''}">${escapeHtml(nid)}</span>`;
                    }).join('')}
                </div>
            </div>` : '';

        // 属性成长
        const growthKeys = ['power', 'speed', 'intelligence', 'defense', 'special_ability'];
        const growthLabels = { power: '力量', speed: '速度', intelligence: '智力', defense: '防御', special_ability: '特殊' };
        const statCard = Object.keys(growth).length > 0 ? `
            <div class="se-sidebar-panel">
                <h3 class="se-sidebar-title">属性成长</h3>
                ${growthKeys.filter(k => growth[k]).map(k => `
                    <div class="se-stat-row">
                        <span class="se-stat-name">${growthLabels[k] || k}</span>
                        <span class="se-stat-value">+<span class="se-stat-num" data-target="${growth[k]}">0</span><span class="se-stat-growth">↑</span></span>
                    </div>
                `).join('')}
            </div>` : '';

        // 已解锁技能
        const skillsCard = skills.length > 0 ? `
            <div class="se-sidebar-panel">
                <h3 class="se-sidebar-title">已解锁技能（${skills.length}）</h3>
                ${skills.map(s => `
                    <div class="se-unlock-item se-unlock-item-skill">
                        <div style="flex:1;">
                            <div class="se-unlock-item-name">🌟 ${escapeHtml(s.name)}</div>
                            <div class="se-unlock-item-desc">${escapeHtml(s.desc || '')}</div>
                        </div>
                    </div>
                `).join('')}
            </div>` : '';

        // 已解锁形态
        const formsCard = forms.length > 0 ? `
            <div class="se-sidebar-panel">
                <h3 class="se-sidebar-title">已解锁形态（${forms.length}）</h3>
                ${forms.map(f => {
                    const bonusText = f.bonuses ? Object.entries(f.bonuses).map(([k,v]) => `${k}+${v}`).join('、') : '';
                    return `
                        <div class="se-unlock-item se-unlock-item-form">
                            <div style="flex:1;">
                                <div class="se-unlock-item-name">✨ ${escapeHtml(f.name)}</div>
                                <div class="se-unlock-item-desc">${escapeHtml(bonusText)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>` : '';

        // 操作
        const opsCard = `
            <div class="se-sidebar-panel">
                <h3 class="se-sidebar-title">操作</h3>
                <button class="se-abandon-btn" type="button" onclick="StoryEngine.abandon()">舍弃此段奇缘</button>
            </div>
        `;

        sidebar.innerHTML = charCard + nodeCard + statCard + skillsCard + formsCard + opsCard;

        // 触发数字滚动动画
        sidebar.querySelectorAll('.se-stat-num').forEach(el => {
            const target = parseInt(el.dataset.target, 10) || 0;
            if (target > 0) this._animateNumber(el, target);
        });
    },

    // ====== 舍弃会话 ======
    async abandon() {
        if (!this.state.dagProgressId) {
            App.showToast('无进行中的剧情', 'info');
            return;
        }
        if (!confirm('确定舍弃当前剧情进度？已解锁的技能/形态将丢失。')) return;

        try {
            await fetch('/api/story/abandon', {
                method: 'POST',
                headers: this._authHeaders(),
                body: JSON.stringify({ session_id: this.state.sessionId })
            });
            // 重置状态
            this.state = {
                sessionId: null, bookId: null, dagProgressId: null,
                novelId: null, novelTitle: null, currentNode: null,
                currentCharacter: null, statGrowth: {}, unlockedSkills: [],
                unlockedForms: [], visitedNodes: [], battleResults: [],
                status: 'active', endingNode: null, isProcessing: false
            };
            if (window.Particles) Particles.clear();
            App.navigate('library');
            App.showToast('已舍弃此段奇缘', 'info');
        } catch (err) {
            console.error('舍弃失败:', err);
            App.showToast('网络不通，请稍候', 'error');
        }
    }
};
