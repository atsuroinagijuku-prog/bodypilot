// ============================
// ゲーミフィケーション
// ============================

const Gamification = {
  // Badge definitions
  badges: [
    { id: 'first_meal', name: '初めての一歩', description: '初めての食事を記録', icon: '🍽️', condition: (stats) => stats.totalMeals >= 1 },
    { id: 'streak_3', name: '3日連続', description: '3日連続で記録', icon: '🔥', condition: (stats) => stats.streak >= 3 },
    { id: 'streak_7', name: '1週間継続', description: '7日連続で記録', icon: '⭐', condition: (stats) => stats.streak >= 7 },
    { id: 'streak_30', name: '1ヶ月マスター', description: '30日連続で記録', icon: '🏆', condition: (stats) => stats.streak >= 30 },
    { id: 'streak_100', name: '100日の達人', description: '100日連続で記録', icon: '👑', condition: (stats) => stats.streak >= 100 },
    { id: 'perfect_day', name: 'パーフェクトデイ', description: 'ヘルススコア90以上達成', icon: '💎', condition: (stats) => stats.bestScore >= 90 },
    { id: 'balanced', name: 'バランスマスター', description: 'PFCバランスが理想的な日', icon: '⚖️', condition: (stats) => stats.balancedDays >= 1 },
    { id: 'veggie_lover', name: '野菜好き', description: '野菜を10回記録', icon: '🥦', condition: (stats) => stats.veggieMeals >= 10 },
    { id: 'protein_pro', name: 'プロテインプロ', description: 'タンパク質目標を7日達成', icon: '💪', condition: (stats) => stats.proteinGoalDays >= 7 },
    { id: 'early_bird', name: '早起き記録', description: '朝食を10回記録', icon: '🌅', condition: (stats) => stats.breakfastCount >= 10 },
    { id: 'weight_tracker', name: '体重管理者', description: '体重を7回記録', icon: '📊', condition: (stats) => stats.weightEntries >= 7 },
    { id: 'water_master', name: '水分マスター', description: '水分目標を5日達成', icon: '💧', condition: (stats) => stats.waterGoalDays >= 5 },
    { id: 'foods_50', name: '食の探求者', description: '50種類の食品を記録', icon: '🍱', condition: (stats) => stats.uniqueFoods >= 50 },
    { id: 'exercise_start', name: '運動開始', description: '初めての運動を記録', icon: '🏃', condition: (stats) => stats.totalExercises >= 1 },
    { id: 'meals_100', name: '100食達成', description: '合計100食を記録', icon: '🎯', condition: (stats) => stats.totalMeals >= 100 },
  ],

  // Weekly challenges
  challenges: [
    { id: 'veggie_week', name: '野菜ウィーク', description: '今週毎日野菜を食べよう', target: 7, unit: '日' },
    { id: 'water_challenge', name: '水分チャレンジ', description: '今週毎日2L飲もう', target: 7, unit: '日' },
    { id: 'breakfast_week', name: '朝食習慣', description: '今週毎日朝食を記録しよう', target: 7, unit: '日' },
    { id: 'exercise_3', name: '運動習慣', description: '今週3回以上運動しよう', target: 3, unit: '回' },
    { id: 'perfect_3', name: 'パーフェクト3', description: '今週3日スコア80以上を達成', target: 3, unit: '日' },
  ],

  _key(name) {
    const uid = Auth.currentUser ? Auth.currentUser.uid : 'anon';
    return `bp_${uid}_${name}`;
  },

  // Get user stats from store
  getStats() {
    const uid = Auth.currentUser ? Auth.currentUser.uid : 'anon';
    const mealsKey = `bp_${uid}_meals`;
    const allMeals = JSON.parse(localStorage.getItem(mealsKey) || '{}');
    const goals = Store.getGoals();
    const weights = Store.getWeights();
    const waterGoal = Store.getWaterGoal();

    let totalMeals = 0;
    let breakfastCount = 0;
    let veggieMeals = 0;
    let uniqueFoodsSet = new Set();
    let proteinGoalDays = 0;
    let balancedDays = 0;
    let bestScore = 0;
    let waterGoalDays = 0;
    let totalExercises = 0;

    // Collect all dates with meals, sorted
    const dates = Object.keys(allMeals).sort();

    dates.forEach(date => {
      const meals = allMeals[date] || [];
      totalMeals += meals.length;

      meals.forEach(m => {
        if (m.type === '朝食') breakfastCount++;
        if (m.name) uniqueFoodsSet.add(m.name);

        // Check veggie categories
        const vegCategories = ['野菜', 'サラダ'];
        if (m.category && vegCategories.includes(m.category)) {
          veggieMeals++;
        } else if (m.name && (m.name.includes('サラダ') || m.name.includes('野菜') || m.name.includes('ほうれん草') || m.name.includes('ブロッコリー') || m.name.includes('トマト') || m.name.includes('キャベツ'))) {
          veggieMeals++;
        }
      });

      // Check daily totals for goals
      const total = Store.getDayTotal(date) || { cal: 0, protein: 0, fat: 0, carb: 0, fiber: 0 };
      if (total.cal > 0) {
        // Protein goal
        if (total.protein >= goals.protein) proteinGoalDays++;

        // PFC balance check (within 15% of goals)
        const pRatio = goals.protein > 0 ? total.protein / goals.protein : 0;
        const fRatio = goals.fat > 0 ? total.fat / goals.fat : 0;
        const cRatio = goals.carb > 0 ? total.carb / goals.carb : 0;
        if (pRatio >= 0.85 && pRatio <= 1.15 && fRatio >= 0.85 && fRatio <= 1.15 && cRatio >= 0.85 && cRatio <= 1.15) {
          balancedDays++;
        }

        // Health score calculation (same logic as dashboard)
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
        if (score > bestScore) bestScore = score;
      }

      // Water goal check
      const water = Store.getWaterIntake(date);
      if (water >= waterGoal) waterGoalDays++;
    });

    // Streak calculation: count consecutive days with meals from yesterday back,
    // then add 1 if today also has meals
    let streak = 0;
    const today = new Date();

    // Count consecutive days from yesterday backwards
    for (let i = 1; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayMeals = allMeals[dateStr];
      if (dayMeals && dayMeals.length > 0) {
        streak++;
      } else {
        break;
      }
    }

    // Check if today has meals, and if so add 1
    const todayStr = today.toISOString().split('T')[0];
    const todayMeals = allMeals[todayStr];
    if (todayMeals && todayMeals.length > 0) {
      streak++;
    }

    // Total exercises
    const exercisesKey = `bp_${uid}_exercises`;
    const allExercises = JSON.parse(localStorage.getItem(exercisesKey) || '{}');
    Object.keys(allExercises).forEach(date => {
      totalExercises += (allExercises[date] || []).length;
    });

    return {
      totalMeals,
      streak,
      bestScore,
      balancedDays,
      veggieMeals,
      proteinGoalDays,
      breakfastCount,
      weightEntries: weights.length,
      waterGoalDays,
      uniqueFoods: uniqueFoodsSet.size,
      totalExercises,
    };
  },

  // Get earned badges
  getEarnedBadges() {
    const stats = this.getStats();
    const earned = [];
    this.badges.forEach(badge => {
      if (badge.condition(stats)) {
        earned.push(badge.id);
      }
    });
    // Persist earned badges
    localStorage.setItem(this._key('badges'), JSON.stringify(earned));
    return earned;
  },

  // Get newly earned badges (not yet shown)
  getNewBadges() {
    const earned = this.getEarnedBadges();
    const shown = JSON.parse(localStorage.getItem(this._key('badges_shown')) || '[]');
    return earned.filter(id => !shown.includes(id));
  },

  // Mark badge as shown
  markBadgeShown(badgeId) {
    const shown = JSON.parse(localStorage.getItem(this._key('badges_shown')) || '[]');
    if (!shown.includes(badgeId)) {
      shown.push(badgeId);
      localStorage.setItem(this._key('badges_shown'), JSON.stringify(shown));
    }
  },

  // Get current weekly challenge (rotate by week number)
  getCurrentChallenge() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.floor(((now - start) / 86400000 + start.getDay()) / 7);
    const idx = weekNum % this.challenges.length;
    return this.challenges[idx];
  },

  // Get challenge progress
  getChallengeProgress() {
    const challenge = this.getCurrentChallenge();
    const uid = Auth.currentUser ? Auth.currentUser.uid : 'anon';

    // Get this week's dates (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      if (d <= now) {
        weekDates.push(d.toISOString().split('T')[0]);
      }
    }

    let progress = 0;
    const goals = Store.getGoals();
    const waterGoal = Store.getWaterGoal();
    const mealsKey = `bp_${uid}_meals`;
    const allMeals = JSON.parse(localStorage.getItem(mealsKey) || '{}');
    const exercisesKey = `bp_${uid}_exercises`;
    const allExercises = JSON.parse(localStorage.getItem(exercisesKey) || '{}');

    switch (challenge.id) {
      case 'veggie_week':
        weekDates.forEach(date => {
          const meals = allMeals[date] || [];
          const hasVeg = meals.some(m =>
            (m.category && (m.category === '野菜' || m.category === 'サラダ')) ||
            (m.name && (m.name.includes('サラダ') || m.name.includes('野菜') || m.name.includes('ほうれん草') || m.name.includes('ブロッコリー') || m.name.includes('トマト')))
          );
          if (hasVeg) progress++;
        });
        break;

      case 'water_challenge':
        weekDates.forEach(date => {
          if (Store.getWaterIntake(date) >= waterGoal) progress++;
        });
        break;

      case 'breakfast_week':
        weekDates.forEach(date => {
          const meals = allMeals[date] || [];
          if (meals.some(m => m.type === '朝食')) progress++;
        });
        break;

      case 'exercise_3':
        weekDates.forEach(date => {
          const exercises = allExercises[date] || [];
          if (exercises.length > 0) progress++;
        });
        break;

      case 'perfect_3':
        weekDates.forEach(date => {
          const total = Store.getDayTotal(date);
          if (total.cal > 0) {
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
            if (score >= 80) progress++;
          }
        });
        break;
    }

    return {
      challenge,
      progress: Math.min(progress, challenge.target),
      target: challenge.target,
      percent: Math.min(100, Math.round((progress / challenge.target) * 100)),
    };
  },

  // Get level based on total earned badges
  getLevel() {
    const earned = this.getEarnedBadges();
    const count = earned.length;
    const levels = [
      { min: 0, max: 2, level: 1, name: 'ビギナー' },
      { min: 3, max: 5, level: 2, name: 'レギュラー' },
      { min: 6, max: 8, level: 3, name: 'エキスパート' },
      { min: 9, max: 11, level: 4, name: 'マスター' },
      { min: 12, max: Infinity, level: 5, name: 'レジェンド' },
    ];
    for (const l of levels) {
      if (count >= l.min && count <= l.max) {
        return { level: l.level, name: l.name, badgeCount: count };
      }
    }
    return { level: 1, name: 'ビギナー', badgeCount: count };
  },
};
