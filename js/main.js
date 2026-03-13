// ===== Theme Management =====
function initTheme() {
  var saved = localStorage.getItem('bp_theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
  // If no saved preference, system preference is handled by CSS @media query
}

function toggleTheme() {
  var current = document.documentElement.getAttribute('data-theme');
  var newTheme;
  if (current === 'dark') {
    newTheme = 'light';
  } else if (current === 'light') {
    newTheme = 'dark';
  } else {
    // No explicit theme set, check system preference
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    newTheme = prefersDark ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('bp_theme', newTheme);
  return newTheme;
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('bp_theme', theme);
}

// Initialize theme on load
initTheme();

// ===== Unified Toast System =====
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
  setTimeout(function() {
    toast.classList.add('toast-fade-out');
    setTimeout(function() { toast.remove(); }, 300);
  }, 3500);
}

// ===== ハンバーガーメニュー =====
const hamburger = document.getElementById('hamburger');
const nav = document.querySelector('.nav');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    hamburger.setAttribute('aria-label', isOpen ? 'メニューを閉じる' : 'メニューを開く');
  });
}

// ===== FAQ アコーディオン =====
document.querySelectorAll('.faq-question').forEach(question => {
  function toggleFaq() {
    const item = question.parentElement;
    const isOpen = item.classList.contains('open');

    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      var q = i.querySelector('.faq-question');
      if (q) q.setAttribute('aria-expanded', 'false');
    });

    // Open clicked item if it was closed
    if (!isOpen) {
      item.classList.add('open');
      question.setAttribute('aria-expanded', 'true');
    }
  }

  question.addEventListener('click', toggleFaq);

  // Keyboard support for FAQ items
  question.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleFaq();
    }
  });
});

// ===== スクロールアニメーション (Intersection Observer) =====
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

// ===== ヘッダースクロール影 =====
window.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  if (!header) return;
  if (window.pageYOffset > 80) {
    header.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
  } else {
    header.style.boxShadow = 'none';
  }
});

// ===== Tips タグ切り替え =====
document.querySelectorAll('.tip-tag').forEach(tag => {
  function activateTag() {
    document.querySelectorAll('.tip-tag').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tag.classList.add('active');
    tag.setAttribute('aria-selected', 'true');
  }

  tag.addEventListener('click', activateTag);

  // Keyboard support for tip tags
  tag.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activateTag();
    }
  });
});

// ===== Keyboard Navigation: Escape key closes modals =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Close mobile nav if open
    if (nav && nav.classList.contains('open')) {
      nav.classList.remove('open');
      if (hamburger) {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-label', 'メニューを開く');
        hamburger.focus();
      }
    }

    // Close any open modal
    var modal = document.querySelector('.modal-overlay.show');
    if (modal) {
      modal.classList.remove('show');
      // Try to call closeModal if it exists
      if (typeof closeModal === 'function') {
        closeModal();
      }
    }

    // Close score breakdown tooltip if visible
    var scoreBreakdown = document.getElementById('score-breakdown');
    if (scoreBreakdown && scoreBreakdown.style.display !== 'none') {
      scoreBreakdown.style.display = 'none';
    }
  }
});

// ===== Keyboard support for interactive elements with role="button" =====
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute('role') === 'button') {
    e.preventDefault();
    e.target.click();
  }
});

// ===== Upload area keyboard support =====
var uploadArea = document.getElementById('upload-area');
if (uploadArea) {
  uploadArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      uploadArea.click();
    }
  });
}

