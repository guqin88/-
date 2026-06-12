// ============================================================
// DASHBOARD PAGE
// ============================================================

function renderDashboard(){
  var records=getMonthRecords();
  var income=0,expense=0,meals=0,redpacket=0,savings=0,loan=0;
  var ib={salary:0,reimbursement:0,bonus:0,side_income:0};
  var lb={huabei:0,jd:0,credit_card:0};
  records.forEach(function(r){
    if(r.type==='income'){income+=r.amount;if(r.incomeSub)ib[r.incomeSub]=(ib[r.incomeSub]||0)+r.amount}
    else if(r.type==='expense')expense+=r.amount;
    else if(r.type==='meal')meals+=r.amount;
    else if(r.type==='redpacket')redpacket+=r.amount;
    else if(r.type==='savings')savings+=r.amount;
    else if(r.type==='loan'){loan+=r.amount;if(r.loanSub)lb[r.loanSub]=(lb[r.loanSub]||0)+r.amount}
  });
  var totalExp=expense+meals+savings+loan;
  var totalInc=income+redpacket;
  $('dashIncome').textContent=formatMoney(totalInc);
  $('dashExpense').textContent=formatMoney(expense+meals);
  $('dashSavings').textContent=formatMoney(savings);
  $('dashSurplus').textContent=formatMoney(totalInc-totalExp);
  $('dashRedpacket').textContent=formatMoney(redpacket);
  $('dashLoan').textContent=formatMoney(loan);
  $('dashMeals').textContent=formatMoney(meals);

  var ibHtml='';var hasIb=['salary','reimbursement','bonus','side_income'].some(function(k){return ib[k]>0});
  if(hasIb){ibHtml='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';['salary','reimbursement','bonus','side_income'].forEach(function(k){if(ib[k]>0)ibHtml+='<div style="font-size:13px;padding:4px 0"><span class="sub-type-tag tag-'+k+'">'+incomeLabels[k]+'</span> '+formatMoney(ib[k])+'</div>'});ibHtml+='</div>'}else ibHtml='<span style="color:var(--text-secondary)">暂无收入</span>';
  $('incomeBreakdownContent').innerHTML=ibHtml;

  var lbHtml='';var hasLb=['huabei','jd','credit_card'].some(function(k){return lb[k]>0});
  if(hasLb){lbHtml='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">';['huabei','jd','credit_card'].forEach(function(k){if(lb[k]>0)lbHtml+='<div style="font-size:13px;padding:4px 0"><span class="sub-type-tag tag-'+k+'">'+loanLabels[k]+'</span> '+formatMoney(lb[k])+'</div>'});lbHtml+='</div>'}else lbHtml='<span style="color:var(--text-secondary)">暂无借贷</span>';
  $('loanBreakdownContent').innerHTML=lbHtml;

  var all=[...records].sort(function(a,b){return b.date.localeCompare(a.date)||b.id-a.id}).slice(0,5);
  var c=$('dashboardRecords');
  if(all.length===0){c.innerHTML='<div class="empty-state"><p>本月暂无记录</p></div>';return}
  var h='<div class="card" style="padding:8px 0">';all.forEach(function(r){h+=renderRecordRow(r)});c.innerHTML=h+'</div>';
}

