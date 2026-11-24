window.BriefTopics = [
  {
    id:'design',label:'검사 설계',tag:'LLM DESIGN',title:'현장의 한 문장을 검사 기준표로',
    img:'../assets/field-02.webp',alt:'검사대 위 두 금속 부품과 표면 가공 무늬·흠집을 비교하는 모니터',original:'sCUST',file:'01-design.mp3',
    rows:['담당자의 요구, 정상 부품과 재검이 필요했던 샘플, 기존 검사 기록을 모읍니다.','LLM이 촬영 조건과 라벨 기준, 비교할 모델 후보를 초안으로 정리합니다.','품질 담당자와 엔지니어가 실제 부품을 보며 정상·재검의 경계와 예외를 확정합니다.'],
    points:[[49,65,'실물 샘플','양품과 재검품을 같은 조건에서 촬영해 비교할 기준을 만듭니다.'],[79,32,'표면 비교','정상 가공 무늬와 흠집의 차이를 팀이 같은 말로 설명할 수 있게 기록합니다.']]
  },
  {
    id:'vision',label:'비전 검사',tag:'VISION INSPECTION',title:'빛의 각도를 맞추고, 새로운 생산 로트로 검증',
    img:'../assets/field-03.webp',alt:'고정식 카메라와 링 조명이 금속 플랜지의 가공면을 검사하는 장비',original:'s09',file:'02-vision.mp3',
    rows:['고정된 조명과 카메라로 표면 영상을 얻고, 품번과 생산 로트 정보를 함께 남깁니다.','딥러닝 모델이 의심 위치를 표시합니다. 학습에 쓰지 않은 로트에서 미검출과 오검출을 따로 집계합니다.','고객은 놓친 불량과 불필요한 재검의 비용을 비교해 현장 판정 기준을 정합니다.'],
    points:[[56,37,'광학 검사 장치','조명과 초점을 고정해야 모델이 촬영 환경의 차이를 결함으로 오인할 가능성을 줄일 수 있습니다.'],[63,76,'금속 표면','부품별 검사 결과를 원본 영상과 연결해 담당자가 다시 확인할 수 있게 합니다.']]
  },
  {
    id:'safety',label:'안전 관제',tag:'SAFETY MONITORING',title:'수십 개 화면에서 확인할 이벤트만 선별',
    img:'./assets/safety-floor.webp',alt:'생산동의 고정형 CCTV와 안전 통로를 이용하는 작업자를 보여주는 재현 이미지',original:'s10',file:'03-safety.mp3',
    rows:['기존 CCTV 영상과 현장별 안전 구역, 보호구 착용 기준을 입력합니다.','Zieview가 의심 이벤트를 선별해 해당 카메라의 위치와 전후 상황을 담은 클립으로 묶습니다.','관제 담당자는 클립을 보고 현장 확인 여부를 결정합니다. 오알림도 기록해 기준을 조정합니다.'],
    points:[[27,30,'고정형 카메라','이미 설치한 카메라에서 시야와 사각지대, 야간 화질을 먼저 확인합니다.'],[72,67,'현장 구역','구역별 동선과 보호구 규정을 정한 뒤 담당자가 알림을 검토합니다.']]
  },
  {
    id:'maintenance',label:'예지보전',tag:'PREDICTIVE MAINTENANCE',title:'밸브가 명령대로 반응하는지 확인',
    img:'./assets/case-valve.webp',alt:'산업용 밸브와 센서 배관이 있는 화학 공정 재현 이미지',original:'sVALVE',file:'04-maintenance.mp3',
    rows:['분산제어시스템(DCS)의 개도 명령과 응답, 압력·유량 이력, 정비 기록을 시간순으로 맞춥니다.','정상 운전 패턴과 최근 응답을 비교해 지연이나 반복 편차가 생긴 밸브를 점검 후보로 올립니다.','정비 담당자는 추세와 운전 조건을 함께 보고 즉시 점검할 밸브와 계획 정비 대상을 정합니다.'],
    points:[[57,47,'공정 밸브','개도 명령과 실제 응답이 얼마나 어긋나는지 같은 시각의 데이터로 비교합니다.'],[78,65,'공정 맥락','압력이나 유량 변화까지 함께 봐서 설비 이상과 운전 조건 변화를 구분합니다.']]
  },
  {
    id:'count',label:'수량 검증',tag:'PACKING VERIFICATION',title:'한 개 부족한 포장을 출하 전에 발견',
    img:'./assets/case-count.webp',alt:'산업용 비전 카메라가 금속 부품과 출하 상자를 촬영하는 정량 포장 재현 이미지',original:'sCOUNT',file:'05-count.mp3',
    rows:['품목과 포장 단위별 목표 수량, 포장 직전 부품 영상을 연결합니다.','검출한 수와 목표 수를 비교합니다. 겹침이나 누락이 의심되면 포장을 보류하고 다시 확인합니다.','작업자는 부족한 부품을 보충한 뒤 재검합니다. 확인된 수량과 처리 기록을 출하 이력으로 남깁니다.'],
    points:[[38,35,'계수 카메라','볼트와 너트의 윤곽이 구분되도록 조명과 작업면의 대비를 확인합니다.'],[70,72,'정량 포장','50개 또는 100개처럼 품목별로 정해진 수량과 일치하는지 마지막에 대조합니다.']]
  },
  {
    id:'edge',label:'엣지 운영',tag:'EDGE MLOPS',title:'검사대 가까이에서 추론하고 검토 기록을 환류',
    img:'../assets/field-04.webp',alt:'생산 라인 옆 산업용 엣지 컴퓨터와 부품 검사 화면',original:'s15',file:'06-edge.mp3',
    rows:['현장 카메라의 입력, 검증을 마친 모델 버전, 승인된 판정 기준을 준비합니다.','ZiewCore를 통해 엣지에서 추론하고 이벤트를 관제 화면에 연결합니다. 새 모델은 검증 후 반영합니다.','작업자는 의심 위치를 보고 재검 결과를 남깁니다. 운영자는 버전별 오류와 현장 처리 시간을 확인합니다.'],
    points:[[81,39,'엣지 장비','생산 라인 가까이에서 영상을 처리하고 필요한 검사 결과를 업무 시스템에 연결합니다.'],[67,43,'작업 화면','작업자는 원본 영상과 표시된 위치로 재검 사유를 확인합니다.']]
  },
  {
    id:'knowledge',label:'사내 지식',tag:'ZIEWLLM · RAG',title:'답변과 함께 근거 문서를 확인',
    img:'./assets/knowledge-desk.webp',alt:'업무 담당자가 노트북에서 검색한 근거와 인쇄된 사내 절차서를 대조하는 재현 이미지',original:'sLLM',file:'07-knowledge.mp3',
    rows:['직원의 질문, 사내 규정과 매뉴얼, 문서별 열람 권한을 연결합니다.','ZiewLLM이 권한 안의 자료를 검색해 답변과 출처를 정리합니다. 확인되지 않은 내용은 별도로 표시합니다.','담당자가 원문을 열어 근거를 확인합니다. 시스템 변경이나 업무 처리에는 승인 절차를 둡니다.'],
    points:[[67,41,'문서 검색','현재 사용자가 열람할 수 있는 자료만 검색과 답변의 근거로 사용합니다.'],[57,75,'원문 대조','인용한 문서의 위치와 버전을 확인하고 실제 업무 처리 여부를 결정합니다.']]
  },
  {
    id:'poc',label:'현장 실증',tag:'PROOF OF CONCEPT',title:'작은 구역에서 도입 여부를 결정',
    img:'./assets/poc-review.webp',alt:'품질 담당자와 엔지니어가 실제 부품과 검사 기준을 함께 검토하는 가상 현장',original:'s18',file:'08-poc.mp3',
    rows:['시범 구역, 고객 샘플, 기존 업무의 측정값과 수용 가능한 오류 범위를 정합니다.','같은 조건에서 기존 방식과 모델을 병행하고, 실패 사례·응답 시간·담당자 재검 부담을 기록합니다.','고객이 합의한 기준을 충족했는지 검토해 추가 수집, 보완 또는 다음 라인으로의 확대를 결정합니다.'],
    points:[[55,63,'현장 샘플','도입 여부를 판단할 샘플은 고객의 실제 운전 조건과 예외 상황을 포함합니다.'],[73,54,'합의된 기준','시험을 시작하기 전에 어떤 결과면 적용할 수 있는지 고객과 엔지니어가 합의합니다.']]
  }
];

const systemsTopic={
  id:'systems',label:'MES·DCS',tag:'MES × DCS × DEEP LEARNING',title:'기존 생산·제어 시스템에 딥러닝 두뇌를 연결',
  img:'../assets/field-04.webp',alt:'생산 라인, 검사 화면과 현장 컴퓨터가 연결된 재현 이미지',original:'s06',file:'09-systems.mp3',
  rows:['MES의 작업지시·로트·품질 이력과 DCS의 설정값·압력·유량·온도 신호를 설비와 시각 기준으로 연결합니다.','딥러닝이 정상 패턴을 학습해 품질 편차와 설비 이상 징후를 찾습니다. 예를 들어 같은 로트에서 생긴 흠집과 가공 전 압력 변화를 함께 확인합니다.','운영자는 원신호와 해당 로트를 검토해 점검 또는 재검을 요청합니다. 제어값 변경은 현장 권한과 승인 절차를 거칩니다.'],
  points:[[60,42,'검사 이력','로트별 판정 결과를 MES 작업지시와 연결합니다.'],[84,44,'공정 신호','DCS에서 읽은 신호를 시간순으로 맞춰 이상 징후의 맥락을 찾습니다.']]
};
const roiTopic={
  id:'roi',label:'투자 효과',tag:'ROI · CAPACITY VALUE',title:'절약한 시간이 어떤 가치가 되는지 계산',
  img:'./assets/dept-finance.webp',alt:'업무 기록과 비용 자료를 비교하는 재무 담당자 재현 이미지',original:'s17',file:'14-roi.mp3',
  rows:['월 처리 건수, 도입 전후 건당 작업시간, 시간당 인건비, 초기 도입비와 월 운영비를 입력합니다.','월 2,000건을 건당 12분에서 4분으로 줄이는 예시는 월 266.7시간의 여유가 생깁니다. 시간당 3만원이면 월 800만원의 업무 용량입니다.','초기 3,000만원·월 운영비 200만원이면 첫해 순효익은 4,200만원, 1년 ROI는 77.8%입니다. 초과근무·외주비 같은 실제 지출 변화는 별도 확인합니다.'],
  points:[[38,55,'처리 기록','표본 업무의 시작·종료 시각을 기록하고 재검·예외 처리시간도 포함합니다.'],[71,60,'비용 조건','서버·RPA 라이선스·운영 인력을 포함해 비용을 산정합니다.']]
};
const officeTopics=window.ZiewiseOffice.map((item,index)=>({
  id:item.id,label:item.name,tag:'PRIVATE LLM + RPA · '+item.en,title:item.title,
  img:'./assets/dept-'+item.id+'.webp',alt:item.name+' 담당자의 업무를 설명하는 재현 이미지',original:item.original,file:item.file,
  rows:['담당자의 접근 권한으로 사내 서버에서 확인할 자료는 '+item.input+'입니다.',item.llm+' '+item.approval,item.rpa+' 측정 항목은 '+item.measure+'입니다.'],
  points:[[45,58,'업무 자료','이 업무의 기준 자료는 '+item.input+'입니다.'],[index===3?54:72,42,'담당자 확인',item.approval]]
}));
const topicMap=new Map([...window.BriefTopics,systemsTopic,roiTopic,...officeTopics].map(topic=>[topic.id,topic]));
window.BriefGroups=[
  {label:'제조 현장',ids:['design','systems','vision','safety','maintenance','count','edge']},
  {label:'사무 자동화',ids:['knowledge','hr','finance','purchase','sales']},
  {label:'도입 효과',ids:['roi','poc']}
];
window.BriefTopics=window.BriefGroups.flatMap(group=>group.ids.map(id=>topicMap.get(id)));
