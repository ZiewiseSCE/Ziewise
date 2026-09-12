import { mountScene } from './scene3d.js?v=20260912-studio1';
import { mountLogo } from './logo3d.js?v=20260912-bg1';

const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches;
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
const hero=mount(document.querySelector('#hero-webgl'),'core');mounted.push(hero);
cameraSurfaces.push({element:document.querySelector('#hero-webgl'),scene:hero});
let solution=null;
let selected='vision';
const solutionEl=document.querySelector('#solution-webgl');
const lazy=new IntersectionObserver(entries=>{
 for(const e of entries){if(!e.isIntersecting)continue;
  if(e.target===solutionEl){solution=mount(solutionEl,selected);solution.setPaused(paused);mounted.push(solution);cameraSurfaces.push({element:e.target,scene:solution});}
  else{const scene=mount(e.target,'core');scene.setPaused(paused);mounted.push(scene);cameraSurfaces.push({element:e.target,scene});}
  lazy.unobserve(e.target);
 }
},{rootMargin:'350px'});
lazy.observe(solutionEl);lazy.observe(document.querySelector('#technology-webgl'));
function updateMotion(){
 document.documentElement.classList.toggle('motion-paused',paused);
 mounted.forEach(s=>s.setPaused(paused||dialogOpen));
 document.querySelectorAll('.motion-toggle').forEach(button=>{
   button.setAttribute('aria-pressed',String(paused));
   const label=button.querySelector('[data-i18n]');
   if(label){label.dataset.i18n=paused?'resume-motion':'pause-motion';label.textContent=window.ziewiseTranslate?.(label.dataset.i18n)||(paused?'모션 재생':'모션 일시정지');}
 });
}
document.addEventListener('click',e=>{if(e.target.closest('.motion-toggle')){paused=!paused;updateMotion();}});
reduced.addEventListener('change',e=>{paused=e.matches;updateMotion();});
window.addEventListener('ziewise:language',updateMotion);
window.addEventListener('ziewise:dialog',event=>{dialogOpen=event.detail;mounted.forEach(scene=>scene.setPaused(paused||dialogOpen));});
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
window.addEventListener('pagehide',()=>mounted.forEach(s=>s.dispose()),{once:true});
