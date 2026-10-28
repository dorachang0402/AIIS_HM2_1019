/**
 * Kaggle Bike Sharing Demand - CRISP-DM Interactive Application
 * Built with Vanilla JavaScript and Chart.js
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initTheme();
  initDataTable();
  initFeatureImportances();
  initCharts();
  initSimulator();
});

/* ==========================================================================
   1. Navigation & Tab Switching
   ========================================================================== */
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.crisp-section');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');

      // Update Nav active states
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update Sections visibility
      sections.forEach(sec => {
        if (sec.id === targetId) {
          sec.classList.add('active-section');
          // Re-trigger chart resize on newly visible section
          window.dispatchEvent(new Event('resize'));
        } else {
          sec.classList.remove('active-section');
        }
      });

      // Smooth scroll to top of section
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ==========================================================================
   2. Theme Switcher (Dark / Light)
   ========================================================================== */
let charts = {};

function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const htmlEl = document.documentElement;

  // Retrieve saved theme or default to dark
  const savedTheme = localStorage.getItem('bike_theme') || 'dark';
  htmlEl.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = htmlEl.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', newTheme);
    localStorage.setItem('bike_theme', newTheme);
    updateChartsTheme(newTheme);
  });
}

function updateChartsTheme(theme) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  Object.values(charts).forEach(chart => {
    if (!chart || !chart.options) return;
    if (chart.options.scales) {
      if (chart.options.scales.x) {
        chart.options.scales.x.ticks.color = textColor;
        chart.options.scales.x.grid.color = gridColor;
      }
      if (chart.options.scales.y) {
        chart.options.scales.y.ticks.color = textColor;
        chart.options.scales.y.grid.color = gridColor;
      }
      if (chart.options.scales.y1) {
        chart.options.scales.y1.ticks.color = textColor;
      }
    }
    if (chart.options.plugins && chart.options.plugins.legend) {
      chart.options.plugins.legend.labels.color = textColor;
    }
    chart.update();
  });
}

/* ==========================================================================
   3. Raw Data Table Viewer & Filtering
   ========================================================================== */
function initDataTable() {
  const tableBody = document.getElementById('tableBody');
  const searchInput = document.getElementById('tableFilterInput');
  const data = window.BIKE_DATA ? window.BIKE_DATA.table_samples : [];

  if (!tableBody || !data.length) return;

  function renderRows(items) {
    tableBody.innerHTML = items.map(r => `
      <tr>
        <td><code>${r.datetime}</code></td>
        <td>${r.season}</td>
        <td>${r.holiday ? '<span class="tag-pill orange">假日</span>' : '0'}</td>
        <td>${r.workingday ? '<span class="tag-pill blue">工作日</span>' : '0'}</td>
        <td>${r.weather}</td>
        <td><strong>${r.temp.toFixed(1)}</strong></td>
        <td>${r.humidity}</td>
        <td>${r.windspeed.toFixed(1)}</td>
        <td>${r.casual}</td>
        <td>${r.registered}</td>
        <td><strong style="color: var(--accent-cyan);">${r.count}</strong></td>
      </tr>
    `).join('');
  }

  renderRows(data);

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      renderRows(data);
      return;
    }
    const filtered = data.filter(r => 
      r.datetime.toLowerCase().includes(query) ||
      String(r.temp).includes(query) ||
      String(r.count).includes(query) ||
      String(r.weather).includes(query)
    );
    renderRows(filtered);
  });
}

/* ==========================================================================
   4. Feature Importance Bars (Phase 5)
   ========================================================================== */
function initFeatureImportances() {
  const container = document.getElementById('featureImportanceBars');
  if (!container) return;

  const importances = [
    { name: '時間 (hour)', percent: 58.4, color: '#4f46e5' },
    { name: '氣溫 (temp)', percent: 14.8, color: '#06b6d4' },
    { name: '年份 (year)', percent: 9.2, color: '#10b981' },
    { name: '工作日屬性 (workingday)', percent: 6.5, color: '#8b5cf6' },
    { name: '相對濕度 (humidity)', percent: 5.1, color: '#f59e0b' },
    { name: '月份 (month)', percent: 3.6, color: '#ec4899' },
    { name: '天候狀況 (weather)', percent: 1.4, color: '#64748b' },
    { name: '風速 (windspeed)', percent: 1.0, color: '#94a3b8' }
  ];

  container.innerHTML = importances.map(item => `
    <div class="feat-bar-row">
      <div class="feat-bar-label">
        <span><strong>${item.name}</strong></span>
        <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700;">${item.percent.toFixed(1)}%</span>
      </div>
      <div class="feat-track">
        <div class="feat-fill" style="width: ${item.percent}%; background: ${item.color};"></div>
      </div>
    </div>
  `).join('');
}

/* ==========================================================================
   5. Interactive Charts (Chart.js)
   ========================================================================== */
function initCharts() {
  if (typeof Chart === 'undefined' || !window.BIKE_DATA) return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

  // Chart 1: Hourly Demand Distribution (Workday vs Non-workday)
  const ctxHourly = document.getElementById('chartHourly');
  if (ctxHourly) {
    charts.hourly = new Chart(ctxHourly, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [
          {
            label: '工作日 (Working Day - 雙尖峰)',
            data: window.BIKE_DATA.charts.hourly_work,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.8,
            pointRadius: 3,
            pointHoverRadius: 6
          },
          {
            label: '週末/假日 (Weekend / Holiday - 單午後峰)',
            data: window.BIKE_DATA.charts.hourly_nonwork,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.35,
            borderWidth: 2.8,
            pointRadius: 3,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: textColor, font: { family: 'Plus Jakarta Sans', weight: '600' } } },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (c) => ` ${c.dataset.label.split(' (')[0]}: ${c.raw} 輛/hr`
            }
          }
        },
        scales: {
          x: { ticks: { color: textColor }, grid: { color: gridColor } },
          y: { ticks: { color: textColor }, grid: { color: gridColor }, title: { display: true, text: '平均每小時租借量 (輛)', color: textColor } }
        }
      }
    });
  }

  // Chart 2: Casual vs Registered Breakdown
  const ctxUserTypes = document.getElementById('chartUserTypes');
  if (ctxUserTypes) {
    charts.userTypes = new Chart(ctxUserTypes, {
      type: 'bar',
      data: {
        labels: hours,
        datasets: [
          {
            label: '註冊會員 (Registered - 通勤尖峰主體)',
            data: window.BIKE_DATA.charts.hourly_registered,
            backgroundColor: '#6366f1',
            borderRadius: 4
          },
          {
            label: '休閒散客 (Casual - 午後漫遊)',
            data: window.BIKE_DATA.charts.hourly_casual,
            backgroundColor: '#06b6d4',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, ticks: { color: textColor }, grid: { color: gridColor } },
          y: { stacked: true, ticks: { color: textColor }, grid: { color: gridColor }, title: { display: true, text: '出借數量 (輛)', color: textColor } }
        },
        plugins: {
          legend: { position: 'top', labels: { color: textColor, font: { weight: '600' } } }
        }
      }
    });
  }

  // Chart 3: Weather Impact
  const ctxWeather = document.getElementById('chartWeather');
  if (ctxWeather) {
    charts.weather = new Chart(ctxWeather, {
      type: 'bar',
      data: {
        labels: window.BIKE_DATA.charts.weather_labels,
        datasets: [{
          label: '平均小時租借量 (輛)',
          data: window.BIKE_DATA.charts.weather_avg.map(v => Math.round(v)),
          backgroundColor: ['#10b981', '#06b6d4', '#f59e0b', '#f43f5e'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { color: textColor }, grid: { color: 'transparent' } },
          y: { ticks: { color: textColor }, grid: { color: gridColor } }
        }
      }
    });
  }

  // Chart 4: Monthly Trend
  const ctxMonthly = document.getElementById('chartMonthly');
  if (ctxMonthly) {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    charts.monthly = new Chart(ctxMonthly, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: '月均出借量 (輛/hr)',
          data: window.BIKE_DATA.charts.monthly_avg,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointRadius: 5,
          pointBackgroundColor: '#f59e0b'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: textColor }, grid: { color: gridColor } },
          y: { ticks: { color: textColor }, grid: { color: gridColor } }
        }
      }
    });
  }

  // Chart 5: Feature Selection Progression (Dual Axis)
  const ctxFeat = document.getElementById('chartFeatureProgression');
  if (ctxFeat) {
    const fsData = window.BIKE_DATA.charts.feature_selection;
    charts.featureProgression = new Chart(ctxFeat, {
      type: 'line',
      data: {
        labels: fsData.map(d => `k=${d.k} (${d.features.split(', ').pop()})`),
        datasets: [
          {
            label: 'RMSE 均方根誤差 (越低越好)',
            data: fsData.map(d => d.rmse),
            borderColor: '#4f46e5',
            backgroundColor: '#4f46e5',
            yAxisID: 'y',
            tension: 0.25,
            borderWidth: 2.5,
            pointRadius: fsData.map(d => d.k === 7 ? 8 : 4),
            pointBackgroundColor: fsData.map(d => d.k === 7 ? '#f43f5e' : '#4f46e5')
          },
          {
            label: 'R² 判定係數 (越高越好)',
            data: fsData.map(d => d.r2),
            borderColor: '#10b981',
            backgroundColor: '#10b981',
            yAxisID: 'y1',
            tension: 0.25,
            borderWidth: 2.5,
            pointRadius: fsData.map(d => d.k === 7 ? 8 : 4),
            pointBackgroundColor: fsData.map(d => d.k === 7 ? '#10b981' : '#10b981')
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } },
          y: {
            position: 'left',
            ticks: { color: '#4f46e5' },
            grid: { color: gridColor },
            title: { display: true, text: 'RMSE (輛)', color: '#4f46e5' }
          },
          y1: {
            position: 'right',
            ticks: { color: '#10b981' },
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'R-squared (R²)', color: '#10b981' }
          }
        },
        plugins: {
          legend: { labels: { color: textColor } }
        }
      }
    });
  }

  // Chart 6: Actual vs Predicted Scatter
  const ctxActualVsPred = document.getElementById('chartActualVsPred');
  if (ctxActualVsPred) {
    const actuals = window.BIKE_DATA.charts.scatter_actual;
    const rfPreds = window.BIKE_DATA.charts.scatter_rf_pred;
    const points = actuals.map((act, i) => ({ x: act, y: rfPreds[i] }));
    const maxVal = Math.max(...actuals);

    charts.actualVsPred = new Chart(ctxActualVsPred, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: '測試集實測樣本 (RF 預測值 vs 實際值)',
            data: points,
            backgroundColor: 'rgba(99, 102, 241, 0.65)',
            pointRadius: 4.5
          },
          {
            label: '完美吻合對角線 (y = x)',
            data: [{ x: 0, y: 0 }, { x: maxVal, y: maxVal }],
            type: 'line',
            borderColor: '#ef4444',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: textColor }, grid: { color: gridColor }, title: { display: true, text: '實際出借量 Actual Count', color: textColor } },
          y: { ticks: { color: textColor }, grid: { color: gridColor }, title: { display: true, text: '模型預測值 Predicted Count', color: textColor } }
        },
        plugins: { legend: { labels: { color: textColor } } }
      }
    });
  }

  // Chart 7: Residuals Plot
  const ctxResiduals = document.getElementById('chartResiduals');
  if (ctxResiduals) {
    const rfPreds = window.BIKE_DATA.charts.scatter_rf_pred;
    const residuals = window.BIKE_DATA.charts.scatter_residuals;
    const resPoints = rfPreds.map((pred, i) => ({ x: pred, y: residuals[i] }));

    charts.residuals = new Chart(ctxResiduals, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: '殘差分佈 (Actual - Predicted)',
            data: resPoints,
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            pointRadius: 4.5
          },
          {
            label: '零殘差基準線 (e = 0)',
            data: [{ x: 0, y: 0 }, { x: 800, y: 0 }],
            type: 'line',
            borderColor: '#ef4444',
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: textColor }, grid: { color: gridColor }, title: { display: true, text: '預測值 (Predicted)', color: textColor } },
          y: { ticks: { color: textColor }, grid: { color: gridColor }, title: { display: true, text: '殘差 Residuals (輛)', color: textColor } }
        },
        plugins: { legend: { labels: { color: textColor } } }
      }
    });
  }
}

/* ==========================================================================
   6. Deployment Simulator & Real-Time Prediction Engine
   ========================================================================== */
function initSimulator() {
  calculatePrediction();
}

function updateControlDisplay(type, val) {
  const el = document.getElementById(`val${type}`);
  if (!el) return;
  if (type === 'Hour') {
    el.innerText = `${String(val).padStart(2, '0')}:00`;
  } else {
    el.innerText = val;
  }
}

function calculatePrediction() {
  const hour = parseInt(document.getElementById('inputHour').value, 10);
  const temp = parseFloat(document.getElementById('inputTemp').value);
  const humidity = parseFloat(document.getElementById('inputHumidity').value);
  const windspeed = parseFloat(document.getElementById('inputWindspeed').value);
  const month = parseInt(document.getElementById('inputMonth').value, 10);
  const weather = parseInt(document.getElementById('inputWeather').value, 10);
  const workingday = parseInt(document.getElementById('inputWorkingDay').value, 10);
  const year = parseInt(document.getElementById('inputYear').value, 10);

  const modelType = document.querySelector('input[name="simModel"]:checked').value;

  let totalPred = 0;

  if (modelType === 'lr' && window.BIKE_DATA && window.BIKE_DATA.lr_model) {
    // Linear Regression Equation
    const m = window.BIKE_DATA.lr_model;
    const c = m.coefficients;
    totalPred = m.intercept + 
      (c.hour * hour) +
      (c.temp * temp) +
      (c.humidity * humidity) +
      (c.year * year) +
      (c.month * month) +
      (c.weather * weather) +
      (c.windspeed * windspeed) +
      (c.workingday * workingday);
    totalPred = Math.max(0, Math.round(totalPred));
  } else {
    // Non-linear Ensemble Simulation (capturing rush hour commute & weather interactions)
    // Baseline hour curve:
    let hourFactor = 0;
    if (workingday === 1) {
      // Dual commute peak
      if (hour === 8) hourFactor = 4.8;
      else if (hour === 7) hourFactor = 2.8;
      else if (hour === 9) hourFactor = 2.6;
      else if (hour === 17) hourFactor = 5.2;
      else if (hour === 18) hourFactor = 5.6;
      else if (hour === 19) hourFactor = 3.6;
      else if (hour >= 11 && hour <= 15) hourFactor = 2.4;
      else if (hour >= 0 && hour <= 5) hourFactor = 0.15;
      else hourFactor = 1.6;
    } else {
      // Weekend afternoon peak
      if (hour >= 12 && hour <= 16) hourFactor = 4.2;
      else if (hour >= 10 && hour <= 18) hourFactor = 3.2;
      else if (hour >= 0 && hour <= 6) hourFactor = 0.2;
      else hourFactor = 1.4;
    }

    // Temperature effect (optimal around 25-30°C)
    let tempEffect = Math.max(0.2, 1.0 + (temp - 15) * 0.04);
    if (temp < 8) tempEffect *= 0.5;

    // Humidity penalty
    let humidityEffect = 1.0 - (humidity - 40) * 0.007;
    humidityEffect = Math.max(0.3, Math.min(1.2, humidityEffect));

    // Weather impact
    let weatherMultiplier = 1.0;
    if (weather === 2) weatherMultiplier = 0.88;
    else if (weather === 3) weatherMultiplier = 0.45;
    else if (weather === 4) weatherMultiplier = 0.10;

    // Month / Season effect
    let monthMultiplier = [0.65, 0.7, 0.85, 1.05, 1.2, 1.25, 1.25, 1.2, 1.15, 1.1, 0.9, 0.75][month - 1];

    // Year growth
    let yearMultiplier = year === 2012 ? 1.35 : 1.0;

    // Base scale
    totalPred = Math.round(95 * hourFactor * tempEffect * humidityEffect * weatherMultiplier * monthMultiplier * yearMultiplier);
    totalPred = Math.max(0, Math.min(1100, totalPred));
  }

  // Calculate Casual vs Registered Split
  let casualRatio = 0.18;
  if (workingday === 0) {
    casualRatio = 0.42; // Weekend has more casual riders
    if (hour >= 12 && hour <= 16) casualRatio = 0.52;
  } else {
    if (hour === 8 || hour === 17 || hour === 18) casualRatio = 0.10; // Commuter peaks are registered
  }
  if (weather >= 3) casualRatio *= 0.5; // Casual riders cancel trips when raining

  const casualPred = Math.round(totalPred * casualRatio);
  const registeredPred = Math.max(0, totalPred - casualPred);

  // Update DOM elements
  animateCounter('predTotalCount', totalPred);

  document.getElementById('predRegisteredCount').innerText = `${registeredPred} 輛 (${totalPred > 0 ? ((registeredPred / totalPred) * 100).toFixed(1) : 0}%)`;
  document.getElementById('predCasualCount').innerText = `${casualPred} 輛 (${totalPred > 0 ? ((casualPred / totalPred) * 100).toFixed(1) : 0}%)`;

  const regPct = totalPred > 0 ? (registeredPred / totalPred) * 100 : 50;
  const casPct = totalPred > 0 ? (casualPred / totalPred) * 100 : 50;
  document.getElementById('regBarFill').style.width = `${regPct}%`;
  document.getElementById('casBarFill').style.width = `${casPct}%`;

  // Update Gauge
  const gaugePercent = Math.min(100, (totalPred / 800) * 100);
  document.getElementById('gaugeFill').style.width = `${gaugePercent}%`;

  // Update Demand Level & Operations Card
  updateOperationalInsights(totalPred, hour, workingday, weather, temp);
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const current = parseInt(el.innerText, 10) || 0;
  const step = Math.ceil((target - current) / 6);
  if (Math.abs(target - current) <= 2) {
    el.innerText = target;
  } else {
    el.innerText = current + step;
    requestAnimationFrame(() => animateCounter(id, target));
  }
}

function updateOperationalInsights(count, hour, workingday, weather, temp) {
  const pill = document.getElementById('demandLevelPill');
  const card = document.getElementById('dispatchCard');
  const title = document.getElementById('actionCardTitle');
  const desc = document.getElementById('actionCardDesc');

  if (weather === 4 || (weather === 3 && temp < 5)) {
    pill.innerText = '天候危險警戒';
    pill.style.background = 'rgba(239, 68, 68, 0.2)';
    pill.style.color = '#ef4444';
    card.style.background = 'rgba(239, 68, 68, 0.12)';
    card.style.borderColor = '#ef4444';
    title.innerText = '⚠️ 惡劣天候緊急處置：暫緩調度與發布安全警訊';
    desc.innerText = '當前氣候條件為暴風雨/降雪，路面溼滑事故風險大增。建議 App 發送低速騎乘提醒，暫停非必要補車派遣，並調派工程人員至地下車庫進行預防性檢修。';
  } else if (count >= 500) {
    pill.innerText = '🔥 超高尖峰警戒';
    pill.style.background = 'rgba(244, 63, 94, 0.2)';
    pill.style.color = '#f43f5e';
    card.style.background = 'rgba(244, 63, 94, 0.08)';
    card.style.borderColor = 'rgba(244, 63, 94, 0.35)';
    title.innerText = '🚨 調度中心一級動員：防範核心商辦與捷運站空樁';
    desc.innerText = `預估單時需求達 ${count} 輛！主力集中於註冊會員通勤。即刻通知卡車隊進駐「捷運站出口」、「科學園區/商辦樞紐」，並啟動自發調度點數加倍優惠，引導騎士還車至外圍熱門借車區。`;
  } else if (count >= 250) {
    pill.innerText = '⚡ 熱絡活躍時段';
    pill.style.background = 'rgba(245, 158, 11, 0.2)';
    pill.style.color = '#f59e0b';
    card.style.background = 'rgba(245, 158, 11, 0.08)';
    card.style.borderColor = 'rgba(245, 158, 11, 0.35)';
    title.innerText = '🚛 常規巡檢與動態平衡';
    desc.innerText = `出借需求為 ${count} 輛，全城流動穩定。維持正常巡迴調度，重點檢查假日景點周邊或下班主要分流走廊之樁位充足度。`;
  } else {
    pill.innerText = '🌿 離峰平穩期';
    pill.style.background = 'rgba(16, 185, 129, 0.2)';
    pill.style.color = '#10b981';
    card.style.background = 'rgba(16, 185, 129, 0.08)';
    card.style.borderColor = 'rgba(16, 185, 129, 0.35)';
    title.innerText = '🛠️ 離峰維護與折價促進';
    desc.innerText = `當前預估需求僅 ${count} 輛，車流處於離峰低谷。是排定故障車輛運回保養廠檢修的最佳窗口，亦可於 App 推出「離峰騎乘 5 折」活化閒置車輛資產。`;
  }
}

/* Preset Scenarios */
window.loadScenario = function(type) {
  if (type === 'morningRush') {
    document.getElementById('inputHour').value = 8;
    document.getElementById('inputTemp').value = 22;
    document.getElementById('inputHumidity').value = 55;
    document.getElementById('inputWindspeed').value = 10;
    document.getElementById('inputMonth').value = 6;
    document.getElementById('inputWeather').value = 1;
    document.getElementById('inputWorkingDay').value = 1;
    document.getElementById('inputYear').value = 2012;
  } else if (type === 'eveningRush') {
    document.getElementById('inputHour').value = 18;
    document.getElementById('inputTemp').value = 26;
    document.getElementById('inputHumidity').value = 50;
    document.getElementById('inputWindspeed').value = 12;
    document.getElementById('inputMonth').value = 7;
    document.getElementById('inputWeather').value = 1;
    document.getElementById('inputWorkingDay').value = 1;
    document.getElementById('inputYear').value = 2012;
  } else if (type === 'weekendSun') {
    document.getElementById('inputHour').value = 14;
    document.getElementById('inputTemp').value = 28;
    document.getElementById('inputHumidity').value = 45;
    document.getElementById('inputWindspeed').value = 8;
    document.getElementById('inputMonth').value = 5;
    document.getElementById('inputWeather').value = 1;
    document.getElementById('inputWorkingDay').value = 0;
    document.getElementById('inputYear').value = 2012;
  } else if (type === 'winterRain') {
    document.getElementById('inputHour').value = 3;
    document.getElementById('inputTemp').value = 4;
    document.getElementById('inputHumidity').value = 92;
    document.getElementById('inputWindspeed').value = 20;
    document.getElementById('inputMonth').value = 1;
    document.getElementById('inputWeather').value = 3;
    document.getElementById('inputWorkingDay').value = 1;
    document.getElementById('inputYear').value = 2011;
  }

  // Update slider label texts
  updateControlDisplay('Hour', document.getElementById('inputHour').value);
  updateControlDisplay('Temp', document.getElementById('inputTemp').value + ' °C');
  updateControlDisplay('Humidity', document.getElementById('inputHumidity').value + ' %');
  updateControlDisplay('Windspeed', document.getElementById('inputWindspeed').value + ' km/h');

  calculatePrediction();
};

/* Export Simulation Report */
window.exportSimulationReport = function() {
  const report = {
    timestamp: new Date().toISOString(),
    system: 'BikeFlow AI - Kaggle Bike Sharing Demand Dispatch Simulator',
    inputs: {
      hour: document.getElementById('inputHour').value + ':00',
      temperature: document.getElementById('valTemp').innerText,
      humidity: document.getElementById('valHumidity').innerText,
      windspeed: document.getElementById('valWindspeed').innerText,
      month: document.getElementById('inputMonth').selectedOptions[0].text,
      weather: document.getElementById('inputWeather').selectedOptions[0].text,
      workingday: document.getElementById('inputWorkingDay').selectedOptions[0].text,
      year: document.getElementById('inputYear').value
    },
    prediction: {
      total_count: document.getElementById('predTotalCount').innerText + ' 輛/hr',
      registered: document.getElementById('predRegisteredCount').innerText,
      casual: document.getElementById('predCasualCount').innerText,
      level: document.getElementById('demandLevelPill').innerText
    },
    dispatch_instruction: {
      title: document.getElementById('actionCardTitle').innerText,
      details: document.getElementById('actionCardDesc').innerText
    }
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bike_Dispatch_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
