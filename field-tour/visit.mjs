const labels={
  safety:['이동형 설치','자석 고정','AI 관제'],energy:['현장 계측','수요 예측','운영 일정'],
  commerce:['탐색 이력','추천 후보','적용 판단'],finance:['증빙 서류','규정 대조','전표 승인'],
  print:['도면 대기','사용자 인증','출력·수령'],observer:['설비 상태','지표 비교','DDI 주소 대조'],
  hr:['입사 서류','준비 목록','계정 요청'],purchase:['공급사 견적','조건 비교','발주 승인'],
  sales:['상담 기록','견적 초안','CRM 등록'],infrastructure:['서버 랙','네트워크','운영 기록'],
  research:['샘플 준비','시험 장비','검증 결과'],credentials:['정보보호 인증','벤처기업 확인','연구개발 인정']
};
const physical=new Set(['energy','commerce','print','observer','research','infrastructure','credentials']);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const companyTitle={infrastructure:'서버와 네트워크 운영',research:'샘플 시험과 연구개발',credentials:'인증서 원본 열람'};
const unit={
  unit:['zieview-tripod-product','Zieview 제품 지명원 · 이동형 단말','흰색 PTZ 카메라와 녹색 통신 함체가 한 단말입니다. 폴대·삼각대를 옮겨 세우거나 철제 기둥에 자석으로 부착해 같은 단말을 운용합니다.','녹색 Zieview 함체와 흰색 돔 카메라, 노란 삼각대가 보이는 지명원 원본 제품'],
  tripod:['zieview-tripod-field','지명원 수록 적용 예시 · 정기 보수 구역','임시 작업이나 야간 보수가 시작되면 노란 삼각대를 그 구역에 옮깁니다. 배터리와 LTE로 새 배선 공사 없이 관제 위치를 바꿀 수 있습니다.','생산라인 옆에 이동형 Zieview 단말을 삼각대로 세운 지명원 수록 적용 예시'],
  magnet:['zieview-field-hero','지명원 수록 적용 예시 · 철제 기둥 부착','상시 확인할 구역은 철제 기둥에 자석으로 단말을 고정합니다. 서로 다른 공정의 영상을 관제실에서 함께 보며 필요할 때 단말을 회수해 재배치합니다.','녹색 자석 부착형 Zieview 단말과 기둥에 고정된 카메라'],
  control:['zieview-monitoring','지명원 수록 적용 예시 · AI 통합 관제','관제 화면에서 보호구 미착용이나 제한 구역 진입 후보를 확인합니다. 담당자는 앞뒤 영상을 보고 양방향 음성으로 현장에 연락합니다.','지명원에 실린 공정별 멀티뷰와 안전 이벤트 기록']
};
const product=document.querySelector('.product-instrument');
function setUnit(key){
  const [file,caption,text,alt]=unit[key],image=document.getElementById('unit-photo');
  image.src='./field-tour/zieview/'+file+'.webp';image.alt=alt;image.parentElement.dataset.productFrame=key;
  document.getElementById('unit-caption').textContent=caption;document.getElementById('unit-explain').textContent=text;
  product.querySelectorAll('[data-unit]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.unit===key)));
  const detail=document.getElementById('magnet-closeup');if(detail)detail.hidden=key!=='magnet';
}
product.querySelector('.product-modes').addEventListener('click',e=>{const b=e.target.closest('[data-unit]');if(b)setUnit(b.dataset.unit);});
const contactCopy={'현장 안전·관제':'촬영할 작업 구역과 이동형·고정형 설치 위치를 알려주세요.','사무 자동화':'자동화할 업무와 월 처리량, 사용 중인 ERP나 그룹웨어를 알려주세요.','인프라·출력 보안':'연결할 서버·장비 수와 운영 중인 주소 관리 또는 출력 인증 방식을 알려주세요.'};
function setContact(key){document.getElementById('contact-help').textContent=contactCopy[key];
  document.querySelectorAll('[data-contact]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.contact===key)));
  document.querySelector('.contact-links a').href='mailto:info@ziewise.com?subject='+encodeURIComponent('[도입 문의] '+key);}
document.querySelector('.contact-options').addEventListener('click',e=>{const b=e.target.closest('[data-contact]');if(b)setContact(b.dataset.contact);});
setContact('현장 안전·관제');

const frames=new Map(),layers={},modules={};
let current=null,intent=null,serial=0,request=0,last=0,lastPaint=0;
function canvasFor(type){
  if(!layers[type]){layers[type]=document.createElement('canvas');layers[type].setAttribute('aria-hidden','true');}
  return layers[type];
}
function updateUI(f){
  const part=Math.min(2,Math.floor(f.p*3));
  f.el.querySelectorAll('[data-phase]').forEach((b,i)=>{b.textContent=labels[f.id][i];b.setAttribute('aria-pressed',String(i===part));});
  const play=f.el.querySelector('.visit-play');play.textContent=f.playing?'Ⅱ':'▶';play.setAttribute('aria-label',f.playing?'장면 일시정지':'장면 재생');play.setAttribute('aria-pressed',String(f.playing));
  f.el.dataset.phase=part;
  let poster;
  if(physical.has(f.id))poster=new URL('./chapters/views/'+f.id+'-'+part+'.webp',import.meta.url);
  else if(f.id==='safety')poster=new URL('./photography/'+['safety','safety-mounted','safety-control'][part]+'.webp',import.meta.url);
  else if(['finance','hr'].includes(f.id))poster=new URL('./photography/'+f.id+'.webp',import.meta.url);
  else poster=new URL('../ai-briefing/assets/dept-'+f.id+'.webp',import.meta.url);
  if(f.poster.src!==poster.href)f.poster.src=poster.href;
}
function wake(){if(!request&&!document.hidden)request=requestAnimationFrame(tick);}
function tick(now){
  request=0;if(!current||document.hidden){last=0;return;}const f=current;
  const dt=last?Math.min(.14,(now-last)/1000):0;last=now;
  if(f.playing){const part=Math.floor(f.p*3);f.p=(f.p+dt/16)%1;if(Math.floor(f.p*3)!==part)updateUI(f);}
  if(f.world&&(now-lastPaint>32||!f.playing)){
    lastPaint=now;const phase=Math.min(2,Math.floor(f.p*3));
    if(f.type==='physical')f.world.draw(f.id,f.asset,f.p,f.lean);
    else f.world.draw({id:f.id,p:f.p,phase,entryOnly:true,close:true,peek:f.lean});
  }
  if(f.playing)wake();
}
async function activate(f){
  const token=++serial;if(current&&current!==f){current.el.classList.remove('live');current.world=null;}
  current=f;last=0;if(!f)return;f.world=null;f.el.classList.remove('live');wake();
  const type=f.type=physical.has(f.id)?'physical':'photo',canvas=canvasFor(type);
  if(!modules[type])modules[type]=(type==='physical'?import('./chapter-world.mjs?v=visit4').then(m=>m.createChapterWorld(canvas)):
    import('./photo-world.mjs?v=visit5').then(m=>m.createWorld(canvas))).catch(()=>null);
  const world=await modules[type];if(!world||token!==serial)return;
  try{
    const asset=await (type==='physical'?world.prepare(f.id):world.readyFor(f.id));
    if(token!==serial)return;
    for(const other of f.screen.querySelectorAll('canvas'))if(other!==canvas)other.remove();
    f.screen.append(canvas);f.asset=asset;f.world=world;f.el.classList.add('live');
    lastPaint=0;last=0;wake();
  }catch{if(token===serial)f.el.classList.remove('live');}
}
function choose(){const best=intent&&intent.ratio>.015?intent:[...frames.values()].filter(f=>f.ratio>.015).sort((a,b)=>b.ratio-a.ratio)[0]||null;
  if(best!==current)activate(best);}
function switchScene(kind,id){
  const f=frames.get(kind);if(!f||!labels[id])return;f.id=id;f.el.dataset.scene=id;f.p=0;f.lean=[0,0];updateUI(f);
  intent=f;activate(f);
}
const observer=new IntersectionObserver(entries=>{for(const e of entries){const f=frames.get(e.target.dataset.visit);f.ratio=e.intersectionRatio;}choose();},
 {threshold:[0,.02,.15,.35,.6,.85,1]});
for(const el of document.querySelectorAll('[data-visit]')){
  const screen=el.querySelector('.visit-screen'),poster=document.createElement('img');poster.alt='';poster.loading='lazy';screen.replaceChildren(poster);
  const f={el,screen,poster,id:el.dataset.scene,p:0,playing:!reduced.matches,lean:[0,0],world:null,ratio:0};
  frames.set(el.dataset.visit,f);updateUI(f);observer.observe(el);
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-phase')){f.p=(Number(b.dataset.phase)+.18)/3;f.playing=false;}else if(b.classList.contains('visit-play'))f.playing=!f.playing;
    updateUI(f);if(current!==f)activate(f);else wake();
  });
  el.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced.matches)return;const b=el.getBoundingClientRect();
    f.lean=[((e.clientX-b.left)/b.width-.5)*.45,(.5-(e.clientY-b.top)/b.height)*.24];if(!f.playing)wake();});
  el.addEventListener('pointerleave',()=>{f.lean=[0,0];if(!f.playing)wake();});
}
document.addEventListener('ziewise:visit',e=>switchScene(e.detail.kind,e.detail.id));
document.querySelector('.company-choices').addEventListener('click',e=>{
  const button=e.target.closest('[data-company]');if(!button)return;const id=button.dataset.company;
  document.querySelectorAll('[data-company]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  document.getElementById('company-view-name').textContent=companyTitle[id];switchScene('company',id);
});
document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden)wake();});
window.addEventListener('resize',wake);reduced.addEventListener('change',()=>{if(reduced.matches)for(const f of frames.values()){f.playing=false;updateUI(f);}wake();});
