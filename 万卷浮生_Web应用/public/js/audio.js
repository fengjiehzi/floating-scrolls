// audio.js - Web Audio 音效合成引擎 v=20260701a
(function (global) {
    "use strict";

    // 默认配置
    var DEFAULT_ENABLED = false; // 默认静音
    var DEFAULT_VOLUME = 0.5;    // 默认音量

    // 内部状态
    var audioContext = null;
    var enabled = DEFAULT_ENABLED;
    var volume = DEFAULT_VOLUME;
    var initialized = false;
    var noiseBuffer = null; // 复用的白噪声 buffer

    // 从 localStorage 读取持久化配置
    function loadConfig() {
        try {
            var savedEnabled = localStorage.getItem("audio_enabled");
            if (savedEnabled !== null) {
                enabled = savedEnabled === "1" || savedEnabled === "true";
            }
        } catch (e) {}
        try {
            var savedVolume = localStorage.getItem("audio_volume");
            if (savedVolume !== null) {
                var v = parseFloat(savedVolume);
                if (!isNaN(v) && v >= 0 && v <= 1) {
                    volume = v;
                }
            }
        } catch (e) {}
    }

    // 写入开关状态
    function persistEnabled() {
        try {
            localStorage.setItem("audio_enabled", enabled ? "1" : "0");
        } catch (e) {}
    }

    // 写入音量
    function persistVolume() {
        try {
            localStorage.setItem("audio_volume", String(volume));
        } catch (e) {}
    }

    // 生成 2 秒白噪声 buffer（复用）
    function createNoiseBuffer() {
        if (!audioContext) {
            return null;
        }
        var sampleRate = audioContext.sampleRate;
        var buffer = audioContext.createBuffer(1, sampleRate * 2, sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < data.length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    // 创建一个 oscillator 音效节点链
    // 返回最终连接到 destination 的 gainNode
    function createOscChain(type, frequency, gainValue, duration) {
        var osc = audioContext.createOscillator();
        var gain = audioContext.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.value = gainValue * volume;
        osc.connect(gain);
        gain.connect(audioContext.destination);
        return { osc: osc, gain: gain };
    }

    // 包络衰减：gain 从 value 线性衰减到 0
    function applyDecay(gain, startValue, duration) {
        var now = audioContext.currentTime;
        gain.gain.setValueAtTime(startValue * volume, now);
        gain.gain.linearRampToValueAtTime(0, now + duration);
    }

    // 播放结束后自动断开
    function autoDisconnect(osc, gain, duration) {
        var stopAt = (audioContext.currentTime + duration) * 1000;
        setTimeout(function () {
            try {
                osc.stop();
            } catch (e) {}
            try {
                osc.disconnect(gain);
                gain.disconnect(audioContext.destination);
            } catch (e) {}
        }, stopAt + 50);
    }

    // ============== 7 种音效 ==============

    // 1. click：短促木鱼声，方波 200Hz，gain 0.3→0 在 0.05s 衰减
    function playClick() {
        var chain = createOscChain("square", 200, 0.3, 0.05);
        applyDecay(chain.gain, 0.3, 0.05);
        chain.osc.start();
        autoDisconnect(chain.osc, chain.gain, 0.05);
    }

    // 2. scroll：卷轴展开声，白噪声 + 低通滤波 800Hz + gain 0.15→0 在 0.3s 衰减
    function playScroll() {
        if (!noiseBuffer) {
            return;
        }
        var src = audioContext.createBufferSource();
        src.buffer = noiseBuffer;
        var filter = audioContext.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 800;
        var gain = audioContext.createGain();
        src.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        applyDecay(gain, 0.15, 0.3);
        src.start();
        var stopAt = (audioContext.currentTime + 0.3) * 1000;
        setTimeout(function () {
            try {
                src.stop();
            } catch (e) {}
            try {
                src.disconnect(filter);
                filter.disconnect(gain);
                gain.disconnect(audioContext.destination);
            } catch (e) {}
        }, stopAt + 50);
    }

    // 3. stamp：印章盖落声，正弦波 80Hz + 白噪声混合，gain 0.4→0 在 0.15s 衰减
    function playStamp() {
        var chain = createOscChain("sine", 80, 0.4, 0.15);
        applyDecay(chain.gain, 0.4, 0.15);
        chain.osc.start();
        autoDisconnect(chain.osc, chain.gain, 0.15);

        if (noiseBuffer) {
            var src = audioContext.createBufferSource();
            src.buffer = noiseBuffer;
            var ngain = audioContext.createGain();
            src.connect(ngain);
            ngain.connect(audioContext.destination);
            applyDecay(ngain, 0.2, 0.1);
            src.start();
            var stopAt = (audioContext.currentTime + 0.1) * 1000;
            setTimeout(function () {
                try { src.stop(); } catch (e) {}
                try { src.disconnect(ngain); ngain.disconnect(audioContext.destination); } catch (e) {}
            }, stopAt + 50);
        }
    }

    // 4. damage：击打声，锯齿波 300Hz，gain 0.3→0 在 0.1s 衰减
    function playDamage() {
        var chain = createOscChain("sawtooth", 300, 0.3, 0.1);
        applyDecay(chain.gain, 0.3, 0.1);
        chain.osc.start();
        autoDisconnect(chain.osc, chain.gain, 0.1);
    }

    // 5. victory：胜利和弦，C5+E5+G5 三正弦波叠加，gain 0.2→0 在 0.8s 衰减
    function playVictory() {
        var freqs = [523, 659, 784];
        for (var i = 0; i < freqs.length; i++) {
            var chain = createOscChain("sine", freqs[i], 0.2, 0.8);
            applyDecay(chain.gain, 0.2, 0.8);
            chain.osc.start();
            autoDisconnect(chain.osc, chain.gain, 0.8);
        }
    }

    // 6. defeat：失败下行，G4(392Hz)→C4(262Hz) 频率扫描，gain 0.25→0 在 0.6s 衰减
    function playDefeat() {
        var chain = createOscChain("sine", 392, 0.25, 0.6);
        var now = audioContext.currentTime;
        chain.osc.frequency.setValueAtTime(392, now);
        chain.osc.frequency.linearRampToValueAtTime(262, now + 0.6);
        applyDecay(chain.gain, 0.25, 0.6);
        chain.osc.start();
        autoDisconnect(chain.osc, chain.gain, 0.6);
    }

    // 7. unlock：解锁清脆音，三角波 880Hz，gain 0.2→0 在 0.2s 衰减，附延迟回响副本
    function playUnlock() {
        var chain = createOscChain("triangle", 880, 0.2, 0.2);
        applyDecay(chain.gain, 0.2, 0.2);
        chain.osc.start();
        autoDisconnect(chain.osc, chain.gain, 0.2);

        // 延迟 0.08s 的低增益副本作为简单回响
        setTimeout(function () {
            if (!audioContext) {
                return;
            }
            var echo = createOscChain("triangle", 880, 0.1, 0.15);
            applyDecay(echo.gain, 0.1, 0.15);
            echo.osc.start();
            autoDisconnect(echo.osc, echo.gain, 0.15);
        }, 80);
    }

    // 音效类型映射
    var soundMap = {
        click: playClick,
        scroll: playScroll,
        stamp: playStamp,
        damage: playDamage,
        victory: playVictory,
        defeat: playDefeat,
        unlock: playUnlock
    };

    // 真正执行初始化（在首次用户交互后调用）
    function doInit() {
        if (initialized) {
            return;
        }
        try {
            var Ctx = global.AudioContext || global.webkitAudioContext;
            if (!Ctx) {
                return;
            }
            audioContext = new Ctx();
            noiseBuffer = createNoiseBuffer();
            initialized = true;
        } catch (e) {}
    }

    // AudioEngine 对外接口
    var AudioEngine = {
        // 初始化：监听首次用户交互
        init: function () {
            if (initialized) {
                return;
            }
            loadConfig();
            var self = this;
            var handler = function () {
                doInit();
                if (audioContext && audioContext.state === "suspended") {
                    audioContext.resume();
                }
                document.removeEventListener("click", handler);
                document.removeEventListener("keydown", handler);
            };
            document.addEventListener("click", handler);
            document.addEventListener("keydown", handler);
        },

        // 播放音效
        play: function (type) {
            if (!enabled || !audioContext || !initialized) {
                return;
            }
            var fn = soundMap[type];
            if (fn) {
                try {
                    fn();
                } catch (e) {}
            }
        },

        // 开关音效，持久化
        setEnabled: function (bool) {
            enabled = !!bool;
            persistEnabled();
        },

        // 设置音量 0-1，持久化
        setVolume: function (v) {
            var num = parseFloat(v);
            if (isNaN(num)) {
                return;
            }
            if (num < 0) {
                num = 0;
            }
            if (num > 1) {
                num = 1;
            }
            volume = num;
            persistVolume();
        },

        // 是否启用
        isEnabled: function () {
            return enabled;
        },

        // 当前音量
        getVolume: function () {
            return volume;
        }
    };

    loadConfig();
    global.AudioEngine = AudioEngine;
})(window);
