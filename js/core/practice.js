// 指ドラムの練習：メトロノームに合わせて画面のパッドを叩き、タイミングを採点する。
// FM-1 ラボの rhythm.js の考え方を、コアラ・ラボ用に小さくしたもの。
import { synth } from './synth.js';
import { playPad } from './kitplayer.js';
import { settings } from './store.js';

// Web Audio の時刻 → performance.now()（スピーカーから出る瞬間に合わせる）
export function ctxToPerf(t) {
  const ctx = synth.ctx;
  if (ctx.getOutputTimestamp) {
    const ts = ctx.getOutputTimestamp();
    if (ts.performanceTime) return ts.performanceTime + (t - ts.contextTime) * 1000;
  }
  const lat = (ctx.outputLatency || ctx.baseLatency || 0) * 1000;
  return performance.now() + (t - ctx.currentTime) * 1000 + lat;
}

function click(t, accent) {
  const ctx = synth.ctx, o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.value = accent ? 1760 : 1100;
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  o.connect(g).connect(synth.master);
  o.start(t);
  o.stop(t + 0.06);
}

// 目標と打鍵を突き合わせて採点（1つの打鍵は1つの目標にだけ使う）
export function score(targets, taps, { perfect = 45, good = 100, window = 200 } = {}) {
  const used = new Set();
  const results = targets.map((t) => {
    let best = -1, bestD = Infinity;
    taps.forEach((x, j) => { if (!used.has(j) && Math.abs(x - t) < bestD) { bestD = Math.abs(x - t); best = j; } });
    if (best < 0 || bestD > window) return { target: t, grade: 'miss' };
    used.add(best);
    const offset = taps[best] - t;
    return { target: t, offset, grade: Math.abs(offset) <= perfect ? 'perfect' : Math.abs(offset) <= good ? 'good' : 'late' };
  });
  const extra = taps.length - used.size;
  const pts = results.reduce((s, r) => s + ({ perfect: 100, good: 75, late: 35, miss: 0 }[r.grade]), 0);
  return { results, extra, score: Math.max(0, Math.round(pts / Math.max(1, targets.length) - extra * 5)) };
}

/**
 * 画面のパッドで叩く練習を1回分流す。
 * pads: [{id, el}]（叩くと音が鳴るボタン）
 * want: { kick: [拍の位置...], snare: [...] }（拍。0 = 1小節目の1拍目、0.5 = その裏）
 * 戻り値：{ byPad: {id: score結果}, score, taps, startPerf, beatMs }
 */
export async function runPractice({ pads, want, bpm = 90, beats = 8, countIn = 4, onTap = () => {}, onStop }) {
  await synth.start();
  const ctx = synth.ctx, beat = 60 / bpm, t0 = ctx.currentTime + 0.3;
  for (let i = 0; i < countIn + beats; i++) click(t0 + i * beat, i % 4 === 0);
  const startPerf = ctxToPerf(t0 + countIn * beat), beatMs = beat * 1000;
  const offset = () => settings.get().tapOffset || 0;
  const taps = []; // {id, time}
  const handlers = pads.map(({ id, el }) => {
    const h = (e) => {
      e.preventDefault();
      taps.push({ id, time: performance.now() - offset() });
      onTap(id);
    };
    el.addEventListener('pointerdown', h);
    return () => el.removeEventListener('pointerdown', h);
  });
  let cancelled = false;
  const endPerf = startPerf + beats * beatMs;
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, endPerf + 350 - performance.now());
    onStop?.(() => { cancelled = true; clearTimeout(timer); resolve(); });
  });
  handlers.forEach((off) => off());
  if (cancelled) return null;
  const inRange = taps.filter((t) => t.time > startPerf - beatMs * 0.5 && t.time < endPerf + 250);
  const byPad = {};
  let sum = 0, n = 0;
  for (const [id, list] of Object.entries(want)) {
    const r = score(list.map((b) => startPerf + b * beatMs), inRange.filter((t) => t.id === id).map((t) => t.time));
    byPad[id] = r;
    sum += r.score * list.length;
    n += list.length;
  }
  return { byPad, score: Math.round(sum / Math.max(1, n)), taps: inRange, startPerf, beatMs };
}

// 叩いた位置を16分のマスに寄せる（クオンタイズの見本）
export const toStep = (time, startPerf, beatMs) => Math.round(((time - startPerf) / beatMs) * 4);

// ずれの平均（補正用）
export function averageOffset(res) {
  const offs = Object.values(res.byPad).flatMap((r) => r.results.filter((x) => x.offset !== undefined).map((x) => x.offset));
  return offs.length >= 4 ? offs.reduce((a, b) => a + b, 0) / offs.length : null;
}

// 打った音を鳴らすパッド（画面のボタン）を作る
export function mountPads(el, list) {
  el.classList.add('practice-pads');
  el.innerHTML = list.map((p) => `<button class="ppad" data-pad="${p.id}">${p.name}</button>`).join('');
  const pads = list.map((p) => ({ id: p.id, el: el.querySelector(`[data-pad="${p.id}"]`) }));
  pads.forEach(({ id, el: b }) => {
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      playPad(id, { choke: id.includes('hat') ? 1 : 0 });
      b.classList.add('down');
      setTimeout(() => b.classList.remove('down'), 90);
    });
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  });
  return pads;
}
