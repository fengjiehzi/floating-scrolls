extends Control

const PAPER := Color("#e8e0ce")
const PAPER_DARK := Color("#cfc3aa")
const MUTED := Color("#a8a18f")
const GOLD := Color("#caa66b")
const CINNABAR := Color("#a94b3f")
const JADE := Color("#648377")
const NIGHT := Color("#101417")
const PANEL := Color("#20262aee")

var _content_host: PanelContainer
var _safe_frame: MarginContainer
var _title_label: Label
var _crumb_label: Label
var _toast_panel: PanelContainer
var _toast_label: Label
var _toast_timer: Timer
var _current_screen := "library"
var _selected_book_id := "xiyouji"
var _codex_book_id := "xiyouji"
var _codex_mode := "characters"
var _codex_grid: GridContainer
var _codex_summary: Label
var _battle_engine: BattleEngine
var _battle_definition: BattleDefinition
var _battle_player_hp: ProgressBar
var _battle_enemy_hp: ProgressBar
var _battle_player_status: Label
var _battle_enemy_status: Label
var _battle_round_label: Label
var _battle_log: RichTextLabel
var _battle_actions: GridContainer
var _battle_result: VBoxContainer
var _battle_action_buttons: Dictionary = {}

func _ready() -> void:
	RenderingServer.set_default_clear_color(NIGHT)
	_build_theme()
	_build_shell()
	get_viewport().size_changed.connect(_apply_safe_area)
	GameState.toast_requested.connect(_show_toast)
	_apply_safe_area()
	_show_library()
	if not SaveService.last_warning.is_empty():
		_show_toast(SaveService.last_warning)

func _build_theme() -> void:
	var app_theme := Theme.new()
	app_theme.default_font_size = 18
	var font_path := "res://assets/fonts/source-han-sans-sc.otf"
	if ResourceLoader.exists(font_path):
		app_theme.default_font = load(font_path)
	app_theme.set_color("font_color", "Label", PAPER)
	app_theme.set_color("font_color", "Button", PAPER)
	app_theme.set_color("font_hover_color", "Button", Color.WHITE)
	app_theme.set_color("font_pressed_color", "Button", Color.WHITE)
	app_theme.set_color("font_disabled_color", "Button", Color("#77766f"))
	app_theme.set_constant("outline_size", "Label", 2)
	app_theme.set_color("font_outline_color", "Label", Color("#00000055"))
	app_theme.set_stylebox("panel", "PanelContainer", _style(PANEL, 14, Color("#6f695b66"), 1))
	app_theme.set_stylebox("normal", "Button", _style(Color("#30383c"), 10, Color("#867a65"), 1))
	app_theme.set_stylebox("hover", "Button", _style(Color("#3d474b"), 10, GOLD, 1))
	app_theme.set_stylebox("pressed", "Button", _style(Color("#704039"), 10, CINNABAR, 2))
	app_theme.set_stylebox("disabled", "Button", _style(Color("#272b2d"), 10, Color("#4e4d49"), 1))
	app_theme.set_stylebox("normal", "ProgressBar", _style(Color("#111516"), 8))
	app_theme.set_stylebox("fill", "ProgressBar", _style(CINNABAR, 8))
	theme = app_theme

func _build_shell() -> void:
	var background := TextureRect.new()
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.texture = load("res://assets/art/backgrounds/welcome-world-base.png")
	background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	background.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	var veil := ColorRect.new()
	veil.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	veil.color = Color("#080c0ed4")
	veil.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(veil)

	_safe_frame = MarginContainer.new()
	_safe_frame.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_safe_frame.add_theme_constant_override("margin_left", 28)
	_safe_frame.add_theme_constant_override("margin_right", 28)
	_safe_frame.add_theme_constant_override("margin_top", 18)
	_safe_frame.add_theme_constant_override("margin_bottom", 18)
	add_child(_safe_frame)

	var shell := VBoxContainer.new()
	shell.add_theme_constant_override("separation", 14)
	_safe_frame.add_child(shell)
	var top_bar := HBoxContainer.new()
	top_bar.custom_minimum_size.y = 64
	top_bar.add_theme_constant_override("separation", 12)
	shell.add_child(top_bar)
	var seal := Label.new()
	seal.text = "万\n卷"
	seal.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	seal.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	seal.custom_minimum_size = Vector2(52, 52)
	seal.add_theme_font_size_override("font_size", 18)
	seal.add_theme_color_override("font_color", Color.WHITE)
	seal.add_theme_stylebox_override("normal", _style(CINNABAR, 6, Color("#d4b07a"), 1))
	top_bar.add_child(seal)
	var title_stack := VBoxContainer.new()
	title_stack.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_bar.add_child(title_stack)
	_title_label = _label("藏经阁", 27, PAPER)
	title_stack.add_child(_title_label)
	_crumb_label = _label("八卷古籍 · 一段可玩的原著旅程", 13, MUTED)
	title_stack.add_child(_crumb_label)
	top_bar.add_child(_nav_button("藏经阁", _show_library))
	top_bar.add_child(_nav_button("图鉴", _show_codex))
	top_bar.add_child(_nav_button("设置", _show_settings))

	_content_host = PanelContainer.new()
	_content_host.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_content_host.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_content_host.add_theme_stylebox_override("panel", _style(Color("#14191ce8"), 18, Color("#8b7a5a66"), 1))
	shell.add_child(_content_host)

	_toast_panel = PanelContainer.new()
	_toast_panel.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_toast_panel.position = Vector2(-230, -84)
	_toast_panel.size = Vector2(460, 56)
	_toast_panel.add_theme_stylebox_override("panel", _style(Color("#22292af5"), 12, GOLD, 1))
	_toast_panel.visible = false
	add_child(_toast_panel)
	_toast_label = _label("", 16, PAPER)
	_toast_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_toast_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_toast_panel.add_child(_toast_label)
	_toast_timer = Timer.new()
	_toast_timer.one_shot = true
	_toast_timer.wait_time = 3.2
	_toast_timer.timeout.connect(func() -> void: _toast_panel.hide())
	add_child(_toast_timer)

func _show_library() -> void:
	_current_screen = "library"
	_set_header("藏经阁", "灯下展卷 · 八卷入世")
	_clear_content()
	_content_host.add_theme_stylebox_override("panel", StyleBoxEmpty.new())
	var hall = preload("res://scenes/library/library_hall.tscn").instantiate()
	hall.book_opened.connect(_show_book_detail)
	hall.endings_requested.connect(func() -> void: _show_endings("xiyouji"))
	_content_host.add_child(hall)
	hall.select_book(_selected_book_id)

func _show_book_detail(book_id: String) -> void:
	var book: BookDefinition = ContentRegistry.get_book(book_id)
	if book == null:
		return
	_selected_book_id = book_id
	_current_screen = "book"
	_set_header(book.title, "藏经阁 / %s" % book.realm_tag)
	_clear_content()
	var margin := _margin(30)
	_content_host.add_child(margin)
	var root := HBoxContainer.new()
	root.add_theme_constant_override("separation", 34)
	margin.add_child(root)
	var art_panel := PanelContainer.new()
	art_panel.custom_minimum_size = Vector2(360, 0)
	art_panel.add_theme_stylebox_override("panel", _style(Color("#0f1315"), 14, book.accent, 1))
	root.add_child(art_panel)
	art_panel.add_child(_texture(book.cover_path, Vector2(360, 530)))

	var info := VBoxContainer.new()
	info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	info.add_theme_constant_override("separation", 15)
	root.add_child(info)
	info.add_child(_kicker("卷宗 %s · %s" % [book.id.to_upper(), "已开放" if book.playable else "待开放"]))
	info.add_child(_label(book.title, 42, PAPER))
	info.add_child(_label("%s · %s" % [book.author, book.realm_tag], 17, GOLD))
	var desc := _label(book.description, 18, PAPER_DARK)
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	info.add_child(desc)
	var quote_panel := PanelContainer.new()
	quote_panel.add_theme_stylebox_override("panel", _style(Color("#2b2d28aa"), 10, book.accent, 1))
	info.add_child(quote_panel)
	var quote := _label("“%s”" % book.quote, 17, PAPER)
	quote.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	quote_panel.add_child(_padded(quote, 18, 14))
	info.add_child(_label("人物 %d 位    法宝 %d 件" % [ContentRegistry.get_characters_for_book(book.id).size(), ContentRegistry.get_items_for_book(book.id).size()], 14, MUTED))
	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 12)
	info.add_child(actions)
	actions.add_child(_button("返回藏经阁", _show_library))
	if book.playable:
		var has_run := not GameState.get_book_progress(book.id).is_empty()
		actions.add_child(_primary_button("继续书卷" if has_run else "从石猴出世开始", func() -> void: _enter_story(book.id)))
		if has_run:
			actions.add_child(_button("重开本卷", func() -> void: _confirm_restart_book(book.id)))
	else:
		var waiting := _button("剧情待开放", func() -> void: _show_toast("本卷资料已保留，正式剧情尚未开放。"))
		waiting.disabled = true
		actions.add_child(waiting)

func _enter_story(book_id: String) -> void:
	if not GameState.begin_book(book_id):
		_show_toast("本卷尚未开放。")
		return
	_show_story()

func _show_story() -> void:
	var node: Dictionary = GameState.get_current_node()
	if node.is_empty():
		_show_library()
		return
	_current_screen = "story"
	_set_header(str(node.get("title", "书卷")), "《西游记》 · 第 %d 章 · %s" % [int(node.get("chapter", 1)), _story_progress_text()])
	_clear_content()
	var margin := _margin(26)
	_content_host.add_child(margin)
	var root := VBoxContainer.new()
	root.add_theme_constant_override("separation", 16)
	margin.add_child(root)
	var chapter_bar := HBoxContainer.new()
	chapter_bar.add_theme_constant_override("separation", 8)
	root.add_child(chapter_bar)
	for anchor in ["壹 · 花果山", "贰 · 方寸龙宫", "叁 · 大闹天宫"]:
		var chip := _label(anchor, 13, GOLD)
		chip.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		chip.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		chip.add_theme_stylebox_override("normal", _style(Color("#2b302ddd"), 8, Color("#7b725f"), 1))
		chapter_bar.add_child(chip)

	var scene_panel := PanelContainer.new()
	scene_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scene_panel.add_theme_stylebox_override("panel", _style(Color("#1b2023eb"), 16, Color("#8e7b59"), 1))
	root.add_child(scene_panel)
	var scene_margin := _margin(18)
	scene_panel.add_child(scene_margin)
	var scene := HBoxContainer.new()
	scene.add_theme_constant_override("separation", 26)
	scene_margin.add_child(scene)
	var text_stack := VBoxContainer.new()
	text_stack.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	text_stack.add_theme_constant_override("separation", 12)
	scene.add_child(text_stack)
	text_stack.add_child(_kicker("第 %02d 幕 · %s" % [_current_node_index(), str(node.get("type", "story")).to_upper()]))
	text_stack.add_child(_label(str(node.get("title", "")), 34, PAPER))
	text_stack.add_child(_label(str(node.get("speaker", "守卷人")), 15, GOLD))
	var prose := _label(str(node.get("text", "")), 21, PAPER_DARK)
	prose.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	prose.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	prose.size_flags_vertical = Control.SIZE_EXPAND_FILL
	text_stack.add_child(prose)
	text_stack.add_child(_modifier_strip())
	var portrait := PanelContainer.new()
	portrait.custom_minimum_size = Vector2(285, 0)
	portrait.add_theme_stylebox_override("panel", _style(Color("#0e1214"), 12, Color("#645c4d"), 1))
	portrait.add_child(_texture("res://assets/art/characters/xiyouji-sun-wukong.png", Vector2(285, 320)))
	scene.add_child(portrait)

	var choices := HBoxContainer.new()
	choices.custom_minimum_size.y = 64
	choices.add_theme_constant_override("separation", 12)
	root.add_child(choices)
	var node_type := str(node.get("type", "story"))
	if node_type == "battle":
		choices.add_child(_button("返回藏经阁", _show_library))
		choices.add_child(_primary_button("进入战斗", func() -> void: _start_battle(str(node.get("battle_id", "")))))
	elif node_type == "ending":
		choices.add_child(_button("返回藏经阁", _show_library))
		choices.add_child(_button("查看图鉴", _show_codex))
		choices.add_child(_button("查看结局", func() -> void: _show_endings(GameState.get_current_book_id())))
		choices.add_child(_primary_button("重开《西游记》", func() -> void: _confirm_restart_book("xiyouji")))
	else:
		for choice: Dictionary in node.get("choices", []):
			var choice_id := str(choice.get("id", ""))
			var choice_text := str(choice.get("text", "继续"))
			choices.add_child(_primary_button(choice_text, func() -> void: _choose_story(choice_id)))

func _choose_story(choice_id: String) -> void:
	if GameState.choose(choice_id):
		_show_toast("选择已落入本地存档")
		_show_story()

func _start_battle(battle_id: String) -> void:
	_battle_definition = ContentRegistry.get_battle(battle_id)
	if _battle_definition == null:
		_show_toast("战斗资料缺失。")
		return
	_current_screen = "battle"
	_battle_engine = BattleEngine.new()
	_battle_engine.start_battle(GameState.get_player_snapshot(_battle_definition.player_character_id), _battle_definition)
	_build_battle_screen()

func _build_battle_screen() -> void:
	_set_header(_battle_definition.enemy.name, "《西游记》 · 1 对 1 主动回合制")
	_clear_content()
	_battle_action_buttons.clear()
	var margin := _margin(22)
	_content_host.add_child(margin)
	var root := VBoxContainer.new()
	root.add_theme_constant_override("separation", 12)
	margin.add_child(root)
	var arena := HBoxContainer.new()
	arena.size_flags_vertical = Control.SIZE_EXPAND_FILL
	arena.add_theme_constant_override("separation", 18)
	root.add_child(arena)
	var player_panel := _combatant_panel(_battle_engine.state.player, true)
	arena.add_child(player_panel)
	var center := VBoxContainer.new()
	center.custom_minimum_size.x = 360
	center.add_theme_constant_override("separation", 8)
	arena.add_child(center)
	_battle_round_label = _label("", 18, GOLD)
	_battle_round_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(_battle_round_label)
	_battle_log = RichTextLabel.new()
	_battle_log.bbcode_enabled = false
	_battle_log.fit_content = false
	_battle_log.scroll_active = true
	_battle_log.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_battle_log.custom_minimum_size.y = 220
	_battle_log.add_theme_font_size_override("normal_font_size", 15)
	_battle_log.add_theme_color_override("default_color", PAPER_DARK)
	center.add_child(_battle_log)
	var rule := _label("技能消耗 MP 并冷却 3 回合 · 第 12 回合按剩余生命比例判定", 12, MUTED)
	rule.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	rule.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.add_child(rule)
	arena.add_child(_combatant_panel(_battle_engine.state.enemy, false))

	var footer := PanelContainer.new()
	footer.add_theme_stylebox_override("panel", _style(Color("#22282bf2"), 12, Color("#746952"), 1))
	root.add_child(footer)
	var footer_margin := _padded(VBoxContainer.new(), 14, 12)
	footer.add_child(footer_margin)
	var footer_box: VBoxContainer = footer_margin.get_child(0)
	footer_box.add_theme_constant_override("separation", 10)
	_battle_actions = GridContainer.new()
	_battle_actions.columns = 3
	_battle_actions.add_theme_constant_override("h_separation", 10)
	_battle_actions.add_theme_constant_override("v_separation", 8)
	footer_box.add_child(_battle_actions)
	_add_battle_button("attack", "普通攻击")
	_add_battle_button("defend", "防御姿态")
	_add_battle_button("item", "法宝行动")
	for skill_info: Dictionary in _battle_engine.get_player_skill_actions():
		_add_battle_button(str(skill_info.id), str(skill_info.name))
	_battle_result = VBoxContainer.new()
	_battle_result.visible = false
	footer_box.add_child(_battle_result)
	for event: Dictionary in _battle_engine.state.history:
		_append_battle_log(str(event.text))
	_refresh_battle()

func _combatant_panel(actor: Dictionary, player_side: bool) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(285, 0)
	panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel.add_theme_stylebox_override("panel", _style(Color("#171c1ee8"), 14, JADE if player_side else CINNABAR, 1))
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 8)
	panel.add_child(box)
	var name_label := _label(str(actor.name), 24, PAPER)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(name_label)
	box.add_child(_texture(str(actor.portrait_path), Vector2(285, 230)))
	var hp := ProgressBar.new()
	hp.custom_minimum_size.y = 24
	hp.max_value = float(actor.max_hp)
	hp.value = float(actor.current_hp)
	hp.show_percentage = false
	box.add_child(hp)
	var status := _label("", 14, PAPER_DARK)
	status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(status)
	if player_side:
		_battle_player_hp = hp
		_battle_player_status = status
	else:
		_battle_enemy_hp = hp
		_battle_enemy_status = status
	return panel

func _add_battle_button(action_id: String, action_name: String) -> void:
	var stable_action := action_id
	var action_button := _button(action_name, func() -> void: _battle_action(stable_action))
	action_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	action_button.custom_minimum_size.y = 52
	_battle_actions.add_child(action_button)
	_battle_action_buttons[action_id] = action_button

func _battle_action(action_id: String) -> void:
	var response: Dictionary = _battle_engine.player_action(action_id)
	if not response.get("accepted", false):
		_show_toast("当前无法执行这个行动。")
		return
	for event: Dictionary in response.events:
		_append_battle_log(str(event.text))
	_refresh_battle()
	if response.get("finished", false):
		_show_battle_result(str(response.get("winner", "enemy")))

func _refresh_battle() -> void:
	var state: Dictionary = _battle_engine.state
	_battle_player_hp.max_value = float(state.player.max_hp)
	_battle_player_hp.value = float(state.player.current_hp)
	_battle_enemy_hp.max_value = float(state.enemy.max_hp)
	_battle_enemy_hp.value = float(state.enemy.current_hp)
	_battle_player_status.text = "生命 %d / %d    灵力 %d / %d" % [state.player.current_hp, state.player.max_hp, state.player.current_mana, state.player.max_mana]
	_battle_enemy_status.text = "生命 %d / %d    灵力 %d / %d" % [state.enemy.current_hp, state.enemy.max_hp, state.enemy.current_mana, state.enemy.max_mana]
	_battle_round_label.text = "第 %d / %d 回合" % [state.round, state.max_rounds]
	if _battle_action_buttons.has("item"):
		var item_button: Button = _battle_action_buttons.item
		item_button.disabled = state.item_used or not state.player.get("has_item", false) or state.player.current_hp >= state.player.max_hp
		item_button.text = "法宝已用" if state.item_used else "法宝行动"
	for info: Dictionary in _battle_engine.get_player_skill_actions():
		var button: Button = _battle_action_buttons.get(str(info.id))
		if button == null:
			continue
		button.disabled = not bool(info.enabled)
		button.text = "%s · MP %d%s" % [info.name, info.mana_cost, " · 冷却 %d" % info.cooldown if info.cooldown > 0 else ""]

func _show_battle_result(winner: String) -> void:
	for button: Button in _battle_action_buttons.values():
		button.disabled = true
	_battle_result.show()
	_battle_result.add_child(_label("战斗胜利" if winner == "player" else "战斗失利", 23, GOLD if winner == "player" else CINNABAR))
	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 10)
	_battle_result.add_child(actions)
	if winner == "player":
		actions.add_child(_primary_button("继续剧情", _accept_battle_victory))
	else:
		actions.add_child(_primary_button("重试本战", func() -> void: _start_battle(_battle_definition.id)))
		actions.add_child(_button("返回藏经阁", _show_library))

func _accept_battle_victory() -> void:
	if GameState.complete_battle(_battle_definition.id):
		_show_toast("胜利节点已自动保存")
		_show_story()

func _append_battle_log(text: String) -> void:
	_battle_log.append_text("• %s\n" % text)
	_battle_log.scroll_to_line(maxi(0, _battle_log.get_line_count() - 1))

func _show_endings(book_id: String) -> void:
	_codex_book_id = book_id
	_codex_mode = "endings"
	_show_codex()

func _show_codex() -> void:
	_current_screen = "codex"
	_set_header("万象图鉴", "八卷人物、法宝与已见结局")
	_clear_content()
	var margin := _margin(22)
	_content_host.add_child(margin)
	var root := VBoxContainer.new()
	root.add_theme_constant_override("separation", 14)
	margin.add_child(root)
	var toolbar := HBoxContainer.new()
	toolbar.add_theme_constant_override("separation", 10)
	root.add_child(toolbar)
	toolbar.add_child(_kicker("卷内图鉴"))
	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	toolbar.add_child(spacer)
	var book_picker := OptionButton.new()
	book_picker.custom_minimum_size = Vector2(180, 48)
	var selected_index := 0
	var index := 0
	for book: BookDefinition in ContentRegistry.get_books():
		book_picker.add_item(book.title)
		book_picker.set_item_metadata(index, book.id)
		if book.id == _codex_book_id:
			selected_index = index
		index += 1
	book_picker.select(selected_index)
	book_picker.item_selected.connect(func(picked: int) -> void:
		_codex_book_id = str(book_picker.get_item_metadata(picked))
		_refresh_codex_grid()
	)
	toolbar.add_child(book_picker)
	var mode_group := ButtonGroup.new()
	var modes := {"characters": "人物", "items": "法宝", "endings": "结局"}
	for mode: String in modes:
		var mode_button := _button(modes[mode], func() -> void: _set_codex_mode(mode))
		mode_button.toggle_mode = true
		mode_button.button_group = mode_group
		mode_button.button_pressed = _codex_mode == mode
		toolbar.add_child(mode_button)
	_codex_summary = _label("", 15, GOLD)
	root.add_child(_codex_summary)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	root.add_child(scroll)
	_codex_grid = GridContainer.new()
	_codex_grid.columns = 4
	_codex_grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_codex_grid.add_theme_constant_override("h_separation", 12)
	_codex_grid.add_theme_constant_override("v_separation", 12)
	scroll.add_child(_codex_grid)
	_refresh_codex_grid()

func _set_codex_mode(mode: String) -> void:
	_codex_mode = mode
	_refresh_codex_grid()

func _refresh_codex_grid() -> void:
	if _codex_grid == null:
		return
	_free_children(_codex_grid)
	_codex_grid.columns = 2 if _codex_mode == "endings" else 4
	_codex_summary.visible = _codex_mode == "endings"
	if _codex_mode == "characters":
		for character: CharacterDefinition in ContentRegistry.get_characters_for_book(_codex_book_id):
			_codex_grid.add_child(_character_codex_card(character))
	elif _codex_mode == "items":
		for item: ItemDefinition in ContentRegistry.get_items_for_book(_codex_book_id):
			_codex_grid.add_child(_item_codex_card(item))
	else:
		var graph: StoryGraph = ContentRegistry.get_story_for_book(_codex_book_id)
		var unlocked_count := 0
		if graph != null:
			for node: Dictionary in graph.nodes.values():
				if node.get("type") != "ending":
					continue
				var unlocked: bool = node.get("ending_id", node.id) in GameState.save_data.seen_endings
				unlocked_count += 1 if unlocked else 0
				_codex_grid.add_child(_ending_codex_card(node, unlocked))
		_codex_summary.text = "已见结局 %d / %d · 重开本卷后仍可查阅" % [unlocked_count, _codex_grid.get_child_count()]
	if _codex_grid.get_child_count() == 0:
		_codex_grid.columns = 1
		var empty_text := "本卷剧情待开放，尚无可收集的结局。" if _codex_mode == "endings" else "本卷暂无可展示的%s资料。" % ["人物" if _codex_mode == "characters" else "法宝"]
		_codex_grid.add_child(_label(empty_text, 18, MUTED))

func _ending_codex_card(node: Dictionary, unlocked: bool) -> PanelContainer:
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(320, 280)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.add_theme_stylebox_override("panel", _style(Color("#23292ce8"), 12, GOLD if unlocked else Color("#555650"), 1))
	var info := VBoxContainer.new()
	info.add_theme_constant_override("separation", 18)
	card.add_child(_padded(info, 24, 24))
	info.add_child(_kicker("已收入卷末" if unlocked else "尚未解锁"))
	info.add_child(_label(str(node.title) if unlocked else "未见结局", 28, PAPER if unlocked else MUTED))
	var prose := _label(str(node.text) if unlocked else "走到本卷终章后，这一页才会展开。", 19, PAPER_DARK if unlocked else MUTED)
	prose.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	prose.size_flags_vertical = Control.SIZE_EXPAND_FILL
	info.add_child(prose)
	info.add_child(_label("查阅不会改变当前书卷进度" if unlocked else "重开本卷，尝试不同的终章选择", 14, MUTED))
	return card

func _character_codex_card(character: CharacterDefinition) -> PanelContainer:
	var unlocked := GameState.is_character_unlocked(character.id)
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(235, 330)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.add_theme_stylebox_override("panel", _style(Color("#23292ce8"), 12, JADE if unlocked else Color("#555650"), 1))
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 7)
	card.add_child(box)
	var portrait := _texture(character.portrait_path, Vector2(235, 175))
	portrait.modulate = Color.WHITE if unlocked else Color("#777777")
	box.add_child(portrait)
	var body := _margin_sides(12, 10)
	box.add_child(body)
	var info := VBoxContainer.new()
	body.add_child(info)
	info.add_child(_label(character.display_name, 20, PAPER if unlocked else MUTED))
	var state_text := "已解锁" if unlocked else ("资料待补全 · 未解锁" if not character.complete_data else "未解锁")
	info.add_child(_label(state_text, 12, GOLD if unlocked else MUTED))
	var desc_text := character.description if unlocked else "沿书中足迹前行后，人物生平与能力将在此显现。"
	var desc := _label(desc_text, 13, PAPER_DARK if unlocked else MUTED)
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	info.add_child(desc)
	return card

func _item_codex_card(item: ItemDefinition) -> PanelContainer:
	var unlocked := GameState.is_item_unlocked(item.id)
	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(235, 330)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.add_theme_stylebox_override("panel", _style(Color("#23292ce8"), 12, GOLD if unlocked else Color("#555650"), 1))
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 7)
	card.add_child(box)
	var artwork := _texture(item.artwork_path, Vector2(235, 175))
	artwork.modulate = Color.WHITE if unlocked else Color("#777777")
	box.add_child(artwork)
	var body := _margin_sides(12, 10)
	box.add_child(body)
	var info := VBoxContainer.new()
	body.add_child(info)
	info.add_child(_label(item.display_name, 20, PAPER if unlocked else MUTED))
	info.add_child(_label("%s · %s" % [item.rarity, "已解锁" if unlocked else "未解锁"], 12, GOLD if unlocked else MUTED))
	var desc_text := item.source_basis if unlocked else "原著说明将在获得此物后展开。"
	var desc := _label(desc_text, 13, PAPER_DARK if unlocked else MUTED)
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	info.add_child(desc)
	return card

func _show_settings() -> void:
	_current_screen = "settings"
	_set_header("设置", "画面与音量仅保存在本机")
	_clear_content()
	var outer := CenterContainer.new()
	_content_host.add_child(outer)
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(680, 500)
	panel.add_theme_stylebox_override("panel", _style(Color("#202629f2"), 16, Color("#81725a"), 1))
	outer.add_child(panel)
	var settings_box := VBoxContainer.new()
	settings_box.add_theme_constant_override("separation", 16)
	panel.add_child(_padded(settings_box, 30, 26))
	settings_box.add_child(_kicker("本机设置 · SETTINGS"))
	settings_box.add_child(_label("声音与画面", 30, PAPER))
	settings_box.add_child(_setting_slider("主音量", "master_volume"))
	settings_box.add_child(_setting_slider("音乐音量", "bgm_volume"))
	settings_box.add_child(_setting_slider("音效音量", "sfx_volume"))
	var fullscreen := CheckButton.new()
	fullscreen.text = "桌面全屏"
	fullscreen.custom_minimum_size.y = 48
	fullscreen.button_pressed = bool(SaveService.settings.fullscreen)
	fullscreen.disabled = OS.has_feature("mobile")
	fullscreen.toggled.connect(func(value: bool) -> void: SaveService.update_setting("fullscreen", value))
	settings_box.add_child(fullscreen)
	var reduced := CheckButton.new()
	reduced.text = "减少动态效果"
	reduced.custom_minimum_size.y = 48
	reduced.button_pressed = bool(SaveService.settings.reduced_motion)
	reduced.toggled.connect(func(value: bool) -> void: SaveService.update_setting("reduced_motion", value))
	settings_box.add_child(reduced)
	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 12)
	settings_box.add_child(actions)
	actions.add_child(_button("返回藏经阁", _show_library))
	var clear_button := _button("清除全部进度", _confirm_clear_all)
	clear_button.add_theme_color_override("font_color", Color("#e8aaa3"))
	actions.add_child(clear_button)

func _setting_slider(title: String, key: String) -> HBoxContainer:
	var row := HBoxContainer.new()
	row.custom_minimum_size.y = 52
	var name_label := _label(title, 17, PAPER_DARK)
	name_label.custom_minimum_size.x = 130
	row.add_child(name_label)
	var slider := HSlider.new()
	slider.min_value = 0
	slider.max_value = 100
	slider.step = 1
	slider.value = float(SaveService.settings[key]) * 100.0
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	slider.custom_minimum_size.y = 48
	var value_label := _label("%d%%" % int(slider.value), 15, GOLD)
	value_label.custom_minimum_size.x = 60
	value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	var setting_key := key
	slider.value_changed.connect(func(value: float) -> void:
		value_label.text = "%d%%" % int(value)
		SaveService.update_setting(setting_key, value / 100.0)
	)
	row.add_child(slider)
	row.add_child(value_label)
	return row

func _confirm_restart_book(book_id: String) -> void:
	var dialog := ConfirmationDialog.new()
	dialog.title = "重开当前书卷"
	dialog.dialog_text = "将清除本卷路线、属性与战斗进度。图鉴和已见结局会保留。"
	dialog.ok_button_text = "确认重开"
	dialog.cancel_button_text = "取消"
	add_child(dialog)
	dialog.confirmed.connect(func() -> void:
		GameState.restart_book(book_id)
		dialog.queue_free()
		_show_story()
	)
	dialog.canceled.connect(dialog.queue_free)
	dialog.popup_centered(Vector2i(520, 220))

func _confirm_clear_all() -> void:
	var dialog := ConfirmationDialog.new()
	dialog.title = "清除全部进度"
	dialog.dialog_text = "这会清除路线、图鉴解锁与已见结局，且无法撤销。确定继续吗？"
	dialog.ok_button_text = "永久清除"
	dialog.cancel_button_text = "取消"
	add_child(dialog)
	dialog.confirmed.connect(func() -> void:
		SaveService.clear_all_progress()
		dialog.queue_free()
		_show_toast("本机进度已清除")
		_show_library()
	)
	dialog.canceled.connect(dialog.queue_free)
	dialog.popup_centered(Vector2i(520, 220))

func _apply_safe_area() -> void:
	if _safe_frame == null:
		return
	_safe_frame.offset_left = 0
	_safe_frame.offset_top = 0
	_safe_frame.offset_right = 0
	_safe_frame.offset_bottom = 0
	if not OS.has_feature("mobile"):
		return
	var safe := DisplayServer.get_display_safe_area()
	var window_size := DisplayServer.window_get_size()
	var viewport_size := get_viewport_rect().size
	if window_size.x <= 0 or window_size.y <= 0 or safe.size.x <= 0 or safe.size.y <= 0:
		return
	var scale := Vector2(viewport_size.x / float(window_size.x), viewport_size.y / float(window_size.y))
	_safe_frame.offset_left = safe.position.x * scale.x
	_safe_frame.offset_top = safe.position.y * scale.y
	_safe_frame.offset_right = -(window_size.x - safe.end.x) * scale.x
	_safe_frame.offset_bottom = -(window_size.y - safe.end.y) * scale.y

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and event.keycode in [KEY_ESCAPE, KEY_BACK]:
		match _current_screen:
			"book", "codex", "settings": _show_library()
			"story": _show_book_detail(GameState.get_current_book_id())
			"battle": _show_story()
			_: get_tree().quit()
		get_viewport().set_input_as_handled()

func _set_header(title: String, crumb: String) -> void:
	_title_label.text = title
	_crumb_label.text = crumb

func _clear_content() -> void:
	_free_children(_content_host)
	_content_host.add_theme_stylebox_override("panel", _style(Color("#14191ce8"), 18, Color("#8b7a5a66"), 1))

func _free_children(parent: Node) -> void:
	for child in parent.get_children():
		parent.remove_child(child)
		child.queue_free()

func _show_toast(message: String) -> void:
	if _toast_panel == null:
		return
	_toast_label.text = message
	_toast_panel.show()
	_toast_timer.start()

func _story_progress_text() -> String:
	return "%02d / 12" % _current_node_index()

func _current_node_index() -> int:
	var graph: StoryGraph = ContentRegistry.get_story_for_book("xiyouji")
	if graph == null:
		return 1
	var index := 1
	for node_id in graph.nodes.keys():
		if node_id == GameState.get_current_node_id():
			return index
		index += 1
	return 1

func _modifier_strip() -> HBoxContainer:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	var modifiers: Dictionary = GameState.get_modifiers()
	var labels := {"attack": "武", "defense": "守", "speed": "疾", "intelligence": "悟", "specialAbility": "法"}
	for key in labels:
		var value := int(modifiers.get(key, 0))
		if value > 0:
			row.add_child(_info_chip(str(labels[key]), "+%d" % value))
	if row.get_child_count() == 0:
		row.add_child(_label("尚无路线增益", 13, MUTED))
	return row

func _nav_button(text_value: String, callback: Callable) -> Button:
	var result := _button(text_value, callback)
	result.custom_minimum_size = Vector2(104, 48)
	return result

func _button(text_value: String, callback: Callable) -> Button:
	var result := Button.new()
	result.text = text_value
	result.custom_minimum_size = Vector2(128, 48)
	result.pressed.connect(callback)
	return result

func _primary_button(text_value: String, callback: Callable) -> Button:
	var result := _button(text_value, callback)
	result.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	result.add_theme_stylebox_override("normal", _style(Color("#743d35"), 10, Color("#d1a16d"), 1))
	result.add_theme_stylebox_override("hover", _style(Color("#8e493f"), 10, GOLD, 2))
	result.add_theme_stylebox_override("pressed", _style(Color("#5b302b"), 10, CINNABAR, 2))
	return result

func _label(text_value: String, size: int, color: Color) -> Label:
	var result := Label.new()
	result.text = text_value
	result.add_theme_font_size_override("font_size", size)
	result.add_theme_color_override("font_color", color)
	return result

func _kicker(text_value: String) -> Label:
	return _label(text_value, 12, GOLD)

func _texture(path: String, minimum: Vector2) -> TextureRect:
	var result := TextureRect.new()
	result.custom_minimum_size = minimum
	result.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	result.size_flags_vertical = Control.SIZE_EXPAND_FILL
	result.texture = load(path) if ResourceLoader.exists(path) else load("res://icon.svg")
	result.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	result.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	result.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return result

func _style(color: Color, radius: int, border_color: Color = Color.TRANSPARENT, border_width: int = 0) -> StyleBoxFlat:
	var result := StyleBoxFlat.new()
	result.bg_color = color
	result.corner_radius_top_left = radius
	result.corner_radius_top_right = radius
	result.corner_radius_bottom_left = radius
	result.corner_radius_bottom_right = radius
	result.border_color = border_color
	result.border_width_left = border_width
	result.border_width_right = border_width
	result.border_width_top = border_width
	result.border_width_bottom = border_width
	result.content_margin_left = 10
	result.content_margin_right = 10
	result.content_margin_top = 8
	result.content_margin_bottom = 8
	return result

func _margin(amount: int) -> MarginContainer:
	var result := MarginContainer.new()
	for side in ["left", "right", "top", "bottom"]:
		result.add_theme_constant_override("margin_%s" % side, amount)
	return result

func _margin_sides(horizontal: int, vertical: int) -> MarginContainer:
	var result := MarginContainer.new()
	result.add_theme_constant_override("margin_left", horizontal)
	result.add_theme_constant_override("margin_right", horizontal)
	result.add_theme_constant_override("margin_top", vertical)
	result.add_theme_constant_override("margin_bottom", vertical)
	return result

func _padded(control: Control, horizontal: int, vertical: int) -> MarginContainer:
	var margin := _margin_sides(horizontal, vertical)
	margin.add_child(control)
	return margin

func _info_chip(title: String, value: String) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", _style(Color("#2b302ddd"), 8, Color("#68604f"), 1))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 7)
	panel.add_child(row)
	row.add_child(_label(title, 12, MUTED))
	row.add_child(_label(value, 13, GOLD))
	return panel
