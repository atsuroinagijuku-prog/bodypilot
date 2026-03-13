// ============================
// AI栄養アドバイザー (ルールベース)
// ============================

const Advisor = {
  // 今日の栄養を分析してアドバイス配列を返す
  analyze(dayTotal, goals, date) {
    const advice = [];
    const viewDate = date || (typeof currentViewDate !== 'undefined' ? currentViewDate : new Date().toISOString().split('T')[0]);
    const meals = Store.getMeals(viewDate);

    // 食事未記録
    if (meals.length === 0) {
      advice.push({
        icon: '📝',
        type: 'info',
        text: '今日はまだ食事が記録されていません。朝食から始めましょう！'
      });
      return advice;
    }

    // カロリーアドバイス
    const calRatio = goals.cal > 0 ? dayTotal.cal / goals.cal : 0;
    if (calRatio < 0.5) {
      advice.push({
        icon: '🍽️',
        type: 'info',
        text: 'まだたくさん食べられます！バランスよく食事を楽しみましょう。'
      });
    } else if (calRatio >= 0.8 && calRatio <= 1.0) {
      advice.push({
        icon: '👍',
        type: 'success',
        text: 'いい感じです！目標に近づいています。'
      });
    } else if (calRatio > 1.0) {
      advice.push({
        icon: '⚠️',
        type: 'warning',
        text: '今日は少しカロリーオーバーです。明日は軽めにしましょう。'
      });
    }

    // タンパク質アドバイス
    const proteinRatio = goals.protein > 0 ? dayTotal.protein / goals.protein : 0;
    if (proteinRatio < 0.7) {
      advice.push({
        icon: '💪',
        type: 'warning',
        text: 'タンパク質が不足気味です。鶏むね肉や卵、豆腐がおすすめです。'
      });
    }

    // 脂質アドバイス
    const fatRatio = goals.fat > 0 ? dayTotal.fat / goals.fat : 0;
    if (fatRatio > 1.2) {
      advice.push({
        icon: '🥗',
        type: 'warning',
        text: '脂質が多めです。次の食事は和食や蒸し料理がおすすめ。'
      });
    }

    // 食物繊維アドバイス
    const fiberRatio = goals.fiber > 0 ? dayTotal.fiber / goals.fiber : 0;
    if (fiberRatio < 0.5) {
      advice.push({
        icon: '🥬',
        type: 'info',
        text: '食物繊維をもっと摂りましょう。野菜やきのこ、海藻類がおすすめ。'
      });
    }

    // PFCバランスアドバイス
    const pfcAdvice = this._getPFCBalanceAdvice(dayTotal, goals);
    if (pfcAdvice) {
      advice.push(pfcAdvice);
    }

    // 食事タイミングアドバイス
    const timingAdvice = this.getMealTimingAdvice(meals);
    if (timingAdvice) {
      advice.push(timingAdvice);
    }

    return advice;
  },

  // 時間帯に応じた挨拶
  getGreeting() {
    const h = new Date().getHours();
    if (h < 6) return 'おやすみ前のチェック';
    if (h < 10) return 'おはようございます';
    if (h < 14) return 'お昼の栄養チェック';
    if (h < 18) return 'お疲れさまです';
    return 'こんばんは';
  },

  // スコアに応じたコメント
  getScoreComment(score) {
    if (score >= 90) return '素晴らしい！完璧に近い栄養バランスです。';
    if (score >= 70) return '良い調子です！あと少しで理想的なバランスに。';
    if (score >= 50) return 'まずまずです。バランスを意識してみましょう。';
    if (score >= 30) return '改善の余地があります。不足している栄養素を補いましょう。';
    if (score > 0) return '栄養バランスが偏っています。食事内容を見直してみましょう。';
    return '食事を記録してスコアを確認しましょう！';
  },

  // 個別栄養素アドバイス
  getNutrientAdvice(nutrient, actual, goal) {
    if (goal === 0) return null;
    const ratio = actual / goal;
    const labels = {
      cal: 'カロリー',
      protein: 'タンパク質',
      fat: '脂質',
      carb: '炭水化物',
      fiber: '食物繊維'
    };
    const label = labels[nutrient] || nutrient;

    if (ratio < 0.5) return `${label}が目標の${Math.round(ratio * 100)}%です。もう少し摂取しましょう。`;
    if (ratio > 1.2) return `${label}が目標を${Math.round((ratio - 1) * 100)}%超えています。`;
    if (ratio >= 0.9 && ratio <= 1.1) return `${label}は目標通りです！`;
    return null;
  },

  // 不足栄養素を補う食品を提案
  suggestFoods(dayTotal, goals) {
    const suggestions = [];
    const remaining = {
      cal: goals.cal - dayTotal.cal,
      protein: goals.protein - dayTotal.protein,
      fat: goals.fat - dayTotal.fat,
      carb: goals.carb - dayTotal.carb,
      fiber: goals.fiber - dayTotal.fiber
    };

    // タンパク質不足時
    if (remaining.protein > goals.protein * 0.3) {
      const highProtein = FoodDB.foods
        .filter(f => f.protein >= 10)
        .sort((a, b) => (b.protein / b.cal) - (a.protein / a.cal))
        .slice(0, 3);
      highProtein.forEach(f => {
        suggestions.push({
          food: f,
          reason: 'タンパク質補給に',
          nutrient: 'protein'
        });
      });
    }

    // 食物繊維不足時
    if (remaining.fiber > goals.fiber * 0.5) {
      const highFiber = FoodDB.foods
        .filter(f => f.fiber >= 2.0)
        .sort((a, b) => (b.fiber / b.cal) - (a.fiber / a.cal))
        .slice(0, 2);
      highFiber.forEach(f => {
        if (!suggestions.find(s => s.food.id === f.id)) {
          suggestions.push({
            food: f,
            reason: '食物繊維補給に',
            nutrient: 'fiber'
          });
        }
      });
    }

    // カロリーに余裕がある場合、バランスの良い食品を提案
    if (remaining.cal > goals.cal * 0.3 && suggestions.length === 0) {
      const balanced = FoodDB.foods
        .filter(f => f.protein >= 5 && f.fiber >= 1.0 && f.cal <= 200)
        .sort((a, b) => (b.protein + b.fiber * 2) - (a.protein + a.fiber * 2))
        .slice(0, 3);
      balanced.forEach(f => {
        suggestions.push({
          food: f,
          reason: 'バランスの良い食事に',
          nutrient: 'balanced'
        });
      });
    }

    // 脂質が少なすぎる場合
    if (remaining.fat > goals.fat * 0.5 && suggestions.length < 5) {
      const goodFat = FoodDB.foods
        .filter(f => f.fat >= 5 && f.fat <= 15 && f.protein >= 5)
        .slice(0, 2);
      goodFat.forEach(f => {
        if (!suggestions.find(s => s.food.id === f.id)) {
          suggestions.push({
            food: f,
            reason: '良質な脂質を含む',
            nutrient: 'fat'
          });
        }
      });
    }

    return suggestions.slice(0, 5);
  },

  // 食事タイミングアドバイス
  getMealTimingAdvice(meals) {
    if (!meals || meals.length === 0) return null;

    const now = new Date();
    const lastMeal = meals[meals.length - 1];

    // 最後の食事の時刻をパース
    if (lastMeal && lastMeal.time) {
      const timeParts = lastMeal.time.split(':');
      if (timeParts.length >= 2) {
        const lastMealDate = new Date();
        lastMealDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0);

        const hoursSinceLastMeal = (now - lastMealDate) / (1000 * 60 * 60);

        if (hoursSinceLastMeal > 3 && hoursSinceLastMeal < 8 && now.getHours() < 22) {
          return {
            icon: '⏰',
            type: 'info',
            text: `前回の食事から${Math.round(hoursSinceLastMeal)}時間経ちました。軽い間食はいかがですか？`
          };
        }
      }
    }

    // 朝食チェック
    const hasBreakfast = meals.some(m => m.type === '朝食');
    if (!hasBreakfast && now.getHours() >= 10 && now.getHours() < 14) {
      return {
        icon: '🌅',
        type: 'info',
        text: '今日は朝食を食べていないようです。昼食でしっかり栄養を摂りましょう。'
      };
    }

    return null;
  },

  // 日替わりTips
  getDailyTip() {
    const tips = [
      '水を1日2L飲むことを心がけましょう',
      'よく噛んで食べると満腹感が得られやすくなります',
      '食事は20分以上かけて食べるのが理想的です',
      '野菜を先に食べると血糖値の急上昇を防げます',
      '就寝3時間前までに夕食を済ませるのがおすすめです',
      '同じ食品でも調理法で栄養価が変わります。蒸す・煮るはヘルシーです',
      '1日3食を規則正しく食べることで代謝が安定します',
      'タンパク質は毎食均等に摂ると効率よく吸収されます',
      '色とりどりの食材を選ぶと自然と栄養バランスが整います',
      '間食にはナッツやヨーグルトなど栄養価の高いものを選びましょう',
      '食物繊維は腸内環境を整え、免疫力アップにもつながります',
      '朝食を食べると体温が上がり、1日の代謝がアップします',
      '週に2〜3回は魚を食べてDHAやEPAを摂取しましょう',
      '発酵食品（味噌、納豆、ヨーグルト）は腸活に効果的です',
      '減塩を意識するだけでむくみが改善されることがあります'
    ];

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return tips[dayOfYear % tips.length];
  },

  // --- 内部ヘルパー ---

  // PFCバランスアドバイス
  _getPFCBalanceAdvice(dayTotal, goals) {
    if (dayTotal.cal === 0) return null;

    const totalCal = dayTotal.cal;
    const pCal = dayTotal.protein * 4;
    const fCal = dayTotal.fat * 9;
    const cCal = dayTotal.carb * 4;
    const total = pCal + fCal + cCal;
    if (total === 0) return null;

    const pRatio = pCal / total;
    const fRatio = fCal / total;
    const cRatio = cCal / total;

    // 理想: P 13-20%, F 20-30%, C 50-65%
    if (fRatio > 0.35) {
      return {
        icon: '⚖️',
        type: 'warning',
        text: `PFCバランス: 脂質の割合が${Math.round(fRatio * 100)}%と高めです。炭水化物やタンパク質を増やしましょう。`
      };
    }
    if (pRatio < 0.10) {
      return {
        icon: '⚖️',
        type: 'warning',
        text: `PFCバランス: タンパク質の割合が${Math.round(pRatio * 100)}%と低めです。肉・魚・卵・大豆製品を加えましょう。`
      };
    }
    if (cRatio > 0.70) {
      return {
        icon: '⚖️',
        type: 'info',
        text: `PFCバランス: 炭水化物の割合が${Math.round(cRatio * 100)}%と高めです。おかずを増やしてバランスを整えましょう。`
      };
    }

    if (pRatio >= 0.13 && pRatio <= 0.20 && fRatio >= 0.20 && fRatio <= 0.30) {
      return {
        icon: '✨',
        type: 'success',
        text: 'PFCバランスが理想的です！この調子を続けましょう。'
      };
    }

    return null;
  }
};
