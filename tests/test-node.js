#!/usr/bin/env node
// BodyPilot Node.js Test Suite
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
let total = 0, passed = 0, failed = 0;
const failures = [];

function describe(name, fn) {
  console.log(`\n\x1b[36m${name}\x1b[0m`);
  fn();
}

function it(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (e) {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m ${name} — ${e.message}`);
    failures.push(`${name}: ${e.message}`);
  }
}

function expect(actual) {
  return {
    toBe(expected) { if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); },
    toBeGreaterThan(n) { if (actual <= n) throw new Error(`Expected ${actual} > ${n}`); },
    toBeTruthy() { if (!actual) throw new Error(`Expected truthy, got ${actual}`); },
    toContain(item) {
      if (typeof actual === 'string') { if (!actual.includes(item)) throw new Error(`String doesn't contain "${item}"`); }
      else if (Array.isArray(actual)) { if (!actual.includes(item)) throw new Error(`Array doesn't contain "${item}"`); }
    },
    not: {
      toContain(item) {
        if (typeof actual === 'string' && actual.includes(item)) throw new Error(`String should not contain "${item}"`);
        if (Array.isArray(actual) && actual.includes(item)) throw new Error(`Array should not contain "${item}"`);
      }
    }
  };
}

function readFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

// ========== FILE STRUCTURE ==========
describe('File Structure', () => {
  const requiredFiles = [
    'index.html', 'manifest.json', 'sw.js', 'offline.html',
    'pages/login.html', 'pages/register.html', 'pages/meal.html',
    'pages/diary.html', 'pages/graph.html', 'pages/goals.html',
    'pages/calculator.html', 'pages/terms.html', 'pages/privacy.html',
    'js/auth.js', 'js/store.js', 'js/food-db.js', 'js/main.js',
    'js/meal.js', 'js/diary.js', 'js/graph.js', 'js/goals.js',
    'js/calculator.js', 'js/exercise-db.js', 'js/advisor.js',
    'js/gamification.js', 'js/barcode-db.js', 'js/i18n.js',
    'js/notifications.js', 'js/config.js',
    'css/style.css', 'css/app.css', 'css/dashboard.css', 'css/diary.css',
    'images/icon-192.svg', 'images/icon-512.svg'
  ];
  requiredFiles.forEach(f => {
    it(`${f} exists`, () => expect(fileExists(f)).toBeTruthy());
  });
});

// ========== JS SYNTAX ==========
describe('JavaScript Syntax Validation', () => {
  const jsFiles = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'));
  jsFiles.forEach(f => {
    it(`js/${f} has valid syntax`, () => {
      const code = readFile(`js/${f}`);
      try {
        new Function(code);
      } catch (e) {
        throw new Error(`Syntax error: ${e.message}`);
      }
    });
  });
});

// ========== HTML STRUCTURE ==========
describe('HTML Structure', () => {
  const htmlPages = ['index.html', 'pages/login.html', 'pages/register.html',
    'pages/meal.html', 'pages/diary.html', 'pages/graph.html',
    'pages/goals.html', 'pages/calculator.html'];

  htmlPages.forEach(page => {
    it(`${page} has DOCTYPE`, () => {
      expect(readFile(page).toLowerCase()).toContain('<!doctype html');
    });
    it(`${page} has charset meta`, () => {
      expect(readFile(page).toLowerCase()).toContain('charset');
    });
    it(`${page} has viewport meta`, () => {
      expect(readFile(page).toLowerCase()).toContain('viewport');
    });
  });
});

// ========== NAV CONSISTENCY ==========
describe('Navigation Consistency (post-login pages)', () => {
  const navPages = ['pages/meal.html', 'pages/diary.html', 'pages/graph.html', 'pages/goals.html'];
  const navTargets = ['meal.html', 'diary.html', 'graph.html', 'goals.html'];

  navPages.forEach(page => {
    navTargets.forEach(target => {
      it(`${page} links to ${target}`, () => {
        expect(readFile(page)).toContain(target);
      });
    });
  });
});

// ========== AUTH ==========
describe('Auth System', () => {
  const auth = readFile('js/auth.js');

  it('uses PBKDF2 for password hashing', () => {
    expect(auth).toContain('PBKDF2');
  });

  it('generates salt for passwords', () => {
    expect(auth.toLowerCase()).toContain('salt');
  });

  it('login.html redirects to meal.html', () => {
    const login = readFile('pages/login.html');
    expect(login).toContain('meal.html');
  });

  it('register.html exists and has form', () => {
    const reg = readFile('pages/register.html');
    expect(reg).toContain('<form');
  });
});

// ========== STORE ==========
describe('Store Module', () => {
  const store = readFile('js/store.js');

  it('has addMeal method', () => expect(store).toContain('addMeal'));
  it('has getMeals method', () => expect(store).toContain('getMeals'));
  it('has deleteMeal method', () => expect(store).toContain('deleteMeal'));
  it('has addWeight method', () => expect(store).toContain('addWeight'));
  it('has getWeights method', () => expect(store).toContain('getWeights'));
  it('has setGoals method', () => expect(store).toContain('setGoals'));
  it('has getGoals method', () => expect(store).toContain('getGoals'));
  it('has getRecentDays method', () => expect(store).toContain('getRecentDays'));
  it('has getDayTotal method', () => expect(store).toContain('getDayTotal'));
  it('has getStorageUsage method', () => expect(store).toContain('getStorageUsage'));
});

// ========== FOOD DB ==========
describe('FoodDB Module', () => {
  const fdb = readFile('js/food-db.js');

  it('has search method', () => expect(fdb).toContain('search'));
  it('has getByCategory method', () => expect(fdb).toContain('getByCategory'));
  it('has getById method', () => expect(fdb).toContain('getById'));
  it('has calculate method', () => expect(fdb).toContain('calculate'));
  it('has getCategories method', () => expect(fdb).toContain('getCategories'));
  it('contains 200+ food items', () => {
    const matches = fdb.match(/\{\s*id:\s*\d+/g);
    expect(matches ? matches.length : 0).toBeGreaterThan(200);
  });

  // Check categories
  const requiredCats = ['ごはん', '肉', '魚', '野菜', '飲料', 'コンビニ', 'パン', 'めん'];
  requiredCats.forEach(cat => {
    it(`has "${cat}" category`, () => expect(fdb).toContain(cat));
  });
});

// ========== APP.CSS ==========
describe('App CSS', () => {
  const css = readFile('css/app.css');

  it('has dark mode styles', () => expect(css).toContain('data-theme="dark"'));
  it('has responsive breakpoints', () => expect(css).toContain('@media'));
  it('has app-nav styles', () => expect(css).toContain('.app-nav'));
  it('has modal styles', () => expect(css).toContain('.modal'));
  it('has toast styles', () => expect(css).toContain('.toast'));
});

// ========== PWA ==========
describe('PWA', () => {
  it('manifest.json is valid JSON', () => {
    JSON.parse(readFile('manifest.json'));
  });

  it('manifest has required fields', () => {
    const m = JSON.parse(readFile('manifest.json'));
    expect(!!m.name).toBeTruthy();
    expect(!!m.icons).toBeTruthy();
    expect(!!m.start_url).toBeTruthy();
  });

  it('sw.js has cache strategy', () => {
    const sw = readFile('sw.js');
    expect(sw).toContain('cache');
  });

  it('index.html registers service worker', () => {
    const idx = readFile('index.html');
    expect(idx).toContain('serviceWorker');
  });
});

// ========== EXERCISE DB ==========
describe('ExerciseDB', () => {
  const edb = readFile('js/exercise-db.js');
  it('has getAll method', () => expect(edb).toContain('getAll'));
  it('has search method', () => expect(edb).toContain('search'));
  it('has calculate method', () => expect(edb).toContain('calculate'));
});

// ========== ADVISOR ==========
describe('Advisor', () => {
  const adv = readFile('js/advisor.js');
  it('has analyze method', () => expect(adv).toContain('analyze'));
  it('has food suggestions', () => expect(adv).toContain('suggest'));
});

// ========== I18N ==========
describe('I18n', () => {
  const i18n = readFile('js/i18n.js');
  it('has Japanese translations', () => expect(i18n).toContain('ja'));
  it('has English translations', () => expect(i18n).toContain('en'));
  it('applies translations', () => expect(i18n).toContain('data-i18n'));
});

// ========== GAMIFICATION ==========
describe('Gamification', () => {
  const gam = readFile('js/gamification.js');
  it('has badges', () => expect(gam).toContain('badge'));
  it('has challenges', () => expect(gam).toContain('challenge'));
  it('has levels', () => expect(gam).toContain('level'));
});

// ========== SECURITY ==========
describe('Security', () => {
  const auth = readFile('js/auth.js');
  it('no plaintext password storage', () => {
    expect(auth).not.toContain('password: password');
    expect(auth).not.toContain("password: pwd");
  });

  // Check for XSS sanitization
  const jsFiles = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'));
  const allJs = jsFiles.map(f => readFile(`js/${f}`)).join('\n');
  it('has sanitizeHTML function', () => {
    expect(allJs).toContain('sanitizeHTML');
  });
});

// ========== ACCESSIBILITY ==========
describe('Accessibility', () => {
  const appCss = readFile('css/app.css');

  it('modals have ARIA roles', () => {
    const meal = readFile('pages/meal.html');
    // Check for role="dialog" or aria-modal
    const hasAria = meal.includes('role="dialog"') || meal.includes('aria-modal');
    if (!hasAria) throw new Error('Modal missing ARIA dialog role');
  });

  it('app.css has focus styles', () => {
    expect(appCss).toContain(':focus-visible');
  });
});

// ========== CROSS-PAGE LINK INTEGRITY ==========
describe('Link Integrity', () => {
  it('index.html links to login', () => {
    expect(readFile('index.html')).toContain('login.html');
  });

  it('index.html links to register', () => {
    expect(readFile('index.html')).toContain('register.html');
  });

  it('calculator.html requires login', () => {
    expect(readFile('pages/calculator.html')).toContain('login.html');
  });

  it('index.html links to terms', () => {
    expect(readFile('index.html')).toContain('terms.html');
  });

  it('index.html links to privacy', () => {
    expect(readFile('index.html')).toContain('privacy.html');
  });
});

// ========== SUMMARY ==========
console.log('\n' + '='.repeat(50));
if (failed === 0) {
  console.log(`\x1b[32m${passed}/${total} tests passed ✓\x1b[0m`);
} else {
  console.log(`\x1b[31m${passed}/${total} tests passed, ${failed} failed\x1b[0m`);
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  \x1b[31m✗\x1b[0m ${f}`));
}
process.exit(failed > 0 ? 1 : 0);
