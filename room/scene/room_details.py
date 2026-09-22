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
 meshmat=mat('Mesh weave',(.12,.135,.135),.94)
 cloth=mat('Seat upholstery',(.085,.12,.125),.93)
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
 # Ergonomic task chair: supported seat, breathable curved back, real casters.
 cx,cy=.52,1.14
 box('ChairSeat',(cx,cy,.555),(.272,.263,.05),cloth,.065)
 box('ChairSeatUnderside',(cx,cy+.015,.496),(.218,.208,.018),graphite,.035)
 # Curved mesh back follows a gently reclined lumbar profile.
 def backpoint(u,t):
  width=.237+.031*math.sin(math.pi*t)
  return Vector((cx+u*width,cy+.235+.10*t-.035*math.sin(math.pi*t)+.026*u*u,.64+.64*t))
 for side in [-1,1]:line('ChairBackSide',[backpoint(side,t) for t in [0,.2,.4,.6,.8,1]],.017,graphite)
 for t in [0,1]:line('ChairBackRail',[backpoint(u,t) for u in [-1,-.75,-.5,0,.5,.75,1]],.019,graphite)
 # Open net: geometry rather than a solid slab with painted mesh.
 for i in range(1,43):
  t=i/43;line('ChairMeshHorizontal',[backpoint(u,t) for u in [-.96,-.5,0,.5,.96]],.0021,meshmat)
 for i in range(1,32):
  u=-1+2*i/32;line('ChairMeshVertical',[backpoint(u,t) for t in [.025,.25,.5,.75,.975]],.0016,meshmat)
 line('ChairLumbarSupport',[backpoint(u,.22)+Vector((0,.023,0)) for u in [-.95,-.5,0,.5,.95]],.025,graphite)
 for side in [-1,1]:
  x=cx+side*.306
  line('ChairArmUpright',[(cx+side*.21,cy+.1,.48),(x,cy+.07,.54),(x,cy+.07,.745)],.019,graphite)
  box('ChairArmPad',(x,cy-.02,.755),(.042,.151,.024),rubber,.03)
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
 # Rectangular midnight-sage woven rug with a warm bound edge and quiet stripes.
 rug=mat('Rug midnight sage',(.11,.16,.17),.99)
 border=mat('Rug oatmeal border',(.36,.34,.28),.99)
 stripe=mat('Rug muted weave',(.20,.25,.24),.99)
 base=box('ChairFuzzyMat',(cx,1.14,.022),(1.02,.92,.012),border,.014)
 box(P+'RugField',(cx,1.14,.036),(.956,.856,.004),rug,.008)
 for side in [-1,1]:
  for offset,width in [(0,.006),(.018,.002)]:
   box(P+'RugBorderStripe',(cx,1.14+side*(.824-offset),.041),(.931,width,.001),stripe,.001)
   box(P+'RugBorderStripe',(cx+side*(.924-offset),1.14,.041),(width,.814,.001),stripe,.001)
 # Restrained woven cross-lines are flat and do not add per-frame work.
 for i in range(45):
  box(P+'RugWeft',(cx,1.14-.79+i*.036,.041),(.9,.0007,.0005),stripe,.0003)
 inside=bpy.data.collections.get('Architecture Interior Receivers')
 if inside:
  for ob in bpy.data.objects:
   if ob.name.startswith((P,'Chair')) and ob.name not in inside.objects:inside.objects.link(ob)
 bpy.context.view_layer.update()

