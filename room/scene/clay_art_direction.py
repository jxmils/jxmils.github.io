"""Handmade clay dressing shared by the Blender scene and its GLB export."""
import math
import random
import bpy
import bmesh
from mathutils import Matrix, Vector


def material(name, color, roughness=0.82):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Specular IOR Level'].default_value = 0.22
    return m


def finish(obj, name, mat):
    obj.name = name
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    for p in getattr(obj.data, 'polygons', []):
        p.use_smooth = True
    return obj


def box(name, pos, half, mat, radius=0.02):
    # Direct datablocks avoid updating the entire architectural scene for every prop.
    x,y,z=half
    mesh=bpy.data.meshes.new(name+'Mesh')
    mesh.from_pydata([(-x,-y,-z),(-x,-y,z),(-x,y,-z),(-x,y,z),
                      (x,-y,-z),(x,-y,z),(x,y,-z),(x,y,z)],[],
                     [(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)])
    uv=mesh.uv_layers.new(name='UVMap')
    for face in mesh.polygons:
        for index,co in zip(face.loop_indices,[(0,0),(0,1),(1,1),(1,0)]):
            uv.data[index].uv=co
    o=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(o)
    o.location=pos
    finish(o,name,mat)
    b=o.modifiers.new('Soft hand-rounded corners','BEVEL')
    b.width=radius;b.segments=4
    o.modifiers.new('Weighted face normals','WEIGHTED_NORMAL')
    return o


def egg(name, pos, scale, mat):
    sphere=bpy.data.meshes.get('ClaySphereTemplate')
    if sphere is None:
        sphere=bpy.data.meshes.new('ClaySphereTemplate')
        bm=bmesh.new()
        bmesh.ops.create_uvsphere(bm,u_segments=24,v_segments=16,radius=1)
        bm.to_mesh(sphere);bm.free()
    o=bpy.data.objects.new(name,sphere.copy())
    bpy.context.collection.objects.link(o)
    o.location=pos;o.scale=scale
    return finish(o,name,mat)


def line(name, points, radius, mat):
    c = bpy.data.curves.new(name, 'CURVE')
    c.dimensions = '3D'
    c.resolution_u = 10
    c.bevel_depth = radius
    c.bevel_resolution = 3
    s = c.splines.new('BEZIER')
    s.bezier_points.add(len(points)-1)
    for p, co in zip(s.bezier_points, points):
        p.co = co
        p.handle_left_type = p.handle_right_type = 'AUTO'
    o = bpy.data.objects.new(name, c)
    bpy.context.collection.objects.link(o)
    return finish(o, name, mat)


def text(name, body, pos, size, mat, rotation=(math.pi/2, 0, math.pi)):
    c = bpy.data.curves.new(name, 'FONT')
    c.body = body
    c.align_x = 'CENTER'
    c.align_y = 'CENTER'
    c.size = size
    c.space_line = 1.1
    c.extrude = .0007
    c.bevel_depth = .00035
    o = bpy.data.objects.new(name, c)
    bpy.context.collection.objects.link(o)
    o.location = pos
    o.rotation_euler = rotation
    return finish(o, name, mat)


def plant(name, pos, size, cream, greens, trailing=False):
    x, y, z = pos
    egg(name+'Pot', (x,y,z+size*.38), (size*.53,size*.53,size*.48), cream)
    soil = bpy.data.materials.get('DeskPlantSoilMat')
    egg(name+'Soil', (x,y,z+size*.78), (size*.44,size*.44,size*.08), soil)
    for i in range(9):
        a = i * 2.399
        h = size*(1.2 + (i%3)*.23)
        tip = (x+math.cos(a)*size*.8, y+math.sin(a)*size*.7, z+h)
        line(name+'Stem', [(x,y,z+size*.72), tip], size*.026, greens[0])
        o = egg(name+'Leaf', tip, (size*.32,size*.13,size*.63), greens[i%len(greens)])
        o.rotation_euler = (.45*math.sin(a), .65*math.cos(a), a)
    if trailing:
        for j in range(4):
            pts=[]
            for k in range(8):
                xx=x+(j-1.5)*size*.37 + math.sin(k*.8+j)*size*.20
                yy=y+size*.53+math.sin(k*.5)*size*.3
                zz=z+size*.65-k*size*.39
                pts.append((xx,yy,zz))
                if k:
                    o=egg(name+'TrailingLeaf', (xx+(-1)**k*size*.20,yy,zz),
                          (size*.25,size*.085,size*.36),greens[(k+j)%len(greens)])
                    o.rotation_euler.y=(-1)**k*.65
            line(name+'Vine',pts,size*.023,greens[0])


def teddy():
    # Face +Y, towards the seated camera. The old figure faced the wall.
    for o in list(bpy.data.objects):
        if o.name.startswith('Bear'):
            bpy.data.objects.remove(o, do_unlink=True)
    cream = material('Teddy warm vanilla clay', (.79,.665,.46))
    pale = material('Teddy muzzle and paw clay', (.93,.82,.63))
    inner = material('Teddy inner ear biscuit', (.57,.40,.25))
    nose = material('Teddy cocoa nose', (.16,.068,.036), .75)
    eyes = material('Teddy obsidian eyes', (.012,.009,.007), .19)
    glint = material('Teddy eye glints', (.98,.92,.76), .3)
    bx, by, bz = -.73, .025, .815
    def part(name, p, s, m):
        return egg('Bear'+name, (bx+p[0],by+p[1],bz+p[2]),s,m)
    part('Plush',(0,0,.105),(.088,.068,.111),cream)
    part('Head',(0,.005,.235),(.102,.072,.09),cream)
    part('Belly',(0,.060,.108),(.058,.014,.071),pale)
    for side in (-1,1):
        part('Ear', (side*.078,0,.310),(.040,.028,.041),cream)
        part('EarInner',(side*.078,.025,.310),(.024,.009,.025),inner)
        arm=part('Arm',(side*.09,.004,.133),(.042,.043,.065),cream)
        arm.rotation_euler.y=side*-.45
        part('Foot',(side*.055,.045,.035),(.052,.060,.042),cream)
        part('Paw',(side*.055,.093,.037),(.032,.012,.026),pale)
        part('Eye',(side*.038,.071,.25),(.010,.006,.012),eyes)
        part('EyeGlint',(side*.038-.002,.077,.254),(.003,.002,.003),glint)
    part('Muzzle',(0,.070,.213),(.048,.022,.035),pale)
    # Soft triangular nose, rounded via subdivision.
    verts=[(bx-.017,by+.092,bz+.229),(bx+.017,by+.092,bz+.229),
           (bx,by+.100,bz+.208),(bx,by+.105,bz+.226)]
    mesh=bpy.data.meshes.new('BearNoseMesh')
    mesh.from_pydata(verts,[],[(0,1,3),(1,2,3),(2,0,3),(0,2,1)])
    ob=bpy.data.objects.new('BearNose',mesh)
    bpy.context.collection.objects.link(ob)
    finish(ob,'BearNose',nose)
    mod=ob.modifiers.new('Soft nose','BEVEL');mod.width=.004;mod.segments=3
    line('BearMouth',[(bx,by+.095,bz+.214),(bx,by+.096,bz+.202),
                     (bx+.012,by+.091,bz+.198)],.0016,nose)
    # A few embossed curls give a kneaded surface without photorealistic hair.
    rng=random.Random(81)
    for i in range(36):
        a=rng.uniform(.12,math.pi-.12); b=rng.uniform(-.9,.9)
        x=.099*math.cos(a)*math.cos(b)
        y=.072*math.sin(a)*math.cos(b)
        z=.235+.087*math.sin(b)
        if y>.045 and abs(x)<.065 and .18<z<.275:
            continue
        line('BearClayCurl',[(bx+x-.005,by+y,bz+z),
                            (bx+x,by+y+.002,bz+z+.004),
                            (bx+x+.004,by+y,bz+z+.001)],.0015,pale)

    bpy.context.view_layer.update()
    pivot = Vector((bx, by, bz))
    turn = Matrix.Translation(pivot) @ Matrix.Rotation(math.radians(-25), 4, 'Z') @ Matrix.Translation(-pivot)
    for obj in bpy.data.objects:
        if obj.name.startswith('Bear'):
            obj.matrix_world = turn @ obj.matrix_world


def add_ceiling():
    existing=bpy.data.objects.get('ClayCeiling')
    if existing:
        bpy.data.objects.remove(existing,do_unlink=True)
    box('ClayCeiling',(0,0,3.81),(4.06,3.06,.04),
        bpy.data.materials['CharcoalBackWall'],.02)


def apply():
    wood = bpy.data.materials['DeskWood']
    cream = material('Warm porcelain clay',(.78,.66,.49))
    paper = material('Ivory research paper',(.86,.79,.64))
    ink = material('Research ink',(.095,.13,.15))
    teal = material('Sage blue clay',(.16,.34,.34))
    terracotta = material('Terracotta clay',(.49,.235,.15))
    honey = material('Honey clay',(.62,.40,.16))
    greens=[material('Sage leaf '+str(i),c) for i,c in enumerate([
        (.19,.34,.14),(.30,.44,.20),(.12,.25,.12)])]
    # Lift graphite towards dusky blue-grey; preserve the night-time palette.
    palette={
        'CharcoalBackWall':(.19,.225,.27),'WarmGraphiteSideWall':(.24,.275,.32),
        'MonitorShell':(.075,.095,.115),'PropDark':(.12,.155,.17),
        'PropPanel':(.085,.11,.125),'KeyboardBody':(.31,.39,.40),
        'KeycapWhite':(.84,.77,.63),'DeskMatMat':(.115,.19,.20),
        'DeskMatEdge':(.25,.36,.34),'CoffeeMugMat':(.21,.42,.40),
        'DecorStickyNote':(.79,.71,.54),'DecorBrass':(.56,.35,.14),
        'DeskPlantPotMat':(.60,.38,.25),'BlackWindowFrame':(.16,.21,.24),
    }
    for m in list(bpy.data.materials):
        p=m.node_tree.nodes.get('Principled BSDF') if m.use_nodes else None
        if not p: continue
        if m.name in palette: p.inputs['Base Color'].default_value=(*palette[m.name],1)
        if not any(t in m.name for t in ('Glass','Radcam','College','Exterior','Screen','Teddy')):
            p.inputs['Roughness'].default_value=max(.72,p.inputs['Roughness'].default_value)
            p.inputs['Metallic'].default_value=0
            p.inputs['Specular IOR Level'].default_value=.2
            # Faint clay pores in Cycles; geometry and palette also export to GLB.
            noise=m.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=145
            bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.13
            bump.inputs['Distance'].default_value=.0012
            m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height'])
            m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
    # Replace blocky leaf silhouettes with small pressed clay ovals.
    for o in list(bpy.data.objects):
        if o.name.startswith(('DeskSideLeaf','PegboardLeaf','HangingLeaf')):
            corners=[o.matrix_world @ Vector(v) for v in o.bound_box]
            low=Vector([min(v[i] for v in corners) for i in range(3)])
            high=Vector([max(v[i] for v in corners) for i in range(3)])
            pos=(low+high)/2; dims=high-low; rot=o.rotation_euler.copy(); name=o.name
            bpy.data.objects.remove(o,do_unlink=True)
            n=egg(name,pos,dims*.62,greens[1]);n.rotation_euler=rot
    for o in bpy.data.objects:
        if o.type=='MESH' and o.name.startswith(('MonitorBody','MonitorRiser','TowerPC','Speaker','Pegboard','DeskTop')):
            for mod in o.modifiers:
                if mod.type=='BEVEL': mod.width=max(mod.width,.018);mod.segments=4
    # Recompose the wall above the screen. Keep the Einstein portrait.
    for o in list(bpy.data.objects):
        if o.name.startswith(('PosterFrame', 'PosterPaper', 'PosterText')) and 'Imagination' not in o.name:
            bpy.data.objects.remove(o,do_unlink=True)
    for o in bpy.data.objects:
        if 'Imagination' in o.name: o.location.z+=.26
        if o.name.startswith('StickyNote'): o.hide_render=True; o.hide_viewport=True
        if o.name.startswith('WallClock'): o.location.z += .14
    # Pegboard holes and small framed prints replace the empty wood rectangle.
    for row in range(6):
        for col in range(6):
            egg('PegboardRecess',(-3.09+col*.145,-2.888,1.49+row*.165),(.014,.003,.014),ink)
    for i,(x,z) in enumerate([(-2.82,2.26),(-2.54,1.82)]):
        box('PegboardPrintPaper',(x,-2.815,z),(.069,.003,.069),paper,.003)
        text('PegboardPrintTitle',['OXFORD','IDEAS'][i],(x,-2.809,z+.018),.021,ink)
        line('PegboardSketch',[(x-.046,-2.808,z-.035),(x-.023,-2.808,z-.003),
                              (x,-2.808,z-.04),(x+.04,-2.808,z-.006)],.002,teal)
    # High library shelf with readable book spines and under-shelf light.
    box('ResearchLibraryShelf',(-.45,-2.69,2.83),(2.55,.23,.055),wood,.035)
    for x in (-2.45,-.35,1.55):
        box('ShelfBracket',(x,-2.80,2.69),(.035,.10,.13),honey,.025)
    titles=['SYSTEMS','NETWORKS','OPTICS','ML','DISTRIBUTED','DESIGN','COMPUTE','RESEARCH']
    for i,title in enumerate(titles):
        x=1.65-i*.19; h=.30+(i%3)*.045
        ob=box('LibraryBook'+str(i),(x,-2.64,2.89+h/2),(.073,.13,h/2),[teal,terracotta,ink,honey][i%4],.014)
        text('BookSpine'+str(i),title,(x,-2.504,2.89+h*.55),.027,paper)
        for z in (2.925,2.89+h-.035): box('BookGoldBand',(x,-2.499,z),(.057,.002,.004),cream,.002)
    plant('LibraryPothos',(-2.40,-2.57,2.88),.21,terracotta,greens,True)
    plant('ShelfFern',(-.52,-2.64,2.89),.13,cream,greens)
    # Tiny globe / orbit sculpture, recalling the warm science objects in ref 1.
    egg('ShelfGlobe',(-1.28,-2.64,3.04),(.125,.125,.125),teal)
    for tilt in (-.5,.5):
        pts=[(-1.28+.15*math.cos(a),-2.64+.15*math.sin(a)*math.sin(tilt),3.04+.15*math.sin(a)*math.cos(tilt)) for a in [i*math.tau/32 for i in range(33)]]
        line('GlobeOrbit',pts,.009,honey)
    box('GlobeBase',(-1.28,-2.64,2.90),(.10,.085,.018),honey)
    glow=bpy.data.materials['StringLightBulbGlow']
    box('LibraryWarmStrip',(-.45,-2.47,2.775),(2.45,.016,.009),glow,.005)
    # Two research prints and a pinboard drawing occupy the former empty centre.
    for name,x,w,body in [('BuildMeasure',-.50,.22,'BUILD\nMEASURE\nLEARN\nREPEAT'),
                          ('OpenSystems',-1.32,.31,'Systems\nfor a more\nopen world.')]:
        box(name+'Frame',(x,-2.86,2.09),(w,.024,.30),wood,.021)
        box(name+'Paper',(x,-2.831,2.09),(w-.026,.005,.273),paper,.005)
        text(name+'Text',body,(x,-2.821,2.105),.060 if name=='BuildMeasure' else .065,ink)
        box(name+'Rule',(x,-2.81,1.89),(w*.32,.003,.004),honey,.002)
    # Small topology card above the monitor, drawn as real clay cord and nodes.
    box('TopologyCard',(.10,-2.855,2.12),(.22,.024,.25),paper,.015)
    coords=[(.10+.155*math.cos(i*math.tau/6),-2.821,2.12+.18*math.sin(i*math.tau/6)) for i in range(6)]
    for i,p in enumerate(coords):
        egg('TopologyPin',p,(.012,.008,.012),terracotta)
        for j in (1,2): line('TopologyThread',[p,coords[(i+j)%6]],.002,teal)
    # Pinned notes sit as a cluster beside the pegboard, not random blank squares.
    for i,(x,z) in enumerate([(-1.96,2.35),(-1.97,2.12),(-1.96,1.9)]):
        box('LabNote',(x,-2.85,z),(.11,.005,.085),[paper,cream,teal][i],.006)
        egg('LabNotePin',(x,-2.838,z+.063),(.009,.006,.009),honey)
        text('LabNoteWriting',['IDEA 01','test / learn','keep curious'][i],(x,-2.838,z),.027,ink)
    for x in (-1.9,-.4,1.25):
        bpy.ops.object.light_add(type='AREA',location=(x,-2.43,2.73))
        o=bpy.context.object;o.name='LibraryWallWash';o.data.energy=18;o.data.shape='DISK';o.data.size=.9
        o.data.color=(1,.73,.45)
        o.rotation_euler=(Vector((x,-2.94,1.7))-o.location).to_track_quat('-Z','Y').to_euler()
    # Pressed petal flowers, with the original stems retained.
    for bloom in list(bpy.data.objects):
        if bloom.name.startswith('FlowerBloom'):
            bloom.data.materials.clear(); bloom.data.materials.append(honey)
            bloom.scale *= .55
            x,y,z=bloom.location
            for i in range(6):
                a=i*math.tau/6
                petal=egg('ClayDaisyPetal',(x+.031*math.sin(a),y+.004,z+.031*math.cos(a)),
                          (.017,.010,.025),paper)
                petal.rotation_euler.y=a
    # Extra desk greenery and an actual orb beside the home lab.
    plant('DeskPothos',(-1.36,-.21,.815),.10,terracotta,greens,False)
    egg('HomeLabMoon',(-3.12,-.32,1.60),(.15,.15,.15),glow)
    box('HomeLabMoonBase',(-3.12,-.32,1.44),(.11,.10,.025),wood,.015)
    teddy()
    add_ceiling()
    camera=bpy.data.objects['Camera']
    camera.location=(.62,1.65,1.88)
    camera.rotation_euler=(Vector((-.68,-1.6,1.45))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.lens=23
    camera.data.dof.aperture_fstop=8
    bpy.data.objects['SoftRoomKey'].data.energy=155
    fill=bpy.data.objects['CoolWallFill'];fill.data.energy=70;fill.data.color=(.82,.87,1)
    fill.rotation_euler=(Vector((0,-1.7,1.4))-fill.location).to_track_quat('-Z','Y').to_euler()
    bpy.data.objects['WarmDeskAccent'].data.energy=18
    bpy.context.scene.cycles.use_denoising=True
    restore_steve_poster()
    import personal_wall_art
    personal_wall_art.apply()


def tidy_faraday_shelf():
    """Place the small shelf above Faraday, clear of the two research prints.

    Use world bounds because scene finishing may bake the shelf transform into
    its vertices. An absolute target also makes this safe to apply repeatedly.
    """
    shelf = bpy.data.objects.get('LetterShelf')
    if shelf is None:
        return []
    bpy.context.view_layer.update()
    points = [shelf.matrix_world @ Vector(p) for p in shelf.bound_box]
    center = sum(points, Vector()) / 8
    delta = Vector((3.20 - center.x, 0, 2.37 - center.z))
    moved = []
    for ob in bpy.data.objects:
        if ob.name == 'LetterShelf' or ob.name.startswith('LetterBlock'):
            assert ob.parent is None, 'Shelf layout expects unparented room props'
            ob.location += delta
            moved.append(ob.name)
    bpy.context.view_layer.update()
    return moved


def restore_steve_poster():
    """Keep the original Jobs portrait and quote prominent in the clay room."""
    import create_indie_cozy_room as room
    # Put the smaller research prints in the free strip beside Einstein/Faraday.
    for prefix, target in [('BuildMeasure', (2.22, 2.13)), ('OpenSystems', (2.22, 1.37))]:
        anchor=bpy.data.objects.get(prefix+'Frame')
        if anchor:
            delta=Vector((target[0]-anchor.location.x,0,target[1]-anchor.location.z))
            for ob in bpy.data.objects:
                if ob.name.startswith(prefix):ob.location+=delta
    for ob in list(bpy.data.objects):
        if ob.name.startswith(('PosterFrame','PosterPaper','PosterText')) and 'Imagination' not in ob.name:
            bpy.data.objects.remove(ob,do_unlink=True)
    tidy_faraday_shelf()
    frame, portrait, quote=room.add_poster()
    border=room.add_frame_surround(frame,'y')
    mount=bpy.data.materials.get('PrintMount') or material('PrintMount',(.052,.055,.066))
    frame.data.materials.append(mount)
    border.data.materials.append(bpy.data.materials['PosterFrameBlackMetal'])
    portrait_mat=bpy.data.materials.get('StevePosterImage')
    if portrait_mat is None:
        import os
        portrait_mat=room.make_image_material('StevePosterImage',os.path.join(os.path.dirname(__file__),'src','stl','radcam','img','steve_bw.jpg'))
    portrait.data.materials.append(portrait_mat)
    quote.data.materials.append(bpy.data.materials['BrightPosterText'])
    for ob in (frame,portrait,quote,border):ob.location+=Vector((.35,0,.11))
    for ob in (frame,border):room.stylize_object(ob,bevel_width=.012,bevel_segments=4,subsurf_levels=0)
    bpy.context.view_layer.update()
