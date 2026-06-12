// ============================================================
// ANALYSIS PAGE
// ============================================================

function renderAnalysis(){
  var records=getMonthRecords();
  var expenses=records.filter(function(r){return r.type==='expense'||r.type==='meal'});
  var catMap={};
  expenses.forEach(function(r){catMap[r.category]=(catMap[r.category]||0)+r.amount});
  var categories=Object.keys(catMap);
  var catValues=Object.values(catMap);
  var colors=['#10b981','#ef4444','#f59e0b','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16','#94a3b8'];

  if(categoryChartInstance)categoryChartInstance.destroy();
  var ctx1=$('categoryChart').getContext('2d');
  if(categories.length>0){
    categoryChartInstance=new Chart(ctx1,{type:'doughnut',data:{labels:categories,datasets:[{data:catValues,backgroundColor:colors.slice(0,categories.length),borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:11},padding:12}}}}});
  }else{ctx1.font='14px sans-serif';ctx1.fillStyle='#9ca3af';ctx1.textAlign='center';ctx1.fillText('暂无支出数据',ctx1.canvas.width/2,ctx1.canvas.height/2)}

  var monthlyTrend={};
  var data2=loadData();
  data2.records.forEach(function(r){var mk=getMonthKey(r.date);if(!monthlyTrend[mk])monthlyTrend[mk]={income:0,expense:0};if(r.type==='income'||r.type==='redpacket')monthlyTrend[mk].income+=r.amount;else monthlyTrend[mk].expense+=r.amount});
  var sm=Object.keys(monthlyTrend).sort();
  var tl=sm.map(function(m){var p=m.split('-');return p[0].slice(2)+'/'+p[1]});
  if(trendChartInstance)trendChartInstance.destroy();
  var ctx2=$('trendChart').getContext('2d');
  if(sm.length>0){
    trendChartInstance=new Chart(ctx2,{type:'bar',data:{labels:tl,datasets:[{label:'收入',data:sm.map(function(m){return monthlyTrend[m].income}),backgroundColor:'#10b981',borderRadius:4},{label:'支出',data:sm.map(function(m){return monthlyTrend[m].expense}),backgroundColor:'#ef4444',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:11}}}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,ticks:{callback:function(v){return '¥'+(v/1000).toFixed(0)+'k'}}}}}});
  }else{ctx2.font='14px sans-serif';ctx2.fillStyle='#9ca3af';ctx2.textAlign='center';ctx2.fillText('暂无数据',ctx2.canvas.width/2,ctx2.canvas.height/2)}

  var budget=loadData().monthlyBudget;
  var totalExp=expenses.reduce(function(s,r){return s+r.amount},0);
  var totalBudget=Object.values(budget).reduce(function(s,v){return s+v},0);
  var overspendHtml='';
  if(categories.length===0){overspendHtml='<div style="color:var(--text-secondary);font-size:13px;padding:8px 0">暂无支出数据</div>'}
  else {
    var budgetMap={'餐饮':budget.food,'交通':budget.transport,'购物':budget.shopping,'娱乐':budget.entertainment,'居住':budget.housing,'医疗':budget.medical,'其他':budget.other};
    var sc=categories.sort(function(a,b){return catMap[b]-catMap[a]});
    var hasOver=false;
    categories.forEach(function(cat){var limit=budgetMap[cat],actual=catMap[cat];if(limit&&actual>limit){hasOver=true;var over=actual-limit;overspendHtml+='<div class="tip-card danger"><div class="tip-title">⚠️ '+cat+' 超支</div><div class="tip-body">预算 '+formatMoney(limit)+'，实际 '+formatMoney(actual)+'，超出 '+formatMoney(over)+'（'+Math.round(over/limit*100)+'%）</div></div>'}});
    if(!hasOver&&totalExp<=totalBudget)overspendHtml+='<div class="tip-card"><div class="tip-title">✅ 预算控制良好</div><div class="tip-body">总支出 '+formatMoney(totalExp)+'，总预算 '+formatMoney(totalBudget)+'，结余 '+formatMoney(totalBudget-totalExp)+'</div></div>';
    if(sc.length>0){overspendHtml+='<div style="font-size:13px;padding:8px 0"><strong>支出排行：</strong></div>';sc.slice(0,5).forEach(function(cat,i){var pct=Math.round(catMap[cat]/totalExp*100);overspendHtml+='<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px"><span style="width:16px;text-align:right;color:var(--text-secondary)">'+(i+1)+'</span><span style="flex:1">'+cat+'</span><div style="flex:2;height:8px;background:var(--border);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+colors[i]+';border-radius:4px"></div></div><span style="width:70px;text-align:right;font-weight:600">'+formatMoney(catMap[cat])+'</span><span style="width:40px;text-align:right;color:var(--text-secondary)">'+pct+'%</span></div>'})}
  }
  $('overspendAnalysis').innerHTML=overspendHtml;

  var inc=records.filter(function(r){return r.type==='income'||r.type==='redpacket'}).reduce(function(s,r){return s+r.amount},0);
  var suggestionHtml='', reportHtml='';
  if(categories.length===0&&inc===0){suggestionHtml='<div style="color:var(--text-secondary);font-size:13px;padding:8px 0">暂无足够数据</div>'}
  else {
    var sr=inc>0?Math.round((inc-totalExp)/inc*100):0;
    var adv=[], finScore=50, dietScore=0, exScore=0, healthScore=50;
    
    // === FINANCIAL ADVICE ===
    if(sr<10&&inc>0){adv.push({type:'danger',title:'✨ 储蓄紧张',body:'储蓄率仅 '+sr+'%，建议:①记录每笔支出找出漏洞 ②设置“先储蓄后消费”规则 ③减少不必要的订阅和线上消费'});finScore=20}
    else if(sr<20&&inc>0){adv.push({type:'warning',title:'⚠️ 储蓄率偏低',body:'当前储蓄率 '+sr+'%，健康线在30%。建议:①减少外卖/应酬支出 ②每月设定固定储蓄目标 ③利用统一采购降低生活成本'});finScore=35}
    else if(sr>=30&&inc>0){adv.push({type:'good',title:'✅ 储蓄优秀',body:'储蓄率 '+sr+'%，财务健康！可考虑将部分储蓄转为理财或基金投资'});finScore=90}
    else{adv.push({type:'tip',title:'💰 储蓄健康',body:'储蓄率 '+sr+'%，状况良好。建议保持当前消费习惯'});finScore=70}
    
    // Income analysis
    var salaryInc=records.filter(function(r){return r.type==='income'&&r.incomeSub==='salary'}).reduce(function(s,r){return s+r.amount},0);
    var sideInc=records.filter(function(r){return r.type==='income'&&r.incomeSub==='side_income'}).reduce(function(s,r){return s+r.amount},0);
    if(sideInc/inc>0.2){adv.push({type:'tip',title:'📈 副业收入可观',body:'副业收入占总收入 '+Math.round(sideInc/inc*100)+'%，建议评估这部分收入的稳定性，同时留意税务规划'})}
    if(sideInc===0&&inc>budget.food*3){adv.push({type:'tip',title:'💡 收入来源单一',body:'当前仅有工资收入，建议开发副业增加收入来源，提升财务韧性'})}
    
    // Category analysis
    var topCat=sc[0], topAmt=catMap[topCat];
    var pctTot=function(c){return catMap[c]?Math.round(catMap[c]/totalExp*100):0};
    if(catMap['餐饮']>budget.food){adv.push({type:'warning',title:'⚠️ 餐饮支出超支',body:'餐饮花了 '+formatMoney(catMap['餐饮'])+'（超预算 '+Math.round((catMap['餐饮']-budget.food)/budget.food*100)+'%）。建议:①自带午餐每周节省级200-400元 ②减少外卖次数 ③配合饮食健康记录系统统筹料理'})}
    else if(catMap['餐饮']>budget.food*0.7){adv.push({type:'tip',title:'💡 餐饮支出处于预警线',body:'餐饮支出 '+formatMoney(catMap['餐饮'])+'，已达预算的 '+pctTot('餐饮')+'%。接下来一周建议自己做饭节省支出'})}
    if(catMap['购物']>budget.shopping){adv.push({type:'warning',title:'⚠️ 购物支出超支',body:'购物花了 '+formatMoney(catMap['购物'])+'。建议:①购物前列清单 ②规避夜间线上购物 ③不必要的商品等待 7 天再决定'})}
    if(catMap['交通']>budget.transport*0.8){adv.push({type:'tip',title:'💡 交通成本提示',body:'这个月交通花了 '+formatMoney(catMap['交通'])+'。建议统计公交 vs 打车次数，较远距离可考虑共享单车替代'})}
    var lr=records.filter(function(r){return r.type==='loan'}).reduce(function(s,r){return s+r.amount},0);
    if(lr/inc>0.3){adv.push({type:'danger',title:'✨ 借贷压力较大',body:'借贷还款 '+formatMoney(lr)+'，占收入 '+Math.round(lr/inc*100)+'%。建议:①制定借款清偿计划 ②先还高息贷款 ③暂停使用花呗/信用卡分期'})}
    else if(lr>0){adv.push({type:'warning',title:'⚠️ 借贷提示',body:'本月借贷还款 '+formatMoney(lr)+'，占收入 '+Math.round(lr/inc*100)+'%。建议控制借贷使用频率，避免过度依赖。'})}
    if(adv.length===0){adv.push({type:'good',title:'✅ 财务状况良好',body:'本月各项支出均在预算内，储蓄率良好，请保持当前的理财习惯。'})}

    // === DIET ADVICE ===
    var mealRecs=getMonthRecords().filter(function(r){return r.type==='meal'});
    if(mealRecs.length>0){
      var avgN=Math.round(mealRecs.reduce(function(s,r){return s+(r.mealDetails?r.mealDetails.nutrition:5)},0)/mealRecs.length);
      dietScore=avgN*10;
      var vitC={none:0,low:0,medium:0,high:0}, volC={less:0,normal:0,more:0};
      mealRecs.forEach(function(r){if(r.mealDetails){vitC[r.mealDetails.vitamins]=(vitC[r.mealDetails.vitamins]||0)+1;volC[r.mealDetails.volume]=(volC[r.mealDetails.volume]||0)+1}});
      if(avgN<=4){adv.push({type:'danger',title:'✨ 饮食健康警报',body:'饮食营养评分仅 '+avgN+'/10。建议:①每餐必有蔬菜 ②减少油炸高糖食物 ③每天保证鸡蛋/牛奶/豆制品其中一种'})}
      else if(avgN<=6){adv.push({type:'warning',title:'⚠️ 饮食健康升级空间',body:'饮食营养评分 '+avgN+'/10。建议:①增加蔬菜比例 ②每天一份水果 ③替换精细碳水为杂粮米饭'})}
      else{adv.push({type:'good',title:'✅ 饮食健康良好',body:'饮食营养评分 '+avgN+'/10，请保持当前的饮食习惯。注意每天保证1.5-2L喝水摄入。'})}
      if(vitC.none+vitC.low>vitC.high+vitC.medium){adv.push({type:'warning',title:'⚠️ 维生素摄入不足',body:'多次饮食维生素摄入偏少。建议:①早餐加一份水果 ②午餐配绿叶蔬菜 ③可选择维生素补充剂作为偶尔补充'})}
      if(volC.more>volC.normal*0.5){adv.push({type:'tip',title:'💡 食量提示',body:'近期食量偏多，建议控制食物分量，细嚼慢咽，偶尔实施间歇性断食帮助5+2 轻断食'})}
    }

    // === EXERCISE ADVICE ===
    var exData=loadData();
    var exRecs=exData.exerciseRecords||[];
    if(exRecs.length>0){
      var totalMin=0,exTypes={},exDays={};
      exRecs.forEach(function(r){var mk=getMonthKey(r.date);if(mk===getMonthKey(currentMonth)){totalMin+=r.duration;exTypes[r.type]=(exTypes[r.type]||0)+r.duration;exDays[r.date]=true}});
      var exDaysCount=Object.keys(exDays).length;
      exScore=Math.min(100,Math.round(totalMin/1.5));
      var whoRec=150;
      if(totalMin>=whoRec){adv.push({type:'good',title:'✅ 运动达标',body:'本月运动'+totalMin+'分钟，达到WHO推荐的每周至少150分钟中等运动。建议保持并增加力量训练更好。'});exScore=Math.min(100,exScore+10)}
      else{var gap=whoRec-totalMin;var weeks=Math.ceil((new Date().getTime()-new Date(currentMonth.getFullYear(),currentMonth.getMonth(),1).getTime())/(7*24*60*60*1000))||1;var weeklyAvg=Math.round(totalMin/weeks);adv.push({type:'warning',title:'⚠️ 运动不足',body:'本月运动'+totalMin+'分钟（平均每周'+weeklyAvg+'分钟），未达到WHO建议的每周150分钟。建议:①每天散步15分钟开始 ②周末增加一次户外运动(爬山/自行车) ③配合八段锦/伸展提升灵活性'})}
      var typeCount=Object.keys(exTypes).length;
      if(typeCount>=3){adv.push({type:'tip',title:'💡 运动多样性好评',body:'本月尝试了'+typeCount+'种运动方式，运动多样性好！建议结合有氧(跑步/游泳)+无氧(力量/璑璜)+灵活性(拉伸/八段锦)更健康'})}
      if(exDaysCount<10){adv.push({type:'tip',title:'💡 运动频率提示',body:'本月仅'+exDaysCount+'天有运动记录。建议每天至少走路/散步30分钟，全年累计效果显著'})}
    }

    // === HEALTH ADVICE ===
    var hData=loadData();
    var hRecs=hData.healthRecords||[];
    var vis=hRecs.filter(function(r){return r.type==='visit'});
    if(vis.length>0){
      var medCost=vis.reduce(function(s,r){return s+(r.cost||0)},0);
      if(medCost>500){adv.push({type:'warning',title:'⚠️ 医疗支出提示',body:'本月医疗费用'+formatMoney(medCost)+'，建议关注体检指标，平时加强运动和饮食管理预防疾病'})}
    }
    var li=hRecs.filter(function(r){return r.insuranceBalance!=null}).sort(function(a,b){return b.date.localeCompare(a.date)||b.id-a.id});
    if(li.length>0&&li[0].insuranceBalance<2000){adv.push({type:'danger',title:'✨ 医保余额不足',body:'医保余额仅'+formatMoney(li[0].insuranceBalance)+'，建议关注医保政策，合理安排就医计划。可考虑配备商业医疗险作为补充'})}

    // Render suggestions
    adv.forEach(function(a){
      var cls=a.type==='danger'?'danger':a.type==='warning'?'warning':'';
      var icon=a.type==='good'?'✅':a.type==='danger'?'⚠️':'💡';
      suggestionHtml+='<div class="tip-card '+cls+'"><div class="tip-title">'+icon+' '+a.title+'</div><div class="tip-body">'+a.body+'</div></div>';
    });
    
    // Generate comprehensive monthly report
    var totalScore=Math.round((finScore+(dietScore||0)+exScore+healthScore)/4);
    var scoreLevel=totalScore>=75?'good':totalScore>=50?'warning':'danger';
    var scoreText=totalScore>=75?'优秀':totalScore>=50?'还行':'需改善';
    
    // Calculate overall stats
    var incSources=[];
    if(salaryInc>0)incSources.push('工资'+formatMoney(salaryInc));
    if(sideInc>0)incSources.push('副业'+formatMoney(sideInc));
    var reim=records.filter(function(r){return r.type==='income'&&r.incomeSub==='reimbursement'}).reduce(function(s,r){return s+r.amount},0);
    if(reim>0)incSources.push('报销'+formatMoney(reim));
    var bonus=records.filter(function(r){return r.type==='income'&&r.incomeSub==='bonus'}).reduce(function(s,r){return s+r.amount},0);
    if(bonus>0)incSources.push('年终'+formatMoney(bonus));
    
    var mealCount=records.filter(function(r){return r.type==='meal'}).length;
    
    reportHtml='<div style="margin-bottom:8px">'+
      '<div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;background:'+(totalScore>=75?'rgba(16,185,129,0.1)':totalScore>=50?'rgba(245,158,11,0.1)':'rgba(239,68,68,0.1)')+'">'+
      '<div style="font-size:36px;font-weight:700;color:'+(totalScore>=75?'#10b981':totalScore>=50?'#f59e0b':'#ef4444')+'">'+totalScore+'</div>'+
      '<div><div style="font-size:14px;font-weight:600">综合健康评分</div><div style="font-size:12px;color:var(--text-secondary)">'+scoreText+' &middot; '+currentMonth.getFullYear()+'.年'+(currentMonth.getMonth()+1)+'月</div></div></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-top:8px">'+
      '<div style="text-align:center;padding:6px;border-radius:6px;background:rgba(59,130,246,0.06)"><div style="font-size:14px;font-weight:600;color:'+(finScore>=70?'#10b981':finScore>=40?'#f59e0b':'#ef4444')+'">'+finScore+'</div><div style="font-size:10px;color:var(--text-secondary)">财务</div></div>'+
      '<div style="text-align:center;padding:6px;border-radius:6px;background:rgba(245,158,11,0.06)"><div style="font-size:14px;font-weight:600;color:'+((dietScore||0)>=70?'#10b981':(dietScore||0)>=40?'#f59e0b':'#ef4444')+'">'+(dietScore||'--')+'</div><div style="font-size:10px;color:var(--text-secondary)">饮食</div></div>'+
      '<div style="text-align:center;padding:6px;border-radius:6px;background:rgba(16,185,129,0.06)"><div style="font-size:14px;font-weight:600;color:'+(exScore>=70?'#10b981':exScore>=40?'#f59e0b':'#ef4444')+'">'+(exScore||'--')+'</div><div style="font-size:10px;color:var(--text-secondary)">运动</div></div>'+
      '<div style="text-align:center;padding:6px;border-radius:6px;background:rgba(239,68,68,0.06)"><div style="font-size:14px;font-weight:600;color:'+(healthScore>=70?'#10b981':healthScore>=40?'#f59e0b':'#ef4444')+'">'+healthScore+'</div><div style="font-size:10px;color:var(--text-secondary)">健康</div></div>'+
      '</div>';
    
    // Stats summary
    reportHtml+='<div style="font-size:12px;color:var(--text-secondary);padding:8px 0;line-height:1.8;border-top:1px solid var(--border);margin-top:8px">';
    if(incSources.length>0)reportHtml+='💰 收入: '+incSources.join(' | ')+'<br>';
    reportHtml+='💸 支出 '+formatMoney(totalExp)+' | 💵 储蓄率 '+sr+'%';
    if(mealCount>0)reportHtml+=' | 🍲 饮食 '+mealCount+'次';
    if(totalMin>0)reportHtml+=' | 🏃 运动 '+totalMin+'分';
    reportHtml+='</div></div>';
  }
  $('suggestions').innerHTML=suggestionHtml;
  $('monthlyReport').innerHTML=reportHtml;
}

