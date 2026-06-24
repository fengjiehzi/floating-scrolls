// ws-server.js - WebSocket对战服务器
const { WebSocketServer } = require('ws');
const url = require('url');
const { verifyToken } = require('./auth');
const db = require('./db');
const battleEngine = require('./battle-engine');

// 在线玩家Map: userId -> {ws, user, status, character_id}
const onlineUsers = new Map();
// 机器人玩家Map: userId -> {user, status, character_id}
const botUsers = new Map();
// 匹配队列: [{userId, character_id, ws, join_time, is_bot, formIndex}]
const matchQueue = [];
// 进行中的战斗: battle_id -> battleState
const activeBattles = new Map();
// 待处理邀请: invite_id -> {inviter_id, target_id, inviter_char_id, inviter_form_index, target_form_index, created_at}
const pendingInvites = new Map();

// 发送消息给客户端
function sendMsg(ws, msg) {
    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(msg));
    }
}

// 初始化机器人上线
function initBots() {
    const bots = db.prepare("SELECT * FROM users WHERE username LIKE 'bot_%'").all();
    bots.forEach(bot => {
        botUsers.set(bot.id, {
            user: bot,
            status: 'lobby',
            character_id: null
        });
    });
    console.log(`[WS] 已加载 ${botUsers.size} 个机器人玩家`);
}

// 获取所有在线用户（真人+机器人）
function getAllOnlineUsers() {
    const allUsers = [];
    onlineUsers.forEach(u => allUsers.push({
        id: u.user.id,
        username: u.user.username,
        nickname: u.user.nickname,
        avatar: u.user.avatar,
        wins: u.user.wins,
        losses: u.user.losses,
        status: u.status,
        is_bot: false
    }));
    botUsers.forEach(b => allUsers.push({
        id: b.user.id,
        username: b.user.username,
        nickname: b.user.nickname,
        avatar: b.user.avatar,
        wins: b.user.wins,
        losses: b.user.losses,
        status: b.status,
        is_bot: true
    }));
    return allUsers;
}

// 广播大厅更新给所有在线玩家（包含机器人）
function broadcastLobbyUpdate() {
    const onlineList = getAllOnlineUsers();
    const msg = {
        type: 'lobby_update',
        online_users: onlineList,
        matchmaking_queue: matchQueue.length,
        total_online: onlineList.length
    };
    onlineUsers.forEach(u => sendMsg(u.ws, msg));
}

// 获取角色完整数据（可选传入userId以获取level和属性加成）
function getCharacterById(charId, userId) {
    const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(charId);
    if (!row) return null;

    let level = 1;
    let statBonus = 0;

    // 如果提供了userId，查询user_characters获取level
    if (userId) {
        const uc = db.prepare('SELECT level FROM user_characters WHERE user_id = ? AND character_id = ?').get(userId, charId);
        if (uc) {
            level = uc.level || 1;
            // 属性加成：每级+2%（level 1时为0%）
            statBonus = (level - 1) * 0.02;
        }
    }

    return {
        id: row.id,
        name: row.name,
        grade: row.grade,
        source: row.source,
        gradient: row.gradient,
        image: row.image,
        stats: JSON.parse(row.stats_json),
        skills: JSON.parse(row.skills_json),
        forms: JSON.parse(row.forms_json),
        source_basis: row.source_basis,
        level: level,
        stat_bonus: statBonus
    };
}

// 根据level计算属性加成（每级+2%）
function applyStatBonus(char) {
    if (!char || !char.stat_bonus || char.stat_bonus <= 0) return;
    const bonus = 1 + char.stat_bonus;
    // 对所有数值属性应用加成
    if (char.stats) {
        for (const key of ['power', 'speed', 'intelligence', 'defense', 'special_ability', 'hp', 'mp']) {
            if (typeof char.stats[key] === 'number') {
                char.stats[key] = Math.round(char.stats[key] * bonus);
            }
        }
    }
}

// 发放经验（只针对真人玩家）
function grantExp(userId, charId, expGained) {
    // 查询当前level, exp, unlocked_forms
    const uc = db.prepare('SELECT level, exp, unlocked_forms FROM user_characters WHERE user_id = ? AND character_id = ?').get(userId, charId);
    if (!uc) {
        return null; // 用户不拥有该角色
    }

    let level = uc.level || 1;
    let exp = (uc.exp || 0) + expGained;
    let unlockedForms = JSON.parse(uc.unlocked_forms || '[]');

    // 确保形态0默认解锁
    if (!unlockedForms.includes(0)) {
        unlockedForms.push(0);
    }

    const oldLevel = level;
    let formUnlocked = false;

    // 检查升级：while (exp >= level * 100 && level < 10)
    while (exp >= level * 100 && level < 10) {
        exp -= level * 100;
        level++;
    }

    // 查询角色的forms数据
    const char = db.prepare('SELECT forms_json FROM characters WHERE id = ?').get(charId);
    const forms = char ? JSON.parse(char.forms_json || '[]') : [];

    // 检查形态解锁
    // level >= 3 且 forms.length >= 2 且 unlocked_forms 不含 1：解锁形态2
    if (level >= 3 && forms.length >= 2 && !unlockedForms.includes(1)) {
        unlockedForms.push(1);
        formUnlocked = true;
    }
    // level >= 6 且 forms.length >= 3 且 unlocked_forms 不含 2：解锁形态3
    if (level >= 6 && forms.length >= 3 && !unlockedForms.includes(2)) {
        unlockedForms.push(2);
        formUnlocked = true;
    }

    // 更新user_characters表
    db.prepare('UPDATE user_characters SET level = ?, exp = ?, unlocked_forms = ? WHERE user_id = ? AND character_id = ?')
        .run(level, exp, JSON.stringify(unlockedForms), userId, charId);

    return {
        exp_gained: expGained,
        level_up: level > oldLevel,
        new_level: level,
        form_unlocked: formUnlocked
    };
}

// 保存战斗记录到数据库
function saveBattleResult(battleState, player1Id, player2Id, player1CharId, player2CharId) {
    const winnerId = battleState.winner === 1 ? player1Id : player2Id;
    const loserId = battleState.winner === 1 ? player2Id : player1Id;
    const battleLogJson = JSON.stringify(battleState.rounds);

    db.prepare(`
        INSERT INTO battles (player1_id, player2_id, player1_char_id, player2_char_id, winner_id, total_rounds, battle_log_json, narration, battle_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pvp')
    `).run(
        player1Id, player2Id, player1CharId, player2CharId,
        winnerId, battleState.total_rounds, battleLogJson, battleState.narration
    );

    // 更新双方战绩
    db.prepare('UPDATE users SET wins = wins + 1 WHERE id = ?').run(winnerId);
    db.prepare('UPDATE users SET losses = losses + 1 WHERE id = ?').run(loserId);

    // 刷新内存中的用户数据
    const winnerUser = db.prepare('SELECT id, username, nickname, avatar, wins, losses FROM users WHERE id = ?').get(winnerId);
    const loserUser = db.prepare('SELECT id, username, nickname, avatar, wins, losses FROM users WHERE id = ?').get(loserId);
    if (onlineUsers.has(winnerId)) {
        onlineUsers.get(winnerId).user = winnerUser;
    }
    if (onlineUsers.has(loserId)) {
        onlineUsers.get(loserId).user = loserUser;
    }
    // 同步机器人内存数据
    if (botUsers.has(winnerId)) {
        botUsers.get(winnerId).user = winnerUser;
    }
    if (botUsers.has(loserId)) {
        botUsers.get(loserId).user = loserUser;
    }

    // ===== 经验发放（只针对真人玩家）=====
    // 判断是否为快速胜利（3回合内获胜）
    const isFastWin = battleState.rounds.length <= 3;
    // 胜利方经验：基础50exp，快速胜利80exp
    const winnerExpGained = isFastWin ? 80 : 50;
    // 失败方经验：10exp
    const loserExpGained = 10;

    const expResult = {};

    // 为胜利方发放经验（只针对真人玩家，不针对机器人）
    if (!botUsers.has(winnerId)) {
        const winnerCharId = winnerId === player1Id ? player1CharId : player2CharId;
        expResult.winner = grantExp(winnerId, winnerCharId, winnerExpGained);
    }
    // 为失败方发放经验（只针对真人玩家，不针对机器人）
    if (!botUsers.has(loserId)) {
        const loserCharId = loserId === player1Id ? player1CharId : player2CharId;
        expResult.loser = grantExp(loserId, loserCharId, loserExpGained);
    }

    return { winnerId, loserId, expResult };
}

// 开始战斗（服务端驱动）
function startBattle(player1Id, player2Id, player1CharId, player2CharId, player1FormIndex, player2FormIndex) {
    const char1 = getCharacterById(player1CharId, player1Id);
    const char2 = getCharacterById(player2CharId, player2Id);
    if (!char1 || !char2) return;
    // 根据level计算属性加成（每级+2%）
    applyStatBonus(char1);
    applyStatBonus(char2);

    const battleId = 'battle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // 执行完整战斗（传递形态索引，默认0向后兼容）
    const battleState = battleEngine.executeBattle(char1, char2, player1FormIndex || 0, player2FormIndex || 0);

    // 存储战斗状态
    activeBattles.set(battleId, {
        battleId,
        player1Id, player2Id,
        player1CharId, player2CharId,
        player1FormIndex: player1FormIndex || 0,
        player2FormIndex: player2FormIndex || 0,
        char1, char2,
        battleState,
        currentRound: 0
    });

    const p1Ws = onlineUsers.get(player1Id)?.ws;
    const p2Ws = onlineUsers.get(player2Id)?.ws;

    // 通知双方战斗开始
    if (p1Ws) {
        sendMsg(p1Ws, {
            type: 'battle_start',
            battle_id: battleId,
            you_first: battleState.battleState?.firstAttacker === 1 || char1.stats.speed >= char2.stats.speed,
            your_char: char1,
            opponent_char: char2,
            opponent: onlineUsers.get(player2Id)?.user,
            your_form_index: player1FormIndex || 0
        });
    }
    if (p2Ws) {
        sendMsg(p2Ws, {
            type: 'battle_start',
            battle_id: battleId,
            you_first: char2.stats.speed > char1.stats.speed,
            your_char: char2,
            opponent_char: char1,
            opponent: onlineUsers.get(player1Id)?.user,
            your_form_index: player2FormIndex || 0
        });
    }

    // 按回合间隔广播战斗结果
    let roundIndex = 0;
    const roundInterval = setInterval(() => {
        if (roundIndex >= battleState.rounds.length) {
            clearInterval(roundInterval);
            // 战斗结束
            const { winnerId, loserId, expResult } = saveBattleResult(battleState, player1Id, player2Id, player1CharId, player2CharId);

            const p1IsWinner = winnerId === player1Id;
            const p2IsWinner = winnerId === player2Id;

            // 获取各玩家的经验信息
            const p1ExpInfo = p1IsWinner ? expResult.winner : expResult.loser;
            const p2ExpInfo = p2IsWinner ? expResult.winner : expResult.loser;

            if (p1Ws) {
                sendMsg(p1Ws, {
                    type: 'battle_end',
                    battle_id: battleId,
                    winner: p1IsWinner ? 'you' : 'opponent',
                    narration: battleState.narration,
                    stats: {
                        total_rounds: battleState.total_rounds,
                        your_hp: Math.max(0, battleState.char1.currentHp),
                        opponent_hp: Math.max(0, battleState.char2.currentHp),
                        your_wins: onlineUsers.get(player1Id)?.user.wins || 0,
                        your_losses: onlineUsers.get(player1Id)?.user.losses || 0
                    },
                    exp_gained: p1ExpInfo ? p1ExpInfo.exp_gained : 0,
                    level_up: p1ExpInfo ? p1ExpInfo.level_up : false,
                    new_level: p1ExpInfo ? p1ExpInfo.new_level : 1,
                    form_unlocked: p1ExpInfo ? p1ExpInfo.form_unlocked : false
                });
            }
            if (p2Ws) {
                sendMsg(p2Ws, {
                    type: 'battle_end',
                    battle_id: battleId,
                    winner: p2IsWinner ? 'you' : 'opponent',
                    narration: battleState.narration,
                    stats: {
                        total_rounds: battleState.total_rounds,
                        your_hp: Math.max(0, battleState.char2.currentHp),
                        opponent_hp: Math.max(0, battleState.char1.currentHp),
                        your_wins: onlineUsers.get(player2Id)?.user.wins || 0,
                        your_losses: onlineUsers.get(player2Id)?.user.losses || 0
                    },
                    exp_gained: p2ExpInfo ? p2ExpInfo.exp_gained : 0,
                    level_up: p2ExpInfo ? p2ExpInfo.level_up : false,
                    new_level: p2ExpInfo ? p2ExpInfo.new_level : 1,
                    form_unlocked: p2ExpInfo ? p2ExpInfo.form_unlocked : false
                });
            }

            // 清理战斗状态
            activeBattles.delete(battleId);
            // 恢复玩家大厅状态
            if (onlineUsers.has(player1Id)) onlineUsers.get(player1Id).status = 'lobby';
            if (onlineUsers.has(player2Id)) onlineUsers.get(player2Id).status = 'lobby';
            broadcastLobbyUpdate();
            return;
        }

        const roundData = battleState.rounds[roundIndex];
        // 广播回合给双方
        if (p1Ws) {
            sendMsg(p1Ws, {
                type: 'battle_round',
                battle_id: battleId,
                round: roundData.round,
                actions: roundData.actions.map(a => ({
                    ...a,
                    actor_side: a.actor_side === 'char1' ? 'you' : 'opponent',
                    target_side: a.target_side === 'char1' ? 'you' : 'opponent',
                    form_switch: a.form_switch || null
                })),
                log: roundData.logs.join('\n')
            });
        }
        if (p2Ws) {
            sendMsg(p2Ws, {
                type: 'battle_round',
                battle_id: battleId,
                round: roundData.round,
                actions: roundData.actions.map(a => ({
                    ...a,
                    actor_side: a.actor_side === 'char2' ? 'you' : 'opponent',
                    target_side: a.target_side === 'char2' ? 'you' : 'opponent',
                    form_switch: a.form_switch || null
                })),
                log: roundData.logs.join('\n')
            });
        }
        roundIndex++;
    }, 1500); // 每回合1.5秒
}

// 与机器人的战斗（机器人方不发送消息）
function startBattleWithBot(playerId, botId, playerCharId, botCharId, battleId, playerFormIndex) {
    const char1 = getCharacterById(playerCharId, playerId);  // 真人，传入playerId获取level
    const char2 = getCharacterById(botCharId);               // 机器人，不传userId
    if (!char1 || !char2) return;
    // 根据level计算属性加成（每级+2%）
    applyStatBonus(char1);
    applyStatBonus(char2);

    // 执行战斗（机器人始终使用formIndex=0）
    const battleState = battleEngine.executeBattle(char1, char2, playerFormIndex || 0, 0);

    activeBattles.set(battleId, {
        battleId, playerId, botId, playerCharId, botCharId,
        playerFormIndex: playerFormIndex || 0,
        botFormIndex: 0,
        char1, char2, battleState, currentRound: 0
    });

    const pWs = onlineUsers.get(playerId)?.ws;

    if (pWs) {
        sendMsg(pWs, {
            type: 'battle_start',
            battle_id: battleId,
            you_first: char1.stats.speed >= char2.stats.speed,
            your_char: char1,
            opponent_char: char2,
            opponent: { ...botUsers.get(botId).user, is_bot: true },
            your_form_index: playerFormIndex || 0
        });
    }

    let roundIndex = 0;
    const roundInterval = setInterval(() => {
        if (roundIndex >= battleState.rounds.length) {
            clearInterval(roundInterval);
            const { winnerId, loserId, expResult } = saveBattleResult(battleState, playerId, botId, playerCharId, botCharId);

            // 获取真人玩家的经验信息（机器人不发放经验）
            const playerExpInfo = winnerId === playerId ? expResult.winner : expResult.loser;

            if (pWs) {
                sendMsg(pWs, {
                    type: 'battle_end',
                    battle_id: battleId,
                    winner: winnerId === playerId ? 'you' : 'opponent',
                    narration: battleState.narration,
                    stats: {
                        total_rounds: battleState.total_rounds,
                        your_hp: Math.max(0, battleState.char1.currentHp),
                        opponent_hp: Math.max(0, battleState.char2.currentHp),
                        your_wins: onlineUsers.get(playerId)?.user.wins || 0,
                        your_losses: onlineUsers.get(playerId)?.user.losses || 0
                    },
                    exp_gained: playerExpInfo ? playerExpInfo.exp_gained : 0,
                    level_up: playerExpInfo ? playerExpInfo.level_up : false,
                    new_level: playerExpInfo ? playerExpInfo.new_level : 1,
                    form_unlocked: playerExpInfo ? playerExpInfo.form_unlocked : false
                });
            }

            activeBattles.delete(battleId);
            if (onlineUsers.has(playerId)) onlineUsers.get(playerId).status = 'lobby';
            if (botUsers.has(botId)) botUsers.get(botId).status = 'lobby';
            broadcastLobbyUpdate();
            return;
        }

        const roundData = battleState.rounds[roundIndex];
        if (pWs) {
            sendMsg(pWs, {
                type: 'battle_round',
                battle_id: battleId,
                round: roundData.round,
                actions: roundData.actions.map(a => ({
                    ...a,
                    actor_side: a.actor_side === 'char1' ? 'you' : 'opponent',
                    target_side: a.target_side === 'char1' ? 'you' : 'opponent',
                    form_switch: a.form_switch || null
                })),
                log: roundData.logs.join('\n')
            });
        }
        roundIndex++;
    }, 1500);
}

// 尝试匹配（含机器人）
function tryMatchmaking() {
    // 先尝试真人匹配
    while (matchQueue.length >= 2) {
        const p1 = matchQueue.shift();
        const p2 = matchQueue.shift();
        if (!p1 || !p2) break;

        // 检查双方仍在线
        if (!onlineUsers.has(p1.userId) || !onlineUsers.has(p2.userId)) {
            // 重新放回队列中仍在线的
            if (p1 && onlineUsers.has(p1.userId)) matchQueue.push(p1);
            if (p2 && onlineUsers.has(p2.userId)) matchQueue.push(p2);
            continue;
        }

        // 更新状态
        onlineUsers.get(p1.userId).status = 'battling';
        onlineUsers.get(p2.userId).status = 'battling';

        const battleId = 'battle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // 通知匹配成功
        sendMsg(p1.ws, {
            type: 'match_found',
            battle_id: battleId,
            opponent: onlineUsers.get(p2.userId).user,
            opponent_char: getCharacterById(p2.character_id),
            your_char: getCharacterById(p1.character_id),
            form_index: p1.formIndex || 0
        });
        sendMsg(p2.ws, {
            type: 'match_found',
            battle_id: battleId,
            opponent: onlineUsers.get(p1.userId).user,
            opponent_char: getCharacterById(p1.character_id),
            your_char: getCharacterById(p2.character_id),
            form_index: p2.formIndex || 0
        });

        // 延迟1秒后开始战斗（给前端时间渲染）
        setTimeout(() => {
            startBattle(p1.userId, p2.userId, p1.character_id, p2.character_id, p1.formIndex || 0, p2.formIndex || 0);
        }, 1000);

        broadcastLobbyUpdate();
    }

    // 检查是否有等待超过10秒的真人玩家，匹配机器人
    const now = Date.now();
    for (let i = 0; i < matchQueue.length; i++) {
        const p = matchQueue[i];
        if (p.is_bot) continue;
        if (now - p.join_time > 10000) {
            // 找一个空闲机器人
            const availableBot = Array.from(botUsers.values()).find(b => b.status === 'lobby');
            if (availableBot) {
                // 从队列移除真人
                matchQueue.splice(i, 1);
                // 机器人随机选角色
                const allChars = db.prepare('SELECT id FROM characters').all();
                const randomChar = allChars[Math.floor(Math.random() * allChars.length)];
                availableBot.character_id = randomChar.id;
                availableBot.status = 'battling';
                if (onlineUsers.has(p.userId)) onlineUsers.get(p.userId).status = 'battling';

                const battleId = 'battle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

                // 通知真人玩家匹配成功
                sendMsg(p.ws, {
                    type: 'match_found',
                    battle_id: battleId,
                    opponent: { ...availableBot.user, is_bot: true },
                    opponent_char: getCharacterById(randomChar.id),
                    your_char: getCharacterById(p.character_id),
                    is_bot_match: true,
                    form_index: p.formIndex || 0
                });

                setTimeout(() => {
                    startBattleWithBot(p.userId, availableBot.user.id, p.character_id, randomChar.id, battleId, p.formIndex || 0);
                }, 1000);

                broadcastLobbyUpdate();
                return;
            }
        }
    }
}

// 邀请指定玩家对战
function inviteBattle(inviterId, targetId, characterId, inviterFormIndex) {
    const target = onlineUsers.get(targetId);
    const inviter = onlineUsers.get(inviterId);
    if (!target || !inviter) return false;
    if (target.status !== 'lobby') return false;

    const inviteId = 'invite_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    pendingInvites.set(inviteId, {
        inviter_id: inviterId,
        target_id: targetId,
        inviter_char_id: characterId,
        inviter_form_index: inviterFormIndex || 0,
        target_form_index: 0,
        created_at: Date.now()
    });
    // 30秒后自动清理过期邀请
    setTimeout(() => { pendingInvites.delete(inviteId); }, 30000);

    sendMsg(target.ws, {
        type: 'battle_invite',
        invite_id: inviteId,
        from_user: inviter.user,
        from_char: getCharacterById(characterId)
    });
    return true;
}

// 处理WebSocket消息
function handleMessage(ws, userId, data) {
    const userEntry = onlineUsers.get(userId);
    if (!userEntry) return;

    switch (data.type) {
        case 'enter_lobby':
            userEntry.status = 'lobby';
            broadcastLobbyUpdate();
            break;

        case 'matchmaking':
            // 加入匹配队列
            if (userEntry.status === 'lobby') {
                matchQueue.push({
                    userId: userId,
                    character_id: data.character_id,
                    ws: ws,
                    join_time: Date.now(),
                    is_bot: false,
                    formIndex: data.form_index || 0
                });
                userEntry.status = 'matching';
                userEntry.character_id = data.character_id;
                broadcastLobbyUpdate();
                tryMatchmaking();
                // 10秒后再次检查（触发机器人匹配）
                setTimeout(() => tryMatchmaking(), 10000);
            }
            break;

        case 'cancel_matchmaking':
            // 从匹配队列移除
            const idx = matchQueue.findIndex(m => m.userId === userId);
            if (idx !== -1) matchQueue.splice(idx, 1);
            if (userEntry.status === 'matching') userEntry.status = 'lobby';
            broadcastLobbyUpdate();
            break;

        case 'invite_battle':
            // 如果目标是机器人，直接开始
            if (botUsers.has(data.target_user_id)) {
                const bot = botUsers.get(data.target_user_id);
                if (bot.status !== 'lobby') {
                    sendMsg(ws, { type: 'error', message: '该机器人正在战斗中' });
                    return;
                }
                const allChars = db.prepare('SELECT id FROM characters').all();
                const randomChar = allChars[Math.floor(Math.random() * allChars.length)];
                bot.character_id = randomChar.id;
                bot.status = 'battling';
                if (onlineUsers.has(userId)) onlineUsers.get(userId).status = 'battling';

                const battleId = 'battle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                sendMsg(ws, {
                    type: 'match_found',
                    battle_id: battleId,
                    opponent: { ...bot.user, is_bot: true },
                    opponent_char: getCharacterById(randomChar.id),
                    your_char: getCharacterById(data.character_id),
                    is_bot_match: true,
                    form_index: data.inviter_form_index || 0
                });

                setTimeout(() => {
                    startBattleWithBot(userId, bot.user.id, data.character_id, randomChar.id, battleId, data.inviter_form_index || 0);
                }, 1000);
                broadcastLobbyUpdate();
            } else {
                inviteBattle(userId, data.target_user_id, data.character_id, data.inviter_form_index || 0);
            }
            break;

        case 'accept_invite': {
            // 接受邀请，启动双方战斗
            const invite = pendingInvites.get(data.invite_id);
            if (!invite) {
                sendMsg(ws, { type: 'error', message: '邀请已失效或不存在' });
                break;
            }
            const accepterId = userId;
            const accepterCharId = data.character_id;
            // 接受方形态索引
            const accepterFormIndex = data.target_form_index || 0;
            // 校验双方仍在大厅且在线
            const inviterEntry = onlineUsers.get(invite.inviter_id);
            const accepterEntry = onlineUsers.get(accepterId);
            if (!inviterEntry || !accepterEntry) {
                sendMsg(ws, { type: 'error', message: '对方已离线' });
                pendingInvites.delete(data.invite_id);
                break;
            }
            if (inviterEntry.status !== 'lobby') {
                sendMsg(ws, { type: 'error', message: '邀请方已进入其他状态' });
                pendingInvites.delete(data.invite_id);
                break;
            }
            pendingInvites.delete(data.invite_id);
            inviterEntry.status = 'battling';
            accepterEntry.status = 'battling';
            broadcastLobbyUpdate();
            // 启动战斗：inviter 为 player1，accepter 为 player2，传递双方形态索引
            startBattle(invite.inviter_id, accepterId, invite.inviter_char_id, accepterCharId, invite.inviter_form_index || 0, accepterFormIndex);
            break;
        }

        case 'reject_invite': {
            const invite = pendingInvites.get(data.invite_id);
            if (invite) {
                pendingInvites.delete(data.invite_id);
                const inviterEntry = onlineUsers.get(invite.inviter_id);
                if (inviterEntry) {
                    sendMsg(inviterEntry.ws, {
                        type: 'invite_rejected',
                        message: '对方拒绝了你的对战邀请'
                    });
                }
            }
            break;
        }

        case 'accept_battle':
            // 兼容旧消息名，忽略
            break;

        case 'battle_action':
            // 自动战斗，无需处理玩家操作
            break;

        case 'leave':
            handleUserDisconnect(userId);
            break;
    }
}

// 处理用户断开连接
function handleUserDisconnect(userId) {
    // 从匹配队列移除
    const idx = matchQueue.findIndex(m => m.userId === userId);
    if (idx !== -1) matchQueue.splice(idx, 1);
    // 从在线列表移除
    onlineUsers.delete(userId);
    broadcastLobbyUpdate();
}

// 初始化WebSocket服务器
function initWSServer(server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        // 从URL query解析token
        const parsedUrl = url.parse(req.url, true);
        const token = parsedUrl.query.token;

        if (!token) {
            sendMsg(ws, { type: 'error', message: '未提供token' });
            ws.close();
            return;
        }

        const user = verifyToken(token);
        if (!user) {
            sendMsg(ws, { type: 'error', message: 'token无效或已过期' });
            ws.close();
            return;
        }

        // 绑定userId到连接
        ws.userId = user.id;
        // 如果该用户已存在连接，关闭旧连接
        if (onlineUsers.has(user.id)) {
            const oldEntry = onlineUsers.get(user.id);
            try { oldEntry.ws.close(); } catch (e) {}
        }
        onlineUsers.set(user.id, {
            ws: ws,
            user: user,
            status: 'lobby',
            character_id: null
        });

        console.log(`[WS] 用户 ${user.username} 已连接，当前在线 ${onlineUsers.size} 人`);

        // 自动进入大厅
        sendMsg(ws, { type: 'connected', user: user });
        broadcastLobbyUpdate();

        // 监听消息
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                handleMessage(ws, user.id, data);
            } catch (err) {
                console.error('[WS] 消息解析错误:', err);
            }
        });

        // 监听断开
        ws.on('close', () => {
            console.log(`[WS] 用户 ${user.username} 已断开`);
            handleUserDisconnect(user.id);
        });

        ws.on('error', (err) => {
            console.error('[WS] 连接错误:', err);
        });
    });

    initBots();  // 初始化机器人
    console.log('[WS] WebSocket服务器已启动');
    return wss;
}

module.exports = { initWSServer, onlineUsers, botUsers, getAllOnlineUsers };
