// ============================
// 認証モジュール
// Firebase設定済み → Firebase Auth
// 未設定 → localStorage認証
// ============================

const Auth = {
  currentUser: null,

  init() {
    if (isFirebaseConfigured) {
      this._initFirebase();
    } else {
      this._initLocal();
    }
  },

  // --- Firebase認証 ---
  _initFirebase() {
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
    });
  },

  // --- ローカル認証 ---
  _initLocal() {
    const saved = localStorage.getItem('bp_user');
    if (saved) {
      this.currentUser = JSON.parse(saved);
      this._onLogin();
    }
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
      const user = {
        uid: 'local_' + Date.now(),
        email: email,
        name: username,
        password: password
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
      if (!user || user.password !== password) {
        throw new Error('メールアドレスまたはパスワードが正しくありません');
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
    if (window.location.pathname.includes('dashboard')) {
      window.location.href = 'login.html';
    }
  }
};
