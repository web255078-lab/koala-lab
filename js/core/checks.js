// 【要確認】の項目と、その表示。章の本文（data-verify="id" の枠）と「要確認チェック」ページの両方で同じものを使う。
//
// 【要確認】とは：Koala の公式マニュアルに書かれていないため、この教材を作った時点では
// 「本当にそうなっているか」を確かめられなかったこと。推測で書かずに、あなたのスマホで確かめてもらう。
import { read, write } from './store.js';

export const VERIFY = [
  {
    id: 'tabs', ch: '第1章 1-1', title: '3つの画面を切り替える場所',
    unknown: 'SAMPLE・SEQUENCE・PERFORM の3つの画面を、どこを押して（またはどう動かして）切り替えるか。',
    why: '公式マニュアルには「3つの画面がある」ことは書かれていますが、切り替えるボタンの位置は書かれていません。',
    steps: ['Koala を開く', '画面の端（上・下・左・右）に、SAMPLE や SEQUENCE などの文字やアイコンがないか探す', 'なければ、画面を左右にスワイプしてみる', '切り替えられたら、その場所を下で選ぶ'],
    options: ['画面の上にある', '画面の下にある', '画面の横（左右）にある', 'スワイプで切り替える', 'その他（メモに書く）'],
    affects: '第1章の説明を「◯◯を押す」と具体的に書き直します。',
  },
  {
    id: 'menu', ch: '第1章 1-3', title: 'MENU（メニュー）の開き方',
    unknown: '保存や読み込みをする MENU のボタンの場所と、見た目。',
    why: 'マニュアルには「三本線（≡）のアイコンで開く」「最後の画面で MENU を押す」と2通りの書き方があり、スマホでどちらなのか分かりません。',
    steps: ['3つの画面を順に見て、「MENU」の文字か三本線（≡）のマークを探す', '押すとメニュー（SAVE、LOAD、EXPORT などが並ぶ画面）が開くか確かめる'],
    options: ['「MENU」と書いたボタン', '三本線（≡）のマーク', 'その他（メモに書く）'],
    memo: 'あった画面と場所（例：SEQUENCE の右上）',
    affects: '第1章と第7章の「MENU を開く」の説明を具体的にします。',
  },
  {
    id: 'autosave', ch: '第1章 1-3', title: 'Android でも自動で保存されるか',
    unknown: 'Koala を閉じても、作業が自動で残っているか。',
    why: 'マニュアルには「iOS 版は変更のたびに自動保存」とだけあり、Android 版のことは書かれていません。消えると困るので、確かめるまでは自分で SAVE することをすすめています。',
    steps: ['SAVE AS で「テスト」という名前の曲を作る', 'パッドを1つ録音する（何でもよい）', '<strong>SAVE を押さずに</strong>、スマホの「最近使ったアプリ」から Koala を上にはらって完全に閉じる', 'Koala をもう一度開いて、さっき録った音が残っているか見る'],
    options: ['残っていた（自動保存される）', '消えていた（自分で SAVE が必要）', '別の曲が開いた（メモに書く）'],
    affects: '「こまめに SAVE」の注意を残すか、外すかを決めます。',
  },
  {
    id: 'mic', ch: '第2章 2-2', title: 'マイクで録った音が、ちゃんと録れるか',
    unknown: 'あなたのスマホで、パッドの長押し録音がふつうに録れるか。',
    why: 'マニュアルには「一部の Android は、録った音が無音や音割れになることがあり、そのときは設定の Stereo input を入れる」とあります。機種によるので、確かめるしかありません。',
    steps: ['空いているパッドを長押しして「パッ」と声を入れる', 'そのパッドを叩いて聞く', '無音や「ガガガ」と割れるときは、MENU → SETTINGS の中の <strong>Stereo input</strong> を入れて、もう一度録る'],
    options: ['ふつうに録れた', 'Stereo input を入れたら直った', '直らなかった（メモに書く）'],
    affects: '第2章に、機種ごとの対処を書き足すかを決めます。',
  },
  {
    id: 'files', ch: '第2章 2-3', title: '保存した素材（WAV）を、Koala で見つけられるか',
    unknown: 'この教材で⬇保存した WAV ファイルを、Koala の IMPORT AUDIO でどうたどれば見つかるか。',
    why: 'Chrome で保存したファイルは、ふつうはスマホの「Download（ダウンロード）」フォルダに入ります。でも Koala の読み込み画面で、そのフォルダがどう見えるかはマニュアルに書かれていません。設定（GENERAL の Import Audio）で「Koala 自身の画面」か「スマホの標準の選択画面」かを選べる、とだけあります。',
    steps: ['第2章 2-3 の素材キットで、キックを⬇保存する（この教材を<strong>同じスマホの Chrome</strong> で開いて）', 'Koala で MENU → IMPORT AUDIO を開く', '「Download」フォルダを探して、lab-kick.wav が見えるか確かめる', '見えなければ、MENU → SETTINGS の GENERAL にある <strong>Import Audio</strong>（読み込みに使う画面）を「システムの選択画面（system picker）」に変えて、もう一度'],
    options: ['そのまま Download フォルダに見えた', 'Import Audio を system に変えたら見えた', 'ADD LOCATION でフォルダを足したら見えた', '見つからなかった（メモに書く）'],
    memo: 'たどった順番（例：IMPORT AUDIO → 左上のメニュー → Download）',
    affects: '第2章 2-3 の手順を、あなたのスマホでの正しい順番に書き直します。',
  },
  {
    id: 'pitch', ch: '第3章 3-3', title: 'PITCH を下げると、音が長くもなるか',
    unknown: 'パッドの PITCH で高さを変えたとき、音の長さも一緒に変わるか。',
    why: 'マニュアルには PITCH の動かし方はありますが、長さが変わるかは書かれていません（高さだけ変える STRETCH は有料の Samurai の機能）。',
    steps: ['キックなど短い音のパッドを選ぶ', 'PITCH を押したまま指をすべらせて、大きく下げる', '叩いて、元の長さより長く（ゆっくり）なるか聞く', '2回たたいて元に戻す'],
    options: ['長さも変わる（低くすると長い）', '長さは変わらない', 'よく分からない'],
    affects: '第3章の「何が起きたか」を、Koala でも同じと書くか、ブラウザとの違いとして書くかを決めます。',
  },
  {
    id: 'kbd', ch: '第5章 5-1', title: 'KEYBOARD のメニューの場所',
    unknown: 'SEQUENCE の画面のどこに KEYBOARD のメニューがあるか。',
    why: 'マニュアルにはモードの種類（GRID・KEYBOARD・VELOCITY・NOTE REPEAT）は書かれていますが、スマホの画面のどこにメニューがあるかは書かれていません。',
    steps: ['SAMPLE でベースのパッドを選んでから SEQUENCE へ', '「KEYBOARD」と書かれたボタン（または鍵盤のマーク）を探して押す', 'モードの一覧が出たら、その場所を下で選ぶ'],
    options: ['すぐ見つかった', '見つけにくかった（場所をメモに）', '見つからなかった'],
    memo: 'ボタンがあった場所（例：SEQUENCE の右下）',
    affects: '第5章の手順を具体的にします。',
  },
  {
    id: 'root', ch: '第5章 5-2', title: 'スケールの基準の音（ルート）を変えられるか',
    unknown: 'Grid でスケール（Pentatonic など）を選んだとき、どの音から始まるスケールにするかを選べるか。',
    why: 'マニュアルにはスケールの種類の一覧はありますが、基準の音（ルート）の選び方は書かれていません。この教材の素材「ベース（ド）」はドの音なので、ドが基準だと合わせやすくなります。',
    steps: ['KEYBOARD → Grid を選ぶ', 'スケールの一覧を開く', '「C」「D」などの音名や「ROOT」を選ぶ所がないか探す', 'パッドに音名が書いてあれば、いちばん左下のパッドの音名をメモする'],
    options: ['ルートを選ぶ所がある（場所をメモに）', 'パッドに音名が出るだけ', 'ルートは変えられないみたい', 'よく分からない'],
    memo: 'いちばん左下のパッドの音名など',
    affects: '第5章 5-2 で「ドを基準にする」手順を書けるかを決めます。',
  },
  {
    id: 'holdrec', ch: '第2章 2-2', title: '「押している間だけ録る」になっているか（Hold to record）',
    unknown: 'あなたの Koala で、パッドの録音が「長押し」なのか「タップで開始・もう一度タップで停止」なのか。',
    why: '公式マニュアルでは、設定の Hold to record が ON なら長押し、OFF ならタップで開始・停止と書かれていますが、最初にどちらになっているか（初期値）は書かれていません。',
    steps: ['空いているパッドを1回だけタップして、すぐ指を離す', '録音が始まったまま（画面に録音中の表示）なら OFF＝タップ式。もう一度タップして止める', '何も起きなければ、長押しで録れるか試す＝ON', '好みで MENU → SETTINGS の Hold to record を切り替えてもOK'],
    options: ['長押しで録る（ON だった）', 'タップで開始・停止（OFF だった）', 'よく分からない'],
    affects: '第2章の録音の説明を、あなたの設定に合わせて書き分けます。',
  },
  {
    id: 'recbtn', ch: '第4章 4-2', title: 'シーケンスの録音ボタンとメトロノームのボタンの場所',
    unknown: 'SEQUENCE の画面の、録音ボタン・再生ボタン・メトロノームのボタンがどこにあるか。',
    why: '公式マニュアルには「再生と録音のボタンのそばにテンポの表示がある」「メトロノームのボタンで ON／OFF」とありますが、スマホの画面のどこかは書かれていません。',
    steps: ['SEQUENCE の画面を開く', '丸（●）の録音ボタンと、三角（▶）の再生ボタンを探す', 'その近くの、メトロノーム（振り子やカチカチ）のマークを探す'],
    options: ['画面の上の方にまとまっていた', '画面の下の方にまとまっていた', 'ばらばらの場所だった（メモに）'],
    affects: '第4章の手順を具体的にします。',
  },
  {
    id: 'recfile', ch: '第7章 7-1・7-2', title: '録音・書き出したファイルがどこに入るか',
    unknown: 'RECORD SONG で録った曲や、EXPORT で書き出した WAV が、Android のどのフォルダに入るか。',
    why: '公式マニュアルには「保存するか共有するかを選べる」とありますが、Android でどのフォルダに入るのかは書かれていません。Android 版には Koala 専用のフォルダがあり、「ファイル」アプリから見える、とだけあります。',
    steps: ['第7章 7-2 のとおり、ループを1つ EXPORT する', '保存先を選ぶ画面が出たら、その画面の名前やフォルダ名をメモする（出なければ「出なかった」）', 'スマホの「ファイル」アプリで、Download と Koala のフォルダを見て、ファイルがあるか探す', '見つけたファイルをタップして、再生できるか確かめる'],
    options: ['自分で選んだフォルダに入った', '選ぶ画面は出ず、Koala のフォルダに入った', '共有の画面が出た（メモに）', '見つからなかった'],
    memo: 'フォルダの名前、ファイル名の最後（.wav など）',
    affects: '第7章の「保存先」と「再生できたか」の手順を正しく書き直します。',
  },
  {
    id: 'autoplayend', ch: '第7章 7-1', title: 'AUTO-PLAY で、最後のシーケンスのあとどうなるか',
    unknown: 'AUTO-PLAY を入れて流したとき、最後の枠のシーケンスが終わると、最初に戻るのか、止まるのか、空の枠へ進むのか。',
    why: '公式マニュアルには「シーケンスが終わると次の枠へ進む」とだけあり、最後の枠のあとのことは書かれていません。録音をどこで止めるか、余韻をどう残すかに関わります。',
    steps: ['短いシーケンスを2つだけ枠に並べる（ほかの枠は空にする）', 'SEQ SNAP のメニューで AUTO-PLAY にチェックを入れて再生する', '2つ目が終わったあと、どうなるか見る・聞く'],
    options: ['最初の枠に戻ってくり返す', '止まる', '空の枠に進んで無音になる', 'その他（メモに）'],
    affects: '第7章の「録音の終え方」を、あなたの Koala での動きに合わせて書き直します。',
  },
  {
    id: 'split', ch: '進め方', title: 'この教材（Chrome）と Koala を、画面に並べられるか',
    unknown: 'Android の画面分割で、上下（左右）に並べて使えるか。',
    why: 'アプリによっては画面分割に対応していません。並べられると、行ったり来たりしなくて済みます。',
    steps: ['Koala を開いた状態で、「最近使ったアプリ」の画面を出す', 'Koala のアイコンを長押しして「分割画面」などを選ぶ（機種によって名前がちがう）', 'もう片方に Chrome（この教材）を選ぶ'],
    options: ['並べられた', 'Koala が分割画面に対応していなかった', '試していない'],
    affects: '「進め方」に、並べて使う方法を書くか決めます。',
  },
];

const KEY = 'checks';
export const loadChecks = () => read(KEY, {});
const saveChecks = (d) => write(KEY, d);

// 1つの【要確認】の枠を作る。compact=true なら説明を折りたたむ（チェックページ用）
export function renderVerify(el, item, { compact = false } = {}) {
  el.classList.add('verify');
  el.dataset.verifyId = item.id;
  const body = `
    <div class="v-row"><b>分からないこと</b><p>${item.unknown}</p></div>
    <div class="v-row"><b>なぜ分からないか</b><p>${item.why}</p></div>
    <div class="v-row"><b>確かめ方</b><ol>${item.steps.map((s) => `<li>${s}</li>`).join('')}</ol></div>
    <div class="v-row"><b>確かめると</b><p>${item.affects}</p></div>`;
  el.innerHTML = `
    <div class="v-head">【要確認】${item.title}<span class="v-done" hidden>✓ 記録ずみ</span></div>
    ${compact ? `<details><summary>くわしく（何をするか）</summary>${body}</details>` : body}
    <div class="v-row v-ans"><b>結果を記録</b>
      <div class="btn-row">${item.options.map((o, k) => `<button class="chip" data-k="${k}">${o}</button>`).join('')}</div>
      <label class="memo">${item.memo || 'メモ（気づいたこと・画面の文字など）'}<textarea rows="2" data-memo></textarea></label>
      <p class="muted"><small>分からなくても、先に進んでOKです。記録は<a href="${location.pathname.includes('/chapters/') ? '../' : ''}check.html">要確認チェック</a>のページでまとめてコピーできます。</small></p>
    </div>`;
  const sync = () => {
    const d = loadChecks()[item.id] || {};
    el.querySelectorAll('[data-k]').forEach((b) => b.classList.toggle('sel', Number(b.dataset.k) === d.k));
    const ta = el.querySelector('[data-memo]');
    if (document.activeElement !== ta) ta.value = d.memo || '';
    el.querySelector('.v-done').hidden = d.k === undefined;
    el.classList.toggle('done', d.k !== undefined);
  };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]');
    if (!b) return;
    const all = loadChecks();
    all[item.id] = { ...all[item.id], k: Number(b.dataset.k), at: Date.now() };
    saveChecks(all);
    sync();
    window.dispatchEvent(new CustomEvent('koala:checks'));
  });
  el.addEventListener('input', (e) => {
    if (!e.target.matches('[data-memo]')) return;
    const all = loadChecks();
    all[item.id] = { ...all[item.id], memo: e.target.value, at: Date.now() };
    saveChecks(all);
    window.dispatchEvent(new CustomEvent('koala:checks'));
  });
  sync();
  window.addEventListener('koala:checks', sync);
}

// 本文の中の <div data-verify="id"></div> を全部、枠にする
export function mountVerifies(root = document) {
  root.querySelectorAll('[data-verify]').forEach((el) => {
    const item = VERIFY.find((v) => v.id === el.dataset.verify);
    if (item) renderVerify(el, item);
  });
}

// まとめてコピーする文章
export function report({ ver = '' } = {}) {
  const d = loadChecks(), ua = navigator.userAgent;
  const lines = ['# コアラ・ラボ 要確認チェックの結果', `記録日: ${new Date().toLocaleDateString('ja-JP')}`, `端末: ${/Android/.test(ua) ? 'Android' : /iPad|iPhone/.test(ua) ? 'iOS' : 'その他'} / Koala ${ver || d._ver || '（バージョン未記入）'}`, `ブラウザ: ${ua}`, ''];
  VERIFY.forEach((it, i) => {
    const x = d[it.id] || {};
    lines.push(`${i + 1}. [${it.ch}] ${it.title}`, `   → ${x.k !== undefined ? it.options[x.k] : '（未記録）'}${x.memo ? ` ／ メモ: ${x.memo.replace(/\n/g, ' ')}` : ''}`);
  });
  return lines.join('\n');
}
export function setVersion(v) {
  const all = loadChecks();
  all._ver = v;
  saveChecks(all);
}
