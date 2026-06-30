"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatHtml = getChatHtml;
function getChatHtml() {
    return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 0; height: 100vh;
    font-family: var(--vscode-font-family);
    font-size: 13px; color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background);
    display: flex; flex-direction: column;
  }

  #messages {
    flex: 1; overflow-y: auto; padding: 16px 14px 8px;
    scroll-behavior: smooth;
  }

  .msg { margin-bottom: 20px; animation: fadeIn 0.18s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

  .msg.user .msg-body {
    color: var(--vscode-foreground);
    line-height: 1.55; white-space: pre-wrap; word-break: break-word;
    opacity: 0.95;
  }
  .msg.bot .msg-body {
    line-height: 1.6; word-break: break-word; color: var(--vscode-foreground);
  }

  .msg-body strong { font-weight: 600; color: var(--vscode-foreground); }
  .msg-body em { color: var(--vscode-descriptionForeground); }
  .inline-code {
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 12px;
    background: rgba(255,255,255,0.06);
    color: var(--vscode-textPreformat-foreground);
    padding: 2px 6px; border-radius: 5px;
  }
  .code-block {
    margin: 10px 0; padding: 12px 14px; border-radius: 10px; overflow-x: auto;
    background: rgba(0,0,0,0.25);
    border: 1px solid rgba(255,255,255,0.08);
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 12px; line-height: 1.5; white-space: pre;
  }
  .code-block code { color: var(--vscode-editor-foreground); }

  .msg-attachments { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .msg-chip {
    font-size: 11px; padding: 3px 8px; border-radius: 999px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    color: var(--vscode-descriptionForeground);
  }

  .msg-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
  .action-btn {
    padding: 6px 14px; font-size: 12px; font-weight: 500; border-radius: 8px; cursor: pointer;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06); color: var(--vscode-foreground);
    transition: background 0.15s;
  }
  .action-btn:hover { background: rgba(255,255,255,0.1); }
  .action-btn--primary {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border-color: transparent;
  }
  .action-btn--primary:hover { opacity: 0.9; }

  .typing {
    padding: 0 16px 4px; font-size: 12px; color: var(--vscode-descriptionForeground);
    flex-shrink: 0; opacity: 0.8;
  }
  .typing-dots::after { content: ''; animation: dots 1.2s steps(4,end) infinite; }
  @keyframes dots { 0%,20% { content: ''; } 40% { content: '.'; } 60% { content: '..'; } 80%,100% { content: '...'; } }

  .composer-dock {
    flex-shrink: 0; padding: 0 10px 12px;
  }

  .context-bar {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 8px; padding: 0 4px;
    font-size: 12px; color: var(--vscode-descriptionForeground);
  }
  .context-bar.hidden { display: none; }
  .context-toggle {
    display: inline-flex; align-items: center; gap: 4px;
    border: none; background: transparent; color: inherit;
    cursor: pointer; padding: 4px 0; font-size: 12px;
  }
  .context-toggle:hover { color: var(--vscode-foreground); }
  .ctx-chevron {
    display: inline-block; font-size: 14px; line-height: 1;
    transition: transform 0.15s;
  }
  .context-toggle.expanded .ctx-chevron { transform: rotate(90deg); }
  .ctx-spacer { flex: 1; }
  .ctx-clear {
    padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 500;
    border: 1px solid rgba(255,255,255,0.14);
    background: transparent; color: var(--vscode-foreground);
    cursor: pointer;
  }
  .ctx-clear:hover { background: rgba(255,255,255,0.06); }

  .composer-card {
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.1);
    background: var(--vscode-editorWidget-background, rgba(37,37,38,0.98));
    box-shadow: 0 4px 24px rgba(0,0,0,0.28);
    overflow: hidden;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .composer-card:focus-within {
    border-color: rgba(255,255,255,0.18);
    box-shadow: 0 6px 28px rgba(0,0,0,0.35);
  }

  #attachments {
    display: none; flex-direction: column; gap: 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    max-height: 140px; overflow-y: auto;
  }
  #attachments.has-items { display: flex; }
  #attachments.collapsed { max-height: 36px; overflow: hidden; }

  .att-row {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; font-size: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .att-row:last-child { border-bottom: none; }
  .att-row img { width: 32px; height: 32px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
  .att-row__icon {
    width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.06); font-size: 14px;
  }
  .att-row__meta { flex: 1; min-width: 0; }
  .att-row__name {
    font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .att-row__sub { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 1px; }
  .att-row__x {
    border: none; background: transparent; cursor: pointer;
    color: var(--vscode-descriptionForeground); padding: 4px 6px; border-radius: 4px;
    font-size: 12px; line-height: 1;
  }
  .att-row__x:hover { color: var(--vscode-foreground); background: rgba(255,255,255,0.06); }

  textarea#input {
    width: 100%; min-height: 44px; max-height: 180px; resize: none; border: none; outline: none;
    padding: 14px 14px 8px; background: transparent;
    color: var(--vscode-input-foreground, var(--vscode-foreground));
    font-family: inherit; font-size: 13px; line-height: 1.5;
  }
  textarea#input::placeholder { color: var(--vscode-input-placeholderForeground, rgba(255,255,255,0.38)); }

  .composer-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 6px 10px 10px; gap: 8px;
  }
  .toolbar-left { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .toolbar-right { display: flex; align-items: center; gap: 4px; margin-left: auto; }

  .pill {
    position: relative; display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 10px; border-radius: 999px; font-size: 12px; font-weight: 500;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    color: var(--vscode-foreground); cursor: pointer;
    transition: background 0.15s;
  }
  .pill:hover { background: rgba(255,255,255,0.09); }
  .pill-icon { font-size: 13px; opacity: 0.85; line-height: 1; }
  .pill-chevron { font-size: 10px; opacity: 0.5; margin-left: 1px; }
  .pill-native {
    position: absolute; inset: 0; width: 100%; height: 100%;
    opacity: 0; cursor: pointer; border: none; font-size: 12px;
  }

  .tool-btn {
    width: 32px; height: 32px; border-radius: 8px; border: none;
    background: transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--vscode-descriptionForeground); font-size: 15px;
    transition: background 0.15s, color 0.15s;
  }
  .tool-btn:hover {
    background: rgba(255,255,255,0.08);
    color: var(--vscode-foreground);
  }

  .send-circle {
    width: 32px; height: 32px; border-radius: 50%; border: none;
    background: rgba(255,255,255,0.12);
    color: var(--vscode-foreground);
    cursor: pointer; font-size: 16px; font-weight: 600;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, transform 0.1s;
  }
  .send-circle:hover:not(:disabled) { background: rgba(255,255,255,0.2); }
  .send-circle:active:not(:disabled) { transform: scale(0.94); }
  .send-circle:disabled { opacity: 0.35; cursor: not-allowed; }
  .send-circle.ready {
    background: var(--vscode-foreground);
    color: var(--vscode-editor-background, #1e1e1e);
  }
</style>
</head><body>
<div id="messages"></div>
<div id="typing" class="typing" style="display:none">Đang suy nghĩ<span class="typing-dots"></span></div>

<div class="composer-dock">
  <div class="context-bar hidden" id="contextBar">
    <button class="context-toggle" id="ctxToggle" type="button">
      <span class="ctx-chevron">›</span>
      <span id="ctxCount">0 file</span>
    </button>
    <div class="ctx-spacer"></div>
    <button class="ctx-clear" id="ctxClear" type="button">Xóa</button>
  </div>

  <div class="composer-card" id="composer">
    <div id="attachments"></div>
    <textarea id="input" placeholder="Hỏi về code, lỗi, kiến trúc..." rows="2"></textarea>
    <div class="composer-toolbar">
      <div class="toolbar-left">
        <label class="pill" title="Chế độ">
          <span class="pill-icon" id="modeIcon">💬</span>
          <span id="modeText">Hỏi</span>
          <span class="pill-chevron">▾</span>
          <select class="pill-native" id="modeSelect">
            <option value="ask">Hỏi</option>
            <option value="edit">Sửa</option>
            <option value="plan">Plan</option>
          </select>
        </label>
        <label class="pill" title="Model">
          <span id="modelText">Model</span>
          <span class="pill-chevron">▾</span>
          <select class="pill-native" id="model"></select>
        </label>
      </div>
      <div class="toolbar-right">
        <button class="tool-btn" id="btnImage" type="button" title="Đính kèm ảnh">🖼</button>
        <button class="tool-btn" id="btnFile" type="button" title="Đính kèm file">📎</button>
        <button class="send-circle" id="sendBtn" type="button" title="Gửi (Enter)">↑</button>
      </div>
    </div>
  </div>
</div>

<script>
  const vscode = acquireVsCodeApi();
  const state = vscode.getState() || { attachments: [] };
  const messages = document.getElementById('messages');
  const typing = document.getElementById('typing');
  const input = document.getElementById('input');
  const modelSelect = document.getElementById('model');
  const modeSelect = document.getElementById('modeSelect');
  const modeText = document.getElementById('modeText');
  const modeIcon = document.getElementById('modeIcon');
  const modelText = document.getElementById('modelText');
  const sendBtn = document.getElementById('sendBtn');
  const attachmentsEl = document.getElementById('attachments');
  const contextBar = document.getElementById('contextBar');
  const ctxCount = document.getElementById('ctxCount');
  const ctxToggle = document.getElementById('ctxToggle');
  const ctxClear = document.getElementById('ctxClear');

  let currentMode = state.mode || 'ask';
  let currentModel = state.model || 'GROQ_LLAMA_70B';
  let attachments = state.attachments || [];
  let busy = false;
  let composing = false;
  let ctxExpanded = true;

  const placeholders = {
    ask: 'Hỏi về code, lỗi, kiến trúc...',
    edit: 'Mô tả thay đổi — tự áp dụng vào editor...',
    plan: 'Mô tả task — AI lập kế hoạch từng bước...'
  };
  const modeIcons = { ask: '💬', edit: '✎', plan: '◎' };
  const modeLabels = { ask: 'Hỏi', edit: 'Sửa', plan: 'Plan' };

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function renderMarkdown(text) {
    const blocks = [];
    const blockRe = /` + '```' + `([\\w.-]*)\\n([\\s\\S]*?)` + '```' + `/g;
    let m;
    while ((m = blockRe.exec(text)) !== null) {
      blocks.push({ start: m.index, end: m.index + m[0].length, code: m[2] });
    }
    if (!blocks.length) return inlineMd(escapeHtml(text));
    let html = '';
    let last = 0;
    blocks.forEach(b => {
      html += inlineMd(escapeHtml(text.slice(last, b.start)));
      html += '<pre class="code-block"><code>' + escapeHtml(b.code.trim()) + '</code></pre>';
      last = b.end;
    });
    html += inlineMd(escapeHtml(text.slice(last)));
    return html;
  }

  function inlineMd(s) {
    return s
      .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
      .replace(/\\*([^*]+)\\*/g, '<em>$1</em>')
      .replace(/` + '`' + `([^` + '`' + `]+)` + '`' + `/g, '<code class="inline-code">$1</code>')
      .replace(/\\n/g, '<br>');
  }

  function saveState() {
    vscode.setState({ mode: currentMode, model: currentModel, attachments });
  }

  function updateSendState() {
    const hasContent = input.value.trim().length > 0 || attachments.length > 0;
    sendBtn.classList.toggle('ready', hasContent && !busy);
  }

  function setMode(mode) {
    currentMode = mode;
    modeSelect.value = mode;
    modeText.textContent = modeLabels[mode];
    modeIcon.textContent = modeIcons[mode];
    input.placeholder = placeholders[mode];
    saveState();
    vscode.postMessage({ type: 'savePrefs', mode, model: currentModel });
    updateSendState();
  }

  modeSelect.addEventListener('change', () => setMode(modeSelect.value));

  modelSelect.addEventListener('change', () => {
    currentModel = modelSelect.value;
    const opt = modelSelect.options[modelSelect.selectedIndex];
    modelText.textContent = opt ? shortenModel(opt.textContent) : 'Model';
    saveState();
    vscode.postMessage({ type: 'savePrefs', mode: currentMode, model: currentModel });
  });

  function shortenModel(name) {
    if (!name) return 'Model';
    return name.length > 16 ? name.slice(0, 14) + '…' : name;
  }

  function updateContextBar() {
    const n = attachments.length;
    if (n === 0) {
      contextBar.classList.add('hidden');
      attachmentsEl.classList.remove('has-items');
      return;
    }
    contextBar.classList.remove('hidden');
    ctxCount.textContent = n + (n === 1 ? ' file' : ' files');
    attachmentsEl.classList.add('has-items');
    attachmentsEl.classList.toggle('collapsed', !ctxExpanded);
    ctxToggle.classList.toggle('expanded', ctxExpanded);
  }

  ctxToggle.addEventListener('click', () => {
    ctxExpanded = !ctxExpanded;
    updateContextBar();
  });

  ctxClear.addEventListener('click', () => {
    attachments = [];
    renderAttachments();
  });

  function renderAttachments() {
    attachmentsEl.innerHTML = '';
    attachments.forEach(att => {
      const row = document.createElement('div');
      row.className = 'att-row';
      if (att.kind === 'image' && att.preview) {
        const img = document.createElement('img');
        img.src = att.preview;
        row.appendChild(img);
      } else {
        const icon = document.createElement('div');
        icon.className = 'att-row__icon';
        icon.textContent = att.kind === 'snippet' ? '⟨/⟩' : '📄';
        row.appendChild(icon);
      }
      const meta = document.createElement('div');
      meta.className = 'att-row__meta';
      const name = document.createElement('div');
      name.className = 'att-row__name';
      name.textContent = att.name;
      meta.appendChild(name);
      if (att.startLine) {
        const sub = document.createElement('div');
        sub.className = 'att-row__sub';
        sub.textContent = 'dòng ' + att.startLine + '–' + att.endLine;
        meta.appendChild(sub);
      }
      row.appendChild(meta);
      const x = document.createElement('button');
      x.className = 'att-row__x';
      x.textContent = '✕';
      x.onclick = () => { attachments = attachments.filter(a => a.id !== att.id); renderAttachments(); };
      row.appendChild(x);
      attachmentsEl.appendChild(row);
    });
    updateContextBar();
    saveState();
    updateSendState();
  }

  function addUserMsg(text, labels) {
    const wrap = document.createElement('div');
    wrap.className = 'msg user';
    if (labels && labels.length) {
      const chips = document.createElement('div');
      chips.className = 'msg-attachments';
      labels.forEach(l => { const c = document.createElement('span'); c.className = 'msg-chip'; c.textContent = l; chips.appendChild(c); });
      wrap.appendChild(chips);
    }
    const body = document.createElement('div');
    body.className = 'msg-body';
    body.textContent = text;
    wrap.appendChild(body);
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }

  function createBotMsg() {
    const wrap = document.createElement('div');
    wrap.className = 'msg bot';
    const body = document.createElement('div');
    body.className = 'msg-body';
    wrap.appendChild(body);
    messages.appendChild(wrap);
    return { wrap, body };
  }

  function addBotActions(wrap, text, canApply, showUndo) {
    const actions = document.createElement('div');
    actions.className = 'msg-actions';
    if (canApply) {
      const btn = document.createElement('button');
      btn.className = 'action-btn action-btn--primary';
      btn.textContent = 'Áp dụng';
      btn.onclick = () => vscode.postMessage({ type: 'applyEdit', result: text });
      actions.appendChild(btn);
    }
    if (showUndo) {
      const undo = document.createElement('button');
      undo.className = 'action-btn';
      undo.textContent = 'Hoàn tác';
      undo.onclick = () => vscode.postMessage({ type: 'undoEdit' });
      actions.appendChild(undo);
    }
    if (actions.children.length) wrap.appendChild(actions);
  }

  function streamBotMsg(text, canApply, showUndo) {
    const { wrap, body } = createBotMsg();
    let i = 0;
    const step = 4;
    const timer = setInterval(() => {
      i = Math.min(text.length, i + step);
      body.innerHTML = renderMarkdown(text.slice(0, i));
      messages.scrollTop = messages.scrollHeight;
      if (i >= text.length) {
        clearInterval(timer);
        body.innerHTML = renderMarkdown(text);
        addBotActions(wrap, text, canApply, showUndo);
        messages.scrollTop = messages.scrollHeight;
      }
    }, 10);
  }

  function setBusy(on) {
    busy = on;
    sendBtn.disabled = on;
    input.disabled = on;
    modelSelect.disabled = on;
    modeSelect.disabled = on;
    updateSendState();
  }

  function doSend() {
    if (busy || composing) return;
    const t = input.value.trim();
    if (!t && !attachments.length) return;
    const labels = attachments.map(a => {
      if (a.kind === 'snippet') return (a.path || a.name) + ':' + a.startLine + '-' + a.endLine;
      return a.name;
    });
    addUserMsg(t || '(đính kèm)', labels.length ? labels : null);
    vscode.postMessage({
      type: 'send', text: t, mode: currentMode, model: currentModel,
      attachments: attachments.map(({ id, preview, ...rest }) => rest)
    });
    input.value = '';
    attachments = [];
    renderAttachments();
    updateSendState();
  }

  sendBtn.addEventListener('click', doSend);
  input.addEventListener('input', updateSendState);
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !composing && !e.isComposing) {
      e.preventDefault();
      doSend();
    }
  });

  document.getElementById('btnFile').addEventListener('click', () => vscode.postMessage({ type: 'pickFile' }));
  document.getElementById('btnImage').addEventListener('click', () => vscode.postMessage({ type: 'pickImage' }));

  window.addEventListener('message', e => {
    const m = e.data;
    if (m.type === 'init') {
      modelSelect.innerHTML = '';
      (m.models || []).forEach(md => {
        const opt = document.createElement('option');
        opt.value = md.id; opt.textContent = md.displayName;
        modelSelect.appendChild(opt);
      });
      if (m.model) { currentModel = m.model; modelSelect.value = m.model; }
      const opt = modelSelect.options[modelSelect.selectedIndex];
      modelText.textContent = opt ? shortenModel(opt.textContent) : 'Model';
      if (m.mode) setMode(m.mode);
      if (!m.loggedIn) streamBotMsg('Chưa kết nối. Web → **Plugin** → **Kết nối**, rồi dùng lệnh Connect.');
      renderAttachments();
      updateSendState();
    }
    if (m.type === 'addAttachment') {
      const att = m.attachment;
      const dup = attachments.some(a => a.path === att.path && a.startLine === att.startLine);
      if (!dup) { attachments.push(att); renderAttachments(); input.focus(); }
    }
    if (m.type === 'stream') streamBotMsg(m.text, m.canApply, m.showUndo);
    if (m.type === 'typing') { typing.style.display = m.on ? 'block' : 'none'; setBusy(m.on); }
  });

  renderAttachments();
  setMode(currentMode);
  updateSendState();
  vscode.postMessage({ type: 'ready' });
</script>
</body></html>`;
}
//# sourceMappingURL=chatHtml.js.map