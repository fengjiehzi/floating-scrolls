// icons.js - 典籍风 SVG 图标库 v=20260701a
(function (global) {
    "use strict";

    // 20 个典籍风 SVG 图标（仅内部元素，不含外层 <svg>）
    // viewBox 0 0 24 24，stroke=currentColor，stroke-width=1.5，圆角线帽
    var icons = {
        // 1. library（卷轴）：矩形 + 两侧卷轴轴头 + 中间水平线
        library:
            '<rect x="6" y="5" width="12" height="14" rx="1"></rect>' +
            '<rect x="3" y="6" width="3" height="12" rx="1.5"></rect>' +
            '<rect x="18" y="6" width="3" height="12" rx="1.5"></rect>' +
            '<line x1="9" y1="9" x2="15" y2="9"></line>' +
            '<line x1="9" y1="12" x2="15" y2="12"></line>' +
            '<line x1="9" y1="15" x2="13" y2="15"></line>',

        // 2. story（毛笔）：斜线笔杆 + 笔尖三角形 + 底部墨点
        story:
            '<line x1="6" y1="4" x2="14" y2="12"></line>' +
            '<polygon points="13,11 17,15 15,17 11,13"></polygon>' +
            '<circle cx="6" cy="5" r="0.8" fill="currentColor" stroke="none"></circle>' +
            '<circle cx="18" cy="19" r="1" fill="currentColor" stroke="none"></circle>',

        // 3. characters（人物剪影）：圆头 + 三角形身体
        characters:
            '<circle cx="12" cy="6" r="2.5"></circle>' +
            '<polygon points="12,9 18,20 6,20"></polygon>',

        // 4. items（令牌）：圆形外框 + 内部方框 + 顶部小圆环
        items:
            '<circle cx="12" cy="13" r="7"></circle>' +
            '<rect x="9" y="10" width="6" height="6" rx="0.5"></rect>' +
            '<circle cx="12" cy="3" r="1.5"></circle>' +
            '<line x1="12" y1="4.5" x2="12" y2="6"></line>',

        // 5. lobby（灯笼）：椭圆形灯身 + 顶部细线 + 底部流苏线
        lobby:
            '<ellipse cx="12" cy="12" rx="6" ry="7"></ellipse>' +
            '<line x1="12" y1="3" x2="12" y2="5"></line>' +
            '<line x1="12" y1="19" x2="12" y2="22"></line>' +
            '<line x1="9" y1="22" x2="15" y2="22"></line>' +
            '<line x1="7" y1="12" x2="17" y2="12"></line>',

        // 6. aiSettings（阴阳鱼）：圆形 + S 形分割线 + 两个小圆点
        aiSettings:
            '<circle cx="12" cy="12" r="9"></circle>' +
            '<path d="M12 3 A 4.5 4.5 0 0 1 12 12 A 4.5 4.5 0 0 0 12 21"></path>' +
            '<circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none"></circle>' +
            '<circle cx="12" cy="16.5" r="1"></circle>',

        // 7. saves（印章盒）：方形盒 + 顶部盖 + 内部小方形印章
        saves:
            '<rect x="4" y="9" width="16" height="11" rx="1"></rect>' +
            '<rect x="3" y="6" width="18" height="4" rx="1"></rect>' +
            '<rect x="9" y="12" width="6" height="6" rx="0.5"></rect>',

        // 8. upload（竹简上传）：向上箭头 + 底部横线
        upload:
            '<line x1="12" y1="4" x2="12" y2="16"></line>' +
            '<polyline points="6,10 12,4 18,10"></polyline>' +
            '<line x1="4" y1="20" x2="20" y2="20"></line>',

        // 9. extract（开卷）：展开卷轴 + 中线
        extract:
            '<rect x="3" y="6" width="18" height="12" rx="1"></rect>' +
            '<rect x="2" y="7" width="2" height="10" rx="1"></rect>' +
            '<rect x="20" y="7" width="2" height="10" rx="1"></rect>' +
            '<line x1="12" y1="6" x2="12" y2="18"></line>',

        // 10. battle（剑戟交叉）：两条交叉斜线 + 护手横线
        battle:
            '<line x1="5" y1="19" x2="19" y2="5"></line>' +
            '<line x1="5" y1="5" x2="19" y2="19"></line>' +
            '<line x1="9" y1="9" x2="15" y2="9"></line>' +
            '<line x1="9" y1="15" x2="15" y2="15"></line>',

        // 11. unlock（钥匙）：圆环 + 长柄 + 末端齿
        unlock:
            '<circle cx="8" cy="12" r="4"></circle>' +
            '<line x1="12" y1="12" x2="21" y2="12"></line>' +
            '<line x1="18" y1="12" x2="18" y2="15"></line>' +
            '<line x1="21" y1="12" x2="21" y2="15"></line>',

        // 12. close（×）：两条交叉斜线
        close:
            '<line x1="6" y1="6" x2="18" y2="18"></line>' +
            '<line x1="18" y1="6" x2="6" y2="18"></line>',

        // 13. check（√）：勾选路径
        check:
            '<polyline points="4,12 10,18 20,6"></polyline>',

        // 14. arrowRight：向右箭头
        arrowRight:
            '<line x1="4" y1="12" x2="20" y2="12"></line>' +
            '<polyline points="14,6 20,12 14,18"></polyline>',

        // 15. arrowLeft：向左箭头
        arrowLeft:
            '<line x1="4" y1="12" x2="20" y2="12"></line>' +
            '<polyline points="10,6 4,12 10,18"></polyline>',

        // 16. loading（太极）：圆形 + S 形分割（无小圆点）
        loading:
            '<circle cx="12" cy="12" r="9"></circle>' +
            '<path d="M12 3 A 4.5 4.5 0 0 1 12 12 A 4.5 4.5 0 0 0 12 21"></path>',

        // 17. success（朱砂印）：方形印章 + 内部十字（"印"字简化）
        success:
            '<rect x="4" y="4" width="16" height="16" rx="1"></rect>' +
            '<line x1="12" y1="7" x2="12" y2="17"></line>' +
            '<line x1="8" y1="12" x2="16" y2="12"></line>',

        // 18. error（墨渍）：不规则圆形 + 飞溅小点
        error:
            '<path d="M12 4 C 16 4 20 7 20 12 C 20 16 17 20 12 20 C 8 20 4 17 4 12 C 4 8 7 4 12 4 Z"></path>' +
            '<circle cx="5" cy="6" r="0.8" fill="currentColor" stroke="none"></circle>' +
            '<circle cx="19" cy="7" r="0.6" fill="currentColor" stroke="none"></circle>' +
            '<circle cx="6" cy="19" r="0.7" fill="currentColor" stroke="none"></circle>' +
            '<circle cx="20" cy="18" r="0.5" fill="currentColor" stroke="none"></circle>',

        // 19. warning（铜铃）：钟形 + 顶部圆环 + 底部摆锤
        warning:
            '<path d="M6 16 L6 10 A 6 6 0 0 1 18 10 L18 16 Z"></path>' +
            '<line x1="5" y1="16" x2="19" y2="16"></line>' +
            '<circle cx="12" cy="4" r="1"></circle>' +
            '<line x1="12" y1="16" x2="12" y2="20"></line>' +
            '<circle cx="12" cy="21" r="1" fill="currentColor" stroke="none"></circle>',

        // 20. settings（齿轮）：圆形 + 8 个外伸小矩形齿
        settings:
            '<circle cx="12" cy="12" r="4"></circle>' +
            '<line x1="12" y1="2" x2="12" y2="5"></line>' +
            '<line x1="12" y1="19" x2="12" y2="22"></line>' +
            '<line x1="2" y1="12" x2="5" y2="12"></line>' +
            '<line x1="19" y1="12" x2="22" y2="12"></line>' +
            '<line x1="5" y1="5" x2="7" y2="7"></line>' +
            '<line x1="17" y1="17" x2="19" y2="19"></line>' +
            '<line x1="19" y1="5" x2="17" y2="7"></line>' +
            '<line x1="7" y1="17" x2="5" y2="19"></line>'
    };

    // Icons 对外接口
    var Icons = {
        // 图标库
        icons: icons,

        // 渲染为完整 HTML
        render: function (name, options) {
            options = options || {};
            var size = options.size || 24;
            var className = options.className || "";
            var body = icons[name];
            if (!body) {
                return "";
            }
            return '<svg class="icon ' + className + '" width="' + size + '" height="' + size +
                '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" ' +
                'stroke-linecap="round" stroke-linejoin="round">' + body + '</svg>';
        },

        // 检查图标是否存在
        has: function (name) {
            return Object.prototype.hasOwnProperty.call(icons, name);
        }
    };

    global.Icons = Icons;
})(window);
