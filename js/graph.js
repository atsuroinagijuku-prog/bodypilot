// ============================
// グラフページ (あすけんベンチマーク準拠)
// ============================

let currentTab = 'health';
let currentPeriod = 30;
let calendarMonth = new Date();

// XSS対策
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', async () => {
  await Auth.init();
  if (!Auth.isLoggedIn()) {
    window.location.href = 'login.html';
    return;
  }
  renderAll();
});

function renderAll() {
  renderUserHeader();
  renderGraph();
  renderMonthlyTable();
}

function renderUserHeader() {
  var name = '';
  if (Auth.currentUser) {
    name = Auth.currentUser.name || Auth.currentUser.email || '';
  }
  var headerEl = document.getElementById('user-name-header');
  if (headerEl) headerEl.textContent = name;
  var titleEl = document.getElementById('user-name-title');
  if (titleEl) titleEl.textContent = name;
}

// ============================
// Tab Switching
// ============================

function switchGraphTab(tab, el) {
  currentTab = tab;
  document.querySelectorAll('.graph-tab').forEach(function(t) {
    t.classList.remove('active');
  });
  if (el) el.classList.add('active');
  renderGraph();
}

function updateGraph() {
  currentPeriod = parseInt(document.getElementById('graph-period').value);
  renderGraph();
}

// ============================
// Graph Rendering
// ============================

function renderGraph() {
  var canvas = document.getElementById('graph-canvas');
  var ctx = canvas.getContext('2d');
  var noDataEl = document.getElementById('graph-no-data');
  var legendEl = document.getElementById('graph-legend');
  var wrapper = document.querySelector('.graph-canvas-wrapper');
  var yLabel = document.getElementById('graph-y-label');
  var yLabelRight = document.getElementById('graph-y-label-right');
  var xLabel = document.getElementById('graph-x-label');
  var weekLabels = document.getElementById('graph-week-labels');

  // Destroy previous chart if exists
  if (window.currentChart) {
    window.currentChart.destroy();
    window.currentChart = null;
  }

  // Show loading state
  if (wrapper) wrapper.classList.add('loading');

  // Reset
  canvas.style.display = 'block';
  noDataEl.style.display = 'none';
  legendEl.innerHTML = '';
  if (yLabelRight) yLabelRight.style.display = 'none';
  if (weekLabels) weekLabels.style.display = 'none';
  if (xLabel) xLabel.textContent = '[日]';

  setTimeout(function() {
    switch (currentTab) {
      case 'health':
        if (yLabel) yLabel.textContent = '健康度[点]';
        renderHealthChart(ctx, canvas, noDataEl, legendEl);
        break;
      case 'weight':
        if (yLabel) yLabel.textContent = '体重[kg]';
        if (yLabelRight) {
          yLabelRight.textContent = '体脂肪率[%]';
          yLabelRight.style.display = 'block';
        }
        renderWeightChart(ctx, canvas, noDataEl, legendEl);
        break;
      case 'intake':
        if (yLabel) yLabel.textContent = 'カロリー[kcal]';
        renderIntakeChart(ctx, canvas, noDataEl, legendEl);
        break;
      case 'burn':
        if (yLabel) yLabel.textContent = 'カロリー[kcal]';
        renderBurnChart(ctx, canvas, noDataEl, legendEl);
        break;
    }

    updateGraphTitle();
    updatePeriodDataCount();
    updateChartSummary(currentTab);
    if (wrapper) wrapper.classList.remove('loading');
  }, 100);
}

function updateGraphTitle() {
  var titleEl = document.getElementById('graph-title');
  var titles = {
    health: 'あすけん健康度',
    weight: '体重・体脂肪率',
    intake: '摂取カロリー',
    burn: '消費カロリー'
  };
  titleEl.textContent = titles[currentTab];
}

function updatePeriodDataCount() {
  var countEl = document.getElementById('period-data-count');
  if (!countEl) return;

  var days = getDays(currentPeriod);
  var dataCount = 0;

  days.forEach(function(d) {
    var meals = Store.getMeals(d.date);
    var weights = Store.getWeights();
    var hasWeight = weights.some(function(w) { return w.date === d.date; });
    if (meals.length > 0 || hasWeight) dataCount++;
  });

  if (dataCount > 0) {
    countEl.textContent = '(最近' + dataCount + '日分)';
  } else {
    countEl.textContent = '';
  }
}

// ============================
// Health Score Calculation
// ============================

function calculateHealthScore(date) {
  const goals = Store.getGoals();
  const total = Store.getDayTotal(date);
  const meals = Store.getMeals(date);

  if (meals.length === 0) return null;

  let score = 0;

  // Calorie score (40 points max)
  const calDiff = Math.abs(total.cal - goals.cal);
  const calPct = calDiff / goals.cal;
  if (calPct <= 0.05) score += 40;
  else if (calPct <= 0.1) score += 35;
  else if (calPct <= 0.2) score += 28;
  else if (calPct <= 0.3) score += 20;
  else if (calPct <= 0.5) score += 10;
  else score += 5;

  // Protein score (20 points max)
  const proteinPct = total.protein / goals.protein;
  if (proteinPct >= 0.8 && proteinPct <= 1.2) score += 20;
  else if (proteinPct >= 0.6 && proteinPct <= 1.4) score += 14;
  else if (proteinPct >= 0.4) score += 8;
  else score += 3;

  // Fat score (15 points max)
  const fatPct = total.fat / goals.fat;
  if (fatPct >= 0.7 && fatPct <= 1.2) score += 15;
  else if (fatPct >= 0.5 && fatPct <= 1.5) score += 10;
  else score += 4;

  // Carb score (15 points max)
  const carbPct = total.carb / goals.carb;
  if (carbPct >= 0.7 && carbPct <= 1.2) score += 15;
  else if (carbPct >= 0.5 && carbPct <= 1.5) score += 10;
  else score += 4;

  // Meal variety bonus (10 points max)
  const mealTypes = new Set(meals.map(function(m) { return m.type; }));
  if (mealTypes.size >= 3) score += 10;
  else if (mealTypes.size >= 2) score += 6;
  else score += 2;

  return Math.min(100, Math.round(score));
}

// ============================
// Health Chart (あすけん健康度)
// ============================

function renderHealthChart(ctx, canvas, noDataEl, legendEl) {
  var days = getDays(currentPeriod);
  var labels = [];
  var scores = [];
  var hasData = false;

  days.forEach(function(d) {
    labels.push(d.label);
    var score = calculateHealthScore(d.date);
    scores.push(score);
    if (score !== null) hasData = true;
  });

  if (!hasData) {
    canvas.style.display = 'none';
    noDataEl.style.display = 'block';
    noDataEl.innerHTML = '<div class="no-data-icon">&#128200;</div><p>データがありません。</p><p style="font-size:0.8rem; margin-top:6px; color:var(--text-sub,#888);">食事を記録すると健康度グラフが表示されます。</p><a href="meal.html" style="color:var(--green,#7B8B2E);font-size:0.9rem;">食事を記録する &rarr;</a>';
    return;
  }

  // Background color bands plugin (red/yellow/green zones)
  var backgroundBandsPlugin = {
    id: 'healthBands',
    beforeDraw: function(chart) {
      var c = chart.ctx;
      var yAxis = chart.scales.y;
      var chartArea = chart.chartArea;
      var left = chartArea.left;
      var width = chartArea.right - chartArea.left;

      // Red zone (0-60) - needs improvement
      c.fillStyle = 'rgba(244, 67, 54, 0.10)';
      c.fillRect(left, yAxis.getPixelForValue(60), width, yAxis.getPixelForValue(0) - yAxis.getPixelForValue(60));

      // Yellow zone (60-80) - caution
      c.fillStyle = 'rgba(255, 193, 7, 0.10)';
      c.fillRect(left, yAxis.getPixelForValue(80), width, yAxis.getPixelForValue(60) - yAxis.getPixelForValue(80));

      // Green zone (80-100) - good
      c.fillStyle = 'rgba(76, 175, 80, 0.12)';
      c.fillRect(left, yAxis.getPixelForValue(100), width, yAxis.getPixelForValue(80) - yAxis.getPixelForValue(100));

      // Zone boundary lines
      c.setLineDash([4, 4]);
      c.lineWidth = 1;

      c.strokeStyle = 'rgba(76, 175, 80, 0.4)';
      c.beginPath();
      c.moveTo(left, yAxis.getPixelForValue(80));
      c.lineTo(left + width, yAxis.getPixelForValue(80));
      c.stroke();

      c.strokeStyle = 'rgba(255, 152, 0, 0.4)';
      c.beginPath();
      c.moveTo(left, yAxis.getPixelForValue(60));
      c.lineTo(left + width, yAxis.getPixelForValue(60));
      c.stroke();

      c.setLineDash([]);
    }
  };

  window.currentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '健康度',
        data: scores,
        borderColor: '#7B8B2E',
        backgroundColor: 'rgba(123, 139, 46, 0.15)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.3,
        pointRadius: currentPeriod <= 30 ? 5 : 2,
        pointBackgroundColor: scores.map(function(s) {
          if (s === null) return '#ccc';
          if (s >= 80) return '#4CAF50';
          if (s >= 60) return '#FF9800';
          return '#F44336';
        }),
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5,
        spanGaps: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { size: 12 },
          bodyFont: { size: 13 },
          padding: 10,
          callbacks: {
            label: function(context) {
              if (context.raw === null) return 'データなし';
              var level = context.raw >= 80 ? '良好' : context.raw >= 60 ? '注意' : '改善が必要';
              return '健康度: ' + context.raw + '点 (' + level + ')';
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            callback: function(val) { return val; },
            font: { size: 11 }
          },
          grid: { color: 'rgba(0,0,0,0.06)' }
        },
        x: {
          ticks: {
            maxTicksLimit: currentPeriod <= 30 ? 10 : 12,
            maxRotation: 45,
            font: { size: 10 }
          },
          grid: { display: false }
        }
      }
    },
    plugins: [backgroundBandsPlugin]
  });

  // Legend - あすけん style
  legendEl.innerHTML =
    '<span class="graph-legend-item"><span class="legend-swatch" style="background:#4CAF50;"></span> 良好 (80-100点)</span>' +
    '<span class="graph-legend-item"><span class="legend-swatch" style="background:#FFC107;"></span> 注意 (60-80点)</span>' +
    '<span class="graph-legend-item"><span class="legend-swatch" style="background:#F44336;"></span> 改善が必要 (0-60点)</span>';
}

// ============================
// Weight & Body Fat Chart
// ============================

function renderWeightChart(ctx, canvas, noDataEl, legendEl) {
  var days = getDays(currentPeriod);
  var weights = Store.getWeights();
  var goals = Store.getGoals();

  var weightMap = {};
  weights.forEach(function(w) {
    weightMap[w.date] = w;
  });

  var labels = [];
  var weightData = [];
  var bodyFatData = [];
  var hasData = false;

  days.forEach(function(d) {
    labels.push(d.label);
    var entry = weightMap[d.date];
    if (entry) {
      weightData.push(entry.weight);
      bodyFatData.push(entry.bodyFat || null);
      hasData = true;
    } else {
      weightData.push(null);
      bodyFatData.push(null);
    }
  });

  if (!hasData) {
    canvas.style.display = 'none';
    noDataEl.style.display = 'block';
    noDataEl.innerHTML = '<div class="no-data-icon">&#128200;</div><p>データがありません。</p><p style="font-size:0.8rem; margin-top:6px; color:var(--text-sub,#888);">体重を記録するとグラフが表示されます。</p>';
    return;
  }

  // Calculate y-axis range for weight
  var validWeights = weightData.filter(function(w) { return w !== null; });
  var minW = Math.floor(Math.min.apply(null, validWeights) - 3);
  var maxW = Math.ceil(Math.max.apply(null, validWeights) + 3);

  // Include target weight in range if set
  if (goals.targetWeight) {
    minW = Math.min(minW, Math.floor(goals.targetWeight - 2));
    maxW = Math.max(maxW, Math.ceil(goals.targetWeight + 2));
  }

  var datasets = [
    {
      label: '体重の推移',
      data: weightData,
      borderColor: '#7B8B2E',
      backgroundColor: 'rgba(123, 139, 46, 0.08)',
      borderWidth: 2.5,
      fill: false,
      tension: 0.3,
      pointRadius: currentPeriod <= 30 ? 5 : 2,
      pointBackgroundColor: '#7B8B2E',
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      yAxisID: 'y',
      spanGaps: true
    }
  ];

  // Goal weight dashed line
  if (goals.targetWeight) {
    datasets.push({
      label: '目標体重',
      data: labels.map(function() { return goals.targetWeight; }),
      borderColor: '#E91E63',
      borderWidth: 1.5,
      borderDash: [8, 4],
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 0,
      yAxisID: 'y',
      spanGaps: true
    });
  }

  // Body fat line (right Y-axis)
  var hasBodyFat = bodyFatData.some(function(v) { return v !== null; });
  if (hasBodyFat) {
    datasets.push({
      label: '体脂肪率の推移',
      data: bodyFatData,
      borderColor: '#FF9800',
      backgroundColor: 'rgba(255, 152, 0, 0.08)',
      borderWidth: 2,
      fill: false,
      tension: 0.3,
      pointRadius: currentPeriod <= 30 ? 4 : 1.5,
      pointBackgroundColor: '#FF9800',
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      yAxisID: 'y1',
      spanGaps: true
    });
  }

  var scales = {
    y: {
      type: 'linear',
      position: 'left',
      min: minW,
      max: maxW,
      ticks: {
        callback: function(val) { return val; },
        font: { size: 11 }
      },
      grid: { color: 'rgba(0,0,0,0.06)' },
      title: { display: false }
    },
    x: {
      ticks: {
        maxTicksLimit: currentPeriod <= 30 ? 10 : 12,
        maxRotation: 45,
        font: { size: 10 }
      },
      grid: { display: false }
    }
  };

  if (hasBodyFat) {
    scales.y1 = {
      type: 'linear',
      position: 'right',
      min: 0,
      max: 50,
      ticks: {
        callback: function(val) { return val; },
        font: { size: 11 }
      },
      grid: { drawOnChartArea: false }
    };
  }

  window.currentChart = new Chart(ctx, {
    type: 'line',
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 10,
          callbacks: {
            label: function(context) {
              var ds = context.dataset;
              if (ds.label === '体重の推移') return '体重: ' + (context.raw !== null ? context.raw.toFixed(1) + ' kg' : '-');
              if (ds.label === '目標体重') return '目標: ' + context.raw.toFixed(1) + ' kg';
              if (ds.label === '体脂肪率の推移') return '体脂肪率: ' + (context.raw !== null ? context.raw.toFixed(1) + ' %' : '-');
              return '';
            }
          }
        }
      },
      scales: scales
    }
  });

  // Show week period labels for 1-month view
  var weekLabelsEl = document.getElementById('graph-week-labels');
  if (weekLabelsEl && currentPeriod === 30) {
    weekLabelsEl.style.display = 'flex';
    weekLabelsEl.innerHTML = '<span>1st week</span><span>2nd week</span><span>3rd week</span><span>4th week</span>';
  }

  // Legend - あすけん style
  var legendHtml = '<span class="graph-legend-item"><span class="legend-line" style="background:#7B8B2E;"></span> 体重の推移</span>';
  if (goals.targetWeight) {
    legendHtml += '<span class="graph-legend-item"><span class="legend-line dashed" style="border-color:#E91E63;"></span> 目標体重 ' + goals.targetWeight.toFixed(1) + 'kg</span>';
  }
  if (hasBodyFat) {
    legendHtml += '<span class="graph-legend-item"><span class="legend-line" style="background:#FF9800;"></span> 体脂肪率の推移</span>';
  }
  legendEl.innerHTML = legendHtml;
}

// ============================
// Intake Calorie Chart
// ============================

function renderIntakeChart(ctx, canvas, noDataEl, legendEl) {
  var days = getDays(currentPeriod);
  var goals = Store.getGoals();
  var goalCal = goals.cal || 2000;
  var zoneMargin = 200;
  var zoneTop = goalCal + zoneMargin;
  var zoneBottom = Math.max(0, goalCal - zoneMargin);

  var labels = [];
  var calData = [];
  var hasData = false;

  days.forEach(function(d) {
    labels.push(d.label);
    var total = Store.getDayTotal(d.date);
    if (total.cal > 0) {
      calData.push(Math.round(total.cal));
      hasData = true;
    } else {
      calData.push(null);
    }
  });

  if (!hasData) {
    canvas.style.display = 'none';
    noDataEl.style.display = 'block';
    noDataEl.innerHTML = '<div class="no-data-icon">&#128200;</div><p>データがありません。</p><p style="font-size:0.8rem; margin-top:6px; color:var(--text-sub,#888);">食事を記録するとカロリーグラフが表示されます。</p><a href="meal.html" style="color:var(--green,#7B8B2E);font-size:0.9rem;">食事を記録する &rarr;</a>';
    return;
  }

  // Background zone plugin - green ideal zone
  var idealZonePlugin = {
    id: 'idealZone',
    beforeDraw: function(chart) {
      var c = chart.ctx;
      var yAxis = chart.scales.y;
      var chartArea = chart.chartArea;
      var left = chartArea.left;
      var width = chartArea.right - chartArea.left;

      // Light red above zone
      c.fillStyle = 'rgba(244, 67, 54, 0.05)';
      c.fillRect(left, chartArea.top, width, yAxis.getPixelForValue(zoneTop) - chartArea.top);

      // Green ideal zone
      c.fillStyle = 'rgba(76, 175, 80, 0.10)';
      c.fillRect(left, yAxis.getPixelForValue(zoneTop), width, yAxis.getPixelForValue(zoneBottom) - yAxis.getPixelForValue(zoneTop));

      // Light red below zone
      c.fillStyle = 'rgba(244, 67, 54, 0.05)';
      c.fillRect(left, yAxis.getPixelForValue(zoneBottom), width, chartArea.bottom - yAxis.getPixelForValue(zoneBottom));

      // Zone boundary dashed lines
      c.setLineDash([4, 4]);
      c.lineWidth = 1;
      c.strokeStyle = 'rgba(76, 175, 80, 0.5)';

      c.beginPath();
      c.moveTo(left, yAxis.getPixelForValue(zoneTop));
      c.lineTo(left + width, yAxis.getPixelForValue(zoneTop));
      c.stroke();

      c.beginPath();
      c.moveTo(left, yAxis.getPixelForValue(zoneBottom));
      c.lineTo(left + width, yAxis.getPixelForValue(zoneBottom));
      c.stroke();

      c.setLineDash([]);
    }
  };

  // Goal line dataset
  var goalLineData = labels.map(function() { return goalCal; });

  var yMax = Math.max(3600, goalCal + 800);
  // Adjust max if any data exceeds it
  var validCals = calData.filter(function(v) { return v !== null; });
  if (validCals.length > 0) {
    var maxCal = Math.max.apply(null, validCals);
    yMax = Math.max(yMax, Math.ceil((maxCal + 400) / 400) * 400);
  }

  window.currentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: '摂取カロリー',
          data: calData,
          backgroundColor: calData.map(function(v) {
            if (v === null) return 'transparent';
            if (v >= zoneBottom && v <= zoneTop) return 'rgba(123, 139, 46, 0.7)';
            if (Math.abs(v - goalCal) <= 400) return 'rgba(255, 152, 0, 0.7)';
            return 'rgba(244, 67, 54, 0.7)';
          }),
          borderColor: calData.map(function(v) {
            if (v === null) return 'transparent';
            if (v >= zoneBottom && v <= zoneTop) return '#7B8B2E';
            if (Math.abs(v - goalCal) <= 400) return '#FF9800';
            return '#F44336';
          }),
          borderWidth: 1,
          borderRadius: 3,
          barPercentage: currentPeriod <= 30 ? 0.7 : 0.5
        },
        {
          label: '理想カロリー',
          data: goalLineData,
          type: 'line',
          borderColor: '#E91E63',
          borderWidth: 1.5,
          borderDash: [8, 4],
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 10,
          callbacks: {
            label: function(context) {
              if (context.datasetIndex === 0) {
                if (context.raw === null) return 'データなし';
                return '摂取: ' + context.raw.toLocaleString() + ' kcal';
              }
              return '目標: ' + context.raw.toLocaleString() + ' kcal';
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: yMax,
          ticks: {
            stepSize: 400,
            callback: function(val) { return val.toLocaleString(); },
            font: { size: 11 }
          },
          grid: { color: 'rgba(0,0,0,0.06)' }
        },
        x: {
          ticks: {
            maxTicksLimit: currentPeriod <= 30 ? 10 : 12,
            maxRotation: 45,
            font: { size: 10 }
          },
          grid: { display: false }
        }
      }
    },
    plugins: [idealZonePlugin]
  });

  // Legend - あすけん style with calorie values
  legendEl.innerHTML =
    '<span class="graph-legend-item"><span class="legend-line dashed" style="border-color:#E91E63;"></span> 理想カロリー ' + goalCal.toLocaleString() + 'kcal</span>' +
    '<span class="graph-legend-item"><span class="legend-swatch" style="background:#4CAF50;"></span> 適正カロリーゾーン ' + zoneBottom.toLocaleString() + 'kcal~' + zoneTop.toLocaleString() + 'kcal</span>';
}

// ============================
// Burn Calorie Chart
// ============================

function renderBurnChart(ctx, canvas, noDataEl, legendEl) {
  var days = getDays(currentPeriod);
  var labels = [];
  var burnData = [];
  var hasData = false;

  days.forEach(function(d) {
    labels.push(d.label);
    var total = Store.getDayExerciseTotal(d.date);
    if (total > 0) {
      burnData.push(Math.round(total));
      hasData = true;
    } else {
      burnData.push(null);
    }
  });

  if (!hasData) {
    canvas.style.display = 'none';
    noDataEl.style.display = 'block';
    noDataEl.innerHTML = '<div class="no-data-icon">&#128200;</div><p>データがありません。</p><p style="font-size:0.8rem; margin-top:6px; color:var(--text-sub,#888);">運動を記録すると消費カロリーグラフが表示されます。</p>';
    return;
  }

  // Calculate reasonable max
  var validBurns = burnData.filter(function(v) { return v !== null; });
  var maxBurn = Math.max(400, Math.ceil((Math.max.apply(null, validBurns) + 50) / 100) * 100);

  // Ideal burn line
  var idealBurn = 300;

  window.currentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: '消費カロリー',
          data: burnData,
          borderColor: '#FF5722',
          backgroundColor: 'rgba(255, 87, 34, 0.12)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.3,
          pointRadius: currentPeriod <= 30 ? 5 : 2,
          pointBackgroundColor: '#FF5722',
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5,
          spanGaps: true
        },
        {
          label: '理想カロリー',
          data: labels.map(function() { return idealBurn; }),
          borderColor: '#E91E63',
          borderWidth: 1.5,
          borderDash: [8, 4],
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 0,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 10,
          callbacks: {
            label: function(context) {
              if (context.datasetIndex === 0) {
                if (context.raw === null) return 'データなし';
                return '消費: ' + context.raw.toLocaleString() + ' kcal';
              }
              return '目標: ' + context.raw.toLocaleString() + ' kcal';
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: maxBurn,
          ticks: {
            stepSize: maxBurn <= 400 ? 50 : 100,
            callback: function(val) { return val.toLocaleString(); },
            font: { size: 11 }
          },
          grid: { color: 'rgba(0,0,0,0.06)' }
        },
        x: {
          ticks: {
            maxTicksLimit: currentPeriod <= 30 ? 10 : 12,
            maxRotation: 45,
            font: { size: 10 }
          },
          grid: { display: false }
        }
      }
    }
  });

  // Legend
  legendEl.innerHTML =
    '<span class="graph-legend-item"><span class="legend-line" style="background:#FF5722;"></span> 消費カロリー</span>' +
    '<span class="graph-legend-item"><span class="legend-line dashed" style="border-color:#E91E63;"></span> 理想カロリー ' + idealBurn.toLocaleString() + 'kcal</span>';
}

// ============================
// Monthly Calendar Table (あすけん style)
// ============================

function renderMonthlyTable() {
  var tbody = document.getElementById('monthly-table-body');
  var titleEl = document.getElementById('calendar-month-title');
  if (!tbody || !titleEl) return;

  var year = calendarMonth.getFullYear();
  var month = calendarMonth.getMonth();
  var today = new Date().toISOString().split('T')[0];

  titleEl.textContent = year + '年' + (month + 1) + '月';

  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var weights = Store.getWeights();
  var weightMap = {};
  weights.forEach(function(w) { weightMap[w.date] = w; });

  var html = '';
  for (var i = 1; i <= daysInMonth; i++) {
    var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(i).padStart(2, '0');
    var isToday = dateStr === today;
    var isFuture = dateStr > today;
    var weightEntry = weightMap[dateStr];
    var meals = Store.getMeals(dateStr);
    var healthScore = meals.length > 0 ? calculateHealthScore(dateStr) : null;

    var scoreClass = '';
    var scoreText = '-';
    if (healthScore !== null) {
      if (healthScore >= 80) scoreClass = 'score-good';
      else if (healthScore >= 60) scoreClass = 'score-warn';
      else scoreClass = 'score-bad';
      scoreText = healthScore + '点';
    }

    // Diary column: show link or 新規作成/未記入
    var diaryHtml;
    if (meals.length > 0) {
      diaryHtml = '<a class="diary-link" onclick="goToDate(\'' + dateStr + '\')">記入済み</a>';
    } else if (isFuture) {
      diaryHtml = '<span class="diary-new">-</span>';
    } else {
      diaryHtml = '<a class="diary-link" onclick="goToDate(\'' + dateStr + '\')" style="color:var(--text-light);">未記入</a>';
    }

    html += '<tr class="' + (isToday ? 'today-row' : '') + '">';
    html += '<td class="date-cell"><a class="date-link" onclick="goToDate(\'' + dateStr + '\')">' + (month + 1) + '/' + i + '</a></td>';
    html += '<td>' + (weightEntry ? weightEntry.weight.toFixed(1) : '-') + '</td>';
    html += '<td class="' + scoreClass + '">' + scoreText + '</td>';
    html += '<td>' + diaryHtml + '</td>';
    html += '</tr>';
  }

  tbody.innerHTML = html;
}

function changeCalendarMonth(delta) {
  calendarMonth.setMonth(calendarMonth.getMonth() + delta);
  renderMonthlyTable();
}

function goToDate(dateStr) {
  window.location.href = 'dashboard.html?date=' + dateStr;
}

// ============================
// Utility
// ============================

function getDays(period) {
  var result = [];
  for (var i = period - 1; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var dateStr = d.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      label: (d.getMonth() + 1) + '/' + d.getDate()
    });
  }
  return result;
}

// ============================
// Logout handler
// ============================

function handleLogout() {
  Auth.logout();
}

// ============================
// Chart Accessibility Summary
// ============================

function updateChartSummary(tab) {
  var summary = document.getElementById('chart-summary');
  if (!summary) return;

  var days = getDays(currentPeriod);

  switch(tab) {
    case 'health':
      var healthScores = [];
      days.forEach(function(d) {
        var score = calculateHealthScore(d.date);
        if (score !== null) healthScores.push(score);
      });
      if (healthScores.length > 0) {
        var avg = healthScores.reduce(function(a, b) { return a + b; }, 0) / healthScores.length;
        summary.textContent = '期間中の平均健康度: ' + Math.round(avg) + '点 (' + healthScores.length + '日分のデータ)';
      } else {
        summary.textContent = '';
      }
      break;
    case 'weight':
      var allWeights = Store.getWeights();
      var periodWeights = [];
      days.forEach(function(d) {
        var w = allWeights.find(function(w) { return w.date === d.date; });
        if (w) periodWeights.push(w.weight);
      });
      if (periodWeights.length > 0) {
        var first = periodWeights[0];
        var last = periodWeights[periodWeights.length - 1];
        var diff = last - first;
        summary.textContent = '期間中の体重変動: ' + first.toFixed(1) + 'kg → ' + last.toFixed(1) + 'kg (' + (diff >= 0 ? '+' : '') + diff.toFixed(1) + 'kg)';
      } else {
        summary.textContent = '';
      }
      break;
    case 'intake':
      var calArr = [];
      days.forEach(function(d) {
        var total = Store.getDayTotal(d.date);
        if (total.cal > 0) calArr.push(total.cal);
      });
      if (calArr.length > 0) {
        var avgCal = calArr.reduce(function(a, b) { return a + b; }, 0) / calArr.length;
        summary.textContent = '期間中の平均摂取カロリー: ' + Math.round(avgCal) + 'kcal (' + calArr.length + '日分のデータ)';
      } else {
        summary.textContent = '';
      }
      break;
    case 'burn':
      var burnArr = [];
      days.forEach(function(d) {
        var total = Store.getDayExerciseTotal(d.date);
        if (total > 0) burnArr.push(total);
      });
      if (burnArr.length > 0) {
        var avgBurn = burnArr.reduce(function(a, b) { return a + b; }, 0) / burnArr.length;
        summary.textContent = '期間中の平均消費カロリー: ' + Math.round(avgBurn) + 'kcal (' + burnArr.length + '日分のデータ)';
      } else {
        summary.textContent = '';
      }
      break;
    default:
      summary.textContent = '';
  }
  summary.setAttribute('aria-live', 'polite');
}

// ============================
// Toast notification
// ============================

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
