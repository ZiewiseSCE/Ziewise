const copy = {
 vision: {
  ko:['Vision AI · 보는 것에서 판단까지','카메라, 검사 구역, 컨베이어와 관제 화면을 통해 영상이 현장의 판단으로 이어지는 과정을 보여줍니다.',[
   ['영상 입력','CCTV와 생산라인 카메라에서 영상을 받아 검사 구역과 탐지 대상을 설정합니다. 기존 영상 인프라와 현장 조건을 출발점으로 삼습니다.'],
   ['엣지 분석','현장 가까이에서 객체·행동·이상 후보를 분석합니다. 모든 영상을 사람이 지켜보는 대신 확인할 대상과 위치를 선별합니다.'],
   ['확인과 대응','검출 결과를 영상 근거와 함께 관제에 전달합니다. 생산라인에서는 분류 설비에, 안전 관제에서는 담당자의 확인·조치에 연결합니다.'],
   ['피드백 학습','모호한 사례와 확인된 정탐·오탐을 모아 다음 학습에 활용합니다. 검증한 모델을 현장에 적용하는 순환 구조입니다.']],
   '생산품 외관 검사 · 작업자 안전 · CCTV 이벤트 관제','카메라 입력, 검출 결과, 이벤트 클립과 현장 판정을 하나의 흐름으로 연결합니다.'],
  en:['Vision AI · From seeing to deciding','The camera, inspection zone, conveyor and workstation show how video becomes an operational decision.',[
   ['Video input','Connect CCTV or production-line cameras and configure inspection zones and detection targets around existing equipment.'],
   ['Edge analysis','Analyze objects, behavior and anomaly candidates close to the source. Select the items and locations that need attention.'],
   ['Verify & respond','Send results with video evidence to operations. Connect production decisions to sorting equipment and safety events to operator review.'],
   ['Learn from feedback','Collect uncertain cases and verified true or false detections for subsequent training. Validate a model before applying it on site.']],
   'Visual quality inspection · Worker safety · CCTV event monitoring','Connect camera inputs, detection results, event clips and verified decisions in one workflow.']
 },
 energy: {
  ko:['Neuro-VPP · 분산 자원을 하나의 운영으로','태양광·풍력·저장장치와 연결 경로를 통해 발전, 저장, 수요의 관계를 입체적으로 살펴봅니다.',[
   ['자원 연결','태양광, ESS, EV 충전 설비의 발전량·저장량·사용 상태를 통합합니다. 서로 다른 위치의 자원을 같은 운영 화면에서 파악합니다.'],
   ['수요 예측','사용 패턴과 발전 상태, 가격 신호를 함께 분석해 필요한 전력과 가용 자원을 예측합니다.'],
   ['운영 조정','예측과 운영 조건을 바탕으로 충·방전과 자원 배분을 조정하는 흐름입니다. 현장 제어 범위와 정책에 맞춰 연결합니다.'],
   ['거래와 이력','P2P 거래와 블록체인 기반 이력 검증을 연결하여 자원 간 거래 기록을 추적하는 구조를 보여줍니다.']],
   '분산 발전 운영 · ESS 관리 · 충전 인프라 통합','발전량과 수요를 함께 읽고, 자원 운영과 거래 이력까지 연결합니다.'],
  en:['Neuro-VPP · Distributed assets, coordinated operations','Solar, wind, storage and their connections illustrate the relationship between generation, storage and demand.',[
   ['Connect assets','Combine generation, storage and usage signals from solar, ESS and EV charging equipment across locations.'],
   ['Forecast demand','Analyze usage patterns, generation conditions and price signals to forecast demand and available resources.'],
   ['Coordinate operations','Use forecasts and operating constraints to coordinate charge, discharge and resource allocation within site control policies.'],
   ['Trace transactions','The scenario links peer-to-peer transactions to blockchain-based record verification and traceable asset exchanges.']],
   'Distributed generation · ESS operations · Charging infrastructure','Connect generation and demand signals with asset coordination and transaction records.']
 },
 commerce: {
  ko:['M-Pulse · D2C Commerce AI','브랜드 자사몰과 모바일 판매 채널, 고객 분석 화면을 통해 고객 행동이 개인화 추천과 캠페인으로 이어지는 과정을 보여줍니다.',[
   ['자사 판매 채널','브랜드가 고객에게 직접 판매하는 자사몰과 모바일 채널에서 탐색·상품 반응을 수집합니다. AR 가상 체험과 페이스 트래킹·톤 매칭은 상품 경험을 보완하는 기능입니다.'],
   ['행동 분석','탐색, 체험, 장바구니와 이탈 신호를 함께 읽어 고객이 어느 단계에서 망설이는지 분석합니다.'],
   ['개인화 액션','고객 행동과 운영 정책에 따라 추천이나 쿠폰 등 적절한 액션을 연결합니다. 체험과 구매 흐름이 자연스럽게 이어지도록 설계합니다.'],
   ['반응 비교','캠페인과 A/B 테스트의 반응을 비교하고 다음 운영에 반영합니다. 현장 데이터로 효과를 확인하는 과정입니다.']],
   '브랜드 D2C · 고객 행동 분석 · 개인화 캠페인','자사 판매 채널의 고객 행동을 분석하고 추천·캠페인·이탈 대응으로 연결합니다.'],
  en:['M-Pulse · D2C Commerce AI','A brand storefront, mobile channel and customer analytics display show how behaviour signals inform recommendations and campaigns.',[
   ['Direct sales channels','Gather browsing and product-response signals from a brand’s own web and mobile channels. AR try-on, face tracking and tone matching complement the product experience.'],
   ['Understand behavior','Analyze browsing, try-on, cart and exit signals to identify where a customer hesitates.'],
   ['Personalize actions','Connect recommendations or offers to behavior and campaign rules so experience and purchase flow together.'],
   ['Compare responses','Compare campaigns and A/B test responses to guide the next iteration. Evaluate impact using actual business data.']],
   'Brand D2C · Customer analytics · Personalized campaigns','Connect behaviour in direct sales channels with recommendations, campaigns and retention actions.']
 },
 office: {
  ko:['SIGMING · 문서를 읽고, 규정을 확인하고, 업무로','스캐너와 검증 화면은 영수증이나 문서가 구조화된 업무 데이터로 바뀌는 과정을 보여줍니다.',[
   ['문서 읽기','영수증과 업무 문서에서 날짜, 금액, 거래처 등 필요한 정보를 OCR로 추출합니다.'],
   ['규정 검증','추출한 내용에 회사 규정과 언어 모델의 문맥 분석을 적용합니다. 금액만 맞는지보다 업무 목적과 증빙의 관계를 확인합니다.'],
   ['예외 확인','규정 검토가 필요한 항목을 구분하고 담당자의 검수에 연결합니다. 출장·식대·교통비 등 문맥별 처리가 이어집니다.'],
   ['전표와 이력','검증된 데이터를 ERP 전표와 업무 흐름으로 연결합니다. 원문 증빙과 처리 결과를 함께 추적할 수 있도록 구성합니다.']],
   '경비 정산 · 증빙 검토 · ERP 입력 자동화','문서 인식, 규정 검증과 업무 시스템 입력을 연속된 과정으로 연결합니다.'],
  en:['SIGMING · Read documents. Check policy. Connect work.','The scanner and verification station show documents becoming structured business data.',[
   ['Read documents','Extract dates, amounts, merchants and other required fields from receipts and business documents with OCR.'],
   ['Check policy','Apply company rules and language-model context analysis to the extracted data, including its business purpose and evidence.'],
   ['Review exceptions','Separate items that need policy review and connect them to the responsible person for verification.'],
   ['Post & trace','Connect verified data to ERP entries and business workflows while retaining the source evidence and processing history.']],
   'Expense processing · Evidence review · ERP automation','Connect document recognition, policy validation and business-system entry.']
 },
 print: {
  ko:['ZiewPrint · 인증에서 출력 이력까지','인쇄 장비와 인증 단말, 출력되는 문서를 통해 요청·승인·출력의 보안 경계를 확인합니다.',[
   ['통합 요청','통합 드라이버로 인쇄 작업을 받아 여러 제조사의 장비를 관리합니다. 사용자와 장비에 맞는 정책을 적용합니다.'],
   ['사용자 인증','QR 또는 PIN으로 사용자를 확인한 뒤 대기 중인 작업을 출력합니다. 인증 전에 출력물이 방치되는 상황을 줄입니다.'],
   ['정책 적용','워터마크와 권한 등 문서 보안 정책을 출력 흐름에 반영하고 작업 기록을 남깁니다.'],
   ['장비 운영','인쇄량, 소모품과 장비 상태를 파악하여 토너 발주와 운영 관리에 연결합니다. 보안과 장비 운영을 함께 관리하는 구조입니다.']],
   '기업 공용 프린터 · 기밀 문서 · 출력 비용 관리','누가 어떤 장비로 무엇을 출력했는지, 인증부터 장비 운영까지 이어집니다.'],
  en:['ZiewPrint · From authentication to an auditable output','The printer, authentication terminal and document show the boundaries between request, approval and output.',[
   ['Unified requests','Receive jobs through a unified driver and manage devices across manufacturers with user and equipment policies.'],
   ['Authenticate users','Release queued jobs after QR or PIN verification to reduce unattended output before authentication.'],
   ['Apply policy','Apply watermark and permission rules within the print workflow and retain a job record.'],
   ['Operate devices','Connect print volume, consumables and equipment status with toner ordering and operational management.']],
   'Shared enterprise printers · Confidential documents · Print operations','Trace the workflow from an authenticated request through secure output and device operations.']
 },
 observer: {
  ko:['Observer · 장애를 점에서 관계로 읽기','서버와 네트워크 연결, 흐르는 신호는 서비스가 어떤 구성 요소에 의존하는지 입체적으로 설명합니다.',[
   ['상태 수집','애플리케이션과 네트워크의 지연, 부하, 오류 등 운영 신호를 한 흐름으로 수집합니다.'],
   ['관계 시각화','WEB·APP·DB·EDGE의 의존 관계를 토폴로지로 구성합니다. 증상이 나타난 지점과 영향을 받는 경로를 함께 봅니다.'],
   ['이상 분석','시계열 패턴의 변화와 관련 이벤트를 분석해 점검할 대상을 선별합니다. 담당자는 현재 상태와 이전 흐름을 함께 검토합니다.'],
   ['대응과 복구','알림, 격리, 롤백 등 정해진 대응 정책에 연결하고 조치 이후 상태를 확인합니다. 자동화 범위는 운영 환경과 권한에 맞춰 구성합니다.']],
   '서비스 운영 · 네트워크 관제 · 장애 원인 분석','상태 데이터와 의존 관계를 결합해 영향을 파악하고 복구 흐름으로 연결합니다.'],
  en:['Observer · Understand failures through relationships','Servers, network paths and moving signals illustrate how each service depends on its underlying components.',[
   ['Collect signals','Collect latency, load, errors and other operational signals from applications and networks.'],
   ['Map dependencies','Map relationships across web, application, database and edge components to reveal potentially affected paths.'],
   ['Analyze anomalies','Analyze changes in time-series patterns and related events to prioritize investigation with current and historical context.'],
   ['Respond & recover','Connect findings to configured alert, isolation or rollback policies and review the state after action. Automation follows operational permissions.']],
   'Service operations · Network monitoring · Incident analysis','Combine operational signals with dependencies to understand impact and guide recovery.']
 }
};
const english=()=>document.documentElement.lang==='en';
const details=document.createElement('section');details.className='solution-story';details.setAttribute('aria-label','Solution process details');
document.querySelector('.sim-stage').after(details);
const about=document.createElement('div');about.className='about-capabilities';document.querySelector('.about-intro').after(about);
function render(){
 const kind=document.querySelector('.sim-tab[aria-selected="true"]')?.dataset.sim||'vision';
 const data=copy[kind][english()?'en':'ko'];details.dataset.solution=kind;
 details.setAttribute('aria-labelledby',`solution-story-title-${kind}`);
 details.innerHTML=`<div class="story-heading"><div><span class="story-overline">FROM SCENE TO WORKFLOW</span><h3 id="solution-story-title-${kind}">${data[0]}</h3></div><p>${data[1]}</p></div><div class="story-steps">${data[2].map(([title,body],i)=>`<article><span class="story-step-number">0${i+1}</span><h4>${title}</h4><p>${body}</p></article>`).join('')}</div><div class="story-outcome"><span>${english()?'WHERE IT WORKS':'이렇게 활용합니다'}</span><strong>${data[3]}</strong><p>${data[4]}</p></div>`;
 about.innerHTML=english()?`<div class="story-heading"><div><span class="story-overline">INFRASTRUCTURE → INTELLIGENCE → OPERATIONS</span><h3>Technology that stays connected to the work.</h3></div><p>Our experience in infrastructure, security and operations forms the foundation for building and connecting AI solutions.</p></div><div class="story-steps"><article><span class="story-step-number">01</span><h4>Understand the site</h4><p>Start with existing cameras, virtual PCs, network boundaries and business systems. Define the problem alongside its operating constraints.</p></article><article><span class="story-step-number">02</span><h4>Compose the intelligence</h4><p>Use ZiewCore to connect vision, time-series analysis and document understanding. Configure the models and rules around the domain.</p></article><article><span class="story-step-number">03</span><h4>Connect the workflow</h4><p>Bring AI results into inspection, safety, maintenance and office systems. Carry evidence and verification through to the next action.</p></article><article><span class="story-step-number">04</span><h4>Continue improving</h4><p>Connect confirmed cases to model validation and updates, while integrating security, print management and infrastructure monitoring.</p></article></div>`:`<div class="story-heading"><div><span class="story-overline">INFRASTRUCTURE → INTELLIGENCE → OPERATIONS</span><h3>기술이 현장의 업무로 이어질 때까지.</h3></div><p>인프라를 구축하고, 보안을 적용하고, 운영을 이어 온 경험 위에 AI 솔루션을 만들고 연결합니다.</p></div><div class="story-steps"><article><span class="story-step-number">01</span><h4>현장을 이해합니다</h4><p>기존 카메라, 가상 PC, 네트워크 경계와 업무 시스템을 먼저 봅니다. 해결할 문제와 실제 운영 조건을 함께 정의합니다.</p></article><article><span class="story-step-number">02</span><h4>필요한 AI를 구성합니다</h4><p>ZiewCore를 중심으로 영상·시계열·문서 이해 기술을 연결합니다. 도메인에 맞는 모델과 규칙을 조합해 판단 흐름을 만듭니다.</p></article><article><span class="story-step-number">03</span><h4>업무에 연결합니다</h4><p>검사, 안전 관제, 설비 보전과 사무 시스템으로 분석 결과를 전달합니다. 근거와 확인 과정을 거쳐 다음 조치까지 이어갑니다.</p></article><article><span class="story-step-number">04</span><h4>운영하며 개선합니다</h4><p>확인된 사례를 모델 검증과 업데이트에 반영합니다. 보안·출력 관리·인프라 모니터링까지 함께 연결해 지속 운영을 돕습니다.</p></article></div>`;
}
const observer=new MutationObserver(render);document.querySelectorAll('.sim-tab').forEach(tab=>observer.observe(tab,{attributes:true,attributeFilter:['aria-selected']}));
window.addEventListener('ziewise:language',render);render();
window.addEventListener('pagehide',event=>{if(!event.persisted){observer.disconnect();window.removeEventListener('ziewise:language',render);}});
