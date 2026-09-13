import { mountTechnologyStory as mountTechnology } from './technology-story.js?v=20260913-stage1';
import { mountScene } from './scene3d.js?v=20260913-stage1';
import { mountPhotoreal } from './photoreal3d.js?v=20260913-d2c1';
import { mountNeuralBrain } from './neural-brain3d.js?v=20260913-d2c1';
import { solutionMiniatures } from './solution-miniatures3d.js?v=20260913-d2c1';

const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches;
let motionChosen=false;
let dialogOpen=false;
const mounted=[];
const cameraSurfaces=[];
document.querySelectorAll('.logo-symbol,.footer-logo-symbol').forEach(img=>{
 const host=document.createElement('span');host.className='logo-3d-host logo-shine';img.before(host);host.append(img);
});
document.querySelector('#about-webgl')?.classList.add('logo-shine');
function mount(el,kind){return mountScene(el,{kind,onReady:()=>el.querySelector('.scene-loading')?.remove()});}
const heroEl=document.querySelector('#hero-webgl');
let heroPhoto=null;
const heroVisual=document.querySelector('.hero-visual');
const viewButton=document.querySelector('#hero-view-toggle');
let heroDiagram=null;
let diagramReady=false;
let diagramFailed=false;
let diagramRequest=0;
let heroDisposed=false;
const infrastructureLabel=()=>document.documentElement.lang==='en'?'ZiewCore neural brain connected to six specialist AIs. Drag or use arrow keys to rotate. Press Home to reset.':'6개 전문 AI를 연결하는 ZiewCore 신경망 뇌. 드래그 또는 방향키로 회전하고 Home 키로 처음 시점으로 돌아갑니다.';
const neuralPhaseCopy={
 ko:['현장의 영상·센서·업무 데이터를 모아, 중앙 신경망의 입력으로 연결합니다.','모호한 사례와 현장 피드백을 선별해 학습하고, 다음 모델을 검증합니다.','검증한 모델을 전문 AI에 전달하고, 서비스 중단을 줄이는 배포 흐름으로 연결합니다.','현장 가까이에서 판단하고, 결과를 다음 학습의 피드백으로 되돌립니다.'],
 en:['Connect video, sensor and business data from operations to the central neural core.','Select uncertain cases and operational feedback for learning, then validate the next model.','Distribute validated models to specialist AIs through a deployment flow designed for service continuity.','Run inference close to operations and return results as feedback for the next learning cycle.']
};
let neuralPhase=0;
function refreshNeuralPhase(phase=neuralPhase){
 neuralPhase=phase;
 document.querySelectorAll('[data-neural-phase]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.neuralPhase)===phase)));
 const copy=document.querySelector('#neural-phase-copy');if(copy)copy.textContent=neuralPhaseCopy[document.documentElement.lang==='en'?'en':'ko'][phase];
}
document.querySelectorAll('[data-neural-phase]').forEach(button=>button.addEventListener('click',()=>{heroDiagram?.setPhase(Number(button.dataset.neuralPhase));refreshNeuralPhase(Number(button.dataset.neuralPhase));}));
refreshNeuralPhase();
let neuralSolution=0;
function refreshNeuralSolution(index=neuralSolution){
 neuralSolution=index;const data=solutionMiniatures[index],en=document.documentElement.lang==='en';
 document.querySelector('#neural-solution-title').textContent=`${data.name} · ${data[en?'en':'ko']}`;
 document.querySelector('#neural-solution-copy').textContent=data.description[en?1:0];
 document.querySelector('#neural-solution-link').dataset.openScene=data.kind;
 document.querySelectorAll('.neural-fallback-solutions button').forEach((button,i)=>{button.textContent=`${solutionMiniatures[i].name} · ${solutionMiniatures[i][en?'en':'ko']}`;button.setAttribute('aria-pressed',String(i===index));});
}
refreshNeuralSolution();
function neuralPreview(){
 if(heroPhoto)return;
 const img=document.createElement('img');img.className='neural-preview';img.src='assets/neural-preview.svg';img.alt='ZiewCore neural network';heroEl.append(img);
 const choices=document.createElement('div');choices.className='neural-fallback-solutions';solutionMiniatures.forEach((data,i)=>{const button=document.createElement('button');button.type='button';button.addEventListener('click',()=>refreshNeuralSolution(i));choices.append(button);});heroEl.append(choices);refreshNeuralSolution();
 heroPhoto={setPaused(){},dispose(){img.remove();choices.remove();}};
}
function refreshHeroView(){
 heroVisual.dataset.view=diagramFailed?'photographic':'diagram';
 heroVisual.dataset.sceneReady=String(diagramReady);
 heroEl.setAttribute('aria-busy',String(!diagramFailed&&!diagramReady));
 viewButton.disabled=!diagramReady&&!diagramFailed;
 const english=document.documentElement.lang==='en';
 viewButton.textContent=diagramFailed?(english?'Retry 3D':'3D 다시 시도'):(english?'Reset view':'시점 초기화');
 heroEl.setAttribute('aria-label',infrastructureLabel());
 heroDiagram?.setLabel?.(infrastructureLabel());
 const hint=heroVisual.querySelector('.hero-view-hint');
 hint.textContent=diagramFailed?(english?'3D unavailable · Preview shown':'3D 연결 대기 · 미리보기 표시'):diagramReady?(paused?(english?'Drag to rotate · 360°':'드래그하여 회전 · 360°'):(english?'Auto rotate · Drag to explore':'자동 회전 · 드래그 가능')):(english?'Loading 3D…':'3D 준비 중…');
}
const hero={
 setPaused(value,options){heroPhoto?.setPaused(true);heroDiagram?.setPaused(value,options);},
 dispose(){heroDisposed=true;diagramRequest++;heroPhoto?.dispose();heroDiagram?.dispose();}
};
function startHero(){
 const request=++diagramRequest;
 heroDiagram?.dispose();
 diagramReady=false;diagramFailed=false;
 refreshHeroView();
  heroDiagram=mountNeuralBrain(heroEl,{
   onPhase:refreshNeuralPhase,
   onSolution:refreshNeuralSolution,
   onReady:()=>{
    if(heroDisposed||request!==diagramRequest)return;diagramReady=true;heroPhoto?.dispose();heroPhoto=null;heroEl.querySelector('.scene-loading')?.remove();refreshHeroView();
   },
   onContextLost:()=>{if(heroDisposed||request!==diagramRequest)return;diagramReady=false;neuralPreview();refreshHeroView();},
   onError:()=>{queueMicrotask(()=>{
    if(heroDisposed||request!==diagramRequest)return;
    const hadFocus=heroEl.contains(document.activeElement);
    heroDiagram?.dispose();heroDiagram=null;diagramReady=false;diagramFailed=true;
    neuralPreview();
    refreshHeroView();hero.setPaused(paused||dialogOpen,{manual:motionChosen});
    if(hadFocus)viewButton.focus({preventScroll:true});
   });}
  });
 refreshHeroView();hero.setPaused(paused||dialogOpen,{manual:motionChosen});
}
viewButton.addEventListener('click',()=>{
 if(diagramFailed)startHero();else heroDiagram?.resetView();
});
mounted.push(hero);
const heroLoader=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){startHero();heroLoader.disconnect();}});
heroLoader.observe(heroEl);

const brandElement=document.querySelector('#brand-webgl');
const brandSection=document.querySelector('#home');
let brandScene=null;
const brandIntroDuration=2000;
let brandReady=false,brandIntroTimer=0,brandEnteredAt=performance.now();
const brandActive=()=>window.ZiewisePages?window.ZiewisePages.getCurrent()?.page==='home':['','#home','#main'].includes(location.hash);
function scheduleBrandReveal(){
 clearTimeout(brandIntroTimer);
 if(!brandReady||!brandActive())return;
 brandIntroTimer=setTimeout(()=>{
  if(!brandReady||!brandActive())return;
  brandSection.dataset.sceneState='ready';
  brand.setPaused(paused||dialogOpen,{manual:motionChosen});
 },Math.max(0,brandIntroDuration-(performance.now()-brandEnteredAt)));
}
function startBrandEntrance(){
 clearTimeout(brandIntroTimer);
 if(brandActive()){
  brandEnteredAt=performance.now();brandSection.dataset.sceneState='preview';
  brandScene?.setStage(0);refreshJourney(0);scheduleBrandReveal();
 }
 brand.setPaused(paused||dialogOpen,{manual:motionChosen});
}
let journeyStage=0;
const journeyCopy={
 ko:['검사 카메라가 제품을 살피고 영상·센서 데이터를 만듭니다.','현장의 데이터를 ZiewCore로 전달해, 분석에 사용할 흐름으로 연결합니다.','AI가 영상의 특징과 이상 징후를 분석해 검토할 대상을 판단합니다.','판단을 관제 알림과 업무 흐름에 반영하고, 현장 피드백을 다음 학습으로 연결합니다.'],
 en:['An inspection camera observes products and captures video and sensor data.','Operational data travels to ZiewCore, connecting the field to the analysis pipeline.','AI analyses visual features and anomalies to identify items that need review.','Decisions inform monitoring and workflows. Operational feedback feeds the next learning cycle.']
};
function refreshJourney(stage=journeyStage){journeyStage=stage;brandSection.dataset.journeyStage=stage;document.querySelectorAll('[data-journey-stage]').forEach(button=>{if(button.matches('button'))button.setAttribute('aria-pressed',String(Number(button.dataset.journeyStage)===stage));});document.querySelector('#brand-journey-copy').textContent=journeyCopy[document.documentElement.lang==='en'?'en':'ko'][stage];}
document.querySelectorAll('button[data-journey-stage]').forEach(button=>button.addEventListener('click',()=>{const stage=Number(button.dataset.journeyStage);brandScene?.setStage?.(stage);refreshJourney(stage);}));refreshJourney();
const journeyLabel=()=>document.documentElement.lang==='en'?'A 3D journey from camera inspection through ZiewCore analysis to operational monitoring and feedback. Drag or use the arrow keys to explore.':'카메라 검사에서 ZiewCore 분석, 관제와 현장 피드백으로 이어지는 3D 과정. 드래그 또는 방향키로 시점을 조절합니다.';
const brand={setPaused(value,options){brandScene?.setPaused(value||!brandActive()||brandSection.dataset.sceneState!=='ready',options);},dispose(){clearTimeout(brandIntroTimer);window.removeEventListener('ziewise:pagechange',startBrandEntrance);brandLoader.disconnect();brandScene?.dispose();}};
const brandLoader=new IntersectionObserver(entries=>{
 if(!entries.some(entry=>entry.isIntersecting)||brandScene)return;
 brandScene=mountPhotoreal(brandElement,{
  cinematic:true,
  onStage:refreshJourney,
  label:journeyLabel(),
  onReady:()=>{brandReady=true;scheduleBrandReveal();},
  onContextLost:()=>{brandReady=false;clearTimeout(brandIntroTimer);brandSection.dataset.sceneState='preview';},
  onError:()=>{queueMicrotask(()=>{brandReady=false;clearTimeout(brandIntroTimer);brandScene?.dispose();brandScene=null;brandSection.dataset.sceneState='preview';});}
 });
 brand.setPaused(paused||dialogOpen,{manual:motionChosen});brandLoader.disconnect();
});
brandLoader.observe(brandElement);mounted.push(brand);
window.addEventListener('ziewise:pagechange',startBrandEntrance);
startBrandEntrance();
let solution=null;
let technology=null;
let selected='vision';
const solutionEl=document.querySelector('#solution-webgl');
const lazy=new IntersectionObserver(entries=>{
 for(const e of entries){if(!e.isIntersecting)continue;
  if(e.target===solutionEl){solution=mount(solutionEl,selected);solution.setPaused(paused||dialogOpen,{manual:motionChosen});mounted.push(solution);cameraSurfaces.push({element:e.target,scene:solution});}
  else{technology=mountTechnology(e.target);technology.setPaused(paused||dialogOpen,{manual:motionChosen});mounted.push(technology);}
  lazy.unobserve(e.target);
 }
},{rootMargin:'350px'});
lazy.observe(solutionEl);lazy.observe(document.querySelector('#technology-webgl'));
function updateMotion(){
 document.documentElement.classList.toggle('motion-paused',paused);
 window.dispatchEvent(new CustomEvent('ziewise:motion',{detail:{paused,manual:motionChosen}}));
 mounted.forEach(s=>s.setPaused(paused||dialogOpen,{manual:motionChosen}));
 document.querySelectorAll('.motion-toggle').forEach(button=>{
   button.setAttribute('aria-pressed',String(paused));
   const label=button.querySelector('[data-i18n]');
   if(label){label.dataset.i18n=paused?'resume-motion':'pause-motion';label.textContent=window.ziewiseTranslate?.(label.dataset.i18n)||(paused?'모션 재생':'모션 일시정지');}
 });
 refreshHeroView();
}
document.addEventListener('click',e=>{if(e.target.closest('.motion-toggle')){paused=!paused;motionChosen=true;updateMotion();}});
reduced.addEventListener('change',e=>{paused=e.matches;motionChosen=false;updateMotion();});
window.addEventListener('ziewise:language',()=>{updateMotion();brandScene?.setLabel(journeyLabel());refreshJourney();refreshHeroView();refreshNeuralPhase();refreshNeuralSolution();});
window.addEventListener('ziewise:dialog',event=>{dialogOpen=event.detail;mounted.forEach(scene=>scene.setPaused(paused||dialogOpen,{manual:motionChosen}));});
updateMotion();
let cameraUpdatePending=false;
function updateCameras(){
 cameraUpdatePending=false;if(paused||reduced.matches)return;
 cameraSurfaces.forEach(({element,scene})=>{
   const rect=element.getBoundingClientRect();
   if(rect.bottom<0||rect.top>innerHeight)return;
   scene.setScrollProgress?.((innerHeight*.5-rect.top-rect.height*.5)/(innerHeight*.8));
 });
}
addEventListener('scroll',()=>{if(!cameraUpdatePending){cameraUpdatePending=true;requestAnimationFrame(updateCameras);}},{passive:true});
const tabs=[...document.querySelectorAll('.sim-tab')];
function selectScene(kind,focus=false){
 selected=kind;
 for(const tab of tabs){const active=tab.dataset.sim===kind;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus();}
 document.querySelectorAll('.sim-scene').forEach(panel=>{const active=panel.dataset.scene===kind;panel.hidden=!active;panel.classList.toggle('active',active);});
 solution?.setKind(kind);
 solutionEl.setAttribute('aria-label',`${kind} · Interactive 3D simulation`);
}
tabs.forEach((tab,i)=>{
 tab.addEventListener('click',()=>selectScene(tab.dataset.sim));
 tab.addEventListener('keydown',e=>{
  let next;
  if(e.key==='ArrowRight')next=(i+1)%tabs.length;
  if(e.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;
  if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;
  if(next!==undefined){e.preventDefault();selectScene(tabs[next].dataset.sim,true);}
 });
});
document.querySelectorAll('[data-open-scene]').forEach(link=>link.addEventListener('click',()=>selectScene(link.dataset.openScene)));
window.addEventListener('pagehide',event=>{if(!event.persisted){heroLoader.disconnect();mounted.forEach(s=>s.dispose());}});
