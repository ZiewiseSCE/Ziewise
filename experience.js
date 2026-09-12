import { mountScene } from './scene3d.js?v=20260912-studio1';
import { mountLogo } from './logo3d.js?v=20260912-bg1';
import { mountPhotographic } from './photographic.js?v=20260912-photo1';

const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches;
let motionChosen=false;
let dialogOpen=false;
const mounted=[];
const cameraSurfaces=[];
const logoObserver=new IntersectionObserver(entries=>{
 for(const entry of entries){if(!entry.isIntersecting)continue;
   const logo=mountLogo(entry.target,{imageUrl:'logo-symbol.png'});logo.setPaused(paused||dialogOpen);mounted.push(logo);logoObserver.unobserve(entry.target);
 }
},{rootMargin:'120px'});
document.querySelectorAll('.logo-symbol,.footer-logo-symbol').forEach(img=>{
 const host=document.createElement('span');host.className='logo-3d-host';img.before(host);host.append(img);logoObserver.observe(host);
});
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
const heroPhoto=mountPhoto(heroEl);
const heroVisual=document.querySelector('.hero-visual');
const viewButton=document.querySelector('#hero-view-toggle');
let heroDiagram=null;
let diagramVisible=false;
function refreshHeroView(){
 heroVisual.dataset.view=diagramVisible?'diagram':'photographic';
 viewButton.setAttribute('aria-pressed',String(diagramVisible));
 const english=document.documentElement.lang==='en';
 viewButton.textContent=diagramVisible?(english?'Main visual':'메인 비주얼'):(english?'3D schematic':'3D 구조도');
 heroEl.setAttribute('aria-label',diagramVisible?(english?'Interactive schematic of computing infrastructure':'컴퓨팅 인프라의 인터랙티브 3D 구조도'):photographicAlt());
 const hint=heroVisual.querySelector('.hero-view-hint');
 hint.textContent=diagramVisible?(english?'Drag to rotate in 3D':'드래그하여 3D 회전'):(english?'AI INFRASTRUCTURE · CONCEPT':'AI 인프라 · 콘셉트 비주얼');
}
const hero={
 setPaused(value,options){heroPhoto.setPaused(value||diagramVisible,options);heroDiagram?.setPaused(value);},
 setScrollProgress(value){if(diagramVisible)heroDiagram?.setScrollProgress(value);else heroPhoto.setScrollProgress(value);},
 dispose(){heroPhoto.dispose();heroDiagram?.dispose();}
};
viewButton.addEventListener('click',()=>{
 diagramVisible=!diagramVisible;
 if(diagramVisible){heroDiagram=mount(heroEl,'core');heroDiagram.setPaused(paused||dialogOpen);}
 else{heroDiagram?.dispose();heroDiagram=null;}
 refreshHeroView();hero.setPaused(paused||dialogOpen,{manual:motionChosen});
});
refreshHeroView();mounted.push(hero);cameraSurfaces.push({element:heroEl,scene:hero});
let solution=null;
let selected='vision';
const solutionEl=document.querySelector('#solution-webgl');
const lazy=new IntersectionObserver(entries=>{
 for(const e of entries){if(!e.isIntersecting)continue;
  if(e.target===solutionEl){solution=mount(solutionEl,selected);solution.setPaused(paused||dialogOpen);mounted.push(solution);cameraSurfaces.push({element:e.target,scene:solution});}
  else{const scene=mountPhoto(e.target);scene.setPaused(paused||dialogOpen,{manual:motionChosen});mounted.push(scene);cameraSurfaces.push({element:e.target,scene});}
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
}
document.addEventListener('click',e=>{if(e.target.closest('.motion-toggle')){paused=!paused;motionChosen=true;updateMotion();}});
reduced.addEventListener('change',e=>{paused=e.matches;motionChosen=false;updateMotion();});
window.addEventListener('ziewise:language',()=>{updateMotion();photographs.forEach(photo=>photo.setAlt(photographicAlt()));refreshHeroView();});
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
