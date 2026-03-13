// ============================
// プッシュ通知リマインダー
// ============================

const Notifications = {
  async init() {
    if (!('Notification' in window)) return false;
    // Check if user has enabled notifications in settings
    const enabled = localStorage.getItem('bp_notifications_enabled');
    if (enabled !== 'true') return false;
    if (Notification.permission === 'granted') {
      this.scheduleReminders();
      return true;
    }
    return false;
  },

  async requestPermission() {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('bp_notifications_enabled', 'true');
      this.scheduleReminders();
      return true;
    }
    return false;
  },

  scheduleReminders() {
    // Clear any existing interval
    if (this.reminderInterval) clearInterval(this.reminderInterval);
    // Check every 30 minutes if user hasn't logged a meal
    this.reminderInterval = setInterval(() => {
      this.checkAndNotify();
    }, 30 * 60 * 1000);
    // Also check immediately
    this.checkAndNotify();
  },

  checkAndNotify() {
    const enabled = localStorage.getItem('bp_notifications_enabled');
    if (enabled !== 'true') return;

    const hour = new Date().getHours();
    const today = new Date().toISOString().split('T')[0];
    const meals = Store.getMeals(today);
    const mealTypes = meals.map(m => m.type);

    // Breakfast reminder (8-10 AM)
    if (hour >= 8 && hour <= 10 && !mealTypes.includes('\u671d\u98df')) {
      this.send('\u671d\u98df\u306e\u8a18\u9332', '\u304a\u306f\u3088\u3046\u3054\u3056\u3044\u307e\u3059\uff01\u671d\u98df\u3092\u8a18\u9332\u3057\u307e\u3057\u3087\u3046');
    }
    // Lunch reminder (12-14)
    if (hour >= 12 && hour <= 14 && !mealTypes.includes('\u663c\u98df')) {
      this.send('\u663c\u98df\u306e\u8a18\u9332', '\u304a\u663c\u306e\u8a18\u9332\u3092\u5fd8\u308c\u305a\u306b\uff01');
    }
    // Dinner reminder (18-20)
    if (hour >= 18 && hour <= 20 && !mealTypes.includes('\u5915\u98df')) {
      this.send('\u5915\u98df\u306e\u8a18\u9332', '\u4eca\u65e5\u306e\u5915\u98df\u306f\u4f55\u3067\u3059\u304b\uff1f\u8a18\u9332\u3057\u307e\u3057\u3087\u3046');
    }
    // Water reminder (every 2 hours during day)
    if (hour >= 9 && hour <= 21) {
      const waterIntake = Store.getWaterIntake(today);
      const waterGoal = Store.getWaterGoal();
      if (waterIntake < waterGoal * (hour - 8) / 14) {
        this.send('\u6c34\u5206\u88dc\u7d66', '\u304a\u6c34\u3092\u98f2\u307f\u307e\u3057\u3087\u3046\uff01');
      }
    }
  },

  send(title, body) {
    // Don't send too frequently - check last notification time
    const lastNotif = localStorage.getItem('bp_last_notification');
    const now = Date.now();
    if (lastNotif && now - parseInt(lastNotif) < 60 * 60 * 1000) return; // 1 hour cooldown

    new Notification(title, {
      body: body,
      icon: '/images/icon-192.svg',
      badge: '/images/icon-192.svg',
      tag: 'bodypilot-reminder'
    });
    localStorage.setItem('bp_last_notification', now.toString());
  },

  stop() {
    if (this.reminderInterval) clearInterval(this.reminderInterval);
    localStorage.setItem('bp_notifications_enabled', 'false');
  }
};
