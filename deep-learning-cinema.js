import * as T from './vendor/three.module.js';
import { STORY_DURATION, storyFrame } from './deep-learning-story.js?v=20260923-dl1';

/** A deterministic, six-shot, physically lit explanation of the learning lifecycle. */
export function mountLearningCinema(host, {onReady,onError,onContextLost,onStage,onProgress,label}={}) {
  const noop={setPaused(){},setStage(){},setTime(){},setLabel(){},dispose(){}};
  let renderer;
  try { renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'}); }
  catch(error){queueMicrotask(()=>onError?.(error));return noop;}
  const canvas=renderer.domElement;
  canvas.className='ziewise-webgl learning-cinema';
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label',label||'Deep learning lifecycle');
  host.append(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene();scene.background=new T.Color('#0b1115');
  scene.fog=new T.Fog('#0b1115',18,40);
  const camera=new T.PerspectiveCamera(35,1,.08,80);
  const resources=new Set(),keep=r=>(resources.add(r),r);
  const g=r=>keep(r), m=r=>keep(r);
  const standard=(color,metalness=.5,roughness=.3,extra={})=>m(new T.MeshStandardMaterial({color,metalness,roughness,...extra}));
  const silver=standard('#aebdc4',.92,.23),brushed=standard('#71838d',.86,.35),dark=standard('#17262e',.75,.3);
  // Fine directional machining marks: geometry remains fully volumetric at every angle.
  const grainData=new Uint8Array(128*128*4);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;grainData[i]=128+Math.round(Math.sin(x*17.1+y*.3)*3);grainData[i+1]=128+Math.round(Math.sin(y*21.7)*12);grainData[i+2]=255;grainData[i+3]=255;}
  const grain=keep(new T.DataTexture(grainData,128,128,T.RGBAFormat));grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(4,4);grain.needsUpdate=true;
  for(const material of [silver,brushed]){material.normalMap=grain;material.normalScale=new T.Vector2(.14,.14);}
  const graphite=standard('#080f14',.4,.4), gold=standard('#b69c66',.85,.28),pcb=standard('#103e42',.65,.38);
  const cyan=standard('#a6ecf2',.4,.2,{emissive:'#5ec2d0',emissiveIntensity:.55});
  const amber=standard('#e3aa63',.5,.25,{emissive:'#cf8133',emissiveIntensity:.55});
  const glass=standard('#538d9b',.25,.16,{transparent:true,opacity:.13,depthWrite:false,side:T.DoubleSide});
  function mesh(parent,geometry,material,pos=[0,0,0]) {const o=new T.Mesh(geometry,material);o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function box(parent,size,pos,mat=dark){return mesh(parent,g(new T.BoxGeometry(...size)),mat,pos);}
  function cylinder(parent,radius,height,pos,mat=silver){return mesh(parent,g(new T.CylinderGeometry(radius,radius,height,64)),mat,pos);}
  function tube(parent,points,radius,mat){const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));mesh(parent,g(new T.TubeGeometry(path,48,radius,6,false)),mat);return path;}
  function line(parent,points,color,opacity=.35){const geo=g(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))));const mat=m(new T.LineBasicMaterial({color,transparent:true,opacity}));const o=new T.Line(geo,mat);parent.add(o);return o;}
  function group(parent=scene){const o=new T.Group();parent.add(o);return o;}
  const environmentScene=new T.Scene();environmentScene.background=new T.Color('#263540');
  for(const [w,h,pos,strength] of [[8,3,[-4,7,2],5],[2,7,[6,4,-2],4],[6,2,[0,5,-6],3],[3,2,[-5,1,4],1]]){
    const p=mesh(environmentScene,g(new T.PlaneGeometry(w,h)),m(new T.MeshBasicMaterial({color:new T.Color('white').multiplyScalar(strength),side:T.DoubleSide})),pos);p.lookAt(0,1,0);
  }
  let environment;
  function makeEnvironment(){environment?.dispose();const generator=new T.PMREMGenerator(renderer);environment=generator.fromScene(environmentScene,.06,.1,50);scene.environment=environment.texture;generator.dispose();}
  makeEnvironment();
  scene.add(new T.HemisphereLight('#d8efff','#16212b',1.5));
  const key=new T.DirectionalLight('#f2f7ff',3.5);key.position.set(-3,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;key.shadow.normalBias=.025;scene.add(key);
  const rim=new T.DirectionalLight('#93d9ed',2.5);rim.position.set(4,4,-5);scene.add(rim);
  const warm=new T.DirectionalLight('#e4cba6',1.2);warm.position.set(-6,2,-2);scene.add(warm);
  const floor=mesh(scene,g(new T.PlaneGeometry(100,100)),standard('#12212a',.65,.35),[0,-.31,0]);floor.rotation.x=-Math.PI/2;
  // Architectural scale and long softbox reflections anchor every shot in the same studio.
  for(let i=-5;i<=5;i++){
    box(scene,[.018,9,.035],[i*2.1,4,-6],brushed);
    box(scene,[2.04,9,.07],[i*2.1+1.05,4,-6.08],graphite);
  }
  const acts=Array.from({length:7},()=>group());
  const boltGeo=g(new T.CylinderGeometry(.055,.055,.025,6));
  function bolts(parent,x,z,y){for(const sx of [-1,1])for(const sz of [-1,1])mesh(parent,boltGeo,brushed,[x*sx,y,z*sz]);}
  function part(parent,pos=[0,0,0]){
    const root=group(parent);root.position.set(...pos);
    const shape=new T.Shape();shape.absarc(0,0,.86,0,Math.PI*2,false);
    const hole=new T.Path();hole.absarc(0,0,.35,0,Math.PI*2,true);shape.holes.push(hole);
    const piece=mesh(root,g(new T.ExtrudeGeometry(shape,{depth:.26,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.035,bevelThickness:.035,curveSegments:80})),silver);
    piece.rotation.x=-Math.PI/2;
    for(const r of [.39,.45,.73,.79]){const ring=mesh(root,g(new T.TorusGeometry(r,.007,4,96)),brushed,[0,.299,0]);ring.rotation.x=-Math.PI/2;}
    for(let i=0;i<8;i++){const a=i*Math.PI/4;cylinder(root,.065,.011,[Math.cos(a)*.6,.30,Math.sin(a)*.6],graphite);}
    const scratch=line(root,[[.48,.307,.18],[.6,.31,.22],[.63,.31,.34],[.77,.307,.40]],'#3f2618',1);
    const highlight=line(root,[[.47,.312,.19],[.6,.316,.23],[.63,.316,.35],[.76,.312,.41]],'#f3b573',.8);
    return {root,scratch,highlight};
  }
  function factory(parent,output=false){
    const root=group(parent);
    box(root,[5.5,.18,2.55],[0,.45,0],dark);
    for(const x of [-2.4,2.4])for(const z of [-1,1])box(root,[.16,.75,.16],[x,.08,z],brushed);
    const rollerGeo=g(new T.CylinderGeometry(.1,.1,2.28,24));
    const rollers=[];for(let i=0;i<23;i++){const roller=mesh(root,rollerGeo,silver,[-2.5+i*.228,.59,0]);roller.rotation.x=Math.PI/2;rollers.push(roller);}
    for(const z of [-1.26,1.26])box(root,[5.65,.25,.13],[0,.63,z],brushed);
    const product=part(root,[0,.71,0]);
    // Extruded aluminium gantry, optical lens, ring light and connected camera housing.
    for(const x of [-1.8,1.8]){box(root,[.16,2.8,.2],[x,1.75,-.96],brushed);box(root,[.025,2.6,.025],[x,1.8,-.847],graphite);}
    box(root,[3.9,.16,.22],[0,3.13,-.96],brushed);box(root,[.5,.16,1.3],[0,3.05,-.44],dark);
    box(root,[.57,.48,.55],[0,2.81,.03],dark);bolts(root,.2,.19,3.06);
    cylinder(root,.24,.17,[0,2.51,.03],graphite);cylinder(root,.20,.035,[0,2.409,.03],cyan);
    cylinder(root,.12,.04,[0,2.38,.03],graphite);
    for(let i=0;i<5;i++)cylinder(root,.247,.012,[0,2.46+i*.03,.03],brushed);
    const lens=standard('#244d69',.55,.075,{emissive:'#163b51',emissiveIntensity:.25});
    cylinder(root,.106,.008,[0,2.355,.03],lens);
    for(let i=0;i<7;i++)box(root,[.59,.018,.575],[0,2.66+i*.044,.03],brushed);
    for(const x of [-1.8,1.8])for(const y of [1.1,2.9]){const fastener=mesh(root,boltGeo,silver,[x,y,-.83]);fastener.rotation.x=Math.PI/2;}
    tube(root,[[0,3.09,-.1],[.2,3.5,-.3],[1.5,3.55,-.7],[1.8,2.6,-1.1]],.035,graphite);
    const beam=mesh(root,g(new T.ConeGeometry(.88,1.34,4,1,true)),m(new T.MeshBasicMaterial({color:'#a0e0ef',transparent:true,opacity:.045,depthWrite:false,side:T.DoubleSide})),[0,1.67,.03]);beam.rotation.y=Math.PI/4;
    const scan=box(root,[1.85,.005,.018],[0,1.04,-.7],cyan);
    const outline=group(root);outline.position.set(.62,1.035,.3);
    for(const z of [-.18,.18])box(outline,[.46,.008,.012],[0,0,z],amber);
    for(const x of [-.23,.23])box(outline,[.012,.008,.36],[x,0,0],amber);
    outline.visible=output;
    const gate=group(root);gate.position.set(2,1.05,1.1);box(gate,[.15,.42,.15],[0,0,0],dark);box(gate,[.95,.09,.1],[-.42,.16,0],amber);
    gate.visible=output;
    const lamp=cylinder(root,.06,.17,[-1.8,3.34,-.96],output?amber:cyan);
    if(output){const edgeUnit=group(root);edgeUnit.position.set(2.05,1.5,-.7);box(edgeUnit,[.7,.9,.42],[0,0,0],dark);for(let i=0;i<10;i++)box(edgeUnit,[.75,.035,.45],[0,-.35+i*.073,0],brushed);}
    return {root,product,scan,beam,outline,rollers,gate,lamp};
  }
  const capture=factory(acts[0]);
  // Feature maps are deterministic renderings of the same annular component and scratch.
  const featureMaps=[];
  function featureTexture(index){
    const c=document.createElement('canvas');c.width=c.height=384;const ctx=c.getContext('2d');ctx.fillStyle='#09171f';ctx.fillRect(0,0,384,384);
    const grid=32,cell=384/grid;
    for(let y=0;y<grid;y++)for(let x=0;x<grid;x++){
      const nx=(x-15.5)/13,ny=(y-15.5)/13,r=Math.hypot(nx,ny),a=Math.atan2(ny,nx);
      const ring=r>.40&&r<.95,edge=Math.abs(r-.95)<.075||Math.abs(r-.4)<.075;
      const scratch=ring&&Math.abs(ny-(nx*.78-.06))<.075&&nx>.46;
      let v=index===0?(ring?.48+Math.sin(a*2)*.23:0):index===1?(edge?.75:.025):index===2?(ring?.23+.23*Math.sin(r*84):.01):(scratch?1:edge?.08:0);
      if(scratch&&index===0)v=.09;
      ctx.fillStyle=index===3&&scratch?`rgb(244,177,91)`:`rgb(${Math.round(45+v*134)},${Math.round(70+v*154)},${Math.round(81+v*162)})`;
      if(v>.015)ctx.fillRect(x*cell+1,y*cell+1,cell-2,cell-2);
    }
    const map=keep(new T.CanvasTexture(c));map.colorSpace=T.SRGBColorSpace;return map;
  }
  const sharedFeatures=Array.from({length:4},(_,i)=>featureTexture(i));
  for(let i=0;i<4;i++){
    const panel=group(acts[1]);panel.position.set(-2.1+i*1.38,1.8,-i*.52+.6);
    box(panel,[1.73,1.73,.07],[0,0,0],dark);
    mesh(panel,g(new T.PlaneGeometry(1.59,1.59)),m(new T.MeshBasicMaterial({map:sharedFeatures[i]})),[0,0,.041]);
    for(const y of [-.89,.89])box(panel,[1.86,.025,.09],[0,y,0],brushed);
    for(const x of [-.92,.92])box(panel,[.025,1.8,.09],[x,0,0],brushed);
    box(panel,[.2,.025,.02],[-.67,-1.02,.01],i===3?amber:cyan);featureMaps.push(panel);
  }
  const featurePart=part(acts[1],[-2.2,.08,1]);featurePart.root.scale.setScalar(.72);
  const featurePackets=[];
  for(let i=0;i<18;i++){const dot=mesh(acts[1],g(new T.SphereGeometry(.025,8,6)),cyan);featurePackets.push(dot);}
  // An explicit layered network: cyan forward activations, amber error propagation.
  const net=group(acts[2]);net.position.y=1.72;
  const nodes=[],edges=[],layers=[];
  const nodeGeo=g(new T.SphereGeometry(.067,14,10));
  for(let l=0;l<5;l++){
    const layer=group(net);layer.position.x=-2.4+l*1.2;layers.push(layer);
    box(layer,[.025,2.85,2.22],[0,0,0],glass);
    for(const y of [-1.43,1.43])box(layer,[.03,.025,2.25],[0,y,0],brushed);
    for(const z of [-1.12,1.12])box(layer,[.03,2.85,.025],[0,0,z],brushed);
    const count=l===4?2:12;
    const groupNodes=[];
    for(let n=0;n<count;n++){
      const position=new T.Vector3(layer.position.x, count===2?(n-.5)*1.1:(Math.floor(n/3)-1.5)*.62,(n%3-1)*.66);
      const mat=standard('#70b4c1',.55,.22,{emissive:'#6ed9ea',emissiveIntensity:.2});
      const dot=mesh(net,nodeGeo,mat,position.toArray());nodes.push({dot,layer:l,n});groupNodes.push(position);
    }
    if(l)for(let a=0;a<layers[l-1].userData.points.length;a++)for(let b=0;b<groupNodes.length;b++){
      if((a+b)%3!==0&&l!==4)continue;
      const p=layers[l-1].userData.points[a],q=groupNodes[b];
      const link=line(net,[p.toArray(),q.toArray()],'#7bb9c8',.16);edges.push({link,p,q,layer:l-1,index:a+b});
    }
    layer.userData.points=groupNodes;
  }
  const neuralPulses=edges.filter((_,i)=>i%3===0).map(edge=>({edge,dot:mesh(net,g(new T.SphereGeometry(.03,8,6)),cyan)}));
  box(acts[2],[6.25,.16,3.2],[0,.04,0],dark);bolts(acts[2],2.94,1.39,.14);
  const gateRoot=group(acts[3]);
  const validationCards=[];
  for(let i=0;i<6;i++){
    const card=group(gateRoot);card.position.set(-2.35+(i%3)*.83,.6+Math.floor(i/3)*1.05,.05);
    box(card,[.72,.9,.07],[0,0,0],brushed);
    mesh(card,g(new T.PlaneGeometry(.63,.72)),m(new T.MeshBasicMaterial({map:sharedFeatures[i%2?3:0]})),[0,.03,.04]);
    validationCards.push(card);
  }
  const modelBlock=box(gateRoot,[1.08,1.08,1.08],[.3,1.5,0],dark);bolts(gateRoot,.4,.4,2.055);
  const modelBadge=box(gateRoot,[.62,.62,.025],[.3,1.5,.555],cyan);
  const validationGate=group(gateRoot);validationGate.position.set(2.13,1.3,0);
  box(validationGate,[.12,2.5,.4],[-.75,0,0],brushed);box(validationGate,[.12,2.5,.4],[.75,0,0],brushed);
  box(validationGate,[1.65,.12,.4],[0,1.28,0],brushed);
  const gateBar=box(validationGate,[1.4,.07,.09],[0,.15,0],amber);
  const validationPass=box(validationGate,[.52,.04,.42],[0,-1.1,.0],cyan);
  const validationPaths=[];for(let i=0;i<6;i++)validationPaths.push(line(gateRoot,[validationCards[i].position.toArray(),[.3,1.5,.1]],'#8fbfc9',.3));
  function circuit(parent){
    const root=group(parent);root.position.y=.75;
    box(root,[4.75,.13,3.5],[0,0,0],pcb);bolts(root,2.17,1.55,.095);
    box(root,[1.84,.14,1.84],[0,.13,0],graphite);
    const chip=box(root,[1.51,.11,1.51],[0,.26,0],silver);
    box(root,[1.13,.017,1.13],[0,.324,0],dark);
    for(let i=0;i<22;i++)for(const side of [-1,1]){
      box(root,[.025,.03,.16],[-.83+i*.079,.16,side*1.0],gold);
      box(root,[.16,.03,.025],[side*1.0,.16,-.83+i*.079],gold);
    }
    for(let i=0;i<10;i++){
      const z=-1.3+i*.28;
      for(const side of [-1,1]){
        line(root,[[side*.96,.083,z*.55],[side*1.34,.083,z*.55],[side*1.53,.083,z],[side*2.1,.083,z]],'#82bdba',.7);
        box(root,[.27,.13,.11],[side*1.94,.17,z],graphite);
        box(root,[.05,.14,.12],[side*1.79,.17,z],gold);
      }
    }
    for(const z of [-1.36,1.36])for(let i=0;i<5;i++)box(root,[.28,.18,.24],[-.8+i*.4,.17,z],dark);
    return {root,chip};
  }
  const deployment=circuit(acts[4]);
  const packageRoot=group(acts[4]);
  const modelPackage=box(packageRoot,[.82,.19,.82],[0,2.6,0],cyan);
  for(let i=0;i<4;i++)box(packageRoot,[.86,.012,.86],[0,2.5+i*.06,0],brushed);
  const deploymentPath=tube(acts[4],[[0,3.8,0],[0,2.5,0],[0,1.1,0]],.012,cyan);
  const transferDots=Array.from({length:8},()=>mesh(acts[4],g(new T.SphereGeometry(.035,8,6)),cyan));
  const rackMat=standard('#c4d5da',.15,.58);
  const rack=box(acts[4],[1.3,3.2,.75],[-2.7,1.4,-1.6],dark);
  const rackFace=mesh(acts[4],g(new T.PlaneGeometry(1.13,2.9)),rackMat,[-2.7,1.42,-1.219]);
  const loader=new T.TextureLoader();
  loader.load('assets/rack-front-photo-v1.webp',texture=>{if(disposed){texture.dispose();return;}keep(texture);texture.colorSpace=T.SRGBColorSpace;rackMat.map=texture;rackMat.emissiveMap=texture;rackMat.emissive=new T.Color('#a5bbc2');rackMat.emissiveIntensity=.15;rackMat.needsUpdate=true;render();},undefined,()=>{});
  const inference=factory(acts[5],true);
  const feedbackPath=tube(acts[5],[[1.8,1.8,-.7],[2.6,2.8,-1.5],[0,3.8,-2.2],[-2.7,2.9,-1],[-1.8,1.3,0]],.011,cyan);
  const feedbackDots=Array.from({length:12},()=>mesh(acts[5],g(new T.SphereGeometry(.032,10,8)),cyan));
  const before=factory(acts[6]),after=factory(acts[6],true);
  before.root.scale.setScalar(.57);before.root.position.set(-1.95,.05,.65);
  after.root.scale.setScalar(.57);after.root.position.set(1.95,.05,-.65);
  const valueBars=[];
  for(let i=0;i<2;i++){
    const old=box(acts[6],[1.5,.06,.055],[-1.95,.08,1.65+i*.16],amber);
    const next=box(acts[6],[1.5,.06,.055],[1.95,.08,.4+i*.16],cyan);
    valueBars.push({old,next});
  }
  let valueRatios=[.5,.8];
  function onROI(event){valueRatios=[event.detail.timeRatio,event.detail.lossRatio];render();}
  window.addEventListener('ziewise:roi',onROI);
  const comparison=document.createElement('div');comparison.className='learning-comparison';comparison.setAttribute('aria-hidden','true');
  comparison.innerHTML='<span></span><span></span>';host.append(comparison);
  function comparisonLabels(){const en=document.documentElement.lang==='en';comparison.children[0].textContent=en?'CURRENT PROCESS':'현재 검사 흐름';comparison.children[1].textContent=en?'WITH AI · ASSUMPTION':'AI 도입 후 · 가정';}
  comparisonLabels();

  let time=0,paused=true,visible=true,disposed=false,lost=false,frame=0,last=0,lastStage=-1,lastReport=-1;
  let restoreTimer=0,compact=false;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let reduceMotion=reduce.matches,manual=false;
  const view=new T.Vector3(),aim=new T.Vector3();
  const shots=[
    {from:[5.4,4.2,7.7],to:[3.3,3.4,6.5],aim:[0,1.3,0]},
    {from:[5.5,3.7,8.5],to:[3.6,2.9,7.6],aim:[0,1.5,-.25]},
    {from:[6,3.6,7.8],to:[4.6,2.8,8.5],aim:[0,1.6,0]},
    {from:[4.5,3.0,8.8],to:[2.8,2.5,8.4],aim:[0,1.2,0]},
    {from:[5.1,5.8,7],to:[3.6,4.7,5.9],aim:[-.3,1.0,-.1]},
    {from:[4.4,3.7,7.6],to:[6.1,4.3,8.1],aim:[0,1.6,0]},
    {from:[5.7,5.3,9.7],to:[4.6,4.5,9.5],aim:[0,1.0,0]}
  ];
  function updateScene(){
    const f=storyFrame(time),p=f.progress,stage=f.chapter;
    acts.forEach((act,i)=>{act.visible=i===stage;});
    // Brief camera moves between composed shots; never a fast spin or flashing transition.
    const shot=shots[stage],e=T.MathUtils.smoothstep(p,0,1);
    view.fromArray(shot.from).lerp(new T.Vector3(...shot.to),e);
    aim.fromArray(shot.aim);
    if(compact)view.sub(aim).multiplyScalar(1.22).add(aim);
    camera.position.copy(view);camera.lookAt(aim);
    capture.product.root.position.x=-.45+.9*T.MathUtils.smoothstep(p,0,1);
    capture.scan.position.z=Math.sin(p*Math.PI*4)*.77;
    capture.rollers.forEach(r=>r.rotation.y=time*.16);
    capture.product.highlight.material.opacity=.4+.3*Math.sin(time*2);
    featureMaps.forEach((o,i)=>{o.position.y=1.8+Math.sin(p*Math.PI*2-i*.5)*.08;o.rotation.y=-.15+Math.sin(p*Math.PI)*.12;});
    featurePackets.forEach((o,i)=>{const u=(p*1.6+i/18)%1;o.position.set(-2.1+u*4.14,1.8+Math.sin(i*2.4)*.45,.64-u*1.56);});
    const cycle=(p*3)%1,backward=cycle>.55,pass=backward?(1-cycle)/.45:cycle/.55;
    const cursor=pass*4;
    nodes.forEach(({dot,layer,n})=>{const active=Math.max(0,1-Math.abs(layer-cursor)*1.4);dot.material.emissive.set(backward?'#efa653':'#78deee');dot.material.emissiveIntensity=.08+active*1.8;dot.scale.setScalar(1+active*.4);});
    edges.forEach(({link,layer,index})=>{link.material.color.set(backward?'#c99657':'#80c9dc');link.material.opacity=.07+.32*Math.max(0,1-Math.abs(layer+.5-cursor))+(Math.sin(index*3+p*8)+1)*.012;});
    neuralPulses.forEach(({edge,dot},i)=>{dot.visible=Math.abs(edge.layer+.5-cursor)<1;const u=(time*.75+i*.21)%1;dot.position.lerpVectors(edge.p,edge.q,backward?1-u:u);dot.material=backward?amber:cyan;});
    validationCards.forEach((card,i)=>{card.position.z=Math.sin(time+i*.5)*.04;});
    const passed=p>.55;modelBadge.material=passed?cyan:amber;gateBar.position.y=passed?.95:.15;validationPass.visible=passed;
    modelBlock.position.x=passed?.3+T.MathUtils.smoothstep(p,.55,.94)*1.8:.3;
    modelBadge.position.x=modelBlock.position.x;
    packageRoot.position.y=-1.45*T.MathUtils.smoothstep(p,.12,.72);
    modelPackage.material=cyan;deployment.chip.material=p>.7?cyan:silver;
    transferDots.forEach((dot,i)=>{dot.position.copy(deploymentPath.getPoint((p*1.3+i/8)%1));dot.visible=p<.8;});
    inference.scan.position.z=Math.sin(p*Math.PI*4)*.7;
    inference.outline.visible=p>.17;
    inference.gate.rotation.y=p>.45?-.45:0;
    feedbackDots.forEach((dot,i)=>{dot.position.copy(feedbackPath.getPoint((p*1.5+i/12)%1));dot.visible=p>.45;});
    after.scan.position.z=Math.sin(time)*.7;
    valueBars.forEach(({next},i)=>{next.scale.x=1-(1-valueRatios[i])*T.MathUtils.smoothstep(p,0,.55);});
    comparison.hidden=stage!==6;
    if(stage===6){camera.updateMatrixWorld();[[-1.95,2.25,.65],[1.95,2.25,-.65]].forEach((point,i)=>{const v=new T.Vector3(...point).project(camera);comparison.children[i].style.left=`${(v.x+1)*50}%`;comparison.children[i].style.top=`${(-v.y+1)*50}%`;});}
    host.dataset.chapter=stage;host.dataset.learningDirection=backward?'backward':'forward';
    if(stage!==lastStage){lastStage=stage;onStage?.(stage);}
    if(Math.abs(time-lastReport)>.08||lastReport<0){lastReport=time;onProgress?.(f.seconds,f);}
  }
  function render(){if(disposed||lost)return;updateScene();renderer.render(scene,camera);}
  const canAnimate=()=>!disposed&&!lost&&!paused&&visible&&!document.hidden&&(!reduceMotion||manual);
  function tick(now){frame=0;if(!canAnimate())return;if(last&&now-last<32){frame=requestAnimationFrame(tick);return;}const delta=last?Math.min((now-last)/1000,.15):0;last=now;time=(time+delta)%STORY_DURATION;render();frame=requestAnimationFrame(tick);}
  function sync(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;if(canAnimate())frame=requestAnimationFrame(tick);}
  function resize(){if(disposed)return;const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);compact=w/h<1.1;camera.aspect=w/h;camera.fov=compact?43:35;camera.updateProjectionMatrix();renderer.setSize(w,h,false);render();}
  const ro=new ResizeObserver(resize);ro.observe(host);
  const io=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);sync();});io.observe(host);
  function onReduce(){reduceMotion=reduce.matches;manual=false;sync();}
  function onLost(event){event.preventDefault();lost=true;sync();onContextLost?.();restoreTimer=setTimeout(()=>{if(lost&&!disposed)onError?.(new Error('3D context lost'));},5000);}
  function onRestored(){if(disposed)return;clearTimeout(restoreTimer);lost=false;makeEnvironment();resize();onReady?.();sync();}
  canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',onRestored);
  document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',onReduce);
  resize();queueMicrotask(()=>{if(!disposed)onReady?.();});
  return {
    setPaused(value,{manual:chosen=false}={}){paused=!!value;if(chosen&&!paused)manual=true;sync();},
    setStage(stage){time=T.MathUtils.clamp(Math.trunc(stage),0,6)*10;lastReport=-1;render();},
    setTime(seconds){time=T.MathUtils.clamp(Number(seconds)||0,0,STORY_DURATION-.001);lastReport=-1;render();},
    setLabel(value){canvas.setAttribute('aria-label',value);comparisonLabels();},
    dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);clearTimeout(restoreTimer);ro.disconnect();io.disconnect();document.removeEventListener('visibilitychange',sync);window.removeEventListener('ziewise:roi',onROI);reduce.removeEventListener('change',onReduce);canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);resources.forEach(r=>r.dispose());environment?.dispose();renderer.dispose();canvas.remove();comparison.remove();}
  };
}
