extends Node

const SAVE_PATH := "user://save_v1.json"
const BACKUP_PATH := "user://save_v1.backup.json"
const TEMP_PATH := "user://save_v1.tmp"
const SETTINGS_PATH := "user://settings.cfg"

var last_warning: String = ""
var settings := {
	"master_volume": 0.8,
	"bgm_volume": 0.7,
	"sfx_volume": 0.9,
	"fullscreen": false,
	"reduced_motion": false,
}

func _ready() -> void:
	load_settings()
	load_game()
	apply_settings()

func load_game() -> void:
	last_warning = ""
	if not FileAccess.file_exists(SAVE_PATH):
		GameState.import_save(GameState.make_default_save())
		return
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		_recover_from_invalid_save("存档无法读取，已创建新档。")
		return
	var parser := JSON.new()
	if parser.parse(file.get_as_text()) != OK:
		_recover_from_invalid_save("存档版本不兼容或内容损坏，已创建新档。")
		return
	var parsed: Variant = parser.data
	if not parsed is Dictionary or not GameState.import_save(parsed):
		_recover_from_invalid_save("存档版本不兼容或内容损坏，已创建新档。")

func save_game() -> bool:
	var file := FileAccess.open(TEMP_PATH, FileAccess.WRITE)
	if file == null:
		last_warning = "无法写入本地存档。"
		return false
	file.store_string(JSON.stringify(GameState.save_data, "  "))
	file.flush()
	file.close()
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.copy_absolute(ProjectSettings.globalize_path(SAVE_PATH), ProjectSettings.globalize_path(BACKUP_PATH))
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_PATH))
	var error := DirAccess.rename_absolute(ProjectSettings.globalize_path(TEMP_PATH), ProjectSettings.globalize_path(SAVE_PATH))
	if error != OK:
		last_warning = "存档替换失败，保留了上一份备份。"
		return false
	return true

func load_settings() -> void:
	var config := ConfigFile.new()
	if config.load(SETTINGS_PATH) != OK:
		return
	for key in settings:
		settings[key] = config.get_value("settings", key, settings[key])

func save_settings() -> void:
	var config := ConfigFile.new()
	for key in settings:
		config.set_value("settings", key, settings[key])
	config.save(SETTINGS_PATH)
	apply_settings()

func update_setting(key: String, value: Variant) -> void:
	if not settings.has(key):
		return
	settings[key] = value
	save_settings()

func apply_settings() -> void:
	_set_bus_volume("Master", float(settings.master_volume))
	_set_bus_volume("BGM", float(settings.bgm_volume))
	_set_bus_volume("SFX", float(settings.sfx_volume))
	if not OS.has_feature("mobile"):
		DisplayServer.window_set_mode(
			DisplayServer.WINDOW_MODE_FULLSCREEN if settings.fullscreen else DisplayServer.WINDOW_MODE_WINDOWED
		)

func clear_all_progress() -> void:
	GameState.clear_all_progress()
	save_game()

func _set_bus_volume(bus_name: String, linear: float) -> void:
	var bus_index := AudioServer.get_bus_index(bus_name)
	if bus_index >= 0:
		AudioServer.set_bus_volume_db(bus_index, linear_to_db(clampf(linear, 0.001, 1.0)))

func _recover_from_invalid_save(message: String) -> void:
	if FileAccess.file_exists(SAVE_PATH):
		var stamp := Time.get_datetime_string_from_system().replace(":", "-")
		var corrupt_path := "user://save_v1.corrupt-%s.json" % stamp
		DirAccess.rename_absolute(ProjectSettings.globalize_path(SAVE_PATH), ProjectSettings.globalize_path(corrupt_path))
	GameState.import_save(GameState.make_default_save())
	last_warning = message
	save_game()

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_WM_CLOSE_REQUEST:
		save_game()
