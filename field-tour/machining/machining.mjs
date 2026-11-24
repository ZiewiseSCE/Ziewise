import { machiningImages } from './machining-images.mjs';

// The existing factory places parts in metres by scaling this unit-radius fixture.
const top = .2805;
const bottom = -.016;
const turn = Math.PI * 2;
const resources = new WeakMap();
const finished = new WeakSet();

function contour(T, x, z, radius, segments) {
  const points = [];
  for (let i = 0; i < segments; i++) {
    const a = i / segments * turn;
    points.push(new T.Vector2(x + radius * Math.cos(a), -z + radius * Math.sin(a)));
  }
  return points;
}

function annularFace(T, centers, outer, inner, bolt, height, upward) {
  const outline = new T.Shape(contour(T, 0, 0, outer, 160));
  outline.holes.push(new T.Path(contour(T, 0, 0, inner, 112)));
  for (const [x,z] of centers) outline.holes.push(new T.Path(contour(T, x, z, bolt, 48)));
  const geo = new T.ShapeGeometry(outline, 1);
  const pos = geo.getAttribute('position'), uv = geo.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) * .5 + .5, pos.getY(i) * .5 + .5);
  geo.rotateX(-Math.PI / 2); geo.translate(0,height,0);
  if (!upward) {
    const ids = geo.index.array;
    for (let i = 0; i < ids.length; i+=3) [ids[i],ids[i+1]]=[ids[i+1],ids[i]];
    const normal = geo.getAttribute('normal');
    for (let i = 0; i < normal.count; i++) normal.setXYZ(i,0,-1,0);
  }
  return geo;
}

function surfaceBuilder(T) {
  const positions=[], normals=[], uvs=[], indices=[];
  // A profile sample is radius, elevation, radial normal and vertical normal.
  // Carrying analytical radial normals through the UV seam keeps the silhouette smooth.
  function band(cx,cz,count,profile,inward=false) {
    const first=positions.length/3, arc=[0];
    for(let j=1;j<profile.length;j++) {
      arc.push(arc[j-1]+Math.hypot(profile[j][0]-profile[j-1][0],profile[j][1]-profile[j-1][1]));
    }
    for(let j=0;j<profile.length;j++) {
      const [r,y,nr,ny]=profile[j], length=Math.hypot(nr,ny);
      for(let i=0;i<=count;i++) {
        const a=turn*i/count, c=Math.cos(a),s=Math.sin(a);
        positions.push(cx+c*r,y,cz-s*r); normals.push(c*nr/length,ny/length,-s*nr/length);
        uvs.push(i/count,arc[j]/arc.at(-1));
        if(j===0||i===0) continue;
        const d=first+j*(count+1)+i-1,c1=d+1,a1=d-count-1,b=a1+1;
        if(inward) indices.push(a1,c1,b,a1,d,c1); else indices.push(a1,b,c1,a1,c1,d);
      }
    }
  }
  function geometry() {
    const g=new T.BufferGeometry();
    g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2)); g.setIndex(indices);
    g.computeBoundingSphere(); return g;
  }
  return {band,geometry};
}

function cutStock(T) {
  const centers=Array.from({length:6},(_,i)=>{
    const a=turn*i/6+Math.PI/6;
    return [.732*Math.cos(a),-.732*Math.sin(a)];
  });
  const jacket=surfaceBuilder(T), lips=surfaceBuilder(T), drills=surfaceBuilder(T);
  jacket.band(0,0,160,[[1,.002,1,0],[1,.247,1,0]]);
  lips.band(0,0,160,[[.977,bottom,0,-1],[.982,-.015,.39,-.92],[.996,-.005,.72,-.69],[1,.002,1,0]]);
  lips.band(0,0,160,[[1,.247,1,0],[.999,.253,.97,.23],[.996,.259,.80,.60],[.983,.276,.69,.72],[.978,.279,.40,.92],[.975,top,0,1]]);

  // The bore and each screw clearance are open all the way through the blank.
  // The short pockets and their seats intentionally have distinct reflecting angles.
  drills.band(0,0,112,[[.462,-.002,-1,0],[.462,.248,-1,0]],true);
  lips.band(0,0,112,[[.478,bottom,0,-1],[.474,-.014,-.63,-.78],[.464,-.005,-.77,-.64],[.462,-.002,-1,0]],true);
  lips.band(0,0,112,[[.462,.248,-1,0],[.464,.254,-.93,.37],[.483,.277,-.72,.69],[.486,.2795,-.33,.94],[.489,top,0,1]],true);
  for(const [cx,cz] of centers) {
    drills.band(cx,cz,48,[[.078,-.003,-1,0],[.078,.226,-1,0]],true);
    lips.band(cx,cz,48,[[.088,bottom,0,-1],[.084,-.013,-.68,-.73],[.078,-.003,-1,0]],true);
    lips.band(cx,cz,48,[[.078,.226,-1,0],[.079,.229,-.86,.50],[.082,.232,-.47,.88],[.084,.233,0,1],
      [.094,.233,0,1],[.096,.234,-.53,.85],[.097,.236,-1,0]],true);
    drills.band(cx,cz,48,[[.097,.236,-1,0],[.097,.263,-1,0]],true);
    lips.band(cx,cz,48,[[.097,.263,-1,0],[.098,.266,-.93,.37],[.107,.277,-.707,.707],[.110,.2796,-.38,.924],[.112,top,0,1]],true);
  }
  return {
    face:annularFace(T,centers,.975,.489,.112,top,true),
    underside:annularFace(T,centers,.977,.478,.088,bottom,false),
    jacket:jacket.geometry(), lips:lips.geometry(), drills:drills.geometry()
  };
}

function sleeveFinish(T) {
  const w=64,h=256,pixels=new Uint8Array(w*h*4);
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
    const i=(y*w+x)*4;
    const n=77+8*Math.cos(y*turn/8)+4*Math.cos(y*turn/3.2)+2*Math.cos((x+2*y)*turn/64);
    pixels[i]=pixels[i+1]=pixels[i+2]=Math.round(n);pixels[i+3]=255;
  }
  const texture=new T.DataTexture(pixels,w,h);
  texture.wrapS=T.RepeatWrapping;texture.wrapT=T.ClampToEdgeWrapping;
  texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;
  texture.needsUpdate=true;return texture;
}

async function unpack(T,key) {
  const encoded=machiningImages[key];
  let image,bitmap=false;
  if(typeof createImageBitmap==='function') {
    try {
      const binary=atob(encoded), data=new Uint8Array(binary.length);
      for(let i=0;i<data.length;i++) data[i]=binary.charCodeAt(i);
      image=await createImageBitmap(new Blob([data],{type:'image/webp'}),{
        imageOrientation:'flipY',colorSpaceConversion:'none',premultiplyAlpha:'none'
      });
      bitmap=true;
    } catch(error) { if(typeof Image!=='function') throw error; }
  }
  if(!image) {
    image=new Image();
    await new Promise((resolve,reject)=>{
      image.onload=resolve;image.onerror=()=>reject(new Error('Unable to decode machining '+key));
      image.src='data:image/webp;base64,'+encoded;
    });
  }
  const t=new T.Texture(image);t.flipY=!bitmap;t.name='machining / '+key;
  t.colorSpace=key==='screen'?T.SRGBColorSpace:T.NoColorSpace;
  t.anisotropy=4;t.needsUpdate=true;return t;
}

function library(T) {
  if(resources.has(T)) return resources.get(T);
  const geo=cutStock(T), P=T.MeshPhysicalMaterial;
  const face=new P({name:'cold turned stainless / face',color:0xc2c8c8,metalness:.97,roughness:.28,
    anisotropy:.81,clearcoat:.055,clearcoatRoughness:.16,envMapIntensity:1.12});
  const review=face.clone();review.name='cold turned stainless / inspection sample';
  const jacket=new P({name:'circumferential sleeve',color:0xb8bfc0,metalness:.91,roughness:1,
    roughnessMap:sleeveFinish(T),anisotropy:.44,envMapIntensity:1.08});
  const lip=new P({name:'polished turning chamfer',color:0xc4c9c9,metalness:.97,roughness:.195,anisotropy:.32,envMapIntensity:1.08});
  const bore=new P({name:'bored steel',color:0x939b9c,metalness:.95,roughness:.325,anisotropy:.39,envMapIntensity:.98});
  const back=new T.MeshStandardMaterial({name:'reverse steel face',color:0x949a99,metalness:.86,roughness:.37});
  const instrument=new T.MeshBasicMaterial({name:'photographic optical inspection HMI',color:0xffffff,toneMapped:false});
  const hasDecoder=typeof createImageBitmap==='function'||typeof Image==='function';
  const ready=hasDecoder?Promise.all(['normal','roughness','direction','screen'].map(k=>unpack(T,k))).then(([normal,rough,direction,screen])=>{
    // The top half of the prepared atlas is the reference part. The lower half
    // includes a local change in surface roughness along the review sample's scratch.
    const referenceRough=rough.clone();referenceRough.repeat.set(1,.5);referenceRough.offset.y=.5;referenceRough.needsUpdate=true;
    rough.repeat.set(1,.5);rough.offset.y=0;
    for(const [mat,r] of [[face,referenceRough],[review,rough]]) {
      mat.roughness=1;mat.roughnessMap=r;mat.normalMap=normal;mat.normalScale.set(.65,.65);
      mat.anisotropyMap=direction;mat.needsUpdate=true;
    }
    instrument.map=screen;instrument.needsUpdate=true;
  }):Promise.resolve();
  const result={geo,face,review,jacket,lip,bore,back,instrument,ready};resources.set(T,result);return result;
}

function replaceStock(T,part,L) {
  const hasDefect=part.children.some(c=>c.isMesh&&c.material?.name==='gray cast iron');
  // Original stock geometry and its marks are shared between factory fixtures.
  // Detach it without disposing geometry or material owned by the existing factory.
  for(const child of [...part.children]) child.removeFromParent();
  const pieces=[['face',hasDefect?L.review:L.face],['jacket',L.jacket],['lips',L.lip],['drills',L.bore],['underside',L.back]];
  for(const [name,mat] of pieces) {
    const mesh=new T.Mesh(L.geo[name],mat);mesh.name='machined part / '+name;
    mesh.castShadow=true;mesh.receiveShadow=true;part.add(mesh);
  }
  finished.add(part);
}

/** Apply to a fresh factory station, before batchStatic. Geometry changes are synchronous.
 * Await the returned .ready when baking a first frame, so the embedded images have decoded. */
export function applyMachining(T,group) {
  const parts=[],screens=[];
  group.traverse(node=>{
    if(finished.has(node)) return;
    if(node.isGroup&&node.name==='machined six-hole steel flange') parts.push(node);
    else if(node.isMesh&&node.material?.name==='printed instrument optics') screens.push(node);
  });
  // An idempotent call still exposes pending image readiness for this namespace.
  if(!parts.length&&!screens.length) return {flanges:0,screens:0,ready:resources.get(T)?.ready??Promise.resolve()};
  const L=library(T);
  for(const part of parts) replaceStock(T,part,L);
  for(const mesh of screens){
    if(!L.instrument.map&&mesh.material.map) {
      L.instrument.map=mesh.material.map;L.instrument.needsUpdate=true;
    }
    mesh.material=L.instrument;finished.add(mesh);
  }
  return {flanges:parts.length,screens:screens.length,ready:L.ready};
}
