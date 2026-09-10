class_name CharacterDefinition
extends Resource

@export var id: String = ""
@export var book_id: String = ""
@export var display_name: String = ""
@export_multiline var description: String = ""
@export var portrait_path: String = ""
@export var stats: Dictionary = {}
@export var skills: Array[Dictionary] = []
@export var forms: Array[Dictionary] = []
@export var complete_data: bool = true
@export var unlocked_by_default: bool = false
