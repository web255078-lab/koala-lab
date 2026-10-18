// 第3章 音を整える
import { createChapter, $, $$, sleep, shuffle } from './core/klesson.js';
import { synth } from './core/synth.js';
import { loadKit, playPad, stopPad, bufferOf, drawWave } from './core/kitplayer.js';

const ch = createChapter({
  id: 'ch03',
  title: '第3章 音を整える',
  tasks: ['trim', 'ear', 'check'],
  tries: ['try1', 'try2', 'try3', 'try4'],
  cando: [
    { text: 'トリムで頭出しして、余計な無音や雑音を切れる', need: ['try1', 'trim'] },
    { text: 'ワンショット・リバース・ループで鳴り方を決められる', need: ['try2'] },
    { text: 'VOL・PITCH・PAN・TONE で音を整え、バランスを取れる', need: ['try3'] },
    { text: 'チョークで、開いたハットを閉じたハットで止められる', need: ['try4'] },
    { text: '音の変化（逆再生・高さ）を耳で聞き分けられる', need: ['ear', 'check'] },
  ],
});

let ready = null;
const kit = () => (ready ||= loadKit());

// ---------- 3-1 トリム ----------
// 無音 0.35秒 → クラップ → 雑音 0.4秒 の「録りっぱなし」の音を作る
const LEAD = 0.35, TAIL = 0.4;
let rough = null, onset = 0, noiseAt = 0;
async function makeRough() {
  await kit();
  if (rough) return rough;
  const clap = bufferOf('clap'), sr = clap.sampleRate;
  const lead = Math.round(LEAD * sr), tail = Math.round(TAIL * sr);
  rough = synth.ctx.createBuffer(2, lead + clap.length + tail, sr);
  for (let c = 0; c < 2; c++) {
    const d = rough.getChannelData(c), src = clap.getChannelData(Math.min(c, clap.numberOfChannels - 1));
    for (let i = 0; i < lead; i++) d[i] = (Math.random() * 2 - 1) * 0.004; // ほぼ無音（部屋の空気の音）
    d.set(src, lead);
    for (let i = 0; i < tail; i++) d[lead + clap.length + i] = (Math.random() * 2 - 1) * 0.12; // ガサッという雑音
  }
  onset = lead / rough.length;
  noiseAt = (lead + clap.length) / rough.length;
  return rough;
}
const trimS = $('#trimStart'), trimE = $('#trimEnd'), trimWave = $('#trimWave');
const range = () => {
  let s = trimS.value / 1000, e = trimE.value / 1000;
  if (e - s < 0.02) e = Math.min(1, s + 0.02);
  return [s, e];
};
const redrawTrim = () => rough && drawWave(trimWave, rough, { start: range()[0], end: range()[1] });
[trimS, trimE].forEach((r) => r.addEventListener('input', redrawTrim));
$('#trimPlay').addEventListener('click', async () => {
  await makeRough();
  const [s, e] = range();
  const src = synth.ctx.createBufferSource();
  src.buffer = rough;
  src.connect(synth.ctx.destination);
  src.start(synth.ctx.currentTime, s * rough.duration, (e - s) * rough.duration);
});
$('#trimJudge').addEventListener('click', async () => {
  await makeRough();
  const [s, e] = range(), dur = rough.duration;
  const fb = $('[data-task="trim"] .feedback');
  const ds = (s - onset) * dur * 1000; // ms（マイナス＝早すぎ、プラス＝音の頭を切りすぎ）
  const msgs = [];
  if (ds < -30) msgs.push(`始まりに無音が ${Math.round(-ds)}ms 残っています。もう少し右へ`);
  if (ds > 8) msgs.push('始まりが音の頭を切っています。少し左へ');
  if (e > noiseAt + 0.01) msgs.push('終わりに雑音が入っています。左へ');
  if (e < onset + (noiseAt - onset) * 0.6) msgs.push('終わりが短すぎて、音のおしりが切れています');
  if (msgs.length) { fb.textContent = msgs.join('／'); fb.className = 'feedback ng'; return; }
  fb.textContent = `クリア！ 頭出しのずれ ${Math.abs(Math.round(ds))}ms`;
  fb.className = 'feedback ok';
  ch.clear('trim');
});
// 画面に入ったら波形を出す
new IntersectionObserver(async (es) => { if (es.some((x) => x.isIntersecting)) { await makeRough(); redrawTrim(); } }).observe(trimWave);
window.addEventListener('resize', redrawTrim);

// ---------- 3-2 鳴り方 ----------
const modes = new Set(['oneshot']);
const syncModes = () => $$('#modeChips [data-mode]').forEach((b) => b.classList.toggle('sel', modes.has(b.dataset.mode)));
$$('#modeChips [data-mode]').forEach((b) => b.addEventListener('click', () => {
  modes.has(b.dataset.mode) ? modes.delete(b.dataset.mode) : modes.add(b.dataset.mode);
  syncModes();
}));
syncModes();
const pad = $('#bigPad');
pad.addEventListener('pointerdown', async (e) => {
  e.preventDefault();
  await kit();
  pad.classList.add('down');
  playPad('chord', { reverse: modes.has('reverse'), loop: modes.has('loop') });
});
const padUp = () => {
  if (!pad.classList.contains('down')) return;
  pad.classList.remove('down');
  // ワンショットでもループ中は離すと止める（Koala でも LOOP 中は ONE SHOT が HOLD に変わる）
  if (!modes.has('oneshot') || modes.has('loop')) stopPad('chord');
};
['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => pad.addEventListener(ev, padUp));
pad.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------- 3-3 高さ ----------
const pitch = $('#pitch'), pitchWave = $('#pitchWave');
async function drawPitch() {
  await kit();
  const b = bufferOf('kick'), semis = Number(pitch.value), rate = Math.pow(2, semis / 12);
  // 再生速度を変えたときの長さの変化を、横の長さで見せる（基準の2倍まで）
  const w = pitchWave.clientWidth;
  drawWave(pitchWave, b, { start: 0, end: Math.min(1, (1 / rate) / 2) });
  const g = pitchWave.getContext('2d');
  g.fillStyle = '#ff7a42';
  g.font = '12px system-ui';
  g.fillText(`長さ ${Math.round((b.duration / rate) * 1000)}ms`, 8, 16);
  if (w) g.fillRect(w / 2, 0, 1, pitchWave.clientHeight);
}
pitch.addEventListener('input', () => { $('#pitchVal').textContent = pitch.value > 0 ? `+${pitch.value}` : pitch.value; drawPitch(); });
$('#pitchPlay').addEventListener('click', async () => { await kit(); playPad('kick', { semis: Number(pitch.value) }); });
new IntersectionObserver((es) => es.some((x) => x.isIntersecting) && drawPitch()).observe(pitchWave);

// ---------- 3-4 チョーク ----------
let choke = false, chokeTimer = null;
$('#chokeBtn').addEventListener('click', (e) => {
  choke = !choke;
  e.target.textContent = `止め合う：${choke ? 'ON' : 'OFF'}`;
  e.target.classList.toggle('sel', choke);
});
$('#chokePlay').addEventListener('click', async (e) => {
  await kit();
  if (chokeTimer) {
    clearInterval(chokeTimer);
    chokeTimer = null;
    e.target.textContent = '▶ 流す';
    return;
  }
  e.target.textContent = '■ 止める';
  const step = 60 / 100 / 4;
  const loop = () => {
    const t0 = synth.ctx.currentTime + 0.05;
    // 1拍目キック、2拍目の頭に開いたハット、その16分あとに閉じたハット…をくり返す
    [[0, 'kick'], [2, 'hat'], [4, 'ohat'], [5, 'hat'], [6, 'hat'], [8, 'kick'], [10, 'hat'], [12, 'ohat'], [13, 'hat'], [14, 'hat']]
      .forEach(([i, id]) => playPad(id, { when: t0 + i * step, choke: choke && id.includes('hat') ? 1 : 0, gain: id === 'kick' ? 0.9 : 0.7 }));
  };
  loop();
  chokeTimer = setInterval(loop, step * 16 * 1000);
});

// ---------- 耳で当てる ----------
{
  const el = $('[data-task="ear"]');
  const btns = $$('[data-a]', el), fb = $('.feedback', el), st = $('.status', el), dots = $('.dots', el);
  const start = $('[data-start]', el), replay = $('[data-replay]', el), ref = $('[data-ref]', el);
  const OPT = { normal: {}, reverse: { reverse: true }, up: { semis: 7 }, down: { semis: -7 } };
  const NAME = { normal: 'そのまま', reverse: '逆再生', up: '高く', down: '低く' };
  let order = [], i = 0, correct = 0, marks = [], lock = false;
  const draw = () => (dots.innerHTML = order.map((_, k) => `<i class="${marks[k] || ''}"></i>`).join(''));
  const playQ = () => order[i] && playPad('pluck', OPT[order[i]]);
  replay.addEventListener('click', playQ);
  ref.addEventListener('click', () => playPad('pluck', {}));
  async function ask() {
    st.textContent = `${i + 1} / ${order.length}`;
    fb.textContent = '聞いてください…'; fb.className = 'feedback';
    await sleep(300);
    playQ();
    btns.forEach((b) => (b.disabled = false));
    fb.textContent = 'どう変えた？（「そのままの音」で聞き比べてもOK）';
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
    replay.disabled = ref.disabled = true;
    start.textContent = 'もう一度';
    if (correct >= 5) { fb.textContent = `クリア！ 6問中${correct}問`; fb.className = 'feedback ok'; ch.clear('ear'); }
    else { fb.textContent = `6問中${correct}問。5問でクリア`; fb.className = 'feedback ng'; }
  }));
  start.addEventListener('click', async () => {
    await kit();
    const base = ['normal', 'reverse', 'up', 'down'];
    order = shuffle([...base, ...shuffle(base).slice(0, 2)]);
    i = 0; correct = 0; marks = [];
    replay.disabled = ref.disabled = false;
    draw();
    ask();
  });
}

ch.checklist('check');
ch.renderProgress();
