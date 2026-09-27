(function(){
 'use strict';
 const id=new URLSearchParams(location.search).get('paper');
 const paper=globalThis.PAST_PAPERS?.papers.find(p=>p.id===id);
 if(!paper){const error=document.getElementById('error');error.hidden=false;error.textContent='Prøven blev ikke fundet. Vælg en prøve fra oversigten over tidligere prøver.';return}
 globalThis.EXAM_DATA={bank:{version:PAST_PAPERS.version,questions:paper.questions},blueprint:{...paper,official_paper:true,paper_id:paper.id,paper_date:paper.date}};
 document.getElementById('instructions').hidden=false;
 const ruleLinks=document.querySelectorAll('.exam-limits a');
 if(paper.exam_type==='medborgerskab'){ruleLinks[0].href='https://danskogproever.dk/borger/medborgerskabsproeve-permanent-ophold/om-medborgerskabsproeven/';ruleLinks[1].href='medborgerskab-info.html'}
 document.title=paper.title+' – tidligere prøve på tid | Prøveklar';
 document.querySelector('h1').textContent='Prøven fra '+paper.title.split(' · ')[1];
 document.querySelector('.exam-heading .eyebrow').textContent=paper.title.split(' · ')[0]+' · Tidligere officiel prøve';
 document.querySelector('.exam-heading .lead').textContent='Tag den oprindelige prøve på '+paper.duration_minutes+' minutter. Spørgsmål og svarmuligheder vises i den officielle rækkefølge.';
 const cards=document.querySelectorAll('.fact-card');
 cards[0].querySelector('strong').textContent=paper.total+' i alt';
 cards[0].querySelector('span').textContent=paper.total===45?'35 læsning · 5 nyheder · 5 værdier':paper.total===40?'35 læsning · 5 nyheder':'Spørgsmål fra lærematerialet';
 cards[1].querySelector('strong').textContent=paper.duration_minutes+' minutter';
 cards[2].querySelector('strong').textContent=paper.pass_total+' af '+paper.total;
 cards[2].querySelector('span').textContent=paper.pass_values?'Og mindst '+paper.pass_values+' af 5 om værdier':'Kravet på den oprindelige prøvedato';
})();
