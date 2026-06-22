export function getChatHtml(): string {
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
  #messages { flex: 1; overflow-y: auto; padding: 12px 10px; }
  .msg { margin-bottom: 14px; animation: fadeIn 0.2s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
  .msg-role {
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: var(--vscode-descriptionForeground); margin-bottom: 4px;
  }
  .msg-body {
    padding: 10px 12px; border-radius: 10px; line-height: 1.55;
    word-break: break-word;
  }
  .msg.user .msg-body {
    background: var(--vscode-input-background);
    border: 1px solid var(--vscode-input-border);
    white-space: pre-wrap;
  }
  .msg.bot .msg-body {
    background: var(--vscode-editor-inactiveSelectionBackground);
  }
  .msg-body strong { color: var(--vscode-textLink-foreground); font-weight: 700; }
  .msg-body em { color: var(--vscode-descriptionForeground); }
  .inline-code {
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 12px; font-weight: 600;
    background: var(--vscode-textCodeBlock-background);
    color: var(--vscode-textPreformat-foreground);
    padding: 1px 5px; border-radius: 4px;
  }
  .code-block {
    margin: 8px 0; padding: 10px 12px; border-radius: 8px; overflow-x: auto;
    background: var(--vscode-textCodeBlock-background);
    border: 1px solid var(--vscode-panel-border);
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: 12px; line-height: 1.45;
    white-space: pre;
  }
  .code-block code { font-weight: 600; color: var(--vscode-editor-foreground); }
  .msg-attachments { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
  .msg-chip {
    font-size: 10px; padding: 2px 6px; border-radius: 4px;
    background: var(--vscode-badge-background); color: var(--vscode-badge-foreground);
  }
  .msg-actions { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
  .action-btn {
    padding: 5px 12px; font-size: 11px; font-weight: 600; border-radius: 6px; cursor: pointer; border: none;
  }
  .action-btn--primary {
    background: var(--vscode-button-background); color: var(--vscode-button-foreground);
  }
  .action-btn--secondary {
    background: transparent; color: var(--vscode-foreground);
    border: 1px solid var(--vscode-panel-border);
  }
  .typing {
    padding: 0 12px 6px; font-size: 12px; color: var(--vscode-descriptionForeground); flex-shrink: 0;
  }
  .typing-dots::after { content: ''; animation: dots 1.2s steps(4,end) infinite; }
  @keyframes dots { 0%,20% { content: ''; } 40% { content: '.'; } 60% { content: '..'; } 80%,100% { content: '...'; } }
  .composer-wrap { padding: 8px 10px 10px; flex-shrink: 0; border-top: 1px solid var(--vscode-panel-border); }
  .composer {
    border: 1px solid var(--vscode-input-border); border-radius: 12px;
    background: var(--vscode-input-background); overflow: hidden;
    display: flex; flex-direction: column;
  }
  .composer:focus-within { border-color: var(--vscode-focusBorder); }
  #attachments { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 10px 0; max-height: 120px; overflow-y: auto; }
  #attachments:empty { display: none; }
  .att-chip {
    display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 8px; font-size: 11px;
    background: var(--vscode-editor-background); border: 1px solid var(--vscode-panel-border);
  }
  .att-chip img { width: 28px; height: 28px; object-fit: cover; border-radius: 4px; }
  .att-chip__name { font-weight: 700; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .att-chip__sub { font-size: 10px; color: var(--vscode-descriptionForeground); }
  .att-chip__x { border: none; background: transparent; cursor: pointer; color: var(--vscode-descriptionForeground); }
  textarea#input {
    width: 100%; min-height: 72px; max-height: 160px; resize: none; border: none; outline: none;
    padding: 10px 12px 4px; background: transparent; color: var(--vscode-input-foreground);
    font-family: inherit; font-size: 13px; line-height: 1.45;
  }
  .composer-footer {
    display: flex; align-items: center; gap: 6px; padding: 6px 8px 8px; flex-wrap: wrap;
  }
  .modes {
    display: flex; gap: 2px; background: var(--vscode-sideBar-background);
    border-radius: 8px; padding: 2px; border: 1px solid var(--vscode-panel-border);
  }
  .mode-btn {
    border: none; background: transparent; color: var(--vscode-descriptionForeground);
    padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;
  }
  .mode-btn.active { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
  .model-select {
    flex: 1; min-width: 90px; max-width: 150px; padding: 4px 6px; font-size: 11px;
    background: var(--vscode-sideBar-background); color: var(--vscode-foreground);
    border: 1px solid var(--vscode-panel-border); border-radius: 6px;
  }
  .icon-btn {
    width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--vscode-panel-border);
    background: var(--vscode-sideBar-background); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
  }
  .spacer { flex: 1; }
  .send-btn {
    width: 30px; height: 30px; border-radius: 8px; border: none;
    background: var(--vscode-button-background); color: var(--vscode-button-foreground);
    cursor: pointer; font-size: 16px; font-weight: 700;
  }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .hint { font-size: 10px; color: var(--vscode-descriptionForeground); padding: 4px 2px 0; text-align: center; }
</style>
</head><body>
<div id="messages"></div>
<div id="typing" class="typing" style="display:none">AI đang trả lời<span class="typing-dots"></span></div>
<div class="composer-wrap">
  <div class="composer" id="composer">
    <div id="attachments"></div>
    <textarea id="input" placeholder="Hỏi AI hoặc mô tả thay đổi..." rows="3"></textarea>
    <div class="composer-footer">
      <div class="modes">
        <button class="mode-btn active" data-mode="ask" type="button">Hỏi</button>
        <button class="mode-btn" data-mode="edit" type="button">Sửa</button>
        <button class="mode-btn" data-mode="plan" type="button">Plan</button>
      </div>
      <select class="model-select" id="model"></select>
      <button class="icon-btn" id="btnFile" type="button" title="File">📎</button>
      <button class="icon-btn" id="btnImage" type="button" title="Ảnh">🖼</button>
      <div class="spacer"></div>
      <button class="send-btn" id="sendBtn" type="button" title="Gửi">↑</button>
    </div>
  </div>
  <div class="hint">Enter gửi · Shift+Enter xuống dòng · Sửa = tự áp dụng editor</div>
</div>
<script>
  const vscode = acquireVsCodeApi();
  const state = vscode.getState() || { attachments: [] };
  const messages = document.getElementById('messages');
  const typing = document.getElementById('typing');
  const input = document.getElementById('input');
  const modelSelect = document.getElementById('model');
  const sendBtn = document.getElementById('sendBtn');
  const attachmentsEl = document.getElementById('attachments');
  const modeBtns = document.querySelectorAll('.mode-btn');

  let currentMode = state.mode || 'ask';
  let currentModel = state.model || 'GROQ_LLAMA_70B';
  let attachments = state.attachments || [];
  let busy = false;
  let composing = false;

  const placeholders = {
    ask: 'Hỏi AI về code, lỗi, kiến trúc...',
    edit: 'Mô tả cách sửa — tự áp dụng vào editor...',
    plan: 'Mô tả task — AI lập kế hoạch từng bước...'
  };

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

  function setMode(mode) {
    currentMode = mode;
    modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    input.placeholder = placeholders[mode];
    saveState();
    vscode.postMessage({ type: 'savePrefs', mode, model: currentModel });
  }
  modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  modelSelect.addEventListener('change', () => {
    currentModel = modelSelect.value;
    saveState();
    vscode.postMessage({ type: 'savePrefs', mode: currentMode, model: currentModel });
  });

  function renderAttachments() {
    attachmentsEl.innerHTML = '';
    attachments.forEach(att => {
      const chip = document.createElement('div');
      chip.className = 'att-chip';
      if (att.kind === 'image' && att.preview) {
        const img = document.createElement('img');
        img.src = att.preview;
        chip.appendChild(img);
      } else {
        const icon = document.createElement('span');
        icon.textContent = att.kind === 'snippet' ? '⟨/⟩' : '📄';
        chip.appendChild(icon);
      }
      const meta = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'att-chip__name';
      name.textContent = att.name;
      meta.appendChild(name);
      if (att.startLine) {
        const sub = document.createElement('div');
        sub.className = 'att-chip__sub';
        sub.textContent = 'dòng ' + att.startLine + '-' + att.endLine;
        meta.appendChild(sub);
      }
      chip.appendChild(meta);
      const x = document.createElement('button');
      x.className = 'att-chip__x';
      x.textContent = '✕';
      x.onclick = () => { attachments = attachments.filter(a => a.id !== att.id); renderAttachments(); };
      chip.appendChild(x);
      attachmentsEl.appendChild(chip);
    });
    saveState();
  }

  function addUserMsg(text, labels) {
    const wrap = document.createElement('div');
    wrap.className = 'msg user';
    wrap.innerHTML = '<div class="msg-role">Bạn</div>';
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
    wrap.innerHTML = '<div class="msg-role">AI</div>';
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
      btn.textContent = 'Áp dụng vào editor';
      btn.onclick = () => vscode.postMessage({ type: 'applyEdit', result: text });
      actions.appendChild(btn);
    }
    if (showUndo) {
      const undo = document.createElement('button');
      undo.className = 'action-btn action-btn--secondary';
      undo.textContent = 'Hoàn tác';
      undo.onclick = () => vscode.postMessage({ type: 'undoEdit' });
      actions.appendChild(undo);
    }
    if (actions.children.length) wrap.appendChild(actions);
  }

  function streamBotMsg(text, canApply, showUndo) {
    const { wrap, body } = createBotMsg();
    let i = 0;
    const step = 3;
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
    }, 12);
  }

  function setBusy(on) {
    busy = on;
    sendBtn.disabled = on;
    input.disabled = on;
    modelSelect.disabled = on;
    modeBtns.forEach(b => b.disabled = on);
  }

  function doSend() {
    if (busy || composing) return;
    const t = input.value.trim();
    if (!t && !attachments.length) return;
    const labels = attachments.map(a => {
      const modeLabel = { ask: 'Hỏi', edit: 'Sửa', plan: 'Plan' }[currentMode];
      if (a.kind === 'snippet') return modeLabel + ' · ' + (a.path || a.name) + ':' + a.startLine + '-' + a.endLine;
      return modeLabel + ' · ' + a.name;
    });
    const modeLabel = { ask: 'Hỏi', edit: 'Sửa', plan: 'Plan' }[currentMode];
    addUserMsg(t || '(đính kèm)', labels.length ? labels : [modeLabel]);
    vscode.postMessage({
      type: 'send', text: t, mode: currentMode, model: currentModel,
      attachments: attachments.map(({ id, preview, ...rest }) => rest)
    });
    input.value = '';
    attachments = [];
    renderAttachments();
  }

  sendBtn.addEventListener('click', doSend);
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
      if (m.mode) setMode(m.mode);
      if (!m.loggedIn) streamBotMsg('Chưa kết nối. Web → **Plugins** → **Kết nối**, rồi dùng lệnh Connect.');
      renderAttachments();
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
  vscode.postMessage({ type: 'ready' });
</script>
</body></html>`;
}
