// マス目のシーケンサー（ビートの「設計図」）。Koala のグリッドに写す前に、ブラウザで組んで聞いてみる。
import { synth } from './synth.js';
import { playPad, bufferOf } from './kitplayer.js';

export const DRUM_ROWS = [
  { id: 'kick', name: 'キック' },
  { id: 'snare', name: 'スネア' },
  { id: 'hat', name: 'ハット閉' },
  { id: 'ohat', name: 'ハット開' },
];

// 16分のスウィング：裏の16分を遅らせる量（0〜1。0.5 で約3連符寄り）
export const swingOffset = (i, step, swing) => (i % 2 === 1 ? swing * step * 0.66 : 0);

export class StepSeq {
  /**
   * @param {HTMLElement} el
   * @param {object} o rows, steps=16, bpm=90, swing=0, editable=true, onChange
   */
  constructor(el, { rows = DRUM_ROWS, steps = 16, bpm = 90, swing = 0, editable = true, onChange = () => {} } = {}) {
    this.el = el;
    this.rows = rows;
    this.steps = steps;
    this.bpm = bpm;
    this.swing = swing;
    this.editable = editable;
    this.onChange = onChange;
    this.pattern = Object.fromEntries(rows.map((r) => [r.id, Array(steps).fill(false)]));
    this.timer = null;
    this.render();
    el.addEventListener('click', (e) => {
      const c = e.target.closest('[data-cell]');
      if (!c || !this.editable) return;
      const [rid, i] = c.dataset.cell.split(':');
      this.pattern[rid][i] = !this.pattern[rid][i];
      c.classList.toggle('on', this.pattern[rid][i]);
      if (this.pattern[rid][i] && !this.playing) playPad(rid, { choke: rid.includes('hat') ? 1 : 0 });
      this.onChange(this.pattern);
    });
  }

  render() {
    const head = `<div class="ss-row ss-head"><span></span>${Array.from({ length: this.steps }, (_, i) => `<span class="ss-num${i % 4 === 0 ? ' beat' : ''}">${i % 4 === 0 ? i / 4 + 1 : ''}</span>`).join('')}</div>`;
    this.el.classList.add('stepseq');
    this.el.style.setProperty('--steps', this.steps);
    this.el.innerHTML = head + this.rows.map((r) => `<div class="ss-row"><span class="ss-name">${r.name}</span>${this.pattern[r.id].map((on, i) =>
      `<button class="ss-cell${on ? ' on' : ''}${i % 4 === 0 ? ' beat' : ''}" data-cell="${r.id}:${i}" aria-label="${r.name} ${i + 1}マス目"${this.editable ? '' : ' disabled'}></button>`).join('')}</div>`).join('');
  }

  set(pattern) {
    for (const r of this.rows) this.pattern[r.id] = (pattern[r.id] || []).slice(0, this.steps).concat(Array(this.steps).fill(false)).slice(0, this.steps).map(Boolean);
    this.render();
    this.onChange(this.pattern);
  }
  clear() {
    this.set({});
  }

  get playing() {
    return !!this.timer;
  }

  async play() {
    await synth.start();
    if (this.timer) return;
    const ctx = synth.ctx;
    let i = 0, next = ctx.currentTime + 0.08;
    const tick = () => {
      const step = 60 / this.bpm / 4;
      while (next < ctx.currentTime + 0.12) {
        const t = next + swingOffset(i, step, this.swing);
        for (const r of this.rows) {
          if (this.pattern[r.id][i] && bufferOf(r.id)) playPad(r.id, { when: t, choke: r.id.includes('hat') ? 1 : 0, gain: r.gain ?? 1, semis: r.semis || 0 });
        }
        const at = i;
        setTimeout(() => this.highlight(at), Math.max(0, (t - ctx.currentTime) * 1000));
        i = (i + 1) % this.steps;
        next += step;
      }
    };
    tick();
    this.timer = setInterval(tick, 25);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
    this.highlight(-1);
  }

  highlight(i) {
    this.el.querySelectorAll('.ss-cell.now').forEach((c) => c.classList.remove('now'));
    if (i >= 0) this.el.querySelectorAll(`[data-cell$=":${i}"]`).forEach((c) => c.classList.add('now'));
  }
}

// パターンが同じか（課題の判定用）
export function samePattern(a, b, rows = DRUM_ROWS) {
  return rows.every((r) => (a[r.id] || []).every((v, i) => !!v === !!(b[r.id] || [])[i]));
}
// どこが違うか（ヒント用）
export function diffPattern(have, want, rows = DRUM_ROWS) {
  const out = [];
  for (const r of rows) {
    const extra = [], missing = [];
    want[r.id].forEach((v, i) => {
      if (v && !have[r.id][i]) missing.push(i + 1);
      if (!v && have[r.id][i]) extra.push(i + 1);
    });
    if (missing.length || extra.length) out.push(`${r.name}：${missing.length ? `足りない ${missing.join('・')}マス目` : ''}${missing.length && extra.length ? '、' : ''}${extra.length ? `余分 ${extra.join('・')}マス目` : ''}`);
  }
  return out;
}

// 「1, 5, 9, 13」のようなマス番号（1始まり）から1段ぶんを作る
export const cells = (...nums) => Array.from({ length: 16 }, (_, i) => nums.includes(i + 1));

// パターンを1つの音（AudioBuffer）に焼き込む。エフェクトの聞き比べなどに使う
export async function renderLoop(pattern, { bpm = 90, bars = 1, rows = DRUM_ROWS, swing = 0, extra = [] } = {}) {
  const step = 60 / bpm / 4, len = step * 16 * bars;
  const rate = 44100;
  const ctx = new OfflineAudioContext(2, Math.ceil((len + 0.5) * rate), rate);
  for (let b = 0; b < bars; b++) {
    for (let i = 0; i < 16; i++) {
      const t = b * 16 * step + i * step + swingOffset(i, step, swing);
      for (const r of rows) {
        if (!pattern[r.id]?.[i]) continue;
        const s = ctx.createBufferSource();
        s.buffer = bufferOf(r.id);
        s.playbackRate.value = Math.pow(2, (r.semis || 0) / 12);
        const g = ctx.createGain();
        g.gain.value = r.gain ?? 1;
        s.connect(g).connect(ctx.destination);
        s.start(t);
      }
    }
  }
  for (const x of extra) {
    const s = ctx.createBufferSource();
    s.buffer = bufferOf(x.id);
    s.playbackRate.value = Math.pow(2, (x.semis || 0) / 12);
    const g = ctx.createGain();
    g.gain.value = x.gain ?? 1;
    s.connect(g).connect(ctx.destination);
    s.start(x.t);
  }
  const buf = await ctx.startRendering();
  return { buf, len };
}
