// 章ページの共通部品（コアラ・ラボ版）。
// Koala はブラウザから中をのぞけないアプリなので、「やってみる」は本人の申告（やってみたボタン）で開く。
// 判定できるのは、ブラウザ側のクイズ・耳の課題・素材づくり・チェックリスト。
import { synth } from './synth.js';
import { progress, setTaskAliases, isSandbox, askPersist } from './store.js';
import { TASK_ALIASES } from './chapters.js';
import { mountVerifies } from './checks.js';

setTaskAliases(TASK_ALIASES);
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function mountShell({ root = '.', title = '' } = {}) {
  const bar = document.createElement('header');
  bar.className = 'topbar';
  bar.innerHTML = `
    <a class="home" href="${root}/index.html">コアラ・ラボ</a>
    <span class="crumb">${title}</span>
    <span class="spacer"></span>
    <button type="button" class="pill" id="sh-audio">🔇 音を出す</button>`;
  document.body.prepend(bar);
  if (isSandbox) {
    const b = document.createElement('div');
    b.className = 'sandbox-banner';
    b.textContent = 'テスト用の画面です（ここでの記録は本物の記録と別に保存されます）';
    bar.after(b);
  }
  const btn = bar.querySelector('#sh-audio');
  const refresh = () => {
    btn.textContent = synth.ready ? '🔊 音ON' : '🔇 音を出す';
    btn.classList.toggle('on', synth.ready);
  };
  const unlock = async () => { await synth.start(); refresh(); };
  btn.addEventListener('click', unlock);
  window.addEventListener('pointerdown', unlock, { once: true, capture: true });
  askPersist();
  mountOfflineStatus(bar);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register(`${root}/sw.js`).catch(() => {});
}

/**
 * @param {{id, title, tasks: string[], tries: string[], cando: {text, need}[]}} o
 */
export function createChapter(o) {
  const CH = o.id;
  mountShell({ root: '..', title: o.title });

  mountVerifies();
  const isDone = (id) => !!progress.chapter(CH).tasks[id];

  function renderProgress() {
    const t = progress.chapter(CH).tasks;
    const all = [...o.tasks, ...o.tries];
    const bar = $('#chbar');
    if (bar) bar.style.width = `${(all.filter((k) => t[k]).length / all.length) * 100}%`;
    const list = $('#candoList');
    if (list) list.innerHTML = o.cando.map((c) => `<li><span class="soon cando"><span class="no">${c.need.every((k) => t[k]) ? '✅' : '⬜'}</span><span>${c.text}</span></span></li>`).join('');
    if (o.tasks.every((k) => t[k])) progress.markDone(CH);
    for (const id of o.tasks) if (t[id]) showCleared(id);
    for (const id of o.tries) if (t[id]) open(id, false);
  }

  // 「やってみる」を開く
  function open(tryId, save = true) {
    const sec = document.querySelector(`[data-try="${tryId}"]`);
    if (!sec) return;
    sec.classList.add('revealed');
    $$('[data-reveal], [data-did]', sec).forEach((b) => (b.hidden = true));
    if (save && !isDone(tryId)) {
      progress.markTask(CH, tryId);
      renderProgress();
    }
  }
  // Koala でやってみたら押す（記録する）
  $$('[data-did]').forEach((b) => b.addEventListener('click', () => {
    open(b.closest('.lesson').dataset.try);
    const fb = $('[data-fb]', b.closest('.lesson'));
    if (fb) { fb.textContent = 'おつかれさま！ 下を読んでみましょう'; fb.className = 'feedback ok'; }
  }));
  // 先に読むだけ（記録しない）
  $$('[data-reveal]').forEach((b) => b.addEventListener('click', () => {
    b.closest('.lesson').classList.add('revealed');
    b.hidden = true;
  }));

  function showCleared(id) {
    const el = document.querySelector(`[data-task="${id}"]`);
    if (!el) return;
    el.classList.add('cleared');
    const st = $('.status', el);
    if (st) st.textContent = 'クリア ✓';
  }
  function clear(id) {
    if (!isDone(id)) progress.markTask(CH, id);
    showCleared(id);
    renderProgress();
  }

  // ---- チェックリスト課題：全部チェックでクリア（チェック状態も記録） ----
  function checklist(id) {
    const el = document.querySelector(`[data-task="${id}"]`);
    const boxes = $$('input[type="checkbox"][data-item]', el);
    const t = progress.chapter(CH).tasks;
    boxes.forEach((b) => {
      const key = `${id}:${b.dataset.item}`;
      b.checked = !!t[key] || !!t[id];
      b.addEventListener('change', () => {
        if (b.checked) progress.markTask(CH, key);
        if (boxes.every((x) => x.checked)) {
          clear(id);
          const fb = $('.feedback', el);
          if (fb) { fb.textContent = 'クリア！'; fb.className = 'feedback ok'; }
        }
      });
    });
  }

  // ---- 選択クイズ：questions = [{q, options:[...], answer: index, explain}] ----
  function quiz(id, questions, { need = questions.length, shuffle = true } = {}) {
    const el = document.querySelector(`[data-task="${id}"]`);
    const box = $('[data-quiz]', el), fb = $('.feedback', el), st = $('.status', el), dots = $('.dots', el);
    const start = $('[data-start]', el);
    let order = [], i = 0, correct = 0, marks = [];
    const drawDots = () => (dots.innerHTML = order.map((_, k) => `<i class="${marks[k] || ''}"></i>`).join(''));
    function ask() {
      const q = questions[order[i]];
      st.textContent = `${i + 1} / ${order.length}`;
      box.innerHTML = `<p class="quiz-q quiz-q-sm">${q.q}</p><div class="btn-row">${q.options.map((op, k) => `<button class="chip" data-k="${k}">${op}</button>`).join('')}</div>`;
      fb.textContent = ''; fb.className = 'feedback';
    }
    box.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-k]');
      if (!b || box.dataset.lock) return;
      box.dataset.lock = '1';
      const q = questions[order[i]], ok = Number(b.dataset.k) === q.answer;
      if (ok) correct++;
      marks[i] = ok ? 'ok' : 'ng';
      drawDots();
      b.classList.add(ok ? 'sel' : 'wrong');
      fb.textContent = `${ok ? '正解！' : `ざんねん。答えは「${q.options[q.answer]}」`} ${q.explain || ''}`;
      fb.className = `feedback ${ok ? 'ok' : 'ng'}`;
      await sleep(ok ? 1400 : 2600);
      delete box.dataset.lock;
      i++;
      if (i < order.length) return ask();
      box.innerHTML = '';
      start.textContent = 'もう一度';
      if (correct >= need) {
        fb.textContent = `クリア！ ${order.length}問中${correct}問正解`; fb.className = 'feedback ok';
        clear(id);
      } else {
        fb.textContent = `${order.length}問中${correct}問。${need}問でクリア。もう一度`; fb.className = 'feedback ng';
      }
    });
    start.addEventListener('click', () => {
      order = questions.map((_, k) => k);
      if (shuffle) order.sort(() => Math.random() - 0.5);
      i = 0; correct = 0; marks = [];
      drawDots();
      ask();
    });
  }

  $('#resetCh')?.addEventListener('click', () => {
    if (!confirm(`${o.title}の記録を消しますか？（控えは残ります）`)) return;
    progress.resetChapter(CH);
    location.reload();
  });

  return { CH, open, clear, isDone, checklist, quiz, renderProgress };
}

// オフラインで使える準備ができているかを、上部バーに出す
export function mountOfflineStatus(bar) {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const pill = document.createElement('span');
  pill.className = 'pill offline';
  pill.textContent = '⏳ オフライン準備中';
  bar.querySelector('.spacer').after(pill);
  const ask = () => navigator.serviceWorker.controller?.postMessage('offline-status');
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.type !== 'offline-status') return;
    const ok = e.data.have >= e.data.total;
    pill.textContent = ok ? '📴 オフラインOK' : `⏳ オフライン準備中 ${e.data.have}/${e.data.total}`;
    pill.classList.toggle('on', ok);
    pill.title = ok ? 'ネットがなくても開けます' : 'ネットにつながったまま、少し待ってください';
    if (!ok) setTimeout(ask, 2000);
  });
  navigator.serviceWorker.ready.then(() => setTimeout(ask, 500));
  navigator.serviceWorker.addEventListener('controllerchange', () => setTimeout(ask, 500));
  if (!navigator.serviceWorker.controller) pill.textContent = '⏳ オフライン準備中（一度読み込み直すと完了）';
}
