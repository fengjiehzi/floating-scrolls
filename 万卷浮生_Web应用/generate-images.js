// generate-images.js - 批量生成角色与道具图片
// 使用 TRAE 图片生成API
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';
const OUTPUT_DIR = path.join(__dirname, 'public', 'images');

// 14个角色的图片生成提示词（根据小说原作提取）
const characterPrompts = {
    // 西游记 - 孙悟空
    1: {
        name: '孙悟空',
        file: 'characters/sun_wukong.png',
        prompt: 'Sun Wukong Monkey King from Journey to the West, muscular monkey warrior with golden fur, wearing golden armor and red cape, holding golden staff Ruyi Jingu Bang, fierce golden eyes with red eyeshadow, standing on cloud, dynamic heroic pose, Chinese mythology art style, vibrant colors, digital painting, highly detailed, fantasy game character card art, portrait orientation'
    },
    // 奥特曼 - 迪迦
    2: {
        name: '迪迦',
        file: 'characters/dijia.png',
        prompt: 'Ultraman Tiga giant silver and red superhero warrior, glowing color timer on chest, red and silver armored suit, heroic stance, light beam attack pose, futuristic sci-fi tokusatsu hero, dramatic lighting, digital illustration, game character card art, full body, vibrant colors'
    },
    // 三国演义 - 诸葛亮
    3: {
        name: '诸葛亮',
        file: 'characters/zhuge_liang.png',
        prompt: 'Zhuge Liang brilliant strategist from Romance of Three Kingdoms, elegant scholar wearing white robe with crane feather fan, long black beard, wise calm expression, holding feather fan, standing in bamboo pavilion, traditional Chinese ink painting style mixed with digital art, scholarly atmosphere, portrait'
    },
    // 三国演义 - 关羽
    4: {
        name: '关羽',
        file: 'characters/guan_yu.png',
        prompt: 'Guan Yu mighty warrior from Three Kingdoms, tall imposing figure with long red beard, green robe, holding Green Dragon Crescent Blade polearm, fierce loyal expression, riding red horse, traditional Chinese warrior general, dramatic heroic pose, digital painting, game character art'
    },
    // 水浒传 - 鲁智深
    5: {
        name: '鲁智深',
        file: 'characters/lu_zhishen.png',
        prompt: 'Lu Zhishen tattooed warrior monk from Water Margin, muscular bald monk with tattoos, black monk robe, holding iron monk spade staff, fierce wild expression, drinking gourd, Chinese outlaw hero, dynamic action pose, digital illustration, game character card'
    },
    // 红楼梦 - 林黛玉
    6: {
        name: '林黛玉',
        file: 'characters/lin_daiyu.png',
        prompt: 'Lin Daiyu delicate beauty from Dream of Red Chamber, slender elegant young woman in flowing pink and white hanfu, melancholic poetic expression, long black hair with flower hairpin, holding silk handkerchief, standing among falling cherry blossoms, Chinese classical beauty, soft watercolor style'
    },
    // 封神演义 - 哪吒
    7: {
        name: '哪吒',
        file: 'characters/ne_zha.png',
        prompt: 'Ne Zha youthful warrior deity from Investiture of the Gods, young boy warrior with double hair buns, red and gold armor, holding fire-tipped spear, standing on Wind Fire Wheels with flames, red armillary sash flying, fierce determined expression, Chinese mythology, dynamic pose'
    },
    // 封神演义 - 姜子牙
    8: {
        name: '姜子牙',
        file: 'characters/jiang_ziya.png',
        prompt: 'Jiang Ziya elderly wise sage from Fengshen Yanyi, white bearded old man in blue Taoist robe, holding fishing rod and divine whip, calm wisdom expression, standing by river, mystical Taoist atmosphere, Chinese mythology deity, traditional digital painting, portrait'
    },
    // 水浒传 - 武松
    9: {
        name: '武松',
        file: 'characters/wu_song.png',
        prompt: 'Wu Song fierce tiger-fighting hero from Water Margin, muscular young warrior in brown clothes, holding twin swords, fierce brave expression, tiger tattoo on arm, fighting tiger pose, Chinese outlaw hero, dynamic action illustration, game character art'
    },
    // 白蛇传 - 白素贞
    10: {
        name: '白素贞',
        file: 'characters/bai_suzhen.png',
        prompt: 'Bai Suzhen white snake spirit from Legend of White Snake, elegant beautiful woman in white flowing hanfu dress, long black hair with white flower, gentle mystical expression, white snake motif, standing by West Lake, Chinese mythology, ethereal digital painting'
    },
    // 山海经 - 后羿
    11: {
        name: '后羿',
        file: 'characters/hou_yi.png',
        prompt: 'Hou Yi legendary archer hero from Chinese mythology, muscular warrior in leather armor, drawing large divine bow, shooting at nine suns in sky, determined heroic expression, ancient Chinese hero, epic dramatic pose, digital painting, game character art'
    },
    // 三国演义 - 貂蝉
    12: {
        name: '貂蝉',
        file: 'characters/diao_chan.png',
        prompt: 'Diao Chan one of Four Beauties of ancient China, graceful dancer in elegant red and gold hanfu, long black hair with jade hairpin, alluring intelligent expression, holding silk fan, dancing pose, Chinese classical beauty, ornate digital illustration'
    },
    // 封神演义 - 二郎神
    13: {
        name: '二郎神',
        file: 'characters/er_lang_shen.png',
        prompt: 'Erlang Shen warrior deity with third eye on forehead, fierce divine general in silver and blue armor, holding three-pointed double-edged lance, celestial hound dog beside him, majestic powerful stance, Chinese mythology god, digital painting, game character art'
    },
    // 史记 - 项羽
    14: {
        name: '项羽',
        file: 'characters/xiang_yu.png',
        prompt: 'Xiang Yu Hegemon-King of Western Chu, towering muscular warrior king in black and gold armor, fierce commanding expression, holding massive halberd, standing on battlefield, Chinese historical hero, dramatic heroic portrait, digital painting'
    }
};

// 道具图片提示词
const itemPrompts = {
    'jin_gu_bang': {
        name: '如意金箍棒',
        file: 'items/jin_gu_bang.png',
        prompt: 'Ruyi Jingu Bang golden staff weapon of Sun Wukong, glowing golden iron staff with dragon carvings, mystical aura, floating on cloud background, fantasy game item icon, golden glowing effect, digital art, square composition'
    },
    'qing_long_dao': {
        name: '青龙偃月刀',
        file: 'items/qing_long_dao.png',
        prompt: 'Green Dragon Crescent Blade guandao polearm weapon of Guan Yu, long blade with dragon engraving, green energy aura, traditional Chinese weapon, fantasy game item icon, dramatic lighting, digital art'
    },
    'feng_huo_lun': {
        name: '风火轮',
        file: 'items/feng_huo_lun.png',
        prompt: 'Wind Fire Wheels divine weapon of Ne Zha, two glowing wheels with red flames and golden rims, floating with fire trails, Chinese mythology artifact, fantasy game item icon, vibrant fire effects, digital art'
    },
    'da_shen_bian': {
        name: '打神鞭',
        file: 'items/da_shen_bian.png',
        prompt: 'God-Striking Whip divine weapon of Jiang Ziya, glowing jade green whip with mystical runes, golden energy aura, Chinese mythology artifact, fantasy game item icon, dramatic lighting, digital art'
    },
    'she_ri_gong': {
        name: '射日神弓',
        file: 'items/she_ri_gong.png',
        prompt: 'Sun-Shooting Divine Bow of Hou Yi, massive golden longbow with sun motifs, glowing golden energy string, celestial aura, Chinese mythology weapon, fantasy game item icon, epic dramatic lighting, digital art'
    },
    'zhan_yao_jian': {
        name: '斩妖剑',
        file: 'items/zhan_yao_jian.png',
        prompt: 'Demon-Slaying Sword mystical Chinese blade, silver steel sword with golden guard, blue spiritual energy aura, glowing runes on blade, fantasy game item icon, dramatic lighting, digital art'
    }
};

// 下载图片（跟随重定向）
function downloadImage(prompt, outputPath, image_size = 'portrait_4_3') {
    return new Promise((resolve, reject) => {
        const url = `${API_BASE}?prompt=${encodeURIComponent(prompt)}&image_size=${image_size}`;

        function fetchImage(fetchUrl, redirectCount = 0) {
            if (redirectCount > 5) {
                reject(new Error('重定向次数过多'));
                return;
            }
            const file = fs.createWriteStream(outputPath);

            https.get(fetchUrl, (response) => {
                // 处理重定向
                if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
                    file.close();
                    fs.unlink(outputPath, () => {});
                    const newUrl = response.headers.location;
                    if (newUrl) {
                        fetchImage(newUrl, redirectCount + 1);
                    } else {
                        reject(new Error('重定向但无location'));
                    }
                    return;
                }
                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlink(outputPath, () => {});
                    reject(new Error(`HTTP ${response.statusCode}`));
                    return;
                }
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(outputPath);
                });
                file.on('error', (err) => {
                    fs.unlink(outputPath, () => {});
                    reject(err);
                });
            }).on('error', (err) => {
                file.close();
                fs.unlink(outputPath, () => {});
                reject(err);
            });
        }

        fetchImage(url);
    });
}

// 主函数
async function main() {
    console.log('========================================');
    console.log('  万卷浮生 - 图片批量生成');
    console.log('========================================\n');

    // 生成角色图片
    console.log('【角色图片生成】');
    const charEntries = Object.entries(characterPrompts);
    for (let i = 0; i < charEntries.length; i++) {
        const [id, info] = charEntries[i];
        const outputPath = path.join(OUTPUT_DIR, info.file);
        if (fs.existsSync(outputPath)) {
            console.log(`[${i+1}/${charEntries.length}] ${info.name} - 已存在，跳过`);
            continue;
        }
        console.log(`[${i+1}/${charEntries.length}] 生成 ${info.name}...`);
        try {
            await downloadImage(info.prompt, outputPath, 'portrait_4_3');
            console.log(`  ✓ 完成: ${info.file}`);
        } catch (err) {
            console.error(`  ✗ 失败: ${err.message}`);
        }
        // 间隔避免请求过快
        await new Promise(r => setTimeout(r, 1500));
    }

    // 生成道具图片
    console.log('\n【道具图片生成】');
    const itemEntries = Object.entries(itemPrompts);
    for (let i = 0; i < itemEntries.length; i++) {
        const [id, info] = itemEntries[i];
        const outputPath = path.join(OUTPUT_DIR, info.file);
        if (fs.existsSync(outputPath)) {
            console.log(`[${i+1}/${itemEntries.length}] ${info.name} - 已存在，跳过`);
            continue;
        }
        console.log(`[${i+1}/${itemEntries.length}] 生成 ${info.name}...`);
        try {
            await downloadImage(info.prompt, outputPath, 'square');
            console.log(`  ✓ 完成: ${info.file}`);
        } catch (err) {
            console.error(`  ✗ 失败: ${err.message}`);
        }
        await new Promise(r => setTimeout(r, 1500));
    }

    console.log('\n========================================');
    console.log('  全部图片生成完成！');
    console.log('========================================');
}

main().catch(console.error);
