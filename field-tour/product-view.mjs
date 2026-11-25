import * as T from '../ai-briefing/vendor/three.module.min.js';
import {buildZieview} from './zieview/model/zieview.mjs';
import {buildControlDisplay} from './control-display.mjs';
import {lightProbe} from './environment.mjs';

const setups={
  unit:{target:'head',r:.83,az:-.32,el:.10},
  tripod:{target:'full',r:2.88,az:-.45,el:.105},
  magnet:{target:'head',r:1.12,az:.76,el:.16},
  control:{r:2.09,az:.16,el:.13}
};

export function createProductView(canvas,{capture=false}={}){
  const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:capture,alpha:false,powerPreference:'high-performance'});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
  renderer.setPixelRatio(capture?1:Math.min(devicePixelRatio,1.65));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.018,42);
  const ground=new T.Color(0xb0b2ae);scene.background=ground;scene.fog=new T.FogExp2(ground,.095);
  const mobile=buildZieview(T,{mount:'tripod'}),fixed=buildZieview(T,{mount:'magnet'}),display=buildControlDisplay(T);
  scene.add(mobile.group,fixed.group,display.group);
  const floor=new T.Mesh(new T.PlaneGeometry(80,80),new T.MeshStandardMaterial({color:0xaeb1ab,roughness:.79,metalness:.03}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.006;floor.receiveShadow=true;scene.add(floor);
  scene.add(new T.HemisphereLight(0xe9efff,0xc9b395,.78));
  const key=new T.DirectionalLight(0xffead1,3.55);key.castShadow=true;key.position.set(-2.5,4.8,3.5);
  Object.assign(key.shadow.camera,{left:-2.7,right:2.7,top:2.8,bottom:-2.8,near:.1,far:12});key.shadow.camera.updateProjectionMatrix();key.shadow.mapSize.set(1536,1536);key.shadow.normalBias=.0013;key.shadow.bias=-.00012;scene.add(key);
  const rim=new T.DirectionalLight(0xdbeaff,1.55);rim.position.set(2.6,2.8,-2.2);scene.add(rim);
  const bounce=new T.DirectionalLight(0xffe7cc,.48);bounce.position.set(1,.8,2.4);scene.add(bounce);
  let env=null,keyMode='unit',az=0,el=0,radius=1,first=true,w=0,h=0;
  const aim=new T.Vector3(),look=new T.Vector3(),position=new T.Vector3();
  const ready=Promise.all([mobile.ready,fixed.ready,display.ready,lightProbe(renderer,'./machine-shop-rgbe.png').then(p=>{env=p;scene.environment=p.texture;scene.environmentIntensity=.68;scene.environmentRotation.y=.68;})]).then(()=>{
    const studio=new Map();
    function surface(original){if(!studio.has(original))studio.set(original,original.clone());return studio.get(original);}
    for(const model of [mobile,fixed])model.group.traverse(node=>{if(node.isMesh)node.material=Array.isArray(node.material)?node.material.map(surface):surface(node.material);});
  });
  function mode(value){
    const frame=setups[value];if(!frame)return;
    keyMode=value;az=frame.az;el=frame.el;radius=frame.r;
    mobile.group.visible=value!=='magnet';fixed.group.visible=value==='magnet';display.group.visible=value==='control';
    mobile.group.position.set(value==='control'?-.78:0,0,value==='control'?-.35:0);
    display.group.position.set(.24,0,0);
    if(value==='control')aim.set(.08,1.34,0);else aim.copy((value==='magnet'?fixed:mobile).targets[frame.target]);
    if(first){look.copy(aim);first=false;}else look.copy(aim);
  }
  function draw(){
    const x=Math.max(1,canvas.clientWidth),y=Math.max(1,canvas.clientHeight);
    if(x!==w||y!==h){w=x;h=y;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
    const fit=radius*Math.max(1,.84/camera.aspect);
    position.set(look.x+Math.sin(az)*Math.cos(el)*fit,look.y+Math.sin(el)*fit,look.z+Math.cos(az)*Math.cos(el)*fit);
    camera.position.copy(position);camera.lookAt(look);renderer.render(scene,camera);
  }
  function orbit(dx,dy){az+=dx;el=T.MathUtils.clamp(el+dy,-.21,.9);}
  function zoom(mult){radius=T.MathUtils.clamp(radius*mult,setups[keyMode].r*.56,setups[keyMode].r*1.8);}
  mode('unit');return {mode,draw,orbit,zoom,ready,release(){env?.dispose();renderer.dispose();}};
}

export function mountProduct(frame){
  const canvas=frame.querySelector('canvas'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let view=null,start=null,active=false,raf=0,last=0,mode=frame.dataset.productFrame,hold=0;
  const pointers=new Map();
  function wake(){if(active&&view&&!raf&&!document.hidden)raf=requestAnimationFrame(paint);}
  function paint(now){
    raf=0;if(!active||document.hidden||!view)return;
    if(!reduce.matches&&!pointers.size&&now>hold&&last)view.orbit(Math.min(.05,(now-last)/1000)*.075,0);
    last=now;view.draw();if(!reduce.matches)wake();
  }
  async function load(){
    if(start)return start;
    start=(async()=>{const model=createProductView(canvas);await model.ready;view=model;view.mode(mode);view.draw();frame.dataset.loaded='true';wake();})().catch(()=>{frame.dataset.loaded='false';});
    return start;
  }
  const control=e=>{hold=performance.now()+7000;e?.preventDefault();wake();};
  canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,[e.clientX,e.clientY]);canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{const prev=pointers.get(e.pointerId);if(!prev||!view)return;
    view.orbit((prev[0]-e.clientX)*.010,(e.clientY-prev[1])*.007);pointers.set(e.pointerId,[e.clientX,e.clientY]);control();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{pointers.delete(e.pointerId);hold=performance.now()+7000;});
  canvas.addEventListener('keydown',e=>{
    if(!view)return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
      view.orbit(e.key==='ArrowLeft'?-.23:e.key==='ArrowRight'?.23:0,e.key==='ArrowUp'?.12:e.key==='ArrowDown'?-.12:0);control(e);
    }else if(['+','=','-'].includes(e.key)){view.zoom(e.key==='-'?1.15:.87);control(e);}
  });
  frame.addEventListener('click',e=>{const b=e.target.closest('[data-zoom]');if(b&&view){view.zoom(b.dataset.zoom==='in'?.82:1.22);control();}});
  new ResizeObserver(wake).observe(frame);
  new IntersectionObserver(([e])=>{active=e.isIntersecting;last=0;if(active){load();wake();}},{rootMargin:'100px'}).observe(frame);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();frame.dataset.loaded='false';view=null;start=null;});
  canvas.addEventListener('webglcontextrestored',()=>{if(active)load();});
  reduce.addEventListener('change',wake);document.addEventListener('visibilitychange',()=>{last=0;wake();});
  return value=>{mode=value;view?.mode(value);hold=performance.now()+2000;wake();};
}
