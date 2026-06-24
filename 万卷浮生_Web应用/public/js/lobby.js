// lobby.js - 大厅逻辑（在线玩家/匹配）
const Lobby = {
    selectedCharId: null,
    selectedFormIndex: 0,
    isMatching: false,
    _formGrowthCache: {},

    // 进入大厅
    async enterLobby() {
        await this.renderPlayerInfo();
        await this.renderMatchSection();
        await this.renderLeaderboard();
        await this.renderOnlineUsers();
    },

    // 渲染玩家信息
    async renderPlayerInfo() {
        const user = App.state.user;
        if (!user) return;
        const wins = user.wins || 0;
        const losses = user.losses || 0;
        const total = wins + losses;
        const winRate = total > 0 ? Math.round(wins / total * 100) : 0;
        const content = document.getElementById('player-info-content');
        content.innerHTML = `
            <div class="player-info">
                <div class="player-avatar">${escapeHtml(user.avatar || '🎮')}</div>
                <div class="player-meta">
                    <div class="nickname">${escapeHtml(user.nickname || user.username)}</div>
                    <div class="username">@${escapeHtml(user.username)}</div>
                </div>
            </div>
            <div class="player-stats">
                <div class="stat-box"><div class="label">胜场</div><div class="value" style="color:#22c55e;">${wins}</div></div>
                <div class="stat-box"><div class="label">败场</div><div class="value" style="color:#f5576c;">${losses}</div></div>
                <div class="stat-box"><div class="label">胜率</div><div class="value">${winRate}%</div></div>
            </div>
        `;
    },

    // 渲染匹配对战区
    async renderMatchSection() {
        const content = document.getElementById('match-content');
        if (!App.state.allCharacters.length) {
            await Characters.loadAll();
            App.state.allCharacters = Characters.allCharacters;
        }
        const chars = App.state.allCharacters;
        if (this.isMatching) {
            content.innerHTML = `
                <div class="match-status matching">
                    <div class="matching-animation">🔍 匹配中...</div>
                    <p style="margin-top:8px;color:var(--text-secondary);font-size:13px;">正在为您寻找对手</p>
                    <button class="btn btn-ghost" style="margin-top:12px;" onclick="Lobby.cancelMatchmaking()">取消匹配</button>
                </div>
            `;
            return;
        }
        content.innerHTML = `
            <div class="match-section">
                <div class="select-label">选择你的出战角色</div>
                <div class="char-select-grid" id="char-select-grid">
                    ${chars.map(c => `
                        <div class="char-select-item ${this.selectedCharId === c.id ? 'selected' : ''}" onclick="Lobby.selectCharacter(${c.id})">
                            <div class="mini-portrait" style="background:${c.gradient}">${c.name[0]}</div>
                            <div class="name">${c.name}</div>
                            <div class="grade">${c.grade}级</div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-primary" style="width:100%;" onclick="Lobby.startMatchmaking()" ${!this.selectedCharId ? 'disabled' : ''}>
                    ${this.selectedCharId ? '⚔️ 开始匹配' : '请先选择角色'}
                </button>
            </div>
        `;
    },

    // 选择角色
    selectCharacter(id) {
        this.selectedCharId = id;
        App.state.selectedCharId = id;
        // 重置形态选择，等待新的形态选择流程
        this.selectedFormIndex = 0;
        this.renderMatchSection();
        // 异步检查是否需要形态选择
        this.showFormSelection(id);
    },

    // 显示形态选择弹窗（如果角色有多个已解锁形态）
    async showFormSelection(characterId) {
        const token = localStorage.getItem('token');
        if (!token) return; // 未登录则跳过
        let growth = this._formGrowthCache[characterId];
        if (!growth) {
            try {
                const res = await fetch(`/api/me/characters/${characterId}/growth`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (!res.ok) return;
                growth = await res.json();
                this._formGrowthCache[characterId] = growth;
            } catch (err) {
                console.error('获取形态信息失败:', err);
                return;
            }
        }
        if (!growth || !growth.all_forms) return;
        // 仅展示已解锁形态
        const unlockedForms = growth.all_forms
            .map((f, idx) => ({ ...f, _idx: idx }))
            .filter(f => f.unlocked);
        // 只有一个或没有已解锁形态时跳过选择
        if (unlockedForms.length <= 1) return;
        this._renderFormSelectionModal(unlockedForms);
    },

    // 渲染形态选择弹窗
    _renderFormSelectionModal(unlockedForms) {
        // 移除已有弹窗
        this.closeFormSelection();
        const statNameMap = { power: '力量', speed: '速度', intelligence: '智力', defense: '防御', special_ability: '特殊', hp: 'HP', mp: 'MP' };
        const modal = document.createElement('div');
        modal.id = 'form-selection-modal';
        modal.className = 'form-selection-modal';
        modal.innerHTML = `
            <div class="form-selection-header">
                <div class="form-selection-title">🔄 选择出战形态</div>
                <div class="form-selection-subtitle">为你的角色选择一个形态以获得不同属性加成</div>
            </div>
            <div class="form-card-list">
                ${unlockedForms.map((f, i) => {
                    const bonusText = !f.bonuses || Object.keys(f.bonuses).length === 0
                        ? '<span class="form-bonus-preview">基础属性</span>'
                        : '<span class="form-bonus-preview">' + Object.entries(f.bonuses).map(([k, v]) => {
                            const name = statNameMap[k] || k;
                            return `<span class="form-bonus-tag ${v >= 0 ? 'pos' : 'neg'}">${name}${v >= 0 ? '+' : ''}${v}</span>`;
                        }).join('') + '</span>';
                    return `
                        <div class="form-card ${i === 0 ? 'selected' : ''}" data-form-index="${f._idx}" onclick="Lobby._onFormCardClick(${f._idx})">
                            <div class="form-card-head">
                                <span class="form-card-name">${escapeHtml(f.name)}</span>
                                <span class="form-card-radio"></span>
                            </div>
                            <div class="form-card-desc">${escapeHtml(f.desc || '')}</div>
                            <div class="form-card-bonuses">${bonusText}</div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="form-selection-actions">
                <button class="btn btn-ghost" onclick="Lobby.closeFormSelection()">取消</button>
                <button class="btn btn-primary" onclick="Lobby.selectForm()">确认</button>
            </div>
        `;
        document.body.appendChild(modal);
        // 默认选中第一个形态
        this._pendingFormIndex = unlockedForms[0]._idx;
    },

    // 形态卡片点击
    _onFormCardClick(formIndex) {
        this._pendingFormIndex = formIndex;
        document.querySelectorAll('#form-selection-modal .form-card').forEach(card => {
            card.classList.toggle('selected', parseInt(card.dataset.formIndex) === formIndex);
        });
    },

    // 确认形态选择
    selectForm() {
        if (this._pendingFormIndex !== undefined && this._pendingFormIndex !== null) {
            this.selectedFormIndex = this._pendingFormIndex;
        }
        this._pendingFormIndex = null;
        this.closeFormSelection();
        App.showToast(`已选择形态（索引 ${this.selectedFormIndex}）`, 'success');
        // 刷新匹配区以显示当前形态
        this.renderMatchSection();
    },

    // 关闭形态选择弹窗
    closeFormSelection() {
        const modal = document.getElementById('form-selection-modal');
        if (modal) modal.remove();
        this._pendingFormIndex = null;
    },

    // 开始匹配
    startMatchmaking() {
        if (!this.selectedCharId) {
            App.showToast('请先选择角色', 'error');
            return;
        }
        if (!App.ws || App.ws.readyState !== WebSocket.OPEN) {
            App.showToast('WebSocket未连接，请刷新重试', 'error');
            return;
        }
        this.isMatching = true;
        App.ws.send(JSON.stringify({
            type: 'matchmaking',
            character_id: this.selectedCharId,
            form_index: this.selectedFormIndex || 0
        }));
        this.renderMatchSection();
        App.showToast('已加入匹配队列');
    },

    // 取消匹配
    cancelMatchmaking() {
        if (App.ws && App.ws.readyState === WebSocket.OPEN) {
            App.ws.send(JSON.stringify({ type: 'cancel_matchmaking' }));
        }
        this.isMatching = false;
        this.renderMatchSection();
        App.showToast('已取消匹配');
    },

    // 渲染排行榜
    async renderLeaderboard() {
        try {
            const res = await fetch('/api/leaderboard');
            const data = await res.json();
            const list = data.users || [];
            const content = document.getElementById('leaderboard-content');
            if (list.length === 0) {
                content.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px;">暂无排行数据</div>';
                return;
            }
            content.innerHTML = `
                <div class="leaderboard-list">
                    ${list.map((u, i) => `
                        <div class="leaderboard-item rank-${i+1}">
                            <div class="rank">${i+1}</div>
                            <div class="avatar">${escapeHtml(u.avatar || '🎮')}</div>
                            <div class="info">
                                <div class="name">${escapeHtml(u.nickname || u.username)}</div>
                                <div class="stats">${u.wins}胜 ${u.losses}负</div>
                            </div>
                            <div class="win-rate">${u.win_rate}%</div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (err) {
            console.error('加载排行榜失败:', err);
        }
    },

    // 渲染在线玩家（包含机器人）
    renderOnlineUsers() {
        const content = document.getElementById('online-users-content');
        const users = App.state.online_users || [];
        if (users.length === 0) {
            content.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px;">暂无其他在线玩家</div>';
            return;
        }
        const statusNames = { lobby: '空闲', matching: '匹配中', battling: '战斗中' };
        content.innerHTML = `
            <div class="online-list">
                ${users.map(u => {
                    // 机器人玩家卡片
                    if (u.is_bot) {
                        return `
                            <div class="online-item user-card bot-card">
                                <span class="bot-badge">🤖 机器人</span>
                                <div class="avatar">${escapeHtml(u.avatar || '🤖')}</div>
                                <div class="info">
                                    <div class="name">${escapeHtml(u.nickname || u.username)}</div>
                                    <div class="status ${u.status}">${statusNames[u.status] || u.status}</div>
                                </div>
                                <button class="invite-btn" ${u.status !== 'lobby' ? 'disabled' : ''} onclick="Lobby.challengeBot(${u.id})">挑战</button>
                            </div>
                        `;
                    }
                    // 真人玩家卡片
                    return `
                        <div class="online-item">
                            <div class="avatar">${escapeHtml(u.avatar || '🎮')}</div>
                            <div class="info">
                                <div class="name">${escapeHtml(u.nickname || u.username)}</div>
                                <div class="status ${u.status}">${statusNames[u.status] || u.status}</div>
                            </div>
                            <button class="invite-btn" ${u.status !== 'lobby' ? 'disabled' : ''} onclick="Lobby.inviteUser(${u.id})">邀请对战</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // 邀请对战
    inviteUser(userId) {
        if (!this.selectedCharId) {
            App.showToast('请先选择出战角色', 'error');
            return;
        }
        if (App.ws && App.ws.readyState === WebSocket.OPEN) {
            App.ws.send(JSON.stringify({
                type: 'invite_battle',
                target_user_id: userId,
                character_id: this.selectedCharId,
                inviter_form_index: this.selectedFormIndex || 0
            }));
            App.showToast('已发送对战邀请');
        }
    },

    // 挑战机器人（直接发起对战，无需等待）
    challengeBot(botId) {
        // 优先使用已选角色，否则使用角色库第一个角色
        const charId = this.selectedCharId || App.state.selectedCharId || (Characters.myCharacters.length > 0 ? Characters.myCharacters[0].id : null);
        if (!charId) {
            App.showToast('请先在角色库选择一个角色', 'error');
            return;
        }
        if (!App.ws || App.ws.readyState !== WebSocket.OPEN) {
            App.showToast('WebSocket未连接，请刷新重试', 'error');
            return;
        }
        App.ws.send(JSON.stringify({
            type: 'invite_battle',
            target_user_id: botId,
            character_id: charId,
            inviter_form_index: this.selectedFormIndex || 0
        }));
        App.showToast('已向机器人发起挑战');
    },

    // 更新大厅数据（收到WebSocket推送时调用）
    updateLobby(data) {
        App.state.online_users = data.online_users || [];
        this.renderOnlineUsers();
        // 更新匹配队列人数
        if (this.isMatching) {
            const matchStatus = document.querySelector('.match-status');
            if (matchStatus) {
                matchStatus.innerHTML = `
                    <div class="matching-animation">🔍 匹配中... (队列${data.matchmaking_queue}人)</div>
                    <p style="margin-top:8px;color:var(--text-secondary);font-size:13px;">正在为您寻找对手</p>
                    <button class="btn btn-ghost" style="margin-top:12px;" onclick="Lobby.cancelMatchmaking()">取消匹配</button>
                `;
            }
        }
    }
};

// 动态注入形态选择弹窗样式（玻璃拟态 + 动态背景）
(function injectFormSelectionStyles() {
    if (document.getElementById('form-selection-styles')) return;
    const style = document.createElement('style');
    style.id = 'form-selection-styles';
    style.textContent = `
        /* 形态选择弹窗 - 玻璃拟态 */
        .form-selection-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(15, 15, 26, 0.85);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 18px;
            padding: 28px;
            z-index: 1000;
            max-width: 520px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.15);
            animation: formModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes formModalIn {
            from { opacity: 0; transform: translate(-50%, -45%) scale(0.95); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .form-selection-header {
            text-align: center;
            margin-bottom: 20px;
        }
        .form-selection-title {
            font-size: 20px;
            font-weight: 700;
            color: #c4b5fd;
            margin-bottom: 6px;
        }
        .form-selection-subtitle {
            font-size: 13px;
            color: var(--text-secondary, #a0a0b0);
        }
        .form-card-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 20px;
        }
        .form-card {
            background: rgba(255, 255, 255, 0.04);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 14px 16px;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
        }
        .form-card:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(139, 92, 246, 0.4);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.15);
        }
        .form-card.selected {
            background: rgba(139, 92, 246, 0.15);
            border-color: rgba(139, 92, 246, 0.7);
            box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.4), 0 6px 24px rgba(139, 92, 246, 0.2);
        }
        .form-card-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
        }
        .form-card-name {
            font-size: 15px;
            font-weight: 600;
            color: #e0e0f0;
        }
        .form-card.selected .form-card-name {
            color: #c4b5fd;
        }
        .form-card-radio {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            border: 2px solid rgba(255, 255, 255, 0.25);
            transition: all 0.2s;
        }
        .form-card.selected .form-card-radio {
            border-color: #8b5cf6;
            background: #8b5cf6;
            box-shadow: 0 0 12px rgba(139, 92, 246, 0.6);
        }
        .form-card-desc {
            font-size: 12px;
            color: var(--text-secondary, #a0a0b0);
            line-height: 1.5;
            margin-bottom: 8px;
        }
        .form-card-bonuses {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .form-bonus-preview {
            display: inline-flex;
            flex-wrap: wrap;
            gap: 4px;
            font-size: 11px;
            color: var(--text-muted, #707080);
        }
        .form-bonus-tag {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
        }
        .form-bonus-tag.pos {
            background: rgba(34, 197, 94, 0.15);
            color: #4ade80;
            border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .form-bonus-tag.neg {
            background: rgba(245, 87, 108, 0.15);
            color: #f87171;
            border: 1px solid rgba(245, 87, 108, 0.3);
        }
        .form-selection-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .form-selection-actions .btn {
            min-width: 90px;
        }
    `;
    document.head.appendChild(style);
})();
