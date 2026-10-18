// 第5章 ベースとメロディ
import { createChapter, $, $$, sleep } from './core/klesson.js';
import { synth } from './core/synth.js';
import { loadKit, playPad } from './core/kitplayer.js';
import { StepSeq, cells } from './core/stepseq.js';

const ch = createChapter({
  id: 'ch05',
  title: '第5章 ベースとメロディ',
  tasks: ['odd', 'copy', 'check'],
  tries: ['try1', 'try2', 'try3', 'try4'],
  cando: [
    { text: 'キーボードモードで、1つの音を鍵盤のように弾ける', need: ['try1'] },
    { text: 'スケール（ペンタトニック）で、外れない音だけで弾ける', need: ['try2', 'odd'] },
    { text: 'ベースラインを聞き取って弾き、ビートに重ねられる', need: ['try3', 'copy'] },
    { text: 'すき間を生かした短いメロディ（上もの）を足せる', need: ['try4', 'check'] },
  ],
});

let ready = null;
const kit = () => (ready ||= loadKit());
const NAMES = ['ド', 'ド#', 'レ', 'ミ♭', 'ミ', 'ファ', 'ファ#', 'ソ', 'ラ♭', 'ラ', 'シ♭', 'シ'];
const nameOf = (s) => NAMES[((s % 12) + 12) % 12] + (s >= 12 ? '↑' : '');
let sound = 'bass';
const playNote = (s) => playPad(sound, { semis: s - (sound === 'pluck' ? 12 : 0) });

// ---------- 5-1 半音ずつの鍵盤 ----------
$('#chromKeys').innerHTML = Array.from({ length: 13 }, (_, s) =>
  `<button class="nkey${[1, 3, 6, 8, 10].includes(s % 12) ? ' black' : ''}" data-s="${s}">${nameOf(s)}</button>`).join('');
$('#chromKeys').addEventListener('pointerdown', async (e) => {
  const b = e.target.closest('[data-s]');
  if (!b) return;
  e.preventDefault();
  await kit();
  playPad('bass', { semis: Number(b.dataset.s) });
});

// ---------- 5-2 ペンタトニック（ドのマイナー・ペンタトニック：ド ミ♭ ファ ソ シ♭） ----------
const PENTA = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22];
$('#pentaGrid').innerHTML = PENTA.map((s) => `<button class="npad" data-s="${s}">${nameOf(s)}</button>`).join('');
$('#pentaGrid').addEventListener('pointerdown', async (e) => {
  const b = e.target.closest('[data-s]');
  if (!b) return;
  e.preventDefault();
  await kit();
  playNote(Number(b.dataset.s));
  b.classList.add('down');
  setTimeout(() => b.classList.remove('down'), 100);
  window.dispatchEvent(new CustomEvent('koala:note', { detail: Number(b.dataset.s) }));
});
$$('[data-snd]').forEach((b) => b.addEventListener('click', () => {
  sound = b.dataset.snd;
  $$('[data-snd]').forEach((x) => x.classList.toggle('sel', x === b));
}));
const drums = new StepSeq(document.createElement('div'), { bpm: 90 });
drums.set({ kick: cells(1, 9, 11), snare: cells(5, 13), hat: cells(1, 3, 5, 7, 9, 11, 13, 15) });
drums.rows = drums.rows.map((r) => (r.id === 'hat' ? { ...r, gain: 0.5 } : r));
$('#loopBtn').addEventListener('click', async (e) => {
  await kit();
  if (drums.playing) { drums.stop(); e.target.textContent = '▶ ドラムを流す'; }
  else { await drums.play(); e.target.textContent = '■ 止める'; }
});

// ---------- 仲間はずれ ----------
{
  const el = $('[data-task="odd"]');
  const btns = $$('[data-a]', el), fb = $('.feedback', el), st = $('.status', el), dots = $('.dots', el);
  const start = $('[data-start]', el), replay = $('[data-replay]', el);
  const OUT = [4, 9, 11, 2, 6]; // スケールにない音（ミ・ラ・シ・レ・ファ#）
  let qs = [], i = 0, correct = 0, marks = [], lock = false;
  const draw = () => (dots.innerHTML = qs.map((_, k) => `<i class="${marks[k] || ''}"></i>`).join(''));
  async function playQ() {
    replay.disabled = true;
    for (const s of qs[i].notes) { playPad('pluck', { semis: s - 12 }); await sleep(450); }
    replay.disabled = false;
  }
  replay.addEventListener('click', playQ);
  async function ask() {
    st.textContent = `${i + 1} / ${qs.length}`;
    fb.textContent = '聞いてください…'; fb.className = 'feedback';
    await playQ();
    btns.forEach((b) => (b.disabled = false));
    fb.textContent = '仲間はずれは何番目？';
  }
  btns.forEach((b) => b.addEventListener('click', async () => {
    if (lock) return;
    lock = true;
    btns.forEach((x) => (x.disabled = true));
    const ok = Number(b.dataset.a) === qs[i].odd;
    if (ok) correct++;
    marks[i] = ok ? 'ok' : 'ng';
    draw();
    fb.textContent = ok ? '正解！' : `ざんねん、${qs[i].odd + 1}番目でした`;
    fb.className = `feedback ${ok ? 'ok' : 'ng'}`;
    await sleep(ok ? 1000 : 1800);
    lock = false;
    i++;
    if (i < qs.length) return ask();
    replay.disabled = true;
    start.textContent = 'もう一度';
    if (correct >= 4) { fb.textContent = `クリア！ 5問中${correct}問`; fb.className = 'feedback ok'; ch.clear('odd'); }
    else { fb.textContent = `5問中${correct}問。4問でクリア`; fb.className = 'feedback ng'; }
  }));
  start.addEventListener('click', async () => {
    await kit();
    // スケールの音3つ＋ないもの1つ（ドから始めて、耳の基準を作る）
    qs = OUT.map((o) => {
      const notes = [0, ...[3, 5, 7, 10, 12].sort(() => Math.random() - 0.5).slice(0, 3)];
      const odd = 1 + Math.floor(Math.random() * 3);
      notes[odd] = o + (Math.random() < 0.5 ? 0 : 12);
      return { notes, odd };
    });
    i = 0; correct = 0; marks = [];
    draw();
    ask();
  });
}

// ---------- ベースラインをまねする ----------
{
  const el = $('[data-task="copy"]');
  const fb = $('.feedback', el), st = $('.status', el), dots = $('.dots', el), prog = $('[data-progress]', el);
  const start = $('[data-start]', el), replay = $('[data-replay]', el);
  // 教材オリジナルの4音のベースライン
  const RIFFS = [[0, 0, 7, 5], [0, 3, 5, 3], [0, 10, 7, 5]];
  let r = -1, pos = 0, marks = [], first = true, active = false;
  const draw = () => (dots.innerHTML = RIFFS.map((_, k) => `<i class="${marks[k] || ''}"></i>`).join(''));
  async function playRiff() {
    replay.disabled = true;
    for (const s of RIFFS[r]) { playPad('bass', { semis: s }); await sleep(420); }
    replay.disabled = false;
  }
  replay.addEventListener('click', playRiff);
  const showProg = () => (prog.textContent = RIFFS[r].map((_, k) => (k < pos ? '●' : '○')).join(' '));
  async function next() {
    pos = 0; first = true;
    st.textContent = `${r + 1} / ${RIFFS.length}`;
    showProg();
    fb.textContent = '聞いて、5-2 のパッドで同じ順に'; fb.className = 'feedback';
    await playRiff();
  }
  window.addEventListener('koala:note', async (e) => {
    if (!active) return;
    const want = RIFFS[r][pos], got = e.detail;
    if (got % 12 === want % 12) {
      pos++;
      showProg();
      if (pos < RIFFS[r].length) return;
      marks[r] = first ? 'ok' : 'ng';
      draw();
      r++;
      if (r < RIFFS.length) { fb.textContent = 'OK！ 次へ'; fb.className = 'feedback ok'; await sleep(900); return next(); }
      active = false;
      prog.textContent = '';
      replay.disabled = true;
      start.textContent = 'もう一度';
      fb.textContent = 'クリア！ 3つのベースラインを聞き取れました'; fb.className = 'feedback ok';
      ch.clear('copy');
    } else {
      first = false;
      pos = 0;
      showProg();
      fb.textContent = `ちがうみたい。${want % 12 > got % 12 ? 'もっと高い' : 'もっと低い'}音かも。最初からもう一度`;
      fb.className = 'feedback ng';
    }
  });
  start.addEventListener('click', async () => {
    await kit();
    sound = 'bass';
    $$('[data-snd]').forEach((x) => x.classList.toggle('sel', x.dataset.snd === 'bass'));
    r = 0; marks = []; active = true;
    draw();
    $('#pentaGrid').scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(400);
    next();
  });
}

ch.checklist('check');
ch.renderProgress();
