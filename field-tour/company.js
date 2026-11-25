(() => {
  const cases=window.ZiewiseCases;
  const $=id=>document.getElementById(id);
  const all=(selector)=>Array.from(document.querySelectorAll(selector));
  const dialog=$('story-dialog');
  let atlasIndex=0;
  function setText(id,value){$(id).textContent=value;}
  function setUse(button,name){button.querySelector('use').setAttribute('href','#i-'+name);}
  function openDetail(kicker,title,intro,rows){
    setText('detail-kicker',kicker);setText('detail-title',title);setText('detail-intro',intro);
    $('detail-steps').replaceChildren(...rows.map(([name,body])=>{
      const li=document.createElement('li'),h=document.createElement('h3'),p=document.createElement('p');
      h.textContent=name;p.textContent=body;li.append(h,p);return li;
    }));dialog.showModal();$('detail-title').focus({preventScroll:true});
  }
  $('close-detail').addEventListener('click',()=>dialog.close());
  $('detail-contact').addEventListener('click',()=>dialog.close());
  function icon(name){
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS(svg.namespaceURI,'use');
    svg.setAttribute('class','icon');svg.setAttribute('aria-hidden','true');use.setAttribute('href','#i-'+name);svg.append(use);return svg;
  }
  function selectCase(index){
    const item=cases[index];atlasIndex=index;
    all('.case-tab').forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
    $('case-detail').setAttribute('aria-labelledby','case-tab-'+item.id);
    const scenes={vision:'safety',office:'finance',print:'print',observer:'observer'};
    $('case-image').src='./field-tour/chapters/views/'+(scenes[item.id]||item.id)+'-0.webp?v=solid1';
    setText('case-tag',item.tag);setText('case-title',item.title);setText('case-about',item.about);
    const frame=document.querySelector('[data-visit="case"]');if(frame)frame.dataset.scene=scenes[item.id]||item.id;
    document.dispatchEvent(new CustomEvent('ziewise:visit',{detail:{kind:'case',id:scenes[item.id]||item.id}}));
  }
  cases.forEach((item,index)=>{
    const tab=document.createElement('button');tab.type='button';tab.id='case-tab-'+item.id;tab.className='case-tab';
    tab.setAttribute('role','tab');tab.setAttribute('aria-controls','case-detail');
    const caption=document.createElement('span'),name=document.createElement('strong'),sub=document.createElement('small'),mark=document.createElement('span');
    name.textContent=item.product;sub.textContent=item.area;mark.className='tab-mark';mark.setAttribute('aria-hidden','true');
    caption.append(name,sub);tab.append(icon(item.icon),caption,mark);tab.addEventListener('click',()=>selectCase(index));$('case-list').append(tab);
  });
  const requestedCase=new URLSearchParams(location.search).get('case');
  selectCase(Math.max(0,cases.findIndex(item=>item.id===requestedCase)));
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
    let active='';for(const id of ['walkthrough','factory','llm','solutions','office','company','contact'])if($(id).getBoundingClientRect().top<=innerHeight*.3)active=id;
    nav.forEach(a=>{const on=a.hash==='#'+active;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    scheduled=false;
  }
  window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(markNav);}},{passive:true});
  markNav();
})();
