/**
 * Modo Live - Com Logs de Diagnóstico Avançado
 */

let isFetching = false; 
let updateCount = 0;
let errorCount = 0;

function toggleLive() {
  if (viewerState.isLive) {
    stopLive();
  } else {
    startLive();
  }
}

function startLive() {
  if (viewerState.isLive) return; 
  
  console.log('🚀 Iniciando Live Mode');
  console.log(' Widgets configurados:', viewerState.widgets.length);
  console.log('📋 Widgets:', viewerState.widgets.map(w => `${w.id}:${w.name}`));

  viewerState.isLive = true;
  document.getElementById('liveBtn').textContent = '⏸️ Pausar Live';
  document.getElementById('liveDot').classList.add('live');
  document.getElementById('liveStatus').textContent = 'Live';
  document.getElementById('liveStatus').style.color = 'var(--green)';
  
  const interval = parseInt(document.getElementById('refreshInterval').value) || 1000;
  viewerState.refreshInterval = interval;
  
  refreshNow(); 
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
  console.log('⏹️ Live mode parado. Total de updates:', updateCount, 'Erros:', errorCount);
}

async function refreshNow() {
  if (!viewerState.isLive || isFetching || !viewerState.widgets.length) {
    return;
  }
  
  isFetching = true; 
  const startTime = performance.now();
  updateCount++;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); 

  try {
    const [unifiedRes, sensorsRes] = await Promise.all([
      fetch(`${viewerState.baseUrl}/unified?limit=10`, { signal: controller.signal }),
      fetch(`${viewerState.baseUrl}/sensors?limit=10`, { signal: controller.signal })
    ]);

    clearTimeout(timeoutId);

    if (!unifiedRes.ok || !sensorsRes.ok) {
      throw new Error(`HTTP Error: Unified ${unifiedRes.status}, Sensors ${sensorsRes.status}`);
    }

    const unifiedData = await unifiedRes.json();
    const sensorsData = await sensorsRes.json();
    
    const unified = unifiedData.data || unifiedData || [];
    const sensors = sensorsData.data || sensorsData || [];
    
    // LOG: Verificar estrutura dos dados
    if (updateCount <= 3 || updateCount % 10 === 0) {
      console.log(`\n🔄 Update #${updateCount}`);
      console.log('📦 Unified records:', unified.length);
      console.log('📦 Sensors:', sensors.length);
      
      if (unified.length > 0 && unified[0].canSignals) {
        console.log(' Exemplo CAN Signals:', unified[0].canSignals.slice(0, 2).map(s => ({
          ruleId: s.ruleId,
          signalName: s.signalName,
          value: s.value
        })));
      }
      
      if (sensors.length > 0) {
        console.log('🔍 Exemplo Sensors:', sensors.slice(0, 2).map(s => ({
          sensorId: s.sensorId,
          value: s.value
        })));
      }
    }
    
    // Criar Maps
    const signalMap = new Map();
    for (const record of unified) {
      if (record.canSignals) {
        for (const sig of record.canSignals) {
          const key = sig.ruleId || sig.signalName;
          if (!signalMap.has(key)) {
            signalMap.set(key, sig.value);
          }
        }
      }
    }

    const sensorMap = new Map();
    for (const s of sensors) {
      const key = s.sensorId || s.id;
      if (!sensorMap.has(key)) {
        sensorMap.set(key, typeof s.value === 'number' ? s.value : parseFloat(s.value));
      }
    }
    
    if (updateCount <= 3 || updateCount % 10 === 0) {
      console.log('🗺️ Signal Map size:', signalMap.size);
      console.log('🗺️ Sensor Map size:', sensorMap.size);
      console.log('🎯 Widgets para atualizar:', viewerState.widgets.length);
    }
    
    // Atualizar widgets
    let updatedCount = 0;
    let notFoundCount = 0;
    
    viewerState.widgets.forEach((w, index) => {
      let value = null;
      
      if (w.type === 'can-signal') {
        value = signalMap.get(w.sourceId) ?? signalMap.get(w.name);
      } else if (w.type === 'sensor') {
        value = sensorMap.get(w.name) ?? sensorMap.get(w.sourceId);
      }
      
      if (value !== null && !isNaN(value)) {
        try {
          updateWidget(w.id, value);
          updatedCount++;
          
          // Log dos primeiros updates e a cada 10
          if (updateCount <= 3 || updateCount % 10 === 0) {
            if (index < 3) {
              console.log(`✅ Widget ${w.name} (${w.id}) atualizado para:`, value);
            }
          }
        } catch (err) {
          console.error(`❌ Erro ao atualizar widget ${w.id}:`, err);
          errorCount++;
        }
      } else {
        notFoundCount++;
        if (updateCount <= 3) {
          console.warn(`⚠️ Widget ${w.name} (${w.id}) - dado não encontrado. sourceId:`, w.sourceId, 'name:', w.name);
        }
      }
    });
    
    if (updateCount <= 3 || updateCount % 10 === 0) {
      console.log(`📊 Resumo: ${updatedCount} atualizados, ${notFoundCount} não encontrados`);
      const elapsed = performance.now() - startTime;
      console.log(`⏱️ Tempo total: ${elapsed.toFixed(2)}ms\n`);
    }
    
    viewerState.lastUpdate = Date.now();
    const lastUpdateEl = document.getElementById('lastUpdate');
    if (lastUpdateEl) {
      lastUpdateEl.textContent = new Date().toLocaleTimeString('pt-BR');
    }

  } catch (err) {
    clearTimeout(timeoutId);
    errorCount++;
    
    if (err.name === 'AbortError') {
      console.warn('⚠️ Timeout (>5s)');
    } else {
      console.error('❌ Erro crítico no refresh:', err);
      console.error('Stack:', err.stack);
    }
  } finally {
    isFetching = false; 
  }
}

document.getElementById('refreshInterval').addEventListener('change', (e) => {
  const newInterval = parseInt(e.target.value) || 1000;
  viewerState.refreshInterval = newInterval;
  if (viewerState.isLive) {
    stopLive();
    startLive();
  }
});