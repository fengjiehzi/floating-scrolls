extends Node2D

func _draw() -> void:
	# A fixed perspective set: rear gallery, tiled floor, near columns and lanterns.
	draw_polygon(PackedVector2Array([Vector2(405, 252), Vector2(1115, 252), Vector2(1390, 620), Vector2(342, 620)]), PackedColorArray([Color("344643"), Color("344643"), Color("131f24"), Color("131f24")]))
	for edge_x in range(342, 1400, 100):
		draw_line(Vector2(790, 165).lerp(Vector2(edge_x, 620), 0.22), Vector2(edge_x, 620), Color("62706c55"), 1, true)
	for floor_y in [272, 307, 351, 407, 478, 572]:
		var spread: float = (floor_y - 165.0) / 455.0
		draw_line(Vector2(790, 165).lerp(Vector2(342, 620), spread), Vector2(790, 165).lerp(Vector2(1390, 620), spread), Color("81908044"), 1, true)
	draw_colored_polygon(PackedVector2Array([Vector2(405, 252), Vector2(1115, 252), Vector2(1131, 270), Vector2(389, 270)]), Color("897352"))
	draw_line(Vector2(405, 252), Vector2(1115, 252), Color("c4a87588"), 2, true)
	# Repeating uprights and open lattice give the painted mountains a foreground frame.
	for column_x in [396, 596, 996, 1196]:
		draw_rect(Rect2(column_x, 40, 14, 214), Color("2d3330"))
		draw_line(Vector2(column_x + 12, 40), Vector2(column_x + 12, 253), Color("b39a6855"), 2, true)
	for rail_y in [54, 67]:
		draw_line(Vector2(396, rail_y), Vector2(1210, rail_y), Color("af936966"), 2, true)
	for lattice_x in range(418, 1200, 25):
		draw_polyline(PackedVector2Array([Vector2(lattice_x, 70), Vector2(lattice_x + 12, 85), Vector2(lattice_x, 100), Vector2(lattice_x - 12, 85), Vector2(lattice_x, 70)]), Color("977e5044"), 1, true)
	# Near columns use three differently lit faces, rather than a flat border.
	for column_x in [342, 1242]:
		draw_rect(Rect2(column_x - 7, 0, 31, 535), Color("141e20"))
		draw_rect(Rect2(column_x + 13, 0, 8, 535), Color("4b4937"))
		draw_line(Vector2(column_x + 23, 0), Vector2(column_x + 23, 535), Color("ac94616b"), 2, true)
		draw_colored_polygon(PackedVector2Array([Vector2(column_x - 18, 523), Vector2(column_x + 24, 518), Vector2(column_x + 43, 535), Vector2(column_x, 544)]), Color("696250"))
		draw_rect(Rect2(column_x - 18, 535, 61, 18), Color("343a34"))
	draw_colored_polygon(PackedVector2Array([Vector2(336, 0), Vector2(1280, 0), Vector2(1240, 30), Vector2(364, 30)]), Color("141d1f"))
	draw_line(Vector2(364, 30), Vector2(1240, 30), Color("a0875666"), 2, true)
	for lantern_x in [430, 1172]:
		_draw_lantern(Vector2(lantern_x, 60))

func _draw_lantern(origin: Vector2) -> void:
	for radius in range(80, 14, -2):
		draw_circle(origin + Vector2(0, 49), radius, Color(0.93, 0.65, 0.28, 0.006))
	draw_line(origin, origin + Vector2(0, 24), Color("c3a16a"), 1.4, true)
	draw_colored_polygon(PackedVector2Array([origin + Vector2(-13, 29), origin + Vector2(11, 25), origin + Vector2(18, 36), origin + Vector2(16, 64), origin + Vector2(-10, 68), origin + Vector2(-17, 57)]), Color("c4a16b"))
	draw_colored_polygon(PackedVector2Array([origin + Vector2(-10, 33), origin + Vector2(8, 30), origin + Vector2(8, 60), origin + Vector2(-10, 63)]), Color("f3d596"))
	draw_line(origin + Vector2(0, 31), origin + Vector2(0, 62), Color("8a673e"), 1, true)
	draw_line(origin + Vector2(2, 68), origin + Vector2(2, 88), Color("b66546"), 2, true)
