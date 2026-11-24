/*
 * UR10e visuals are from the ROS Industrial Consortium model distributed
 * by Google DeepMind's MuJoCo Menagerie. See LICENSE-UR10E.txt and CREDITS.txt.
 * Geometry is metric. The tour uses Y up; enclosed robot frames use MJCF Z up.
 */
const resources = new WeakMap();
const installed = new WeakMap();
const modelUrl = new URL('./ur10e-visual.bin', import.meta.url);
const pi = Math.PI;
const positions = [[0,0,.181],[0,.176,0],[0,-.137,.613],[0,0,.571],[0,.135,0],[0,0,.12]];
const axes = [[0,0,1],[0,1,0],[0,1,0],[0,1,0],[0,0,1],[0,1,0]];
const frames = [0,pi/2,0,pi/2,0,0];
// Inverse-kinematic keyframes: approach, align, inspect the bore, traverse a
// machined face, withdraw. q1..q6 are rotations about the actual joint axes.
const trajectory = [
  [0,   [.2983669,-1.6835766,1.4162096,-1.3688990,-1.4246996,1.9939559]],
  [.30, [.4991066,-1.0334697,1.3142918,-1.9222402,-1.4799597,2.2331140]],
  [.53, [.5301719,-.7325915,.9276779,-1.8286856,-1.5134803,2.4027691]],
  [.73, [.4670907,-.6823829,.8240717,-1.8066346,-1.4810205,2.3821192]],
  [1,   [.4738584,-1.0987709,1.2540728,-1.7582490,-1.5261643,2.1953724]]
];

function makeFinishes(T) {
  const standard=(name,color,metalness,roughness)=>
    new T.MeshStandardMaterial({name,color,metalness,roughness});
  const rubber=standard('moulded seals',0x292d30,.06,.69);
  const casting=standard('blast-finished aluminium housings',0x828b92,.68,.38);
  const silver=standard('spun aluminium tube',0xc3cbcb,.87,.29);
  const blue=new T.MeshPhysicalMaterial({name:'UR blue joint covers',color:0x77aac7,
    metalness:.12,roughness:.37,clearcoat:.30,clearcoatRoughness:.31});
  const powder=standard('pedestal blue-black powder coat',0x344441,.45,.47);
  const zinc=standard('galvanized fixing',0xa4ada7,.75,.34);
  const barrel=standard('black anodized lens barrel',0x252e30,.76,.31);
  const dark=standard('optics anodized chassis',0x374141,.59,.41);
  const gold=standard('connector nickel-brass',0xad9772,.77,.31);
  const optical=new T.MeshPhysicalMaterial({name:'multi-coated lens',color:0x16424a,metalness:.57,
    roughness:.10,clearcoat:1,clearcoatRoughness:.08});
  const opal=standard('ring diffuser',0xd4e2dd,.11,.32);
  opal.emissive.setHex(0xcadbd3);opal.emissiveIntensity=.70;
  // Fine cast texture affects the broad specular lobe and never paints a
  // highlight onto the parts. UV density is constant in metre coordinates.
  const pixels=new Uint8Array(96*96*4),brushed=new Uint8Array(pixels.length);
  let seed=951;
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const r=seed/4294967296,n=x*4+y*96*4,cast=190+Math.round(55*r);
    const grain=205+Math.round(15*Math.sin(y*3.6)+8*Math.sin(y*1.17)+15*r);
    pixels[n]=pixels[n+1]=pixels[n+2]=cast;pixels[n+3]=255;
    brushed[n]=brushed[n+1]=brushed[n+2]=grain;brushed[n+3]=255;
  }
  function map(bytes){
    const t=new T.DataTexture(bytes,96,96);
    t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;
    t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=3;t.needsUpdate=true;return t;
  }
  const shot=map(pixels),brush=map(brushed);
  for(const m of [casting,powder,dark,blue]){m.roughnessMap=shot;m.bumpMap=shot;m.bumpScale=.00019;}
  for(const m of [silver,zinc,barrel])m.roughnessMap=brush;
  return {cad:[rubber,casting,silver,blue],rubber,casting,silver,blue,powder,zinc,barrel,dark,gold,optical,opal};
}

async function readVisuals(T) {
  const response=await fetch(modelUrl,{credentials:'same-origin'});
  if(!response.ok)throw new Error('UR10e visual asset '+response.status);
  let buffer=await response.arrayBuffer();
  // Hosts may serve the packed file as an opaque binary or pre-decompress it.
  if(new Uint8Array(buffer,0,2)[0]===31&&new Uint8Array(buffer,0,2)[1]===139){
    if(typeof DecompressionStream==='undefined')throw new Error('Gzip geometry decoding unavailable');
    const stream=new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
    buffer=await new Response(stream).arrayBuffer();
  }
  const header=new TextDecoder().decode(new Uint8Array(buffer,0,8));
  if(header!=='UR10VIS1')throw new Error('Unexpected UR10e geometry header');
  const data=new DataView(buffer),count=data.getUint32(8,true);
  const meshes=[];let at=12;
  for(let k=0;k<count;k++){
    const link=data.getUint8(at),material=data.getUint8(at+1),width=data.getUint8(at+2);
    const nv=data.getUint32(at+4,true),ni=data.getUint32(at+8,true);
    const min=[0,1,2].map(i=>data.getFloat32(at+12+i*4,true));
    const span=[0,1,2].map(i=>data.getFloat32(at+24+i*4,true));at+=36;
    if(nv>100000||ni>300000||link>6||material>3||![2,4].includes(width)||at+nv*8+ni*width>buffer.byteLength)throw new Error('Invalid UR10e geometry group');
    const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),uv=new Float32Array(nv*2);
    for(let j=0;j<nv;j++,at+=8){
      for(let a=0;a<3;a++)pos[j*3+a]=min[a]+data.getUint16(at+2*a,true)/65535*span[a];
      let x=data.getInt8(at+6)/127,y=data.getInt8(at+7)/127,z=1-Math.abs(x)-Math.abs(y);
      if(z<0){const ox=x;x=(1-Math.abs(y))*(ox<0?-1:1);y=(1-Math.abs(ox))*(y<0?-1:1);}
      const len=Math.hypot(x,y,z)||1;nor[j*3]=x/len;nor[j*3+1]=y/len;nor[j*3+2]=z/len;
      const X=pos[j*3],Y=pos[j*3+1],Z=pos[j*3+2];
      const ax=Math.abs(x),ay=Math.abs(y),az=Math.abs(z);
      uv[j*2]=12*(ax>=ay&&ax>=az?Y:X);
      uv[j*2+1]=12*(az>=ax&&az>=ay?Y:Z);
    }
    const index=width===2?new Uint16Array(ni):new Uint32Array(ni);
    for(let j=0;j<ni;j++,at+=width)index[j]=width===2?data.getUint16(at,true):data.getUint32(at,true);
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.BufferAttribute(pos,3));
    geometry.setAttribute('normal',new T.BufferAttribute(nor,3));geometry.setAttribute('uv',new T.BufferAttribute(uv,2));
    geometry.setIndex(new T.BufferAttribute(index,1));geometry.computeBoundingSphere();
    meshes.push({link,material,geometry});
  }
  if(at!==buffer.byteLength)throw new Error('Unexpected UR10e geometry length');
  return {meshes,materials:makeFinishes(T)};
}

function group(T,parent,name,x=0,y=0,z=0) {
  const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;
}
function primitives(T) {
  const boxGeometry=new T.BoxGeometry(1,1,1),tubes=new Map(),castings=new Map();
  function mesh(parent,geo,mat,x=0,y=0,z=0){
    const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
  }
  function box(parent,x,y,z,w,h,d,mat){const o=mesh(parent,boxGeometry,mat,x,y,z);o.scale.set(w,h,d);return o;}
  function cyl(parent,x,y,z,r,length,mat,axis='z',sides=24,ratio=1){
    const key=sides+':'+ratio;
    if(!tubes.has(key))tubes.set(key,new T.CylinderGeometry(ratio,1,1,sides));
    const o=mesh(parent,tubes.get(key),mat,x,y,z);o.scale.set(r,length,r);
    if(axis==='z')o.rotation.x=pi/2;if(axis==='x')o.rotation.z=-pi/2;return o;
  }
  function casting(parent,x,y,z,w,h,d,chamfer,material) {
    if(!castings.has(chamfer)){
      const c=chamfer,s=new T.Shape(),v=[[-.5+c,-.5],[.5-c,-.5],[.5,-.5+c],[.5,.5-c],[.5-c,.5],[-.5+c,.5],[-.5,.5-c],[-.5,-.5+c]];
      s.moveTo(...v[0]);for(let i=1;i<v.length;i++)s.lineTo(...v[i]);s.closePath();
      const g=new T.ExtrudeGeometry(s,{depth:.978,bevelEnabled:true,bevelSize:.008,bevelThickness:.011,bevelSegments:2,curveSegments:1});
      g.translate(0,0,-.489);castings.set(chamfer,g);
    }
    const o=mesh(parent,castings.get(chamfer),material,x,y,z);o.scale.set(w,h,d);return o;
  }
  function harness(parent,points,r,mat){
    const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));
    return mesh(parent,new T.TubeGeometry(curve,32,r,8,false),mat);
  }
  return {mesh,box,cyl,casting,harness};
}

function pedestal(T,root,B,m){
  // Fabricated cobot pedestal with bolt flange, inspection cover and stiffener
  // webs. The physical riser puts the stock 1.3 m arm within reach of the part.
  const g=group(T,root,'anchored robot pedestal',.47,0,-.265);
  B.casting(g,0,.03255,0,.49,.064,.45,.09,m.dark);
  B.cyl(g,0,.083,0,.191,.047,m.powder,'y',40);
  B.cyl(g,0,.569,0,.136,.95,m.powder,'y',48,.91);
  B.cyl(g,0,1.069,0,.173,.068,m.powder,'y',48);
  B.cyl(g,0,1.126,0,.166,.069,m.zinc,'y',48);
  B.cyl(g,0,1.1615,0,.13,.007,m.rubber,'y',48);
  for(const x of [-.192,.192])for(const z of [-.168,.168]){
    B.cyl(g,x,.069,z,.026,.011,m.zinc,'y',24);B.cyl(g,x,.082,z,.021,.021,m.zinc,'y',6);
  }
  const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(.074,0);shape.lineTo(.008,.244);shape.lineTo(0,.244);shape.closePath();
  const web=new T.ExtrudeGeometry(shape,{depth:.010,bevelEnabled:false});
  for(let j=0;j<4;j++){
    const angle=j*pi/2+pi/4,o=B.mesh(g,web,m.powder,.123*Math.cos(angle),.075,-.123*Math.sin(angle));o.rotation.y=angle;
  }
  B.casting(g,0,.453,.132,.102,.246,.008,.12,m.dark);
  for(const y of [.363,.539])B.cyl(g,0,y,.143,.008,.014,m.zinc,'z',6);
  return g;
}

function opticalTool(T,site,B,m) {
  // In this frame +Z follows the camera's optical axis. The lenses look down
  // at the flange, with approximately 0.26 m working distance at inspection.
  B.cyl(site,0,0,.011,.061,.022,m.zinc,'z',48);
  B.cyl(site,0,0,.029,.048,.014,m.dark,'z',40);
  for(let k=0;k<4;k++){
    const a=k*pi/2+pi/4;B.cyl(site,.047*Math.cos(a),.047*Math.sin(a),.025,.006,.008,m.barrel,'z',6);
  }
  B.casting(site,0,0,.083,.118,.094,.101,.11,m.dark);
  B.casting(site,0,0,.133,.110,.089,.019,.095,m.barrel);
  for(let j=0;j<5;j++)B.box(site,-.059,0,.044+j*.015,.008,.077,.007,m.casting);
  for(const x of [-.043,.043])for(const y of [-.032,.032])B.cyl(site,x,y,.144,.0049,.006,m.zinc,'z',6);
  B.cyl(site,0,0,.157,.034,.032,m.barrel,'z',44);
  B.cyl(site,0,0,.184,.040,.036,m.barrel,'z',48);
  for(const z of [.166,.176,.185,.194])B.cyl(site,0,0,z,.041,.003,m.dark,'z',44);
  B.cyl(site,0,0,.208,.043,.020,m.zinc,'z',44);
  B.cyl(site,0,0,.223,.047,.010,m.barrel,'z',48);
  B.cyl(site,0,0,.229,.040,.003,m.opal,'z',48);
  B.cyl(site,0,0,.231,.024,.004,m.barrel,'z',48);
  B.cyl(site,0,0,.233,.020,.004,m.optical,'z',48);
  // Side plug, keyed M12 locking nut and flex loop back to the wrist I/O.
  B.cyl(site,.065,.002,.065,.017,.019,m.gold,'x',12);
  B.cyl(site,.082,.002,.065,.014,.025,m.rubber,'x',20);
  B.harness(site,[[.091,.002,.065],[.108,.010,.050],[.12,.02,-.010],[.118,.023,-.065],[.09,.022,-.108],[.048,.017,-.13]],.0082,m.rubber);
  B.cyl(site,.044,.017,-.13,.013,.021,m.dark,'x',18);
  B.casting(site,0,.048,.076,.078,.003,.030,.06,m.zinc);
  // The camera ID is printed on an actual service label on the aisle-side face.
  if(typeof document!=='undefined'){
    const c=document.createElement('canvas');c.width=320;c.height=104;const ctx=c.getContext('2d');
    if(ctx){
      ctx.fillStyle='#bac2b8';ctx.fillRect(0,0,320,104);ctx.fillStyle='#24302e';
      ctx.font='bold 28px sans-serif';ctx.fillText('VISION   C-01',12,40);
      for(let j=0;j<68;j++)ctx.fillRect(12+j*4,56,j%5===0?3:1,27);
      const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;
      const name=new T.MeshStandardMaterial({name:'optical equipment ID',map:t,roughness:.67,metalness:.12});
      const p=B.mesh(site,new T.PlaneGeometry(.073,.024),name,0,.0503,.075);p.rotation.x=-pi/2;p.castShadow=false;
    }
  }
}

function assemble(T,asset,batchStatic){
  const holder=new T.Group(),B=primitives(T),m=asset.materials;
  holder.name='UR10e inspection assembly';
  const foot=pedestal(T,holder,B,m);
  const native=group(T,holder,'metric UR visual base',.47,1.165,-.265);
  native.rotation.x=-pi/2;
  const base=group(T,native,'UR base frame');base.rotation.z=pi;
  const bodies=[base],movable=[],axis=axes.map(a=>new T.Vector3(...a));
  const names=['shoulder yaw','shoulder lift','elbow','wrist one','wrist two','tool roll'];
  for(let i=0;i<6;i++){
    const offset=group(T,bodies[i],names[i]+' bearing',...positions[i]);offset.rotation.y=frames[i];
    const revolute=group(T,offset,names[i]);revolute.userData.dynamic=true;movable.push(revolute);bodies.push(revolute);
  }
  for(const part of asset.meshes)B.mesh(bodies[part.link],part.geometry,m.cad[part.material]);
  const site=group(T,bodies[6],'ISO tool interface',0,.1,0);site.rotation.x=-pi/2;
  opticalTool(T,site,B,m);
  // A slim external I/O loom follows the forearm on the opposite side from
  // the joint cap. Clamps retain the cable on the fixed portion of that link.
  const fore=group(T,bodies[3],'forearm loom clips');
  B.harness(fore,[[-.050,.087,.060],[-.057,.076,.118],[-.055,.041,.167],[-.054,.033,.31],[-.058,.037,.423],[-.060,.070,.496],[-.028,.084,.556]],.0072,m.rubber);
  for(const z of [.182,.41]){
    B.cyl(fore,0,0,z,.053,.009,m.dark,'z',40);
    B.box(fore,-.051,.031,z,.018,.020,.015,m.rubber);
  }
  if(batchStatic){batchStatic(T,foot);batchStatic(T,site);batchStatic(T,fore);}
  function update(p){
    const clamped=Math.min(1,Math.max(0,Number.isFinite(p)?p:0));
    let i=0;while(i+2<trajectory.length&&clamped>trajectory[i+1][0])i++;
    const a=trajectory[i],b=trajectory[i+1];
    const f=(clamped-a[0])/(b[0]-a[0]),k=f*f*(3-2*f);
    for(let j=0;j<6;j++)movable[j].quaternion.setFromAxisAngle(axis[j],a[1][j]+(b[1][j]-a[1][j])*k);
  }
  return {holder,site,update};
}

/**
 * Call after dressing the inspection group, before initial static batching.
 * The existing complete arm stays visible while the CAD buffer arrives. Pass
 * normalized progress to the returned synchronous controller. ready resolves
 * to true on replacement, or false when the existing model remains in use.
 */
export function replaceInspectionRobot(T,station,{batchStatic=null}={}) {
  if(installed.has(station))return installed.get(station);
  const original=station.getObjectByName('robot mount');
  if(original)original.userData.dynamic=true;
  let model=null,progress=0;
  const controller={ready:null,opticalAnchor:new T.Vector3(-.38,1.48,.43),
    update(p){progress=p;if(model)model.update(progress);}};
  installed.set(station,controller);
  let background=resources.get(T);
  if(!background){background=readVisuals(T);resources.set(T,background);}
  controller.ready=background.then(data=>{
    model=assemble(T,data,batchStatic);model.update(progress);station.add(model.holder);
    if(original)original.removeFromParent();
    station.updateWorldMatrix(true,true);return true;
  }).catch(()=>{if(resources.get(T)===background)resources.delete(T);return false;});
  return controller;
}
