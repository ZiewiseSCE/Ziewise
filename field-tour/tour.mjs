import {bindProvider,connectionFrame} from './provider.mjs';
import {stops,byId,homeRoute,homeStory,referenceMap} from './route.mjs?v=solid1';
import {homeVoice} from './home-voice.mjs?v=f2-1';

const $=id=>document.getElementById(id);
const stage=document.querySelector('[data-tour]');
const brief=stage.dataset.tour==='brief',content=window.BriefTopics??[],voices=window.BriefVoice??{};
const chosen=new URLSearchParams(location.search);
const sourceId=chosen.get('reference')||chosen.get('scene');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const cueTurns={design:[2,3],systems:[2,3],vision:[1,3],safety:[1,3],maintenance:[2,3],count:[2,3],edge:[1,3],
  knowledge:[1,2],hr:[1,3],finance:[1,2],purchase:[1,3],sales:[1,3],roi:[1,2],poc:[2,3],observer:[1,3],print:[1,3]};
// Camera boundaries in the original prerendered brief-route.mp4, in seconds.
const briefFilmShots={
  systems:[0,9.262,16.352,21.221], design:[21.221,30.083,36.913,42.097],
  vision:[42.097,45.709,52.849,59.448], safety:[59.448,63.060,77.400,83.473],
  maintenance:[83.473,90.285,96.795,101.110], count:[101.110,108.092,114.042,118.591],
  edge:[118.591,121.413,130.923,136.705], observer:[136.705,140.167,152.007,158.326],
  print:[158.326,161.688,170.778,176.072], knowledge:[176.072,181.354,187.604,199.526],
  hr:[199.526,203.628,214.418,219.388], finance:[219.388,222.530,230.150,237.696],
  purchase:[237.696,241.018,250.248,255.528], sales:[255.528,259.360,270.340,276.616],
  roi:[276.616,282.408,288.078,296.355], poc:[296.355,304.457,310.237,315.098]
};
let homeFilmStart=0;
const route=brief?content.map(topic=>{
  const voice=voices[topic.file], spec=byId.get(topic.id);
  const turns=voice.cues.length<4?[1,2]:cueTurns[topic.id];
  return {...spec,topic,voice,duration:voice.duration,cuts:turns.map(i=>voice.cues[i].start/voice.duration),filmShots:briefFilmShots[topic.id]};
}):homeRoute.map(([id,filmDuration])=>{
  const voice=homeVoice[id],cuts=[.42,.73];
  const filmShots=[0,...cuts,1].map(p=>homeFilmStart+p*filmDuration);
  homeFilmStart+=filmDuration;
  return {...byId.get(id),...homeStory[id],voice,duration:voice.duration,cuts,filmShots};
});
const starts=[];let total=0;
for(const stop of route){starts.push(total);total+=stop.duration;}
const timecode=seconds=>{const s=Math.floor(Math.max(0,seconds)+.001);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
const set=(id,text)=>{const e=$(id);if(e&&e.textContent!==text)e.textContent=text;};
const edition='solid1';
const voiceDirectory=brief?'./narration/':'./field-tour/narration/';
const voiceEdition='f2-1';
const posterUrl=id=>new URL('./views/'+id+(brief?'-brief':'')+'.webp?v='+edition,import.meta.url).href;
const audio=$('narration'),canvas=$('walk-world'),map=$('walk-plan'),routeDialog=$('walk-route');
let index=-1,t=0,playing=!reduced.matches,ended=false,voiceOn=false,hasListened=false,audioRequest=0;
let world=null,visible=true,manual=false,nearest=null,entryOnly=true,inspecting=false,lastPhase=-1;
let lastTick=0,lastPaint=0,lastPlan=0,request=0,dirty=true,docPaused=false,pendingSeek=null;
let cameraZ=7,peek=[0,0],pointer=null,budgetSamples=0,budgetTotal=0,qualityDrops=0,stepButtons=[];
const frameInterval=matchMedia('(pointer:coarse)').matches?32:15;
let backup=null,backupReady=false;
let startingVisual=true,viewRequest=0;
let entrance=null,entranceTimer=0;
const mapButtons=[];let selectedProvider='local',connection=null;
function resetConnection(){
  if(!connection)return;
  connection=null;delete stage.dataset.connection;
  if(current())$('walk-poster').src=posterUrl(current().id);
  if(backupReady)stage.dataset.renderer=reduced.matches?'stills':'video';
}
if(brief)bindProvider($('brief-model-choice'),value=>{
  selectedProvider=value;world?.setProvider(value);
  if(current()?.id!=='knowledge')return;
  const from=connection?.to;
  seekWithin((current().cuts[1]+.025)*current().duration);setPlaying(false);
  connection={from,to:value,start:performance.now()};stage.dataset.connection=value;
  if(!world){$('walk-poster').src=new URL('./chapters/views/knowledge-'+value+'.webp?v=solid1',import.meta.url).href;stage.dataset.renderer='stills';}
  wake();
});
const current=()=>route[index];
const fraction=()=>Math.max(0,Math.min(1,t/current().duration));
const phase=()=>fraction()>=current().cuts[1]?2:fraction()>=current().cuts[0]?1:0;

function buildMap(){
  const labels=[...new Set(route.map(s=>s.area))];
  for(const group of labels){
    const block=document.createElement('section'),title=document.createElement('h3'),list=document.createElement('div');
    block.className='route-group';title.textContent=group;block.append(title,list);
    route.forEach((stop,i)=>{
      if(stop.area!==group)return;
      const button=document.createElement('button'),num=document.createElement('small'),name=document.createElement('span');
      button.type='button';num.textContent=String(i+1).padStart(2,'0');name.textContent=stop.label+' · '+stop.room;
      button.append(num,name);button.addEventListener('click',()=>{
        const moving=resumeAfterMap;resumeAfterMap=false;routeDialog.close();select(i,0,true,true);setPlaying(moving);
      });
      list.append(button);mapButtons[i]=button;
    });$('walk-stops').append(block);
  }
}
function showNotes(stop){
  if(!brief)return;
  set('note-title',stop.label+' 작업 흐름');set('voice-transcript',stop.voice.script);
  $('walk-ref').href='./reference.html#'+stop.topic.original;
  $('brief-model-choice').hidden=stop.id!=='knowledge';
  $('walk-steps').replaceChildren();
  stepButtons=stop.marks.map((name,i)=>{
    const b=document.createElement('button'),label=document.createElement('small'),h=document.createElement('strong'),desc=document.createElement('span');
    b.type='button';b.className='walk-step';label.textContent=(stop.id==='knowledge'?['자료 준비','로컬 모델 구축','운영 방식']:stop.id==='print'?['출력 요청','사용자 인증','문서 수령']:['입력','분석','업무 적용'])[i];h.textContent=name;desc.textContent=stop.topic.rows[i];
    b.append(label,h,desc);b.addEventListener('click',()=>{
      const part=i===0?.11:current().cuts[i-1]+.025;
      seekWithin(part*current().duration);stage.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});
    });$('walk-steps').append(b);return b;
  });
}
function parkInspection(){
  inspecting=false;$('walk-object-detail').hidden=true;$('walk-object').setAttribute('aria-expanded','false');
}
function setSoundLabel(){
  const control=$('listen-start');control.setAttribute('aria-pressed',String(voiceOn));
  control.querySelector('span').textContent=voiceOn?'나레이션 끄기':'나레이션 켜기';
}
function syncBackup(force=false) {
  if(!backupReady)return;
  const stop=current(),part=phase(),shots=stop.filmShots;
  const start=(part===0?0:stop.cuts[part-1])*stop.duration;
  const end=(stop.cuts[part]??1)*stop.duration;
  const rate=(shots[part+1]-shots[part])/(end-start);
  const at=shots[part]+(t-start)*rate;
  if(Math.abs(backup.playbackRate-rate)>.001)backup.playbackRate=rate;
  const wantsMotion=playing&&!manual&&!inspecting&&!routeDialog.open&&!document.hidden&&visible&&!reduced.matches;
  if((force||Math.abs(backup.currentTime-at)>.7)&&Math.abs(backup.currentTime-at)>.09&&!backup.seeking){
    backup.currentTime=Math.min(at,Math.max(0,backup.duration-.045));
  }
  if(wantsMotion&&backup.paused&&!backup.ended)backup.play().catch(()=>{});
  if(!wantsMotion&&!backup.paused)backup.pause();
}
function report(text){set('walk-status',text);}
function updateTransport(){
  stage.classList.toggle('is-paused',!playing||manual);
  const action=ended?'처음부터 다시 재생':playing?'투어 일시정지':'투어 재생';
  $('walk-play').setAttribute('aria-label',action);$('walk-play').title=action;
  const mode=manual?'직접 걷기':ended?'투어 완료':!playing?'일시정지':stage.dataset.renderer==='stills'?'장면 안내':'자동 안내';
  set('walk-mode',mode);set('walk-moving',manual?'자유 이동':ended?'완료':playing?'재생 중':'일시정지');
  $('walk-prev').disabled=index<1;$('walk-next').disabled=index===route.length-1;
  $('walk-explore').setAttribute('aria-pressed',String(manual));
  $('walk-explore').querySelector('span').textContent=manual?'안내 복귀':'직접 걷기';
  $('walk-seek').disabled=manual;
  $('listen-start').disabled=manual;
}
async function playAudio() {
  if(!audio||!voiceOn||!playing||manual||document.hidden||routeDialog.open)return;
  const token=++audioRequest;
  try{await audio.play();}
  catch(error){if(token!==audioRequest||error.name==='AbortError')return;voiceOn=false;setSoundLabel();report('음성을 시작하려면 나레이션 켜기를 한 번 더 눌러 주세요.');}
}
function syncAudioTime(seconds) {
  if(!audio)return;
  if(audio.readyState>=1&&Number.isFinite(audio.duration)){
    pendingSeek=null;audio.currentTime=Math.min(seconds,Math.max(0,audio.duration-.04));
  } else pendingSeek=seconds;
}
function setPlaying(next) {
  if(next)resetConnection();
  playing=!!next;lastTick=0;
  if(entrance){if(playing)entrance.play().catch(()=>{});else entrance.pause();}
  if(playing)playAudio();
  else if(audio){++audioRequest;audio.pause();}
  updateTransport();syncBackup();wake();
}
function select(i,seconds=0,instant=true,updateUrl=false) {
  if(i<0||i>=route.length)return;
  clearEntrance();
  resetConnection();
  if(manual)leaveManual(false);
  parkInspection();const changed=i!==index;
  index=i;t=Math.max(0,Math.min(seconds,current().duration));ended=false;entryOnly=instant;lastPhase=-1;peek=[0,0];nearest=null;
  const stop=current();stage.dataset.station=stop.id;
  if(changed||!$('walk-poster').currentSrc)$('walk-poster').src=posterUrl(stop.id);
  const title=brief?(stop.id==='design'?'가공 자국과 흠집을 구별해 보세요.':stop.topic.title):stop.title;
  set('walk-title',title);set('walk-area',stop.area);set('walk-room',stop.room);
  set('walk-count',String(i+1).padStart(2,'0')+' / '+String(route.length).padStart(2,'0'));
  mapButtons.forEach((button,j)=>{if(i===j)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
  if(changed){
    ++audioRequest;audio.pause();pendingSeek=t;
    audio.src=voiceDirectory+stop.voice.file+'?v='+voiceEdition;
    $('korean-captions').src=voiceDirectory+'captions/'+stop.voice.file.replace(/\.mp3$/,'.vtt')+'?v='+voiceEdition;
    audio.load();
  }else syncAudioTime(t);
  if(voiceOn&&playing)playAudio();
  if(brief){
    showNotes(stop);
    if(updateUrl){const u=new URL(location.href);u.searchParams.delete('scene');u.searchParams.delete('reference');u.searchParams.set('chapter',stop.id);u.hash='chapters';history.replaceState(null,'',u);}
    if(updateUrl&&$('walk-reference-note'))$('walk-reference-note').hidden=true;
  }else $('walk-deep').href='./ai-briefing/?chapter='+stop.id+'#chapters';
  if(world)showStationWhenReady();
  lastTick=0;updateTransport();syncReadout();syncBackup(true);wake();
}
function showStationWhenReady(){
  const token=++viewRequest,candidate=world,id=current().id;
  if(candidate.isReady(id)){
    startingVisual=false;stage.dataset.renderer='webgl';$('walk-explore').disabled=false;return;
  }
  startingVisual=true;stage.dataset.renderer='stills';$('walk-explore').disabled=true;
  candidate.readyFor(id).then(()=>{
    if(viewRequest!==token||world!==candidate)return;
    startingVisual=false;stage.dataset.renderer='webgl';$('walk-explore').disabled=false;lastTick=0;updateTransport();wake();
  }).catch(()=>{if(viewRequest===token&&world===candidate)noHardware();});
}
function seekWithin(seconds) {
  clearEntrance();
  resetConnection();
  if(manual)leaveManual(false);
  parkInspection();t=Math.max(0,Math.min(seconds,current().duration));ended=false;entryOnly=true;
  syncAudioTime(t);lastTick=0;syncReadout();syncBackup(true);wake();
}
function advance() {
  if(index+1<route.length){select(index+1,0,false,true);return;}
  t=current().duration;ended=true;setPlaying(false);syncReadout();
}
function syncReadout() {
  const stop=current(),part=phase(),absolute=starts[index]+t;
  set('walk-clock',timecode(ended?Math.round(total):absolute));$('walk-seek').value=String(Math.round(absolute/total*1000));
  $('walk-seek').style.setProperty('--elapsed',(absolute/total*100).toFixed(2)+'%');
  $('walk-seek').setAttribute('aria-valuetext',timecode(absolute)+' / '+timecode(Math.round(total)));
  if(brief||voiceOn){
    let cue=stop.voice.cues[0];for(const candidate of stop.voice.cues){if(candidate.start>t+.025)break;cue=candidate;}
    set('walk-line',cue.text);
  }else set('walk-line',stop.short);
  if(part!==lastPhase){
    lastPhase=part;stage.dataset.phase=String(part);$('walk-object').querySelector('span').textContent=stop.marks[part];
    stepButtons.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===part)));
  }
}
function drawMap(){
  const ctx=map.getContext('2d');if(!ctx)return;
  const w=map.width,h=map.height,x=z=>10+(8.5-z)/57*(w-20),mid=h*.51;
  ctx.clearRect(0,0,w,h);ctx.strokeStyle='#9aa99d';ctx.lineWidth=1.5;ctx.setLineDash([3,5]);
  ctx.beginPath();ctx.moveTo(6,mid);ctx.lineTo(w-6,mid);ctx.stroke();ctx.setLineDash([]);
  for(const s of (brief?stops:route)){
    const a=x(s.z),active=s.id===(manual?nearest:current().id),edge=mid-s.side*24;
    ctx.strokeStyle=active?'#def795':'#819087';ctx.lineWidth=active?3:1.5;
    ctx.beginPath();ctx.moveTo(a,mid-s.side*4);ctx.lineTo(a,edge);ctx.stroke();
    ctx.fillStyle=active?'#d8f48c':'#62766b';ctx.fillRect(a-4,edge-4,8,8);
  }
  const at=x(cameraZ);ctx.beginPath();ctx.arc(at,mid,8,0,Math.PI*2);ctx.fillStyle='#d9f88d';ctx.fill();ctx.strokeStyle='#28372a';ctx.lineWidth=3;ctx.stroke();
}
function locateMarker(mark) {
  const el=$('walk-object');
  if(!mark||manual||inspecting||!mark.visible||mark.x<.08||mark.x>.83||mark.y<.17||mark.y>.7){el.hidden=true;return;}
  el.hidden=false;el.style.left=(mark.x*100).toFixed(2)+'%';el.style.top=(mark.y*100).toFixed(2)+'%';
}
function wake(){dirty=true;if(!request&&!document.hidden)request=requestAnimationFrame(tick);}
function tick(now) {
  request=0;if(document.hidden)return;
  if(!visible&&!(voiceOn&&playing)){lastTick=0;return;}
  const dt=lastTick?Math.min((now-lastTick)/1000,.48):0;lastTick=now;
  if(playing&&!manual&&!routeDialog.open&&!inspecting){
    if(voiceOn){if(!audio.paused&&!audio.seeking)t=Math.min(audio.currentTime,current().duration);}
    else if(entrance&&!entrance.paused)t=entrance.currentTime;
    else if(!startingVisual){t+=dt;if(t>=current().duration)advance();}
  }
  if(visible&&(dirty||now-lastPaint>=frameInterval)){
    const since=lastPaint?now-lastPaint:0;lastPaint=now;dirty=false;
    if(world&&!startingVisual){
      if(manual){
        const position=world.stepManual(Math.min(dt,.10));cameraZ=position.z;
        if(nearest!==position.nearest&&position.nearest){nearest=position.nearest;set('walk-room',byId.get(nearest).room);set('walk-area',byId.get(nearest).area);}
        locateMarker(null);
      }else{
        const mark=world.draw({id:current().id,previous:index>0?route[index-1].id:null,p:fraction(),phase:phase(),cuts:current().cuts,entryOnly,close:brief,reduced:reduced.matches,lean:inspecting,peek,connection:connectionFrame(connection,now,reduced.matches)});
        if(mark)cameraZ=mark.z;locateMarker(mark);
      }
      if(playing&&!manual&&since>0&&since<650){
        budgetSamples++;budgetTotal+=Math.min(270,since);
        if(budgetSamples>=34){
          const average=budgetTotal/budgetSamples;budgetTotal=budgetSamples=0;
          if(qualityDrops<3&&average>83){world.lighten();qualityDrops++;}
          else if(qualityDrops>=3&&average>110)noHardware();
        }
      }
    }else {cameraZ=current().z;locateMarker(null);if(backupReady&&!reduced.matches)syncBackup();}
    if(now-lastPlan>95||!playing){drawMap();lastPlan=now;}
  }
  syncReadout();
  if((playing||manual||(connection&&!reduced.matches&&now-connection.start<2300))&&!request)request=requestAnimationFrame(tick);
}
function leaveManual(resume) {
  manual=false;stage.classList.remove('is-manual');$('walk-manual').hidden=true;
  world?.keys.clear();set('walk-room',current().room);set('walk-area',current().area);
  nearest=null;peek=[0,0];updateTransport();if(resume)setPlaying(true);wake();
}
function enableManual() {
  if(!world)return;
  if(manual){leaveManual(true);return;}
  parkInspection();setPlaying(false);manual=true;world.startManual();stage.classList.add('is-manual');
  $('walk-manual').hidden=false;canvas.focus({preventScroll:true});updateTransport();wake();
}
let resumeAfterMap=false,resumeAfterInspect=false;
$('walk-map').addEventListener('click',()=>{resumeAfterMap=playing;setPlaying(false);routeDialog.showModal();});
$('walk-route-close').addEventListener('click',()=>routeDialog.close());
routeDialog.addEventListener('close',()=>{if(resumeAfterMap){resumeAfterMap=false;setPlaying(true);}wake();});
routeDialog.addEventListener('click',event=>{if(event.target===routeDialog)routeDialog.close();});
$('walk-play').addEventListener('click',()=>{if(manual){leaveManual(true);return;}if(ended){select(0,0,true,true);setPlaying(true);return;}parkInspection();setPlaying(!playing);});
$('walk-prev').addEventListener('click',()=>select(index-1,0,true,true));
$('walk-next').addEventListener('click',()=>select(index+1,0,true,true));
$('walk-seek').addEventListener('input',event=>{
  const abs=Number(event.target.value)*total/1000;
  const next=starts.findLastIndex(value=>value<=abs);
  if(next===index)seekWithin(abs-starts[index]);else select(next,abs-starts[next],true,true);
});
$('walk-explore').addEventListener('click',enableManual);
$('walk-near').addEventListener('click',()=>{
  const found=route.findIndex(s=>s.id===nearest);
  if(found<0&&nearest){location.href=new URL('../ai-briefing/?chapter='+nearest+'#chapters',import.meta.url).href;return;}
  if(found>=0){leaveManual(false);select(found,0,true,true);setPlaying(true);}
});
$('walk-object').addEventListener('click',()=>{
  resumeAfterInspect=playing;setPlaying(false);inspecting=true;const panel=$('walk-object-detail'),s=current();
  panel.hidden=false;panel.querySelector('strong').textContent=s.marks[phase()];
  panel.querySelector('p').textContent=brief?s.topic.rows[phase()]:s.short;
  $('walk-object').setAttribute('aria-expanded','true');panel.querySelector('button').focus({preventScroll:true});wake();
});
function finishInspection(){parkInspection();if(resumeAfterInspect)setPlaying(true);resumeAfterInspect=false;wake();}
$('walk-object-detail').querySelector('button').addEventListener('click',finishInspection);
const keys={KeyW:'forward',KeyS:'back',KeyA:'left',KeyD:'right',ArrowUp:'forward',ArrowDown:'back',ArrowLeft:'turnleft',ArrowRight:'turnright'};
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&manual){leaveManual(true);return;}
  if(e.key==='Escape'&&inspecting){finishInspection();return;}
  if(!manual||!keys[e.code]||e.metaKey||e.ctrlKey||e.altKey||!stage.contains(document.activeElement))return;
  e.preventDefault();world.keys.add(keys[e.code]);wake();
});
window.addEventListener('keyup',e=>world?.keys.delete(keys[e.code]));
window.addEventListener('blur',()=>world?.keys.clear());
for(const b of document.querySelectorAll('[data-move]')){
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);world?.keys.add(b.dataset.move);wake();});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>world?.keys.delete(b.dataset.move));
}
canvas.addEventListener('pointerdown',e=>{if(!world||(!manual&&e.pointerType==='touch'))return;pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{
  if(!pointer)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer={x:e.clientX,y:e.clientY};
  if(manual)world.rotate(dx,dy);else{peek[0]=Math.max(-.3,Math.min(.3,peek[0]-dx*.002));peek[1]=Math.max(-.19,Math.min(.19,peek[1]-dy*.002));}wake();
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{pointer=null;});
if(document.fullscreenEnabled&&stage.requestFullscreen){
  $('walk-expand').hidden=false;$('walk-expand').addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen();}catch{report('이 브라우저에서는 페이지 안에서 투어를 볼 수 있습니다.');}
  });
  document.addEventListener('fullscreenchange',()=>{$('walk-expand').setAttribute('aria-label',document.fullscreenElement?'전체 화면 종료':'투어 전체 화면');wake();});
}
if(brief) {
  const trigger=$('brief-menu-button'),menu=$('brief-mobile-menu');
  function toggleMenu(on){menu.hidden=!on;trigger.setAttribute('aria-expanded',String(on));trigger.setAttribute('aria-label',on?'메뉴 닫기':'메뉴 열기');}
  trigger.addEventListener('click',()=>toggleMenu(menu.hidden));menu.addEventListener('click',()=>toggleMenu(false));
  document.addEventListener('click',e=>{if(!menu.hidden&&!e.target.closest('.topbar'))toggleMenu(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){toggleMenu(false);trigger.focus();}});
}
audio.addEventListener('loadedmetadata',()=>{if(pendingSeek!==null)syncAudioTime(pendingSeek);});
audio.addEventListener('ended',()=>{if(playing&&voiceOn&&!manual)advance();});
audio.addEventListener('error',()=>{if(!voiceOn)return;voiceOn=false;setSoundLabel();report('음성을 불러올 수 없어 자막과 함께 안내합니다.');wake();});
$('listen-start').addEventListener('click',()=>{
  if(voiceOn){voiceOn=false;++audioRequest;audio.pause();setSoundLabel();wake();return;}
  if(ended)select(0,0,true,true);
  if(!hasListened){t=0;entryOnly=true;hasListened=true;}
  clearEntrance();parkInspection();voiceOn=true;setSoundLabel();report('');syncAudioTime(t);setPlaying(true);
});
function noHardware(){
  clearEntrance();
  const previous=world;startingVisual=false;world=null;previous?.release();stage.dataset.renderer='stills';$('walk-explore').disabled=true;
  if(manual)leaveManual(false);updateTransport();
  if(!backup){
    backup=document.createElement('video');backup.id='walk-film';backup.muted=true;backup.defaultMuted=true;
    backup.playsInline=true;backup.preload='auto';backup.setAttribute('aria-hidden','true');
    backup.src=new URL((brief?'./brief-route.mp4':'./home-route.mp4')+'?v='+edition,import.meta.url).href;
    canvas.before(backup);
    backup.addEventListener('loadeddata',()=>{
      backupReady=true;stage.dataset.renderer=reduced.matches?'stills':'video';syncBackup(true);
      if(!reduced.matches)report('같은 3D 경로를 미리 렌더링한 투어 영상으로 안내합니다.');
      updateTransport();wake();
    },{once:true});
    backup.addEventListener('error',()=>{backupReady=false;stage.dataset.renderer='stills';report('현장 장면과 자막으로 안내합니다.');});
  }
  wake();
}
function clearEntrance(adoptTime=false){
  clearTimeout(entranceTimer);entranceTimer=0;
  if(!entrance)return;
  if(adoptTime&&!voiceOn&&playing&&t<.15)t=Math.min(entrance.currentTime,current().duration-.1);
  const player=entrance;entrance=null;player.pause();player.removeAttribute('src');player.load();player.remove();
}
function showEntrance(){
  if(world||backup||reduced.matches||!playing||document.hidden||!visible)return;
  const name=brief?{systems:'systems',knowledge:'knowledge'}[current().id]:current().id==='design'?'arrival':'';
  if(!name)return;
  const player=document.createElement('video');entrance=player;player.className='walk-entrance';
  player.muted=player.defaultMuted=player.playsInline=true;player.setAttribute('aria-hidden','true');
  player.addEventListener('playing',()=>player.classList.add('show'),{once:true});
  player.src=new URL('./views/'+name+'-entry.mp4?v='+edition,import.meta.url).href;
  canvas.before(player);player.play().catch(()=>{if(entrance===player)clearEntrance();});
}
async function bootWorld() {
  let candidate=null;
  entranceTimer=setTimeout(showEntrance,800);
  try{
    const {createWorld}=await import('./world.mjs?v=solid1');
    candidate=createWorld(canvas,{onLoss:noHardware});
    let active;
    do{active=current().id;await candidate.readyFor(active);}while(active!==current().id);
    if(backup){candidate.release();return;}
    clearEntrance(true);
    candidate.draw({id:active,p:fraction(),entryOnly:true,close:brief,reduced:reduced.matches,cuts:current().cuts,phase:phase()});
    world=candidate;world.setProvider(selectedProvider);startingVisual=false;
    stage.dataset.renderer='webgl';$('walk-explore').disabled=false;updateTransport();lastTick=0;
    wake();
  }catch(error){candidate?.release();console.warn('3D tour:',error.message);noHardware();}
}
new ResizeObserver(wake).observe($('walk-view'));
let worldStarted=false;
function ensureWorld(){if(!worldStarted){worldStarted=true;bootWorld();}}
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;lastTick=0;syncBackup();if(visible){ensureWorld();wake();}},{threshold:0}).observe(stage);
document.addEventListener('visibilitychange',()=>{
  lastTick=0;
  if(document.hidden){world?.keys.clear();docPaused=!!audio&&!audio.paused;if(docPaused)audio.pause();backup?.pause();}
  else {if(docPaused)playAudio();docPaused=false;wake();}
});
reduced.addEventListener('change',()=>{if(backupReady)stage.dataset.renderer=reduced.matches?'stills':'video';if(reduced.matches)setPlaying(false);wake();});
buildMap();set('walk-total',timecode(Math.round(total)));
const aliases={zieview:'safety',ziewobserver:'observer',ziewprint:'print'};
const requested=chosen.get('chapter');
const initial=brief?route.findIndex(s=>s.id===(aliases[requested?.toLowerCase()]||requested||referenceMap[sourceId])):0;
select(initial>=0?initial:Math.max(0,route.findIndex(s=>s.id==='systems')),0,true,false);
if(brief){
  $('walk-desk')?.addEventListener('click',()=>{
    setPlaying(false);document.documentElement.classList.remove('direct-chapter');
    const u=new URL(location.href);u.search='';u.hash='brief-desk';history.replaceState(null,'',u);
    requestAnimationFrame(()=>$('brief-desk').scrollIntoView({behavior:'instant'}));
  });
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[data-open-chapter]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    const n=route.findIndex(s=>s.id===a.dataset.openChapter);if(n<0)return;
    e.preventDefault();document.documentElement.classList.add('direct-chapter');
    select(n,0,true,true);ensureWorld();
    if(a.dataset.speak==='true'&&!voiceOn)$('listen-start').click();else setPlaying(true);
    requestAnimationFrame(()=>{stage.scrollIntoView({behavior:'instant'});$('walk-title').focus({preventScroll:true});});
  });
  ensureWorld();
}else if(!location.hash||location.hash==='#walkthrough')ensureWorld();
if(brief&&sourceId&&Object.hasOwn(referenceMap,sourceId)){
  fetch('./references.json').then(r=>r.json()).then(data=>{
    if(!data[sourceId]||current().id!==referenceMap[sourceId])return;
    const box=$('walk-reference-note');box.hidden=false;box.querySelector('strong').textContent=data[sourceId][0];
    box.querySelector('p').textContent=data[sourceId][1];box.querySelector('a').href='./reference.html#'+sourceId;
  }).catch(()=>{});
}
