import { mountScene } from './scene3d.js?v=20260924-space1';
import { industryScenarios, createApplicationModel } from './industry-scenarios3d.js?v=20260924-atrium1';

function initialize() {
 if(!window.ZiewisePages){window.addEventListener('ziewise:pagechange',initialize,{once:true});return;}
 const english=()=>document.documentElement.lang==='en';
 const diagrams=[
  `<g class="value-flow"><path d="M35 92H115L155 64H235L275 92H365"/><path d="M68 142H132L167 116H233L270 142H334"/><path d="M200 22V48M200 134V164"/></g><g class="value-core"><path d="M150 70L200 45L250 70L200 96Z"/><path d="M150 86L200 112L250 86M150 102L200 128L250 102"/></g><g class="value-points"><circle cx="42" cy="92" r="6"/><circle cx="358" cy="92" r="6"/><circle cx="68" cy="142" r="4"/><circle cx="334" cy="142" r="4"/></g>`,
  `<g class="value-flow"><path d="M35 58H110L147 87M35 128H110L148 105M253 90H320L360 62M255 109H318L360 142"/></g><path class="value-shield" d="M200 27L256 47V90C256 126 232 145 200 159C168 145 144 126 144 90V47Z"/><rect class="value-lock" x="180" y="80" width="40" height="35" rx="5"/><path class="value-lock" d="M187 79V67A13 13 0 0 1 213 67V79M200 93V103"/><path class="value-scan" d="M155 59H245"/>`,
  `<g class="value-flow"><path d="M32 93H103L146 71M254 71L297 93H368M62 143H124L146 119M254 119L286 143H340"/></g><g class="value-layers"><path d="M143 65L200 38L257 65L200 92Z"/><path d="M143 89L200 116L257 89"/><path d="M143 113L200 140L257 113"/></g><g class="value-points"><circle cx="32" cy="93" r="5"/><circle cx="368" cy="93" r="5"/><circle cx="200" cy="65" r="5"/></g>`
 ];
 document.querySelectorAll('.value-card').forEach((card,index)=>{
  const visual=document.createElement('div');visual.className='value-motion';visual.setAttribute('aria-hidden','true');
  visual.innerHTML=`<svg viewBox="0 0 400 184" fill="none" xmlns="http://www.w3.org/2000/svg"><path class="value-grid-lines" d="M0 45H400M0 92H400M0 139H400M65 0V184M132 0V184M200 0V184M267 0V184M335 0V184"/>${diagrams[index]}</svg>`;
  card.prepend(visual);
 });
 document.querySelectorAll('.t-item').forEach((item,i)=>item.style.setProperty('--milestone-index',i));
 const story=document.querySelector('#page-about-story .page-source');
 const storyControl=document.createElement('div');storyControl.className='story-motion-control';storyControl.innerHTML='<span>VALUES IN MOTION / ZIEWISE MILESTONES</span><button class="motion-toggle" type="button" aria-pressed="false"><span></span> Ⅱ</button>';story?.prepend(storyControl);

 const kinds=['vision','energy','commerce','office','print','observer'];
 const cards=[...document.querySelectorAll('.solution-card')];
 const applications=[...document.querySelectorAll('.uc-card')];
 const cases=[...document.querySelectorAll('.industry-card')];
 const views={
  details:{items:cards,kinds,selected:0,anchor:document.querySelector('.solution-detail-tabs')},
  applications:{items:applications,scenarios:['factory','energy','commerce','finance','healthcare','office'],selected:0,phase:0,anchor:document.querySelector('.usecase-sub')},
  cases:{items:cases,scenarios:['factory','energy','commerce','office','healthcare','public'],selected:0,phase:0,anchor:document.querySelector('.industry-sub')}
 };
 let scene=null,sceneKey='',sceneMode='',active=null,paused=document.documentElement.classList.contains('motion-paused'),manual=false,dialog=false;
 const host=document.createElement('div');host.className='secondary-webgl';host.id='secondary-webgl';host.setAttribute('role','group');
 for(const [key,view]of Object.entries(views)){
  const section=document.createElement('section');section.className='secondary-experience';section.dataset.motionView=key;
  section.innerHTML=`${key==='details'?'':'<div class="secondary-selectors"></div>'}<div class="secondary-stage"><div class="secondary-visual"></div><div class="secondary-copy"><span class="story-overline">${key==='details'?'PRODUCT IN MOTION':'SCENARIO IN MOTION'}</span><h3></h3><p></p><div class="secondary-flow" aria-hidden="true"><span>INPUT</span><i></i><span>AI</span><i></i><span>ACTION</span></div><small></small><button class="motion-toggle" type="button" aria-pressed="false"><span></span> Ⅱ</button></div></div>`;
  view.section=section;view.anchor.after(section);
  if(view.scenarios){
   section.classList.add('industry-experience');
   const flow=section.querySelector('.secondary-flow');
   flow.outerHTML='<div class="industry-steps"></div><div class="industry-step-copy"><span></span><h4></h4><p></p></div><p class="industry-outcome"></p><button class="industry-replay" type="button"></button>';
   for(let i=0;i<4;i++){const button=document.createElement('button');button.type='button';button.dataset.phase=i;button.addEventListener('click',()=>{view.overview=false;scene?.setOverview(false);scene?.setPhase(i);});section.querySelector('.industry-steps').append(button);}
   section.querySelector('.industry-replay').addEventListener('click',()=>scene?.playSteps());
   const sceneCaption=document.createElement('div');sceneCaption.className='industry-scene-caption';section.querySelector('.secondary-visual').append(sceneCaption);
   const state=document.createElement('div');state.className='industry-scene-state';state.innerHTML='<span></span><strong></strong>';section.querySelector('.secondary-visual').append(state);
   const cameraButton=document.createElement('button');cameraButton.type='button';cameraButton.className='industry-view-toggle';cameraButton.addEventListener('click',()=>{view.overview=!view.overview;scene?.setOverview(view.overview);renderPhase(view);});section.querySelector('.secondary-visual').append(cameraButton);
  }
  if(key!=='details')view.items.forEach((item,index)=>{
   const button=document.createElement('button');button.type='button';button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>{view.selected=index;update();});section.querySelector('.secondary-selectors').append(button);
  });
 }
 function renderPhase(view){
  if(!view?.scenarios)return;
  const data=industryScenarios[view.scenarios[view.selected]],steps=data.steps.map(s=>s[english()?'en':'ko']),phase=view.phase||0;
  view.section.dataset.phase=phase;
  view.section.querySelectorAll('.industry-steps button').forEach((button,i)=>{button.textContent=`0${i+1} · ${steps[i][0]}`;button.setAttribute('aria-pressed',String(i===phase));});
  const copy=view.section.querySelector('.industry-step-copy');
  copy.querySelector('span').textContent=`0${phase+1} / 04`;
  copy.querySelector('h4').textContent=steps[phase][1];copy.querySelector('p').textContent=steps[phase][2];
  view.section.querySelector('.industry-scene-caption').textContent=`${data.product} / 0${phase+1} · ${steps[phase][0]}`;
  view.section.querySelector('.industry-scene-state span').textContent=english()?(view.overview?'SITE OVERVIEW':'STEP IN FOCUS'):(view.overview?'전체 현장':'단계별 집중 보기');
  view.section.querySelector('.industry-scene-state strong').textContent=steps[phase][1];
  const cameraButton=view.section.querySelector('.industry-view-toggle');cameraButton.textContent=english()?(view.overview?'Focus on this step':'View the whole site'):(view.overview?'이 단계에 집중':'전체 현장 보기');cameraButton.setAttribute('aria-pressed',String(Boolean(view.overview)));
 }
 function syncMotion(){scene?.setPaused(paused||dialog||!active,{manual});document.querySelectorAll('.secondary-experience .motion-toggle,.story-motion-control .motion-toggle').forEach(button=>{button.setAttribute('aria-pressed',String(paused));button.querySelector('span').textContent=english()?(paused?'Play motion':'Pause motion'):(paused?'모션 재생':'모션 일시정지');button.lastChild.nodeValue=paused?' ▶':' Ⅱ';});}
 function update(){
  const current=window.ZiewisePages.getCurrent();active=current?.page==='solutions'?views[current.view]||null:null;
  for(const [key,view]of Object.entries(views)){
   if(key==='details')view.selected=Math.max(0,view.items.findIndex(item=>!item.hidden));
   const item=view.items[view.selected],title=item.querySelector('h3,h5')?.textContent.trim()||'';
   const data=view.scenarios?industryScenarios[view.scenarios[view.selected]]:null;
   view.section.querySelector('h3').textContent=data?data.title[english()?1:0]:title;
   const description=item.querySelector('p,.differentiator');view.section.querySelector('.secondary-copy>p').textContent=description?.textContent.trim()||'';
   if(data){
    view.section.querySelector('.story-overline').textContent=data.product;
    view.section.querySelector('.secondary-copy>p').textContent=data.context[english()?1:0];
    view.section.querySelector('.industry-outcome').textContent=data.outcome[english()?1:0];
    view.section.querySelector('.industry-replay').textContent=english()?'Replay all four steps ↻':'네 단계 이어서 보기 ↻';
    renderPhase(view);
   }
   view.section.querySelector('small').textContent=data?(english()?'Illustrative workflow · Select a step to replay its action':'활용 시나리오 예시 · 단계를 누르면 해당 동작을 다시 보여줍니다'):(english()?'Illustrative 3D · Auto rotate · Drag to explore':'작동 원리 3D · 자동 회전 · 드래그 가능');
   view.section.querySelectorAll('.secondary-selectors button').forEach((button,i)=>{button.textContent=view.items[i].querySelector('h3,h5')?.textContent.trim();button.setAttribute('aria-pressed',String(i===view.selected));});
   view.items.forEach((card,i)=>card.classList.toggle('scenario-focused',view===active&&i===view.selected));
  }
  if(active){
   const destination=active.section.querySelector('.secondary-visual');if(host.parentElement!==destination)destination.append(host);
   const mode=active.scenarios?'scenario':'product',kind=(active.scenarios||active.kinds)[active.selected],nextKey=`${active.section.dataset.motionView}:${mode}:${kind}`;
   if(sceneMode!==mode){scene?.dispose();scene=null;sceneMode=mode;sceneKey='';}
   if(nextKey!==sceneKey){
    active.phase=0;active.overview=false;sceneKey=nextKey;
    const modelFactory=mode==='scenario'?T=>createApplicationModel(T,kind):null;
    if(!scene)scene=mountScene(host,{kind:mode==='scenario'?'core':kind,modelFactory,onPhase:value=>{if(active?.scenarios){active.phase=value;renderPhase(active);}}});
    else if(modelFactory)scene.setProcess(modelFactory);else scene.setKind(kind);
   }
   const label=active.section.querySelector('h3').textContent+' · '+(english()?'Illustrative 3D workflow. Drag to explore.':'3D 활용 흐름. 드래그로 둘러보기.');
   host.setAttribute('aria-label',label);host.querySelector('canvas')?.setAttribute('aria-label',label);
   const fallback=host.querySelector('.webgl-fallback');
   if(fallback){fallback.querySelector('span').textContent=active.section.querySelector('h3').textContent;fallback.querySelector('small').textContent=english()?'3D is unavailable. Explore the workflow using the steps alongside.':'3D를 사용할 수 없습니다. 단계별 설명으로 활용 흐름을 확인하세요.';}
  }
  syncMotion();
 }
 const motion=event=>{paused=event.detail.paused;manual=event.detail.manual;syncMotion();};
 const dialogChange=event=>{dialog=Boolean(event.detail);syncMotion();};
 window.addEventListener('ziewise:pagechange',update);window.addEventListener('ziewise:language',update);window.addEventListener('ziewise:motion',motion);window.addEventListener('ziewise:dialog',dialogChange);
 window.addEventListener('pagehide',event=>{if(!event.persisted){scene?.dispose();window.removeEventListener('ziewise:pagechange',update);window.removeEventListener('ziewise:language',update);window.removeEventListener('ziewise:motion',motion);window.removeEventListener('ziewise:dialog',dialogChange);}});
 update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>queueMicrotask(initialize),{once:true});else queueMicrotask(initialize);
