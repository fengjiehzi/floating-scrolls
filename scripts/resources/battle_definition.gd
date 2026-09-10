class_name BattleDefinition
extends Resource

@export var id: String = ""
@export var book_id: String = ""
@export var player_character_id: String = ""
@export var enemy: Dictionary = {}
@export var max_rounds: int = 12
@export var victory_next: String = ""
@export var rewards: Array[String] = []
