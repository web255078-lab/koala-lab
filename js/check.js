// 要確認チェック：教材の【要確認】を、スマホの Koala で確かめて記録し、文章にしてコピーする。
// 項目と枠の作り方は core/checks.js（章の本文と同じもの）。
import { mountShell, $, esc } from './core/klesson.js';
import { VERIFY, renderVerify, loadChecks, report, setVersion } from './core/checks.js';
import { clearWithTrash } from './core/store.js';

mountShell({ root: '.', title: '要確認チェック' });

const ua = navigator.userAgent;
$('#env').innerHTML = `<dt>端末</dt><dd>${/Android/.test(ua) ? 'Android' : /iPad|iPhone/.test(ua) ? 'iOS' : 'PC など（Koala を使うスマホで開くと、端末名が自動で入ります）'}</dd><dt>ブラウザ情報</dt><dd><small>${esc(ua)}</small></dd>`;
$('#koalaVer').value = loadChecks()._ver || '';
$('#koalaVer').addEventListener('input', (e) => { setVersion(e.target.value.trim()); refresh(); });

$('#items').innerHTML = VERIFY.map((it, i) => `<section class="card"><div class="num">${i + 1} ・ ${it.ch}</div><div data-slot="${it.id}"></div></section>`).join('');
VERIFY.forEach((it) => renderVerify($(`[data-slot="${it.id}"]`), it, { compact: true }));

function refresh() {
  const d = loadChecks();
  const done = VERIFY.filter((it) => d[it.id]?.k !== undefined).length;
  $('#countText').textContent = `${VERIFY.length}項目中 ${done} 項目を記録ずみ`;
  $('#preview').textContent = report();
}
window.addEventListener('koala:checks', refresh);

$('#copyBtn').addEventListener('click', async () => {
  const fb = $('#copyFb');
  try {
    await navigator.clipboard.writeText(report());
    fb.textContent = 'コピーしました。相談の画面に貼り付けてください';
    fb.className = 'feedback ok';
  } catch {
    fb.textContent = 'コピーできませんでした。下の「コピーされる文章を見る」を開いて、長押しで選んでコピーしてください';
    fb.className = 'feedback ng';
    document.querySelector('details.preview-box').open = true;
  }
});
$('#clearBtn').addEventListener('click', () => {
  if (!confirm('要確認チェックの記録を消しますか？（控えは残ります）')) return;
  const ver = loadChecks()._ver;
  clearWithTrash('checks');
  if (ver) setVersion(ver);
  location.reload();
});
refresh();
