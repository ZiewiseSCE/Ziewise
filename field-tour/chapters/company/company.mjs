// Local metres, looking in from +Z. All photographs and models come from existing site assets.
const caches = new WeakMap();
const PI = Math.PI;
const TAU = PI * 2;
const ink = '#223837', pale = '#eeeee5';
const ease = (p,a,b) => { const x=Math.max(0,Math.min(1,(p-a)/(b-a))); return x*x*(3-2*x); };
const site = name => new URL('../../../assets/'+name,import.meta.url).href;
const tour = name => new URL('../../'+name,import.meta.url).href;

function repository(T) {
  if (caches.has(T)) return caches.get(T);
  const materials = new Map(), geometries = new Map(), maps = new Map(), models = new Map();
  const dom = typeof document !== 'undefined';
  function material(key, values) {
    if (!materials.has(key)) {
      const m=new T.MeshStandardMaterial(values);m.name='Company '+key;materials.set(key,m);
    }
    return materials.get(key);
  }
  function geom(key, build) {
    if(!geometries.has(key))geometries.set(key,build());
    return geometries.get(key);
  }
  function bitmap(url, color=true, tile=0) {
    const key=url+'|'+tile;
    if (maps.has(key))return maps.get(key);
    if (!dom)return {texture:null,ready:Promise.resolve(false)};
    const info={texture:null};
    info.ready=new Promise(resolve=>{
      const m=new T.TextureLoader().load(url,()=>resolve(true),undefined,()=>resolve(false));
      m.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;m.anisotropy=8;
      if(tile){m.wrapS=m.wrapT=T.RepeatWrapping;m.repeat.set(tile,tile);}
      info.texture=m;
    });
    maps.set(key,info);return info;
  }
  function vectorArt(key,w,h,draw,illuminated=false) {
    if(materials.has(key))return materials.get(key);
    let tex=null;
    if(dom){
      const c=document.createElement('canvas');c.width=w;c.height=h;
      draw(c.getContext('2d'),w,h);tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;
    }
    const m=illuminated?new T.MeshBasicMaterial({map:tex,color:tex?0xffffff:0x293c3b,toneMapped:false}):
      new T.MeshStandardMaterial({map:tex,color:tex?0xffffff:0xe1dfcb,roughness:.73});
    m.name=key;materials.set(key,m);return m;
  }
  function model(path) {
    if(!dom)return Promise.resolve(null);
    if(!models.has(path)){
      models.set(path,import(tour('vendor/loaders/GLTFLoader.js')).then(({GLTFLoader})=>new GLTFLoader().loadAsync(tour(path)))
        .then(doc=>{const root=doc.scene;root.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});return root;}).catch(()=>null));
    }
    return models.get(path);
  }
  const r={T,material,geom,bitmap,vectorArt,model};caches.set(T,r);return r;
}

function text(c,msg,x,y,size,color=ink,bold=600) {
  c.fillStyle=color;c.font=String(bold)+' '+size+'px "Malgun Gothic","Noto Sans KR",Arial,sans-serif';c.fillText(msg,x,y);
}
function line(c,x1,y1,x2,y2,color,width=2) {
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
}
function station(T,id) {
  const r=repository(T), group=new T.Group();group.name='Ziewise company '+id;
  const waits=[],changes=[];
  function map(url, color=true,tile=0){const result=r.bitmap(url,color,tile);waits.push(result.ready);return result.texture;}
  const woodMap=map(tour('office-materials/maps/oak-color.webp'));
  const woodNormal=map(tour('office-materials/maps/oak-normal.webp'),false);
  const woodRough=map(tour('office-materials/maps/oak-rough.webp'),false);
  const metalRough=map(tour('office-materials/maps/metal-rough.webp'),false);
  const steelNormal=map(tour('office-materials/maps/metal-normal.webp'),false);
  const M={
    oak:r.material('natural oak',{color:0xf6d6b2,map:woodMap,normalMap:woodNormal,roughnessMap:woodRough,normalScale:new T.Vector2(.31,.31),roughness:.98}),
    darkWood:r.material('fumed oak',{color:0xac907a,map:woodMap,roughnessMap:woodRough,roughness:.9}),
    silver:r.material('machined metal',{color:0xc2c9c8,metalness:.77,roughness:.82,roughnessMap:metalRough,normalMap:steelNormal,normalScale:new T.Vector2(.16,.16)}),
    zinc:r.material('brushed zinc',{color:0x8d9c9d,metalness:.65,roughness:.92,roughnessMap:metalRough}),
    shell:r.material('powder coated graphite',{color:0x323a3c,metalness:.27,roughness:.40}),
    black:r.material('black ABS',{color:0x24292b,roughness:.44,metalness:.045}),
    dark:r.material('black rack aperture',{color:0x101619,roughness:.74}),
    paper:r.material('document stock',{color:0xf2efe4,roughness:.86}),
    warm:r.material('warm wall finish',{color:0xd8d8cd,roughness:.85}),
    teal:r.material('desaturated cabinet',{color:0x415953,roughness:.52,metalness:.12}),
    rubber:r.material('moulded rubber',{color:0x282c2c,roughness:.84}),
    brass:r.material('satin bronze',{color:0xb49a70,metalness:.65,roughness:.35}),
    glass:r.material('neutral laminated glass',{color:0xb5cbcd,metalness:.10,roughness:.21,transparent:true,opacity:.085,depthWrite:false}),
    lens:r.material('coated optical glass',{color:0x1a363b,metalness:.63,roughness:.085}),
    cable:r.material('petrol patch lead',{color:0x526e72,roughness:.56}),
    ivory:r.material('cream patch lead',{color:0xbdb69b,roughness:.57}),
    orange:r.material('amber fibre',{color:0x9d7952,roughness:.54}),
    led:r.material('powered status LED',{color:0xbadbb1,emissive:0x7bb691,emissiveIntensity:.43,roughness:.25}),
    neutralLight:r.material('frosted diffuser',{color:0xeaf0e9,emissive:0xe4ece3,emissiveIntensity:.9,roughness:.53}),
  };
  function add(p,g,m,x,y,z){
    const a=new T.Mesh(g,m);a.position.set(x,y,z);a.castShadow=!m.transparent;a.receiveShadow=!m.transparent;p.add(a);return a;
  }
  function frame(p,x=0,y=0,z=0){const a=new T.Group();a.position.set(x,y,z);p.add(a);return a;}
  function box(p,x,y,z,w,h,d,m){
    const a=add(p,r.geom('cube',()=>new T.BoxGeometry(1,1,1)),m,x,y,z);a.scale.set(w,h,d);return a;
  }
  function rnd(p,x,y,z,w,h,d,rad,m){
    const key=['soft',w,h,d,rad].join('/');
    const g=r.geom(key,()=>{
      const b=Math.min(.009,d*.19,rad*.24),hx=w/2-b,hy=h/2-b,rr=Math.min(rad,hx,hy);
      const s=new T.Shape();s.moveTo(-hx+rr,-hy);s.lineTo(hx-rr,-hy);s.quadraticCurveTo(hx,-hy,hx,-hy+rr);
      s.lineTo(hx,hy-rr);s.quadraticCurveTo(hx,hy,hx-rr,hy);s.lineTo(-hx+rr,hy);s.quadraticCurveTo(-hx,hy,-hx,hy-rr);
      s.lineTo(-hx,-hy+rr);s.quadraticCurveTo(-hx,-hy,-hx+rr,-hy);
      const geo=new T.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:3,steps:1});
      geo.translate(0,0,-(d-2*b)/2);
      const pos=geo.attributes.position,uv=geo.attributes.uv;
      for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)/w+.5,pos.getY(i)/h+.5);
      return geo;
    });
    return add(p,g,m,x,y,z);
  }
  function slab(p,x,y,z,w,h,d,rad,m){const a=rnd(p,x,y,z,w,d,h,rad,m);a.rotation.x=-PI/2;return a;}
  function cyl(p,x,y,z,ra,rb,h,m,axis='y',segments=20) {
    const a=add(p,r.geom(['c',ra,rb,h,segments].join('/'),()=>new T.CylinderGeometry(ra,rb,h,segments)),m,x,y,z);
    if(axis==='z')a.rotation.x=PI/2;else if(axis==='x')a.rotation.z=PI/2;return a;
  }
  function wire(p,points,rad,m,pathSegments=20){
    const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)),false,'centripetal');
    return add(p,new T.TubeGeometry(curve,pathSegments,rad,7,false),m,0,0,0);
  }
  function face(p,x,y,z,w,h,m){
    const a=add(p,r.geom('face',()=>new T.PlaneGeometry(1,1)),m,x,y,z);a.scale.set(w,h,1);a.castShadow=false;return a;
  }
  function horizontal(p,x,y,z,w,d,m){const a=face(p,x,y,z,w,d,m);a.rotation.x=-PI/2;return a;}
  function art(key,w,h,draw,lit=false){return r.vectorArt(key,w,h,draw,lit);}
  function photo(key,url,lit=false,transparent=false) {
    const image=map(url);
    if(lit){const m=new T.MeshBasicMaterial({map:image,color:image?0xffffff:0xd6d7cd,transparent,alphaTest:transparent?.015:0,toneMapped:false,depthWrite:!transparent});
      m.name=key;return m;}
    return r.material(key,{map:image,color:image?0xffffff:0x6f7674,roughness:.54,metalness:.11});
  }
  function animate(node,fn){node.traverse(o=>o.userData.dynamic=true);changes.push(fn);}
  function later(node,instead,at){const first=node.material;animate(node,p=>{node.material=p<at?first:instead;});}
  function prop(key,position,height,yaw,substitute) {
    const h=frame(group,...position);h.userData.dynamic=true;
    if(substitute)substitute.userData.dynamic=true;
    waits.push(r.model(key).then(original=>{
      if(!original)return false;
      const actual=original.clone(true),b=new T.Box3().setFromObject(actual),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());
      const ratio=height/size.y;actual.scale.multiplyScalar(ratio);actual.position.set(-center.x*ratio,-b.min.y*ratio,-center.z*ratio);
      h.rotation.y=yaw;h.add(actual);if(substitute)substitute.visible=false;h.updateWorldMatrix(true,true);return true;
    }));
  }
  function finish(anchors){
    const update=p=>{p=Number.isFinite(p)?Math.max(0,Math.min(1,p)):0;for(const f of changes)f(p);};
    update(0);return {group,anchors:anchors.map(v=>new T.Vector3(...v)),update,ready:Promise.all(waits)};
  }
  return {T,r,M,g:group,map,add,frame,box,rnd,slab,cyl,wire,face,horizontal,art,photo,animate,later,prop,finish};
}

function wall(s,mode){
  const {g,M,box,rnd,slab}=s;
  const laboratory=mode==='research', gallery=mode==='credentials', server=mode==='infrastructure';
  const floor=s.r.material('floor '+mode,{color:server?0x808b8a:gallery?0xb0aca0:0x97a29e,roughness:gallery?.57:.75,metalness:server?.16:.04});
  box(g,0,-.034,-1.18,5.6,.068,4.19,floor);
  for(const x of [-2.4,-1.6,-.8,0,.8,1.6,2.4])box(g,x,.002,-1.18,.003,.002,4.17,server?M.shell:floor);
  if(server)for(let j=0;j<5;j++)box(g,0,.002,.6-j*.8,5.55,.002,.003,M.shell);
  box(g,0,1.51,-2.98,5.55,3.02,.12,gallery?M.oak:laboratory?M.warm:M.shell);
  for(const x of [-2.69,2.69])box(g,x,1.48,-2.52,.11,2.96,.98,gallery?M.darkWood:laboratory?M.warm:M.shell);
  box(g,0,.10,-2.907,5.45,.19,.041,gallery?M.darkWood:M.zinc);
  if(!server){
    for(const x of [-2.32,-1.14,0,1.14,2.32])box(g,x,1.56,-2.913,.009,2.80,.006,laboratory?M.zinc:M.darkWood);
    rnd(g,0,2.81,-2.47,3.53,.062,.10,.018,gallery?M.brass:M.shell);
    box(g,0,2.776,-2.452,3.31,.011,.045,M.neutralLight);
  }
  if(laboratory){
    for(const x of [-1.75,-.83,.12,1.08,1.98]){
      box(g,x,.47,-2.45,.83,.84,.64,M.teal);box(g,x,.76,-2.119,.233,.017,.018,M.silver);
    }
    slab(g,.04,.932,-2.43,4.66,.056,.76,.033,M.warm);
    for(const x of [-1.99,2.01])box(g,x,1.59,-2.72,.048,1.20,.10,M.zinc);
    box(g,0,1.89,-2.56,4.10,.042,.38,M.zinc);
    for(let i=0;i<7;i++){
      const x=-1.58+i*.53;
      box(g,x,2.02,-2.56,.355,.205,.287,i%3===1?M.warm:M.teal);
      box(g,x,2.035,-2.410,.153,.046,.009,M.paper);
    }
  }
}

function bench(s,x,z,w,d,top) {
  const {g,M,slab,box,cyl}=s;
  slab(g,x,.916,z,w,.068,d,.055,top);
  box(g,x,.853,z-d*.33,w-.11,.068,.047,M.shell);
  for(const xx of [x-w/2+.095,x+w/2-.095])for(const zz of [z-d/2+.092,z+d/2-.092]){
    box(g,xx,.458,zz,.059,.826,.059,M.zinc);cyl(g,xx,.026,zz,.047,.052,.045,M.rubber);
  }
}

function monitor(s,x,y,z,w,h,screen,yaw=0){
  const {g,M,slab,box,rnd,frame,face}=s;
  const root=frame(g,x,y,z);root.rotation.y=yaw;
  slab(root,0,.019,.025,w*.41,.038,.262,.043,M.shell);
  box(root,0,.162,-.024,.088,.281,.079,M.zinc);
  const head=frame(root,0,.155+h/2,0);head.rotation.x=-.077;
  rnd(head,0,0,0,w,h,.050,.027,M.black);
  const display=face(head,0,0,.026,w*.956,h*.900,screen);
  s.cyl(head,w*.413,-h*.461,.027,.005,.005,.003,M.led,'z',12);
  return display;
}

function infrastructure(s){
  wall(s,'infrastructure');
  const {T,g,M,frame,box,rnd,slab,cyl,face,art,photo,wire,animate,later}=s;
  // A genuine infrastructure photograph is recessed behind a glazed service opening.
  const window=s.frame(g,.24,1.51,-2.87);
  box(window,0,0,-.03,3.74,1.94,.106,M.black);
  const history=photo('Original infrastructure aisle',site('company-infrastructure.webp'));
  face(window,0,0,.027,3.54,1.79,history);
  for(const x of [-1.83,1.83])box(window,x,0,.064,.048,1.90,.038,M.zinc);
  for(const y of [-.923,.923])box(window,0,y,.064,3.65,.045,.038,M.zinc);
  for(const x of [-2.16,2.16]){
    box(g,x,2.59,-1.72,.14,.075,2.36,M.zinc);
    for(let k=0;k<7;k++)box(g,x,2.649,-2.80+k*.34,.178,.032,.035,M.black);
  }
  box(g,-.46,2.737,-1.61,2.53,.054,.09,M.shell);
  box(g,-.46,2.708,-1.61,2.32,.009,.046,M.neutralLight);
  const host=frame(g,-1.12,0,-.21);
  const front=photo('Owned rack front',site('rack-front-photo-v1.webp'));
  const side=photo('Owned rack side',site('rack-side-photo-v1.webp'));
  rnd(host,0,1.16,-.088,.89,2.21,.89,.032,M.shell);
  const lateral=face(host,.447,1.16,-.096,.85,2.13,side);lateral.rotation.y=PI/2;
  const left=face(host,-.447,1.16,-.096,.85,2.13,side);left.rotation.y=-PI/2;
  for(const x of [-.387,.387])for(const z of [-.417,.308])cyl(host,x,.036,z,.062,.064,.071,M.rubber);
  for(const x of [-.405,.405]){
    box(host,x,1.16,.364,.030,2.16,.046,M.zinc);
    for(let j=0;j<14;j++)box(host,x, .184+j*.147,.393,.006,.017,.004,M.dark);
  }
  // Each textured shelf has its own depth and original photographic UV slice.
  const bounds=[0,.104,.207,.312,.415,.521,.626,.731,.836,.930,1];
  for(let i=0;i<bounds.length-1;i++){
    const lo=bounds[i],hi=bounds[i+1],h=(hi-lo)*2.08;
    const cy=.116+(lo+hi)*1.04,z=.385+(i%3)*.0038;
    box(host,0,cy,.358,.786,h-.003,.043,M.dark);
    const geo=s.r.geom('server bay segment '+i,()=>{
      const q=new T.PlaneGeometry(.782,h-.002),uv=q.attributes.uv;
      for(let j=0;j<uv.count;j++)uv.setY(j,lo+uv.getY(j)*(hi-lo));return q;
    });
    s.add(host,geo,front,0,cy,z);
    for(const x of [-.363,.363]){
      box(host,x,cy,.395,.016,h*.56,.023,M.shell);
      if(i%2===0)cyl(host,x,cy+h*.351,.397,.005,.005,.007,M.silver,'z',10);
    }
  }
  // The service door opens a small amount while the visitor examines the host shelves.
  const door=frame(host,-.426,0,.417);
  for(const x of [0,.852])box(door,x,1.16,0,.024,2.18,.020,M.black);
  for(const y of [.074,2.243])box(door,.426,y,0,.864,.024,.023,M.black);
  box(door,.426,1.16,-.008,.817,2.132,.008,M.glass);
  box(door,.824,1.14,.020,.018,.161,.034,M.zinc);
  animate(door,p=>{door.rotation.y=-.21*ease(p,.035,.32);});
  // Cross-connect cabinet, exposed crimped connectors and managed slack loops.
  const patch=frame(g,-.013,0,-.33);
  box(patch,0,.073,-.033,.81,.119,.68,M.black);
  box(patch,0,1.101,-.258,.765,2.02,.225,M.shell);
  for(const x of [-.364,.364])box(patch,x,1.08,.042,.047,1.97,.42,M.zinc);
  box(patch,0,2.052,.015,.81,.082,.53,M.shell);
  const back=photo('Owned rack rear',site('rack-rear-photo-v1.webp'));
  face(patch,0,1.158,-.137,.713,1.76,back);
  const portMat=art('Etched cross-connect face',512,82,(c,w,h)=>{
    c.fillStyle='#556363';c.fillRect(0,0,w,h);
    text(c,'PATCH',13,27,15,'#e7e7d9',700);
    for(let i=0;i<10;i++){const x=18+i*49;c.fillStyle='#202e2f';c.fillRect(x,33,37,22);text(c,String(i+1).padStart(2,'0'),x+9,72,11,'#ecede4');}
  });
  for(let row=0;row<3;row++){
    const yy=1.67-row*.184;
    rnd(patch,0,yy,.209,.692,.115,.082,.013,M.shell);
    face(patch,0,yy,.252,.660,.103,portMat);
    for(const sx of [-.319,.319])cyl(patch,sx,yy+.030,.253,.006,.006,.004,M.silver,'z',10);
  }
  for(let i=0;i<8;i++){
    const a=-.267+i*.074, b=-.265+((i+3)%8)*.073, down=1.22-(i%3)*.082;
    const mat=i<4?M.cable:i<7?M.ivory:M.orange;
    wire(patch,[[a,1.65,.253],[a,1.65,.326],[a-.004,down,.363],[b,down-.044,.35],[b,1.282,.289],[b,1.3,.254]],.0078,mat,22);
    for(const [xx,yy] of [[a,1.65],[b,1.3]])box(patch,xx,yy,.278,.035,.027,.053,mat);
  }
  const port=cyl(patch,.286,1.698,.257,.011,.011,.005,M.rubber,'z',16);later(port,M.led,.45);
  for(const x of [-.326,.326])box(patch,x,.64,.104,.042,.87,.036,M.black);
  for(let y=.30;y<1.0;y+=.12)box(patch,0,y,.105,.623,.030,.027,M.shell);
  // Workstation belongs to the operator. Its last state is a review record.
  bench(s,1.16,-.25,1.40,.78,M.darkWood);
  function panel(checked){
    return art('Infrastructure console '+checked,700,395,(c,w,h)=>{
      c.fillStyle='#202d30';c.fillRect(0,0,w,h);text(c,'인프라 운영',28,59,39,'#edeee5',700);
      text(c,'운영 화면 예시',504,51,19,'#bad0c6');line(c,28,79,w-28,79,'#647471');
      text(c,'호스트 · 가상 PC',29,121,25,'#dfe8dc');
      const traces=[['#8abca8',[.3,.33,.31,.42,.38,.44,.48,.45,.47,.52,.56,.51,.53,.60,.57]],['#a9b4c3',[.18,.22,.2,.21,.26,.25,.32,.29,.31,.33,.31,.31,.34,.35,.37]]];
      for(let j=0;j<3;j++)line(c,30,157+j*36,670,157+j*36,'#354744',1);
      for(const [color,values] of traces){
        c.strokeStyle=color;c.lineWidth=3;c.beginPath();
        values.forEach((v,i)=>i?c.lineTo(32+i*45.3,252-v*134):c.moveTo(32,252-v*134));c.stroke();
      }
      line(c,29,269,671,269,'#5e706b');
      text(c,checked?'점검 기록':'네트워크 상태',30,321,30,'#e6eadd',700);
      text(c,checked?'담당자가 연결 상태를 확인했습니다.':'호스트와 세션 연결을 확인합니다.',30,358,20,'#b7c9c0',500);
    },true);
  }
  const display=monitor(s,1.13,.952,-.22,1.02,.595,panel(false),-.11);
  later(display,panel(true),.71);
  const key=art('black service keyboard',450,158,(c,w,h)=>{
    c.fillStyle='#3b4141';c.fillRect(0,0,w,h);
    for(let y=0;y<5;y++)for(let x=0;x<16;x++){c.fillStyle='#262d2e';c.fillRect(8+x*27+(y%2)*2,8+y*27,22,21);if(x%3===0){c.fillStyle='#a7ae9f';c.fillRect(12+x*27,14+y*27,4,2);}}
  });
  slab(g,1.08,.966,.011,.525,.026,.203,.021,M.black);s.horizontal(g,1.08,.981,.011,.493,.176,key);
  return s.finish([[-1.12,1.39,.235],[-.013,1.48,.017],[1.13,1.39,-.154]]);
}

function research(s) {
  wall(s,'research'); const {T,g,M,frame,box,rnd,slab,cyl,wire,face,art,later}=s;
  bench(s,0,.00,3.75,1.03,M.oak);
  // Anti-static specimen mat and a sample carrier with actual bores.
  const surface=art('ESD bench grid',600,306,(c,w,h)=>{
    c.fillStyle='#4d6a62';c.fillRect(0,0,w,h);
    for(let x=10;x<w;x+=21)line(c,x,9,x,h-9,'#698277',1);
    for(let y=9;y<h;y+=21)line(c,10,y,w-10,y,'#698277',1);
  });
  slab(g,-.97,.966,.09,1.22,.026,.72,.055,M.teal);s.horizontal(g,-.97,.980,.09,1.176,.682,surface);
  const carrier=frame(g,-1.11,.99,.13);carrier.rotation.y=.14;
  slab(carrier,0,.027,0,.689,.054,.449,.033,M.shell);
  slab(carrier,0,.057,0,.621,.019,.389,.030,M.rubber);
  const flangeGeo=s.r.geom('lab through-bored specimen',()=>{
    const shape=new T.Shape();shape.absarc(0,0,.151,0,TAU,false);
    const cut=(x,y,r)=>{const h=new T.Path();h.absarc(x,y,r,0,TAU,true);shape.holes.push(h);};cut(0,0,.064);
    for(let j=0;j<6;j++){const a=j*PI/3;cut(.113*Math.cos(a),.113*Math.sin(a),.014);}
    const gg=new T.ExtrudeGeometry(shape,{depth:.029,curveSegments:12,steps:1,bevelEnabled:true,bevelSize:.0019,bevelThickness:.0017,bevelSegments:2});
    gg.rotateX(-PI/2);return gg;
  });
  s.add(carrier,flangeGeo,M.silver,-.077,.070,-.012);
  for(const rr of [.078,.136]){
    const ring=s.add(carrier,s.r.geom('research turning mark '+rr,()=>new T.TorusGeometry(rr,.00150,5,50)),M.zinc,-.077,.101,-.012);ring.rotation.x=-PI/2;
  }
  wire(carrier,[[-.027,.101,.042],[-.010,.101,.055],[.003,.101,.077]],.0017,M.shell,9);
  const sampleTag=art('Research specimen tag',340,180,(c,w,h)=>{
    c.fillStyle='#e3dfce';c.fillRect(0,0,w,h);text(c,'표면 시편',22,65,39);text(c,'샘플 식별 · 관찰 기록',23,126,23,'#54685d');
  });
  slab(carrier,.194,.077,.072,.185,.012,.109,.006,M.paper);s.horizontal(carrier,.194,.085,.072,.177,.100,sampleTag);
  // 150 mm vernier caliper in a half-open position.
  const cal=frame(g,-.78,.998,.34);cal.rotation.y=-.17;
  box(cal,0,.009,0,.42,.014,.026,M.silver);
  for(const x of [-.149,-.063]){
    box(cal,x,.009,-.035,.025,.018,.079,M.zinc);
    const jaw=box(cal,x+.008,.009,-.072,.014,.015,.053,M.silver);jaw.rotation.y=-.13;
  }
  box(cal,-.055,.018,0,.068,.020,.047,M.zinc);
  for(let i=0;i<15;i++)box(cal,-.149+i*.022,.0195,.006,.0016,.001,.010+(i%5===0?.005:0),M.shell);
  const lensBase=frame(g,-.016,.953,-.048);
  // Low-cost optical stand is visible while the measured CC0 microscope loads.
  slab(lensBase,0,.03,0,.43,.060,.33,.045,M.shell);
  cyl(lensBase,.105,.260,-.08,.026,.028,.430,M.silver);
  box(lensBase,.02,.435,-.067,.23,.057,.085,M.shell);
  const objective=frame(lensBase,-.055,.41,-.02);objective.rotation.x=-.17;
  cyl(objective,0,-.051,0,.052,.046,.145,M.shell);cyl(objective,0,-.133,0,.040,.037,.036,M.zinc);
  cyl(objective,0,-.154,0,.030,.031,.012,M.lens);
  s.prop('equipment/industrial_microscope.glb',[-.022,.953,-.062],.717,-.58,lensBase);
  const lamp=frame(g,.327,.954,-.259);
  cyl(lamp,0,.020,0,.095,.10,.039,M.shell);
  wire(lamp,[[0,.038,0],[.01,.20,0],[.04,.36,.02],[-.01,.435,.07],[-.15,.445,.12]],.012,M.zinc,20);
  const cap=frame(lamp,-.15,.416,.12);cap.rotation.z=-.42;
  cyl(cap,0,0,0,.045,.067,.078,M.shell);cyl(cap,0,-.040,0,.060,.06,.010,M.neutralLight);
  s.prop('equipment/metal_tool_chest.glb',[-1.54,.961,-2.45],.40,.13);
  // The record combines the specimen view with test fields rather than decorative data.
  function record(done){
    return art('Research test record '+done,650,386,(c,w,h)=>{
      c.fillStyle='#dfe4db';c.fillRect(0,0,w,h);text(c,'시험 기록',24,58,39);text(c,'표면 검사 / 예시',427,51,20,'#53685e');
      line(c,24,76,w-24,76,'#789083');
      c.fillStyle='#3d4948';c.fillRect(25,106,251,218);
      const radial=c.createRadialGradient(159,198,12,153,202,100);radial.addColorStop(0,'#596766');radial.addColorStop(.36,'#bfcbc5');radial.addColorStop(.74,'#85928b');radial.addColorStop(.94,'#c0c7ba');radial.addColorStop(1,'#53615b');
      c.fillStyle=radial;c.beginPath();c.arc(148,210,91,0,TAU);c.fill();
      c.strokeStyle='rgba(38,49,42,.36)';c.lineWidth=1;
      for(let rad=48;rad<90;rad+=4){c.beginPath();c.arc(148,210,rad,0,TAU);c.stroke();}
      c.fillStyle='#384541';c.beginPath();c.arc(148,210,38,0,TAU);c.fill();
      for(let i=0;i<6;i++){const a=TAU*i/6;c.beginPath();c.arc(148+68*Math.cos(a),210+68*Math.sin(a),9,0,TAU);c.fill();}
      line(c,183,171,199,151,'#e8e8d5',2);if(done){c.strokeStyle='#e1bf67';c.strokeRect(176,143,34,38);}
      for(const [i,v] of ['시편 식별','조명 조건','재검 의견'].entries()){
        text(c,v,302,141+i*67,24,ink,650);line(c,300,157+i*67,618,157+i*67,'#b3bfb2',1);
        text(c,['플랜지 A','사광 조명',done?'원본과 대조':'검토 중'][i],468,141+i*67,23,'#50675b',500);
      }
      text(c,done?'담당자 확인 · 검토 기록 저장':'시편 관찰 · 원본 보관',26,360,22,'#4c6559');
    },true);
  }
  const disp=monitor(s,1.15,.954,-.18,1.02,.64,record(false),-.125);
  later(disp,record(true),.67);
  const note=art('Laboratory paper notebook',390,268,(c,w,h)=>{
    c.fillStyle='#f0ecdb';c.fillRect(0,0,w,h);text(c,'시험 일지',26,60,37);text(c,'시편  /  조건  /  관찰 결과',26,111,23);
    for(let i=0;i<3;i++)line(c,24,144+i*33,w-24,144+i*33,'#a7b2a2',1);
  });
  const journal=frame(g,1.14,.956,.23);journal.rotation.y=-.085;
  slab(journal,0,.010,0,.54,.02,.33,.02,M.darkWood);
  slab(journal,0,.026,0,.504,.016,.30,.012,M.paper);s.horizontal(journal,0,.035,0,.491,.282,note);
  const pencil=box(journal,.177,.041,.022,.010,.010,.216,M.brass);pencil.rotation.y=.12;
  return s.finish([[-1.13,1.084,.17],[-.022,1.40,-.024],[1.15,1.43,-.13]]);
}

function credentials(s) {
  wall(s,'credentials');
  const {g,M,frame,box,rnd,slab,cyl,face,art,photo,animate}=s;
  // Oak archive joinery behind the reading rail, at a different depth from the three originals.
  for(const x of [-1.92,-.96,0,.96,1.92]){
    box(g,x,.436,-2.56,.952,.78,.64,M.darkWood);
    box(g,x,.43,-2.228,.889,.657,.024,M.oak);
    box(g,x,.691,-2.203,.205,.018,.019,M.brass);
  }
  slab(g,0,.860,-2.53,4.91,.065,.742,.026,M.oak);
  for(const side of [-1,1]){
    const bay=frame(g,side*1.61,0,-2.88);
    for(let i=0;i<4;i++)box(bay,-.41+i*.267,1.78,.026,.044,1.50,.049,M.darkWood);
  }
  const caps=[
    {id:'iso', title:'정보보호 관리체계', sub:'ISO/IEC 27001:2022', file:'iso-certificate.webp', ratio:534/699},
    {id:'venture',title:'벤처기업확인서',sub:'혁신성장유형',file:'venture-certificate.webp',ratio:768/1024},
    {id:'rnd',title:'연구개발전담부서',sub:'한국산업기술진흥협회 인정',file:'rnd-certificate.webp',ratio:773/1024},
  ];
  function specimen(holder,row,width) {
    const h=width/row.ratio;
    rnd(holder,0,0,-.027,width+.10,h+.10,.072,.028,M.darkWood);
    rnd(holder,0,0,.013,width+.066,h+.062,.024,.018,M.brass);
    rnd(holder,0,0,.031,width+.047,h+.045,.023,.013,M.paper);
    const image=photo('Original '+row.id+' certificate',site(row.file),true,true);
    const original=face(holder,0,0,.045,width,h,image);
    original.name=row.file;original.renderOrder=2;
    for(const x of [-1,1])for(const y of [-1,1]){
      const px=x*(width/2+.031),py=y*(h/2+.032);
      cyl(holder,px,py,.034,.009,.009,.012,M.zinc,'z',14);
    }
    const plate=art('Credential plaque '+row.id,610,146,(c,w,hh)=>{
      c.fillStyle='#dedfcd';c.fillRect(0,0,w,hh);line(c,0,1,w,1,'#b0a185',3);
      text(c,row.title,20,65,41,ink,700);
      text(c,row.sub,22,116,26,'#52645c',500);
    });
    rnd(holder,0,-h/2-.141,-.012,width*.87,.166,.035,.018,M.brass);
    face(holder,0,-h/2-.141,.006,width*.84,.147,plate);
    return h;
  }
  // ISO is a library wall frame, the venture document rests on an inclined folio stand,
  // and the R&D document is shown in a glazed end display with a narrow frame light.
  const iso=frame(g,-1.14,0,-.30);iso.rotation.y=.11;
  for(const x of [-.394,.394]){
    box(iso,x,1.10,-.145,.052,2.18,.071,M.darkWood);
    slab(iso,x,.029,-.103,.161,.057,.332,.025,M.zinc);
  }
  box(iso,0,1.49,-.115,.865,1.25,.056,M.warm);
  const ip=frame(iso,0,1.575,0);specimen(ip,caps[0],.829);
  box(iso,0,2.260,-.025,.899,.027,.066,M.brass);
  box(iso,0,2.242,-.004,.725,.008,.036,M.neutralLight);
  const middle=frame(g,0,0,.074);
  slab(middle,0,.041,-.123,.76,.082,.65,.065,M.darkWood);
  box(middle,0,.544,-.172,.161,1.025,.143,M.brass);
  const mid=frame(middle,0,1.430,0);mid.rotation.x=-.29;specimen(mid,caps[1],.779);
  // Oxidised brass lip and a retractable reading bar below the document.
  box(mid,0,-.550,.067,.837,.031,.051,M.brass);
  const bar=frame(middle,0,1.952,-.13);
  for(const x of [-.35,.35])wireShort(s,bar,[x,0,-.019],[x,.096,.011],M.brass);
  rnd(bar,0,.099,.027,.791,.030,.059,.014,M.brass);box(bar,0,.082,.034,.694,.007,.032,M.neutralLight);
  animate(bar,p=>{bar.rotation.x=-.18*ease(p,.32,.51)+.08*ease(p,.69,.86);});
  const end=frame(g,1.15,0,-.291);end.rotation.y=-.125;
  for(const x of [-.413,.413]){
    box(end,x,1.147,-.084,.045,2.233,.060,M.zinc);
    slab(end,x,.028,-.038,.16,.056,.354,.028,M.darkWood);
  }
  box(end,0,1.58,-.111,.925,1.28,.066,M.teal);
  const ep=frame(end,0,1.584,0);specimen(ep,caps[2],.831);
  for(const x of [-.456,.456])box(end,x,1.59,.027,.018,1.218,.12,M.brass);
  spaceGlass(s,end,-.452,1.59,-.022,.088,1.18);
  spaceGlass(s,end,.452,1.59,-.022,.088,1.18);
  box(end,0,2.239,.013,.934,.040,.15,M.darkWood);
  box(end,0,2.218,.049,.758,.006,.052,M.neutralLight);
  return s.finish([[-1.134,1.575,-.252],[0,1.430,.121],[1.144,1.584,-.241]]);
}
function wireShort(s,parent,a,b,material) { return s.wire(parent,[a,b],.010,material,3); }
function spaceGlass(s,parent,x,y,z,w,h) {
  const panel=s.face(parent,x,y,z,w,h,s.M.glass);panel.rotation.y=PI/2;panel.renderOrder=3;
}

const rooms={infrastructure,research,credentials};
export function buildCompany(T,id) {
  const build=rooms[id];
  if(typeof build!=='function')throw new RangeError('Unknown company vignette: '+id);
  return build(station(T,id));
}
