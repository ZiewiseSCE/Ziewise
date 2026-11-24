import * as T from '../ai-briefing/vendor/three.module.min.js';
import {byId,stops} from './route.mjs?v=visit4';

const clamp=T.MathUtils.clamp, mix=T.MathUtils.lerp;
const radians=T.MathUtils.degToRad;
const turn=(x,a,b)=>T.MathUtils.smoothstep(x,a,b);
const media='./photography/', assets='../assets/', brief='../ai-briefing/assets/';
const scenes={
  design:[assets+'field-01.webp',assets+'field-01.depth','shop',[[.55,.61],[.74,.44],[.69,.59]]],
  systems:[assets+'field-02.webp',assets+'field-02.depth','shop',[[.58,.59],[.75,.42],[.71,.49]]],
  vision:[assets+'field-03.webp',assets+'field-03.depth','shop',[[.62,.72],[.62,.32],[.76,.60]]],
  edge:[assets+'field-04.webp',assets+'field-04.depth','shop',[[.55,.58],[.84,.49],[.68,.45]]],
  safety:[media+'safety.webp',null,'shop',[[.39,.60],[.42,.48],[.70,.60]]],
  'safety-mounted':[media+'safety-mounted.webp',null,'shop',[[.62,.36],[.59,.42],[.70,.58]]],
  'safety-control':[media+'safety-control.webp',null,'shop',[[.42,.56],[.62,.56],[.70,.71]]],
  maintenance:[brief+'case-valve.webp',null,'shop',[[.54,.45],[.76,.48],[.65,.62]]],
  count:[brief+'case-count.webp',null,'shop',[[.40,.37],[.69,.64],[.76,.60]]],
  observer:[media+'observer.webp',null,'shop',[[.47,.38],[.70,.44],[.79,.51]]],
  print:[media+'print.webp',null,'office',[[.59,.43],[.67,.55],[.75,.69]]],
  knowledge:[brief+'knowledge-desk.webp',null,'office',[[.48,.71],[.65,.42],[.54,.62]]],
  hr:[media+'hr.webp',null,'office',[[.55,.78],[.92,.56],[.73,.77]]],
  finance:[media+'finance.webp',null,'office',[[.51,.74],[.56,.52],[.72,.39]]],
  purchase:[brief+'dept-purchase.webp',null,'office',[[.46,.69],[.72,.46],[.70,.59]]],
  sales:[brief+'dept-sales.webp',null,'office',[[.43,.61],[.69,.43],[.70,.57]]],
  roi:[brief+'dept-finance.webp',null,'office',[[.46,.68],[.68,.47],[.68,.61]]],
  poc:[brief+'poc-review.webp',null,'shop',[[.52,.68],[.67,.46],[.72,.58]]],
  energy:[brief+'solar.webp',null,'shop',[[.34,.55],[.56,.51],[.73,.52]]],
  commerce:[brief+'beauty-line.webp',null,'office',[[.36,.54],[.55,.58],[.70,.44]]],
  infrastructure:[assets+'company-infrastructure.webp',null,'shop',[[.39,.53],[.52,.39],[.71,.52]]]
};
export function photoURL(id){return new URL(scenes[id][0],import.meta.url).href;}
const rooms={office:'poly_haven_studio',shop:'machine_shop_02'};
const cache=new Map(), loader=new T.TextureLoader();
function loadTexture(path){
  const url=new URL(path,import.meta.url).href;
  if(!cache.has(url))cache.set(url,loader.loadAsync(url).then(tex=>{
    tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;return tex;
  }).catch(err=>{cache.delete(url);throw err;}));
  return cache.get(url);
}
const halfY=Math.tan(radians(35));
function range(inv){return 1/(.12+inv*.49);}
function pointAt(u,v,depth,aspect){
  return new T.Vector3((2*u-1)*halfY*aspect*depth,(1-2*v)*halfY*depth,-depth);
}
async function relief(id){
  const [src,depthFile,room,marks]=scenes[id];
  const payload=fetch(new URL(depthFile||media+id+'.depth',import.meta.url)).then(r=>{
    if(!r.ok)throw Error('사진 깊이 정보 '+r.status);return r.arrayBuffer();
  });
  const [tex,bytes]=await Promise.all([loadTexture(src),payload]);
  const header=new DataView(bytes), cols=header.getUint16(0,true),rows=header.getUint16(2,true);
  if(cols<2||rows<2||bytes.byteLength!==4+cols*rows)throw Error('사진 깊이 정보 형식');
  const depths=new Uint8Array(bytes,4),aspect=tex.image.width/tex.image.height;
  const positions=new Float32Array(cols*rows*3),uv=new Float32Array(cols*rows*2),indices=[];
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const n=j*cols+i,u=i/(cols-1),v=j/(rows-1),d=range(depths[n]/255);
    positions.set([(2*u-1)*halfY*aspect*d,(1-2*v)*halfY*d,-d],n*3);
    uv.set([u,1-v],n*2);
    if(i+1<cols&&j+1<rows){
      // Keep the nearer silhouette separate from the distant wall during sideways movement.
      const a=n,b=n+1,c=n+cols,e=c+1;
      for(const tri of [[a,c,b],[b,c,e]]){
        const [x,y,z]=tri.map(k=>depths[k]);
        if(Math.max(x,y,z)-Math.min(x,y,z)<72)indices.push(...tri);
      }
    }
  }
  const geom=new T.BufferGeometry();
  geom.setAttribute('position',new T.BufferAttribute(positions,3));geom.setAttribute('uv',new T.BufferAttribute(uv,2));geom.setIndex(indices);
  const material=new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,toneMapped:false,transparent:true});
  const subject=new T.Mesh(geom,material);subject.renderOrder=2;subject.frustumCulled=false;
  // The rear projection fills disoccluded pixels underneath the foreground silhouettes.
  const far=9, backing=new T.Mesh(new T.PlaneGeometry(2*halfY*aspect*far,2*halfY*far),
    new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,toneMapped:false}));
  backing.position.z=-far;backing.renderOrder=1;
  const group=new T.Group();group.add(subject,backing);
  const anchors=marks.map(([u,v])=>{
    const sample=Math.round(v*(rows-1))*cols+Math.round(u*(cols-1));
    return pointAt(u,v,range(depths[sample]/255),aspect);
  });
  return {id,room,group,subject,backing,anchors,aspect,dispose(){geom.dispose();material.dispose();backing.geometry.dispose();backing.material.dispose();}};
}

export function createWorld(canvas,{capture=false,onLoss}={}){
  const renderer=new T.WebGLRenderer({canvas,alpha:false,antialias:false,preserveDrawingBuffer:capture,powerPreference:'high-performance'});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(0x414c4b);
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(46,1,.04,100),keys=new Set();
  const roomMesh=new T.Mesh(new T.SphereGeometry(26,80,48),new T.MeshBasicMaterial({side:T.DoubleSide,toneMapped:false}));
  roomMesh.scale.x=-1;roomMesh.frustumCulled=false;scene.add(roomMesh);
  const prepared=new Map(),inflight=new Map(),roomMaps=new Map();
  const walkOrder=[...stops].sort((a,b)=>b.z-a.z);
  let active=null,disposed=false,width=0,height=0,ratio=capture?1:Math.min(devicePixelRatio||1,1.8);
  let yaw=0,pitch=0,walkZ=0,lateral=0,fore=0,manualIndex=0,manualTarget=null,manualSerial=0;
  let prevPoint=new T.Vector3(),heading=new T.Euler(0,0,0,'YXZ');
  canvas.addEventListener('webglcontextlost',lost);
  function lost(e){e.preventDefault();if(!disposed)onLoss?.();}
  function resize(){
    const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);
    if(width===w&&height===h)return;
    width=w;height=h;renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);camera.aspect=w/h;
  }
  function prepare(id){
    if(Array.isArray(id))return Promise.all(id.map(prepare));
    if(!scenes[id])return Promise.reject(Error('알 수 없는 장면 '+id));
    if(prepared.has(id))return Promise.resolve(prepared.get(id));
    if(!inflight.has(id)){
      const room=scenes[id][2];
      if(!roomMaps.has(room))roomMaps.set(room,loadTexture(media+rooms[room]+'.webp').catch(e=>{roomMaps.delete(room);throw e;}));
      inflight.set(id,Promise.all([relief(id),roomMaps.get(room)]).then(([shot,pan])=>{
        if(disposed){shot.dispose();return;}
        shot.panorama=pan;prepared.set(id,shot);inflight.delete(id);return shot;
      }).catch(e=>{inflight.delete(id);throw e;}));
    }
    return inflight.get(id);
  }
  function activate(id){
    const shot=prepared.get(id);if(!shot)return null;
    if(active!==shot){
      if(active)scene.remove(active.group);active=shot;scene.add(shot.group);
      roomMesh.material.map=shot.panorama;roomMesh.material.needsUpdate=true;
      roomMesh.rotation.y=shot.room==='office'?2.65:-1.12;
    }
    return shot;
  }
  function opacity(s,a){s.subject.material.opacity=a;s.backing.material.opacity=a;s.group.visible=a>.002;}
  function setLens(shot,zoom){
    const fit=Math.min(1,shot.aspect/camera.aspect);
    camera.fov=T.MathUtils.radToDeg(2*Math.atan(halfY*fit*zoom));camera.updateProjectionMatrix();
  }
  const cornerRay=new T.Vector3(),limits=[range(1),range(0),9],signs=[-1,1];
  function fitsPhotograph(shot,tangent){
    // The near subjects and far backfill were photographed through the same lens.
    // Check both ends of the depth interval with the current camera translation.
    for(const x of signs)for(const y of signs){
      cornerRay.set(x*tangent*camera.aspect,y*tangent,-1).applyQuaternion(camera.quaternion);
      if(cornerRay.z>-.001)return false;
      for(const depth of limits){
        const t=(-depth-camera.position.z)/cornerRay.z;
        if(Math.abs(camera.position.x+t*cornerRay.x)>depth*halfY*shot.aspect*.992||
           Math.abs(camera.position.y+t*cornerRay.y)>depth*halfY*.992)return false;
      }
    }
    return true;
  }
  function keepFrameInside(shot){
    let upper=Math.tan(radians(camera.fov*.5));
    if(fitsPhotograph(shot,upper))return;
    let lower=0;
    for(let j=0;j<10;j++){
      const test=(lower+upper)*.5;if(fitsPhotograph(shot,test))lower=test;else upper=test;
    }
    camera.fov=T.MathUtils.radToDeg(2*Math.atan(Math.max(.02,lower)));camera.updateProjectionMatrix();
  }
  function draw({id,p=0,phase=0,entryOnly=true,close=false,reduced=false,lean=false,peek=[0,0]}){
    const alternative=id==='safety'&&phase>0?['safety','safety-mounted','safety-control'][phase]:id;
    const s=activate(prepared.has(alternative)?alternative:id);if(!s)return null;
    resize();const q=reduced?.44:clamp(p,0,1), sweep=Math.sin((q-.05)*Math.PI),reverse=(byId.get(id)?.side||1);
    const focus=s.anchors[Math.min(2,phase)],subjectFocus=scenes[s.id][3];
    const mobile=camera.aspect<.91;
    const inRoom=!entryOnly&&!reduced?1-turn(q,.004,.077):0;
    const middle=turn(q,.10,.46),last=turn(q,.60,.93);
    const targetU=mix(mix(subjectFocus[0][0],subjectFocus[1][0],middle),subjectFocus[2][0],last);
    const center=mobile?clamp(targetU,.24,.85):.5+(targetU-.5)*.37;
    const lookAt=pointAt(center,.5,4.8,s.aspect);
    camera.position.set(reverse*mix(-.105,.12,q)+(peek[0]||0)*.13,
      .035*Math.sin(q*Math.PI*1.9),.055-.27*sweep-(lean?.11:0));
    lookAt.x+=reverse*(q-.5)*.31+Math.sin(1.6*q*Math.PI)*.075+(peek[0]||0)*1.7;
    lookAt.y+=.095*Math.cos(q*Math.PI)+(peek[1]||0)*1.1;
    if(lean){lookAt.x=mix(lookAt.x,focus.x*.70,.21);lookAt.y=mix(lookAt.y,focus.y*.62,.21);}
    setLens(s,(close?.81:.865)-sweep*.07-(lean?.055:0));
    camera.lookAt(lookAt);keepFrameInside(s);if(inRoom)camera.rotateY(inRoom*reverse*.64);
    opacity(s,1-inRoom);renderer.render(scene,camera);prevPoint.copy(camera.position);
    const marker=focus.clone().project(camera);
    return {x:(1+marker.x)/2,y:(1-marker.y)/2,z:byId.get(id)?.z??0,visible:inRoom<.12&&marker.z>0&&marker.z<1};
  }
  function startManual(){
    if(!active)return;
    manualSerial++;manualTarget=active.id.startsWith('safety-')?'safety':active.id;manualIndex=Math.max(0,walkOrder.findIndex(x=>x.id===manualTarget));
    walkZ=walkOrder[manualIndex].z;heading.setFromQuaternion(camera.quaternion,'YXZ');
    yaw=heading.y;pitch=heading.x;lateral=prevPoint.x;fore=prevPoint.z;
  }
  function rotate(dx,dy){yaw-=dx*.004;pitch=clamp(pitch-dy*.003,-1.22,1.22);}
  function stepManual(dt){
    resize();
    const travel=Number(keys.has('forward'))-Number(keys.has('back')),strafe=Number(keys.has('right'))-Number(keys.has('left'));
    yaw+=(Number(keys.has('turnleft'))-Number(keys.has('turnright')))*dt*1.45;
    walkZ=clamp(walkZ-travel*Math.cos(yaw)*dt*2.8,walkOrder.at(-1).z,walkOrder[0].z);
    lateral=clamp(lateral+dt*(strafe*Math.cos(yaw)-travel*Math.sin(yaw))*.44,-.35,.35);
    fore=clamp(fore-dt*(travel*Math.cos(yaw)+strafe*Math.sin(yaw))*.32,-.43,.24);
    let idx=manualIndex;for(let i=0;i<walkOrder.length;i++)if(Math.abs(walkOrder[i].z-walkZ)<Math.abs(walkOrder[idx].z-walkZ))idx=i;
    const next=walkOrder[idx].id;
    if(next!==manualTarget){
      manualTarget=next;const token=++manualSerial;
      prepare(next).then(()=>{if(!disposed&&manualSerial===token){activate(next);fore=.14;lateral=0;}}).catch(()=>{if(manualSerial===token)manualTarget=null;});
    }
    manualIndex=idx;camera.position.set(lateral,.018*Math.sin(walkZ*4),fore);
    camera.rotation.set(pitch,yaw,0,'YXZ');
    const deviation=Math.abs(Math.atan2(Math.sin(yaw),Math.cos(yaw)));
    const visibility=(1-turn(deviation,.09,.45))*(1-turn(Math.abs(pitch),.18,.5));
    opacity(active,visibility);setLens(active,.82+.21*(1-visibility));renderer.render(scene,camera);
    return {z:walkZ,nearest:active.id.startsWith('safety-')?'safety':active.id};
  }
  function release(){if(disposed)return;disposed=true;canvas.removeEventListener('webglcontextlost',lost);
    prepared.forEach(s=>s.dispose());roomMesh.geometry.dispose();roomMesh.material.dispose();renderer.dispose();renderer.forceContextLoss();}
  function readyFor(ids){
    const list=Array.isArray(ids)?ids:[ids];
    return prepare(list.includes('safety')?[...list,'safety-mounted','safety-control']:list);
  }
  return {draw,readyFor,prepare,isReady:id=>prepared.has(id)&&(id!=='safety'||prepared.has('safety-control')&&prepared.has('safety-mounted')),resize,keys,rotate,startManual,stepManual,
    lighten(){ratio=Math.max(.7,ratio*.77);width=0;},release,
    stats:()=>({stations:prepared.size,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),
    get pose(){return camera.position.toArray();}};
}
