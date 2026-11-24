// Scale is one metre per unit. Both working faces look towards local +Z.
const tau=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
function ease(a,b,p){const t=clamp((p-a)/(b-a));return t*t*(3-2*t);}
const font='"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",Arial,sans-serif';
const mono='Consolas,"Courier New",monospace';
const caches=new WeakMap();
const contactMaterials=new WeakMap();
const keyLegends=new WeakMap();
const polymerTextures=new WeakMap();

function workshop(T){
  const geometries=new Map(),images=new Map();
  const boxGeo=new T.BoxGeometry(1,1,1);
  function geometry(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);}
  function radiusBox(w,h,d,r){
    r=Math.min(r,w*.46,h*.46,d*.46);
    return geometry([w,h,d,r].join('/'),()=>{
      const sections=r<.006?3:6;
      const g=new T.BoxGeometry(1,1,1,sections,sections,sections),v=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
      const coord=(u,size)=>sections===3?[-size/2,-size/2+r,size/2-r,size/2][Math.round((u+.5)*3)]:
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

function surfaces(T,s,theme){
  const {mat,light,tex}=s;
  const ready=[];
  function map(file,srgb,rx=1,ry=1){const r=tex(file,srgb,rx,ry);ready.push(r.ready);return r.t;}
  const wood=mat('White-oiled oak veneer',0xdbbc97,.47,0,{map:map('oak.webp',true,2,1),normalMap:map('oak-normal.webp',false,2,1)});
  wood.normalScale.set(.38,.38);
  const roomDark=theme==='observer';
  const floor=mat('Contract woven flooring',roomDark?0x616c70:0xb0b2a7,.92,0,{map:map('weave.webp',true,6,5)});
  const tint=mat('Architectural glass',roomDark?0x94afbe:0xd6e2db,.14,.12,{transparent:true,opacity:roomDark?.10:.16,depthWrite:false,side:T.DoubleSide});
  const paper=mat('Uncoated paper',0xf2efdf,.9,0,{normalMap:map('paper-normal.webp',false,2,2)});paper.normalScale.set(.12,.12);
  const palette={wood,floor,paper,tint,ready,
    shell:mat('Warm ivory molded ABS',0xe4e0d3,.40,.018),ivory:mat('Mineral ivory satin',0xf0eee4,.35,.018),
    pale:mat('Mist grey injection molding',0xaeb5b1,.47,.035),body:mat('Graphite molded housing',0x363b3a,.42,.055),
    rubber:mat('Toner black rubber',0x181d1c,.86),slot:mat('Recess and optical seals',0x141817,.76),
    aluminum:mat('Brushed aluminium',0xb0bcc0,.29,.78),steel:mat('Satin steel',0x777f82,.36,.7),
    matte:mat('Graphite powder coat',0x323b40,.51,.27),frame:mat('Anodised monitor frame',0x282e30,.32,.48),
    cloth:mat('Desk mat felt',0x494f4c,.97),paint:mat('Interior mineral paint',roomDark?0x536773:0xd9d5c6,.92),
    offwhite:mat('Powder-coated cabinet',0xbbbcb0,.56,.04),mouse:mat('Mouse shell',0x343a3b,.33,.08),
    blue:mat('Nylon pass lanyard',0x2c545d,.87),standby:light('Amber indicator',0xe3a156),ok:light('Green indicator',0x83d3ae),
    ceilingLamp:light('Opal luminaire',roomDark?0xd8e9f1:0xffecd0),
    black:light('Dark indicator',0x293331),glass:mat('Scanner platen glass',0x4d6863,.13,.45),
    rackPhoto:roomDark?map('server-faces.webp',true):null,daylight:roomDark?null:map('window-daylight.webp',true)};
  if(!polymerTextures.has(T)){
    const pixels=new Uint8Array(160*160*4);let seed=12161;
    for(let i=0;i<pixels.length;i+=4){
      seed=(seed*1664525+1013904223)>>>0;const n=seed/4294967295;
      pixels[i]=Math.round(99+n*57);pixels[i+1]=Math.round(209+n*35);pixels[i+2]=pixels[i];pixels[i+3]=255;
    }
    const grain=new T.DataTexture(pixels,160,160);grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(5,5);
    grain.generateMipmaps=true;grain.minFilter=T.LinearMipmapLinearFilter;grain.magFilter=T.LinearFilter;grain.anisotropy=3;grain.needsUpdate=true;
    polymerTextures.set(T,grain);
  }
  for(const polymer of [palette.shell,palette.ivory,palette.body,palette.pale,palette.matte]){
    polymer.bumpMap=polymerTextures.get(T);polymer.bumpScale=.00065;polymer.roughnessMap=polymer.bumpMap;
  }
  return palette;
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
function paperPrint(c){
  rect(c,0,0,600,848,'#f4f1e6');rect(c,44,54,8,59,'#426258');
  words(c,71,72,'업무지원팀     |     내부 업무자료',20,'#52615b',600);
  words(c,68,118,'월간 운영 점검표',44,'#263b37',700);
  words(c,45,170,'문서번호  P-0742       관리 구분  내부용',17,'#56625e',600);
  line(c,45,196,553,196,'#74877c',2);words(c,46,239,'부서별 점검 내역',22,'#283a34',700);
  ['공용 장비 운영 점검','문서 보관 상태','사용자 권한 검토','장비 이력 검토','담당자 확인'].forEach((v,i)=>{
    const y=286+i*62;rect(c,45,y-25,508,44,i%2?'#eeede5':'#e3e7de');words(c,59,y+2,v,19,'#3a4640',500);
    words(c,530,y+2,i===4?'서명':'확인',17,'#57645b',500,font,'right');
  });
  words(c,45,684,'인증 출력     |     문서 P-0742',17,'#687870');line(c,44,720,554,720,'#9baba0');
  c.save();c.translate(307,453);c.rotate(-.43);words(c,0,0,'내부용 · 예시',64,'rgba(103,123,116,.24)',700,font,'center');c.restore();
  for(let i=0;i<66;i++){let w=(i*7%9)<3?3:1;rect(c,45+i*3,750,w,34,'#4a5953');}
  words(c,552,783,'1 / 1',16,'#53605a',500,mono,'right');
}

function housing(T,s,m,g,width,height,screen,x,y,z,yaw=0,tilt=0){
  const h=s.group(g,x,y,z,'display enclosure');h.rotation.set(tilt,yaw,0,'YXZ');
  s.box(h,0,0,-.025,width,height,.057,m.frame,.015);
  s.box(h,0,-.004,.003,width-.013,height-.012,.014,m.slot,.007);
  const active=s.face(h,0,.003,.011,width-.027,height-.036,screen.material);
  active.name='Active display';s.box(h,.35*width,-height/2+.009,.015,.008,.0028,.002,m.ok);
  return h;
}
function fixtureRoom(T,s,m,root,office){
  const {box,cyl,group}=s;
  box(root,0,-.055,-.55,7.4,.10,6.7,m.floor);
  const joint=office?m.offwhite:m.matte;
  const floorJoint=s.mat('Carpet tile joints',office?0x767c72:0x3d484b,.96);
  for(const z of [-2.15,-.74,.68])box(root,0,-.003,z,7.3,.002,.0025,floorJoint);
  for(const x of [-2.9,-1.45,0,1.45,2.9])box(root,x,-.003,-.55,.0023,.002,6.65,floorJoint);
  box(root,0,1.48,-3.20,7.4,3.10,.12,m.paint);
  box(root,0,.08,-3.09,7.28,.155,.075,joint,.008);
  for(const x of [-3.55,3.55]){
    box(root,x,1.51,-.62,.11,3.02,5.5,m.paint);
    box(root,x-(Math.sign(x)*.055),.078,-.60,.039,.152,5.48,joint);
  }
  const ceiling=box(root,0,3.06,-.65,7.2,.12,5.15,office?m.shell:m.matte);ceiling.castShadow=false;
  for(const x of [-2.45,.55,2.36]){
    box(root,x,2.98,-.49,.18,.045,2.93,m.frame,.008).castShadow=false;
    box(root,x,2.951,-.49,.147,.012,2.86,m.ceilingLamp,.005);
  }
  if(office){
    // A daylight view sits beyond the actual jamb, glass, sill and exterior fins.
    const outlook=new T.MeshBasicMaterial({map:m.daylight,color:0xf3f3df,toneMapped:false});
    s.face(root,-.64,1.94,-3.117,5.18,1.68,outlook);
    box(root,-.64,1.071,-3.006,5.36,.078,.24,m.wood,.012);
    for(const x of [-3.26,-1.96,-.66,.64,1.98]){
      box(root,x,1.94,-3.042,.048,1.75,.10,m.aluminum,.004);
    }
    for(const y of [1.11,2.77])box(root,-.64,y,-3.026,5.28,.046,.11,m.aluminum);
    box(root,-.65,2.66,-3.00,5.20,.17,.07,m.pale,.006);
    for(let i=0;i<5;i++){const sl=box(root,-.64,2.58-i*.04,-2.994,5.17,.012,.052,m.offwhite);sl.rotation.x=-.25;}
    box(root,2.75,1.44,-3.07,1.12,2.7,.092,m.wood,.017);
    for(const x of [2.21,3.29])box(root,x,1.44,-3.009,.025,2.63,.046,m.steel);
    box(root,2.36,1.02,-2.96,.13,.023,.032,m.aluminum,.006);
    const store=group(root,-.69,0,-2.56);
    box(store,0,.43,0,3.38,.80,.58,m.offwhite,.016);box(store,0,.852,0,3.48,.054,.66,m.wood,.013);
    for(let i=0;i<5;i++){
      const x=-1.32+i*.66;box(store,x,.43,.302,.643,.74,.028,m.shell,.009);
      box(store,x+.23,.673,.329,.063,.014,.028,m.aluminum,.004);
    }
    for(let i=0;i<9;i++){
      const x=-1.30+i*.067;const b=box(store,x,1.03,-.03,.057,.32,.236,i%4===0?m.blue:m.body,.006);
      b.rotation.z=i===8?-.11:0;box(store,x,.99,.091,.028,.068,.004,m.paper);
    }
    for(let i=0;i<3;i++)box(store,.94,.903+i*.05,-.025,.35,.047,.26,i===1?m.pale:m.paper,.008);
  }else{
    // Steel-framed glazed partition separating a working NOC from the racks.
    for(const x of [-3.27,-1.72,-.17,1.38,2.93]){
      box(root,x,1.47,-1.91,.049,2.94,.089,m.matte,.007);
    }
    for(const y of [.12,2.81])box(root,-.17,y,-1.91,6.26,.045,.094,m.matte);
    for(let i=0;i<4;i++){
      const x=-2.495+i*1.55;
      box(root,x,1.47,-1.912,1.50,2.62,.018,m.tint);
      for(const y of [1.02,1.055])box(root,x,y,-1.888,1.49,.009,.003,m.steel);
    }
    for(const x of [-2.42,.80,2.42])cyl(root,x,2.77,-2.68,.036,1.45,m.aluminum,'x');
  }
}

function flatKeyboard(T,s,m,g,x,y,z,w,rows=5){
  const keys=s.group(g,x,y,z,'low profile keyboard'),ratio=w/.46;
  keys.scale.setScalar(ratio);s.box(keys,0,0,0,.46,.016,.139,m.matte,.009);
  for(let j=0;j<rows;j++)for(let i=0;i<15;i++){
    if(j===4&&i>2&&i<9)continue;
    const wide=j===4&&i===2;
    s.box(keys,-.203+i*.0286+(wide?.085:0),.010+.0006*(4-j),-.049+j*.0243,wide?.192:.0234,.008,.0191,m.body,.0024);
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

function queueScreen(c,stage){
  const bg='#ecece6',green='#2d6053';
  rect(c,0,0,800,470,bg);rect(c,0,0,800,66,'#213e37');
  words(c,29,43,'ZiewPrint',29,'#f0f3e8',650);words(c,774,41,'오피스 03  /  예시',18,'#c4d1bf',550,font,'right');
  words(c,35,131,'내 출력 대기열',39,'#263c34',700);words(c,37,171,'공유 복합기 03',22,'#59685d');
  line(c,35,193,765,193,'#acb8a8',2);rect(c,35,211,730,107,'#fcfbf4');
  rect(c,54,232,7,64,green);words(c,77,261,'월간 운영 점검표',28,'#2e4138',650);words(c,78,293,'P-0742    ·    A4    ·    1장',19,'#66756c',500,mono);
  words(c,742,277,stage===2?'출력 완료':stage===1?'인증됨':'보안 대기',24,green,700,font,'right');
  words(c,37,377,stage===2?'인증 시각과 출력 이력이 저장됐습니다.':'장비 앞에서 사원증 또는 PIN으로 인증하세요.',22,'#40554a');
  words(c,36,433,'개인 출력함     /     공용 장비',16,'#778579');
}
function terminalScreen(c,state){
  const step=Math.floor(state/10),digits=state%10;
  const accent=step>=2?'#80d5ad':'#f1bc7b';
  rect(c,0,0,700,416,'#223630');rect(c,0,0,700,58,'#172c27');
  words(c,23,38,'ZiewPrint',25,'#edf5ea',700);words(c,673,36,'복합기 03  ·  예시',18,'#b7c7bb',550,font,'right');
  disk(c,39,102,7,accent);words(c,56,108,step===3?'작업 완료':step===2?'사용자 인증 완료':step===1?'사원증 확인 중':'보안 출력 대기',22,accent,700);
  words(c,28,181,step===3?'출력 이력 저장':step===2?'출력할 문서 1건':step===1?'사원증을 읽습니다':'사원증을 대주세요',42,'#edf4e9',700);
  line(c,26,207,673,207,'#486256',2);
  if(step<2){words(c,28,267,step===1?'등록 사용자 확인 중':'사원증 또는 PIN으로 인증',24,'#c3d5c8');
    if(step===0){
      rect(c,27,298,152,53,'#365248');words(c,103,331,'PIN 입력',21,'#dae7db',600,font,'center');
      for(let n=0;n<12;n++){const x=496+(n%3)*53,y=226+Math.floor(n/3)*33;rect(c,x,y,46,28,'#354c42');
        words(c,x+23,y+21,['1','2','3','4','5','6','7','8','9','×','0','↵'][n],17,'#c8d8ca',550,mono,'center');}
    }else{rect(c,28,302,222,7,'#465d52');rect(c,28,302,45+digits*39,7,'#95bda5');words(c,28,347,'출력 대기 문서  1건',20,'#b7cbbd');}
  }else{words(c,28,266,'월간 운영 점검표',29,'#eaf4e7',650);words(c,28,316,'P-0742    /    A4    /    1장',21,'#b6cec0',500,mono);}
  words(c,28,383,step===3?'문서를 수령하세요.':'사용자 출력함',19,'#a9bcae');
}
function identity(c){
  rect(c,0,0,520,322,'#eceddf');rect(c,0,0,520,53,'#325e58');
  words(c,25,37,'사원증',24,'#f1f1e4',700);words(c,487,35,'STAFF',19,'#d5e5dc',600,mono,'right');
  rect(c,30,87,121,158,'#ccd9ce');disk(c,91,139,24,'#789186');
  c.fillStyle='#789186';c.beginPath();c.ellipse(91,225,49,48,0,0,tau);c.fill();
  words(c,181,142,'업무지원팀',31,'#344d44',650);words(c,181,195,'오피스 출입 · 출력 인증',19,'#52645a');words(c,183,250,'STAFF  014',19,'#63746a',500,mono);
  for(let i=0;i<44;i++)rect(c,30+i*4.5,271,i%4===0?2.4:1.2,27,'#364940');
}

function printBay(T,s,m,root){
  const {box,group,face,cyl,cable,profile}=s;
  fixtureRoom(T,s,m,root,true);
  const work=group(root,-1.09,0,-.20,'Staff worktop');
  contact(T,s,work,0,.002,0,1.44,1.00);
  box(work,0,.92,0,1.20,.061,.73,m.wood,.013);
  box(work,0,.878,0,1.15,.025,.67,m.steel,.005);
  for(const x of [-.51,.51])for(const z of [-.265,.265])box(work,x,.44,z,.045,.87,.05,m.matte,.005);
  box(work,0,.80,-.27,1.02,.085,.03,m.matte);
  const laptop=group(work,-.06,.969,-.008,'Aluminium laptop');
  laptop.rotation.y=.08;
  box(laptop,0,.011,.012,.60,.019,.392,m.aluminum,.009);
  const kb=flatKeyboard(T,s,m,laptop,0,.025,-.038,.514);kb.scale.y*=.70;
  box(laptop,0,.024,.126,.15,.0018,.073,m.pale,.0008);
  const queue=drawCanvas(T,800,470,'Held print queue',queueScreen);
  const lid=group(laptop,0,.029,-.178,'Laptop hinge');lid.rotation.x=-.17;
  box(lid,0,.158,0,.60,.326,.021,m.frame,.010);
  face(lid,0,.159,.012,.574,.291,queue.material);cyl(lid,0,.311,.012,.003,.002,m.rubber,'z',10);
  cyl(laptop,-.18,.027,-.177,.013,.105,m.aluminum,'x');cyl(laptop,.18,.027,-.177,.013,.105,m.aluminum,'x');
  cable(work,[[.237,.963,-.082],[.38,.954,-.10],[.454,.95,-.28],[.53,.87,-.335],[.52,.46,-.36],[.41,.068,-.40]],.005,m.rubber);
  const sorter=group(work,-.45,.958,-.13);
  for(let i=0;i<2;i++)box(sorter,0,.027+i*.05,0,.16,.019,.20,i?m.pale:m.blue,.003);
  const machine=group(root,.34,0,.005,'A3 office multifunction printer');
  contact(T,s,machine,0,.003,.015,1.65,1.39);
  const D=(x,y,z,w,h,d,material,r=0)=>box(machine,x,y,z,w,h,d,material,r);
  D(0,.103,0,1.065,.145,.796,m.body,.031);
  for(const x of [-.419,.419])for(const z of [-.28,.28]){
    cyl(machine,x,.048,z,.045,.044,m.rubber,'x');D(x,.085,z,.070,.059,.060,m.matte,.008);
    contact(T,s,machine,x,.004,z,.21,.22);
  }
  D(0,.55,-.028,1.07,.82,.764,m.shell,.033);
  D(0,.874,-.006,1.075,.09,.815,m.body,.019);
  // Front drawer recesses are inset behind the arched moulded grips.
  for(const [y,h] of [[.274,.194],[.480,.192],[.695,.211]]){
    D(-.022,y,.375,1.016,h,.082,m.ivory,.016);
    D(-.105,y+h*.235,.42,.447,.055,.021,m.slot,.014);
    D(-.105,y+h*.37,.431,.449,.022,.032,m.pale,.008);
    D(-.105,y+h*.415,.437,.433,.009,.023,m.shell,.004);
    D(.410,y-.028,.419,.039,.034,.004,m.offwhite,.0015);
    D(.410,y-.027,.422,.024,.007,.002,m.body);
  }
  for(const [number,y,size] of [['03',.294,'A3'],['02',.500,'A4'],['01',.717,'A4']]){
    const guide=drawCanvas(T,340,116,'Cassette '+number,c=>{
      rect(c,0,0,340,116,'#dedfd5');words(c,13,42,'CASSETTE  '+number,23,'#68706b',600,mono);
      line(c,13,54,325,54,'#a6ada2',2);
      words(c,14,91,size+'   80 g/m²',25,'#59645d',650,mono);
    },false);
    face(machine,.320,y,.419,.088,.030,guide.material);
  }
  // The imager is supported at the rear and edges, leaving a true open exit bay.
  D(-.028,.940,-.005,1.041,.10,.80,m.shell,.027);
  D(-.025,.989,.018,.864,.026,.742,m.slot,.014);
  D(-.046,1.10,-.289,.969,.263,.194,m.body,.021);
  D(-.464,1.089,-.078,.097,.245,.572,m.shell,.020);
  D(.444,1.071,-.030,.185,.304,.720,m.shell,.023);
  D(.438,1.080,.334,.185,.272,.052,m.ivory,.013);
  D(-.048,1.120,-.170,.795,.103,.060,m.rubber,.014);
  D(-.055,1.104,-.126,.692,.035,.028,m.slot,.011);
  for(let i=0;i<7;i++){cyl(machine,-.344+i*.099,1.098,-.099,.021,.051,m.rubber,'x',20);}
  D(-.053,1.000,.189,.785,.023,.55,m.body,.010);
  D(-.053,.994,.490,.641,.017,.31,m.body,.009);
  D(-.053,.994,.625,.566,.020,.054,m.pale,.007);
  for(const x of [-.351,.244])D(x,1.011,.421,.014,.021,.347,m.body,.004);
  for(let i=0;i<7;i++)D(-.294+i*.083,1.012,.195,.006,.012,.40,m.matte,.0023);
  D(0,1.236,-.027,1.093,.079,.845,m.body,.022);
  D(-.007,1.284,-.026,1.12,.080,.85,m.ivory,.025);
  D(-.052,1.327,-.041,.855,.019,.615,m.glass,.008);
  for(const x of [-.38,.34])D(x,1.351,-.33,.104,.063,.093,m.body,.010);
  // Radiused duplex feeder, a separate lid and inclined duplex original path.
  profile(machine,-.052,.927,[[-.411,1.336],[.250,1.336],[.319,1.362],[.314,1.400],[.151,1.432],[-.103,1.447],[-.290,1.503],[-.382,1.488]],m.shell);
  profile(machine,-.183,.674,[[-.405,1.425],[-.376,1.530],[-.311,1.566],[-.201,1.564],[.129,1.480],[.181,1.457],[.178,1.448],[-.182,1.488],[-.247,1.496],[-.281,1.460]],m.body);
  profile(machine,-.174,.616,[[-.255,1.498],[.176,1.440],[.289,1.454],[.327,1.493],[.313,1.5],[.172,1.476],[-.232,1.527]],m.pale);
  for(const x of [-.389,.028])profile(machine,x,.022,[[-.206,1.502],[.143,1.461],[.177,1.468],[.164,1.492],[-.187,1.537]],m.body);
  D(.328,1.423,-.30,.196,.116,.112,m.shell,.032);
  D(-.509,1.337,-.26,.024,.026,.22,m.pale,.007);
  const align=drawCanvas(T,680,60,'Original guides',c=>{
    rect(c,0,0,680,60,'#b5bab2');words(c,21,42,'A3',25,'#515953',650,mono);
    for(let i=0;i<41;i++)rect(c,89+i*13,5,2,i%5?12:24,'#737a72');
    words(c,635,43,'A4',23,'#515953',650,mono);
  },false);
  const ruler=face(machine,-.15,1.334,.242,.510,.015,align.material);ruler.rotation.x=-Math.PI/2;
  // Open throat, side panel seams, service latch and a replaceable filter grille.
  D(.535,.573,-.039,.027,.557,.660,m.pale,.013);
  D(.55,.627,.01,.012,.054,.157,m.slot,.005);
  D(.557,.642,.008,.014,.017,.129,m.pale,.005);
  for(let i=0;i<12;i++)D(.552,.424+i*.012,-.186,.010,.004,.170,m.body,.0015);
  for(let i=0;i<10;i++)D(.432,.997+i*.014,.363,.110,.004,.003,m.body);
  const label=drawCanvas(T,390,118,'Equipment ID and serial',c=>{
    rect(c,0,0,390,118,'#e5e7dc');words(c,13,39,'A3  /  MULTIFUNCTION',25,'#646d66',650,mono);
    for(let j=0;j<58;j++)rect(c,15+j*3.6,55,j%3?1:2,26,'#535f59');words(c,15,103,'DEVICE 03  /  MFP · 12',15,'#68716a',600,mono);
  },false);
  face(machine,-.365,.776,.419,.121,.037,label.material);
  // The display and the contactless reader have independent articulated supports.
  D(.546,1.266,.233,.18,.045,.072,m.aluminum,.014);
  cyl(machine,.613,1.286,.235,.039,.062,m.body,'x');
  const control=group(machine,.668,1.392,.330,'Card and PIN release terminal');control.rotation.set(-.40,-.11,0,'YXZ');
  box(control,0,0,-.017,.433,.269,.054,m.body,.018);
  box(control,0,.005,.010,.412,.251,.010,m.slot,.0035);
  const terminal=drawCanvas(T,700,416,'Secure release touchscreen',terminalScreen);
  face(control,0,.009,.016,.387,.225,terminal.material);
  box(control,.146,-.120,.018,.029,.003,.002,m.ok);
  cyl(control,-.172,-.117,.018,.005,.004,m.pale,'z',18);
  const reader=group(machine,.577,1.247,.490,'Contactless badge reader');reader.rotation.x=-.60;
  box(reader,0,0,0,.168,.135,.043,m.body,.014);
  const readerIcon=drawCanvas(T,240,154,'Reader markings',c=>{
    rect(c,0,0,240,154,'#38403d');words(c,113,135,'사원증',23,'#d7dece',600,font,'center');
    c.strokeStyle='#e0e7d9';c.lineWidth=5;for(const r of [12,23,35]){c.beginPath();c.arc(110,63,r,-.9,.9);c.stroke();}
    c.strokeRect(63,47,20,35);
  },false);
  face(reader,0,.004,.023,.142,.094,readerIcon.material);
  const readerLed=box(reader,0,.054,.025,.052,.007,.003,m.standby,.001);readerLed.userData.dynamic=true;
  const pass=group(machine,0,0,0,'Employee badge approaching reader');pass.userData.dynamic=true;
  box(pass,0,0,0,.131,.083,.0035,m.shell,.0014);
  const badge=drawCanvas(T,520,322,'Staff badge',identity,false);
  face(pass,0,0,.0022,.126,.078,badge.material);
  box(pass,0,.047,.001,.018,.014,.004,m.aluminum,.0015);
  cable(pass,[[0,.048,0],[.013,.11,-.008],[.055,.169,.009],[.112,.219,.041],[.205,.252,.104]],.0029,m.blue);
  cable(pass,[[0,.051,0],[-.006,.108,-.005],[.033,.173,.009],[.100,.229,.038],[.184,.272,.100]],.0029,m.blue);
  // A two-sided printed sheet moves on the roller path, flexes and finally settles.
  const front=drawCanvas(T,600,848,'Authenticated document',paperPrint,false);
  front.material.side=T.DoubleSide;front.material.normalMap=m.paper.normalMap;front.material.normalScale?.set(.10,.10);
  const pageGeo=new T.PlaneGeometry(.292,.410,10,22),original=pageGeo.attributes.position.array.slice();
  const sheet=new T.Mesh(pageGeo,front.material);sheet.name='Authenticated output sheet';sheet.userData.dynamic=true;sheet.castShadow=sheet.receiveShadow=true;machine.add(sheet);
  const update=(p)=>{
    const verified=p>=.612,release=p>=.684;
    queue.render(p>=.93?2:verified?1:0);
    terminal.render(p>=.94?30:verified?20:p>.396?10+Math.floor(ease(.408,.60,p)*4.99):0);
    readerLed.material=verified?m.ok:m.standby;
    const t=ease(.30,.53,p)*(1-ease(.625,.766,p));
    pass.visible=t>.005;pass.position.set(.951-.390*t,1.48-.19*t,.755-.190*t);
    pass.rotation.set(-.27-.35*t,-.32+.19*t,-.10+.05*t,'YXZ');
    sheet.visible=release;
    if(release){
      const f=ease(.684,.925,p),end=ease(.87,.99,p);
      const pos=pageGeo.attributes.position,head=-.135+.772*f;
      for(let i=0;i<pos.count;i++){
        const u=original[i*3],v=(original[i*3+1]+.205)/.410;
        const z=head-v*.410,drop=ease(-.065,.30,z),bow=Math.sin(v*Math.PI);
        const y=1.086-.066*drop+.014*bow*(1-end)+.009*(u/.146)**2*(.35+.65*(1-end))+.009*(1-v)**3*(1-end);
        pos.setXYZ(i,-.052+u,y,z);
      }
      pos.needsUpdate=true;pageGeo.computeVertexNormals();pageGeo.computeBoundingSphere();
    }
  };
  update(0);
  return {anchors:[new T.Vector3(-1.15,1.185,-.374),new T.Vector3(1.006,1.388,.367),new T.Vector3(.288,1.055,.441)],equipment:[work,machine],update};
}

function traceGraph(c,x,y,w,h,color,network){
  for(let j=0;j<3;j++)line(c,x,y+j*h/2,x+w,y+j*h/2,'#33424a',1);
  c.beginPath();
  for(let i=0;i<=90;i++){
    const t=i/90,noise=Math.sin(i*1.97)*.028+Math.sin(i*.59)*.044+Math.cos(i*.25)*.031;
    const spike=network?0:(ease(.46,.505,t)*(1-ease(.68,.84,t))*.70);
    const v=network?.37+noise*.81:.15+noise+spike;
    const xx=x+t*w,yy=y+h*(1-clamp(v,.035,.95));if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);
  }
  c.strokeStyle=color;c.lineWidth=3;c.lineJoin='round';c.stroke();
}
function liveDisplay(c,state){
  const level=Math.floor(state/20),tick=state%20;
  rect(c,0,0,960,545,'#1b262d');rect(c,0,0,960,63,'#26363d');
  rect(c,24,20,5,24,'#78b4c7');words(c,41,40,'ZiewObserver',25,'#deeaeb',700);
  words(c,931,40,'운영 콘솔   /   예시 데이터',17,'#b0c3c8',550,font,'right');
  if(!level){
    words(c,30,120,'호스트 가용성 · 성능 지표',35,'#e1e9e9',650);
    words(c,30,162,'운영망   /   호스트 R03',20,'#9eb6bf');line(c,30,184,930,184,'#4a5c65');
    [['호스트 응답','접속 가능','#9acaba'],['왕복 지연','7.1 ms','#a5c8d4'],['CPU 사용률','38 %','#a5c8d4']].forEach(([label,value,color],i)=>{
      const x=31+i*302;rect(c,x,212,278,105,'#26343c');
      words(c,x+17,249,label,20,'#b3c6cc');words(c,x+16,295,value,32,color,650);
    });
    words(c,30,369,'응답 지연 이벤트',24,'#d9e6e7',650);disk(c,41,413,7,'#dfa77f');
    words(c,60,420,'14:32:16     주문 서비스 응답 시간 상승',23,'#dec4ab');
    line(c,30,449,930,449,'#485b64');words(c,31,495,'호스트는 연결 상태입니다. 같은 시각의 서비스 지표를 확인합니다.',20,'#b3c6cc');
    return;
  }
  words(c,30,119,'응답 시간 상관 분석',34,'#e0e9e9',650);
  disk(c,736,104,5,level?'#efaa70':'#8bc5b5');words(c,752,111,level?'지연 구간 선택':'이벤트 수집 중',18,level?'#edc2a0':'#b7d4c9',600);
  line(c,28,142,932,142,'#526269',1);words(c,30,178,'애플리케이션',22,'#d0e3e9',600);
  words(c,164,177,'APM  /  P95',17,'#8ca3ac',500,mono);words(c,931,180,level?'428 ms':'103 ms',25,'#efb58b',650,mono,'right');
  traceGraph(c,31,194,899,107,'#e9ad84',false);
  words(c,31,346,'네트워크',22,'#c7e1e9',600);words(c,146,345,'NPM  /  RTT',17,'#8ca3ac',500,mono);
  words(c,931,345,'7.1 ms',25,'#8bbcca',650,mono,'right');
  traceGraph(c,31,362,899,83,'#8fbecb',true);
  if(level){
    const f=.38+(46/90-.38)*tick/19,x=31+899*f,seconds=30+Math.round(90*f);
    const stamp='14:'+String(31+Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
    c.save();c.setLineDash([4,5]);line(c,x,188,x,446,'#d5dcd9',2);c.restore();
    rect(c,x-58,451,116,28,'#d4dcd6');words(c,x,471,stamp,16,'#2e3939',700,mono,'center');
  }
  words(c,30,491,'14:31:30',16,'#9fb1b8',500,mono);words(c,928,491,'14:33:00',16,'#9fb1b8',500,mono,'right');
  line(c,30,504,930,504,'#3d4e55');words(c,31,531,level?'동일 시각 비교   ·   네트워크 왕복 시간 안정':'운영 구간  /  주문 서비스',17,'#a9bdc3');
}
function drillDisplay(c,state){
  const stage=Math.floor(state/20),tick=state%20;
  rect(c,0,0,800,457,'#202a31');rect(c,0,0,800,53,'#29383f');
  words(c,24,35,'서비스 트레이스',22,'#d4e3e8',650);
  words(c,773,35,'예시   /   TRACE 7C2',16,'#a2b5be',600,mono,'right');
  words(c,24,92,stage===2?'inventory-db · 우선 점검 대상':'주문 요청의 호출 경로',29,'#e1e9eb',650);
  words(c,25,125,'14:32:16.042   ·   POST /orders',18,'#a7bac1',500,mono);
  const labels=['api-gateway','orders-api','inventory-db'];
  const durations=['8 ms','428 ms','312 ms'];
  for(let i=0;i<3;i++){
    const y=151+i*52,selected=i===2&&stage===2;
    rect(c,24,y,750,43,selected?'#364d51':i%2?'#25333c':'#2d3a41');
    const x=43+i*15;rect(c,x-7,y+14,3,15,i===2?'#d6a47f':'#8db5c0');
    words(c,x+6,y+29,labels[i],20,selected?'#e8f2ee':'#d1e0e5',600,mono);
    rect(c,322+i*24,y+16,[19,251,174][i],9,i===2?'#d7a17d':'#7cabb8');
    words(c,755,y+28,durations[i],20,'#c9dadf',550,mono,'right');
  }
  line(c,24,317,774,317,'#4b626c');
  if(stage===2){words(c,26,344,'선택한 서비스의 DDI 등록정보',19,'#d9c1a6',650);
    words(c,27,373,'DNS A',16,'#8faab5',650,mono);words(c,126,373,'inventory-db.ops.example  →  10.24.8.41',17,'#c7d9dd',550,mono);
    words(c,27,400,'DHCP',16,'#8faab5',650,mono);words(c,126,400,'10.24.8.41  예약 주소',17,'#c7d9dd');
    words(c,27,427,'IPAM',16,'#8faab5',650,mono);words(c,126,427,'10.24.8.0/24  ·  운영 서버 구간',17,'#c7d9dd');}
  else {words(c,25,359,'서비스를 선택해 하위 구간을 확인합니다.',21,'#b4c9cf');}
  if(stage>0)cursor(c,481-148*(tick/19),165+101*(tick/19));
  if(stage!==2)words(c,772,432,'운영 담당자',16,'#98b0b9',550,font,'right');
}
function rackTelemetry(c,state){
  rect(c,0,0,624,252,'#26343a');rect(c,0,0,624,49,'#30434a');
  disk(c,23,26,6,state?'#efb17c':'#96d2ac');
  words(c,39,34,'운영 노드  R03',22,'#e1ebe8',700);words(c,603,32,'예시',16,'#c1ced0',550,font,'right');
  words(c,16,93,'호스트 연결',25,'#e1e9e8',650);words(c,600,94,'정상  /  7.1 ms',25,'#a2d1bd',650,font,'right');
  line(c,16,111,608,111,'#52656a');words(c,17,146,'DNS',20,'#a3b9c1',600,mono);
  words(c,600,146,'inventory-db.ops.example',22,'#d5e2e2',550,mono,'right');
  words(c,17,182,'DHCP',20,'#a3b9c1',600,mono);words(c,600,182,'10.24.8.41  예약',22,'#d5e2e2',550,font,'right');
  words(c,17,219,'IPAM',20,'#a3b9c1',600,mono);words(c,600,219,'10.24.8.0/24',22,'#d5e2e2',550,mono,'right');
}
function rackUnit(T,s,m,g,x,z,yaw,detail=true){
  const {box,group,cyl,face,cable}=s, r=group(g,x,0,z,'19-inch server enclosure');r.rotation.y=yaw;
  const edge=value=>detail?value:0;
  box(r,0,.11,0,.652,.125,.927,m.matte,edge(.016));
  box(r,0,1.015,-.010,.624,1.83,.855,m.slot,edge(.025));
  box(r,0,1.993,0,.648,.071,.929,m.matte,edge(.014));
  for(const side of [-1,1]){
    box(r,side*.315,1.057,.00,.034,1.878,.857,m.matte,edge(.008));
    box(r,side*.289,1.056,.439,.039,1.858,.044,m.aluminum,edge(.005));
    box(r,side*.322,1.05,.423,.038,1.873,.059,m.matte,edge(.008));
    box(r,side*.256,1.055,.457,.023,1.79,.015,m.frame,edge(.0018));
    if(detail)for(let j=0;j<13;j++)box(r,side*.332,.49+j*.017,-.02,.006,.005,.43,m.slot);
  }
  const photographic=new T.MeshStandardMaterial({name:'Service module faces',color:0xe2e7e5,map:m.rackPhoto,roughness:.55,metalness:.22});
  const heights=[2,3,3,4,2,2,3,2,3,3,2,2,2,2],total=heights.reduce((a,b)=>a+b,0);
  const visibleH=1.70,start=.186;
  let used=0;
  for(let j=0;j<heights.length;j++){
    const h=heights[j]/total*visibleH,y=start+(used+heights[j]/2)/total*visibleH,zf=.450+(j%4===0?.012:0);
    box(r,0,y,zf-.014,.493,h-.004,.036,m.matte,edge(.002));
    const geo=new T.PlaneGeometry(.489,h-.005),uv=geo.attributes.uv;
    for(let i=0;i<uv.count;i++)uv.setY(i,(used+uv.getY(i)*heights[j])/total);
    const panel=new T.Mesh(geo,photographic);panel.position.set(0,y,zf+.006);panel.receiveShadow=true;r.add(panel);
    if(detail){
      for(const side of [-1,1]){
        cyl(r,side*.260,y,zf+.011,.0046,.005,m.steel,'z',8);
        if(j%3===0)box(r,side*.226,y,zf+.016,.011,h*.72,.014,m.body,.0035);
      }
    }
    used+=heights[j];
  }
  box(r,0,1.925,.449,.51,.049,.018,m.body,.004);
  for(const x of [-.260,.260])for(const z of [-.346,.346])cyl(r,x,.048,z,.031,.072,m.rubber);
  if(!detail)return {};
  const amber=box(r,.213,1.604,.474,.018,.010,.007,m.standby,.002);
  amber.userData.dynamic=true;
  const label=drawCanvas(T,388,106,'Service node tag',c=>{
    rect(c,0,0,388,106,'#d9ded7');words(c,13,43,'R03    /    DB-03',32,'#38464a',700,mono);
    words(c,14,81,'NODE 03   ·   NETWORK A',20,'#4b5959',500,mono);
  },false);
  face(r,-.119,1.924,.461,.168,.046,label.material);
  const telemetry=drawCanvas(T,624,252,'Node availability and DDI cross-reference',rackTelemetry);
  box(r,0,1.463,.476,.486,.21,.041,m.frame,.007);
  face(r,0,1.463,.498,.455,.180,telemetry.material);
  const lineM=s.mat('Muted blue patch cable',0x477186,.59);
  for(let i=0;i<3;i++){
    const a=-.18+i*.044,b=.06+i*.039;
    cable(r,[[a,1.766,.467],[a,1.765,.508],[a+.018,1.70-i*.017,.552],[b-.013,1.682-i*.014,.545],[b,1.704,.475]],.0041,lineM);
    box(r,a,1.767,.480,.014,.012,.027,m.pale,.002);
  }
  return {rack:r,amber,telemetry};
}

function displayArm(T,s,m,g,x,y,z,shift){
  const {box,cyl,cable}=s;
  cyl(g,x,y+.014,z,.078,.025,m.matte);cyl(g,x,y+.190,z,.023,.35,m.aluminum);
  box(g,x,y+.105,z,.057,.050,.062,m.frame,.010);
  const j1=[x,y+.32,z],j2=[x+shift*.57,y+.42,z-.006],j3=[x+shift,y+.49,z+.06];
  for(const [a,b] of [[j1,j2],[j2,j3]]){
    const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A);
    const mid=A.clone().add(B).multiplyScalar(.5);
    const link=box(g,mid.x,mid.y,mid.z,.036,d.length(),.060,m.aluminum,.008);
    link.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());
    cyl(g,...a,.029,.054,m.matte,'z');
  }
  cyl(g,...j3,.033,.068,m.frame,'z');
  cable(g,[[x,y+.023,z-.019],[x-.031,y+.24,z-.026],[x+.019,y+.315,z-.04],[x+shift*.57,y+.392,z-.045],[x+shift,y+.455,z+.022]],.0063,m.rubber);
}

function observerBay(T,s,m,root){
  const {box,group,cyl,face,cable}=s;
  fixtureRoom(T,s,m,root,false);
  for(const [x,yaw] of [[-2.69,.08],[-1.99,.04],[-1.27,0],[-.56,-.02],[.16,0],[.87,.025],[1.58,-.018],[2.30,-.08]])rackUnit(T,s,m,root,x,-2.62,yaw,false);
  const node=rackUnit(T,s,m,root,1.47,-.862,-.13,true);
  const desk=group(root,-.22,0,-.04,'Operations desk');
  contact(T,s,desk,0,.004,0,2.90,1.42);contact(T,s,root,1.47,.004,-.862,1.03,1.30);
  box(desk,0,.888,.031,2.60,.074,.940,m.wood,.018);
  box(desk,0,.851,.032,2.50,.016,.869,m.matte,.005);
  for(const x of [-1.074,1.074]){
    box(desk,x,.82,-.047,.067,.050,.68,m.matte,.007);
    box(desk,x,.477,-.032,.074,.66,.088,m.matte,.007);
    box(desk,x,.200,-.032,.065,.245,.079,m.steel,.0045);
    box(desk,x,.067,-.030,.109,.048,.65,m.matte,.010);
    for(const z of [-.259,.200])cyl(desk,x,.032,z,.028,.045,m.rubber);
  }
  box(desk,0,.744,-.286,2.13,.115,.065,m.matte,.009);
  box(desk,0,.795,-.291,1.42,.089,.130,m.frame,.012);
  const panel=box(desk,-.968,.845,.437,.187,.041,.054,m.frame,.009);panel.rotation.x=.14;
  const screenA=drawCanvas(T,960,545,'APM and NPM aligned timeline',liveDisplay);
  const screenB=drawCanvas(T,800,457,'Service-level trace evidence',drillDisplay);
  const panelA=housing(T,s,m,desk,1.146,.658,screenA,-.339,1.425,-.129,.07,-.038);
  const panelB=housing(T,s,m,desk,.834,.483,screenB,.691,1.347,.003,-.258,-.044);
  displayArm(T,s,m,desk,-.408,.928,-.271,.072);
  displayArm(T,s,m,desk,.497,.928,-.22,.19);
  box(desk,-.15,.932,.189,.871,.010,.355,m.cloth,.0035);
  const keyboard=flatKeyboard(T,s,m,desk,-.223,.945,.182,.513);
  keyboard.rotation.y=-.054;
  const pointer=group(desk,.273,.954,.237,'Operator mouse');pointer.userData.dynamic=true;
  const ellipsoid=new T.SphereGeometry(1,26,16);
  const mouse=new T.Mesh(ellipsoid,m.mouse);mouse.scale.set(.034,.020,.053);mouse.castShadow=mouse.receiveShadow=true;mouse.position.y=.011;pointer.add(mouse);
  box(pointer,0,.029,-.016,.002,.003,.033,m.slot,.0006);
  const wheel=cyl(pointer,0,.030,-.018,.007,.009,m.rubber,'x',14);
  cable(desk,[[-.472,.955,.13],[-.57,.94,.07],[-.679,.94,-.08],[-.684,.94,-.36],[-.701,.82,-.439]],.0039,m.rubber);
  for(const x of [-.68,.46])cyl(desk,x,.932,-.327,.032,.009,m.matte);
  const phone=group(desk,-1.022,.937,.091,'Operations handset');phone.rotation.y=.23;
  box(phone,0,.023,0,.172,.042,.206,m.frame,.013);
  const pad=group(phone,.025,.051,-.005);pad.rotation.x=-.26;
  box(pad,0,.008,-.028,.069,.009,.049,m.glass,.003);
  for(let j=0;j<3;j++)for(let i=0;i<3;i++)box(pad,-.023+i*.022,.007,.016+j*.016,.015,.007,.009,m.body,.0018);
  box(phone,-.052,.066,-.006,.037,.028,.164,m.rubber,.012);
  for(const z of [-.074,.071])box(phone,-.052,.061,z,.047,.044,.042,m.body,.012);
  // A recessed side PDU and a cable snake give the rack a physical connection to the desk.
  cable(root,[[1.24,.12,-.90],[1.13,.05,-.74],[1.05,.055,-.65],[.944,.072,-.53],[.894,.195,-.45],[.843,.656,-.42],[.57,.828,-.40]],.014,m.rubber);
  const recorder=group(desk,-.808,.936,-.196,'KVM source selector');
  box(recorder,0,.040,0,.281,.076,.137,m.matte,.009);
  for(let i=0;i<5;i++){
    cyl(recorder,-.096+i*.044,.041,.070,.007,.004,m.steel,'z',14);
    cyl(recorder,-.096+i*.044,.060,.072,.0024,.0018,i===1?m.ok:m.black,'z',8);
  }
  const update=(p)=>{
    const aligned=p>=.32,selected=p>=.785;
    const scan=Math.round(ease(.32,.59,p)*19),click=Math.round(ease(.63,.78,p)*19);
    screenA.render(aligned?20+scan:0);screenB.render(selected?59:p>=.63?20+click:0);
    node.amber.material=p<.12?m.ok:m.standby;
    node.telemetry.render(p>=.12?1:0);
    const movement=ease(.61,.76,p)-.28*ease(.81,.92,p);
    pointer.position.x=.273+.031*movement;pointer.position.z=.237-.018*movement;
    pointer.rotation.y=-.10*movement;wheel.rotation.x=(p>=.785&&p<.813)?.1:0;
  };
  update(0);
  return {anchors:[new T.Vector3(1.385,1.525,-.401),new T.Vector3(-.558,1.425,-.150),new T.Vector3(.473,1.350,-.009)],equipment:[node.rack,desk],update};
}

/** A locally lit office scene. The host renderer supplies the camera and scene lights. */
export function buildIndustryB(T,id){
  if(id!=='print'&&id!=='observer')throw new RangeError('Unknown industry vignette '+id);
  if(!caches.has(T))caches.set(T,workshop(T));
  const s=caches.get(T),m=surfaces(T,s,id),group=new T.Group();group.name=id==='print'?'ZiewPrint secure release':'ZiewObserver incident';
  const scene=id==='print'?printBay(T,s,m,group):observerBay(T,s,m,group);
  return {group,anchors:scene.anchors,equipment:scene.equipment,update:p=>scene.update(clamp(Number.isFinite(p)?p:0)),ready:Promise.all(m.ready)};
}
