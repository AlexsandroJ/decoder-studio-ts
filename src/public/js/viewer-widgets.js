/**
 * Renderização dos widgets
 */

function renderWidgets() {
  const grid = document.getElementById('viewerGrid');
  const empty = document.getElementById('emptyViewer');
  const countEl = document.getElementById('widgetCount');
  
  countEl.textContent = viewerState.widgets.length;
  
  if (!viewerState.widgets.length) {
    grid.innerHTML = '';
    grid.appendChild(createEmptyViewer());
    return;
  }
  
  grid.innerHTML = viewerState.widgets.map(w => renderWidget(w)).join('');
}

function createEmptyViewer() {
  const div = document.createElement('div');
  div.className = 'empty-viewer';
  div.id = 'emptyViewer';
  div.innerHTML = `
    <div class="empty-icon">📊</div>
    <h3>Nenhum widget configurado</h3>
    <p>Clique em <strong>⚙️ Configurar</strong> para adicionar sinais e sensores</p>
  `;
  return div;
}

function renderWidget(w) {
  const displayName = w.customLabel || w.name;
  const sourceBadge = `<span class="widget-source ${w.source}">${w.source === 'can' ? 'CAN' : 'Sensor'}</span>`;
  
  let bodyHtml = '';
  switch (w.displayType) {
    case 'gauge':
      bodyHtml = renderGaugeBody(w);
      break;
    case 'bar':
      bodyHtml = renderBarBody(w);
      break;
    case 'sparkline':
      bodyHtml = renderSparklineBody(w);
      break;
    case 'led':
      bodyHtml = renderLedBody(w);
      break;
    default:
      bodyHtml = renderNumberBody(w);
  }
  
  return `
    <div class="widget widget-${w.displayType} state-normal" id="widget-${w.id}" data-widget-id="${w.id}">
      <div class="widget-header">
        <div style="display:flex; align-items:center; flex:1; min-width:0;">
          <span class="widget-title" title="${displayName}">${displayName}</span>
          ${sourceBadge}
        </div>
        <div class="widget-actions">
          <button onclick="openEditWidget('${w.id}')" title="Editar">⚙️</button>
        </div>
      </div>
      <div class="widget-body">
        ${bodyHtml}
      </div>
      <div class="widget-meta" id="meta-${w.id}">Aguardando dados...</div>
    </div>
  `;
}

function renderNumberBody(w) {
  return `
    <div class="widget-value" id="val-${w.id}">—</div>
    <div class="widget-unit">${w.unit || ''}</div>
  `;
}

function renderGaugeBody(w) {
  return `
    <div class="widget-value" id="val-${w.id}" style="font-size:24px;">—</div>
    <div class="widget-unit">${w.unit || ''}</div>
    <div class="gauge-container" style="width:100%; margin-top:12px;">
      <div class="gauge-bar">
        <div class="gauge-fill" id="gauge-${w.id}" style="width:0%"></div>
      </div>
      <div class="gauge-labels">
        <span>${w.minValue}</span>
        <span>${w.maxValue}</span>
      </div>
    </div>
  `;
}

function renderBarBody(w) {
  const history = viewerState.valueHistory[w.id] || [];
  const segments = history.length ? history.map(v => {
    const pct = Math.max(0, Math.min(100, ((v - w.minValue) / (w.maxValue - w.minValue)) * 100));
    return `<div class="bar-segment" style="height:${pct}%"></div>`;
  }).join('') : '<div style="color:var(--text-dim); font-size:11px; text-align:center; width:100%;">Aguardando dados...</div>';
  
  return `
    <div class="widget-value" id="val-${w.id}" style="font-size:20px;">—</div>
    <div class="bar-container">${segments}</div>
  `;
}

function renderSparklineBody(w) {
  return `
    <div class="widget-value" id="val-${w.id}" style="font-size:20px;">—</div>
    <canvas id="spark-${w.id}" width="200" height="60"></canvas>
  `;
}

function renderLedBody(w) {
  return `
    <div class="led-indicator" id="led-${w.id}">●</div>
    <div class="widget-value" id="val-${w.id}" style="font-size:18px; margin-top:8px;">—</div>
  `;
}

// ════════════════════════════════════════════════════════
//  ATUALIZAR WIDGET COM DADO REAL
// ════════════════════════════════════════════════════════
function updateWidget(widgetId, value) {
  const w = viewerState.widgets.find(x => x.id === widgetId);
  if (!w) return;
  
  const el = document.getElementById('widget-' + widgetId);
  if (!el) return;
  
  // Atualiza histórico
  if (!viewerState.valueHistory[widgetId]) viewerState.valueHistory[widgetId] = [];
  viewerState.valueHistory[widgetId].push(value);
  if (viewerState.valueHistory[widgetId].length > viewerState.MAX_HISTORY) {
    viewerState.valueHistory[widgetId].shift();
  }
  
  const formatted = value.toFixed(w.decimals);
  const valEl = document.getElementById('val-' + widgetId);
  if (valEl) valEl.textContent = formatted;
  
  // Determina estado baseado em limites
  let state = 'normal';
  if (value >= w.dangerThreshold) state = 'danger';
  else if (value >= w.warningThreshold) state = 'warning';
  else if (value < w.minValue) state = 'warning';
  else state = 'good';
  
  el.className = el.className.replace(/state-\w+/g, '') + ' state-' + state;
  
  // Cor personalizada
  if (w.color !== 'auto') {
    if (valEl) valEl.style.color = w.color;
  }
  
  // Atualiza tipo específico
  switch (w.displayType) {
    case 'gauge':
      updateGauge(widgetId, value, w);
      break;
    case 'bar':
      renderWidgets(); // Re-renderiza para mostrar barras
      break;
    case 'sparkline':
      drawSparkline(widgetId, w);
      break;
    case 'led':
      updateLed(widgetId, value, w, state);
      break;
  }
  
  // Meta info
  const metaEl = document.getElementById('meta-' + widgetId);
  if (metaEl) {
    const time = new Date().toLocaleTimeString('pt-BR');
    metaEl.textContent = `${time} • min: ${w.minValue} • max: ${w.maxValue}`;
  }
}

function updateGauge(widgetId, value, w) {
  const fill = document.getElementById('gauge-' + widgetId);
  if (!fill) return;
  const pct = Math.max(0, Math.min(100, ((value - w.minValue) / (w.maxValue - w.minValue)) * 100));
  fill.style.width = pct + '%';
}

function updateLed(widgetId, value, w, state) {
  const led = document.getElementById('led-' + widgetId);
  if (!led) return;
  led.className = 'led-indicator';
  if (state === 'danger') led.classList.add('danger');
  else if (state === 'warning') led.classList.add('warning');
  else if (state === 'good') led.classList.add('active');
}

function drawSparkline(widgetId, w) {
  const canvas = document.getElementById('spark-' + widgetId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const data = viewerState.valueHistory[widgetId] || [];
  
  canvas.width = canvas.offsetWidth;
  canvas.height = 60;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  if (data.length < 2) return;
  
  const min = Math.min(...data, w.minValue);
  const max = Math.max(...data, w.maxValue);
  const range = max - min || 1;
  
  ctx.strokeStyle = w.color === 'auto' ? '#58a6ff' : w.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  data.forEach((v, i) => {
    const x = (i / (data.length - 1)) * canvas.width;
    const y = canvas.height - ((v - min) / range) * canvas.height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  
  ctx.stroke();
}