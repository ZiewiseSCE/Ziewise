const models={
  local:['사내 서버','권한에 맞는 문서 조각을 사내에서 검색하고 로컬 LLM이 출처를 붙여 답합니다.'],
  gpt:['OpenAI GPT','고객이 허용한 질문과 자료 발췌를 OpenAI API로 보내 GPT가 작성한 답변을 받습니다.'],
  claude:['Anthropic Claude','고객이 허용한 질문과 자료 발췌를 Anthropic API로 보내 Claude가 작성한 답변을 받습니다.'],
  gemini:['Google Gemini','고객이 허용한 질문과 자료 발췌를 Gemini API로 보내 답변을 받습니다.']
};
export function bindProvider(element,select){
  if(!element)return;
  function show(key,activate){const [title,body]=models[key];
    for(const b of element.querySelectorAll('[data-provider]'))b.setAttribute('aria-pressed',String(b.dataset.provider===key));
    element.querySelector('[data-provider-name]').textContent=title;
    element.querySelector('[data-provider-description]').textContent=body;
    if(activate)select(key);
  }
  element.addEventListener('click',e=>{const b=e.target.closest('[data-provider]');if(b&&Object.hasOwn(models,b.dataset.provider))show(b.dataset.provider,true);});
  show('local',false);
}
export function connectionFrame(change,now,reduced){
  if(!change)return null;
  const time=Math.max(0,(now-change.start)/1000);
  return {from:change.from,to:change.to,blend:reduced?1:Math.min(1,time/.9),time:reduced?0:time};
}
