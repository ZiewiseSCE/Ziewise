import * as THREE from './vendor/three.module.min.js';

const loaders={
  surveillance:()=>import('./assets/process-surveillance.js?v=20260906-process-v12').then(m=>m.createSurveillanceModel),
  industry:()=>import('./assets/process-industry.js?v=20260906-process-v12').then(m=>m.createIndustryModel),
  systems:()=>import('./assets/process-systems.js?v=20260906-process-v12').then(m=>m.createSystemsModel)
};
const imports={};
const vector=a=>Array.isArray(a)?new THREE.Vector3(...a):a.clone();

function studioEnvironment(renderer){
  const room=new THREE.Scene();
  const shell=new THREE.Mesh(new THREE.BoxGeometry(30,20,30),new THREE.MeshBasicMaterial({color:0x8096a7,side:THREE.BackSide}));room.add(shell);
  for(const [x,y,z,w,h,d] of [[-7,6,2,1,8,12],[4,9,-2,14,1,6],[8,3,8,1,7,7]]){
    const panel=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color:0xffffff}));panel.position.set(x,y,z);room.add(panel);
  }
  const generator=new THREE.PMREMGenerator(renderer),environment=generator.fromScene(room,0);generator.dispose();
  room.traverse(object=>{object.geometry?.dispose();object.material?.dispose();});return environment;
}

/* One shared WebGL context for the entire extended deck, not one per slide. */
export function createProcessRenderer(){
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setClearColor(0x071522,1);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  const canvas=renderer.domElement;canvas.setAttribute('role','img');
  const world=new THREE.Scene();world.fog=new THREE.Fog(0x071522,28,65);
  const environment=studioEnvironment(renderer);world.environment=environment.texture;world.environmentIntensity=.65;
  world.add(new THREE.HemisphereLight(0xc7e9ff,0x274152,2.8));
  const key=new THREE.DirectionalLight(0xe8f3ff,3.7);key.position.set(-5,10,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
  Object.assign(key.shadow.camera,{left:-12,right:12,top:10,bottom:-10,near:.5,far:40});key.shadow.normalBias=.04;world.add(key);
  const rim=new THREE.DirectionalLight(0x49b9ed,2.6);rim.position.set(6,6,-7);world.add(rim);
  const fill=new THREE.DirectionalLight(0xffdfa9,1);fill.position.set(-8,3,-3);world.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:0x112333,metalness:.18,roughness:.7}));floor.rotation.x=-Math.PI/2;floor.position.y=-.13;floor.receiveShadow=true;world.add(floor);
  const grid=new THREE.GridHelper(60,60,0x365d74,0x1e3a50);grid.position.y=-.12;grid.material.transparent=true;grid.material.opacity=.35;world.add(grid);
  const camera=new THREE.PerspectiveCamera(38,2,.1,100);
  let root=null,host=null,model=null,labels=[],bounds=null,fitPoints=[],ticket=0,lastState=null,lost=false,drag=null;
  let target=new THREE.Vector3(),yaw=.6,pitch=.55,baseYaw=.6,basePitch=.55,zoom=1,userView=false,currentPhase=-1;
  let lastWidth=0,lastHeight=0,fitKey='',fitValue=15;
  function disposeModel(){
    if(!model)return;world.remove(model.root);
    const geometries=new Set(),materials=new Set(),textures=new Set();
    model.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
    materials.forEach(m=>{Object.values(m).forEach(value=>{if(value?.isTexture)textures.add(value);});m.dispose();});
    geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());model=null;
    labels.forEach(l=>l.el.remove());labels=[];renderer.renderLists.dispose();
  }
  function resize(){
    if(!host)return;const r=host.getBoundingClientRect();
    const w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));
    if(w!==lastWidth||h!==lastHeight){renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(w,h,false);lastWidth=w;lastHeight=h;}
    camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();
  }
  const ro=new ResizeObserver(()=>{resize();draw();});
  function fitDistance(){
    if(!bounds)return 15;
    const nextKey=[yaw,pitch,camera.aspect,zoom].join(':');if(nextKey===fitKey)return fitValue;
    const back=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),back).normalize();
    const up=new THREE.Vector3().crossVectors(back,right).normalize();
    const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),offset=new THREE.Vector3();let distance=0;
    for(const point of fitPoints){
      offset.copy(point).sub(target);const depth=offset.dot(back);
      distance=Math.max(distance,depth+Math.abs(offset.dot(right))/(tan*camera.aspect*.9),depth+Math.abs(offset.dot(up))/(tan*.83));
    }
    fitKey=nextKey;fitValue=Math.max(8,distance*1.03)/zoom;return fitValue;
  }
  function draw(){
    if(!model||!host||lost)return;
    const distance=fitDistance();
    camera.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*distance,target.y+Math.sin(pitch)*distance,target.z+Math.cos(yaw)*Math.cos(pitch)*distance);
    camera.lookAt(target);renderer.render(world,camera);
    const occupied=[];
    labels.forEach(label=>{
      const projected=vector(label.position).project(camera),w=host.clientWidth,h=host.clientHeight;
      label.el.hidden=projected.z>1||projected.x<-1||projected.x>1||projected.y<-1||projected.y>1;if(label.el.hidden)return;
      let x=THREE.MathUtils.clamp((projected.x+1)*w/2,95,w-95),y=THREE.MathUtils.clamp((1-projected.y)*h/2,132,h-64);
      for(const other of occupied)if(Math.abs(other.x-x)<160&&Math.abs(other.y-y)<34)y=Math.min(h-64,other.y+36);
      occupied.push({x,y});label.el.style.left=x+'px';label.el.style.top=y+'px';
    });
  }
  canvas.addEventListener('pointerdown',e=>{if(!host)return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);userView=true;});
  canvas.addEventListener('pointermove',e=>{if(!drag||!host)return;const scale=host.getBoundingClientRect().width/host.clientWidth;
    yaw-=(e.clientX-drag.x)*.006/Math.max(.3,scale);pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.004/Math.max(.3,scale),.18,1.18);drag={x:e.clientX,y:e.clientY};draw();});
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,()=>drag=null));
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;if(root){root.querySelector('.ps-viewport').dataset.renderer='fallback';root.querySelector('.ps-load').textContent='3D 표시를 복구 중입니다. 단계 설명은 계속 볼 수 있습니다.';}});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;if(root){resize();if(lastState)model?.update(lastState);draw();root.querySelector('.ps-viewport').dataset.renderer='webgl';}});
  return {
    async mount(nextRoot,nextHost,config){
      const request=++ticket;
      const factory=await(imports[config.family]||(imports[config.family]=loaders[config.family]()));
      if(request!==ticket||!nextRoot.classList.contains('active'))return false;
      ro.disconnect();disposeModel();root=nextRoot;host=nextHost;
      model=factory(THREE,config.kind);world.add(model.root);
      // Fit all four phase endpoints, so moving equipment stays within the initial view.
      bounds=new THREE.Box3();fitPoints=[];
      for(let phase=0;phase<4;phase++){
        model.update({phase,time:5,delta:0,reducedMotion:true});model.root.updateMatrixWorld(true);
        model.root.traverse(object=>{
          if(!object.geometry)return;let parent=object;while(parent){if(!parent.visible)return;parent=parent.parent;}
          object.geometry.computeBoundingBox();const box=object.geometry.boundingBox;if(!box||box.isEmpty())return;
          for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
            const point=new THREE.Vector3(x,y,z).applyMatrix4(object.matrixWorld);bounds.expandByPoint(point);fitPoints.push(point);
          }
        });
      }
      if(bounds.isEmpty())bounds.set(new THREE.Vector3(-6,0,-3),new THREE.Vector3(6,4,3));
      target=bounds.getCenter(new THREE.Vector3());target.y+=.12;
      baseYaw=model.camera?.yaw??.6;basePitch=(model.camera?.pitch??.55)*.8;yaw=baseYaw;pitch=basePitch;zoom=1.1;fitKey='';userView=false;currentPhase=-1;
      model.update({phase:0,time:0,delta:0,reducedMotion:false});
      host.append(canvas);canvas.setAttribute('aria-label',`${config.tag} · 드래그로 회전 가능한 3D 개념 모델`);
      labels=(model.labels||[]).map(label=>{const el=document.createElement('span');el.className='ps-label';el.textContent=label.text;host.append(el);return {...label,el};});
      lastWidth=0;lastHeight=0;ro.observe(host);resize();draw();return true;
    },
    update(owner,state){
      if(root!==owner||!model)return;lastState=state;
      if(currentPhase!==state.phase){currentPhase=state.phase;if(!userView){yaw=baseYaw+[0,-.05,.07,.02][state.phase];pitch=basePitch;}}
      model.update(state);host.dataset.phase=String(state.phase);host.dataset.phaseTime=state.time.toFixed(3);
      host.dataset.drawCalls=String(renderer.info.render.calls);draw();
    },
    view(owner,action){
      if(root!==owner||!model)return;userView=true;
      if(action==='reset'){yaw=baseYaw;pitch=basePitch;zoom=1.1;userView=false;}
      else if(action==='left')yaw-=.28;else if(action==='right')yaw+=.28;
      else if(action==='closer')zoom=Math.min(1.8,zoom+.15);else if(action==='wider')zoom=Math.max(.75,zoom-.15);
      draw();
    },
    unmount(owner){
      // A pending family import is invalidated even before the first model exists.
      ticket++;if(root!==owner)return;ro.disconnect();disposeModel();canvas.remove();root=null;host=null;lastState=null;drag=null;
    }
  };
}
