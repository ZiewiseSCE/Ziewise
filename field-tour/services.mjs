// Utility runs and the control-room electrical lineup occupy the back of the real aisle.
export function dressServices(T,building){
  const steel=new T.MeshStandardMaterial({name:'brushed service conduits',color:0xa4aba8,metalness:.82,roughness:.33});
  const paint=new T.MeshStandardMaterial({name:'powder coated electrical enclosure',color:0xb9bdb4,metalness:.48,roughness:.44});
  const dark=new T.MeshStandardMaterial({color:0x343a3b,roughness:.6,metalness:.41});
  const copper=new T.MeshStandardMaterial({color:0xb47e52,roughness:.44,metalness:.78});
  const blue=new T.MeshStandardMaterial({color:0x314f66,roughness:.62,metalness:.34});
  const g=new T.Group();g.name='Power distribution and return pipework';g.userData.batchCell=true;
  const box=new T.BoxGeometry(1,1,1),cyl=new T.CylinderGeometry(1,1,1,18),bolt=new T.CylinderGeometry(1,1,1,6),up=new T.Vector3(0,1,0);
  function mesh(geom,m){const node=new T.Mesh(geom,m);node.receiveShadow=node.castShadow=true;g.add(node);return node;}
  function block(x,y,z,w,h,d,m){const n=mesh(box,m);n.position.set(x,y,z);n.scale.set(w,h,d);return n;}
  function rod(a,b,r,m,geo=cyl){const u=new T.Vector3(...a),v=new T.Vector3(...b),axis=v.clone().sub(u),n=mesh(geo,m);
    n.position.copy(u).lerp(v,.5);n.scale.set(r,axis.length(),r);n.quaternion.setFromUnitVectors(up,axis.normalize());return n;}
  for(let i=0;i<4;i++){
    const z=-1.78+i*.81;
    block(-6.31,.091,z,.83,.15,.80,dark);block(-6.31,1.20,z,.78,2.12,.80,paint);
    block(-5.909,1.21,z,.027,2.02,.744,paint);block(-5.886,1.23,z+.263,.034,.15,.062,dark);
    block(-5.86,1.24,z+.265,.044,.104,.025,steel);
    for(let j=0;j<6;j++)block(-5.887,.39+j*.038,z,.018,.010,.42,dark);
    for(const h of [.41,1.72])block(-5.895,h,z-.322,.036,.095,.022,steel);
    const x=-6.37+i*.077;
    rod([x,2.27,z],[x,3.48,z],.022,steel);rod([x,3.48,z],[x,3.48,z-1.5],.022,steel);
    for(const y of [2.34,3.24])rod([x,y,z],[x,y+.044,z],.030,dark);
  }
  for(let i=0;i<3;i++){
    const x=6.23-i*.26,h=1.16+i*.33;
    rod([x,h,-17.9],[x,h,7.77],.077+i*.007,i===1?copper:steel);
    for(let z=-16.7;z<7.7;z+=3.16){
      const r=.119+i*.007;
      rod([x,h,z],[x,h,z+.068],r,dark);
      for(let j=0;j<6;j++){const a=j*Math.PI/3,cx=x+r*.82*Math.cos(a),cy=h+r*.82*Math.sin(a);
        rod([cx,cy,z-.014],[cx,cy,z+.086],.011,steel,bolt);}
      block(x,h-.113,z,.16,.046,.15,steel);
    }
  }
  for(const z of [3.67,-4.02,-12.41]){
    rod([5.98,1.40,z],[5.98,2.13,z],.046,copper);rod([5.98,2.04,z],[5.98,2.12,z],.088,steel);
    const wheel=mesh(new T.TorusGeometry(.132,.017,10,32),blue);wheel.position.set(5.98,2.16,z);wheel.rotation.x=-Math.PI/2;
    for(let j=0;j<3;j++){const a=j*Math.PI*2/3;rod([5.98,2.16,z],[5.98+.13*Math.cos(a),2.16,z+.13*Math.sin(a)],.009,blue);}
  }
  building.add(g);
}
