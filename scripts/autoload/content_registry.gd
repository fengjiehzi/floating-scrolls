extends Node

const BOOK_ORDER = [
	"xiyouji", "sanguo", "fengshen", "honglou", "shuihu", "baishe", "shiji", "liaozhai",
]

var books: Dictionary = {}
var characters: Dictionary = {}
var items: Dictionary = {}
var story_graphs: Dictionary = {}
var battles: Dictionary = {}

func _ready() -> void:
	_build_books()
	_build_characters()
	_build_items()
	_build_xiyouji_story()
	_build_battles()
	for issue in validate_content():
		push_error("Content validation: %s" % issue)

func _build_books() -> void:
	for data in GameContent.BOOKS:
		var book := BookDefinition.new()
		book.id = data.id
		book.title = data.title
		book.author = data.author
		book.description = data.description
		book.quote = data.quote
		book.realm_tag = data.realm_tag
		book.cover_path = data.cover_path
		book.accent = Color(data.accent)
		book.playable = data.playable
		book.story_graph_id = data.story_graph_id
		books[book.id] = book

func _build_characters() -> void:
	for data in GameContent.CHARACTERS:
		var character := CharacterDefinition.new()
		character.id = data.id
		character.book_id = data.book_id
		character.display_name = data.display_name
		character.description = data.description
		character.portrait_path = data.portrait_path
		character.stats = data.stats.duplicate(true)
		for skill in data.skills:
			character.skills.append(skill.duplicate(true))
		for form in data.forms:
			character.forms.append(form.duplicate(true))
		character.complete_data = data.complete_data
		character.unlocked_by_default = data.unlocked_by_default
		characters[character.id] = character

func _build_items() -> void:
	for data in GameContent.ITEMS:
		var item := ItemDefinition.new()
		item.id = data.id
		item.book_id = data.book_id
		item.display_name = data.display_name
		item.description = data.description
		item.artwork_path = data.artwork_path
		item.rarity = data.rarity
		item.item_type = data.item_type
		item.stats_bonus = data.stats_bonus.duplicate(true)
		item.skill_bonus = data.skill_bonus
		item.source_basis = data.source_basis
		item.complete_data = data.complete_data
		items[item.id] = item

func _build_xiyouji_story() -> void:
	var graph := StoryGraph.new()
	graph.id = "xiyouji_main"
	graph.book_id = "xiyouji"
	graph.start_node_id = "stone_birth"
	graph.nodes = {
		"stone_birth": {
			"id": "stone_birth", "chapter": 1, "type": "story", "title": "石猴出世",
			"speaker": "守卷人",
			"text": "东胜神洲傲来国，花果山顶仙石受天真地秀，忽一日迸裂，化作石猴。两道金光直冲斗府，而你第一次望见这片天地。",
			"choices": [
				{"id": "leap_first", "text": "循水声跃向瀑布，先探未知", "next": "water_curtain", "effects": {"attack": 3, "defense": 2}, "unlocks": []},
				{"id": "watch_first", "text": "观察群猴与山势，再寻水源", "next": "water_curtain", "effects": {"intelligence": 3, "speed": 2}, "unlocks": []},
			],
		},
		"water_curtain": {
			"id": "water_curtain", "chapter": 1, "type": "story", "title": "水帘洞称王",
			"speaker": "群猴",
			"text": "飞泉一派，瀑布垂帘。你穿水而入，发现石锅石灶、石床石凳，回身引群猴入洞，被拥为美猴王。山外的混世魔王却趁机来犯。",
			"choices": [
				{"id": "guard_home", "text": "握紧拳头，守住花果山", "next": "battle_hunshi", "effects": {"attack": 2}, "unlocks": ["character:sun_wukong"]},
			],
		},
		"battle_hunshi": {
			"id": "battle_hunshi", "chapter": 1, "type": "battle", "title": "花果山除患",
			"speaker": "混世魔王", "text": "混世魔王挥刀堵住山门。这是美猴王守护群猴的第一战。", "battle_id": "hunshi_demon", "choices": [],
		},
		"master_training": {
			"id": "master_training", "chapter": 2, "type": "reward", "title": "方寸山授艺",
			"speaker": "菩提祖师",
			"text": "为求长生，你渡海访道，终于拜入灵台方寸山。祖师敲你头顶三下，夜半传法，只许你先择一门精修。",
			"choices": [
				{"id": "learn_changes", "text": "精修七十二变，以变化避灾", "next": "dragon_palace", "effects": {"specialAbility": 5, "intelligence": 2}, "unlocks": ["skill:sun_wukong_skill_3"]},
				{"id": "learn_cloud", "text": "精修筋斗云，以极速破局", "next": "dragon_palace", "effects": {"speed": 8, "specialAbility": 2}, "unlocks": ["skill:sun_wukong_skill_2"]},
			],
		},
		"dragon_palace": {
			"id": "dragon_palace", "chapter": 2, "type": "reward", "title": "东海取宝",
			"speaker": "东海龙王",
			"text": "龙宫深处，定海神珍随你心意变作一根乌铁棒。两头金箍间显出一行字：如意金箍棒，一万三千五百斤。",
			"choices": [
				{"id": "take_cudgel", "text": "收下金箍棒，回返花果山", "next": "heavenly_post", "effects": {"attack": 4}, "unlocks": ["skill:sun_wukong_skill_1", "item:xiyouji_golden_cudgel"]},
			],
		},
		"heavenly_post": {
			"id": "heavenly_post", "chapter": 3, "type": "story", "title": "官封弼马",
			"speaker": "孙悟空",
			"text": "天庭以弼马温虚职相欺。你推倒公案，直返花果山，竖起齐天大圣旗。天兵压境，一场大战已无法回避。",
			"choices": [
				{"id": "meet_force", "text": "正面迎击，先破天军锋阵", "next": "battle_heavenly", "effects": {"attack": 4, "defense": 1}, "unlocks": []},
				{"id": "meet_wit", "text": "诱敌入山，以地势分割天军", "next": "battle_heavenly", "effects": {"intelligence": 4, "speed": 2}, "unlocks": []},
			],
		},
		"battle_heavenly": {
			"id": "battle_heavenly", "chapter": 3, "type": "battle", "title": "大闹天宫",
			"speaker": "天兵统领", "text": "云阵遮天，金鼓震地。天兵统领持戟立于阵前，拦住齐天旗。", "battle_id": "heavenly_guard", "choices": [],
		},
		"qitian_form": {
			"id": "qitian_form", "chapter": 3, "type": "reward", "title": "齐天大圣",
			"speaker": "守卷人",
			"text": "十万天兵不能近身，齐天之名传遍三界。二郎显圣真君奉旨而来，与你赌斗变化神通。",
			"choices": [
				{"id": "qitian_force", "text": "以力证名，迎战二郎真君", "next": "battle_erlang", "effects": {"attack": 5, "speed": 3}, "unlocks": ["form:sun_wukong_form_1"]},
				{"id": "qitian_cunning", "text": "以变化相戏，伺机破阵", "next": "battle_erlang", "effects": {"intelligence": 5, "specialAbility": 3}, "unlocks": ["form:sun_wukong_form_1"]},
			],
		},
		"battle_erlang": {
			"id": "battle_erlang", "chapter": 3, "type": "battle", "title": "斗法二郎神",
			"speaker": "二郎神", "text": "三尖两刃刀映出寒芒，天眼洞察诸般变化。这一战决定你能否冲出天罗地网。", "battle_id": "erlang_duel", "choices": [],
		},
		"five_elements": {
			"id": "five_elements", "chapter": 3, "type": "story", "title": "五行山下",
			"speaker": "如来佛祖",
			"text": "你虽斗过二郎神，却遭金刚琢暗袭，终被如来压在五行山下。山石沉重，压不灭心中那一点灵明。",
			"choices": [
				{"id": "wait_and_learn", "text": "静候因缘，先看清心猿去处", "next": "ending_awaken", "effects": {"intelligence": 5, "defense": 3}, "unlocks": []},
				{"id": "remain_defiant", "text": "仍称齐天，等一日再踏云霄", "next": "ending_unbroken", "effects": {"attack": 5, "specialAbility": 3}, "unlocks": []},
			],
		},
		"ending_awaken": {
			"id": "ending_awaken", "chapter": 3, "type": "ending", "title": "心猿待悟", "ending_id": "mind_awaits_awakening",
			"speaker": "守卷人", "text": "五百年风霜自山隙掠过。你仍在山下，却第一次把力量收回心中。取经人的脚步尚远，新的因缘已经落墨。", "choices": [],
		},
		"ending_unbroken": {
			"id": "ending_unbroken", "chapter": 3, "type": "ending", "title": "齐天不屈", "ending_id": "qitian_unbroken",
			"speaker": "守卷人", "text": "五行山镇住身形，却镇不住齐天之志。你在石下等待，仍相信总有一日能再握金箍棒，护住自己的选择。", "choices": [],
		},
	}
	story_graphs[graph.id] = graph

func _build_battles() -> void:
	_register_battle("hunshi_demon", "battle_hunshi", "混世魔王", "res://assets/art/characters/hunshi-demon.png", 60, 50, 55, 40, 270, 90, [
		{"id": "cleaver", "name": "混世魔刀", "type": "physical_attack", "multiplier": 1.05, "manaCost": 0, "narration": "魔刀卷起山风劈落"},
	], "master_training", [])
	_register_battle("heavenly_guard", "battle_heavenly", "天兵统领", "res://assets/art/characters/heavenly-guard.png", 74, 68, 65, 64, 370, 180, [
		{"id": "halberd", "name": "天戟横扫", "type": "physical_attack", "multiplier": 1.15, "manaCost": 0, "narration": "天戟划破云阵横扫而来"},
		{"id": "thunder", "name": "雷部敕令", "type": "magic_attack", "multiplier": 1.35, "manaCost": 60, "narration": "雷光循敕令落下"},
	], "qitian_form", [])
	_register_battle("erlang_duel", "battle_erlang", "二郎神", "res://assets/art/characters/er-lang-shen.png", 92, 90, 88, 90, 490, 320, [
		{"id": "three_point_blade", "name": "三尖两刃刀", "type": "physical_attack", "multiplier": 1.25, "manaCost": 20, "narration": "三尖两刃刀挟神力劈落"},
		{"id": "heaven_eye", "name": "天眼神光", "type": "magic_attack", "multiplier": 1.5, "manaCost": 80, "narration": "额间天眼放出破妄神光"},
	], "five_elements", [])

func _register_battle(
	id: String, _story_node: String, enemy_name: String, portrait_path: String,
	attack: int, defense: int, speed: int, special: int, max_hp: int, mana: int,
	skills: Array[Dictionary], victory_next: String, rewards: Array[String]
) -> void:
	var battle := BattleDefinition.new()
	battle.id = id
	battle.book_id = "xiyouji"
	battle.player_character_id = "sun_wukong"
	battle.enemy = {
		"id": id + "_enemy", "name": enemy_name, "portrait_path": portrait_path,
		"attack": attack, "defense": defense, "speed": speed, "specialAbility": special,
		"max_hp": max_hp, "mana": mana, "max_mana": mana, "critRate": 10,
		"skills": skills,
	}
	battle.max_rounds = 12
	battle.victory_next = victory_next
	battle.rewards = rewards
	battles[id] = battle

func get_books() -> Array[BookDefinition]:
	var result: Array[BookDefinition] = []
	for book_id in BOOK_ORDER:
		result.append(books[book_id])
	return result

func get_book(book_id: String) -> BookDefinition:
	return books.get(book_id)

func get_characters_for_book(book_id: String) -> Array[CharacterDefinition]:
	var result: Array[CharacterDefinition] = []
	for character: CharacterDefinition in characters.values():
		if character.book_id == book_id:
			result.append(character)
	return result

func get_items_for_book(book_id: String) -> Array[ItemDefinition]:
	var result: Array[ItemDefinition] = []
	for item: ItemDefinition in items.values():
		if item.book_id == book_id:
			result.append(item)
	return result

func get_story_for_book(book_id: String) -> StoryGraph:
	var book := get_book(book_id)
	if book == null or book.story_graph_id.is_empty():
		return null
	return story_graphs.get(book.story_graph_id)

func get_battle(battle_id: String) -> BattleDefinition:
	return battles.get(battle_id)

func validate_content() -> PackedStringArray:
	var issues := PackedStringArray()
	if books.size() != 8:
		issues.append("expected 8 books, found %d" % books.size())
	for book_id in BOOK_ORDER:
		if not books.has(book_id):
			issues.append("missing book: %s" % book_id)
	for book: BookDefinition in books.values():
		if not ResourceLoader.exists(book.cover_path):
			issues.append("missing book cover: %s" % book.cover_path)
	for character: CharacterDefinition in characters.values():
		if not books.has(character.book_id):
			issues.append("character %s references unknown book" % character.id)
		if not ResourceLoader.exists(character.portrait_path):
			issues.append("missing character portrait: %s" % character.portrait_path)
	for item: ItemDefinition in items.values():
		if not books.has(item.book_id):
			issues.append("item %s references unknown book" % item.id)
		if not ResourceLoader.exists(item.artwork_path):
			issues.append("missing item artwork: %s" % item.artwork_path)
	if characters.has("dijia") or characters.has("hou_yi"):
		issues.append("non-selected content remains in character registry")
	_validate_story_graph(story_graphs.get("xiyouji_main"), issues)
	return issues

func _validate_story_graph(graph: StoryGraph, issues: PackedStringArray) -> void:
	if graph == null:
		issues.append("missing xiyouji story graph")
		return
	var battle_count := 0
	var ending_count := 0
	for node: Dictionary in graph.nodes.values():
		match node.get("type", ""):
			"battle":
				battle_count += 1
				var battle_id: String = node.get("battle_id", "")
				if not battles.has(battle_id):
					issues.append("story node %s references unknown battle" % node.id)
			"ending":
				ending_count += 1
		for choice: Dictionary in node.get("choices", []):
			if not graph.has_node(choice.get("next", "")):
				issues.append("story node %s has dangling choice" % node.id)
	if battle_count != 3:
		issues.append("expected 3 battle nodes, found %d" % battle_count)
	if ending_count != 2:
		issues.append("expected 2 endings, found %d" % ending_count)
	for battle: BattleDefinition in battles.values():
		if not graph.has_node(battle.victory_next):
			issues.append("battle %s has dangling victory node" % battle.id)
	var visited := {}
	var frontier: Array[String] = [graph.start_node_id]
	while not frontier.is_empty():
		var node_id: String = frontier.pop_back()
		if visited.has(node_id) or not graph.has_node(node_id):
			continue
		visited[node_id] = true
		var node: Dictionary = graph.get_node(node_id)
		for choice: Dictionary in node.get("choices", []):
			frontier.append(choice.get("next", ""))
		if node.get("type") == "battle":
			var battle: BattleDefinition = get_battle(node.get("battle_id", ""))
			if battle != null:
				frontier.append(battle.victory_next)
	if visited.size() != graph.nodes.size():
		issues.append("story graph contains unreachable nodes")
