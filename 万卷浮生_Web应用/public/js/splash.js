// splash.js - 启动屏控制器：水墨卷轴展开动画 + 资源加载进度模拟
// v=20260701a

(function () {
    'use strict';

    var Splash = {
        splashEl: null,       // 启动屏根节点
        progressBar: null,    // 进度条填充
        percentText: null,    // 百分比文字
        hintText: null,       // 提示文字
        scrollEl: null,       // 卷轴 SVG
        currentPercent: 0,    // 当前进度
        loadTimer: null,      // 模拟加载定时器
        readyTimer: null,     // 3s "即将就绪" 定时器
        forceHideTimer: null, // 8s 强制隐藏定时器
        isHidden: false,      // 是否已隐藏

        // 注入样式到 head
        injectStyles: function () {
            if (document.getElementById('splash-style')) return;
            var style = document.createElement('style');
            style.id = 'splash-style';
            style.textContent = [
                '#app-splash {',
                '    position: fixed;',
                '    top: 0; left: 0;',
                '    width: 100%; height: 100%;',
                '    background: var(--paper-bg, #faf7f2);',
                '    z-index: 9999;',
                '    display: flex;',
                '    flex-direction: column;',
                '    align-items: center;',
                '    justify-content: center;',
                '    gap: 24px;',
                '}',
                '#app-splash.splash-fading {',
                '    animation: splash-fade-out 0.5s ease forwards;',
                '    pointer-events: none;',
                '}',
                '#app-splash.splash-hidden {',
                '    display: none !important;',
                '}',
                '.splash-scroll-wrap {',
                '    width: 240px;',
                '    height: 120px;',
                '    display: flex;',
                '    align-items: center;',
                '    justify-content: center;',
                '}',
                '.splash-scroll-svg {',
                '    width: 100%;',
                '    height: 100%;',
                '    animation: scroll-unfold 1.2s ease-out forwards;',
                '    transform-origin: center;',
                '}',
                '@keyframes scroll-unfold {',
                '    0%   { transform: scaleX(0.1); opacity: 0.3; }',
                '    50%  { transform: scaleX(0.6); opacity: 0.8; }',
                '    100% { transform: scaleX(1);   opacity: 1;   }',
                '}',
                '.splash-progress-track {',
                '    width: 240px;',
                '    height: 3px;',
                '    background: rgba(13, 13, 13, 0.1);',
                '    border-radius: 2px;',
                '    overflow: hidden;',
                '}',
                '.splash-progress-fill {',
                '    height: 100%;',
                '    width: 0%;',
                '    background: linear-gradient(90deg, var(--vermillion, #c23b22), var(--old-gold, #c9a962));',
                '    transition: width 0.3s ease;',
                '}',
                '.splash-percent {',
                '    font-family: var(--font-family-brush, "KaiTi", "STKaiti", serif);',
                '    color: var(--old-gold, #c9a962);',
                '    font-size: 18px;',
                '    letter-spacing: 2px;',
                '}',
                '.splash-hint {',
                '    font-family: var(--font-family-serif, serif);',
                '    color: var(--ink-black, #1a1a1a);',
                '    font-size: 14px;',
                '    opacity: 0.7;',
                '}',
                '@keyframes splash-fade-out {',
                '    from { opacity: 1; }',
                '    to   { opacity: 0; }',
                '}'
            ].join('\n');
            document.head.appendChild(style);
        },

        // 动态创建启动屏 DOM 并注入 body
        createDom: function () {
            if (document.getElementById('app-splash')) {
                this.splashEl = document.getElementById('app-splash');
                this.progressBar = this.splashEl.querySelector('.splash-progress-fill');
                this.percentText = this.splashEl.querySelector('.splash-percent');
                this.hintText = this.splashEl.querySelector('.splash-hint');
                this.scrollEl = this.splashEl.querySelector('.splash-scroll-svg');
                return;
            }
            var splash = document.createElement('div');
            splash.id = 'app-splash';

            // 居中水墨卷轴 SVG
            var wrap = document.createElement('div');
            wrap.className = 'splash-scroll-wrap';
            wrap.innerHTML = [
                '<svg class="splash-scroll-svg" viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">',
                '    <rect x="10" y="20" width="14" height="80" rx="4" fill="var(--old-gold, #c9a962)" stroke="var(--ink-black, #1a1a1a)" stroke-width="1.5"/>',
                '    <circle cx="17" cy="20" r="8" fill="var(--old-gold, #c9a962)" stroke="var(--ink-black, #1a1a1a)" stroke-width="1.5"/>',
                '    <circle cx="17" cy="100" r="8" fill="var(--old-gold, #c9a962)" stroke="var(--ink-black, #1a1a1a)" stroke-width="1.5"/>',
                '    <rect x="24" y="30" width="192" height="60" fill="var(--paper-bg, #faf7f2)" stroke="var(--ink-black, #1a1a1a)" stroke-width="1"/>',
                '    <line x1="40" y1="45" x2="200" y2="45" stroke="var(--ink-black, #1a1a1a)" stroke-width="0.5" opacity="0.4"/>',
                '    <line x1="40" y1="55" x2="200" y2="55" stroke="var(--ink-black, #1a1a1a)" stroke-width="0.5" opacity="0.4"/>',
                '    <line x1="40" y1="65" x2="200" y2="65" stroke="var(--ink-black, #1a1a1a)" stroke-width="0.5" opacity="0.4"/>',
                '    <line x1="40" y1="75" x2="200" y2="75" stroke="var(--ink-black, #1a1a1a)" stroke-width="0.5" opacity="0.4"/>',
                '    <rect x="216" y="20" width="14" height="80" rx="4" fill="var(--old-gold, #c9a962)" stroke="var(--ink-black, #1a1a1a)" stroke-width="1.5"/>',
                '    <circle cx="223" cy="20" r="8" fill="var(--old-gold, #c9a962)" stroke="var(--ink-black, #1a1a1a)" stroke-width="1.5"/>',
                '    <circle cx="223" cy="100" r="8" fill="var(--old-gold, #c9a962)" stroke="var(--ink-black, #1a1a1a)" stroke-width="1.5"/>',
                '</svg>'
            ].join('\n');
            splash.appendChild(wrap);

            // 进度条
            var track = document.createElement('div');
            track.className = 'splash-progress-track';
            var fill = document.createElement('div');
            fill.className = 'splash-progress-fill';
            track.appendChild(fill);
            splash.appendChild(track);

            // 百分比文字
            var percent = document.createElement('div');
            percent.className = 'splash-percent';
            percent.textContent = '0%';
            splash.appendChild(percent);

            // 提示文字
            var hint = document.createElement('div');
            hint.className = 'splash-hint';
            hint.textContent = '正在展开典籍...';
            splash.appendChild(hint);

            document.body.appendChild(splash);

            this.splashEl = splash;
            this.progressBar = fill;
            this.percentText = percent;
            this.hintText = hint;
            this.scrollEl = wrap.querySelector('.splash-scroll-svg');
        },

        // 显示启动屏，进度归零
        show: function () {
            this.createDom();
            this.isHidden = false;
            this.currentPercent = 0;
            this.update(0);
        },

        // 更新进度百分比（0-100）
        update: function (percent) {
            if (this.isHidden) return;
            percent = Math.max(0, Math.min(100, percent));
            this.currentPercent = percent;
            if (this.progressBar) {
                this.progressBar.style.width = percent + '%';
            }
            if (this.percentText) {
                this.percentText.textContent = Math.floor(percent) + '%';
            }
        },

        // 卷轴合拢动画后淡出
        hide: function () {
            if (this.isHidden) return;
            this.isHidden = true;

            // 清理定时器
            if (this.loadTimer) { clearInterval(this.loadTimer); this.loadTimer = null; }
            if (this.readyTimer) { clearTimeout(this.readyTimer); this.readyTimer = null; }
            if (this.forceHideTimer) { clearTimeout(this.forceHideTimer); this.forceHideTimer = null; }

            var self = this;

            // 卷轴合拢动画
            if (this.scrollEl) {
                this.scrollEl.style.animation = 'none';
                // 强制重排，使后续 transition 生效
                void this.scrollEl.offsetWidth;
                this.scrollEl.style.transition = 'transform 0.4s ease-in, opacity 0.4s ease-in';
                this.scrollEl.style.transform = 'scaleX(0.1)';
                this.scrollEl.style.opacity = '0.3';
            }

            // 淡出 splash
            setTimeout(function () {
                if (self.splashEl) {
                    self.splashEl.classList.add('splash-fading');
                    setTimeout(function () {
                        if (self.splashEl) {
                            self.splashEl.classList.add('splash-hidden');
                        }
                    }, 500);
                }
            }, 400);
        },

        // 模拟资源加载：每 200ms 进度 +5-10（随机），上限 90%
        startFakeLoad: function () {
            var self = this;
            this.loadTimer = setInterval(function () {
                if (self.currentPercent >= 90) {
                    clearInterval(self.loadTimer);
                    self.loadTimer = null;
                    return;
                }
                var inc = 5 + Math.floor(Math.random() * 6); // 5-10
                var next = self.currentPercent + inc;
                if (next > 90) next = 90;
                self.update(next);
            }, 200);
        },

        // 初始化：在 DOMContentLoaded 时调用
        init: function () {
            var self = this;
            this.injectStyles();
            this.show();
            this.startFakeLoad();

            // 3s 未触发 load，强制进度跳到 90% 并显示"即将就绪..."
            this.readyTimer = setTimeout(function () {
                if (!self.isHidden && self.currentPercent < 100) {
                    if (self.hintText) {
                        self.hintText.textContent = '即将就绪...';
                    }
                    if (self.currentPercent < 90) {
                        self.update(90);
                    }
                }
            }, 3000);

            // 8s 强制隐藏
            this.forceHideTimer = setTimeout(function () {
                if (!self.isHidden) {
                    self.hide();
                }
            }, 8000);

            // window.load 事件触发后，进度跳到 100%，500ms 后调用 hide()
            var winLoad = function () {
                if (self.isHidden) return;
                if (self.loadTimer) { clearInterval(self.loadTimer); self.loadTimer = null; }
                if (self.readyTimer) { clearTimeout(self.readyTimer); self.readyTimer = null; }
                self.update(100);
                setTimeout(function () {
                    self.hide();
                }, 500);
            };

            if (document.readyState === 'complete') {
                winLoad();
            } else {
                window.addEventListener('load', winLoad);
            }
        }
    };

    // 暴露全局对象
    window.Splash = Splash;

    // 自动在 DOMContentLoaded 时初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { Splash.init(); });
    } else {
        Splash.init();
    }
})();
