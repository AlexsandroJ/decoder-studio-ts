function hexToBytes(hex) {
  const bytes = new Array(8).fill(0);
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  for (let i = 0; i < 8 && i * 2 < clean.length; i++) {
    const byteHex = clean.substr(i * 2, 2);
    if (byteHex.length > 0) bytes[i] = parseInt(byteHex.padStart(2, '0'), 16);
  }
  return bytes;
}

async function refreshAnalyzer() {
  try {
    const res = await apiRequest('GET', '/can/frames?limit=200');
    if (!res.success) return;

    const frames = res.data.data || res.data || [];
    if (!Array.isArray(frames)) return;

    const byCanId = {};
    const timestampsByCanId = {};

    frames.forEach(f => {
      if (!f.canId) return;
      if (!byCanId[f.canId]) { byCanId[f.canId] = []; timestampsByCanId[f.canId] = []; }
      byCanId[f.canId].push(f);
      timestampsByCanId[f.canId].push(f.timestamp);
    });

    const frequencies = {};
    Object.keys(timestampsByCanId).forEach(canId => {
      const ts = timestampsByCanId[canId].sort((a, b) => a - b);
      if (ts.length > 1) {
        let totalInterval = 0;
        for (let i = 1; i < ts.length; i++) totalInterval += (ts[i] - ts[i-1]);
        const avgInterval = totalInterval / (ts.length - 1);
        frequencies[canId] = Math.round(1000 / avgInterval);
      } else {
        frequencies[canId] = 0;
      }
    });

    state.analyzer.framesByCanId = byCanId;
    state.analyzer.frequencies = frequencies;
    state.analyzer.canIds = Object.keys(byCanId).sort();

    renderSnifferTable();
    renderCanIdList();

    if (state.analyzer.selectedCanId && byCanId[state.analyzer.selectedCanId]) {
      renderByteGrid();
      renderTranslationsGrid();
      renderFramesHistory();
    }
  } catch (e) {
    console.error('Erro ao atualizar analyzer:', e);
  }
}

function renderSnifferTable() {
  const body = document.getElementById('snifferBody');
  const filter = (document.getElementById('snifferFilter')?.value || '').toLowerCase();

  let ids = state.analyzer.canIds;
  if (filter) ids = ids.filter(id => id.toLowerCase().includes(filter));

  if (!ids.length) {
    body.innerHTML = '<tr><td colspan="11" class="raw-data-empty">Nenhum CAN ID recebido</td></tr>';
    return;
  }

  body.innerHTML = ids.map(canId => {
    const frames = state.analyzer.framesByCanId[canId];
    const sorted = [...frames].sort((a, b) => a.timestamp - b.timestamp);
    const latest = sorted[sorted.length - 1];
    const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
    
    // Calcula frequência corretamente
    let freq = 0;
    if (sorted.length > 1) {
      const timeDiff = (sorted[sorted.length - 1].timestamp - sorted[0].timestamp) / 1000; // em segundos
      if (timeDiff > 0) {
        freq = Math.round((sorted.length - 1) / timeDiff);
      }
    }
    
    const bytes = hexToBytes(latest.data);
    const prevBytes = prev ? hexToBytes(prev.data) : null;

    const isSelected = canId === state.analyzer.selectedCanId;

    // Cria células para cada byte (0-7)
    const byteCells = [];
    for (let i = 0; i < 8; i++) {
      const b = bytes[i];
      let cls = 'neutral';
      
      if (prevBytes) {
        if (b > prevBytes[i]) cls = 'increased';
        else if (b < prevBytes[i]) cls = 'decreased';
        else cls = 'same';
      }
      
      byteCells.push(`<td><span class="byte-cell-small ${cls}">${b.toString(16).toUpperCase().padStart(2, '0')}</span></td>`);
    }

    return `<tr class="${isSelected ? 'selected' : ''}" onclick="selectCanId('${canId}')">
      <td class="can-id-cell">${canId}</td>
      <td><span class="freq-badge">${freq} Hz</span></td>
      ${byteCells.join('')}
      <td class="frame-count">${frames.length}</td>
    </tr>`;
  }).join('');
}

function renderCanIdList() {
  const container = document.getElementById('canIdList');
  const search = document.getElementById('analyzerSearch').value.toLowerCase();

  let ids = state.analyzer.canIds;
  if (search) ids = ids.filter(id => id.toLowerCase().includes(search));

  if (!ids.length) {
    container.innerHTML = '<div class="empty-state"><div class="icon"></div><div>Nenhum CAN ID</div></div>';
    return;
  }

  container.innerHTML = ids.map(id => {
    const count = state.analyzer.framesByCanId[id].length;
    const active = id === state.analyzer.selectedCanId ? 'active' : '';
    return `<div class="can-id-item ${active}" onclick="selectCanId('${id}')">
      <span class="id">${id}</span>
      <span class="count">${count} frames</span>
    </div>`;
  }).join('');
}

function selectCanId(canId) {
  state.analyzer.selectedCanId = canId;
  document.getElementById('analyzerCanId').textContent = canId;
  loadTranslations(canId);
  renderCanIdList();
  renderSnifferTable();
  renderByteGrid();
  renderTranslationsGrid();
  renderFramesHistory();
}

function renderByteGrid() {
  const container = document.getElementById('byteGrid');
  const canId = state.analyzer.selectedCanId;

  if (!canId || !state.analyzer.framesByCanId[canId]) {
    container.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;"><div class="icon"></div><div>Selecione um CAN ID</div></div>';
    return;
  }

  const frames = state.analyzer.framesByCanId[canId];
  const sorted = [...frames].sort((a, b) => a.timestamp - b.timestamp);
  const latest = sorted[sorted.length - 1];
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const bytes = hexToBytes(latest.data);
  const prevBytes = prev ? hexToBytes(prev.data) : null;
  const translations = state.analyzer.translations[canId] || {};

  container.innerHTML = bytes.map((byte, i) => {
    let change = 'same';
    let arrow = '';
    if (prevBytes) {
      if (byte > prevBytes[i]) { change = 'increased'; arrow = '↑'; }
      else if (byte < prevBytes[i]) { change = 'decreased'; arrow = '↓'; }
    }

    const label = translations[i]?.label || '';
    const labelClass = label ? '' : 'empty';
    const labelText = label || 'Clique para nomear';

    return `<div class="byte-cell ${change}">
      ${arrow ? `<div class="byte-arrow">${arrow}</div>` : ''}
      <div class="byte-index">Byte ${i}</div>
      <div class="byte-value">0x${byte.toString(16).toUpperCase().padStart(2, '0')}</div>
      <div class="byte-decimal">${byte}</div>
      <div class="byte-label ${labelClass}" onclick="editByteLabel(${i})">${labelText}</div>
    </div>`;
  }).join('');
}

function editByteLabel(byteIndex) {
  const canId = state.analyzer.selectedCanId;
  if (!canId) return;
  const translations = state.analyzer.translations[canId] || {};
  const current = translations[byteIndex]?.label || '';
  const newLabel = prompt(`Nome para Byte ${byteIndex}:`, current);
  if (newLabel !== null) {
    if (!state.analyzer.translations[canId]) state.analyzer.translations[canId] = {};
    if (newLabel.trim()) {
      state.analyzer.translations[canId][byteIndex] = {
        label: newLabel.trim(),
        type: translations[byteIndex]?.type || 'uint8'
      };
    } else {
      delete state.analyzer.translations[canId][byteIndex];
    }
    saveTranslations(canId);
    renderByteGrid();
    renderTranslationsGrid();
  }
}

function renderTranslationsGrid() {
  const container = document.getElementById('translationsGrid');
  const canId = state.analyzer.selectedCanId;

  if (!canId) {
    container.innerHTML = '<div class="header">Byte</div><div class="header">Label</div><div class="header">Tipo</div><div class="header">Valor Atual</div>';
    return;
  }

  const frames = state.analyzer.framesByCanId[canId];
  const latest = frames[frames.length - 1];
  const bytes = hexToBytes(latest.data);
  const translations = state.analyzer.translations[canId] || {};

  let html = '<div class="header">Byte</div><div class="header">Label / Nome</div><div class="header">Tipo</div><div class="header">Valor Atual</div>';

  for (let i = 0; i < 8; i++) {
    const trans = translations[i] || { label: '', type: 'uint8' };
    const value = bytes[i];
    html += `
      <div>Byte ${i}</div>
      <div><input type="text" value="${trans.label}" onchange="updateTranslation(${i}, 'label', this.value)" placeholder="Nome do sinal..."></div>
      <div>
        <select onchange="updateTranslation(${i}, 'type', this.value)">
          <option value="uint8" ${trans.type === 'uint8' ? 'selected' : ''}>uint8</option>
          <option value="int8" ${trans.type === 'int8' ? 'selected' : ''}>int8</option>
          <option value="hex" ${trans.type === 'hex' ? 'selected' : ''}>hex</option>
          <option value="bitfield" ${trans.type === 'bitfield' ? 'selected' : ''}>bitfield</option>
        </select>
      </div>
      <div style="color:var(--cyan); font-family:'Consolas',monospace;">0x${value.toString(16).toUpperCase().padStart(2, '0')} (${value})</div>
    `;
  }

  container.innerHTML = html;
}

function updateTranslation(byteIndex, field, value) {
  const canId = state.analyzer.selectedCanId;
  if (!canId) return;
  if (!state.analyzer.translations[canId]) state.analyzer.translations[canId] = {};
  if (!state.analyzer.translations[canId][byteIndex]) state.analyzer.translations[canId][byteIndex] = { label: '', type: 'uint8' };
  state.analyzer.translations[canId][byteIndex][field] = value;
  saveTranslations(canId);
  renderByteGrid();
}

function saveTranslations(canId) {
  localStorage.setItem(`can-translations-${canId}`, JSON.stringify(state.analyzer.translations[canId] || {}));
}

function loadTranslations(canId) {
  const saved = localStorage.getItem(`can-translations-${canId}`);
  state.analyzer.translations[canId] = saved ? JSON.parse(saved) : {};
}

function exportTranslations() {
  const canId = state.analyzer.selectedCanId;
  if (!canId) { showToast('Selecione um CAN ID primeiro', true); return; }
  const data = {
    canId,
    translations: state.analyzer.translations[canId] || {},
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `translations-${canId}-${Date.now()}.json`;
  a.click();
  showToast('💾 Traduções exportadas');
}

function renderFramesHistory() {
  const container = document.getElementById('framesHistoryBody');
  const canId = state.analyzer.selectedCanId;

  if (!canId || !state.analyzer.framesByCanId[canId]) {
    container.innerHTML = '<tr><td colspan="3" class="raw-data-empty">Nenhum frame</td></tr>';
    return;
  }

  const frames = [...state.analyzer.framesByCanId[canId]].sort((a, b) => a.timestamp - b.timestamp).slice(-20).reverse();

  container.innerHTML = frames.map((frame, idx) => {
    const time = new Date(frame.timestamp).toLocaleString('pt-BR', {
      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
    }) + '.' + String(frame.timestamp % 1000).padStart(3, '0');

    const bytes = hexToBytes(frame.data);
    const prevFrame = idx < frames.length - 1 ? frames[idx + 1] : null;
    const prevBytes = prevFrame ? hexToBytes(prevFrame.data) : null;

    const bytesHtml = bytes.map((b, i) => {
      let cls = 'same';
      if (prevBytes) {
        if (b > prevBytes[i]) cls = 'up';
        else if (b < prevBytes[i]) cls = 'down';
      }
      return `<span class="byte-history-cell ${cls}">${b.toString(16).toUpperCase().padStart(2, '0')}</span>`;
    }).join('');

    return `<tr>
      <td class="timestamp-cell">${time}</td>
      <td>${bytesHtml}</td>
      <td>${frame.dlc || 8}</td>
    </tr>`;
  }).join('');
}

function startAutoRefresh() {
  stopAutoRefresh();
  const interval = parseInt(document.getElementById('refreshInterval').value) || 1000;
  state.analyzer.refreshTimer = setInterval(() => {
    if (document.getElementById('autoRefresh').checked) refreshAnalyzer();
  }, interval);
}

function stopAutoRefresh() {
  if (state.analyzer.refreshTimer) {
    clearInterval(state.analyzer.refreshTimer);
    state.analyzer.refreshTimer = null;
  }
}
