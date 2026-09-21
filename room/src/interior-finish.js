import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

const woodNames = /^(DeskWood|Clay shelf oak|Honey clay)$/;
const textileNames = /ChairBlue|DeskMatMat|ChairMatOrangeFuzz|cloth|leather|DeskBook/i;

// Clone finishes at the interior boundary: no shared exterior material changes.
export function finishInteriorMaterials(root, isExterior) {
  const clones = new Map();
  root.traverse((object) => {
    if (!object.isMesh || isExterior(object) || object.name === 'WindowGlass' || object.name === 'MonitorScreen') return;
    const finish = (source) => {
      if (clones.has(source)) return clones.get(source);
      const m = source.clone(); clones.set(source, m);
      if (!m.isMeshStandardMaterial) return m;
      if (woodNames.test(source.name)) {
        m.roughness = .58; m.metalness = 0;
        // Quiet, fine grain replaces the broad cartoon wood bands on the desk.
        m.map = null; m.normalMap = null; m.color.setRGB(.34, .205, .105);
      } else if (/MonitorShell|MonitorStand|PropDark|ServerRackFrame|ServerRackUnit/.test(source.name)) {
        m.roughness = .42; m.metalness = .25;
      } else if (/CoffeeMug|stoneware|porcelain/i.test(source.name)) {
        m.roughness = .30; m.metalness = 0;
      } else if (/iPad/i.test(source.name)) {
        m.roughness = .38; m.metalness = .7; m.color.set(0xa9abb0);
      } else if (textileNames.test(source.name)) {
        m.roughness = .94; m.metalness = 0;
      }
      if (/StringLightBulbGlow/.test(source.name)) {
        m.emissive.set(0xffd6a0);m.emissiveIntensity = 1.8;
      }
      const wood = woodNames.test(source.name);
      const fabric = textileNames.test(source.name);
      const plaster = /Wall|plaster|Architectural.*paint/i.test(source.name);
      if (wood || fabric || plaster) {
        m.onBeforeCompile = (shader) => {
          shader.vertexShader = 'varying vec3 finishPosition;\n'+shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nfinishPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;');
          shader.fragmentShader = 'varying vec3 finishPosition;\n'+shader.fragmentShader;
          const grain = wood
            ? 'float grain = sin(finishPosition.z*380.0 + sin(finishPosition.x*1.3+finishPosition.z*6.0)*9.0 + sin(finishPosition.z*58.0)*3.0); diffuseColor.rgb *= .98 + .02*grain;'
            : fabric
              ? 'float grain = sin(finishPosition.x*850.0)*sin(finishPosition.z*850.0); diffuseColor.rgb *= .98 + .02*grain;'
              : 'float grain = sin(finishPosition.x*41.0+finishPosition.z*29.0)*sin(finishPosition.y*53.0); diffuseColor.rgb *= .986 + .014*grain;';
          shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n'+grain);
          shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + grain*0.025, 0.2, 1.0);');
        };
        m.customProgramCacheKey = () => `interior-finish-${wood}-${fabric}-${plaster}`;
      }
      return m;
    };
    object.material = Array.isArray(object.material) ? object.material.map(finish) : finish(object.material);
  });
}

export function finishMonitor(material) {
  material.color.set(0x82919f);
  material.emissive.set(0xd6dbe0);
  material.roughness=.42;material.metalness=0;material.envMapIntensity=.18;
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb = max(diffuseColor.rgb, vec3(.024, .028, .036));');
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance = vec3(.012, .015, .021) + totalEmissiveRadiance;');
  };
  material.customProgramCacheKey=()=> 'charcoal-monitor-glass';
}

function bounds(root,name) {
  const object=root.getObjectByName(name);
  return object ? new THREE.Box3().setFromObject(object) : null;
}

export function addInteriorBounce(scene, root) {
  RectAreaLightUniformsLib.init();
  const area=(color,power,w,h,position,target)=>{
    const light=new THREE.RectAreaLight(color,power,w,h);
    light.position.copy(position);light.lookAt(target);light.layers.set(0);scene.add(light);
  };
  const shelf=bounds(root,'LibraryWarmStrip');
  if(shelf){
    const c=shelf.getCenter(new THREE.Vector3());
    area(0xffbd82,3.0,4.8,.12,c.clone().add(new THREE.Vector3(0,-.045,.035)),c.clone().add(new THREE.Vector3(0,-.8,.65)));
  }
  const desk=bounds(root,'DeskTop');
  if(desk){
    const c=desk.getCenter(new THREE.Vector3());
    // Broad reflected light off the desktop; no global ambient increase.
    area(0xffd2a0,1.6,2.1,.65,c.clone().add(new THREE.Vector3(0,.18,0)),c.clone().add(new THREE.Vector3(0,1.1,.35)));
    area(0xffc68d,2.2,1.25,.06,new THREE.Vector3(0,1.00,.36),new THREE.Vector3(0,.83,-.05));
  }
  const window=bounds(root,'WindowGlass');
  if(window){
    const c=window.getCenter(new THREE.Vector3());
    area(0xa9c3e6,.6,1.6,1.7,c.clone().add(new THREE.Vector3(.04,0,0)),c.clone().add(new THREE.Vector3(3,-.15,0)));
  }
}

export function addWindowReflection(scene,root) {
  const old=root.getObjectByName('WindowGlass');
  if(!old)return null;
  const b=new THREE.Box3().setFromObject(old),c=b.getCenter(new THREE.Vector3()),s=b.getSize(new THREE.Vector3());
  // Retain the same clear glazing; add only a faint interior reflection.
  const reflector=new Reflector(new THREE.PlaneGeometry(s.z,s.y),{textureWidth:512,textureHeight:512,multisample:0,clipBias:.002});
  reflector.name='InteriorWindowReflection';reflector.position.copy(c);reflector.position.x+=.007;
  reflector.rotation.y=Math.PI/2;reflector.layers.set(0);reflector.camera.layers.set(0);
  const m=reflector.material;m.transparent=true;m.depthWrite=false;m.blending=THREE.NormalBlending;
  m.vertexShader=m.vertexShader.replace('varying vec4 vUv;', 'varying vec4 vUv; varying vec3 worldPoint; varying vec3 worldNormal;').replace('vUv = textureMatrix * vec4( position, 1.0 );','vUv = textureMatrix * vec4( position, 1.0 ); worldPoint=(modelMatrix*vec4(position,1.0)).xyz; worldNormal=normalize(mat3(modelMatrix)*vec3(0.,0.,1.));');
  m.fragmentShader=`uniform sampler2D tDiffuse; varying vec4 vUv; varying vec3 worldPoint; varying vec3 worldNormal;
  void main(){
    vec2 uv=vUv.xy/vUv.w;
    vec3 base=(texture2D(tDiffuse,uv).rgb*2.0+texture2D(tDiffuse,uv+vec2(.001,0.)).rgb+texture2D(tDiffuse,uv-vec2(.001,0.)).rgb)*.25;
    float facing=abs(dot(normalize(cameraPosition-worldPoint),normalize(worldNormal)));
    float alpha=.010+.055*pow(1.0-facing,3.0);
    gl_FragColor=vec4(base,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
  scene.add(reflector);return reflector;
}

// GTAO uses only the room's normal/depth buffer. The sky and Oxford never enter
// the pass, and its overlay is exactly transparent where no interior exists.
export class InteriorContactShadows {
  constructor(scene,camera,focusObject) {
    this.scene=scene;this.camera=camera;this.focusObject=focusObject;this.frame=null;
    this.pass=new GTAOPass(scene,camera,640,360,undefined,{radius:.14,thickness:.045,distanceFallOff:1,scale:1,samples:8},{radius:3,samples:8});
    this.pass.output=GTAOPass.OUTPUT.Off;
    this.material=new THREE.ShaderMaterial({
      uniforms:{ao:{value:this.pass.gtaoMap},depth:{value:this.pass.depthTexture},frame:{value:null},pixel:{value:new THREE.Vector2()},near:{value:camera.near},far:{value:camera.far},focus:{value:3}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:`
        #include <packing>
        uniform sampler2D ao;uniform sampler2D depth;uniform sampler2D frame;
        uniform vec2 pixel;uniform float near;uniform float far;uniform float focus;
        varying vec2 vUv;
        void main(){
          float d=texture2D(depth,vUv).r;if(d>.99999)discard;
          float z=-perspectiveDepthToViewZ(d,near,far);
          float radius=clamp(abs(z-focus)/max(focus,.1)*.7,0.,.65);
          vec3 base=texture2D(frame,vUv).rgb;vec3 color=base;float weight=1.;vec3 halo=vec3(0.);
          for(int i=0;i<8;i++){
            float angle=float(i)*.78539816;vec2 axis=vec2(cos(angle),sin(angle));
            vec2 uv=vUv+pixel*axis*radius;
            float sd=texture2D(depth,uv).r;float sz=-perspectiveDepthToViewZ(sd,near,far);
            float w=sd<.99999? .10*exp(-abs(sz-z)*30.):0.;
            color+=texture2D(frame,uv).rgb*w;weight+=w;
            vec2 glowUv=vUv+pixel*axis*3.;
            if(texture2D(depth,glowUv).r<.99999){
              vec3 glow=texture2D(frame,glowUv).rgb;
              halo+=max(glow-vec3(.93),vec3(0.))*.025;
            }
          }
          float a=texture2D(ao,vUv).r;
          color=color/weight*(1.-min(.25,(1.-a)*.36))+halo;
          gl_FragColor=vec4(color,1.);
        }`,
      transparent:true,depthTest:false,depthWrite:false,toneMapped:false,
    });
    this.quad=new FullScreenQuad(this.material);this.hidden=[];
    scene.traverse(o=>{if(o.isMesh&&(o.isReflector||(Array.isArray(o.material)?o.material.some(m=>m.transparent):o.material.transparent)))this.hidden.push(o);});
  }
  render(renderer,width,height) {
    const scale=Math.min(.65,960/width),w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale));
    if(this.pass.width!==w||this.pass.height!==h)this.pass.setSize(w,h);
    const visible=this.hidden.map(o=>o.visible),oldTarget=renderer.getRenderTarget(),shadowUpdate=renderer.shadowMap.autoUpdate;
    this.hidden.forEach(o=>o.visible=false);renderer.shadowMap.autoUpdate=false;
    try{this.pass.render(renderer,null,null);}finally{this.hidden.forEach((o,i)=>o.visible=visible[i]);renderer.shadowMap.autoUpdate=shadowUpdate;renderer.setRenderTarget(oldTarget);}
    const size=renderer.getDrawingBufferSize(new THREE.Vector2());
    if(!this.frame||this.frame.image.width!==size.x||this.frame.image.height!==size.y){
      this.frame?.dispose();this.frame=new THREE.FramebufferTexture(size.x,size.y);
      this.frame.minFilter=this.frame.magFilter=THREE.LinearFilter;
      this.material.uniforms.frame.value=this.frame;
    }
    renderer.copyFramebufferToTexture(this.frame);
    this.material.uniforms.pixel.value.set(1/size.x,1/size.y);
    if(this.focusObject){
      const target=new THREE.Box3().setFromObject(this.focusObject).getCenter(new THREE.Vector3()).applyMatrix4(this.camera.matrixWorldInverse);
      this.material.uniforms.focus.value=Math.max(.5,-target.z);
    }
    this.quad.render(renderer);
  }
}
