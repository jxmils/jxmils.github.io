"""Editable personal objects and tailored seating; preserves the approved room."""
import bpy, math, random, sys, os, json
from mathutils import Vector
ROOT=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,ROOT)
from clay_art_direction import box, egg, line, material
P='PersonalDetail'
def mat(name,color,rough=.65,metal=0):
 m=bpy.data.materials.get(P+name) or material(P+name,color,rough)
 m.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=metal
 return m

def mesh(name,verts,faces,m):
 d=bpy.data.meshes.new(name+'Mesh');d.from_pydata(verts,[],faces);d.update();d.materials.append(m)
 o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);return o

def cylinder(name,a,b,r,m,segments=16):
 a,b=Vector(a),Vector(b);axis=(b-a).normalized();u=axis.cross(Vector((0,0,1)))
 if u.length<.1:u=axis.cross(Vector((0,1,0)))
 u.normalize();v=axis.cross(u);verts=[]
 for c in (a,b):
  for j in range(segments):verts.append(c+r*(math.cos(j*math.tau/segments)*u+math.sin(j*math.tau/segments)*v))
 faces=[tuple(range(segments-1,-1,-1)),tuple(range(segments,2*segments))]
 for j in range(segments):k=(j+1)%segments;faces.append((j,k,k+segments,j+segments))
 o=mesh(name,verts,faces,m)
 for f in o.data.polygons:f.use_smooth=True
 return o

def ring(name,center,u,v,r,m,thickness=.002):
 return line(name,[Vector(center)+r*(math.cos(j*math.tau/64)*Vector(u)+math.sin(j*math.tau/64)*Vector(v)) for j in range(65)],thickness,m)

def apply():
 random.seed(23)
 for o in list(bpy.data.objects):
  if o.name.startswith(P) or o.name.startswith('Chair'):
   bpy.data.objects.remove(o,do_unlink=True)
 graphite=mat('Graphite',(.055,.063,.067),.56)
 rubber=mat('Rubber',(.021,.025,.027),.85)
 silver=mat('Satin aluminum',(.37,.41,.42),.3,.7)
 # Brick-built miniature Death Star, on the book stack next to Jason's portrait.
 greys=[mat('Brick gray '+str(i),(.24+i*.025,.265+i*.025,.28+i*.025),.64) for i in range(4)]
 dark=mat('Trench',(.055,.065,.077),.8)
 center=Vector((3.625,1.835,1.422));radius=.183
 normal=Vector((-.88,.27,.39)).normalized();u=normal.cross(Vector((0,0,1))).normalized();v=normal.cross(u).normalized()
 box(P+'DeathStarDisplayBase',(center.x,center.y,1.222),(.103,.113,.010),graphite,.008)
 cylinder(P+'DeathStarStand',(center.x,center.y,1.23),(center.x,center.y,1.27),.025,graphite)
 # Each plate is a distinct little shell segment, separated by a fine brick seam.
 for row in range(14):
  t0=-math.pi/2+row*math.pi/14;t1=t0+math.pi/14
  for col in range(36):
   p0=col*math.tau/36;p1=p0+math.tau/36
   tm=(t0+t1)/2;pm=(p0+p1)/2
   n=Vector((math.cos(tm)*math.cos(pm),math.cos(tm)*math.sin(pm),math.sin(tm)))
   if abs(tm)<.03:continue
   verts=[]
   for t,p in [(t0+.005,p0+.005),(t0+.005,p1-.005),(t1-.005,p1-.005),(t1-.005,p0+.005)]:
    # Visible equatorial trench between the two completed hemispheres.
    if abs(t)<.0051:t=math.copysign(.019,t or tm)
    verts.append(center+radius*Vector((math.cos(t)*math.cos(p),math.cos(t)*math.sin(p),math.sin(t))))
   # Clip the individual bricks against the circular dish opening.
   clipped=[];limit=radius*.895
   for a,b in zip(verts,verts[1:]+verts[:1]):
    da=(a-center).dot(normal)-limit;db=(b-center).dot(normal)-limit
    if da<=0:clipped.append(a)
    if (da<=0)!=(db<=0):
     q=a+(b-a)*(da/(da-db));radial=q-center-normal*limit
     clipped.append(center+normal*limit+radial.normalized()*(radius*math.sqrt(1-.895**2)))
   if len(clipped)<3:continue
   o=mesh(P+'DeathStarBrick',clipped,[tuple(range(len(clipped)))],random.choice(greys))
   if col%2==0 and row%2==0 and abs(tm)<1.35 and n.dot(normal)<.86:
    cylinder(P+'DeathStarStud',center+n*(radius-.001),center+n*(radius+.006),.007,greys[2],10)
 ring(P+'DeathStarTrench',center,(1,0,0),(0,1,0),radius-.002,dark,.004)
 # Concave superlaser dish with concentric brick rings and radial ribs.
 dishcenter=center+normal*(radius*.895);R=radius*.45
 verts=[];faces=[]
 for row in range(9):
  f=row/8
  for j in range(48):
   a=j*math.tau/48;verts.append(dishcenter+R*f*(math.cos(a)*u+math.sin(a)*v)-normal*(radius*.125*(1-f*f)))
 for row in range(8):
  for j in range(48):k=(j+1)%48;faces.append((row*48+j,row*48+k,(row+1)*48+k,(row+1)*48+j))
 mesh(P+'DeathStarSuperlaserDish',verts,faces,greys[1])
 for f in [.33,.66,1]:ring(P+'DeathStarDishRing',dishcenter-normal*(radius*.125*(1-f*f)),u,v,R*f,greys[3],.002)
 for j in range(8):
  a=j*math.tau/8;rad=math.cos(a)*u+math.sin(a)*v
  line(P+'DeathStarDishRib',[dishcenter+rad*R*f-normal*(radius*.125*(1-f*f)) for f in [.08,.33,.66,1]],.0018,dark)
 egg(P+'DeathStarDishCore',dishcenter-normal*radius*.122,(.009,.009,.009),dark)
 # Five tangent polished spheres, suspended by paired wires in two arch frames.
 bronze=mat('Cradle champagne',(.43,.35,.23),.28,.72)
 steel=mat('Cradle polished steel',(.62,.68,.70),.18,.82)
 cord=mat('Cradle suspension',(.28,.32,.33),.38,.5)
 cx,cy,z=-1.40,.38,.805
 box(P+'NewtonBase',(cx,cy,z+.012),(.205,.105,.012),graphite,.018)
 box(P+'NewtonBaseInlay',(cx,cy,z+.027),(.184,.085,.004),bronze,.012)
 for side in [-1,1]:
  y=cy+side*.073
  line(P+'NewtonFrame',[(cx-.176,y,z+.033),(cx-.176,y,z+.235),(cx-.155,y,z+.263),(cx-.12,y,z+.263),(cx,y,z+.263),(cx+.12,y,z+.263),(cx+.155,y,z+.263),(cx+.176,y,z+.235),(cx+.176,y,z+.033)],.008,bronze)
 for i in range(5):
  x=cx+(i-2)*.052;ball=Vector((x,cy,z+.093))
  egg(P+'NewtonBall',ball,(.026,.026,.026),steel)
  for side in [-1,1]:cylinder(P+'NewtonWire',(x,cy+side*.073,z+.263),ball+Vector((0,side*.007,.023)),.0008,cord,8)
 apply_seating()
 inside=bpy.data.collections.get('Architecture Interior Receivers')
 if inside:
  for ob in bpy.data.objects:
   if ob.name.startswith((P,'Chair')) and ob.name not in inside.objects:inside.objects.link(ob)
 bpy.context.view_layer.update()


def apply_seating():
 for o in list(bpy.data.objects):
  if o.name.startswith('Chair') or o.name.startswith(P+'Rug'):
   bpy.data.objects.remove(o,do_unlink=True)
 graphite=mat('Graphite',(.055,.063,.067),.56)
 rubber=mat('Rubber',(.021,.025,.027),.85)
 silver=mat('Satin aluminum',(.37,.41,.42),.3,.7)
 leather=mat('Espresso leather',(.030,.011,.006),.43)
 bsdf=leather.node_tree.nodes.get('Principled BSDF')
 bsdf.inputs['Specular IOR Level'].default_value=.32
 bsdf.inputs['Coat Weight'].default_value=.08
 bsdf.inputs['Coat Roughness'].default_value=.45
 seam=mat('Espresso leather seams',(.014,.005,.0028),.6)
 # Sculpted, padded espresso leather with tailored seams.
 cx,cy=.52,1.14
 box('ChairSeat',(cx,cy,.555),(.272,.263,.054),leather,.055)
 box('ChairSeatUnderside',(cx,cy+.015,.496),(.218,.208,.018),graphite,.035)
 # The softly crowned front and back share a closed, curved upholstered shell.
 def backpoint(u,t):
  width=.237+.028*math.sin(math.pi*t)
  return Vector((cx+u*width,cy+.235+.10*t-.035*math.sin(math.pi*t)+.026*u*u,.64+.64*t))
 verts=[];faces=[];nu,nt=16,24
 for side in [-1,1]:
  for j in range(nt+1):
   t=j/nt
   for i in range(nu+1):
    u=-1+2*i/nu
    crown=(max(0,1-u*u)*max(0,math.sin(math.pi*t)))**.6
    p=backpoint(u,t)+Vector((0,side*(.017+.034*crown),0))
    verts.append(p)
 count=(nu+1)*(nt+1)
 for side in range(2):
  for j in range(nt):
   for i in range(nu):
    a=side*count+j*(nu+1)+i;face=(a,a+1,a+nu+2,a+nu+1)
    faces.append(face if side==0 else face[::-1])
 boundary=list(range(nu+1))+[j*(nu+1)+nu for j in range(1,nt+1)]+[nt*(nu+1)+i for i in range(nu-1,-1,-1)]+[j*(nu+1) for j in range(nt-1,0,-1)]
 for a,b in zip(boundary,boundary[1:]+boundary[:1]):faces.append((b,a,a+count,b+count))
 back=mesh('ChairLeatherBack',verts,faces,leather)
 for face in back.data.polygons:face.use_smooth=True
 sub=back.modifiers.new('Soft upholstered edges','SUBSURF');sub.levels=2;sub.render_levels=2
 # Edge piping and restrained horizontal upholstery seams on both faces.
 for side in [-1,1]:
  for u in [-.97,.97]:line('ChairLeatherPiping',[backpoint(u,t)+Vector((0,side*.022,0)) for t in [.025,.12,.3,.5,.7,.9,.975]],.0023,seam)
  for t in [.025,.975]:line('ChairLeatherPiping',[backpoint(u,t)+Vector((0,side*.022,0)) for u in [-.97,-.5,0,.5,.97]],.0023,seam)
  for t in [.30,.66]:
   pts=[]
   for i in range(21):
    u=-.94+1.88*i/20;crown=(max(0,1-u*u)*math.sin(math.pi*t))**.6
    pts.append(backpoint(u,t)+Vector((0,side*(.018+.034*crown),0)))
   line('ChairLeatherPanelSeam',pts,.0014,seam)
 # Back support below the upholstered shell; it no longer crosses a mesh panel.
 line('ChairBackSupport',[(cx,cy+.17,.47),(cx,cy+.28,.60),(cx,cy+.33,.80)],.025,graphite)
 line('ChairSeatPiping',[(cx-.23,cy-.235,.568),(cx,cy-.25,.568),(cx+.23,cy-.235,.568),(cx+.257,cy,.568),(cx+.23,cy+.23,.568),(cx,cy+.247,.568),(cx-.23,cy+.23,.568),(cx-.257,cy,.568),(cx-.23,cy-.235,.568)],.002,seam)
 for side in [-1,1]:
  x=cx+side*.306
  line('ChairArmUpright',[(cx+side*.21,cy+.1,.48),(x,cy+.07,.54),(x,cy+.07,.745)],.019,graphite)
  box('ChairArmPad',(x,cy-.02,.755),(.043,.151,.027),leather,.03)
 cylinder('ChairGasLift',(cx,cy,.155),(cx,cy,.49),.029,silver)
 cylinder('ChairLiftSleeve',(cx,cy,.16),(cx,cy,.34),.042,graphite)
 egg('ChairBaseHub',(cx,cy,.155),(.085,.085,.045),graphite)
 for i in range(5):
  a=i*math.tau/5;d=Vector((math.cos(a),math.sin(a),0));side=Vector((-math.sin(a),math.cos(a),0))
  tip=Vector((cx,cy,.09))+d*.365
  line('ChairBaseSpoke',[Vector((cx,cy,.17))+d*.04,Vector((cx,cy,.135))+d*.20,tip+Vector((0,0,.034))],.023,graphite)
  cylinder('ChairCasterFork',tip,tip+Vector((0,0,.055)),.019,graphite)
  for offset in [-.027,.027]:
   c=tip+side*offset-Vector((0,0,.029));cylinder('ChairCasterWheel',c-side*.012,c+side*.012,.033,rubber,24)
   cylinder('ChairCasterHub',c-side*.0125,c+side*.0125,.014,silver,16)
 cylinder('ChairHeightLever',(cx+.12,cy,.477),(cx+.30,cy,.477),.009,graphite)
 apply_rug()
 inside=bpy.data.collections.get('Architecture Interior Receivers')
 if inside:
  for ob in bpy.data.objects:
   if ob.name.startswith(('Chair',P+'Rug')) and ob.name not in inside.objects:inside.objects.link(ob)
 bpy.context.view_layer.update()

def apply_rug():
 """Plain, low-pile black rug; the desk determines its exact width."""
 for o in list(bpy.data.objects):
  if o.name == 'ChairFuzzyMat' or o.name.startswith(P+'Rug'):
   bpy.data.objects.remove(o,do_unlink=True)
 rug=mat('Plain black rug',(.012,.012,.013),.98)
 bsdf=rug.node_tree.nodes.get('Principled BSDF')
 bsdf.inputs['Specular IOR Level'].default_value=.12
 bsdf.inputs['Sheen Weight'].default_value=.12
 bsdf.inputs['Sheen Roughness'].default_value=.9
 # A tiny normal texture provides fabric grain without stripes or a printed pattern.
 image=bpy.data.images.get('Plain black rug pile')
 if image is None:
  size=512;image=bpy.data.images.new('Plain black rug pile',width=size,height=size)
  image.colorspace_settings.name='Non-Color'
  rng=random.Random(91);heights=[rng.random() for _ in range(size*size)];pixels=[]
  for y in range(size):
   for x in range(size):
    dx=(heights[y*size+(x+1)%size]-heights[y*size+(x-1)%size])*.28
    dy=(heights[((y+1)%size)*size+x]-heights[((y-1)%size)*size+x])*.28
    n=Vector((-dx,-dy,1)).normalized();pixels.extend((n.x*.5+.5,n.y*.5+.5,n.z*.5+.5,1))
  image.pixels.foreach_set(pixels);image.pack()
 nodes=rug.node_tree.nodes;links=rug.node_tree.links
 tex=nodes.get('Pile normal texture') or nodes.new('ShaderNodeTexImage');tex.name='Pile normal texture';tex.image=image
 normal=nodes.get('Pile normal') or nodes.new('ShaderNodeNormalMap');normal.name='Pile normal';normal.inputs['Strength'].default_value=.3
 links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],bsdf.inputs['Normal'])
 bpy.context.view_layer.update()
 desk=bpy.data.objects['DeskTop'];xs=[(desk.matrix_world@Vector(v)).x for v in desk.bound_box]
 rugx=(min(xs)+max(xs))/2;half=(max(xs)-min(xs))/2
 # Keep a small floor gap behind the desk supports.
 supports=[o for o in bpy.data.objects if o.name=='DeskTop' or o.name.startswith('DeskLeg')]
 deskfront=max((o.matrix_world@Vector(v)).y for o in supports for v in o.bound_box)
 box('ChairFuzzyMat',(rugx,deskfront+.05+.92,.022),(half,.92,.012),rug,.010)
 inside=bpy.data.collections.get('Architecture Interior Receivers')
 if inside:inside.objects.link(bpy.data.objects['ChairFuzzyMat'])
 bpy.context.view_layer.update()
