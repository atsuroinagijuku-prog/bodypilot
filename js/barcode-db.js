// ============================
// バーコードデータベース (JAN/EANコード)
// ============================

const BarcodeDB = {
  // Common Japanese products (JAN codes)
  items: {
    // === 飲料 ===
    '4902102141239': { name: 'コカ・コーラ 500ml', cal: 225, protein: 0, fat: 0, carb: 56.5, fiber: 0, weight: 500 },
    '4902102139892': { name: 'コカ・コーラ ゼロ 500ml', cal: 0, protein: 0, fat: 0, carb: 0, fiber: 0, weight: 500 },
    '4901340032026': { name: 'サントリー天然水 550ml', cal: 0, protein: 0, fat: 0, carb: 0, fiber: 0, weight: 550 },
    '4901777304598': { name: 'おーいお茶 525ml', cal: 0, protein: 0, fat: 0, carb: 0, fiber: 0, weight: 525 },
    '4901330561512': { name: 'カルピスウォーター 500ml', cal: 230, protein: 0, fat: 0, carb: 57.5, fiber: 0, weight: 500 },
    '4902102072625': { name: 'ファンタグレープ 500ml', cal: 230, protein: 0, fat: 0, carb: 57.5, fiber: 0, weight: 500 },
    '4902777323046': { name: 'ボス ブラック 185g', cal: 0, protein: 0, fat: 0, carb: 0.7, fiber: 0, weight: 185 },
    '4901001103331': { name: 'ポカリスエット 500ml', cal: 125, protein: 0, fat: 0, carb: 31, fiber: 0, weight: 500 },
    '4901340038264': { name: 'GREEN DA・KA・RA 550ml', cal: 99, protein: 0, fat: 0, carb: 24.8, fiber: 0, weight: 550 },
    '4901777335295': { name: '濃い茶 525ml', cal: 0, protein: 0, fat: 0, carb: 0, fiber: 0, weight: 525 },
    '4902102114363': { name: 'アクエリアス 500ml', cal: 95, protein: 0, fat: 0, carb: 23.5, fiber: 0, weight: 500 },
    '4901340037342': { name: 'BOSS カフェオレ 185g', cal: 72, protein: 1.3, fat: 2.2, carb: 11.5, fiber: 0, weight: 185 },
    '4902102131278': { name: 'い・ろ・は・す 555ml', cal: 0, protein: 0, fat: 0, carb: 0, fiber: 0, weight: 555 },
    '4901777254015': { name: '午後の紅茶 ストレートティー 500ml', cal: 80, protein: 0, fat: 0, carb: 20, fiber: 0, weight: 500 },
    '4901777254022': { name: '午後の紅茶 ミルクティー 500ml', cal: 185, protein: 2, fat: 3.5, carb: 36.5, fiber: 0, weight: 500 },
    '4901777254039': { name: '午後の紅茶 レモンティー 500ml', cal: 140, protein: 0, fat: 0, carb: 35, fiber: 0, weight: 500 },

    // === スナック・菓子 ===
    '4902705117419': { name: 'カップヌードル', cal: 353, protein: 10.7, fat: 14.6, carb: 44.5, fiber: 2.4, weight: 78 },
    '4902105227404': { name: 'ポッキー チョコレート', cal: 364, protein: 7.3, fat: 17.4, carb: 45.6, fiber: 2.7, weight: 72 },
    '4901085611647': { name: 'チョコレート効果72%', cal: 580, protein: 10.4, fat: 42, carb: 36.1, fiber: 12.3, weight: 75 },
    '4902555125961': { name: 'ブラックサンダー', cal: 110, protein: 1.2, fat: 5.8, carb: 13.4, fiber: 0.4, weight: 21 },
    '4902370545982': { name: 'じゃがりこ サラダ', cal: 298, protein: 4.5, fat: 14.4, carb: 38.1, fiber: 2.6, weight: 60 },
    '4901990516976': { name: 'ベビースターラーメン', cal: 459, protein: 8.9, fat: 19.6, carb: 62, fiber: 2.2, weight: 74 },
    '4903015100316': { name: 'ガルボ チョコ', cal: 554, protein: 7.5, fat: 33, carb: 56.2, fiber: 3.8, weight: 68 },
    '4901330573218': { name: 'ハイチュウ グレープ', cal: 390, protein: 1.5, fat: 4.5, carb: 86, fiber: 0, weight: 55 },
    '4902370519310': { name: 'かっぱえびせん', cal: 482, protein: 6.9, fat: 22.5, carb: 63.3, fiber: 1.3, weight: 85 },
    '4901330531126': { name: 'コアラのマーチ', cal: 535, protein: 6.5, fat: 30.5, carb: 59, fiber: 2.0, weight: 50 },
    '4902370518191': { name: 'ポテトチップス うすしお', cal: 554, protein: 4.7, fat: 35.2, carb: 54.7, fiber: 4.2, weight: 60 },
    '4901330513429': { name: 'トッポ', cal: 533, protein: 6.8, fat: 29.5, carb: 60.5, fiber: 2.3, weight: 72 },
    '4902370507338': { name: 'じゃがビー うすしお味', cal: 505, protein: 4.5, fat: 28, carb: 58, fiber: 3.8, weight: 80 },
    '4901085181973': { name: 'キットカット ミニ', cal: 510, protein: 6.5, fat: 27.2, carb: 61.3, fiber: 1.5, weight: 70 },
    '4902555131580': { name: 'アルフォート', cal: 519, protein: 7.0, fat: 27.5, carb: 62.5, fiber: 2.8, weight: 75 },

    // === カップ麺 ===
    '4902105236406': { name: 'カップヌードル シーフード', cal: 323, protein: 9.2, fat: 11.2, carb: 46.6, fiber: 2.1, weight: 75 },
    '4902105236413': { name: 'カップヌードル カレー', cal: 395, protein: 10.5, fat: 18.4, carb: 46.5, fiber: 3.0, weight: 87 },
    '4901734032625': { name: 'どん兵衛 きつねうどん', cal: 421, protein: 10.4, fat: 17.4, carb: 55.6, fiber: 2.0, weight: 96 },
    '4901734032632': { name: 'どん兵衛 天ぷらそば', cal: 479, protein: 11.3, fat: 22.8, carb: 56.8, fiber: 3.0, weight: 100 },
    '4901071230050': { name: 'チキンラーメン ミニ', cal: 445, protein: 8.2, fat: 15.6, carb: 66.5, fiber: 2.5, weight: 85 },

    // === おにぎり・弁当 ===
    '4901001000012': { name: 'おにぎり 鮭', cal: 178, protein: 4.8, fat: 1.2, carb: 37.5, fiber: 0.4, weight: 110 },
    '4901001000029': { name: 'おにぎり ツナマヨ', cal: 212, protein: 5.2, fat: 5.8, carb: 35.5, fiber: 0.3, weight: 110 },
  },

  lookup(code) {
    return this.items[code] || null;
  },

  // Manual entry fallback
  getManualEntryPrompt() {
    return '商品が見つかりませんでした。手動で栄養情報を入力してください。';
  }
};
