import { mountShell } from './core/klesson.js';
import { CHAPTERS } from './core/chapters.js';
import { progress, exportAll, importMerge, lastExport, askPersist } from './core/store.js';
import { mountVerifies } from './core/checks.js';

mountVerifies();

mountShell({ root: '.', title: '目次' });
const $ = (id) => document.getElementById(id);

const all = progress.all();
const done = CHAPTERS.filter((c) => all[c.id]?.done);
const minDone = done.reduce((s, c) => s + c.min, 0), minAll = CHAPTERS.reduce((s, c) => s + c.min, 0);
$('allbar').style.width = `${(minDone / minAll) * 100}%`;
$('allText').textContent = `${done.length} / ${CHAPTERS.length} 章クリア（約${minDone} / ${minAll} 分）`;
$('toc').innerHTML = CHAPTERS.map((c) => {
  const st = all[c.id];
  const badge = st?.done ? '<span class="badge ok">クリア</span>'
    : st && Object.keys(st.tasks).length ? '<span class="badge wait">とちゅう</span>'
    : c.ready ? '' : '<span class="badge">準備中</span>';
  const inner = `<span class="no">${c.no}</span><span>${c.title} ${badge}</span><span class="min">${c.min}分</span>`;
  return `<li>${c.ready ? `<a href="chapters/${c.id}.html">${inner}</a>` : `<span class="soon">${inner}</span>`}</li>`;
}).join('');

// ---------- 記録のバックアップ ----------
async function renderBackup() {
  const tasks = Object.values(progress.all()).reduce((n, ch) => n + Object.keys(ch.tasks || {}).length, 0);
  const last = lastExport();
  const days = last ? Math.floor((Date.now() - last) / 86400000) : null;
  const persisted = await askPersist();
  $('bkStatus').textContent = [
    `いまの記録：${tasks} 件`,
    last ? `最後に書き出したのは ${new Date(last).toLocaleDateString('ja-JP')}${days >= 14 ? '（2週間以上前。そろそろ書き出しを）' : ''}` : 'まだ一度も書き出していません',
    persisted === true ? 'ブラウザの長期保存：許可されています' : persisted === false ? 'ブラウザの長期保存：まだ許可されていません' : '',
  ].filter(Boolean).join(' ／ ');
}
$('bkExport').addEventListener('click', () => {
  const d = new Date();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(exportAll(), null, 2)], { type: 'application/json' }));
  a.download = `koalalab-記録-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  $('bkFb').textContent = '書き出しました（スマホの Download フォルダに入ります）';
  $('bkFb').className = 'feedback ok';
  renderBackup();
});
$('bkFile').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const c = importMerge(JSON.parse(await f.text()));
    $('bkFb').textContent = `読み込みました：${c.tasks} 件を追加`;
    $('bkFb').className = 'feedback ok';
    setTimeout(() => location.reload(), 1500);
  } catch (err) {
    $('bkFb').textContent = `読み込めませんでした：${err.message}`;
    $('bkFb').className = 'feedback ng';
  }
  e.target.value = '';
});
renderBackup();
