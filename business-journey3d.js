import * as THREE from './vendor/three.module.js';
import {createSolutionMiniature} from './solution-miniatures3d.js?v=20260913-mini1';

/** A physical inspection example: field → core → operational decision → feedback. */
export function createBusinessJourney(parent) {
  const resources=new Set(),keep=r=>{resources.add(r);return r;},root=new THREE.Group();parent.add(root);
  const field=createSolutionMiniature('vision'),action=createSolutionMiniature('observer');
  field.root.position.set(-1.65,.04,1.05);field.root.scale.setScalar(1.08);field.root.rotation.y=.1;
  action.root.position.set(1.65,.04,1.02);action.root.scale.setScalar(1.28);action.root.rotation.y=-.24;
  root.add(field.root,action.root);
  const paths=[];
  function route(points,color,stages){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const material=keep(new THREE.MeshBasicMaterial({color,transparent:true,opacity:.22}));
    root.add(new THREE.Mesh(keep(new THREE.TubeGeometry(curve,42,.012,6,false)),material));
    const dots=Array.from({length:5},()=>{const m=new THREE.Mesh(keep(new THREE.SphereGeometry(.032,10,8)),keep(new THREE.MeshBasicMaterial({color})));root.add(m);return m;});
    paths.push({curve,material,dots,stages});
  }
  route([[-1.55,1.24,1.04],[-1.52,1.5,.24],[-.74,1.37,-.3],[0,1.27,-.33]],'#9ed4dc',[0,1]);
  route([[.15,1.25,-.34],[1.12,1.34,-.05],[1.77,1.1,.34],[2.03,1.07,.9]],'#c3dacc',[2,3]);
  route([[2.02,.15,1.56],[1.1,.12,2.12],[-.6,.12,2.12],[-1.73,.5,1.27]],'#849eaa',[3]);
  const nodes=[],links=[];
  for(let i=0;i<18;i++){
    const p=new THREE.Vector3(Math.sin(i*2.39)*.49, .53+(i/17)*1.27, -.29+Math.cos(i*2.39)*.035);
    const m=new THREE.Mesh(keep(new THREE.SphereGeometry(.019,8,6)),keep(new THREE.MeshBasicMaterial({color:'#a6dce2',transparent:true,opacity:.3})));m.position.copy(p);root.add(m);nodes.push(m);
    if(i>1)links.push(...p,...nodes[i-2].position);
  }
  const networkMat=keep(new THREE.LineBasicMaterial({color:'#96c6d0',transparent:true,opacity:.12}));
  const networkGeo=keep(new THREE.BufferGeometry());networkGeo.setAttribute('position',new THREE.Float32BufferAttribute(links,3));root.add(new THREE.LineSegments(networkGeo,networkMat));
  // A real signal beacon on the inspection station acknowledges the returned decision.
  const beaconMaterial=keep(new THREE.MeshStandardMaterial({color:'#afcfcb',emissive:'#65afa7',emissiveIntensity:.3,roughness:.3,metalness:.3}));
  const beacon=new THREE.Mesh(keep(new THREE.CylinderGeometry(.05,.05,.12,12)),beaconMaterial);beacon.position.set(-2.36,.91,.68);root.add(beacon);
  const plaques=[];
  for(const [index,x,z]of [[0,-1.65,1.75],[1,0,-.19],[2,1.82,1.79]]){
    const c=document.createElement('canvas');c.width=512;c.height=128;
    const map=keep(new THREE.CanvasTexture(c));map.colorSpace=THREE.SRGBColorSpace;
    const sprite=new THREE.Sprite(keep(new THREE.SpriteMaterial({map,transparent:true,depthTest:false})));sprite.position.set(x,.04,z);sprite.scale.set(1.72,.43,1);root.add(sprite);plaques.push({c,map,index,sprite});
  }
  function setLanguage(){const en=document.documentElement.lang==='en';const titles=['01 / FIELD','02 / ZIEWCORE','03 / ACTION'];const subtitles=en?['VIDEO · SENSORS','CONNECT · ANALYSE','ALERT · WORKFLOW']:['영상 · 센서 데이터','데이터 연결 · AI 분석','알림 · 업무 실행'];plaques.forEach(({c,map,index})=>{const ctx=c.getContext('2d');ctx.clearRect(0,0,512,128);ctx.textAlign='center';ctx.fillStyle='#b4cdd7';ctx.font='500 28px Arial,sans-serif';ctx.fillText(titles[index],256,45);ctx.fillStyle='#799aa9';ctx.font='24px Arial,sans-serif';ctx.fillText(subtitles[index],256,90);map.needsUpdate=true;});}
  setLanguage();
  return {
    root,setLanguage,
    update(time,stage){
      field.update(time,stage===0||stage===3?1:.2);action.update(time,stage===3?1:.2);action.setOutcome(stage===3);
      paths.forEach(({curve,material,dots,stages},index)=>{const active=stages.includes(stage);material.opacity=active?.64:.12;dots.forEach((dot,i)=>{dot.visible=active;dot.position.copy(curve.getPoint((time*.26+i*.19+index*.12)%1));});});
      nodes.forEach((node,i)=>node.material.opacity=stage===2?.25+.75*Math.pow(Math.max(0,Math.sin(time*3-i*.7)),4):.13);
      networkMat.opacity=stage===2?.45:.08;beaconMaterial.emissiveIntensity=stage===3?1.7:.15;
    },
    dispose(){field.dispose();action.dispose();resources.forEach(r=>r.dispose());root.removeFromParent();}
  };
}
