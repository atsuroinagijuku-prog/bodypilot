// ハンバーガーメニュー
const hamburger = document.getElementById('hamburger');
const nav = document.querySelector('.nav');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
}

// FAQ アコーディオン
document.querySelectorAll('.faq-question').forEach(question => {
  question.addEventListener('click', () => {
    const item = question.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) {
      item.classList.add('open');
    }
  });
});

// スクロールアニメーション (Intersection Observer)
const observerOptions = {
  root: null,
  rootMargin: '0px 0px -60px 0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
  observer.observe(el);
});

// ヘッダースクロール影
window.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  if (!header) return;
  if (window.pageYOffset > 80) {
    header.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
  } else {
    header.style.boxShadow = 'none';
  }
});

// Tips タグ切り替え
document.querySelectorAll('.tip-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    document.querySelectorAll('.tip-tag').forEach(t => t.classList.remove('active'));
    tag.classList.add('active');
  });
});
