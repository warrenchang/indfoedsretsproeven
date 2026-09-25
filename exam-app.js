(function(){
 'use strict';
 const med=globalThis.EXAM_DATA?.blueprint?.exam_type==='medborgerskab',prefix=med?'medborgerskab':'indfoedsret';
 const CURRENT=prefix+'-public-exam-v1',HISTORY=prefix+'-public-exam-history-v1';
 const $=id=>document.getElementById(id),form=$('exam-form');let attempt=null,interval=null,bank,blueprint,storageOK=true;
 const labels={reading:'Læremateriale',current_affairs:'Aktuelle begivenheder',values:'Danske værdier'};
 function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node}
 function storageWarning(){storageOK=false;$('storage-warning').hidden=false;$('storage-warning').textContent='Browseren tillader ikke automatisk lagring. Du kan tage prøven her, men genindlæsning kan miste prøven og dine svar.'}
 function read(key,fallback){try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback}catch(e){storageWarning();return fallback}}
 function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){storageWarning()}}
 function save(){if(attempt)write(CURRENT,attempt)}
 function valid(a){return a&&a.schema===1&&typeof a.id==='string'&&Array.isArray(a.questions)&&a.questions.length===blueprint.total&&new Set(a.questions.map(q=>q.id)).size===blueprint.total&&a.questions.every((q,i)=>q.options&&q.answer in q.options&&q.exam_section===(med?'reading':i<35?'reading':i<40?'current_affairs':'values')&&(!med||q.id.startsWith('MP')))&&a.answers&&typeof a.answers==='object'&&Number.isFinite(a.startedAt)&&Number.isFinite(a.deadlineAt)&&a.deadlineAt-a.startedAt===blueprint.duration_minutes*60*1000}
 function showError(error){$('error').hidden=false;$('error').textContent='Prøven kunne ikke indlæses: '+error.message+'. Prøv at genindlæse siden.'}
 function progress(){const n=attempt.questions.filter(q=>q.options[attempt.answers[q.id]]!==undefined).length;$('answered').textContent=n+' af '+blueprint.total+' besvaret'}
 function history(){const items=read(HISTORY,[]);$('history').replaceChildren();for(const h of Array.isArray(items)?items:[]){$('history').append(el('li',new Date(h.at).toLocaleString('da-DK')+' · '+h.score+'/'+blueprint.total+(med?' · ':' · værdier '+h.values+'/5 · ')+(h.passed?'Beståkrav opfyldt':'Beståkrav ikke opfyldt')))}$('history-section').hidden=!$('history').children.length}
 function recordHistory(){const items=read(HISTORY,[]),list=Array.isArray(items)?items:[];write(HISTORY,[{id:attempt.id,at:attempt.submittedAt,score:attempt.result.correct,values:attempt.result.sections.values?.correct,passed:attempt.result.passed},...list.filter(x=>x.id!==attempt.id)].slice(0,10));history()}
 function render(){
  form.replaceChildren();form.hidden=false;$('instructions').hidden=true;$('exam-status').hidden=false;$('print-exam').hidden=false;
  $('print-exam').textContent=attempt.submittedAt?'Udskriv resultat':'Udskriv prøve';$('new-exam').textContent='Start en ny prøve';$('result').hidden=true;$('submit-exam').hidden=!!attempt.submittedAt;
  let section='';attempt.questions.forEach((q,i)=>{
   if(q.exam_section!==section){section=q.exam_section;const range=med?'1–25':section==='reading'?'1–35':section==='current_affairs'?'36–40':'41–45';form.append(el('h2','Spørgsmål '+range+': '+labels[section].toLocaleLowerCase('da'),'section-title'))}
   const field=el('fieldset');field.id='question-'+(i+1);field.append(el('legend',(i+1)+'. '+q.question));
   for(const [letter,text] of Object.entries(q.options)){
    const label=el('label',undefined,'option'),input=el('input');input.type='radio';input.name=q.id;input.value=letter;input.checked=attempt.answers[q.id]===letter;input.disabled=!!attempt.submittedAt;
    label.append(input,el('span',letter+'. '+text));field.append(label);
   }form.append(field);
  });progress();history();
  if(attempt.submittedAt){attempt.result=MockExam.score(attempt,blueprint);showResult(false)}else startClock();
 }
 function startClock(){clearInterval(interval);tick();if(!attempt.submittedAt)interval=setInterval(tick,500)}
 function tick(){
  if(!attempt||attempt.submittedAt)return;const remaining=MockExam.remainingMs(attempt),seconds=Math.ceil(remaining/1000);
  $('clock').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  $('exam-status').classList.toggle('urgent',remaining<=5*60*1000);
  if(remaining>0&&remaining<=5*60*1000&&$('time-warning').hidden){$('time-warning').hidden=false;$('time-warning').textContent='Der er højst fem minutter tilbage.'}
  if(remaining===0)finish('time');
 }
 function start(){
  if(attempt&&!attempt.submittedAt&&!confirm('Den igangværende prøve afsluttes og rettes, før du starter en ny. Vil du fortsætte?'))return;
  if(attempt&&!attempt.submittedAt)finish('restarted');
  try{
   const seed=crypto.getRandomValues(new Uint32Array(1))[0],now=Date.now(),questions=MockExam.selectExam(bank,blueprint,seed);
   attempt={schema:1,id:now+'-'+seed,seed,startedAt:now,deadlineAt:now+blueprint.duration_minutes*60*1000,bankVersion:bank.version,newsCoverage:bank.news_coverage_through,questions,answers:{},submittedAt:null,submissionReason:null};
   $('error').hidden=true;$('print-exam').textContent='Udskriv prøve';$('time-warning').hidden=true;$('exam-status').classList.remove('urgent');save();render();$('exam-status').scrollIntoView({block:'start'});
  }catch(error){showError(error)}
 }
 function finish(reason){
  if(!attempt||attempt.submittedAt)return;
  if(Date.now()>=attempt.deadlineAt)reason='time';
  clearInterval(interval);attempt.submittedAt=reason==='time'?attempt.deadlineAt:Date.now();attempt.submissionReason=reason;attempt.result=MockExam.score(attempt,blueprint);save();recordHistory();showResult(true);
 }
 function showResult(focus){
  clearInterval(interval);const r=attempt.result;
  $('submit-exam').hidden=true;$('time-warning').hidden=true;$('exam-status').classList.remove('urgent');$('clock').textContent='Afleveret';$('print-exam').textContent='Udskriv resultat';
  form.querySelectorAll('input').forEach(x=>{x.checked=attempt.answers[x.name]===x.value;x.disabled=true});
  const result=$('result');result.replaceChildren(el('h2',r.correct+' / '+blueprint.total+' rigtige'),el('strong',r.passed?'Beståkrav opfyldt i øvelsen':'Beståkrav ikke opfyldt i øvelsen',r.passed?'correct':'incorrect'));
  const scores=el('ul');for(const [section,score] of Object.entries(r.sections))scores.append(el('li',labels[section]+': '+score.correct+' / '+score.total));result.append(scores);
  result.append(el('p',(med?'Krav: mindst 20 rigtige ud af 25.':'Krav: mindst 36 rigtige i alt OG mindst 4 rigtige værdispørgsmål.')+' Ubesvarede: '+r.unanswered+'.'));
  if(attempt.submissionReason==='time')result.append(el('p','Tiden udløb. Prøven blev afleveret automatisk.'));
  result.append(el('p','Dette er en uofficiel øvelse, ikke et prøvebevis eller en garanti for at bestå den rigtige prøve.'+(med?' Læremateriale: august 2026.':' Nyhedsdækning i denne prøve: '+attempt.newsCoverage+'.')));
  const wrong=[];
  attempt.questions.forEach((q,i)=>{
   const field=$('question-'+(i+1)),ok=attempt.answers[q.id]===q.answer;field.querySelector('.feedback')?.remove();
   const feedback=el('div',undefined,'feedback '+(ok?'correct':'incorrect'));
   feedback.append(el('strong',(ok?'✓ Korrekt':'✗ '+(attempt.answers[q.id]?'Forkert':'Ubesvaret'))+' — '+q.answer+'. '+q.options[q.answer]),el('p',q.explanation));
   const source=el('a',q.exam_section==='current_affairs'?(q.source_title||'Nyhedskilde')+' · kontrolleret '+q.verified_at:'Læs afsnit '+q.section+', side '+q.source_pages.join(', '));
   source.href=q.source_url+(q.source_pages.length?'#page='+q.source_pages[0]:'');source.target='_blank';source.rel='noopener';feedback.append(source);field.append(feedback);
   if(!ok){const link=el('a',String(i+1),'review-link');link.href='#question-'+(i+1);wrong.push(link)}
  });
  if(wrong.length){const review=el('p','Gennemgå spørgsmål: ');review.append(...wrong);result.append(review)}
  result.hidden=false;progress();if(focus){result.focus();result.scrollIntoView({block:'start'})}
 }
 form.addEventListener('change',event=>{
  if(!attempt||attempt.submittedAt)return;
  if(MockExam.remainingMs(attempt)===0){finish('time');return}
  const input=event.target;if(input.matches('input[type=radio]')){attempt.answers[input.name]=input.value;save();progress()}
 });
 form.addEventListener('submit',event=>{
  event.preventDefault();if(!attempt||attempt.submittedAt)return;
  if(MockExam.remainingMs(attempt)===0){finish('time');return}
  const blanks=attempt.questions.filter(q=>!attempt.answers[q.id]).length;
  if(confirm(blanks?'Du har '+blanks+' ubesvarede spørgsmål. De tæller som forkerte. Vil du aflevere?':'Vil du aflevere prøven? Du kan ikke ændre dine svar bagefter.'))finish('manual');
 });
 $('new-exam').addEventListener('click',start);$('print-exam').addEventListener('click',()=>window.print());
 $('clear-history').addEventListener('click',()=>{
  if(!confirm('Vil du slette den gemte prøve og prøvehistorikken i denne browser?'))return;
  try{localStorage.removeItem(CURRENT);localStorage.removeItem(HISTORY)}catch(e){storageWarning()}
  clearInterval(interval);attempt=null;form.replaceChildren();form.hidden=true;$('result').hidden=true;$('exam-status').hidden=true;$('instructions').hidden=false;$('print-exam').hidden=true;$('time-warning').hidden=true;$('new-exam').textContent='Start prøve · '+blueprint.duration_minutes+' minutter';history();
 });
 window.addEventListener('storage',event=>{if(event.key===CURRENT){const saved=read(CURRENT,null);if(valid(saved)){attempt=saved;render()}else if(!saved){location.reload()}}});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')tick()});
 try{
  if(!globalThis.EXAM_DATA||!globalThis.MockExam)throw Error('spørgsmålsfilerne mangler');
  bank=EXAM_DATA.bank;blueprint=EXAM_DATA.blueprint;
  $('coverage-note').textContent=med?'Alle spørgsmål bygger på Medborgerskabsprøvens 26 fakta-ark, august 2026. Hver øveprøve trækker ét spørgsmål fra 25 tilfældigt valgte fakta-ark. Denne fordeling er en studieprioritet; den officielle prøve kan fordele emnerne anderledes. Der er ingen separat nyhedsdel.':'Forberedelse til 25. november 2026. Nyhederne i øvelserne er valgt blandt daterede begivenheder fra '+blueprint.news_window_start+' til '+bank.news_coverage_through+'. Senere nyheder er endnu ikke dækket. Alle spørgsmål er fortsat tilgængelige i den fulde bank.';
  $('new-exam').disabled=false;$('new-exam').textContent='Start prøve · '+blueprint.duration_minutes+' minutter';
  const saved=read(CURRENT,null);if(valid(saved)){attempt=saved;render()}else{if(saved){$('storage-warning').hidden=false;$('storage-warning').textContent='Den tidligere gemte prøve kunne ikke læses. Start en ny prøve.'}history()}
 }catch(error){showError(error)}
})();
