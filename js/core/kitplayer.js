// 素材キットをブラウザの中で「パッド」として鳴らす。Koala でやることを、先に耳で確かめるための道具。
import { synth } from './synth.js';
import { KIT } from './kit.js';
import { render } from './wav.js';

const buffers = new Map();   // id -> AudioBuffer
const reversed = new Map();  // id -> 逆再生用の AudioBuffer
const playing = new Map();   // id -> 鳴っている音（チョーク・押している間だけ鳴らす用）

export async function loadKit() {
  await synth.start();
  for (const k of KIT) if (!buffers.has(k.id)) buffers.set(k.id, await render(k.build, { seconds: k.seconds }));
  return buffers;
}
export const bufferOf = (id) => buffers.get(id);

function reverseOf(id) {
  if (!reversed.has(id)) {
    const src = buffers.get(id), ctx = synth.ctx;
    const b = ctx.createBuffer(src.numberOfChannels, src.length, src.sampleRate);
    for (let c = 0; c < src.numberOfChannels; c++) b.getChannelData(c).set([...src.getChannelData(c)].reverse());
    reversed.set(id, b);
  }
  return reversed.get(id);
}

/**
 * パッドを鳴らす。
 * @param {string} id 素材の id
 * @param {object} o
 *   when: 鳴らす時刻（AudioContext の時刻。省略で今）
 *   semis: 高さ（半音。+12 で1オクターブ上＝速く短くなる）
 *   gain, pan, reverse, loop
 *   start, end: 切り出し（0〜1 の割合）
 *   choke: 同じ番号の音を止める
 *   out: つなぎ先（省略でスピーカー）
 */
export function playPad(id, o = {}) {
  const ctx = synth.ctx;
  const t = o.when ?? ctx.currentTime;
  const buf = o.reverse ? reverseOf(id) : buffers.get(id);
  if (!buf) return null;
  if (o.choke) {
    for (const [pid, p] of playing) if (p.choke === o.choke && pid !== `${id}`) stopPad(pid, t);
  }
  stopPad(id, t);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = Math.pow(2, (o.semis || 0) / 12);
  const g = ctx.createGain();
  g.gain.value = o.gain ?? 1;
  const p = ctx.createStereoPanner();
  p.pan.value = o.pan || 0;
  src.connect(g).connect(p).connect(o.out || synth.master);
  const s = (o.start || 0) * buf.duration, e = (o.end ?? 1) * buf.duration;
  if (o.loop) {
    src.loop = true;
    src.loopStart = s;
    src.loopEnd = e;
    src.start(t, s);
  } else src.start(t, s, Math.max(0.005, e - s));
  const entry = { src, g, choke: o.choke };
  playing.set(`${id}`, entry);
  src.onended = () => { if (playing.get(`${id}`) === entry) playing.delete(`${id}`); };
  return entry;
}

export function stopPad(id, t = synth.ctx?.currentTime || 0) {
  const p = playing.get(`${id}`);
  if (!p) return;
  playing.delete(`${id}`);
  p.g.gain.setTargetAtTime(0, t, 0.01);
  try { p.src.stop(t + 0.05); } catch { /* 済み */ }
}

// 波形を描く（切り出しの印つき）
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
export function drawWave(canvas, buf, { start = 0, end = 1, playhead = null } = {}) {
  const dpr = window.devicePixelRatio || 1, w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w) return;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = css('--scope-bg');
  g.fillRect(0, 0, w, h);
  if (!buf) return;
  const d = buf.getChannelData(0), step = Math.max(1, Math.floor(d.length / w));
  g.fillStyle = 'rgba(255,255,255,0.08)';
  g.fillRect(0, 0, start * w, h);
  g.fillRect(end * w, 0, w - end * w, h);
  for (let x = 0; x < w; x++) {
    let mx = 0;
    for (let i = x * step; i < (x + 1) * step && i < d.length; i++) mx = Math.max(mx, Math.abs(d[i]));
    const inside = x / w >= start && x / w <= end;
    g.fillStyle = inside ? css('--scope-line') : '#4a5060';
    g.fillRect(x, h / 2 - mx * (h / 2 - 2), 1, Math.max(1, mx * (h - 4)));
  }
  g.fillStyle = '#ff7a42';
  g.fillRect(start * w - 1, 0, 2, h);
  g.fillRect(end * w - 1, 0, 2, h);
  if (playhead !== null) {
    g.fillStyle = '#fff';
    g.fillRect(playhead * w, 0, 1, h);
  }
}
