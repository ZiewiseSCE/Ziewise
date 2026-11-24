/* Metre-scale industrial equipment. The walk aisle is on local +Z. */
const libraries = new WeakMap();
const turn = Math.PI * 2;
const bound = x => Math.min(1, Math.max(0, x));
const ease = (start, end, value) => {
  const t = bound((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

function makeLibrary(T) {
  const geometryCache = new Map(), displayCache = new Map();
  const geometries = (name, fn) => {
    if (!geometryCache.has(name)) geometryCache.set(name, fn());
    return geometryCache.get(name);
  };
  const finish = (name, color, metalness, roughness, emissive = 0, intensity = 0) => {
    const material = new T.MeshStandardMaterial({ name, color, metalness, roughness, emissive, emissiveIntensity: intensity });
    return material;
  };
  const m = {
    aluminum: finish('satin anodized aluminum', 0xafb9ba, .76, .33),
    steel: finish('brushed stainless steel', 0xc1c9c8, .87, .26),
    turn: finish('turned steel highlight', 0xd6d9d2, .9, .19),
    machining: finish('fine tool marks', 0x7e8a89, .75, .41),
    zinc: finish('zinc plated hardware', 0x95a4a4, .77, .37),
    iron: finish('gray cast iron', 0x50615f, .65, .52),
    ink: finish('graphite powder coat', 0x30403d, .54, .43),
    graphite: finish('anthracite enclosure', 0x202c2c, .37, .48),
    black: finish('dark anodized optics', 0x172220, .54, .34),
    rubber: finish('matte black rubber', 0x242b2a, .04, .83),
    inset: finish('vent recess', 0x101716, .13, .8),
    cream: finish('warm gray enamel', 0xb6bdb4, .32, .42),
    orange: finish('industrial amber enamel', 0xe78221, .39, .34),
    yellow: finish('safety yellow coating', 0xe7ad2a, .21, .43),
    teal: finish('petrol pump enamel', 0x35675c, .55, .43),
    copper: finish('bronze ferrule', 0x9f7a48, .72, .36),
    carton: finish('kraft board outer', 0xad855a, .01, .93),
    paper: finish('kraft fold edge', 0xc59e6a, .01, .95),
    label: finish('inventory label', 0xd9ded0, .02, .79),
    blue: finish('navy workwear', 0x30414a, .025, .86),
    cloth: finish('slate workwear', 0x66736e, .015, .89),
    skin: finish('warm skin', 0xa77860, 0, .76),
    vest: finish('hi-vis yellow fabric', 0xbbc64d, .04, .76),
    print: finish('matte pavement marking', 0xcca344, .025, .88),
    glass: new T.MeshStandardMaterial({name:'tinted inspection window',color:0xa4c3b8,metalness:.11,roughness:.25,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false}),
    optic: finish('coated lens', 0x1c474c, .77, .14, 0x14383c, .17),
    red: finish('stop switch', 0x9b3328, .12, .4),
    amber: finish('amber signal lens', 0xdf9838, .11, .28, 0xf29824, .76),
    green: finish('green signal lens', 0x9dbd6f, .1, .32, 0x9bdd5d, .72),
    lamp: finish('white inspection emitter', 0xf0f2dc, .09, .24, 0xe5f7ee, 1.10)
  };
  // A restrained roughness grain gives ample surfaces a finish even when the
  // scene is lit by a soft environment map. No external texture is required.
  if (T.DataTexture) {
    const w = 64, h = 64, px = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = 4 * (y * w + x);
      const value = 214 + Math.round(22 * Math.sin(y * 4.7) + 6 * Math.sin(x * .93 + y * 1.7));
      px[k] = px[k+1] = px[k+2] = value; px[k+3] = 255;
    }
    const grain = new T.DataTexture(px,w,h);
    grain.wrapS = grain.wrapT = T.RepeatWrapping; grain.repeat.set(3,3);
    grain.magFilter = T.LinearFilter; grain.minFilter = T.LinearFilter; grain.needsUpdate = true;
    for (const key of ['aluminum','steel','turn','zinc','iron']) m[key].roughnessMap = grain;
  }
  // Concentric tool paths have direction-dependent highlights. The face uses
  // the actual drilled outline below, with UVs centred on the lathe axis.
  const lathePixels = new Uint8Array(384*384*4);
  for(let y=0;y<384;y++)for(let x=0;x<384;x++){
    const dx=(x-191.5)/191.5,dy=(y-191.5)/191.5,rad=Math.hypot(dx,dy),angle=Math.atan2(dy,dx);
    const directional=30*Math.cos(2*angle-.55)+12*Math.cos(4*angle+.35);
    const grooves=5*Math.sin(rad*860)+4*Math.sin(rad*1140+angle*.35)+3*Math.sin(rad*193);
    const value=Math.max(80,Math.min(248,177+directional+grooves+8*Math.sin(rad*8.4)));
    const i=(y*384+x)*4;lathePixels[i]=value;lathePixels[i+1]=Math.min(255,value+3);lathePixels[i+2]=Math.min(255,value+1);lathePixels[i+3]=255;
  }
  const latheMap=new T.DataTexture(lathePixels,384,384);latheMap.colorSpace=T.SRGBColorSpace;
  latheMap.generateMipmaps=true;latheMap.minFilter=T.LinearMipmapLinearFilter;latheMap.magFilter=T.LinearFilter;latheMap.anisotropy=3;latheMap.needsUpdate=true;
  m.turnedFace=new T.MeshStandardMaterial({name:'radially tooled stainless face',map:latheMap,metalness:.72,roughness:.28,envMapIntensity:1.24});
  function group(parent, x=0, y=0, z=0, name='') {
    const node = new T.Group(); node.position.set(x,y,z); node.name = name; parent.add(node); return node;
  }
  function mesh(parent, geom, material, x=0, y=0, z=0, name='') {
    const mat = typeof material === 'string' ? m[material] : material;
    const node = new T.Mesh(geom,mat); node.position.set(x,y,z); node.name=name;
    node.castShadow = !mat.transparent && !mat.isMeshBasicMaterial;
    node.receiveShadow = !mat.isMeshBasicMaterial; parent.add(node); return node;
  }
  function box(parent,x,y,z,w,h,d,mat,name='') {
    const node = mesh(parent,geometries('unit-box',()=>new T.BoxGeometry(1,1,1)),mat,x,y,z,name);
    node.scale.set(w,h,d); return node;
  }
  // An octagonal extrusion keeps exposed enclosure edges and robot castings
  // bevelled without the triangle cost of applying a modifier to every bolt.
  function housing(parent,x,y,z,w,h,d,mat,chamfer=.08,name='') {
    const geom=geometries('casting-'+chamfer,()=>{
      const c=chamfer,s=new T.Shape();
      const p=[[-.5+c,-.5],[.5-c,-.5],[.5,-.5+c],[.5,.5-c],[.5-c,.5],[-.5+c,.5],[-.5,.5-c],[-.5,-.5+c]];
      s.moveTo(...p[0]);for(let i=1;i<p.length;i++)s.lineTo(...p[i]);s.closePath();
      const g=new T.ExtrudeGeometry(s,{depth:.965,bevelEnabled:true,bevelSize:.013,bevelThickness:.0175,bevelSegments:1,curveSegments:1});
      g.translate(0,0,-.4825);return g;
    });
    const node=mesh(parent,geom,mat,x,y,z,name);node.scale.set(w,h,d);return node;
  }
  function axisTo(node,axis) {
    if (axis==='x')node.rotation.z=-Math.PI/2;
    if (axis==='z')node.rotation.x=Math.PI/2;
    return node;
  }
  function cyl(parent,x,y,z,r,h,mat,axis='y',segments=28,top=r) {
    const ratio=top/r;
    const g=geometries('c-'+segments+'-'+ratio.toFixed(4),()=>new T.CylinderGeometry(ratio,1,1,segments));
    const node=mesh(parent,g,mat,x,y,z);node.scale.set(r,h,r);return axisTo(node,axis);
  }
  function ring(parent,x,y,z,r,thick,mat,axis='z',segments=44) {
    const ratio=thick/r;
    const g=geometries('t-'+segments+'-'+ratio.toFixed(4),()=>new T.TorusGeometry(1,ratio,6,segments));
    const node=mesh(parent,g,mat,x,y,z); node.scale.setScalar(r);
    if(axis==='y')node.rotation.x=-Math.PI/2; else if(axis==='x')node.rotation.y=Math.PI/2;
    return node;
  }
  function ball(parent,x,y,z,w,h,d,mat) {
    const g=geometries('ball',()=>new T.SphereGeometry(1,16,12));
    const node=mesh(parent,g,mat,x,y,z);node.scale.set(w,h,d);return node;
  }
  function bar(parent,a,b,width,mat,square=false,depth=width) {
    const v=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
    const x=(a[0]+b[0])/2,y=(a[1]+b[1])/2,z=(a[2]+b[2])/2;
    const node=square?housing(parent,x,y,z,width,v.length(),depth,mat,.08):cyl(parent,x,y,z,width,v.length(),mat,'y',16);
    node.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());
    return node;
  }
  function hose(parent,points,r,mat='rubber',smooth=.5) {
    const curve=new T.CatmullRomCurve3(points.map(q=>new T.Vector3(...q)),false,'catmullrom',smooth);
    return mesh(parent,new T.TubeGeometry(curve,Math.max(12,points.length*4),r,8,false),mat);
  }
  function plane(parent,x,y,z,w,h,mat) {
    const node=mesh(parent,geometries('unit-plane',()=>new T.PlaneGeometry(1,1)),mat,x,y,z);
    node.scale.set(w,h,1);node.castShadow=false;return node;
  }
  function dynamic(node) { node.userData.dynamic=true;return node; }
  function cartridge(parent,x,y,z,mat='green',axis='z') {
    cyl(parent,x,y,z,.041,.039,'black',axis,20);
    return cyl(parent,x+(axis==='x'?.021:0),y+(axis==='y'?.021:0),z+(axis==='z'?.021:0),.031,.013,mat,axis,20);
  }
  function screws(parent,x,y,z,w,h,mat='zinc',r=.014) {
    for (const sx of [-1,1])for(const sy of [-1,1])cyl(parent,x+sx*w/2,y+sy*h/2,z,r,.012,mat,'z',6);
  }
  function pedestal(parent,x,z,height=.86,w=.69,d=.64) {
    housing(parent,x,.055,z,w,.085,d,'ink',.10);
    housing(parent,x,height/2+.045,z,w*.62,height-.075,d*.66,'graphite',.08);
    for(const sx of [-1,1])for(const sz of [-1,1])cyl(parent,x+sx*w*.36,.105,z+sz*d*.34,.03,.03,'zinc','y',6);
    box(parent,x,height,z,w*.89,.06,d*.88,'aluminum');
  }
  function floorFoot(parent,x,z,yTop=.90) {
    cyl(parent,x,.024,z,.073,.044,'rubber');cyl(parent,x,.070,z,.027,.09,'zinc');
    box(parent,x,(yTop+.108)/2,z,.071,yTop-.108,.071,'aluminum');
    box(parent,x,(yTop+.108)/2,z+.036,.019,yTop-.13,.004,'inset');
  }
  function table(parent,x,z,w,d,y=.90) {
    for(const a of [-1,1])for(const b of [-1,1])floorFoot(parent,x+a*(w/2-.112),z+b*(d/2-.095),y-.07);
    for(const a of [-1,1])box(parent,x,.27,z+a*(d/2-.09),w-.19,.045,.044,'iron');
    for(const a of [-1,1])box(parent,x+a*(w/2-.112),.27,z,.042,.045,d-.19,'iron');
    housing(parent,x,y-.055,z,w,.11,d,'ink',.035);
    box(parent,x,y+.010,z,w-.015,.027,d-.012,'iron');
  }
  function deck(parent,x,z,w,d,y=.92) {
    for (const a of [-1,1])for(const b of [-1,1])floorFoot(parent,x+a*(w/2-.23),z+b*(d/2-.07),y-.12);
    for(const s of [-1,1]){
      housing(parent,x,y-.079,z+s*(d/2-.022),w,.19,.065,'aluminum',.06);
      box(parent,x,y-.079,z+s*(d/2+.014),w-.12,.018,.003,'inset');
    }
    for(let i=0;i<12;i++){
      const rx=x-w*.455+i*w*.91/11;
      cyl(parent,rx,y-.036,z,.047,d-.075,'steel','z',16);
      if(i%3===0)cyl(parent,rx,y-.036,z+d*.50+.018,.017,.016,'iron','z',6);
    }
    box(parent,x,y+.004,z,w*.87,.019,d*.57,'rubber');
    housing(parent,x+w*.34,y-.20,z-d*.39,.28,.15,.22,'graphite');
  }
  function drawSurface(kind,c,w,h) {
    c.fillStyle=kind==='dial'?'#e1dfc8':'#152323';c.fillRect(0,0,w,h);
    if(kind==='maker'){
      c.fillStyle='#c2c9bd';c.fillRect(0,0,w,h);c.strokeStyle='#56615a';c.lineWidth=5;c.strokeRect(w*.025,h*.045,w*.95,h*.91);
      c.fillStyle='#283833';c.font='bold '+Math.round(h*.25)+'px sans-serif';c.fillText('ROBOT CELL',w*.075,h*.43);
      c.font='bold '+Math.round(h*.13)+'px monospace';c.fillText('OPTICAL INSPECTION',w*.075,h*.68);
      for(let j=0;j<26;j++){const width=j%5===0?5:j%3===0?3:2;c.fillRect(w*.078+j*w*.030,h*.77,width,h*.085);}
      return;
    }
    if(kind==='dial'){
      const cx=w/2,cy=h/2,R=w*.43;
      c.strokeStyle='#33423e';c.fillStyle='#34423e';c.lineWidth=2;
      for(let i=0;i<=32;i++){
        const a=Math.PI*(.78+i*1.44/32),len=i%4===0?R*.12:R*.06;
        c.beginPath();c.moveTo(cx+Math.cos(a)*(R-len),cy+Math.sin(a)*(R-len));c.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);c.stroke();
        if(i%8===0){c.font='bold '+Math.round(w*.08)+'px sans-serif';c.textAlign='center';c.fillText(String(i/4),cx+Math.cos(a)*R*.73,cy+Math.sin(a)*R*.73+w*.025);}
      }
      c.font='bold '+Math.round(w*.08)+'px sans-serif';c.textAlign='center';c.fillText('bar',cx,cy+h*.23);return;
    }
    c.fillStyle='#233c39';c.fillRect(0,0,w,h*.16);c.fillStyle='#d7e8d9';
    c.font='bold '+Math.floor(h*.075)+'px monospace';c.fillText(({mes:'MES  /  LOT TRACK',dcs:'DCS  /  PROCESS TREND',optics:'VISION  /  INSPECT',review:'EDGE  /  REVIEW',count:'PACK  /  COUNT'})[kind]||'CONTROL',w*.045,h*.105);
    if(kind==='dcs'){
      c.strokeStyle='#435854';c.lineWidth=1;
      for(let j=1;j<6;j++){c.beginPath();c.moveTo(w*.07,h*(.18+j*.105));c.lineTo(w*.94,h*(.18+j*.105));c.stroke();}
      for(let j=0;j<10;j++){c.beginPath();c.moveTo(w*(.07+j*.097),h*.22);c.lineTo(w*(.07+j*.097),h*.82);c.stroke();}
      for(let k=0;k<2;k++){
        c.strokeStyle=k?'#ecb269':'#a7d5b5';c.lineWidth=4;c.beginPath();
        for(let q=0;q<=84;q++){const f=q/84;const py=(k?.57:.48)-.035*Math.sin(29*f)-.018*Math.sin(70*f)-(k?0:.22*Math.exp(-Math.pow((f-.70)*9,2)));const px=w*(.07+.87*f);if(q)c.lineTo(px,h*py);else c.moveTo(px,h*py);}c.stroke();
      }
      c.font='bold '+Math.floor(h*.072)+'px monospace';c.fillStyle='#9bcdb5';c.fillText('PV  PRESSURE',w*.07,h*.91);c.fillStyle='#e2ac66';c.fillText('SP  SETPOINT',w*.59,h*.91);
    } else if(kind==='mes'){
      c.textAlign='left';
      ['WO-0214   FLANGE / A','LOT 18A   CELL 04','LOT 18B   CELL 04','LOT 19A   CELL 05'].forEach((text,i)=>{
        const y=h*(.23+i*.168);c.fillStyle=i===1?'#48634f':'#273735';c.fillRect(w*.047,y,w*.908,h*.127);
        c.fillStyle=i===1?'#e2eab9':'#bfccc3';c.font='bold '+Math.round(h*.067)+'px monospace';c.fillText(text,w*.075,y+h*.087);
      });
    } else if(kind==='count'){
      c.font='bold '+Math.round(h*.38)+'px monospace';c.fillStyle='#e0c988';c.fillText('50',w*.10,h*.69);
      c.font='bold '+Math.round(h*.09)+'px monospace';c.fillStyle='#b8c8be';c.fillText('TARGET / EA',w*.09,h*.88);
      for(let i=0;i<25;i++){c.fillStyle=i===18?'#d19d59':'#729884';c.fillRect(w*(.48+(i%5)*.087),h*(.28+Math.floor(i/5)*.116),w*.05,h*.066);}
    } else {
      const cx=w*.34,cy=h*.56,r=h*.33;
      const g=c.createRadialGradient(cx-r*.45,cy-r*.35,r*.12,cx,cy,r);g.addColorStop(0,'#c4d1c7');g.addColorStop(.45,'#9faea9');g.addColorStop(1,'#6e807c');
      c.fillStyle=g;c.beginPath();c.arc(cx,cy,r,0,turn);c.fill();c.fillStyle='#1c2928';c.beginPath();c.arc(cx,cy,r*.32,0,turn);c.fill();
      for(let i=0;i<6;i++){const a=i*turn/6;c.beginPath();c.arc(cx+r*.73*Math.cos(a),cy+r*.73*Math.sin(a),r*.084,0,turn);c.fill();}
      c.strokeStyle='#dfad70';c.lineWidth=3;c.strokeRect(cx+r*.30,cy-r*.22,r*.48,r*.28);
      c.fillStyle='#b5c4b8';c.font='bold '+Math.round(h*.057)+'px monospace';c.fillText('PART  F-06',w*.65,h*.39);c.fillText('LOT   18B',w*.65,h*.53);
      c.fillStyle='#d4b981';c.fillRect(w*.65,h*.64,w*.25,h*.07);c.fillStyle='#83a38b';c.fillRect(w*.65,h*.78,w*.17,h*.05);
    }
  }
  function display(kind) {
    if(displayCache.has(kind))return displayCache.get(kind);
    const isDial=kind==='dial',w=isDial?192:384,h=isDial?192:208;
    let canvas=null;
    if(typeof OffscreenCanvas==='function')canvas=new OffscreenCanvas(w,h);
    else if(typeof document!=='undefined'){canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;}
    let map=null;
    if(canvas){const c=canvas.getContext('2d');if(c){drawSurface(kind,c,w,h);map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=2;}}
    const mat=new T.MeshBasicMaterial({name:'printed instrument '+kind,color:map?0xffffff:isDial?0xd4d7c7:0x577a6b,map,toneMapped:false});
    displayCache.set(kind,mat);return mat;
  }
  function monitor(parent,x,y,z,w,h,kind,tilt=0) {
    const g=group(parent,x,y,z,'sealed '+kind+' monitor');g.rotation.y=tilt;
    housing(g,0,0,0,w,h,.113,'graphite',.055);
    box(g,0,.012,.062,w*.935,h*.838,.014,'black');
    plane(g,0,.012,.072,w*.905,h*.789,display(kind));
    screws(g,0,0,.067,w*.934,h*.888,'zinc',.009);
    box(g,w*.375,-h*.455,.064,.031,.008,.01,'green');
    for(let i=0;i<5;i++)box(g,-w*.30+i*.039,-h*.458,.063,.022,.008,.008,'machining');
    return g;
  }
  function gauge(parent,x,y,z,r=.13) {
    cyl(parent,x,y,z,r,.077,'steel','z',36);
    const face=mesh(parent,geometries('dial-face',()=>new T.CircleGeometry(1,48)),display('dial'),x,y,z+.041);
    face.scale.setScalar(r*.92);face.castShadow=false;
    ring(parent,x,y,z+.046,r*.955,r*.057,'turn','z',44);
    const pivot=dynamic(group(parent,x,y,z+.050,'gauge needle'));
    const needle=box(pivot,0,r*.29,0,r*.044,r*.76,.006,'red');needle.castShadow=false;
    cyl(parent,x,y,z+.056,r*.066,.016,'black','z',16);
    return pivot;
  }
  function flange(parent,x,y,z,r=.39,withFlaw=true) {
    const g=group(parent,x,y,z,'machined six-hole steel flange');g.scale.setScalar(r);
    function outline(){
      const s=new T.Shape();s.absarc(0,0,1,0,turn,false);
      const opening=(cx,cy,radius)=>{const hole=new T.Path();hole.absarc(cx,cy,radius,0,turn,true);s.holes.push(hole);};
      opening(0,0,.345);
      for(let i=0;i<6;i++){const a=turn*i/6+Math.PI/6;opening(Math.cos(a)*.732,Math.sin(a)*.732,.082);}
      return s;
    }
    const shape=geometries('machined-flange',()=>{
      const geo=new T.ExtrudeGeometry(outline(),{depth:.263,curveSegments:28,bevelEnabled:true,bevelThickness:.016,bevelSize:.012,bevelSegments:2});
      geo.rotateX(-Math.PI/2);return geo;
    });
    mesh(g,shape,'steel');
    const face=geometries('radial-face-of-flange',()=>{
      const geom=new T.ShapeGeometry(outline(),28),pos=geom.getAttribute('position'),uv=geom.getAttribute('uv');
      for(let i=0;i<pos.count;i++)uv.setXY(i,pos.getX(i)*.5+.5,pos.getY(i)*.5+.5);
      geom.rotateX(-Math.PI/2);return geom;
    });
    mesh(g,face,'turnedFace',0,.2805,0);
    ring(g,0,.034,0,.997,.009,'turn','y',80);
    ring(g,0,.253,0,.999,.007,'turn','y',80);
    for(const rr of [.405,.513,.89,.974]){
      const geo=geometries('toolmark'+rr,()=>new T.RingGeometry(rr-.004,rr+.004,88));
      const mark=mesh(g,geo,'machining',0,.2812,0);mark.rotation.x=-Math.PI/2;mark.castShadow=false;
    }
    if(withFlaw){
      bar(g,[.11,.284,.56],[.20,.285,.80],.008,'iron');
      bar(g,[.20,.285,.80],[.24,.285,.87],.005,'iron');
    }
    return g;
  }
  function lampStack(parent,x,y,z) {
    cyl(parent,x,y+.075,z,.042,.15,'aluminum');
    cyl(parent,x,y+.188,z,.092,.07,'black');
    const amber=cyl(parent,x,y+.267,z,.078,.10,'amber');
    cyl(parent,x,y+.330,z,.082,.024,'black');
    const green=cyl(parent,x,y+.396,z,.078,.105,'green');
    cyl(parent,x,y+.47,z,.084,.039,'black');
    dynamic(amber);dynamic(green);
    return function set(good){
      amber.material=good?m.iron:m.amber;green.material=good?m.green:m.iron;
    };
  }
  const L={m,group,mesh,box,housing,cyl,ring,ball,bar,hose,plane,display,dynamic,cartridge,screws,pedestal,floorFoot,table,deck,monitor,gauge,flange,lampStack};
  libraries.set(T,L);return L;
}

function designStation(L,root) {
  const {box,cyl,ring,bar,hose,group,housing,deck,pedestal,flange,monitor,dynamic,ball,screws}=L;
  deck(root,-.41,.49,2.72,.9,.92);
  flange(root,-.43,.943,.48,.415);
  flange(root,-1.41,.943,.46,.203,false);
  pedestal(root,-1.41,-.49,1.12,.43,.40);
  cyl(root,-1.41,1.31,-.50,.055,.38,'ink');
  monitor(root,-1.40,1.64,-.46,.88,.53,'optics',.13);
  hose(root,[[-1.40,1.51,-.55],[-1.54,1.26,-.64],[-1.45,.98,-.60]],.017);
  // J1 rotating base, J2 shoulder and J3 elbow. The orange cast links follow
  // the pin centres. The camera/tool sits on the J4–J6 wrist, over the flange.
  const base=group(root,.89,0,-.79,'robot mount');
  housing(base,0,.068,0,.9,.13,.78,'ink',.08);
  for(const x of [-.34,.34])for(const z of [-.28,.28])cyl(base,x,.149,z,.038,.046,'zinc','y',6);
  cyl(base,0,.265,0,.327,.30,'orange','y',36,.283);
  cyl(base,0,.406,0,.281,.060,'iron','y',36);
  cyl(base,0,.458,0,.270,.070,'orange','y',36);
  housing(base,.013,.66,0,.46,.38,.39,'orange',.18);
  cyl(base,0,.855,0,.199,.46,'orange','z',40);
  cyl(base,0,.855,.235,.167,.030,'black','z',32);
  cyl(base,0,.855,.258,.107,.030,'zinc','z',24);
  for(let i=0;i<6;i++){const a=i*turn/6;cyl(base,.136*Math.cos(a),.855+.136*Math.sin(a),.254,.012,.014,'zinc','z',6);}
  const sh=dynamic(group(base,0,.855,0,'shoulder and lower arm'));
  bar(sh,[0,.02,0],[.47,1.15,-.06],.285,'orange',true,.27);
  bar(sh,[-.065,.17,.10],[.40,1.12,.06],.052,'orange');
  bar(sh,[.136,.21,-.13],[.49,.99,-.13],.035,'zinc');
  hose(sh,[[-.02,.08,-.19],[-.11,.40,-.23],[.22,.89,-.22],[.37,1.13,-.16]],.036);
  const el=group(sh,.47,1.15,-.06,'elbow and upper arm');
  cyl(el,0,0,0,.191,.37,'orange','z',38);
  cyl(el,0,0,.205,.152,.061,'ink','z',32);
  cyl(el,0,0,.244,.085,.025,'aluminum','z',24);
  for(let i=0;i<6;i++){const a=i*turn/6;cyl(el,.119*Math.cos(a),.119*Math.sin(a),.242,.012,.014,'zinc','z',6);}
  bar(el,[-.015,.003,0],[-1.25,.136,.41],.248,'orange',true,.235);
  const plate=group(el,-.65,.071,.337,'optical cell identification plate');
  plate.rotation.y=.29;plate.rotation.z=-.075;
  housing(plate,0,0,0,.326,.112,.012,'black',.05);
  L.plane(plate,0,0,.008,.301,.095,L.display('maker'));
  bar(el,[-.21,.083,-.005],[-1.14,.16,.31],.041,'iron');
  hose(el,[[.12,-.025,-.04],[.10,.235,-.04],[-.32,.258,.06],[-.85,.216,.25],[-1.25,.144,.39]],.038);
  const wrist=group(el,-1.25,.136,.41,'three-axis wrist');
  ball(wrist,0,0,0,.14,.14,.145,'orange');
  cyl(wrist,0,0,.137,.108,.056,'black','z');
  bar(wrist,[-.024,-.032,.021],[-.36,-.28,.36],.141,'orange',true,.155);
  cyl(wrist,-.366,-.29,.365,.099,.18,'iron','z');
  const tool=group(wrist,-.37,-.30,.37,'optical end effector');
  housing(tool,-.02,-.11,.025,.213,.211,.170,'black');
  cyl(tool,-.020,-.25,.029,.079,.13,'iron');
  for(const dy of [-.224,-.254,-.284])cyl(tool,-.020,dy,.029,.080,.009,'black','y',28);
  ring(tool,-.020,-.322,.029,.057,.013,'lamp','y',28);
  cyl(tool,-.02,-.320,.029,.038,.009,'optic');
  hose(wrist,[[-.04,.10,.05],[-.22,.085,.20],[-.43,-.09,.36],[-.39,-.28,.38]],.02);
  // Physical three-button teach pendant on the side of the belt.
  housing(root,.62,.86,.965,.31,.16,.079,'yellow',.09);
  cyl(root,.56,.86,1.015,.038,.035,'red','z');
  screws(root,.62,.86,1.006,.265,.119,'zinc',.009);
  return {
    points:[[-.52,1.063,.64],[-.22,1.61,-.02],[-1.39,1.65,-.38]],
    update(p){
      const approach=ease(.03,.52,p),returning=ease(.71,.99,p);
      sh.rotation.z=.045-.076*approach+.034*returning;
      el.rotation.z=-.017+.047*approach-.029*returning;
      wrist.rotation.x=.075*approach-.049*returning;
    }
  };
}

function systemsStation(L,root) {
  const {box,cyl,ring,housing,bar,hose,monitor,gauge,group,dynamic,table,cartridge,screws}=L;
  table(root,-.12,-.015,3.25,1.20,.93);
  for(const x of [-.84,.44]){
    housing(root,x,1.01,-.225,.47,.064,.34,'graphite');
    bar(root,[x,1.02,-.27],[x,1.45,-.355],.058,'iron');
  }
  monitor(root,-.86,1.64,-.27,1.14,.70,'mes',.13);
  monitor(root,.43,1.64,-.27,1.16,.70,'dcs',-.12);
  // An industrial keyboard and trackball are part of the operator console.
  const keys=group(root,-.75,.96,.32,'industrial keyboard');
  housing(keys,0,.026,0,.73,.057,.248,'graphite',.08);
  for(let row=0;row<3;row++)for(let col=0;col<10;col++)
    box(keys,-.288+col*.064,.060,-.065+row*.061,.046,.015,.037,'iron');
  housing(root,.11,.984,.33,.29,.067,.249,'black',.09);
  L.ball(root,.11,1.03,.32,.059,.026,.058,'machining');
  const bench=group(root,1.13,.955,.31,'supervisor acknowledgement switches');
  housing(bench,0,.049,0,.48,.098,.28,'cream',.06);
  for(let i=0;i<3;i++){cyl(bench,-.14+i*.14,.103,0,.042,.021,'black');cyl(bench,-.14+i*.14,.122,0,.030,.023,i===0?'green':i===1?'yellow':'red');}
  box(root,.89,.51,-.07,.77,.59,.71,'graphite');
  for(let j=0;j<6;j++)box(root,.88,.35+j*.042,.289,.42,.012,.009,'inset');
  // A local pressure transducer and gauge explain the physical signal source.
  const pipe=group(root,1.43,0,-.66,'process instrument');
  cyl(pipe,0,.11,0,.217,.12,'iron');cyl(pipe,0,.84,0,.056,1.38,'steel');
  cyl(pipe,0,.81,0,.096,.059,'zinc','y',24);cyl(pipe,0,1.42,0,.083,.10,'copper','y',6);
  hose(pipe,[[0,1.51,0],[0,1.61,0],[0,1.68,.09]],.027,'steel');
  const needle=gauge(pipe,0,1.78,.10,.153);
  hose(root,[[1.45,.29,-.64],[1.33,.20,-.78],[.88,.23,-.55],[.82,.28,-.38]],.021);
  const cursor=dynamic(group(root,.43,1.64,-.27,'correlated DCS time cursor'));
  cursor.rotation.y=-.12;const indicator=box(cursor,-.39,-.008,.077,.008,.32,.003,'green');
  return {
    points:[[-.89,1.65,-.16],[.46,1.64,-.19],[1.12,1.08,.34]],
    update(p){const v=ease(.22,.66,p);needle.rotation.z=.72-v*1.46+.16*ease(.78,.99,p);indicator.position.x=-.39+.77*ease(0,.93,p);}
  };
}

function visionStation(L,root) {
  const {box,cyl,ring,bar,hose,group,housing,table,flange,monitor,dynamic,cartridge}=L;
  table(root,-.04,.015,3.17,1.62,.86);
  // A granite optical stage inside a metal-profile safety enclosure.
  housing(root,-.30,.934,.04,1.84,.13,1.12,'black',.035);
  for(const x of [-1.02,.47])for(const z of [-.41,.48]) {
    box(root,x,1.56,z,.064,1.27,.064,'aluminum');
    box(root,x,1.56,z+.033,.019,1.2,.003,'iron');
  }
  for(const z of [-.41,.48])box(root,-.275,2.185,z,1.553,.069,.070,'aluminum');
  for(const x of [-1.02,.47])box(root,x,2.185,.035,.070,.069,.953,'aluminum');
  box(root,.47,1.59,.038,.012,1.04,.789,'glass');
  box(root,-.28,1.65,-.407,1.37,.875,.012,'glass');
  for(const z of [-.23,.31]){
    cyl(root,-.29,1.039,z,.037,1.62,'steel','x',20);
    for(const x of [-.995,.42])housing(root,x,1.026,z,.113,.091,.106,'iron');
  }
  const carriage=dynamic(group(root,-.71,1.056,.034,'inspection sample carrier'));
  housing(carriage,0,.025,0,.62,.065,.60,'iron',.045);
  flange(carriage,0,.073,0,.266);
  // Lens axis, focus ring and four grazing LED rails all point at the sample.
  box(root,-.27,2.122,.018,1.42,.073,.10,'graphite');
  housing(root,-.27,1.985,.026,.228,.222,.228,'ink',.08);
  cyl(root,-.27,1.808,.026,.097,.157,'black');
  for(let i=0;i<4;i++)ring(root,-.27,1.745+i*.034,.026,.099,.008,'machining','y',30);
  cyl(root,-.27,1.718,.026,.071,.015,'optic');
  ring(root,-.27,1.667,.026,.135,.034,'black','y',40);
  ring(root,-.27,1.643,.026,.126,.017,'lamp','y',40);
  const grazing=group(root,-.78,1.45,-.07,'angled grazing light');grazing.rotation.z=-.53;
  housing(grazing,0,0,0,.073,.34,.48,'graphite',.06);
  box(grazing,.042,0,0,.008,.265,.415,'lamp');
  hose(root,[[-.28,2.065,-.065],[-.43,2.19,-.15],[-.91,2.13,-.30],[-1.03,1.44,-.42]],.015);
  box(root,1.04,1.18,-.28,.123,.60,.115,'iron');
  monitor(root,1.05,1.68,-.22,.83,.54,'optics',-.14);
  const status=L.lampStack(root,1.28,.91,-.48);
  const slot=group(root,1.04,.91,.354,'inspection reference part');
  housing(slot,0,.025,0,.60,.065,.49,'rubber',.05);flange(slot,0,.064,0,.189,false);
  return {
    points:[[-.73,1.20,.08],[-.26,1.71,.06],[1.06,1.66,-.12]],
    update(p){carriage.position.x=-.71+.44*ease(.04,.45,p)+.13*ease(.78,.98,p);status(p<.40||p>.89);}
  };
}

function operator(L,parent,x,z) {
  const {group,ball,bar,box,cyl,housing}=L,g=group(parent,x,0,z,'walkway operator');
  for(const sign of [-1,1]){
    const stagger=sign*.07;
    housing(g,sign*.122,.071,.071+stagger,.172,.137,.315,'rubber',.14);
    housing(g,sign*.122,.028,.08+stagger,.182,.049,.318,'inset',.13);
    bar(g,[sign*.122,.148,stagger],[sign*.117,.535,stagger*.65],.092,'blue');
    bar(g,[sign*.117,.516,stagger*.65],[sign*.108,.901,-.005],.107,'blue');
    ball(g,sign*.117,.517,.066+stagger*.65,.073,.078,.043,'cloth');
  }
  ball(g,0,.942,-.006,.221,.172,.143,'blue');
  ball(g,0,1.203,-.004,.250,.303,.145,'vest');
  for(const x of [-.107,.107]){
    const band=box(g,x,1.244,.114,.032,.328,.015,'label');band.rotation.z=x>0?-.10:.10;
  }
  box(g,0,1.082,.130,.387,.035,.016,'label');
  for(const sign of [-1,1]){
    const a=[sign*.208,1.382,-.005], b=[sign*.284,1.13,sign*.035+.01], c=[sign*.256,.966,.088+sign*.056];
    ball(g,...a,.093,.094,.091,'cloth');
    bar(g,a,b,.077,'cloth');bar(g,b,c,.062,'cloth');ball(g,...c,.055,.079,.048,'rubber');
  }
  cyl(g,0,1.481,0,.064,.101,'skin');
  ball(g,0,1.602,.005,.111,.139,.101,'skin');
  for(const s of [-1,1]){
    housing(g,s*.042,1.616,.098,.068,.038,.014,'optic',.18);
    bar(g,[s*.07,1.623,.098],[s*.105,1.628,.006],.010,'graphite');
    ball(g,s*.103,1.602,-.005,.023,.034,.025,'skin');
  }
  box(g,0,1.622,.099,.023,.008,.012,'rubber');
  ball(g,0,1.695,0,.125,.076,.118,'cream');
  ball(g,0,1.669,.019,.144,.016,.146,'cream');
  box(g,0,1.758,0,.030,.019,.141,'cream');
  return g;
}

function safetyStation(L,root) {
  const {box,cyl,bar,group,housing,ring,screws,ball,dynamic}=L;
  // Zinc floor plates, fixed crash rails, and a painted pedestrian crossing.
  box(root,-.11,.005,.02,3.69,.010,1.78,'iron');
  for(let i=0;i<6;i++)box(root,-1.49+i*.54,.013,.405,.24,.009,.61,'print');
  box(root,-.10,.014,.083,3.36,.010,.025,'print');
  function bollard(x,z,height=1.02) {
    box(root,x,.036,z,.232,.062,.231,'iron');
    for(const s of [-1,1])cyl(root,x+s*.083,.076,z+.076,.015,.018,'zinc','y',6);
    cyl(root,x,height*.5+.047,z,.069,height,'yellow','y',26);
    for(const ky of [.44,.70])cyl(root,x,ky*height,z,.0705,.071,'rubber','y',26);
    ball(root,x,height+.052,z,.069,.055,.069,'yellow');
  }
  for(const x of [-1.43,1.45])bollard(x,-.34);
  for(const x of [-.76,.83]){
    box(root,x,.035,-.36,.14,.055,.14,'iron');
    cyl(root,x,.47,-.36,.042,.86,'yellow');
    ball(root,x,.90,-.36,.043,.030,.043,'yellow');
  }
  for(const h of [.48,.86])bar(root,[-1.42,h,-.36],[-.76,h,-.36],.036,'yellow');
  for(const h of [.48,.86])bar(root,[.83,h,-.36],[1.44,h,-.36],.036,'yellow');
  const person=dynamic(operator(L,root,-.67,.20));person.rotation.y=.42;
  // Real optical camera on a cantilever bracket, aimed into the shared aisle.
  box(root,-1.54,.043,-1.04,.43,.086,.39,'iron');
  box(root,-1.54,1.30,-1.04,.13,2.52,.13,'aluminum');
  box(root,-1.54,1.28,-.972,.040,2.37,.003,'iron');
  bar(root,[-1.54,2.45,-1.03],[-1.12,2.48,-.67],.055,'ink',true,.055);
  const camera=group(root,-1.09,2.40,-.60,'safety camera');camera.rotation.y=.64;camera.rotation.x=.22;
  housing(camera,0,0,0,.263,.213,.411,'cream',.09);
  box(camera,0,.124,.045,.301,.026,.49,'aluminum');
  cyl(camera,0,0,.212,.082,.026,'black','z');
  cyl(camera,0,0,.233,.051,.017,'optic','z');
  const control=group(root,1.46,0,-.83,'safety verification beacon');
  box(control,0,.053,0,.28,.106,.24,'iron');box(control,0,.63,0,.073,1.16,.074,'aluminum');
  housing(control,0,1.24,0,.34,.46,.20,'cream',.05);
  screws(control,0,1.24,.108,.275,.376,'zinc',.012);
  cyl(control,0,1.24,.13,.061,.061,'yellow','z');cyl(control,0,1.24,.171,.040,.034,'red','z');
  const state=L.lampStack(control,0,1.49,0);
  return {
    points:[[-1.08,2.40,-.38],[.08,1.18,.18],[1.46,1.85,-.81]],
    update(p){person.position.x=-.67+1.21*ease(.06,.85,p);person.position.z=.20-.17*ease(.34,.75,p);state(p<.34||p>.90);}
  };
}

function maintenanceStation(L,root) {
  const {box,cyl,ring,bar,hose,group,housing,gauge,ball,cartridge,dynamic,monitor}=L;
  const pump=group(root,-.08,0,-.12,'coupled centrifugal pump and motor');
  housing(pump,0,.17,.04,3.09,.17,1.25,'ink',.045);
  for(const x of [-1.23,1.23])for(const z of [-.42,.48]){
    cyl(pump,x,.051,z,.104,.102,'rubber');
    cyl(pump,x,.282,z,.039,.045,'zinc','y',6);
  }
  for(const x of [-.99,-.54,.34,.80]){
    const foot=housing(pump,x,.345,.04,.183,.18,.58,'teal',.10);
    for(const z of [-.177,.245])cyl(pump,x,.45,z,.027,.038,'zinc','y',6);
  }
  // A finned electric motor, ventilated end cover, guarded shaft, bolted volute.
  cyl(pump,-.77,.716,.035,.263,.73,'teal','x',40);
  for(let j=0;j<16;j++){
    const a=turn*j/16,y=.716+Math.cos(a)*.271,z=.035+Math.sin(a)*.271;
    const fin=box(pump,-.77,y,z,.66,.050,.023,'teal');fin.rotation.x=a;
  }
  cyl(pump,-1.16,.716,.035,.272,.117,'ink','x',36);
  ring(pump,-1.222,.716,.035,.203,.018,'aluminum','x',40);
  for(let j=0;j<3;j++)ring(pump,-1.225,.716,.035,.052+j*.050,.0065,'iron','x',30);
  for(let j=0;j<6;j++){const a=turn*j/6;bar(pump,[-1.229,.716,.035],[-1.229,.716+.206*Math.cos(a),.035+.206*Math.sin(a)],.006,'iron');}
  housing(pump,-.81,1.015,.036,.34,.194,.282,'graphite',.07);
  hose(pump,[[-.95,1.02,.15],[-1.12,.91,.27],[-1.19,.52,.30],[-1.29,.38,.17]],.024);
  cyl(pump,-.367,.716,.035,.20,.087,'iron','x');
  cyl(pump,-.179,.715,.035,.126,.31,'steel','x');
  housing(pump,-.135,.713,.035,.394,.32,.337,'yellow',.16);
  for(let i=0;i<5;i++)box(pump,-.278+i*.067,.717,.207,.035,.148,.007,'inset');
  cyl(pump,.43,.723,.04,.334,.51,'teal','x',40);
  cyl(pump,.67,.723,.04,.361,.085,'teal','x',44);
  cyl(pump,.43,.75,.208,.322,.233,'teal','z',40);
  cyl(pump,.43,.75,.343,.288,.045,'iron','z',40);
  cyl(pump,.43,.75,.380,.230,.054,'teal','z',40);
  for(let i=0;i<10;i++){const a=turn*i/10;cyl(pump,.43+.262*Math.cos(a),.75+.262*Math.sin(a),.383,.022,.041,'zinc','z',6);}
  const pipeJoin=(x,y,z,axis,r)=>{
    cyl(pump,x,y,z,r,.067,'steel',axis,32);
    for(let i=0;i<6;i++){const a=turn*i/6;
      if(axis==='x')cyl(pump,x+.047,y+r*.78*Math.cos(a),z+r*.78*Math.sin(a),.019,.033,'zinc','x',6);
      else cyl(pump,x+r*.78*Math.cos(a),y+.042,z+r*.78*Math.sin(a),.019,.03,'zinc','y',6);
    }
  };
  cyl(pump,1.07,.723,.035,.116,.74,'steel','x',36);
  pipeJoin(.805,.723,.035,'x',.175);pipeJoin(1.30,.723,.035,'x',.17);
  hose(pump,[[.49,1.024,-.026],[.49,1.35,-.026],[.49,1.57,-.04],[.60,1.68,-.105],[.91,1.68,-.16],[1.38,1.68,-.18]],.098,'steel',.42);
  pipeJoin(.49,1.23,-.026,'y',.147);
  // Handwheel remains stationary: an abnormal trend calls for operator review.
  cyl(pump,.976,1.69,-.155,.134,.18,'iron','x',32);
  cyl(pump,.97,1.85,-.13,.044,.21,'copper');
  ring(pump,.97,1.96,-.13,.153,.018,'red','y',40);
  for(let i=0;i<3;i++){const a=turn*i/3;bar(pump,[.97,1.96,-.13],[.97+Math.cos(a)*.145,1.96,-.13+Math.sin(a)*.145],.012,'red');}
  // Both instruments look toward the visitor, making the pressure difference visible.
  for(const x of [-.20,.50]){
    hose(pump,[[x,.99,.18],[x,1.13,.22],[x,1.27,.28]],.023,'copper');
    cyl(pump,x,1.295,.28,.040,.057,'zinc','y',6);
  }
  const nominal=gauge(pump,-.20,1.446,.28,.147);
  const measured=gauge(pump,.50,1.446,.28,.147);
  const post=group(root,1.52,0,-.67,'inspection work order terminal');
  box(post,0,.04,0,.28,.08,.27,'iron');box(post,0,.75,0,.083,1.45,.081,'aluminum');
  monitor(post,0,1.58,0,.68,.41,'dcs',-.22);
  const flag=dynamic(cartridge(post,.226,1.325,.015,'green'));
  return {
    points:[[-.28,1.45,.22],[.42,1.45,.22],[1.49,1.58,-.57]],
    update(p){nominal.rotation.z=.31;measured.rotation.z=.33-1.19*ease(.18,.67,p)+.11*ease(.84,1,p);flag.material=p>.50?L.m.amber:L.m.green;}
  };
}

function openCarton(L,p,x,y,z,w,h,d) {
  const {box,group}=L,g=group(p,x,y,z,'open double-wall corrugated carton');
  box(g,0,.013,0,w,.026,d,'carton');
  for(const side of [-1,1]){
    box(g,side*w*.5,h*.5,0,.024,h,d,'carton');
    box(g,0,h*.5,side*d*.5,w+.018,h,.025,'carton');
    const ear=group(g,side*w*.50,h,0,'side flap');ear.rotation.z=-side*1.05;
    box(ear,0,w*.13,0,.021,w*.27,d*.97,'paper');
    const flap=group(g,0,h,side*d*.50,'end flap');flap.rotation.x=side*1.25;
    box(flap,0,h*.21,0,w*.97,h*.42,.019,'carton');
    box(g,0,h,side*d*.50,w,.012,.026,'paper');
  }
  box(g,w*.03,h*.56,d*.5+.014,w*.38,h*.34,.0035,'label');
  for(let i=0;i<14;i++){const bw=i%4===0?.011:i%3===0?.008:.004;box(g,-w*.10+i*.013,h*.56,d*.5+.017,bw,h*.188,.002,'black');}
  return g;
}

function countStation(L,root) {
  const {box,cyl,ring,group,housing,bar,hose,table,dynamic,monitor}=L;
  table(root,-.08,.055,3.44,1.52,.86);
  // A real pocketed 5 × 10 tray. Forty-nine fasteners are initially in place.
  const tray=group(root,-.62,.91,.142,'fifty-pocket inspection nest');
  housing(tray,0,0,0,1.55,.078,.865,'aluminum',.045);
  box(tray,0,.044,0,1.47,.018,.787,'graphite');
  const holeX=-.625+7*.14,holeZ=-.28+3*.14;
  function fastener(parent,x,y,z) {
    const pin=group(parent,x,y,z,'machined cap screw');
    cyl(pin,0,.068,0,.029,.118,'steel','y',16);
    cyl(pin,0,.138,0,.043,.043,'zinc','y',6);
    cyl(pin,0,.161,0,.015,.005,'inset','y',6);
    return pin;
  }
  for(let row=0;row<5;row++)for(let col=0;col<10;col++){
    const x=-.625+col*.14,z=-.28+row*.14;
    cyl(tray,x,.056,z,.047,.007,'inset','y',24);
    if(!(row===3&&col===7))fastener(tray,x,.058,z);
  }
  const finalPiece=dynamic(fastener(tray,holeX,.058,holeZ));
  openCarton(L,root,.995,.895,.093,.72,.39,.61);
  // The line-inspection camera traverses the tray on a beltless guide.
  for(const x of [-1.48,.31]){
    box(root,x,1.469,-.515,.096,1.165,.10,'aluminum');
    box(root,x,1.46,-.463,.026,1.09,.003,'iron');
  }
  box(root,-.577,2.013,-.50,1.895,.119,.15,'ink');
  cyl(root,-.577,1.995,-.407,.022,1.80,'steel','x',16);
  const head=dynamic(group(root,-1.19,1.94,-.43,'linear counting camera'));
  housing(head,0,0,0,.217,.16,.194,'iron',.06);
  bar(head,[0,-.025,0],[0,-.089,.39],.077,'aluminum',true,.083);
  housing(head,0,-.148,.397,.18,.182,.17,'black');
  cyl(head,0,-.279,.397,.065,.113,'black');
  ring(head,0,-.337,.397,.070,.014,'lamp','y',28);
  cyl(head,0,-.337,.397,.042,.009,'optic');
  hose(root,[[-1.47,1.94,-.54],[-1.60,1.73,-.61],[-1.58,1.03,-.58],[-1.48,.87,-.51]],.021);
  box(root,.96,1.223,-.56,.104,.73,.102,'iron');
  monitor(root,.99,1.77,-.56,.70,.418,'count',-.12);
  const state=L.lampStack(root,1.5,.895,-.53);
  return {
    points:[[-.72,1.04,.18],[-.55,1.66,-.037],[1.03,1.12,.20]],
    update(p){
      const review=ease(.50,.83,p);
      head.position.x=-1.18+1.12*ease(.02,.48,p)-.36*ease(.72,.97,p);
      finalPiece.visible=p>=.51;
      finalPiece.position.y=.058+.39*(1-review);
      finalPiece.position.x=holeX+.34*(1-review);
      state(p>.84);
    }
  };
}

function edgeStation(L,root) {
  const {box,cyl,ring,bar,group,housing,hose,cartridge,dynamic,monitor,screws,flange}=L;
  // An open rack bay allows the visitor to see the cable, switches and local
  // fanless node. Nothing relies on an external/cloud service in this vignette.
  const rack=group(root,-.58,0,-.205,'edge compute and I/O rack');
  housing(rack,0,.095,0,1.22,.18,.95,'graphite',.07);
  for(const x of [-.553,.553])for(const z of [-.382,.382]){
    box(rack,x,1.08,z,.078,1.93,.069,'iron');
    for(let k=0;k<10;k++)box(rack,x,.28+k*.169,z+.037,.017,.036,.003,'inset');
  }
  box(rack,0,1.08,-.426,1.12,1.91,.046,'ink');
  box(rack,-.562,1.08,0,.042,1.91,.78,'graphite');
  housing(rack,0,2.066,-.01,1.21,.102,.925,'graphite',.035);
  for(let i=0;i<9;i++)box(rack,0,2.121,-.283+i*.06,.77,.005,.018,'inset');
  function unit(y,height,color) {
    housing(rack,0,y,.075,1.032,height,.63,color,.032);
    for(const x of [-.497,.497]){
      cyl(rack,x,y,.399,.013,.014,'zinc','z',6);
      if(height>.18){
        const handle=group(rack,x*.905,y,.425);
        bar(handle,[0,-.057,0],[0,-.057,.047],.011,'aluminum');
        bar(handle,[0,.057,0],[0,.057,.047],.011,'aluminum');
        bar(handle,[0,-.057,.047],[0,.057,.047],.011,'aluminum');
      }
    }
  }
  unit(.377,.213,'graphite');unit(.627,.197,'iron');unit(.91,.263,'graphite');
  for(let row=0;row<2;row++)for(let col=0;col<7;col++){
    const x=-.348+col*.100,y=.363+row*.036;
    box(rack,x,y,.396,.062,.014,.004,'inset');
    box(rack,x,y+.249,.396,.062,.014,.004,'inset');
  }
  // Visible I/O connectors, rugged heat-sink fins and correctly looped patch cables.
  housing(rack,0,1.33,.059,.865,.395,.59,'aluminum',.067);
  for(let i=0;i<13;i++)box(rack,-.370+i*.062,1.555,.06,.020,.085,.49,'aluminum');
  for(let i=0;i<4;i++){
    const x=-.290+i*.146;
    housing(rack,x,1.34,.361,.118,.095,.035,'black',.06);
    box(rack,x,1.354,.384,.071,.039,.013,'inset');
    box(rack,x+.043,1.311,.388,.009,.009,.005,i===2?'amber':'green');
    housing(rack,x,.937,.403,.094,.069,.025,'black',.05);
    if(i<3){
      const m=i===1?'teal':'rubber';
      hose(rack,[[x,1.355,.392],[x+.018,1.304,.491],[x+.038,1.15,.582],[x-.035,1.011,.550],[x,.938,.425]],.012,m);
    }
  }
  for(let i=0;i<3;i++){const y=.861+i*.045;box(rack,.315,y,.396,.127,.013,.005,'inset');}
  // Review terminal is physically separate from the node; its green switch
  // turns on only after the amber review phase has finished.
  const station=group(root,.98,0,.03,'operator review console');
  housing(station,0,.060,-.08,.72,.112,.62,'iron',.065);
  housing(station,0,.589,-.10,.223,.99,.293,'graphite',.07);
  housing(station,0,1.063,.030,.89,.145,.555,'cream',.065);
  bar(station,[0,1.09,-.127],[0,1.43,-.192],.055,'iron');
  monitor(station,0,1.687,-.125,.927,.572,'review',-.10);
  cyl(station,.222,1.156,.163,.060,.041,'black');const accept=dynamic(cyl(station,.222,1.186,.163,.047,.022,'green'));
  cyl(station,-.217,1.162,.168,.052,.030,'black');cyl(station,-.217,1.189,.168,.038,.022,'yellow');
  for(let j=0;j<4;j++)box(station,-.073+j*.050,1.144,.194,.031,.009,.043,'black');
  // A separate input device shows the origin of the edge camera stream.
  housing(root,-1.47,.74,.31,.35,.25,.31,'iron',.075);
  cyl(root,-1.47,.57,.31,.053,.19,'aluminum');
  box(root,-1.47,.272,.31,.082,.51,.088,'graphite');
  cyl(root,-1.47,.750,.498,.077,.087,'black','z');
  cyl(root,-1.47,.750,.547,.050,.012,'optic','z');
  hose(root,[[-1.45,.695,.154],[-1.48,.47,.05],[-1.27,.217,-.16],[-1.11,.27,-.24]],.017);
  const state=L.lampStack(station,.338,1.14,-.202);
  return {
    points:[[-1.47,.82,.5],[-.53,1.38,.19],[.96,1.69,-.015]],
    update(p){const approved=p>=.76;state(approved);accept.position.y=1.186-.012*ease(.71,.76,p)+.012*ease(.80,.85,p);accept.material=approved?L.m.green:L.m.iron;}
  };
}

const stations = {design:designStation,systems:systemsStation,vision:visionStation,safety:safetyStation,maintenance:maintenanceStation,count:countStation,edge:edgeStation};

/**
 * Returns a station-local group, three physical read points (input, inference,
 * decision), and deterministic control by normalized walkthrough progress.
 * Static batching can merge meshes except descendants of userData.dynamic.
 */
export function buildFactory(T,id) {
  if (!Object.hasOwn(stations,id)) throw new Error('Unknown factory station: '+id);
  const L=libraries.get(T)||makeLibrary(T),group=new T.Group();
  group.name='Ziewise / '+id;
  const {points,update:apply}=stations[id](L,group);
  const update=(p,time=0)=>apply(bound(Number.isFinite(p)?p:0),time);
  update(0,0);
  return {group,anchors:points.map(a=>new T.Vector3(...a)),update};
}
