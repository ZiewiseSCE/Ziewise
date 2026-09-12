import { mountScene } from './scene3d.js';

const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches;
const mounted=[];
function mount(el,kind){return mountScene(el,{kind,onReady:()=>el.querySelector('.scene-loading')?.remove()});}
const hero=mount(document.querySelector('#hero-webgl'),'core');mounted.push(hero);
let solution=null;
let selected='vision';
const solutionEl=document.querySelector('#solution-webgl');
const lazy=new IntersectionObserver(entries=>{
 for(const e of entries){if(!e.isIntersecting)continue;
  if(e.target===solutionEl){solution=mount(solutionEl,selected);solution.setPaused(paused);mounted.push(solution);}
  else{const scene=mount(e.target,'core');scene.setPaused(paused);mounted.push(scene);}
  lazy.unobserve(e.target);
 }
},{rootMargin:'350px'});
lazy.observe(solutionEl);lazy.observe(document.querySelector('#technology-webgl'));
function updateMotion(){
 mounted.forEach(s=>s.setPaused(paused));
 document.querySelectorAll('.motion-toggle').forEach(button=>{
   button.setAttribute('aria-pressed',String(paused));
   const label=button.querySelector('[data-i18n]');
   if(label){label.dataset.i18n=paused?'resume-motion':'pause-motion';label.textContent=window.ziewiseTranslate?.(label.dataset.i18n)||(paused?'모션 재생':'모션 일시정지');}
 });
}
document.addEventListener('click',e=>{if(e.target.closest('.motion-toggle')){paused=!paused;updateMotion();}});
reduced.addEventListener('change',e=>{paused=e.matches;updateMotion();});
window.addEventListener('ziewise:language',updateMotion);
updateMotion();
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
