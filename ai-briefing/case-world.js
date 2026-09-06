import * as THREE from './vendor/three.module.min.js';
import { createValveModel } from './assets/valve-model.js';

const clamp = THREE.MathUtils.clamp;
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const V = (x,y,z) => new THREE.Vector3(x,y,z);

function countModel() {
  const root = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({color:0xa3b6c8, metalness:.65, roughness:.32});
  const body = new THREE.MeshStandardMaterial({color:0x274153, metalness:.6, roughness:.38});
  const beltMat = new THREE.MeshStandardMaterial({color:0x152e3d, metalness:.4, roughness:.5});
  const cyan = new THREE.MeshStandardMaterial({color:0x4bd4f7, emissive:0x116b91, emissiveIntensity:.7, metalness:.4, roughness:.3});
  const amber = new THREE.MeshStandardMaterial({color:0xffb735, emissive:0x9f4906, emissiveIntensity:.6, metalness:.25, roughness:.4});
  const green = new THREE.MeshStandardMaterial({color:0x77eac2, emissive:0x12654f, emissiveIntensity:.6, metalness:.3, roughness:.35});
  const geometry = {
    roller: new THREE.CylinderGeometry(.13,.13,3.7,16),
    leg: new THREE.BoxGeometry(.22,1.05,.22),
    shaft: new THREE.CylinderGeometry(.055,.055,.25,10),
    head: new THREE.CylinderGeometry(.115,.115,.10,6),
    ring: new THREE.TorusGeometry(.15,.013,5,16)
  };
  function add(g,m,x,y,z,parent=root) { const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh; }
  function box(w,h,d,m,x,y,z,parent=root) { return add(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent); }
  for(const z of [-1.95,1.95]) {
    box(12,.28,.22,body,0,1,z);
    box(12,.055,.09,cyan,0,1.18,z);
    for(const x of [-5,-2,2,5])add(geometry.leg,body,x,.48,z);
  }
  const rollers=[];
  for(let i=0;i<28;i++){const r=add(geometry.roller,steel,-5.8+i*.43,1,0);r.rotation.x=Math.PI/2;rollers.push(r);}
  box(12,.09,3.7,beltMat,0,.98,0);

  const tray=new THREE.Group();root.add(tray);tray.position.set(-1,1.2,0);
  const trayMat=new THREE.MeshStandardMaterial({color:0x162c3d,metalness:.45,roughness:.35});
  box(4.5,.12,3.1,trayMat,0,0,0,tray);
  for(const z of [-1.57,1.57])box(4.65,.14,.07,steel,0,.12,z,tray);
  for(const x of [-2.3,2.3])box(.07,.14,3.2,steel,x,.12,0,tray);
  const shafts=new THREE.InstancedMesh(geometry.shaft,steel,100);
  const heads=new THREE.InstancedMesh(geometry.head,steel,100);
  const rings=new THREE.InstancedMesh(geometry.ring,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9}),100);
  shafts.castShadow=true;heads.castShadow=true;
  tray.add(shafts,heads,rings);
  const temp=new THREE.Object3D(),col=new THREE.Color();
  const missing=add(new THREE.TorusGeometry(.19,.025,7,24),amber,0,.035,0,tray);missing.rotation.x=-Math.PI/2;

  const arch=new THREE.Group();root.add(arch);arch.position.x=-1;
  for(const z of [-2.3,2.3]){
    box(.22,3.4,.22,steel,0,1.7,z,arch);
    box(.1,2.1,.07,cyan,.13,2,z,arch);
    box(.6,.12,.6,body,0,.04,z,arch);
  }
  box(.65,.3,4.9,body,0,3.43,0,arch);
  box(.8,.48,.9,steel,0,3.15,0,arch);
  add(new THREE.CylinderGeometry(.29,.29,.45,24),body,0,2.78,0,arch);
  add(new THREE.CylinderGeometry(.28,.28,.035,24),cyan,0,2.54,0,arch);
  const coneMat=new THREE.MeshBasicMaterial({color:0x51dafa,transparent:true,opacity:.055,depthWrite:false,side:THREE.DoubleSide});
  add(new THREE.CylinderGeometry(.18,1.65,1.24,4,1,true),coneMat,0,1.88,0,arch).rotation.y=Math.PI/4;
  const scan=box(.028,.012,3.05,new THREE.MeshBasicMaterial({color:0x85eaff,transparent:true,opacity:.85}),-2.2,.22,0,tray);
  const gatePivot=new THREE.Group();gatePivot.position.set(2.65,1.36,-1.9);root.add(gatePivot);
  const gateArm=box(.16,.15,3.9,amber,0,.17,1.9,gatePivot);
  for(let i=0;i<8;i++)box(.165,.16,.15,body,0,.17,.18+i*.5,gatePivot);
  box(.32,1.85,.32,body,2.65,.91,-1.9);
  add(new THREE.CylinderGeometry(.22,.22,.35,20),steel,2.65,1.50,-1.9).rotation.z=Math.PI/2;
  const lamp=add(new THREE.CylinderGeometry(.10,.10,.23,18),amber,2.65,2.02,-1.9);
  const light=new THREE.PointLight(0x32baff,8,7);light.position.set(-1,3,0);root.add(light);
  let phase=-1,age=0,target=50,epoch=-1;
  return {root, focus:V(-.8,1.7,0),
    update(state) {
      if(phase!==state.phase || target!==state.target || epoch!==state.epoch){phase=state.phase;age=0;target=state.target;epoch=state.epoch;}
      age+=state.delta;
      const staticView=state.reducedMotion;
      const ease=smooth(staticView?1:age/1.6);
      tray.position.x=phase===0?-3+2*smooth(staticView?1:age/2):phase===3?-1+4.3*smooth(staticView?1:(age-.6)/2.7):-1;
      gatePivot.rotation.x=phase===3?-Math.PI/2*smooth(staticView?1:age/.6):0;
      lamp.material=state.count===target?green:amber;gateArm.material=state.count===target?green:amber;
      scan.visible=phase===0||phase===2;
      scan.position.x=-2.15+4.3*((age*.45)%1);
      missing.visible=phase===1;
      for(let i=0;i<100;i++) {
        const active=i<target;
        const row=Math.floor(i/10),column=i%10;
        const rows=target/10;
        const x=-1.95+column*.433,z=-(rows-1)*.275/2+row*.275;
        const exists=active&&(i<target-1||phase>=2);
        const drop=i===target-1&&phase===2?1.8*(1-ease):0;
        temp.position.set(x,.2+drop,z);temp.rotation.set(0,(i%3)*.26,0);temp.scale.setScalar(exists?1:0);temp.updateMatrix();shafts.setMatrixAt(i,temp.matrix);
        temp.position.y=.375+drop;temp.updateMatrix();heads.setMatrixAt(i,temp.matrix);
        temp.position.y=.085;temp.rotation.x=-Math.PI/2;temp.scale.setScalar(active?1:0);temp.updateMatrix();rings.setMatrixAt(i,temp.matrix);
        col.set(i<state.count?0x62e6c3:(i===target-1&&phase===1?0xffbd52:0x234b67));rings.setColorAt(i,col);
        if(i===target-1)missing.position.set(x,.10,z);
      }
      shafts.instanceMatrix.needsUpdate=true;heads.instanceMatrix.needsUpdate=true;rings.instanceMatrix.needsUpdate=true;if(rings.instanceColor)rings.instanceColor.needsUpdate=true;
      rollers.forEach(r=>r.rotation.y=phase===0||phase===3?age*1.4:0);
    },
    labels: [{point:V(-1,3.45,0),text:'AI 카메라'},{point:V(2.65,2.18,-1.9),text:'출하 게이트'}]
  };
}

function environment(renderer) {
  const room=new THREE.Scene();
  const shell=new THREE.Mesh(new THREE.BoxGeometry(30,20,30),new THREE.MeshBasicMaterial({color:0x668299,side:THREE.BackSide}));room.add(shell);
  const sources=[];
  for(const [x,y,z,w,h,d] of [[-7,6,2,1,8,12],[4,9,-2,14,1,6],[8,3,8,1,7,7]]){
    const g=new THREE.BoxGeometry(w,h,d),m=new THREE.MeshBasicMaterial({color:0xffffff});const p=new THREE.Mesh(g,m);p.position.set(x,y,z);room.add(p);sources.push(p);
  }
  const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(room,0);pmrem.dispose();
  shell.geometry.dispose();shell.material.dispose();sources.forEach(p=>{p.geometry.dispose();p.material.dispose();});
  return env;
}

export function createCaseWorld(root, kind) {
  const host=root.querySelector('.cs-world');
  const canvas=host.querySelector('canvas');
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setClearColor(0x07131f,1);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x07131f,23,45);
  const env=environment(renderer);scene.environment=env.texture;scene.environmentIntensity=.8;
  scene.add(new THREE.HemisphereLight(0xc9e8ff,0x21394b,3));
  const key=new THREE.DirectionalLight(0xe8f4ff,4);key.position.set(-4,9,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);
  key.shadow.camera.left=-10;key.shadow.camera.right=10;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;key.shadow.normalBias=.045;scene.add(key);
  const rim=new THREE.DirectionalLight(0x50c9ff,3);rim.position.set(6,5,-7);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xffdca8,1.5);fill.position.set(-7,2,-4);scene.add(fill);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(90,90),new THREE.MeshStandardMaterial({color:0x0d1c2a,roughness:.55,metalness:.28}));floor.rotation.x=-Math.PI/2;floor.position.y=-.08;floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(50,50,0x2c5369,0x142e40);grid.position.y=-.07;grid.material.transparent=true;grid.material.opacity=.4;scene.add(grid);
  const model=kind==='valve'?createValveModel(THREE):countModel();scene.add(model.root);
  if(model.stem)model.stem.userData.baseY=model.stem.position.y;
  if(model.disc)model.disc.userData.baseY=model.disc.position.y;
  if(model.update)model.update({phase:0,target:50,count:0,delta:0,reducedMotion:false});
  const camera=new THREE.PerspectiveCamera(36,2,.1,100);
  const focus=kind==='valve'?V(-.25,2,0):V(-.5,1.4,0);
  let yaw=kind==='valve'?.76:.48,pitch=kind==='valve'?.29:.73,distance=kind==='valve'?10.8:13.2;
  let desiredYaw=yaw,desiredPitch=pitch,desiredDistance=distance,userView=false,lastPhase=-1,lastEpoch=-1,age=0;
  const baseYaw=yaw,basePitch=pitch,baseDistance=distance;
  const labels=(model.labels||[{point:V(0,3.2,0),text:'AI 확인 대상'},{point:V(-2,1.8,0),text:'DCS 압력 신호'}]).map(item=>{
    const label=document.createElement('span');label.className='cs-world-label';label.textContent=item.text;host.append(label);return {...item,el:label};
  });
  function resize(){const bounds=host.getBoundingClientRect();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.setSize(Math.max(1,Math.round(bounds.width)),Math.max(1,Math.round(bounds.height)),false);camera.aspect=host.clientWidth/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();}
  const ro=new ResizeObserver(resize);ro.observe(host);addEventListener('resize',resize);resize();
  function render() {
    camera.position.set(focus.x+Math.sin(yaw)*Math.cos(pitch)*distance,focus.y+Math.sin(pitch)*distance,focus.z+Math.cos(yaw)*Math.cos(pitch)*distance);
    camera.lookAt(focus);
    // Keep room on the right for the decision readout without hiding the model.
    camera.setViewOffset(host.clientWidth,host.clientHeight,host.clientWidth*.085,0,host.clientWidth,host.clientHeight);
    renderer.render(scene,camera);
    labels.forEach(item=>{const p=item.point.clone().project(camera);item.el.style.left=((p.x+1)/2*host.clientWidth)+'px';item.el.style.top=((-p.y+1)/2*host.clientHeight)+'px';item.el.hidden=p.z>1||p.x<-1||p.x>1||p.y<-1||p.y>1;});
  }
  let drag=null;
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);userView=true;});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const scale=host.getBoundingClientRect().width/host.clientWidth;desiredYaw-=(e.clientX-drag.x)*.007/Math.max(.5,scale);desiredPitch=clamp(desiredPitch+(e.clientY-drag.y)*.004/Math.max(.5,scale),.16,1.13);yaw=desiredYaw;pitch=desiredPitch;drag={x:e.clientX,y:e.clientY};render();});
  const endDrag=()=>{drag=null;};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);
  ['touchstart','touchend','touchmove'].forEach(name=>host.addEventListener(name,e=>e.stopPropagation(),{passive:true}));
  root.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
    userView=true;
    if(button.dataset.view==='reset'){desiredYaw=baseYaw;desiredPitch=basePitch;desiredDistance=baseDistance;userView=false;}
    else desiredYaw+=button.dataset.view==='left'?-.32:.32;
    yaw=desiredYaw;pitch=desiredPitch;distance=desiredDistance;render();
  }));
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();root.classList.remove('cs-3d-ready');root.dataset.renderer='fallback';root.querySelector('.cs-world-state').textContent='개념 그래픽';});
  canvas.addEventListener('webglcontextrestored',()=>{resize();render();root.classList.add('cs-3d-ready');root.dataset.renderer='webgl';root.querySelector('.cs-world-state').textContent='3D 작동 시연';});
  root.classList.add('cs-3d-ready');root.dataset.renderer='webgl';root.querySelector('.cs-world-state').textContent='3D 작동 시연';
  render();
  return {
    update(state) {
      host.dataset.phase=String(state.phase);
      if(kind==='count'){
        host.dataset.count=String(state.count);host.dataset.target=String(state.target);
        canvas.setAttribute('aria-label',`3D 포장 라인: 목표 ${state.target}개, 검출 ${state.count}개. ${state.phase===1?'수량 부족으로 출하 게이트 닫힘':state.phase===3?'검증 완료, 출하 게이트 열림':'계수·검증 진행'}. 드래그 또는 시점 버튼으로 회전할 수 있습니다.`);
      }
      if(lastPhase!==state.phase || lastEpoch!==state.epoch){lastPhase=state.phase;lastEpoch=state.epoch;age=0;
        if(!userView){desiredYaw=baseYaw+[0,-.20,.11,.18][lastPhase];desiredPitch=basePitch+[0,.07,.04,.10][lastPhase];desiredDistance=baseDistance*[1,.92,.96,1.05][lastPhase];}
      }
      age+=state.delta;
      const blend=state.reducedMotion?1:1-Math.exp(-state.delta*3.5);
      yaw=THREE.MathUtils.lerp(yaw,desiredYaw,blend);pitch=THREE.MathUtils.lerp(pitch,desiredPitch,blend);distance=THREE.MathUtils.lerp(distance,desiredDistance,blend);
      if(model.update)model.update(state);
      else {
        const normal=state.phase===0||state.phase===3;
        model.flow.forEach((p,i)=>{p.position.x=-5.15+((age*(normal?1.5:.6)+i*.57)%10.3);p.material.color.set(normal?0x66dfff:0xffb84b);});
        const lift=state.phase===2?.15+.48*smooth(state.reducedMotion?1:age/2):state.phase===1?.15:.63;
        if(model.wheel)model.wheel.rotation.y=state.phase===2?Math.PI*2*smooth(state.reducedMotion?1:age/2):0;
        if(model.stem)model.stem.position.y=model.stem.userData.baseY+lift;
        if(model.disc)model.disc.position.y=model.disc.userData.baseY+lift;
        model.highlight.visible=state.phase===1||state.phase===2;
      }
      render();
    },
    dispose(){ro.disconnect();removeEventListener('resize',resize);renderer.dispose();env.dispose();scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});}
  };
}
