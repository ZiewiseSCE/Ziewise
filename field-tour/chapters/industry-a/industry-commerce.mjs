import {label,line,imageCover,framedScreen} from './industry-fixtures.mjs';
const pi=Math.PI;
const sat=(x)=>Math.min(1,Math.max(0,x));

function storeScreen(c,w,h,p=0,photo=null) {
  c.fillStyle='#f0ece3';c.fillRect(0,0,w,h);c.fillStyle='#32473b';c.fillRect(0,0,w,64);
  label(c,'자사몰',22,45,31,'#f0eddf',700);label(c,'•••',w-22,43,24,'#e2e1ce',600,'right');
  c.fillStyle='#b8ae93';c.fillRect(0,64,w,212);imageCover(c,photo,0,64,w,212);
  label(c,'스킨케어',22,327,44,'#263b31',730);
  label(c,'고객 탐색 예시',22,366,23,'#647065',500);
  for(const [i,title] of ['보습 세럼','데일리 크림'].entries()){
    const y=398+i*84;c.fillStyle=(p>.22&&i===0)?'#d4dfc9':'#e2dfd2';c.fillRect(17,y,w-34,65);
    label(c,title,32,y+43,27,'#334636',650);label(c,i===0&&p>.22?'관심':'›',w-30,y+42,22,'#607255',600,'right');
  }
  line(c,[20,h-68],[w-20,h-68],'#bfc7b9',2);label(c,'동의한 탐색 이력',22,h-31,21,'#637062',530);
}
function merchant(c,w,h,p=0){
  c.fillStyle='#263a37';c.fillRect(0,0,w,h);c.fillStyle='#344e45';c.fillRect(0,0,w,59);
  label(c,'ZiewCore M-Pulse',26,40,28,'#e4edda',680);
  const decision=p>.70;
  label(c,decision?'적용 범위 검토':'추천 후보 비교',26,110,43,'#f0f0e3',740);
  label(c,decision?'먼저 보여줄 방문자군':'상품 관심 · 구매 흐름',27,148,22,'#b8c9bd',530);
  for(const [i,name] of (decision?['제한된 방문자군','전체 적용 전 확인']:['신규 방문자','재방문자']).entries()){
    const y=179+i*58;
    c.fillStyle=decision&&i===0?'#526b55':'#354c46';c.fillRect(25,y,w-50,45);
    label(c,name,40,y+31,23,'#dce6d7',600);label(c,decision&&i===0?'검토 중':'›',w-42,y+31,20,'#c6d9ad',600,'right');
  }
}

function packageLabels(K){
  const result={};
  for(const [type,typeEn,nr,tint] of [
    ['보습 세럼','SERUM','01','#e1dfc9'],['데일리 로션','LOTION','02','#e3dfce'],['데일리 크림','CREAM','03','#dcddc9'],['클렌저','CLEANSER','04','#d7d6bd']
  ]){
    result[typeEn]=K.surface(450,260,(c,w,h)=>{
      c.fillStyle=tint;c.fillRect(0,0,w,h);c.fillStyle='#7d8871';c.fillRect(18,15,w-36,3);
      label(c,'SKIN  CARE',w/2,55,21,'#43533e',680,'center');
      c.fillStyle='#40543d';c.textAlign='center';c.font='500 51px Georgia,serif';c.fillText(typeEn,w/2,126);c.textAlign='left';
      label(c,type,w/2,165,27,'#455440',560,'center');
      label(c,'FORMULA   '+nr,w/2,223,17,'#66705d',620,'center');
    },typeEn+' printed label',true).material;
  }
  return result;
}

function products(K) {
  const {T,m,coat,std,mesh,group,lathe,box,cyl,bevel}=K,labels=packageLabels(K);
  const white=coat('ivory PET bottle',0xd5d6c3,.12,.29),brass=coat('champagne metal closure',0xb29f76,.77,.28);
  const powder=coat('olive lacquered cap',0x747c5c,.29,.34),oil=coat('amber serum behind glass',0x5d5529,.04,.24);
  const glass=coat('clear olive glass wall',0xadb298,.045,.16,{transparent:true,opacity:.27,depthWrite:false,ior:1.48,envMapIntensity:1.30,clearcoat:.84});
  const jar=coat('frosted cream jar',0xd1d5bc,.12,.29),bulb=std('pipette rubber',0xe1ddca,.04,.68);
  function printed(par,type,r,base,height,arc=2.82){
    const angle=-arc/2,g=K.geo(['wrap',type,r,base,height,arc].join('/'),()=>new T.CylinderGeometry(r,r,height,44,1,true,angle,arc));
    const o=mesh(par,g,labels[type],0,base,0);o.castShadow=false;
  }
  function bottle(parent,type,x,y,z,scale=1,angle=0) {
    const g=group(parent,type+' retail sample',x,y,z);g.scale.setScalar(scale);g.rotation.y=angle;
    if(type==='SERUM'){
      const profile=[[.001,.003],[.038,.003],[.045,.008],[.047,.019],[.047,.122],[.045,.142],[.041,.155],[.023,.169],[.020,.176],[.020,.185]];
      lathe(g,0,0,0,'glass dropper body',profile,glass,52);
      lathe(g,0,.006,0,'serum filled volume',[[.001,0],[.036,0],[.043,.007],[.043,.113],[.042,.130],[.035,.137],[.0002,.136]],oil,48);
      cyl(g,0,.175,0,.023,.024,brass,'y',40);cyl(g,0,.193,0,.028,.032,brass,'y',44);
      const bulbProfile=[[.020,.000],[.020,.009],[.017,.016],[.016,.038],[.013,.050],[.006,.057],[.001,.057]];
      lathe(g,0,.205,0,'soft dropper bulb',bulbProfile,bulb);
      for(const a of [.180,.184,.188])cyl(g,0,a,0,.0284,.0014,powder,'y',40);
      printed(g,'SERUM',.0477,.076,.072);
    }else if(type==='LOTION'){
      lathe(g,0,0,0,'lotion pump body',[[.001,.002],[.046,.002],[.053,.009],[.054,.027],[.053,.173],[.051,.200],[.043,.213],[.026,.224],[.023,.230]],white);
      cyl(g,0,.232,0,.027,.029,brass,'y',40);cyl(g,0,.251,0,.014,.028,m.cream,'y',32);
      bevel(g,0,.272,.015,.047,.023,.078,white,.17);bevel(g,0,.266,.043,.033,.018,.071,white,.18);
      printed(g,'LOTION',.0546,.102,.083);
    }else if(type==='CREAM'){
      lathe(g,0,0,0,'frosted cream jar',[[.001,.002],[.060,.002],[.068,.010],[.070,.023],[.070,.075],[.067,.091],[.062,.097],[.062,.11]],jar);
      cyl(g,0,.108,0,.070,.027,powder,'y',54);cyl(g,0,.121,0,.0695,.006,brass,'y',48);
      cyl(g,0,.125,0,.068,.006,powder,'y',48);printed(g,'CREAM',.0706,.054,.045,2.47);
    }else{
      const tube=lathe(g,0,0,0,'squeeze tube profile',[[.001,.005],[.031,.005],[.034,.032],[.041,.056],[.049,.147],[.054,.187],[.052,.200],[.002,.201]],white,40);
      tube.scale.z=.62;
      cyl(g,0,.015,0,.035,.029,powder,'y',36);box(g,0,.198,0,.111,.012,.016,m.cream);
      const sticker=K.face(g,0,.132,.030,.065,.061,labels.CLEANSER);sticker.rotation.x=-.07;
    }
    return g;
  }
  const ctn=std('uncoated sage carton',0x919a76,.055,.62);
  function carton(p,x,y,z,kind='SERUM',size=1,rot=0){
    const g=group(p,'folded retail carton',x,y,z);g.rotation.y=rot;g.scale.setScalar(size);
    const h=kind==='CREAM'?.116:.211,w=kind==='CREAM'?.132:.103,d=w*.79;
    bevel(g,0,h/2,0,w,h,d,ctn,.022);
    K.face(g,0,h*.49,d*.51,w*.80,h*.64,labels[kind]);box(g,0,h+.0008,-.006,w*.92,.0015,.0018,m.paper);
    return g;
  }
  return {bottle,carton};
}

function consultationArchitecture(K,root,prods){
  const {T,m,group,mesh,box,cyl,bevel,skin,face,std}=K;
  skin(m.oak,'quarter-oak.webp',true,'map',1,1,true);skin(m.oak,'quarter-oak-rough.webp',false,'roughnessMap');
  skin(m.stone,'honed-slab.webp',true,'map',1,1,true);skin(m.stone,'honed-slab-rough.webp',false,'roughnessMap');
  const floor=std('stone boutique floor',0xd0c8aa,.04,.56);skin(floor,'cream-stone.webp',true,'map',4,3,true);skin(floor,'cream-stone-rough.webp',false,'roughnessMap',4,3);
  box(root,0,-.064,-.56,8.2,.128,5.14,floor);
  box(root,0,1.59,-2.94,8.3,3.18,.12,m.plaster);
  const ceiling=box(root,0,3.148,-.69,7.1,.118,5.80,m.plaster);ceiling.castShadow=false;
  for(const s of [-1,1]){
    box(root,s*3.47,1.58,-1.90,.129,3.16,2.48,m.plaster);
    box(root,s*3.395,.073,-1.91,.017,.144,2.47,m.brass);
  }
  const alcove=group(root,'arched product alcove',.94,.21,-2.67);
  const width=1.85,rad=.925,spring=1.53,total=2.69;
  const sh=new T.Shape();sh.moveTo(-1.56,0);sh.lineTo(1.56,0);sh.lineTo(1.56,total);sh.lineTo(-1.56,total);sh.closePath();
  const hole=new T.Path();hole.moveTo(-rad,.30);hole.lineTo(-rad,spring);hole.absarc(0,spring,rad,Math.PI,0,true);hole.lineTo(rad,.30);hole.closePath();sh.holes.push(hole);
  const clay=std('stone lintel',0xc2c1ad,.05,.73);
  const fill=mesh(alcove,new T.ExtrudeGeometry(sh,{depth:.18,bevelEnabled:true,bevelSize:.011,bevelThickness:.012,bevelSegments:2,curveSegments:30}),clay);fill.receiveShadow=true;
  const sage=std('deep green display niche',0x657462,.10,.68);
  box(alcove,0,1.11,-.136,1.98,2.35,.052,sage);
  for(const y of [.67,1.245]){
    box(alcove,0,y,-.003,width-.078,.050,.32,m.oak);box(alcove,0,y-.026,.085,width-.145,.009,.052,m.glow);
    for(let j=0;j<7;j++){
      const x=-.73+j*.238,kind=['SERUM','LOTION','CREAM','CLEANSER'][(j+(y>1?1:0))%4];
      if(j===2||j===5)prods.carton(alcove,x,y+.027,-.010,kind,1.06,(j-3)*.035);
      else prods.bottle(alcove,kind,x,y+.027,-.008,1.04,(j-3)*.103);
    }
  }
  for(let i=0;i<23;i++)box(root,-3.14+i*.11,1.48,-2.596,.048,2.95,.063,m.oak);
  const poster=group(root,'framed skincare campaign',-1.24,1.63,-2.41);
  bevel(poster,0,0,0,1.57,1.16,.064,m.brass,.028);
  box(poster,0,0,.030,1.513,1.106,.020,m.paper);
  const photo=new T.MeshBasicMaterial({name:'existing skincare campaign photograph',color:0x9b9b7e,toneMapped:false});
  skin(photo,'skincare-campaign.webp',true,'map',1,1,true);
  face(poster,0,0,.042,1.441,.959,photo);
  const bench=group(root,'boutique sample cabinets',-1.29,0,-2.07);
  box(bench,0,.375,0,1.83,.64,.47,m.oak);box(bench,0,.719,0,1.88,.058,.50,m.stone);
  for(const x of [-.596,0,.596]){bevel(bench,x,.394,.242,.556,.552,.019,m.oak,.026);box(bench,x,.596,.258,.128,.012,.022,m.brass);}
  prods.bottle(bench,'LOTION',-.45,.748,-.005,1.14);prods.bottle(bench,'CREAM',-.17,.748,.012,1.0);
  prods.carton(bench,.47,.748,-.019,'SERUM',1.20,-.10);
  // A real pendant, visible on the wide camera but above the working plane.
  for(const x of [-1.78,.04,1.76]){
    cyl(root,x,2.81,-1.12,.005,.56,m.black,'y',8);
    cyl(root,x,2.49,-1.12,.055,.098,m.brass,'y',24);
    const shade=K.lathe(root,x,2.319,-1.12,'turned pendant dome',[[.160,0],[.164,.010],[.159,.044],[.137,.078],[.109,.113],[.063,.147],[.036,.153]],m.cream,48);
    cyl(root,x,2.318,-1.12,.147,.007,m.glow,'y',40);
  }
}

function consultationCounter(K,root){
  const {m,group,box,bevel}=K,g=group(root,'skincare consultation island',0,0,.03);
  bevel(g,0,.053,0,2.96,.106,.65,m.graphite,.046);
  bevel(g,0,.495,0,3.12,.778,.727,m.oak,.041);
  for(let j=0;j<45;j++)box(g,-1.491+j*.068,.51,.370,.022,.705,.018,m.oak);
  box(g,0,.865,.372,2.985,.017,.022,m.brass);
  bevel(g,0,.927,0,3.23,.118,.856,m.stone,.039);
  box(g,0,.884,.408,3.065,.011,.014,m.brass);
}
function touchStand(K,root,x,z,orientation,ui){
  const {m,group,bevel,cyl,rail}=K,g=group(root,'retail consultation terminal',x,.989,z);
  g.rotation.y=orientation;
  bevel(g,0,.020,0,.315,.039,.248,m.brass,.085);
  const portrait=orientation>0;
  rail(g,[0,.026,-.040],[0,.249,-.085],.038,.040,m.brass);
  cyl(g,0,.242,-.084,.041,.080,m.graphite,'x');
  const w=portrait?.289:.502,h=portrait?.468:.340;
  const centerY=portrait?.330:.286;
  framedScreen(K,g,0,centerY,-.048,w,h,ui,{tilt:-.17});
  return g;
}
export function commerce(K,root) {
  const {T,m,group,box,cyl,bevel,surface}=K;
  const prods=products(K);consultationArchitecture(K,root,prods);consultationCounter(K,root);
  let photo=null,phase=0;
  const shop=surface(350,618,(c,w,h,p=0)=>storeScreen(c,w,h,p,photo),'brand storefront portrait station');
  K.promises.push(K.tex('skincare-campaign.webp',true).then(t=>{if(t?.image){photo=t.image;shop.draw(phase);}}));
  touchStand(K,root,-.94,.12,.13,shop);
  const operator=surface(535,338,merchant,'limited cohort operator tablet');
  touchStand(K,root,.95,.13,-.19,operator);
  const shelf=group(root,'sample selection display',-.02,.986,.065);
  cyl(shelf,0,.026,0,.279,.052,m.brass,'y',80);
  cyl(shelf,0,.054,0,.271,.010,m.graphite,'y',80);
  cyl(shelf,0,.076,0,.266,.035,m.stone,'y',82);
  const turn=K.dynamic(group(shelf,'rotating comparison sample',0,.096,0));
  prods.bottle(turn,'SERUM',.026,0,.011,1.24,-.05);
  const comparison=group(root,'second recommendation sample',.416,.989,-.070);
  cyl(comparison,0,.029,0,.126,.058,m.cream,'y',52);prods.bottle(comparison,'CREAM',0,.058,.003,1.13,.11);
  prods.carton(root,-.353,.989,-.102,'LOTION',1.16,-.18);prods.bottle(root,'LOTION',-.463,.989,.061,1.05,-.08);
  if(typeof document!=='undefined'){
    const cv=document.createElement('canvas');cv.width=cv.height=64;const cut=cv.getContext('2d');
    const grad=cut.createRadialGradient(32,32,4,32,32,32);grad.addColorStop(0,'rgba(32,28,15,.52)');grad.addColorStop(.55,'rgba(34,29,17,.33)');grad.addColorStop(1,'rgba(34,29,17,0)');cut.fillStyle=grad;cut.fillRect(0,0,64,64);
    const mat=new T.MeshBasicMaterial({name:'diffuse product contact',map:new T.CanvasTexture(cv),transparent:true,depthWrite:false,toneMapped:false});
    for(const [p,x,y,z,w,d] of [[shelf,.025,.094,.009,.173,.152],[comparison,0,.059,.004,.195,.177],[root,-.46,.989,.061,.159,.133],[root,-.352,.989,-.098,.173,.140]]){
      const mark=K.face(p,x,y,z,w,d,mat);mark.rotation.x=-pi/2;
    }
  }
  const sampleLight=K.dynamic(cyl(shelf,.171,.096,.107,.011,.005,m.brass,'y',22));
  // An ordinary handset in its cradle complements the larger assisted-shopping screen.
  const phone=group(root,'customer handset',-.656,.989,.288);phone.rotation.y=.32;phone.rotation.x=-.37;
  bevel(phone,0,.082,0,.087,.163,.010,m.graphite,.10);
  K.face(phone,0,.083,.0059,.077,.145,shop.material);
  const swatches=group(root,'sample cards',.585,.994,.29);swatches.rotation.y=-.15;
  for(let j=0;j<3;j++){
    const card=box(swatches,.008*j,.002+j*.002,-.008*j,.127,.003,.086,j===2?m.paper:m.cream);card.rotation.y=(j-1)*.09;
  }
  let previous=-1;
  return {anchors:[new T.Vector3(-.925,1.327,.098),new T.Vector3(.005,1.265,.112),new T.Vector3(.95,1.295,.133)],
    update(p){
      phase=p;
      const t=sat((p-.22)/.49);turn.rotation.y=-.52+1.10*t*t*(3-2*t);
      sampleLight.material=p>.38?m.green:m.brass;
      const current=Math.floor(p*12);if(previous!==current){previous=current;shop.draw(p);operator.draw(p);}
    }};
}
