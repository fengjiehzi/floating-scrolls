extends Button

var book_id := ""
var selected := false
var _cover: Texture2D
var _accent := Color("caa66b")
var _lift := 0.0
var _motion: Tween

func configure(book: BookDefinition) -> void:
	book_id = book.id
	var source: Texture2D = load(book.cover_path)
	var artwork := source.get_image()
	artwork.generate_mipmaps()
	_cover = ImageTexture.create_from_image(artwork)
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	_accent = book.accent
	$Title.text = book.title
	$Status.text = "可入卷 · 西游纵切" if book.playable else "卷宗已藏 · 待开放"
	tooltip_text = "选择《%s》" % book.title
	queue_redraw()

func _ready() -> void:
	mouse_entered.connect(_update_lift)
	mouse_exited.connect(_update_lift)
	focus_entered.connect(_update_lift)
	focus_exited.connect(_update_lift)

func set_selected(value: bool) -> void:
	selected = value
	$Title.modulate = Color("f5d399") if selected else Color.WHITE
	_update_lift()

func _update_lift() -> void:
	var target := 10.0 if selected or is_hovered() or has_focus() else 0.0
	if _motion != null:
		_motion.kill()
	if SaveService.settings.reduced_motion:
		_set_lift(target)
	else:
		_motion = create_tween()
		_motion.tween_method(_set_lift, _lift, target, 0.22).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)

func _set_lift(value: float) -> void:
	_lift = value
	queue_redraw()

func _draw() -> void:
	# Ground contact stays fixed while the selected volume rises above its stand.
	draw_set_transform(Vector2(76, 176), 0, Vector2(1, 0.24))
	draw_circle(Vector2.ZERO, 79, Color(0, 0, 0, 0.4))
	if selected:
		for radius in range(80, 24, -8):
			draw_circle(Vector2.ZERO, radius, Color(0.88, 0.61, 0.26, 0.05))
	draw_set_transform(Vector2.ZERO)
	draw_colored_polygon(PackedVector2Array([Vector2(-5, 167), Vector2(132, 150), Vector2(160, 169), Vector2(23, 190)]), Color("71614a"))
	draw_colored_polygon(PackedVector2Array([Vector2(23, 190), Vector2(160, 169), Vector2(160, 182), Vector2(23, 204)]), Color("302e28"))
	draw_colored_polygon(PackedVector2Array([Vector2(-5, 167), Vector2(23, 190), Vector2(23, 204), Vector2(-5, 180)]), Color("454037"))
	draw_line(Vector2(23, 190), Vector2(160, 169), Color("bfa16c"), 1.4, true)
	if selected:
		draw_colored_polygon(PackedVector2Array([Vector2(8, 170), Vector2(145, 152), Vector2(160, -32), Vector2(-10, -18)]), Color(0.9, 0.67, 0.3, 0.07))
	draw_set_transform(Vector2(0, -_lift))
	var cover := PackedVector2Array([Vector2(12, 17), Vector2(120, 0), Vector2(120, 150), Vector2(12, 167)])
	# Front, paper block and top edge use the same perspective vanishing direction.
	draw_colored_polygon(PackedVector2Array([Vector2(120, 0), Vector2(139, 10), Vector2(139, 159), Vector2(120, 150)]), Color("b7a987"))
	for offset in [5, 9, 13, 17]:
		draw_line(Vector2(120 + offset, offset * 0.53 + 3), Vector2(120 + offset, 149 + offset * 0.53), Color("746c58"), 0.7, true)
	draw_colored_polygon(PackedVector2Array([Vector2(12, 17), Vector2(120, 0), Vector2(139, 10), Vector2(31, 28)]), Color("e1cfa5"))
	if _cover != null:
		draw_polygon(cover, PackedColorArray([Color.WHITE]), PackedVector2Array([Vector2(0, 0), Vector2(1, 0), Vector2(1, 1), Vector2(0, 1)]), _cover)
	draw_colored_polygon(PackedVector2Array([Vector2(12, 17), Vector2(24, 15), Vector2(24, 165), Vector2(12, 167)]), _accent.darkened(0.5))
	draw_line(Vector2(26, 16), Vector2(26, 164), Color("e5c88b"), 1.5, true)
	for stitch_y in [35, 70, 105, 140]:
		draw_line(Vector2(13, stitch_y), Vector2(22, stitch_y - 1), Color("d3c09b"), 1.5, true)
	draw_polyline(PackedVector2Array([cover[0], cover[1], cover[2], cover[3], cover[0]]), Color("f4cd88") if selected else Color("9d8259"), 2 if selected else 1, true)
	draw_set_transform(Vector2.ZERO)
