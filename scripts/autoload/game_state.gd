extends Node

signal progress_changed
signal story_node_changed(node_id: String)
signal toast_requested(message: String)

const SCHEMA_VERSION := 1

var save_data: Dictionary = {}

func _ready() -> void:
	save_data = make_default_save()

func make_default_save() -> Dictionary:
	var default_characters: Array[String] = []
	for character: CharacterDefinition in ContentRegistry.characters.values():
		if character.unlocked_by_default:
			default_characters.append(character.id)
	return {
		"schema_version": SCHEMA_VERSION,
		"current_book": "",
		"book_progress": {},
		"unlocked_characters": default_characters,
		"codex_items": [],
		"seen_endings": [],
	}

func import_save(candidate: Dictionary) -> bool:
	if int(candidate.get("schema_version", 0)) != SCHEMA_VERSION:
		return false
	var normalized := make_default_save()
	normalized.current_book = str(candidate.get("current_book", ""))
	normalized.book_progress = candidate.get("book_progress", {}).duplicate(true)
	normalized.unlocked_characters = _string_array(candidate.get("unlocked_characters", []))
	normalized.codex_items = _string_array(candidate.get("codex_items", []))
	normalized.seen_endings = _string_array(candidate.get("seen_endings", []))
	for default_id in make_default_save().unlocked_characters:
		_append_unique(normalized.unlocked_characters, default_id)
	save_data = normalized
	progress_changed.emit()
	return true

func begin_book(book_id: String) -> bool:
	var book: BookDefinition = ContentRegistry.get_book(book_id)
	if book == null or not book.playable:
		return false
	_ensure_run(book_id)
	save_data.current_book = book_id
	story_node_changed.emit(get_current_node_id())
	progress_changed.emit()
	_request_save()
	return true

func get_current_book_id() -> String:
	return str(save_data.get("current_book", ""))

func get_current_node_id() -> String:
	var book_id := get_current_book_id()
	if book_id.is_empty():
		return ""
	var run: Dictionary = save_data.book_progress.get(book_id, {})
	return str(run.get("current_node", ""))

func get_current_node() -> Dictionary:
	var book_id := get_current_book_id()
	var graph: StoryGraph = ContentRegistry.get_story_for_book(book_id)
	if graph == null:
		return {}
	return graph.get_node(get_current_node_id())

func choose(choice_id: String) -> bool:
	var node := get_current_node()
	if node.is_empty() or node.get("type") not in ["story", "reward"]:
		return false
	for choice: Dictionary in node.get("choices", []):
		if choice.get("id") != choice_id:
			continue
		var book_id := get_current_book_id()
		var run := _ensure_run(book_id)
		_apply_effects(run, choice.get("effects", {}))
		for unlock: String in choice.get("unlocks", []):
			_apply_unlock(run, unlock)
		run.choice_history.append(choice_id)
		run.current_node = choice.get("next", run.current_node)
		save_data.book_progress[book_id] = run
		_record_ending_if_needed(run.current_node)
		story_node_changed.emit(run.current_node)
		progress_changed.emit()
		_request_save()
		return true
	return false

func complete_battle(battle_id: String) -> bool:
	var node := get_current_node()
	if node.get("type") != "battle" or node.get("battle_id") != battle_id:
		return false
	var battle: BattleDefinition = ContentRegistry.get_battle(battle_id)
	if battle == null:
		return false
	var book_id := get_current_book_id()
	var run := _ensure_run(book_id)
	for reward: String in battle.rewards:
		_apply_unlock(run, reward)
	run.completed_battles = _string_array(run.get("completed_battles", []))
	_append_unique(run.completed_battles, battle_id)
	run.current_node = battle.victory_next
	run.checkpoint_node = battle.victory_next
	save_data.book_progress[book_id] = run
	story_node_changed.emit(run.current_node)
	progress_changed.emit()
	_request_save()
	return true

func restart_book(book_id: String) -> void:
	if ContentRegistry.get_story_for_book(book_id) == null:
		return
	save_data.book_progress[book_id] = _fresh_run(book_id)
	save_data.current_book = book_id
	story_node_changed.emit(get_current_node_id())
	progress_changed.emit()
	_request_save()

func clear_all_progress() -> void:
	save_data = make_default_save()
	progress_changed.emit()
	_request_save()

func get_book_progress(book_id: String) -> Dictionary:
	return save_data.book_progress.get(book_id, {})

func get_modifiers(book_id: String = "") -> Dictionary:
	var target := book_id if not book_id.is_empty() else get_current_book_id()
	var run: Dictionary = save_data.book_progress.get(target, {})
	return run.get("modifiers", {}).duplicate(true)

func get_unlocked_skills(book_id: String = "") -> Array[String]:
	var target := book_id if not book_id.is_empty() else get_current_book_id()
	var run: Dictionary = save_data.book_progress.get(target, {})
	return _string_array(run.get("unlocked_skills", []))

func get_run_items(book_id: String = "") -> Array[String]:
	var target := book_id if not book_id.is_empty() else get_current_book_id()
	var run: Dictionary = save_data.book_progress.get(target, {})
	return _string_array(run.get("unlocked_items", []))

func is_character_unlocked(character_id: String) -> bool:
	return character_id in save_data.unlocked_characters

func is_item_unlocked(item_id: String) -> bool:
	return item_id in save_data.codex_items

func get_player_snapshot(character_id: String) -> Dictionary:
	var character: CharacterDefinition = ContentRegistry.characters.get(character_id)
	if character == null:
		return {}
	var stats := character.stats.duplicate(true)
	for key in get_modifiers():
		stats[key] = float(stats.get(key, 0)) + float(get_modifiers()[key])
	var max_hp := maxi(1, roundi(float(stats.get("maxHealth", stats.get("health", 100))) / 20.0))
	var available_skills: Array[Dictionary] = []
	var unlocked := get_unlocked_skills()
	for skill: Dictionary in character.skills:
		if skill.id in unlocked and skill.get("type") != "passive":
			available_skills.append(skill.duplicate(true))
	return {
		"id": character.id,
		"name": character.display_name,
		"portrait_path": character.portrait_path,
		"attack": int(stats.get("attack", 1)),
		"defense": int(stats.get("defense", 0)),
		"speed": int(stats.get("speed", 0)),
		"intelligence": int(stats.get("intelligence", 0)),
		"specialAbility": int(stats.get("specialAbility", 0)),
		"max_hp": max_hp,
		"mana": int(stats.get("maxMana", stats.get("mana", 0))),
		"max_mana": int(stats.get("maxMana", stats.get("mana", 0))),
		"critRate": int(stats.get("critRate", 0)),
		"skills": available_skills,
		"has_item": not get_run_items().is_empty(),
	}

func _ensure_run(book_id: String) -> Dictionary:
	if not save_data.book_progress.has(book_id):
		save_data.book_progress[book_id] = _fresh_run(book_id)
	return save_data.book_progress[book_id]

func _fresh_run(book_id: String) -> Dictionary:
	var graph: StoryGraph = ContentRegistry.get_story_for_book(book_id)
	return {
		"current_node": graph.start_node_id,
		"checkpoint_node": graph.start_node_id,
		"choice_history": [],
		"modifiers": {},
		"unlocked_skills": [],
		"unlocked_items": [],
		"unlocked_forms": [],
		"completed_battles": [],
	}

func _apply_effects(run: Dictionary, effects: Dictionary) -> void:
	for key in effects:
		run.modifiers[key] = int(run.modifiers.get(key, 0)) + int(effects[key])

func _apply_unlock(run: Dictionary, unlock: String) -> void:
	var parts := unlock.split(":", false, 1)
	if parts.size() != 2:
		return
	match parts[0]:
		"skill":
			_append_unique(run.unlocked_skills, parts[1])
		"item":
			_append_unique(run.unlocked_items, parts[1])
			_append_unique(save_data.codex_items, parts[1])
		"form":
			_append_unique(run.unlocked_forms, parts[1])
		"character":
			_append_unique(save_data.unlocked_characters, parts[1])

func _record_ending_if_needed(node_id: String) -> void:
	var graph: StoryGraph = ContentRegistry.get_story_for_book(get_current_book_id())
	var node: Dictionary = graph.get_node(node_id)
	if node.get("type") == "ending":
		_append_unique(save_data.seen_endings, str(node.get("ending_id", node_id)))

func _append_unique(array: Array, value: Variant) -> void:
	if value not in array:
		array.append(value)

func _string_array(source: Variant) -> Array[String]:
	var result: Array[String] = []
	if source is Array:
		for value in source:
			result.append(str(value))
	return result

func _request_save() -> void:
	if has_node("/root/SaveService"):
		SaveService.save_game()
