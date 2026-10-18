// 第2章 音を集める
import { createChapter, $, $$, sleep } from './core/klesson.js';
import { synth } from './core/synth.js';
import { KIT } from './core/kit.js';
import { render, toWav, download } from './core/wav.js';
import { progress } from './core/store.js';

const ch = createChapter({
  id: 'ch02',
  title: '第2章 音を集める',
  tasks: ['ear', 'quiz', 'check'],
  tries: ['try1', 'try2', 'try3'],
  cando: [
    { text: 'ライブラリ（BASICS）やキットから音を借りられる', need: ['try1'] },
    { text: 'パッドを押しっぱなしにして、声や身の回りの音をサンプリングできる', need: ['try2'] },
    { text: 'WAV ファイルをインポートしてパッドに入れられる', need: ['try3'] },
    { text: 'キック・スネア・ハイハットなどを耳で聞き分けられる', need: ['ear'] },
    { text: 'ビートの材料がパッドにそろっている', need: ['quiz', 'check'] },
  ],
});

// ---------- 素材キット：試聴と保存 ----------
const buffers = new Map(); // id -> AudioBuffer（一度作ったら使い回す）
async function bufferOf(item) {
  if (!buffers.has(item.id)) buffers.set(item.id, await render(item.build, { seconds: item.seconds }));
  return buffers.get(item.id);
}
async function play(item) {
  await synth.start();
  const src = synth.ctx.createBufferSource();
  src.buffer = await bufferOf(item);
  src.connect(synth.ctx.destination);
  src.start();
}
const saved = () => new Set(Object.keys(progress.chapter('ch02').tasks).filter((k) => k.startsWith('dl:')).map((k) => k.slice(3)));
function renderKit() {
  const s = saved();
  $('#kitList').innerHTML = KIT.map((k) => `
    <div class="kit-item" data-id="${k.id}">
      <button class="chip" data-play aria-label="${k.name}を試聴">▶</button>
      <div><b>${k.name}</b><small class="muted"> ${k.hint}</small></div>
      <button class="chip${s.has(k.id) ? ' sel' : ''}" data-dl>${s.has(k.id) ? '✓ 保存した' : '⬇ 保存'}</button>
    </div>`).join('');
}
$('#kitList').addEventListener('click', async (e) => {
  const row = e.target.closest('[data-id]');
  if (!row) return;
  const item = KIT.find((k) => k.id === row.dataset.id);
  if (e.target.closest('[data-play]')) play(item);
  if (e.target.closest('[data-dl]')) {
    download(toWav(await bufferOf(item)), item.file);
    progress.markTask('ch02', `dl:${item.id}`);
    renderKit();
  }
});
renderKit();

// ---------- 耳で当てる ----------
{
  const el = $('[data-task="ear"]');
  const POOL = ['kick', 'snare', 'clap', 'hat', 'ohat', 'chord'].map((id) => KIT.find((k) => k.id === id));
  const ansBox = $('[data-answers]', el), fb = $('.feedback', el), st = $('.status', el), dots = $('.dots', el);
  const start = $('[data-start]', el), replay = $('[data-replay]', el);
  ansBox.innerHTML = POOL.map((k) => `<button class="chip" data-a="${k.id}" disabled>${k.name}</button>`).join('');
  let order = [], i = 0, correct = 0, marks = [], lock = false;
  const draw = () => (dots.innerHTML = order.map((_, k) => `<i class="${marks[k] || ''}"></i>`).join(''));
  const setEnabled = (on) => $$('[data-a]', ansBox).forEach((b) => (b.disabled = !on));
  async function ask() {
    st.textContent = `${i + 1} / ${order.length}`;
    fb.textContent = '聞いてください…'; fb.className = 'feedback';
    await sleep(300);
    await play(order[i]);
    setEnabled(true);
    replay.disabled = false;
    fb.textContent = 'この音の名前は？';
  }
  replay.addEventListener('click', () => order[i] && play(order[i]));
  ansBox.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b || lock || !order[i]) return;
    lock = true;
    setEnabled(false);
    const ok = b.dataset.a === order[i].id;
    if (ok) correct++;
    marks[i] = ok ? 'ok' : 'ng';
    draw();
    fb.textContent = ok ? `正解！ ${order[i].name}` : `ざんねん、${order[i].name}でした。${order[i].hint}`;
    fb.className = `feedback ${ok ? 'ok' : 'ng'}`;
    await sleep(ok ? 1100 : 2200);
    lock = false;
    i++;
    if (i < order.length) return ask();
    replay.disabled = true;
    start.textContent = 'もう一度';
    if (correct >= 5) { fb.textContent = `クリア！ 6問中${correct}問`; fb.className = 'feedback ok'; ch.clear('ear'); }
    else { fb.textContent = `6問中${correct}問。5問でクリア。2-3 の素材キットで聞き比べてから`; fb.className = 'feedback ng'; }
  });
  start.addEventListener('click', async () => {
    await synth.start();
    order = [...POOL].sort(() => Math.random() - 0.5);
    i = 0; correct = 0; marks = [];
    draw();
    ask();
  });
}

// ---------- 集め方クイズ ----------
ch.quiz('quiz', [
  { q: 'マイクで録るには、空いているパッドをどうする？（設定の Hold to record が ON のとき）', options: ['1回タップ', '押しっぱなしにして、離すと止まる', '2回タップ'], answer: 1, explain: 'OFF のときは、タップで開始・もう一度タップで停止です。' },
  { q: 'ライブラリのドラムセット16個を一度に入れる操作は？', options: ['LOAD KIT', 'SAVE AS', 'IMPORT VIDEO'], answer: 0, explain: '表示中のバンクを上書きするので、空のバンクで。' },
  { q: 'スマホに保存した WAV ファイルを取り込むのは？', options: ['PERFORM の画面', 'MENU の IMPORT AUDIO', 'SEQUENCE の録音ボタン'], answer: 1, explain: 'ファイルの取り込みは MENU から。' },
  { q: '動画の音だけを取り出したいときは？', options: ['IMPORT VIDEO', 'LOAD KIT', 'MONITOR'], answer: 0, explain: 'MENU の IMPORT VIDEO で、動画の音がパッドに入ります。' },
  { q: 'ヘッドホンなしで MONITOR を入れると起きやすいことは？', options: ['音が小さくなる', 'キーンというハウリング', '保存できなくなる'], answer: 1, explain: 'スピーカーの音をマイクが拾い直してしまうためです。' },
], { need: 4 });

ch.checklist('check');
ch.renderProgress();
