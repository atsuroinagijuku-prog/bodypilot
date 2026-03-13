// ============================
// レポートページ (Chart.js版)
// ============================

// --- XSS対策: サニタイズ関数 ---
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

let calPeriodDays = 7;
let nutrPeriodDays = 7;
let pfcPeriodDays = 7;
let weightPeriodDays = 30;
let macroPeriodDays = 7;
let globalRangeDays = 30;

// Chart instances (destroy before re-creating to prevent memory leaks)
let calChartInstance = null;
let radarChartInstance = null;
let pfcChartInstance = null;
let weightChartInstance = null;
let exerciseChartInstance = null;
let waterChartInstance = null;
let macroChartInstance = null;

// --- Dark Mode Helpers ---
function isDarkMode() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

function getChartColors() {
  const dark = isDarkMode();
  return {
    text: dark ? '#e0e0e0' : '#3A3A3A',
    textSub: dark ? '#aaa' : '#777',
    gridLine: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    bg: dark ? '#1e1e1e' : '#ffffff',
    green: '#7B8B2E',
    greenLight: '#9AB030',
    greenPale: 'rgba(123,139,46,0.2)',
    red: '#e55',
    redPale: 'rgba(229,85,85,0.2)',
    blue: '#3A8DC5',
    bluePale: 'rgba(58,141,197,0.2)',
    orange: '#f39c12',
    purple: '#9b59b6',
    teal: '#1abc9c',
    protein: '#e74c3c',
    fat: '#f39c12',
    carb: '#3498db',
    fiber: '#2ecc71',
  };
}

// --- Chart.js Dark Mode Defaults ---
function applyChartTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  Chart.defaults.color = isDark ? '#E0E0E0' : '#3A3A3A';
  Chart.defaults.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
}

// --- Theme Observer ---
const themeObserver = new MutationObserver(() => {
  applyChartTheme();
  renderAllCharts();
});

document.addEventListener('DOMContentLoaded', async () => {
  await Auth.init();
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }

  applyChartTheme();

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  initDateRangePicker();
  initReports();
});

function initDateRangePicker() {
  const startEl = document.getElementById('report-start-date');
  const endEl = document.getElementById('report-end-date');
  if (startEl && endEl) {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - globalRangeDays);
    startEl.value = thirtyDaysAgo.toISOString().split('T')[0];
    endEl.value = today;
    endEl.max = today;
  }
}

function initReports() {
  renderReportPeriod();
  renderAllCharts();
}

function renderAllCharts() {
  renderCalChart();
  renderMacroChart();
  renderNutritionRadar();
  renderPfcChart();
  renderWeightChart();
  renderExerciseChart();
  renderWaterChart();
  renderStreak();
  renderHeatmap();
  renderBMI();
  renderStats();
}

function renderReportPeriod() {
  const el = document.getElementById('report-period');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric'
    }) + ' 現在';
  }
}

function updateReports() {
  // Sync global range from date picker
  const startEl = document.getElementById('report-start-date');
  const endEl = document.getElementById('report-end-date');
  if (startEl && endEl && startEl.value && endEl.value) {
    const start = new Date(startEl.value);
    const end = new Date(endEl.value);
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      globalRangeDays = diffDays;
      // Update quick range button highlights
      updateQuickRangeButtons(globalRangeDays);
    }
  }
  renderAllCharts();
}

// ============================
// Global Date Range
// ============================
function setRange(days) {
  globalRangeDays = days;

  // Update date inputs
  const startEl = document.getElementById('report-start-date');
  const endEl = document.getElementById('report-end-date');
  if (startEl && endEl) {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - days);
    startEl.value = start.toISOString().split('T')[0];
    endEl.value = today.toISOString().split('T')[0];
  }

  // Update quick range button highlights
  updateQuickRangeButtons(days);

  // Update all charts
  renderAllCharts();
}

function updateQuickRangeButtons(days) {
  const buttons = document.querySelectorAll('.quick-range-buttons button');
  const dayMap = [7, 30, 90, 180, 365];
  buttons.forEach((btn, i) => {
    btn.classList.toggle('active', dayMap[i] === days);
  });
}

// ============================
// a) カロリートレンド - Line Chart
// ============================
function setCalPeriod(days) {
  calPeriodDays = days;
  updateToggleByValue('cal-period-toggle', days, [7, 14, 30, 90]);
  renderCalChart();
}

function renderCalChart() {
  const canvas = document.getElementById('cal-chart');
  if (!canvas) return;

  if (calChartInstance) {
    calChartInstance.destroy();
    calChartInstance = null;
  }

  const data = Store.getRecentDays(calPeriodDays);
  const goals = Store.getGoals();
  const colors = getChartColors();

  const labels = data.map(d => d.label);
  const calories = data.map(d => d.total.cal);
  const goalLine = data.map(() => goals.cal);

  const pointColors = calories.map(c => c > goals.cal ? colors.red : colors.green);

  calChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '摂取カロリー',
          data: calories,
          borderColor: colors.green,
          backgroundColor: colors.greenPale,
          pointBackgroundColor: pointColors,
          pointBorderColor: pointColors,
          pointRadius: calPeriodDays <= 14 ? 4 : 2,
          tension: 0.3,
          fill: true,
          segment: {
            borderColor: ctx => {
              const idx = ctx.p1DataIndex;
              return calories[idx] > goals.cal ? colors.red : colors.green;
            },
            backgroundColor: ctx => {
              const idx = ctx.p1DataIndex;
              return calories[idx] > goals.cal ? colors.redPale : colors.greenPale;
            }
          }
        },
        {
          label: '目標',
          data: goalLine,
          borderColor: colors.textSub,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
          borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { labels: { color: colors.text, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: ctx => ctx.dataset.label + ': ' + ctx.parsed.y.toLocaleString() + ' kcal'
          }
        }
      },
      scales: {
        x: {
          ticks: { color: colors.textSub, font: { size: 10 }, maxRotation: 45, maxTicksLimit: calPeriodDays <= 14 ? 14 : 15 },
          grid: { color: colors.gridLine }
        },
        y: {
          beginAtZero: true,
          ticks: { color: colors.textSub, font: { size: 10 }, callback: v => v.toLocaleString() },
          grid: { color: colors.gridLine }
        }
      }
    }
  });
}

// ============================
// a2) 栄養バランス推移 - Multi-line Chart
// ============================
function setMacroPeriod(days) {
  macroPeriodDays = days;
  updateToggleByValue('macro-period-toggle', days, [7, 14, 30]);
  renderMacroChart();
}

function renderMacroChart() {
  const canvas = document.getElementById('macro-chart');
  if (!canvas) return;

  if (macroChartInstance) {
    macroChartInstance.destroy();
    macroChartInstance = null;
  }

  const data = Store.getRecentDays(macroPeriodDays);
  const goals = Store.getGoals();
  const colors = getChartColors();

  const labels = data.map(d => d.label);
  const proteinData = data.map(d => d.total.protein);
  const fatData = data.map(d => d.total.fat);
  const carbData = data.map(d => d.total.carb);

  macroChartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'タンパク質 (g)',
          data: proteinData,
          borderColor: colors.protein,
          backgroundColor: 'rgba(231,76,60,0.1)',
          pointBackgroundColor: colors.protein,
          pointRadius: macroPeriodDays <= 14 ? 3 : 2,
          tension: 0.3,
          fill: false,
          borderWidth: 2
        },
        {
          label: '脂質 (g)',
          data: fatData,
          borderColor: colors.fat,
          backgroundColor: 'rgba(243,156,18,0.1)',
          pointBackgroundColor: colors.fat,
          pointRadius: macroPeriodDays <= 14 ? 3 : 2,
          tension: 0.3,
          fill: false,
          borderWidth: 2
        },
        {
          label: '炭水化物 (g)',
          data: carbData,
          borderColor: colors.carb,
          backgroundColor: 'rgba(52,152,219,0.1)',
          pointBackgroundColor: colors.carb,
          pointRadius: macroPeriodDays <= 14 ? 3 : 2,
          tension: 0.3,
          fill: false,
          borderWidth: 2
        },
        {
          label: 'P目標',
          data: data.map(() => goals.protein),
          borderColor: colors.protein,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
          borderWidth: 1
        },
        {
          label: 'F目標',
          data: data.map(() => goals.fat),
          borderColor: colors.fat,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
          borderWidth: 1
        },
        {
          label: 'C目標',
          data: data.map(() => goals.carb),
          borderColor: colors.carb,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          labels: {
            color: colors.text,
            font: { size: 10 },
            filter: item => !item.text.includes('目標')
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(1) + ' g'
          }
        }
      },
      scales: {
        x: {
          ticks: { color: colors.textSub, font: { size: 10 }, maxRotation: 45, maxTicksLimit: 15 },
          grid: { color: colors.gridLine }
        },
        y: {
          beginAtZero: true,
          ticks: { color: colors.textSub, font: { size: 10 }, callback: v => v + 'g' },
          grid: { color: colors.gridLine }
        }
      }
    }
  });
}

// ============================
// b) 栄養バランス - Radar Chart
// ============================
function setNutrPeriod(days) {
  nutrPeriodDays = days;
  updateToggleByValue('nutr-period-toggle', days, [7, 14, 30]);
  renderNutritionRadar();
}

function renderNutritionRadar() {
  const canvas = document.getElementById('nutrition-radar-chart');
  if (!canvas) return;

  if (radarChartInstance) {
    radarChartInstance.destroy();
    radarChartInstance = null;
  }

  const data = Store.getRecentDays(nutrPeriodDays);
  const goals = Store.getGoals();
  const colors = getChartColors();

  const recordedDays = data.filter(d => d.total.cal > 0);
  const count = recordedDays.length;

  if (count === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = colors.textSub;
    ctx.textAlign = 'center';
    ctx.fillText('データがありません', canvas.width / 2, canvas.height / 2);
    return;
  }

  const avg = {
    cal: Math.round(recordedDays.reduce((s, d) => s + d.total.cal, 0) / count),
    protein: Math.round(recordedDays.reduce((s, d) => s + d.total.protein, 0) / count * 10) / 10,
    fat: Math.round(recordedDays.reduce((s, d) => s + d.total.fat, 0) / count * 10) / 10,
    carb: Math.round(recordedDays.reduce((s, d) => s + d.total.carb, 0) / count * 10) / 10,
    fiber: Math.round(recordedDays.reduce((s, d) => s + d.total.fiber, 0) / count * 10) / 10,
  };

  const actualPcts = [
    (avg.cal / goals.cal) * 100,
    (avg.protein / goals.protein) * 100,
    (avg.fat / goals.fat) * 100,
    (avg.carb / goals.carb) * 100,
    (avg.fiber / goals.fiber) * 100,
  ];

  const goalPcts = [100, 100, 100, 100, 100];

  radarChartInstance = new Chart(canvas, {
    type: 'radar',
    data: {
      labels: ['カロリー', 'タンパク質', '脂質', '炭水化物', '食物繊維'],
      datasets: [
        {
          label: '実績 (目標比%)',
          data: actualPcts,
          borderColor: colors.green,
          backgroundColor: 'rgba(123,139,46,0.25)',
          pointBackgroundColor: colors.green,
          pointRadius: 3,
          borderWidth: 2
        },
        {
          label: '目標 (100%)',
          data: goalPcts,
          borderColor: colors.textSub,
          backgroundColor: 'rgba(150,150,150,0.08)',
          borderDash: [4, 4],
          pointRadius: 0,
          borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: colors.text, font: { size: 10 } } },
        tooltip: {
          callbacks: {
            label: ctx => {
              const vals = [avg.cal + ' kcal', avg.protein + ' g', avg.fat + ' g', avg.carb + ' g', avg.fiber + ' g'];
              const goalVals = [goals.cal + ' kcal', goals.protein + ' g', goals.fat + ' g', goals.carb + ' g', goals.fiber + ' g'];
              if (ctx.datasetIndex === 0) {
                return vals[ctx.dataIndex] + ' (' + Math.round(ctx.parsed.r) + '%)';
              }
              return '目標: ' + goalVals[ctx.dataIndex];
            }
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          suggestedMax: 150,
          ticks: { color: colors.textSub, backdropColor: 'transparent', font: { size: 9 }, callback: v => v + '%' },
          grid: { color: colors.gridLine },
          angleLines: { color: colors.gridLine },
          pointLabels: { color: colors.text, font: { size: 11, weight: '600' } }
        }
      }
    }
  });
}

// ============================
// c) PFC比率 - Doughnut Chart
// ============================
function setPfcPeriod(days) {
  pfcPeriodDays = days;
  updateToggleByValue('pfc-period-toggle', days, [7, 30]);
  renderPfcChart();
}

function renderPfcChart() {
  const canvas = document.getElementById('pfc-chart');
  if (!canvas) return;

  if (pfcChartInstance) {
    pfcChartInstance.destroy();
    pfcChartInstance = null;
  }

  const data = Store.getRecentDays(pfcPeriodDays);
  const colors = getChartColors();

  const recordedDays = data.filter(d => d.total.cal > 0);
  const count = recordedDays.length;

  if (count === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = colors.textSub;
    ctx.textAlign = 'center';
    ctx.fillText('データがありません', canvas.width / 2, canvas.height / 2);
    return;
  }

  const totalProtein = recordedDays.reduce((s, d) => s + d.total.protein, 0) / count;
  const totalFat = recordedDays.reduce((s, d) => s + d.total.fat, 0) / count;
  const totalCarb = recordedDays.reduce((s, d) => s + d.total.carb, 0) / count;

  const pCal = totalProtein * 4;
  const fCal = totalFat * 9;
  const cCal = totalCarb * 4;
  const totalCal = pCal + fCal + cCal;

  const pPct = totalCal > 0 ? Math.round((pCal / totalCal) * 100) : 0;
  const fPct = totalCal > 0 ? Math.round((fCal / totalCal) * 100) : 0;
  const cPct = totalCal > 0 ? 100 - pPct - fPct : 0;

  const centerTextPlugin = {
    id: 'pfcCenterText',
    beforeDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      ctx.save();
      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(totalCal) + ' kcal', centerX, centerY - 8);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = colors.textSub;
      ctx.fillText(count + '日平均', centerX, centerY + 12);
      ctx.restore();
    }
  };

  pfcChartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: [
        'タンパク質 ' + pPct + '%',
        '脂質 ' + fPct + '%',
        '炭水化物 ' + cPct + '%'
      ],
      datasets: [{
        data: [pCal, fCal, cCal],
        backgroundColor: [colors.protein, colors.fat, colors.carb],
        borderWidth: 2,
        borderColor: colors.bg
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: colors.text, font: { size: 11 }, padding: 12 }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const kcal = Math.round(ctx.parsed);
              return ctx.label + ' (' + kcal + ' kcal)';
            }
          }
        }
      }
    },
    plugins: [centerTextPlugin]
  });
}

// ============================
// d) 体重トレンド - Line Chart with BMI zones
// ============================
function setWeightPeriod(days) {
  weightPeriodDays = days;
  updateToggleByValue('weight-period-toggle', days, [30, 90, 180, 365]);
  renderWeightChart();
}

function renderWeightChart() {
  const canvas = document.getElementById('weight-chart');
  if (!canvas) return;

  if (weightChartInstance) {
    weightChartInstance.destroy();
    weightChartInstance = null;
  }

  const allWeights = Store.getWeights();
  const colors = getChartColors();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weightPeriodDays);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const weights = allWeights.filter(w => w.date >= cutoffStr).sort((a, b) => a.date.localeCompare(b.date));

  if (weights.length === 0) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = colors.textSub;
    ctx.textAlign = 'center';
    ctx.fillText('体重データがありません', canvas.width / 2, canvas.height / 2);
    return;
  }

  const labels = weights.map(w => {
    const d = new Date(w.date);
    return (d.getMonth() + 1) + '/' + d.getDate();
  });

  const weightData = weights.map(w => w.weight);
  const bodyFatData = weights.map(w => w.bodyFat);
  const hasBodyFat = bodyFatData.some(v => v !== null && v !== undefined);

  // Calculate moving average (7-day)
  const movingAvg = weightData.map((val, idx) => {
    const window = 7;
    const start = Math.max(0, idx - window + 1);
    const slice = weightData.slice(start, idx + 1);
    return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length * 10) / 10;
  });

  const heightCm = getUserHeight();

  // BMI zone background plugin
  const bmiZonePlugin = {
    id: 'bmiZones',
    beforeDraw(chart) {
      if (!heightCm) return;
      const { ctx, chartArea, scales } = chart;
      const yScale = scales.y;
      if (!yScale) return;
      const heightM = heightCm / 100;

      const zones = [
        { bmi: 0, color: 'rgba(52,152,219,0.08)' },
        { bmi: 18.5, color: 'rgba(46,204,113,0.08)' },
        { bmi: 25, color: 'rgba(243,156,18,0.08)' },
        { bmi: 30, color: 'rgba(231,76,60,0.08)' },
        { bmi: 35, color: 'rgba(192,57,43,0.08)' },
      ];

      const bmiToWeight = bmi => bmi * heightM * heightM;
      const boundaries = [0, 18.5, 25, 30, 35, 100].map(bmiToWeight);

      ctx.save();
      for (let i = 0; i < zones.length; i++) {
        const yTop = yScale.getPixelForValue(Math.min(boundaries[i + 1], yScale.max));
        const yBottom = yScale.getPixelForValue(Math.max(boundaries[i], yScale.min));
        if (yBottom > chartArea.top && yTop < chartArea.bottom) {
          const top = Math.max(yTop, chartArea.top);
          const bottom = Math.min(yBottom, chartArea.bottom);
          ctx.fillStyle = zones[i].color;
          ctx.fillRect(chartArea.left, top, chartArea.right - chartArea.left, bottom - top);
        }
      }
      ctx.restore();
    }
  };

  const datasets = [
    {
      label: '体重 (kg)',
      data: weightData,
      borderColor: colors.blue,
      backgroundColor: colors.bluePale,
      pointBackgroundColor: colors.blue,
      pointRadius: weights.length <= 30 ? 3 : 2,
      tension: 0.3,
      fill: true,
      yAxisID: 'y'
    },
    {
      label: '移動平均 (7日)',
      data: movingAvg,
      borderColor: colors.green,
      borderDash: [5, 3],
      pointRadius: 0,
      fill: false,
      borderWidth: 2,
      yAxisID: 'y'
    }
  ];

  const scalesConfig = {
    x: {
      ticks: { color: colors.textSub, font: { size: 10 }, maxRotation: 45, maxTicksLimit: 15 },
      grid: { color: colors.gridLine }
    },
    y: {
      position: 'left',
      ticks: { color: colors.textSub, font: { size: 10 }, callback: v => v + 'kg' },
      grid: { color: colors.gridLine }
    }
  };

  if (hasBodyFat) {
    datasets.push({
      label: '体脂肪率 (%)',
      data: bodyFatData,
      borderColor: colors.orange,
      backgroundColor: 'rgba(243,156,18,0.1)',
      pointBackgroundColor: colors.orange,
      pointRadius: weights.length <= 30 ? 3 : 2,
      tension: 0.3,
      fill: false,
      yAxisID: 'y1',
      borderDash: [4, 3]
    });

    scalesConfig.y1 = {
      position: 'right',
      ticks: { color: colors.orange, font: { size: 10 }, callback: v => v + '%' },
      grid: { drawOnChartArea: false }
    };
  }

  weightChartInstance = new Chart(canvas, {
    type: 'line',
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: { legend: { labels: { color: colors.text, font: { size: 11 } } } },
      scales: scalesConfig
    },
    plugins: [bmiZonePlugin]
  });
}

// ============================
// e) 運動 - Bar Chart (weekly)
// ============================
function renderExerciseChart() {
  const canvas = document.getElementById('exercise-chart');
  if (!canvas) return;

  if (exerciseChartInstance) {
    exerciseChartInstance.destroy();
    exerciseChartInstance = null;
  }

  const colors = getChartColors();
  const data = Store.getRecentDays(7);

  const labels = data.map(d => d.label);
  const exerciseCals = data.map(d => {
    return Store.getDayExerciseTotal ? Store.getDayExerciseTotal(d.date) : 0;
  });

  exerciseChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '消費カロリー (kcal)',
        data: exerciseCals,
        backgroundColor: colors.teal,
        borderRadius: 4,
        barPercentage: 0.6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: colors.text, font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: colors.textSub, font: { size: 10 } }, grid: { color: colors.gridLine } },
        y: {
          beginAtZero: true,
          ticks: { color: colors.textSub, font: { size: 10 }, callback: v => v + ' kcal' },
          grid: { color: colors.gridLine }
        }
      }
    }
  });
}

// ============================
// f) 水分摂取 - Bar Chart (7 days)
// ============================
function renderWaterChart() {
  const canvas = document.getElementById('water-chart');
  if (!canvas) return;

  if (waterChartInstance) {
    waterChartInstance.destroy();
    waterChartInstance = null;
  }

  const colors = getChartColors();
  const recentDays = Store.getRecentDays(7);
  const waterGoal = Store.getWaterGoal ? Store.getWaterGoal() : 2000;

  const labels = recentDays.map(d => d.label);
  const waterData = recentDays.map(d => {
    return Store.getWaterIntake ? Store.getWaterIntake(d.date) : 0;
  });

  waterChartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: '水分摂取 (ml)',
          data: waterData,
          backgroundColor: waterData.map(v => v >= waterGoal ? 'rgba(52,152,219,0.8)' : 'rgba(52,152,219,0.4)'),
          borderRadius: 4,
          barPercentage: 0.6
        },
        {
          label: '目標',
          data: recentDays.map(() => waterGoal),
          type: 'line',
          borderColor: colors.textSub,
          borderDash: [5, 3],
          pointRadius: 0,
          fill: false,
          borderWidth: 1.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: colors.text, font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: colors.textSub, font: { size: 10 } }, grid: { color: colors.gridLine } },
        y: {
          beginAtZero: true,
          ticks: { color: colors.textSub, font: { size: 10 }, callback: v => v + ' ml' },
          grid: { color: colors.gridLine }
        }
      }
    }
  });
}

// ============================
// g) Streak & Heatmap
// ============================
function renderStreak() {
  const streakEl = document.getElementById('streak-count');
  const badgeEl = document.getElementById('streak-badge');
  const detailEl = document.getElementById('streak-detail');

  const data = Store.getRecentDays(90);
  let streak = 0;

  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].meals.length > 0) {
      streak++;
    } else {
      if (streak > 0) break;
    }
  }

  const totalRecordedDays = data.filter(d => d.meals.length > 0).length;

  if (streakEl) streakEl.textContent = streak;
  if (badgeEl) badgeEl.textContent = streak;
  if (detailEl) detailEl.textContent = '過去90日間で ' + totalRecordedDays + ' 日記録';
}

function renderHeatmap() {
  const container = document.getElementById('heatmap-grid');
  if (!container) return;

  const data = Store.getRecentDays(91);
  const maxMeals = Math.max(1, ...data.map(d => d.meals.length));

  const firstDate = new Date(data[0].date);
  const startDayOfWeek = firstDate.getDay();

  let html = '';
  for (let i = 0; i < startDayOfWeek; i++) {
    html += '<div class="heatmap-cell" style="visibility:hidden"></div>';
  }

  data.forEach(d => {
    const mealCount = d.meals.length;
    let level = '';
    if (mealCount === 0) level = '';
    else if (mealCount <= maxMeals * 0.25) level = 'level-1';
    else if (mealCount <= maxMeals * 0.5) level = 'level-2';
    else if (mealCount <= maxMeals * 0.75) level = 'level-3';
    else level = 'level-4';

    html += `<div class="heatmap-cell ${level}" title="${d.date}: ${mealCount}食"></div>`;
  });

  container.innerHTML = html;
}

// ============================
// h) BMI Calculation & Display
// ============================
function getUserHeight() {
  // Use Store method if available, fallback to direct localStorage
  if (Store.getUserHeight) {
    return Store.getUserHeight();
  }
  const uid = Auth.currentUser ? Auth.currentUser.uid : 'anon';
  const key = `bp_${uid}_height`;
  const val = localStorage.getItem(key);
  return val ? parseFloat(val) : null;
}

function calculateBMI(weight, heightCm) {
  const heightM = heightCm / 100;
  return weight / (heightM * heightM);
}

function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: '低体重', color: '#3498db' };
  if (bmi < 25) return { label: '普通体重', color: '#2ecc71' };
  if (bmi < 30) return { label: '肥満(1度)', color: '#f39c12' };
  if (bmi < 35) return { label: '肥満(2度)', color: '#e74c3c' };
  return { label: '肥満(3度)', color: '#c0392b' };
}

function renderBMI() {
  const container = document.getElementById('bmi-display');
  if (!container) return;

  const heightCm = getUserHeight();
  const weights = Store.getWeights();

  if (!heightCm || weights.length === 0) {
    let msg = '';
    if (!heightCm && weights.length === 0) {
      msg = '設定画面で身長を入力し、体重を記録するとBMIが表示されます。';
    } else if (!heightCm) {
      msg = '設定画面で身長を入力するとBMIが表示されます。';
    } else {
      msg = '体重を記録するとBMIが表示されます。';
    }
    container.innerHTML = `<div class="bmi-no-data">${sanitizeHTML(msg)}</div>`;
    return;
  }

  const latest = weights[weights.length - 1];
  const bmi = calculateBMI(latest.weight, heightCm);
  const category = getBMICategory(bmi);

  const heightM = heightCm / 100;
  const idealWeight = Math.round(22 * heightM * heightM * 10) / 10;
  const diff = Math.round((latest.weight - idealWeight) * 10) / 10;

  let bodyFatHtml = '';
  if (latest.bodyFat) {
    bodyFatHtml = `<div class="bmi-detail">体脂肪率: <strong>${latest.bodyFat}%</strong></div>`;
  }

  // BMI gauge bar
  const bmiPct = Math.min(100, Math.max(0, (bmi / 40) * 100));

  container.innerHTML = `
    <div class="bmi-card">
      <div class="bmi-value" style="color:${category.color}">${bmi.toFixed(1)}</div>
      <div class="bmi-category" style="color:${category.color}">${sanitizeHTML(category.label)}</div>
      <div style="margin:10px 0;height:8px;background:var(--border);border-radius:4px;overflow:hidden;position:relative;">
        <div style="position:absolute;left:0;top:0;height:100%;width:${bmiPct}%;background:${category.color};border-radius:4px;transition:width 0.3s;"></div>
        <div style="position:absolute;left:${(18.5/40)*100}%;top:0;height:100%;width:1px;background:rgba(0,0,0,0.3);"></div>
        <div style="position:absolute;left:${(25/40)*100}%;top:0;height:100%;width:1px;background:rgba(0,0,0,0.3);"></div>
        <div style="position:absolute;left:${(30/40)*100}%;top:0;height:100%;width:1px;background:rgba(0,0,0,0.3);"></div>
      </div>
      <div class="bmi-detail">
        体重: ${latest.weight}kg / 身長: ${heightCm}cm<br>
        ${sanitizeHTML(latest.date)}
      </div>
      ${bodyFatHtml}
      <div class="bmi-target">
        理想体重 (BMI22): ${idealWeight}kg
        ${diff > 0 ? '(あと -' + diff + 'kg)' : diff < 0 ? '(あと +' + Math.abs(diff) + 'kg)' : '(達成!)'}
      </div>
    </div>
  `;
}

// ============================
// i) Statistics Summary
// ============================
function renderStats() {
  const container = document.getElementById('stats-summary');
  if (!container) return;

  const data = Store.getRecentDays(globalRangeDays);
  const weights = Store.getWeights();
  const recordedDays = data.filter(d => d.meals.length > 0);
  const count = recordedDays.length;

  // Total meals recorded
  let totalMeals = 0;
  recordedDays.forEach(d => { totalMeals += d.meals.length; });

  // Average daily calories
  const avgCal = count > 0 ? Math.round(recordedDays.reduce((s, d) => s + d.total.cal, 0) / count) : 0;

  // Average macros
  const avgProtein = count > 0 ? Math.round(recordedDays.reduce((s, d) => s + d.total.protein, 0) / count * 10) / 10 : 0;
  const avgFat = count > 0 ? Math.round(recordedDays.reduce((s, d) => s + d.total.fat, 0) / count * 10) / 10 : 0;
  const avgCarb = count > 0 ? Math.round(recordedDays.reduce((s, d) => s + d.total.carb, 0) / count * 10) / 10 : 0;

  // Current streak
  let streak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].meals.length > 0) streak++;
    else if (streak > 0) break;
  }

  // Total weight change
  let weightChange = '--';
  if (weights.length >= 2) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - globalRangeDays);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const periodWeights = weights.filter(w => w.date >= cutoffStr).sort((a, b) => a.date.localeCompare(b.date));
    if (periodWeights.length >= 2) {
      const change = Math.round((periodWeights[periodWeights.length - 1].weight - periodWeights[0].weight) * 10) / 10;
      weightChange = (change > 0 ? '+' : '') + change + 'kg';
    }
  }

  // Most eaten food
  const foodCounts = {};
  recordedDays.forEach(d => {
    d.meals.forEach(m => {
      const name = m.name || '不明';
      foodCounts[name] = (foodCounts[name] || 0) + 1;
    });
  });
  let mostEaten = '--';
  let mostEatenCount = 0;
  Object.entries(foodCounts).forEach(([name, cnt]) => {
    if (cnt > mostEatenCount) {
      mostEatenCount = cnt;
      mostEaten = name;
    }
  });

  container.innerHTML = `
    <div class="avg-item">
      <div class="avg-label">記録日数</div>
      <div class="avg-value">${count}</div>
      <div class="avg-unit">/ ${globalRangeDays}日</div>
    </div>
    <div class="avg-item">
      <div class="avg-label">記録食数</div>
      <div class="avg-value">${totalMeals}</div>
      <div class="avg-unit">食</div>
    </div>
    <div class="avg-item">
      <div class="avg-label">平均カロリー</div>
      <div class="avg-value">${avgCal.toLocaleString()}</div>
      <div class="avg-unit">kcal/日</div>
    </div>
    <div class="avg-item">
      <div class="avg-label">平均タンパク質</div>
      <div class="avg-value">${avgProtein}</div>
      <div class="avg-unit">g/日</div>
    </div>
    <div class="avg-item">
      <div class="avg-label">平均脂質</div>
      <div class="avg-value">${avgFat}</div>
      <div class="avg-unit">g/日</div>
    </div>
    <div class="avg-item">
      <div class="avg-label">平均炭水化物</div>
      <div class="avg-value">${avgCarb}</div>
      <div class="avg-unit">g/日</div>
    </div>
    <div class="avg-item">
      <div class="avg-label">連続記録</div>
      <div class="avg-value">${streak}</div>
      <div class="avg-unit">日</div>
    </div>
    <div class="avg-item">
      <div class="avg-label">体重変化</div>
      <div class="avg-value">${sanitizeHTML(weightChange)}</div>
      <div class="avg-unit">&nbsp;</div>
    </div>
    <div class="avg-item" style="grid-column: 1 / -1;">
      <div class="avg-label">よく食べた食品</div>
      <div class="avg-value" style="font-size:1rem;">${sanitizeHTML(mostEaten)}</div>
      <div class="avg-unit">${mostEatenCount > 0 ? mostEatenCount + '回' : ''}</div>
    </div>
  `;
}

// ============================
// Export Charts as Image
// ============================
function exportAllChartsAsImage() {
  const charts = [
    { instance: calChartInstance, name: 'カロリートレンド' },
    { instance: macroChartInstance, name: '栄養バランス推移' },
    { instance: radarChartInstance, name: '栄養バランス' },
    { instance: pfcChartInstance, name: 'PFC比率' },
    { instance: weightChartInstance, name: '体重トレンド' },
    { instance: exerciseChartInstance, name: '運動' },
    { instance: waterChartInstance, name: '水分' },
  ].filter(c => c.instance);

  if (charts.length === 0) {
    showToast('エクスポートするチャートがありません');
    return;
  }

  const padding = 20;
  const chartWidth = 600;
  const chartHeight = 300;
  const cols = 2;
  const rows = Math.ceil(charts.length / cols);

  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = chartWidth * cols + padding * (cols + 1);
  compositeCanvas.height = chartHeight * rows + padding * (rows + 1) + 60;
  const ctx = compositeCanvas.getContext('2d');

  const dark = isDarkMode();
  ctx.fillStyle = dark ? '#1e1e1e' : '#ffffff';
  ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);

  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = dark ? '#e0e0e0' : '#3A3A3A';
  ctx.textAlign = 'center';
  ctx.fillText('BodyPilot レポート - ' + new Date().toLocaleDateString('ja-JP'), compositeCanvas.width / 2, 40);

  charts.forEach((chart, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padding + col * (chartWidth + padding);
    const y = 60 + padding + row * (chartHeight + padding);

    try {
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = dark ? '#aaa' : '#777';
      ctx.textAlign = 'left';
      ctx.fillText(chart.name, x, y - 4);
      ctx.drawImage(chart.instance.canvas, x, y, chartWidth, chartHeight - 20);
    } catch (e) {
      console.warn('Could not export chart:', chart.name, e);
    }
  });

  const link = document.createElement('a');
  link.download = 'bodypilot_report_' + new Date().toISOString().split('T')[0] + '.png';
  link.href = compositeCanvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('レポート画像を保存しました');
}

// ============================
// Export as CSV
// ============================
function exportReportCSV() {
  const data = Store.getRecentDays(globalRangeDays);
  const weights = Store.getWeights();

  // Build weight lookup by date
  const weightMap = {};
  weights.forEach(w => { weightMap[w.date] = w; });

  // CSV header
  const rows = [];
  rows.push(['日付', 'カロリー(kcal)', 'タンパク質(g)', '脂質(g)', '炭水化物(g)', '食物繊維(g)', '体重(kg)', '体脂肪率(%)', '運動消費(kcal)', '水分(ml)'].join(','));

  data.forEach(d => {
    const w = weightMap[d.date];
    const exerciseCal = Store.getDayExerciseTotal ? Store.getDayExerciseTotal(d.date) : 0;
    const waterIntake = Store.getWaterIntake ? Store.getWaterIntake(d.date) : 0;

    rows.push([
      d.date,
      d.total.cal,
      d.total.protein,
      d.total.fat,
      d.total.carb,
      d.total.fiber,
      w ? w.weight : '',
      w && w.bodyFat ? w.bodyFat : '',
      exerciseCal,
      waterIntake
    ].join(','));
  });

  const csvContent = '\uFEFF' + rows.join('\n'); // BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bodypilot_report_' + new Date().toISOString().split('T')[0] + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('CSVファイルを保存しました');
}

// ============================
// Utilities
// ============================
function updateToggleByValue(containerId, activeValue, values) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const btns = container.querySelectorAll('.period-btn');
  const idx = values.indexOf(activeValue);
  btns.forEach((btn, i) => {
    btn.classList.toggle('active', i === idx);
  });
}

function updateToggle(containerId, activeIndex) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const btns = container.querySelectorAll('.period-btn');
  btns.forEach((btn, i) => {
    btn.classList.toggle('active', i === activeIndex);
  });
}

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

function handleLogout() {
  Auth.logout();
}

window.setCalPeriod = setCalPeriod;
window.setNutrPeriod = setNutrPeriod;
window.setPfcPeriod = setPfcPeriod;
window.setWeightPeriod = setWeightPeriod;
window.setMacroPeriod = setMacroPeriod;
window.setRange = setRange;
window.handleLogout = handleLogout;
window.updateReports = updateReports;
window.exportAllChartsAsImage = exportAllChartsAsImage;
window.exportReportCSV = exportReportCSV;
