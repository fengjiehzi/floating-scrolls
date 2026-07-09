// global-progress.js - 顶部进度线控制器 + fetch 拦截
// v=20260701a

(function () {
    'use strict';

    var GlobalProgress = {
        barEl: null,           // 进度条元素
        currentPercent: 0,     // 当前进度
        isActive: false,       // 是否正在显示中
        originalFetch: null,   // 原始 window.fetch 引用

        // 注入样式到 head
        injectStyles: function () {
            if (document.getElementById('global-progress-style')) return;
            var style = document.createElement('style');
            style.id = 'global-progress-style';
            style.textContent = [
                '#global-progress-bar {',
                '    position: fixed;',
                '    top: 0;',
                '    left: 0;',
                '    height: 3px;',
                '    width: 0;',
                '    opacity: 0;',
                '    background: linear-gradient(90deg, var(--vermillion, #c23b22), var(--old-gold, #c9a962));',
                '    z-index: 9998;',
                '    transition: width 0.3s ease, opacity 0.3s ease;',
                '    pointer-events: none;',
                '    box-shadow: 0 0 8px rgba(194, 59, 34, 0.4);',
                '}'
            ].join('\n');
            document.head.appendChild(style);
        },

        // 创建进度条元素并注入 body
        createBar: function () {
            if (this.barEl) return;
            this.injectStyles();
            var bar = document.createElement('div');
            bar.id = 'global-progress-bar';
            document.body.appendChild(bar);
            this.barEl = bar;
        },

        // 初始化：创建进度条并自动调用 autoFetch()
        init: function () {
            this.createBar();
            this.autoFetch();
        },

        // 显示进度线，width 跳到 30%
        start: function () {
            if (!this.barEl) this.createBar();
            this.isActive = true;
            this.currentPercent = 30;
            this.barEl.style.opacity = '1';
            this.barEl.style.width = '30%';
        },

        // 设置进度百分比
        set: function (percent) {
            if (!this.barEl) this.createBar();
            percent = Math.max(0, Math.min(100, percent));
            this.currentPercent = percent;
            this.barEl.style.opacity = '1';
            this.barEl.style.width = percent + '%';
        },

        // width 跳到 100%，300ms 后 opacity:0 隐藏
        done: function () {
            if (!this.barEl) return;
            this.isActive = false;
            this.currentPercent = 100;
            this.barEl.style.width = '100%';
            var self = this;
            setTimeout(function () {
                self.barEl.style.opacity = '0';
                // 隐藏后重置 width 以便下次复用
                setTimeout(function () {
                    if (!self.isActive) {
                        self.barEl.style.width = '0';
                    }
                }, 300);
            }, 300);
        },

        // 拦截 window.fetch：请求开始调 start()，响应到达调 done()
        autoFetch: function () {
            if (this.originalFetch) return; // 防止重复拦截
            var self = this;
            this.originalFetch = window.fetch;
            window.fetch = function () {
                self.start();
                var promise = self.originalFetch.apply(this, arguments);
                promise.then(function () {
                    self.done();
                }).catch(function () {
                    self.done();
                });
                return promise;
            };
        }
    };

    // 暴露全局对象
    window.GlobalProgress = GlobalProgress;

    // 自动初始化
    GlobalProgress.init();
})();
