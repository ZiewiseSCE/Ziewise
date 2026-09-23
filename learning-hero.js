import {mountLearningCinema} from './deep-learning-cinema.js?v=20260924-petrol1';
import {STORY_CHAPTERS,STORY_DURATION,storyFrame} from './deep-learning-story.js?v=20260923-dl1';
import {mountHeroROI} from './hero-roi.js?v=20260923-dl1';

export function mountLearningHero({getMotion}){
  const section=document.querySelector('#home'),host=document.querySelector('#brand-webgl');
  const timeline=document.querySelector('#learning-timeline'),clock=document.querySelector('#learning-time');
  let scene=null,stage=0,time=0,ready=false,disposed=false,failed=false,timer=0,entered=performance.now(),externalPaused=getMotion().paused;
  const en=()=>document.documentElement.lang==='en';
  const active=()=>window.ZiewisePages?window.ZiewisePages.getCurrent()?.page==='home':['','#home','#main'].includes(location.hash);
  function label(){return en()?'A 72-second 3D story: inspection, feature extraction, training, validation, edge deployment, feedback and customer value. Use the chapter buttons or timeline to explore.':'현장 검사부터 특징 추출, 학습, 검증, 엣지 배포, 피드백과 고객 가치까지 이어지는 72초 3D 이야기. 장면 버튼과 재생 구간으로 탐색할 수 있습니다.';}
  function refreshStage(index=stage){
    const changed=index!==stage;
    stage=index;const i=en()?1:0,c=STORY_CHAPTERS[stage];
    if(changed&&!externalPaused&&!matchMedia('(prefers-reduced-motion: reduce)').matches)host.animate([{opacity:.6,filter:'blur(2px)'},{opacity:1,filter:'blur(0px)'}],{duration:650,easing:'ease-out'});
    section.dataset.journeyStage=stage;
    document.querySelector('#learning-chapter').textContent=c.tag;
    document.querySelector('#learning-title').textContent=c.title[i];
    document.querySelector('#brand-journey-copy').textContent=c.copy[i];
    document.querySelector('#learning-detail').textContent=c.detail[i];
    document.querySelectorAll('button[data-journey-stage]').forEach(button=>{const j=Number(button.dataset.journeyStage);button.setAttribute('aria-pressed',String(j===stage));button.querySelector('b').textContent=STORY_CHAPTERS[j].name[i];});
    document.querySelector('.learning-roi-summary').hidden=stage!==6;
    document.querySelector('.learning-shot-state').hidden=stage===6;
    scene?.setLabel(label());
  }
  const format=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(Math.floor(n%60)).padStart(2,'0')}`;
  function progress(seconds,f=storyFrame(seconds)){
    time=seconds;timeline.value=seconds;clock.textContent=`${format(seconds)} / 01:12`;
    timeline.setAttribute('aria-valuetext',`${format(seconds)} · ${STORY_CHAPTERS[f.chapter].name[en()?1:0]}`);
    section.style.setProperty('--story-progress',`${seconds/STORY_DURATION*100}%`);
    if(stage!==f.chapter)refreshStage(f.chapter);
    let text=STORY_CHAPTERS[f.chapter].detail[en()?1:0];
    if(f.chapter===2){const backwards=(f.progress*3)%1>.55;text=backwards?(en()?'ERROR BACKPROPAGATION · ADJUST WEIGHTS':'오차 역전파 · 가중치 조정'):(en()?'FORWARD PASS · COMPARE WITH LABELS':'순방향 계산 · 정답과 비교');}
    if(f.chapter===3)text=f.progress>.55?(en()?'VALIDATION PASSED · READY FOR RELEASE':'검증 통과 · 다음 배포 단계로'):(en()?'CANDIDATE REVIEW · HELD-OUT DATA':'후보 모델 비교 · 분리된 검증 데이터');
    document.querySelector('#learning-detail').textContent=text;
  }
  function sync(options={}){scene?.setPaused(externalPaused||!active()||section.dataset.sceneState!=='ready',options);}
  function reveal(){clearTimeout(timer);if(!ready||!active())return;timer=setTimeout(()=>{if(ready&&active()){section.dataset.sceneState='ready';sync({manual:getMotion().manual});}},Math.max(0,2000-(performance.now()-entered)));}
  function failure(){ready=false;failed=true;clearTimeout(timer);scene?.dispose();scene=null;section.dataset.sceneState='fallback';document.querySelector('#learning-fallback').hidden=false;}
  function load(){if(scene||disposed)return;failed=false;document.querySelector('#learning-fallback').hidden=true;scene=mountLearningCinema(host,{onStage:refreshStage,onProgress:progress,label:label(),onReady:()=>{ready=true;reveal();},onContextLost:()=>{ready=false;section.dataset.sceneState='preview';},onError:()=>queueMicrotask(failure)});sync({manual:getMotion().manual});}
  function enter(){clearTimeout(timer);if(active()){entered=performance.now();section.dataset.sceneState=failed?'fallback':'preview';scene?.setStage(0);refreshStage(0);progress(0);reveal();}sync({manual:getMotion().manual});}
  function seek(seconds){if(scene)scene.setTime(seconds);else{progress(seconds);refreshStage(storyFrame(seconds).chapter);}}
  document.querySelectorAll('button[data-journey-stage]').forEach(button=>button.addEventListener('click',()=>seek(STORY_CHAPTERS[Number(button.dataset.journeyStage)].start)));
  timeline.addEventListener('input',()=>seek(Number(timeline.value)));
  document.querySelector('#learning-replay').addEventListener('click',()=>seek(0));
  document.querySelector('#learning-retry').addEventListener('click',()=>{entered=performance.now()-2000;load();});
  function language(){
    const copy={story:['현장에서 시작해, 고객의 가치로.','From the field to customer value.'],duration:['72초 · 딥러닝의 여정','72 SEC · THE LEARNING JOURNEY'],replay:['처음부터','Replay'],roi:['우리 회사의 절감 효과 계산','Estimate your savings'],example:['생산 품질 검사를 바탕으로 한 개념 시연','Conceptual illustration · production quality inspection'],time:['검사시간 절감','Inspection time saved'],net:['연간 순기대효과','Net annual benefit'],payback:['단순 회수기간','Simple payback'],fallback:['3D를 표시할 수 없습니다. 아래 장면을 선택해 과정을 살펴보세요.','3D is unavailable. Explore the story using the chapters below.'],retry:['3D 다시 시도','Retry 3D']};
    document.querySelectorAll('[data-learning-text]').forEach(el=>{const value=copy[el.dataset.learningText];if(value)el.textContent=value[en()?1:0];});
    timeline.setAttribute('aria-label',en()?'Story playback position':'스토리 재생 위치');refreshStage();progress(time);
  }
  const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){load();observer.disconnect();}});observer.observe(host);
  const layoutObserver=new ResizeObserver(()=>{
    if(innerWidth<=1100)return;
    const bottom=section.getBoundingClientRect().bottom,controls=document.querySelector('.learning-player').getBoundingClientRect().top;
    section.style.setProperty('--story-controls-height',`${Math.max(160,bottom-controls+24)}px`);
  });
  layoutObserver.observe(section);layoutObserver.observe(document.querySelector('.learning-player'));
  window.addEventListener('ziewise:pagechange',enter);mountHeroROI();language();enter();
  return {setPaused(value,options){externalPaused=value;sync(options);},setLanguage:language,dispose(){disposed=true;clearTimeout(timer);observer.disconnect();layoutObserver.disconnect();window.removeEventListener('ziewise:pagechange',enter);scene?.dispose();}};
}
