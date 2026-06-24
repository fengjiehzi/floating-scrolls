// battle.js - 对战逻辑（WebSocket通信）

// ====== 战斗动效触发函数（独立函数，供 Battle 对象调用）======

// 屏幕震动
function triggerScreenShake() {
    const arena = document.querySelector('.battle-arena');
    if (arena) {
        arena.classList.add('screen-shake');
        setTimeout(() => arena.classList.remove('screen-shake'), 200);
    }
}

// 闪光效果
function triggerFlashEffect() {
    const flash = document.createElement('div');
    flash.className = 'flash-effect';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
}

// 伤害数字飞出
function showDamageNumber(targetSide, damage, isCrit, isHeal) {
    const targetCard = document.getElementById(`battle-${targetSide}-card`);
    if (!targetCard) return;
    const damageEl = document.createElement('div');
    damageEl.className = 'damage-number';
    if (isCrit) damageEl.classList.add('crit');
    if (isHeal) damageEl.classList.add('heal');
    damageEl.textContent = isHeal ? `+${damage}` : `-${damage}`;
    targetCard.style.position = 'relative';
    damageEl.style.left = '50%';
    damageEl.style.top = '40%';
    targetCard.appendChild(damageEl);
    setTimeout(() => damageEl.remove(), 800);
}

// HP 条更新动画
function updateHPWithAnimation(side, currentHp, maxHp) {
    const fillEl = document.getElementById(`battle-${side}-hp-fill`);
    const textEl = document.getElementById(`battle-${side}-hp-text`);
    if (!fillEl || !textEl) return;
    const percent = Math.max(0, (currentHp / maxHp) * 100);
    fillEl.style.width = percent + '%';
    textEl.textContent = `${Math.max(0, currentHp)}/${maxHp}`;
    const barEl = document.getElementById(`battle-${side}-hp-bar`);
    if (barEl) {
        barEl.style.animation = 'none';
        void barEl.offsetWidth;
        barEl.style.animation = 'hp-flash 0.3s ease';
    }
}

// MP 条更新
function updateMPWithAnimation(side, currentMp, maxMp) {
    const fillEl = document.getElementById(`battle-${side}-mp-fill`);
    const textEl = document.getElementById(`battle-${side}-mp-text`);
    if (!fillEl || !textEl) return;
    const percent = Math.max(0, (currentMp / maxMp) * 100);
    fillEl.style.width = percent + '%';
    textEl.textContent = `${Math.max(0, currentMp)}/${maxMp}`;
}

// 金光粒子效果（胜利时）
function showGoldParticles(targetCard) {
    if (!targetCard) return;
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'gold-particle';
        const angle = (Math.PI * 2 * i) / 12;
        const distance = 60 + Math.random() * 40;
        particle.style.setProperty('--px', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--py', Math.sin(angle) * distance - 40 + 'px');
        particle.style.left = '50%';
        particle.style.top = '50%';
        targetCard.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }
}

// 胜利展示
function showVictoryEffect(winnerSide) {
    const winnerCard = document.getElementById(`battle-${winnerSide}-card`);
    if (winnerCard) {
        winnerCard.classList.add('victory-text');
        showGoldParticles(winnerCard);
    }
    const loserSide = winnerSide === 'player' ? 'enemy' : 'player';
    const loserCard = document.getElementById(`battle-${loserSide}-card`);
    if (loserCard) {
        loserCard.classList.add('defeat-fall');
    }
}

// 添加战斗日志条目（带动画）
function addBattleLogEntry(text) {
    const logContent = document.getElementById('battle-log');
    if (!logContent) return;
    const entry = document.createElement('div');
    entry.className = 'battle-log-entry';
    entry.textContent = text;
    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}

// ====== Battle 对象 ======
const Battle = {
    battleId: null,
    yourChar: null,
    opponentChar: null,
    opponent: null,
    currentRound: 0,
    isFinished: false,
    myFormIndex: 0,
    currentHp: { player: 0, enemy: 0 },

    // 重置状态
    reset() {
        this.battleId = null;
        this.yourChar = null;
        this.opponentChar = null;
        this.opponent = null;
        this.currentRound = 0;
        this.isFinished = false;
        this.myFormIndex = 0;
        this.currentHp = { player: 0, enemy: 0 };
    },

    // 匹配成功，准备战斗
    onMatchFound(data) {
        this.reset();
        this.battleId = data.battle_id;
        this.yourChar = data.your_char;
        this.opponentChar = data.opponent_char;
        this.opponent = data.opponent;
        Lobby.isMatching = false;
        App.showToast(`匹配成功！对手：${data.opponent.nickname || data.opponent.username}`, 'success');
    },

    // 战斗开始
    onBattleStart(data) {
        if (data.your_char) this.yourChar = data.your_char;
        if (data.opponent_char) this.opponentChar = data.opponent_char;
        if (data.opponent) this.opponent = data.opponent;
        this.battleId = data.battle_id;
        this.currentRound = 0;
        this.isFinished = false;
        this.myFormIndex = data.your_form_index || 0;
        this.renderArena();
        document.getElementById('battle-log').innerHTML = '';
        this.addLog('system', `⚔️ 战斗开始！${this.yourChar.name} VS ${this.opponentChar.name}`);
        this.addLog('system', data.you_first ? `${this.yourChar.name}速度更快，率先出手` : `${this.opponentChar.name}速度更快，率先出手`);
        App.navigate('battle');
    },

    // 渲染战斗界面（只更新预建元素内容，不使用 innerHTML 重构结构）
    renderArena() {
        this.renderFighter('player', this.yourChar);
        this.renderFighter('enemy', this.opponentChar);
        const roundEl = document.getElementById('battle-round-num');
        if (roundEl) roundEl.textContent = '1';
        this.renderSkillBar();
    },

    // 渲染单个战斗者（更新预建元素）
    renderFighter(side, fighter) {
        if (!fighter) return;
        const nameEl = document.getElementById(`battle-${side}-name`);
        if (nameEl) nameEl.textContent = fighter.name;
        const formEl = document.getElementById(`battle-${side}-form`);
        const formName = (side === 'player'
            ? (fighter.forms && fighter.forms[this.myFormIndex] ? fighter.forms[this.myFormIndex].name : (fighter.forms && fighter.forms[0] ? fighter.forms[0].name : null))
            : (fighter.forms && fighter.forms[0] ? fighter.forms[0].name : null)) || '初始形态';
        if (formEl) formEl.textContent = formName;
        const avatarEl = document.getElementById(`battle-${side}-avatar`);
        if (avatarEl) {
            avatarEl.style.background = fighter.gradient || '';
            avatarEl.style.position = 'relative';
            avatarEl.style.overflow = 'hidden';
            avatarEl.innerHTML = fighter.image
                ? `<img src="${escapeHtml(fighter.image)}" alt="${escapeHtml(fighter.name)}" class="char-portrait-img" onerror="this.style.display='none'">`
                : '';
        }
        const maxHp = fighter.stats.hp;
        const maxMp = fighter.stats.mp;
        this.currentHp[side] = maxHp;
        updateHPWithAnimation(side, maxHp, maxHp);
        updateMPWithAnimation(side, maxMp, maxMp);
    },

    // 渲染技能栏
    renderSkillBar() {
        const skillBar = document.getElementById('battle-skill-bar');
        if (!skillBar) return;
        const skills = (this.yourChar && this.yourChar.skills) ? this.yourChar.skills : [];
        const skillIcons = { attack: '⚔️', transform: '✨', heal: '💚', summon: '👹', passive: '🛡️' };
        skillBar.innerHTML = '';
        skills.forEach(skill => {
            const btn = document.createElement('button');
            btn.className = 'battle-skill-btn';
            btn.type = 'button';
            btn.title = `${skill.name}（${skill.desc || ''}）\nMP消耗: ${skill.mp_cost}`;
            btn.innerHTML = `<span class="skill-icon">${skillIcons[skill.type] || '✦'}</span><span class="skill-name">${escapeHtml(skill.name)}</span>`;
            skillBar.appendChild(btn);
        });
    },

    // 处理战斗回合
    onBattleRound(data) {
        this.currentRound = data.round;
        const roundEl = document.getElementById('battle-round-num');
        if (roundEl) roundEl.textContent = data.round;
        this.addLog('round', `—— 第 ${data.round} 回合 ——`);
        data.actions.forEach(action => {
            if (action.form_switch && action.form_switch.switched) {
                this.addFormSwitchLog(action.actor || '未知角色', action.form_switch.new_form || '新形态');
                const actorDom = this.mapSide(action.actor_side);
                const formEl = document.getElementById(`battle-${actorDom}-form`);
                if (formEl) formEl.textContent = action.form_switch.new_form || '新形态';
            }
            this.processAction(action);
        });
    },

    // side 映射：服务端 'you'/'opponent' → 前端 DOM 'player'/'enemy'
    mapSide(side) {
        return side === 'you' ? 'player' : 'enemy';
    },

    // 添加形态切换特效日志
    addFormSwitchLog(actor, newForm) {
        const logBox = document.getElementById('battle-log');
        if (!logBox) return;
        const entry = document.createElement('div');
        entry.className = 'form-switch-effect';
        entry.innerHTML = `
            <span class="form-switch-icon">✨</span>
            <span class="form-switch-text">${escapeHtml(actor)} 切换为 ${escapeHtml(newForm)} 形态！</span>
        `;
        logBox.appendChild(entry);
        logBox.scrollTop = logBox.scrollHeight;
    },

    // 处理单个动作
    processAction(action) {
        const actorSide = action.actor_side;
        const targetSide = action.target_side;
        const actorName = action.actor;
        const targetName = action.target;
        const actorDom = this.mapSide(actorSide);
        const targetDom = this.mapSide(targetSide);

        // 技能特效
        this.showSkillEffect(actorDom, action.skill);
        // 日志
        this.addLog(actorSide, `${actorName} 施展 【${action.skill}】`);

        if (action.damage > 0) {
            // 攻击动画
            this.playAttackAnim(actorDom, targetDom);
            // 触发屏幕震动与闪光
            triggerScreenShake();
            triggerFlashEffect();
            // 伤害数字与 HP 条更新（延迟以匹配攻击动画）
            setTimeout(() => {
                showDamageNumber(targetDom, action.damage, action.isCrit, false);
                updateHPWithAnimation(targetDom, Math.max(0, action.hp_after), this.getCharBySide(targetSide).stats.hp);
                this.currentHp[targetDom] = action.hp_after;
            }, 250);
            if (action.isCrit) {
                this.addLog('crit', `💥 暴击！${actorName} 对 ${targetName} 造成 ${action.damage} 点伤害！`);
            } else {
                this.addLog(actorSide, `${actorName} 对 ${targetName} 造成 ${action.damage} 点伤害`);
            }
        } else if (action.skill_type === 'transform' || action.skill_type === 'heal') {
            if (action.logs) {
                action.logs.slice(1).forEach(log => this.addLog('system', log));
            }
            // 回血技能更新自身HP（带治疗动效）
            if (action.skill_type === 'heal' && action.hp_after !== undefined) {
                const maxHp = this.getCharBySide(actorSide).stats.hp;
                const prevHp = this.currentHp[actorDom] !== undefined ? this.currentHp[actorDom] : maxHp;
                const healAmount = Math.max(0, action.hp_after - prevHp);
                if (healAmount > 0) {
                    showDamageNumber(actorDom, healAmount, false, true);
                }
                updateHPWithAnimation(actorDom, action.hp_after, maxHp);
                this.currentHp[actorDom] = action.hp_after;
            }
        }

        // 更新施法者MP条
        if (action.mp_after !== undefined && action.mp_cost > 0) {
            updateMPWithAnimation(actorDom, action.mp_after, this.getCharBySide(actorSide).stats.mp);
        }
    },

    // 根据side获取角色
    getCharBySide(side) {
        return side === 'you' ? this.yourChar : this.opponentChar;
    },

    // 添加日志
    addLog(type, text) {
        const logBox = document.getElementById('battle-log');
        if (!logBox) return;
        const entry = document.createElement('div');
        entry.className = 'log-entry log-' + type;
        entry.textContent = text;
        logBox.appendChild(entry);
        logBox.scrollTop = logBox.scrollHeight;
    },

    // 显示技能特效
    showSkillEffect(side, text) {
        const avatar = document.getElementById(`battle-${side}-avatar`);
        if (!avatar) return;
        const effect = document.createElement('div');
        effect.className = 'skill-effect';
        effect.textContent = text;
        avatar.appendChild(effect);
        setTimeout(() => effect.remove(), 1200);
    },

    // 攻击动画
    playAttackAnim(attackerSide, defenderSide) {
        const attacker = document.getElementById(`battle-${attackerSide}-avatar`);
        const defender = document.getElementById(`battle-${defenderSide}-avatar`);
        if (attacker) {
            attacker.classList.add('attacking');
            setTimeout(() => attacker.classList.remove('attacking'), 500);
        }
        if (defender) {
            setTimeout(() => {
                defender.classList.add('hit');
                setTimeout(() => defender.classList.remove('hit'), 500);
            }, 250);
        }
    },

    // 战斗结束
    onBattleEnd(data) {
        this.isFinished = true;
        const isVictory = data.winner === 'you';
        // 触发胜利/败北动效
        showVictoryEffect(isVictory ? 'player' : 'enemy');
        this.addLog('system', `🏆 ${isVictory ? '你获胜了！' : '对手获胜'}`);
        const resultData = {
            exp: data.exp || (data.stats && data.stats.exp_gained) || null,
            levelUp: data.levelUp || (data.stats && data.stats.level_up) || null,
            rounds: (data.stats && data.stats.total_rounds) || this.currentRound
        };
        setTimeout(() => {
            App.navigate('battle-result');
            showBattleResult(isVictory, resultData);
        }, 1500);
        // 更新用户战绩
        if (App.state.user) {
            if (data.stats) {
                App.state.user.wins = data.stats.your_wins !== undefined ? data.stats.your_wins : (App.state.user.wins || 0);
                App.state.user.losses = data.stats.your_losses !== undefined ? data.stats.your_losses : (App.state.user.losses || 0);
            } else {
                App.state.user.wins = (App.state.user.wins || 0) + (isVictory ? 1 : 0);
                App.state.user.losses = (App.state.user.losses || 0) + (isVictory ? 0 : 1);
            }
            localStorage.setItem('user', JSON.stringify(App.state.user));
            if (typeof Lobby !== 'undefined' && Lobby.renderPlayerInfo) {
                Lobby.renderPlayerInfo();
            }
        }
    },

    // 显示战斗结果
    showResult(isVictory, data) {
        const content = document.getElementById('result-content');
        const winner = isVictory ? this.yourChar : this.opponentChar;
        const loser = isVictory ? this.opponentChar : this.yourChar;
        const narration = data.narration || '';
        content.innerHTML = `
            <div class="result-title ${isVictory ? 'victory' : 'defeat'}">${isVictory ? '🏆 胜利！' : '💔 败北'}</div>
            <p style="font-size:16px;color:var(--text-secondary);margin-bottom:16px;">
                ${escapeHtml(winner.name)}（${winner.grade}级·《${escapeHtml(winner.source)}》） ${isVictory ? '击败' : '不敌'} ${escapeHtml(loser.name)}（${loser.grade}级·《${escapeHtml(loser.source)}》）
            </p>
            <p style="font-size:13px;color:var(--text-muted);">总回合数：${data.stats && data.stats.total_rounds ? data.stats.total_rounds : this.currentRound}</p>
            <div class="narration-box">
                <div class="narration-title">✍️ AI战斗叙述</div>
                ${narration.split('\n').map(line => line.trim() ? `<p>${escapeHtml(line)}</p>` : '').join('')}
            </div>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:20px;">
                <button class="btn btn-primary" onclick="App.navigate('lobby')">返回大厅</button>
                <button class="btn btn-secondary" onclick="App.navigate('battles')">查看战绩</button>
            </div>
        `;
        App.navigate('battle-result');
    }
};

// 显示战斗结果（胜负大字 + 结算面板）
function showBattleResult(isVictory, resultData) {
    const verdictEl = document.getElementById('verdict-text');
    const settlementEl = document.getElementById('result-settlement');
    const infoEl = document.getElementById('settlement-info');

    if (!verdictEl) return;

    // 设置胜负文字
    verdictEl.textContent = isVictory ? '胜' : '败';
    verdictEl.className = `verdict-text ${isVictory ? 'victory' : 'defeat'}`;

    // 重置动画（移除再添加类以重新触发）
    verdictEl.style.animation = 'none';
    void verdictEl.offsetWidth;
    verdictEl.style.animation = '';

    // 隐藏结算面板
    settlementEl.classList.remove('show');

    // 2秒后显示结算面板
    setTimeout(() => {
        // 填充结算信息
        if (infoEl && resultData) {
            infoEl.innerHTML = `
                <div class="info-row">
                    <span class="info-label">结果</span>
                    <span class="info-value">${isVictory ? '凯旋而归' : '此战不利'}</span>
                </div>
                ${resultData.exp ? `<div class="info-row">
                    <span class="info-label">经验获得</span>
                    <span class="info-value exp">+${resultData.exp}</span>
                </div>` : ''}
                ${resultData.levelUp ? `<div class="info-row">
                    <span class="info-label">等级提升</span>
                    <span class="info-value">Lv.${resultData.levelUp}</span>
                </div>` : ''}
                ${resultData.rounds ? `<div class="info-row">
                    <span class="info-label">战斗回合</span>
                    <span class="info-value">${resultData.rounds} 回合</span>
                </div>` : ''}
            `;
        }
        settlementEl.classList.add('show');
    }, 2000);
}

// 动态注入形态切换特效样式（玻璃拟态 + 动态背景）
(function injectFormSwitchStyles() {
    if (document.getElementById('form-switch-styles')) return;
    const style = document.createElement('style');
    style.id = 'form-switch-styles';
    style.textContent = `
        .form-switch-effect {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(59, 130, 246, 0.18));
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(139, 92, 246, 0.5);
            border-radius: 10px;
            padding: 12px 16px;
            margin: 8px 0;
            text-align: center;
            animation: formSwitchPulse 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.25), inset 0 0 12px rgba(139, 92, 246, 0.08);
            position: relative;
            overflow: hidden;
        }
        .form-switch-effect::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(196, 181, 253, 0.25), transparent);
            animation: formSwitchShine 1.2s ease;
        }
        .form-switch-icon {
            font-size: 1.5em;
            margin-right: 8px;
            display: inline-block;
            animation: formSwitchSpark 0.6s ease;
        }
        .form-switch-text {
            color: #c4b5fd;
            font-weight: bold;
            font-size: 1.05em;
            text-shadow: 0 0 8px rgba(196, 181, 253, 0.5);
        }
        @keyframes formSwitchPulse {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
        }
        @keyframes formSwitchShine {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        @keyframes formSwitchSpark {
            0% { transform: scale(0) rotate(-180deg); opacity: 0; }
            50% { transform: scale(1.3) rotate(0deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
})();
