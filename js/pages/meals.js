// ============================================================
// MEALS PAGE
// ============================================================

function toggleMealSection(slot){
  var body=$(slot+"Body");
  if(!body)return;
  body.style.display=body.style.display==="none"?"block":"none";
}

function renderMeals(){
  var dk=getMealDayKey(currentMealDay);
  var data=loadData();
  var day=getDayMeals(data,dk);
  var dayLabel=isToday(currentMealDay)?'今天':friendlyDate(dk)+' ('+dk+')';
  $('mealDayTitle').textContent=dayLabel;

  // Render each meal slot
  mealSlots.forEach(function(slot){
    var foods=day[slot]||[];
    $(slot+'Count').textContent=foods.length+' 项';
    var body=$(slot+'Body');
    var html='';
    foods.forEach(function(f,idx){
      var fdb=FOOD_DB[f.name];
      var icon=f.icon||(fdb?fdb.icon:'📝');
      var elementsHtml='';
      (f.elements||[]).forEach(function(e){
        var cls=e[1]==='healthy'?'ht-green':e[1]==='unhealthy'?'ht-red':'ht-yellow';
        elementsHtml+='<span class="health-tag '+cls+'">'+e[0]+'</span>';
      });
      html+='<div class="meal-food-item"><div class="food-name"><span class="food-icon">'+icon+'</span>'+f.name+'<span class="food-amount">'+f.amount+'</span></div><div>'+elementsHtml+'<button class="delete-btn" onclick="removeFood(\''+slot+'\','+idx+')" style="font-size:14px;padding:2px 4px;margin-left:4px">×</button></div></div>';
    });

    // Add food row with autocomplete
    html+='<div class="add-food-row"><div class="food-autocomplete" style="flex:1;position:relative">'+
      '<input type="text" id="foodInput-'+slot+'" placeholder="输入食物名称..." oninput="onFoodInput(\''+slot+'\')" onkeydown="if(event.key===\'Enter\')addFood(\''+slot+'\')">'+
      '<div class="autocomplete-items" id="autocomplete-'+slot+'" style="display:none"></div></div>'+
      '<button onclick="addFood(\''+slot+'\')">添加</button></div>';
    body.innerHTML=html;
  });

  // Health analysis
  var analysis=analyzeMealDay(day);
  renderDailyHealth(analysis);
}

function renderDailyHealth(analysis){
  var html='<div class="daily-health">'+
    '<div class="health-metric '+analysis.scoreLevel+'"><div class="hm-value">'+analysis.score+'</div><div class="hm-label">健康评分</div></div>'+
    '<div class="health-metric '+(analysis.hasVeg?'good':'bad')+'"><div class="hm-value">'+(analysis.hasVeg?'✅':'❌')+'</div><div class="hm-label">蔬菜水果</div></div>'+
    '<div class="health-metric '+(analysis.hasProtein?'good':'bad')+'"><div class="hm-value">'+(analysis.hasProtein?'✅':'❌')+'</div><div class="hm-label">蛋白质</div></div>'+
    '<div class="health-metric '+(analysis.hasStaple?'good':'warning')+'"><div class="hm-value">'+(analysis.hasStaple?'✅':'⚠️')+'</div><div class="hm-label">主食</div></div>'+
    '</div>';

  // Food groups summary
  html+='<div style="font-size:13px;padding:4px 0 8px;color:var(--text-secondary)">今日共 '+analysis.totalItems+' 种食物 · '+analysis.usedSlots+' 餐</div>';

  // Warnings
  if(analysis.warnings.length>0){
    html+='<div class="card" style="padding:12px"><div class="card-title">饮食分析</div><ul class="warning-list">';
    analysis.warnings.forEach(function(w){
      var cls=w.text.indexOf('摄入过多')>-1||w.text.indexOf('没有')>-1?'danger':'';
      html+='<li class="tip-card '+cls+'" style="padding:8px;margin-bottom:4px;border-left-width:2px"><span class="wl-icon">'+w.icon+'</span>'+w.text+'</li>';
    });
    html+='</ul></div>';
  } else {
    html+='<div class="tip-card" style="margin-bottom:10px"><div class="tip-title">✅ 饮食均衡</div><div class="tip-body">今天各类营养摄入均衡，继续保持！</div></div>';
  }

  // Score text
  var scoreText=analysis.score>=70?'很好，饮食搭配均衡':analysis.score>=40?'部分营养有缺失，注意补充':'今日饮食结构不太合理，请参考建议调整';
  html+='<div style="font-size:13px;padding:4px 0;color:var(--text-secondary)">综合评分 '+analysis.score+' 分 — '+scoreText+'</div>';

  $('dailyHealthDashboard').innerHTML=html;
}

function analyzeMealDay(day){
  var allFoods=[];
  var counts={};
  mealSlots.forEach(function(slot){
    (day[slot]||[]).forEach(function(f){
      allFoods.push(f);
      // Count elements
      (f.elements||[]).forEach(function(e){
        var ename=e[0],etype=e[1],elevel=e[2];
        if(!counts[ename])counts[ename]={healthy:0,unhealthy:0,neutral:0,count:0};
        if(etype==='healthy')counts[ename].healthy++;
        else if(etype==='unhealthy')counts[ename].unhealthy++;
        else counts[ename].neutral++;
        counts[ename].count++;
      });
    });
  });

  var warnings=[];
  var healthyCount=0,unhealthyCount=0;

  // Analyze each element
  Object.keys(counts).forEach(function(k){
    var c=counts[k];
    var total=c.healthy+c.unhealthy+c.neutral;
    if(c.unhealthy>0&&total>=1){
      unhealthyCount+=c.unhealthy;
      if(k==='咖啡因'){
        if(total>=2)warnings.push({icon:'☕',text:'咖啡因摄入过多 ('+total+'份)，可能影响睡眠质量，建议每天不超过2份'});
        else warnings.push({icon:'☕',text:'咖啡因摄入 '+(total)+'份，在合理范围内'});
      }
      else if(k==='糖分'){
        if(total>=2)warnings.push({icon:'🍬',text:'糖分摄入偏高 ('+total+'份)，建议控制在每天1-2份，过多导致肥胖和血糖波动'});
        else warnings.push({icon:'🍬',text:'糖分摄入 '+(total)+'份，可以接受'});
      }
      else if(k==='茶多酚'){
        if(total>=2)warnings.push({icon:'🍵',text:'茶多酚摄入较多 ('+total+'份)，茶多酚虽好但过量可能影响铁吸收'});
      }
      else if(k==='脂肪'||k==='油炸食品'){
        warnings.push({icon:'🥩',text:'高脂食物摄入 ('+total+'份)，建议搭配蔬菜减少油腻'});
      }
      else if(k==='钠'){
        warnings.push({icon:'🧂',text:'钠摄入偏高 ('+total+'份)，注意减少盐分摄入，预防高血压'});
      }
      else if(k==='致癌物'){
        warnings.push({icon:'⚠️',text:'含致癌物食物 ('+total+'份)，建议少吃烧烤类食物'});
      }
      else if(k==='碳酸'){
        warnings.push({icon:'🥤',text:'碳酸饮料 ('+total+'份)，影响钙吸收和牙齿健康'});
      }
      else if(k==='奶精'){
        warnings.push({icon:'🧋',text:'含奶精饮品 ('+total+'份)，反式脂肪酸对健康不利'});
      }
    }
    if(c.healthy>0){
      healthyCount+=c.healthy;
    }
  });

  // Check food group diversity
  var cats={};
  allFoods.forEach(function(f){cats[f.cat]=true});
  var hasVeg=cats['蔬菜']||cats['水果'];
  var hasProtein=cats['肉类']||cats['蛋类']||cats['豆制品']||cats['海鲜'];
  var hasStaple=cats['主食'];
  var hasFruit=cats['水果'];
  var hasMeat=cats['肉类'];
  var hasDairy=cats['饮品']&&allFoods.some(function(f){return f.name==='牛奶'||f.name==='酸奶'||f.name==='豆浆'});

  if(!hasVeg)warnings.push({icon:'🥬',text:'今天没有蔬菜水果摄入！建议每餐搭配蔬菜，补充维生素和膳食纤维'});
  if(!hasProtein)warnings.push({icon:'🥩',text:'今天没有蛋白质来源！建议摄入鸡蛋、肉类或豆制品'});
  if(!hasStaple)warnings.push({icon:'🍚',text:'今天没有主食，建议适量摄入碳水化合物提供能量'});
  if(!hasFruit&&hasVeg)warnings.push({icon:'🍎',text:'今天没有吃水果，可在加餐时补充一份水果'});

  // Count meal slots used
  var usedSlots=mealSlots.filter(function(s){return (day[s]||[]).length>0});
  var totalItems=allFoods.length;

  // Score calculation
  var score=50;
  if(hasVeg)score+=15;
  if(hasProtein)score+=10;
  if(hasStaple)score+=5;
  if(hasFruit)score+=5;
  if(hasDairy)score+=5;
  score-=unhealthyCount*8;
  score+=(healthyCount-Math.max(0,unhealthyCount))*2;
  score=Math.max(0,Math.min(100,score));

  var scoreLevel=score>=70?'good':score>=40?'warning':'bad';
  var scoreText=score>=70?'均衡健康':score>=40?'需要注意':'需改善';

  return{
    score:score,
    scoreLevel:scoreLevel,
    scoreText:scoreText,
    totalItems:totalItems,
    usedSlots:usedSlots.length,
    hasVeg:hasVeg,
    hasProtein:hasProtein,
    hasFruit:hasFruit,
    hasStaple:hasStaple,
    hasMeat:hasMeat,
    warnings:warnings,
    healthyCount:healthyCount,
    unhealthyCount:unhealthyCount,
    allFoods:allFoods
  };
}

function addFood(slot){
  var input=$('foodInput-'+slot);
  var text=input.value.trim();
  if(!text)return;
  var data=loadData();
  var dk=getMealDayKey(currentMealDay);
  var day=getDayMeals(data,dk);

  // Try to parse: "食物名 份量" or "食物名"
  var name=text,amount='1份';
  var parts=text.split(/\s+/);
  if(parts.length>=2&&isNaN(parts[0])){
    name=parts[0];
    amount=parts.slice(1).join(' ');
  }

  var foodInfo=FOOD_DB[name];
  if(!foodInfo){
    var guessCat='其他',guessIcon='📝';
    if(/菜|蔬|叶|瓜|茄|笋|菌|菇|豆|椒/.test(name)){guessCat='蔬菜';guessIcon='🥬'}
    else if(/肉|排|腿|腩|骨|筋/.test(name)){guessCat='肉类';guessIcon='🥩'}
    else if(/鱼|虾|蟹|贝|蚝|鱿|参|螺/.test(name)){guessCat='海鲜';guessIcon='🐟'}
    else if(/饭|面|包|粥|饼|粉|饺|馍|团|糕|粽|糍/.test(name)){guessCat='主食';guessIcon='🍜'}
    else if(/果|莓|蕉|桃|梨|橙|瓜|荔/.test(name)&&!name.match(/菜|瓜/)){guessCat='水果';guessIcon='🍎'}
    else if(/蛋/.test(name)){guessCat='蛋类';guessIcon='🥚'}
    else if(/豆|腐/.test(name)){guessCat='豆制品';guessIcon='🫘'}
    else if(/奶|酪|乳/.test(name)){guessCat='饮品';guessIcon='🥛'}
    else if(/茶|咖|可乐|汁|汤|酒/.test(name)){guessCat='饮品';guessIcon='🍵'}
    else if(/薯片|饼|糖|巧|冰|雪/.test(name)){guessCat='零食';guessIcon='🍪'}
    foodInfo={cat:guessCat,icon:guessIcon,ele:[]};
  }
  day[slot].push({name:name,amount:amount,cat:foodInfo.cat,icon:foodInfo.icon,elements:foodInfo.ele});
  data.mealDays[dk]=day;
  saveData(data);
  input.value='';
  closeAutocomplete(slot);
  renderMeals();
}

function removeFood(slot,idx){
  var data=loadData();
  var dk=getMealDayKey(currentMealDay);
  var day=getDayMeals(data,dk);
  day[slot].splice(idx,1);
  data.mealDays[dk]=day;
  saveData(data);
  renderMeals();
}

function onFoodInput(slot){
  var input=$('foodInput-'+slot);
  var val=input.value.trim();
  var ac=$('autocomplete-'+slot);
  if(autoTimer)clearTimeout(autoTimer);
  autoTimer=setTimeout(function(){
    if(!val){ac.innerHTML='';ac.style.display='none';return}
    var names=Object.keys(FOOD_DB);
    var matched=names.filter(function(n){return n.indexOf(val)>-1}).slice(0,8);
    if(matched.length===0){ac.innerHTML='';ac.style.display='none';return}
    var html='';
    matched.forEach(function(n){
      var f=FOOD_DB[n];
      html+='<div class="autocomplete-item" onclick="selectFood(\''+slot+'\',\''+n+'\')">'+f.icon+' '+n+' <span class="ac-cat">'+f.cat+'</span></div>';
    });
    ac.innerHTML=html;ac.style.display='block';
  },150);
}

function selectFood(slot,name){
  $('foodInput-'+slot).value=name;
  closeAutocomplete(slot);
  $('foodInput-'+slot).focus();
}

function closeAutocomplete(slot){
  var ac=$('autocomplete-'+slot);
  if(ac){ac.innerHTML='';ac.style.display='none'}
}

function changeMealDay(delta){currentMealDay.setDate(currentMealDay.getDate()+delta);renderMeals()}

function isToday(d){var t=new Date();return d.getFullYear()===t.getFullYear()&&d.getMonth()===t.getMonth()&&d.getDate()===t.getDate()}

function getMealDayKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}

function getDayMeals(data,dateKey){
  if(!data.mealDays)data.mealDays={};
  if(!data.mealDays[dateKey])data.mealDays[dateKey]={breakfast:[],lunch:[],dinner:[],snack:[]};
  return data.mealDays[dateKey];
}

