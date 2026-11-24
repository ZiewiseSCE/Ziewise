window.ZiewiseOffice = [
  {id:'hr',name:'인사',en:'HR',title:'입사 준비에서 빠진 서류를 먼저 찾습니다.',input:'입사 요청, 제출 서류와 사내 온보딩 규정',llm:'필수 서류와 요청 내용을 대조해 누락 항목과 입사 준비 목록을 작성합니다.',approval:'인사 담당자가 누락 여부와 권한 요청 범위를 확인합니다.',rpa:'승인된 온보딩 업무를 그룹웨어에 등록하고 계정·권한 요청을 발행합니다.',measure:'입사 1건당 준비시간, 누락 서류 재요청 건수',original:'sLLM',file:'10-hr.mp3'},
  {id:'finance',name:'재무',en:'FINANCE',title:'영수증부터 전표 초안까지 근거를 연결합니다.',input:'영수증, 세금계산서, 경비 규정과 계정과목표',llm:'금액·날짜·거래처를 추출하고 규정상 예외와 관련 근거를 표시합니다.',approval:'회계 담당자가 증빙과 계정과목, 예외 항목을 확인합니다.',rpa:'검토된 전표 초안을 ERP에 입력하고 해당 증빙을 첨부합니다.',measure:'전표 1건당 처리시간, 반려율과 재입력 건수',original:'sLLM',file:'11-finance.mp3'},
  {id:'purchase',name:'구매',en:'PROCUREMENT',title:'서로 다른 견적서를 같은 기준으로 비교합니다.',input:'구매 요청서, 공급사별 견적서와 사내 구매 조건',llm:'규격·단가·납기·결제 조건을 맞춰 비교표를 만들고 다른 조건을 표시합니다.',approval:'구매 담당자가 규격과 예외를 검토해 거래처·금액을 승인합니다.',rpa:'승인된 발주를 ERP에 등록하고 구매 요청과 발주 번호를 연결합니다.',measure:'견적 비교시간, 발주 등록시간과 입력 정정 건수',original:'sLLM',file:'12-purchase.mp3'},
  {id:'sales',name:'영업',en:'SALES',title:'상담 기록을 견적과 다음 영업 활동으로 잇습니다.',input:'미팅 기록, CRM 기회 정보와 승인된 가격표',llm:'고객의 요청을 요약하고 가격표를 근거로 견적 초안과 후속 업무를 정리합니다.',approval:'영업 담당자가 금액·조건·대외 문구를 검토합니다.',rpa:'승인된 내용을 CRM에 반영하고 후속 일정과 담당자 할 일을 등록합니다.',measure:'상담 후 기록시간, 견적 준비시간과 후속 업무 누락률',original:'sLLM',file:'13-sales.mp3'}
];

(function initEnterpriseSections(){
  const host=document.getElementById('department-examples');
  if(host){
    const tabs=host.querySelector('[role="tablist"]'),panel=host.querySelector('[role="tabpanel"]');
    let selected=0;
    const buttons=window.ZiewiseOffice.map((item,index)=>{
      const button=document.createElement('button');button.type='button';button.setAttribute('role','tab');
      button.id='department-'+item.id;button.setAttribute('aria-controls',panel.id);button.textContent=item.name+' · '+item.en;
      tabs.append(button);button.addEventListener('click',()=>show(index));return button;
    });
    function show(index){
      selected=index;const item=window.ZiewiseOffice[index];
      buttons.forEach((button,i)=>{button.setAttribute('aria-selected',String(index===i));button.tabIndex=index===i?0:-1;});
      panel.setAttribute('aria-labelledby',buttons[index].id);
      const still=host.querySelector('[data-dept-still]')||host.querySelector('img');
      still.src=['hr','finance'].includes(item.id)?'./field-tour/photography/'+item.id+'.webp':'./ai-briefing/assets/dept-'+item.id+'.webp';
      still.alt=item.name+' 업무를 설명하는 재현 이미지';
      host.querySelector('h3').textContent=item.title;
      for(const key of ['input','llm','approval','rpa','measure']) host.querySelector('[data-part="'+key+'"]').textContent=item[key];
      host.querySelector('.department-audio').href='./ai-briefing/?chapter='+item.id+'#chapters';
      const frame=host.querySelector('[data-visit]');if(frame)frame.dataset.scene=item.id;
      document.dispatchEvent(new CustomEvent('ziewise:visit',{detail:{kind:'office',id:item.id}}));
    }
    tabs.addEventListener('keydown',event=>{
      const keys={ArrowRight:1,ArrowLeft:-1,Home:-selected,End:buttons.length-1-selected};
      if(!(event.key in keys))return;event.preventDefault();show((selected+keys[event.key]+buttons.length)%buttons.length);buttons[selected].focus();
    });
    show(1);
  }

  const roi=document.querySelector('[data-roi-calculator]');
  if(!roi)return;
  const fields=[
    ['volume','월 처리 건수','건',2000,10000000,1],
    ['before','도입 전 건당 시간','분',12,10080,.1],
    ['after','도입 후 건당 시간','분',4,10080,.1],
    ['hourly','시간당 인건비','원',30000,10000000,1],
    ['initial','초기 도입비','만원',3000,100000000,1],
    ['running','월 운영비','만원',200,100000000,1]
  ];
  const controls=new Map();
  const fmt=new Intl.NumberFormat('ko-KR',{maximumFractionDigits:1});
  const money=n=>fmt.format(n/10000)+'만원';
  const box=roi.querySelector('.roi-fields');
  for(const [name,label,unit,defaultValue,max,step] of fields){
    const wrapper=document.createElement('label'),caption=document.createElement('span'),input=document.createElement('input');
    caption.textContent=label+' ('+unit+')';input.type='number';input.min='0';input.max=String(max);input.step=String(step);
    input.inputMode=step===1?'numeric':'decimal';input.value=String(defaultValue);input.id='roi-'+name;input.required=true;
    wrapper.append(caption,input);box.append(wrapper);controls.set(name,input);
  }
  const put=(id,value)=>{roi.querySelector('[data-value="'+id+'"]').textContent=value;};
  function calculate(){
    const invalid=Array.from(controls.values()).some(input=>!input.checkValidity()||!Number.isFinite(input.valueAsNumber));
    if(invalid){
      for(const id of ['hours','gross','net','annual','roi','payback'])put(id,'—');
      roi.querySelector('.roi-status').textContent='모든 항목에 허용 범위 안의 숫자를 입력해 주세요.';return;
    }
    const val=k=>controls.get(k).valueAsNumber;
    const hours=val('volume')*(val('before')-val('after'))/60;
    const gross=hours*val('hourly'),opex=val('running')*10000,initial=val('initial')*10000;
    const net=gross-opex,cost=initial+12*opex,annual=12*net-initial;
    put('hours',fmt.format(hours)+'시간');put('gross',money(gross));put('net',money(net));put('annual',money(annual));
    put('roi',cost>0?fmt.format(100*annual/cost)+'%':'비용 0원 · 산정 제외');
    put('payback',net>0?fmt.format(initial/net)+'개월':'월 순효익으로 회수 불가');
    roi.querySelector('.roi-status').textContent=hours<0?'입력한 조건에서는 도입 후 처리시간이 더 깁니다.':'';
  }
  box.addEventListener('input',calculate);
  roi.querySelector('.roi-reset').addEventListener('click',()=>{for(const [key,,,v] of fields)controls.get(key).value=String(v);calculate();});
  calculate();
})();
