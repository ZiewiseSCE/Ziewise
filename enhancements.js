const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const bar=document.querySelector('.reading-progress');
if(!CSS.supports('animation-timeline: scroll()')){
 let scheduled=false;
 const update=()=>{const length=document.documentElement.scrollHeight-innerHeight;bar.style.transform=`scaleX(${length>0?Math.min(1,Math.max(0,scrollY/length)):0})`;scheduled=false;};
 const request=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}};
 addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});update();
}
if('IntersectionObserver' in window && !reduceMotion.matches){
 const observer=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('enter-pending');observer.unobserve(entry.target);}});
 },{threshold:0,rootMargin:'0px 0px -24px 0px'});
 document.querySelectorAll('.section-title,.about-container,.value-card,.timeline-wrap,.solution-card,.industry-card,.uc-card,.process-strip,.tech-card,.perf-card,.experience-cta').forEach(el=>{
   if(el.getBoundingClientRect().top<innerHeight)return;
   el.classList.add('enter-surface','enter-pending');observer.observe(el);
 });
 reduceMotion.addEventListener('change',e=>{if(e.matches){observer.disconnect();document.querySelectorAll('.enter-pending').forEach(el=>el.classList.remove('enter-pending'));}});
}
