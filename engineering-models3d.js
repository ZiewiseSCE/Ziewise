// Purpose-built engineering demonstrators. Geometry depicts mechanisms, not live telemetry.
export function createEngineeringModel(T, kind) {
 const root=new T.Group();root.name=`engineering-${kind}`;
 const mat=(color,metalness=.6,roughness=.34)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const dark=mat('#172c35'),steel=mat('#889fa9',.85,.24),pale=mat('#d3e1e2',.3,.4),pcb=mat('#214846',.55,.5);
 const glow=color=>new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.35,metalness:.3,roughness:.32});
 const cyan=glow('#8bd8d9'),amber=glow('#e7b771'),red=glow('#d98178');
 const group=(p,x=0,y=0,z=0)=>{const g=new T.Group();g.position.set(x,y,z);p.add(g);return g;};
 const mesh=(p,geo,m,x=0,y=0,z=0)=>{const a=new T.Mesh(geo,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;p.add(a);return a;};
 const box=(p,w,h,d,x,y,z,m=dark)=>mesh(p,new T.BoxGeometry(w,h,d),m,x,y,z);
 function label(p,text,x,y,z,width=1.8){const c=document.createElement('canvas');const ctx=c.getContext('2d');ctx.font='600 38px Arial';c.width=Math.ceil(ctx.measureText(text).width+24);c.height=74;ctx.fillStyle='#f3f8fa';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#325a70';ctx.font='600 38px Arial';ctx.textAlign='center';ctx.fillText(text,c.width/2,50);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map,transparent:true,depthTest:false,depthWrite:false}));s.position.set(x,y,z);width=Math.min(width,.25*c.width/c.height);s.scale.set(width,width*c.height/c.width,1);s.renderOrder=4;p.add(s);return s;}
 function route(points,color=cyan){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));curve.rail=mesh(root,new T.TubeGeometry(curve,40,.024,6,false),color);return curve;}
 function traffic(curve,count=7,color=cyan){const items=Array.from({length:count},()=>mesh(root,new T.SphereGeometry(.085,12,8),color));return (time,enabled=true)=>{curve.rail.material=enabled?color:dark;items.forEach((p,i)=>{p.visible=enabled;p.position.copy(curve.getPoint((time*.23+i/count)%1));});};}
 function module(p,x,y,z,name,accent=cyan){const g=group(p,x,y,z);box(g,1.16,.28,.9,0,0,0,steel);box(g,1.08,.055,.82,0,.165,0,pcb);box(g,.43,.12,.42,0,.25,0,dark);for(let i=0;i<7;i++)box(g,.82,.04,.027,0,.32,-.31+i*.1,steel);for(let i=0;i<4;i++){box(g,.13,.12,.11,-.5+i*.33,-.02,.49,dark);box(g,.07,.04,.03,-.5+i*.33,.025,.555,accent);}if(name)label(g,name,0,.65,0,1.55);return g;}
 function pedestal(x,z,w=1.65){box(root,w,.2,1.55,x,.18,z,dark);box(root,w,.025,1.55,x,.3,z,steel);for(const dx of [-.6,.6])box(root,.13,.16,.13,x+dx,.035,z+.55,steel);}
 function screen(x,z,text,accent=cyan){const g=group(root,x,.9,z);box(g,.13,.9,.13,0,0,0,steel);box(g,1.3,.85,.07,0,.65,0,dark);box(g,1.15,.67,.015,0,.65,.045,pcb);label(g,text,0,1.3,0,1.7);for(let i=0;i<5;i++)box(g,.13,.13+i*.045,.02,-.43+i*.21,.47+i*.023,.065,accent);return g;}
 const ease=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
 box(root,8,.13,4.6,0,-.035,0,dark);box(root,7.92,.025,4.52,0,.045,0,mat('#172b36',.45,.54));
 for(let i=0;i<8;i++)box(root,.009,.008,4.4,-3.5+i,.062,0,steel);
 let update=()=>{};
 if(kind==='verify'){
  pedestal(-2.75,0);pedestal(2.75,0);const candidate=module(root,-2.75,.7,0,'CANDIDATE');module(root,2.75,.68,0,'PRODUCTION');
  const gates=[];for(let i=0;i<3;i++){const g=group(root,-1.25+i*1.15,.28,0);box(g,.1,1.28,.14,0,.64,-.62,steel);box(g,.1,1.28,.14,0,.64,.62,steel);box(g,.16,.09,1.38,0,1.28,0,steel);const beam=box(g,.025,1.12,1.18,0,.64,0,new T.MeshStandardMaterial({color:'#86d6df',emissive:'#86d6df',emissiveIntensity:.3,transparent:true,opacity:.16,depthWrite:false}));gates.push(beam);label(g,['SECURITY','LOAD','QUALITY'][i],0,1.62,0,1.03);}
  const held=module(root,.05,.5,1.63,'HELD',red);const track=route([[-3,.38,0],[0,.38,0],[3,.38,0]]);const packets=traffic(route([[2.5,.36,0],[3.35,.36,.6],[3.35,.36,1.7],[1.7,.36,1.7]]),5);
  const failure=label(root,'REJECTED',.0,1.7,1.65,2),approved=label(root,'APPROVED',2.5,1.5,0,2);
  update=({phase,time,reducedMotion})=>{const t=reducedMotion?3.4:time,u=ease(t/3.1);held.visible=phase===2;failure.visible=phase===2;approved.visible=phase===3&&u>.7;gates.forEach((g,i)=>{g.material.color.set(phase===2&&i===2?'#df8c77':'#86d6df');g.material.opacity=phase===1?.12+.23*Math.sin(t*2-i)**2:.16;});candidate.visible=phase!==2;candidate.position.set(phase===0?-2.75+u*.55:phase===1?-2.2+u*3.1:phase===3?.9+u*1.85:.05,.7,0);held.position.z=phase===2?.3+1.33*u:1.63;packets(t);};
 } else if(kind==='select'){
  pedestal(-2.75,0);pedestal(0,0,1.8);pedestal(2.75,-1);module(root,0,.66,0,'EDGE');module(root,2.75,.66,-1,'LEARNING',amber);screen(2.85,1.55,'LOCAL RESULT').scale.setScalar(.7);
  const camera=group(root,-2.75,.75,0);box(camera,.9,.55,.62,0,.2,0,pale);const lens=mesh(camera,new T.CylinderGeometry(.23,.23,.24,32),dark,.48,.2,0);lens.rotation.z=Math.PI/2;box(camera,.13,.4,.13,0,-.25,0,steel);label(camera,'FIELD DATA',0,.85,0,1.7);
  const samples=Array.from({length:20},(_,i)=>{const b=box(root,.19,.065,.19,-1.82+(i%5)*.25,.55+Math.floor(i/5)*.14,.62,i%7===0?amber:cyan);return {b,x:b.position.x,y:b.position.y,z:b.position.z,uncertain:i%7===0};});
  const local=traffic(route([[0,.45,0],[1.15,.45,1.35],[2.7,.45,1.35]]),8),learning=traffic(route([[0,.45,0],[1.2,.45,-1],[2.75,.45,-1]],amber),3,amber);
  label(root,'UNCERTAIN ONLY',1.5,1.25,-1,2);label(root,'PROCESS LOCALLY',1.5,.62,1.95,2.2);
  update=({phase,time,reducedMotion})=>{const t=reducedMotion?3.4:time,u=ease(t/3);samples.forEach(({b,x,y,z,uncertain},i)=>{b.visible=true;let move=phase===0?ease((t-i*.06)/2):1;const end=phase>=2&&uncertain;const done=phase>=1&&!uncertain; b.position.set(x+(move-1)*1.0+(end?u*3.65:done?u*1.0:0),y-(done?u*.12:0),z+(end?-1.6*u:done?u*.7:0));b.material=uncertain&&phase>=1?amber:cyan;b.scale.setScalar(done?.85:1);});local(t,phase>=1);learning(t,phase>=2);};
 } else if(kind==='swap'){
  const slots=[-1.15,1.15].map((z,i)=>{pedestal(0,z,3.2);const g=group(root,0,.74,z);box(g,2.3,.7,.88,0,0,0,dark);box(g,2.2,.05,.87,0,.38,0,steel);for(let j=0;j<10;j++)box(g,.075,.47,.025,-.88+j*.19,0,.455,steel);label(g,i?'SLOT B / NEW':'SLOT A / BASELINE',0,.9,0,2.9);return g;});
  const next=module(root,1.9,.92,1.15,'',amber);const lights=slots.map(g=>box(g,.2,.12,.025,1.02,.15,.47,cyan));
  label(root,'REQUESTS',-3,1.15,0,1.6);label(root,'RESULTS',3,1.15,0,1.6);
  const routes=[-1.15,1.15].map(z=>traffic(route([[-3.3,.45,0],[-1.9,.45,z],[0,.45,z],[1.9,.45,z],[3.3,.45,0]]),12));
  
  update=({phase,time,reducedMotion})=>{const t=reducedMotion?3.4:time,u=ease(t/2.5);next.position.x=phase===0?2.1:phase===1?2.1-2.1*u:0;next.position.y=phase<2?.95:1.15;next.visible=phase!==0;const b=phase===2||(phase===3&&u<.5);routes[0](t,!b);routes[1](t,b);lights.forEach((l,i)=>{l.material=(i===1)===b?cyan:steel;});next.rotation.y=phase===1?(1-u)*-.25:0;};
 } else {
  pedestal(-2.6,-.2,2.1);pedestal(2.5,.35,2.0);label(root,'SOURCE MODEL',-2.6,2.1,-.2,2.4);const weights=group(root,-2.6,.65,-.2);for(let x=0;x<4;x++)for(let y=0;y<4;y++)for(let z=0;z<4;z++)box(weights,.24,.24,.24,(x-1.5)*.29,y*.29,(z-1.5)*.29,((x+y+z)%3)?steel:cyan);
  const chip=module(root,2.5,.6,.35,'EDGE ENGINE');const compact=module(root,0,1.1,0,'OPTIMIZED');const arrow=route([[-1.6,.4,-.2],[0,.4,0],[2.5,.4,.35]]);const packets=traffic(arrow,6);
  screen(-.1,-1.4,'QUALITY CHECK');const result=screen(2.6,1.7,'LOCAL INFERENCE');
  const sensor=group(root,-2.8,.55,1.5);box(sensor,.55,.5,.3,0,0,0,pale);label(sensor,'INPUT',0,.55,0,1.1);const infer=traffic(route([[-2.8,.3,1.5],[0,.3,1.5],[2.5,.3,.35],[3.3,.3,1.7]]),10);
  update=({phase,time,reducedMotion})=>{const t=reducedMotion?3.4:time,u=ease(t/3);const shrink=phase===1?1-.65*u:phase>=2?.35:1;weights.scale.setScalar(shrink);weights.rotation.y=phase===0?Math.sin(t*.6)*.16:phase===1?u*.35:0;compact.visible=phase>=1;compact.position.set(phase>=2?2.5*u:0,phase>=2?1.1-.2*u:1.1,phase>=2?.35*u:0);compact.scale.setScalar(phase>=2?1-.55*u:.55);result.visible=phase===3;packets(t,phase===1||phase===2);infer(t,phase===3);};
 }
 return {root,autoRotate:false,camera:{target:[0,.7,0],distance:13.5,yaw:.15,pitch:.5},update};
}
