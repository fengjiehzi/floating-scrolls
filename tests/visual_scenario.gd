extends Control

@onready var main: Control = $Main

func _ready() -> void:
	call_deferred("_select_scenario")

func _select_scenario() -> void:
	var screen := "library"
	var auto_quit := false
	var capture_path := ""
	var target_size := Vector2i.ZERO
	for argument in OS.get_cmdline_user_args():
		if argument.begins_with("--screen="):
			screen = argument.trim_prefix("--screen=")
		elif argument == "--auto-quit":
			auto_quit = true
		elif argument.begins_with("--capture="):
			capture_path = argument.trim_prefix("--capture=")
		elif argument.begins_with("--window="):
			var dimensions := argument.trim_prefix("--window=").split("x")
			if dimensions.size() == 2:
				target_size = Vector2i(int(dimensions[0]), int(dimensions[1]))
	match screen:
		"library_sanguo":
			main._content_host.get_child(0).select_book("sanguo")
		"book":
			main._show_book_detail("xiyouji")
		"story":
			GameState.import_save(GameState.make_default_save())
			GameState.begin_book("xiyouji")
			main._show_story()
		"battle":
			GameState.import_save(GameState.make_default_save())
			GameState.begin_book("xiyouji")
			GameState.choose("leap_first")
			GameState.choose("guard_home")
			main._start_battle("hunshi_demon")
		"codex":
			main._show_codex()
		"endings", "endings_locked", "endings_empty":
			GameState.import_save(GameState.make_default_save())
			if screen == "endings":
				GameState.save_data.seen_endings = ["mind_awaits_awakening", "qitian_unbroken"]
			main._show_endings("sanguo" if screen == "endings_empty" else "xiyouji")
		"settings":
			main._show_settings()
	if target_size != Vector2i.ZERO:
		DisplayServer.window_set_size(target_size)
	if not capture_path.is_empty():
		for frame in 4:
			await get_tree().process_frame
		await get_tree().create_timer(0.3).timeout
		var captured := get_viewport().get_texture().get_image()
		captured.save_png(ProjectSettings.globalize_path(capture_path))
		get_tree().quit()
	elif auto_quit:
		for frame in 4:
			await get_tree().process_frame
		get_tree().quit()
