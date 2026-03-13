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

  addMeal(meal, options) {
    const key = this._key('meals');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    const dateStr = (options && options.date) ? options.date : this._today();
    if (!all[dateStr]) all[dateStr] = [];

    meal.id = Date.now();
    meal.time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    meal.date = dateStr;
    meal.type = (options && options.mealType) ? options.mealType : this._getMealType();

    all[dateStr].push(meal);
    localStorage.setItem(key, JSON.stringify(all));
    return meal;
  },

  updateMeal(date, mealId, updatedMeal) {
    const key = this._key('meals');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    if (all[date]) {
      const idx = all[date].findIndex(m => m.id === mealId);
      if (idx >= 0) {
        // Preserve original id, time, date, type unless overridden
        all[date][idx] = { ...all[date][idx], ...updatedMeal, id: mealId, date: date };
        localStorage.setItem(key, JSON.stringify(all));
        return all[date][idx];
      }
    }
    return null;
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

  // --- 運動記録 ---
  getExercises(date) {
    const key = this._key('exercises');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    const dateStr = date || this._today();
    return all[dateStr] || [];
  },

  addExercise(exercise) {
    const key = this._key('exercises');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    const dateStr = exercise.date || this._today();
    if (!all[dateStr]) all[dateStr] = [];

    exercise.id = Date.now();
    exercise.time = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    exercise.date = dateStr;

    all[dateStr].push(exercise);
    localStorage.setItem(key, JSON.stringify(all));
    return exercise;
  },

  deleteExercise(date, exerciseId) {
    const key = this._key('exercises');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    if (all[date]) {
      all[date] = all[date].filter(e => e.id !== exerciseId);
      localStorage.setItem(key, JSON.stringify(all));
    }
  },

  getDayExerciseTotal(date) {
    const exercises = this.getExercises(date);
    let total = 0;
    exercises.forEach(e => {
      total += e.calories || 0;
    });
    return Math.round(total);
  },

  // --- 水分摂取 ---
  getWaterIntake(date) {
    const key = this._key('water');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    const dateStr = date || this._today();
    return all[dateStr] || 0;
  },

  addWater(amount) {
    const key = this._key('water');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    const dateStr = this._today();
    all[dateStr] = (all[dateStr] || 0) + amount;
    localStorage.setItem(key, JSON.stringify(all));
    return all[dateStr];
  },

  setWaterGoal(ml) {
    localStorage.setItem(this._key('waterGoal'), JSON.stringify(ml));
  },

  getWaterGoal() {
    const val = localStorage.getItem(this._key('waterGoal'));
    return val ? JSON.parse(val) : 2000;
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
  },

  // --- フォトギャラリー ---
  savePhoto(date, mealId, imageDataUrl) {
    // Prune old photos before saving to manage storage
    this.prunePhotos(50);

    const key = this._key('photos');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    const dateStr = date || this._today();
    if (!all[dateStr]) all[dateStr] = [];

    all[dateStr].push({
      mealId: mealId,
      image: imageDataUrl,
      timestamp: Date.now()
    });

    try {
      localStorage.setItem(key, JSON.stringify(all));
    } catch (e) {
      // localStorage quota exceeded - remove oldest photos
      console.warn('localStorage quota exceeded, removing old photos');
      const dates = Object.keys(all).sort();
      while (dates.length > 1) {
        delete all[dates.shift()];
        try {
          localStorage.setItem(key, JSON.stringify(all));
          return;
        } catch (e2) {
          continue;
        }
      }
      // Last resort: clear all photos if single date still too large
      console.warn('Could not save photo even after cleanup');
    }
  },

  getPhotos(date) {
    const key = this._key('photos');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    const dateStr = date || this._today();
    return all[dateStr] || [];
  },

  getPhotoGallery(days) {
    const key = this._key('photos');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    const result = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (all[dateStr]) {
        all[dateStr].forEach(photo => {
          // Look up meal name
          const meals = this.getMeals(dateStr);
          const meal = meals.find(m => m.id === photo.mealId);
          result.push({
            date: dateStr,
            mealId: photo.mealId,
            image: photo.image,
            name: meal ? meal.name : '不明',
            timestamp: photo.timestamp
          });
        });
      }
    }
    return result;
  },

  deletePhoto(date, mealId) {
    const key = this._key('photos');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    if (all[date]) {
      all[date] = all[date].filter(p => p.mealId !== mealId);
      if (all[date].length === 0) delete all[date];
      localStorage.setItem(key, JSON.stringify(all));
    }
  },

  // --- 身長 (BMI計算用) ---
  getUserHeight() {
    const val = localStorage.getItem(this._key('height'));
    // Also check the old key format used by settings page
    if (val) return parseFloat(val);
    const uid = Auth.currentUser ? Auth.currentUser.uid : 'anon';
    const altVal = localStorage.getItem(`bp_${uid}_height`);
    return altVal ? parseFloat(altVal) : null;
  },

  setUserHeight(cm) {
    localStorage.setItem(this._key('height'), cm.toString());
  },

  // --- 最近使った食品 ---
  getRecentFoods(limit) {
    limit = limit || 10;
    const key = this._key('meals');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    const dates = Object.keys(all).sort().reverse();
    const seen = new Set();
    const result = [];

    for (const date of dates) {
      const meals = all[date] || [];
      for (let i = meals.length - 1; i >= 0; i--) {
        const m = meals[i];
        // Try to find matching food in FoodDB
        const food = FoodDB.foods.find(f => f.name === m.name);
        if (food && !seen.has(food.id)) {
          seen.add(food.id);
          result.push(food);
          if (result.length >= limit) return result;
        }
        // Also check custom foods
        if (!food && m.name) {
          const customs = this.getCustomFoods();
          const custom = customs.find(c => c.name === m.name);
          if (custom && !seen.has(custom.id)) {
            seen.add(custom.id);
            result.push(custom);
            if (result.length >= limit) return result;
          }
        }
      }
    }
    return result;
  },

  // --- カスタム食品 ---
  getCustomFoods() {
    const key = this._key('custom_foods');
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  addCustomFood(food) {
    const key = this._key('custom_foods');
    const foods = JSON.parse(localStorage.getItem(key) || '[]');
    food.id = 'custom_' + Date.now();
    food.isCustom = true;
    foods.push(food);
    localStorage.setItem(key, JSON.stringify(foods));
    return food;
  },

  deleteCustomFood(foodId) {
    const key = this._key('custom_foods');
    const foods = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = foods.filter(f => f.id !== foodId);
    localStorage.setItem(key, JSON.stringify(filtered));
  },

  // --- ストレージ管理 ---
  getStorageUsage() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bp_')) {
        total += key.length + (localStorage.getItem(key) || '').length;
      }
    }
    // UTF-16 encoding: 2 bytes per character
    return total * 2;
  },

  getStorageLimit() {
    return 5 * 1024 * 1024; // ~5MB
  },

  pruneOldData(daysToKeep) {
    daysToKeep = daysToKeep || 365;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    // Prune meals
    const mealsKey = this._key('meals');
    const allMeals = JSON.parse(localStorage.getItem(mealsKey) || '{}');
    let mealsPruned = false;
    Object.keys(allMeals).forEach(date => {
      if (date < cutoffStr) {
        delete allMeals[date];
        mealsPruned = true;
      }
    });
    if (mealsPruned) localStorage.setItem(mealsKey, JSON.stringify(allMeals));

    // Prune exercises
    const exKey = this._key('exercises');
    const allEx = JSON.parse(localStorage.getItem(exKey) || '{}');
    let exPruned = false;
    Object.keys(allEx).forEach(date => {
      if (date < cutoffStr) {
        delete allEx[date];
        exPruned = true;
      }
    });
    if (exPruned) localStorage.setItem(exKey, JSON.stringify(allEx));

    // Prune water
    const waterKey = this._key('water');
    const allWater = JSON.parse(localStorage.getItem(waterKey) || '{}');
    let waterPruned = false;
    Object.keys(allWater).forEach(date => {
      if (date < cutoffStr) {
        delete allWater[date];
        waterPruned = true;
      }
    });
    if (waterPruned) localStorage.setItem(waterKey, JSON.stringify(allWater));
  },

  prunePhotos(maxPhotos) {
    maxPhotos = maxPhotos || 50;
    const key = this._key('photos');
    const all = JSON.parse(localStorage.getItem(key) || '{}');

    // Collect all photos with dates, sorted by timestamp
    const allPhotos = [];
    Object.keys(all).forEach(date => {
      (all[date] || []).forEach(photo => {
        allPhotos.push({ date, photo });
      });
    });
    allPhotos.sort((a, b) => (a.photo.timestamp || 0) - (b.photo.timestamp || 0));

    if (allPhotos.length <= maxPhotos) return;

    // Remove oldest photos
    const toRemove = allPhotos.slice(0, allPhotos.length - maxPhotos);
    toRemove.forEach(item => {
      if (all[item.date]) {
        all[item.date] = all[item.date].filter(p => p !== item.photo);
        if (all[item.date].length === 0) delete all[item.date];
      }
    });
    localStorage.setItem(key, JSON.stringify(all));
  },

  // --- 睡眠記録 ---
  getSleep(date) {
    const key = this._key('sleep');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    return all[date] || null;
  },

  saveSleep(date, data) {
    // data: { bedtime: "23:30", wakeup: "06:30", duration: 7, quality: 4 }
    const key = this._key('sleep');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    all[date] = data;
    localStorage.setItem(key, JSON.stringify(all));
  },

  getRecentSleep(days) {
    days = days || 7;
    const result = [];
    const today = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const sleep = this.getSleep(dateStr);
      if (sleep) {
        result.push({ date: dateStr, ...sleep });
      } else {
        result.push({ date: dateStr });
      }
    }
    return result.reverse();
  },

  checkStorageWarning() {
    const usage = this.getStorageUsage();
    const limit = this.getStorageLimit();
    const pct = usage / limit;
    if (pct > 0.8) {
      return Math.round(pct * 100);
    }
    return null;
  },

  // --- 身長/BMI 便利メソッド ---
  setHeight(cm) {
    this.setUserHeight(cm);
  },

  getHeight() {
    return this.getUserHeight() || 0;
  },

  getBMI() {
    const height = this.getUserHeight();
    const weights = this.getWeights();
    if (!height || weights.length === 0) return null;
    const latestWeight = weights[weights.length - 1].weight;
    const heightM = height / 100;
    return latestWeight / (heightM * heightM);
  },

  // --- ダイアリー ---
  getDiary(date) {
    const key = this._key('diary');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    return all[date] || null;
  },

  setDiary(date, data) {
    const key = this._key('diary');
    const all = JSON.parse(localStorage.getItem(key) || '{}');
    all[date] = data;
    localStorage.setItem(key, JSON.stringify(all));
  },

  getAllDiaries() {
    const key = this._key('diary');
    return JSON.parse(localStorage.getItem(key) || '{}');
  }
};
