// ============================
// ダッシュボード
// ============================

document.addEventListener('DOMContentLoaded', () => {
  Auth.init();

  // ログインチェック
  setTimeout(() => {
    if (!Auth.isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    }
    initDashboard();
  }, 100);
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
}

// --- 日付表示 ---
function renderDate() {
  const el = document.getElementById('today-date');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleDateString('ja-JP', {
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
  const total = Store.getDayTotal();
  const goals = Store.getGoals();

  setText('sum-cal', total.cal.toLocaleString());
  setText('sum-cal-goal', '/ ' + goals.cal.toLocaleString() + ' kcal');
  setText('sum-protein', total.protein);
  setText('sum-protein-goal', '/ ' + goals.protein + ' g');
  setText('sum-fat', total.fat);
  setText('sum-fat-goal', '/ ' + goals.fat + ' g');
  setText('sum-carb', total.carb);
  setText('sum-carb-goal', '/ ' + goals.carb + ' g');

  // 健康スコア計算
  const calRatio = Math.min(total.cal / goals.cal, 1.2);
  const proteinRatio = Math.min(total.protein / goals.protein, 1.2);
  const fatRatio = Math.min(total.fat / goals.fat, 1.2);
  const carbRatio = Math.min(total.carb / goals.carb, 1.2);

  let score = 0;
  if (total.cal > 0) {
    score = Math.round(
      (1 - Math.abs(1 - calRatio)) * 25 +
      (1 - Math.abs(1 - proteinRatio)) * 25 +
      (1 - Math.abs(1 - fatRatio)) * 25 +
      (1 - Math.abs(1 - carbRatio)) * 25
    );
    score = Math.max(0, Math.min(100, score));
  }
  setText('health-score', score);
}

// --- 食事ログ ---
function renderMealLog() {
  const meals = Store.getMeals();
  const container = document.getElementById('meal-log');
  if (!container) return;

  if (meals.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:var(--text-light); padding:24px; font-size:0.9rem;">まだ食事が記録されていません。<br>写真を撮影するか、食品を検索して記録しましょう。</div>';
    return;
  }

  const typeClass = { '朝食': '', '昼食': 'lunch', '夕食': 'dinner', '間食': 'snack' };

  container.innerHTML = meals.map(m => `
    <div class="meal-item" data-id="${m.id}">
      <span class="meal-type ${typeClass[m.type] || ''}">${m.type}</span>
      <div class="meal-info">
        <div class="meal-name">${m.name}</div>
        <div class="meal-detail">${m.weight}g ・ ${m.time}</div>
      </div>
      <div class="meal-cal">${m.cal} kcal</div>
      <button class="meal-delete" onclick="deleteMeal('${m.date}', ${m.id})" title="削除">×</button>
    </div>
  `).join('');
}

function deleteMeal(date, id) {
  Store.deleteMeal(date, id);
  renderSummary();
  renderMealLog();
  renderNutritionBars();
}

// --- 栄養バランスバー ---
function renderNutritionBars() {
  const total = Store.getDayTotal();
  const goals = Store.getGoals();

  setBarWidth('bar-protein', total.protein, goals.protein);
  setBarWidth('bar-fat', total.fat, goals.fat);
  setBarWidth('bar-carb', total.carb, goals.carb);
  setBarWidth('bar-fiber', total.fiber, goals.fiber);

  setText('val-protein', total.protein + '/' + goals.protein + 'g');
  setText('val-fat', total.fat + '/' + goals.fat + 'g');
  setText('val-carb', total.carb + '/' + goals.carb + 'g');
  setText('val-fiber', total.fiber + '/' + goals.fiber + 'g');
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

function handlePhoto(file) {
  const uploadArea = document.getElementById('upload-area');
  const analyzing = document.getElementById('analyzing');
  const photoResult = document.getElementById('photo-result');
  const previewImg = document.getElementById('preview-img');

  // プレビュー表示
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
  };
  reader.readAsDataURL(file);

  uploadArea.style.display = 'none';
  analyzing.style.display = 'block';

  // デモ: ランダムな食品を推定結果として表示
  setTimeout(() => {
    const randomFood = FoodDB.foods[Math.floor(Math.random() * FoodDB.foods.length)];
    const weight = Math.round((80 + Math.random() * 250));
    const result = FoodDB.calculate(randomFood, weight);

    document.getElementById('photo-food-name').textContent = result.name;
    document.getElementById('photo-food-weight').textContent = result.weight + 'g';
    document.getElementById('photo-food-cal').textContent = result.cal + 'kcal';
    document.getElementById('photo-food-protein').textContent = result.protein + 'g';
    document.getElementById('photo-food-fat').textContent = result.fat + 'g';
    document.getElementById('photo-food-carb').textContent = result.carb + 'g';

    // データをボタンに保存
    document.getElementById('btn-save-photo').dataset.food = JSON.stringify(result);

    analyzing.style.display = 'none';
    photoResult.style.display = 'block';
  }, 1500);
}

function savePhotoResult() {
  const data = JSON.parse(document.getElementById('btn-save-photo').dataset.food);
  Store.addMeal(data);
  resetUpload();
  renderSummary();
  renderMealLog();
  renderNutritionBars();
  showToast(data.name + ' を記録しました');
}

function resetUpload() {
  document.getElementById('upload-area').style.display = '';
  document.getElementById('analyzing').style.display = 'none';
  document.getElementById('photo-result').style.display = 'none';
  document.getElementById('file-input').value = '';
}

// --- 食品検索 ---
function initFoodSearch() {
  const input = document.getElementById('food-search');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  // 初期表示: 人気の食品
  renderSearchResults(FoodDB.foods.slice(0, 8));

  input.addEventListener('input', () => {
    const query = input.value.trim();
    const foods = FoodDB.search(query);
    renderSearchResults(foods);
  });

  // カテゴリタブ
  document.querySelectorAll('.search-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.category;
      if (cat === 'all') {
        renderSearchResults(FoodDB.foods.slice(0, 10));
      } else {
        renderSearchResults(FoodDB.getByCategory(cat));
      }
      input.value = '';
    });
  });
}

function renderSearchResults(foods) {
  const container = document.getElementById('search-results');
  if (!container) return;

  container.innerHTML = foods.map(f => `
    <div class="search-item" onclick="showAddModal(${f.id})">
      <div class="search-item-info">
        <div class="search-item-name">${f.name}</div>
        <div class="search-item-detail">${f.cal}kcal / P:${f.protein}g F:${f.fat}g C:${f.carb}g (100gあたり)</div>
      </div>
      <button class="search-item-btn">登録</button>
    </div>
  `).join('');
}

function showAddModal(foodId) {
  const food = FoodDB.getById(foodId);
  if (!food) return;

  const modal = document.getElementById('add-modal');
  document.getElementById('modal-food-name').textContent = food.name;
  document.getElementById('modal-weight').value = 100;
  document.getElementById('modal-food-id').value = foodId;
  updateModalPreview();
  modal.classList.add('show');
}

function updateModalPreview() {
  const foodId = parseInt(document.getElementById('modal-food-id').value);
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
  const foodId = parseInt(document.getElementById('modal-food-id').value);
  const weight = parseInt(document.getElementById('modal-weight').value) || 100;
  const food = FoodDB.getById(foodId);
  if (!food) return;

  const result = FoodDB.calculate(food, weight);
  Store.addMeal(result);
  closeModal();
  renderSummary();
  renderMealLog();
  renderNutritionBars();
  showToast(result.name + ' を記録しました');
}

function closeModal() {
  document.getElementById('add-modal').classList.remove('show');
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
    showToast('体重を記録しました');
  });
}

function renderWeightHistory() {
  const container = document.getElementById('weight-chart');
  if (!container) return;

  const weights = Store.getWeights().slice(-7);
  if (weights.length === 0) {
    container.innerHTML = '<div style="text-align:center; color:var(--text-light); padding:20px; font-size:0.85rem;">体重を記録するとグラフが表示されます</div>';
    return;
  }

  const maxW = Math.max(...weights.map(w => w.weight));
  const minW = Math.min(...weights.map(w => w.weight));
  const range = maxW - minW || 5;

  container.innerHTML = `
    <div class="weight-chart-bars">
      ${weights.map(w => {
        const pct = ((w.weight - minW + 1) / (range + 2)) * 100;
        const d = new Date(w.date);
        return `
          <div class="weight-chart-col">
            <div class="weight-chart-val">${w.weight}kg</div>
            <div class="weight-chart-bar" style="height:${Math.max(pct, 10)}%"></div>
            <div class="weight-chart-label">${(d.getMonth()+1)}/${d.getDate()}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// --- ユーティリティ ---
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ログアウト
function handleLogout() {
  Auth.logout();
}

// グローバルに公開
window.deleteMeal = deleteMeal;
window.savePhotoResult = savePhotoResult;
window.resetUpload = resetUpload;
window.showAddModal = showAddModal;
window.updateModalPreview = updateModalPreview;
window.addFoodFromModal = addFoodFromModal;
window.closeModal = closeModal;
window.handleLogout = handleLogout;
