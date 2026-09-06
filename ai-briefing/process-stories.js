/* The deck keeps its narration, navigation and case-specific demonstrations. */
(() => {
  'use strict';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rendererPromise=null, renderer=null;
  const getRenderer=()=>rendererPromise||(rendererPromise=import('./process-world.js?v=20260906-process-v12').then(m=>renderer=m.createProcessRenderer()));
  const element=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  function enhance(config){
    const root=document.getElementById(config.id);if(!root)return;
    const oldFX=FX[config.id];
    const source=element('div','ps-source');source.id=`ps-source-${config.id}`;source.setAttribute('role','dialog');source.setAttribute('aria-modal','true');source.setAttribute('aria-label','기존 상세 화면');
    [...root.children].filter(e=>!e.matches('.kick,h1,.lead,.productLead')).forEach(e=>source.append(e));
    const sourceTitle=element('div','ps-source-title','기존 상세 화면 · 원래 설명과 수치');source.prepend(sourceTitle);
    const close=element('button','ps-source-close','닫기 ×');source.prepend(close);
    const layout=element('div','ps-layout');
    const viewport=element('div','ps-viewport');viewport.dataset.renderer='loading';
    const host=element('div','ps-canvas-host');
    const loading=element('div','ps-load','3D 설명을 준비하고 있습니다');loading.append(element('small','','단계를 선택해 설명을 먼저 읽을 수 있습니다.'));
    const top=element('div','ps-topline');top.append(element('span','ps-tag',config.tag),element('span','ps-mode','3D 개념 시연'));
    const camera=element('div','ps-camera');camera.setAttribute('role','group');camera.setAttribute('aria-label','3D 시점 조절');
    [['left','↶','왼쪽 시점'],['reset','기본 시점','기본 시점'],['right','↷','오른쪽 시점'],['closer','＋','확대'],['wider','－','축소']].forEach(([view,text,label])=>{
      const b=element('button','',text);b.dataset.view=view;b.setAttribute('aria-label',label);b.disabled=true;b.addEventListener('click',()=>renderer?.view(root,view));camera.append(b);
    });camera.append(element('span','','드래그로 회전'));
    const key=element('div','ps-key');['데이터·관찰','이상·확인 대상','확인·연결 완료'].forEach(t=>key.append(element('span','',t)));
    viewport.append(host,loading,top,camera,key);
    const board=element('aside','ps-board');board.setAttribute('aria-label','단계별 동작 설명');
    const boardTop=element('div','ps-board-top');const counter=element('span','ps-counter');boardTop.append(element('small','','지금 보이는 동작'),counter);
    const title=element('h2',''),detail=element('p','ps-detail'),action=element('div','ps-action'),actionText=element('p','');
    action.append(element('b','','현장에서 이어지는 일'),actionText);
    const boardBottom=element('div','ps-board-bottom'),stateLabel=element('span','ps-sequence-state'),sourceOpen=element('button','ps-source-open','기존 상세 화면');
    sourceOpen.setAttribute('aria-controls',source.id);sourceOpen.setAttribute('aria-expanded','false');boardBottom.append(stateLabel,sourceOpen);
    board.append(boardTop,title,detail,action,boardBottom);layout.append(viewport,board);
    const controls=element('div','ps-controls'),steps=element('div','ps-steps');steps.setAttribute('role','group');steps.setAttribute('aria-label','3D 설명 단계');
    const buttons=config.steps.map((step,i)=>{const b=element('button','ps-step');b.dataset.phase=i;b.append(element('small','',String(i+1).padStart(2,'0')),element('b','',step[0]));steps.append(b);return b;});
    const play=element('button','ps-play','❚❚ 동작 정지'),replay=element('button','ps-replay','↻ 다시 보기');
    controls.append(steps,play,replay);
    root.append(layout,controls,element('p','ps-benefit',config.benefit),element('p','ps-disclaimer','작동 원리를 재현한 3D 개념 모델입니다. 실제 고객 설비·실시간 데이터·제품 UI 또는 성과를 재현한 화면이 아닙니다.'),source);
    root.classList.add('ps-enhanced');
    let phase=0,phaseTime=0,elapsed=0,pinned=false,localPaused=false,replaying=false,active=false,detailsOpen=false,resumeAfterSource=false,entry=0,lastRender=0;
    function show(next,reset=true){
      phase=next;if(reset)phaseTime=0;
      const step=config.steps[phase];counter.textContent=`${String(phase+1).padStart(2,'0')} / 04`;title.textContent=step[1];detail.textContent=step[2];actionText.textContent=step[3];
      root.dataset.processPhase=String(phase);
      buttons.forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===phase));b.style.setProperty('--ps-progress',i<phase?'100%':'0%');});
      host.setAttribute('aria-label',`${step[0]}. ${step[1]}. ${step[2]}`);
      if(active)render(0);
    }
    function render(delta){
      if(!active||!renderer||detailsOpen)return;
      renderer.update(root,{phase,time:reducedMotion?5:phaseTime,delta,reducedMotion});
    }
    function status(){
      const paused=localPaused||playbackPaused||detailsOpen;
      root.dataset.processMotion=paused?'paused':'running';
      play.textContent=localPaused?'▶ 동작 재생':'❚❚ 동작 정지';
      stateLabel.textContent=detailsOpen?'상세 자료 확인 중':paused?'동작 일시정지':reducedMotion?'정지 화면 · 단계 선택':pinned?'선택 단계 · 동작 보기':'순서대로 설명 중';
    }
    buttons.forEach((b,i)=>b.addEventListener('click',()=>{pinned=true;localPaused=false;show(i);status();}));
    play.addEventListener('click',()=>{localPaused=!localPaused;status();});
    replay.addEventListener('click',()=>{pinned=false;localPaused=false;replaying=true;elapsed=0;show(reducedMotion?3:0);status();});
    function closeSource(){
      oldFX?.leave?.();T.clear();detailsOpen=false;source.removeAttribute('open');sourceOpen.setAttribute('aria-expanded','false');
      if(resumeAfterSource)resumePlayback();resumeAfterSource=false;startLoop();status();sourceOpen.focus();
    }
    sourceOpen.addEventListener('click',()=>{
      detailsOpen=true;resumeAfterSource=autoplay&&!playbackPaused;if(resumeAfterSource)pausePlayback();
      source.setAttribute('open','');sourceOpen.setAttribute('aria-expanded','true');oldFX?.enter?.();status();close.focus();
    });
    close.addEventListener('click',closeSource);
    source.addEventListener('keydown',e=>{
      e.stopPropagation();
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeSource();}
      if(e.key==='Tab'){const focusables=[...source.querySelectorAll('button,a[href],input,select,[tabindex="0"]')].filter(el=>el.getClientRects().length);const first=focusables[0],last=focusables.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    });
    root.addEventListener('keydown',e=>{if((detailsOpen||e.target.closest('.ps-controls,.ps-camera,.ps-source-open'))&&[' ','ArrowLeft','ArrowRight','Home','End','PageDown','PageUp'].includes(e.key))e.stopPropagation();});
    ['touchstart','touchmove','touchend'].forEach(name=>host.addEventListener(name,e=>e.stopPropagation(),{passive:true}));
    function startLoop(){
      let last=performance.now();lastRender=0;
      T.raf(now=>{
        const dt=Math.min(.15,Math.max(0,(now-last)/1000));last=now;
        const paused=localPaused||playbackPaused||detailsOpen||document.hidden;
        status();
        if(!paused&&!reducedMotion){
          elapsed+=dt;phaseTime+=dt;
          if(!pinned){
            let progress=Math.min(1,elapsed/32);
            if(!replaying&&voiceOn&&recordedActive&&Number.isFinite(recordedNarration.duration)&&recordedNarration.duration>0)progress=Math.min(1,recordedNarration.currentTime/recordedNarration.duration);
            const next=Math.min(3,Math.floor(progress*4));if(next!==phase)show(next);
            buttons[phase].style.setProperty('--ps-progress',Math.min(100,(progress*4-phase)*100)+'%');
          }
        }
        if(now-lastRender>=32){render(paused||reducedMotion?0:dt);lastRender=now;}
      });
    }
    FX[config.id]={
      enter(){
        active=true;entry++;const ticket=entry;elapsed=0;phaseTime=0;pinned=false;localPaused=false;replaying=false;detailsOpen=false;source.removeAttribute('open');sourceOpen.setAttribute('aria-expanded','false');
        show(reducedMotion?3:0);status();viewport.dataset.renderer='loading';camera.querySelectorAll('button').forEach(b=>b.disabled=true);
        getRenderer().then(async r=>{if(!active||entry!==ticket)return;const mounted=await r.mount(root,host,config);if(!mounted||!active||entry!==ticket)return;viewport.dataset.renderer='webgl';camera.querySelectorAll('button').forEach(b=>b.disabled=false);render(0);}).catch(error=>{
          if(!active||entry!==ticket)return;viewport.dataset.renderer='fallback';loading.replaceChildren(element('span','','이 기기에서는 3D를 표시할 수 없습니다.'),element('small','','오른쪽 단계 설명과 기존 상세 화면을 이용해주세요.'));console.warn('3D explanation fallback:',config.id,error);
        });
        startLoop();
      },
      leave(){
        if(detailsOpen)oldFX?.leave?.();if(detailsOpen&&resumeAfterSource){playbackPaused=false;updateAutoButton();}
        resumeAfterSource=false;detailsOpen=false;active=false;entry++;root.dataset.processMotion='paused';source.removeAttribute('open');renderer?.unmount(root);
      }
    };
    show(0);
    // A fast visitor may reach a scene before the lightweight catalog is loaded.
    if(started&&scenes[cur]===root){oldFX?.leave?.();T.clear();FX[config.id].enter();}
  }
  import('./process-catalog.js?v=20260906-process-v12').then(({processCatalog})=>processCatalog.forEach(enhance)).catch(error=>console.warn('Original briefing remains available.',error));
})();
