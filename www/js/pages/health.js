// ============================================================
// HEALTH PAGE
// ============================================================

function renderHealth(){
  var data=loadData();
  var allHealth=data.healthRecords.sort(function(a,b){return b.date.localeCompare(a.date)||b.id-a.id});
  var li=[...data.healthRecords].filter(function(r){return r.insuranceBalance!=null}).sort(function(a,b){return b.date.localeCompare(a.date)||b.id-a.id});
  var lb=li.length>0?li[0].insuranceBalance:null;
  if(lb!==null){
    var balTrend='';
    if(li.length>=2&&li[0].date){balTrend='<div style="font-size:11px;color:var(--text-secondary);margin-top:4px">'+li[0].date+' (+✔)</div>'}
    $('insuranceInfo').innerHTML='<div style="text-align:center;padding:8px"><div style="font-size:32px;font-weight:700;color:var(--primary)">'+formatMoney(lb)+'</div><div style="font-size:13px;color:var(--text-secondary)">'+balTrend+'</div></div>'
  }
  var c=$('healthRecords');var visits=allHealth.filter(function(r){return r.type==='visit'});
  if(visits.length===0){c.innerHTML='<div class="empty-state"><p>暂无就诊记录</p></div>'}
  else{
    var h='<div class="card" style="padding:8px 0">';var ld='';
    visits.forEach(function(r){
      if(r.date!==ld){ld=r.date;h+='<div class="record-date">'+friendlyDate(r.date)+' '+r.date+'</div>'}
      var dept=r.department?'· '+r.department:'';
      h+='<div class="record-item"><div class="record-icon health-icon">🏥</div><div class="record-info"><div class="name">'+(r.hospital||'就诊')+'</div><div class="reason">'+(r.reason||'')+' '+dept+(r.cost?' · 花费'+formatMoney(r.cost):'')+'</div></div><div style="text-align:right"><div style="font-size:12px;color:var(--text-secondary)">'+(r.insuranceBalance!=null?'余额'+formatMoney(r.insuranceBalance):'')+'</div></div><button class="delete-btn" onclick="deleteHealthRecord('+r.id+')">×</button></div>'
    });
    c.innerHTML=h+'</div>';
  }
  renderExercise();
}

function renderExercise(){
  var data=loadData();
  if(!data.exerciseRecords)data.exerciseRecords=[];
  var records=data.exerciseRecords.sort(function(a,b){return b.date.localeCompare(a.date)||b.id-a.id});
  var c=$('exerciseRecords');
  if(records.length===0){c.innerHTML='<div class="empty-state" style="padding:16px"><p>暂无运动记录</p></div>'}
  else{
    var h='<div class="card exercise-card" style="padding:8px 0">';var ld='';
    records.slice(0,20).forEach(function(r){
      if(r.date!==ld){ld=r.date;h+='<div class="record-date">'+friendlyDate(r.date)+' '+r.date+'</div>'}
      h+='<div class="record-item"><div class="record-icon meal-icon">'+getExerciseTypeIcon(r.type)+'</div><div class="record-info"><div class="name">'+r.type+'</div><div class="reason">'+(r.note||'')+'</div></div><div style="text-align:right"><div style="font-weight:600;font-size:14px">'+r.duration+'分</div></div></div>'
    });
    c.innerHTML=h+'</div>';
  }
  // Exercise summary
  var summary=$('exerciseSummary');
  if(records.length===0){summary.innerHTML='<div style="text-align:center;padding:20px;color:var(--text-secondary)">暂无运动数据</div>';return}
  var now=new Date(),y=now.getFullYear(),m=now.getMonth(),wStart=new Date(now);wStart.setDate(now.getDate()-now.getDay());
  var periodFilter=function(records,startDate,endDate){
    return records.filter(function(r){
      var rd=new Date(r.date);
      if(endDate){var ed=new Date(endDate);ed.setDate(ed.getDate()+1);return rd>=new Date(startDate)&&rd<ed}
      return formatDate(rd.toISOString().slice(0,10))>=formatDate(new Date(startDate).toISOString().slice(0,10))
    })
  };
  var thisWeek=periodFilter(records,formatDate(wStart.toISOString().slice(0,10)));
  var thisMonth=periodFilter(records,formatDate(new Date(y,m,1).toISOString().slice(0,10)),formatDate(new Date(y,m+1,0).toISOString().slice(0,10)));
  var thisYear=periodFilter(records,formatDate(new Date(y,0,1).toISOString().slice(0,10)),formatDate(new Date(y,11,31).toISOString().slice(0,10)));
  var sumDur=function(arr){return arr.reduce(function(s,r){return s+r.duration},0)};
  var totalWeek=sumDur(thisWeek),totalMonth=sumDur(thisMonth),totalYear=sumDur(thisYear);
  var weekDays=thisWeek.length,monthDays=thisMonth.length,yearMonths=12;
  var countType=function(arr){var m={};arr.forEach(function(r){m[r.type]=(m[r.type]||0)+r.duration});return m};
  var topType=function(arr){var m=countType(arr);var best='',bestN=0;Object.keys(m).forEach(function(k){if(m[k]>bestN){bestN=m[k];best=k}});return{name:best,time:bestN}};
  var wt=topType(thisWeek),mt=topType(thisMonth);
  var weekAvgDay=7>0?Math.round(totalWeek/7):0;
  var dayCount=thisMonth.length>0?sumDur(thisMonth)/thisMonth.length:0;
  var avgPerSession=records.length>0?Math.round(sumDur(records)/records.length):0;
  var html='<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">'+
    '<div><div style="font-size:20px;font-weight:700;color:var(--primary)">'+totalWeek+'分</div><div style="font-size:11px;color:var(--text-secondary)">本周</div></div>'+
    '<div><div style="font-size:20px;font-weight:700">'+totalMonth+'分</div><div style="font-size:11px;color:var(--text-secondary)">本月</div></div>'+
    '<div><div style="font-size:20px;font-weight:700">'+totalYear+'分</div><div style="font-size:11px;color:var(--text-secondary)">今年</div></div>'+
    '</div>'+
    '<div style="font-size:12px;color:var(--text-secondary);padding:8px 0 0;line-height:1.8">'+
    '本周最多: '+wt.name+' '+wt.time+'分 &middot; 本月最多: '+mt.name+' '+mt.time+'分<br>'+
    '本周平均每天 '+weekAvgDay+'分 &middot; 平均每次 '+avgPerSession+'分'+
    '</div>';
  summary.innerHTML=html;
}

function openExerciseModal(){
  $('exerciseModal').classList.add('open');
  $('exerciseType').value='爬山';$('exerciseDuration').value='';$('exerciseDate').value=new Date().toISOString().slice(0,10);$('exerciseNote').value='';
}

function saveExercise(){
  var type=$('exerciseType').value,dur=parseInt($('exerciseDuration').value),date=$('exerciseDate').value,note=$('exerciseNote').value.trim();
  if(!dur||dur<=0){alert('请输入有效运动时长');return}
  if(!date){alert('请选择日期');return}
  var data=loadData();
  if(!data.exerciseRecords)data.exerciseRecords=[];
  data.exerciseRecords.push({id:Date.now()+Math.random(),type:type,duration:dur,date:date,note:note,createdAt:new Date().toISOString()});
  saveData(data);$('exerciseModal').classList.remove('open');renderAll();
}

function getExerciseTypeIcon(type){return exerciseTypeLabels[type]||'🏃';}

