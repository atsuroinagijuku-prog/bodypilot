// ============================
// 目標設定ページ (goals.js)
// ============================

var currentGoalTab = 'plan';
var goalStep = 1;

// --- Activity level labels ---
var ACTIVITY_LABELS = {
  'sedentary': 'あまり動かない',
  'moderate': 'やや活動的',
  'active': '活動的'
};

// --- Init ---
document.addEventListener('DOMContentLoaded', async function() {
  await Auth.init();
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  // Hamburger menu
  var hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', function() {
      var nav = document.querySelector('.nav');
      if (nav) nav.classList.toggle('open');
      var expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', !expanded);
    });
  }

  // Rule input character counter
  var ruleInput = document.getElementById('rule-input');
  if (ruleInput) {
    ruleInput.addEventListener('input', function() {
      var count = ruleInput.value.length;
      var counter = document.getElementById('rule-char-count');
      if (counter) {
        counter.textContent = count + ' / 50';
        counter.className = 'rule-char-count' + (count > 50 ? ' over' : '');
      }
    });
    // Enter key to add rule
    ruleInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addRule();
      }
    });
  }

  loadGoalData();
  renderCurrentTab();
});

// --- Goal Data Storage ---
function getGoalData() {
  var uid = Auth.currentUser.uid;
  return JSON.parse(localStorage.getItem('bp_' + uid + '_goaldata') || '{}');
}

function saveGoalData(data) {
  var uid = Auth.currentUser.uid;
  var existing = getGoalData();
  Object.keys(data).forEach(function(key) {
    existing[key] = data[key];
  });
  localStorage.setItem('bp_' + uid + '_goaldata', JSON.stringify(existing));
}

// --- Profile helpers ---
function getProfile() {
  var uid = Auth.currentUser.uid;
  var raw = localStorage.getItem('bp_' + uid + '_profile');
  return raw ? JSON.parse(raw) : {};
}

function loadGoalData() {
  var data = getGoalData();

  // Pre-fill weight step 1
  var weights = Store.getWeights();
  if (weights.length > 0) {
    var currentWeightInput = document.getElementById('current-weight');
    if (currentWeightInput && !currentWeightInput.value) {
      currentWeightInput.value = weights[weights.length - 1].weight;
    }
  }

  // Restore activity level
  var activityLevel = data.activityLevel || 'sedentary';
  updateActivityDisplay(activityLevel);

  if (data.goalWeight) {
    var goalWeightInput = document.getElementById('goal-weight');
    if (goalWeightInput && !goalWeightInput.value) {
      goalWeightInput.value = data.goalWeight;
    }
  }
}

// --- Tab Switching ---
function switchGoalTab(tab) {
  currentGoalTab = tab;

  // Update tab buttons
  document.querySelectorAll('.goal-tab').forEach(function(btn) {
    btn.classList.remove('active');
  });
  var activeBtn = document.getElementById('tab-btn-' + tab);
  if (activeBtn) activeBtn.classList.add('active');

  // Update tab content
  document.querySelectorAll('.goal-tab-content').forEach(function(content) {
    content.classList.remove('active');
  });
  var activeContent = document.getElementById('tab-' + tab);
  if (activeContent) activeContent.classList.add('active');

  renderCurrentTab();
}

function renderCurrentTab() {
  switch (currentGoalTab) {
    case 'plan':
      renderPlanTab();
      break;
    case 'weight':
      renderWeightTab();
      break;
    case 'rules':
      renderRulesTab();
      break;
  }
}

// --- Myプラン Tab ---
function renderPlanTab() {
  var data = getGoalData();

  // Weight summary
  var weightSummary = document.getElementById('plan-weight-summary');
  if (weightSummary) {
    if (data.currentWeight && data.goalWeight) {
      var html = '<div class="plan-weight-summary">';
      html += '<div class="plan-weight-box">';
      html += '<div class="plan-weight-box-label">現在の体重</div>';
      html += '<div class="plan-weight-box-value">' + data.currentWeight.toFixed(1) + '<span class="plan-weight-box-unit"> kg</span></div>';
      html += '</div>';
      html += '<div class="plan-weight-arrow">&rarr;</div>';
      html += '<div class="plan-weight-box">';
      html += '<div class="plan-weight-box-label">目標体重</div>';
      html += '<div class="plan-weight-box-value">' + data.goalWeight.toFixed(1) + '<span class="plan-weight-box-unit"> kg</span></div>';
      html += '</div>';
      html += '</div>';

      if (data.completionDate) {
        var target = new Date(data.completionDate);
        var now = new Date();
        var daysLeft = Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
        html += '<div class="plan-deadline-info">';
        html += '目標達成予定日: <strong>' + target.getFullYear() + '年' + (target.getMonth() + 1) + '月' + target.getDate() + '日</strong>';
        html += ' (あと <strong>' + daysLeft + '</strong> 日)';
        html += '</div>';
      }
      weightSummary.innerHTML = html;
    } else {
      weightSummary.innerHTML = '<span class="plan-not-set">目標が設定されていません</span>';
    }
  }

  // Calorie details
  if (data.targetIntake) {
    var intakeEl = document.getElementById('plan-target-intake');
    if (intakeEl) intakeEl.textContent = data.targetIntake + ' kcal';

    var burnEl = document.getElementById('plan-target-burn');
    if (burnEl) burnEl.textContent = (data.targetBurn || 0) + ' kcal';

    var stepsEl = document.getElementById('plan-target-steps');
    if (stepsEl) stepsEl.textContent = (data.targetSteps || 0).toLocaleString() + ' 歩';
  }

  // Rules summary
  var rulesSummary = document.getElementById('plan-rules-summary');
  if (rulesSummary) {
    var rules = data.rules || [];
    if (rules.length > 0) {
      var html = '<ul style="list-style:none;padding:0;margin:0;">';
      rules.forEach(function(rule) {
        var status = '';
        if (rule.completed === true) status = ' <span style="color:var(--green);font-weight:700;">&#9675;</span>';
        else if (rule.completed === false) status = ' <span style="color:#e74c3c;font-weight:700;">&#10005;</span>';
        html += '<li style="padding:3px 0;font-size:0.85rem;">' + escapeHtml(rule.text) + status + '</li>';
      });
      html += '</ul>';
      rulesSummary.innerHTML = html;
    } else {
      rulesSummary.innerHTML = '<span class="plan-not-set">設定されていません</span>';
    }
  }
}

// --- Activity Level ---
function updateActivityDisplay(level) {
  var displayText = document.getElementById('activity-display-text');
  if (displayText) {
    displayText.textContent = ACTIVITY_LABELS[level] || ACTIVITY_LABELS['sedentary'];
  }
  // Update radio selection
  document.querySelectorAll('.activity-option-item').forEach(function(item) {
    item.classList.remove('selected');
    var radio = item.querySelector('input[type="radio"]');
    if (radio && radio.value === level) {
      item.classList.add('selected');
      radio.checked = true;
    }
  });
}

function toggleActivityOptions() {
  var panel = document.getElementById('activity-options-panel');
  if (panel) {
    panel.classList.toggle('show');
  }
}

function selectActivity(el, value) {
  document.querySelectorAll('.activity-option-item').forEach(function(item) {
    item.classList.remove('selected');
  });
  el.classList.add('selected');
  var radio = el.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;

  updateActivityDisplay(value);
  saveGoalData({ activityLevel: value });

  // Close panel
  var panel = document.getElementById('activity-options-panel');
  if (panel) panel.classList.remove('show');
}

// --- 目標体重 Tab ---
function renderWeightTab() {
  // Restore step state
  if (goalStep === 2) {
    document.getElementById('weight-step2').style.display = 'block';
    updateStep2Calculations();
  }
}

function registerCurrentWeight() {
  var input = document.getElementById('current-weight');
  var weight = parseFloat(input.value);
  if (!weight || weight < 20 || weight > 300) {
    showToast('正しい体重を入力してください', 'error');
    return;
  }
  Store.addWeight(weight);
  saveGoalData({ currentWeight: weight });
  showToast('体重を登録しました: ' + weight + ' kg');
}

function setMaintainWeight() {
  var currentWeightInput = document.getElementById('current-weight');
  var goalWeightInput = document.getElementById('goal-weight');
  if (currentWeightInput.value) {
    goalWeightInput.value = currentWeightInput.value;
  }
}

function goToStep2() {
  var currentWeight = parseFloat(document.getElementById('current-weight').value);
  var goalWeight = parseFloat(document.getElementById('goal-weight').value);
  var activityLevel = getSelectedRadio('activity') || 'sedentary';

  if (!currentWeight || currentWeight < 20 || currentWeight > 300) {
    showToast('現在の体重を入力してください', 'error');
    return;
  }
  if (!goalWeight || goalWeight < 20 || goalWeight > 300) {
    showToast('目標体重を入力してください', 'error');
    return;
  }

  saveGoalData({ currentWeight: currentWeight, goalWeight: goalWeight, activityLevel: activityLevel });
  goalStep = 2;

  document.getElementById('weight-step2').style.display = 'block';
  document.getElementById('weight-step2').scrollIntoView({ behavior: 'smooth' });
  updateStep2Calculations();
}

function updateStep2Calculations() {
  var data = getGoalData();
  if (!data.currentWeight || !data.goalWeight) return;

  var diff = data.currentWeight - data.goalWeight;
  var absDiff = Math.abs(diff);

  // Summary with flow layout
  var summaryEl = document.getElementById('step2-summary');
  if (summaryEl) {
    var direction = diff > 0 ? '-' : (diff < 0 ? '+' : '');
    var html = '';
    html += '<div class="step2-weight-flow">';
    html += '<div class="step2-weight-item"><div class="step2-weight-item-label">開始時</div><div class="step2-weight-item-value">' + data.currentWeight.toFixed(1) + 'kg</div></div>';
    html += '<div class="step2-flow-arrow">&rarr;</div>';
    html += '<div class="step2-weight-item"><div class="step2-weight-item-label">目標体重</div><div class="step2-weight-item-value">' + data.goalWeight.toFixed(1) + 'kg</div></div>';
    html += '</div>';
    html += '<div class="step2-reduction">減量目標: <strong>' + direction + absDiff.toFixed(1) + 'kg</strong></div>';

    // Calculate pace + estimated date
    var pace = getSelectedPace();
    var months = absDiff > 0 && pace > 0 ? Math.ceil(absDiff / pace) : 0;
    var estimatedDate = new Date();
    estimatedDate.setMonth(estimatedDate.getMonth() + months);

    if (absDiff === 0) {
      html += '<div class="step2-estimate">体重維持モード</div>';
    } else {
      html += '<div class="step2-estimate">目標達成まで約<strong>' + months + 'ヶ月</strong> (推定: <strong>' + estimatedDate.getFullYear() + '年' + (estimatedDate.getMonth() + 1) + '月</strong>)</div>';
    }

    summaryEl.innerHTML = html;
  }

  // Calculate target calories
  var bmr = calculateBMR(data);
  var activityMultiplier = getActivityMultiplier(data.activityLevel);
  var tdee = Math.round(bmr * activityMultiplier);

  // Deficit calculation: 7700 kcal per 1 kg fat
  var pace = getSelectedPace();
  var dailyDeficit = Math.round((pace * 7700) / 30);
  if (diff <= 0) dailyDeficit = 0; // maintaining or gaining

  var style = getSelectedRadio('style') || 'balance';
  var foodRatio, exerciseRatio;
  if (style === 'food') {
    foodRatio = 0.8;
    exerciseRatio = 0.2;
  } else if (style === 'exercise') {
    foodRatio = 0.2;
    exerciseRatio = 0.8;
  } else {
    foodRatio = 0.5;
    exerciseRatio = 0.5;
  }

  var targetIntake = Math.max(1200, Math.round(tdee - dailyDeficit * foodRatio));
  var targetBurn = Math.round(dailyDeficit * exerciseRatio);
  var targetSteps = Math.round(targetBurn / 0.04); // rough: 0.04 kcal per step

  var intakeEl = document.getElementById('calc-target-intake');
  if (intakeEl) intakeEl.textContent = targetIntake;

  var burnEl = document.getElementById('calc-target-burn');
  if (burnEl) burnEl.textContent = targetBurn;

  var stepsEl = document.getElementById('calc-target-steps');
  if (stepsEl) stepsEl.textContent = targetSteps.toLocaleString();

  // Store temp calculations for completion
  var months = absDiff > 0 && pace > 0 ? Math.ceil(absDiff / pace) : 0;
  window._goalCalc = {
    targetIntake: targetIntake,
    targetBurn: targetBurn,
    targetSteps: targetSteps,
    pace: pace,
    style: style,
    months: months,
    tdee: tdee,
    bmr: bmr
  };
}

function getSelectedPace() {
  var paceVal = getSelectedRadio('pace');
  if (paceVal === 'custom') {
    var customInput = document.getElementById('pace-custom-value');
    var customVal = customInput ? parseFloat(customInput.value) : 0;
    return customVal > 0 ? customVal : 1.0;
  }
  return parseFloat(paceVal || '2.0');
}

function selectPace(el, value) {
  document.querySelectorAll('.pace-option').forEach(function(opt) {
    opt.classList.remove('selected');
  });
  el.classList.add('selected');
  var radio = el.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;

  // Show/hide custom input
  var customPanel = document.getElementById('pace-custom-input');
  if (customPanel) {
    if (value === 'custom') {
      customPanel.classList.add('show');
    } else {
      customPanel.classList.remove('show');
    }
  }

  updateStep2Calculations();
}

function selectStyle(el, value) {
  document.querySelectorAll('.style-option').forEach(function(opt) {
    opt.classList.remove('selected');
  });
  el.classList.add('selected');
  var radio = el.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
  updateStep2Calculations();
}

function completeGoalSetting() {
  var data = getGoalData();
  var calc = window._goalCalc;
  if (!calc) {
    showToast('目標を先に設定してください', 'error');
    return;
  }

  // Calculate completion date
  var completionDate = new Date();
  completionDate.setMonth(completionDate.getMonth() + calc.months);
  var completionDateStr = completionDate.toISOString().split('T')[0];

  // Save to Store goals (nutritional targets)
  var targetIntake = calc.targetIntake;
  Store.setGoals({
    cal: targetIntake,
    protein: Math.round(targetIntake * 0.25 / 4),
    fat: Math.round(targetIntake * 0.25 / 9),
    carb: Math.round(targetIntake * 0.5 / 4),
    fiber: 20,
    targetWeight: data.goalWeight
  });

  // Save goal data
  saveGoalData({
    pace: calc.pace,
    style: calc.style,
    targetIntake: calc.targetIntake,
    targetBurn: calc.targetBurn,
    targetSteps: calc.targetSteps,
    completionDate: completionDateStr,
    tdee: calc.tdee,
    bmr: calc.bmr,
    settingCompleted: true
  });

  showToast('目標設定を完了しました！');
  goalStep = 1;
  switchGoalTab('plan');
}

// --- BMR Calculation (Harris-Benedict) ---
function calculateBMR(data) {
  var weight = data.currentWeight;
  if (!weight) {
    var weights = Store.getWeights();
    if (weights.length > 0) weight = weights[weights.length - 1].weight;
  }
  if (!weight) return 0;

  // Get height
  var height = Store.getUserHeight();

  // Try to get gender and age from profile
  var profile = getProfile();
  var gender = profile.gender || null;
  var age = 30; // default
  if (profile.birthDate) {
    var birth = new Date(profile.birthDate);
    var now = new Date();
    age = now.getFullYear() - birth.getFullYear();
    var monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
  }

  if (height) {
    // Harris-Benedict equation
    if (gender === 'male') {
      // Men: 66.47 + 13.75*weight + 5.0*height - 6.76*age
      return Math.round(66.47 + 13.75 * weight + 5.0 * height - 6.76 * age);
    } else if (gender === 'female') {
      // Women: 655.1 + 9.56*weight + 1.85*height - 4.68*age
      return Math.round(655.1 + 9.56 * weight + 1.85 * height - 4.68 * age);
    } else {
      // Unisex average (Mifflin-St Jeor based)
      return Math.round(10 * weight + 6.25 * height - 5 * age - 78);
    }
  }

  // Fallback: rough weight-based estimate
  return Math.round(weight * 22);
}

function getActivityMultiplier(level) {
  var map = {
    'sedentary': 1.2,
    'moderate': 1.55,
    'active': 1.725
  };
  return map[level] || 1.2;
}

// --- Myルール Tab ---
function renderRulesTab() {
  var data = getGoalData();
  var rules = data.rules || [];
  var listEl = document.getElementById('rules-list');
  if (!listEl) return;

  if (rules.length === 0) {
    listEl.innerHTML = '<div class="rules-empty">実施中のMyルールはありません</div>';
    return;
  }

  var today = new Date().toISOString().split('T')[0];
  var html = '';
  rules.forEach(function(rule) {
    var isToday = rule.date === today;
    var okActive = (rule.completed === true && isToday) ? ' active' : '';
    var ngActive = (rule.completed === false && isToday) ? ' active' : '';

    html +=
      '<div class="rule-item">' +
        '<span class="rule-text">' + escapeHtml(rule.text) + '</span>' +
        '<div class="rule-check-btns">' +
          '<button class="rule-check-btn ok' + okActive + '" onclick="toggleRule(' + rule.id + ', true)" title="できた">&#9675;</button>' +
          '<button class="rule-check-btn ng' + ngActive + '" onclick="toggleRule(' + rule.id + ', false)" title="できなかった">&#10005;</button>' +
        '</div>' +
        '<button class="rule-delete-btn" onclick="deleteRule(' + rule.id + ')" title="削除">&#128465;</button>' +
      '</div>';
  });
  listEl.innerHTML = html;
}

function addRule() {
  var input = document.getElementById('rule-input');
  var text = input.value.trim();
  if (!text) {
    showToast('ルールを入力してください', 'error');
    return;
  }
  if (text.length > 50) {
    showToast('50文字以内で入力してください', 'error');
    return;
  }

  var data = getGoalData();
  if (!data.rules) data.rules = [];

  // Limit to 20 rules
  if (data.rules.length >= 20) {
    showToast('ルールは最大20個までです', 'error');
    return;
  }

  data.rules.push({
    text: text,
    id: Date.now(),
    completed: null,
    date: null
  });
  saveGoalData(data);
  input.value = '';
  var counter = document.getElementById('rule-char-count');
  if (counter) counter.textContent = '0 / 50';
  renderRulesTab();
  showToast('ルールを追加しました');
}

function toggleRule(ruleId, status) {
  var data = getGoalData();
  var rules = data.rules || [];
  var today = new Date().toISOString().split('T')[0];
  var rule = rules.find(function(r) { return r.id === ruleId; });
  if (rule) {
    // Toggle off if same status
    if (rule.completed === status && rule.date === today) {
      rule.completed = null;
      rule.date = null;
    } else {
      rule.completed = status;
      rule.date = today;
    }
  }
  saveGoalData(data);
  renderRulesTab();
}

function deleteRule(ruleId) {
  if (!confirm('このルールを削除しますか？')) return;
  var data = getGoalData();
  data.rules = (data.rules || []).filter(function(r) { return r.id !== ruleId; });
  saveGoalData(data);
  renderRulesTab();
  showToast('ルールを削除しました');
}

// --- Utility ---
function getSelectedRadio(name) {
  var checked = document.querySelector('input[name="' + name + '"]:checked');
  return checked ? checked.value : null;
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function showToast(message, type) {
  if (type === undefined) type = 'success';
  document.querySelectorAll('.app-toast').forEach(function(t) { t.remove(); });
  var toast = document.createElement('div');
  toast.className = 'app-toast app-toast-' + type;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  var icon = type === 'success' ? '\u2713' : type === 'error' ? '\u2717' : '\u2139';
  toast.innerHTML = '<span class="toast-icon">' + icon + '</span> ' + message;
  document.body.appendChild(toast);
  setTimeout(function() { toast.classList.add('toast-fade-out'); setTimeout(function() { toast.remove(); }, 300); }, 3500);
}

function handleLogout() {
  Auth.logout();
}
