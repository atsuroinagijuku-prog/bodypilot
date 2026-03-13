// ============================
// 運動データベース
// ============================

const ExerciseDB = {
  exercises: [
    { id: 1, name: 'ウォーキング', calPerMin: 3.5 },
    { id: 2, name: 'ジョギング', calPerMin: 7 },
    { id: 3, name: 'ランニング', calPerMin: 10 },
    { id: 4, name: 'サイクリング', calPerMin: 6 },
    { id: 5, name: '水泳', calPerMin: 8 },
    { id: 6, name: 'ヨガ', calPerMin: 3 },
    { id: 7, name: '筋トレ', calPerMin: 5 },
    { id: 8, name: 'ストレッチ', calPerMin: 2.5 },
    { id: 9, name: 'ダンス', calPerMin: 5 },
    { id: 10, name: '階段昇降', calPerMin: 7 },
    { id: 11, name: 'テニス', calPerMin: 7 },
    { id: 12, name: 'サッカー', calPerMin: 8 },
    { id: 13, name: 'バスケ', calPerMin: 8 },
    { id: 14, name: '掃除', calPerMin: 3 },
    { id: 15, name: '料理', calPerMin: 2 },
    { id: 16, name: '通勤（徒歩）', calPerMin: 3 },
    { id: 17, name: '通勤（自転車）', calPerMin: 5 },
    { id: 18, name: 'デスクワーク', calPerMin: 1.5 },
    { id: 19, name: '買い物', calPerMin: 2.5 },
    { id: 20, name: 'ゴルフ', calPerMin: 4 },
  ],

  getAll() {
    return this.exercises;
  },

  search(query) {
    if (!query || !query.trim()) return this.exercises;
    const q = query.trim().toLowerCase();
    return this.exercises.filter(e => e.name.toLowerCase().includes(q));
  },

  calculate(exercise, minutes, userWeightKg) {
    // MET-based calculation adjusted by user weight
    // 65kg is the reference weight for the base calPerMin values
    const weightFactor = userWeightKg ? (userWeightKg / 65) : 1;
    const baseCal = exercise.calPerMin * minutes;
    return Math.round(baseCal * weightFactor);
  }
};
