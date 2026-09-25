/* Pure selection/scoring functions shared by the browser and Node verification. */
(function(root){
 'use strict';
 function rng(seed){let a=seed>>>0;return function(){a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
 function shuffle(items,random){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
 function conflicts(q,selected,blueprint){return blueprint.conflict_pairs.some(pair=>pair.includes(q.id)&&selected.some(x=>x.id!==q.id&&pair.includes(x.id)))}
 function remapOptions(q,random,section){
  const correct=q.options[q.answer],choices=shuffle(Object.values(q.options),random),options={};
  choices.forEach((v,i)=>options['ABC'[i]]=v);
  return {...q,options,answer:'ABC'[choices.indexOf(correct)],exam_section:section};
 }
 function selectMedborgerskab(bank,blueprint,seed){
  const random=rng(seed);
  if(!Array.isArray(blueprint.fact_sheets)||blueprint.fact_sheets.length<blueprint.total)throw Error('Prøvens emner mangler.');
  for(let retry=0;retry<100;retry++){
   const selected=[];
   for(const chapter of shuffle(blueprint.fact_sheets,random).slice(0,blueprint.total)){
    const available=bank.questions.filter(q=>q.chapter===chapter&&q.id.startsWith('MP')&&!conflicts(q,selected,blueprint));
    if(!available.length)break;
    selected.push(available[Math.floor(random()*available.length)]);
   }
   if(selected.length===blueprint.total&&new Set(selected.map(q=>q.id)).size===blueprint.total)return shuffle(selected,random).map(q=>remapOptions(q,random,'reading'));
  }
  throw Error('Der er ikke nok egnede spørgsmål til denne prøve.');
 }
 function selectExam(bank,blueprint,seed){
  if(blueprint.exam_type==='medborgerskab')return selectMedborgerskab(bank,blueprint,seed);
  const random=rng(seed),byid=new Map(bank.questions.map(q=>[q.id,q])),selected=[],news=[],values=[],reading=[];
  const end=bank.news_coverage_through<blueprint.target_exam_date?bank.news_coverage_through:blueprint.target_exam_date;
  const pool=bank.questions.filter(q=>q.exam_domain==='current_affairs'&&q.event_date>=blueprint.news_window_start&&q.event_date<=end);
  const topics=new Set();
  const eventKey=q=>(blueprint.news_event_groups||{})[q.id]||q.topic;
  function pick(candidates){if(!candidates.length)throw Error('Der er ikke nok egnede spørgsmål til denne prøve.');const q=candidates[Math.floor(random()*candidates.length)];selected.push(q);return q}
  function newsCandidates(section){return pool.filter(q=>(!section||q.section===section)&&!selected.some(x=>x.id===q.id)&&!topics.has(eventKey(q))&&!conflicts(q,selected,blueprint))}
  for(const section of shuffle(['CA.politics','CA.society','CA.culture_sport'],random)){
   const q=pick(newsCandidates(section));news.push(q);topics.add(eventKey(q));
  }
  while(news.length<blueprint.news_count){const q=pick(newsCandidates());news.push(q);topics.add(eventKey(q))}
  for(const ids of Object.values(blueprint.values_groups)){
   const q=pick(ids.map(id=>byid.get(id)).filter(q=>q&&!conflicts(q,selected,blueprint)));values.push(q);
  }
  for(const [chapter,n] of Object.entries(blueprint.reading_chapter_quotas)){
   let available=bank.questions.filter(q=>q.exam_domain==='reading'&&q.chapter===Number(chapter)&&!conflicts(q,selected,blueprint));
   const sectionCounts=new Map(),usedTopics=new Set();
   for(let i=0;i<n;i++){
    if(!available.length)throw Error('Et kapitel mangler spørgsmål.');
    const lowest=Math.min(...available.map(q=>sectionCounts.get(q.section)||0));
    const sections=available.filter(q=>(sectionCounts.get(q.section)||0)===lowest);
    const fresh=sections.filter(q=>!usedTopics.has(q.topic));const q=pick(fresh.length?fresh:sections);
    reading.push(q);usedTopics.add(q.topic);sectionCounts.set(q.section,(sectionCounts.get(q.section)||0)+1);
    available=available.filter(x=>x.id!==q.id&&!conflicts(x,selected,blueprint));
   }
  }
  const result=[...shuffle(reading,random).map(q=>remapOptions(q,random,'reading')),...shuffle(news,random).map(q=>remapOptions(q,random,'current_affairs')),...shuffle(values,random).map(q=>remapOptions(q,random,'values'))];
  if(result.length!==blueprint.total||new Set(result.map(q=>q.id)).size!==blueprint.total)throw Error('Ugyldig prøvesammensætning.');
  return result;
 }
 function score(attempt,blueprint){
  const sections=blueprint.exam_type==='medborgerskab'?{reading:{correct:0,total:0}}:{reading:{correct:0,total:0},current_affairs:{correct:0,total:0},values:{correct:0,total:0}};
  let correct=0,unanswered=0;
  for(const q of attempt.questions){const chosen=attempt.answers[q.id],ok=chosen===q.answer;sections[q.exam_section].total++;if(ok){correct++;sections[q.exam_section].correct++}if(!chosen)unanswered++}
  return {correct,total:attempt.questions.length,unanswered,sections,passed:correct>=blueprint.pass_total&&(blueprint.exam_type==='medborgerskab'||sections.values.correct>=blueprint.pass_values)};
 }
 function remainingMs(attempt,now=Date.now()){return Math.max(0,attempt.deadlineAt-now)}
 const api={rng,shuffle,selectExam,score,remainingMs};root.MockExam=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
