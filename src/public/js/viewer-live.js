/**
 * Modo Live - Atualização em tempo real
 */

function toggleLive() {
  if (viewerState.isLive) {
    stopLive();
  } else {
    startLive();
  }
}

function startLive() {
  viewerState.isLive = true;
  document.getElementById('liveBtn').textContent = '⏸️ Pausar Live';
  document.getElementById('liveDot').classList.add('live');
  document.getElementById('liveStatus').textContent = 'Live';
  document.getElementById('liveStatus').style.color = 'var(--green)';
  
  const interval = parseInt(document.getElementById('refreshInterval').value) || 1000;
  viewerState.refreshInterval = interval;
  
  refreshNow(); // Primeira atualização imediata
  viewerState.refreshTimer = setInterval(refreshNow, interval);
}

function stopLive() {
  viewerState.isLive = false;
  document.getElementById('liveBtn').textContent = '▶️ Iniciar Live';
  document.getElementById('liveDot').classList.remove('live');
  document.getElementById('liveStatus').textContent = 'Pausado';
  document.getElementById('liveStatus').style.color = 'var(--text-dim)';
  
  if (viewerState.refreshTimer) {
    clearInterval(viewerState.refreshTimer);
    viewerState.refreshTimer = null;
  }
}

function refreshNow() {
  if (!viewerState.widgets.length) return;
  
  Promise.all([
    fetch(`${viewerState.baseUrl}/unified?limit=100`).then(r => r.json()).catch(() => ({data:[]})),
    fetch(`${viewerState.baseUrl}/sensors?limit=100`).then(r => r.json()).catch(() => ({data:[]}))
  ]).then(([unifiedRes, sensorsRes]) => {
    const unified = unifiedRes.data || unifiedRes || [];
    const sensors = sensorsRes.data || sensorsRes || [];
    
    viewerState.widgets.forEach(w => {
      let value = null;
      
      if (w.type === 'can-signal') {
        // Busca o valor mais recente deste sinal nos dados unificados
        for (const record of unified) {
          if (record.canSignals) {
            const sig = record.canSignals.find(s => s.ruleId === w.sourceId || s.signalName === w.name);
            if (sig) {
              value = sig.value;
              break;
            }
          }
        }
      } else if (w.type === 'sensor') {
        // Busca o sensor mais recente
        for (const s of sensors) {
          if (s.sensorId === w.name || s.id === w.sourceId) {
            value = typeof s.value === 'number' ? s.value : parseFloat(s.value);
            break;
          }
        }
      }
      
      if (value !== null && !isNaN(value)) {
        updateWidget(w.id, value);
      }
    });
    
    viewerState.lastUpdate = Date.now();
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('pt-BR');
  }).catch(err => {
    console.error('Erro ao atualizar:', err);
  });
}

// Atualiza intervalo quando o input muda
document.getElementById('refreshInterval').addEventListener('change', (e) => {
  const newInterval = parseInt(e.target.value) || 1000;
  viewerState.refreshInterval = newInterval;
  if (viewerState.isLive) {
    stopLive();
    startLive();
  }
});