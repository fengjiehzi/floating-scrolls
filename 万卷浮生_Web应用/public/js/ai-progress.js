// ai-progress.js - AI 分阶段进度控制器：底部浮窗显示生成阶段与进度
// v=20260701a

(function () {
    'use strict';

    // 默认阶段名称
    var DEFAULT_STAGES = ['翻阅典籍', '构思剧情', '书写成文'];
    // 各阶段预估时长（ms）：3s / 4s / 3s
    var STAGE_DURATIONS = [3000, 4000, 3000];
    // 总超时 90s（安全网：超过此时间自动隐藏，避免永久卡死）
    var TOTAL_TIMEOUT = 90000;

    var AIProgress = {
        panelEl: null,          // 浮窗根节点
        stageEls: [],           // 阶段标签元素数组
        progressBar: null,      // 进度条填充
        hintText: null,         // 提示文字
        currentStage: -1,       // 当前阶段索引
        stages: DEFAULT_STAGES, // 阶段名称数组
        stageStart: 0,          // 当前阶段开始时间戳
        stageDuration: 0,       // 当前阶段时长
        rafId: null,            // requestAnimationFrame 句柄
        timeoutTimer: null,     // 总超时定时器
        isHidden: true,         // 是否已隐藏
        isCompleted: false      // 是否已完成
    };

    // 注入样式到 head
    AIProgress.injectStyles = function () {
        if (document.getElementById('ai-progress-style')) return;
        var style = document.createElement('style');
        style.id = 'ai-progress-style';
        style.textContent = [
            '#ai-progress-panel {',
            '    position: fixed;',
            '    bottom: 24px;',
            '    left: 50%;',
            '    transform: translateX(-50%);',
            '    z-index: 8000;',
            '    min-width: 320px;',
            '    max-width: 90vw;',
            '    padding: 16px 24px;',
            '    background: rgba(250, 247, 242, 0.95);',
            '    backdrop-filter: blur(12px);',
            '    -webkit-backdrop-filter: blur(12px);',
            '    border: 1px solid var(--old-gold, #c9a962);',
            '    border-radius: 12px;',
            '    box-shadow: 0 8px 32px rgba(13, 13, 13, 0.2);',
            '    font-family: var(--font-family-serif, serif);',
            '    transition: opacity 0.4s ease, transform 0.4s ease;',
            '    opacity: 1;',
            '}',
            '#ai-progress-panel.ai-progress-hidden {',
            '    opacity: 0;',
            '    pointer-events: none;',
            '    transform: translateX(-50%) translateY(20px);',
            '}',
            '.ai-progress-stages {',
            '    display: flex;',
            '    gap: 16px;',
            '    align-items: center;',
            '    justify-content: center;',
            '    margin-bottom: 12px;',
            '    flex-wrap: wrap;',
            '}',
            '.ai-progress-stage {',
            '    font-size: 14px;',
            '    color: rgba(13, 13, 13, 0.4);',
            '    transition: color 0.3s ease;',
            '    white-space: nowrap;',
            '}',
            '.ai-progress-stage.stage-active {',
            '    color: var(--vermillion, #c23b22);',
            '    font-weight: 600;',
            '}',
            '.ai-progress-stage.stage-done {',
            '    color: var(--old-gold, #c9a962);',
            '}',
            '.ai-progress-stage-arrow {',
            '    color: rgba(13, 13, 13, 0.2);',
            '    font-size: 12px;',
            '}',
            '.ai-progress-track {',
            '    width: 100%;',
            '    height: 2px;',
            '    background: rgba(13, 13, 13, 0.08);',
            '    border-radius: 1px;',
            '    overflow: hidden;',
            '    margin-bottom: 8px;',
            '}',
            '.ai-progress-fill {',
            '    height: 100%;',
            '    width: 0%;',
            '    background: linear-gradient(90deg, var(--vermillion, #c23b22), var(--old-gold, #c9a962));',
            '    transition: width 0.3s linear;',
            '}',
            '.ai-progress-hint {',
            '    font-size: 12px;',
            '    color: rgba(13, 13, 13, 0.6);',
            '    text-align: center;',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    };

    // 创建浮窗 DOM 并注入 body
    AIProgress.createDom = function () {
        if (this.panelEl) return;
        this.injectStyles();
        var panel = document.createElement('div');
        panel.id = 'ai-progress-panel';
        panel.className = 'ai-progress-hidden';
        document.body.appendChild(panel);
        this.panelEl = panel;
    };

    // 渲染阶段标签与进度条
    AIProgress.renderStages = function () {
        if (!this.panelEl) return;
        this.panelEl.innerHTML = '';
        this.stageEls = [];

        var self = this;
        var stagesBox = document.createElement('div');
        stagesBox.className = 'ai-progress-stages';

        this.stages.forEach(function (name, idx) {
            var span = document.createElement('span');
            span.className = 'ai-progress-stage';
            span.textContent = name;
            span.dataset.index = idx;
            self.stageEls.push(span);
            stagesBox.appendChild(span);
            if (idx < self.stages.length - 1) {
                var arrow = document.createElement('span');
                arrow.className = 'ai-progress-stage-arrow';
                arrow.textContent = '→';
                stagesBox.appendChild(arrow);
            }
        });
        this.panelEl.appendChild(stagesBox);

        var track = document.createElement('div');
        track.className = 'ai-progress-track';
        var fill = document.createElement('div');
        fill.className = 'ai-progress-fill';
        track.appendChild(fill);
        this.panelEl.appendChild(track);
        this.progressBar = fill;

        var hint = document.createElement('div');
        hint.className = 'ai-progress-hint';
        hint.textContent = 'AI 正在' + this.stages[0] + '...';
        this.panelEl.appendChild(hint);
        this.hintText = hint;
    };

    // 显示底部浮窗
    // stages：阶段名称数组，默认 ['翻阅典籍','构思剧情','书写成文']
    AIProgress.show = function (stages) {
        this.stages = (stages && stages.length) ? stages : DEFAULT_STAGES;
        this.createDom();
        this.renderStages();
        this.isHidden = false;
        this.isCompleted = false;
        this.currentStage = -1;
        this.panelEl.classList.remove('ai-progress-hidden');
        this.setStage(0);
        this.startTimeout();
    };

    // 启动总超时定时器（安全网：超时后自动隐藏浮窗）
    AIProgress.startTimeout = function () {
        var self = this;
        this.clearTimeout();
        this.timeoutTimer = setTimeout(function () {
            if (!self.isHidden && !self.isCompleted) {
                console.warn('[AIProgress] 总超时(' + (TOTAL_TIMEOUT / 1000) + 's)，自动隐藏浮窗');
                self.hide();
            }
        }, TOTAL_TIMEOUT);
    };

    // 清理总超时定时器
    AIProgress.clearTimeout = function () {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            this.timeoutTimer = null;
        }
    };

    // 切换到指定阶段，更新进度条和阶段状态
    AIProgress.setStage = function (index) {
        if (index < 0 || index >= this.stages.length) return;
        this.currentStage = index;

        var self = this;
        // 更新阶段标签状态
        this.stageEls.forEach(function (el, i) {
            el.classList.remove('stage-active', 'stage-done');
            if (i < index) {
                el.classList.add('stage-done');
                el.textContent = self.stages[i] + ' ✓';
            } else if (i === index) {
                el.classList.add('stage-active');
                el.textContent = self.stages[i];
            } else {
                el.textContent = self.stages[i];
            }
        });

        // 更新提示文字
        if (this.hintText) {
            this.hintText.textContent = 'AI 正在' + this.stages[index] + '...';
        }

        // 进度条在该阶段内匀速推进
        this.startStageProgress(index);
    };

    // 启动单阶段进度条匀速推进
    AIProgress.startStageProgress = function (index) {
        var self = this;
        this.stopRaf();
        var basePercent = (index / this.stages.length) * 100;
        var stageRange = 100 / this.stages.length;
        this.stageStart = Date.now();
        this.stageDuration = STAGE_DURATIONS[index] || 3000;

        var tick = function () {
            if (self.isHidden || self.isCompleted) return;
            var elapsed = Date.now() - self.stageStart;
            var ratio = Math.min(1, elapsed / self.stageDuration);
            var percent = basePercent + stageRange * ratio;
            if (self.progressBar) {
                self.progressBar.style.width = percent + '%';
            }
            if (ratio < 1) {
                self.rafId = requestAnimationFrame(tick);
            }
        };
        this.rafId = requestAnimationFrame(tick);
    };

    // 停止 requestAnimationFrame
    AIProgress.stopRaf = function () {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    };

    // 进度跳到 100%，500ms 后淡出
    AIProgress.complete = function () {
        if (this.isHidden) return;
        this.isCompleted = true;
        this.stopRaf();
        this.clearTimeout();

        var self = this;
        // 所有阶段标记完成
        this.stageEls.forEach(function (el, i) {
            el.classList.remove('stage-active');
            el.classList.add('stage-done');
            el.textContent = self.stages[i] + ' ✓';
        });
        if (this.progressBar) {
            this.progressBar.style.width = '100%';
        }
        if (this.hintText) {
            this.hintText.textContent = '已完成';
        }
        setTimeout(function () {
            if (self.panelEl) {
                self.panelEl.classList.add('ai-progress-hidden');
            }
        }, 500);
    };

    // 立即隐藏
    AIProgress.hide = function () {
        this.isHidden = true;
        this.stopRaf();
        this.clearTimeout();
        if (this.panelEl) {
            this.panelEl.classList.add('ai-progress-hidden');
        }
    };

    // 暴露全局对象
    window.AIProgress = AIProgress;
})();
