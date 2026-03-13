// ============================
// Firebase設定
// ============================
// 1. https://console.firebase.google.com/ でプロジェクトを作成
// 2. Authentication > Sign-in method > メール/パスワード と Google を有効化
// 3. 以下の値をあなたのFirebaseプロジェクトの値に置き換えてください

const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase未設定の場合はローカルモードで動作します
const isFirebaseConfigured = FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";
