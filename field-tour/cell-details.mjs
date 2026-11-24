/* Inspection-cell hardware. Models are in metres and face the aisle on +Z. */
const kits = new WeakMap();
const tau = 2 * Math.PI;

function makeKit(T) {
  const geometries = new Map();
  const geometry = (id, make) => {
    if (!geometries.has(id)) geometries.set(id, make());
    return geometries.get(id);
  };
  const standard = (name, color, metalness, roughness) =>
    new T.MeshStandardMaterial({ name, color, metalness, roughness });
  const mat = {
    door: standard('aged petrol powder coat', 0x38504b, .44, .50),
    shell: standard('folded cabinet returns', 0x2e413e, .52, .50),
    pan: standard('anthracite baked enamel', 0x38413d, .43, .53),
    seal: standard('door gasket and isolation feet', 0x212827, .03, .91),
    dark: standard('black phosphate hardware', 0x414946, .69, .49),
    galv: standard('pressed zinc-galvanized steel', 0x9baba5, .77, .39),
    wire: standard('welded guarding wire', 0x64716b, .58, .53),
    alloy: standard('brushed aluminium', 0xc0c7c3, .78, .33),
    yellow: standard('safety isolator backplate', 0xc7983c, .14, .44),
    red: standard('disconnect lever', 0xa64331, .15, .40),
    green: standard('green panel indicator', 0x819d69, .17, .26),
    optic: standard('coated protective lens', 0x274a49, .74, .17),
    diffuser: standard('opal polycarbonate light strip', 0xd1d8ce, .07, .38)
  };
  mat.diffuser.emissive.setHex(0xd4dfd4); mat.diffuser.emissiveIntensity=.55;
  mat.green.emissive.setHex(0x76a967); mat.green.emissiveIntensity=.32;

  // Seeded zinc spangle and fine orange-peel on the formed sheet. Two small,
  // shared data textures keep the finish stable and independent of any URL.
  const paint=new Uint8Array(96*96*4), zinc=new Uint8Array(96*96*4);
  let seed=71;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){
    const q=(y*96+x)*4,r=random(),grain=204+Math.round(38*r);
    paint[q]=paint[q+1]=paint[q+2]=grain;paint[q+3]=255;
    const crystal=207+Math.round(14*Math.cos(x*.69+y*.37)+10*Math.sin(x*.14-y*.29)+17*r);
    zinc[q]=zinc[q+1]=zinc[q+2]=crystal;zinc[q+3]=255;
  }
  function grain(data,repeat) {
    const map=new T.DataTexture(data,96,96);map.wrapS=map.wrapT=T.RepeatWrapping;
    map.repeat.set(repeat,repeat);map.generateMipmaps=true;map.minFilter=T.LinearMipmapLinearFilter;
    map.magFilter=T.LinearFilter;map.needsUpdate=true;return map;
  }
  const powder=grain(paint,3), metal=grain(zinc,4);
  for(const name of ['door','shell','pan']){mat[name].roughnessMap=powder;mat[name].bumpMap=powder;mat[name].bumpScale=.0010;}
  for(const name of ['galv','alloy']) mat[name].roughnessMap=metal;

  function group(parent,name,x=0,y=0,z=0) {
    const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;
  }
  function add(parent,g,material,x,y,z) {
    const obj=new T.Mesh(g,typeof material==='string'?mat[material]:material);
    obj.castShadow=!obj.material.transparent;obj.receiveShadow=true;obj.position.set(x,y,z);parent.add(obj);return obj;
  }
  const cube=geometry('box',()=>new T.BoxGeometry(1,1,1));
  const plane=geometry('plane',()=>new T.PlaneGeometry(1,1));
  function box(parent,x,y,z,w,h,d,material){
    const o=add(parent,cube,material,x,y,z);o.scale.set(w,h,d);return o;
  }
  function plate(parent,x,y,z,w,h,d,material,cut=.05){
    const geo=geometry('pressed-'+cut,()=>{
      const s=new T.Shape(),pts=[[-.5+cut,-.5],[.5-cut,-.5],[.5,-.5+cut],[.5,.5-cut],[.5-cut,.5],[-.5+cut,.5],[-.5,.5-cut],[-.5,-.5+cut]];
      s.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)s.lineTo(...pts[i]);s.closePath();
      const g=new T.ExtrudeGeometry(s,{depth:.98,bevelEnabled:true,bevelThickness:.010,bevelSize:.005,bevelSegments:1,curveSegments:1});
      g.translate(0,0,-.49);return g;
    });
    const o=add(parent,geo,material,x,y,z);o.scale.set(w,h,d);return o;
  }
  function cylinder(parent,x,y,z,r,len,material,axis='z',sides=20) {
    const g=geometry('c-'+sides,()=>new T.CylinderGeometry(1,1,1,sides));
    const o=add(parent,g,material,x,y,z);o.scale.set(r,len,r);
    if(axis==='z')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.z=-Math.PI/2;return o;
  }
  function bolt(parent,x,y,z,r=.012) {return cylinder(parent,x,y,z,r,r*.85,'galv','z',6);}
  function bar(parent,start,end,w,d,material) {
    const a=new T.Vector3(...start),b=new T.Vector3(...end),mid=a.clone().lerp(b,.5),v=b.sub(a);
    const o=box(parent,mid.x,mid.y,mid.z,w,v.length(),d,material);
    o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;
  }
  function cable(parent,points,r,material,corrugated=false) {
    const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    const segments=corrugated?Math.ceil(curve.getLength()/.0056):28;
    const sides=corrugated?8:9,g=new T.TubeGeometry(curve,segments,r,sides,false);
    if(corrugated){
      const pos=g.attributes.position,v=new T.Vector3(),c=new T.Vector3();
      for(let i=0;i<=segments;i++){
        curve.getPointAt(i/segments,c);const factor=1+.135*Math.cos(Math.PI*i);
        for(let j=0;j<=sides;j++){const n=i*(sides+1)+j;v.fromBufferAttribute(pos,n).sub(c).multiplyScalar(factor).add(c);pos.setXYZ(n,v.x,v.y,v.z);}
      }
      g.computeVertexNormals();
    }
    return add(parent,g,material,0,0,0);
  }
  function label(kind) {
    const canvas=typeof document!=='undefined'?document.createElement('canvas'):typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(1,1):null;
    const m=standard('physical '+kind+' equipment label',kind==='hazard'?0xe0bc55:0xc8cec2,.14,.67);
    if(!canvas)return m;
    const w=kind==='hazard'?256:512,h=kind==='hazard'?192:176;
    canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');
    if(!c)return m;
    if(kind==='hazard'){
      c.fillStyle='#c3af66';c.fillRect(0,0,w,h);c.strokeStyle='#333b32';c.lineWidth=6;c.strokeRect(5,5,w-10,h-10);
      c.fillStyle='#32382d';c.beginPath();c.moveTo(63,24);c.lineTo(108,110);c.lineTo(18,110);c.closePath();c.fill();
      c.fillStyle='#d2b653';c.beginPath();c.moveTo(62,37);c.lineTo(100,105);c.lineTo(27,105);c.closePath();c.fill();
      c.fillStyle='#283027';c.beginPath();c.moveTo(69,48);c.lineTo(47,77);c.lineTo(61,76);c.lineTo(52,96);c.lineTo(78,67);c.lineTo(64,68);c.closePath();c.fill();
      c.font='bold 31px "Malgun Gothic","Apple SD Gothic Neo",sans-serif';c.fillText('감전',120,70);c.fillText('주의',120,107);
      c.font='bold 16px monospace';c.fillText('DISCONNECT POWER',15,154);
    }else{
      c.fillStyle='#bcc6b7';c.fillRect(0,0,w,h);c.fillStyle='#283a34';c.fillRect(0,0,12,h);
      c.strokeStyle='#697768';c.lineWidth=3;c.strokeRect(13,3,w-17,h-6);
      c.fillStyle='#25332f';c.font='bold 57px "Malgun Gothic","Apple SD Gothic Neo",sans-serif';c.fillText('검사 셀',33,78);
      c.font='bold 25px sans-serif';c.fillText('ZIEWISE',317,51);
      for(let j=0;j<33;j++)c.fillRect(318+j*4,64,j%5===0?3:1,31);
      c.fillRect(30,106,450,2);c.font='22px monospace';c.fillText('VISION 01    /    CONTROL',33,145);
    }
    const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=3;
    m.color.setHex(0xffffff);m.map=tex;return m;
  }
  const nameMat=label('id'), warningMat=label('hazard');
  function wearing() {
    const canvas=typeof document!=='undefined'?document.createElement('canvas'):typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(256,384):null;
    const m=mat.door.clone();m.name='enclosure door contact wear';
    if(!canvas)return m;
    canvas.width=384;canvas.height=640;const c=canvas.getContext('2d');if(!c)return m;
    c.fillStyle='#f0f2eb';c.fillRect(0,0,384,640);
    const shade=c.createLinearGradient(0,0,70,640);shade.addColorStop(0,'rgba(52,64,51,.10)');shade.addColorStop(.42,'rgba(255,255,255,0)');shade.addColorStop(1,'rgba(59,65,51,.13)');
    c.fillStyle=shade;c.fillRect(0,0,384,640);
    for(let i=0;i<14000;i++){
      const value=random();c.fillStyle=value>.50?'rgba(255,255,242,.12)':'rgba(65,72,53,.11)';
      c.fillRect(random()*384,random()*640,value>.96?2:1,1);
    }
    // Handling marks concentrate around the service latch and folded edges.
    for(let i=0;i<55;i++){
      const x=i<20?344+random()*21:i%2?1+random()*3:379+random()*3;
      const y=i<20?291+random()*70:random()*630;
      c.strokeStyle=i%3?'rgba(92,99,79,.36)':'rgba(255,254,225,.61)';c.lineWidth=.65;
      c.beginPath();c.moveTo(x,y);c.lineTo(x+1.4+random()*3,y+random()*7);c.stroke();
    }
    const tex=new T.CanvasTexture(canvas);tex.anisotropy=3;tex.colorSpace=T.SRGBColorSpace;m.map=tex;return m;
  }
  const faceMat=wearing();
  function decal(parent,x,y,z,w,h,material) {
    const o=add(parent,plane,material,x,y,z);o.scale.set(w,h,1);o.castShadow=false;return o;
  }
  function grille(parent,x,y,z,w,h,count) {
    plate(parent,x,y,z,w,h,.018,'dark',.033);
    for(let i=0;i<count;i++){
      const yy=y-h*.39+i*h*.78/(count-1);
      box(parent,x,yy-.005,z+.014,w*.87,.022,.012,'seal');
      const lip=box(parent,x,yy+.007,z+.020,w*.88,.015,.030,'door');lip.rotation.x=-.43;
    }
    for(const xSign of [-1,1])for(const ySign of [-1,1])bolt(parent,x+xSign*w*.445,y+ySign*h*.44,z+.015,.009);
  }
  return {mat,group,add,box,plate,bar,bolt,cylinder,cable,decal,nameMat,warningMat,faceMat,grille};
}

function cabinet(K,root){
  const {group,plate,box,bolt,cylinder,grille,decal}=K;
  const cab=group(root,'formed PLC cabinet',-.98,0,-1.28);
  for(const x of [-.375,.375])for(const z of [-.174,.174]){
    cylinder(cab,x,.031,z,.067,.062,'seal','y');
    cylinder(cab,x,.086,z,.046,.068,'galv','y',6);
  }
  box(cab,0,.145,0,.91,.12,.475,'pan');
  plate(cab,0,1.018,0,.984,1.62,.52,'shell',.019);
  plate(cab,0,1.020,.258,.955,1.553,.035,'seal',.017);
  plate(cab,0,1.021,.288,.928,1.529,.042,'door',.016);
  decal(cab,0,1.021,.3096,.899,1.492,K.faceMat);
  plate(cab,0,1.847,0,1.015,.047,.559,'pan',.015);
  box(cab,0,1.823,.280,.973,.023,.013,'galv');
  // Rolled external hinge barrels, mounting leaves and captive hinge pins.
  for(const y of [.488,1.51]){
    plate(cab,-.444,y,.313,.073,.119,.012,'shell');
    cylinder(cab,-.464,y,.333,.021,.166,'dark','y',18);
    for(const s of [-1,1]){
      cylinder(cab,-.464,y+s*.058,.333,.022,.043,'galv','y',18);
      bolt(cab,-.426,y+s*.037,.326,.009);
    }
  }
  plate(cab,.385,1.00,.318,.074,.165,.018,'seal',.12);
  plate(cab,.386,1.009,.340,.045,.135,.029,'galv',.13);
  cylinder(cab,.386,1.044,.360,.014,.017,'dark','z',18);
  box(cab,.387,1.045,.369,.003,.017,.001,'seal');
  decal(cab,.119,1.528,.311,.341,.117,K.nameMat);
  // Rotary lockable disconnect and two status lamps above the vent.
  plate(cab,.168,1.279,.331,.154,.151,.041,'yellow',.10);
  cylinder(cab,.168,1.279,.362,.047,.037,'seal','z',24);
  const lever=plate(cab,.169,1.286,.401,.042,.106,.047,'red',.15);lever.rotation.z=-.47;
  for(const s of [-1,1])bolt(cab,.168+s*.057,1.279-s*.057,.354,.0055);
  for(const [x,face] of [[-.260,'green'],[-.138,'dark']]){
    cylinder(cab,x,1.284,.326,.030,.027,'galv');cylinder(cab,x,1.284,.349,.022,.021,face);
  }
  grille(cab,.109,.637,.324,.412,.328,7);
  decal(cab,-.275,.864,.311,.145,.108,K.warningMat);
  for(const y of [.459,1.629]){
    for(const s of [-1,1])bolt(cab,s*.420,y,.316,.010);
  }
  // Cable glands on an accessible bottom gland plate.
  box(cab,.06,.214,.12,.68,.024,.17,'galv');
  for(const x of [-.18,-.015,.15])cylinder(cab,x,.174,.135,.030,.075,'dark','y',6);
}

function guarding(T,K,root){
  const {group,box,cylinder,bolt,add}=K;
  const g=group(root,'rear welded-wire safety screen',0,0,-1.69);
  for(const x of [-.30,.73,1.78]){
    box(g,x,.036,0,.163,.072,.184,'pan');
    for(const z of [-.051,.051])cylinder(g,x+.050,.080,z,.015,.025,'galv','y',6);
    box(g,x,.957,0,.049,1.765,.054,'pan');
    box(g,x,1.846,0,.055,.025,.060,'seal');
  }
  const w=2.08,cx=.74;
  for(const y of [.303,1.809])box(g,cx,y,0,w,.052,.047,'pan');
  box(g,cx,.195,.003,w-.04,.166,.025,'shell');
  // Four-sided rods welded at alternating depths form an actual see-through
  // mesh. One geometry renders both panels, including the crossed rod glints.
  const position=[],normals=[],index=[];
  function rod(x,y,z,r,length,across){
    const base=position.length/3;
    for(let end=0;end<2;end++)for(let side=0;side<4;side++){
      const a=Math.PI*.25+side*tau/4,ca=Math.cos(a),sa=Math.sin(a);
      if(across){position.push(x+length*end,y+r*ca,z+r*sa);normals.push(0,ca,sa);}
      else{position.push(x+r*ca,y+length*end,z+r*sa);normals.push(ca,0,sa);}
    }
    for(let i=0;i<4;i++){
      const j=(i+1)%4;
      if(across)index.push(base+i,base+j,base+i+4,base+j,base+j+4,base+i+4);
      else index.push(base+i,base+i+4,base+j,base+j,base+i+4,base+j+4);
    }
  }
  const bottom=.33,top=1.783;
  for(let i=0;i<38;i++)rod(-.264+i*.0542,bottom,0,.0036,top-bottom,false);
  for(let i=0;i<16;i++)rod(-.275,bottom+.042+i*.091,.0055,.0037,2.031,true);
  const mesh=new T.BufferGeometry();mesh.setAttribute('position',new T.Float32BufferAttribute(position,3));
  mesh.setAttribute('normal',new T.Float32BufferAttribute(normals,3));mesh.setIndex(index);mesh.computeBoundingSphere();
  add(g,mesh,'wire',0,0,0);
  for(const x of [-.26,.695,.765,1.739])for(const y of [.365,1.742]){
    box(g,x,y,.030,.063,.036,.014,'galv');bolt(g,x,y,.043,.008);
  }
}

function taskLight(K,root){
  const {group,box,bar,cable,cylinder,bolt}=K;
  const g=group(root,'inspection task light');
  box(g,-.353,.042,-1.53,.162,.084,.17,'pan');
  for(const x of [-.414,-.292])cylinder(g,x,.091,-1.545,.011,.019,'galv','y',6);
  box(g,-.353,1.244,-1.53,.046,2.405,.052,'galv');
  box(g,-.353,1.237,-1.501,.016,2.332,.004,'dark');
  bar(g,[-.353,2.416,-1.53],[-.353,2.416,-.705],.042,.042,'pan');
  bar(g,[-.353,2.125,-1.525],[-.353,2.402,-1.18],.025,.025,'galv');
  const light=group(g,'linear optic',-.512,2.406,-.685);
  light.rotation.x=.23;
  box(light,0,0,0,1.006,.061,.086,'alloy');
  for(let j=0;j<4;j++)box(light,0,.032,-.035+j*.021,.976,.016,.008,'pan');
  for(const x of [-.506,.506])box(light,x,0,0,.032,.070,.094,'dark');
  box(light,0,-.026,.043,.95,.032,.012,'diffuser');
  box(light,0,-.035,.006,.95,.012,.067,'diffuser');
  for(const x of [-.484,.484])bolt(light,x,.008,.047,.008);
  cable(g,[[-.985,2.412,-.721],[-1.010,2.405,-.858],[-.758,2.39,-.901],[-.390,2.384,-.744],[-.357,2.371,-.948],[-.369,2.35,-1.48]],.009,'seal');
}

function conveyorServices(K,root){
  const {group,box,plate,bar,bolt,cylinder,cable}=K;
  const g=group(root,'conveyor motor, cable tray and service panel');
  // Raised underframe keeps the floor visibly open and links the four feet.
  box(g,-.395,.299,.482,2.178,.043,.529,'galv');
  for(const z of [.204,.755])box(g,-.395,.331,z,2.185,.096,.034,'pan');
  for(const x of [-1.488,.702])box(g,x,.331,.480,.035,.096,.572,'pan');
  for(const x of [-1.328,-.814,-.278,.244,.535])bolt(g,x,.338,.777,.012);
  for(const x of [-1.415,.615])bar(g,[x,.296,.743],[x,.527,.845],.042,.042,'galv');
  // An under-belt drive controller, placed behind the existing front rail.
  plate(g,-.306,.580,.53,1.443,.326,.416,'pan',.032);
  plate(g,-.306,.580,.749,1.357,.266,.032,'shell',.026);
  const area=group(g,'drive cooling perforations',-.606,.571,.772);
  box(area,0,0,0,.462,.162,.012,'seal');
  for(let j=0;j<6;j++){
    const l=box(area,0,-.056+j*.023,.010,.448,.011,.022,'pan');l.rotation.x=-.34;
  }
  for(const x of [-.93,.315])for(const yy of [.483,.673])bolt(g,x,yy,.771,.011);
  box(g,.116,.590,.772,.149,.052,.005,'galv');
  for(let j=0;j<9;j++)box(g,.062+j*.012,.589,.776,.003,.028,.003,'dark');
  // In-line gearmotor bolted at the end roller, with ribbed cast stator.
  plate(g,-1.422,.692,.650,.286,.288,.234,'shell',.16);
  cylinder(g,-1.435,.666,.722,.119,.249,'door','z',32);
  for(let k=0;k<11;k++){
    const a=k*tau/11,x=-1.435+Math.cos(a)*.111,y=.666+Math.sin(a)*.111;
    const fin=box(g,x,y,.676,.016,.027,.176,'door');fin.rotation.z=a-Math.PI/2;
  }
  cylinder(g,-1.435,.666,.854,.106,.033,'galv','z',28);
  cylinder(g,-1.435,.666,.876,.089,.014,'dark','z',28);
  for(let j=0;j<5;j++)box(g,-1.435,.627+j*.018,.887,.138-Math.abs(j-2)*.019,.006,.005,'galv');
  cable(g,[[-.165,.499,.438],[-.095,.389,.430],[.163,.359,.41],[.352,.356,.09],[.16,.254,-.239],[-.102,.208,-.67],[-.354,.203,-1.04],[-.486,.287,-1.119]],.028,'seal',true);
  cable(g,[[-1.415,.608,.573],[-1.417,.442,.478],[-1.195,.360,.392],[-.814,.367,.390],[-.502,.382,.388]],.015,'dark');
}

function cameraHardware(K,station){
  const head=station.getObjectByName('optical end effector');
  if(!head)return;
  const {box,plate,bolt,cylinder,group,cable}=K;
  const g=group(head,'moving optical bracket and M12 cable');g.userData.dynamic=true;
  // Parts touch the existing camera casting. The auxiliary light points at the
  // specimen and follows the wrist throughout the approach and retraction.
  plate(g,-.019,-.11,.114,.185,.169,.013,'pan',.13);
  for(const s of [-1,1])bolt(g,-.019+s*.067,-.161,.128,.009);
  box(g,-.007,-.089,.127,.087,.030,.006,'galv');
  cylinder(g,.105,-.077,.026,.034,.062,'galv','x',6);
  cable(g,[[.122,-.077,.026],[.162,-.07,.04],[.181,.018,.034],[.136,.095,-.005],[.096,.147,-.034]],.013,'seal',true);
  const lamp=group(g,'low-angle side illumination',-.108,-.169,.014);lamp.rotation.z=-.24;
  plate(lamp,-.047,0,0,.124,.047,.124,'alloy',.09);
  box(lamp,-.089,-.049,0,.081,.067,.108,'dark');
  box(lamp,-.089,-.086,.003,.069,.013,.096,'diffuser');
}

/** Dress a fresh buildFactory(T, 'design').group before the station is batched. */
export function dressInspection(T,station) {
  const existing=station.getObjectByName('inspection cell accessories');
  if(existing)return existing;
  let K=kits.get(T);
  if(!K){K=makeKit(T);kits.set(T,K);}
  const detail=K.group(station,'inspection cell accessories');
  cabinet(K,detail);guarding(T,K,detail);taskLight(K,detail);conveyorServices(K,detail);cameraHardware(K,station);
  return detail;
}
