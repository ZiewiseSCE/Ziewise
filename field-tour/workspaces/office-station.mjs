// Metric furniture for the office half of the continuous facility. The visitor approaches from +Z.
const tau=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
function ease(a,b,p){const t=clamp((p-a)/(b-a));return t*t*(3-2*t);}
const font='"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",Arial,sans-serif';
const mono='Consolas,"Courier New",monospace';
const caches=new WeakMap();
const contactMaterials=new WeakMap();
const keyLegends=new WeakMap();


function workshop(T){
  const geometries=new Map(),images=new Map();
  const boxGeo=new T.BoxGeometry(1,1,1);
  function geometry(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);}
  function radiusBox(w,h,d,r){
    r=Math.min(r,w*.46,h*.46,d*.46);
    return geometry([w,h,d,r].join('/'),()=>{
      const sections=r<.006?3:r>=.015?6:5;
      const g=new T.BoxGeometry(1,1,1,sections,sections,sections),v=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
      const coord=(u,size)=>sections===3?[-size/2,-size/2+r,size/2-r,size/2][Math.round((u+.5)*3)]:
        sections===5?[-size/2,-size/2+r*.44,-size/2+r,size/2-r,size/2-r*.44,size/2][Math.round((u+.5)*5)]:
        [-size/2,-size/2+r*.43,-size/2+r,0,size/2-r,size/2-r*.43,size/2][Math.round((u+.5)*6)];
      const p=new T.Vector3(),q=new T.Vector3(),norm=new T.Vector3();
      for(let i=0;i<v.count;i++){
        const nx=n.getX(i),ny=n.getY(i),nz=n.getZ(i);
        p.set(coord(v.getX(i),w),coord(v.getY(i),h),coord(v.getZ(i),d));
        q.set(clamp(p.x,-w/2+r,w/2-r),clamp(p.y,-h/2+r,h/2-r),clamp(p.z,-d/2+r,d/2-r));
        norm.subVectors(p,q).normalize();p.copy(q).addScaledVector(norm,r);
        v.setXYZ(i,p.x,p.y,p.z);n.setXYZ(i,norm.x,norm.y,norm.z);
        if(nx)uv.setXY(i,.5-nx*p.z/d,.5+p.y/h);
        else if(ny)uv.setXY(i,.5+p.x/w,.5-ny*p.z/d);
        else uv.setXY(i,.5+nz*p.x/w,.5+p.y/h);
      }
      return g;
    });
  }
  function mat(name,color,roughness=.55,metalness=0,options={}){
    return new T.MeshStandardMaterial({name,color,roughness,metalness,...options});
  }
  function light(name,color){return new T.MeshBasicMaterial({name,color,toneMapped:false});}
  function place(g,geo,m,x,y,z,name){
    const mesh=new T.Mesh(geo,m);mesh.position.set(x,y,z);mesh.castShadow=Boolean(m.isMeshStandardMaterial);
    mesh.receiveShadow=Boolean(m.isMeshStandardMaterial);if(name)mesh.name=name;g.add(mesh);return mesh;
  }
  function group(parent,x=0,y=0,z=0,name=''){
    const g=new T.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;
  }
  function box(g,x,y,z,w,h,d,m,r=0){
    if(r)return place(g,radiusBox(w,h,d,r),m,x,y,z);
    const b=place(g,boxGeo,m,x,y,z);b.scale.set(w,h,d);return b;
  }
  function face(g,x,y,z,w,h,m){
    const b=place(g,geometry('plane',()=>new T.PlaneGeometry(1,1)),m,x,y,z);b.scale.set(w,h,1);return b;
  }
  function cyl(g,x,y,z,r,h,m,axis='y',n=24){
    const a=place(g,geometry('c'+n,()=>new T.CylinderGeometry(1,1,1,n)),m,x,y,z);
    a.scale.set(r,h,r);if(axis==='z')a.rotation.x=Math.PI/2;if(axis==='x')a.rotation.z=Math.PI/2;return a;
  }
  function cable(g,coords,r,m){
    const vec=coords.map(v=>new T.Vector3(...v));
    const curve=new T.CatmullRomCurve3(vec,false,'centripetal');
    return place(g,new T.TubeGeometry(curve,Math.max(10,(vec.length-1)*5),r,6,false),m,0,0,0);
  }
  function profile(g,x,width,points,m){
    const s=new T.Shape();points.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));s.closePath();
    const geo=new T.ExtrudeGeometry(s,{depth:width-.012,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:3,curveSegments:4});
    geo.translate(0,0,-(width-.012)/2);geo.rotateY(-Math.PI/2);return place(g,geo,m,x,0,0);
  }
  function tex(file,srgb,rx=1,ry=1){
    const k=[file,srgb,rx,ry].join();
    if(images.has(k))return images.get(k);
    if(typeof document==='undefined')return {t:null,ready:Promise.resolve()};
    let resolve,reject;
    const ready=new Promise((a,b)=>{resolve=a;reject=b;});
    const t=new T.TextureLoader().load(new URL('./'+file,import.meta.url).href,()=>resolve(),undefined,()=>reject(new Error('Could not load '+file)));
    t.name=file;t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;
    if(rx!==1||ry!==1){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);}
    t.anisotropy=4;const resource={t,ready};images.set(k,resource);return resource;
  }
  return {mat,light,box,group,face,cyl,cable,profile,tex};
}

function drawCanvas(T,w,h,name,draw,lit=true){
  if(typeof document==='undefined'){
    const material=lit?new T.MeshBasicMaterial({color:0x3c5b61}):new T.MeshStandardMaterial({color:0xeeeae0});
    material.name=name;return {material,render:()=>{}};
  }
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const ctx=c.getContext('2d'),t=new T.CanvasTexture(c);
  t.name=name;t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;
  const material=lit?new T.MeshBasicMaterial({name,map:t,toneMapped:false}):new T.MeshStandardMaterial({name,map:t,roughness:.84,metalness:0});
  let last;
  function render(state=0){if(last===state)return;ctx.clearRect(0,0,w,h);draw(ctx,state,w,h);t.needsUpdate=true;last=state;}
  render();return {material,render};
}
function words(c,x,y,t,size=20,color='#23342f',weight=500,family=font,align='left'){
  c.fillStyle=color;c.font=weight+' '+size+'px '+family;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(t,x,y);c.textAlign='left';
}
function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}
function line(c,x1,y1,x2,y2,col,w=1){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function disk(c,x,y,r,col){c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,tau);c.fill();}
function cursor(c,x,y){c.beginPath();c.moveTo(x,y);c.lineTo(x+2,y+22);c.lineTo(x+8,y+16);c.lineTo(x+14,y+26);c.lineTo(x+19,y+23);c.lineTo(x+13,y+13);c.lineTo(x+21,y+12);c.closePath();c.fillStyle='#f4fcff';c.fill();c.strokeStyle='#1a242b';c.lineWidth=2;c.stroke();}
function contact(T,s,g,x,y,z,w,d){
  if(typeof document==='undefined')return;
  if(!contactMaterials.has(T)){
    const layer=drawCanvas(T,96,96,'Ground contact occlusion',c=>{
      const f=c.createRadialGradient(48,48,7,48,48,47);
      f.addColorStop(0,'rgba(19,21,20,.48)');f.addColorStop(.36,'rgba(20,21,20,.37)');f.addColorStop(.68,'rgba(21,22,20,.18)');f.addColorStop(1,'rgba(22,23,20,0)');
      c.fillStyle=f;c.fillRect(0,0,96,96);
    });
    layer.material.transparent=true;layer.material.depthWrite=false;layer.material.toneMapped=false;contactMaterials.set(T,layer.material);
  }
  const shadow=s.face(g,x,y,z,w,d,contactMaterials.get(T));shadow.rotation.x=-Math.PI/2;shadow.renderOrder=1;
}
function flatKeyboard(T,s,m,g,x,y,z,w,rows=5){
  const keys=s.group(g,x,y,z,'low profile keyboard'),ratio=w/.46;
  keys.scale.setScalar(ratio);s.box(keys,0,0,0,.46,.016,.139,m.matte,.009);
  for(let j=0;j<rows;j++)for(let i=0;i<15;i++){
    if(j===4&&i>2&&i<9)continue;
    const wide=j===4&&i===2;
    const width=wide?.192:.0234,R=shared.get(T),key='sculpted keycap/'+width;
    if(!R.geometry.has(key)){
      const pts=[],tex=[],index=[];
      const outline=(ww,dd)=>[[-ww+.0018,-dd],[ww-.0018,-dd],[ww,-dd+.0018],[ww,dd-.0018],[ww-.0018,dd],[-ww+.0018,dd],[-ww,dd-.0018],[-ww,-dd+.0018]];
      for(const [yy,sw,sd] of [[-.004,1,1],[.0021,.91,.87],[.004,.86,.78]]){
        for(const [xx,zz] of outline(width*sw*.5,.0191*sd*.5)){pts.push(xx,yy,zz);tex.push(xx/width+.5,.5-zz/.0191);}
      }
      for(let ring=0;ring<2;ring++)for(let q=0;q<8;q++){const a=ring*8+q,b=ring*8+(q+1)%8,c=b+8,d=a+8;index.push(a,d,c,a,c,b);}
      pts.push(0,.0036,0);tex.push(.5,.5);for(let q=0;q<8;q++)index.push(24,16+(q+1)%8,16+q);
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(tex,2));geo.setIndex(index);geo.computeVertexNormals();R.geometry.set(key,geo);
    }
    const cap=new T.Mesh(R.geometry.get(key),m.body);cap.position.set(-.203+i*.0286+(wide?.085:0),.010+.0006*(4-j),-.049+j*.0243);
    cap.castShadow=cap.receiveShadow=true;keys.add(cap);
  }
  if(!keyLegends.has(T)){
    const legends=drawCanvas(T,780,236,'Physical keyboard legends',c=>{
      const layout=[['Esc','1','2','3','4','5','6','7','8','9','0','−','+','⌫','Del'],
        ['Tab','Q','W','E','R','T','Y','U','I','O','P','[',']','↵','Pg'],
        ['⇥','A','S','D','F','G','H','J','K','L',';',':','Enter','↑','End'],
        ['⇧','Z','X','C','V','B','N','M',',','.','/','⇧','←','↓','→'],
        ['Ctrl','Alt','','','','','','','','Alt','Fn','⌘','⌥','Ctrl','↵']];
      for(let j=0;j<5;j++)for(let i=0;i<15;i++){
        const xx=(-.203+i*.0286+.23)/.46*780,yy=(-.049+j*.0243+.0695)/.139*236;
        words(c,xx,yy+5,layout[j][i],i===0?11:13,'#c2c5bc',600,mono,'center');
      }
    });
    legends.material.transparent=true;legends.material.depthWrite=false;legends.material.alphaTest=.13;keyLegends.set(T,legends.material);
  }
  const type=s.face(keys,0,.0168,0,.46,.139,keyLegends.get(T));type.rotation.x=-Math.PI/2;
  return keys;
}

const shared=new WeakMap();
function resources(T,s){
  if(shared.has(T))return shared.get(T);
  const images=[],mats=new Map(),geometry=new Map(),persons=new Map();
  function image(code,colour,scale=1){const entry=s.tex('maps/'+code+'.webp',colour,scale,scale);images.push(entry.ready);return entry.t;}
  const wood=image('wood-base',true),wn=image('wood-normal',false),wr=image('wood-rough',false);
  const cloth=image('cloth-base',true),cn=image('cloth-normal',false),cr=image('cloth-rough',false);
  const metal=image('metal-base',true),mn=image('metal-normal',false),mr=image('metal-rough',false);
  const pn=image('paper-normal',false),pr=image('paper-rough',false);
  for(const t of [wood,wn,wr,cloth,cn,cr,metal,mn,mr,pn,pr])if(t)t.wrapS=t.wrapT=T.RepeatWrapping;
  function mat(name,color,roughness,metalness=0,props={}){
    if(!mats.has(name))mats.set(name,s.mat('Office '+name,color,roughness,metalness,props));return mats.get(name);
  }
  function veneer(name,c){const m=mat(name,c,.85,0,{map:wood,normalMap:wn,roughnessMap:wr});m.normalScale.set(.38,.38);return m;}
  function textile(name,c){const m=mat(name,c,.99,0,{map:cloth,normalMap:cn,roughnessMap:cr});m.normalScale.set(.57,.57);return m;}
  const m={ oak:veneer('natural white-oiled oak',0xf8e4bd),ash:veneer('smoked ash',0xc2ae98),
    darkWood:veneer('walnut',0x9e7757),fabric:textile('charcoal upholstery',0x535b5e),
    petrol:textile('slate upholstery',0x557375),creamFabric:textile('warm woven wool',0xb9ac92),
    felt:textile('acoustic divider textile',0x878f88),matte:mat('powder-coated graphite',0x424b4c,.50,.20),
    body:mat('satin charcoal polymer',0x30393b,.43,.035),black:mat('deep black molded rubbers',0x171e1f,.83),
    frame:mat('anodised graphite',0x363f41,.32,.54),steel:mat('brushed steel',0xc6ced0,.91,.84,{map:metal,normalMap:mn,roughnessMap:mr}),
    bright:mat('satin extruded aluminium',0xd7dddb,.70,.83,{normalMap:mn,roughnessMap:mr}),
    white:mat('warm moulded polymer',0xe3e3d8,.42,.08),cream:mat('powder-coated cabinet',0xcacbc0,.49,.17),
    paper:mat('uncoated document stock',0xf4f0df,.96,0,{normalMap:pn,roughnessMap:pr}),kraft:mat('unbleached fibre',0xc29d70,.94,0,{normalMap:pn}),
    binder:mat('green linen bound',0x586d60,.73,0,{normalMap:cn}),blue:mat('navy linen bound',0x384d64,.74,0,{normalMap:cn}),
    tan:mat('clay cloth cover',0x9f7861,.75,0,{normalMap:cn}),deskPad:mat('soft desk blotter',0x68716a,.93,0,{normalMap:cn}),
    green:mat('deep sage enamel',0x688074,.43,.15),pass:mat('translucent card shell',0xccd2bf,.29,.12),
    orange:mat('amber instrument enamel',0xb39754,.40,.18),darkGlass:mat('optical glass',0x253939,.16,.49),
    ok:s.light('instrument indicator',0x9bbf9b),amber:s.light('standby indication',0xe0aa70)};
  m.steel.normalScale.set(.19,.19);m.bright.normalScale.set(.18,.18);m.paper.normalScale.set(.13,.13);m.kraft.normalScale.set(.20,.20);
  m.glass=new T.MeshPhysicalMaterial({name:'Office laminated clear glass',color:0xc9ded8,metalness:.08,roughness:.12,clearcoat:.9,clearcoatRoughness:.1,
    transparent:true,opacity:.12,depthWrite:false,side:T.DoubleSide,envMapIntensity:1.1});
  m.glassEdge=new T.MeshPhysicalMaterial({name:'Office polished glass edges',color:0x83aca1,metalness:.20,roughness:.15,clearcoat:.88,clearcoatRoughness:.12,transparent:true,opacity:.72,depthWrite:false});
  m.shade=mat('lamp inner reflector',0xe7e1cb,.37,.22);m.lamp=s.light('warm task lamp emitter',0xffe1ad);
  m.leaf=mat('scanned leaves',0xffffff,.64,.02,{map:image('leaf-base',true),normalMap:image('leaf-normal',false),alphaTest:.47,side:T.DoubleSide});
  m.pot=mat('scanned ceramic',0xffffff,.70,.02,{map:image('pot-base',true),normalMap:image('pot-normal',false)});
  for(const t of [m.leaf.map,m.leaf.normalMap,m.pot.map,m.pot.normalMap])if(t)t.flipY=false;
  const result={m,geometry,persons,mats,materialsReady:Promise.all(images)};shared.set(T,result);return result;
}
function normalBox(T,s,R,parent,x,y,z,w,h,d,r,mat){
  const box=s.box(parent,x,y,z,w,h,d,mat,r);
  if(!mat.map||(![R.m.oak,R.m.ash,R.m.darkWood].includes(mat)))return box;
  const key='metric-veneer/'+[w,h,d,r].join('/');
  if(!R.geometry.has(key)){
    const g=box.geometry.clone(),pos=g.attributes.position,uv=g.attributes.uv;
    // Follow the sheet continuously in x and bend its cross-grain coordinates over
    // the routed front and back edges. End grain uses the actual board thickness.
    for(let i=0;i<pos.count;i++){
      const px=pos.getX(i),py=pos.getY(i),pz=pos.getZ(i);
      const ex=Math.abs(px)>w*.5-r*.45&&Math.abs(g.attributes.normal.getX(i))>.72;
      const top=py>0;
      const v=(pz+(top?0:(h-2*py)*.5*Math.sign(pz||1)))*1.18;
      uv.setXY(i,ex?pz*1.13+.29:px*1.13+.43,ex?py*1.75+.38:v+.41);
    }
    R.geometry.set(key,g);
  }box.geometry=R.geometry.get(key);return box;
}
function orb(T,s,g,x,y,z,rx,ry,rz,m,n=24){
  const R=shared.get(T),key='ellipsoid/'+n;
  if(!R.geometry.has(key))R.geometry.set(key,new T.SphereGeometry(1,n,Math.max(8,Math.round(n/2))));
  const a=new T.Mesh(R.geometry.get(key),m);a.position.set(x,y,z);a.scale.set(rx,ry,rz);a.castShadow=a.receiveShadow=true;g.add(a);return a;
}
function beam(T,s,g,from,to,w,d,m,r=.004){
  const a=new T.Vector3(...from),b=new T.Vector3(...to),direction=b.clone().sub(a),center=a.clone().add(b).multiplyScalar(.5);
  const i=s.box(g,center.x,center.y,center.z,w,direction.length(),d,m,r);i.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());return i;
}
function curvePath(s,parent,coords,r,m){return s.cable(parent,coords,r,m);}
function plant(T,s,R,parent,x,y,z,h,yaw,wait){
  if(typeof document==='undefined')return;
  if(!R.plant)R.plant=fetch(new URL('./foliage.bin',import.meta.url)).then(async r=>{
    if(!r.ok)throw Error('Missing office plant');const b=await r.arrayBuffer(),dv=new DataView(b),n=dv.getUint32(4,true);
    const info=JSON.parse(new TextDecoder().decode(new Uint8Array(b,8,n)));let at=8+n;
    return info.map(e=>{
      const p=new Float32Array(e.n*3),normal=new Float32Array(e.n*3),uv=new Float32Array(e.n*2),idx=new Uint16Array(e.indices);
      for(let k=0;k<p.length;k++,at+=2)p[k]=e.min[k%3]+e.range[k%3]*dv.getUint16(at,true)/65535;
      for(let k=0;k<normal.length;k++,at++)normal[k]=dv.getInt8(at)/127;
      for(let k=0;k<uv.length;k++,at+=2)uv[k]=e.tmin[k%2]+e.tr[k%2]*dv.getUint16(at,true)/65535;
      for(let k=0;k<idx.length;k++,at+=2)idx[k]=dv.getUint16(at,true);
      const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('normal',new T.BufferAttribute(normal,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setIndex(new T.BufferAttribute(idx,1));g.normalizeNormals();g.computeBoundingSphere();return {g,tag:e.id};
    });
  });
  const holder=s.group(parent,x,y,z,'Potted work plant');holder.scale.setScalar(h);holder.rotation.y=yaw;holder.userData.dynamic=true;
  wait.push(R.plant.then(parts=>{
    for(const p of parts){const mesh=new T.Mesh(p.g,p.tag.endsWith('leaf')?R.m.leaf:R.m.pot);mesh.castShadow=mesh.receiveShadow=true;holder.add(mesh);}
    s.cyl(holder,.053,.373,.109,.19,.009,R.m.kraft);holder.updateWorldMatrix(true,true);
  }));
}
function person(T,s,R,parent,id,wait,wardrobe){
  if(typeof document==='undefined')return;
  if(!R.persons.has(id))R.persons.set(id,import('../vendor/loaders/GLTFLoader.js').then(({GLTFLoader})=>{
    return new GLTFLoader().loadAsync(new URL('./'+id+'.glb',import.meta.url).href);
  }).then(asset=>{asset.scene.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;}});return asset.scene;}));
  const holder=s.group(parent,0,0,0,'Seated office colleague');holder.userData.dynamic=true;
  wait.push(R.persons.get(id).then(original=>{
    const scene=original.clone(true);
    if(wardrobe)scene.traverse(o=>{
      if(!o.isMesh||!o.material||Array.isArray(o.material)||!/\btop$|casualsuit01$|elegantsuit01$/i.test(o.material.name))return;
      const key='worker fabric/'+o.material.uuid+'/'+wardrobe;
      if(!R.mats.has(key)){const m=o.material.clone();m.color.multiply(new T.Color(wardrobe));R.mats.set(key,m);}
      o.material=R.mats.get(key);
    });
    holder.add(scene);holder.updateWorldMatrix(true,true);
  }));
}

function cushion(T,R,w,d,h,back=false){
  const key='tailored/'+[w,d,h,back].join('/');if(R.geometry.has(key))return R.geometry.get(key);
  const uCount=40,vCount=18,p=[],n=[],uv=[],ids=[];
  // A superellipse keeps wide, softly rounded corners. The upholstered faces
  // crown at their centre and sag subtly beneath the thighs or lumbar region.
  for(let j=0;j<=vCount;j++){
    const v=j/vCount,beta=(v-.5)*Math.PI,rad=Math.pow(Math.max(.0002,Math.cos(beta)),.32);
    for(let i=0;i<=uCount;i++){
      const a=i/uCount*tau,ca=Math.cos(a),sa=Math.sin(a);
      const ex=Math.sign(ca)*Math.abs(ca)**.64,ez=Math.sign(sa)*Math.abs(sa)**.62;
      let x=ex*w*.5*rad,z=ez*d*.5*rad,y=Math.sign(Math.sin(beta))*Math.abs(Math.sin(beta))**.52*h*.5;
      if(back){
        const rise=(z/d+.50);x*=.84+.16*Math.sin(rise*Math.PI);
        y+=.022*Math.cos(x/w*Math.PI*2)+.025*Math.exp(-(((rise-.31)/.20)**2));
      }else if(v>.5){y-=.012*Math.exp(-((x/w*2)**2+((z/d)*2)**2)*3);y+=.005*Math.cos(z/d*5.2);}
      p.push(x,y,z);n.push(0,1,0);uv.push(i/uCount*3,v*2);
      if(i&&j){const a1=(j-1)*(uCount+1)+i-1,b=a1+1,c=j*(uCount+1)+i,e=c-1;ids.push(a1,c,b,a1,e,c);}
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();g.computeBoundingSphere();R.geometry.set(key,g);return g;
}
function pillow(T,R,g,x,y,z,w,d,h,mat,back=false){
  const p=new T.Mesh(cushion(T,R,w,d,h,back),mat);p.position.set(x,y,z);p.castShadow=p.receiveShadow=true;g.add(p);return p;
}
function ergonomic(T,s,R,root,x,z,yaw,who,wait,colour=R.m.fabric){
  const m=R.m,g=s.group(root,x,0,z,'Ergonomic task chair');g.rotation.y=yaw;
  const height=who==='coordinator'?.456:.474;
  s.cyl(g,0,.151,0,.037,.208,m.black);s.cyl(g,0,.278,0,.023,.115,m.steel);
  s.cyl(g,0,.338,0,.051,.034,m.body);
  for(let j=0;j<5;j++){
    const a=j*tau/5+.31,xx=Math.cos(a),zz=Math.sin(a);
    beam(T,s,g,[xx*.045,.163,zz*.045],[xx*.292,.076,zz*.292],.037,.030,m.frame,.009);
    s.cyl(g,xx*.29,.063,zz*.29,.019,.054,m.body);
    const twin=s.group(g,xx*.292,.039,zz*.292);twin.rotation.y=-a+.6;
    for(const dx of [-.015,.015]){s.cyl(twin,dx,0,0,.034,.015,m.black,'x');s.cyl(twin,dx+Math.sign(dx)*.008,0,0,.011,.002,m.steel,'x');}
  }
  s.box(g,0,height-.091,.025,.265,.053,.225,m.matte,.018);
  pillow(T,R,g,0,height-.046,.060,.502,.487,.073,m.body);
  pillow(T,R,g,0,height-.008,.057,.497,.481,.089,colour);
  const seatRim=[];for(let i=0;i<=42;i++){const a=i*tau/42;seatRim.push([.249*Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**.65,height-.018,.057+.237*Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**.66]);}
  curvePath(s,g,seatRim,.0020,m.body);
  for(const a of [-1,1]){
    curvePath(s,g,[[a*.191,height-.063,.01],[a*.246,height-.04,.012],[a*.261,height+.041,-.006],[a*.260,height+.115,.014]],.013,m.frame);
    s.box(g,a*.257,height+.148,.038,.055,.027,.170,m.body,.011);
  }
  const pitch=-.11;
  const pad=s.group(g,0,height+.285,-.170,'Contoured lumbar back');pad.rotation.x=pitch;
  for(const a of [-1,1])curvePath(s,g,[[a*.105,height-.068,-.091],[a*.145,height+.003,-.170],[a*.169,height+.152,-.218],[a*.144,height+.473,-.231]],.015,m.matte);
  const rear=pillow(T,R,pad,0,0,-.013,.455,.497,.052,m.body,true);rear.rotation.x=-Math.PI/2;
  const cloth=pillow(T,R,pad,0,.002,.015,.446,.49,.074,colour,true);cloth.rotation.x=-Math.PI/2;
  const seam=[];for(let j=0;j<=38;j++){const a=j*tau/38;seam.push([.221*Math.sign(Math.cos(a))*Math.abs(Math.cos(a))**.68,.247*Math.sign(Math.sin(a))*Math.abs(Math.sin(a))**.65,.031]);}
  curvePath(s,pad,seam,.0017,m.body);s.box(g,.170,height-.093,.133,.118,.015,.034,m.body,.005);
  contact(T,s,g,0,.008,.02,.83,.82);
  if(who){
    const body=s.group(g,0,who==='coordinator'?0:.001,-.018);
    const wardrobe={knowledge:0xb8cac7,purchase:0xb7b5ab,roi:0xd1c6bc,poc:0xadbfc9}[root.userData.department];
    person(T,s,R,body,who,wait,wardrobe);
  }
  return g;
}

function glasswork(T,s,R,p,x,y,z,w,h,d){
  const m=R.m;
  s.box(p,x,y,z,w,h,d,m.glass).castShadow=false;
  for(const yy of [-1,1])s.box(p,x,y+yy*h*.5,z,w,.005,d,m.glassEdge,.001).castShadow=false;
  for(const xx of [-1,1])s.box(p,x+xx*w*.5,y,z,.005,h,d,m.glassEdge,.001).castShadow=false;
}
function glassMat(s,R,b,x,z,w,d){
  const m=R.m;
  s.box(b,x,.762,z,w,.006,d,m.glass,.0024).castShadow=false;
  for(const side of [-1,1]){
    s.box(b,x,.762,z+side*d*.5,w,.004,.0018,m.glassEdge,.0007).castShadow=false;
    s.box(b,x+side*w*.5,.762,z,.0018,.004,d,m.glassEdge,.0007).castShadow=false;
    for(const end of [-1,1])s.cyl(b,x+side*(w/2-.014),.7585,z+end*(d/2-.015),.006,.003,m.darkGlass,'y',12);
  }
}
function bench(T,s,R,p,id){
  const m=R.m,b=s.group(p,0,0,-.08,'Height-adjustable work desk');
  const veneer=id==='finance'||id==='roi'?m.ash:id==='sales'?m.darkWood:m.oak;
  normalBox(T,s,R,b,0,.736,0,2.40,.042,.873,id==='sales'?.020:.012,veneer);
  s.box(b,0,.711,-.014,2.338,.011,.816,m.body,.005);
  for(const x of [-.965,.965]){
    s.box(b,x,.682,-.035,.101,.036,.635,m.frame,.006);
    s.box(b,x,.471,-.040,.076,.403,.085,m.matte,.005);
    s.box(b,x,.229,-.040,.064,.214,.073,m.bright,.004);
    s.box(b,x,.096,-.040,.058,.11,.063,m.frame,.004);
    s.box(b,x,.062,-.010,.094,.039,.62,m.matte,.009);
    for(const zz of [-.246,.225])s.cyl(b,x,.024,zz,.030,.038,m.black);
  }
  s.box(b,0,.641,-.214,1.932,.056,.052,m.matte,.004);
  s.box(b,.73,.692,.391,.185,.027,.050,m.body,.007);
  for(const xx of [.683,.716,.752])s.cyl(b,xx,.694,.418,.004,.002,m.steel,'z',10);
  // The open steel cable basket has individual bent hoops; bundled cables return to the floor.
  s.box(b,.10,.598,-.310,1.50,.019,.126,m.frame,.003);
  for(let i=0;i<10;i++)curvePath(s,b,[[-.56+i*.145,.65,-.347],[-.56+i*.145,.591,-.352],[-.56+i*.145,.584,-.273],[-.56+i*.145,.639,-.249]],.0033,m.steel);
  for(let i=0;i<3;i++)curvePath(s,b,[[.51,.710,-.35],[.58,.658,-.37-i*.008],[.66,.618,-.31-i*.009],[.89,.585,-.31],[.957,.411,-.273],[.99,.170,-.306],[.978,.052,-.40-i*.018]],.0051,m.black);
  for(const xx of [-.51,.46]){s.cyl(b,xx,.759,-.317,.031,.006,m.frame);s.box(b,xx,.762,-.318,.029,.003,.005,m.black);}
  contact(T,s,b,0,.006,0,2.65,1.11);
  return b;
}
function cabinet(T,s,R,root,x,z,w=1.04,height=.77,open=false){
  const m=R.m,c=s.group(root,x,0,z,'Department file storage');
  s.box(c,0,.047,0,w-.085,.075,.326,m.matte,.010);
  normalBox(T,s,R,c,0,height/2+.03,0,w,height-.060,.364,.009,m.ash);
  normalBox(T,s,R,c,0,height+.01,0,w+.025,.028,.39,.006,m.oak);
  for(const side of [-1,1]){
    const xx=side*w*.25;
    if(open&&side===-1){
      s.box(c,xx,height*.55,.184,w*.48,height*.69,.021,m.body);
      for(let i=0;i<5;i++)binder(T,s,R,c,xx-.140+i*.06,height*.22,.181,.054,.278,.163,[m.blue,m.binder,m.tan][i%3],i+1);
    }else{
      for(let j=0;j<2;j++){
        const yy=.07+(j+.5)*(height-.075)/2;
        s.box(c,xx,yy,.19,w*.49,(height-.075)/2-.009,.030,m.cream,.007);
        s.box(c,xx,yy+.10,.211,.118,.016,.025,m.frame,.004);
      }
    }
  }return c;
}
function accountsShelves(T,s,R,c){
  const m=R.m,shelf=s.group(c,0,.755,-.006,'Open finance archive');
  normalBox(T,s,R,shelf,0,.338,-.138,.865,.667,.020,.004,m.ash);
  for(const a of [-1,1])normalBox(T,s,R,shelf,a*.421,.341,0,.019,.684,.280,.003,m.ash);
  for(const y of [.009,.341,.674])normalBox(T,s,R,shelf,0,y,0,.854,.017,.285,.003,m.oak);
  for(let j=0;j<2;j++)for(let i=0;i<(j?5:7);i++){
    const f=binder(T,s,R,shelf,-.341+i*.091,.022+j*.333,-.015,.069,.274+(i%3)*.009,.193,[m.tan,m.binder,m.blue,m.cream][(i+j)%4],i);
    f.rotation.z=i===(j?4:6)?-.06:0;
  }
  for(let i=0;i<3;i++)normalBox(T,s,R,shelf,.250,.369+i*.028,-.016,.206,.025,.179,.004,i===1?m.blue:m.paper);
}
function binder(T,s,R,root,x,y,z,w,h,d,mat,index){
  const m=R.m,b=s.group(root,x,y,z,'Working ring binder');
  s.box(b,0,h*.50,0,w*.86,h*.972,d*.94,m.paper,.002);
  for(const a of [-1,1])s.box(b,a*w*.48,h*.50,0,.0037,h,d,mat,.0012);
  s.box(b,0,h*.50,d*.492,w,h,.010,mat,.004);
  s.box(b,0,h*.63,d*.516,w*.68,h*.291,.003,m.paper);
  for(let i=0;i<3;i++)s.box(b,0,h*(.6+i*.041),d*.530,w*(.45-i*.07),.0018,.001,m.matte);
  s.cyl(b,0,h*.232,d*.518,w*.172,.0037,m.steel,'z',14);
  s.cyl(b,0,h*.232,d*.532,w*.12,.0018,m.black,'z',14);
  return b;
}
function divider(T,s,R,root,theme){
  const m=R.m,b=s.group(root,0,0,-.862,'Glass privacy and acoustic division');
  const right=theme==='finance'||theme==='sales';
  const x=right?.37:-.37,w=2.35;
  for(const xx of [x-w*.5,x+w*.5]){
    s.box(b,xx,.603,0,.027,1.20,.050,m.bright,.004);s.box(b,xx,.037,0,.095,.019,.087,m.steel,.003);
  }
  s.box(b,x,.54,-.004,w,.86,.034,m.felt,.010);
  glasswork(T,s,R,b,x,1.175,-.005,w,.432,.009);
  for(const xx of [x-w*.43,x+w*.43])s.box(b,xx,.975,.003,.054,.072,.028,m.steel,.006);
}
function deskLamp(T,s,R,p,x,y,z,hand=1){
  const m=R.m,l=s.group(p,x,y,z,'Adjustable task light');
  s.cyl(l,0,.014,0,.092,.024,m.matte);s.cyl(l,0,.035,0,.038,.024,m.steel);
  beam(T,s,l,[0,.036,0],[.038*hand,.28,-.031],.020,.024,m.matte,.004);
  beam(T,s,l,[.038*hand,.28,-.031],[.201*hand,.379,.003],.016,.020,m.matte,.0035);
  for(const [xx,yy,zz] of [[0,.053,0],[.038*hand,.278,-.031],[.201*hand,.377,.002]])s.cyl(l,xx,yy,zz,.018,.032,m.steel,'z',18);
  const shade=s.group(l,.221*hand,.370,.045);shade.rotation.z=-hand*.17;
  s.box(shade,0,0,0,.199,.026,.069,m.matte,.009);
  s.box(shade,0,-.014,0,.170,.004,.050,m.lamp,.0018);
  curvePath(s,l,[[-.012,.025,-.064],[-.042,.015,-.084],[-.106,.009,-.115],[-.158,.009,-.151]],.0037,m.black);
}
function monitor(T,s,R,p,x,y,z,w,yaw,drawing){
  const m=R.m,base=s.group(p,x,y,z,'Monitor, height-adjustable VESA stand');
  base.rotation.y=yaw;
  normalBox(T,s,R,base,0,.015,.005,.270,.027,.191,.009,m.frame);
  s.box(base,0,.027,-.017,.119,.014,.092,m.matte,.005);
  const h=w*.568,mid=.169+h*.52;
  const spine=s.box(base,0,.171,-.035,.046,.286,.053,m.bright,.008);spine.rotation.x=-.09;
  s.box(base,0,.269,-.013,.049,.134,.044,m.body,.005);
  s.cyl(base,0,.292,.003,.027,.083,m.steel,'x');
  const housing=s.group(base,0,mid,.027,'Matte office display');housing.rotation.x=-.055;
  s.box(housing,0,0,0,w,h,.026,m.frame,.009);
  s.box(housing,0,-.007,-.022,w*.57,h*.62,.031,m.body,.012);
  s.box(housing,0,.002,.015,w-.010,h-.010,.006,m.black,.002);
  s.face(housing,0,.003,.019,w-.020,h-.022,drawing.material);
  s.box(housing,w*.40,-h*.47,.020,.009,.002,.001,m.ok);
  for(let i=0;i<12;i++)s.box(housing,-w*.20+i*w*.036,-h*.22,-.040,.011,.006,.002,m.black);
  curvePath(s,base,[[-.024,.186,-.026],[-.055,.144,-.091],[-.071,.085,-.096],[-.136,.015,-.114],[-.195,.012,-.124]],.0045,m.black);
  return base;
}
function laptop(T,s,R,p,x,y,z,yaw,drawing,w=.38){
  const m=R.m,g=s.group(p,x,y,z,'Working notebook computer');g.rotation.y=yaw;
  s.box(g,0,.008,0,w,.014,w*.66,m.bright,.006);
  flatKeyboard(T,s,m,g,0,.017,-w*.10,w*.86);
  s.box(g,0,.017,w*.19,w*.25,.0018,w*.115,m.matte,.0006);
  const lid=s.group(g,0,.017,-w*.30);lid.rotation.x=-.21;
  s.box(lid,0,w*.287,0,w,w*.57,.010,m.frame,.004);s.face(lid,0,w*.289,.0058,w-.012,w*.57-.019,drawing.material);
  for(const xx of [-.32,.32])s.cyl(g,xx*w,.020,-w*.30,.008,w*.17,m.steel,'x');
  return g;
}
function peripherals(T,s,R,b,x=.02,z=.17){
  const m=R.m,p=s.group(b,x,.760,z,'Input tools and mouse mat');
  s.box(p,0,.002,.005,.66,.005,.267,m.deskPad,.002);
  flatKeyboard(T,s,m,p,-.063,.014,-.010,.446);
  const mouse=s.group(p,.235,.014,.026);mouse.rotation.y=-.13;
  orb(T,s,mouse,0,.008,0,.031,.010,.054,m.black);
  orb(T,s,mouse,0,.017,-.002,.030,.016,.052,m.body);
  orb(T,s,mouse,-.010,.024,-.018,.015,.009,.028,m.matte,16);
  orb(T,s,mouse,.010,.024,-.018,.015,.009,.028,m.matte,16);
  s.cyl(mouse,0,.033,-.016,.0065,.006,m.black,'x',18);
  curvePath(s,p,[[.235,.025,-.021],[.244,.009,-.060],[.281,.007,-.11],[.282,.007,-.142],[.251,.007,-.182]],.0026,m.black);
  return p;
}
function pen(T,s,R,p,x,y,z,angle=.1,colour=R.m.blue){
  const m=R.m,g=s.group(p,x,y,z,'Refillable ballpoint');g.rotation.y=angle;
  s.cyl(g,0,0,0,.0047,.112,colour,'x',12);s.cyl(g,.060,0,0,.0035,.011,m.steel,'x',14);
  s.cyl(g,-.064,0,0,.0037,.015,m.steel,'x',14);s.box(g,.024,.005,.003,.036,.002,.003,m.bright,.0005);
}
function mug(T,s,R,p,x,y,z){
  const m=R.m,g=s.group(p,x,y,z,'Glazed ceramic mug');s.cyl(g,0,.044,0,.038,.080,m.white,'y',44);
  s.cyl(g,0,.084,0,.035,.003,m.paper,'y',42);s.cyl(g,0,.0855,0,.032,.0015,m.darkWood,'y',42);
  curvePath(s,g,[[.032,.070,0],[.053,.068,0],[.058,.049,0],[.052,.030,0],[.034,.025,0]],.0053,m.white);
}
function trays(T,s,R,b,x,y,z){
  const m=R.m,p=s.group(b,x,y,z,'Stackable metal document trays');p.rotation.y=-.08;
  for(let j=0;j<2;j++){
    const yy=.012+j*.068;s.box(p,0,yy,0,.251,.008,.315,m.steel,.003);
    for(const xx of [-.123,.123]){s.box(p,xx,yy+.018,0,.005,.043,.311,m.matte,.002);s.box(p,xx,yy+.049,-.120,.009,.065,.012,m.matte,.003);}
    s.box(p,0,yy+.023,-.151,.241,.047,.006,m.matte,.002);
    for(let i=0;i<3;i++){const doc=s.box(p,(i-1)*.002,yy+.009+i*.002,-.004,.211,.0019,.281,m.paper);doc.rotation.y=.008*i;}
  }return p;
}

const workflow={
 hr:{team:'인사 운영',title:'온보딩 준비',ticket:'HR-024',document:'입사 준비 서류',sub:'신규 입사자 준비 목록',head:['준비 항목','담당','확인'],rows:[['입사 서류','인사팀','접수'],['업무용 계정','전산팀','요청 대기'],['업무 권한','부서장','확인 필요']],evidence:'접수 문서 · 업무 권한 요청',decision:'계정·권한 요청',result:[['계정 개설','요청 등록'],['업무 권한','검토 요청'],['요청 번호','REQ-024']]},
 finance:{team:'재무 회계',title:'경비 증빙 검토',ticket:'AC-041',document:'경비 지출 증빙',sub:'증빙 자료와 회계 정책',head:['대조 항목','증빙','검토'],rows:[['거래 금액','48,000원','일치'],['비용 구분','소모품비','일치'],['승인 절차','팀장 확인','검토']],evidence:'경비 지침 4.2 · 영수증 041',decision:'ERP 전표',result:[['거래 금액','48,000원'],['계정 과목','소모품비'],['승인 후 전표','JV-041']]},
 knowledge:{team:'사내 AI 운영',title:'사내 문서 검색',ticket:'KB-012',document:'작업 표준서 · 개정 3',sub:'로컬 검색 · 인용 근거',head:['검색 결과','문서','범위'],rows:[['교대 점검 순서','표준서 2.3','열람 허용'],['정비 확인 기준','설비 지침 4','열람 허용'],['인사 기록','제한 문서','제외']],evidence:'교대 점검 순서 → 표준서 2.3',decision:'연결 구성',result:[['기본 처리','로컬 서버'],['문서 색인','사내 저장'],['외부 API','선택 사항']]},
 purchase:{team:'자재 구매',title:'공급사 견적 비교',ticket:'PO-018',document:'구매 견적서',sub:'같은 규격의 견적 조건',head:['제안','단가','납기'],rows:[['공급사 A','18,400원','5일'],['공급사 B','18,200원','9일'],['요청 규격','규격 일치','7일 이내']],evidence:'구매 요청서 · 견적 2건',decision:'발주 검토',result:[['우선 검토','공급사 A'],['승인 상태','담당자 승인'],['발주 번호','PO-018']]},
 sales:{team:'영업 지원',title:'상담과 견적',ticket:'CRM-076',document:'고객 상담 기록',sub:'상담 기록에서 견적 초안으로',head:['요청 사항','근거','검토'],rows:[['현장 설치','상담 노트','반영'],['유지 보수','가격표 04','반영'],['납품 일정','고객 요청','확인']],evidence:'상담 노트 076 · 가격표 04',decision:'CRM 후속 일정',result:[['업무','견적 전달'],['담당자','영업 담당'],['후속 일정','고객 확인']]},
 roi:{team:'운영 분석',title:'투자 효과 산정',ticket:'OP-008',document:'처리 시간 측정표',sub:'월간 기준값과 절감 시간',head:['입력값','수치','단위'],rows:[['월 처리량','2,000','건'],['건당 단축 시간','8','분'],['월 확보 시간','266.7','시간']],evidence:'2,000건 × 8분 ÷ 60',decision:'도입 조건',result:[['월 확보 시간','약 267시간'],['도입 비용','별도 입력'],['운영 비용','별도 입력']]},
 poc:{team:'공정 실증',title:'현장 비교 검증',ticket:'PT-006',document:'현장 시험 기록지',sub:'동일 조건으로 샘플 비교',head:['비교 조건','설정','상태'],rows:[['조명과 위치','고정 지그','동일'],['판정 기준','규격 개정 3','대조'],['검토 샘플','시편 06','재확인']],evidence:'시편 06 · 시험 기록 006',decision:'실증 검토',result:[['판정','담당자 검토'],['확인 항목','재현성'],['다음 단계','보완 후 재검']]}
};
function ui(T,id,detail=false){
  const d=workflow[id],dark=['knowledge','poc'].includes(id);
  const panel=drawCanvas(T,840,482,(detail?'Decision ':'Workstation ')+id,(c,viewState)=>{
    const state=viewState%100,compact=viewState>=100;
    const phase=state%4,provided=['로컬 서버','GPT','Claude','Gemini'][Math.floor(state/4)]||'로컬 서버';
    const bg=dark?'#202c30':'#f1f0e9',fg=dark?'#e0e8e6':'#2b3c37',sub=dark?'#acc0c4':'#67776e',accent=dark?'#91c8bd':'#356759',rule=dark?'#43565a':'#c3cbc1',tile=dark?'#304147':'#e0e7dc';
    rect(c,0,0,840,482,bg);rect(c,0,0,840,52,dark?'#2b3b40':'#30473e');
    words(c,24,35,d.team,22,'#eef2e9',700);words(c,813,34,'예시 자료   /   '+d.ticket,17,'#d6e1d5',550,font,'right');
    words(c,25,111,detail?d.decision:d.title,compact?44:36,fg,700);
    words(c,26,149,detail?(phase===2?'담당자 확인 후 처리':'검토 중인 연결 업무'):d.sub,20,sub,500);
    line(c,25,169,815,169,rule,2);
    if(compact){
      const items=detail?d.result:d.rows,chosen=items[phase];
      rect(c,25,191,790,81,tile);words(c,41,243,chosen[0],33,fg,700);
      words(c,793,243,chosen[1],32,accent,650,font,'right');
      const under=[0,1,2].filter(i=>i!==phase);
      under.forEach((i,j)=>{const y=309+j*54;words(c,34,y,items[i][0],27,fg,600);words(c,797,y,items[i][1],26,sub,560,font,'right');line(c,30,y+16,808,y+16,rule);});
      words(c,29,447,detail?'담당자 검토 기록':d.evidence,24,accent,600);return;
    }
    if(detail){
      let ds=d.result;
      if(id==='knowledge')ds=[['기본 처리','로컬 추론·검색'],['현재 선택',provided],['외부 연결',provided==='로컬 서버'?'사용 안 함':'선택 경로 예시']];
      ds.forEach(([a,b],i)=>{
        const y=196+i*62;rect(c,25,y,788,52,i===2?tile:bg);words(c,41,y+34,a,21,sub,600);words(c,791,y+34,b,24,fg,650,font,'right');
      });
      words(c,28,438,id==='knowledge'?'외부 API는 운영 정책에 따라 선택합니다.':phase===2?'확인한 근거와 후속 처리를 같은 기록에 남깁니다.':'담당자가 업무 기준을 확인합니다.',19,accent,600);
      return;
    }
    rect(c,25,187,790,42,tile);[40,389,684].forEach((x,i)=>words(c,x,216,d.head[i],17,sub,650));
    d.rows.forEach((row,i)=>{const y=234+i*53;if(phase>0&&i===1)rect(c,25,y,790,51,dark?'#354f4f':'#e6eee1');line(c,25,y+50,815,y+50,rule);
      [40,389,684].forEach((x,j)=>words(c,x,y+33,row[j],j===0?22:20,j===2?accent:fg,j===0?650:550));});
    words(c,27,432,d.evidence,21,accent,650);words(c,810,457,phase===2?'검토 기록 연결':'원문 근거',15,sub,550,font,'right');
  });
  return {material:panel.material,render(state){panel.render(state+(typeof matchMedia==='function'&&matchMedia('(max-width: 680px)').matches?100:0));}};
}
function printed(T,R,id,kind){
  const k=id+'/'+kind;if(R.mats.has('print/'+k))return R.mats.get('print/'+k);
  const d=workflow[id];
  const tex=drawCanvas(T,500,706,'Printed '+k,c=>{
    rect(c,0,0,500,706,kind==='receipt'?'#f2ede1':'#f1efe3');
    if(kind==='receipt'){
      words(c,250,75,'거래 영수증',32,'#303631',650,font,'center');words(c,250,119,'업무용 소모품',24,'#4d534d',500,font,'center');
      line(c,35,149,467,149,'#71756d');['거래 번호     041','사무 소모품   1건','공급가액    43,636','부가세       4,364'].forEach((v,i)=>words(c,35,210+i*70,v,27,'#41463f',550));
      line(c,32,474,467,474,'#73786c');words(c,36,544,'합계  48,000원',36,'#333c34',700);for(let i=0;i<83;i++)rect(c,34+i*5,599,i%3?2:3,51,'#424b40');return;
    }
    rect(c,32,37,6,47,'#60796a');words(c,51,57,'공장 운영지원    /    예시 자료',16,'#647266',650);
    words(c,35,122,kind==='result'?d.decision:d.document,32,'#33483e',700);words(c,35,159,d.ticket+'     •     개정 03',17,'#636f64',500,mono);
    line(c,34,186,466,186,'#697d6e',2);words(c,35,224,'검토 항목',19,'#495d50',700);
    const list=kind==='result'?d.result:d.rows;
    list.forEach((r,i)=>{const y=255+i*61;rect(c,35,y,430,44,i%2?'#eeede2':'#e1e6db');words(c,46,y+29,r[0],18,'#394b3f',600);words(c,453,y+29,r[1],18,'#47564b',500,font,'right');});
    words(c,35,491,'검토 메모',18,'#495a4d',650);for(let i=0;i<3;i++)line(c,35,525+i*32,465,525+i*32,'#b7c2b2');
    words(c,35,664,'운영지원    /    '+d.team,15,'#758172');words(c,463,664,'1 / 1',15,'#758172',500,mono,'right');
  },false);
  const mat=tex.material;mat.side=T.DoubleSide;mat.normalMap=R.m.paper.normalMap;mat.roughnessMap=R.m.paper.roughnessMap;mat.roughness=.96;mat.normalScale.set(.12,.12);
  R.mats.set('print/'+k,mat);return mat;
}
function paper(T,s,R,p,x,y,z,w,d,material,yaw=0,lift=.009){
  const k=['curled-sheet',w,d,lift].join('/');
  if(!R.geometry.has(k)){
    const g=new T.PlaneGeometry(w,d,10,14),pos=g.attributes.position;
    for(let i=0;i<pos.count;i++){
      const xx=pos.getX(i),xx0=xx/w+.5,v=pos.getY(i)/d+.5;
      const fold=Math.max(0,(xx0+.64*v-1.18)/.44),lip=Math.max(0,v-.76)/.24;
      const yy=lift*(fold*fold+.18*lip*lip)+.0018*Math.sin(xx0*Math.PI)*Math.sin(v*Math.PI);
      pos.setXYZ(i,xx,yy,-pos.getY(i));
    }g.computeVertexNormals();g.computeBoundingSphere();R.geometry.set(k,g);
  }
  const a=new T.Mesh(R.geometry.get(k),material);a.position.set(x,y,z);a.rotation.y=yaw;a.castShadow=a.receiveShadow=true;p.add(a);return a;
}
function packet(T,s,R,b,id,x,y,z,yaw=.08){
  const m=R.m,p=s.group(b,x,y,z,'Active document packet');p.rotation.y=yaw;
  s.box(p,0,.003,0,.248,.005,.329,m.binder,.002);
  for(let i=0;i<5;i++)paper(T,s,R,p,.0007*(i%3),.006+i*.0013,-.001*i,.213,.297,m.paper,(i-2)*.006,.003+i*.0008);
  paper(T,s,R,p,.003,.013,.002,.213,.297,printed(T,R,id,'source'),-.008,.012);
  const clip=s.group(p,-.063,.019,-.123);s.box(clip,0,0,0,.032,.012,.015,m.frame,.002);
  for(const xx of [-.010,.010])curvePath(s,clip,[[xx,.007,-.004],[xx,.022,-.009],[xx*.65,.030,-.008],[0,.028,-.008]],.0011,m.steel);
  return p;
}
function scanner(T,s,R,b,id,x,y,z){
  const m=R.m,p=s.group(b,x,y,z,'Duplex document scanner');p.rotation.y=.08;
  s.box(p,0,.045,0,.312,.081,.192,m.white,.021);
  const bay=s.box(p,0,.091,-.024,.294,.065,.109,m.body,.016);bay.rotation.x=-.21;
  s.box(p,0,.096,.042,.261,.012,.018,m.black,.004);
  const feeder=s.group(p,0,.086,-.067);feeder.rotation.x=-.48;
  s.box(feeder,0,.094,0,.248,.184,.012,m.cream,.004);
  for(const xx of [-.105,.105])s.box(feeder,xx,.056,.008,.011,.099,.025,m.frame,.003);
  s.box(p,0,.023,.111,.260,.010,.092,m.cream,.003);
  for(const xx of [-.083,0,.083])s.cyl(p,xx,.084,.052,.010,.035,m.black,'x',16);
  s.cyl(p,.126,.087,.059,.007,.004,m.ok,'y',14);
  const receipt=id==='finance';
  const source=paper(T,s,R,p,0,.115,-.050,receipt?.081:.177,receipt?.181:.224,printed(T,R,id,receipt?'receipt':'source'),0,.005);
  source.rotation.x=1.025;
  curvePath(s,p,[[.114,.037,-.093],[.152,.012,-.136],[.18,.005,-.152],[.202,.004,-.178]],.004,m.black);
  return v=>{const stage=ease(.20,.52,v);source.position.y=.16-stage*.056;source.position.z=-.074+stage*.031;};
}
function tablet(T,s,R,b,x,y,z,screen,yaw=0){
  const m=R.m,g=s.group(b,x,y,z,'Docked approval tablet');g.rotation.y=yaw;
  s.box(g,0,.01,0,.195,.016,.125,m.matte,.005);const support=s.box(g,0,.062,-.026,.131,.093,.011,m.bright,.004);support.rotation.x=.36;
  const screenFrame=s.group(g,0,.137,.009);screenFrame.rotation.x=-.28;
  s.box(screenFrame,0,0,0,.272,.188,.009,m.frame,.004);s.face(screenFrame,0,0,.0055,.253,.164,screen.material);
  s.cyl(screenFrame,0,.088,.006,.0022,.001,m.black,'z',10);
  return g;
}

function idCard(T,s,R,b,x,y,z){
  const m=R.m,p=s.group(b,x,y,z,'Employee pass and USB credential');p.rotation.y=-.16;
  s.box(p,0,.007,0,.115,.010,.083,m.frame,.003);s.box(p,0,.014,0,.089,.003,.055,m.pass,.001);
  const graf=drawCanvas(T,420,272,'Sample staff credential',c=>{
    rect(c,0,0,420,272,'#e8e9df');rect(c,0,0,420,48,'#526d63');words(c,18,33,'임시 출입증',22,'#f1f4e9',700);
    rect(c,21,74,75,99,'#c5d2c5');disk(c,57,108,15,'#7f9488');rect(c,38,138,39,29,'#7f9488');
    words(c,119,115,'신규 입사',29,'#42574c',650);words(c,120,155,'사내 업무 지원',18,'#667769');
    for(let i=0;i<37;i++)rect(c,23+i*4,210,i%4?1:3,26,'#58635b');
  },false);
  const face=s.face(p,0,.016,0,.085,.052,graf.material);face.rotation.x=-Math.PI/2;
  curvePath(s,p,[[.044,.018,-.022],[.077,.008,-.061],[.096,.006,-.077],[.110,.007,-.052],[.116,.007,-.026]],.00275,m.blue);
  s.box(p,.095,.009,.029,.046,.011,.016,m.black,.003);s.box(p,.122,.009,.029,.014,.006,.012,m.bright,.0008);
}
function caddy(T,s,R,b,x,y,z){
  const m=R.m,g=s.group(b,x,y,z,'Desktop stationery holder');
  s.cyl(g,0,.042,0,.032,.079,m.matte,'y',34);s.cyl(g,0,.083,0,.029,.003,m.black,'y',30);
  for(let i=0;i<5;i++){
    const a=i*1.09,xx=Math.sin(a)*.017,zz=Math.cos(a)*.015,rr=s.cyl(g,xx,.115,zz,.0034,.105+i%3*.014,[m.blue,m.white,m.tan,m.bright,m.green][i],'y',10);
    rr.rotation.z=(i-2)*.08;rr.rotation.x=Math.cos(a)*.12;
  }
}
function meter(T,s,R,p,x,y,z){
  const m=R.m,g=s.group(p,x,y,z,'Desktop financial calculator');g.rotation.y=.12;
  const stock=s.box(g,0,.013,0,.121,.022,.170,m.matte,.007);stock.rotation.x=-.075;
  s.box(g,0,.029,-.053,.097,.006,.036,m.darkGlass,.002);
  const read=drawCanvas(T,270,68,'Calculator LCD',c=>{rect(c,0,0,270,68,'#a1ac8e');words(c,256,51,'266.67',42,'#384238',550,mono,'right');},false);
  const active=s.face(g,0,.032,-.052,.089,.024,read.material);active.rotation.x=-Math.PI*.5;
  for(let i=0;i<20;i++){const xx=-.041+i%4*.027,zz=-.018+Math.floor(i/4)*.019;s.box(g,xx,.026,zz,.019,.008,.012,i===19?m.orange:m.cream,.0027);}
}
function labelPrinter(T,s,R,p,x,y,z){
  const m=R.m,g=s.group(p,x,y,z,'Thermal purchase-order printer');g.rotation.y=-.08;
  s.box(g,0,.056,0,.185,.105,.206,m.white,.023);
  s.box(g,0,.105,-.020,.176,.047,.157,m.frame,.017);
  s.box(g,0,.076,.093,.150,.015,.010,m.black,.004);s.box(g,0,.069,.107,.151,.005,.029,m.steel,.001);
  s.cyl(g,.061,.098,.061,.006,.003,m.ok,'y',12);
  const strip=paper(T,s,R,g,0,.075,.107,.084,.097,printed(T,R,'purchase','result'),0,.005);strip.userData.dynamic=true;
  return p=>{const t=ease(.65,.88,p);strip.visible=t>.01;strip.position.z=.079+t*.063;};
}
function smallBox(T,s,R,p,x,y,z){
  const m=R.m,g=s.group(p,x,y,z,'Opened supplier sample carton');g.rotation.y=.10;
  s.box(g,0,.007,0,.208,.012,.151,m.kraft,.003);
  for(const a of [-1,1]){
    s.box(g,a*.102,.061,0,.006,.117,.149,m.kraft,.0017);
    s.box(g,0,.062,a*.073,.204,.118,.006,m.kraft,.0015);
    const flap=s.box(g,0,.135,a*.101,.200,.006,.082,m.kraft,.0014);flap.rotation.x=-a*.48;
  }
  for(const xx of [-.046,.027]){s.cyl(g,xx,.065,0,.023,.083,m.bright,'y',20);s.cyl(g,xx,.111,0,.028,.014,m.steel,'y',8);}
}
function caliper(T,s,R,p,x,y,z){
  const m=R.m,g=s.group(p,x,y,z,'Machinist digital caliper');g.rotation.y=.21;
  s.box(g,0,.008,0,.205,.008,.015,m.bright,.0009);
  for(let i=0;i<26;i++)s.box(g,-.087+i*.006,.012,.003,.0006,.0008,i%5?.0035:.006,m.black);
  for(const xx of [-.080,-.019]){s.box(g,xx,.008,.019,.011,.009,.039,m.steel,.002);const jaw=s.box(g,xx+.003,.008,.040,.005,.009,.025,m.bright,.001);jaw.rotation.y=.10;}
  s.box(g,-.016,.015,0,.051,.012,.027,m.frame,.003);s.box(g,-.016,.023,-.002,.031,.002,.014,m.darkGlass);
}
function testFixture(T,s,R,b,x,y,z){
  const m=R.m,g=s.group(b,x,y,z,'Optical validation fixture');
  s.box(g,0,.026,.005,.356,.048,.275,m.steel,.008);
  for(let i=0;i<7;i++)s.box(g,-.142+i*.047,.050,.005,.006,.003,.230,m.frame,.001);
  s.box(g,-.111,.182,-.087,.027,.277,.032,m.bright,.003);s.box(g,-.111,.315,-.058,.047,.038,.096,m.frame,.005);
  s.box(g,-.035,.315,-.012,.157,.030,.029,m.bright,.003);
  s.box(g,.031,.293,0,.070,.072,.062,m.body,.008);s.cyl(g,.031,.232,0,.026,.068,m.frame,'y',28);
  s.cyl(g,.031,.198,0,.027,.011,m.steel,'y',28);s.cyl(g,.031,.189,0,.014,.005,m.darkGlass,'y',28);
  const shape=new T.Shape();shape.absarc(0,0,.051,0,tau,false);
  for(const [cx,cy,r] of [[0,0,.016],[-.028,0,.005],[.028,0,.005],[0,.031,.005],[0,-.031,.005]]){const path=new T.Path();path.absarc(cx,cy,r,0,tau,true);shape.holes.push(path);}
  if(!R.geometry.has('machined specimen')){const geo=new T.ExtrudeGeometry(shape,{depth:.009,bevelEnabled:true,bevelThickness:.001,bevelSize:.001,bevelSegments:2,curveSegments:24});geo.rotateX(-Math.PI/2);R.geometry.set('machined specimen',geo);}
  const a=new T.Mesh(R.geometry.get('machined specimen'),m.bright);g.add(a);a.position.set(.032,.062,.007);a.receiveShadow=a.castShadow=true;
  for(const i of [-1,1])s.box(g,.031+i*.069,.065,.006,.026,.019,.068,m.frame,.004);
  curvePath(s,g,[[.034,.336,-.008],[-.010,.392,-.063],[-.102,.346,-.115],[-.160,.205,-.145],[-.182,.041,-.155],[-.235,.009,-.16]],.006,m.black);
}
function localNode(T,s,R,b,x,y,z){
  const m=R.m,g=s.group(b,x,y,z,'On-premises retrieval and inference appliance');
  s.box(g,0,.093,-.016,.365,.173,.285,m.matte,.011);
  s.box(g,0,.088,.130,.348,.159,.018,m.frame,.004);
  for(let i=0;i<4;i++){
    const xx=-.138+i*.063;s.box(g,xx,.086,.141,.054,.108,.011,m.black,.002);
    for(let j=0;j<4;j++)s.box(g,xx,.056+j*.019,.149,.042,.009,.006,m.matte,.001);
    s.box(g,xx+.019,.123,.151,.006,.004,.002,m.ok);
  }
  for(let i=0;i<12;i++)s.box(g,.124,.042+i*.007,.145,.057,.003,.004,m.black);
  s.cyl(g,.132,.132,.146,.011,.004,m.bright,'z',18);s.cyl(g,.132,.132,.150,.005,.002,m.ok,'z',14);
  for(const a of [-1,1])for(const zz of [-.104,.089])s.cyl(g,a*.14,.009,zz,.010,.011,m.black);
  curvePath(s,g,[[.1,.055,-.138],[.125,.035,-.173],[.156,.014,-.201],[.201,.012,-.186]],.005,m.blue);
}
const providers=['local','gpt','claude','gemini'];
function patchBay(T,s,R,b,x,y,z){
  const m=R.m,g=s.group(b,x,y,z,'Optional service connection profiles');g.rotation.y=-.07;
  s.box(g,0,.095,0,.372,.176,.185,m.matte,.009);s.box(g,0,.092,.095,.356,.155,.012,m.frame,.004);
  const lcd=drawCanvas(T,700,145,'Model connection profile', (c,n)=>{
    rect(c,0,0,700,145,'#243532');words(c,18,43,'연결 프로필  /  예시',28,'#c0d7c8',650);
    words(c,18,107,n?'선택한 외부 API':'로컬 처리',35,n?'#d2bd92':'#a2d3bb',700);
    words(c,684,105,n?['','GPT','Claude','Gemini'][n]:'기본값',31,'#d0e0d1',650,font,'right');
  });
  s.face(g,0,.137,.103,.315,.056,lcd.material);
  const labels=drawCanvas(T,700,69,'Optional patch socket legends',c=>{
    rect(c,0,0,700,69,'#384448');['LOCAL','GPT','Claude','Gemini'].forEach((a,i)=>words(c,90+i*173,48,a,28,'#dbe2dc',600,mono,'center'));
  },false);s.face(g,0,.082,.103,.315,.027,labels.material);
  const lights=[];
  for(let j=0;j<4;j++){
    const xx=(j-1.5)*.080;s.box(g,xx,.050,.106,.048,.026,.009,m.bright,.002);s.box(g,xx,.051,.113,.038,.020,.006,m.black,.001);
    for(let i=0;i<6;i++)s.box(g,xx-.012+i*.0047,.045,.118,.0014,.007,.001,m.orange);
    const led=s.box(g,xx,.026,.106,.011,.003,.002,j?m.black:m.ok);led.userData.dynamic=true;lights.push(led);
  }
  const left=-.120;s.box(g,left,.050,.130,.029,.016,.031,m.blue,.003);
  curvePath(s,g,[[left,.049,.144],[left,.038,.177],[-.151,.013,.190],[-.231,.008,.163],[-.271,.008,.075],[-.294,.007,-.008]],.004,m.blue);
  return n=>{lcd.render(n);lights.forEach((o,i)=>{o.material=i===n?(i?m.amber:m.ok):m.black;});};
}

function archiveBook(T,s,R,b,x,y,z){
  const m=R.m,g=s.group(b,x,y,z,'Opened working standard');g.rotation.y=-.22;
  s.box(g,0,.009,0,.362,.016,.245,m.blue,.006);
  for(const sign of [-1,1]){
    const leaf=s.group(g,sign*.084,.020,0);leaf.rotation.z=sign*-.10;
    for(let j=0;j<3;j++)paper(T,s,R,leaf,0,j*.0018,0,.162,.224,j===2?printed(T,R,'knowledge','source'):m.paper,0,.006+j*.001);
  }
}
function headset(T,s,R,p,x,y,z){
  const m=R.m,h=s.group(p,x,y,z,'Call headset on dock');h.rotation.y=.28;
  s.box(h,0,.007,0,.082,.013,.087,m.frame,.004);s.cyl(h,0,.085,0,.008,.155,m.bright);
  curvePath(s,h,[[-.060,.090,.006],[-.066,.154,-.007],[-.046,.198,-.014],[0,.219,-.016],[.044,.199,-.014],[.065,.156,-.007],[.059,.089,.006]],.0078,m.matte);
  for(const f of [-1,1])orb(T,s,h,f*.057,.106,.007,.014,.027,.024,m.black,16);
  curvePath(s,h,[[-.061,.100,.011],[-.082,.077,.046],[-.066,.063,.088],[-.032,.066,.096]],.0028,m.frame);
}
function secureTray(T,s,R,b,id,x,y,z,screen){
  tablet(T,s,R,b,x,y,z,screen,-.23);
  const o=paper(T,s,R,b,x+.058,y+.006,z+.152,.124,.091,printed(T,R,id,'result'),-.118,.003);
  o.userData.dynamic=true;return p=>{o.visible=p>=.71;};
}
function layout(T,s,R,root,id,wait){
  const m=R.m,base=bench(T,s,R,root,id),moves=[],main=ui(T,id),decision=id==='knowledge'?null:ui(T,id,true);
  divider(T,s,R,root,id);
  const tall=id==='knowledge'||id==='hr';
  const cabinetX=id==='roi'||id==='finance'?-1.08:1.12;
  const cab=cabinet(T,s,R,root,cabinetX,-.739,.900,tall?1.08:.73,true);
  if(id==='hr'||id==='knowledge'||id==='sales')plant(T,s,R,cab,.19,tall?1.105:.753,-.01,id==='knowledge'?.28:.35,-.15,wait);
  else if(id==='finance')accountsShelves(T,s,R,cab);
  else{for(let i=0;i<5;i++)binder(T,s,R,cab,-.246+i*.07,.759,-.014,.064,.266+(i%3)*.011,.194,[m.blue,m.tan,m.binder][i%3],i);}
  let anchors,choose;
  if(id==='hr'){
    ergonomic(T,s,R,root,-1.03,.556,2.25,'coordinator',wait,m.petrol);
    monitor(T,s,R,base,.045,.759,-.212,.700,.04,main);
    peripherals(T,s,R,base,.085,.144);packet(T,s,R,base,id,-.656,.759,.175,.10);
    idCard(T,s,R,base,-.426,.760,.240);
    glassMat(s,R,base,.845,.078,.434,.319);
    moves.push(secureTray(T,s,R,base,id,.855,.766,.032,decision));
    trays(T,s,R,base,-.887,.760,-.143);pen(T,s,R,base,-.547,.780,.295,-.16);
    deskLamp(T,s,R,base,.896,.758,-.282,-1);caddy(T,s,R,base,.634,.759,-.148);
    mug(T,s,R,base,.473,.759,-.021);
    anchors=[[-.62,.79,.135],[.045,1.14,-.263],[.855,.925,.005]];
  }else if(id==='finance'){
    ergonomic(T,s,R,root,-1.286,-.272,1.47,'analyst',wait,m.fabric);
    monitor(T,s,R,base,-.045,.759,-.224,.721,.018,main);peripherals(T,s,R,base,.003,.146);
    glassMat(s,R,base,-.838,.03,.470,.317);
    moves.push(scanner(T,s,R,base,id,-.84,.766,.013));
    paper(T,s,R,base,-.66,.768,.262,.079,.145,printed(T,R,id,'receipt'),.26,.023);
    packet(T,s,R,base,id,-.705,.760,-.155,-.22);
    monitor(T,s,R,base,.673,.759,-.170,.537,-.23,decision);
    meter(T,s,R,base,.535,.759,.213);pen(T,s,R,base,-.490,.766,.182,-.48);
    deskLamp(T,s,R,base,-1.006,.758,-.263,1);caddy(T,s,R,base,.316,.760,-.240);
    mug(T,s,R,base,.988,.759,-.194);
    anchors=[[-.827,.907,-.050],[-.045,1.14,-.275],[.673,1.083,-.219]];
  }else if(id==='knowledge'){
    ergonomic(T,s,R,root,-1.14,.554,2.09,'analyst',wait,m.petrol);
    monitor(T,s,R,base,-.066,.759,-.222,.708,.035,main);peripherals(T,s,R,base,.005,.152);
    moves.push(scanner(T,s,R,base,id,-.864,.760,-.047));packet(T,s,R,base,id,-.710,.759,.210,-.155);
    localNode(T,s,R,base,.638,.758,-.200);choose=patchBay(T,s,R,base,.876,.759,.091);
    archiveBook(T,s,R,base,.462,.761,.200);
    for(let i=0;i<4;i++)binder(T,s,R,cab,-.313+i*.071,1.105,.007,.060,.224,.170,[m.binder,m.blue][i%2],i);
    s.box(base,.638,.932,-.200,.315,.008,.208,m.frame,.003);
    const localStatus=drawCanvas(T,630,102,'Local retrieval node',c=>{
      rect(c,0,0,630,102,'#34403e');words(c,18,41,'LOCAL LLM   /   INDEX',26,'#c8dbc8',650,mono);
      words(c,19,77,'사내 추론 · 문서 색인',21,'#b7cbbb',600);
    });s.face(base,.638,.865,-.046,.171,.033,localStatus.material);
    anchors=[[-.84,.900,-.046],[-.064,1.141,-.272],[.867,.883,.119]];
  }else if(id==='purchase'){
    ergonomic(T,s,R,root,1.16,.536,-2.19,'coordinator',wait,m.petrol);
    monitor(T,s,R,base,-.024,.759,-.230,.681,.026,main);peripherals(T,s,R,base,.012,.153);
    smallBox(T,s,R,base,-.962,.761,-.120);packet(T,s,R,base,id,-.723,.762,.162,-.15);
    paper(T,s,R,base,-.50,.769,.140,.157,.214,printed(T,R,id,'source'),.161,.013);
    tablet(T,s,R,base,.744,.758,-.137,decision,-.15);
    moves.push(labelPrinter(T,s,R,base,.937,.760,.145));caliper(T,s,R,base,-.404,.759,-.014);
    caddy(T,s,R,base,.444,.759,-.20);trays(T,s,R,base,-.677,.759,-.187);
    anchors=[[-.797,.832,.111],[-.025,1.13,-.271],[.912,.880,.058]];
  }else if(id==='sales'){
    ergonomic(T,s,R,root,-1.213,.403,2.03,'director',wait,m.fabric);
    ergonomic(T,s,R,root,1.291,.465,-2.1,null,wait,m.creamFabric);
    monitor(T,s,R,base,.040,.759,-.218,.637,.04,main);peripherals(T,s,R,base,.018,.16);
    packet(T,s,R,base,id,-.677,.759,.178,.145);headset(T,s,R,base,-.759,.760,-.138);
    laptop(T,s,R,base,.760,.759,-.036,-.22,decision,.405);
    s.cyl(base,-.455,.779,-.084,.059,.028,m.frame,'y',40);s.cyl(base,-.455,.795,-.084,.050,.006,m.matte,'y',40);
    for(let i=0;i<9;i++)s.box(base,-.486+i*.0077,.800,-.084,.002,.0015,.050,m.black);
    mug(T,s,R,base,.948,.760,.197);pen(T,s,R,base,-.498,.767,.270,-.43);
    anchors=[[-.697,.800,.128],[.040,1.130,-.265],[.747,.92,-.195]];
  }else if(id==='roi'){
    ergonomic(T,s,R,root,-1.13,.525,2.10,'director',wait,m.creamFabric);
    monitor(T,s,R,base,.003,.759,-.229,.801,.012,main);peripherals(T,s,R,base,.019,.167);
    packet(T,s,R,base,id,-.698,.759,.097,.075);meter(T,s,R,base,-.498,.759,.162);
    tablet(T,s,R,base,.788,.759,-.018,decision,-.22);
    trays(T,s,R,base,-.869,.759,-.160);deskLamp(T,s,R,base,.994,.759,-.236,-1);
    pen(T,s,R,base,-.471,.766,.272,-.17);mug(T,s,R,base,.483,.759,-.069);
    anchors=[[-.676,.794,.06],[.003,1.18,-.297],[.787,.921,-.059]];
  }else{
    ergonomic(T,s,R,root,1.16,.528,-2.19,'analyst',wait,m.fabric);
    monitor(T,s,R,base,.039,.759,-.211,.682,.014,main);peripherals(T,s,R,base,.058,.174);
    testFixture(T,s,R,base,-.772,.758,-.106);caliper(T,s,R,base,-.703,.759,.159);
    paper(T,s,R,base,-.438,.765,.186,.170,.225,printed(T,R,id,'source'),.12,.006);
    tablet(T,s,R,base,.811,.760,-.008,decision,-.20);smallBox(T,s,R,base,.982,.760,.216);
    caddy(T,s,R,base,-.522,.760,-.279);deskLamp(T,s,R,base,.919,.759,-.270,-1);
    anchors=[[-.743,.922,-.140],[.039,1.134,-.26],[.812,.924,-.050]];
  }
  let active=0,current=0;
  function update(p){current=clamp(Number.isFinite(p)?p:0);const phase=current<.31?0:current<.69?1:2;
    main.render(phase);decision?.render(phase+active*4);for(const fn of moves)fn(current);if(choose)choose(active);}
  function setProvider(value){const n=providers.indexOf(String(value||'local').toLowerCase());active=n<0?0:n;update(current);}
  update(0);return {anchors:anchors.map(a=>new T.Vector3(...a)),update,...(choose?{setProvider}:{})};
}
export function buildWorkspace(T,id){
  if(!Object.hasOwn(workflow,id))throw new RangeError('Unknown workspace '+id);
  if(!caches.has(T))caches.set(T,workshop(T));
  const s=caches.get(T),R=resources(T,s),group=new T.Group(),wait=[R.materialsReady];group.name='Workspace / '+workflow[id].team;group.userData.department=id;
  const result=layout(T,s,R,group,id,wait);
  return {group,...result,ready:Promise.all(wait)};
}
