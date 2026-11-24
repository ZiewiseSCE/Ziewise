const records={
  systems:{label:'MES × DCS',title:'같은 로트에서 압력이 달라진 순간',about:'생산 로트의 검사 시각을 DCS 압력 이력에 맞춥니다. 담당자는 딥러닝이 표시한 구간의 원신호와 검사 결과를 함께 봅니다.',meter:'프레스 압력 / MPa',rows:[['생산 로트','LOT 24-07'],['공정 편차','압력 상승 구간'],['담당자 조치','같은 로트 재검']],links:[['systems','MES·DCS'],['vision','비전 검사'],['maintenance','예지보전']],ticks:['09:41:00','09:41:30','09:42:00']},
  factory:{label:'ZIEVIEW / ZIEWOBSERVER / ZIEWPRINT',title:'공장 경보를 받고 담당자가 확인할 기록',about:'위험 구역 영상, 설비 연결 경보, 도면 출력 요청에는 각각 다른 기록이 남습니다. 제품을 고르면 담당자가 어디서 어떻게 확인하는지 들을 수 있습니다.',meter:'공장 운영 기록',rows:[['Zieview','제한 구역 진입 후보'],['ZiewObserver','설비 연결 경보 · DDI'],['ZiewPrint','도면 출력 대기']],links:[['safety','Zieview'],['observer','ZiewObserver'],['print','ZiewPrint']],ticks:['09:41','09:42','09:45']},
  office:{label:'LOCAL LLM × RPA',title:'전표 한 장이 승인되기까지',about:'회사 서버의 LLM이 영수증의 금액·날짜와 경비 규정을 대조합니다. 회계 담당자가 근거를 검토하면 RPA가 ERP에 입력합니다. 부서별 해설에서는 같은 흐름이 어떻게 달라지는지 볼 수 있습니다.',meter:'증빙 검토 진행',rows:[['원본 접수','영수증 1건'],['규정 확인','계정과목 후보'],['승인 후 실행','ERP 전표 등록']],links:[['finance','재무'],['hr','인사'],['purchase','구매'],['sales','영업']],ticks:['접수','검토','승인']},
  roi:{label:'TIME × COST',title:'매월 2,000건에서 8분씩 줄인다면',about:'월 약 267시간이 생깁니다. 예시 인건비로 환산한 가치에서 구축비와 운영비를 차감해 첫해 순효익과 회수기간을 계산합니다.',meter:'건당 처리시간 / 분',rows:[['도입 전','12분'],['도입 후','4분'],['확보 시간','266.7시간 / 월']],links:[['roi','투자 효과'],['poc','현장 실증']],ticks:['현재 12분','도입 후 4분','차이 8분']}
};
const desk=document.getElementById('brief-desk'),box=document.getElementById('instrument-plot'),rows=document.getElementById('instrument-rows');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let key='systems',step=0,elapsed=0,playing=!reduced.matches,visible=true;
function syncPhase(){
  Array.from(rows.children).forEach((e,i)=>e.classList.toggle('reading',i===step));
  desk.style.setProperty('--readout',String([.20,.60,.84][step]));
  desk.dataset.reading=step;const play=document.getElementById('instrument-play');
  play.textContent=playing?'기록 재생 일시정지':'기록 재생';play.setAttribute('aria-pressed',String(playing));
}
const graphs={
  systems:'<svg viewBox="0 0 560 116" preserveAspectRatio="none" aria-hidden="true"><path class="signal-fill" d="M0 79 45 80 81 73 135 77 174 72 201 76 250 70 281 72 315 48 340 28 369 33 399 72 431 78 475 74 512 77 560 75 V116 H0Z"/><path class="signal-line" d="M0 79 45 80 81 73 135 77 174 72 201 76 250 70 281 72 315 48 340 28 369 33 399 72 431 78 475 74 512 77 560 75"/></svg>',
  factory:'<div class="event-traces"><span>CAM</span><i></i><span>NET</span><i></i><span>PRN</span><i></i></div>',
  office:'<div class="record-flow"><b>영수증</b><i>→</i><b>규정 대조</b><i>→</i><b>전표</b></div>',
  roi:'<div class="time-bars"><p><span>도입 전</span><i></i><b>12분</b></p><p><span>도입 후</span><i></i><b>4분</b></p></div>'
};
function show(next){
  key=next;step=0;elapsed=0;const data=records[key];desk.dataset.track=key;
  for(const [id,text] of [['evidence-code',data.label],['evidence-title',data.title],['evidence-about',data.about],['instrument-label',data.meter]])document.getElementById(id).textContent=text;
  for(const b of desk.querySelectorAll('[data-track]'))if(b.tagName==='BUTTON')b.setAttribute('aria-pressed',String(b.dataset.track===key));
  box.innerHTML=graphs[key];const ticks=document.createElement('div');ticks.className='plot-ticks';
  for(const label of data.ticks){const el=document.createElement('span');el.textContent=label;ticks.append(el);}box.append(ticks);
  rows.replaceChildren(...data.rows.map(([k,v])=>{const row=document.createElement('div'),b=document.createElement('b');row.append(k);b.textContent=v;row.append(b);return row;}));
  const links=document.getElementById('evidence-links');links.replaceChildren(...data.links.map(([id,label],i)=>{
    const a=document.createElement('a');a.href='./?chapter='+id+'#chapters';a.dataset.openChapter=id;a.dataset.speak='true';
    a.textContent=label+(i===0?' 해설 듣기 →':'');a.setAttribute('aria-label',label+' 한국어 해설 듣기');return a;
  }));
  if(key==='roi'){const a=document.createElement('a');a.href='#roi';a.textContent='우리 조건으로 계산';links.append(a);}
  syncPhase();
}
desk.querySelector('.desk-choices').addEventListener('click',e=>{const b=e.target.closest('button[data-track]');if(b)show(b.dataset.track);});
document.getElementById('instrument-play').addEventListener('click',()=>{playing=!playing;syncPhase();});
new IntersectionObserver(([entry])=>visible=entry.isIntersecting).observe(desk);
setInterval(()=>{if(playing&&visible&&!document.hidden&&++elapsed>=3){elapsed=0;step=(step+1)%3;syncPhase();}},1000);
reduced.addEventListener('change',()=>{if(reduced.matches){playing=false;syncPhase();}});
show('systems');
