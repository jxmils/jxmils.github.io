# Personal room details

`room_details.apply()` adds the brick-built Death Star beside the portrait, a five-ball Newton’s cradle, an espresso-brown leather office chair, and a plain black desk-width rectangular rug. It is repeatable and operates on the existing Blender room, preserving the exterior and other props. The geometry is static and uses the viewer’s existing batching.

The full editable scene is maintained in `website_blender/indie_cozy_room.blend`. Open that scene in Blender, add this folder to Python’s module path, and call `room_details.apply()` to rebuild these details. The main authoring generator calls the same function after the room layout and beanbag are finalized.

The Death Star is an original brick-style model, not an imported commercial LEGO set asset.

## Server rack

`server_details.apply()` replaces the simplified rack units with a 16-port switch, numbered patch panel, two compute nodes, eight-bay storage and a UPS. It preserves the existing frame placement and HOME LAB sign. Details include mounted faceplates, screws, louvers, drive handles, Ethernet sockets, small steady indicators and tidy patch leads. No animated lights or extra runtime render loop is added.

The full authoring generator calls this after room decoration. The module also runs directly against the saved Blender scene; it is safe to repeat.
