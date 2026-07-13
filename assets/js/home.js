(function(){
  'use strict';

  var commandIndex=0;
  var commandItems=[];
  var focusCursor=0;
  var focusTasks=[];
  var commandReturnFocus=null;

  function $(selector,root){ return (root||document).querySelector(selector); }
  function $$(selector,root){ return Array.from((root||document).querySelectorAll(selector)); }
  function addDays(days){ var d=new Date(); d.setDate(d.getDate()+days); return fmtDate(d); }
  function readableDate(){
    return new Intl.DateTimeFormat('zh-CN',{month:'long',day:'numeric',weekday:'long'}).format(new Date());
  }
  function metaText(task){
    var parts=[];
    if(task.plannedDate===todayISO()) parts.push('今天计划');
    else if(task.plannedDate&&compareISO(task.plannedDate,todayISO())<0) parts.push('计划已顺延');
    if(isOverdue(task.ddl,task.status)) parts.push('已逾期 '+daysOverdue(task.ddl,task.status)+' 天');
    else if(task.ddl===todayISO()) parts.push('今天截止');
    else if(task.ddl) parts.push(task.ddl.slice(5).replace('-','/'));
    if(task.estimateMin) parts.push(task.estimateMin+' 分钟');
    if(task.energy) parts.push({low:'低精力',medium:'中等精力',high:'高精力'}[task.energy]);
    return parts.join(' · ')||'还没有安排日期';
  }
  function score(task){
    var value={q1:50,q2:28,q3:16,q4:4}[task.quadrant]||8;
    if(task.status==='doing') value+=28;
    if(isOverdue(task.ddl,task.status)) value+=75;
    if(task.plannedDate===todayISO()) value+=68;
    if(task.plannedDate&&compareISO(task.plannedDate,todayISO())<0) value+=50;
    if(task.ddl===todayISO()) value+=62;
    if(task.ddl&&diffDays(task.ddl)>0&&diffDays(task.ddl)<=3) value+=35-diffDays(task.ddl)*5;
    return value;
  }
  function emptyState(title,subtitle){
    return '<div class="home-empty"><div><i data-lucide="feather"></i><strong>'+esc(title)+'</strong><small>'+esc(subtitle)+'</small></div></div>';
  }
  function renderFocus(task){
    var box=$('#home-focus');
    if(!task){ box.innerHTML=emptyState('今天没有必须完成的事','去捕获一个念头，或安心留白。'); return; }
    var tags=(task.tags||[]).slice(0,2).map(function(tag){ return '<span>#'+esc(tag)+'</span>'; }).join('');
    var canDelay=!(task.ddl&&compareISO(task.ddl,todayISO())<=0);
    box.innerHTML='<div class="focus-content">'
      +'<p class="focus-index">01 / YOUR NEXT MOVE</p>'
      +'<h3 class="focus-title">'+esc(taskName(task))+'</h3>'
      +'<p class="focus-reason">推荐理由 · '+esc(task.status==='doing'?'正在进行':isOverdue(task.ddl,task.status)?'临近承诺':'已列入今天')+'</p>'
      +'<div class="focus-meta"><span>'+esc(Q_LABELS[task.quadrant]||'未分类')+'</span><span>'+esc(metaText(task))+'</span>'+tags+'</div>'
      +'<div class="focus-actions"><button type="button" class="focus-complete" data-task-action="complete" data-task-id="'+esc(task.id)+'"><i data-lucide="check"></i> 完成这一步</button>'
      +(canDelay?'<button type="button" class="focus-edit" data-task-action="later" data-task-id="'+esc(task.id)+'">明天再做</button>':'')
      +'<button type="button" class="focus-edit" data-task-action="edit" data-task-id="'+esc(task.id)+'">查看详情</button></div></div>';
  }
  function renderToday(tasks){
    var box=$('#home-today-list');
    if(!tasks.length){ box.innerHTML=emptyState('节奏很轻','今天没有到期或逾期任务。'); return; }
    box.innerHTML=tasks.map(function(task){
      return '<div class="home-task-row" data-task-action="edit" data-task-id="'+esc(task.id)+'">'
        +'<button type="button" class="home-task-check" data-task-action="complete" data-task-id="'+esc(task.id)+'" aria-label="完成 '+esc(taskName(task))+'"><i data-lucide="check"></i></button>'
        +'<button type="button" class="home-task-copy" data-task-action="edit" data-task-id="'+esc(task.id)+'"><strong>'+esc(taskName(task))+'</strong><small>'+esc(metaText(task))+'</small></button>'
        +'<i data-lucide="chevron-right"></i></div>';
    }).join('');
  }
  function renderArchive(tasks){
    var panel=$('#home-archive-panel');
    panel.hidden=!tasks.length;
    if(!tasks.length) return;
    $('#home-archive-list').innerHTML=tasks.map(function(task){
      return '<div class="archive-row"><span>'+esc(taskName(task)||'未命名任务')+'</span><button type="button" data-task-action="restore" data-task-id="'+esc(task.id)+'">恢复</button></div>';
    }).join('');
  }
  function renderMetrics(all,open,todayTasks){
    var overdue=open.filter(function(task){ return isOverdue(task.ddl,task.status); });
    var monday=new Date(); monday.setHours(0,0,0,0); monday.setDate(monday.getDate()-((monday.getDay()+6)%7));
    var sunday=new Date(monday); sunday.setDate(sunday.getDate()+7);
    var weekDone=all.filter(function(task){ return task.doneAt&&task.doneAt>=monday.getTime()&&task.doneAt<sunday.getTime(); }).length;
    var weekOpen=open.filter(function(task){ var date=taskPlanDate(task); if(!date) return false; var d=new Date(date+'T00:00:00'); return d>=monday&&d<sunday; }).length;
    var rate=weekDone+weekOpen?Math.round(weekDone/(weekDone+weekOpen)*100):0;
    var estimatedTasks=todayTasks.filter(function(task){ return Number(task.estimateMin)>0; });
    var estimated=estimatedTasks.reduce(function(sum,task){ return sum+(Number(task.estimateMin)||0); },0);
    var coverage=todayTasks.length?estimatedTasks.length/todayTasks.length:0;
    $('#metric-today').textContent=todayTasks.length;
    $('#metric-today-note').textContent=todayTasks.length>6?'先选最重要的三件':todayTasks.length?'保持清晰，不必赶':'轻装上阵';
    $('#metric-overdue').textContent=overdue.length;
    $('#metric-week').textContent=rate+'%';
    $('#metric-capacity').textContent=estimated?Math.round(estimated/6)/10+'h':'—';
    $('#metric-capacity-note').textContent=!estimated?'可在详情中估时':coverage<.7?('已估 '+estimatedTasks.length+'/'+todayTasks.length+' 项'):estimated>360?'已经偏满，考虑顺延':'估时覆盖充分';
  }
  function render(){
    if(!$('#panel-home')) return;
    var all=Store.getTasks();
    document.body.classList.toggle('has-task-data',all.length>0);
    var open=all.filter(function(task){ return !task.archived&&task.status!=='done'&&!isLockedTask(task); });
    var todayTasks=open.filter(function(task){ return (task.plannedDate&&compareISO(task.plannedDate,todayISO())<=0)||(task.ddl&&compareISO(task.ddl,todayISO())<=0); }).sort(function(a,b){ return score(b)-score(a); });
    focusTasks=open.filter(function(task){ return task.status==='doing'||todayTasks.indexOf(task)>=0; }).sort(function(a,b){ return score(b)-score(a); });
    if(focusCursor>=focusTasks.length) focusCursor=0;
    var focus=focusTasks[focusCursor];
    $('#focus-next').disabled=focusTasks.length<2;
    var hour=new Date().getHours();
    $('#home-date').textContent=readableDate().toUpperCase();
    $('#home-greeting').textContent=hour<6?'夜深了':hour<12?'早上好':hour<18?'下午好':'晚上好';
    renderMetrics(all,open,todayTasks); renderFocus(focus); renderToday(todayTasks);
    renderArchive(all.filter(function(task){ return task.archived; }).sort(function(a,b){ return (b.archivedAt||0)-(a.archivedAt||0); }));
    var trust=$('#home-trust');
    if(trust&&trust.classList&&!trust.classList.contains('is-error')) $('small',trust).textContent=all.length+' 项任务 · '+Store.getDM().length+' 个里程碑';
    reinitIcons($('#panel-home'));
  }
  function selectDate(offset){
    $('#quick-capture-date').value=addDays(offset);
    $$('.quick-date').forEach(function(button){ button.classList.toggle('active',Number(button.dataset.offset)===offset); });
  }
  function handleTaskAction(button){
    var id=button.dataset.taskId,action=button.dataset.taskAction;
    if(action==='complete'){ Tasks.toggleDone(id,true); render(); }
    if(action==='edit') Tasks.openEdit(id);
    if(action==='later'){
      var laterTasks=Store.getTasks(),later=laterTasks.find(function(item){ return item.id===id; });
      if(later){ later.plannedDate=addDays(1); if(Store.saveTasks(laterTasks)){ showToast('已安排到明天','success'); Tasks.render(); render(); } }
    }
    if(action==='restore'){
      var tasks=Store.getTasks(),task=tasks.find(function(item){ return item.id===id; });
      if(task){ task.archived=false; task.archivedAt=null; if(Store.saveTasks(tasks)){ showToast('任务已恢复','success'); render(); Tasks.render(); } }
    }
  }

  function commandMarkup(){
    var node=document.createElement('div'); node.className='command-center'; node.id='command-center'; node.setAttribute('aria-hidden','true');
    node.innerHTML='<div class="command-box" role="dialog" aria-modal="true" aria-label="命令中心"><div class="command-search"><i data-lucide="search"></i><input id="command-input" placeholder="搜索任务或跳转到视图" autocomplete="off"><kbd>ESC</kbd></div><div class="command-results" id="command-results"></div></div>';
    document.body.appendChild(node); return node;
  }
  function commandData(query){
    var commands=[['home','sun-medium','今天'],['calendar','calendar-days','打开计划'],['tasks','layout-grid','查看四象限'],['daysmatter','sparkles','查看里程碑'],['stats','chart-no-axes-combined','每周回顾'],['timeline','gantt-chart','长期时间线'],['energy','battery-charging','专注建议']];
    var q=(query||'').trim().toLowerCase();
    var nav=commands.filter(function(item){ return !q||item[2].toLowerCase().indexOf(q)>=0; }).map(function(item){ return {type:'nav',id:item[0],icon:item[1],title:item[2],hint:'视图'}; });
    var tasks=Store.getTasks().filter(function(task){ return !task.archived&&!isLockedTask(task)&&(!q||[task.name,task.desc,(task.tags||[]).join(' ')].join(' ').toLowerCase().indexOf(q)>=0); }).slice(0,q?8:3).map(function(task){ return {type:'task',id:task.id,icon:'circle',title:task.name,hint:metaText(task)}; });
    return nav.concat(tasks);
  }
  function renderCommands(){
    commandItems=commandData($('#command-input').value); commandIndex=Math.min(commandIndex,Math.max(0,commandItems.length-1));
    $('#command-results').innerHTML='<p class="command-group-label">COMMANDS & TASKS</p>'+commandItems.map(function(item,index){
      return '<button type="button" class="command-item'+(index===commandIndex?' active':'')+'" data-command-index="'+index+'"><i data-lucide="'+item.icon+'"></i><span>'+esc(item.title)+'</span><small>'+esc(item.hint)+'</small></button>';
    }).join(''); reinitIcons($('#command-center'));
  }
  function openCommand(){ if($('.modal-wrap.open')||Drawer.isOpen()) return; commandReturnFocus=document.activeElement; var node=$('#command-center')||commandMarkup(); node.classList.add('open'); node.setAttribute('aria-hidden','false'); $('#command-input').value=''; commandIndex=0; renderCommands(); setTimeout(function(){ $('#command-input').focus(); },20); }
  function closeCommand(){ var node=$('#command-center'); if(node&&node.classList.contains('open')){ node.classList.remove('open'); node.setAttribute('aria-hidden','true'); if(commandReturnFocus&&commandReturnFocus.focus) commandReturnFocus.focus(); commandReturnFocus=null; } }
  function runCommand(index){
    var item=commandItems[index]; if(!item) return;
    closeCommand();
    if(item.type==='nav') goTo(item.id); else Tasks.openEdit(item.id);
  }
  function goTo(tab){
    if(tab==='vault'){ $('#vault-toggle').click(); return; }
    var button=$('.tab-btn[data-tab="'+tab+'"]'); if(button) button.click();
  }
  function enhanceAccessibility(){
    $$('.tab-btn').forEach(function(button){ button.setAttribute('aria-controls','panel-'+button.dataset.tab); button.tabIndex=button.classList.contains('active')?0:-1; var panel=$('#panel-'+button.dataset.tab); if(panel&&typeof panel.setAttribute==='function'){ panel.setAttribute('role','tabpanel'); panel.setAttribute('aria-label',button.textContent.trim()); } });
    $('.nav-tabs').addEventListener('keydown',function(event){
      if(event.key!=='ArrowDown'&&event.key!=='ArrowUp'&&event.key!=='ArrowLeft'&&event.key!=='ArrowRight') return;
      var tabs=$$('.tab-btn').filter(function(tab){ return getComputedStyle(tab).display!=='none'; }),index=tabs.indexOf(document.activeElement),next=(event.key==='ArrowDown'||event.key==='ArrowRight')?1:-1;
      event.preventDefault(); var target=tabs[(index+next+tabs.length)%tabs.length]; target.click(); target.focus();
    });
    document.addEventListener('keydown',function(event){
      var actionable=event.target.closest&&event.target.closest('.timeline-bar,.field-bubble,.energy-card');
      if(actionable&&(event.key==='Enter'||event.key===' ')){ event.preventDefault(); actionable.click(); }
      var modal=$('.modal-wrap.open')||$('.command-center.open .command-box');
      if(!modal||event.key!=='Tab') return;
      var focusable=$$('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',modal).filter(function(item){ return item.offsetParent!==null; });
      if(!focusable.length) return;
      var first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){ event.preventDefault(); last.focus(); }
      else if(!event.shiftKey&&document.activeElement===last){ event.preventDefault(); first.focus(); }
    });
  }
  function init(){
    selectDate(0); render(); enhanceAccessibility(); commandMarkup(); reinitIcons($('#command-center'));
    $$('.tab-btn').forEach(function(button){ button.addEventListener('click',function(){ $$('.tab-btn').forEach(function(tab){ tab.tabIndex=tab===button?0:-1; }); var prefs=Store.getPrefs(); prefs.activeTab=button.dataset.tab; Store.savePrefs(prefs); if(button.dataset.tab==='home') render(); }); });
    $('#quick-capture').addEventListener('submit',function(event){
      event.preventDefault(); var input=$('#quick-capture-input'),name=input.value.trim(); if(!name){ input.focus(); return; }
      var created=Tasks.createQuickTask({name:name,plannedDate:$('#quick-capture-date').value||todayISO(),quadrant:'q2',energy:'medium'});
      if(created){ input.value=''; render(); }
    });
    $$('.quick-date').forEach(function(button){ button.addEventListener('click',function(){ selectDate(Number(button.dataset.offset)); }); });
    $('#quick-capture-date').addEventListener('change',function(){ $$('.quick-date').forEach(function(button){ button.classList.remove('active'); }); });
    $('#focus-next').addEventListener('click',function(){ if(!focusTasks.length) return; focusCursor=(focusCursor+1)%focusTasks.length; renderFocus(focusTasks[focusCursor]); reinitIcons($('#home-focus')); });
    document.addEventListener('click',function(event){
      var action=event.target.closest('[data-task-action]'); if(action){ event.preventDefault(); event.stopPropagation(); handleTaskAction(action); return; }
      var route=event.target.closest('[data-go-tab]'); if(route){ event.preventDefault(); goTo(route.dataset.goTab); }
      var command=event.target.closest('[data-command-index]'); if(command) runCommand(Number(command.dataset.commandIndex));
      if(event.target.id==='command-center') closeCommand();
    });
    document.addEventListener('keydown',function(event){
      var typing=/INPUT|TEXTAREA|SELECT/.test(event.target.tagName);
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){ event.preventDefault(); openCommand(); return; }
      if(event.key==='/'&&!typing&&!event.ctrlKey&&!event.metaKey){ event.preventDefault(); goTo('home'); $('#quick-capture-input').focus(); }
      if(event.key==='Escape') closeCommand();
    });
    $('#command-input').addEventListener('input',function(){ commandIndex=0; renderCommands(); });
    $('#command-input').addEventListener('keydown',function(event){
      if((event.key==='ArrowDown'||event.key==='ArrowUp')&&commandItems.length){ event.preventDefault(); commandIndex=(commandIndex+(event.key==='ArrowDown'?1:-1)+commandItems.length)%commandItems.length; renderCommands(); }
      if(event.key==='Enter'){ event.preventDefault(); runCommand(commandIndex); }
    });
    window.addEventListener('tdm:data-change',render);
    window.addEventListener('tdm:storage-error',function(){ var trust=$('#home-trust'); trust.classList.add('is-error'); $('strong',trust).textContent='存储异常'; $('small',trust).textContent='请勿新增，先检查备份'; });
    if(Store.hasStorageError()) window.dispatchEvent(new CustomEvent('tdm:storage-error'));
    var savedTab=Store.getPrefs().activeTab, savedButton=savedTab&&$('.tab-btn[data-tab="'+savedTab+'"]');
    if(savedButton&&getComputedStyle(savedButton).display==='none') savedButton=$('.tab-btn[data-tab="home"]');
    if(savedButton) savedButton.click();
  }

  document.addEventListener('DOMContentLoaded',init);
})();
