// ============================
// 認証モジュール
// Firebase設定済み → Firebase Auth
// 未設定 → localStorage認証
// ============================

async function hashPassword(password, salt) {
  if (!salt) {
    salt = crypto.getRandomValues(new Uint8Array(16));
    salt = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: encoder.encode(salt),
    iterations: 100000,
    hash: 'SHA-256'
  }, keyMaterial, 256);
  const hash = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return { hash, salt };
}

// Legacy SHA-256 hash for migration
async function legacyHashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const Auth = {
  currentUser: null,

  init() {
    if (isFirebaseConfigured) {
      return this._initFirebase();
    } else {
      return this._initLocal();
    }
  },

  // --- Firebase認証 ---
  _initFirebase() {
    return new Promise((resolve) => {
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          this.currentUser = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            photo: user.photoURL
          };
          this._onLogin();
        } else {
          this.currentUser = null;
          this._onLogout();
        }
        resolve();
      });
    });
  },

  // --- ローカル認証 ---
  _initLocal() {
    const saved = localStorage.getItem('bp_user');
    if (saved) {
      this.currentUser = JSON.parse(saved);
      this._onLogin();
    }
    return Promise.resolve();
  },

  // メール登録
  async register(email, password, username) {
    if (isFirebaseConfigured) {
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: username });
      return cred.user;
    } else {
      const users = JSON.parse(localStorage.getItem('bp_users') || '{}');
      if (users[email]) {
        throw new Error('このメールアドレスは既に登録されています');
      }
      const { hash, salt } = await hashPassword(password);
      const user = {
        uid: 'local_' + Date.now(),
        email: email,
        name: username,
        password: hash,
        salt: salt
      };
      users[email] = user;
      localStorage.setItem('bp_users', JSON.stringify(users));
      this.currentUser = { uid: user.uid, email: user.email, name: user.name };
      localStorage.setItem('bp_user', JSON.stringify(this.currentUser));
      return this.currentUser;
    }
  },

  // メールログイン
  async login(email, password) {
    if (isFirebaseConfigured) {
      return await firebase.auth().signInWithEmailAndPassword(email, password);
    } else {
      const users = JSON.parse(localStorage.getItem('bp_users') || '{}');
      const user = users[email];
      if (!user) {
        throw new Error('メールアドレスまたはパスワードが正しくありません');
      }

      // Migration: if user has no salt, they used old SHA-256 hash
      if (!user.salt) {
        const legacyHash = await legacyHashPassword(password);
        if (user.password !== legacyHash) {
          throw new Error('メールアドレスまたはパスワードが正しくありません');
        }
        // Re-hash with PBKDF2 on successful login
        const { hash, salt } = await hashPassword(password);
        user.password = hash;
        user.salt = salt;
        localStorage.setItem('bp_users', JSON.stringify(users));
      } else {
        const { hash } = await hashPassword(password, user.salt);
        if (user.password !== hash) {
          throw new Error('メールアドレスまたはパスワードが正しくありません');
        }
      }

      this.currentUser = { uid: user.uid, email: user.email, name: user.name };
      localStorage.setItem('bp_user', JSON.stringify(this.currentUser));
      return this.currentUser;
    }
  },

  // Googleログイン
  async loginWithGoogle() {
    if (isFirebaseConfigured) {
      const provider = new firebase.auth.GoogleAuthProvider();
      return await firebase.auth().signInWithPopup(provider);
    } else {
      // ローカルモードではデモユーザーとしてログイン
      this.currentUser = {
        uid: 'google_demo_' + Date.now(),
        email: 'demo@gmail.com',
        name: 'Googleユーザー',
        photo: null
      };
      localStorage.setItem('bp_user', JSON.stringify(this.currentUser));
      return this.currentUser;
    }
  },

  // ログアウト
  async logout() {
    if (isFirebaseConfigured) {
      await firebase.auth().signOut();
    }
    this.currentUser = null;
    localStorage.removeItem('bp_user');
    window.location.href = window.location.pathname.includes('/pages/')
      ? 'login.html'
      : 'pages/login.html';
  },

  // ログイン状態チェック
  isLoggedIn() {
    return this.currentUser !== null;
  },

  // ログイン必須ページのガード
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = window.location.pathname.includes('/pages/')
        ? 'login.html'
        : 'pages/login.html';
      return false;
    }
    return true;
  },

  _onLogin() {
    // ダッシュボードページにいる場合のみ、ユーザー名を表示
    const nameEl = document.getElementById('user-name');
    if (nameEl && this.currentUser) {
      nameEl.textContent = this.currentUser.name;
    }
  },

  _onLogout() {
    // 保護ページにいる場合はリダイレクト
    const path = window.location.pathname;
    if (path.includes('dashboard') || path.includes('meal') || path.includes('planner') || path.includes('reports') || path.includes('settings') || path.includes('diary') || path.includes('graph')) {
      window.location.href = 'login.html';
    }
  }
};
