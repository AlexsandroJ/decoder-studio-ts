/**
 * Gerenciamento de configuração de widgets
 */

// Atualiza URL base quando o input muda
document.getElementById('baseUrl').addEventListener('change', (e) => {
  viewerState.baseUrl = e.target.value.trim();
  saveViewerState();
});

function checkHealth() {
  fetch(`${viewerState.baseUrl}/health`)
    .then(r => r.json())
    .then(d => showToast(`✅ API online! Uptime: ${d.uptime?.toFixed(1)}s`))
    .catch(e => showToast('❌ API offline: ' + e.message, true));
}

// ════════════════════════════════════════════════════════
//  PAINEL DE CONFIGURAÇÃO
// ════════════════════════════════════════════════════════
function openConfigPanel() {
  document.getElementById('configOverlay').classList.add('active');
  loadSavedConfigsList();
}

function closeConfigPanel() {
  document.getElementById('configOverlay').classList.remove('active');
}

function switchConfigTab(ev, tabName) {
  document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.config-tab-content').forEach(t => t.classList.remove('active'));
  ev.target.classList.add('active');
  document.getElementById('config-' + tabName).classList.add('active');
}

// ════════════════════════════════════════════════════════
//  CARREGAR SINAIS DA API
// ════════════════════════════════════════════════════════
async function loadSignalsFromApi() {
  try {
    const [rulesRes, framesRes] = await Promise.all([
      fetch(`${viewerState.baseUrl}/decoding/rules`).then(r => r.json()),
      fetch(`${viewerState.baseUrl}/can/frames?limit=100`).then(r => r.json())
    ]);

    const rules = rulesRes.data || rulesRes || [];
    const frames = framesRes.data || framesRes || [];

    // Agrupa regras por CAN ID
    const signals = [];
    if (Array.isArray(rules)) {
      rules.forEach(r => {
        signals.push({
          type: 'can-signal',
          id: r.id,
          name: r.signalName,
          canId: r.canId,
          unit: r.unit || '',
          factor: r.factor ?? 1,
          offset: r.offset ?? 0,
          source: 'can'
        });
      });
    }

    viewerState.availableSignals = signals;
    renderSignalList(signals);
    showToast(`✅ ${signals.length} sinais carregados`);
  } catch (e) {
    showToast('❌ Erro: ' + e.message, true);
  }
}

async function loadSensorsFromApi() {
  try {
    const res = await fetch(`${viewerState.baseUrl}/sensors?limit=100`);
    const data = await res.json();
    const sensors = data.data || data || [];

    const unique = [];
    const seen = new Set();
    if (Array.isArray(sensors)) {
      sensors.forEach(s => {
        const key = s.sensorId + '|' + s.sensorType;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push({
            type: 'sensor',
            id: s.id,
            name: s.sensorId || s.sensorType,
            sensorType: s.sensorType,
            unit: s.unit || '',
            source: 'sensor'
          });
        }
      });
    }

    viewerState.availableSensors = unique;
    renderSensorList(unique);
    showToast(`✅ ${unique.length} sensores carregados`);
  } catch (e) {
    showToast(' Erro: ' + e.message, true);
  }
}

function renderSignalList(signals) {
  const container = document.getElementById('signalList');
  if (!signals.length) {
    container.innerHTML = '<div class="empty-config">Nenhum sinal encontrado</div>';
    return;
  }
  container.innerHTML = signals.map(s => `
    <div class="signal-item" data-name="${s.name.toLowerCase()}">
      <div class="signal-info">
        <div class="signal-name">${s.name}</div>
        <div class="signal-meta">CAN ID: ${s.canId} • Unit: ${s.unit || '—'}</div>
      </div>
      <div class="signal-actions">
        <button class="btn-mini" onclick="addWidgetFromSignal(${JSON.stringify(s).replace(/"/g, '&quot;')})">➕ Adicionar</button>
      </div>
    </div>
  `).join('');
}

function renderSensorList(sensors) {
  const container = document.getElementById('sensorList');
  if (!sensors.length) {
    container.innerHTML = '<div class="empty-config">Nenhum sensor encontrado</div>';
    return;
  }
  container.innerHTML = sensors.map(s => `
    <div class="signal-item" data-name="${s.name.toLowerCase()}">
      <div class="signal-info">
        <div class="signal-name">${s.name}</div>
        <div class="signal-meta">Tipo: ${s.sensorType} • Unit: ${s.unit || '—'}</div>
      </div>
      <div class="signal-actions">
        <button class="btn-mini" onclick="addWidgetFromSensor(${JSON.stringify(s).replace(/"/g, '&quot;')})">➕ Adicionar</button>
      </div>
    </div>
  `).join('');
}

function filterSignals() {
  const q = document.getElementById('signalSearch').value.toLowerCase();
  document.querySelectorAll('#signalList .signal-item').forEach(el => {
    el.style.display = el.dataset.name.includes(q) ? '' : 'none';
  });
}

function filterSensors() {
  const q = document.getElementById('sensorSearch').value.toLowerCase();
  document.querySelectorAll('#sensorList .signal-item').forEach(el => {
    el.style.display = el.dataset.name.includes(q) ? '' : 'none';
  });
}

// ════════════════════════════════════════════════════════
//  ADICIONAR WIDGET
// ════════════════════════════════════════════════════════
function addWidgetFromSignal(signal) {
  const widget = {
    id: 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    type: 'can-signal',
    sourceId: signal.id,
    name: signal.name,
    canId: signal.canId,
    unit: signal.unit,
    displayType: 'number', // number, gauge, bar, sparkline, led
    minValue: 0,
    maxValue: 100,
    warningThreshold: 70,
    dangerThreshold: 90,
    decimals: 2,
    customLabel: '',
    color: 'auto'
  };
  viewerState.widgets.push(widget);
  saveViewerState();
  renderWidgets();
  showToast(`✅ Widget "${signal.name}" adicionado`);
  closeConfigPanel();
}

function addWidgetFromSensor(sensor) {
  const widget = {
    id: 'w_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    type: 'sensor',
    sourceId: sensor.id,
    name: sensor.name,
    sensorType: sensor.sensorType,
    unit: sensor.unit,
    displayType: 'number',
    minValue: 0,
    maxValue: 100,
    warningThreshold: 70,
    dangerThreshold: 90,
    decimals: 2,
    customLabel: '',
    color: 'auto'
  };
  viewerState.widgets.push(widget);
  saveViewerState();
  renderWidgets();
  showToast(`✅ Widget "${sensor.name}" adicionado`);
  closeConfigPanel();
}

// ════════════════════════════════════════════════════════
//  EDITAR WIDGET
// ════════════════════════════════════════════════════════
function openEditWidget(widgetId) {
  const widget = viewerState.widgets.find(w => w.id === widgetId);
  if (!widget) return;

  const form = document.getElementById('editForm');
  form.innerHTML = `
    <div class="form-group">
      <label>Nome exibido</label>
      <input type="text" id="edit-name" value="${widget.customLabel || widget.name}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Tipo de visualização</label>
        <select id="edit-displayType">
          <option value="number" ${widget.displayType==='number'?'selected':''}> Número</option>
          <option value="gauge" ${widget.displayType==='gauge'?'selected':''}>📊 Gauge (barra)</option>
          <option value="bar" ${widget.displayType==='bar'?'selected':''}> Barras históricas</option>
          <option value="sparkline" ${widget.displayType==='sparkline'?'selected':''}> Sparkline</option>
          <option value="led" ${widget.displayType==='led'?'selected':''}>🔴 LED Status</option>
        </select>
      </div>
      <div class="form-group">
        <label>Casas decimais</label>
        <input type="number" id="edit-decimals" value="${widget.decimals}" min="0" max="6">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Valor mínimo (escala)</label>
        <input type="number" id="edit-minValue" value="${widget.minValue}" step="any">
      </div>
      <div class="form-group">
        <label>Valor máximo (escala)</label>
        <input type="number" id="edit-maxValue" value="${widget.maxValue}" step="any">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Limite warning (amarelo)</label>
        <input type="number" id="edit-warningThreshold" value="${widget.warningThreshold}" step="any">
      </div>
      <div class="form-group">
        <label>Limite danger (vermelho)</label>
        <input type="number" id="edit-dangerThreshold" value="${widget.dangerThreshold}" step="any">
      </div>
    </div>
    <div class="form-group">
      <label>Cor personalizada (opcional)</label>
      <input type="color" id="edit-color" value="${widget.color === 'auto' ? '#58a6ff' : widget.color}">
      <div class="checkbox-group" style="margin-top:6px;">
        <input type="checkbox" id="edit-autoColor" ${widget.color==='auto'?'checked':''}>
        <label for="edit-autoColor">Cor automática baseada em limites</label>
      </div>
    </div>
    <div style="display:flex; gap:8px; margin-top:12px;">
      <button class="btn btn-primary" onclick="saveWidgetEdit('${widgetId}')" style="flex:1;"> Salvar</button>
      <button class="btn btn-danger" onclick="deleteWidget('${widgetId}')">🗑️ Remover</button>
    </div>
  `;

  document.getElementById('editOverlay').classList.add('active');
}

function closeEditPanel() {
  document.getElementById('editOverlay').classList.remove('active');
}

function saveWidgetEdit(widgetId) {
  const widget = viewerState.widgets.find(w => w.id === widgetId);
  if (!widget) return;

  widget.customLabel = document.getElementById('edit-name').value;
  widget.displayType = document.getElementById('edit-displayType').value;
  widget.decimals = parseInt(document.getElementById('edit-decimals').value);
  widget.minValue = parseFloat(document.getElementById('edit-minValue').value);
  widget.maxValue = parseFloat(document.getElementById('edit-maxValue').value);
  widget.warningThreshold = parseFloat(document.getElementById('edit-warningThreshold').value);
  widget.dangerThreshold = parseFloat(document.getElementById('edit-dangerThreshold').value);
  widget.color = document.getElementById('edit-autoColor').checked 
    ? 'auto' 
    : document.getElementById('edit-color').value;

  saveViewerState();
  renderWidgets();
  closeEditPanel();
  showToast('✅ Widget atualizado');
}

function deleteWidget(widgetId) {
  if (!confirm('Remover este widget?')) return;
  viewerState.widgets = viewerState.widgets.filter(w => w.id !== widgetId);
  delete viewerState.valueHistory[widgetId];
  saveViewerState();
  renderWidgets();
  closeEditPanel();
  showToast('🗑️ Widget removido');
}

function clearAllWidgets() {
  if (!viewerState.widgets.length) return;
  if (!confirm('Remover TODOS os widgets?')) return;
  viewerState.widgets = [];
  viewerState.valueHistory = {};
  saveViewerState();
  renderWidgets();
  showToast('🗑️ Todos os widgets removidos');
}

// ════════════════════════════════════════════════════════
//  CONFIGURAÇÕES SALVAS
// ════════════════════════════════════════════════════════
function saveCurrentConfig() {
  const name = prompt('Nome da configuração:');
  if (!name) return;
  
  const configs = JSON.parse(localStorage.getItem('viewer-configs') || '{}');
  configs[name] = {
    widgets: viewerState.widgets,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem('viewer-configs', JSON.stringify(configs));
  showToast(`💾 Configuração "${name}" salva`);
  loadSavedConfigsList();
}

function loadSavedConfig() {
  const configs = JSON.parse(localStorage.getItem('viewer-configs') || '{}');
  const names = Object.keys(configs);
  if (!names.length) {
    showToast('Nenhuma configuração salva', true);
    return;
  }
  const name = prompt('Qual configuração carregar?\n\n' + names.join('\n'));
  if (name && configs[name]) {
    viewerState.widgets = configs[name].widgets;
    saveViewerState();
    renderWidgets();
    showToast(`📂 Configuração "${name}" carregada`);
  }
}

function deleteSavedConfig() {
  const configs = JSON.parse(localStorage.getItem('viewer-configs') || '{}');
  const names = Object.keys(configs);
  if (!names.length) {
    showToast('Nenhuma configuração salva', true);
    return;
  }
  const name = prompt('Qual configuração apagar?\n\n' + names.join('\n'));
  if (name && configs[name]) {
    delete configs[name];
    localStorage.setItem('viewer-configs', JSON.stringify(configs));
    showToast(`🗑️ Configuração "${name}" apagada`);
    loadSavedConfigsList();
  }
}

function loadSavedConfigsList() {
  const container = document.getElementById('savedList');
  const configs = JSON.parse(localStorage.getItem('viewer-configs') || '{}');
  const names = Object.keys(configs);
  
  if (!names.length) {
    container.innerHTML = '<div class="empty-config">Nenhuma configuração salva</div>';
    return;
  }
  
  container.innerHTML = names.map(n => `
    <div class="saved-item">
      <div class="signal-info">
        <div class="signal-name">${n}</div>
        <div class="signal-meta">${configs[n].widgets.length} widgets • ${new Date(configs[n].savedAt).toLocaleString('pt-BR')}</div>
      </div>
    </div>
  `).join('');
}

// ════════════════════════════════════════════════════════
//  TOAST
// ════════════════════════════════════════════════════════
function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (err ? ' error' : '');
  setTimeout(() => t.className = 'toast', 3000);
}

// ════════════════════════════════════════════════════════
//  TEMA
// ════════════════════════════════════════════════════════
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('themeToggle').textContent = saved === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.getElementById('themeToggle').textContent = next === 'dark' ? '️' : '🌙';
}

// ════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════
window.addEventListener('load', () => {
  initTheme();
  loadViewerState();
  renderWidgets();
});

