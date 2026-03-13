// ============================
// 食品データベース (100gあたりの栄養素)
// ============================

const FoodDB = {
  foods: [
    { id: 1,  name: 'ごはん(白米)',       cal: 168, protein: 2.5,  fat: 0.3,  carb: 37.1, fiber: 0.3,  category: 'ごはん' },
    { id: 2,  name: 'おにぎり(鮭)',       cal: 170, protein: 4.5,  fat: 1.2,  carb: 35.0, fiber: 0.3,  category: 'ごはん' },
    { id: 3,  name: 'おにぎり(梅)',       cal: 160, protein: 2.8,  fat: 0.5,  carb: 35.5, fiber: 0.4,  category: 'ごはん' },
    { id: 4,  name: 'うどん(ゆで)',       cal: 105, protein: 2.6,  fat: 0.4,  carb: 21.6, fiber: 0.8,  category: 'めん' },
    { id: 5,  name: 'そば(ゆで)',         cal: 132, protein: 4.8,  fat: 1.0,  carb: 26.0, fiber: 2.0,  category: 'めん' },
    { id: 6,  name: 'ラーメン(醤油)',     cal: 104, protein: 4.3,  fat: 2.1,  carb: 17.0, fiber: 1.0,  category: 'めん' },
    { id: 7,  name: 'パスタ(ゆで)',       cal: 149, protein: 5.2,  fat: 0.9,  carb: 28.4, fiber: 1.5,  category: 'めん' },
    { id: 8,  name: '食パン(6枚切り1枚)', cal: 158, protein: 5.6,  fat: 2.6,  carb: 28.0, fiber: 1.4,  category: 'パン' },
    { id: 9,  name: 'トースト(バター)',   cal: 220, protein: 5.8,  fat: 8.0,  carb: 29.0, fiber: 1.4,  category: 'パン' },
    { id: 10, name: '鶏むね肉(皮なし)',   cal: 108, protein: 22.3, fat: 1.5,  carb: 0,    fiber: 0,    category: '肉' },
    { id: 11, name: '鶏もも肉',           cal: 200, protein: 16.2, fat: 14.0, carb: 0,    fiber: 0,    category: '肉' },
    { id: 12, name: '鶏の唐揚げ',         cal: 290, protein: 18.0, fat: 18.0, carb: 12.0, fiber: 0.2,  category: '肉' },
    { id: 13, name: '豚ロース',           cal: 263, protein: 19.3, fat: 19.2, carb: 0.2,  fiber: 0,    category: '肉' },
    { id: 14, name: '牛肩ロース',         cal: 240, protein: 17.9, fat: 17.4, carb: 0.1,  fiber: 0,    category: '肉' },
    { id: 15, name: 'ハンバーグ',         cal: 223, protein: 13.5, fat: 14.5, carb: 9.5,  fiber: 0.5,  category: '肉' },
    { id: 16, name: '牛丼(並盛)',         cal: 186, protein: 6.5,  fat: 5.5,  carb: 28.0, fiber: 0.5,  category: '丼' },
    { id: 17, name: 'カレーライス',       cal: 150, protein: 3.8,  fat: 5.0,  carb: 21.3, fiber: 1.2,  category: '丼' },
    { id: 18, name: '親子丼',             cal: 155, protein: 7.2,  fat: 4.5,  carb: 22.0, fiber: 0.5,  category: '丼' },
    { id: 19, name: 'サケの塩焼き',       cal: 133, protein: 22.3, fat: 4.1,  carb: 0.1,  fiber: 0,    category: '魚' },
    { id: 20, name: 'サバの味噌煮',       cal: 220, protein: 19.8, fat: 13.5, carb: 6.5,  fiber: 0.3,  category: '魚' },
    { id: 21, name: '刺身盛り合わせ',     cal: 125, protein: 20.0, fat: 4.5,  carb: 0.5,  fiber: 0,    category: '魚' },
    { id: 22, name: '目玉焼き',           cal: 200, protein: 13.0, fat: 15.0, carb: 0.5,  fiber: 0,    category: '卵' },
    { id: 23, name: 'スクランブルエッグ', cal: 212, protein: 11.5, fat: 17.0, carb: 2.5,  fiber: 0,    category: '卵' },
    { id: 24, name: '味噌汁',             cal: 25,  protein: 1.8,  fat: 0.5,  carb: 2.8,  fiber: 0.5,  category: '汁物' },
    { id: 25, name: '豚汁',               cal: 50,  protein: 3.5,  fat: 2.0,  carb: 4.5,  fiber: 1.0,  category: '汁物' },
    { id: 26, name: 'サラダ(ドレッシング)',cal: 45,  protein: 1.5,  fat: 2.5,  carb: 4.0,  fiber: 1.8,  category: 'サラダ' },
    { id: 27, name: '冷奴',               cal: 55,  protein: 5.0,  fat: 3.0,  carb: 1.5,  fiber: 0.3,  category: 'サラダ' },
    { id: 28, name: 'バナナ',             cal: 86,  protein: 1.1,  fat: 0.2,  carb: 22.5, fiber: 1.1,  category: '果物' },
    { id: 29, name: 'りんご',             cal: 54,  protein: 0.2,  fat: 0.1,  carb: 14.6, fiber: 1.5,  category: '果物' },
    { id: 30, name: 'ヨーグルト(無糖)',   cal: 62,  protein: 3.6,  fat: 3.0,  carb: 4.9,  fiber: 0,    category: '乳製品' },
    { id: 31, name: '牛乳(200ml)',        cal: 134, protein: 6.6,  fat: 7.6,  carb: 9.6,  fiber: 0,    category: '乳製品' },
    { id: 32, name: 'チーズ(1切れ)',      cal: 339, protein: 22.7, fat: 26.0, carb: 1.3,  fiber: 0,    category: '乳製品' },
    { id: 33, name: 'カップ麺(醤油)',     cal: 448, protein: 10.3, fat: 19.5, carb: 57.0, fiber: 2.0,  category: '加工食品' },
    { id: 34, name: 'コンビニサンドイッチ',cal: 245, protein: 9.0,  fat: 12.0, carb: 25.0, fiber: 1.5,  category: 'パン' },
    { id: 35, name: 'コーヒー(ブラック)', cal: 4,   protein: 0.2,  fat: 0,    carb: 0.7,  fiber: 0,    category: '飲料' },
    { id: 36, name: 'オレンジジュース',   cal: 42,  protein: 0.4,  fat: 0.1,  carb: 10.0, fiber: 0.2,  category: '飲料' },
    { id: 37, name: 'ポテトチップス',     cal: 554, protein: 4.7,  fat: 35.2, carb: 54.7, fiber: 4.2,  category: 'お菓子' },
    { id: 38, name: 'チョコレート',       cal: 558, protein: 6.9,  fat: 34.1, carb: 55.8, fiber: 3.9,  category: 'お菓子' },
    { id: 39, name: 'プロテインバー',     cal: 380, protein: 30.0, fat: 12.0, carb: 35.0, fiber: 5.0,  category: 'サプリ' },
    { id: 40, name: '餃子(5個)',          cal: 230, protein: 9.0,  fat: 11.0, carb: 24.0, fiber: 1.5,  category: '中華' },
  ],

  // 食品検索
  search(query) {
    if (!query || query.trim() === '') return this.foods.slice(0, 10);
    const q = query.toLowerCase();
    return this.foods.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
    );
  },

  // カテゴリ一覧
  getCategories() {
    return [...new Set(this.foods.map(f => f.category))];
  },

  // カテゴリで絞り込み
  getByCategory(category) {
    return this.foods.filter(f => f.category === category);
  },

  // IDで取得
  getById(id) {
    return this.foods.find(f => f.id === id);
  },

  // 重量に応じた栄養計算
  calculate(food, weightG) {
    const ratio = weightG / 100;
    return {
      name: food.name,
      weight: weightG,
      cal: Math.round(food.cal * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10,
      carb: Math.round(food.carb * ratio * 10) / 10,
      fiber: Math.round(food.fiber * ratio * 10) / 10,
    };
  }
};
