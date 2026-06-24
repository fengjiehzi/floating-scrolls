// battle-engine.js - 战斗引擎
// 伤害计算、AI选技能、回合流程
// 核心原则：结合原作事实，神话级角色对历史级角色形成次元压制

// 作品类型判定（决定次元差距）
// 神话类：西游记、封神演义、山海经、白蛇传、奥特曼
// 凡人类：三国演义、水浒传、红楼梦、史记
const MYTH_SOURCES = ['西游记', '封神演义', '山海经', '白蛇传', '奥特曼'];

function isMythic(character) {
    return MYTH_SOURCES.includes(character.source);
}

// 等级数值映射
const GRADE_VALUE = { 'S': 4, 'A': 3, 'B': 2, 'C': 1 };

// 计算次元压制倍率（神话 vs 凡人）
function getDimensionMult(attacker, defender) {
    const atkMythic = isMythic(attacker);
    const defMythic = isMythic(defender);
    // 神话打凡人：3倍伤害（秒杀级）
    if (atkMythic && !defMythic) return 3.0;
    // 凡人打神话：0.5倍伤害（几乎无效）
    if (!atkMythic && defMythic) return 0.5;
    // 同类对决：正常
    return 1.0;
}

// 计算等级压制倍率
function getGradeMult(attacker, defender) {
    const atkVal = GRADE_VALUE[attacker.grade] || 2;
    const defVal = GRADE_VALUE[defender.grade] || 2;
    const diff = atkVal - defVal;
    if (diff >= 2) return 2.0;   // S打B：2倍
    if (diff === 1) return 1.5;  // S打A 或 A打B：1.5倍
    if (diff <= -2) return 0.5;  // B打S：减半
    if (diff === -1) return 0.8; // A打S 或 B打A：8折
    return 1.0;
}

// 创建战斗角色（深拷贝+当前状态）
function createBattleChar(character, formIndex = 0) {
    // 使用指定形态（默认第一个）
    const form = character.forms[formIndex] || character.forms[0];
    const bonuses = form.bonuses || {};
    return {
        ...character,
        currentFormIndex: formIndex,
        // 保存基础属性，用于形态切换时重算 stats
        baseStats: { ...character.stats },
        stats: {
            power: character.stats.power + (bonuses.power || 0),
            speed: character.stats.speed + (bonuses.speed || 0),
            intelligence: character.stats.intelligence + (bonuses.intelligence || 0),
            defense: character.stats.defense + (bonuses.defense || 0),
            special_ability: character.stats.special_ability + (bonuses.special_ability || 0),
            hp: character.stats.hp,
            mp: character.stats.mp
        },
        currentHp: character.stats.hp,
        currentMp: character.stats.mp,
        buffs: { defense_up: 0, speed_up: 0, attack_down: 0, crit_up: 0, dodge: 0 }
    };
}

// 计算暴击率
function calcCritRate(attacker) {
    const rate = (attacker.stats.speed + attacker.stats.intelligence) / 400;
    return Math.min(0.35, rate);
}

// 伤害计算（结合等级压制与次元差距）
function calculateDamage(attacker, defender, skill) {
    let base;
    if (skill.type === 'physical_attack') {
        base = attacker.stats.power * 1.2;
    } else if (skill.type === 'magic_attack') {
        base = attacker.stats.special_ability * 1.2;
    } else if (skill.type === 'speed_attack') {
        base = attacker.stats.speed * 1.2;
    } else if (skill.type === 'summon') {
        base = attacker.stats.power * 0.6;
    } else {
        base = attacker.stats.power * 1.0;
    }
    base += attacker.stats.special_ability * 0.3;

    const skillMult = skill.multiplier || 1.0;
    const critRate = calcCritRate(attacker) + (attacker.buffs.crit_up > 0 ? 0.25 : 0);
    const isCrit = Math.random() < critRate;
    const critMult = isCrit ? 1.5 : 1.0;

    // 防御减免
    let def = defender.stats.defense;
    if (defender.buffs.defense_up > 0) def = def * 1.5;
    const defReduction = 1 - (def / (def + 200));

    // 攻击降低debuff
    const attackDownMult = attacker.buffs.attack_down > 0 ? 0.7 : 1.0;

    // 等级压制倍率
    const gradeMult = getGradeMult(attacker, defender);
    // 次元压制倍率（神话 vs 凡人）
    const dimensionMult = getDimensionMult(attacker, defender);

    let damage = base * skillMult * critMult * defReduction * attackDownMult * gradeMult * dimensionMult;

    // 次元秒杀机制：神话级打凡人级时，伤害至少为目标最大HP的80%
    // 体现"金箍棒一万三千五百斤"对凡人躯体的毁灭性
    if (dimensionMult >= 3.0) {
        const minOneShotDamage = Math.floor(defender.stats.hp * 0.8);
        damage = Math.max(damage, minOneShotDamage);
    }

    damage = Math.max(1, Math.round(damage));

    // 判定是否为秒杀（伤害超过目标最大HP的60%）
    const isOneShot = damage >= defender.stats.hp * 0.6;

    return { damage, isCrit, isOneShot, gradeMult, dimensionMult };
}

// AI选择技能
function selectSkill(character, currentHp, currentMp) {
    const hpRatio = currentHp / character.stats.hp;
    // 可用技能（排除被动）
    const availableSkills = character.skills.filter(s => s.type !== 'passive' && currentMp >= s.mp_cost);

    if (availableSkills.length === 0) {
        // MP不足，使用普攻
        const freeSkills = character.skills.filter(s => s.mp_cost === 0 && s.type !== 'passive');
        return freeSkills[0] || character.skills[0];
    }

    // 血量低于30%优先防御/变化
    if (hpRatio < 0.3) {
        const defensive = availableSkills.find(s => s.type === 'transform');
        if (defensive && Math.random() < 0.5) return defensive;
        // 有回血技能优先
        const healSkill = availableSkills.find(s => s.type === 'heal');
        if (healSkill && Math.random() < 0.6) return healSkill;
    }

    // MP充足时优先高伤害技能
    const attackSkills = availableSkills.filter(s =>
        ['physical_attack', 'magic_attack', 'speed_attack', 'summon'].includes(s.type)
    );
    if (attackSkills.length > 0) {
        // 按倍率排序，70%概率选最高，30%随机
        attackSkills.sort((a, b) => b.multiplier - a.multiplier);
        if (Math.random() < 0.7) return attackSkills[0];
        return attackSkills[Math.floor(Math.random() * attackSkills.length)];
    }

    return availableSkills[0];
}

// 处理变化技能
// 返回值格式：{ logs: [], form_switch: { switched: bool, new_form: string, new_form_index: number } }
function handleTransformSkill(battleState, caster, opponent, skill, casterSide) {
    const name = skill.name;
    const logs = [];
    const formSwitch = { switched: false, new_form: '', new_form_index: -1 };

    // 判定目标形态类型
    let targetBonusKey = null; // 'speed' | 'defense' | 'power'
    if (name.includes('七十二变') || name.includes('闪避') || name.includes('空中型') || name.includes('化形') || name.includes('闭月')) {
        targetBonusKey = 'speed';
    } else if (name.includes('强力型') || name.includes('防御') || name.includes('杏黄旗')) {
        targetBonusKey = 'defense';
    } else if (name.includes('三头六臂') || name.includes('八九玄功')) {
        targetBonusKey = 'power';
    }

    // 形态切换（仅在多形态角色上生效）
    if (targetBonusKey && caster.forms && caster.forms.length > 1) {
        const oldFormIndex = caster.currentFormIndex;
        // 在 forms 中找到目标 bonus 最大的形态索引
        let newFormIndex = 0;
        let maxBonus = -Infinity;
        caster.forms.forEach((f, i) => {
            const bonus = (f.bonuses && f.bonuses[targetBonusKey]) || 0;
            if (bonus > maxBonus) {
                maxBonus = bonus;
                newFormIndex = i;
            }
        });

        // 目标形态与当前形态不同时才切换
        if (newFormIndex !== oldFormIndex) {
            const newForm = caster.forms[newFormIndex];
            caster.currentFormIndex = newFormIndex;
            // 重新计算 stats：基础stats + 新形态bonuses
            const bonuses = newForm.bonuses || {};
            caster.stats = {
                power: caster.baseStats.power + (bonuses.power || 0),
                speed: caster.baseStats.speed + (bonuses.speed || 0),
                intelligence: caster.baseStats.intelligence + (bonuses.intelligence || 0),
                defense: caster.baseStats.defense + (bonuses.defense || 0),
                special_ability: caster.baseStats.special_ability + (bonuses.special_ability || 0),
                hp: caster.baseStats.hp,
                mp: caster.baseStats.mp
            };
            // 保留 currentHp 和 currentMp（不因切换形态而改变）
            logs.push(`${caster.name} 切换为 ${newForm.name} 形态！`);
            formSwitch.switched = true;
            formSwitch.new_form = newForm.name;
            formSwitch.new_form_index = newFormIndex;
        }
    }

    // 设置 buffs（保留现有逻辑）
    if (name.includes('七十二变') || name.includes('闪避') || name.includes('空中型') || name.includes('化形') || name.includes('闭月')) {
        caster.buffs.dodge = 1;
        logs.push(`${caster.name} 进入闪避状态`);
    } else if (name.includes('强力型') || name.includes('防御') || name.includes('杏黄旗')) {
        caster.buffs.defense_up = 2;
        logs.push(`${caster.name} 防御提升`);
    } else if (name.includes('单骑') || name.includes('速度') || name.includes('乌骓')) {
        caster.buffs.speed_up = 2;
        logs.push(`${caster.name} 速度提升`);
    } else if (name.includes('空城计') || name.includes('葬花') || name.includes('士气') || name.includes('美人计')) {
        opponent.buffs.attack_down = 2;
        logs.push(`对手攻击力被降低`);
    } else if (name.includes('借东风')) {
        caster.buffs.crit_up = 2;
        logs.push(`${caster.name} 暴击率提升`);
    } else if (name.includes('酒醉') || name.includes('暴怒') || name.includes('霸王怒')) {
        caster.buffs.crit_up = 3;
        logs.push(`${caster.name} 暴击率大幅提升`);
    } else if (name.includes('八阵图') || name.includes('梦境') || name.includes('幻') || name.includes('混天绫') || name.includes('离间')) {
        opponent.buffs.attack_down = 2;
        logs.push(`${caster.name} 困住对手，对手攻击降低`);
    } else if (name.includes('三头六臂') || name.includes('八九玄功')) {
        caster.buffs.defense_up = 2;
        caster.buffs.attack_down = 0; // 自身不降攻
        logs.push(`${caster.name} 攻防提升`);
    } else if (name.includes('虞姬')) {
        caster.buffs.crit_up = 2;
        logs.push(`${caster.name} 士气大振，暴击提升`);
    } else {
        logs.push(`${caster.name} 施展变化技能`);
    }

    return { logs, form_switch: formSwitch };
}

// 处理回血技能
function handleHealSkill(caster, skill) {
    const healAmount = Math.floor(caster.stats.hp * 0.2);
    caster.currentHp = Math.min(caster.stats.hp, caster.currentHp + healAmount);
    return [`${caster.name} 恢复 ${healAmount} 点HP`];
}

// 执行一次攻击，返回动作详情
function executeAttack(battleState, attacker, defender, attackerSide, defenderSide) {
    const skill = selectSkill(attacker, attacker.currentHp, attacker.currentMp);
    attacker.currentMp -= skill.mp_cost;

    const action = {
        actor: attacker.name,
        actor_side: attackerSide,
        skill: skill.name,
        skill_type: skill.type,
        skill_desc: skill.desc,
        narration: skill.narration,
        target: defender.name,
        target_side: defenderSide,
        damage: 0,
        isCrit: false,
        isOneShot: false,
        hp_after: defender.currentHp,
        mp_cost: skill.mp_cost,
        mp_after: attacker.currentMp,
        logs: []
    };

    action.logs.push(`${attacker.name} 施展 【${skill.name}】`);

    if (skill.type === 'transform') {
        const oldFormIndex = attacker.currentFormIndex;
        const transformResult = handleTransformSkill(battleState, attacker, defender, skill, attackerSide);
        action.logs.push(...transformResult.logs);
        if (transformResult.form_switch && transformResult.form_switch.switched) {
            action.form_switch = transformResult.form_switch;
        }
    } else if (skill.type === 'heal') {
        const healLogs = handleHealSkill(attacker, skill);
        action.logs.push(...healLogs);
        action.hp_after = attacker.currentHp;
    } else if (skill.type === 'passive') {
        action.logs.push(`${skill.name} 被动生效`);
    } else {
        // 攻击类技能
        // 检查闪避（次元差距过大时无法闪避）
        const dimensionMult = getDimensionMult(attacker, defender);
        if (defender.buffs.dodge > 0 && dimensionMult < 2.0) {
            action.logs.push(`${defender.name} 闪避了攻击！`);
            defender.buffs.dodge = 0;
        } else {
            const result = calculateDamage(attacker, defender, skill);
            const { damage, isCrit, isOneShot } = result;
            defender.currentHp -= damage;
            action.damage = damage;
            action.isCrit = isCrit;
            action.isOneShot = isOneShot;
            action.hp_after = Math.max(0, defender.currentHp);

            // 秒杀特效
            if (isOneShot) {
                action.logs.push(`⚡ 秒杀！${attacker.name} 以碾压之势对 ${defender.name} 造成 ${damage} 点毁灭性伤害！`);
                action.logs.push(`（次元压制：神话级 vs 凡人级）`);
            } else if (isCrit) {
                action.logs.push(`💥 暴击！${attacker.name} 对 ${defender.name} 造成 ${damage} 点伤害！`);
            } else {
                action.logs.push(`${attacker.name} 对 ${defender.name} 造成 ${damage} 点伤害`);
            }
            action.logs.push(`${defender.name} HP: ${defender.currentHp + damage} → ${Math.max(0, defender.currentHp)}`);
        }
    }

    return action;
}

// 回合结束，清理buff
function endTurnBuffs(battle) {
    ['char1', 'char2'].forEach(key => {
        const f = battle[key];
        if (f.buffs.defense_up > 0) f.buffs.defense_up--;
        if (f.buffs.speed_up > 0) f.buffs.speed_up--;
        if (f.buffs.attack_down > 0) f.buffs.attack_down--;
        if (f.buffs.crit_up > 0) f.buffs.crit_up--;
        if (f.buffs.dodge > 0) f.buffs.dodge--;
    });
}

// 执行完整战斗，返回所有回合
function executeBattle(char1Data, char2Data, char1FormIndex = 0, char2FormIndex = 0) {
    const char1 = createBattleChar(char1Data, char1FormIndex);
    const char2 = createBattleChar(char2Data, char2FormIndex);

    const battle = {
        char1: char1,
        char2: char2,
        rounds: [],
        winner: null, // 1 或 2
        total_rounds: 0,
        narration: ''
    };

    // 按速度决定先手
    const firstAttacker = char1.stats.speed >= char2.stats.speed ? 1 : 2;

    let round = 1;
    const maxRounds = 12;

    while (round <= maxRounds && char1.currentHp > 0 && char2.currentHp > 0) {
        const roundData = {
            round: round,
            actions: [],
            logs: [`—— 第 ${round} 回合 ——`]
        };

        // 先手攻击
        if (char1.currentHp > 0 && char2.currentHp > 0) {
            const [attacker, defender, atkSide, defSide] = firstAttacker === 1
                ? [char1, char2, 'char1', 'char2']
                : [char2, char1, 'char2', 'char1'];
            const action = executeAttack(battle, attacker, defender, atkSide, defSide);
            roundData.actions.push(action);
            roundData.logs.push(...action.logs);
        }

        // 判定胜负
        if (char2.currentHp <= 0) {
            battle.winner = 1;
            roundData.logs.push(`🏆 ${char1.name} 获胜！`);
            battle.rounds.push(roundData);
            battle.total_rounds = round;
            break;
        }
        if (char1.currentHp <= 0) {
            battle.winner = 2;
            roundData.logs.push(`🏆 ${char2.name} 获胜！`);
            battle.rounds.push(roundData);
            battle.total_rounds = round;
            break;
        }

        // 后手攻击
        if (char1.currentHp > 0 && char2.currentHp > 0) {
            const [attacker, defender, atkSide, defSide] = firstAttacker === 1
                ? [char2, char1, 'char2', 'char1']
                : [char1, char2, 'char1', 'char2'];
            const action = executeAttack(battle, attacker, defender, atkSide, defSide);
            roundData.actions.push(action);
            roundData.logs.push(...action.logs);
        }

        // 判定胜负
        if (char1.currentHp <= 0) {
            battle.winner = 2;
            roundData.logs.push(`🏆 ${char2.name} 获胜！`);
            battle.rounds.push(roundData);
            battle.total_rounds = round;
            break;
        }
        if (char2.currentHp <= 0) {
            battle.winner = 1;
            roundData.logs.push(`🏆 ${char1.name} 获胜！`);
            battle.rounds.push(roundData);
            battle.total_rounds = round;
            break;
        }

        // 回合结束清理buff
        endTurnBuffs(battle);
        battle.rounds.push(roundData);
        round++;
    }

    // 超时判定
    if (!battle.winner && round > maxRounds) {
        battle.total_rounds = maxRounds;
        const hp1Ratio = char1.currentHp / char1.stats.hp;
        const hp2Ratio = char2.currentHp / char2.stats.hp;
        if (hp1Ratio > hp2Ratio) {
            battle.winner = 1;
        } else if (hp2Ratio > hp1Ratio) {
            battle.winner = 2;
        } else {
            // 平局按速度判定
            battle.winner = char1.stats.speed >= char2.stats.speed ? 1 : 2;
        }
    }

    // 生成叙述
    battle.narration = generateNarration(battle);

    return battle;
}

// 生成AI战斗叙述
function generateNarration(battle) {
    const char1 = battle.char1;
    const char2 = battle.char2;
    const winner = battle.winner === 1 ? char1 : char2;
    const loser = battle.winner === 1 ? char2 : char1;
    const isTimeout = battle.total_rounds >= 12;

    // 检测是否为秒杀局（3回合内结束且含秒杀动作）
    const hasOneShotAction = battle.rounds.some(r => r.actions.some(a => a.isOneShot));
    const isOneShotBattle = battle.total_rounds <= 3 && hasOneShotAction;

    let narration = `【战斗叙述】\n\n`;
    narration += `万卷浮生，群英荟萃。${char1.name}（出自《${char1.source}》）与${char2.name}（出自《${char2.source}》）于虚空中相遇，一场跨作品的对决就此展开。\n\n`;

    if (isOneShotBattle) {
        // 秒杀局：精简叙述，只描述秒杀动作
        const oneShotActions = [];
        battle.rounds.forEach(r => {
            r.actions.forEach(a => {
                if (a.isOneShot) oneShotActions.push(a);
            });
        });
        const firstShot = oneShotActions[0];
        narration += `${firstShot.actor}施展【${firstShot.skill}】，${firstShot.narration}。\n\n`;
        narration += `这一击挟神话级威能，凡人之躯难以承受。${loser.name}虽勇，终究无法跨越次元的鸿沟。\n\n`;
        narration += `⚡ 仅${battle.total_rounds}回合，${winner.name}便以碾压之势秒杀${loser.name}！`;
        narration += `\n\n${winner.name}作为《${winner.source}》中的${winner.grade}级神话存在，其战力远非凡人所能企及。`;
    } else {
        // 正常战斗：按回合叙述
        battle.rounds.forEach(roundData => {
            narration += `第${roundData.round}回合，`;
            roundData.actions.forEach(action => {
                if (action.damage > 0) {
                    narration += `${action.actor}施展${action.skill}，${action.narration}，对${action.target}造成${action.damage}点伤害${action.isCrit ? '（暴击！）' : ''}。`;
                } else {
                    narration += `${action.actor}施展${action.skill}，${action.narration}。`;
                }
            });
            narration += '\n';
        });

        narration += `\n经过${battle.total_rounds}回合激战，${winner.name}以${Math.max(0, winner.currentHp)}点HP${isTimeout ? '险胜' : '击败'}${loser.name}！`;
        narration += `\n\n${winner.name}展现了《${winner.source}》中角色的风采，印证了其${winner.grade}级战力的不凡。`;
    }

    return narration;
}

module.exports = {
    createBattleChar,
    calculateDamage,
    selectSkill,
    executeAttack,
    executeBattle,
    generateNarration
};
