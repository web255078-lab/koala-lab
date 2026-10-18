// 第7章 書き出して完成
import { createChapter, $, esc } from './core/klesson.js';
import { read, write } from './core/store.js';

const ch = createChapter({
  id: 'ch07',
  title: '第7章 書き出して完成',
  tasks: ['final', 'review'],
  tries: ['try1', 'try2', 'try3'],
  cando: [
    { text: 'RECORD SONG で、演奏を1つの WAV にできる', need: ['try1'] },
    { text: 'EXPORT でループを書き出し、RESAMPLE LOOP で材料に戻せる', need: ['try2'] },
    { text: '.koala ファイルで曲まるごとをバックアップできる', need: ['try3'] },
    { text: '自分の1曲を完成させ、ふり返って次につなげられる', need: ['final', 'review'] },
  ],
});

// 第6章で決めた構成表
const NAME = { intro: 'イントロ', a: 'いつもの', brk: 'ブレイク', sabi: 'サビ', outro: 'アウトロ' };
const plan = read('plan', []);
$('#planBox').innerHTML = plan.length
  ? `<div class="caution" style="border-color:var(--ok)">第6章で決めた構成表：<strong>${plan.map((k, i) => `${i + 1}. ${esc(NAME[k] || k)}`).join(' → ')}</strong></div>`
  : '<p class="muted">第6章の構成表がまだ決まっていません。先に第6章の課題 6-2 をやると、ここに出ます。</p>';

// ふり返りシート
const ITEMS = [['groove', 'ノリ（体がゆれるか）'], ['balance', '音のバランス（どれかが大きすぎないか）'], ['story', '展開（飽きずに聞けるか）'], ['love', '好き度']];
const saved = read('review', {});
$('#review').innerHTML = ITEMS.map(([k, label]) => `
  <div class="rv-row"><span>${label}</span><span class="rv-stars" data-k="${k}">${[1, 2, 3, 4, 5].map((n) => `<button class="star" data-n="${n}" aria-label="${n}">★</button>`).join('')}</span></div>`).join('');
const vals = { ...saved.vals };
const paint = () => document.querySelectorAll('.rv-stars').forEach((g) => g.querySelectorAll('.star').forEach((b) => b.classList.toggle('on', Number(b.dataset.n) <= (vals[g.dataset.k] || 0))));
$('#review').addEventListener('click', (e) => {
  const b = e.target.closest('.star');
  if (!b) return;
  vals[b.closest('.rv-stars').dataset.k] = Number(b.dataset.n);
  paint();
});
$('#reviewMemo').value = saved.memo || '';
paint();
$('#reviewSave').addEventListener('click', () => {
  const fb = $('[data-task="review"] .feedback');
  if (ITEMS.some(([k]) => !vals[k])) { fb.textContent = '4つとも星をつけてください'; fb.className = 'feedback ng'; return; }
  write('review', { vals, memo: $('#reviewMemo').value.trim(), at: Date.now() });
  fb.textContent = '記録しました。おつかれさまでした！ 🎉'; fb.className = 'feedback ok';
  ch.clear('review');
});

ch.checklist('final');
ch.renderProgress();
