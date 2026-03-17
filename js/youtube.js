/**
 * YouTube字幕・文字起こしツール
 * yt-dlp / Whisper コマンド生成 & 文字起こしデータ管理
 */

// ========== Mode Switching ==========

function switchMode(mode) {
  document.querySelectorAll('.yt-mode-tab').forEach(function(tab) {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.yt-panel').forEach(function(panel) {
    panel.classList.remove('active');
  });

  document.getElementById('tab-' + mode).classList.add('active');
  document.getElementById('panel-' + mode).classList.add('active');

  if (mode === 'saved') {
    renderSavedList();
  }
}

// ========== URL Validation ==========

function extractVideoId(url) {
  if (!url) return null;
  var match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function isChannelUrl(url) {
  if (!url) return false;
  return /youtube\.com\/(channel\/|c\/|@|user\/)/.test(url);
}

function isPlaylistUrl(url) {
  if (!url) return false;
  return /youtube\.com\/playlist\?list=/.test(url);
}

function validateUrl(url) {
  if (!url || !url.trim()) {
    return { valid: false, error: 'URLを入力してください。' };
  }
  url = url.trim();
  if (extractVideoId(url) || isChannelUrl(url) || isPlaylistUrl(url)) {
    return { valid: true };
  }
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return { valid: true };
  }
  return { valid: false, error: '有効なYouTube URLを入力してください。' };
}

// ========== Subtitle Command Generation ==========

function generateSubtitleCommand() {
  var url = document.getElementById('subtitle-url').value.trim();
  var validation = validateUrl(url);
  if (!validation.valid) {
    showToast(validation.error);
    return;
  }

  var lang = document.getElementById('sub-lang').value;
  var type = document.getElementById('sub-type').value;
  var format = document.getElementById('sub-format').value;

  var commands = [];
  var safeUrl = escapeShellArg(url);

  // Determine subtitle flags
  var subFlags = '';
  if (type === 'auto') {
    subFlags = '--write-auto-sub';
  } else if (type === 'manual') {
    subFlags = '--write-sub';
  } else {
    subFlags = '--write-auto-sub --write-sub';
  }

  // Format flags
  var formatFlag = '';
  if (format === 'srt') {
    formatFlag = '--sub-format srt';
  } else if (format === 'vtt') {
    formatFlag = '--sub-format vtt';
  } else {
    formatFlag = '--sub-format srt';
  }

  // Main command
  var cmd = 'yt-dlp ' + subFlags + ' --skip-download --sub-lang ' + lang + ' ' + formatFlag + ' ' + safeUrl;
  commands.push({
    comment: '# 字幕ファイルをダウンロード（動画本体はスキップ）',
    command: cmd
  });

  // If text format requested, add conversion step
  if (format === 'txt') {
    commands.push({
      comment: '# SRTからタイムスタンプを除去してテキストのみ抽出',
      command: "sed '/^[0-9]\\+$/d; /^[0-9]\\{2\\}:/d; /^$/d' *.srt > subtitles.txt"
    });
  }

  // List available subtitles command
  commands.push({
    comment: '# （参考）利用可能な字幕一覧を確認',
    command: 'yt-dlp --list-subs ' + safeUrl
  });

  renderCommandResult('subtitle-result', commands, url);
}

// ========== Whisper Command Generation ==========

function generateWhisperCommand() {
  var url = document.getElementById('whisper-url').value.trim();
  var validation = validateUrl(url);
  if (!validation.valid) {
    showToast(validation.error);
    return;
  }

  var audioFormat = document.getElementById('audio-format').value;
  var whisperLang = document.getElementById('whisper-lang').value;
  var whisperModel = document.getElementById('whisper-model').value;

  var commands = [];
  var safeUrl = escapeShellArg(url);

  // Step 1: Download audio
  commands.push({
    comment: '# ステップ1: 音声をダウンロード（動画なし）',
    command: 'yt-dlp -x --audio-format ' + audioFormat + ' -o "%(title)s.%(ext)s" ' + safeUrl
  });

  // Step 2: Whisper transcription
  commands.push({
    comment: '# ステップ2: Whisperで文字起こし',
    command: 'whisper *.' + audioFormat + ' --language ' + whisperLang + ' --model ' + whisperModel
  });

  // Step 3: Batch processing for channel/playlist
  if (isChannelUrl(url) || isPlaylistUrl(url)) {
    commands.push({
      comment: '# （一括処理）ダウンロードした全音声ファイルをまとめて文字起こし',
      command: 'for f in *.' + audioFormat + '; do whisper "$f" --language ' + whisperLang + ' --model ' + whisperModel + ' --output_dir transcripts/; done'
    });
  }

  // Optional: faster-whisper alternative
  commands.push({
    comment: '# （高速版）faster-whisperを使う場合',
    command: 'pip install faster-whisper\nfaster-whisper *.' + audioFormat + ' --language ' + whisperLang + ' --model ' + whisperModel
  });

  renderCommandResult('whisper-result', commands, url);
}

// ========== Command Result Rendering ==========

function renderCommandResult(containerId, commands, url) {
  var container = document.getElementById(containerId);
  var allCommands = commands.map(function(c) { return c.command; }).join('\n');

  var html = '<div class="yt-command-box">';
  html += '<button class="btn-copy" onclick="copyToClipboard(this)" data-text="' + escapeHtml(allCommands) + '">コピー</button>';

  commands.forEach(function(c) {
    html += '<span class="comment">' + escapeHtml(c.comment) + '</span>\n';
    html += formatCommand(c.command) + '\n';
  });

  html += '</div>';

  // Additional tips
  html += '<div style="margin-top:12px;">';
  html += '<div class="yt-section-title" style="font-size:0.85rem;">便利なオプション</div>';

  if (containerId === 'subtitle-result') {
    html += renderTipsList([
      { flag: '--output "%(title)s.%(ext)s"', desc: 'ファイル名を動画タイトルにする' },
      { flag: '--playlist-items 1-10', desc: 'プレイリストの最初の10件だけ処理' },
      { flag: '--match-filter "duration < 600"', desc: '10分未満の動画のみ対象' },
      { flag: '--cookies-from-browser chrome', desc: 'ブラウザのCookieを使って認証' }
    ]);
  } else {
    html += renderTipsList([
      { flag: '--output_format txt', desc: 'テキスト形式で出力（Whisper）' },
      { flag: '--task translate', desc: '英語に翻訳しながら文字起こし' },
      { flag: '--initial_prompt "健康、栄養、ダイエット"', desc: 'ドメイン固有の用語を指定して精度向上' },
      { flag: '--audio-quality 0', desc: '最高品質で音声をダウンロード' }
    ]);
  }
  html += '</div>';

  container.innerHTML = html;
}

function renderTipsList(tips) {
  var html = '<div style="font-size:0.8rem;color:var(--text-sub);line-height:2;">';
  tips.forEach(function(tip) {
    html += '<code style="background:var(--green-bg);padding:2px 6px;border-radius:3px;font-size:0.75rem;">'
          + escapeHtml(tip.flag) + '</code> … ' + escapeHtml(tip.desc) + '<br>';
  });
  html += '</div>';
  return html;
}

function formatCommand(cmd) {
  // Simple syntax highlighting for shell commands
  return cmd.split('\n').map(function(line) {
    if (line.startsWith('#')) {
      return '<span class="comment">' + escapeHtml(line) + '</span>';
    }
    return escapeHtml(line)
      .replace(/^(yt-dlp|whisper|faster-whisper|pip|sed|for|do|done)/g, '<span class="cmd">$1</span>')
      .replace(/(--?[a-zA-Z_-]+)/g, '<span class="flag">$1</span>')
      .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="string">$1</span>');
  }).join('\n');
}

// ========== Saved Transcriptions ==========

function getStorageKey() {
  var userId = localStorage.getItem('bp_user_id') || 'guest';
  return 'bp_' + userId + '_youtube_transcriptions';
}

function getSavedTranscriptions() {
  try {
    var data = localStorage.getItem(getStorageKey());
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveSavedTranscriptions(list) {
  localStorage.setItem(getStorageKey(), JSON.stringify(list));
}

function saveTranscription() {
  var title = document.getElementById('save-title').value.trim();
  var text = document.getElementById('save-text').value.trim();

  if (!title) {
    showToast('タイトルを入力してください。');
    return;
  }
  if (!text) {
    showToast('テキストを入力してください。');
    return;
  }

  var list = getSavedTranscriptions();
  list.unshift({
    id: Date.now().toString(),
    title: title,
    text: text,
    date: new Date().toISOString(),
    charCount: text.length
  });

  saveSavedTranscriptions(list);
  document.getElementById('save-title').value = '';
  document.getElementById('save-text').value = '';
  showToast('保存しました！');
  renderSavedList();
}

function deleteTranscription(id) {
  if (!confirm('この文字起こしデータを削除しますか？')) return;
  var list = getSavedTranscriptions().filter(function(item) {
    return item.id !== id;
  });
  saveSavedTranscriptions(list);
  showToast('削除しました。');
  renderSavedList();
}

function viewTranscription(id) {
  var list = getSavedTranscriptions();
  var item = list.find(function(t) { return t.id === id; });
  if (!item) return;

  var modal = document.getElementById('help-modal');
  var content = modal.querySelector('.help-modal-content');
  content.innerHTML = '<button class="help-close" onclick="toggleHelp()">&times;</button>'
    + '<h3>' + escapeHtml(item.title) + '</h3>'
    + '<p style="font-size:0.75rem;color:var(--text-light);">保存日: ' + formatDate(item.date) + ' | ' + item.charCount + '文字</p>'
    + '<div style="background:var(--bg-secondary,#f8f8f8);padding:16px;border-radius:8px;max-height:60vh;overflow-y:auto;white-space:pre-wrap;font-size:0.85rem;line-height:1.8;">'
    + escapeHtml(item.text)
    + '</div>'
    + '<div style="margin-top:12px;display:flex;gap:8px;">'
    + '<button class="btn-download" onclick="downloadText(\'' + escapeHtml(item.title) + '\', this)" data-id="' + item.id + '">テキスト保存</button>'
    + '<button class="btn-copy-text" onclick="copyTranscriptionText(\'' + item.id + '\')">コピー</button>'
    + '</div>';

  modal.style.display = 'flex';
}

function copyTranscriptionText(id) {
  var list = getSavedTranscriptions();
  var item = list.find(function(t) { return t.id === id; });
  if (!item) return;

  navigator.clipboard.writeText(item.text).then(function() {
    showToast('クリップボードにコピーしました！');
  }).catch(function() {
    showToast('コピーに失敗しました。');
  });
}

function renderSavedList() {
  var container = document.getElementById('saved-list');
  var list = getSavedTranscriptions();

  if (list.length === 0) {
    container.innerHTML = '<div class="yt-status"><div class="icon">📝</div>保存済みの文字起こしデータはありません。<br>上のフォームからテキストを貼り付けて保存できます。</div>';
    return;
  }

  var html = '';
  list.forEach(function(item) {
    html += '<div class="yt-saved-item">';
    html += '<div class="yt-saved-info">';
    html += '<div class="yt-saved-title">' + escapeHtml(item.title) + '</div>';
    html += '<div class="yt-saved-date">' + formatDate(item.date) + ' | ' + item.charCount + '文字</div>';
    html += '</div>';
    html += '<div class="yt-saved-actions">';
    html += '<button class="btn-view" onclick="viewTranscription(\'' + item.id + '\')">表示</button>';
    html += '<button class="btn-delete" onclick="deleteTranscription(\'' + item.id + '\')">削除</button>';
    html += '</div>';
    html += '</div>';
  });

  container.innerHTML = html;
}

// ========== Utilities ==========

function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function escapeShellArg(str) {
  return '"' + str.replace(/"/g, '\\"') + '"';
}

function formatDate(isoStr) {
  var d = new Date(isoStr);
  return d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
}

function copyToClipboard(btn) {
  var text = btn.getAttribute('data-text');
  navigator.clipboard.writeText(text).then(function() {
    showToast('コマンドをコピーしました！');
    btn.textContent = 'コピー済み';
    setTimeout(function() { btn.textContent = 'コピー'; }, 2000);
  }).catch(function() {
    // Fallback
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('コマンドをコピーしました！');
  });
}

function downloadText(title, btn) {
  var id = btn.getAttribute('data-id');
  var list = getSavedTranscriptions();
  var item = list.find(function(t) { return t.id === id; });
  if (!item) return;

  var blob = new Blob([item.text], { type: 'text/plain;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (title || 'transcription') + '.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  showToast('ダウンロードしました！');
}

function showToast(msg) {
  var container = document.getElementById('toast-container');
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);

  requestAnimationFrame(function() {
    toast.classList.add('show');
  });

  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 2500);
}

function toggleHelp() {
  var modal = document.getElementById('help-modal');
  if (modal.style.display === 'flex') {
    modal.style.display = 'none';
    // Restore help content
    modal.querySelector('.help-modal-content').innerHTML = getHelpContent();
  } else {
    modal.querySelector('.help-modal-content').innerHTML = getHelpContent();
    modal.style.display = 'flex';
  }
}

function getHelpContent() {
  return '<button class="help-close" onclick="toggleHelp()">&times;</button>'
    + '<h3>YouTube字幕・文字起こしツールの使い方</h3>'
    + '<p>このツールは、YouTube動画の字幕取得や音声からの文字起こしに必要なコマンドを生成します。</p>'
    + '<p><strong>事前準備（ローカルPC）:</strong></p>'
    + '<p>1. <strong>yt-dlp</strong> をインストール:<br><code>pip install yt-dlp</code> または <code>brew install yt-dlp</code></p>'
    + '<p>2. <strong>Whisper</strong> をインストール（文字起こし用）:<br><code>pip install openai-whisper</code></p>'
    + '<p><strong>使い方:</strong></p>'
    + '<p><strong>1. 字幕取得（字幕あり動画）</strong><br>動画に字幕がある場合、yt-dlpで字幕ファイルを直接ダウンロードします。自動生成字幕・手動字幕のどちらにも対応。</p>'
    + '<p><strong>2. 音声→文字起こし（字幕なし）</strong><br>字幕がない動画の場合、まず音声をMP3でダウンロードし、Whisperで文字起こしします。</p>'
    + '<p><strong>3. 保存済み</strong><br>取得した文字起こし結果をアプリ内に保存・管理できます。</p>';
}

// ========== Auth UI Sync ==========

function handleLogout() {
  if (typeof Auth !== 'undefined' && Auth.logout) {
    Auth.logout();
  }
  window.location.href = 'login.html';
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  // Show user name if logged in
  if (typeof Auth !== 'undefined' && Auth.isLoggedIn && Auth.isLoggedIn()) {
    var user = Auth.getCurrentUser ? Auth.getCurrentUser() : null;
    var nameEl = document.getElementById('user-name');
    if (nameEl && user) {
      nameEl.textContent = user.name || user.email || '';
    }
    var loginEl = document.getElementById('nav-login');
    var regEl = document.getElementById('nav-register');
    var settEl = document.getElementById('nav-settings');
    var logoutEl = document.getElementById('nav-logout');
    if (loginEl) loginEl.style.display = 'none';
    if (regEl) regEl.style.display = 'none';
    if (settEl) settEl.style.display = '';
    if (logoutEl) logoutEl.style.display = '';
  }

  // Load saved list if on saved tab
  renderSavedList();
});
