#!/bin/bash
set -e

PROJECT_DIR="can-decoder-studio"

echo "🔧 Criando estrutura do CAN Signal Decoder Studio..."

# Criar diretórios
mkdir -p "$PROJECT_DIR"/{css,js,public}

# ════════════════════════════════════════════════════════
#  1. CSS - VARIÁVEIS DE TEMA
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/css/variables.css" << 'EOF'
:root {
  --bg-dark: #0d1117;
  --bg-panel: #161b22;
  --bg-elevated: #1c2128;
  --bg-hover: #2d333b;
  --border: #30363d;
  --border-bright: #484f58;
  --text: #c9d1d9;
  --text-dim: #8b949e;
  --text-bright: #f0f6fc;
  --accent: #58a6ff;
  --green: #3fb950;
  --green-dim: #238636;
  --red: #f85149;
  --orange: #d29922;
  --purple: #bc8cff;
  --cyan: #39d2c0;
  --bit-off: #21262d;
  --bit-on: #1f6feb;
  --bit-selected: #f78166;
  --bit-hover: #388bfd;
  --shadow: rgba(0, 0, 0, 0.4);
}

[data-theme="light"] {
  --bg-dark: #ffffff;
  --bg-panel: #f6f8fa;
  --bg-elevated: #ffffff;
  --bg-hover: #f3f4f6;
  --border: #d0d7de;
  --border-bright: #afb8c1;
  --text: #1f2328;
  --text-dim: #656d76;
  --text-bright: #0d1117;
  --accent: #0969da;
  --green: #1a7f37;
  --green-dim: #2da042;
  --red: #cf222e;
  --orange: #bf8700;
  --purple: #8250df;
  --cyan: #0550ae;
  --bit-off: #eaeef2;
  --bit-on: #0969da;
  --bit-selected: #d18616;
  --bit-hover: #0969da;
  --shadow: rgba(0, 0, 0, 0.1);
}
EOF

# ════════════════════════════════════════════════════════
#  2. CSS - BASE
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/css/base.css" << 'EOF'
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-dark);
  color: var(--text);
  min-height: 100vh;
  padding: 20px;
  font-size: 14px;
  transition: background 0.3s, color 0.3s;
}

.container { max-width: 1800px; margin: 0 auto; }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg-dark); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-bright); }
EOF

# ════════════════════════════════════════════════════════
#  3. CSS - LAYOUT
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/css/layout.css" << 'EOF'
header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

header h1 {
  font-size: 1.6em; color: var(--text-bright);
  display: flex; align-items: center; gap: 12px;
}

header h1 .logo {
  background: linear-gradient(135deg, var(--accent), var(--purple));
  width: 40px; height: 40px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3em;
}

.header-config { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

.header-config input {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 8px 12px;
  border-radius: 6px;
  font-family: 'Consolas', monospace;
  width: 260px;
}

.header-config input:focus { outline: none; border-color: var(--accent); }

.main-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
  margin-bottom: 20px;
}

.panel {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex; justify-content: space-between; align-items: center;
  background: var(--bg-elevated);
  flex-wrap: wrap;
  gap: 8px;
}

.panel-header h2 {
  font-size: 1.1em; color: var(--text-bright);
  display: flex; align-items: center; gap: 10px;
}

.panel-body { padding: 20px; }

.tabs { display: flex; border-bottom: 1px solid var(--border); background: var(--bg-elevated); overflow-x: auto; }
.tab { padding: 12px 20px; cursor: pointer; color: var(--text-dim); font-weight: 600; font-size: 13px; border-bottom: 2px solid transparent; transition: all 0.15s; white-space: nowrap; }
.tab:hover { color: var(--text); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }
.tab-content { display: none; }
.tab-content.active { display: block; }
EOF

# ════════════════════════════════════════════════════════
#  4. CSS - COMPONENTES
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/css/components.css" << 'EOF'
.frame-input-row {
  display: grid;
  grid-template-columns: 180px 1fr 100px;
  gap: 12px;
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-dim);
  margin-bottom: 6px;
  font-weight: 600;
}

.input-group input, .input-group select {
  width: 100%;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-bright);
  padding: 10px 12px;
  border-radius: 6px;
  font-family: 'Consolas', monospace;
  font-size: 14px;
}

.input-group input:focus, .input-group select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(88,166,255,0.15);
}

.btn-mini {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-dim);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-mini:hover {
  background: var(--bg-hover);
  color: var(--text-bright);
  border-color: var(--border-bright);
}

.btn {
  padding: 10px 18px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--bg-elevated);
  color: var(--text);
}

.btn:hover { background: var(--bg-hover); border-color: var(--border-bright); }
.btn-primary { background: var(--green-dim); color: white; border-color: var(--green); }
.btn-primary:hover { background: var(--green); }
.btn-accent { background: #1f6feb; color: white; border-color: var(--accent); }
.btn-accent:hover { background: var(--accent); }
.btn-danger { background: transparent; color: var(--red); border-color: var(--red); }
.btn-danger:hover { background: var(--red); color: white; }

.action-bar { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }

.empty-state { text-align: center; padding: 40px 20px; color: var(--text-dim); }
.empty-state .icon { font-size: 3em; margin-bottom: 10px; opacity: 0.3; }

.toast {
  position: fixed; bottom: 20px; right: 20px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-left: 4px solid var(--green);
  padding: 12px 20px; border-radius: 6px;
  box-shadow: 0 8px 24px var(--shadow);
  z-index: 1000;
  transform: translateX(400px);
  transition: transform 0.3s;
}

.toast.show { transform: translateX(0); }
.toast.error { border-left-color: var(--red); }

.response-box {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 12px;
}

.response-box pre { font-family: 'Consolas', monospace; font-size: 12px; color: var(--text); white-space: pre-wrap; word-break: break-word; }
.response-box.success { border-color: var(--green); }
.response-box.error { border-color: var(--red); }

.simple-form textarea {
  width: 100%; min-height: 140px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-bright);
  padding: 12px; border-radius: 6px;
  font-family: 'Consolas', monospace;
  font-size: 13px;
  resize: vertical; margin-bottom: 12px;
}

.simple-form textarea:focus { outline: none; border-color: var(--accent); }

.detail-modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  z-index: 2000;
  display: flex; align-items: center; justify-content: center;
}

.detail-modal {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 90%; max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px;
}

.detail-modal h3 { color: var(--text-bright); margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
.detail-modal pre {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 16px;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  color: var(--green);
  white-space: pre-wrap;
  word-break: break-word;
}

.signal-editor {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.signal-editor h3 {
  font-size: 0.95em; color: var(--text-bright);
  margin-bottom: 14px;
  display: flex; align-items: center; gap: 8px;
  flex-wrap: wrap;
}

.signal-editor h3 .badge {
  background: var(--bit-selected);
  color: white;
  padding: 2px 8px; border-radius: 10px;
  font-size: 11px; font-weight: 600;
}

.editing-indicator {
  background: var(--orange);
  color: white;
  padding: 2px 8px; border-radius: 10px;
  font-size: 11px; font-weight: 600;
  margin-left: auto;
}

.signal-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.signal-form .full-width { grid-column: 1 / -1; }

.signal-form input, .signal-form select {
  width: 100%;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-bright);
  padding: 8px 10px; border-radius: 6px;
  font-family: 'Consolas', monospace;
  font-size: 13px;
}

.signal-form input:focus, .signal-form select:focus { outline: none; border-color: var(--accent); }

.checkbox-row { display: flex; gap: 16px; align-items: center; padding: 8px 0; flex-wrap: wrap; }
.checkbox-row label { display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--text); font-size: 13px; }
.checkbox-row input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--accent); }

.preview-box {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px;
  margin-top: 14px;
}

.preview-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed var(--border);
}

.preview-row:last-child { border-bottom: none; }

.preview-label { color: var(--text-dim); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }

.preview-value { color: var(--green); font-family: 'Consolas', monospace; font-size: 15px; font-weight: 600; }
.preview-value.big { font-size: 22px; color: var(--cyan); }

.rules-list { display: flex; flex-direction: column; gap: 10px; max-height: 600px; overflow-y: auto; }

.rule-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.rule-card:hover { border-color: var(--accent); transform: translateX(2px); }
.rule-card.active { border-color: var(--bit-selected); background: rgba(247,129,102,0.05); box-shadow: 0 0 0 2px rgba(247,129,102,0.2); }

.rule-card-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px; }
.rule-name { color: var(--text-bright); font-weight: 600; font-size: 14px; }
.rule-canid { background: var(--bg-dark); color: var(--purple); padding: 2px 8px; border-radius: 4px; font-family: 'Consolas', monospace; font-size: 11px; }
.rule-meta { display: flex; gap: 8px; flex-wrap: wrap; font-size: 11px; color: var(--text-dim); margin-bottom: 8px; }
.rule-meta span { background: var(--bg-dark); padding: 2px 6px; border-radius: 3px; font-family: 'Consolas', monospace; }
.rule-value { color: var(--green); font-family: 'Consolas', monospace; font-weight: 600; font-size: 16px; }
.rule-actions { display: flex; gap: 6px; margin-top: 8px; }
.rule-actions button { padding: 4px 8px; font-size: 11px; }

.raw-data-container {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  margin-top: 12px;
}

.raw-data-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
  gap: 10px;
  flex-wrap: wrap;
}

.raw-data-toolbar .filters { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.raw-data-toolbar select, .raw-data-toolbar input {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 6px 10px; border-radius: 4px;
  font-size: 12px;
  font-family: 'Consolas', monospace;
}

.raw-data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.raw-data-table thead { background: var(--bg-elevated); position: sticky; top: 0; z-index: 1; }
.raw-data-table th {
  padding: 10px 12px; text-align: left;
  color: var(--text-dim); font-weight: 600;
  font-size: 11px; text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
}
.raw-data-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); font-family: 'Consolas', monospace; color: var(--text); vertical-align: top; }
.raw-data-table tbody tr { transition: background 0.1s; }
.raw-data-table tbody tr:hover { background: var(--bg-hover); }

.hex-data { color: var(--cyan); font-weight: 600; letter-spacing: 1px; }
.can-id-cell { color: var(--purple); font-weight: 600; }
.timestamp-cell { color: var(--text-dim); font-size: 11px; }

.signal-chip { display: inline-block; background: var(--bg-elevated); border: 1px solid var(--border); padding: 2px 8px; border-radius: 10px; font-size: 11px; margin: 1px 2px; }
.signal-chip .name { color: var(--text-dim); margin-right: 4px; }
.signal-chip .val { color: var(--green); font-weight: 600; }

.source-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
.source-badge.can { background: rgba(188,140,255,0.15); color: var(--purple); }
.source-badge.sensor { background: rgba(57,210,192,0.15); color: var(--cyan); }
.source-badge.merged { background: rgba(247,129,102,0.15); color: var(--bit-selected); }

.raw-data-scroll { max-height: 500px; overflow-y: auto; }
.raw-data-empty { text-align: center; padding: 40px; color: var(--text-dim); }
.raw-data-stats { display: flex; gap: 16px; padding: 10px 16px; background: var(--bg-elevated); border-top: 1px solid var(--border); font-size: 11px; color: var(--text-dim); flex-wrap: wrap; }
.raw-data-stats span { display: flex; align-items: center; gap: 4px; }
.raw-data-stats .count { color: var(--text-bright); font-weight: 600; }

/* Theme Toggle Button */
.theme-toggle {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.theme-toggle:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
}
EOF

# ════════════════════════════════════════════════════════
#  5. CSS - BIT MATRIX
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/css/bit-matrix.css" << 'EOF'
.bit-matrix-container {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.bit-matrix-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.bit-matrix-header h3 { font-size: 0.95em; color: var(--text-bright); }

.bit-matrix-actions { display: flex; gap: 6px; }

.bit-row { display: flex; align-items: center; gap: 8px; }

.byte-label {
  width: 60px;
  color: var(--text-dim);
  font-size: 11px;
  font-weight: 600;
  text-align: right;
}

.byte-bits { display: flex; gap: 3px; flex: 1; flex-wrap: wrap; }

.bit {
  width: 40px; height: 40px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: all 0.1s;
  border: 2px solid transparent;
  user-select: none;
  position: relative;
}

.bit.off { background: var(--bit-off); color: var(--text-dim); }
.bit.on { background: var(--bit-on); color: white; box-shadow: 0 0 8px rgba(31,111,235,0.4); }
.bit.selected { background: var(--bit-selected); color: white; border-color: #ffa657; box-shadow: 0 0 10px rgba(247,129,102,0.5); }
.bit:hover { transform: scale(1.08); border-color: var(--bit-hover); }
.bit .bit-index { position: absolute; top: 1px; right: 3px; font-size: 8px; opacity: 0.5; }

.byte-value { width: 60px; color: var(--cyan); font-size: 13px; font-weight: 600; }

.bit-indexes { display: flex; gap: 3px; margin-left: 68px; margin-bottom: 4px; flex-wrap: wrap; }
.bit-indexes span { width: 40px; text-align: center; font-size: 10px; color: var(--text-dim); font-family: 'Consolas', monospace; }
EOF

# ════════════════════════════════════════════════════════
#  6. CSS - ANALYZER
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/css/analyzer.css" << 'EOF'
.byte-analyzer-container { display: grid; grid-template-columns: 280px 1fr; gap: 20px; min-height: 600px; }

.byte-analyzer-sidebar {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.byte-analyzer-sidebar-header { padding: 16px; background: var(--bg-elevated); border-bottom: 1px solid var(--border); }
.byte-analyzer-sidebar-header h3 { color: var(--text-bright); font-size: 14px; margin-bottom: 8px; }
.byte-analyzer-sidebar-header input {
  width: 100%;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 6px 10px; border-radius: 4px;
  font-size: 12px;
  font-family: 'Consolas', monospace;
}

.can-id-list { max-height: 500px; overflow-y: auto; }

.can-id-item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: all 0.15s;
  display: flex; justify-content: space-between; align-items: center;
}

.can-id-item:hover { background: var(--bg-hover); }
.can-id-item.active { background: rgba(88, 166, 255, 0.1); border-left: 3px solid var(--accent); }
.can-id-item .id { color: var(--purple); font-family: 'Consolas', monospace; font-weight: 600; font-size: 14px; }
.can-id-item .count { color: var(--text-dim); font-size: 11px; background: var(--bg-elevated); padding: 2px 8px; border-radius: 10px; }

.byte-analyzer-main { display: flex; flex-direction: column; gap: 20px; }

.byte-matrix-visual { background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; padding: 20px; }
.byte-matrix-visual h3 { color: var(--text-bright); font-size: 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.byte-matrix-visual h3 .can-id-display { color: var(--purple); font-family: 'Consolas', monospace; font-size: 18px; }

.byte-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 12px; margin-bottom: 20px; }

.byte-cell {
  background: var(--bg-elevated);
  border: 2px solid var(--border);
  border-radius: 8px;
  padding: 16px 12px;
  text-align: center;
  transition: all 0.3s;
  position: relative;
}

.byte-cell.increased {
  background: rgba(63, 185, 80, 0.2);
  border-color: var(--green);
  box-shadow: 0 0 12px rgba(63, 185, 80, 0.4);
}

.byte-cell.decreased {
  background: rgba(248, 81, 73, 0.2);
  border-color: var(--red);
  box-shadow: 0 0 12px rgba(248, 81, 73, 0.4);
}

.byte-cell .byte-index { font-size: 10px; color: var(--text-dim); text-transform: uppercase; margin-bottom: 8px; }
.byte-cell .byte-value { font-family: 'Consolas', monospace; font-size: 24px; font-weight: 700; color: var(--text-bright); margin-bottom: 4px; }
.byte-cell .byte-decimal { font-family: 'Consolas', monospace; font-size: 12px; color: var(--text-dim); }
.byte-cell .byte-label {
  margin-top: 8px;
  padding: 4px 8px;
  background: var(--bg-dark);
  border-radius: 4px;
  font-size: 11px;
  color: var(--cyan);
  cursor: pointer;
  transition: all 0.15s;
}
.byte-cell .byte-label:hover { background: var(--bg-hover); }
.byte-cell .byte-label.empty { color: var(--text-dim); font-style: italic; }
.byte-cell .byte-arrow { position: absolute; top: 4px; right: 4px; font-size: 16px; font-weight: bold; }
.byte-cell.increased .byte-arrow { color: var(--green); }
.byte-cell.decreased .byte-arrow { color: var(--red); }

.translations-table { background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.translations-table-header { padding: 16px; background: var(--bg-elevated); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.translations-table-header h3 { color: var(--text-bright); font-size: 14px; }

.translations-grid { display: grid; grid-template-columns: 80px 1fr 150px 150px; gap: 1px; background: var(--border); }
.translations-grid > div { background: var(--bg-dark); padding: 10px 12px; }
.translations-grid .header { background: var(--bg-elevated); font-size: 11px; text-transform: uppercase; color: var(--text-dim); font-weight: 600; }
.translations-grid input {
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text);
  padding: 4px 6px; border-radius: 3px;
  font-family: 'Consolas', monospace;
  font-size: 12px;
}
.translations-grid input:focus { outline: none; border-color: var(--accent); background: var(--bg-elevated); }
.translations-grid select {
  width: 100%;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text);
  padding: 4px 6px; border-radius: 3px;
  font-size: 12px;
}
.translations-grid select:focus { outline: none; border-color: var(--accent); background: var(--bg-elevated); }

.frames-history { background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.frames-history-header { padding: 16px; background: var(--bg-elevated); border-bottom: 1px solid var(--border); }
.frames-history-header h3 { color: var(--text-bright); font-size: 14px; }

.frames-history-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.frames-history-table thead { background: var(--bg-elevated); position: sticky; top: 0; z-index: 1; }
.frames-history-table th { padding: 10px 12px; text-align: left; color: var(--text-dim); font-weight: 600; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--border); }
.frames-history-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); font-family: 'Consolas', monospace; }
.frames-history-table tbody tr:hover { background: var(--bg-hover); }
.frames-history-scroll { max-height: 300px; overflow-y: auto; }

.byte-history-cell { display: inline-block; padding: 2px 6px; border-radius: 3px; margin: 0 1px; transition: all 0.3s; }
.byte-history-cell.up { background: rgba(63, 185, 80, 0.2); color: var(--green); }
.byte-history-cell.down { background: rgba(248, 81, 73, 0.2); color: var(--red); }
.byte-history-cell.same { color: var(--text-dim); }

.analyzer-controls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.analyzer-controls label { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-dim); }
.analyzer-controls input[type="number"] { width: 80px; background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text); padding: 4px 8px; border-radius: 4px; font-size: 12px; }
EOF

# ════════════════════════════════════════════════════════
#  7. CSS - SNIFFER
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/css/sniffer.css" << 'EOF'
.sniffer-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.sniffer-table thead { background: var(--bg-elevated); position: sticky; top: 0; z-index: 1; }
.sniffer-table th {
  padding: 10px 12px; text-align: left;
  color: var(--text-dim); font-weight: 600;
  font-size: 11px; text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
}
.sniffer-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); font-family: 'Consolas', monospace; color: var(--text); vertical-align: middle; }
.sniffer-table tbody tr { transition: background 0.1s; }
.sniffer-table tbody tr:hover { background: var(--bg-hover); cursor: pointer; }
.sniffer-table tbody tr.selected { background: rgba(88, 166, 255, 0.1); }

.byte-cell-small {
  display: inline-block;
  min-width: 32px;
  padding: 4px 8px;
  border-radius: 4px;
  margin: 0 2px;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  transition: all 0.3s;
}

.byte-cell-small.increased {
  background: rgba(63, 185, 80, 0.35);
  color: var(--green);
  box-shadow: 0 0 8px rgba(63, 185, 80, 0.5);
  font-weight: 700;
}

.byte-cell-small.decreased {
  background: rgba(248, 81, 73, 0.35);
  color: var(--red);
  box-shadow: 0 0 8px rgba(248, 81, 73, 0.5);
  font-weight: 700;
}

.byte-cell-small.same {
  background: var(--bg-elevated);
  color: var(--text);
}

.byte-cell-small.neutral {
  background: var(--bg-elevated);
  color: var(--text-dim);
}

.freq-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: var(--bg-elevated);
  color: var(--cyan);
  font-family: 'Consolas', monospace;
}

.frame-count {
  color: var(--text-dim);
  font-size: 11px;
}

.sniffer-scroll { max-height: 600px; overflow-y: auto; }
EOF

# ════════════════════════════════════════════════════════
#  8. CSS - RESPONSIVO
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/css/responsive.css" << 'EOF'
@media (max-width: 1200px) {
  .main-grid { grid-template-columns: 1fr; }
  .byte-analyzer-container { grid-template-columns: 1fr; }
  .frame-input-row { grid-template-columns: 1fr; }
  .signal-form { grid-template-columns: 1fr; }
  .translations-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  body { padding: 10px; }
  header { padding: 16px; }
  header h1 { font-size: 1.2em; }
  .header-config input { width: 100%; }
  .bit { width: 32px; height: 32px; font-size: 11px; }
  .bit-indexes span { width: 32px; }
  .byte-grid { grid-template-columns: repeat(4, 1fr); }
  .byte-cell .byte-value { font-size: 18px; }
  .panel-body { padding: 12px; }
  .sniffer-table { font-size: 10px; }
  .sniffer-table td, .sniffer-table th { padding: 4px 6px; }
  .byte-cell-small { min-width: 24px; padding: 2px 4px; font-size: 10px; }
}

@media (max-width: 480px) {
  .byte-grid { grid-template-columns: repeat(2, 1fr); }
  .tab { padding: 10px 12px; font-size: 11px; }
  .btn { padding: 8px 12px; font-size: 12px; }
}
EOF

# ════════════════════════════════════════════════════════
#  9. HTML PRINCIPAL
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CAN Signal Decoder Studio</title>
<link rel="stylesheet" href="css/variables.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/layout.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/bit-matrix.css">
<link rel="stylesheet" href="css/analyzer.css">
<link rel="stylesheet" href="css/sniffer.css">
<link rel="stylesheet" href="css/responsive.css">
</head>
<body>
<div class="container">

  <header>
    <h1>
      <span class="logo"></span>
      CAN Signal Decoder Studio
    </h1>
    <div class="header-config">
      <input type="text" id="baseUrl" value="http://localhost:3001/api" placeholder="API URL">
      <button class="btn btn-accent" onclick="checkHealth()">❤️ Health</button>
      <button class="theme-toggle" onclick="toggleTheme()" id="themeToggle">🌙</button>
    </div>
  </header>

  <div class="main-grid">

    <div class="panel">
      <div class="panel-header">
        <h2>📡 Frame CAN — Editor Visual</h2>
        <div style="display:flex; gap:8px;">
          <button class="btn-mini" onclick="loadExampleFrame()">📋 Exemplo</button>
          <button class="btn-mini" onclick="randomizeFrame()">🎲 Aleatório</button>
        </div>
      </div>
      <div class="panel-body">

        <div class="frame-input-row">
          <div class="input-group">
            <label>CAN ID (hex)</label>
            <input type="text" id="canId" value="0x1A3" oninput="handleCanIdChange()">
          </div>
          <div class="input-group">
            <label>Data (hex) — até 8 bytes</label>
            <input type="text" id="hexData" value="E8035A0000000000" oninput="updateFromHex()">
          </div>
          <div class="input-group">
            <label>DLC</label>
            <input type="number" id="dlc" value="8" min="0" max="8">
          </div>
        </div>

        <div class="bit-matrix-container">
          <div class="bit-matrix-header">
            <h3>🔢 Matriz de Bits <span style="color:var(--text-dim); font-weight:normal; font-size:11px;">(clique para alternar • shift+clique para range)</span></h3>
            <div class="bit-matrix-actions">
              <button class="btn-mini" onclick="clearSelection()">Limpar seleção</button>
              <button class="btn-mini" onclick="selectAllBits()">Selecionar todos</button>
            </div>
          </div>
          <div id="bitMatrix"></div>
        </div>

        <div class="signal-editor">
          <h3>
            ✏️ Propriedades do Sinal
            <span class="badge" id="selectionBadge">0 bits</span>
            <span class="editing-indicator" id="editingIndicator" style="display:none;">Editando: <span id="editingRuleName"></span></span>
          </h3>

          <div class="signal-form">
            <div class="input-group full-width">
              <label>Nome do Sinal</label>
              <input type="text" id="signalName" placeholder="Ex: EngineRPM" value="EngineRPM">
            </div>
            <div class="input-group">
              <label>Start Bit</label>
              <input type="number" id="startBit" value="0" min="0" max="63" oninput="updateSelectionFromInputs()">
            </div>
            <div class="input-group">
              <label>Bit Length</label>
              <input type="number" id="bitLength" value="16" min="1" max="64" oninput="updateSelectionFromInputs()">
            </div>
            <div class="input-group">
              <label>Byte Order</label>
              <select id="byteOrder">
                <option value="little">Little Endian (Intel)</option>
                <option value="big">Big Endian (Motorola)</option>
              </select>
            </div>
            <div class="input-group">
              <label>Unit</label>
              <input type="text" id="unit" placeholder="rpm, °C, km/h" value="rpm">
            </div>
            <div class="input-group">
              <label>Factor</label>
              <input type="number" id="factor" value="0.25" step="any">
            </div>
            <div class="input-group">
              <label>Offset</label>
              <input type="number" id="offset" value="0" step="any">
            </div>
            <div class="full-width checkbox-row">
              <label><input type="checkbox" id="signed"> Signed</label>
              <label>Min: <input type="number" id="minValue" step="any" style="width:80px; margin-left:6px; background:var(--bg-elevated); border:1px solid var(--border); color:var(--text); padding:4px 6px; border-radius:4px;"></label>
              <label>Max: <input type="number" id="maxValue" step="any" style="width:80px; margin-left:6px; background:var(--bg-elevated); border:1px solid var(--border); color:var(--text); padding:4px 6px; border-radius:4px;"></label>
            </div>
          </div>

          <div class="preview-box">
            <div class="preview-row">
              <span class="preview-label">Raw Value (hex)</span>
              <span class="preview-value" id="previewRaw">0x0000</span>
            </div>
            <div class="preview-row">
              <span class="preview-label">Raw Value (decimal)</span>
              <span class="preview-value" id="previewDecimal">0</span>
            </div>
            <div class="preview-row">
              <span class="preview-label">Physical Value</span>
              <span class="preview-value big" id="previewPhysical">0 rpm</span>
            </div>
          </div>

          <div class="action-bar">
            <button class="btn btn-primary" onclick="saveRule()">💾 Salvar Regra</button>
            <button class="btn" onclick="newRule()">🆕 Nova Regra</button>
            <button class="btn btn-accent" onclick="sendFrameWithRules()">🚀 Enviar Frame + Regras</button>
            <button class="btn" onclick="sendFrameOnly()">📤 Só Frame</button>
          </div>
        </div>

      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <h2>📖 Regras <span id="rulesCount" style="color:var(--text-dim); font-size:12px; font-weight:normal;"></span></h2>
        <div style="display:flex; gap:6px;">
          <button class="btn-mini" onclick="loadRulesFromApi()">🔄 API</button>
          <button class="btn-mini" onclick="clearRules()">🗑️</button>
        </div>
      </div>
      <div class="panel-body">
        <div id="rulesList" class="rules-list">
          <div class="empty-state">
            <div class="icon">📋</div>
            <div>Nenhuma regra criada</div>
            <div style="font-size:11px; margin-top:6px;">Selecione bits e salve uma regra</div>
          </div>
        </div>
        <div class="action-bar" style="margin-top:16px;">
          <button class="btn btn-accent" onclick="syncRulesToApi()" style="flex:1;">🔄 Sincronizar com API</button>
        </div>
      </div>
    </div>

  </div>

  <div class="panel">
    <div class="tabs">
      <div class="tab active" onclick="switchTab(event,'rawdata')">📊 Dados Brutos</div>
      <div class="tab" onclick="switchTab(event,'analyzer')">🔬 Byte Analyzer</div>
      <div class="tab" onclick="switchTab(event,'sensors')">️ Sensores</div>
      <div class="tab" onclick="switchTab(event,'unified')">🔗 Unified</div>
      <div class="tab" onclick="switchTab(event,'log')">📜 Log</div>
    </div>

    <div class="tab-content active" id="tab-rawdata">
      <div class="panel-body">
        <div class="raw-data-container">
          <div class="raw-data-toolbar">
            <div class="filters">
              <select id="rawDataSource" onchange="renderRawData()">
                <option value="all">Todas as fontes</option>
                <option value="can">CAN Frames</option>
                <option value="sensor">Sensores</option>
                <option value="merged">Merged</option>
              </select>
              <input type="text" id="rawDataFilter" placeholder="🔍 Filtrar..." oninput="renderRawData()" style="width:200px;">
              <select id="rawDataSort" onchange="renderRawData()">
                <option value="time-desc">Mais recente</option>
                <option value="time-asc">Mais antigo</option>
              </select>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="btn-mini" onclick="refreshRawData()">🔄 Atualizar</button>
              <button class="btn-mini" onclick="exportRawData()">💾 Exportar</button>
            </div>
          </div>

          <div class="raw-data-scroll">
            <table class="raw-data-table">
              <thead>
                <tr>
                  <th style="width:130px;">Timestamp</th>
                  <th style="width:70px;">Fonte</th>
                  <th style="width:80px;">CAN ID</th>
                  <th style="width:170px;">Data Bruta</th>
                  <th>Sinais / Leituras</th>
                  <th style="width:60px;">Ações</th>
                </tr>
              </thead>
              <tbody id="rawDataBody">
                <tr><td colspan="6" class="raw-data-empty">Clique em "🔄 Atualizar" para carregar dados</td></tr>
              </tbody>
            </table>
          </div>

          <div class="raw-data-stats">
            <span>Total: <span class="count" id="statTotal">0</span></span>
            <span>CAN: <span class="count" id="statCan">0</span></span>
            <span>Sensor: <span class="count" id="statSensor">0</span></span>
            <span>Merged: <span class="count" id="statMerged">0</span></span>
          </div>
        </div>
      </div>
    </div>

    <div class="tab-content" id="tab-analyzer">
      <div class="panel-body">

        <div class="raw-data-container" style="margin-bottom:20px;">
          <div class="raw-data-toolbar">
            <div style="display:flex; align-items:center; gap:12px;">
              <h3 style="color:var(--text-bright); font-size:14px;">📡 Sniffer — Todos os CAN IDs</h3>
              <span style="color:var(--text-dim); font-size:11px;">(clique em uma linha para analisar)</span>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <input type="text" id="snifferFilter" placeholder="🔍 Filtrar ID..." oninput="renderSnifferTable()" style="width:150px;">
              <button class="btn-mini" onclick="refreshAnalyzer()">🔄 Atualizar</button>
            </div>
          </div>
          <div class="sniffer-scroll">
            <table class="sniffer-table">
              <thead>
                <tr>
                  <th style="width:100px;">CAN ID</th>
                  <th style="width:80px;">Freq</th>
                  <th style="width:60px;">0</th>
                  <th style="width:60px;">1</th>
                  <th style="width:60px;">2</th>
                  <th style="width:60px;">3</th>
                  <th style="width:60px;">4</th>
                  <th style="width:60px;">5</th>
                  <th style="width:60px;">6</th>
                  <th style="width:60px;">7</th>
                  <th style="width:70px;">Frames</th>
                </tr>
              </thead>
              <tbody id="snifferBody">
                <tr><td colspan="11" class="raw-data-empty">Clique em "🔄 Atualizar" para carregar frames</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="byte-analyzer-container">

          <div class="byte-analyzer-sidebar">
            <div class="byte-analyzer-sidebar-header">
              <h3>📋 IDs Disponíveis</h3>
              <input type="text" id="analyzerSearch" placeholder="🔍 Buscar ID..." oninput="renderCanIdList()">
            </div>
            <div class="can-id-list" id="canIdList">
              <div class="empty-state">
                <div class="icon"></div>
                <div>Nenhum CAN ID</div>
                <div style="font-size:11px; margin-top:6px;">Envie frames para ver aqui</div>
              </div>
            </div>
            <div style="padding:12px; border-top:1px solid var(--border);">
              <div class="analyzer-controls">
                <label>
                  <input type="checkbox" id="autoRefresh" checked>
                  Auto-refresh
                </label>
              </div>
              <div class="analyzer-controls" style="margin-top:6px;">
                <label>
                  Intervalo:
                  <input type="number" id="refreshInterval" value="1000" min="100" step="100"> ms
                </label>
              </div>
              <button class="btn-mini" onclick="refreshAnalyzer()" style="width:100%; margin-top:8px;">🔄 Atualizar agora</button>
            </div>
          </div>

          <div class="byte-analyzer-main">

            <div class="byte-matrix-visual">
              <h3>
                🔬 Análise de Bytes —
                <span class="can-id-display" id="analyzerCanId">—</span>
              </h3>
              <div class="byte-grid" id="byteGrid">
                <div class="empty-state" style="grid-column: 1 / -1;">
                  <div class="icon"></div>
                  <div>Selecione um CAN ID na tabela acima</div>
                </div>
              </div>
            </div>

            <div class="translations-table">
              <div class="translations-table-header">
                <h3>📝 Traduções dos Bytes</h3>
                <button class="btn-mini" onclick="exportTranslations()">💾 Exportar</button>
              </div>
              <div class="translations-grid" id="translationsGrid">
                <div class="header">Byte</div>
                <div class="header">Label / Nome</div>
                <div class="header">Tipo</div>
                <div class="header">Valor Atual</div>
              </div>
            </div>

            <div class="frames-history">
              <div class="frames-history-header">
                <h3>📜 Histórico de Frames (últimos 20)</h3>
              </div>
              <div class="frames-history-scroll">
                <table class="frames-history-table">
                  <thead>
                    <tr>
                      <th style="width:140px;">Timestamp</th>
                      <th>Bytes (hex)</th>
                      <th style="width:60px;">DLC</th>
                    </tr>
                  </thead>
                  <tbody id="framesHistoryBody">
                    <tr><td colspan="3" class="raw-data-empty">Nenhum frame ainda</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <div class="tab-content" id="tab-sensors">
      <div class="panel-body">
        <div class="simple-form">
          <div class="input-group">
            <label>Payload JSON</label>
            <textarea id="sensorPayload"></textarea>
          </div>
          <div class="action-bar">
            <button class="btn btn-primary" onclick="sendSensors()">📤 Enviar</button>
            <button class="btn" onclick="listSensors()">📥 Listar</button>
            <button class="btn btn-danger" onclick="clearSensors()">🗑️ Limpar</button>
          </div>
          <div class="response-box" id="sensorResponse"><pre>Aguardando...</pre></div>
        </div>
      </div>
    </div>

    <div class="tab-content" id="tab-unified">
      <div class="panel-body">
        <div class="simple-form">
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:12px;">
            <div class="input-group">
              <label>Filtro (source)</label>
              <select id="unifiedSource" style="width:100%; background:var(--bg-elevated); border:1px solid var(--border); color:var(--text); padding:8px; border-radius:6px;">
                <option value="">Todos</option>
                <option value="can">CAN</option>
                <option value="sensor">Sensor</option>
                <option value="merged">Merged</option>
              </select>
            </div>
            <div class="input-group">
              <label>Window (ms)</label>
              <input type="number" id="mergeWindow" value="1000">
            </div>
            <div class="input-group">
              <label>Limite</label>
              <input type="number" id="unifiedLimit" value="100">
            </div>
          </div>
          <div class="action-bar">
            <button class="btn btn-accent" onclick="mergeUnified()">🔀 Merge</button>
            <button class="btn btn-primary" onclick="listUnified()">📥 Listar</button>
            <button class="btn btn-danger" onclick="clearUnified()">️ Limpar</button>
          </div>
          <div class="response-box" id="unifiedResponse"><pre>Aguardando...</pre></div>
        </div>
      </div>
    </div>

    <div class="tab-content" id="tab-log">
      <div class="panel-body">
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
          <h3 style="color:var(--text-bright);">📜 Histórico</h3>
          <button class="btn-mini" onclick="clearLog()">Limpar</button>
        </div>
        <div class="response-box" id="logBox" style="max-height:500px;"><pre style="color:var(--text-dim);">Nenhuma requisição ainda...</pre></div>
      </div>
    </div>
  </div>

</div>

<div class="toast" id="toast"></div>
<div id="modalContainer"></div>

<script src="js/state.js"></script>
<script src="js/api.js"></script>
<script src="js/theme.js"></script>
<script src="js/bit-matrix.js"></script>
<script src="js/rules.js"></script>
<script src="js/raw-data.js"></script>
<script src="js/analyzer.js"></script>
<script src="js/sensors.js"></script>
<script src="js/unified.js"></script>
<script src="js/log.js"></script>
<script src="js/app.js"></script>
</body>
</html>
EOF

# ════════════════════════════════════════════════════════
#  10. JAVASCRIPT - STATE
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/js/state.js" << 'EOF'
const state = {
  bytes: new Array(8).fill(0),
  selectedBits: new Set(),
  lastClickedBit: null,
  rules: [],
  editingRuleId: null,
  requestLog: [],
  rawData: [],

  analyzer: {
    selectedCanId: null,
    canIds: [],
    framesByCanId: {},
    frequencies: {},
    lastBytes: {},
    translations: {},
    refreshTimer: null
  }
};
EOF

# ════════════════════════════════════════════════════════
#  11. JAVASCRIPT - API
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/js/api.js" << 'EOF'
function getBaseUrl() { return document.getElementById('baseUrl').value.trim(); }

async function apiRequest(method, endpoint, body = null) {
  const url = `${getBaseUrl()}${endpoint}`;
  const start = Date.now();
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body && method !== 'GET') opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json();
    logRequest(method, endpoint, body, data, res.status, Date.now() - start);
    return { success: res.ok, data, status: res.status };
  } catch (err) {
    logRequest(method, endpoint, body, { error: err.message }, 0, Date.now() - start);
    return { success: false, data: { error: err.message }, status: 0 };
  }
}
EOF

# ════════════════════════════════════════════════════════
#  12. JAVASCRIPT - THEME
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/js/theme.js" << 'EOF'
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeButton(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeButton(next);
}

function updateThemeButton(theme) {
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}
EOF

# ════════════════════════════════════════════════════════
#  13. JAVASCRIPT - BIT MATRIX
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/js/bit-matrix.js" << 'EOF'
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
EOF

# ════════════════════════════════════════════════════════
#  14. JAVASCRIPT - RULES
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/js/rules.js" << 'EOF'
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
  state.editingRuleId = rid;
  document.getElementById('canId').value = rule.canId;
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
  state.selectedBits.clear();
  for (let i = rule.startBit; i < rule.startBit + rule.bitLength; i++) state.selectedBits.add(i);
  updateSelectionInputs(); updateEditingIndicator(); renderRulesList();
  showToast(`📝 Editando "${rule.signalName}"`);
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
EOF

# ════════════════════════════════════════════════════════
#  15. JAVASCRIPT - RAW DATA
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/js/raw-data.js" << 'EOF'
async function refreshRawData() {
  try {
    showToast('🔄 Carregando dados...');
    const [unifiedRes, framesRes, sensorsRes] = await Promise.all([
      apiRequest('GET', '/unified?limit=500'),
      apiRequest('GET', '/can/frames?limit=500'),
      apiRequest('GET', '/sensors?limit=500')
    ]);

    const all = [];

    if (framesRes.success) {
      const frames = framesRes.data.data || framesRes.data || [];
      if (Array.isArray(frames)) {
        frames.forEach(f => {
          all.push({
            _type: 'can-frame', id: f.id, timestamp: f.timestamp || 0,
            source: 'can', canId: f.canId || '—', rawData: f.data || '—',
            dlc: f.dlc, signals: null, sensorReadings: null, _original: f
          });
        });
      }
    }

    if (sensorsRes.success) {
      const sensors = sensorsRes.data.data || sensorsRes.data || [];
      if (Array.isArray(sensors)) {
        sensors.forEach(s => {
          all.push({
            _type: 'sensor', id: s.id, timestamp: s.timestamp || 0,
            source: 'sensor', canId: '—',
            rawData: typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value),
            dlc: null, signals: null, sensorReadings: [s], _original: s
          });
        });
      }
    }

    if (unifiedRes.success) {
      const unified = unifiedRes.data.data || unifiedRes.data || [];
      if (Array.isArray(unified)) {
        unified.forEach(u => {
          let canId = '—';
          if (u.canSignals && u.canSignals.length > 0) {
            const firstRuleId = u.canSignals[0].ruleId;
            const matchedRule = state.rules.find(r => r.id === firstRuleId);
            if (matchedRule) canId = matchedRule.canId;
          }
          all.push({
            _type: 'unified', id: u.id, timestamp: u.timestamp || 0,
            source: u.source || 'can', canId,
            rawData: u.canSignals?.[0]?.rawHex || (u.sensorReadings ? JSON.stringify(u.sensorReadings[0]?.value) : '—'),
            dlc: null, signals: u.canSignals || null, sensorReadings: u.sensorReadings || null, _original: u
          });
        });
      }
    }

    state.rawData = all;
    renderRawData();
    showToast(`✅ ${all.length} registros carregados`);
  } catch (e) { showToast('❌ ' + e.message, true); }
}

function renderRawData() {
  const body = document.getElementById('rawDataBody');
  const srcFilter = document.getElementById('rawDataSource').value;
  const txtFilter = document.getElementById('rawDataFilter').value.toLowerCase();
  const sort = document.getElementById('rawDataSort').value;

  let data = [...state.rawData];
  if (srcFilter !== 'all') data = data.filter(r => r.source === srcFilter);
  if (txtFilter) {
    data = data.filter(r => {
      const hay = [r.canId, r.rawData, r.source,
        ...(r.signals || []).map(s => s.signalName + s.value),
        ...(r.sensorReadings || []).map(s => s.sensorId + s.sensorType + JSON.stringify(s.value))
      ].join(' ').toLowerCase();
      return hay.includes(txtFilter);
    });
  }
  data.sort((a, b) => sort === 'time-desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp);

  document.getElementById('statTotal').textContent = state.rawData.length;
  document.getElementById('statCan').textContent = state.rawData.filter(r => r.source === 'can').length;
  document.getElementById('statSensor').textContent = state.rawData.filter(r => r.source === 'sensor').length;
  document.getElementById('statMerged').textContent = state.rawData.filter(r => r.source === 'merged').length;

  if (!data.length) {
    body.innerHTML = `<tr><td colspan="6" class="raw-data-empty">${state.rawData.length ? 'Nenhum resultado para o filtro' : 'Clique em "🔄 Atualizar"'}</td></tr>`;
    return;
  }

  body.innerHTML = data.map(r => {
    const time = r.timestamp
      ? new Date(r.timestamp).toLocaleString('pt-BR', { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' }) + '.' + String(r.timestamp % 1000).padStart(3,'0')
      : '—';
    const badge = `<span class="source-badge ${r.source}">${r.source}</span>`;
    const canIdHtml = r.canId !== '—' ? `<span class="can-id-cell">${r.canId}</span>` : '<span style="color:var(--text-dim);">—</span>';
    const rawHtml = r._type === 'sensor' ? `<span style="color:var(--cyan);">${truncate(r.rawData, 24)}</span>` : `<span class="hex-data">${r.rawData}</span>`;

    let chips = '';
    if (r.signals && r.signals.length) {
      chips += r.signals.map(s => `<span class="signal-chip"><span class="name">${s.signalName}:</span><span class="val">${typeof s.value === 'number' ? s.value.toFixed(2) : s.value} ${s.unit||''}</span></span>`).join('');
    }
    if (r.sensorReadings && r.sensorReadings.length) {
      chips += r.sensorReadings.map(s => {
        const v = typeof s.value === 'object' ? JSON.stringify(s.value) : s.value;
        return `<span class="signal-chip"><span class="name">${s.sensorId||s.sensorType}:</span><span class="val">${truncate(String(v), 20)} ${s.unit||''}</span></span>`;
      }).join('');
    }
    if (!chips) {
      if (r._type === 'can-frame') chips = '<span style="color:var(--orange); font-size:11px;">⚠ Sem decodificação</span>';
      else chips = '<span style="color:var(--text-dim);">—</span>';
    }

    return `<tr>
      <td class="timestamp-cell">${time}</td>
      <td>${badge}</td>
      <td>${canIdHtml}</td>
      <td>${rawHtml}</td>
      <td>${chips}</td>
      <td><button class="btn-mini" onclick="showDetail('${r.id}')" title="Detalhes">🔍</button></td>
    </tr>`;
  }).join('');
}

function truncate(str, max) { return str.length > max ? str.substring(0, max) + '…' : str; }

function showDetail(id) {
  const r = state.rawData.find(x => x.id === id);
  if (!r) return;
  const json = JSON.stringify(r._original || r, null, 2);
  document.getElementById('modalContainer').innerHTML = `
    <div class="detail-modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="detail-modal">
        <h3> Detalhes <button class="btn-mini" onclick="closeModal()">✕ Fechar</button></h3>
        <div style="margin-bottom:12px;">
          <span class="source-badge ${r.source}" style="font-size:12px;">${r.source}</span>
          ${r.canId !== '—' ? `<span class="can-id-cell" style="margin-left:10px;">${r.canId}</span>` : ''}
          <span class="timestamp-cell" style="margin-left:10px;">${new Date(r.timestamp).toLocaleString('pt-BR')}</span>
        </div>
        <pre>${escapeHtml(json)}</pre>
      </div>
    </div>`;
}

function closeModal() { document.getElementById('modalContainer').innerHTML = ''; }
function escapeHtml(str) { return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function exportRawData() {
  if (!state.rawData.length) { showToast('Nenhum dado', true); return; }
  const blob = new Blob([JSON.stringify(state.rawData.map(r => r._original || r), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `can-sensor-${Date.now()}.json`;
  a.click();
  showToast(`💾 ${state.rawData.length} registros exportados`);
}
EOF

# ════════════════════════════════════════════════════════
#  16. JAVASCRIPT - ANALYZER
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/js/analyzer.js" << 'EOF'
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
    const res = await apiRequest('GET', '/can/frames?limit=2000');
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
    const freq = state.analyzer.frequencies[canId] || 0;
    const bytes = hexToBytes(latest.data);
    const prevBytes = prev ? hexToBytes(prev.data) : null;

    const isSelected = canId === state.analyzer.selectedCanId;

    const bytesHtml = bytes.map((b, i) => {
      let cls = 'neutral';
      if (prevBytes) {
        if (b > prevBytes[i]) cls = 'increased';
        else if (b < prevBytes[i]) cls = 'decreased';
        else cls = 'same';
      }
      return `<span class="byte-cell-small ${cls}">${b.toString(16).toUpperCase().padStart(2, '0')}</span>`;
    }).join('');

    return `<tr class="${isSelected ? 'selected' : ''}" onclick="selectCanId('${canId}')">
      <td class="can-id-cell">${canId}</td>
      <td><span class="freq-badge">${freq} Hz</span></td>
      ${bytesHtml}
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
EOF

# ════════════════════════════════════════════════════════
#  17. JAVASCRIPT - SENSORS
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/js/sensors.js" << 'EOF'
async function sendSensors() {
  try {
    const p = JSON.parse(document.getElementById('sensorPayload').value);
    const r = await apiRequest('POST', '/sensors', p);
    showResponse('sensorResponse', r.data, r.success);
    if (r.success) { showToast('✅ Sensores!'); refreshRawData(); }
  } catch (e) { showResponse('sensorResponse', { error: 'JSON inválido: ' + e.message }, false); }
}

async function listSensors() { const r = await apiRequest('GET', '/sensors'); showResponse('sensorResponse', r.data, r.success); }
async function clearSensors() { const r = await apiRequest('DELETE', '/sensors'); showResponse('sensorResponse', r.data, r.success); refreshRawData(); }
EOF

# ════════════════════════════════════════════════════════
#  18. JAVASCRIPT - UNIFIED
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/js/unified.js" << 'EOF'
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
EOF

# ════════════════════════════════════════════════════════
#  19. JAVASCRIPT - LOG
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/js/log.js" << 'EOF'
function logRequest(method, endpoint, reqBody, resData, status, duration) {
  state.requestLog.unshift({ time: new Date().toLocaleTimeString(), method, endpoint, reqBody, resData, status, duration });
  if (state.requestLog.length > 50) state.requestLog.pop();
  renderLog();
}

function renderLog() {
  const box = document.getElementById('logBox');
  if (!state.requestLog.length) { box.innerHTML = '<pre style="color:var(--text-dim);">Nenhuma requisição...</pre>'; return; }
  box.innerHTML = state.requestLog.map(e => {
    const sc = e.status >= 200 && e.status < 300 ? 'var(--green)' : e.status === 0 ? 'var(--red)' : 'var(--orange)';
    return `<div style="border-bottom:1px solid var(--border);padding:8px 0;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        <span><span style="color:var(--text-dim);">${e.time}</span> <span style="background:${sc};color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:6px;">${e.method} ${e.status||'ERR'}</span> <span style="color:var(--accent);margin-left:6px;">${e.endpoint}</span></span>
        <span style="color:var(--text-dim);font-size:11px;">${e.duration}ms</span>
      </div>
      ${e.reqBody ? `<details><summary style="cursor:pointer;color:var(--text-dim);font-size:11px;">Request</summary><pre style="font-size:10px;color:var(--purple);margin-top:4px;">${JSON.stringify(e.reqBody,null,2)}</pre></details>` : ''}
      <details open><summary style="cursor:pointer;color:var(--text-dim);font-size:11px;">Response</summary><pre style="font-size:10px;color:var(--green);margin-top:4px;">${JSON.stringify(e.resData,null,2)}</pre></details>
    </div>`;
  }).join('');
}

function clearLog() { state.requestLog = []; renderLog(); }
EOF

# ════════════════════════════════════════════════════════
#  20. JAVASCRIPT - APP (Inicialização)
# ════════════════════════════════════════════════════════
cat > "$PROJECT_DIR/js/app.js" << 'EOF'
function showToast(msg, err = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (err ? ' error' : '');
  setTimeout(() => t.className = 'toast', 3000);
}

function showResponse(id, data, ok) {
  const el = document.getElementById(id);
  el.className = 'response-box ' + (ok ? 'success' : 'error');
  el.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}

function switchTab(ev, name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  ev.target.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'analyzer') startAutoRefresh();
  else stopAutoRefresh();
}

async function checkHealth() {
  const r = await apiRequest('GET', '/health');
  if (r.success) showToast(`✅ API online! ${r.data.uptime?.toFixed(1)}s`);
  else showToast('❌ Offline: ' + (r.data.error||''), true);
}

function loadExampleFrame() {
  document.getElementById('canId').value = '0x1A3';
  document.getElementById('hexData').value = 'E8035A0000000000';
  document.getElementById('dlc').value = '8';
  updateFromHex();
  showToast('Exemplo carregado');
}

function randomizeFrame() {
  for (let i = 0; i < 8; i++) state.bytes[i] = Math.floor(Math.random() * 256);
  updateHexInput(); renderBitMatrix();
  showToast('🎲 Frame aleatório');
}

async function sendFrameWithRules() {
  if (!state.rules.length) { showToast('Crie regras primeiro!', true); return; }
  const rp = state.rules.map(r => ({ canId:r.canId, signalName:r.signalName, startBit:r.startBit, bitLength:r.bitLength, byteOrder:r.byteOrder, signed:r.signed, factor:r.factor, offset:r.offset, unit:r.unit }));
  const rr = await apiRequest('POST', '/decoding/rules', rp);
  if (!rr.success) { showToast('Erro regras: ' + (rr.data.error||''), true); return; }
  const fp = { canId: document.getElementById('canId').value, dlc: parseInt(document.getElementById('dlc').value), data: state.bytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(''), timestamp: Date.now() };
  const fr = await apiRequest('POST', '/can/frames', fp);
  if (fr.success) { showToast(`✅ Frame + ${state.rules.length} regras!`); refreshRawData(); refreshAnalyzer(); }
  else showToast('Erro: ' + (fr.data.error||''), true);
}

async function sendFrameOnly() {
  const fp = { canId: document.getElementById('canId').value, dlc: parseInt(document.getElementById('dlc').value), data: state.bytes.map(b => b.toString(16).toUpperCase().padStart(2,'0')).join(''), timestamp: Date.now() };
  const r = await apiRequest('POST', '/can/frames', fp);
  if (r.success) { showToast('✅ Frame enviado!'); refreshRawData(); refreshAnalyzer(); }
  else showToast('Erro: ' + (r.data.error||''), true);
}

window.addEventListener('load', () => {
  initTheme();
  document.getElementById('sensorPayload').value = `{\n  "sensorId": "temp-01",\n  "sensorType": "temperature",\n  "value": 25.5,\n  "unit": "°C",\n  "timestamp": ${Date.now()}\n}`;
  updateFromHex(); renderBitMatrix();
  ['factor','offset','unit','signed','byteOrder'].forEach(id => {
    document.getElementById(id).addEventListener('input', updatePreview);
    document.getElementById(id).addEventListener('change', updatePreview);
  });
  setTimeout(() => loadRulesFromApi(), 300);
});
EOF

echo ""
echo "✅ Estrutura criada com sucesso!"
echo ""
echo "📁 Estrutura:"
find "$PROJECT_DIR" -type f | sort | sed 's/^/   /'
echo ""
echo "▶️  Para rodar:"
echo "   cd $PROJECT_DIR"
echo "   python3 -m http.server 8080"
echo ""
echo "🌐 Abra: http://localhost:8080"
echo ""
echo "🎨 Funcionalidades:"
echo "   ✅ Tema claro/escuro (botão 🌙/☀️)"
echo "   ✅ Totalmente responsivo (mobile, tablet, desktop)"
echo "   ✅ Código modular e organizado"
echo "   ✅ Todas as funcionalidades preservadas"