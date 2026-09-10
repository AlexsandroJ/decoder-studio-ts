/**
 * Renderização dos widgets (Versão Otimizada e sem Vazamento de DOM)
 */

function renderWidgets() {
  const grid = document.getElementById('viewerGrid');
  const countEl = document.getElementById('widgetCount');
  
  if (!grid) return; // Segurança: evita erro se o elemento não existir
  
  countEl.textContent = viewerState.widgets.length;
  
  if (!viewerState.widgets.length) {
    grid.innerHTML = '';
    grid.appendChild(createEmptyViewer());
    return;
  }
  
  // Renderiza a grade completa APENAS na inicialização ou quando a lista de widgets muda
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
    case 'gauge': bodyHtml = renderGaugeBody(w); break;
    case 'bar': bodyHtml = renderBarBody(w); break;
    case 'sparkline': bodyHtml = renderSparklineBody(w); break;
    case 'led': bodyHtml = renderLedBody(w); break;
    default: bodyHtml = renderNumberBody(w);
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
  return `<div class="widget-value" id="val-${w.id}">—</div><div class="widget-unit">${w.unit || ''}</div>`;
}

function renderGaugeBody(w) {
  return `
    <div class="widget-value" id="val-${w.id}" style="font-size:24px;">—</div>
    <div class="widget-unit">${w.unit || ''}</div>
    <div class="gauge-container" style="width:100%; margin-top:12px;">
      <div class="gauge-bar"><div class="gauge-fill" id="gauge-${w.id}" style="width:0%"></div></div>
      <div class="gauge-labels"><span>${w.minValue}</span><span>${w.maxValue}</span></div>
    </div>
  `;
}

function renderBarBody(w) {
  // Adicionamos um ID específico ao container da barra para atualizá-lo isoladamente depois
  const history = viewerState.valueHistory[w.id] || [];
  const segments = history.length ? history.map(v => {
    const pct = Math.max(0, Math.min(100, ((v - w.minValue) / (w.maxValue - w.minValue)) * 100));
    return `<div class="bar-segment" style="height:${pct}%"></div>`;
  }).join('') : '<div style="color:var(--text-dim); font-size:11px; text-align:center; width:100%;">Aguardando dados...</div>';
  
  return `
    <div class="widget-value" id="val-${w.id}" style="font-size:20px;">—</div>
    <div class="bar-container" id="bar-container-${w.id}">${segments}</div>
  `;
}

function renderSparklineBody(w) {
  return `
    <div class="widget-value" id="val-${w.id}" style="font-size:20px;">—</div>
    <canvas id="spark-${w.id}" width="200" height="60" style="width:100%; height:60px;"></canvas>
  `;
}

function renderLedBody(w) {
  return `
    <div class="led-indicator" id="led-${w.id}">●</div>
    <div class="widget-value" id="val-${w.id}" style="font-size:18px; margin-top:8px;">—</div>
  `;
}

// ════════════════════════════════════════════════════════
//  ATUALIZAR WIDGET COM DADO REAL (VERSÃO OTIMIZADA)
// ════════════════════════════════════════════════════════
function updateWidget(widgetId, value) {
  const w = viewerState.widgets.find(x => x.id === widgetId);
  if (!w) return;
  
  const el = document.getElementById('widget-' + widgetId);
  if (!el) return;
  
  // 1. SEGURANÇA DE MEMÓRIA: Atualiza histórico com limite rígido
  if (!viewerState.valueHistory[widgetId]) viewerState.valueHistory[widgetId] = [];
  viewerState.valueHistory[widgetId].push(value);
  
  // Fallback para 50 caso MAX_HISTORY não esteja definido no viewer-state.js
  const maxHist = viewerState.MAX_HISTORY || 50; 
  if (viewerState.valueHistory[widgetId].length > maxHist) {
    viewerState.valueHistory[widgetId].shift(); // Remove o mais antigo (FIFO)
  }
  
  // 2. Atualiza valor numérico na tela
  const formatted = typeof value === 'number' ? value.toFixed(w.decimals || 2) : value;
  const valEl = document.getElementById('val-' + widgetId);
  if (valEl) valEl.textContent = formatted;
  
  // 3. Determina estado baseado em limites
  let state = 'normal';
  if (value >= w.dangerThreshold) state = 'danger';
  else if (value >= w.warningThreshold) state = 'warning';
  else if (value < w.minValue) state = 'warning';
  else state = 'good';
  
  // Atualiza classe de estado de forma segura (remove qualquer 'state-X' antigo e adiciona o novo)
  el.className = el.className.replace(/state-\w+/g, '').trim() + ' state-' + state;
  
  // Cor personalizada
  if (w.color && w.color !== 'auto') {
    if (valEl) valEl.style.color = w.color;
  }
  
  // 4. Atualiza tipo específico (SEM re-renderizar a tela inteira!)
  switch (w.displayType) {
    case 'gauge':
      updateGauge(widgetId, value, w);
      break;
    case 'bar':
      updateBar(widgetId, w); // <-- CORREÇÃO CRÍTICA: Substitui o renderWidgets() destrutivo
      break;
    case 'sparkline':
      drawSparkline(widgetId, w);
      break;
    case 'led':
      updateLed(widgetId, value, w, state);
      break;
  }
  
  // 5. Atualiza meta informações
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

// NOVA FUNÇÃO: Atualiza APENAS o container da barra específica, preservando o resto do DOM
function updateBar(widgetId, w) {
  const container = document.getElementById('bar-container-' + widgetId);
  if (!container) return;
  
  const history = viewerState.valueHistory[widgetId] || [];
  if (!history.length) {
    container.innerHTML = '<div style="color:var(--text-dim); font-size:11px; text-align:center; width:100%;">Aguardando dados...</div>';
    return;
  }
  
  const segments = history.map(v => {
    const pct = Math.max(0, Math.min(100, ((v - w.minValue) / (w.maxValue - w.minValue)) * 100));
    return `<div class="bar-segment" style="height:${pct}%"></div>`;
  }).join('');
  
  container.innerHTML = segments; // Atualização leve e localizada
}

function updateLed(widgetId, value, w, state) {
  const led = document.getElementById('led-' + widgetId);
  if (!led) return;
  led.className = 'led-indicator'; // Reseta classes anteriores
  if (state === 'danger') led.classList.add('danger');
  else if (state === 'warning') led.classList.add('warning');
  else if (state === 'good') led.classList.add('active');
}

function drawSparkline(widgetId, w) {
  const canvas = document.getElementById('spark-' + widgetId);
  if (!canvas) return;
  
  // OTIMIZAÇÃO DE CANVAS: Redefinir canvas.width limpa o contexto e é MUITO custoso.
  // Só fazemos isso se a largura real do elemento na tela tiver mudado (ex: redimensionamento da janela).
  const targetWidth = canvas.offsetWidth || 200;
  if (canvas.width !== targetWidth) {
    canvas.width = targetWidth;
  }
  if (canvas.height !== 60) {
    canvas.height = 60;
  }
  
  const ctx = canvas.getContext('2d');
  const data = viewerState.valueHistory[widgetId] || [];
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (data.length < 2) return;
  
  const min = w.minValue;
  const max = w.maxValue;
  const range = max - min || 1;
  
  ctx.strokeStyle = w.color === 'auto' ? '#58a6ff' : w.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  // Loop otimizado (mais rápido que forEach em alguns motores JS)
  const len = data.length;
  const lenMinusOne = len - 1;
  
  for (let i = 0; i < len; i++) {
    const v = data[i];
    const x = (i / lenMinusOne) * canvas.width;
    const y = canvas.height - ((v - min) / range) * canvas.height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  
  ctx.stroke();
}