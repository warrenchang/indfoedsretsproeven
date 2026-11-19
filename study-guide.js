'use strict';
(()=>{
 const data=globalThis.STUDY_GUIDE, cards=[...document.querySelectorAll('.study-card')], ui=globalThis.STUDY_UI;
 const search=document.querySelector('#study-search'),group=document.querySelector('#study-group'),status=document.querySelector('#study-status'),language=document.querySelector('#study-language');
 let lang='da',view=['points','people','timeline'].includes(location.hash.slice(1))?location.hash.slice(1):'points';
 const normalize=s=>s.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const localized=i=>lang==='da'?i.da:i;
 function renderCards(){
  data.forEach((i,ix)=>{
   const t=localized(i),u=ui[lang];
   const refs=i.refs.map(r=>{const label=lang==='da'?r.label.replace('May','maj').replace('June','juni').replace('November','november').replace(' · Q',' · spørgsmål '):r.label;
    const title=r.question.startsWith('Example paper:')?u.example:r.question;
    return `<a href="${escape(r.url)}" title="${escape(title)}">${escape(label)}</a>`;}).join('');
   const heading=[t.dates,t.title].filter(Boolean).map(escape).join(' · ');
   cards[ix].innerHTML=`${i.tested?`<span class="exam-star" title="${escape(u.tested)}" aria-label="${escape(u.tested)}">★</span> `:''}${heading?`<strong>${heading}</strong>${t.body?' — ':''}`:''}${t.html}<details class="entry-sources"><summary>${lang==='da'?'Kilder':'Sources'}</summary><div class="card-sources">${refs}<a href="${escape(i.source)}">${u.reading}</a></div></details>`;

  });
 }
 function render(){
  document.body.dataset.studyView=view;
  const term=normalize(search.value.trim());let n=0;
  data.forEach((i,ix)=>{const t=localized(i);const yes=i.view===view&&(!group.value||i.group===group.value)&&(!term||normalize([t.title,t.body,t.dates||'',t.group,t.section,...i.refs.map(r=>r.label)].join(' ')).includes(term))&&(status.value!=='tested'||i.tested);cards[ix].hidden=!yes;if(yes)n++;});
  document.querySelectorAll('.study-topic').forEach(section=>{
   const t=localized(data[Number(section.dataset.first)]);
   section.hidden=![...section.querySelectorAll('.study-card')].some(card=>!card.hidden);
   section.querySelector('.topic-heading').textContent=t.section||t.group;
   const chapter=section.querySelector('.topic-chapter');if(chapter)chapter.textContent=t.group;
  });
  document.querySelector('#result-count').textContent=ui[lang].count.replace('{n}',n).replace('{total}',data.filter(i=>i.view===view).length);
  document.querySelector('#empty-state').hidden=n!==0;
 }
 function changeView(keepGroup=false){
  const selected=keepGroup?group.value:'';
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
  const groups=[...new Map(data.filter(i=>i.view===view).map(i=>[i.group,localized(i).group])).entries()];
  group.replaceChildren(new Option(ui[lang].allTopics,''),...groups.map(([value,label])=>new Option(label,value)));
  group.value=selected;
  document.querySelector('#view-heading').textContent=ui[lang][view];
  document.querySelector('#view-note').textContent=ui[lang][view+'Note'];render();
 }
 function changeLanguage(){
  lang=language.value;
  document.querySelector('main').lang=lang;
  document.querySelectorAll('[data-i18n]').forEach(e=>{e.textContent=ui[lang][e.dataset.i18n];});
  search.placeholder=ui[lang].placeholder;
  document.querySelector('.view-buttons').setAttribute('aria-label',lang==='da'?'Visning':'Study view');
  renderCards();changeView(true);
 }
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;history.replaceState(null,'','#'+view);changeView();}));
 window.addEventListener('hashchange',()=>{if(['points','people','timeline'].includes(location.hash.slice(1))){view=location.hash.slice(1);changeView();}});
 search.addEventListener('input',render);group.addEventListener('change',render);status.addEventListener('change',render);language.addEventListener('change',changeLanguage);
 document.querySelector('#clear-filters').addEventListener('click',()=>{search.value='';group.value='';status.value='all';render();});
 document.querySelector('#print-guide').addEventListener('click',()=>window.print());
 language.value='da';changeLanguage();
})();
