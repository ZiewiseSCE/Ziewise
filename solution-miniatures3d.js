import * as THREE from './vendor/three.module.js';

export const solutionMiniatures = [
  { kind: 'vision', name: 'VISION AI', ko: '카메라로 검사·탐지', en: 'Visual inspection', description: ['카메라가 제품과 현장을 살펴 객체·행동·이상 징후를 탐지합니다. 모호한 사례는 다음 학습으로 연결됩니다.', 'Cameras inspect products and operations to detect objects, behaviour and anomalies. Uncertain cases feed the next learning cycle.'] },
  { kind: 'energy', name: 'NEURO-VPP', ko: '발전·저장·전력 운영', en: 'Energy orchestration', description: ['태양광·풍력·ESS를 연결하고, 수요 예측과 전력 신호를 바탕으로 분산 에너지 자원을 운영합니다.', 'Connect solar, wind and storage, then coordinate distributed energy resources using demand forecasts and power signals.'] },
  { kind: 'commerce', name: 'M-PULSE', ko: 'D2C Commerce AI', en: 'D2C Commerce AI', description: ['브랜드의 자사 판매 채널에서 고객 행동을 분석하고, 개인화 추천·캠페인·이탈 대응을 연결하는 커머스 AI입니다.', 'Commerce AI for a brand’s direct-to-consumer channels, connecting customer behaviour analysis with personalised recommendations, campaigns and retention.'] },
  { kind: 'office', name: 'SIGMING', ko: '문서·정산 업무 자동화', en: 'Document automation', description: ['영수증과 업무 문서에서 정보를 읽고 규정을 확인해, 검토·승인·정산 과정을 자동화합니다.', 'Extract information from receipts and documents, check policies and automate review, approval and expense workflows.'] },
  { kind: 'print', name: 'ZIEWPRINT', ko: '인증 후 안전한 출력', en: 'Authenticated printing', description: ['사용자 인증과 출력 승인을 거쳐 문서를 내보내고, 워터마크와 이력 관리로 인쇄 보안을 강화합니다.', 'Release documents after authentication and approval, with watermarks and print history supporting document security.'] },
  { kind: 'observer', name: 'OBSERVER', ko: '서버·서비스 이상 관제', en: 'Service observability', description: ['서버·네트워크·애플리케이션의 상태와 성능을 함께 살펴, 이상 징후와 운영 이슈를 파악합니다.', 'Monitor server, network and application health together to identify anomalies and operational issues.'] },
];

/** Small physical models, shared by the neural overview and the data-to-action scene. */
export function createSolutionMiniature(kind) {
  const root = new THREE.Group(), resources = new Set(), animate = [], outcomes=[];
  const keep = r => { resources.add(r); return r; };
  const mat = (color, metalness = .5, roughness = .4) => keep(new THREE.MeshStandardMaterial({ color, metalness, roughness }));
  const graphite = mat('#25343e'), metal = mat('#95a8b2', .8, .29), dark = mat('#101e27', .25, .6), paper = mat('#d6e2e7', .05, .75), teal = mat('#528f9d', .4, .35);
  const light = keep(new THREE.MeshStandardMaterial({ color:'#a2d6d7', emissive:'#549ca6', emissiveIntensity:.55, metalness:.4, roughness:.35 }));
  function mesh(geo, material, x=0,y=0,z=0,parent=root) { const m=new THREE.Mesh(keep(geo),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m; }
  const box = (w,h,d,x,y,z,m=graphite,parent=root) => mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);
  const cyl = (r,h,x,y,z,m=metal,parent=root) => mesh(new THREE.CylinderGeometry(r,r,h,16),m,x,y,z,parent);
  function path(points,color='#82b9c5',parent=root){const g=keep(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))));const l=new THREE.Line(g,keep(new THREE.LineBasicMaterial({color})));parent.add(l);return l;}
  function screen(w,h,x,y,z,style='chart',parent=root){
    box(w+.06,h+.06,.065,x,y,z,dark,parent);
    const c=document.createElement('canvas');c.width=512;c.height=320;const ctx=c.getContext('2d');
    ctx.fillStyle='#10232e';ctx.fillRect(0,0,512,320);ctx.fillStyle='#75a3b4';ctx.fillRect(24,23,132,9);ctx.fillStyle='#263f4c';ctx.fillRect(24,50,464,2);
    if(style==='shop'){
      ctx.fillStyle='#10232e';ctx.fillRect(18,12,476,35);ctx.fillStyle='#d4e5e9';ctx.font='600 22px Arial';ctx.fillText('BRAND STORE',24,36);
      ctx.fillStyle='#294956';ctx.fillRect(24,67,464,59);ctx.fillStyle='#b9d5db';ctx.font='18px Arial';ctx.fillText('SELECTED FOR YOU',40,103);
      for(let i=0;i<3;i++){const x=24+i*158;ctx.fillStyle='#263d49';ctx.fillRect(x,143,144,111);ctx.fillStyle=['#a0b5bd','#719b9d','#b9b6a8'][i];ctx.fillRect(x+44,166,56,66);ctx.strokeStyle='#d5e0e2';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x+72,169,16,Math.PI,0);ctx.stroke();ctx.fillStyle='#8faebb';ctx.fillRect(x,267,99,5);ctx.fillStyle='#528d99';ctx.fillRect(x,284,144,19);}
    }else if(style==='commerce-data'){
      ctx.fillStyle='#10232e';ctx.fillRect(18,12,476,35);ctx.fillStyle='#c7e0e4';ctx.font='600 21px Arial';ctx.fillText('M-PULSE / D2C AI',24,36);
      for(let i=0;i<3;i++){ctx.fillStyle='#244451';ctx.fillRect(24,72+i*75,464,59);ctx.fillStyle='#a2c8cc';ctx.font='20px Arial';ctx.fillText(['CUSTOMER SIGNALS','RECOMMENDATIONS','CAMPAIGNS'][i],40,108+i*75);ctx.fillStyle='#66a4af';ctx.fillRect(422,88+i*75,44,25);}
    }else if(style==='document'){
      ctx.fillStyle='#c8d8df';ctx.fillRect(30,73,160,220);ctx.fillStyle='#46606e';for(let i=0;i<7;i++)ctx.fillRect(48,100+i*23,120-(i%3)*22,5);
      for(let i=0;i<3;i++){ctx.fillStyle='#244754';ctx.fillRect(236,85+i*68,233,48);ctx.strokeStyle='#a6d4d7';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(257,108+i*68);ctx.lineTo(266,117+i*68);ctx.lineTo(283,96+i*68);ctx.stroke();}
    }else{
      for(let i=0;i<3;i++){ctx.fillStyle='#24424f';ctx.fillRect(24+i*159,73,145,55);ctx.fillStyle='#b6dce0';ctx.fillRect(38+i*159,88,40+i*12,12);}
      ctx.strokeStyle='#304b59';ctx.lineWidth=1;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(24,160+i*40);ctx.lineTo(488,160+i*40);ctx.stroke();}
      ctx.strokeStyle='#9ad2d6';ctx.lineWidth=4;ctx.beginPath();for(let i=0;i<24;i++){const x=24+i*20,y=248-Math.sin(i*.71)*25-(i===15?69:0);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    }
    const texture=keep(new THREE.CanvasTexture(c));texture.colorSpace=THREE.SRGBColorSpace;
    const m=keep(new THREE.MeshBasicMaterial({map:texture}));mesh(new THREE.PlaneGeometry(w,h),m,x,y,z+.034,parent);
    return {c,ctx,texture};
  }
  // Low profile metal feet keep the miniatures grounded without toy-like pedestals.
  if(kind==='vision'){
    box(1.65,.09,.72,0,.4,0,metal);box(1.56,.045,.62,0,.462,0,dark);
    for(const x of [-.64,.64])for(const z of [-.25,.25])box(.055,.37,.055,x,.2,z,metal);
    for(let i=0;i<16;i++){const roller=cyl(.018,.62,-.74+i*.098,.49,0,metal);roller.rotation.x=Math.PI/2;}
    for(const z of [-.4,.4])box(.06,.92,.06,.1,.91,z,metal);box(.13,.08,.88,.1,1.34,0,graphite);
    box(.24,.16,.24,.1,1.2,0,graphite);cyl(.065,.08,.1,1.085,0,dark);cyl(.042,.012,.1,1.04,0,light);
    const scan=mesh(new THREE.PlaneGeometry(.05,.61),keep(new THREE.MeshBasicMaterial({color:'#9be3e3',transparent:true,opacity:.4,side:THREE.DoubleSide})),.1,.668,0);scan.rotation.x=-Math.PI/2;
    const parts=[-.55,.45].map(x=>{const p=box(.27,.16,.29,x,.58,0,graphite);box(.18,.018,.2,0,.09,0,metal,p);return p;});
    const boundingSource=keep(new THREE.BoxGeometry(.3,.18,.32));const detection=new THREE.LineSegments(keep(new THREE.EdgesGeometry(boundingSource)),keep(new THREE.LineBasicMaterial({color:'#9dced6',transparent:true,opacity:.7})));detection.position.set(.1,.59,0);root.add(detection);
    animate.push((t,a)=>{parts.forEach((p,i)=>p.position.x=((t*.15+i*.8)%1.5)-.75);scan.material.opacity=.13+a*(.25+.15*Math.sin(t*4));detection.material.opacity=parts.some(p=>Math.abs(p.position.x-.1)<.17)?.8:.12;});
    box(.2,.12,.14,-.66,.77,-.37,graphite);box(.018,.2,.018,-.66,.6,-.37,metal);
  }else if(kind==='energy'){
    box(1.65,.035,.75,0,.03,0,dark);
    for(const x of [-.55,-.02]){const panel=new THREE.Group();panel.position.set(x,.29,.16);panel.rotation.x=-.38;root.add(panel);box(.49,.035,.57,0,0,0,metal,panel);box(.44,.01,.52,0,.025,0,teal,panel);for(let i=-1;i<=1;i++)box(.007,.012,.52,i*.135,.034,0,metal,panel);for(let i=-1;i<=1;i++)box(.44,.012,.006,0,.034,i*.15,metal,panel);box(.035,.27,.035,x,.16,.16,metal);}
    const tower=cyl(.023,1.03,-.5,.55,-.24,metal);const turbine=new THREE.Group();turbine.position.set(tower.position.x,1.06,-.24);root.add(turbine);const hub=cyl(.055,.13,0,0,0,graphite,turbine);hub.rotation.x=Math.PI/2;
    for(let i=0;i<3;i++){const blade=new THREE.Group();blade.rotation.z=i*Math.PI*2/3;turbine.add(blade);const fin=box(.045,.36,.014,0,.2,.06,paper,blade);fin.rotation.z=-.15;}animate.push(t=>turbine.rotation.z=t*.65);
    box(.33,.69,.35,.55,.38,-.04,paper);box(.26,.26,.02,.55,.47,.147,dark);for(let i=0;i<4;i++)box(.025,.1,.02,.46+i*.06,.47,.165,light);box(.23,.012,.02,.55,.72,.15,graphite);
  }else if(kind==='commerce'){
    box(.65,.035,.4,-.17,.04,-.06,metal);box(.065,.37,.07,-.17,.23,-.13,metal);const store=screen(.94,.64,-.17,.72,-.13,'shop');box(.63,.025,.2,-.17,.065,.29,graphite);
    const phone=new THREE.Group();phone.position.set(-.83,.39,.23);phone.rotation.set(-.08,.16,0);root.add(phone);screen(.24,.48,0,0,0,'shop',phone);box(.29,.025,.2,-.83,.06,.23,metal);
    box(.34,.025,.25,.63,.04,-.17,metal);box(.04,.23,.04,.63,.15,-.2,metal);screen(.39,.57,.63,.56,-.2,'commerce-data');
    const bag=box(.23,.27,.14,.39,.2,.37,paper);mesh(new THREE.TorusGeometry(.065,.009,8,24,Math.PI),metal,0,.135,0,bag);box(.14,.025,.005,0,0,.075,teal,bag);
    const route=[[-.83,.12,.32],[-.42,.12,.5],[.15,.12,.5],[.64,.27,-.15]];path(route);const pulse=mesh(new THREE.SphereGeometry(.021,10,8),light,0,.12,.5);
    const base=store.ctx.getImageData(0,0,512,320);let selected=-1;
    animate.push(t=>{const phase=Math.floor(t/3)%3;if(phase!==selected){selected=phase;store.ctx.putImageData(base,0,0);store.ctx.strokeStyle='#b2e0e4';store.ctx.lineWidth=4;store.ctx.strokeRect(26+selected*158,145,140,107);store.texture.needsUpdate=true;}const x=(t*.3)%1;pulse.position.set(-.83+x*1.47,.12,.4);});
  }else if(kind==='office'){
    box(1.6,.07,.7,0,.42,0,metal);for(const x of [-.67,.67])for(const z of [-.25,.25])box(.045,.4,.045,x,.2,z,graphite);
    box(.53,.16,.39,-.46,.53,.05,paper);const lid=box(.54,.035,.39,-.46,.66,-.04,graphite);lid.rotation.x=-.36;
    const sheet=box(.35,.008,.39,-.46,.626,.09,paper);for(let i=0;i<4;i++)box(.26,.004,.008,0,.007,-.12+i*.06,teal,sheet);
    box(.06,.23,.06,.39,.57,-.14,metal);screen(.67,.45,.39,.9,-.14,'document');box(.42,.024,.15,.4,.48,.2,graphite);
    const scan=box(.4,.006,.012,-.46,.639,0,light);animate.push(t=>scan.position.z=Math.sin(t*1.4)*.14);
  }else if(kind==='print'){
    box(.72,.66,.58,-.14,.39,0,paper);box(.76,.19,.62,-.14,.8,-.02,graphite);box(.61,.02,.5,-.14,.91,-.02,paper);
    for(let i=0;i<3;i++){box(.61,.13,.015,-.14,.25+i*.15,.297,metal);box(.16,.018,.02,-.14,.28+i*.15,.31,dark);}
    box(.51,.07,.09,-.14,.66,.31,dark);const output=box(.42,.007,.27,-.14,.655,.42,paper);for(let i=0;i<4;i++)box(.29,.003,.008,0,.006,-.08+i*.035,teal,output);
    const control=new THREE.Group();control.position.set(.19,.93,.27);control.rotation.x=-.38;root.add(control);box(.22,.12,.025,0,0,0,dark,control);box(.16,.07,.006,0,0,.018,light,control);
    const reader=box(.19,.3,.05,.55,.48,.24,graphite);mesh(new THREE.TorusGeometry(.042,.008,8,20),light,0,.045,.032,reader);box(.027,.052,.016,0,.014,.032,light,reader);box(.028,.31,.035,.55,.18,.24,metal);
    animate.push(t=>output.position.z=.35+(Math.sin(t*.8)+1)*.085);
  }else{
    box(.37,1.03,.4,-.56,.54,-.05,graphite);for(let i=0;i<6;i++){box(.3,.105,.02,-.56,.13+i*.16,.162,dark);box(.025,.018,.012,-.45,.16+i*.16,.18,light);for(let j=0;j<4;j++)box(.032,.045,.01,-.66+j*.05,.13+i*.16,.18,metal);}
    box(.76,.035,.48,.3,.43,.12,metal);for(const x of [.04,.58])box(.035,.43,.035,x,.2,.2,graphite);
    box(.045,.2,.045,.3,.55,-.1,metal);const display=screen(.72,.44,.3,.83,-.1);box(.46,.025,.13,.3,.47,.22,graphite);
    const base=display.ctx.getImageData(0,0,512,320);let outcome=false;
    outcomes.push(value=>{if(value===outcome)return;outcome=value;const ctx=display.ctx;ctx.putImageData(base,0,0);if(value){ctx.fillStyle='#183d43';ctx.fillRect(20,65,472,235);ctx.fillStyle='#c3e6e6';ctx.font='600 36px Arial';ctx.fillText('REVIEW QUEUED',40,115);ctx.font='22px Arial';ctx.fillStyle='#8bb9bb';ctx.fillText('QUALITY INSPECTION',40,153);for(let i=0;i<3;i++){ctx.fillStyle=i===0?'#b9cbc5':'#4d858d';ctx.fillRect(40+i*148,193,127,62);}ctx.fillStyle='#112f39';ctx.font='20px Arial';ctx.fillText('DETECT',51,230);ctx.fillText('NOTIFY',199,230);ctx.fillText('REVIEW',344,230);}display.texture.needsUpdate=true;});
    const signal=mesh(new THREE.SphereGeometry(.025,10,8),light,-.45,.12,.3);path([[-.54,.08,.25],[-.3,.08,.5],[.28,.08,.5],[.28,.44,.2]]);animate.push(t=>signal.position.set(-.54+(t*.25%1)*.82,.09,.43));
  }
  root.userData.solutionKind=kind;
  return {root,update(time,active=1){light.emissiveIntensity=.35+active*.9;animate.forEach(fn=>fn(time,active));},setOutcome(value){outcomes.forEach(fn=>fn(Boolean(value)));},dispose(){resources.forEach(r=>r.dispose());}};
}
