extends Node

var failures: Array[String] = []
var checks := 0

func _ready() -> void:
	call_deferred("_run")

func _run() -> void:
	print("[万卷浮生] 开始无插件 headless 验收")
	_test_content_registry()
	_test_story_routes()
	await _test_ending_archive()
	await _test_library_hall()
	_test_battle_rules()
	_test_campaign_battles()
	_test_save_lifecycle()
	if failures.is_empty():
		print("[万卷浮生] PASS · %d checks" % checks)
		get_tree().quit(0)
	else:
		for message in failures:
			push_error("[FAIL] %s" % message)
		print("[万卷浮生] FAIL · %d checks · %d failures" % [checks, failures.size()])
		get_tree().quit(1)

func _test_content_registry() -> void:
	_expect(ContentRegistry.validate_content().is_empty(), "内容注册表无缺图、悬空或跨卷引用")
	_expect(ContentRegistry.BOOK_ORDER == ["xiyouji", "sanguo", "fengshen", "honglou", "shuihu", "baishe", "shiji", "liaozhai"], "八卷顺序固定")
	_expect(ContentRegistry.books.size() == 8, "书库恰好包含 8 卷")
	_expect(ContentRegistry.characters.size() == 22, "迁移 22 个人物图鉴项")
	_expect(ContentRegistry.items.size() == 23, "迁移 23 个法宝图鉴项")
	_expect(not ContentRegistry.characters.has("dijia") and not ContentRegistry.characters.has("hou_yi"), "未保留奥特曼和山海经人物")
	_expect(_all_ids_unique(GameContent.BOOKS), "书卷 ID 唯一")
	_expect(_all_ids_unique(GameContent.CHARACTERS), "人物 ID 唯一")
	_expect(_all_ids_unique(GameContent.ITEMS), "法宝 ID 唯一")
	var graph: StoryGraph = ContentRegistry.get_story_for_book("xiyouji")
	_expect(graph != null and graph.nodes.size() == 12, "西游剧情恰好 12 个节点")
	var battle_nodes := 0
	var endings := 0
	for node: Dictionary in graph.nodes.values():
		battle_nodes += 1 if node.get("type") == "battle" else 0
		endings += 1 if node.get("type") == "ending" else 0
	_expect(battle_nodes == 3, "西游剧情包含 3 个战斗节点")
	_expect(endings == 2, "西游剧情包含 2 个结局")
	_expect(ContentRegistry.battles.size() == 3, "战斗注册表恰好 3 场")
	for battle: BattleDefinition in ContentRegistry.battles.values():
		_expect(battle.book_id == "xiyouji" and battle.player_character_id == "sun_wukong", "%s 固定孙悟空出战且不跨卷" % battle.id)

func _test_story_routes() -> void:
	GameState.import_save(GameState.make_default_save())
	_expect(GameState.begin_book("xiyouji"), "可开始西游卷")
	_expect(GameState.choose("leap_first"), "石猴出世选择可提交")
	_expect(GameState.choose("guard_home"), "水帘洞选择可提交")
	_expect(GameState.complete_battle("hunshi_demon"), "混世魔王胜利可提交")
	_expect(GameState.choose("learn_changes"), "七十二变路线可提交")
	_expect(GameState.choose("take_cudgel"), "龙宫取宝可提交")
	_expect(GameState.choose("meet_force"), "天宫路线可提交")
	_expect(GameState.complete_battle("heavenly_guard"), "天兵统领胜利可提交")
	_expect(GameState.choose("qitian_force"), "齐天路线可提交")
	_expect(GameState.complete_battle("erlang_duel"), "二郎神胜利可提交")
	_expect(GameState.choose("wait_and_learn"), "心猿待悟结局可到达")
	_expect("mind_awaits_awakening" in GameState.save_data.seen_endings, "记录心猿待悟结局")
	GameState.restart_book("xiyouji")
	_expect("mind_awaits_awakening" in GameState.save_data.seen_endings, "重开保留已见结局")
	GameState.choose("watch_first")
	GameState.choose("guard_home")
	GameState.complete_battle("hunshi_demon")
	GameState.choose("learn_cloud")
	GameState.choose("take_cudgel")
	GameState.choose("meet_wit")
	GameState.complete_battle("heavenly_guard")
	GameState.choose("qitian_cunning")
	GameState.complete_battle("erlang_duel")
	GameState.choose("remain_defiant")
	_expect("qitian_unbroken" in GameState.save_data.seen_endings, "齐天不屈结局可到达并记录")
	_expect(GameState.save_data.seen_endings.size() == 2, "两种路线结局均可收集")

func _test_ending_archive() -> void:
	var main = load("res://scenes/main.tscn").instantiate()
	add_child(main)
	var snapshot := GameState.save_data.duplicate(true)
	main._show_endings("xiyouji")
	await get_tree().process_frame
	var archive_text := _visible_labels(main._content_host)
	_expect("心猿待悟" in archive_text and "齐天不屈" in archive_text, "结局图鉴展示两种已见结局")
	_expect("五百年风霜" in archive_text and "五行山镇住身形" in archive_text, "已见结局可直接回看完整正文")
	_expect("2 / 2" in archive_text, "结局图鉴显示本卷收集进度")
	_expect(GameState.save_data == snapshot, "回看结局不改变当前节点、属性与选择历史")
	GameState.restart_book("xiyouji")
	SaveService.load_game()
	main._show_endings("xiyouji")
	_expect("齐天不屈" in _visible_labels(main._content_host), "重开并重新读档后仍能查阅旧结局")
	_expect(GameState.get_current_node_id() == "stone_birth", "回看旧结局后仍停留在新一轮起点")
	GameState.save_data.seen_endings = ["mind_awaits_awakening"]
	main._show_endings("xiyouji")
	archive_text = _visible_labels(main._content_host)
	_expect("1 / 2" in archive_text and "心猿待悟" in archive_text, "部分解锁时显示实际收集数量")
	_expect("齐天不屈" not in archive_text and "五行山镇住身形" not in archive_text, "未解锁结局隐藏标题与剧情正文")
	main._show_endings("sanguo")
	archive_text = _visible_labels(main._content_host)
	_expect("本卷剧情待开放" in archive_text and "心猿待悟" not in archive_text, "待开放书卷显示空状态且不混入西游结局")
	GameState.clear_all_progress()
	SaveService.load_game()
	main._show_endings("xiyouji")
	archive_text = _visible_labels(main._content_host)
	_expect("0 / 2" in archive_text and "心猿待悟" not in archive_text, "清空进度并读档后结局重新锁定")
	for button in main._content_host.find_children("*", "Button", true, false):
		if button.text == "人物":
			button.pressed.emit()
	_expect("孙悟空" in _visible_labels(main._content_host), "从结局切回人物图鉴仍正常显示")
	main._show_library()
	for button in main._content_host.find_children("*", "Button", true, false):
		if button.text == "查看结局":
			button.pressed.emit()
	_expect(main._codex_mode == "endings" and "0 / 2" in _visible_labels(main._content_host), "藏经阁入口可打开结局图鉴")
	main.queue_free()
	await get_tree().process_frame
	GameState.import_save(snapshot)

func _test_library_hall() -> void:
	var main = load("res://scenes/main.tscn").instantiate()
	add_child(main)
	var snapshot := GameState.save_data.duplicate(true)
	for index in ContentRegistry.BOOK_ORDER.size():
		main._show_library()
		await get_tree().process_frame
		var hall = main._content_host.get_child(0)
		var book_id: String = ContentRegistry.BOOK_ORDER[index]
		var stand: Button = hall._stands[index]
		await _press_control(stand, index % 2 == 1)
		_expect(hall.selected_book_id == book_id, "%s 的立体书卷可通过鼠标或触控选中" % book_id)
		await _press_control(hall.get_node("Composition/Info/OpenBook"))
		_expect(main._current_screen == "book" and main._selected_book_id == book_id, "%s 场景入口接入对应卷宗" % book_id)
	_expect(GameState.save_data == snapshot, "选卷与查阅资料不改变已保存的路线")
	main._show_library()
	await get_tree().process_frame
	var hall = main._content_host.get_child(0)
	var reduced_motion_before: bool = SaveService.settings.reduced_motion
	SaveService.settings.reduced_motion = true
	hall._process(0.1)
	_expect(hall._books.position == Vector2.ZERO and hall._architecture.position == Vector2.ZERO, "减少动态效果关闭场景视差")
	SaveService.settings.reduced_motion = reduced_motion_before
	await _press_control(hall.get_node("Composition/Info/Endings"), true)
	_expect(main._current_screen == "codex" and main._codex_mode == "endings", "新藏经阁保留结局收藏入口")
	main.queue_free()
	await get_tree().process_frame

func _press_control(control: Control, touch: bool = false) -> void:
	var point := control.get_global_rect().get_center()
	for down in [true, false]:
		if touch:
			var event := InputEventScreenTouch.new()
			event.position = point
			event.pressed = down
			get_viewport().push_input(event, true)
		else:
			var event := InputEventMouseButton.new()
			event.position = point
			event.button_index = MOUSE_BUTTON_LEFT
			event.pressed = down
			get_viewport().push_input(event, true)
	await get_tree().process_frame

func _visible_labels(node: Node) -> String:
	var result := ""
	if node is Label and node.is_visible_in_tree():
		result = node.text + "\n"
	for child in node.get_children():
		result += _visible_labels(child)
	return result

func _test_battle_rules() -> void:
	var definition := _test_battle_definition()
	var player := _test_player()
	var attack_engine := BattleEngine.new()
	attack_engine.start_battle(player, definition, 20260904)
	var enemy_hp_before := int(attack_engine.state.enemy.current_hp)
	var attack_result := attack_engine.player_action("attack")
	_expect(attack_result.accepted and int(attack_engine.state.enemy.current_hp) < enemy_hp_before, "普通攻击造成伤害")

	var skill_engine := BattleEngine.new()
	skill_engine.start_battle(player, definition, 42)
	var mana_before := int(skill_engine.state.player.current_mana)
	var skill_result := skill_engine.player_action("skill:test_skill")
	_expect(skill_result.accepted and int(skill_engine.state.player.current_mana) == mana_before - 20, "技能正确消耗 MP")
	_expect(int(skill_engine.state.cooldowns.test_skill) == 3, "技能使用后显示 3 回合冷却")
	skill_engine.player_action("attack")
	skill_engine.player_action("attack")
	skill_engine.player_action("attack")
	_expect(int(skill_engine.state.cooldowns.test_skill) == 0, "跨过 3 个行动后冷却结束")

	var plain_engine := BattleEngine.new()
	plain_engine.start_battle(player, definition, 11)
	plain_engine.player_action("attack")
	var plain_loss := int(plain_engine.state.player.max_hp) - int(plain_engine.state.player.current_hp)
	var defend_engine := BattleEngine.new()
	defend_engine.start_battle(player, definition, 11)
	defend_engine.player_action("defend")
	var defend_loss := int(defend_engine.state.player.max_hp) - int(defend_engine.state.player.current_hp)
	_expect(defend_loss < plain_loss, "防御姿态降低下一次伤害")

	var item_engine := BattleEngine.new()
	item_engine.start_battle(player, definition, 7)
	item_engine.player_action("attack")
	var item_result := item_engine.player_action("item")
	var second_item := item_engine.player_action("item")
	_expect(item_result.accepted and item_engine.state.item_used, "法宝行动可恢复生命并标记已用")
	_expect(not second_item.accepted, "每场战斗法宝仅可使用一次")

	var timeout_definition := _test_battle_definition()
	timeout_definition.enemy.attack = 1
	timeout_definition.enemy.defense = 9999
	timeout_definition.enemy.max_hp = 9999
	var timeout_player := _test_player()
	timeout_player.attack = 1
	timeout_player.defense = 9999
	timeout_player.max_hp = 9999
	var timeout_engine := BattleEngine.new()
	timeout_engine.start_battle(timeout_player, timeout_definition, 99)
	while not timeout_engine.state.finished:
		timeout_engine.player_action("defend")
	_expect(int(timeout_engine.state.round) == 12 and timeout_engine.state.finished, "第 12 回合强制按生命比例结算")

func _test_campaign_battles() -> void:
	GameState.import_save(GameState.make_default_save())
	GameState.begin_book("xiyouji")
	GameState.choose("leap_first")
	GameState.choose("guard_home")
	_expect(_win_campaign_battle("hunshi_demon", 101), "混世魔王战可在 12 回合内取胜")
	GameState.complete_battle("hunshi_demon")
	GameState.choose("learn_cloud")
	GameState.choose("take_cudgel")
	GameState.choose("meet_force")
	_expect(_win_campaign_battle("heavenly_guard", 202), "天兵统领战可在 12 回合内取胜")
	GameState.complete_battle("heavenly_guard")
	GameState.choose("qitian_force")
	_expect(_win_campaign_battle("erlang_duel", 303), "二郎神战可在 12 回合内取胜")

func _win_campaign_battle(battle_id: String, seed: int) -> bool:
	var definition: BattleDefinition = ContentRegistry.get_battle(battle_id)
	var engine := BattleEngine.new()
	engine.start_battle(GameState.get_player_snapshot("sun_wukong"), definition, seed)
	while not engine.state.finished:
		var action := "attack"
		for info: Dictionary in engine.get_player_skill_actions():
			if info.enabled and info.id == "skill:sun_wukong_skill_1":
				action = str(info.id)
				break
		if engine.state.player.has_item and not engine.state.item_used and float(engine.state.player.current_hp) / float(engine.state.player.max_hp) < 0.35:
			action = "item"
		engine.player_action(action)
	return engine.state.winner == "player" and int(engine.state.round) <= 12

func _test_save_lifecycle() -> void:
	var snapshot := GameState.save_data.duplicate(true)
	_expect(SaveService.save_game(), "单档 save_v1.json 可写入")
	GameState.import_save(GameState.make_default_save())
	SaveService.load_game()
	_expect(GameState.save_data.seen_endings == snapshot.seen_endings, "存档写入后可往返恢复")
	var encoded := JSON.stringify(snapshot)
	var decoded: Variant = JSON.parse_string(encoded)
	_expect(decoded is Dictionary and GameState.import_save(decoded), "schema_version 1 JSON 可往返导入")
	var bad := FileAccess.open(SaveService.SAVE_PATH, FileAccess.WRITE)
	if bad != null:
		bad.store_string("{ this is not valid json")
		bad.close()
	SaveService.load_game()
	_expect(not SaveService.last_warning.is_empty(), "损坏存档降级时给出提示")
	_expect(int(GameState.save_data.schema_version) == 1, "损坏存档不阻止创建新档")
	GameState.save_data.seen_endings = ["mind_awaits_awakening"]
	GameState.save_data.codex_items = ["xiyouji_golden_cudgel"]
	GameState.restart_book("xiyouji")
	_expect("mind_awaits_awakening" in GameState.save_data.seen_endings and "xiyouji_golden_cudgel" in GameState.save_data.codex_items, "重开本卷保留图鉴与结局")
	GameState.clear_all_progress()
	_expect(GameState.save_data.seen_endings.is_empty() and GameState.save_data.codex_items.is_empty(), "清除全部进度移除图鉴与结局")

func _test_battle_definition() -> BattleDefinition:
	var result := BattleDefinition.new()
	result.id = "test_battle"
	result.book_id = "xiyouji"
	result.player_character_id = "sun_wukong"
	result.max_rounds = 12
	result.enemy = {
		"id": "dummy", "name": "校验木人", "portrait_path": "res://icon.svg",
		"attack": 30, "defense": 35, "speed": 20, "specialAbility": 20,
		"max_hp": 999, "mana": 0, "max_mana": 0, "critRate": 0,
		"skills": [{"id": "dummy_hit", "name": "木人击", "type": "physical_attack", "multiplier": 1.0, "manaCost": 0}],
	}
	return result

func _test_player() -> Dictionary:
	return {
		"id": "sun_wukong", "name": "孙悟空", "portrait_path": "res://icon.svg",
		"attack": 80, "defense": 40, "speed": 70, "specialAbility": 60,
		"max_hp": 500, "mana": 100, "max_mana": 100, "critRate": 0,
		"skills": [{"id": "test_skill", "name": "试炼一击", "type": "physical_attack", "multiplier": 1.2, "manaCost": 20}],
		"has_item": true,
	}

func _all_ids_unique(records: Array) -> bool:
	var seen := {}
	for record in records:
		var id := str(record.get("id", ""))
		if id.is_empty() or seen.has(id):
			return false
		seen[id] = true
	return true

func _expect(condition: bool, message: String) -> void:
	checks += 1
	if condition:
		print("  PASS · %s" % message)
	else:
		failures.append(message)
