"""Detailed, static home-lab equipment in the existing rack footprint."""
import bpy,math,os,sys
from mathutils import Vector, Matrix
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from clay_art_direction import box,egg,line,text,material
from room_details import cylinder,ring
P='RackDetail'
def mat(name,color,rough=.6,metal=0,emission=0):
 m=bpy.data.materials.get(P+name) or material(P+name,color,rough)
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Metallic'].default_value=metal
 if emission:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=emission
 return m

def apply():
 posts=[o for o in bpy.data.objects if o.name.startswith('ServerRackPost')]
 assert len(posts)==4
 def center(name):
  o=bpy.data.objects[name]
  return sum((o.matrix_world@Vector(v) for v in o.bound_box),Vector())/8
 origin=sum((center(o.name) for o in posts),Vector())/4;origin.z=0
 width=(center('ServerRackPost1_1')-center('ServerRackPost-1_1')).normalized()
 forward=(center('ServerRackPost-1_1')-center('ServerRackPost-1_-1')).normalized()
 rack_transform=Matrix((width,forward,Vector((0,0,1)))).transposed().to_4x4()
 rack_transform.translation=origin
 cx=cy=0
 preserved=('ServerRackPost','ServerRackHorizontalRail','ServerRackSideRail','ServerRackLabel')
 for o in list(bpy.data.objects):
  if o.name.startswith(P) or (o.name.startswith('ServerRack') and not o.name.startswith(preserved)):
   bpy.data.objects.remove(o,do_unlink=True)
 frame=mat('Powder coated frame',(.030,.036,.041),.68,.18)
 case=mat('Brushed chassis',(.19,.205,.22),.48,.5)
 face=mat('Graphite faceplates',(.087,.10,.112),.59,.25)
 recess=mat('Vent shadows',(.010,.014,.019),.88)
 handle=mat('Handles and latches',(.045,.052,.058),.50,.2)
 metal=mat('Machined rims',(.33,.36,.38),.36,.65)
 ink=mat('Etched labels',(.60,.65,.64),.76)
 green=mat('Green status',(.09,.48,.27),.55,0,.9)
 cyan=mat('Cyan status',(.07,.34,.49),.55,0,.65)
 amber=mat('Amber link',(.65,.32,.07),.55,0,.55)
 display=mat('UPS display',(.06,.22,.26),.7,0,.55)
 teal=mat('Teal patch lead',(.065,.18,.19),.77)
 slate=mat('Slate patch lead',(.12,.16,.19),.8)
 cream=mat('Sand patch lead',(.29,.27,.22),.83)
 for o in bpy.data.objects:
  if o.name.startswith(preserved[:3]):o.data.materials.clear();o.data.materials.append(frame)
 # The fronts face into the room along +Y. Retain the existing HOME LAB sign.
 front=cy+.28
 def block(name,x,z,w,h,m,y=0,depth=.006,r=.002):
  return box(P+name,(cx+x,front+y,z),(w/2,depth/2,h/2),m,r)
 def label(name,body,x,z,size=.011,y=.022,m=ink):
  return text(P+name,body,(cx+x,front+y,z),size,m,rotation=(math.pi/2,0,math.pi))
 def dot(name,x,z,m=green,r=.0024,y=.025):
  return egg(P+name,(cx+x,front+y,z),(r,.0014,r),m)
 def screw(x,z):
  cylinder(P+'RackScrew',(cx+x,front+.012,z),(cx+x,front+.017,z),.005,metal,12)
  block('ScrewSlot',x,z,.005,.001,recess,.018,.001,.0003)
 def grille(name,x,z,w,h):
  block(name+'Recess',x,z,w,h,recess,.014,.006,.003)
  for j in range(max(3,round(h/.006))):
   zz=z-h*.45+j*h*.90/max(1,round(h/.006)-1)
   block(name+'Louvre',x,zz,w*.94,.0013,case,.018,.002,.0003)
  for xx in [x-w*.27,x+w*.27]:block(name+'Brace',xx,z,.0014,h*.9,face,.019,.003,.0004)
 def chassis(name,z,h,m=face):
  box(P+name+'Body',(cx,cy+.008,z),(.322,.268,h/2-.005),case,.007)
  block(name+'Front',0,z,.64,h,m,.004,.018,.004)
  for x in [-.323,.323]:
   block(name+'MountEar',x,z,.027,h,case,.002,.014,.003)
   for zz in [z-h*.33,z+h*.33]:screw(x,zz)
 def pull(x,z,h=.065):
  # Mounted, rounded handles with a small clearance from the faceplate.
  line(P+'PullHandle',[(cx+x,front+.015,z-h/2),(cx+x,front+.041,z-h/2+.01),(cx+x,front+.043,z+h/2-.01),(cx+x,front+.015,z+h/2)],.0045,handle)
 def port(x,z,index):
  block('RJ45MetalRim',x,z,.025,.023,metal,.017,.008,.0018)
  block('RJ45Socket',x,z,.020,.017,recess,.022,.005,.001)
  block('RJ45Latch',x,z-.007,.008,.003,handle,.026,.002,.0004)
  for dx in [-.005,-.002, .001,.004]:block('RJ45Contact',x+dx,z+.003,.00065,.006,ink,.025,.001,.0001)
  if index%3!=0:dot('LinkLED',x+.009,z+.014,green,.0015)
 # Front mounting rails and square cage-nut holes.
 for x in [-.35,.35]:
  block('MountingRail',x,.82,.025,1.14,frame,-.002,.025,.003)
  for j in range(28):block('CageNutHole',x,.30+j*.039,.007,.010,recess,.012,.001,.0005)
 # Network switch and patch panel.
 chassis('NetworkSwitch',1.22,.090,case)
 label('SwitchName','NETWORK',.237,1.234,.012)
 label('SwitchType','16 PORT',.237,1.210,.008)
 dot('SwitchPower',.28,1.192,cyan)
 portxs=[-.267+i*.028 for i in range(16)]
 for i,x in enumerate(portxs):port(x,1.219,i)
 chassis('PatchPanel',1.095,.064)
 for i,x in enumerate([-.264+i*.048 for i in range(12)]):
  port(x,1.09,i);label('PatchNumber',f'{i+1:02}',x,1.116,.0065,y=.023)
 for i,(idx,m) in enumerate([(1,teal),(4,slate),(7,cream),(10,teal)]):
  x0=-.264+idx*.048;x1=portxs[min(15,idx+1)]
  for x,z in [(x0,1.09),(x1,1.219)]:block('CableBoot',x,z,.017,.016,m,.040,.027,.003)
  line(P+'PatchCable',[(cx+x0,front+.05,1.09),(cx+x0,front+.078,1.06-i*.007),(cx+(x0+x1)/2,front+.11,1.11),(cx+x1,front+.076,1.205),(cx+x1,front+.05,1.219)],.0032,m)
 # Two compute nodes with drive trays, intake grilles and discrete controls.
 for idx,z in enumerate([.918,.728],1):
  chassis('Compute'+str(idx),z,.151)
  label('ComputeName',f'COMPUTE {idx:02}',-.145,z+.052,.013)
  for x in [-.265,.278]:pull(x,z,.079)
  for row in [-1,1]:
   zz=z+row*.016
   block('ComputeDrive',-.148,zz,.158,.027,handle,.017,.006,.002)
   block('ComputeDriveLatch',-.207,zz,.019,.016,metal,.022,.004,.001)
   for slot in range(5):block('DriveAirSlot',-.175+slot*.016,zz,.007,.002,recess,.022,.002,.0006)
   dot('ComputeDriveLED',-.081,zz,green,.0018)
  grille('ComputeIntake',.055,z,.178,.099)
  # A round recessed power button and separate service port.
  ring(P+'PowerRim',(cx+.203,front+.021,z+.028),(1,0,0),(0,0,1),.009,metal,.0018)
  dot('PowerCenter',.203,z+.028,cyan,.0045)
  block('USBInset',.204,z-.008,.022,.008,recess,.020,.004,.001)
  label('NodeTag',f'NODE {idx:02}',.204,z-.038,.0075)
 # Eight removable storage caddies with handles, vent openings and activity LEDs.
 chassis('StorageArray',.510,.183)
 label('StorageName','STORAGE  /  8 BAY',0,.586,.010)
 for row in range(2):
  z=.482+row*.060
  for col in range(4):
   x=-.228+col*.151
   block('DriveCaddy',x,z,.139,.049,handle,.017,.014,.004)
   block('CaddyFace',x,z,.121,.034,case,.026,.006,.002)
   block('CaddyLatch',x-.049,z,.015,.026,handle,.031,.005,.002)
   for j in range(4):block('CaddyVent',x-.029+j*.015,z,.007,.019,recess,.031,.0015,.001)
   dot('CaddyActivity',x+.051,z+.009,green,.0018,y=.031)
   label('DriveNumber',str(row*4+col+1),x+.051,z-.012,.006,y=.032)
 # A dark UPS with a tiny readable LCD, grille, and power control.
 box(P+'UPSBody',(cx,cy,.17),(.34,.275,.12),frame,.009)
 block('UPSFace',0,.15,.643,.178,face,.004,.014,.005)
 grille('UPSIntake',-.15,.15,.265,.123)
 block('UPSDisplayBezel',.115,.165,.119,.052,handle,.015,.007,.003)
 block('UPSDisplay',.115,.165,.100,.035,display,.020,.003,.001)
 label('UPSReadout','ONLINE',.115,.165,.009,y=.023)
 label('UPSTag','UPS / BATTERY',.117,.115,.009)
 ring(P+'UPSPower',(cx+.264,front+.023,.15),(1,0,0),(0,0,1),.011,metal,.002)
 dot('UPSIndicator',.264,.15,green,.003)
 # Restrained shelf below the sign, side service panel, and gathered rear cables.
 box(P+'TopShelf',(cx,cy,1.397),(.338,.245,.012),frame,.006)
 for side in [-1,1]:
  box(P+'SidePanel',(cx+side*.342,cy-.012,.80),(.007,.20,.47),frame,.004)
  for j in range(9):box(P+'SidePanelVent',(cx+side*.350,cy-.145+j*.035,.94),(.001,.009,.09),recess,.003)
 for i,m in enumerate([teal,slate,cream]):
  line(P+'RearCable',[(cx+.26+i*.014,cy-.245,1.19),(cx+.29+i*.012,cy-.265,.98),(cx+.29+i*.012,cy-.265,.40),(cx+.23+i*.014,cy-.25,.30)],.0035,m)
 # Existing rack was rotated with the room layout; build locally, then align
 # to the preserved posts instead of relying on object origins.
 bpy.context.view_layer.update()
 for o in bpy.data.objects:
  if o.name.startswith(P):o.matrix_world=rack_transform@o.matrix_world
 inside=bpy.data.collections.get('Architecture Interior Receivers')
 if inside:
  for o in bpy.data.objects:
   if o.name.startswith(P) and o.name not in inside.objects:inside.objects.link(o)
 bpy.context.view_layer.update()
