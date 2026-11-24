// Example records displayed inside the facility, using the same lot and amount as the physical props.
const faces={
  'finance-review':{app:'재무 · 매입 관리',title:'매입 증빙 대조',ref:'AP-0142',state:'검토 중',
    rows:[['거래처','세광 부품'],['원문 합계','₩128,000'],['전표 예정액','₩128,000']],action:'담당자 승인 요청'},
  'finance-posted':{app:'재무 · 매입 관리',title:'매입 전표 초안',ref:'AP-0142',state:'승인 완료',
    rows:[['거래처','세광 부품'],['전표 금액','₩128,000'],['연결 증빙','청구서 · 영수증']],action:'RPA 입력 이력 확인'},
  'hr-policy-in':{app:'인사 · 온보딩',title:'입사 서류 접수',ref:'HR-0027',state:'접수',
    rows:[['배정 부서','품질팀'],['업무 역할','품질 검사'],['신청 권한','검사 이력 열람']],action:'인사 규정 확인'},
  'hr-policy-out':{app:'인사 · 온보딩',title:'권한 신청 검토',ref:'HR-0027',state:'승인 대기',
    rows:[['기준 문서','입사 규정 3.2'],['부서 · 직무','확인 완료'],['계정 발급','인사팀 승인 대기']],action:'승인 후 계정 발급 요청'},
  'archive-question':{app:'ZiewLLM · 사내 지식',title:'설비 점검 절차',ref:'문서 검색',state:'권한 확인',
    rows:[['질문','점검 전에 무엇을 확인하나요?'],['문서 범위','설비팀 현행 절차서'],['열람 권한','설비팀']],action:'관련 절차서 검색'},
  'archive-result':{app:'ZiewLLM · 사내 지식',title:'점검 전 확인 사항',ref:'설비 절차서',state:'근거 확인',
    rows:[['근거 문서','설비 점검 절차서'],['원문 위치','개정 03 · 12쪽'],['담당 부서','설비팀']],action:'근거 문서 열기'},
  'sales-input':{app:'영업 · 고객 관리',title:'상담 내용 정리',ref:'OP-0071',state:'검토 중',
    rows:[['문의 품목','가공 부품'],['연결 문서','미팅 메모 · 승인 가격표'],['다음 업무','견적 조건 확인']],action:'견적 초안 작성'},
  'sales-quote':{app:'영업 · 고객 관리',title:'견적 초안 검토',ref:'OP-0071',state:'승인 대기',
    rows:[['기준 단가','승인 가격표 연결'],['할인 조건','담당자 확인 필요'],['후속 활동','CRM 회신 일정 등록']],action:'영업 담당자 검토'}
};
const font='"Malgun Gothic","Noto Sans KR",Arial,sans-serif';
function text(c,line,x,y,size,color,weight=500,max=2000){
  c.fillStyle=color;c.font=weight+' '+size+'px '+font;c.textBaseline='middle';c.fillText(line,x,y,max);
}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
export function officeScreen(key){
  const f=faces[key];if(!f)return null;
  return (c,width,height)=>{
    const w=600,h=600*height/width,slim=h>w,pad=slim?35:27;
    c.save();c.scale(width/w,height/h);
    rect(c,0,0,w,h,'#eef1f2');rect(c,0,0,w,slim?70:47,'#192b35');
    rect(c,pad,slim?25:14,5,slim?23:17,'#72b8a5');
    text(c,f.app,pad+16,slim?37:24,slim?27:20,'#f3f7f6',660);
    const header=slim?112:75;
    text(c,f.ref,pad,header,slim?23:17,'#5b727a',600);
    text(c,f.title,pad,header+(slim?55:38),slim?48:35,'#122a35',740,w-2*pad-100);
    const badgeW=slim?135:96,badgeY=header+(slim?29:18);
    rect(c,w-pad-badgeW,badgeY,badgeW,slim?46:32,'#d1e8df');
    text(c,f.state,w-pad-badgeW+13,badgeY+(slim?24:17),slim?22:16,'#205547',650,badgeW-23);
    const top=header+(slim?103:70),foot=h-(slim?105:64),rh=(foot-top)/3;
    rect(c,pad,top,w-pad*2,foot-top,'#fbfcfb');
    for(const [i,[label,value]] of f.rows.entries()){
      const y=top+i*rh;rect(c,pad,y,w-pad*2,1.5,'#c5d1d3');
      text(c,label,pad+13,y+rh*(slim?.29:.5),slim?22:18,'#556972',560);
      const left=slim?pad+13:203;
      text(c,value,left,y+rh*(slim?.69:.5),slim?30:22,'#1c343d',660,w-pad-left-13);
    }
    rect(c,pad,foot,w-pad*2,1.5,'#b7c5c7');
    const by=foot+(slim?21:12),bh=slim?52:35;
    rect(c,pad,by,w-2*pad,bh,'#22514f');text(c,f.action,pad+17,by+bh/2,slim?24:18,'#f5f9f6',610);
    c.restore();
  };
}

export function processScreen(c,kind,width,height){
  const w=760,h=416;c.save();c.scale(width/w,height/h);
  const label=(s,x,y,sz,color='#d5e3e2',wt=550)=>text(c,s,x,y,sz,color,wt);
  const isCount=kind.startsWith('count'),mes=kind==='mes';
  rect(c,0,0,w,h,'#18262d');rect(c,0,0,w,49,'#263b45');rect(c,18,15,5,23,'#75bdac');
  label(isCount?'출하 검수  /  수량 대조':mes?'MES  /  생산 이력':'DCS  /  압력 추세',35,26,25,'#f0f6f5',690);
  label(isCount?'PACK-01':'CELL 04   ·   LOT 18B',515,26,16,'#adc1bd');
  if(mes){
    label('플랜지 생산 로트',25,91,32,'#f0f3ec',680);label('작업지시   WO-0214',465,91,21);
    rect(c,24,125,710,38,'#283943');
    const xs=[39,184,325,512];['로트','투입 시각','공정','품질 상태'].forEach((s,i)=>label(s,xs[i],145,18,'#b0c5c6'));
    const list=[['18A','10:04','가공 → 검사','정상'],['18B','10:18','가공 → 검사','표면 재검'],['19A','10:36','가공 대기','대기']];
    list.forEach((row,i)=>{const y=170+i*57;rect(c,24,y,710,51,i===1?'#34534d':'#1d2c33');if(i===1)rect(c,24,y,5,51,'#e0b96f');row.forEach((s,j)=>label(s,xs[j],y+26,22,i===1?'#f3e7cb':'#c5d4d2'));});
    label('선택 로트 18B     ·     공정 신호 연계',26,382,20,'#9fc8b6');
  }else if(isCount){
    const full=kind==='count-complete';label(full?'재검 완료':'수량 확인',27,97,34,'#f1f3ed',710);
    label(full?'50 / 50':'49 / 50',25,198,68,full?'#b1d5b3':'#ebc580',700);
    label(full?'주문 수량 일치':'미검출 1개',31,266,24);label('포장 단위   50 EA',31,358,20,'#92aeaf');
    for(let i=0;i<50;i++){
      const absent=!full&&i===37;rect(c,333+(i%10)*38,139+Math.floor(i/10)*37,30,27,absent?'#d5a25c':'#608b7e');
      if(absent)rect(c,342+(i%10)*38,149+Math.floor(i/10)*37,12,6,'#373127');
    }
  }else{
    label('공정 압력',22,87,31,'#f0f3ef',700);label('PT-204     bar',434,87,21,'#b5c2c7');
    const left=74,top=125,cw=650,ch=197;
    rect(c,left+cw*.60,top,cw*.19,ch,'#3a3831');
    for(let i=0;i<=4;i++){const y=top+i*ch/4;rect(c,left,y,cw,1,'#42505a');label((5-i*.5).toFixed(1),25,y,15,'#9caeb0');}
    for(let i=0;i<=6;i++)rect(c,left+i*cw/6,top,1,ch,'#33434b');
    c.setLineDash([8,6]);c.strokeStyle='#c2a270';c.lineWidth=2;c.beginPath();c.moveTo(left,top+ch*.58);c.lineTo(left+cw,top+ch*.58);c.stroke();c.setLineDash([]);
    c.strokeStyle='#8bd2b8';c.lineWidth=4;c.beginPath();
    for(let i=0;i<=130;i++){const t=i/130,px=left+cw*t,py=top+ch*(.60-.028*Math.sin(39*t)-.021*Math.cos(94*t)-.39*Math.exp(-Math.pow((t-.69)*10,2)));if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.stroke();
    for(const [i,clock] of ['10:14','10:16','10:18','10:20'].entries())label(clock,left+i*cw/3-13,345,16,'#b7c3c2');
    label('PV   측정 압력',25,388,19,'#9cd4bd');label('SP   설정값',273,388,19,'#d9b778');label('검토 구간   10:18',508,388,19,'#d4c4a3');
  }
  c.restore();
}
