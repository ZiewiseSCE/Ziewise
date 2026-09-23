export const ROI_DEFAULTS={hours:8,days:250,hourly:30000,timeReduction:50,loss:5000,lossReduction:20,investment:4000,operating:1200};
export function calculateROI(input){
  const savedHours=input.hours*input.timeReduction/100;
  const laborValue=savedHours*input.days*input.hourly;
  const avoidedLoss=input.loss*10000*input.lossReduction/100;
  const gross=laborValue+avoidedLoss, net=gross-input.operating*10000,investment=input.investment*10000;
  return {savedHours,laborValue,avoidedLoss,gross,net,payback:net>0&&investment>0?investment/net*12:null,roi:investment>0?(net-investment)/investment*100:null};
}
export function mountHeroROI(){
  const dialog=document.querySelector('#hero-roi-dialog'),form=dialog.querySelector('form');
  const fields=[
    ['hours','일 검사 작업시간 (인시)','Daily inspection work (person-hours)',0,10000,.5],
    ['days','연간 가동일','Operating days / year',0,366,1],
    ['hourly','시간당 인건비 (원)','Labor cost / hour (KRW)',0,1000000,1000],
    ['timeReduction','검사시간 감소 가정 (%)','Assumed time reduction (%)',0,100,1],
    ['loss','연간 불량 손실 (만원)','Annual defect losses (KRW 10,000)',0,100000000,100],
    ['lossReduction','불량 손실 감소 가정 (%)','Assumed loss reduction (%)',0,100,1],
    ['investment','초기 도입비 (만원)','Initial investment (KRW 10,000)',0,100000000,100],
    ['operating','연간 운영비 (만원)','Annual running cost (KRW 10,000)',0,100000000,100]
  ];
  const container=dialog.querySelector('.roi-inputs');let opener;
  fields.forEach(([id,ko,en,min,max,step])=>{
    const label=document.createElement('label');label.innerHTML=`<span data-roi-label="${id}"></span><input name="${id}" type="number" min="${min}" max="${max}" step="${step}" required value="${ROI_DEFAULTS[id]}">`;container.append(label);
  });
  const english=()=>document.documentElement.lang==='en';
  const money=n=>english()?`₩${Math.round(n).toLocaleString('en-US')}`:`${(n/10000).toLocaleString('ko-KR',{maximumFractionDigits:0})}만원`;
  function refresh(){
    const en=english(),index=en?2:1;
    fields.forEach(f=>{dialog.querySelector(`[data-roi-label="${f[0]}"]`).textContent=f[index];});
    const inputs=[...form.querySelectorAll('input')];const valid=inputs.every(el=>el.checkValidity());
    dialog.querySelector('.roi-validation').hidden=valid;
    dialog.querySelector('.roi-results').hidden=!valid;
    if(!valid){document.querySelectorAll('[data-roi-output]').forEach(el=>el.textContent='—');return;}
    const data=Object.fromEntries(inputs.map(el=>[el.name,Number(el.value)])),r=calculateROI(data);
    const set=(id,value)=>document.querySelectorAll(`[data-roi-output="${id}"]`).forEach(el=>el.textContent=value);
    set('time',`${r.savedHours.toLocaleString(en?'en-US':'ko-KR',{maximumFractionDigits:1})}${en?' h/day':'시간/일'}`);
    set('labor',money(r.laborValue));set('loss',money(r.avoidedLoss));set('gross',money(r.gross));set('net',money(r.net));
    set('payback',r.payback===null?(en?'Not reached':'산출 불가'):`${r.payback.toFixed(1)}${en?' months':'개월'}`);
    set('roi',r.roi===null?'—':`${r.roi.toFixed(1)}%`);
    window.dispatchEvent(new CustomEvent('ziewise:roi',{detail:{timeRatio:1-data.timeReduction/100,lossRatio:1-data.lossReduction/100}}));
    document.querySelector('.roi-value-note').textContent=en?'Illustrative assumptions · economic value, not guaranteed savings':'가정 기반 예시 · 실제 절감 성과를 보장하지 않습니다';
  }
  const copy={
    title:['우리 현장의 절감 효과를 계산해 보세요.','Estimate the value for your operation.'],
    intro:['아래 값은 계산 예시입니다. 실제 현장 조건과 견적을 입력해 보세요.','These are example assumptions. Enter your operating conditions and quoted costs.'],
    close:['닫기','Close'],reset:['예시 값으로 되돌리기','Reset example'],
    labor:['연간 검사시간 가치','Annual value of saved inspection time'],loss:['연간 불량 손실 절감','Annual avoided defect losses'],
    gross:['연간 총 기대효과','Annual gross benefit'],net:['운영비 차감 후 연간 기대효과','Annual benefit after running costs'],
    roi:['첫해 단순 ROI','First-year simple ROI'],payback:['단순 투자 회수기간','Simple payback'],
    note:['검사시간 절감은 생산성의 금액 환산이며, 실제 인건비 지출 감소와 다를 수 있습니다. 불량 손실에는 위 인건비를 중복 포함하지 마세요. 세금·할인율·도입 지연은 반영하지 않은 정상 가동 1년 기준의 단순 계산입니다.','Saved inspection time is a productivity valuation and may not reduce payroll spending. Exclude overlapping labor costs from defect losses. Simple estimates assume a full operating year and exclude taxes, discounting and implementation delays.'],
    formula:['연간 기대효과 = 절감 인시 × 가동일 × 시간당 인건비 + 불량 손실 절감 − 연간 운영비. 첫해 ROI = (연간 기대효과 − 초기 도입비) ÷ 초기 도입비. 회수기간 = 초기 도입비 ÷ 연간 기대효과 × 12개월.','Annual benefit = saved person-hours × operating days × hourly labor cost + avoided defect losses − annual running cost. First-year ROI = (annual benefit − initial investment) / initial investment. Payback = initial investment / annual benefit × 12 months.'],
    validation:['입력 범위에 맞는 숫자를 모두 입력해 주세요.','Enter valid numbers within the indicated ranges.']
  };
  function language(){Object.entries(copy).forEach(([key,text])=>dialog.querySelectorAll(`[data-roi-text="${key}"]`).forEach(el=>el.textContent=text[english()?1:0]));refresh();}
  document.querySelectorAll('[data-open-roi]').forEach(button=>button.addEventListener('click',()=>{
    opener=button;dialog.showModal();window.dispatchEvent(new CustomEvent('ziewise:dialog',{detail:true}));dialog.querySelector('button').focus();
  }));
  dialog.querySelector('[data-roi-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{window.dispatchEvent(new CustomEvent('ziewise:dialog',{detail:false}));opener?.focus();});
  form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',refresh);
  dialog.querySelector('[data-roi-reset]').addEventListener('click',()=>{fields.forEach(([id])=>{form.elements[id].value=ROI_DEFAULTS[id];});refresh();});
  window.addEventListener('ziewise:language',language);language();
}
