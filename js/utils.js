/**
 * 记账本 - 工具函数
 * 浏览器和 Node.js (Jest) 双模运行
 */

function getDefaultData() {
  return { records:[], healthRecords:[], exerciseRecords:[], mealDays:{}, monthlyBudget:{ food:1195.20, transport:239.04, shopping:637.44, entertainment:398.40, housing:1593.60, medical:398.40, other:318.71 } };
}

function getMonthKey(date) {
  var d = new Date(date);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
}

function formatDate(dateStr) {
  var d = new Date(dateStr);
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function friendlyDate(dateStr) {
  var d = new Date(dateStr);
  var today = new Date();
  var yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
  if (formatDate(dateStr) === formatDate(today.toISOString().slice(0,10))) return '今天';
  if (formatDate(dateStr) === formatDate(yesterday.toISOString().slice(0,10))) return '昨天';
  return (d.getMonth()+1)+'月'+d.getDate()+'日';
}

function formatMoney(val) { return '¥'+Number(val).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2}); }

function parseVoiceText(text){
  text=text.replace(/[，,。.？?！!；;：:]/g,' ').replace(/\s+/g,' ').trim();
  var amount=null;
  var patterns=[/(\d+\.?\d*)\s*万/,/(\d+\.?\d*)\s*千/,/(\d+\.?\d*)\s*百/,/(\d+\.?\d*)\s*块/,/(\d+\.?\d*)\s*元/,/(\d+\.?\d*)/];
  for(var i=0;i<patterns.length;i++){var m=text.match(patterns[i]);if(m){var val=parseFloat(m[1]);if(text.indexOf('万')>-1&&m[0].indexOf('万')>-1)val*=10000;else if(text.indexOf('千')>-1&&m[0].indexOf('千')>-1)val*=1000;else if(text.indexOf('百')>-1&&m[0].indexOf('百')>-1)val*=100;amount=val;break}}
  if(!amount||amount<=0)return null;
  var today=new Date();var dateStr=today.toISOString().slice(0,10);
  var dm=text.match(/昨天/);if(dm){var d=new Date(today);d.setDate(d.getDate()-1);dateStr=d.toISOString().slice(0,10)}
  dm=text.match(/前天/);if(dm){var d=new Date(today);d.setDate(d.getDate()-2);dateStr=d.toISOString().slice(0,10)}
  dm=text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*号/);if(dm){var d=new Date(today.getFullYear(),parseInt(dm[1])-1,parseInt(dm[2]));dateStr=d.toISOString().slice(0,10)}
  var type='expense',incomeSub=null,loanSub=null,category=null;
  if(text.match(/工资|发工资|薪水/)){type='income';incomeSub='salary'}
  else if(text.match(/报销/)){type='income';incomeSub='reimbursement'}
  else if(text.match(/年终奖|奖金/)){type='income';incomeSub='bonus'}
  else if(text.match(/副业|兼职|外快/)){type='income';incomeSub='side_income'}
  else if(text.match(/收入|收到|收款/)){type='income';incomeSub='salary'}
  if(text.match(/存款|存钱|存了/))type='savings';
  if(text.match(/红包/))type='redpacket';
  if(text.match(/花呗|还花呗/)){type='loan';loanSub='huabei'}
  else if(text.match(/京东白条|白条/)&&text.match(/还|还款/)){type='loan';loanSub='jd'}
  else if(text.match(/信用卡|还卡/)){type='loan';loanSub='credit_card'}
  else if(text.match(/还贷|还款/)){type='loan';loanSub='huabei'}
  if(text.match(/吃饭|午餐|晚餐|早饭|早餐|午饭|晚饭|伙食|外卖/))type='meal';
  if(type==='expense'||type==='meal'){
    if(text.match(/交通|打车|地铁|公交|出租/))category='交通';
    else if(text.match(/购物|买|衣服/))category='购物';
    else if(text.match(/娱乐|电影|游戏/))category='娱乐';
    else if(text.match(/租房|房租|水电/))category='居住';
    else if(text.match(/医疗|看病|药/))category='医疗';
    else if(text.match(/教育|课|培训|书/))category='教育';
    else if(text.match(/通讯|话费/))category='通讯';
    else if(type==='expense'&&!category)category='其他';
    else if(type==='meal')category='餐饮';
  }
  return{type:type,amount:Math.round(amount*100)/100,date:dateStr,incomeSub:incomeSub,loanSub:loanSub,category:category,reason:text.replace(/\s+/g,' ')};
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDefaultData: getDefaultData,
    getMonthKey: getMonthKey,
    formatDate: formatDate,
    friendlyDate: friendlyDate,
    formatMoney: formatMoney,
    parseVoiceText: parseVoiceText
  };
}
