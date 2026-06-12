// ============================================================
// AI MODULE - API 配置与分析
// ============================================================

var API_CONFIG_KEY = 'zhangzhang_api_config';

function getApiConfig() {
  try {
    var raw = localStorage.getItem(API_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveApiConfig() {
  var provider = document.getElementById('apiProvider').value;
  var endpoint = provider === 'custom'
    ? document.getElementById('customEndpoint').value.trim()
    : provider;
  var key = document.getElementById('apiKey').value.trim();
  var model = document.getElementById('apiModel').value.trim();

  if (!endpoint) { alert('请输入 API 接口地址'); return; }
  if (!key) { alert('请输入 API Key'); return; }
  if (!model) { alert('请输入模型名称'); return; }

  var config = {
    endpoint: endpoint.replace(/\/+$/, '') + '/chat/completions',
    key: key,
    model: model,
    provider: provider
  };
  localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
  document.getElementById('settingsModal').classList.remove('open');
  updateApiStatus();
  alert('API 配置已保存');
}

function onProviderChange() {
  var select = document.getElementById('apiProvider');
  var customGroup = document.getElementById('customEndpointGroup');
  if (select.value === 'custom') {
    customGroup.style.display = 'block';
  } else {
    customGroup.style.display = 'none';
  }
}

function openSettings() {
  document.getElementById('settingsModal').classList.add('open');
  var config = getApiConfig();
  if (config) {
    var provider = config.provider || 'https://api.deepseek.com';
    document.getElementById('apiProvider').value = provider;
    if (provider === 'custom') {
      document.getElementById('customEndpoint').value = config.endpoint.replace('/chat/completions', '');
    }
    document.getElementById('apiKey').value = config.key || '';
    document.getElementById('apiModel').value = config.model || '';
  }
  onProviderChange();
}

function updateApiStatus() {
  var config = getApiConfig();
  var status = document.getElementById('apiStatus');
  if (config && config.key) {
    status.textContent = '🟢';
    status.title = 'AI 已配置 (' + config.model + ')';
  } else {
    status.textContent = '⚫';
    status.title = 'AI 未配置';
  }
}

function runAIAnalysis(type) {
  var config = getApiConfig();
  if (!config || !config.key) {
    alert('请先配置 AI API（点击右上角 ⚙️）');
    return;
  }

  var modal = document.getElementById('aiResultModal');
  var title = document.getElementById('aiResultTitle');
  var content = document.getElementById('aiResultContent');
  var loading = document.getElementById('aiResultLoading');

  modal.classList.add('open');
  content.style.display = 'none';
  loading.style.display = 'block';

  if (type === 'meal') {
    title.textContent = '🤖 AI 饮食分析';
  } else {
    title.textContent = '🤖 AI 健康与运动分析';
  }

  // 构建分析数据
  var data = loadData();
  var today = new Date();
  var dateKey = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  var prompt = '';
  if (type === 'meal') {
    var dayMeals = data.mealDays && data.mealDays[dateKey] ?
      JSON.stringify(data.mealDays[dateKey], null, 2) : '今日无饮食记录';
    prompt = '作为营养健康顾问，请分析以下今日饮食数据，给出营养建议和改进方向。\n\n' +
      '今日饮食记录：\n' + dayMeals;
  } else {
    var exRecords = (data.exerciseRecords || []).slice(-20);
    var healthRecords = (data.healthRecords || []).slice(-10);
    prompt = '作为健康顾问，请分析以下运动和健康数据，给出综合建议。\n\n' +
      '运动记录：\n' + JSON.stringify(exRecords, null, 2) + '\n\n' +
      '健康记录：\n' + JSON.stringify(healthRecords, null, 2);
  }

  fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + config.key
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: '你是一位专业的健康营养顾问，请根据用户数据提供简明、有用的分析建议。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })
  })
  .then(function(res) {
    if (!res.ok) throw new Error('API 请求失败 (' + res.status + ')');
    return res.json();
  })
  .then(function(json) {
    var text = json.choices && json.choices[0] && json.choices[0].message
      ? json.choices[0].message.content
      : 'AI 返回格式异常';
    loading.style.display = 'none';
    content.style.display = 'block';
    content.textContent = text;
  })
  .catch(function(err) {
    loading.style.display = 'none';
    content.style.display = 'block';
    content.textContent = '⚠️ 分析失败：' + err.message;
  });
}

// 初始化状态
updateApiStatus();


// ============================================================
// EXPORT / IMPORT
// ============================================================
function exportBackup() {
  var data = loadData();
  var blob = new Blob([JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    records: data.records || [],
    healthRecords: data.healthRecords || [],
    exerciseRecords: data.exerciseRecords || [],
    mealDays: data.mealDays || {},
  }, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'zhangzhang-backup-' + new Date().toISOString().slice(0, 10) + '.zhang';
  a.click();
  URL.revokeObjectURL(url);
}

function importBackup(file) {
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    try {
      var data = JSON.parse(ev.target.result);
      if (!data.version) throw new Error('无效的备份文件');
      saveData(data);
      alert('备份导入成功！');
      renderAll();
    } catch (e) {
      alert('导入失败: ' + e.message);
    }
  };
  reader.readAsText(file);
}
