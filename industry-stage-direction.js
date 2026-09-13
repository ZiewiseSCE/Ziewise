// Stage-specific actions and camera subjects. The surrounding site stays in place.
export function directIndustryModel(T, model, kind) {
 const originalSprites=[];model.root.traverse(object=>{if(object.isSprite)originalSprites.push(object);});let overview=false;
 const root=model.root, stages=Array.from({length:4},(_,i)=>{const g=new T.Group();g.name=`stage-${i}`;root.add(g);return g;});
 const material=(color,metalness=.35,roughness=.45)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const pale=material('#d9e5e8',.05,.65),metal=material('#7497a6',.8,.3),ink=material('#193b4b'),gold=material('#d2b078');
 const cyan=new T.MeshStandardMaterial({color:'#9bdae0',emissive:'#448e9b',emissiveIntensity:.55,roughness:.32});
 const amber=new T.MeshStandardMaterial({color:'#dfae65',emissive:'#a3682f',emissiveIntensity:.3,roughness:.5});
 const clear=new T.MeshStandardMaterial({color:'#75a5b8',transparent:true,opacity:.22,depthWrite:false,roughness:.3,side:T.DoubleSide});
 function mesh(parent,geometry,mat,x=0,y=0,z=0){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=!mat.transparent;m.receiveShadow=true;parent.add(m);return m;}
 const box=(p,w,h,d,x,y,z,m=ink)=>mesh(p,new T.BoxGeometry(w,h,d),m,x,y,z);
 const group=(p,x=0,y=0,z=0)=>{const g=new T.Group();g.position.set(x,y,z);p.add(g);return g;};
 function line(p,points,mat=cyan,r=.023){const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));return mesh(p,new T.TubeGeometry(curve,24,r,8,false),mat);}
 function caption(p,text,x,y,z,w=1.7){const c=document.createElement('canvas');const ctx=c.getContext('2d');ctx.font='600 40px Arial';c.width=Math.max(300,Math.ceil(ctx.measureText(text).width+40));c.height=80;ctx.fillStyle='#daedf1';ctx.font='600 40px Arial';ctx.textAlign='center';ctx.fillText(text,c.width/2,53);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const label=new T.Sprite(new T.SpriteMaterial({map,depthWrite:false,depthTest:false,transparent:true}));label.position.set(x,y,z);label.scale.set(w,w*c.height/c.width);label.renderOrder=5;p.add(label);return label;}
 function check(p,x,y,z,s=.35,mat=cyan){return line(p,[[-s*.8+x,y,z],[-s*.2+x,y-s*.55,z],[s+x,y+s*.65,z]],mat,.035);}
 function documentModel(p,x,y,z,scale=1){const g=group(p,x,y,z);g.scale.setScalar(scale);box(g,.88,1.17,.028,0,0,0,pale);box(g,.56,.06,.015,-.035,.35,.024,ink);for(let i=0;i<5;i++)box(g,.58-(i%3)*.09,.025,.015,-.04,.17-i*.12,.024,metal);return g;}
 function badge(p,x,y,z){const g=group(p,x,y,z);box(g,.88,1.22,.07,0,0,0,pale);box(g,.88,.19,.075,0,.4,0,ink);mesh(g,new T.SphereGeometry(.13,20,12),metal,0,.12,.06);box(g,.4,.12,.025,0,-.1,.05,metal);for(let i=0;i<5;i++)box(g,.018+(i%2)*.025,.17,.02,-.22+i*.1,-.39,.05,ink);caption(g,'STAFF ID',0,.67,.01,1.1);return g;}
 function lock(p,x,y,z){const g=group(p,x,y,z);box(g,.47,.36,.17,0,-.05,0,ink);const shackle=mesh(g,new T.TorusGeometry(.16,.038,10,30,Math.PI),gold,0,.12,0);box(g,.04,.13,.015,0,-.04,.092,gold);return {g,shackle};}
 function queue(stage,x,z,label='SECURE QUEUE'){
  const stack=group(stage,x,1.9,z);const docs=Array.from({length:3},(_,i)=>documentModel(stack,(i-1)*.23,i*.14,-i*.15,.9));
  caption(stack,label,0,1,0,2.2);const locked=lock(stack,.72,-.43,.23);
  return t=>{docs.forEach((d,i)=>{const u=ease((t-i*.42)/1.4);d.position.y=i*.14+(1-u)*.6;d.position.x=(i-1)*.23-(1-u)*1.1;d.scale.setScalar(.5+.4*u);});locked.g.rotation.y=Math.sin(Math.min(t,2)*2)*.1;};
 }
 function authenticate(stage){
  const card=badge(stage,3.4,2,1.8),reader=group(stage,3.77,1.3,.76);
  const ring=mesh(reader,new T.TorusGeometry(.46,.027,10,60),cyan,0,.27,.12);caption(reader,'IDENTITY CHECK',-.3,1.28,.1,2.1);
  const verified=check(reader,-.3,.67,.2,.35);const closed=lock(reader,.38,.1,.13);
  return t=>{const u=ease(t/1.6);card.position.set(3.1+.6*u,2.1-.6*u,1.95-.9*u);card.rotation.y=-.15+.15*u;card.scale.setScalar(.92-.37*u);ring.scale.setScalar(.65+.35*Math.sin(Math.min(t,2)*2)**2);verified.visible=t>1.7;closed.g.visible=true;};
 }
 function policy(stage,exception=false){
  const gates=group(stage,0,1.85,.5);const rows=[];
  for(let i=0;i<3;i++){
   const card=group(gates,(i-1)*1.05,0,-.14*Math.abs(i-1));box(card,.96,1.34,.045,0,0,0,ink);box(card,.88,1.23,.03,0,0,.04,clear);
   caption(card,['IDENTITY','POLICY','APPROVAL'][i],0,.83,.07,1.03);
   const mark=group(card);if(i===2&&exception){line(mark,[[0,.45,.1],[-.26,-.03,.1],[.26,-.03,.1],[0,.45,.1]],amber,.023);box(mark,.035,.17,.025,0,.21,.13,amber);box(mark,.035,.035,.025,0,.075,.13,amber);}else check(mark,0,.14,.1,.24);
   for(let j=0;j<3;j++)box(card,.55,.025,.025,0,-.18-j*.12,.08,metal);
   rows.push({card,mark});
  }
  const token=documentModel(stage,-1.4,1.2,1.0,.42);
  return t=>{rows.forEach(({card,mark},i)=>{const u=ease((t-i*.7)/.85);card.position.y=(1-u)*-.58;mark.visible=u>.5;card.rotation.y=(1-u)*-.45;});token.position.x=-1.4+2.8*ease(t/3);};
 }
 function release(stage){
  const pages=Array.from({length:2},()=>documentModel(stage,3.45,1.02,.53,.75));
  pages.forEach(p=>p.rotation.x=-Math.PI/2);
  const audit=group(stage,1.85,1.75,.65);box(audit,1.1,1.38,.06,0,0,0,ink);caption(audit,'AUDIT LOG',0,.9,0,1.2);
  const entries=Array.from({length:3},(_,i)=>{const row=group(audit,0,.39-i*.37,.06);box(row,.6,.025,.03,.04,0,0,pale);check(row,-.4,0,.02,.07);return row;});
  return t=>{pages.forEach((p,i)=>{const u=ease((t-i*.8)/1.8);p.visible=t>i*.8;p.position.set(3.45,1.02-i*.023,.53+u*.98);});entries.forEach((row,i)=>{row.visible=t>1.1+i*.5;});};
 }
 const ease=n=>{n=Math.min(1,Math.max(0,n));return n*n*(3-2*n);};
 const view=(target,radius=2.25,yaw=.16,pitch=.28)=>({target,radius,distance:radius*2.75,yaw,pitch});
 let views,actions=[()=>{},()=>{},()=>{},()=>{}];

 if(kind==='finance'||kind==='healthcare'){
  actions[0]=queue(stages[0],-3.6,.95,kind==='healthcare'?'RECEPTION REQUEST':'HELD / NOT PRINTED');
  actions[1]=authenticate(stages[1]);
  if(kind==='finance'){
   actions[2]=policy(stages[2]);actions[3]=release(stages[3]);
   views=[view([-3.6,1.5,.65],2.05),view([3.6,1.6,.8],1.85,-.24),view([0,1.6,.3],2.1),view([2.7,1.4,.65],2.0,-.2,.35)];
  }else{
   actions[2]=release(stages[2]);
   const handover=documentModel(stages[3],-2,1.6,1.5,1.1);const receipt=group(stages[3],-3.6,1.25,1.5);caption(receipt,'HANDOVER RECORDED',0,1.45,0,2.6);const ok=check(receipt,.75,.3,.1,.4);
   actions[3]=t=>{const u=ease(t/2.6);handover.position.x=-1.5-2.1*u;handover.position.y=1.85-.35*u;handover.rotation.x=-.25*u;ok.visible=t>2;};
   views=[view([-3.6,1.5,.65],2.1),view([3.6,1.6,.8],1.85,-.24),view([2.7,1.4,.65],2,-.2,.35),view([-3.4,1.5,1.1],2.2)];
  }
 }else if(kind==='office'){
  actions[0]=queue(stages[0],-3.7,.65,'RECEIPT INBOX');
  const receipt=documentModel(stages[1],-.9,1.9,.65,1.4);const scan=box(stages[1],1.25,.045,.06,-.9,2.5,.73,cyan);
  const fields=['DATE','AMOUNT','MERCHANT'].map((name,i)=>{const g=group(stages[1],.9,2.48-i*.52,.65);box(g,1.4,.39,.09,0,0,0,ink);caption(g,name,0,0,.07,1.15);return g;});
  actions[1]=t=>{scan.position.y=2.6-1.4*((t*.33)%1);fields.forEach((f,i)=>{f.visible=t>.4+i*.6;f.position.x=.9+.25*(1-ease((t-i*.6)/1.1));});};
  actions[2]=policy(stages[2],true);
  const approved=documentModel(stages[3],1.4,1.7,.7,.9);const archive=group(stages[3],3.5,1.7,.7);box(archive,1.25,.9,.25,0,0,0,ink);box(archive,1.3,.2,.2,0,.42,.05,metal);caption(archive,'ERP / POSTED',0,.86,0,1.8);const posted=check(archive,0,0,.2,.3);
  actions[3]=t=>{const u=ease(t/2.8);approved.position.set(1.4+2.1*u,2.1-.6*u,.85-u*.1);approved.rotation.y=u*-.3;approved.scale.setScalar(.9-.35*u);posted.visible=t>2.3;};
  views=[view([-3.7,1.4,.7],2.1),view([0,1.9,.5],2.15),view([0,1.6,.3],2.1),view([3,1.5,.55],2.15,-.2)];
 }else if(kind==='commerce'){
  const bag=(parent,x,y,z)=>{const g=group(parent,x,y,z);box(g,.7,.85,.34,0,0,0,gold);mesh(g,new T.TorusGeometry(.21,.028,10,28,Math.PI),metal,0,.42,0);return g;};
  const browsing=[bag(stages[0],-4.1,1.5,.8),bag(stages[0],-3.1,1.5,.8)];caption(stages[0],'BRAND STORE',-3.6,2.55,.8,2.1);
  actions[0]=t=>browsing.forEach((b,i)=>b.rotation.y=Math.sin(t*.7+i)*.25);
  const signals=['VIEW','SAVE','EXIT SIGNAL'].map((name,i)=>{const g=group(stages[1],-1.2+i*1.1,1.65+i*.35,.6);box(g,1.1,.67,.1,0,0,0,ink);caption(g,name,0,.08,.1,1);return g;});
  actions[1]=t=>signals.forEach((g,i)=>{const u=ease((t-i*.45)/1.3);g.position.y=1.1+i*.38+u*.6;g.scale.setScalar(.5+.5*u);});
  const recommendation=group(stages[2],-1.3,1.55,1.55);box(recommendation,1.25,1.85,.09,0,0,0,ink);caption(recommendation,'SELECTED FOR YOU',0,1.2,0,2.25);const selectedBag=bag(recommendation,0,.06,.3);const selectedMark=check(recommendation,.37,-.58,.15,.2);
  actions[2]=t=>{const u=ease(t/2);selectedBag.position.x=-2.2*(1-u);selectedBag.position.z=.3+Math.sin(u*Math.PI)*.8;selectedBag.rotation.y=(1-u)*-1;selectedMark.visible=t>1.5;};
  const feedback=group(stages[3],2.8,1.9,.6);box(feedback,1.9,1.3,.08,0,0,0,ink);caption(feedback,'CAMPAIGN RESPONSE',0,.98,0,2.4);const bars=[0,1,2].map(i=>box(feedback,.3,.28+i*.18,.05,-.6+i*.6,-.15+i*.09,.09,cyan));
  const responseToken=mesh(stages[3],new T.SphereGeometry(.14,20,12),cyan);
  actions[3]=t=>{bars.forEach((b,i)=>b.scale.y=.4+ease((t-i*.4)/1.8));const u=(t*.24)%1;responseToken.position.set(2.8-2.8*u,2.1+Math.sin(u*Math.PI)*.45,.7-1.4*u);};
  views=[view([-3.6,1.5,.6],2.15),view([0,1.9,.6],2.25),view([-1.3,1.6,1.45],2),view([2,1.8,.1],2.7,-.15)];
 }else if(kind==='energy'){
  const rays=[];for(let i=0;i<4;i++)rays.push(line(stages[0],[[-4.5+i*.6,3,-.4],[-4.5+i*.6,.85,.2]],cyan,.035));
  caption(stages[0],'GENERATION',-3.5,2.85,.6,2.2);actions[0]=t=>rays.forEach((r,i)=>r.scale.y=.55+.45*Math.sin(t*1.6+i)**2);
  const demand=[];for(let i=0;i<3;i++)demand.push(box(stages[1],.36,1,.36,2.8+i*.7,2.4,.85,i===2?amber:cyan));caption(stages[1],'RISING DEMAND',3.5,3.25,.7,2.2);
  actions[1]=t=>demand.forEach((b,i)=>{const h=.2+(1+i*.35)*ease((t-i*.35)/1.8);b.scale.y=h;b.position.y=1.98+h*.5;});
  const cells=[];for(let i=0;i<6;i++)cells.push(box(stages[2],.43,.68,.3,-.67+(i%3)*.65,1.35+Math.floor(i/3)*.82,1.8,cyan));caption(stages[2],'AVAILABLE STORAGE',0,3.08,1.8,2.8);
  actions[2]=t=>cells.forEach((c,i)=>{const u=ease(t/2);c.position.x=(-.67+(i%3)*.65)*(1+.3*u);c.position.z=1.8+.5*u;c.rotation.y=.12*u;});
  const route=[new T.Vector3(.3,1.6,1.8),new T.Vector3(1.8,2,1.2),new T.Vector3(3.5,1.5,.7)];line(stages[3],route.map(v=>v.toArray()),cyan,.065);const dots=Array.from({length:4},()=>mesh(stages[3],new T.SphereGeometry(.13,16,10),cyan));const curve=new T.CatmullRomCurve3(route);caption(stages[3],'ESS → BUILDING',1.8,2.7,1.5,2.7);
  actions[3]=t=>dots.forEach((dot,i)=>dot.position.copy(curve.getPointAt((t*.25+i*.25)%1)));
  views=[view([-3.5,1.5,0],2.6,.1,.4),view([3.5,1.7,.1],2.55,-.2,.35),view([0,1.8,1.6],2.2),view([1.8,1.6,1],3.1,-.1,.35)];
 }else if(kind==='factory'){
  views=[view([-2.8,1.2,0],3.05,.3,.42),view([0,1.8,0],2.3,.16,.3),view([0,1.35,0],1.7,.12,.62),view([2.3,1.2,1.5],2.6,.12,.54)];
  const frame=group(stages[2],0,1.37,0);line(frame,[[-.78,.01,-.72],[.78,.01,-.72],[.78,.01,.72],[-.78,.01,.72],[-.78,.01,-.72]],amber,.035);caption(stages[2],'CRACK LOCATED',0,2.2,.6,2.1);
 }else{
  views=[view([0,1.4,0],6.1,.1,.5),view([3.1,1.2,-1.2],2.8,.15,.4),view([3.2,1.5,1.5],2.7,.1,.3),view([3.2,1.5,1.5],2.7,-.15,.3)];
  const record=group(stages[3],3.3,2.1,1.6);box(record,1.4,1.25,.09,0,0,0,ink);caption(record,'EVENT RECORDED',0,.9,0,2);const ok=check(record,0,.15,.1,.32);actions[3]=t=>ok.scale.setScalar(.6+.4*ease(t/1.4));
 }
 // Only the selected action occupies the foreground. Hardware remains contextual.
 const originalUpdate=model.update.bind(model);
 model.autoRotate=false;
 model.setOverview=value=>{overview=Boolean(value);originalSprites.forEach(s=>s.visible=overview);};
 model.getView=phase=>views[Math.max(0,Math.min(3,phase))];
 model.update=({phase=0,time=0,reducedMotion=false}={})=>{
  originalUpdate({phase,time,reducedMotion});
  const t=reducedMotion?4:Math.min(time,5.8);
  originalSprites.forEach(s=>s.visible=overview);stages.forEach((g,i)=>{g.visible=i===phase;});actions[phase](t);
  root.updateMatrixWorld(true);
 };
 model.update();return model;
}
