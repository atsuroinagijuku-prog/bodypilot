// ============================
// Internationalization (i18n)
// ============================

const I18n = {
  currentLang: 'ja',

  translations: {
    ja: {
      // Navigation
      'nav.home': 'ホーム',
      'nav.dashboard': 'ダッシュボード',
      'nav.reports': 'レポート',
      'nav.settings': '設定',
      'nav.logout': 'ログアウト',
      'nav.login': 'ログイン',
      'nav.register': '新規登録',

      // Dashboard
      'dashboard.intake': '摂取カロリー',
      'dashboard.goal': '目標',
      'dashboard.protein': 'タンパク質',
      'dashboard.fat': '脂質',
      'dashboard.carbs': '炭水化物',
      'dashboard.fiber': '食物繊維',
      'dashboard.healthScore': 'ヘルススコア',
      'dashboard.mealLog': '今日の食事記録',
      'dashboard.noMeals': 'まだ食事が記録されていません',
      'dashboard.photo': '写真で記録',
      'dashboard.search': '検索で記録',
      'dashboard.barcode': 'バーコード',
      'dashboard.weight': '体重記録',
      'dashboard.exercise': '運動記録',
      'dashboard.water': '水分摂取',
      'dashboard.sleep': '睡眠記録',
      'dashboard.advice': '今日のアドバイス',
      'dashboard.netCalories': 'ネットカロリー',
      'dashboard.recordMeal': '食事を記録する',
      'dashboard.nutritionBalance': '今日の栄養バランス',
      'dashboard.recordWeight': '体重を記録',
      'dashboard.photoGallery': '食事フォトギャラリー',
      'dashboard.todaysMeals': '今日の食事',
      'dashboard.searchFood': '食品を検索',
      'dashboard.shareRecord': '今日の記録をシェア',

      // Meal types
      'meal.breakfast': '朝食',
      'meal.lunch': '昼食',
      'meal.snack': '間食',
      'meal.dinner': '夕食',

      // Common
      'common.save': '保存',
      'common.cancel': 'キャンセル',
      'common.delete': '削除',
      'common.edit': '編集',
      'common.add': '追加',
      'common.close': '閉じる',
      'common.today': '今日',
      'common.back': '戻る',
      'common.loading': '読み込み中...',
      'common.comingSoon': '近日公開予定です',

      // Settings
      'settings.profile': 'プロフィール',
      'settings.goals': '目標設定',
      'settings.notifications': '通知設定',
      'settings.theme': 'テーマ',
      'settings.language': '言語',
      'settings.export': 'データエクスポート',
      'settings.deleteAccount': 'アカウント削除',

      // Auth
      'auth.email': 'メールアドレス',
      'auth.password': 'パスワード',
      'auth.username': 'ユーザー名',
      'auth.login': 'ログイン',
      'auth.register': '新規登録',
      'auth.forgotPassword': 'パスワードを忘れた方',
      'auth.rememberMe': 'ログイン状態を保持',
    },
    en: {
      'nav.home': 'Home',
      'nav.dashboard': 'Dashboard',
      'nav.reports': 'Reports',
      'nav.settings': 'Settings',
      'nav.logout': 'Logout',
      'nav.login': 'Login',
      'nav.register': 'Sign Up',

      'dashboard.intake': 'Calorie Intake',
      'dashboard.goal': 'Goal',
      'dashboard.protein': 'Protein',
      'dashboard.fat': 'Fat',
      'dashboard.carbs': 'Carbs',
      'dashboard.fiber': 'Fiber',
      'dashboard.healthScore': 'Health Score',
      'dashboard.mealLog': "Today's Meal Log",
      'dashboard.noMeals': 'No meals recorded yet',
      'dashboard.photo': 'Photo Record',
      'dashboard.search': 'Search Food',
      'dashboard.barcode': 'Barcode',
      'dashboard.weight': 'Weight Log',
      'dashboard.exercise': 'Exercise Log',
      'dashboard.water': 'Water Intake',
      'dashboard.sleep': 'Sleep Log',
      'dashboard.advice': "Today's Advice",
      'dashboard.netCalories': 'Net Calories',
      'dashboard.recordMeal': 'Record Meal',
      'dashboard.nutritionBalance': "Today's Nutrition Balance",
      'dashboard.recordWeight': 'Record Weight',
      'dashboard.photoGallery': 'Meal Photo Gallery',
      'dashboard.todaysMeals': "Today's Meals",
      'dashboard.searchFood': 'Search Food',
      'dashboard.shareRecord': "Share Today's Record",

      'meal.breakfast': 'Breakfast',
      'meal.lunch': 'Lunch',
      'meal.snack': 'Snack',
      'meal.dinner': 'Dinner',

      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.add': 'Add',
      'common.close': 'Close',
      'common.today': 'Today',
      'common.back': 'Back',
      'common.loading': 'Loading...',
      'common.comingSoon': 'Coming Soon',

      'settings.profile': 'Profile',
      'settings.goals': 'Goal Settings',
      'settings.notifications': 'Notifications',
      'settings.theme': 'Theme',
      'settings.language': 'Language',
      'settings.export': 'Export Data',
      'settings.deleteAccount': 'Delete Account',

      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.username': 'Username',
      'auth.login': 'Login',
      'auth.register': 'Sign Up',
      'auth.forgotPassword': 'Forgot Password?',
      'auth.rememberMe': 'Remember Me',
    }
  },

  init() {
    this.currentLang = localStorage.getItem('bp_language') || 'ja';
    this.applyTranslations();
  },

  setLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem('bp_language', lang);
    this.applyTranslations();
  },

  t(key) {
    return this.translations[this.currentLang]?.[key] || this.translations['ja'][key] || key;
  },

  applyTranslations() {
    // Find all elements with data-i18n attribute and update their text
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    // Also update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
  }
};

// Initialize i18n when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => I18n.init());
} else {
  I18n.init();
}
