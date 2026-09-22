# Personal room details

`room_details.apply()` adds the brick-built Death Star beside the portrait, a five-ball Newton’s cradle, an espresso-brown leather office chair, and a desk-width rectangular bordered rug. It is repeatable and operates on the existing Blender room, preserving the exterior and other props. The geometry is static and uses the viewer’s existing batching.

The full editable scene is maintained in `website_blender/indie_cozy_room.blend`. Open that scene in Blender, add this folder to Python’s module path, and call `room_details.apply()` to rebuild these details. The main authoring generator calls the same function after the room layout and beanbag are finalized.

The Death Star is an original brick-style model, not an imported commercial LEGO set asset.
