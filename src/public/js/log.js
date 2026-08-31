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
