// ============================
// 食事記録ページ (meal.js)
// ============================

let currentDate = new Date().toISOString().split('T')[0];
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth(); // 0-indexed
let currentMealType = '朝食';
let selectedFood = null;
let currentCategory = 'all';
let currentSearchQuery = '';

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  await Auth.init();
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  // Set user name
  const nameEl = document.getElementById('user-name');
  if (nameEl && Auth.currentUser) {
    nameEl.textContent = Auth.currentUser.name;
  }
  renderAll();
  checkFirstTime();
});

function renderAll() {
  renderDateHeader();
  renderCalorieTable();
  renderBodyRecord();
  renderMealSections();
  renderExerciseSection();
  renderMyRules();
  renderCalendar();
}

// ---- Date Navigation ----
function formatDateJP(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日(' + days[d.getDay()] + ')';
}

function renderDateHeader() {
  const el = document.getElementById('date-display');
  if (el) el.textContent = formatDateJP(currentDate);
}

function prevDay() {
  const d = new Date(currentDate + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  currentDate = d.toISOString().split('T')[0];
  renderAll();
}

function nextDay() {
  const today = new Date().toISOString().split('T')[0];
  const d = new Date(currentDate + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  const next = d.toISOString().split('T')[0];
  if (next <= today) {
    currentDate = next;
    renderAll();
  }
}

function goToDate(dateStr) {
  const today = new Date().toISOString().split('T')[0];
  if (dateStr <= today) {
    currentDate = dateStr;
    // Update calendar view to match
    const d = new Date(dateStr + 'T00:00:00');
    calendarYear = d.getFullYear();
    calendarMonth = d.getMonth();
    renderAll();
  }
}

// ---- Sub-tab scroll ----
function scrollToSection(sectionName) {
  const el = document.getElementById('section-' + sectionName);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // Update active sub-tab
  document.querySelectorAll('.record-sub-tab').forEach(tab => {
    tab.classList.toggle('active', tab.textContent.trim() === sectionName);
  });
}

// ---- Calorie Data Table (asken style) ----
function renderCalorieTable() {
  const goals = Store.getGoals();
  const total = Store.getDayTotal(currentDate);
  const exerciseTotal = Store.getDayExerciseTotal(currentDate);

  const intakeGoal = goals.cal || 2000;
  const intakeActual = total.cal;
  const intakeDiff = intakeActual - intakeGoal;

  // Exercise goal: default 234kcal if not set
  const exerciseGoal = goals.exerciseCal || 234;
  const exerciseActual = exerciseTotal;
  const exerciseDiff = exerciseActual - exerciseGoal;

  const container = document.getElementById('calorie-data');
  if (!container) return;

  container.innerHTML = `
    <div class="calorie-table">
      <div class="calorie-table-header">
        <span></span>
        <span>目標</span>
        <span>実績</span>
        <span>差分</span>
      </div>
      <div class="calorie-table-row">
        <span class="label">摂取カロリー</span>
        <span class="value">${intakeGoal}kcal</span>
        <span class="value">${intakeActual}kcal</span>
        <span class="value ${intakeDiff >= 0 ? 'positive' : 'negative'}">${intakeDiff >= 0 ? '+' : ''}${intakeDiff}kcal</span>
      </div>
      <div class="calorie-table-row">
        <span class="label">消費カロリー</span>
        <span class="value">${exerciseGoal}kcal</span>
        <span class="value">${exerciseActual}kcal</span>
        <span class="value ${exerciseDiff >= 0 ? 'positive' : 'negative'}">${exerciseDiff >= 0 ? '+' : ''}${exerciseDiff}kcal</span>
      </div>
      <div class="calorie-link">
        <a href="goals.html">目標を変更する</a>
      </div>
    </div>
  `;
}

// Keep old name as alias for backward compatibility
function renderCalorieData() {
  renderCalorieTable();
}

// ---- Body Record ----
function renderBodyRecord() {
  const weights = Store.getWeights();
  const todayWeight = weights.find(w => w.date === currentDate);

  const weightInput = document.getElementById('body-weight');
  const fatInput = document.getElementById('body-fat');
  const stepsInput = document.getElementById('body-steps');

  if (weightInput && todayWeight) {
    weightInput.value = todayWeight.weight || '';
  } else if (weightInput) {
    weightInput.value = '';
  }
  if (fatInput && todayWeight) {
    fatInput.value = todayWeight.bodyFat || '';
  } else if (fatInput) {
    fatInput.value = '';
  }
  // Steps are stored separately
  if (stepsInput) {
    const stepsKey = 'bp_' + (Auth.currentUser ? Auth.currentUser.uid : 'anon') + '_steps';
    const allSteps = JSON.parse(localStorage.getItem(stepsKey) || '{}');
    stepsInput.value = allSteps[currentDate] || '';
  }
}

function saveBodyRecord() {
  const weightVal = document.getElementById('body-weight').value;
  const fatVal = document.getElementById('body-fat').value;
  const stepsVal = document.getElementById('body-steps').value;

  const weight = parseFloat(weightVal);
  const bodyFat = parseFloat(fatVal);

  if (weightVal && (weight < 20 || weight > 300)) {
    showToast('体重は20〜300kgの範囲で入力してください', 'error');
    return;
  }
  if (fatVal && (bodyFat < 1 || bodyFat > 60)) {
    showToast('体脂肪率は1〜60%の範囲で入力してください', 'error');
    return;
  }

  if (weightVal) {
    const weights = Store.getWeights();
    const entry = {
      date: currentDate,
      weight: parseFloat(weightVal),
      bodyFat: fatVal ? parseFloat(fatVal) : null,
      timestamp: Date.now()
    };
    const idx = weights.findIndex(w => w.date === currentDate);
    if (idx >= 0) {
      weights[idx] = entry;
    } else {
      weights.push(entry);
    }
    const key = 'bp_' + (Auth.currentUser ? Auth.currentUser.uid : 'anon') + '_weights';
    localStorage.setItem(key, JSON.stringify(weights));
  }

  if (stepsVal) {
    const stepsKey = 'bp_' + (Auth.currentUser ? Auth.currentUser.uid : 'anon') + '_steps';
    const allSteps = JSON.parse(localStorage.getItem(stepsKey) || '{}');
    allSteps[currentDate] = parseInt(stepsVal);
    localStorage.setItem(stepsKey, JSON.stringify(allSteps));
  }

  showToast('カラダの記録を保存しました');
}

// ---- Meal Sections ----
function renderMealSections() {
  const meals = Store.getMeals(currentDate);
  const types = ['朝食', '昼食', '夕食', '間食'];

  const hasAnyMeals = meals.length > 0;
  let firstEmptyShown = false;

  types.forEach(type => {
    const items = meals.filter(m => m.type === type);
    const containerId = 'meal-body-' + type;
    const totalId = 'meal-total-' + type;
    const container = document.getElementById(containerId);
    const totalEl = document.getElementById(totalId);

    if (!container) return;

    if (items.length === 0) {
      if (!hasAnyMeals && !firstEmptyShown) {
        firstEmptyShown = true;
        container.innerHTML = `
          <div class="empty-guide">
            <p class="empty-message">まだ記録されていません</p>
            <p class="empty-hint">「記録する」ボタンを押して、食べたものを検索・登録しましょう</p>
          </div>
        `;
      } else {
        container.innerHTML = `
          <p class="meal-empty">まだ記録されていません。<a href="javascript:void(0)" onclick="skipMeal('${type}')">${type}を食べなかった</a></p>
        `;
      }
      if (totalEl) totalEl.textContent = '';
    } else {
      let total = 0;
      let html = '<ul class="meal-items">';
      items.forEach(item => {
        total += item.cal || 0;
        html += `
          <li class="meal-item">
            <div class="meal-item-info">
              <span class="meal-item-name">${escapeHtml(item.name)}</span>
              <span class="meal-item-detail">${item.weight ? item.weight + 'g' : ''}</span>
            </div>
            <span class="meal-item-cal">${item.cal || 0}kcal</span>
            <button class="meal-item-delete" onclick="deleteMealItem(${item.id})" title="削除">&times;</button>
          </li>
        `;
      });
      html += '</ul>';
      container.innerHTML = html;
      if (totalEl) totalEl.textContent = total + 'kcal';
    }
  });
}

// ---- Exercise Section ----
function renderExerciseSection() {
  const exercises = Store.getExercises(currentDate);
  const container = document.getElementById('exercise-body');
  const totalEl = document.getElementById('exercise-total');

  if (!container) return;

  if (exercises.length === 0) {
    container.innerHTML = `
      <p class="meal-empty">まだ記録されていません。</p>
      <a class="meal-skip-link" onclick="skipExercise()">運動をしなかった</a>
    `;
    if (totalEl) totalEl.textContent = '';
  } else {
    let total = 0;
    let html = '<ul class="exercise-items">';
    exercises.forEach(ex => {
      total += ex.calories || 0;
      html += `
        <li class="exercise-item">
          <div class="meal-item-info">
            <span class="meal-item-name">${escapeHtml(ex.name)}</span>
            <span class="meal-item-detail">${ex.duration ? ex.duration + '分' : ''}</span>
          </div>
          <span class="meal-item-cal">${ex.calories || 0}kcal</span>
          <button class="meal-item-delete" onclick="deleteExerciseItem(${ex.id})" title="削除">&times;</button>
        </li>
      `;
    });
    html += '</ul>';
    container.innerHTML = html;
    if (totalEl) totalEl.textContent = total + 'kcal';
  }
}

// ---- Myルール Section ----
function renderMyRules() {
  const container = document.getElementById('my-rules-body');
  if (!container) return;

  // Rules are stored in goaldata
  const uid = Auth.currentUser ? Auth.currentUser.uid : 'anon';
  const goalData = JSON.parse(localStorage.getItem('bp_' + uid + '_goaldata') || '{}');
  const rules = goalData.rules || [];

  if (rules.length === 0) {
    container.innerHTML = `
      <div class="my-rules-empty">
        未設定（<a href="goals.html">Myルール設定で設定できます</a>）
      </div>
    `;
    return;
  }

  const today = currentDate;
  let html = '';
  rules.forEach(rule => {
    const isToday = rule.date === today;
    const okActive = (rule.completed === true && isToday) ? ' active' : '';
    const ngActive = (rule.completed === false && isToday) ? ' active' : '';

    html += `
      <div class="rule-item">
        <span class="rule-text">${escapeHtml(rule.text)}</span>
        <div class="rule-check-btns">
          <button class="rule-check-btn ok${okActive}" onclick="toggleMyRule(${rule.id}, true)" title="できた">&#9675;</button>
          <button class="rule-check-btn ng${ngActive}" onclick="toggleMyRule(${rule.id}, false)" title="できなかった">&#10005;</button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function toggleMyRule(ruleId, status) {
  const uid = Auth.currentUser ? Auth.currentUser.uid : 'anon';
  const key = 'bp_' + uid + '_goaldata';
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  const rules = data.rules || [];
  const today = currentDate;
  const rule = rules.find(r => r.id === ruleId);

  if (rule) {
    if (rule.completed === status && rule.date === today) {
      rule.completed = null;
      rule.date = null;
    } else {
      rule.completed = status;
      rule.date = today;
    }
  }

  localStorage.setItem(key, JSON.stringify(data));
  renderMyRules();
}

// ---- Record Modal (Food) ----
function openRecordModal(mealType) {
  window._lastFocusedElement = document.activeElement;
  currentMealType = mealType;
  selectedFood = null;
  currentCategory = 'all';
  currentSearchQuery = '';
  selectedFoodIndex = -1;

  const modal = document.getElementById('record-modal');
  document.getElementById('record-modal-title').textContent = mealType + 'を記録';
  document.getElementById('food-search-input').value = '';
  document.getElementById('quantity-panel').style.display = 'none';
  modal.style.display = 'flex';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', mealType + 'を記録');
  document.body.classList.add('modal-open');

  renderCategoryTabs();
  renderFoodResults(FoodDB.search(''));

  // Focus first focusable element
  setTimeout(() => {
    const firstInput = modal.querySelector('input, button:not(.modal-close)');
    if (firstInput) firstInput.focus();
  }, 100);
}

function closeRecordModal() {
  document.getElementById('record-modal').style.display = 'none';
  document.body.classList.remove('modal-open');
  selectedFood = null;

  // Return focus to the button that opened the modal
  if (window._lastFocusedElement) {
    window._lastFocusedElement.focus();
  }
}

function renderCategoryTabs() {
  const categories = FoodDB.getCategories();
  const container = document.getElementById('food-categories');
  if (!container) return;

  let html = '<button class="cat-btn active" onclick="filterCategory(\'all\')">すべて</button>';
  html += '<button class="cat-btn" onclick="filterCategory(\'recent\')">最近</button>';
  categories.forEach(cat => {
    html += `<button class="cat-btn" onclick="filterCategory('${escapeHtml(cat)}')">${escapeHtml(cat)}</button>`;
  });
  container.innerHTML = html;
}

function filterCategory(cat) {
  currentCategory = cat;
  // Update active state
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === (cat === 'all' ? 'すべて' : cat === 'recent' ? '最近' : cat));
  });

  let results;
  if (cat === 'all') {
    results = currentSearchQuery ? FoodDB.search(currentSearchQuery) : FoodDB.search('');
  } else if (cat === 'recent') {
    results = Store.getRecentFoods(20);
  } else {
    results = FoodDB.getByCategory(cat);
    if (currentSearchQuery) {
      const q = currentSearchQuery.toLowerCase();
      results = results.filter(f => f.name.toLowerCase().includes(q));
    }
  }
  renderFoodResults(results);
}

function searchFood(query) {
  currentSearchQuery = query;
  const resultsDiv = document.getElementById('food-results');
  if (resultsDiv) {
    resultsDiv.innerHTML = '<div class="loading-spinner"><div class="spinner"></div>検索中...</div>';
  }

  setTimeout(() => {
    let results;
    if (currentCategory === 'all') {
      results = FoodDB.search(query);
    } else if (currentCategory === 'recent') {
      results = Store.getRecentFoods(20);
      if (query) {
        const q = query.toLowerCase();
        results = results.filter(f => f.name.toLowerCase().includes(q));
      }
    } else {
      results = FoodDB.getByCategory(currentCategory);
      if (query) {
        const q = query.toLowerCase();
        results = results.filter(f => f.name.toLowerCase().includes(q));
      }
    }
    renderFoodResults(results);
  }, 50);
}

function renderFoodResults(foods) {
  const container = document.getElementById('food-results');
  if (!container) return;

  if (!foods || foods.length === 0) {
    container.innerHTML = '<div class="food-results-empty">食品が見つかりません</div>';
    return;
  }

  let html = '';
  foods.slice(0, 50).forEach(food => {
    html += `
      <div class="food-result-item" onclick="selectFood(${typeof food.id === 'string' ? "'" + food.id + "'" : food.id})">
        <div>
          <div class="food-result-name">${escapeHtml(food.name)}</div>
          <div class="food-result-meta">${escapeHtml(food.category)} | 100gあたり</div>
        </div>
        <span class="food-result-cal">${food.cal}kcal</span>
      </div>
    `;
  });
  container.innerHTML = html;
}

function selectFood(foodId) {
  selectedFood = FoodDB.getById(foodId);
  if (!selectedFood) {
    // Try custom foods
    const customs = Store.getCustomFoods();
    selectedFood = customs.find(f => f.id === foodId);
  }
  if (!selectedFood) return;

  document.getElementById('selected-food-name').textContent = selectedFood.name;
  document.getElementById('food-quantity').value = 100;
  document.getElementById('quantity-panel').style.display = 'block';
  updateNutritionPreview();

  // Scroll to quantity panel
  document.getElementById('quantity-panel').scrollIntoView({ behavior: 'smooth' });
}

function updateNutritionPreview() {
  if (!selectedFood) return;
  const input = document.getElementById('food-quantity');
  let val = parseFloat(input.value);
  if (isNaN(val) || val <= 0) {
    document.getElementById('nutrition-preview').innerHTML = '<span class="validation-error">1g以上の数値を入力してください</span>';
    return;
  }
  if (val > 5000) {
    document.getElementById('nutrition-preview').innerHTML = '<span class="validation-error">分量が大きすぎます</span>';
    return;
  }
  const weight = parseInt(input.value) || 100;
  const calc = FoodDB.calculate(selectedFood, weight);

  document.getElementById('nutrition-preview').innerHTML = `
    <div class="preview-cal">${calc.cal}kcal</div>
    <div>たんぱく質: ${calc.protein}g / 脂質: ${calc.fat}g / 炭水化物: ${calc.carb}g / 食物繊維: ${calc.fiber}g</div>
  `;
}

function confirmAddFood() {
  if (!selectedFood) return;

  // Duplicate meal warning
  const foodName = document.getElementById('selected-food-name')?.textContent;
  const existingMeals = Store.getMeals(currentDate);
  const recentDuplicate = existingMeals.find(m => m.name === foodName &&
    (Date.now() - new Date(m.date + 'T' + (m.time || '00:00')).getTime()) < 30 * 60 * 1000);

  if (recentDuplicate) {
    if (!confirm(foodName + 'は30分以内に記録済みです。もう一度追加しますか？')) return;
  }

  const weight = parseInt(document.getElementById('food-quantity').value) || 100;
  const calc = FoodDB.calculate(selectedFood, weight);

  const meal = {
    name: calc.name,
    weight: weight,
    cal: calc.cal,
    protein: calc.protein,
    fat: calc.fat,
    carb: calc.carb,
    fiber: calc.fiber
  };

  Store.addMeal(meal, { mealType: currentMealType, date: currentDate });
  closeRecordModal();
  renderAll();
  showToast(currentMealType + 'に「' + calc.name + '」を追加しました');
}

// ---- Exercise Record Modal ----
let selectedExercise = null;

function openExerciseModal() {
  window._lastFocusedElement = document.activeElement;
  selectedExercise = null;
  const modal = document.getElementById('exercise-modal');
  modal.style.display = 'flex';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', '運動を記録');
  document.body.classList.add('modal-open');
  renderExerciseList();
}

function closeExerciseModal() {
  document.getElementById('exercise-modal').style.display = 'none';
  document.body.classList.remove('modal-open');
  selectedExercise = null;

  if (window._lastFocusedElement) {
    window._lastFocusedElement.focus();
  }
}

function renderExerciseList() {
  const exercises = ExerciseDB.getAll();
  const container = document.getElementById('exercise-results');
  if (!container) return;

  let html = '';
  exercises.forEach(ex => {
    html += `
      <div class="exercise-result-item" onclick="selectExercise(${ex.id})">
        <span>${escapeHtml(ex.name)}</span>
        <span class="food-result-cal">${ex.calPerMin}kcal/分</span>
      </div>
    `;
  });
  container.innerHTML = html;
}

function selectExercise(id) {
  selectedExercise = ExerciseDB.getAll().find(e => e.id === id);
  if (!selectedExercise) return;

  document.getElementById('selected-exercise-name').textContent = selectedExercise.name;
  document.getElementById('exercise-duration').value = 30;
  document.getElementById('exercise-detail-panel').style.display = 'block';
  updateExercisePreview();
}

function updateExercisePreview() {
  if (!selectedExercise) return;
  const duration = parseInt(document.getElementById('exercise-duration').value) || 30;
  const cal = Math.round(selectedExercise.calPerMin * duration);
  document.getElementById('exercise-cal-preview').textContent = cal + 'kcal';
}

function confirmAddExercise() {
  if (!selectedExercise) return;
  const duration = parseInt(document.getElementById('exercise-duration').value) || 30;
  const cal = Math.round(selectedExercise.calPerMin * duration);

  Store.addExercise({
    name: selectedExercise.name,
    duration: duration,
    calories: cal,
    date: currentDate
  });

  closeExerciseModal();
  renderAll();
  showToast('「' + selectedExercise.name + '」を追加しました');
}

// ---- Delete ----
function deleteMealItem(mealId) {
  if (!confirm('この食事記録を削除しますか？')) return;
  Store.deleteMeal(currentDate, mealId);
  renderAll();
  showToast('削除しました');
}

function deleteExerciseItem(exerciseId) {
  Store.deleteExercise(currentDate, exerciseId);
  renderAll();
  showToast('運動記録を削除しました');
}

// ---- Skip ----
function skipMeal(type) {
  showToast(type + 'をスキップしました');
}

function skipExercise() {
  showToast('運動をスキップしました');
}

// ---- Calendar ----
function renderCalendar() {
  const container = document.getElementById('calendar-grid');
  const monthLabel = document.getElementById('calendar-month-label');
  if (!container || !monthLabel) return;

  monthLabel.textContent = calendarYear + '年' + (calendarMonth + 1) + '月';

  const today = new Date().toISOString().split('T')[0];

  // First day of month
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const startDow = firstDay.getDay(); // 0=Sun

  // Get all meals data for this month to show dots
  const mealsKey = 'bp_' + (Auth.currentUser ? Auth.currentUser.uid : 'anon') + '_meals';
  const allMeals = JSON.parse(localStorage.getItem(mealsKey) || '{}');

  // Header
  let html = '';
  const headers = ['日', '月', '火', '水', '木', '金', '土'];
  headers.forEach((h, i) => {
    let cls = 'cal-header';
    if (i === 0) cls += ' sun';
    if (i === 6) cls += ' sat';
    html += `<span class="${cls}">${h}</span>`;
  });

  // Empty cells before first day
  for (let i = 0; i < startDow; i++) {
    html += '<span class="calendar-date empty"></span>';
  }

  // Days
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = calendarYear + '-' +
      String(calendarMonth + 1).padStart(2, '0') + '-' +
      String(day).padStart(2, '0');
    let cls = 'calendar-date';
    if (dateStr === today) cls += ' today';
    if (dateStr === currentDate) cls += ' selected';
    if (allMeals[dateStr] && allMeals[dateStr].length > 0) cls += ' has-record';
    if (dateStr > today) cls += ' other-month';

    html += `<span class="${cls}" onclick="goToDate('${dateStr}')">${day}</span>`;
  }

  container.innerHTML = html;
}

function prevMonth() {
  calendarMonth--;
  if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear--;
  }
  renderCalendar();
}

function nextMonth() {
  calendarMonth++;
  if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear++;
  }
  renderCalendar();
}

// ---- Keyboard Navigation for Food Search Results ----
let selectedFoodIndex = -1;

document.getElementById('food-search-input')?.addEventListener('keydown', (e) => {
  const results = document.querySelectorAll('.food-result-item');
  if (results.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedFoodIndex = Math.min(selectedFoodIndex + 1, results.length - 1);
    updateFoodSelection(results);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedFoodIndex = Math.max(selectedFoodIndex - 1, 0);
    updateFoodSelection(results);
  } else if (e.key === 'Enter' && selectedFoodIndex >= 0) {
    e.preventDefault();
    results[selectedFoodIndex].click();
  }
});

function updateFoodSelection(results) {
  results.forEach((r, i) => {
    r.classList.toggle('food-result-selected', i === selectedFoodIndex);
    if (i === selectedFoodIndex) r.scrollIntoView({ block: 'nearest' });
  });
}

// ---- Advice ----
function showAdvice() {
  const total = Store.getDayTotal(currentDate);
  const goals = Store.getGoals();
  const meals = Store.getMeals(currentDate);

  let advice = '';
  if (meals.length === 0) {
    advice = 'まだ食事が記録されていません。\n\n食事を記録すると、栄養バランスに基づいたアドバイスが表示されます。';
  } else {
    const calDiff = total.cal - goals.cal;
    if (calDiff > 200) {
      advice += '今日のカロリー摂取は目標を' + calDiff + 'kcal超えています。\n夕食は軽めにすることをお勧めします。\n\n';
    } else if (calDiff < -500) {
      advice += '今日のカロリーが目標より大幅に不足しています。\nしっかり食事を摂りましょう。\n\n';
    } else {
      advice += 'カロリー摂取は概ね順調です。\n\n';
    }

    if (total.protein < goals.protein * 0.7) {
      advice += 'たんぱく質が不足しています。肉、魚、卵、大豆製品を意識して摂りましょう。\n\n';
    }
    if (total.fat > goals.fat * 1.3) {
      advice += '脂質がやや多めです。揚げ物を控えめにしてみましょう。\n\n';
    }
    if (total.fiber < goals.fiber * 0.5) {
      advice += '食物繊維が不足しています。野菜、海藻、きのこ類を追加してみましょう。\n\n';
    }
    if (!advice.includes('不足') && !advice.includes('超え') && !advice.includes('多め')) {
      advice += '全体的にバランスの良い食事ができています。この調子を続けましょう！';
    }
  }

  document.getElementById('advice-text').textContent = advice;
  const adviceModal = document.getElementById('advice-modal');
  adviceModal.style.display = 'flex';
  adviceModal.setAttribute('role', 'dialog');
  adviceModal.setAttribute('aria-modal', 'true');
  adviceModal.setAttribute('aria-label', '本日のアドバイス');
  document.body.classList.add('modal-open');
}

function closeAdviceModal() {
  document.getElementById('advice-modal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

// ---- Export as Image ----
function exportAsImage() {
  const main = document.querySelector('.content-main');
  if (!main) return;

  // Simple approach: create a text summary
  const total = Store.getDayTotal(currentDate);
  const dateText = formatDateJP(currentDate);
  const text = `${dateText}\n摂取カロリー: ${total.cal}kcal\nたんぱく質: ${total.protein}g\n脂質: ${total.fat}g\n炭水化物: ${total.carb}g`;

  // Create a canvas
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#F0F4E0';
  ctx.fillRect(0, 0, 600, 400);

  // Header
  ctx.fillStyle = '#7B8B2E';
  ctx.fillRect(0, 0, 600, 60);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('BodyPilot - ' + dateText, 20, 38);

  // Content
  ctx.fillStyle = '#333';
  ctx.font = '16px sans-serif';
  const lines = [
    '摂取カロリー: ' + total.cal + 'kcal',
    'たんぱく質: ' + total.protein + 'g',
    '脂質: ' + total.fat + 'g',
    '炭水化物: ' + total.carb + 'g',
    '食物繊維: ' + total.fiber + 'g'
  ];
  lines.forEach((line, i) => {
    ctx.fillText(line, 30, 100 + i * 32);
  });

  // Meals
  const meals = Store.getMeals(currentDate);
  const types = ['朝食', '昼食', '夕食', '間食'];
  let y = 280;
  types.forEach(type => {
    const items = meals.filter(m => m.type === type);
    if (items.length > 0) {
      ctx.fillStyle = '#7B8B2E';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(type + ':', 30, y);
      ctx.fillStyle = '#333';
      ctx.font = '13px sans-serif';
      const names = items.map(m => m.name).join(', ');
      ctx.fillText(names, 90, y);
      y += 24;
    }
  });

  // Download
  const link = document.createElement('a');
  link.download = 'bodypilot-' + currentDate + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();

  showToast('画像をダウンロードしました');
}

// ---- Utility ----
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Unified toast system
function showToast(message, type) {
  if (type === undefined) type = 'success';
  // Remove any existing toast
  document.querySelectorAll('.app-toast').forEach(function(t) { t.remove(); });

  var toast = document.createElement('div');
  toast.className = 'app-toast app-toast-' + type;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  var icon = type === 'success' ? '\u2713' : type === 'error' ? '\u2717' : '\u2139';
  toast.innerHTML = '<span class="toast-icon">' + icon + '</span> ' + message;

  document.body.appendChild(toast);

  // Auto remove after 3.5s
  setTimeout(function() {
    toast.classList.add('toast-fade-out');
    setTimeout(function() { toast.remove(); }, 300);
  }, 3500);
}

// Escape key closes modals
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (document.getElementById('record-modal') && document.getElementById('record-modal').style.display === 'flex') {
      closeRecordModal();
    }
    if (document.getElementById('exercise-modal') && document.getElementById('exercise-modal').style.display === 'flex') {
      closeExerciseModal();
    }
    if (document.getElementById('advice-modal') && document.getElementById('advice-modal').style.display === 'flex') {
      closeAdviceModal();
    }
  }
});

// ---- Onboarding ----
function checkFirstTime() {
  const uid = Auth.currentUser.uid;
  if (!localStorage.getItem('bp_' + uid + '_onboarded')) {
    showOnboardingGuide();
  }
}

function showOnboardingGuide() {
  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';
  overlay.innerHTML = `
    <div class="onboarding-card">
      <h2>BodyPilotへようこそ！</h2>
      <div class="onboarding-steps">
        <div class="onboarding-step">
          <span class="step-num">1</span>
          <p>「食事記録」で毎日の食事を記録しましょう</p>
        </div>
        <div class="onboarding-step">
          <span class="step-num">2</span>
          <p>「目標設定」で体重目標とカロリー目標を設定</p>
        </div>
        <div class="onboarding-step">
          <span class="step-num">3</span>
          <p>「グラフ」で健康状態の推移を確認できます</p>
        </div>
      </div>
      <button onclick="dismissOnboarding()" class="btn-advice">はじめる</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function dismissOnboarding() {
  const uid = Auth.currentUser.uid;
  localStorage.setItem('bp_' + uid + '_onboarded', '1');
  document.querySelector('.onboarding-overlay')?.remove();
}

// ---- Logout ----
function handleLogout() {
  Auth.logout();
}
