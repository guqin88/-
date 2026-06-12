// ============================================================
// RECORDS PAGE
// ============================================================

function renderRecords(){
  var records=getMonthRecords().sort(function(a,b){return b.date.localeCompare(a.date)||b.id-a.id});
  var c=$('recordsList');if(records.length===0){c.innerHTML='<div class="empty-state"><p>本月暂无记录</p></div>';return}
  var h='<div class="card" style="padding:8px 0">';var ld='';
  records.forEach(function(r){if(r.date!==ld){ld=r.date;h+='<div class="record-date">'+friendlyDate(r.date)+' '+r.date+'</div>'}h+=renderRecordRow(r)});
  c.innerHTML=h+'</div>';
}

