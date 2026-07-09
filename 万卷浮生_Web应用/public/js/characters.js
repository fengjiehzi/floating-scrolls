// characters.js - 角色库渲染
const Characters = {
    allCharacters: [],
    myCharacters: [],
    currentTab: 'all',

    // 加载所有角色
    async loadAll() {
        try {
            const res = await fetch('/api/characters');
            const data = await res.json();
            this.allCharacters = data.characters || [];
        } catch (err) {
            console.error('加载角色失败:', err);
        }
    },

    // 加载我的卡组
    async loadMine() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/me/characters', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            this.myCharacters = data.characters || [];
        } catch (err) {
            console.error('加载我的卡组失败:', err);
        }
    },

    // 切换Tab
    async switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('#page-char-library .tab').forEach(t => t.classList.remove('active'));
        const targetTab = document.querySelector(`#page-char-library .tab[data-tab="${tab}"]`);
        if (targetTab) targetTab.classList.add('active');
        if (tab === 'mine') {
            await this.loadMine();
        }
        this.render();
    },

    // 渲染角色库
    render() {
        const grid = document.getElementById('char-grid');
        if (!grid) return;
        const list = this.currentTab === 'all' ? this.allCharacters : this.myCharacters;
        if (list.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">
                ${this.currentTab === 'all' ? '暂无角色' : '我的卡组为空，请从全部角色中添加'}
            </div>`;
            return;
        }
        grid.innerHTML = list.map(c => `
            <div class="char-card" onclick="Characters.showDetail(${c.id})">
                <div class="char-card-inner">
                    ${c.image ? `<img class="char-card-img" src="${escapeHtml(c.image)}" alt="${escapeHtml(c.name)}">` : `<div class="char-card-bg" style="background:${c.gradient}"></div>`}
                    <div class="char-card-overlay">
                        <div class="char-stats-mini">
                            <div class="stat-mini"><div class="label">力量</div><div class="value">${c.stats.power}</div></div>
                            <div class="stat-mini"><div class="label">速度</div><div class="value">${c.stats.speed}</div></div>
                            <div class="stat-mini"><div class="label">智力</div><div class="value">${c.stats.intelligence}</div></div>
                            <div class="stat-mini"><div class="label">防御</div><div class="value">${c.stats.defense}</div></div>
                            <div class="stat-mini"><div class="label">特殊</div><div class="value">${c.stats.special_ability}</div></div>
                            <div class="stat-mini"><div class="label">HP</div><div class="value">${c.stats.hp}</div></div>
                        </div>
                        <div class="char-actions">
                            <button class="btn btn-ghost" onclick="event.stopPropagation();Characters.showDetail(${c.id})">详情</button>
                            <button class="btn btn-primary" onclick="event.stopPropagation();Characters.selectForBattle(${c.id})">选战</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // 应用稀有度样式与 3D 倾斜效果
        this.applyRarityAndTilt(list);
    },

    // 推断稀有度：rarity 字段优先，否则按 grade 推断
    inferRarity(c) {
        if (c.rarity && ['SSR', 'SR', 'R', 'N'].includes(c.rarity)) {
            return c.rarity;
        }
        const grade = c.grade || 0;
        if (grade > 50) return 'SSR';
        if (grade > 30) return 'SR';
        if (grade > 10) return 'R';
        return 'N';
    },

    // 应用稀有度 class 和徽章
    applyRarityClass(card, rarity) {
        card.classList.remove('rarity-ssr', 'rarity-sr', 'rarity-r', 'rarity-n');
        const rarityMap = {
            'SSR': 'rarity-ssr',
            'SR': 'rarity-sr',
            'R': 'rarity-r',
            'N': 'rarity-n'
        };
        card.classList.add(rarityMap[rarity] || 'rarity-n');

        // 添加稀有度标签
        if (!card.querySelector('.rarity-badge')) {
            const badge = document.createElement('span');
            badge.className = `rarity-badge ${rarity.toLowerCase()}`;
            badge.textContent = rarity;
            card.appendChild(badge);
        }
    },

    // 绑定 3D 倾斜效果
    bindCard3DTilt() {
        document.querySelectorAll('.char-card').forEach(card => {
            // 避免重复绑定
            if (card._tiltBound) return;
            card._tiltBound = true;

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateY = ((x - centerX) / centerX) * 8; // 最大 8 度
                const rotateX = -((y - centerY) / centerY) * 8;
                card.style.transform = `translateY(-4px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    },

    // 卡牌翻转（可选功能）
    toggleCardFlip(card) {
        if (!card.classList.contains('card-flip-container')) {
            const inner = card.innerHTML;
            card.classList.add('card-flip-container');
            card.innerHTML = `
                <div class="card-flip-inner">
                    <div class="card-front">${inner}</div>
                    <div class="card-back">
                        <div style="padding: 20px; text-align: center;">
                            <h4>角色详情</h4>
                            <p>点击返回</p>
                        </div>
                    </div>
                </div>
            `;
        }
        card.classList.toggle('flipped');
    },

    // 应用稀有度与 3D 倾斜（render 后调用）
    applyRarityAndTilt(list) {
        const cards = document.querySelectorAll('#char-grid .char-card');
        cards.forEach((card, index) => {
            const c = list[index];
            if (c) {
                const rarity = this.inferRarity(c);
                this.applyRarityClass(card, rarity);
            }
        });
        this.bindCard3DTilt();
    },

    // 显示角色详情（调用成长API）
    async showDetail(id) {
        const c = this.allCharacters.find(x => x.id === id) || this.myCharacters.find(x => x.id === id);
        if (!c) {
            App.showToast('角色不存在', 'error');
            return;
        }
        const isMine = this.myCharacters.some(x => x.id === id);
        const content = document.getElementById('char-detail-content');
        // 先显示loading
        content.innerHTML = `
            <div class="modal-close" onclick="Characters.closeDetail()">×</div>
            <div style="text-align:center;padding:60px 20px;color:var(--text-muted);">加载中...</div>
        `;
        document.getElementById('char-detail-modal').style.display = 'flex';

        // 若为我的角色，则获取成长信息和装备信息
        let growth = null;
        let equipment = [];
        if (isMine) {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const [growthRes, equipRes] = await Promise.all([
                        fetch(`/api/me/characters/${id}/growth`, { headers: { 'Authorization': 'Bearer ' + token } }),
                        fetch(`/api/characters/${id}/equipment`, { headers: { 'Authorization': 'Bearer ' + token } })
                    ]);
                    if (growthRes.ok) growth = await growthRes.json();
                    if (equipRes.ok) {
                        const equipData = await equipRes.json();
                        equipment = equipData.equipment || [];
                    }
                } catch (err) {
                    console.error('获取角色信息失败:', err);
                }
            }
        }
        this.renderDetail(c, growth, isMine, equipment);
    },

    // 渲染角色详情弹窗内容
    renderDetail(character, growth, isMine, equipment) {
        const c = character;
        const s = c.stats;
        equipment = equipment || [];
        const skillTypeNames = {
            physical_attack: '物理攻击', magic_attack: '法术攻击', speed_attack: '速度攻击',
            transform: '变化', heal: '回血', summon: '召唤', passive: '被动'
        };
        const statNameMap = { power: '力量', speed: '速度', intelligence: '智力', defense: '防御', special_ability: '特殊', hp: 'HP', mp: 'MP' };

        // 装备信息渲染
        let equipmentHtml = '';
        if (isMine) {
            const equippedList = equipment.length > 0
                ? equipment.map(eq => `
                    <div class="equip-slot-item" style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--paper-bg);border-radius:6px;border:1px solid var(--border-paper);margin-bottom:8px;">
                        <div style="font-size:24px;">${eq.image ? `<img src="${escapeHtml(eq.image)}" style="width:32px;height:32px;object-fit:contain;">` : '🎒'}</div>
                        <div style="flex:1;">
                            <div style="font-weight:600;font-size:13px;">${escapeHtml(eq.name)}</div>
                            <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(eq.type || '')} · ${escapeHtml(eq.rarity || '')}</div>
                        </div>
                        <button class="btn btn-ghost" style="padding:4px 10px;font-size:12px;" onclick="Characters.unequipItem(${c.id}, ${eq.item_id})">卸下</button>
                    </div>
                `).join('')
                : '<div style="color:var(--text-muted);font-size:13px;padding:8px 0;">尚未装备任何法宝</div>';
            equipmentHtml = `
                <div class="detail-section">
                    <h3>🎒 装备槽</h3>
                    ${equippedList}
                    <button class="btn btn-ghost" style="width:100%;margin-top:6px;font-size:13px;" onclick="Characters.openEquipPicker(${c.id})">+ 选择法宝装备</button>
                </div>
            `;
        }

        // 成长信息渲染
        let growthHtml = '';
        if (growth) {
            const expPercent = growth.exp_to_next > 0 ? Math.min(100, Math.round(growth.exp / growth.exp_to_next * 100)) : 0;
            const statBonusPercent = Math.round((growth.stat_bonus || 0) * 100);
            const bonusText = statBonusPercent > 0 ? `+${statBonusPercent}%` : '—';
            growthHtml = `
                <div class="growth-level-box">
                    <div class="growth-level-label">当前等级</div>
                    <div class="growth-level-value">Lv.${growth.level}</div>
                    <div class="growth-exp-wrap">
                        <div class="growth-exp-head">
                            <span>经验值</span>
                            <span>${growth.exp} / ${growth.exp_to_next}</span>
                        </div>
                        <div class="growth-exp-bar">
                            <div class="growth-exp-fill" style="width:${expPercent}%"></div>
                        </div>
                    </div>
                </div>
                <div class="detail-section">
                    <h3>📈 属性加成</h3>
                    <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">等级加成：每级 +2% 当前 <strong style="color:var(--old-gold-dark);">${bonusText}</strong></div>
                    <div class="growth-stats-table">
                        ${Object.keys(statNameMap).map(k => {
                            const base = s[k] || 0;
                            const bonus = Math.round(base * (growth.stat_bonus || 0));
                            return `<div class="growth-stat-cell">
                                <div class="label">${statNameMap[k]}</div>
                                <div class="value">${base}${bonus > 0 ? `<div class="bonus">+${bonus}</div>` : ''}
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        } else {
            growthHtml = `
                <div class="detail-section">
                    <h3>📊 七维属性</h3>
                    <div class="radar-chart">${this.renderRadarChart(c)}</div>
                </div>
            `;
        }

        // 形态列表（带解锁/锁定状态）
        let formsHtml = '';
        if (growth && growth.all_forms) {
            formsHtml = growth.all_forms.map(f => {
                if (f.unlocked) {
                    return `
                        <div class="form-item-detail">
                            <div class="form-head">
                                <span class="form-name">✅ ${escapeHtml(f.name)}</span>
                                <span class="form-unlock-tag">已解锁</span>
                            </div>
                            <div class="form-desc">${escapeHtml(f.desc)}</div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="form-item-detail locked">
                            <div class="form-head">
                                <span class="form-name">🔒 ${escapeHtml(f.name)}</span>
                                <span class="form-unlock-tag">需 Lv.${f.unlock_level || '?'}</span>
                            </div>
                            <div class="form-desc">${escapeHtml(f.desc)}</div>
                        </div>
                    `;
                }
            }).join('');
        } else {
            // 未登录或非我的角色，显示基础形态
            formsHtml = c.forms.map(f => {
                const bonusText = Object.keys(f.bonuses).length === 0
                    ? '基础属性'
                    : Object.entries(f.bonuses).map(([k,v]) => {
                        const nameMap = {power:'力量',speed:'速度',intelligence:'智力',defense:'防御',special_ability:'特殊'};
                        return `${nameMap[k]}${v>=0?'+':''}${v}`;
                    }).join(' ');
                return `<div class="form-item-detail">
                    <div class="form-head"><span class="form-name">${escapeHtml(f.name)}</span></div>
                    <div class="form-desc">${escapeHtml(f.desc)}（${bonusText}）</div>
                </div>`;
            }).join('');
        }

        const content = document.getElementById('char-detail-content');
        content.innerHTML = `
            <div class="modal-close" onclick="Characters.closeDetail()">×</div>
            <div class="detail-container">
                <div class="detail-left">
                    <div class="detail-portrait" style="background:${c.gradient}">
                        ${c.image ? `<img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.name)}" class="char-portrait-img" onerror="this.style.display='none'">` : ''}
                        <div class="grade-badge grade-${c.grade}" style="top:14px;right:14px;">${c.grade}</div>
                        <div class="name">${escapeHtml(c.name)}</div>
                        <div class="meta">${c.grade}级 · 《${escapeHtml(c.source)}》</div>
                    </div>
                    <h3 style="font-size:20px;margin-bottom:8px;">${escapeHtml(c.name)}</h3>
                    <p style="color:var(--text-secondary);font-size:13px;margin-bottom:14px;">来自《${escapeHtml(c.source)}》 · ${c.grade}级角色${isMine ? ' · <span style="color:var(--old-gold-dark);">已拥有</span>' : ''}</p>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
                        <div class="stat-mini"><div class="label">HP</div><div class="value">${s.hp}</div></div>
                        <div class="stat-mini"><div class="label">MP</div><div class="value">${s.mp}</div></div>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="btn btn-primary" style="flex:1;" onclick="Characters.selectForBattle(${c.id})">选择对战</button>
                        ${isMine ? '' : `<button class="btn btn-success" style="flex:1;" onclick="Characters.addToMine(${c.id})">加入卡组</button>`}
                    </div>
                </div>
                <div class="detail-right">
                    ${growthHtml}
                    <div class="detail-section">
                        <h3>⚔️ 技能列表</h3>
                        <div class="skill-list">
                            ${c.skills.map(sk => `
                                <div class="skill-item">
                                    <div class="skill-head">
                                        <span class="skill-name">${escapeHtml(sk.name)}</span>
                                        <span class="skill-type">${skillTypeNames[sk.type] || sk.type}</span>
                                    </div>
                                    <div class="skill-desc">${escapeHtml(sk.desc)}</div>
                                    <div class="skill-meta">倍率: ${sk.multiplier > 0 ? sk.multiplier + '倍' : '—'} | MP消耗: ${sk.mp_cost}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="detail-section">
                        <h3>🔄 形态变化</h3>
                        <div class="form-list" style="flex-direction:column;">
                            ${formsHtml}
                        </div>
                    </div>
                    ${equipmentHtml}
                    <div class="detail-section">
                        <h3>📖 原作依据</h3>
                        <div class="source-basis">${escapeHtml(c.source_basis || '暂无')}</div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('char-detail-modal').style.display = 'flex';
    },

    // 关闭详情
    closeDetail() {
        document.getElementById('char-detail-modal').style.display = 'none';
    },

    // 打开装备选择器（从用户背包中选择道具装备给该角色）
    async openEquipPicker(charId) {
        const token = localStorage.getItem('token');
        if (!token) { App.showToast('请先登录', 'error'); return; }
        try {
            // 获取用户背包
            const res = await fetch('/api/me/items', { headers: { 'Authorization': 'Bearer ' + token } });
            const data = await res.json();
            const myItems = data.items || [];
            if (myItems.length === 0) {
                App.showToast('背包为空，请先在剧情中获得法宝', 'info');
                return;
            }
            // 渲染选择器弹窗
            const content = document.getElementById('char-detail-content');
            content.innerHTML = `
                <div class="modal-close" onclick="Characters.closeDetail()">×</div>
                <div style="padding:24px;max-height:70vh;overflow-y:auto;">
                    <h3 style="font-family:var(--font-family-brush);color:var(--old-gold);margin-bottom:16px;">选择法宝装备</h3>
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;">
                        ${myItems.map(item => `
                            <div class="item-pick-card" onclick="Characters.equipItem(${charId}, ${item.id})"
                                style="padding:12px;background:var(--paper-bg);border:1px solid var(--border-paper);border-radius:8px;cursor:pointer;text-align:center;transition:all 0.2s;"
                                onmouseover="this.style.borderColor='var(--old-gold)';this.style.transform='translateY(-3px)'"
                                onmouseout="this.style.borderColor='var(--border-paper)';this.style.transform=''">
                                <div style="font-size:36px;margin-bottom:6px;">${item.image ? `<img src="${escapeHtml(item.image)}" style="width:40px;height:40px;object-fit:contain;">` : '🎒'}</div>
                                <div style="font-weight:600;font-size:13px;">${escapeHtml(item.name)}</div>
                                <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${escapeHtml(item.type || '')} · ${escapeHtml(item.rarity || '')}</div>
                                ${item.equipped ? '<div style="font-size:10px;color:var(--vermillion);margin-top:4px;">已被装备</div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-ghost" style="margin-top:16px;width:100%;" onclick="Characters.showDetail(${charId})">返回角色详情</button>
                </div>
            `;
        } catch (err) {
            console.error('打开装备选择器失败:', err);
            App.showToast('加载背包失败', 'error');
        }
    },

    // 装备道具到角色
    async equipItem(charId, itemId) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/characters/${charId}/equip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ item_id: itemId })
            });
            const data = await res.json();
            if (data.success) {
                App.showToast('装备成功', 'success');
                this.showDetail(charId); // 刷新详情
            } else {
                App.showToast(data.error || '装备失败', 'error');
            }
        } catch (err) {
            App.showToast('网络错误', 'error');
        }
    },

    // 卸下角色道具
    async unequipItem(charId, itemId) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/characters/${charId}/unequip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ item_id: itemId })
            });
            const data = await res.json();
            if (data.success) {
                App.showToast('已卸下', 'success');
                this.showDetail(charId); // 刷新详情
            } else {
                App.showToast(data.error || '卸下失败', 'error');
            }
        } catch (err) {
            App.showToast('网络错误', 'error');
        }
    },

    // 加入我的卡组
    async addToMine(id) {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/me/characters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ character_id: id })
            });
            const data = await res.json();
            if (res.ok) {
                App.showToast('已加入卡组！', 'success');
                await this.loadMine();
            } else {
                App.showToast(data.error || '添加失败', 'error');
            }
        } catch (err) {
            App.showToast('网络错误', 'error');
        }
    },

    // 选择角色对战
    selectForBattle(id) {
        this.closeDetail();
        App.state.selectedCharId = id;
        App.navigate('lobby');
        // 高亮选中角色
        setTimeout(() => {
            Lobby.selectCharacter(id);
        }, 100);
    },

    // 渲染SVG雷达图
    renderRadarChart(c) {
        const s = c.stats;
        const dims = [
            { label: '力量', value: s.power },
            { label: '速度', value: s.speed },
            { label: '智力', value: s.intelligence },
            { label: '防御', value: s.defense },
            { label: '特殊', value: s.special_ability },
            { label: 'HP', value: Math.min(100, Math.round(s.hp / 100)) },
            { label: 'MP', value: Math.min(100, Math.round(s.mp / 15)) }
        ];
        const cx = 150, cy = 150, maxR = 110;
        const n = dims.length;
        const points = dims.map((d, i) => {
            const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
            const r = (d.value / 100) * maxR;
            return {
                x: cx + Math.cos(angle) * r,
                y: cy + Math.sin(angle) * r,
                lx: cx + Math.cos(angle) * (maxR + 22),
                ly: cy + Math.sin(angle) * (maxR + 22),
                label: d.label,
                value: d.value
            };
        });
        let grid = '';
        for (let layer = 1; layer <= 5; layer++) {
            const layerR = (maxR / 5) * layer;
            const layerPts = [];
            for (let i = 0; i < n; i++) {
                const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
                layerPts.push(`${cx + Math.cos(angle) * layerR},${cy + Math.sin(angle) * layerR}`);
            }
            grid += `<polygon points="${layerPts.join(' ')}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
        }
        let axes = '';
        for (let i = 0; i < n; i++) {
            const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
            axes += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(angle) * maxR}" y2="${cy + Math.sin(angle) * maxR}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>`;
        }
        const dataPoints = points.map(p => `${p.x},${p.y}`).join(' ');
        const labels = points.map(p => `
            <text x="${p.lx}" y="${p.ly}" fill="#a0a0b0" font-size="12" text-anchor="middle" dominant-baseline="middle">${p.label}</text>
            <text x="${p.lx}" y="${p.ly + 14}" fill="#f5576c" font-size="11" font-weight="700" text-anchor="middle" dominant-baseline="middle">${p.value}</text>
        `).join('');
        return `
            <svg width="300" height="300" viewBox="0 0 300 300">
                ${grid}${axes}
                <polygon points="${dataPoints}" fill="rgba(245,87,108,0.25)" stroke="#f5576c" stroke-width="2"/>
                ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3" fill="#f093fb"/>`).join('')}
                ${labels}
            </svg>
        `;
    }
};
