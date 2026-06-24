// generate-svg-avatars.js - 为每个角色生成独特的SVG头像
// 包含渐变背景、角色名、Emoji、作品来源
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'public', 'images', 'characters');
const ITEMS_DIR = path.join(__dirname, 'public', 'images', 'items');

// 确保目录存在
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(ITEMS_DIR)) fs.mkdirSync(ITEMS_DIR, { recursive: true });

// 角色数据：emoji + 渐变色 + 文件名
const characters = [
    { id: 1, name: '孙悟空', emoji: '🐵', source: '西游记', file: 'sun_wukong.svg', c1: '#f093fb', c2: '#f5576c' },
    { id: 2, name: '迪迦', emoji: '🔴', source: '奥特曼', file: 'dijia.svg', c1: '#667eea', c2: '#764ba2' },
    { id: 3, name: '诸葛亮', emoji: '🪶', source: '三国演义', file: 'zhuge_liang.svg', c1: '#11998e', c2: '#38ef7d' },
    { id: 4, name: '关羽', emoji: '⚔️', source: '三国演义', file: 'guan_yu.svg', c1: '#f6d365', c2: '#fda085' },
    { id: 5, name: '鲁智深', emoji: '🪈', source: '水浒传', file: 'lu_zhishen.svg', c1: '#fc4a1a', c2: '#f7b733' },
    { id: 6, name: '林黛玉', emoji: '🌸', source: '红楼梦', file: 'lin_daiyu.svg', c1: '#a18cd1', c2: '#fbc2eb' },
    { id: 7, name: '哪吒', emoji: '🔥', source: '封神演义', file: 'ne_zha.svg', c1: '#ff6b6b', c2: '#ee5a6f' },
    { id: 8, name: '姜子牙', emoji: '🎣', source: '封神演义', file: 'jiang_ziya.svg', c1: '#4facfe', c2: '#00f2fe' },
    { id: 9, name: '武松', emoji: '🐯', source: '水浒传', file: 'wu_song.svg', c1: '#fa709a', c2: '#fee140' },
    { id: 10, name: '白素贞', emoji: '🐍', source: '白蛇传', file: 'bai_suzhen.svg', c1: '#a8edea', c2: '#fed6e3' },
    { id: 11, name: '后羿', emoji: '🏹', source: '山海经', file: 'hou_yi.svg', c1: '#f6d365', c2: '#fda085' },
    { id: 12, name: '貂蝉', emoji: '💃', source: '三国演义', file: 'diao_chan.svg', c1: '#ff9a9e', c2: '#fad0c4' },
    { id: 13, name: '二郎神', emoji: '👁️', source: '封神演义', file: 'er_lang_shen.svg', c1: '#667eea', c2: '#764ba2' },
    { id: 14, name: '项羽', emoji: '👑', source: '史记', file: 'xiang_yu.svg', c1: '#0ba360', c2: '#3cba92' }
];

// 道具数据
const items = [
    { name: '如意金箍棒', emoji: '🦯', file: 'jin_gu_bang.svg', c1: '#FFD700', c2: '#FFA500' },
    { name: '青龙偃月刀', emoji: '🗡️', file: 'qing_long_dao.svg', c1: '#006400', c2: '#32CD32' },
    { name: '风火轮', emoji: '🎡', file: 'feng_huo_lun.svg', c1: '#FF4500', c2: '#FFD700' },
    { name: '打神鞭', emoji: '⚡', file: 'da_shen_bian.svg', c1: '#4B0082', c2: '#9370DB' },
    { name: '射日神弓', emoji: '🏹', file: 'she_ri_gong.svg', c1: '#FF8C00', c2: '#FFD700' },
    { name: '斩妖剑', emoji: '⚔️', file: 'zhan_yao_jian.svg', c1: '#4682B4', c2: '#87CEEB' }
];

// 生成角色SVG头像
function generateCharSVG(char) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
  <defs>
    <linearGradient id="bg${char.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${char.c1}"/>
      <stop offset="100%" style="stop-color:${char.c2}"/>
    </linearGradient>
    <radialGradient id="glow${char.id}" cx="50%" cy="40%" r="50%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.3)"/>
      <stop offset="100%" style="stop-color:rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="400" height="500" fill="url(#bg${char.id})"/>
  <rect width="400" height="500" fill="url(#glow${char.id})"/>
  <!-- 装饰圆环 -->
  <circle cx="200" cy="180" r="120" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
  <circle cx="200" cy="180" r="100" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  <!-- Emoji -->
  <text x="200" y="220" font-size="120" text-anchor="middle" dominant-baseline="middle">${char.emoji}</text>
  <!-- 角色名 -->
  <text x="200" y="360" font-size="48" font-weight="bold" text-anchor="middle" fill="white" font-family="Microsoft YaHei, sans-serif" style="text-shadow: 0 2px 8px rgba(0,0,0,0.5)">${char.name}</text>
  <!-- 作品来源 -->
  <text x="200" y="410" font-size="22" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-family="Microsoft YaHei, sans-serif">《${char.source}》</text>
  <!-- 底部装饰线 -->
  <line x1="120" y1="440" x2="280" y2="440" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
  <text x="200" y="470" font-size="14" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="Microsoft YaHei, sans-serif">万卷浮生</text>
</svg>`;
}

// 生成道具SVG
function generateItemSVG(item) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <defs>
    <linearGradient id="bg_${item.file}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${item.c1}"/>
      <stop offset="100%" style="stop-color:${item.c2}"/>
    </linearGradient>
    <radialGradient id="glow_${item.file}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.4)"/>
      <stop offset="100%" style="stop-color:rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="300" height="300" fill="url(#bg_${item.file})" rx="20"/>
  <rect width="300" height="300" fill="url(#glow_${item.file})" rx="20"/>
  <circle cx="150" cy="130" r="80" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
  <text x="150" y="155" font-size="80" text-anchor="middle" dominant-baseline="middle">${item.emoji}</text>
  <text x="150" y="240" font-size="24" font-weight="bold" text-anchor="middle" fill="white" font-family="Microsoft YaHei, sans-serif">${item.name}</text>
</svg>`;
}

// 主函数
function main() {
    console.log('========================================');
    console.log('  万卷浮生 - SVG头像生成');
    console.log('========================================\n');

    // 生成角色头像
    console.log('【角色头像生成】');
    characters.forEach((char, i) => {
        const filePath = path.join(OUTPUT_DIR, char.file);
        const svg = generateCharSVG(char);
        fs.writeFileSync(filePath, svg, 'utf8');
        console.log(`[${i + 1}/${characters.length}] ✓ ${char.name} → ${char.file}`);
    });

    // 生成道具图标
    console.log('\n【道具图标生成】');
    items.forEach((item, i) => {
        const filePath = path.join(ITEMS_DIR, item.file);
        const svg = generateItemSVG(item);
        fs.writeFileSync(filePath, svg, 'utf8');
        console.log(`[${i + 1}/${items.length}] ✓ ${item.name} → ${item.file}`);
    });

    console.log('\n========================================');
    console.log('  全部SVG头像生成完成！');
    console.log('========================================');
}

main();
