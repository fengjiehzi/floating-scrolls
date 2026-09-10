class_name BattleEngine
extends RefCounted

var state: Dictionary = {}
var _rng := RandomNumberGenerator.new()

func start_battle(player: Dictionary, definition: BattleDefinition, seed: int = 0) -> Dictionary:
	_rng.seed = seed if seed != 0 else Time.get_ticks_usec()
	var enemy := definition.enemy.duplicate(true)
	player = player.duplicate(true)
	player.current_hp = int(player.max_hp)
	player.current_mana = int(player.max_mana)
	enemy.current_hp = int(enemy.max_hp)
	enemy.current_mana = int(enemy.max_mana)
	state = {
		"battle_id": definition.id,
		"round": 1,
		"max_rounds": definition.max_rounds,
		"player": player,
		"enemy": enemy,
		"cooldowns": {},
		"defending": false,
		"dodge_next": false,
		"item_used": false,
		"finished": false,
		"winner": "",
		"history": [],
	}
	_add_event("round", "第 1 回合开始。")
	return state

func player_action(action_id: String) -> Dictionary:
	var response := {"accepted": false, "events": [], "finished": state.get("finished", true), "winner": state.get("winner", "")}
	if state.is_empty() or state.finished:
		return response
	var events_before: int = state.history.size()
	match action_id:
		"attack":
			_execute_attack(state.player, state.enemy, _basic_attack(), false)
		"defend":
			state.defending = true
			_add_event("buff", "%s 进入防御姿态，下一次承受伤害减半。" % state.player.name)
		"item":
			if not _use_item():
				return response
		_:
			if not action_id.begins_with("skill:"):
				return response
			var skill := _find_player_skill(action_id.trim_prefix("skill:"))
			if skill.is_empty() or not _can_use_skill(skill):
				return response
			_use_skill(state.player, state.enemy, skill, false)
	response.accepted = true
	if state.enemy.current_hp <= 0:
		_finish("player")
	else:
		_enemy_turn()
	if not state.finished:
		_finish_or_advance_round()
	response.events = state.history.slice(events_before)
	response.finished = state.finished
	response.winner = state.winner
	return response

func get_player_skill_actions() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	if state.is_empty():
		return result
	for skill: Dictionary in state.player.get("skills", []):
		var cooldown := int(state.cooldowns.get(skill.id, 0))
		result.append({
			"id": "skill:%s" % skill.id,
			"name": skill.name,
			"mana_cost": int(skill.get("manaCost", 0)),
			"cooldown": cooldown,
			"enabled": cooldown <= 0 and int(state.player.current_mana) >= int(skill.get("manaCost", 0)),
		})
	return result

func _enemy_turn() -> void:
	if state.finished:
		return
	if state.dodge_next:
		state.dodge_next = false
		_add_event("miss", "%s 以七十二变避开了 %s 的攻击。" % [state.player.name, state.enemy.name])
		return
	var skill := _select_enemy_skill()
	if skill.is_empty():
		skill = _basic_attack()
	_use_skill(state.enemy, state.player, skill, true)
	if state.player.current_hp <= 0:
		_finish("enemy")

func _finish_or_advance_round() -> void:
	_decrement_cooldowns()
	if int(state.round) >= int(state.max_rounds):
		var player_ratio := float(state.player.current_hp) / float(state.player.max_hp)
		var enemy_ratio := float(state.enemy.current_hp) / float(state.enemy.max_hp)
		_finish("player" if player_ratio > enemy_ratio else "enemy", true)
		return
	state.round = int(state.round) + 1
	_add_event("round", "第 %d 回合开始。" % state.round)

func _use_skill(attacker: Dictionary, defender: Dictionary, skill: Dictionary, enemy_action: bool) -> void:
	var mana_cost := int(skill.get("manaCost", 0))
	attacker.current_mana = maxi(0, int(attacker.current_mana) - mana_cost)
	if not enemy_action:
		state.cooldowns[skill.id] = 4
	if skill.get("type") == "transform":
		state.dodge_next = true
		_add_event("buff", "%s 施展%s，身形变幻莫测。" % [attacker.name, skill.name])
		return
	if skill.get("type") == "heal":
		var heal := maxi(1, roundi(float(attacker.max_hp) * 0.2))
		attacker.current_hp = mini(int(attacker.max_hp), int(attacker.current_hp) + heal)
		_add_event("heal", "%s 施展%s，恢复 %d 点生命。" % [attacker.name, skill.name, heal], heal)
		return
	_execute_attack(attacker, defender, skill, enemy_action)

func _execute_attack(attacker: Dictionary, defender: Dictionary, skill: Dictionary, enemy_action: bool) -> void:
	var reduction := 1.0
	if enemy_action and state.defending:
		reduction = 0.5
		state.defending = false
	var result := _calculate_damage(attacker, defender, skill, reduction)
	defender.current_hp = maxi(0, int(defender.current_hp) - int(result.damage))
	var critical_text := "，触发暴击" if result.critical else ""
	_add_event(
		"damage",
		"%s 使用%s，对 %s 造成 %d 点伤害%s。" % [attacker.name, skill.name, defender.name, result.damage, critical_text],
		result.damage
	)

func _calculate_damage(attacker: Dictionary, defender: Dictionary, skill: Dictionary, reduction: float) -> Dictionary:
	var basis_key := "attack"
	match skill.get("type", "physical_attack"):
		"magic_attack": basis_key = "specialAbility"
		"speed_attack": basis_key = "speed"
	var base := float(attacker.get(basis_key, 1)) * maxf(0.7, float(skill.get("multiplier", 1.0)))
	var defense := maxf(0.0, float(defender.get("defense", 0)))
	var defense_reduction := 1.0 - defense / (defense + 200.0)
	var critical := _rng.randf() < float(attacker.get("critRate", 0)) / 100.0
	var critical_multiplier := 1.5 if critical else 1.0
	return {
		"damage": maxi(1, roundi(base * defense_reduction * critical_multiplier * reduction)),
		"critical": critical,
	}

func _use_item() -> bool:
	if state.item_used or not state.player.get("has_item", false):
		return false
	if int(state.player.current_hp) >= int(state.player.max_hp):
		return false
	var amount := mini(roundi(float(state.player.max_hp) * 0.2), int(state.player.max_hp) - int(state.player.current_hp))
	state.player.current_hp += amount
	state.item_used = true
	_add_event("heal", "%s 借如意金箍棒定海之力，恢复 %d 点生命。" % [state.player.name, amount], amount)
	return true

func _select_enemy_skill() -> Dictionary:
	var available: Array[Dictionary] = []
	for skill: Dictionary in state.enemy.get("skills", []):
		if int(state.enemy.current_mana) >= int(skill.get("manaCost", 0)):
			available.append(skill)
	if available.is_empty():
		return {}
	available.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return float(a.get("multiplier", 1.0)) > float(b.get("multiplier", 1.0)))
	return available[0]

func _find_player_skill(skill_id: String) -> Dictionary:
	for skill: Dictionary in state.player.get("skills", []):
		if skill.get("id") == skill_id:
			return skill
	return {}

func _can_use_skill(skill: Dictionary) -> bool:
	return int(state.cooldowns.get(skill.id, 0)) <= 0 and int(state.player.current_mana) >= int(skill.get("manaCost", 0))

func _decrement_cooldowns() -> void:
	for skill_id in state.cooldowns.keys():
		state.cooldowns[skill_id] = maxi(0, int(state.cooldowns[skill_id]) - 1)

func _finish(winner: String, timeout: bool = false) -> void:
	state.finished = true
	state.winner = winner
	var suffix := "（十二回合判定）" if timeout else ""
	_add_event("end", "%s 获胜%s。" % [state.player.name if winner == "player" else state.enemy.name, suffix])

func _basic_attack() -> Dictionary:
	return {"id": "basic_attack", "name": "普通攻击", "type": "physical_attack", "multiplier": 1.0, "manaCost": 0}

func _add_event(type: String, text: String, value: int = 0) -> void:
	state.history.append({"type": type, "text": text, "value": value, "round": state.round})
