import * as T from './vendor/three.module.js';

/** An exposed synthetic cortex, built in batches so detail does not cost hundreds of draws. */
export function createArtificialBrain(keep = value => value) {
  const root = new T.Group();root.name = 'ZiewCore artificial neural architecture';
  const point = (theta,phi,side,scale=1) => {
    const fold = .025*Math.sin(phi*12 + Math.sin(theta*4))*Math.sin(theta*11);
    const r = (1+fold)*scale;
    return new T.Vector3(side*(.055+1.15*Math.sin(theta)*Math.cos(phi)*r),Math.cos(theta)*1.07*r,Math.sin(theta)*Math.sin(phi)*1.39*r);
  };
  const vertices=[],indices=[],colors=[],seams=[],circuits=[];
  const line = (target,a,b) => target.push(...a,...b);
  const trace = (target,t0,p0,t1,p1,side,scale) => {
    let previous=point(t0,p0,side,scale);
    for(let i=1;i<=8;i++){const next=point(T.MathUtils.lerp(t0,t1,i/8),T.MathUtils.lerp(p0,p1,i/8),side,scale);line(target,previous,next);previous=next;}
  };
  let plates=0;
  for(const side of [-1,1])for(let row=0;row<8;row++)for(let col=0;col<10;col++){
    // A broad front-right cutaway exposes the neural tissue and the compute core.
    if(side===1 && col>=5 && row>=1 && row<=6)continue;
    const t0=.13+row*(Math.PI-.26)/8+.024,t1=.13+(row+1)*(Math.PI-.26)/8-.024;
    const p0=-Math.PI/2+col*Math.PI/10+.018,p1=-Math.PI/2+(col+1)*Math.PI/10-.018;
    const base=vertices.length/3,n=4;
    const color=new T.Color().setHSL(.57,.22,.36+(row%3)*.035+(side<0?.07:0));
    for(let y=0;y<=n;y++)for(let x=0;x<=n;x++){
      vertices.push(...point(T.MathUtils.lerp(t0,t1,y/n),T.MathUtils.lerp(p0,p1,x/n),side));
      colors.push(color.r,color.g,color.b);
    }
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const a=base+y*(n+1)+x,b=a+1,c=a+n+1,d=c+1;
      indices.push(a,c,b,b,c,d);
    }
    const corners=[[t0,p0],[t0,p1],[t1,p1],[t1,p0]];
    corners.forEach((p,i)=>trace(seams,...p,...corners[(i+1)%4],side,1.006));
    // Fine circuit traces follow each machined panel, rather than floating randomly.
    for(let track=0;track<2;track++){
      const t=t0+(t1-t0)*(.28+track*.32);
      const start=p0+(p1-p0)*.18,bend=p0+(p1-p0)*.67;
      trace(circuits,t,start,t,bend,side,1.012);trace(circuits,t,bend,t+(t1-t0)*.16,bend,side,1.012);
    }
    plates++;
  }
  const shell=keep(new T.BufferGeometry());shell.setAttribute('position',new T.Float32BufferAttribute(vertices,3));shell.setAttribute('color',new T.Float32BufferAttribute(colors,3));shell.setIndex(indices);shell.computeVertexNormals();
  root.add(new T.Mesh(shell,keep(new T.MeshPhysicalMaterial({vertexColors:true,metalness:.82,roughness:.33,clearcoat:.23,side:T.DoubleSide}))));
  function lines(data,color,opacity){const geo=keep(new T.BufferGeometry());geo.setAttribute('position',new T.Float32BufferAttribute(data,3));const mesh=new T.LineSegments(geo,keep(new T.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false})));root.add(mesh);return mesh;}
  lines(seams,'#94ceeb',.48);lines(circuits,'#64d6f3',.7);
  let seed=93;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const nodes=[];
  for(let i=0;i<360;i++){
    const theta=Math.acos(2*random()-1),phi=random()*Math.PI-Math.PI/2;
    const p=point(theta,phi,i%2?1:-1,.63+random()*.3);nodes.push(p);
  }
  const nerveLines=[];
  nodes.forEach((p,i)=>{
    const neighbors=nodes.map((q,j)=>({j,d:p.distanceToSquared(q)})).filter(n=>n.j>i&&n.d<.32).sort((a,b)=>a.d-b.d).slice(0,3);
    neighbors.forEach(({j})=>line(nerveLines,p,nodes[j]));
  });
  lines(nerveLines,'#45acd9',.46);
  const beadGeometry=keep(new T.IcosahedronGeometry(1,1));
  const beads=keep(new T.InstancedMesh(beadGeometry,keep(new T.MeshBasicMaterial({color:'#ffffff'})),nodes.length));
  const dummy=new T.Object3D(),color=new T.Color();
  nodes.forEach((p,i)=>{dummy.position.copy(p);dummy.scale.setScalar(i%11===0?.029:.013);dummy.updateMatrix();beads.setMatrixAt(i,dummy.matrix);beads.setColorAt(i,color.set(i%13===0?'#eebd79':i%3===0?'#a9b0ff':'#87e6ff'));});
  root.add(beads);
  const tracts=[],tractLines=[];
  for(let side of [-1,1])for(let i=0;i<22;i++){
    const theta=.35+(i%7)*.35,phi=-.7+Math.floor(i/7)*.47;
    const end=point(theta,phi,side,.89);
    const start=new T.Vector3(side*.07,-.65,.12);
    const curve=new T.CatmullRomCurve3([start,new T.Vector3(side*.16,-.13,.31),new T.Vector3(end.x*.52,end.y*.55+.18,end.z*.75),end]);
    tracts.push(curve);const pts=curve.getPoints(26);for(let j=1;j<pts.length;j++)line(tractLines,pts[j-1],pts[j]);
  }
  lines(tractLines,'#a6e5fa',.72);
  // Independent moving impulses reveal direction along the major neural tracts.
  const impulses=keep(new T.InstancedMesh(keep(new T.SphereGeometry(.025,8,6)),keep(new T.MeshBasicMaterial({color:'#e4faff'})),tracts.length));root.add(impulses);
  const alloy=keep(new T.MeshStandardMaterial({color:'#6989a5',metalness:.9,roughness:.28}));
  const coreMaterial=keep(new T.MeshStandardMaterial({color:'#16364b',metalness:.55,roughness:.3,emissive:'#37bcd6',emissiveIntensity:.6}));
  const core=new T.Mesh(keep(new T.BoxGeometry(.35,.43,.24)),coreMaterial);core.position.set(.13,-.04,.47);root.add(core);
  const coreEdges=new T.LineSegments(keep(new T.EdgesGeometry(core.geometry)),keep(new T.LineBasicMaterial({color:'#a2edff'})));core.add(coreEdges);
  const pinGeo=keep(new T.BoxGeometry(.1,.026,.055));
  for(let side of [-1,1])for(let i=0;i<7;i++){const pin=new T.Mesh(pinGeo,alloy);pin.position.set(.13+side*.218,-.20+i*.054,.47);root.add(pin);}
  const stem=new T.Mesh(keep(new T.CylinderGeometry(.12,.085,.58,16)),alloy);stem.position.set(0,-1.18,-.22);root.add(stem);
  const ringGeo=keep(new T.TorusGeometry(.135,.014,5,20)),ringMaterial=keep(new T.MeshBasicMaterial({color:'#79cddd'}));
  for(let i=0;i<6;i++){const ring=new T.Mesh(ringGeo,ringMaterial);ring.rotation.x=Math.PI/2;ring.position.set(0,-.94-i*.09,-.22);root.add(ring);}
  root.userData.detail={plates,neurons:nodes.length,tracts:tracts.length};
  return {root,update(time,phase){
    coreMaterial.emissiveIntensity=.55+Math.sin(time*1.7)*.16;
    tracts.forEach((curve,i)=>{const t=(time*(phase===1?.18:.12)+i/tracts.length)%1;dummy.position.copy(curve.getPoint(t));dummy.scale.setScalar(1);dummy.updateMatrix();impulses.setMatrixAt(i,dummy.matrix);});impulses.instanceMatrix.needsUpdate=true;
  }};
}
