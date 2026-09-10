class_name ItemDefinition
extends Resource

@export var id: String = ""
@export var book_id: String = ""
@export var display_name: String = ""
@export_multiline var description: String = ""
@export var artwork_path: String = ""
@export var rarity: String = "common"
@export var item_type: String = "treasure"
@export var stats_bonus: Dictionary = {}
@export var skill_bonus: String = ""
@export var source_basis: String = ""
@export var complete_data: bool = true
