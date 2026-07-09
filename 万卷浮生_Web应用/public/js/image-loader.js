// image-loader.js - 图片懒加载 + 错误占位处理
// v=20260701a

(function () {
    'use strict';

    var ImageLoader = {
        observer: null, // IntersectionObserver 实例

        // 注入样式到 head
        injectStyles: function () {
            if (document.getElementById('image-loader-style')) return;
            var style = document.createElement('style');
            style.id = 'image-loader-style';
            style.textContent = [
                '.img-loading {',
                '    opacity: 0.3;',
                '    filter: blur(8px);',
                '    transition: all 0.3s ease;',
                '}',
                '.img-loaded {',
                '    opacity: 1;',
                '    filter: blur(0);',
                '    transition: all 0.3s ease;',
                '}',
                '.img-error {',
                '    display: flex;',
                '    align-items: center;',
                '    justify-content: center;',
                '    background: var(--paper-dark, #e8e0d0);',
                '    border: 1px solid var(--old-gold, #c9a962);',
                '    color: var(--old-gold-dark, #8a7430);',
                '    font-family: var(--font-family-brush, "KaiTi", "STKaiti", serif);',
                '    font-size: 32px;',
                '    width: 80px;',
                '    height: 80px;',
                '    box-sizing: border-box;',
                '}'
            ].join('\n');
            document.head.appendChild(style);
        },

        // 初始化 IntersectionObserver
        initObserver: function () {
            if (this.observer) return;
            if (!('IntersectionObserver' in window)) return;
            var self = this;
            this.observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var img = entry.target;
                        self.handleVisible(img);
                        self.observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '100px',
                threshold: 0.01
            });
        },

        // 在 DOMContentLoaded 时调用
        init: function () {
            var self = this;
            this.injectStyles();
            this.initObserver();

            var setup = function () {
                var imgs = document.querySelectorAll('img');
                imgs.forEach(function (img) {
                    // 添加懒加载与异步解码属性
                    img.setAttribute('loading', 'lazy');
                    img.setAttribute('decoding', 'async');
                    // 为每个 img 添加 onerror 处理
                    self.attachError(img);
                    // 使用 IntersectionObserver 监听图片进入视口
                    self.observe(img);
                });
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setup);
            } else {
                setup();
            }

            // 全局错误处理：捕获图片加载错误（捕获阶段，资源错误不冒泡）
            window.addEventListener('error', function (e) {
                var target = e.target;
                if (target && target.tagName === 'IMG' && target.src) {
                    self.handleError(target);
                }
            }, true);
        },

        // 为单个 img 绑定 error 事件
        attachError: function (img) {
            var self = this;
            img.addEventListener('error', function () {
                self.handleError(img);
            });
        },

        // 图片进入视口时添加 .img-loading 类
        handleVisible: function (img) {
            // 若已加载完成则不添加 loading 状态
            if (img.complete && img.naturalWidth > 0) return;
            img.classList.add('img-loading');
        },

        // 监听单个图片元素
        observe: function (img) {
            var self = this;

            // 加载完成（load 事件）时移除 .img-loading，添加 .img-loaded
            var onLoad = function () {
                img.classList.remove('img-loading');
                img.classList.add('img-loaded');
            };

            if (img.complete && img.naturalWidth > 0) {
                // 已缓存加载完成，直接标记 loaded
                img.classList.add('img-loaded');
            } else {
                img.addEventListener('load', onLoad);
            }

            if (this.observer) {
                this.observer.observe(img);
            } else {
                // 不支持 IntersectionObserver，直接标记可见
                this.handleVisible(img);
            }
        },

        // 加载失败时替换为字母占位 div
        handleError: function (img) {
            if (img.dataset.errorReplaced === '1') return;
            img.dataset.errorReplaced = '1';

            var placeholder = document.createElement('div');
            placeholder.className = 'img-error';
            var alt = img.getAttribute('alt') || img.getAttribute('data-alt') || '图';
            var firstChar = alt.trim().charAt(0) || '图';
            placeholder.textContent = firstChar;

            // 继承原图片尺寸（若有）
            if (img.width) placeholder.style.width = img.width + 'px';
            if (img.height) placeholder.style.height = img.height + 'px';

            if (img.parentNode) {
                img.parentNode.replaceChild(placeholder, img);
            }
        },

        // 重新加载图片
        reload: function (img) {
            // 重置状态标记
            img.classList.remove('img-loading', 'img-loaded');
            img.dataset.errorReplaced = '';

            var src = img.getAttribute('src') || img.dataset.src;
            if (src) {
                // 添加时间戳避免缓存
                var sep = src.indexOf('?') >= 0 ? '&' : '?';
                img.setAttribute('src', src + sep + '_t=' + Date.now());
            }
        }
    };

    // 暴露全局对象
    window.ImageLoader = ImageLoader;

    // 自动初始化
    ImageLoader.init();
})();
