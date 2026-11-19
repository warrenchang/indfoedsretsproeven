'use strict';
(()=>{
 const data=globalThis.STUDY_GUIDE, cards=[...document.querySelectorAll('.study-card')];
 const search=document.querySelector('#study-search'),group=document.querySelector('#study-group'),status=document.querySelector('#study-status');
 const key='proeveklar-study-reviewed-v1';let reviewed=new Set();
 try{const stored=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(stored))reviewed=new Set(stored.filter(id=>data.some(i=>i.id===id)));}catch{}
 let view=['points','people','timeline'].includes(location.hash.slice(1))?location.hash.slice(1):'points';
 const normalize=s=>s.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 function save(){try{localStorage.setItem(key,JSON.stringify([...reviewed]));}catch{document.querySelector('#storage-note').textContent='Storage is unavailable. Checkmarks work for this visit but cannot be saved.';}}
 function render(){
  document.body.dataset.studyView=view;
  const term=normalize(search.value.trim());let n=0;
  data.forEach((i,ix)=>{let yes=i.view===view&&(!group.value||i.group===group.value)&&(!term||normalize([i.title,i.body,i.dates||'',i.group,i.section,...i.refs.map(r=>r.label)].join(' ')).includes(term))&&(status.value!=='tested'||i.tested)&&(status.value!=='unread'||!reviewed.has(i.id))&&(status.value!=='reviewed'||reviewed.has(i.id));cards[ix].hidden=!yes;if(yes)n++;cards[ix].classList.toggle('is-reviewed',reviewed.has(i.id));cards[ix].querySelector('input').checked=reviewed.has(i.id);});
  document.querySelector('#result-count').textContent=`${n} of ${data.filter(i=>i.view===view).length} entries`;
  document.querySelector('#empty-state').hidden=n!==0;
  document.querySelector('#progress').textContent=`${reviewed.size} of ${data.length} entries reviewed on this device`;
  const bar=document.querySelector('#progress-bar');bar.max=data.length;bar.value=reviewed.size;
 }
 function changeView(){
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
  group.replaceChildren(new Option('All topics',''),...[...new Set(data.filter(i=>i.view===view).map(i=>i.group))].map(g=>new Option(g,g)));
  document.querySelector('#view-heading').textContent={points:'Key points',timeline:'History timeline',people:'People & reigns'}[view];
  document.querySelector('#view-note').textContent={points:'Follow the six chapters, then use the past-exam links to see how facts are tested.',timeline:'Browse historical periods in order. Dates in an entry may add context beyond the specific fact tested.',people:'Birth–death years for other people; Danish reign dates for monarchs. b. = born · c. = approximately. A star does not mean the lifespan was tested.'}[view];render();
 }
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;history.replaceState(null,'','#'+view);changeView();}));
 window.addEventListener('hashchange',()=>{if(['points','people','timeline'].includes(location.hash.slice(1))){view=location.hash.slice(1);changeView();}});
 search.addEventListener('input',render);group.addEventListener('change',render);status.addEventListener('change',render);
 document.querySelector('#clear-filters').addEventListener('click',()=>{search.value='';group.value='';status.value='all';render();});
 document.querySelector('#study-cards').addEventListener('change',e=>{if(e.target.type!=='checkbox')return;e.target.checked?reviewed.add(e.target.value):reviewed.delete(e.target.value);save();render();});
 document.querySelector('#print-guide').addEventListener('click',()=>window.print());changeView();
})();
