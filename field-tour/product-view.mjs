import * as T from '../ai-briefing/vendor/three.module.min.js';
import {buildZieview} from './zieview/model/zieview.mjs';
import {buildControlDisplay} from './control-display.mjs';
import {lightProbe} from './environment.mjs?v=motion1';
import {batchStatic} from './batch.mjs';

const setups={
  unit:{target:'head',r:.83,az:-.32,el:.10},
  tripod:{target:'full',r:2.88,az:-.45,el:.105},
  magnet:{target:'head',r:1.12,az:.76,el:.16},
  control:{r:2.09,az:.16,el:.13}
};

export function createProductView(canvas,{capture=false,initialMode='unit',onChange=()=>{}}={}){
  const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:capture,alpha:false,powerPreference:'high-performance'});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  // The product, floor and light rigs stay still as the visitor orbits. Invalidate
  // the depth map separately when an actual shadow caster changes position.
  renderer.shadowMap.autoUpdate=false;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.018,42);
  scene.matrixWorldAutoUpdate=false;
  const ground=new T.Color(0xb0b2ae);scene.background=ground;scene.fog=new T.FogExp2(ground,.095);
  const floor=new T.Mesh(new T.PlaneGeometry(80,80),new T.MeshStandardMaterial({color:0xaeb1ab,roughness:.79,metalness:.03}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.006;floor.receiveShadow=true;scene.add(floor);
  scene.add(new T.HemisphereLight(0xe9efff,0xc9b395,.78));
  const key=new T.DirectionalLight(0xffead1,3.55);key.castShadow=true;key.position.set(-2.5,4.8,3.5);
  Object.assign(key.shadow.camera,{left:-2.7,right:2.7,top:2.8,bottom:-2.8,near:.1,far:12});key.shadow.camera.updateProjectionMatrix();key.shadow.mapSize.set(1536,1536);key.shadow.normalBias=.0013;key.shadow.bias=-.00012;scene.add(key);
  const rim=new T.DirectionalLight(0xdbeaff,1.55);rim.position.set(2.6,2.8,-2.2);scene.add(rim);
  const bounce=new T.DirectionalLight(0xffe7cc,.48);bounce.position.set(1,.8,2.4);scene.add(bounce);

  const models=new Map(),studio=new Map(),displayGeometry=new Set(),displayMaterials=new Set(),displayMaps=new Set();
  const look=new T.Vector3(),aim=new T.Vector3();
  let env=null,keyMode='unit',arrangement='',az=0,el=0,radius=1,tween=null,released=false,shadowDirty=true,w=0,h=0,ratio=0;
  function surface(original){
    if(!studio.has(original))studio.set(original,original.clone());
    return studio.get(original);
  }
  function model(kind){
    if(models.has(kind))return models.get(kind);
    const asset=kind==='display'?buildControlDisplay(T):buildZieview(T,{mount:kind});
    if(kind==='display'){
      // The aperture is explicitly dynamic. Keep it and its original texture as
      // an independent mesh while merging the stationary monitor and fasteners.
      asset.group.traverse(n=>{if(n.isMesh){displayGeometry.add(n.geometry);displayMaterials.add(n.material);}});
      batchStatic(T,asset.group);
      asset.group.traverse(n=>{if(n.isMesh)displayGeometry.add(n.geometry);});
    }
    asset.group.visible=false;scene.add(asset.group);models.set(kind,asset);
    asset.ready=asset.ready.then(()=>{
      if(kind==='display'){
        for(const mat of displayMaterials)if(mat.map){if(released)mat.map.dispose();else displayMaps.add(mat.map);}
      }else if(!released){
        // Other workshop views use the original material cache. The studio keeps
        // its own material instances and shares the underlying authored textures.
        asset.group.traverse(n=>{if(n.isMesh)n.material=Array.isArray(n.material)?n.material.map(surface):surface(n.material);});
      }
      if(!released&&asset.group.visible)onChange();
    });
    return asset;
  }
  function mode(value,animate=false){
    if(!Object.hasOwn(setups,value)||released)return;
    const preset=setups[value],kit=value==='magnet'?'magnet':'tripod';
    const asset=model(kit),monitor=value==='control'?model('display'):null;
    const nextArrangement=monitor?'control':kit;
    if(nextArrangement!==arrangement){
      for(const m of models.values())m.group.visible=m===asset||m===monitor;
      asset.group.position.set(monitor?-.78:0,0,monitor?-.35:0);
      if(monitor)monitor.group.position.set(.24,0,0);
      arrangement=nextArrangement;
      scene.updateMatrixWorld(true);shadowDirty=true;
    }
    if(monitor)aim.set(.08,1.34,0);else aim.copy(asset.targets[preset.target]);
    keyMode=value;
    if(animate){
      const delta=Math.atan2(Math.sin(preset.az-az),Math.cos(preset.az-az));
      tween={start:performance.now(),look:look.clone(),az,el,radius,delta};
    }else{
      tween=null;look.copy(aim);az=preset.az;el=preset.el;radius=preset.r;
    }
  }
  // Capture consumers can select any mode synchronously after await ready.
  // The website prepares just the currently selected equipment on first use.
  if(capture){model('tripod');model('magnet');model('display');}
  mode(Object.hasOwn(setups,initialMode)?initialMode:'unit');
  const probe=lightProbe(renderer,'./machine-shop-rgbe.png').then(p=>{
    if(released){p.dispose();return;}
    env=p;scene.environment=p.texture;scene.environmentIntensity=.68;scene.environmentRotation.y=.68;
  });
  const ready=Promise.all([probe,...Array.from(models.values(),m=>m.ready)]);
  function advance(now){
    if(!tween)return false;
    const u=T.MathUtils.clamp((now-tween.start)/320,0,1),s=u*u*(3-2*u),p=setups[keyMode];
    look.lerpVectors(tween.look,aim,s);az=tween.az+tween.delta*s;
    el=T.MathUtils.lerp(tween.el,p.el,s);radius=T.MathUtils.lerp(tween.radius,p.r,s);
    if(u===1)tween=null;
    return true;
  }
  function draw(){
    if(released)return;
    const x=Math.max(1,canvas.clientWidth),y=Math.max(1,canvas.clientHeight),d=capture?1:Math.min(devicePixelRatio,1.65);
    if(x!==w||y!==h||d!==ratio){
      w=x;h=y;ratio=d;renderer.setDrawingBufferSize(w,h,ratio);camera.aspect=w/h;camera.updateProjectionMatrix();
    }
    const fit=radius*Math.max(1,.84/camera.aspect);
    camera.position.set(look.x+Math.sin(az)*Math.cos(el)*fit,look.y+Math.sin(el)*fit,look.z+Math.cos(az)*Math.cos(el)*fit);
    camera.lookAt(look);
    // The environment probe uses this renderer for its own scene during setup.
    // Set the flag immediately before drawing the intended caster arrangement.
    if(shadowDirty){renderer.shadowMap.needsUpdate=true;shadowDirty=false;}
    renderer.render(scene,camera);
  }
  function orbit(dx,dy){tween=null;az+=dx;el=T.MathUtils.clamp(el+dy,-.21,.9);}
  function zoom(mult){tween=null;radius=T.MathUtils.clamp(radius*mult,setups[keyMode].r*.56,setups[keyMode].r*1.8);}
  function release(){
    if(released)return;released=true;
    env?.dispose();key.shadow.dispose();floor.geometry.dispose();floor.material.dispose();
    for(const g of displayGeometry)g.dispose();
    for(const m of displayMaterials)m.dispose();
    for(const t of displayMaps)t.dispose();
    for(const m of studio.values())m.dispose();
    renderer.dispose();
  }
  return {mode,draw,orbit,zoom,ready,advance,get moving(){return tween!==null;},release};
}

export function mountProduct(frame){
  const canvas=frame.querySelector('canvas'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const pointers=new Map();
  let view=null,pending=null,visible=false,lost=false,dirty=true,mode=frame.dataset.productFrame;
  let raf=0,timer=0,lastAuto=0,hold=0;
  function clearTimer(){if(timer){clearTimeout(timer);timer=0;}}
  function stop(){if(raf){cancelAnimationFrame(raf);raf=0;}clearTimer();lastAuto=0;}
  function available(){return visible&&!document.hidden&&!lost;}
  function schedule(){
    if(!view||!available()||raf||timer)return;
    if(dirty||view.moving){raf=requestAnimationFrame(paint);return;}
    if(reduce.matches||pointers.size)return;
    const wait=hold-performance.now();
    if(wait>0){timer=setTimeout(()=>{timer=0;schedule();},wait);}
    else raf=requestAnimationFrame(paint);
  }
  function invalidate(){dirty=true;clearTimer();schedule();}
  function paint(now){
    raf=0;if(!view||!available())return;
    const moving=view.advance(now),auto=!moving&&!reduce.matches&&!pointers.size&&now>=hold;
    if(auto){
      if(lastAuto)view.orbit(Math.min(.085,(now-lastAuto)/1000)*.075,0);
      lastAuto=now;
    }else lastAuto=0;
    if(dirty||moving||auto){view.draw();dirty=false;frame.dataset.loaded='true';}
    schedule();
  }
  function load(){
    if(!available()||view||pending)return;
    let candidate;
    try{candidate=createProductView(canvas,{initialMode:mode,onChange:invalidate});}
    catch{frame.dataset.loaded='false';return;}
    pending=candidate;
    candidate.ready.then(()=>{
      if(pending!==candidate)return;
      pending=null;view=candidate;view.mode(mode);invalidate();
    }).catch(()=>{
      if(pending===candidate){pending=null;candidate.release();frame.dataset.loaded='false';}
    });
  }
  function holdFor(ms){hold=performance.now()+ms;lastAuto=0;clearTimer();}
  function control(e){e?.preventDefault();holdFor(7000);invalidate();}
  canvas.addEventListener('pointerdown',e=>{
    pointers.set(e.pointerId,[e.clientX,e.clientY]);canvas.setPointerCapture(e.pointerId);holdFor(7000);
  });
  canvas.addEventListener('pointermove',e=>{
    const prev=pointers.get(e.pointerId);if(!prev||!view)return;
    const dx=prev[0]-e.clientX,dy=e.clientY-prev[1];if(!dx&&!dy)return;
    pointers.set(e.pointerId,[e.clientX,e.clientY]);view.orbit(dx*.010,dy*.007);control();
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{
    if(!pointers.delete(e.pointerId))return;holdFor(7000);schedule();
  });
  canvas.addEventListener('keydown',e=>{
    if(!view)return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
      view.orbit(e.key==='ArrowLeft'?-.23:e.key==='ArrowRight'?.23:0,e.key==='ArrowUp'?.12:e.key==='ArrowDown'?-.12:0);control(e);
    }else if(['+','=','-'].includes(e.key)){view.zoom(e.key==='-'?1.15:.87);control(e);}
  });
  frame.addEventListener('click',e=>{const b=e.target.closest('[data-zoom]');if(b&&view){view.zoom(b.dataset.zoom==='in'?.82:1.22);control();}});
  new ResizeObserver(invalidate).observe(frame);
  new IntersectionObserver(entries=>{
    const entry=entries.at(-1);
    visible=entry.isIntersecting&&entry.intersectionRatio>0;
    if(visible){load();invalidate();}else stop();
  },{threshold:[0,.001]}).observe(frame);
  canvas.addEventListener('webglcontextlost',e=>{
    e.preventDefault();lost=true;stop();frame.dataset.loaded='false';
    (view||pending)?.release();view=null;pending=null;
  });
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;dirty=true;load();});
  reduce.addEventListener('change',()=>{
    if(reduce.matches&&view?.moving)view.mode(mode);
    lastAuto=0;invalidate();
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){stop();return;}load();invalidate();
  });
  return value=>{
    if(!Object.hasOwn(setups,value))return;
    mode=value;view?.mode(value,!reduce.matches&&available());holdFor(2000);invalidate();
  };
}
