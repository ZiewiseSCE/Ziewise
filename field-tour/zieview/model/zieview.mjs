import {trademark} from './mark.mjs';

// Metre-scale geometry. Local +Z is the face carrying the molded equipment mark.
const cached = new WeakMap();
const PI = Math.PI;
const TAU = 2 * PI;

function workshop(T) {
  if (cached.has(T)) return cached.get(T);
  const materials = {};
  const geometry = new Map();
  const standard = (name, color, metalness, roughness, extra={}) =>
    new T.MeshStandardMaterial({name,color,metalness,roughness,...extra});
  const physical = (name, color, metalness, roughness, extra={}) =>
    new T.MeshPhysicalMaterial({name,color,metalness,roughness,...extra});
  Object.assign(materials,{
    case:physical('Zieview molded green enclosure',0x35673d,.015,.71,{clearcoat:.12,clearcoatRoughness:.48}),
    lid:physical('Zieview green lid',0x3c7343,.015,.69,{clearcoat:.15,clearcoatRoughness:.46}),
    relief:physical('Same-resin embossed identity',0x326039,.015,.62,{clearcoat:.13,clearcoatRoughness:.44}),
    seal:standard('EPDM weather seal',0x252a29,.01,.83),
    wire:physical('Flexible black control cable',0x202323,.016,.42,{clearcoat:.18,clearcoatRoughness:.37}),
    rubber:standard('Molded non-slip rubber',0x232726,.015,.82),
    black:standard('Black phosphate hardware',0x343a39,.61,.44),
    cast:physical('Die-cast black hardware',0x2d302e,.38,.43,{clearcoat:.18,clearcoatRoughness:.45}),
    metal:standard('Brushed stainless fasteners',0xa8b0ad,.76,.32),
    bright:standard('Formed polished steel',0xc1c6c2,.87,.23),
    zinc:standard('Galvanized mounting steel',0x919d9a,.63,.54),
    white:physical('Satin outdoor camera enclosure',0xdfded7,.02,.45,{clearcoat:.28,clearcoatRoughness:.32}),
    offwhite:physical('Cast optical bracket',0xcecfc9,.14,.46,{clearcoat:.24,clearcoatRoughness:.36}),
    darkcap:physical('Graphite pan and tilt hood',0x202422,.11,.39,{clearcoat:.42,clearcoatRoughness:.24}),
    bezel:standard('Black anodized lens baffle',0x202826,.54,.36),
    barrel:standard('Internal low-reflection lens barrel',0x0f1719,.20,.60),
    optics:physical('Coated imaging glass',0x17252a,.58,.11,{clearcoat:.91,clearcoatRoughness:.07,iridescence:.47,iridescenceIOR:1.31}),
    glass:physical('Smoked protective optical window',0x1f292a,.075,.13,{clearcoat:.80,clearcoatRoughness:.10,transparent:true,opacity:.39,depthWrite:false}),
    infrared:physical('Unlit infrared optic',0x372c2e,.20,.20,{clearcoat:.70,clearcoatRoughness:.12}),
    red:physical('Burgundy indicator optic',0x591f23,.09,.22,{clearcoat:1,clearcoatRoughness:.14}),
    yellow:physical('Tripod industrial yellow enamel',0xc78d18,.37,.38,{clearcoat:.42,clearcoatRoughness:.29}),
    gold:standard('Zinc-passivated folding braces',0xa98940,.69,.43),
    post:standard('Painted structural steel',0x455e61,.34,.66),
    mill:standard('Structural steel cut edge',0x6a7571,.60,.55)
  });
  const pending=[];
  if(typeof document!=='undefined'){
    const loader=new T.TextureLoader();
    for(const [stem,keys,amplitude] of [['green-coating',['case','lid'],.095],['column-steel',['post'],.095]]){
      const load=(suffix,kind)=>loader.loadAsync(new URL('./'+stem+'-'+suffix+'.webp',import.meta.url).href).then(texture=>{
        texture.name=stem+' '+kind;texture.colorSpace=T.NoColorSpace;
        texture.wrapS=texture.wrapT=T.RepeatWrapping;
        texture.repeat.set(stem==='green-coating'?3:4,stem==='green-coating'?3:10);
        texture.anisotropy=4;
        for(const k of keys){
          materials[k][kind]=texture;
          if(kind==='normalMap')materials[k].normalScale.set(amplitude,amplitude);
          materials[k].needsUpdate=true;
        }
      });
      pending.push(load('normal','normalMap'),load('rough','roughnessMap'));
    }
  }
  const ready=Promise.all(pending);
  const vec=a=>new T.Vector3(...a);
  function geom(key,fn){if(!geometry.has(key))geometry.set(key,fn());return geometry.get(key);}
  function group(parent,name,x=0,y=0,z=0){
    const g=new T.Group();g.name=name;g.position.set(x,y,z);if(parent)parent.add(g);return g;
  }
  function mesh(parent,g,material,x=0,y=0,z=0){
    const m=new T.Mesh(g,typeof material==='string'?materials[material]:material);
    m.position.set(x,y,z);m.castShadow=!m.material.transparent;m.receiveShadow=true;parent.add(m);return m;
  }
  function rounded(w,h,d,r){
    return geom(['round',w,h,d,r].join('/'),()=>{
      r=Math.max(.00001,Math.min(r,w*.495,h*.495,d*.495));
      const min=Math.min(w,h,d),steps=min<.0032?3:min<.03?5:7;
      const g=new T.BoxGeometry(1,1,1,steps,steps,steps);
      const pos=g.attributes.position,norm=g.attributes.normal;
      const dims=[w,h,d],c=new T.Vector3(),off=new T.Vector3();
      const strips=dims.map(size=>{
        const e=size*.5;
        if(steps===3)return [-e,-e+r,e-r,e];
        if(steps===5)return [-e,-e+r*.50,-e+r,e-r,e-r*.50,e];
        return [-e,-e+r*.38,-e+r*.72,-e+r,e-r,e-r*.72,e-r*.38,e];
      });
      for(let i=0;i<pos.count;i++){
        const v=[pos.getX(i),pos.getY(i),pos.getZ(i)].map((p,j)=>strips[j][Math.round((p+.5)*steps)]);
        c.set(...v.map((p,j)=>T.MathUtils.clamp(p,-dims[j]*.5+r,dims[j]*.5-r)));
        off.set(...v).sub(c).normalize();c.addScaledVector(off,r);
        pos.setXYZ(i,c.x,c.y,c.z);norm.setXYZ(i,off.x,off.y,off.z);
      }
      return g;
    });
  }
  function box(parent,x,y,z,w,h,d,r,material){return mesh(parent,rounded(w,h,d,r),material,x,y,z);}
  function cyl(parent,pos,r,length,material,axis=[0,1,0],segments=24,r2=r){
    const g=geom(['c',r,r2,length,segments].join('/'),()=>new T.CylinderGeometry(r2,r,length,segments));
    const m=mesh(parent,g,material,...pos);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),vec(axis).normalize());return m;
  }
  function rod(parent,a,b,r,material,r2=r,sides=18){
    const A=vec(a),B=vec(b),direction=B.clone().sub(A);
    return cyl(parent,A.lerp(B,.5).toArray(),r,direction.length(),material,direction.normalize().toArray(),sides,r2);
  }
  function bar(parent,a,b,w,d,material,bevel=.001){
    const A=vec(a),B=vec(b),dir=B.clone().sub(A),center=A.clone().lerp(B,.5);
    const b0=box(parent,...center.toArray(),w,dir.length(),d,bevel,material);
    b0.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());return b0;
  }
  function cable(parent,points,r,material,samples=30,sides=7){
    const curve=new T.CatmullRomCurve3(points.map(vec),false,'centripetal');
    return mesh(parent,new T.TubeGeometry(curve,samples,r,sides,false),material);
  }
  function torus(parent,pos,r,wall,material,normal=[0,0,1],segments=48){
    const g=geom(['tor',r,wall,segments].join('/'),()=>new T.TorusGeometry(r,wall,8,segments));
    const m=mesh(parent,g,material,...pos);m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),vec(normal).normalize());return m;
  }
  function lathe(parent,x,y,z,points,material,segs=64){
    const g=geom('lathe/'+segs+'/'+points.flat().join(','),()=>new T.LatheGeometry(points.map(([r,h])=>new T.Vector2(r,h)),segs));
    return mesh(parent,g,material,x,y,z);
  }
  function shape(points){
    const s=new T.Shape();s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();return s;
  }
  function extrude(parent,s,depth,material,bevel=0,segments=2){
    const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:segments,curveSegments:14});
    g.translate(0,0,-depth*.5);return mesh(parent,g,material);
  }
  function roundedOutline(w,h,r){
    const x=w*.5,y=h*.5,s=new T.Shape();
    s.moveTo(-x+r,-y);s.lineTo(x-r,-y);s.quadraticCurveTo(x,-y,x,-y+r);
    s.lineTo(x,y-r);s.quadraticCurveTo(x,y,x-r,y);s.lineTo(-x+r,y);
    s.quadraticCurveTo(-x,y,-x,y-r);s.lineTo(-x,-y+r);s.quadraticCurveTo(-x,-y,-x+r,-y);return s;
  }
  function hole(s,x,y,r){const p=new T.Path();p.absarc(x,y,r,0,TAU,true);s.holes.push(p);}
  function plate(parent,x,y,z,w,h,depth,r,holes,material){
    const s=roundedOutline(w,h,r);for(const a of holes)hole(s,...a);
    const m=extrude(parent,s,depth,material,.00045,2);m.position.set(x,y,z);return m;
  }
  function screw(parent,point,normal,r=.0028,material='bright'){
    const key='drive/'+r;
    const g=geom(key,()=>{
      const s=new T.Shape();s.absarc(0,0,r,0,TAU,false);
      const socket=new T.Path();
      for(let i=0;i<36;i++){
        const ang=-TAU*i/36,rad=r*(.38+.105*Math.cos(ang*6));
        const x=Math.cos(ang)*rad,y=Math.sin(ang)*rad;
        if(i)socket.lineTo(x,y);else socket.moveTo(x,y);
      }
      socket.closePath();s.holes.push(socket);
      return new T.ExtrudeGeometry(s,{depth:r*.24,bevelEnabled:true,bevelSize:r*.10,bevelThickness:r*.09,bevelSegments:2,curveSegments:11});
    });
    const m=mesh(parent,g,material,...point);m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),vec(normal).normalize());
    const n=vec(normal).normalize();const base=vec(point).addScaledVector(n,-r*.18);
    cyl(parent,base.toArray(),r*.91,r*.22,'black',normal,20);return m;
  }
  function roundedLoft(parent,levels,material){
    const segments=8,pts=[],norms=[],uv=[],idx=[];
    for(let l=0;l<levels.length;l++){
      const [y,w,d,r]=levels[l];let k=0;
      const corners=[[1,1,0],[-1,1,PI*.5],[-1,-1,PI],[1,-1,PI*1.5]];
      for(const [sx,sz,a0] of corners){
        for(let i=0;i<=segments;i++){
          const a=a0+(i/segments)*(PI/2),x=sx*(w/2-r)+r*Math.cos(a),z=sz*(d/2-r)+r*Math.sin(a);
          pts.push(x,y,z);uv.push(k/(4*(segments+1)),l/(levels.length-1));k++;
        }
      }
    }
    const n=4*(segments+1);
    for(let row=0;row<levels.length-1;row++)for(let col=0;col<n;col++){
      const a=row*n+col,b=row*n+(col+1)%n,c=a+n,d=b+n;idx.push(a,c,b,b,c,d);
    }
    for(let i=1;i<n-1;i++){
      idx.push(0,i,i+1);const j=(levels.length-1)*n;idx.push(j,j+i+1,j+i);
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
    g.setIndex(idx);g.computeVertexNormals();return mesh(parent,g,material);
  }
  function axialShell(parent,levels,material,segments=64){
    const pos=[],uv=[],index=[];
    for(let i=0;i<levels.length;i++){
      const [z,rx,ry,dy=0]=levels[i];
      for(let j=0;j<=segments;j++){const a=TAU*j/segments;pos.push(rx*Math.cos(a),dy+ry*Math.sin(a),z);uv.push(j/segments,i/(levels.length-1));}
    }
    const n=segments+1;
    for(let i=0;i<levels.length-1;i++)for(let j=0;j<segments;j++){const a=i*n+j;index.push(a,a+1,a+n,a+1,a+n+1,a+n);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();
    // Join the two UV seam normals, preserving a continuous cast optical hood.
    const normals=g.attributes.normal,one=new T.Vector3(),two=new T.Vector3();
    for(let i=0;i<levels.length;i++){const a=i*n,b=a+segments;
      one.fromBufferAttribute(normals,a).add(two.fromBufferAttribute(normals,b)).normalize();normals.setXYZ(a,one.x,one.y,one.z);normals.setXYZ(b,one.x,one.y,one.z);}
    return mesh(parent,g,material);
  }
  const kit={T,materials,ready,vec,group,mesh,geom,box,cyl,rod,bar,cable,torus,lathe,shape,extrude,roundedOutline,hole,plate,screw,roundedLoft,axialShell};
  cached.set(T,kit);return kit;
}

function equipmentMark(k,parent){
  const {T,shape,extrude,group,box}=k;
  const mark=group(parent,'Molded manufacturer identity',.021,.099,.0706);
  const scale=.052/222;
  const paths=trademark.map(points=>shape(points.map(([x,y])=>[(x-164)*scale,(122-y)*scale])));
  const raised=extrude(mark,paths,.00075,'relief',.00018,2);raised.position.z=.0004;
  // The camera case carries upper-case relief lettering under the original mark.
  const strokes={
    Z:[[[0,1],[.68,1],[0,0],[.68,0]]],
    I:[[[.24,1],[.24,0]]],
    E:[[[.65,1],[0,1],[0,0],[.65,0]],[[0,.51],[.54,.51]]],
    W:[[[0,1],[.21,0],[.50,.61],[.78,0],[1,1]]],
    S:[[[.65,1],[.15,1],[0,.85],[0,.65],[.16,.51],[.51,.50],[.66,.35],[.66,.14],[.52,0],[.02,0]]]
  };
  const advances={Z:.68,I:.48,E:.65,W:1,S:.66},word='ZIEWISE',tracking=.22,height=.0108;
  const total=[...word].reduce((v,c)=>v+advances[c]+tracking,0)-tracking;
  let start=-total*.5;
  for(const c of word){
    for(const line of strokes[c]){
      for(let i=1;i<line.length;i++){
        const a=line[i-1],b=line[i],diameter=.00135;
        const ax=(start+a[0])*height,ay=-.040+a[1]*height,bx=(start+b[0])*height,by=-.040+b[1]*height;
        const l=Math.hypot(bx-ax,by-ay),s=box(mark,(ax+bx)*.5,(ay+by)*.5,.00062,l+.00042,diameter,.00096,.00028,'relief');
        s.rotation.z=Math.atan2(by-ay,bx-ax);
      }
    }
    start+=advances[c]+tracking;
  }
}

function latch(k,parent,x,z,rotation){
  const {group,plate,box,cyl,cable,screw}=k;
  const q=group(parent,'Stamped over-centre latch',x,.170,z);q.rotation.y=rotation;
  plate(q,0,-.008,.0008,.016,.030,.0015,.0036,[],'metal');
  box(q,0,-.009,.0024,.012,.023,.0026,.0018,'black');
  const lever=box(q,0,-.009,.0056,.0132,.028,.004,.0023,'bright');lever.rotation.x=-.10;
  box(q,0,-.006,.008,.0086,.016,.0009,.00045,'metal').rotation.x=-.10;
  cyl(q,[0,.003,.007],.0022,.0205,'metal',[1,0,0],20);
  plate(q,0,.021,.0008,.0156,.011,.002,.0025,[],'bright');
  box(q,0,.018,.0041,.012,.0033,.006,.001,'bright');
  cable(q,[[-.0066,.001,.0068],[-.0076,.008,.008],[-.0071,.019,.006],[-.0046,.021,.0044],[.0046,.021,.0044],[.0071,.019,.006],[.0076,.008,.008],[.0066,.001,.0068]],.00115,'bright',30);
  for(const sx of [-.0048,.0048])screw(q,[sx,.023,.0020],[0,0,1],.00125,'metal');
}

function gland(k,parent,x,z){
  const {cyl,torus}=k;
  cyl(parent,[x,.019,z],.013,.005,'seal',[0,1,0],28);
  cyl(parent,[x,.014,z],.0132,.009,'black',[0,1,0],6);
  cyl(parent,[x,.006,z],.010,.012,'rubber',[0,1,0],28);
  for(const y of [.008,.004,0])torus(parent,[x,y,z],.0093,.0013,'wire',[0,1,0],24);
}

function camera(k,parent){
  const {group,box,cyl,rod,torus,lathe,shape,extrude,plate,screw,axialShell}=k;
  const pad=group(parent,'Cast bracket and wall gasket',-.104,.085,.013);
  pad.rotation.y=-PI*.5;
  plate(pad,0,0,.001,.087,.107,.003,.009,[],'seal');
  plate(pad,0,0,.009,.084,.104,.012,.008,[],'offwhite');
  for(const x of [-.031,.031])for(const y of [-.039,.039]){
    torus(pad,[x,y,.0151],.0046,.00065,'metal',[0,0,1],20);screw(pad,[x,y,.0152],[0,0,1],.0038);
  }
  const profile=shape([[-.114,.024],[-.138,.028],[-.162,.054],[-.188,.061],[-.203,.072],[-.200,.090],[-.180,.099],[-.149,.090],[-.113,.084]]);
  const arm=extrude(parent,profile,.046,'offwhite',.0032,4);arm.position.z=.014;
  for(const z of [-.010,.038]){
    const brace=extrude(parent,shape([[-.116,.034],[-.123,.037],[-.164,.076],[-.178,.082],[-.141,.075],[-.116,.056]]),.0033,'white',.0011,2);brace.position.z=z;
  }
  const x=-.182,z=.017;
  lathe(parent,x,0,z,[[.003,.035],[.018,.035],[.020,.037],[.020,.039],[.0205,.040],[.0205,.069],[.021,.071],[.021,.076],[.001,.077]],'red',48);
  lathe(parent,x,0,z,[[.001,.034],[.019,.034],[.022,.036],[.022,.039],[.020,.040]],'offwhite',48);
  for(let i=0;i<7;i++)torus(parent,[x,.042+i*.0036,z],.0200,.00043,'red',[0,1,0],40);
  lathe(parent,x,0,z,[[.001,.070],[.024,.070],[.028,.074],[.0285,.081],[.025,.083],[.025,.102],[.026,.111],[.030,.118],[.040,.124],[.055,.139],[.058,.146],[.061,.155],[.066,.178],[.071,.210],[.074,.234],[.0744,.247],[.0737,.253],[.070,.257],[.063,.257]],'white',80);
  lathe(parent,x,0,z,[[.052,.255],[.067,.255],[.0682,.256],[.0675,.2585],[.063,.259],[.052,.259]],'seal',64);
  lathe(parent,x,0,z,[[.001,.256],[.062,.256],[.063,.259],[.061,.264],[.056,.266],[.001,.266]],'darkcap',64);
  torus(parent,[x,.151,z],.0595,.00065,'offwhite',[0,1,0],64);
  for(const a of [PI*.1,PI*.83,PI*1.48]){
    const dir=[Math.sin(a),0,Math.cos(a)];
    screw(parent,[x+dir[0]*.0583,.148,z+dir[2]*.0583],dir,.0017,'white');
  }
  const swivel=group(parent,'PTZ moving optical cartridge',x,.313,z);swivel.userData.dynamic=true;
  const hood=group(swivel,'Gimbal yoke and lens barrel');
  axialShell(hood,[[-.053,.0008,.0008,.002],[-.052,.014,.017,.002],[-.050,.023,.030,.002],[-.046,.033,.043,.003],[-.038,.043,.054,.003],[-.026,.051,.062,.004],[-.012,.0548,.068,.004],[.002,.0555,.070,.003],[.015,.0547,.068,.003],[.025,.052,.065,.003],[.033,.048,.060,.003],[.039,.043,.054,.003],[.043,.038,.047,.002],[.045,.035,.043,.002],[.045,.033,.040,.002],[.042,.0328,.039,.002]],'darkcap',80);
  const bezel=group(hood,'Recessed optical axis',0,.001,0);
  axialShell(bezel,[[.041,.0327,.039],[.043,.0328,.039],[.0453,.0313,.037], [.0455,.0293,.0347],[.043,.0278,.0325],[.038,.0275,.0320]],'bezel');
  axialShell(bezel,[[.025,.001,.001],[.025,.028,.032],[.038,.0276,.032],[.040,.0268,.031],[.0405,.024,.029],[.035,.021,.023],[.032,.019,.020]],'barrel');
  for(const [r,z0] of [[.022,.037],[.0195,.0345],[.0168,.0328],[.0141,.0318]])torus(bezel,[0,0,z0],r,.00064,'bezel');
  cyl(bezel,[0,0,.0304],.0144,.0015,'barrel',[0,0,1],36);
  for(let i=0;i<7;i++){
    const blade=extrude(bezel,shape([[.003,-.002],[.012,-.004],[.014,.003],[.009,.010],[.006,.004]]),.00024,'bezel');
    blade.position.z=.0313;blade.rotation.z=i*TAU/7;
  }
  for(const [x0,y0] of [[-.0205,.014],[.0205,.014]]){
    cyl(bezel,[x0,y0,.0402],.00365,.0012,'bezel',[0,0,1],24);
    const ir=group(bezel,'IR illuminator behind protective window',x0,y0,0);
    axialShell(ir,[[.041,.0031,.0031],[.0416,.0026,.0026],[.0421,.0016,.0016],[.0423,.0001,.0001]],'infrared',32);
  }
  axialShell(bezel,[[.0298,.0137,.0137],[.0308,.009,.009],[.0318,.004,.004],[.032,.0001,.0001]],'optics');
  const cover=axialShell(bezel,[[.0411,.0272,.031],[.0429,.022,.025],[.0439,.015,.017],[.0444,.007,.008],[.0444,.00005,.00005]],'glass',64);
  cover.material.side=k.T.DoubleSide;cover.renderOrder=3;
  return {swivel,hood};
}

function device(k){
  const {group,box,roundedLoft,plate,cyl,rod,screw}=k;
  const head=group(null,'Zieview removable terminal');head.userData.dynamic=true;
  box(head,0,.098,0,.208,.157,.139,.0095,'case');
  box(head,0,.0245,0,.202,.011,.134,.004,'case');
  roundedLoft(head,[[.162,.2078,.1388,.0095],[.170,.208,.139,.0096],[.1735,.210,.140,.0105],[.175,.210,.140,.011]],'case');
  roundedLoft(head,[[.174,.208,.139,.011],[.175,.209,.140,.011],[.176,.210,.141,.012],[.177,.211,.142,.012]],'seal');
  roundedLoft(head,[[.176,.210,.141,.011],[.178,.213,.143,.012],[.183,.213,.144,.012],[.205,.213,.144,.013],[.211,.211,.143,.014],[.220,.200,.133,.016],[.227,.188,.121,.016]],'lid');
  latch(k,head,-.068,.0697,0);
  latch(k,head,.105,.023,PI*.5);
  for(const xx of [-.065,.064]){
    const h=group(head,'Rear pin hinge',xx,.173,-.0705);h.rotation.y=PI;
    for(const y of [-.011,.011])plate(h,0,y,.0018,.032,.021,.0025,.003,[],'case');
    for(const [x,length] of [[-.011,.009],[0,.010],[.011,.009]])cyl(h,[x,0,.006],.004,length,'case',[1,0,0],24);
    cyl(h,[0,0,.006],.0017,.034,'bright',[1,0,0],20);
    for(const x of [-.009,.009])screw(h,[x,-.012,.0033],[0,0,1],.0019,'metal');
  }
  for(const xx of [-.051,.050])for(const zz of [-.039,.040])
    box(head,xx,.0188,zz,.026,.006,.018,.002,'seal');
  gland(k,head,.068,-.023);gland(k,head,.053,.024);
  equipmentMark(k,head);const optic=camera(k,head);
  return {head,...optic};
}

function tripod(k,parent,baseHeight){
  const {T,group,box,cyl,rod,bar,cable,torus,lathe,plate,screw,vec}=k;
  const frame=group(parent,'Yellow folding telescope tripod',.002,0,-.003);
  lathe(frame,0,0,0,[[.001,.339],[.013,.339],[.015,.343],[.015,.735],[.0145,.742],[.001,.743]],'yellow',36);
  lathe(frame,0,0,0,[[.001,.696],[.025,.696],[.033,.703],[.036,.712],[.037,.733],[.029,.745],[.023,.748],[.001,.748]],'cast',48);
  lathe(frame,0,0,0,[[.001,.740],[.017,.740],[.0174,.750],[.0174,.981],[.0168,.984],[.001,.984]],'yellow',42);
  lathe(frame,0,0,0,[[.001,.966],[.014,.966],[.0145,.971],[.0145,baseHeight-.045],[.0138,baseHeight-.041],[.001,baseHeight-.041]],'yellow',42);
  lathe(frame,0,0,0,[[.001,baseHeight-.066],[.012,baseHeight-.066],[.012,baseHeight-.011],[.011,baseHeight-.007],[.001,baseHeight-.007]],'metal',40);
  for(const h of [.973,baseHeight-.040]){
    const rad=h>1.02?.0162:.021;
    lathe(frame,0,0,0,[[.001,h-.018],[rad*.9,h-.018],[rad,h-.015],[rad,h+.010],[rad*.92,h+.014],[.001,h+.014]],'cast',42);
    for(const sign of [-1,1])
      box(frame,sign*.0058,h-.001,rad*.98,.009,.019,.016,.0024,'cast');
    cyl(frame,[0,h-.0015,rad+.006],.0038,.030,'bright',[1,0,0],16);
    cyl(frame,[-.016,h-.0015,rad+.006],.0063,.005,'black',[1,0,0],6);
    const lever=box(frame,.022,h+.003,rad+.005,.033,.007,.009,.0029,'black');lever.rotation.z=.28;
    box(frame,.036,h+.0064,rad+.005,.012,.010,.012,.0032,'rubber');
  }
  lathe(frame,0,0,0,[[.001,.345],[.022,.345],[.026,.348],[.026,.360],[.023,.365],[.001,.366]],'gold',36);
  for(const angle of [-.62,1.61,3.66]){
    const radial=new T.Vector3(Math.sin(angle),0,Math.cos(angle));
    const across=new T.Vector3(Math.cos(angle),0,-Math.sin(angle));
    const p=(radius,y)=>radial.clone().multiplyScalar(radius).setY(y);
    const top=p(.025,.719),foot=p(.404,.012),shaft=foot.clone().sub(top),dir=shaft.clone().normalize();
    const from=top.clone().addScaledVector(dir,.010),to=foot.clone().addScaledVector(dir,-.026);
    rod(frame,from.toArray(),to.toArray(),.0145,'yellow',.0128,32);
    const piv=group(frame,'Folding clevis and leg pivot',...top.toArray());piv.rotation.y=angle;
    for(const side of [-1,1]){
      box(piv,side*.016,.004,-.005,.0055,.036,.028,.0031,'cast');
      cyl(piv,[side*.018,.000,0],.0076,.0038,'metal',[1,0,0],20);
    }
    cyl(piv,[0,0,0],.004,.045,'bright',[1,0,0],20);
    cyl(piv,[-.0225,0,0],.0068,.0044,'black',[1,0,0],6);
    const bootStart=foot.clone().addScaledVector(dir,-.056),bootEnd=foot.clone().addScaledVector(dir,-.003);
    rod(frame,bootStart.toArray(),bootEnd.toArray(),.0149,'rubber',.0157,24);
    for(let j=0;j<3;j++){
      const ring=foot.clone().addScaledVector(dir,-.014-j*.010);
      torus(frame,ring.toArray(),.0154,.00075,'rubber',dir.toArray(),30);
    }
    const pad=box(frame,foot.x,.004,foot.z,.030,.008,.036,.0039,'rubber');pad.rotation.y=angle;
    const braceSeat=top.clone().lerp(foot,.50),inner=p(.020,.355);
    const seat1=braceSeat.clone().addScaledVector(dir,-.009),seat2=braceSeat.clone().addScaledVector(dir,.009);
    rod(frame,seat1.toArray(),seat2.toArray(),.0152,'gold',.0152,24);
    const takeoff=braceSeat.clone().addScaledVector(radial,-.006).addScaledVector(across,.006);
    const fold=inner.clone().lerp(takeoff,.53);fold.y-=.003;
    bar(frame,inner.toArray(),fold.toArray(),.012,.0038,'gold',.0009);
    bar(frame,fold.toArray(),takeoff.toArray(),.010,.0035,'gold',.00075);
    for(const joint of [inner,fold,takeoff]){
      cyl(frame,joint.toArray(),.0045,.0145,'metal',across.toArray(),18);
      const outside=joint.clone().addScaledVector(across,.0075);
      cyl(frame,outside.toArray(),.0048,.0015,'gold',across.toArray(),18);
    }
  }
  cyl(frame,[0,baseHeight-.004,0],.027,.013,'cast',[0,1,0],36);
  plate(frame,0,baseHeight+.004,0,.111,.078,.008,.008,[],'black').rotation.x=PI*.5;
  for(const x of [-.036,.036])for(const z of [-.025,.025])
    cyl(frame,[x,baseHeight+.014,z],.0048,.015,'metal',[0,1,0],6);
  // A real continuous lead winds round the tripod, with a short hanging capped plug.
  const loops=[];
  for(let i=0;i<=84;i++){
    const a=(i/84)*TAU*3.08-.75;
    loops.push([.027+.052*Math.cos(a),.914+i*.00029+.008*Math.sin(a+.5),.010+.038*Math.sin(a)]);
  }
  const cablePath=[[.068,baseHeight-.004,-.023],[.068,baseHeight-.070,-.023],[.054,1.087,-.019],[.048,1.013,-.008],[.060,.958,.002],...loops,[.071,.926,.038],[.041,.900,.046],[-.020,.873,.041],[-.069,.806,.039],[-.086,.795,.040]];
  cable(frame,cablePath,.0037,'wire',195,8);
  const a=[-.087,.796,.040],b=[-.103,.785,.045];
  rod(frame,a,b,.0059,'rubber',.007,20);rod(frame,b,[-.108,.783,.046],.0052,'black',.0052,16);
  const strap=box(frame,.029,.928,.047,.011,.038,.003,.0012,'rubber');strap.rotation.z=-.14;
  return frame;
}

function column(k,parent){
  const {T,group,plate,box,cyl,torus,extrude}=k;
  const post=group(parent,'Optional steel mounting column',0,0,-.218);
  const w=.232,d=.175,f=.012,web=.008,r=.011,a=w/2,b=d/2,q=web/2;
  const s=new T.Shape();
  s.moveTo(-a,-b);s.lineTo(a,-b);s.lineTo(a,-b+f);s.lineTo(q+r,-b+f);
  s.quadraticCurveTo(q,-b+f,q,-b+f+r);s.lineTo(q,b-f-r);s.quadraticCurveTo(q,b-f,q+r,b-f);
  s.lineTo(a,b-f);s.lineTo(a,b);s.lineTo(-a,b);s.lineTo(-a,b-f);s.lineTo(-q-r,b-f);
  s.quadraticCurveTo(-q,b-f,-q,b-f-r);s.lineTo(-q,-b+f+r);s.quadraticCurveTo(-q,-b+f,-q-r,-b+f);
  s.lineTo(-a,-b+f);s.closePath();
  const steel=extrude(post,s,1.738,'post',.0015,3);steel.rotation.x=-PI*.5;steel.position.y=.892;
  const base=plate(post,0,.011,0,.349,.286,.0211,.010,[[-.141,-.115,.0093],[.141,-.115,.0093],[-.141,.115,.0093],[.141,.115,.0093]],'post');base.rotation.x=-PI*.5;
  for(const x of [-.140,.140])for(const z of [-.115,.115]){
    cyl(post,[x,.0223,z],.017,.0036,'metal',[0,1,0],32);
    cyl(post,[x,.0288,z],.0126,.010,'zinc',[0,1,0],6);
    cyl(post,[x,.0358,z],.0073,.008,'metal',[0,1,0],24);
    for(const y of [.0358,.0387])torus(post,[x,y,z],.0071,.00055,'metal',[0,1,0],20);
  }
  for(const z of [-b+f,b-f])for(const x of [-.054,.054]){
    const weld=box(post,x,.026,z,.101,.006,.010,.0027,'mill');weld.rotation.x=z>0?.72:-.72;
  }
  return post;
}

function magnet(k,parent){
  const {T,group,plate,cyl,rod,torus,box,screw,lathe,cable}=k;
  const mount=group(parent,'Magnetic attachment on removable terminal');
  const holes=[[-.073,-.067,.0049],[.073,-.067,.0049],[-.073,.067,.0049],[.073,.067,.0049],[0,0,.018]];
  plate(mount,0,.109,-.078,.177,.162,.006,.008,holes,'zinc');
  for(const x of [-.064,.064])for(const y of [.054,.164]){
    cyl(mount,[x,y,-.0735],.008,.007,'seal',[0,0,1],24);
    screw(mount,[x,y,-.0814],[0,0,-1],.0041);
  }
  const keeper=plate(mount,0,.110,-.086,.162,.150,.009,.013,[[0,0,.015]],'cast');
  for(const [x,y] of [[-.054,.070],[.054,.070],[0,.151]]){
    const disk=group(mount,'Steel cup magnet and countersink',x,y,-.086);
    cyl(disk,[0,0,-.013],.027,.022,'black',[0,0,1],42);
    cyl(disk,[0,0,-.027],.0247,.010,'zinc',[0,0,1],56);
    cyl(disk,[0,0,-.0375],.0235,.0115,'metal',[0,0,1],56);
    const ring=torus(disk,[0,0,-.0434],.0225,.0008,'bright',[0,0,1],50);
    const inner=torus(disk,[0,0,-.0435],.012,.00037,'zinc',[0,0,1],42);
    screw(disk,[0,0,-.0435],[0,0,-1],.0034,'black');
  }
  return mount;
}

// Each independently movable assembly is batched once. A close-up still carries
// true bores, fasteners and curved silhouettes, without hundreds of draw calls.
function consolidate(T,root,exclude=null){
  root.updateWorldMatrix(true,true);
  const inverse=new T.Matrix4().copy(root.matrixWorld).invert(),groups=new Map();
  function collect(obj){
    if(obj===exclude)return;
    if(obj.isMesh && !obj.material.transparent){
      const m=obj.material;if(!groups.has(m))groups.set(m,[]);groups.get(m).push(obj);
    }
    for(const c of obj.children)collect(c);
  }
  collect(root);
  const transform=new T.Matrix4(),normals=new T.Matrix3(),v=new T.Vector3();
  for(const [material,meshes] of groups){
    if(meshes.length<2)continue;
    let nv=0,ni=0;
    for(const mesh of meshes){nv+=mesh.geometry.attributes.position.count;ni+=mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count;}
    const a=new Float32Array(nv*3),n=new Float32Array(nv*3),u=new Float32Array(nv*2);
    const indices=nv>65535?new Uint32Array(ni):new Uint16Array(ni);
    let offset=0,count=0;
    for(const mesh of meshes){
      const g=mesh.geometry,pa=g.attributes.position,no=g.attributes.normal,uv=g.attributes.uv;
      transform.multiplyMatrices(inverse,mesh.matrixWorld);normals.getNormalMatrix(transform);
      for(let i=0;i<pa.count;i++){
        v.fromBufferAttribute(pa,i).applyMatrix4(transform).toArray(a,(offset+i)*3);
        v.fromBufferAttribute(no,i).applyNormalMatrix(normals).toArray(n,(offset+i)*3);
        if(uv){u[(offset+i)*2]=uv.getX(i);u[(offset+i)*2+1]=uv.getY(i);}
      }
      const gindex=g.index;
      for(let i=0;i<(gindex?.count ?? pa.count);i++)indices[count++]=offset+(gindex?gindex.getX(i):i);
      offset+=pa.count;mesh.removeFromParent();
    }
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.BufferAttribute(a,3));g.setAttribute('normal',new T.BufferAttribute(n,3));
    g.setAttribute('uv',new T.BufferAttribute(u,2));g.setIndex(new T.BufferAttribute(indices,1));g.computeBoundingSphere();
    const m=new T.Mesh(g,material);m.name=material.name;m.castShadow=true;m.receiveShadow=true;root.add(m);
  }
}

export function buildZieview(T,{mount='tripod'}={}){
  if (mount!=='tripod' && mount!=='magnet') throw new RangeError('Zieview mount must be tripod or magnet');
  const k=workshop(T),group=k.group(null,'Zieview / '+mount),H=mount==='tripod'?1.210:1.260;
  const {head,swivel,hood}=device(k);
  head.position.y=H;group.add(head);
  let pole=null,support;
  if(mount==='magnet'){
    magnet(k,head);pole=column(k,group);support=pole;pole.userData.dynamic=true;
    k.cable(head,[[.068,-.003,-.023],[.066,-.030,-.024],[.054,-.047,-.026],[.030,-.047,-.030],[.020,-.028,-.033],[.023,.013,-.045]],.0051,'wire',31,9);
  }else{
    support=tripod(k,group,H);
  }
  consolidate(T,hood);consolidate(T,head,swivel);consolidate(T,support);
  // The head yaw follows the bracket's own vertical axis; the inner cartridge tilts.
  const setAim=(pan=.48,tilt=-.022)=>{
    swivel.rotation.y=T.MathUtils.clamp(pan,-PI,PI);
    hood.rotation.x=T.MathUtils.clamp(tilt,-.18,.20);
  };
  const setExploded=(amount=0)=>{
    if(mount==='magnet')head.position.z=T.MathUtils.clamp(amount,0,1)*.185;
  };
  const update=(progress=0)=>{
    const p=T.MathUtils.clamp(progress,0,1);
    const f=p*p*(3-2*p);setAim(.52-f*.86,-.022+.043*Math.sin(p*PI));
  };
  setAim();
  const anchors=[new T.Vector3(-.182,H+.315,.059),new T.Vector3(.023,H+.112,.075),
    mount==='magnet'?new T.Vector3(.059,H+.073,-.119):new T.Vector3(.015,.715,.028)];
  group.updateWorldMatrix(true,true);
  const bounds=new T.Box3().setFromObject(group);
  return {group,anchors,ready:k.ready,head,pole,support,setAim,setExploded,update,bounds,
    targets:{full:new T.Vector3(-.025,mount==='magnet'?1.16:.81,-.001),head:new T.Vector3(-.049,H+.175,.006),optic:anchors[0].clone(),attachment:anchors[2].clone()}};
}
