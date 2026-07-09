// items.js - 道具/法宝库渲染
const Items = {
    allItems: [],
    myItems: [],
    currentTab: 'all',
    filters: { source: '', type: '', rarity: '' },

    async loadAll() {
        try {
            const res = await fetch('/api/items');
            const data = await res.json();
            this.allItems = data.items || [];
        } catch (err) {
            console.error('加载道具失败:', err);
        }
    },

    async loadMine() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/me/items', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            this.myItems = data.items || [];
        } catch (err) {
            console.error('加载我的道具失败:', err);
        }
    },

    async switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('#page-items .tab').forEach(t => t.classList.remove('active'));
        const targetTab = document.querySelector(`#page-items .tab[data-tab="${tab}"]`);
        if (targetTab) targetTab.classList.add('active');
        if (tab === 'mine') {
            await this.loadMine();
        }
        this.render();
    },

    applyFilters() {
        this.filters.source = document.getElementById('filter-source').value;
        this.filters.type = document.getElementById('filter-type').value;
        this.filters.rarity = document.getElementById('filter-rarity').value;
        this.render();
    },

    getFilteredList() {
        let list = this.currentTab === 'all' ? this.allItems : this.myItems;
        if (this.filters.source) {
            list = list.filter(i => i.source === this.filters.source);
        }
        if (this.filters.type) {
            list = list.filter(i => i.type === this.filters.type);
        }
        if (this.filters.rarity) {
            list = list.filter(i => i.rarity === this.filters.rarity);
        }
        return list;
    },

    getRarityLabel(rarity) {
        const map = { legendary: '传说', epic: '史诗', rare: '稀有', common: '普通' };
        return map[rarity] || rarity;
    },

    getTypeLabel(type) {
        const map = { weapon: '兵器', accessory: '法宝', consumable: '消耗品' };
        return map[type] || type;
    },

    render() {
        const grid = document.getElementById('item-grid');
        if (!grid) return;
        const list = this.getFilteredList();
        if (list.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">
                ${this.currentTab === 'all' ? '暂无道具' : '我的珍藏为空，去收集法宝吧'}
            </div>`;
            return;
        }
        grid.innerHTML = list.map(item => `
            <div class="item-card rarity-${item.rarity}" onclick="Items.showDetail(${item.id})">
                <div class="item-portrait">
                    ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="item-portrait-img" onerror="this.style.display='none'">` : ''}
                    <div class="item-rarity-badge rarity-${item.rarity}">${this.getRarityLabel(item.rarity)}</div>
                    ${item.quantity && item.quantity > 1 ? `<div class="item-quantity">×${item.quantity}</div>` : ''}
                    ${item.equipped ? `<div class="item-equipped-badge">已装备</div>` : ''}
                </div>
                <div class="item-info">
                    <div class="item-name">${escapeHtml(item.name)}</div>
                    <div class="item-meta">
                        <span class="item-source">《${escapeHtml(item.source)}》</span>
                        <span class="item-type">${this.getTypeLabel(item.type)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    async showDetail(id) {
        const item = this.allItems.find(x => x.id === id) || this.myItems.find(x => x.id === id);
        if (!item) {
            App.showToast('道具不存在', 'error');
            return;
        }
        const isMine = this.myItems.some(x => x.id === id);
        const myItem = this.myItems.find(x => x.id === id);
        const content = document.getElementById('item-detail-content');
        const statBonusHtml = Object.entries(item.stats_bonus || {}).map(([k, v]) => {
            const nameMap = { power: '力量', speed: '速度', intelligence: '智力', defense: '防御', special_ability: '特殊', hp: 'HP', mp: 'MP' };
            const sign = v >= 0 ? '+' : '';
            return `<div class="bonus-stat-item">
                <span class="bonus-stat-label">${nameMap[k] || k}</span>
                <span class="bonus-stat-value ${v >= 0 ? 'positive' : 'negative'}">${sign}${v}</span>
            </div>`;
        }).join('');

        content.innerHTML = `
            <div class="modal-close" onclick="Items.closeDetail()">×</div>
            <div class="item-detail-container">
                <div class="item-detail-left">
                    <div class="item-detail-portrait rarity-${item.rarity}">
                        ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="item-detail-img">` : ''}
                        <div class="item-detail-rarity">${this.getRarityLabel(item.rarity)}</div>
                    </div>
                    <h2 class="item-detail-name">${escapeHtml(item.name)}</h2>
                    <p class="item-detail-source">出自《${escapeHtml(item.source)}》 · ${this.getTypeLabel(item.type)}</p>
                    ${myItem && myItem.quantity > 0 ? `<p class="item-detail-quantity">拥有数量：<strong>${myItem.quantity}</strong></p>` : ''}
                    <div style="display:flex;gap:8px;margin-top:16px;">
                        ${isMine ? (myItem && myItem.equipped
                            ? `<button class="btn btn-ghost" style="flex:1;" onclick="Items.toggleEquip(${item.id}, false)">卸下</button>`
                            : `<button class="btn btn-primary" style="flex:1;" onclick="Items.toggleEquip(${item.id}, true)">装备</button>`)
                        : `<button class="btn btn-success" style="flex:1;" onclick="Items.addToMine(${item.id})">收入囊中</button>`}
                    </div>
                </div>
                <div class="item-detail-right">
                    <div class="detail-section">
                        <h3>📜 宝物描述</h3>
                        <p class="item-desc-text">${escapeHtml(item.description || '暂无描述')}</p>
                    </div>
                    <div class="detail-section">
                        <h3>⚡ 属性加成</h3>
                        <div class="bonus-stats-grid">
                            ${statBonusHtml || '<div style="color:var(--text-muted);font-size:13px;">暂无属性加成</div>'}
                        </div>
                    </div>
                    ${item.skill_bonus ? `
                    <div class="detail-section">
                        <h3>✨ 技能增幅</h3>
                        <div class="skill-bonus-box">
                            <span class="skill-bonus-label">${this.getSkillTypeName(item.skill_bonus)}</span>
                            <span class="skill-bonus-desc">该类型技能威力提升</span>
                        </div>
                    </div>` : ''}
                    <div class="detail-section">
                        <h3>📖 原作依据</h3>
                        <p class="source-basis-text">${escapeHtml(item.source_basis || '暂无')}</p>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('item-detail-modal').classList.add('active');
    },

    getSkillTypeName(type) {
        const map = {
            physical_attack: '物理攻击', magic_attack: '法术攻击', speed_attack: '速度攻击',
            transform: '变化', heal: '回血', summon: '召唤', passive: '被动'
        };
        return map[type] || type;
    },

    closeDetail() {
        document.getElementById('item-detail-modal').classList.remove('active');
    },

    async addToMine(id) {
        const token = localStorage.getItem('token');
        if (!token) {
            App.showToast('请先登录', 'error');
            return;
        }
        try {
            const res = await fetch('/api/me/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ item_id: id })
            });
            const data = await res.json();
            if (res.ok) {
                App.showToast('已收入囊中！', 'success');
                await this.loadMine();
                this.closeDetail();
                if (this.currentTab === 'mine') this.render();
            } else {
                App.showToast(data.error || '添加失败', 'error');
            }
        } catch (err) {
            App.showToast('网络错误', 'error');
        }
    },

    async toggleEquip(id, equip) {
        const token = localStorage.getItem('token');
        if (!token) {
            App.showToast('请先登录', 'error');
            return;
        }
        try {
            const res = await fetch(`/api/me/items/${id}/equip`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ equipped: equip })
            });
            const data = await res.json();
            if (res.ok) {
                App.showToast(equip ? '装备成功！' : '已卸下', 'success');
                await this.loadMine();
                this.showDetail(id);
                if (this.currentTab === 'mine') this.render();
            } else {
                App.showToast(data.error || '操作失败', 'error');
            }
        } catch (err) {
            App.showToast('网络错误', 'error');
        }
    },

    async init() {
        await this.loadAll();
        if (localStorage.getItem('token')) {
            await this.loadMine();
        }
    }
};
