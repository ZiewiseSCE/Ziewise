import {label,line,framedScreen} from './industry-fixtures.mjs';
const tau=Math.PI*2;
const clip=(a,b,v)=>Math.max(0,Math.min(1,(v-a)/(b-a)));

function forecast(c,w,h,p=.02){
  c.fillStyle='#203337';c.fillRect(0,0,w,h);
  c.fillStyle='#2b4647';c.fillRect(0,0,w,68);
  label(c,'Neuro-VPP',36,45,32,'#e6efcf',750);label(c,'운영 관제  /  예시',w-32,44,23,'#c9dad4',500,'right');
  const forecastOn=p>=.25;
  label(c,forecastOn?'내일의 예상 수요':'시간대별 사용 이력',38,135,52,'#f1f2e6',700);
  const l=65,r=w-52,top=205,b=h-92;
  for(let i=0;i<4;i++)line(c,[l,top+(b-top)*i/3],[r,top+(b-top)*i/3],'#415255',1.6);
  const getY=(f,expected)=>b-(b-top)*(.17+.13*Math.cos((f-.27)*8)+.41*Math.exp(-((f-.715)**2)/.023)+.15*Math.exp(-((f-.41)**2)/.019)+(expected?.13*Math.exp(-((f-.72)**2)/.016):.05*Math.sin(f*20)));
  if(forecastOn){
    c.fillStyle='rgba(211,174,101,.18)';c.fillRect(l+(r-l)*.64,top-5,(r-l)*.15,b-top+5);
    label(c,'부하 집중',l+(r-l)*.715,top-17,22,'#e8c68f',650,'center');
  }
  const curve=(expected,until,color,dash=[])=>{
    c.beginPath();c.setLineDash(dash);
    for(let j=0;j<=Math.floor(until*100);j++){const f=j/100,x=l+(r-l)*f,y=getY(f,expected);if(j)c.lineTo(x,y);else c.moveTo(x,y);}
    c.lineWidth=6;c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;c.stroke();c.setLineDash([]);
  };
  curve(false,1,'#94c2bd');
  if(forecastOn)curve(true,.35+.65*clip(.25,.62,p),'#f1be72',[12,8]);
  for(const [i,t] of [[0,'00시'],[.25,'06시'],[.5,'12시'],[.75,'18시'],[1,'24시']])label(c,t,l+(r-l)*i,b+32,20,'#b9c9c7',500,'center');
  line(c,[39,h-28],[78,h-28],'#94c2bd',5);label(c,'사용 이력',90,h-20,22,'#d8e3df',500);
  if(forecastOn){line(c,[302,h-28],[342,h-28],'#f1be72',5);label(c,'예상 수요',356,h-20,22,'#e9d8ba',500);}
}

function dispatch(c,w,h,p=0){
  c.fillStyle='#223634';c.fillRect(0,0,w,h);label(c,'저장장치  /  ESS',22,37,25,'#b5cbbc',550);
  label(c,'운용 일정',21,95,49,'#ecf2e8',740);
  line(c,[23,120],[w-24,120],'#5b6b5f',2);
  label(c,'대상 시간',23,157,22,'#baccc1');label(c,'16—18시',w-25,158,31,'#eeefdf',700,'right');
  c.fillStyle=p>.73?'#526746':'#374847';c.fillRect(22,191,w-44,53);
  label(c,p>.73?'운영자 검토안':'운용안 대기',w/2,226,26,p>.73?'#e3eecc':'#c8d2c9',650,'center');
}

function solarBank(K,root,x,y,z,w,h,angle,foreground=false){
  const {T,m,group,box,face,rod,rail,cyl,fix,lead}=K,g=group(root,'glass and silicon PV module',x,y,z);
  g.rotation.x=-angle;
  box(g,0,0,0,w,h,.047,m.steel);
  face(g,0,0,.0245,w-.029,h-.028,m.pv);
  const trim=.016;
  for(const s of [-1,1]){
    box(g,s*(w/2-.007),0,.020,trim,h,.025,m.steel);
    box(g,0,s*(h/2-.007),.020,w,trim,.026,m.steel);
  }
  if(foreground){
    for(const sx of [-1,1])for(const sy of [-1,1])fix(g,sx*(w/2-.018),sy*(h/2-.018),.035,.006);
    box(g,0,-.06,-.063,.19,.088,.075,m.dark);
    lead(g,[[.062,-.04,-.095],[.14,-.15,-.14],[.24,-.25,-.16],[.38,-.18,-.14]],.011,m.black);
  }
  for(const sx of [-1,1]){
    const X=x+sx*w*.335;
    for(const sy of [-1,1]){
      const syH=sy*(h*.30),downY=y+syH*Math.cos(angle)-.041,downZ=z-syH*Math.sin(angle);
      box(root,X,downY/2,downZ,.037,downY,.047,m.steel);
      box(root,X,.023,downZ,.126,.046,.141,m.dark);
      if(foreground)cyl(root,X+.042,.055,downZ+.041,.013,.018,m.bolt,'y',6);
    }
    rail(root,[X,.18,z+h*.18],[X,y+.12,z-h*.23],.029,.031,m.steel);
  }
  return g;
}

function meter(K,root){
  const {m,group,bevel,cyl,box,rod,fix,face,surface,lead}=K,g=group(root,'field meter and weather sensor',-1.47,0,-.22);
  cyl(g,0,.044,0,.112,.088,m.dark);cyl(g,0,.99,0,.031,1.85,m.steel,'y',24);
  bevel(g,.02,1.30,.009,.263,.342,.13,m.cream);
  const digits=surface(300,185,(c,w,h)=>{
    c.fillStyle='#a7b1a0';c.fillRect(0,0,w,h);label(c,'현장 계량',18,45,34,'#263935',700);
    label(c,'PV  01',18,116,56,'#263935',550);label(c,'시계열 수집',18,159,22,'#263935',520);
  },'field meter LCD',true);
  face(g,.02,1.34,.077,.187,.114,digits.material);cyl(g,.087,1.199,.079,.015,.012,m.green,'z');fix(g,-.082,1.18,.077,.009);
  lead(g,[[.062,1.16,-.03],[.077,.93,-.073],[.07,.76,-.06],[.065,.58,.006]],.013,m.black);
  // Cup anemometer, with the concave bowls open to the same rotational sense.
  const rotor=K.dynamic(group(g,'wind sampling rotor',0,1.950,0));
  cyl(g,0,1.864,0,.042,.089,m.cream);
  cyl(rotor,0,0,0,.033,.055,m.black);
  const bowl=K.geo('anemometer-bowl',()=>new K.T.SphereGeometry(.050,14,8,0,Math.PI*2,0,Math.PI/2));
  const shell=K.std('anemometer polymer',0x9eaaa4,.14,.44,{side:K.T.DoubleSide});
  for(let i=0;i<3;i++){
    const a=i*tau/3,arm=group(rotor,'cup assembly');arm.rotation.y=a;
    rod(arm,[0,0,0],[.138,0,0],.006,m.steel,10);
    K.mesh(arm,bowl,shell,.141,.001,0).rotation.x=Math.PI/2;
  }
  return rotor;
}

function controlCabinet(K,root){
  const {m,group,box,bevel,cyl,fix,lead,face,surface}=K,g=group(root,'weatherproof forecast workstation',.045,0,-.48);
  bevel(g,0,.057,0,.71,.108,.52,m.dark);bevel(g,0,.65,0,.585,1.09,.456,m.dark);
  bevel(g,0,.646,.233,.544,.996,.025,K.std('service green enclosure',0x52645d,.46,.48));
  for(const s of [-1,1])for(const y of [.235,1.048])fix(g,s*.238,y,.252,.010);
  for(let j=0;j<8;j++)box(g,-.023,.48+j*.036,.251,.303,.013,.014,m.black);
  bevel(g,.188,.815,.266,.052,.12,.027,m.steel);
  cyl(g,0,1.236,-.016,.063,.19,m.steel);
  const ui=surface(868,490,forecast,'outdoor demand forecast display');
  const display=framedScreen(K,g,0,1.565,0,1.07,.601,ui,{metal:true,tilt:-.044});
  box(display,0,.333,.052,1.164,.032,.178,m.dark);
  for(const s of [-1,1])box(display,s*.560,.224,.039,.020,.209,.126,m.dark);
  lead(g,[[-.30,1.49,-.04],[-.31,1.24,-.12],[-.20,1.10,-.16]],.013,m.black);
  const id=surface(420,95,(c,w,h)=>{c.fillStyle='#cbd0bf';c.fillRect(0,0,w,h);label(c,'Neuro-VPP / 현장 관제',20,62,36,'#32453c',680);},'forecast kiosk ID',true);
  face(g,-.035,.908,.253,.282,.066,id.material);return ui;
}

function batteryCabinet(K,root){
  const {m,group,box,bevel,cyl,fix,face,surface,lead}=K,g=group(root,'storage operator dispatch station',1.08,0,-.29);
  const enamel=K.std('inverter enamel',0x99aaa5,.40,.45);
  for(const x of [-.245,.245])for(const z of [-.14,.14]){cyl(g,x,.041,z,.062,.082,m.black);cyl(g,x,.101,z,.035,.052,m.steel,'y',6);}
  bevel(g,0,.835,0,.652,1.43,.40,enamel,.023);
  bevel(g,0,.842,.208,.619,1.33,.036,m.dark,.024);
  bevel(g,0,.840,.235,.589,1.30,.025,enamel,.023);
  bevel(g,0,1.591,0,.69,.063,.432,m.dark,.02);
  const ui=surface(350,269,dispatch,'ESS operator planned schedule');
  framedScreen(K,g,0,1.265,.269,.437,.333,ui);
  box(g,-.052,.615,.251,.357,.243,.014,m.black);
  for(let j=0;j<8;j++){
    const blade=box(g,-.051,.518+j*.027,.267,.35,.013,.028,m.steel);blade.rotation.x=-.37;
  }
  for(const s of [-1,1])for(const y of [.25,1.46])fix(g,s*.261,y,.255,.011);
  const selector=K.dynamic(group(g,'schedule selection knob',-.098,.88,.271));
  cyl(g,-.098,.88,.267,.055,.024,m.black,'z');cyl(selector,0,0,.024,.040,.037,m.dark,'z');
  bevel(selector,0,.010,.054,.014,.063,.022,m.steel);
  const led=K.dynamic(cyl(g,.06,.896,.267,.022,.027,m.amber,'z'));
  const tag=surface(360,80,(c,w,h)=>{c.fillStyle='#c9cdbf';c.fillRect(0,0,w,h);label(c,'운영안 선택',16,55,41,'#293e35',680);},'schedule selector legend',true);
  face(g,.058,.81,.256,.204,.047,tag.material);
  for(let j=0;j<4;j++){
    const x=-.192+j*.094;cyl(g,x,.135,.03,.027,.065,m.dark,'y',6);
    lead(g,[[x,.14,.03],[x,.076,-.006],[x+.15,.06,-.16],[x+.16,.06,-.36]],.016,m.black);
  }
  return {ui,led,selector};
}

export function energy(K,root){
  const {T,m,skin,box,face,group,rod,cyl,mesh}=K;
  skin(m.pv,'pv-cell.webp',true,'map',1,1,true);skin(m.pv,'pv-rough.webp',false,'roughnessMap');
  skin(m.floor,'service-concrete.webp',true,'map',3,2,true);
  const slab=box(root,0,-.068,-.35,8.7,.136,5.8,m.floor);slab.receiveShadow=true;
  const panorama=new T.PlaneGeometry(11.6,5.25,30,1),positions=panorama.attributes.position;
  for(let i=0;i<positions.count;i++){const x=positions.getX(i);positions.setZ(i,.025*x*x);}panorama.computeVertexNormals();
  const horizon=new T.MeshBasicMaterial({name:'photographic wind-farm horizon',color:0xa7b7b5,toneMapped:false});
  skin(horizon,'wind-ridge.webp',true,'map',1,1,true);
  const land=mesh(root,panorama,horizon,-.40,2.37,-3.43);land.castShadow=land.receiveShadow=false;
  // Low rail and a utility canopy anchor the foreground in an open-air service bay.
  for(const x of [-2.45,2.45]){
    box(root,x,1.39,-1.10,.088,2.78,.089,m.steel);box(root,x,.034,-1.10,.221,.067,.22,m.dark);
    box(root,x,2.726,-.36,.075,.071,1.62,m.steel);
  }
  box(root,0,2.788,-1.12,5.07,.121,.086,m.steel);
  for(const z of [-.96,-.58,-.20])box(root,0,2.814,z,5.04,.032,.089,m.dark);
  for(const x of [-3.4,-1.75,0,1.75,3.4]){cyl(root,x,.493,-2.35,.027,.968,m.steel);box(root,x,.022,-2.35,.110,.044,.110,m.dark);}
  for(const y of [.47,.945])rod(root,[-3.64,y,-2.35],[3.64,y,-2.35],.022,m.steel);
  for(const x of [-2.39,-.94,.51,1.96])solarBank(K,root,x,.89,-1.78,1.40,.86,1.014);
  const pv=solarBank(K,root,-.99,.93,.005,1.32,.93,.895,true);
  const sensor=meter(K,root),monitor=controlCabinet(K,root),storage=batteryCabinet(K,root);
  // Inverter feed ducts, stainless inspection channel and a drained concrete joint.
  box(root,0,.012,-.92,3.7,.024,.086,m.dark);
  for(let j=0;j<37;j++)box(root,-1.80+j*.1,.025,-.92,.074,.003,.067,m.steel);
  box(root,0,.001,.83,4.41,.001,.006,m.black);
  let state=-1;
  return {anchors:[new T.Vector3(-1.03,1.115,.10),new T.Vector3(.045,1.57,-.432),new T.Vector3(1.07,1.28,.02)],
    update(p){
      sensor.rotation.y=p*14.2;
      storage.selector.rotation.z=-.66+.99*clip(.69,.81,p);
      storage.led.material=p>.72?m.green:m.amber;
      const frame=Math.floor(p*30);if(frame!==state){state=frame;monitor.draw(p);storage.ui.draw(p);}
    }};
}
