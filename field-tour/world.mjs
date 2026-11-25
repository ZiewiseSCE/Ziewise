import * as T from '../ai-briefing/vendor/three.module.min.js';
import {buildArchitecture} from './architecture.mjs?v=motion1';
import {buildFactory} from './factory.mjs?v=solid1';
import {buildWorkspace} from './workspaces/office-station.mjs';
import {buildZieview} from './zieview/model/zieview.mjs';
import {buildControlDisplay} from './control-display.mjs';
import {cameraRail} from './rails.mjs';
import {frameConnection,buildConnectionPath} from './connection-view.mjs';
import {dressServices} from './services.mjs';
import {loadDaylight} from './daylight.mjs';
import {dressInspection} from './cell-details.mjs';
import {applyFinishes} from './finishes.mjs?v=motion1';
import {placeEquipment} from './equipment.mjs?v=motion1';
import {createOptics} from './optics.mjs?v=motion1';
import {replaceInspectionRobot} from './robot/inspection-robot.mjs';
import {applyMachining} from './machining/machining.mjs?v=motion1';
import {replaceSafetyWorker} from './safety/safety-worker.mjs';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {batchStatic} from './batch.mjs';
import {byId,stops} from './route.mjs?v=solid1';
import {buildIndustryB} from './chapters/industry-b/industry-b.mjs';

const clamp=T.MathUtils.clamp, lerp=T.MathUtils.lerp;
const v=(x,y,z)=>new T.Vector3(x,y,z);
const smooth=(a,b,x)=>T.MathUtils.smoothstep(x,a,b);
const centerX=3.55;

import {lightProbe} from './environment.mjs?v=motion1';

function localReflections(renderer){
  const probes=new Map();
  const factory=new Set(['cold turned stainless / face','cold turned stainless / inspection sample','circumferential sleeve',
    'polished turning chamfer','bored steel','spun aluminium tube','blast-finished aluminium housings','multi-coated lens','UR blue joint covers']);
  function apply(type,group){
    if(!probes.has(type))probes.set(type,lightProbe(renderer,'./finishes/'+type+'-local-rgbe.png').catch(()=>null));
    return probes.get(type).then(target=>{
      if(!target)return;
      group.traverse(mesh=>{
        const m=mesh.material;if(!m||Array.isArray(m)||!m.isMeshStandardMaterial)return;
        const chosen=type==='inspection'?factory.has(m.name):type==='safety'?
          m.metalness>.50||m.clearcoat>.32||/optic|lens|dome/i.test(m.name):m.metalness>.52||m.clearcoat>.40;
        if(!chosen||m.envMap===target.texture)return;
        m.envMap=target.texture;m.envMapRotation.set(0,0,0);m.needsUpdate=true;
      });
    });
  }
  return {apply};
}

function contactShade() {
  const c=document.createElement('canvas');c.width=c.height=96;
  const ctx=c.getContext('2d'),grad=ctx.createRadialGradient(48,48,5,48,48,48);
  grad.addColorStop(0,'rgba(15,17,16,.52)');grad.addColorStop(.52,'rgba(14,17,17,.32)');grad.addColorStop(1,'rgba(14,17,17,0)');
  ctx.fillStyle=grad;ctx.fillRect(0,0,96,96);
  return new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,toneMapped:false});
}

export function createWorld(canvas,{capture=false,onLoss=()=>{},onInvalidate=()=>{}}={}) {
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:capture});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;
  const mobile=!capture&&matchMedia('(max-width:720px)').matches;
  let quality=1,shadowDirty=true,lastShadow=-Infinity;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.shadowMap.autoUpdate=capture;
  const scene=new T.Scene();scene.background=new T.Color(0xbfc8cb);scene.fog=new T.FogExp2(0xc5cbd0,.009);
  const camera=new T.PerspectiveCamera(61,1,.075,160);camera.rotation.order='YXZ';
  const hemisphere=new T.HemisphereLight(0xdce9f4,0x8b775b,.91);
  scene.add(hemisphere);
  const key=new T.DirectionalLight(0xffe1ad,3.05);key.castShadow=true;
  const shadowSize=capture?2048:mobile?768:1024;
  key.shadow.mapSize.set(shadowSize,shadowSize);key.shadow.radius=2.05;
  Object.assign(key.shadow.camera,{left:-8.5,right:8.5,top:7,bottom:-7,near:.2,far:35});
  key.shadow.camera.updateProjectionMatrix();key.shadow.bias=-.00028;key.shadow.normalBias=.015;
  scene.add(key,key.target);
  const fill=new T.DirectionalLight(0xc8dff5,.58);fill.position.set(-3,3.2,4.6);scene.add(fill);
  const taskLight=new T.SpotLight(0xfff0d9,26,4.4,.63,.65,2);
  taskLight.position.set(3.32,2.53,4.22);taskLight.target.position.set(3.07,.99,3.57);scene.add(taskLight,taskLight.target);
  const shell=buildArchitecture(T,{scannedSurfaces:true});dressServices(T,shell);
  const cells=shell.children.filter(node=>node.userData.batchCell);
  for(const part of cells)batchStatic(T,part);
  scene.add(shell);
  shell.updateMatrixWorld(true);
  shell.traverse(node=>{node.matrixAutoUpdate=false;node.matrixWorldAutoUpdate=false;});
  const primed=new WeakMap();
  const equipment=placeEquipment(T,scene,batchStatic,{capture,prepareModel:primeSurfaces,onChange(){shadowDirty=true;if(ready)onInvalidate();}});
  const reflections=localReflections(renderer);
  let optics=createOptics(T,renderer,{mobile,capture}),lastFrame={calls:0,triangles:0};
  const indirect=loadDaylight(T).catch(()=>()=>{});
  let provider='local',feed=null,feedTick=0,lastFeed=-Infinity;
  const securityEye=new T.PerspectiveCamera(58,2.07,.08,48);securityEye.position.set(-5.22,2.77,-6.33);securityEye.lookAt(-3.31,.91,-7.94);
  const pool=new Map(),shadowMat=contactShade(),shadowGeo=new T.PlaneGeometry(4.5,3.8);
  const parallelCompile=!capture&&renderer.extensions.has('KHR_parallel_shader_compile');
  function warmMaterials(group){
    if(!ready||!parallelCompile)return;
    return (optics?optics.compile(group,camera,scene):renderer.compileAsync(group,camera,scene)).catch(()=>{});
  }
  function station(id) {
    if(pool.has(id))return pool.get(id);
    const spec=byId.get(id),facility=id==='observer'||id==='print';
    const asset=facility?buildIndustryB(T,id):spec.index<7?buildFactory(T,id):buildWorkspace(T,id);
    const resources=asset.ready?[asset.ready]:[];
    if(facility){
      const fixture=new T.Group();fixture.add(...asset.equipment);asset.group=fixture;resources.push(asset.ready);
    }
    if(id==='design'){
      dressInspection(T,asset.group);
      const robot=replaceInspectionRobot(T,asset.group,{batchStatic}),run=asset.update;
      asset.update=(p,time)=>{run(p,time);robot.update(p,time);};
      asset.anchors[1].copy(robot.opticalAnchor);resources.push(robot.ready);
    }
    if(id==='design'||id==='vision')resources.push(applyMachining(T,asset.group).ready);
    if(id==='safety'){
      const tripod=buildZieview(T,{mount:'tripod'}),magnet=buildZieview(T,{mount:'magnet'}),console=buildControlDisplay(T);
      tripod.group.position.set(.37,0,.52);magnet.group.position.set(-1.26,0,-.54);console.group.position.set(1.23,0,-.28);
      asset.group.add(tripod.group,magnet.group,console.group);asset.console=console;
      asset.anchors=[v(.36,1.41,.53),v(-1.25,1.44,-.43),v(1.23,1.45,-.23)];
      resources.push(tripod.ready,magnet.ready,console.ready);
      const operator=replaceSafetyWorker(T,asset.group,new GLTFLoader()),run=asset.update;
      asset.update=(p,time)=>{run(p,time);operator.update(p);};resources.push(operator.ready);
    }
    if(id==='knowledge'){asset.setProvider?.(provider);asset.connectionPath=buildConnectionPath(T,asset.group);}
    asset.detailed=false;
    asset.ready=Promise.all([lighting,equipment.near(spec.z),...resources]).then(results=>{
      if(results.includes(false))return false;
      indirect.then(apply=>apply(asset.group));
      if(id==='design'||id==='vision')return reflections.apply('inspection',asset.group);
      if(id==='safety')return reflections.apply('safety',asset.group);
      if(spec.index>=7)return reflections.apply('desk',asset.group);
    }).then(async result=>{
      if(result===false||!ready)return false;
      await Promise.all([warmMaterials(asset.group),primeSurfaces(asset.group)]);
      if(!ready)return false;
      asset.detailed=true;shadowDirty=true;onInvalidate();return true;
    }).catch(()=>false);
    batchStatic(T,asset.group);
    const shade=new T.Mesh(shadowGeo,shadowMat);shade.rotation.x=-Math.PI/2;shade.position.set(0,.025,-.05);asset.group.add(shade);
    asset.group.position.set(spec.side*centerX,0,spec.z);asset.group.rotation.y=-spec.side*Math.PI/2;
    asset.group.visible=capture;scene.add(asset.group);asset.group.updateMatrixWorld(true);
    asset.anchors=asset.anchors.map(a=>asset.group.localToWorld(a.clone()));
    pool.set(id,asset);return asset;
  }
  let q=0,preparing=false;const workQueue=[];
  function clearPreparation(){
    workQueue.length=0;
    if(q){if(window.cancelIdleCallback)cancelIdleCallback(q);else clearTimeout(q);q=0;}
  }
  function prepare(ids) {
    for(const id of ids)if(!pool.has(id)&&!workQueue.includes(id))workQueue.push(id);
    function next(deadline) {
      q=0;
      if(workQueue.length && (deadline.didTimeout||deadline.timeRemaining()>5)) {
        const id=workQueue.shift();
        if(!pool.has(id)){
          preparing=true;
          station(id).ready.finally(()=>{preparing=false;if(ready)schedule();});
          return;
        }
      }
      if(workQueue.length)schedule();
    }
    function schedule(){if(q||preparing||!workQueue.length)return;q=window.requestIdleCallback?requestIdleCallback(next,{timeout:750}):setTimeout(()=>next({didTimeout:true}),80);}
    schedule();
  }
  let width=0,height=0,sizeDirty=true,viewDistance=capture?29:mobile?16:21;
  const sizeObserver=new ResizeObserver(()=>{sizeDirty=true;if(ready)onInvalidate();});
  sizeObserver.observe(canvas);
  function resize() {
    if(!sizeDirty&&!capture)return;
    sizeDirty=false;
    const w=Math.max(1,Math.round(canvas.clientWidth)),h=Math.max(1,Math.round(canvas.clientHeight));
    const budget=mobile?1000000:1600000;
    const ratio=capture?1:quality*Math.min(devicePixelRatio,mobile?1.26:1.5,Math.sqrt(budget/(w*h)));
    if(w===width&&h===height&&renderer.getPixelRatio()===ratio)return;
    width=w;height=h;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setDrawingBufferSize(w,h,ratio);
  }
  let lightZ=Infinity;
  const workshopDaylight=new T.Color(0xffe1ad),officeDaylight=new T.Color(0xffedda);
  function showNearby(z,activeId) {
    for(const [id,asset] of pool)asset.group.visible=(capture||asset.detailed)&&(id===activeId||Math.abs(byId.get(id).z-z)<viewDistance);
    // The inspection lamp already has a physical cutoff. Keeping it in the light list
    // avoids recompiling every visible surface when crossing into the office wing.
    equipment.visibleFrom(z,viewDistance);
    if(Math.abs(lightZ-z)>.55){
      lightZ=z;shadowDirty=true;key.position.set(8.1,6.32,z-5.3);key.target.position.set(-1.2,.15,z+1.7);
      const office=1-smooth(-26,-20.5,z);
      key.color.copy(workshopDaylight).lerp(officeDaylight,office);key.intensity=lerp(3.28,2.86,office);
      fill.intensity=lerp(.32,.38,office);hemisphere.intensity=lerp(.29,.37,office);
    }
  }
  const paths=new Map(),cameraPos=v(0,0,0),target=v(0,0,0),aux=v(0,0,0),projected=v(0,0,0),workCenter=v(0,0,0),task=v(0,0,0);
  let announced='',ready=true,lookSide=0,lookUp=0;
  async function primeSurfaces(group,visibleOnly=false){
    if(capture)return;
    const textures=new Set();
    const collect=node=>{
      if(!node.isMesh)return;
      const materials=Array.isArray(node.material)?node.material:[node.material];
      for(const m of materials){
        for(const map of [m.map,m.normalMap,m.roughnessMap,m.metalnessMap,m.aoMap,m.bumpMap,m.emissiveMap,m.alphaMap,m.anisotropyMap]){
          if(map&&!map.isRenderTargetTexture)textures.add(map);
        }
      }
    };
    if(visibleOnly)group.traverseVisible(collect);else group.traverse(collect);
    let start=performance.now();
    for(const map of textures){
      if(!ready)return;
      if(primed.get(map)===map.version)continue;
      if(map.image?.decode)await map.image.decode().catch(()=>{});
      if(!ready)return;
      renderer.initTexture(map);
      primed.set(map,map.version);
      if(performance.now()-start>7){
        await new Promise(resolve=>setTimeout(resolve,0));start=performance.now();
      }
    }
  }
  const lighting=Promise.all([lightProbe(renderer,'./machine-shop-rgbe.png').then(probe=>{
    scene.environment=probe.texture;scene.environmentIntensity=.61;scene.environmentRotation.y=1.45;return probe;
  }).catch(()=>null),applyFinishes(T,scene,shell).then(()=>indirect).then(apply=>apply(shell)).then(()=>primeSurfaces(shell,true))]);
  async function readyFor(ids){
    const all=Array.isArray(ids),requested=all?ids:[ids],selected=requested.map(station);
    const checks=await Promise.all([...(all?[equipment.ready]:[]),...selected.map(a=>a.ready)]);
    if(checks.includes(false))throw new Error('The requested facility model is unavailable');
    return true;
  }
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();if(ready){ready=false;onLoss();}});
  function finish(fov,offset,focusDistance=4,focusOnWork=false) {
    if(Math.abs(camera.fov-fov)>.03||camera.filmOffset!==offset){
      camera.fov=fov;camera.filmOffset=offset;camera.updateProjectionMatrix();
    }
    const now=performance.now();
    if(!capture&&(shadowDirty||now-lastShadow>=1000/24)){
      renderer.shadowMap.needsUpdate=true;shadowDirty=false;lastShadow=now;
    }
    if(optics)lastFrame=optics.render(scene,camera,focusDistance,focusOnWork);
    else{renderer.render(scene,camera);lastFrame={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}
  }
  function draw({id,previous=null,p=0,phase=0,cuts=[.39,.73],entryOnly=false,close=false,reduced=false,lean=false,peek=[0,0],connection=null}) {
    if(!ready)return null;
    resize();const s=byId.get(id),a=station(id),prior=byId.get(previous);
    if(announced!==id) {
      if(announced)pool.get(announced)?.update(1,0);announced=id;shadowDirty=true;
    }
    const pathKey=id+'/'+(previous||'')+'/'+entryOnly+'/'+close;
    if(!paths.has(pathKey))paths.set(pathKey,cameraRail(T,s,prior,entryOnly,close));
    const path=paths.get(pathKey),g=path.gate;
    const visualP=reduced?.52:p,trans=Math.min(1,visualP/g),moving=!reduced&&visualP<g;
    if(visualP<g){
      path.travel.getPointAt(trans*(.57+.43*trans*(3.-2.*trans)),cameraPos);
    }else{
      const phase2=clamp(cuts[1]+.085,g+.23,.91),phase1=clamp(cuts[0]+.065,g+.08,phase2-.08);
      const bounds=[g,phase1,phase2,1],n=visualP<phase1?0:visualP<phase2?1:2;
      const u=clamp((visualP-bounds[n])/(bounds[n+1]-bounds[n]),0,1);
      path.inspect.getPoint((n+u*(.65+.35*u*(3.-2.*u)))/3,cameraPos);
    }
    workCenter.set(s.side*(centerX-.04),1.29,s.z);
    target.copy(a.anchors[0]).lerp(a.anchors[1],smooth(cuts[0]-.105,cuts[0]+.085,visualP)).lerp(a.anchors[2],smooth(cuts[1]-.095,cuts[1]+.075,visualP));
    target.lerp(workCenter,.055+.16*(1.-smooth(.16,.61,visualP)));
    if(moving){
      task.copy(target);const along=aux.set(cameraPos.x*.53,1.55,cameraPos.z+path.direction*4.1);
      if(prior&&!entryOnly){
        const old=station(prior.id);target.copy(old.anchors[2]).lerp(along,smooth(0,.50,trans)).lerp(task,smooth(.23,.97,trans));
      }else if(close){target.copy(along).lerp(task,.38+.62*smooth(.02,.93,trans));}
    }
    if(lean){target.copy(a.anchors[phase]);cameraPos.lerp(aux.set(s.side*2.27,Math.max(1.22,target.y+.25),target.z+s.side*.32),.64);}
    const connectionZoom=id==='knowledge'&&connection?frameConnection(T,s,connection,cameraPos,target):0;
    a.connectionPath?.(connection?.to,reduced?0:connection?.time||0);
    camera.position.copy(cameraPos);camera.lookAt(target);
    if(moving)camera.rotateZ(Math.sin(trans*Math.PI*2)*s.side*(path.distance>5?.016:.009));
    lookSide=lerp(lookSide,peek[0],.26);lookUp=lerp(lookUp,peek[1],.26);camera.rotateY(lookSide);camera.rotateX(lookUp);
    const closeLens=s.id==='safety'?46:s.id==='systems'?51:s.shot==='lean'?47:52;
    const operatorLens=lerp(close?65:62,closeLens,smooth(.06,.53,visualP))+smooth(.82,1,visualP)*(60-closeLens);
    const lens=(reduced?54:operatorLens)+(moving?Math.sin(trans*Math.PI)*3:0)+(camera.aspect<.86?8:0);
    a.update(p,p*20);showNearby(camera.position.z,id);
    const now=performance.now();
    if(a.console&&p>.48&&(capture?++feedTick%9===1:now-lastFeed>=1000/15)){
      lastFeed=now;
      if(!feed){feed=new T.WebGLRenderTarget(512,248);feed.texture.colorSpace=T.SRGBColorSpace;}
      const priorTarget=renderer.getRenderTarget();a.console.group.visible=false;renderer.setRenderTarget(feed);
      renderer.render(scene,securityEye);renderer.setRenderTarget(priorTarget);a.console.group.visible=true;a.console.setFeed(feed.texture);
    }
    finish(lerp(lean?Math.min(lens,40):lens,39,connectionZoom),camera.aspect>1.24?(close?-.95:-2.4)*(1.-connectionZoom):0,camera.position.distanceTo(target),(close||lean)&&!moving);
    projected.copy(a.anchors[phase]).project(camera);
    return {x:projected.x*.5+.5,y:.5-projected.y*.5,visible:projected.z>0&&projected.z<1&&p>(entryOnly?.06:g*.75),z:camera.position.z};
  }
  const keys=new Set(),manual={x:0,z:7,yaw:0,pitch:0};
  let lastManualLoad=Infinity;
  function startManual() {
    const e=new T.Euler().setFromQuaternion(camera.quaternion,'YXZ');
    Object.assign(manual,{x:clamp(camera.position.x,-2.20,2.20),z:clamp(camera.position.z,-48.3,9.7),yaw:e.y,pitch:clamp(e.x,-.83,.75)});
    keys.clear();lastManualLoad=Infinity;
  }
  function rotate(dx,dy){manual.yaw-=dx*.0041;manual.pitch=clamp(manual.pitch-dy*.0035,-.9,.79);}
  function stepManual(dt) {
    if(!ready)return manual;
    resize();manual.yaw+=((keys.has('turnleft')?1:0)-(keys.has('turnright')?1:0))*dt*1.48;
    const ahead=(keys.has('forward')?1:0)-(keys.has('back')?1:0),across=(keys.has('right')?1:0)-(keys.has('left')?1:0);
    const speed=dt*2.65/Math.max(1,Math.hypot(ahead,across)),si=Math.sin(manual.yaw),co=Math.cos(manual.yaw);
    manual.x=clamp(manual.x+(co*across-si*ahead)*speed,-2.20,2.20);
    manual.z=clamp(manual.z+(-co*ahead-si*across)*speed,-48.3,9.7);
    const nearest=stops.reduce((a,b)=>Math.abs(b.z-manual.z)<Math.abs(a.z-manual.z)?b:a);
    if(!pool.has(nearest.id))station(nearest.id);
    if(Math.abs(manual.z-lastManualLoad)>1.8){
      lastManualLoad=manual.z;equipment.near(manual.z);
      prepare(stops.filter(s=>Math.abs(s.z-manual.z)<7).sort((a,b)=>Math.abs(a.z-manual.z)-Math.abs(b.z-manual.z)).map(s=>s.id));
    }
    camera.position.set(manual.x,1.68,manual.z);camera.rotation.set(manual.pitch,manual.yaw,0,'YXZ');
    showNearby(manual.z,nearest.id);finish(64,0);
    return {...manual,nearest:nearest.id};
  }
  function lighten() {
    if(capture)return;
    quality=Math.max(.64,quality*.84);sizeDirty=true;
    if(quality<.76&&optics){optics.dispose();optics=null;shadowDirty=true;}
    viewDistance=Math.max(13,viewDistance-2);
  }
  function release(){
    ready=false;clearPreparation();
    sizeObserver.disconnect();feed?.dispose();optics?.dispose();renderer.dispose();renderer.forceContextLoss();
  }
  return {setProvider(value){provider=value;pool.get('knowledge')?.setProvider?.(value);},draw,lighting,prepare,clearPreparation,readyFor,rotate,startManual,stepManual,keys,lighten,resize,release,
    isReady:id=>pool.get(id)?.detailed===true,
    get pose(){return camera.position.toArray();},
    stats:()=>({...lastFrame,stations:pool.size,equipment:equipment.assets.size,optics:!!optics})};
}
