import * as THREE from './vendor/three.module.js';

// Small-circle planes fitted to centerline samples from logo-symbol.png.
// Each original sweep continues as a closed, rounded band around the sphere.
// Normals vary with the source curves: these are not generic latitude rings.
const sweeps = [
 [[.4696,-.3889,.7926],-.3669,.049,'#69757a'],
 [[.5386,-.4139,.7339],-.0765,.057,'#aebcbe'],
 [[.6385,-.5764,.5100],-.0076,.046,'#bfccce'],
 [[.5691,-.5212,.6360], .1731,.063,'#84999f'],
 [[.6711,-.5304,.5180], .3347,.064,'#b3a174'],
 [[.5944,-.5666,.5707], .5322,.056,'#aebfc3'],
 [[.6815,-.6481,.3398], .6719,.067,'#a8b7ba'],
 [[.7095,-.6966,.1062], .8817,.050,'#455c65']
];

export function createLogoRibbons() {
 const segments=256,sides=12;
 const axis=new THREE.Vector3(.63,-.55,.55).normalize();
 const u=new THREE.Vector3(0,0,1).cross(axis).normalize(),v=axis.clone().cross(u).normalize();
 const widths=sweeps.map(s=>s[2]*.86);
 const latitudes=sweeps.map(()=>[]);
 for(let i=0;i<segments;i++){
  const theta=i/segments*Math.PI*2;
  const direction=u.clone().multiplyScalar(Math.cos(theta)).addScaledVector(v,Math.sin(theta));
  sweeps.forEach(([normal,offset],j)=>{
   const n=new THREE.Vector3(...normal).normalize(),a=n.dot(axis),b=n.dot(direction);
   latitudes[j][i]=Math.asin(offset/Math.hypot(a,b))-Math.atan2(b,a);
  });
 }
 // Keep the individually inferred curves ordered on the back of the globe too.
 // This prevents the independently fitted circles from crossing or z-fighting.
 for(let pass=0;pass<32;pass++){
  for(let i=0;i<segments;i++)for(let j=0;j<sweeps.length-1;j++){
   const gap=widths[j]+widths[j+1]+.036;
   const overlap=gap-(latitudes[j+1][i]-latitudes[j][i]);
   if(overlap>0){latitudes[j][i]-=overlap*.5;latitudes[j+1][i]+=overlap*.5;}
  }
  latitudes.forEach(row=>{const next=row.map((value,i)=>(row[(i+segments-1)%segments]+value*6+row[(i+1)%segments])/8);next.forEach((value,i)=>row[i]=value);});
 }
 return sweeps.map(([, , ,color],index)=>{
  const position=[],uv=[],indices=[];
  for(let i=0;i<=segments;i++){
   const theta=i/segments*Math.PI*2;
   const direction=u.clone().multiplyScalar(Math.cos(theta)).addScaledVector(v,Math.sin(theta));
   for(let j=0;j<=sides;j++){
    const section=j/sides*Math.PI*2,latitude=latitudes[index][i%segments]+widths[index]*Math.cos(section);
    const point=axis.clone().multiplyScalar(Math.sin(latitude)).addScaledVector(direction,Math.cos(latitude)).multiplyScalar(1+.013*Math.sin(section));
    position.push(point.x,point.y,point.z);uv.push((point.x+1)/2,(point.y+1)/2);
    if(i<segments&&j<sides){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
   }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  const normals=geometry.attributes.normal;
  const join=(a,b)=>{const normal=new THREE.Vector3().fromBufferAttribute(normals,a).add(new THREE.Vector3().fromBufferAttribute(normals,b)).normalize();normals.setXYZ(a,normal.x,normal.y,normal.z);normals.setXYZ(b,normal.x,normal.y,normal.z);};
  for(let i=0;i<=segments;i++)join(i*(sides+1),i*(sides+1)+sides);
  for(let j=0;j<=sides;j++)join(j,segments*(sides+1)+j);
  return {geometry,color,index};
 });
}

export function colorLogoRibbons(ribbons){
 ribbons.forEach(ribbon=>{
  const p=ribbon.geometry.attributes.position,colors=[],base=new THREE.Color(ribbon.color);
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),color=base.clone();
   // The cyan belongs to the short left-hand sweep of the source mark.
   // Interpolate in 3D instead of sampling raster alpha boundaries at every vertex.
   if(ribbon.index===3){
    const accent=THREE.MathUtils.smoothstep(-x,.42,.62)*THREE.MathUtils.smoothstep(z,0,.28)*(1-THREE.MathUtils.smoothstep(y,.18,.4));
    color.lerp(new THREE.Color('#039cba'),accent);
   }
   colors.push(color.r,color.g,color.b);
  }
  ribbon.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 });
}
