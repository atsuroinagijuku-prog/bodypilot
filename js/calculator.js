// ============================
// カロリー計算ページ
// ============================

let isUserLoggedIn = false;
let activeCategory = null;

document.addEventListener('DOMContentLoaded', () => {
  // Auth is optional for this page
  if (typeof Auth !== 'undefined') {
    Auth.init().then(() => {
      if (Auth.isLoggedIn()) {
        isUserLoggedIn = true;
        // Update nav: show logout & dashboard, hide login
        const navLogin = document.getElementById('nav-login');
        const navLogout = document.getElementById('nav-logout');
        const navDashboard = document.getElementById('nav-dashboard');
        if (navLogin) navLogin.style.display = 'none';
        if (navLogout) navLogout.style.display = '';
        if (navDashboard) navDashboard.style.display = '';
      }
    });
  }
  renderCategories();
});

function searchFood() {
  const query = document.getElementById('calc-search-input').value.trim();
  if (!query) return;
  // Clear active category
  clearActiveCategory();
  const results = FoodDB.search(query);
  renderResults(results);
}

function showCategory(category) {
  // Highlight active category
  clearActiveCategory();
  activeCategory = category;
  const buttons = document.querySelectorAll('.category-card');
  buttons.forEach(btn => {
    if (btn.textContent === category) {
      btn.classList.add('active');
    }
  });
  const foods = FoodDB.getByCategory(category);
  renderResults(foods);
}

function clearActiveCategory() {
  activeCategory = null;
  const buttons = document.querySelectorAll('.category-card');
  buttons.forEach(btn => btn.classList.remove('active'));
}

function renderCategories() {
  const cats = FoodDB.getCategories();
  const container = document.getElementById('category-grid');
  container.innerHTML = cats.map(cat =>
    '<button class="category-card" onclick="showCategory(\'' + cat + '\')">' + cat + '</button>'
  ).join('');
}

function renderResults(foods) {
  const container = document.getElementById('calc-results');
  if (!foods || foods.length === 0) {
    container.innerHTML = '<p class="no-results">該当する食品が見つかりません。</p>';
    return;
  }
  container.innerHTML = foods.map(f => {
    const fid = String(f.id);
    const addBtn = isUserLoggedIn
      ? '<button onclick="event.stopPropagation(); addToRecord(\'' + fid + '\')" class="btn-add-record">記録に追加</button>'
      : '';
    return '<div class="calc-result-item">' +
      '<div class="calc-result-header" onclick="toggleFoodDetail(\'' + fid + '\')">' +
        '<span class="food-name">' + escapeHtml(f.name) + '</span>' +
        '<span class="food-cal">' + f.cal + ' kcal/100g</span>' +
      '</div>' +
      '<div class="calc-result-detail" id="detail-' + fid + '" style="display:none">' +
        '<div class="nutrition-grid">' +
          '<div>タンパク質: ' + f.protein + 'g</div>' +
          '<div>脂質: ' + f.fat + 'g</div>' +
          '<div>炭水化物: ' + f.carb + 'g</div>' +
          '<div>食物繊維: ' + f.fiber + 'g</div>' +
        '</div>' +
        '<div class="portion-calc">' +
          '<label>分量:</label>' +
          '<input type="number" value="100" min="1" class="portion-input" id="portion-' + fid + '" oninput="updateCalcPreview(\'' + fid + '\')" onclick="event.stopPropagation()"> g' +
          '<div class="calc-preview" id="preview-' + fid + '">' +
            '→ ' + f.cal + ' kcal' +
          '</div>' +
        '</div>' +
        addBtn +
      '</div>' +
    '</div>';
  }).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function toggleFoodDetail(id) {
  const detail = document.getElementById('detail-' + id);
  if (!detail) return;
  detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
}

function updateCalcPreview(id) {
  const food = FoodDB.getById(isNaN(id) ? id : parseInt(id));
  if (!food) return;
  const portion = parseFloat(document.getElementById('portion-' + id).value) || 100;
  const result = FoodDB.calculate(food, portion);
  document.getElementById('preview-' + id).textContent =
    '→ ' + result.cal + ' kcal (P:' + result.protein + 'g F:' + result.fat + 'g C:' + result.carb + 'g)';
}

function addToRecord(foodId) {
  const food = FoodDB.getById(isNaN(foodId) ? foodId : parseInt(foodId));
  if (!food) return;
  const portion = parseFloat(document.getElementById('portion-' + foodId).value) || 100;
  const result = FoodDB.calculate(food, portion);
  Store.addMeal({
    name: food.name,
    weight: portion,
    cal: result.cal,
    protein: result.protein,
    fat: result.fat,
    carb: result.carb,
    fiber: result.fiber
  });
  showToast(food.name + 'を記録しました');
}

function toggleHelp() {
  const help = document.getElementById('help-modal');
  help.style.display = help.style.display === 'none' || help.style.display === '' ? 'flex' : 'none';
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
