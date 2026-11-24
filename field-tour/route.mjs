// Station centers run down a shared aisle. Local +Z on each equipment model faces the visitor.
export const stops = [
  {id:'design', z:4, side:1, label:'검사 설계', room:'검사 셀', area:'제조동', title:'이 부품, 출하해도 될까요?', short:'품질 담당자가 보여 준 플랜지에서 시작합니다. 현장의 말을 LLM이 검사 기준으로 정리합니다.', marks:['플랜지 표면','검사 영상 수집','검사 기준 확인'], shot:'arc'},
  {id:'systems', z:0, side:-1, label:'MES·DCS', room:'공정 관제실', area:'제조동', title:'흠집이 생긴 순간, 압력은 어땠을까요?', short:'MES에서 로트를 찾고 DCS의 압력 신호를 겹쳐 봅니다. 딥러닝이 짚은 구간을 담당자가 확인합니다.', marks:['생산 로트 이력','압력 신호','점검 구간'], shot:'track'},
  {id:'vision', z:-3.8, side:1, label:'비전 검사', room:'광학 검사대', area:'제조동', title:'빛을 비추면 흠집이 드러납니다.', short:'링 조명이 부품을 비춥니다. 처음 보는 로트로 검증하고, 표시된 위치를 작업자가 다시 봅니다.', marks:['조명 아래 검사품','광학 카메라','재검 위치'], shot:'lean'},
  {id:'safety', z:-7.7, side:-1, label:'안전 관제', room:'안전 통로', area:'제조동', title:'관제자가 먼저 볼 장면을 고릅니다.', short:'카메라 위치와 작업 구역을 맞춰, 확인이 필요한 순간을 한 클립으로 모읍니다.', marks:['관제 카메라','보행 안전 구역','이벤트 확인'], shot:'wide'},
  {id:'maintenance', z:-11.7, side:1, label:'예지보전', room:'밸브 점검대', area:'제조동', title:'밸브가 제때 열렸을까요?', short:'실제 밸브 응답을 개도 명령과 대조해 정비 담당자가 먼저 점검할 설비를 찾습니다.', marks:['제어 밸브','명령과 실제 응답','정비 판단'], shot:'lean'},
  {id:'count', z:-15.7, side:-1, label:'포장 검수', room:'출하 검수대', area:'제조동', title:'한 개가 모자라면 출하 전에 멈춥니다.', short:'카메라가 센 수량을 주문 기준과 대조합니다. 작업자가 빈자리를 채운 뒤 다시 확인합니다.', marks:['포장 단위','수량 대조','출하 확인'], shot:'track'},
  {id:'edge', z:-19.5, side:1, label:'엣지 운영', room:'현장 서버실', area:'제조동', title:'판정은 검사대 바로 옆에서.', short:'검증된 모델을 현장 장비에 배포합니다. 작업자가 내린 최종 판정은 다음 검증의 자료가 됩니다.', marks:['검사 입력','엣지 컴퓨터','운영 기록'], shot:'arc'},
  {id:'knowledge', z:-23.8, side:-1, label:'사내 지식', room:'자료 열람실', area:'업무동', title:'어느 규정을 근거로 답했을까요?', short:'ZiewLLM이 직원의 열람 권한에 맞춰 사내 문서를 찾습니다. 답변 옆에서 원문을 확인합니다.', marks:['사내 문서','권한별 검색','원문 근거'], shot:'wide'},
  {id:'hr', z:-27.5, side:1, label:'인사', room:'온보딩 데스크', area:'업무동', title:'첫 출근 전에 빠진 서류를 찾습니다.', short:'인사 담당자가 로컬 LLM의 준비 목록을 확인하면 RPA가 계정과 업무 요청을 등록합니다.', marks:['입사 서류','준비 목록','권한 요청'], shot:'arc'},
  {id:'finance', z:-31, side:-1, label:'재무', room:'재무 검토석', area:'업무동', title:'영수증 한 장이 전표가 되기까지.', short:'사내 로컬 LLM이 증빙과 규정을 연결합니다. 담당자가 승인하면 RPA가 ERP에 입력합니다.', marks:['영수증과 증빙','규정 대조','ERP 전표'], shot:'lean'},
  {id:'purchase', z:-34.5, side:1, label:'구매', room:'견적 비교대', area:'업무동', title:'다른 견적서를 같은 조건에 놓습니다.', short:'구매 담당자가 규격과 납기를 비교해 승인하면 RPA가 발주 번호를 연결합니다.', marks:['공급사 견적','조건 비교','발주 승인'], shot:'track'},
  {id:'sales', z:-38, side:-1, label:'영업', room:'영업 상담석', area:'업무동', title:'미팅이 끝나면 다음 할 일이 보입니다.', short:'상담 기록과 가격표에서 견적 초안을 만들고, 승인한 내용을 CRM과 후속 일정에 남깁니다.', marks:['상담 기록','견적 초안','CRM 후속 일정'], shot:'wide'},
  {id:'roi', z:-41.5, side:1, label:'투자 효과', room:'운영 분석실', area:'검증실', title:'돌려받은 시간은 얼마일까요?', short:'월 2,000건에서 건당 8분을 줄이면 월 약 267시간입니다. 도입비와 운영비를 더해 투자 효과를 따져봅니다.', marks:['처리 시간','월 확보 시간','투자 효과 예시'], shot:'track'},
  {id:'poc', z:-45, side:-1, label:'현장 실증', room:'실증 검토실', area:'검증실', title:'다음 라인에도 적용할 수 있을까요?', short:'같은 현장 조건에서 시험한 기록을 함께 검토하고, 확대할지 보완할지 결정합니다.', marks:['현장 샘플','비교 검증','확대 판단'], shot:'arc'}
];
export const byId = new Map(stops.map((stop,index)=>[stop.id,{...stop,index}]));
export const homeRoute = [
  ['design',9],['systems',9],['vision',8],['edge',10],['finance',11],['roi',9]
];
export const referenceMap = {
  s01:'design',s02:'design',s03:'poc',s04:'safety',s05:'vision',s06:'systems',s07:'safety',s08:'vision',
  s09:'vision',s10:'safety',s11:'maintenance',s12:'count',sBEAUTY:'count',s13:'systems',s14:'edge',
  sAI:'edge',sCUST:'design',s15:'edge',sEN:'maintenance',sSEC:'knowledge',sLLM:'knowledge',sPROD:'knowledge',
  sESG:'roi',s16:'roi',sSCN:'poc',s17:'roi',s18:'poc',s19:'poc',sVALVE:'maintenance',sCOUNT:'count',s20:'poc'
};
