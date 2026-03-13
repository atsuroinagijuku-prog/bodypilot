// ============================
// ダッシュボード
// ============================

// --- XSS対策: サニタイズ関数 ---
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- 現在表示中の日付 ---
let currentViewDate = new Date().toISOString().split('T')[0];
let currentWeightPeriod = 7;

// --- 編集モード ---
let editMode = false;
let editMealDate = null;
let editMealId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await Auth.init();
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  initDashboard();
});

function initDashboard() {
  renderDate();
  renderUserName();
  renderSummary();
  renderMealLog();
  renderNutritionBars();
  initUpload();
  initFoodSearch();
  initWeightForm();
  renderWeightHistory();
  initDateNavigation();
  initWeightPeriodSelector();
  initExercise();
  initWater();
  initSleep();
  initGamification();
  renderAdvice();
  renderPhotoGallery();

  // Initialize push notifications
  if (typeof Notifications !== 'undefined') {
    Notifications.init();
  }

  // Check storage usage and warn if > 80%
  const storagePct = Store.checkStorageWarning();
  if (storagePct) {
    showToast('ストレージ使用量が' + storagePct + '%です。古いデータの削除を検討してください。');
  }
}

// --- 日付ナビゲーション ---
function initDateNavigation() {
  const btnPrev = document.getElementById('date-prev');
  const btnNext = document.getElementById('date-next');
  const btnToday = document.getElementById('date-today');

  if (btnPrev) btnPrev.addEventListener('click', () => navigateDate(-1));
  if (btnNext) btnNext.addEventListener('click', () => navigateDate(1));
  if (btnToday) btnToday.addEventListener('click', () => navigateToToday());

  updateDateNavButtons();
}

function navigateDate(delta) {
  const d = new Date(currentViewDate);
  d.setDate(d.getDate() + delta);
  currentViewDate = d.toISOString().split('T')[0];
  refreshAllViews();
}

function navigateToToday() {
  currentViewDate = new Date().toISOString().split('T')[0];
  refreshAllViews();
}

function refreshAllViews() {
  renderDate();
  renderSummary();
  renderMealLog();
  renderNutritionBars();
  renderExerciseLog();
  renderNetCalories();
  renderWaterIntake();
  renderSleepSummary();
  renderAdvice();
  renderPhotoGallery();
  updateDateNavButtons();
}

function updateDateNavButtons() {
  const today = new Date().toISOString().split('T')[0];
  const btnNext = document.getElementById('date-next');
  const btnToday = document.getElementById('date-today');

  if (btnNext) {
    btnNext.disabled = currentViewDate >= today;
    btnNext.style.opacity = currentViewDate >= today ? '0.3' : '1';
  }
  if (btnToday) {
    btnToday.style.opacity = currentViewDate === today ? '0.5' : '1';
  }
}

function isViewingToday() {
  return currentViewDate === new Date().toISOString().split('T')[0];
}

// --- 日付表示 ---
function renderDate() {
  const el = document.getElementById('today-date');
  if (el) {
    const d = new Date(currentViewDate + 'T00:00:00');
    el.textContent = d.toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    });
  }
}

// --- ユーザー名 ---
function renderUserName() {
  const el = document.getElementById('user-name');
  if (el && Auth.currentUser) {
    el.textContent = Auth.currentUser.name + 'さん';
  }
}

// --- サマリーカード ---
function renderSummary() {
  const total = Store.getDayTotal(currentViewDate);
  const goals = Store.getGoals();

  setText('sum-cal', total.cal.toLocaleString());
  setText('sum-cal-goal', '/ ' + goals.cal.toLocaleString() + ' kcal');
  setText('sum-protein', total.protein);
  setText('sum-protein-goal', '/ ' + goals.protein + ' g');
  setText('sum-fat', total.fat);
  setText('sum-fat-goal', '/ ' + goals.fat + ' g');
  setText('sum-carb', total.carb);
  setText('sum-carb-goal', '/ ' + goals.carb + ' g');

  // 改善された健康スコア計算 (5要素: カロリー30%, タンパク質20%, 脂質15%, 炭水化物20%, 食物繊維15%)
  let score = 0;
  if (total.cal > 0) {
    const calcFactor = (current, goal) => {
      if (goal === 0) return 100;
      const ratio = current / goal;
      // 100 = ゴールぴったり、距離に応じて減少
      const distance = Math.abs(1 - ratio);
      return Math.max(0, Math.round(100 * (1 - distance)));
    };

    const calScore = calcFactor(total.cal, goals.cal);
    const proteinScore = calcFactor(total.protein, goals.protein);
    const fatScore = calcFactor(total.fat, goals.fat);
    const carbScore = calcFactor(total.carb, goals.carb);
    const fiberScore = calcFactor(total.fiber, goals.fiber);

    score = Math.round(
      calScore * 0.30 +
      proteinScore * 0.20 +
      fatScore * 0.15 +
      carbScore * 0.20 +
      fiberScore * 0.15
    );
    score = Math.max(0, Math.min(100, score));

    // スコア内訳データをバッジに保存
    const badge = document.querySelector('.health-score-badge');
    if (badge) {
      badge.dataset.breakdown = JSON.stringify({
        cal: calScore,
        protein: proteinScore,
        fat: fatScore,
        carb: carbScore,
        fiber: fiberScore
      });
    }
  }
  setText('health-score', score);

  // 内訳ツールチップ更新
  updateScoreBreakdown();
}

function updateScoreBreakdown() {
  const badge = document.querySelector('.health-score-badge');
  const tooltip = document.getElementById('score-breakdown');
  if (!badge || !tooltip) return;

  const data = badge.dataset.breakdown;
  if (!data) {
    tooltip.style.display = 'none';
    return;
  }

  const b = JSON.parse(data);
  tooltip.innerHTML = `
    <div class="breakdown-title">スコア内訳</div>
    <div class="breakdown-row"><span>カロリー (30%)</span><span>${b.cal}点</span></div>
    <div class="breakdown-row"><span>タンパク質 (20%)</span><span>${b.protein}点</span></div>
    <div class="breakdown-row"><span>脂質 (15%)</span><span>${b.fat}点</span></div>
    <div class="breakdown-row"><span>炭水化物 (20%)</span><span>${b.carb}点</span></div>
    <div class="breakdown-row"><span>食物繊維 (15%)</span><span>${b.fiber}点</span></div>
  `;
}

// --- 食事ログ ---
function renderMealLog() {
  const meals = Store.getMeals(currentViewDate);
  const container = document.getElementById('meal-log');
  if (!container) return;

  // 「今日の食事」タイトルを日付に合わせて更新
  const mealLogTitle = container.closest('.card');
  if (mealLogTitle) {
    const titleEl = mealLogTitle.querySelector('.card-title');
    if (titleEl) {
      titleEl.textContent = isViewingToday() ? '今日の食事' : currentViewDate.replace(/-/g, '/') + ' の食事';
    }
  }

  if (meals.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:var(--text-light); padding:24px; font-size:0.9rem;">まだ食事が記録されていません。<br>写真を撮影するか、食品を検索して記録しましょう。</div>';
    return;
  }

  const typeClass = { '朝食': '', '昼食': 'lunch', '夕食': 'dinner', '間食': 'snack' };

  container.innerHTML = meals.map(m => `
    <div class="meal-item" data-id="${m.id}">
      <span class="meal-type ${typeClass[m.type] || ''}">${sanitizeHTML(m.type)}</span>
      <div class="meal-info meal-clickable" onclick="editMeal('${sanitizeHTML(m.date)}', ${m.id})" title="クリックして編集">
        <div class="meal-name">${sanitizeHTML(m.name)}</div>
        <div class="meal-detail">${sanitizeHTML(String(m.weight))}g ・ ${sanitizeHTML(m.time)}</div>
      </div>
      <div class="meal-cal">${m.cal} kcal</div>
      <button class="meal-delete" onclick="deleteMeal('${sanitizeHTML(m.date)}', ${m.id})" title="削除">×</button>
    </div>
  `).join('');
}

function deleteMeal(date, id) {
  Store.deleteMeal(date, id);
  renderSummary();
  renderMealLog();
  renderNutritionBars();
  renderAdvice();
  checkAndNotifyBadges();
}

// --- 食事編集 ---
function editMeal(date, mealId) {
  const meals = Store.getMeals(date);
  const meal = meals.find(m => m.id === mealId);
  if (!meal) return;

  editMode = true;
  editMealDate = date;
  editMealId = mealId;

  const modal = document.getElementById('add-modal');
  const modalTitle = document.getElementById('modal-title-text');
  const submitBtn = document.getElementById('modal-submit-btn');

  if (modalTitle) modalTitle.textContent = '食事を編集';
  if (submitBtn) submitBtn.textContent = '更新する';

  document.getElementById('modal-food-name').textContent = meal.name;
  document.getElementById('modal-weight').value = meal.weight || 100;

  // 食品IDを探す (名前で検索)
  const foodMatch = FoodDB.foods.find(f => f.name === meal.name);
  document.getElementById('modal-food-id').value = foodMatch ? foodMatch.id : '';

  // meal type セレクタの値を設定
  const mealTypeSelect = document.getElementById('modal-meal-type');
  if (mealTypeSelect && meal.type) {
    mealTypeSelect.value = meal.type;
  }

  if (foodMatch) {
    updateModalPreview();
  } else {
    // 食品DBにない場合（写真認識など）、直接値を表示
    document.getElementById('modal-cal').textContent = meal.cal + ' kcal';
    document.getElementById('modal-protein').textContent = 'P: ' + meal.protein + 'g';
    document.getElementById('modal-fat').textContent = 'F: ' + meal.fat + 'g';
    document.getElementById('modal-carb').textContent = 'C: ' + meal.carb + 'g';
  }

  modal.classList.add('show');
}

// --- 栄養バランスバー ---
function renderNutritionBars() {
  const total = Store.getDayTotal(currentViewDate);
  const goals = Store.getGoals();

  setBarWidth('bar-protein', total.protein, goals.protein);
  setBarWidth('bar-fat', total.fat, goals.fat);
  setBarWidth('bar-carb', total.carb, goals.carb);
  setBarWidth('bar-fiber', total.fiber, goals.fiber);

  setText('val-protein', total.protein + '/' + goals.protein + 'g');
  setText('val-fat', total.fat + '/' + goals.fat + 'g');
  setText('val-carb', total.carb + '/' + goals.carb + 'g');
  setText('val-fiber', total.fiber + '/' + goals.fiber + 'g');

  // 栄養バランスタイトルを日付に合わせて更新
  const nutritionCard = document.getElementById('bar-protein');
  if (nutritionCard) {
    const card = nutritionCard.closest('.card');
    if (card) {
      const titleEl = card.querySelector('.card-title');
      if (titleEl) {
        titleEl.textContent = isViewingToday() ? '今日の栄養バランス' : currentViewDate.replace(/-/g, '/') + ' の栄養バランス';
      }
    }
  }
}

function setBarWidth(id, current, goal) {
  const el = document.getElementById(id);
  if (el) {
    const pct = Math.min((current / goal) * 100, 100);
    el.style.width = pct + '%';
  }
}

// --- 写真アップロード ---
function initUpload() {
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('file-input');
  if (!uploadArea || !fileInput) return;

  uploadArea.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handlePhoto(e.target.files[0]);
    }
  });

  // ドラッグ&ドロップ
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handlePhoto(e.dataTransfer.files[0]);
    }
  });
}

// 画像圧縮 (max 400x400, JPEG 60%)
function compressImage(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      const maxSize = 400;
      if (w > maxSize || h > maxSize) {
        if (w > h) {
          h = Math.round(h * maxSize / w);
          w = maxSize;
        } else {
          w = Math.round(w * maxSize / h);
          h = maxSize;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const compressed = canvas.toDataURL('image/jpeg', 0.6);
      callback(compressed);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Store the last compressed photo for saving later
let _lastCompressedPhoto = null;
// Store detected foods from photo analysis
let _photoDetectedFoods = [];

function handlePhoto(file) {
  const uploadArea = document.getElementById('upload-area');
  const analyzing = document.getElementById('analyzing');
  const photoResult = document.getElementById('photo-result');
  const previewImg = document.getElementById('preview-img');

  compressImage(file, function(compressedDataUrl) {
    _lastCompressedPhoto = compressedDataUrl;
    previewImg.src = compressedDataUrl;

    uploadArea.style.display = 'none';
    analyzing.style.display = 'block';

    if (typeof VisionAPI !== 'undefined') {
      VisionAPI.analyze(compressedDataUrl).then(function(result) {
        _photoDetectedFoods = result.foods || [];
        renderPhotoAnalysisResult(result);
        analyzing.style.display = 'none';
        photoResult.style.display = 'block';
      }).catch(function(err) {
        console.error('Vision analysis error:', err);
        _fallbackPhotoAnalysis();
      });
    } else {
      _fallbackPhotoAnalysis();
    }
  });
}

function _fallbackPhotoAnalysis() {
  var analyzing = document.getElementById('analyzing');
  var photoResult = document.getElementById('photo-result');

  setTimeout(function() {
    var randomFood = FoodDB.foods[Math.floor(Math.random() * FoodDB.foods.length)];
    var weight = Math.round((80 + Math.random() * 250));
    var result = FoodDB.calculate(randomFood, weight);
    _photoDetectedFoods = [{
      name: result.name,
      weight_g: result.weight,
      calories: result.cal,
      protein: result.protein,
      fat: result.fat,
      carb: result.carb,
      fiber: result.fiber
    }];
    renderPhotoAnalysisResult({ foods: _photoDetectedFoods, method: 'fallback' });
    analyzing.style.display = 'none';
    photoResult.style.display = 'block';
  }, 1000);
}

function renderPhotoAnalysisResult(result) {
  var foods = result.foods || [];
  var method = result.method || 'unknown';
  var resultDetails = document.querySelector('.result-details');
  if (!resultDetails) return;

  var defaultMealType = Store._getMealType();
  var methodLabel = '';
  if (method === 'api') methodLabel = '<span style="color:var(--green);font-size:0.75rem;">AI API分析</span>';
  else if (method === 'local') methodLabel = '<span style="color:var(--text-sub);font-size:0.75rem;">ローカル分析（色解析）</span>';

  if (foods.length === 0) {
    resultDetails.innerHTML = '<h3>食品を検出できませんでした</h3>' + methodLabel +
      '<div class="result-actions"><button class="btn btn-outline-white btn-sm" onclick="resetUpload()">やり直す</button></div>';
    return;
  }

  var html = methodLabel + '<div id="photo-foods-list">';
  foods.forEach(function(food, idx) {
    html += '<div class="photo-food-item" data-idx="' + idx + '" style="border:1px solid var(--border);border-radius:8px;padding:10px;margin:8px 0;">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
        '<input type="checkbox" id="photo-food-check-' + idx + '" checked class="photo-food-check" style="width:18px;height:18px;">' +
        '<input type="text" value="' + sanitizeHTML(food.name || '').replace(/"/g, '&quot;') + '" id="photo-food-name-' + idx + '" style="flex:1;padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-weight:600;font-size:0.9rem;">' +
      '</div>' +
      '<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;">' +
        '<label style="font-size:0.78rem;color:var(--text-sub);">重量:</label>' +
        '<input type="number" value="' + (food.weight_g || 100) + '" id="photo-food-weight-' + idx + '" min="1" max="2000" style="width:70px;padding:4px 6px;border:1px solid var(--border);border-radius:6px;text-align:center;">' +
        '<span style="font-size:0.78rem;">g</span>' +
      '</div>' +
      '<div style="font-size:0.78rem;color:var(--text-sub);">' +
        (food.calories || 0) + 'kcal / P:' + (food.protein || 0) + 'g F:' + (food.fat || 0) + 'g C:' + (food.carb || 0) + 'g' +
      '</div></div>';
  });
  html += '</div>';

  html += '<div class="meal-type-selector" style="margin-top:8px;">' +
    '<label for="photo-meal-type">食事タイプ:</label>' +
    '<select id="photo-meal-type" class="meal-type-select">' +
      '<option value="朝食"' + (defaultMealType==='朝食'?' selected':'') + '>朝食</option>' +
      '<option value="昼食"' + (defaultMealType==='昼食'?' selected':'') + '>昼食</option>' +
      '<option value="間食"' + (defaultMealType==='間食'?' selected':'') + '>間食</option>' +
      '<option value="夕食"' + (defaultMealType==='夕食'?' selected':'') + '>夕食</option>' +
    '</select></div>' +
    '<div class="result-actions" style="margin-top:10px;">' +
      '<button class="btn btn-primary btn-sm" id="btn-save-photo" onclick="savePhotoResult()">記録する</button>' +
      '<button class="btn btn-outline-white btn-sm" onclick="resetUpload()">やり直す</button>' +
    '</div>';

  resultDetails.innerHTML = html;
}

function savePhotoResult() {
  var photoMealType = document.getElementById('photo-meal-type');
  var mealType = photoMealType ? photoMealType.value : null;
  var savedCount = 0;
  var lastName = '';

  _photoDetectedFoods.forEach(function(food, idx) {
    var checkbox = document.getElementById('photo-food-check-' + idx);
    if (checkbox && !checkbox.checked) return;

    var nameInput = document.getElementById('photo-food-name-' + idx);
    var weightInput = document.getElementById('photo-food-weight-' + idx);

    var name = nameInput ? nameInput.value.trim() : food.name;
    var weight = weightInput ? parseInt(weightInput.value) || 100 : (food.weight_g || 100);

    var mealData = {
      name: name,
      weight: weight,
      cal: food.calories || 0,
      protein: food.protein || 0,
      fat: food.fat || 0,
      carb: food.carb || 0,
      fiber: food.fiber || 0
    };

    var savedMeal = Store.addMeal(mealData, { date: currentViewDate, mealType: mealType });

    if (savedCount === 0 && _lastCompressedPhoto && savedMeal) {
      Store.savePhoto(currentViewDate, savedMeal.id, _lastCompressedPhoto);
    }

    lastName = name;
    savedCount++;
  });

  _lastCompressedPhoto = null;
  _photoDetectedFoods = [];

  resetUpload();
  renderSummary();
  renderMealLog();
  renderNutritionBars();
  renderPhotoGallery();
  renderAdvice();
  checkAndNotifyBadges();

  if (savedCount > 1) {
    showToast(savedCount + '品目を記録しました');
  } else if (savedCount === 1) {
    showToast(lastName + ' を記録しました');
  }
}

function resetUpload() {
  document.getElementById('upload-area').style.display = '';
  document.getElementById('analyzing').style.display = 'none';
  document.getElementById('photo-result').style.display = 'none';
  document.getElementById('file-input').value = '';
  _photoDetectedFoods = [];
}

// --- 食品検索 ---
let searchSelectedIndex = -1;

function initFoodSearch() {
  const input = document.getElementById('food-search');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  // 初期表示: 最近の食品 + 人気の食品
  renderSearchResultsWithRecent(FoodDB.foods.slice(0, 8));

  input.addEventListener('input', () => {
    searchSelectedIndex = -1;
    const query = input.value.trim();
    const foods = FoodDB.search(query);
    if (query) {
      renderSearchResults(foods);
    } else {
      renderSearchResultsWithRecent(FoodDB.foods.slice(0, 8));
    }
  });

  // キーボードナビゲーション
  input.addEventListener('keydown', (e) => {
    const items = results.querySelectorAll('.search-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      searchSelectedIndex = Math.min(searchSelectedIndex + 1, items.length - 1);
      updateSearchSelection(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      searchSelectedIndex = Math.max(searchSelectedIndex - 1, -1);
      updateSearchSelection(items);
    } else if (e.key === 'Enter' && searchSelectedIndex >= 0) {
      e.preventDefault();
      items[searchSelectedIndex].click();
    }
  });

  // カテゴリタブ
  document.querySelectorAll('.search-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.category;
      searchSelectedIndex = -1;
      if (cat === 'all') {
        renderSearchResultsWithRecent(FoodDB.foods.slice(0, 10));
      } else if (cat === 'カスタム') {
        renderSearchResults(Store.getCustomFoods());
      } else {
        renderSearchResults(FoodDB.getByCategory(cat));
      }
      input.value = '';
    });
  });
}

function updateSearchSelection(items) {
  items.forEach((item, i) => {
    if (i === searchSelectedIndex) {
      item.classList.add('search-result-selected');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('search-result-selected');
    }
  });
}

function _foodIdAttr(id) {
  return typeof id === 'string' ? "'" + id + "'" : id;
}

function renderSearchResultsWithRecent(foods) {
  var container = document.getElementById('search-results');
  if (!container) return;

  var html = '';

  // Recent foods section
  var recentFoods = Store.getRecentFoods(8);
  if (recentFoods.length > 0) {
    html += '<div class="recent-foods-section">';
    html += '<div class="recent-foods-label">最近の食品</div>';
    html += '<div class="recent-foods-chips">';
    recentFoods.forEach(function(f) {
      html += '<button class="recent-food-chip" onclick="showAddModal(' + _foodIdAttr(f.id) + ')">' + sanitizeHTML(f.name) + '</button>';
    });
    html += '</div></div>';
    html += '<div style="border-top:1px solid var(--border);margin-bottom:8px;"></div>';
  }

  // Regular food list
  html += _renderFoodList(foods);
  container.innerHTML = html;
}

function _renderFoodList(foods) {
  return foods.map(function(f) {
    var customBadge = f.isCustom ? '<span style="font-size:0.7rem;background:var(--green);color:white;padding:1px 6px;border-radius:10px;margin-left:6px;">カスタム</span>' : '';
    return '<div class="search-item" onclick="showAddModal(' + _foodIdAttr(f.id) + ')">' +
      '<div class="search-item-info">' +
        '<div class="search-item-name">' + sanitizeHTML(f.name) + customBadge + '</div>' +
        '<div class="search-item-detail">' + f.cal + 'kcal / P:' + f.protein + 'g F:' + f.fat + 'g C:' + f.carb + 'g (100gあたり)</div>' +
      '</div>' +
      '<button class="search-item-btn">登録</button></div>';
  }).join('');
}

function renderSearchResults(foods) {
  var container = document.getElementById('search-results');
  if (!container) return;
  container.innerHTML = _renderFoodList(foods);
}

function showAddModal(foodId) {
  const food = FoodDB.getById(foodId);
  if (!food) return;

  // 新規追加モードにリセット
  editMode = false;
  editMealDate = null;
  editMealId = null;

  const modal = document.getElementById('add-modal');
  const modalTitle = document.getElementById('modal-title-text');
  const submitBtn = document.getElementById('modal-submit-btn');

  if (modalTitle) modalTitle.textContent = '食品を追加';
  if (submitBtn) submitBtn.textContent = '記録する';

  document.getElementById('modal-food-name').textContent = food.name;
  document.getElementById('modal-weight').value = 100;
  document.getElementById('modal-food-id').value = foodId;

  // meal type セレクタをデフォルトに
  const mealTypeSelect = document.getElementById('modal-meal-type');
  if (mealTypeSelect) {
    mealTypeSelect.value = Store._getMealType();
  }

  updateModalPreview();
  modal.classList.add('show');
}

function _parseModalFoodId() {
  var rawId = document.getElementById('modal-food-id').value;
  if (rawId && rawId.startsWith('custom_')) return rawId;
  return parseInt(rawId);
}

function updateModalPreview() {
  const foodId = _parseModalFoodId();
  const weight = parseInt(document.getElementById('modal-weight').value) || 100;
  const food = FoodDB.getById(foodId);
  if (!food) return;

  const result = FoodDB.calculate(food, weight);
  document.getElementById('modal-cal').textContent = result.cal + ' kcal';
  document.getElementById('modal-protein').textContent = 'P: ' + result.protein + 'g';
  document.getElementById('modal-fat').textContent = 'F: ' + result.fat + 'g';
  document.getElementById('modal-carb').textContent = 'C: ' + result.carb + 'g';
}

function addFoodFromModal() {
  const foodId = _parseModalFoodId();
  const weight = parseInt(document.getElementById('modal-weight').value) || 100;
  const food = FoodDB.getById(foodId);

  const mealTypeSelect = document.getElementById('modal-meal-type');
  const selectedType = mealTypeSelect ? mealTypeSelect.value : null;

  if (editMode && editMealDate && editMealId) {
    // 編集モード
    let updatedMeal;
    if (food) {
      updatedMeal = FoodDB.calculate(food, weight);
    } else {
      // DB にない食品の場合、重量比率で再計算
      const meals = Store.getMeals(editMealDate);
      const originalMeal = meals.find(m => m.id === editMealId);
      if (originalMeal && originalMeal.weight) {
        const ratio = weight / originalMeal.weight;
        updatedMeal = {
          name: originalMeal.name,
          weight: weight,
          cal: Math.round(originalMeal.cal * ratio),
          protein: Math.round(originalMeal.protein * ratio * 10) / 10,
          fat: Math.round(originalMeal.fat * ratio * 10) / 10,
          carb: Math.round(originalMeal.carb * ratio * 10) / 10,
          fiber: Math.round((originalMeal.fiber || 0) * ratio * 10) / 10,
        };
      } else {
        updatedMeal = { weight: weight };
      }
    }

    if (selectedType) {
      updatedMeal.type = selectedType;
    }

    Store.updateMeal(editMealDate, editMealId, updatedMeal);
    closeModal();
    renderSummary();
    renderMealLog();
    renderNutritionBars();
    renderAdvice();
    checkAndNotifyBadges();
    showToast(updatedMeal.name + ' を更新しました');
  } else {
    // 新規追加モード
    if (!food) return;
    const result = FoodDB.calculate(food, weight);
    Store.addMeal(result, { date: currentViewDate, mealType: selectedType });
    closeModal();
    renderSummary();
    renderMealLog();
    renderNutritionBars();
    renderAdvice();
    checkAndNotifyBadges();
    showToast(result.name + ' を記録しました');
  }
}

function closeModal() {
  document.getElementById('add-modal').classList.remove('show');
  editMode = false;
  editMealDate = null;
  editMealId = null;
}

// --- 体重記録 ---
function initWeightForm() {
  const form = document.getElementById('weight-form');
  if (!form) return;

  // 最新の体重を表示
  const weights = Store.getWeights();
  if (weights.length > 0) {
    const latest = weights[weights.length - 1];
    document.getElementById('weight-input').value = latest.weight;
    if (latest.bodyFat) {
      document.getElementById('bodyfat-input').value = latest.bodyFat;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const weight = document.getElementById('weight-input').value;
    const bodyFat = document.getElementById('bodyfat-input').value;
    if (!weight) return;

    Store.addWeight(weight, bodyFat);
    renderWeightHistory();
    checkAndNotifyBadges();
    showToast('体重を記録しました');
  });
}

// --- 体重チャート期間セレクタ ---
function initWeightPeriodSelector() {
  document.querySelectorAll('.weight-period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.weight-period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentWeightPeriod = parseInt(btn.dataset.days);
      renderWeightHistory();
    });
  });
}

// Chart.js instance for dashboard weight chart
let dashboardWeightChartInstance = null;

function _getDashboardChartColors() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    text: dark ? '#e0e0e0' : '#3A3A3A',
    textSub: dark ? '#aaa' : '#777',
    gridLine: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    blue: '#3A8DC5',
    bluePale: 'rgba(58,141,197,0.2)',
  };
}

function renderWeightHistory() {
  const canvas = document.getElementById('weight-chart-canvas');
  if (!canvas) return;

  if (dashboardWeightChartInstance) {
    dashboardWeightChartInstance.destroy();
    dashboardWeightChartInstance = null;
  }

  const allWeights = Store.getWeights();
  const days = currentWeightPeriod;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  let weights = allWeights.filter(w => w.date >= cutoffStr).sort((a, b) => a.date.localeCompare(b.date));

  if (weights.length === 0) {
    const ctx = canvas.getContext('2d');
    const colors = _getDashboardChartColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = colors.textSub;
    ctx.textAlign = 'center';
    ctx.fillText('体重を記録するとグラフが表示されます', canvas.width / 2, canvas.height / 2);
    return;
  }

  const colors = _getDashboardChartColors();
  const labels = weights.map(w => {
    const d = new Date(w.date);
    return (d.getMonth() + 1) + '/' + d.getDate();
  });
  const weightData = weights.map(w => w.weight);

  dashboardWeightChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '体重 (kg)',
        data: weightData,
        borderColor: colors.blue,
        backgroundColor: colors.bluePale,
        pointBackgroundColor: colors.blue,
        pointRadius: weights.length <= 10 ? 4 : 2,
        tension: 0.3,
        fill: true,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ctx.parsed.y + ' kg'
          }
        }
      },
      scales: {
        x: {
          ticks: { color: colors.textSub, font: { size: 10 }, maxRotation: 45, maxTicksLimit: 10 },
          grid: { color: colors.gridLine }
        },
        y: {
          ticks: { color: colors.textSub, font: { size: 10 }, callback: v => v + 'kg' },
          grid: { color: colors.gridLine }
        }
      }
    }
  });
}

// 配列を均等にサンプリング
function _sampleArray(arr, maxCount) {
  if (arr.length <= maxCount) return arr;
  const result = [];
  const step = (arr.length - 1) / (maxCount - 1);
  for (let i = 0; i < maxCount; i++) {
    result.push(arr[Math.round(i * step)]);
  }
  return result;
}

// --- ユーティリティ ---
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
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

// --- 運動記録 ---
function initExercise() {
  const select = document.getElementById('exercise-select');
  if (!select) return;

  const exercises = ExerciseDB.getAll();
  exercises.forEach(ex => {
    const opt = document.createElement('option');
    opt.value = ex.id;
    opt.textContent = ex.name + ' (' + ex.calPerMin + ' kcal/分)';
    select.appendChild(opt);
  });

  renderExerciseLog();
  renderNetCalories();
}

function addExercise() {
  const select = document.getElementById('exercise-select');
  const durationInput = document.getElementById('exercise-duration');
  if (!select || !durationInput) return;

  const exId = parseInt(select.value);
  const duration = parseInt(durationInput.value);
  if (!exId || !duration || duration < 1) {
    showToast('運動と時間を入力してください');
    return;
  }

  const exerciseData = ExerciseDB.getAll().find(e => e.id === exId);
  if (!exerciseData) return;

  // Get user's latest weight for personalized calorie calculation
  const weights = Store.getWeights();
  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : 65;
  const calories = ExerciseDB.calculate(exerciseData, duration, latestWeight);

  Store.addExercise({
    name: exerciseData.name,
    duration: duration,
    calories: calories,
    date: currentViewDate
  });

  select.value = '';
  durationInput.value = '';

  renderExerciseLog();
  renderNetCalories();
  checkAndNotifyBadges();
  showToast(exerciseData.name + ' ' + duration + '分を記録しました');
}

function renderExerciseLog() {
  const container = document.getElementById('exercise-log');
  const totalEl = document.getElementById('exercise-total');
  if (!container) return;

  const exercises = Store.getExercises(currentViewDate);
  const total = Store.getDayExerciseTotal(currentViewDate);

  if (totalEl) totalEl.textContent = total;

  if (exercises.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:var(--text-light); padding:16px; font-size:0.85rem;">まだ運動が記録されていません</div>';
    return;
  }

  container.innerHTML = exercises.map(e => `
    <div class="exercise-item">
      <div class="exercise-info">
        <span class="exercise-name">${sanitizeHTML(e.name)}</span>
        <span class="exercise-detail">${e.duration}分 ・ ${sanitizeHTML(e.time)}</span>
      </div>
      <span class="exercise-cal">${e.calories} kcal</span>
      <button class="meal-delete" onclick="deleteExercise('${sanitizeHTML(e.date)}', ${e.id})" title="削除">&times;</button>
    </div>
  `).join('');
}

function deleteExercise(date, id) {
  Store.deleteExercise(date, id);
  renderExerciseLog();
  renderNetCalories();
}

function renderNetCalories() {
  const el = document.getElementById('net-calories-display');
  if (!el) return;

  const intake = Store.getDayTotal(currentViewDate).cal;
  const burned = Store.getDayExerciseTotal(currentViewDate);
  const net = intake - burned;

  el.innerHTML = '摂取 ' + intake.toLocaleString() + ' - 消費 ' + burned.toLocaleString() + ' = ネット <strong>' + net.toLocaleString() + '</strong> kcal';
}

// --- 水分摂取 ---
function initWater() {
  renderWaterIntake();
}

function addWater(amount) {
  Store.addWater(amount);
  renderWaterIntake();
  checkAndNotifyBadges();
  showToast(amount + 'ml を記録しました');
}

function renderWaterIntake() {
  const fillEl = document.getElementById('water-fill');
  const textEl = document.getElementById('water-text');
  if (!fillEl || !textEl) return;

  const intake = Store.getWaterIntake(currentViewDate);
  const goal = Store.getWaterGoal();
  const pct = Math.min((intake / goal) * 100, 100);

  fillEl.style.width = pct + '%';
  textEl.textContent = intake + ' / ' + goal + ' ml (' + Math.round(pct) + '%)';
}

// --- AIアドバイス ---
function renderAdvice() {
  if (typeof Advisor === 'undefined') return;

  const dayTotal = Store.getDayTotal(currentViewDate);
  const goals = Store.getGoals();
  const score = parseInt(document.getElementById('health-score')?.textContent) || 0;

  // 挨拶
  const greetingEl = document.getElementById('advice-greeting');
  if (greetingEl) {
    greetingEl.textContent = Advisor.getGreeting() + '！';
  }

  // スコアコメント
  const scoreCommentEl = document.getElementById('advice-score-comment');
  if (scoreCommentEl) {
    scoreCommentEl.textContent = Advisor.getScoreComment(score);
  }

  // アドバイスリスト
  const adviceList = document.getElementById('advice-list');
  if (adviceList) {
    const advices = Advisor.analyze(dayTotal, goals, currentViewDate);
    if (advices.length > 0) {
      adviceList.innerHTML = advices.map(a => `
        <div class="advice-item advice-${sanitizeHTML(a.type)}">
          <span class="advice-item-icon">${a.icon}</span>
          <span class="advice-item-text">${sanitizeHTML(a.text)}</span>
        </div>
      `).join('');
    } else {
      adviceList.innerHTML = '<div class="advice-item advice-success"><span class="advice-item-icon">✅</span><span class="advice-item-text">現在のところ問題ありません。この調子で！</span></div>';
    }
  }

  // おすすめ食品
  const suggestionsContainer = document.getElementById('advice-suggestions');
  const foodSuggestions = document.getElementById('food-suggestions');
  if (suggestionsContainer && foodSuggestions) {
    const suggestions = Advisor.suggestFoods(dayTotal, goals);
    if (suggestions.length > 0) {
      suggestionsContainer.style.display = '';
      foodSuggestions.innerHTML = suggestions.map(s => `
        <div class="suggestion-item" onclick="showAddModal(${s.food.id})">
          <div class="suggestion-info">
            <span class="suggestion-name">${sanitizeHTML(s.food.name)}</span>
            <span class="suggestion-reason">${sanitizeHTML(s.reason)}</span>
          </div>
          <span class="suggestion-cal">${s.food.cal}kcal/100g</span>
        </div>
      `).join('');
    } else {
      suggestionsContainer.style.display = 'none';
    }
  }

  // 日替わりTip
  const tipEl = document.getElementById('daily-tip');
  if (tipEl) {
    tipEl.innerHTML = '<span class="tip-icon">💡</span> <span class="tip-text">' + sanitizeHTML(Advisor.getDailyTip()) + '</span>';
  }
}

// --- ゲーミフィケーション ---
function initGamification() {
  renderGamification();
  checkAndNotifyBadges();
}

function renderGamification() {
  if (typeof Gamification === 'undefined') return;

  var levelInfo = Gamification.getLevel();
  setText('level-badge', 'Lv.' + levelInfo.level);
  setText('level-name', levelInfo.name);

  var levelBadgeEl = document.getElementById('level-badge');
  if (levelBadgeEl) {
    var colors = ['#9E9E9E', '#4CAF50', '#2196F3', '#FF9800', '#E91E63'];
    levelBadgeEl.style.background = colors[Math.min(levelInfo.level - 1, 4)];
  }

  var stats = Gamification.getStats();
  setText('streak-count', stats.streak);

  var challengeProgress = Gamification.getChallengeProgress();
  setText('challenge-name', challengeProgress.challenge.name);
  var challengeFillEl = document.getElementById('challenge-fill');
  if (challengeFillEl) {
    challengeFillEl.style.width = challengeProgress.percent + '%';
  }
}

function showBadgesModal() {
  var modal = document.getElementById('badges-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  var earned = Gamification.getEarnedBadges();
  var grid = document.getElementById('badges-grid');
  var levelSummary = document.getElementById('badges-level-summary');
  var challengeDetail = document.getElementById('challenge-detail');

  var levelInfo = Gamification.getLevel();
  if (levelSummary) {
    levelSummary.innerHTML = '<div class="badges-level-info">Lv.' + levelInfo.level + ' ' + levelInfo.name + ' - ' + levelInfo.badgeCount + '/' + Gamification.badges.length + ' バッジ獲得</div>';
  }

  if (grid) {
    grid.innerHTML = Gamification.badges.map(function(badge) {
      var isEarned = earned.includes(badge.id);
      return '<div class="badge-card ' + (isEarned ? 'earned' : 'locked') + '">' +
        '<div class="badge-icon">' + (isEarned ? badge.icon : '🔒') + '</div>' +
        '<div class="badge-name">' + sanitizeHTML(badge.name) + '</div>' +
        '<div class="badge-desc">' + sanitizeHTML(badge.description) + '</div>' +
      '</div>';
    }).join('');
  }

  if (challengeDetail) {
    var cp = Gamification.getChallengeProgress();
    challengeDetail.innerHTML =
      '<div class="challenge-detail-card">' +
        '<div class="challenge-detail-name">' + sanitizeHTML(cp.challenge.name) + '</div>' +
        '<div class="challenge-detail-desc">' + sanitizeHTML(cp.challenge.description) + '</div>' +
        '<div class="challenge-progress-bar">' +
          '<div class="challenge-progress-fill" style="width:' + cp.percent + '%"></div>' +
        '</div>' +
        '<div class="challenge-progress-text">' + cp.progress + ' / ' + cp.target + ' ' + sanitizeHTML(cp.challenge.unit) + ' (' + cp.percent + '%)</div>' +
      '</div>';
  }
}

function closeBadgesModal() {
  var modal = document.getElementById('badges-modal');
  if (modal) modal.style.display = 'none';
}

function showChallengeDetail() {
  showBadgesModal();
}

function showBadgeNotification(badge) {
  var notif = document.getElementById('badge-notification');
  if (!notif) return;

  document.getElementById('badge-notification-icon').textContent = badge.icon;
  document.getElementById('badge-notification-title').textContent = badge.name + ' 獲得！';
  document.getElementById('badge-notification-desc').textContent = badge.description;

  notif.style.display = 'block';
  requestAnimationFrame(function() {
    notif.classList.add('show');
  });

  setTimeout(function() {
    notif.classList.remove('show');
    setTimeout(function() {
      notif.style.display = 'none';
    }, 400);
  }, 3000);
}

function checkAndNotifyBadges() {
  if (typeof Gamification === 'undefined') return;

  var newBadges = Gamification.getNewBadges();
  if (newBadges.length > 0) {
    newBadges.forEach(function(badgeId, idx) {
      var badge = Gamification.badges.find(function(b) { return b.id === badgeId; });
      if (badge) {
        setTimeout(function() {
          showBadgeNotification(badge);
          Gamification.markBadgeShown(badgeId);
        }, idx * 3500);
      }
    });
  }

  renderGamification();
}

// --- バーコードスキャナー ---
let _barcodeDetectedHandler = null;

function startBarcodeScanner() {
  if (typeof Quagga === 'undefined') {
    showToast('バーコードスキャナーを読み込めません', 'error');
    return;
  }

  // Reset previous state
  document.getElementById('barcode-result').style.display = 'none';
  document.getElementById('barcode-manual-form').style.display = 'none';

  Quagga.init({
    inputStream: {
      type: 'LiveStream',
      target: document.querySelector('#barcode-viewport'),
      constraints: { facingMode: 'environment' }
    },
    decoder: {
      readers: ['ean_reader', 'ean_8_reader']
    }
  }, function(err) {
    if (err) {
      showToast('カメラを起動できません');
      console.error(err);
      return;
    }
    Quagga.start();
    document.getElementById('barcode-start-btn').style.display = 'none';
    document.getElementById('barcode-stop-btn').style.display = '';
  });

  // Remove previous handler if any
  if (_barcodeDetectedHandler) {
    Quagga.offDetected(_barcodeDetectedHandler);
  }

  _barcodeDetectedHandler = function(result) {
    const code = result.codeResult.code;
    stopBarcodeScanner();
    lookupBarcode(code);
  };

  Quagga.onDetected(_barcodeDetectedHandler);
}

function stopBarcodeScanner() {
  if (typeof Quagga !== 'undefined') {
    try { Quagga.stop(); } catch(e) {}
  }
  document.getElementById('barcode-start-btn').style.display = '';
  document.getElementById('barcode-stop-btn').style.display = 'none';
}

function lookupBarcode(code) {
  document.getElementById('barcode-value').textContent = code;
  document.getElementById('barcode-result').style.display = 'block';

  const product = (typeof BarcodeDB !== 'undefined') ? BarcodeDB.lookup(code) : null;
  const infoEl = document.getElementById('barcode-food-info');

  if (product) {
    document.getElementById('barcode-manual-form').style.display = 'none';
    infoEl.innerHTML = `
      <div class="barcode-product-card">
        <h4>${sanitizeHTML(product.name)}</h4>
        <div class="barcode-nutrients">
          <div class="rn-item"><span class="rn-label">カロリー</span><span class="rn-value">${product.cal}kcal</span></div>
          <div class="rn-item"><span class="rn-label">タンパク質</span><span class="rn-value">${product.protein}g</span></div>
          <div class="rn-item"><span class="rn-label">脂質</span><span class="rn-value">${product.fat}g</span></div>
          <div class="rn-item"><span class="rn-label">炭水化物</span><span class="rn-value">${product.carb}g</span></div>
        </div>
        <div class="meal-type-selector" style="margin-top:12px">
          <label for="barcode-meal-type">食事タイプ:</label>
          <select id="barcode-meal-type" class="meal-type-select">
            <option value="朝食">朝食</option>
            <option value="昼食">昼食</option>
            <option value="間食">間食</option>
            <option value="夕食">夕食</option>
          </select>
        </div>
        <div class="barcode-product-actions">
          <button class="btn btn-primary btn-sm" onclick="saveBarcodeProduct('${sanitizeHTML(code)}')">記録する</button>
          <button class="btn btn-secondary btn-sm" onclick="resetBarcodeScanner()">スキャンし直す</button>
        </div>
      </div>
    `;

    // Set default meal type
    const mealTypeEl = document.getElementById('barcode-meal-type');
    if (mealTypeEl) mealTypeEl.value = Store._getMealType();
  } else {
    infoEl.innerHTML = '';
    // Show manual entry form
    document.getElementById('barcode-manual-form').style.display = 'block';
    const manualMealType = document.getElementById('barcode-manual-meal-type');
    if (manualMealType) manualMealType.value = Store._getMealType();
  }
}

function saveBarcodeProduct(code) {
  const product = BarcodeDB.lookup(code);
  if (!product) return;

  const mealTypeEl = document.getElementById('barcode-meal-type');
  const mealType = mealTypeEl ? mealTypeEl.value : Store._getMealType();

  const meal = {
    name: product.name,
    weight: product.weight,
    cal: product.cal,
    protein: product.protein,
    fat: product.fat,
    carb: product.carb,
    fiber: product.fiber
  };

  Store.addMeal(meal, { date: currentViewDate, mealType: mealType });
  renderSummary();
  renderMealLog();
  renderNutritionBars();
  renderAdvice();
  checkAndNotifyBadges();
  resetBarcodeScanner();
  showToast(product.name + ' を記録しました');
}

function saveBarcodeManual() {
  const name = document.getElementById('barcode-manual-name').value.trim();
  if (!name) {
    showToast('商品名を入力してください');
    return;
  }

  const mealTypeEl = document.getElementById('barcode-manual-meal-type');
  const mealType = mealTypeEl ? mealTypeEl.value : Store._getMealType();

  const meal = {
    name: name,
    weight: parseInt(document.getElementById('barcode-manual-weight').value) || 100,
    cal: parseInt(document.getElementById('barcode-manual-cal').value) || 0,
    protein: parseFloat(document.getElementById('barcode-manual-protein').value) || 0,
    fat: parseFloat(document.getElementById('barcode-manual-fat').value) || 0,
    carb: parseFloat(document.getElementById('barcode-manual-carb').value) || 0,
    fiber: parseFloat(document.getElementById('barcode-manual-fiber').value) || 0
  };

  Store.addMeal(meal, { date: currentViewDate, mealType: mealType });
  renderSummary();
  renderMealLog();
  renderNutritionBars();
  renderAdvice();
  checkAndNotifyBadges();
  resetBarcodeScanner();
  showToast(name + ' を記録しました');
}

function resetBarcodeScanner() {
  document.getElementById('barcode-result').style.display = 'none';
  document.getElementById('barcode-manual-form').style.display = 'none';
  document.getElementById('barcode-food-info').innerHTML = '';

  // Reset manual form fields
  ['barcode-manual-name', 'barcode-manual-cal', 'barcode-manual-protein',
   'barcode-manual-fat', 'barcode-manual-carb', 'barcode-manual-fiber', 'barcode-manual-weight'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
}

// --- フォトギャラリー ---
function renderPhotoGallery() {
  const container = document.getElementById('photo-gallery');
  if (!container) return;

  const photos = Store.getPhotoGallery(7);

  if (photos.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:var(--text-light); padding:24px; font-size:0.85rem;">写真を撮影して記録すると、ここにギャラリーが表示されます</div>';
    return;
  }

  container.innerHTML = photos.map(function(p) {
    const d = new Date(p.date + 'T00:00:00');
    const dateLabel = (d.getMonth() + 1) + '/' + d.getDate();
    const safeName = sanitizeHTML(p.name);
    const safeDate = sanitizeHTML(p.date);
    return '<div class="gallery-item">' +
      '<div class="gallery-thumb" onclick="openLightbox(\'' + p.image.replace(/'/g, "\\'") + '\', \'' + safeName.replace(/'/g, "\\'") + '\', \'' + safeDate + '\')">' +
        '<img src="' + p.image + '" alt="' + safeName + '" loading="lazy">' +
      '</div>' +
      '<div class="gallery-info">' +
        '<span class="gallery-name">' + safeName + '</span>' +
        '<span class="gallery-date">' + dateLabel + '</span>' +
      '</div>' +
      '<button class="gallery-delete" onclick="deleteGalleryPhoto(\'' + safeDate + '\', ' + p.mealId + ')" title="削除">&times;</button>' +
    '</div>';
  }).join('');
}

function deleteGalleryPhoto(date, mealId) {
  Store.deletePhoto(date, mealId);
  renderPhotoGallery();
  showToast('写真を削除しました');
}

// --- ライトボックス ---
function openLightbox(imageSrc, name, date) {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  document.getElementById('lightbox-img').src = imageSrc;
  document.getElementById('lightbox-name').textContent = name;
  const d = new Date(date + 'T00:00:00');
  document.getElementById('lightbox-date').textContent = d.toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  lightbox.style.display = 'flex';
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) lightbox.style.display = 'none';
}

// --- カスタム食品登録 ---
function showCustomFoodForm() {
  var modal = document.getElementById('custom-food-modal');
  if (modal) modal.classList.add('show');
}

function closeCustomFoodModal() {
  var modal = document.getElementById('custom-food-modal');
  if (modal) modal.classList.remove('show');
  // Reset form
  ['custom-food-name','custom-food-cal','custom-food-protein','custom-food-fat','custom-food-carb','custom-food-fiber'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  var catSel = document.getElementById('custom-food-category');
  if (catSel) catSel.selectedIndex = 0;
}

function saveCustomFood() {
  var name = (document.getElementById('custom-food-name').value || '').trim();
  if (!name) {
    showToast('食品名を入力してください');
    return;
  }

  var food = {
    name: name,
    category: document.getElementById('custom-food-category').value || 'その他',
    cal: parseInt(document.getElementById('custom-food-cal').value) || 0,
    protein: parseFloat(document.getElementById('custom-food-protein').value) || 0,
    fat: parseFloat(document.getElementById('custom-food-fat').value) || 0,
    carb: parseFloat(document.getElementById('custom-food-carb').value) || 0,
    fiber: parseFloat(document.getElementById('custom-food-fiber').value) || 0
  };

  Store.addCustomFood(food);
  closeCustomFoodModal();
  showToast(name + ' を登録しました');

  // Refresh search results
  var input = document.getElementById('food-search');
  if (input && input.value.trim()) {
    renderSearchResults(FoodDB.search(input.value.trim()));
  } else {
    renderSearchResultsWithRecent(FoodDB.foods.slice(0, 8));
  }
}

// --- 睡眠記録 ---
let currentSleepQuality = 3;

function initSleep() {
  // Load today's sleep data if it exists
  const sleepData = Store.getSleep(currentViewDate);
  if (sleepData) {
    const bedtimeEl = document.getElementById('sleep-bedtime');
    const wakeupEl = document.getElementById('sleep-wakeup');
    if (bedtimeEl && sleepData.bedtime) bedtimeEl.value = sleepData.bedtime;
    if (wakeupEl && sleepData.wakeup) wakeupEl.value = sleepData.wakeup;
    if (sleepData.quality) {
      currentSleepQuality = sleepData.quality;
    }
  }
  updateSleepQualityStars();
  renderSleepSummary();
}

function setSleepQuality(n) {
  currentSleepQuality = n;
  updateSleepQualityStars();
}

function updateSleepQualityStars() {
  const stars = document.querySelectorAll('#sleep-quality-stars .star');
  stars.forEach((star, idx) => {
    if (idx < currentSleepQuality) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

function calculateSleepDuration(bedtime, wakeup) {
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = wakeup.split(':').map(Number);
  let bedMinutes = bH * 60 + bM;
  let wakeMinutes = wH * 60 + wM;
  // Handle crossing midnight
  if (wakeMinutes <= bedMinutes) {
    wakeMinutes += 24 * 60;
  }
  return Math.round((wakeMinutes - bedMinutes) / 60 * 10) / 10;
}

function saveSleep() {
  const bedtimeEl = document.getElementById('sleep-bedtime');
  const wakeupEl = document.getElementById('sleep-wakeup');
  if (!bedtimeEl || !wakeupEl) return;

  const bedtime = bedtimeEl.value;
  const wakeup = wakeupEl.value;
  if (!bedtime || !wakeup) {
    showToast('就寝時間と起床時間を入力してください');
    return;
  }

  const duration = calculateSleepDuration(bedtime, wakeup);

  Store.saveSleep(currentViewDate, {
    bedtime: bedtime,
    wakeup: wakeup,
    duration: duration,
    quality: currentSleepQuality
  });

  renderSleepSummary();
  showToast('睡眠を記録しました（' + duration + '時間）');
}

function renderSleepSummary() {
  const container = document.getElementById('sleep-summary');
  if (!container) return;

  const recentSleep = Store.getRecentSleep(7);
  const sleepWithData = recentSleep.filter(s => s.duration);

  if (sleepWithData.length === 0) {
    container.innerHTML = '<div class="sleep-summary-empty">まだ睡眠データがありません</div>';
    return;
  }

  const avgDuration = Math.round(sleepWithData.reduce((sum, s) => sum + s.duration, 0) / sleepWithData.length * 10) / 10;
  const avgQuality = Math.round(sleepWithData.reduce((sum, s) => sum + (s.quality || 0), 0) / sleepWithData.length * 10) / 10;

  let qualityStars = '';
  for (let i = 1; i <= 5; i++) {
    qualityStars += '<span class="star-display ' + (i <= Math.round(avgQuality) ? 'filled' : '') + '">&#9733;</span>';
  }

  // Build mini chart for the week
  let chartHtml = '<div class="sleep-chart">';
  recentSleep.forEach(s => {
    const d = new Date(s.date + 'T00:00:00');
    const dayLabel = (d.getMonth() + 1) + '/' + d.getDate();
    const barHeight = s.duration ? Math.min((s.duration / 10) * 100, 100) : 0;
    const barColor = s.duration >= 7 ? 'var(--green)' : s.duration >= 5 ? '#f0ad4e' : '#e55';
    chartHtml += '<div class="sleep-chart-bar-wrapper">';
    chartHtml += '<div class="sleep-chart-bar" style="height:' + barHeight + '%;background:' + barColor + ';" title="' + (s.duration || 0) + '時間"></div>';
    chartHtml += '<span class="sleep-chart-label">' + dayLabel + '</span>';
    chartHtml += '</div>';
  });
  chartHtml += '</div>';

  container.innerHTML =
    '<div class="sleep-avg">' +
      '<div class="sleep-avg-item">' +
        '<span class="sleep-avg-label">7日間の平均睡眠</span>' +
        '<span class="sleep-avg-value">' + avgDuration + '時間</span>' +
      '</div>' +
      '<div class="sleep-avg-item">' +
        '<span class="sleep-avg-label">平均睡眠の質</span>' +
        '<span class="sleep-avg-stars">' + qualityStars + '</span>' +
      '</div>' +
    '</div>' + chartHtml;
}

// ログアウト
function handleLogout() {
  Auth.logout();
}

// グローバルに公開
window.deleteMeal = deleteMeal;
window.editMeal = editMeal;
window.savePhotoResult = savePhotoResult;
window.resetUpload = resetUpload;
window.showAddModal = showAddModal;
window.updateModalPreview = updateModalPreview;
window.addFoodFromModal = addFoodFromModal;
window.closeModal = closeModal;
window.handleLogout = handleLogout;
window.addExercise = addExercise;
window.deleteExercise = deleteExercise;
window.addWater = addWater;
window.saveSleep = saveSleep;
window.setSleepQuality = setSleepQuality;
window.navigateDate = navigateDate;
window.navigateToToday = navigateToToday;
window.showBadgesModal = showBadgesModal;
window.closeBadgesModal = closeBadgesModal;
window.showChallengeDetail = showChallengeDetail;
window.startBarcodeScanner = startBarcodeScanner;
window.stopBarcodeScanner = stopBarcodeScanner;
window.saveBarcodeProduct = saveBarcodeProduct;
window.saveBarcodeManual = saveBarcodeManual;
window.resetBarcodeScanner = resetBarcodeScanner;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.deleteGalleryPhoto = deleteGalleryPhoto;
window.showCustomFoodForm = showCustomFoodForm;
window.closeCustomFoodModal = closeCustomFoodModal;
window.saveCustomFood = saveCustomFood;
window.shareDailyReport = shareDailyReport;
window.copyShareText = copyShareText;
window.shareToTwitter = shareToTwitter;
window.shareToLine = shareToLine;

// ============================
// Social Sharing
// ============================

function computeShareHealthScore(total, goals) {
  if (total.cal === 0) return 0;
  const calcFactor = (current, goal) => {
    if (goal === 0) return 100;
    const ratio = current / goal;
    const distance = Math.abs(1 - ratio);
    return Math.max(0, Math.round(100 * (1 - distance)));
  };
  const score = Math.round(
    calcFactor(total.cal, goals.cal) * 0.30 +
    calcFactor(total.protein, goals.protein) * 0.20 +
    calcFactor(total.fat, goals.fat) * 0.15 +
    calcFactor(total.carb, goals.carb) * 0.20 +
    calcFactor(total.fiber, goals.fiber) * 0.15
  );
  return Math.max(0, Math.min(100, score));
}

async function shareDailyReport() {
  const total = Store.getDayTotal(currentViewDate);
  const goals = Store.getGoals();
  const meals = Store.getMeals(currentViewDate);
  const score = computeShareHealthScore(total, goals);

  const text = '\u3010BodyPilot \u98DF\u4E8B\u8A18\u9332\u3011' + currentViewDate + '\n' +
    '\uD83D\uDD25 \u30AB\u30ED\u30EA\u30FC: ' + total.cal + ' / ' + goals.cal + ' kcal\n' +
    '\uD83D\uDCAA \u30BF\u30F3\u30D1\u30AF\u8CEA: ' + total.protein + 'g\n' +
    '\uD83C\uDF7D\uFE0F \u98DF\u4E8B\u6570: ' + meals.length + '\u98DF\n' +
    '\uD83D\uDCCA \u30D8\u30EB\u30B9\u30B9\u30B3\u30A2: ' + score + '\u70B9\n' +
    '#BodyPilot #\u5065\u5EB7\u7BA1\u7406';

  if (navigator.share) {
    try {
      await navigator.share({ title: 'BodyPilot \u98DF\u4E8B\u8A18\u9332', text: text });
    } catch(e) {
      // User cancelled or not supported
      fallbackShare(text);
    }
  } else {
    fallbackShare(text);
  }
}

function fallbackShare(text) {
  const modal = document.getElementById('share-modal');
  document.getElementById('share-text').value = text;
  modal.style.display = 'flex';
}

function copyShareText() {
  const text = document.getElementById('share-text').value;
  navigator.clipboard.writeText(text).then(() => {
    showToast('\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F');
  }).catch(() => {
    // Fallback for older browsers
    const textarea = document.getElementById('share-text');
    textarea.select();
    document.execCommand('copy');
    showToast('\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F');
  });
}

function shareToTwitter() {
  const text = document.getElementById('share-text').value;
  window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text), '_blank');
}

function shareToLine() {
  const text = document.getElementById('share-text').value;
  window.open('https://social-plugins.line.me/lineit/share?url=&text=' + encodeURIComponent(text), '_blank');
}
