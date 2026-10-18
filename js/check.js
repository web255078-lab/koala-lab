// 要確認チェック：教材の【要確認】を iPad の Koala で確かめて記録し、文章にしてコピーする。
import { mountShell, $, esc } from './core/klesson.js';
import { read, write } from './core/store.js';

mountShell({ root: '.', title: '要確認チェック' });

// 確かめる項目（章・場所・どう確かめるか・選択肢）
const ITEMS = [
  {
    id: 'tabs', ch: '第1章 1-1', title: '3つの画面（SAMPLE・SEQUENCE・PERFORM）を切り替えるボタンの場所',
    how: 'Koala を開いて、画面の名前が書かれたボタンを探す。',
    options: ['画面の上', '画面の下', '画面の左', '画面の右', 'その他（メモに）'],
  },
  {
    id: 'menu', ch: '第1章 1-3', title: 'MENU（メニュー）を開くボタンの場所と見た目',
    how: '保存（SAVE AS）をするときに押したボタン。',
    options: ['「MENU」と書いてある', '三本線（≡）のマーク', 'その他（メモに）'],
  },
  {
    id: 'files', ch: '第2章 2-3', title: 'Safari で保存した素材の WAV は、Koala の IMPORT AUDIO で見えたか',
    how: 'コアラ・ラボ第2章の素材キットを iPad の Safari で⬇保存 → Koala の MENU → IMPORT AUDIO で探す。',
    options: ['そのまま見えた', 'ADD LOCATION でフォルダを追加したら見えた', 'ファイルアプリ経由なら見えた', '見つからなかった'],
    memo: '見えた場所（例：ダウンロード、iCloud Drive など）',
  },
  {
    id: 'pitch', ch: '第3章 3-3', title: 'PITCH で高さを下げると、音の長さも長くなるか',
    how: 'キックなど短い音で PITCH を大きく下げて叩き、長さを聞き比べる。',
    options: ['長さも変わる（低いと長い）', '長さは変わらない', 'よく分からない'],
  },
  {
    id: 'kbd', ch: '第5章 5-1', title: 'KEYBOARD のメニューの場所と、選べるモードの名前',
    how: 'SEQUENCE の画面で KEYBOARD を探して開く。',
    options: ['すぐ見つかった', '見つけにくかった（メモに場所を）', '見つからなかった'],
    memo: '表示されたモードの名前（例：Grid, Keyboard …）',
  },
  {
    id: 'root', ch: '第5章 5-2', title: 'Grid の Pentatonic で、基準の音（ルート）を変えられるか',
    how: 'KEYBOARD → Grid → スケールの一覧を開いたとき、ルート（C, D …）を選ぶ所があるか、パッドに音名が出ているか。',
    options: ['ルートを選ぶ所がある（メモに場所を）', 'パッドに音名が出るだけ', 'ルートは変えられない', 'よく分からない'],
    memo: 'いちばん左下のパッドの音名など',
  },
  {
    id: 'snap', ch: '第6章 6-2', title: 'テンポのメニューにある SEQUENCE SNAP（切り替えのタイミング）の表示名と選択肢',
    how: 'テンポの数字を2回たたいてメニューを開く。',
    options: ['あった（メモに選択肢を）', '名前がちがった（メモに）', '見つからなかった'],
    memo: '選択肢（例：immediately / beat / bar …）',
  },
  {
    id: 'split', ch: '進め方', title: 'Safari（この教材）と Koala を、画面に並べて表示できるか',
    how: 'iPad の Split View や Slide Over、ステージマネージャで並べてみる。',
    options: ['並べられた', 'Koala が並べる表示に対応していない', '試していない'],
  },
];

const KEY = 'checks';
const data = read(KEY, {});
const save = () => write(KEY, data);

// 環境
const ua = navigator.userAgent;
const ipad = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
$('#env').innerHTML = `<dt>端末</dt><dd>${ipad ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : 'PC など'}</dd><dt>ブラウザ情報</dt><dd><small>${esc(ua)}</small></dd>`;
$('#koalaVer').value = data._ver || '';
$('#koalaVer').addEventListener('input', (e) => { data._ver = e.target.value.trim(); save(); refresh(); });

// 項目
$('#items').innerHTML = ITEMS.map((it, i) => `
  <section class="card check-item" data-id="${it.id}">
    <div class="num">${i + 1} ・ ${it.ch}</div>
    <h2>${it.title}</h2>
    <p class="muted">確かめ方：${it.how}</p>
    <div class="btn-row">${it.options.map((o, k) => `<button class="chip" data-k="${k}">${o}</button>`).join('')}</div>
    <label class="memo">${it.memo || 'メモ（気づいたことがあれば）'}<textarea rows="2" data-memo></textarea></label>
  </section>`).join('');

function refresh() {
  for (const it of ITEMS) {
    const box = document.querySelector(`[data-id="${it.id}"]`), d = data[it.id] || {};
    box.querySelectorAll('[data-k]').forEach((b) => b.classList.toggle('sel', Number(b.dataset.k) === d.k));
    const ta = box.querySelector('[data-memo]');
    if (document.activeElement !== ta) ta.value = d.memo || '';
    box.classList.toggle('done', d.k !== undefined);
  }
  const done = ITEMS.filter((it) => data[it.id]?.k !== undefined).length;
  $('#countText').textContent = `${ITEMS.length}項目中 ${done} 項目を記録済み`;
  $('#preview').textContent = report();
}
$('#items').addEventListener('click', (e) => {
  const b = e.target.closest('[data-k]');
  if (!b) return;
  const id = b.closest('[data-id]').dataset.id;
  data[id] = { ...data[id], k: Number(b.dataset.k), at: Date.now() };
  save();
  refresh();
});
$('#items').addEventListener('input', (e) => {
  const ta = e.target.closest('[data-memo]');
  if (!ta) return;
  const id = ta.closest('[data-id]').dataset.id;
  data[id] = { ...data[id], memo: ta.value, at: Date.now() };
  save();
  $('#preview').textContent = report();
});

function report() {
  const lines = ['# コアラ・ラボ 要確認チェックの結果', `記録日: ${new Date().toLocaleDateString('ja-JP')}`, `端末: ${ipad ? 'iPad' : '（iPad 以外）'} / Koala ${data._ver || '（バージョン未記入）'}`, `ブラウザ: ${ua}`, ''];
  ITEMS.forEach((it, i) => {
    const d = data[it.id] || {};
    const ans = d.k !== undefined ? it.options[d.k] : '（未記録）';
    lines.push(`${i + 1}. [${it.ch}] ${it.title}`, `   → ${ans}${d.memo ? ` ／ メモ: ${d.memo.replace(/\n/g, ' ')}` : ''}`);
  });
  return lines.join('\n');
}

$('#copyBtn').addEventListener('click', async () => {
  const fb = $('#copyFb');
  try {
    await navigator.clipboard.writeText(report());
    fb.textContent = 'コピーしました。相談の画面に貼り付けてください';
    fb.className = 'feedback ok';
  } catch {
    fb.textContent = 'コピーできませんでした。下の「コピーされる文章を見る」を開いて、長押しで選んでコピーしてください';
    fb.className = 'feedback ng';
    document.querySelector('details').open = true;
  }
});
$('#clearBtn').addEventListener('click', () => {
  if (!confirm('要確認チェックの記録を消しますか？')) return;
  for (const k of Object.keys(data)) delete data[k];
  save();
  $('#koalaVer').value = '';
  refresh();
});
refresh();
