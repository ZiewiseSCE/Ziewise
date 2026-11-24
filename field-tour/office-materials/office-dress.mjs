// Call dressOffice synchronously after buildOffice and before static batching.
// Film/poster capture may await officeSurfacesReady(T). All dependencies are local.
const shared = new WeakMap();
const kinds = new WeakMap();
const dressed = new WeakSet();
const tau = Math.PI * 2;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function unpack(T, bytes) {
  const data = new DataView(bytes);
  const len = data.getUint32(4, true);
  const entries = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 8, len)));
  const geometries = new Map();
  let offset = 8 + len;
  for (const e of entries) {
    const positions = new Float32Array(e.n * 3), normals = new Float32Array(e.n * 3), uv = new Float32Array(e.n * 2);
    const indices = new Uint16Array(e.indices);
    for (let j = 0; j < positions.length; j++, offset += 2) {
      positions[j] = e.min[j % 3] + e.range[j % 3] * data.getUint16(offset, true) / 65535;
    }
    for (let j = 0; j < normals.length; j++, offset++) normals[j] = data.getInt8(offset) / 127;
    for (let j = 0; j < uv.length; j++, offset += 2) uv[j] = e.tmin[j % 2] + e.tr[j % 2] * data.getUint16(offset, true) / 65535;
    for (let j = 0; j < indices.length; j++, offset += 2) indices[j] = data.getUint16(offset, true);
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(positions, 3));
    g.setAttribute('normal', new T.BufferAttribute(normals, 3));
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    g.setIndex(new T.BufferAttribute(indices, 1));
    g.normalizeNormals();
    g.computeBoundingSphere();
    geometries.set(e.id, g);
  }
  return geometries;
}

function resources(T) {
  if (shared.has(T)) return shared.get(T);
  const maps = {}, geo = new Map(), materials = new Map(), projected = new Map(), ready = [];
  const browser = typeof document !== 'undefined' && typeof fetch === 'function';
  let objects = Promise.resolve(null);
  if (browser) {
    const loader = new T.TextureLoader();
    const keys = [
      'oak-color','oak-normal','oak-rough','weave-color','weave-normal','weave-rough',
      'metal-color','metal-normal','metal-rough','paper-normal','paper-rough',
      'plant-leaf-color','plant-leaf-normal','plant-pot-color','plant-pot-normal',
      'chair-seat-color','chair-seat-normal','chair-frame-color','chair-frame-normal',
    ];
    for (const code of keys) {
      const url = new URL('./maps/' + code + '.webp', import.meta.url).href;
      ready.push(new Promise(resolve => {
        const tex = loader.load(url, () => resolve(true), undefined, () => resolve(false));
        tex.name = code;
        tex.colorSpace = code.endsWith('-color') ? T.SRGBColorSpace : T.NoColorSpace;
        const objectMap = code.startsWith('chair-') || code.startsWith('plant-');
        // glTF stores V measured downwards. Scanned material tiles use conventional UVs.
        tex.flipY = !objectMap;
        if (!objectMap) tex.wrapS = tex.wrapT = T.RepeatWrapping;
        tex.anisotropy = 4;
        maps[code] = tex;
      }));
    }
    objects = fetch(new URL('./maps/workplace-objects.bin', import.meta.url)).then(r => {
      if (!r.ok) throw new Error('Office object geometry unavailable');
      return r.arrayBuffer();
    }).then(bytes => unpack(T, bytes)).catch(() => null);
    ready.push(objects);
  }
  function mat(key, parameters) {
    if (!materials.has(key)) {
      const value = new T.MeshStandardMaterial(parameters);
      value.name = 'Office ' + key;
      materials.set(key, value);
    }
    return materials.get(key);
  }
  const set = { T, geo, maps, projected, mat, objects, ready: Promise.all(ready) };
  shared.set(T, set);
  return set;
}

export function officeSurfacesReady(T) { return resources(T).ready; }

const existingColors = new Map([
  [0x795239,'walnut'],[0x6f7d7d,'steel'],[0xaeb7b4,'silver'],[0xb89960,'brass'],
  [0x697971,'fabric'],[0xf6efda,'stock'],[0xe7e2d0,'enamel'],[0xc99f75,'kraft'],
  [0x335b55,'paint'],[0x193b3a,'dark-paint'],[0x283235,'graphite'],[0x233233,'polymer'],
]);
function kind(mesh) {
  const mat = mesh.material;
  if (kinds.has(mat)) return kinds.get(mat);
  let value;
  if (mat.isMeshStandardMaterial && !mat.transparent) {
    if (mat.map?.isCanvasTexture && mesh.geometry.type !== 'PlaneGeometry' && mat.color.getHex() === 0xffffff) value = 'oak';
    else if (!mat.map) value = existingColors.get(mat.color.getHex());
  }
  kinds.set(mat, value);
  return value;
}

function metricUV(m, r, tile, lengthwise) {
  const old = m.geometry;
  const scale = m.scale;
  const cacheKey = [old.uuid,scale.x,scale.y,scale.z,tile,lengthwise].join('/');
  if (r.projected.has(cacheKey)) { m.geometry = r.projected.get(cacheKey); return; }
  const g = old.clone();
  const p = g.attributes.position, n = g.attributes.normal;
  g.computeBoundingBox();
  const size = g.boundingBox.getSize(new r.T.Vector3()).multiply(scale);
  const v = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) * scale.x, y = p.getY(i) * scale.y, z = p.getZ(i) * scale.z;
    const a = Math.abs(n.getX(i) / scale.x), b = Math.abs(n.getY(i) / scale.y), c = Math.abs(n.getZ(i) / scale.z);
    let u, t, uLength, vLength;
    if (c >= a && c >= b) { u=x;t=y;uLength=size.x;vLength=size.y; }
    else if (b >= a) { u=x;t=z;uLength=size.x;vLength=size.z; }
    else { u=z;t=y;uLength=size.z;vLength=size.y; }
    if (lengthwise && vLength > uLength * 1.28) [u,t] = [t,u];
    v[i*2]=u/tile; v[i*2+1]=t/tile;
  }
  g.setAttribute('uv', new r.T.BufferAttribute(v,2));
  r.projected.set(cacheKey,g); m.geometry=g;
}

function coat(mesh, r) {
  const mat = mesh.material, tag = kind(mesh), z = r.maps;
  if (!tag) return;
  if (tag === 'oak' || tag === 'walnut') {
    metricUV(mesh,r,1.12,true);
    if (!z['oak-color']) return;
    mat.map=z['oak-color']; mat.normalMap=z['oak-normal']; mat.roughnessMap=z['oak-rough'];
    mat.normalScale.set(.40,.40); mat.color.setHex(tag==='oak'?0xf8ddba:0xba987e);
    mat.roughness=.98;mat.metalness=0;mat.envMapIntensity=.70;
  } else if (tag === 'steel' || tag === 'silver' || tag === 'brass') {
    metricUV(mesh,r,.38,true);
    if (!z['metal-color']) return;
    if (tag!=='brass') mat.map=z['metal-color'];
    mat.normalMap=z['metal-normal'];mat.roughnessMap=z['metal-rough'];
    mat.normalScale.set(.21,.21);mat.color.setHex(tag==='brass'?0xad8c5c:tag==='steel'?0xc3cbd0:0xf3f5f3);
    mat.metalness=tag==='brass'?.75:.79;mat.roughness=tag==='steel'?1.0:.83;
    mat.envMapIntensity=1.05;
  } else if (tag === 'fabric') {
    metricUV(mesh,r,.285,false);
    mat.map=z['weave-color']||null;mat.normalMap=z['weave-normal']||null;mat.roughnessMap=z['weave-rough']||null;
    mat.normalScale.set(.47,.47);mat.color.setHex(0xb5c2bd);mat.roughness=.99;
  } else if (tag === 'stock' || tag === 'kraft') {
    mat.normalMap=z['paper-normal']||null;mat.roughnessMap=z['paper-rough']||null;
    mat.normalScale.set(.12,.12);mat.color.setHex(tag==='stock'?0xf1eee4:0xc3a07b);mat.roughness=.97;
  } else {
    const colors = {enamel:0xe0ded5,paint:0x3c504b,'dark-paint':0x293936,graphite:0x343b3d,polymer:0x2d3535};
    mat.color.setHex(colors[tag]);mat.roughness=tag==='enamel'?.37:tag==='polymer'?.38:.47;
    mat.metalness=tag==='enamel'?.12:tag==='polymer'?0:.20;
  }
  if (!mat.userData.officeFinish) { mat.userData.officeFinish=true; mat.needsUpdate=true; }
}

function groupAt(parent, x,y,z) {
  return parent.children.find(n => n.isGroup && Math.abs(n.position.x-x)<.001 && Math.abs(n.position.y-y)<.001 && Math.abs(n.position.z-z)<.001);
}

function tools(r) {
  const {T,geo,mat}=r;
  function geom(name, fn) { if (!geo.has(name)) geo.set(name,fn()); return geo.get(name); }
  function add(parent,g,m,x,y,z) {
    const a=new T.Mesh(g,m);a.position.set(x,y,z);parent.add(a);a.castShadow=!m.transparent;a.receiveShadow=!m.transparent;return a;
  }
  function block(p,x,y,z,w,h,d,m) {
    const a=add(p,geom('block',()=>new T.BoxGeometry(1,1,1)),m,x,y,z);a.scale.set(w,h,d);return a;
  }
  function cyl(p,x,y,z,ra,rb,h,m,axis='y',sides=20) {
    const a=add(p,geom('cyl/'+[ra,rb,h,sides].join('/'),()=>new T.CylinderGeometry(ra,rb,h,sides)),m,x,y,z);
    if(axis==='z')a.rotation.x=Math.PI*.5;else if(axis==='x')a.rotation.z=-Math.PI*.5;return a;
  }
  function wire(p,points,radius,m,radial=7,divisions=18) {
    const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)),false,'centripetal');
    return add(p,new T.TubeGeometry(curve,divisions,radius,radial,false),m,0,0,0);
  }
  function frame(p,x,y,z) { const c=new T.Group();c.position.set(x,y,z);p.add(c);return c; }
  const rubber=mat('rubber',{color:0x262929,roughness:.79});
  const dark=mat('injection-moulded ABS',{color:0x323639,roughness:.42,metalness:.025});
  const satin=mat('satin hardware',{color:0xa8ada9,metalness:.76,roughness:.32,envMapIntensity:1.0});
  const steel=mat('steel rim',{color:0x5e6666,metalness:.75,roughness:.39,envMapIntensity:.9});
  const paper=mat('sheet edges',{color:0xe8e3d5,roughness:.84});
  const lens=mat('optical glass',{color:0x26383c,emissive:0x02090b,metalness:.46,roughness:.105,envMapIntensity:1.15});
  const indicator=mat('muted power LED',{color:0xa7cda4,emissive:0x537962,emissiveIntensity:.34,roughness:.27});
  function screw(p,x,y,z,diam,axis='z') {
    const holder=frame(p,x,y,z);if(axis==='y')holder.rotation.x=-Math.PI*.5;
    const disk=cyl(holder,0,0,0,diam/2,diam/2,diam*.16,steel,'z',14);
    const slot=block(holder,0,0,diam*.087,diam*.48,diam*.077,diam*.025,dark);slot.rotation.z=.58;
    return disk;
  }
  return {T,geom,add,block,cyl,wire,frame,screw,rubber,dark,satin,steel,paper,lens,indicator};
}

function physicalPrints(mesh, r, k) {
  if (mesh.geometry.type!=='PlaneGeometry'||!mesh.material.map?.isCanvasTexture) return;
  const mat=mesh.material, w=mesh.scale.x,h=mesh.scale.y;
  if(mat.isMeshBasicMaterial && w>.39 && h>.24){
    if(!r.glass)r.glass=new r.T.MeshPhysicalMaterial({
      color:0xb9d1d9,roughness:.27,metalness:.11,clearcoat:.65,clearcoatRoughness:.22,
      transparent:true,opacity:.057,depthWrite:false,envMapIntensity:.8,
    });
    const film=new r.T.Mesh(mesh.geometry,r.glass);film.position.copy(mesh.position);
    film.quaternion.copy(mesh.quaternion);film.scale.copy(mesh.scale).multiplyScalar(.997);
    const outward=new r.T.Vector3(0,0,.002).applyQuaternion(mesh.quaternion);
    film.position.add(outward);film.castShadow=false;film.receiveShadow=false;mesh.parent.add(film);
    return;
  }
  if (!mat.isMeshStandardMaterial||w>.83||h>.83||w<.19||Math.min(w,h)<.14) return;
  // Light physically catches the turned sheet, while the original printed copy and its UVs stay intact.
  const g=new r.T.PlaneGeometry(1,1,9,11),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const u=p.getX(i)+.5, v=p.getY(i)+.5;
    const corner=clamp((u+.57*v-1.23)/.31,0,1);
    const hem=(1-v)*(1-v)*Math.cos((u-.5)*Math.PI)*.0009;
    p.setZ(i,.00015+hem+corner*corner*.005);
  }
  g.computeVertexNormals();mesh.geometry=g;mesh.castShadow=true;
  mat.normalMap=r.maps['paper-normal']||null;mat.roughnessMap=r.maps['paper-rough']||null;
  mat.normalScale.set(.14,.14);mat.roughness=.97;mat.needsUpdate=true;
  const backing=k.matteSheet || (k.matteSheet=r.mat('shadowed overlap',{color:0xc5c0b2,roughness:.9}));
  const edge=new r.T.Mesh(g,backing);edge.quaternion.copy(mesh.quaternion);
  edge.scale.copy(mesh.scale);edge.position.copy(mesh.position).add(new r.T.Vector3(.0013,-.003,-.0012).applyQuaternion(mesh.quaternion));
  edge.castShadow=false;edge.receiveShadow=true;mesh.parent.add(edge);
}

function modelInstance(r, parent, type, height, x,y,z, yaw=0, prior) {
  const {T,maps}=r;
  const holder=new T.Group();holder.name='Measured '+type;holder.position.set(x,y,z);holder.rotation.y=yaw;holder.scale.setScalar(height);
  holder.userData.dynamic=true;
  parent.add(holder);
  if(prior)prior.userData.dynamic=true; // The retained original stays visible until the new geometry can render.
  r.objects.then(g=>{
    if(!g)return;
    for(const part of type==='plant'?['pot','leaf']:['frame','seat']){
      const tag=type+'-'+part;
      const isLeaf=part==='leaf';
      const m=r.mat(tag,{
        map:maps[tag+'-color'],normalMap:maps[tag+'-normal'], color:part==='seat'?0xe6e9e4:0xffffff,
        normalScale:new T.Vector2(isLeaf?.44:.53,isLeaf?.44:.53),
        side:isLeaf?T.DoubleSide:T.FrontSide,alphaTest:isLeaf?.41:0,
        roughness:isLeaf?.58:part==='frame'?.48:.75,metalness:part==='frame'?.15:.025,
      });
      const partMesh=new T.Mesh(g.get(tag),m);partMesh.castShadow=true;partMesh.receiveShadow=true;holder.add(partMesh);
    }
    if(type==='plant'){
      // The source contains ~54k triangles of pebbles below the canopy; retain a matte soil surface at the pot rim.
      const ground=new T.Mesh(new T.CylinderGeometry(.195,.185,.012,32),r.mat('potting soil',{color:0x3c3128,roughness:.99}));
      ground.position.set(.053,.373,.109);ground.receiveShadow=true;holder.add(ground);
    }
    if(prior)prior.visible=false;
    holder.updateWorldMatrix(true,true);
  });
  return holder;
}

function footPads(group,k,spans,height, size=.058) {
  const [xmin,xmax,zmin,zmax]=spans;
  for(const x of [xmin,xmax])for(const z of [zmin,zmax]){
    k.cyl(group,x,height,z,size,size*.91,.022,k.rubber,'y',14);
    k.cyl(group,x,height+.017,z,size*.67,size*.67,.015,k.steel,'y',14);
  }
}
function vents(k,p,x,y,z,count,step,w,h) {
  for(let i=0;i<count;i++)k.block(p,x+i*step,y,z,w,h,.0026,k.rubber);
}

function financeDetail(root,r,k) {
  const scan=groupAt(root,-.12,.90,-.11);if(!scan)return;
  const lid=groupAt(scan,0,.27,-.296);
  footPads(scan,k,[-.39,.39,-.224,.217],-.003,.038);
  // The original flatbed supplies the real scanner carriage animation and platen.
  k.block(scan,0,.120,.331,.83,.039,.010,k.dark);
  vents(k,scan,-.387,.12,.337,12,.012,.004,.022);
  k.block(scan,.264,.118,.340,.225,.066,.011,k.rubber);
  k.cyl(scan,.337,.119,.347,.020,.020,.008,k.dark,'z',28);
  k.cyl(scan,.337,.119,.352,.009,.009,.004,k.indicator,'z',18);
  k.cyl(scan,.241,.118,.348,.012,.012,.006,k.steel,'z');
  k.cyl(scan,.198,.118,.348,.009,.009,.006,k.steel,'z');
  // Satin die-cast upper rails; individual glass mounting pips sit outside the document.
  for(const x of [-.409,.409]){
    k.block(scan,x,.203,-.016,.016,.008,.453,k.steel);
    for(const z of [-.239,.210])k.screw(scan,x,.207,z,.014,'y');
  }
  if(lid){
    const pad=lid.children.find(o=>o.isMesh&&Math.abs(o.position.z-.038)<.001&&Math.abs(o.position.y-.226)<.001);
    if(pad){
      const cushion=r.mat('scanner document backing',{
        color:0xe3e1d9,roughness:.79,normalMap:r.maps['paper-normal']||null,
        normalScale:new r.T.Vector2(.19,.19),metalness:0,
      });
      pad.material=cushion;
      if(typeof document!=='undefined'&&!cushion.map){
        const c=document.createElement('canvas');c.width=512;c.height=224;const g=c.getContext('2d');
        const shade=g.createLinearGradient(0,0,512,224);
        shade.addColorStop(0,'#d6d5ce');shade.addColorStop(.21,'#efede8');shade.addColorStop(.69,'#e8e6df');shade.addColorStop(1,'#d7d6cf');
        g.fillStyle=shade;g.fillRect(0,0,512,224);
        for(let i=0;i<4;i++){g.strokeStyle=['#b5b6af','#c7c8c0','#ebebe5','#d7d7d0'][i];g.lineWidth=1.25;
          g.beginPath();g.roundRect(8+i,8+i,496-i*2,208-i*2,7);g.stroke();}
        const t=new r.T.CanvasTexture(c);t.colorSpace=r.T.SRGBColorSpace;t.anisotropy=4;cushion.map=t;cushion.needsUpdate=true;
      }
      if(cushion.map){
        const geom=pad.geometry.clone(),p=geom.attributes.position,uv=geom.attributes.uv;
        for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/.849+.5,p.getY(i)/.39+.5);
        pad.geometry=geom;
      }
    }
    for(const x of [-.402,.402])for(const y of [.065,.395]){
      k.cyl(lid,x,y,.051,.009,.010,.006,k.rubber,'z');
    }
    k.block(lid,.002,.030,.040,.74,.011,.010,k.rubber);
    k.block(lid,.002,.424,.040,.74,.009,.010,k.rubber);
    for(const x of [-.436,.436])k.screw(lid,x,.091,.033,.013);
  }
  k.wire(scan,[[.479,.083,-.194],[.536,.068,-.252],[.563,.017,-.39],[.67,-.001,-.45],[.847,-.002,-.49]],.007,k.rubber);
  k.cyl(scan,.852,-.002,-.491,.035,.035,.009,k.dark);
  const clip=groupAt(root,-1.17,1.26,-.315);
  if(clip){
    // Real wire clip, original document and its dog-eared corner remain in the original holder.
    k.wire(clip,[[-.076,.321,.061],[-.094,.347,.073],[-.078,.370,.071],[.051,.370,.070],[.07,.349,.070],[.059,.324,.060]],.004,k.satin,6,12);
    for(const x of [-.085,.048])k.screw(clip,x,.341,.055,.014);
  }
  modelInstance(r,root,'chair',.94,.57,.003,-1.04,.13);
  footPads(root,k,[-1.69,1.69,-.566,.087],.012,.044);
}

function hrDetail(root,r,k) {
  const kiosk=groupAt(root,.095,0,-.52);
  if(kiosk){
    // The lower pedestal stopped behind the monitor but its rounded cap intersected the tilted LCD.
    const pedestal=kiosk.children.find(o=>o.isMesh&&Math.abs(o.position.y-.79)<.001&&Math.abs(o.position.z+.02)<.001);
    if(pedestal){pedestal.scale.y=.847;pedestal.position.y=.690;pedestal.position.z=-.108;}
    k.block(kiosk,0,1.314,-.091,.193,.24,.104,k.steel);
    // Moulded NFC shelf sits under the kiosk display, angled towards the incoming employee.
    const dock=k.frame(kiosk,0,1.04,.153);dock.rotation.x=-.31;
    k.block(dock,0,0,0,.252,.086,.055,k.dark);
    for(let i=0;i<3;i++){
      const a=[];
      for(let j=0;j<9;j++){const q=(-.79+j*.197);a.push([Math.cos(q)*(.016+i*.009)-.009,.003+Math.sin(q)*(.016+i*.009),.029]);}
      k.wire(dock,a,.0018,k.satin,5,8);
    }
    k.cyl(dock,.099,0,.030,.005,.005,.004,k.indicator,'z');
    for(const x of [-.168,.168])k.screw(kiosk,x,.26,.095,.014);
  }
  const badge=groupAt(root,-1.22,1.08,-.65);
  if(badge){
    for(const x of [-.29,0,.29]) {
      k.cyl(badge,x,.571,.041,.017,.017,.015,k.satin,'z');
      k.block(badge,x,.554,.046,.045,.018,.006,k.steel);
      // Clear polycarbonate sleeves with individual slot and magnetic contact.
      k.block(badge,x,.554,.030,.114,.009,.007,k.rubber);
    }
  }
  modelInstance(r,root,'plant',1.39,-.49,.002,-1.185,-.37);
}

function purchasingDetail(root,r,k) {
  const common=groupAt(root,0,0,-.20);
  if(!common)return;
  const printer=groupAt(common,1.36,.88,-.12);
  if(printer){
    footPads(printer,k,[-.24,.24,-.17,.17],.003,.030);
    // Paper-cutter lips, individual teeth, lid release and physical feed control.
    k.block(printer,0,.164,.275,.494,.015,.009,k.steel);
    for(let i=0;i<18;i++){
      const tooth=k.block(printer,-.215+i*.025,.156,.280,.013,.010,.004,k.satin);
      tooth.rotation.z=-.30;
    }
    k.block(printer,0,.077,.264,.48,.011,.005,k.dark);
    k.block(printer,-.302,.170,.112,.018,.062,.086,k.dark);
    k.cyl(printer,.216,.277,.10,.020,.021,.006,k.dark);
    k.cyl(printer,.216,.281,.102,.008,.008,.003,k.indicator);
    for(const x of [-.261,.261])k.screw(printer,x,.103,.268,.016);
    k.wire(printer,[[.252,.073,-.22],[.332,.053,-.259],[.34,.003,-.32],[.25,-.002,-.40]],.006,k.rubber);
  }
  for(let index=0;index<3;index++){
    const clip=groupAt(common,-1.53+index*.305,1.145,.034+index*.015);
    if(!clip)continue;
    for(const x of [-.027,.027])k.cyl(clip,x,.20,.036,.007,.007,.007,k.satin,'z',12);
  }
}

function pilotDetail(root,r,k) {
  const bench=groupAt(root,-.38,0,-.15);if(!bench)return;
  const alloy=r.mat('turned stainless flange',{
    color:0xced4d0,metalness:.77,roughness:.87,roughnessMap:r.maps['metal-rough']||null,
    normalMap:r.maps['metal-normal']||null,normalScale:new r.T.Vector2(.13,.13),envMapIntensity:1.12,
  });
  bench.traverse(n=>{
    if(n.isMesh&&n.geometry.type==='ExtrudeGeometry'&&n.geometry.attributes.position.count>1800&&
       n.scale.x<.23&&n.scale.x>.18) n.material=alloy;
  });
  const stage=groupAt(bench,.29,.936,-.021), bridge=groupAt(bench,.27,.936,-.145);
  if(stage){
    k.block(stage,-.005,.090,.293,.57,.021,.013,k.steel);
    for(let i=0;i<24;i++)k.block(stage,-.259+i*.022,.092,.302,.0015,i%5===0?.012:.006,.002,k.rubber);
    // Precision micrometer screw and knurled adjustment collar, in metal and rubber.
    k.cyl(stage,.245,.052,.299,.025,.025,.104,k.satin,'z',24);
    k.cyl(stage,.245,.052,.359,.045,.046,.084,k.steel,'z',32);
    for(let i=0;i<16;i++){const a=tau*i/16;k.block(stage,.245+Math.cos(a)*.044,.052+Math.sin(a)*.044,.360,.004,.004,.061,k.dark);}
    for(const x of [-.25,.25])for(const z of [-.165,.218])k.screw(stage,x,.115,z,.017,'y');
  }
  if(bridge){
    const head=groupAt(bridge,-.020,.86,-.02);
    if(head){
      for(let i=0;i<4;i++)k.cyl(head,0,-.209-i*.007,.125,.095,.095,.003,k.steel,'y',28);
      k.cyl(head,0,-.298,.125,.061,.061,.012,k.lens,'y',28);
      for(const x of [-.076,.076])k.screw(head,x,-.060,.208,.014);
      k.wire(head,[[-.056,.114,.08],[-.060,.197,.08],[-.104,.241,.02],[-.178,.224,-.073]],.009,k.rubber);
      head.traverse(n=>{n.userData.dynamic=true;});
    }
    for(const x of [-.399,.399]){
      for(const y of [.29,.52,.77])k.screw(bridge,x,y,-.136,.017);
      k.block(bridge,x,.947,-.083,.10,.003,.012,k.rubber);
    }
    k.wire(bridge,[[.381,.880,-.215],[.437,.796,-.17],[.47,.584,-.19],[.49,.38,-.246],[.515,.122,-.40]],.008,k.rubber);
  }
}

function recordRoom(root,r,k) {
  const lectern=groupAt(root,1.31,0,-.03);
  if(!lectern)return;
  const book=groupAt(lectern,0,1.05,-.06);if(!book)return;
  for(const x of [-.208,.208]){
    const page=groupAt(book,x,0,.043);if(!page)continue;
    for(let j=0;j<4;j++)k.block(page,0,-.270+.003*j,.010-j*.006,.366,.001,.001,k.steel);
  }
  k.cyl(lectern,.39,1.665,-.17,.027,.027,.026,k.satin,'x',20);
  k.wire(lectern,[[.389,.70,-.164],[.386,.46,-.194],[.344,.19,-.227],[.30,.050,-.239]],.004,k.rubber);
}
function salesDetail(root,r,k) {
  for(const [x,z,yaw,size] of [[-1.50,-.20,1.13,.87],[.180,-.51,-.58,.88]]){
    const old=groupAt(root,x,0,z);
    if(old)modelInstance(r,root,'chair',size,x,.012,z,yaw,old);
  }
  const base=groupAt(root,-.47,0,.14), laptop=base && groupAt(base,.423,.846,.058);
  if(laptop){
    for(const x of [-.198,.198])k.cyl(laptop,x,.053,-.160,.016,.016,.095,k.steel,'x');
    k.block(laptop,-.326,.028,-.014,.003,.009,.040,k.rubber);
    k.block(laptop,-.326,.028,.044,.003,.009,.034,k.rubber);
  }
}
function strategyDetail(root,r,k) {
  const cabinet=groupAt(root,0,0,-.74);if(!cabinet)return;
  for(const x of [-1.651,1.651]){
    for(const y of [.92,2.032])k.screw(cabinet,x,y,.009,.021);
  }
  k.wire(cabinet,[[1.40,.835,-.077],[1.453,.681,-.107],[1.46,.44,-.128],[1.46,.11,-.155]],.011,k.rubber);
}

const details={finance:financeDetail,hr:hrDetail,purchase:purchasingDetail,poc:pilotDetail,
  knowledge:recordRoom,sales:salesDetail,roi:strategyDetail};
export function dressOffice(T, group, id) {
  if(!details[id] || dressed.has(group))return;
  dressed.add(group);
  const res=resources(T), kit=tools(res), originals=[];
  group.traverse(o=>{if(o.isMesh)originals.push(o);});
  for(const mesh of originals){coat(mesh,res);physicalPrints(mesh,res,kit);}
  details[id](group,res,kit);
}
