import { mountScene } from './scene3d.js?v=20260924-atrium1';
import { processCatalog } from './ai-briefing/process-catalog.js';
import { createSystemsModel } from './ai-briefing/assets/process-systems.js';
import { createIndustryModel } from './ai-briefing/assets/process-industry.js';
import { createSurveillanceModel } from './ai-briefing/assets/process-surveillance.js';

const topics = [
 ['s06','공통 AI 코어','AI core','서로 다른 데이터를, 하나의 판단 흐름으로','Different signals. One decision flow.',[
  ['Connect inputs','Connect the signals already available on site.','Cameras, vibration sensors and DCS data feed the core.','Existing equipment becomes an input to AI.'],
  ['Deliver data','Move field signals into the analysis core.','Follow the paths from each input to the shared core.','Heterogeneous signals enter a common processing flow.'],
  ['Analyze & reason','Combine the right analysis modules for each problem.','The illuminated layers represent vision, time-series and rule-based processing.','Cognitive Core and Neural Fabric connect perception with domain logic.'],
  ['Connect work','Send decisions to the teams and systems that need them.','The output paths represent inspection, safety and operations.','Domain profiles connect analysis to alerts, checks and business workflows.']
 ]],
 ['s09','비전 검사','Vision inspection','불량의 위치부터, 분류 설비 연동까지','From defect location to physical sorting.',[
  ['Feed products','Every product passes through the inspection station.','The conveyor moves products beneath the camera and lighting.','Consistent capture conditions support reliable inspection.'],
  ['Inspect surfaces','Find deviations in the captured surface image.','Watch the product enter the camera inspection area.','Vision analysis identifies candidates that differ from the normal pattern.'],
  ['Locate defects','Identify both the affected product and the defect location.','A detection box highlights the product with a crack.','The result can be passed to the line controller.'],
  ['Sort & review','Separate the defective product from the production flow.','The pusher moves it aside while normal products continue.','This demonstrates equipment integration; operators can review defect causes.']
 ]],
 ['s10','안전 관제','Safety monitoring','영상 확인을, 근거가 있는 대응으로','From watching video to informed response.',[
  ['Observe zones','Monitor people and equipment across work zones.','Locate the cameras, pipework and safety zones in the scene.','Detection targets are configured for each site.'],
  ['Identify risks','Surface potential PPE, leak or fire events.','Watch for changes around the worker and equipment.','Site-specific criteria define which events need attention.'],
  ['Notify teams','Send the event location and supporting evidence.','Detection boxes and connecting paths identify the affected area.','Configured channels can include speakers and mobile notifications.'],
  ['Verify & act','The responsible operator makes the final decision.','Review the location and video evidence before taking action.','The verification result and response are stored with the event.']
 ]],
 ['s11','예지보전','Predictive maintenance','설비 신호를, 점검의 근거로','Turn equipment signals into maintenance evidence.',[
  ['Learn normal','Learn how equipment behaves during normal operation.','View the motor, rotating shaft, bearing and sensor positions.','Vibration, sound and process data establish the baseline.'],
  ['Detect change','Identify changing patterns near the bearing.','The cutaway and vibration highlight explain an anomaly.','Analyze patterns rather than relying on a single threshold.'],
  ['Prioritize checks','Show where inspection may be needed.','Follow the connection from the sensor to the warning.','Operators review risk and maintenance history together.'],
  ['Plan maintenance','Prepare parts and schedule an on-site inspection.','The scene represents an inspection workflow, not automatic repair.','Condition evidence supports planned maintenance.']
 ]],
 ['s12','재고·물류','Inventory & logistics','이동하면서 읽고, 업무 시스템에 기록','Capture on the move. Record in the workflow.',[
  ['Capture on move','A vehicle-mounted camera passes the storage racks.','Follow the camera view between the forklift and boxes.','Capture conditions are configured for the warehouse.'],
  ['Recognize boxes','Identify boxes within the camera field of view.','Recognized boxes are highlighted one by one.','Recognition produces both count and location information.'],
  ['Verify coverage','Check the results across each storage zone.','The illustrated rack shows the completed recognition state.','Validate missed or duplicate counts against operating rules.'],
  ['Update records','Send the inventory results to business systems.','Count and location data move toward the system endpoint.','MES and ERP integration can reduce repeated data entry.']
 ]],
 ['s14','자가학습 MLOps','Adaptive MLOps','현장의 확인이, 다음 모델의 학습으로','Human feedback becomes the next training cycle.',[
  ['Collect cases','Gather cases verified by the operations team.','Detection clips and operator decisions are collected together.','Detection categories can be configured for the site.'],
  ['Label & train','Turn verified decisions into training data.','Labeled samples move to the training server.','Training is separated from ongoing inference.'],
  ['Validate models','Check a new model before introducing it to operations.','The validation gate represents the acceptance criteria.','Retain the baseline when a candidate does not meet the criteria.'],
  ['Deploy & observe','Apply a validated model and continue observing.','The operational model changes after the validation stage.','New feedback restarts the loop; the baseline supports rollback.']
 ]],
 ['s15','엣지·시스템 연계','Edge & integration','기존 인프라 위에, AI 운영을 연결','Connect AI operations to existing infrastructure.',[
  ['Capture','Receive video at the edge.','The camera sends its stream to a nearby processing node.','ONVIF and RTSP support integration with existing video infrastructure.'],
  ['Analyze locally','Analyze the input near its source.','The edge layer selects the events that need attention.','Local processing connects field equipment with the AI pipeline.'],
  ['Route events','Send selected events into a shared event flow.','The event hub connects distributed sites to operations.','Events carry the context needed for verification and response.'],
  ['Integrate work','Connect events with operational systems.','The output paths represent alerts and business integration.','Interfaces to MES, DCS, SCADA and PLCs are matched to site requirements.']
 ]]
];
const factories = { systems: createSystemsModel, industry: createIndustryModel, surveillance: createSurveillanceModel };
const en = () => document.documentElement.lang === 'en';

export function mountTechnologyStory(host) {
 const architecture=host.closest('.technology-architecture');
 architecture.classList.add('technology-story');
 const oldCopy=architecture.querySelector('.tech-visual-copy');
 const motion=oldCopy?.querySelector('.motion-toggle');
 const stage=document.createElement('div'); stage.className='technology-story-stage';
 host.before(stage); stage.append(host); if(motion)stage.append(motion); oldCopy?.remove();
 const tabs=document.createElement('div'); tabs.className='technology-topics';tabs.setAttribute('role','tablist');
 architecture.before(tabs);
 const explanation=document.createElement('div'); explanation.className='technology-explanation';explanation.id='technology-topic-panel';explanation.setAttribute('role','tabpanel');
 architecture.append(explanation);
 const detail=document.createElement('div'); detail.className='technology-evidence';architecture.after(detail);
 let selected=0,phase=0,scene,disposed=false;
 const buttons=topics.map((topic,i)=>{
  const button=document.createElement('button');button.type='button';button.id=`technology-topic-${i}`;button.setAttribute('role','tab');button.setAttribute('aria-controls',explanation.id);
  button.addEventListener('click',()=>select(i));
  button.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?topics.length-1:(i+(event.key==='ArrowLeft'?-1:1)+topics.length)%topics.length;select(next);buttons[next].focus();
  });tabs.append(button);return button;
 });
 function source(){return processCatalog.find(entry=>entry.id===topics[selected][0]);}
 function steps(){return en()?topics[selected][5]:source().steps;}
 function renderPhase(){
  const data=steps()[phase];
  explanation.dataset.phase=phase;
  explanation.querySelectorAll('[data-phase]').forEach((button,i)=>{button.setAttribute('aria-current',String(i===phase));});
  explanation.querySelector('.technology-step-copy').innerHTML=`<span class="story-overline">${String(phase+1).padStart(2,'0')} / 04 — ${data[0]}</span><h4>${data[1]}</h4><p>${data[2]}</p><p class="technology-step-value">${data[3]}</p>`;
 }
 function render(){
  const topic=topics[selected];
  tabs.setAttribute('aria-label',en()?'Explore our technology':'기술별 3D 설명');
  buttons.forEach((button,i)=>{button.textContent=topics[i][en()?2:1];button.setAttribute('aria-selected',String(i===selected));button.tabIndex=i===selected?0:-1;});
  explanation.setAttribute('aria-labelledby',buttons[selected].id);
  explanation.innerHTML=`<span class="story-overline">BUILT BY ZIEWISE / ${source().tag}</span><h3>${topic[en()?4:3]}</h3><div class="technology-step-buttons" aria-label="${en()?'Process steps':'처리 단계'}">${steps().map((s,i)=>`<button type="button" data-phase="${i}">${String(i+1).padStart(2,'0')}<span>${s[0]}</span></button>`).join('')}</div><div class="technology-step-copy"></div><button type="button" class="story-replay">${en()?'Replay the process ↻':'처음부터 흐름 보기 ↻'}</button>`;
  explanation.querySelectorAll('[data-phase]').forEach((button,i)=>button.addEventListener('click',()=>scene?.setPhase(i)));
  explanation.querySelector('.story-replay').addEventListener('click',()=>scene?.playSteps());
  detail.innerHTML=en()?`<div><span class="story-overline">ENGINEERING IN CONTEXT</span><h3>One core. Practical systems around it.</h3><p>ZiewCore combines perception and reasoning with the connections needed to operate on site. Vision inspection, safety monitoring, equipment maintenance and logistics share the same progression: collect evidence, interpret it, connect it to work and learn from confirmed results.</p></div><div><h4>Explore what we have built</h4><p>Our AI briefing brings these models, operational workflows and product demonstrations together. ZiewLLM demonstrates enterprise knowledge search, evidence-led answers and tool connections within a concept environment.</p><a href="/ai-briefing/" target="_blank" rel="noopener">Explore the AI briefing ↗</a><a href="/ai-briefing/demos/Ziewise_ZiewLLM_3D_Narrated.html" target="_blank" rel="noopener">ZiewLLM · 3D concept demo ↗</a><small>3D scenes illustrate the process. They are not a live feed from customer equipment.</small></div>`:`<div><span class="story-overline">ENGINEERING IN CONTEXT</span><h3>공통 코어 위에 쌓아 온, 현장의 기술.</h3><p>ZiewCore는 인지·추론 기술에 현장 운영을 위한 연결을 더합니다. 비전 검사, 안전 관제, 설비 보전, 재고·물류는 데이터를 모으고, 판단하고, 업무에 연결하고, 확인된 결과로 다시 학습하는 공통 흐름을 기반으로 합니다.</p></div><div><h4>이미 구현한 흐름을 더 깊이 살펴보세요</h4><p>AI 브리핑에는 이 3D 모델과 운영 시나리오, 제품별 시연 자료가 모여 있습니다. ZiewLLM은 사내 지식 검색, 근거를 갖춘 응답과 도구 연결 과정을 콘셉트 환경에서 보여줍니다.</p><a href="/ai-briefing/" target="_blank" rel="noopener">AI 브리핑 전체 보기 ↗</a><a href="/ai-briefing/demos/Ziewise_ZiewLLM_3D_Narrated.html" target="_blank" rel="noopener">ZiewLLM · 3D 콘셉트 시연 ↗</a><small>3D는 작동 과정을 설명하는 시연이며, 고객 설비의 실시간 화면은 아닙니다.</small></div>`;
  host.setAttribute('aria-label',`${topic[en()?2:1]} · ${en()?'3D process demonstration':'3D 작동 과정'}`);
  renderPhase();
 }
 function factory(){const data=source();return T=>factories[data.family](T,data.kind);}
 function select(i){selected=i;phase=0;render();scene?.setProcess(factory());}
 render();
 scene=mountScene(host,{modelFactory:factory(),onPhase:value=>{phase=value;if(!disposed)renderPhase();},onReady:()=>{host.dataset.sceneReady='true';host.querySelector('.scene-loading')?.remove();}});
 const language=()=>render();window.addEventListener('ziewise:language',language);
 return {setPaused:(value,options)=>scene.setPaused(value,options),setLabel(){},dispose(){disposed=true;scene.dispose();window.removeEventListener('ziewise:language',language);}};
}
