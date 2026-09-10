extends Control

signal book_opened(book_id: String)
signal endings_requested

const BOOK_STAND := preload("res://scenes/library/book_stand.tscn")
const DESIGN_SIZE := Vector2(1280, 620)

var selected_book_id := "xiyouji"
var _stands: Array[Button] = []
var _parallax := Vector2.ZERO

@onready var _composition: Node2D = $Composition
@onready var _architecture: Node2D = $Composition/Architecture
@onready var _books: Node2D = $Composition/Books
@onready var _info: Control = $Composition/Info

func _ready() -> void:
	# Control themes do not propagate through the Node2D composition parents.
	_info.theme = theme
	var books := ContentRegistry.get_books()
	var anchors := _books.get_children()
	for index in books.size():
		var stand = BOOK_STAND.instantiate()
		stand.theme = theme
		anchors[index].add_child(stand)
		stand.configure(books[index])
		var book_id: String = books[index].id
		stand.pressed.connect(func() -> void: select_book(book_id))
		_stands.append(stand)
	_info.get_node("OpenBook").pressed.connect(func() -> void: book_opened.emit(selected_book_id))
	_info.get_node("Endings").pressed.connect(func() -> void: endings_requested.emit())
	_style_actions()
	resized.connect(_fit_composition)
	_fit_composition()
	select_book(selected_book_id)

func select_book(book_id: String) -> void:
	var book: BookDefinition = ContentRegistry.get_book(book_id)
	if book == null:
		return
	selected_book_id = book_id
	for stand in _stands:
		stand.set_selected(stand.book_id == book_id)
	_info.get_node("BookTitle").text = book.title
	_info.get_node("BookMeta").text = "%s · %s" % [book.author, "可入卷" if book.playable else "剧情待开放"]
	_info.get_node("Description").text = book.description
	var progress: Dictionary = GameState.get_book_progress(book_id)
	var progress_text := "首卷已启 · 从石猴出世开始" if book.playable else "人物与法宝资料已收录"
	if not progress.is_empty():
		var graph: StoryGraph = ContentRegistry.get_story_for_book(book_id)
		progress_text = "续读 · %s" % graph.get_node(str(progress.current_node)).get("title", "书卷")
	_info.get_node("Progress").text = progress_text
	_info.get_node("OpenBook").text = ("继续书卷  →" if not progress.is_empty() else "进入书卷  →") if book.playable else "查阅卷宗  →"
	_info.get_node("Endings").tooltip_text = "已见结局 %d / 2" % GameState.save_data.seen_endings.size()

func _fit_composition() -> void:
	var ratio := minf(size.x / DESIGN_SIZE.x, size.y / DESIGN_SIZE.y)
	_composition.scale = Vector2.ONE * ratio
	_composition.position = (size - DESIGN_SIZE * ratio) / 2.0

func _process(delta: float) -> void:
	var target := Vector2.ZERO
	if not SaveService.settings.reduced_motion and not OS.has_feature("mobile") and size.x > 0 and size.y > 0:
		var pointer := get_local_mouse_position() / size - Vector2(0.5, 0.5)
		target = Vector2(clampf(pointer.x, -0.5, 0.5) * 10, clampf(pointer.y, -0.5, 0.5) * 5)
	_parallax = Vector2.ZERO if SaveService.settings.reduced_motion else _parallax.lerp(target, minf(delta * 5, 1))
	_architecture.position = _parallax * 0.4
	_books.position = _parallax

func _style_actions() -> void:
	var normal := StyleBoxFlat.new()
	normal.bg_color = Color("753f31")
	normal.border_color = Color("bda16c")
	normal.set_border_width_all(1)
	normal.set_corner_radius_all(4)
	var hover := normal.duplicate() as StyleBoxFlat
	hover.bg_color = Color("965438")
	var action: Button = _info.get_node("OpenBook")
	action.add_theme_stylebox_override("normal", normal)
	action.add_theme_stylebox_override("hover", hover)
	action.add_theme_stylebox_override("pressed", hover)
	var secondary := normal.duplicate() as StyleBoxFlat
	secondary.bg_color = Color("19282bdd")
	_info.get_node("Endings").add_theme_stylebox_override("normal", secondary)
