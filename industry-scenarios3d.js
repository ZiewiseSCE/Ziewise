import { createIndustryModel } from './ai-briefing/assets/process-industry.js';
import { createSurveillanceModel } from './ai-briefing/assets/process-surveillance.js';

// Illustrative deployment workflows, not measured customer results or live data.
const step = (ko, en) => ({ ko, en });
export const industryScenarios = {
 factory: {
  product: 'VISION AI · ZIEWCORE', title: ['제조 · 불량을 찾고, 다음 공정에서 분리하다', 'Manufacturing · Detect defects and route products'],
  context: ['세라믹 제품이 흐르는 생산 라인. 작은 표면 크랙을 놓치지 않고, 검사 결과를 분류 설비까지 전달하는 상황입니다.', 'A ceramic production line connects surface inspection to sorting equipment, so a small crack can be located and the affected product routed for review.'],
  outcome: ['연결 업무 · 불량품 분리 → 원인 검토 → 검사 이력', 'Connected work · Reject routing → Cause review → Inspection history'],
  steps: [
   step(['제품 투입', '검사할 제품이 카메라 앞으로 이동합니다.', '컨베이어와 일정한 조명으로 촬영 조건을 맞춥니다.'], ['Feed', 'Products move toward the inspection camera.', 'The conveyor and lighting establish consistent capture conditions.']),
   step(['표면 검사', '조명 아래에서 제품의 표면을 읽습니다.', '카메라의 검사 영역이 제품을 훑으며 이상 후보를 찾습니다.'], ['Inspect', 'Read the product surface under controlled lighting.', 'The inspection area scans the product for possible defects.']),
   step(['크랙 판정', '어느 제품의 어느 부위인지 표시합니다.', '붉은 검출 상자가 크랙 제품을 특정하고 분류 신호로 연결합니다.'], ['Locate', 'Identify the affected product and defect location.', 'A red detection box marks the cracked product for the sorting signal.']),
   step(['분리·검토', '불량 후보는 옆으로, 양품은 다음 공정으로.', '푸셔가 해당 제품을 별도 트레이로 보냅니다. 담당자는 검사 근거를 확인합니다.'], ['Route', 'Route the suspect item aside while good products continue.', 'The pusher moves it to a separate tray for an operator to review the inspection evidence.'])
  ]
 },
 energy: {
  product: 'NEURO-VPP', title: ['에너지 · 발전량과 수요 사이를 조율하다', 'Energy · Balance generation and demand'],
  context: ['태양광 설비, ESS, 전력을 사용하는 건물을 하나의 운영 화면으로 연결합니다. 수요가 변할 때 저장 전력을 어떻게 활용할지 살펴봅니다.', 'Connect solar generation, battery storage and a building load. Explore how stored energy can be scheduled when demand changes.'],
  outcome: ['연결 업무 · 수요 검토 → ESS 운영 계획 → 전력 흐름 확인', 'Connected work · Demand review → Battery schedule → Power-flow verification'],
  steps: [
   step(['발전 수집', '태양광 설비의 발전 신호가 모입니다.', '패널에서 계량 지점으로 이동하는 빛은 발전 데이터의 흐름입니다.'], ['Generation', 'Collect generation signals from the solar field.', 'Light moving from the panels to the meter represents generation data.']),
   step(['수요 변화', '건물의 전력 수요가 높아집니다.', '건물 창과 수요 막대가 켜지며 공급·수요를 함께 검토하는 상황을 보여줍니다.'], ['Demand', 'The building demand increases.', 'Lit windows and the demand bars show the changing load to be reviewed.']),
   step(['운영 판단', '현재 발전량과 저장 여력을 비교합니다.', '중앙 관제 화면이 ESS와 부하를 연결해 운영 계획을 검토합니다.'], ['Plan', 'Compare generation with available stored energy.', 'The control station connects battery capacity and demand for scheduling.']),
   step(['전력 배분', '저장 전력을 필요한 부하로 연결합니다.', 'ESS에서 건물로 향하는 경로가 켜집니다. 실제 제어 범위는 설비·운영 정책에 맞춥니다.'], ['Dispatch', 'Route stored energy to the required load.', 'The battery-to-building path lights up. Actual control follows equipment capabilities and operating policies.'])
  ]
 },
 commerce: {
  product: 'M-PULSE · D2C COMMERCE AI', title: ['D2C 브랜드 · 고객의 행동을 다음 경험으로', 'D2C brand · Turn behaviour into the next experience'],
  context: ['브랜드 자사몰에서 고객이 상품을 살펴보다 망설입니다. M-Pulse가 행동 신호를 분석해 추천과 캠페인을 연결하는 과정입니다.', 'A customer hesitates while browsing a brand-owned store. M-Pulse connects behavioural signals to personalised recommendations and campaigns.'],
  outcome: ['연결 업무 · 자사몰 추천 → 캠페인 실행 → 반응 분석', 'Connected work · Store recommendations → Campaign delivery → Response analysis'],
  steps: [
   step(['자사몰 탐색', '고객이 브랜드의 상품을 비교합니다.', '매장형 상품 진열과 모바일 채널이 같은 브랜드 경험으로 연결됩니다.'], ['Browse', 'A customer compares the brand’s products.', 'Product displays and the mobile channel represent the same brand-owned experience.']),
   step(['행동 분석', '탐색·관심·이탈 징후를 함께 읽습니다.', '고객 채널에서 분석 화면으로 행동 데이터가 전달됩니다.'], ['Understand', 'Read browsing, interest and exit signals together.', 'Behavioural data travels from the customer channel to the analysis screen.']),
   step(['개인화', '관심에 맞는 상품과 메시지를 연결합니다.', '선택한 상품이 강조되고 모바일 추천 카드가 바뀝니다. AR은 추가 상품 경험으로 활용할 수 있습니다.'], ['Personalise', 'Match products and messages to customer interest.', 'A selected product and mobile recommendation are highlighted. AR can provide an additional product experience.']),
   step(['반응 환류', '추천과 캠페인의 반응을 다시 분석합니다.', '채널에서 돌아오는 경로와 결과 화면이 켜집니다. 캠페인별 반응을 비교해 다음 추천과 메시지를 조정합니다.'], ['Learn', 'Bring recommendation and campaign responses back.', 'The return path and results screen light up. Compare campaign responses to adjust the next recommendations and messages.'])
  ]
 },
 finance: {
  product: 'ZIEWPRINT · ZIEWCORE', title: ['금융·공공 · 승인된 문서만, 확인된 사람에게', 'Finance & public services · Controlled document release'],
  context: ['민감한 문서가 공용 프린터에 방치되지 않도록, 담당자의 출력 요청을 인증·정책 확인·기록과 연결합니다.', 'Connect a staff print request to authentication, policy checks and an audit record, helping prevent sensitive documents being left at shared printers.'],
  outcome: ['연결 업무 · 인증·승인 → 보안 출력 → 감사 이력', 'Connected work · Authentication & approval → Secure release → Audit history'],
  steps: [
   step(['출력 요청', '업무 문서가 출력 대기열에 들어갑니다.', '문서는 프린터로 바로 나오지 않고 사용자 요청과 함께 대기합니다.'], ['Request', 'A business document enters the print queue.', 'The document remains queued instead of immediately appearing at the shared printer.']),
   step(['사용자 인증', '출력 장비 앞에서 사용자를 확인합니다.', '사원증과 인증 리더가 강조됩니다. QR·PIN 등 현장에 맞는 인증을 적용합니다.'], ['Authenticate', 'Verify the person at the device.', 'The staff card and reader are highlighted; authentication can use QR, PIN or the configured site method.']),
   step(['정책 확인', '사용자 권한과 출력 승인을 확인합니다.', '중앙 정책 화면이 요청을 검토하고 승인 상태를 표시합니다.'], ['Check policy', 'Check permissions and release approval.', 'The policy station reviews the request and displays the approval state.']),
   step(['출력·기록', '문서가 출력되고 처리 이력이 남습니다.', '출력 트레이로 나오는 문서와 감사 화면을 함께 확인해 보세요.'], ['Release & log', 'Release the document and record the event.', 'Watch the document reach the output tray as the audit screen updates.'])
  ]
 },
 healthcare: {
  product: 'ZIEWPRINT · OBSERVER', title: ['병원 운영 · 접수에서 안전한 문서 전달까지', 'Hospital operations · From reception to secure handover'],
  context: ['접수 데스크, 공용 출력 장비와 운영 시스템을 연결합니다. 이 장면은 진단 시연이 아니라 병원 업무 문서의 안전한 전달을 설명합니다.', 'Connect a reception desk, shared printer and operational systems. This scene explains secure administrative document handling, not clinical diagnosis.'],
  outcome: ['연결 업무 · 접수 확인 → 담당자 인증 → 문서 전달·기록', 'Connected work · Reception check → Staff authentication → Handover & history'],
  steps: [
   step(['접수 확인', '접수 데스크에서 필요한 문서를 요청합니다.', '요청 문서를 공용 장비의 인증 대기 흐름으로 전달합니다.'], ['Reception', 'Request the required document at reception.', 'The request enters the shared device’s authenticated release workflow.']),
   step(['담당자 인증', '담당자가 장비 앞에서 요청을 확인합니다.', '출력 장비의 인증 표시가 켜지고 담당자 확인 단계가 진행됩니다.'], ['Verify staff', 'A staff member checks the request at the device.', 'The authentication indicator lights up for staff verification.']),
   step(['보안 출력', '확인된 문서를 출력합니다.', '출력 경로를 강조해, 다른 문서와 혼동하지 않고 찾아가는 흐름을 보여줍니다.'], ['Secure release', 'Release the verified document.', 'The output route highlights how the appropriate document reaches the staff member.']),
   step(['인계·기록', '전달 결과와 장비 상태를 함께 확인합니다.', '운영 화면이 기록을 받고, 출력 장비의 처리 상태를 표시합니다.'], ['Handover', 'Review the handover record and device status.', 'The operations screen receives the record and displays the device’s processing state.'])
  ]
 },
 office: {
  product: 'SIGMING · OBSERVER', title: ['스마트 오피스 · 영수증 한 장이 전표가 되기까지', 'Smart office · From a receipt to an expense record'],
  context: ['직원이 제출한 영수증에서 정보를 읽고, 규정을 확인한 뒤 담당자의 승인 업무로 연결합니다.', 'Read a submitted receipt, check expense policies, then route it to the responsible person for approval.'],
  outcome: ['연결 업무 · 정보 추출 → 규정 검토 → 승인·ERP 연계', 'Connected work · Extract fields → Review policy → Approval & ERP integration'],
  steps: [
   step(['영수증 제출', '직원이 영수증을 업무 채널에 제출합니다.', '스캔 장치로 들어가는 문서가 경비 처리의 시작점입니다.'], ['Submit', 'An employee submits a receipt.', 'The document entering the scanner starts the expense workflow.']),
   step(['정보 추출', '날짜·금액·거래처 등 필요한 항목을 읽습니다.', '문서의 스캔선과 중앙 화면의 항목들이 함께 강조됩니다.'], ['Extract', 'Read the date, amount and merchant.', 'The document scan and extracted fields on the central screen light up together.']),
   step(['규정 검토', '정책과 맞지 않는 항목을 확인 대상으로 남깁니다.', '검토 화면에 확인 표시가 나타납니다. 예외 판단은 담당자에게 전달합니다.'], ['Review', 'Flag fields that need a policy check.', 'Review indicators appear on the workstation. Exceptions are routed to the responsible person.']),
   step(['승인·연계', '확인된 결과를 승인·전표 흐름으로 전달합니다.', '담당자 화면에서 업무 시스템으로 연결선이 켜집니다.'], ['Approve', 'Send confirmed results into the approval and expense flow.', 'The connection from the reviewer to the business system lights up.'])
  ]
 },
 public: {
  product: 'VISION AI · ZIEWCORE', title: ['공공 관제 · 여러 화면에서 확인할 사건으로', 'Public monitoring · From many screens to an event'],
  context: ['같은 카메라 영상이라도, 이상 후보를 먼저 선별하면 관제요원이 위치와 근거를 함께 확인할 수 있습니다.', 'Filtering candidate events from existing camera feeds helps an operator review the location and evidence together.'],
  outcome: ['연결 업무 · 이벤트 선별 → 담당자 확인 → 조치 이력', 'Connected work · Event selection → Operator review → Action history'],
  steps: [
   step(['같은 현장', '같은 현장을 두 가지 관제 방식으로 봅니다.', '육안 관제와 AI 선별 관제의 업무 흐름을 비교합니다.'], ['Observe', 'View the same site through two monitoring workflows.', 'Compare continuous manual monitoring with AI-assisted event selection.']),
   step(['이상 선별', '먼저 확인할 위치를 강조합니다.', '이상 후보가 있는 객체와 구역에 검출 표시가 나타납니다.'], ['Select', 'Highlight the location that needs attention.', 'Detection indicators identify the candidate object and area.']),
   step(['담당자 확인', '발생 위치와 영상 근거를 함께 전달합니다.', '관제 담당자가 상황을 검토하고 실제 조치를 결정합니다.'], ['Review', 'Deliver the location and video evidence together.', 'The operator reviews the situation and decides the response.']),
   step(['이력 기록', '확인한 사건을 검색 가능한 기록으로 남깁니다.', '알림·영상·조치 결과를 같은 이벤트에 연결합니다.'], ['Record', 'Keep a searchable record of the reviewed event.', 'Connect the alert, video and action outcome to the same event.'])
  ]
 }
};

export function createApplicationModel(T, kind) {
 if(kind==='factory') return createIndustryModel(T,'inspection');
 if(kind==='public') return createSurveillanceModel(T,'before-after');
 const root=new T.Group();root.name=`application-${kind}`;
 const material=(color,metalness=.45,roughness=.45)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const m={dark:material('#172831'),steel:material('#8c9fa9',.8,.3),paper:material('#d1dcdf',.03,.8),teal:material('#4b929e'),amber:material('#c5a575'),glass:material('#294957')};
 const lit=new T.MeshStandardMaterial({color:'#a8d6d8',emissive:'#67bac7',emissiveIntensity:.65,roughness:.3});
 function box(w,h,d,x,y,z,mat=m.dark,parent=root){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function cyl(r,h,x,y,z,mat=m.steel,parent=root){const mesh=new T.Mesh(new T.CylinderGeometry(r,r,h,20),mat);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;}
 function group(x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);root.add(g);return g;}
 function plaque(text,x,y,z){const c=document.createElement('canvas');c.width=512;c.height=80;const ctx=c.getContext('2d');ctx.fillStyle='#c4dce2';ctx.font='600 27px Arial';ctx.textAlign='center';ctx.fillText(text,256,49);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));sprite.position.set(x,y,z);sprite.scale.set(2.6,.406,1);root.add(sprite);}
 function screen(x,z,title){const g=group(x,0,z);box(1.7,.09,.85,0,.94,0,m.steel,g);for(const a of [-.69,.69])box(.065,.91,.065,a,.47,0,m.steel,g);box(.08,.4,.08,0,1.18,-.12,m.steel,g);box(1.26,.84,.07,0,1.69,-.12,m.dark,g);box(1.13,.7,.016,0,1.69,-.075,m.glass,g);const bars=[];for(let i=0;i<4;i++)bars.push(box(.17,.16+i*.085,.02,-.38+i*.25,1.52+i*.042,-.059,m.teal,g));box(.9,.03,.22,0,1.01,.24,m.dark,g);plaque(title,x,2.5,z);return {g,bars};}
 function room(){box(11.5,.12,5.8,0,.06,0,m.dark);for(let x=-5;x<6;x++)box(.012,.008,5.7,x,.124,0,m.steel);box(11.5,.014,.014,0,.14,2.83,m.steel);box(11.5,.7,.1,0,.46,-2.86,m.glass);}
 const wires=[];
 function wire(points,phase){const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)),false,'centripetal');const line=new T.Mesh(new T.TubeGeometry(curve,32,.014,6,false),m.teal);root.add(line);const packet=new T.Mesh(new T.SphereGeometry(.06,10,8),lit);root.add(packet);wires.push({curve,packet,phase});return line;}
 function paper(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);box(.55,.015,.72,0,0,0,m.paper,g);for(let i=0;i<5;i++)box(.36,.006,.012,0,.012,-.23+i*.085,m.steel,g);return g;}
 function printer(x,z){const g=group(x,.13,z);box(1.14,1.15,1,0,.575,0,m.paper,g);box(1.16,.18,1.02,0,1.21,-.04,m.steel,g);box(.85,.075,.43,0,1.34,-.13,m.dark,g);box(.89,.12,.4,0,.87,.52,m.dark,g);box(.9,.045,.53,0,.78,.59,m.steel,g);const doc=paper(g,0,.83,.43);box(.36,.2,.055,.31,1.12,.54,m.glass,g);const reader=box(.13,.12,.07,.32,1.12,.578,lit,g);for(let i=0;i<6;i++)box(.35,.012,.01,-.25,.29+i*.055,.505,m.dark,g);return {g,doc,reader};}
 function person(x,z){const g=group(x,.14,z);cyl(.16,.36,0,1.56,0,m.paper,g);box(.43,.62,.25,0,1.09,0,m.steel,g);for(const a of [-1,1]){cyl(.073,.65,a*.12,.44,0,m.dark,g);box(.17,.13,.31,a*.12,.14,.06,m.dark,g);cyl(.055,.55,a*.27,1.11,0,m.steel,g);}return g;}
 room();let update;
 if(kind==='energy'){
  for(let x=-4.7;x<-2;x+=1.2)for(const z of [-1.2,.2]){const g=group(x,.67,z);g.rotation.x=-.32;box(1.02,.065,1.1,0,0,0,m.steel,g);box(.93,.014,1.01,0,.041,0,m.glass,g);for(let i=-1;i<2;i++){box(.006,.012,1,i*.3,.055,0,m.steel,g);box(.93,.012,.006,0,.055,i*.32,m.steel,g);}box(.06,.48,.07,x,.38,z,m.steel);}
  plaque('SOLAR FIELD',-3.5,2.5,-.4);
  const control=screen(0,-1.3,'NEURO-VPP / DISPATCH');
  const batteries=[];for(const x of [-.57,.57]){box(.84,1.35,.76,x,.82,1.5,m.paper);box(.61,.77,.02,x,.96,1.89,m.dark);for(let i=0;i<4;i++)batteries.push(box(.43,.11,.025,x,.68+i*.18,1.91,lit));}plaque('ENERGY STORAGE',0,2.4,1.5);
  box(2.2,1.65,1.7,3.5,.98,-.2,m.paper);box(2.33,.15,1.84,3.5,1.88,-.2,m.steel);const windows=[];for(const x of [2.8,3.5,4.2])for(const y of [.75,1.4])windows.push(box(.43,.34,.04,x,y,.66,m.glass));plaque('BUILDING LOAD',3.5,2.7,-.2);
  wire([[-3.4,.3,.1],[-2,.3,1],[0,.3,1.5]],0);wire([[3.5,.3,.7],[2,.3,-.5],[0,1.5,-1.3]],1);wire([[0,1.5,-1.3],[0,.3,0],[0,.3,1.5]],2);wire([[.5,.3,1.5],[2,.3,1.5],[3.5,.3,.7]],3);
  update=(p,t)=>{windows.forEach(w=>w.material=p>=1?lit:m.glass);control.bars.forEach((b,i)=>{b.scale.y=p>=2?1+.35*Math.sin(t*2+i):1;});batteries.forEach((b,i)=>b.material=p===3&&i%4>1?m.glass:lit);};
 }else if(kind==='commerce'){
  const shelves=group(-3.6,.13,0);for(const y of [.32,1.09,1.87])box(2.05,.08,.7,0,y,0,m.steel,shelves);for(const x of [-.97,.97])box(.07,2.02,.7,x,1.05,0,m.dark,shelves);
  const goods=[];for(let i=0;i<6;i++){const x=-.62+(i%3)*.62,y=.63+Math.floor(i/3)*.77;goods.push(box(.39,.48,.33,x,y,.04,i%2?m.paper:m.amber,shelves));}plaque('BRAND COLLECTION',-3.6,2.9,0);
  const phone=group(-1.3,.15,1.55);box(.7,1.2,.09,0,.63,0,m.dark,phone);box(.61,1.04,.02,0,.66,.056,m.paper,phone);const rec=box(.46,.38,.025,0,.68,.072,m.teal,phone);for(let i=0;i<3;i++)box(.38,.016,.02,0,.33+i*.06,.076,m.steel,phone);
  const ai=screen(0,-.9,'M-PULSE / CUSTOMER SIGNALS');const campaign=screen(3.5,.1,'CAMPAIGN / RESPONSE');person(3.5,1.4);
  wire([[-3.6,.3,0],[-2.5,.3,1.5],[-1.3,.3,1.5]],0);wire([[-1.3,.3,1.5],[0,.3,.5],[0,1.5,-.9]],1);wire([[0,1.5,-.9],[-1,.4,-.7],[-3.6,.4,0]],2);wire([[-1.3,.3,1.5],[1.8,.3,1.8],[3.5,1.5,.1]],3);
  update=(p,t)=>{goods.forEach((g,i)=>{g.material=i===4&&p>=2?lit:(i%2?m.paper:m.amber);g.position.z=i===4&&p>=2?.22:.04;});rec.material=p>=2?m.amber:m.teal;ai.bars.forEach((b,i)=>{b.scale.y=p>=1?1+.22*Math.sin(t*2+i):1;});campaign.bars.forEach(b=>b.material=p===3?lit:m.teal);};
 }else if(kind==='office'){
  const input=screen(-3.7,.1,'EMPLOYEE / RECEIPT');box(1.04,.15,.74,-3.7,1.12,.07,m.paper);const receipt=paper(root,-3.7,1.22,.45);const scan=box(.7,.015,.025,-3.7,1.24,.15,lit);person(-4.4,1.45);
  const policy=screen(0,-.8,'SIGMING / REVIEW');const approval=screen(3.55,.1,'APPROVAL / ERP');person(3.55,1.4);
  const sheet=paper(root,0,1.02,-.49);wire([[-3.7,1.2,.1],[-1.9,.3,.5],[0,1.3,-.8]],1);wire([[0,1.3,-.8],[1.3,.3,.5],[3.55,1.3,.1]],3);
  update=(p,t)=>{receipt.position.z=p===0?.55-Math.min(t/3,1)*.4:.15;scan.visible=p===1;scan.position.z=.1+Math.sin(t*2)*.28;sheet.visible=p>=1;policy.bars.forEach(b=>b.material=p>=2?lit:m.teal);approval.bars.forEach(b=>b.material=p===3?lit:m.teal);input.bars.forEach(b=>b.material=p===0?lit:m.teal);};
 }else{
  const medical=kind==='healthcare';screen(-3.6,0,medical?'RECEPTION / REQUEST':'STAFF / PRINT REQUEST');const output=printer(3.45,0);const policy=screen(0,-1.2,medical?'OPERATIONS / HISTORY':'POLICY / AUDIT');const staff=person(3.3,1.4);const card=box(.25,.16,.025,3.0,1.35,1.15,m.paper);plaque('AUTHENTICATED RELEASE',3.45,2.6,0);
  if(medical){box(2.5,.78,.65,-3.6,.52,1.03,m.paper);box(2.58,.08,.74,-3.6,.95,1.03,m.steel);box(.52,.12,.02,-3.6,.59,1.367,m.teal);box(.12,.52,.02,-3.6,.59,1.372,m.teal);for(const x of [-4.3,-3.3]){box(.65,.09,.61,x,.49,-1.8,m.steel);box(.65,.63,.09,x,.82,-2.08,m.glass);}}
  wire([[-3.6,1.4,0],[-1.7,.3,.2],[0,1.4,-1.2]],0);wire([[3.45,1.3,.55],[1.8,.3,.8],[0,1.4,-1.2]],1);wire([[0,1.4,-1.2],[1.5,.3,-.7],[3.45,1.3,.55]],2);wire([[3.45,1.3,.55],[1.8,.3,1.9],[0,1.4,-1.2]],3);
  update=(p,t)=>{const releasing=p>=(medical?2:3);output.doc.position.z=releasing?.43+Math.min(t/3,1)*.5:.35;output.doc.visible=releasing;output.reader.material=p>=1?lit:m.glass;card.position.z=p===1?1.15-Math.min(t/2,1)*.48:1.15;staff.rotation.y=p===1?-.3:0;policy.bars.forEach(b=>b.material=p>=2?lit:m.teal);};
 }
 const model={root,camera:{target:[0,1.0,0],distance:15,yaw:.28,pitch:.55},update({phase=0,time=0,reducedMotion=false}={}){const t=reducedMotion?3.4:time;update(phase,t);wires.forEach(({curve,packet,phase:p})=>{packet.visible=p===phase;packet.position.copy(curve.getPointAt(reducedMotion?.85:(t*.24)%1));});root.updateMatrixWorld(true);}};
 model.update();return model;
}
