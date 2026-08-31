async function mergeUnified() {
  const w = parseInt(document.getElementById('mergeWindow').value) || 1000;
  const r = await apiRequest('POST', '/unified/merge', { windowMs: w });
  showResponse('unifiedResponse', r.data, r.success);
  refreshRawData();
}

async function listUnified() {
  const s = document.getElementById('unifiedSource').value;
  const l = document.getElementById('unifiedLimit').value;
  let ep = '/unified?limit=' + l;
  if (s) ep += '&source=' + s;
  const r = await apiRequest('GET', ep);
  showResponse('unifiedResponse', r.data, r.success);
}

async function clearUnified() { const r = await apiRequest('DELETE', '/unified'); showResponse('unifiedResponse', r.data, r.success); state.rawData = []; renderRawData(); }
