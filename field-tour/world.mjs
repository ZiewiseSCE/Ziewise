import * as T from '../ai-briefing/vendor/three.module.min.js';
import {buildArchitecture} from './architecture.mjs';
import {buildFactory} from './factory.mjs';
import {buildOffice} from './office.mjs';
import {dressInspection} from './cell-details.mjs';
import {applyFinishes} from './finishes.mjs';
import {batchStatic} from './batch.mjs';
import {byId,stops} from './route.mjs';

const clamp=T.MathUtils.clamp, lerp=T.MathUtils.lerp;
const v=(x,y,z)=>new T.Vector3(x,y,z);
const smooth=(a,b,x)=>T.MathUtils.smoothstep(x,a,b);
function terminal(s) { return v(s.side*.58,1.64,s.z-.82); }
const centerX=3.55;

async function lightProbe(renderer, scene) {
  const url=new URL('./machine-shop-rgbe.png',import.meta.url);
  const response=await fetch(url);
  if(!response.ok)throw new Error('Workshop lighting unavailable');
  const source=await createImageBitmap(await response.blob(),{premultiplyAlpha:'none',colorSpaceConversion:'none'});
  const c=document.createElement('canvas');c.width=source.width;c.height=source.height;
  const context=c.getContext('2d',{willReadFrequently:true});
  context.drawImage(source,0,0);source.close();
  const bytes=context.getImageData(0,0,c.width,c.height).data, pixels=new Uint16Array(bytes.length);
  const exponent=Array.from({length:256},(_,e)=>2**(e-136));
  for(let i=0;i<bytes.length;i+=4) {
    const scale=exponent[bytes[i+3]];
    for(let k=0;k<3;k++)pixels[i+k]=T.DataUtils.toHalfFloat(Math.min(30000,bytes[i+k]*scale));
    pixels[i+3]=15360;
  }
  const sourceTexture=new T.DataTexture(pixels,c.width,c.height,T.RGBAFormat,T.HalfFloatType);
  sourceTexture.mapping=T.EquirectangularReflectionMapping;sourceTexture.flipY=true;sourceTexture.needsUpdate=true;
  const generator=new T.PMREMGenerator(renderer),target=generator.fromEquirectangular(sourceTexture);
  scene.environment=target.texture;scene.environmentIntensity=.61;
  scene.environmentRotation.y=1.45;
  sourceTexture.dispose();generator.dispose();
  return target;
}

function contactShade() {
  const c=document.createElement('canvas');c.width=c.height=96;
  const ctx=c.getContext('2d'),grad=ctx.createRadialGradient(48,48,5,48,48,48);
  grad.addColorStop(0,'rgba(15,17,16,.52)');grad.addColorStop(.52,'rgba(14,17,17,.32)');grad.addColorStop(1,'rgba(14,17,17,0)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,96,96);
  return new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,toneMapped:false});
}

function pathFor(s,prev,entryOnly,close) {
  const side=s.side,z=s.z;
  const direct=close&&(entryOnly||!prev);
  const start=prev&&!entryOnly?terminal(prev):direct?v(side*1.21,1.76,z+.86):v(-side*.57,1.68,z+(s.id==='design'?3.85:3.6));
  const distance=Math.abs(start.z-z);
  const curve=(...points)=>new T.CatmullRomCurve3(points,false,'centripetal');
  // The first rail is the aisle traversal, the second is the camera operator's move around a machine.
  const arrival=direct?v(side*1.40,1.68,z+.38):v(side*.46,1.60,z+1.56);
  const travel=direct?curve(start,v(side*1.27,1.75,z+.75),v(side*1.36,1.71,z+.54),arrival):
    curve(start,v(lerp(start.x,-side*.33,.68),1.71,lerp(start.z,z+2.22,.44)),v(-side*.12,1.68,z+2.22),arrival);
  const lenses={arc:50,lean:44,track:48,wide:57};
  const shoulder=s.shot==='wide'?.58:s.shot==='lean'?1.55:1.27;
  const inspect=close?curve(arrival,v(side*1.39,1.73,z+.52),v(side*1.62,1.66,z-.03),v(side*1.47,1.55,z-.7),v(side*.94,1.65,z-1.08),terminal(s)):
    curve(arrival,v(side*(shoulder-.33),1.60,z+1.27),v(side*shoulder,s.shot==='lean'?1.42:1.62,z+.36),v(side*(shoulder+.08),s.shot==='arc'?1.48:1.57,z-.68),v(side*.9,1.64,z-1.30),terminal(s));
  return {travel,inspect,lens:close?Math.max(40,lenses[s.shot]-4):lenses[s.shot],distance,direct,gate:direct?.18:distance>8?.38:s.id==='design'?.24:.27};
}

export function createWorld(canvas,{capture=false,onLoss=()=>{}}={}) {
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:capture});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.91;
  const mobile=matchMedia('(max-width:720px)').matches;
  let pixelRatio=capture?1:Math.min(devicePixelRatio,mobile?1.26:1.5);
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  const scene=new T.Scene();scene.background=new T.Color(0xa4b6bb);scene.fog=new T.FogExp2(0xa8b8b8,.013);
  const camera=new T.PerspectiveCamera(61,1,.075,160);camera.rotation.order='YXZ';
  const hemisphere=new T.HemisphereLight(0xdce9f4,0x8b775b,.91);
  scene.add(hemisphere);
  const key=new T.DirectionalLight(0xffe1ad,3.05);key.castShadow=true;
  key.shadow.mapSize.set(mobile?512:1024,mobile?512:1024);
  Object.assign(key.shadow.camera,{left:-8.5,right:8.5,top:7,bottom:-7,near:.2,far:35});
  key.shadow.camera.updateProjectionMatrix();key.shadow.bias=-.00042;key.shadow.normalBias=.022;
  scene.add(key,key.target);
  const fill=new T.DirectionalLight(0xc8dff5,.58);fill.position.set(-3,3.2,4.6);scene.add(fill);
  const shell=buildArchitecture(T);
  const cells=shell.children.filter(node=>node.userData.batchCell);
  for(const part of cells)batchStatic(T,part);
  scene.add(shell);
  const pool=new Map(),shadowMat=contactShade(),shadowGeo=new T.PlaneGeometry(4.5,3.8);
  function station(id) {
    if(pool.has(id))return pool.get(id);
    const spec=byId.get(id),asset=spec.index<7?buildFactory(T,id):buildOffice(T,id);
    if(id==='design')dressInspection(T,asset.group);
    batchStatic(T,asset.group);
    const shade=new T.Mesh(shadowGeo,shadowMat);shade.rotation.x=-Math.PI/2;shade.position.set(0,.025,-.05);asset.group.add(shade);
    asset.group.position.set(spec.side*centerX,0,spec.z);asset.group.rotation.y=-spec.side*Math.PI/2;
    scene.add(asset.group);asset.group.updateMatrixWorld(true);
    asset.anchors=asset.anchors.map(a=>asset.group.localToWorld(a.clone()));
    pool.set(id,asset);return asset;
  }
  let q=0;const workQueue=[];
  function prepare(ids) {
    for(const id of ids)if(!pool.has(id)&&!workQueue.includes(id))workQueue.push(id);
    function next(deadline) {
      q=0;let count=0;
      while(workQueue.length && count<1 && (deadline.didTimeout||deadline.timeRemaining()>4)) {
        station(workQueue.shift());count++;
      }
      if(workQueue.length)schedule();
    }
    function schedule(){if(q||!workQueue.length)return;q=window.requestIdleCallback?requestIdleCallback(next,{timeout:230}):setTimeout(()=>next({didTimeout:true}),50);}
    schedule();
  }
  let width=0,height=0,viewDistance=mobile?22:29;
  function resize() {
    const w=Math.max(1,Math.round(canvas.clientWidth)),h=Math.max(1,Math.round(canvas.clientHeight));
    if(w===width&&h===height)return;
    width=w;height=h;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
  }
  let lightZ=Infinity;
  function showNearby(z,activeId) {
    for(const [id,asset] of pool)asset.group.visible=id===activeId||Math.abs(byId.get(id).z-z)<viewDistance;
    if(Math.abs(lightZ-z)>.55){lightZ=z;key.position.set(8.1,6.32,z-5.3);key.target.position.set(-1.2,.15,z+1.7);}
  }
  const paths=new Map(),cameraPos=v(0,0,0),target=v(0,0,0),aux=v(0,0,0),projected=v(0,0,0);
  let announced='',ready=true,lookSide=0,lookUp=0;
  const lighting=Promise.all([lightProbe(renderer,scene).catch(()=>null),applyFinishes(T,scene,shell,camera)]);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;onLoss();});
  function finish(fov,offset) {
    if(Math.abs(camera.fov-fov)>.03||camera.filmOffset!==offset){
      camera.fov=fov;camera.filmOffset=offset;camera.updateProjectionMatrix();
    }
    renderer.render(scene,camera);
  }
  function draw({id,previous=null,p=0,phase=0,cuts=[.39,.73],entryOnly=false,close=false,reduced=false,lean=false,peek=[0,0]}) {
    if(!ready)return null;
    resize();const s=byId.get(id),a=station(id),prior=byId.get(previous);
    if(announced!==id) {
      if(announced)pool.get(announced)?.update(1,0);announced=id;
      prepare(stops.filter(n=>Math.abs(n.z-s.z)<13).sort((u,w)=>Math.abs(u.z-s.z)-Math.abs(w.z-s.z)).map(n=>n.id));
    }
    const pathKey=id+'/'+(previous||'')+'/'+entryOnly+'/'+close;
    if(!paths.has(pathKey))paths.set(pathKey,pathFor(s,prior,entryOnly,close));
    const path=paths.get(pathKey),g=path.gate;
    const visualP=reduced?.51:p;
    const trans=Math.min(1,visualP/g);
    if(visualP<g) {
      const eased=trans*trans*(3-2*trans)*.65+trans*.35;
      path.travel.getPointAt(eased,cameraPos);
    } else path.inspect.getPointAt((visualP-g)/(1-g),cameraPos);
    const hold=v(s.side*(centerX-.16),1.38,s.z);
    target.copy(a.anchors[0]);
    const toModel=smooth(cuts[0]-.07,cuts[0]+.055,p),toDecision=smooth(cuts[1]-.065,cuts[1]+.05,p);
    target.lerp(a.anchors[1],toModel).lerp(a.anchors[2],toDecision);
    target.lerp(hold,reduced?.25:lerp(path.direct?.13:close?.45:.72,.08,smooth(.06,.57,p)));
    if(visualP<g && prior && !entryOnly) {
      const old=station(prior.id);
      const oldLook=old.anchors[2].clone().lerp(v(prior.side*(centerX-.16),1.38,prior.z),.08);
      const forward=aux.set(cameraPos.x*.65,1.60,cameraPos.z-5.2);
      const blend=target.clone();
      target.copy(oldLook).lerp(forward,smooth(0,.48,trans)).lerp(blend,smooth(.28,1,trans));
    }
    if(lean){cameraPos.lerp(v(s.side*1.66,1.47,target.z+.15),.68);target.copy(a.anchors[phase]);}
    camera.position.copy(cameraPos);camera.lookAt(target);
    const moving=!reduced&&visualP<g;
    camera.rotateZ(moving?Math.sin(trans*Math.PI*2)*s.side*.0085:0);
    lookSide=lerp(lookSide,peek[0],.26);lookUp=lerp(lookUp,peek[1],.26);
    camera.rotateY(lookSide);camera.rotateX(lookUp);
    const speedLens=moving?Math.sin(trans*Math.PI)*(path.distance>8?9:4):0;
    const lens=reduced?54:lerp(path.direct?49:62,path.lens,smooth(.12,.61,p))+speedLens+smooth(.77,1,p)*(60-path.lens);
    a.update(p,p*20);showNearby(camera.position.z,id);
    const screenOffset=camera.aspect>1.25?(close?-1.65:-3.9):0;
    finish(lean?Math.min(lens,42):lens,screenOffset);
    projected.copy(a.anchors[phase]).project(camera);
    return {x:projected.x*.5+.5,y:.5-projected.y*.5,visible:projected.z>0&&projected.z<1&&p>(entryOnly?.06:g*.75),z:camera.position.z};
  }
  const keys=new Set(),manual={x:0,z:7,yaw:0,pitch:0};
  function startManual() {
    const e=new T.Euler().setFromQuaternion(camera.quaternion,'YXZ');
    Object.assign(manual,{x:clamp(camera.position.x,-1.55,1.55),z:clamp(camera.position.z,-48.3,9.7),yaw:e.y,pitch:clamp(e.x,-.83,.75)});
    keys.clear();
  }
  function rotate(dx,dy){manual.yaw-=dx*.0041;manual.pitch=clamp(manual.pitch-dy*.0035,-.9,.79);}
  function stepManual(dt) {
    if(!ready)return manual;
    resize();manual.yaw+=((keys.has('turnleft')?1:0)-(keys.has('turnright')?1:0))*dt*1.48;
    const ahead=(keys.has('forward')?1:0)-(keys.has('back')?1:0),across=(keys.has('right')?1:0)-(keys.has('left')?1:0);
    const speed=dt*2.65/Math.max(1,Math.hypot(ahead,across)),si=Math.sin(manual.yaw),co=Math.cos(manual.yaw);
    manual.x=clamp(manual.x+(co*across-si*ahead)*speed,-1.58,1.58);
    manual.z=clamp(manual.z+(-co*ahead-si*across)*speed,-48.3,9.7);
    const nearest=[...byId.values()].reduce((a,b)=>Math.abs(b.z-manual.z)<Math.abs(a.z-manual.z)?b:a);
    if(!pool.has(nearest.id))station(nearest.id);
    prepare(stops.filter(s=>Math.abs(s.z-manual.z)<11).map(s=>s.id));
    camera.position.set(manual.x,1.68,manual.z);camera.rotation.set(manual.pitch,manual.yaw,0,'YXZ');
    showNearby(manual.z,nearest.id);finish(64,0);
    return {...manual,nearest:nearest.id};
  }
  function lighten() {
    pixelRatio=Math.max(.65,pixelRatio*.78);renderer.setPixelRatio(pixelRatio);width=0;
    viewDistance=19;
    if(pixelRatio<1)renderer.shadowMap.enabled=false;
  }
  return {draw,lighting,prepare,rotate,startManual,stepManual,keys,lighten,resize,
    get pose(){return camera.position.toArray();},
    stats:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,stations:pool.size})};
}
