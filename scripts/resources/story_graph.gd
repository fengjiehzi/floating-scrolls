class_name StoryGraph
extends Resource

@export var id: String = ""
@export var book_id: String = ""
@export var start_node_id: String = ""
@export var nodes: Dictionary = {}

func get_node(node_id: String) -> Dictionary:
	return nodes.get(node_id, {})

func has_node(node_id: String) -> bool:
	return nodes.has(node_id)
