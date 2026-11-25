import {bindProvider,connectionFrame} from './provider.mjs';
const labels={
  knowledge:['문서와 권한','검색·근거 답변','모델 연결'],safety:['이동형 설치','자석 고정','AI 관제'],energy:['현장 계측','수요 예측','운영 일정'],
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
  unit:['zieview-tripod-product','Zieview · 이동형 단말 상세','흰색 PTZ 카메라와 녹색 통신 함체가 한 단말입니다. 폴대·삼각대를 옮겨 세우거나 철제 기둥에 자석으로 부착해 같은 단말을 운용합니다.','녹색 Zieview 함체와 흰색 돔 카메라, 노란 삼각대가 보이는 단말 3D 형상'],
  tripod:['zieview-tripod-field','Zieview · 정기 보수 구역','임시 작업이나 야간 보수가 시작되면 노란 삼각대를 그 구역에 옮깁니다. 배터리와 LTE로 새 배선 공사 없이 관제 위치를 바꿀 수 있습니다.','생산라인 옆에 이동형 Zieview 단말을 삼각대로 세운 설치 형상'],
  magnet:['zieview-field-hero','Zieview · 철제 기둥 부착','상시 확인할 구역은 철제 기둥에 자석으로 단말을 고정합니다. 서로 다른 공정의 영상을 관제실에서 함께 보며 필요할 때 단말을 회수해 재배치합니다.','녹색 자석 부착형 Zieview 단말과 기둥에 고정된 카메라'],
  control:['zieview-monitoring','Zieview · AI 통합 관제','관제 화면에서 보호구 미착용이나 제한 구역 진입 후보를 확인합니다. 담당자는 앞뒤 영상을 보고 양방향 음성으로 현장에 연락합니다.','관제 단말 화면과 작업 구역 영상']
};
const product=document.querySelector('.product-instrument'),portrait=product.querySelector('.product-portrait');
let productMode='unit',orbit=null;
const initialSection=location.hash&&document.getElementById(location.hash.slice(1));
function watch(observer,node){
  if(!initialSection||initialSection.contains(node)){observer.observe(node);return;}
  const afterJump=()=>setTimeout(()=>observer.observe(node),350);
  if(document.readyState==='complete')afterJump();
  else window.addEventListener('load',afterJump,{once:true});
}
const productObserver=new IntersectionObserver(([e],o)=>{if(e.isIntersecting){o.disconnect();import('./product-view.mjs?v=motion1').then(m=>{orbit=m.mountProduct(portrait);orbit(productMode);}).catch(()=>{});}},{rootMargin:'180px'});
watch(productObserver,portrait);
function setUnit(key){
  const [file,caption,text,alt]=unit[key],image=document.getElementById('unit-photo');
  image.src='./field-tour/zieview/'+file+'.webp?v=solid1';image.alt=alt;productMode=key;orbit?.(key);image.parentElement.dataset.productFrame=key;
  document.getElementById('unit-caption').textContent=caption;document.getElementById('unit-explain').textContent=text;
  product.querySelectorAll('[data-unit]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.unit===key)));

}
product.querySelector('.product-modes').addEventListener('click',e=>{const b=e.target.closest('[data-unit]');if(b)setUnit(b.dataset.unit);});
const contactCopy={'현장 안전·관제':'촬영할 작업 구역과 이동형·고정형 설치 위치를 알려주세요.','사무 자동화':'자동화할 업무와 월 처리량, 사용 중인 ERP나 그룹웨어를 알려주세요.','인프라·출력 보안':'연결할 서버·장비 수와 운영 중인 주소 관리 또는 출력 인증 방식을 알려주세요.'};
function setContact(key){document.getElementById('contact-help').textContent=contactCopy[key];
  document.querySelectorAll('[data-contact]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.contact===key)));
  document.querySelector('.contact-links a').href='mailto:info@ziewise.com?subject='+encodeURIComponent('[도입 문의] '+key);}
document.querySelector('.contact-options').addEventListener('click',e=>{const b=e.target.closest('[data-contact]');if(b)setContact(b.dataset.contact);});
setContact('현장 안전·관제');

const frames=new Map(),layers={},modules={},qualitySteps=new WeakMap();
const cuts=[.333,.667],minVisible=.015;
let current=null,intent=null,serial=0,request=0,posterTimer=0,last=0;
let windowStart=0,samples=0,late=0,fastDisplay=false;
function canvasFor(type){
  if(!layers[type]){
    const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');layers[type]=canvas;
    canvas.addEventListener('webglcontextlost',e=>{
      e.preventDefault();
      if(layers[type]!==canvas)return;
      delete layers[type];delete modules[type];
      if(current?.type===type){++serial;showPoster(current);}
    });
  }
  return layers[type];
}
function updateUI(f){
  const part=Math.min(2,Math.floor(f.p*3));
  f.el.querySelectorAll('[data-phase]').forEach((b,i)=>{b.textContent=labels[f.id][i];b.setAttribute('aria-pressed',String(i===part));});
  const play=f.el.querySelector('.visit-play');play.textContent=f.playing?'Ⅱ':'▶';play.setAttribute('aria-label',f.playing?'장면 일시정지':'장면 재생');play.setAttribute('aria-pressed',String(f.playing));
  f.el.dataset.phase=part;
  let poster;
  if(physical.has(f.id))poster=new URL('./chapters/views/'+f.id+'-'+part+'.webp',import.meta.url);
  else poster=new URL('./chapters/views/'+f.id+'-'+(f.connection?f.connection.to:part)+'.webp?v=solid1',import.meta.url);
  if(f.poster.src!==poster.href)f.poster.src=poster.href;
}
function resetClock(){
  if(request)cancelAnimationFrame(request);
  if(posterTimer)clearTimeout(posterTimer);
  request=posterTimer=last=windowStart=samples=late=0;
}
function showPoster(f){
  resetClock();f.world=null;f.state='poster';f.el.classList.remove('live');wake();
}
function wake(){
  const f=current;
  if(!f||f.ratio<=minVisible||document.hidden)return;
  if(f.state==='ready'){
    if(!request)request=requestAnimationFrame(tick);
  }else if(f.state==='poster'&&f.playing&&!posterTimer){
    const next=Math.floor(f.p*3)+1;
    posterTimer=setTimeout(()=>{
      posterTimer=0;
      if(f!==current||!f.playing||document.hidden||f.ratio<=minVisible)return;
      f.p=(next%3)/3;updateUI(f);wake();
    },Math.max(1,(next/3-f.p)*16000));
  }
}
function checkFrameBudget(world,now,interval,drawMs){
  const steps=qualitySteps.get(world)||0;
  if(steps>=3||!world.lighten||!interval)return;
  if(!windowStart)windowStart=now;
  if(interval<22)fastDisplay=true;
  samples++;
  if(interval>38||drawMs>19||(fastDisplay&&interval>26))late++;
  if(now-windowStart<1800)return;
  if(samples>=4&&late>samples*.55){world.lighten();qualitySteps.set(world,steps+1);}
  windowStart=now;samples=late=0;
}
function tick(now){
  request=0;const f=current;
  if(!f?.world||f.ratio<=minVisible||document.hidden){last=0;return;}
  const interval=last?now-last:0,dt=Math.min(.075,interval/1000);last=now;
  if(f.playing){const part=Math.floor(f.p*3);f.p=(f.p+dt/16)%1;if(Math.floor(f.p*3)!==part)updateUI(f);}
  if(f.pointerDirty){
    const bounds=f.el.getBoundingClientRect();f.pointerDirty=false;
    f.target[0]=((f.pointerX-bounds.left)/Math.max(1,bounds.width)-.5)*.45;
    f.target[1]=(.5-(f.pointerY-bounds.top)/Math.max(1,bounds.height))*.24;
  }
  const damping=1-Math.exp(-14*(dt||1/60));
  let leaning=false;
  for(let i=0;i<2;i++){
    const delta=f.target[i]-f.lean[i];
    if(Math.abs(delta)<.0004)f.lean[i]=f.target[i];
    else{f.lean[i]+=delta*damping;leaning=true;}
  }
  const start=performance.now(),phase=Math.min(2,Math.floor(f.p*3));
  if(f.type==='physical')f.world.draw(f.id,f.asset,f.p,f.lean,f.size);
  else f.world.draw({id:f.id,p:f.p,phase,cuts,entryOnly:true,close:true,peek:f.lean,connection:connectionFrame(f.connection,now,reduced.matches)});
  if(f.playing)checkFrameBudget(f.world,now,interval,performance.now()-start);
  if(f.playing||leaning||(f.connection&&!reduced.matches&&now-f.connection.start<2300))wake();
  else{last=windowStart=samples=late=0;}
}
async function activate(f){
  const token=++serial;resetClock();
  if(current&&current!==f){current.el.classList.remove('live');current.world=null;}
  current=f;if(!f)return;
  f.world=null;f.state='loading';f.el.classList.remove('live');
  const type=f.type=physical.has(f.id)?'physical':'facility',canvas=canvasFor(type);
  if(!modules[type])modules[type]=(type==='physical'?import('./chapter-world.mjs?v=motion1').then(m=>m.createChapterWorld(canvas)):
    import('./world.mjs?v=motion1').then(m=>m.createWorld(canvas))).catch(()=>null);
  const world=await modules[type];if(token!==serial)return;
  if(!world){showPoster(f);return;}
  try{
    const asset=await (type==='physical'?world.prepare(f.id):world.readyFor(f.id));
    if(token!==serial)return;
    if(f.id==='knowledge')world.setProvider(f.provider||'local');
    for(const other of f.screen.querySelectorAll('canvas'))if(other!==canvas)other.remove();
    f.screen.append(canvas);f.asset=asset;f.world=world;f.state='ready';f.el.classList.add('live');wake();
  }catch{if(token===serial)showPoster(f);}
}
function choose(){
  if(document.hidden)return;
  let best=null;
  if(intent&&intent.ratio>minVisible)best=intent;
  else{
    for(const f of frames.values())if(f.ratio>minVisible&&(!best||f.ratio>best.ratio))best=f;
    if(current&&current.ratio>minVisible&&best&&best.ratio-current.ratio<.08)best=current;
  }
  if(best!==current)activate(best);
}
function switchScene(kind,id){
  const f=frames.get(kind);if(!f||!labels[id])return;
  f.id=id;f.el.dataset.scene=id;f.p=0;f.target.fill(0);f.lean.fill(0);f.pointerDirty=false;updateUI(f);
  intent=f;
  if(current===f&&f.ratio>minVisible&&!document.hidden)activate(f);
  else if(current===f)activate(null);
  else choose();
}
const observer=new IntersectionObserver(entries=>{for(const e of entries){const f=frames.get(e.target.dataset.visit);f.ratio=e.intersectionRatio;}choose();},
 {threshold:[0,.02,.15,.35,.6,.85,1]});
const sizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{
  for(const entry of entries){
    const f=frames.get(entry.target.parentElement.dataset.visit);
    f.size={width:Math.round(entry.contentRect.width),height:Math.round(entry.contentRect.height)};
    if(f===current)wake();
  }
}):null;
for(const el of document.querySelectorAll('[data-visit]')){
  const screen=el.querySelector('.visit-screen'),poster=document.createElement('img');poster.alt='';poster.loading='lazy';screen.replaceChildren(poster);
  const f={el,screen,poster,id:el.dataset.scene,p:0,playing:!reduced.matches,lean:[0,0],target:[0,0],world:null,ratio:0};
  frames.set(el.dataset.visit,f);updateUI(f);watch(observer,el);sizeObserver?.observe(screen);
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    f.connection=null;
    if(b.hasAttribute('data-phase')){f.p=(Number(b.dataset.phase)+.18)/3;f.playing=false;}else if(b.classList.contains('visit-play'))f.playing=!f.playing;
    updateUI(f);intent=f;if(current!==f)choose();else{resetClock();wake();}
  });
  el.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced.matches)return;
    f.pointerX=e.clientX;f.pointerY=e.clientY;f.pointerDirty=true;if(current===f)wake();});
  el.addEventListener('pointerleave',()=>{f.pointerDirty=false;f.target.fill(0);if(current===f)wake();});
}
document.addEventListener('ziewise:visit',e=>switchScene(e.detail.kind,e.detail.id));
document.querySelector('.company-choices').addEventListener('click',e=>{
  const button=e.target.closest('[data-company]');if(!button)return;const id=button.dataset.company;
  document.querySelectorAll('[data-company]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  document.getElementById('company-view-name').textContent=companyTitle[id];switchScene('company',id);
});
document.addEventListener('visibilitychange',()=>{resetClock();if(!document.hidden){choose();wake();}});
window.addEventListener('resize',wake);reduced.addEventListener('change',()=>{
  resetClock();
  if(reduced.matches)for(const f of frames.values()){f.playing=false;f.lean.fill(0);f.target.fill(0);f.pointerDirty=false;updateUI(f);}
  wake();
});

bindProvider(document.querySelector('#llm [data-provider-controls]'),value=>{const f=frames.get('llm');f.connection={from:f.connection?.to,to:value,start:performance.now()};f.provider=value;f.p=.767;f.playing=false;f.world?.setProvider(value);updateUI(f);intent=f;if(current!==f)choose();else{resetClock();wake();}});
