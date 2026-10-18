// 教材オリジナルの素材キット。すべてブラウザの中で合成するので、著作権の心配がない。
// 各レシピは (ctx, out) を受け取り、0秒から鳴らす。seconds は書き出す長さ。
const noise = (ctx, sec) => {
  const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * sec), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource();
  s.buffer = b;
  return s;
};
const env = (ctx, out, peak, len, t0 = 0) => {
  const g = ctx.createGain();
  g.gain.setValueAtTime(peak, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
  g.connect(out);
  return g;
};
const freq = (n) => 440 * Math.pow(2, (n - 69) / 12);

export const KIT = [
  {
    id: 'kick', name: 'キック', file: 'lab-kick.wav', seconds: 0.6, hint: '低い「ドン」。ビートの土台',
    build(ctx, out) {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(160, 0);
      o.frequency.exponentialRampToValueAtTime(42, 0.14);
      o.connect(env(ctx, out, 0.8, 0.5));
      o.start(0); o.stop(0.55);
      const c = noise(ctx, 0.02), f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 2000;
      c.connect(f).connect(env(ctx, out, 0.25, 0.015));
      c.start(0);
    },
  },
  {
    id: 'snare', name: 'スネア', file: 'lab-snare.wav', seconds: 0.4, hint: '「タン」。2拍目と4拍目に',
    build(ctx, out) {
      const n = noise(ctx, 0.35), f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 0.8;
      n.connect(f).connect(env(ctx, out, 0.8, 0.22));
      n.start(0);
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(240, 0);
      o.frequency.exponentialRampToValueAtTime(160, 0.08);
      o.connect(env(ctx, out, 0.45, 0.12));
      o.start(0); o.stop(0.15);
    },
  },
  {
    id: 'clap', name: 'クラップ', file: 'lab-clap.wav', seconds: 0.5, hint: '手拍子。スネアと重ねても',
    build(ctx, out) {
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1.2;
      f.connect(out);
      [0, 0.012, 0.024, 0.036].forEach((t, i) => {
        const n = noise(ctx, 0.3);
        n.connect(env(ctx, f, i === 3 ? 0.9 : 0.6, i === 3 ? 0.25 : 0.01, t));
        n.start(t);
      });
    },
  },
  {
    id: 'hat', name: 'ハイハット（閉）', file: 'lab-hat-closed.wav', seconds: 0.15, hint: '「チッ」。細かく刻む',
    build(ctx, out) {
      const n = noise(ctx, 0.1), f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 7500;
      n.connect(f).connect(env(ctx, out, 0.5, 0.05));
      n.start(0);
    },
  },
  {
    id: 'ohat', name: 'ハイハット（開）', file: 'lab-hat-open.wav', seconds: 0.7, hint: '「シャーン」。閉じたハットで止まるようにすると気持ちいい（第3章）',
    build(ctx, out) {
      const n = noise(ctx, 0.7), f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 6500;
      n.connect(f).connect(env(ctx, out, 0.45, 0.6));
      n.start(0);
    },
  },
  {
    id: 'bass', name: 'ベース（ド）', file: 'lab-bass-C.wav', seconds: 1.2, hint: '1音だけのベース。第5章で鍵盤のように音程をつけて弾く',
    build(ctx, out) {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = freq(36);
      f.type = 'lowpass'; f.frequency.setValueAtTime(1200, 0); f.frequency.exponentialRampToValueAtTime(250, 0.4);
      g.gain.setValueAtTime(0.0001, 0); g.gain.exponentialRampToValueAtTime(0.7, 0.01); g.gain.setTargetAtTime(0.0001, 0.6, 0.15);
      o.connect(f).connect(g).connect(out);
      o.start(0); o.stop(1.2);
    },
  },
  {
    id: 'chord', name: 'コード（Am）', file: 'lab-chord-Am.wav', seconds: 1.6, hint: 'ラ・ド・ミの和音。上ものに',
    build(ctx, out) {
      [57, 60, 64, 69].forEach((n, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner();
        o.type = 'triangle'; o.frequency.value = freq(n); o.detune.value = i % 2 ? 6 : -6;
        p.pan.value = i % 2 ? 0.3 : -0.3;
        g.gain.setValueAtTime(0.0001, 0); g.gain.linearRampToValueAtTime(0.18, 0.03); g.gain.setTargetAtTime(0.0001, 0.9, 0.2);
        o.connect(g).connect(p).connect(out);
        o.start(0); o.stop(1.6);
      });
    },
  },
  {
    id: 'pluck', name: 'ポン（ド）', file: 'lab-pluck-C.wav', seconds: 0.8, hint: '短い音程つきの音。メロディ用（第5章）',
    build(ctx, out) {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter();
      o.type = 'square'; o.frequency.value = freq(72);
      f.type = 'lowpass'; f.frequency.setValueAtTime(5000, 0); f.frequency.exponentialRampToValueAtTime(400, 0.3);
      o.connect(f).connect(env(ctx, out, 0.35, 0.6));
      o.start(0); o.stop(0.7);
    },
  },
];
