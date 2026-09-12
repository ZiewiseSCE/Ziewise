import { mountScene } from './scene3d.js?v=20260912-orbit2';
import { mountLogo } from './logo3d.js?v=20260912-connected1';
import { mountPhotographic } from './photographic.js?v=20260912-photo1';
import { mountPhotoreal } from './photoreal3d.js?v=20260912-capabilities1';

const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches;
let motionChosen=false;
let dialogOpen=false;
const mounted=[];
const cameraSurfaces=[];
const logoObserver=new IntersectionObserver(entries=>{
 for(const entry of entries){if(!entry.isIntersecting)continue;
   const logo=mountLogo(entry.target,{imageUrl:'logo-symbol.png'});logo.setPaused(paused||dialogOpen,{manual:motionChosen});mounted.push(logo);logoObserver.unobserve(entry.target);
 }
},{rootMargin:'120px'});
document.querySelectorAll('.logo-symbol,.footer-logo-symbol').forEach(img=>{
 const host=document.createElement('span');host.className='logo-3d-host';img.before(host);host.append(img);logoObserver.observe(host);
});
logoObserver.observe(document.querySelector('#about-webgl'));
function mount(el,kind){return mountScene(el,{kind,onReady:()=>el.querySelector('.scene-loading')?.remove()});}
const photographicAlt=()=>document.documentElement.lang==='en'?'Photographic concept of enterprise AI computing infrastructure':'기업 AI 컴퓨팅 인프라를 표현한 실사 스타일 콘셉트 이미지';
const photographs=[];
function mountPhoto(el){
 el.setAttribute('role','group');el.setAttribute('aria-label',photographicAlt());
 const photo=mountPhotographic(el,{
   src:'assets/infrastructure-photo-1536-v1.webp',
   srcset:'assets/infrastructure-photo-768-v1.webp 768w, assets/infrastructure-photo-1536-v1.webp 1536w',
   sizes:'(min-width:1450px) 680px, (min-width:761px) 50vw, calc(100vw - 40px)',
   alt:photographicAlt(),onReady:()=>el.querySelector('.scene-loading')?.remove()
 });
 const updateAlt=photo.setAlt;
 photo.setAlt=value=>{updateAlt(value);el.setAttribute('aria-label',value);};
 photographs.push(photo);return photo;
}
const heroEl=document.querySelector('#hero-webgl');
let heroPhoto=null;
const heroVisual=document.querySelector('.hero-visual');
const viewButton=document.querySelector('#hero-view-toggle');
let heroDiagram=null;
let diagramReady=false;
let diagramFailed=false;
let diagramRequest=0;
let heroDisposed=false;
const infrastructureLabel=()=>document.documentElement.lang==='en'?'Interactive 3D server infrastructure. Drag or use arrow keys to rotate. Press Home to reset.':'인터랙티브 3D 서버 인프라. 드래그 또는 방향키로 회전하고 Home 키로 처음 시점으로 돌아갑니다.';
function refreshHeroView(){
 heroVisual.dataset.view=diagramFailed?'photographic':'diagram';
 heroVisual.dataset.sceneReady=String(diagramReady);
 heroEl.setAttribute('aria-busy',String(!diagramFailed&&!diagramReady));
 viewButton.disabled=!diagramReady&&!diagramFailed;
 const english=document.documentElement.lang==='en';
 viewButton.textContent=diagramFailed?(english?'Retry 3D':'3D 다시 시도'):(english?'Reset view':'시점 초기화');
 heroEl.setAttribute('aria-label',diagramFailed?photographicAlt():infrastructureLabel());
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
  heroDiagram=mountPhotoreal(heroEl,{
   capabilities:true,
   onReady:()=>{
    if(heroDisposed||request!==diagramRequest)return;diagramReady=true;heroEl.querySelector('.scene-loading')?.remove();refreshHeroView();
   },
   onContextLost:()=>{if(heroDisposed||request!==diagramRequest)return;diagramReady=false;heroPhoto??=mountPhoto(heroEl);heroPhoto.setPaused(true);refreshHeroView();},
   onError:()=>{queueMicrotask(()=>{
    if(heroDisposed||request!==diagramRequest)return;
    const hadFocus=heroEl.contains(document.activeElement);
    heroDiagram?.dispose();heroDiagram=null;diagramReady=false;diagramFailed=true;
    heroPhoto??=mountPhoto(heroEl);
    refreshHeroView();hero.setPaused(paused||dialogOpen,{manual:motionChosen});
    if(hadFocus)viewButton.focus({preventScroll:true});
   });}
  });
 refreshHeroView();hero.setPaused(paused||dialogOpen,{manual:motionChosen});
}
viewButton.addEventListener('click',()=>{
 if(diagramFailed)startHero();else heroDiagram?.resetView();
});
mounted.push(hero);startHero();
let solution=null;
let technology=null;
let selected='vision';
const solutionEl=document.querySelector('#solution-webgl');
function mountTechnology(el){
 let photo=null,scene=null,disposed=false,failed=false;
 const ready=value=>{el.dataset.sceneReady=String(value);el.setAttribute('aria-busy',String(!value&&!failed));};
 const showPhoto=()=>{photo??=mountPhoto(el);photo.setPaused(true);};
 ready(false);
 scene=mountPhotoreal(el,{
  label:infrastructureLabel(),
  onReady:()=>{if(disposed)return;ready(true);el.setAttribute('aria-label',infrastructureLabel());el.querySelector('.scene-loading')?.remove();},
  onContextLost:()=>{if(disposed)return;ready(false);showPhoto();},
  onError:()=>queueMicrotask(()=>{if(disposed)return;failed=true;scene?.dispose();scene=null;ready(false);showPhoto();})
 });
 return {
  setPaused(value,options){scene?.setPaused(value,options);photo?.setPaused(true);},
  setLabel(value){scene?.setLabel(value);if(!failed)el.setAttribute('aria-label',value);},
  dispose(){disposed=true;scene?.dispose();photo?.dispose();}
 };
}
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
window.addEventListener('ziewise:language',()=>{updateMotion();photographs.forEach(photo=>photo.setAlt(photographicAlt()));technology?.setLabel(infrastructureLabel());refreshHeroView();});
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
window.addEventListener('pagehide',event=>{if(!event.persisted)mounted.forEach(s=>s.dispose());});
