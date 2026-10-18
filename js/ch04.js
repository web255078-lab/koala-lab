// 第4章 ビートを打ち込む
import { createChapter, $, $$, sleep, shuffle } from './core/klesson.js';
import { synth } from './core/synth.js';
import { settings } from './core/store.js';
import { loadKit } from './core/kitplayer.js';
import { StepSeq, cells, samePattern, diffPattern, renderLoop } from './core/stepseq.js';
import { mountPads, runPractice, toStep, averageOffset } from './core/practice.js';

const ch = createChapter({
  id: 'ch04',
  title: '第4章 ビートを打ち込む',
  tasks: ['drum', 'grid', 'swing', 'check'],
  tries: ['try1', 'try2', 'try3', 'try4'],
  cando: [
    { text: 'テンポ（BPM）と小節の数（BARS）を決められる', need: ['try1'] },
    { text: '叩いて録音し、オーバーダブで重ねられる。クオンタイズが分かる', need: ['try2', 'drum'] },
    { text: 'グリッドにステップ入力でビートを組める', need: ['try3', 'grid'] },
    { text: 'スウィングでノリをつけ、耳で聞き分けられる', need: ['try4', 'swing'] },
    { text: 'Koala に1小節のビートができている', need: ['check'] },
  ],
});

let ready = null;
const kit = () => (ready ||= loadKit());
const playBuffer = (buf) => {
  const s = synth.ctx.createBufferSource();
  s.buffer = buf;
  s.connect(synth.master);
  s.start();
  return s;
};

// ---------- 4-2 指ドラムの練習 ----------
const pads = mountPads($('#padsA'), [{ id: 'kick', name: 'キック' }, { id: 'snare', name: 'スネア' }, { id: 'hat', name: 'ハット' }]);
const WANT = { kick: [0, 2, 4, 6], snare: [1, 3, 5, 7] };
let lastAvg = null, running = null;
$('#practiceBtn').addEventListener('click', async (e) => {
  await kit();
  if (running) { running(); return; }
  const fb = $('#practiceFb'), btn = e.target;
  btn.textContent = 'やめる';
  fb.textContent = '準備のカチ4回のあと、2小節。ドン・タン・ドン・タン'; fb.className = 'feedback';
  const res = await runPractice({ pads, want: WANT, bpm: 90, beats: 8, onStop: (f) => (running = f) });
  running = null;
  btn.textContent = 'もう一度';
  if (!res) { fb.textContent = 'やめました'; return; }
  const k = res.byPad.kick, s = res.byPad.snare;
  const miss = (r) => r.results.filter((x) => x.grade === 'miss').length;
  fb.textContent = `${res.score}点（キック ${k.score}点・スネア ${s.score}点${miss(k) + miss(s) ? `・抜け ${miss(k) + miss(s)}` : ''}）`;
  fb.className = `feedback ${res.score >= 70 ? 'ok' : 'ng'}`;
  // 叩いた場所と、クオンタイズでそろえた場所を並べて見せる
  const row = (id, name) => {
    const raw = res.taps.filter((t) => t.id === id);
    const snapped = new Set(raw.map((t) => toStep(t.time, res.startPerf, res.beatMs)));
    const want = new Set(WANT[id].map((b) => b * 4));
    return `<div class="qrow"><span>${name}</span>${Array.from({ length: 32 }, (_, i) =>
      `<i class="${snapped.has(i) ? (want.has(i) ? 'hit' : 'off') : want.has(i) ? 'want' : ''}${i % 4 === 0 ? ' beat' : ''}"></i>`).join('')}</div>`;
  };
  $('#practiceGrid').innerHTML = `<p class="muted"><small>叩いた音を、いちばん近いマスに寄せると（＝クオンタイズ）：緑＝ねらいどおり、赤＝ちがうマス、灰色の枠＝叩けなかったマス</small></p>${row('kick', 'キック')}${row('snare', 'スネア')}`;
  lastAvg = averageOffset(res);
  $('#calibBtn').hidden = lastAvg === null || Math.abs(lastAvg) < (res.score < 70 ? 25 : 40);
  $('#calibBtn').classList.toggle('pulse', res.score < 70 && !$('#calibBtn').hidden);
  if (res.score >= 70) ch.clear('drum');
});
$('#calibBtn').addEventListener('click', (e) => {
  if (lastAvg === null) return;
  settings.set({ tapOffset: (settings.get().tapOffset || 0) + lastAvg });
  e.target.hidden = true;
  $('#practiceFb').textContent = `補正しました（${Math.round(lastAvg)}ms）。もう一度やってみてください`;
});

// ---------- 4-3 マス目 ----------
const seq = new StepSeq($('#designer'), { bpm: 90 });
$('#seqPlay').addEventListener('click', async (e) => {
  await kit();
  if (seq.playing) { seq.stop(); e.target.textContent = '▶ 流す'; }
  else { await seq.play(); e.target.textContent = '■ 止める'; }
});
$('#seqClear').addEventListener('click', () => seq.clear());

const EIGHTHS = [1, 3, 5, 7, 9, 11, 13, 15];
const TARGETS = [
  { name: '基本の8ビート：キック1と9、スネア5と13、ハット閉は奇数マス全部', p: { kick: cells(1, 9), snare: cells(5, 13), hat: cells(...EIGHTHS), ohat: cells() } },
  { name: '4つ打ち（ダンス）：キック1・5・9・13、スネア5と13、ハット開を3・7・11・15', p: { kick: cells(1, 5, 9, 13), snare: cells(5, 13), hat: cells(), ohat: cells(3, 7, 11, 15) } },
  { name: 'ヒップホップ風：キック1・4・11、スネア5と13、ハット閉は奇数マス全部', p: { kick: cells(1, 4, 11), snare: cells(5, 13), hat: cells(...EIGHTHS), ohat: cells() } },
];
{
  const el = $('[data-task="grid"]');
  const q = $('[data-q]', el), fb = $('.feedback', el), st = $('.status', el), dots = $('.dots', el);
  const listen = $('[data-listen]', el), judge = $('[data-judge]', el), start = $('[data-start]', el);
  let i = -1, marks = [], firstTry = true;
  const draw = () => (dots.innerHTML = TARGETS.map((_, k) => `<i class="${marks[k] || ''}"></i>`).join(''));
  const show = () => {
    q.textContent = `${i + 1}. ${TARGETS[i].name}`;
    st.textContent = `${i + 1} / ${TARGETS.length}`;
    fb.textContent = '上のマス目で組んで「判定」'; fb.className = 'feedback';
    firstTry = true;
  };
  start.addEventListener('click', async () => {
    await kit();
    i = 0; marks = [];
    listen.disabled = judge.disabled = false;
    draw();
    show();
    $('#designer').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  listen.addEventListener('click', async () => {
    const { buf } = await renderLoop(TARGETS[i].p, { bpm: 90, bars: 2 });
    playBuffer(buf);
  });
  judge.addEventListener('click', () => {
    const want = TARGETS[i].p;
    if (!samePattern(seq.pattern, want)) {
      firstTry = false;
      fb.textContent = `あと少し：${diffPattern(seq.pattern, want).join('／')}`;
      fb.className = 'feedback ng';
      return;
    }
    marks[i] = firstTry ? 'ok' : 'ng';
    draw();
    i++;
    if (i < TARGETS.length) {
      fb.textContent = 'OK！ 次のお題へ';
      fb.className = 'feedback ok';
      setTimeout(show, 1200);
      return;
    }
    q.textContent = '';
    listen.disabled = judge.disabled = true;
    start.textContent = 'もう一度';
    fb.textContent = 'クリア！ 3つの設計図を組めました。Koala のグリッドにも写してみよう';
    fb.className = 'feedback ok';
    ch.clear('grid');
  });
}

// ---------- 4-4 スウィング ----------
$('#swing').addEventListener('input', (e) => {
  seq.swing = Number(e.target.value) / 100;
  $('#swingVal').textContent = e.target.value;
});
{
  const el = $('[data-task="swing"]');
  const btns = $$('[data-a]', el), fb = $('.feedback', el), st = $('.status', el), dots = $('.dots', el), start = $('[data-start]', el);
  const P = { kick: cells(1, 9, 11), snare: cells(5, 13), hat: cells(...Array.from({ length: 16 }, (_, k) => k + 1)), ohat: cells() };
  let order = [], i = 0, correct = 0, marks = [], lock = false, src = null;
  const draw = () => (dots.innerHTML = order.map((_, k) => `<i class="${marks[k] || ''}"></i>`).join(''));
  async function ask() {
    st.textContent = `${i + 1} / ${order.length}`;
    fb.textContent = '聞いてください…'; fb.className = 'feedback';
    const rows = [{ id: 'kick', name: '' }, { id: 'snare', name: '' }, { id: 'hat', name: '', gain: 0.55 }];
    const { buf } = await renderLoop(P, { bpm: 92, bars: 2, swing: order[i] === 'swing' ? 0.6 : 0, rows });
    src = playBuffer(buf);
    btns.forEach((b) => (b.disabled = false));
    fb.textContent = 'はねてる？ まっすぐ？';
  }
  btns.forEach((b) => b.addEventListener('click', async () => {
    if (lock) return;
    lock = true;
    btns.forEach((x) => (x.disabled = true));
    try { src?.stop(); } catch { /* 済み */ }
    const ok = b.dataset.a === order[i];
    if (ok) correct++;
    marks[i] = ok ? 'ok' : 'ng';
    draw();
    fb.textContent = ok ? '正解！' : `ざんねん、${order[i] === 'swing' ? 'はねてました' : 'まっすぐでした'}`;
    fb.className = `feedback ${ok ? 'ok' : 'ng'}`;
    await sleep(1100);
    lock = false;
    i++;
    if (i < order.length) return ask();
    start.textContent = 'もう一度';
    if (correct >= 5) { fb.textContent = `クリア！ 6問中${correct}問`; fb.className = 'feedback ok'; ch.clear('swing'); }
    else { fb.textContent = `6問中${correct}問。5問でクリア。上のつまみで聞き比べてから`; fb.className = 'feedback ng'; }
  }));
  start.addEventListener('click', async () => {
    await kit();
    order = shuffle(['swing', 'swing', 'swing', 'straight', 'straight', 'straight']);
    i = 0; correct = 0; marks = [];
    draw();
    ask();
  });
}

ch.checklist('check');
ch.renderProgress();
