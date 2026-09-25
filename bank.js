(function(){
 'use strict';
 const cards=[...document.querySelectorAll('.question-card')],search=document.getElementById('search'),domain=document.getElementById('domain'),chapter=document.getElementById('chapter'),count=document.getElementById('count'),pager=document.getElementById('pagination'),reset=document.getElementById('reset-filters');
 const pageSize=20,params=new URLSearchParams(location.search);let page=1,matches=[];
 const normalized=s=>s.toLocaleLowerCase('da').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const haystacks=cards.map(c=>normalized(c.querySelector('h2').textContent+' '+c.dataset.topic+' '+c.dataset.id));
 const format=n=>n.toLocaleString('da-DK');
 function valueFromURL(element,key){if(element&&params.has(key)&&[...element.options].some(o=>o.value===params.get(key)))element.value=params.get(key)}
 valueFromURL(domain,'domain');valueFromURL(chapter,'chapter');search.value=params.get('q')||'';
 function updateURL(){const query=new URLSearchParams();if(search.value)query.set('q',search.value);if(domain&&domain.value)query.set('domain',domain.value);if(chapter&&chapter.value)query.set('chapter',chapter.value);try{history.replaceState(null,'',location.pathname+(query.size?'?'+query:'')+location.hash)}catch(e){/* File previews can disallow history changes; filtering still works. */}}
 function showPage(moveFocus=false){
  const pages=Math.max(1,Math.ceil(matches.length/pageSize));page=Math.min(page,pages);
  cards.forEach(c=>{c.hidden=true});matches.slice((page-1)*pageSize,page*pageSize).forEach(c=>{c.hidden=false});
  count.textContent=matches.length?'Viser '+format((page-1)*pageSize+1)+'–'+format(Math.min(page*pageSize,matches.length))+' af '+format(matches.length)+' spørgsmål':'Ingen spørgsmål matcher din søgning';
  count.dataset.total=String(matches.length);document.getElementById('empty-state').hidden=matches.length!==0;
  pager.hidden=matches.length<=pageSize;document.getElementById('page-label').textContent='Side '+page+' af '+pages;
  document.getElementById('previous-page').disabled=page===1;document.getElementById('next-page').disabled=page===pages;
  if(moveFocus){count.focus({preventScroll:true});count.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}
 }
 function filter(){
  page=1;const needle=normalized(search.value.trim());
  matches=cards.filter((c,i)=>(!domain||!domain.value||c.dataset.domain===domain.value)&&(!chapter||!chapter.value||c.dataset.chapter===chapter.value)&&haystacks[i].includes(needle));
  cards.forEach(c=>c.querySelector('details').open=false);updateURL();showPage();
 }
 search.addEventListener('input',filter);
 for(const field of [domain,chapter])if(field)field.addEventListener('change',()=>{if(domain&&chapter){if(field===domain&&domain.value==='current_affairs')chapter.value='';if(field===chapter&&chapter.value&&domain.value==='current_affairs')domain.value=''}filter()});
 reset.addEventListener('click',()=>{search.value='';if(domain)domain.value='';if(chapter)chapter.value='';filter();search.focus()});
 document.getElementById('previous-page').addEventListener('click',()=>{page--;showPage(true)});
 document.getElementById('next-page').addEventListener('click',()=>{page++;showPage(true)});
 filter();
})();
