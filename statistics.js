document.addEventListener('DOMContentLoaded',()=>{
 const $=id=>document.getElementById(id),esc=TM.escapeHtml,all=TM.history(),hist=all.filter(x=>['Practice','Test'].includes(x.type)&&!x.lessonId),s={history:hist,best:Math.max(0,...hist.map(x=>Number(x.wpm)||0)),avg:hist.length?hist.reduce((a,x)=>a+(Number(x.accuracy)||0),0)/hist.length:0,seconds:hist.reduce((a,x)=>a+(Number(x.duration)||0),0)};
 const pad=n=>String(n).padStart(2,'0'),keyOf=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
 const goalMin=()=>Math.max(1,Number(TM.settings().dailyGoal)||15);

 /* ---------- overview cards ---------- */
 const fmtDur=sec=>{sec=Math.round(sec||0);if(sec<60)return `${sec}s`;const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),r=sec%60;return h?`${h}h ${m}m`:`${m}m ${String(r).padStart(2,'0')}s`};
 const n=hist.length,todayStr=keyOf(new Date()),todays=hist.filter(x=>keyOf(new Date(x.date))===todayStr).sort((a,b)=>new Date(a.date)-new Date(b.date));
 const mean=f=>n?hist.reduce((a,x)=>a+(Number(x[f])||0),0)/n:0;
 const dayMean=f=>{const xs=todays.filter(x=>Number.isFinite(Number(x[f]))&&x[f]!==null&&x[f]!==undefined);return xs.length?xs.reduce((a,x)=>a+Number(x[f]),0)/xs.length:null};
 const dayWpm=dayMean('wpm'),dayAcc=dayMean('accuracy'),daySmooth=dayMean('smoothness');
 const sessionScore=x=>{const acc=Math.max(0,Math.min(100,Number(x.accuracy)||0)),speed=Math.max(0,Math.min(100,(Number(x.wpm)||0)/60*100)),smooth=x.smoothness==null?null:Math.max(0,Math.min(100,Number(x.smoothness)||0));return smooth===null?(acc*.55+speed*.45):(acc*.4+speed*.35+smooth*.25)};
 const baseLearning=todays.length?sessionScore({accuracy:dayAcc,wpm:dayWpm,smoothness:daySmooth}):null;
 let learningRate=null,learningNote='Based on speed, accuracy and smoothness';
 if(baseLearning!==null){learningRate=baseLearning;if(todays.length>=2){const split=Math.max(1,Math.floor(todays.length/2)),early=todays.slice(0,split),late=todays.slice(split);if(late.length){const avg=a=>a.reduce((sum,x)=>sum+sessionScore(x),0)/a.length;const delta=avg(late)-avg(early);learningRate=Math.max(0,Math.min(100,baseLearning+delta*.5));learningNote=`Includes ${delta>=0?'improvement':'change'} across ${todays.length} sessions`;}}}
 const set=(id,v)=>{$(id).innerHTML=v};
 set('statAvgSpeed',n?`${Math.round(mean('wpm'))} <em>WPM</em>`:'—');
 set('statAvgAcc',n?`${mean('accuracy').toFixed(1)}<em>%</em>`:'—');
 set('statTopSpeed',n?`${Math.round(s.best)} <em>WPM</em>`:'—');
 set('statTopAcc',n?`${Math.max(...hist.map(x=>Number(x.accuracy)||0)).toFixed(1)}<em>%</em>`:'—');
 set('statTimeToday',fmtDur(todays.reduce((a,x)=>a+(Number(x.duration)||0),0)));
 set('statSessionsToday',todays.length);
 set('statDaySpeed',dayWpm===null?'—':`${Math.round(dayWpm)} <em>WPM</em>`);
 set('statDayAcc',dayAcc===null?'—':`${dayAcc.toFixed(1)}<em>%</em>`);
 set('statDaySmooth',daySmooth===null?'—':`${Math.round(daySmooth)}<em>/100</em>`);
 set('statLearningRate',learningRate===null?'—':`${Math.round(learningRate)}<em>/100</em>`);
 set('learningRateNote',learningNote);
 set('statTimeAll',fmtDur(s.seconds));
 set('statSessionsAll',n);

 /* ---------- interactive all-time key mastery keyboard ---------- */
 const keyRows=[['`','1','2','3','4','5','6','7','8','9','0','-','=','Backspace'],['Tab','q','w','e','r','t','y','u','i','o','p','[',']','\\'],['Caps','a','s','d','f','g','h','j','k','l',';','\'','Enter'],['Shift','z','x','c','v','b','n','m',',','.','/','Shift'],['Space']];
 const keyLabels={'`':'`','Backspace':'⌫','Tab':'Tab','\\':'\\','Caps':'Caps','Enter':'Enter','Shift':'Shift','Space':'Space'};
 const keyNorm=k=>k==='Space'?' ':TM.normalizeKey(k);
 const preview=$('keyPreview'),ks=TM.keyStats();
 const mastery=k=>Math.round(TM.keyPerformance(k).mastery*100);
 // Click accuracy = (clicks - wrong clicks) / clicks x 100. Wrong click = this key pressed while another was expected.
 const clickAcc=k=>{const v=ks[k]||{},t=Number(v.trackedClicks)||0;return t?(t-(Number(v.badClicks)||0))/t*100:null};
 const lifeSpeed=k=>TM.keySpeed(ks[k]||{})||null;
 const cell={
  acc:k=>{const v=ks[k]||{},a=Number(v.attempts)||0;if(!a)return '';const sp=lifeSpeed(k);return `${(Number(v.correct)/a*100).toFixed(0)}%${sp?` · ${Math.round(sp)}`:''}`},
  clicks:k=>{const v=ks[k]||{},c=Number(v.clicks)||0;if(!c)return '';const ca=clickAcc(k);return `${c>=10000?(c/1000).toFixed(0)+'k':c}${ca===null?'':` · ${ca.toFixed(0)}%`}`}
 };
 function renderBoard(el,kind){el.innerHTML=keyRows.map((row,ri)=>`<div class="mastery-row row-${ri}">${row.map(label=>{const k=keyNorm(label),m=k?mastery(k):0,known=!!(k&&ks[k]&&(ks[k].attempts||ks[k].clicks));const alpha=known?(0.12+0.78*m/100):0.045;const style=k?`style="--key-glow:${alpha.toFixed(2)};--mastery:${m}%"`:'';const txt=k&&known?cell[kind](k):'';return `<button type="button" class="mastery-key two-line ${label==='Space'?'space-key':''} ${['Backspace','Tab','Caps','Enter','Shift'].includes(label)?'mod-key':''} ${known?'tracked':''}" data-key="${esc(k||'')}" data-label="${esc(label)}" ${style} aria-label="${esc(keyLabels[label]||label.toUpperCase())}${known?`, ${txt}, ${m} percent mastery`:', not yet measured'}"><span>${esc(keyLabels[label]||label.toUpperCase())}</span>${txt?`<small>${esc(txt)}</small>`:''}</button>`}).join('')}</div>`).join('');}
 function showKey(button){const k=button.dataset.key,label=button.dataset.label,v=ks[k]||{},attempts=Number(v.attempts)||0,correct=Number(v.correct)||0,errors=Number(v.errors)||0,clicks=Number(v.clicks)||0,acc=attempts?correct/attempts*100:null,speed=lifeSpeed(k),ca=clickAcc(k),m=mastery(k);
  preview.innerHTML=`<div class="key-preview-head"><div><small>KEY SELECTED</small><strong>${label===' '?'Space':esc(label.toUpperCase())}</strong></div><div class="mastery-score" style="--score:${m}%"><b>${m}%</b><small>MASTERY</small></div></div><div class="key-stat-grid six"><div><small>ACCURACY</small><b>${acc===null?'—':acc.toFixed(1)+'%'}</b></div><div><small>SPEED</small><b>${speed===null?'—':Math.round(speed)+' WPM'}</b></div><div><small>CLICKS</small><b>${clicks}</b></div><div><small>CLICK ACCURACY</small><b>${ca===null?'—':ca.toFixed(1)+'%'}</b></div><div><small>TESTED</small><b>${attempts}</b></div><div><small>ERRORS</small><b>${errors}</b></div></div>${attempts?`<div class="key-accuracy-bar"><span style="width:${Math.max(0,Math.min(100,acc))}%"></span></div><p class="key-preview-caption">${acc>=95?'Strong control. Keep this key warm.':acc>=80?'Good progress. Aim for clean, repeatable presses.':'Give this key more slow, accurate repetitions.'}</p>`:'<p class="key-preview-caption">No key-specific data yet. Complete a free-practice session or typing test that includes this key.</p>'}`;
 }
 const boards=[['boardAccSpeed','acc'],['boardClicks','clicks']];
 boards.forEach(([id,kind])=>{const el=$(id);renderBoard(el,kind);el.addEventListener('mouseover',e=>{const b=e.target.closest('.mastery-key');if(b)showKey(b)});el.addEventListener('focusin',e=>{const b=e.target.closest('.mastery-key');if(b)showKey(b)});el.addEventListener('click',e=>{const b=e.target.closest('.mastery-key');if(b)showKey(b)});});
 TM.renderLetterBar($('statsLetterBar'),{detail:true});

 /* ---------- merged speed + accuracy chart ---------- */
 const chartEl=$('perfChart');let range=Number((TM.get?TM.get('uiStats',{}):{}).range);if(![0,10,30].includes(range))range=10;
 const chartData=hist.filter(x=>Number(x.wpm)>0);
 function drawChart(){
  const pts=range?chartData.slice(-range):chartData;
  if(!pts.length){chartEl.innerHTML='<div class="empty-state">Complete a free-practice session or typing test to start your chart.</div>';return}
  const W=800,H=290,L=46,R=46,T=30,B=34,iw=W-L-R,ih=H-T-B,n=pts.length;
  const wMax=Math.max(20,Math.ceil(Math.max(...pts.map(p=>Number(p.wpm)||0))/20)*20);
  const accs=pts.map(p=>Number(p.accuracy)||0),aMin=Math.max(0,Math.floor((Math.min(...accs)-5)/10)*10),aMax=100;
  const X=i=>L+(n===1?iw/2:i*iw/(n-1)),yW=v=>T+ih-(v/wMax)*ih,yA=v=>T+ih-((v-aMin)/(aMax-aMin))*ih;
  const wPath=pts.map((p,i)=>`${i?'L':'M'}${X(i).toFixed(1)} ${yW(Number(p.wpm)||0).toFixed(1)}`).join(' ');
  const aPath=pts.map((p,i)=>`${i?'L':'M'}${X(i).toFixed(1)} ${yA(accs[i]).toFixed(1)}`).join(' ');
  const area=`${wPath} L${X(n-1).toFixed(1)} ${T+ih} L${X(0).toFixed(1)} ${T+ih} Z`;
  let grid='';for(let g=0;g<=4;g++){const y=T+ih*g/4,wv=Math.round(wMax*(4-g)/4),av=Math.round(aMin+(aMax-aMin)*(4-g)/4);grid+=`<line class="g-line" x1="${L}" x2="${W-R}" y1="${y}" y2="${y}"/><text class="ax ax-wpm" x="${L-8}" y="${y+3}" text-anchor="end">${wv}</text><text class="ax ax-acc" x="${W-R+8}" y="${y+3}">${av}%</text>`}
  const step=Math.max(1,Math.ceil(n/8));let xl='',lastLbl='';pts.forEach((p,i)=>{if(i%step===0||i===n-1){const d=new Date(p.date),lbl=`${d.getDate()} ${d.toLocaleString([], {month:'short'})}`;if(lbl===lastLbl)return;lastLbl=lbl;xl+=`<text class="ax" x="${X(i)}" y="${H-10}" text-anchor="middle">${d.getDate()} ${d.toLocaleString([], {month:'short'})}</text>`}});
  const dots=pts.map((p,i)=>`<circle class="d-wpm" data-i="${i}" cx="${X(i)}" cy="${yW(Number(p.wpm)||0)}" r="3.5"/><circle class="d-acc" data-i="${i}" cx="${X(i)}" cy="${yA(accs[i])}" r="3.5"/>`).join('');
  chartEl.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Speed and accuracy over recent sessions"><defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a3e635" stop-opacity=".28"/><stop offset="1" stop-color="#a3e635" stop-opacity="0"/></linearGradient></defs>${grid}<text class="ax-title ax-wpm" x="${L-8}" y="${T-16}" text-anchor="end">WPM</text><text class="ax-title ax-acc" x="${W-R+8}" y="${T-16}">ACC</text><path d="${area}" fill="url(#wg)"/><path class="l-wpm" d="${wPath}"/><path class="l-acc" d="${aPath}"/>${dots}${xl}<line class="guide" id="chartGuide" y1="${T}" y2="${T+ih}" x1="0" x2="0" style="display:none"/><rect id="chartHit" x="${L}" y="${T}" width="${iw}" height="${ih}" fill="transparent"/></svg><div class="chart-tip" id="chartTip" style="display:none"></div>`;
  const svg=chartEl.querySelector('svg'),tip=$('chartTip'),guide=$('chartGuide');
  function show(clientX){
   const r=svg.getBoundingClientRect(),vx=(clientX-r.left)/r.width*W;
   let i=n===1?0:Math.round((vx-L)/iw*(n-1));i=Math.max(0,Math.min(n-1,i));
   const p=pts[i],px=X(i)/W*r.width;
   guide.setAttribute('x1',X(i));guide.setAttribute('x2',X(i));guide.style.display='';
   chartEl.querySelectorAll('circle').forEach(c=>c.classList.toggle('on',Number(c.dataset.i)===i));
   const d=new Date(p.date);
   tip.innerHTML=`<b>${d.toLocaleDateString([], {day:'numeric',month:'short',year:'numeric'})} · ${d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</b><span>${esc(p.type||'Practice')}${p.title?` · ${esc(p.title)}`:''}</span><div><i class="dot dot-wpm"></i>${Math.round(p.wpm)} WPM</div><div><i class="dot dot-acc"></i>${Number(p.accuracy||0).toFixed(1)}% accuracy</div>`;
   tip.style.display='block';const tw=tip.offsetWidth;tip.style.left=Math.max(4,Math.min(r.width-tw-4,px-tw/2))+'px';
  }
  const hit=$('chartHit');
  hit.addEventListener('mousemove',e=>show(e.clientX));
  hit.addEventListener('touchstart',e=>show(e.touches[0].clientX),{passive:true});
  hit.addEventListener('touchmove',e=>show(e.touches[0].clientX),{passive:true});
  const hide=()=>{tip.style.display='none';guide.style.display='none';chartEl.querySelectorAll('circle.on').forEach(c=>c.classList.remove('on'))};
  hit.addEventListener('mouseleave',hide);
 }
 $('chartRange').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;range=Number(b.dataset.range);TM.save('uiStats',{range});document.querySelectorAll('#chartRange button').forEach(x=>x.classList.toggle('active',x===b));drawChart()});
 document.querySelectorAll('#chartRange button').forEach(x=>x.classList.toggle('active',Number(x.dataset.range)===range));
 drawChart();

 /* ---------- calendar ---------- */
 const byDay={};hist.forEach(x=>{const k=keyOf(new Date(x.date));(byDay[k]=byDay[k]||[]).push(x)});
 function dayInfo(k){
  const ss=byDay[k]||[],sec=ss.reduce((a,x)=>a+(Number(x.duration)||0),0),wp=ss.filter(x=>Number(x.wpm)>0);
  const types={};ss.forEach(x=>{const t=x.type||'Practice';types[t]=(types[t]||0)+1});
  return {ss,sec,count:ss.length,avgWpm:wp.length?Math.round(wp.reduce((a,x)=>a+x.wpm,0)/wp.length):0,bestWpm:wp.length?Math.round(Math.max(...wp.map(x=>x.wpm))):0,
   acc:ss.length?ss.reduce((a,x)=>a+(Number(x.accuracy)||0),0)/ss.length:0,errors:ss.reduce((a,x)=>a+(Number(x.errors)||0),0),types,
   frac:sec/(goalMin()*60)};
 }
 const fmtTime=sec=>{sec=Math.round(sec);if(sec<60)return `${sec}s`;const m=Math.floor(sec/60),r=sec%60;return r&&m<10?`${m}m ${r}s`:`${m} min`};
 const today=new Date(),todayKey=keyOf(today);let view=new Date(today.getFullYear(),today.getMonth(),1);
 const tipEl=document.createElement('div');tipEl.className='day-tip';tipEl.style.display='none';document.body.appendChild(tipEl);let pinned=null;
 const bg=f=>f<=0?'':`rgba(163,230,53,${(0.14+0.78*Math.min(1,f)).toFixed(2)})`;

 function streak(){let d=new Date(today),c=0;if(dayInfo(keyOf(d)).frac<1)d.setDate(d.getDate()-1);while(dayInfo(keyOf(d)).frac>=1){c++;d.setDate(d.getDate()-1)}return c}
 function renderCal(){
  const y=view.getFullYear(),m=view.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),lead=(first.getDay()+6)%7;
  $('calTitle').textContent=first.toLocaleDateString([], {month:'long',year:'numeric'});
  let html='',active=0,met=0,secTotal=0;
  for(let i=0;i<lead;i++)html+='<span class="cal-day empty"></span>';
  for(let d=1;d<=days;d++){
   const dt=new Date(y,m,d),k=keyOf(dt),info=dayInfo(k),future=dt>today&&k!==todayKey;
   if(info.count){active++;secTotal+=info.sec;if(info.frac>=1)met++}
   const cls=['cal-day',k===todayKey?'today':'',future?'future':'',info.frac>=1?'met':'',info.count?'has':''].join(' ');
   html+=`<button type="button" class="${cls}" data-day="${k}" ${bg(info.frac)?`style="background:${bg(info.frac)}"`:''} aria-label="${dt.toDateString()}: ${info.count?fmtTime(info.sec)+' practiced':'no practice'}"><span class="n">${d}</span>${info.frac>=1?'<span class="chk">✓</span>':''}</button>`;
  }
  $('calGrid').innerHTML=html;
  $('calActive').textContent=active;$('calGoalDays').textContent=met;$('calTime').textContent=fmtTime(secTotal)||'0 min';
  const st=streak();$('calStreak').textContent=`${st} day${st===1?'':'s'}`;
  $('calNext').disabled=(y===today.getFullYear()&&m===today.getMonth());
  hideTip();
 }
 function tipHtml(k){
  const [yy,mm,dd]=k.split('-').map(Number),dt=new Date(yy,mm-1,dd),info=dayInfo(k),pct=Math.round(info.frac*100),g=goalMin();
  const head=`<div class="tip-date">${dt.toLocaleDateString([], {weekday:'long',day:'numeric',month:'long',year:'numeric'})}${k===todayKey?' <em>Today</em>':''}</div>`;
  const goal=`<div class="tip-goal"><span>${fmtTime(info.sec)||'0 min'} of ${g} min goal</span><b>${pct}%${info.frac>=1?' ✓':''}</b></div><div class="tip-bar"><span style="width:${Math.min(100,pct)}%"></span></div>`;
  if(!info.count)return head+goal+'<p class="tip-empty">No practice recorded this day.</p>';
  const chips=Object.entries(info.types).map(([t,c])=>`<span class="tip-chip">${esc(t)} × ${c}</span>`).join('');
  return head+goal+`<div class="tip-grid"><div><small>SESSIONS</small><b>${info.count}</b></div><div><small>AVG WPM</small><b>${info.avgWpm||'—'}</b></div><div><small>BEST WPM</small><b>${info.bestWpm||'—'}</b></div><div><small>ACCURACY</small><b>${info.acc.toFixed(1)}%</b></div><div><small>ERRORS</small><b>${info.errors}</b></div><div><small>TIME</small><b>${fmtTime(info.sec)}</b></div></div><div class="tip-chips">${chips}</div>`;
 }
 function showTip(cell){
  tipEl.innerHTML=tipHtml(cell.dataset.day);tipEl.style.display='block';
  const r=cell.getBoundingClientRect(),tw=tipEl.offsetWidth,th=tipEl.offsetHeight;
  let left=r.left+r.width/2-tw/2;left=Math.max(8,Math.min(window.innerWidth-tw-8,left));
  let top=r.top-th-10;if(top<8)top=r.bottom+10;
  tipEl.style.left=left+'px';tipEl.style.top=top+'px';
 }
 function hideTip(){tipEl.style.display='none';pinned=null}
 const grid=$('calGrid');
 grid.addEventListener('mouseover',e=>{const c=e.target.closest('.cal-day[data-day]');if(c&&!pinned)showTip(c)});
 grid.addEventListener('mouseout',e=>{const c=e.target.closest('.cal-day[data-day]');if(c&&!pinned&&!c.contains(e.relatedTarget))tipEl.style.display='none'});
 grid.addEventListener('focusin',e=>{const c=e.target.closest('.cal-day[data-day]');if(c)showTip(c)});
 grid.addEventListener('focusout',()=>{if(!pinned)tipEl.style.display='none'});
 grid.addEventListener('click',e=>{const c=e.target.closest('.cal-day[data-day]');if(!c)return;if(pinned===c.dataset.day){hideTip()}else{pinned=c.dataset.day;showTip(c)}e.stopPropagation()});
 document.addEventListener('click',e=>{if(pinned&&!tipEl.contains(e.target))hideTip()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTip()});
 window.addEventListener('scroll',()=>{if(tipEl.style.display!=='none')hideTip()},{passive:true});
 $('calPrev').addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);renderCal()});
 $('calNext').addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);renderCal()});
 $('calToday').addEventListener('click',()=>{view=new Date(today.getFullYear(),today.getMonth(),1);renderCal()});
 const gs=$('goalSelect');gs.value=String(goalMin());if(gs.value!==String(goalMin())){const o=document.createElement('option');o.value=o.textContent=goalMin();gs.appendChild(o);gs.value=String(goalMin())}
 gs.addEventListener('change',()=>{TM.save('typeSettings',{...TM.settings(),dailyGoal:Number(gs.value)});renderCal()});
 renderCal();

 /* ---------- export ---------- */
 $('exportStats').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),stats:{history:hist,best:s.best,avg:s.avg,seconds:s.seconds},keyStats:TM.keyStats()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='typepilot-statistics.json';a.click();URL.revokeObjectURL(url);});
});
