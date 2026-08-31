function renderBitMatrix() {
  const c = document.getElementById('bitMatrix');
  let h = '<div class="bit-indexes">';
  for (let b = 7; b >= 0; b--) h += `<span>bit${b}</span>`;
  h += '</div>';

  for (let bi = 0; bi < 8; bi++) {
    h += `<div class="bit-row">`;
    h += `<div class="byte-label">Byte ${bi}<br><span style="color:var(--cyan);font-size:10px;">0x${state.bytes[bi].toString(16).toUpperCase().padStart(2,'0')}</span></div>`;
    h += `<div class="byte-bits">`;
    for (let bp = 7; bp >= 0; bp--) {
      const gi = bi * 8 + (7 - bp);
      const bv = (state.bytes[bi] >> bp) & 1;
      const sel = state.selectedBits.has(gi);
      let cls = 'bit ' + (sel ? 'selected' : bv ? 'on' : 'off');
      h += `<div class="${cls}" onclick="handleBitClick(event,${gi})" onmousedown="handleBitMouseDown(event,${gi})" onmouseover="handleBitMouseOver(event,${gi})">${bv}<span class="bit-index">${gi}</span></div>`;
    }
    h += `</div><div class="byte-value">= ${state.bytes[bi]}</div></div>`;
  }
  c.innerHTML = h;
  updatePreview();
}

let isDragging = false, dragMode = null;

function handleBitMouseDown(e, bi) {
  if (e.shiftKey) return;
  isDragging = true;
  if (state.selectedBits.has(bi)) { dragMode = 'remove'; state.selectedBits.delete(bi); }
  else { dragMode = 'add'; state.selectedBits.add(bi); }
  state.lastClickedBit = bi;
  renderBitMatrix(); updateSelectionInputs();
}

function handleBitMouseOver(e, bi) {
  if (!isDragging) return;
  if (dragMode === 'add') state.selectedBits.add(bi); else state.selectedBits.delete(bi);
  renderBitMatrix(); updateSelectionInputs();
}

document.addEventListener('mouseup', () => { isDragging = false; dragMode = null; });

function handleBitClick(e, bi) {
  if (e.shiftKey && state.lastClickedBit !== null) {
    const s = Math.min(state.lastClickedBit, bi), en = Math.max(state.lastClickedBit, bi);
    for (let i = s; i <= en; i++) state.selectedBits.add(i);
    renderBitMatrix(); updateSelectionInputs();
  } else if (!isDragging) {
    const byteIdx = Math.floor(bi / 8), bitPos = 7 - (bi % 8);
    state.bytes[byteIdx] ^= (1 << bitPos);
    renderBitMatrix(); updateHexInput();
  }
}

function clearSelection() { state.selectedBits.clear(); renderBitMatrix(); updateSelectionInputs(); }
function selectAllBits() { state.selectedBits.clear(); for (let i = 0; i < 64; i++) state.selectedBits.add(i); renderBitMatrix(); updateSelectionInputs(); }

function updateSelectionInputs() {
  if (state.selectedBits.size === 0) { document.getElementById('selectionBadge').textContent = '0 bits'; return; }
  const sorted = [...state.selectedBits].sort((a,b) => a-b);
  document.getElementById('startBit').value = sorted[0];
  document.getElementById('bitLength').value = sorted.length;
  document.getElementById('selectionBadge').textContent = `${sorted.length} bits (start: ${sorted[0]})`;
  updatePreview();
}

function updateSelectionFromInputs() {
  const s = parseInt(document.getElementById('startBit').value) || 0;
  const l = parseInt(document.getElementById('bitLength').value) || 1;
  state.selectedBits.clear();
  for (let i = s; i < s + l && i < 64; i++) state.selectedBits.add(i);
  document.getElementById('selectionBadge').textContent = `${l} bits (start: ${s})`;
  renderBitMatrix();
}

function updateFromHex() {
  const hex = document.getElementById('hexData').value.replace(/[^0-9a-fA-F]/g, '');
  state.bytes = new Array(8).fill(0);
  for (let i = 0; i < 8 && i*2 < hex.length; i++) {
    const bh = hex.substr(i*2, 2);
    if (bh.length > 0) state.bytes[i] = parseInt(bh.padStart(2,'0'), 16);
  }
  renderBitMatrix();
}

function updateHexInput() {
  document.getElementById('hexData').value = state.bytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join('');
}

function handleCanIdChange() {
  if (state.editingRuleId) {
    const rule = state.rules.find(r => r.id === state.editingRuleId);
    if (rule) { rule.canId = document.getElementById('canId').value.trim(); renderRulesList(); }
  }
}

function extractSignalValue() {
  if (state.selectedBits.size === 0) return 0;
  const start = parseInt(document.getElementById('startBit').value) || 0;
  const length = parseInt(document.getElementById('bitLength').value) || 1;
  const byteOrder = document.getElementById('byteOrder').value;
  const signed = document.getElementById('signed').checked;
  let buf = 0n;
  for (const b of state.bytes) buf = (buf << 8n) | BigInt(b);
  let adj = start;
  if (byteOrder === 'little') { adj = (7 - Math.floor(start/8)) * 8 + (start % 8); }
  else { adj = 63 - start; }
  const end = adj - length + 1;
  if (end < 0) return 0;
  const mask = (1n << BigInt(length)) - 1n;
  let raw = Number((buf >> BigInt(end)) & mask);
  if (signed && raw >= (1 << (length - 1))) raw -= (1 << length);
  return raw;
}

function updatePreview() {
  const raw = extractSignalValue();
  const f = parseFloat(document.getElementById('factor').value) || 1;
  const o = parseFloat(document.getElementById('offset').value) || 0;
  const u = document.getElementById('unit').value || '';
  const phys = raw * f + o;
  document.getElementById('previewRaw').textContent = '0x' + (raw & 0xFFFFFFFF).toString(16).toUpperCase();
  document.getElementById('previewDecimal').textContent = raw;
  document.getElementById('previewPhysical').textContent = `${phys.toFixed(4)} ${u}`.trim();
  renderRulesList();
}
