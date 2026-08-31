function saveRule() {
  if (state.selectedBits.size === 0) { showToast('Selecione pelo menos 1 bit!', true); return; }
  const sn = document.getElementById('signalName').value.trim();
  if (!sn) { showToast('Informe o nome do sinal!', true); return; }
  const rule = {
    id: state.editingRuleId || ('rule_' + Date.now() + '_' + Math.random().toString(36).substr(2,5)),
    canId: document.getElementById('canId').value.trim(),
    signalName: sn,
    startBit: parseInt(document.getElementById('startBit').value),
    bitLength: parseInt(document.getElementById('bitLength').value),
    byteOrder: document.getElementById('byteOrder').value,
    signed: document.getElementById('signed').checked,
    factor: parseFloat(document.getElementById('factor').value) || 1,
    offset: parseFloat(document.getElementById('offset').value) || 0,
    unit: document.getElementById('unit').value,
    minValue: parseFloat(document.getElementById('minValue').value) || undefined,
    maxValue: parseFloat(document.getElementById('maxValue').value) || undefined
  };
  const idx = state.rules.findIndex(r => r.id === rule.id);
  if (idx >= 0) { state.rules[idx] = rule; showToast(`✅ "${sn}" atualizada!`); }
  else { state.rules.push(rule); showToast(`✅ "${sn}" criada!`); }
  state.editingRuleId = rule.id;
  updateEditingIndicator(); renderRulesList(); updateRulesCount();
}

function loadRule(rid) {
  const rule = state.rules.find(r => r.id === rid);
  if (!rule) return;

  // 1. Marca a regra como "em edição"
  state.editingRuleId = rid;

  // 2. Atualiza o CAN ID no input (importante!)
  document.getElementById('canId').value = rule.canId;

  // 3. Preenche os campos do formulário
  document.getElementById('signalName').value = rule.signalName;
  document.getElementById('startBit').value = rule.startBit;
  document.getElementById('bitLength').value = rule.bitLength;
  document.getElementById('byteOrder').value = rule.byteOrder;
  document.getElementById('signed').checked = rule.signed;
  document.getElementById('factor').value = rule.factor;
  document.getElementById('offset').value = rule.offset;
  document.getElementById('unit').value = rule.unit;
  document.getElementById('minValue').value = rule.minValue || '';
  document.getElementById('maxValue').value = rule.maxValue || '';

  // 4. ✨ DESTACA OS BITS NA MATRIZ
  state.selectedBits.clear();
  for (let i = rule.startBit; i < rule.startBit + rule.bitLength; i++) {
    if (i < 64) state.selectedBits.add(i);
  }

  // 5. Atualiza a interface
  updateSelectionInputs();
  updateEditingIndicator();
  renderRulesList();
  
  // 6. 🎯 ESTA ERA A LINHA FALTANTE!
  renderBitMatrix();

  // 7. Feedback visual
  showToast(`📝 Editando "${rule.signalName}" (${rule.bitLength} bits)`);
}

function newRule() {
  state.editingRuleId = null;
  document.getElementById('signalName').value = '';
  document.getElementById('startBit').value = '0';
  document.getElementById('bitLength').value = '1';
  document.getElementById('factor').value = '1';
  document.getElementById('offset').value = '0';
  document.getElementById('unit').value = '';
  document.getElementById('signed').checked = false;
  document.getElementById('minValue').value = '';
  document.getElementById('maxValue').value = '';
  clearSelection(); updateEditingIndicator(); renderRulesList();
  showToast('🆕 Modo nova regra');
}

function deleteRule(rid) {
  const r = state.rules.find(x => x.id === rid);
  state.rules = state.rules.filter(x => x.id !== rid);
  if (state.editingRuleId === rid) { state.editingRuleId = null; updateEditingIndicator(); }
  renderRulesList(); updateRulesCount();
  showToast(`🗑️ "${r?.signalName || ''}" removida`);
}

function clearRules() {
  if (!state.rules.length) return;
  if (!confirm('Remover todas?')) return;
  state.rules = []; state.editingRuleId = null;
  renderRulesList(); updateRulesCount(); updateEditingIndicator();
}

function updateEditingIndicator() {
  const ind = document.getElementById('editingIndicator');
  const nm = document.getElementById('editingRuleName');
  if (state.editingRuleId) {
    const r = state.rules.find(x => x.id === state.editingRuleId);
    if (r) { ind.style.display = 'inline-block'; nm.textContent = r.signalName; }
    else ind.style.display = 'none';
  } else ind.style.display = 'none';
}

function renderRulesList() {
  const c = document.getElementById('rulesList');
  if (!state.rules.length) {
    c.innerHTML = '<div class="empty-state"><div class="icon"></div><div>Nenhuma regra</div></div>';
    return;
  }
  c.innerHTML = state.rules.map(rule => {
    const saved = new Set(state.selectedBits);
    state.selectedBits.clear();
    for (let i = rule.startBit; i < rule.startBit + rule.bitLength; i++) state.selectedBits.add(i);
    const raw = extractSignalValue();
    const phys = raw * rule.factor + rule.offset;
    state.selectedBits = saved;
    const active = rule.id === state.editingRuleId;
    return `<div class="rule-card ${active?'active':''}" onclick="loadRule('${rule.id}')">
      <div class="rule-card-header">
        <div class="rule-name">${active?'✏️ ':''}${rule.signalName}</div>
        <div class="rule-canid">${rule.canId}</div>
      </div>
      <div class="rule-meta">
        <span>start:${rule.startBit}</span><span>len:${rule.bitLength}</span>
        <span>${rule.byteOrder}</span><span>${rule.signed?'signed':'unsigned'}</span>
        <span>×${rule.factor}</span><span>+${rule.offset}</span>
      </div>
      <div class="rule-value">${phys.toFixed(3)} ${rule.unit}</div>
      <div class="rule-actions">
        <button class="btn-mini" onclick="event.stopPropagation();loadRule('${rule.id}')">✏️</button>
        <button class="btn-mini" onclick="event.stopPropagation();deleteRule('${rule.id}')" style="color:var(--red);">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function updateRulesCount() {
  const el = document.getElementById('rulesCount');
  if (el) el.textContent = state.rules.length ? `(${state.rules.length})` : '';
}

async function loadRulesFromApi() {
  try {
    const res = await apiRequest('GET', '/decoding/rules');
    if (!res.success) { showToast('❌ Erro: ' + (res.data.error||''), true); return; }
    const arr = res.data.data || res.data || [];
    if (!Array.isArray(arr) || !arr.length) { showToast('⚠️ Nenhuma regra na API', true); return; }
    state.rules = arr.map(r => ({
      id: r.id || 'api_' + Math.random().toString(36).substr(2,8),
      canId: r.canId, signalName: r.signalName,
      startBit: r.startBit, bitLength: r.bitLength,
      byteOrder: r.byteOrder || 'big', signed: r.signed ?? false,
      factor: r.factor ?? 1, offset: r.offset ?? 0,
      unit: r.unit || '', minValue: r.minValue, maxValue: r.maxValue
    }));
    state.editingRuleId = null;
    renderRulesList(); updateRulesCount(); updateEditingIndicator();
    showToast(`✅ ${state.rules.length} regras carregadas!`);
  } catch (e) { showToast('❌ ' + e.message, true); }
}

async function syncRulesToApi() {
  if (!state.rules.length) { showToast('Nenhuma regra!', true); return; }
  const p = state.rules.map(r => ({ canId:r.canId, signalName:r.signalName, startBit:r.startBit, bitLength:r.bitLength, byteOrder:r.byteOrder, signed:r.signed, factor:r.factor, offset:r.offset, unit:r.unit }));
  const r = await apiRequest('POST', '/decoding/rules', p);
  if (r.success) showToast(`✅ ${state.rules.length} regras sincronizadas!`);
  else showToast('Erro: ' + (r.data.error||''), true);
}
