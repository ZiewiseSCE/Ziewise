/* Rigged high-visibility worker. Local +Z is the source walking direction.
 * See LICENSE-GRAB3D.txt and CREDITS.txt for asset provenance. */
const applied = new WeakMap();
const file = new URL('./safety-worker.glb', import.meta.url);
const limit = v => Math.max(0,Math.min(1,v));
const smooth = (a,b,x) => {const t=limit((x-a)/(b-a));return t*t*(3-2*t);};

// A neutral stance is derived from opposing poses of the same 24-joint walk.
// Hands stay at the worker's sides while waiting at the marked crossing.
function waitingClip(T,walk) {
  const tracks=[],duration=3.2,times=[0,.8,1.6,2.4,3.2];
  for(const track of walk.tracks){
    const quaternion=track.name.endsWith('.quaternion');
    const width=track.getValueSize(),sum=new Float64Array(width);
    const interp=track.createInterpolant(),ref=Array.from(interp.evaluate(0));
    for(let i=0;i<20;i++){
      const v=interp.evaluate(walk.duration*i/20);
      const sign=quaternion&&v[0]*ref[0]+v[1]*ref[1]+v[2]*ref[2]+v[3]*ref[3]<0?-1:1;
      for(let k=0;k<width;k++)sum[k]+=sign*v[k]/20;
    }
    if(quaternion){
      const base=new T.Quaternion().fromArray(sum).normalize(),delta=new T.Quaternion();
      const axis=new T.Vector3(0,1,0),amp=track.name.startsWith('Head.')?.028:track.name.startsWith('Spine.')?.009:0;
      const values=[];
      for(let i=0;i<times.length;i++){
        delta.setFromAxisAngle(axis,Math.sin(i*Math.PI*.5)*amp);
        values.push(...base.clone().multiply(delta).toArray());
      }
      tracks.push(new T.QuaternionKeyframeTrack(track.name,times,values));
    }else{
      tracks.push(new T.VectorKeyframeTrack(track.name,[0,duration],[...sum,...sum]));
    }
  }
  return new T.AnimationClip('standing observation',duration,tracks);
}

// A few sole samples provide real skin-deformed floor contact for any mix of
// walking and standing, without evaluating a 42,000-triangle box every frame.
function plantSoles(T,scene,carrier){
  let mesh=null;scene.traverse(node=>{if(node.isSkinnedMesh)mesh=node;});
  if(!mesh)return ()=>{};
  const source=mesh.geometry.getAttribute('position'),candidates=[];
  for(let i=0;i<source.count;i++)if(source.getY(i)<.074)candidates.push(i);
  const ids=[];
  for(let i=0;i<Math.min(120,candidates.length);i++)ids.push(candidates[Math.floor(i*candidates.length/Math.min(120,candidates.length))]);
  const local=new T.Matrix4(),point=new T.Vector3();
  return function(){
    if(!ids.length)return;
    scene.position.y=0;carrier.updateWorldMatrix(true,false);
    // SkinnedMesh refreshes its attached bind inverse in updateMatrixWorld.
    scene.updateMatrixWorld(true);
    local.copy(carrier.matrixWorld).invert().multiply(mesh.matrixWorld);
    let bottom=Infinity;
    for(const i of ids)bottom=Math.min(bottom,mesh.getVertexPosition(i,point).applyMatrix4(local).y);
    if(Number.isFinite(bottom)){scene.position.y=.018-bottom;scene.updateMatrixWorld(true);}
  };
}

function crossingDistance(t){
  const edge=.12,s=limit(t);
  if(s<edge)return s*s/(2*edge*(1-edge));
  if(s>1-edge)return 1-(1-s)*(1-s)/(2*edge*(1-edge));
  return (s-edge/2)/(1-edge);
}

/**
 * Preserve the original articulated station, camera, guardrail and event
 * signal. Only the children of its moving 'walkway operator' are exchanged.
 * Pass the site's same-instance GLTFLoader as the third argument.
 */
export function replaceSafetyWorker(T,station,loader) {
  if(applied.has(station))return applied.get(station);
  const carrier=station.getObjectByName('walkway operator');
  let animate=null,last=0;
  const controller={ready:null,update(p){last=limit(Number.isFinite(p)?p:0);if(animate)animate(last);}};
  applied.set(station,controller);
  if(!carrier||!loader?.loadAsync){controller.ready=Promise.resolve(false);return controller;}
  carrier.userData.dynamic=true;
  const original=[...carrier.children];
  controller.ready=loader.loadAsync(file.href).then(gltf=>{
    const walk=T.AnimationClip.findByName(gltf.animations,'walk');
    if(!walk)throw new Error('Safety worker has no gait clip');
    const actor=gltf.scene;actor.name='clothed safety operator';
    actor.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;n.frustumCulled=false;}});
    const mixer=new T.AnimationMixer(actor),wait=waitingClip(T,walk);
    const stepping=mixer.clipAction(walk).play(),standing=mixer.clipAction(wait).play();
    carrier.add(actor);const ground=plantSoles(T,actor,carrier);
    // Based on the authored gait's heel/toe displacement during the planted
    // phase: about 1.31 m per full left/right cycle. The narration lasts 18.94 s.
    animate=p=>{
      const time=p*18.935,s=(p-.435)/.115,d=crossingDistance(s);
      const mix=smooth(-.09,.15,s)*(1-smooth(.83,1.15,s));
      stepping.setEffectiveWeight(mix);standing.setEffectiveWeight(1-mix);
      stepping.time=(.23+d*Math.hypot(1.21,.17)/1.31)*walk.duration%walk.duration;
      standing.time=time%wait.duration;mixer.update(0);
      carrier.position.x=-.67+1.21*d;carrier.position.z=.20-.17*d;
      carrier.rotation.y=1.20+.510*smooth(-.45,.08,s)-.19*smooth(.93,1.50,s);
      ground();
    };
    for(const o of original)o.removeFromParent();
    animate(last);return true;
  }).catch(()=>false);
  return controller;
}
