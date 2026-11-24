(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const topics=window.BriefTopics, groups=window.BriefGroups, voices=window.BriefVoice;
  const params=new URLSearchParams(location.search);
  const retained=new Set([...Array.from({length:20},(_,i)=>'s'+String(i+1).padStart(2,'0')),'sBEAUTY','sAI','sCUST','sEN','sSEC','sLLM','sPROD','sESG','sSCN','sVALVE','sCOUNT']);
  if(retained.has(params.get('scene'))){location.replace('./presentation.html?'+params.toString());return;}
  const totalSeconds=Math.round(topics.reduce((sum,topic)=>sum+voices[topic.file].duration,0));
  $('brief-duration').textContent=Math.floor(totalSeconds/60)+'분 '+(totalSeconds%60)+'초';
  const audio=$('narration'),seek=$('voice-seek');
  let current=-1,activeGroup=-1,wantsAudio=false,ticket=0;
  // The player follows an explicit play action and then advances on the audio ended event.
  const groupButtons=groups.map((group,index)=>{
    const button=document.createElement('button');button.type='button';button.textContent=group.label;
    button.addEventListener('click',()=>choose(topics.findIndex(t=>t.id===group.ids[0]),wantsAudio,true));
    $('topic-groups').append(button);return button;
  });
  const tabButtons=topics.map((item,index)=>{
    const button=document.createElement('button');button.type='button';button.id='topic-'+item.id;
    button.setAttribute('role','tab');button.setAttribute('aria-controls','topic-stage');button.textContent=item.label;
    button.addEventListener('click',()=>choose(index,wantsAudio,true));
    $('topic-tabs').append(button);return button;
  });
  $('topic-tabs').addEventListener('keydown',event=>{
    const ids=groups[activeGroup].ids,position=ids.indexOf(topics[current].id);
    let next;
    if(event.key==='ArrowRight')next=(position+1)%ids.length;
    else if(event.key==='ArrowLeft')next=(position-1+ids.length)%ids.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=ids.length-1;
    else return;
    event.preventDefault();const index=topics.findIndex(t=>t.id===ids[next]);
    choose(index,wantsAudio,true);tabButtons[index].focus();
  });
  function setPoint(index){
    const spec=topics[current].points[index];
    const name=document.createElement('strong');name.textContent=spec[2]+' · ';
    $('point-caption').replaceChildren(name,document.createTextNode(spec[3]));
    Array.from($('image-points').children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  }
  function renderPoints(topic){
    $('image-points').replaceChildren(...topic.points.map(([x,y,label],i)=>{
      const button=document.createElement('button');button.type='button';button.className='photo-point';button.textContent=String(i+1);
      button.style.left=x+'%';button.style.top=y+'%';button.setAttribute('aria-label',(i+1)+'. '+label+' 설명');
      button.addEventListener('click',()=>setPoint(i));return button;
    }));setPoint(0);
  }
  function clock(seconds){const s=Math.floor(Math.max(0,seconds||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
  function syncAudio(){
    if(current<0)return;
    const info=voices[topics[current].file],length=Number.isFinite(audio.duration)?audio.duration:info.duration;
    const time=Number.isFinite(audio.currentTime)?audio.currentTime:0;
    seek.value=length?String(100*time/length):'0';
    seek.setAttribute('aria-valuetext',clock(time)+' / '+clock(length));
    $('voice-time').textContent=clock(time)+' / '+clock(length);
    const active=info.cues.filter(c=>c.start<=time+.03).pop() || info.cues[0];
    const text=active?.text || info.script;
    if($('voice-caption').textContent!==text)$('voice-caption').textContent=text;
    const playing=!audio.paused && !audio.ended;
    $('voice-toggle').classList.toggle('playing',playing);
    $('voice-toggle').setAttribute('aria-label',playing?'나레이션 일시정지':'나레이션 재생');
  }
  async function play(){
    const id=++ticket;wantsAudio=true;$('voice-feedback').textContent='';
    if(audio.ended)audio.currentTime=0;
    try{await audio.play();}
    catch(error){
      if(id!==ticket||error.name==='AbortError')return;
      wantsAudio=false;$('voice-feedback').textContent='음성을 시작할 수 없습니다. 재생 버튼을 다시 누르거나 아래 대본을 펼쳐주세요.';
    }
    syncAudio();
  }
  function choose(index,continuePlaying,updateUrl){
    if(index<0||index>=topics.length)return;
    const changed=index!==current;
    if(!changed){if(continuePlaying && audio.paused)play();return;}
    ++ticket;audio.pause();wantsAudio=false;current=index;
    const item=topics[index];activeGroup=groups.findIndex(g=>g.ids.includes(item.id));
    groupButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===activeGroup)));
    tabButtons.forEach((b,i)=>{
      b.hidden=!groups[activeGroup].ids.includes(topics[i].id);b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;
    });
    $('topic-stage').setAttribute('aria-labelledby','topic-'+item.id);
    $('topic-image').src=item.img;$('topic-image').alt=item.alt;
    $('topic-tag').textContent=item.tag;$('topic-title').textContent=item.title;
    ['topic-input','topic-process','topic-action'].forEach((id,i)=>{$(id).textContent=item.rows[i];});
    $('original-chapter').href='./presentation.html?scene='+item.original;
    $('voice-transcript').textContent=voices[item.file].script;
    $('voice-feedback').textContent='';
    $('voice-caption').textContent=voices[item.file].cues[0]?.text || voices[item.file].script;
    audio.src='./narration/'+item.file;
    $('korean-captions').src='./narration/captions/'+item.file.replace(/\.mp3$/,'.vtt');
    audio.load();renderPoints(item);syncAudio();
    if(updateUrl && /^(https?:)$/.test(location.protocol)){
      const url=new URL(location.href);url.searchParams.set('chapter',item.id);url.hash='chapters';history.replaceState(null,'',url);
    }
    if(continuePlaying)play();
  }
  // Keep playback just above the live figure, with its transcript and seek control together.
  $('topic-stage').before(document.querySelector('.voice-desk'));
  $('voice-toggle').addEventListener('click',()=>{
    if(audio.paused)play();else{++ticket;wantsAudio=false;audio.pause();syncAudio();}
  });
  $('listen-start').addEventListener('click',()=>{
    $('chapters').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    play();
  });
  seek.addEventListener('input',()=>{
    if(Number.isFinite(audio.duration)){audio.currentTime=audio.duration*Number(seek.value)/100;syncAudio();}
  });
  for(const type of ['timeupdate','loadedmetadata','play','pause','seeked','durationchange'])audio.addEventListener(type,syncAudio);
  audio.addEventListener('ended',()=>{
    if(wantsAudio && $('continuous').checked && current+1<topics.length){choose(current+1,true,true);return;}
    wantsAudio=false;syncAudio();$('voice-feedback').textContent=current===topics.length-1?'마지막 장면의 해설이 끝났습니다.':'이 장면의 해설이 끝났습니다.';
  });
  audio.addEventListener('error',()=>{wantsAudio=false;syncAudio();$('voice-feedback').textContent='음성을 불러오지 못했습니다. 대본으로 내용을 확인할 수 있습니다.';});
  const start=topics.findIndex(t=>t.id===params.get('chapter'));
  choose(start>=0?start:0,false,false);
  const menu=$('brief-mobile-menu'),trigger=$('brief-menu-button');
  function toggle(open){menu.hidden=!open;trigger.setAttribute('aria-expanded',String(open));trigger.setAttribute('aria-label',open?'메뉴 닫기':'메뉴 열기');}
  trigger.addEventListener('click',()=>toggle(menu.hidden));
  document.addEventListener('click',e=>{if(!menu.hidden&&!e.target.closest('.topbar'))toggle(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){toggle(false);trigger.focus();}});
  menu.addEventListener('click',()=>toggle(false));
})();
