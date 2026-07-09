// particles.js - Canvas 粒子效果器 v=20260701f
(function (global) {
    "use strict";

    // 同屏粒子上限
    var MAX_PARTICLES = 100;
    var MAX_DUST_PARTICLES = 50;

    var canvas = null;
    var ctx = null;
    var particles = [];
    var rafId = null;
    var running = false;
    
    // 灰尘粒子系统
    var dustParticles = [];
    var dustContainer = null;
    var dustInterval = null;

    // 创建全局 Canvas 层
    function createCanvas() {
        var existingCanvas = document.getElementById("particle-canvas");
        if (existingCanvas) {
            canvas = existingCanvas;
        } else {
            canvas = document.createElement("canvas");
            canvas.id = "particle-canvas";
            canvas.style.cssText =
                "position:fixed;top:0;left:0;width:100%;height:100%;" +
                "pointer-events:none;z-index:9000;";
            document.body.appendChild(canvas);
        }
        resizeCanvas();
        ctx = canvas.getContext("2d");
    }

    // 响应窗口尺寸
    function resizeCanvas() {
        if (!canvas) {
            return;
        }
        canvas.width = global.innerWidth || document.documentElement.clientWidth || 0;
        canvas.height = global.innerHeight || document.documentElement.clientHeight || 0;
    }

    // 创建单个粒子
    function makeParticle(x, y, opts) {
        return {
            x: x,
            y: y,
            vx: opts.vx || 0,
            vy: opts.vy || 0,
            size: opts.size || 3,
            color: opts.color || "#ffffff",
            life: opts.life || 1500,
            maxLife: opts.life || 1500,
            gravity: opts.gravity || 0,
            rotation: opts.rotation || 0,
            vr: opts.vr || 0
        };
    }

    // 限制同屏粒子数 ≤ MAX_PARTICLES
    function enforceLimit() {
        while (particles.length > MAX_PARTICLES) {
            particles.shift(); // 移除最老
        }
    }

    // ============== 三种粒子发射 ==============

    // gold：科技粒子向上飘散 + 旋转 + 1.5s 淡出，gravity=-0.05
    function emitGold(x, y, count) {
        var colors = ["#00ffff", "#00d4ff", "#9d4edd", "#ff00ff"];
        for (var i = 0; i < count; i++) {
            var angle = (-Math.PI / 2) + (Math.random() - 0.5) * Math.PI * 0.6;
            var speed = 1 + Math.random() * 2;
            particles.push(makeParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1500,
                gravity: -0.05,
                rotation: Math.random() * Math.PI * 2,
                vr: (Math.random() - 0.5) * 0.2
            }));
        }
    }

    // ink：墨粒子随机扩散 + 模糊，gravity=0，1.2s 淡出
    function emitInk(x, y, count) {
        var color = "rgba(13,13,13,0.6)";
        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 0.5 + Math.random() * 1.5;
            particles.push(makeParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 4,
                color: color,
                life: 1200,
                gravity: 0,
                rotation: 0,
                vr: 0
            }));
        }
    }

    // spark：火花四散，gravity=0.15，0.8s 淡出
    function emitSpark(x, y, count) {
        var colors = ["#c23b22", "#d44a33", "#ffd700"];
        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 1 + Math.random() * 3;
            particles.push(makeParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1.5 + Math.random() * 2.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 800,
                gravity: 0.15,
                rotation: 0,
                vr: 0
            }));
        }
    }

    // tech-glow：科技发光粒子，向上漂浮，带有青色/紫色光晕
    function emitTechGlow(x, y, count) {
        var colors = ["#00ffff", "#00d4ff", "#9d4edd", "#ff00ff", "#ffd700"];
        for (var i = 0; i < count; i++) {
            var angle = (-Math.PI / 2) + (Math.random() - 0.5) * Math.PI * 0.8;
            var speed = 0.5 + Math.random() * 1.5;
            particles.push(makeParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 2000,
                gravity: -0.03,
                rotation: Math.random() * Math.PI * 2,
                vr: (Math.random() - 0.5) * 0.15
            }));
        }
    }

    // light-ring：光环扩散效果
    function emitLightRing(x, y, count) {
        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var speed = 0.8 + Math.random() * 2;
            particles.push(makeParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 1 + Math.random() * 1.5,
                color: "#00ffff",
                life: 1200,
                gravity: 0,
                rotation: 0,
                vr: 0
            }));
        }
    }

    var emitterMap = {
        gold: emitGold,
        ink: emitInk,
        spark: emitSpark,
        techGlow: emitTechGlow,
        lightRing: emitLightRing
    };

    // ============== 科技发光粒子系统 ==============
    
    // 创建科技发光粒子
    function createDustParticle() {
        if (!dustContainer) {
            dustContainer = document.getElementById("dust-particles");
            if (!dustContainer) return;
        }
        
        if (dustParticles.length >= MAX_DUST_PARTICLES) return;
        
        var dust = document.createElement("div");
        dust.className = "dust-particle";
        
        var size = 1 + Math.random() * 3;
        var left = Math.random() * 100;
        var top = Math.random() * 100;
        var duration = 8 + Math.random() * 12;
        var delay = Math.random() * 5;
        
        var colors = ["#00ffff", "#9d4edd", "#00d4ff", "#ff00ff"];
        var color = colors[Math.floor(Math.random() * colors.length)];
        
        dust.style.cssText =
            "width:" + size + "px;height:" + size + "px;" +
            "left:" + left + "%;top:" + top + "%;" +
            "animation-duration:" + duration + "s;" +
            "animation-delay:" + delay + "s;" +
            "background:" + color + ";" +
            "box-shadow:0 0 " + (size * 3) + "px " + color + ";";
        
        dustContainer.appendChild(dust);
        dustParticles.push(dust);
    }
    
    // 启动科技粒子系统
    function startDustSystem() {
        dustContainer = document.getElementById("dust-particles");
        if (!dustContainer) return;
        
        for (var i = 0; i < 20; i++) {
            setTimeout(createDustParticle, i * 200);
        }
        
        dustInterval = setInterval(createDustParticle, 1500);
    }
    
    // 停止科技粒子系统
    function stopDustSystem() {
        if (dustInterval) {
            clearInterval(dustInterval);
            dustInterval = null;
        }
        dustParticles.forEach(function(dust) {
            if (dust && dust.parentNode) {
                dust.parentNode.removeChild(dust);
            }
        });
        dustParticles = [];
    }

    // ============== 科技光球效果 ==============
    
    // 创建科技光球效果
    function createCandleEffect() {
        var orbs = document.querySelectorAll(".tech-orb");
        orbs.forEach(function(orb, index) {
            orb.style.animation = "orb-float " + (8 + index * 2) + "s ease-in-out infinite";
        });
    }

    // 渲染单帧
    function renderFrame() {
        if (!ctx || !canvas) {
            stopLoop();
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var delta = 16; // 每帧 16ms
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life -= delta;
            p.rotation += p.vr;

            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }

            var alpha = p.life / p.maxLife;
            if (alpha < 0) {
                alpha = 0;
            }
            if (alpha > 1) {
                alpha = 1;
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            // 将颜色与透明度结合
            // 支持 #hex 与 rgba() 两种格式
            var fillColor = p.color;
            var glowColor = fillColor;
            if (fillColor.indexOf("rgba") === 0) {
                // rgba(r,g,b,a) 替换 a 为 alpha
                fillColor = fillColor.replace(
                    /rgba\(([^)]+)\)/,
                    function (m, body) {
                        var parts = body.split(",");
                        var r = (parts[0] || "13").trim();
                        var g = (parts[1] || "13").trim();
                        var b = (parts[2] || "13").trim();
                        return "rgba(" + r + "," + g + "," + b + "," + (alpha * (parseFloat(parts[3] || "0.6"))).toFixed(3) + ")";
                    }
                );
                glowColor = fillColor.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^\)]+\)/, function(m, r, g, b) {
                    return "rgba(" + r + "," + g + "," + b + "," + (alpha * 0.3).toFixed(3) + ")";
                });
            } else {
                // #hex 转 rgba
                ctx.fillStyle = hexToRgba(fillColor, alpha);
                glowColor = hexToRgba(fillColor, alpha * 0.3);
            }

            // 绘制发光效果
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = p.size * 4;

            // 用 fillRect 绘制（旋转后表现为方块粒子）
            var s = p.size;
            ctx.fillStyle = fillColor;
            ctx.fillRect(-s / 2, -s / 2, s, s);

            // 绘制粒子轨迹效果
            ctx.shadowBlur = 0;
            var trailAlpha = alpha * 0.2;
            var trailSize = s * 0.5;
            ctx.fillStyle = hexToRgba(p.color, trailAlpha);
            ctx.fillRect(-s / 2 - p.vx * 3, -s / 2 - p.vy * 3, trailSize, trailSize);
            ctx.fillStyle = hexToRgba(p.color, trailAlpha * 0.5);
            ctx.fillRect(-s / 2 - p.vx * 6, -s / 2 - p.vy * 6, trailSize * 0.5, trailSize * 0.5);

            ctx.restore();
        }

        enforceLimit();

        if (particles.length === 0) {
            stopLoop();
        }
    }

    // #hex 转 rgba
    function hexToRgba(hex, alpha) {
        var h = hex.replace("#", "");
        if (h.length === 3) {
            h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        }
        var r = parseInt(h.substring(0, 2), 16) || 0;
        var g = parseInt(h.substring(2, 4), 16) || 0;
        var b = parseInt(h.substring(4, 6), 16) || 0;
        return "rgba(" + r + "," + g + "," + b + "," + alpha.toFixed(3) + ")";
    }

    // 启动 RAF 循环
    function startLoop() {
        if (running) {
            return;
        }
        running = true;
        var tick = function () {
            if (!running) {
                return;
            }
            renderFrame();
            if (particles.length > 0) {
                rafId = global.requestAnimationFrame(tick);
            } else {
                stopLoop();
            }
        };
        rafId = global.requestAnimationFrame(tick);
    }

    // 停止 RAF 循环
    function stopLoop() {
        running = false;
        if (rafId !== null && global.cancelAnimationFrame) {
            try {
                global.cancelAnimationFrame(rafId);
            } catch (e) {}
        }
        rafId = null;
    }

    // Particles 对外接口
    var Particles = {
        // 初始化：创建 Canvas 并启动循环
        init: function () {
            if (canvas) {
                return;
            }
            createCanvas();
            global.addEventListener("resize", function () {
                resizeCanvas();
            });
        },

        // 发射粒子
        emit: function (type, options) {
            if (!canvas) {
                this.init();
            }
            options = options || {};
            var x = options.x || 0;
            var y = options.y || 0;
            var count = options.count || 10;
            var fn = emitterMap[type];
            if (fn) {
                fn(x, y, count);
                enforceLimit();
                startLoop();
            }
        },

        // 清空所有粒子
        clear: function () {
            particles = [];
            if (ctx && canvas) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            stopLoop();
        },
        
        // 启动灰尘粒子系统
        startDust: function() {
            startDustSystem();
        },
        
        // 停止灰尘粒子系统
        stopDust: function() {
            stopDustSystem();
        },
        
        // 启动烛光效果
        startCandle: function() {
            createCandleEffect();
        },
        
        // 初始化所有背景效果
        initBackgroundEffects: function() {
            this.startDust();
            this.startCandle();
        }
    };

    global.Particles = Particles;
})(window);
