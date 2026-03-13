// ============================
// ダイアリーページ
// ============================

let currentDate = new Date().toISOString().split('T')[0];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let diaryPanelOpen = true;
let diaryFormDirty = false;

// Mark form as dirty when any input changes
function markDiaryDirty() {
  diaryFormDirty = true;
}

// Warn before leaving with unsaved changes
window.addEventListener('beforeunload', (e) => {
  if (diaryFormDirty) {
    e.preventDefault();
    e.returnValue = '保存していない変更があります。ページを離れますか？';
  }
});

// --- 初期化 ---
document.addEventListener('DOMContentLoaded', async () => {
  await Auth.init();
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  initDiaryTextCounter();
  renderAll();

  // Add dirty tracking to all diary form inputs
  document.querySelectorAll('.diary-form-section input, .diary-form-section textarea, .diary-form-section select').forEach(el => {
    el.addEventListener('input', markDiaryDirty);
    el.addEventListener('change', markDiaryDirty);
  });
});

function renderAll() {
  renderHeader();
  renderDiaryDate();
  renderFoodChart();
  renderExerciseRate();
  renderDiaryForm();
  renderMonthlyTable();
}

// --- ヘッダー ---
function renderHeader() {
  const nameEl = document.getElementById('diary-user-name');
  if (nameEl && Auth.currentUser) {
    nameEl.textContent = Auth.currentUser.name;
  }
}

// --- 日付表示 ---
function renderDiaryDate() {
  const el = document.getElementById('diary-date-display');
  if (!el) return;
  const d = new Date(currentDate + 'T00:00:00');
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  el.textContent = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日（' + days[d.getDay()] + '）';
}

// --- ダイアリーパネル開閉 ---
function toggleDiaryPanel() {
  diaryPanelOpen = !diaryPanelOpen;
  const sections = document.querySelectorAll('.diary-section');
  sections.forEach(s => {
    s.style.display = diaryPanelOpen ? '' : 'none';
  });
  const btn = document.getElementById('diary-write-btn');
  if (btn) {
    btn.textContent = diaryPanelOpen ? 'ダイアリーを閉じる' : '今日のダイアリーを書く';
  }
}

// --- ダイアリーデータ (Store経由 localStorage) ---
function getDiary(date) {
  return Store.getDiary(date);
}

function saveDiary(date, data) {
  Store.setDiary(date, data);
}

// --- 食事カルテ ---
function renderFoodChart() {
  const meals = Store.getMeals(currentDate);
  const total = Store.getDayTotal(currentDate);
  const goals = Store.getGoals();
  const weights = Store.getWeights();
  const todayWeight = weights.find(w => w.date === currentDate);

  // 比較テーブル
  document.getElementById('fc-weight-goal').textContent = goals.targetWeight ? goals.targetWeight + ' kg' : '-';
  document.getElementById('fc-weight-actual').textContent = todayWeight ? todayWeight.weight + ' kg' : '-';
  document.getElementById('fc-cal-goal').textContent = goals.cal + ' kcal';
  document.getElementById('fc-cal-actual').textContent = Math.round(total.cal) + ' kcal';
  document.getElementById('fc-protein-goal').textContent = goals.protein + ' g';
  document.getElementById('fc-protein-actual').textContent = total.protein + ' g';
  document.getElementById('fc-fat-goal').textContent = goals.fat + ' g';
  document.getElementById('fc-fat-actual').textContent = total.fat + ' g';
  document.getElementById('fc-carb-goal').textContent = goals.carb + ' g';
  document.getElementById('fc-carb-actual').textContent = total.carb + ' g';

  // 消費カロリー (運動)
  const exerciseTotal = Store.getDayExerciseTotal(currentDate);
  var burnGoalEl = document.getElementById('fc-burn-goal');
  var burnActualEl = document.getElementById('fc-burn-actual');
  if (burnGoalEl) burnGoalEl.textContent = '-';
  if (burnActualEl) burnActualEl.textContent = exerciseTotal > 0 ? exerciseTotal + ' kcal' : '-';

  // 概要
  const summaryEl = document.getElementById('fc-summary');
  if (meals.length === 0) {
    summaryEl.textContent = 'まだ食事が記録されていません。';
  } else {
    const calDiff = Math.round(total.cal) - goals.cal;
    if (calDiff > 0) {
      summaryEl.textContent = '目標より ' + calDiff + ' kcal オーバーしています。';
    } else if (calDiff < 0) {
      summaryEl.textContent = 'あと ' + Math.abs(calDiff) + ' kcal 摂取できます。';
    } else {
      summaryEl.textContent = '目標カロリーちょうどです。';
    }
  }

  // 食事メニューグループ
  const mealTypes = {
    '朝食': 'fc-breakfast',
    '昼食': 'fc-lunch',
    '夕食': 'fc-dinner',
    '間食': 'fc-snack'
  };

  Object.keys(mealTypes).forEach(type => {
    const el = document.getElementById(mealTypes[type]);
    if (!el) return;
    const items = meals.filter(m => m.type === type);
    if (items.length === 0) {
      el.innerHTML = '<span class="fc-unrecorded">未記入</span>';
    } else {
      el.innerHTML = items.map(m => {
        const cal = m.cal ? ' (' + Math.round(m.cal) + ' kcal)' : '';
        return '<div class="fc-meal-item">' + escapeHtml(m.name) + cal + '</div>';
      }).join('');
    }
  });

  // 合計カロリー
  document.getElementById('fc-total-cal').textContent = Math.round(total.cal);

  // 栄養バランスバー
  renderNutritionBars(total, goals);

  // 未完了メッセージ
  const incomplete = document.getElementById('fc-incomplete-msg');
  const hasAllMeals = ['朝食', '昼食', '夕食'].every(type => meals.some(m => m.type === type));
  if (incomplete) {
    incomplete.style.display = hasAllMeals ? 'none' : '';
  }
}

function renderNutritionBars(total, goals) {
  const barsEl = document.getElementById('fc-nutrition-bars');
  if (!barsEl) return;

  const nutrients = [
    { name: 'カロリー', actual: Math.round(total.cal), goal: goals.cal, unit: 'kcal', cls: 'cal' },
    { name: 'タンパク質', actual: total.protein, goal: goals.protein, unit: 'g', cls: 'protein' },
    { name: '脂質', actual: total.fat, goal: goals.fat, unit: 'g', cls: 'fat' },
    { name: '炭水化物', actual: total.carb, goal: goals.carb, unit: 'g', cls: 'carb' }
  ];

  barsEl.innerHTML = nutrients.map(n => {
    const pct = n.goal > 0 ? Math.min(100, Math.round((n.actual / n.goal) * 100)) : 0;
    const overClass = pct >= 100 ? ' over' : '';
    return '<div class="nutrition-row">' +
      '<span class="nutrition-label">' + n.name + '</span>' +
      '<div class="nutrition-bar"><div class="nutrition-fill ' + n.cls + overClass + '" style="width:' + pct + '%"></div></div>' +
      '<span class="nutrition-value">' + n.actual + '/' + n.goal + n.unit + '</span>' +
      '</div>';
  }).join('');

  // 栄養詳細
  const detailEl = document.getElementById('fc-nutrition-detail');
  if (detailEl) {
    const fiber = total.fiber || 0;
    const fiberGoal = goals.fiber || 20;
    const fiberPct = fiberGoal > 0 ? Math.min(100, Math.round((fiber / fiberGoal) * 100)) : 0;
    detailEl.innerHTML = nutrients.map(n => {
      const pct = n.goal > 0 ? Math.min(100, Math.round((n.actual / n.goal) * 100)) : 0;
      return '<div class="detail-row"><span>' + n.name + '</span><span>' + pct + '%</span></div>';
    }).join('') +
    '<div class="detail-row"><span>食物繊維</span><span>' + fiberPct + '%</span></div>';
  }
}

function switchFcTab(tab) {
  document.querySelectorAll('.fc-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.fc-tab-panel').forEach(p => p.classList.remove('active'));
  if (tab === 'meal-balance') {
    document.getElementById('fc-tab-meal').classList.add('active');
    document.getElementById('fc-meal-balance').classList.add('active');
  } else {
    document.getElementById('fc-tab-nutrition').classList.add('active');
    document.getElementById('fc-nutrition-balance').classList.add('active');
  }
}

// --- 運動量の充足率 ---
function renderExerciseRate() {
  const exercises = Store.getExercises(currentDate);
  const contentEl = document.getElementById('exercise-rate-content');
  const summaryEl = document.getElementById('exercise-rate-summary');
  if (!contentEl) return;

  if (exercises.length === 0) {
    contentEl.innerHTML = '<a href="dashboard.html" class="exercise-unrecorded">未記入 - 運動を記録する</a>';
    if (summaryEl) summaryEl.innerHTML = '';
  } else {
    contentEl.innerHTML = exercises.map(e => {
      return '<div class="exercise-entry">' +
        '<span class="exercise-name">' + escapeHtml(e.name) + '</span>' +
        '<span class="exercise-detail">' + (e.duration || '-') + '分 / ' + Math.round(e.calories || 0) + ' kcal</span>' +
        '</div>';
    }).join('');
    const totalCal = Store.getDayExerciseTotal(currentDate);
    if (summaryEl) {
      summaryEl.innerHTML = '合計消費カロリー: <strong>' + totalCal + '</strong> kcal';
    }
  }
}

// --- ダイアリーフォーム ---
function renderDiaryForm() {
  const diary = getDiary(currentDate);
  if (!diary) {
    document.getElementById('diary-weight').value = '';
    document.getElementById('diary-bodyfat').value = '';
    document.querySelectorAll('input[name="bowel"]').forEach(r => r.checked = false);
    document.getElementById('diary-eval').value = '';
    document.getElementById('diary-text').value = '';
    document.getElementById('diary-text').placeholder = 'まだ日記が書かれていません。\n体重や食事の感想を記録して、ダイエットの成功率を高めましょう！';
    updateTextCount();
    return;
  }

  document.getElementById('diary-weight').value = diary.weight || '';
  document.getElementById('diary-bodyfat').value = diary.bodyFat || '';

  document.querySelectorAll('input[name="bowel"]').forEach(r => {
    r.checked = r.value === diary.bowel;
  });

  document.getElementById('diary-eval').value = diary.selfEval || '';
  document.getElementById('diary-text').value = diary.text || '';
  updateTextCount();
}

function submitDiary() {
  const data = {
    weight: parseFloat(document.getElementById('diary-weight').value) || null,
    bodyFat: parseFloat(document.getElementById('diary-bodyfat').value) || null,
    bowel: document.querySelector('input[name="bowel"]:checked')
      ? document.querySelector('input[name="bowel"]:checked').value
      : null,
    selfEval: document.getElementById('diary-eval').value,
    text: document.getElementById('diary-text').value,
    date: currentDate
  };

  saveDiary(currentDate, data);

  // 体重データも Store に保存
  if (data.weight) {
    Store.addWeight(data.weight, data.bodyFat);
  }

  diaryFormDirty = false;
  showToast('ダイアリーを保存しました');
  renderAll();
}

// --- テキスト文字数カウンター ---
function initDiaryTextCounter() {
  const textarea = document.getElementById('diary-text');
  if (textarea) {
    textarea.addEventListener('input', updateTextCount);
  }
}

function updateTextCount() {
  const textarea = document.getElementById('diary-text');
  const counter = document.getElementById('diary-text-count');
  if (textarea && counter) {
    counter.textContent = textarea.value.length;
  }
}

// --- 月間テーブル ---
function renderMonthlyTable() {
  const titleEl = document.getElementById('month-title');
  if (titleEl) {
    titleEl.textContent = currentYear + '年' + (currentMonth + 1) + '月';
  }

  const tbody = document.getElementById('monthly-table-body');
  if (!tbody) return;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const today = new Date().toISOString().split('T')[0];
  const weights = Store.getWeights();

  let html = '';
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = currentYear + '-' + String(currentMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    const d = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = days[d.getDay()];
    const isToday = dateStr === today;
    const isSelected = dateStr === currentDate;
    const weightEntry = weights.find(w => w.date === dateStr);
    const diary = getDiary(dateStr);
    const total = Store.getDayTotal(dateStr);

    // 健康度 (簡易スコア: カロリー目標達成率)
    const goals = Store.getGoals();
    let healthScore = '-';
    let healthClass = '';
    if (total.cal > 0) {
      const ratio = total.cal / goals.cal;
      if (ratio >= 0.8 && ratio <= 1.2) {
        healthScore = Math.round(100 - Math.abs(1 - ratio) * 100);
      } else {
        healthScore = Math.max(0, Math.round(100 - Math.abs(1 - ratio) * 100));
      }
      if (healthScore >= 80) healthClass = 'health-good';
      else if (healthScore >= 50) healthClass = 'health-ok';
      else healthClass = 'health-bad';
    }

    const rowClass = (isToday ? ' today' : '') + (isSelected ? ' selected' : '') + (d.getDay() === 0 ? ' sunday' : '') + (d.getDay() === 6 ? ' saturday' : '');

    html += '<tr class="monthly-row' + rowClass + '" onclick="goToDate(\'' + dateStr + '\')">';
    html += '<td class="mt-date">' + day + '(' + dayOfWeek + ')</td>';
    html += '<td class="mt-weight">' + (weightEntry ? weightEntry.weight : '-') + '</td>';
    html += '<td class="mt-bodyfat col-bodyfat">' + (weightEntry && weightEntry.bodyFat ? weightEntry.bodyFat + '%' : '-') + '</td>';
    html += '<td class="mt-health col-health">' + (total.cal > 0 ? '<span class="' + healthClass + '">' + healthScore + '</span>' : '-') + '</td>';
    html += '<td class="mt-diary">' + (diary && diary.text ? '<span class="mt-recorded">記入</span>' : '<span class="mt-unrecorded">未記入</span>') + '</td>';
    html += '</tr>';
  }

  tbody.innerHTML = html;
}

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  } else if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderMonthlyTable();
}

function goToDate(dateStr) {
  currentDate = dateStr;
  const d = new Date(dateStr + 'T00:00:00');
  currentMonth = d.getMonth();
  currentYear = d.getFullYear();
  renderAll();
  // スクロールをトップへ
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- ユーティリティ ---
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
