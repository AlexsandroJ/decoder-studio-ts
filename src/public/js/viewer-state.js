/**
 * Estado global do Viewer
 */
const viewerState = {
  baseUrl: 'https://localhost:3001/api',
  isLive: false,
  refreshInterval: 1000,
  refreshTimer: null,
  lastUpdate: null,
  
  // Widgets ativos (cada um representa um dado visualizado)
  widgets: [],
  
  // Dados brutos da API (cache)
  availableSignals: [],  // sinais CAN decodificados
  availableSensors: [],  // sensores
  
  // Histórico de valores (para sparklines)
  valueHistory: {}, // { widgetId: [val1, val2, ...] }
  MAX_HISTORY: 30
};

// Carrega estado salvo
function loadViewerState() {
  const saved = localStorage.getItem('viewer-widgets');
  if (saved) {
    try {
      viewerState.widgets = JSON.parse(saved);
    } catch(e) {
      viewerState.widgets = [];
    }
  }
  
  const url = localStorage.getItem('viewer-baseUrl');
  if (url) {
    viewerState.baseUrl = url;
    document.getElementById('baseUrl').value = url;
  }
}

function saveViewerState() {
  localStorage.setItem('viewer-widgets', JSON.stringify(viewerState.widgets));
  localStorage.setItem('viewer-baseUrl', viewerState.baseUrl);
}