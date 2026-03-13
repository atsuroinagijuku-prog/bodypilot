// ============================
// 食品データベース (100gあたりの栄養素)
// ============================

const FoodDB = {
  foods: [
    // ===== ごはん =====
    { id: 1,   name: 'ごはん(白米)',       cal: 168, protein: 2.5,  fat: 0.3,  carb: 37.1, fiber: 0.3,  category: 'ごはん' },
    { id: 2,   name: 'おにぎり(鮭)',       cal: 170, protein: 4.5,  fat: 1.2,  carb: 35.0, fiber: 0.3,  category: 'ごはん' },
    { id: 3,   name: 'おにぎり(梅)',       cal: 160, protein: 2.8,  fat: 0.5,  carb: 35.5, fiber: 0.4,  category: 'ごはん' },
    { id: 41,  name: '玄米ごはん',         cal: 165, protein: 2.8,  fat: 1.0,  carb: 35.6, fiber: 1.4,  category: 'ごはん' },
    { id: 42,  name: 'チャーハン',         cal: 180, protein: 5.2,  fat: 6.5,  carb: 25.0, fiber: 0.5,  category: 'ごはん' },
    { id: 43,  name: 'オムライス',         cal: 155, protein: 5.8,  fat: 5.5,  carb: 20.5, fiber: 0.4,  category: 'ごはん' },
    { id: 44,  name: 'ピラフ',             cal: 170, protein: 4.0,  fat: 4.5,  carb: 28.0, fiber: 0.5,  category: 'ごはん' },
    { id: 45,  name: '赤飯',               cal: 190, protein: 4.5,  fat: 0.5,  carb: 42.0, fiber: 1.8,  category: 'ごはん' },
    { id: 46,  name: 'おかゆ',             cal: 71,  protein: 1.1,  fat: 0.1,  carb: 15.7, fiber: 0.1,  category: 'ごはん' },
    { id: 47,  name: '親子丼',             cal: 155, protein: 7.2,  fat: 4.5,  carb: 22.0, fiber: 0.5,  category: 'ごはん' },
    { id: 48,  name: '天丼',               cal: 195, protein: 6.0,  fat: 6.5,  carb: 28.5, fiber: 0.5,  category: 'ごはん' },
    { id: 49,  name: '牛丼',               cal: 186, protein: 6.5,  fat: 5.5,  carb: 28.0, fiber: 0.5,  category: 'ごはん' },
    { id: 50,  name: 'カツ丼',             cal: 210, protein: 8.5,  fat: 8.0,  carb: 26.0, fiber: 0.5,  category: 'ごはん' },
    { id: 51,  name: '海鮮丼',             cal: 145, protein: 8.0,  fat: 2.5,  carb: 24.0, fiber: 0.3,  category: 'ごはん' },
    { id: 52,  name: 'ドライカレー',       cal: 175, protein: 5.5,  fat: 5.0,  carb: 27.0, fiber: 1.0,  category: 'ごはん' },
    { id: 53,  name: 'リゾット',           cal: 110, protein: 3.5,  fat: 3.8,  carb: 15.0, fiber: 0.3,  category: 'ごはん' },
    { id: 54,  name: 'ビビンバ',           cal: 165, protein: 6.5,  fat: 5.0,  carb: 24.0, fiber: 1.5,  category: 'ごはん' },
    { id: 55,  name: 'タコライス',         cal: 170, protein: 6.0,  fat: 5.5,  carb: 24.5, fiber: 1.0,  category: 'ごはん' },
    { id: 16,  name: 'カレーライス',       cal: 150, protein: 3.8,  fat: 5.0,  carb: 21.3, fiber: 1.2,  category: 'ごはん' },

    // ===== めん =====
    { id: 4,   name: 'うどん(ゆで)',       cal: 105, protein: 2.6,  fat: 0.4,  carb: 21.6, fiber: 0.8,  category: 'めん' },
    { id: 5,   name: 'そば(ゆで)',         cal: 132, protein: 4.8,  fat: 1.0,  carb: 26.0, fiber: 2.0,  category: 'めん' },
    { id: 6,   name: 'ラーメン(醤油)',     cal: 104, protein: 4.3,  fat: 2.1,  carb: 17.0, fiber: 1.0,  category: 'めん' },
    { id: 7,   name: 'パスタ(ゆで)',       cal: 149, protein: 5.2,  fat: 0.9,  carb: 28.4, fiber: 1.5,  category: 'めん' },
    { id: 56,  name: '焼きそば',           cal: 160, protein: 5.0,  fat: 5.5,  carb: 23.0, fiber: 1.2,  category: 'めん' },
    { id: 57,  name: 'つけ麺',             cal: 130, protein: 5.5,  fat: 3.5,  carb: 19.0, fiber: 1.0,  category: 'めん' },
    { id: 58,  name: 'そうめん(ゆで)',     cal: 127, protein: 3.5,  fat: 0.4,  carb: 25.8, fiber: 0.8,  category: 'めん' },
    { id: 59,  name: '冷やし中華',         cal: 130, protein: 5.0,  fat: 3.0,  carb: 20.0, fiber: 1.0,  category: 'めん' },
    { id: 60,  name: 'ナポリタン',         cal: 155, protein: 5.0,  fat: 5.0,  carb: 22.0, fiber: 1.2,  category: 'めん' },
    { id: 61,  name: 'ペペロンチーノ',     cal: 170, protein: 5.0,  fat: 6.0,  carb: 24.0, fiber: 1.0,  category: 'めん' },
    { id: 62,  name: 'カルボナーラ',       cal: 195, protein: 7.5,  fat: 10.0, carb: 20.0, fiber: 0.8,  category: 'めん' },
    { id: 63,  name: 'ミートソース',       cal: 165, protein: 6.5,  fat: 5.5,  carb: 22.0, fiber: 1.5,  category: 'めん' },
    { id: 64,  name: '担々麺',             cal: 145, protein: 6.0,  fat: 6.5,  carb: 16.0, fiber: 1.0,  category: 'めん' },
    { id: 65,  name: 'フォー',             cal: 95,  protein: 3.5,  fat: 1.5,  carb: 17.0, fiber: 0.5,  category: 'めん' },
    { id: 66,  name: '皿うどん',           cal: 155, protein: 5.5,  fat: 5.0,  carb: 22.0, fiber: 1.5,  category: 'めん' },
    { id: 67,  name: 'ちゃんぽん',         cal: 110, protein: 5.5,  fat: 3.5,  carb: 14.0, fiber: 1.5,  category: 'めん' },

    // ===== パン =====
    { id: 8,   name: '食パン(6枚切り1枚)', cal: 158, protein: 5.6,  fat: 2.6,  carb: 28.0, fiber: 1.4,  category: 'パン' },
    { id: 9,   name: 'トースト(バター)',   cal: 220, protein: 5.8,  fat: 8.0,  carb: 29.0, fiber: 1.4,  category: 'パン' },
    { id: 34,  name: 'コンビニサンドイッチ',cal: 245, protein: 9.0,  fat: 12.0, carb: 25.0, fiber: 1.5,  category: 'パン' },
    { id: 68,  name: 'クロワッサン',       cal: 448, protein: 7.9,  fat: 26.8, carb: 43.9, fiber: 1.8,  category: 'パン' },
    { id: 69,  name: 'メロンパン',         cal: 365, protein: 6.5,  fat: 10.5, carb: 60.0, fiber: 1.2,  category: 'パン' },
    { id: 70,  name: 'カレーパン',         cal: 310, protein: 7.0,  fat: 15.0, carb: 36.0, fiber: 1.5,  category: 'パン' },
    { id: 71,  name: 'あんパン',           cal: 280, protein: 7.5,  fat: 3.5,  carb: 55.0, fiber: 2.5,  category: 'パン' },
    { id: 72,  name: 'フランスパン',       cal: 279, protein: 9.4,  fat: 1.3,  carb: 57.5, fiber: 2.7,  category: 'パン' },
    { id: 73,  name: 'ベーグル',           cal: 275, protein: 10.0, fat: 1.5,  carb: 53.0, fiber: 2.3,  category: 'パン' },
    { id: 74,  name: 'サンドイッチ',       cal: 230, protein: 8.5,  fat: 10.0, carb: 26.0, fiber: 1.5,  category: 'パン' },
    { id: 75,  name: 'ホットドッグ',       cal: 260, protein: 9.0,  fat: 14.0, carb: 24.0, fiber: 1.0,  category: 'パン' },
    { id: 76,  name: 'ハンバーガーバンズ', cal: 265, protein: 8.5,  fat: 4.0,  carb: 48.0, fiber: 2.0,  category: 'パン' },
    { id: 77,  name: '蒸しパン',           cal: 235, protein: 5.0,  fat: 4.0,  carb: 45.0, fiber: 0.8,  category: 'パン' },
    { id: 78,  name: 'ナン',               cal: 262, protein: 7.9,  fat: 3.4,  carb: 50.0, fiber: 2.0,  category: 'パン' },

    // ===== 肉料理 =====
    { id: 10,  name: '鶏むね肉(皮なし)',   cal: 108, protein: 22.3, fat: 1.5,  carb: 0,    fiber: 0,    category: '肉' },
    { id: 11,  name: '鶏もも肉',           cal: 200, protein: 16.2, fat: 14.0, carb: 0,    fiber: 0,    category: '肉' },
    { id: 13,  name: '豚ロース',           cal: 263, protein: 19.3, fat: 19.2, carb: 0.2,  fiber: 0,    category: '肉' },
    { id: 14,  name: '牛肩ロース',         cal: 240, protein: 17.9, fat: 17.4, carb: 0.1,  fiber: 0,    category: '肉' },
    { id: 79,  name: '焼肉',               cal: 280, protein: 18.0, fat: 21.0, carb: 3.0,  fiber: 0.2,  category: '肉' },
    { id: 80,  name: '豚カツ',             cal: 345, protein: 18.5, fat: 22.0, carb: 15.0, fiber: 0.5,  category: '肉' },
    { id: 81,  name: '焼き鳥',             cal: 197, protein: 18.5, fat: 12.0, carb: 3.5,  fiber: 0,    category: '肉' },
    { id: 82,  name: 'チキンカツ',         cal: 290, protein: 19.0, fat: 16.0, carb: 14.0, fiber: 0.3,  category: '肉' },
    { id: 12,  name: '唐揚げ',             cal: 290, protein: 18.0, fat: 18.0, carb: 12.0, fiber: 0.2,  category: '肉' },
    { id: 15,  name: 'ハンバーグ',         cal: 223, protein: 13.5, fat: 14.5, carb: 9.5,  fiber: 0.5,  category: '肉' },
    { id: 83,  name: 'ステーキ',           cal: 250, protein: 21.0, fat: 17.5, carb: 0.3,  fiber: 0,    category: '肉' },
    { id: 84,  name: '生姜焼き',           cal: 220, protein: 17.0, fat: 14.0, carb: 6.0,  fiber: 0.3,  category: '肉' },
    { id: 85,  name: '回鍋肉',             cal: 180, protein: 11.0, fat: 12.0, carb: 7.0,  fiber: 1.5,  category: '肉' },
    { id: 86,  name: '酢豚',               cal: 185, protein: 10.0, fat: 9.0,  carb: 16.0, fiber: 1.0,  category: '肉' },
    { id: 87,  name: '麻婆豆腐',           cal: 130, protein: 8.5,  fat: 8.0,  carb: 5.5,  fiber: 0.8,  category: '肉' },
    { id: 88,  name: '肉じゃが',           cal: 95,  protein: 4.5,  fat: 2.5,  carb: 13.0, fiber: 1.5,  category: '肉' },
    { id: 89,  name: 'ローストビーフ',     cal: 196, protein: 21.7, fat: 11.0, carb: 0.9,  fiber: 0,    category: '肉' },
    { id: 90,  name: '角煮',               cal: 310, protein: 15.0, fat: 25.0, carb: 5.0,  fiber: 0.2,  category: '肉' },
    { id: 91,  name: 'ビーフシチュー',     cal: 120, protein: 6.5,  fat: 5.5,  carb: 11.0, fiber: 1.5,  category: '肉' },
    { id: 92,  name: 'チキン南蛮',         cal: 280, protein: 16.0, fat: 16.0, carb: 16.0, fiber: 0.3,  category: '肉' },
    { id: 93,  name: '手羽先',             cal: 226, protein: 17.5, fat: 16.5, carb: 0,    fiber: 0,    category: '肉' },
    { id: 40,  name: '餃子(5個)',          cal: 230, protein: 9.0,  fat: 11.0, carb: 24.0, fiber: 1.5,  category: '肉' },

    // ===== 魚料理 =====
    { id: 19,  name: 'サケの塩焼き',       cal: 133, protein: 22.3, fat: 4.1,  carb: 0.1,  fiber: 0,    category: '魚' },
    { id: 20,  name: 'サバの味噌煮',       cal: 220, protein: 19.8, fat: 13.5, carb: 6.5,  fiber: 0.3,  category: '魚' },
    { id: 21,  name: '刺身盛り合わせ',     cal: 125, protein: 20.0, fat: 4.5,  carb: 0.5,  fiber: 0,    category: '魚' },
    { id: 94,  name: 'マグロ刺身',         cal: 125, protein: 26.4, fat: 1.4,  carb: 0.1,  fiber: 0,    category: '魚' },
    { id: 95,  name: 'サーモン刺身',       cal: 139, protein: 20.1, fat: 6.2,  carb: 0.1,  fiber: 0,    category: '魚' },
    { id: 96,  name: 'エビフライ',         cal: 250, protein: 15.5, fat: 12.0, carb: 20.0, fiber: 0.5,  category: '魚' },
    { id: 97,  name: 'アジフライ',         cal: 270, protein: 16.0, fat: 15.0, carb: 16.0, fiber: 0.5,  category: '魚' },
    { id: 98,  name: '焼き鮭',             cal: 133, protein: 22.3, fat: 4.1,  carb: 0.1,  fiber: 0,    category: '魚' },
    { id: 99,  name: 'ブリの照り焼き',     cal: 210, protein: 19.0, fat: 12.0, carb: 6.0,  fiber: 0,    category: '魚' },
    { id: 100, name: '海鮮丼の具',         cal: 120, protein: 18.0, fat: 4.0,  carb: 2.0,  fiber: 0,    category: '魚' },
    { id: 101, name: 'エビチリ',           cal: 145, protein: 12.0, fat: 6.5,  carb: 10.0, fiber: 0.8,  category: '魚' },
    { id: 102, name: 'イカフライ',         cal: 255, protein: 14.0, fat: 13.0, carb: 19.0, fiber: 0.3,  category: '魚' },
    { id: 103, name: 'たこ焼き',           cal: 210, protein: 7.0,  fat: 8.0,  carb: 28.0, fiber: 0.5,  category: '魚' },
    { id: 104, name: '魚の煮付け',         cal: 140, protein: 18.0, fat: 4.5,  carb: 5.5,  fiber: 0.2,  category: '魚' },
    { id: 105, name: 'うなぎの蒲焼き',     cal: 293, protein: 23.0, fat: 21.0, carb: 3.5,  fiber: 0,    category: '魚' },
    { id: 106, name: 'ホタテバター',       cal: 120, protein: 13.0, fat: 6.0,  carb: 3.5,  fiber: 0,    category: '魚' },

    // ===== 野菜 =====
    { id: 107, name: 'ほうれん草(茹で)',   cal: 25,  protein: 2.6,  fat: 0.4,  carb: 3.1,  fiber: 2.8,  category: '野菜' },
    { id: 108, name: 'ブロッコリー(茹で)', cal: 27,  protein: 3.5,  fat: 0.4,  carb: 3.6,  fiber: 3.7,  category: '野菜' },
    { id: 109, name: 'キャベツ(生)',       cal: 23,  protein: 1.3,  fat: 0.2,  carb: 5.2,  fiber: 1.8,  category: '野菜' },
    { id: 110, name: 'トマト',             cal: 19,  protein: 0.7,  fat: 0.1,  carb: 4.7,  fiber: 1.0,  category: '野菜' },
    { id: 111, name: 'きゅうり',           cal: 14,  protein: 1.0,  fat: 0.1,  carb: 3.0,  fiber: 1.1,  category: '野菜' },
    { id: 112, name: 'なす(炒め)',         cal: 83,  protein: 1.1,  fat: 6.0,  carb: 6.5,  fiber: 2.1,  category: '野菜' },
    { id: 113, name: '人参(茹で)',         cal: 36,  protein: 0.7,  fat: 0.2,  carb: 8.6,  fiber: 2.8,  category: '野菜' },
    { id: 114, name: 'じゃがいも(茹で)',   cal: 73,  protein: 1.8,  fat: 0.1,  carb: 16.9, fiber: 1.3,  category: '野菜' },
    { id: 115, name: 'かぼちゃ(煮)',       cal: 80,  protein: 1.6,  fat: 0.3,  carb: 18.0, fiber: 2.8,  category: '野菜' },
    { id: 116, name: '大根(煮)',           cal: 25,  protein: 0.5,  fat: 0.1,  carb: 5.5,  fiber: 1.4,  category: '野菜' },
    { id: 117, name: 'レタス',             cal: 12,  protein: 0.6,  fat: 0.1,  carb: 2.8,  fiber: 1.1,  category: '野菜' },
    { id: 118, name: 'もやし(茹で)',       cal: 12,  protein: 1.6,  fat: 0.1,  carb: 1.6,  fiber: 1.1,  category: '野菜' },
    { id: 119, name: '枝豆',               cal: 135, protein: 11.7, fat: 6.2,  carb: 8.8,  fiber: 5.0,  category: '野菜' },
    { id: 120, name: 'アボカド',           cal: 187, protein: 2.5,  fat: 18.7, carb: 6.2,  fiber: 5.3,  category: '野菜' },
    { id: 121, name: 'さつまいも(焼き)',   cal: 163, protein: 1.4,  fat: 0.2,  carb: 39.0, fiber: 3.5,  category: '野菜' },
    { id: 122, name: '里芋(煮)',           cal: 65,  protein: 1.5,  fat: 0.2,  carb: 14.0, fiber: 2.3,  category: '野菜' },
    { id: 123, name: '玉ねぎ(炒め)',       cal: 80,  protein: 1.0,  fat: 4.0,  carb: 10.0, fiber: 1.3,  category: '野菜' },
    { id: 124, name: 'ピーマン(炒め)',     cal: 36,  protein: 1.0,  fat: 2.0,  carb: 4.0,  fiber: 2.1,  category: '野菜' },
    { id: 125, name: '白菜(煮)',           cal: 14,  protein: 0.8,  fat: 0.1,  carb: 3.2,  fiber: 1.3,  category: '野菜' },
    { id: 126, name: 'きのこ(炒め)',       cal: 40,  protein: 2.5,  fat: 2.0,  carb: 4.5,  fiber: 3.0,  category: '野菜' },

    // ===== 飲料 =====
    { id: 35,  name: 'コーヒー(ブラック)', cal: 4,   protein: 0.2,  fat: 0,    carb: 0.7,  fiber: 0,    category: '飲料' },
    { id: 36,  name: 'オレンジジュース',   cal: 42,  protein: 0.4,  fat: 0.1,  carb: 10.0, fiber: 0.2,  category: '飲料' },
    { id: 127, name: '緑茶',               cal: 2,   protein: 0.2,  fat: 0,    carb: 0.3,  fiber: 0,    category: '飲料' },
    { id: 128, name: 'コーラ',             cal: 46,  protein: 0,    fat: 0,    carb: 11.3, fiber: 0,    category: '飲料' },
    { id: 129, name: 'ビール',             cal: 40,  protein: 0.3,  fat: 0,    carb: 3.1,  fiber: 0,    category: '飲料' },
    { id: 130, name: '日本酒',             cal: 103, protein: 0.4,  fat: 0,    carb: 3.6,  fiber: 0,    category: '飲料' },
    { id: 131, name: '牛乳',               cal: 67,  protein: 3.3,  fat: 3.8,  carb: 4.8,  fiber: 0,    category: '飲料' },
    { id: 132, name: '豆乳',               cal: 46,  protein: 3.6,  fat: 2.0,  carb: 3.1,  fiber: 0.2,  category: '飲料' },
    { id: 133, name: 'コーヒー(ラテ)',     cal: 56,  protein: 2.4,  fat: 2.5,  carb: 6.0,  fiber: 0,    category: '飲料' },
    { id: 134, name: 'ココア',             cal: 82,  protein: 3.0,  fat: 2.8,  carb: 11.0, fiber: 1.5,  category: '飲料' },
    { id: 135, name: 'スポーツドリンク',   cal: 25,  protein: 0,    fat: 0,    carb: 6.2,  fiber: 0,    category: '飲料' },
    { id: 136, name: '野菜ジュース',       cal: 30,  protein: 0.6,  fat: 0.1,  carb: 6.8,  fiber: 0.5,  category: '飲料' },
    { id: 137, name: 'りんごジュース',     cal: 44,  protein: 0.1,  fat: 0.1,  carb: 11.0, fiber: 0.1,  category: '飲料' },
    { id: 138, name: 'レモンサワー',       cal: 50,  protein: 0,    fat: 0,    carb: 5.0,  fiber: 0,    category: '飲料' },
    { id: 139, name: 'ハイボール',         cal: 47,  protein: 0,    fat: 0,    carb: 0.1,  fiber: 0,    category: '飲料' },
    { id: 140, name: '赤ワイン',           cal: 73,  protein: 0.2,  fat: 0,    carb: 1.5,  fiber: 0,    category: '飲料' },
    { id: 141, name: '白ワイン',           cal: 73,  protein: 0.1,  fat: 0,    carb: 2.0,  fiber: 0,    category: '飲料' },
    { id: 142, name: 'エナジードリンク',   cal: 46,  protein: 0,    fat: 0,    carb: 11.0, fiber: 0,    category: '飲料' },
    { id: 143, name: '甘酒',               cal: 81,  protein: 1.7,  fat: 0.1,  carb: 18.3, fiber: 0.4,  category: '飲料' },
    { id: 144, name: '抹茶ラテ',           cal: 65,  protein: 2.5,  fat: 2.0,  carb: 9.5,  fiber: 0.5,  category: '飲料' },

    // ===== コンビニ =====
    { id: 145, name: '鮭おにぎり',         cal: 170, protein: 4.5,  fat: 1.2,  carb: 35.0, fiber: 0.3,  category: 'コンビニ' },
    { id: 146, name: 'ツナマヨおにぎり',   cal: 190, protein: 4.0,  fat: 4.5,  carb: 34.0, fiber: 0.3,  category: 'コンビニ' },
    { id: 147, name: '梅おにぎり',         cal: 160, protein: 2.8,  fat: 0.5,  carb: 35.5, fiber: 0.4,  category: 'コンビニ' },
    { id: 148, name: '明太子おにぎり',     cal: 172, protein: 4.0,  fat: 1.5,  carb: 35.0, fiber: 0.3,  category: 'コンビニ' },
    { id: 149, name: '赤飯おにぎり',       cal: 185, protein: 4.0,  fat: 0.5,  carb: 40.0, fiber: 1.5,  category: 'コンビニ' },
    { id: 150, name: 'コンビニサラダ',     cal: 30,  protein: 1.5,  fat: 0.5,  carb: 5.0,  fiber: 1.8,  category: 'コンビニ' },
    { id: 151, name: 'コンビニ幕の内弁当', cal: 155, protein: 5.5,  fat: 4.5,  carb: 24.0, fiber: 1.0,  category: 'コンビニ' },
    { id: 152, name: 'コンビニサンド',     cal: 245, protein: 9.0,  fat: 12.0, carb: 25.0, fiber: 1.5,  category: 'コンビニ' },
    { id: 153, name: 'おでん(大根)',       cal: 15,  protein: 0.5,  fat: 0.1,  carb: 3.5,  fiber: 1.2,  category: 'コンビニ' },
    { id: 154, name: 'おでん(卵)',         cal: 80,  protein: 6.5,  fat: 5.5,  carb: 0.5,  fiber: 0,    category: 'コンビニ' },
    { id: 155, name: 'おでん(ちくわ)',     cal: 95,  protein: 8.0,  fat: 1.5,  carb: 12.0, fiber: 0,    category: 'コンビニ' },
    { id: 156, name: '肉まん',             cal: 220, protein: 7.5,  fat: 8.0,  carb: 30.0, fiber: 1.0,  category: 'コンビニ' },
    { id: 157, name: 'カップ麺(醤油)',     cal: 448, protein: 10.3, fat: 19.5, carb: 57.0, fiber: 2.0,  category: 'コンビニ' },
    { id: 158, name: 'カップ麺(カップヌードル)',cal: 455, protein: 10.5, fat: 20.0, carb: 56.5, fiber: 2.5, category: 'コンビニ' },
    { id: 159, name: 'コンビニチキン',     cal: 250, protein: 16.0, fat: 16.0, carb: 10.0, fiber: 0.3,  category: 'コンビニ' },
    { id: 160, name: 'ゆで卵',             cal: 151, protein: 12.9, fat: 10.0, carb: 0.3,  fiber: 0,    category: 'コンビニ' },

    // ===== ファストフード =====
    { id: 161, name: 'ハンバーガー',       cal: 256, protein: 13.0, fat: 10.0, carb: 28.0, fiber: 1.5,  category: 'ファストフード' },
    { id: 162, name: 'チーズバーガー',     cal: 302, protein: 16.0, fat: 14.0, carb: 28.0, fiber: 1.5,  category: 'ファストフード' },
    { id: 163, name: 'ビッグバーガー',     cal: 280, protein: 15.0, fat: 14.0, carb: 24.0, fiber: 1.5,  category: 'ファストフード' },
    { id: 164, name: 'フライドポテト(M)',  cal: 312, protein: 3.4,  fat: 15.0, carb: 41.0, fiber: 3.8,  category: 'ファストフード' },
    { id: 165, name: 'チキンナゲット(5個)',cal: 280, protein: 16.0, fat: 17.0, carb: 15.0, fiber: 0.5,  category: 'ファストフード' },
    { id: 166, name: 'フィッシュバーガー', cal: 270, protein: 12.0, fat: 13.0, carb: 28.0, fiber: 1.0,  category: 'ファストフード' },
    { id: 167, name: 'テリヤキバーガー',   cal: 275, protein: 14.0, fat: 12.0, carb: 29.0, fiber: 1.5,  category: 'ファストフード' },
    { id: 168, name: 'ホットドッグ(FF)',   cal: 260, protein: 9.0,  fat: 14.0, carb: 24.0, fiber: 1.0,  category: 'ファストフード' },
    { id: 169, name: 'フライドチキン',     cal: 260, protein: 19.0, fat: 16.0, carb: 10.0, fiber: 0.3,  category: 'ファストフード' },
    { id: 170, name: 'ピザ(1切れ)',        cal: 268, protein: 11.0, fat: 10.0, carb: 33.0, fiber: 2.0,  category: 'ファストフード' },
    { id: 171, name: 'ドーナツ',           cal: 379, protein: 6.0,  fat: 18.0, carb: 50.0, fiber: 1.5,  category: 'ファストフード' },
    { id: 172, name: 'ソフトクリーム',     cal: 146, protein: 3.5,  fat: 5.5,  carb: 22.0, fiber: 0,    category: 'ファストフード' },
    { id: 173, name: 'シェイク',           cal: 112, protein: 3.0,  fat: 3.5,  carb: 18.0, fiber: 0.2,  category: 'ファストフード' },
    { id: 174, name: 'サブウェイサンド',   cal: 160, protein: 9.0,  fat: 4.5,  carb: 22.0, fiber: 2.0,  category: 'ファストフード' },
    { id: 175, name: 'ケバブ',             cal: 190, protein: 14.0, fat: 9.0,  carb: 14.0, fiber: 1.5,  category: 'ファストフード' },

    // ===== デザート =====
    { id: 176, name: 'ショートケーキ',     cal: 344, protein: 4.5,  fat: 21.0, carb: 34.0, fiber: 0.5,  category: 'デザート' },
    { id: 177, name: 'チーズケーキ',       cal: 321, protein: 6.0,  fat: 22.0, carb: 26.0, fiber: 0.3,  category: 'デザート' },
    { id: 178, name: 'チョコレート',       cal: 558, protein: 6.9,  fat: 34.1, carb: 55.8, fiber: 3.9,  category: 'デザート' },
    { id: 179, name: 'アイスクリーム',     cal: 207, protein: 3.5,  fat: 12.0, carb: 23.0, fiber: 0,    category: 'デザート' },
    { id: 180, name: 'プリン',             cal: 126, protein: 5.5,  fat: 5.0,  carb: 15.0, fiber: 0,    category: 'デザート' },
    { id: 181, name: '大福',               cal: 242, protein: 4.5,  fat: 0.5,  carb: 55.0, fiber: 1.5,  category: 'デザート' },
    { id: 182, name: 'たい焼き',           cal: 232, protein: 5.0,  fat: 1.5,  carb: 50.0, fiber: 2.0,  category: 'デザート' },
    { id: 183, name: 'どら焼き',           cal: 284, protein: 6.0,  fat: 3.0,  carb: 57.0, fiber: 2.5,  category: 'デザート' },
    { id: 184, name: 'ポテトチップス',     cal: 554, protein: 4.7,  fat: 35.2, carb: 54.7, fiber: 4.2,  category: 'デザート' },
    { id: 185, name: 'せんべい',           cal: 373, protein: 7.0,  fat: 1.5,  carb: 83.0, fiber: 0.8,  category: 'デザート' },
    { id: 186, name: 'クッキー',           cal: 490, protein: 5.5,  fat: 24.0, carb: 63.0, fiber: 1.0,  category: 'デザート' },
    { id: 187, name: 'マカロン',           cal: 392, protein: 5.5,  fat: 14.0, carb: 62.0, fiber: 1.0,  category: 'デザート' },
    { id: 188, name: 'ワッフル',           cal: 312, protein: 6.5,  fat: 12.0, carb: 45.0, fiber: 0.8,  category: 'デザート' },
    { id: 189, name: 'パンケーキ',         cal: 253, protein: 6.5,  fat: 8.0,  carb: 40.0, fiber: 0.8,  category: 'デザート' },
    { id: 190, name: '杏仁豆腐',           cal: 65,  protein: 1.5,  fat: 2.5,  carb: 10.0, fiber: 0,    category: 'デザート' },

    // ===== その他(既存カテゴリ) =====
    { id: 22,  name: '目玉焼き',           cal: 200, protein: 13.0, fat: 15.0, carb: 0.5,  fiber: 0,    category: '卵' },
    { id: 23,  name: 'スクランブルエッグ', cal: 212, protein: 11.5, fat: 17.0, carb: 2.5,  fiber: 0,    category: '卵' },
    { id: 24,  name: '味噌汁',             cal: 25,  protein: 1.8,  fat: 0.5,  carb: 2.8,  fiber: 0.5,  category: '汁物' },
    { id: 25,  name: '豚汁',               cal: 50,  protein: 3.5,  fat: 2.0,  carb: 4.5,  fiber: 1.0,  category: '汁物' },
    { id: 26,  name: 'サラダ(ドレッシング)',cal: 45,  protein: 1.5,  fat: 2.5,  carb: 4.0,  fiber: 1.8,  category: 'サラダ' },
    { id: 27,  name: '冷奴',               cal: 55,  protein: 5.0,  fat: 3.0,  carb: 1.5,  fiber: 0.3,  category: 'サラダ' },
    { id: 28,  name: 'バナナ',             cal: 86,  protein: 1.1,  fat: 0.2,  carb: 22.5, fiber: 1.1,  category: '果物' },
    { id: 29,  name: 'りんご',             cal: 54,  protein: 0.2,  fat: 0.1,  carb: 14.6, fiber: 1.5,  category: '果物' },
    { id: 30,  name: 'ヨーグルト(無糖)',   cal: 62,  protein: 3.6,  fat: 3.0,  carb: 4.9,  fiber: 0,    category: '乳製品' },
    { id: 31,  name: '牛乳(200ml)',        cal: 134, protein: 6.6,  fat: 7.6,  carb: 9.6,  fiber: 0,    category: '乳製品' },
    { id: 32,  name: 'チーズ(1切れ)',      cal: 339, protein: 22.7, fat: 26.0, carb: 1.3,  fiber: 0,    category: '乳製品' },
    { id: 39,  name: 'プロテインバー',     cal: 380, protein: 30.0, fat: 12.0, carb: 35.0, fiber: 5.0,  category: 'サプリ' },

    // ===== 追加: 卵 =====
    { id: 191, name: 'ゆで卵(全卵)',       cal: 151, protein: 12.9, fat: 10.0, carb: 0.3,  fiber: 0,    category: '卵' },
    { id: 192, name: '卵焼き',             cal: 151, protein: 10.0, fat: 9.5,  carb: 5.5,  fiber: 0,    category: '卵' },
    { id: 193, name: 'オムレツ',           cal: 190, protein: 11.0, fat: 14.0, carb: 3.0,  fiber: 0.2,  category: '卵' },
    { id: 194, name: '温泉卵',             cal: 146, protein: 12.3, fat: 10.0, carb: 0.5,  fiber: 0,    category: '卵' },

    // ===== 追加: 汁物 =====
    { id: 195, name: 'コーンスープ',       cal: 68,  protein: 1.8,  fat: 2.5,  carb: 10.0, fiber: 0.5,  category: '汁物' },
    { id: 196, name: 'ミネストローネ',     cal: 40,  protein: 1.5,  fat: 1.0,  carb: 6.0,  fiber: 1.5,  category: '汁物' },
    { id: 197, name: 'クラムチャウダー',   cal: 72,  protein: 3.0,  fat: 3.5,  carb: 7.0,  fiber: 0.5,  category: '汁物' },
    { id: 198, name: 'わかめスープ',       cal: 12,  protein: 1.0,  fat: 0.5,  carb: 1.0,  fiber: 0.8,  category: '汁物' },

    // ===== 追加: 果物 =====
    { id: 199, name: 'みかん',             cal: 46,  protein: 0.7,  fat: 0.1,  carb: 12.0, fiber: 1.0,  category: '果物' },
    { id: 200, name: 'ぶどう',             cal: 59,  protein: 0.4,  fat: 0.1,  carb: 15.7, fiber: 0.5,  category: '果物' },
    { id: 201, name: 'いちご',             cal: 34,  protein: 0.9,  fat: 0.1,  carb: 8.5,  fiber: 1.4,  category: '果物' },
    { id: 202, name: 'キウイ',             cal: 53,  protein: 1.0,  fat: 0.1,  carb: 13.5, fiber: 2.5,  category: '果物' },
    { id: 203, name: 'グレープフルーツ',   cal: 38,  protein: 0.9,  fat: 0.1,  carb: 9.6,  fiber: 0.6,  category: '果物' },
    { id: 204, name: '桃',                 cal: 40,  protein: 0.6,  fat: 0.1,  carb: 10.2, fiber: 1.3,  category: '果物' },
    { id: 205, name: 'マンゴー',           cal: 64,  protein: 0.6,  fat: 0.1,  carb: 16.9, fiber: 1.3,  category: '果物' },

    // ===== 追加: サラダ =====
    { id: 206, name: 'シーザーサラダ',     cal: 80,  protein: 3.5,  fat: 5.5,  carb: 4.5,  fiber: 1.2,  category: 'サラダ' },
    { id: 207, name: 'ポテトサラダ',       cal: 120, protein: 2.5,  fat: 7.5,  carb: 11.0, fiber: 1.0,  category: 'サラダ' },
    { id: 208, name: 'マカロニサラダ',     cal: 170, protein: 3.5,  fat: 10.0, carb: 16.0, fiber: 0.8,  category: 'サラダ' },
    { id: 209, name: 'ごぼうサラダ',       cal: 95,  protein: 1.5,  fat: 5.5,  carb: 10.0, fiber: 3.5,  category: 'サラダ' },
  ],

  // ローマ字→ひらがな変換マッピング
  _romajiMap: {
    'sha':'しゃ','shi':'し','shu':'しゅ','sho':'しょ',
    'cha':'ちゃ','chi':'ち','chu':'ちゅ','cho':'ちょ',
    'tsu':'つ','tya':'ちゃ','tyu':'ちゅ','tyo':'ちょ',
    'nya':'にゃ','nyu':'にゅ','nyo':'にょ',
    'hya':'ひゃ','hyu':'ひゅ','hyo':'ひょ',
    'mya':'みゃ','myu':'みゅ','myo':'みょ',
    'rya':'りゃ','ryu':'りゅ','ryo':'りょ',
    'gya':'ぎゃ','gyu':'ぎゅ','gyo':'ぎょ',
    'bya':'びゃ','byu':'びゅ','byo':'びょ',
    'pya':'ぴゃ','pyu':'ぴゅ','pyo':'ぴょ',
    'ja':'じゃ','ju':'じゅ','jo':'じょ',
    'ka':'か','ki':'き','ku':'く','ke':'け','ko':'こ',
    'sa':'さ','si':'し','su':'す','se':'せ','so':'そ',
    'ta':'た','ti':'ち','tu':'つ','te':'て','to':'と',
    'na':'な','ni':'に','nu':'ぬ','ne':'ね','no':'の',
    'ha':'は','hi':'ひ','hu':'ふ','fu':'ふ','he':'へ','ho':'ほ',
    'ma':'ま','mi':'み','mu':'む','me':'め','mo':'も',
    'ya':'や','yu':'ゆ','yo':'よ',
    'ra':'ら','ri':'り','ru':'る','re':'れ','ro':'ろ',
    'wa':'わ','wi':'ゐ','we':'ゑ','wo':'を',
    'ga':'が','gi':'ぎ','gu':'ぐ','ge':'げ','go':'ご',
    'za':'ざ','zi':'じ','zu':'ず','ze':'ぜ','zo':'ぞ',
    'da':'だ','di':'ぢ','du':'づ','de':'で','do':'ど',
    'ba':'ば','bi':'び','bu':'ぶ','be':'べ','bo':'ぼ',
    'pa':'ぱ','pi':'ぴ','pu':'ぷ','pe':'ぺ','po':'ぽ',
    'nn':'ん','n\'':'ん',
    'a':'あ','i':'い','u':'う','e':'え','o':'お'
  },

  // ローマ字をひらがなに変換
  romajiToHiragana(text) {
    let result = '';
    let i = 0;
    const s = text.toLowerCase();
    while (i < s.length) {
      // 促音: 同じ子音が連続
      if (i + 1 < s.length && s[i] === s[i+1] && 'bcdfghjklmpqrstvwxyz'.includes(s[i])) {
        result += 'っ';
        i++;
        continue;
      }
      let matched = false;
      // 3文字マッチ
      if (i + 2 < s.length) {
        const tri = s.substring(i, i+3);
        if (this._romajiMap[tri]) {
          result += this._romajiMap[tri];
          i += 3;
          matched = true;
        }
      }
      // 2文字マッチ
      if (!matched && i + 1 < s.length) {
        const bi = s.substring(i, i+2);
        if (this._romajiMap[bi]) {
          result += this._romajiMap[bi];
          i += 2;
          matched = true;
        }
      }
      // 1文字マッチ
      if (!matched) {
        const ch = s[i];
        if (this._romajiMap[ch]) {
          result += this._romajiMap[ch];
        } else if (ch === 'n' && (i + 1 >= s.length || !'aiueoy'.includes(s[i+1]))) {
          result += 'ん';
        } else {
          result += ch;
        }
        i++;
      }
    }
    return result;
  },

  // ひらがな→カタカナ変換
  hiraganaToKatakana(text) {
    return text.replace(/[\u3041-\u3096]/g, function(ch) {
      return String.fromCharCode(ch.charCodeAt(0) + 0x60);
    });
  },

  // 全食品リスト取得 (DB + カスタム)
  _getAllFoods() {
    const customs = (typeof Store !== 'undefined') ? Store.getCustomFoods() : [];
    return this.foods.concat(customs);
  },

  // カタカナ→ひらがな変換
  katakanaToHiragana(text) {
    return text.replace(/[\u30A1-\u30F6]/g, function(ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0x60);
    });
  },

  // テキストをひらがなに正規化 (カタカナ→ひらがな変換)
  _normalize(text) {
    return this.katakanaToHiragana(text.toLowerCase());
  },

  // 食品検索 (重み付き: exact > startsWith > contains > fuzzy)
  search(query) {
    const allFoods = this._getAllFoods();
    if (!query || query.trim() === '') return allFoods.slice(0, 10);
    let q = query.toLowerCase();

    // ASCII文字のみならローマ字→ひらがな変換を試す
    let hiraganaQ = null;
    let katakanaQ = null;
    if (/^[a-zA-Z']+$/.test(q)) {
      hiraganaQ = this.romajiToHiragana(q);
      katakanaQ = this.hiraganaToKatakana(hiraganaQ);
    }

    // ひらがな正規化したクエリ
    const normQ = this._normalize(q);
    const normHQ = hiraganaQ ? this._normalize(hiraganaQ) : null;

    const scored = [];
    allFoods.forEach(f => {
      const name = f.name.toLowerCase();
      const cat = f.category.toLowerCase();
      const normName = this._normalize(name);
      let score = 0;

      // Exact match (name equals query)
      if (name === q || normName === normQ || (normHQ && normName === normHQ)) {
        score = 100;
      }
      // Starts with
      else if (name.startsWith(q) || normName.startsWith(normQ) || (normHQ && normName.startsWith(normHQ))) {
        score = 80;
      }
      // Contains
      else if (name.includes(q) || cat.includes(q) || normName.includes(normQ) || (normHQ && normName.includes(normHQ))) {
        score = 60;
      }
      // Katakana query match
      else if (katakanaQ && (name.includes(katakanaQ) || cat.includes(katakanaQ))) {
        score = 60;
      }
      // Fuzzy match: all characters of query appear in order in the name
      else {
        const fuzzyTarget = normName;
        const fuzzyQuery = normHQ || normQ;
        let fi = 0;
        for (let ci = 0; ci < fuzzyTarget.length && fi < fuzzyQuery.length; ci++) {
          if (fuzzyTarget[ci] === fuzzyQuery[fi]) fi++;
        }
        if (fi === fuzzyQuery.length) {
          score = 20;
        }
      }

      if (score > 0) {
        scored.push({ food: f, score: score });
      }
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.food);
  },

  // カテゴリ一覧
  getCategories() {
    return [...new Set(this._getAllFoods().map(f => f.category))];
  },

  // カテゴリで絞り込み
  getByCategory(category) {
    return this._getAllFoods().filter(f => f.category === category);
  },

  // IDで取得
  getById(id) {
    // Check custom foods first
    if (typeof id === 'string' && id.startsWith('custom_')) {
      const customs = (typeof Store !== 'undefined') ? Store.getCustomFoods() : [];
      return customs.find(f => f.id === id);
    }
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
