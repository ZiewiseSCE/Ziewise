/* Procedural metre-scale fixtures. All external images are same-folder assets. */
export function kit(T) {
  const geometries=new Map(),materials=new Map(),loads=new Map(),promises=[];
  const geo=(key,create)=>{if(!geometries.has(key))geometries.set(key,create());return geometries.get(key);};
  const boxGeo=geo('box',()=>new T.BoxGeometry(1,1,1)),frontGeo=geo('face',()=>new T.PlaneGeometry(1,1));
  const group=(par,name,x=0,y=0,z=0)=>{const g=new T.Group();g.name=name;g.position.set(x,y,z);par.add(g);return g;};
  function std(name,color,metalness=.1,roughness=.55,more={}) {
    if(!materials.has(name))materials.set(name,new T.MeshStandardMaterial({name,color,metalness,roughness,...more}));
    return materials.get(name);
  }
  function coat(name,color,metalness,roughness,extra={}) {
    if(!materials.has(name))materials.set(name,new T.MeshPhysicalMaterial({name,color,metalness,roughness,clearcoat:.56,clearcoatRoughness:.22,...extra}));
    return materials.get(name);
  }
  function mesh(parent,g,m,x=0,y=0,z=0,n=''){
    const o=new T.Mesh(g,m);o.name=n;o.position.set(x,y,z);o.castShadow=!m.isMeshBasicMaterial&&!m.transparent;
    o.receiveShadow=!m.isMeshBasicMaterial;parent.add(o);return o;
  }
  function box(p,x,y,z,w,h,d,m){const o=mesh(p,boxGeo,m,x,y,z);o.scale.set(w,h,d);return o;}
  function bevel(p,x,y,z,w,h,d,m,r=.055){
    const g=geo('bevel'+r,()=>{
      const s=new T.Shape();s.moveTo(-.5+r,-.5);s.lineTo(.5-r,-.5);s.quadraticCurveTo(.5,-.5,.5,-.5+r);s.lineTo(.5,.5-r);s.quadraticCurveTo(.5,.5,.5-r,.5);
      s.lineTo(-.5+r,.5);s.quadraticCurveTo(-.5,.5,-.5,.5-r);s.lineTo(-.5,-.5+r);s.quadraticCurveTo(-.5,-.5,-.5+r,-.5);
      const g=new T.ExtrudeGeometry(s,{depth:.98,bevelEnabled:true,bevelThickness:.01,bevelSize:.007,bevelSegments:2,curveSegments:5});g.translate(0,0,-.49);return g;
    });
    const o=mesh(p,g,m,x,y,z);o.scale.set(w,h,d);return o;
  }
  function cyl(p,x,y,z,r,h,m,axis='y',sides=28,ratio=1){
    const g=geo('c'+sides+'/'+ratio,()=>new T.CylinderGeometry(ratio,1,1,sides));const o=mesh(p,g,m,x,y,z);
    o.scale.set(r,h,r);if(axis==='x')o.rotation.z=Math.PI/2;if(axis==='z')o.rotation.x=Math.PI/2;return o;
  }
  function rod(p,a,b,r,m,sides=12){
    const v=new T.Vector3(...b).sub(new T.Vector3(...a));const mid=v.clone().multiplyScalar(.5).add(new T.Vector3(...a));
    const o=cyl(p,mid.x,mid.y,mid.z,r,v.length(),m,'y',sides);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;
  }
  function rail(p,a,b,w,d,m){
    const v=new T.Vector3(...b).sub(new T.Vector3(...a));const mid=v.clone().multiplyScalar(.5).add(new T.Vector3(...a));
    const o=box(p,mid.x,mid.y,mid.z,w,v.length(),d,m);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;
  }
  function lead(p,v,r,m){const points=v.map(q=>new T.Vector3(...q));return mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(points),26,r,8,false),m);}
  function face(p,x,y,z,w,h,m){const o=mesh(p,frontGeo,m,x,y,z);o.scale.set(w,h,1);o.castShadow=false;return o;}
  function lathe(p,x,y,z,id,profile,m,sides=48){
    const g=geo(id,()=>new T.LatheGeometry(profile.map(v=>new T.Vector2(...v)),sides));return mesh(p,g,m,x,y,z);
  }
  function tex(file,color,sx=1,sy=1) {
    const key=[file,color,sx,sy].join('/');if(loads.has(key))return loads.get(key);
    if(typeof document==='undefined'){const blank=Promise.resolve(null);loads.set(key,blank);return blank;}
    const result=new T.TextureLoader().loadAsync(new URL('./'+file,import.meta.url).href).then(t=>{
      t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=4;
      if(sx!==1||sy!==1){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(sx,sy);}return t;
    }).catch(()=>null);
    loads.set(key,result);promises.push(result);return result;
  }
  function skin(m,file,color=true,k='map',sx=1,sy=1,white=false){
    const result=tex(file,color,sx,sy).then(t=>{if(t){m[k]=t;if(white&&k==='map')m.color.setHex(0xffffff);m.needsUpdate=true;}});promises.push(result);return m;
  }
  function surface(w,h,paint,name,lit=false){
    const canvas=typeof document==='undefined'?null:document.createElement('canvas');
    if(!canvas)return {material:std(name,0x84948d,.06,.56),draw:()=>{}};
    canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
    const material=lit?std(name,0xffffff,.08,.64,{map:texture}):new T.MeshBasicMaterial({name,map:texture,toneMapped:false});
    const draw=(...args)=>{c.save();c.setTransform(1,0,0,1,0,0);paint(c,w,h,...args);c.restore();texture.needsUpdate=true;};
    draw();return {material,draw};
  }
  const m={
    dark:std('charcoal paint',0x283637,.40,.44),black:std('rubber and sealed edges',0x202929,.06,.67),
    steel:std('brushed galvanized steel',0xaab6b6,.78,.33),bolt:std('plated hardware',0x9da9a6,.82,.34),
    brass:coat('satin champagne brass',0xb79a64,.72,.38),cream:std('warm porcelain',0xdddace,.18,.38),
    paper:std('natural carton',0xe2dfcc,.04,.69),plaster:std('fine lime plaster',0xb7b4a5,.025,.86),
    graphite:std('display frame',0x222b2c,.46,.37),green:std('sage control lens',0x9ab682,.16,.31,{emissive:0x607844,emissiveIntensity:.37}),
    amber:std('amber indicator',0xd6a95b,.14,.30,{emissive:0xba8230,emissiveIntensity:.29}),
    glow:std('opal diffusion strip',0xffedca,.05,.34,{emissive:0xffd19f,emissiveIntensity:.72}),
    void:std('dark grille recess',0x141b1b,.08,.85),floor:std('concrete apron',0xa3a5a0,.03,.77),
    oak:std('quarter sawn oak',0xb7986b,.06,.57),stone:std('cream natural stone',0xc8c0a7,.07,.41),
    pv:coat('crystalline photovoltaic modules',0x27394d,.30,.33,{clearcoat:.36,clearcoatRoughness:.27}),
  };
  const dynamic=o=>{o.userData.dynamic=true;return o;};
  const fix=(p,x,y,z,r=.012)=>cyl(p,x,y,z,r,r*.88,m.bolt,'z',6);
  return {T,m,std,coat,mesh,geo,group,box,bevel,cyl,rail,rod,lead,face,lathe,tex,skin,surface,promises,dynamic,fix};
}

export function label(c,text,x,y,size,color='#dce2d7',weight=600,align='left'){
  c.font=weight+' '+size+'px "Noto Sans KR","Malgun Gothic","Apple SD Gothic Neo",Arial,sans-serif';
  c.textAlign=align;c.fillStyle=color;c.fillText(text,x,y);c.textAlign='left';
}
export function line(c,a,b,color,width=2){
  c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.lineWidth=width;c.strokeStyle=color;c.stroke();
}
export function imageCover(c,im,x,y,w,h){
  if(!im)return false;
  const s=Math.max(w/im.width,h/im.height),sw=w/s,sh=h/s;
  c.drawImage(im,(im.width-sw)/2,(im.height-sh)/2,sw,sh,x,y,w,h);return true;
}
export function framedScreen(K,parent,x,y,z,w,h,ui,{tilt=0,yaw=0,metal=false}={}){
  const {m,group,bevel,face,cyl,fix}=K;const g=group(parent,'physical display',x,y,z);g.rotation.x=tilt;g.rotation.y=yaw;
  bevel(g,0,0,0,w+.051,h+.049,.049,metal?m.steel:m.graphite,.037);
  bevel(g,0,0,.025,w+.021,h+.025,.012,m.black,.028);face(g,0,0,.032,w,h,ui.material);
  for(const s of [-1,1])fix(g,s*(w/2+.011),h/2+.012,.028,.0048);
  cyl(g,w*.41,-h/2-.012,.031,.004,.005,m.green,'z',12);return g;
}
