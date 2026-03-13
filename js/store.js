// ============================
// データストア (localStorage)
// ============================

const Store = {
  _key(name) {
    const uid = Auth.currentUser ? Auth.currentUser.uid : 'anon';
    return `bp_${uid}_${name}`;
  },

  // --- 食事記録 ---
  getMeals(date) {
    const key = this._key('meals');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    const dateStr = date || this._today();
    return all[dateStr] || [];
  },

  addMeal(meal) {
    const key = this._key('meals');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    const dateStr = this._today();
    if (!all[dateStr]) all[dateStr] = [];

    meal.id = Date.now();
    meal.time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    meal.date = dateStr;
    meal.type = this._getMealType();

    all[dateStr].push(meal);
    localStorage.setItem(key, JSON.stringify(all));
    return meal;
  },

  deleteMeal(date, mealId) {
    const key = this._key('meals');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    if (all[date]) {
      all[date] = all[date].filter(m => m.id !== mealId);
      localStorage.setItem(key, JSON.stringify(all));
    }
  },

  // 日別の合計栄養素
  getDayTotal(date) {
    const meals = this.getMeals(date);
    const total = { cal: 0, protein: 0, fat: 0, carb: 0, fiber: 0 };
    meals.forEach(m => {
      total.cal += m.cal || 0;
      total.protein += m.protein || 0;
      total.fat += m.fat || 0;
      total.carb += m.carb || 0;
      total.fiber += m.fiber || 0;
    });
    total.protein = Math.round(total.protein * 10) / 10;
    total.fat = Math.round(total.fat * 10) / 10;
    total.carb = Math.round(total.carb * 10) / 10;
    total.fiber = Math.round(total.fiber * 10) / 10;
    return total;
  },

  // --- 体重記録 ---
  getWeights() {
    return JSON.parse(localStorage.getItem(this._key('weights')) || '[]');
  },

  addWeight(weight, bodyFat) {
    const weights = this.getWeights();
    const entry = {
      date: this._today(),
      weight: parseFloat(weight),
      bodyFat: bodyFat ? parseFloat(bodyFat) : null,
      timestamp: Date.now()
    };
    // 同じ日のデータがあれば上書き
    const idx = weights.findIndex(w => w.date === entry.date);
    if (idx >= 0) {
      weights[idx] = entry;
    } else {
      weights.push(entry);
    }
    localStorage.setItem(this._key('weights'), JSON.stringify(weights));
    return entry;
  },

  // --- 目標設定 ---
  getGoals() {
    return JSON.parse(localStorage.getItem(this._key('goals')) || JSON.stringify({
      cal: 2000,
      protein: 80,
      fat: 65,
      carb: 250,
      fiber: 20,
      targetWeight: null
    }));
  },

  setGoals(goals) {
    localStorage.setItem(this._key('goals'), JSON.stringify(goals));
  },

  // --- ユーティリティ ---
  _today() {
    return new Date().toISOString().split('T')[0];
  },

  _getMealType() {
    const h = new Date().getHours();
    if (h < 10) return '朝食';
    if (h < 15) return '昼食';
    if (h < 18) return '間食';
    return '夕食';
  },

  // 過去N日のデータ取得
  getRecentDays(days) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        label: (d.getMonth() + 1) + '/' + d.getDate(),
        total: this.getDayTotal(dateStr),
        meals: this.getMeals(dateStr)
      });
    }
    return result;
  }
};
