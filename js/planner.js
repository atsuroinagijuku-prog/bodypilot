// ============================
// 食事プランナー
// ============================

const Planner = {
  currentWeekStart: null,
  _pendingDate: null,
  _pendingMealType: null,
  _usedFoodIds: new Set(),

  init() {
    Auth.init();
    if (!Auth.isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    }
    this.currentWeekStart = this.getWeekStart(new Date());
    this.render();
  },

  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  },

  getDateForDay(dayIndex) {
    const d = new Date(this.currentWeekStart + 'T00:00:00');
    d.setDate(d.getDate() + dayIndex);
    return d.toISOString().split('T')[0];
  },

  getPlan(date) {
    const uid = JSON.parse(localStorage.getItem('bp_user'))?.uid;
    if (!uid) return { '\u671D\u98DF': [], '\u660C\u98DF': [], '\u5915\u98DF': [] };
    const plans = JSON.parse(localStorage.getItem(`bp_${uid}_plans`) || '{}');
    return plans[date] || { '\u671D\u98DF': [], '\u660C\u98DF': [], '\u5915\u98DF': [] };
  },

  savePlan(date, plan) {
    const uid = JSON.parse(localStorage.getItem('bp_user'))?.uid;
    if (!uid) return;
    const plans = JSON.parse(localStorage.getItem(`bp_${uid}_plans`) || '{}');
    plans[date] = plan;
    localStorage.setItem(`bp_${uid}_plans`, JSON.stringify(plans));
  },

  render() {
    const dayNames = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];
    const mealTypes = ['朝食', '昼食', '夕食'];

    // Update week display
    const startDate = new Date(this.currentWeekStart + 'T00:00:00');
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const weekDisplay = document.getElementById('week-display');
    if (weekDisplay) {
      weekDisplay.textContent = `${startDate.getMonth() + 1}月${startDate.getDate()}日 〜 ${endDate.getMonth() + 1}月${endDate.getDate()}日`;
    }

    // Build the 7-day grid
    const grid = document.getElementById('planner-grid');
    if (!grid) return;
    grid.innerHTML = '';

    let weekTotalCal = 0;
    let weekTotalProtein = 0;
    let daysWithData = 0;

    for (let i = 0; i < 7; i++) {
      const date = this.getDateForDay(i);
      const plan = this.getPlan(date);
      const d = new Date(date + 'T00:00:00');

      const dayDiv = document.createElement('div');
      dayDiv.className = 'planner-day';
      dayDiv.dataset.date = date;

      // Check if today
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        dayDiv.classList.add('planner-day-today');
      }

      let dayCal = 0;
      let dayProtein = 0;

      let html = `<h3 class="day-header">${dayNames[i]}<br><span class="day-date">${d.getMonth() + 1}/${d.getDate()}</span></h3>`;

      for (const type of mealTypes) {
        const items = plan[type] || [];
        let itemsHtml = '';
        items.forEach((item, idx) => {
          dayCal += item.cal || 0;
          dayProtein += item.protein || 0;
          itemsHtml += `<div class="slot-item">
            <span class="slot-item-name">${item.name}</span>
            <span class="slot-item-cal">${item.cal}kcal</span>
            <button class="slot-item-remove" onclick="Planner.removeItem('${date}', '${type}', ${idx})" title="削除">&times;</button>
          </div>`;
        });

        html += `<div class="meal-slot" data-type="${type}">
          <span class="slot-label">${type}</span>
          <div class="slot-items">${itemsHtml}</div>
          <button onclick="Planner.openFoodModal('${date}', '${type}')" class="add-plan-btn">+</button>
        </div>`;
      }

      if (dayCal > 0) {
        weekTotalCal += dayCal;
        weekTotalProtein += dayProtein;
        daysWithData++;
      }

      html += `<div class="day-totals"><span class="day-cal">${dayCal} kcal</span></div>`;
      dayDiv.innerHTML = html;
      grid.appendChild(dayDiv);
    }

    // Weekly summary
    const avgCal = daysWithData > 0 ? Math.round(weekTotalCal / daysWithData) : 0;
    const avgProtein = daysWithData > 0 ? Math.round(weekTotalProtein / daysWithData) : 0;
    const avgCalEl = document.getElementById('avg-cal');
    const avgProteinEl = document.getElementById('avg-protein');
    if (avgCalEl) avgCalEl.textContent = avgCal;
    if (avgProteinEl) avgProteinEl.textContent = avgProtein;
  },

  removeItem(date, mealType, index) {
    const plan = this.getPlan(date);
    if (plan[mealType]) {
      plan[mealType].splice(index, 1);
      this.savePlan(date, plan);
      this.render();
    }
  },

  openFoodModal(date, mealType) {
    this._pendingDate = date;
    this._pendingMealType = mealType;
    const modal = document.getElementById('plan-food-modal');
    if (modal) {
      modal.style.display = 'flex';
      const searchInput = document.getElementById('plan-food-search');
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      this.searchPlanFood('');
    }
  },

  closeFoodModal() {
    const modal = document.getElementById('plan-food-modal');
    if (modal) modal.style.display = 'none';
    this._pendingDate = null;
    this._pendingMealType = null;
  },

  searchPlanFood(query) {
    const results = FoodDB.search(query);
    const container = document.getElementById('plan-food-results');
    if (!container) return;

    container.innerHTML = results.slice(0, 20).map(f => {
      return `<div class="plan-food-item" onclick="Planner.selectFood(${f.id || "'" + f.id + "'"})">
        <span class="plan-food-name">${f.name}</span>
        <span class="plan-food-info">${f.cal}kcal/100g | P:${f.protein}g F:${f.fat}g C:${f.carb}g</span>
      </div>`;
    }).join('');
  },

  selectFood(foodId) {
    const food = FoodDB.getById(foodId);
    if (!food || !this._pendingDate || !this._pendingMealType) return;

    const weight = 150; // default serving
    const ratio = weight / 100;
    const item = {
      foodId: food.id,
      name: food.name,
      weight: weight,
      cal: Math.round(food.cal * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10,
      carb: Math.round(food.carb * ratio * 10) / 10
    };

    const plan = this.getPlan(this._pendingDate);
    if (!plan[this._pendingMealType]) plan[this._pendingMealType] = [];
    plan[this._pendingMealType].push(item);
    this.savePlan(this._pendingDate, plan);
    this.closeFoodModal();
    this.render();
  },

  prevWeek() {
    const d = new Date(this.currentWeekStart + 'T00:00:00');
    d.setDate(d.getDate() - 7);
    this.currentWeekStart = d.toISOString().split('T')[0];
    this.render();
  },

  nextWeek() {
    const d = new Date(this.currentWeekStart + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    this.currentWeekStart = d.toISOString().split('T')[0];
    this.render();
  },

  thisWeek() {
    this.currentWeekStart = this.getWeekStart(new Date());
    this.render();
  },

  clearWeekPlan() {
    const uid = JSON.parse(localStorage.getItem('bp_user'))?.uid;
    if (!uid) return;
    const plans = JSON.parse(localStorage.getItem(`bp_${uid}_plans`) || '{}');
    for (let i = 0; i < 7; i++) {
      const date = this.getDateForDay(i);
      delete plans[date];
    }
    localStorage.setItem(`bp_${uid}_plans`, JSON.stringify(plans));
    this.render();
  },

  autoGenerate() {
    const goals = Store.getGoals();
    this._usedFoodIds.clear();

    for (let i = 0; i < 7; i++) {
      const date = this.getDateForDay(i);
      const plan = {
        '朝食': this._pickMealCombo(goals.cal * 0.25, 'breakfast'),
        '昼食': this._pickMealCombo(goals.cal * 0.35, 'lunch'),
        '夕食': this._pickMealCombo(goals.cal * 0.35, 'dinner')
      };
      this.savePlan(date, plan);
    }
    this.render();
  },

  _pickMealCombo(targetCal, type) {
    const items = [];
    let remaining = targetCal;

    // Main dish categories by meal type
    let mainCats, sideCats;
    if (type === 'breakfast') {
      mainCats = ['パン', 'ごはん'];
      sideCats = ['卵', '乳製品', '果物'];
    } else if (type === 'lunch') {
      mainCats = ['ごはん', 'めん', 'コンビニ'];
      sideCats = ['肉', '魚', 'サラダ'];
    } else {
      mainCats = ['肉', '魚'];
      sideCats = ['野菜', 'サラダ', '汁物'];
    }

    // Pick main
    const main = this._pickRandomFood(mainCats, remaining * 0.6);
    if (main) {
      items.push(main);
      remaining -= main.cal;
    }

    // Pick side
    const side = this._pickRandomFood(sideCats, remaining * 0.8);
    if (side) {
      items.push(side);
      remaining -= side.cal;
    }

    // Rice for dinner
    if (type === 'dinner' && remaining > 100) {
      const rice = this._pickRandomFood(['ごはん'], remaining);
      if (rice) items.push(rice);
    }

    // Drink for breakfast
    if (type === 'breakfast') {
      const drink = this._pickRandomFood(['飲料'], 80);
      if (drink) items.push(drink);
    }

    return items;
  },

  _pickRandomFood(categories, targetCal) {
    let candidates = [];
    for (const cat of categories) {
      candidates = candidates.concat(FoodDB.getByCategory(cat));
    }
    if (candidates.length === 0) return null;

    // Filter out recently used (for variety)
    let filtered = candidates.filter(f => !this._usedFoodIds.has(f.id));
    if (filtered.length === 0) filtered = candidates;

    // Calculate serving calories and sort by closeness to target
    const weight = 150;
    const ratio = weight / 100;
    const withCal = filtered.map(f => ({
      ...f,
      servingCal: Math.round(f.cal * ratio)
    }));
    withCal.sort((a, b) => Math.abs(a.servingCal - targetCal) - Math.abs(b.servingCal - targetCal));

    // Pick from top 5 candidates randomly
    const pick = withCal[Math.floor(Math.random() * Math.min(5, withCal.length))];
    if (!pick) return null;

    this._usedFoodIds.add(pick.id);

    return {
      foodId: pick.id,
      name: pick.name,
      weight: weight,
      cal: Math.round(pick.cal * ratio),
      protein: Math.round(pick.protein * ratio * 10) / 10,
      fat: Math.round(pick.fat * ratio * 10) / 10,
      carb: Math.round(pick.carb * ratio * 10) / 10
    };
  },

  generateShoppingList() {
    const list = {};
    for (let i = 0; i < 7; i++) {
      const date = this.getDateForDay(i);
      const plan = this.getPlan(date);
      for (const type of ['朝食', '昼食', '夕食']) {
        for (const item of (plan[type] || [])) {
          if (!list[item.name]) {
            list[item.name] = { name: item.name, totalWeight: 0, count: 0 };
          }
          list[item.name].totalWeight += item.weight;
          list[item.name].count++;
        }
      }
    }

    const items = Object.values(list).sort((a, b) => b.count - a.count);
    this._renderShoppingList(items);
  },

  _renderShoppingList(items) {
    const container = document.getElementById('shopping-list');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = '<p style="color:var(--text-sub);text-align:center;padding:20px;">食事プランにアイテムがありません</p>';
    } else {
      container.innerHTML = items.map((item, i) => {
        return `<label class="shopping-item">
          <input type="checkbox" class="shopping-check" data-index="${i}">
          <span class="shopping-name">${item.name}</span>
          <span class="shopping-qty">${item.totalWeight}g (${item.count}回)</span>
        </label>`;
      }).join('');
    }

    this._shoppingItems = items;
    const modal = document.getElementById('shopping-modal');
    if (modal) modal.style.display = 'flex';
  },

  closeShoppingModal() {
    const modal = document.getElementById('shopping-modal');
    if (modal) modal.style.display = 'none';
  },

  copyShoppingList() {
    if (!this._shoppingItems || this._shoppingItems.length === 0) return;
    const text = this._shoppingItems.map(item => {
      return `${item.name} - ${item.totalWeight}g (${item.count}回)`;
    }).join('\n');

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('コピーしました');
      });
    } else {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('コピーしました');
    }
  },

  printShoppingList() {
    if (!this._shoppingItems || this._shoppingItems.length === 0) return;
    const printWin = window.open('', '_blank');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>買い物リスト</title>
      <style>body{font-family:sans-serif;padding:20px;}h1{font-size:1.2rem;}
      .item{padding:6px 0;border-bottom:1px solid #eee;display:flex;justify-content:space-between;}
      .item input{margin-right:8px;}</style></head><body>
      <h1>買い物リスト</h1>
      ${this._shoppingItems.map(item => `<div class="item"><span><input type="checkbox">${item.name}</span><span>${item.totalWeight}g (${item.count}回)</span></div>`).join('')}
      <script>window.print();</script></body></html>`;
    printWin.document.write(html);
    printWin.document.close();
  }
};

// Global functions for onclick handlers
function prevWeek() { Planner.prevWeek(); }
function nextWeek() { Planner.nextWeek(); }
function thisWeek() { Planner.thisWeek(); }
function autoGeneratePlan() { Planner.autoGenerate(); }
function clearWeekPlan() { Planner.clearWeekPlan(); }
function generateShoppingList() { Planner.generateShoppingList(); }
function closePlanFoodModal() { Planner.closeFoodModal(); }
function searchPlanFood(query) { Planner.searchPlanFood(query); }
function closeShoppingModal() { Planner.closeShoppingModal(); }
function copyShoppingList() { Planner.copyShoppingList(); }
function printShoppingList() { Planner.printShoppingList(); }
function handleLogout() { Auth.logout(); }

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  Planner.init();
});
