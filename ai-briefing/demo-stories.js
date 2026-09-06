/* Narration-synchronized short editions of the two downloadable demos. */
(() => {
 'use strict';
 const catalogs={
  sBEAUTY:{product:'beauty',file:'beauty-visual.html',steps:[
   ['한 박스','작은 구성 차이에서 시작합니다.','발주에는 3품목. 기획세트를 풀어보면 확인할 구성품은 4개입니다.','주문에 필요한 구성부터 분명하게.'],
   ['예외 조치','보충하고, 같은 주문을 다시 확인.','미니어처가 빠진 예시입니다. 작업자가 확인·보충한 뒤 재검수합니다.','발견 → 작업자 조치 → 재확인'],
   ['출고 기록','박스가 떠나도, 확인 근거는 남습니다.','처음과 최종 장면, 작업자 조치를 주문 하나로 되짚고 회신 초안을 확인합니다.','어떤 차이를 어떻게 마무리했는지.'],
   ['상품 기준','자료의 차이를 담당자에게.','라벨과 브랜드 자료의 충돌·누락을 추립니다. 확인한 값과 근거를 마스터 초안에 남깁니다.','확인할 항목부터 정리합니다.'],
   ['다음 연결','변경된 기준이 검수까지 이어지도록.','채널·행사별 구성 기준의 연결은 다음 구현 목표입니다. 실제 물량과 비용으로 도입 효과를 검증합니다.','기준 변경시간 · 재검수 포함 작업시간']
  ]},
  sLLM:{product:'llm',file:'llm-visual.html',steps:[
   ['사내 지식','사내 문서가 업무의 근거가 됩니다.','문서 검색부터 답변·도구 실행까지, 정보가 어디로 이동하는지 3D로 살펴봅니다.','업무 AI의 처리 구조를 한눈에.'],
   ['권한과 근거','허용된 문서로 답하고, 근거를 남깁니다.','직원마다 접근할 수 있는 자료를 구분합니다. 결론과 문서 위치, 확인하지 못한 부분을 함께 표시합니다.','권한을 확인한 검색 → 검토 가능한 답변'],
   ['업무 도구','표 · 계산 · 그래프 · 보고서 초안.','사내에 설치한 도구로 문서의 숫자를 정리하고, 계산 결과와 근거를 초안에 연결합니다.','담당자는 근거와 가정을 검토합니다.'],
   ['통신 경계','외부 정보에도 승인과 경계를 둡니다.','허용 사이트의 통제 검색, 또는 외부 통신 없이 승인 반입 자료를 사용하는 구성을 선택합니다.','검색어 · 승인 · 자료 기준일을 확인'],
   ['실증','실제 업무 하나로 확인합니다.','모의 시연을 바탕으로 답변 근거와 권한, 외부 통신 설정을 검증하고 도입 범위를 정합니다.','효과와 통제를 함께 검증합니다.']
  ]}
 };
 let timings={};fetch('./demo-narration-timings.json').then(r=>{if(r.ok)return r.json();throw Error('timings');}).then(j=>{timings=j;}).catch(()=>{});
 const make=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text)el.textContent=text;return el;};
 for(const [id,config] of Object.entries(catalogs)){
  const root=document.getElementById(id);if(!root)continue;
  const visual=root.querySelector('.ds-visual'),loader=root.querySelector('.ds-loading'),buttons=[...root.querySelectorAll('.ds-steps button')];
  let frame=null,active=false,phase=-1,elapsed=0,lastPost=0,progress=0,pinned=false,lastNarrationToken=-1;
  function send(paused=false){if(frame?.contentWindow)frame.contentWindow.postMessage({type:'ziewise:briefing',action:'step',phase:Math.max(0,phase),progress,paused},location.origin);}
  function show(i){
   if(i===phase)return;phase=i;root.dataset.demoPhase=i;const s=config.steps[i];
   root.querySelector('.ds-counter').textContent=String(i+1).padStart(2,'0')+' / 05';root.querySelector('.ds-board h2').textContent=s[1];root.querySelector('.ds-detail').textContent=s[2];root.querySelector('.ds-value').textContent=s[3];
   buttons.forEach((b,k)=>b.setAttribute('aria-pressed',String(k===i)));send(playbackPaused||document.hidden);
  }
  function bounds(){
   const voice=sceneVoice(id),saved=timings[id]?.[voice];
   if(voiceOn&&recordedActive&&Array.isArray(saved)&&saved.length===5)return saved;
   const duration=voiceOn&&recordedActive&&recordedNarration.duration>0?recordedNarration.duration:autoplay?estimate(NARR[NARRIDX[id]]||'')/1000:55;
   return config.steps.map((_,i)=>({start:i*duration/5,end:(i+1)*duration/5}));
  }
  buttons.forEach((b,i)=>b.addEventListener('click',()=>{
   const ranges=bounds();progress=0;elapsed=ranges[i].start;
   if(voiceOn&&recordedActive&&Number.isFinite(recordedNarration.duration)){pinned=false;recordedNarration.currentTime=Math.min(recordedNarration.duration-.05,ranges[i].start+.03);}
   else pinned=true;
   show(i);send(playbackPaused||document.hidden);
  }));
  root.querySelectorAll('.ds-links a').forEach(link=>link.addEventListener('click',()=>{if(autoplay)pausePlayback();else stopSpeak();send(true);}));
  root.addEventListener('keydown',e=>{if(e.target.closest('.ds-steps,.ds-links')&&[' ','ArrowLeft','ArrowRight','Home','End','PageDown','PageUp'].includes(e.key))e.stopPropagation();});
  window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==frame?.contentWindow||e.data?.type!=='ziewise:visual-ready')return;loader.hidden=true;send(playbackPaused||document.hidden);});
  document.addEventListener('visibilitychange',()=>{if(active&&document.hidden){if(autoplay)pausePlayback();else stopSpeak();send(true);}});
  FX[id]={
   enter(){
    active=true;elapsed=0;phase=-1;progress=0;pinned=false;lastPost=0;lastNarrationToken=speakToken;show(0);loader.hidden=false;
    frame=make('iframe','ds-frame');frame.title=id==='sBEAUTY'?'뷰티 출고 검수 3D 축약 시연':'ZiewLLM 사내 업무 AI 3D 축약 시연';frame.src='./demos/'+config.file+'?embed=1';frame.setAttribute('loading','eager');visual.append(frame);
    let last=performance.now();
    T.raf(now=>{
     const delta=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
     const paused=playbackPaused||document.hidden;
     if(lastNarrationToken!==speakToken){lastNarrationToken=speakToken;pinned=false;elapsed=0;}
     if(!paused&&!pinned){
      elapsed+=delta;const ranges=bounds(),time=voiceOn&&recordedActive?recordedNarration.currentTime:elapsed;
      let i=ranges.findIndex(r=>time<r.end);if(i<0)i=4;
      progress=Math.max(0,Math.min(1,(time-ranges[i].start)/Math.max(.1,ranges[i].end-ranges[i].start)));show(i);
     }
     root.querySelector('.ds-status').textContent=paused?'일시정지 · 단계 선택 가능':pinned?'선택한 단계 · 자유롭게 살펴보세요':voiceOn&&recordedActive?'나레이션에 맞춰 장면 전환 중':'3D 설명 · 단계 직접 선택 가능';
     if(now-lastPost>150){lastPost=now;send(paused);}
    });
   },
   leave(){active=false;send(true);frame?.remove();frame=null;}
  };
  show(0);
 }
})();
