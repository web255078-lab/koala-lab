// 第6章 展開とエフェクト
import { createChapter, $, $$, sleep, esc } from './core/klesson.js';
import { synth } from './core/synth.js';
import { read, write } from './core/store.js';
import { reverbIR } from './core/fx.js';
import { loadKit } from './core/kitplayer.js';
import { cells, renderLoop } from './core/stepseq.js';

const ch = createChapter({
  id: 'ch06',
  title: '第6章 展開とエフェクト',
  tasks: ['plan', 'fx', 'check'],
  tries: ['try1', 'try2', 'try3'],
  cando: [
    { text: 'シーケンスをコピーして、ブレイクやサビのバリエーションを作れる', need: ['try1'] },
    { text: '構成（並べる順番）を考えて、展開のある曲の形にできる', need: ['try2', 'plan'] },
    { text: 'パフォームエフェクトを指でかけ、HOLD で固定できる', need: ['try3'] },
    { text: 'エフェクトの種類を耳で聞き分けられる', need: ['fx'] },
    { text: 'Koala で、構成どおりに最後まで演奏できる', need: ['check'] },
  ],
});

let ready = null;
const kit = () => (ready ||= loadKit());
const BPM = 92, STEP = 60 / BPM / 4, BAR = STEP * 16;
const ODD = [1, 3, 5, 7, 9, 11, 13, 15], ALL = Array.from({ length: 16 }, (_, i) => i + 1);
const ROWS = [{ id: 'kick' }, { id: 'snare' }, { id: 'hat', gain: 0.45 }, { id: 'ohat', gain: 0.4 }];
// ベースとメロディ（マス番号, 半音）
const notes = (id, list, gain = 0.8) => list.map(([n, s]) => ({ id, semis: id === 'pluck' ? s - 12 : s, t: (n - 1) * STEP, gain }));
const BASS = [[1, 0], [4, 0], [7, 7], [9, 0], [11, 10], [12, 0], [15, 5]];
const LEAD = [[1, 12], [7, 15], [11, 10]];

// ---------- 曲のブロック（教材オリジナル） ----------
const BLOCKS = {
  intro: { name: 'イントロ', color: '#8a7bd8', p: { hat: cells(...ODD) }, extra: () => notes('pluck', LEAD, 0.5) },
  a: { name: 'いつもの', color: '#3f8f6b', p: { kick: cells(1, 9, 11), snare: cells(5, 13), hat: cells(...ODD) }, extra: () => notes('bass', BASS) },
  brk: { name: 'ブレイク', color: '#d89a3b', p: { hat: cells(1, 5, 9, 13), ohat: cells(15) }, extra: () => notes('pluck', [[1, 12], [9, 10]], 0.6) },
  sabi: { name: 'サビ', color: '#d8553b', p: { kick: cells(1, 5, 9, 13), snare: cells(5, 13), hat: cells(...ALL), ohat: cells(3, 7, 11, 15) }, extra: () => [...notes('bass', BASS), ...notes('pluck', LEAD, 0.6)] },
  outro: { name: 'アウトロ', color: '#5d7fa8', p: { kick: cells(1), hat: cells(1, 5, 9, 13) }, extra: () => notes('bass', [[1, 0]]) },
};
const cache = new Map();
async function blockBuffer(key) {
  await kit();
  if (!cache.has(key)) cache.set(key, (await renderLoop(BLOCKS[key].p, { bpm: BPM, rows: ROWS, extra: BLOCKS[key].extra() })).buf);
  return cache.get(key);
}

// ---------- 6-2 構成表 ----------
let plan = read('plan', []);
const line = $('#arrLine');
$('#blockPalette').innerHTML = Object.entries(BLOCKS).map(([k, b]) => `<button class="chip blk" data-blk="${k}" style="--c:${b.color}">＋ ${b.name}</button>`).join('');
const drawPlan = (now = -1) => {
  line.innerHTML = plan.length
    ? plan.map((k, i) => `<span class="arr-blk${i === now ? ' now' : ''}" style="--c:${BLOCKS[k].color}">${i + 1}. ${esc(BLOCKS[k].name)}</span>`).join('')
    : '<span class="muted">ここに並びます</span>';
};
drawPlan();
$('#blockPalette').addEventListener('click', (e) => {
  const b = e.target.closest('[data-blk]');
  if (!b || plan.length >= 12) return;
  plan.push(b.dataset.blk);
  drawPlan();
  blockBuffer(b.dataset.blk).then((buf) => play(buf, synth.ctx.currentTime));
});
$('#arrUndo').addEventListener('click', () => { plan.pop(); drawPlan(); });
$('#arrClear').addEventListener('click', () => { plan = []; drawPlan(); });

const live = [];
function play(buf, when, out = synth.master) {
  const s = synth.ctx.createBufferSource();
  s.buffer = buf;
  s.connect(out);
  s.start(when);
  live.push(s);
  return s;
}
const stopAll = () => { live.splice(0).forEach((s) => { try { s.stop(); } catch { /* 済み */ } }); };
let arrTimers = [];
$('#arrPlay').addEventListener('click', async (e) => {
  if (arrTimers.length) {
    stopAll(); arrTimers.forEach(clearTimeout); arrTimers = []; drawPlan();
    e.target.textContent = '▶ 通して聞く';
    return;
  }
  if (!plan.length) return;
  e.target.textContent = '■ 止める';
  const t0 = synth.ctx.currentTime + 0.15;
  for (let i = 0; i < plan.length; i++) {
    const buf = await blockBuffer(plan[i]);
    for (let r = 0; r < 2; r++) play(buf, t0 + (i * 2 + r) * BAR);
    arrTimers.push(setTimeout(() => drawPlan(i), (t0 + i * 2 * BAR - synth.ctx.currentTime) * 1000));
  }
  arrTimers.push(setTimeout(() => { arrTimers = []; drawPlan(); e.target.textContent = '▶ 通して聞く'; }, (t0 + plan.length * 2 * BAR - synth.ctx.currentTime) * 1000 + 300));
});
$('#planSave').addEventListener('click', () => {
  const fb = $('[data-task="plan"] .feedback');
  const miss = [];
  if (plan.length < 5) miss.push(`あと ${5 - plan.length} ブロック`);
  if (!plan.includes('brk')) miss.push('ブレイクを入れる');
  if (!plan.includes('sabi')) miss.push('サビを入れる');
  if (miss.length) { fb.textContent = `あと少し：${miss.join('／')}`; fb.className = 'feedback ng'; return; }
  write('plan', plan);
  fb.textContent = `決定！ ${plan.map((k) => BLOCKS[k].name).join(' → ')}（約${Math.round(plan.length * 2 * BAR)}秒）`;
  fb.className = 'feedback ok';
  ch.clear('plan');
});

// ---------- 6-3 パフォームエフェクト ----------
// 経路： ループ → 音量 → 歪み（CRUSH）→ フィルター → スピーカー ／ フィルター → 響き（REVERB）→ スピーカー
let rig = null;
function makeRig() {
  if (rig) return rig;
  const ctx = synth.ctx;
  const main = ctx.createGain(), shaper = ctx.createWaveShaper(), filter = ctx.createBiquadFilter(), send = ctx.createGain(), conv = ctx.createConvolver();
  filter.type = 'lowpass';
  filter.frequency.value = 20000;
  send.gain.value = 0;
  conv.buffer = reverbIR(ctx, 2.6);
  main.connect(shaper).connect(filter).connect(synth.master);
  filter.connect(send).connect(conv).connect(synth.master);
  const crushCurve = new Float32Array(1024).map((_, i) => Math.round(((i / 1023) * 2 - 1) * 6) / 6); // ざっくり段々にする
  rig = { main, shaper, filter, send, crushCurve, src: null, startAt: 0, buf: null, stut: null };
  return rig;
}
async function startLoop() {
  const r = makeRig();
  const a = await blockBuffer('a'), s = await blockBuffer('sabi');
  // いつもの＋サビの2小節を1つのループに
  const ctx = synth.ctx;
  r.buf = ctx.createBuffer(2, a.length + s.length, a.sampleRate);
  for (let c = 0; c < 2; c++) { r.buf.getChannelData(c).set(a.getChannelData(c)); r.buf.getChannelData(c).set(s.getChannelData(c), a.length); }
  r.src = ctx.createBufferSource();
  r.src.buffer = r.buf;
  r.src.loop = true;
  r.src.loopEnd = BAR * 2;
  r.src.connect(r.main);
  r.startAt = ctx.currentTime + 0.05;
  r.src.start(r.startAt);
}
function stopLoop() {
  if (!rig?.src) return;
  try { rig.src.stop(); } catch { /* 済み */ }
  rig.src = null;
  Object.keys(FX).forEach((k) => FX[k].off());
}
const FX = {
  filter: {
    on: () => {},
    move: (y) => { // y: 0（上）〜1（下）
      const f = makeRig().filter, t = synth.ctx.currentTime;
      if (y < 0.5) { f.type = 'highpass'; f.frequency.setTargetAtTime(40 * Math.pow(100, (0.5 - y) * 2), t, 0.02); }
      else { f.type = 'lowpass'; f.frequency.setTargetAtTime(20000 * Math.pow(0.012, (y - 0.5) * 2), t, 0.02); }
    },
    off: () => { const f = makeRig().filter; f.type = 'lowpass'; f.frequency.setTargetAtTime(20000, synth.ctx.currentTime, 0.03); },
  },
  reverb: { on: () => makeRig().send.gain.setTargetAtTime(1, synth.ctx.currentTime, 0.05), off: () => makeRig().send.gain.setTargetAtTime(0, synth.ctx.currentTime, 0.2) },
  crush: { on: () => (makeRig().shaper.curve = makeRig().crushCurve), off: () => (makeRig().shaper.curve = null) },
  stutter: {
    on: () => {
      const r = makeRig();
      if (!r.src || r.stut) return;
      const ctx = synth.ctx, len = STEP * 2; // 8分音符ぶんをくり返す
      const pos = ((ctx.currentTime - r.startAt) % (BAR * 2) + BAR * 2) % (BAR * 2);
      const from = Math.floor(pos / len) * len;
      const s = ctx.createBufferSource();
      s.buffer = r.buf; s.loop = true; s.loopStart = from; s.loopEnd = from + len;
      s.connect(r.shaper);
      s.start(ctx.currentTime, from);
      r.main.gain.setTargetAtTime(0, ctx.currentTime, 0.005);
      r.stut = s;
    },
    off: () => {
      const r = makeRig();
      if (r.stut) { try { r.stut.stop(); } catch { /* 済み */ } r.stut = null; }
      r.main.gain.setTargetAtTime(1, synth.ctx.currentTime, 0.005);
    },
  },
};
let hold = false;
const holding = new Set();
$('#fxHold').addEventListener('click', (e) => {
  hold = !hold;
  e.target.textContent = `HOLD：${hold ? 'ON' : 'OFF'}`;
  e.target.classList.toggle('sel', hold);
  if (!hold) holding.forEach((k) => { FX[k].off(); $(`[data-fx="${k}"]`).classList.remove('on'); }), holding.clear();
});
$$('#fxPads [data-fx]').forEach((pad) => {
  const k = pad.dataset.fx;
  const yOf = (e) => { const r = pad.getBoundingClientRect(); return Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)); };
  pad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try { pad.setPointerCapture(e.pointerId); } catch { /* 指以外の入力では使えないことがある */ }
    if (hold && holding.has(k)) { holding.delete(k); FX[k].off(); pad.classList.remove('on'); return; }
    FX[k].on();
    FX[k].move?.(yOf(e));
    pad.classList.add('on');
  });
  pad.addEventListener('pointermove', (e) => { if (pad.classList.contains('on') && e.buttons) FX[k].move?.(yOf(e)); });
  const up = () => {
    if (!pad.classList.contains('on')) return;
    if (hold) { holding.add(k); return; }
    FX[k].off();
    pad.classList.remove('on');
  };
  pad.addEventListener('pointerup', up);
  pad.addEventListener('pointercancel', up);
  pad.addEventListener('contextmenu', (e) => e.preventDefault());
});
$('#fxLoop').addEventListener('click', async (e) => {
  await kit();
  if (rig?.src) { stopLoop(); e.target.textContent = '▶ ループを流す'; }
  else { await startLoop(); e.target.textContent = '■ 止める'; }
});

// ---------- 耳で当てる ----------
{
  const el = $('[data-task="fx"]');
  const btns = $$('[data-a]', el), fb = $('.feedback', el), st = $('.status', el), dots = $('.dots', el);
  const start = $('[data-start]', el), replay = $('[data-replay]', el);
  const NAME = { filter: 'FILTER', stutter: 'STUTTER', reverb: 'REVERB', crush: 'CRUSH' };
  let order = [], i = 0, correct = 0, marks = [], lock = false;
  const draw = () => (dots.innerHTML = order.map((_, k) => `<i class="${marks[k] || ''}"></i>`).join(''));
  async function playQ() {
    replay.disabled = true;
    stopLoop();
    await startLoop();
    const k = order[i];
    await sleep(BAR * 1000);
    FX[k].on();
    if (k === 'filter') FX.filter.move(0.85);
    await sleep(BAR * 1000);
    FX[k].off();
    await sleep(400);
    stopLoop();
    replay.disabled = false;
  }
  replay.addEventListener('click', playQ);
  async function ask() {
    st.textContent = `${i + 1} / ${order.length}`;
    fb.textContent = '1小節めはそのまま、2小節めにエフェクトがかかります…'; fb.className = 'feedback';
    btns.forEach((b) => (b.disabled = false));
    await playQ();
    fb.textContent = 'どのエフェクト？';
  }
  btns.forEach((b) => b.addEventListener('click', async () => {
    if (lock || !order[i]) return;
    lock = true;
    btns.forEach((x) => (x.disabled = true));
    const ok = b.dataset.a === order[i];
    if (ok) correct++;
    marks[i] = ok ? 'ok' : 'ng';
    draw();
    fb.textContent = ok ? `正解！ ${NAME[order[i]]}` : `ざんねん、${NAME[order[i]]}でした`;
    fb.className = `feedback ${ok ? 'ok' : 'ng'}`;
    await sleep(ok ? 1000 : 1800);
    lock = false;
    i++;
    if (i < order.length) return ask();
    replay.disabled = true;
    start.textContent = 'もう一度';
    if (correct >= 3) { fb.textContent = `クリア！ 4問中${correct}問`; fb.className = 'feedback ok'; ch.clear('fx'); }
    else { fb.textContent = `4問中${correct}問。3問でクリア。上のパッドで1つずつ試してから`; fb.className = 'feedback ng'; }
  }));
  start.addEventListener('click', async () => {
    await kit();
    $('#fxLoop').textContent = '▶ ループを流す';
    order = Object.keys(NAME).sort(() => Math.random() - 0.5);
    i = 0; correct = 0; marks = [];
    draw();
    ask();
  });
}

window.addEventListener('pagehide', () => { stopAll(); stopLoop(); });
ch.checklist('check');
ch.renderProgress();
