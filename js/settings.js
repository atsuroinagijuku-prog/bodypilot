// ============================
// 設定ページ
// ============================

document.addEventListener('DOMContentLoaded', async () => {
  await Auth.init();
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  initSettings();
});

// プリセット定義
const PRESETS = {
  loss: { cal: 1500, protein: 100, fat: 45, carb: 150, fiber: 25 },
  muscle: { cal: 2500, protein: 150, fat: 70, carb: 280, fiber: 25 },
  maintain: { cal: 2000, protein: 80, fat: 65, carb: 250, fiber: 20 }
};

function initSettings() {
  loadProfile();
  loadGoals();
  initProfileForm();
  initGoalsForm();
  loadVisionApiStatus();
  loadNotificationStatus();
  loadLanguageSetting();
}

// --- プロフィール読み込み ---
function loadProfile() {
  if (Auth.currentUser) {
    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const heightInput = document.getElementById('profile-height');
    if (nameInput) nameInput.value = Auth.currentUser.name || '';
    if (emailInput) emailInput.value = Auth.currentUser.email || '';
    if (heightInput) {
      const uid = Auth.currentUser.uid || 'anon';
      const savedHeight = localStorage.getItem(`bp_${uid}_height`);
      if (savedHeight) heightInput.value = savedHeight;
    }
  }
}

// --- 目標読み込み ---
function loadGoals() {
  const goals = Store.getGoals();
  document.getElementById('goal-cal').value = goals.cal;
  document.getElementById('goal-protein').value = goals.protein;
  document.getElementById('goal-fat').value = goals.fat;
  document.getElementById('goal-carb').value = goals.carb;
  document.getElementById('goal-fiber').value = goals.fiber;
}

// --- プロフィールフォーム ---
function initProfileForm() {
  const form = document.getElementById('profile-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = document.getElementById('profile-name').value.trim();
    if (!newName) return;

    // ローカルユーザー情報を更新
    if (Auth.currentUser) {
      Auth.currentUser.name = newName;
      localStorage.setItem('bp_user', JSON.stringify(Auth.currentUser));

      // bp_usersも更新
      const users = JSON.parse(localStorage.getItem('bp_users') || '{}');
      if (users[Auth.currentUser.email]) {
        users[Auth.currentUser.email].name = newName;
        localStorage.setItem('bp_users', JSON.stringify(users));
      }

      // 身長を保存
      const heightInput = document.getElementById('profile-height');
      if (heightInput && heightInput.value) {
        const uid = Auth.currentUser.uid || 'anon';
        localStorage.setItem(`bp_${uid}_height`, heightInput.value);
      }
    }

    showStatus('profile-status');
  });
}

// --- 目標フォーム ---
function initGoalsForm() {
  const form = document.getElementById('goals-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveGoals();
    showStatus('goals-status');
  });
}

function saveGoals() {
  const goals = Store.getGoals();
  goals.cal = parseInt(document.getElementById('goal-cal').value) || 2000;
  goals.protein = parseInt(document.getElementById('goal-protein').value) || 80;
  goals.fat = parseInt(document.getElementById('goal-fat').value) || 65;
  goals.carb = parseInt(document.getElementById('goal-carb').value) || 250;
  goals.fiber = parseInt(document.getElementById('goal-fiber').value) || 20;
  Store.setGoals(goals);
}

// --- プリセット適用 ---
function applyPreset(type) {
  const preset = PRESETS[type];
  if (!preset) return;

  document.getElementById('goal-cal').value = preset.cal;
  document.getElementById('goal-protein').value = preset.protein;
  document.getElementById('goal-fat').value = preset.fat;
  document.getElementById('goal-carb').value = preset.carb;
  document.getElementById('goal-fiber').value = preset.fiber;

  // プリセットボタンのハイライト
  document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
  if (event && event.target) {
    event.target.classList.add('active');
  }

  saveGoals();
  showStatus('goals-status');
}

// --- データエクスポート ---
function exportData() {
  const uid = Auth.currentUser ? Auth.currentUser.uid : 'anon';
  const prefix = `bp_${uid}_`;

  const exportObj = {
    exportDate: new Date().toISOString(),
    user: Auth.currentUser ? { name: Auth.currentUser.name, email: Auth.currentUser.email } : null,
    meals: JSON.parse(localStorage.getItem(prefix + 'meals') || '{}'),
    weights: JSON.parse(localStorage.getItem(prefix + 'weights') || '[]'),
    goals: Store.getGoals()
  };

  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bodypilot_data_' + new Date().toISOString().split('T')[0] + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- アカウント削除 ---
function deleteAccount() {
  const confirmed = confirm('本当にアカウントを削除しますか？\nすべてのデータが完全に削除されます。');
  if (!confirmed) return;

  const doubleConfirm = confirm('この操作は取り消せません。本当に削除しますか？');
  if (!doubleConfirm) return;

  const uid = Auth.currentUser ? Auth.currentUser.uid : 'anon';
  const prefix = `bp_${uid}_`;

  // ユーザーデータをすべて削除
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  // ユーザー登録情報を削除
  if (Auth.currentUser && Auth.currentUser.email) {
    const users = JSON.parse(localStorage.getItem('bp_users') || '{}');
    delete users[Auth.currentUser.email];
    localStorage.setItem('bp_users', JSON.stringify(users));
  }

  // ログアウト
  localStorage.removeItem('bp_user');
  Auth.currentUser = null;
  window.location.href = 'login.html';
}

// --- ステータス表示 ---
function showStatus(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}

// --- トースト ---
function showToast(message, type) {
  if (type === undefined) type = 'success';
  document.querySelectorAll('.app-toast').forEach(function(t) { t.remove(); });
  var toast = document.createElement('div');
  toast.className = 'app-toast app-toast-' + type;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  var icon = type === 'success' ? '\u2713' : type === 'error' ? '\u2717' : '\u2139';
  toast.innerHTML = '<span class="toast-icon">' + icon + '</span> ' + message;
  document.body.appendChild(toast);
  setTimeout(function() { toast.classList.add('toast-fade-out'); setTimeout(function() { toast.remove(); }, 300); }, 3500);
}

// ログアウト
function handleLogout() {
  Auth.logout();
}

// --- Vision API設定 ---
function loadVisionApiStatus() {
  var statusEl = document.getElementById('vision-api-status');
  var keyInput = document.getElementById('vision-api-key');
  if (!statusEl) return;

  var apiKey = localStorage.getItem('bp_vision_api_key');
  if (apiKey) {
    statusEl.innerHTML = '<span style="color:var(--green);">API設定済み</span>';
    if (keyInput) keyInput.value = apiKey.substring(0, 8) + '...';
  } else {
    statusEl.innerHTML = '<span style="color:var(--text-sub);">API未設定（ローカル分析モード）</span>';
  }
}

function saveVisionApiKey() {
  var keyInput = document.getElementById('vision-api-key');
  if (!keyInput) return;

  var key = keyInput.value.trim();
  if (!key || key.includes('...')) {
    showToast('APIキーを入力してください');
    return;
  }

  localStorage.setItem('bp_vision_api_key', key);
  loadVisionApiStatus();
  showStatus('api-key-status');
}

function clearVisionApiKey() {
  localStorage.removeItem('bp_vision_api_key');
  var keyInput = document.getElementById('vision-api-key');
  if (keyInput) keyInput.value = '';
  loadVisionApiStatus();
  showToast('APIキーをクリアしました');
}

// --- 通知設定 ---
function loadNotificationStatus() {
  const toggle = document.getElementById('notification-toggle');
  const statusEl = document.getElementById('notification-status');
  if (!toggle) return;

  const enabled = localStorage.getItem('bp_notifications_enabled') === 'true';
  toggle.checked = enabled;

  if (statusEl) {
    if (!('Notification' in window)) {
      statusEl.innerHTML = '<span style="color:var(--text-sub);">このブラウザは通知に対応していません</span>';
      toggle.disabled = true;
    } else if (Notification.permission === 'denied') {
      statusEl.innerHTML = '<span style="color:#e55;">通知がブロックされています。ブラウザの設定から許可してください。</span>';
    } else if (enabled) {
      statusEl.innerHTML = '<span style="color:var(--green);">通知ON</span>';
    } else {
      statusEl.innerHTML = '<span style="color:var(--text-sub);">通知OFF</span>';
    }
  }
}

async function toggleNotifications() {
  const toggle = document.getElementById('notification-toggle');
  if (!toggle) return;

  if (toggle.checked) {
    // Request permission and enable
    if (typeof Notifications !== 'undefined') {
      const granted = await Notifications.requestPermission();
      if (!granted) {
        toggle.checked = false;
        showToast('通知の許可が得られませんでした');
      } else {
        showToast('通知を有効にしました');
      }
    }
  } else {
    // Disable notifications
    localStorage.setItem('bp_notifications_enabled', 'false');
    if (typeof Notifications !== 'undefined') {
      Notifications.stop();
    }
    showToast('通知を無効にしました');
  }
  loadNotificationStatus();
}

// --- 言語設定 ---
function changeLanguage(lang) {
  if (typeof I18n !== 'undefined') {
    I18n.setLanguage(lang);
    showToast(lang === 'ja' ? '言語を日本語に変更しました' : 'Language changed to English');
  }
}

function loadLanguageSetting() {
  const select = document.getElementById('language-select');
  if (!select) return;
  const savedLang = localStorage.getItem('bp_language') || 'ja';
  select.value = savedLang;
}

// グローバル公開
window.applyPreset = applyPreset;
window.exportData = exportData;
window.deleteAccount = deleteAccount;
window.handleLogout = handleLogout;
window.saveVisionApiKey = saveVisionApiKey;
window.clearVisionApiKey = clearVisionApiKey;
window.toggleNotifications = toggleNotifications;
window.changeLanguage = changeLanguage;
