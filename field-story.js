(() => {
  'use strict';
  const scenes=window.ZiewiseScenes, cases=window.ZiewiseCases;
  const $=id=>document.getElementById(id);
  const all=(q,scope=document)=>Array.from(scope.querySelectorAll(q));
  const film=$('walkthrough'), art=$('film-art'), screen=$('film-screen'), dialog=$('story-dialog');
  const chapterButtons=all('.chapter');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const duration=12000, total=duration*scenes.length;
  let elapsed=0, current=0, previous=0, previousT=0, transitionStart=-2000, lastTime=0, lastPaint=0;
  let playing=!reduced.matches, visible=true, request=0, dirty=true, atlasIndex=0, opener=null, resumeAfterDetail=false;
  let camera, copyAnimation, drag=null, inView=true, readyToPlay=false;
  const look={x:0,y:0},target={x:0,y:0};
  const images=scenes.map((scene,index)=>{
    const img=index?new Image():$('first-frame');
    img.className='film-still'+(index===0?' visible':'');
    img.alt='';img.draggable=false;
    img.style.setProperty('--focus',(scene.align*100)+'%');
    if(index){img.decoding='async';img.src='./assets/'+scene.image+'.webp';art.insertBefore(img,$('field-camera'));}
    return img;
  });
  function setText(id,value){const node=$(id);if(node.textContent!==value)node.textContent=value;}
  function setUse(button,name){button.querySelector('use').setAttribute('href','#i-'+name);}
  function seconds(ms){return '00:'+String(Math.floor(ms/1000)).padStart(2,'0');}
  function progress(){return Math.min(1,Math.max(0,(elapsed-current*duration)/duration));}
  function wake(){dirty=true;if(!request && !document.hidden)request=requestAnimationFrame(frame);}
  function setPlaying(value){
    playing=value;lastTime=0;
    const ended=elapsed>=total;
    setUse($('play-toggle'),ended?'replay':playing?'pause':'play');
    const label=ended?'처음부터 다시 재생':playing?'자동 재생 일시정지':'워크스루 재생';
    $('play-toggle').setAttribute('aria-label',label);
    $('play-toggle').title=label;
    setText('play-label',ended?'다시 보기':playing?'자동 투어':'일시정지');
    wake();
  }
  function changeScene(index,oldProgress,now){
    previous=current;previousT=oldProgress;current=index;transitionStart=now;
    const scene=scenes[index];
    images.forEach((img,i)=>img.classList.toggle('visible',i===index));
    chapterButtons.forEach((button,i)=>{
      button.classList.toggle('active',i===index);
      if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
    });
    setText('title-a',scene.title[0]);setText('title-b',scene.title[1]);setText('scene-body',scene.text);
    if(!reduced.matches && $('film-copy').animate){
      copyAnimation?.cancel();
      copyAnimation=$('film-copy').animate([{opacity:.55,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:460,easing:'ease-out'});
    }
    camera?.load(index);camera?.load((index+1)%scenes.length);
    dirty=true;
  }
  function seek(index){
    const old=progress();elapsed=Math.max(0,Math.min(scenes.length-1,index))*duration;
    changeScene(Math.floor(elapsed/duration),old,performance.now());
    lastTime=0;setPlaying(playing);wake();
  }
  function togglePlay(){
    if(elapsed>=total){seek(0);setPlaying(true);}else setPlaying(!playing);
  }
  function frame(now){
    request=0;
    if(document.hidden || !inView){lastTime=0;return;}
    if(playing && visible && readyToPlay){
      const old=progress();
      elapsed=Math.min(total,elapsed+(lastTime?Math.min(now-lastTime,220):0));
      const next=Math.min(scenes.length-1,Math.floor(elapsed/duration));
      if(next!==current)changeScene(next,old,now);
      if(elapsed>=total)setPlaying(false);
    }
    lastTime=now;
    const t=progress(), blend=reduced.matches?1:Math.min(1,Math.max(0,(now-transitionStart)/720));
    const movingLook=Math.abs(look.x-target.x)+Math.abs(look.y-target.y)>.002;
    if(dirty || ((playing || blend<1 || movingLook) && now-lastPaint>=30)){
      look.x+=(target.x-look.x)*.17;look.y+=(target.y-look.y)*.17;
      const rendered=camera?.paint(current,t,previous,previousT,blend,look,reduced.matches);
      art.classList.toggle('rendering',!!rendered);
      if(!rendered)art.style.setProperty('--fallback-zoom',reduced.matches?'1.025':String(1.02+t*.065));
      chapterButtons.forEach((button,i)=>button.style.setProperty('--progress',i<current?'1':i===current?String(t):'0'));
      setText('film-time',seconds(elapsed)+' / '+seconds(total));
      lastPaint=now;dirty=false;
    }
    if((playing && visible && readyToPlay)||blend<1||movingLook){if(!request)request=requestAnimationFrame(frame);}
  }
  try{camera=window.createFieldCamera($('field-camera'),images,wake);}
  catch{camera=null;}
  camera?.load(0);camera?.load(1);
  images[0].decode().catch(()=>{}).finally(()=>{readyToPlay=true;lastTime=0;wake();});
  setPlaying(playing);
  $('play-toggle').addEventListener('click',togglePlay);
  chapterButtons.forEach((button,i)=>button.addEventListener('click',()=>seek(i)));
  film.addEventListener('keydown',event=>{
    if(event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)return;
    if(event.key==='ArrowRight' || event.key==='ArrowLeft'){
      event.preventDefault();const next=Math.max(0,Math.min(3,current+(event.key==='ArrowRight'?1:-1)));
      seek(next);chapterButtons[next].focus({preventScroll:true});
    }
  });
  screen.addEventListener('pointerdown',event=>{
    if(event.target.closest('a,button') || reduced.matches)return;
    drag={x:event.clientX,y:event.clientY,originX:target.x,originY:target.y};
  });
  screen.addEventListener('pointermove',event=>{
    if(!drag || reduced.matches)return;
    target.x=Math.max(-1,Math.min(1,drag.originX+(event.clientX-drag.x)/155));
    target.y=Math.max(-1,Math.min(1,drag.originY+(event.clientY-drag.y)/180));wake();
  });
  window.addEventListener('pointerup',()=>{drag=null;});
  screen.addEventListener('pointercancel',()=>{drag=null;});
  new ResizeObserver(wake).observe(art);
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;lastTime=0;if(inView)wake();},{threshold:0}).observe(film);
  document.addEventListener('visibilitychange',()=>{lastTime=0;if(!document.hidden)wake();});
  reduced.addEventListener('change',()=>{if(reduced.matches){target.x=target.y=look.x=look.y=0;setPlaying(false);}wake();});
  if(document.fullscreenEnabled && film.requestFullscreen){
    $('expand-film').hidden=false;
    $('expand-film').addEventListener('click',async()=>{
      try{if(document.fullscreenElement)await document.exitFullscreen();else await film.requestFullscreen();}catch{/* Ordinary page controls remain available. */}
    });
    document.addEventListener('fullscreenchange',()=>{
      setUse($('expand-film'),document.fullscreenElement?'collapse':'expand');
      const label=document.fullscreenElement?'전체 화면 종료':'워크스루 전체 화면';$('expand-film').setAttribute('aria-label',label);$('expand-film').title=label;wake();
    });
  }
  function openDetail(kicker,title,intro,rows,trigger){
    opener=trigger;resumeAfterDetail=playing;visible=false;lastTime=0;
    setText('detail-kicker',kicker);setText('detail-title',title);setText('detail-intro',intro);
    const nodes=rows.map(([name,body])=>{
      const li=document.createElement('li'),h=document.createElement('h3'),p=document.createElement('p');
      h.textContent=name;p.textContent=body;li.append(h,p);return li;
    });
    $('detail-steps').replaceChildren(...nodes);
    document.body.classList.add('detail-open');
    dialog.showModal();dialog.scrollTop=0;$('detail-title').focus({preventScroll:true});
  }
  function closeDetail(){
    if(dialog.open)dialog.close();
    if(visible)return;
    document.body.classList.remove('detail-open');visible=true;lastTime=0;
    if(resumeAfterDetail)wake();opener?.focus({preventScroll:true});
  }
  dialog.addEventListener('close',()=>{if(!dialog.open)closeDetail();});
  dialog.addEventListener('cancel',e=>{e.preventDefault();closeDetail();});
  $('close-detail').addEventListener('click',closeDetail);
  $('detail-contact').addEventListener('click',closeDetail);
  $('open-transcript').addEventListener('click',event=>openDetail('CUSTOMER WALKTHROUGH','품질 담당자가 만나는 네 장면','한 제조 라인의 적용 과정을 설명하기 위해 구성한 가상 사례입니다.',scenes.map(s=>[s.chapter,s.outcome]),event.currentTarget));
  function icon(name){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS(svg.namespaceURI,'use');
    svg.setAttribute('class','icon');svg.setAttribute('aria-hidden','true');use.setAttribute('href','#i-'+name);svg.append(use);return svg;
  }
  function selectCase(index){
    const item=cases[index];atlasIndex=index;
    all('.case-tab').forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
    $('case-detail').setAttribute('aria-labelledby','case-tab-'+item.id);
    $('case-image').src='./assets/'+item.id+'.webp';setText('case-tag',item.tag);setText('case-title',item.title);setText('case-about',item.about);
  }
  cases.forEach((item,index)=>{
    const tab=document.createElement('button');tab.type='button';tab.id='case-tab-'+item.id;tab.className='case-tab';
    tab.setAttribute('role','tab');tab.setAttribute('aria-controls','case-detail');
    const caption=document.createElement('span'),name=document.createElement('strong'),sub=document.createElement('small'),mark=document.createElement('span');
    name.textContent=item.product;sub.textContent=item.area;mark.className='tab-mark';mark.setAttribute('aria-hidden','true');
    caption.append(name,sub);tab.append(icon(item.icon),caption,mark);tab.addEventListener('click',()=>selectCase(index));$('case-list').append(tab);
  });
  selectCase(0);
  $('case-list').addEventListener('keydown',event=>{
    const steps={ArrowRight:1,ArrowLeft:-1,ArrowDown:1,ArrowUp:-1};let index;
    if(event.key==='Home')index=0;else if(event.key==='End')index=cases.length-1;
    else if(event.key in steps)index=(atlasIndex+steps[event.key]+cases.length)%cases.length;else return;
    event.preventDefault();selectCase(index);$('case-tab-'+cases[index].id).focus();
  });
  $('launch-case').addEventListener('click',event=>{const c=cases[atlasIndex];openDetail(c.tag,c.product+' 적용 흐름',c.about,c.steps,event.currentTarget);});
  const menu=$('mobile-menu'),menuButton=$('menu-button');
  function toggleMenu(open){menu.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');setUse(menuButton,open?'x':'menu');}
  menuButton.addEventListener('click',()=>toggleMenu(menu.hidden));menu.addEventListener('click',e=>{if(e.target.closest('a'))toggleMenu(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){toggleMenu(false);menuButton.focus();}});
  document.addEventListener('click',e=>{if(!menu.hidden&&!e.target.closest('.topbar'))toggleMenu(false);});
  matchMedia('(min-width:761px)').addEventListener('change',e=>{if(e.matches)toggleMenu(false);});
  const nav=all('.desktop-nav a[href^="#"]');
  let scheduled=false;
  function markNav(){
    let active='';for(const id of ['walkthrough','solutions','office','company','contact'])if($(id).getBoundingClientRect().top<=innerHeight*.3)active=id;
    nav.forEach(a=>{const on=a.hash==='#'+active;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    scheduled=false;
  }
  window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(markNav);}},{passive:true});
  markNav();
})();
